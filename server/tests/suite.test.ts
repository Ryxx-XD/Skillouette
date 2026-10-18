/**
 * Skillouette Automated Test Suite
 * Tests Profile Integrity, Job Analysis, Job Matching, Truthful Resume Guardrails,
 * Skill Gaps, Upskilling, Career Pathways, Telemetry Sanitization, and Health Checks.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../src/db.js';
import { runHeuristicJobAnalyzer } from '../src/ai/jobAnalyzer.js';
import { runHeuristicJobMatcher } from '../src/ai/jobMatcher.js';
import { analyzeSkillGaps, generateUpskillingRecommendations } from '../src/ai/skillGapAnalyzer.js';
import { generateCareerPathways } from '../src/ai/careerPathways.js';
import { buildGroundedSummary, auditSummaryTruthfulness } from '../src/ai/resumeTailorer.js';
import { telemetry } from '../src/telemetry.js';
import { supabase } from '../src/supabase.js';

describe('1. Profile Integrity & Persistence', () => {
  test('should load profile and support non-destructive updates', () => {
    const initialProfile = db.getProfile();
    assert.ok(initialProfile.name, 'Profile name must exist');
    assert.ok(initialProfile.email, 'Profile email must exist');

    const updated = db.updateProfile({ title: 'Lead Robotics Systems Engineer' });
    assert.equal(updated.title, 'Lead Robotics Systems Engineer');

    // Restore
    db.updateProfile({ title: initialProfile.title });
  });

  test('should support incomplete profile without fabricating data', () => {
    const incomplete = {
      name: 'Test Candidate',
      title: 'Engineer',
      email: 'test@example.com',
      phone: '',
      location: '',
      github: '',
      linkedin: '',
      summary: 'Basic engineering background.'
    };
    db.updateProfile(incomplete);
    const profile = db.getProfile();
    assert.equal(profile.phone, '', 'Missing phone must remain empty');
    assert.equal(profile.location, '', 'Missing location must remain empty');

    // Reset back to seed
    db.resetToSeed();
  });
});

describe('2. Job Description Analysis (Core Feature B)', () => {
  test('should distinguish between mandatory and preferred requirements', () => {
    const sampleJob = `
Position: Embedded Systems Firmware Developer
Company: AgriBotix Autonomy
Key Responsibilities:
- Design firmware for autonomous rovers.
Requirements:
- Must have proficiency in C/C++ on STM32 microcontrollers.
- Hands-on experience with FreeRTOS.
- Bachelor degree in Computer Engineering or Robotics.
Preferred Qualifications:
- Familiarity with LoRaWAN and CAN bus protocols.
- Experience with ROS 2 simulation.
`;
    const analysis = runHeuristicJobAnalyzer(sampleJob);
    assert.ok(analysis.job_title.includes('Embedded'), 'Title should be extracted');
    assert.ok(analysis.required_competencies.length >= 2, 'Should extract mandatory requirements');
    assert.ok(analysis.preferred_competencies.length >= 1, 'Should extract preferred requirements');
    assert.ok(analysis.education_requirements.length >= 1, 'Should extract educational requirement');
  });

  test('should identify missing information in sparse job descriptions', () => {
    const sparseJob = `We need a good coder immediately. Contact us.`;
    const analysis = runHeuristicJobAnalyzer(sparseJob);
    assert.ok(analysis.missing_information_notes.length > 0, 'Should detect missing qualifications notes');
  });
});

describe('3. AI Job Matching & Evidence Grounding (Core Feature C)', () => {
  test('should calculate transparent score and ground matches in real entries', () => {
    const entries = db.getEntries();
    const sections = db.getSections();
    const profile = db.getProfile();

    const sampleJob = {
      job_title: 'Robotics Engineer',
      raw_job_text: 'Looking for experience in STM32, C++, ROS, FreeRTOS, and KiCad PCB design.'
    };

    const match = runHeuristicJobMatcher(sampleJob, entries, sections, profile);
    assert.ok(match.extracted_skills.length >= 3, 'Should extract technical keywords');
    assert.ok(match.recommended_entry_ids.length > 0, 'Should recommend matching entries');

    // Verify all scores are bounded [0, 1]
    for (const scoreInfo of Object.values(match.entry_scores)) {
      assert.ok(scoreInfo.score >= 0.0 && scoreInfo.score <= 1.0, 'Score must be between 0.0 and 1.0');
      assert.ok(scoreInfo.rationale.length > 0, 'Rationale must be provided');
    }
  });
});

describe('4. Truthful Resume Tailoring & Anti-Fabrication Guardrail (Core Feature D)', () => {
  test('should pass audit when summary uses strictly documented skills', () => {
    const profile = db.getProfile();
    const matchedSkills = ['C++', 'STM32', 'Robotics'];
    const missingSkills = ['Kubernetes', 'GoLang', 'AWS Cloud'];

    const grounded = buildGroundedSummary(profile, 'Robotics Firmware Engineer', 'AgriBotix', matchedSkills);
    const audit = auditSummaryTruthfulness(grounded, profile, matchedSkills, missingSkills);

    assert.equal(audit.truthfulness_passed, true, 'Grounded summary must pass truthfulness audit');
    assert.equal(audit.unsupported_omissions.length, 0, 'Must not claim missing competencies');
  });

  test('should REJECT and flag hallucinated missing competency claims', () => {
    const profile = db.getProfile();
    const matchedSkills = ['C++', 'STM32'];
    const missingSkills = ['Kubernetes', 'Cloud Security'];

    // Fabricated adversarial summary
    const adversarialSummary = `Candidate is an expert in Kubernetes and Cloud Security with 10 years experience.`;
    const audit = auditSummaryTruthfulness(adversarialSummary, profile, matchedSkills, missingSkills);

    assert.equal(audit.truthfulness_passed, false, 'Adversarial summary claiming missing skills MUST fail audit');
    assert.ok(audit.unsupported_omissions.length >= 1, 'Must flag unsupported competency claims');
  });
});

describe('5. Skill-Gap Categorization & Grounded Upskilling (Core Features E & F)', () => {
  test('should classify gaps into Demonstrated, Partial, or Not Demonstrated', () => {
    const sampleJob = {
      job_title: 'Firmware Engineer',
      raw_job_text: 'Requires STM32, C++, and Quantum Computing Algorithms.',
      responsibilities: [],
      required_competencies: ['STM32 microcontrollers', 'Quantum Computing Algorithms with Qiskit'],
      preferred_competencies: ['C++ programming'],
      education_requirements: [],
      experience_requirements: [],
      certification_requirements: [],
      keywords: ['STM32', 'C++'],
      missing_information_notes: [],
      model_used: 'test'
    };
    const entries = db.getEntries();
    const gapReport = analyzeSkillGaps(sampleJob, entries);

    assert.ok(gapReport.match_score >= 0 && gapReport.match_score <= 100, 'Score must be 0-100');
    assert.ok(gapReport.demonstrated_count >= 1, 'STM32 should be demonstrated from profile');
    assert.ok(gapReport.missing_count >= 1, 'Quantum Computing should be flagged as not demonstrated');

    const quantumGap = gapReport.gaps.find(g => g.competency.includes('Quantum'));
    assert.equal(quantumGap?.classification, 'not_demonstrated', 'Quantum must be classified as not demonstrated');
  });

  test('should produce verified upskilling tracks with real resources', () => {
    const sampleGaps = [
      {
        competency: 'FreeRTOS Real-Time Kernel',
        is_mandatory: true,
        classification: 'not_demonstrated' as const,
        user_evidence: 'None',
        missing_aspects: 'No prior project',
        importance_rationale: 'Core requirement',
        readiness_actions: 'Learn FreeRTOS'
      }
    ];

    const upskilling = generateUpskillingRecommendations(sampleGaps);
    assert.equal(upskilling.length, 1);
    assert.equal(upskilling[0].status, 'not_started', 'New recommendations must default to not_started');
    assert.ok(upskilling[0].verified_resources.length > 0, 'Must include verified learning resources');
    assert.ok(upskilling[0].verified_resources.some(r => r.provider.includes('FreeRTOS') || r.provider.includes('AWS')), 'Must use verified provider');
  });
});

describe('6. Career Pathways (Core Feature G)', () => {
  test('should generate adjacent career pathways with transferable skills', () => {
    const profile = db.getProfile();
    const entries = db.getEntries();
    const pathways = generateCareerPathways(profile, entries);

    assert.ok(pathways.length >= 3, 'Should generate multiple pathways');
    const top = pathways[0];
    assert.ok(top.similarity_score >= 35 && top.similarity_score <= 100, 'Score must be realistic');
    assert.ok(top.transferable_competencies.length > 0, 'Must list transferable competencies');
    assert.ok(top.limitations_disclaimer.length > 0, 'Must provide realistic limitation disclaimer');
  });
});

describe('7. Telemetry & Privacy-Conscious Sanitization (Section 18)', () => {
  test('should sanitize emails, API keys, and phone numbers in telemetry logs', () => {
    const rawPiiText = 'User edgarjoerenzbpondales@gmail.com with key AIzaSyA1234567890123456789012345678901 and phone +1-555-123-4567';
    const sanitized = telemetry.sanitizeText(rawPiiText);

    assert.ok(!sanitized.includes('edgarjoerenzbpondales@gmail.com'), 'Email must be redacted');
    assert.ok(sanitized.includes('[REDACTED_EMAIL]'), 'Redaction tag must be present');
    assert.ok(!sanitized.includes('AIzaSyA1234567890123456789012345678901'), 'API key must be redacted');
    assert.ok(sanitized.includes('[REDACTED_SECRET]'), 'Key tag must be present');
  });

  test('should record requests and provide aggregate metrics', () => {
    telemetry.recordRequest(200, 45);
    telemetry.recordRequest(404, 12);
    const metrics = telemetry.getMetrics();

    assert.ok(metrics.totalRequests > 0, 'Total requests must be recorded');
    assert.ok(metrics.http2xx > 0, '2xx requests must be recorded');
    assert.ok(metrics.http4xx > 0, '4xx requests must be recorded');
  });
});

describe('8. Health & Infrastructure (Section 17)', () => {
  test('should report healthy standalone database mode when Supabase is unconfigured', async () => {
    const health = await supabase.checkHealth();
    assert.equal(health.ok, true, 'Standalone local mode should be operational and healthy');
  });
});
