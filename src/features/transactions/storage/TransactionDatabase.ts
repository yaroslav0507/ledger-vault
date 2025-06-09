import Dexie, { Table } from 'dexie';
import { Transaction } from '../model/Transaction';

export class LedgerVaultDatabase extends Dexie {
  transactions!: Table<Transaction>;

  constructor() {
    super('LedgerVaultDB');
    
    // Initial schema
    this.version(1).stores({
      transactions: '++id, date, card, category, amount, isIncome, createdAt, importBatchId'
    });

    // Enhanced indexes for better performance
    this.version(2).stores({
      transactions: '++id, date, card, category, amount, isIncome, [date+card], [date+category], createdAt, importBatchId'
    });
  }
}

// Create and export database instance
export const db = new LedgerVaultDatabase();

// Helper function to ensure database is ready
export async function initializeDatabase(): Promise<void> {
  try {
    await db.open();
    console.log('✅ LedgerVault database initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    throw error;
  }
} 