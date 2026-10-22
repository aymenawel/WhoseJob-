"use client";

// Temporary milestone page (address → district → Member); the real home
// screen replaces it in Task 11.
import { useState } from "react";
import { memberForDistrict } from "@/lib/members";

type Result = { matchedAddress: string; districtId: string | null; locality: { name: string } | null };

export default function Home() {
  const [q, setQ] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function lookUp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
    if (!res.ok) {
      setError("We couldn't find that address. Check the spelling, leave out apartment numbers, or drop a pin.");
      return;
    }
    setResult(await res.json());
  }

  const member = result?.districtId ? memberForDistrict(result.districtId) : null;

  return (
    <main style={{ padding: 16, fontSize: 18 }}>
      <h1>WhoseJob?</h1>
      <form onSubmit={lookUp}>
        <label htmlFor="q">Address</label>
        <input id="q" value={q} onChange={(e) => setQ(e.target.value)} style={{ display: "block", width: "100%", fontSize: 18, padding: 8 }} />
        <button type="submit" style={{ marginTop: 8, fontSize: 18, padding: "8px 16px" }}>Look up</button>
      </form>
      {error && <p role="alert">{error}</p>}
      {result && (
        <p data-testid="milestone-result">
          {result.matchedAddress} · {result.locality?.name ?? "outside VA-08 localities"} · {result.districtId}
          {member ? ` · ${member.name}` : ""}
        </p>
      )}
    </main>
  );
}
