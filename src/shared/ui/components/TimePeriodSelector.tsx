import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView
} from 'react-native';
import { Modal, Portal, Surface, TextInput, Button } from 'react-native-paper';
import { TimePeriod, DateRange, getDateRangeForPeriod, getTimePeriodLabel, getCurrentTimePeriod, getMonthRange } from '../../utils/dateUtils';
import { theme } from '../theme/theme';
import { ModalHeader } from './ModalHeader';

interface TimePeriodSelectorProps {
  currentDateRange?: DateRange;
  selectedPeriod?: TimePeriod;
  onPeriodChange: (period: TimePeriod, dateRange: DateRange) => void;
}

export const TimePeriodSelector: React.FC<TimePeriodSelectorProps> = ({
  currentDateRange,
  selectedPeriod,
  onPeriodChange
}) => {
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customRange, setCustomRange] = useState<DateRange>({
    start: '',
    end: ''
  });
  
  const scrollViewRef = useRef<ScrollView>(null);
  const hasAutoScrolledRef = useRef(false);
  const lastScrolledPeriodRef = useRef<TimePeriod | null>(null);
  const currentPeriod = selectedPeriod || 'lastMonth';

  const allTimePeriods: { period: TimePeriod; label: string; icon: string }[] = [
    { period: 'today', label: 'Today', icon: '📅' },
    { period: 'week', label: 'This Week', icon: '📊' },
    { period: 'month', label: 'This Month', icon: '🗓️' },
    { period: 'lastMonth', label: 'Last Month', icon: '📅' },
    { period: 'quarter', label: 'This Quarter', icon: '📈' },
    { period: 'winter', label: 'Winter', icon: '❄️' },
    { period: 'spring', label: 'Spring', icon: '🌸' },
    { period: 'summer', label: 'Summer', icon: '☀️' },
    { period: 'autumn', label: 'Autumn', icon: '🍂' },
    { period: 'year', label: 'This Year', icon: '📆' },
    { period: 'custom', label: 'Custom Range', icon: '⚙️' }
  ];

  const timePeriods = allTimePeriods.filter(({ period }) => {
    // Filter out seasons that haven't started yet
    const seasonStartMonths = {
      spring: 2,  // March (month 2)
      summer: 5,  // June (month 5)
      autumn: 8,  // September (month 8)
      winter: 0   // Always show (month 0 = always true)
    };
    
    if (!(period in seasonStartMonths)) {
      return true; // Keep non-seasonal periods
    }
    
    const currentMonth = new Date().getMonth(); // 0-based
    return currentMonth >= seasonStartMonths[period as keyof typeof seasonStartMonths];
  });

  // Auto-scroll to selected item (smooth, no interruption)
  const scrollToSelectedItem = useCallback((targetPeriod?: TimePeriod, immediate = false) => {
    const periodToFind = targetPeriod || currentPeriod;
    const selectedIndex = timePeriods.findIndex(({ period }) => period === periodToFind);
    
    if (selectedIndex >= 0 && scrollViewRef.current) {
      // More precise calculation based on actual button styling
      const buttonWidth = 100; // minWidth from styles
      const marginRight = 12; // marginRight from styles (theme.spacing.sm)
      const totalButtonWidth = buttonWidth + marginRight;
      const containerPadding = 16; // paddingHorizontal from container (theme.spacing.md)
      
      // Calculate position to center the selected item
      const scrollToX = Math.max(0, (selectedIndex * totalButtonWidth) - containerPadding);
      
      scrollViewRef.current.scrollTo({
        x: scrollToX,
        animated: !immediate
      });
      
      // Track that we scrolled to this period
      lastScrolledPeriodRef.current = periodToFind;
    }
  }, [currentPeriod, timePeriods]);

  const handlePeriodSelect = (period: TimePeriod) => {
    if (period === 'custom') {
      // Initialize custom range with current date range or suggest a 5-year range
      if (currentDateRange) {
        setCustomRange(currentDateRange);
      } else {
        // Suggest 5-year range: from 5 years ago to today
        const today = new Date();
        const startOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        setCustomRange({
          start: startOfCurrentMonth.toISOString().split('T')[0],
          end: today.toISOString().split('T')[0]
        });
      }
      setShowCustomModal(true);
    } else {
      // User actively selected a period - scroll immediately
      scrollToSelectedItem(period, false);
      
      const dateRange = getDateRangeForPeriod(period);
      onPeriodChange(period, dateRange);
    }
  };

  const handleCustomRangeApply = () => {
    if (customRange.start && customRange.end) {
      onPeriodChange('custom', customRange);
      setShowCustomModal(false);
    }
  };

  const isCustomRangeValid = customRange.start && customRange.end && customRange.start <= customRange.end;

  // Only auto-scroll on initial load when we have a current date range
  useEffect(() => {
    // Auto-scroll once when component is first initialized
    // This includes both when we have a date range OR when defaulting to 'month'
    if (!hasAutoScrolledRef.current) {
      const timeoutId = setTimeout(() => {
        scrollToSelectedItem(currentPeriod, false);
        hasAutoScrolledRef.current = true;
      }, 100); // Slight delay to ensure component is fully mounted
      
      return () => clearTimeout(timeoutId);
    }
  }, []); // Empty dependency array - only run once on mount

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.scrollView} 
        ref={scrollViewRef}
      >
        {timePeriods.map(({ period, label, icon }) => {
          const isSelected = period === currentPeriod;
          const isCustomSelected = period === 'custom' && currentPeriod === 'custom';
          
          return (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                (isSelected || isCustomSelected) && styles.selectedPeriodButton
              ]}
              onPress={() => handlePeriodSelect(period)}
              activeOpacity={0.7}
            >
              <Text style={styles.periodIcon}>{icon}</Text>
              <Text style={[
                styles.periodLabel,
                (isSelected || isCustomSelected) && styles.selectedPeriodLabel
              ]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Custom Range Modal */}
      <Portal>
        <Modal
          visible={showCustomModal}
          onDismiss={() => setShowCustomModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Surface style={styles.modalSurface}>
            <ModalHeader
              title="Custom Date Range"
              leftAction={{
                label: "Cancel",
                onPress: () => setShowCustomModal(false)
              }}
              rightAction={{
                label: "Apply",
                onPress: handleCustomRangeApply,
                disabled: !isCustomRangeValid
              }}
            />
            
            <View style={styles.modalContent}>
              <View style={styles.dateInputGroup}>
                <Text style={styles.inputLabel}>From Date</Text>
                <TextInput
                  mode="outlined"
                  value={customRange.start}
                  onChangeText={(text) => setCustomRange({ ...customRange, start: text })}
                  placeholder="YYYY-MM-DD"
                  style={styles.dateInput}
                />
              </View>
              
              <View style={styles.dateInputGroup}>
                <Text style={styles.inputLabel}>To Date</Text>
                <TextInput
                  mode="outlined"
                  value={customRange.end}
                  onChangeText={(text) => setCustomRange({ ...customRange, end: text })}
                  placeholder="YYYY-MM-DD"
                  style={styles.dateInput}
                />
              </View>

              {!isCustomRangeValid && customRange.start && customRange.end && (
                <Text style={styles.errorText}>
                  End date must be after start date
                </Text>
              )}
            </View>
          </Surface>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: '#fff',
    borderBottomColor: theme.colors.border,
    borderBottomWidth: 1,
  },
  scrollView: {
    marginHorizontal: -theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  periodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: theme.borderRadius.round,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginRight: theme.spacing.sm,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    minWidth: 100,
  },
  selectedPeriodButton: {
    backgroundColor: '#6B7280',
    borderColor: '#6B7280',
  },
  periodIcon: {
    fontSize: 14,
    marginRight: theme.spacing.xs,
  },
  periodLabel: {
    ...theme.typography.caption,
    color: '#6B7280',
    fontWeight: '500',
    fontSize: 11,
  },
  selectedPeriodLabel: {
    color: '#FFFFFF',
  },
  currentPeriodContainer: {
    marginTop: theme.spacing.sm,
    alignItems: 'center',
  },
  currentPeriodText: {
    ...theme.typography.caption,
    color: '#9CA3AF',
    fontStyle: 'italic',
    fontSize: 11,
  },
  modalContainer: {
    margin: theme.spacing.lg,
  },
  modalSurface: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  modalContent: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  dateInputGroup: {
    gap: theme.spacing.sm,
  },
  inputLabel: {
    ...theme.typography.body,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  dateInput: {
    backgroundColor: theme.colors.surface,
  },
  errorText: {
    ...theme.typography.caption,
    color: theme.colors.error,
    textAlign: 'center',
  },
}); 