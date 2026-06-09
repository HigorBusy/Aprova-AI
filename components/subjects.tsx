"use client";

import { Card } from "@/components/ui";
import { subjects } from "@/lib/study-data";
import type { StudyState, TopicStatus } from "@/lib/types";

type SubjectsProps = {
  state: StudyState;
  onStatusChange: (topicId: string, status: TopicStatus) => void;
};

const statusColors: Record<TopicStatus, string> = {
  "Não iniciado": "bg-slate-100 text-slate-600",
  "Estudando": "bg-blue-50 text-ocean",
  "Concluído": "bg-green-50 text-mint",
};

export function Subjects({ state, onStatusChange }: SubjectsProps) {
  return (
    <div className="grid gap-4 animate-float-in">
      {subjects.map((subject) => {
        const topics = state.topics.filter((topic) => topic.subject === subject);
        const done = topics.filter((topic) => topic.status === "Concluído").length;
        const progress = topics.length > 0 ? Math.round((done / topics.length) * 100) : 0;

        return (
          <Card key={subject}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-black">{subject}</h2>
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-blue-50 px-2 py-1 text-xs font-black text-ocean">
                  {done}/{topics.length}
                </span>
                {progress > 0 && (
                  <span className="rounded-lg bg-green-50 px-2 py-1 text-xs font-bold text-mint">
                    {progress}%
                  </span>
                )}
              </div>
            </div>

            {/* Subject progress bar */}
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-ocean to-mint transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="mt-3 grid gap-3">
              {topics.map((topic) => (
                <div
                  key={topic.id}
                  className="rounded-xl border border-slate-100 bg-white/80 p-3 transition-all duration-200 hover:shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold">{topic.title}</p>
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs font-bold ${statusColors[topic.status]}`}
                    >
                      {topic.status}
                    </span>
                  </div>
                  <select
                    value={topic.status}
                    onChange={(event) =>
                      onStatusChange(topic.id, event.target.value as TopicStatus)
                    }
                    className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold outline-none transition focus:border-ocean focus:ring-2 focus:ring-blue-100"
                  >
                    <option>Não iniciado</option>
                    <option>Estudando</option>
                    <option>Concluído</option>
                  </select>
                </div>
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
