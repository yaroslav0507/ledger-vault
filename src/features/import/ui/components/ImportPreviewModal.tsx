import React from 'react';
import {
  Modal,
  Portal,
  Surface,
  Text,
  Button,
  Chip,
  Card,
  Divider,
  List,
  IconButton
} from 'react-native-paper';
import { View, ScrollView, StyleSheet } from 'react-native';
import { formatCurrency, SUPPORTED_CURRENCIES } from '@/shared/utils/currencyUtils';
import { formatDate } from '@/shared/utils/dateUtils';
import { ImportResult } from '../../strategies/ImportStrategy';
import { Transaction } from '@/features/transactions/model/Transaction';
import { useTranslation } from '../../../../shared/i18n/useTranslation';

interface ImportPreviewModalProps {
  visible: boolean;
  onDismiss: () => void;
  onConfirm: (transactions: Transaction[], ignoreDuplicates: boolean) => void;
  result: ImportResult | null;
  fileName: string;
  isLoading?: boolean;
}

export const ImportPreviewModal: React.FC<ImportPreviewModalProps> = ({
  visible,
  onDismiss,
  onConfirm,
  result,
  fileName,
  isLoading = false
}) => {
  const { t } = useTranslation();
  const [ignoreDuplicates, setIgnoreDuplicates] = React.useState(true);
  const [showDetails, setShowDetails] = React.useState(false);
  const [selectedCurrency, setSelectedCurrency] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (result && result.transactions.length > 0) {
      setSelectedCurrency(result.transactions[0].currency || SUPPORTED_CURRENCIES[0].code);
    }
  }, [result]);

  if (!result) return null;

  const { transactions, duplicates, errors, summary } = result;
  const validTransactions = ignoreDuplicates 
    ? transactions.filter(t => !t.isDuplicate)
    : transactions;

  const handleConfirm = () => {
    const updated = transactions.map(t => ({ ...t, currency: selectedCurrency || t.currency }));
    onConfirm(updated, ignoreDuplicates);
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modal}
      >
        <Surface style={styles.surface}>
          <ScrollView style={styles.scrollView}>
            {/* Header */}
            <View style={styles.header}>
              <Text variant="headlineSmall">{t('import.importPreview')}</Text>
              <Text variant="bodyMedium" style={styles.subtitle}>
                {fileName}
              </Text>
              <View style={{ marginTop: 12 }}>
                <Text variant="bodySmall" style={{ marginBottom: 4 }}>{t('import.currencyForImport')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {SUPPORTED_CURRENCIES.map((c) => (
                    <Chip
                      key={c.code}
                      selected={selectedCurrency === c.code}
                      onPress={() => setSelectedCurrency(c.code)}
                      style={{ marginRight: 8 }}
                    >
                      {c.code} {c.symbol}
                    </Chip>
                  ))}
                </ScrollView>
              </View>
            </View>

            {/* Summary */}
            <Card style={styles.summaryCard}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  {t('import.importSummary')}
                </Text>
                <View style={styles.summaryRow}>
                  <Text>{t('import.totalRowsProcessed')}:</Text>
                  <Chip mode="outlined">{summary.totalRows}</Chip>
                </View>
                <View style={styles.summaryRow}>
                  <Text>{t('import.successfullyParsed')}:</Text>
                  <Chip mode="outlined" textStyle={{ color: '#2e7d32' }}>
                    {summary.successfulImports}
                  </Chip>
                </View>
                {summary.duplicatesFound > 0 && (
                  <View style={styles.summaryRow}>
                    <Text>{t('import.duplicatesFound', { count: 0 })}:</Text>
                    <Chip mode="outlined" textStyle={{ color: '#FF9800' }}>
                      {summary.duplicatesFound}
                    </Chip>
                  </View>
                )}
                {summary.errorsCount > 0 && (
                  <View style={styles.summaryRow}>
                    <Text>{t('import.errors')}:</Text>
                    <Chip mode="outlined" textStyle={{ color: '#F44336' }}>
                      {summary.errorsCount}
                    </Chip>
                  </View>
                )}
                {summary.timeRange.earliest && (
                  <View style={styles.summaryRow}>
                    <Text>{t('import.dateRange')}:</Text>
                    <Text variant="bodySmall">
                      {formatDate(summary.timeRange.earliest)} - {formatDate(summary.timeRange.latest)}
                    </Text>
                  </View>
                )}
              </Card.Content>
            </Card>

            {/* Duplicate handling */}
            {duplicates.length > 0 && (
              <Card style={styles.duplicatesCard}>
                <Card.Content>
                  <Text variant="titleMedium" style={styles.sectionTitle}>
                    {t('import.duplicateHandling')}
                  </Text>
                  <List.Item
                    title={t('import.ignoreDuplicates')}
                    description={t('import.skipDuplicates', { count: duplicates.length })}
                    left={() => (
                      <IconButton
                        icon={ignoreDuplicates ? 'checkbox-marked' : 'checkbox-blank-outline'}
                        onPress={() => setIgnoreDuplicates(!ignoreDuplicates)}
                      />
                    )}
                  />
                </Card.Content>
              </Card>
            )}

            {/* Details */}
            {errors.length > 0 && (
              <Card style={styles.detailsCard}>
                <Card.Content>
                  <View style={styles.detailsHeader}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                      {t('import.importErrors', { count: errors.length })}
                    </Text>
                    <Button
                      mode="outlined"
                      compact
                      onPress={() => setShowDetails(!showDetails)}
                    >
                      {showDetails ? t('import.hideDetails') : t('import.showDetails')}
                    </Button>
                  </View>
                  {showDetails && (
                    <View style={styles.detailsList}>
                      {errors.slice(0, 5).map((error, index) => (
                        <View key={index} style={styles.detailItem}>
                          <Text variant="bodySmall" style={styles.detailText}>
                            Row {error.row}, Column "{error.column}": {error.error}
                          </Text>
                        </View>
                      ))}
                      {errors.length > 5 && (
                        <Text variant="bodySmall" style={styles.moreDetails}>
                          {t('import.moreDetails', { count: errors.length - 5 })}
                        </Text>
                      )}
                    </View>
                  )}
                </Card.Content>
              </Card>
            )}

            {/* Transaction Preview */}
            <Card style={styles.previewCard}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  {t('import.transactionPreview', { count: validTransactions.length })}
                </Text>
                {validTransactions.slice(0, 10).map((transaction, index) => (
                  <View key={transaction.id} style={styles.transactionItem}>
                    <View style={styles.transactionHeader}>
                      <View style={styles.transactionMainInfo}>
                        <Text 
                          variant="bodyMedium" 
                          style={styles.transactionDescription}
                          numberOfLines={2}
                          ellipsizeMode="tail"
                        >
                        {transaction.description}
                      </Text>
                        <View style={styles.transactionMeta}>
                          <Text variant="bodySmall" style={styles.metaText} numberOfLines={1} ellipsizeMode="tail">
                            {formatDate(transaction.date)} • {transaction.card} • {transaction.category} • {transaction.comment || t('import.noComment')}
                          </Text>
                          {transaction.isDuplicate && (
                            <Chip mode="outlined" compact textStyle={{ fontSize: 10 }}>
                              {t('import.duplicate')}
                            </Chip>
                          )}
                        </View>
                      </View>
                      <View style={styles.transactionAmountSection}>
                      <Text
                        variant="bodyMedium"
                        style={[
                          styles.transactionAmount,
                          { color: transaction.isIncome ? '#2e7d32' : '#64748b' }
                        ]}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                      >
                        {formatCurrency(transaction.amount, transaction.currency)}
                      </Text>
                    </View>
                    </View>
                    {index < validTransactions.slice(0, 10).length - 1 && (
                      <Divider style={styles.transactionDivider} />
                    )}
                  </View>
                ))}
                {validTransactions.length > 10 && (
                  <Text variant="bodySmall" style={styles.moreTransactions}>
                    {t('import.moreTransactions', { count: validTransactions.length - 10 })}
                  </Text>
                )}
              </Card.Content>
            </Card>
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <Button mode="outlined" onPress={onDismiss} style={styles.actionButton}>
              {t('common.cancel')}
            </Button>
            <Button
              mode="contained"
              onPress={handleConfirm}
              loading={isLoading}
              disabled={validTransactions.length === 0 || isLoading}
              style={styles.actionButton}
            >
              {t('import.importTransactions', { count: validTransactions.length })}
            </Button>
          </View>
        </Surface>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modal: {
    margin: 20,
    maxHeight: '90%',
  },
  surface: {
    padding: 0,
    borderRadius: 12,
    backgroundColor: '#fff',
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  subtitle: {
    color: '#666',
    marginTop: 4,
  },
  summaryCard: {
    marginBottom: 16,
  },
  duplicatesCard: {
    marginBottom: 16,
    backgroundColor: '#FFF3E0',
  },
  detailsCard: {
    marginBottom: 16,
    backgroundColor: '#FFEBEE',
  },
  previewCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailsList: {
    marginTop: 8,
  },
  detailItem: {
    backgroundColor: '#FFCDD2',
    padding: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  detailText: {
    color: '#C62828',
  },
  moreDetails: {
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  transactionItem: {
    paddingVertical: 8,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  transactionMainInfo: {
    flex: 1,
    marginRight: 8,
  },
  transactionDescription: {
    fontWeight: '500',
    marginBottom: 4,
  },
  transactionAmountSection: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    minWidth: 80,
  },
  transactionAmount: {
    fontWeight: '600',
    textAlign: 'right',
  },
  transactionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaText: {
    color: '#666',
    flex: 1,
  },
  transactionDivider: {
    marginTop: 8,
  },
  moreTransactions: {
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 8,
  },
}); 