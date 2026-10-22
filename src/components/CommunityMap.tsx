"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import type { LayerGroup, Map as LeafletMap } from "leaflet";
import type { Cluster } from "@/lib/map/cluster";
import styles from "./CommunityMap.module.css";

const SHAPE = { local: "square", state: "plate", utility: "diamond", federal: "shield" } as const;

/** Report groups drawn with the same level shapes as the answer screen. */
export function CommunityMap({ clusters, label, onSelect }: { clusters: Cluster[]; label: string; onSelect: (c: Cluster) => void }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const layer = useRef<LayerGroup | null>(null);
  const select = useRef(onSelect);
  select.current = onSelect;

  useEffect(() => {
    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || !el.current || map.current) return;
      map.current = L.map(el.current).setView([38.85, -77.1], 12);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map.current);
      layer.current = L.layerGroup().addTo(map.current);
      draw(L);
    });
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function draw(L: typeof import("leaflet")) {
    if (!layer.current) return;
    layer.current.clearLayers();
    for (const c of clusters) {
      const n = c.reports.length;
      const fixed = c.reports.every((r) => r.fixed);
      const icon = L.divIcon({
        className: "",
        html: `<span class="${styles.marker} ${fixed ? styles.fixed : ""}"><span class="${styles.shape} ${styles[SHAPE[c.level]]}"></span>${n > 1 ? `<span class="${styles.count}">${n}</span>` : ""}</span>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });
      L.marker([c.lat, c.lon], { icon, keyboard: true, title: `${n}` })
        .on("click", () => select.current(c))
        .addTo(layer.current);
    }
  }

  // Redraw when the list changes (e.g. a report marked fixed).
  useEffect(() => {
    import("leaflet").then(draw);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clusters]);

  return <div ref={el} className={styles.map} role="application" aria-label={label} />;
}
