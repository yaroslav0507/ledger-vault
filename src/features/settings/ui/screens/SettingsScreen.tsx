import React from 'react';
import { View, ScrollView, StyleSheet, Switch } from 'react-native';
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
import { getCurrencySymbol } from '@/shared/utils/currencyUtils';
import { theme } from '@/shared/ui/theme/theme';
import { ModalHeader } from '@/shared/ui/components/ModalHeader';
import { useSettingsScreen } from '../hooks/useSettingsScreen';
import { useTranslation } from '../../../../shared/i18n/useTranslation';

interface SettingsScreenProps {
  onClose: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onClose }) => {
  const { t, getCurrentLanguage, changeLanguage } = useTranslation();
  const {
    availableCategories,
    settings,
    setSettings,
    showCurrencyModal,
    setShowCurrencyModal,
    showCategoryModal,
    setShowCategoryModal,
    confirmDeleteTransactions,
    setConfirmDeleteTransactions,
    handleSaveSettings,
    handleExportData,
    handleClearData,
    SUPPORTED_CURRENCIES,
  } = useSettingsScreen(onClose);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <ModalHeader
        title={t('settings.title')}
        variant="screen"
        leftAction={{
          label: t('common.back'),
          onPress: onClose
        }}
        rightAction={{
          label: t('common.save'),
          onPress: handleSaveSettings
        }}
      />

      <ScrollView style={styles.content}>
        {/* App Preferences */}
        <Card style={styles.section}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              {t('settings.appPreferences')}
            </Text>
            
            <List.Item
              title={t('settings.defaultCurrency')}
              description={`${settings.defaultCurrency} (${getCurrencySymbol(settings.defaultCurrency)})`}
              left={(props) => <List.Icon {...props} icon="currency-usd" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => setShowCurrencyModal(true)}
            />
            
            <List.Item
              title={t('settings.defaultCategories')}
              description={settings.defaultCategory}
              left={(props) => <List.Icon {...props} icon="tag" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => setShowCategoryModal(true)}
            />
            
            <List.Item
              title={t('filters.transactionType')}
              description={t(settings.defaultTransactionType === 'expense' ? 'common.expense' : 'common.income')}
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
            
            <List.Item
              title={t('settings.language')}
              description={getCurrentLanguage() === 'uk' ? 'Українська' : 'English'}
              left={(props) => <List.Icon {...props} icon="translate" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {
                const newLang = getCurrentLanguage() === 'en' ? 'uk' : 'en';
                changeLanguage(newLang);
              }}
            />
          </Card.Content>
        </Card>

        {/* Display Options */}
        <Card style={styles.section}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              {t('settings.appPreferences')}
            </Text>
            
            <List.Item
              title={t('settings.autoDetectCurrency')}
              description={t('settings.autoDetectCurrencyDescription')}
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
              title={t('settings.confirmDelete')}
              description={t('settings.confirmDeleteDescription')}
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
              {t('settings.dataManagement')}
            </Text>
            
            <List.Item
              title={t('settings.exportData')}
              description={t('settings.exportDataDescription')}
              left={(props) => <List.Icon {...props} icon="export" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={handleExportData}
            />
            
            <List.Item
              title={t('settings.clearAllData')}
              description={t('settings.clearAllDataDescription')}
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
              {t('settings.about')}
            </Text>
            
            <List.Item
              title={t('settings.version')}
              description="1.0.0"
              left={(props) => <List.Icon {...props} icon="information" />}
            />
            
            <List.Item
              title={t('settings.build')}
              description={t('settings.buildDescription')}
              left={(props) => <List.Icon {...props} icon="hammer" />}
            />
            
            <List.Item
              title={t('settings.createdBy')}
              description={t('settings.createdByDescription')}
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
              {t('settings.defaultCurrency')}
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
              {t('settings.defaultCategories')}
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