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
    <header className="no-print sticky top-0 z-40 w-full bg-[#FFFDF5] border-b-3 border-[#171717] px-4 py-3 shadow-[0px_4px_0px_rgba(23,23,23,0.06)]">
      <div className="max-w-7xl mx-auto flex flex-col xl:flex-row items-center justify-between gap-3">
        {/* Brand & Tagline */}
        <div className="flex items-center gap-3 w-full xl:w-auto justify-between xl:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-md bg-[#C6F564] border-2 border-[#171717] shadow-[2px_2px_0px_#171717] flex items-center justify-center">
              <Bot className="w-5 h-5 text-[#171717]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-bold text-lg text-[#171717] tracking-tight">
                  Skill<span className="underline decoration-[#C6F564] decoration-4 underline-offset-2">ouette</span>
                </h1>
                <span className="badge badge-cyan text-[10px] font-mono">v1.0 Production</span>
              </div>
              <p className="text-[11px] text-[#525252] font-medium">AI Career & Workforce Readiness Platform</p>
            </div>
          </div>

          {/* Quick Actions on Mobile */}
          <div className="flex items-center gap-1.5 xl:hidden">
            <button
              onClick={onOpenTelemetry}
              className="p-1.5 rounded-md border-2 border-[#171717] bg-white shadow-[2px_2px_0px_#171717] text-[#171717] hover:bg-[#F7F5EC] transition"
              title="Telemetry & Health"
            >
              <Activity className="w-4 h-4 text-[#047857]" />
            </button>
            <button
              onClick={onOpenSettings}
              className="p-1.5 rounded-md border-2 border-[#171717] bg-white shadow-[2px_2px_0px_#171717] text-[#171717] hover:bg-[#F7F5EC] transition"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center Mode Switcher Tabs */}
        <nav className="flex items-center bg-white p-1 rounded-md border-2 border-[#171717] shadow-[3px_3px_0px_#171717] overflow-x-auto max-w-full gap-1">
          <button
            onClick={() => setActiveTab('builder')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-bold whitespace-nowrap transition border-2 ${
              activeTab === 'builder'
                ? 'bg-[#C6F564] text-[#171717] border-[#171717] shadow-[2px_2px_0px_#171717]'
                : 'text-[#171717] border-transparent hover:bg-[#F7F5EC]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Profile & Resume
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-bold whitespace-nowrap transition border-2 ${
              activeTab === 'dashboard'
                ? 'bg-[#82D9F5] text-[#171717] border-[#171717] shadow-[2px_2px_0px_#171717]'
                : 'text-[#171717] border-transparent hover:bg-[#F7F5EC]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Entries
          </button>

          <button
            onClick={() => setActiveTab('jobmatch')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-bold whitespace-nowrap transition border-2 ${
              activeTab === 'jobmatch'
                ? 'bg-[#B8A5FF] text-[#171717] border-[#171717] shadow-[2px_2px_0px_#171717]'
                : 'text-[#171717] border-transparent hover:bg-[#F7F5EC]'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            Job-Match & Tailor
          </button>

          <button
            onClick={() => setActiveTab('upskilling')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-bold whitespace-nowrap transition border-2 ${
              activeTab === 'upskilling'
                ? 'bg-[#FF8066] text-[#171717] border-[#171717] shadow-[2px_2px_0px_#171717]'
                : 'text-[#171717] border-transparent hover:bg-[#F7F5EC]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Skill Gaps & Upskilling
          </button>

          <button
            onClick={() => setActiveTab('pathways')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-bold whitespace-nowrap transition border-2 ${
              activeTab === 'pathways'
                ? 'bg-[#FDE047] text-[#171717] border-[#171717] shadow-[2px_2px_0px_#171717]'
                : 'text-[#171717] border-transparent hover:bg-[#F7F5EC]'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            Career Pathways
          </button>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 w-full xl:w-auto justify-end">
          <button
            onClick={onOpenBrainDump}
            className="btn-primary text-xs px-3 py-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#171717]" />
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

          {/* Export Buttons */}
          <div className="flex items-center gap-1.5 ml-1 pl-2 border-l-2 border-[#171717]">
            <button
              onClick={onExportPdf}
              disabled={isExporting}
              className="btn-secondary text-xs px-2.5 py-1.5"
              title="Export Print-Ready PDF"
            >
              <Download className="w-3.5 h-3.5 text-[#171717]" />
              <span>PDF</span>
            </button>
            <button
              onClick={onExportDocx}
              disabled={isExporting}
              className="btn-secondary text-xs px-2.5 py-1.5"
              title="Export Microsoft Word DOCX"
            >
              <Download className="w-3.5 h-3.5 text-[#171717]" />
              <span>DOCX</span>
            </button>
            <button
              onClick={onOpenTelemetry}
              className="hidden xl:flex p-1.5 rounded-md border-2 border-[#171717] bg-white shadow-[2px_2px_0px_#171717] text-[#171717] hover:bg-[#F7F5EC] transition"
              title="System Observability & Health"
            >
              <Activity className="w-4 h-4 text-[#047857]" />
            </button>
            <button
              onClick={onOpenSettings}
              className="hidden xl:flex p-1.5 rounded-md border-2 border-[#171717] bg-white shadow-[2px_2px_0px_#171717] text-[#171717] hover:bg-[#F7F5EC] transition"
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
