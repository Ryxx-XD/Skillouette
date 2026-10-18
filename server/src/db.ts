import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ResumeData, Entry, Section, Subsection, Profile, ReferenceItem, JobSnapshot, CaptureLog, AppSettings, UpskillingRecommendation, CareerPathway } from './types.js';
import { initialResumeData } from './seed.js';
import { telemetry } from './telemetry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'resumedb.json');

class Database {
  private data: ResumeData;

  constructor() {
    this.ensureDataDirectory();
    this.data = this.loadData();
  }

  private ensureDataDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadData(): ResumeData {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw) as ResumeData;
        // Merge missing keys if any
        return {
          profile: { ...initialResumeData.profile, ...parsed.profile },
          sections: parsed.sections || initialResumeData.sections,
          subsections: parsed.subsections || initialResumeData.subsections,
          entries: parsed.entries || initialResumeData.entries,
          references: parsed.references || initialResumeData.references,
          snapshots: parsed.snapshots || [],
          logs: parsed.logs || [],
          settings: { ...initialResumeData.settings, ...(parsed.settings || {}) },
          upskilling_items: parsed.upskilling_items || [],
          pathways: parsed.pathways || []
        };
      }
    } catch (err) {
      console.error('Error reading database file, using default seed:', err);
    }
    this.saveData(initialResumeData);
    return JSON.parse(JSON.stringify(initialResumeData));
  }

  private saveData(data: ResumeData) {
    try {
      const tempPath = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
      telemetry.recordDbOp(true);
    } catch (err) {
      telemetry.recordDbOp(false);
      console.error('Failed to write database file:', err);
    }
  }

  // Getters
  public getAll(): ResumeData {
    return this.data;
  }

  public getProfile(): Profile {
    return this.data.profile;
  }

  public updateProfile(profile: Partial<Profile>): Profile {
    this.data.profile = { ...this.data.profile, ...profile };
    this.saveData(this.data);
    return this.data.profile;
  }

  public getSections(): Section[] {
    return this.data.sections.sort((a, b) => a.order - b.order);
  }

  public addSection(name: string, description?: string): Section {
    const maxOrder = this.data.sections.reduce((max, s) => Math.max(max, s.order), 0);
    const newSection: Section = {
      id: `sec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      order: maxOrder + 1,
      is_custom: true,
      is_visible: true,
      description
    };
    this.data.sections.push(newSection);
    this.saveData(this.data);
    return newSection;
  }

  public updateSection(id: string, updates: Partial<Section>): Section | null {
    const sec = this.data.sections.find(s => s.id === id);
    if (!sec) return null;
    Object.assign(sec, updates);
    this.saveData(this.data);
    return sec;
  }

  public deleteSection(id: string): boolean {
    const idx = this.data.sections.findIndex(s => s.id === id);
    if (idx === -1) return false;
    this.data.sections.splice(idx, 1);
    // Also remove subsections and entries belonging to this section
    this.data.subsections = this.data.subsections.filter(sub => sub.section_id !== id);
    this.data.entries = this.data.entries.filter(e => e.section_id !== id);
    this.saveData(this.data);
    return true;
  }

  public reorderSections(orderedIds: string[]): Section[] {
    orderedIds.forEach((id, index) => {
      const sec = this.data.sections.find(s => s.id === id);
      if (sec) sec.order = index + 1;
    });
    this.saveData(this.data);
    return this.getSections();
  }

  // Subsections
  public getSubsections(sectionId?: string): Subsection[] {
    if (sectionId) {
      return this.data.subsections.filter(s => s.section_id === sectionId).sort((a, b) => a.order - b.order);
    }
    return this.data.subsections.sort((a, b) => a.order - b.order);
  }

  public addSubsection(sectionId: string, name: string): Subsection {
    const siblings = this.data.subsections.filter(s => s.section_id === sectionId);
    const maxOrder = siblings.reduce((max, s) => Math.max(max, s.order), 0);
    const newSub: Subsection = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      section_id: sectionId,
      name: name.trim(),
      order: maxOrder + 1
    };
    this.data.subsections.push(newSub);
    this.saveData(this.data);
    return newSub;
  }

  public deleteSubsection(id: string): boolean {
    const idx = this.data.subsections.findIndex(s => s.id === id);
    if (idx === -1) return false;
    this.data.subsections.splice(idx, 1);
    // Clear subsection_id on any entries assigned to this
    this.data.entries.forEach(e => {
      if (e.subsection_id === id) e.subsection_id = null;
    });
    this.saveData(this.data);
    return true;
  }

  // Entries
  public getEntries(sectionId?: string): Entry[] {
    let list = this.data.entries;
    if (sectionId) {
      list = list.filter(e => e.section_id === sectionId);
    }
    return list.sort((a, b) => a.order - b.order);
  }

  public getEntry(id: string): Entry | null {
    return this.data.entries.find(e => e.id === id) || null;
  }

  public addEntry(entry: Omit<Entry, 'id' | 'order'> & { order?: number }): Entry {
    const siblings = this.data.entries.filter(e => e.section_id === entry.section_id);
    const maxOrder = siblings.reduce((max, e) => Math.max(max, e.order), 0);
    const newEntry: Entry = {
      ...entry,
      id: `ent_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      order: entry.order ?? (maxOrder + 1),
      is_active: entry.is_active ?? true,
      tags: entry.tags || [],
      links: entry.links || []
    };
    this.data.entries.push(newEntry);
    this.saveData(this.data);
    return newEntry;
  }

  public addMultipleEntries(entries: Array<Omit<Entry, 'id' | 'order'> & { order?: number }>): Entry[] {
    const created: Entry[] = [];
    for (const ent of entries) {
      created.push(this.addEntry(ent));
    }
    return created;
  }

  public updateEntry(id: string, updates: Partial<Entry>): Entry | null {
    const entry = this.data.entries.find(e => e.id === id);
    if (!entry) return null;
    Object.assign(entry, updates);
    this.saveData(this.data);
    return entry;
  }

  public deleteEntry(id: string): boolean {
    const idx = this.data.entries.findIndex(e => e.id === id);
    if (idx === -1) return false;
    this.data.entries.splice(idx, 1);
    this.saveData(this.data);
    return true;
  }

  public reorderEntries(sectionId: string, orderedIds: string[]): Entry[] {
    orderedIds.forEach((id, index) => {
      const entry = this.data.entries.find(e => e.id === id);
      if (entry) entry.order = index + 1;
    });
    this.saveData(this.data);
    return this.getEntries(sectionId);
  }

  // References
  public getReferences(): ReferenceItem[] {
    return this.data.references;
  }

  public updateReferences(references: ReferenceItem[]): ReferenceItem[] {
    this.data.references = references;
    this.saveData(this.data);
    return this.data.references;
  }

  // Snapshots (Job Match)
  public getSnapshots(): JobSnapshot[] {
    return this.data.snapshots.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public saveSnapshot(snapshot: Omit<JobSnapshot, 'id' | 'created_at'>): JobSnapshot {
    const newSnapshot: JobSnapshot = {
      ...snapshot,
      id: `snap_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString()
    };
    this.data.snapshots.unshift(newSnapshot);
    this.saveData(this.data);
    return newSnapshot;
  }

  public deleteSnapshot(id: string): boolean {
    const idx = this.data.snapshots.findIndex(s => s.id === id);
    if (idx === -1) return false;
    this.data.snapshots.splice(idx, 1);
    this.saveData(this.data);
    return true;
  }

  // Logs
  public addLog(raw_input: string, parsed_entries: any[], model_name: string): CaptureLog {
    const log: CaptureLog = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      raw_input,
      parsed_entries,
      model_name
    };
    this.data.logs.unshift(log);
    if (this.data.logs.length > 100) this.data.logs.pop();
    this.saveData(this.data);
    return log;
  }

  public getLogs(): CaptureLog[] {
    return this.data.logs;
  }

  // Settings
  public getSettings(): AppSettings {
    return this.data.settings;
  }

  public updateSettings(updates: Partial<AppSettings>): AppSettings {
    this.data.settings = { ...this.data.settings, ...updates };
    this.saveData(this.data);
    return this.data.settings;
  }

  // Reset to seed
  public resetToSeed(): ResumeData {
    this.data = JSON.parse(JSON.stringify(initialResumeData));
    this.saveData(this.data);
    return this.data;
  }

  // Upskilling Items
  public getUpskillingItems(): UpskillingRecommendation[] {
    return this.data.upskilling_items || [];
  }

  public saveUpskillingItem(item: UpskillingRecommendation): UpskillingRecommendation {
    if (!this.data.upskilling_items) this.data.upskilling_items = [];
    const existingIdx = this.data.upskilling_items.findIndex(u => u.id === item.id || u.competency.toLowerCase() === item.competency.toLowerCase());
    if (existingIdx !== -1) {
      this.data.upskilling_items[existingIdx] = { ...this.data.upskilling_items[existingIdx], ...item };
      this.saveData(this.data);
      return this.data.upskilling_items[existingIdx];
    }
    this.data.upskilling_items.push(item);
    this.saveData(this.data);
    return item;
  }

  public updateUpskillingStatus(id: string, status: 'not_started' | 'in_progress' | 'completed', notes?: string): UpskillingRecommendation | null {
    if (!this.data.upskilling_items) return null;
    const item = this.data.upskilling_items.find(u => u.id === id);
    if (!item) return null;
    item.status = status;
    if (notes !== undefined) item.notes = notes;
    this.saveData(this.data);
    return item;
  }

  // Career Pathways
  public getPathways(): CareerPathway[] {
    return this.data.pathways || [];
  }

  public savePathways(pathways: CareerPathway[]): CareerPathway[] {
    this.data.pathways = pathways;
    this.saveData(this.data);
    return this.data.pathways;
  }
}

export const db = new Database();
