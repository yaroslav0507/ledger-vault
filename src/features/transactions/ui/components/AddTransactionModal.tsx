import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
  ScrollView,
  Switch
} from 'react-native';
import { CreateTransactionRequest, DEFAULT_CATEGORIES, CategoryType } from '../../model/Transaction';
import { getCurrentDateISO } from '@/shared/utils/dateUtils';
import { parseCurrencyToSmallestUnit } from '@/shared/utils/currencyUtils';
import { theme } from '@/shared/ui/theme/theme';

interface AddTransactionModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (transaction: CreateTransactionRequest) => Promise<void>;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  visible,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    card: '',
    category: DEFAULT_CATEGORIES[0] as CategoryType,
    comment: '',
    isIncome: false,
    date: getCurrentDateISO()
  });
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setFormData({
      description: '',
      amount: '',
      card: '',
      category: DEFAULT_CATEGORIES[0] as CategoryType,
      comment: '',
      isIncome: false,
      date: getCurrentDateISO()
    });
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }
    if (!formData.amount.trim()) {
      Alert.alert('Error', 'Please enter an amount');
      return;
    }
    if (!formData.card.trim()) {
      Alert.alert('Error', 'Please enter a card/account');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const transaction: CreateTransactionRequest = {
        description: formData.description.trim(),
        amount: parseCurrencyToSmallestUnit(amount),
        card: formData.card.trim(),
        category: formData.category,
        comment: formData.comment.trim() || undefined,
        isIncome: formData.isIncome,
        date: formData.date,
        currency: 'USD'
      };

      await onSubmit(transaction);
      resetForm();
      onClose();
      Alert.alert('Success', 'Transaction added successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to add transaction');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Add Transaction</Text>
          <TouchableOpacity onPress={handleSubmit} disabled={loading}>
            <Text style={[styles.saveButton, loading && styles.disabledButton]}>
              {loading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          {/* Income/Expense Toggle */}
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleLabel}>Transaction Type</Text>
            <View style={styles.toggleRow}>
              <Text style={[styles.toggleText, !formData.isIncome && styles.activeToggleText]}>
                Expense
              </Text>
              <Switch
                value={formData.isIncome}
                onValueChange={(value) => setFormData({ ...formData, isIncome: value })}
                trackColor={{ false: theme.colors.expense, true: theme.colors.income }}
                thumbColor={theme.colors.surface}
              />
              <Text style={[styles.toggleText, formData.isIncome && styles.activeToggleText]}>
                Income
              </Text>
            </View>
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={styles.input}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="e.g., Starbucks Coffee"
              placeholderTextColor={theme.colors.text.disabled}
            />
          </View>

          {/* Amount */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Amount * ($)</Text>
            <TextInput
              style={styles.input}
              value={formData.amount}
              onChangeText={(text) => setFormData({ ...formData, amount: text })}
              placeholder="0.00"
              placeholderTextColor={theme.colors.text.disabled}
              keyboardType="decimal-pad"
            />
          </View>

          {/* Card/Account */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Card/Account *</Text>
            <TextInput
              style={styles.input}
              value={formData.card}
              onChangeText={(text) => setFormData({ ...formData, card: text })}
              placeholder="e.g., Monzo, Santander"
              placeholderTextColor={theme.colors.text.disabled}
            />
          </View>

          {/* Category */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {DEFAULT_CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryChip,
                    formData.category === category && styles.selectedCategoryChip
                  ]}
                  onPress={() => setFormData({ ...formData, category: category as CategoryType })}
                >
                  <Text style={[
                    styles.categoryChipText,
                    formData.category === category && styles.selectedCategoryChipText
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Comment */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Comment (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.comment}
              onChangeText={(text) => setFormData({ ...formData, comment: text })}
              placeholder="Add a note about this transaction..."
              placeholderTextColor={theme.colors.text.disabled}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date</Text>
            <TextInput
              style={styles.input}
              value={formData.date}
              onChangeText={(text) => setFormData({ ...formData, date: text })}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.colors.text.disabled}
            />
          </View>
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
  saveButton: {
    ...theme.typography.button,
    color: theme.colors.primary,
  },
  disabledButton: {
    color: theme.colors.text.disabled,
  },
  form: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  toggleContainer: {
    marginBottom: theme.spacing.lg,
  },
  toggleLabel: {
    ...theme.typography.body,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  toggleText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    marginHorizontal: theme.spacing.md,
  },
  activeToggleText: {
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    ...theme.typography.body,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    fontWeight: '600',
  },
  input: {
    ...theme.typography.bodyLarge,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text.primary,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  categoryScroll: {
    marginTop: theme.spacing.sm,
  },
  categoryChip: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.round,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginRight: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selectedCategoryChip: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  categoryChipText: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  selectedCategoryChipText: {
    color: theme.colors.text.inverse,
  },
}); 