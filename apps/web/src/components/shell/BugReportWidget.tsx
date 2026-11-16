"use client";

import { Camera, Check, Crosshair, Monitor, X } from "lucide-react";
import { usePathname } from "next/navigation";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import {
  type BugReportCategory,
  submitBugReport,
} from "@/lib/backendClient";

const FALLBACK_PNG_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8efPmfQYACTgF2f6k5AAAAABJRU5ErkJggg==";

const CATEGORY_OPTIONS: readonly {
  id: BugReportCategory;
  label: string;
}[] = [
  { id: "map_field", label: "Karte und Feld" },
  { id: "ui_design", label: "Design und Text" },
  { id: "calculation", label: "Sortenberechnung" },
  { id: "idea", label: "Idee oder Wunsch" },
] as const;

function safeParseJson(raw: string): unknown {
  const parsed: unknown = JSON.parse(raw);
  return parsed;
}

/**
 * Collects active field, soil, and variety context from localStorage so the product team
 * receives the agronomic state for the currently active field alongside the visual screenshot.
 * Enforces GDPR Art. 5 data minimization by only reading the active field's agronomy profile
 * instead of dumping all stored profiles from localStorage.
 */
export function collectLocalFieldContext(activeRoutePath?: string): Record<string, unknown> {
  if (typeof window === "undefined" || !window.localStorage) {
    return {};
  }
  const ctx: Record<string, unknown> = {};
  try {
    const customFieldRaw = window.localStorage.getItem("seedle_custom_field");
    let customFieldId: string | null = null;
    if (customFieldRaw) {
      const parsedCustom = safeParseJson(customFieldRaw);
      ctx.custom_field = parsedCustom;
      if (parsedCustom && typeof parsedCustom === "object" && !Array.isArray(parsedCustom)) {
        const rec = parsedCustom as Record<string, unknown>;
        if (typeof rec.id === "string" && rec.id.trim()) {
          customFieldId = rec.id.trim();
        } else if (typeof rec.field_id === "string" && rec.field_id.trim()) {
          customFieldId = rec.field_id.trim();
        }
      }
    }

    const routeToInspect =
      activeRoutePath ||
      (typeof window.location?.pathname === "string" ? window.location.pathname : "");
    const routeMatch = routeToInspect.match(/\/feld\/([^/?#]+)/);
    const activeFieldId =
      (routeMatch?.[1] && routeMatch[1] !== "neu" ? routeMatch[1] : null) ??
      customFieldId ??
      (routeMatch?.[1] === "neu" ? "neu" : null);

    if (activeFieldId) {
      const profileKey = `seedle_agronomy_profile_v1_${activeFieldId}`;
      const val = window.localStorage.getItem(profileKey);
      if (val) {
        const parsedProfile = safeParseJson(val);
        ctx.active_field_id = activeFieldId;
        ctx.active_agronomy_profile = parsedProfile;
        ctx.agronomy_profiles = {
          [profileKey]: parsedProfile,
        };
      }
    }
  } catch {
    // Ignore localStorage parsing errors
  }
  return ctx;
}

function drawRedPinMarker(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
): void {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, 22, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(224, 90, 71, 0.24)";
  ctx.fill();
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = "#e05a47";
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(x, y, 6, 0, Math.PI * 2);
  ctx.fillStyle = "#e05a47";
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#ffffff";
  ctx.stroke();
  ctx.restore();
}

/**
 * Captures an instant (< 30 ms) composite PNG screenshot of the active viewport
 * before the Bug Report modal opens:
 * - Renders the warm canvas background (`#f9f6f0`)
 * - Copies all visible `<canvas>` elements (including the MapLibre WebGL satellite & fiboa map)
 * - Draws visible UI containers, buttons, and text nodes at their exact bounding rects
 * - Optionally stamps the interactive red pin circle (`#e05a47`) directly onto the PNG
 */
export function captureInstantPageScreenshot(
  pin?: { xPct: number; yPct: number } | null,
): string {
  if (
    typeof window === "undefined" ||
    typeof document === "undefined" ||
    (typeof navigator !== "undefined" && /jsdom/i.test(navigator.userAgent || ""))
  ) {
    return FALLBACK_PNG_DATA_URL;
  }

  try {
    const vw = Math.max(390, Math.min(1920, window.innerWidth || 1280));
    const vh = Math.max(600, Math.min(1200, window.innerHeight || 800));
    const outW = 1280;
    const outH = Math.round((vh / vw) * outW);
    const scaleX = outW / vw;
    const scaleY = outH / vh;

    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return FALLBACK_PNG_DATA_URL;
    }

    // 1. Page background
    ctx.fillStyle = "#f9f6f0";
    ctx.fillRect(0, 0, outW, outH);

    // 2. Visible structural blocks (cards, sections, headers, buttons, inputs)
    const boxes = document.querySelectorAll(
      "header, nav, section, article, aside, button, input, select, textarea, [data-testid]",
    );
    boxes.forEach((el) => {
      if (!(el instanceof HTMLElement)) return;
      if (el.closest('[data-testid="bug-report-modal"]')) return;
      const rect = el.getBoundingClientRect();
      if (rect.width < 4 || rect.height < 4 || rect.bottom < 0 || rect.top > vh) {
        return;
      }
      const style = window.getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) {
        return;
      }
      const x = rect.left * scaleX;
      const y = rect.top * scaleY;
      const w = rect.width * scaleX;
      const h = rect.height * scaleY;

      const bg = style.backgroundColor;
      if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") {
        ctx.fillStyle = bg;
        ctx.fillRect(x, y, w, h);
      }

      const borderCol = style.borderTopColor || style.borderColor;
      const borderW = parseFloat(style.borderTopWidth || "0");
      if (borderW > 0 && borderCol && borderCol !== "rgba(0, 0, 0, 0)") {
        ctx.strokeStyle = borderCol;
        ctx.lineWidth = Math.max(1, borderW * scaleX);
        ctx.strokeRect(x, y, w, h);
      }
    });

    // 3. Copy all visible <canvas> elements (MapLibre WebGL satellite & fiboa field layers)
    const canvases = document.querySelectorAll("canvas");
    canvases.forEach((srcCanvas) => {
      if (srcCanvas === canvas) return;
      const rect = srcCanvas.getBoundingClientRect();
      if (rect.width < 10 || rect.height < 10 || rect.bottom < 0 || rect.top > vh) {
        return;
      }
      try {
        ctx.drawImage(
          srcCanvas,
          rect.left * scaleX,
          rect.top * scaleY,
          rect.width * scaleX,
          rect.height * scaleY,
        );
      } catch {
        // Ignore cross-origin tainted canvas fallback
      }
    });

    // 4. Copy visible loaded <img> elements
    const images = document.querySelectorAll("img");
    images.forEach((imgEl) => {
      if (!imgEl.complete || imgEl.naturalWidth === 0) return;
      if (imgEl.closest('[data-testid="bug-report-modal"]')) return;
      const rect = imgEl.getBoundingClientRect();
      if (rect.width < 4 || rect.height < 4 || rect.bottom < 0 || rect.top > vh) {
        return;
      }
      try {
        ctx.drawImage(
          imgEl,
          rect.left * scaleX,
          rect.top * scaleY,
          rect.width * scaleX,
          rect.height * scaleY,
        );
      } catch {
        // Ignore cross-origin image draw errors
      }
    });

    // 5. Render visible text headings, labels, buttons, and paragraphs at their viewport positions
    const textElements = document.querySelectorAll(
      "h1, h2, h3, h4, p, span, a, button, label, dt, dd, th, td, strong, b",
    );
    ctx.textBaseline = "top";
    textElements.forEach((el) => {
      if (!(el instanceof HTMLElement)) return;
      if (el.closest('[data-testid="bug-report-modal"]')) return;
      // Only draw leaf text or elements with direct text nodes
      let directText = "";
      for (let i = 0; i < el.childNodes.length; i++) {
        const node = el.childNodes[i];
        if (node && node.nodeType === Node.TEXT_NODE) {
          directText += node.textContent ?? "";
        }
      }
      const cleanText = directText.replace(/\s+/g, " ").trim();
      if (!cleanText) return;

      const rect = el.getBoundingClientRect();
      if (rect.width < 4 || rect.height < 4 || rect.bottom < 0 || rect.top > vh) {
        return;
      }
      const style = window.getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") return;

      const fontSizePx = Math.max(
        10,
        Math.min(38, Math.round(parseFloat(style.fontSize || "14") * scaleX)),
      );
      const fontWeight = style.fontWeight || "500";
      ctx.font = `${fontWeight} ${fontSizePx}px Figtree, system-ui, sans-serif`;
      ctx.fillStyle = style.color || "#1c1f1b";
      const maxChars = Math.max(12, Math.floor((rect.width * scaleX) / (fontSizePx * 0.52)));
      const clipped =
        cleanText.length > maxChars ? `${cleanText.slice(0, maxChars - 1)}…` : cleanText;
      ctx.fillText(clipped, (rect.left + 2) * scaleX, (rect.top + 2) * scaleY);
    });

    // 6. Top diagnostic banner with current route and timestamp
    ctx.fillStyle = "rgba(28, 31, 27, 0.88)";
    ctx.fillRect(0, 0, outW, 28);
    ctx.font = "600 12px ui-monospace, monospace";
    ctx.fillStyle = "#f9f6f0";
    const routeLabel = `${window.location.pathname}${window.location.search}`;
    ctx.fillText(
      `SEEDLE SNAPSHOT · ${routeLabel} · ${vw}x${vh}px · ${new Date().toISOString()}`,
      12,
      8,
    );

    // 7. Stamp red pin marker if present
    if (pin && Number.isFinite(pin.xPct) && Number.isFinite(pin.yPct)) {
      drawRedPinMarker(ctx, (pin.xPct / 100) * outW, (pin.yPct / 100) * outH);
    }

    const dataUrl = canvas.toDataURL("image/png");
    return dataUrl.startsWith("data:image/png;base64,")
      ? dataUrl
      : FALLBACK_PNG_DATA_URL;
  } catch {
    return FALLBACK_PNG_DATA_URL;
  }
}

