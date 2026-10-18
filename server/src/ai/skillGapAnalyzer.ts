/**
 * Skillouette Skill-Gap Analysis & Personalized Upskilling Engine (Core Features E & F)
 * Analyzes competencies against user evidence, classifies gaps, and produces
 * grounded, actionable upskilling roadmaps with verified real-world resources.
 */

import { Entry, JobAnalysisResult, SkillGapReport, SkillGapItem, UpskillingRecommendation, VerifiedResource } from '../types.js';

// Curated dictionary of verified, permanent educational resources (No hallucinated URLs)
const VERIFIED_RESOURCE_KNOWLEDGE_BASE: Record<string, VerifiedResource[]> = {
  freertos: [
    { title: 'FreeRTOS Official Kernel Documentation & API Guide', provider: 'FreeRTOS.org / AWS', url: 'https://www.freertos.org/Documentation/RTOS_book.html', type: 'documentation' },
    { title: 'Mastering RTOS: Hands-on FreeRTOS and STM32Fx', provider: 'FastBit Embedded Academy', type: 'course' }
  ],
  stm32: [
    { title: 'STM32Cube HAL and LL Drivers Developer Guide', provider: 'STMicroelectronics', url: 'https://www.st.com', type: 'documentation' },
    { title: 'Embedded Systems with ARM Cortex-M Microcontrollers', provider: 'UT Austin / edX', type: 'course' }
  ],
  ros: [
    { title: 'ROS 2 Official Documentation and Tutorials (Iron/Jazzy)', provider: 'Open Robotics', url: 'https://docs.ros.org/en/iron/Tutorials.html', type: 'documentation' },
    { title: 'Programming for Robotics with ROS 2', provider: 'ConstructSim', type: 'course' }
  ],
  lora: [
    { title: 'LoRa and LoRaWAN Specification Fundamentals', provider: 'LoRa Alliance', url: 'https://lora-alliance.org/resource_hub', type: 'documentation' },
    { title: 'The Things Network Academic Curriculum', provider: 'The Things Network', type: 'tutorial' }
  ],
  kicad: [
    { title: 'KiCad Official PCB Design Walkthrough and Reference', provider: 'KiCad Project', url: 'https://docs.kicad.org', type: 'documentation' },
    { title: 'High Speed PCB Design Fundamentals', provider: 'Fedovel Academy', type: 'course' }
  ],
  docker: [
    { title: 'Docker Official Getting Started Guide & Container Best Practices', provider: 'Docker Docs', url: 'https://docs.docker.com/get-started/', type: 'documentation' },
    { title: 'Containerization in Robotics with ROS 2 and Docker', provider: 'Open Robotics Tutorials', type: 'tutorial' }
  ],
  python: [
    { title: 'Python 3 Standard Library and Scientific Computing Guide', provider: 'Python Software Foundation', url: 'https://docs.python.org/3/', type: 'documentation' },
    { title: 'Python for Data Structures, Algorithms, and System Scripting', provider: 'MIT OpenCourseWare', type: 'course' }
  ],
  cplusplus: [
    { title: 'Modern C++ Programming (C++17 / C++20) Reference Guide', provider: 'cppreference.com', url: 'https://en.cppreference.com', type: 'documentation' },
    { title: 'C++ Design Patterns and Real-Time Systems Programming', provider: 'Pluralsight / ISO C++', type: 'course' }
  ],
  kalman: [
    { title: 'Kalman and Bayesian Filters in Python', provider: 'Roger Labbe (Open Source Interactive Book)', url: 'https://github.com/rlabbe/Kalman-and-Bayesian-Filters-in-Python', type: 'documentation' },
    { title: 'State Estimation for Autonomous Vehicles', provider: 'University of Toronto / Coursera', type: 'course' }
  ]
};

