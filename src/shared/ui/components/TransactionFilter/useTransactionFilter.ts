import { useState, useCallback } from 'react';
import { TransactionFilters } from '../../../../features/transactions/model/Transaction';

interface UseTransactionFilterProps {
  filters: TransactionFilters;
  setFilters: (filters: Partial<TransactionFilters>) => void;
  clearFilters: () => void;
  availableCards: string[];
  transactions: any[];
}

export const useTransactionFilter = ({
  filters,
  setFilters,
  clearFilters,
  availableCards,
  transactions
}: UseTransactionFilterProps) => {
  const [showFiltersModal, setShowFiltersModal] = useState(false);

  const openFiltersModal = useCallback(() => {
    setShowFiltersModal(true);
  }, []);

  const closeFiltersModal = useCallback(() => {
    setShowFiltersModal(false);
  }, []);

  const handleApplyFilters = useCallback((newFilters: Partial<TransactionFilters>) => {
    setFilters(newFilters);
    closeFiltersModal();
  }, [setFilters, closeFiltersModal]);

  const handleClearFilters = useCallback(() => {
    clearFilters();
    closeFiltersModal();
  }, [clearFilters, closeFiltersModal]);

  return {
    showFiltersModal,
    openFiltersModal,
    closeFiltersModal,
    handleApplyFilters,
    handleClearFilters,
    modalProps: {
      visible: showFiltersModal,
      onClose: closeFiltersModal,
      currentFilters: filters,
      onApplyFilters: handleApplyFilters,
      onClearFilters: handleClearFilters,
      availableCards,
      transactions
    }
  };
}; 