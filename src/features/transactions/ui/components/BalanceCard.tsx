import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { formatCurrency } from '@/shared/utils/currencyUtils';
import { theme } from '@/shared/ui/theme/theme';

interface BalanceInfo {
  total: number;
  income: number;
  expenses: number;
}

interface BalanceCardProps {
  balance: BalanceInfo;
  transactionCount: number;
  currency?: string;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({ 
  balance, 
  transactionCount, 
  currency = 'USD' 
}) => {
  const [isBalanceMasked, setIsBalanceMasked] = useState(false);

  const toggleBalanceMask = () => {
    setIsBalanceMasked(!isBalanceMasked);
  };

  const maskAmount = (amount: number, currency: string) => {
    const formatted = formatCurrency(amount, currency);
    // Create a masked version that preserves the structure but hides the actual digits
    // Replace digits with asterisks but keep formatting characters like commas, periods, currency symbols
    return formatted.replace(/\d/g, '●');
  };

  const getDisplayAmount = (amount: number, currency: string) => {
    return isBalanceMasked ? maskAmount(amount, currency) : formatCurrency(amount, currency);
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
              {isBalanceMasked ? maskAmount(Math.abs(balance.total), currency) : formatCurrency(Math.abs(balance.total), currency)}
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
          <TouchableOpacity style={[styles.metricCard, styles.incomeCard]} activeOpacity={0.8}>
            <Text style={styles.metricIcon}>📈</Text>
            <View style={styles.metricContent}>
              <Text variant="bodySmall" style={styles.metricLabel}>Income</Text>
              <Text variant="bodyMedium" style={[
                styles.metricValue, 
                { color: '#2E7D32' },
                isBalanceMasked && styles.metricValueMasked
              ]}>
                {isBalanceMasked ? `+${maskAmount(balance.income, currency)}` : `+${formatCurrency(balance.income, currency)}`}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.metricCard, styles.expenseCard]} activeOpacity={0.8}>
            <Text style={styles.metricIcon}>📉</Text>
            <View style={styles.metricContent}>
              <Text variant="bodySmall" style={styles.metricLabel}>Expenses</Text>
              <Text variant="bodyMedium" style={[
                styles.metricValue, 
                { color: balance.expenses === 0 ? '#666' : '#64748B' },
                isBalanceMasked && styles.metricValueMasked
              ]}>
                {isBalanceMasked ? 
                  (balance.expenses === 0 ? 'None yet 🎉' : `-${maskAmount(balance.expenses, currency)}`) :
                  (balance.expenses === 0 ? 'None yet 🎉' : `-${formatCurrency(balance.expenses, currency)}`)
                }
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Enhanced Insights Row */}
        <View style={styles.insightsRow}>
          <Text style={styles.insightText}>
            💡 {transactionCount} transaction{transactionCount !== 1 ? 's' : ''} this month
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
    marginVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.md,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    overflow: 'hidden',
  },
  balanceContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  balanceHeader: {
    marginBottom: theme.spacing.md,
  },
  balanceMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  balanceLabel: {
    ...theme.typography.body,
    color: theme.colors.text.primary,
    fontWeight: '600',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  balanceAmount: {
    ...theme.typography.h2,
    fontSize: 28,
    fontWeight: '800',
    flex: 1,
    textAlign: 'center',
    letterSpacing: 0.8,
    marginHorizontal: theme.spacing.md,
  },
  balanceAmountMasked: {
    fontSize: 30,
    letterSpacing: 0.5,
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1.5,
    borderColor: '#E9ECEF',
    minWidth: 70,
  },
  trendIndicatorMasked: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  trendIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  metricCard: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    ...theme.shadows.sm,
    elevation: 2,
    minHeight: 70,
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
  metricIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  metricContent: {
    alignItems: 'center',
    gap: 2,
  },
  metricLabel: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    fontSize: 11,
    marginBottom: 2,
    fontWeight: '500',
  },
  metricValue: {
    ...theme.typography.body,
    fontWeight: '600',
    fontSize: 14,
  },
  metricValueMasked: {
    fontSize: 15,
    letterSpacing: 0.2,
  },
  insightsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
    gap: 4,
  },
  insightText: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
  },
}); 