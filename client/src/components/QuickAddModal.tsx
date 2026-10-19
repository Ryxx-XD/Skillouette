import React, { useState, useEffect } from 'react';
import { X, Plus, Check } from 'lucide-react';
import { Section, Subsection } from '../types.js';
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
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-[#171717] bg-[#FFFDF5]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-[#C6F564] border-2 border-[#171717] text-[#171717] flex items-center justify-center shadow-[2px_2px_0px_#171717]">
              <Plus className="w-4 h-4" />
            </div>
            <h2 className="font-display font-black text-[#171717] text-base">Quick Add Entry</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 border-2 border-[#171717] rounded-md bg-white hover:bg-[#FF8066] text-[#171717] transition shadow-[2px_2px_0px_#171717]"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[75vh] flex flex-col gap-4 bg-white">
          {error && (
            <div className="p-2.5 rounded-md bg-[#FF8066]/20 text-[#171717] text-xs font-semibold border-2 border-[#171717] shadow-[2px_2px_0px_#171717]">
              {error}
            </div>
          )}

          {/* Section & Subsection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono font-bold text-[#171717] uppercase tracking-wider mb-1">
                Target Section *
              </label>
              <select
                value={sectionId}
                onChange={e => {
                  setSectionId(e.target.value);
                  setSubsectionId(null);
                }}
                className="w-full bg-white border-2 border-[#171717] rounded-md px-3 py-2 text-xs text-[#171717] font-semibold focus:outline-none focus:shadow-[2px_2px_0px_#171717]"
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
                <label className="block text-xs font-mono font-bold text-[#171717] uppercase tracking-wider mb-1">
                  Skill Category
                </label>
                <select
                  value={subsectionId || ''}
                  onChange={e => setSubsectionId(e.target.value || null)}
                  className="w-full bg-white border-2 border-[#171717] rounded-md px-3 py-2 text-xs text-[#171717] font-semibold focus:outline-none focus:shadow-[2px_2px_0px_#171717]"
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
              <label className="block text-xs font-mono font-bold text-[#171717] uppercase tracking-wider mb-1">
                Title / Project Name *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Autonomous Depth Sonar Driver"
                className="w-full bg-white border-2 border-[#171717] rounded-md px-3 py-2 text-xs text-[#171717] font-semibold focus:outline-none focus:shadow-[2px_2px_0px_#171717]"
              />
            </div>
            <div>
              <label className="block text-xs font-mono font-bold text-[#171717] uppercase tracking-wider mb-1">
                Role / Subtitle
              </label>
              <input
                type="text"
                value={role}
                onChange={e => setRole(e.target.value)}
                placeholder="e.g. Firmware Engineer"
                className="w-full bg-white border-2 border-[#171717] rounded-md px-3 py-2 text-xs text-[#171717] font-semibold focus:outline-none focus:shadow-[2px_2px_0px_#171717]"
              />
            </div>
          </div>

          {/* Institution / Lab */}
          <div>
            <label className="block text-xs font-mono font-bold text-[#171717] uppercase tracking-wider mb-1">
              Institution / Organization
            </label>
            <input
              type="text"
              value={institution}
              onChange={e => setInstitution(e.target.value)}
              placeholder="e.g. Autonomous Robotics Lab / Independent Project"
              className="w-full bg-white border-2 border-[#171717] rounded-md px-3 py-2 text-xs text-[#171717] font-semibold focus:outline-none focus:shadow-[2px_2px_0px_#171717]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-mono font-bold text-[#171717] uppercase tracking-wider mb-1">
              Description *
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Comprehensive summary of engineering contributions, technical stack used, and challenges solved..."
              className="w-full bg-white border-2 border-[#171717] rounded-md p-3 text-xs text-[#171717] font-sans focus:outline-none focus:shadow-[2px_2px_0px_#171717] leading-relaxed resize-y"
            />
          </div>

          {/* Quantified Metrics & Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-mono font-bold text-[#171717] uppercase tracking-wider mb-1">
                Key Impact / Metric
              </label>
              <input
                type="text"
                value={metrics}
                onChange={e => setMetrics(e.target.value)}
                placeholder="e.g. 96% accuracy, 350ms latency"
                className="w-full bg-white border-2 border-[#171717] rounded-md px-3 py-2 text-xs text-[#171717] font-semibold focus:outline-none focus:shadow-[2px_2px_0px_#171717]"
              />
            </div>
            <div>
              <label className="block text-xs font-mono font-bold text-[#171717] uppercase tracking-wider mb-1">
                Start Date
              </label>
              <input
                type="text"
                value={dateStart}
                onChange={e => setDateStart(e.target.value)}
                placeholder="e.g. Jan 2024"
                className="w-full bg-white border-2 border-[#171717] rounded-md px-3 py-2 text-xs text-[#171717] font-semibold focus:outline-none focus:shadow-[2px_2px_0px_#171717]"
              />
            </div>
            <div>
              <label className="block text-xs font-mono font-bold text-[#171717] uppercase tracking-wider mb-1">
                End Date
              </label>
              <input
                type="text"
                value={dateEnd}
                onChange={e => setDateEnd(e.target.value)}
                placeholder="e.g. Present"
                className="w-full bg-white border-2 border-[#171717] rounded-md px-3 py-2 text-xs text-[#171717] font-semibold focus:outline-none focus:shadow-[2px_2px_0px_#171717]"
              />
            </div>
          </div>

          {/* GitHub or Project Link */}
          <div>
            <label className="block text-xs font-mono font-bold text-[#171717] uppercase tracking-wider mb-1">
              Project Link (GitHub / Demo)
            </label>
            <input
              type="text"
              value={linkInput}
              onChange={e => setLinkInput(e.target.value)}
              placeholder="https://github.com/ejpondales/..."
              className="w-full bg-white border-2 border-[#171717] rounded-md px-3 py-2 text-xs text-[#171717] font-semibold focus:outline-none focus:shadow-[2px_2px_0px_#171717]"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-mono font-bold text-[#171717] uppercase tracking-wider mb-1">
              Tags
            </label>
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
                className="flex-1 bg-white border-2 border-[#171717] rounded-md px-3 py-2 text-xs text-[#171717] font-semibold focus:outline-none focus:shadow-[2px_2px_0px_#171717]"
              />
              <button
                type="button"
                onClick={addTag}
                className="btn-secondary text-xs px-3 py-2 font-bold"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t, idx) => (
                <span key={idx} className="badge badge-sky text-xs font-bold">
                  {t}
                  <button
                    type="button"
                    onClick={() => removeTag(t)}
                    className="ml-1 text-[#171717] hover:text-[#FF8066] font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t-2 border-[#171717]">
            <button type="button" onClick={onClose} className="btn-secondary text-xs px-4 font-bold">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary text-xs px-5 font-bold"
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