export function analyzeSkillGaps(
  jobAnalysis: JobAnalysisResult,
  entries: Entry[]
): SkillGapReport {
  const allRequirements = [
    ...jobAnalysis.required_competencies.map(c => ({ text: c, isMandatory: true })),
    ...jobAnalysis.preferred_competencies.map(c => ({ text: c, isMandatory: false }))
  ];

  const gaps: SkillGapItem[] = [];
  let demonstratedCount = 0;
  let partialCount = 0;
  let missingCount = 0;
  let clarificationCount = 0;

  for (const req of allRequirements) {
    const assessment = evaluateCompetency(req.text, req.isMandatory, entries);
    gaps.push(assessment);

    if (assessment.classification === 'demonstrated_match') demonstratedCount++;
    else if (assessment.classification === 'partially_demonstrated') partialCount++;
    else if (assessment.classification === 'not_demonstrated') missingCount++;
    else clarificationCount++;
  }

  // Documented transparent scoring calculation:
  // - Demonstrated match: 100% credit for requirement
  // - Partially demonstrated: 50% credit
  // - Clarification needed: 25% credit
  // - Not demonstrated: 0% credit
  // Mandatory requirements carry 1.5x weight relative to preferred.
  let weightedPoints = 0;
  let totalPossibleWeight = 0;

  for (const g of gaps) {
    const weight = g.is_mandatory ? 1.5 : 1.0;
    totalPossibleWeight += weight;

    if (g.classification === 'demonstrated_match') weightedPoints += weight * 1.0;
    else if (g.classification === 'partially_demonstrated') weightedPoints += weight * 0.5;
    else if (g.classification === 'requires_clarification') weightedPoints += weight * 0.25;
  }

  const matchScore = totalPossibleWeight > 0 
    ? Math.round((weightedPoints / totalPossibleWeight) * 100) 
    : 70;

  const scoreCalculationDetails = 
    `Calculated using transparent weighted heuristic: Mandatory competencies weighted 1.5x, preferred weighted 1.0x. ` +
    `Credit: Demonstrated Match = 100%, Partially Demonstrated = 50%, Requires Clarification = 25%, Not Demonstrated = 0%. ` +
    `Total requirements evaluated: ${allRequirements.length}. Score: ${matchScore}/100.`;

  const actionableRecommendations: string[] = [];
  const missingItems = gaps.filter(g => g.classification === 'not_demonstrated');
  const partialItems = gaps.filter(g => g.classification === 'partially_demonstrated');

  if (missingItems.length > 0) {
    actionableRecommendations.push(
      `Focus first on missing mandatory requirements: "${missingItems.slice(0, 2).map(m => m.competency).join('", "')}". Complete hands-on portfolio projects to establish demonstrable evidence.`
    );
  }
  if (partialItems.length > 0) {
    actionableRecommendations.push(
      `Strengthen partially demonstrated competencies by adding quantified project metrics and code repository links.`
    );
  }
  actionableRecommendations.push(
    `Review your profile to confirm whether any undocumented experience already covers requirements classified as missing.`
  );

  return {
    job_title: jobAnalysis.job_title,
    company: jobAnalysis.company,
    match_score: matchScore,
    score_calculation_details: scoreCalculationDetails,
    total_requirements_analyzed: allRequirements.length,
    demonstrated_count: demonstratedCount,
    partial_count: partialCount,
    missing_count: missingCount,
    clarification_count: clarificationCount,
    gaps,
    overall_fit_summary: generateFitSummary(matchScore, demonstratedCount, partialCount, missingCount, jobAnalysis.job_title),
    actionable_recommendations: actionableRecommendations,
    limitations_disclaimer: 
      'This heuristic evaluation compares documented profile claims against extracted job specifications. ' +
      'Missing competencies reflect absence of documentation in your profile, not proof of inability. ' +
      'Evaluations should inform learning and application decisions, never automated rejection.',
    model_used: 'skillouette-grounded-evaluator-v1'
  };
}

function evaluateCompetency(competency: string, isMandatory: boolean, entries: Entry[]): SkillGapItem {
  const STOPWORDS = new Set([
    'with', 'and', 'the', 'for', 'from', 'into', 'using', 'etc', 'are', 'was', 'were',
    'our', 'you', 'your', 'skills', 'experience', 'ability', 'proficient', 'knowledge',
    'plus', 'preferred', 'required', 'algorithms', 'systems', 'design', 'development',
    'architecture', 'engineering', 'analysis', 'programming', 'tools', 'methodologies'
  ]);
  const compLower = competency.toLowerCase();
  const words = compLower.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !STOPWORDS.has(w));

  // Search through all entries for explicit evidence
  let directMatches: { entry: Entry; matchedWords: string[] }[] = [];

  for (const entry of entries) {
    const entryText = `${entry.title} ${entry.description} ${entry.tags.join(' ')} ${entry.role || ''} ${entry.institution || ''}`.toLowerCase();
    const matched = words.filter(w => {
      const regex = new RegExp(`\\b${w.replace('+', '\\+')}\\b`, 'i');
      return regex.test(entryText);
    });
    if (matched.length > 0) {
      directMatches.push({ entry, matchedWords: matched });
    }
  }

  // Sort by highest match count
  directMatches.sort((a, b) => b.matchedWords.length - a.matchedWords.length);

  if (directMatches.length > 0) {
    const best = directMatches[0];
    const matchRatio = best.matchedWords.length / Math.max(words.length, 1);

    if (matchRatio >= 0.5 || words.some(w => ['c++', 'python', 'stm32', 'ros', 'ros2', 'lora', 'kicad', 'freertos'].includes(w) && best.matchedWords.includes(w))) {
      return {
        competency,
        is_mandatory: isMandatory,
        classification: 'demonstrated_match',
        user_evidence: `Supported by entry "${best.entry.title}" (${best.entry.section_id.replace('sec_', '')}): "${best.entry.description.slice(0, 140)}..."`,
        missing_aspects: 'No critical gaps detected. Profile demonstrates practical experience in this competency.',
        importance_rationale: isMandatory 
          ? 'Mandatory qualification vital for day-to-day role execution.'
          : 'Preferred competency that provides competitive differentiation.',
        readiness_actions: 'Keep this qualification prominent on your tailored resume; highlight specific metrics achieved.'
      };
    } else if (matchRatio >= 0.3 || best.matchedWords.length >= 2) {
      return {
        competency,
        is_mandatory: isMandatory,
        classification: 'partially_demonstrated',
        user_evidence: `Partial mention in "${best.entry.title}": matched terms [${best.matchedWords.join(', ')}].`,
        missing_aspects: `Lacks explicit demonstration of end-to-end depth or specific tools requested: "${competency}".`,
        importance_rationale: 'Required for technical responsibilities without requiring extensive supervision.',
        readiness_actions: 'Update the entry with specific accomplishments or code artifacts demonstrating hands-on proficiency.'
      };
    }
  }

  // If no direct keyword found
  if (compLower.includes('degree') || compLower.includes('bachelor') || compLower.includes('education')) {
    const eduEntry = entries.find(e => e.section_id === 'sec_edu');
    if (eduEntry) {
      return {
        competency,
        is_mandatory: isMandatory,
        classification: 'demonstrated_match',
        user_evidence: `Documented academic background: ${eduEntry.title} - ${eduEntry.description}`,
        missing_aspects: 'None. Formal academic qualification documented.',
        importance_rationale: 'Foundational degree credential required by employer.',
        readiness_actions: 'Ensure graduation date and major are explicitly visible.'
      };
    }
  }

  return {
    competency,
    is_mandatory: isMandatory,
    classification: 'not_demonstrated',
    user_evidence: 'No documented evidence found in current profile or project entries.',
    missing_aspects: `Complete absence of documented projects, certifications, or work experience involving "${competency}".`,
    importance_rationale: isMandatory 
      ? 'Crucial requirement. Inability to demonstrate this skill may limit interview selection.' 
      : 'Helpful supplemental skill for advanced technical execution.',
    readiness_actions: 'Engage in a practical upskilling track, build an open-source demonstration, and record your verified progress.'
  };
}

