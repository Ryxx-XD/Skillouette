import { Section, Subsection, AppSettings } from '../types.js';

export interface CategorizedItem {
  section_id: string;
  section_name: string;
  subsection_id?: string | null;
  subsection_name?: string | null;
  title: string;
  description: string;
  tags: string[];
  date_start?: string;
  date_end?: string;
  metrics?: string;
  role?: string;
  institution?: string;
  links: string[];
  confidence: number;
  is_new_section: boolean;
  suggested_new_section_name?: string | null;
  rationale?: string;
}

export interface CategorizationResult {
  items: CategorizedItem[];
  model_used: string;
  raw_input: string;
}

// Generate the prompt context dynamically with the live schema
export function buildSchemaContext(sections: Section[], subsections: Subsection[]): string {
  const schemaLines: string[] = [];
  sections.forEach(sec => {
    const subs = subsections.filter(sub => sub.section_id === sec.id);
    if (subs.length > 0) {
      schemaLines.push(`- Section: "${sec.name}" (id: "${sec.id}")`);
      subs.forEach(sub => {
        schemaLines.push(`    - Subsection: "${sub.name}" (id: "${sub.id}")`);
      });
    } else {
      schemaLines.push(`- Section: "${sec.name}" (id: "${sec.id}")`);
    }
  });
  return schemaLines.join('\n');
}

export async function categorizeEntry(
  rawText: string,
  sections: Section[],
  subsections: Subsection[],
  settings: AppSettings
): Promise<CategorizationResult> {
  const trimmed = rawText.trim();
  if (!trimmed) {
    return { items: [], model_used: 'none', raw_input: rawText };
  }

  const apiKey = settings.gemini_api_key || process.env.GEMINI_API_KEY || settings.openai_api_key || process.env.OPENAI_API_KEY;
  const provider = settings.llm_provider || (settings.gemini_api_key ? 'gemini' : settings.openai_api_key ? 'openai' : 'local');

  // Attempt API call if key is present
  if (apiKey && (provider === 'gemini' || (provider !== 'openai' && settings.gemini_api_key))) {
    try {
      const result = await callGeminiCategorizer(trimmed, sections, subsections, settings, apiKey);
      if (result && result.items.length > 0) {
        return result;
      }
    } catch (err) {
      console.warn('Gemini API call failed, falling back to heuristic engine:', err);
    }
  } else if (apiKey && provider === 'openai') {
    try {
      const result = await callOpenAICategorizer(trimmed, sections, subsections, settings, apiKey);
      if (result && result.items.length > 0) {
        return result;
      }
    } catch (err) {
      console.warn('OpenAI API call failed, falling back to heuristic engine:', err);
    }
  }

  // Robust Heuristic Engine
  return runHeuristicCategorizer(trimmed, sections, subsections);
}

