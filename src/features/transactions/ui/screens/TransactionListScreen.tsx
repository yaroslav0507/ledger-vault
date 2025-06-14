import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { 
  View, 
  StyleSheet, 
  StatusBar,
  SectionList
} from 'react-native';
import { Portal, Snackbar, Text, FAB } from 'react-native-paper';
import { useTransactionStore } from '../../store/transactionStore';
import { useTransactionActions } from '../hooks/useTransactionActions';
import { useTransactionManagement } from '../hooks/useTransactionManagement';
import { useTransactionCallbacks } from '../hooks/useTransactionCallbacks';
import { AddTransactionModal } from '../components/AddTransactionModal';
import { initializeDatabase } from '../../storage/TransactionDatabase';
import { theme } from '@/shared/ui/theme/theme';
import { ImportPreviewModal } from '@/features/import/ui/components/ImportPreviewModal';
import { ColumnMappingModal } from '@/features/import/ui/components/ColumnMappingModal';
import { Transaction } from '../../model/Transaction';
import { useSettingsStore } from '@/shared/store/settingsStore';
import { ConfirmationDialog, TransactionListHeader } from '@/shared/ui/components';
import { UI_CONSTANTS } from '@/shared/constants/ui';
import { TransactionCard } from '../components/TransactionCard';
import { EmptyState } from '@/shared/ui/components/EmptyState';
import { TransactionFilterContainer } from '@/shared/ui/components/TransactionFilter/TransactionFilterContainer';

