import { useState } from 'react';
import { Alert } from 'react-native';
import { useTransactionStore } from '../../store/transactionStore';
import { CreateTransactionRequest, DEFAULT_CATEGORIES } from '../../model/Transaction';
import { getCurrentDateISO } from '@/shared/utils/dateUtils';
import { parseCurrencyToSmallestUnit } from '@/shared/utils/currencyUtils';
import { Transaction } from '../../model/Transaction';
import { ImportResult } from '@/features/import/strategies/ImportStrategy';
import { importService } from '@/features/import/service/ImportService';

export const useTransactionActions = () => {
  const { addTransaction, deleteTransaction, loadTransactions } = useTransactionStore();
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [showSnackbar, setShowSnackbar] = useState(false);

  const showMessage = (message: string) => {
    setSnackbarMessage(message);
    setShowSnackbar(true);
  };

  const handleAddSampleTransaction = async () => {
    const sampleTransactions: CreateTransactionRequest[] = [
      {
        date: getCurrentDateISO(),
        card: 'Monzo',
        amount: parseCurrencyToSmallestUnit(25.50),
        currency: 'USD',
        description: 'Starbucks Coffee',
        category: DEFAULT_CATEGORIES[0], // Food & Dining
        comment: 'Morning coffee',
        isIncome: false
      },
      {
        date: getCurrentDateISO(),
        card: 'Santander',
        amount: parseCurrencyToSmallestUnit(3200.00),
        currency: 'USD',
        description: 'Salary Payment',
        category: DEFAULT_CATEGORIES[7], // Income
        comment: 'Monthly salary',
        isIncome: true
      },
      {
        date: getCurrentDateISO(),
        card: 'Revolut',
        amount: parseCurrencyToSmallestUnit(89.99),
        currency: 'USD',
        description: 'Amazon Purchase',
        category: DEFAULT_CATEGORIES[2], // Shopping
        isIncome: false
      },
      {
        date: getCurrentDateISO(),
        card: 'Chase',
        amount: parseCurrencyToSmallestUnit(45.00),
        currency: 'USD',
        description: 'Uber Ride',
        category: DEFAULT_CATEGORIES[1], // Transportation
        comment: 'To airport',
        isIncome: false
      },
      {
        date: getCurrentDateISO(),
        card: 'Amex',
        amount: parseCurrencyToSmallestUnit(120.00),
        currency: 'USD',
        description: 'Electric Bill',
        category: DEFAULT_CATEGORIES[4], // Bills & Utilities
        isIncome: false
      }
    ];

    try {
      // Add a random sample transaction
      const randomTransaction = sampleTransactions[Math.floor(Math.random() * sampleTransactions.length)];
      await addTransaction(randomTransaction);
      Alert.alert('Success', 'Sample transaction added!');
    } catch (error) {
      Alert.alert('Error', 'Failed to add transaction');
    }
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
    handleAddSampleTransaction,
    handleDeleteTransaction,
    handleTransactionPress,
    handleImportConfirm,
    snackbarMessage,
    showSnackbar,
    setShowSnackbar,
    showMessage
  };
}; 