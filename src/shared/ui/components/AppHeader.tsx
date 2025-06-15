import React, { useEffect, useState } from 'react';
import { TimePeriodSelector } from './TimePeriodSelector';
import { useTransactionStore } from '../../../features/transactions/store/transactionStore';
import { useAppContext } from '../../contexts/AppContext';
import { TimePeriod, DateRange } from '../../utils/dateUtils';

export const AppHeader: React.FC = () => {
  const { currentTabTitle } = useAppContext();
  const { 
    filters,
    selectedTimePeriod,
    setTimePeriod,
    getAvailableYears,
    transactions
  } = useTransactionStore();

  const [availableYears, setAvailableYears] = useState<number[]>([]);

  useEffect(() => {
    getAvailableYears().then(setAvailableYears);
  }, [getAvailableYears, transactions.length]);

  const handlePeriodChange = (period: TimePeriod, dateRange: DateRange) => {
    setTimePeriod(period, dateRange);
  };

  const shouldShowTimePeriodSelector = currentTabTitle !== 'settings';

  if (!shouldShowTimePeriodSelector) {
    return null;
  }

  return (
    <TimePeriodSelector 
      currentDateRange={filters.dateRange}
      selectedPeriod={selectedTimePeriod}
      onPeriodChange={handlePeriodChange}
      availableYears={availableYears}
    />
  );
};