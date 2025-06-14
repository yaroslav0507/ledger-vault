import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Button } from 'react-native-paper';
import { ImportButton } from '@/features/import/ui/components/ImportButton';
import { theme } from '@/shared/ui/theme/theme';
import { UI_CONSTANTS } from '@/shared/constants/ui';

interface ActionButtonRowProps {
  onAddTransaction?: () => void;
  onFileSelect?: (file: File) => void;
  style?: ViewStyle;
}

export const ActionButtonRow: React.FC<ActionButtonRowProps> = ({
  onAddTransaction,
  onFileSelect,
  style,
}) => {
  if (!onAddTransaction && !onFileSelect) {
    return null;
  }

  return (
    <View style={[styles.actionButtons, style]}>
      {onAddTransaction && (
        <Button
          mode="contained"
          icon="plus"
          onPress={onAddTransaction}
          style={styles.actionButton}
          labelStyle={styles.actionButtonLabel}
          contentStyle={styles.actionButtonContent}
        >
          Add Transaction
        </Button>
      )}

      {onFileSelect && (
        <ImportButton 
          onFileSelect={onFileSelect} 
          style={styles.actionButton}
          contentStyle={styles.actionButtonContent}
          labelStyle={styles.actionButtonLabel}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    gap: theme.spacing.sm,
    alignItems: 'center',
  },
  actionButton: {
    flex: 1,
    minHeight: UI_CONSTANTS.BUTTON_HEIGHT.MEDIUM,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
  },
  actionButtonLabel: {
    fontSize: 14,
    fontWeight: UI_CONSTANTS.FONT_WEIGHTS.SEMIBOLD,
  },
  actionButtonContent: {
    minHeight: UI_CONSTANTS.BUTTON_HEIGHT.MEDIUM,
    justifyContent: 'center',
  },
}); 