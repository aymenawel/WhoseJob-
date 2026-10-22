// Calls the running app's /api/resolve for the demo points and prints what
// each check found, so we can see the real services still answer as expected.
// Usage: npm run check:live [-- https://whosejob.vercel.app]   (default: local dev)
const base = process.argv[2] ?? "http://localhost:3100";

const POINTS = [
  { name: "Dominion pole C0918WL6800, Arlington", lat: 38.891447, lon: -77.085525, expect: { light: "dominion" } },
  { name: "County pole 190MA01SE, Arlington", lat: 38.891372, lon: -77.084805, expect: { light: "county" } },
  { name: "Columbia Pike (VA-244), Annandale", lat: 38.8311219, lon: -77.1945381, expect: { road: "state" } },
  { name: "301 King St, Alexandria", lat: 38.80457, lon: -77.042607, expect: { road: "city" } },
];

let failed = 0;
for (const p of POINTS) {
  const res = await fetch(`${base}/api/resolve?lat=${p.lat}&lon=${p.lon}`);
  const c = await res.json();
  const got = { road: c.road?.owner, light: c.streetlight?.owner };
  const ok = Object.entries(p.expect).every(([k, v]) => got[k] === v) && c.fallbacks.length === 0;
  if (!ok) failed++;
  console.log(
    `${ok ? "ok  " : "FAIL"} ${p.name}: ${c.district?.id} · ${c.locality?.name} · road ${c.road?.name} (${got.road}) · light ${got.light}` +
      `${c.streetlight?.poleId ? ` ${c.streetlight.poleId}` : ""} · fallbacks [${c.fallbacks}]`,
  );
}
process.exit(failed ? 1 : 0);
