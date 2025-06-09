import { format, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';

export function formatDate(date: string | Date, formatString: string = 'MMM dd, yyyy'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatString);
}

export function formatDateShort(date: string | Date): string {
  return formatDate(date, 'MMM dd');
}

export function formatDateTime(date: string | Date): string {
  return formatDate(date, 'MMM dd, yyyy HH:mm');
}

export function toISODate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function getCurrentDateISO(): string {
  return toISODate(new Date());
}

export function getMonthRange(date: Date = new Date()): { start: string; end: string } {
  return {
    start: toISODate(startOfMonth(date)),
    end: toISODate(endOfMonth(date))
  };
}

export function getWeekRange(date: Date = new Date()): { start: string; end: string } {
  return {
    start: toISODate(startOfWeek(date)),
    end: toISODate(endOfWeek(date))
  };
}

export function isToday(date: string): boolean {
  return date === getCurrentDateISO();
}

export function isThisMonth(date: string): boolean {
  const today = new Date();
  const { start, end } = getMonthRange(today);
  return date >= start && date <= end;
} 