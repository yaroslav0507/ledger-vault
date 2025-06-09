import { useState } from 'react';
import { Alert } from 'react-native';
import { useTransactionStore } from '../../store/transactionStore';
import { Transaction } from '../../model/Transaction';
import { ImportResult } from '@/features/import/strategies/ImportStrategy';
import { importService } from '@/features/import/service/ImportService';

export const useTransactionActions = () => {
  const { deleteTransaction, loadTransactions } = useTransactionStore();
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [showSnackbar, setShowSnackbar] = useState(false);

  const showMessage = (message: string) => {
    setSnackbarMessage(message);
    setShowSnackbar(true);
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    try {
      await deleteTransaction(transactionId);
      showMessage('Transaction deleted successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to delete transaction');
    }
  };

  const handleTransactionPress = (transactionId: string) => {
    Alert.alert(
      'Transaction Options',
      'What would you like to do?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => handleDeleteTransaction(transactionId)
        },
      ]
    );
  };

  const handleImportConfirm = async (transactions: Transaction[], ignoreDuplicates: boolean) => {
    try {
      // Save transactions to database
      await importService.saveTransactions(transactions, ignoreDuplicates);
      
      // Reload transactions to show the new ones
      await loadTransactions();
      
      const importedCount = ignoreDuplicates 
        ? transactions.filter(t => !t.isDuplicate).length
        : transactions.length;
      
      showMessage(`Successfully imported ${importedCount} transactions`);
      return true;
    } catch (error) {
      console.error('Save import error:', error);
      Alert.alert(
        'Import Error',
        error instanceof Error ? error.message : 'Failed to save transactions'
      );
      return false;
    }
  };

  return {
    handleDeleteTransaction,
    handleTransactionPress,
    handleImportConfirm,
    snackbarMessage,
    showSnackbar,
    setShowSnackbar,
    showMessage
  };
}; 