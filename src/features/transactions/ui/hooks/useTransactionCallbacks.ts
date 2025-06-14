import { useCallback } from 'react';
import { Transaction } from '../../model/Transaction';
import { ImportMapping } from '../../../import/strategies/ImportStrategy';
import { importService } from '../../../import/service/ImportService';
import { TransformationService } from '../../../../shared/services/TransformationService';
import { ValidationService } from '../../../../shared/services/ValidationService';
import { ErrorHandlingService } from '../../../../shared/services/ErrorHandlingService';
import { UI_CONSTANTS } from '../../../../shared/constants/ui';

interface CallbackDependencies {
  transactionManagement: any;
  handleImportConfirm: (transactions: Transaction[], ignoreDuplicates: boolean) => Promise<boolean>;
  handleArchiveTransaction: (id: string) => Promise<void>;
  handleUnarchiveTransaction: (id: string) => Promise<void>;
  showMessage: (message: string) => void;
  setShowSnackbar: (show: boolean) => void;
  confirmDeleteTransactions: boolean;
}

export const useTransactionCallbacks = (deps: CallbackDependencies) => {
  const {
    transactionManagement,
    handleImportConfirm,
    handleArchiveTransaction,
    handleUnarchiveTransaction,
    showMessage,
    setShowSnackbar,
    confirmDeleteTransactions
  } = deps;

  const handleFileSelect = useCallback(async (file: File) => {
    transactionManagement.importFlow.setLoading(true);
    
    await ErrorHandlingService.handleAsyncError(async () => {
      const importFile = await importService.createImportFileFromBrowser(file);
      const preview = await importService.extractFilePreview(importFile);
      transactionManagement.importFlow.setFileData(file, file.name, preview);
    }, {
      operation: 'File Preview',
      userMessage: 'Failed to preview the file'
    });
    
    transactionManagement.importFlow.setLoading(false);
  }, [transactionManagement.importFlow]);

  const handleImportConfirmLocal = useCallback(async (transactions: Transaction[], ignoreDuplicates: boolean) => {
    await ErrorHandlingService.handleAsyncError(async () => {
      await handleImportConfirm(transactions, ignoreDuplicates);
      transactionManagement.importFlow.closeModal();
    }, {
      operation: 'Import',
      userMessage: 'Failed to import transactions'
    });
  }, [handleImportConfirm, transactionManagement.importFlow]);

  const handleColumnMappingConfirm = useCallback(async (mapping: ImportMapping) => {
    if (!transactionManagement.importFlow.importState.selectedFile || !transactionManagement.importFlow.importState.preview) {
      return;
    }

    transactionManagement.importFlow.setLoading(true);
    
    await ErrorHandlingService.handleAsyncError(async () => {
      const importFile = await importService.createImportFileFromBrowser(transactionManagement.importFlow.importState.selectedFile);
      const result = await importService.previewImport(importFile, mapping);
      
      const normalizedData = TransformationService.normalizeTransactionData(result.transactions);
      const validationResult = ValidationService.validateImportData(normalizedData);
      
      transactionManagement.importFlow.setImportResult({
        ...result,
        transactions: validationResult.validRows as Transaction[],
        errors: validationResult.invalidRows.map(row => ({
          row: row.index,
          column: 'validation',
          error: row.errors.map(e => e.message).join(', '),
          rawData: row.row
        }))
      });
      
      transactionManagement.importFlow.closeColumnMapping();
    }, {
      operation: 'Column Mapping',
      userMessage: 'Failed to process the file with your mapping'
    });
    
    transactionManagement.importFlow.setLoading(false);
  }, [transactionManagement.importFlow]);

  const handleUndo = useCallback(async () => {
    if (!transactionManagement.recentlyArchivedTransaction) return;
    
    await ErrorHandlingService.handleAsyncError(async () => {
      transactionManagement.clearUndoTimeout();
      await handleUnarchiveTransaction(transactionManagement.recentlyArchivedTransaction.id);
      transactionManagement.setRecentlyArchived(null);
      setShowSnackbar(false);
    }, {
      operation: 'Undo Archive',
      userMessage: 'Failed to restore transaction'
    });
  }, [transactionManagement, handleUnarchiveTransaction, setShowSnackbar]);

  const archiveWithAnimation = useCallback(async (transaction: Transaction) => {
    transactionManagement.addRemovingTransaction(transaction.id);
    
    setTimeout(async () => {
      await ErrorHandlingService.handleAsyncError(async () => {
        await handleArchiveTransaction(transaction.id);
        showMessage(`Transaction "${transaction.description}" archived successfully`);
        transactionManagement.setRecentlyArchived(transaction);
        
        const timeoutId = setTimeout(() => {
          transactionManagement.setRecentlyArchived(null);
        }, UI_CONSTANTS.TIMEOUTS.UNDO_TIMEOUT);
        transactionManagement.setUndoTimeout(timeoutId);
      }, {
        operation: 'Archive Transaction',
        userMessage: 'Failed to archive transaction'
      });
      
      transactionManagement.removeRemovingTransaction(transaction.id);
    }, UI_CONSTANTS.TIMEOUTS.ANIMATION_DELAY);
  }, [transactionManagement, handleArchiveTransaction, showMessage]);

  const handleArchiveTransactionLocal = useCallback(async (transaction: Transaction) => {
    if (confirmDeleteTransactions) {
      transactionManagement.archiveConfirmDialog.open(transaction);
      return;
    }
    archiveWithAnimation(transaction);
  }, [confirmDeleteTransactions, transactionManagement.archiveConfirmDialog, archiveWithAnimation]);

  const handleConfirmArchive = useCallback(() => {
    if (transactionManagement.transactionToArchive) {
      archiveWithAnimation(transactionManagement.transactionToArchive);
    }
    transactionManagement.archiveConfirmDialog.close();
  }, [transactionManagement, archiveWithAnimation]);

  return {
    handleFileSelect,
    handleImportConfirmLocal,
    handleColumnMappingConfirm,
    handleUndo,
    handleArchiveTransactionLocal,
    handleConfirmArchive
  };
}; 