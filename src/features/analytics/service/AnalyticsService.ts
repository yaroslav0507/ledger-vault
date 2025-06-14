import { Transaction } from '../../transactions/model/Transaction';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { formatCurrency } from '../../../shared/utils/currencyUtils';

export interface AnalyticsData {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  transactionCount: number;
  categoryBreakdown: CategoryData[];
  expenseCategories: CategoryData[];
  incomeCategories: CategoryData[];
  monthlyTrends: MonthlyTrendData[];
  topCategories: CategoryData[];
  topExpenseCategories: CategoryData[];
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
  '#2e7d32', // Income Green
  '#64748b', // Expense Slate
  '#1565c0', // Muted Blue
  '#00838f', // Muted Teal
  '#388e3c', // Muted Green
  '#bdbdbd', // Muted Gray
  '#ff9800', // Muted Orange
  '#6d4c41', // Muted Brown
  '#1976d2', // Muted Blue 2
  '#0097a7', // Muted Teal 2
  '#455a64', // Muted Blue Gray
  '#afb42b', // Muted Olive
  '#ffa726', // Muted Orange 2
  '#8d6e63', // Muted Brown 2
  '#90a4ae', // Muted Blue Gray 2
  '#cfd8dc', // Light Blue Gray
  '#5d4037', // Dark Brown
  '#789262', // Muted Olive Green
  '#607d8b', // Muted Slate Blue
  '#bcaaa4', // Light Brown
  '#c0ca33', // Muted Yellow Green
  '#a1887f', // Muted Taupe
  '#ffb300', // Muted Amber
  '#8bc34a', // Muted Light Green
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
        expenseCategories: [],
        incomeCategories: [],
        monthlyTrends: [],
        topCategories: [],
        topExpenseCategories: []
      };
    }

    const income = transactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = Math.abs(transactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + t.amount, 0));

    // Separate expense and income transactions
    const expenseTransactions = transactions.filter(t => t.amount < 0);
    const incomeTransactions = transactions.filter(t => t.amount > 0);

    // Calculate expense categories
    const expenseCategoryMap = new Map<string, { amount: number; count: number }>();
    expenseTransactions.forEach(transaction => {
      const category = transaction.category || 'Other';
      const existing = expenseCategoryMap.get(category) || { amount: 0, count: 0 };
      expenseCategoryMap.set(category, {
        amount: existing.amount + Math.abs(transaction.amount),
        count: existing.count + 1
      });
    });

    // Calculate income categories
    const incomeCategoryMap = new Map<string, { amount: number; count: number }>();
    incomeTransactions.forEach(transaction => {
      const category = transaction.category || 'Other';
      const existing = incomeCategoryMap.get(category) || { amount: 0, count: 0 };
      incomeCategoryMap.set(category, {
        amount: existing.amount + transaction.amount,
        count: existing.count + 1
      });
    });

    // Calculate overall categories (for backward compatibility)
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
    const totalExpenseAmount = Array.from(expenseCategoryMap.values())
      .reduce((sum, cat) => sum + cat.amount, 0);
    const totalIncomeAmount = Array.from(incomeCategoryMap.values())
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

    const expenseCategories: CategoryData[] = Array.from(expenseCategoryMap.entries())
      .map(([category, data], index) => ({
        category,
        amount: data.amount,
        percentage: totalExpenseAmount > 0 ? (data.amount / totalExpenseAmount) * 100 : 0,
        count: data.count,
        color: CATEGORY_COLORS[index % CATEGORY_COLORS.length]
      }))
      .sort((a, b) => b.amount - a.amount);

    const incomeCategories: CategoryData[] = Array.from(incomeCategoryMap.entries())
      .map(([category, data], index) => ({
        category,
        amount: data.amount,
        percentage: totalIncomeAmount > 0 ? (data.amount / totalIncomeAmount) * 100 : 0,
        count: data.count,
        color: CATEGORY_COLORS[index % CATEGORY_COLORS.length]
      }))
      .sort((a, b) => b.amount - a.amount);

    const monthlyTrends = this.calculateMonthlyTrends(transactions);
    const topCategories = categoryBreakdown.slice(0, 5);
    const topExpenseCategories = expenseCategories.slice(0, 5);

    return {
      totalIncome: income,
      totalExpenses: expenses,
      netIncome: income - expenses,
      transactionCount: transactions.length,
      categoryBreakdown,
      expenseCategories,
      incomeCategories,
      monthlyTrends,
      topCategories,
      topExpenseCategories
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

  static getInsights(data: AnalyticsData, currency: string = 'UAH'): string[] {
    const insights: string[] = [];

    if (data.netIncome > 0) {
      insights.push(`💰Positive cash flow of ${formatCurrency(data.netIncome, currency)} - Spending is ${formatCurrency(data.netIncome, currency)} less than income`);
    } else if (data.netIncome < 0) {
      insights.push(`⚠️Negative cash flow of ${formatCurrency(Math.abs(data.netIncome), currency)} - Spending exceeds income by this amount`);
    } else if (data.transactionCount > 0) {
      insights.push(`⚖️Balanced finances - Income exactly matches expenses this period`);
    }

    if (data.topExpenseCategories.length > 0) {
      const topExpenseCategory = data.topExpenseCategories[0];
      const percentage = topExpenseCategory.percentage.toFixed(1);
      insights.push(`📊Top spending category is "${topExpenseCategory.category}" accounting for ${percentage}% of all expenses (${formatCurrency(topExpenseCategory.amount, currency)})`);
      
      if (data.topExpenseCategories.length > 1) {
        const secondExpenseCategory = data.topExpenseCategories[1];
        const secondPercentage = secondExpenseCategory.percentage.toFixed(1);
        insights.push(`🥈Second highest expense category is "${secondExpenseCategory.category}" with ${secondPercentage}% of expenses (${formatCurrency(secondExpenseCategory.amount, currency)})`);
      }
    }

    if (data.monthlyTrends.length >= 2) {
      const lastMonth = data.monthlyTrends[data.monthlyTrends.length - 1];
      const prevMonth = data.monthlyTrends[data.monthlyTrends.length - 2];
      const trend = lastMonth.net - prevMonth.net;
      
      if (trend > 0) {
        insights.push(`📈Net income increased by ${formatCurrency(trend, currency)} compared to the previous month`);
      } else if (trend < 0) {
        insights.push(`📉Net income decreased by ${formatCurrency(Math.abs(trend), currency)} compared to the previous month`);
      } else {
        insights.push(`➡️Net income remained consistent with the previous month`);
      }
    }

    if (data.totalIncome > 0 && data.totalExpenses > 0) {
      const savingsRate = ((data.totalIncome - data.totalExpenses) / data.totalIncome) * 100;
      if (savingsRate > 20) {
        insights.push(`🎯Savings rate of ${savingsRate.toFixed(1)}% - Above the recommended 20% threshold`);
      } else if (savingsRate > 10) {
        insights.push(`💪Savings rate of ${savingsRate.toFixed(1)}% - Above 10% but below the optimal 20%`);
      } else if (savingsRate > 0) {
        insights.push(`🌱Savings rate of ${savingsRate.toFixed(1)}% - Positive but below typical recommendations`);
      }
    }

    // Average transaction insights
    if (data.transactionCount > 0) {
      const avgTransaction = (data.totalIncome + data.totalExpenses) / data.transactionCount;
      if (avgTransaction > 1000) {
        insights.push(`💳High-value transactions averaging ${formatCurrency(avgTransaction, currency)} per transaction`);
      } else if (avgTransaction < 100) {
        insights.push(`🛒Frequent small transactions averaging ${formatCurrency(avgTransaction, currency)} per transaction`);
      }
    }

    // Category concentration insights - use expense categories for spending concentration
    if (data.topExpenseCategories.length > 0 && data.topExpenseCategories[0].percentage > 50) {
      insights.push(`🎯Spending highly concentrated in "${data.topExpenseCategories[0].category}" at ${data.topExpenseCategories[0].percentage.toFixed(1)}% of total expenses`);
    }

    // Transaction volume insights
    if (data.transactionCount > 50) {
      insights.push(`📈High transaction volume with ${data.transactionCount} transactions this period`);
    } else if (data.transactionCount < 10 && data.transactionCount > 0) {
      insights.push(`📉Low transaction volume with only ${data.transactionCount} transactions this period`);
    }

    // Income vs expenses ratio insight
    if (data.totalIncome > 0 && data.totalExpenses > 0) {
      const expenseRatio = (data.totalExpenses / data.totalIncome) * 100;
      if (expenseRatio > 90) {
        insights.push(`⚠️High expense ratio at ${expenseRatio.toFixed(1)}% of income`);
      } else if (expenseRatio < 50) {
        insights.push(`💎Low expense ratio at ${expenseRatio.toFixed(1)}% of income`);
      }
    }

    return insights;
  }
} 