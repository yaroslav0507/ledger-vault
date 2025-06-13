import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { 
  View, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  StatusBar,
  SectionList
} from 'react-native';
import { Card, Button, Portal, Snackbar, Text, FAB } from 'react-native-paper';
import { useTransactionStore } from '../../store/transactionStore';
import { useTransactionActions } from '../hooks/useTransactionActions';
import { TransactionCard } from '../components/TransactionCard';
import { BalanceCard } from '../components/BalanceCard';
import { AddTransactionModal } from '../components/AddTransactionModal';
import { initializeDatabase } from '../../storage/TransactionDatabase';
import { theme } from '@/shared/ui/theme/theme';
import { ImportButton } from '@/features/import/ui/components/ImportButton';
import { ImportPreviewModal } from '@/features/import/ui/components/ImportPreviewModal';
import { ColumnMappingModal } from '@/features/import/ui/components/ColumnMappingModal';
import { importService, FilePreview } from '@/features/import/service/ImportService';
import { ImportResult, ImportMapping } from '@/features/import/strategies/ImportStrategy';
import { Transaction, UpdateTransactionRequest } from '../../model/Transaction';
import { TimePeriod, DateRange } from '@/shared/utils/dateUtils';
import { useSettingsStore } from '@/shared/store/settingsStore';
import { ConfirmationDialog, EmptyState } from '@/shared/ui/components';
import { TransactionFilterContainer } from '@/shared/ui/components/TransactionFilter';

