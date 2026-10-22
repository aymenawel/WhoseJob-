import { describe, expect, test } from "vitest";
import { composeCasework, composeReport, mailtoUrl } from "@/lib/report/compose";
import { offices } from "@/lib/routing/data";
import { memberForDistrict } from "@/lib/members";
import type { Checks } from "@/lib/types";

const checks: Checks = {
  point: { lat: 38.891447, lon: -77.085525 },
  district: { id: "VA-08", inCoverage: true },
  locality: { id: "arlington", name: "Arlington County" },
  road: { name: "Wilson BLVD (PR - Arlington County)", owner: "county", distanceM: 7 },
  streetlight: { owner: "dominion", poleId: "C0918WL6800", distanceM: 0 },
  fallbacks: [],
};

describe("composeReport", () => {
  test("the body has the issue, place, pole, description and signature, in that order", () => {
    const { subject, body } = composeReport({
      issue: "streetlight",
      office: offices.dominion,
      checks,
      address: "2100 Clarendon Blvd, Arlington, VA 22201",
      description: "Dark for three nights.",
      locale: "en",
    });
    expect(subject).toContain("Streetlight out");
    const order = ["Streetlight out", "2100 Clarendon Blvd, Arlington, VA 22201", "Pole C0918WL6800", "Dark for three nights.", "Sent by a resident using WhoseJob?"];
    const positions = order.map((s) => body.indexOf(s));
    expect(positions.every((p) => p >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  test("without an address it names the nearest road and locality, plus coordinates to 5 decimals", () => {
    const { body } = composeReport({ issue: "pothole", office: offices.vdot, checks, address: null, description: "", locale: "en" });
    expect(body).toContain("Near Wilson Blvd, Arlington County (38.89145, -77.08553)");
  });

  test("the subject names the place briefly, without coordinates", () => {
    const { subject } = composeReport({ issue: "streetlight", office: offices.dominion, checks, address: null, description: "", locale: "en" });
    expect(subject).toBe("Streetlight out at Wilson Blvd, Arlington County");
  });

  test("VDOT route codes stay readable", () => {
    const fairfax: Checks = {
      ...checks,
      locality: { id: "fairfax", name: "Fairfax County" },
      road: { name: "VA-244E", owner: "state", distanceM: 4 },
    };
    const { body } = composeReport({ issue: "pothole", office: offices.vdot, checks: fairfax, address: null, description: "", locale: "en" });
    expect(body).toContain("Near VA-244E, Fairfax County (");
  });

  test("Spanish output uses Spanish text", () => {
    const { subject, body } = composeReport({ issue: "streetlight", office: offices.dominion, checks, address: null, description: "", locale: "es" });
    expect(subject).toContain("Luz de la calle apagada");
    expect(body).toContain("Poste C0918WL6800");
  });
});

describe("mailtoUrl", () => {
  test("encodes subject and body so &, ? and newlines survive", () => {
    const msg = { subject: "Pothole & ruts?", body: "Line one\nLine two & three?" };
    const url = mailtoUrl("help@example.gov", msg);
    expect(url.startsWith("mailto:help@example.gov?subject=")).toBe(true);
    const params = new URLSearchParams(url.split("?")[1]);
    expect(decodeURIComponent(url.split("subject=")[1].split("&body=")[0])).toBe(msg.subject);
    expect(params.get("body")).toBe(msg.body);
  });
});

describe("composeCasework", () => {
  const member = memberForDistrict("VA-08")!;

  test("names the Member and district office, the topic and the description, and asks about the privacy release", () => {
    const { subject, body } = composeCasework({ member, topic: "passport", description: "My passport has been pending for 14 weeks.", locale: "en" });
    expect(subject).toContain("passport");
    expect(body).toContain("Donald S. Beyer, Jr.");
    expect(body).toContain("700 N Fairfax St., Suite 510");
    expect(body).toContain("My passport has been pending for 14 weeks.");
    expect(body).toContain("Your office may need my signed privacy release form before contacting the agency");
  });

  test("never asks for an SSN or a case number", () => {
    const { body } = composeCasework({ member, topic: "social-security", description: "My benefits stopped.", locale: "en" });
    expect(body).not.toMatch(/social security number|case number|SSN/i);
  });

  test("no description yet → no empty 'What's going on' line", () => {
    const { body } = composeCasework({ member, topic: "passport", description: "  ", locale: "en" });
    expect(body).not.toContain("What's going on");
  });

  test("Spanish casework letter", () => {
    const { body } = composeCasework({ member, topic: "va", description: "Mi reclamo está atrasado.", locale: "es" });
    expect(body).toContain("formulario de autorización de privacidad");
  });
});
