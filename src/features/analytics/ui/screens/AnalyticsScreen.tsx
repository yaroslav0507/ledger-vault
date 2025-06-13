import React, { useMemo, useCallback } from 'react';
import { SectionList, StyleSheet, View } from 'react-native';
import { Text, Card, Chip } from 'react-native-paper';
import { SummaryCards } from '../components/SummaryCards';
import { CategoryPieChart } from '../components/CategoryPieChart';
import { MonthlyTrendsChart } from '../components/MonthlyTrendsChart';
import { AnalyticsService } from '../../service/AnalyticsService';
import { useTransactionStore } from '../../../transactions/store/transactionStore';
import { StickyHeader } from '../../../../shared/ui/components/StickyHeader';
import { EmptyState } from '../../../../shared/ui/components';
import { theme } from '../../../../shared/ui/theme/theme';

export const AnalyticsScreen: React.FC = () => {
  const { 
    transactions, 
    loading, 
    filters
  } = useTransactionStore();

  const filteredTransactions = useMemo(() => {
    if (!filters.dateRange) return transactions;
    
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      const startDate = new Date(filters.dateRange!.start);
      const endDate = new Date(filters.dateRange!.end);
      
      return transactionDate >= startDate && transactionDate <= endDate;
    });
  }, [transactions, filters.dateRange]);

  const analyticsData = useMemo(() => {
    return AnalyticsService.calculateAnalytics(filteredTransactions);
  }, [filteredTransactions]);

  const insights = useMemo(() => {
    return AnalyticsService.getInsights(analyticsData);
  }, [analyticsData]);

  const analyticsTitle = useMemo(() => {
    const count = analyticsData.transactionCount;
    return count > 0 ? `Analytics (${count} transactions)` : 'Analytics';
  }, [analyticsData.transactionCount]);

  // Create sections for SectionList
  const sectionsData = useMemo(() => [
    {
      title: 'Analytics',
      data: ['analytics'] // Single item to render all analytics content
    }
  ], []);

  // Render sticky header
  const renderStickyHeader = useCallback(() => (
    <StickyHeader
      title={analyticsTitle}
      actionButton={{
        icon: '📊',
        label: 'Export',
        onPress: () => {
          // TODO: Implement export functionality
          console.log('Export analytics data');
        },
        isActive: false
      }}
    />
  ), [analyticsTitle]);

  // Render analytics content
  const renderAnalyticsItem = useCallback(() => (
    <View style={styles.analyticsContent}>
      <SummaryCards data={analyticsData} />

      {analyticsData.categoryBreakdown.length > 0 && (
        <CategoryPieChart data={analyticsData.categoryBreakdown} />
      )}

      {analyticsData.monthlyTrends.length > 0 && (
        <MonthlyTrendsChart data={analyticsData.monthlyTrends} />
      )}

      {analyticsData.transactionCount === 0 && (
        <EmptyState
          title="No Data Available"
          description="No transactions found for the selected time period. Try selecting a different date range or add some transactions to see your analytics."
        />
      )}
    </View>
  ), [analyticsData]);

  // Render header with insights
  const renderListHeader = useCallback(() => (
    <View>
      {insights.length > 0 && (
        <Card style={styles.insightsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.insightsTitle}>Key Insights</Text>
            <View style={styles.insightsContainer}>
              {insights.map((insight, index) => (
                <Chip 
                  key={index} 
                  mode="outlined" 
                  style={styles.insightChip}
                  textStyle={styles.insightText}
                >
                  {insight}
                </Chip>
              ))}
            </View>
          </Card.Content>
        </Card>
      )}
    </View>
  ), [insights]);

  if (loading) {
    return (
      <View style={styles.container}>
        <EmptyState
          loading={true}
          loadingText="Loading analytics..."
          title=""
          description=""
          showCard={false}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SectionList
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        sections={sectionsData}
        keyExtractor={(item) => item}
        renderItem={renderAnalyticsItem}
        renderSectionHeader={renderStickyHeader}
        ListHeaderComponent={renderListHeader}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  analyticsContent: {
    gap: theme.spacing.md,
  },
  insightsCard: {
    backgroundColor: theme.colors.surface,
    elevation: 2,
    marginBottom: theme.spacing.md,
  },
  insightsTitle: {
    color: theme.colors.text.primary,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },
  insightsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  insightChip: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderColor: theme.colors.border,
  },
  insightText: {
    fontSize: 12,
    color: theme.colors.text.primary,
  },
}); 