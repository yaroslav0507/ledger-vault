import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { formatCurrency } from '@/shared/utils/currencyUtils';
import { theme } from '@/shared/ui/theme/theme';
import { TransactionFilters } from '../../model/Transaction';
import { getTimePeriodDisplayText } from '@/shared/utils/dateUtils';

interface BalanceInfo {
  total: number;
  income: number;
  expenses: number;
}

interface BalanceCardProps {
  balance: BalanceInfo;
  transactionCount: number;
  currency?: string;
  currentFilters?: TransactionFilters;
  onIncomeFilter?: () => void;
  onExpenseFilter?: () => void;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({ 
  balance, 
  transactionCount, 
  currency = 'USD', 
  currentFilters,
  onIncomeFilter,
  onExpenseFilter
}) => {
  const [isBalanceMasked, setIsBalanceMasked] = useState(false);

  const toggleBalanceMask = () => {
    setIsBalanceMasked(!isBalanceMasked);
  };

  const maskAmount = (amount: number, currency: string) => {
    // Simply return asterisks instead of preserving structure
    return '*****';
  };

  const getDisplayAmount = (amount: number, currency: string) => {
    return isBalanceMasked ? maskAmount(amount, currency) : formatCurrency(amount, currency);
  };

  const getTimePeriodText = () => {
    return getTimePeriodDisplayText(currentFilters);
  };

  return (
    <Card style={styles.balanceCard}>
      <Card.Content style={styles.balanceContent}>
        {/* Compact Header with Trend */}
        <View style={styles.balanceHeader}>
          <View style={styles.balanceMainRow}>
            <Text variant="bodyMedium" style={styles.balanceLabel}>
              💰 Cash Flow
            </Text>
            <Text variant="headlineMedium" style={[
              styles.balanceAmount, 
              { color: balance.total >= 0 ? '#2E7D32' : '#64748B' },
              isBalanceMasked && styles.balanceAmountMasked
            ]}>
              {isBalanceMasked ? maskAmount(Math.abs(balance.total), currency) : formatCurrency(balance.total, currency, 2)}
            </Text>
            <TouchableOpacity 
              style={[styles.trendIndicator, isBalanceMasked && styles.trendIndicatorMasked]} 
              onPress={toggleBalanceMask}
              activeOpacity={0.7}
            >
              <Text style={styles.trendIcon}>
                {isBalanceMasked ? '👁️' : (balance.total >= 0 ? '📈' : '📉')}
              </Text>
              <Text style={[styles.trendText, { color: balance.total >= 0 ? '#2E7D32' : '#64748B' }]}>
                {isBalanceMasked ? '***' : (
                  <>
                    {balance.total >= 0 ? '+' : ''}
                    {balance.income > 0 ? Math.round(((balance.total / balance.income) * 100)) : 0}%
                  </>
                )}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Compact Metrics Row */}
        <View style={styles.metricsRow}>
          <TouchableOpacity 
            style={[
              styles.metricCard, 
              styles.incomeCard,
              currentFilters?.isIncome === true && styles.metricCardActive
            ]} 
            activeOpacity={0.8}
            onPress={onIncomeFilter}
          >
            <Text style={styles.metricIcon}>📈</Text>
            <View style={styles.metricContent}>
              <Text variant="bodySmall" style={styles.metricLabel}>Income</Text>
              <Text variant="bodyMedium" style={[
                styles.metricValue, 
                { color: '#2E7D32' },
                isBalanceMasked && styles.metricValueMasked
              ]}>
                {isBalanceMasked ? `+${maskAmount(balance.income, currency)}` : `+${formatCurrency(balance.income, currency, 2)}`}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.metricCard, 
              styles.expenseCard,
              currentFilters?.isIncome === false && styles.metricCardActive
            ]} 
            activeOpacity={0.8}
            onPress={onExpenseFilter}
          >
            <Text style={styles.metricIcon}>📉</Text>
            <View style={styles.metricContent}>
              <Text variant="bodySmall" style={styles.metricLabel}>Expenses</Text>
              <Text variant="bodyMedium" style={[
                styles.metricValue, 
                { color: balance.expenses === 0 ? '#666' : '#64748B' },
                isBalanceMasked && styles.metricValueMasked
              ]}>
                {isBalanceMasked ? 
                  maskAmount(balance.expenses, currency) :
                  formatCurrency(balance.expenses, currency, 2)
                }
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Enhanced Insights Row */}
        <View style={styles.insightsRow}>
          <Text style={styles.insightText}>
            💡 {transactionCount} transaction{transactionCount !== 1 ? 's' : ''} {getTimePeriodText()}
          </Text>
          {balance.expenses === 0 && transactionCount > 0 && (
            <Text style={styles.insightText}>
              • All income transactions ✨
            </Text>
          )}
          {isBalanceMasked && (
            <Text style={styles.insightText}>
              • Tap 👁️ to show amounts
            </Text>
          )}
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  balanceCard: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.md,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    overflow: 'hidden',
  },
  balanceContent: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  balanceHeader: {
    marginBottom: theme.spacing.xs,
  },
  balanceMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceLabel: {
    ...theme.typography.body,
    color: theme.colors.text.primary,
    fontWeight: '600',
    fontSize: 15,
    letterSpacing: 0.3,
  },
  balanceAmount: {
    ...theme.typography.h2,
    fontSize: 20,
    fontWeight: '800',
    flex: 1,
    textAlign: 'center',
    letterSpacing: 0.8,
  },
  balanceAmountMasked: {
    fontSize: 26,
    letterSpacing: 0.5,
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1.5,
    borderColor: '#E9ECEF',
    minWidth: 65,
  },
  trendIndicatorMasked: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  trendIcon: {
    fontSize: 14,
    marginRight: 3,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  metricCard: {
    flex: 1,
    gap: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    ...theme.shadows.sm,
    elevation: 2,
    minHeight: 60,
    justifyContent: 'center',
  },
  incomeCard: {
    borderColor: '#4CAF50',
    backgroundColor: '#F1F8E9',
  },
  expenseCard: {
    borderColor: '#94A3B8',
    backgroundColor: '#F8FAFC',
  },
  metricCardActive: {
    borderColor: '#2196F3',
    backgroundColor: '#f0f7ff',
  },
  metricIcon: {
    fontSize: 36,
    marginTop: 2,
  },
  metricContent: {
    alignItems: 'flex-start',
    gap: 1,
  },
  metricLabel: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 1,
  },
  metricValue: {
    ...theme.typography.body,
    fontWeight: '600',
    fontSize: 13,
  },
  metricValueMasked: {
    fontSize: 14,
    letterSpacing: 0.2,
  },
  insightsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 3,
    marginTop: 2,
  },
  insightText: {
    fontSize: 10,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
  },
}); 