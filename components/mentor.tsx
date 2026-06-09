"use client";

import { useState } from "react";
import { ImagePlus, Lock, Sparkles } from "lucide-react";
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
      text: text.trim() || "Enviei uma imagem da questão.",
      fileName,
      createdAt: new Date().toISOString(),
    });
    setText("");
    setFileName(undefined);
  }

  return (
    <div className="grid gap-4 animate-float-in">
      {/* Chat Area */}
      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-ocean">Mentor ENEM</p>
            <h2 className="text-xl font-black">Dúvida rápida</h2>
          </div>
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-violet-50 text-grape">
            <Sparkles className="h-5 w-5" />
          </span>
        </div>

        <div className="mt-4 grid gap-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`rounded-xl p-3 text-sm font-semibold ${
                message.role === "student"
                  ? "bg-blue-50 text-blue-900"
                  : "bg-white/80 text-slate-700 border border-slate-100"
              }`}
            >
              <p>{message.text}</p>
              {message.fileName && (
                <span className="mt-2 block text-xs text-slate-500">
                  Imagem: {message.fileName}
                </span>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Input Area */}
      <Card>
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Escreva sua dúvida..."
          className="min-h-28 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-3 font-semibold outline-none transition focus:border-ocean focus:ring-2 focus:ring-blue-100"
        />
        <div className="mt-3 flex items-center gap-2">
          <label className="inline-flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold transition hover:border-blue-200 hover:bg-blue-50">
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
            Enviar
          </Button>
        </div>
        <p className="mt-3 flex items-center gap-2 text-xs font-bold text-slate-500">
          <Lock className="h-4 w-4 text-reward" />
          Premium libera mentor IA completo e análises extras.
        </p>
      </Card>
    </div>
  );
}
