"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import type { LayerGroup, Map as LeafletMap } from "leaflet";
import type { Cluster } from "@/lib/map/cluster";
import { useBasemapTiles } from "@/lib/map/basemap";
import styles from "./CommunityMap.module.css";

const SHAPE = { local: "square", state: "plate", utility: "diamond", federal: "shield" } as const;

/** Report groups drawn with the same level shapes as the answer screen. */
export function CommunityMap({ clusters, label, nameOf, onSelect }: {
  clusters: Cluster[];
  label: string;
  /** Accessible name for a marker, e.g. "Streetlight out: 4 neighbors reported this". */
  nameOf: (c: Cluster) => string;
  onSelect: (c: Cluster) => void;
}) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const layer = useRef<LayerGroup | null>(null);
  const leaflet = useRef<typeof import("leaflet") | null>(null);
  const [ready, setReady] = useState(false);
  useBasemapTiles(leaflet, map, ready);
  const select = useRef(onSelect);
  select.current = onSelect;
  const name = useRef(nameOf);
  name.current = nameOf;

  useEffect(() => {
    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || !el.current || map.current) return;
      map.current = L.map(el.current).setView([38.85, -77.1], 12);
      leaflet.current = L;
      setReady(true);
      layer.current = L.layerGroup().addTo(map.current);
      draw(L);
    });
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
      setReady(false);
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
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });
      L.marker([c.lat, c.lon], { icon, keyboard: true, title: name.current(c), alt: name.current(c) })
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
