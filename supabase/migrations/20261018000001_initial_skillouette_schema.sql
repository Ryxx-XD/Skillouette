-- Skillouette Database Schema Migration
-- Migration: 20261018000001_initial_skillouette_schema.sql
-- Description: Full schema for Skillouette career readiness platform with Row Level Security (RLS)

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  location TEXT,
  github TEXT,
  linkedin TEXT,
  website TEXT,
  photo_url TEXT,
  summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. SECTIONS
CREATE TABLE IF NOT EXISTS public.sections (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_custom BOOLEAN NOT NULL DEFAULT false,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. SUBSECTIONS
CREATE TABLE IF NOT EXISTS public.subsections (
  id TEXT PRIMARY KEY,
  section_id TEXT NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. ENTRIES (Skills, Experience, Projects, Education, Certifications)
CREATE TABLE IF NOT EXISTS public.entries (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  section_id TEXT NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  subsection_id TEXT REFERENCES public.subsections(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  date_start TEXT,
  date_end TEXT,
  metrics TEXT,
  role TEXT,
  institution TEXT,
  links TEXT[] NOT NULL DEFAULT '{}',
  order_index INTEGER NOT NULL DEFAULT 0,
  confidence NUMERIC NOT NULL DEFAULT 1.0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  verification_source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. REFERENCES
CREATE TABLE IF NOT EXISTS public.references (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  title_org TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  relationship TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. JOB POSTINGS & REQUIREMENTS EXTRACTION
CREATE TABLE IF NOT EXISTS public.job_postings (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_title TEXT NOT NULL,
  company TEXT,
  raw_text TEXT NOT NULL,
  responsibilities TEXT[] NOT NULL DEFAULT '{}',
  required_competencies TEXT[] NOT NULL DEFAULT '{}',
  preferred_competencies TEXT[] NOT NULL DEFAULT '{}',
  education_requirements TEXT[] NOT NULL DEFAULT '{}',
  experience_requirements TEXT[] NOT NULL DEFAULT '{}',
  certification_requirements TEXT[] NOT NULL DEFAULT '{}',
  keywords TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. JOB MATCH ASSESSMENTS
CREATE TABLE IF NOT EXISTS public.match_assessments (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_posting_id TEXT REFERENCES public.job_postings(id) ON DELETE CASCADE,
  overall_score NUMERIC NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  scoring_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
  tailored_summary TEXT NOT NULL,
  matched_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  partially_matched_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  missing_competencies JSONB NOT NULL DEFAULT '[]'::jsonb,
  selected_entry_ids TEXT[] NOT NULL DEFAULT '{}',
  limitations_disclaimer TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. SKILL GAPS
CREATE TABLE IF NOT EXISTS public.skill_gaps (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_posting_id TEXT REFERENCES public.job_postings(id) ON DELETE CASCADE,
  competency TEXT NOT NULL,
  classification TEXT NOT NULL CHECK (classification IN ('demonstrated_match', 'partially_demonstrated', 'not_demonstrated', 'requires_clarification')),
  user_evidence TEXT,
  missing_aspects TEXT,
  importance_rationale TEXT,
  readiness_actions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. UPSKILLING RECOMMENDATIONS & PROGRESS
CREATE TABLE IF NOT EXISTS public.upskilling_recommendations (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  competency TEXT NOT NULL,
  reason_it_matters TEXT NOT NULL,
  learning_sequence JSONB NOT NULL DEFAULT '[]'::jsonb,
  practical_exercises JSONB NOT NULL DEFAULT '[]'::jsonb,
  portfolio_projects JSONB NOT NULL DEFAULT '[]'::jsonb,
  verified_resources JSONB NOT NULL DEFAULT '[]'::jsonb,
  proficiency_validation_method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. CAREER PATHWAYS
CREATE TABLE IF NOT EXISTS public.career_pathways (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_role TEXT NOT NULL,
  similarity_score NUMERIC NOT NULL CHECK (similarity_score >= 0 AND similarity_score <= 100),
  transferable_competencies JSONB NOT NULL DEFAULT '[]'::jsonb,
  remaining_skill_gaps JSONB NOT NULL DEFAULT '[]'::jsonb,
  required_qualifications JSONB NOT NULL DEFAULT '[]'::jsonb,
  recommended_roadmap JSONB NOT NULL DEFAULT '[]'::jsonb,
  limitations_disclaimer TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. AUDIT & TELEMETRY LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subsections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_gaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upskilling_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_pathways ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view and update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Sections
CREATE POLICY "Users can view own sections" ON public.sections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own sections" ON public.sections FOR ALL USING (auth.uid() = user_id);

-- Subsections
CREATE POLICY "Users can view own subsections" ON public.subsections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own subsections" ON public.subsections FOR ALL USING (auth.uid() = user_id);

-- Entries
CREATE POLICY "Users can view own entries" ON public.entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own entries" ON public.entries FOR ALL USING (auth.uid() = user_id);

-- References
CREATE POLICY "Users can view own references" ON public.references FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own references" ON public.references FOR ALL USING (auth.uid() = user_id);

-- Job Postings
CREATE POLICY "Users can view own job postings" ON public.job_postings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own job postings" ON public.job_postings FOR ALL USING (auth.uid() = user_id);

-- Match Assessments
CREATE POLICY "Users can view own assessments" ON public.match_assessments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own assessments" ON public.match_assessments FOR ALL USING (auth.uid() = user_id);

-- Skill Gaps
CREATE POLICY "Users can view own skill gaps" ON public.skill_gaps FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own skill gaps" ON public.skill_gaps FOR ALL USING (auth.uid() = user_id);

-- Upskilling Recommendations
CREATE POLICY "Users can view own upskilling" ON public.upskilling_recommendations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own upskilling" ON public.upskilling_recommendations FOR ALL USING (auth.uid() = user_id);

-- Career Pathways
CREATE POLICY "Users can view own pathways" ON public.career_pathways FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own pathways" ON public.career_pathways FOR ALL USING (auth.uid() = user_id);

-- Audit Logs
CREATE POLICY "Users can view own audit logs" ON public.audit_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own audit logs" ON public.audit_logs FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_entries_user_section ON public.entries (user_id, section_id);
CREATE INDEX IF NOT EXISTS idx_match_assessments_user ON public.match_assessments (user_id);
CREATE INDEX IF NOT EXISTS idx_upskilling_user_status ON public.upskilling_recommendations (user_id, status);
CREATE INDEX IF NOT EXISTS idx_career_pathways_user ON public.career_pathways (user_id);
