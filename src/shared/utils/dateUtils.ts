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

export type TimePeriod = 'today' | 'week' | 'month' | 'lastMonth' | 'quarter' | 'year' | 'spring' | 'summer' | 'autumn' | 'winter' | 'custom';

export interface DateRange {
  start: string;
  end: string;
}

/**
 * Get date range for a specific time period
 */
export function getDateRangeForPeriod(period: TimePeriod, customRange?: DateRange): DateRange {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (period) {
    case 'today':
      return {
        start: toISODate(today),
        end: toISODate(today)
      };
      
    case 'week':
      const startOfWeekDate = new Date(today);
      const dayOfWeek = today.getDay();
      // Adjust to Monday as start of week (0 = Sunday, 1 = Monday)
      const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      startOfWeekDate.setDate(today.getDate() - daysToSubtract);
      
      const endOfWeekDate = new Date(startOfWeekDate);
      endOfWeekDate.setDate(startOfWeekDate.getDate() + 6);
      
      return {
        start: toISODate(startOfWeekDate),
        end: toISODate(endOfWeekDate)
      };
      
    case 'month':
      const startOfMonthDate = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonthDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      return {
        start: toISODate(startOfMonthDate),
        end: toISODate(endOfMonthDate)
      };

    case 'lastMonth':
      const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      
      return {
        start: toISODate(startOfLastMonth),
        end: toISODate(endOfLastMonth)
      };

    case 'quarter':
      const currentMonth = today.getMonth();
      const quarterStartMonth = Math.floor(currentMonth / 3) * 3;
      const startOfQuarter = new Date(today.getFullYear(), quarterStartMonth, 1);
      const endOfQuarter = new Date(today.getFullYear(), quarterStartMonth + 3, 0);
      
      return {
        start: toISODate(startOfQuarter),
        end: toISODate(endOfQuarter)
      };
      
    case 'year':
      const startOfYear = new Date(today.getFullYear(), 0, 1);
      const endOfYear = new Date(today.getFullYear(), 11, 31);
      
      return {
        start: toISODate(startOfYear),
        end: toISODate(endOfYear)
      };

    case 'spring':
      // March 20 - June 20 (approximate)
      const springStart = new Date(today.getFullYear(), 2, 20); // March 20
      const springEnd = new Date(today.getFullYear(), 5, 20); // June 20
      
      return {
        start: toISODate(springStart),
        end: toISODate(springEnd)
      };

    case 'summer':
      // June 21 - September 22 (approximate)
      const summerStart = new Date(today.getFullYear(), 5, 21); // June 21
      const summerEnd = new Date(today.getFullYear(), 8, 22); // September 22
      
      return {
        start: toISODate(summerStart),
        end: toISODate(summerEnd)
      };

    case 'autumn':
      // September 23 - December 20 (approximate)
      const autumnStart = new Date(today.getFullYear(), 8, 23); // September 23
      const autumnEnd = new Date(today.getFullYear(), 11, 20); // December 20
      
      return {
        start: toISODate(autumnStart),
        end: toISODate(autumnEnd)
      };

    case 'winter':
      // December 21 - March 19 (spans year boundary)
      const currentYear = today.getFullYear();
      const winterStart = new Date(currentYear, 11, 21); // December 21
      const winterEnd = new Date(currentYear + 1, 2, 19); // March 19 next year
      
      // If we're before March 20, we're in the winter that started last year
      if (today.getMonth() < 2 || (today.getMonth() === 2 && today.getDate() < 20)) {
        return {
          start: toISODate(new Date(currentYear - 1, 11, 21)),
          end: toISODate(new Date(currentYear, 2, 19))
        };
      }
      
      return {
        start: toISODate(winterStart),
        end: toISODate(winterEnd)
      };
      
    case 'custom':
      return customRange || {
        start: toISODate(today),
        end: toISODate(today)
      };
      
    default:
      return {
        start: toISODate(today),
        end: toISODate(today)
      };
  }
}

/**
 * Get display label for time period
 */
export function getTimePeriodLabel(period: TimePeriod, customRange?: DateRange): string {
  switch (period) {
    case 'today':
      return 'Today';
    case 'week':
      return 'This Week';
    case 'month':
      return 'This Month';
    case 'lastMonth':
      return 'Previous Month';
    case 'quarter':
      return 'This Quarter';
    case 'year':
      return 'This Year';
    case 'spring':
      return 'Spring';
    case 'summer':
      return 'Summer';
    case 'autumn':
      return 'Autumn';
    case 'winter':
      return 'Winter';
    case 'custom':
      if (customRange) {
        return `${formatDisplayDate(customRange.start)} - ${formatDisplayDate(customRange.end)}`;
      }
      return 'Custom Range';
    default:
      return 'All Time';
  }
}

/**
 * Format date for display (DD.MM.YYYY)
 */
export function formatDisplayDate(dateString: string): string {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

/**
 * Check if a date range is the same as a specific time period
 */
export function isDateRangeForPeriod(dateRange: DateRange, period: TimePeriod): boolean {
  const periodRange = getDateRangeForPeriod(period);
  return dateRange.start === periodRange.start && dateRange.end === periodRange.end;
}

/**
 * Get the current time period based on date range
 */
export function getCurrentTimePeriod(dateRange?: DateRange): TimePeriod {
  if (!dateRange) return 'custom';
  
  const periods: TimePeriod[] = ['today', 'week', 'month', 'lastMonth', 'quarter', 'year', 'spring', 'summer', 'autumn', 'winter'];
  
  for (const period of periods) {
    if (isDateRangeForPeriod(dateRange, period)) {
      return period;
    }
  }
  
  return 'custom';
} 