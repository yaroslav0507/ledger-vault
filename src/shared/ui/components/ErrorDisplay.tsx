import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';
import { theme } from '@/shared/ui/theme/theme';

interface ErrorDisplayProps {
  error?: string | null;
  style?: ViewStyle;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  style,
}) => {
  if (!error) {
    return null;
  }

  return (
    <View style={[styles.errorContainer, style]}>
      <Text style={styles.errorText}>{error}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  errorContainer: {
    backgroundColor: theme.colors.error,
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  errorText: {
    ...theme.typography.body,
    color: theme.colors.text.inverse,
    textAlign: 'center',
  },
}); 