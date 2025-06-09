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

  // Check if we have an original description that differs from the cleaned description
  const hasOriginalDescription = transaction.originalDescription && 
    transaction.originalDescription !== transaction.description &&
    transaction.originalDescription.length > 0;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <Text style={styles.description} numberOfLines={2} ellipsizeMode="tail">
            {transaction.category}
          </Text>
          <View style={styles.metaInfo}>
            <Text style={styles.date} numberOfLines={1} ellipsizeMode="tail">
              {formatDateShort(transaction.date)}
            </Text>
            <Text style={styles.separator}>•</Text>
            <Text style={styles.card} numberOfLines={1} ellipsizeMode="tail">{transaction.card}</Text>
          </View>
        </View>
        
        <View style={styles.rightSection}>
          <Text style={[styles.amount, { color: amountColor }]} numberOfLines={1} ellipsizeMode="tail">
            {amountPrefix}{formatCurrency(transaction.amount, transaction.currency)}
          </Text>
          <Text style={styles.category}>{transaction.description}</Text>
        </View>
      </View>
      
      {/* Display comments - either user comment or original description */}
      {(transaction.comment || hasOriginalDescription) && (
        <View style={styles.commentSection}>
          {transaction.comment && (
            <Text style={styles.comment} numberOfLines={2} ellipsizeMode="tail">
            💬 {transaction.comment}
          </Text>
          )}
          {hasOriginalDescription && (
            <Text style={styles.originalDescription} numberOfLines={2} ellipsizeMode="tail">
              📄 {transaction.originalDescription}
            </Text>
          )}
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
    ...theme.shadows.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 40,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    minHeight: 32,
    flex: 1,
  },
  leftSection: {
    flex: 1,
    marginRight: theme.spacing.md,
    minWidth: 0,
    maxWidth: '70%',
  },
  rightSection: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    flexShrink: 0,
    minWidth: 80,
    maxWidth: '30%',
  },
  description: {
    ...theme.typography.bodyLarge,
    color: theme.colors.text.primary,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
    lineHeight: 20,
    flexShrink: 1,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    minHeight: 16,
    overflow: 'hidden',
  },
  date: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    fontSize: 11,
    flexShrink: 0,
  },
  separator: {
    ...theme.typography.caption,
    color: theme.colors.text.disabled,
    marginHorizontal: theme.spacing.xs,
    fontSize: 11,
    flexShrink: 0,
  },
  card: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    fontWeight: '600',
    fontSize: 11,
    flex: 1,
    minWidth: 0,
  },
  category: {
    ...theme.typography.caption,
    color: theme.colors.secondary,
    marginTop: 2,
    textAlign: 'right',
  },
  amount: {
    ...theme.typography.h3,
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'right',
    flexShrink: 0,
  },
  commentSection: {
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: theme.spacing.xs,
  },
  comment: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
    fontSize: 12,
    lineHeight: 16,
  },
  originalDescription: {
    ...theme.typography.body,
    color: theme.colors.text.disabled,
    fontSize: 11,
    lineHeight: 15,
    fontFamily: 'monospace',
  },
}); 