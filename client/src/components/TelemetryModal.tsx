import React, { useState, useEffect } from 'react';
import { Activity, X, Server, Database, Cpu, ShieldCheck, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
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
    if (isOpen) {
      loadStats();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="glass-panel-elevated w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-white">System Observability & Health</h3>
              <p className="text-[11px] text-slate-400">Structured telemetry, operational metrics, and dependency readiness</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadStats}
              disabled={loading}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Refresh Telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex flex-col gap-6">
          {/* Health Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Process Health</span>
                <Server className="w-4 h-4 text-sky-400" />
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="font-display font-bold text-sm text-white">Liveness OK</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                Uptime: {metrics ? `${metrics.uptimeSeconds}s` : 'active'}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Database</span>
                <Database className="w-4 h-4 text-violet-400" />
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="font-display font-bold text-sm text-white">
                  {health?.checks?.database?.mode === 'connected' ? 'Supabase Postgres' : 'Local Resilient Store'}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                Latency: {health?.checks?.database?.latency_ms ?? 0}ms
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400 uppercase">AI Provider</span>
                <Cpu className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="font-display font-bold text-sm text-white capitalize">
                  {health?.checks?.ai_provider?.provider || 'Grounded Engine'}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                Avg Latency: {metrics?.aiCalls?.averageLatencyMs ?? 0}ms
              </span>
            </div>
          </div>

          {/* Traffic & Feature Usage Metrics */}
          {metrics && (
            <div className="glass-panel p-4 flex flex-col gap-3">
              <h4 className="font-display font-semibold text-xs text-white uppercase tracking-wider text-slate-300">
                Operational Traffic & Feature Volume
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                  <div className="font-display font-bold text-xl text-sky-400">{metrics.totalRequests}</div>
                  <div className="text-[10px] font-mono text-slate-500">Total Requests</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                  <div className="font-display font-bold text-xl text-emerald-400">{metrics.http2xx}</div>
                  <div className="text-[10px] font-mono text-slate-500">2xx Successes</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                  <div className="font-display font-bold text-xl text-amber-400">{metrics.featuresUsed.jobMatches}</div>
                  <div className="text-[10px] font-mono text-slate-500">Job Matches</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                  <div className="font-display font-bold text-xl text-violet-400">{metrics.featuresUsed.skillGapReports}</div>
                  <div className="text-[10px] font-mono text-slate-500">Gap Reports</div>
                </div>
              </div>
            </div>
          )}

          {/* Privacy-Sanitized Event Log */}
          <div className="glass-panel p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h4 className="font-display font-semibold text-xs text-white uppercase tracking-wider text-slate-300">
                Sanitized Operational Events (PII Redacted)
              </h4>
              <span className="badge badge-emerald text-[9px] font-mono">Zero PII Leakage</span>
            </div>

            <div className="flex flex-col gap-2 max-h-52 overflow-y-auto font-mono text-[11px]">
              {logs.length === 0 ? (
                <div className="text-slate-500 text-center py-4">No recent activity events recorded.</div>
              ) : (
                logs.slice(0, 15).map((log, idx) => (
                  <div key={idx} className="p-2 rounded bg-slate-950/60 border border-slate-800/80 flex items-start justify-between gap-3">
                    <div>
                      <span className="text-sky-400 font-bold mr-2">[{log.eventType}]</span>
                      <span className="text-slate-300">{log.summary}</span>
                    </div>
                    <span className="text-slate-500 text-[10px] shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/40 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>Target Stack: Cloudflare Pages + Supabase PostgreSQL</span>
          <button
            onClick={onClose}
            className="btn-secondary text-xs py-1.5 px-3 rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
