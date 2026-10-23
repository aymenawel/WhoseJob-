"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { TopBar } from "@/components/TopBar";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Icon } from "@/components/Icon";
import { PinMap, type PinMapHandle } from "@/components/PinMap";
import { PerReport, useFlow } from "@/lib/flow/context";
import { useLocale } from "@/lib/i18n/locale";
import { findAddress as geocode } from "@/lib/api/findAddress";
import type { Checks } from "@/lib/types";
import s from "./where.module.css";

// Roughly the middle of VA-08, zoomed out enough to show the district.
const DISTRICT_CENTER = { lat: 38.84, lon: -77.1 };

function WhereScreen() {
  const { t } = useLocale();
  const flow = useFlow();
  const router = useRouter();
  const map = useRef<PinMapHandle>(null);
  // Where a typed address put the pin; the address only describes the spot if the pin stays near it.
  const addressAt = useRef<{ lat: number; lon: number } | null>(null);
  const [q, setQ] = useState(flow.address ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  async function findAddress(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setMessage(null);
    const found = await geocode(q);
    if ("error" in found) {
      setMessage(t(found.error === "not-found" ? "where.notFound" : "where.unavailable"));
      return;
    }
    const { hit } = found;
    flow.set({ address: hit.matchedAddress });
    addressAt.current = { lat: hit.lat, lon: hit.lon };
    map.current?.flyTo(addressAt.current);
  }

  function useMyLocation() {
    setMessage(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => map.current?.flyTo({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => setMessage(t("where.locationDenied")),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function confirm() {
    const point = map.current?.center();
    if (!point) return;
    setChecking(true);
    setMessage(null);
    const a = addressAt.current;
    // ~50 m: moved further than that, the pin is somewhere else on the street.
    const nearAddress = a !== null && Math.abs(a.lat - point.lat) < 0.0005 && Math.abs(a.lon - point.lon) < 0.0005;
    try {
      const res = await fetch(`/api/resolve?lat=${point.lat}&lon=${point.lon}`);
      if (!res.ok) throw new Error(String(res.status));
      const checks = (await res.json()) as Checks;
      flow.set({ point, checks, address: nearAddress ? flow.address : null });
      router.push("/report/answer");
    } catch {
      setMessage(t("where.error"));
    } finally {
      // Next.js keeps this screen's state when the resident leaves and comes
      // back (e.g. "Move the point"), so the button must not stay on "Checking…".
      setChecking(false);
    }
  }

  return (
    <div className={s.screen}>
      <TopBar step={3} />
      <div className={s.head}>
        <h1 className={s.title}>{t("where.title")}</h1>
        <p className={s.lede}>{t("where.lede")}</p>
        <form className={s.search} onSubmit={findAddress}>
          <label htmlFor="addr" className="sr-only">
            {t("where.addressLabel")}
          </label>
          <input
            id="addr"
            className={s.input}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("where.addressLabel")}
            autoComplete="street-address"
            enterKeyHint="search"
          />
          <button type="submit" className={s.find}>
            <Icon name="search" />
            <span>{t("where.find")}</span>
          </button>
        </form>
        {message && (
          <p className={s.message} role="alert">
            {message}
          </p>
        )}
      </div>

      {/* Wait for a saved pin to be restored: the map reads its starting point once. */}
      {flow.hydrated ? (
        <PinMap ref={map} initial={flow.point ?? DISTRICT_CENTER} zoom={flow.point ? 18 : 12} label={t("where.lede")} />
      ) : (
        <div className={s.mapPlaceholder} />
      )}

      <div className={s.foot}>
        <button type="button" className={s.locate} onClick={useMyLocation}>
          <Icon name="locate" />
          {t("where.useLocation")}
        </button>
        <PrimaryButton onClick={confirm} disabled={checking}>
          {checking ? t("where.checking") : t("where.confirm")}
        </PrimaryButton>
      </div>
    </div>
  );
}

export default function WhereStep() {
  return (
    <PerReport>
      <WhereScreen />
    </PerReport>
  );
}
