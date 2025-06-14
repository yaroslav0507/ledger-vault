import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { SectionList } from 'react-native';
import { useTransactionStore } from '@/features/transactions/store/transactionStore';
import { useTransactionActions } from '@/features/transactions/ui/hooks/useTransactionActions';
import { useTransactionManagementContext } from '@/shared/contexts/TransactionManagementContext';
import { useTransactionCallbacks } from '@/features/transactions/ui/hooks/useTransactionCallbacks';
import { initializeDatabase } from '@/features/transactions/storage/TransactionDatabase';
import { useSettingsStore } from '@/shared/store/settingsStore';
import { UI_CONSTANTS } from '@/shared/constants/ui';

export interface BaseScreenConfig {
  screenName: string;
  loadAvailableCards?: boolean;
  enableScrollToTop?: boolean;
  enableSwipeHandling?: boolean;
}

export const useBaseScreen = (config: BaseScreenConfig) => {
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

  const transactionManagement = useTransactionManagementContext();
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

  // Initialization effect
  useEffect(() => {
    const initApp = async () => {
      try {
        await initializeDatabase();
        await loadTransactions();
        setIsInitialized(true);
      } catch (error) {
        console.error(`Failed to initialize ${config.screenName}:`, error);
      }
    };

    initApp();
  }, [loadTransactions, config.screenName]);

  // Load available cards effect (conditional)
  useEffect(() => {
    if (!config.loadAvailableCards) return;

    const loadAvailableCardsAsync = async () => {
      try {
        const cards = await getAvailableCards();
        setAvailableCards(cards);
      } catch (error) {
        console.error('Failed to load available cards:', error);
        setAvailableCards([]);
      }
    };

    loadAvailableCardsAsync();
  }, [filters.dateRange, getAvailableCards, config.loadAvailableCards]);

  // Swipe handling (conditional)
  const handleSwipeStart = useCallback(() => {
    if (config.enableSwipeHandling) {
      setIsAnyCardSwiping(true);
    }
  }, [config.enableSwipeHandling]);

  const handleSwipeEnd = useCallback(() => {
    if (config.enableSwipeHandling) {
      setIsAnyCardSwiping(false);
    }
  }, [config.enableSwipeHandling]);

  // Scroll handling (conditional)
  const handleScroll = useCallback((event: any) => {
    if (!config.enableScrollToTop) return;
    
    const scrollY = event.nativeEvent.contentOffset.y;
    setShowScrollToTop(scrollY > UI_CONSTANTS.DIMENSIONS.SCROLL_TO_TOP_THRESHOLD);
  }, [config.enableScrollToTop]);

  const scrollToTop = useCallback(() => {
    scrollViewRef.current?.scrollToLocation({ sectionIndex: 0, itemIndex: 0, animated: true });
  }, []);

  // Common empty state renderer
  const renderEmptyState = useCallback(() => {
    if (loading) {
      return {
        loading: true,
        loadingText: `Loading ${config.screenName.toLowerCase()}...`,
        title: "",
        description: ""
      };
    }

    if (!transactions.length) {
      return {
        title: "No transactions yet",
        description: config.screenName === "Analytics" 
          ? "Start by adding your first transaction or importing data from your bank statements to see your analytics."
          : "Start by adding your first transaction or importing data from your bank statements"
      };
    }

    if (!filteredTransactions.length) {
      return {
        title: "No transactions match your filters",
        description: config.screenName === "Analytics"
          ? `Try adjusting your filters to see analytics for your ${transactions.length} transaction${transactions.length !== 1 ? 's' : ''}`
          : `Try adjusting your filters or clearing them to see all ${transactions.length} transaction${transactions.length !== 1 ? 's' : ''}`,
        actions: config.screenName === "Transactions" ? [
          {
            label: 'Clear Filters',
            icon: 'filter-remove',
            mode: 'outlined' as const,
            onPress: clearFilters
          }
        ] : undefined
      };
    }

    return null;
  }, [loading, transactions.length, filteredTransactions.length, clearFilters, config.screenName]);

  // Common list header renderer
  const renderListHeader = useCallback(() => ({
    balance: balanceData,
    transactionCount: filteredTransactions.length,
    currency: transactions.length > 0 ? transactions[0].currency : 'USD',
    currentFilters: filters,
    error,
    onAddTransaction: transactionManagement.addModal.open,
    onFileSelect: handleFileSelect
  }), [
    balanceData,
    filteredTransactions.length,
    transactions,
    filters,
    error,
    transactionManagement.addModal.open,
    handleFileSelect
  ]);

  // Common SectionList props
  const commonSectionListProps = useMemo(() => ({
    ref: scrollViewRef,
    scrollEventThrottle: UI_CONSTANTS.PERFORMANCE.SCROLL_THROTTLE,
    showsVerticalScrollIndicator: true,
    initialNumToRender: UI_CONSTANTS.PERFORMANCE.INITIAL_RENDER_COUNT,
    maxToRenderPerBatch: UI_CONSTANTS.PERFORMANCE.BATCH_SIZE,
    windowSize: UI_CONSTANTS.PERFORMANCE.WINDOW_SIZE,
    removeClippedSubviews: true,
    updateCellsBatchingPeriod: UI_CONSTANTS.PERFORMANCE.UPDATE_BATCHING_PERIOD,
    stickySectionHeadersEnabled: true,
    onScroll: config.enableScrollToTop ? handleScroll : undefined,
    scrollEnabled: config.enableSwipeHandling ? !isAnyCardSwiping : true
  }), [scrollViewRef, config.enableScrollToTop, config.enableSwipeHandling, handleScroll, isAnyCardSwiping]);

  return {
    // State
    isInitialized,
    loading,
    error,
    transactions,
    filteredTransactions,
    filters,
    availableCards,
    showScrollToTop,
    isAnyCardSwiping,
    balanceData,
    
    // Refs
    scrollViewRef,
    
    // Store actions
    addTransaction,
    setFilters,
    toggleCategoryFilter,
    clearFilters,
    
    // Transaction management
    transactionManagement,
    
    // Handlers
    handleTransactionPress,
    handleUpdateTransaction,
    handleFileSelect,
    handleImportConfirmLocal,
    handleColumnMappingConfirm,
    handleUndo,
    handleArchiveTransactionLocal,
    handleConfirmArchive,
    handleSwipeStart,
    handleSwipeEnd,
    handleScroll,
    scrollToTop,
    
    // Snackbar
    snackbarMessage,
    showSnackbar,
    setShowSnackbar,
    
    // Renderers
    renderEmptyState,
    renderListHeader,
    
    // Common props
    commonSectionListProps,
    
    // Settings
    confirmDeleteTransactions
  };
}; 