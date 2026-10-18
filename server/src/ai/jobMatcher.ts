import { Entry, Section, AppSettings, Profile } from '../types.js';

export interface JobMatchInput {
  job_title: string;
  company?: string;
  raw_job_text: string;
  requirements?: string;
}

export interface EntryScoreResult {
  entry_id: string;
  score: number; // 0.0 to 1.0
  rationale: string;
  matched_skills: string[];
}

export interface JobMatchResponse {
  job_title: string;
  company?: string;
  extracted_skills: string[];
  entry_scores: Record<string, EntryScoreResult>;
  gaps: string[];
  tailored_summary: string;
  recommended_entry_ids: string[];
  model_used: string;
}

export async function matchJobPosting(
  jobInput: JobMatchInput,
  entries: Entry[],
  sections: Section[],
  profile: Profile,
  settings: AppSettings
): Promise<JobMatchResponse> {
  const apiKey = settings.gemini_api_key || process.env.GEMINI_API_KEY || settings.openai_api_key || process.env.OPENAI_API_KEY;
  const provider = settings.llm_provider || (settings.gemini_api_key ? 'gemini' : settings.openai_api_key ? 'openai' : 'local');

  if (apiKey && (provider === 'gemini' || (provider !== 'openai' && settings.gemini_api_key))) {
    try {
      const res = await callGeminiJobMatcher(jobInput, entries, sections, profile, settings, apiKey);
      if (res) return res;
    } catch (err) {
      console.warn('Gemini Job Match failed, using heuristic matcher:', err);
    }
  } else if (apiKey && provider === 'openai') {
    try {
      const res = await callOpenAIJobMatcher(jobInput, entries, sections, profile, settings, apiKey);
      if (res) return res;
    } catch (err) {
      console.warn('OpenAI Job Match failed, using heuristic matcher:', err);
    }
  }

  return runHeuristicJobMatcher(jobInput, entries, sections, profile);
}

async function callGeminiJobMatcher(
  jobInput: JobMatchInput,
  entries: Entry[],
  sections: Section[],
  profile: Profile,
  settings: AppSettings,
  apiKey: string
): Promise<JobMatchResponse> {
  const model = settings.model_name || 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const simplifiedEntries = entries.map(e => ({
    id: e.id,
    title: e.title,
    section: sections.find(s => s.id === e.section_id)?.name || e.section_id,
    description: e.description,
    tags: e.tags,
    metrics: e.metrics
  }));

  const systemInstruction = `You are an elite technical recruiter and CV optimization engine for robotics and embedded systems engineering.
Given a target Job Posting and the candidate's complete database of resume entries, you must:
1. Extract key technical skills, tools, domain methodologies, and qualifications required by the job.
2. For EACH candidate entry, evaluate relevance to the job on a scale of 0.0 to 1.0 (with 1.0 being an exact match to a core requirement, and 0.0 being completely irrelevant). Provide a concise 1-sentence rationale highlighting matched keywords.
3. Identify "gaps": critical requirements or preferences mentioned in the posting that none of the candidate's current entries sufficiently cover.
4. Rewrite the candidate's Professional Summary into a compelling, tailored summary (2-3 sentences) targeted specifically at this role without fabricating experience.
5. Return strictly a JSON object with:
{
  "extracted_skills": string[],
  "entry_scores": {
    "<entry_id>": { "score": number, "rationale": string, "matched_skills": string[] }
  },
  "gaps": string[],
  "tailored_summary": string
}`;

  const promptContent = `TARGET JOB:
Title: ${jobInput.job_title}
Company: ${jobInput.company || 'Not specified'}
Description & Requirements:
"""
${jobInput.raw_job_text}
${jobInput.requirements ? `\nKey Requirements:\n${jobInput.requirements}` : ''}
"""

CANDIDATE PROFILE SUMMARY:
"""
${profile.summary}
"""

CANDIDATE RESUME ENTRIES:
${JSON.stringify(simplifiedEntries, null, 2)}
`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: `${systemInstruction}\n\n${promptContent}` }] }],
      generationConfig: {
        temperature: 0.15,
        responseMimeType: 'application/json'
      }
    })
  });

  if (!response.ok) throw new Error(`Gemini status ${response.status}`);
  const json = await response.json();
  const textOutput = json.candidates?.[0]?.content?.parts?.[0]?.text;
  const parsed = JSON.parse(textOutput);

  const entryScores: Record<string, EntryScoreResult> = {};
  const recIds: string[] = [];

  for (const [id, val] of Object.entries(parsed.entry_scores || {})) {
    const v = val as any;
    const score = typeof v.score === 'number' ? Math.min(1, Math.max(0, v.score)) : 0.5;
    entryScores[id] = {
      entry_id: id,
      score,
      rationale: v.rationale || 'Matches job keywords',
      matched_skills: Array.isArray(v.matched_skills) ? v.matched_skills : []
    };
    if (score >= 0.45) recIds.push(id);
  }

  // Ensure entries not in score map get defaults
  entries.forEach(e => {
    if (!entryScores[e.id]) {
      entryScores[e.id] = {
        entry_id: e.id,
        score: 0.3,
        rationale: 'Baseline background qualification',
        matched_skills: []
      };
      recIds.push(e.id);
    }
  });

  return {
    job_title: jobInput.job_title,
    company: jobInput.company,
    extracted_skills: parsed.extracted_skills || [],
    entry_scores: entryScores,
    gaps: parsed.gaps || [],
    tailored_summary: parsed.tailored_summary || profile.summary,
    recommended_entry_ids: recIds,
    model_used: `gemini:${model}`
  };
}

