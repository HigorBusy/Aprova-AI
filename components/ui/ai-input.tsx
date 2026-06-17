"use client";

import { useCallback, useRef, useState } from "react";
import { Send } from "lucide-react";

import { Loader } from "@/components/ui/loader-15";
import { Textarea } from "@/components/ui/textarea";

type AiInputProps = {
  disabled?: boolean;
  loading?: boolean;
  placeholder?: string;
  onSubmit: (message: string) => void;
};

const MIN_HEIGHT = 56;
const MAX_HEIGHT = 180;

export function AiInput({
  disabled = false,
  loading = false,
  placeholder = "Pergunte ao Comandante sobre redação, estudos ou estratégia...",
  onSubmit
}: AiInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback((reset = false) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = `${MIN_HEIGHT}px`;
    if (!reset) textarea.style.height = `${Math.min(textarea.scrollHeight, MAX_HEIGHT)}px`;
  }, []);

  function handleSubmit() {
    const message = value.trim();
    if (!message || disabled || loading) return;
    onSubmit(message);
    setValue("");
    adjustHeight(true);
  }

  return (
    <div className="relative w-full rounded-[24px] border border-white/10 bg-black/60 p-2 shadow-[0_0_46px_rgba(124,58,237,0.18)] backdrop-blur-xl transition focus-within:border-accent/45 focus-within:bg-black/70">
      <Textarea
        ref={textareaRef}
        value={value}
        disabled={disabled || loading}
        maxLength={8_000}
        aria-label="Mensagem para o Comandante IA"
        placeholder={placeholder}
        className="min-h-14 max-h-[180px] resize-none border-0 bg-transparent px-4 py-3 pr-16 text-sm leading-6 text-slate-100 placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0"
        onChange={(event) => {
          setValue(event.target.value);
          adjustHeight();
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            handleSubmit();
          }
        }}
      />
      <button
        type="button"
        disabled={disabled || loading || !value.trim()}
        onClick={handleSubmit}
        className="absolute bottom-4 right-4 grid h-10 w-10 place-items-center rounded-2xl border border-accent/35 bg-accent text-white shadow-[0_0_28px_rgba(168,85,247,0.34)] transition hover:bg-violet hover:shadow-[0_0_34px_rgba(168,85,247,0.42)] disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/[0.05] disabled:text-slate-600 disabled:shadow-none"
        aria-label="Enviar mensagem"
      >
        {loading ? <Loader size="sm" /> : <Send className="h-4 w-4" />}
      </button>
    </div>
  );
}
