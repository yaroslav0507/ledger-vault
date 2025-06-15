import React, { useMemo, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { CategoryPieChart } from '../components/CategoryPieChart';
import { MonthlyTrendsChart } from '../components/MonthlyTrendsChart';
import { KeyInsights } from '../components/KeyInsights';
import { AnalyticsGridHeader } from '../components/AnalyticsGridHeader';
import { useAnalyticsScreen } from '../hooks/useAnalyticsScreen';
import { BaseScreenLayout, CollapsibleSection } from '@/shared/ui/components';
import { EmptyState } from '@/shared/ui/components/EmptyState';
import { theme } from '@/shared/ui/theme/theme';

export const AnalyticsScreen: React.FC = () => {
  const {
    baseScreen,
    analyticsData,
    insights,
    currency,
    handleTrendsPress,
    handleCategoriesPress,
    sectionsData,
    stickyHeaderProps,
    emptyStateProps,
  } = useAnalyticsScreen();

  const { toggleCategoryFilter, filters } = baseScreen;

  const headerComponent = useMemo(() => {
    const headerProps = baseScreen.renderListHeader();
    const incomeCount = baseScreen.filteredTransactions.filter(t => t.isIncome).length;
    const expenseCount = baseScreen.filteredTransactions.filter(t => !t.isIncome).length;
    return (
      <AnalyticsGridHeader
        balance={headerProps.balance}
        incomeTransactionCount={incomeCount}
        expenseTransactionCount={expenseCount}
        categoryCount={analyticsData.expenseCategories.length}
        currency={currency}
        onTrendsPress={handleTrendsPress}
        onCategoriesPress={handleCategoriesPress}
      />
    );
  }, [baseScreen.renderListHeader, baseScreen.filteredTransactions, analyticsData.expenseCategories.length, currency, handleTrendsPress, handleCategoriesPress]);

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

  return (
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
  );
};

const styles = StyleSheet.create({
  analyticsContent: {
    padding: theme.spacing.sm,
    paddingTop: theme.spacing.xs,
    gap: theme.spacing.md,
  },
}); 