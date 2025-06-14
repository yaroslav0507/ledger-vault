import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, Icon } from 'react-native-paper';
import { theme } from '../../../../shared/ui/theme/theme';
import { UI_CONSTANTS } from '../../../../shared/constants/ui';

interface KeyInsightsProps {
  insights: string[];
}

const extractEmojiAndText = (insight: string): { emoji: string; text: string } => {
  const emojiMatch = insight.match(/^(\p{Emoji}+)\s*/u);
  if (emojiMatch) {
    return {
      emoji: emojiMatch[1],
      text: insight.slice(emojiMatch[0].length)
    };
  }
  return { emoji: '💡', text: insight };
};

export const KeyInsights: React.FC<KeyInsightsProps> = ({ insights }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!insights.length) {
    return null;
  }

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <Card style={styles.card}>
      <TouchableOpacity onPress={toggleExpanded} activeOpacity={0.7}>
        <Card.Content style={styles.headerContent}>
          <View style={styles.header}>
            <Text variant="titleMedium" style={styles.title}>
              Key Insights
            </Text>
            <View style={styles.headerRight}>
              <Text variant="bodySmall" style={styles.insightCount}>
                {insights.length} insight{insights.length !== 1 ? 's' : ''}
              </Text>
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
          <View style={styles.insightsContainer}>
            {insights.map((insight, index) => {
              const { emoji, text } = extractEmojiAndText(insight);
              return (
                <View key={index} style={styles.insightItem}>
                  <View style={styles.iconContainer}>
                    <Text style={styles.insightIcon}>{emoji}</Text>
                  </View>
                  <Text style={styles.insightText} numberOfLines={0}>
                    {text}
                  </Text>
                </View>
              );
            })}
          </View>
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
    borderWidth: 1,
    borderColor: '#E3F2FD',
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
    letterSpacing: 0.3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  insightCount: {
    color: theme.colors.text.secondary,
    fontSize: 12,
    fontWeight: UI_CONSTANTS.FONT_WEIGHTS.MEDIUM,
  },
  content: {
    paddingTop: 0,
  },
  insightsContainer: {
    gap: theme.spacing.sm,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: '#F8F9FA',
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
    minHeight: UI_CONSTANTS.BUTTON_HEIGHT.LARGE,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  insightIcon: {
    fontSize: 18,
  },
  insightText: {
    ...theme.typography.body,
    flex: 1,
    color: theme.colors.text.primary,
    fontWeight: UI_CONSTANTS.FONT_WEIGHTS.MEDIUM,
    flexWrap: 'wrap',
    paddingTop: 2,
  },
}); 