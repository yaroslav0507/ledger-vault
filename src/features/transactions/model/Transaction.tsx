export interface Transaction {
  id: string;
  date: string; // ISO 8601 (YYYY-MM-DDTHH:mm:ss) - now supports timestamps
  card: string;
  amount: number; // Amount in smallest currency unit (cents)
  currency: string; // ISO 4217 currency code
  description: string;
  category: string;
  comment?: string;
  isDuplicate: boolean;
  isIncome: boolean;
  createdAt: string;
} 