export const TransactionListScreen: React.FC = () => {
  const { 
    transactions, 
    loading, 
    error, 
    filters,
    loadTransactions, 
    addTransaction, 
    setFilters,
    toggleCategoryFilter,
    clearFilters,
    getBalance,
    getAvailableCards
  } = useTransactionStore();

  const transactionManagement = useTransactionManagement();
  const [isInitialized, setIsInitialized] = useState(false);
  const [availableCards, setAvailableCards] = useState<string[]>([]);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [isAnyCardSwiping, setIsAnyCardSwiping] = useState(false);
  
  const scrollViewRef = useRef<SectionList>(null);
  const confirmDeleteTransactions = useSettingsStore(state => state.confirmDeleteTransactions);

  const balanceData = getBalance();
  const filteredTransactions = useMemo(() => 
    transactions.filter(t => t.isArchived !== true), 
    [transactions]
  );

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
  } = useTransactionActions(transactionManagement.editModal.open);

  const callbackDependencies = useMemo(() => ({
    transactionManagement,
    handleImportConfirm,
    handleArchiveTransaction,
    handleUnarchiveTransaction,
    showMessage,
    setShowSnackbar,
    confirmDeleteTransactions
  }), [
    transactionManagement,
    handleImportConfirm,
    handleArchiveTransaction,
    handleUnarchiveTransaction,
    showMessage,
    setShowSnackbar,
    confirmDeleteTransactions
  ]);

  const {
    handleFileSelect,
    handleImportConfirmLocal,
    handleColumnMappingConfirm,
    handleUndo,
    handleArchiveTransactionLocal,
    handleConfirmArchive
  } = useTransactionCallbacks(callbackDependencies);

  useEffect(() => {
    const initApp = async () => {
      try {
        await initializeDatabase();
        await loadTransactions();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    };

    initApp();
  }, [loadTransactions]);

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

  const handleIncomeExpenseFilter = useCallback((filterValue: boolean | undefined) => {
    if (filters.isIncome === filterValue) {
      const { isIncome, ...filtersWithoutIncomeType } = filters;
      setFilters(filtersWithoutIncomeType);
    } else {
      setFilters({ ...filters, isIncome: filterValue });
    }
  }, [filters, setFilters]);

  const handleSwipeStart = useCallback(() => setIsAnyCardSwiping(true), []);
  const handleSwipeEnd = useCallback(() => setIsAnyCardSwiping(false), []);

  const handleScroll = useCallback((event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    setShowScrollToTop(scrollY > UI_CONSTANTS.DIMENSIONS.SCROLL_TO_TOP_THRESHOLD);
  }, []);

  const renderSectionItem = useCallback(({ item: transaction }: { item: Transaction }) => (
    <TransactionCard
      transaction={transaction}
      onLongPress={() => handleTransactionPress(transaction)}
      onCategoryPress={toggleCategoryFilter}
      onEdit={transactionManagement.editModal.open}
      onArchive={handleArchiveTransactionLocal}
      isBeingRemoved={transactionManagement.removingTransactionIds.has(transaction.id)}
      onSwipeStart={handleSwipeStart}
      onSwipeEnd={handleSwipeEnd}
    />
  ), [
    handleTransactionPress,
    toggleCategoryFilter,
    transactionManagement.editModal.open,
    handleArchiveTransactionLocal,
    transactionManagement.removingTransactionIds,
    handleSwipeStart,
    handleSwipeEnd
  ]);

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
            }
          ]}
        />
      );
    }

    return null;
  }, [loading, transactions.length, filteredTransactions.length, clearFilters]);

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

  const renderListHeader = useCallback(() => (
    <TransactionListHeader
      balance={balanceData}
      transactionCount={filteredTransactions.length}
      currency={transactions.length > 0 ? transactions[0].currency : 'USD'}
      currentFilters={filters}
      error={error}
      onIncomeFilter={() => handleIncomeExpenseFilter(true)}
      onExpenseFilter={() => handleIncomeExpenseFilter(false)}
      onAddTransaction={transactionManagement.addModal.open}
      onFileSelect={handleFileSelect}
    />
  ), [
    balanceData,
    filteredTransactions.length,
    transactions,
    filters,
    error,
    handleIncomeExpenseFilter,
    transactionManagement.addModal.open,
    handleFileSelect
  ]);

  const sectionsData = useMemo(() => [
    {
      title: 'Transactions',
      data: filteredTransactions
    }
  ], [filteredTransactions]);

  const getItemLayout = useCallback((data: any, index: number) => ({
    length: UI_CONSTANTS.DIMENSIONS.TRANSACTION_CARD_HEIGHT,
    offset: UI_CONSTANTS.DIMENSIONS.TRANSACTION_CARD_HEIGHT * index,
    index,
  }), []);

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
        scrollEventThrottle={UI_CONSTANTS.PERFORMANCE.SCROLL_THROTTLE}
        showsVerticalScrollIndicator={true}
        getItemLayout={getItemLayout}
        initialNumToRender={UI_CONSTANTS.PERFORMANCE.INITIAL_RENDER_COUNT}
        maxToRenderPerBatch={UI_CONSTANTS.PERFORMANCE.BATCH_SIZE}
        windowSize={UI_CONSTANTS.PERFORMANCE.WINDOW_SIZE}
        removeClippedSubviews={true}
        updateCellsBatchingPeriod={UI_CONSTANTS.PERFORMANCE.UPDATE_BATCHING_PERIOD}
        stickySectionHeadersEnabled={true}
        scrollEnabled={!isAnyCardSwiping}
      />

      {showScrollToTop && (
        <FAB
          style={styles.scrollToTopFab}
          icon="arrow-up"
          onPress={() => scrollViewRef.current?.scrollToLocation({ sectionIndex: 0, itemIndex: 0, animated: true })}
        />
      )}

      <Portal>
        <AddTransactionModal
          visible={transactionManagement.addModal.isOpen}
          onClose={transactionManagement.addModal.close}
          onSubmit={addTransaction}
        />

        <AddTransactionModal
          visible={transactionManagement.editModal.isOpen}
          onClose={transactionManagement.editModal.close}
          onSubmit={() => Promise.resolve()}
          onUpdate={handleUpdateTransaction}
          editMode={true}
          transactionToEdit={transactionManagement.selectedTransaction || undefined}
        />

        <ImportPreviewModal
          visible={transactionManagement.importFlow.importState.showModal}
          onDismiss={transactionManagement.importFlow.closeModal}
          onConfirm={handleImportConfirmLocal}
          fileName={transactionManagement.importFlow.importState.fileName}
          result={transactionManagement.importFlow.importState.result}
          isLoading={transactionManagement.importFlow.importState.isLoading}
        />

        <ColumnMappingModal
          visible={transactionManagement.importFlow.importState.showColumnMapping}
          onDismiss={transactionManagement.importFlow.closeColumnMapping}
          onConfirm={handleColumnMappingConfirm}
          columns={transactionManagement.importFlow.importState.preview?.columns || []}
          sampleData={transactionManagement.importFlow.importState.preview?.sampleData || []}
          fileName={transactionManagement.importFlow.importState.fileName}
          suggestedMapping={transactionManagement.importFlow.importState.preview?.suggestedMapping}
        />

        <ConfirmationDialog
          visible={transactionManagement.archiveConfirmDialog.isOpen}
          title="Archive Transaction"
          message={`Are you sure you want to archive "${transactionManagement.transactionToArchive?.description}"?`}
          confirmText="Archive"
          cancelText="Cancel"
          onConfirm={handleConfirmArchive}
          onCancel={transactionManagement.archiveConfirmDialog.close}
        />

        <Snackbar
          visible={showSnackbar && !!transactionManagement.recentlyArchivedTransaction}
          onDismiss={() => setShowSnackbar(false)}
          duration={UI_CONSTANTS.TIMEOUTS.UNDO_TIMEOUT}
          action={{
            label: 'Undo',
            onPress: handleUndo,
          }}
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