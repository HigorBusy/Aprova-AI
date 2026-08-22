import { ExternalLink, FileCheck2 } from "lucide-react";

import {
  questionOriginalNumber,
  questionSourceLabel,
  questionSourceUrl,
  type TrainingQuestion
} from "@/lib/questions";

export function QuestionSource({ question, compact = false }: { question: TrainingQuestion; compact?: boolean }) {
  const label = questionSourceLabel(question);
  const originalNumber = questionOriginalNumber(question);
  const official = question.sourceType === "official_enem";

  return (
    <div className={`border-y border-white/[0.09] bg-black/20 ${compact ? "px-3 py-3" : "px-4 py-4 sm:px-5"}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg border ${official ? "border-[#f2c94c]/30 bg-[#f2c94c]/[0.08] text-[#f2c94c]" : "border-accent/25 bg-accent/[0.07] text-aura"}`}>
            <FileCheck2 className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{label}</p>
            <p className="mt-1 text-sm font-semibold text-white">
              {question.sourceName}{originalNumber ? ` · Questão ${originalNumber}` : ""}
            </p>
          </div>
        </div>
        <a
          href={questionSourceUrl(question)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-white/10 px-3 text-xs font-semibold text-slate-300 transition-colors hover:border-accent/35 hover:text-white"
        >
          {official ? "Abrir prova" : "Consultar referência"} <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
      {!compact ? <p className="mt-3 max-w-3xl text-xs leading-5 text-muted">{question.rightsNote}</p> : null}
    </div>
  );
}
