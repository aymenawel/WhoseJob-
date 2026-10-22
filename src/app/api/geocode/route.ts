import { handleGeocode } from "@/lib/api/geocode";

export function GET(request: Request) {
  return handleGeocode(request);
}
