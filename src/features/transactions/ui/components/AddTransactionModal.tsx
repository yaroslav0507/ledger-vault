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
import { validateTransactionForm, ValidationErrors, TransactionFormData } from '../../model/validation';
import { getCurrentDateISO } from '@/shared/utils/dateUtils';
import { parseCurrencyToSmallestUnit, SUPPORTED_CURRENCIES, getCurrencySymbol } from '@/shared/utils/currencyUtils';
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
    date: getCurrentDateISO(),
    currency: 'UAH'
  });
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const resetForm = () => {
    setFormData({
      description: '',
      amount: '',
      card: '',
      category: DEFAULT_CATEGORIES[0] as CategoryType,
      comment: '',
      isIncome: false,
      date: getCurrentDateISO(),
      currency: 'UAH'
    });
    setValidationErrors({});
    setHasSubmitted(false);
  };

  const validateForm = () => {
    const validation = validateTransactionForm(formData);
    setValidationErrors(validation.errors || {});
    return validation;
  };

  const handleSubmit = async () => {
    console.log('🔘 HandleSubmit called', formData);
    setHasSubmitted(true);
    
    const validation = validateForm();
    
    if (!validation.success) {
      console.log('❌ Validation failed:', validation.errors);
      return;
    }

    console.log('✅ Validation passed, creating transaction...');
    
    setLoading(true);
    try {
      const validatedData = validation.data as TransactionFormData;
      const transaction: CreateTransactionRequest = {
        description: validatedData.description,
        amount: parseCurrencyToSmallestUnit(parseFloat(validatedData.amount), validatedData.currency),
        card: validatedData.card,
        category: validatedData.category,
        comment: validatedData.comment || undefined,
        isIncome: validatedData.isIncome,
        date: validatedData.date,
        currency: validatedData.currency
      };

      console.log('🔘 About to call onSubmit with:', transaction);
      await onSubmit(transaction);
      console.log('✅ onSubmit completed successfully');
      
      resetForm();
      onClose();
      Alert.alert('Success', 'Transaction added successfully!');
    } catch (error) {
      console.error('❌ Error in handleSubmit:', error);
      Alert.alert('Error', 'Failed to add transaction');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Real-time validation on blur if form has been submitted
  const handleFieldBlur = (fieldName: keyof ValidationErrors) => {
    if (hasSubmitted) {
      validateForm();
    }
  };

  const renderInputError = (fieldName: keyof ValidationErrors) => {
    const error = validationErrors[fieldName];
    if (!error || !hasSubmitted) return null;
    
    return (
      <Text style={styles.errorText}>{error}</Text>
    );
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
              style={[
                styles.input,
                validationErrors.description && hasSubmitted && styles.inputError
              ]}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              onBlur={() => handleFieldBlur('description')}
              placeholder="e.g., Starbucks Coffee"
              placeholderTextColor={theme.colors.text.disabled}
            />
            {renderInputError('description')}
          </View>

          {/* Amount */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Amount * ({getCurrencySymbol(formData.currency)})</Text>
            <TextInput
              style={[
                styles.input,
                validationErrors.amount && hasSubmitted && styles.inputError
              ]}
              value={formData.amount}
              onChangeText={(text) => setFormData({ ...formData, amount: text })}
              onBlur={() => handleFieldBlur('amount')}
              placeholder="0.00"
              placeholderTextColor={theme.colors.text.disabled}
              keyboardType="decimal-pad"
            />
            {renderInputError('amount')}
          </View>

          {/* Currency */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Currency</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.currencyScroll}>
              {SUPPORTED_CURRENCIES.map((currency) => (
                <TouchableOpacity
                  key={currency.code}
                  style={[
                    styles.currencyChip,
                    formData.currency === currency.code && styles.selectedCurrencyChip
                  ]}
                  onPress={() => setFormData({ ...formData, currency: currency.code })}
                >
                  <Text style={[
                    styles.currencyChipText,
                    formData.currency === currency.code && styles.selectedCurrencyChipText
                  ]}>
                    {currency.symbol} {currency.code}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {renderInputError('currency')}
          </View>

          {/* Card/Account */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Card/Account *</Text>
            <TextInput
              style={[
                styles.input,
                validationErrors.card && hasSubmitted && styles.inputError
              ]}
              value={formData.card}
              onChangeText={(text) => setFormData({ ...formData, card: text })}
              onBlur={() => handleFieldBlur('card')}
              placeholder="e.g., Monzo, Santander"
              placeholderTextColor={theme.colors.text.disabled}
            />
            {renderInputError('card')}
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
            {renderInputError('category')}
          </View>

          {/* Comment */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Comment (Optional)</Text>
            <TextInput
              style={[
                styles.input, 
                styles.textArea,
                validationErrors.comment && hasSubmitted && styles.inputError
              ]}
              value={formData.comment}
              onChangeText={(text) => setFormData({ ...formData, comment: text })}
              onBlur={() => handleFieldBlur('comment')}
              placeholder="Add a note about this transaction..."
              placeholderTextColor={theme.colors.text.disabled}
              multiline
              numberOfLines={3}
            />
            {renderInputError('comment')}
          </View>

          {/* Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date</Text>
            <TextInput
              style={[
                styles.input,
                validationErrors.date && hasSubmitted && styles.inputError
              ]}
              value={formData.date}
              onChangeText={(text) => setFormData({ ...formData, date: text })}
              onBlur={() => handleFieldBlur('date')}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.colors.text.disabled}
            />
            {renderInputError('date')}
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
  currencyScroll: {
    marginTop: theme.spacing.sm,
  },
  currencyChip: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.round,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginRight: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selectedCurrencyChip: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  currencyChipText: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  selectedCurrencyChipText: {
    color: theme.colors.text.inverse,
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  errorText: {
    ...theme.typography.caption,
    color: theme.colors.error,
  },
}); 