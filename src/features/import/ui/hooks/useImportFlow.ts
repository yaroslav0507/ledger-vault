import { useState, useCallback } from 'react';
import { ImportResult, ImportMapping } from '../../strategies/ImportStrategy';
import { FilePreview } from '../../service/ImportService';

interface ImportState {
  showModal: boolean;
  showColumnMapping: boolean;
  isLoading: boolean;
  fileName: string;
  selectedFile: File | null;
  result: ImportResult | null;
  preview: FilePreview | null;
}

const initialImportState: ImportState = {
  showModal: false,
  showColumnMapping: false,
  isLoading: false,
  fileName: '',
  selectedFile: null,
  result: null,
  preview: null,
};

export const useImportFlow = () => {
  const [importState, setImportState] = useState<ImportState>(initialImportState);
  
  const openModal = useCallback(() => {
    setImportState(prev => ({ ...prev, showModal: true }));
  }, []);
  
  const closeModal = useCallback(() => {
    setImportState(prev => ({
      ...prev,
      showModal: false,
      result: null,
      isLoading: false
    }));
  }, []);
  
  const setLoading = useCallback((loading: boolean) => {
    setImportState(prev => ({ ...prev, isLoading: loading }));
  }, []);
  
  const setFileData = useCallback((file: File, fileName: string, preview: FilePreview) => {
    setImportState(prev => ({
      ...prev,
      selectedFile: file,
      fileName,
      preview,
      showColumnMapping: true
    }));
  }, []);
  
  const setImportResult = useCallback((result: ImportResult) => {
    setImportState(prev => ({ 
      ...prev, 
      result, 
      showModal: true 
    }));
  }, []);
  
  const openColumnMapping = useCallback(() => {
    setImportState(prev => ({ ...prev, showColumnMapping: true }));
  }, []);
  
  const closeColumnMapping = useCallback(() => {
    setImportState(prev => ({
      ...prev,
      showColumnMapping: false,
    }));
  }, []);
  
  const reset = useCallback(() => {
    setImportState(initialImportState);
  }, []);
  
  return {
    importState,
    openModal,
    closeModal,
    setLoading,
    setFileData,
    setImportResult,
    openColumnMapping,
    closeColumnMapping,
    reset,
    updateImportState: setImportState
  };
}; 