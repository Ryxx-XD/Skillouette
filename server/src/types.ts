export interface Profile {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  github: string;
  linkedin: string;
  website?: string;
  photo_url?: string;
  summary: string;
}

export interface Section {
  id: string;
  name: string;
  order: number;
  is_custom: boolean;
  is_visible: boolean;
  description?: string;
}

export interface Subsection {
  id: string;
  section_id: string;
  name: string;
  order: number;
}

export interface Entry {
  id: string;
  section_id: string;
  subsection_id?: string | null;
  title: string;
  description: string;
  tags: string[];
  date_start?: string;
  date_end?: string;
  metrics?: string;
  role?: string;
  institution?: string;
  links: string[];
  order: number;
  confidence?: number;
  is_active?: boolean;
  is_verified?: boolean; // User claim vs verified credential
  verification_source?: string;
}

export interface ReferenceItem {
  id: string;
  name: string;
  title_org: string;
  email: string;
  phone: string;
  relationship?: string;
}

export interface JobAnalysisResult {
  job_title: string;
  company?: string;
  raw_job_text: string;
  responsibilities: string[];
  required_competencies: string[];
  preferred_competencies: string[];
  education_requirements: string[];
  experience_requirements: string[];
  certification_requirements: string[];
  keywords: string[];
  missing_information_notes: string[];
  model_used: string;
}

export type SkillGapClassification = 
  | 'demonstrated_match' 
  | 'partially_demonstrated' 
  | 'not_demonstrated' 
  | 'requires_clarification';

export interface SkillGapItem {
  competency: string;
  is_mandatory: boolean;
  classification: SkillGapClassification;
  user_evidence: string;
  missing_aspects: string;
  importance_rationale: string;
  readiness_actions: string;
}

export interface SkillGapReport {
  job_title: string;
  company?: string;
  match_score: number; // 0 to 100 documented heuristic score
  score_calculation_details: string;
  total_requirements_analyzed: number;
  demonstrated_count: number;
  partial_count: number;
  missing_count: number;
  clarification_count: number;
  gaps: SkillGapItem[];
  overall_fit_summary: string;
  actionable_recommendations: string[];
  limitations_disclaimer: string;
  model_used: string;
}

export interface VerifiedResource {
  title: string;
  provider: string;
  url?: string;
  type: 'documentation' | 'course' | 'tutorial' | 'certification_guide';
}

export interface UpskillingRecommendation {
  id: string;
  competency: string;
  reason_it_matters: string;
  learning_sequence: string[];
  practical_exercises: string[];
  portfolio_projects: string[];
  verified_resources: VerifiedResource[];
  proficiency_validation_method: string;
  status: 'not_started' | 'in_progress' | 'completed';
  notes?: string;
}

export interface CareerPathway {
  id: string;
  target_role: string;
  similarity_score: number; // 0 to 100
  transferable_competencies: string[];
  remaining_skill_gaps: string[];
  required_qualifications: string[];
  recommended_roadmap: string[];
  limitations_disclaimer: string;
}

export interface TruthfulnessAudit {
  verified_user_claims: string[];
  ai_transformed_phrasings: string[];
  unsupported_omissions: string[];
  truthfulness_passed: boolean;
  audit_note: string;
}

export interface JobSnapshot {
  id: string;
  name: string;
  job_title: string;
  company?: string;
  raw_job_text: string;
  extracted_skills: string[];
  entry_scores: Record<string, { score: number; rationale: string; matched_skills: string[] }>;
  gaps: string[];
  tailored_summary: string;
  selected_entry_ids: string[];
  created_at: string;
  skill_gap_report?: SkillGapReport;
  upskilling_recommendations?: UpskillingRecommendation[];
  career_pathways?: CareerPathway[];
  truthfulness_audit?: TruthfulnessAudit;
}

export interface CaptureLog {
  id: string;
  timestamp: string;
  raw_input: string;
  parsed_entries: any[];
  model_name: string;
}

export interface AppSettings {
  gemini_api_key?: string;
  openai_api_key?: string;
  llm_provider: 'gemini' | 'openai' | 'local';
  model_name: string;
  temperature: number;
}

export interface ResumeData {
  profile: Profile;
  sections: Section[];
  subsections: Subsection[];
  entries: Entry[];
  references: ReferenceItem[];
  snapshots: JobSnapshot[];
  logs: CaptureLog[];
  settings: AppSettings;
  upskilling_items?: UpskillingRecommendation[];
  pathways?: CareerPathway[];
}
