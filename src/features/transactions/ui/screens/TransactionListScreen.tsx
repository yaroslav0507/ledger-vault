import React, { useEffect, useState } from 'react';
import { 
  View, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  SafeAreaView,
  StatusBar,
  ScrollView
} from 'react-native';
import { Card, Button, Portal, Snackbar, Text } from 'react-native-paper';
import { useTransactionStore } from '../../store/transactionStore';
import { TransactionCard } from '../components/TransactionCard';
import { AddTransactionModal } from '../components/AddTransactionModal';
import { TransactionFiltersModal } from '../components/TransactionFilters';
import { initializeDatabase } from '../../storage/TransactionDatabase';
import { CreateTransactionRequest, DEFAULT_CATEGORIES } from '../../model/Transaction';
import { getCurrentDateISO } from '@/shared/utils/dateUtils';
import { parseCurrencyToSmallestUnit, formatCurrency } from '@/shared/utils/currencyUtils';
import { theme } from '@/shared/ui/theme/theme';
import { ImportButton } from '@/features/import/ui/components/ImportButton';
import { ImportPreviewModal } from '@/features/import/ui/components/ImportPreviewModal';
// import { generateSampleTransactions } from '../../../../../tests/fixtures/transactionFixtures';
import { importService } from '@/features/import/service/ImportService';
import { ImportResult } from '@/features/import/strategies/ImportStrategy';
import { Transaction } from '../../model/Transaction';

