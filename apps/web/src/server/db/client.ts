import "server-only";

import { drizzle } from "drizzle-orm/pg-proxy";
import * as schema from "./schema";
import { inMemoryStore } from "./in-memory-store";

/**
 * Stateless database client proxy.
 * Operates with in-memory stores in zero-persistence and export environments.
 */
type Db = ReturnType<typeof drizzle<typeof schema>>;

const dummyDb = drizzle(
  async (sqlStr, params) => {
    const s = String(sqlStr);

    if (s.toLowerCase().startsWith("update") && s.includes('"fields"')) {
      const id = params.find((p) => typeof p === "string" && (p.startsWith("fld_") || p.startsWith("f-")));
      const name = params.find((p) => typeof p === "string" && p !== id);
      if (id && name) {
        const field = inMemoryStore.getField("usr_demo_landwirt", String(id));
        if (field) {
          inMemoryStore.setField({ ...field, name: String(name) });
        }
      }
      return { rows: [] };
    }

    if (s.includes('"users"')) {
      return {
        rows: [
          [
            "usr_demo_landwirt",
            "Peter Müller",
            "peter.mueller@seedle-demo.de",
            new Date("2026-03-01T10:00:00Z"),
            "+49 171 1234567",
            new Date("2026-01-01T00:00:00Z"),
          ],
        ],
      };
    }
    return { rows: [] };
  },
  { schema }
);

export async function getDb(): Promise<Db> {
  return dummyDb;
}

export { schema };
