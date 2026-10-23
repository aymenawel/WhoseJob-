import { afterEach, expect, test } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MapStyleToggle } from "@/components/MapStyleToggle";
import { LocaleProvider } from "@/lib/i18n/locale";
import { readBasemap } from "@/lib/map/basemap";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

test("the Map / Satellite switch shows the current style and changes it", () => {
  render(
    <LocaleProvider>
      <MapStyleToggle />
    </LocaleProvider>,
  );
  expect(screen.getByRole("button", { name: "Map" }).getAttribute("aria-pressed")).toBe("true");
  fireEvent.click(screen.getByRole("button", { name: "Satellite" }));
  expect(readBasemap()).toBe("satellite");
  expect(screen.getByRole("button", { name: "Satellite" }).getAttribute("aria-pressed")).toBe("true");
});
