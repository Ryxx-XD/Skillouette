import React, { useState, useEffect } from 'react';
import { Compass, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle, Sparkles, RefreshCw, Layers, Award } from 'lucide-react';
import { ResumeData, CareerPathway } from '../types.js';
import { generateCareerPathways } from '../api.js';

interface CareerPathwaysStudioProps {
  data: ResumeData;
  onRefresh: () => void;
}

export const CareerPathwaysStudio: React.FC<CareerPathwaysStudioProps> = ({ data, onRefresh }) => {
  const [pathways, setPathways] = useState<CareerPathway[]>(data.pathways || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGeneratePathways = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await generateCareerPathways();
      setPathways(res);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to generate pathways.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if ((!pathways || pathways.length === 0) && data.entries.length > 0) {
      handleGeneratePathways();
    }
  }, []);

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-6 py-6 px-4">
      {/* Top Hero Banner */}
      <div className="glass-panel p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-l-4 border-l-violet-500">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge badge-cyan text-xs font-mono">Core Feature G</span>
            <span className="badge badge-emerald text-xs font-mono flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Transferable Competency Intelligence
            </span>
          </div>
          <h2 className="font-display font-bold text-2xl text-white">
            Adjacent Career Pathways & Opportunities
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl mt-1">
            Discover realistic technical trajectories tailored to your documented engineering capabilities.
            Explore transferable strengths and transparently identify required bridging qualifications.
          </p>
        </div>

        <button
          onClick={handleGeneratePathways}
          disabled={loading}
          className="btn-primary text-xs py-2.5 px-4 flex items-center gap-2 rounded-lg shadow-lg shadow-sky-500/20"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" /> Evaluating Profile...
            </>
          ) : (
            <>
              <Compass className="w-4 h-4" /> Recalculate Trajectories
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
          {error}
        </div>
      )}

      {/* Pathways List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {pathways.map(path => (
          <div key={path.id} className="glass-panel p-6 flex flex-col justify-between gap-5 transition-all hover:border-slate-700">
            {/* Header: Title & Similarity score */}
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Target Trajectory</span>
                  <h3 className="font-display font-bold text-lg text-white">{path.target_role}</h3>
                </div>
                <div className="text-right">
                  <div className="font-display font-bold text-xl text-sky-400">{path.similarity_score}%</div>
                  <span className="text-[10px] font-mono text-slate-400">Readiness Match</span>
                </div>
              </div>

              {/* Transferable Strengths */}
              <div className="flex flex-col gap-1.5 mt-2">
                <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Transferable Competencies:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {path.transferable_competencies.map((comp, idx) => (
                    <span key={idx} className="badge badge-emerald text-[11px]">
                      {comp}
                    </span>
                  ))}
                </div>
              </div>

              {/* Remaining Skill Gaps */}
              {path.remaining_skill_gaps.length > 0 && (
                <div className="flex flex-col gap-1.5 mt-1">
                  <span className="text-[11px] font-mono text-amber-400 uppercase tracking-wider flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Bridging Gaps:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {path.remaining_skill_gaps.map((gap, idx) => (
                      <span key={idx} className="badge badge-amber text-[11px]">
                        {gap}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Learning Roadmap */}
              <div className="flex flex-col gap-2 mt-2 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                <span className="text-[11px] font-mono text-sky-400 uppercase tracking-wider flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5" /> Recommended Transition Roadmap:
                </span>
                <div className="flex flex-col gap-1.5">
                  {path.recommended_roadmap.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-[11px] text-slate-300">
                      <ArrowRight className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Disclaimer & Limitations */}
            <div className="pt-3 border-t border-slate-800/80 text-[10px] text-slate-400 font-mono italic">
              Note: {path.limitations_disclaimer}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
