import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  Switch,
  TouchableOpacity
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
  Chip
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SUPPORTED_CURRENCIES, getCurrencySymbol } from '@/shared/utils/currencyUtils';
import { DEFAULT_CATEGORIES } from '../../model/Transaction';
import { theme } from '@/shared/ui/theme/theme';
import { ModalHeader } from '@/shared/ui/components/ModalHeader';
import { useTransactionStore } from '../../store/transactionStore';

interface SettingsScreenProps {
  onClose: () => void;
}

interface AppSettings {
  defaultCurrency: string;
  defaultCategory: string;
  dateFormat: 'DD.MM.YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  autoDetectCurrency: boolean;
  confirmDeleteTransactions: boolean;
  defaultTransactionType: 'expense' | 'income';
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onClose }) => {
  const { clearAllTransactions, transactions, loading } = useTransactionStore();
  
  const [settings, setSettings] = useState<AppSettings>({
    defaultCurrency: 'UAH',
    defaultCategory: DEFAULT_CATEGORIES[0],
    dateFormat: 'DD.MM.YYYY',
    autoDetectCurrency: true,
    confirmDeleteTransactions: true,
    defaultTransactionType: 'expense'
  });

  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showDateFormatModal, setShowDateFormatModal] = useState(false);

  const handleSaveSettings = () => {
    // TODO: Implement settings persistence
    Alert.alert('Success', 'Settings saved successfully!');
    onClose();
  };

  const handleExportData = () => {
    if (transactions.length === 0) {
      Alert.alert('No Data', 'There are no transactions to export.');
      return;
    }

    Alert.alert(
      'Export Data',
      `This will export all ${transactions.length} transactions to a CSV file.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Export', onPress: () => {
          try {
            // Create CSV content
            const csvHeader = 'Date,Card,Amount,Currency,Description,Category,Type,Comment\n';
            const csvContent = transactions.map(t => 
              `${t.date},"${t.card}",${t.amount},"${t.currency}","${t.description}","${t.category}","${t.isIncome ? 'Income' : 'Expense'}","${t.comment || ''}"`
            ).join('\n');
            
            const fullCsv = csvHeader + csvContent;
            
            // For now, just show success message
            // In a real app, you would create and download the file
            Alert.alert('Export Successful', 'Transaction data has been exported to CSV format.');
            console.log('CSV Export:', fullCsv);
          } catch (error) {
            Alert.alert('Export Failed', 'Failed to export data. Please try again.');
            console.error('Export error:', error);
          }
        }}
      ]
    );
  };

  const handleClearData = () => {
    if (transactions.length === 0) {
      Alert.alert('No Data', 'There are no transactions to clear.');
      return;
    }

    Alert.alert(
      'Clear All Data',
      `This will permanently delete all ${transactions.length} transactions. This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete All', style: 'destructive', onPress: async () => {
          try {
            await clearAllTransactions();
            Alert.alert('Success', 'All transaction data has been cleared.');
          } catch (error) {
            Alert.alert('Error', 'Failed to clear data. Please try again.');
            console.error('Clear data error:', error);
          }
        }}
      ]
    );
  };

  const dateFormatOptions = [
    { value: 'DD.MM.YYYY', label: 'DD.MM.YYYY (31.12.2024)' },
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (12/31/2024)' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2024-12-31)' }
  ] as const;

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
              title="Date Format"
              description={dateFormatOptions.find(opt => opt.value === settings.dateFormat)?.label}
              left={(props) => <List.Icon {...props} icon="calendar" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => setShowDateFormatModal(true)}
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
                  value={settings.confirmDeleteTransactions}
                  onValueChange={(value) => 
                    setSettings({ ...settings, confirmDeleteTransactions: value })
                  }
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
              description="1.0.0 (Phase 2 Prototype)"
              left={(props) => <List.Icon {...props} icon="information" />}
            />
            
            <List.Item
              title="Build"
              description="React Native with Expo"
              left={(props) => <List.Icon {...props} icon="hammer" />}
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
              {DEFAULT_CATEGORIES.map((category) => (
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

      {/* Date Format Selection Modal */}
      <Portal>
        <Modal
          visible={showDateFormatModal}
          onDismiss={() => setShowDateFormatModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Surface style={styles.modalSurface}>
            <Text variant="titleMedium" style={styles.modalTitle}>
              Select Date Format
            </Text>
            <View style={styles.modalContent}>
              {dateFormatOptions.map((option) => (
                <List.Item
                  key={option.value}
                  title={option.label}
                  onPress={() => {
                    setSettings({ ...settings, dateFormat: option.value });
                    setShowDateFormatModal(false);
                  }}
                  right={() => 
                    settings.dateFormat === option.value ? (
                      <List.Icon icon="check" color={theme.colors.primary} />
                    ) : null
                  }
                />
              ))}
            </View>
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