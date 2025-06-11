import { TransactionFilters } from '@/features/transactions/model/Transaction';
import { TimePeriod, getCurrentTimePeriod } from './dateUtils';

interface PersistedFilters {
  filters: TransactionFilters;
  selectedTimePeriod: TimePeriod | undefined;
}

/**
 * Convert filters to URL search parameters
 */
export const filtersToQueryParams = (filters: TransactionFilters, selectedTimePeriod: TimePeriod | undefined): URLSearchParams => {
  const params = new URLSearchParams();
  
  // Date range - this is all we need, period can be derived from it
  if (filters.dateRange?.start && filters.dateRange?.end) {
    params.set('start', filters.dateRange.start);
    params.set('end', filters.dateRange.end);
  }
  
  // Categories
  if (filters.categories && filters.categories.length > 0) {
    params.set('categories', filters.categories.join(','));
  }
  
  // Categories mode
  if (filters.categoriesMode) {
    params.set('categoriesMode', filters.categoriesMode);
  }
  
  // Cards
  if (filters.cards && filters.cards.length > 0) {
    params.set('cards', filters.cards.join(','));
  }
  
  // Income/Expense filter
  if (filters.isIncome !== undefined) {
    params.set('type', filters.isIncome ? 'income' : 'expense');
  }
  
  // Search query
  if (filters.searchQuery) {
    params.set('search', filters.searchQuery);
  }
  
  // Amount range
  if (filters.amountRange) {
    params.set('minAmount', filters.amountRange.min.toString());
    params.set('maxAmount', filters.amountRange.max.toString());
  }
  
  return params;
};

/**
 * Parse URL search parameters to filters
 */
export const queryParamsToFilters = (searchParams: URLSearchParams): PersistedFilters => {
  const filters: TransactionFilters = {};
  
  // Date range
  const start = searchParams.get('start');
  const end = searchParams.get('end');
  if (start && end) {
    filters.dateRange = { start, end };
  }
  
  // Determine time period from date range
  const selectedTimePeriod = filters.dateRange ? getCurrentTimePeriod(filters.dateRange) : undefined;
  
  // Categories
  const categoriesParam = searchParams.get('categories');
  if (categoriesParam) {
    filters.categories = categoriesParam.split(',').filter(Boolean);
  }
  
  // Categories mode
  const categoriesMode = searchParams.get('categoriesMode');
  if (categoriesMode === 'include' || categoriesMode === 'exclude') {
    filters.categoriesMode = categoriesMode;
  }
  
  // Cards
  const cardsParam = searchParams.get('cards');
  if (cardsParam) {
    filters.cards = cardsParam.split(',').filter(Boolean);
  }
  
  // Income/Expense filter
  const typeParam = searchParams.get('type');
  if (typeParam === 'income') {
    filters.isIncome = true;
  } else if (typeParam === 'expense') {
    filters.isIncome = false;
  }
  
  // Search query
  const searchQuery = searchParams.get('search');
  if (searchQuery) {
    filters.searchQuery = searchQuery;
  }
  
  // Amount range
  const minAmount = searchParams.get('minAmount');
  const maxAmount = searchParams.get('maxAmount');
  if (minAmount && maxAmount) {
    filters.amountRange = {
      min: parseFloat(minAmount),
      max: parseFloat(maxAmount)
    };
  }
  
  return {
    filters,
    selectedTimePeriod
  };
};

/**
 * Update URL with current filters
 */
export const updateUrlWithFilters = (filters: TransactionFilters, selectedTimePeriod: TimePeriod | undefined): void => {
  try {
    const params = filtersToQueryParams(filters, selectedTimePeriod);
    const url = new URL(window.location.href);
    
    // Clear existing filter params (removed 'period' from the list)
    const filterKeys = ['start', 'end', 'categories', 'categoriesMode', 'cards', 'type', 'search', 'minAmount', 'maxAmount'];
    filterKeys.forEach(key => url.searchParams.delete(key));
    
    // Add new filter params
    params.forEach((value, key) => {
      url.searchParams.set(key, value);
    });
    
    // Update URL without triggering page reload
    window.history.replaceState({}, '', url.toString());
    console.log('💾 Filters saved to URL:', url.search);
  } catch (error) {
    console.warn('⚠️ Failed to update URL with filters:', error);
  }
};

/**
 * Load filters from current URL
 */
export const loadFiltersFromUrl = (): PersistedFilters | null => {
  try {
    const params = new URLSearchParams(window.location.search);
    
    // Check if there are any filter-related params (removed 'period' from the list)
    const hasFilterParams = ['start', 'end', 'categories', 'cards', 'type', 'search'].some(key => params.has(key));
    
    if (!hasFilterParams) {
      console.log('📂 No filter parameters found in URL');
      return null;
    }
    
    const result = queryParamsToFilters(params);
    console.log('📂 Loaded filters from URL:', result);
    return result;
  } catch (error) {
    console.warn('⚠️ Failed to load filters from URL:', error);
    return null;
  }
}; 