"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { TopBar } from "@/components/TopBar";
import { Sign } from "@/components/Sign";
import { NotPlate } from "@/components/NotPlate";
import { RouteMarker } from "@/components/RouteMarker";
import { ActionRail, type RailAction } from "@/components/ActionRail";
import { PrimaryButton } from "@/components/PrimaryButton";
import { PinMap } from "@/components/PinMap";
import { PerReport, useFlow } from "@/lib/flow/context";
import { useLocale } from "@/lib/i18n/locale";
import { route } from "@/lib/routing/engine";
import { offices, rules } from "@/lib/routing/data";
import { composeReport } from "@/lib/report/compose";
import type { Level, LightOwner, LocalityId, RoadOwner } from "@/lib/types";
import s from "./answer.module.css";

const ROAD_LEVEL: Record<RoadOwner, Level | "unknown"> = { state: "state", county: "local", city: "local", private: "unknown", unknown: "unknown" };
const LIGHT_LEVEL: Record<LightOwner, Level | "unknown"> = {
  dominion: "utility", novec: "utility", county: "local", city: "local", private: "unknown", unknown: "unknown",
};
// "No, it doesn't say Dominion" means the locality's own light.
const OWN_LIGHT: Record<LocalityId, LightOwner> = { arlington: "county", fairfax: "county", alexandria: "city", "falls-church": "city" };

function AnswerScreen() {
  const { t, locale } = useLocale();
  const flow = useFlow();
  const router = useRouter();
  const [unsure, setUnsure] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (flow.hydrated && (!flow.checks || !flow.issue)) router.replace("/report/issue");
  }, [flow.hydrated, flow.checks, flow.issue, router]);

  const result = useMemo(
    () => (flow.checks && flow.issue ? route(flow.issue, flow.checks, rules, offices, { skipPoleTag: unsure }) : null),
    [flow.checks, flow.issue, unsure],
  );
  if (!flow.checks || !flow.issue || !result) return null;
  const checks = flow.checks;
  const issue = flow.issue;

  function answerPoleTag(owner: LightOwner) {
    flow.set({ checks: { ...checks, streetlight: { ...(checks.streetlight ?? { distanceM: 0 }), owner } } });
  }

  const office = result.kind === "routed" ? offices[result.office] : null;
  const markers: { key: string; label: string; level: Level | "district" | "unknown"; decided: boolean }[] = [];
  if (checks.district) markers.push({ key: "d", label: checks.district.id, level: "district", decided: result.kind === "routed" && result.decidedBy === "federal" });
  if (checks.road && issue !== "federal") {
    markers.push({ key: "r", label: t(`answer.marker.road.${checks.road.owner}`), level: ROAD_LEVEL[checks.road.owner], decided: result.kind === "routed" && result.decidedBy === "road" });
  }
  if (checks.streetlight && issue === "streetlight") {
    markers.push({ key: "l", label: t(`answer.marker.light.${checks.streetlight.owner}`), level: LIGHT_LEVEL[checks.streetlight.owner], decided: result.kind === "routed" && result.decidedBy === "streetlight" });
  }
  if (checks.locality && result.kind === "routed" && result.decidedBy === "locality") {
    markers.push({ key: "c", label: checks.locality.name, level: "local", decided: true });
  }

  const rail: RailAction[] = [];
  if (office?.phone) rail.push({ id: "call", label: t("action.call"), icon: "call", href: `tel:${office.phone.replace(/[^\d+]/g, "")}` });
  if (office) {
    rail.push({
      id: "copy",
      label: copied ? t("action.copied") : t("action.copy"),
      icon: copied ? "check" : "copy",
      onClick: async () => {
        const msg = composeReport({ issue, office, checks, address: flow.address, description: "", locale });
        try {
          await navigator.clipboard.writeText(`${msg.subject}\n\n${msg.body}`);
          setCopied(true);
        } catch {
          router.push("/report/send");
        }
      },
    });
  }
  rail.push({ id: "map", label: t("action.map"), icon: "map", onClick: () => router.push("/report/where") });

  return (
    <div className={s.screen}>
      <div className={s.media}>
        {flow.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- local object URL
          <img className={s.photo} src={flow.photoUrl} alt="" />
        ) : (
          <PinMap initial={checks.point} zoom={18} label={t("where.title")} interactive={false} />
        )}
        <TopBar step={4} overlay />
        <div className={s.rail}>
          <ActionRail actions={rail} label={t("answer.title")} />
        </div>
        {markers.length > 0 && (
          <div className={`${s.checked} on-dark`}>
            <span className={s.checkedLabel}>{t("answer.checked")}</span>
            <ul className={s.markers}>
              {markers.map((m, i) => (
                <RouteMarker key={m.key} label={m.label} level={m.level} decided={m.decided} decidedLabel={t("answer.decided")} style={{ animationDelay: `${150 + i * 250}ms` }} />
              ))}
            </ul>
          </div>
        )}
      </div>

      <main className={s.answer}>
        <h1 className="sr-only">{t("answer.title")}</h1>

        {result.kind === "routed" && office && (
          <div className={s.land} style={{ animationDelay: `${200 + markers.length * 250}ms` }}>
            <Sign level={result.level} kicker={t(`answer.fixedBy.${result.level}`)} office={office.name[locale]} detail={office.detail?.[locale]} />
            {result.notOffice && <NotPlate office={offices[result.notOffice].name[locale]} note={t("answer.notNote")} />}
            <p className={s.why}>{result.why[locale]}</p>
            {result.verified === null && <p className={s.note}>{t("answer.verifying")}</p>}
            {checks.fallbacks.includes("census") && <p className={s.note}>{t("answer.fallback.census")}</p>}
            {checks.fallbacks.includes("road") && result.decidedBy === "road" && <p className={s.note}>{t("answer.fallback.road")}</p>}
          </div>
        )}

        {result.kind === "ask-pole-tag" && (
          <section className={s.question} aria-labelledby="poletag">
            <h2 id="poletag" className={s.questionTitle}>{t("poletag.title")}</h2>
            <p>{t("poletag.lede")}</p>
            {checks.fallbacks.includes("streetlight") && <p className={s.note}>{t("answer.fallback.streetlight")}</p>}
            <div className={s.choices}>
              <PrimaryButton onClick={() => answerPoleTag("dominion")}>{t("poletag.yes")}</PrimaryButton>
              <PrimaryButton variant="secondary" onClick={() => checks.locality && answerPoleTag(OWN_LIGHT[checks.locality.id])}>
                {t("poletag.no")}
              </PrimaryButton>
              <PrimaryButton variant="secondary" onClick={() => setUnsure(true)}>{t("poletag.unsure")}</PrimaryButton>
            </div>
          </section>
        )}

        {result.kind === "out-of-coverage" && (
          <section className={s.question} aria-labelledby="out">
            <h2 id="out" className={s.questionTitle}>{t("out.title")}</h2>
            <p>{result.districtId ? t("out.lede", { district: result.districtId }) : t("out.ledeUnknown")}</p>
          </section>
        )}

        <div className={s.footer}>
          {result.kind === "routed" && office && <PrimaryButton href="/report/send">{t("answer.report", { office: office.name[locale] })}</PrimaryButton>}
          {result.kind === "out-of-coverage" && <PrimaryButton href="/report/where">{t("out.move")}</PrimaryButton>}
        </div>
      </main>
    </div>
  );
}


export default function AnswerStep() {
  return (
    <PerReport>
      <AnswerScreen />
    </PerReport>
  );
}
