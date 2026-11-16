import fs from "node:fs";
import path from "node:path";
import { autoFieldPolygon } from "@seedle/core";
import type { FieldYearStatus } from "@seedle/contracts";
import { providers } from "../providers";
import {
  REAL_FREISING_FIBOA_CENTERS,
  REAL_FREISING_FIBOA_POLYGONS,
} from "./real-freising-fiboa-fields";
import type { FarmRow, FieldRow, FieldYearRow, KnowledgeRow } from "./schema";
import type { ChatMessage } from "@seedle/contracts";

const pt1 = REAL_FREISING_FIBOA_CENTERS.fld_demo_voetting!;
const pt2 = REAL_FREISING_FIBOA_CENTERS.fld_demo_weihenstephan!;
const pt3 = REAL_FREISING_FIBOA_CENTERS.fld_demo_isarau!;
const pt4 = REAL_FREISING_FIBOA_CENTERS.fld_demo_feldmark_nord!;
const pt5 = REAL_FREISING_FIBOA_CENTERS.fld_demo_mosecker!;
const pt6 = REAL_FREISING_FIBOA_CENTERS.fld_demo_kreuzbreite!;
const pt7 = REAL_FREISING_FIBOA_CENTERS.fld_demo_holzweg!;

export const MAX_ITEMS_PER_COLLECTION = 5000;

function enforceMapCapacity<K, V>(map: Map<string | K, V>, maxCapacity: number = MAX_ITEMS_PER_COLLECTION): void {
  while (map.size >= maxCapacity) {
    const oldestKey = map.keys().next().value;
    if (oldestKey !== undefined) {
      map.delete(oldestKey);
    } else {
      break;
    }
  }
}

