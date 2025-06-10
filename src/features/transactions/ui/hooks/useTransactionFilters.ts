import { useMemo } from 'react';
import { Transaction } from '../../model/Transaction';
import { TransactionFilters } from '../../store/transactionStore';

export const useTransactionFilters = (transactions: Transaction[], filters: TransactionFilters) => {
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      // Category filter
      if (filters.categories && filters.categories.length > 0 && !filters.categories.includes(transaction.category)) {
        return false;
      }

      // Card filter
      if (filters.cards && filters.cards.length > 0 && !filters.cards.includes(transaction.card)) {
        return false;
      }

      // Income filter
      if (filters.isIncome !== undefined && transaction.isIncome !== filters.isIncome) {
        return false;
      }

      // Search filter
      if (filters.searchQuery) {
        const searchLower = filters.searchQuery.toLowerCase();
        const matchesDescription = transaction.description.toLowerCase().includes(searchLower);
        const matchesComment = transaction.comment?.toLowerCase().includes(searchLower);
        
        if (!matchesDescription && !matchesComment) {
          return false;
        }
      }

      // Date range filter
      if (filters.dateRange) {
        // Special handling for winter (Dec, Jan, Feb of current year)
        if (filters.dateRange.start === 'WINTER_CURRENT_YEAR') {
          const targetYear = parseInt(filters.dateRange.end);
          const transactionDate = new Date(transaction.date);
          const transactionYear = transactionDate.getFullYear();
          const transactionMonth = transactionDate.getMonth(); // 0-based: 0=Jan, 1=Feb, 11=Dec
          
          // Check if transaction is in December, January, or February of the target year
          const isWinterMonth = transactionMonth === 11 || transactionMonth === 0 || transactionMonth === 1; // Dec, Jan, Feb
          const isTargetYear = transactionYear === targetYear;
          
          if (!(isWinterMonth && isTargetYear)) {
            return false;
          }
        } else {
          // Normal date range filtering
          if (filters.dateRange.start && transaction.date < filters.dateRange.start) return false;
          if (filters.dateRange.end && transaction.date > filters.dateRange.end) return false;
        }
      }

      return true;
    });
  }, [transactions, filters]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.categories && filters.categories.length > 0) count++;
    if (filters.cards && filters.cards.length > 0) count++;
    if (filters.isIncome !== undefined) count++;
    if (filters.searchQuery) count++;
    if (filters.dateRange?.start || filters.dateRange?.end) count++;
    return count;
  }, [filters]);

  return {
    filteredTransactions,
    activeFiltersCount
  };
}; 