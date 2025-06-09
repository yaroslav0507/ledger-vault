import { ImportStrategy, ImportFile, ImportResult, ImportMapping } from '../strategies/ImportStrategy';
import { XlsImportStrategy, FilePreview } from '../strategies/XlsImportStrategy';
import { transactionRepository } from '@/features/transactions/storage/TransactionRepository';
import { Transaction } from '@/features/transactions/model/Transaction';

export { FilePreview };

export class ImportService {
  private strategies: Map<string, ImportStrategy> = new Map();

  constructor() {
    // Register available import strategies
    const xlsStrategy = new XlsImportStrategy();
    xlsStrategy.getSupportedFormats().forEach(format => {
      this.strategies.set(format, xlsStrategy);
    });
  }

  getSupportedFormats(): string[] {
    return Array.from(this.strategies.keys());
  }

  validateFile(file: ImportFile): boolean {
    const strategy = this.strategies.get(file.type);
    return strategy ? strategy.validateFile(file) : false;
  }

  async extractFilePreview(file: ImportFile): Promise<FilePreview> {
    const strategy = this.strategies.get(file.type);
    if (!strategy) {
      throw new Error(`Unsupported file format: ${file.type}`);
    }

    // Get the XLS strategy to access its parsing methods
    if (strategy instanceof XlsImportStrategy) {
      return await strategy.extractPreview(file);
    }

    throw new Error('Preview extraction not supported for this file type');
  }

  async importFile(file: ImportFile, mapping?: ImportMapping): Promise<ImportResult> {
    const strategy = this.strategies.get(file.type);
    if (!strategy) {
      throw new Error(`Unsupported file format: ${file.type}`);
    }

    return await strategy.parse(file, mapping);
  }

  async saveTransactions(transactions: Transaction[], ignoreDuplicates = true): Promise<void> {
    const transactionsToSave = ignoreDuplicates 
      ? transactions.filter(t => !t.isDuplicate)
      : transactions;

    for (const transaction of transactionsToSave) {
      await transactionRepository.create(transaction);
    }
  }

  async previewImport(file: ImportFile, mapping?: ImportMapping): Promise<ImportResult> {
    // Same as import but don't save to database
    return await this.importFile(file, mapping);
  }

  getFileTypeFromName(fileName: string): 'xls' | 'xlsx' | 'csv' | null {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'xls':
      case 'xlsx':
      case 'csv':
        return extension;
      default:
        return null;
    }
  }

  async createImportFileFromBrowser(file: File): Promise<ImportFile> {
    const fileType = this.getFileTypeFromName(file.name);
    if (!fileType) {
      throw new Error(`Unsupported file type: ${file.name}`);
    }

    const arrayBuffer = await file.arrayBuffer();
    
    return {
      name: file.name,
      type: fileType,
      size: file.size,
      content: arrayBuffer
    };
  }
}

export const importService = new ImportService(); 