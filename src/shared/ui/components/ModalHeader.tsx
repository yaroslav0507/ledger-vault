import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Appbar } from 'react-native-paper';
import { theme } from '../theme/theme';

interface ModalHeaderProps {
  title: string;
  leftAction?: {
    label: string;
    onPress: () => void;
    icon?: string;
  };
  rightAction?: {
    label: string;
    onPress: () => void;
    disabled?: boolean;
    loading?: boolean;
  };
  variant?: 'modal' | 'screen';
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({
  title,
  leftAction,
  rightAction,
  variant = 'modal'
}) => {
  const containerStyle = [
    styles.container,
    variant === 'screen' && styles.screenContainer
  ];

  return (
    <View style={containerStyle}>
      {/* Left Action */}
      <View style={styles.leftActionContainer}>
        {leftAction && (
          <Button
            mode="text"
            onPress={leftAction.onPress}
            textColor={theme.colors.primary}
            style={styles.actionButton}
            labelStyle={styles.actionLabel}
            icon={leftAction.icon}
          >
            {leftAction.label}
          </Button>
        )}
      </View>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text variant="titleLarge" style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>

      {/* Right Action */}
      <View style={styles.rightActionContainer}>
        {rightAction && (
          <Button
            mode="text"
            onPress={rightAction.onPress}
            textColor={theme.colors.primary}
            style={styles.actionButton}
            labelStyle={[
              styles.actionLabel,
              rightAction.disabled && styles.disabledLabel
            ]}
            disabled={rightAction.disabled}
            loading={rightAction.loading}
          >
            {rightAction.label}
          </Button>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    minHeight: 56,
  },
  screenContainer: {
    paddingTop: theme.spacing.md,
    ...theme.shadows.sm,
  },
  leftActionContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  rightActionContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  titleContainer: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'center',
    fontSize: 16,
  },
  actionButton: {
    minWidth: 64,
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  disabledLabel: {
    opacity: 0.5,
  },
}); 