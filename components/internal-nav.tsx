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
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-[#8fa3b8]/15 bg-[#07101d]/95 px-5 py-6 backdrop-blur-xl lg:flex">
        <Link href="/" className="flex h-11 items-center" aria-label="Pontuei - Hoje">
          <Image
            src="/pontuei-logo-lockup.svg"
            alt="Pontuei"
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
                    ? "bg-[#f2c94c] text-[#08111f]"
                    : "text-[#8fa3b8] hover:bg-[#0f1e31] hover:text-[#f4f1e8]"
                }`}
              >
                <Icon className={`h-4 w-4 ${selected ? "text-[#08111f]" : ""}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <p className="mt-auto border-t border-[#8fa3b8]/15 pt-5 text-xs leading-5 text-[#6f8498]">
          Pontuei · preparação orientada para o ENEM
        </p>
      </aside>

      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-[#8fa3b8]/15 bg-[#07101d]/95 px-2 py-2 backdrop-blur-xl lg:hidden" aria-label="Navegação principal">
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
                  selected ? "bg-[#f2c94c] text-[#08111f]" : "text-[#8fa3b8]"
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
