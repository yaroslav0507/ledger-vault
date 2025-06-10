import { create } from 'zustand';
import { transactionRepository } from '../storage/TransactionRepository';
import { 
  Transaction, 
  CreateTransactionRequest, 
  TransactionFilters 
} from '../model/Transaction';
import { getDateRangeForPeriod, TimePeriod, DateRange } from '@/shared/utils/dateUtils';
import { updateUrlWithFilters, loadFiltersFromUrl } from '@/shared/utils/filterPersistence';

// Export the type for use in other files
export type { TransactionFilters };

// Get default filters (no date range - show all transactions)
const getDefaultFilters = (): TransactionFilters => ({
  // No default date range - let user choose via TimePeriodSelector
});

// Load initial state from URL or use defaults
const getInitialState = () => {
  const savedFilters = loadFiltersFromUrl();
  
  if (savedFilters) {
    let filters = savedFilters.filters;
    const selectedTimePeriod = savedFilters.selectedTimePeriod || 'lastMonth';
    
    // If we have a time period but no date range, generate the date range
    if (selectedTimePeriod && selectedTimePeriod !== 'custom' && !filters.dateRange) {
      const dateRange = getDateRangeForPeriod(selectedTimePeriod);
      filters = { ...filters, dateRange };
    }
    
    return {
      filters,
      selectedTimePeriod
    };
  }
  
  // Default state with lastMonth period and its date range
  const defaultPeriod = 'lastMonth' as TimePeriod;
  const defaultDateRange = getDateRangeForPeriod(defaultPeriod);
  
  return {
    filters: {
      ...getDefaultFilters(),
      dateRange: defaultDateRange
    },
    selectedTimePeriod: defaultPeriod
  };
};

interface TransactionStore {
  // State
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  filters: TransactionFilters;
  selectedTimePeriod: TimePeriod | undefined; // Track selected period separately
  
  // Actions
  loadTransactions: () => Promise<void>;
  addTransaction: (request: CreateTransactionRequest) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  clearAllTransactions: () => Promise<void>;
  setFilters: (newFilters: Partial<TransactionFilters>) => void;
  setTimePeriod: (period: TimePeriod, dateRange: DateRange) => void;
  toggleCategoryFilter: (category: string) => void;
  clearFilters: () => void;
  refreshTransactions: () => Promise<void>;
  
  // Computed values
  getBalance: () => { income: number; expenses: number; total: number };
  getFilteredTransactions: () => Transaction[];
  getTotalCount: () => number;
  totalIncome: number;
  totalExpenses: number;
}

