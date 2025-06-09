import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  TextInput
} from 'react-native';
import { TransactionFilters, DEFAULT_CATEGORIES } from '../../model/Transaction';
import { theme } from '@/shared/ui/theme/theme';

interface TransactionFiltersProps {
  visible: boolean;
  onClose: () => void;
  currentFilters: TransactionFilters;
  onApplyFilters: (filters: TransactionFilters) => void;
  availableCards: string[];
}

export const TransactionFiltersModal: React.FC<TransactionFiltersProps> = ({
  visible,
  onClose,
  currentFilters,
  onApplyFilters,
  availableCards
}) => {
  const [filters, setFilters] = useState<TransactionFilters>(currentFilters);

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleClear = () => {
    const emptyFilters: TransactionFilters = {};
    setFilters(emptyFilters);
    onApplyFilters(emptyFilters);
    onClose();
  };

  const toggleCategory = (category: string) => {
    const currentCategories = filters.categories || [];
    const newCategories = currentCategories.includes(category)
      ? currentCategories.filter(c => c !== category)
      : [...currentCategories, category];
    
    setFilters({
      ...filters,
      categories: newCategories.length > 0 ? newCategories : undefined
    });
  };

  const toggleCard = (card: string) => {
    const currentCards = filters.cards || [];
    const newCards = currentCards.includes(card)
      ? currentCards.filter(c => c !== card)
      : [...currentCards, card];
    
    setFilters({
      ...filters,
      cards: newCards.length > 0 ? newCards : undefined
    });
  };

  const setIncomeFilter = (isIncome: boolean | undefined) => {
    setFilters({
      ...filters,
      isIncome
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Filter Transactions</Text>
          <TouchableOpacity onPress={handleApply}>
            <Text style={styles.applyButton}>Apply</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Transaction Type Filter */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Transaction Type</Text>
            <View style={styles.chipContainer}>
              <TouchableOpacity
                style={[
                  styles.chip,
                  filters.isIncome === undefined && styles.selectedChip
                ]}
                onPress={() => setIncomeFilter(undefined)}
              >
                <Text style={[
                  styles.chipText,
                  filters.isIncome === undefined && styles.selectedChipText
                ]}>
                  All
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.chip,
                  filters.isIncome === false && styles.selectedChip
                ]}
                onPress={() => setIncomeFilter(false)}
              >
                <Text style={[
                  styles.chipText,
                  filters.isIncome === false && styles.selectedChipText
                ]}>
                  Expenses
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.chip,
                  filters.isIncome === true && styles.selectedChip
                ]}
                onPress={() => setIncomeFilter(true)}
              >
                <Text style={[
                  styles.chipText,
                  filters.isIncome === true && styles.selectedChipText
                ]}>
                  Income
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Categories Filter */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <View style={styles.chipContainer}>
              {DEFAULT_CATEGORIES.map((category) => {
                const isSelected = filters.categories?.includes(category) || false;
                return (
                  <TouchableOpacity
                    key={category}
                    style={[styles.chip, isSelected && styles.selectedChip]}
                    onPress={() => toggleCategory(category)}
                  >
                    <Text style={[
                      styles.chipText,
                      isSelected && styles.selectedChipText
                    ]}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Cards Filter */}
          {availableCards.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Cards/Accounts</Text>
              <View style={styles.chipContainer}>
                {availableCards.map((card) => {
                  const isSelected = filters.cards?.includes(card) || false;
                  return (
                    <TouchableOpacity
                      key={card}
                      style={[styles.chip, isSelected && styles.selectedChip]}
                      onPress={() => toggleCard(card)}
                    >
                      <Text style={[
                        styles.chipText,
                        isSelected && styles.selectedChipText
                      ]}>
                        {card}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Search Filter */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Search</Text>
            <TextInput
              style={styles.searchInput}
              value={filters.searchQuery || ''}
              onChangeText={(text) => setFilters({
                ...filters,
                searchQuery: text.trim() || undefined
              })}
              placeholder="Search descriptions, comments..."
              placeholderTextColor={theme.colors.text.disabled}
            />
          </View>

          {/* Date Range Filter */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Date Range</Text>
            <View style={styles.dateInputContainer}>
              <View style={styles.dateInputGroup}>
                <Text style={styles.dateLabel}>From</Text>
                <TextInput
                  style={styles.dateInput}
                  value={filters.dateRange?.start || ''}
                  onChangeText={(text) => setFilters({
                    ...filters,
                    dateRange: {
                      start: text,
                      end: filters.dateRange?.end || ''
                    }
                  })}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={theme.colors.text.disabled}
                />
              </View>
              <View style={styles.dateInputGroup}>
                <Text style={styles.dateLabel}>To</Text>
                <TextInput
                  style={styles.dateInput}
                  value={filters.dateRange?.end || ''}
                  onChangeText={(text) => setFilters({
                    ...filters,
                    dateRange: {
                      start: filters.dateRange?.start || '',
                      end: text
                    }
                  })}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={theme.colors.text.disabled}
                />
              </View>
            </View>
          </View>

          {/* Clear Filters Button */}
          <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
            <Text style={styles.clearButtonText}>Clear All Filters</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.text.primary,
  },
  cancelButton: {
    ...theme.typography.button,
    color: theme.colors.text.secondary,
  },
  applyButton: {
    ...theme.typography.button,
    color: theme.colors.primary,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  chip: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.round,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
  },
  selectedChip: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipText: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  selectedChipText: {
    color: theme.colors.text.inverse,
  },
  searchInput: {
    ...theme.typography.bodyLarge,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text.primary,
  },
  dateInputContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  dateInputGroup: {
    flex: 1,
  },
  dateLabel: {
    ...theme.typography.body,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    fontWeight: '600',
  },
  dateInput: {
    ...theme.typography.bodyLarge,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text.primary,
  },
  clearButton: {
    backgroundColor: theme.colors.error,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  clearButtonText: {
    ...theme.typography.button,
    color: theme.colors.text.inverse,
  },
}); 