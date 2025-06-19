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
import { useTranslation } from '@/shared/i18n/useTranslation';

export const AnalyticsScreen: React.FC = () => {
  const { t } = useTranslation();
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
              title={t('analytics.monthlyTrends')}
              subtitle={t('analytics.monthCount', { count: analyticsData.monthlyTrends.length })}
            >
              <MonthlyTrendsChart data={analyticsData.monthlyTrends} currency={currency} />
            </CollapsibleSection>
          </View>
        );
      case 'categories':
        return (
          <View style={styles.analyticsContent}>
            <CollapsibleSection
              title={t('analytics.categoryBreakdown')}
              subtitle={t('analytics.categoryCount', { count: analyticsData.expenseCategories.length })}
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
                title={t('analytics.noDataAvailable')}
                description={t('analytics.noAnalyticsDescription')}
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
      screenName={t('navigation.analytics')}
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