export const DEFAULT_FARM: FarmRow = {
  id: "frm_demo_freising",
  userId: "usr_demo_landwirt",
  name: "Betrieb Peter Müller",
  strasse: "Vöttinger Str. 42",
  plz: "85354",
  ort: "Freising",
  lat: 48.402,
  lon: 11.728,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

function createInitialFields(): FieldRow[] {
  const env1 = providers().environment.environmentAt(pt1);
  const env2 = providers().environment.environmentAt(pt2);
  const env3 = providers().environment.environmentAt(pt3);
  const env4 = providers().environment.environmentAt(pt4);
  const env5 = providers().environment.environmentAt(pt5);
  const env6 = providers().environment.environmentAt(pt6);
  const env7 = providers().environment.environmentAt(pt7);

  const now = new Date("2026-01-01");

  // 7 official Bavarian InVeKoS / fiboa field blocks (29 to 109 vertices each) totaling 100.0 ha:
  // 14.5 + 11.8 + 18.2 + 16.5 + 15.0 + 13.2 + 10.8 = 100.0 ha
  return [
    {
      id: "fld_demo_voetting",
      userId: "usr_demo_landwirt",
      farmId: "frm_demo_freising",
      name: "Vöttinger Feld",
      lat: pt1.lat,
      lon: pt1.lon,
      geometry: REAL_FREISING_FIBOA_POLYGONS.fld_demo_voetting ?? autoFieldPolygon(pt1),
      areaHa: 14.5,
      env: env1,
      status: "status-ok",
      crop: "mais",
      usage: "silomais",
      previousVarietyId: "aw-talkrone",
      previousVarietyText: null,
      selectedVarietyId: "aw-talkrone",
      saison: 2027,
      aussaat: "2027-04-20",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "fld_demo_weihenstephan",
      userId: "usr_demo_landwirt",
      farmId: "frm_demo_freising",
      name: "Weihenstephaner Berg",
      lat: pt2.lat,
      lon: pt2.lon,
      geometry: REAL_FREISING_FIBOA_POLYGONS.fld_demo_weihenstephan ?? autoFieldPolygon(pt2),
      areaHa: 11.8,
      env: env2,
      status: "status-action",
      crop: "mais",
      usage: "koernermais",
      previousVarietyId: "aw-lichtkorn",
      previousVarietyText: null,
      selectedVarietyId: "aw-lichtkorn",
      saison: 2027,
      aussaat: "2027-04-24",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "fld_demo_isarau",
      userId: "usr_demo_landwirt",
      farmId: "frm_demo_freising",
      name: "Isarau",
      lat: pt3.lat,
      lon: pt3.lon,
      geometry: REAL_FREISING_FIBOA_POLYGONS.fld_demo_isarau ?? autoFieldPolygon(pt3),
      areaHa: 18.2,
      env: env3,
      status: "status-problem",
      crop: "mais",
      usage: "biogas",
      previousVarietyId: "ah-klassik",
      previousVarietyText: "Auenhof Klassik",
      selectedVarietyId: null,
      saison: 2027,
      aussaat: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "fld_demo_feldmark_nord",
      userId: "usr_demo_landwirt",
      farmId: "frm_demo_freising",
      name: "Feldmark Nord",
      lat: pt4.lat,
      lon: pt4.lon,
      geometry: REAL_FREISING_FIBOA_POLYGONS.fld_demo_feldmark_nord ?? autoFieldPolygon(pt4),
      areaHa: 16.5,
      env: env4,
      status: "status-ok",
      crop: "mais",
      usage: "koernermais",
      previousVarietyId: "aw-talkrone",
      previousVarietyText: null,
      selectedVarietyId: "aw-talkrone",
      saison: 2027,
      aussaat: "2027-04-19",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "fld_demo_mosecker",
      userId: "usr_demo_landwirt",
      farmId: "frm_demo_freising",
      name: "Mosecker Schlag",
      lat: pt5.lat,
      lon: pt5.lon,
      geometry: REAL_FREISING_FIBOA_POLYGONS.fld_demo_mosecker ?? autoFieldPolygon(pt5),
      areaHa: 15.0,
      env: env5,
      status: "status-ok",
      crop: "mais",
      usage: "silomais",
      previousVarietyId: "aw-sonnenkraft",
      previousVarietyText: null,
      selectedVarietyId: "aw-sonnenkraft",
      saison: 2027,
      aussaat: "2027-04-21",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "fld_demo_kreuzbreite",
      userId: "usr_demo_landwirt",
      farmId: "frm_demo_freising",
      name: "Kreuzbreite",
      lat: pt6.lat,
      lon: pt6.lon,
      geometry: REAL_FREISING_FIBOA_POLYGONS.fld_demo_kreuzbreite ?? autoFieldPolygon(pt6),
      areaHa: 13.2,
      env: env6,
      status: "status-action",
      crop: "mais",
      usage: "koernermais",
      previousVarietyId: "rz-mainau",
      previousVarietyText: null,
      selectedVarietyId: "rz-mainau",
      saison: 2027,
      aussaat: "2027-04-23",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "fld_demo_holzweg",
      userId: "usr_demo_landwirt",
      farmId: "frm_demo_freising",
      name: "Am Holzweg",
      lat: pt7.lat,
      lon: pt7.lon,
      geometry: REAL_FREISING_FIBOA_POLYGONS.fld_demo_holzweg ?? autoFieldPolygon(pt7),
      areaHa: 10.8,
      env: env7,
      status: "status-ok",
      crop: "mais",
      usage: "silomais",
      previousVarietyId: "ah-bernstein",
      previousVarietyText: null,
      selectedVarietyId: "ah-bernstein",
      saison: 2027,
      aussaat: "2027-04-22",
      createdAt: now,
      updatedAt: now,
    },
  ];
}

class InMemoryStore {
  private farms: Map<string, FarmRow> = new Map();
  private fields: Map<string, FieldRow> = new Map();
  private deletedFields: Set<string> = new Set();
  private fieldYears: Map<string, FieldYearRow[]> = new Map();
  private chatMessages: Map<string, ChatMessage[]> = new Map();
  private knowledgeFacts: Map<string, KnowledgeRow[]> = new Map();
  private lastLoadedMtimeMs = 0;
  private tmpWriteCounter = 0;

  constructor() {
    this.reset(false);
    this.loadFromDiskIfAvailable();
  }

  private isDiskPersistenceEnabled(): boolean {
    return (
      typeof process !== "undefined" &&
      process.env.NODE_ENV !== "test" &&
      !process.env.VITEST
    );
  }

  private getSnapshotFilePath(): string {
    return path.resolve(process.cwd(), ".data", "in-memory-store.json");
  }

  private loadFromDiskIfAvailable(): void {
    if (!this.isDiskPersistenceEnabled()) return;
    try {
      const filePath = this.getSnapshotFilePath();
      if (!fs.existsSync(filePath)) return;
      const stat = fs.statSync(filePath);
      if (stat.mtimeMs <= this.lastLoadedMtimeMs) return;
      const raw = fs.readFileSync(filePath, "utf8");
      const parsed = JSON.parse(raw) as {
        farms?: Array<[string, FarmRow]>;
        fields?: Array<[string, FieldRow]>;
        deletedFields?: string[];
        fieldYears?: Array<[string, FieldYearRow[]]>;
      };
      if (Array.isArray(parsed.farms)) {
        this.farms = new Map(
          parsed.farms.map(([k, v]) => [
            k,
            {
              ...v,
              createdAt: new Date(v.createdAt),
              updatedAt: new Date(v.updatedAt),
            },
          ]),
        );
      }
      if (Array.isArray(parsed.fields)) {
        // Upgrade legacy snapshots automatically to the 7-field (~100 ha) official fiboa DEBYLI baseline (>= 25 vertices per field)
        const hasRealFiboaBaseline = parsed.fields.some(
          ([k, v]) =>
            k === "fld_demo_feldmark_nord" &&
            (v?.geometry?.coordinates?.[0]?.length ?? 0) >= 25,
        );
        if (!hasRealFiboaBaseline) {
          this.reset(true);
          return;
        }
        this.fields = new Map(
          parsed.fields.map(([k, v]) => [
            k,
            {
              ...v,
              createdAt: new Date(v.createdAt),
              updatedAt: new Date(v.updatedAt),
            },
          ]),
        );
      }
      if (Array.isArray(parsed.deletedFields)) {
        this.deletedFields = new Set(parsed.deletedFields);
      }
      if (Array.isArray(parsed.fieldYears)) {
        this.fieldYears = new Map(
          parsed.fieldYears.map(([k, list]) => [
            k,
            list.map((fy) => ({
              ...fy,
              createdAt: new Date(fy.createdAt),
              updatedAt: new Date(fy.updatedAt),
            })),
          ]),
        );
      }
      this.lastLoadedMtimeMs = stat.mtimeMs;
    } catch {
      // Ignore disk sync errors in read-only or edge environments
    }
  }

  public saveToDiskIfAvailable(forceEvenInTest = false): void {
    if (!forceEvenInTest && !this.isDiskPersistenceEnabled()) return;
    const uniqueSuffix = `${process.pid}.${Date.now()}.${++this.tmpWriteCounter}.${Math.random()
      .toString(36)
      .slice(2, 8)}`;
    let tmpPath = "";
    try {
      const filePath = this.getSnapshotFilePath();
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      tmpPath = `${filePath}.${uniqueSuffix}.tmp`;
      const payload = JSON.stringify({
        farms: Array.from(this.farms.entries()),
        fields: Array.from(this.fields.entries()),
        deletedFields: Array.from(this.deletedFields.values()),
        fieldYears: Array.from(this.fieldYears.entries()),
      });
      fs.writeFileSync(tmpPath, payload, "utf8");
      fs.renameSync(tmpPath, filePath);
      const stat = fs.statSync(filePath);
      this.lastLoadedMtimeMs = stat.mtimeMs;
    } catch {
      if (tmpPath) {
        try {
          if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
        } catch {
          // Ignore cleanup error
        }
      }
    }
  }

  public reset(persist = true): void {
    this.farms.clear();
    this.fields.clear();
    this.deletedFields.clear();
    this.fieldYears.clear();
    this.chatMessages.clear();
    this.knowledgeFacts.clear();

    const farm = { ...DEFAULT_FARM };
    this.farms.set(farm.userId, farm);
    this.farms.set("usr_musterhof", { ...farm, userId: "usr_musterhof" });

    for (const f of createInitialFields()) {
      this.fields.set(f.id, { ...f });

      // Link canonical seedle-eu IDs as identical references
      const aliasMap: Record<string, string[]> = {
        fld_demo_voetting: ["f-hinteracker"],
        fld_demo_weihenstephan: ["f-muehlfeld", "f-hangbreite"],
        fld_demo_isarau: ["f-suedhang", "f-bachwiese"],
        fld_demo_feldmark_nord: ["f-feldmark-nord"],
        fld_demo_mosecker: ["f-mosecker-schlag"],
        fld_demo_kreuzbreite: ["f-kreuzbreite"],
        fld_demo_holzweg: ["f-am-holzweg"],
      };
      const aliases = aliasMap[f.id] ?? [];

      for (const altId of aliases) {
        this.fields.set(altId, { ...f, id: altId });
      }

      const fyList: FieldYearRow[] = [
        {
          id: `fy_${f.id}_2027`,
          fieldId: f.id,
          jahr: 2027,
          crop: f.crop ?? "mais",
          varietyId: f.selectedVarietyId,
          varietyText: f.previousVarietyText,
          usage: f.usage,
          status: (f.selectedVarietyId ? "gewaehlt" : "geplant") as FieldYearStatus,
          areaHa: f.areaHa,
          createdAt: f.createdAt,
          updatedAt: f.updatedAt,
        },
      ];
      this.fieldYears.set(f.id, fyList);
      for (const altId of aliases) {
        this.fieldYears.set(altId, fyList);
      }
    }
    if (persist) {
      this.saveToDiskIfAvailable();
    }
  }

  public getFarm(userId?: string): FarmRow {
    this.loadFromDiskIfAvailable();
    const u = userId || "usr_demo_landwirt";
    const found = this.farms.get(u);
    if (found) return { ...found };
    enforceMapCapacity(this.farms);
    const created: FarmRow = {
      id: `frm_${u}`,
      userId: u,
      name: "Mein Hof",
      strasse: null,
      plz: null,
      ort: null,
      lat: null,
      lon: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.farms.set(u, created);
    this.saveToDiskIfAvailable();
    return { ...created };
  }

  public updateFarm(userId: string, patch: Partial<FarmRow>): FarmRow {
    this.loadFromDiskIfAvailable();
    const existing = this.getFarm(userId);
    const updated = { ...existing, ...patch, updatedAt: new Date() };
    this.farms.set(userId, updated);
    this.saveToDiskIfAvailable();
    return { ...updated };
  }

  public listFields(userId?: string): FieldRow[] {
    this.loadFromDiskIfAvailable();
    const u = userId || "usr_demo_landwirt";
    const list: FieldRow[] = [];
    const seen = new Set<string>();

    for (const f of this.fields.values()) {
      if (f.id.startsWith("f-")) continue; // Avoid duplicate listings of aliases
      if (f.userId === u || u === "usr_demo_landwirt" || u === "usr_musterhof") {
        const dedupeKey = `${f.id}:${f.name}`;
        if (!seen.has(dedupeKey) && !seen.has(f.name)) {
          seen.add(dedupeKey);
          seen.add(f.name);
          list.push({ ...f, userId: u });
        }
      }
    }
    return list;
  }

  public getField(userId: string, fieldId: string): FieldRow | null {
    this.loadFromDiskIfAvailable();
    const isDemo = userId === "usr_demo_landwirt" || userId === "usr_musterhof";
    const f = this.fields.get(fieldId);
    if (!f) {
      if (isDemo && !this.deletedFields.has(fieldId)) {
        const now = new Date();
        const env = providers().environment.environmentAt(pt1);
        const geom = autoFieldPolygon(pt1);
        const synthesized: FieldRow = {
          id: fieldId,
          userId: "usr_demo_landwirt",
          farmId: DEFAULT_FARM.id,
          name: "Mein Feld",
          lat: pt1.lat,
          lon: pt1.lon,
          geometry: geom,
          areaHa: 14.5,
          env,
          status: "status-ok",
          crop: "mais",
          usage: "silomais",
          previousVarietyId: null,
          previousVarietyText: null,
          selectedVarietyId: null,
          saison: 2027,
          aussaat: "2027-04-20",
          createdAt: now,
          updatedAt: now,
        };
        this.setField(synthesized);
        this.setFieldYear(fieldId, 2027, {
          id: `fy_${fieldId}_2027`,
          fieldId,
          jahr: 2027,
          crop: "mais",
          varietyId: null,
          varietyText: null,
          usage: "silomais",
          status: "geplant",
          areaHa: 14.5,
          createdAt: now,
          updatedAt: now,
        });
        return { ...synthesized };
      }
      return null;
    }
    const fieldIsDemo = f.userId === "usr_demo_landwirt" || f.userId === "usr_musterhof";
    if (f.userId === userId || (isDemo && fieldIsDemo)) {
      return { ...f };
    }
    return null;
  }

  public setField(field: FieldRow): FieldRow {
    this.loadFromDiskIfAvailable();
    this.deletedFields.delete(field.id);
    if (!this.fields.has(field.id)) {
      enforceMapCapacity(this.fields);
    }
    this.fields.set(field.id, { ...field });
    // Also update aliases
    if (field.id === "fld_demo_voetting") this.fields.set("f-hinteracker", { ...field, id: "f-hinteracker" });
    if (field.id === "f-hinteracker") this.fields.set("fld_demo_voetting", { ...field, id: "fld_demo_voetting" });
    if (field.id === "fld_demo_weihenstephan") this.fields.set("f-muehlfeld", { ...field, id: "f-muehlfeld" });
    if (field.id === "f-muehlfeld") this.fields.set("fld_demo_weihenstephan", { ...field, id: "fld_demo_weihenstephan" });
    if (field.id === "fld_demo_isarau") this.fields.set("f-suedhang", { ...field, id: "f-suedhang" });
    if (field.id === "f-suedhang") this.fields.set("fld_demo_isarau", { ...field, id: "fld_demo_isarau" });
    this.saveToDiskIfAvailable();
    return { ...field };
  }

  public deleteField(userId: string, fieldId: string): boolean {
    this.loadFromDiskIfAvailable();
    const f = this.fields.get(fieldId);
    if (!f) return false;
    const isDemo = userId === "usr_demo_landwirt" || userId === "usr_musterhof";
    const fieldIsDemo = f.userId === "usr_demo_landwirt" || f.userId === "usr_musterhof";
    if (f.userId === userId || (isDemo && fieldIsDemo)) {
      this.fields.delete(fieldId);
      this.deletedFields.add(fieldId);
      this.saveToDiskIfAvailable();
      return true;
    }
    return false;
  }

  public transferFields(fromUserId: string, toUserId: string, toFarmId: string): void {
    this.loadFromDiskIfAvailable();
    for (const f of this.fields.values()) {
      if (f.userId === fromUserId) {
        f.userId = toUserId;
        f.farmId = toFarmId;
      }
    }
    this.saveToDiskIfAvailable();
  }

  public listFieldYears(fieldId: string): FieldYearRow[] {
    this.loadFromDiskIfAvailable();
    const list = this.fieldYears.get(fieldId) ?? [];
    return [...list].sort((a, b) => b.jahr - a.jahr);
  }

  public setFieldYear(fieldId: string, jahr: number, fy: FieldYearRow): FieldYearRow {
    this.loadFromDiskIfAvailable();
    const existing = this.fieldYears.get(fieldId) ?? [];
    const filtered = existing.filter((item) => item.jahr !== jahr);
    filtered.push(fy);
    if (!this.fieldYears.has(fieldId)) {
      enforceMapCapacity(this.fieldYears);
    }
    this.fieldYears.set(fieldId, filtered);

    let altId = "";
    if (fieldId === "fld_demo_voetting") altId = "f-hinteracker";
    if (fieldId === "f-hinteracker") altId = "fld_demo_voetting";
    if (fieldId === "fld_demo_weihenstephan") altId = "f-muehlfeld";
    if (fieldId === "f-muehlfeld") altId = "fld_demo_weihenstephan";
    if (fieldId === "fld_demo_isarau") altId = "f-suedhang";
    if (fieldId === "f-suedhang") altId = "fld_demo_isarau";

    if (altId) {
      this.fieldYears.set(altId, filtered);
    }

    this.saveToDiskIfAvailable();
    return { ...fy };
  }

  public deleteFieldYear(fieldId: string, jahr: number): boolean {
    this.loadFromDiskIfAvailable();
    const existing = this.fieldYears.get(fieldId);
    if (!existing) return false;
    const filtered = existing.filter((item) => item.jahr !== jahr);
    this.fieldYears.set(fieldId, filtered);
    this.saveToDiskIfAvailable();
    return true;
  }

  public getChatMessages(userId: string): ChatMessage[] {
    return (this.chatMessages.get(userId) ?? []).map((m) => ({ ...m }));
  }

  public addChatMessage(userId: string, msg: ChatMessage): void {
    const list = this.chatMessages.get(userId) ?? [];
    if (list.length >= MAX_ITEMS_PER_COLLECTION) {
      list.shift();
    }
    list.push({ ...msg });
    if (!this.chatMessages.has(userId)) {
      enforceMapCapacity(this.chatMessages);
    }
    this.chatMessages.set(userId, list);
  }

  public clearChatMessages(userId: string): void {
    this.chatMessages.set(userId, []);
  }

  public getKnowledgeFacts(userId: string): KnowledgeRow[] {
    return (this.knowledgeFacts.get(userId) ?? []).map((k) => ({ ...k }));
  }

  public addKnowledgeFact(row: KnowledgeRow): void {
    const list = this.knowledgeFacts.get(row.userId) ?? [];
    if (list.length >= MAX_ITEMS_PER_COLLECTION) {
      list.pop();
    }
    list.unshift({ ...row });
    if (!this.knowledgeFacts.has(row.userId)) {
      enforceMapCapacity(this.knowledgeFacts);
    }
    this.knowledgeFacts.set(row.userId, list);
  }
}

const globalForStore = globalThis as unknown as {
  __seedleInMemoryStore?: InMemoryStore;
};

export const inMemoryStore =
  globalForStore.__seedleInMemoryStore ??
  (globalForStore.__seedleInMemoryStore = new InMemoryStore());