/**
 * Stamps the red pin circle onto an existing screenshot PNG data URL before sending to the backend.
 */
async function stampPinOnDataUrl(
  baseDataUrl: string,
  pin: { xPct: number; yPct: number } | null,
): Promise<string> {
  if (!pin || typeof window === "undefined" || typeof document === "undefined") {
    return baseDataUrl;
  }
  return new Promise<string>((resolve) => {
    try {
      const img = new window.Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.width || 1280;
          canvas.height = img.height || 800;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(baseDataUrl);
            return;
          }
          ctx.drawImage(img, 0, 0);
          drawRedPinMarker(
            ctx,
            (pin.xPct / 100) * canvas.width,
            (pin.yPct / 100) * canvas.height,
          );
          const stamped = canvas.toDataURL("image/png");
          resolve(
            stamped.startsWith("data:image/png;base64,") ? stamped : baseDataUrl,
          );
        } catch {
          resolve(baseDataUrl);
        }
      };
      img.onerror = () => resolve(baseDataUrl);
      img.src = baseDataUrl;
    } catch {
      resolve(baseDataUrl);
    }
  });
}

/**
 * Global In-App Bug & Feedback Reporter with instant canvas/WebGL screenshot capture,
 * interactive red pin annotation (`pin_x_pct`, `pin_y_pct`), optional native tab screen capture,
 * and direct product feedback persistence.
 */
