import { useState } from 'react';
import { Alert } from 'react-native';
import { useTransactionStore } from '../../store/transactionStore';
import { Transaction, CreateTransactionRequest, UpdateTransactionRequest } from '../../model/Transaction';
import { WatermelonTransactionRepository } from '../../storage/WatermelonTransactionRepository';

// Create repository instance
const transactionRepository = new WatermelonTransactionRepository();

export const useTransactionActions = (onEditTransaction?: (transaction: Transaction) => void) => {
  const { updateTransaction, loadTransactions, archiveTransaction, unarchiveTransaction } = useTransactionStore();
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

  const handleImportConfirm = async (
    transactions: Transaction[],
    ignoreDuplicates = false
  ): Promise<boolean> => {
    try {
      const filtered = ignoreDuplicates
        ? transactions.filter((t) => !t.isDuplicate)
        : transactions;

      const createRequests: CreateTransactionRequest[] = filtered.map(
        ({ id, createdAt, isDuplicate, isArchived, ...rest }) => rest as CreateTransactionRequest
      );

      await transactionRepository.bulkCreate(createRequests);
      await loadTransactions();

      showMessage(
        `Successfully imported ${createRequests.length} transaction${
          createRequests.length === 1 ? '' : 's'
        }${ignoreDuplicates ? ' (duplicates skipped)' : ''}`
      );
      
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