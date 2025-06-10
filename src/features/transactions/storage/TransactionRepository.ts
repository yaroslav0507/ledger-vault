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

  async findAll(filters?: TransactionFilters): Promise<Transaction[]> {
    let query = db.transactions.orderBy('date').reverse();

    if (filters) {
      // Apply date range filter
      if (filters.dateRange) {
        query = query.filter(t => 
          t.date >= filters.dateRange!.start && 
          t.date <= filters.dateRange!.end
        );
      }

      // Apply category filter
      if (filters.categories && filters.categories.length > 0) {
        query = query.filter(t => filters.categories!.includes(t.category));
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

  async delete(id: string): Promise<void> {
    const deleted = await db.transactions.delete(id);
    const existing = await this.findById(id);
    if (existing !== null) {
      throw new Error(`Transaction with id ${id} could not be deleted`);
    }
    console.log('✅ Transaction deleted:', id);
  }

  async clearAll(): Promise<void> {
    console.log('🔘 Repository: clearAll called');
    try {
      const countBefore = await db.transactions.count();
      console.log('🔍 Repository: Transactions before clear:', countBefore);
      
      await db.transactions.clear();
      
      const countAfter = await db.transactions.count();
      console.log('🔍 Repository: Transactions after clear:', countAfter);
      
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
  }

  async getCategoryTotals(): Promise<{ category: string; total: number; count: number }[]> {
    const transactions = await db.transactions.toArray();
    const categoryMap = new Map<string, { total: number; count: number }>();

    transactions.forEach(t => {
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