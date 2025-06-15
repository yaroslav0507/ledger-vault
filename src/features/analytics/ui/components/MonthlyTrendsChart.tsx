import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Text } from 'react-native-paper';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine, ResponsiveContainer } from 'recharts';
import { MonthlyTrendData } from '../../service/AnalyticsService';
import { formatCurrency } from '../../../../shared/utils/currencyUtils';
import { theme } from '../../../../shared/ui/theme/theme';
import { UI_CONSTANTS } from '../../../../shared/constants/ui';
import { format } from 'date-fns';

interface MonthlyTrendsChartProps {
  data: MonthlyTrendData[];
  currency?: string;
}

export const MonthlyTrendsChart: React.FC<MonthlyTrendsChartProps> = ({ data, currency = 'UAH' }) => {
  // Always call hooks at the top level, before any return or conditional
  const currentMonthShort = format(new Date(), 'MMM');
  const initialIndex = data.findIndex((item: MonthlyTrendData) => item.month.startsWith(currentMonthShort))
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number | null>(initialIndex);
  const [tooltipPos, setTooltipPos] = useState<{ x: number, y: number } | null>(null);
  const chartRef = useRef<any>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  const chartData = useMemo(() => data.map((item: MonthlyTrendData) => ({
    month: item.month, // Full month and year, e.g. 'Jun 2024'
    income: item.income,
    expenses: item.expenses,
    net: item.net,
  })), [data]);

  useEffect(() => {
    const idx = data.findIndex((item: MonthlyTrendData) => item.month.startsWith(currentMonthShort));
    setSelectedMonthIndex(idx !== -1 ? idx : null);
  }, [data, currentMonthShort]);

  useEffect(() => {
    if (Platform.OS === 'web' && chartRef.current && selectedMonthIndex !== null) {
      const updateTooltip = () => {
        const svg = chartRef.current.querySelector('svg');
        if (svg) {
          const circles = svg.querySelectorAll('circle');
          const dotsPerLine = chartData.length;
          const incomeDotIndex = selectedMonthIndex;
          const expenseDotIndex = dotsPerLine + selectedMonthIndex;
          const dot = circles[incomeDotIndex || expenseDotIndex];
          if (dot) {
            const dotRect = dot.getBoundingClientRect();
            const containerRect = chartRef.current.getBoundingClientRect();
            setTooltipPos({
              x: dotRect.left - containerRect.left + dotRect.width / 2,
              y: dotRect.top - containerRect.top + dotRect.height / 2,
            });
          } else {
            // Retry after a short delay if dot is not found
            setTimeout(updateTooltip, 100);
          }
        }
      };
      updateTooltip();
    }
  }, [selectedMonthIndex, data]);

  const handleSelectMonth = useCallback((index: number) => {
    setSelectedMonthIndex(index);
  }, []);

  const handleChartClick = useCallback((e: any) => {
    if (e && e.activeTooltipIndex != null) {
      setSelectedMonthIndex(e.activeTooltipIndex);
    }
  }, []);

  const periodData = selectedMonthIndex !== null && data[selectedMonthIndex] ? data[selectedMonthIndex] : null;

  if (!data.length) {
    return (
      <View style={styles.emptyState}>
        <Text variant="bodyMedium" style={styles.emptyText}>
          No data available for the selected period
        </Text>
      </View>
    );
  }

  const formatYAxisValue = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toFixed(0);
  };

  const minWidth = 180;
  let left = tooltipPos ? tooltipPos.x - minWidth / 2 : undefined;
  if (left !== undefined) {
    if (left < 8) left = 8;
    if (containerWidth && left + minWidth > containerWidth - 8) {
      left = containerWidth - minWidth - 8;
    }
  }
  const tooltipStyle = tooltipPos
    ? { top: tooltipPos.y - 100, left, minWidth }
    : { top: 16, right: 16, minWidth };

  const tooltipContent = periodData && (
    <View style={[styles.tooltipContainer, tooltipStyle]}>
      <Text style={[styles.tooltipLabel, { fontFamily: theme.fontFamily.default }]}> {periodData.month} </Text>
      <Text style={[styles.tooltipValue, { color: '#2e7d32', fontFamily: theme.fontFamily.default }]}> <View style={{ width: 8, height: 8, backgroundColor: '#2e7d32', borderRadius: 4 }} /> Income: {formatCurrency(periodData.income, currency)} </Text>
      <Text style={[styles.tooltipValue, { color: '#64748b', fontFamily: theme.fontFamily.default }]}> <View style={{ width: 8, height: 8, backgroundColor: '#64748b', borderRadius: 4 }} /> Expenses: {formatCurrency(periodData.expenses, currency)} </Text>
      <Text style={[styles.tooltipValue, { color: periodData.net >= 0 ? theme.colors.success : theme.colors.expense, fontFamily: theme.fontFamily.default }]}> <View style={{ width: 8, height: 8, backgroundColor: theme.colors.success, borderRadius: 4 }} /> Cashflow: {formatCurrency(periodData.net, currency)} </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {tooltipContent}
  
      <View
        ref={Platform.OS === 'web' ? chartRef : undefined}
        style={[styles.chartContainer]}
        onLayout={e => setContainerWidth(e.nativeEvent.layout.width)}
      > 
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} onClick={handleChartClick}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="month" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: theme.colors.text.secondary, fontFamily: theme.fontFamily.default }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: theme.colors.text.secondary, fontFamily: theme.fontFamily.default }}
              tickFormatter={formatYAxisValue}
            />
            {periodData && (
              <ReferenceLine
                x={periodData.month}
                stroke={theme.colors.secondary}
                strokeDasharray="5 5"
                strokeWidth={1}
              />
            )}
            <Line 
              type="monotone" 
              dataKey="income" 
              stroke="#2e7d32" 
              strokeWidth={2}
              dot={(props: any) => {
                const isSelected = selectedMonthIndex !== null && props.index === selectedMonthIndex;
                return (
                  <circle
                    key={`income-dot-${props.index}`}
                    cx={props.cx}
                    cy={props.cy}
                    r={isSelected ? 4 : 2}
                    fill="#2e7d32"
                    stroke={isSelected ? '#fff' : '#2e7d32'}
                    strokeWidth={isSelected ? 2 : 1}
                  />
                );
              }}
              name="Income"
            />
            <Line 
              type="monotone" 
              dataKey="expenses" 
              stroke="#64748b" 
              strokeWidth={2}
              dot={(props: any) => {
                const isSelected = selectedMonthIndex !== null && props.index === selectedMonthIndex;
                return (
                  <circle
                    key={`expenses-dot-${props.index}`}
                    cx={props.cx}
                    cy={props.cy}
                    r={isSelected ? 4 : 2}
                    fill="#64748b"
                    stroke={isSelected ? '#fff' : '#64748b'}
                    strokeWidth={isSelected ? 2 : 1}
                  />
                );
              }}
              name="Expenses"
            />
          </LineChart>
        </ResponsiveContainer>
      </View>

      <View style={styles.summaryContainer}>
        {/* Table Header */}
        <View style={[styles.summaryItem, styles.headerRow]}>
          <View style={styles.monthColumn}>
            <Text variant="bodySmall" style={[styles.headerText, { textAlign: 'left' }]}> Month </Text>
          </View>
          <View style={styles.valuesRow}>
            <View style={styles.valueColumn}>
              <Text variant="bodySmall" style={styles.headerText}> Income </Text>
            </View>
            <View style={styles.valueColumn}>
              <Text variant="bodySmall" style={styles.headerText}> Expenses </Text>
            </View>
            <View style={styles.valueColumn}>
              <Text variant="bodySmall" style={styles.headerText}> Cashflow </Text>
            </View>
          </View>
        </View>

        {/* Data Rows */}
        {data.map((item, index) => (
          <TouchableOpacity
            key={item.month}
            style={[styles.summaryItem, selectedMonthIndex === index && { backgroundColor: theme.colors.primary + '22' }]}
            onPress={() => handleSelectMonth(index)}
            accessibilityLabel={selectedMonthIndex === index ? 'Selected month' : undefined}
            activeOpacity={0.8}
          >
            <View style={styles.monthColumn}>
              <Text variant="bodySmall" style={styles.summaryMonth}> {item.month} </Text>
            </View>
            <View style={styles.valuesRow}>
              <View style={styles.valueColumn}>
                <Text variant="bodySmall" style={[styles.summaryValue, styles.incomeText]}> {formatCurrency(item.income, currency)} </Text>
              </View>
              <View style={styles.valueColumn}>
                <Text variant="bodySmall" style={[styles.summaryValue, styles.expenseText]}> {formatCurrency(item.expenses, currency)} </Text>
              </View>
              <View style={styles.valueColumn}>
                <Text variant="bodySmall" style={[styles.summaryValue, item.net >= 0 ? styles.netPositive : styles.netNegative]}> {formatCurrency(item.net, currency)} </Text>
              </View>
            </View>
          </TouchableOpacity>
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
    minHeight: 300,
    maxHeight: 350,
    flex: 1,
  },
  chart: {
    marginVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
  },
  tooltipContainer: {
    backgroundColor: 'rgba(255, 255, 255, .9)',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'absolute',
    zIndex: 1,
    minWidth: 180,
    // @ts-ignore
    transition: 'all 0.3s ease',
  },
  tooltipLabel: {
    ...theme.typography.caption,
    fontWeight: UI_CONSTANTS.FONT_WEIGHTS.BOLD,
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  tooltipValue: {
    ...theme.typography.caption,
    display: 'flex',
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
    fontWeight: UI_CONSTANTS.FONT_WEIGHTS.MEDIUM,
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
  summaryContainer: {
    flex: 1,
  },
}); 