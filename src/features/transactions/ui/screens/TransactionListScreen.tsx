import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useBaseScreen } from '@/shared/hooks';
import { BaseScreenLayout, MetricsSummaryHeader } from '@/shared/ui/components';
import { TransactionCard } from '../components/TransactionCard';
import { Transaction } from '../../model/Transaction';
import { useTranslation } from '@/shared/i18n/useTranslation';

export const TransactionListScreen: React.FC = () => {
  const { t } = useTranslation();
  const baseScreen = useBaseScreen({
    screenName: t('transactions.transactionsScreen'),
    loadAvailableCards: true,
    enableScrollToTop: true,
    enableSwipeHandling: true
  });

  const renderSectionItem = useCallback(({ item: transaction }: { item: Transaction }) => (
    <TransactionCard
      transaction={transaction}
      onLongPress={() => baseScreen.handleTransactionPress(transaction)}
      onCategoryPress={baseScreen.toggleCategoryFilter}
      onEdit={baseScreen.transactionManagement.editModal.open}
      onArchive={baseScreen.handleArchiveTransactionLocal}
      isBeingRemoved={baseScreen.transactionManagement.removingTransactionIds.has(transaction.id)}
      onSwipeStart={baseScreen.handleSwipeStart}
      onSwipeEnd={baseScreen.handleSwipeEnd}
    />
  ), [
    baseScreen.handleTransactionPress,
    baseScreen.toggleCategoryFilter,
    baseScreen.transactionManagement.editModal.open,
    baseScreen.handleArchiveTransactionLocal,
    baseScreen.transactionManagement.removingTransactionIds,
    baseScreen.handleSwipeStart,
    baseScreen.handleSwipeEnd
  ]);

  // Create header component
  const headerComponent = useMemo(() => (
    <MetricsSummaryHeader {...baseScreen.renderListHeader()} />
  ), [baseScreen.renderListHeader]);

  // Sticky header props for BaseScreenLayout
  const stickyHeaderProps = useMemo(() => ({
    transactionCount: baseScreen.filteredTransactions.length,
    totalTransactionCount: baseScreen.transactions.length,
    filters: baseScreen.filters,
    setFilters: baseScreen.setFilters,
    clearFilters: baseScreen.clearFilters,
    availableCards: baseScreen.availableCards,
    transactions: baseScreen.transactions,
    screenTitle: t('transactions.transactionsScreen')
  }), [
    baseScreen.filteredTransactions.length, 
    baseScreen.transactions.length, 
    baseScreen.filters, 
    baseScreen.setFilters, 
    baseScreen.clearFilters, 
    baseScreen.availableCards, 
    baseScreen.transactions,
    t
  ]);

  const sectionsData = useMemo(() => [
    {
      title: t('transactions.transactionsList'),
      data: baseScreen.filteredTransactions
    }
  ], [baseScreen.filteredTransactions, t]);

  const getItemLayout = useCallback((data: any, index: number) => ({
    length: 80, // UI_CONSTANTS.DIMENSIONS.TRANSACTION_CARD_HEIGHT
    offset: 80 * index,
    index,
  }), []);

  const emptyStateProps = baseScreen.renderEmptyState();

  return (
    <BaseScreenLayout
      isInitialized={baseScreen.isInitialized}
      screenName={t('transactions.transactionsScreen')}
      sections={sectionsData}
      renderItem={renderSectionItem}
      keyExtractor={(item) => item.id}
      headerComponent={headerComponent}
      stickyHeaderProps={stickyHeaderProps}
      emptyStateProps={emptyStateProps}
      showScrollToTop={baseScreen.showScrollToTop}
      onScrollToTop={baseScreen.scrollToTop}
      sectionListRef={baseScreen.scrollViewRef}
      sectionListProps={{
        ...baseScreen.commonSectionListProps,
        getItemLayout
      }}
    />
  );
}; 