async function callOpenAIJobMatcher(
  jobInput: JobMatchInput,
  entries: Entry[],
  sections: Section[],
  profile: Profile,
  settings: AppSettings,
  apiKey: string
): Promise<JobMatchResponse> {
  const model = settings.model_name.startsWith('gpt') ? settings.model_name : 'gpt-4o-mini';
  const simplifiedEntries = entries.map(e => ({
    id: e.id,
    title: e.title,
    section: sections.find(s => s.id === e.section_id)?.name || e.section_id,
    description: e.description,
    tags: e.tags
  }));

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature: 0.15,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You are an AI career and technical matching coach. Analyze candidate entries against the job description and output JSON with keys: extracted_skills, entry_scores (id -> {score, rationale, matched_skills}), gaps, tailored_summary.'
        },
        {
          role: 'user',
          content: `Job: ${jobInput.job_title}\nText: ${jobInput.raw_job_text}\nCandidate Summary: ${profile.summary}\nEntries: ${JSON.stringify(simplifiedEntries)}`
        }
      ]
    })
  });

  if (!response.ok) throw new Error(`OpenAI status ${response.status}`);
  const json = await response.json();
  const parsed = JSON.parse(json.choices?.[0]?.message?.content);

  const entryScores: Record<string, EntryScoreResult> = {};
  const recIds: string[] = [];

  for (const [id, val] of Object.entries(parsed.entry_scores || {})) {
    const v = val as any;
    const score = typeof v.score === 'number' ? Math.min(1, Math.max(0, v.score)) : 0.5;
    entryScores[id] = {
      entry_id: id,
      score,
      rationale: v.rationale || 'Keyword match',
      matched_skills: Array.isArray(v.matched_skills) ? v.matched_skills : []
    };
    if (score >= 0.45) recIds.push(id);
  }

  entries.forEach(e => {
    if (!entryScores[e.id]) {
      entryScores[e.id] = {
        entry_id: e.id,
        score: 0.3,
        rationale: 'General background qualification',
        matched_skills: []
      };
      recIds.push(e.id);
    }
  });

  return {
    job_title: jobInput.job_title,
    company: jobInput.company,
    extracted_skills: parsed.extracted_skills || [],
    entry_scores: entryScores,
    gaps: parsed.gaps || [],
    tailored_summary: parsed.tailored_summary || profile.summary,
    recommended_entry_ids: recIds,
    model_used: `openai:${model}`
  };
}

