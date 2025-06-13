import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Icon } from 'react-native-paper';
import { AnalyticsData, AnalyticsService } from '../../service/AnalyticsService';
import { theme } from '../../../../shared/ui/theme/theme';

interface SummaryCardsProps {
  data: AnalyticsData;
}

interface SummaryCardProps {
  title: string;
  value: string;
  icon: string;
  color: string;
  subtitle?: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, icon, color, subtitle }) => (
  <Card style={styles.card}>
    <Card.Content style={styles.cardContent}>
      <View style={styles.cardHeader}>
        <Icon source={icon} size={24} color={color} />
        <Text variant="bodySmall" style={styles.cardTitle}>{title}</Text>
      </View>
      <Text variant="headlineSmall" style={[styles.cardValue, { color }]}>
        {value}
      </Text>
      {subtitle && (
        <Text variant="bodySmall" style={styles.cardSubtitle}>
          {subtitle}
        </Text>
      )}
    </Card.Content>
  </Card>
);

export const SummaryCards: React.FC<SummaryCardsProps> = ({ data }) => {
  const netIncomeColor = data.netIncome >= 0 ? theme.colors.success : theme.colors.error;
  
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <SummaryCard
          title="Total Income"
          value={AnalyticsService.formatCurrency(data.totalIncome)}
          icon="trending-up"
          color={theme.colors.success}
          subtitle={`${data.transactionCount} transactions`}
        />
        <SummaryCard
          title="Total Expenses"
          value={AnalyticsService.formatCurrency(data.totalExpenses)}
          icon="trending-down"
          color={theme.colors.error}
        />
      </View>
      
      <View style={styles.row}>
        <SummaryCard
          title="Net Income"
          value={AnalyticsService.formatCurrency(data.netIncome)}
          icon={data.netIncome >= 0 ? "cash-plus" : "cash-minus"}
          color={netIncomeColor}
          subtitle={data.netIncome >= 0 ? "Positive flow" : "Negative flow"}
        />
        <SummaryCard
          title="Categories"
          value={data.categoryBreakdown.length.toString()}
          icon="shape"
          color={theme.colors.primary}
          subtitle="Active categories"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  card: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    elevation: 2,
  },
  cardContent: {
    padding: theme.spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  cardTitle: {
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardValue: {
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
  },
  cardSubtitle: {
    color: theme.colors.text.secondary,
    fontSize: 12,
  },
}); 