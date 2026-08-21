export const presentationThemeNames = [
  "Acadêmico",
  "Moderno",
  "Minimalista",
  "Dark",
  "Corporativo",
  "Criativo",
  "Educacional",
  "Premium"
] as const;

export type PresentationThemeName = typeof presentationThemeNames[number];

export type PresentationTheme = {
  name: PresentationThemeName;
  description: string;
  background: string;
  surface: string;
  foreground: string;
  muted: string;
  accent: string;
  accentSoft: string;
  border: string;
  headingFamily: string;
};

export const presentationThemes: Record<PresentationThemeName, PresentationTheme> = {
  "Acadêmico": {
    name: "Acadêmico",
    description: "Sério, claro e adequado para trabalhos escolares.",
    background: "#F4F1E8",
    surface: "#E6E0D1",
    foreground: "#17211D",
    muted: "#59655E",
    accent: "#1F6B53",
    accentSoft: "#CFE3D8",
    border: "#C8C2B4",
    headingFamily: "Georgia, serif"
  },
  "Moderno": {
    name: "Moderno",
    description: "Contraste limpo com azul elétrico controlado.",
    background: "#F4F7FB",
    surface: "#E7EEF8",
    foreground: "#101828",
    muted: "#526077",
    accent: "#2563EB",
    accentSoft: "#D8E5FF",
    border: "#CBD5E1",
    headingFamily: "var(--font-space-grotesk), Inter, sans-serif"
  },
  "Minimalista": {
    name: "Minimalista",
    description: "Tipografia dominante e quase nenhum ruído visual.",
    background: "#FAFAF8",
    surface: "#EEEDEA",
    foreground: "#181816",
    muted: "#676762",
    accent: "#181816",
    accentSoft: "#E2E1DC",
    border: "#D7D6D1",
    headingFamily: "var(--font-space-grotesk), Inter, sans-serif"
  },
  "Dark": {
    name: "Dark",
    description: "Escuro, técnico e confortável em ambientes de pouca luz.",
    background: "#07110F",
    surface: "#10201B",
    foreground: "#F3F6F1",
    muted: "#9AA9A1",
    accent: "#9FCF8B",
    accentSoft: "#203A31",
    border: "#294039",
    headingFamily: "var(--font-space-grotesk), Inter, sans-serif"
  },
  "Corporativo": {
    name: "Corporativo",
    description: "Sóbrio, preciso e orientado a decisão.",
    background: "#0D1B2A",
    surface: "#172A3D",
    foreground: "#F6F8FB",
    muted: "#A8B6C7",
    accent: "#4EA8DE",
    accentSoft: "#173C55",
    border: "#28455E",
    headingFamily: "var(--font-space-grotesk), Inter, sans-serif"
  },
  "Criativo": {
    name: "Criativo",
    description: "Energia editorial sem perder legibilidade.",
    background: "#FFF7ED",
    surface: "#FFE6C7",
    foreground: "#2C1810",
    muted: "#785748",
    accent: "#E24A32",
    accentSoft: "#FFD2C6",
    border: "#E8C6AE",
    headingFamily: "Georgia, serif"
  },
  "Educacional": {
    name: "Educacional",
    description: "Amigável, didático e organizado por conceitos.",
    background: "#EFFAF7",
    surface: "#D9F1EA",
    foreground: "#12332B",
    muted: "#53736A",
    accent: "#0F8B72",
    accentSoft: "#BDE5D9",
    border: "#B6D8CF",
    headingFamily: "var(--font-space-grotesk), Inter, sans-serif"
  },
  "Premium": {
    name: "Premium",
    description: "Elegante, editorial e com contraste quente.",
    background: "#101418",
    surface: "#1B2228",
    foreground: "#F7F2E8",
    muted: "#B5AA98",
    accent: "#D7B56D",
    accentSoft: "#3A3123",
    border: "#403B32",
    headingFamily: "Georgia, serif"
  }
};

export function normalizePresentationTheme(value: unknown): PresentationThemeName {
  if (typeof value !== "string") return "Acadêmico";
  const match = presentationThemeNames.find((name) => name.toLowerCase() === value.trim().toLowerCase());
  return match ?? "Acadêmico";
}
