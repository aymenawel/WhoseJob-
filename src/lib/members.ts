import members from "@/data/members.json";

export type Member = {
  district: string;
  name: string;
  party: string;
  website: string;
  dcPhone: string;
  caseworkUrl: string | null;
  /** The signed release most House offices need before contacting an agency. */
  privacyFormUrl: string | null;
  districtOffice: { address: string; phone: string } | null;
};

export function memberForDistrict(id: string): Member | null {
  return (members as Member[]).find((m) => m.district === id) ?? null;
}