async function callGeminiCategorizer(
  rawText: string,
  sections: Section[],
  subsections: Subsection[],
  settings: AppSettings,
  apiKey: string
): Promise<CategorizationResult> {
  const schemaContext = buildSchemaContext(sections, subsections);
  const model = settings.model_name || 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const systemInstruction = `You are an expert AI resume classifier and parsing engine for an engineering CV builder.
Analyze the user's raw career brain dump. The user may input one bullet, a paragraph, or multiple distinct achievements in a single dump.

Your task:
1. Split the dump into individual structured CV items if multiple achievements/facts are mentioned.
2. Categorize each item into the best matching Section and Subsection from the CURRENT LIVE SCHEMA:
${schemaContext}

3. If an item clearly does not fit any existing section (e.g. Publications, Patents, Speaking Engagements, Open Source Contributions), set is_new_section to true and suggest a clean section name in suggested_new_section_name. Otherwise, set is_new_section to false.
4. Extract title, concise description, quantified metrics (e.g. percentages, speedup, time saved, dollar amounts), relevant technical tags, dates/date range, role, institution, and links.
5. Provide a confidence score (0.0 to 1.0). If you are unsure or inferring aggressively, set confidence < 0.70 so the user is prompted to verify.
6. Return strictly a JSON array of items conforming to this schema.`;

  const payload = {
    contents: [
      {
        role: 'user',
        parts: [{ text: `System context:\n${systemInstruction}\n\nUser raw dump:\n"""${rawText}"""` }]
      }
    ],
    generationConfig: {
      temperature: settings.temperature ?? 0.1,
      responseMimeType: 'application/json'
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  const json = await response.json();
  const textOutput = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textOutput) throw new Error('Empty response from Gemini');

  const parsed = JSON.parse(textOutput);
  const rawItems: any[] = Array.isArray(parsed) ? parsed : (parsed.items || [parsed]);

  const items: CategorizedItem[] = rawItems.map(item => normalizeCategorizedItem(item, sections, subsections));

  return {
    items,
    model_used: `gemini:${model}`,
    raw_input: rawText
  };
}

async function callOpenAICategorizer(
  rawText: string,
  sections: Section[],
  subsections: Subsection[],
  settings: AppSettings,
  apiKey: string
): Promise<CategorizationResult> {
  const schemaContext = buildSchemaContext(sections, subsections);
  const model = settings.model_name.startsWith('gpt') ? settings.model_name : 'gpt-4o-mini';
  const url = 'https://api.openai.com/v1/chat/completions';

  const systemMessage = `You are an expert AI resume classifier and parsing engine for an engineering CV builder.
Current Live Schema:
${schemaContext}

Instructions:
1. Split multi-part input into discrete items.
2. File under correct section and subsection from schema.
3. If completely novel (e.g., Patents, Publications), set is_new_section: true and suggest a name.
4. Extract title, description, tags, metrics, dates, role, links, and confidence (0.0-1.0).
Output JSON with key "items": [{ section_id, section_name, subsection_id, subsection_name, title, description, tags, date_start, date_end, metrics, role, institution, links, confidence, is_new_section, suggested_new_section_name }].`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature: settings.temperature ?? 0.1,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: rawText }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
  }

  const json = await response.json();
  const content = json.choices?.[0]?.message?.content;
  const parsed = JSON.parse(content);
  const rawItems = parsed.items || (Array.isArray(parsed) ? parsed : [parsed]);

  const items: CategorizedItem[] = rawItems.map((item: any) => normalizeCategorizedItem(item, sections, subsections));

  return {
    items,
    model_used: `openai:${model}`,
    raw_input: rawText
  };
}

function normalizeCategorizedItem(
  raw: any,
  sections: Section[],
  subsections: Subsection[]
): CategorizedItem {
  // Verify section_id
  let sec = sections.find(s => s.id === raw.section_id || s.name.toLowerCase() === (raw.section_name || '').toLowerCase());
  let sub = subsections.find(s => s.id === raw.subsection_id || s.name.toLowerCase() === (raw.subsection_name || '').toLowerCase());

  let isNew = Boolean(raw.is_new_section);
  let suggestedName = raw.suggested_new_section_name || null;

  if (!sec && !isNew) {
    // Attempt best guess or mark new
    sec = sections[0];
  }

  return {
    section_id: sec ? sec.id : (isNew ? 'sec_new_pending' : sections[0]?.id || 'sec_proj'),
    section_name: sec ? sec.name : (suggestedName || 'New Section'),
    subsection_id: sub ? sub.id : null,
    subsection_name: sub ? sub.name : null,
    title: raw.title || 'Untitled Achievement',
    description: raw.description || raw.text || '',
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    date_start: raw.date_start || raw.date_range?.split('-')[0]?.trim() || '',
    date_end: raw.date_end || raw.date_range?.split('-')[1]?.trim() || '',
    metrics: raw.metrics || undefined,
    role: raw.role || undefined,
    institution: raw.institution || undefined,
    links: Array.isArray(raw.links) ? raw.links : (raw.link ? [raw.link] : []),
    confidence: typeof raw.confidence === 'number' ? Math.min(1, Math.max(0, raw.confidence)) : 0.85,
    is_new_section: isNew,
    suggested_new_section_name: suggestedName,
    rationale: raw.rationale
  };
}

