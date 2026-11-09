import { defineConfig } from "drizzle-kit";

// Erzeugt SQL-Migrationen aus src/server/db/schema.ts: `npm run db:generate -w apps/web`
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
});
