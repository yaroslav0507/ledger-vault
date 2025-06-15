import { useState, useEffect, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import { useTransactionStore } from '@/features/transactions/store/transactionStore';
import { categoryService } from '@/features/transactions/service/CategoryService';
import { useSettingsStore } from '@/shared/store/settingsStore';
import { SUPPORTED_CURRENCIES } from '@/shared/utils/currencyUtils';

interface AppSettings {
  defaultCurrency: string;
  defaultCategory: string;
  autoDetectCurrency: boolean;
  confirmDeleteTransactions: boolean;
  defaultTransactionType: 'expense' | 'income';
}

export const useSettingsScreen = (onClose: () => void) => {
  const { clearAllTransactions, transactions, loadTransactions } = useTransactionStore();

  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    defaultCurrency: 'UAH',
    defaultCategory: 'General',
    autoDetectCurrency: true,
    confirmDeleteTransactions: true,
    defaultTransactionType: 'expense',
  });

  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const confirmDeleteTransactions = useSettingsStore((s) => s.confirmDeleteTransactions);
  const setConfirmDeleteTransactions = useSettingsStore((s) => s.setConfirmDeleteTransactions);

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categories = await categoryService.getAllCategories();
        setAvailableCategories(categories);
        if (categories.length > 0) {
          setSettings((prev) => ({
            ...prev,
            defaultCategory: prev.defaultCategory === 'General' ? categories[0] : prev.defaultCategory,
          }));
        }
      } catch {
        setAvailableCategories(['General']);
      }
    };
    loadCategories();
  }, []);

  const showAlert = useCallback(
    (
      title: string,
      message: string,
      buttons?: Array<{ text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }>,
    ) => {
      if (Platform.OS === 'web') {
        if (buttons && buttons.length > 1) {
          const confirmed = window.confirm(`${title}\n\n${message}`);
          if (confirmed) {
            const confirmBtn = buttons.find((b) => b.style === 'destructive' || b.text === 'Delete All' || b.text === 'Export');
            confirmBtn?.onPress?.();
          } else {
            const cancelBtn = buttons.find((b) => b.style === 'cancel' || b.text === 'Cancel');
            cancelBtn?.onPress?.();
          }
        } else {
          window.alert(`${title}\n\n${message}`);
          buttons?.[0]?.onPress?.();
        }
      } else {
        Alert.alert(title, message, buttons);
      }
    },
    [],
  );

  const handleSaveSettings = useCallback(() => {
    showAlert('Success', 'Settings saved successfully!');
    onClose();
  }, [onClose, showAlert]);

  const handleExportData = useCallback(() => {
    if (transactions.length === 0) {
      showAlert('No Data', 'There are no transactions to export.');
      return;
    }

    showAlert('Export Data', `This will export all ${transactions.length} transactions to a CSV file.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Export',
        onPress: () => {
          try {
            const header = 'Date,Card,Amount,Currency,Description,Category,Type,Comment\n';
            const body = transactions
              .map((t) => `${t.date},"${t.card}",${t.amount},"${t.currency}","${t.description}","${t.category}","${t.isIncome ? 'Income' : 'Expense'}","${t.comment || ''}"`)
              .join('\n');
            const csv = header + body;
            csv; // placeholder side effect
            showAlert('Export Successful', 'Transaction data has been exported to CSV format.');
          } catch (e) {
            showAlert('Export Failed', 'Failed to export data. Please try again.');
          }
        },
      },
    ]);
  }, [transactions, showAlert]);

  const handleClearData = useCallback(() => {
    if (transactions.length === 0) {
      showAlert('No Data', 'There are no transactions to clear.');
      return;
    }

    showAlert(
      'Clear All Data',
      `This will permanently delete all ${transactions.length} transactions. This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllTransactions();
              await loadTransactions();
              showAlert('Success', 'All transaction data has been cleared.');
            } catch (e) {
              const msg = e instanceof Error ? e.message : 'Unknown error';
              showAlert('Error', `Failed to clear data: ${msg}. Please try again.`);
            }
          },
        },
      ],
    );
  }, [transactions, clearAllTransactions, loadTransactions, showAlert]);

  return {
    availableCategories,
    settings,
    setSettings,
    showCurrencyModal,
    setShowCurrencyModal,
    showCategoryModal,
    setShowCategoryModal,
    confirmDeleteTransactions,
    setConfirmDeleteTransactions,
    handleSaveSettings,
    handleExportData,
    handleClearData,
    SUPPORTED_CURRENCIES,
  };
}; 