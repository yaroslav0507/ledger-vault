import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, PanResponder, Dimensions } from 'react-native';
import { Transaction } from '../../model/Transaction';
import { formatCurrency } from '@/shared/utils/currencyUtils';
import { formatDateTime } from '@/shared/utils/dateUtils';
import { theme } from '@/shared/ui/theme/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const REVEAL_THRESHOLD = SCREEN_WIDTH * 0.25; // 25% of screen width to reveal
const ACTIVATE_THRESHOLD = SCREEN_WIDTH * 0.5; // 50% of screen width to activate
const ACTION_BUTTON_WIDTH = 120;
const SHIFT_DISTANCE = ACTION_BUTTON_WIDTH - 20;

interface TransactionCardProps {
  transaction: Transaction;
  onPress?: () => void;
  onLongPress?: () => void;
  onCategoryPress?: (category: string) => void;
  onEdit?: (transaction: Transaction) => void;
  onArchive?: (transaction: Transaction) => void;
  isBeingRemoved?: boolean;
}

export const TransactionCard: React.FC<TransactionCardProps> = React.memo(({
  transaction,
  onPress,
  onLongPress,
  onCategoryPress,
  onEdit,
  onArchive,
  isBeingRemoved = false
}) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const translateX = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderGrant: () => {
        translateX.setOffset((translateX as any)._value);
      },
      onPanResponderMove: (evt, gestureState) => {
        // Smooth, constrained movement
        const newValue = Math.max(-ACTIVATE_THRESHOLD, Math.min(ACTIVATE_THRESHOLD, gestureState.dx));
        translateX.setValue(newValue);
        
        // Update swipe direction
        if (gestureState.dx > 20) {
          setSwipeDirection('right');
        } else if (gestureState.dx < -20) {
          setSwipeDirection('left');
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        translateX.flattenOffset();
        const absDx = Math.abs(gestureState.dx);
        
        if (absDx >= ACTIVATE_THRESHOLD) {
          // Long swipe - activate action immediately
          if (gestureState.dx > 0) {
            // Swiped right - archive
            handleArchive();
          } else {
            // Swiped left - edit
            handleEdit();
          }
          resetPosition();
        } else if (absDx >= REVEAL_THRESHOLD) {
          // Short swipe - reveal actions
          setIsRevealed(true);
          if (gestureState.dx > 0) {
            // Reveal archive on left
            setSwipeDirection('right');
            Animated.spring(translateX, {
              toValue: SHIFT_DISTANCE,
              useNativeDriver: false,
              tension: 300,
              friction: 30,
            }).start();
          } else {
            // Reveal edit on right
            setSwipeDirection('left');
            Animated.spring(translateX, {
              toValue: -SHIFT_DISTANCE
              ,
              useNativeDriver: false,
              tension: 300,
              friction: 30,
            }).start();
          }
        } else {
          // Reset to center
          resetPosition();
        }
      },
    })
  ).current;

  const resetPosition = () => {
    setIsRevealed(false);
    setSwipeDirection(null);
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: false,
      tension: 300,
      friction: 30,
    }).start();
  };

  const handleEdit = () => {
    resetPosition();
    setTimeout(() => onEdit?.(transaction), 150);
  };

  const handleArchive = () => {
    resetPosition();
    setTimeout(() => onArchive?.(transaction), 150);
  };

  const handleCardPress = () => {
    if (isRevealed) {
      resetPosition();
    } else {
      onPress?.();
    }
  };

  const amountColor = transaction.isIncome ? theme.colors.income : theme.colors.expense;
  const cardBackgroundColor = transaction.isIncome ? '#F0FDF4' : '#F8FAFC';
  const leftBorderColor = transaction.isIncome ? theme.colors.income : '#94A3B8';

  // Calculate dynamic opacities and scales for smooth reveal
  const leftActionOpacity = translateX.interpolate({
    inputRange: [0, REVEAL_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const rightActionOpacity = translateX.interpolate({
    inputRange: [-REVEAL_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      {/* Left Action - Archive */}
      <View style={[styles.leftActionContainer, styles.actionContainer]}>
        <Animated.View
          style={[
            styles.actionButton,
            styles.archiveButton,
            {
              opacity: leftActionOpacity,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.actionTouchable}
            onPress={handleArchive}
            activeOpacity={0.7}
          >
            <Text style={styles.actionIcon}>📁</Text>
            <Text style={styles.actionText}>Archive</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Right Action - Edit */}
      <View style={[styles.rightActionContainer, styles.actionContainer]}>
        <Animated.View
          style={[
            styles.actionButton,
            styles.editButton,
            {
              opacity: rightActionOpacity,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.actionTouchable}
            onPress={handleEdit}
            activeOpacity={0.7}
          >
            <Text style={styles.actionIcon}>✏️</Text>
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Main Card */}
      <Animated.View
        style={[
          styles.cardWrapper,
          {
            transform: [{ translateX }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={[styles.card, { backgroundColor: cardBackgroundColor, borderLeftColor: leftBorderColor }]}
          onPress={handleCardPress}
          onLongPress={onLongPress}
          activeOpacity={0.9}
        >
          {/* Main Content */}
          <View style={styles.mainContent}>
            {/* Left Section - Transaction Info */}
            <View style={styles.leftSection}>
              {/* Primary Line - Description */}
              <Text style={styles.description} numberOfLines={1} ellipsizeMode="tail">
                {transaction.description}
              </Text>
              
              {/* Secondary Line - Metadata */}
              <View style={styles.metaRow}>
                <Text style={styles.date}>{formatDateTime(transaction.date)}</Text>
                <View style={styles.metaDivider} />
                <Text style={styles.cardText} numberOfLines={1} ellipsizeMode="tail">
                  {transaction.card.slice(-9)}
                </Text>
                <View style={styles.metaDivider} />
                <TouchableOpacity 
                  style={styles.categoryBadge}
                  onPress={() => onCategoryPress?.(transaction.category)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.categoryText} numberOfLines={1} ellipsizeMode="tail">
                    {transaction.category}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Right Section - Amount */}
            <View style={styles.rightSection}>
              <Text style={[styles.amount, { color: amountColor }]} numberOfLines={1}>
                {formatCurrency(transaction.amount, transaction.currency)}
              </Text>
              <View style={[styles.incomeIndicator, { backgroundColor: amountColor }]}>
                <Text style={styles.incomeText}>
                  {transaction.isIncome ? 'Income' : 'Expense'}
                </Text>
              </View>
            </View>
          </View>
          
          {/* Comments Section - Simplified */}
          {transaction.comment && (
            <View style={[styles.commentSection, { backgroundColor: cardBackgroundColor }]}>
              <View style={styles.commentRow}>
                <Text style={styles.commentIcon}>💬</Text>
                <Text style={styles.comment} numberOfLines={2} ellipsizeMode="tail">
                  {transaction.comment}
                </Text>
              </View>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginVertical: theme.spacing.xs,
    marginHorizontal: theme.spacing.sm,
    position: 'relative',
    boxShadow: '0 0 10px -9px',
  },
  actionContainer: {
    position: 'absolute',
    width: ACTION_BUTTON_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    height: '100%',
  },
  leftActionContainer: {
    left: 0,
    top: 0,
  },
  rightActionContainer: {
    right: 0,
    top: 0,
  },
  actionButton: {
    width: ACTION_BUTTON_WIDTH,
    height: '100%',
    borderRadius: theme.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.md,
  },
  archiveButton: {
    backgroundColor: '#b1b7bc',
  },
  editButton: {
    backgroundColor: '#4285F4',
  },
  actionTouchable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  cardWrapper: {
    backgroundColor: 'transparent',
    zIndex: 2,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderLeftWidth: 4,
    borderRightWidth: 1,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderRightColor: '#F0F0F0',
    borderTopColor: '#F0F0F0',
    borderBottomColor: '#F0F0F0',
    ...theme.shadows.sm,
  },
  mainContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: theme.spacing.md,
    minHeight: 70,
  },
  leftSection: {
    flex: 1,
    marginRight: theme.spacing.md,
    justifyContent: 'space-between',
    minHeight: 42,
  },
  rightSection: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minWidth: 90,
    minHeight: 42,
    height: '100%',
  },
  description: {
    ...theme.typography.bodyLarge,
    color: theme.colors.text.primary,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  date: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    fontWeight: '500',
    fontSize: 11,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  metaDivider: {
    width: 1,
    height: 12,
    backgroundColor: theme.colors.border,
  },
  cardText: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    fontWeight: '500',
    fontSize: 11,
    maxWidth: 80,
  },
  categoryBadge: {
    backgroundColor: '#E8F4FD',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#B3D9FF',
  },
  categoryText: {
    ...theme.typography.caption,
    color: '#1976D2',
    fontWeight: '500',
    fontSize: 10,
  },
  amount: {
    ...theme.typography.h3,
    fontWeight: '700',
    fontSize: 18,
    textAlign: 'right',
    marginBottom: theme.spacing.xs,
    letterSpacing: 0.3,
  },
  incomeIndicator: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    minWidth: 50,
  },
  incomeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  commentSection: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  commentIcon: {
    fontSize: 12,
    lineHeight: 16,
  },
  comment: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
}); 