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
      <div className="min-h-screen bg-[#FFFDF5] flex flex-col items-center justify-center gap-3 text-[#171717]">
        <div className="w-14 h-14 rounded-md bg-[#C6F564] border-3 border-[#171717] shadow-[4px_4px_0px_#171717] flex items-center justify-center">
          <RefreshCw className="w-7 h-7 text-[#171717] animate-spin" />
        </div>
        <div className="font-display font-bold text-base tracking-tight">Loading Skillouette Studio...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#FFFDF5] flex flex-col items-center justify-center p-6 text-center text-[#171717]">
        <div className="nb-card p-8 max-w-md flex flex-col items-center gap-4 bg-white border-3 border-[#171717] shadow-[6px_6px_0px_#171717]">
          <div className="w-14 h-14 rounded-md bg-[#FF8066] border-2 border-[#171717] shadow-[3px_3px_0px_#171717] text-[#171717] flex items-center justify-center text-2xl font-bold">
            !
          </div>
          <h2 className="font-display font-bold text-xl">Backend Connection Error</h2>
          <p className="text-xs text-[#525252] leading-relaxed">
            Could not reach the local Express API at <code>http://localhost:3001/api</code>.
          </p>
          <p className="text-xs text-[#BE123C] font-mono bg-[#FFF1F2] p-2 border-2 border-[#FF8066] rounded-md">{error}</p>
          <button onClick={loadData} className="btn-primary text-xs px-5 py-2.5">
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFDF5] text-[#171717] flex flex-col">
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
              <div className="nb-card p-5 bg-[#C6F564] border-2 border-[#171717] shadow-[4px_4px_0px_#171717] flex flex-col gap-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#171717]" />
                    <span className="badge badge-sky text-[10px] uppercase font-bold tracking-wider">AI Capture Loop</span>
                  </div>
                </div>
                <h3 className="font-display font-bold text-[#171717] text-lg leading-tight">
                  Freeform Brain Dump
                </h3>
                <p className="text-xs text-[#171717] font-medium leading-relaxed">
                  Paste bullets, project notes, or raw milestones. The AI automatically classifies them into your resume sections and skill matrices.
                </p>
                <button
                  onClick={() => setIsBrainDumpOpen(true)}
                  className="btn-secondary text-xs py-2 mt-1 shadow-[3px_3px_0px_#171717]"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#171717]" />
                  <span>Open Brain Dump Box</span>
                </button>
              </div>

              {/* Profile Card & Quick Edit */}
              <div className="nb-card p-5 bg-white border-2 border-[#171717] shadow-[4px_4px_0px_#171717] flex flex-col gap-3">
                <div className="flex items-center justify-between pb-2 border-b-2 border-[#171717]">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-[#82D9F5] border border-[#171717] flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-[#171717]" />
                    </div>
                    <h4 className="font-display font-bold text-sm text-[#171717]">Personal Profile</h4>
                  </div>
                  <button
                    onClick={() => setIsEditingProfile(!isEditingProfile)}
                    className="btn-secondary text-[11px] py-1 px-2.5 shadow-[2px_2px_0px_#171717]"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>{isEditingProfile ? 'Close' : 'Edit'}</span>
                  </button>
                </div>

                {!isEditingProfile ? (
                  <div className="flex flex-col gap-2.5 text-xs">
                    <div>
                      <div className="font-display font-bold text-base text-[#171717]">{data.profile.name}</div>
                      <div className="text-[#0284C7] font-bold text-xs">{data.profile.title}</div>
                    </div>
                    <div className="text-[#525252] text-[11px] flex flex-col gap-1 font-mono">
                      <div>📧 {data.profile.email}</div>
                      <div>📞 {data.profile.phone}</div>
                      {data.profile.location && <div>📍 {data.profile.location}</div>}
                    </div>
                    <div className="p-3 rounded-md bg-[#F7F5EC] border-2 border-[#171717] text-[11px] text-[#171717] leading-relaxed italic shadow-[2px_2px_0px_#171717]">
                      "{data.profile.summary}"
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSaveProfile} className="flex flex-col gap-2.5 text-xs">
                    <div>
                      <label className="text-[10px] font-bold text-[#525252] uppercase block mb-1">Full Name</label>
                      <input
                        type="text"
                        value={profileForm.name}
                        onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                        className="input-dark text-xs py-1.5"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#525252] uppercase block mb-1">Tagline / Title</label>
                      <input
                        type="text"
                        value={profileForm.title}
                        onChange={e => setProfileForm({ ...profileForm, title: e.target.value })}
                        className="input-dark text-xs py-1.5"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-[#525252] uppercase block mb-1">Email</label>
                        <input
                          type="email"
                          value={profileForm.email}
                          onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                          className="input-dark text-xs py-1.5"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-[#525252] uppercase block mb-1">Phone</label>
                        <input
                          type="text"
                          value={profileForm.phone}
                          onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                          className="input-dark text-xs py-1.5"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#525252] uppercase block mb-1">Location</label>
                      <input
                        type="text"
                        value={profileForm.location}
                        onChange={e => setProfileForm({ ...profileForm, location: e.target.value })}
                        className="input-dark text-xs py-1.5"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#525252] uppercase block mb-1">Summary Paragraph</label>
                      <textarea
                        rows={3}
                        value={profileForm.summary}
                        onChange={e => setProfileForm({ ...profileForm, summary: e.target.value })}
                        className="input-dark text-xs py-1.5 leading-relaxed"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(false)}
                        className="btn-secondary text-[11px] py-1 px-3 shadow-[2px_2px_0px_#171717]"
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn-primary text-[11px] py-1 px-3.5 shadow-[2px_2px_0px_#171717]">
                        Save Profile
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Sections Visibility & Quick Toggles */}
              <div className="nb-card p-5 bg-white border-2 border-[#171717] shadow-[4px_4px_0px_#171717] flex flex-col gap-3">
                <div className="flex items-center justify-between pb-2 border-b-2 border-[#171717]">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-[#B8A5FF] border border-[#171717] flex items-center justify-center">
                      <Layers className="w-3.5 h-3.5 text-[#171717]" />
                    </div>
                    <h4 className="font-display font-bold text-sm text-[#171717]">Resume Sections</h4>
                  </div>
                  <span className="badge badge-amber text-[10px]">Toggle</span>
                </div>

                <div className="flex flex-col gap-2">
                  {data.sections.map(sec => {
                    const count = data.entries.filter(e => e.section_id === sec.id).length;
                    return (
                      <div
                        key={sec.id}
                        className="flex items-center justify-between p-2 rounded-md bg-[#F7F5EC] border-2 border-[#171717] shadow-[2px_2px_0px_#171717]"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#171717]">{sec.name}</span>
                          {sec.id !== 'sec_ref' && (
                            <span className="badge badge-sky text-[10px] py-0 px-1.5">
                              {count}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleToggleSection(sec.id, sec.is_visible)}
                          className={`p-1 rounded-sm border border-[#171717] bg-white transition shadow-[1px_1px_0px_#171717] ${
                            sec.is_visible
                              ? 'text-[#0284C7]'
                              : 'text-[#737373] bg-[#E5E5E5]'
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
              <div className="no-print w-full flex flex-col sm:flex-row sm:items-center justify-between px-2 gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#171717] uppercase tracking-wider font-display">
                    Document Workspace
                  </span>
                  <span className="badge badge-cyan text-[10px]">Standard Clean Canvas</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => exportResumePdf(`${data.profile.name.replace(/\s+/g, '_')}_CV.pdf`)}
                    className="btn-primary text-xs px-3 py-1.5"
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
