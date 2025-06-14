import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { theme } from '../theme/theme';

interface StickyHeaderProps {
  title: string;
  actionButton?: {
    icon: string;
    label: string;
    onPress: () => void;
    isActive?: boolean;
    activeCount?: number;
  };
}

export const StickyHeader: React.FC<StickyHeaderProps> = ({
  title,
  actionButton
}) => {
  return (
    <View style={styles.stickyHeader}>
      <View style={styles.stickyHeaderContent}>
        <Text style={styles.stickyTitle} numberOfLines={1} ellipsizeMode="tail">
          {title}
        </Text>
        
        {actionButton && (
          <TouchableOpacity 
            style={[
              styles.stickyActionButton, 
              actionButton.isActive && styles.stickyActionButtonActive
            ]}
            onPress={actionButton.onPress}
            activeOpacity={0.8}
          >
            <Text style={styles.actionIcon}>{actionButton.icon}</Text>
            <Text style={styles.stickyActionLabel} numberOfLines={1} ellipsizeMode="tail">
              {actionButton.label}
              {actionButton.activeCount !== undefined && actionButton.activeCount > 0 && (
                <Text style={styles.activeCountText}> {actionButton.activeCount}</Text>
              )}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  stickyHeader: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    marginTop: -1,
    marginBottom: 10,
    boxShadow: 'rgba(0, 0, 0, 0.05) 0 2px 5px 0',
  },
  stickyHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stickyTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    fontSize: 18,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  stickyActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: theme.borderRadius.md,
    minWidth: 90,
    height: 36,
    backgroundColor: '#FAFAFA',
  },
  stickyActionButtonActive: {
    backgroundColor: '#E8F5E8',
    borderColor: '#4CAF50',
  },
  actionIcon: {
    fontSize: 18,
    marginRight: theme.spacing.sm,
  },
  stickyActionLabel: {
    fontSize: 13,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  activeCountText: {
    fontSize: 13,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
}); 