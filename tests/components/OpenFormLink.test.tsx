import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { OpenFormLink } from "@/components/OpenFormLink";

afterEach(cleanup);

test("the form opens through a real link, which browsers don't block as a pop-up", () => {
  render(<OpenFormLink href="https://alex311.alexandriava.gov/customer/s/" label="Copy report & open the pothole form" onOpen={() => {}} />);
  const link = screen.getByRole("link", { name: /open the pothole form/ });
  expect(link.getAttribute("href")).toBe("https://alex311.alexandriava.gov/customer/s/");
  expect(link.getAttribute("target")).toBe("_blank");
  expect(link.getAttribute("rel")).toContain("noopener");
});

test("tapping it also copies the report, without stopping the link from opening", () => {
  const onOpen = vi.fn();
  render(<OpenFormLink href="https://example.gov/form" label="Open" onOpen={onOpen} />);
  const link = screen.getByRole("link", { name: "Open" });
  const event = new MouseEvent("click", { bubbles: true, cancelable: true });
  fireEvent(link, event);
  expect(onOpen).toHaveBeenCalledOnce();
  expect(event.defaultPrevented).toBe(false);
});
