import { Transaction } from '../../features/transactions/model/Transaction';

export class TransformationService {
  static normalizeTransactionData(rawData: any[]): Transaction[] {
    return rawData.map(item => ({
      id: item.id || this.generateId(),
      amount: parseFloat(item.amount) || 0,
      description: String(item.description || '').trim(),
      category: this.normalizeCategory(item.category),
      isIncome: this.determineTransactionType(item),
      date: this.parseDate(item.date),
      currency: item.currency || 'USD',
      card: item.card || 'Default',
      isDuplicate: false,
      comment: item.comment || '',
      createdAt: new Date().toISOString(),
      isArchived: false
    }));
  }
  
  private static generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
  
  private static normalizeCategory(category: any): string {
    if (!category) return 'Other';
    return String(category).trim().toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  
  private static determineTransactionType(item: any): boolean {
    if (typeof item.isIncome === 'boolean') return item.isIncome;
    if (item.type === 'income') return true;
    if (item.type === 'expense') return false;
    return item.amount > 0;
  }
  
  private static parseDate(date: any): string {
    if (!date) return new Date().toISOString();
    if (typeof date === 'string') return new Date(date).toISOString();
    if (date instanceof Date) return date.toISOString();
    return new Date().toISOString();
  }
} 