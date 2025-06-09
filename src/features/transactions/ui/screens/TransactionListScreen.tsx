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
// import { realBankParser } from '../../../../../tests/fixtures/realBankStatementParser';
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
    // Generate realistic samples based on Ukrainian bank statement patterns
    const realisticSamples = generateRealisticUkrainianTransactions(5);
    
    try {
      for (const transaction of realisticSamples) {
        await addTransaction(transaction);
      }
      setSnackbarMessage(`Successfully added ${realisticSamples.length} sample transactions`);
      setShowSnackbar(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to add sample transactions');
    }
  };

  const generateRealisticUkrainianTransactions = (count: number): CreateTransactionRequest[] => {
    // Real Ukrainian bank transaction patterns based on the provided bank statement
    const templates = [
      {
        description: 'ATM Withdrawal',
        amount: 500,
        category: DEFAULT_CATEGORIES[8], // Other
        card: 'PrivatBank',
        isIncome: false,
        comment: 'Cash withdrawal'
      },
      {
        description: 'Grocery Store',
        amount: 245.50,
        category: DEFAULT_CATEGORIES[0], // Food & Dining
        card: 'Monobank',
        isIncome: false,
        comment: 'Weekly groceries'
      },
      {
        description: 'Salary Transfer',
        amount: 35000,
        category: DEFAULT_CATEGORIES[7], // Income
        card: 'PrivatBank',
        isIncome: true,
        comment: 'Monthly salary'
      },
      {
        description: 'Mobile Payment',
        amount: 199,
        category: DEFAULT_CATEGORIES[4], // Bills & Utilities
        card: 'Monobank',
        isIncome: false,
        comment: 'Mobile plan'
      },
      {
        description: 'Coffee Shop',
        amount: 65,
        category: DEFAULT_CATEGORIES[0], // Food & Dining
        card: 'PUMB',
        isIncome: false,
        comment: 'Morning coffee'
      },
      {
        description: 'Taxi Ride',
        amount: 85,
        category: DEFAULT_CATEGORIES[1], // Transportation
        card: 'Monobank',
        isIncome: false,
        comment: 'To office'
      },
      {
        description: 'Online Purchase',
        amount: 1250,
        category: DEFAULT_CATEGORIES[2], // Shopping
        card: 'PrivatBank',
        isIncome: false,
        comment: 'Electronics'
      },
      {
        description: 'Utility Payment',
        amount: 850,
        category: DEFAULT_CATEGORIES[4], // Bills & Utilities
        card: 'PrivatBank',
        isIncome: false,
        comment: 'Electricity bill'
      },
      {
        description: 'Gas Station',
        amount: 750,
        category: DEFAULT_CATEGORIES[1], // Transportation
        card: 'PUMB',
        isIncome: false,
        comment: 'Car fuel'
      },
      {
        description: 'Freelance Payment',
        amount: 15000,
        category: DEFAULT_CATEGORIES[7], // Income
        card: 'Monobank',
        isIncome: true,
        comment: 'Web development'
      }
    ];

    const cards = ['PrivatBank', 'Monobank', 'PUMB', 'Raiffeisen', 'OschadBank'];
    const samples: CreateTransactionRequest[] = [];

    for (let i = 0; i < count; i++) {
      const template = templates[Math.floor(Math.random() * templates.length)];
      
      // Add realistic date variation (last 60 days)
      const daysAgo = Math.floor(Math.random() * 60);
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      
      // Add amount variation (±30%)
      const variance = 0.7 + (Math.random() * 0.6); // 0.7 to 1.3
      const amount = Math.round(template.amount * variance * 100) / 100;
      
      const transaction: CreateTransactionRequest = {
        date: date.toISOString().split('T')[0],
        card: cards[Math.floor(Math.random() * cards.length)],
        amount: parseCurrencyToSmallestUnit(amount),
        currency: 'USD',
        description: template.description,
        category: template.category,
        comment: template.comment,
        isIncome: template.isIncome
      };
      
      samples.push(transaction);
    }

    return samples;
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
        <Card.Content style={styles.balanceContent}>
          {/* Compact Header with Trend */}
          <View style={styles.balanceHeader}>
            <View style={styles.balanceMainRow}>
              <Text variant="bodyMedium" style={styles.balanceLabel}>
                💰 Balance
              </Text>
              <Text variant="headlineMedium" style={[styles.balanceAmount, { color: balance.total >= 0 ? '#2E7D32' : '#D32F2F' }]}>
                {formatCurrency(Math.abs(balance.total))}
              </Text>
              <View style={styles.trendIndicator}>
                <Text style={styles.trendIcon}>
                  {balance.total >= 0 ? '📈' : '📉'}
                </Text>
                <Text style={[styles.trendText, { color: balance.total >= 0 ? '#2E7D32' : '#D32F2F' }]}>
                  {balance.total >= 0 ? '+' : ''}
                  {balance.income > 0 ? Math.round(((balance.total / balance.income) * 100)) : 0}%
                </Text>
              </View>
            </View>
          </View>

          {/* Compact Metrics Row */}
          <View style={styles.metricsRow}>
            <TouchableOpacity style={[styles.metricCard, styles.incomeCard]} activeOpacity={0.8}>
              <Text style={styles.metricIcon}>📈</Text>
              <View style={styles.metricContent}>
                <Text variant="bodySmall" style={styles.metricLabel}>Income</Text>
                <Text variant="bodyMedium" style={[styles.metricValue, { color: '#2E7D32' }]}>
                  +{balance.income > 999 ? `$${(balance.income/1000).toFixed(1)}K` : formatCurrency(balance.income)}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.metricCard, styles.expenseCard]} activeOpacity={0.8}>
              <Text style={styles.metricIcon}>📉</Text>
              <View style={styles.metricContent}>
                <Text variant="bodySmall" style={styles.metricLabel}>Expenses</Text>
                <Text variant="bodyMedium" style={[styles.metricValue, { color: balance.expenses === 0 ? '#666' : '#D32F2F' }]}>
                  {balance.expenses === 0 ? 'None yet 🎉' : `-${balance.expenses > 999 ? `$${(balance.expenses/1000).toFixed(1)}K` : formatCurrency(balance.expenses)}`}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Enhanced Insights Row */}
          <View style={styles.insightsRow}>
            <Text style={styles.insightText}>
              💡 {transactions.length} transaction{transactions.length !== 1 ? 's' : ''} this month
            </Text>
            {balance.expenses === 0 && transactions.length > 0 && (
              <Text style={styles.insightText}>
                • All income transactions ✨
              </Text>
            )}
          </View>
        </Card.Content>
      </Card>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {/* First Row - Main Actions */}
        <View style={styles.actionRow}>
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

        {/* Second Row - Quick Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.quickActionButton, styles.detailsButton]} activeOpacity={0.8}>
            <View style={styles.buttonGradient}>
              <Text style={styles.buttonIcon}>📊</Text>
              <Text style={styles.buttonLabel}>Details</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.quickActionButton, styles.goalsButton]} activeOpacity={0.8}>
            <View style={styles.buttonGradient}>
              <Text style={styles.buttonIcon}>🎯</Text>
              <Text style={styles.buttonLabel}>Goals</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.quickActionButton, styles.periodButton]} activeOpacity={0.8}>
            <View style={styles.buttonGradient}>
              <Text style={styles.buttonIcon}>📅</Text>
              <Text style={styles.buttonLabel}>This Month</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Error Display */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>❌ {error}</Text>
        </View>
      )}

      {/* Transaction List */}
      <View style={styles.listContainer}>
        <View style={styles.transactionHeader}>
          <Text style={styles.sectionTitle}>
            Transactions ({filteredTransactions.length})
          </Text>
          
          <TouchableOpacity 
            style={[styles.headerFiltersButton, activeFiltersCount > 0 && styles.filtersButtonActive]}
            onPress={() => setShowFiltersModal(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonIcon}>🔍</Text>
            <Text style={styles.headerFilterLabel}>
              Filters{activeFiltersCount > 0 && ` (${activeFiltersCount})`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Active Filters Summary */}
        {activeFiltersCount > 0 && (
          <View style={styles.headerActiveFiltersRow}>
            <View style={styles.filtersBadge}>
              <Text style={styles.activeFiltersText}>
                ✨ {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} applied
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setFilters({})}
              style={styles.clearFiltersButton}
              activeOpacity={0.8}
            >
              <Text style={styles.clearFiltersText}>✕ Clear</Text>
            </TouchableOpacity>
          </View>
        )}
        
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
          <ScrollView 
            style={styles.transactionList}
            contentContainerStyle={styles.transactionListContent}
            showsVerticalScrollIndicator={true}
          >
            {filteredTransactions.map((transaction) => (
              <TransactionCard
                key={transaction.id}
                transaction={transaction}
                onLongPress={() => handleTransactionPress(transaction.id)}
              />
            ))}
          </ScrollView>
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
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.sm,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.text.primary,
    textAlign: 'center',
    fontSize: 22,
  },
  subtitle: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
  balanceCard: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.md,
    marginVertical: 6,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
    elevation: 3,
    borderWidth: 0.5,
    borderColor: '#E0E0E0',
  },
  balanceContent: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  balanceHeader: {
    marginBottom: 10,
  },
  balanceMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceLabel: {
    ...theme.typography.body,
    color: theme.colors.text.primary,
    fontWeight: '600',
    fontSize: 15,
  },
  balanceAmount: {
    ...theme.typography.h2,
    fontSize: 24,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  trendIcon: {
    fontSize: 14,
    marginRight: 3,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  metricCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    ...theme.shadows.sm,
    elevation: 1,
  },
  incomeCard: {
    borderColor: '#4CAF50',
    backgroundColor: '#F8FFF8',
  },
  expenseCard: {
    borderColor: '#FF5722',
    backgroundColor: '#FFFAFA',
  },
  metricIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  metricContent: {
    flex: 1,
  },
  metricLabel: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    fontSize: 11,
    marginBottom: 2,
    fontWeight: '500',
  },
  metricValue: {
    ...theme.typography.body,
    fontWeight: '600',
    fontSize: 14,
  },
  insightsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
    gap: 4,
  },
  insightText: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
  },
  quickActionsCard: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.md,
    marginVertical: 6,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
    elevation: 3,
    borderWidth: 0.5,
    borderColor: '#E0E0E0',
  },
  quickActionsContent: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  detailsButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    minHeight: 44,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    ...theme.shadows.sm,
  },
  goalsButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    minHeight: 44,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    ...theme.shadows.sm,
  },
  periodButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    minHeight: 44,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    ...theme.shadows.sm,
  },
  filtersButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    minHeight: 44,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    ...theme.shadows.sm,
  },
  filtersButtonActive: {
    backgroundColor: '#E8F5E8',
    borderColor: '#4CAF50',
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  buttonIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  buttonLabel: {
    fontSize: 12,
    color: theme.colors.text.primary,
    fontWeight: '500',
    textAlign: 'center',
  },
  headerActiveFiltersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E8F5E8',
    marginHorizontal: theme.spacing.md,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#C8E6C9',
    marginTop: 8,
  },
  filtersBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  activeFiltersText: {
    fontSize: 11,
    color: '#2E7D32',
    fontWeight: '500',
  },
  clearFiltersButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  clearFiltersText: {
    fontSize: 10,
    color: '#2E7D32',
    fontWeight: '600',
  },
  actionButtons: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
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
    minHeight: '75%',
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    fontSize: 18,
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
    minHeight: '100%',
  },
  transactionListContent: {
    paddingBottom: theme.spacing.lg,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
  },
  headerFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
  },
  headerFilterLabel: {
    fontSize: 12,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  quickActionButton: {
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
  },
}); 