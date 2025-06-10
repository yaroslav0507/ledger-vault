import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  TextInput
} from 'react-native';
import { TransactionFilters } from '../../model/Transaction';
import { theme } from '@/shared/ui/theme/theme';
import { ModalHeader } from '@/shared/ui/components/ModalHeader';
import { categoryService } from '../../service/CategoryService';
import { Transaction } from '../../model/Transaction';

interface TransactionFiltersProps {
  visible: boolean;
  onClose: () => void;
  currentFilters: TransactionFilters;
  onApplyFilters: (filters: TransactionFilters) => void;
  onClearFilters: () => void;
  availableCards: string[];
  transactions: Transaction[];
}

export const TransactionFiltersModal: React.FC<TransactionFiltersProps> = ({
  visible,
  onClose,
  currentFilters,
  onApplyFilters,
  onClearFilters,
  availableCards,
  transactions
}) => {
  const [filters, setFilters] = useState<TransactionFilters>(currentFilters);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  // Sync local filters state with currentFilters prop changes (e.g., from TimePeriodSelector)
  useEffect(() => {
    setFilters(currentFilters);
  }, [currentFilters]);

  // Load categories when modal opens or when date range changes
  useEffect(() => {
    if (visible) {
      loadCategories();
    }
  }, [visible, filters.dateRange]);

  const loadCategories = async () => {
    try {
      setCategoriesLoading(true);
      console.log('�� Loading categories for date range:', filters.dateRange);
      
      // Pass the current date range to get categories only from selected time period
      const categories = await categoryService.getAllCategories(filters.dateRange);
      console.log('📋 Loaded categories:', categories);
      setAvailableCategories(categories);
    } catch (error) {
      console.error('❌ Failed to load categories:', error);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleClear = () => {
    console.log('🧹 Clearing all filters...');
    onClearFilters();
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
        <ModalHeader
          title="Filter Transactions"
          leftAction={{
            label: "Cancel",
            onPress: onClose
          }}
          rightAction={{
            label: "Apply",
            onPress: handleApply
          }}
        />

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

          {/* Categories Filter - Show during loading or when categories are available */}
          {(categoriesLoading || availableCategories.length > 0) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Categories</Text>
              <View style={styles.chipContainer}>
                {categoriesLoading ? (
                  <Text style={styles.loadingText}>Loading categories...</Text>
                ) : (
                  availableCategories.map((category) => {
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
                  })
                )}
              </View>
            </View>
          )}

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
  loadingText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
}); 