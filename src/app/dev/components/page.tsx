"use client";

// Temporary component gallery for visual checks; removed in Task 15.
import { Sign } from "@/components/Sign";
import { RouteMarker } from "@/components/RouteMarker";
import { NotPlate } from "@/components/NotPlate";
import { ActionRail } from "@/components/ActionRail";
import { TopBar } from "@/components/TopBar";
import { PrimaryButton } from "@/components/PrimaryButton";
import { LevelMarker } from "@/components/LevelMarker";

export default function Gallery() {
  return (
    <>
      <TopBar step={4} />
      <main style={{ padding: 16, display: "grid", gap: 16 }}>
        <ul style={{ display: "flex", flexWrap: "wrap", gap: 8, listStyle: "none", padding: 0 }}>
          <RouteMarker label="VA-08" level="district" />
          <RouteMarker label="County road" level="local" />
          <RouteMarker label="Dominion pole" level="utility" decided />
          <RouteMarker label="State road" level="state" />
        </ul>
        <Sign level="utility" kicker="Fixed by a utility company" office="Dominion Energy" detail="Streetlight outages" />
        <NotPlate office="Arlington County" note="isn't who fixes this" />
        <Sign level="state" kicker="Fixed by a Virginia state agency" office="VDOT" />
        <Sign level="local" kicker="Fixed by your local government" office="Arlington County" detail="Customer Contact Center" />
        <Sign level="federal" kicker="Handled by your Member of Congress" office="Rep. Don Beyer" />
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <LevelMarker level="local" label="Local" />
          <LevelMarker level="state" label="State" />
          <LevelMarker level="utility" label="Utility" />
          <LevelMarker level="federal" label="Federal" />
        </div>
        <div style={{ background: "#9fb3c4", padding: 16, display: "flex", justifyContent: "flex-end" }}>
          <ActionRail
            label="Actions"
            actions={[
              { id: "call", label: "Call", icon: "call", href: "tel:18663664357" },
              { id: "copy", label: "Copy", icon: "copy", onClick: () => {} },
              { id: "map", label: "Map", icon: "map", onClick: () => {} },
            ]}
          />
        </div>
        <PrimaryButton onClick={() => {}}>Report to Dominion</PrimaryButton>
        <PrimaryButton variant="secondary" onClick={() => {}}>
          Call 1-866-366-4357
        </PrimaryButton>
      </main>
    </>
  );
}
