import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { PieChart } from 'react-native-chart-kit';
import { CategoryData, AnalyticsService } from '../../service/AnalyticsService';
import { theme } from '../../../../shared/ui/theme/theme';

interface CategoryPieChartProps {
  data: CategoryData[];
}

const screenWidth = Dimensions.get('window').width;

export const CategoryPieChart: React.FC<CategoryPieChartProps> = ({ data }) => {
  if (!data.length) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.title}>Category Breakdown</Text>
          <View style={styles.emptyState}>
            <Text variant="bodyMedium" style={styles.emptyText}>
              No data available for the selected period
            </Text>
          </View>
        </Card.Content>
      </Card>
    );
  }

  const chartData = data.slice(0, 8).map(item => ({
    name: item.category,
    population: item.amount,
    color: item.color,
    legendFontColor: theme.colors.text.primary,
    legendFontSize: 12,
  }));

  const chartConfig = {
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(17, 24, 39, ${opacity})`,
    style: {
      borderRadius: theme.borderRadius.md,
    },
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleMedium" style={styles.title}>Category Breakdown</Text>
        
        <View style={styles.chartContainer}>
          <PieChart
            data={chartData}
            width={screenWidth - 64}
            height={220}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            center={[10, 0]}
            absolute
          />
        </View>

        <View style={styles.legendContainer}>
          {data.slice(0, 5).map((item, index) => (
            <View key={item.category} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: item.color }]} />
              <View style={styles.legendText}>
                <Text variant="bodyMedium" style={styles.legendCategory}>
                  {item.category}
                </Text>
                <Text variant="bodySmall" style={styles.legendAmount}>
                  {AnalyticsService.formatCurrency(item.amount)} ({item.percentage.toFixed(1)}%)
                </Text>
              </View>
            </View>
          ))}
          {data.length > 5 && (
            <Text variant="bodySmall" style={styles.moreText}>
              +{data.length - 5} more categories
            </Text>
          )}
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
  legendContainer: {
    gap: theme.spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: theme.borderRadius.sm,
  },
  legendText: {
    flex: 1,
  },
  legendCategory: {
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  legendAmount: {
    color: theme.colors.text.secondary,
  },
  moreText: {
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: theme.spacing.xs,
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