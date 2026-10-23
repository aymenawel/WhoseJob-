import { afterEach, expect, test, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { AddressSearch } from "@/components/AddressSearch";
import { LocaleProvider } from "@/lib/i18n/locale";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const SUGGESTIONS = [
  { label: "2400 Langston Blvd, Arlington, VA 22201", text: "2400 LANGSTON BLVD, ARLINGTON, VA, 22201", magicKey: "k1" },
  { label: "Langston Blvd, Arlington, VA 22213", text: "LANGSTON BLVD, ARLINGTON, VA, 22213", magicKey: "k2" },
];

function setup() {
  vi.useFakeTimers();
  const suggest = vi.fn(async () => SUGGESTIONS);
  const onPick = vi.fn();
  const onChange = vi.fn();
  function Harness() {
    return (
      <LocaleProvider>
        <AddressSearch id="addr" label="Or type an address" value="" onChange={onChange} onPick={onPick} suggest={suggest} />
      </LocaleProvider>
    );
  }
  render(<Harness />);
  return { suggest, onPick, onChange, input: screen.getByRole("combobox", { name: "Or type an address" }) };
}

async function typeAndWait(input: HTMLElement) {
  fireEvent.change(input, { target: { value: "2400 Langs" } });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(300);
  });
}

test("typing shows matching addresses in a list", async () => {
  const { input, suggest } = setup();
  await typeAndWait(input);
  expect(suggest).toHaveBeenCalledTimes(1);
  expect(input.getAttribute("aria-expanded")).toBe("true");
  expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual(SUGGESTIONS.map((s) => s.label));
});

test("arrow down then Enter picks the highlighted address", async () => {
  const { input, onPick } = setup();
  await typeAndWait(input);
  fireEvent.keyDown(input, { key: "ArrowDown" });
  expect(input.getAttribute("aria-activedescendant")).toBe(screen.getAllByRole("option")[0].id);
  fireEvent.keyDown(input, { key: "Enter" });
  expect(onPick).toHaveBeenCalledWith(SUGGESTIONS[0]);
  expect(input.getAttribute("aria-expanded")).toBe("false");
});

test("tapping an address picks it", async () => {
  const { input, onPick } = setup();
  await typeAndWait(input);
  fireEvent.click(screen.getAllByRole("option")[1]);
  expect(onPick).toHaveBeenCalledWith(SUGGESTIONS[1]);
});

test("Escape closes the list without picking", async () => {
  const { input, onPick } = setup();
  await typeAndWait(input);
  fireEvent.keyDown(input, { key: "Escape" });
  expect(input.getAttribute("aria-expanded")).toBe("false");
  expect(onPick).not.toHaveBeenCalled();
});

test("Enter with nothing highlighted is left to the form (a normal search)", async () => {
  const { input, onPick } = setup();
  await typeAndWait(input);
  const event = new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true });
  input.dispatchEvent(event);
  expect(onPick).not.toHaveBeenCalled();
  expect(event.defaultPrevented).toBe(false);
});
