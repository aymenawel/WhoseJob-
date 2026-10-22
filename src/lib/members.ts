import members from "@/data/members-va.json";

export type Member = {
  district: string;
  name: string;
  party: string;
  website: string;
  dcPhone: string;
  caseworkUrl: string | null;
  districtOffice: { address: string; phone: string } | null;
};

export function memberForDistrict(id: string): Member | null {
  return (members as Member[]).find((m) => m.district === id) ?? null;
}
