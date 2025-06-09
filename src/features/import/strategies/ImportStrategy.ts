import { Transaction } from '@/features/transactions/model/Transaction';

export interface ImportFile {
  name: string;
  type: 'xls' | 'xlsx' | 'csv';
  size: number;
  content: ArrayBuffer;
}

export interface ImportResult {
  transactions: Transaction[];
  duplicates: Transaction[];
  errors: ImportError[];
  summary: ImportSummary;
}

export interface ImportError {
  row: number;
  column: string;
  error: string;
  rawData: any;
}

export interface ImportSummary {
  totalRows: number;
  successfulImports: number;
  duplicatesFound: number;
  errorsCount: number;
  timeRange: {
    earliest: string;
    latest: string;
  };
}

export interface ImportMapping {
  dateColumn: string;
  amountColumn: string;
  descriptionColumn: string;
  cardColumn?: string;
  categoryColumn?: string;
  dateFormat: string;
  hasHeader: boolean;
}

export interface ImportStrategy {
  parse(file: ImportFile, mapping?: ImportMapping): Promise<ImportResult>;
  validateFile(file: ImportFile): boolean;
  getSupportedFormats(): string[];
} 