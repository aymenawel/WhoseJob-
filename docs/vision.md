# WhoseJob? Product Vision

Oct 21, 2026 · @Aymen A

WhoseJob? tells residents exactly which office fixes their problem, then hands them a ready-to-send report. Submission deadline is noon EDT on Oct 26, 2026.

## The pitch

**One sentence for the video:** WhoseJob? turns a photo of a local problem into a report sent to the office that actually fixes it, whether that is the county, the state, a utility, or your Member of Congress.

**Who it's for:** residents who see a problem and don't know who to call, especially older residents, new arrivals, and people who don't speak English as a first language.

**Name:** WhoseJob? Use "WhoseJob?" in the app, video, and submission; use `whosejob` for the repo, URL, and file names. Check that no existing app or site uses the name before recording the video.

## The problem and the insight

Reporting a problem is easy; knowing where to report it is the hard part. Responsibility is split in ways residents can't see:

- **Roads:** in Prince William County, VA, VDOT maintains the roads and traffic signals, but the county maintains street name signs ([PWC traffic signals and signs](https://pwcva.gov/department/transportation/traffic-signals-signs)).
- **Streetlights:** outages go to the power company (Dominion or NOVEC), not the county or VDOT ([PWC streetlights](https://www.pwcva.gov/department/transportation/streetlights)).
- **Federal issues:** a stuck passport, VA claim, or Social Security problem is where a Member of Congress's office can help through casework. A pothole is not.

**The insight:** past winners like Pothole Patrol and RoadWatch made reporting effortless. WhoseJob? makes reporting *correct*, for every issue type, and teaches civics along the way. That's the differentiator to lead with.

**Evidence to collect by Friday:** show 10 residents 5 real local problems (pothole, dark streetlight, broken signal, missing street sign, delayed passport) and ask who they would contact. Record the result as a number, for example "7 of 10 picked the wrong office for streetlights." That number is the video's hook and the answer to "What inspired you?"

**"Why not just Google it?"** Google returns ten links and leaves the user to work out jurisdiction. WhoseJob? returns one correct office for that exact spot, the reason, and a pre-filled report.

## How it works

The whole flow takes under a minute and five steps:

1. **Snap.** Take or upload a photo. The app reads GPS from the photo's metadata, or uses device location, or the user types an address.
2. **Pick the issue.** Large icon tiles: pothole, streetlight out, broken signal, missing sign, flooding or drainage, trash, abandoned car, or "federal issue" (passport, VA, Social Security, IRS, immigration case).
3. **Locate.** The app resolves the location to county, city or town, state, and congressional district, and finds the Member of Congress.
4. **Route.** The app detects who owns that exact spot (state or county road, which power utility), then the routing rules pick the office and explain why in one line: "Signals here are run by VDOT, not the county."
5. **Act.** The app shows the office's online form, phone number, and a pre-filled report (location, photo, description) to copy or open in email. The user sends it themselves. For federal issues, it drafts a casework request to the Member's district office.

After sending, the report lands on the community map. Duplicates nearby are grouped ("4 neighbors reported this"), and the user can mark it fixed later.

## Features

Ship the first six well before touching anything else; judges reward a polished core over a long feature list.

| # | Feature | Tier | Why it matters |
| --- | --- | --- | --- |
| 1 | Address, GPS or photo location to district and Member | MVP | The data pipeline every route depends on |
| 2 | Jurisdiction detection: state vs county road, which power utility | MVP | The coding showpiece; the app knows, not the user |
| 3 | Issue picker with icon tiles | MVP | Fast, works for any reading level |
| 4 | Routing engine (rules table) for every county in the district | MVP | The core idea; your own local research |
| 5 | "Why this office" explanation | MVP | Civic education angle |
| 6 | Pre-filled report: copy, email, or open the official form | MVP | Turns knowing into doing |
| 7 | Federal casework letter to the Member, with privacy-release note | MVP | Direct tie to the judges |
| 8 | Community map with duplicate grouping, sample data labeled | Stretch, high value | Strong demo visual |
| 9 | Spanish (and one more language) | Stretch, high value | Equity; easy with a strings file |
| 10 | Accessibility: large text, screen reader labels | Stretch | Cheap to add, judges notice |

**Cut for this version:** district dashboard, offline mode, and "My reports" status tracking. They become the 2.0 answer.

## Screens

Five screens cover the MVP; design mobile-first, since most reports start on a phone.

| Screen | What it shows | Key action |
| --- | --- | --- |
| Home | Big "Report a problem" button, map of nearby reports, language toggle | Start a report |
| What's wrong? | Photo upload, then issue tiles in a grid | Pick one tile |
| Where is it? | Map pin from photo GPS or device location, editable address box | Confirm location |
| Here's who fixes it | Office card: name, logo color by level (local, state, utility, federal), one-line "why", phone, web form link | Send or copy report |
| Your report | Pre-filled message preview, Copy / Email / Open form buttons, "Add to community map" | Send it yourself |

For the federal path, "Here's who fixes it" shows the Member of Congress, their district office, and a casework letter instead of a 311-style report.

## Routing rules

The rules table is the part your team must research and write yourselves; it is the app's real value and your strongest proof of original work. Store it as one JSON file keyed by county, then issue type.

Example for Prince William County, VA (verify every row before demo day):

| Issue | Responsible office | How to report | Source |
| --- | --- | --- | --- |
| Pothole, road damage (state-maintained road) | VDOT | [my.vdot.virginia.gov](https://my.vdot.virginia.gov) or 1-800-367-7623 | [WTOP](https://wtop.com/local/2026/02/where-to-report-potholes-in-your-dc-area-neighborhood/) |
| Traffic signal out | VDOT | 1-800-367-7623 | [PWC](https://pwcva.gov/department/transportation/traffic-signals-signs) |
| Stop, yield, speed sign | VDOT | 1-800-367-7623 | [PWC](https://pwcva.gov/department/transportation/traffic-signals-signs) |
| Street name sign | PWC Public Works Sign Shop | 703-792-5765 | [PWC](https://pwcva.gov/department/transportation/traffic-signals-signs) |
| Streetlight out | Dominion (1-888-667-3000) or NOVEC (703-335-0500), detected from the pin | Utility's outage portal | [PWC](https://www.pwcva.gov/department/transportation/streetlights) |
| Passport, VA, Social Security, IRS, immigration case | Member of Congress, district office (casework) | Casework form or letter | Member's website |

Each rule also carries a one-line explanation shown to the user, and a fallback ("Not sure? Call the county's main line") for anything unmatched.

### Jurisdiction detection

The app decides who owns the spot from map data, so the user never has to know:

- **Road owner:** VDOT publishes a statewide [route responsibility layer](https://services.arcgis.com/p5v98VHDX9Atv3l7/ArcGIS/rest/services/VDOT_Route_Responsibility/FeatureServer/layers), updated nightly, that marks each road segment as state, county, town, city, or private. Find the segment nearest the pin and read its maintenance field. Pre-download the district's roads into a file if live point queries turn out to be unsupported.
- **Power utility:** Fairfax County publishes a Dominion/NOVEC [power service area layer](https://www.fairfaxcounty.gov/gispub1/rest/services/DPWES/StreetLightReporter/MapServer/2). No equivalent for Prince William is confirmed yet. Check Thursday; if none exists, trace the boundary from the State Corporation Commission's [electric service territory map](https://www.scc.virginia.gov/getdoc/74e9eb97-3047-4d46-b63f-b9ded0e11ae0/el-map.pdf), or fall back to asking "Who is on your power bill?"
- **Demo:** two dark streetlights a mile apart route to two different utilities, and the app shows why.

### Federal casework

House offices usually need a signed privacy release before contacting a federal agency for a constituent. The casework letter says so and links the Member's casework page. The app never asks for Social Security numbers, case numbers, or medical details, only a short description.

### Coverage and scaling

Cover every county in your congressional district, since that is your judge's whole territory. The 2.0 answer for the rest of the country: the rules are a simple shared format any county, school club, or volunteer can contribute to.

## Architecture and data

Everything runs in the browser, costs nothing, and needs no paid API. A small free backend is only for the shared map.

| Layer | Choice | Notes |
| --- | --- | --- |
| Frontend | Next.js or plain HTML/JS, deployed free on Vercel | Installable web app so judges open a link |
| Map | Leaflet + OpenStreetMap tiles | Free, no key |
| Photo location | exifr (reads GPS from photo metadata) | Many phones strip GPS on upload; always offer manual pin |
| Address to district | U.S. Census Geocoder, geographies endpoint | Free, no key; returns county, place, and congressional district layers |
| Road owner | VDOT route responsibility layer | Statewide, nightly; nearest segment to the pin |
| Power utility | County or SCC service-territory polygons, point-in-polygon with Turf.js | Fallback: ask the user |
| Member of Congress | unitedstates/congress-legislators dataset (GitHub) | Names, offices, phones, websites; bundle a trimmed JSON |
| Routing rules | Your own JSON file | The original-research core |
| Shared reports | Supabase free tier, or labeled sample data | Only if time allows |

**Risk to check tonight:** call the Census Geocoder from the browser. If it blocks cross-origin requests, add one tiny serverless proxy route. Confirm the congressional district layer returns the current (119th Congress) district.

## Why it wins

The rules judge three things; WhoseJob? has a clear answer for each ([2026 rules](https://www.congressionalappchallenge.us/wp-content/uploads/2026/05/2026-CAC-Rules.pdf)).

| Criterion | How WhoseJob? scores |
| --- | --- |
| Quality of the idea | Solves "who fixes this?", which past road-report winners didn't; ties directly to the Member's casework role |
| Implementation and design | Five clean screens, under a minute end to end, multilingual |
| Coding skill | Automatic jurisdiction detection (road owner, power utility), geocoding pipeline, district lookup, routing engine |

**The demo moment (video, about 20 seconds):** show the survey number first. Then photograph two dark streetlights a mile apart: most people would call the county, but WhoseJob? routes one to Dominion and the other to NOVEC, and shows why. Then switch to a federal case: a delayed passport routes to the Member's district office with a drafted letter.

**Video checklist (1 to 3 minutes, public on YouTube or Vimeo):** names, app name, one-sentence purpose, target audience, tools and languages, live demo. Add a 10-second clip of a real resident describing the problem.

## Build plan

Submit Sunday night; Monday morning is buffer only, since the portal closes at noon.

| Day | Goal | Done when |
| --- | --- | --- |
| Wed night | Confirm every teammate is eligible; scaffold app, deploy, prove the geocoder call | Typed address shows district and Member on a live URL |
| Thu | Road-owner lookup, utility-territory check, issue picker, routing rules for 6+ issues, office card | Full flow works for one county |
| Fri | Report generator, federal casework letter, resident survey, map with labeled sample data | All MVP features work end to end |
| Sat | Polish, Spanish, test with 2 to 3 real residents, record video | Video under 3 minutes, public link |
| Sun | Written answers, AI-use disclosure, submit | Confirmation email received |
| Mon | Buffer only | Nothing new |

**Roles (up to 4 people):**

- **Lead (you):** direct the build, own architecture and deploys, integrate.
- **Research:** write and verify the routing rules; collect resident quotes.
- **Design and copy:** screens, icons, plain-language explanations, translation.
- **Demo and submission:** video, written answers, keep the decisions-and-bugs log for the "technical challenge" question.

Keep the AI-use log as you go: what AI generated, what you designed, changed, and debugged.

## Open questions

- [x] District: VA-08 (Rep. Don Beyer). Cover Arlington County, City of Alexandria, City of Falls Church, and the VA-08 part of Fairfax County.
- [x] Final app name: WhoseJob?
- [x] Next.js (TypeScript) on Vercel
- [x] Languages: English and Spanish
- [x] Map: labeled sample data, plus the user's own reports saved on their device
- [ ] Demo moment: NOVEC doesn't serve VA-08, so it changes to streetlight ownership and road owner across the county line (see [data-sources.md](data-sources.md))
- [ ] Blocking: who is on the team, and is every member enrolled in middle or high school on October 26?
- [ ] Which real resident can you interview for the video?
- [ ] Does Prince William County (or each county in the district) publish Dominion/NOVEC service-area data?
- [ ] Who runs the 10-person survey, and where (school, library, community event)?
