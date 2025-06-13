import React from 'react';
import { TimePeriodSelector } from './TimePeriodSelector';
import { useTransactionStore } from '../../../features/transactions/store/transactionStore';
import { TimePeriod, DateRange } from '../../utils/dateUtils';


export const AppHeader: React.FC = () => {
  const { 
    filters,
    selectedTimePeriod,
    setTimePeriod 
  } = useTransactionStore();

  const handlePeriodChange = (period: TimePeriod, dateRange: DateRange) => {
    setTimePeriod(period, dateRange);
  };

  return (
    <TimePeriodSelector 
        currentDateRange={filters.dateRange}
        selectedPeriod={selectedTimePeriod}
        onPeriodChange={handlePeriodChange}
    />
  );
};