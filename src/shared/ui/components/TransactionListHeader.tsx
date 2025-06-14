import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Button } from 'react-native-paper';
import { BalanceCard } from '@/features/transactions/ui/components/BalanceCard';
import { ImportButton } from '@/features/import/ui/components/ImportButton';
import { theme } from '@/shared/ui/theme/theme';

export interface TransactionListHeaderProps {
  balance: {
    income: number;
    expenses: number;
    total: number;
  };
  transactionCount: number;
  currency: string;
  currentFilters: any;
  error?: string | null;
  onIncomeFilter: () => void;
  onExpenseFilter: () => void;
  onAddTransaction: () => void;
  onFileSelect: (file: File) => void;
  style?: ViewStyle;
  className?: string;
}

export const TransactionListHeader: React.FC<TransactionListHeaderProps> = ({
  balance,
  transactionCount,
  currency,
  currentFilters,
  error,
  onIncomeFilter,
  onExpenseFilter,
  onAddTransaction,
  onFileSelect,
  style,
  className,
  ...otherProps
}) => {
  return (
    <View style={[styles.container, style]} {...otherProps}>
      <BalanceCard 
        balance={balance} 
        transactionCount={transactionCount}
        currency={currency}
        currentFilters={currentFilters}
        onIncomeFilter={onIncomeFilter}
        onExpenseFilter={onExpenseFilter}
      />

      <View style={styles.actionButtons}>
        <Button
          mode="contained"
          icon="plus"
          onPress={onAddTransaction}
          style={styles.actionButton}
          labelStyle={styles.actionButtonLabel}
          contentStyle={styles.actionButtonContent}
        >
          Add Transaction
        </Button>

        <ImportButton 
          onFileSelect={onFileSelect} 
          style={styles.actionButton}
          contentStyle={styles.actionButtonContent}
          labelStyle={styles.actionButtonLabel}
        />
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    gap: theme.spacing.sm,
    alignItems: 'center',
  },
  actionButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
  },
  actionButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtonContent: {
    minHeight: 44,
    justifyContent: 'center',
  },
  errorContainer: {
    backgroundColor: theme.colors.error,
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  errorText: {
    ...theme.typography.body,
    color: theme.colors.text.inverse,
    textAlign: 'center',
  },
}); 