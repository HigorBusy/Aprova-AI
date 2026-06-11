"use client";

import { useState } from "react";
import { BrainCircuit, ImagePlus, Lock } from "lucide-react";
import { Card, Button } from "@/components/ui";
import type { MentorMessage } from "@/lib/types";

type MentorProps = {
  messages: MentorMessage[];
  onSend: (message: MentorMessage) => void;
};

export function Mentor({ messages, onSend }: MentorProps) {
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState<string | undefined>();

  function handleSend() {
    if (!text.trim() && !fileName) return;
    onSend({
      id: crypto.randomUUID(),
      role: "student",
      text: text.trim() || "Enviei uma imagem do bloqueio.",
      fileName,
      createdAt: new Date().toISOString()
    });
    setText("");
    setFileName(undefined);
  }

  return (
    <div className="grid gap-4 animate-float-in">
      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan">estrategista IA</p>
            <h2 className="text-xl font-black text-white">Comandante de avanço</h2>
          </div>
          <span className="grid h-10 w-10 place-items-center rounded-lg border border-accent/20 bg-accent/10 text-aura">
            <BrainCircuit className="h-5 w-5" />
          </span>
        </div>

        <div className="mt-4 grid gap-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`rounded-lg border p-3 text-sm font-semibold ${
                message.role === "student"
                  ? "border-cyan/20 bg-cyan/10 text-cyan"
                  : "border-white/10 bg-white/[0.055] text-slate-200"
              }`}
            >
              <p>{message.text}</p>
              {message.fileName && (
                <span className="mt-2 block text-xs text-slate-500">Imagem: {message.fileName}</span>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Descreva o bloqueio, a matéria ou o erro que precisa virar estratégia..."
          className="min-h-28 w-full resize-none rounded-lg border border-white/10 bg-white/[0.06] px-3 py-3 font-semibold text-white outline-none placeholder:text-slate-500 focus:border-cyan"
        />
        <div className="mt-3 flex items-center gap-2">
          <label className="inline-flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-3 text-sm font-bold text-white transition hover:border-cyan/50">
            <ImagePlus className="h-4 w-4" />
            Foto
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => setFileName(event.target.files?.[0]?.name)}
            />
          </label>
          <Button className="flex-1" onClick={handleSend}>
            Orientar
          </Button>
        </div>
        <p className="mt-3 flex items-center gap-2 text-xs font-bold text-slate-500">
          <Lock className="h-4 w-4 text-amber-300" />
          A versão premium libera análises profundas e plano de ataque adaptativo.
        </p>
      </Card>
    </div>
  );
}
