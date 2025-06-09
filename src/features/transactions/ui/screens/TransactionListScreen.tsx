import React, { useEffect, useState } from 'react';
import { 
  View, 
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
import { BalanceCard } from '../components/BalanceCard';
import { useTransactionActions } from '../hooks/useTransactionActions';
import { useTransactionFilters } from '../hooks/useTransactionFilters';
import { initializeDatabase } from '../../storage/TransactionDatabase';
import { CreateTransactionRequest, DEFAULT_CATEGORIES } from '../../model/Transaction';
import { getCurrentDateISO } from '@/shared/utils/dateUtils';
import { parseCurrencyToSmallestUnit } from '@/shared/utils/currencyUtils';
import { theme } from '@/shared/ui/theme/theme';
import { ImportButton } from '@/features/import/ui/components/ImportButton';
import { ImportPreviewModal } from '@/features/import/ui/components/ImportPreviewModal';
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
  
  const balance = getBalance();
  const { filteredTransactions, activeFiltersCount } = useTransactionFilters(transactions, filters);
  const {
    handleAddSampleTransaction,
    handleTransactionPress,
    handleImportConfirm,
    snackbarMessage,
    showSnackbar,
    setShowSnackbar,
    showMessage
  } = useTransactionActions();

  // Get unique cards for filter options
  const availableCards = Array.from(new Set(transactions.map(t => t.card)));
  
  // Check different states for the UI
  const hasTransactions = transactions.length > 0;
  const hasFilteredTransactions = filteredTransactions.length > 0;
  const hasActiveFilters = activeFiltersCount > 0;

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

  const handleImportConfirmLocal = async (transactions: Transaction[], ignoreDuplicates: boolean) => {
    const success = await handleImportConfirm(transactions, ignoreDuplicates);
    if (success) {
      setShowImportModal(false);
      setImportResult(null);
    }
    setIsImporting(false);
  };

  // Dynamic transaction section title based on state
  const getTransactionSectionTitle = () => {
    if (!hasTransactions) {
      return 'Transactions (0)';
    }
    
    if (hasActiveFilters) {
      return `Filtered Transactions (${filteredTransactions.length}/${transactions.length})`;
    }
    
    return `Transactions (${filteredTransactions.length})`;
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

      {/* Conditional Balance Summary - only show when there are transactions */}
      {hasTransactions && (
        <BalanceCard 
          balance={balance} 
          transactionCount={transactions.length}
          currency={transactions.length > 0 ? transactions[0].currency : 'USD'}
        />
      )}

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
        </View>

        {/* Second Row - Quick Actions - only show when there are transactions */}
        {hasTransactions && (
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
        )}
      </View>

      {/* Error Display */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>❌ {error}</Text>
        </View>
      )}

      {/* Transaction List Container - Always visible */}
      <View style={styles.listContainer}>
        {/* Transaction Header with Filters - Always visible */}
        <View style={styles.transactionHeader}>
          <Text style={styles.sectionTitle}>
            {getTransactionSectionTitle()}
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
        
        {/* Transaction Content */}
        {!hasTransactions ? (
          // No transactions at all
          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyStateContent}>
              <Text style={styles.emptyStateTitle}>No transactions yet</Text>
              <Text style={styles.emptyStateDescription}>
                Add your first transaction or import bank statements to get started
              </Text>
              
              <View style={styles.emptyStateActions}>
                <Button 
                  mode="contained" 
                  icon="plus"
                  onPress={() => {
                    console.log('🔘 Add Transaction button pressed');
                    setShowAddModal(true);
                    console.log('🔘 Modal state set to true');
                  }}
                  style={styles.emptyStateButton}
                >
                  Add Transaction
                </Button>
                <ImportButton
                  onFileSelect={handleFileSelect}
                  loading={isImporting}
                  label="Import Bank File"
                  icon="upload"
                  style={styles.emptyStateButton}
                />
              </View>
            </View>
          </View>
        ) : !hasFilteredTransactions ? (
          // Has transactions but none match filters
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <Text variant="titleMedium" style={styles.emptyTitle}>
                No transactions match your filters
              </Text>
              <Text variant="bodyMedium" style={styles.emptyDescription}>
                Try adjusting your filters or clearing them to see all {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
              </Text>
              <View style={styles.emptyActions}>
                <Button
                  mode="outlined"
                  icon="filter-remove"
                  onPress={() => setFilters({})}
                  style={styles.emptyButton}
                >
                  Clear Filters
                </Button>
                <Button
                  mode="contained"
                  icon="filter"
                  onPress={() => setShowFiltersModal(true)}
                  style={styles.emptyButton}
                >
                  Adjust Filters
                </Button>
              </View>
            </Card.Content>
          </Card>
        ) : (
          // Has filtered transactions to show
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
        onClose={() => {
          console.log('🔘 Closing Add Transaction Modal');
          setShowAddModal(false);
        }}
        onSubmit={(transaction) => {
          console.log('🔘 Submitting transaction:', transaction);
          return addTransaction(transaction);
        }}
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
        onConfirm={handleImportConfirmLocal}
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
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    // Inset box shadow for recessed appearance
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    // Additional inset shadow effect
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
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
    marginBottom: theme.spacing.md,
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
    borderRadius: theme.borderRadius.lg,
    // Inner shadow for the scrollable content
    backgroundColor: 'transparent',
  },
  transactionListContent: {
    paddingBottom: theme.spacing.lg,
    paddingTop: theme.spacing.xs,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
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
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
  },
  emptyStateContent: {
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.md,
    width: '100%',
    maxWidth: 400,
  },
  emptyStateTitle: {
    ...theme.typography.h3,
    textAlign: 'center',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  emptyStateDescription: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  emptyStateActions: {
    flexDirection: 'column',
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  emptyStateButton: {
    flex: 1,
    minHeight: 48,
    justifyContent: 'center',
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
  },
}); 