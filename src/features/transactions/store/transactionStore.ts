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
  try {
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
  } catch (error) {
    console.warn('Failed to load filters from URL:', error);
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
  selectedTimePeriod: TimePeriod | undefined;
  
  // Actions
  loadTransactions: () => Promise<void>;
  addTransaction: (request: CreateTransactionRequest) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  archiveTransaction: (id: string) => Promise<void>;
  unarchiveTransaction: (id: string) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  clearAllTransactions: () => Promise<void>;
  setFilters: (newFilters: Partial<TransactionFilters>) => void;
  setTimePeriod: (period: TimePeriod, dateRange: DateRange) => void;
  toggleCategoryFilter: (category: string) => void;
  clearFilters: () => void;
  refreshTransactions: () => Promise<void>;
  getAvailableCards: () => Promise<string[]>;
  
  // Computed values
  getBalance: () => { income: number; expenses: number; total: number };
}

export const useTransactionStore = create<TransactionStore>()((set, get) => {
  const initialState = getInitialState();
  
  return {
    // Initial state with safe defaults
    transactions: [],
    loading: false,
    error: null,
    filters: initialState.filters,
    selectedTimePeriod: initialState.selectedTimePeriod,

    // Actions
    loadTransactions: async () => {
      set({ loading: true, error: null });
      
      try {
        const currentState = get();
        const transactions = await transactionRepository.findAll(currentState.filters);
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
        const currentState = get();
        const currentTransactions = currentState.transactions || [];
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
        const currentState = get();
        const transactions = (currentState.transactions || []).map(t => 
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

    archiveTransaction: async (id: string) => {
      set({ loading: true, error: null });
      
      try {
        await transactionRepository.archive(id);
        
        // Remove archived transaction from current transactions list (since they should be hidden)
        const currentState = get();
        const transactions = (currentState.transactions || []).filter(t => t.id !== id);
        
        set({ transactions, loading: false });
        console.log('✅ Transaction archived successfully');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to archive transaction';
        set({ error: errorMessage, loading: false });
        console.error('❌ Failed to archive transaction:', error);
        throw error;
      }
    },

    unarchiveTransaction: async (id: string) => {
      set({ loading: true, error: null });
      try {
        await transactionRepository.unarchive(id);
        await get().loadTransactions();
        set({ loading: false });
        console.log('✅ Transaction unarchived successfully');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to unarchive transaction';
        set({ error: errorMessage, loading: false });
        console.error('❌ Failed to unarchive transaction:', error);
        throw error;
      }
    },

    deleteTransaction: async (id: string) => {
      set({ loading: true, error: null });
      
      try {
        await transactionRepository.delete(id);
        
        // Remove from current transactions
        const currentState = get();
        const transactions = (currentState.transactions || []).filter(t => t.id !== id);
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
      set({ loading: true, error: null });
      
      try {
        await transactionRepository.clearAll();
        set({ transactions: [], loading: false });
        
        // Verify the database is actually cleared
        const remainingCount = await transactionRepository.getTotalCount();
        
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
      const currentState = get();
      const currentFilters = currentState.filters || {};
      
      // Check if we're explicitly removing the isIncome filter
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
      try {
        updateUrlWithFilters(updatedFilters, currentState.selectedTimePeriod);
      } catch (error) {
        console.warn('Failed to update URL with filters:', error);
      }
      
      // Automatically reload transactions with new filters
      get().loadTransactions();
    },

    setTimePeriod: (period: TimePeriod, dateRange: DateRange) => {
      set({ selectedTimePeriod: period });
      
      // Update filters and save to URL
      const currentState = get();
      const updatedFilters = { ...(currentState.filters || {}), dateRange };
      set({ filters: updatedFilters });
      
      try {
        updateUrlWithFilters(updatedFilters, period);
      } catch (error) {
        console.warn('Failed to update URL with filters:', error);
      }
      
      // Reload transactions
      get().loadTransactions();
    },

    toggleCategoryFilter: (category: string) => {
      const currentState = get();
      const currentFilters = currentState.filters || {};
      const updatedFilters = {
        ...currentFilters,
        categories: currentFilters.categories?.includes(category)
          ? currentFilters.categories.filter((c) => c !== category)
          : [...(currentFilters.categories || []), category]
      };
      
      set({ filters: updatedFilters });
      
      // Save to URL
      try {
        updateUrlWithFilters(updatedFilters, currentState.selectedTimePeriod);
      } catch (error) {
        console.warn('Failed to update URL with filters:', error);
      }
      
      get().loadTransactions();
    },

    clearFilters: () => {
      const currentState = get();
      const { dateRange } = currentState.filters || {};
      const { selectedTimePeriod } = currentState;
      
      // Create new filters that only preserve the date range
      const clearedFilters: TransactionFilters = dateRange ? { dateRange } : {};
      
      set({ 
        filters: clearedFilters,
        // Keep the existing time period selection
        selectedTimePeriod: selectedTimePeriod
      });
      
      // Save to URL with preserved date range and time period
      try {
        updateUrlWithFilters(clearedFilters, selectedTimePeriod);
      } catch (error) {
        console.warn('Failed to update URL with filters:', error);
      }
      
      get().loadTransactions();
    },

    refreshTransactions: async () => {
      await get().loadTransactions();
    },

    getAvailableCards: async () => {
      const currentState = get();
      const { dateRange } = currentState.filters || {};
      
      try {
        // Get cards for the current date range only (ignoring other filters)
        const cards = await transactionRepository.getAllCardsForDateRange(dateRange);
        return cards;
      } catch (error) {
        console.error('❌ Failed to get available cards:', error);
        // Fallback to empty array
        return [];
      }
    },

    // Computed values
    getBalance: () => {
      const currentState = get();
      const transactions = currentState.transactions || [];
      
      // Filter out archived transactions
      const activeTransactions = transactions.filter(t => t.isArchived !== true);
      
      const income = activeTransactions
        .filter(t => t.isIncome)
        .reduce((sum, t) => sum + t.amount, 0);
      
      const expenses = activeTransactions
        .filter(t => !t.isIncome)
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        income,
        expenses,
        total: income + expenses
      };
    }
  };
}); 