// Highly capable heuristic fallback engine
export function runHeuristicCategorizer(
  rawText: string,
  sections: Section[],
  subsections: Subsection[]
): CategorizationResult {
  // Step 1: Split compound input (bullets, newlines, or sentence connectors like "Also won", "Additionally,")
  const rawSegments = splitCompoundDump(rawText);

  const items: CategorizedItem[] = rawSegments.map(segment => {
    return parseSingleSegment(segment, sections, subsections);
  });

  return {
    items,
    model_used: 'local:heuristic-classifier',
    raw_input: rawText
  };
}

function splitCompoundDump(text: string): string[] {
  // Normalize newlines
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  
  if (lines.length > 1) {
    return lines.map(line => line.replace(/^[-*•\d+.]\s*/, '').trim()).filter(l => l.length > 0);
  }

  // Single line: check for clear sentence boundary connectors like ". Also ", ". Additionally, ", "; and "
  const sentenceSplits = text.split(/(?<=[.!?])\s+(?=(?:Also|Additionally|Furthermore|In addition|And won|Won|Built|Designed|Completed)\b)/i);
  if (sentenceSplits.length > 1) {
    return sentenceSplits.map(s => s.trim()).filter(s => s.length > 0);
  }

  return [text];
}

function parseSingleSegment(
  text: string,
  sections: Section[],
  subsections: Subsection[]
): CategorizedItem {
  const lower = text.toLowerCase();

  // Check for novel category indicators (e.g. publications, patents, conference talks)
  if (/\b(patent|patented|provisional patent|patent pending)\b/i.test(text)) {
    return {
      section_id: 'sec_new_pending',
      section_name: 'Patents & Intellectual Property',
      title: extractTitle(text, 'Patent Application'),
      description: text,
      tags: extractTags(text, ['Hardware', 'Robotics', 'Patent']),
      confidence: 0.92,
      is_new_section: true,
      suggested_new_section_name: 'Patents & Intellectual Property',
      links: extractUrls(text),
      metrics: extractMetrics(text),
      rationale: 'Identified patent keywords not matching existing resume sections.'
    };
  }

  if (/\b(published|paper|ieee|arxiv|journal|proceedings|co-authored|peer-reviewed)\b/i.test(text)) {
    return {
      section_id: 'sec_new_pending',
      section_name: 'Publications & Research Papers',
      title: extractTitle(text, 'Research Publication'),
      description: text,
      tags: extractTags(text, ['Research', 'IEEE', 'Autonomous Systems']),
      confidence: 0.90,
      is_new_section: true,
      suggested_new_section_name: 'Publications & Research Papers',
      links: extractUrls(text),
      metrics: extractMetrics(text),
      rationale: 'Identified academic publication keywords.'
    };
  }

  if (/\b(keynote|speaker|conference talk|panelist|presented at)\b/i.test(text)) {
    return {
      section_id: 'sec_new_pending',
      section_name: 'Conference Talks & Presentations',
      title: extractTitle(text, 'Conference Presentation'),
      description: text,
      tags: extractTags(text, ['Public Speaking', 'Conference', 'Robotics']),
      confidence: 0.88,
      is_new_section: true,
      suggested_new_section_name: 'Conference Talks & Presentations',
      links: extractUrls(text),
      rationale: 'Identified speaking engagement details.'
    };
  }

  // Section routing rules
  const awardsSec = sections.find(s => /award|achievement|honor/i.test(s.name));
  const certsSec = sections.find(s => /cert|training/i.test(s.name));
  const leadSec = sections.find(s => /leadership|mentor|service|volunteer/i.test(s.name));
  const skillsSec = sections.find(s => /skill/i.test(s.name));
  const projSec = sections.find(s => /project/i.test(s.name));
  const expSec = sections.find(s => /experience/i.test(s.name));
  const eduSec = sections.find(s => /education/i.test(s.name));

  // 1. Awards / Competitions
  if (/\b(won|1st place|2nd place|3rd place|champion|award|hackathon|scholar|scholarship|dean's list|honor|prize)\b/i.test(lower)) {
    const title = extractTitle(text, 'Award / Competition Achievement');
    return {
      section_id: awardsSec?.id || 'sec_awards',
      section_name: awardsSec?.name || 'Awards & Achievements',
      title,
      description: text,
      tags: extractTags(text, ['Competition', 'Hackathon', 'Award']),
      date_start: extractDate(text),
      metrics: extractMetrics(text),
      links: extractUrls(text),
      confidence: 0.95,
      is_new_section: false
    };
  }

  // 2. Certifications & Training
  if (/\b(certified|certification|completed course|credential|licensed|ipc-a-|coursera|edx)\b/i.test(lower)) {
    return {
      section_id: certsSec?.id || 'sec_cert',
      section_name: certsSec?.name || 'Certifications and Training',
      title: extractTitle(text, 'Professional Certification'),
      description: text,
      tags: extractTags(text, ['Certification', 'Training']),
      date_start: extractDate(text),
      links: extractUrls(text),
      confidence: 0.92,
      is_new_section: false
    };
  }

  // 3. Leadership & Mentorship
  if (/\b(president|founded|lead|mentor|mentored|organized|workshop|volunteered|outreach|officer|chair)\b/i.test(lower) && !/\b(built|engineered|pcb|firmware|thruster)\b/i.test(lower)) {
    return {
      section_id: leadSec?.id || 'sec_lead',
      section_name: leadSec?.name || 'Leadership, Mentorship & Service',
      title: extractTitle(text, 'Leadership & Outreach Activity'),
      description: text,
      tags: extractTags(text, ['Leadership', 'Mentorship', 'Community']),
      date_start: extractDate(text),
      metrics: extractMetrics(text),
      links: extractUrls(text),
      confidence: 0.88,
      is_new_section: false
    };
  }

  // 4. Education
  if (/\b(bachelor|degree|gpa|university|coursework|graduated|diploma|bs in|college)\b/i.test(lower)) {
    return {
      section_id: eduSec?.id || 'sec_edu',
      section_name: eduSec?.name || 'Education',
      title: extractTitle(text, 'Degree / Academic Program'),
      description: text,
      tags: extractTags(text, ['Robotics', 'Degree', 'Academics']),
      date_start: extractDate(text),
      metrics: extractMetrics(text),
      links: [],
      confidence: 0.92,
      is_new_section: false
    };
  }

  // 5. Technical Skills - Check dynamic subcategories
  if (skillsSec) {
    const subs = subsections.filter(s => s.section_id === skillsSec.id);
    // Skill subcategory matching
    for (const sub of subs) {
      const subLower = sub.name.toLowerCase();
      if (
        (subLower.includes('embedded') && /\b(stm32|esp32|freertos|arm cortex|can bus|lora|i2c|spi|uart|mcu|microcontroller|firmware)\b/i.test(lower)) ||
        (subLower.includes('pcb') && /\b(kicad|altium|schematic|gerber|soldering|smd|4-layer|buck converter|power supply)\b/i.test(lower)) ||
        (subLower.includes('ai') && /\b(pytorch|tensorflow|opencv|yolo|tinyml|sensor fusion|ekf|deep learning)\b/i.test(lower)) ||
        (subLower.includes('robotics') && /\b(ros|ros2|gazebo|moveit|kinematics|gnc|slam|nav2)\b/i.test(lower)) ||
        (subLower.includes('language') && /\b(c\+\+|python|rust|c\b|matlab|simulink|typescript|javascript)\b/i.test(lower)) ||
        (subLower.includes('tool') && /\b(linux|docker|git|solidworks|cad|3d printing|fusion 360)\b/i.test(lower))
      ) {
        // Only classify as pure skill if it reads like a skill list rather than a full project description
        if (text.split(' ').length < 15 || /^(proficient in|experienced with|skills:|tools:|proficiencies:)/i.test(text)) {
          return {
            section_id: skillsSec.id,
            section_name: skillsSec.name,
            subsection_id: sub.id,
            subsection_name: sub.name,
            title: sub.name,
            description: text.replace(/^(proficient in|experienced with|skills:|tools:)\s*/i, ''),
            tags: extractTags(text, [sub.name]),
            links: [],
            confidence: 0.89,
            is_new_section: false
          };
        }
      }
    }
  }

  // 6. Featured Projects vs Applied Experience
  const isExperience = /\b(intern|internship|job|employed|lab assistant|company|contractor|work experience)\b/i.test(lower);
  const targetSec = isExperience ? (expSec || projSec || sections[0]) : (projSec || expSec || sections[0]);
  
  const extractedMetrics = extractMetrics(text);
  const extractedUrls = extractUrls(text);
  const extractedTagsList = extractTags(text, ['Robotics', 'Embedded Systems', 'Autonomous']);
  const title = extractTitle(text, isExperience ? 'Engineering Role' : 'Robotics Project');

  return {
    section_id: targetSec.id,
    section_name: targetSec.name,
    title,
    description: text,
    role: isExperience ? 'Systems Developer' : 'Lead Hardware & Firmware Engineer',
    institution: isExperience ? 'Autonomous Engineering Lab' : 'Independent Project',
    tags: extractedTagsList,
    date_start: extractDate(text),
    metrics: extractedMetrics,
    links: extractedUrls,
    confidence: text.length > 30 ? 0.91 : 0.68, // flag low confidence if very short
    is_new_section: false
  };
}

function extractTitle(text: string, fallback: string): string {
  // If text starts with "Project: ...", "Built ...", "Designed ..."
  const match = text.match(/^(?:project|title|award|won|built|designed|developed|engineered|implemented|created)?[:\s-]*([^,.:;\n]{8,60})/i);
  if (match && match[1]) {
    const candidate = match[1].trim();
    // Capitalize first letter
    return candidate.charAt(0).toUpperCase() + candidate.slice(1);
  }
  return fallback;
}

function extractMetrics(text: string): string | undefined {
  const metricPatterns = [
    /\b\d+(\.\d+)?%\b/g,
    /\b\d+\+?\s*(?:fps|hz|ms|days|hours|mw|v|ghz|mhz|hectares|km)\b/gi,
    /\b(?:reduced|improved|increased|achieved|cut|saved)\s+[^,.;\n]{3,35}\b/gi,
    /\b\$\d+[\d,]*\b/g
  ];

  const found: string[] = [];
  metricPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(m => {
        if (!found.includes(m)) found.push(m);
      });
    }
  });

  return found.length > 0 ? found.slice(0, 2).join(' • ') : undefined;
}

