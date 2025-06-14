import React, { useCallback } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BalanceCard } from '@/features/transactions/ui/components/BalanceCard';
import { ActionButtonRow } from './ActionButtonRow';
import { ErrorDisplay } from './ErrorDisplay';
import { useTransactionStore } from '@/features/transactions/store/transactionStore';

export interface MetricsSummaryHeaderProps {
  balance: {
    income: number;
    expenses: number;
    total: number;
  };
  transactionCount: number;
  currency?: string;
  currentFilters?: any;
  error?: string | null;
  onAddTransaction?: () => void;
  onFileSelect?: (file: File) => void;
  style?: ViewStyle;
}

export const MetricsSummaryHeader: React.FC<MetricsSummaryHeaderProps> = ({
  balance,
  transactionCount,
  currency = 'USD',
  currentFilters,
  error,
  onAddTransaction,
  onFileSelect,
  style,
}) => {
  const { filters, setFilters } = useTransactionStore();

  const handleIncomeExpenseFilter = useCallback((filterValue: boolean | undefined) => {
    if (filters.isIncome === filterValue) {
      const { isIncome, ...filtersWithoutIncomeType } = filters;
      setFilters(filtersWithoutIncomeType);
    } else {
      setFilters({ ...filters, isIncome: filterValue });
    }
  }, [filters, setFilters]);

  const handleIncomeFilter = useCallback(() => {
    handleIncomeExpenseFilter(true);
  }, [handleIncomeExpenseFilter]);

  const handleExpenseFilter = useCallback(() => {
    handleIncomeExpenseFilter(false);
  }, [handleIncomeExpenseFilter]);

  return (
    <View style={[styles.container, style]}>
      <BalanceCard 
        balance={balance} 
        transactionCount={transactionCount}
        currency={currency}
        currentFilters={currentFilters}
        onIncomeFilter={handleIncomeFilter}
        onExpenseFilter={handleExpenseFilter}
      />

      <ActionButtonRow
        onAddTransaction={onAddTransaction}
        onFileSelect={onFileSelect}
      />

      <ErrorDisplay error={error} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
  },
});