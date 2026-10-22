# Editing the routing rules

The app's knowledge of "who fixes what" lives in two files you can edit without touching code:

- `src/data/offices.json`: every office the app can send someone to, with its phone, online form, and level of government.
- `src/data/routing-rules.json`: for each place (Arlington, Alexandria, Falls Church, Fairfax) and each problem type, which office handles it and why.

## How a rule works

```json
"pothole": {
  "decidedBy": "road",
  "byValue": { "county": "arlington-311", "state": "vdot" },
  "default": "arlington-311",
  "notOffice": { "state": "arlington-311" },
  "why": {
    "county": { "en": "Arlington maintains its own streets…", "es": "Arlington mantiene sus propias calles…" },
    "state":  { "en": "This is a state road, so VDOT maintains it…", "es": "…" },
    "default": { "en": "We couldn't tell who owns this road…", "es": "…" }
  },
  "source": "https://www.arlingtonva.us/…/Street-Maintenance",
  "verified": "2026-10-21"
}
```

**`decidedBy`:** which map check picks the office.

| Value | What the app checks |
| --- | --- |
| `road` | Who maintains the road the pin is on (VDOT data): `state`, `county`, `city`, `private`. |
| `streetlight` | Who owns the nearest streetlight: `dominion`, `county`, `city`, `private`, `novec`. |
| `locality` | Nothing to check; always the `default` office. |

**`byValue`:** for each answer the check can give, the office id to send people to.

**`default`:** the office used when the check finds nothing, or gives an answer not listed in `byValue`.

**`notOffice`** (optional): the office people would wrongly guess. It is shown crossed out ("~~Arlington County~~ not the county"). It is keyed the same way as `byValue`.

**`why`:** one plain sentence in English (`en`) and Spanish (`es`) for every key in `byValue`, plus `default`.

**`source`:** the official page you got the fact from.

**`verified`:** the date someone on the team confirmed the rule on that page, or `null`. The app shows "This rule is being verified" for `null` rules.

## Checking your edit

Run `npm test`. If anything is wrong, the test names the exact spot. For example, `localities.arlington.pothole.why.county.es: missing or empty text` means the Spanish reason is missing. The app won't build with a broken rules file, so a typo can't reach residents.

## Adding an office

Add an entry to `offices.json` with a new id, then use that id in a rule. Only copy phone numbers and links from the office's own website, and put that page in `source`.
