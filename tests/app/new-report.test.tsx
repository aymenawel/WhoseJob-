import { forwardRef, useEffect, useImperativeHandle } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import SendStep from "@/app/report/send/page";
import WhereStep from "@/app/report/where/page";
import FederalStep from "@/app/report/federal/page";
import { FlowProvider, useFlow } from "@/lib/flow/context";
import { startReport } from "@/lib/flow/state";
import { LocaleProvider } from "@/lib/i18n/locale";
import type { Checks } from "@/lib/types";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }) }));
vi.mock("next/link", () => ({ default: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props} /> }));
vi.mock("@/components/PinMap", () => ({
  PinMap: forwardRef(function PinMap(_props, ref) {
    useImperativeHandle(ref, () => ({ center: () => null, flyTo: () => {} }));
    return <div />;
  }),
}));

afterEach(() => {
  cleanup();
  sessionStorage.clear();
});

const checks: Checks = {
  point: { lat: 38.891372, lon: -77.084805 },
  district: { id: "VA-08", inCoverage: true },
  locality: { id: "arlington", name: "Arlington County" },
  road: { name: "N Uhle ST (PR - Arlington County)", owner: "county", distanceM: 3 },
  streetlight: { owner: "county", poleId: "190MA01SE", distanceM: 0 },
  fallbacks: [],
};

const grabbed: { flow: ReturnType<typeof useFlow> | null } = { flow: null };
function Grab() {
  const flow = useFlow();
  useEffect(() => {
    grabbed.flow = flow;
  });
  return null;
}

/**
 * Next.js keeps a screen's state when the resident leaves it (Activity), so
 * these screens stay mounted here while a new report starts underneath them.
 */
function renderScreen(Screen: () => React.ReactNode) {
  sessionStorage.setItem("whosejob.flow", JSON.stringify({ point: checks.point, issue: "pothole", checks }));
  render(
    <LocaleProvider>
      <FlowProvider>
        <Grab />
        <Screen />
      </FlowProvider>
    </LocaleProvider>,
  );
}

function startAnotherReport() {
  act(() => grabbed.flow!.reset());
  act(() => grabbed.flow!.set(startReport(null, checks.point)));
  act(() => grabbed.flow!.set({ issue: "pothole", checks }));
}

test("send: a new report starts with an empty note and the map button ready", async () => {
  renderScreen(SendStep);
  fireEvent.change(await screen.findByLabelText("Anything to add? (optional)"), { target: { value: "Deep, near the bus stop" } });
  fireEvent.click(screen.getByRole("button", { name: "Add to the community map" }));
  expect(screen.getByRole("button", { name: "Added to the map, on this device only." }).hasAttribute("disabled")).toBe(true);

  startAnotherReport();

  expect((screen.getByLabelText("Anything to add? (optional)") as HTMLTextAreaElement).value).toBe("");
  expect(screen.getByRole("button", { name: "Add to the community map" }).hasAttribute("disabled")).toBe(false);
});

test("where: a new report doesn't show the last report's address search", async () => {
  renderScreen(WhereStep);
  fireEvent.change(await screen.findByLabelText("Or type an address"), { target: { value: "301 King St" } });

  startAnotherReport();

  expect((screen.getByLabelText("Or type an address") as HTMLInputElement).value).toBe("");
});

test("federal: a new report doesn't keep the last casework description", async () => {
  renderScreen(FederalStep);
  fireEvent.click(await screen.findByRole("button", { name: /passport/i }));
  const label = "In a sentence or two, what's going on? Don't include ID or case numbers.";
  fireEvent.change(await screen.findByLabelText(label), { target: { value: "My passport renewal is late" } });

  startAnotherReport();

  expect(screen.queryByDisplayValue("My passport renewal is late")).toBeNull();
});
