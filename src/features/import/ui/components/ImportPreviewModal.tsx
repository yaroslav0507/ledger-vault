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
  DataTable,
  IconButton
} from 'react-native-paper';
import { View, ScrollView, StyleSheet } from 'react-native';
import { formatCurrency } from '@/shared/utils/currencyUtils';
import { formatDate } from '@/shared/utils/dateUtils';
import { ImportResult } from '../../strategies/ImportStrategy';
import { Transaction } from '@/features/transactions/model/Transaction';

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
  const [ignoreDuplicates, setIgnoreDuplicates] = React.useState(true);
  const [showErrors, setShowErrors] = React.useState(false);

  if (!result) return null;

  const { transactions, duplicates, errors, summary } = result;
  const validTransactions = ignoreDuplicates 
    ? transactions.filter(t => !t.isDuplicate)
    : transactions;

  const handleConfirm = () => {
    onConfirm(transactions, ignoreDuplicates);
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
              <Text variant="headlineSmall">Import Preview</Text>
              <Text variant="bodyMedium" style={styles.subtitle}>
                {fileName}
              </Text>
            </View>

            {/* Summary */}
            <Card style={styles.summaryCard}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Import Summary
                </Text>
                <View style={styles.summaryRow}>
                  <Text>Total Rows Processed:</Text>
                  <Chip mode="outlined">{summary.totalRows}</Chip>
                </View>
                <View style={styles.summaryRow}>
                  <Text>Successfully Parsed:</Text>
                  <Chip mode="outlined" textStyle={{ color: '#4CAF50' }}>
                    {summary.successfulImports}
                  </Chip>
                </View>
                {summary.duplicatesFound > 0 && (
                  <View style={styles.summaryRow}>
                    <Text>Duplicates Found:</Text>
                    <Chip mode="outlined" textStyle={{ color: '#FF9800' }}>
                      {summary.duplicatesFound}
                    </Chip>
                  </View>
                )}
                {summary.errorsCount > 0 && (
                  <View style={styles.summaryRow}>
                    <Text>Errors:</Text>
                    <Chip mode="outlined" textStyle={{ color: '#F44336' }}>
                      {summary.errorsCount}
                    </Chip>
                  </View>
                )}
                {summary.timeRange.earliest && (
                  <View style={styles.summaryRow}>
                    <Text>Date Range:</Text>
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
                    Duplicate Handling
                  </Text>
                  <List.Item
                    title="Ignore Duplicates"
                    description={`Skip ${duplicates.length} potential duplicates`}
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

            {/* Errors */}
            {errors.length > 0 && (
              <Card style={styles.errorsCard}>
                <Card.Content>
                  <View style={styles.errorHeader}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                      Import Errors ({errors.length})
                    </Text>
                    <Button
                      mode="outlined"
                      compact
                      onPress={() => setShowErrors(!showErrors)}
                    >
                      {showErrors ? 'Hide' : 'Show'} Details
                    </Button>
                  </View>
                  {showErrors && (
                    <View style={styles.errorsList}>
                      {errors.slice(0, 5).map((error, index) => (
                        <View key={index} style={styles.errorItem}>
                          <Text variant="bodySmall" style={styles.errorText}>
                            Row {error.row}, Column "{error.column}": {error.error}
                          </Text>
                        </View>
                      ))}
                      {errors.length > 5 && (
                        <Text variant="bodySmall" style={styles.moreErrors}>
                          ...and {errors.length - 5} more errors
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
                  Transaction Preview ({validTransactions.length} to import)
                </Text>
                {validTransactions.slice(0, 10).map((transaction, index) => (
                  <View key={transaction.id} style={styles.transactionItem}>
                    <View style={styles.transactionHeader}>
                      <Text variant="bodyMedium" style={styles.transactionDescription}>
                        {transaction.description}
                      </Text>
                      <Text
                        variant="bodyMedium"
                        style={[
                          styles.transactionAmount,
                          { color: transaction.isIncome ? '#4CAF50' : '#F44336' }
                        ]}
                      >
                        {transaction.isIncome ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </Text>
                    </View>
                    <View style={styles.transactionMeta}>
                      <Text variant="bodySmall" style={styles.metaText}>
                        {formatDate(transaction.date)} • {transaction.card} • {transaction.category}
                      </Text>
                      {transaction.isDuplicate && (
                        <Chip mode="outlined" compact textStyle={{ fontSize: 10 }}>
                          Duplicate
                        </Chip>
                      )}
                    </View>
                    {index < validTransactions.slice(0, 10).length - 1 && (
                      <Divider style={styles.transactionDivider} />
                    )}
                  </View>
                ))}
                {validTransactions.length > 10 && (
                  <Text variant="bodySmall" style={styles.moreTransactions}>
                    ...and {validTransactions.length - 10} more transactions
                  </Text>
                )}
              </Card.Content>
            </Card>
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <Button mode="outlined" onPress={onDismiss} style={styles.actionButton}>
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleConfirm}
              loading={isLoading}
              disabled={validTransactions.length === 0 || isLoading}
              style={styles.actionButton}
            >
              Import {validTransactions.length} Transactions
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
  errorsCard: {
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
  errorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  errorsList: {
    marginTop: 8,
  },
  errorItem: {
    backgroundColor: '#FFCDD2',
    padding: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  errorText: {
    color: '#C62828',
  },
  moreErrors: {
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
    alignItems: 'center',
    marginBottom: 4,
  },
  transactionDescription: {
    flex: 1,
    fontWeight: '500',
  },
  transactionAmount: {
    fontWeight: '600',
    marginLeft: 8,
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