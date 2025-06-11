import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { 
  View, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  SafeAreaView,
  StatusBar,
  SectionList
} from 'react-native';
import { Card, Button, Portal, Snackbar, Text, FAB } from 'react-native-paper';
import { useTransactionStore } from '../../store/transactionStore';
import { useTransactionActions } from '../hooks/useTransactionActions';
import { TransactionCard } from '../components/TransactionCard';
import { BalanceCard } from '../components/BalanceCard';
import { AddTransactionModal } from '../components/AddTransactionModal';
import { TransactionFiltersModal } from '../components/TransactionFilters';
import { initializeDatabase } from '../../storage/TransactionDatabase';
import { theme } from '@/shared/ui/theme/theme';
import { ImportButton } from '@/features/import/ui/components/ImportButton';
import { ImportPreviewModal } from '@/features/import/ui/components/ImportPreviewModal';
import { ColumnMappingModal } from '@/features/import/ui/components/ColumnMappingModal';
import { importService, FilePreview } from '@/features/import/service/ImportService';
import { ImportResult, ImportMapping } from '@/features/import/strategies/ImportStrategy';
import { Transaction, UpdateTransactionRequest } from '../../model/Transaction';
import { TimePeriodSelector } from '@/shared/ui/components/TimePeriodSelector';
import { TimePeriod, DateRange } from '@/shared/utils/dateUtils';

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
  const [showFiltersModal, setShowFiltersModal] = useState(false);
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
  
  const scrollViewRef = useRef<SectionList>(null);
  
  const balance = getBalance();
  const filteredTransactions = transactions.filter(t => t.isArchived !== true); // Filter out archived transactions (handle undefined)
  
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.categories && filters.categories.length > 0) count += filters.categories.length;
    if (filters.cards && filters.cards.length > 0) count += filters.cards.length;
    if (filters.isIncome !== undefined) count++;
    if (filters.searchQuery) count++;
    return count;
  }, [filters]);

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
    snackbarMessage,
    showSnackbar,
    setShowSnackbar,
    showMessage
  } = useTransactionActions(handleEditTransaction);

  // Remove redundant wrapper functions - use inline callbacks
  const handleSwipeStart = useCallback(() => setIsAnyCardSwiping(true), []);
  const handleSwipeEnd = useCallback(() => setIsAnyCardSwiping(false), []);

  // Remove getTransactionSectionTitle function - inline it
  const transactionSectionTitle = !transactions.length 
    ? 'Transactions (0)'
    : activeFiltersCount > 0 
      ? `Transactions (${filteredTransactions.length}/${transactions.length})`
      : `Transactions (${filteredTransactions.length})`;

  // Remove getItemLayout - use inline function
  // Remove hasTransactions, hasFilteredTransactions, hasActiveFilters - use direct comparisons

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
    try {
      // Start removal animation
      setRemovingTransactionIds(prev => new Set(prev).add(transaction.id));
      
      // Wait for animation to complete, then archive
      setTimeout(async () => {
        try {
          await handleArchiveTransaction(transaction.id);
          showMessage(`Transaction "${transaction.description}" archived successfully`);
        } catch (error) {
          console.error('Failed to archive transaction:', error);
          Alert.alert('Error', 'Failed to archive transaction');
        } finally {
          // Remove from removing set
          setRemovingTransactionIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(transaction.id);
            return newSet;
          });
        }
      }, 300); // Wait for animation duration
      
    } catch (error) {
      console.error('Failed to start archive animation:', error);
      // Fallback to immediate archive
      await handleArchiveTransaction(transaction.id);
      showMessage(`Transaction "${transaction.description}" archived successfully`);
    }
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

  // Render empty state component
  const renderEmptyState = useCallback(() => {
    if (loading) {
      return (
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      );
    }

    if (!transactions.length) {
      return (
        <View style={styles.emptyCard}>
          <View style={styles.emptyContent}>
            <Text variant="titleMedium" style={styles.emptyTitle} numberOfLines={2} ellipsizeMode="tail">
              No transactions yet
            </Text>
            <Text variant="bodyMedium" style={styles.emptyDescription} numberOfLines={3} ellipsizeMode="tail">
              Start by adding your first transaction or importing data from your bank statements
            </Text>
          </View>
        </View>
      );
    }

    if (!filteredTransactions.length) {
      return (
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
                onPress={clearFilters}
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
    <View style={styles.stickyHeader}>
      <View style={styles.stickyHeaderContent}>
        <Text style={styles.stickyTitle} numberOfLines={1} ellipsizeMode="tail">
          {transactionSectionTitle}
        </Text>
        
        <TouchableOpacity 
          style={[styles.stickyFilterButton, activeFiltersCount > 0 && styles.stickyFilterButtonActive]}
          onPress={() => setShowFiltersModal(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.filterIcon}>🔍</Text>
          <Text style={styles.stickyFilterLabel} numberOfLines={1} ellipsizeMode="tail">
            Filters{activeFiltersCount > 0 && ` (${activeFiltersCount})`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  ), [activeFiltersCount, transactionSectionTitle]);

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
  ), [balance, filteredTransactions.length, activeFiltersCount, error]);

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

      <TimePeriodSelector
        currentDateRange={filters.dateRange}
        selectedPeriod={selectedTimePeriod || undefined}
        onPeriodChange={(period, dateRange) => setTimePeriod(period, dateRange)}
      />

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

      <TransactionFiltersModal
        visible={showFiltersModal}
        onClose={() => setShowFiltersModal(false)}
        currentFilters={filters}
        onApplyFilters={setFilters}
        onClearFilters={clearFilters}
        availableCards={availableCards}
        transactions={transactions}
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
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.xs,
    paddingBottom: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
  },
  stickyTransactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    marginTop: 0,
    marginBottom: 10,
    boxShadow: '0 5px 10px 0px #0000001c',
  },
  headerFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: theme.borderRadius.md,
    minWidth: 80,
    backgroundColor: '#FAFAFA',
  },
  headerFilterLabel: {
    fontSize: 13,
    color: theme.colors.text.primary,
    fontWeight: '600',
    marginLeft: 4,
  },
  actionRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  quickActionButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.md,
    overflow: 'hidden',
  },
  detailsButton: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: theme.borderRadius.lg,
    minHeight: 50,
    borderWidth: 1.5,
    borderColor: '#E9ECEF',
    ...theme.shadows.sm,
  },
  goalsButton: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: theme.borderRadius.lg,
    minHeight: 50,
    borderWidth: 1.5,
    borderColor: '#E9ECEF',
    ...theme.shadows.sm,
  },
  filtersButtonActive: {
    backgroundColor: '#E8F5E8',
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    gap: 6,
  },
  buttonIcon: {
    fontSize: 18,
  },
  buttonLabel: {
    fontSize: 13,
    color: theme.colors.text.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
  filtersBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.round,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  activeFiltersContainer: {
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
  activeFiltersNewText: {
    fontSize: 12,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  clearFiltersNewButton: {
    backgroundColor: 'transparent',
  },
  clearFiltersLabel: {
    fontSize: 12,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  clearFiltersContent: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  emptyScrollContent: {
    paddingBottom: 80,
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
  stickyHeader: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    marginTop: -1,
    marginBottom: 10,
    boxShadow: 'rgba(0, 0, 0, 0.05) 0 2px 5px 0',
  },
  stickyHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stickyTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    fontSize: 18,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  stickyFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: theme.borderRadius.md,
    minWidth: 90,
    height: 36,
    backgroundColor: '#FAFAFA',
  },
  stickyFilterButtonActive: {
    backgroundColor: '#E8F5E8',
    borderColor: '#4CAF50',
  },
  filterIcon: {
    fontSize: 18,
    marginRight: theme.spacing.sm,
  },
  stickyFilterLabel: {
    fontSize: 13,
    color: theme.colors.text.primary,
    fontWeight: '600',
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