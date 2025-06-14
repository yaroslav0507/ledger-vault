import { Transaction } from '../model/Transaction';
import { db } from '../storage/TransactionDatabase';

class CategoryService {

  private isDateInRange(date: string, start: string, end: string): boolean {
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    // Check if this is an "inverted" date range (winter format: start=2025-12-01&end=2025-02-28)
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

  /**
   * Get all available categories from transactions within a specific date range
   */
  async getAllCategories(dateRange?: { start: string; end: string }): Promise<string[]> {
    let transactionCategories: string[] = [];
    
    if (dateRange) {
      // Use the same date filtering logic as TransactionRepository
      const filteredTransactions = await db.transactions
        .toArray()
        .then(transactions => 
          transactions.filter(t => this.isDateInRange(t.date, dateRange.start, dateRange.end))
        );
      
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