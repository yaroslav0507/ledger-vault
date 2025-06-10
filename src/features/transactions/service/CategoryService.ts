import { Transaction } from '../model/Transaction';
import { db } from '../storage/TransactionDatabase';

class CategoryService {

  /**
   * Get all available categories from transactions within a specific date range
   */
  async getAllCategories(dateRange?: { start: string; end: string }): Promise<string[]> {
    let transactionCategories: string[] = [];
    
    if (dateRange) {
      let filteredTransactions: Transaction[] = [];
      
      // Special handling for winter (Dec, Jan, Feb of current year)
      if (dateRange.start === 'WINTER_CURRENT_YEAR') {
        const targetYear = parseInt(dateRange.end);
        const allTransactions = await db.transactions.toArray();
        
        filteredTransactions = allTransactions.filter(t => {
          const transactionDate = new Date(t.date);
          const transactionYear = transactionDate.getFullYear();
          const transactionMonth = transactionDate.getMonth(); // 0-based: 0=Jan, 1=Feb, 11=Dec
          
          // Check if transaction is in December, January, or February of the target year
          const isWinterMonth = transactionMonth === 11 || transactionMonth === 0 || transactionMonth === 1;
          const isTargetYear = transactionYear === targetYear;
          
          return isWinterMonth && isTargetYear;
        });
      } else {
        // Normal date range filtering
        filteredTransactions = await db.transactions
          .where('date')
          .between(dateRange.start, dateRange.end, true, true)
          .toArray();
      }
      
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