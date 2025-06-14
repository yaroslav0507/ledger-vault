import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Icon } from 'react-native-paper';
import { formatCurrency } from '../../../../shared/utils/currencyUtils';
import { theme } from '../../../../shared/ui/theme/theme';
import { UI_CONSTANTS } from '../../../../shared/constants/ui';

interface AnalyticsGridHeaderProps {
  balance: {
    income: number;
    expenses: number;
    total: number;
  };
  transactionCount: number;
  categoryCount: number;
  currency?: string;
}

interface GridCardProps {
  icon: string;
  iconColor: string;
  title: string;
  value: string;
  subtitle?: string;
  onPress?: () => void;
}

const GridCard: React.FC<GridCardProps> = ({ icon, iconColor, title, value, subtitle, onPress }) => (
  <Card style={styles.gridCard} onPress={onPress}>
    <Card.Content style={styles.cardContent}>
      <View style={styles.cardHeader}>
        <Icon source={icon} size={20} color={iconColor} />
        <Text variant="bodySmall" style={styles.cardTitle}>{title}</Text>
      </View>

      <Text variant="titleLarge" style={[styles.cardValue, { color: iconColor }]}>
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

export interface AnalyticsGridHeaderExtendedProps extends AnalyticsGridHeaderProps {
  onCategoriesPress?: () => void;
  onTrendsPress?: () => void;
}

export const AnalyticsGridHeader: React.FC<AnalyticsGridHeaderExtendedProps> = ({
  balance,
  transactionCount,
  categoryCount,
  currency = 'UAH',
  onCategoriesPress,
  onTrendsPress
}) => {

  const netIncomeText = balance.total >= 0 ? 'Positive flow' : 'Negative flow';

  return (
    <View style={styles.container}>
      <View style={styles.gridRow}>
        <GridCard
          icon="trending-up"
          iconColor={theme.colors.income}
          title="TOTAL INCOME"
          value={formatCurrency(balance.income, currency)}
          subtitle={`${transactionCount} transactions`}
          onPress={onTrendsPress}
        />
        <GridCard
          icon="trending-down"
          iconColor={theme.colors.expense}
          title="TOTAL EXPENSES"
          value={formatCurrency(balance.expenses, currency)}
          onPress={onTrendsPress}
        />
      </View>
      
      <View style={styles.gridRow}>
        <GridCard
          icon={balance.total >= 0 ? "cash-plus" : "cash-minus"}
          iconColor={balance.total >= 0 ? theme.colors.income : theme.colors.expense}
          title="NET INCOME"
          value={formatCurrency(balance.total, currency)}
          subtitle={netIncomeText}
          onPress={onTrendsPress}
        />
        <GridCard
          icon="shape"
          iconColor={theme.colors.primary}
          title="CATEGORIES"
          value={categoryCount.toString()}
          subtitle="Active categories"
          onPress={onCategoriesPress}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  gridRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  gridCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    elevation: 1,
    borderRadius: theme.borderRadius.md,
  },
  cardContent: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'flex-start',
    minHeight: UI_CONSTANTS.CARD_HEIGHT.LARGE,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  cardTitle: {
    fontSize: 12,
    lineHeight: 20,
    color: theme.colors.text.secondary,
    fontWeight: UI_CONSTANTS.FONT_WEIGHTS.SEMIBOLD,
    textTransform: 'uppercase',
  },
  cardValue: {
    fontWeight: UI_CONSTANTS.FONT_WEIGHTS.BOLD,
    fontSize: 20,
    marginBottom: theme.spacing.xs,
    letterSpacing: 1,
  },
  cardSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
  },
}); 