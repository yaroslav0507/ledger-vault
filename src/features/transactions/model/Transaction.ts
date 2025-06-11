export interface Transaction {
  id: string;
  date: string; // ISO 8601 (YYYY-MM-DDTHH:mm:ss) - now supports timestamps
  card: string;
  amount: number; // Amount in smallest currency unit (cents)
  currency: string; // ISO 4217 currency code
  description: string; // Single description field - simplified for POC
  category: string;
  comment?: string;
  isDuplicate: boolean;
  isIncome: boolean;
  isArchived?: boolean; // Soft delete flag - archived transactions are hidden but not deleted
  createdAt: string; // Simplified metadata - only keep creation timestamp
}

export interface TransactionFilters {
  dateRange?: {
    start: string;
    end: string;
  };
  categories?: string[];
  categoriesMode?: 'include' | 'exclude'; // Whether to include or exclude selected categories
  cards?: string[];
  amountRange?: {
    min: number;
    max: number;
  };
  isIncome?: boolean;
  searchQuery?: string;
  includeArchived?: boolean; // Whether to include archived transactions in results
}

export interface CreateTransactionRequest {
  date: string;
  card: string;
  amount: number;
  currency: string;
  description: string;
  category: string;
  comment?: string;
  isIncome: boolean;
}

export interface UpdateTransactionRequest {
  description?: string;
  amount?: number;
  card?: string;
  category?: string;
  comment?: string;
  isIncome?: boolean;
  date?: string;
  currency?: string;
  isArchived?: boolean; // Allow archiving/unarchiving via update
} 