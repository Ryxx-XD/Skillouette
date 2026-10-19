import React, { useState, useEffect } from 'react';
import { Compass, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, Layers } from 'lucide-react';
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
      <div className="nb-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-l-8 border-l-[#B8A5FF]">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="badge badge-lavender text-xs font-mono">Core Feature G</span>
            <span className="badge badge-lime text-xs font-mono flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Transferable Competency Intelligence
            </span>
          </div>
          <h2 className="font-display font-black text-2xl text-[#171717] tracking-tight">
            Adjacent Career Pathways & Opportunities
          </h2>
          <p className="text-xs text-[#525252] max-w-2xl mt-1 font-medium">
            Discover realistic technical trajectories tailored to your documented engineering capabilities.
            Explore transferable strengths and transparently identify required bridging qualifications.
          </p>
        </div>

        <button
          onClick={handleGeneratePathways}
          disabled={loading}
          className="btn-primary text-xs py-2.5 px-4 flex items-center gap-2 font-bold shrink-0"
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
        <div className="p-4 rounded-md bg-[#FF8066]/20 border-2 border-[#171717] text-[#171717] text-xs font-semibold shadow-[2px_2px_0px_#171717]">
          {error}
        </div>
      )}

      {/* Pathways List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {pathways.map(path => (
          <div
            key={path.id}
            className="nb-card p-6 flex flex-col justify-between gap-5 transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_#171717]"
          >
            {/* Header: Title & Similarity score */}
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-mono font-bold text-[#525252] uppercase tracking-wider block">
                    Target Trajectory
                  </span>
                  <h3 className="font-display font-black text-xl text-[#171717]">{path.target_role}</h3>
                </div>
                <div className="text-right">
                  <div className="font-display font-black text-3xl text-[#171717]">
                    {path.similarity_score}%
                  </div>
                  <span className="text-[10px] font-mono font-bold text-[#525252]">Readiness Match</span>
                </div>
              </div>

              {/* Transferable Strengths */}
              <div className="flex flex-col gap-2 mt-2">
                <span className="text-[11px] font-mono font-bold text-[#171717] uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#171717]" /> Transferable Competencies:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {path.transferable_competencies.map((comp, idx) => (
                    <span key={idx} className="badge badge-lime text-[11px] font-bold">
                      {comp}
                    </span>
                  ))}
                </div>
              </div>

              {/* Remaining Skill Gaps */}
              {path.remaining_skill_gaps.length > 0 && (
                <div className="flex flex-col gap-2 mt-1">
                  <span className="text-[11px] font-mono font-bold text-[#171717] uppercase tracking-wider flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-[#171717]" /> Bridging Gaps:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {path.remaining_skill_gaps.map((gap, idx) => (
                      <span key={idx} className="badge badge-yellow text-[11px] font-bold">
                        {gap}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Learning Roadmap */}
              <div className="flex flex-col gap-2.5 mt-2 bg-[#F7F5EC] p-4 rounded-md border-2 border-[#171717] shadow-[2px_2px_0px_#171717]">
                <span className="text-[11px] font-mono font-bold text-[#171717] uppercase tracking-wider flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-[#171717]" /> Recommended Transition Roadmap:
                </span>
                <div className="flex flex-col gap-2">
                  {path.recommended_roadmap.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-[#171717] font-medium">
                      <ArrowRight className="w-4 h-4 text-[#171717] shrink-0 mt-0.5" />
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Disclaimer & Limitations */}
            <div className="pt-3 border-t-2 border-[#171717] text-[10px] text-[#525252] font-mono font-medium italic">
              Note: {path.limitations_disclaimer}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
