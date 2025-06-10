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