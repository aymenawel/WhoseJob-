"use client";

import { createContext, useCallback, useContext, useEffect, useReducer, type ReactNode } from "react";
import { flowReducer, initialFlow, type FlowState } from "@/lib/flow/state";

const KEY = "whosejob.flow";

/** `hydrated` turns true only once any saved report has been restored. */
type Ctx = FlowState & { hydrated: boolean; set: (patch: Partial<FlowState>) => void; reset: () => void };
const FlowContext = createContext<Ctx | null>(null);

type Store = { flow: FlowState; hydrated: boolean };
type Action = { type: "patch"; patch: Partial<FlowState> } | { type: "reset" } | { type: "hydrate"; saved: Partial<FlowState> };

function reducer(store: Store, action: Action): Store {
  switch (action.type) {
    case "reset":
      return { ...store, flow: initialFlow };
    // Restore and mark ready in one step, so no screen ever sees "ready" with the old empty state.
    case "hydrate":
      return { flow: flowReducer(store.flow, action.saved), hydrated: true };
    default:
      return { ...store, flow: flowReducer(store.flow, action.patch) };
  }
}

export function FlowProvider({ children }: { children: ReactNode }) {
  const [{ flow, hydrated }, dispatch] = useReducer(reducer, { flow: initialFlow, hydrated: false });

  // Survive a reload mid-report (the photo itself is not kept: it stays in memory only).
  useEffect(() => {
    let saved: Partial<FlowState> = {};
    try {
      const raw = sessionStorage.getItem(KEY);
      if (raw) saved = { ...JSON.parse(raw), photoUrl: null };
    } catch {
      // No storage or bad JSON: start fresh.
    }
    dispatch({ type: "hydrate", saved });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      const { photoUrl: _photo, ...rest } = flow;
      sessionStorage.setItem(KEY, JSON.stringify(rest));
    } catch {
      // Ignore: persistence is a convenience.
    }
  }, [flow, hydrated]);

  const set = useCallback((patch: Partial<FlowState>) => dispatch({ type: "patch", patch }), []);
  const reset = useCallback(() => dispatch({ type: "reset" }), []);

  return <FlowContext.Provider value={{ ...flow, hydrated, set, reset }}>{children}</FlowContext.Provider>;
}

export function useFlow(): Ctx {
  const ctx = useContext(FlowContext);
  if (!ctx) throw new Error("useFlow must be used inside <FlowProvider>");
  return ctx;
}
