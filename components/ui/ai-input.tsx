"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Globe, Paperclip, Plus, Send } from "lucide-react";

import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";

type AiInputProps = {
  disabled?: boolean;
  onSubmit?: (message: string, file?: File) => void;
};

const MIN_HEIGHT = 52;
const MAX_HEIGHT = 164;

export function AiInput({ disabled = false, onSubmit }: AiInputProps) {
  const [value, setValue] = useState("");
  const [searchMode, setSearchMode] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const adjustHeight = useCallback((reset = false) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = `${MIN_HEIGHT}px`;
    if (!reset) {
      textarea.style.height = `${Math.min(textarea.scrollHeight, MAX_HEIGHT)}px`;
    }
  }, []);

  useEffect(() => {
    const handleResize = () => adjustHeight();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [adjustHeight]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null;
    if (preview) URL.revokeObjectURL(preview);
    setFile(nextFile);
    setPreview(nextFile ? URL.createObjectURL(nextFile) : null);
  }

  function clearFile() {
    if (preview) URL.revokeObjectURL(preview);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setFile(null);
    setPreview(null);
  }

  function handleSubmit() {
    if (disabled || (!value.trim() && !file)) return;
    onSubmit?.(value.trim(), file ?? undefined);
    setValue("");
    clearFile();
    adjustHeight(true);
  }

  return (
    <div className="w-full py-4">
      <div className="relative mx-auto w-full max-w-2xl rounded-[22px] border border-white/10 bg-white/[0.025] p-1 shadow-[0_0_48px_rgba(124,58,237,0.14)]">
        <div className="relative flex flex-col rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl">
          <div className="relative overflow-y-auto" style={{ maxHeight: MAX_HEIGHT }}>
            <Textarea
              ref={textareaRef}
              value={value}
              disabled={disabled}
              aria-label="Mensagem para o Copiloto IA"
              className="min-h-[52px] resize-none rounded-2xl rounded-b-none border-0 bg-transparent px-4 py-4 pr-12 focus-visible:ring-0"
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  handleSubmit();
                }
              }}
              onChange={(event) => {
                setValue(event.target.value);
                adjustHeight();
              }}
            />
            {!value && (
              <div className="pointer-events-none absolute left-4 top-4">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={searchMode ? "search" : "ask"}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.16 }}
                    className="text-sm text-slate-500"
                  >
                    {disabled
                      ? "Copiloto aguardando conexão..."
                      : searchMode
                        ? "Pesquisar e recalcular a rota..."
                        : "Pergunte ao Copiloto IA..."}
                  </motion.p>
                </AnimatePresence>
              </div>
            )}
          </div>

          <div className="relative h-14 rounded-b-xl border-t border-white/5 bg-white/[0.035]">
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              <label
                className={cn(
                  "relative grid h-8 w-8 cursor-pointer place-items-center rounded-full border transition",
                  file
                    ? "border-accent/60 bg-accent/20 text-aura"
                    : "border-white/10 bg-white/[0.045] text-slate-500 hover:text-white",
                  disabled && "cursor-not-allowed opacity-50"
                )}
                title="Anexar imagem"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  disabled={disabled}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Paperclip className="h-4 w-4" />
              </label>

              <button
                type="button"
                disabled={disabled}
                onClick={() => setSearchMode((current) => !current)}
                className={cn(
                  "flex h-8 items-center gap-2 rounded-full border px-2 text-xs transition",
                  searchMode
                    ? "border-accent/50 bg-accent/20 text-aura"
                    : "border-white/10 bg-white/[0.045] text-slate-500 hover:text-white",
                  disabled && "cursor-not-allowed opacity-50"
                )}
                title="Modo de busca"
              >
                <motion.span animate={{ rotate: searchMode ? 180 : 0 }}>
                  <Globe className="h-4 w-4" />
                </motion.span>
                <AnimatePresence>
                  {searchMode && (
                    <motion.span
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: "auto", opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      className="overflow-hidden whitespace-nowrap"
                    >
                      Busca
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </div>

            <button
              type="button"
              disabled={disabled || (!value.trim() && !file)}
              onClick={handleSubmit}
              className="absolute bottom-3 right-3 grid h-8 w-8 place-items-center rounded-full bg-accent text-white shadow-[0_0_26px_rgba(168,85,247,0.34)] transition hover:bg-violet disabled:cursor-not-allowed disabled:bg-white/[0.055] disabled:text-slate-600 disabled:shadow-none"
              aria-label="Enviar mensagem"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>

          {preview && (
            <div className="absolute bottom-16 left-3 h-24 w-24 overflow-hidden rounded-lg border border-accent/40 bg-canvas shadow-energy">
              {/* Blob URLs are intentionally rendered without Next image optimization. */}
              <img src={preview} alt="Imagem anexada" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={clearFile}
                className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/75 text-white"
                aria-label="Remover imagem"
              >
                <Plus className="h-4 w-4 rotate-45" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
