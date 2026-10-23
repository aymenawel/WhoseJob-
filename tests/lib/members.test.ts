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

test("VA-08 links to Rep. Beyer's casework page and his privacy release form", () => {
  const m = memberForDistrict("VA-08");
  expect(m?.caseworkUrl).toBe("https://beyer.house.gov/constituent-services/casework/");
  expect(m?.privacyFormUrl).toBe("https://beyer.house.gov/uploadedfiles/privacy_release_form_-_general.pdf");
});

test("an address outside Virginia still finds its Member: Maryland's 8th, DC's delegate, an at-large state", () => {
  expect(memberForDistrict("MD-08")?.name).toBeTruthy();
  expect(memberForDistrict("DC-98")?.name).toBeTruthy();
  expect(memberForDistrict("WY-00")?.name).toBeTruthy();
});
