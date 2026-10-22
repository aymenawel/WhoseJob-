# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js (TypeScript) on Vercel's free hobby tier. Leaflet or MapLibre for the map, Turf.js for geometry, exifr for photo GPS. No paid APIs, no billing keys.

## Users

Residents of Virginia's 8th Congressional District (Arlington County, City of Alexandria, City of Falls Church, and the VA-08 part of Fairfax County) who see a local problem and don't know who to call. The design is built for the hardest cases:
- older residents
- new arrivals
- people reading in a second language (Spanish is the second language)

Most reports start on a phone, standing at the problem.

Secondary audience: the judging panel for the 2026 Congressional App Challenge (Rep. Don Beyer's office), who see the app in a 1–3 minute video and may open the live link and the source code.

## Product Purpose

WhoseJob? tells a resident exactly which office fixes a problem at a specific spot, explains why in one line, and hands them a pre-filled report to send themselves. Success means the resident reaches the right office on the first try, in under a minute, without knowing anything about jurisdiction.

## Positioning

Other reporting apps make reporting easy; WhoseJob? makes it correct. It detects who owns the exact spot from public map data:
- which agency maintains the road segment (VDOT, county, or city)
- who owns the nearest streetlight (county, city, or Dominion)
- which congressional district the spot is in

It then routes the report with a team-researched rules file. In VA-08 the same pothole goes to four different offices depending on which side of a line it's on. Federal problems (passport, VA, Social Security, IRS, immigration) route to the Member's district office as casework.

## Operating Context

The flow has five steps:
1. Photo or location.
2. Pick the issue.
3. Confirm the pin.
4. See who fixes it, and why.
5. Copy, email, or open the office's form.

The app never sends anything itself. A community map shows labeled sample reports, plus the user's own reports saved only on their device. Nearby duplicates are grouped ("4 neighbors reported this").

## Capabilities and Constraints

- **Coverage:** VA-08 only. Outside the district, say so plainly and show the user's actual Member if known.
- **Live lookups:**
  - Census Geocoder (through a small server proxy; it has no CORS)
  - VDOT Route Responsibility
  - Arlington, Alexandria, and Fairfax streetlight layers

  Every lookup has a stated fallback (see docs/data-sources.md).
- **Routing rules** live in one JSON file keyed by locality, then issue type. The team researches and edits it.
- **Privacy:** never collect sensitive personal data. The casework flow asks only for a short description: no Social Security numbers, case numbers, or medical details. It notes that House offices usually need a signed privacy release.
- **Cost:** must cost nothing to run or judge.

## Brand Commitments

- Name: "WhoseJob?" in the app; `whosejob` for the repo, URL, and file names.
- No existing logo, colors, or fonts; the visual identity is created fresh.
- Tone: trustworthy and civic, credible enough for a congressional office to share; never corporate or gimmicky. Plain language.

## Evidence on Hand

- Verified routing facts from official sources and live map data (docs/data-sources.md). Examples:
  - Fairfax County maintains no public roads.
  - Arlington runs its own roads and owns about 8,000 streetlights.
- **No resident survey will be run.** Never invent survey numbers, quotes, user counts, or testimonials.
- Community map data is sample data and must be labeled as such everywhere it appears.

## Product Principles

1. **One answer, not ten links.** Every flow ends at one office, its reason, and a ready report.
2. **Show the work.** The resident sees which checks the app ran (district, road owner, streetlight owner) and which one decided the answer.
3. **Correct over confident.** When data is missing or ambiguous, say so and fall back honestly; never guess silently.
4. **The resident stays in control.** The app drafts; the person sends.
5. **Everyone can use it.** Large tap targets, icons always paired with words, plain language, and a working language toggle.

## Accessibility & Inclusion

- WCAG 2.2 AA minimum.
- Body text 18px or larger on phones.
- Touch targets at least 44px.
- Never rely on color alone: every level of government has a color, an icon, and a written label.
- Full English and Spanish.
- Works with screen readers and with reduced motion.
