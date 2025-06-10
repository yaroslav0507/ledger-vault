import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView
} from 'react-native';
import { Modal, Portal, Surface, TextInput, Button } from 'react-native-paper';
import { TimePeriod, DateRange, getDateRangeForPeriod, getTimePeriodLabel, getCurrentTimePeriod } from '../../utils/dateUtils';
import { theme } from '../theme/theme';
import { ModalHeader } from './ModalHeader';

interface TimePeriodSelectorProps {
  currentDateRange?: DateRange;
  onPeriodChange: (period: TimePeriod, dateRange: DateRange) => void;
}

export const TimePeriodSelector: React.FC<TimePeriodSelectorProps> = ({
  currentDateRange,
  onPeriodChange
}) => {
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customRange, setCustomRange] = useState<DateRange>({
    start: '',
    end: ''
  });

  const currentPeriod = getCurrentTimePeriod(currentDateRange);

  const timePeriods: { period: TimePeriod; label: string; icon: string }[] = [
    { period: 'today', label: 'Today', icon: '📅' },
    { period: 'week', label: 'This Week', icon: '📊' },
    { period: 'month', label: 'This Month', icon: '🗓️' },
    { period: 'quarter', label: 'This Quarter', icon: '📈' },
    { period: 'year', label: 'This Year', icon: '📆' },
    { period: 'spring', label: 'Spring', icon: '🌸' },
    { period: 'summer', label: 'Summer', icon: '☀️' },
    { period: 'autumn', label: 'Autumn', icon: '🍂' },
    { period: 'winter', label: 'Winter', icon: '❄️' },
    { period: 'custom', label: 'Custom Range', icon: '⚙️' }
  ];

  const handlePeriodSelect = (period: TimePeriod) => {
    if (period === 'custom') {
      // Initialize custom range with current date range or suggest a 5-year range
      if (currentDateRange) {
        setCustomRange(currentDateRange);
      } else {
        // Suggest 5-year range: from 5 years ago to today
        const today = new Date();
        const fiveYearsAgo = new Date();
        fiveYearsAgo.setFullYear(today.getFullYear() - 5);
        
        setCustomRange({
          start: fiveYearsAgo.toISOString().split('T')[0],
          end: today.toISOString().split('T')[0]
        });
      }
      setShowCustomModal(true);
    } else {
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

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView}>
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
    marginBottom: theme.spacing.xs,
    marginTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
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