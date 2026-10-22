import { afterEach, expect, test } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { RouteMarker } from "@/components/RouteMarker";

afterEach(cleanup);

test("the deciding marker says so to screen readers in the reader's language", () => {
  render(
    <ul>
      <RouteMarker label="Poste de Dominion" level="utility" decided decidedLabel="decidió la respuesta" />
    </ul>,
  );
  expect(screen.getByText(/decidió la respuesta/)).toBeTruthy();
  expect(screen.queryByText(/decided the answer/)).toBeNull();
});
