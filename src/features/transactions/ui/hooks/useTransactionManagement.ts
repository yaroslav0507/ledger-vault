import { useState, useCallback } from 'react';
import { useModal } from '../../../../shared/ui/hooks/useModal';
import { useImportFlow } from '../../../import/ui/hooks/useImportFlow';
import { Transaction } from '../../model/Transaction';

export const useTransactionManagement = () => {
  const addModal = useModal();
  const editModal = useModal();
  const archiveConfirmDialog = useModal();
  const importFlow = useImportFlow();
  
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [transactionToArchive, setTransactionToArchive] = useState<Transaction | null>(null);
  const [removingTransactionIds, setRemovingTransactionIds] = useState<Set<string>>(new Set());
  const [recentlyArchivedTransaction, setRecentlyArchivedTransaction] = useState<Transaction | null>(null);
  const [undoTimeoutId, setUndoTimeoutId] = useState<NodeJS.Timeout | null>(null);
  
  const openEditModal = useCallback((transaction: Transaction) => {
    setSelectedTransaction(transaction);
    editModal.open();
  }, [editModal]);
  
  const closeEditModal = useCallback(() => {
    editModal.close();
    setSelectedTransaction(null);
  }, [editModal]);
  
  const openArchiveConfirm = useCallback((transaction: Transaction) => {
    setTransactionToArchive(transaction);
    archiveConfirmDialog.open();
  }, [archiveConfirmDialog]);
  
  const closeArchiveConfirm = useCallback(() => {
    archiveConfirmDialog.close();
    setTimeout(() => {
      setTransactionToArchive(null);
    }, 300);
  }, [archiveConfirmDialog]);
  
  const addRemovingTransaction = useCallback((id: string) => {
    setRemovingTransactionIds(prev => new Set(prev).add(id));
  }, []);
  
  const removeRemovingTransaction = useCallback((id: string) => {
    setRemovingTransactionIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  }, []);
  
  const setRecentlyArchived = useCallback((transaction: Transaction | null) => {
    setRecentlyArchivedTransaction(transaction);
  }, []);
  
  const setUndoTimeout = useCallback((timeoutId: NodeJS.Timeout | null) => {
    if (undoTimeoutId) {
      clearTimeout(undoTimeoutId);
    }
    setUndoTimeoutId(timeoutId);
  }, [undoTimeoutId]);
  
  const clearUndoTimeout = useCallback(() => {
    if (undoTimeoutId) {
      clearTimeout(undoTimeoutId);
      setUndoTimeoutId(null);
    }
  }, [undoTimeoutId]);
  
  return {
    addModal,
    editModal: {
      ...editModal,
      open: openEditModal,
      close: closeEditModal
    },
    archiveConfirmDialog: {
      ...archiveConfirmDialog,
      open: openArchiveConfirm,
      close: closeArchiveConfirm
    },
    importFlow,
    selectedTransaction,
    transactionToArchive,
    removingTransactionIds,
    recentlyArchivedTransaction,
    undoTimeoutId,
    addRemovingTransaction,
    removeRemovingTransaction,
    setRecentlyArchived,
    setUndoTimeout,
    clearUndoTimeout
  };
}; 