import { useMemo, useCallback } from 'react';
import { useBaseScreen } from '@/shared/hooks';
import { AnalyticsService } from '../../service/AnalyticsService';
import { useTranslation } from '@/shared/i18n/useTranslation';

export const useAnalyticsScreen = () => {
  const { t, getCurrentLanguage } = useTranslation();
  const baseScreen = useBaseScreen({
    screenName: 'Analytics',
    loadAvailableCards: false,
    enableScrollToTop: true,
    enableSwipeHandling: false,
  });

  const currency = useMemo(() => {
    const first = baseScreen.filteredTransactions[0];
    return first?.currency || 'UAH';
  }, [baseScreen.filteredTransactions]);

  const analyticsData = useMemo(() => {
    return AnalyticsService.calculateAnalytics(baseScreen.filteredTransactions, getCurrentLanguage());
  }, [baseScreen.filteredTransactions, getCurrentLanguage]);

  const insights = useMemo(() => {
    return AnalyticsService.getInsights(analyticsData, currency, t);
  }, [analyticsData, currency, t]);

  const listItems = useMemo(() => ['trends', 'categories', 'insights'], []);

  const scrollToKey = useCallback(
    (key: string) => {
      const index = listItems.indexOf(key);
      if (index === -1) return;
      setTimeout(() => {
        const list = baseScreen.scrollViewRef.current as any;
        list?.scrollToLocation({
          sectionIndex: 0,
          itemIndex: index + 1,
          viewPosition: 0,
          animated: true,
        });
      }, 100);
    },
    [listItems, baseScreen.scrollViewRef],
  );

  const handleTrendsPress = useCallback(() => scrollToKey('trends'), [scrollToKey]);
  const handleCategoriesPress = useCallback(() => scrollToKey('categories'), [scrollToKey]);

  const sectionsData = useMemo(
    () => [{ title: 'Analytics', data: listItems }],
    [listItems],
  );

  const stickyHeaderProps = useMemo(
    () => ({
      transactionCount: baseScreen.filteredTransactions.length,
      totalTransactionCount: baseScreen.transactions.length,
      filters: baseScreen.filters,
      setFilters: baseScreen.setFilters,
      clearFilters: baseScreen.clearFilters,
      availableCards: baseScreen.availableCards,
      transactions: baseScreen.transactions,
      screenTitle: t('navigation.analytics'),
    }),
    [
      baseScreen.filteredTransactions.length,
      baseScreen.transactions.length,
      baseScreen.filters,
      baseScreen.setFilters,
      baseScreen.clearFilters,
      baseScreen.availableCards,
      baseScreen.transactions,
    ],
  );

  const emptyStateProps = baseScreen.renderEmptyState();

  return {
    baseScreen,
    currency,
    analyticsData,
    insights,
    listItems,
    sectionsData,
    scrollToKey,
    handleTrendsPress,
    handleCategoriesPress,
    stickyHeaderProps,
    emptyStateProps,
  };
}; 