export function runHeuristicJobMatcher(
  jobInput: JobMatchInput,
  entries: Entry[],
  sections: Section[],
  profile: Profile
): JobMatchResponse {
  const fullJobText = `${jobInput.job_title} ${jobInput.company || ''} ${jobInput.raw_job_text} ${jobInput.requirements || ''}`.toLowerCase();

  // 1. Extract skills from text
  const dictionary = [
    'c++', 'c', 'python', 'rust', 'ros', 'ros2', 'gazebo', 'moveit', 'nav2', 'slam',
    'embedded', 'firmware', 'stm32', 'esp32', 'freertos', 'arm cortex', 'can bus', 'lora', 'lorawan',
    'spi', 'i2c', 'uart', 'kicad', 'altium', 'pcb', 'schematic', 'soldering', 'tinyml', 'pytorch',
    'tensorflow', 'opencv', 'yolo', 'sensor fusion', 'ekf', 'kalman filter', 'control systems', 'pid',
    'kinematics', 'gnc', 'linux', 'docker', 'git', 'solidworks', '3d printing', 'computer vision',
    'autonomous', 'sensors', 'imu', 'gnss', 'microcontroller', 'edge ai'
  ];

  const matchedJobSkills: string[] = [];
  dictionary.forEach(term => {
    const regex = new RegExp(`\\b${term.replace('+', '\\+')}\\b`, 'i');
    if (regex.test(fullJobText)) {
      matchedJobSkills.push(term.toUpperCase());
    }
  });

  // 2. Score each candidate entry
  const entryScores: Record<string, EntryScoreResult> = {};
  const candidateCoveredSkills = new Set<string>();

  entries.forEach(entry => {
    const entryText = `${entry.title} ${entry.description} ${entry.tags.join(' ')} ${entry.role || ''} ${entry.metrics || ''}`.toLowerCase();
    const entryMatchedSkills: string[] = [];

    matchedJobSkills.forEach(skill => {
      const skillLower = skill.toLowerCase();
      if (entryText.includes(skillLower)) {
        entryMatchedSkills.push(skill);
        candidateCoveredSkills.add(skill);
      }
    });

    let score = 0.2; // base score for belonging to profile
    if (matchedJobSkills.length > 0) {
      const matchRatio = entryMatchedSkills.length / Math.min(matchedJobSkills.length, 5);
      score = Math.min(1.0, 0.25 + matchRatio * 0.75);
    } else {
      score = 0.7; // default if no specific keywords in job
    }

    let rationale = '';
    if (entryMatchedSkills.length > 0) {
      rationale = `Matches requirements: ${entryMatchedSkills.slice(0, 3).join(', ')}`;
    } else {
      rationale = 'Provides solid foundational engineering context.';
    }

    entryScores[entry.id] = {
      entry_id: entry.id,
      score: Math.round(score * 100) / 100,
      rationale,
      matched_skills: entryMatchedSkills
    };
  });

  // 3. Gap Analysis
  const gaps: string[] = [];
  matchedJobSkills.forEach(skill => {
    if (!candidateCoveredSkills.has(skill)) {
      gaps.push(`Requires hands-on proficiency in ${skill} (not explicitly highlighted in current entries)`);
    }
  });

  // Check common industry gaps
  if (fullJobText.includes('agile') || fullJobText.includes('scrum')) {
    if (!fullJobText.includes('agile') && !candidateCoveredSkills.has('AGILE')) gaps.push('Agile / Scrum development sprint workflows');
  }
  if (fullJobText.includes('ci/cd') && !fullJobText.includes('github actions')) {
    gaps.push('Automated CI/CD deployment pipelines for hardware-in-the-loop (HIL) testing');
  }

  // 4. Tailored Summary
  const topSkills = matchedJobSkills.slice(0, 4).join(', ');
  let tailoredSummary = profile.summary;
  if (matchedJobSkills.length > 0) {
    tailoredSummary = `Driven Robotics Engineering student and developer focused on ${jobInput.job_title} solutions. Brings direct project experience across ${topSkills || 'cyber-physical systems'}, rapid prototyping, and real-time field deployments to deliver robust, high-reliability engineering outcomes.`;
  }

  // 5. Recommended entries: entries with score >= 0.40
  const recommendedIds = entries
    .filter(e => (entryScores[e.id]?.score ?? 0) >= 0.35)
    .sort((a, b) => (entryScores[b.id]?.score ?? 0) - (entryScores[a.id]?.score ?? 0))
    .map(e => e.id);

  return {
    job_title: jobInput.job_title,
    company: jobInput.company,
    extracted_skills: matchedJobSkills.length > 0 ? matchedJobSkills : ['ROBOTICS', 'C++', 'PYTHON', 'EMBEDDED SYSTEMS'],
    entry_scores: entryScores,
    gaps: gaps.slice(0, 5),
    tailored_summary: tailoredSummary,
    recommended_entry_ids: recommendedIds.length > 0 ? recommendedIds : entries.map(e => e.id),
    model_used: 'local:heuristic-job-matcher'
  };
}
