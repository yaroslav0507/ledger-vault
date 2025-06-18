import React, { useState, useEffect } from 'react';
import {
  Modal,
  Portal,
  Surface,
  Text,
  Button,
  Card,
  Divider,
  List,
  DataTable,
  Chip,
  Menu,
  Provider as PaperProvider
} from 'react-native-paper';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { ImportMapping } from '../../strategies/ImportStrategy';
import { theme } from '@/shared/ui/theme/theme';
import { useTranslation } from '../../../../shared/i18n/useTranslation';

interface ColumnMappingModalProps {
  visible: boolean;
  onDismiss: () => void;
  onConfirm: (mapping: ImportMapping) => void;
  columns: string[];
  sampleData: string[][];
  fileName: string;
  suggestedMapping?: Partial<ImportMapping>;
}

interface FieldMapping {
  field: keyof ImportMapping;
  label: string;
  required: boolean;
  description: string;
}

const getFieldMappings = (t: any): FieldMapping[] => [
  {
    field: 'dateColumn',
    label: t('import.dateColumn'),
    required: true,
    description: t('import.dateColumnDescription')
  },
  {
    field: 'amountColumn',
    label: t('import.amountColumn'),
    required: true,
    description: t('import.amountColumnDescription')
  },
  {
    field: 'cardColumn',
    label: t('import.cardColumn'),
    required: false,
    description: t('import.cardColumnDescription')
  },
  {
    field: 'categoryColumn',
    label: t('import.categoryColumn'),
    required: false,
    description: t('import.categoryColumnDescription')
  },
  {
    field: 'commentColumn',
    label: t('import.commentColumn'),
    required: false,
    description: t('import.commentColumnDescription')
  }
];

const DATE_FORMAT_OPTIONS = [
  { value: 'DD.MM.YYYY', label: 'DD.MM.YYYY (31.12.2024)' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (12/31/2024)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2024-12-31)' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (31/12/2024)' },
  { value: 'MM-DD-YYYY', label: 'MM-DD-YYYY (12-31-2024)' },
  { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY (31-12-2024)' }
];

export const ColumnMappingModal: React.FC<ColumnMappingModalProps> = ({
  visible,
  onDismiss,
  onConfirm,
  columns,
  sampleData,
  fileName,
  suggestedMapping
}) => {
  const { t } = useTranslation();
  const [mapping, setMapping] = useState<Partial<ImportMapping>>({
    dateFormat: 'DD.MM.YYYY',
    hasHeader: true,
    headerRowIndex: 0,
    ...suggestedMapping
  });
  
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [dateFormatMenuVisible, setDateFormatMenuVisible] = useState(false);

  useEffect(() => {
    if (suggestedMapping) {
      setMapping({
        dateFormat: 'DD.MM.YYYY',
        hasHeader: true,
        headerRowIndex: 0,
        ...suggestedMapping
      });
    }
  }, [suggestedMapping]);

  const handleFieldMapping = (field: keyof ImportMapping, columnName: string | null) => {
    setMapping(prev => ({
      ...prev,
      [field]: columnName
    }));
    setActiveMenu(null);
  };

  const fieldMappings = getFieldMappings(t);

  const handleConfirm = () => {
    const requiredFields = fieldMappings.filter(f => f.required);
    const isValid = requiredFields.every(field => mapping[field.field]);
    
    if (!isValid) {
      return; // Could show error message
    }

    onConfirm(mapping as ImportMapping);
  };

  const getColumnOptions = () => [
    { label: 'None', value: null },
    ...columns.map(col => ({ label: col, value: col }))
  ];

  const getPreviewData = () => {
    const startRow = mapping.hasHeader && mapping.headerRowIndex !== undefined 
      ? mapping.headerRowIndex + 1 
      : 0;
    return sampleData.slice(startRow, startRow + 3);
  };

  const isValid = fieldMappings
    .filter(f => f.required)
    .every(field => mapping[field.field]);

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modal}
      >
        <Surface style={styles.surface}>
          <ScrollView>
            {/* Header */}
            <View style={styles.header}>
              <Text variant="headlineSmall">{t('import.mapColumns')}</Text>
              <Text variant="bodyMedium" style={styles.subtitle}>
                {fileName}
              </Text>
            </View>

            <Divider style={styles.divider} />

            {/* Instructions */}
            <Card style={styles.instructionsCard}>
              <Card.Content>
                <Text variant="titleSmall" style={styles.instructionsTitle}>
                  📋 {t('import.instructions')}
                </Text>
                <Text variant="bodySmall" style={styles.instructionsText}>
                  {t('import.mappingDescription')}
                </Text>
              </Card.Content>
            </Card>

            {/* Header Settings */}
            <Card style={styles.settingsCard}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  {t('import.fileSettings')}
                </Text>
                
                <View style={styles.settingRow}>
                  <Text variant="bodyMedium">{t('import.hasHeaders')}</Text>
                  <Button
                    mode={mapping.hasHeader ? 'contained' : 'outlined'}
                    compact
                    onPress={() => setMapping(prev => ({ ...prev, hasHeader: !prev.hasHeader }))}
                  >
                    {mapping.hasHeader ? 'Yes' : 'No'}
                  </Button>
                </View>

                <View style={styles.settingRow}>
                  <Text variant="bodyMedium">{t('import.dateFormat')}</Text>
                  <Menu
                    visible={dateFormatMenuVisible}
                    onDismiss={() => setDateFormatMenuVisible(false)}
                    anchor={
                      <Button
                        mode="outlined"
                        compact
                        onPress={() => setDateFormatMenuVisible(true)}
                      >
                        {DATE_FORMAT_OPTIONS.find(opt => opt.value === mapping.dateFormat)?.label || 'Select'}
                      </Button>
                    }
                  >
                    {DATE_FORMAT_OPTIONS.map((option) => (
                      <Menu.Item
                        key={option.value}
                        title={option.label}
                        onPress={() => {
                          setMapping(prev => ({ ...prev, dateFormat: option.value as any }));
                          setDateFormatMenuVisible(false);
                        }}
                      />
                    ))}
                  </Menu>
                </View>
              </Card.Content>
            </Card>

            {/* Column Mapping */}
            <Card style={styles.mappingCard}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  {t('import.fieldMapping')}
                </Text>
                
