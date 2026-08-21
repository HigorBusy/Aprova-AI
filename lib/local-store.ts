import { defaultTasks, defaultTopics, initialState } from "@/lib/study-data";
import type { ProfileKind, StudyState, TopicStatus } from "@/lib/types";

const STORAGE_KEY = "aprova-ai-state";

export function loadLocalState(): StudyState {
  if (typeof window === "undefined") return initialState();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState();
    return migrateLocalState({ ...initialState(), ...JSON.parse(raw) } as StudyState);
  } catch {
    return initialState();
  }
}

export function saveLocalState(state: StudyState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function migrateLocalState(state: StudyState): StudyState {
  const taskStatus = new Map(state.tasks.map((task) => [task.id, task.done]));
  const topicStatus = new Map(state.topics.map((topic) => [topic.id, normalizeTopicStatus(topic.status)]));

  return {
    ...state,
    name: state.name === "Estudante" ? "Candidato" : state.name,
    profileKind: normalizeProfileKind(state.profileKind),
    tasks: defaultTasks.map((task) => ({ ...task, done: taskStatus.get(task.id) ?? task.done })),
    topics: defaultTopics.map((topic) => ({ ...topic, status: topicStatus.get(topic.id) ?? topic.status }))
  };
}

function normalizeTopicStatus(status: string): TopicStatus {
  if (status === "N\u00e3o iniciado" || status === "N\u00c3\u00a3o iniciado") return "N\u00e3o iniciado";
  if (status === "Conclu\u00eddo" || status === "Conclu\u00c3\u00addo") return "Conclu\u00eddo";
  if (status === "Estudando") return "Estudando";
  return "N\u00e3o iniciado";
}

function normalizeProfileKind(profileKind: ProfileKind | string | null): ProfileKind | null {
  if (profileKind === "Evolu\u00e7\u00e3o Acelerada" || profileKind === "Evolu\u00c3\u00a7\u00c3\u00a3o Acelerada") {
    return "Evolu\u00e7\u00e3o Acelerada";
  }
  if (profileKind === "\u00daltima Hora" || profileKind === "\u00c3\u0161ltima Hora") {
    return "\u00daltima Hora";
  }
  if (profileKind === "Iniciante Perdido" || profileKind === "Sem Rotina") {
    return profileKind;
  }
  return null;
}
