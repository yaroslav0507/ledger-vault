import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';

export function formatDate(date: string | Date, formatString: string = 'MMM dd, yyyy'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatString);
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
      // March - May (meteorological spring)
      const springStart = new Date(today.getFullYear(), 2, 1); // March 1
      const springEnd = new Date(today.getFullYear(), 4, 31); // May 31
      
      return {
        start: toISODate(springStart),
        end: toISODate(springEnd)
      };

    case 'summer':
      // June - August (meteorological summer)
      const summerStart = new Date(today.getFullYear(), 5, 1); // June 1
      const summerEnd = new Date(today.getFullYear(), 7, 31); // August 31
      
      return {
        start: toISODate(summerStart),
        end: toISODate(summerEnd)
      };

    case 'autumn':
      // September - November (meteorological autumn)
      const autumnStart = new Date(today.getFullYear(), 8, 1); // September 1
      const autumnEnd = new Date(today.getFullYear(), 10, 30); // November 30
      
      return {
        start: toISODate(autumnStart),
        end: toISODate(autumnEnd)
      };

    case 'winter':
      // December of current year to February of same year (inverted format)
      // This creates: start=2025-12-01&end=2025-02-28 (represents Dec 2025 to Feb 2026)
      const currentYear = today.getFullYear();
      const winterStart = new Date(currentYear, 11, 1); // December 1 of current year
      const winterEnd = new Date(currentYear, 1, 28);   // February 28 of same year (inverted)
      
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
        return `${formatDate(customRange.start)} - ${formatDate(customRange.end)}`;
      }
      return 'Custom';
    default:
      return 'Unknown';
  }
}

export function formatDisplayDate(dateString: string): string {
  try {
    const date = parseISO(dateString);
    return formatDate(date, 'MMM dd');
  } catch {
    return dateString;
  }
}

export function isDateRangeForPeriod(dateRange: DateRange, period: TimePeriod): boolean {
  const periodRange = getDateRangeForPeriod(period);
  return dateRange.start === periodRange.start && dateRange.end === periodRange.end;
}

export function getCurrentTimePeriod(dateRange?: DateRange): TimePeriod {
  if (!dateRange) return 'month'; // Default period
  
  // Check against each period
  const periods: TimePeriod[] = ['today', 'week', 'month', 'lastMonth', 'quarter', 'year', 'spring', 'summer', 'autumn', 'winter'];
  
  for (const period of periods) {
    if (isDateRangeForPeriod(dateRange, period)) {
      return period;
    }
  }
  
  return 'custom';
}

export function getTimePeriodDisplayText(filters?: { dateRange?: DateRange }): string {
  if (!filters || !filters.dateRange) {
    return 'in total';
  }
  
  const currentPeriod = getCurrentTimePeriod(filters.dateRange);
  const label = getTimePeriodLabel(currentPeriod, filters.dateRange);
  
  switch (currentPeriod) {
    case 'today':
      return 'today';
    case 'week':
      return 'this week';
    case 'month':
      return 'this month';
    case 'lastMonth':
      return 'previous month';
    case 'quarter':
      return 'this quarter';
    case 'year':
      return 'this year';
    case 'spring':
    case 'summer':
    case 'autumn':
    case 'winter':
      return `in ${label.toLowerCase()}`;
    case 'custom':
      return `in selected period`;
    default:
      return 'in total';
  }
}