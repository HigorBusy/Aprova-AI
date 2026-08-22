import { PRODUCT_CONFIG } from "@/lib/product-config";

export const ENEM_FIRST_DAY = new Date(PRODUCT_CONFIG.enem.firstDayIso);

export function getDaysToEnem(now = new Date()) {
  const difference = ENEM_FIRST_DAY.getTime() - now.getTime();
  return Math.max(0, Math.ceil(difference / 86_400_000));
}

export function getEnemCountdown(now = new Date()) {
  if (now >= ENEM_FIRST_DAY) {
    return { months: 0, weeks: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  let months =
    (ENEM_FIRST_DAY.getFullYear() - now.getFullYear()) * 12 +
    ENEM_FIRST_DAY.getMonth() -
    now.getMonth();

  let cursor = addMonthsClamped(now, months);
  if (cursor > ENEM_FIRST_DAY) {
    months -= 1;
    cursor = addMonthsClamped(now, months);
  }

  const remainingSeconds = Math.floor(
    (ENEM_FIRST_DAY.getTime() - cursor.getTime()) / 1000
  );
  const totalDays = Math.floor(remainingSeconds / 86_400);
  const weeks = Math.floor(totalDays / 7);
  const days = totalDays % 7;
  const hours = Math.floor((remainingSeconds % 86_400) / 3_600);
  const minutes = Math.floor((remainingSeconds % 3_600) / 60);
  const seconds = remainingSeconds % 60;

  return { months, weeks, days, hours, minutes, seconds };
}

function addMonthsClamped(date: Date, amount: number) {
  const result = new Date(date);
  const day = result.getDate();
  result.setDate(1);
  result.setMonth(result.getMonth() + amount);
  const lastDay = new Date(
    result.getFullYear(),
    result.getMonth() + 1,
    0
  ).getDate();
  result.setDate(Math.min(day, lastDay));
  return result;
}
