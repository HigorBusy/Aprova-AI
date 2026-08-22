import Image from "next/image";
import Link from "next/link";
import { ChartNoAxesCombined, ClipboardList, FileText, GraduationCap } from "lucide-react";

type InternalSection = "home" | "questions" | "tutor" | "evolution";

const items = [
  { id: "home", label: "Hoje", href: "/", icon: FileText },
  { id: "questions", label: "Questões", href: "/questoes", icon: ClipboardList },
  { id: "tutor", label: "Tutor IA", href: "/comandante", icon: GraduationCap },
  { id: "evolution", label: "Evolução", href: "/diagnostico", icon: ChartNoAxesCombined }
] as const;

export function InternalNav({ active }: { active: InternalSection }) {
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-white/[0.08] bg-[#050b0d]/95 px-5 py-6 backdrop-blur-xl lg:flex">
        <Link href="/" className="flex h-11 items-center" aria-label="AprovaAI - Hoje">
          <Image
            src="/aprova-ai-logo-lockup.svg"
            alt="AprovaAI"
            width={640}
            height={220}
            priority
            className="h-9 w-auto max-w-full object-contain"
          />
        </Link>

        <nav aria-label="Navegação principal" className="mt-10 grid gap-1.5">
          {items.map((item) => {
            const Icon = item.icon;
            const selected = active === item.id;

            return (
              <Link
                key={item.id}
                href={item.href}
                aria-current={selected ? "page" : undefined}
                className={`flex min-h-12 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-[background-color,color,transform] duration-150 active:scale-[0.98] ${
                  selected
                    ? "bg-accent/10 text-white"
                    : "text-slate-500 hover:bg-white/[0.045] hover:text-slate-200"
                }`}
              >
                <Icon className={`h-4 w-4 ${selected ? "text-aura" : ""}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <p className="mt-auto border-t border-white/[0.08] pt-5 text-xs leading-5 text-slate-600">
          AprovaAI · preparação orientada para o ENEM
        </p>
      </aside>

      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-white/[0.08] bg-[#050b0d]/95 px-2 py-2 backdrop-blur-xl lg:hidden" aria-label="Navegação principal">
        <div className="mx-auto grid max-w-lg grid-cols-4 gap-1">
          {items.map((item) => {
            const Icon = item.icon;
            const selected = active === item.id;

            return (
              <Link
                key={item.id}
                href={item.href}
                aria-current={selected ? "page" : undefined}
                className={`min-h-12 rounded-lg px-1 py-2 text-center text-[0.68rem] font-semibold transition-colors ${
                  selected ? "bg-accent/10 text-aura" : "text-slate-500"
                }`}
              >
                <Icon className="mx-auto h-4 w-4" />
                <span className="mt-1 block">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
