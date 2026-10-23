# Data sources

Every source below is free and needs no API key. Each one was called and its response inspected on **Oct 21, 2026**; test points are real addresses in VA-08.

## Coverage area: Virginia's 8th District (119th Congress)

The district is all of **Arlington County**, the **City of Alexandria**, the **City of Falls Church**, and the eastern part of **Fairfax County**. The April 2026 redistricting referendum was voided by the Virginia Supreme Court on May 8, 2026, so the 2021 map still applies ([Ballotpedia](https://news.ballotpedia.org/2026/05/08/virginia-supreme-court-voids-election-results-for-virginia-redistricting-referendum-blocking-implementation-of-a-map-that-would-have-shifted-four-congressional-seats-towards-democrats/)). Rep. Don Beyer serves through Jan 3, 2027.

**What this means for routing.** Each of the four places handles the same problem differently, and that difference is the app's core idea:

| Place | Who maintains most roads | Streetlights |
| --- | --- | --- |
| Arlington County | Arlington County (one of two VA counties that run their own roads); some routes such as Glebe Rd (VA-120) are VDOT | Split: about 8,000 county-owned, the rest Dominion |
| City of Alexandria | City of Alexandria | Split: Dominion and City (T&ES, RPCA) |
| City of Falls Church | City of Falls Church | Split: Dominion (1,070 lights) and City (240 lights) |
| Fairfax County (VA-08 part) | VDOT (Fairfax County does not maintain public roads) | Dominion |

**NOVEC does not serve VA-08.** Fairfax County's NOVEC service-area polygons cover 0% of the district (computed with Shapely against the Census district boundary). The vision's "Dominion vs NOVEC" demo does not work here; see "Demo replacement" at the end.

---

## 1. Address and coordinates → district, county, city

**U.S. Census Geocoder, geographies endpoints**

- **Provides:** matched address, lat/lon, county, incorporated place, county subdivision, and congressional district.
- **URLs:** `https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress` (address) and `.../geographies/coordinates` (map pin).
- **Tested:** 4 addresses (Clarendon Blvd Arlington, King St Alexandria, Park Ave Falls Church, Richmond Hwy Fairfax) all matched and returned district `5108`.
- **Important:**
  - `vintage=Current_Current` now returns **120th** Congress districts (the Congress that starts Jan 2027).
  - We pin `vintage=ACS2025_Current`, which returns **119th** Congress districts, so the app shows the Member who currently serves.
  - The response key is `"119th Congressional Districts"`; we read it by searching for keys containing "Congressional" so the next vintage change doesn't break it.
- **Browser access:** **No CORS header.** The browser cannot call it directly, so we use one Next.js route handler (`/api/geocode`) as a pass-through proxy.
- **Limits:** US addresses only; sometimes slow (1–3 s); no autocomplete; occasional outages.
- **Fallback:**
  - The bundled VA-08 boundary (source 2) still answers "in district or not" by point-in-polygon.
  - County or city comes from the bundled locality boundaries.

## 2. District boundary (for the map and offline checks)

**Census TIGERweb, Legislative MapServer, layer 8 ("119th Congressional Districts", ACS 2025)**

- **Provides:** the VA-08 polygon (GEOID `5108`), plus county and city polygons from the same service.
- **URL:** `https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Legislative/MapServer/8/query?where=GEOID='5108'&outSR=4326&f=geojson`
- **Tested:** downloaded as GeoJSON (221 KB, 10,632 vertices). Bounding box -77.239, 38.605 → -77.032, 38.968.
- **Limits:** large file; we simplify it before bundling.
- **Fallback:** a static file shipped in `data/`, so nothing depends on this server at runtime.

## 3. Road owner

**VDOT Route Responsibility (ArcGIS FeatureServer, layer 0)**

- **Provides:** for each road segment, `RTE_COMMON_NM` and `RIM_MAINT_RESPONSIBILITY_NM`:
  - `01-State Hwy Agency` = VDOT
  - `02-County Hwy Agency` = county
  - `04-Municipal or City Hwy Agency` = city
- **URL:** `https://services.arcgis.com/p5v98VHDX9Atv3l7/ArcGIS/rest/services/VDOT_Route_Responsibility/FeatureServer/0/query`
- **Tested:** point plus `distance=25–120 m` queries work. Results:

  | Test point | Road | Maintained by |
  | --- | --- | --- |
  | Arlington | Clarendon Blvd | County |
  | Arlington | Glebe Rd (VA-120) | VDOT |
  | Alexandria | King St | City |
  | Falls Church | Park Ave | City |
  | Fairfax | US-1 | VDOT |
  | Fairfax (Annandale) | residential SC-650 | VDOT |

- **Browser access:** CORS allowed (`Access-Control-Allow-Origin: *`).
- **Limits:**
  - A buffered query returns every segment within range (cross streets too), so we request geometry and pick the nearest segment ourselves with Turf.js.
  - Maximum 2,000 records per query.
  - Private roads and parking lots may return nothing.
- **Other owners (added Oct 22):** VDOT also codes roads it doesn't maintain: `26` private, `66` National Park Service, `74` Army, `60` other federal, `03` town, `12` park agency, `40` airport/school/college. The app reads them all, so federal land and private roads are never sent to the county or VDOT.
- **Fallback:** if nothing is within ~60 m, use the locality's default owner (table above) and say so on the answer screen.

### 3a. Arlington: the county's own street ownership (preferred in Arlington)

**Arlington County CRMS311_Streets (the street layer behind Arlington 311)**

- **URL:** `https://arlgis.arlingtonva.us/arcgis/rest/services/CRMS_311/CRMS311_Streets/MapServer/0/query`
- **Provides:** `STNAME` and `Owner`: ARL (county) 5,977 segments, VDOT 1,211, FED 320, OT 176, MWAA 169, PVT 150, NPS 89, PENT 47, DDOT 18 (counted Oct 22, 2026).
- **Why:** VDOT's layer has almost nothing on Arlington's federal land. Tested Oct 22: the GW Parkway returns no VDOT segment even 150 m out, but this layer says `NPS`; the cemetery's Grant Dr is `FED`.
- **Fallback:** if it fails, the app asks VDOT (then VDOT's snapshot).

## 4. Streetlight owner (replaces the power-utility polygon idea)

Instead of guessing the utility from a territory polygon, we find **the actual streetlight nearest the pin** and read who owns it. All three layers below are the ones the localities' own reporting tools use.

| Place | Layer | Owner field | Tested |
| --- | --- | --- | --- |
| Arlington | `arlgis.arlingtonva.us/.../CRMS_311/CRMS311_Arlington_Owned_Street_Lights/MapServer/0` | `MaintainedBy: "Arlington County"` | County light found at 2201 Wilson Blvd |
| Arlington | `arlgis.arlingtonva.us/.../CRMS_311/CRMS311_DominionLights/MapServer/0` | `OWNER: "DOM"` | Dominion light found within 60 m of 2100 Clarendon Blvd |
| Alexandria | `maps.alexandriava.gov/arcgis/rest/services/alxCCCStreetlights/MapServer/0` | `SL_OWNER`: DOM / City-TES / City-RPCA / PVT | Lights found near 301 King St |
| Fairfax | `fairfaxcounty.gov/gispub1/rest/services/DPWES/StreetLightReporter/MapServer/1` (Dominion), `/0` (NOVEC) | which layer it is in | Dominion pole `C0911LB9200` at 8351 Richmond Hwy |
| Falls Church | `services1.arcgis.com/2hmXRAz4ofcdQP6p/arcgis/rest/services/StreetlightInventory_2017/FeatureServer/1` (Dominion-maintained, 1,070 lights), `/2` (City-maintained, 240 lights) | which layer it is in; pole id `Pole__` (Dominion) or `Streetlight_ID` (city, the ID the city's repair form asks for) | City light 1002 at 1245 W Broad St; Dominion pole C0718UH2800 near Park Ave (tested Oct 22) |

- **Browser access:** all three servers send CORS headers.
- **Bonus:** Fairfax's layer includes `FORM_HTML`, a link to the county's StreetlightReporter form **pre-filled with the pole number and address**. The report screen can open that exact form.
- **Limits and cautions:**
  - Arlington's Dominion layer is publicly reachable, but its metadata says "Internal Use Only." **Before the demo, our team should email Arlington DES to ask whether we may use it.** If they say no, use the fallback.
  - Alexandria's data was collected from aerial photography and may be out of date.
  - Falls Church: found Oct 22 behind the city's "Streetlight Repair App" (ArcGIS Instant App 584e6a6f…); public and CORS-enabled.
- **Fallback:** "Look for a metal tag on the pole. Does it say Dominion?" with a photo example, plus the locality's 311 line, which forwards to Dominion.

## 5. Traffic signals (Arlington)

**Arlington CRMS311_SignalizedIntersections**

- **Provides:** signal ID, intersection name, `Jurisdiction`.
- **Tested:** found signal #190 at Wilson Blvd & N Uhle St, Arlington County.
- **Use:** confirms that a broken signal in Arlington goes to the county, not VDOT.
- **Fallback:** road-owner rule (source 3).

## 6. Member of Congress

**unitedstates/congress-legislators** (public domain, GitHub Pages)

- **Provides:** name, party, term end, DC phone, website; district offices with address, phone, and lat/lon.
- **URLs:**
  - `https://unitedstates.github.io/congress-legislators/legislators-current.json`
  - `https://unitedstates.github.io/congress-legislators/legislators-district-offices.json`
- **Tested:**
  - 539 current legislators; all 11 VA House seats present.
  - VA-08 = **Donald S. Beyer, Jr.** (D), bioguide `B001292`, term ends 2027-01-03, `beyer.house.gov`, DC 202-225-4376.
  - District office: 700 N Fairfax St, Suite 510, Alexandria VA 22314, 703-658-5403.
- **Limits:** `contact_form` is empty for Beyer, so we link to the website's casework page instead (team to confirm the URL).
- **Fallback:** we bundle a trimmed JSON with all 439 House members and delegates (`src/data/members.json`), so the federal flow can name anyone's Member; no runtime fetch.

## 7. Office contacts (routing rules)

Our team writes and verifies these by hand from official pages only (county, city, VDOT, Dominion). They live in `data/routing-rules.json`. Each rule records its source URL and the date it was checked.

## 8. Map and photo (libraries, not data)

| Need | Choice | Notes |
| --- | --- | --- |
| Base map | To decide during the visual brainstorm: OpenStreetMap tiles via Leaflet, or OpenFreeMap vector tiles via MapLibre | Both free with attribution. OSM's tile policy discourages heavy use; fine for a demo. |
| Photo GPS | exifr (MIT) | Many phones strip GPS on upload, so manual pin is always offered. |
| Geometry | Turf.js (MIT) | Nearest segment, point-in-polygon. |

---

## Demo replacement

The vision's demo needed Dominion and NOVEC in one district; VA-08 has only Dominion. Two stronger demos, both checked against live data:

1. **Same street, two owners.** Two dark streetlights on Wilson Blvd in Arlington: one is county-owned (Arlington DES), the other is Dominion's. The app finds each pole and routes them differently.
2. **Same pothole, different answers.**
   - A pothole in Arlington goes to Arlington County.
   - Cross into Fairfax and the same pothole goes to VDOT, because Fairfax County doesn't maintain roads.
   - On Glebe Rd, still inside Arlington, it goes to VDOT.

## 9. Report links (where each report is sent)

Each office in `src/data/offices.json` can have a `forms` entry per problem: the deepest link we found, plus one line telling the resident what to do there. Found on Oct 22 by opening each site in a browser and watching what it loads.

| Office | How deep it goes |
| --- | --- |
| Arlington County 311 | The exact problem type (`request/add?typeId=…`) **with the location filled in** (`&location=`). Type IDs come from the portal's own list (`/311/api/v1/type/list`): pothole 395, streetlight 499, signal 466, roadway signs 34099, street flooding 15684, missed collection 330, general inquiry 166677. |
| City of Falls Church | The exact form (`forms.aspx?fid=…`): pothole 75, streetlight 77, signs 78, signal 80, trash 82, abandoned vehicle 104, stormwater 106. Each confirmed by page title. |
| Fairfax County | Exact forms for street name signs, storm drains and missed trash; streetlights use the county's own form pre-filled with the pole. |
| Dominion Energy | Its streetlight-outage page. |
| Alexandria (Alex311) | No direct links: the request opens in a pop-up on one page, and search needs a login. The app opens Alex311 and says what to search and tap. |
| VDOT | One form behind a terms notice that only the resident can accept; the app says what to choose. |

`npm run check:links` opens every link and fails if one breaks or now redirects to a home page. GitHub runs it every Monday (`.github/workflows/check-links.yml`).
