# Dev log

Decisions and real technical problems, newest first. This answers the submission question "What technical difficulty did you face, and how did you address it?"

## Oct 22, 2026

**Problem: federal land got a confident wrong answer.** A review (by another AI, then checked by hand against the live site) found that a pothole pin on the GW Parkway, at the Pentagon or at Arlington National Cemetery was sent to Arlington County with a sure-sounding reason. VDOT's road map has almost nothing there, and the app read "no road found" as "the county's". Arlington's own 311 street layer turned out to record every street's owner, the Park Service and the Pentagon included, so the app now asks it first. Roads owned by someone none of our offices answers for get an honest answer that names the owner, and federal ones point to your Member of Congress's office. When no street is near the pin, the answer says it is the usual one, not a checked one. The same review led to these fixes:
- A failing address service no longer tells residents to check their spelling.
- The federal flow now names any Member of Congress, not only Virginia's.
- The map no longer counts sample reports as neighbors.
- The Email button is hidden when an office has no address.
- Tests now run on GitHub with every push.

**Problem: screens remembered the last report.** After "Move the pin", the map button was stuck on "Checking who owns this spot…". A second report still showed the first one's note, and "Add to the community map" stayed greyed out. Our version of Next.js doesn't throw a screen away when you leave it; it hides it and shows it again, exactly as it was, when you come back. Fixes:
1. The map button turns itself back on after every check.
2. Each report now gets an ID, and every report screen starts fresh when the ID changes.
3. "Report another problem" also landed on the wrong step. Clearing the report made the send screen think it had been opened by mistake, and its redirect beat the trip home. The clear and the trip home now happen as one update.

**Problem: "Copy report & open the form" sometimes opened nothing.** A tester picked an Alexandria street and tapped the button, but no site opened, even though the Dominion and Alex311 pages load fine by themselves. The button copied the report first and then opened the site with a script (`window.open`). Browsers, and the browsers built into apps like Instagram or Gmail, can quietly block a window opened by a script as a pop-up. Fix: the button is now a real link that opens in a new tab and copies the report on the same tap. Browsers always follow a link the person tapped.

**Problem: "Open the official form" dropped people on an index page.** Residents still had to find their problem again on the office's site. We opened each office's reporting site in a browser and watched what it loaded. Arlington's 311 portal fetches its list of problem types from its own API, so each type has a number (pothole 395, streetlight 499…), and its form also reads a `location` from the link. Now the app opens Arlington's exact form with the address already filled in. Falls Church has one form per problem (`fid=75` for potholes…), and Fairfax and Dominion have dedicated forms. Alexandria's Alex311 opens requests in a pop-up with no link of its own, and VDOT's form sits behind a notice only the resident can accept, so for those the app says exactly what to tap. The main button copies the report and opens the form in one tap. A weekly GitHub check opens all 42 links so a site redesign can't silently break them.

**Problem: the first deploy failed with a missing file that was really there.** A login-free "temporary" Vercel deploy builds on the local Windows machine. Vercel's packager links each page's prefetch segments to its function folder with symlinks, and Windows created those as file links pointing at folders, which Node can't follow (`ENOENT … _global-error.segments/__PAGE__.segment.rsc.func`). `next build` itself had passed. Fix: deploy from a logged-in Vercel account, which uploads the source and builds on Vercel's Linux servers.

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
