import { create } from 'zustand';
import { transactionRepository } from '../storage/TransactionRepository';
import { 
  Transaction, 
  CreateTransactionRequest, 
  TransactionFilters 
} from '../model/Transaction';

interface TransactionStore {
  // State
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  filters: TransactionFilters;
  
  // Actions
  loadTransactions: () => Promise<void>;
  addTransaction: (request: CreateTransactionRequest) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  setFilters: (filters: Partial<TransactionFilters>) => void;
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
  filters: {},

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

  setFilters: (newFilters: Partial<TransactionFilters>) => {
    const currentFilters = get().filters;
    const updatedFilters = { ...currentFilters, ...newFilters };
    set({ filters: updatedFilters });
    
    // Automatically reload transactions with new filters
    get().loadTransactions();
  },

  clearFilters: () => {
    set({ filters: {} });
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
      total: income - expenses
    };
  },

  getFilteredTransactions: () => {
    return get().transactions;
  },

  getTotalCount: () => {
    return get().transactions.length;
  }
})); 