export const TransactionListScreen: React.FC = () => {
  const { 
    transactions, 
    loading, 
    error, 
    filters,
    selectedTimePeriod,
    loadTransactions, 
    addTransaction, 
    setFilters,
    setTimePeriod,
    toggleCategoryFilter,
    clearFilters,
    getBalance,
    getAvailableCards
  } = useTransactionStore();

  const [isInitialized, setIsInitialized] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [availableCards, setAvailableCards] = useState<string[]>([]);
  const [importState, setImportState] = useState({
    showModal: false,
    showColumnMapping: false,
    isLoading: false,
    fileName: '',
    selectedFile: null as File | null,
    result: null as ImportResult | null,
    preview: null as FilePreview | null,
  });
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [removingTransactionIds, setRemovingTransactionIds] = useState<Set<string>>(new Set());
  const [isAnyCardSwiping, setIsAnyCardSwiping] = useState(false);
  const [recentlyArchivedTransaction, setRecentlyArchivedTransaction] = useState<Transaction | null>(null);
  const [undoTimeoutId, setUndoTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [showArchiveConfirmDialog, setShowArchiveConfirmDialog] = useState(false);
  const [transactionToArchive, setTransactionToArchive] = useState<Transaction | null>(null);
  
  const scrollViewRef = useRef<SectionList>(null);
  
  const balance = getBalance();
  const filteredTransactions = transactions.filter(t => t.isArchived !== true); // Filter out archived transactions (handle undefined)
  
  const confirmDeleteTransactions = useSettingsStore(state => state.confirmDeleteTransactions);

  // Load available cards when date range changes
  useEffect(() => {
    const loadAvailableCards = async () => {
      try {
        const cards = await getAvailableCards();
        setAvailableCards(cards);
      } catch (error) {
        console.error('Failed to load available cards:', error);
        setAvailableCards([]);
      }
    };

    loadAvailableCards();
  }, [filters.dateRange, getAvailableCards]);

  // Handle edit transaction - simplified, no need for complex refresh logic
  const handleEditTransaction = (transaction: Transaction) => {
    setTransactionToEdit(transaction);
    setShowEditModal(true);
  };

  const {
    handleTransactionPress,
    handleUpdateTransaction,
    handleImportConfirm,
    handleArchiveTransaction,
    handleUnarchiveTransaction,
    snackbarMessage,
    showSnackbar,
    setShowSnackbar,
    showMessage
  } = useTransactionActions(handleEditTransaction);

  const handleUndo = useCallback(async () => {
    if (!recentlyArchivedTransaction) return;
    
    try {
      if (undoTimeoutId) {
        clearTimeout(undoTimeoutId);
        setUndoTimeoutId(null);
      }
      
      await handleUnarchiveTransaction(recentlyArchivedTransaction.id);
      setRecentlyArchivedTransaction(null);
      setShowSnackbar(false);
    } catch (error) {
      console.error('Failed to undo archive:', error);
      Alert.alert('Error', 'Failed to restore transaction');
    }
  }, [recentlyArchivedTransaction, undoTimeoutId, handleUnarchiveTransaction]);

  // Remove redundant wrapper functions - use inline callbacks
  const handleSwipeStart = useCallback(() => setIsAnyCardSwiping(true), []);
  const handleSwipeEnd = useCallback(() => setIsAnyCardSwiping(false), []);

  // Simplified filter toggle - handles both income and expense
  const handleIncomeExpenseFilter = (filterValue: boolean | undefined) => {
    if (filters.isIncome === filterValue) {
      // If already set to this value, clear filter
      const { isIncome, ...filtersWithoutIncomeType } = filters;
      setFilters(filtersWithoutIncomeType);
    } else {
      // Set new filter value
      setFilters({ ...filters, isIncome: filterValue });
    }
  };

  // Handle archive transaction (soft delete - sets isArchived flag)
  const handleArchiveTransactionLocal = async (transaction: Transaction) => {
    if (confirmDeleteTransactions) {
      setTransactionToArchive(transaction);
      setShowArchiveConfirmDialog(true);
      return;
    }
    archiveWithAnimation(transaction);
  };

  const handleConfirmArchive = () => {
    if (transactionToArchive) {
      archiveWithAnimation(transactionToArchive);
    }
    setShowArchiveConfirmDialog(false);
    setTimeout(() => {
      setTransactionToArchive(null);
    }, 300);
  };

  const handleCancelArchive = () => {
    setShowArchiveConfirmDialog(false);
    setTimeout(() => {
      setTransactionToArchive(null);
    }, 300);
  };

  const archiveWithAnimation = async (transaction: Transaction) => {
    setRemovingTransactionIds(prev => new Set(prev).add(transaction.id));
    
    setTimeout(async () => {
      try {
        await handleArchiveTransaction(transaction.id);
        showMessage(`Transaction "${transaction.description}" archived successfully`);
        setRecentlyArchivedTransaction(transaction);
        setUndoTimeoutId(setTimeout(() => {
          setRecentlyArchivedTransaction(null);
        }, 5000));
      } catch (error) {
        console.error('Failed to archive transaction:', error);
        Alert.alert('Error', 'Failed to archive transaction');
      } finally {
        setRemovingTransactionIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(transaction.id);
          return newSet;
        });
      }
    }, 300);
  };

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

  useEffect(() => {
    return () => {
      if (undoTimeoutId) {
        clearTimeout(undoTimeoutId);
      }
    };
  }, [undoTimeoutId]);

  const handleFileSelect = async (file: File) => {
    try {
      setImportState({
        showModal: true,
        showColumnMapping: true,
        isLoading: true,
        fileName: file.name,
        selectedFile: file,
        result: null,
        preview: null,
      });
      
      // Convert browser File to ImportFile
      const importFile = await importService.createImportFileFromBrowser(file);
      
      // Extract preview for column mapping
      const preview = await importService.extractFilePreview(importFile);
      
      setImportState(prev => ({
        ...prev,
        preview: preview,
        showColumnMapping: true,
      }));
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert(
        'Import Error',
        error instanceof Error ? error.message : 'Failed to process the file'
      );
      setImportState(prev => ({
        ...prev,
        selectedFile: null,
        preview: null,
      }));
    } finally {
      setImportState(prev => ({
        ...prev,
        isLoading: false,
      }));
    }
  };

  const handleImportConfirmLocal = async (transactions: Transaction[], ignoreDuplicates: boolean) => {
    // Close modal immediately after user confirmation
      setImportState(prev => ({
        ...prev,
        showModal: false,
        result: null,
      isLoading: false,
    }));
    
    // Run import in background
    try {
      await handleImportConfirm(transactions, ignoreDuplicates);
    } catch (error) {
      console.error('Background import failed:', error);
      // Error handling is already done in handleImportConfirm
    }
  };

  const handleColumnMappingConfirm = async (mapping: ImportMapping) => {
    try {
      setImportState(prev => ({
        ...prev,
        showColumnMapping: false,
        isLoading: true,
      }));
      
      if (!importState.selectedFile) {
        throw new Error('No file selected');
      }
      
      // Convert browser File to ImportFile
      const importFile = await importService.createImportFileFromBrowser(importState.selectedFile);
      
      // Preview the import with user mapping
      const result = await importService.previewImport(importFile, mapping);
      
      setImportState(prev => ({
        ...prev,
        result: result,
        showModal: true,
      }));
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert(
        'Import Error',
        error instanceof Error ? error.message : 'Failed to process the file with your mapping'
      );
    } finally {
      setImportState(prev => ({
        ...prev,
        isLoading: false,
      }));
    }
  };

  const handleColumnMappingDismiss = () => {
    setImportState(prev => ({
      ...prev,
      showColumnMapping: false,
      preview: null,
      selectedFile: null,
      fileName: '',
    }));
  };

  const handleScroll = (event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    setShowScrollToTop(scrollY > 300);
  };

  // Custom renderItem for SectionList
  const renderSectionItem = useCallback(({ item: transaction }: { item: Transaction }) => {
    return (
      <TransactionCard
        transaction={transaction}
        onLongPress={() => handleTransactionPress(transaction)}
        onCategoryPress={toggleCategoryFilter}
        onEdit={handleEditTransaction}
        onArchive={handleArchiveTransactionLocal}
        isBeingRemoved={removingTransactionIds.has(transaction.id)}
        onSwipeStart={handleSwipeStart}
        onSwipeEnd={handleSwipeEnd}
      />
    );
  }, [handleTransactionPress, toggleCategoryFilter, handleEditTransaction, handleArchiveTransactionLocal, removingTransactionIds, handleSwipeStart, handleSwipeEnd]);

  // Render empty state component using the reusable EmptyState component
  const renderEmptyState = useCallback(() => {
    if (loading) {
      return (
        <EmptyState
          loading={true}
          loadingText="Loading transactions..."
          title=""
          description=""
        />
      );
    }

    if (!transactions.length) {
      return (
        <EmptyState
          title="No transactions yet"
          description="Start by adding your first transaction or importing data from your bank statements"
        />
      );
    }

    if (!filteredTransactions.length) {
      return (
        <EmptyState
          title="No transactions match your filters"
          description={`Try adjusting your filters or clearing them to see all ${transactions.length} transaction${transactions.length !== 1 ? 's' : ''}`}
          actions={[
            {
              label: 'Clear Filters',
              icon: 'filter-remove',
              mode: 'outlined',
              onPress: clearFilters
            },
            {
              label: 'Clear Filters',
              icon: 'filter',
              mode: 'contained',
              onPress: clearFilters
            }
          ]}
        />
      );
    }

    return null;
  }, [loading, transactions.length, filteredTransactions.length, clearFilters]);

  // Simple sections data - always include section to show header
  const sectionsData = [
    {
      title: 'Transactions',
      data: filteredTransactions
    }
  ];

  // Create sticky header component for transaction section
  const renderStickyHeader = useCallback(() => (
    <TransactionFilterContainer
      transactionCount={filteredTransactions.length}
      totalTransactionCount={transactions.length}
      filters={filters}
      setFilters={setFilters}
      clearFilters={clearFilters}
      availableCards={availableCards}
      transactions={transactions}
    />
  ), [filteredTransactions.length, transactions.length, filters, setFilters, clearFilters, availableCards, transactions]);

  // Create header component for SectionList (non-sticky content)
  const renderListHeader = useCallback(() => (
    <View>
      {/* <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">💰 LedgerVault</Text>
        <Text style={styles.subtitle} numberOfLines={1} ellipsizeMode="tail">Phase 2 Prototype</Text>
      </View> */}

      <BalanceCard 
        balance={balance} 
        transactionCount={filteredTransactions.length}
        currency={transactions.length > 0 ? transactions[0].currency : 'USD'}
        currentFilters={filters}
        onIncomeFilter={() => handleIncomeExpenseFilter(true)}
        onExpenseFilter={() => handleIncomeExpenseFilter(false)}
      />

      <View style={styles.actionButtons}>
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
          style={styles.actionButton}
          contentStyle={styles.actionButtonContent}
          labelStyle={styles.actionButtonLabel}
        />
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  ), [balance, filteredTransactions.length, error]);

  if (!isInitialized) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Initializing LedgerVault...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

      <SectionList
        ref={scrollViewRef}
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        sections={sectionsData}
        keyExtractor={(item) => item.id}
        renderItem={renderSectionItem}
        renderSectionHeader={renderStickyHeader}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderEmptyState}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={true}
        getItemLayout={(data: any, index: number) => ({
          length: 120, // Approximate height of TransactionCard
          offset: 120 * index,
          index,
        })}
        initialNumToRender={10}
        maxToRenderPerBatch={20}
        windowSize={10}
        removeClippedSubviews={true}
        updateCellsBatchingPeriod={100}
        stickySectionHeadersEnabled={true}
        scrollEnabled={!isAnyCardSwiping}
      />

      {/* Scroll to Top FAB */}
      {showScrollToTop && (
        <FAB
          icon="arrow-up"
          style={styles.scrollToTopFab}
          onPress={() => {
            if (filteredTransactions.length > 0) {
              scrollViewRef.current?.scrollToLocation({ sectionIndex: 0, itemIndex: 0, animated: true });
            }
          }}
          size="small"
          color="white"
        />
      )}

      {/* Modals */}
      <AddTransactionModal
        visible={showAddModal}
        onClose={() => {
          setShowAddModal(false);
        }}
        onSubmit={(transaction) => {
          return addTransaction(transaction);
        }}
      />

      {/* Edit Transaction Modal */}
      <AddTransactionModal
        visible={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setTransactionToEdit(null);
        }}
        editMode={true}
        transactionToEdit={transactionToEdit || undefined}
        onUpdate={handleUpdateTransaction}
        onSubmit={() => Promise.resolve()} // Not used in edit mode
      />

      {/* Import Preview Modal */}
      <ImportPreviewModal
        visible={importState.showModal}
        onDismiss={() => {
          setImportState(prev => ({
            ...prev,
            showModal: false,
            result: null,
          }));
        }}
        onConfirm={handleImportConfirmLocal}
        result={importState.result}
        fileName={importState.fileName}
        isLoading={importState.isLoading}
      />

      {/* Column Mapping Modal */}
      <ColumnMappingModal
        visible={importState.showColumnMapping}
        onDismiss={handleColumnMappingDismiss}
        onConfirm={handleColumnMappingConfirm}
        columns={importState.preview?.columns || []}
        sampleData={importState.preview?.sampleData || []}
        fileName={importState.fileName}
        suggestedMapping={importState.preview?.suggestedMapping}
      />

      {/* Archive Confirmation Dialog */}
      <ConfirmationDialog
        visible={showArchiveConfirmDialog}
        title="Confirm Archive"
        message={`Are you sure you want to archive "${transactionToArchive?.description || 'this transaction'}"?`}
        confirmText="Archive"
        cancelText="Cancel"
        onConfirm={handleConfirmArchive}
        onCancel={handleCancelArchive}
      />

      {/* Success Snackbar */}
      <Portal>
        <Snackbar
          visible={showSnackbar}
          onDismiss={() => {
            setShowSnackbar(false);
            if (recentlyArchivedTransaction && undoTimeoutId) {
              clearTimeout(undoTimeoutId);
              setUndoTimeoutId(null);
              setRecentlyArchivedTransaction(null);
            }
          }}
          duration={recentlyArchivedTransaction ? 5000 : 4000}
          action={recentlyArchivedTransaction ? {
            label: 'Undo',
            onPress: handleUndo,
          } : undefined}
        >
          {snackbarMessage}
        </Snackbar>
      </Portal>
    </View>
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
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    gap: theme.spacing.sm,
    alignItems: 'center',
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
  timePeriodContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  filterButton: {
    backgroundColor: theme.colors.secondary,
  },
  sectionHeader: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    marginTop: 0,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
    boxShadow: '0 5px 10px 0px #0000001c',
  },
  stickyActiveFilters: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: '#F0F8FF',
    borderRadius: theme.borderRadius.md,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  stickyFiltersBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.round,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  stickyActiveFiltersText: {
    fontSize: 12,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  stickyClearButton: {
    backgroundColor: 'transparent',
  },
  stickyClearText: {
    fontSize: 12,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
}); 