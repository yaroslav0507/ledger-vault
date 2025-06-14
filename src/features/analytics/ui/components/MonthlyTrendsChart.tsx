import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MonthlyTrendData } from '../../service/AnalyticsService';
import { formatCurrency } from '../../../../shared/utils/currencyUtils';
import { theme } from '../../../../shared/ui/theme/theme';
import { UI_CONSTANTS } from '../../../../shared/constants/ui';

interface MonthlyTrendsChartProps {
  data: MonthlyTrendData[];
  currency?: string;
}

export const MonthlyTrendsChart: React.FC<MonthlyTrendsChartProps> = ({ data, currency = 'UAH' }) => {
  if (!data.length) {
    return (
      <View style={styles.emptyState}>
        <Text variant="bodyMedium" style={styles.emptyText}>
          No data available for the selected period
        </Text>
      </View>
    );
  }

  const chartData = data.map(item => ({
    month: item.month.split(' ')[0], // Short month name
    income: item.income,
    expenses: item.expenses,
    net: item.net,
  }));

  const formatYAxisValue = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toFixed(0);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <View style={styles.tooltipContainer}>
          <Text style={[styles.tooltipLabel, { fontFamily: theme.fontFamily.default }]}>
            {label}
          </Text>
          {payload.map((entry: any, index: number) => (
            <Text key={index} style={[styles.tooltipValue, { 
              color: entry.color,
              fontFamily: theme.fontFamily.default
            }]}>
              {entry.name}: {formatCurrency(entry.value, currency)}
            </Text>
          ))}
        </View>
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <View style={styles.chartContainer}>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="month" 
              axisLine={false}
              tickLine={false}
              tick={{ 
                fontSize: 12, 
                fill: theme.colors.text.secondary,
                fontFamily: theme.fontFamily.default
              }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ 
                fontSize: 12, 
                fill: theme.colors.text.secondary,
                fontFamily: theme.fontFamily.default
              }}
              tickFormatter={formatYAxisValue}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ 
                paddingTop: '10px',
                fontFamily: theme.fontFamily.default
              }}
              iconType="line"
            />
            <Line 
              type="monotone" 
              dataKey="income" 
              stroke="#2e7d32" 
              strokeWidth={2}
              dot={{ fill: '#2e7d32', strokeWidth: 2, r: 4 }}
              name="Income"
            />
            <Line 
              type="monotone" 
              dataKey="expenses" 
              stroke="#64748b" 
              strokeWidth={2}
              dot={{ fill: '#64748b', strokeWidth: 2, r: 4 }}
              name="Expenses"
            />
          </LineChart>
        </ResponsiveContainer>
      </View>

      <View style={styles.summaryContainer}>
        {/* Table Header */}
        <View style={[styles.summaryItem, styles.headerRow]}>
          <View style={styles.monthColumn}>
            <Text variant="bodySmall" style={[styles.headerText, { textAlign: 'left' }]}>
              Month
            </Text>
          </View>
          <View style={styles.valuesRow}>
            <View style={styles.valueColumn}>
              <Text variant="bodySmall" style={styles.headerText}>
                Income
              </Text>
            </View>
            <View style={styles.valueColumn}>
              <Text variant="bodySmall" style={styles.headerText}>
                Expenses
              </Text>
            </View>
            <View style={styles.valueColumn}>
              <Text variant="bodySmall" style={styles.headerText}>
                Net
              </Text>
            </View>
          </View>
        </View>

        {/* Data Rows */}
        {data.slice(-3).map((item, index) => (
          <View key={item.month} style={styles.summaryItem}>
            <View style={styles.monthColumn}>
              <Text variant="bodySmall" style={styles.summaryMonth}>
                {item.month}
              </Text>
            </View>
            <View style={styles.valuesRow}>
              <View style={styles.valueColumn}>
                <Text variant="bodySmall" style={[styles.summaryValue, styles.incomeText]}>
                  {formatCurrency(item.income, currency)}
                </Text>
              </View>
              <View style={styles.valueColumn}>
                <Text variant="bodySmall" style={[styles.summaryValue, styles.expenseText]}>
                  {formatCurrency(item.expenses, currency)}
                </Text>
              </View>
              <View style={styles.valueColumn}>
                <Text variant="bodySmall" style={[
                  styles.summaryValue, 
                  item.net >= 0 ? styles.netPositive : styles.netNegative
                ]}>
                  {formatCurrency(item.net, currency)}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  chart: {
    marginVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
  },
  tooltipContainer: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tooltipLabel: {
    ...theme.typography.caption,
    fontWeight: UI_CONSTANTS.FONT_WEIGHTS.BOLD,
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  tooltipValue: {
    ...theme.typography.caption,
    fontWeight: UI_CONSTANTS.FONT_WEIGHTS.MEDIUM,
  },
  summaryContainer: {
    gap: theme.spacing.xs,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerRow: {
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerText: {
    ...theme.typography.caption,
    color: theme.colors.text.primary,
    fontWeight: UI_CONSTANTS.FONT_WEIGHTS.BOLD,
    textAlign: 'right',
  },
  monthColumn: {
    minWidth: 80,
    justifyContent: 'center',
  },
  summaryMonth: {
    ...theme.typography.body,
    color: theme.colors.text.primary,
    fontWeight: UI_CONSTANTS.FONT_WEIGHTS.MEDIUM,
  },
  valuesRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  valueColumn: {
    flex: 1,
    alignItems: 'flex-end',
  },
  summaryValue: {
    ...theme.typography.caption,
    fontWeight: UI_CONSTANTS.FONT_WEIGHTS.MEDIUM,
    textAlign: 'right',
  },
  incomeText: {
    color: theme.colors.success,
  },
  expenseText: {
    color: theme.colors.expense,
  },
  netPositive: {
    color: theme.colors.success,
  },
  netNegative: {
    color: theme.colors.expense,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl,
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
}); 