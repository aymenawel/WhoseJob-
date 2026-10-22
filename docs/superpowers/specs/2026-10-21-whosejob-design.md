# WhoseJob? design spec

Oct 21, 2026 · Status: draft for team review

## What we're building

WhoseJob? is a mobile-first web app for residents of Virginia's 8th District. A resident photographs or picks a local problem. The app works out who owns that exact spot from public map data, names the one office that fixes it with a one-line reason, and hands over a pre-filled report the resident sends themselves. Federal problems route to Rep. Don Beyer's district office as a casework letter.

Product truth lives in [PRODUCT.md](../../../PRODUCT.md), data sources in [data-sources.md](../../data-sources.md), and the visual direction in [docs/design/README.md](../../design/README.md). This spec covers how the app is built.

## Scope

**MVP (must ship by Sunday, Oct 25):**

1. Location from photo GPS, device location, or a typed address, always confirmable on a map pin.
2. Jurisdiction checks:
   - congressional district
   - locality (county or city)
   - road owner
   - streetlight owner
3. Issue picker with icon-and-word tiles.
4. Routing engine driven by one rules file covering all four VA-08 localities.
5. "Here's who fixes it" screen in the locked Guide Sign × Full-Screen Story design, with the "why not the obvious office" plate.
6. Report screen: copy text, open email with the text filled in, or open the office's official form or phone line.
7. Federal casework letter to the Member's district office, with the privacy-release note.
8. English and Spanish, with a working toggle.

**Stretch, in order:**

1. Community map with labeled sample reports, the resident's own reports saved on their device, and "4 neighbors reported this" grouping.
2. Large-text mode.

**Out:** accounts, a shared backend, push notifications, status tracking, offline mode.

## Architecture

```
Browser (Next.js client)                     Vercel serverless (Next.js route handlers)
───────────────────────────                  ──────────────────────────────────────────
Photo → exifr GPS ─┐
Device location ───┼─► lat/lon ─► GET /api/resolve?lat&lon ─► Census Geocoder (district, locality)
Typed address ─────┘    ▲         (one call, all checks       VDOT Route Responsibility (road owner)
   └─► GET /api/geocode?q ┘        run in parallel)           Arlington / Alexandria / Fairfax
                                                              streetlight layers (light owner)
                              ◄── Checks JSON ◄──────────────
Issue + Checks ─► routing engine (pure function, runs in the browser) ─► Route
Route ─► "Here's who fixes it" ─► report builder ─► copy / mailto / official form
```

**Why the lookups run on the server:**

- The Census Geocoder sends no CORS header, so it needs a server anyway.
- One endpoint returns every check together, so the "app thinking" reveal can play in order without network jitter.
- It keeps third-party layer URLs out of the client.

**Why routing runs in the browser:** it is a pure function of the issue, the checks, and the rules file. That makes it instant when the resident changes the issue, and easy to test.

### Folder structure

```
src/
  app/                      Next.js App Router screens
    page.tsx                Home: "Report a problem", nearby map preview, language toggle
    report/
      photo/page.tsx        Step 1: photo (optional) → reads GPS
      issue/page.tsx        Step 2: issue tiles
      where/page.tsx        Step 3: confirm pin / type address
      answer/page.tsx       Step 4: Here's who fixes it
      send/page.tsx         Step 5: your report
    map/page.tsx            Community map (stretch)
    api/
      geocode/route.ts      Address → lat/lon (Census proxy)
      resolve/route.ts      lat/lon → Checks
  components/               Sign, RouteMarker, ActionRail, ProgressBar, IssueTile, MapPin, LanguageToggle…
  lib/
    geo/census.ts           Census Geocoder client + response parsing
    geo/roadOwner.ts        VDOT query + nearest-segment selection
    geo/streetlight.ts      Per-locality streetlight layer queries + nearest light
    geo/nearest.ts          Turf-based nearest-feature helpers
    jurisdiction/resolve.ts Runs all checks in parallel, applies fallbacks → Checks
    routing/engine.ts       route(issue, checks, rules) → Route
    routing/schema.ts       Types + runtime validation for the rules file
    report/compose.ts       Builds report text, mailto URL, casework letter
    members.ts              District → Member lookup from bundled data
    i18n/                   en.json, es.json, useT() hook
  data/
    routing-rules.json      Team-edited: locality → issue → rule
    offices.json            Team-edited: every office's contacts, level, sources
    members-va.json         Trimmed from unitedstates/congress-legislators
    va08-boundary.json      Simplified district polygon (for the map and the in-district check)
    localities.json         Simplified Arlington / Alexandria / Falls Church / Fairfax polygons (Census fallback)
    sample-reports.json     Clearly labeled sample data for the community map
tests/
  lib/…                     Vitest unit tests mirroring src/lib
  fixtures/…                Real API responses captured Oct 21 for offline tests
docs/                       vision, data sources, dev log, design, this spec
```

### Key data shapes

