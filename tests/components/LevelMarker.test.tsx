import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { LevelMarker } from "@/components/LevelMarker";

describe("LevelMarker", () => {
  test.each([
    ["local", "Local"],
    ["state", "State"],
    ["utility", "Utility"],
    ["federal", "Federal"],
  ] as const)("%s shows its word, so it reads without color", (level, label) => {
    render(<LevelMarker level={level} label={label} />);
    expect(screen.getByText(label)).toBeTruthy();
  });

  test("each level draws a different shape", () => {
    const shapes = (["local", "state", "utility", "federal"] as const).map((level) => {
      const { container, unmount } = render(<LevelMarker level={level} label={level} />);
      const shape = container.querySelector("[data-shape]")?.getAttribute("data-shape");
      unmount();
      return shape;
    });
    expect(new Set(shapes).size).toBe(4);
  });
});
