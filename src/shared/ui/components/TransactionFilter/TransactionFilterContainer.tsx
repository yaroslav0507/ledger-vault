import React from 'react';
import { TransactionFilter } from './TransactionFilter';
import { useTransactionFilter } from './useTransactionFilter';
import { TransactionFiltersModal } from '../../../../features/transactions/ui/components/TransactionFilters';
import { TransactionFilters, Transaction } from '../../../../features/transactions/model/Transaction';

interface TransactionFilterContainerProps {
  transactionCount: number;
  totalTransactionCount: number;
  filters: TransactionFilters;
  setFilters: (filters: Partial<TransactionFilters>) => void;
  clearFilters: () => void;
  availableCards: string[];
  transactions: Transaction[];
}

export const TransactionFilterContainer: React.FC<TransactionFilterContainerProps> = ({
  transactionCount,
  totalTransactionCount,
  filters,
  setFilters,
  clearFilters,
  availableCards,
  transactions
}) => {
  const {
    openFiltersModal,
    modalProps
  } = useTransactionFilter({
    filters,
    setFilters,
    clearFilters,
    availableCards,
    transactions
  });

  return (
    <>
      <TransactionFilter
        transactionCount={transactionCount}
        totalTransactionCount={totalTransactionCount}
        filters={filters}
        onFiltersPress={openFiltersModal}
      />
      
      <TransactionFiltersModal {...modalProps} />
    </>
  );
}; 