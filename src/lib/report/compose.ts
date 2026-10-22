import type { Checks, IssueId } from "@/lib/types";
import type { Office } from "@/lib/routing/schema";
import type { Member } from "@/lib/members";
import { t, type Locale } from "@/lib/i18n";

export type CaseworkTopic = "passport" | "va" | "social-security" | "irs" | "immigration" | "other";
type Message = { subject: string; body: string };

function where(checks: Checks, address: string | null) {
  return address ?? `${checks.point.lat.toFixed(5)}, ${checks.point.lon.toFixed(5)}`;
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
  const place = where(input.checks, input.address);
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
  return { subject: t(locale, "report.subject", { issue, where: place }), body: lines.join("\n") };
}

export function mailtoUrl(to: string, msg: Message): string {
  return `mailto:${to}?subject=${encodeURIComponent(msg.subject)}&body=${encodeURIComponent(msg.body)}`;
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
    t(locale, "casework.intro", { topic }),
    t(locale, "casework.details", { description: input.description.trim() }),
    "",
    t(locale, "casework.privacy"),
    "",
    t(locale, "casework.thanks"),
    t(locale, "casework.sign"),
  ];
  return { subject: t(locale, "casework.subject", { topic }), body: lines.join("\n") };
}
