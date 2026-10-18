import React from 'react';
import { Bot, Sparkles, FileText, Layers, Target, Settings, Download, Plus, Activity, BookOpen, Compass } from 'lucide-react';

export type SkillouetteTab = 'builder' | 'dashboard' | 'jobmatch' | 'upskilling' | 'pathways';

interface NavbarProps {
  activeTab: SkillouetteTab;
  setActiveTab: (tab: SkillouetteTab) => void;
  onOpenBrainDump: () => void;
  onOpenQuickAdd: () => void;
  onOpenSettings: () => void;
  onOpenTelemetry: () => void;
  onExportPdf: () => void;
  onExportDocx: () => void;
  isExporting?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenBrainDump,
  onOpenQuickAdd,
  onOpenSettings,
  onOpenTelemetry,
  onExportPdf,
  onExportDocx,
  isExporting
}) => {
  return (
    <header className="no-print sticky top-0 z-40 w-full glass-panel-elevated border-b border-slate-800/80 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col xl:flex-row items-center justify-between gap-3">
        {/* Brand & Tagline */}
        <div className="flex items-center gap-3 w-full xl:w-auto justify-between xl:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 via-cyan-400 to-indigo-500 p-0.5 shadow-lg shadow-sky-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Bot className="w-5 h-5 text-sky-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-display font-bold text-lg text-white tracking-tight">
                  Skill<span className="text-sky-400">ouette</span>
                </h1>
                <span className="badge badge-cyan text-[10px] font-mono">v1.0 Production</span>
              </div>
              <p className="text-[11px] text-slate-400">AI Career & Workforce Readiness Platform</p>
            </div>
          </div>

          {/* Quick Actions on Mobile */}
          <div className="flex items-center gap-1 xl:hidden">
            <button
              onClick={onOpenTelemetry}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
              title="Telemetry & Health"
            >
              <Activity className="w-4 h-4 text-emerald-400" />
            </button>
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center Mode Switcher Tabs */}
        <nav className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 shadow-inner overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('builder')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              activeTab === 'builder'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Profile & Resume
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              activeTab === 'dashboard'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Entries
          </button>

          <button
            onClick={() => setActiveTab('jobmatch')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              activeTab === 'jobmatch'
                ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md shadow-teal-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Target className="w-3.5 h-3.5 text-emerald-300" />
            Job-Match & Tailor
          </button>

          <button
            onClick={() => setActiveTab('upskilling')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              activeTab === 'upskilling'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-300" />
            Skill Gaps & Upskilling
          </button>

          <button
            onClick={() => setActiveTab('pathways')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              activeTab === 'pathways'
                ? 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-md shadow-violet-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-violet-300" />
            Career Pathways
          </button>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 w-full xl:w-auto justify-end">
          <button
            onClick={onOpenBrainDump}
            className="btn-primary text-xs px-3 py-1.5 shadow-sky-500/30"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin-slow" />
            <span>Brain Dump</span>
          </button>

          <button
            onClick={onOpenQuickAdd}
            className="btn-secondary text-xs px-2.5 py-1.5"
            title="Quick structured add"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Quick Add</span>
          </button>

          {/* Export Dropdown / Buttons */}
          <div className="flex items-center gap-1.5 ml-1 pl-2 border-l border-slate-700/60">
            <button
              onClick={onExportPdf}
              disabled={isExporting}
              className="btn-secondary text-xs px-2 py-1.5 text-slate-200 hover:text-white"
              title="Export Print-Ready PDF"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span>PDF</span>
            </button>
            <button
              onClick={onExportDocx}
              disabled={isExporting}
              className="btn-secondary text-xs px-2 py-1.5 text-slate-200 hover:text-white"
              title="Export Microsoft Word DOCX"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>DOCX</span>
            </button>
            <button
              onClick={onOpenTelemetry}
              className="hidden xl:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
              title="System Observability & Health"
            >
              <Activity className="w-4 h-4 text-emerald-400" />
            </button>
            <button
              onClick={onOpenSettings}
              className="hidden xl:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
              title="System & AI Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
