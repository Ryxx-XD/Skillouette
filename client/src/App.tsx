import React, { useState, useEffect } from 'react';
import { Navbar, SkillouetteTab } from './components/Navbar.js';
import { ResumePreview } from './components/ResumePreview.js';
import { Dashboard } from './components/Dashboard.js';
import { JobMatchStudio } from './components/JobMatchStudio.js';
import { SkillGapsStudio } from './components/SkillGapsStudio.js';
import { CareerPathwaysStudio } from './components/CareerPathwaysStudio.js';
import { BrainDumpModal } from './components/BrainDumpModal.js';
import { QuickAddModal } from './components/QuickAddModal.js';
import { EditEntryModal } from './components/EditEntryModal.js';
import { SettingsModal } from './components/SettingsModal.js';
import { TelemetryModal } from './components/TelemetryModal.js';
import { fetchResumeData, updateProfile, updateSection } from './api.js';
import { ResumeData, Entry } from './types.js';
import { exportResumePdf, exportResumeDocx } from './services/exportService.js';
import { Sparkles, Eye, EyeOff, Edit3, User, Check, RefreshCw, Cpu, Layers } from 'lucide-react';

export const App: React.FC = () => {
  const [data, setData] = useState<ResumeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<SkillouetteTab>('builder');

  // Modals state
  const [isBrainDumpOpen, setIsBrainDumpOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTelemetryOpen, setIsTelemetryOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);

  // Profile quick-edit drawer state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    title: '',
    email: '',
    phone: '',
    location: '',
    github: '',
    linkedin: '',
    summary: ''
  });

  const loadData = async () => {
    try {
      const res = await fetchResumeData();
      setData(res);
      setProfileForm({
        name: res.profile.name,
        title: res.profile.title,
        email: res.profile.email,
        phone: res.profile.phone,
        location: res.profile.location || '',
        github: res.profile.github,
        linkedin: res.profile.linkedin,
        summary: res.profile.summary
      });
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to backend server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;
    try {
      await updateProfile(profileForm);
      setIsEditingProfile(false);
      loadData();
    } catch (err: any) {
      alert(`Error updating profile: ${err.message}`);
    }
  };

  const handleToggleSection = async (sectionId: string, currentVisible: boolean) => {
    try {
      await updateSection(sectionId, { is_visible: !currentVisible });
      loadData();
    } catch (err: any) {
      console.error('Failed to toggle section:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3 text-white">
        <RefreshCw className="w-8 h-8 text-sky-400 animate-spin" />
        <div className="font-display text-sm tracking-wide">Loading Robotics CV Studio...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white">
        <div className="glass-panel p-8 max-w-md flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
            ⚠️
          </div>
          <h2 className="font-display font-bold text-lg">Backend Connection Error</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Could not reach the local Express API at <code>http://localhost:3001/api</code>.
          </p>
          <p className="text-xs text-rose-300 font-mono">{error}</p>
          <button onClick={loadData} className="btn-primary text-xs px-4 py-2">
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenBrainDump={() => setIsBrainDumpOpen(true)}
        onOpenQuickAdd={() => setIsQuickAddOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenTelemetry={() => setIsTelemetryOpen(true)}
        onExportPdf={() => exportResumePdf(`${data.profile.name.replace(/\s+/g, '_')}_CV.pdf`)}
        onExportDocx={() => exportResumeDocx(data.profile.name)}
      />

      {/* Main App Workspace */}
      <main className="flex-1 w-full pb-16">
        {activeTab === 'builder' && (
          <div className="w-full max-w-7xl mx-auto py-6 px-4 grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Control Column (4 Cols) */}
            <div className="no-print lg:col-span-4 flex flex-col gap-4">
              {/* Brain Dump Callout Card */}
              <div className="glass-panel p-5 border-sky-500/30 bg-gradient-to-br from-sky-950/40 via-slate-900/60 to-slate-900/80 flex flex-col gap-3 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-center gap-2 text-sky-400">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span className="text-xs font-bold tracking-wide uppercase">AI Capture Loop</span>
                </div>
                <h3 className="font-display font-bold text-white text-base leading-tight">
                  Freeform Brain Dump
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Paste bullets, project updates, or raw thoughts. The AI model auto-classifies them into your robotics resume sections and dynamic skill subcategories.
                </p>
                <button
                  onClick={() => setIsBrainDumpOpen(true)}
                  className="btn-primary text-xs py-2.5 mt-1 shadow-sky-500/30"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Open Brain Dump Box</span>
                </button>
              </div>

              {/* Profile Card & Quick Edit */}
              <div className="glass-panel p-5 flex flex-col gap-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-sky-400" />
                    <h4 className="font-display font-semibold text-white text-sm">Personal Profile</h4>
                  </div>
                  <button
                    onClick={() => setIsEditingProfile(!isEditingProfile)}
                    className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>{isEditingProfile ? 'Close' : 'Edit'}</span>
                  </button>
                </div>

                {!isEditingProfile ? (
                  <div className="flex flex-col gap-2 text-xs">
                    <div>
                      <div className="font-bold text-white text-sm">{data.profile.name}</div>
                      <div className="text-sky-400 font-medium">{data.profile.title}</div>
                    </div>
                    <div className="text-slate-400 text-[11px] flex flex-col gap-0.5">
                      <div>📧 {data.profile.email}</div>
                      <div>📞 {data.profile.phone}</div>
                      {data.profile.location && <div>📍 {data.profile.location}</div>}
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 leading-relaxed italic">
                      "{data.profile.summary}"
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSaveProfile} className="flex flex-col gap-2.5 text-xs">
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase">Full Name</label>
                      <input
                        type="text"
                        value={profileForm.name}
                        onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                        className="input-dark text-xs py-1"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase">Tagline / Title</label>
                      <input
                        type="text"
                        value={profileForm.title}
                        onChange={e => setProfileForm({ ...profileForm, title: e.target.value })}
                        className="input-dark text-xs py-1"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase">Email</label>
                        <input
                          type="email"
                          value={profileForm.email}
                          onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                          className="input-dark text-xs py-1"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase">Phone</label>
                        <input
                          type="text"
                          value={profileForm.phone}
                          onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                          className="input-dark text-xs py-1"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase">Location</label>
                      <input
                        type="text"
                        value={profileForm.location}
                        onChange={e => setProfileForm({ ...profileForm, location: e.target.value })}
                        className="input-dark text-xs py-1"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase">Summary Paragraph</label>
                      <textarea
                        rows={3}
                        value={profileForm.summary}
                        onChange={e => setProfileForm({ ...profileForm, summary: e.target.value })}
                        className="input-dark text-xs py-1 leading-relaxed"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(false)}
                        className="btn-secondary text-[11px] py-1 px-2.5"
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn-primary text-[11px] py-1 px-3">
                        Save Profile
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Sections Visibility & Quick Toggles */}
              <div className="glass-panel p-5 flex flex-col gap-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-sky-400" />
                    <h4 className="font-display font-semibold text-white text-sm">Resume Sections</h4>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">Toggle Visibility</span>
                </div>

                <div className="flex flex-col gap-1.5">
                  {data.sections.map(sec => {
                    const count = data.entries.filter(e => e.section_id === sec.id).length;
                    return (
                      <div
                        key={sec.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-200 font-medium">{sec.name}</span>
                          {sec.id !== 'sec_ref' && (
                            <span className="text-[10px] text-slate-500 font-mono">({count})</span>
                          )}
                        </div>
                        <button
                          onClick={() => handleToggleSection(sec.id, sec.is_visible)}
                          className={`p-1 rounded transition ${
                            sec.is_visible
                              ? 'text-sky-400 hover:text-white'
                              : 'text-slate-600 hover:text-slate-400'
                          }`}
                          title={sec.is_visible ? 'Visible in CV' : 'Hidden in CV'}
                        >
                          {sec.is_visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: Live Resume Preview (8 Cols) */}
            <div className="lg:col-span-8 flex flex-col items-center gap-4">
              <div className="no-print w-full flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Live Document Canvas
                  </span>
                  <span className="badge badge-cyan text-[10px]">Reference CV Format</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => exportResumePdf(`${data.profile.name.replace(/\s+/g, '_')}_CV.pdf`)}
                    className="btn-primary text-xs px-3 py-1.5 shadow-sky-500/20"
                  >
                    Export PDF
                  </button>
                  <button
                    onClick={() => exportResumeDocx(data.profile.name)}
                    className="btn-secondary text-xs px-3 py-1.5"
                  >
                    Export DOCX
                  </button>
                </div>
              </div>

              {/* Render Canvas */}
              <ResumePreview
                data={data}
                onToggleSectionVisibility={handleToggleSection}
                onEditEntry={entry => setEditingEntry(entry)}
              />
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <Dashboard
            data={data}
            onRefresh={loadData}
            onEditEntry={entry => setEditingEntry(entry)}
            onOpenQuickAdd={() => setIsQuickAddOpen(true)}
          />
        )}

        {activeTab === 'jobmatch' && (
          <JobMatchStudio
            data={data}
            onRefresh={loadData}
            onExportPdf={() => exportResumePdf(`${data.profile.name.replace(/\s+/g, '_')}_Tailored_CV.pdf`)}
          />
        )}

        {activeTab === 'upskilling' && (
          <SkillGapsStudio
            data={data}
            onRefresh={loadData}
          />
        )}

        {activeTab === 'pathways' && (
          <CareerPathwaysStudio
            data={data}
            onRefresh={loadData}
          />
        )}
      </main>

      {/* Global Modals */}
      <BrainDumpModal
        isOpen={isBrainDumpOpen}
        onClose={() => setIsBrainDumpOpen(false)}
        sections={data.sections}
        subsections={data.subsections}
        onSuccess={loadData}
      />

      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        sections={data.sections}
        subsections={data.subsections}
        onSuccess={loadData}
      />

      {editingEntry && (
        <EditEntryModal
          entry={editingEntry}
          sections={data.sections}
          subsections={data.subsections}
          onClose={() => setEditingEntry(null)}
          onSuccess={loadData}
        />
      )}

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onRefresh={loadData}
      />

      <TelemetryModal
        isOpen={isTelemetryOpen}
        onClose={() => setIsTelemetryOpen(false)}
      />
    </div>
  );
};