```ts
type Level = "local" | "state" | "utility" | "federal";

type Checks = {
  point: { lat: number; lon: number };
  district: { id: "VA-08" | string; inCoverage: boolean } | null;
  locality: { id: "arlington" | "alexandria" | "falls-church" | "fairfax"; name: string } | null;
  road: { name: string; owner: "state" | "county" | "city" | "private" | "unknown"; distanceM: number } | null;
  streetlight: { owner: "dominion" | "county" | "city" | "unknown"; poleId?: string; formUrl?: string; distanceM: number } | null;
  fallbacks: string[];   // which checks fell back, shown honestly in the UI
};

type Route = {
  office: OfficeId;
  level: Level;
  decidedBy: "road" | "streetlight" | "locality" | "federal";
  notOffice?: OfficeId;               // the obvious-but-wrong office for the struck plate
  why: { en: string; es: string };
  contact: { phone?: string; formUrl?: string; email?: string };
};
```

### Rules file

The rules file is keyed by locality, then issue. Each rule names the check that decides it, and maps that check's value to an office. The team edits only this file and `offices.json`, never code. Each rule carries its source URL and the date it was verified; the app shows unverified rules with a small "being verified" note. The example below shows the shape only; the source URL and Spanish text are placeholders that the real file fills in.

```json
{
  "arlington": {
    "pothole": {
      "decidedBy": "road",
      "byValue": { "county": "arlington-des", "state": "vdot" },
      "default": "arlington-311",
      "notOffice": { "state": "arlington-des" },
      "why": {
        "county": { "en": "Arlington maintains its own streets.", "es": "…" },
        "state": { "en": "This is a state road, so VDOT fixes it.", "es": "…" }
      },
      "source": "https://…",
      "verified": "2026-10-22"
    }
  }
}
```

## Screens

All screens follow the direction contract in `.impeccable/surfaces/src-app.md`:
- a 5-segment progress bar
- one job per screen
- a 60px primary button
- words under every icon

The three load-bearing screens:

- **Where is it?** A full-screen map with a draggable pin and an address box. The pin keeps the same position on screen through every later step.
- **Here's who fixes it.**
  - The photo, or the map when there's no photo, fills the top.
  - The "Checked" route markers appear one by one, about 250 ms apart. The deciding marker gets the white outline.
  - The green guide sign lands with the office.
  - Below it come the struck-through plate and the reason.
  - Under reduced motion, everything appears at once.
- **Your report.**
  - A preview of the message.
  - Buttons: Copy, Email, Open official form, Call.
  - A reminder that the photo stays on the phone and can be attached by the resident.

## Errors and fallbacks

| Failure | What the resident sees |
| --- | --- |
| Census down or slow (over 6 s) | Locality from the bundled boundary; district from the bundled VA-08 polygon; a small "using saved map data" note |
| Point outside VA-08 | "This spot is outside Virginia's 8th District" with the district it's in, and general guidance; no wrong routing |
| No road within 60 m | The locality's default road owner, with the reason saying so |
| No streetlight found, or a layer is down | "Look for the tag on the pole. Does it say Dominion?" with Yes / No / Not sure, then route |
| Photo has no GPS | Straight to "Where is it?" with device location offered |
| Unknown issue for a locality | The locality's main line (311 or equivalent), labeled as the fallback |

Every fallback is listed in `Checks.fallbacks` and shown in plain words. The app never shows a confident answer it didn't earn.

## Privacy

- **Photos never leave the device.** We read GPS from them in the browser and never upload them.
- **Nothing is stored on a server.**
- **The resident's own reports are kept on their device only.** They live in the browser's local storage on that phone.
- **The casework flow asks only for a short description.** It never asks for Social Security numbers, case numbers, or medical details, and it says a signed privacy release is usually needed.

## Testing

Test-driven development (Vitest) covers the logic that must be right:
- Census response parsing, including the 119th-district key
- nearest road segment and road-owner mapping
- streetlight owner per locality
- the fallback rules
- the routing engine for every locality × issue in the rules file
- report and mailto composition

Tests run against real responses captured on Oct 21 (`tests/fixtures`), so they don't need the network. A separate `npm run check:live` script calls the real services for our demo addresses.

End-to-end checks run in the built-in browser at 390×844. We walk the four demo routes:
1. Arlington streetlight to Dominion
2. Arlington streetlight to Arlington County
3. Fairfax pothole to VDOT
4. Passport to Rep. Beyer's office

## Cost and deployment

- **Cost:** Vercel Hobby (free) and only free, open data, so nothing here can ever bill.
- **Deploy with the Vercel CLI.** The Vercel and GitHub connections failed in this session, so a team member logs in once with `npx vercel login`.
- **Libraries (all MIT or BSD):** Next.js, React, Leaflet with OpenStreetMap tiles, Turf.js, exifr, Vitest.

## Build order

1. Scaffold, deploy a "hello" page to a live URL.
2. `lib/geo/census` + `/api/geocode` with tests; typed address shows district and Member live.
3. Road owner, streetlight owner, `/api/resolve` with fallbacks.
4. Rules file + routing engine for all four localities.
5. The five screens in the locked design, English first.
6. Report and casework composition.
7. Spanish.
8. Community map (stretch).
9. Phone-size end-to-end pass, accessibility pass, final deploy.

## Open items for the team

- Verify every rule and phone number in `routing-rules.json` and `offices.json` against official pages before Saturday.
- Find Rep. Beyer's casework page URL.
- Research Falls Church streetlight ownership.
- Email Arlington DES about using its streetlight layers.
- Translate or review the Spanish strings, ideally with a native speaker.
