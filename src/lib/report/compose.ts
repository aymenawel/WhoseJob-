import type { Checks, IssueId } from "@/lib/types";
import type { Office } from "@/lib/routing/schema";
import type { Member } from "@/lib/members";
import { t, type Locale } from "@/lib/i18n";

export type CaseworkTopic = "passport" | "va" | "social-security" | "irs" | "immigration" | "other";
type Message = { subject: string; body: string };

/** "Wilson BLVD (PR - Arlington County)" → "Wilson Blvd"; route codes like "VA-244E" stay as they are. */
export function prettyRoad(name: string): string {
  return name
    .replace(/\s*\(.*\)\s*$/, "")
    .split(" ")
    .map((w) => (/^[A-Z]{2,}$/.test(w) ? w[0] + w.slice(1).toLowerCase() : w))
    .join(" ");
}

function where(checks: Checks, address: string | null, locale: Locale) {
  if (address) return address;
  const coords = `${checks.point.lat.toFixed(5)}, ${checks.point.lon.toFixed(5)}`;
  const locality = checks.locality?.name;
  if (!locality) return coords;
  // Offices read "near Wilson Blvd" faster than a pair of coordinates.
  return checks.road
    ? t(locale, "report.near", { road: prettyRoad(checks.road.name), locality, coords })
    : t(locale, "report.in", { locality, coords });
}

/** Short place for a subject line: the address, or the road and locality, never coordinates if avoidable. */
function shortPlace(checks: Checks, address: string | null) {
  if (address) return address;
  const parts = [checks.road && prettyRoad(checks.road.name), checks.locality?.name].filter(Boolean);
  return parts.length ? parts.join(", ") : `${checks.point.lat.toFixed(5)}, ${checks.point.lon.toFixed(5)}`;
}

export function composeReport(input: {
  issue: IssueId;
  office: Office;
  checks: Checks;
  address: string | null;
  description: string;
  locale: Locale;
}): Message {
  const { locale } = input;
  const issue = t(locale, `issue.${input.issue}`);
  const place = where(input.checks, input.address, locale);
  const pole = input.checks.streetlight?.poleId;
  const description = input.description.trim();

  const lines = [
    t(locale, "report.greeting", { office: input.office.name[locale] }),
    "",
    t(locale, "report.intro", { issue }),
    t(locale, "report.location", { where: place }),
    ...(pole ? [t(locale, "report.pole", { id: pole })] : []),
    ...(description ? [t(locale, "report.details", { description })] : []),
    "",
    t(locale, "report.signature"),
  ];
  return { subject: t(locale, "report.subject", { issue, where: shortPlace(input.checks, input.address) }), body: lines.join("\n") };
}

/** With no known address, the draft opens with an empty "To" for the resident to fill. */
export function mailtoUrl(to: string | null, msg: Message): string {
  return `mailto:${to ?? ""}?subject=${encodeURIComponent(msg.subject)}&body=${encodeURIComponent(msg.body)}`;
}

// Deliberately asks only for a description: no SSN, case number or medical
// details ever enter the letter (see PRODUCT.md, Capabilities and Constraints).
export function composeCasework(input: { member: Member; topic: CaseworkTopic; description: string; locale: Locale }): Message {
  const { locale, member } = input;
  const topic = t(locale, `topic.${input.topic}`);
  const lines = [
    t(locale, "casework.greeting", { name: member.name }),
    ...(member.districtOffice ? [t(locale, "casework.office", { office: member.districtOffice.address })] : []),
    "",
    t(locale, "casework.intro", { topic, district: member.district }),
    ...(input.description.trim() ? [t(locale, "casework.details", { description: input.description.trim() })] : []),
    "",
    t(locale, "casework.privacy"),
    "",
    t(locale, "casework.thanks"),
    t(locale, "casework.sign"),
  ];
  return { subject: t(locale, "casework.subject", { topic }), body: lines.join("\n") };
}
