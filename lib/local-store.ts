import { initialState } from "@/lib/study-data";
import type { StudyState } from "@/lib/types";

const STORAGE_KEY = "aprova-ai-state";

export function loadLocalState(): StudyState {
  if (typeof window === "undefined") return initialState();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState();
    return { ...initialState(), ...JSON.parse(raw) } as StudyState;
  } catch {
    return initialState();
  }
}

export function saveLocalState(state: StudyState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