export const useTransactionStore = create<TransactionStore>()((set, get) => ({
  // Initial state
  transactions: [],
  loading: false,
  error: null,
  ...getInitialState(),

  // Actions
  loadTransactions: async () => {
    set({ loading: true, error: null });
    
    try {
      const transactions = await transactionRepository.findAll(get().filters);
      set({ transactions, loading: false });
      console.log(`✅ Loaded ${transactions.length} transactions`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load transactions';
      set({ error: errorMessage, loading: false });
      console.error('❌ Failed to load transactions:', error);
    }
  },

  addTransaction: async (request: CreateTransactionRequest) => {
    set({ loading: true, error: null });
    
    try {
      const newTransaction = await transactionRepository.create(request);
      
      // Add to current transactions if it matches current filters
      const currentTransactions = get().transactions;
      set({ 
        transactions: [newTransaction, ...currentTransactions],
        loading: false 
      });
      
      console.log('✅ Transaction added successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add transaction';
      set({ error: errorMessage, loading: false });
      console.error('❌ Failed to add transaction:', error);
      throw error;
    }
  },

  updateTransaction: async (id: string, updates: Partial<Transaction>) => {
    set({ loading: true, error: null });
    
    try {
      const updatedTransaction = await transactionRepository.update(id, updates);
      
      // Update in current transactions
      const transactions = get().transactions.map(t => 
        t.id === id ? updatedTransaction : t
      );
      
      set({ transactions, loading: false });
      console.log('✅ Transaction updated successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update transaction';
      set({ error: errorMessage, loading: false });
      console.error('❌ Failed to update transaction:', error);
      throw error;
    }
  },

  deleteTransaction: async (id: string) => {
    set({ loading: true, error: null });
    
    try {
      await transactionRepository.delete(id);
      
      // Remove from current transactions
      const transactions = get().transactions.filter(t => t.id !== id);
      set({ transactions, loading: false });
      
      console.log('✅ Transaction deleted successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete transaction';
      set({ error: errorMessage, loading: false });
      console.error('❌ Failed to delete transaction:', error);
      throw error;
    }
  },

  clearAllTransactions: async () => {
    console.log('🔘 Store: clearAllTransactions called');
    set({ loading: true, error: null });
    
    try {
      console.log('🔘 Store: Calling repository.clearAll()...');
      await transactionRepository.clearAll();
      
      console.log('🔘 Store: Setting transactions to empty array...');
      set({ transactions: [], loading: false });
      
      // Verify the database is actually cleared
      console.log('🔘 Store: Verifying database is cleared...');
      const remainingCount = await transactionRepository.getTotalCount();
      console.log('🔍 Store: Remaining transactions in DB:', remainingCount);
      
      if (remainingCount > 0) {
        throw new Error(`Database still contains ${remainingCount} transactions after clear operation`);
      }
      
      console.log('✅ All transactions deleted successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete all transactions';
      set({ error: errorMessage, loading: false });
      console.error('❌ Failed to delete all transactions:', error);
      throw error;
    }
  },

  setFilters: (newFilters: Partial<TransactionFilters>) => {
    const currentFilters = get().filters;
    
    // Check if we're explicitly removing the isIncome filter
    // This happens when the destructured object doesn't include isIncome
    const hasIsIncomeInNew = 'isIncome' in newFilters;
    const hasIsIncomeInCurrent = 'isIncome' in currentFilters && currentFilters.isIncome !== undefined;
    
    let updatedFilters: TransactionFilters;
    
    if (!hasIsIncomeInNew && hasIsIncomeInCurrent) {
      // We're removing the isIncome filter - create new object without it
      const { isIncome, ...filtersWithoutIncome } = currentFilters;
      updatedFilters = { ...filtersWithoutIncome, ...newFilters };
    } else {
      // Normal merge operation
      updatedFilters = { ...currentFilters, ...newFilters };
    }
    
    set({ filters: updatedFilters });
    
    // Save to URL
    updateUrlWithFilters(updatedFilters, get().selectedTimePeriod);
    
    // Automatically reload transactions with new filters
    get().loadTransactions();
  },

  setTimePeriod: (period: TimePeriod, dateRange: DateRange) => {
    set({ selectedTimePeriod: period });
    
    // Update filters and save to URL
    const updatedFilters = { ...get().filters, dateRange };
    set({ filters: updatedFilters });
    updateUrlWithFilters(updatedFilters, period);
    
    // Reload transactions
    get().loadTransactions();
  },

  toggleCategoryFilter: (category: string) => {
    const currentFilters = get().filters;
    const updatedFilters = {
      ...currentFilters,
      categories: currentFilters.categories?.includes(category)
        ? currentFilters.categories.filter((c) => c !== category)
        : [...(currentFilters.categories || []), category]
    };
    
    set({ filters: updatedFilters });
    
    // Save to URL
    updateUrlWithFilters(updatedFilters, get().selectedTimePeriod);
    
    get().loadTransactions();
  },

  clearFilters: () => {
    const defaultFilters = getDefaultFilters();
    const defaultPeriod = 'lastMonth' as TimePeriod;
    
    set({ 
      filters: defaultFilters,
      selectedTimePeriod: defaultPeriod
    });
    
    // Save to URL (this will clear the query params since filters are empty)
    updateUrlWithFilters(defaultFilters, defaultPeriod);
    
    get().loadTransactions();
  },

  refreshTransactions: async () => {
    await get().loadTransactions();
  },

  // Computed values
  get totalIncome() {
    return get().transactions
      .filter(t => t.isIncome)
      .reduce((sum, t) => sum + t.amount, 0);
  },

  get totalExpenses() {
    return get().transactions
      .filter(t => !t.isIncome)
      .reduce((sum, t) => sum + t.amount, 0);
  },

  getBalance: () => {
    const transactions = get().transactions;
    const income = transactions
      .filter(t => t.isIncome)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = transactions
      .filter(t => !t.isIncome)
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      income,
      expenses,
      total: income + expenses
    };
  },

  getFilteredTransactions: () => {
    return get().transactions;
  },

  getTotalCount: () => {
    return get().transactions.length;
  }
})); 