export const TransactionListScreen: React.FC = () => {
  const { 
    transactions, 
    loading, 
    error, 
    filters,
    loadTransactions, 
    addTransaction, 
    deleteTransaction,
    setFilters,
    clearFilters,
    getBalance
  } = useTransactionStore();

  const [isInitialized, setIsInitialized] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importFileName, setImportFileName] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [showSnackbar, setShowSnackbar] = useState(false);
  
  const balance = getBalance();

  // Get unique cards for filter options
  const availableCards = Array.from(new Set(transactions.map(t => t.card)));

  useEffect(() => {
    const initApp = async () => {
      try {
        await initializeDatabase();
        await loadTransactions();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        Alert.alert('Error', 'Failed to initialize the app');
      }
    };

    initApp();
  }, [loadTransactions]);

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

  const handleDeleteTransaction = async (transactionId: string) => {
    try {
      await deleteTransaction(transactionId);
      setSnackbarMessage('Transaction deleted successfully');
      setShowSnackbar(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to delete transaction');
    }
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.categories?.length) count++;
    if (filters.cards?.length) count++;
    if (filters.isIncome !== undefined) count++;
    if (filters.searchQuery) count++;
    if (filters.dateRange?.start || filters.dateRange?.end) count++;
    return count;
  };

  const filteredTransactions = React.useMemo(() => {
    return transactions.filter(transaction => {
      // Category filter
      if (filters.categories && filters.categories.length > 0 && !filters.categories.includes(transaction.category)) {
        return false;
      }

      // Card filter
      if (filters.cards && filters.cards.length > 0 && !filters.cards.includes(transaction.card)) {
        return false;
      }

      // Income filter
      if (filters.isIncome !== undefined && transaction.isIncome !== filters.isIncome) {
        return false;
      }

      // Search filter
      if (filters.searchQuery) {
        const searchLower = filters.searchQuery.toLowerCase();
        const matchesDescription = transaction.description.toLowerCase().includes(searchLower);
        const matchesOriginal = transaction.originalDescription?.toLowerCase().includes(searchLower);
        const matchesComment = transaction.comment?.toLowerCase().includes(searchLower);
        
        if (!matchesDescription && !matchesOriginal && !matchesComment) {
          return false;
        }
      }

      // Date range filter
      if (filters.dateRange?.start && transaction.date < filters.dateRange.start) return false;
      if (filters.dateRange?.end && transaction.date > filters.dateRange.end) return false;

      return true;
    });
  }, [transactions, filters]);

  const activeFiltersCount = React.useMemo(() => {
    let count = 0;
    if (filters.categories && filters.categories.length > 0) count++;
    if (filters.cards && filters.cards.length > 0) count++;
    if (filters.isIncome !== undefined) count++;
    if (filters.searchQuery) count++;
    if (filters.dateRange?.start || filters.dateRange?.end) count++;
    return count;
  }, [filters]);

  const handleAddSampleTransactions = async () => {
    // const samples = generateSampleTransactions(5);
    // for (const transaction of samples) {
    //   await addTransaction(transaction);
    // }
  };

  const handleFileSelect = async (file: File) => {
    try {
      setIsImporting(true);
      
      // Convert browser File to ImportFile
      const importFile = await importService.createImportFileFromBrowser(file);
      
      // Preview the import
      const result = await importService.previewImport(importFile);
      
      setImportResult(result);
      setImportFileName(file.name);
      setShowImportModal(true);
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert(
        'Import Error',
        error instanceof Error ? error.message : 'Failed to process the file'
      );
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportConfirm = async (transactions: Transaction[], ignoreDuplicates: boolean) => {
    try {
      setIsImporting(true);
      
      // Save transactions to database
      await importService.saveTransactions(transactions, ignoreDuplicates);
      
      // Reload transactions to show the new ones
      await loadTransactions();
      
      // Close modal and show success message
      setShowImportModal(false);
      setImportResult(null);
      
      const importedCount = ignoreDuplicates 
        ? transactions.filter(t => !t.isDuplicate).length
        : transactions.length;
      
      setSnackbarMessage(`Successfully imported ${importedCount} transactions`);
      setShowSnackbar(true);
    } catch (error) {
      console.error('Save import error:', error);
      Alert.alert(
        'Import Error',
        error instanceof Error ? error.message : 'Failed to save transactions'
      );
    } finally {
      setIsImporting(false);
    }
  };

  if (!isInitialized) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Initializing LedgerVault...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>💰 LedgerVault</Text>
        <Text style={styles.subtitle}>Phase 2 Prototype</Text>
      </View>

      {/* Balance Summary */}
      <Card style={styles.balanceCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.balanceTitle}>
            Account Balance
          </Text>
          <Text variant="headlineMedium" style={[styles.balanceAmount, { color: balance.total >= 0 ? '#4CAF50' : '#F44336' }]}>
            {formatCurrency(Math.abs(balance.total))}
          </Text>
          <View style={styles.balanceBreakdown}>
            <View style={styles.balanceItem}>
              <Text variant="bodySmall" style={styles.balanceLabel}>Income</Text>
              <Text variant="bodyMedium" style={[styles.balanceValue, { color: '#4CAF50' }]}>
                +{formatCurrency(balance.income)}
              </Text>
            </View>
            <View style={styles.balanceItem}>
              <Text variant="bodySmall" style={styles.balanceLabel}>Expenses</Text>
              <Text variant="bodyMedium" style={[styles.balanceValue, { color: '#F44336' }]}>
                -{formatCurrency(balance.expenses)}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Button
          mode="contained"
          icon="plus"
          onPress={() => setShowAddModal(true)}
          style={styles.actionButton}
        >
          Add Transaction
        </Button>
        <ImportButton
          onFileSelect={handleFileSelect}
          loading={isImporting}
          label="Import Bank"
          icon="upload"
          style={styles.actionButton}
        />
        <Button
          mode="outlined"
          icon="database"
          onPress={handleAddSampleTransactions}
          style={styles.actionButton}
          disabled={true}
        >
          Add Samples
        </Button>
      </View>

      {/* Filter Controls */}
      <View style={styles.filterControls}>
        <Button
          mode="outlined"
          icon="filter"
          onPress={() => setShowFiltersModal(true)}
          style={styles.filterButton}
        >
          Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
        </Button>
        
        {activeFiltersCount > 0 && (
          <Button
            mode="text"
            onPress={() => setFilters({})}
            compact
          >
            Clear All
          </Button>
        )}
      </View>

      {/* Error Display */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>❌ {error}</Text>
        </View>
      )}

      {/* Transaction List */}
      <View style={styles.listContainer}>
        <Text style={styles.sectionTitle}>
          Transactions ({transactions.length})
        </Text>
        
        {filteredTransactions.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <Text variant="titleMedium" style={styles.emptyTitle}>
                {transactions.length === 0 ? 'No transactions yet' : 'No transactions match your filters'}
              </Text>
              <Text variant="bodyMedium" style={styles.emptyDescription}>
                {transactions.length === 0 
                  ? 'Add your first transaction or import bank statements to get started'
                  : 'Try adjusting your filters or clearing them to see more transactions'
                }
              </Text>
              {transactions.length === 0 && (
                <View style={styles.emptyActions}>
                  <Button 
                    mode="contained" 
                    icon="plus"
                    onPress={() => setShowAddModal(true)}
                    style={styles.emptyButton}
                  >
                    Add Transaction
                  </Button>
                  <ImportButton
                    onFileSelect={handleFileSelect}
                    loading={isImporting}
                    label="Import Bank File"
                    icon="upload"
                    style={styles.emptyButton}
                  />
                </View>
              )}
            </Card.Content>
          </Card>
        ) : (
          <View style={styles.transactionList}>
            {filteredTransactions.map((transaction) => (
              <TransactionCard
                key={transaction.id}
                transaction={transaction}
                onLongPress={() => handleTransactionPress(transaction.id)}
              />
            ))}
          </View>
        )}
      </View>

      {/* Modals */}
      <AddTransactionModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={addTransaction}
      />

      <TransactionFiltersModal
        visible={showFiltersModal}
        onClose={() => setShowFiltersModal(false)}
        currentFilters={filters}
        onApplyFilters={setFilters}
        availableCards={availableCards}
      />

      {/* Import Preview Modal */}
      <ImportPreviewModal
        visible={showImportModal}
        onDismiss={() => {
          setShowImportModal(false);
          setImportResult(null);
        }}
        onConfirm={handleImportConfirm}
        result={importResult}
        fileName={importFileName}
        isLoading={isImporting}
      />

      {/* Success Snackbar */}
      <Portal>
        <Snackbar
          visible={showSnackbar}
          onDismiss={() => setShowSnackbar(false)}
          duration={4000}
        >
          {snackbarMessage}
        </Snackbar>
      </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundSecondary,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...theme.typography.bodyLarge,
    color: theme.colors.text.secondary,
  },
  header: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.sm,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
  balanceCard: {
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.md,
  },
  balanceTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  balanceAmount: {
    ...theme.typography.h1,
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  balanceBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  balanceItem: {
    alignItems: 'center',
  },
  balanceLabel: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  balanceValue: {
    ...theme.typography.bodyLarge,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
    minHeight: 48,
    justifyContent: 'center',
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
  },
  filterControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  filterButton: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  errorContainer: {
    backgroundColor: theme.colors.error,
    margin: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  errorText: {
    ...theme.typography.body,
    color: theme.colors.text.inverse,
    textAlign: 'center',
  },
  listContainer: {
    flex: 1,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  emptyCard: {
    margin: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.md,
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  emptyDescription: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  emptyActions: {
    flexDirection: 'row',
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  emptyButton: {
    flex: 1,
    minHeight: 48,
    justifyContent: 'center',
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
  },
  transactionList: {
    flex: 1,
  },
}); 