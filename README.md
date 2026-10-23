# WhoseJob?

**WhoseJob? tells residents of Virginia's 8th District exactly which office fixes a problem at their exact spot, explains why in one line, and hands them a report they send themselves.**

Team entry for the 2026 Congressional App Challenge (VA-08, Rep. Don Beyer). Deadline: noon EDT, Monday, Oct 26, 2026.

Live app: **https://whose-job.vercel.app** · Source: https://github.com/aymenawel/WhoseJob-

## Why it exists

In VA-08, the same problem goes to different offices depending on the exact spot:

- **Arlington** maintains most of its own streets, but some stretches of state routes inside Arlington (such as parts of Glebe Rd, VA-120) are VDOT's, and federal roads like the GW Parkway are the National Park Service's.
- **Fairfax County** maintains no public roads at all; VDOT does.
- **Alexandria and Falls Church** maintain their own streets.
- Two dark streetlights 60 m apart on the same Arlington block go to two different places: one is the county's, the other is Dominion Energy's.

Residents can't see any of this. WhoseJob? checks it for them, from public map data.

## How it works

1. **Photo (optional).** The app reads the GPS location from the photo in the browser. The photo never leaves the phone.
2. **Issue.** The resident picks one of nine large tiles: pothole, streetlight, signal, signs, flooding, trash, abandoned car, or a federal agency problem.
3. **Where.** A map with a fixed center pin; the resident moves the map, uses their location, or types an address.
4. **Who fixes it.** The server runs every check at once (`/api/resolve`):
   - **District and locality:** U.S. Census Geocoder (119th Congress districts).
   - **Road owner:** VDOT's route-responsibility layer, with the nearest segment picked by geometry. A bundled snapshot is used if VDOT is throttled.
   - **Streetlight owner:** the nearest light in Arlington's, Alexandria's or Fairfax's own streetlight data. If two lights with different owners are within 3 m of each other, the app asks the resident to read the tag on the pole instead of guessing.

   The **routing engine** then applies the team's rules file and shows the answer as a green road sign. The office people would wrongly guess is shown crossed out, with a one-line reason.
5. **Your report.** A pre-filled message the resident copies, emails, or pastes into the office's official form. Or they call the number shown. The app never sends anything itself.

**Federal problems** (passport, VA, Social Security, IRS, immigration) go to the Member of Congress's district office as a casework letter. The letter asks only for a short description, never ID or case numbers.

**Community map:** sample reports, clearly labeled as sample data, plus the resident's own reports, saved only on their device. Nearby reports of the same problem to the same office are grouped ("4 neighbors reported this").

Everything is in English and Spanish, with a toggle on every screen.

## Running it

```bash
npm install
npm run dev -- --port 3100      # http://localhost:3100
npm test                        # unit tests (Vitest), runs offline against captured real responses
npm run check:live              # calls the real services for the demo points through the running app
npm run build
```

## Project structure

```
src/app/            screens (home, report/{photo,issue,where,answer,send,federal}, map) and API routes
src/components/     the sign system: Sign, LevelMarker, RouteMarker, NotPlate, ActionRail, TopBar…
src/lib/geo/        Census, VDOT road owner, streetlight owner, snapshot fallback, geometry helpers
src/lib/jurisdiction/  runs every check in parallel with honest fallbacks
src/lib/routing/    rules validation and the routing engine
src/lib/report/     report, email and casework letter text
src/lib/i18n/       English and Spanish strings
src/data/           routing-rules.json and offices.json (team-edited), members, boundaries, road snapshot, sample reports
tests/              unit tests and captured API fixtures
scripts/            rebuild members, boundaries, road snapshot and fixtures from their public sources
docs/               vision, competition notes, data sources, dev log, design, spec and plan
```

**Editing who fixes what:** see [docs/routing-rules-guide.md](docs/routing-rules-guide.md). `npm test` checks your edit and names any mistake.

## Data sources

All are free, public, and need no API key. Details, tests and fallbacks are in [docs/data-sources.md](docs/data-sources.md).

| Need | Source |
| --- | --- |
| Address → point → district, county | U.S. Census Geocoder (`ACS2025_Current` vintage = 119th Congress) |
| Road owner | VDOT Route Responsibility (ArcGIS), plus a bundled VA-08 snapshot from its public download |
| Streetlight owner | Arlington County, City of Alexandria and Fairfax County streetlight layers |
| Member of Congress | [unitedstates/congress-legislators](https://github.com/unitedstates/congress-legislators) (public domain) |
| District and county outlines | Census TIGERweb |
| Map tiles | © OpenStreetMap contributors |
| Office contacts | Official county, city, VDOT and Dominion pages; each rule records its source |

## Libraries (all open source)

| Library | Use | License |
| --- | --- | --- |
| Next.js, React | App framework | MIT |
| Leaflet | Maps | BSD-2-Clause |
| Turf.js | Geometry | MIT |
| exifr | Reading photo GPS | MIT |
| Vitest, Testing Library | Tests | MIT |
| Overpass | Font, based on highway-sign lettering | SIL OFL |

## Deploying

The app runs free on Vercel's Hobby plan. The Vercel project `whose-job` is connected to this GitHub repository, so every push to `main` deploys to https://whose-job.vercel.app automatically.

Deploy from GitHub rather than with a local `vercel deploy` on Windows: a local build there fails on Windows symlinks (see [docs/dev-log.md](docs/dev-log.md)).

## Privacy

- Photos stay on the device.
- No accounts, no database, nothing stored on a server.
- The resident's own map reports live in their browser only.
