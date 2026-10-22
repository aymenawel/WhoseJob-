"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { TopBar } from "@/components/TopBar";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Icon } from "@/components/Icon";
import { useFlow } from "@/lib/flow/context";
import { readPhotoGps, startReport } from "@/lib/flow/state";
import { useLocale } from "@/lib/i18n/locale";
import s from "../step.module.css";

export default function PhotoStep() {
  const { t } = useLocale();
  const flow = useFlow();
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "reading" | "found" | "none">("idle");

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (flow.photoUrl) URL.revokeObjectURL(flow.photoUrl);
    const photoUrl = URL.createObjectURL(file);
    // A new photo starts a new report: drop the previous spot until we know this one's.
    flow.set(startReport(photoUrl, null));
    setStatus("reading");
    const point = await readPhotoGps(file);
    flow.set(startReport(photoUrl, point));
    setStatus(point ? "found" : "none");
  }

  return (
    <div className={s.screen}>
      <TopBar step={1} />
      <main className={s.body}>
        <h1 className={s.title}>{t("photo.title")}</h1>
        <p className={s.lede}>{t("photo.lede")}</p>

        {flow.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- a local object URL, not an optimizable asset
          <img className={s.photoPreview} src={flow.photoUrl} alt="" />
        ) : (
          <label className={s.cameraButton}>
            <Icon name="camera" size={40} />
            {t("photo.take")}
            <input
              className="sr-only"
              type="file"
              accept="image/*"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
          </label>
        )}

        <p className={s.status} role="status" aria-live="polite" hidden={status === "idle"}>
          {status === "reading" && t("photo.reading")}
          {status === "found" && t("photo.found")}
          {status === "none" && t("photo.noGps")}
        </p>

        <div className={s.footer}>
          {flow.photoUrl ? (
            <PrimaryButton onClick={() => router.push("/report/issue")} disabled={status === "reading"}>
              {t("photo.next")}
            </PrimaryButton>
          ) : (
            <PrimaryButton
              variant="secondary"
              onClick={() => {
                flow.set(startReport(null, null));
                router.push("/report/issue");
              }}
            >
              {t("photo.skip")}
            </PrimaryButton>
          )}
          <p className={s.note}>{t("home.sendNote")}</p>
        </div>
      </main>
    </div>
  );
}
