import { read, utils, WorkBook } from 'xlsx';
import { v4 as uuidv4 } from 'uuid';
import { Transaction, DEFAULT_CATEGORIES } from '@/features/transactions/model/Transaction';
import { transactionRepository } from '@/features/transactions/storage/TransactionRepository';
import { parseCurrencyToSmallestUnit } from '@/shared/utils/currencyUtils';
import { format } from 'date-fns';
import { ImportStrategy, ImportFile, ImportResult, ImportMapping, ImportError } from './ImportStrategy';

export class XlsImportStrategy implements ImportStrategy {
  
  getSupportedFormats(): string[] {
    return ['xls', 'xlsx'];
  }

  validateFile(file: ImportFile): boolean {
    return this.getSupportedFormats().includes(file.type);
  }

  async parse(file: ImportFile, mapping?: ImportMapping): Promise<ImportResult> {
    if (!this.validateFile(file)) {
      throw new Error(`Unsupported file format: ${file.type}`);
    }

    try {
      // Parse the Excel file
      const workbook: WorkBook = read(file.content, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON
      const rawData = utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      
      // Use default mapping or provided mapping
      const columnMapping = mapping || this.detectColumnMapping(rawData);
      
      // Parse transactions
      const result = await this.parseTransactions(rawData, columnMapping, file.name);
      
      return result;
    } catch (error) {
      console.error('Failed to parse Excel file:', error);
      throw new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private detectColumnMapping(data: any[][]): ImportMapping {
    if (data.length === 0) {
      throw new Error('Empty file');
    }

    const header = data[0] as string[];
    
    // Common column names for bank statements
    const dateColumns = ['date', 'transaction date', 'posting date', 'value date', 'fecha'];
    const amountColumns = ['amount', 'value', 'balance', 'debit', 'credit', 'importe', 'cantidad'];
    const descriptionColumns = ['description', 'narrative', 'details', 'reference', 'memo', 'descripcion'];
    
    const findColumn = (patterns: string[], headers: string[]): string => {
      const lowerHeaders = headers.map(h => String(h).toLowerCase());
      for (const pattern of patterns) {
        const index = lowerHeaders.findIndex(h => h.includes(pattern));
        if (index !== -1) return String(headers[index]);
      }
      return String(headers[0] || ''); // Fallback to first column
    };

    return {
      dateColumn: findColumn(dateColumns, header),
      amountColumn: findColumn(amountColumns, header),
      descriptionColumn: findColumn(descriptionColumns, header),
      dateFormat: 'auto',
      hasHeader: true
    };
  }

  private async parseTransactions(data: any[][], mapping: ImportMapping, fileName: string): Promise<ImportResult> {
    const transactions: Transaction[] = [];
    const errors: ImportError[] = [];
    const duplicates: Transaction[] = [];
    
    // Skip header if present
    const startRow = mapping.hasHeader ? 1 : 0;
    const dataRows = data.slice(startRow) as any[][];
    
    // Get column indices
    const header = mapping.hasHeader ? (data[0] as string[]) : [];
    const dateIndex = this.getColumnIndex(header, mapping.dateColumn);
    const amountIndex = this.getColumnIndex(header, mapping.amountColumn);
    const descriptionIndex = this.getColumnIndex(header, mapping.descriptionColumn);
    
    let earliestDate = '';
    let latestDate = '';

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowNumber = startRow + i + 1;
      
      try {
        // Extract values
        const rawDate = row[dateIndex];
        const rawAmount = row[amountIndex];
        const rawDescription = row[descriptionIndex];
        
        // Skip empty rows
        if (!rawDate && !rawAmount && !rawDescription) continue;
        
        // Parse date
        const parsedDate = this.parseDate(rawDate);
        if (!parsedDate) {
          errors.push({
            row: rowNumber,
            column: mapping.dateColumn,
            error: `Invalid date: ${rawDate}`,
            rawData: row
          });
          continue;
        }
        
        // Parse amount
        const parsedAmount = this.parseAmount(rawAmount);
        if (parsedAmount === null) {
          errors.push({
            row: rowNumber,
            column: mapping.amountColumn,
            error: `Invalid amount: ${rawAmount}`,
            rawData: row
          });
          continue;
        }
        
        // Parse description
        const description = String(rawDescription || 'Imported transaction').trim();
        
        // Determine if it's income (positive amount) or expense (negative amount)
        const isIncome = parsedAmount >= 0;
        const absoluteAmount = Math.abs(parsedAmount);
        
        // Create transaction
        const transaction: Transaction = {
          id: uuidv4(),
          date: parsedDate,
          card: this.extractCardFromFileName(fileName),
          amount: parseCurrencyToSmallestUnit(absoluteAmount),
          currency: 'USD',
          originalDescription: description,
          description: this.cleanDescription(description),
          category: this.guessCategory(description),
          isDuplicate: false,
          isIncome,
          metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            importedAt: new Date().toISOString(),
            importBatchId: uuidv4(),
            aiEnriched: false,
            version: 1,
            source: 'import'
          }
        };
        
        // Check for duplicates
        const potentialDuplicates = await transactionRepository.findPotentialDuplicates(transaction);
        if (potentialDuplicates.length > 0) {
          transaction.isDuplicate = true;
          duplicates.push(transaction);
        }
        
        transactions.push(transaction);
        
        // Track date range
        if (!earliestDate || parsedDate < earliestDate) earliestDate = parsedDate;
        if (!latestDate || parsedDate > latestDate) latestDate = parsedDate;
        
      } catch (error) {
        errors.push({
          row: rowNumber,
          column: 'general',
          error: error instanceof Error ? error.message : 'Unknown parsing error',
          rawData: row
        });
      }
    }
    
    return {
      transactions,
      duplicates,
      errors,
      summary: {
        totalRows: dataRows.length,
        successfulImports: transactions.length,
        duplicatesFound: duplicates.length,
        errorsCount: errors.length,
        timeRange: {
          earliest: earliestDate,
          latest: latestDate
        }
      }
    };
  }
  
  private getColumnIndex(header: string[], columnName: string): number {
    if (!header.length) return 0; // No header, use first column
    const index = header.indexOf(columnName);
    return index >= 0 ? index : 0;
  }
  
  private parseDate(value: any): string | null {
    if (!value) return null;
    
    try {
      let date: Date;
      
      if (typeof value === 'number') {
        // Excel date serial number
        date = new Date((value - 25569) * 86400 * 1000);
      } else if (typeof value === 'string') {
        // Try to parse string date
        date = new Date(value);
      } else {
        return null;
      }
      
      if (isNaN(date.getTime())) return null;
      
      return format(date, 'yyyy-MM-dd');
    } catch {
      return null;
    }
  }
  
  private parseAmount(value: any): number | null {
    if (value === null || value === undefined || value === '') return null;
    
    if (typeof value === 'number') return value;
    
    if (typeof value === 'string') {
      // Remove currency symbols and commas
      const cleaned = value.replace(/[£$€,\s]/g, '');
      const number = parseFloat(cleaned);
      return isNaN(number) ? null : number;
    }
    
    return null;
  }
  
  private extractCardFromFileName(fileName: string): string {
    // Try to extract bank/card name from filename
    const name = fileName.replace(/\.(xlsx?|csv)$/i, '');
    const parts = name.split(/[-_\s]/);
    
    // Common bank names
    const bankNames = ['monzo', 'santander', 'chase', 'amex', 'barclays', 'hsbc', 'natwest', 'lloyds'];
    
    for (const part of parts) {
      const lowerPart = part.toLowerCase();
      if (bankNames.includes(lowerPart)) {
        return part;
      }
    }
    
    return parts[0] || 'Imported';
  }
  
  private cleanDescription(description: string): string {
    // Remove common bank statement prefixes/suffixes
    let cleaned = description
      .replace(/^(POS|ATM|DIR|TFR|DD|SO|CHQ|FEE|INT)\s+/i, '')
      .replace(/\s+\d{2}\/\d{2}\/\d{4}$/, '') // Remove trailing dates
      .replace(/\s+\d{2}\/\d{2}$/, '') // Remove trailing dates
      .trim();
    
    // Capitalize first letter
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }
  
  private guessCategory(description: string): string {
    const desc = description.toLowerCase();
    
    // Category mapping based on keywords
    const categoryMap: { [key: string]: string[] } = {
      'food & dining': ['restaurant', 'cafe', 'coffee', 'pizza', 'burger', 'food', 'dining', 'starbucks', 'mcdonalds', 'subway'],
      'transportation': ['uber', 'lyft', 'taxi', 'bus', 'train', 'metro', 'parking', 'fuel', 'petrol', 'gas station'],
      'shopping': ['amazon', 'ebay', 'store', 'shop', 'retail', 'mall', 'target', 'walmart'],
      'bills & utilities': ['electric', 'gas', 'water', 'internet', 'phone', 'utility', 'bill', 'payment'],
      'healthcare': ['hospital', 'doctor', 'pharmacy', 'medical', 'health', 'dentist'],
      'entertainment': ['cinema', 'movie', 'netflix', 'spotify', 'game', 'entertainment'],
      'income': ['salary', 'wage', 'payment', 'refund', 'cashback', 'interest'],
    };
    
    for (const [category, keywords] of Object.entries(categoryMap)) {
      if (keywords.some((keyword: string) => desc.includes(keyword))) {
        return category;
      }
    }
    
    return DEFAULT_CATEGORIES[8]; // 'Other'
  }
} 