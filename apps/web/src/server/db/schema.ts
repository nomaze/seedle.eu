/**
 * Database schema (PostgreSQL dialect). Operates locally in PGlite and in
 * production on PostgreSQL hosted in the EU without schema alterations.
 */
import type { SprossUiAction } from "@seedle/contracts";
import type { PhotoFinding, Polygon, SiteEnvironment } from "@seedle/core";
import { doublePrecision, integer, jsonb, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

const id = () => text("id").primaryKey();
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

/** User record initialized silently on initial visit; email verified subsequently. */
export const users = pgTable(
  "users",
  {
    id: id(),
    name: text("name"),
    email: text("email"),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    telefon: text("telefon"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("users_email_idx").on(t.email)],
);

export const sessions = pgTable("sessions", {
  token: text("token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  createdAt: createdAt(),
});

export const loginCodes = pgTable("login_codes", {
  id: id(),
  email: text("email").notNull(),
  codeHash: text("code_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: createdAt(),
});

export type FieldStatus = "status-ok" | "status-action" | "status-problem" | "status-urgent";
export type FieldYearStatus = "geplant" | "gewaehlt" | "gekauft";

/** Farm entity: physical address and geographic coordinates. */
export const farms = pgTable(
  "farms",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull().default("Mein Hof"),
    strasse: text("strasse"),
    plz: text("plz"),
    ort: text("ort"),
    lat: doublePrecision("lat"),
    lon: doublePrecision("lon"),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("farms_user_id_idx").on(t.userId)],
);

export const fields = pgTable("fields", {
  id: id(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  farmId: text("farm_id").references(() => farms.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  lat: doublePrecision("lat").notNull(),
  lon: doublePrecision("lon").notNull(),
  geometry: jsonb("geometry").$type<Polygon>().notNull(),
  areaHa: doublePrecision("area_ha").notNull(),
  env: jsonb("env").$type<SiteEnvironment>().notNull(),
  status: text("status").$type<FieldStatus>().notNull().default("status-ok"),
  crop: text("crop"),
  usage: text("usage"),
  /** Previous variety from catalog ... */
  previousVarietyId: text("previous_variety_id"),
  /** ... or free-text variety name when uncataloged. */
  previousVarietyText: text("previous_variety_text"),
  selectedVarietyId: text("selected_variety_id"),
  saison: integer("saison"),
  aussaat: text("aussaat"),
  createdAt: createdAt(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Field cultivation record per calendar year (e.g., 2027: crop, variety, status). */
export const fieldYears = pgTable(
  "field_years",
  {
    id: id(),
    fieldId: text("field_id")
      .notNull()
      .references(() => fields.id, { onDelete: "cascade" }),
    jahr: integer("jahr").notNull(),
    crop: text("crop").notNull().default("mais"),
    varietyId: text("variety_id"),
    varietyText: text("variety_text"),
    usage: text("usage"),
    status: text("status").$type<FieldYearStatus>().notNull().default("geplant"),
    areaHa: doublePrecision("area_ha"),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("field_years_field_id_jahr_idx").on(t.fieldId, t.jahr)],
);

/** Photographic observations and field journal entries. */
export const observations = pgTable("observations", {
  id: id(),
  fieldId: text("field_id")
    .notNull()
    .references(() => fields.id),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  kind: text("kind").$type<"foto" | "notiz">().notNull(),
  photoPath: text("photo_path"),
  mimeType: text("mime_type"),
  note: text("note"),
  bbch: integer("bbch"),
  finding: jsonb("finding").$type<PhotoFinding>(),
  createdAt: createdAt(),
});

/** Empirical knowledge facts about the farm extracted via Spross or forms. */
export const knowledgeFacts = pgTable("knowledge_facts", {
  id: id(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  fieldId: text("field_id"),
  topic: text("topic").notNull(),
  jahr: integer("jahr"),
  text: text("text").notNull(),
  source: text("source").$type<"spross" | "formular">().notNull(),
  createdAt: createdAt(),
});

export const chatMessages = pgTable("chat_messages", {
  id: id(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  role: text("role").$type<"user" | "assistant">().notNull(),
  text: text("text").notNull(),
  /** Spross metadata: queried topic, saved facts, suggestions, and UI actions. */
  meta: jsonb("meta").$type<{
    askedTopic?: string;
    savedFacts?: string[];
    vorschlaege?: string[];
    uiActions?: SprossUiAction[];
  }>(),
  createdAt: createdAt(),
});

export const callbackRequests = pgTable("callback_requests", {
  id: id(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  telefon: text("telefon").notNull(),
  zeitfenster: text("zeitfenster").notNull(),
  anliegen: text("anliegen"),
  seite: text("seite"),
  status: text("status").notNull().default("offen"),
  createdAt: createdAt(),
});

/** Telemetry events capturing user interactions to improve recommendation heuristics. */
export const events = pgTable("events", {
  id: id(),
  userId: text("user_id"),
  name: text("name").notNull(),
  props: jsonb("props").$type<Record<string, unknown>>(),
  createdAt: createdAt(),
});

export type FarmRow = typeof farms.$inferSelect;
export type FarmInsert = typeof farms.$inferInsert;
export type FieldRow = typeof fields.$inferSelect;
export type FieldInsert = typeof fields.$inferInsert;
export type FieldYearRow = typeof fieldYears.$inferSelect;
export type FieldYearInsert = typeof fieldYears.$inferInsert;
export type ObservationRow = typeof observations.$inferSelect;
export type KnowledgeRow = typeof knowledgeFacts.$inferSelect;
