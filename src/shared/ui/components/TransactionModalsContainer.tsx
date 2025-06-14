import React from 'react';
import { Portal, Snackbar } from 'react-native-paper';
import { AddTransactionModal } from '@/features/transactions/ui/components/AddTransactionModal';
import { ImportPreviewModal } from '@/features/import/ui/components/ImportPreviewModal';
import { ColumnMappingModal } from '@/features/import/ui/components/ColumnMappingModal';
import { ConfirmationDialog } from '@/shared/ui/components';
import { UI_CONSTANTS } from '@/shared/constants/ui';
import { useTransactionStore } from '@/features/transactions/store/transactionStore';
import { useTransactionManagementContext } from '@/shared/contexts/TransactionManagementContext';
import { useTransactionActions } from '@/features/transactions/ui/hooks/useTransactionActions';
import { useTransactionCallbacks } from '@/features/transactions/ui/hooks/useTransactionCallbacks';
import { useSettingsStore } from '@/shared/store/settingsStore';
import { useMemo } from 'react';

export interface TransactionModalsContainerProps {
  // Minimal props - just what's needed for external control
  // All modal states are managed internally
}

export const TransactionModalsContainer: React.FC<TransactionModalsContainerProps> = () => {
  const { addTransaction } = useTransactionStore();
  const transactionManagement = useTransactionManagementContext();
  const confirmDeleteTransactions = useSettingsStore(state => state.confirmDeleteTransactions);

  const {
    handleTransactionPress,
    handleUpdateTransaction,
    handleImportConfirm,
    handleArchiveTransaction,
    handleUnarchiveTransaction,
    snackbarMessage,
    showSnackbar,
    setShowSnackbar,
    showMessage
  } = useTransactionActions(transactionManagement.editModal.open);

  const callbackDependencies = useMemo(() => ({
    transactionManagement,
    handleImportConfirm,
    handleArchiveTransaction,
    handleUnarchiveTransaction,
    showMessage,
    setShowSnackbar,
    confirmDeleteTransactions
  }), [
    transactionManagement,
    handleImportConfirm,
    handleArchiveTransaction,
    handleUnarchiveTransaction,
    showMessage,
    setShowSnackbar,
    confirmDeleteTransactions
  ]);

  const {
    handleFileSelect,
    handleImportConfirmLocal,
    handleColumnMappingConfirm,
    handleUndo,
    handleArchiveTransactionLocal,
    handleConfirmArchive
  } = useTransactionCallbacks(callbackDependencies);

  return (
    <Portal>
      <AddTransactionModal
        visible={transactionManagement.addModal.isOpen}
        onClose={transactionManagement.addModal.close}
        onSubmit={addTransaction}
      />

      <AddTransactionModal
        visible={transactionManagement.editModal.isOpen}
        onClose={transactionManagement.editModal.close}
        onSubmit={() => Promise.resolve()}
        onUpdate={handleUpdateTransaction}
        editMode={true}
        transactionToEdit={transactionManagement.selectedTransaction || undefined}
      />

      <ImportPreviewModal
        visible={transactionManagement.importFlow.importState.showModal}
        onDismiss={transactionManagement.importFlow.closeModal}
        onConfirm={(data) => handleImportConfirmLocal(data, false)}
        fileName={transactionManagement.importFlow.importState.fileName}
        result={transactionManagement.importFlow.importState.result}
        isLoading={transactionManagement.importFlow.importState.isLoading}
      />

      <ColumnMappingModal
        visible={transactionManagement.importFlow.importState.showColumnMapping}
        onDismiss={transactionManagement.importFlow.closeColumnMapping}
        onConfirm={handleColumnMappingConfirm}
        columns={transactionManagement.importFlow.importState.preview?.columns || []}
        sampleData={transactionManagement.importFlow.importState.preview?.sampleData || []}
        fileName={transactionManagement.importFlow.importState.fileName}
        suggestedMapping={transactionManagement.importFlow.importState.preview?.suggestedMapping}
      />

      {transactionManagement.archiveConfirmDialog.isOpen && (
        <ConfirmationDialog
          visible={transactionManagement.archiveConfirmDialog.isOpen}
          title="Archive Transaction"
          message={`Are you sure you want to archive "${transactionManagement.transactionToArchive?.description}"?`}
          confirmText="Archive"
          cancelText="Cancel"
          onConfirm={handleConfirmArchive}
          onCancel={transactionManagement.archiveConfirmDialog.close}
        />
      )}

      {showSnackbar && !!transactionManagement.recentlyArchivedTransaction && (
        <Snackbar
          visible={showSnackbar && !!transactionManagement.recentlyArchivedTransaction}
          onDismiss={() => setShowSnackbar(false)}
          duration={UI_CONSTANTS.TIMEOUTS.UNDO_TIMEOUT}
          action={{
            label: 'Undo',
            onPress: handleUndo,
          }}
        >
          {snackbarMessage}
        </Snackbar>
      )}
    </Portal>
  );
}; 