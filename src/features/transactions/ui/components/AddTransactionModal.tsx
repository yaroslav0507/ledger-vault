import React, { useState, useEffect } from 'react';
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
import { CreateTransactionRequest, Transaction, UpdateTransactionRequest } from '../../model/Transaction';
import { validateTransactionForm, ValidationErrors, TransactionFormData } from '../../model/validation';
import { getCurrentDateISO } from '@/shared/utils/dateUtils';
import { parseCurrencyToSmallestUnit, formatCurrencyFromSmallestUnit, SUPPORTED_CURRENCIES, getCurrencySymbol } from '@/shared/utils/currencyUtils';
import { theme } from '@/shared/ui/theme/theme';
import { ModalHeader } from '@/shared/ui/components/ModalHeader';
import { categoryService } from '../../service/CategoryService';

interface AddTransactionModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (transaction: CreateTransactionRequest) => Promise<void>;
  editMode?: boolean;
  transactionToEdit?: Transaction;
  onUpdate?: (id: string, updates: UpdateTransactionRequest) => Promise<void>;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  visible,
  onClose,
  onSubmit,
  editMode,
  transactionToEdit,
  onUpdate
}) => {
  const [formData, setFormData] = useState<TransactionFormData>({
    description: '',
    amount: '',
    card: '',
    category: '',
    comment: '',
    isIncome: false,
    date: getCurrentDateISO(),
    currency: 'UAH'
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResettingForm, setIsResettingForm] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

  // Reset form when modal is opened
  useEffect(() => {
    if (visible) {
      setIsResettingForm(true);
      
      if (editMode && transactionToEdit) {
        // Pre-populate form with existing transaction data
        setFormData({
          description: transactionToEdit.description,
          amount: formatCurrencyFromSmallestUnit(transactionToEdit.amount, transactionToEdit.currency),
          card: transactionToEdit.card,
          category: transactionToEdit.category,
          comment: transactionToEdit.comment || '',
          isIncome: transactionToEdit.isIncome,
          date: transactionToEdit.date,
          currency: transactionToEdit.currency as 'UAH' | 'USD' | 'EUR' | 'GBP' | 'ILS'
        });
      } else {
        // Reset form for new transaction
        setFormData({
          description: '',
          amount: '',
          card: '',
          category: '',
          comment: '',
          isIncome: false,
          date: getCurrentDateISO(),
          currency: 'UAH'
        });
      }
      
      setErrors({});
      loadCategories();
      setIsResettingForm(false);
    }
  }, [visible, editMode, transactionToEdit]);

  const loadCategories = async () => {
    try {
      // Get all categories (no date filter for add transaction modal)
      const categories = await categoryService.getAllCategories();
      setAvailableCategories(categories);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrors({});

    const validation = validateTransactionForm(formData);
    
    if (!validation.success) {
      setErrors(validation.errors || {});
      setIsSubmitting(false);
      return;
    }

    try {
      const { data } = validation;
      if (!data) {
        setIsSubmitting(false);
        return;
      }
      
      const amount = parseCurrencyToSmallestUnit(parseFloat(data.amount), data.currency);
      
      const transactionRequest: CreateTransactionRequest = {
        description: data.description,
        amount,
        card: data.card,
        category: data.category,
        comment: data.comment || undefined,
        isIncome: data.isIncome,
        date: data.date,
        currency: data.currency
      };

      if (editMode) {
        await onUpdate?.(transactionToEdit?.id || '', transactionRequest);
      } else {
        await onSubmit(transactionRequest);
      }
      onClose();
    } catch (error) {
      console.error('Error creating transaction:', error);
      Alert.alert('Error', 'Failed to create transaction. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFieldChange = (field: keyof TransactionFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const renderError = (field: keyof ValidationErrors) => {
    return errors[field] ? (
      <Text style={styles.errorText}>{errors[field]}</Text>
    ) : null;
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
          title={editMode ? "Edit Transaction" : "Add Transaction"}
          leftAction={{
            label: "Cancel",
            onPress: onClose
          }}
          rightAction={{
            label: isSubmitting ? (editMode ? "Updating..." : "Adding...") : (editMode ? "Update" : "Add"),
            onPress: handleSubmit,
            disabled: isSubmitting || isResettingForm
          }}
        />

        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          {/* Transaction Type Toggle */}
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleLabel}>Transaction Type</Text>
            <View style={styles.toggleRow}>
              <Text style={[styles.toggleText, !formData.isIncome && styles.activeToggleText]}>
                Expense
              </Text>
              <Switch
                value={formData.isIncome}
                onValueChange={(value) => handleFieldChange('isIncome', value)}
                trackColor={{ false: theme.colors.backgroundSecondary, true: theme.colors.income }}
                thumbColor={formData.isIncome ? theme.colors.surface : theme.colors.surface}
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
              style={[styles.input, errors.description && styles.inputError]}
              value={formData.description}
              onChangeText={(text) => handleFieldChange('description', text)}
              placeholder="Enter transaction description"
              placeholderTextColor={theme.colors.text.disabled}
              autoCapitalize="sentences"
            />
            {renderError('description')}
          </View>

          {/* Amount */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Amount *</Text>
            <View style={styles.amountContainer}>
              <TextInput
                style={[styles.input, styles.amountInput, errors.amount && styles.inputError]}
                value={formData.amount}
                onChangeText={(text) => handleFieldChange('amount', text)}
                placeholder="0.00"
                placeholderTextColor={theme.colors.text.disabled}
                keyboardType="numeric"
              />
              <Text style={styles.currencySymbol}>
                {getCurrencySymbol(formData.currency)}
              </Text>
            </View>
            {renderError('amount')}
          </View>

          {/* Card/Account */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Card/Account *</Text>
            <TextInput
              style={[styles.input, errors.card && styles.inputError]}
              value={formData.card}
              onChangeText={(text) => handleFieldChange('card', text)}
              placeholder="Enter card or account name"
              placeholderTextColor={theme.colors.text.disabled}
              autoCapitalize="words"
            />
            {renderError('card')}
          </View>

          {/* Category */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category *</Text>
            <TextInput
              style={[styles.input, errors.category && styles.inputError]}
              value={formData.category}
              onChangeText={(text) => handleFieldChange('category', text)}
              placeholder="Enter or select category"
              placeholderTextColor={theme.colors.text.disabled}
              autoCapitalize="words"
            />
            {renderError('category')}
            
            {/* Show available categories as chips if any exist */}
            {availableCategories.length > 0 && (
              <ScrollView horizontal style={styles.categoryScroll} showsHorizontalScrollIndicator={false}>
                {availableCategories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryChip,
                      formData.category === category && styles.selectedCategoryChip
                    ]}
                    onPress={() => handleFieldChange('category', category)}
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
            )}
          </View>

          {/* Comment */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Comment</Text>
            <TextInput
              style={[styles.input, styles.textArea, errors.comment && styles.inputError]}
              value={formData.comment}
              onChangeText={(text) => handleFieldChange('comment', text)}
              placeholder="Add a comment (optional)"
              placeholderTextColor={theme.colors.text.disabled}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              autoCapitalize="sentences"
            />
            {renderError('comment')}
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
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountInput: {
    flex: 1,
  },
  currencySymbol: {
    ...theme.typography.body,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.sm,
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  errorText: {
    ...theme.typography.caption,
    color: theme.colors.error,
  },
}); 