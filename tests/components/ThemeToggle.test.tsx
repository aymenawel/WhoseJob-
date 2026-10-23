import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LocaleProvider } from "@/lib/i18n/locale";
import { readTheme } from "@/lib/theme";

function phonePrefers(scheme: "light" | "dark") {
  vi.stubGlobal("matchMedia", (q: string) => ({
    matches: q.includes(scheme),
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

beforeEach(() => phonePrefers("dark"));
afterEach(() => {
  cleanup();
  localStorage.clear();
  delete document.documentElement.dataset.theme;
  vi.unstubAllGlobals();
});

function renderToggle() {
  render(
    <LocaleProvider>
      <ThemeToggle />
    </LocaleProvider>,
  );
}

test("with no choice saved, the app is light, even on a phone set to dark", () => {
  phonePrefers("dark");
  expect(readTheme()).toBe("light");
});

test("tapping the switch picks dark, and the choice is remembered", () => {
  renderToggle();
  fireEvent.click(screen.getByRole("button", { name: "Switch to dark mode" }));
  expect(document.documentElement.dataset.theme).toBe("dark");
  expect(localStorage.getItem("whosejob.theme")).toBe("dark");
  expect(readTheme()).toBe("dark");

  fireEvent.click(screen.getByRole("button", { name: "Switch to light mode" }));
  expect(document.documentElement.dataset.theme).toBe("light");
  expect(readTheme()).toBe("light");
});

test("a saved choice wins over the phone's setting", () => {
  localStorage.setItem("whosejob.theme", "dark");
  phonePrefers("light");
  expect(readTheme()).toBe("dark");
});
