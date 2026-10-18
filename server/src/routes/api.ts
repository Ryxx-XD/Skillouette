import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { categorizeEntry } from '../ai/categorizer.js';
import { matchJobPosting } from '../ai/jobMatcher.js';
import { analyzeJobDescription } from '../ai/jobAnalyzer.js';
import { analyzeSkillGaps, generateUpskillingRecommendations } from '../ai/skillGapAnalyzer.js';
import { generateCareerPathways } from '../ai/careerPathways.js';
import { generateTruthfulTailoredSummary } from '../ai/resumeTailorer.js';
import { generateDocxResume } from '../export/docxExport.js';
import { telemetry } from '../telemetry.js';
import { Packer } from 'docx';

export const apiRouter = Router();

// GET all resume data
apiRouter.get('/resume', (req: Request, res: Response) => {
  try {
    const data = db.getAll();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update Profile
apiRouter.post('/profile', (req: Request, res: Response) => {
  try {
    const updated = db.updateProfile(req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Brain Dump Capture Endpoint
apiRouter.post('/capture', async (req: Request, res: Response) => {
  try {
    const { raw_text } = req.body;
    if (!raw_text || typeof raw_text !== 'string') {
      return res.status(400).json({ error: 'raw_text string is required' });
    }

    const sections = db.getSections();
    const subsections = db.getSubsections();
    const settings = db.getSettings();

    const result = await categorizeEntry(raw_text, sections, subsections, settings);

    // Save capture audit log
    db.addLog(raw_text, result.items, result.model_used);

    res.json(result);
  } catch (err: any) {
    console.error('Capture endpoint error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Commit Categorized Items (handles new sections if requested)
apiRouter.post('/entries/commit', (req: Request, res: Response) => {
  try {
    const { items, create_sections } = req.body as {
      items: Array<{
        section_id: string;
        section_name?: string;
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
      }>;
      create_sections?: Array<{ id: string; name: string }>;
    };

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'items array is required' });
    }

    // Process new sections if confirmed by user
    const sectionMap: Record<string, string> = {};
    if (create_sections && Array.isArray(create_sections)) {
      for (const cs of create_sections) {
        const newSec = db.addSection(cs.name);
        sectionMap[cs.id] = newSec.id;
      }
    }

    const committedEntries = [];
    for (const item of items) {
      let targetSectionId = sectionMap[item.section_id] || item.section_id;

      // Verify section exists; if not, create or fallback
      let sec = db.getSections().find(s => s.id === targetSectionId);
      if (!sec) {
        if (item.section_name) {
          sec = db.addSection(item.section_name);
          targetSectionId = sec.id;
        } else {
          sec = db.getSections()[0];
          targetSectionId = sec.id;
        }
      }

      // Check subsection
      let subId = item.subsection_id || null;
      if (item.subsection_name && !subId) {
        const existingSub = db.getSubsections(targetSectionId).find(s => s.name.toLowerCase() === item.subsection_name!.toLowerCase());
        if (existingSub) {
          subId = existingSub.id;
        } else if (targetSectionId === 'sec_skills') {
          const newSub = db.addSubsection(targetSectionId, item.subsection_name);
          subId = newSub.id;
        }
      }

      const created = db.addEntry({
        section_id: targetSectionId,
        subsection_id: subId,
        title: item.title,
        description: item.description,
        tags: item.tags || [],
        date_start: item.date_start,
        date_end: item.date_end,
        metrics: item.metrics,
        role: item.role,
        institution: item.institution,
        links: item.links || [],
        confidence: 1.0,
        is_active: true
      });
      committedEntries.push(created);
    }

    res.json({
      success: true,
      committed: committedEntries,
      data: db.getAll()
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Single Entry CRUD (Quick Add)
apiRouter.post('/entries', (req: Request, res: Response) => {
  try {
    const entry = db.addEntry(req.body);
    res.status(201).json(entry);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/entries/:id', (req: Request, res: Response) => {
  try {
    const updated = db.updateEntry(req.params.id as string, req.body);
    if (!updated) return res.status(404).json({ error: 'Entry not found' });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/entries/:id', (req: Request, res: Response) => {
  try {
    const success = db.deleteEntry(req.params.id as string);
    if (!success) return res.status(404).json({ error: 'Entry not found' });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/entries/reorder', (req: Request, res: Response) => {
  try {
    const { section_id, ordered_ids } = req.body;
    const reordered = db.reorderEntries(section_id, ordered_ids);
    res.json(reordered);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Sections CRUD & Reordering
apiRouter.post('/sections', (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Section name is required' });
    const sec = db.addSection(name, description);
    res.status(201).json(sec);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/sections/:id', (req: Request, res: Response) => {
  try {
    const updated = db.updateSection(req.params.id as string, req.body);
    if (!updated) return res.status(404).json({ error: 'Section not found' });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/sections/:id', (req: Request, res: Response) => {
  try {
    const success = db.deleteSection(req.params.id as string);
    if (!success) return res.status(404).json({ error: 'Section not found' });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/sections/reorder', (req: Request, res: Response) => {
  try {
    const { ordered_ids } = req.body;
    const reordered = db.reorderSections(ordered_ids);
    res.json(reordered);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Subsections CRUD
apiRouter.post('/subsections', (req: Request, res: Response) => {
  try {
    const { section_id, name } = req.body;
    if (!section_id || !name) return res.status(400).json({ error: 'section_id and name are required' });
    const sub = db.addSubsection(section_id, name);
    res.status(201).json(sub);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/subsections/:id', (req: Request, res: Response) => {
  try {
    const success = db.deleteSubsection(req.params.id as string);
    if (!success) return res.status(404).json({ error: 'Subsection not found' });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// References
apiRouter.post('/references', (req: Request, res: Response) => {
  try {
    const updated = db.updateReferences(req.body.references);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Job-Match Endpoint
apiRouter.post('/job-match', async (req: Request, res: Response) => {
  try {
    const { job_title, company, raw_job_text, requirements } = req.body;
    if (!raw_job_text) {
      return res.status(400).json({ error: 'raw_job_text is required' });
    }

    const entries = db.getEntries();
    const sections = db.getSections();
    const profile = db.getProfile();
    const settings = db.getSettings();

    const matchResult = await matchJobPosting(
      { job_title: job_title || 'Target Position', company, raw_job_text, requirements },
      entries,
      sections,
      profile,
      settings
    );

    res.json(matchResult);
  } catch (err: any) {
    console.error('Job match error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Job Snapshots
apiRouter.get('/snapshots', (req: Request, res: Response) => {
  try {
    res.json(db.getSnapshots());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/snapshots', (req: Request, res: Response) => {
  try {
    const snapshot = db.saveSnapshot(req.body);
    res.status(201).json(snapshot);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/snapshots/:id', (req: Request, res: Response) => {
  try {
    const success = db.deleteSnapshot(req.params.id as string);
    if (!success) return res.status(404).json({ error: 'Snapshot not found' });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DOCX Export Endpoint
apiRouter.post('/export/docx', async (req: Request, res: Response) => {
  try {
    const { custom_summary, entry_ids } = req.body || {};
    const resumeData = db.getAll();
    const doc = await generateDocxResume(resumeData, custom_summary, entry_ids);
    const buffer = await Packer.toBuffer(doc);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${resumeData.profile.name.replace(/\s+/g, '_')}_CV.docx"`);
    res.send(buffer);
  } catch (err: any) {
    console.error('DOCX export error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Settings
apiRouter.get('/settings', (req: Request, res: Response) => {
  try {
    const settings = db.getSettings();
    // Mask sensitive keys for safety
    res.json({
      ...settings,
      gemini_api_key: settings.gemini_api_key ? `••••••••${settings.gemini_api_key.slice(-4)}` : '',
      openai_api_key: settings.openai_api_key ? `••••••••${settings.openai_api_key.slice(-4)}` : ''
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/settings', (req: Request, res: Response) => {
  try {
    const current = db.getSettings();
    const updates = { ...req.body };
    if (updates.gemini_api_key && updates.gemini_api_key.startsWith('••••')) {
      delete updates.gemini_api_key;
    }
    if (updates.openai_api_key && updates.openai_api_key.startsWith('••••')) {
      delete updates.openai_api_key;
    }
    const updated = db.updateSettings(updates);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Audit Logs
apiRouter.get('/logs', (req: Request, res: Response) => {
  try {
    res.json(db.getLogs());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Reset to Seed
apiRouter.post('/reset', (req: Request, res: Response) => {
  try {
    const data = db.resetToSeed();
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// CORE FEATURE B: Job Description Analysis
// ----------------------------------------------------
apiRouter.post('/job-analyze', async (req: Request, res: Response) => {
  try {
    const { raw_job_text, job_title, company } = req.body;
    if (!raw_job_text || typeof raw_job_text !== 'string') {
      return res.status(400).json({ error: 'raw_job_text is required.' });
    }

    const settings = db.getSettings();
    const result = await analyzeJobDescription(raw_job_text, job_title, company, settings);
    telemetry.recordFeature('jobAnalyses');
    telemetry.logEvent('JOB_ANALYSIS', `Analyzed job posting: ${result.job_title}`);

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// CORE FEATURES E & F: Skill-Gap Analysis & Upskilling
// ----------------------------------------------------
apiRouter.post('/skill-gaps', async (req: Request, res: Response) => {
  try {
    const { raw_job_text, job_title, company } = req.body;
    if (!raw_job_text || typeof raw_job_text !== 'string') {
      return res.status(400).json({ error: 'raw_job_text is required.' });
    }

    const settings = db.getSettings();
    const jobAnalysis = await analyzeJobDescription(raw_job_text, job_title, company, settings);
    const entries = db.getEntries();

    const gapReport = analyzeSkillGaps(jobAnalysis, entries);
    const upskillingRecs = generateUpskillingRecommendations(gapReport.gaps);

    telemetry.recordFeature('skillGapReports');
    telemetry.logEvent('SKILL_GAP_ANALYSIS', `Evaluated ${gapReport.total_requirements_analyzed} requirements for ${gapReport.job_title}`);

    res.json({
      job_analysis: jobAnalysis,
      skill_gap_report: gapReport,
      upskilling_recommendations: upskillingRecs
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// CORE FEATURE F: Upskilling Progress Tracking
// ----------------------------------------------------
apiRouter.get('/upskilling', (req: Request, res: Response) => {
  try {
    res.json(db.getUpskillingItems());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/upskilling', (req: Request, res: Response) => {
  try {
    const item = db.saveUpskillingItem(req.body);
    res.status(201).json(item);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/upskilling/:id/status', (req: Request, res: Response) => {
  try {
    const { status, notes } = req.body;
    const updated = db.updateUpskillingStatus(req.params.id as string, status, notes);
    if (!updated) return res.status(404).json({ error: 'Upskilling item not found' });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// CORE FEATURE G: Career Pathways
// ----------------------------------------------------
apiRouter.post('/career-pathways', (req: Request, res: Response) => {
  try {
    const profile = db.getProfile();
    const entries = db.getEntries();
    const pathways = generateCareerPathways(profile, entries);
    db.savePathways(pathways);

    telemetry.logEvent('CAREER_PATHWAYS', `Generated ${pathways.length} adjacent career pathways`);
    res.json(pathways);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// CORE FEATURE D: Truthful Tailored Resume Summary
// ----------------------------------------------------
apiRouter.post('/resume/tailor', async (req: Request, res: Response) => {
  try {
    const { job_title, company, matched_skills, missing_skills } = req.body;
    const profile = db.getProfile();
    const settings = db.getSettings();

    const result = await generateTruthfulTailoredSummary(
      profile,
      job_title || 'Target Role',
      company,
      matched_skills || [],
      missing_skills || [],
      settings
    );

    telemetry.recordFeature('resumesTailored');
    telemetry.logEvent('RESUME_TAILORED', `Truthful resume tailored for ${job_title || 'Target Role'}`);

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// TELEMETRY & OBSERVABILITY
// ----------------------------------------------------
apiRouter.get('/telemetry/stats', (req: Request, res: Response) => {
  try {
    res.json({
      metrics: telemetry.getMetrics(),
      recent_events: telemetry.getRecentLogs()
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

