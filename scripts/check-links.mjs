// Opens every report link in src/data/offices.json and fails if one is broken
// or now dumps people on a home page instead of the form we promised.
// Usage: npm run check:links   (also runs weekly on GitHub)
import { readFile } from "node:fs/promises";

const offices = JSON.parse(await readFile(new URL("../src/data/offices.json", import.meta.url), "utf8"));

const links = [];
for (const [id, office] of Object.entries(offices)) {
  if (office.formUrl) links.push({ where: `${id}.formUrl`, url: office.formUrl, specific: false });
  for (const [issue, form] of Object.entries(office.forms ?? {})) {
    // Same rule as the app: an unfilled {place} parameter is left out.
    const u = new URL(form.url.replace("{place}", "__PLACE__"));
    for (const [k, v] of [...u.searchParams]) if (v === "__PLACE__") u.searchParams.delete(k);
    links.push({ where: `${id}.forms.${issue}`, url: u.toString(), specific: true });
  }
}

// Check each distinct URL once, a few at a time, politely.
const unique = [...new Map(links.map((l) => [l.url, l])).values()];
const results = new Map();
async function check(url) {
  try {
    const res = await fetch(url, { redirect: "follow", headers: { "user-agent": "WhoseJob link check (student project)" } });
    const final = new URL(res.url);
    const asked = new URL(url);
    // A specific link that lands on the site's front page has lost its target.
    const fellToHome = asked.pathname !== "/" && (final.pathname === "/" || final.pathname === "");
    return { ok: res.ok && !fellToHome, status: res.status, final: res.url, fellToHome };
  } catch (e) {
    return { ok: false, status: 0, final: "", error: e.message };
  }
}
for (let i = 0; i < unique.length; i += 4) {
  await Promise.all(unique.slice(i, i + 4).map(async (l) => results.set(l.url, await check(l.url))));
}

let failed = 0;
for (const l of links) {
  const r = results.get(l.url);
  if (!r.ok) failed++;
  console.log(`${r.ok ? "ok  " : "FAIL"} ${l.where}  ${r.status}${r.fellToHome ? " (redirected to home page)" : ""}${r.error ? ` (${r.error})` : ""}  ${l.url}`);
}
console.log(`\n${links.length - failed}/${links.length} links ok`);
process.exit(failed ? 1 : 0);
