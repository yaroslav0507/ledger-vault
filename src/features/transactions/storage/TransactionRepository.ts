import { v4 as uuidv4 } from 'uuid';
import { db } from './TransactionDatabase';
import { 
  Transaction, 
  CreateTransactionRequest, 
  TransactionFilters 
} from '../model/Transaction';

export class TransactionRepository {
  
  async create(request: CreateTransactionRequest): Promise<Transaction> {
    const now = new Date().toISOString();
    
    const transaction: Transaction = {
      id: uuidv4(),
      date: request.date,
      card: request.card,
      amount: request.amount,
      currency: request.currency,
      description: request.description,
      category: request.category,
      comment: request.comment,
      isDuplicate: false,
      isIncome: request.isIncome,
      createdAt: now
    };

    await db.transactions.add(transaction);
    
    console.log('✅ Transaction created:', transaction.id);
    return transaction;
  }

  async findById(id: string): Promise<Transaction | null> {
    const transaction = await db.transactions.where('id').equals(id).first();
    return transaction || null;
  }

  private isDateInRange(date: string, start: string, end: string): boolean {
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    // Check if this is an "inverted" date range (winter format: start=2025-12-01&end=2025-02-31)
    // This happens when end month comes before start month in the same year
    if (startDate.getFullYear() === endDate.getFullYear() && 
        startDate.getMonth() > endDate.getMonth()) {
      
      // This is a year-spanning winter range
      // Convert end date to next year for proper comparison
      const adjustedEndDate = new Date(endDate.getFullYear() + 1, endDate.getMonth(), endDate.getDate());
      
      const transactionDate = new Date(date);
      
      // Transaction is in range if:
      // 1. It's >= start date in the current year, OR
      // 2. It's <= adjusted end date in the next year
      return transactionDate >= startDate || transactionDate <= adjustedEndDate;
    } else {
      // Normal date range comparison
      return date >= start && date <= end;
    }
  }

  async findAll(filters?: TransactionFilters): Promise<Transaction[]> {
    let query = db.transactions.orderBy('date').reverse();

    // Filter out archived transactions by default
    const includeArchived = filters?.includeArchived ?? false;
    if (!includeArchived) {
      query = query.filter(t => t.isArchived !== true);
    }

    if (filters) {
      // Apply date range filter
      if (filters.dateRange) {
        const { start, end } = filters.dateRange;
        query = query.filter(t => this.isDateInRange(t.date, start, end));
      }

      // Apply category filter
      if (filters.categories && filters.categories.length > 0) {
        const categoriesMode = filters.categoriesMode || 'include'; // Default to include mode
        query = query.filter(t => {
          const isInCategory = filters.categories!.includes(t.category);
          
          if (categoriesMode === 'include') {
            return isInCategory;
          } else {
            return !isInCategory; // exclude mode
          }
        });
      }

      // Apply card filter
      if (filters.cards && filters.cards.length > 0) {
        query = query.filter(t => filters.cards!.includes(t.card));
      }

      // Apply income/expense filter
      if (filters.isIncome !== undefined) {
        query = query.filter(t => t.isIncome === filters.isIncome);
      }

      // Apply amount range filter
      if (filters.amountRange) {
        query = query.filter(t => 
          t.amount >= filters.amountRange!.min && 
          t.amount <= filters.amountRange!.max
        );
      }

      // Apply search query
      if (filters.searchQuery) {
        const searchTerm = filters.searchQuery.toLowerCase();
        query = query.filter(t => {
          const descriptionMatch = t.description.toLowerCase().includes(searchTerm);
          const commentMatch = t.comment ? t.comment.toLowerCase().includes(searchTerm) : false;
          
          return descriptionMatch || commentMatch;
        });
      }
    }

    return await query.toArray();
  }

  async update(id: string, updates: Partial<Transaction>): Promise<Transaction> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Transaction with id ${id} not found`);
    }

    const updatedTransaction: Transaction = {
      ...existing,
      ...updates
    };

    await db.transactions.update(id, updatedTransaction);
    console.log('✅ Transaction updated:', id);
    return updatedTransaction;
  }

  async archive(id: string): Promise<Transaction> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Transaction with id ${id} not found`);
    }

    const archivedTransaction: Transaction = {
      ...existing,
      isArchived: true
    };

    await db.transactions.update(id, archivedTransaction);
    console.log('✅ Transaction archived:', id);
    return archivedTransaction;
  }

  async unarchive(id: string): Promise<Transaction> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Transaction with id ${id} not found`);
    }

    const unarchivedTransaction: Transaction = {
      ...existing,
      isArchived: false
    };

    await db.transactions.update(id, unarchivedTransaction);
    console.log('✅ Transaction unarchived:', id);
    return unarchivedTransaction;
  }

  async delete(id: string): Promise<void> {
    const deleted = await db.transactions.delete(id);
    const existing = await this.findById(id);
    if (existing !== null) {
      throw new Error(`Transaction with id ${id} could not be deleted`);
    }
    console.log('✅ Transaction deleted:', id);
  }

  async clearAll(): Promise<void> {
    try {
      const countBefore = await db.transactions.count();
      
      await db.transactions.clear();
      
      const countAfter = await db.transactions.count();
      
      if (countAfter > 0) {
        throw new Error(`Clear operation failed: ${countAfter} transactions remain in database`);
      }
      
      console.log('✅ All transactions cleared from database successfully');
    } catch (error) {
      console.error('❌ Repository: Error clearing transactions:', error);
      throw error;
    }
  }

  async getTotalCount(): Promise<number> {
    return await db.transactions.count();
  }

  async getBalance(): Promise<{ income: number; expenses: number; total: number }> {
    const transactions = await db.transactions.toArray();
    
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
      total: income - expenses
    };
  }

  async getCategoryTotals(): Promise<{ category: string; total: number; count: number }[]> {
    const transactions = await db.transactions.toArray();
    
    // Filter out archived transactions
    const activeTransactions = transactions.filter(t => t.isArchived !== true);
    
    const categoryMap = new Map<string, { total: number; count: number }>();

    activeTransactions.forEach(t => {
      const existing = categoryMap.get(t.category) || { total: 0, count: 0 };
      categoryMap.set(t.category, {
        total: existing.total + t.amount,
        count: existing.count + 1
      });
    });

    return Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      total: data.total,
      count: data.count
    }));
  }

  async getAllCardsForDateRange(dateRange?: { start: string; end: string }): Promise<string[]> {
    let query = db.transactions.orderBy('date');

    // Apply date range filter only (ignore other filters)
    if (dateRange) {
      const { start, end } = dateRange;
      query = query.filter(t => this.isDateInRange(t.date, start, end));
    }

    // Filter out archived transactions
    query = query.filter(t => t.isArchived !== true);

    const transactions = await query.toArray();
    
    // Extract unique cards
    const uniqueCards = Array.from(new Set(transactions.map(t => t.card)));
    
    return uniqueCards;
  }

  // Helper method to detect potential duplicates
  async findPotentialDuplicates(transaction: Partial<Transaction>): Promise<Transaction[]> {
    if (!transaction.date || !transaction.amount || !transaction.card) {
      return [];
    }

    return await db.transactions
      .where('[date+card]')
      .equals([transaction.date, transaction.card])
      .and(t => Math.abs(t.amount - transaction.amount!) < 1) // Allow for small rounding differences
      .toArray();
  }


}

// Export singleton instance
export const transactionRepository = new TransactionRepository(); 