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

export type TimePeriod = 'today' | 'week' | 'month' | 'lastMonth' | 'quarter' | 'year' | 'lastYear' | 'spring' | 'summer' | 'autumn' | 'winter' | 'custom';

export interface DateRange {
  start: string;
  end: string;
}

// Helper function to create date range
function createDateRange(startDate: Date, endDate: Date): DateRange {
  return {
    start: toISODate(startDate),
    end: toISODate(endDate)
  };
}

// Helper function to get today's date components
function getTodayComponents() {
  const now = new Date();
  return {
    now,
    today: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
    year: now.getFullYear(),
    month: now.getMonth(),
    date: now.getDate()
  };
}

// Helper function for week calculation
function getWeekRange(today: Date): DateRange {
  const startOfWeekDate = new Date(today);
  const dayOfWeek = today.getDay();
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  startOfWeekDate.setDate(today.getDate() - daysToSubtract);
  
  const endOfWeekDate = new Date(startOfWeekDate);
  endOfWeekDate.setDate(startOfWeekDate.getDate() + 6);
  
  return createDateRange(startOfWeekDate, endOfWeekDate);
}

// Helper function for month calculation
function getMonthRangeForYear(year: number, month: number): DateRange {
  const startOfMonthDate = new Date(year, month, 1);
  const endOfMonthDate = new Date(year, month + 1, 0);
  return createDateRange(startOfMonthDate, endOfMonthDate);
}

// Helper function for quarter calculation
function getQuarterRange(year: number, month: number): DateRange {
  const quarterStartMonth = Math.floor(month / 3) * 3;
  const startOfQuarter = new Date(year, quarterStartMonth, 1);
  const endOfQuarter = new Date(year, quarterStartMonth + 3, 0);
  return createDateRange(startOfQuarter, endOfQuarter);
}

// Helper function for year calculation
function getYearRange(year: number): DateRange {
  const startOfYear = new Date(year, 0, 1);
  const endOfYear = new Date(year, 11, 31);
  return createDateRange(startOfYear, endOfYear);
}

// Helper function for seasonal ranges
function getSeasonalRange(year: number, season: 'spring' | 'summer' | 'autumn' | 'winter'): DateRange {
  const seasonalRanges = {
    spring: { startMonth: 2, startDay: 1, endMonth: 4, endDay: 31 }, // March - May
    summer: { startMonth: 5, startDay: 1, endMonth: 7, endDay: 31 }, // June - August
    autumn: { startMonth: 8, startDay: 1, endMonth: 10, endDay: 30 }, // September - November
    winter: { startMonth: 11, startDay: 1, endMonth: 1, endDay: 28 } // December - February (inverted)
  };

  const range = seasonalRanges[season];
  const startDate = new Date(year, range.startMonth, range.startDay);
  const endDate = new Date(year, range.endMonth, range.endDay);
  
  return createDateRange(startDate, endDate);
}

/**
 * Get date range for a specific time period
 */
export function getDateRangeForPeriod(period: TimePeriod, customRange?: DateRange): DateRange {
  const { today, year, month } = getTodayComponents();
  
  switch (period) {
    case 'today':
      return createDateRange(today, today);
      
    case 'week':
      return getWeekRange(today);
      
    case 'month':
      return getMonthRangeForYear(year, month);

    case 'lastMonth':
      return getMonthRangeForYear(year, month - 1);

    case 'quarter':
      return getQuarterRange(year, month);
      
    case 'year':
      return getYearRange(year);

    case 'spring':
    case 'summer':
    case 'autumn':
    case 'winter':
      return getSeasonalRange(year, period);
      
    case 'custom':
      return customRange || createDateRange(today, today);
      
    default:
      return createDateRange(today, today);
  }
}

// Translation key mapping for time periods
const PERIOD_TRANSLATION_KEYS = {
  today: 'timePeriod.today',
  week: 'timePeriod.thisWeek',
  month: 'timePeriod.thisMonth',
  lastMonth: 'timePeriod.previousMonth',
  quarter: 'timePeriod.thisQuarter',
  year: 'timePeriod.thisYear',
  lastYear: 'timePeriod.lastYear',
  spring: 'timePeriod.spring',
  summer: 'timePeriod.summer',
  autumn: 'timePeriod.autumn',
  winter: 'timePeriod.winter',
  custom: 'timePeriod.custom',
  unknown: 'timePeriod.unknown'
} as const;

/**
 * Get display label for time period (with translation support)
 * @param period - The time period
 * @param t - Translation function
 * @param customRange - Custom date range if period is 'custom'
 */
export function getTimePeriodLabel(
  period: TimePeriod, 
  t: (key: string) => string,
  customRange?: DateRange
): string {
  if (period === 'custom' && customRange) {
    return `${formatDate(customRange.start)} - ${formatDate(customRange.end)}`;
  }

  const translationKey = PERIOD_TRANSLATION_KEYS[period] || PERIOD_TRANSLATION_KEYS.unknown;
  return t(translationKey);
}

// Translation key mapping for display text
const DISPLAY_TEXT_TRANSLATION_KEYS = {
  today: 'timePeriod.today',
  week: 'timePeriod.thisWeek',
  month: 'timePeriod.thisMonth',
  lastMonth: 'timePeriod.previousMonth',
  quarter: 'timePeriod.thisQuarter',
  year: 'timePeriod.thisYear',
  lastYear: 'timePeriod.lastYear',
  spring: 'timePeriod.inSpring',
  summer: 'timePeriod.inSummer',
  autumn: 'timePeriod.inAutumn',
  winter: 'timePeriod.inWinter',
  inTotal: 'timePeriod.inTotal'
} as const;

/**
 * Get display text for time period (with translation support)
 * @param t - Translation function
 * @param filters - Filters containing date range
 */
export function getTimePeriodDisplayText(
  t: (key: string) => string,
  filters?: { dateRange?: DateRange }
): string {
  if (!filters || !filters.dateRange) {
    return t(DISPLAY_TEXT_TRANSLATION_KEYS.inTotal);
  }
  
  const currentPeriod = getCurrentTimePeriod(filters.dateRange);
  
  if (currentPeriod === 'custom') {
    return getDateRangeDisplayText(filters.dateRange);
  }

  const translationKey = DISPLAY_TEXT_TRANSLATION_KEYS[currentPeriod];
  if (!translationKey) {
    return t(DISPLAY_TEXT_TRANSLATION_KEYS.inTotal);
  }

  // For seasonal periods, use the special "in X" translations
  if (['spring', 'summer', 'autumn', 'winter'].includes(currentPeriod)) {
    return t(translationKey);
  }

  // For other periods, use the base translation and make it lowercase
  return t(translationKey).toLowerCase();
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
  const periods: TimePeriod[] = ['today', 'week', 'month', 'lastMonth', 'quarter', 'year', 'lastYear', 'spring', 'summer', 'autumn', 'winter'];
  
  for (const period of periods) {
    if (isDateRangeForPeriod(dateRange, period)) {
      return period;
    }
  }
  
  return 'custom';
}

/**
 * Extract all unique years from a list of transactions (sorted descending)
 */
export function getAllTransactionYears(transactionDates: string[]): number[] {
  const years = Array.from(new Set(
    transactionDates.map((date) => new Date(date).getFullYear()).filter((y) => !isNaN(y)),
  ));
  return years.sort((a, b) => b - a);
}

export function getDateRangeDisplayText(dateRange?: DateRange): string {
  if (!dateRange) return '';
  if (dateRange.start === dateRange.end) {
    return formatDate(dateRange.start);
  }
  return `${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`;
}