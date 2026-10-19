import React, { useState, useEffect } from 'react';
import { Sparkles, X, Check, AlertTriangle, ArrowRight, Tag, Calendar, BarChart2, Layers } from 'lucide-react';
import { Section, Subsection, CategorizedItem } from '../types.js';
import { captureBrainDump, commitCategorizedEntries } from '../api.js';

interface BrainDumpModalProps {
  isOpen: boolean;
  onClose: () => void;
  sections: Section[];
  subsections: Subsection[];
  onSuccess: () => void;
}

export const BrainDumpModal: React.FC<BrainDumpModalProps> = ({
  isOpen,
  onClose,
  sections,
  subsections,
  onSuccess
}) => {
  const [rawText, setRawText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedItems, setParsedItems] = useState<CategorizedItem[] | null>(null);
  const [modelUsed, setModelUsed] = useState<string>('');
  
  // Pending new section approvals
  const [newSectionDecisions, setNewSectionDecisions] = useState<Record<string, { action: 'create' | 'reassign'; targetSectionId?: string; name: string }>>({});

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleParse = async () => {
    if (!rawText.trim()) {
      setError('Please enter or paste your career accomplishments.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const res = await captureBrainDump(rawText);
      setParsedItems(res.items);
      setModelUsed(res.model_used);

      // Initialize decisions for new sections
      const decisions: Record<string, { action: 'create' | 'reassign'; targetSectionId?: string; name: string }> = {};
      res.items.forEach((item, idx) => {
        if (item.is_new_section && item.suggested_new_section_name) {
          decisions[`new_${idx}`] = {
            action: 'create',
            name: item.suggested_new_section_name
          };
        }
      });
      setNewSectionDecisions(decisions);
    } catch (err: any) {
      setError(err.message || 'Failed to categorize brain dump.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateItemField = (index: number, field: keyof CategorizedItem, value: any) => {
    if (!parsedItems) return;
    const copy = [...parsedItems];
    copy[index] = { ...copy[index], [field]: value };
    setParsedItems(copy);
  };

  const handleCommit = async () => {
    if (!parsedItems || parsedItems.length === 0) return;
    setIsProcessing(true);
    setError(null);

    try {
      const sectionsToCreate: Array<{ id: string; name: string }> = [];
      const updatedItems = parsedItems.map((item, idx) => {
        const decKey = `new_${idx}`;
        const dec = newSectionDecisions[decKey];

        if (item.is_new_section && dec) {
          if (dec.action === 'create') {
            const newSecId = `sec_custom_${Date.now()}_${idx}`;
            sectionsToCreate.push({ id: newSecId, name: dec.name });
            return {
              ...item,
              section_id: newSecId,
              section_name: dec.name,
              is_new_section: false
            };
          } else if (dec.action === 'reassign' && dec.targetSectionId) {
            const target = sections.find(s => s.id === dec.targetSectionId);
            return {
              ...item,
              section_id: dec.targetSectionId,
              section_name: target?.name || item.section_name,
              is_new_section: false
            };
          }
        }
        return item;
      });

      await commitCategorizedEntries(updatedItems, sectionsToCreate);
      onSuccess();
      onClose();
      setRawText('');
      setParsedItems(null);
    } catch (err: any) {
      setError(err.message || 'Failed to commit entries to resume.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content max-w-3xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-[#171717] bg-[#FFFDF5]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-[#C6F564] border-2 border-[#171717] text-[#171717] flex items-center justify-center shadow-[2px_2px_0px_#171717]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-black text-[#171717] text-lg">
                {parsedItems ? 'Review & Confirm Categorization' : 'Career Brain Dump'}
              </h2>
              <p className="text-xs text-[#525252] font-medium">
                {parsedItems
                  ? `AI parsed ${parsedItems.length} distinct item${parsedItems.length > 1 ? 's' : ''} using ${modelUsed}`
                  : 'Paste any raw notes, bullets, or achievements — our AI organizes them into your schema'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 border-2 border-[#171717] rounded-md bg-white hover:bg-[#FF8066] text-[#171717] transition shadow-[2px_2px_0px_#171717]"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[70vh] flex flex-col gap-4 bg-white">
          {error && (
            <div className="p-3 rounded-md bg-[#FF8066]/20 border-2 border-[#171717] text-[#171717] text-xs font-semibold flex items-center gap-2 shadow-[2px_2px_0px_#171717]">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-[#171717]" />
              <span>{error}</span>
            </div>
          )}

          {!parsedItems ? (
            /* Input Step */
            <div className="flex flex-col gap-3">
              <label className="text-xs font-mono font-bold text-[#171717] uppercase tracking-wider">
                Raw Input Text
              </label>
              <textarea
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                placeholder="Example: Engineered a 4-layer STM32 power management PCB with MPPT buck converter for our autonomous tilapia pond vessel, improving battery life by 45%. Also won 1st Place at the National Autonomous Robotics Hackathon 2025!"
                rows={8}
                className="w-full bg-white border-2 border-[#171717] rounded-md p-3 text-xs text-[#171717] font-mono focus:outline-none focus:shadow-[3px_3px_0px_#171717] resize-y leading-relaxed"
                autoFocus
              />
              <div className="flex flex-wrap items-center justify-between text-xs text-[#525252] mt-1 font-medium">
                <span>Supports multiple mixed bullets, dates, metrics, and new section topics.</span>
                <span className="font-mono font-bold text-[#171717]">{rawText.length} characters</span>
              </div>

              {/* Sample Prompts */}
              <div className="mt-2 pt-3 border-t-2 border-[#171717]">
                <div className="text-[11px] font-mono font-bold text-[#525252] uppercase tracking-wider mb-2">
                  Quick test examples:
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setRawText(
                        "Designed and deployed custom dual brushless thruster ESC controller on STM32G4 with CAN-bus interface for the tilapia surface robot. Attained 94% motor driver efficiency under continuous 6-hour autonomous surveys."
                      )
                    }
                    className="text-[11px] bg-white hover:bg-[#82D9F5] text-[#171717] font-bold px-2.5 py-1 rounded-md border-2 border-[#171717] shadow-[2px_2px_0px_#171717] transition cursor-pointer"
                  >
                    + Aquaculture Motor Driver
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setRawText(
                        "Filed provisional patent application #63/981,204 on 'Ultra-Low-Power Wearable Multi-Modal Biomechanical Telemetry for Seizure Detection' with the US Patent Office."
                      )
                    }
                    className="text-[11px] bg-white hover:bg-[#B8A5FF] text-[#171717] font-bold px-2.5 py-1 rounded-md border-2 border-[#171717] shadow-[2px_2px_0px_#171717] transition cursor-pointer"
                  >
                    + New Section (Patent)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setRawText(
                        "Completed 40-hour intensive hands-on training course in FreeRTOS Real-Time Kernel Internals and Embedded Thread Synchronization. Also published conference paper in IEEE Mechatronics."
                      )
                    }
                    className="text-[11px] bg-white hover:bg-[#C6F564] text-[#171717] font-bold px-2.5 py-1 rounded-md border-2 border-[#171717] shadow-[2px_2px_0px_#171717] transition cursor-pointer"
                  >
                    + Compound (Training + Publication)
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Review & Confirm Step */
            <div className="flex flex-col gap-5">
              {parsedItems.map((item, idx) => {
                const decKey = `new_${idx}`;
                const decision = newSectionDecisions[decKey];
                const isLowConfidence = item.confidence < 0.70;

                return (
                  <div
                    key={idx}
                    className="nb-card p-4 flex flex-col gap-3.5 bg-white border-2 border-[#171717] shadow-[4px_4px_0px_#171717] relative"
                  >
                    {/* Item Top Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-[#171717] text-white text-xs font-mono font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>

                        {/* Section Selector */}
                        <select
                          value={item.section_id}
                          onChange={e => {
                            const sec = sections.find(s => s.id === e.target.value);
                            handleUpdateItemField(idx, 'section_id', e.target.value);
                            handleUpdateItemField(idx, 'section_name', sec?.name || '');
                          }}
                          className="bg-white border-2 border-[#171717] text-[#171717] text-xs font-bold rounded-md px-2.5 py-1.5 focus:shadow-[2px_2px_0px_#171717] outline-none"
                        >
                          {sections.map(s => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                          {item.is_new_section && (
                            <option value="sec_new_pending">
                              ✨ New: {item.suggested_new_section_name}
                            </option>
                          )}
                        </select>

                        {/* Subsection if Skills */}
                        {item.section_id === 'sec_skills' && (
                          <select
                            value={item.subsection_id || ''}
                            onChange={e => handleUpdateItemField(idx, 'subsection_id', e.target.value || null)}
                            className="bg-white border-2 border-[#171717] text-[#171717] text-xs font-bold rounded-md px-2.5 py-1.5 focus:shadow-[2px_2px_0px_#171717] outline-none"
                          >
                            <option value="">(No Subcategory)</option>
                            {subsections.filter(sub => sub.section_id === 'sec_skills').map(sub => (
                              <option key={sub.id} value={sub.id}>
                                {sub.name}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      {/* Confidence Score Badge */}
                      <div className="flex items-center gap-1.5">
                        {isLowConfidence ? (
                          <span
                            className="badge badge-yellow text-xs font-bold"
                            title="Confidence < 70%. Please verify section and title."
                          >
                            <AlertTriangle className="w-3 h-3" />
                            {Math.round(item.confidence * 100)}% Confidence (Review)
                          </span>
                        ) : (
                          <span className="badge badge-lime text-xs font-bold">
                            <Check className="w-3 h-3" />
                            {Math.round(item.confidence * 100)}% Match
                          </span>
                        )}
                      </div>
                    </div>

                    {/* New Section Confirmation Banner */}
                    {item.is_new_section && decision && (
                      <div className="p-3 rounded-md bg-[#82D9F5]/20 border-2 border-[#171717] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-[2px_2px_0px_#171717]">
                        <div className="flex items-center gap-2 text-[#171717] font-semibold">
                          <Layers className="w-4 h-4 text-[#171717] flex-shrink-0" />
                          <span>
                            This item does not fit existing categories. Propose creating: <strong>"{decision.name}"</strong>?
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              setNewSectionDecisions(prev => ({
                                ...prev,
                                [decKey]: { ...prev[decKey], action: 'create' }
                              }))
                            }
                            className={`px-3 py-1 rounded-md text-xs font-bold border-2 border-[#171717] shadow-[2px_2px_0px_#171717] transition ${
                              decision.action === 'create'
                                ? 'bg-[#C6F564] text-[#171717]'
                                : 'bg-white text-[#525252] hover:bg-[#F2EFE7]'
                            }`}
                          >
                            ✓ Create Section
                          </button>
                          <select
                            onChange={e => {
                              if (e.target.value) {
                                setNewSectionDecisions(prev => ({
                                  ...prev,
                                  [decKey]: { action: 'reassign', targetSectionId: e.target.value, name: '' }
                                }));
                                handleUpdateItemField(idx, 'section_id', e.target.value);
                              }
                            }}
                            className="bg-white text-[#171717] px-2 py-1 rounded-md text-xs font-bold border-2 border-[#171717] shadow-[2px_2px_0px_#171717] outline-none"
                          >
                            <option value="">Reassign to...</option>
                            {sections.map(s => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    {/* Title */}
                    <div>
                      <input
                        type="text"
                        value={item.title}
                        onChange={e => handleUpdateItemField(idx, 'title', e.target.value)}
                        placeholder="Title / Role / Achievement Heading"
                        className="w-full bg-white border-2 border-[#171717] rounded-md px-3 py-2 text-sm font-bold text-[#171717] focus:outline-none focus:shadow-[2px_2px_0px_#171717]"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <textarea
                        value={item.description}
                        onChange={e => handleUpdateItemField(idx, 'description', e.target.value)}
                        rows={3}
                        className="w-full bg-white border-2 border-[#171717] rounded-md p-2.5 text-xs text-[#171717] font-sans focus:outline-none focus:shadow-[2px_2px_0px_#171717] resize-y leading-relaxed"
                        placeholder="Detailed description of achievement, methodologies, and engineering implementation"
                      />
                    </div>

                    {/* Quantitative Metric & Date Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="flex items-center gap-2 bg-[#F7F5EC] p-2 rounded-md border-2 border-[#171717] shadow-[2px_2px_0px_#171717]">
                        <BarChart2 className="w-3.5 h-3.5 text-[#171717] flex-shrink-0" />
                        <input
                          type="text"
                          value={item.metrics || ''}
                          onChange={e => handleUpdateItemField(idx, 'metrics', e.target.value)}
                          placeholder="Quantified Result (e.g. 94% efficiency, 42 FPS)"
                          className="bg-transparent text-xs text-[#171717] font-semibold placeholder-[#737373] w-full outline-none"
                        />
                      </div>
                      <div className="flex items-center gap-2 bg-[#F7F5EC] p-2 rounded-md border-2 border-[#171717] shadow-[2px_2px_0px_#171717]">
                        <Calendar className="w-3.5 h-3.5 text-[#171717] flex-shrink-0" />
                        <input
                          type="text"
                          value={item.date_start || ''}
                          onChange={e => handleUpdateItemField(idx, 'date_start', e.target.value)}
                          placeholder="Date / Timeline (e.g. 2025 or May 2024)"
                          className="bg-transparent text-xs text-[#171717] font-semibold placeholder-[#737373] w-full outline-none"
                        />
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Tag className="w-3.5 h-3.5 text-[#171717]" />
                      {item.tags.map((tag, tIdx) => (
                        <span key={tIdx} className="badge badge-sky text-[10px] font-bold">
                          {tag}
                        </span>
                      ))}
                      <input
                        type="text"
                        placeholder="+ add tag"
                        onKeyDown={e => {
                          if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                            e.preventDefault();
                            const val = (e.target as HTMLInputElement).value.trim();
                            handleUpdateItemField(idx, 'tags', [...item.tags, val]);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }}
                        className="bg-white text-[#171717] px-2 py-0.5 rounded-md text-[10px] font-semibold border-2 border-[#171717] w-20 outline-none"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t-2 border-[#171717] bg-[#FFFDF5]">
          {!parsedItems ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary text-xs px-4"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleParse}
                disabled={isProcessing}
                className="btn-primary text-xs px-5"
              >
                {isProcessing ? (
                  <>
                    <span className="animate-spin mr-1">⚙️</span>
                    <span>Analyzing & Parsing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Categorize with AI</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setParsedItems(null)}
                className="btn-secondary text-xs px-4"
              >
                Back to Edit Dump
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary text-xs px-3"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={handleCommit}
                  disabled={isProcessing}
                  className="btn-primary text-xs px-5"
                >
                  {isProcessing ? (
                    'Saving...'
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Commit {parsedItems.length} Entries to Resume</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
