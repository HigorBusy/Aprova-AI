export const BRASILIA_TIME_ZONE = "America/Sao_Paulo";

type DateParts = {
  year: string;
  month: string;
  day: string;
};

const brasiliaDateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: BRASILIA_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
});

export function getBrasiliaDateKey(date = new Date()): string {
  const parts = getBrasiliaDateParts(date);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function isSameBrasiliaDay(dateA: Date, dateB: Date): boolean {
  return getBrasiliaDateKey(dateA) === getBrasiliaDateKey(dateB);
}

export function getStartOfBrasiliaDay(date = new Date()): Date {
  return new Date(`${getBrasiliaDateKey(date)}T00:00:00.000-03:00`);
}

export function getEndOfBrasiliaDay(date = new Date()): Date {
  return new Date(`${getBrasiliaDateKey(date)}T23:59:59.999-03:00`);
}

export function getBrasiliaDayDifference(fromDateKey: string, toDateKey = getBrasiliaDateKey()): number {
  const from = new Date(`${fromDateKey}T00:00:00.000-03:00`).getTime();
  const to = new Date(`${toDateKey}T00:00:00.000-03:00`).getTime();
  return Math.round((to - from) / 86_400_000);
}

function getBrasiliaDateParts(date: Date): DateParts {
  const parts = brasiliaDateFormatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("Unable to format Brasilia date key.");
  }

  return { year, month, day };
}