export function BugReportWidget(): React.JSX.Element {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<BugReportCategory>("map_field");
  const [comment, setComment] = useState("");
  const [screenshotDataUrl, setScreenshotDataUrl] = useState<string>(FALLBACK_PNG_DATA_URL);
  const [pin, setPin] = useState<{ xPct: number; yPct: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedConfirmation, setSavedConfirmation] = useState<string | null>(null);

  const openAndCapture = useCallback(() => {
    const snap = captureInstantPageScreenshot(null);
    setScreenshotDataUrl(snap);
    setPin(null);
    setSavedConfirmation(null);
    setOpen(true);
  }, []);

  // Keyboard shortcut: Alt + B opens the Bug & Feedback Reporter with instant screenshot
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      if (e.altKey && (e.key === "b" || e.key === "B" || e.code === "KeyB")) {
        e.preventDefault();
        openAndCapture();
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, openAndCapture]);

  async function handleCaptureNativeTabScreenshot(): Promise<void> {
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices ||
      typeof navigator.mediaDevices.getDisplayMedia !== "function"
    ) {
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        // @ts-expect-error preferCurrentTab is supported in Chromium browsers
        preferCurrentTab: true,
      });
      const track = stream.getVideoTracks()[0];
      const video = document.createElement("video");
      video.srcObject = stream;
      video.muted = true;
      await video.play();
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 800;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const nativePng = canvas.toDataURL("image/png");
        if (nativePng.startsWith("data:image/png;base64,")) {
          setScreenshotDataUrl(nativePng);
        }
      }
      track?.stop();
      stream.getTracks().forEach((t) => t.stop());
    } catch {
      // User cancelled native tab capture or browser does not support it
    }
  }

  function handlePreviewClick(e: React.MouseEvent<HTMLDivElement>): void {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const xPct = Math.max(
      0,
      Math.min(100, Math.round(((e.clientX - rect.left) / rect.width) * 1000) / 10),
    );
    const yPct = Math.max(
      0,
      Math.min(100, Math.round(((e.clientY - rect.top) / rect.height) * 1000) / 10),
    );
    setPin({ xPct, yPct });
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    const trimmed = comment.trim() || "Screenshot-Meldung ohne Zusatztext";
    setIsSubmitting(true);
    try {
      const finalScreenshot = pin
        ? await stampPinOnDataUrl(screenshotDataUrl, pin)
        : screenshotDataUrl;
      const vw = typeof window !== "undefined" ? window.innerWidth || 1280 : 1280;
      const vh = typeof window !== "undefined" ? window.innerHeight || 800 : 800;
      const pageUrl =
        typeof window !== "undefined" && window.location?.href
          ? window.location.href
          : `http://localhost:3000${pathname}`;

      await submitBugReport({
        comment: trimmed,
        category,
        page_url: pageUrl,
        route_path: pathname,
        viewport: `${vw}x${vh}`,
        pin_x_pct: pin?.xPct ?? null,
        pin_y_pct: pin?.yPct ?? null,
        screenshot_data_url: finalScreenshot,
        context_json: collectLocalFieldContext(pathname),
      });

      setSavedConfirmation(
        "Vielen Dank. Dein Feedback mit Screenshot wurde gespeichert.",
      );
      setComment("");
      setTimeout(() => {
        setOpen(false);
        setSavedConfirmation(null);
      }, 1400);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {/* Prominent Top-Right Studio Badge Trigger Button (hidden when printing) */}
      <button
        type="button"
        data-testid="open-bug-report-btn"
        onClick={openAndCapture}
        title="Bug oder Feedback mit Live-Screenshot melden (Tastenkürzel: Alt + B)"
        className="print:hidden fixed top-3 right-3 sm:top-3.5 sm:right-5 z-50 inline-flex items-center gap-2.5 rounded-panel border border-fg/20 bg-fg py-1.5 pr-3.5 pl-1.5 text-small font-semibold text-canvas shadow-lift ring-1 ring-canvas/15 active:scale-[0.97] cursor-pointer"
      >
        <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-selected text-on-selected shadow-xs">
          <Camera className="size-3.5" aria-hidden="true" />
        </span>
        <span className="tracking-tight">Feedback melden</span>
        <span className="sr-only">Bug oder Feedback melden</span>
        <span className="hidden rounded-control bg-canvas/12 px-1.5 py-0.5 text-[11px] font-bold tracking-normal text-canvas/85 tabular-nums sm:inline-block">
          Alt+B
        </span>
      </button>

      {/* Modal Overlay */}
      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="bug-report-modal-title"
          data-testid="bug-report-modal"
          className="print:hidden fixed inset-0 z-50 flex items-center justify-center bg-fg/55 p-4"
        >
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-panel border border-control bg-surface p-5 sm:p-6 space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-divider pb-3">
              <div className="space-y-0.5">
                <div className="inline-flex items-center gap-1.5 text-caption font-semibold text-link">
                  <Camera className="size-3.5" aria-hidden="true" />
                  <span>Live Screenshot und Direktes Produktfeedback</span>
                </div>
                <h2 id="bug-report-modal-title" className="text-heading text-fg">
                  Bug oder Feedback melden
                </h2>
              </div>
              <button
                type="button"
                aria-label="Schließen"
                onClick={() => setOpen(false)}
                className="inline-flex size-9 items-center justify-center rounded-control text-fg-muted transition-colors hover:bg-highlight hover:text-fg cursor-pointer"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
              {/* 1. Interactive Screenshot Preview with Click-to-Pin */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-caption font-semibold text-fg">
                    <Crosshair className="size-3.5 text-link" aria-hidden="true" />
                    <span>
                      Klicke ins Vorschaubild, um die genaue Stelle rot zu markieren
                      {pin
                        ? ` (Markiert bei ${pin.xPct} % · ${pin.yPct} %)`
                        : ""}
                    </span>
                  </span>
                  <button
                    type="button"
                    data-testid="capture-native-tab-screenshot-btn"
                    onClick={() => void handleCaptureNativeTabScreenshot()}
                    className="inline-flex items-center gap-1.5 rounded-control border border-control bg-canvas px-2.5 py-1 text-caption font-semibold text-link transition-colors hover:bg-highlight cursor-pointer"
                  >
                    <Monitor className="size-3.5" aria-hidden="true" />
                    <span>Echten Browser-Tab-Screenshot aufnehmen</span>
                  </button>
                </div>

                <div
                  onClick={handlePreviewClick}
                  className="relative overflow-hidden rounded-panel border border-control bg-canvas cursor-crosshair select-none"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    data-testid="bug-screenshot-preview"
                    src={screenshotDataUrl}
                    alt="Aufgenommener Seiten-Screenshot"
                    className="block max-h-60 w-full object-contain"
                  />
                  {pin ? (
                    <span
                      data-testid="bug-screenshot-pin"
                      style={{
                        left: `${pin.xPct}%`,
                        top: `${pin.yPct}%`,
                      }}
                      className="pointer-events-none absolute -ml-4 -mt-4 flex size-8 items-center justify-center rounded-full border-[3px] border-[#e05a47] bg-[#e05a47]/25"
                    >
                      <span className="size-2.5 rounded-full bg-[#e05a47]" />
                    </span>
                  ) : null}
                </div>
              </div>

              {/* 2. Category Selection (4 quick buttons) */}
              <div className="space-y-1.5">
                <span className="block text-caption font-semibold text-fg-muted">
                  Kategorie wählen
                </span>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {CATEGORY_OPTIONS.map((opt) => {
                    const active = category === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        data-testid={`bug-category-btn-${opt.id}`}
                        aria-pressed={active}
                        onClick={() => setCategory(opt.id)}
                        className={`rounded-control px-3 py-2 text-caption font-semibold ring-1 ring-inset transition-colors cursor-pointer ${
                          active
                            ? "bg-selected text-on-selected ring-selected"
                            : "bg-canvas text-fg ring-control hover:bg-highlight"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Comment Textarea */}
              <label className="block space-y-1.5">
                <span className="block text-small font-semibold text-fg">
                  Was ist dir aufgefallen oder was sollen wir hier ändern?
                </span>
                <textarea
                  data-testid="bug-report-comment-input"
                  rows={3}
                  maxLength={2000}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Was ist dir aufgefallen oder was sollen wir hier ändern?"
                  className="w-full rounded-control border border-control bg-canvas p-3 text-body text-fg outline-none focus:ring-2 focus:ring-action"
                />
              </label>

              {/* 4. Auto-Context Info */}
              <div className="rounded-control border border-divider bg-canvas px-3 py-2 text-caption text-fg-muted tabular-nums">
                Automatisch beigefügt: Route <strong className="text-fg">{pathname}</strong> ·
                Aktueller Screenshot (PNG) · Aktive Schlag- und Sortendaten
              </div>

              {savedConfirmation ? (
                <div
                  role="status"
                  data-testid="bug-report-saved-confirmation"
                  className="flex items-center gap-2 rounded-control border border-selected bg-highlight px-3.5 py-2.5 text-small font-semibold text-fg"
                >
                  <Check className="size-4 text-link shrink-0" aria-hidden="true" />
                  <span>{savedConfirmation}</span>
                </div>
              ) : null}

              {/* 5. Submit & Cancel */}
              <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-divider pt-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-10 items-center justify-center rounded-control border border-control bg-canvas px-4 text-small font-semibold text-fg transition-colors hover:bg-highlight cursor-pointer"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  data-testid="submit-bug-report-btn"
                  disabled={isSubmitting}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-control bg-action px-4 text-small font-semibold text-fg-inverse transition-colors hover:bg-action-hover active:scale-[0.97] cursor-pointer"
                >
                  <Check className="size-4" aria-hidden="true" />
                  <span>
                    {isSubmitting
                      ? "Wird gespeichert …"
                      : "Screenshot und Meldung speichern"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
