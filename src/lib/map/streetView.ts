import type { Point } from "@/lib/flow/state";

/**
 * Google Maps' documented, key-free link format for Street View at a spot.
 * Nothing is embedded: the resident taps it and Google Maps opens there.
 */
export function streetViewUrl(p: Point): string {
  return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${p.lat},${p.lon}`;
}
