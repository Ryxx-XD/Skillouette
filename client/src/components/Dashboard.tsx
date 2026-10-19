import React, { useState } from 'react';
import { Search, Filter, Plus, ArrowUp, ArrowDown, Edit3, Trash2, Eye, EyeOff, Tag, ExternalLink, Layers } from 'lucide-react';
import { ResumeData, Entry, Section, Subsection } from '../types.js';
import { reorderEntries, updateSection, deleteSection, addSection, addSubsection, deleteSubsection } from '../api.js';

interface DashboardProps {
  data: ResumeData;
  onRefresh: () => void;
  onEditEntry: (entry: Entry) => void;
  onOpenQuickAdd: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  data,
  onRefresh,
  onEditEntry,
  onOpenQuickAdd
}) => {
  const { sections, subsections, entries } = data;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

  // New section dialog state
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [newSubsectionName, setNewSubsectionName] = useState('');
  const [targetSubSectionId, setTargetSubSectionId] = useState<string | null>(null);

  // Extract all unique tags
  const allTags = Array.from(new Set(entries.flatMap(e => e.tags || []))).sort();

  // Filter entries
  const filteredEntries = entries.filter(e => {
    if (selectedSectionId && e.section_id !== selectedSectionId) return false;
    if (selectedTag && !e.tags.includes(selectedTag)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        e.title.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        (e.role && e.role.toLowerCase().includes(q)) ||
        (e.institution && e.institution.toLowerCase().includes(q)) ||
        e.tags.some(t => t.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const handleMoveEntry = async (entry: Entry, direction: 'up' | 'down') => {
    const siblings = entries.filter(e => e.section_id === entry.section_id).sort((a, b) => a.order - b.order);
    const currIdx = siblings.findIndex(e => e.id === entry.id);
    if (currIdx === -1) return;
    const targetIdx = direction === 'up' ? currIdx - 1 : currIdx + 1;
    if (targetIdx < 0 || targetIdx >= siblings.length) return;

    // Swap
    const newSiblings = [...siblings];
    const temp = newSiblings[currIdx];
    newSiblings[currIdx] = newSiblings[targetIdx];
    newSiblings[targetIdx] = temp;

    await reorderEntries(entry.section_id, newSiblings.map(e => e.id));
    onRefresh();
  };

  const handleToggleSection = async (sec: Section) => {
    await updateSection(sec.id, { is_visible: !sec.is_visible });
    onRefresh();
  };

  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectionName.trim()) return;
    await addSection(newSectionName.trim());
    setNewSectionName('');
    setShowAddSectionModal(false);
    onRefresh();
  };

  const handleCreateSubsection = async (sectionId: string) => {
    if (!newSubsectionName.trim()) return;
    await addSubsection(sectionId, newSubsectionName.trim());
    setNewSubsectionName('');
    setTargetSubSectionId(null);
    onRefresh();
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 py-6 px-4">
      {/* Top Header & Search Bar */}
      <div className="nb-card p-5 bg-white border-2 border-[#171717] shadow-[4px_4px_0px_#171717] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-2xl text-[#171717]">Career Entry Dashboard</h2>
          <p className="text-xs text-[#525252] font-medium">
            Manage, reorder, and tag your complete database of engineering accomplishments.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-[#525252] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search achievements..."
              className="input-dark pl-9 text-xs"
            />
          </div>

          <button onClick={onOpenQuickAdd} className="btn-primary text-xs px-3.5 py-2">
            <Plus className="w-4 h-4 text-[#171717]" />
            <span>Add Entry</span>
          </button>

          <button
            onClick={() => setShowAddSectionModal(true)}
            className="btn-secondary text-xs px-3 py-2"
            title="Create New Top-Level Section"
          >
            <Layers className="w-4 h-4 text-[#171717]" />
            <span>New Section</span>
          </button>
        </div>
      </div>

      {/* Filters (Section Pills & Tag Chips) */}
      <div className="flex flex-col gap-3">
        {/* Section Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedSectionId(null)}
            className={`px-3 py-1.5 rounded-sm text-xs font-bold transition whitespace-nowrap border-2 border-[#171717] ${
              selectedSectionId === null
                ? 'bg-[#C6F564] text-[#171717] shadow-[2px_2px_0px_#171717]'
                : 'bg-white text-[#171717] hover:bg-[#F7F5EC] shadow-[1px_1px_0px_#171717]'
            }`}
          >
            All Sections ({entries.length})
          </button>
          {sections.map(sec => {
            const count = entries.filter(e => e.section_id === sec.id).length;
            return (
              <button
                key={sec.id}
                onClick={() => setSelectedSectionId(sec.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-bold transition whitespace-nowrap border-2 border-[#171717] ${
                  selectedSectionId === sec.id
                    ? 'bg-[#82D9F5] text-[#171717] shadow-[2px_2px_0px_#171717]'
                    : 'bg-white text-[#171717] hover:bg-[#F7F5EC] shadow-[1px_1px_0px_#171717]'
                }`}
              >
                <span>{sec.name}</span>
                <span className="badge badge-amber text-[9px] py-0 px-1">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Tag Filters */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <span className="text-[11px] text-[#525252] font-mono font-bold mr-1">Tags:</span>
            {selectedTag && (
              <button
                onClick={() => setSelectedTag(null)}
                className="badge badge-coral text-[10px] cursor-pointer"
              >
                Clear Tag Filter ×
              </button>
            )}
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`badge text-[10px] cursor-pointer transition ${
                  selectedTag === tag
                    ? 'badge-cyan shadow-[2px_2px_0px_#171717]'
                    : 'bg-white text-[#171717] hover:bg-[#F7F5EC]'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grouped Section Display */}
      <div className="flex flex-col gap-6">
        {sections
          .filter(sec => !selectedSectionId || sec.id === selectedSectionId)
          .map(sec => {
            const secEntries = filteredEntries.filter(e => e.section_id === sec.id).sort((a, b) => a.order - b.order);
            const secSubs = subsections.filter(s => s.section_id === sec.id).sort((a, b) => a.order - b.order);

            return (
              <div key={sec.id} className="nb-card p-5 bg-white border-2 border-[#171717] shadow-[4px_4px_0px_#171717] flex flex-col gap-4">
                {/* Section Header */}
                <div className="flex items-center justify-between pb-3 border-b-2 border-[#171717]">
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-display font-bold text-lg text-[#171717]">{sec.name}</h3>
                    <span className="badge badge-cyan text-[10px] font-mono">
                      {secEntries.length} {secEntries.length === 1 ? 'entry' : 'entries'}
                    </span>
                    {sec.is_custom && (
                      <span className="badge badge-purple text-[10px]">Custom</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Add Subsection button if Skills section */}
                    {sec.id === 'sec_skills' && (
                      <button
                        onClick={() => setTargetSubSectionId(sec.id)}
                        className="btn-secondary text-xs py-1 px-2.5 shadow-[2px_2px_0px_#171717]"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#171717]" />
                        <span>Add Subcategory</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleToggleSection(sec)}
                      className={`p-1.5 rounded-sm border border-[#171717] text-xs flex items-center gap-1 shadow-[1px_1px_0px_#171717] transition ${
                        sec.is_visible
                          ? 'bg-white text-[#171717] hover:bg-[#F7F5EC]'
                          : 'bg-[#FF8066] text-[#171717]'
                      }`}
                      title={sec.is_visible ? 'Visible in resume' : 'Hidden in resume'}
                    >
                      {sec.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      <span className="text-[11px] font-bold">{sec.is_visible ? 'Visible' : 'Hidden'}</span>
                    </button>
                  </div>
                </div>

                {/* Subcategory inline add input */}
                {targetSubSectionId === sec.id && (
                  <div className="flex items-center gap-2 p-3 bg-[#F7F5EC] rounded-md border-2 border-[#171717] shadow-[2px_2px_0px_#171717]">
                    <input
                      type="text"
                      value={newSubsectionName}
                      onChange={e => setNewSubsectionName(e.target.value)}
                      placeholder="Subcategory name (e.g. Autonomous Navigation & Sensors)"
                      className="input-dark text-xs flex-1"
                      autoFocus
                    />
                    <button
                      onClick={() => handleCreateSubsection(sec.id)}
                      className="btn-primary text-xs px-3 py-1.5"
                    >
                      Create
                    </button>
                    <button
                      onClick={() => setTargetSubSectionId(null)}
                      className="btn-secondary text-xs px-2.5 py-1.5"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {/* Entries List */}
                {secEntries.length === 0 ? (
                  <div className="text-xs text-[#525252] italic py-4 text-center bg-[#F7F5EC] rounded-md border-2 border-dashed border-[#171717]">
                    No entries in this section matching your filter.
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {secEntries.map((entry, idx) => {
                      const sub = subsections.find(s => s.id === entry.subsection_id);
                      return (
                        <div
                          key={entry.id}
                          className="bg-[#F7F5EC] p-4 rounded-md border-2 border-[#171717] shadow-[3px_3px_0px_#171717] hover:shadow-[4px_4px_0px_#171717] transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
                        >
                          {/* Content Left */}
                          <div className="flex-1 flex flex-col gap-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-display font-bold text-[#171717] text-sm">
                                {entry.title}
                              </span>
                              {entry.role && (
                                <span className="badge badge-sky text-[10px] font-mono">
                                  {entry.role}
                                </span>
                              )}
                              {sub && (
                                <span className="badge badge-purple text-[10px]">
                                  {sub.name}
                                </span>
                              )}
                              {entry.date_start && (
                                <span className="text-[11px] text-[#525252] font-mono">
                                  {entry.date_start} {entry.date_end ? `– ${entry.date_end}` : ''}
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-[#171717] leading-relaxed">
                              {entry.description}
                            </p>

                            {entry.metrics && (
                              <div className="text-[11px] text-[#047857] font-bold bg-white p-1 rounded-sm border border-[#171717] inline-block self-start shadow-[1px_1px_0px_#171717]">
                                📊 {entry.metrics}
                              </div>
                            )}

                            {entry.tags && entry.tags.length > 0 && (
                              <div className="flex items-center gap-1 flex-wrap mt-0.5">
                                {entry.tags.map((t, tIdx) => (
                                  <span key={tIdx} className="badge badge-amber text-[9px]">
                                    #{t}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Controls Right */}
                          <div className="flex items-center gap-1.5 self-end sm:self-center">
                            {/* Move Up / Down */}
                            <button
                              onClick={() => handleMoveEntry(entry, 'up')}
                              disabled={idx === 0}
                              className="p-1.5 rounded-sm border-2 border-[#171717] bg-white shadow-[1px_1px_0px_#171717] hover:bg-[#C6F564] disabled:opacity-30 disabled:cursor-not-allowed transition"
                              title="Move Up"
                            >
                              <ArrowUp className="w-3.5 h-3.5 text-[#171717]" />
                            </button>
                            <button
                              onClick={() => handleMoveEntry(entry, 'down')}
                              disabled={idx === secEntries.length - 1}
                              className="p-1.5 rounded-sm border-2 border-[#171717] bg-white shadow-[1px_1px_0px_#171717] hover:bg-[#C6F564] disabled:opacity-30 disabled:cursor-not-allowed transition"
                              title="Move Down"
                            >
                              <ArrowDown className="w-3.5 h-3.5 text-[#171717]" />
                            </button>

                            <button
                              onClick={() => onEditEntry(entry)}
                              className="btn-secondary text-xs px-3 py-1 shadow-[2px_2px_0px_#171717]"
                              title="Edit Entry"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {/* Add New Section Modal */}
      {showAddSectionModal && (
        <div className="modal-backdrop" onClick={() => setShowAddSectionModal(false)}>
          <div className="modal-content max-w-md bg-white border-3 border-[#171717] shadow-[6px_6px_0px_#171717]" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b-2 border-[#171717] flex items-center justify-between bg-[#F7F5EC]">
              <h3 className="font-display font-bold text-[#171717] text-base">Add New Section</h3>
              <button
                onClick={() => setShowAddSectionModal(false)}
                className="p-1 rounded-sm border border-[#171717] bg-white text-[#171717] hover:bg-[#FF8066] font-bold text-sm w-6 h-6 flex items-center justify-center shadow-[1px_1px_0px_#171717]"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateSection} className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-[#171717] mb-1">
                  Section Name *
                </label>
                <input
                  type="text"
                  required
                  value={newSectionName}
                  onChange={e => setNewSectionName(e.target.value)}
                  placeholder="e.g. Patents, Publications, Conference Talks"
                  className="input-dark text-xs"
                  autoFocus
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSectionModal(false)}
                  className="btn-secondary text-xs px-3 shadow-[2px_2px_0px_#171717]"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs px-4 shadow-[2px_2px_0px_#171717]">
                  Create Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
