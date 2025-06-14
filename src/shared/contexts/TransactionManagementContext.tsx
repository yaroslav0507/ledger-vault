import React, { createContext, useContext, ReactNode } from 'react';
import { useTransactionManagement } from '@/features/transactions/ui/hooks/useTransactionManagement';

interface TransactionManagementContextType {
  transactionManagement: ReturnType<typeof useTransactionManagement>;
}

const TransactionManagementContext = createContext<TransactionManagementContextType | undefined>(undefined);

interface TransactionManagementProviderProps {
  children: ReactNode;
}

export const TransactionManagementProvider: React.FC<TransactionManagementProviderProps> = ({ children }) => {
  const transactionManagement = useTransactionManagement();

  return (
    <TransactionManagementContext.Provider value={{ transactionManagement }}>
      {children}
    </TransactionManagementContext.Provider>
  );
};

export const useTransactionManagementContext = () => {
  const context = useContext(TransactionManagementContext);
  if (context === undefined) {
    throw new Error('useTransactionManagementContext must be used within a TransactionManagementProvider');
  }
  return context.transactionManagement;
}; 