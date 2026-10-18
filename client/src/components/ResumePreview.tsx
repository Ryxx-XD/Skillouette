import React from 'react';
import { ResumeData, Entry } from '../types.js';
import { ExternalLink, Eye, EyeOff, Edit3 } from 'lucide-react';

interface ResumePreviewProps {
  data: ResumeData;
  customSummary?: string;
  filteredEntryIds?: string[];
  onToggleSectionVisibility?: (sectionId: string, current: boolean) => void;
  onEditEntry?: (entry: Entry) => void;
  isJobMatchView?: boolean;
}

export const ResumePreview: React.FC<ResumePreviewProps> = ({
  data,
  customSummary,
  filteredEntryIds,
  onToggleSectionVisibility,
  onEditEntry,
  isJobMatchView = false
}) => {
  const { profile, sections, subsections, entries, references } = data;

  const activeEntryIdsSet = filteredEntryIds ? new Set(filteredEntryIds) : null;
  const visibleEntries = entries.filter(e => (!activeEntryIdsSet || activeEntryIdsSet.has(e.id)) && e.is_active !== false);

  const sortedSections = [...sections].sort((a, b) => a.order - b.order);

  return (
    <div className="w-full flex flex-col items-center">
      {/* Resume Paper Component (Printable & Exportable Target) */}
      <div id="resume-canvas" className="resume-paper bg-white text-slate-900 shadow-2xl transition-all">
        {/* 1. Header */}
        <div className="resume-header">
          <h1 className="resume-name">{profile.name}</h1>
          <div className="resume-title">{profile.title}</div>
          <div className="resume-contacts">
            <span>{profile.email}</span>
            <span className="resume-contacts-dot">•</span>
            <span>{profile.phone}</span>
            {profile.location && (
              <>
                <span className="resume-contacts-dot">•</span>
                <span>{profile.location}</span>
              </>
            )}
            {profile.github && (
              <>
                <span className="resume-contacts-dot">•</span>
                <a href={profile.github} target="_blank" rel="noreferrer">
                  {profile.github.replace('https://', '')}
                </a>
              </>
            )}
            {profile.linkedin && (
              <>
                <span className="resume-contacts-dot">•</span>
                <a href={profile.linkedin} target="_blank" rel="noreferrer">
                  {profile.linkedin.replace('https://', '')}
                </a>
              </>
            )}
          </div>
        </div>

        {/* 2. Professional Summary */}
        {(customSummary || profile.summary) && (
          <div className="resume-section">
            <div className="resume-section-title">
              <span>Professional Summary</span>
              {isJobMatchView && (
                <span className="text-[9px] lowercase font-mono font-normal tracking-normal text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                  tailored for target role
                </span>
              )}
            </div>
            <p className="resume-summary-text">
              {customSummary || profile.summary}
            </p>
          </div>
        )}

        {/* 3. Sections loop */}
        {sortedSections.map(section => {
          // Check visibility
          if (section.is_visible === false) return null;

          const secEntries = visibleEntries.filter(e => e.section_id === section.id).sort((a, b) => a.order - b.order);

          // Handle References specifically
          if (section.id === 'sec_ref') {
            if (!references || references.length === 0) return null;
            return (
              <div key={section.id} className="resume-section">
                <div className="resume-section-title group">
                  <span>{section.name}</span>
                  {onToggleSectionVisibility && (
                    <button
                      onClick={() => onToggleSectionVisibility(section.id, section.is_visible)}
                      className="no-print opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-700 p-0.5 rounded"
                      title="Hide section"
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="resume-references-grid">
                  {references.map(ref => (
                    <div key={ref.id} className="resume-reference-card">
                      <div className="resume-ref-name">{ref.name}</div>
                      <div className="resume-ref-org">{ref.title_org}</div>
                      <div className="text-[8.5pt] text-slate-500">
                        {ref.email} | {ref.phone}
                      </div>
                      {ref.relationship && (
                        <div className="text-[8pt] text-slate-400 italic mt-0.5">{ref.relationship}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          }

          if (secEntries.length === 0) return null;

          // Technical Skills Section (Render dynamic labeled subcategories)
          if (section.id === 'sec_skills') {
            const secSubs = subsections.filter(s => s.section_id === section.id).sort((a, b) => a.order - b.order);
            return (
              <div key={section.id} className="resume-section">
                <div className="resume-section-title group">
                  <span>{section.name}</span>
                  {onToggleSectionVisibility && (
                    <button
                      onClick={() => onToggleSectionVisibility(section.id, section.is_visible)}
                      className="no-print opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-700 p-0.5 rounded"
                      title="Hide section"
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="resume-skills-grid">
                  {secSubs.map(sub => {
                    const subEntries = secEntries.filter(e => e.subsection_id === sub.id);
                    if (subEntries.length === 0) return null;
                    return (
                      <div key={sub.id} className="resume-skill-row group">
                        <div className="resume-skill-label">{sub.name}:</div>
                        <div className="resume-skill-value">
                          {subEntries.map(e => e.description).join('; ')}
                        </div>
                      </div>
                    );
                  })}
                  {/* Any skills not assigned to a subsection */}
                  {secEntries.filter(e => !e.subsection_id).length > 0 && (
                    <div className="resume-skill-row">
                      <div className="resume-skill-label">Additional Tools:</div>
                      <div className="resume-skill-value">
                        {secEntries.filter(e => !e.subsection_id).map(e => e.description).join('; ')}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          }

          // General Sections (Education, Featured Projects, Applied Experience, Awards, Certifications, Leadership, Custom)
          return (
            <div key={section.id} className="resume-section">
              <div className="resume-section-title group">
                <span>{section.name}</span>
                {onToggleSectionVisibility && (
                  <button
                    onClick={() => onToggleSectionVisibility(section.id, section.is_visible)}
                    className="no-print opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-700 p-0.5 rounded"
                    title="Hide section"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-2.5">
                {secEntries.map(entry => {
                  const dateStr = [entry.date_start, entry.date_end].filter(Boolean).join(' – ');
                  return (
                    <div key={entry.id} className="resume-entry relative group">
                      <div className="resume-entry-header">
                        <div className="resume-entry-title-group">
                          <span className="resume-entry-title">{entry.title}</span>
                          {entry.role && <span className="resume-entry-role">— {entry.role}</span>}
                          {entry.institution && (
                            <span className="resume-entry-org">| {entry.institution}</span>
                          )}
                          {entry.links && entry.links.length > 0 && (
                            <a
                              href={entry.links[0]}
                              target="_blank"
                              rel="noreferrer"
                              className="resume-entry-link no-print"
                              title="View Project Link"
                            >
                              <ExternalLink className="w-2.5 h-2.5" />
                              <span>link</span>
                            </a>
                          )}
                        </div>
                        {dateStr && <span className="resume-entry-date">{dateStr}</span>}
                      </div>

                      {entry.description && (
                        <p className="resume-entry-desc">{entry.description}</p>
                      )}

                      {entry.metrics && (
                        <div className="resume-entry-impact">
                          <strong>Key Result: </strong>{entry.metrics}
                        </div>
                      )}

                      {/* Inline quick edit button on hover */}
                      {onEditEntry && (
                        <button
                          onClick={() => onEditEntry(entry)}
                          className="no-print absolute top-0 right-0 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-sky-600 transition p-1"
                          title="Edit Entry"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
