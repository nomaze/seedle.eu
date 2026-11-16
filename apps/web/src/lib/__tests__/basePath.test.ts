import { afterEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH;

async function loadBasePathModule(envValue?: string) {
  vi.resetModules();
  if (envValue === undefined) {
    delete process.env.NEXT_PUBLIC_BASE_PATH;
  } else {
    process.env.NEXT_PUBLIC_BASE_PATH = envValue;
  }
  return import("../basePath");
}

afterEach(() => {
  if (ORIGINAL_BASE_PATH === undefined) {
    delete process.env.NEXT_PUBLIC_BASE_PATH;
  } else {
    process.env.NEXT_PUBLIC_BASE_PATH = ORIGINAL_BASE_PATH;
  }
  vi.resetModules();
});

describe("withBasePath and BASE_PATH helper", () => {
  it("keeps paths unchanged when NEXT_PUBLIC_BASE_PATH is unset or empty", async () => {
    const modUnset = await loadBasePathModule(undefined);
    expect(modUnset.BASE_PATH).toBe("");
    expect(modUnset.withBasePath("/partner/leiste/feldmark.svg")).toBe(
      "/partner/leiste/feldmark.svg",
    );

    const modEmpty = await loadBasePathModule("   ");
    expect(modEmpty.BASE_PATH).toBe("");
    expect(modEmpty.withBasePath("/team/jean-pascal-lutze.jpg")).toBe(
      "/team/jean-pascal-lutze.jpg",
    );
  });

  it("prefixes root-relative static asset paths when NEXT_PUBLIC_BASE_PATH is set to /seedle.eu", async () => {
    const { BASE_PATH, withBasePath } = await loadBasePathModule("/seedle.eu");
    expect(BASE_PATH).toBe("/seedle.eu");
    expect(withBasePath("/partner/leiste/feldmark.svg")).toBe(
      "/seedle.eu/partner/leiste/feldmark.svg",
    );
    expect(withBasePath("/vendor/maplibre-gl-worker.mjs")).toBe(
      "/seedle.eu/vendor/maplibre-gl-worker.mjs",
    );
  });

  it("normalizes trailing slashes on NEXT_PUBLIC_BASE_PATH", async () => {
    const { BASE_PATH, withBasePath } = await loadBasePathModule("  /seedle.eu///  ");
    expect(BASE_PATH).toBe("/seedle.eu");
    expect(withBasePath("/team/finn-gaida.jpg")).toBe("/seedle.eu/team/finn-gaida.jpg");
  });

  it("ignores NEXT_PUBLIC_BASE_PATH values that do not start with a leading slash", async () => {
    const { BASE_PATH, withBasePath } = await loadBasePathModule("seedle.eu/sub");
    expect(BASE_PATH).toBe("");
    expect(withBasePath("/marke/icon-sortenkompass.svg")).toBe(
      "/marke/icon-sortenkompass.svg",
    );
  });

  it("is idempotent when called multiple times on the same path", async () => {
    const { withBasePath } = await loadBasePathModule("/seedle.eu");
    const once = withBasePath("/brand/master-svg/seedle_app-icon_cream.svg");
    const twice = withBasePath(once);
    expect(once).toBe("/seedle.eu/brand/master-svg/seedle_app-icon_cream.svg");
    expect(twice).toBe("/seedle.eu/brand/master-svg/seedle_app-icon_cream.svg");
    expect(withBasePath("/seedle.eu")).toBe("/seedle.eu");
  });

  it("leaves /api and /api/* paths untouched", async () => {
    const { withBasePath } = await loadBasePathModule("/seedle.eu");
    expect(withBasePath("/api")).toBe("/api");
    expect(withBasePath("/api/v1/fields/123/selection")).toBe(
      "/api/v1/fields/123/selection",
    );
  });

  it("leaves protocol-relative and external URLs untouched", async () => {
    const { withBasePath } = await loadBasePathModule("/seedle.eu");
    expect(withBasePath("//example.com/asset.svg")).toBe("//example.com/asset.svg");
    expect(withBasePath("https://seedle.eu/asset.svg")).toBe(
      "https://seedle.eu/asset.svg",
    );
    expect(withBasePath("http://localhost:8010/health")).toBe(
      "http://localhost:8010/health",
    );
  });

  it("leaves empty strings and relative paths untouched", async () => {
    const { withBasePath } = await loadBasePathModule("/seedle.eu");
    expect(withBasePath("")).toBe("");
    expect(withBasePath("foo/bar")).toBe("foo/bar");
  });
});
