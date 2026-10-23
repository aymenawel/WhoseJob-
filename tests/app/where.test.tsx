import { forwardRef, useImperativeHandle } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import WhereStep from "@/app/report/where/page";
import { FlowProvider } from "@/lib/flow/context";
import { LocaleProvider } from "@/lib/i18n/locale";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace: vi.fn(), back: vi.fn() }) }));
vi.mock("next/link", () => ({ default: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props} /> }));
// Leaflet needs a real browser; the page only uses the map's center.
vi.mock("@/components/PinMap", () => ({
  PinMap: forwardRef(function PinMap(_props, ref) {
    useImperativeHandle(ref, () => ({ center: () => ({ lat: 37.54, lon: -77.43 }), flyTo: () => {} }));
    return <div />;
  }),
}));

afterEach(() => {
  cleanup();
  sessionStorage.clear();
  vi.unstubAllGlobals();
  push.mockReset();
});

test("after a successful check, coming back to move the pin finds the button ready again", async () => {
  // Next.js keeps a page's state when you leave and come back (Activity), so the
  // screen must not still say "Checking…" when "Move the point" returns here.
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ district: { id: "VA-04", inCoverage: false } }))));
  render(
    <LocaleProvider>
      <FlowProvider>
        <WhereStep />
      </FlowProvider>
    </LocaleProvider>,
  );
  fireEvent.click(await screen.findByRole("button", { name: "This is the spot" }));
  await waitFor(() => expect(push).toHaveBeenCalledWith("/report/answer"));
  const button = screen.getByRole("button", { name: "This is the spot" });
  expect(button.hasAttribute("disabled")).toBe(false);
});
