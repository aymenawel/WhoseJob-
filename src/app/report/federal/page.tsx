"use client";

import { useState } from "react";
import { TopBar } from "@/components/TopBar";
import { Sign } from "@/components/Sign";
import { IssueTile } from "@/components/IssueTile";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Icon, type IconName } from "@/components/Icon";
import { PerReport, useFlow } from "@/lib/flow/context";
import { useLocale } from "@/lib/i18n/locale";
import { findAddress } from "@/lib/api/findAddress";
import { memberForDistrict } from "@/lib/members";
import { composeCasework, type CaseworkTopic } from "@/lib/report/compose";
import s from "../step.module.css";
import x from "../send/send.module.css";

const TOPICS: { id: CaseworkTopic; icon: IconName }[] = [
  { id: "passport", icon: "form" },
  { id: "va", icon: "federal" },
  { id: "social-security", icon: "form" },
  { id: "irs", icon: "form" },
  { id: "immigration", icon: "form" },
  { id: "other", icon: "federal" },
];

const MAX_DESCRIPTION = 500;

function FederalScreen() {
  const { t, locale } = useLocale();
  const flow = useFlow();
  const [topic, setTopic] = useState<CaseworkTopic | null>(null);
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [districtId, setDistrictId] = useState<string | null>(null);
  const [lookupError, setLookupError] = useState<"not-found" | "unavailable" | null>(null);
  const [copied, setCopied] = useState(false);

  // A district already found in the report flow is reused; otherwise ask for a home address.
  const district = districtId ?? flow.checks?.district?.id ?? null;
  const member = district ? memberForDistrict(district) : null;
  const inVa08 = district === "VA-08";

  async function findDistrict(e: React.FormEvent) {
    e.preventDefault();
    setLookupError(null);
    const found = await findAddress(address);
    if ("error" in found) {
      setLookupError(found.error);
      return;
    }
    setDistrictId(found.hit.districtId);
  }

  const letter = member && topic ? composeCasework({ member, topic, description, locale }) : null;
  const phone = member?.districtOffice?.phone ?? member?.dcPhone;

  return (
    <div className={s.screen}>
      <TopBar />
      <main className={s.body}>
        <h1 className={s.title}>{t("federal.title")}</h1>
        <p className={s.lede}>{t("federal.lede")}</p>

        <h2 className={x.label}>{t("federal.topic")}</h2>
        <div className={s.grid}>
          {TOPICS.map((tp) => (
            <IssueTile key={tp.id} icon={tp.icon} label={t(`federal.tile.${tp.id}`)} selected={topic === tp.id} onClick={() => setTopic(tp.id)} />
          ))}
        </div>

        {!district && (
          <form onSubmit={findDistrict} className={x.actions}>
            <label className={x.label} htmlFor="home">
              {t("federal.addressLabel")}
            </label>
            <input id="home" className={x.textarea} style={{ minHeight: 52 }} value={address} onChange={(e) => setAddress(e.target.value)} autoComplete="street-address" />
            {lookupError && (
              <p role="alert" className={s.status}>
                {t(lookupError === "not-found" ? "federal.notFound" : "federal.unavailable")}
              </p>
            )}
            <PrimaryButton type="submit" variant="secondary">
              <Icon name="search" />
              {t("where.find")}
            </PrimaryButton>
          </form>
        )}

        {district && !inVa08 && (
          <p className={s.status} role="status">
            {member ? (
              t("federal.outside", { name: member.name })
            ) : (
              <>
                {t("federal.noMember")} <a href="https://www.house.gov/representatives/find-your-representative">{t("federal.findRep")}</a>
              </>
            )}
          </p>
        )}

        {member && (
          <>
            <Sign level="federal" kicker={t("answer.fixedBy.federal")} office={`Rep. ${member.name}`} detail={member.districtOffice?.address} />

            <label className={x.label} htmlFor="desc">
              {t("federal.descLabel")}
            </label>
            <textarea id="desc" className={x.textarea} rows={3} maxLength={MAX_DESCRIPTION} value={description} onChange={(e) => setDescription(e.target.value)} />

            <p className={s.note}>{t("federal.privacy")}</p>

            {letter && (
              <section className={x.preview} aria-labelledby="letter">
                <h2 id="letter" className={x.previewTitle}>
                  {t("federal.letter")}
                </h2>
                <p className={x.subject}>{letter.subject}</p>
                <p className={x.body}>{letter.body}</p>
              </section>
            )}

            <div className={x.actions}>
              {letter && (
                <PrimaryButton
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(`${letter.subject}\n\n${letter.body}`);
                      setCopied(true);
                    } catch {
                      setCopied(false);
                    }
                  }}
                >
                  <Icon name={copied ? "check" : "copy"} />
                  {t("federal.copy")}
                </PrimaryButton>
              )}
              <p className={x.copied} role="status" aria-live="polite">
                {copied ? t("send.copied") : ""}
              </p>
              {phone && (
                <PrimaryButton variant="secondary" href={`tel:${phone.replace(/[^\d+]/g, "")}`}>
                  <Icon name="call" />
                  {t("send.call", { phone })}
                </PrimaryButton>
              )}
              {member.privacyFormUrl && (
                <PrimaryButton variant="secondary" href={member.privacyFormUrl}>
                  <Icon name="form" />
                  {t("federal.privacyForm")}
                </PrimaryButton>
              )}
              <PrimaryButton variant="secondary" href={member.caseworkUrl ?? member.website}>
                <Icon name="federal" />
                {t(member.caseworkUrl ? "federal.website" : "federal.homepage")}
              </PrimaryButton>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default function FederalStep() {
  return (
    <PerReport>
      <FederalScreen />
    </PerReport>
  );
}
