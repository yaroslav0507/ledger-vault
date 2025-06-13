import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { theme } from '../theme/theme';

interface EmptyStateAction {
  label: string;
  icon?: string;
  mode?: 'text' | 'outlined' | 'contained';
  onPress: () => void;
}

interface EmptyStateProps {
  loading?: boolean;
  loadingText?: string;
  title: string;
  description: string;
  actions?: EmptyStateAction[];
  showCard?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  loading = false,
  loadingText = 'Loading...',
  title,
  description,
  actions = [],
  showCard = true
}) => {
  if (loading) {
    return (
      <View style={styles.centerContent}>
        <Text style={styles.loadingText}>{loadingText}</Text>
      </View>
    );
  }

  const content = (
    <View style={styles.emptyContent}>
      <Text variant="titleMedium" style={styles.emptyTitle} numberOfLines={2} ellipsizeMode="tail">
        {title}
      </Text>
      <Text variant="bodyMedium" style={styles.emptyDescription} numberOfLines={3} ellipsizeMode="tail">
        {description}
      </Text>
      {actions.length > 0 && (
        <View style={styles.emptyActions}>
          {actions.map((action, index) => (
            <Button
              key={index}
              mode={action.mode || 'outlined'}
              icon={action.icon}
              onPress={action.onPress}
              style={styles.emptyButton}
              labelStyle={styles.emptyButtonLabel}
              contentStyle={styles.emptyButtonContent}
            >
              {action.label}
            </Button>
          ))}
        </View>
      )}
    </View>
  );

  if (showCard) {
    return (
      <View style={styles.emptyCard}>
        {content}
      </View>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  loadingText: {
    ...theme.typography.bodyLarge,
    color: theme.colors.text.secondary,
  },
  emptyCard: {
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.sm,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.md,
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptyDescription: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: theme.spacing.md,
  },
  emptyActions: {
    flexDirection: 'row',
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  emptyButton: {
    flex: 1,
    minWidth: 120,
    minHeight: 48,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
  },
  emptyButtonLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyButtonContent: {
    minHeight: 48,
    justifyContent: 'center',
  },
}); 