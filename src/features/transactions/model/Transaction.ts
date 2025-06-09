export interface Transaction {
  id: string;
  date: string; // ISO 8601 (YYYY-MM-DD)
  card: string;
  amount: number; // Amount in smallest currency unit (cents)
  currency: string; // ISO 4217 currency code
  originalDescription: string;
  description: string;
  category: string;
  comment?: string;
  isDuplicate: boolean;
  isIncome: boolean;
  metadata: TransactionMetadata;
}

export interface TransactionMetadata {
  createdAt: string;
  updatedAt: string;
  importedAt?: string;
  importBatchId?: string;
  aiEnriched: boolean;
  aiEnrichedAt?: string;
  version: number;
  source: 'manual' | 'import' | 'api';
}

export interface TransactionFilters {
  dateRange?: {
    start: string;
    end: string;
  };
  categories?: string[];
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

// Default categories for our MVP
export const DEFAULT_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Travel',
  'Income',
  'Other'
] as const;

export type CategoryType = typeof DEFAULT_CATEGORIES[number]; 