import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { LineChart } from 'react-native-chart-kit';
import { MonthlyTrendData, AnalyticsService } from '../../service/AnalyticsService';
import { theme } from '../../../../shared/ui/theme/theme';

interface MonthlyTrendsChartProps {
  data: MonthlyTrendData[];
}

const screenWidth = Dimensions.get('window').width;

export const MonthlyTrendsChart: React.FC<MonthlyTrendsChartProps> = ({ data }) => {
  if (!data.length) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.title}>Monthly Trends</Text>
          <View style={styles.emptyState}>
            <Text variant="bodyMedium" style={styles.emptyText}>
              No data available for the selected period
            </Text>
          </View>
        </Card.Content>
      </Card>
    );
  }

  const chartData = {
    labels: data.map(item => item.month.split(' ')[0]),
    datasets: [
      {
        data: data.map(item => item.income),
        color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
        strokeWidth: 2,
      },
      {
        data: data.map(item => item.expenses),
        color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
        strokeWidth: 2,
      },
    ],
    legend: ['Income', 'Expenses'],
  };

  const chartConfig = {
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    style: {
      borderRadius: theme.borderRadius.md,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: theme.colors.surface,
    },
    formatYLabel: (value: string) => {
      const num = parseFloat(value);
      if (num >= 1000000) {
        return `${(num / 1000000).toFixed(1)}M`;
      } else if (num >= 1000) {
        return `${(num / 1000).toFixed(1)}K`;
      }
      return num.toFixed(0);
    },
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleMedium" style={styles.title}>Monthly Trends</Text>
        
        <View style={styles.chartContainer}>
          <LineChart
            data={chartData}
            width={screenWidth - 64}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </View>

        <View style={styles.summaryContainer}>
          {data.slice(-3).map((item, index) => (
            <View key={item.month} style={styles.summaryItem}>
              <Text variant="bodySmall" style={styles.summaryMonth}>
                {item.month}
              </Text>
              <View style={styles.summaryValues}>
                <Text variant="bodySmall" style={[styles.summaryValue, { color: theme.colors.success }]}>
                  ↗ {AnalyticsService.formatCurrency(item.income)}
                </Text>
                <Text variant="bodySmall" style={[styles.summaryValue, { color: theme.colors.error }]}>
                  ↘ {AnalyticsService.formatCurrency(item.expenses)}
                </Text>
                <Text variant="bodySmall" style={[
                  styles.summaryValue, 
                  { color: item.net >= 0 ? theme.colors.success : theme.colors.error }
                ]}>
                  Net: {AnalyticsService.formatCurrency(item.net)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    elevation: 2,
  },
  title: {
    marginBottom: theme.spacing.md,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  chart: {
    marginVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
  },
  summaryContainer: {
    gap: theme.spacing.sm,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  summaryMonth: {
    color: theme.colors.text.primary,
    fontWeight: '500',
    minWidth: 80,
  },
  summaryValues: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    flex: 1,
    justifyContent: 'flex-end',
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl,
  },
  emptyText: {
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
}); 