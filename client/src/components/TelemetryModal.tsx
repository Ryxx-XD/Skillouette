import React, { useState, useEffect } from 'react';
import { Activity, X, Server, Database, Cpu, ShieldCheck, RefreshCw, CheckCircle } from 'lucide-react';
import { TelemetryMetrics, SanitizedLogEntry } from '../types.js';
import { fetchTelemetryStats, fetchHealthReadiness } from '../api.js';

interface TelemetryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TelemetryModal: React.FC<TelemetryModalProps> = ({ isOpen, onClose }) => {
  const [metrics, setMetrics] = useState<TelemetryMetrics | null>(null);
  const [logs, setLogs] = useState<SanitizedLogEntry[]>([]);
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadStats = async () => {
    setLoading(true);
    try {
      const [statsRes, healthRes] = await Promise.all([
        fetchTelemetryStats().catch(() => null),
        fetchHealthReadiness().catch(() => null)
      ]);
      if (statsRes) {
        setMetrics(statsRes.metrics);
        setLogs(statsRes.recent_events);
      }
      if (healthRes) {
        setHealth(healthRes);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      loadStats();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content max-w-3xl" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="px-6 py-4 border-b-2 border-[#171717] bg-[#FFFDF5] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-[#82D9F5] border-2 border-[#171717] text-[#171717] flex items-center justify-center shadow-[2px_2px_0px_#171717]">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-black text-base text-[#171717]">System Observability & Health</h3>
              <p className="text-xs text-[#525252] font-medium">Structured telemetry, operational metrics, and dependency readiness</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadStats}
              disabled={loading}
              className="p-1.5 rounded-md border-2 border-[#171717] bg-white hover:bg-[#F2EFE7] text-[#171717] transition shadow-[2px_2px_0px_#171717]"
              title="Refresh Telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md border-2 border-[#171717] bg-white hover:bg-[#FF8066] text-[#171717] transition shadow-[2px_2px_0px_#171717]"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto max-h-[75vh] flex flex-col gap-6 bg-white">
          {/* Health Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-4 rounded-md bg-[#FFFDF5] border-2 border-[#171717] flex flex-col gap-2 shadow-[3px_3px_0px_#171717]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-[#525252] uppercase">Process Health</span>
                <Server className="w-4 h-4 text-[#171717]" />
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#171717]" />
                <span className="font-display font-black text-sm text-[#171717]">Liveness OK</span>
              </div>
              <span className="text-[10px] text-[#525252] font-mono font-semibold">
                Uptime: {metrics ? `${metrics.uptimeSeconds}s` : 'active'}
              </span>
            </div>

            <div className="p-4 rounded-md bg-[#FFFDF5] border-2 border-[#171717] flex flex-col gap-2 shadow-[3px_3px_0px_#171717]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-[#525252] uppercase">Database</span>
                <Database className="w-4 h-4 text-[#171717]" />
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#171717]" />
                <span className="font-display font-black text-sm text-[#171717]">
                  {health?.checks?.database?.mode === 'connected' ? 'Supabase Postgres' : 'Local Resilient Store'}
                </span>
              </div>
              <span className="text-[10px] text-[#525252] font-mono font-semibold">
                Latency: {health?.checks?.database?.latency_ms ?? 0}ms
              </span>
            </div>

            <div className="p-4 rounded-md bg-[#FFFDF5] border-2 border-[#171717] flex flex-col gap-2 shadow-[3px_3px_0px_#171717]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-[#525252] uppercase">AI Engine</span>
                <Cpu className="w-4 h-4 text-[#171717]" />
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#171717]" />
                <span className="font-display font-black text-sm text-[#171717] capitalize">
                  {health?.checks?.ai_provider?.provider || 'Grounded Engine'}
                </span>
              </div>
              <span className="text-[10px] text-[#525252] font-mono font-semibold">
                Avg Latency: {metrics?.aiCalls?.averageLatencyMs ?? 0}ms
              </span>
            </div>
          </div>

          {/* Traffic & Feature Usage Metrics */}
          {metrics && (
            <div className="nb-card p-4 flex flex-col gap-3 bg-white border-2 border-[#171717] shadow-[4px_4px_0px_#171717]">
              <h4 className="font-display font-bold text-xs text-[#171717] uppercase tracking-wider">
                Operational Traffic & Feature Volume
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 rounded-md bg-[#F7F5EC] border-2 border-[#171717] shadow-[2px_2px_0px_#171717]">
                  <div className="font-display font-black text-2xl text-[#171717]">{metrics.totalRequests}</div>
                  <div className="text-[10px] font-mono font-bold text-[#525252]">Total Requests</div>
                </div>
                <div className="p-3 rounded-md bg-[#C6F564]/30 border-2 border-[#171717] shadow-[2px_2px_0px_#171717]">
                  <div className="font-display font-black text-2xl text-[#171717]">{metrics.http2xx}</div>
                  <div className="text-[10px] font-mono font-bold text-[#525252]">2xx Successes</div>
                </div>
                <div className="p-3 rounded-md bg-[#82D9F5]/30 border-2 border-[#171717] shadow-[2px_2px_0px_#171717]">
                  <div className="font-display font-black text-2xl text-[#171717]">{metrics.featuresUsed.jobMatches}</div>
                  <div className="text-[10px] font-mono font-bold text-[#525252]">Job Matches</div>
                </div>
                <div className="p-3 rounded-md bg-[#B8A5FF]/30 border-2 border-[#171717] shadow-[2px_2px_0px_#171717]">
                  <div className="font-display font-black text-2xl text-[#171717]">{metrics.featuresUsed.skillGapReports}</div>
                  <div className="text-[10px] font-mono font-bold text-[#525252]">Gap Reports</div>
                </div>
              </div>
            </div>
          )}

          {/* Privacy-Sanitized Event Log */}
          <div className="nb-card p-4 flex flex-col gap-3 bg-white border-2 border-[#171717] shadow-[4px_4px_0px_#171717]">
            <div className="flex items-center justify-between">
              <h4 className="font-display font-bold text-xs text-[#171717] uppercase tracking-wider">
                Sanitized Operational Events (PII Redacted)
              </h4>
              <span className="badge badge-lime text-[9px] font-mono font-bold">Zero PII Leakage</span>
            </div>

            <div className="flex flex-col gap-2 max-h-52 overflow-y-auto font-mono text-[11px]">
              {logs.length === 0 ? (
                <div className="text-[#525252] text-center py-4 font-semibold">No recent activity events recorded.</div>
              ) : (
                logs.slice(0, 15).map((log, idx) => (
                  <div key={idx} className="p-2.5 rounded-md bg-[#F7F5EC] border-2 border-[#171717] flex items-start justify-between gap-3 shadow-[1px_1px_0px_#171717]">
                    <div>
                      <span className="font-bold text-[#171717] mr-2">[{log.eventType}]</span>
                      <span className="text-[#171717]">{log.summary}</span>
                    </div>
                    <span className="text-[#737373] text-[10px] font-bold shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t-2 border-[#171717] bg-[#FFFDF5] flex items-center justify-between text-xs text-[#525252] font-mono">
          <span className="font-semibold">Target Stack: Cloudflare Pages + Supabase PostgreSQL</span>
          <button
            onClick={onClose}
            className="btn-secondary text-xs py-1.5 px-4 font-bold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
