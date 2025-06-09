import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  SafeAreaView,
  StatusBar,
  ScrollView
} from 'react-native';
import { Card, Button, Portal, Snackbar, Text, FAB } from 'react-native-paper';
import { useTransactionStore } from '../../store/transactionStore';
import { TransactionCard } from '../components/TransactionCard';
import { AddTransactionModal } from '../components/AddTransactionModal';
import { TransactionFiltersModal } from '../components/TransactionFilters';
import { BalanceCard } from '../components/BalanceCard';
import { useTransactionActions } from '../hooks/useTransactionActions';
import { useTransactionFilters } from '../hooks/useTransactionFilters';
import { initializeDatabase } from '../../storage/TransactionDatabase';
import { theme } from '@/shared/ui/theme/theme';
import { ImportButton } from '@/features/import/ui/components/ImportButton';
import { ImportPreviewModal } from '@/features/import/ui/components/ImportPreviewModal';
import { ColumnMappingModal } from '@/features/import/ui/components/ColumnMappingModal';
import { importService, FilePreview } from '@/features/import/service/ImportService';
import { ImportResult, ImportMapping } from '@/features/import/strategies/ImportStrategy';
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
  const [showColumnMappingModal, setShowColumnMappingModal] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [filePreview, setFilePreview] = useState<FilePreview | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importFileName, setImportFileName] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  
  const scrollViewRef = useRef<ScrollView>(null);

  const balance = getBalance();
  const { filteredTransactions, activeFiltersCount } = useTransactionFilters(transactions, filters);
  const {
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
      setSelectedFile(file);
      setImportFileName(file.name);
      
      // Convert browser File to ImportFile
      const importFile = await importService.createImportFileFromBrowser(file);
      
      // Extract preview for column mapping
      const preview = await importService.extractFilePreview(importFile);
      
      setFilePreview(preview);
      setShowColumnMappingModal(true);
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert(
        'Import Error',
        error instanceof Error ? error.message : 'Failed to process the file'
      );
      setSelectedFile(null);
      setFilePreview(null);
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

  const handleColumnMappingConfirm = async (mapping: ImportMapping) => {
    try {
      setIsImporting(true);
      setShowColumnMappingModal(false);
      
      if (!selectedFile) {
        throw new Error('No file selected');
      }
      
      // Convert browser File to ImportFile
      const importFile = await importService.createImportFileFromBrowser(selectedFile);
      
      // Preview the import with user mapping
      const result = await importService.previewImport(importFile, mapping);
      
      setImportResult(result);
      setShowImportModal(true);
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert(
        'Import Error',
        error instanceof Error ? error.message : 'Failed to process the file with your mapping'
      );
    } finally {
      setIsImporting(false);
    }
  };

  const handleColumnMappingDismiss = () => {
    setShowColumnMappingModal(false);
    setFilePreview(null);
    setSelectedFile(null);
    setImportFileName('');
  };

  const handleScroll = (event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    
    // Show/hide scroll to top button
    setShowScrollToTop(scrollY > 300);
  };

  const scrollToTop = () => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
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
      
      {/* Main Scrollable Content */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={true}
        stickyHeaderIndices={[1]}
      >
        {/* Top Content */}
        <View>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">💰 LedgerVault</Text>
            <Text style={styles.subtitle} numberOfLines={1} ellipsizeMode="tail">Phase 2 Prototype</Text>
          </View>

          {/* Balance Summary - always visible */}
          <BalanceCard 
            balance={balance} 
            transactionCount={transactions.length}
            currency={transactions.length > 0 ? transactions[0].currency : 'USD'}
          />

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {/* First Row - Main Actions */}
            <View style={styles.actionRow}>
              <Button
                mode="contained"
                icon="plus"
                onPress={() => setShowAddModal(true)}
                style={styles.actionButton}
                labelStyle={styles.actionButtonLabel}
                contentStyle={styles.actionButtonContent}
              >
                Add Transaction
              </Button>
              <ImportButton
                onFileSelect={handleFileSelect}
                loading={isImporting}
                label="Import Bank"
                icon="upload"
                style={styles.actionButton}
                contentStyle={styles.actionButtonContent}
                labelStyle={styles.actionButtonLabel}
              />
            </View>

            {/* Second Row - Quick Actions - always visible */}
            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.quickActionButton, styles.detailsButton]} activeOpacity={0.8}>
                <View style={styles.buttonGradient}>
                  <Text style={styles.buttonIcon}>📊</Text>
                  <Text style={styles.buttonLabel} numberOfLines={1} ellipsizeMode="tail">Details</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.quickActionButton, styles.goalsButton]} activeOpacity={0.8}>
                <View style={styles.buttonGradient}>
                  <Text style={styles.buttonIcon}>🎯</Text>
                  <Text style={styles.buttonLabel} numberOfLines={1} ellipsizeMode="tail">Goals</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.quickActionButton, styles.periodButton]} activeOpacity={0.8}>
                <View style={styles.buttonGradient}>
                  <Text style={styles.buttonIcon}>📅</Text>
                  <Text style={styles.buttonLabel} numberOfLines={1} ellipsizeMode="tail">This Month</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Error Display */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText} numberOfLines={3} ellipsizeMode="tail">❌ {error}</Text>
            </View>
          )}
        </View>

        {/* Sticky Transaction Header with Filters */}
        <View style={styles.stickyTransactionHeader}>
          <Text style={styles.sectionTitle} numberOfLines={1} ellipsizeMode="tail">
            {getTransactionSectionTitle()}
          </Text>
          
          <TouchableOpacity 
            style={[styles.headerFiltersButton, activeFiltersCount > 0 && styles.filtersButtonActive]}
            onPress={() => setShowFiltersModal(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonIcon}>🔍</Text>
            <Text style={styles.headerFilterLabel} numberOfLines={1} ellipsizeMode="tail">
              Filters{activeFiltersCount > 0 && ` (${activeFiltersCount})`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Active Filters Summary */}
        {activeFiltersCount > 0 && (
          <View style={styles.headerActiveFiltersRow}>
            <View style={styles.filtersBadge}>
              <Text style={styles.activeFiltersText} numberOfLines={1} ellipsizeMode="tail">
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
        
        {/* Transaction Content - always show structure */}
        {!hasFilteredTransactions && !hasTransactions ? (
          // No transactions at all
          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyStateContent}>
              <Text style={styles.emptyStateTitle} numberOfLines={2} ellipsizeMode="tail">No transactions yet</Text>
              <Text style={styles.emptyStateDescription} numberOfLines={3} ellipsizeMode="tail">
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
                  labelStyle={styles.emptyStateButtonLabel}
                  contentStyle={styles.emptyStateButtonContent}
                >
                  Add Transaction
                </Button>
                <ImportButton
                  onFileSelect={handleFileSelect}
                  loading={isImporting}
                  label="Import Bank File"
                  icon="upload"
                  style={styles.emptyStateButton}
                  contentStyle={styles.emptyStateButtonContent}
                  labelStyle={styles.emptyStateButtonLabel}
                />
              </View>
            </View>
          </View>
        ) : !hasFilteredTransactions ? (
          // Has transactions but none match filters
          <View style={styles.emptyCard}>
            <View style={styles.emptyContent}>
              <Text variant="titleMedium" style={styles.emptyTitle} numberOfLines={2} ellipsizeMode="tail">
                No transactions match your filters
              </Text>
              <Text variant="bodyMedium" style={styles.emptyDescription} numberOfLines={3} ellipsizeMode="tail">
                Try adjusting your filters or clearing them to see all {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
              </Text>
              <View style={styles.emptyActions}>
                <Button
                  mode="outlined"
                  icon="filter-remove"
                  onPress={() => setFilters({})}
                  style={styles.emptyButton}
                  labelStyle={styles.emptyButtonLabel}
                  contentStyle={styles.emptyButtonContent}
                >
                  Clear Filters
                </Button>
                <Button
                  mode="contained"
                  icon="filter"
                  onPress={() => setShowFiltersModal(true)}
                  style={styles.emptyButton}
                  labelStyle={styles.emptyButtonLabel}
                  contentStyle={styles.emptyButtonContent}
                >
                  Adjust Filters
                </Button>
              </View>
            </View>
          </View>
        ) : (
          // Show filtered transactions
          <View style={styles.transactionListContainer}>
            {filteredTransactions.map((transaction) => (
              <TransactionCard
                key={transaction.id}
                transaction={transaction}
                onLongPress={() => handleTransactionPress(transaction.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Scroll to Top FAB */}
      {showScrollToTop && (
        <FAB
          icon="arrow-up"
          style={styles.scrollToTopFab}
          onPress={scrollToTop}
          size="small"
          color="white"
        />
      )}

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

      {/* Column Mapping Modal */}
      <ColumnMappingModal
        visible={showColumnMappingModal}
        onDismiss={handleColumnMappingDismiss}
        onConfirm={handleColumnMappingConfirm}
        columns={filePreview?.columns || []}
        sampleData={filePreview?.sampleData || []}
        fileName={importFileName}
        suggestedMapping={filePreview?.suggestedMapping}
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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
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
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
  },
  actionButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtonContent: {
    minHeight: 44,
    justifyContent: 'center',
  },
  errorContainer: {
    backgroundColor: theme.colors.error,
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  errorText: {
    ...theme.typography.body,
    color: theme.colors.text.inverse,
    textAlign: 'center',
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    fontSize: 18,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  emptyCard: {
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.sm,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.surface,
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
    textAlign: 'center',
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
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
  },
  emptyButtonLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyButtonContent: {
    minHeight: 48,
    justifyContent: 'center',
  },
  transactionListContainer: {
    marginHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
    paddingTop: theme.spacing.sm,
  },
  stickyTransactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    marginTop: 0,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    ...theme.shadows.md,
  },
  headerFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    minWidth: 70,
  },
  headerFilterLabel: {
    fontSize: 12,
    color: theme.colors.text.primary,
    fontWeight: '500',
    marginLeft: 4,
  },
  actionRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    alignItems: 'center',
  },
  quickActionButton: {
    flex: 1,
    minHeight: 44,
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
  },
  filtersBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#4CAF50',
    flex: 1,
    marginRight: theme.spacing.xs,
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
    minHeight: 300,
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
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
  },
  emptyStateButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyStateButtonContent: {
    minHeight: 48,
    justifyContent: 'center',
  },
  scrollToTopFab: {
    position: 'absolute',
    margin: theme.spacing.md,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
    opacity: 0.7,
    elevation: 2,
    shadowOpacity: 0.2,
  },
}); 