# Dev log

Decisions and real technical problems, newest first. This answers the submission question "What technical difficulty did you face, and how did you address it?"

## Oct 22, 2026

**Problem: the road-owner service silently said "no road here".** While testing a demo point, the road check came back empty with no error. Querying VDOT directly showed why: its public map service shares one request quota (6,000 units a minute) with everyone who uses it, and when the quota runs out it still answers with HTTP 200, just with an error message inside. Our code read that as an empty list of roads. Two fixes:
1. Every map-service response now goes through one reader (`src/lib/geo/arcgis.ts`) that treats an error inside a 200 as a failure, so the app says honestly that it couldn't check.
2. We bundled a snapshot of VDOT's road ownership for the area around VA-08. The statewide file is about 680 MB, so `scripts/build-roads.mjs` streams it and keeps only the 7,965 segments near our district (4.7 MB). When the live service is throttled, the server answers from the snapshot instead.

**Problem: the demo streetlights weren't where we thought.** At the geocoded point for 2100 Clarendon Blvd, the nearest light is the county's, and Dominion's pole is 54 m away. Pins have to land on the actual light, so the demo now uses the exact pole positions: Dominion's C0918WL6800 and the county's 190MA01SE, about 60 m apart on the same block. At 2201 Wilson Blvd, a county light and a Dominion light are within 2 m of each other, so the app asks the resident to read the tag on the pole instead of guessing.

**Problem: a page reload lost the pin.** The report's progress was restored from storage *after* the first render, so the map started at the default spot and an empty state overwrote the saved one. Restoring and marking the state "ready" now happen in one step, and screens wait for "ready".

## Oct 21, 2026

**Decisions:** Next.js on Vercel, Spanish as the second language, community map with labeled sample data plus the user's own reports saved on their device. Coverage: all of VA-08 (Arlington, Alexandria, Falls Church, and the VA-08 part of Fairfax County), since that is the judge's whole territory.

**Problem: the Census Geocoder now returns next Congress's districts.** The default `Current_Current` vintage returns "120th Congressional Districts" (starting Jan 2027). The judge is the *current* Member, so we pin `vintage=ACS2025_Current`, which returns the 119th Congress layer.

**Problem: the Census Geocoder blocks browser calls.** It sends no CORS header, so a browser `fetch` fails. Fix: one small Next.js route handler that forwards the request server-side.

**Problem: the planned demo doesn't exist in our district.** The vision's demo was two streetlights routed to Dominion vs NOVEC. Intersecting Fairfax County's NOVEC service-area polygons with the VA-08 boundary gave 0% overlap: our whole district is Dominion. Instead of utility polygons, we now look up the **actual nearest streetlight** in Arlington's, Alexandria's, and Fairfax's own streetlight layers and read its owner. This is more precise (it works pole by pole) and gives a better demo: two lights on the same Arlington street, one county-owned and one Dominion's.

**Finding: VA-08 has four different road systems.** VDOT's route layer shows Arlington maintains its own streets, Alexandria and Falls Church maintain theirs, and in Fairfax County VDOT maintains everything, including residential streets. Some Arlington roads (Glebe Rd, VA-120) are still VDOT. Detecting this from map data is the app's core technical piece.
