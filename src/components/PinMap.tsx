"use client";

import "leaflet/dist/leaflet.css";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";
import type { Point } from "@/lib/flow/state";
import styles from "./PinMap.module.css";

export type PinMapHandle = { center: () => Point | null; flyTo: (p: Point, zoom?: number) => void };

// The pin stays fixed at the center and the map moves under it (the
// ride-share pickup pattern): easier with a thumb than dragging a marker.
export const PinMap = forwardRef<PinMapHandle, { initial: Point; zoom: number; label: string; interactive?: boolean }>(function PinMap(
  { initial, zoom, label, interactive = true },
  ref,
) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Leaflet touches `window` on import, so load it only in the browser.
    import("leaflet").then((L) => {
      if (cancelled || !el.current || map.current) return;
      map.current = L.map(el.current, {
        zoomControl: interactive,
        attributionControl: true,
        dragging: interactive,
        scrollWheelZoom: interactive,
        doubleClickZoom: interactive,
        touchZoom: interactive,
        keyboard: interactive,
      }).setView([initial.lat, initial.lon], zoom);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map.current);
    });
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
    };
    // The map is created once; later moves go through the handle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useImperativeHandle(ref, () => ({
    center: () => {
      const c = map.current?.getCenter();
      return c ? { lat: Number(c.lat.toFixed(6)), lon: Number(c.lng.toFixed(6)) } : null;
    },
    flyTo: (p, z = 18) => map.current?.setView([p.lat, p.lon], z),
  }));

  return (
    <div className={styles.wrap}>
      <div ref={el} className={styles.map} role={interactive ? "application" : "img"} aria-label={label} />
      <svg className={styles.pin} width="44" height="56" viewBox="0 0 44 56" aria-hidden="true">
        <path d="M22 54S4 34 4 21a18 18 0 0 1 36 0c0 13-18 33-18 33z" fill="#00653b" stroke="#fff" strokeWidth="4" />
        <circle cx="22" cy="21" r="7" fill="#fff" />
      </svg>
    </div>
  );
});
