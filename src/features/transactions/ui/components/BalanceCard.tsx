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
              💰 Balance
            </Text>
            <Text variant="headlineMedium" style={[
              styles.balanceAmount, 
              { color: balance.total >= 0 ? '#2E7D32' : '#D32F2F' },
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
              <Text style={[styles.trendText, { color: balance.total >= 0 ? '#2E7D32' : '#D32F2F' }]}>
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
                { color: balance.expenses === 0 ? '#666' : '#D32F2F' },
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
    marginVertical: 6,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
    elevation: 3,
    borderWidth: 0.5,
    borderColor: '#E0E0E0',
  },
  balanceContent: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  balanceHeader: {
    marginBottom: 10,
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
  },
  balanceAmount: {
    ...theme.typography.h2,
    fontSize: 24,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  balanceAmountMasked: {
    fontSize: 26,
    letterSpacing: 0.3,
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  trendIndicatorMasked: {
    backgroundColor: '#E8F4FD',
    borderColor: '#2196F3',
  },
  trendIcon: {
    fontSize: 14,
    marginRight: 3,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  metricCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    ...theme.shadows.sm,
    elevation: 1,
  },
  incomeCard: {
    borderColor: '#4CAF50',
    backgroundColor: '#F8FFF8',
  },
  expenseCard: {
    borderColor: '#FF5722',
    backgroundColor: '#FFFAFA',
  },
  metricIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  metricContent: {
    flex: 1,
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