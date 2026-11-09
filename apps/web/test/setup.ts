import { mkdtempSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { vi } from "vitest";

// Isolated temporary data directory for PGlite during test execution
const testDir = mkdtempSync(path.join(os.tmpdir(), "sortenkompass-test-"));
process.env.DATA_DIR = testDir;

vi.mock("next/server", () => ({
  connection: vi.fn().mockResolvedValue(undefined),
  NextResponse: {
    json: vi.fn((data: unknown, init?: unknown) => ({ data, init })),
  },
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
  notFound: vi.fn(() => {
    throw new Error("NOT_FOUND");
  }),
}));

vi.mock("next/cache", () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
  updateTag: vi.fn(),
  refresh: vi.fn(),
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));
