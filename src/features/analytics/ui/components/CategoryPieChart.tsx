import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Sector } from 'recharts';
import { CategoryData } from '../../service/AnalyticsService';
import { formatCurrency } from '../../../../shared/utils/currencyUtils';
import { theme } from '../../../../shared/ui/theme/theme';
import { UI_CONSTANTS } from '../../../../shared/constants/ui';

interface CategoryPieChartProps {
  data: CategoryData[];
  currency?: string;
}

export const CategoryPieChart: React.FC<CategoryPieChartProps> = ({ data, currency = 'UAH' }) => {
  const [showAllCategories, setShowAllCategories] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState<number | null>(data.length > 0 ? 0 : null);
  const [hoverIndex, setHoverIndex] = React.useState<number | null>(null);

  const finalActiveIndex = hoverIndex ?? activeIndex;
  
  // Reset activeIndex when data changes
  React.useEffect(() => {
    setActiveIndex(data.length > 0 ? 0 : null);
  }, [data]);
  
  if (!data.length) {
    return (
      <View style={styles.emptyState}>
        <Text variant="bodyMedium" style={styles.emptyText}>
          No data available for the selected period
        </Text>
      </View>
    );
  }

  const chartData = data.slice(0, 8).map(item => ({
    name: item.category.length > 15 ? `${item.category.substring(0, 15)}...` : item.category,
    fullName: item.category,
    value: item.amount,
    color: item.color,
    percentage: item.percentage,
  }));

  const renderActiveShape = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload } = props;
    const RADIAN = Math.PI / 180;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 20) * cos;
    const my = cy + (outerRadius + 20) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 16;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
      <g>
        <text
          x={cx}
          y={cy}
          dy={8}
          textAnchor="middle"
          fill={fill}
          style={{ fontFamily: theme.fontFamily.default, fontSize: 12, fontWeight: 'bold' }}
        >
          {payload.name}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text
          x={ex + (cos >= 0 ? 1 : -1) * 8}
          y={ey}
          textAnchor={textAnchor}
          fill="#333"
          style={{ fontFamily: theme.fontFamily.default, fontSize: 12, fontWeight: 'bold' }}
        >
          {payload.fullName}
        </text>
        <text
          x={ex + (cos >= 0 ? 1 : -1) * 8}
          y={ey + 16}
          dy={4}
          textAnchor={textAnchor}
          fill="#999"
          style={{ fontFamily: theme.fontFamily.default, fontSize: 11 }}
        >
          {`${formatCurrency(payload.value, currency)} (${payload.percentage.toFixed(1)}%)`}
        </text>
      </g>
    );
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <View style={styles.tooltipContainer}>
          <Text style={[styles.tooltipLabel, { fontFamily: theme.fontFamily.default }]}>
            {data.payload.fullName}
          </Text>
          <Text style={[styles.tooltipValue, { fontFamily: theme.fontFamily.default }]}>
            {formatCurrency(data.value, currency)} ({data.payload.percentage.toFixed(1)}%)
          </Text>
        </View>
      );
    }
    return null;
  };

  const displayedCategories = showAllCategories ? data : data.slice(0, 6);

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <View style={styles.chartContainer}>
          <ResponsiveContainer width="100%" height={360}>
            <PieChart margin={{ top: 40, right: 80, bottom: 40, left: 80 }}>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={finalActiveIndex !== null ? 60 : 0}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                activeIndex={finalActiveIndex !== null ? finalActiveIndex : undefined}
                activeShape={renderActiveShape}
                onMouseEnter={(_, index) => setHoverIndex(index)}
                onMouseLeave={() => setHoverIndex(null)}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </View>

        <View style={styles.legendContainer}>
          {displayedCategories.map((item) => {
            const chartIndex = chartData.findIndex(d => d.fullName === item.category);
            
            return (
              <TouchableOpacity
                key={item.category}
                onPress={() => {
                  if (chartIndex !== -1) {
                    setActiveIndex(chartIndex);
                  }
                }}
                disabled={chartIndex === -1}
              >
                <View style={styles.legendItem}>
                  <View style={styles.legendLeft}>
                    <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                    <Text style={styles.legendCategory} numberOfLines={2}>
                      {item.category}
                    </Text>
                  </View>
                  <View style={styles.legendRight}>
                    <Text style={styles.legendAmount}>
                      {formatCurrency(item.amount, currency)}
                    </Text>
                    <Text style={styles.legendPercentage}>
                      {item.percentage.toFixed(1)}%
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
          {data.length > 6 && !showAllCategories && (
            <View style={styles.buttonContainer}>
              <Button
                mode="outlined"
                onPress={() => setShowAllCategories(true)}
                style={styles.moreButton}
                labelStyle={styles.moreButtonLabel}
                contentStyle={styles.moreButtonContent}
                icon="chevron-down"
              >
                more categories (+{data.length - 6})
              </Button>
            </View>
          )}
          {showAllCategories && data.length > 6 && (
            <View style={styles.buttonContainer}>
              <Button
                mode="outlined"
                onPress={() => setShowAllCategories(false)}
                style={styles.moreButton}
                labelStyle={styles.moreButtonLabel}
                contentStyle={styles.moreButtonContent}
                icon="chevron-up"
              >
                Show less
              </Button>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    overflow: 'visible',
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    overflow: 'visible',
    marginLeft: 'auto',
    marginRight: 'auto',
    width: '100%',
  },
  legendContainer: {
    flex: 1,
    flexDirection: 'column',
    gap: theme.spacing.sm,
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: '#FAFBFC',
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
    minHeight: UI_CONSTANTS.CARD_HEIGHT.SMALL,
    width: '100%',
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flex: 1,
  },
  legendColor: {
    width: 18,
    height: 18,
    borderRadius: theme.borderRadius.sm,
    flexShrink: 0,
    elevation: 1,
  },
  legendCategory: {
    ...theme.typography.body,
    color: theme.colors.text.primary,
    fontWeight: UI_CONSTANTS.FONT_WEIGHTS.MEDIUM,
    flex: 1,
  },
  legendRight: {
    alignItems: 'flex-end',
    gap: 3,
    flexShrink: 0,
  },
  legendAmount: {
    ...theme.typography.body,
    color: theme.colors.text.primary,
    fontWeight: UI_CONSTANTS.FONT_WEIGHTS.SEMIBOLD,
  },
  legendPercentage: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontWeight: UI_CONSTANTS.FONT_WEIGHTS.SEMIBOLD,
  },
  buttonContainer: {
    alignItems: 'center',
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  moreButton: {
    borderColor: theme.colors.primary,
    borderWidth: 1,
  },
  moreButtonLabel: {
    ...theme.typography.body,
    color: theme.colors.primary,
    fontWeight: UI_CONSTANTS.FONT_WEIGHTS.SEMIBOLD,
  },
  moreButtonContent: {
    paddingHorizontal: theme.spacing.md,
    minHeight: UI_CONSTANTS.BUTTON_HEIGHT.SMALL,
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
    color: theme.colors.text.primary,
  },
}); 