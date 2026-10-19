import React, { useState, useEffect } from 'react';
import { X, Plus, Check, Tag, Calendar, BarChart2 } from 'lucide-react';
import { Section, Subsection, Entry } from '../types.js';
import { addEntry } from '../api.js';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  sections: Section[];
  subsections: Subsection[];
  onSuccess: () => void;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  onClose,
  sections,
  subsections,
  onSuccess
}) => {
  const [sectionId, setSectionId] = useState(sections[0]?.id || 'sec_proj');
  const [subsectionId, setSubsectionId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [role, setRole] = useState('');
  const [institution, setInstitution] = useState('');
  const [description, setDescription] = useState('');
  const [metrics, setMetrics] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [linkInput, setLinkInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError('Title and Description are required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await addEntry({
        section_id: sectionId,
        subsection_id: sectionId === 'sec_skills' ? subsectionId : null,
        title: title.trim(),
        role: role.trim() || undefined,
        institution: institution.trim() || undefined,
        description: description.trim(),
        metrics: metrics.trim() || undefined,
        date_start: dateStart.trim() || undefined,
        date_end: dateEnd.trim() || undefined,
        tags,
        links: linkInput.trim() ? [linkInput.trim()] : []
      });

      onSuccess();
      onClose();
      // Reset form
      setTitle('');
      setDescription('');
      setRole('');
      setInstitution('');
      setMetrics('');
      setDateStart('');
      setDateEnd('');
      setTags([]);
      setLinkInput('');
    } catch (err: any) {
      setError(err.message || 'Failed to add entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (t: string) => {
    setTags(tags.filter(tag => tag !== t));
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content max-w-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-sky-400" />
            <h2 className="font-display font-semibold text-white text-base">Quick Add Entry</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[75vh] flex flex-col gap-4">
          {error && (
            <div className="p-2.5 rounded bg-rose-500/20 text-rose-300 text-xs border border-rose-500/30">
              {error}
            </div>
          )}

          {/* Section & Subsection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Target Section *</label>
              <select
                value={sectionId}
                onChange={e => {
                  setSectionId(e.target.value);
                  setSubsectionId(null);
                }}
                className="input-dark text-xs"
              >
                {sections.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {sectionId === 'sec_skills' && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Skill Category</label>
                <select
                  value={subsectionId || ''}
                  onChange={e => setSubsectionId(e.target.value || null)}
                  className="input-dark text-xs"
                >
                  <option value="">(No Subcategory)</option>
                  {subsections.filter(s => s.section_id === 'sec_skills').map(sub => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Title & Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Title / Project Name *</label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Autonomous Depth Sonar Driver"
                className="input-dark text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Role / Subtitle</label>
              <input
                type="text"
                value={role}
                onChange={e => setRole(e.target.value)}
                placeholder="e.g. Firmware Engineer"
                className="input-dark text-xs"
              />
            </div>
          </div>

          {/* Institution / Lab */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Institution / Organization</label>
            <input
              type="text"
              value={institution}
              onChange={e => setInstitution(e.target.value)}
              placeholder="e.g. Autonomous Robotics Lab / Independent Project"
              className="input-dark text-xs"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Description *</label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Comprehensive summary of engineering contributions, technical stack used, and challenges solved..."
              className="input-dark text-xs"
            />
          </div>

          {/* Quantified Metrics & Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Key Impact / Metric</label>
              <input
                type="text"
                value={metrics}
                onChange={e => setMetrics(e.target.value)}
                placeholder="e.g. 96% accuracy, 350ms latency"
                className="input-dark text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Start Date</label>
              <input
                type="text"
                value={dateStart}
                onChange={e => setDateStart(e.target.value)}
                placeholder="e.g. Jan 2024"
                className="input-dark text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">End Date</label>
              <input
                type="text"
                value={dateEnd}
                onChange={e => setDateEnd(e.target.value)}
                placeholder="e.g. Present"
                className="input-dark text-xs"
              />
            </div>
          </div>

          {/* GitHub or Project Link */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Project Link (GitHub / Demo)</label>
            <input
              type="text"
              value={linkInput}
              onChange={e => setLinkInput(e.target.value)}
              placeholder="https://github.com/ejpondales/..."
              className="input-dark text-xs"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Tags</label>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="Type tag and press Enter"
                className="input-dark text-xs"
              />
              <button
                type="button"
                onClick={addTag}
                className="btn-secondary text-xs px-3 py-2"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t, idx) => (
                <span key={idx} className="badge badge-cyan text-xs">
                  {t}
                  <button type="button" onClick={() => removeTag(t)} className="ml-1 text-sky-200 hover:text-white">
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button type="button" onClick={onClose} className="btn-secondary text-xs px-4">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary text-xs px-5 shadow-sky-500/25"
            >
              <Check className="w-4 h-4" />
              <span>Save Entry</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
