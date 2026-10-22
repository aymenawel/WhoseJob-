import type { Checks, IssueId, Localized } from "@/lib/types";
import type { Office } from "@/lib/routing/schema";
import { prettyRoad } from "@/lib/report/compose";

export type ReportLink = {
  url: string | null;
  /** True when the link opens this exact problem's form, not just the office's site. */
  specific: boolean;
  steps: Localized | null;
};

/** What to put in a form's location box: the typed address, else "<road>, <locality>". */
function placeOf(checks: Checks, address: string | null): string | null {
  if (address) return address;
  if (checks.road && checks.locality) return `${prettyRoad(checks.road.name)}, ${checks.locality.name}`;
  return null;
}

/**
 * Picks the deepest link we know for this office and problem, so the resident
 * lands on the right form instead of an office's A–Z index.
 */
export function reportLink(office: Office, issue: IssueId, checks: Checks, address: string | null): ReportLink {
  // Fairfax hands back a form already filled with the pole and address.
  if (issue === "streetlight" && checks.streetlight?.formUrl) return { url: checks.streetlight.formUrl, specific: true, steps: null };

  const form = office.forms?.[issue];
  if (!form) return { url: office.formUrl, specific: false, steps: null };

  const place = placeOf(checks, address);
  const u = new URL(form.url.replace("{place}", "__PLACE__"));
  for (const [k, v] of [...u.searchParams]) {
    if (v !== "__PLACE__") continue;
    if (place) u.searchParams.set(k, place);
    else u.searchParams.delete(k);
  }
  // URLSearchParams writes spaces as "+"; some 311 portals only decode %20.
  return { url: u.toString().replace(/\+/g, "%20"), specific: true, steps: form.steps };
}
