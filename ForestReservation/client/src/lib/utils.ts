import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, addMonths, subMonths } from "date-fns";
import { ko } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date): string {
  return format(date, "yyyy년 MM월 dd일 (E)", { locale: ko });
}

export function formatMonth(date: Date): string {
  return format(date, "yyyy년 MM월", { locale: ko });
}

export function getNextMonth(date: Date): Date {
  return addMonths(date, 1);
}

export function getPreviousMonth(date: Date): Date {
  return subMonths(date, 1);
}

export function formatDateForApi(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function generateReservationId(): string {
  const date = new Date();
  const dateStr = format(date, 'yyMMdd');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `AR-${dateStr}-${random}`;
}
