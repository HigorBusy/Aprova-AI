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
    <nav aria-label="Navegação principal" className="mt-3 flex gap-1 overflow-x-auto rounded-xl border border-white/[0.08] bg-black/20 p-1.5">
      {items.map((item) => {
        const Icon = item.icon;
        const selected = active === item.id;

        return (
          <Link
            key={item.id}
            href={item.href}
            aria-current={selected ? "page" : undefined}
            className={`inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg px-3 text-xs font-semibold transition-[background-color,color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.98] sm:flex-1 sm:text-sm ${
              selected
                ? "bg-white/[0.09] text-white"
                : "text-slate-500 hover:bg-white/[0.045] hover:text-slate-200"
            }`}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
