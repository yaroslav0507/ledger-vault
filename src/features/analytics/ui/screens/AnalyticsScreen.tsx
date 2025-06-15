import React, { useMemo, useCallback, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { CategoryPieChart } from '../components/CategoryPieChart';
import { MonthlyTrendsChart } from '../components/MonthlyTrendsChart';
import { KeyInsights } from '../components/KeyInsights';
import { AnalyticsGridHeader } from '../components/AnalyticsGridHeader';
import { AnalyticsService } from '../../service/AnalyticsService';
import { useBaseScreen } from '@/shared/hooks';
import { BaseScreenLayout, CollapsibleSection } from '@/shared/ui/components';
import { EmptyState } from '@/shared/ui/components/EmptyState';
import { theme } from '@/shared/ui/theme/theme';

export const AnalyticsScreen: React.FC = () => {
  const baseScreen = useBaseScreen({
    screenName: 'Analytics',
    loadAvailableCards: false,
    enableScrollToTop: true,
    enableSwipeHandling: false
  });
  const { toggleCategoryFilter, filters } = baseScreen;

  const currency = useMemo(() => {
    const firstTransaction = baseScreen.filteredTransactions[0];
    return firstTransaction?.currency || 'UAH';
  }, [baseScreen.filteredTransactions]);

  const analyticsData = useMemo(() => {
    return AnalyticsService.calculateAnalytics(baseScreen.filteredTransactions);
  }, [baseScreen.filteredTransactions]);

  const insights = useMemo(() => {
    return AnalyticsService.getInsights(analyticsData, currency);
  }, [analyticsData, currency]);

  const listItems = useMemo(() => {
    const items: string[] = [];
    items.push('trends');
    items.push('categories');
    items.push('insights');
    return items;
  }, [analyticsData]);

  const scrollToKey = useCallback((key: string) => {
    const index = listItems.indexOf(key);
    if (index === -1) return;
    
    // Delay to ensure list has finished layout (especially on web)
    setTimeout(() => {
      const list = baseScreen.scrollViewRef.current as any;
      list?.scrollToLocation({
        sectionIndex: 0,
        itemIndex: index,
        viewPosition: 0,
        animated: true,
      });
    }, 100);
  }, [listItems, baseScreen.scrollViewRef]);

  const handleTrendsPress = useCallback(() => scrollToKey('trends'), [scrollToKey]);
  const handleCategoriesPress = useCallback(() => scrollToKey('categories'), [scrollToKey]);

  // Create header component with grid layout
  const headerComponent = useMemo(() => {
    const headerProps = baseScreen.renderListHeader();
    return (
      <AnalyticsGridHeader
        balance={headerProps.balance}
        transactionCount={baseScreen.filteredTransactions.length}
        categoryCount={analyticsData.expenseCategories.length}
        currency={currency}
        onTrendsPress={handleTrendsPress}
        onCategoriesPress={handleCategoriesPress}
      />
    );
  }, [baseScreen.renderListHeader, baseScreen.filteredTransactions.length, analyticsData.expenseCategories.length, currency, handleTrendsPress, handleCategoriesPress]);

  // Create sections for SectionList
  const sectionsData = useMemo(() => [{ title: 'Analytics', data: listItems }], [listItems]);

  // Render analytics list rows
  const renderAnalyticsItem = useCallback(({ item }: { item: string }) => {
    switch (item) {
      case 'trends':
        return (
          <View style={styles.analyticsContent}>
            <CollapsibleSection
              title="Monthly Trends"
              subtitle={`${analyticsData.monthlyTrends.length} months`}
            >
              <MonthlyTrendsChart data={analyticsData.monthlyTrends} currency={currency} />
            </CollapsibleSection>
          </View>
        );
      case 'categories':
        return (
          <View style={styles.analyticsContent}>
            <CollapsibleSection
              title="Category Breakdown"
              subtitle={`${analyticsData.expenseCategories.length} categories`}
            >
              <CategoryPieChart
                data={analyticsData.expenseCategories}
                currency={currency}
                onCategoryLongPress={toggleCategoryFilter}
                activeCategories={filters.categories || []}
              />
            </CollapsibleSection>
          </View>
        );
      case 'insights':
        return (
          <View style={styles.analyticsContent}>
            <KeyInsights insights={insights} />
            {analyticsData.transactionCount === 0 && (
              <EmptyState
                title="No Data Available"
                description="No transactions found for the selected time period. Try selecting a different date range or add some transactions to see your analytics."
              />
            )}
          </View>
        );
      default:
        return <View />;
    }
  }, [analyticsData, insights, currency, toggleCategoryFilter, filters.categories]);

  // Sticky header props for BaseScreenLayout
  const stickyHeaderProps = useMemo(() => ({
    transactionCount: baseScreen.filteredTransactions.length,
    totalTransactionCount: baseScreen.transactions.length,
    filters: baseScreen.filters,
    setFilters: baseScreen.setFilters,
    clearFilters: baseScreen.clearFilters,
    availableCards: baseScreen.availableCards,
    transactions: baseScreen.transactions,
    screenTitle: 'Analytics'
  }), [
    baseScreen.filteredTransactions.length,
    baseScreen.transactions.length,
    baseScreen.filters,
    baseScreen.setFilters,
    baseScreen.clearFilters,
    baseScreen.availableCards,
    baseScreen.transactions
  ]);

  const emptyStateProps = baseScreen.renderEmptyState();

  return (
    <>
      <BaseScreenLayout
        isInitialized={baseScreen.isInitialized}
        screenName="Analytics"
        sections={sectionsData}
        renderItem={renderAnalyticsItem}
        keyExtractor={(item) => item}
        headerComponent={headerComponent}
        stickyHeaderProps={stickyHeaderProps}
        emptyStateProps={emptyStateProps}
        showScrollToTop={baseScreen.showScrollToTop}
        onScrollToTop={baseScreen.scrollToTop}
        sectionListRef={baseScreen.scrollViewRef}
        sectionListProps={baseScreen.commonSectionListProps}
      />

    </>
  );
};

const styles = StyleSheet.create({
  analyticsContent: {
    padding: theme.spacing.sm,
    paddingTop: theme.spacing.xs,
    gap: theme.spacing.md,
  },
}); 