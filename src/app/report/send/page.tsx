"use client";

import { useRouter } from "next/navigation";
import { startTransition, useEffect, useState } from "react";
import { TopBar } from "@/components/TopBar";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Icon } from "@/components/Icon";
import { PerReport, useFlow } from "@/lib/flow/context";
import { useLocale } from "@/lib/i18n/locale";
import { route } from "@/lib/routing/engine";
import { offices, rules } from "@/lib/routing/data";
import { composeReport, mailtoUrl } from "@/lib/report/compose";
import { reportLink } from "@/lib/report/reportLink";
import { OpenFormLink } from "@/components/OpenFormLink";
import { saveMyReport } from "@/lib/map/myReports";
import s from "../step.module.css";
import x from "./send.module.css";

const MAX_DESCRIPTION = 500;

function SendScreen() {
  const { t, locale } = useLocale();
  const flow = useFlow();
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [copied, setCopied] = useState(false);
  const [added, setAdded] = useState(false);

  // "Not sure" on the pole tag already went to the rule's default; the answer
  // screen only links here once there is an office, so skipPoleTag is safe.
  const result = flow.checks && flow.issue ? route(flow.issue, flow.checks, rules, offices, { skipPoleTag: true }) : null;

  useEffect(() => {
    if (flow.hydrated && (!result || result.kind !== "routed")) router.replace("/report/issue");
  }, [flow.hydrated, result, router]);
  if (!result || result.kind !== "routed" || !flow.checks || !flow.issue) return null;

  const office = offices[result.office];
  const msg = composeReport({ issue: flow.issue, office, checks: flow.checks, address: flow.address, description, locale });
  const link = reportLink(office, flow.issue, flow.checks, flow.address);
  const text = `${msg.subject}\n\n${msg.body}`;

  // Runs as the form link is tapped; the link itself does the opening.
  function copyOnOpen() {
    navigator.clipboard?.writeText(text).then(
      () => setCopied(true),
      () => setCopied(false),
    );
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className={s.screen}>
      <TopBar step={5} />
      <main className={s.body}>
        <h1 className={s.title}>{t("send.title")}</h1>
        <p className={s.lede}>{t("send.lede")}</p>

        <label className={x.label} htmlFor="desc">
          {t("send.descLabel")}
        </label>
        <textarea
          id="desc"
          className={x.textarea}
          rows={3}
          maxLength={MAX_DESCRIPTION}
          placeholder={t("send.descHint")}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <section className={x.preview} aria-labelledby="preview">
          <h2 id="preview" className={x.previewTitle}>
            {t("send.preview")} — {office.name[locale]}
          </h2>
          <p className={x.subject}>{msg.subject}</p>
          <p className={x.body}>{msg.body}</p>
        </section>

        <div className={x.actions}>
          {link.url && (
            <section className={x.next} aria-labelledby="next-step">
              <h2 id="next-step" className={x.nextTitle}>
                {t("send.onTheForm")}
              </h2>
              {link.steps && <p className={x.nextSteps}>{link.steps[locale]}</p>}
              <OpenFormLink
                href={link.url}
                onOpen={copyOnOpen}
                label={
                  link.specific
                    ? t("send.openForm", { office: office.name[locale] })
                    : t("send.openSite", { office: office.name[locale] })
                }
              />
            </section>
          )}
          <PrimaryButton variant={link.url ? "secondary" : "primary"} onClick={copy}>
            <Icon name={copied ? "check" : "copy"} />
            {t("send.copy")}
          </PrimaryButton>
          <p className={x.copied} role="status" aria-live="polite">
            {copied ? t("send.copied") : ""}
          </p>
          {/* Only with a real address: a blank "To" line leaves the resident guessing. */}
          {office.email && (
            <PrimaryButton variant="secondary" href={mailtoUrl(office.email, msg)}>
              <Icon name="mail" />
              {t("send.email")}
            </PrimaryButton>
          )}
          {office.phone && (
            <PrimaryButton variant="secondary" href={`tel:${office.phone.replace(/[^\d+]/g, "")}`}>
              <Icon name="call" />
              {t("send.call", { phone: office.phone })}
            </PrimaryButton>
          )}
        </div>

        <p className={s.note}>{t("send.photoNote")}</p>

        <PrimaryButton
          variant="secondary"
          disabled={added}
          onClick={() => {
            if (!flow.checks || !flow.issue) return;
            // Saved on this device only; there is no shared server.
            saveMyReport({
              id: `mine-${Date.now()}`,
              issue: flow.issue,
              lat: flow.checks.point.lat,
              lon: flow.checks.point.lon,
              office: result.office,
              level: result.level,
              createdAt: new Date().toISOString(),
              sample: false,
              fixed: false,
            });
            setAdded(true);
          }}
        >
          <Icon name={added ? "check" : "map"} />
          {added ? t("map.added") : t("map.add")}
        </PrimaryButton>

        <div className={s.footer}>
          <PrimaryButton
            variant="secondary"
            onClick={() => {
              // One transition: the reset lands only once this screen is hidden, so
              // its "no report here, go back" redirect can't beat the trip home.
              startTransition(() => {
                flow.reset();
                router.push("/");
              });
            }}
          >
            {t("send.done")}
          </PrimaryButton>
        </div>
      </main>
    </div>
  );
}

export default function SendStep() {
  return (
    <PerReport>
      <SendScreen />
    </PerReport>
  );
}