{fieldMappings.map((fieldMapping) => (
                  <View key={fieldMapping.field} style={styles.mappingRow}>
                    <View style={styles.fieldInfo}>
                      <View style={styles.fieldHeader}>
                        <Text variant="bodyMedium" style={styles.fieldLabel}>
                          {fieldMapping.label}
                        </Text>
                        {fieldMapping.required && (
                          <Chip mode="outlined" compact style={styles.requiredChip}>
                            {t('import.required')}
                          </Chip>
                        )}
                      </View>
                      <Text variant="bodySmall" style={styles.fieldDescription}>
                        {fieldMapping.description}
                      </Text>
                    </View>
                    
                    <Menu
                      visible={activeMenu === fieldMapping.field}
                      onDismiss={() => setActiveMenu(null)}
                      anchor={
                        <Button
                          mode="outlined"
                          compact
                          onPress={() => setActiveMenu(fieldMapping.field)}
                          style={[
                            styles.columnButton,
                            !mapping[fieldMapping.field] && fieldMapping.required && styles.columnButtonError
                          ]}
                        >
{mapping[fieldMapping.field] || t('import.selectColumn')}
                        </Button>
                      }
                    >
                      {getColumnOptions().map((option) => (
                        <Menu.Item
                          key={option.value || 'none'}
                          title={option.label}
                          onPress={() => handleFieldMapping(fieldMapping.field, option.value)}
                        />
                      ))}
                    </Menu>
                  </View>
                ))}
              </Card.Content>
            </Card>

            {/* Preview */}
            <Card style={styles.previewCard}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  {t('import.sampleData')}
                </Text>
                
                <View style={styles.previewContainer}>
                  <DataTable>
                    {mapping.hasHeader && (
                      <DataTable.Header>
                        {columns.map((column, index) => (
                          <DataTable.Title key={index} style={styles.previewHeader}>
                            <Text variant="bodySmall" numberOfLines={1}>
                              {column}
                            </Text>
                          </DataTable.Title>
                        ))}
                      </DataTable.Header>
                    )}
                    
                    {getPreviewData().map((row, rowIndex) => (
                      <DataTable.Row key={rowIndex}>
                        {row.map((cell, cellIndex) => (
                          <DataTable.Cell key={cellIndex} style={styles.previewCell}>
                            <Text variant="bodySmall" numberOfLines={1}>
                              {cell || '—'}
                            </Text>
                          </DataTable.Cell>
                        ))}
                      </DataTable.Row>
                    ))}
                  </DataTable>
                </View>
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
              disabled={!isValid}
              style={[styles.actionButton, !isValid && styles.actionButtonDisabled]}
            >
              {t('import.confirmMapping')}
            </Button>
          </View>
        </Surface>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modal: {
    margin: theme.spacing.md,
    maxHeight: '90%',
  },
  surface: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    maxHeight: '100%',
  },
  header: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  subtitle: {
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  divider: {
    marginHorizontal: theme.spacing.lg,
  },
  instructionsCard: {
    margin: theme.spacing.lg,
    marginTop: theme.spacing.md,
  },
  instructionsTitle: {
    marginBottom: theme.spacing.sm,
    fontWeight: '600',
  },
  instructionsText: {
    lineHeight: 20,
    color: theme.colors.text.secondary,
  },
  settingsCard: {
    margin: theme.spacing.lg,
    marginTop: 0,
  },
  mappingCard: {
    margin: theme.spacing.lg,
    marginTop: 0,
  },
  previewCard: {
    margin: theme.spacing.lg,
    marginTop: 0,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    marginBottom: theme.spacing.md,
    fontWeight: '600',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  mappingRow: {
    marginBottom: theme.spacing.lg,
  },
  fieldInfo: {
    marginBottom: theme.spacing.sm,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  fieldLabel: {
    fontWeight: '500',
    flex: 1,
  },
  requiredChip: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FF9800',
  },
  fieldDescription: {
    color: theme.colors.text.secondary,
    lineHeight: 18,
  },
  columnButton: {
    alignSelf: 'flex-start',
  },
  columnButtonError: {
    borderColor: theme.colors.error,
  },
  previewContainer: {
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  previewHeader: {
    flex: 1,
  },
  previewCell: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
}); 