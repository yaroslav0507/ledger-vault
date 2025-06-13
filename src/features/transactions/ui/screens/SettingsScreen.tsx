import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  Switch,
  TouchableOpacity,
  Platform
} from 'react-native';
import {
  Card,
  Text,
  List,
  Button,
  Portal,
  Modal,
  Surface,
  Divider,
  Chip,
  Dialog
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SUPPORTED_CURRENCIES, getCurrencySymbol } from '@/shared/utils/currencyUtils';
import { theme } from '@/shared/ui/theme/theme';
import { ModalHeader } from '@/shared/ui/components/ModalHeader';
import { useTransactionStore } from '../../store/transactionStore';
import { categoryService } from '../../service/CategoryService';
import { useSettingsStore } from '@/shared/store/settingsStore';

interface SettingsScreenProps {
  onClose: () => void;
}

interface AppSettings {
  defaultCurrency: string;
  defaultCategory: string;
  autoDetectCurrency: boolean;
  confirmDeleteTransactions: boolean;
  defaultTransactionType: 'expense' | 'income';
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onClose }) => {
  const { clearAllTransactions, transactions, loading, loadTransactions } = useTransactionStore();
  
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  
  const [settings, setSettings] = useState<AppSettings>({
    defaultCurrency: 'UAH',
    defaultCategory: 'General',
    autoDetectCurrency: true,
    confirmDeleteTransactions: true,
    defaultTransactionType: 'expense'
  });

  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const confirmDeleteTransactions = useSettingsStore(state => state.confirmDeleteTransactions);
  const setConfirmDeleteTransactions = useSettingsStore(state => state.setConfirmDeleteTransactions);

  // Load available categories on component mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categories = await categoryService.getAllCategories();
        setAvailableCategories(categories);
        
        if (categories.length > 0) {
          setSettings(prev => ({
            ...prev,
            defaultCategory: prev.defaultCategory === 'General' ? categories[0] : prev.defaultCategory
          }));
        }
      } catch (error) {
        console.error('Failed to load categories:', error);
        setAvailableCategories(['General']);
      }
    };
    
    loadCategories();
  }, []);

  // Cross-platform alert function
  const showAlert = (title: string, message: string, buttons?: Array<{text: string, onPress?: () => void, style?: 'default' | 'cancel' | 'destructive'}>) => {
    if (Platform.OS === 'web') {
      if (buttons && buttons.length > 1) {
        const confirmed = window.confirm(`${title}\n\n${message}`);
        if (confirmed) {
          const confirmButton = buttons.find(b => b.style === 'destructive' || b.text === 'Delete All' || b.text === 'Export');
          confirmButton?.onPress?.();
        } else {
          const cancelButton = buttons.find(b => b.style === 'cancel' || b.text === 'Cancel');
          cancelButton?.onPress?.();
        }
      } else {
        window.alert(`${title}\n\n${message}`);
        buttons?.[0]?.onPress?.();
      }
    } else {
      // For native, use React Native Alert
      Alert.alert(title, message, buttons);
    }
  };

  const handleSaveSettings = () => {
    showAlert('Success', 'Settings saved successfully!');
    onClose();
  };

  const handleExportData = () => {
    if (transactions.length === 0) {
      showAlert('No Data', 'There are no transactions to export.');
      return;
    }

    showAlert(
      'Export Data',
      `This will export all ${transactions.length} transactions to a CSV file.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Export', onPress: () => {
          try {
            const csvHeader = 'Date,Card,Amount,Currency,Description,Category,Type,Comment\n';
            const csvContent = transactions.map(t => 
              `${t.date},"${t.card}",${t.amount},"${t.currency}","${t.description}","${t.category}","${t.isIncome ? 'Income' : 'Expense'}","${t.comment || ''}"`
            ).join('\n');
            
            const fullCsv = csvHeader + csvContent;
            showAlert('Export Successful', 'Transaction data has been exported to CSV format.');
          } catch (error) {
            showAlert('Export Failed', 'Failed to export data. Please try again.');
            console.error('Export error:', error);
          }
        }}
      ]
    );
  };

  const handleClearData = () => {
    if (transactions.length === 0) {
      showAlert('No Data', 'There are no transactions to clear.');
      return;
    }

    showAlert(
      'Clear All Data',
      `This will permanently delete all ${transactions.length} transactions. This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete All', style: 'destructive', onPress: async () => {
          try {
            await clearAllTransactions();
            await loadTransactions();
            
            showAlert('Success', 'All transaction data has been cleared.');
          } catch (error) {
            console.error('❌ Clear data error:', error);
            showAlert(
              'Error', 
              `Failed to clear data: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`
            );
          }
        }}
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <ModalHeader
        title="Settings"
        variant="screen"
        leftAction={{
          label: "Back",
          onPress: onClose
        }}
        rightAction={{
          label: "Save",
          onPress: handleSaveSettings
        }}
      />

      <ScrollView style={styles.content}>
        {/* App Preferences */}
        <Card style={styles.section}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              App Preferences
            </Text>
            
            <List.Item
              title="Default Currency"
              description={`${settings.defaultCurrency} (${getCurrencySymbol(settings.defaultCurrency)})`}
              left={(props) => <List.Icon {...props} icon="currency-usd" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => setShowCurrencyModal(true)}
            />
            
            <List.Item
              title="Default Category"
              description={settings.defaultCategory}
              left={(props) => <List.Icon {...props} icon="tag" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => setShowCategoryModal(true)}
            />
            
            <List.Item
              title="Default Transaction Type"
              description={settings.defaultTransactionType === 'expense' ? 'Expense' : 'Income'}
              left={(props) => <List.Icon {...props} icon="swap-horizontal" />}
              right={() => (
                <Switch
                  value={settings.defaultTransactionType === 'income'}
                  onValueChange={(value) => 
                    setSettings({
                      ...settings,
                      defaultTransactionType: value ? 'income' : 'expense'
                    })
                  }
                  trackColor={{ false: theme.colors.expense, true: theme.colors.income }}
                />
              )}
            />
          </Card.Content>
        </Card>

        {/* Display Options */}
        <Card style={styles.section}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Display Options
            </Text>
            
            <List.Item
              title="Auto-detect Currency"
              description="Automatically detect currency when importing files"
              left={(props) => <List.Icon {...props} icon="auto-fix" />}
              right={() => (
                <Switch
                  value={settings.autoDetectCurrency}
                  onValueChange={(value) => 
                    setSettings({ ...settings, autoDetectCurrency: value })
                  }
                />
              )}
            />
            
            <List.Item
              title="Confirm Delete"
              description="Ask for confirmation before deleting transactions"
              left={(props) => <List.Icon {...props} icon="shield-check" />}
              right={() => (
                <Switch
                  value={confirmDeleteTransactions}
                  onValueChange={setConfirmDeleteTransactions}
                />
              )}
            />
          </Card.Content>
        </Card>

        {/* Data Management */}
        <Card style={styles.section}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Data Management
            </Text>
            
            <List.Item
              title="Export Data"
              description="Export all transactions to CSV file"
              left={(props) => <List.Icon {...props} icon="export" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={handleExportData}
            />
            
            <List.Item
              title="Clear All Data"
              description="Permanently delete all transactions"
              left={(props) => <List.Icon {...props} icon="delete" color={theme.colors.error} />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={handleClearData}
              titleStyle={{ color: theme.colors.error }}
            />
          </Card.Content>
        </Card>

        {/* App Info */}
        <Card style={styles.section}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              About
            </Text>
            
            <List.Item
              title="Version"
              description="1.0.0"
              left={(props) => <List.Icon {...props} icon="information" />}
            />
            
            <List.Item
              title="Build"
              description="React Native with Expo"
              left={(props) => <List.Icon {...props} icon="hammer" />}
            />
            
            <List.Item
              title="Created by"
              description="Matrix Sadhu"
              left={(props) => <List.Icon {...props} icon="account" />}
            />
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Currency Selection Modal */}
      <Portal>
        <Modal
          visible={showCurrencyModal}
          onDismiss={() => setShowCurrencyModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Surface style={styles.modalSurface}>
            <Text variant="titleMedium" style={styles.modalTitle}>
              Select Default Currency
            </Text>
            <ScrollView style={styles.modalContent}>
              {SUPPORTED_CURRENCIES.map((currency) => (
                <List.Item
                  key={currency.code}
                  title={`${currency.code} - ${currency.name}`}
                  description={currency.symbol}
                  onPress={() => {
                    setSettings({ ...settings, defaultCurrency: currency.code });
                    setShowCurrencyModal(false);
                  }}
                  right={() => 
                    settings.defaultCurrency === currency.code ? (
                      <List.Icon icon="check" color={theme.colors.primary} />
                    ) : null
                  }
                />
              ))}
            </ScrollView>
          </Surface>
        </Modal>
      </Portal>

      {/* Category Selection Modal */}
      <Portal>
        <Modal
          visible={showCategoryModal}
          onDismiss={() => setShowCategoryModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Surface style={styles.modalSurface}>
            <Text variant="titleMedium" style={styles.modalTitle}>
              Select Default Category
            </Text>
            <ScrollView style={styles.modalContent}>
              {availableCategories.map((category) => (
                <List.Item
                  key={category}
                  title={category}
                  onPress={() => {
                    setSettings({ ...settings, defaultCategory: category });
                    setShowCategoryModal(false);
                  }}
                  right={() => 
                    settings.defaultCategory === category ? (
                      <List.Icon icon="check" color={theme.colors.primary} />
                    ) : null
                  }
                />
              ))}
            </ScrollView>
          </Surface>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundSecondary,
  },
  content: {
    flex: 1,
    padding: theme.spacing.md,
  },
  section: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    marginBottom: theme.spacing.sm,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  modalContainer: {
    margin: theme.spacing.lg,
    maxHeight: '80%',
  },
  modalSurface: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
  },
  modalTitle: {
    marginBottom: theme.spacing.md,
    textAlign: 'center',
    fontWeight: '600',
  },
  modalContent: {
    maxHeight: 400,
  },
}); 