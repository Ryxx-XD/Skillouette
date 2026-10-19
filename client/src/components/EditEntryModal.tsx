import React, { useState, useEffect } from 'react';
import { X, Check, Trash2, Tag, Calendar, BarChart2 } from 'lucide-react';
import { Section, Subsection, Entry } from '../types.js';
import { updateEntry, deleteEntry } from '../api.js';

interface EditEntryModalProps {
  entry: Entry | null;
  sections: Section[];
  subsections: Subsection[];
  onClose: () => void;
  onSuccess: () => void;
}

export const EditEntryModal: React.FC<EditEntryModalProps> = ({
  entry,
  sections,
  subsections,
  onClose,
  onSuccess
}) => {
  const [sectionId, setSectionId] = useState(entry?.section_id || '');
  const [subsectionId, setSubsectionId] = useState<string | null>(entry?.subsection_id || null);
  const [title, setTitle] = useState(entry?.title || '');
  const [role, setRole] = useState(entry?.role || '');
  const [institution, setInstitution] = useState(entry?.institution || '');
  const [description, setDescription] = useState(entry?.description || '');
  const [metrics, setMetrics] = useState(entry?.metrics || '');
  const [dateStart, setDateStart] = useState(entry?.date_start || '');
  const [dateEnd, setDateEnd] = useState(entry?.date_end || '');
  const [tags, setTags] = useState<string[]>(entry?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [linkInput, setLinkInput] = useState(entry?.links?.[0] || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!entry) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [entry, onClose]);

  useEffect(() => {
    if (entry) {
      setSectionId(entry.section_id);
      setSubsectionId(entry.subsection_id || null);
      setTitle(entry.title);
      setRole(entry.role || '');
      setInstitution(entry.institution || '');
      setDescription(entry.description);
      setMetrics(entry.metrics || '');
      setDateStart(entry.date_start || '');
      setDateEnd(entry.date_end || '');
      setTags(entry.tags || []);
      setLinkInput(entry.links?.[0] || '');
    }
  }, [entry]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entry) return;
    setIsSubmitting(true);
    setError(null);

    try {
      await updateEntry(entry.id, {
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
    } catch (err: any) {
      setError(err.message || 'Failed to update entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!entry) return;
    if (window.confirm('Are you sure you want to delete this entry?')) {
      setIsSubmitting(true);
      try {
        await deleteEntry(entry.id);
        onSuccess();
        onClose();
      } catch (err: any) {
        setError(err.message || 'Failed to delete entry');
      } finally {
        setIsSubmitting(false);
      }
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

  if (!entry) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content max-w-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <h2 className="font-display font-semibold text-white text-base">Edit Resume Entry</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 overflow-y-auto max-h-[75vh] flex flex-col gap-4">
          {error && (
            <div className="p-2.5 rounded bg-rose-500/20 text-rose-300 text-xs border border-rose-500/30">
              {error}
            </div>
          )}

          {/* Section & Subsection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Section</label>
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
              <label className="block text-xs font-medium text-slate-300 mb-1">Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="input-dark text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Role / Subtitle</label>
              <input
                type="text"
                value={role}
                onChange={e => setRole(e.target.value)}
                className="input-dark text-xs"
              />
            </div>
          </div>

          {/* Institution */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Institution / Organization</label>
            <input
              type="text"
              value={institution}
              onChange={e => setInstitution(e.target.value)}
              className="input-dark text-xs"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="input-dark text-xs leading-relaxed"
            />
          </div>

          {/* Quantified Impact & Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Key Impact / Metric</label>
              <input
                type="text"
                value={metrics}
                onChange={e => setMetrics(e.target.value)}
                placeholder="e.g. 99.4% packet reception"
                className="input-dark text-xs text-sky-300"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Start Date</label>
              <input
                type="text"
                value={dateStart}
                onChange={e => setDateStart(e.target.value)}
                className="input-dark text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">End Date</label>
              <input
                type="text"
                value={dateEnd}
                onChange={e => setDateEnd(e.target.value)}
                className="input-dark text-xs"
              />
            </div>
          </div>

          {/* Link */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Project Link (GitHub / Demo)</label>
            <input
              type="text"
              value={linkInput}
              onChange={e => setLinkInput(e.target.value)}
              className="input-dark text-xs text-sky-400"
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
                placeholder="Add tag and press Enter"
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

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={handleDelete}
              className="btn-danger text-xs px-3"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Entry</span>
            </button>

            <div className="flex items-center gap-2">
              <button type="button" onClick={onClose} className="btn-secondary text-xs px-4">
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary text-xs px-5 shadow-sky-500/25"
              >
                <Check className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
