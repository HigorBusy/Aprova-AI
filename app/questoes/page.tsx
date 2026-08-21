import type { Metadata } from "next";

import { QuestionCenter } from "@/components/question-center";
import type { QuestionAreaKey } from "@/lib/questions";

export const metadata: Metadata = {
  title: "Questões | AprovaAI",
  description: "Treine questões, entenda seus erros e descubra o próximo assunto que precisa melhorar."
};

export default function QuestionsPage({ searchParams }: { searchParams?: { area?: string; topic?: string } }) {
  const area = isAreaKey(searchParams?.area) ? searchParams?.area : undefined;
  const topicId = typeof searchParams?.topic === "string" ? searchParams.topic.slice(0, 80) : undefined;

  return <QuestionCenter initialArea={area} initialTopicId={topicId} />;
}

function isAreaKey(value: string | undefined): value is QuestionAreaKey {
  return value === "math" || value === "languages" || value === "humanities" || value === "nature";
}
