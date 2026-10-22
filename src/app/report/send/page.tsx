"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { TopBar } from "@/components/TopBar";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Icon } from "@/components/Icon";
import { useFlow } from "@/lib/flow/context";
import { useLocale } from "@/lib/i18n/locale";
import { route } from "@/lib/routing/engine";
import { offices, rules } from "@/lib/routing/data";
import { composeReport, mailtoUrl } from "@/lib/report/compose";
import s from "../step.module.css";
import x from "./send.module.css";

const MAX_DESCRIPTION = 500;

export default function SendStep() {
  const { t, locale } = useLocale();
  const flow = useFlow();
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [copied, setCopied] = useState(false);

  // "Not sure" on the pole tag already went to the rule's default; the answer
  // screen only links here once there is an office, so skipPoleTag is safe.
  const result = flow.checks && flow.issue ? route(flow.issue, flow.checks, rules, offices, { skipPoleTag: true }) : null;

  useEffect(() => {
    if (flow.hydrated && (!result || result.kind !== "routed")) router.replace("/report/issue");
  }, [flow.hydrated, result, router]);
  if (!result || result.kind !== "routed" || !flow.checks || !flow.issue) return null;

  const office = offices[result.office];
  const msg = composeReport({ issue: flow.issue, office, checks: flow.checks, address: flow.address, description, locale });
  // Fairfax's own streetlight form arrives pre-filled with the pole; prefer it.
  const formUrl = (flow.issue === "streetlight" && flow.checks.streetlight?.formUrl) || office.formUrl;

  async function copy() {
    try {
      await navigator.clipboard.writeText(`${msg.subject}\n\n${msg.body}`);
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
          <PrimaryButton onClick={copy}>
            <Icon name={copied ? "check" : "copy"} />
            {t("send.copy")}
          </PrimaryButton>
          <p className={x.copied} role="status" aria-live="polite">
            {copied ? t("send.copied") : ""}
          </p>
          {formUrl && (
            <PrimaryButton variant="secondary" href={formUrl}>
              <Icon name="form" />
              {t("send.form")}
            </PrimaryButton>
          )}
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

        <div className={s.footer}>
          <PrimaryButton
            variant="secondary"
            onClick={() => {
              flow.reset();
              router.push("/");
            }}
          >
            {t("send.done")}
          </PrimaryButton>
        </div>
      </main>
    </div>
  );
}
