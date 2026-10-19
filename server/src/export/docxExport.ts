import { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, Table, TableRow, TableCell, WidthType } from 'docx';
import { ResumeData } from '../types.js';

export async function generateDocxResume(data: ResumeData, customSummary?: string, filteredEntryIds?: string[]): Promise<Document> {
  const { profile, sections, subsections, entries, references } = data;

  const activeEntryIds = filteredEntryIds ? new Set(filteredEntryIds) : null;
  const filteredEntries = entries.filter(e => (!activeEntryIds || activeEntryIds.has(e.id)) && (e.is_active !== false));

  const docChildren: (Paragraph | Table)[] = [];

  // 1. Header (Name, Title, Contact Info)
  docChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: profile.name,
          bold: true,
          size: 34,
          font: 'Aptos',
          color: '1E293B'
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: profile.title,
          size: 22,
          font: 'Aptos',
          color: '0369A1',
          bold: true
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [
        new TextRun({ text: profile.email, size: 18, font: 'Aptos' }),
        new TextRun({ text: '  |  ', size: 18, color: '94A3B8' }),
        new TextRun({ text: profile.phone, size: 18, font: 'Aptos' }),
        new TextRun({ text: '  |  ', size: 18, color: '94A3B8' }),
        new TextRun({ text: profile.location, size: 18, font: 'Aptos' }),
        new TextRun({ text: '  |  ', size: 18, color: '94A3B8' }),
        new TextRun({ text: profile.github.replace('https://', ''), size: 18, font: 'Aptos', color: '2563EB' }),
        new TextRun({ text: '  |  ', size: 18, color: '94A3B8' }),
        new TextRun({ text: profile.linkedin.replace('https://', ''), size: 18, font: 'Aptos', color: '2563EB' })
      ]
    })
  );

  // Helper for Section Titles
  const addSectionHeader = (title: string) => {
    docChildren.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 120 },
        border: {
          bottom: {
            color: '0284C7',
            space: 4,
            style: BorderStyle.SINGLE,
            size: 12
          }
        },
        children: [
          new TextRun({
            text: title.toUpperCase(),
            bold: true,
            size: 22,
            font: 'Aptos',
            color: '0F172A'
          })
        ]
      })
    );
  };

  // 2. Professional Summary
  const summaryText = customSummary || profile.summary;
  if (summaryText) {
    addSectionHeader('Professional Summary');
    docChildren.push(
      new Paragraph({
        spacing: { after: 160 },
        children: [
          new TextRun({
            text: summaryText,
            size: 20,
            font: 'Aptos',
            color: '334155'
          })
        ]
      })
    );
  }

  // Iterate over visible sections in order
  const sortedSections = sections.filter(s => s.is_visible !== false).sort((a, b) => a.order - b.order);

  for (const section of sortedSections) {
    if (section.id === 'sec_ref') continue; // render references at end

    const secEntries = filteredEntries.filter(e => e.section_id === section.id).sort((a, b) => a.order - b.order);
    if (secEntries.length === 0) continue;

    addSectionHeader(section.name);

    if (section.id === 'sec_skills') {
      // Technical Skills formatted by dynamic subsections
      const secSubs = subsections.filter(sub => sub.section_id === section.id).sort((a, b) => a.order - b.order);
      for (const sub of secSubs) {
        const subEntries = secEntries.filter(e => e.subsection_id === sub.id);
        if (subEntries.length > 0) {
          docChildren.push(
            new Paragraph({
              spacing: { before: 60, after: 60 },
              bullet: { level: 0 },
              children: [
                new TextRun({ text: `${sub.name}: `, bold: true, size: 19, font: 'Aptos', color: '1E293B' }),
                new TextRun({
                  text: subEntries.map(e => e.description).join('; '),
                  size: 19,
                  font: 'Aptos',
                  color: '334155'
                })
              ]
            })
          );
        }
      }
    } else {
      // Standard entries (Projects, Experience, Education, Awards, etc.)
      for (const entry of secEntries) {
        const titleRuns: TextRun[] = [
          new TextRun({ text: entry.title, bold: true, size: 20, font: 'Aptos', color: '0F172A' })
        ];

        if (entry.role) {
          titleRuns.push(new TextRun({ text: ` — ${entry.role}`, italics: true, size: 19, font: 'Aptos', color: '475569' }));
        }
        if (entry.institution) {
          titleRuns.push(new TextRun({ text: ` | ${entry.institution}`, size: 19, font: 'Aptos', color: '64748B' }));
        }

        const dateString = [entry.date_start, entry.date_end].filter(Boolean).join(' – ');
        if (dateString) {
          titleRuns.push(new TextRun({ text: `  (${dateString})`, size: 18, font: 'Aptos', color: '64748B' }));
        }

        docChildren.push(
          new Paragraph({
            spacing: { before: 100, after: 40 },
            children: titleRuns
          })
        );

        if (entry.description) {
          docChildren.push(
            new Paragraph({
              spacing: { after: 40 },
              bullet: { level: 0 },
              children: [
                new TextRun({ text: entry.description, size: 19, font: 'Aptos', color: '334155' })
              ]
            })
          );
        }

        if (entry.metrics) {
          docChildren.push(
            new Paragraph({
              spacing: { after: 60 },
              indent: { left: 400 },
              children: [
                new TextRun({ text: 'Key Impact: ', bold: true, size: 18, font: 'Aptos', color: '0369A1' }),
                new TextRun({ text: entry.metrics, size: 18, font: 'Aptos', color: '0369A1' })
              ]
            })
          );
        }
      }
    }
  }

  // References section
  const refSection = sections.find(s => s.id === 'sec_ref' && s.is_visible !== false);
  if (refSection && references && references.length > 0) {
    addSectionHeader(refSection.name);
    for (const ref of references) {
      docChildren.push(
        new Paragraph({
          spacing: { before: 80, after: 40 },
          children: [
            new TextRun({ text: ref.name, bold: true, size: 19, font: 'Aptos', color: '0F172A' }),
            new TextRun({ text: ` — ${ref.title_org}`, italics: true, size: 18, font: 'Aptos', color: '475569' }),
            new TextRun({ text: ` | ${ref.email} | ${ref.phone}`, size: 18, font: 'Aptos', color: '64748B' })
          ]
        })
      );
    }
  }

  return new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720,
              right: 720,
              bottom: 720,
              left: 720
            }
          }
        },
        children: docChildren
      }
    ]
  });
}
