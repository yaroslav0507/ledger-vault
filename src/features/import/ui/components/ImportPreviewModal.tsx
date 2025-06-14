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
  const [showDetails, setShowDetails] = React.useState(false);

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
                  <Chip mode="outlined" textStyle={{ color: '#2e7d32' }}>
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

            {/* Details */}
            {errors.length > 0 && (
              <Card style={styles.detailsCard}>
                <Card.Content>
                  <View style={styles.detailsHeader}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                      Import Errors ({errors.length})
                    </Text>
                    <Button
                      mode="outlined"
                      compact
                      onPress={() => setShowDetails(!showDetails)}
                    >
                      {showDetails ? 'Hide' : 'Show'} Details
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
                          ...and {errors.length - 5} more details
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
                            {formatDate(transaction.date)} • {transaction.card} • {transaction.category} • {transaction.comment || 'No comment'}
                          </Text>
                          {transaction.isDuplicate && (
                            <Chip mode="outlined" compact textStyle={{ fontSize: 10 }}>
                              Duplicate
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