import { handleResolve } from "@/lib/api/resolve";

export function GET(request: Request) {
  return handleResolve(request);
}
