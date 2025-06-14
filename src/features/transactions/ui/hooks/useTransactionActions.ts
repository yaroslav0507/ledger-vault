import { useState } from 'react';
import { Alert } from 'react-native';
import { useTransactionStore } from '../../store/transactionStore';
import { Transaction, CreateTransactionRequest, UpdateTransactionRequest } from '../../model/Transaction';
import { ImportResult } from '@/features/import/strategies/ImportStrategy';

export const useTransactionActions = (onEditTransaction?: (transaction: Transaction) => void) => {
  const { updateTransaction, loadTransactions, addTransaction, archiveTransaction, unarchiveTransaction } = useTransactionStore();
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [showSnackbar, setShowSnackbar] = useState(false);

  const showMessage = (message: string) => {
    setSnackbarMessage(message);
    setShowSnackbar(true);
  };

  const handleArchiveTransaction = async (transactionId: string) => {
    try {
      await archiveTransaction(transactionId);
      showMessage('Transaction archived successfully');
    } catch (error) {
      console.error('Failed to archive transaction:', error);
      throw error;
    }
  };

  const handleUnarchiveTransaction = async (transactionId: string) => {
    try {
      await unarchiveTransaction(transactionId);
      showMessage('Transaction restored successfully');
    } catch (error) {
      console.error('Failed to unarchive transaction:', error);
      throw error;
    }
  };

  const handleTransactionPress = (transaction: Transaction) => {
    if (onEditTransaction) {
      onEditTransaction(transaction);
    }
  };

  const handleUpdateTransaction = async (id: string, updates: UpdateTransactionRequest) => {
    try {
      await updateTransaction(id, updates);
      showMessage('Transaction updated successfully');
    } catch (error) {
      console.error('Failed to update transaction:', error);
      Alert.alert('Error', 'Failed to update transaction');
      throw error;
    }
  };

  const handleImportConfirm = async (transactions: Transaction[], ignoreDuplicates: boolean = false): Promise<boolean> => {
    try {
      let successCount = 0;
      let errorCount = 0;
      
      for (const transaction of transactions) {
        try {
          const { id, createdAt, isDuplicate, isArchived, ...createRequest } = transaction;
          await addTransaction(createRequest as CreateTransactionRequest);
          successCount++;
        } catch (error) {
          console.error('Failed to import transaction:', error);
          errorCount++;
          if (!ignoreDuplicates) {
            throw error;
          }
        }
      }
      
      if (errorCount > 0 && ignoreDuplicates) {
        showMessage(`Import completed: ${successCount} transactions imported, ${errorCount} duplicates ignored`);
      } else {
        showMessage(`Successfully imported ${successCount} transactions`);
      }
      
      return true;
    } catch (error) {
      console.error('Import failed:', error);
      showMessage('Failed to import transactions');
      return false;
    }
  };

  return {
    handleTransactionPress,
    handleUpdateTransaction,
    handleArchiveTransaction,
    handleUnarchiveTransaction,
    handleImportConfirm,
    snackbarMessage,
    showSnackbar,
    setShowSnackbar,
    showMessage
  };
}; 