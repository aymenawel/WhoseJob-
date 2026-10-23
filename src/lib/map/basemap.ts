"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

export type Basemap = "map" | "satellite";

const KEY = "whosejob.basemap";
const EVENT = "whosejob:basemap";

/** The tiles behind every map. Both are free and need no key. */
export const BASEMAPS: Record<Basemap, { url: string; maxZoom: number; maxNativeZoom: number; attribution: string }> = {
  map: {
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    maxZoom: 20,
    maxNativeZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  // Virginia's own aerial photos (VBMP), refreshed yearly, sharp enough to see
  // a single light pole. Covers Virginia only, which is all VA-08 needs.
  // The service lists levels up to 23 but only has photos through 19 (20 is a
  // 404, which shows as white), so closer zooms enlarge the level-19 photos.
  satellite: {
    url: "https://vginmaps.vdem.virginia.gov/arcgis/rest/services/VBMP_Imagery/MostRecentImagery_WGS/MapServer/tile/{z}/{y}/{x}",
    maxZoom: 20,
    maxNativeZoom: 19,
    attribution: 'Imagery &copy; <a href="https://vgin.vdem.virginia.gov/">VGIN</a>, Commonwealth of Virginia',
  },
};

export function readBasemap(): Basemap {
  try {
    if (localStorage.getItem(KEY) === "satellite") return "satellite";
  } catch {
    // Storage blocked: the street map.
  }
  return "map";
}

export function setBasemap(b: Basemap) {
  try {
    localStorage.setItem(KEY, b);
  } catch {
    // Can't remember it: it still applies until the page is closed.
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** The current map style; every map on screen follows it. */
export function useBasemap(): Basemap {
  return useSyncExternalStore(subscribe, readBasemap, () => "map" as Basemap);
}

type Leaflet = typeof import("leaflet");

/**
 * Keeps a Leaflet map's tiles on the chosen style. Maps are created after
 * Leaflet loads, so callers pass `ready` once the map exists.
 */
export function useBasemapTiles(leaflet: { current: Leaflet | null }, map: { current: import("leaflet").Map | null }, ready: boolean) {
  const basemap = useBasemap();
  const tiles = useRef<import("leaflet").TileLayer | null>(null);
  useEffect(() => {
    if (!ready || !leaflet.current || !map.current) return;
    tiles.current?.remove();
    const b = BASEMAPS[basemap];
    tiles.current = leaflet.current
      .tileLayer(b.url, { maxZoom: b.maxZoom, maxNativeZoom: b.maxNativeZoom, attribution: b.attribution })
      .addTo(map.current);
  }, [ready, basemap, leaflet, map]);
}
