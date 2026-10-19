import React, { useState } from 'react';
import { Target, Sparkles, AlertCircle, CheckCircle2, Save, Download, RefreshCw, Bookmark, ShieldCheck, ToggleLeft, ToggleRight, FileSearch, Check } from 'lucide-react';
import { ResumeData, JobMatchResponse, JobSnapshot, Entry, JobAnalysisResult, TruthfulnessAudit } from '../types.js';
import { runJobMatch, saveSnapshot, deleteSnapshot, analyzeJobDescription, tailorResumeSummary } from '../api.js';
import { ResumePreview } from './ResumePreview.js';

interface JobMatchStudioProps {
  data: ResumeData;
  onRefresh: () => void;
  onExportPdf: () => void;
}

export const JobMatchStudio: React.FC<JobMatchStudioProps> = ({
  data,
  onRefresh,
  onExportPdf
}) => {
  const { entries, snapshots, profile } = data;

  const [jobTitle, setJobTitle] = useState('Autonomous Robotics Firmware Intern');
  const [company, setCompany] = useState('AgriBotix Autonomy Labs');
  const [rawJobText, setRawJobText] = useState(
    `We are seeking a Robotics Engineering student or firmware engineer to develop and field-test autonomous navigation and sensor telemetry systems for agricultural surface robots.
Key Requirements:
- Proficiency in C/C++ for ARM Cortex-M microcontrollers (STM32, FreeRTOS).
- Experience with low-power RF communication protocols (LoRa/LoRaWAN, CAN bus, SPI, UART).
- Hands-on background in robotic state estimation and sensor fusion (Extended Kalman Filters, IMU, GPS).
- Familiarity with PCB schematic capture, 4-layer layout, and SMD soldering using KiCad.
- Knowledge of ROS 2 or Gazebo simulation is a strong plus.`
  );
  const [requirements, setRequirements] = useState('');

  const [isMatching, setIsMatching] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isTailoring, setIsTailoring] = useState(false);

  const [matchResult, setMatchResult] = useState<JobMatchResponse | null>(null);
  const [analysisResult, setAnalysisResult] = useState<JobAnalysisResult | null>(null);
  const [truthAudit, setTruthAudit] = useState<TruthfulnessAudit | null>(null);

  const [tailoredSummary, setTailoredSummary] = useState('');
  const [selectedEntryIds, setSelectedEntryIds] = useState<string[]>([]);
  const [snapshotName, setSnapshotName] = useState('');
  const [activeSnapshotId, setActiveSnapshotId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Core Feature B: Job Description Analysis
  const handleAnalyzeJob = async () => {
    if (!rawJobText.trim()) {
      setError('Please provide the job posting description.');
      return;
    }
    setIsAnalyzing(true);
    setError(null);
    try {
      const res = await analyzeJobDescription({
        raw_job_text: rawJobText.trim(),
        job_title: jobTitle.trim() || undefined,
        company: company.trim() || undefined
      });
      setAnalysisResult(res);
      if (res.job_title && res.job_title !== 'Target Position') setJobTitle(res.job_title);
      if (res.company) setCompany(res.company);
    } catch (err: any) {
      setError(err.message || 'Job analysis failed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Core Feature C: AI Job Matching
  const handleRunMatch = async () => {
    if (!rawJobText.trim()) {
      setError('Please paste the job description or requirements.');
      return;
    }

    setIsMatching(true);
    setError(null);

    try {
      const res = await runJobMatch({
        job_title: jobTitle.trim() || 'Target Position',
        company: company.trim() || undefined,
        raw_job_text: rawJobText.trim(),
        requirements: requirements.trim() || undefined
      });

      setMatchResult(res);
      setTailoredSummary(res.tailored_summary);
      setSelectedEntryIds(res.recommended_entry_ids);
      setSnapshotName(`Resume — ${jobTitle} @ ${company || 'Target'}`);

      // Auto-trigger Truthfulness Guardrail Audit
      const auditRes = await tailorResumeSummary({
        job_title: jobTitle.trim() || 'Target Position',
        company: company.trim() || undefined,
        matched_skills: res.extracted_skills,
        missing_skills: res.gaps
      });
      setTruthAudit(auditRes.audit);
      setTailoredSummary(auditRes.summary);
    } catch (err: any) {
      setError(err.message || 'Job match failed');
    } finally {
      setIsMatching(false);
    }
  };

  // Core Feature D: Truthful Resume Re-tailoring
  const handleRegenerateTruthfulSummary = async () => {
    if (!matchResult) return;
    setIsTailoring(true);
    try {
      const res = await tailorResumeSummary({
        job_title: jobTitle.trim() || 'Target Position',
        company: company.trim() || undefined,
        matched_skills: matchResult.extracted_skills,
        missing_skills: matchResult.gaps
      });
      setTailoredSummary(res.summary);
      setTruthAudit(res.audit);
    } catch (err: any) {
      alert(`Summary tailoring failed: ${err.message}`);
    } finally {
      setIsTailoring(false);
    }
  };

  const handleToggleEntry = (id: string) => {
    if (selectedEntryIds.includes(id)) {
      setSelectedEntryIds(selectedEntryIds.filter(eId => eId !== id));
    } else {
      setSelectedEntryIds([...selectedEntryIds, id]);
    }
  };

  const handleSaveSnapshot = async () => {
    if (!matchResult) return;
    try {
      await saveSnapshot({
        name: snapshotName.trim() || `Snapshot ${new Date().toLocaleDateString()}`,
        job_title: jobTitle,
        company,
        raw_job_text: rawJobText,
        extracted_skills: matchResult.extracted_skills,
        entry_scores: matchResult.entry_scores,
        gaps: matchResult.gaps,
        tailored_summary: tailoredSummary,
        selected_entry_ids: selectedEntryIds
      });
      onRefresh();
      alert('Snapshot saved successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to save snapshot');
    }
  };

  const handleLoadSnapshot = (snap: JobSnapshot) => {
    setActiveSnapshotId(snap.id);
    setJobTitle(snap.job_title);
    setCompany(snap.company || '');
    setRawJobText(snap.raw_job_text);
    setTailoredSummary(snap.tailored_summary);
    setSelectedEntryIds(snap.selected_entry_ids);
    setSnapshotName(snap.name);
    setMatchResult({
      job_title: snap.job_title,
      company: snap.company,
      extracted_skills: snap.extracted_skills,
      entry_scores: snap.entry_scores,
      gaps: snap.gaps,
      tailored_summary: snap.tailored_summary,
      recommended_entry_ids: snap.selected_entry_ids,
      model_used: 'snapshot'
    });
  };

  const handleDeleteSnapshot = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete this saved snapshot?')) {
      await deleteSnapshot(id);
      if (activeSnapshotId === id) setActiveSnapshotId(null);
      onRefresh();
    }
  };

  const topScores = matchResult
    ? Object.values(matchResult.entry_scores)
        .map(s => s.score)
        .sort((a, b) => b - a)
        .slice(0, 5)
    : [];
  const averageMatchPercent = topScores.length > 0
    ? Math.round((topScores.reduce((a, b) => a + b, 0) / topScores.length) * 100)
    : 0;

  return (
    <div className="w-full max-w-7xl mx-auto py-6 px-4 flex flex-col gap-6">
      {/* Top Banner */}
      <div className="nb-card p-5 bg-white border-2 border-[#171717] shadow-[4px_4px_0px_#171717] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-l-6 border-l-[#B8A5FF]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-[#B8A5FF] border-2 border-[#171717] shadow-[2px_2px_0px_#171717] flex items-center justify-center">
            <Target className="w-5 h-5 text-[#171717]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-display font-bold text-lg text-[#171717]">Job-Match & Tailoring Studio</h2>
              <span className="badge badge-green text-[10px] font-mono flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Anti-Hallucination Guardrail Active
              </span>
            </div>
            <p className="text-xs text-[#525252] font-medium">
              Extract requirements, compare profile evidence, and tailor resumes strictly grounded in your actual qualifications.
            </p>
          </div>
        </div>

        {/* Saved Snapshots list */}
        {snapshots.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto max-w-md pb-1">
            <span className="text-[11px] text-[#525252] font-mono font-bold whitespace-nowrap">Snapshots:</span>
            {snapshots.map(snap => (
              <div
                key={snap.id}
                onClick={() => handleLoadSnapshot(snap)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-bold cursor-pointer transition whitespace-nowrap border-2 border-[#171717] ${
                  activeSnapshotId === snap.id
                    ? 'bg-[#C6F564] text-[#171717] shadow-[2px_2px_0px_#171717]'
                    : 'bg-white text-[#171717] hover:bg-[#F7F5EC] shadow-[1px_1px_0px_#171717]'
                }`}
              >
                <Bookmark className="w-3 h-3 text-[#171717]" />
                <span>{snap.name}</span>
                <button
                  type="button"
                  onClick={(e) => handleDeleteSnapshot(snap.id, e)}
                  className="hover:text-[#BE123C] ml-1 font-bold"
                  title="Delete snapshot"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Job Posting Input (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="nb-card p-5 bg-white border-2 border-[#171717] shadow-[4px_4px_0px_#171717] flex flex-col gap-3.5">
            <div className="flex items-center justify-between pb-2 border-b-2 border-[#171717]">
              <h3 className="font-display font-bold text-sm text-[#171717] flex items-center gap-2">
                <Target className="w-4 h-4 text-[#171717]" />
                <span>Target Job Specification</span>
              </h3>
              <button
                onClick={handleAnalyzeJob}
                disabled={isAnalyzing}
                className="btn-secondary text-[11px] py-1 px-2.5 shadow-[2px_2px_0px_#171717]"
              >
                <FileSearch className="w-3.5 h-3.5 text-[#171717]" />
                {isAnalyzing ? 'Extracting...' : 'Extract Req'}
              </button>
            </div>

            {error && (
              <div className="p-2.5 rounded-md bg-[#FFF1F2] border-2 border-[#FF8066] text-[#BE123C] text-xs font-medium">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-bold text-[#525252] uppercase tracking-wider block mb-1">
                  Position Title
                </label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={e => setJobTitle(e.target.value)}
                  className="input-dark text-xs"
                  placeholder="e.g. Robotics Firmware Engineer"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#525252] uppercase tracking-wider block mb-1">
                  Company (Optional)
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  className="input-dark text-xs"
                  placeholder="e.g. AgriBotix Labs"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#525252] uppercase tracking-wider block mb-1">
                Full Job Posting / Description:
              </label>
              <textarea
                rows={6}
                value={rawJobText}
                onChange={e => setRawJobText(e.target.value)}
                className="input-dark text-xs font-mono resize-none leading-relaxed"
                placeholder="Paste the target job description here..."
              />
            </div>

            {/* Core Feature B: Extracted Requirements Review Card */}
            {analysisResult && (
              <div className="p-3.5 rounded-md bg-[#F7F5EC] border-2 border-[#171717] shadow-[3px_3px_0px_#171717] flex flex-col gap-2.5 text-xs">
                <div className="flex items-center justify-between pb-1 border-b border-[#171717]">
                  <span className="font-display font-bold text-[#171717] text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                    <FileSearch className="w-3.5 h-3.5 text-[#171717]" /> Extracted Requirements
                  </span>
                  <span className="badge badge-cyan text-[9px] font-mono">
                    {analysisResult.required_competencies.length} Req / {analysisResult.preferred_competencies.length} Pref
                  </span>
                </div>

                {analysisResult.required_competencies.length > 0 && (
                  <div>
                    <span className="text-[10px] text-[#BE123C] font-mono font-bold block mb-0.5">Mandatory Competencies:</span>
                    <ul className="list-disc pl-4 text-[11px] text-[#171717] space-y-1">
                      {analysisResult.required_competencies.slice(0, 4).map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysisResult.preferred_competencies.length > 0 && (
                  <div>
                    <span className="text-[10px] text-[#0284C7] font-mono font-bold block mb-0.5">Preferred Competencies:</span>
                    <ul className="list-disc pl-4 text-[11px] text-[#525252] space-y-1">
                      {analysisResult.preferred_competencies.slice(0, 3).map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleRunMatch}
              disabled={isMatching}
              className="w-full btn-primary text-xs py-2.5 flex items-center justify-center gap-2"
            >
              {isMatching ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Comparing Profile Evidence...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#171717]" />
                  <span>Match Qualifications & Tailor Resume</span>
                </>
              )}
            </button>
          </div>

          {/* Match Results & Scoring Insights */}
          {matchResult && (
            <div className="nb-card p-5 bg-white border-2 border-[#171717] shadow-[4px_4px_0px_#171717] flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b-2 border-[#171717]">
                <div>
                  <div className="text-[10px] font-mono font-bold text-[#525252] uppercase tracking-wider">
                    Alignment Score
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display font-bold text-3xl text-[#171717]">
                      {averageMatchPercent}%
                    </span>
                    <span className="text-xs text-[#525252] font-medium">Top-5 Entry Relevance</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] font-mono font-bold text-[#525252] uppercase tracking-wider">
                    Engine
                  </div>
                  <span className="badge badge-lavender text-[10px] font-mono">
                    {matchResult.model_used.includes('gemini') ? 'Gemini 1.5' : 'Grounded Heuristic'}
                  </span>
                </div>
              </div>

              {/* Matched Skills Chips */}
              <div>
                <div className="text-[11px] font-bold text-[#171717] mb-1.5 uppercase tracking-wider">
                  Target Skills Identified:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {matchResult.extracted_skills.map((skill, sIdx) => (
                    <span key={sIdx} className="badge badge-cyan text-[10px] font-mono">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Competency Gaps */}
              {matchResult.gaps.length > 0 && (
                <div className="p-3.5 rounded-md bg-[#FFF1F2] border-2 border-[#FF8066] shadow-[2px_2px_0px_#171717] flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#BE123C]">
                    <AlertCircle className="w-4 h-4 text-[#BE123C] shrink-0" />
                    <span>Identified Competency Gaps (Not Invented):</span>
                  </div>
                  <ul className="flex flex-col gap-1 text-[11px] text-[#171717] pl-2 font-medium">
                    {matchResult.gaps.map((gap, gIdx) => (
                      <li key={gIdx} className="flex items-start gap-1.5">
                        <span className="text-[#FF8066] font-bold">•</span>
                        <span>{gap}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tailored Professional Summary with Truthfulness Guardrail */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-[#171717] uppercase tracking-wider flex items-center gap-1.5">
                    Role-Tailored Professional Summary:
                  </label>
                  <button
                    onClick={handleRegenerateTruthfulSummary}
                    disabled={isTailoring}
                    className="btn-secondary text-[10px] py-0.5 px-2 shadow-[1px_1px_0px_#171717]"
                  >
                    <RefreshCw className={`w-3 h-3 ${isTailoring ? 'animate-spin' : ''}`} />
                    Strict Re-tailor
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={tailoredSummary}
                  onChange={e => setTailoredSummary(e.target.value)}
                  className="input-dark text-xs leading-relaxed"
                />

                {/* Truthfulness Audit Indicator */}
                {truthAudit && (
                  <div className="mt-2 p-2.5 rounded-md bg-[#F0FDF4] border-2 border-[#10B981] shadow-[2px_2px_0px_#171717] flex items-start gap-2 text-[11px]">
                    <ShieldCheck className="w-4 h-4 text-[#047857] shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span className="text-[#047857] font-bold block">Truthfulness Verification:</span>
                      <p className="text-[#171717] text-[10px]">{truthAudit.audit_note}</p>
                      {truthAudit.verified_user_claims.length > 0 && (
                        <span className="text-[9px] text-[#525252] font-mono block mt-0.5">
                          Verified claims: {truthAudit.verified_user_claims.slice(0, 4).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Save Snapshot Controls */}
              <div className="flex flex-col gap-2 pt-2 border-t-2 border-[#171717]">
                <label className="text-[11px] font-bold text-[#171717]">Snapshot Name</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={snapshotName}
                    onChange={e => setSnapshotName(e.target.value)}
                    className="input-dark text-xs flex-1"
                    placeholder="e.g. Robotics Intern @ Company"
                  />
                  <button
                    onClick={handleSaveSnapshot}
                    className="btn-secondary text-xs px-3 py-2 flex-shrink-0"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save</span>
                  </button>
                </div>
              </div>

              {/* Scored Entries Selection List */}
              <div>
                <div className="text-[11px] font-bold text-[#171717] mb-2 uppercase tracking-wider">
                  Relevance Ranking & Inclusions:
                </div>
                <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
                  {entries
                    .slice()
                    .sort((a, b) => ((matchResult.entry_scores[b.id]?.score ?? 0) - (matchResult.entry_scores[a.id]?.score ?? 0)))
                    .map(entry => {
                      const scoreInfo = matchResult.entry_scores[entry.id];
                      const isSelected = selectedEntryIds.includes(entry.id);
                      const pct = Math.round((scoreInfo?.score ?? 0.3) * 100);

                      return (
                        <div
                          key={entry.id}
                          onClick={() => handleToggleEntry(entry.id)}
                          className={`p-3 rounded-md border-2 border-[#171717] cursor-pointer transition flex items-center justify-between gap-2.5 ${
                            isSelected
                              ? 'bg-[#F7F5EC] shadow-[3px_3px_0px_#171717]'
                              : 'bg-white opacity-60 shadow-[1px_1px_0px_#171717]'
                          }`}
                        >
                          <div className="flex-1 flex flex-col gap-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-display font-bold text-xs text-[#171717]">
                                {entry.title}
                              </span>
                              <span
                                className={`badge text-[9px] ${
                                  pct >= 75 ? 'badge-green' : pct >= 50 ? 'badge-cyan' : 'badge-amber'
                                }`}
                              >
                                {pct}% Match
                              </span>
                            </div>
                            <p className="text-[11px] text-[#525252] line-clamp-1">
                              {scoreInfo?.rationale || entry.description}
                            </p>
                          </div>

                          <button
                            type="button"
                            className="text-[#171717]"
                          >
                            {isSelected ? (
                              <ToggleRight className="w-5 h-5 text-[#047857]" />
                            ) : (
                              <ToggleLeft className="w-5 h-5 text-[#737373]" />
                            )}
                          </button>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Pane: Live Tailored Resume Preview (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between px-2 gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#171717] uppercase tracking-wider font-display">
                Tailored Live Canvas
              </span>
              {matchResult && (
                <span className="badge badge-green text-[10px]">
                  Optimized for {jobTitle}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onExportPdf}
                className="btn-primary text-xs px-3 py-1.5"
              >
                <Download className="w-3.5 h-3.5 text-[#171717]" />
                <span>Export Tailored PDF</span>
              </button>
            </div>
          </div>

          <div className="w-full flex justify-center">
            <ResumePreview
              data={data}
              customSummary={tailoredSummary || undefined}
              filteredEntryIds={selectedEntryIds.length > 0 ? selectedEntryIds : undefined}
              isJobMatchView={Boolean(matchResult)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