function extractDate(text: string): string | undefined {
  const dateMatch = text.match(/\b(202[0-9]|201[5-9]|jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/i);
  return dateMatch ? dateMatch[0] : undefined;
}

function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+|github\.com\/[^\s]+)/gi;
  const matches = text.match(urlRegex) || [];
  return matches.map(u => u.startsWith('http') ? u : `https://${u}`);
}

function extractTags(text: string, defaultTags: string[]): string[] {
  const keywords = [
    'STM32', 'ESP32', 'FreeRTOS', 'LoRa', 'LoRaWAN', 'CAN bus', 'ROS2', 'ROS', 'Gazebo',
    'PyTorch', 'OpenCV', 'YOLO', 'TinyML', 'KiCad', 'Altium', 'Sensor Fusion', 'EKF',
    'C++', 'Python', 'Rust', 'Linux', 'Docker', 'SolidWorks', '3D Printing', 'Hardware',
    'Firmware', 'Aquaculture', 'Biomedical', 'Jetson Orin', 'Computer Vision'
  ];

  const tags = new Set<string>(defaultTags);
  const lower = text.toLowerCase();
  keywords.forEach(kw => {
    if (lower.includes(kw.toLowerCase())) {
      tags.add(kw);
    }
  });

  return Array.from(tags).slice(0, 6);
}
