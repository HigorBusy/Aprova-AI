"use client";

import { Card, ProgressBar } from "@/components/ui";
import { subjects } from "@/lib/study-data";
import type { StudyState, TopicStatus } from "@/lib/types";

type SubjectsProps = {
  state: StudyState;
  onStatusChange: (topicId: string, status: TopicStatus) => void;
};

export function Subjects({ state, onStatusChange }: SubjectsProps) {
  const territories = subjects.map((subject) => {
    const topics = state.topics.filter((topic) => topic.subject === subject);
    const score = topics.reduce((sum, topic) => {
      if (topic.status === "Concluído") return sum + 100;
      if (topic.status === "Estudando") return sum + 45;
      return sum + 8;
    }, 0);
    const progress = topics.length ? Math.round(score / topics.length) : 0;
    return { subject, topics, progress };
  });

  return (
    <div className="grid gap-4 animate-float-in lg:grid-cols-2 lg:gap-5">
      <Card className="lg:col-span-2">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan">mapa estelar</p>
        <h2 className="mt-1 text-2xl font-black text-white lg:text-3xl">Setores da aprovação</h2>
        <p className="mt-2 max-w-2xl text-sm font-bold text-slate-400">
          Cada matéria é um setor da rota. O objetivo é saber onde acelerar, onde estabilizar e onde recalcular.
        </p>
      </Card>

      {territories.map((territory) => (
        <Card key={territory.subject} className="overflow-hidden">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-white">{territory.subject}</h2>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                setor {territory.progress >= 60 ? "em órbita" : territory.progress >= 35 ? "em ajuste" : "crítico"}
              </p>
            </div>
            <span className="rounded-lg border border-cyan/20 bg-cyan/10 px-3 py-2 text-lg font-black text-cyan">
              {territory.progress}%
            </span>
          </div>
          <ProgressBar value={territory.progress} className="mt-4" />
          <div className="mt-4 grid gap-3 xl:grid-cols-2">
            {territory.topics.map((topic) => (
              <div key={topic.id} className="rounded-lg border border-white/10 bg-slate-950/30 p-3">
                <p className="font-bold text-white">{topic.title}</p>
                <select
                  value={topic.status}
                  onChange={(event) => onStatusChange(topic.id, event.target.value as TopicStatus)}
                  className="mt-2 h-10 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-sm font-bold text-white outline-none focus:border-cyan"
                >
                  <option>Não iniciado</option>
                  <option>Estudando</option>
                  <option>Concluído</option>
                </select>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
