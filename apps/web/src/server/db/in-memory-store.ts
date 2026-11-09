import { autoFieldPolygon } from "@seedle/core";
import type { FieldYearStatus } from "@seedle/contracts";
import { providers } from "../providers";
import type { FarmRow, FieldRow, FieldYearRow, KnowledgeRow } from "./schema";
import type { ChatMessage } from "@seedle/contracts";

const pt1 = { lat: 48.402, lon: 11.728 };
const pt2 = { lat: 48.396, lon: 11.719 };
const pt3 = { lat: 48.388, lon: 11.745 };

export const MAX_ITEMS_PER_COLLECTION = 5000;

function enforceMapCapacity<K, V>(map: Map<K, V>, maxCapacity: number = MAX_ITEMS_PER_COLLECTION): void {
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
  const geom1 = autoFieldPolygon(pt1);

  const env2 = providers().environment.environmentAt(pt2);
  const geom2 = autoFieldPolygon(pt2);

  const env3 = providers().environment.environmentAt(pt3);
  const geom3 = autoFieldPolygon(pt3);

  const now = new Date("2026-01-01");

  return [
    {
      id: "fld_demo_voetting",
      userId: "usr_demo_landwirt",
      farmId: "frm_demo_freising",
      name: "Vöttinger Feld",
      lat: pt1.lat,
      lon: pt1.lon,
      geometry: geom1,
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
      geometry: geom2,
      areaHa: 8.2,
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
      geometry: geom3,
      areaHa: 21.0,
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
  ];
}

class InMemoryStore {
  private farms: Map<string, FarmRow> = new Map();
  private fields: Map<string, FieldRow> = new Map();
  private deletedFields: Set<string> = new Set();
  private fieldYears: Map<string, FieldYearRow[]> = new Map();
  private chatMessages: Map<string, ChatMessage[]> = new Map();
  private knowledgeFacts: Map<string, KnowledgeRow[]> = new Map();

  constructor() {
    this.reset();
  }

  public reset(): void {
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
      let altId = "";
      if (f.id === "fld_demo_voetting") altId = "f-hinteracker";
      if (f.id === "fld_demo_weihenstephan") altId = "f-muehlfeld";
      if (f.id === "fld_demo_isarau") altId = "f-suedhang";

      if (altId) {
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
      if (altId) this.fieldYears.set(altId, fyList);
    }
  }

  public getFarm(userId?: string): FarmRow {
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
    return { ...created };
  }

  public updateFarm(userId: string, patch: Partial<FarmRow>): FarmRow {
    const existing = this.getFarm(userId);
    const updated = { ...existing, ...patch, updatedAt: new Date() };
    this.farms.set(userId, updated);
    return { ...updated };
  }

  public listFields(userId?: string): FieldRow[] {
    const u = userId || "usr_demo_landwirt";
    const list: FieldRow[] = [];
    const seen = new Set<string>();

    for (const f of this.fields.values()) {
      if (f.id.startsWith("f-")) continue; // Avoid duplicate listings of aliases
      if (f.userId === u || u === "usr_demo_landwirt" || u === "usr_musterhof") {
        if (!seen.has(f.name)) {
          seen.add(f.name);
          list.push({ ...f, userId: u });
        }
      }
    }
    return list;
  }

  public getField(userId: string, fieldId: string): FieldRow | null {
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
    return { ...field };
  }

  public deleteField(userId: string, fieldId: string): boolean {
    const f = this.fields.get(fieldId);
    if (!f) return false;
    const isDemo = userId === "usr_demo_landwirt" || userId === "usr_musterhof";
    const fieldIsDemo = f.userId === "usr_demo_landwirt" || f.userId === "usr_musterhof";
    if (f.userId === userId || (isDemo && fieldIsDemo)) {
      this.fields.delete(fieldId);
      this.deletedFields.add(fieldId);
      return true;
    }
    return false;
  }

  public transferFields(fromUserId: string, toUserId: string, toFarmId: string): void {
    for (const f of this.fields.values()) {
      if (f.userId === fromUserId) {
        f.userId = toUserId;
        f.farmId = toFarmId;
      }
    }
  }

  public listFieldYears(fieldId: string): FieldYearRow[] {
    const list = this.fieldYears.get(fieldId) ?? [];
    return [...list].sort((a, b) => b.jahr - a.jahr);
  }

  public setFieldYear(fieldId: string, jahr: number, fy: FieldYearRow): FieldYearRow {
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

    return { ...fy };
  }

  public deleteFieldYear(fieldId: string, jahr: number): boolean {
    const existing = this.fieldYears.get(fieldId);
    if (!existing) return false;
    const filtered = existing.filter((item) => item.jahr !== jahr);
    this.fieldYears.set(fieldId, filtered);
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
