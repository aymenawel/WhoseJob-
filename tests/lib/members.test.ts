import { expect, test } from "vitest";
import { memberForDistrict } from "@/lib/members";

test("VA-08 is Rep. Beyer with his Alexandria district office", () => {
  const m = memberForDistrict("VA-08");
  expect(m?.name).toBe("Donald S. Beyer, Jr.");
  expect(m?.districtOffice).toEqual({
    address: "700 N Fairfax St., Suite 510, Alexandria, VA 22314",
    phone: "703-658-5403",
  });
});

test("an unknown district has no Member", () => {
  expect(memberForDistrict("VA-99")).toBeNull();
});
