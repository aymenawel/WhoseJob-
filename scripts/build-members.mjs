// Builds src/data/members-va.json from the public-domain
// unitedstates/congress-legislators dataset (current House members, VA only).
// Usage: node scripts/build-members.mjs
import { writeFile } from "node:fs/promises";

const BASE = "https://unitedstates.github.io/congress-legislators";
const [legislators, offices] = await Promise.all(
  ["legislators-current.json", "legislators-district-offices.json"].map(async (f) => (await fetch(`${BASE}/${f}`)).json()),
);

// Casework pages aren't in the dataset; checked by hand on the Member's own site.
const CASEWORK = {
  // Checked 2026-10-22 on beyer.house.gov.
  "VA-08": {
    caseworkUrl: "https://beyer.house.gov/constituent-services/casework/",
    privacyFormUrl: "https://beyer.house.gov/uploadedfiles/privacy_release_form_-_general.pdf",
  },
};

const officesById = new Map(offices.map((o) => [o.id.bioguide, o.offices]));

const members = legislators
  .filter((l) => {
    const t = l.terms.at(-1);
    return t.type === "rep" && t.state === "VA";
  })
  .map((l) => {
    const t = l.terms.at(-1);
    // A Member can list several district offices; the first is the main one.
    const o = officesById.get(l.id.bioguide)?.[0];
    const district = `VA-${String(t.district).padStart(2, "0")}`;
    return {
      district,
      name: l.name.official_full,
      party: t.party,
      website: t.url,
      dcPhone: t.phone,
      caseworkUrl: CASEWORK[district]?.caseworkUrl ?? null,
      privacyFormUrl: CASEWORK[district]?.privacyFormUrl ?? null,
      districtOffice: o
        ? { address: [o.address, o.suite, `${o.city}, ${o.state} ${o.zip}`].filter(Boolean).join(", "), phone: o.phone }
        : null,
    };
  })
  .sort((a, b) => a.district.localeCompare(b.district));

await writeFile("src/data/members-va.json", JSON.stringify(members, null, 2) + "\n");
console.log(`wrote ${members.length} members`, members.find((m) => m.district === "VA-08"));
