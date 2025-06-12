import React, { useState, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, PanResponder, Dimensions } from 'react-native';
import { Transaction } from '../../model/Transaction';
import { formatCurrency } from '@/shared/utils/currencyUtils';
import { formatDateTime } from '@/shared/utils/dateUtils';
import { theme } from '@/shared/ui/theme/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const REVEAL_THRESHOLD = SCREEN_WIDTH * 0.05;
const ACTION_BUTTON_WIDTH = 100;
const SHIFT_DISTANCE = ACTION_BUTTON_WIDTH;
const AUTO_ACTION_THRESHOLD = REVEAL_THRESHOLD + ACTION_BUTTON_WIDTH;

type SwipeState = 'center' | 'edit-revealed' | 'archive-revealed';

interface TransactionCardProps {
  transaction: Transaction;
  onPress?: () => void;
  onLongPress?: () => void;
  onCategoryPress?: (category: string) => void;
  onEdit?: (transaction: Transaction) => void;
  onArchive?: (transaction: Transaction) => void;
  isBeingRemoved?: boolean;
  onSwipeStart?: () => void;
  onSwipeEnd?: () => void;
}

const useSwipeGesture = (
  onEdit: () => void,
  onArchive: () => void,
  onSwipeStart?: () => void,
  onSwipeEnd?: () => void
) => {
  const [swipeState, setSwipeState] = useState<SwipeState>('center');
  const initialSwipeState = useRef<SwipeState>('center');
  const translateX = useRef(new Animated.Value(0)).current;

  const resetToCenter = useCallback(() => {
    setSwipeState('center');
    onSwipeEnd?.();
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: false,
      tension: 300,
      friction: 30,
    }).start();
  }, [translateX, onSwipeEnd]);

  const revealEdit = useCallback(() => {
    setSwipeState('edit-revealed');
    Animated.spring(translateX, {
      toValue: -SHIFT_DISTANCE,
      useNativeDriver: false,
      tension: 300,
      friction: 30,
    }).start();
  }, [translateX]);

  const revealArchive = useCallback(() => {
    setSwipeState('archive-revealed');
    Animated.spring(translateX, {
      toValue: SHIFT_DISTANCE,
      useNativeDriver: false,
      tension: 300,
      friction: 30,
    }).start();
  }, [translateX]);

  const handleEdit = useCallback(() => {
    resetToCenter();
    setTimeout(() => onEdit(), 150);
  }, [resetToCenter, onEdit]);

  const handleArchive = useCallback(() => {
    resetToCenter();
    setTimeout(() => onArchive(), 150);
  }, [resetToCenter, onArchive]);

  const getThresholds = useCallback((dx: number) => {
    const isSwipingRight = dx > 0;
    const isSwipingLeft = dx < 0;
    
    // Use the initial state when the gesture started
    const currentState = initialSwipeState.current;
    
    // When swiping right
    if (isSwipingRight) {
      // If edit was revealed, need extra distance to reveal archive
      const revealThreshold = currentState === 'edit-revealed' ? REVEAL_THRESHOLD + SHIFT_DISTANCE : REVEAL_THRESHOLD;
      const autoThreshold = revealThreshold + ACTION_BUTTON_WIDTH;
      return { revealThreshold, autoThreshold };
    }
    
    // When swiping left
    if (isSwipingLeft) {
      // If archive was revealed, need extra distance to reveal edit
      const revealThreshold = currentState === 'archive-revealed' ? REVEAL_THRESHOLD + SHIFT_DISTANCE : REVEAL_THRESHOLD;
      const autoThreshold = revealThreshold + ACTION_BUTTON_WIDTH;
      return { revealThreshold, autoThreshold };
    }
    
    return { revealThreshold: REVEAL_THRESHOLD, autoThreshold: AUTO_ACTION_THRESHOLD };
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const { dx } = gestureState;
        const absDx = Math.abs(dx);
        return absDx > 15;
      },
      
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
        const { dx } = gestureState;
        const absDx = Math.abs(dx);
        return absDx > 15;
      },
      
      onPanResponderTerminationRequest: () => false,
      
      onShouldBlockNativeResponder: () => false,
      
      onPanResponderGrant: () => {
        const currentTranslateX = (translateX as any)._value;
        const autoRevealThreshold = SHIFT_DISTANCE * 0.1;
        
        if (currentTranslateX > autoRevealThreshold) {
          initialSwipeState.current = 'archive-revealed';
        } else if (currentTranslateX < -autoRevealThreshold) {
          initialSwipeState.current = 'edit-revealed';
        } else {
          initialSwipeState.current = 'center';
        }
        
        translateX.setOffset(currentTranslateX);
        onSwipeStart?.();
      },
      
      onPanResponderMove: (evt, gestureState) => {
        const { dx } = gestureState;
        translateX.setValue(dx);
      },
      
      onPanResponderRelease: (evt, gestureState) => {
        translateX.flattenOffset();
        onSwipeEnd?.();
        
        const { dx } = gestureState;
        const absDx = Math.abs(dx);
        const { revealThreshold, autoThreshold } = getThresholds(dx);
        
        if (absDx >= autoThreshold) {
          if (dx > 0) {
            handleArchive();
          } else {
            handleEdit();
          }
        } else if (absDx >= revealThreshold) {
          if (dx > 0) {
            revealArchive();
          } else {
            revealEdit();
          }
        } else {
          resetToCenter();
        }
      },
      
      onPanResponderTerminate: () => {
        translateX.flattenOffset();
        onSwipeEnd?.();
        resetToCenter();
      },
      
      onPanResponderReject: () => {
        translateX.flattenOffset();
        onSwipeEnd?.();
        resetToCenter();
      },
    })
  ).current;

  return {
    swipeState,
    translateX,
    panResponder,
    resetToCenter,
    handleEdit,
    handleArchive,
  };
};

export const TransactionCard: React.FC<TransactionCardProps> = React.memo(({
  transaction,
  onPress,
  onLongPress,
  onCategoryPress,
  onEdit,
  onArchive,
  isBeingRemoved = false,
  onSwipeStart,
  onSwipeEnd
}) => {
  const {
    swipeState,
    translateX,
    panResponder,
    resetToCenter,
    handleEdit,
    handleArchive,
  } = useSwipeGesture(
    () => onEdit?.(transaction),
    () => onArchive?.(transaction),
    onSwipeStart,
    onSwipeEnd
  );

  const handleCardPress = () => {
    if (swipeState !== 'center') {
      resetToCenter();
    } else {
      onPress?.();
    }
  };

  const amountColor = transaction.isIncome ? theme.colors.income : theme.colors.expense;
  const cardBackgroundColor = transaction.isIncome ? '#F0FDF4' : '#F8FAFC';
  const leftBorderColor = transaction.isIncome ? theme.colors.income : '#94A3B8';

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
            { opacity: leftActionOpacity },
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
            { opacity: rightActionOpacity },
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
          { transform: [{ translateX }] },
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
            <View style={[styles.commentSection]}>
              <View style={styles.commentRow}>
                <Text style={styles.commentIcon}>💬</Text>
                <Text style={styles.comment} numberOfLines={1} ellipsizeMode="tail">
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
    width: '50%',
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
    width: '100%',
    height: '100%',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  archiveButton: {
    backgroundColor: '#b1b7bc',
    alignItems: 'flex-start',
  },
  editButton: {
    backgroundColor: '#4285F4',
    alignItems: 'flex-end',
  },
  actionTouchable: {
    width: 50,
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