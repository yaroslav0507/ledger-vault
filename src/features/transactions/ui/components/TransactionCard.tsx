import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Transaction } from '../../model/Transaction';
import { formatCurrency } from '@/shared/utils/currencyUtils';
import { formatDateShort } from '@/shared/utils/dateUtils';
import { theme } from '@/shared/ui/theme/theme';

interface TransactionCardProps {
  transaction: Transaction;
  onPress?: () => void;
  onLongPress?: () => void;
}

export const TransactionCard: React.FC<TransactionCardProps> = ({
  transaction,
  onPress,
  onLongPress
}) => {
  const amountColor = transaction.isIncome ? theme.colors.income : theme.colors.expense;
  const amountPrefix = transaction.isIncome ? '+' : '-';

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <Text style={styles.description} numberOfLines={1}>
            {transaction.description}
          </Text>
          <View style={styles.metaInfo}>
            <Text style={styles.date}>
              {formatDateShort(transaction.date)}
            </Text>
            <Text style={styles.separator}>•</Text>
            <Text style={styles.card}>{transaction.card}</Text>
            <Text style={styles.separator}>•</Text>
            <Text style={styles.category}>{transaction.category}</Text>
          </View>
        </View>
        
        <View style={styles.rightSection}>
          <Text style={[styles.amount, { color: amountColor }]}>
            {amountPrefix}{formatCurrency(transaction.amount, transaction.currency)}
          </Text>
        </View>
      </View>
      
      {transaction.comment && (
        <View style={styles.commentSection}>
          <Text style={styles.comment} numberOfLines={2}>
            💬 {transaction.comment}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginVertical: theme.spacing.xs,
    marginHorizontal: theme.spacing.md,
    ...theme.shadows.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  leftSection: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  description: {
    ...theme.typography.bodyLarge,
    color: theme.colors.text.primary,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
  },
  separator: {
    ...theme.typography.caption,
    color: theme.colors.text.disabled,
    marginHorizontal: theme.spacing.xs,
  },
  card: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  category: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  amount: {
    ...theme.typography.h3,
    fontWeight: 'bold',
  },
  commentSection: {
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  comment: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
  },
}); 