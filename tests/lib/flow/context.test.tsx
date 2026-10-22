import { afterEach, expect, test } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { FlowProvider, useFlow } from "@/lib/flow/context";

afterEach(() => {
  cleanup();
  sessionStorage.clear();
});

const seen: string[] = [];
function Probe() {
  const flow = useFlow();
  seen.push(`${flow.hydrated}:${flow.point ? "point" : "none"}`);
  return <p>{flow.hydrated ? `ready ${flow.point?.lat ?? "none"}` : "loading"}</p>;
}

test("screens never see hydrated=true before the saved pin is restored", async () => {
  sessionStorage.setItem("whosejob.flow", JSON.stringify({ point: { lat: 38.891447, lon: -77.085525 }, issue: "streetlight" }));
  seen.length = 0;
  render(
    <FlowProvider>
      <Probe />
    </FlowProvider>,
  );
  await waitFor(() => expect(screen.getByText("ready 38.891447")).toBeTruthy());
  expect(seen).not.toContain("true:none");
});

test("with nothing saved, the flow still becomes ready", async () => {
  render(
    <FlowProvider>
      <Probe />
    </FlowProvider>,
  );
  await waitFor(() => expect(screen.getByText("ready none")).toBeTruthy());
});
