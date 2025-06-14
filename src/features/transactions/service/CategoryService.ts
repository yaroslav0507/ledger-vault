import { Transaction } from '../model/Transaction';
import { db } from '../storage/TransactionDatabase';

class CategoryService {

  /**
   * Get all available categories from transactions within a specific date range
   */
  async getAllCategories(dateRange?: { start: string; end: string }): Promise<string[]> {
    let transactionCategories: string[] = [];
    
    if (dateRange) {
      const filteredTransactions = await db.transactions
        .where('date')
        .between(dateRange.start, dateRange.end, true, true)
        .toArray();
      
      transactionCategories = Array.from(new Set(
        filteredTransactions.map(t => t.category).filter(Boolean)
      ));
      
      console.log(`📋 Found ${transactionCategories.length} categories in date range:`, transactionCategories);
    } else {
      // Get categories from ALL transactions in database
      transactionCategories = await this.getTransactionCategories();
    }

    return transactionCategories.sort();
  }

  /**
   * Get distinct categories from transactions in database
   */
  async getTransactionCategories(): Promise<string[]> {
    const transactions = await db.transactions.toArray();
    const categories = Array.from(new Set(
      transactions.map((t: Transaction) => t.category).filter(Boolean)
    ));
    
    return categories.sort();
  }
}

export const categoryService = new CategoryService(); 