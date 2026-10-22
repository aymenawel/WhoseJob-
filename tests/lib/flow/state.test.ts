import { describe, expect, test, vi } from "vitest";

vi.mock("exifr", () => ({ default: { gps: vi.fn() } }));
import exifr from "exifr";
import { flowReducer, initialFlow, readPhotoGps, startReport } from "@/lib/flow/state";
import type { Checks } from "@/lib/types";

const gps = exifr.gps as unknown as ReturnType<typeof vi.fn>;
const file = new File(["x"], "photo.jpg", { type: "image/jpeg" });

describe("readPhotoGps", () => {
  test("maps exifr's latitude/longitude to a point", async () => {
    gps.mockResolvedValueOnce({ latitude: 38.8914, longitude: -77.0849 });
    expect(await readPhotoGps(file)).toEqual({ lat: 38.8914, lon: -77.0849 });
  });

  test("no GPS in the photo → null", async () => {
    gps.mockResolvedValueOnce(undefined);
    expect(await readPhotoGps(file)).toBeNull();
  });

  test("a file exifr can't read (e.g. HEIC) → null, not a crash", async () => {
    gps.mockRejectedValueOnce(new Error("Unknown file format"));
    expect(await readPhotoGps(file)).toBeNull();
  });
});

describe("flowReducer", () => {
  const checks = { point: { lat: 1, lon: 2 } } as Checks;

  test("moving the pin clears checks that belonged to the old spot", () => {
    const s = flowReducer({ ...initialFlow, point: { lat: 1, lon: 2 }, checks }, { point: { lat: 1.001, lon: 2 } });
    expect(s.checks).toBeNull();
    expect(s.point).toEqual({ lat: 1.001, lon: 2 });
  });

  test("setting the same point keeps the checks", () => {
    const s = flowReducer({ ...initialFlow, point: { lat: 1, lon: 2 }, checks }, { point: { lat: 1, lon: 2 } });
    expect(s.checks).toBe(checks);
  });

  test("changing only the issue keeps the checks (routing is instant)", () => {
    const s = flowReducer({ ...initialFlow, point: { lat: 1, lon: 2 }, checks, issue: "pothole" }, { issue: "streetlight" });
    expect(s.checks).toBe(checks);
    expect(s.issue).toBe("streetlight");
  });
});

describe("startReport", () => {
  test("starting a new report drops the previous report's spot, checks and issue", () => {
    const old = { ...initialFlow, point: { lat: 1, lon: 2 }, address: "old", issue: "pothole" as const, checks: { point: { lat: 1, lon: 2 } } as Checks };
    const s = flowReducer(old, startReport(null, null));
    expect(s).toMatchObject({ point: null, address: null, issue: null, checks: null, photoUrl: null });
  });

  test("a new photo with GPS starts the report at the photo's spot", () => {
    const s = flowReducer(initialFlow, startReport("blob:x", { lat: 38.9, lon: -77.1 }));
    expect(s).toMatchObject({ photoUrl: "blob:x", point: { lat: 38.9, lon: -77.1 }, checks: null, issue: null });
  });
});
