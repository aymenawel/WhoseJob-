import { afterEach, describe, expect, test } from "vitest";
import { BASEMAPS, readBasemap, setBasemap } from "@/lib/map/basemap";
import { streetViewUrl } from "@/lib/map/streetView";

afterEach(() => localStorage.clear());

describe("map style", () => {
  test("the street map is the default", () => {
    expect(readBasemap()).toBe("map");
  });

  test("choosing satellite is remembered on the device", () => {
    setBasemap("satellite");
    expect(readBasemap()).toBe("satellite");
    expect(localStorage.getItem("whosejob.basemap")).toBe("satellite");
  });

  test("a junk saved value falls back to the street map", () => {
    localStorage.setItem("whosejob.basemap", "terrain");
    expect(readBasemap()).toBe("map");
  });

  test("satellite comes from Virginia's own aerial photos, credited", () => {
    expect(BASEMAPS.satellite.url).toMatch(/^https:\/\/vginmaps\.vdem\.virginia\.gov\/.+\/tile\/\{z\}\/\{y\}\/\{x\}$/);
    expect(BASEMAPS.satellite.attribution).toMatch(/VGIN/);
  });
});

describe("streetViewUrl", () => {
  test("opens Google Maps' Street View at the pin, using Google's documented link format", () => {
    const u = new URL(streetViewUrl({ lat: 38.891447, lon: -77.085525 }));
    expect(u.origin + u.pathname).toBe("https://www.google.com/maps/@");
    expect(u.searchParams.get("api")).toBe("1");
    expect(u.searchParams.get("map_action")).toBe("pano");
    expect(u.searchParams.get("viewpoint")).toBe("38.891447,-77.085525");
  });
});
