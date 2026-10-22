# Prompt for Claude Code: build WhoseJob?

You are helping our team build **WhoseJob?**, our entry for the 2026 Congressional App Challenge. Submission closes at **noon EDT on Monday, October 26, 2026**, so plan for a finished, polished app by Sunday.

## 1. Read the knowledge base first

Before you plan or write anything, read every file in this folder:

- `README.md`: overview
- `docs/vision.md`: the product vision. It is the source of truth for the idea, features, screens, routing rules, jurisdiction detection, architecture, demo moment, and build plan.
- `docs/competition-notes.md`: the rules, judging criteria, AI-use policy, and submission checklist.

Then summarize back to me, in a few lines, what you understood the app to be and what the judges score. If anything in the docs conflicts or is unclear, ask.

## 2. Ask before you build

Ask me your questions before writing code, one short batch at a time. At minimum, confirm:

- Which congressional district we're entering, and which counties it covers
- Next.js or plain HTML/JS (default to Next.js on Vercel if I don't care)
- Second language besides Spanish
- Shared community map with a free backend, or labeled sample data only

Don't guess on anything that would be expensive to redo.

## 3. Use the superpowers plugin whenever it helps

Use the superpowers skills as your working method, not as decoration:

- **Brainstorming** before any feature, screen, or design decision. Explore options, then recommend one.
- **Writing plans** once the brainstorm settles, so the build is a sequence of small, checkable steps.
- **Executing plans** and **subagent-driven development** for the build itself.
- **Test-driven development** for the logic that must be right: geocoding, jurisdiction detection, and the routing engine.
- **Systematic debugging** whenever something breaks.
- **Verification before completion**: never tell me something works until you've run it and seen it work.

## 4. Brainstorm the data sources, then verify them

The app is only as good as its data. Use the superpowers brainstorming skill to find and choose free sources for each need, then **actually test each one** (call it, inspect the response, confirm the fields) before building on it. Starting points from the vision doc:

- Address to congressional district: U.S. Census Geocoder (free, no key). Confirm it returns the 119th Congress district and whether the browser can call it directly or needs a small proxy route.
- Road owner: VDOT's statewide route responsibility layer (ArcGIS). Confirm point or nearby-segment queries work; if not, pre-download our district's roads.
- Power utility (Dominion vs NOVEC): find free service-territory boundaries for our counties. Fairfax County publishes one; Prince William is unconfirmed. If none exist, use the fallback in the vision doc.
- Member of Congress: the unitedstates/congress-legislators dataset on GitHub.
- Office contacts for the routing rules: official county, VDOT, and utility pages only.

Look for better or additional free sources than these. For each one, record in `docs/data-sources.md`: what it provides, its URL, how you tested it, its limits, and its fallback.

## 5. The visual experience matters most

You can handle the technical side. What decides this competition is how the app **looks and feels** in a 3-minute video and in a judge's hands. Spend real thinking here. Brainstorm several visual directions before choosing one, explain the trade-offs, and show me before building it out.

Use these design skills on every screen, so the result looks intentionally designed and never like generic AI output:

- **taste**
- **impeccable**
- **ui-ux-pro-max**

If any of these skills isn't installed, tell me instead of skipping it silently.

What the experience should achieve:

- **The routing moment is the hero.** When the app figures out who fixes the problem, make it feel like an answer clicking into place: the pin, the layers it checked (district, road owner, utility), and the office it landed on. A judge should *see* the app thinking, not just read a result.
- **The "why" is visual.** Show why this office and not the obvious one: for example "Dominion, not the county," with the reason in one line.
- **Levels of government are instantly readable.** Give local, state, utility, and federal a consistent visual language (color, icon, label) that holds across cards, the map, and the report.
- **The map feels alive**, with clear clusters ("4 neighbors reported this"). Clearly label sample data as sample data.
- **Trustworthy and civic, not corporate or gimmicky.** It should look credible enough for a congressional office to share.
- **Accessible for everyone**, including older residents and people reading in a second language: large tap targets, icons paired with words, plain language, strong contrast, and a working language toggle.
- **Mobile-first.** Most reports start on a phone, and the demo video will likely be filmed on one.
- Learn from GOV.UK's "one thing per page" pattern, the U.S. Web Design System, and how Waze, Uber's pickup pin, and Google Maps place cards work. Don't copy anyone's branding.

## 6. Organization

Keep the project clean enough that a judge opening the source code is impressed:

- A clear folder structure: app and screens, components, lib (geocoding, jurisdiction, routing), data (routing rules JSON, member data, boundaries), tests, and docs.
- Routing rules live in one readable JSON file keyed by county, then issue type. Our team will research and edit it ourselves.
- Small, well-named modules with short comments explaining *why*, not *what*.
- A `README.md` that explains how to run it, how it works, and which data sources it uses.
- Commit in small, meaningful steps with clear messages.

## 7. It must cost nothing

- Free hosting (Vercel hobby tier or similar), free and open data, and open-source libraries only.
- No paid APIs, no API keys that bill, no trial accounts that expire before judging.
- If you're about to add anything that could ever cost money, stop and ask me first.

## 8. Competition rules you must respect

- The app must show real, working functionality.
- **Keep an AI-use log** in `docs/ai-use-log.md` as you work: what you generated, what I designed or decided, and what we changed or debugged together. The rules require full disclosure of AI use, so this log must be accurate and complete.
- Keep a short `docs/dev-log.md` of decisions and real technical problems we hit and how we solved them. It answers the submission question about technical challenges.
- Explain the important parts of the code to me as you build them. Judges may ask our team to walk through the source, and we need to understand it.
- Never collect sensitive personal data. The federal casework flow asks only for a short description, never Social Security numbers or case numbers.
- The app never sends reports on its own; the user sends them.

## 9. Order of work

1. Read the docs and summarize them back to me.
2. Ask your questions.
3. Brainstorm and verify data sources, and write `docs/data-sources.md`.
4. Brainstorm visual directions and show me options.
5. Write the implementation plan.
6. Build the core pipeline first (address to district to Member to routed office) and get it live on a free URL.
7. Build the screens with the design skills, then the map and stretch features as time allows.
8. Verify everything end to end on a phone-sized screen before calling anything done.
