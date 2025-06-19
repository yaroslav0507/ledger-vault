import { Transaction } from '../../transactions/model/Transaction';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { formatCurrency } from '../../../shared/utils/currencyUtils';

const UKRAINIAN_MONTHS = [
  'Січ', 'Лют', 'Бер', 'Кві', 'Тра', 'Чер',
  'Лип', 'Сер', 'Вер', 'Жов', 'Лис', 'Гру'
];

const formatMonthLocalized = (date: Date, locale?: string): string => {
  if (locale === 'uk') {
    const month = date.getMonth();
    const year = date.getFullYear();
    return `${UKRAINIAN_MONTHS[month]} ${year}`;
  }
  return format(date, 'MMM yyyy');
};

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
  static calculateAnalytics(transactions: Transaction[], locale?: string): AnalyticsData {
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

    const monthlyTrends = this.calculateMonthlyTrends(transactions, locale);
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

  private static calculateMonthlyTrends(transactions: Transaction[], locale?: string): MonthlyTrendData[] {
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
        monthKey,
        month: formatMonthLocalized(new Date(monthKey + '-01'), locale),
        income: data.income,
        expenses: data.expenses,
        net: data.income - data.expenses
      }))
      .sort((a, b) => new Date(a.monthKey + '-01').getTime() - new Date(b.monthKey + '-01').getTime())
      .map(({ monthKey, ...rest }) => rest);
  }

  static getInsights(data: AnalyticsData, currency: string = 'UAH', t?: (key: string, options?: any) => string): string[] {
    const insights: string[] = [];

    if (data.netIncome > 0) {
      const amount = formatCurrency(data.netIncome, currency);
      const text = t ? t('analytics.insights.positiveCashFlow', { amount }) : `Positive cash flow of ${amount} - Spending is ${amount} less than income`;
      insights.push(`💰${text}`);
    } else if (data.netIncome < 0) {
      const amount = formatCurrency(Math.abs(data.netIncome), currency);
      const text = t ? t('analytics.insights.negativeCashFlow', { amount }) : `Negative cash flow of ${amount} - Spending exceeds income by this amount`;
      insights.push(`⚠️${text}`);
    } else if (data.transactionCount > 0) {
      const text = t ? t('analytics.insights.balancedFinances') : 'Balanced finances - Income exactly matches expenses this period';
      insights.push(`⚖️${text}`);
    }

    if (data.topExpenseCategories.length > 0) {
      const topExpenseCategory = data.topExpenseCategories[0];
      const percentage = topExpenseCategory.percentage.toFixed(1);
      const amount = formatCurrency(topExpenseCategory.amount, currency);
      const text = t ? t('analytics.insights.topSpendingCategory', { 
        category: topExpenseCategory.category, 
        percentage, 
        amount 
      }) : `Top spending category is "${topExpenseCategory.category}" accounting for ${percentage}% of all expenses (${amount})`;
      insights.push(`📊${text}`);
      
      if (data.topExpenseCategories.length > 1) {
        const secondExpenseCategory = data.topExpenseCategories[1];
        const secondPercentage = secondExpenseCategory.percentage.toFixed(1);
        const secondAmount = formatCurrency(secondExpenseCategory.amount, currency);
        const secondText = t ? t('analytics.insights.secondHighestExpenseCategory', { 
          category: secondExpenseCategory.category, 
          percentage: secondPercentage, 
          amount: secondAmount 
        }) : `Second highest expense category is "${secondExpenseCategory.category}" with ${secondPercentage}% of expenses (${secondAmount})`;
        insights.push(`🥈${secondText}`);
      }
    }

    if (data.monthlyTrends.length >= 2) {
      const lastMonth = data.monthlyTrends[data.monthlyTrends.length - 1];
      const prevMonth = data.monthlyTrends[data.monthlyTrends.length - 2];
      const trend = lastMonth.net - prevMonth.net;
      
      if (trend > 0) {
        const amount = formatCurrency(trend, currency);
        const text = t ? t('analytics.insights.netIncomeIncreased', { amount }) : `Net income increased by ${amount} compared to the previous month`;
        insights.push(`📈${text}`);
      } else if (trend < 0) {
        const amount = formatCurrency(Math.abs(trend), currency);
        const text = t ? t('analytics.insights.netIncomeDecreased', { amount }) : `Net income decreased by ${amount} compared to the previous month`;
        insights.push(`📉${text}`);
      } else {
        const text = t ? t('analytics.insights.netIncomeConsistent') : 'Net income remained consistent with the previous month';
        insights.push(`➡️${text}`);
      }
    }

    if (data.totalIncome > 0 && data.totalExpenses > 0) {
      const savingsRate = ((data.totalIncome - data.totalExpenses) / data.totalIncome) * 100;
      const rate = savingsRate.toFixed(1);
      if (savingsRate > 20) {
        const text = t ? t('analytics.insights.savingsRateExcellent', { rate }) : `Savings rate of ${rate}% - Above the recommended 20% threshold`;
        insights.push(`🎯${text}`);
      } else if (savingsRate > 10) {
        const text = t ? t('analytics.insights.savingsRateGood', { rate }) : `Savings rate of ${rate}% - Above 10% but below the optimal 20%`;
        insights.push(`💪${text}`);
      } else if (savingsRate > 0) {
        const text = t ? t('analytics.insights.savingsRatePositive', { rate }) : `Savings rate of ${rate}% - Positive but below typical recommendations`;
        insights.push(`🌱${text}`);
      }
    }

    // Average transaction insights
    if (data.transactionCount > 0) {
      const avgTransaction = (data.totalIncome + data.totalExpenses) / data.transactionCount;
      const amount = formatCurrency(avgTransaction, currency);
      if (avgTransaction > 1000) {
        const text = t ? t('analytics.insights.highValueTransactions', { amount }) : `High-value transactions averaging ${amount} per transaction`;
        insights.push(`💳${text}`);
      } else if (avgTransaction < 100) {
        const text = t ? t('analytics.insights.frequentSmallTransactions', { amount }) : `Frequent small transactions averaging ${amount} per transaction`;
        insights.push(`🛒${text}`);
      }
    }

    // Category concentration insights - use expense categories for spending concentration
    if (data.topExpenseCategories.length > 0 && data.topExpenseCategories[0].percentage > 50) {
      const category = data.topExpenseCategories[0].category;
      const percentage = data.topExpenseCategories[0].percentage.toFixed(1);
      const text = t ? t('analytics.insights.spendingHighlyConcentrated', { category, percentage }) : `Spending highly concentrated in "${category}" at ${percentage}% of total expenses`;
      insights.push(`🎯${text}`);
    }

    // Transaction volume insights
    if (data.transactionCount > 50) {
      const text = t ? t('analytics.insights.highTransactionVolume', { count: data.transactionCount }) : `High transaction volume with ${data.transactionCount} transactions this period`;
      insights.push(`📈${text}`);
    } else if (data.transactionCount < 10 && data.transactionCount > 0) {
      const text = t ? t('analytics.insights.lowTransactionVolume', { count: data.transactionCount }) : `Low transaction volume with only ${data.transactionCount} transactions this period`;
      insights.push(`📉${text}`);
    }

    // Income vs expenses ratio insight
    if (data.totalIncome > 0 && data.totalExpenses > 0) {
      const expenseRatio = (data.totalExpenses / data.totalIncome) * 100;
      const ratio = expenseRatio.toFixed(1);
      if (expenseRatio > 90) {
        const text = t ? t('analytics.insights.highExpenseRatio', { ratio }) : `High expense ratio at ${ratio}% of income`;
        insights.push(`⚠️${text}`);
      } else if (expenseRatio < 50) {
        const text = t ? t('analytics.insights.lowExpenseRatio', { ratio }) : `Low expense ratio at ${ratio}% of income`;
        insights.push(`💎${text}`);
      }
    }

    return insights;
  }
} 