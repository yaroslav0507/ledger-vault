import React from 'react';
import { TimePeriodSelector } from './TimePeriodSelector';
import { useTransactionStore } from '../../../features/transactions/store/transactionStore';
import { useAppContext } from '../../contexts/AppContext';
import { TimePeriod, DateRange } from '../../utils/dateUtils';

export const AppHeader: React.FC = () => {
  const { currentTabTitle } = useAppContext();
  const { 
    filters,
    selectedTimePeriod,
    setTimePeriod 
  } = useTransactionStore();

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
    />
  );
};