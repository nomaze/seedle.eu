"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { areaHa, autoFieldPolygon, centroid } from "@seedle/core/geo";
import type { GeoJSONSource, Map as MlMap, Marker } from "maplibre-gl";
import { LocateFixed, MapPin, Pencil, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDemo } from "@/components/shell/DemoContext";
import { num } from "@/lib/format";
import { Button } from "../ui/Button";
import { loadMaplibre } from "./loadMaplibre";
import { DEUTSCHLAND, feldFarbe, KARTE } from "./styles";

type Polygon = ReturnType<typeof autoFieldPolygon>;
interface SearchHit {
  label: string;
  lat: number;
  lon: number;
}

/**
 * Interactive field selector: tapping the map sets the center point,
 * automatically generates boundary polygon, and allows vertex adjustments.
 *
 * mode="neu": initializes field and advances to onboarding flow.
 * mode="anpassen": updates vertices of an existing field parcel.
 */
export function FieldPicker({
  mode = "neu",
  fieldId,
  initial,
  initialName,
}: {
  mode?: "neu" | "anpassen";
  fieldId?: string;
  initial?: Polygon;
  initialName?: string;
}) {
  const router = useRouter();
  const demo = useDemo();
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MlMap | null>(null);
  const markers = useRef<Marker[]>([]);
  const polygonRef = useRef<Polygon | null>(initial ?? null);

  const [polygon, setPolygon] = useState<Polygon | null>(initial ?? null);
  const [anpassen, setAnpassen] = useState(mode === "anpassen");
  const [name, setName] = useState(initialName ?? "");
  const nameRef = useRef(initialName ?? "");
  const [suche, setSuche] = useState("");
  const [treffer, setTreffer] = useState<SearchHit[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const busy = isSaving;
  const [fehler, setFehler] = useState<string | null>(null);
  const [zoomHinweis, setZoomHinweis] = useState(false);
  /** Counts newly placed fields (map taps), excluding corner dragging. */
  const [feldVersion, setFeldVersion] = useState(0);

  const zeichne = useCallback((p: Polygon | null) => {
    polygonRef.current = p;
    setPolygon(p);
    const src = map.current?.getSource("feld") as GeoJSONSource | undefined;
    src?.setData(p ? { type: "Feature", properties: {}, geometry: p } : { type: "FeatureCollection", features: [] });
  }, []);

  const ebenen = useCallback(() => {
    const m = map.current;
    if (!m || m.getSource("feld")) return;
    const p = polygonRef.current;
    m.addSource("feld", {
      type: "geojson",
      data: p ? { type: "Feature", properties: {}, geometry: p } : { type: "FeatureCollection", features: [] },
    });
    m.addLayer({ id: "feld-flaeche", type: "fill", source: "feld", paint: { "fill-color": feldFarbe().fill, "fill-opacity": 0.35 } });
    m.addLayer({ id: "feld-rand", type: "line", source: "feld", paint: { "line-color": feldFarbe().line, "line-width": 3 } });
  }, []);

  // Initialize map canvas once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const maplibregl = await loadMaplibre();
      if (cancelled || !container.current) return;
      const start = initial ? centroid(initial) : null;
      const m = new maplibregl.Map({
        container: container.current,
        style: KARTE,
        center: start ? [start.lon, start.lat] : DEUTSCHLAND.center,
        zoom: start ? 15 : DEUTSCHLAND.zoom,
        attributionControl: { compact: true },
      });
      m.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
      m.on("style.load", ebenen);
      m.on("click", (e) => {
        if (mode === "anpassen") return;
        try {
          const lngLat = e.lngLat?.wrap ? e.lngLat.wrap() : e.lngLat;
          const lat = Number(lngLat.lat);
          const lon = Number(lngLat.lng);
          if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
          const p = autoFieldPolygon({ lat, lon });
          zeichne(p);
          setFehler(null);
          setFeldVersion((v) => v + 1);
          if (m.getZoom() < 13) {
            setZoomHinweis(true);
            m.flyTo({ center: [lon, lat], zoom: 15 });
          } else {
            setZoomHinweis(false);
          }

          // Reverse-geocoding for automated field naming (e.g. "Schlag Freising")
          // Runs non-blocking in background with a 1.5s timeout.
          // On timeout or failure, falls back to server-side default naming.
          if (!nameRef.current.trim()) {
            const ctrl = new AbortController();
            const timer = setTimeout(() => ctrl.abort(), 1500);
            fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=jsonv2&accept-language=de`,
              { signal: ctrl.signal }
            )
              .then((res) => (res.ok ? res.json() : null))
              .then((data) => {
                clearTimeout(timer);
                if (data?.address) {
                  const ort =
                    data.address.village ||
                    data.address.town ||
                    data.address.city ||
                    data.address.municipality ||
                    data.address.suburb ||
                    data.address.county;
                  if (ort && !nameRef.current.trim()) {
                    const generatedName = `Schlag ${ort}`;
                    setName(generatedName);
                    nameRef.current = generatedName;
                  }
                }
              })
              .catch(() => {
                // On timeout or network error, silently fall back to server-side naming
              });
          }
        } catch (err) {
          console.error("[FieldPicker] map click handler error:", err);
          setFehler("Feldgrenze konnte nicht automatisch platziert werden. Bitte tippe erneut.");
        }
      });
      // Existing field: set vertices after map load completes
      m.once("load", () => setFeldVersion((v) => v + 1));
      map.current = m;
    })();
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Draggable corner vertices
  useEffect(() => {
    let cancelled = false;
    markers.current.forEach((mk) => mk.remove());
    markers.current = [];
    if (!anpassen || !polygonRef.current || !map.current) return;
    (async () => {
      const maplibregl = await loadMaplibre();
      if (cancelled || !map.current) return;
      const ring = polygonRef.current!.coordinates[0]!.slice(0, -1);
      markers.current = ring.map((corner, i) => {
        const el = document.createElement("div");
        el.className = "size-5 rounded-full border-[3px] border-white bg-bee shadow-md cursor-grab";
        const mk = new maplibregl.Marker({ element: el, draggable: true }).setLngLat(corner as [number, number]).addTo(map.current!);
        mk.on("drag", () => {
          const current = polygonRef.current;
          if (!current) return;
          const pos = mk.getLngLat();
          const next = current.coordinates[0]!.slice(0, -1).map((c, j) => (j === i ? ([pos.lng, pos.lat] as [number, number]) : c));
          zeichne({ type: "Polygon", coordinates: [[...next, next[0]!]] });
        });
        return mk;
      });
    })();
    return () => {
      cancelled = true;
    };
    // Re-render markers only on edit mode toggle or when a new field is placed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anpassen, feldVersion]);

  // Explicit municipality search on user submission (OpenStreetMap Nominatim)
  async function fuehreSucheAus() {
    const q = suche.trim();
    if (q.length < 2) return;
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=de&limit=5&accept-language=de&q=${encodeURIComponent(q)}`;
      const res = await fetch(url);
      const data = (await res.json()) as { display_name: string; lat: string; lon: string }[];
      setTreffer(data.map((d) => ({ label: d.display_name.split(",").slice(0, 3).join(","), lat: Number(d.lat), lon: Number(d.lon) })));
    } catch {
      /* Search is optional */
    }
  }

  function geheZu(lat: number, lon: number, zoom = 14) {
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
    map.current?.flyTo({ center: [lon, lat], zoom });
    setTreffer([]);
  }

  function meinStandort() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setFehler("Standortermittlung wird von deinem Browser nicht unterstützt. Bitte nutze die Ortssuche.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => geheZu(pos.coords.latitude, pos.coords.longitude, 15),
      () => setFehler("Dein Standort ist nicht freigegeben. Such einfach nach deinem Ort."),
      { timeout: 10000, enableHighAccuracy: false }
    );
  }

  async function weiter() {
    const p = polygonRef.current;
    if (!p) {
      setFehler("Bitte tippe zuerst auf die Karte, um dein Feld auszuwählen.");
      setIsSaving(false);
      return;
    }
    setIsSaving(true);
    setFehler(null);
    try {
      const c = centroid(p);
      if (!Number.isFinite(c.lat) || !Number.isFinite(c.lon)) {
        setFehler("Ungültige Koordinaten für das gewählte Feld. Bitte tippe erneut auf die Karte.");
        setIsSaving(false);
        return;
      }
      const fieldName = name.trim() || undefined;
      const res =
        mode === "neu"
          ? await fetch("/api/v1/fields", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ lat: c.lat, lon: c.lon, name: fieldName, geometry: p }),
            })
          : await fetch(`/api/v1/fields/${fieldId}`, {
              method: "PATCH",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ geometry: p, name: fieldName }),
            });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFehler(data.fehler ?? "Das Feld konnte nicht gespeichert werden. Bitte versuche es erneut.");
        setIsSaving(false);
        return;
      }
      if (mode === "neu") {
        if (!data?.feld?.id) {
          setFehler("Feld wurde angelegt, aber es konnte keine ID ermittelt werden. Bitte lade die Seite neu.");
          setIsSaving(false);
          return;
        }
        const isVerified = Boolean(data.user?.emailVerified);
        if (demo.anmeldung && !isVerified) {
          router.push(`/anmelden?ziel=/feld/${data.feld.id}/anbau`);
        } else {
          router.push(`/feld/${data.feld.id}/anbau`);
        }
      } else {
        router.push(`/feld/${fieldId}`);
      }
    } catch (err) {
      console.error("[FieldPicker] weiter() failed:", err);
      setFehler("Netzwerkfehler beim Speichern. Bitte prüfe deine Verbindung und versuche es erneut.");
      setIsSaving(false);
    } finally {
      setIsSaving(false);
    }
  }

  const ha = polygon ? areaHa(polygon) : 0;

  return (
    <div className="space-y-4">
      <div className="relative isolate overflow-hidden rounded-card shadow-soft ring-1 ring-line">
        <div ref={container} data-spross-target="field-map" className="relative h-[56vh] min-h-[340px] w-full bg-sand-200" />

        {mode === "neu" ? (
          <div className="absolute left-3 right-14 top-3 z-40 sm:right-auto sm:w-96">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void fuehreSucheAus();
              }}
              className="flex items-center gap-2 rounded-full bg-white/95 px-4 shadow-soft ring-1 ring-line"
            >
              <button
                type="submit"
                aria-label="Ort suchen"
                className="flex size-7 items-center justify-center text-muted hover:text-leaf-700"
              >
                <Search className="size-4 shrink-0" aria-hidden />
              </button>
              <input
                data-spross-target="ort-search"
                value={suche}
                onChange={(e) => setSuche(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void fuehreSucheAus();
                  }
                }}
                placeholder="Ort oder Postleitzahl"
                aria-label="Ort suchen"
                className="h-11 min-w-0 flex-1 bg-transparent text-base outline-none"
              />
              <button type="button" onClick={meinStandort} aria-label="Mein Standort" className="-mr-1 flex size-9 items-center justify-center rounded-full text-leaf-700 hover:bg-leaf-50">
                <LocateFixed className="size-4" />
              </button>
            </form>
            {treffer.length > 0 ? (
              <ul className="mt-2 overflow-hidden rounded-2xl bg-white shadow-lift ring-1 ring-line">
                {treffer.map((t) => (
                  <li key={`${t.lat},${t.lon}`}>
                    <button type="button" onClick={() => geheZu(t.lat, t.lon)} className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm hover:bg-leaf-50">
                      <MapPin className="size-4 shrink-0 text-leaf-600" /> {t.label}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>

      {polygon ? (
        <div className="animate-rise rounded-card bg-white/92 p-5 shadow-soft ring-1 ring-line">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-sm text-muted">Dein Feld</div>
              <div className="text-2xl font-bold tabular">≈ {num(ha)} ha</div>
              {zoomHinweis ? <p className="mt-1 text-sm text-muted">Zoom ruhig näher ran und prüf die Grenze.</p> : null}
            </div>
            <button
              type="button"
              onClick={() => setAnpassen((a) => !a)}
              aria-pressed={anpassen}
              className={`inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium ring-1 ${
                anpassen ? "bg-bee-soft text-bee-text ring-bee/40" : "bg-white text-ink ring-line hover:ring-leaf-300"
              }`}
            >
              <Pencil className="size-4" /> {anpassen ? "Ecken verschieben …" : "Grenze anpassen"}
            </button>
          </div>
          <label className="mt-4 block">
            <span className="text-sm text-muted">Wie nennst du das Feld? (freiwillig)</span>
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                nameRef.current = e.target.value;
              }}
              placeholder="z. B. Großer Schlag"
              maxLength={80}
              className="mt-1 h-12 w-full rounded-xl bg-white px-4 text-base ring-1 ring-line outline-none focus:ring-2 focus:ring-leaf-400"
            />
          </label>
          {fehler ? <p className="mt-3 text-sm text-[#8a2a18]" role="alert">{fehler}</p> : null}
          <Button onClick={weiter} disabled={busy} className="mt-4 w-full sm:w-auto">
            {busy
              ? "Wird gespeichert …"
              : mode === "neu"
                ? "Weiter mit diesem Feld"
                : "Grenze speichern"}
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-card bg-white/80 p-4 text-sm text-muted ring-1 ring-line">
          <MapPin className="size-5 shrink-0 text-leaf-600" />
          Such deinen Ort und tipp dann auf dein Feld.
          {fehler ? <span className="text-[#8a2a18]" role="alert"> {fehler}</span> : null}
        </div>
      )}
    </div>
  );
}
