"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";

import { Loader } from "@/components/ui/loader-15";
import { Textarea } from "@/components/ui/textarea";

type AiInputProps = {
  disabled?: boolean;
  loading?: boolean;
  placeholder?: string;
  initialValue?: string;
  onSubmit: (message: string) => void;
};

const MIN_HEIGHT = 56;
const MAX_HEIGHT = 180;

export function AiInput({
  disabled = false,
  loading = false,
  placeholder = "Pergunte ao Tutor IA sobre redação, estudos ou estratégia...",
  initialValue = "",
  onSubmit
}: AiInputProps) {
  const [value, setValue] = useState(initialValue);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback((reset = false) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = `${MIN_HEIGHT}px`;
    if (!reset) textarea.style.height = `${Math.min(textarea.scrollHeight, MAX_HEIGHT)}px`;
  }, []);

  useEffect(() => {
    if (!initialValue) return;
    setValue(initialValue);
    window.requestAnimationFrame(() => adjustHeight());
  }, [adjustHeight, initialValue]);

  function handleSubmit() {
    const message = value.trim();
    if (!message || disabled || loading) return;
    onSubmit(message);
    setValue("");
    adjustHeight(true);
  }

  return (
    <div className="relative w-full rounded-[24px] border border-white/10 bg-black/60 p-2 shadow-[0_0_46px_rgba(58,167,216,0.14)] backdrop-blur-xl transition-[background-color,border-color] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] focus-within:border-cosmic/45 focus-within:bg-black/70">
      <Textarea
        ref={textareaRef}
        value={value}
        disabled={disabled || loading}
        maxLength={8_000}
        aria-label="Mensagem para o Tutor IA"
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
        className="absolute bottom-4 right-4 grid h-10 w-10 place-items-center rounded-lg bg-[#f2c94c] text-[#08111f] transition-colors duration-150 hover:bg-[#f8d866] active:translate-y-px disabled:cursor-not-allowed disabled:bg-[#17283d] disabled:text-[#60758a]"
        aria-label="Enviar mensagem"
      >
        {loading ? <Loader size="sm" /> : <Send className="h-4 w-4" />}
      </button>
    </div>
  );
}
