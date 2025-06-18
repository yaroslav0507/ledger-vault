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
import { useTranslation } from '../../i18n/useTranslation';

interface TimePeriodSelectorProps {
  currentDateRange?: DateRange;
  selectedPeriod?: TimePeriod;
  availableYears?: number[];
  onPeriodChange: (period: TimePeriod, dateRange: DateRange) => void;
}

export const TimePeriodSelector: React.FC<TimePeriodSelectorProps> = ({
  currentDateRange,
  selectedPeriod,
  onPeriodChange,
  availableYears = []
}) => {
  const { t } = useTranslation();
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customRange, setCustomRange] = useState<DateRange>({
    start: '',
    end: ''
  });
  
  const scrollViewRef = useRef<ScrollView>(null);
  const hasAutoScrolledRef = useRef(false);
  const lastScrolledPeriodRef = useRef<TimePeriod | null>(null);

  const allTimePeriods: { period: TimePeriod; label: string; icon: string }[] = [
    { period: 'today', label: t('timePeriod.today'), icon: '📅' },
    { period: 'week', label: t('timePeriod.thisWeek'), icon: '📊' },
    { period: 'month', label: t('timePeriod.thisMonth'), icon: '🗓️' },
    { period: 'lastMonth', label: t('timePeriod.lastMonth'), icon: '📅' },
    { period: 'quarter', label: t('timePeriod.thisQuarter'), icon: '📈' },
    { period: 'winter', label: t('timePeriod.winter'), icon: '❄️' },
    { period: 'spring', label: t('timePeriod.spring'), icon: '🌸' },
    { period: 'summer', label: t('timePeriod.summer'), icon: '☀️' },
    { period: 'autumn', label: t('timePeriod.autumn'), icon: '🍂' },
    { period: 'custom', label: t('timePeriod.customRange'), icon: '⚙️' }
  ];

  // Compose time periods with dynamic years
  const yearButtons = availableYears.map(year => ({
    period: `year-${year}` as TimePeriod,
    label: year.toString(),
    icon: '📆',
    year
  }));
  
  const timePeriods = [
    ...allTimePeriods.filter(({ period }) => period !== 'custom'),
    ...yearButtons,
    allTimePeriods.find(({ period }) => period === 'custom')!
  ];

  const timePeriodsFiltered = timePeriods.filter(({ period }) => {
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
    const periodToFind = targetPeriod || selectedPeriod;
    const selectedIndex = timePeriodsFiltered.findIndex(({ period }) => period === periodToFind);
    
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
  }, [selectedPeriod, timePeriodsFiltered]);

  // Compute the active period based on currentDateRange and selectedPeriod
  function getActivePeriod(currentDateRange: DateRange | undefined, selectedPeriod: TimePeriod | undefined, availableYears: number[]) {
    for (const year of availableYears) {
      if (
        currentDateRange &&
        currentDateRange.start === `${year}-01-01` &&
        currentDateRange.end === `${year}-12-31`
      ) {
        return `year-${year}`;
      }
    }
    const standardPeriods = [
      'today', 'week', 'month', 'lastMonth', 'quarter', 'winter', 'spring', 'summer', 'autumn'
    ];
    if (selectedPeriod && standardPeriods.includes(selectedPeriod)) {
      return selectedPeriod;
    }
    return 'custom';
  }

  const currentPeriod = getActivePeriod(currentDateRange, selectedPeriod, availableYears);

  const handlePeriodSelect = (period: TimePeriod | string) => {
    if (typeof period === 'string' && period.startsWith('year-')) {
      const year = parseInt(period.replace('year-', ''));
      const start = `${year}-01-01`;
      const end = `${year}-12-31`;
      onPeriodChange(period as TimePeriod, { start, end });
      scrollToSelectedItem(period as TimePeriod, false);
      return;
    }
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
      onPeriodChange(period as TimePeriod, dateRange);
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
    if (!hasAutoScrolledRef.current && currentPeriod) {
      const timeoutId = setTimeout(() => {
        scrollToSelectedItem(currentPeriod, false);
        hasAutoScrolledRef.current = true;
      }, 100); // Slight delay to ensure component is fully mounted
      
      return () => clearTimeout(timeoutId);
    }
  }, [currentPeriod]); // Empty dependency array - only run once on mount

  // Helper to check if a year button should be selected
  const isYearSelected = (period: string, label: string) => {
    if (typeof period === 'string' && period.startsWith('year-') && currentDateRange) {
      return (
        currentDateRange.start === `${label}-01-01` &&
        currentDateRange.end === `${label}-12-31`
      );
    }
    return false;
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.scrollView} 
        ref={scrollViewRef}
      >
        {timePeriodsFiltered.map(({ period, label, icon }) => {
          const isSelected = period === currentPeriod;
          return (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                isSelected && styles.selectedPeriodButton
              ]}
              onPress={() => handlePeriodSelect(period)}
              activeOpacity={0.7}
            >
              <Text style={styles.periodIcon}>{icon}</Text>
              <Text style={[
                styles.periodLabel,
                isSelected && styles.selectedPeriodLabel
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
              title={t('timePeriod.customDateRange')}
              leftAction={{
                label: t('timePeriod.cancel'),
                onPress: () => setShowCustomModal(false)
              }}
              rightAction={{
                label: t('timePeriod.apply'),
                onPress: handleCustomRangeApply,
                disabled: !isCustomRangeValid
              }}
            />
            
            <View style={styles.modalContent}>
              <View style={styles.dateInputGroup}>
                <Text style={styles.inputLabel}>{t('timePeriod.fromDate')}</Text>
                <TextInput
                  mode="outlined"
                  value={customRange.start}
                  onChangeText={(text) => setCustomRange({ ...customRange, start: text })}
                  placeholder={t('timePeriod.datePlaceholder')}
                  style={styles.dateInput}
                />
              </View>
              
              <View style={styles.dateInputGroup}>
                <Text style={styles.inputLabel}>{t('timePeriod.toDate')}</Text>
                <TextInput
                  mode="outlined"
                  value={customRange.end}
                  onChangeText={(text) => setCustomRange({ ...customRange, end: text })}
                  placeholder={t('timePeriod.datePlaceholder')}
                  style={styles.dateInput}
                />
              </View>

              {!isCustomRangeValid && customRange.start && customRange.end && (
                <Text style={styles.errorText}>
                  {t('timePeriod.endDateAfterStart')}
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
    gap: theme.spacing.xs,
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