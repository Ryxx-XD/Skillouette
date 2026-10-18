import React, { useState } from 'react';
import { Target, CheckCircle2, AlertTriangle, HelpCircle, XCircle, BookOpen, ExternalLink, PlayCircle, Check, ArrowRight, RefreshCw, Sparkles, ShieldCheck } from 'lucide-react';
import { ResumeData, SkillGapReport, SkillGapItem, UpskillingRecommendation } from '../types.js';
import { evaluateSkillGaps, saveUpskillingItem, updateUpskillingStatus } from '../api.js';

interface SkillGapsStudioProps {
  data: ResumeData;
  onRefresh: () => void;
}

export const SkillGapsStudio: React.FC<SkillGapsStudioProps> = ({ data, onRefresh }) => {
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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gapReport, setGapReport] = useState<SkillGapReport | null>(null);
  const [recommendations, setRecommendations] = useState<UpskillingRecommendation[]>([]);
  const [trackedItems, setTrackedItems] = useState<UpskillingRecommendation[]>(data.upskilling_items || []);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'missing' | 'partial' | 'demonstrated'>('all');

  const handleRunGapAnalysis = async () => {
    if (!rawJobText.trim()) {
      setError('Please provide a job description for analysis.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await evaluateSkillGaps({
        raw_job_text: rawJobText.trim(),
        job_title: jobTitle.trim() || 'Target Position',
        company: company.trim() || undefined
      });
      setGapReport(res.skill_gap_report);
      setRecommendations(res.upskilling_recommendations);
    } catch (err: any) {
      setError(err.message || 'Skill gap evaluation failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleTrackUpskilling = async (rec: UpskillingRecommendation) => {
    try {
      const saved = await saveUpskillingItem(rec);
      const updated = [...trackedItems.filter(t => t.id !== saved.id), saved];
      setTrackedItems(updated);
      onRefresh();
    } catch (err: any) {
      alert(`Failed to track upskilling: ${err.message}`);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: 'not_started' | 'in_progress' | 'completed') => {
    try {
      const updated = await updateUpskillingStatus(id, newStatus);
      setTrackedItems(trackedItems.map(t => t.id === id ? updated : t));
      onRefresh();
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  const filteredGaps = gapReport?.gaps.filter(g => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'missing') return g.classification === 'not_demonstrated';
    if (selectedFilter === 'partial') return g.classification === 'partially_demonstrated';
    if (selectedFilter === 'demonstrated') return g.classification === 'demonstrated_match';
    return true;
  }) || [];

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-6 py-6 px-4">
      {/* Top Hero Card */}
      <div className="glass-panel p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-l-4 border-l-sky-500">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge badge-cyan text-xs font-mono">Core Features E & F</span>
            <span className="badge badge-emerald text-xs font-mono flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Anti-Hallucination Grounded
            </span>
          </div>
          <h2 className="font-display font-bold text-2xl text-white">
            Skill-Gap Analysis & Personalized Upskilling
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl mt-1">
            Compare target job requirements against your documented profile evidence. Never fabricated:
            missing skills are recognized as learning opportunities, not inflated claims.
          </p>
        </div>
      </div>

      {/* Input Form & Evaluation trigger */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 glass-panel p-5 flex flex-col gap-4">
          <h3 className="font-display font-semibold text-sm text-white flex items-center gap-2">
            <Target className="w-4 h-4 text-sky-400" /> Target Job Specifications
          </h3>

          <div>
            <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">Target Position</label>
            <input
              type="text"
              value={jobTitle}
              onChange={e => setJobTitle(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
              placeholder="e.g. Autonomous Firmware Engineer"
            />
          </div>

          <div>
            <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">Company / Organization</label>
            <input
              type="text"
              value={company}
              onChange={e => setCompany(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
              placeholder="e.g. AgriBotix Autonomy Labs"
            />
          </div>

          <div>
            <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">Raw Job Description</label>
            <textarea
              rows={8}
              value={rawJobText}
              onChange={e => setRawJobText(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-700/80 rounded-lg p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-sky-500 resize-none leading-relaxed"
              placeholder="Paste full job description requirements here..."
            />
          </div>

          <button
            onClick={handleRunGapAnalysis}
            disabled={loading}
            className="w-full btn-primary flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-lg shadow-lg shadow-sky-500/20"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Evaluating Evidence...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> Run Competency Gap Analysis
              </>
            )}
          </button>

          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {error}
            </div>
          )}
        </div>

        {/* Results Overview & Breakdown */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {!gapReport && !loading && (
            <div className="glass-panel p-12 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <Target className="w-6 h-6" />
              </div>
              <h4 className="font-display font-bold text-base text-white">No Gap Analysis Generated Yet</h4>
              <p className="text-xs text-slate-400 max-w-md">
                Paste a target job posting on the left and click "Run Competency Gap Analysis" to assess your documented qualifications against employer requirements.
              </p>
            </div>
          )}

          {gapReport && (
            <>
              {/* Score & Metrics Banner */}
              <div className="glass-panel p-5 flex flex-col gap-4">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-mono text-slate-400">Readiness Score</span>
                    <div className="flex items-baseline gap-2">
                      <span className="font-display font-bold text-3xl text-sky-400">{gapReport.match_score}%</span>
                      <span className="text-xs text-slate-400">Job Alignment</span>
                    </div>
                  </div>

                  {/* Classification Counters */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="badge badge-emerald text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> {gapReport.demonstrated_count} Demonstrated
                    </span>
                    <span className="badge badge-amber text-xs">
                      <AlertTriangle className="w-3.5 h-3.5 mr-1" /> {gapReport.partial_count} Partial
                    </span>
                    <span className="badge badge-rose text-xs">
                      <XCircle className="w-3.5 h-3.5 mr-1" /> {gapReport.missing_count} Gaps
                    </span>
                  </div>
                </div>

                {/* Score Calculation Formula Transparency */}
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 leading-relaxed font-mono">
                  <span className="text-sky-400 font-bold block mb-0.5">Scoring Methodology:</span>
                  {gapReport.score_calculation_details}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed italic bg-slate-950/40 p-3 rounded-lg border border-slate-800/80">
                  "{gapReport.overall_fit_summary}"
                </p>
              </div>

              {/* Actionable Recommendations */}
              <div className="glass-panel p-5 flex flex-col gap-3">
                <h4 className="font-display font-semibold text-xs text-white uppercase tracking-wider text-slate-300">
                  Priority Strategic Recommendations
                </h4>
                <div className="flex flex-col gap-2">
                  {gapReport.actionable_recommendations.map((rec, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                      <ArrowRight className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Competencies Table with Filter */}
              <div className="glass-panel p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h4 className="font-display font-semibold text-sm text-white">Competency Evidence Audit</h4>
                  <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800 text-[11px]">
                    <button
                      onClick={() => setSelectedFilter('all')}
                      className={`px-2 py-1 rounded transition ${selectedFilter === 'all' ? 'bg-sky-500/20 text-sky-400 font-semibold' : 'text-slate-400 hover:text-white'}`}
                    >
                      All ({gapReport.gaps.length})
                    </button>
                    <button
                      onClick={() => setSelectedFilter('missing')}
                      className={`px-2 py-1 rounded transition ${selectedFilter === 'missing' ? 'bg-rose-500/20 text-rose-400 font-semibold' : 'text-slate-400 hover:text-white'}`}
                    >
                      Missing ({gapReport.missing_count})
                    </button>
                    <button
                      onClick={() => setSelectedFilter('partial')}
                      className={`px-2 py-1 rounded transition ${selectedFilter === 'partial' ? 'bg-amber-500/20 text-amber-400 font-semibold' : 'text-slate-400 hover:text-white'}`}
                    >
                      Partial ({gapReport.partial_count})
                    </button>
                    <button
                      onClick={() => setSelectedFilter('demonstrated')}
                      className={`px-2 py-1 rounded transition ${selectedFilter === 'demonstrated' ? 'bg-emerald-500/20 text-emerald-400 font-semibold' : 'text-slate-400 hover:text-white'}`}
                    >
                      Match ({gapReport.demonstrated_count})
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  {filteredGaps.map((gap, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border flex flex-col gap-2.5 transition-all ${
                        gap.classification === 'demonstrated_match'
                          ? 'bg-emerald-950/20 border-emerald-500/30'
                          : gap.classification === 'partially_demonstrated'
                          ? 'bg-amber-950/20 border-amber-500/30'
                          : 'bg-rose-950/20 border-rose-500/30'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="font-display font-semibold text-xs text-white">{gap.competency}</span>
                          {gap.is_mandatory ? (
                            <span className="badge badge-rose text-[9px] uppercase font-mono">Mandatory</span>
                          ) : (
                            <span className="badge badge-cyan text-[9px] uppercase font-mono">Preferred</span>
                          )}
                        </div>
                        <span
                          className={`badge text-[10px] uppercase font-mono ${
                            gap.classification === 'demonstrated_match'
                              ? 'badge-emerald'
                              : gap.classification === 'partially_demonstrated'
                              ? 'badge-amber'
                              : 'badge-rose'
                          }`}
                        >
                          {gap.classification.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-300 leading-relaxed">
                        <span className="text-slate-400 font-semibold block">Profile Evidence:</span>
                        {gap.user_evidence}
                      </div>

                      {gap.classification !== 'demonstrated_match' && (
                        <div className="text-[11px] text-slate-400 leading-relaxed bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/60">
                          <span className="text-amber-400/90 font-semibold block">Recommended Action:</span>
                          {gap.readiness_actions}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Personalized Upskilling Roadmaps */}
              {recommendations.length > 0 && (
                <div className="glass-panel p-5 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-display font-semibold text-sm text-white flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-sky-400" /> Grounded Upskilling Tracks
                      </h4>
                      <p className="text-xs text-slate-400">
                        Curated learning sequences with verified resources to address your specific gaps.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recommendations.map(rec => {
                      const isTracked = trackedItems.some(t => t.competency.toLowerCase() === rec.competency.toLowerCase());
                      const trackedItem = trackedItems.find(t => t.competency.toLowerCase() === rec.competency.toLowerCase());

                      return (
                        <div key={rec.id} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between gap-3">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between gap-2">
                              <h5 className="font-display font-bold text-xs text-white">{rec.competency}</h5>
                              {isTracked && (
                                <span className={`badge text-[9px] uppercase font-mono ${
                                  trackedItem?.status === 'completed' ? 'badge-emerald' : trackedItem?.status === 'in_progress' ? 'badge-cyan' : 'badge-slate'
                                }`}>
                                  {trackedItem?.status.replace('_', ' ')}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed">{rec.reason_it_matters}</p>

                            {/* Verified Resources */}
                            <div className="flex flex-col gap-1.5 mt-1">
                              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Verified Resources:</span>
                              {rec.verified_resources.map((res, rIdx) => (
                                <div key={rIdx} className="flex items-center justify-between text-[11px] bg-slate-950/60 p-2 rounded border border-slate-800">
                                  <div className="truncate mr-2">
                                    <span className="text-slate-300 font-medium block truncate">{res.title}</span>
                                    <span className="text-[9px] text-slate-500 font-mono">{res.provider} • {res.type}</span>
                                  </div>
                                  {res.url && (
                                    <a href={res.url} target="_blank" rel="noreferrer" className="text-sky-400 hover:text-sky-300 shrink-0">
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Tracker Action */}
                          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                            {!isTracked ? (
                              <button
                                onClick={() => handleTrackUpskilling(rec)}
                                className="w-full btn-secondary text-xs py-1.5 flex items-center justify-center gap-1.5 rounded-lg"
                              >
                                <PlayCircle className="w-3.5 h-3.5 text-sky-400" /> Start Tracking Skill
                              </button>
                            ) : (
                              <div className="w-full flex items-center gap-1.5">
                                <button
                                  onClick={() => handleUpdateStatus(trackedItem!.id, 'in_progress')}
                                  className={`flex-1 text-[10px] py-1 rounded transition ${trackedItem?.status === 'in_progress' ? 'bg-sky-500 text-white font-semibold' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                                >
                                  In Progress
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(trackedItem!.id, 'completed')}
                                  className={`flex-1 text-[10px] py-1 rounded transition ${trackedItem?.status === 'completed' ? 'bg-emerald-600 text-white font-semibold' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                                >
                                  Completed
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
