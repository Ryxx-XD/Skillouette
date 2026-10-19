import React, { useState } from 'react';
import { Target, CheckCircle2, AlertTriangle, XCircle, BookOpen, ExternalLink, PlayCircle, ArrowRight, RefreshCw, Sparkles, ShieldCheck } from 'lucide-react';
import { ResumeData, SkillGapReport, UpskillingRecommendation } from '../types.js';
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
      <div className="nb-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-l-8 border-l-[#82D9F5]">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="badge badge-sky text-xs font-mono">Core Features E & F</span>
            <span className="badge badge-lime text-xs font-mono flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Anti-Hallucination Grounded
            </span>
          </div>
          <h2 className="font-display font-black text-2xl text-[#171717] tracking-tight">
            Skill-Gap Analysis & Personalized Upskilling
          </h2>
          <p className="text-xs text-[#525252] max-w-2xl mt-1 font-medium">
            Compare target job requirements against your documented profile evidence. Never fabricated:
            missing skills are recognized as learning opportunities, not inflated claims.
          </p>
        </div>
      </div>

      {/* Input Form & Evaluation trigger */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 nb-card p-5 flex flex-col gap-4">
          <h3 className="font-display font-bold text-sm text-[#171717] flex items-center gap-2">
            <Target className="w-4 h-4 text-[#171717]" /> Target Job Specifications
          </h3>

          <div>
            <label className="text-[11px] font-mono font-bold text-[#525252] uppercase tracking-wider block mb-1">
              Target Position
            </label>
            <input
              type="text"
              value={jobTitle}
              onChange={e => setJobTitle(e.target.value)}
              className="w-full bg-white border-2 border-[#171717] rounded-md px-3 py-2 text-xs text-[#171717] font-semibold focus:outline-none focus:shadow-[2px_2px_0px_#171717]"
              placeholder="e.g. Autonomous Firmware Engineer"
            />
          </div>

          <div>
            <label className="text-[11px] font-mono font-bold text-[#525252] uppercase tracking-wider block mb-1">
              Company / Organization
            </label>
            <input
              type="text"
              value={company}
              onChange={e => setCompany(e.target.value)}
              className="w-full bg-white border-2 border-[#171717] rounded-md px-3 py-2 text-xs text-[#171717] font-semibold focus:outline-none focus:shadow-[2px_2px_0px_#171717]"
              placeholder="e.g. AgriBotix Autonomy Labs"
            />
          </div>

          <div>
            <label className="text-[11px] font-mono font-bold text-[#525252] uppercase tracking-wider block mb-1">
              Raw Job Description
            </label>
            <textarea
              rows={8}
              value={rawJobText}
              onChange={e => setRawJobText(e.target.value)}
              className="w-full bg-white border-2 border-[#171717] rounded-md p-3 text-xs text-[#171717] font-mono focus:outline-none focus:shadow-[2px_2px_0px_#171717] resize-none leading-relaxed"
              placeholder="Paste full job description requirements here..."
            />
          </div>

          <button
            onClick={handleRunGapAnalysis}
            disabled={loading}
            className="w-full btn-primary flex items-center justify-center gap-2 py-2.5 text-xs font-bold"
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
            <div className="p-3 rounded-md bg-[#FF8066]/20 border-2 border-[#171717] text-[#171717] text-xs font-semibold shadow-[2px_2px_0px_#171717]">
              {error}
            </div>
          )}
        </div>

        {/* Results Overview & Breakdown */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {!gapReport && !loading && (
            <div className="nb-card p-12 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-14 h-14 rounded-md bg-[#82D9F5] border-2 border-[#171717] flex items-center justify-center text-[#171717] shadow-[3px_3px_0px_#171717]">
                <Target className="w-7 h-7" />
              </div>
              <h4 className="font-display font-bold text-base text-[#171717]">No Gap Analysis Generated Yet</h4>
              <p className="text-xs text-[#525252] max-w-md font-medium">
                Paste a target job posting on the left and click "Run Competency Gap Analysis" to assess your documented qualifications against employer requirements.
              </p>
            </div>
          )}

          {gapReport && (
            <>
              {/* Score & Metrics Banner */}
              <div className="nb-card p-5 flex flex-col gap-4 border-l-8 border-l-[#C6F564]">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-mono font-bold text-[#525252] uppercase tracking-wider block">
                      Readiness Assessment
                    </span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="font-display font-black text-4xl text-[#171717]">
                        {gapReport.match_score}%
                      </span>
                      <span className="text-xs font-semibold text-[#525252]">Job Alignment Index</span>
                    </div>
                  </div>

                  {/* Classification Counters */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="badge badge-lime text-xs font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> {gapReport.demonstrated_count} Demonstrated
                    </span>
                    <span className="badge badge-yellow text-xs font-bold">
                      <AlertTriangle className="w-3.5 h-3.5 mr-1" /> {gapReport.partial_count} Partial
                    </span>
                    <span className="badge badge-coral text-xs font-bold">
                      <XCircle className="w-3.5 h-3.5 mr-1" /> {gapReport.missing_count} Gaps
                    </span>
                  </div>
                </div>

                {/* Score Calculation Formula Transparency */}
                <div className="p-3 rounded-md bg-[#F7F5EC] border-2 border-[#171717] text-[11px] text-[#171717] leading-relaxed font-mono shadow-[2px_2px_0px_#171717]">
                  <span className="font-bold text-[#171717] block mb-0.5 uppercase tracking-wide">
                    Scoring Methodology:
                  </span>
                  {gapReport.score_calculation_details}
                </div>

                <p className="text-xs text-[#171717] leading-relaxed italic bg-white p-3 rounded-md border-2 border-[#171717] shadow-[2px_2px_0px_#171717] font-medium">
                  "{gapReport.overall_fit_summary}"
                </p>
              </div>

              {/* Actionable Recommendations */}
              <div className="nb-card p-5 flex flex-col gap-3">
                <h4 className="font-display font-bold text-xs text-[#171717] uppercase tracking-wider">
                  Priority Strategic Recommendations
                </h4>
                <div className="flex flex-col gap-2">
                  {gapReport.actionable_recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 text-xs text-[#171717] font-medium bg-[#F7F5EC] p-3 rounded-md border-2 border-[#171717] shadow-[2px_2px_0px_#171717]"
                    >
                      <ArrowRight className="w-4 h-4 text-[#171717] shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Competencies Table with Filter */}
              <div className="nb-card p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h4 className="font-display font-bold text-sm text-[#171717]">
                    Competency Evidence Audit
                  </h4>
                  <div className="flex items-center gap-1 bg-[#FFFDF5] p-1 rounded-md border-2 border-[#171717] shadow-[2px_2px_0px_#171717] text-xs">
                    <button
                      onClick={() => setSelectedFilter('all')}
                      className={`px-2.5 py-1 rounded text-xs font-bold transition ${
                        selectedFilter === 'all'
                          ? 'bg-[#171717] text-white shadow-[1px_1px_0px_#171717]'
                          : 'text-[#171717] hover:bg-[#F2EFE7]'
                      }`}
                    >
                      All ({gapReport.gaps.length})
                    </button>
                    <button
                      onClick={() => setSelectedFilter('missing')}
                      className={`px-2.5 py-1 rounded text-xs font-bold transition ${
                        selectedFilter === 'missing'
                          ? 'bg-[#FF8066] text-[#171717] shadow-[1px_1px_0px_#171717]'
                          : 'text-[#171717] hover:bg-[#F2EFE7]'
                      }`}
                    >
                      Missing ({gapReport.missing_count})
                    </button>
                    <button
                      onClick={() => setSelectedFilter('partial')}
                      className={`px-2.5 py-1 rounded text-xs font-bold transition ${
                        selectedFilter === 'partial'
                          ? 'bg-[#FDE047] text-[#171717] shadow-[1px_1px_0px_#171717]'
                          : 'text-[#171717] hover:bg-[#F2EFE7]'
                      }`}
                    >
                      Partial ({gapReport.partial_count})
                    </button>
                    <button
                      onClick={() => setSelectedFilter('demonstrated')}
                      className={`px-2.5 py-1 rounded text-xs font-bold transition ${
                        selectedFilter === 'demonstrated'
                          ? 'bg-[#C6F564] text-[#171717] shadow-[1px_1px_0px_#171717]'
                          : 'text-[#171717] hover:bg-[#F2EFE7]'
                      }`}
                    >
                      Match ({gapReport.demonstrated_count})
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  {filteredGaps.map((gap, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-md border-2 border-[#171717] flex flex-col gap-2.5 shadow-[3px_3px_0px_#171717] transition-all ${
                        gap.classification === 'demonstrated_match'
                          ? 'bg-[#C6F564]/15'
                          : gap.classification === 'partially_demonstrated'
                          ? 'bg-[#FDE047]/20'
                          : 'bg-[#FF8066]/15'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="font-display font-bold text-xs text-[#171717]">
                            {gap.competency}
                          </span>
                          {gap.is_mandatory ? (
                            <span className="badge badge-coral text-[9px] uppercase font-mono">
                              Mandatory
                            </span>
                          ) : (
                            <span className="badge badge-sky text-[9px] uppercase font-mono">
                              Preferred
                            </span>
                          )}
                        </div>
                        <span
                          className={`badge text-[10px] uppercase font-mono font-bold ${
                            gap.classification === 'demonstrated_match'
                              ? 'badge-lime'
                              : gap.classification === 'partially_demonstrated'
                              ? 'badge-yellow'
                              : 'badge-coral'
                          }`}
                        >
                          {gap.classification.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="text-[11px] text-[#171717] leading-relaxed">
                        <span className="text-[#525252] font-bold block">Profile Evidence:</span>
                        {gap.user_evidence}
                      </div>

                      {gap.classification !== 'demonstrated_match' && (
                        <div className="text-[11px] text-[#171717] leading-relaxed bg-white p-2.5 rounded-md border-2 border-[#171717] shadow-[2px_2px_0px_#171717]">
                          <span className="font-bold text-[#171717] block">
                            Recommended Action:
                          </span>
                          {gap.readiness_actions}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Personalized Upskilling Roadmaps */}
              {recommendations.length > 0 && (
                <div className="nb-card p-5 flex flex-col gap-4 border-l-8 border-l-[#B8A5FF]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-display font-bold text-sm text-[#171717] flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-[#171717]" /> Grounded Upskilling Tracks
                      </h4>
                      <p className="text-xs text-[#525252] font-medium">
                        Curated learning sequences with verified resources to address your specific gaps.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recommendations.map(rec => {
                      const isTracked = trackedItems.some(
                        t => t.competency.toLowerCase() === rec.competency.toLowerCase()
                      );
                      const trackedItem = trackedItems.find(
                        t => t.competency.toLowerCase() === rec.competency.toLowerCase()
                      );

                      return (
                        <div
                          key={rec.id}
                          className="p-4 rounded-md bg-white border-2 border-[#171717] flex flex-col justify-between gap-3 shadow-[4px_4px_0px_#171717]"
                        >
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between gap-2">
                              <h5 className="font-display font-black text-xs text-[#171717]">
                                {rec.competency}
                              </h5>
                              {isTracked && (
                                <span
                                  className={`badge text-[9px] uppercase font-mono font-bold ${
                                    trackedItem?.status === 'completed'
                                      ? 'badge-lime'
                                      : trackedItem?.status === 'in_progress'
                                      ? 'badge-sky'
                                      : 'badge-secondary'
                                  }`}
                                >
                                  {trackedItem?.status.replace('_', ' ')}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-[#525252] font-medium leading-relaxed">
                              {rec.reason_it_matters}
                            </p>

                            {/* Verified Resources */}
                            <div className="flex flex-col gap-1.5 mt-1">
                              <span className="text-[10px] font-mono font-bold text-[#525252] uppercase tracking-wider">
                                Verified Resources:
                              </span>
                              {rec.verified_resources.map((res, rIdx) => (
                                <div
                                  key={rIdx}
                                  className="flex items-center justify-between text-[11px] bg-[#FFFDF5] p-2 rounded-md border-2 border-[#171717] shadow-[1px_1px_0px_#171717]"
                                >
                                  <div className="truncate mr-2">
                                    <span className="text-[#171717] font-bold block truncate">
                                      {res.title}
                                    </span>
                                    <span className="text-[9px] text-[#525252] font-mono">
                                      {res.provider} • {res.type}
                                    </span>
                                  </div>
                                  {res.url && (
                                    <a
                                      href={res.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-[#171717] hover:text-[#525252] shrink-0 p-1 border border-[#171717] rounded bg-white shadow-[1px_1px_0px_#171717]"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Tracker Action */}
                          <div className="pt-2 border-t-2 border-[#171717] flex items-center justify-between gap-2">
                            {!isTracked ? (
                              <button
                                onClick={() => handleTrackUpskilling(rec)}
                                className="w-full btn-secondary text-xs py-1.5 flex items-center justify-center gap-1.5 rounded-md"
                              >
                                <PlayCircle className="w-3.5 h-3.5 text-[#171717]" /> Start Tracking Skill
                              </button>
                            ) : (
                              <div className="w-full flex items-center gap-2">
                                <button
                                  onClick={() => handleUpdateStatus(trackedItem!.id, 'in_progress')}
                                  className={`flex-1 text-[10px] py-1 font-bold rounded-md border-2 border-[#171717] shadow-[2px_2px_0px_#171717] transition ${
                                    trackedItem?.status === 'in_progress'
                                      ? 'bg-[#82D9F5] text-[#171717]'
                                      : 'bg-white text-[#525252] hover:bg-[#F2EFE7]'
                                  }`}
                                >
                                  In Progress
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(trackedItem!.id, 'completed')}
                                  className={`flex-1 text-[10px] py-1 font-bold rounded-md border-2 border-[#171717] shadow-[2px_2px_0px_#171717] transition ${
                                    trackedItem?.status === 'completed'
                                      ? 'bg-[#C6F564] text-[#171717]'
                                      : 'bg-white text-[#525252] hover:bg-[#F2EFE7]'
                                  }`}
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
