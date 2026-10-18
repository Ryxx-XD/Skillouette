import { ResumeData, Entry, Section, JobSnapshot, CategorizedItem, JobMatchResponse, AppSettings, JobAnalysisResult, SkillGapReport, UpskillingRecommendation, CareerPathway, TruthfulnessAudit, TelemetryMetrics, SanitizedLogEntry } from './types.js';

const API_BASE = '/api';

export async function fetchResumeData(): Promise<ResumeData> {
  const res = await fetch(`${API_BASE}/resume`);
  if (!res.ok) throw new Error('Failed to fetch resume data');
  return res.json();
}

export async function updateProfile(profile: Partial<ResumeData['profile']>): Promise<ResumeData['profile']> {
  const res = await fetch(`${API_BASE}/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile)
  });
  if (!res.ok) throw new Error('Failed to update profile');
  return res.json();
}

export async function captureBrainDump(raw_text: string): Promise<{ items: CategorizedItem[]; model_used: string; raw_input: string }> {
  const res = await fetch(`${API_BASE}/capture`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw_text })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to parse brain dump');
  }
  return res.json();
}

export async function commitCategorizedEntries(
  items: CategorizedItem[],
  create_sections?: Array<{ id: string; name: string }>
): Promise<{ success: boolean; committed: Entry[]; data: ResumeData }> {
  const res = await fetch(`${API_BASE}/entries/commit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items, create_sections })
  });
  if (!res.ok) throw new Error('Failed to commit entries');
  return res.json();
}

export async function addEntry(entry: Partial<Entry>): Promise<Entry> {
  const res = await fetch(`${API_BASE}/entries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry)
  });
  if (!res.ok) throw new Error('Failed to create entry');
  return res.json();
}

export async function updateEntry(id: string, entry: Partial<Entry>): Promise<Entry> {
  const res = await fetch(`${API_BASE}/entries/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry)
  });
  if (!res.ok) throw new Error('Failed to update entry');
  return res.json();
}

export async function deleteEntry(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/entries/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete entry');
}

export async function reorderEntries(section_id: string, ordered_ids: string[]): Promise<Entry[]> {
  const res = await fetch(`${API_BASE}/entries/reorder`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ section_id, ordered_ids })
  });
  if (!res.ok) throw new Error('Failed to reorder entries');
  return res.json();
}

export async function addSection(name: string, description?: string): Promise<Section> {
  const res = await fetch(`${API_BASE}/sections`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description })
  });
  if (!res.ok) throw new Error('Failed to add section');
  return res.json();
}

export async function addSubsection(section_id: string, name: string): Promise<any> {
  const res = await fetch(`${API_BASE}/subsections`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ section_id, name })
  });
  if (!res.ok) throw new Error('Failed to add subsection');
  return res.json();
}

export async function deleteSubsection(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/subsections/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete subsection');
}

export async function updateSection(id: string, updates: Partial<Section>): Promise<Section> {
  const res = await fetch(`${API_BASE}/sections/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  if (!res.ok) throw new Error('Failed to update section');
  return res.json();
}

export async function deleteSection(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/sections/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete section');
}

export async function reorderSections(ordered_ids: string[]): Promise<Section[]> {
  const res = await fetch(`${API_BASE}/sections/reorder`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ordered_ids })
  });
  if (!res.ok) throw new Error('Failed to reorder sections');
  return res.json();
}

export async function runJobMatch(data: {
  job_title: string;
  company?: string;
  raw_job_text: string;
  requirements?: string;
}): Promise<JobMatchResponse> {
  const res = await fetch(`${API_BASE}/job-match`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Job match failed');
  }
  return res.json();
}

export async function saveSnapshot(snapshot: Partial<JobSnapshot>): Promise<JobSnapshot> {
  const res = await fetch(`${API_BASE}/snapshots`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(snapshot)
  });
  if (!res.ok) throw new Error('Failed to save snapshot');
  return res.json();
}

export async function deleteSnapshot(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/snapshots/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete snapshot');
}

export async function exportDocx(custom_summary?: string, entry_ids?: string[]): Promise<Blob> {
  const res = await fetch(`${API_BASE}/export/docx`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ custom_summary, entry_ids })
  });
  if (!res.ok) throw new Error('DOCX generation failed');
  return res.blob();
}

export async function getSettings(): Promise<AppSettings> {
  const res = await fetch(`${API_BASE}/settings`);
  if (!res.ok) throw new Error('Failed to load settings');
  return res.json();
}

export async function updateSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
  const res = await fetch(`${API_BASE}/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  });
  if (!res.ok) throw new Error('Failed to update settings');
  return res.json();
}

export async function resetDatabase(): Promise<{ success: boolean; data: ResumeData }> {
  const res = await fetch(`${API_BASE}/reset`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reset database');
  return res.json();
}

// ----------------------------------------------------
// SKILLOUETTE CORE APIS
// ----------------------------------------------------

export async function analyzeJobDescription(data: {
  raw_job_text: string;
  job_title?: string;
  company?: string;
}): Promise<JobAnalysisResult> {
  const res = await fetch(`${API_BASE}/job-analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Job analysis failed');
  }
  return res.json();
}

export async function evaluateSkillGaps(data: {
  raw_job_text: string;
  job_title?: string;
  company?: string;
}): Promise<{
  job_analysis: JobAnalysisResult;
  skill_gap_report: SkillGapReport;
  upskilling_recommendations: UpskillingRecommendation[];
}> {
  const res = await fetch(`${API_BASE}/skill-gaps`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Skill gap evaluation failed');
  }
  return res.json();
}

export async function fetchUpskillingItems(): Promise<UpskillingRecommendation[]> {
  const res = await fetch(`${API_BASE}/upskilling`);
  if (!res.ok) throw new Error('Failed to fetch upskilling items');
  return res.json();
}

export async function saveUpskillingItem(item: UpskillingRecommendation): Promise<UpskillingRecommendation> {
  const res = await fetch(`${API_BASE}/upskilling`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item)
  });
  if (!res.ok) throw new Error('Failed to save upskilling item');
  return res.json();
}

export async function updateUpskillingStatus(
  id: string,
  status: 'not_started' | 'in_progress' | 'completed',
  notes?: string
): Promise<UpskillingRecommendation> {
  const res = await fetch(`${API_BASE}/upskilling/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, notes })
  });
  if (!res.ok) throw new Error('Failed to update upskilling progress');
  return res.json();
}

export async function generateCareerPathways(): Promise<CareerPathway[]> {
  const res = await fetch(`${API_BASE}/career-pathways`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to generate career pathways');
  return res.json();
}

export async function tailorResumeSummary(data: {
  job_title: string;
  company?: string;
  matched_skills: string[];
  missing_skills: string[];
}): Promise<{ summary: string; audit: TruthfulnessAudit }> {
  const res = await fetch(`${API_BASE}/resume/tailor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Resume tailoring failed');
  }
  return res.json();
}

export async function fetchTelemetryStats(): Promise<{
  metrics: TelemetryMetrics;
  recent_events: SanitizedLogEntry[];
}> {
  const res = await fetch(`${API_BASE}/telemetry/stats`);
  if (!res.ok) throw new Error('Failed to fetch telemetry stats');
  return res.json();
}

export async function fetchHealthReadiness(): Promise<{
  status: string;
  checks: {
    liveness: string;
    database: { mode: string; healthy: boolean; latency_ms: number; notes: string };
    ai_provider: { configured: boolean; provider: string; fallback_available: boolean };
  };
  timestamp: string;
}> {
  const res = await fetch('/health/ready');
  return res.json();
}

