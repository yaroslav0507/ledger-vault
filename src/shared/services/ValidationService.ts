import { Transaction } from '../../features/transactions/model/Transaction';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface InvalidRow {
  row: any;
  errors: ValidationError[];
  index: number;
}

export interface ImportValidationResult {
  validRows: Transaction[];
  invalidRows: InvalidRow[];
}

export class ValidationService {
  static validateTransaction(transaction: Partial<Transaction>): ValidationResult {
    const errors: ValidationError[] = [];
    
    if (!transaction.amount || transaction.amount <= 0) {
      errors.push({ field: 'amount', message: 'Amount must be greater than 0' });
    }
    
    if (!transaction.description?.trim()) {
      errors.push({ field: 'description', message: 'Description is required' });
    }
    
    if (!transaction.category) {
      errors.push({ field: 'category', message: 'Category is required' });
    }
    
    if (transaction.date && typeof transaction.date === 'string') {
      const dateObj = new Date(transaction.date);
      if (isNaN(dateObj.getTime())) {
        errors.push({ field: 'date', message: 'Invalid date format' });
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  static validateImportData(data: Transaction[]): ImportValidationResult {
    const validRows: Transaction[] = [];
    const invalidRows: InvalidRow[] = [];
    
    data.forEach((row, index) => {
      const validation = this.validateTransaction(row);
      if (validation.isValid) {
        validRows.push(row);
      } else {
        invalidRows.push({ row, errors: validation.errors, index });
      }
    });
    
    return { validRows, invalidRows };
  }
} 