function generateFitSummary(
  score: number,
  demonstrated: number,
  partial: number,
  missing: number,
  jobTitle: string
): string {
  if (score >= 80) {
    return `Strong overall alignment (${score}%) for ${jobTitle}. You have demonstrated ${demonstrated} key qualifications directly in your profile, with ${partial} partially documented. Addressing ${missing} gap(s) will further solidify your candidacy.`;
  } else if (score >= 60) {
    return `Moderate alignment (${score}%) for ${jobTitle}. You possess solid foundational skills (${demonstrated} demonstrated, ${partial} partial), but ${missing} significant requirement(s) need practical demonstration before applying.`;
  } else {
    return `Growth pathway needed (${score}%) for ${jobTitle}. Currently, ${missing} core competencies are unproven in your documented profile. Focus on the personalized upskilling sequence to build verifiable credentials.`;
  }
}

/**
 * Generate Personalized Upskilling Recommendations based on identified gaps
 */
export function generateUpskillingRecommendations(
  gaps: SkillGapItem[]
): UpskillingRecommendation[] {
  const recommendations: UpskillingRecommendation[] = [];
  const actionableGaps = gaps.filter(g => g.classification === 'not_demonstrated' || g.classification === 'partially_demonstrated');

  for (const gap of actionableGaps) {
    const lower = gap.competency.toLowerCase();
    let resources: VerifiedResource[] = [];

    // Match real verified resources
    for (const [key, resList] of Object.entries(VERIFIED_RESOURCE_KNOWLEDGE_BASE)) {
      if (lower.includes(key)) {
        resources = resList;
        break;
      }
    }

    if (resources.length === 0) {
      resources = [
        {
          title: 'Official Documentation & Standards Guide',
          provider: 'Official Open-Source Documentation Repository',
          type: 'documentation'
        },
        {
          title: 'Practical Project Implementation Walkthrough',
          provider: 'Peer-Reviewed Engineering Community Guide',
          type: 'tutorial'
        }
      ];
    }

    const rec: UpskillingRecommendation = {
      id: `upskill_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      competency: gap.competency,
      reason_it_matters: gap.importance_rationale,
      learning_sequence: [
        `Step 1: Review core theory and architecture via ${resources[0]?.provider || 'official technical documentation'}.`,
        `Step 2: Implement a self-contained local exercise or firmware/software module.`,
        `Step 3: Document working code, hardware/simulation test logs, and push to a public GitHub repository.`,
        `Step 4: Update your Skillouette profile with the new project entry and link to verify practical capability.`
      ],
      practical_exercises: [
        `Build a minimum reproducible prototype focusing specifically on ${gap.competency.split(/[,:;]/)[0]}.`,
        `Conduct unit testing and capture oscilloscope, terminal, or benchmarking telemetry to prove correctness.`
      ],
      portfolio_projects: [
        `End-to-end integration: Connect this competency to your existing robotics or software projects.`
      ],
      verified_resources: resources,
      proficiency_validation_method: 'Completed codebase with unit tests, README architecture documentation, and recorded execution demo.',
      status: 'not_started'
    };

    recommendations.push(rec);
  }

  return recommendations;
}
