import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Transaction } from '../../model/Transaction';
import { formatCurrency } from '@/shared/utils/currencyUtils';
import { formatDateTime } from '@/shared/utils/dateUtils';
import { theme } from '@/shared/ui/theme/theme';

interface TransactionCardProps {
  transaction: Transaction;
  onPress?: () => void;
  onLongPress?: () => void;
}

export const TransactionCard: React.FC<TransactionCardProps> = React.memo(({
  transaction,
  onPress,
  onLongPress
}) => {
  const amountColor = transaction.isIncome ? theme.colors.income : theme.colors.expense;
  const amountPrefix = transaction.isIncome ? '+' : '-';
  const cardBackgroundColor = transaction.isIncome ? '#F0FDF4' : '#F8FAFC';
  const leftBorderColor = transaction.isIncome ? theme.colors.income : '#94A3B8';

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: cardBackgroundColor, borderLeftColor: leftBorderColor }]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Left Section - Transaction Info */}
        <View style={styles.leftSection}>
          {/* Primary Line - Description */}
          <Text style={styles.description} numberOfLines={1} ellipsizeMode="tail">
            {transaction.description}
          </Text>
          
          {/* Secondary Line - Metadata */}
          <View style={styles.metaRow}>
            <Text style={styles.date}>{formatDateTime(transaction.date)}</Text>
            <View style={styles.metaDivider} />
            <Text style={styles.card} numberOfLines={1} ellipsizeMode="tail">
              {transaction.card.slice(-9)}
            </Text>
            <View style={styles.metaDivider} />
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText} numberOfLines={1} ellipsizeMode="tail">
                {transaction.category}
              </Text>
            </View>
          </View>
        </View>
        
        {/* Right Section - Amount */}
        <View style={styles.rightSection}>
          <Text style={[styles.amount, { color: amountColor }]} numberOfLines={1}>
            {/* {amountPrefix} */}
            {formatCurrency(transaction.amount, transaction.currency)}
          </Text>
          <View style={[styles.incomeIndicator, { backgroundColor: amountColor }]}>
            <Text style={styles.incomeText}>
              {transaction.isIncome ? 'Income' : 'Expense'}
            </Text>
          </View>
        </View>
      </View>
      
      {/* Comments Section - Simplified */}
      {transaction.comment && (
        <View style={styles.commentSection}>
          <View style={styles.commentRow}>
            <Text style={styles.commentIcon}>💬</Text>
            <Text style={styles.comment} numberOfLines={2} ellipsizeMode="tail">
              {transaction.comment}
            </Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    marginVertical: theme.spacing.xs,
    marginHorizontal: theme.spacing.sm,
    borderLeftWidth: 4,
    borderRightWidth: 1,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderRightColor: '#F0F0F0',
    borderTopColor: '#F0F0F0',
    borderBottomColor: '#F0F0F0',
    ...theme.shadows.sm,
    overflow: 'hidden',
  },
  mainContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: theme.spacing.md,
    minHeight: 70,
  },
  leftSection: {
    flex: 1,
    marginRight: theme.spacing.md,
    justifyContent: 'space-between',
    minHeight: 42,
  },
  rightSection: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minWidth: 90,
    minHeight: 42,
    height: '100%',
  },
  description: {
    ...theme.typography.bodyLarge,
    color: theme.colors.text.primary,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  date: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    fontWeight: '500',
    fontSize: 11,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  metaDivider: {
    width: 1,
    height: 12,
    backgroundColor: theme.colors.border,
  },
  card: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    fontWeight: '500',
    fontSize: 11,
    maxWidth: 80,
  },
  categoryBadge: {
    backgroundColor: '#E8F4FD',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#B3D9FF',
  },
  categoryText: {
    ...theme.typography.caption,
    color: '#1976D2',
    fontWeight: '500',
    fontSize: 10,
  },
  amount: {
    ...theme.typography.h3,
    fontWeight: '700',
    fontSize: 18,
    textAlign: 'right',
    marginBottom: theme.spacing.xs,
    letterSpacing: 0.3,
  },
  incomeIndicator: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    minWidth: 50,
  },
  incomeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  commentSection: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#FAFAFA',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.xs,
  },
  commentIcon: {
    fontSize: 12,
    marginTop: 2,
  },
  comment: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
}); 