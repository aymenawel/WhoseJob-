"use client";

import { useRouter } from "next/navigation";
import { TopBar } from "@/components/TopBar";
import { IssueTile } from "@/components/IssueTile";
import { useFlow } from "@/lib/flow/context";
import { useLocale } from "@/lib/i18n/locale";
import type { IssueId } from "@/lib/types";
import s from "../step.module.css";

const LOCAL_ISSUES: IssueId[] = [
  "streetlight", "pothole", "signal", "sign-traffic", "sign-street-name", "flooding", "trash", "abandoned-car",
];

export default function IssueStep() {
  const { t } = useLocale();
  const flow = useFlow();
  const router = useRouter();

  function pick(issue: IssueId) {
    flow.set({ issue });
    // With checks already in hand (resident came back to change the issue), skip straight to the answer.
    router.push(issue === "federal" ? "/report/federal" : flow.checks ? "/report/answer" : "/report/where");
  }

  return (
    <div className={s.screen}>
      <TopBar step={2} />
      <main className={s.body}>
        <h1 className={s.title}>{t("issue.title")}</h1>
        <div className={s.grid}>
          {LOCAL_ISSUES.map((id) => (
            <IssueTile key={id} icon={id} label={t(`issue.${id}`)} selected={flow.issue === id} onClick={() => pick(id)} />
          ))}
          <IssueTile wide icon="federal" label={t("home.federal")} onClick={() => pick("federal")} />
        </div>
      </main>
    </div>
  );
}
