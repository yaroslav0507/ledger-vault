import { Transaction } from '../../transactions/model/Transaction';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

export interface AnalyticsData {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  transactionCount: number;
  categoryBreakdown: CategoryData[];
  monthlyTrends: MonthlyTrendData[];
  topCategories: CategoryData[];
}

export interface CategoryData {
  category: string;
  amount: number;
  percentage: number;
  count: number;
  color: string;
}

export interface MonthlyTrendData {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

const CATEGORY_COLORS = [
  '#0353a4', '#023e7d', '#001845', '#002855', '#003d82',
  '#4361ee', '#7209b7', '#f72585', '#4cc9f0', '#4895ef',
  '#4361ee', '#3f37c9', '#7209b7', '#560bad', '#480ca8'
];

export class AnalyticsService {
  static calculateAnalytics(transactions: Transaction[]): AnalyticsData {
    if (!transactions.length) {
      return {
        totalIncome: 0,
        totalExpenses: 0,
        netIncome: 0,
        transactionCount: 0,
        categoryBreakdown: [],
        monthlyTrends: [],
        topCategories: []
      };
    }

    const income = transactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = Math.abs(transactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + t.amount, 0));

    const categoryMap = new Map<string, { amount: number; count: number }>();
    
    transactions.forEach(transaction => {
      const category = transaction.category || 'Other';
      const existing = categoryMap.get(category) || { amount: 0, count: 0 };
      categoryMap.set(category, {
        amount: existing.amount + Math.abs(transaction.amount),
        count: existing.count + 1
      });
    });

    const totalAmount = Array.from(categoryMap.values())
      .reduce((sum, cat) => sum + cat.amount, 0);

    const categoryBreakdown: CategoryData[] = Array.from(categoryMap.entries())
      .map(([category, data], index) => ({
        category,
        amount: data.amount,
        percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0,
        count: data.count,
        color: CATEGORY_COLORS[index % CATEGORY_COLORS.length]
      }))
      .sort((a, b) => b.amount - a.amount);

    const monthlyTrends = this.calculateMonthlyTrends(transactions);
    const topCategories = categoryBreakdown.slice(0, 5);

    return {
      totalIncome: income,
      totalExpenses: expenses,
      netIncome: income - expenses,
      transactionCount: transactions.length,
      categoryBreakdown,
      monthlyTrends,
      topCategories
    };
  }

  private static calculateMonthlyTrends(transactions: Transaction[]): MonthlyTrendData[] {
    const monthMap = new Map<string, { income: number; expenses: number }>();

    transactions.forEach(transaction => {
      const monthKey = format(new Date(transaction.date), 'yyyy-MM');
      const existing = monthMap.get(monthKey) || { income: 0, expenses: 0 };
      
      if (transaction.amount > 0) {
        existing.income += transaction.amount;
      } else {
        existing.expenses += Math.abs(transaction.amount);
      }
      
      monthMap.set(monthKey, existing);
    });

    return Array.from(monthMap.entries())
      .map(([monthKey, data]) => ({
        month: format(new Date(monthKey + '-01'), 'MMM yyyy'),
        income: data.income,
        expenses: data.expenses,
        net: data.income - data.expenses
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6);
  }

  static formatCurrency(amount: number, currency: string = 'UAH'): string {
    return new Intl.NumberFormat('uk-UA', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  static getInsights(data: AnalyticsData): string[] {
    const insights: string[] = [];

    if (data.netIncome > 0) {
      insights.push(`💰 Positive cash flow of ${this.formatCurrency(data.netIncome)}`);
    } else if (data.netIncome < 0) {
      insights.push(`⚠️ Negative cash flow of ${this.formatCurrency(Math.abs(data.netIncome))}`);
    }

    if (data.topCategories.length > 0) {
      const topCategory = data.topCategories[0];
      insights.push(`📊 Top spending category: ${topCategory.category} (${topCategory.percentage.toFixed(1)}%)`);
    }

    if (data.monthlyTrends.length >= 2) {
      const lastMonth = data.monthlyTrends[data.monthlyTrends.length - 1];
      const prevMonth = data.monthlyTrends[data.monthlyTrends.length - 2];
      const trend = lastMonth.net - prevMonth.net;
      
      if (trend > 0) {
        insights.push(`📈 Improving trend: +${this.formatCurrency(trend)} vs last month`);
      } else if (trend < 0) {
        insights.push(`📉 Declining trend: ${this.formatCurrency(trend)} vs last month`);
      }
    }

    return insights;
  }
} 