import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, Icon } from 'react-native-paper';
import { theme } from '../theme/theme';
import { UI_CONSTANTS } from '../../constants/ui';

interface CollapsibleSectionProps {
  title: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
  subtitle?: string;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ 
  title, 
  defaultExpanded = true, 
  children, 
  subtitle 
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <Card style={styles.card}>
      <TouchableOpacity onPress={toggleExpanded} activeOpacity={0.7}>
        <Card.Content style={styles.headerContent}>
          <View style={styles.header}>
            <Text variant="titleMedium" style={styles.title}>
              {title}
            </Text>
            <View style={styles.headerRight}>
              {subtitle && (
                <Text variant="bodySmall" style={styles.subtitle}>
                  {subtitle}
                </Text>
              )}
              <Icon 
                source={isExpanded ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={theme.colors.text.secondary} 
              />
            </View>
          </View>
        </Card.Content>
      </TouchableOpacity>
      
      {isExpanded && (
        <Card.Content style={styles.content}>
          {children}
        </Card.Content>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    elevation: 2,
    borderRadius: theme.borderRadius.lg,
  },
  headerContent: {
    paddingVertical: theme.spacing.md,
    minHeight: UI_CONSTANTS.CARD_HEIGHT.MEDIUM,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: theme.colors.text.primary,
    fontWeight: UI_CONSTANTS.FONT_WEIGHTS.SEMIBOLD,
    fontSize: 18,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  subtitle: {
    color: theme.colors.text.secondary,
    fontSize: 12,
    fontWeight: UI_CONSTANTS.FONT_WEIGHTS.MEDIUM,
  },
  content: {
    paddingTop: 0,
  },
}); 