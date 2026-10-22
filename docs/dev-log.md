# Dev log

Decisions and real technical problems, newest first. This answers the submission question "What technical difficulty did you face, and how did you address it?"

## Oct 21, 2026

**Decisions:** Next.js on Vercel, Spanish as the second language, community map with labeled sample data plus the user's own reports saved on their device. Coverage area: proposed, not yet confirmed.

**Problem: the Census Geocoder now returns next Congress's districts.** The default `Current_Current` vintage returns "120th Congressional Districts" (starting Jan 2027). The judge is the *current* Member, so we pin `vintage=ACS2025_Current`, which returns the 119th Congress layer.

**Problem: the Census Geocoder blocks browser calls.** It sends no CORS header, so a browser `fetch` fails. Fix: one small Next.js route handler that forwards the request server-side.

**Problem: the planned demo doesn't exist in our district.** The vision's demo was two streetlights routed to Dominion vs NOVEC. Intersecting Fairfax County's NOVEC service-area polygons with the VA-08 boundary gave 0% overlap: our whole district is Dominion. Instead of utility polygons, we now look up the **actual nearest streetlight** in Arlington's, Alexandria's, and Fairfax's own streetlight layers and read its owner. This is more precise (it works pole by pole) and gives a better demo: two lights on the same Arlington street, one county-owned and one Dominion's.

**Finding: VA-08 has four different road systems.** VDOT's route layer shows Arlington maintains its own streets, Alexandria and Falls Church maintain theirs, and in Fairfax County VDOT maintains everything, including residential streets. Some Arlington roads (Glebe Rd, VA-120) are still VDOT. Detecting this from map data is the app's core technical piece.
