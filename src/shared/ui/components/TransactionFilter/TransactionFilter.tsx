import React from 'react';
import { StickyHeader } from '../StickyHeader';
import { TransactionFilters } from '../../../../features/transactions/model/Transaction';
import { useTranslation } from '../../../i18n/useTranslation';

interface TransactionFilterProps {
  transactionCount: number;
  totalTransactionCount: number;
  filters: TransactionFilters;
  onFiltersPress: () => void;
  screenTitle?: string;
}

export const TransactionFilter: React.FC<TransactionFilterProps> = ({
  transactionCount,
  totalTransactionCount,
  filters,
  onFiltersPress,
  screenTitle,
}) => {
  const { t } = useTranslation();
  
  // Calculate active filters count
  const activeFiltersCount = React.useMemo(() => {
    let count = 0;
    if (filters.categories && filters.categories.length > 0) count += filters.categories.length;
    if (filters.cards && filters.cards.length > 0) count += filters.cards.length;
    if (filters.isIncome !== undefined) count++;
    if (filters.searchQuery) count++;
    return count;
  }, [filters]);

  // Generate title based on transaction count and filters
  const title = React.useMemo(() => {
    if (totalTransactionCount === 0) {
      return `${screenTitle} (0)`;
    }
    
    if (activeFiltersCount > 0) {
      return `${screenTitle} (${transactionCount}/${totalTransactionCount})`;
    }
    
    return `${screenTitle} (${transactionCount})`;
  }, [transactionCount, totalTransactionCount, activeFiltersCount, screenTitle]);

  return (
    <StickyHeader
      title={title}
      actionButton={{
        icon: '🔍',
        label: t('filters.title'),
        onPress: onFiltersPress,
        isActive: activeFiltersCount > 0,
        ...(activeFiltersCount > 0 && { activeCount: activeFiltersCount })
      }}
    />
  );
}; 