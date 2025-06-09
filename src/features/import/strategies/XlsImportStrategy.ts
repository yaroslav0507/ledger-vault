import { read, utils, WorkBook } from 'xlsx';
import { v4 as uuidv4 } from 'uuid';
import { Transaction, DEFAULT_CATEGORIES } from '@/features/transactions/model/Transaction';
import { transactionRepository } from '@/features/transactions/storage/TransactionRepository';
import { 
  parseCurrencyToSmallestUnit, 
  detectCurrencyFromText, 
  addCurrencySupport,
  isSupportedCurrency,
  SUPPORTED_CURRENCIES 
} from '@/shared/utils/currencyUtils';
import { format } from 'date-fns';
import { ImportStrategy, ImportFile, ImportResult, ImportMapping, ImportError } from './ImportStrategy';

export interface FilePreview {
  columns: string[];
  sampleData: string[][];
  suggestedMapping?: Partial<ImportMapping>;
}

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
      const workbook: WorkBook = read(file.content, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      const rawData = utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      
      const columnMapping = mapping || await this.detectColumnMapping(rawData);
      
      const result = await this.parseTransactions(rawData, columnMapping, file.name);
      
      return result;
    } catch (error) {
      console.error('Failed to parse Excel file:', error);
      throw new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async extractPreview(file: ImportFile): Promise<FilePreview> {
    if (!this.validateFile(file)) {
      throw new Error(`Unsupported file format: ${file.type}`);
    }

    try {
      const workbook: WorkBook = read(file.content, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      const rawData = utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      
      if (rawData.length === 0) {
        throw new Error('Empty file');
      }

      // Find potential header row
      let headerRowIndex = 0;
      let columns: string[] = [];
      
      for (let i = 0; i < Math.min(rawData.length, 10); i++) {
        const row = rawData[i] as string[];
        if (this.hasValidColumnStructure(row)) {
          columns = this.extractColumnNames(row).filter(col => col.trim());
          headerRowIndex = i;
          break;
        }
      }

      // Fallback to first non-empty row
      if (columns.length === 0) {
        for (let i = 0; i < Math.min(rawData.length, 5); i++) {
          const row = rawData[i] as string[];
          if (row.some(cell => String(cell).trim())) {
            columns = row.map((cell, index) => 
              String(cell).trim() || `Column ${index + 1}`
            );
            headerRowIndex = i;
            break;
          }
        }
      }

      if (columns.length === 0) {
        throw new Error('Unable to detect columns in file');
      }

      // Get sample data (excluding header)
      const sampleData: string[][] = [];
      const startRow = headerRowIndex + 1;
      const maxSamples = Math.min(5, rawData.length - startRow);
      
      for (let i = 0; i < maxSamples; i++) {
        const row = rawData[startRow + i] as any[];
        if (row && row.some(cell => String(cell).trim())) {
          sampleData.push(
            columns.map((_, colIndex) => 
              String(row[colIndex] || '').trim()
            )
          );
        }
      }

      // Generate suggested mapping
      const suggestedMapping = this.detectColumnTypes(columns);

      return {
        columns,
        sampleData,
        suggestedMapping: {
          dateColumn: suggestedMapping.dateColumn || undefined,
          amountColumn: suggestedMapping.amountColumn || undefined,
          descriptionColumn: suggestedMapping.descriptionColumn || undefined,
          cardColumn: undefined,
          categoryColumn: undefined,
          commentColumn: suggestedMapping.commentColumn,
          dateFormat: 'DD.MM.YYYY' as any,
          hasHeader: true,
          headerRowIndex
        }
      };
    } catch (error) {
      console.error('Failed to extract preview from Excel file:', error);
      throw new Error(`Failed to extract preview: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async detectColumnMapping(data: any[][]): Promise<ImportMapping> {
    if (data.length === 0) {
      throw new Error('Empty file');
    }

    // Find the header row by analyzing document structure
    let headerRowIndex = 0;
    let header: string[] = [];
    let skippedRows: string[] = [];
    
    // Enhanced header detection - scan more rows and identify patterns
    for (let i = 0; i < Math.min(data.length, 20); i++) {
      const row = data[i] as string[];
      
      // Skip clearly non-header rows
      if (this.isDocumentInfoRow(row)) {
        skippedRows.push(`Row ${i + 1}: Document info/metadata`);
        continue;
      }
      
      // Check for valid column structure
      if (this.hasValidColumnStructure(row)) {
        header = this.extractColumnNames(row);
        headerRowIndex = i;
        
        // If we found multiple potential header rows, choose the most comprehensive one
        if (header.length >= 4) {
          break;
        }
      } else if (row.some(cell => String(cell).trim())) {
        skippedRows.push(`Row ${i + 1}: Insufficient column structure`);
      }
    }
    
    // Enhanced fallback logic with better validation
    if (header.length === 0) {
      for (let i = 0; i < Math.min(data.length, 15); i++) {
        const row = data[i] as string[];
        if (row.some(cell => String(cell).trim()) && row.length >= 3) {
          header = this.extractColumnNames(row);
          headerRowIndex = i;
          skippedRows.push(`Row ${i + 1}: Used as fallback header`);
          break;
        }
      }
    }
    
    if (header.length < 2) {
      const skipInfo = skippedRows.length > 0 ? ` (Skipped: ${skippedRows.join(', ')})` : '';
      throw new Error(`Unable to detect valid columns. Please ensure the file has proper headers.${skipInfo}`);
    }
    
    console.log(`📋 Found header row at index ${headerRowIndex}:`, header);
    if (skippedRows.length > 0) {
      console.log(`📋 Skipped rows: ${skippedRows.join(', ')}`);
    }
    
    // Detect column mappings using improved heuristics
    const mapping = this.detectColumnTypes(header);
    
    // Validate required columns are found
    if (!mapping.dateColumn && !mapping.amountColumn) {
      throw new Error('Unable to detect date and amount columns. Please check file format.');
    }
    
    return {
      dateColumn: mapping.dateColumn || this.findFallbackColumn(header, ['date', 'дата', 'datum', 'fecha', 'data']),
      amountColumn: mapping.amountColumn || this.findFallbackColumn(header, ['amount', 'сума', 'сумма', 'balance', 'betrag', 'montant']),
      descriptionColumn: mapping.descriptionColumn || this.findFallbackColumn(header, ['description', 'опис', 'описание', 'details', 'narrative']),
      commentColumn: mapping.commentColumn,
      dateFormat: 'auto',
      hasHeader: true,
      headerRowIndex,
      skippedInfo: skippedRows
    };
  }

  private findFallbackColumn(headers: string[], keywords: string[]): string {
    for (const keyword of keywords) {
      const found = headers.find(h => h.toLowerCase().includes(keyword.toLowerCase()));
      if (found) return found;
    }
    return headers[0] || '';
  }

  private extractColumnNames(row: any[]): string[] {
    return row.map(cell => {
      const str = String(cell || '').trim();
      
      // Skip document titles and very long text
      if (str.length > 60 || str.includes('Виписка з Ваших карток')) {
        return '';
      }
      
      // Clean up complex headers but preserve meaningful content
      if (str.includes('період') || str.includes('операці')) {
        const meaningfulWords = str.split(/\s+/).filter(word => 
          /^(дата|сума|опис|баланс|валюта|date|amount|description|balance|currency)$/i.test(word)
        );
        if (meaningfulWords.length > 0) {
          return meaningfulWords[0];
        }
      }
      
      return str;
    });
  }

  private hasValidColumnStructure(headers: string[]): boolean {
    const nonEmpty = headers.filter(h => String(h).trim()).length;
    if (nonEmpty < 2) return false;
    
    const headerText = headers.join(' ').toLowerCase();
    const hasDateColumn = /дата|date|time|час|posting|datum|fecha|data/i.test(headerText);
    const hasAmountColumn = /сума|сумма|amount|value|баланс|betrag|montant|importe|kwota/i.test(headerText);
    const hasDescColumn = /опис|описание|description|details|narrative|memo|reference/i.test(headerText);
    
    // Require at least date + amount or all three main columns
    return (hasDateColumn && hasAmountColumn) || 
           [hasDateColumn, hasAmountColumn, hasDescColumn].filter(Boolean).length >= 2;
  }

  private detectColumnTypes(headers: string[]): {
    dateColumn: string | null;
    amountColumn: string | null;
    descriptionColumn: string | null;
    commentColumn: string | undefined;
  } {
    const analysis = headers.map((header, index) => {
      const h = header.toLowerCase().trim();
      
      return {
        index,
        header: header,
        dateScore: this.calculateDateScore(h),
        amountScore: this.calculateAmountScore(h),
        descriptionScore: this.calculateDescriptionScore(h),
        commentScore: this.calculateCommentScore(h)
      };
    });
    
    // Find best matches with improved thresholds
    const dateColumn = this.findBestMatch(analysis, 'dateScore', 0.4);
    const amountColumn = this.findBestMatch(analysis, 'amountScore', 0.4);
    const descriptionColumn = this.findBestMatch(analysis, 'descriptionScore', 0.3);
    const commentColumn = this.findBestMatch(analysis, 'commentScore', 0.3);

    return {
      dateColumn,
      amountColumn,
      descriptionColumn,
      commentColumn: commentColumn || undefined
    };
  }

  private findBestMatch(analysis: any[], scoreKey: string, minScore: number): string | null {
    const sorted = analysis.sort((a, b) => b[scoreKey] - a[scoreKey]);
    return sorted[0]?.[scoreKey] > minScore ? sorted[0].header : null;
  }

  private calculateDateScore(header: string): number {
    const dateKeywords = [
      { word: 'дата', score: 1.0 },
      { word: 'date', score: 1.0 },
      { word: 'time', score: 0.8 },
      { word: 'час', score: 0.8 },
      { word: 'posting', score: 0.9 },
      { word: 'операції', score: 0.8 },
      { word: 'проведения', score: 0.9 },
      { word: 'transaction', score: 0.9 },
      { word: 'datum', score: 1.0 },
      { word: 'fecha', score: 1.0 },
      { word: 'data', score: 0.9 },
      { word: 'when', score: 0.7 }
    ];
    
    let score = 0;
    for (const keyword of dateKeywords) {
      if (header.includes(keyword.word)) {
        score = Math.max(score, keyword.score);
      }
    }
    
    // Boost score for date-like patterns
    if (/\d{2}[\/\.-]\d{2}[\/\.-]\d{4}/.test(header)) score += 0.5;
    if (/^(created|posted|processed)/.test(header)) score += 0.3;
    
    return Math.min(score, 1.0);
  }

  private calculateAmountScore(header: string): number {
    const amountKeywords = [
      { word: 'сума', score: 1.0 },
      { word: 'сумма', score: 1.0 },
      { word: 'amount', score: 1.0 },
      { word: 'value', score: 0.9 },
      { word: 'баланс', score: 0.8 },
      { word: 'дебет', score: 0.9 },
      { word: 'кредит', score: 0.9 },
      { word: 'credit', score: 0.9 },
      { word: 'debit', score: 0.9 },
      { word: 'betrag', score: 1.0 },
      { word: 'montant', score: 1.0 },
      { word: 'importe', score: 1.0 },
      { word: 'kwota', score: 1.0 },
      { word: 'total', score: 0.8 },
      { word: 'sum', score: 0.8 }
    ];
    
    let score = 0;
    for (const keyword of amountKeywords) {
      if (header.includes(keyword.word)) {
        score = Math.max(score, keyword.score);
      }
    }
    
    // Boost score for currency symbols and patterns
    if (/[$€£¥₽₴]/.test(header)) score += 0.3;
    if (/\d+[.,]\d{2}/.test(header)) score += 0.2;
    
    return Math.min(score, 1.0);
  }

  private calculateDescriptionScore(header: string): number {
    const descriptionKeywords = [
      { word: 'опис', score: 1.0 },
      { word: 'описание', score: 1.0 },
      { word: 'description', score: 1.0 },
      { word: 'narrative', score: 0.9 },
      { word: 'details', score: 0.9 },
      { word: 'reference', score: 0.8 },
      { word: 'memo', score: 0.9 },
      { word: 'призначення', score: 0.9 },
      { word: 'назначение', score: 0.9 },
      { word: 'purpose', score: 0.9 },
      { word: 'merchant', score: 0.8 },
      { word: 'payee', score: 0.8 },
      { word: 'beschreibung', score: 1.0 },
      { word: 'libellé', score: 0.9 },
      { word: 'descripción', score: 1.0 },
      { word: 'transaction', score: 0.7 }
    ];
    
    let score = 0;
    for (const keyword of descriptionKeywords) {
      if (header.includes(keyword.word)) {
        score = Math.max(score, keyword.score);
      }
    }
    
    return Math.min(score, 1.0);
  }

  private calculateCommentScore(header: string): number {
    const commentKeywords = [
      { word: 'коментар', score: 1.0 },
      { word: 'комментарий', score: 1.0 },
      { word: 'comment', score: 1.0 },
      { word: 'note', score: 0.9 },
      { word: 'notes', score: 0.9 },
      { word: 'remarks', score: 0.8 },
      { word: 'примітк', score: 0.9 },
      { word: 'заметк', score: 0.9 },
      { word: 'additional', score: 0.7 },
      { word: 'extra', score: 0.6 }
    ];
    
    let score = 0;
    for (const keyword of commentKeywords) {
      if (header.includes(keyword.word)) {
        score = Math.max(score, keyword.score);
      }
    }
    
    return Math.min(score, 1.0);
  }

  private async parseTransactions(data: any[][], mapping: ImportMapping, fileName: string): Promise<ImportResult> {
    const transactions: Transaction[] = [];
    const errors: ImportError[] = [];
    const duplicates: Transaction[] = [];
    
    const dataRows = mapping.hasHeader ? data.slice(1) : data;
    
    let earliestDate = '';
    let latestDate = '';
    
    // Improved currency detection with proper fallback
    const allText = data.flat().map(cell => String(cell || '')).join(' ');
    const detectedCurrency = this.detectDocumentCurrency(allText, fileName);

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowNumber = mapping.hasHeader ? i + 2 : i + 1;
      
      try {
        // Skip non-transaction rows more effectively
        if (this.isHeaderRow(row) || this.isDocumentInfoRow(row)) continue;
        
        // Extract values with better error handling
        const headerRow = mapping.hasHeader ? data[0] || [] : [];
        const rawDate = row[this.getColumnIndex(headerRow, mapping.dateColumn)];
        const rawAmount = row[this.getColumnIndex(headerRow, mapping.amountColumn)];
        const rawDescription = row[this.getColumnIndex(headerRow, mapping.descriptionColumn)];
        const rawComment = mapping.commentColumn ? 
          row[this.getColumnIndex(headerRow, mapping.commentColumn)] : null;
        
        // Skip empty or invalid rows
        if (!rawDate && !rawAmount && !rawDescription) continue;
        
        // Parse date with enhanced validation
        const parsedDate = this.parseDate(rawDate);
        if (!parsedDate) {
          errors.push({
            row: rowNumber,
            column: mapping.dateColumn,
            error: `Invalid date format: ${rawDate}`,
            rawData: row
          });
          continue;
        }
        
        // Parse amount with better negative number handling
        const parsedAmount = this.parseAmount(rawAmount);
        if (parsedAmount === null || isNaN(parsedAmount)) {
          errors.push({
            row: rowNumber,
            column: mapping.amountColumn,
            error: `Invalid amount format: ${rawAmount}`,
            rawData: row
          });
          continue;
        }
        
        // Enhanced description and comment handling
        const description = this.extractDescription(rawDescription);
        const comment = this.extractComment(rawComment, rawDescription, description);
        
        // Improved transaction type detection
        const isIncome = this.determineTransactionType(rawAmount, parsedAmount);
        const absoluteAmount = Math.abs(parsedAmount);
        
        // Use default category instead of guessing - let users categorize themselves
        const category = DEFAULT_CATEGORIES[8]; // 'Other' - don't guess, use existing data
        
        // Create transaction with validation
        const transaction: Transaction = {
          id: uuidv4(),
          date: parsedDate,
          card: this.extractCardFromFileName(fileName),
          amount: parseCurrencyToSmallestUnit(absoluteAmount, detectedCurrency),
          currency: detectedCurrency,
          originalDescription: String(rawDescription || '').trim(),
          description: description,
          category: category,
          comment: comment || undefined,
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
        
        // Enhanced duplicate detection
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
        const errorMessage = error instanceof Error ? error.message : 'Unknown parsing error';
        errors.push({
          row: rowNumber,
          column: 'general',
          error: `Row parsing failed: ${errorMessage}`,
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

  private extractDescription(rawDescription: any): string {
    const desc = String(rawDescription || 'Imported transaction').trim();
    if (!desc || desc.length === 0) {
      return 'Imported transaction';
    }
    return this.cleanDescription(desc);
  }

  private extractComment(rawComment: any, rawDescription: any, cleanedDescription: string): string | null {
    // If there's a dedicated comment column, use it
    if (rawComment && String(rawComment).trim()) {
      const comment = String(rawComment).trim();
      // Avoid duplicating description in comment
      if (comment !== cleanedDescription && comment !== String(rawDescription || '').trim()) {
        return comment;
      }
    }
    
    // Extract additional info from description that could be a comment
    const descText = String(rawDescription || '');
    const parts = descText.split(/[|;:]/).map(p => p.trim()).filter(p => p.length > 0);
    
    if (parts.length > 1) {
      // Return the secondary part as comment if it's different from main description
      const possibleComment = parts[1];
      if (possibleComment !== cleanedDescription) {
        return possibleComment;
      }
    }
    
    return null;
  }

  private determineTransactionType(rawAmount: any, parsedAmount: number): boolean {
    const rawText = String(rawAmount).toLowerCase();
    
    // Check for explicit negative indicators
    if (rawText.includes('-') || rawText.includes('debit') || rawText.includes('дебет')) {
      return false; // Expense
    }
    
    // Check for explicit positive indicators
    if (rawText.includes('+') || rawText.includes('credit') || rawText.includes('кредит')) {
      return true; // Income
    }
    
    // Default to the sign of the parsed amount
    return parsedAmount >= 0;
  }
  
  private getColumnIndex(header: string[], columnName: string): number {
    if (!header.length || !columnName) return 0;
    const index = header.findIndex(h => String(h).trim() === columnName);
    return index >= 0 ? index : 0;
  }
  
  private parseDate(value: any): string | null {
    if (!value) return null;
    
    // Skip obvious header values
    if (typeof value === 'string' && /^(дата|date|fecha|datum|data|time|час)$/i.test(value.trim())) {
      return null;
    }
    
    try {
      let date: Date;
      
      if (typeof value === 'number') {
        // Excel date serial number (handle both 1900 and 1904 date systems)
        if (value > 59) {
          // 1900 date system
          date = new Date((value - 25569) * 86400 * 1000);
        } else {
          // Handle edge cases for very early dates
          date = new Date(1900, 0, value);
        }
      } else if (typeof value === 'string') {
        const dateStr = value.trim();
        if (!dateStr || /^(дата|date|fecha|datum|data|time|час)$/i.test(dateStr)) {
          return null;
        }
        
        date = this.parseStringDate(dateStr);
        if (!date || isNaN(date.getTime())) {
          return null;
        }
      } else {
        return null;
      }
      
      // Validate date is reasonable (not too far in past/future)
      const now = new Date();
      const tenYearsAgo = new Date(now.getFullYear() - 10, 0, 1);
      const oneYearFromNow = new Date(now.getFullYear() + 1, 11, 31);
      
      if (date < tenYearsAgo || date > oneYearFromNow) {
        console.warn(`Date ${date.toISOString()} seems unreasonable, skipping`);
        return null;
      }
      
      if (isNaN(date.getTime())) return null;
      
      return format(date, 'yyyy-MM-dd');
    } catch (error) {
      console.warn(`Failed to parse date: ${value}`, error);
      return null;
    }
  }
  
  private parseStringDate(dateStr: string): Date {
    // Remove time portion if present
    const datePart = dateStr.split(' ')[0];
    
    // Enhanced date format support
    const formats = [
      // DD.MM.YYYY (most common for Ukrainian banks)
      { regex: /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/, order: [2, 1, 0] }, // [year, month, day]
      // DD/MM/YYYY
      { regex: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, order: [2, 1, 0] },
      // YYYY-MM-DD (ISO format)
      { regex: /^(\d{4})-(\d{1,2})-(\d{1,2})$/, order: [0, 1, 2] },
      // DD-MM-YYYY
      { regex: /^(\d{1,2})-(\d{1,2})-(\d{4})$/, order: [2, 1, 0] },
      // MM/DD/YYYY (US format)
      { regex: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, order: [2, 0, 1] },
      // YYYY/MM/DD
      { regex: /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/, order: [0, 1, 2] }
    ];
    
    for (const format of formats) {
      const match = datePart.match(format.regex);
      if (match) {
        const [, part1, part2, part3] = match;
        const parts = [part1, part2, part3];
        const year = parseInt(parts[format.order[0]]);
        const month = parseInt(parts[format.order[1]]) - 1; // JS months are 0-indexed
        const day = parseInt(parts[format.order[2]]);
        
        const date = new Date(year, month, day);
        if (!isNaN(date.getTime()) && 
            date.getFullYear() === year && 
            date.getMonth() === month && 
            date.getDate() === day) {
          return date;
        }
      }
    }
    
    // Fall back to JavaScript's native Date parsing
    const fallbackDate = new Date(dateStr);
    if (!isNaN(fallbackDate.getTime())) {
      return fallbackDate;
    }
    
    throw new Error(`Unable to parse date: ${dateStr}`);
  }
  
  private parseAmount(value: any): number | null {
    if (value === null || value === undefined || value === '') return null;
    
    if (typeof value === 'number') return value;
    
    if (typeof value === 'string') {
      let cleaned = value.trim();
      
      // Handle different negative formats
      const isNegative = cleaned.includes('-') || cleaned.startsWith('(') && cleaned.endsWith(')');
      
      // Remove currency symbols, spaces, parentheses, and formatting
      cleaned = cleaned
        .replace(/[£$€₴₽,\s()]/g, '')
        .replace(/[+-]/g, '');
      
      // Handle different decimal separators
      if (cleaned.includes(',') && cleaned.includes('.')) {
        // Both comma and dot - assume European format (1.234,56)
        cleaned = cleaned.replace(/\./g, '').replace(',', '.');
      } else if (cleaned.includes(',')) {
        // Check if comma is likely a thousands separator or decimal separator
        const lastCommaIndex = cleaned.lastIndexOf(',');
        if (lastCommaIndex === cleaned.length - 3) {
          // Likely decimal separator (123,45)
          cleaned = cleaned.replace(',', '.');
        } else {
          // Likely thousands separator (1,234)
          cleaned = cleaned.replace(/,/g, '');
        }
      }
      
      const number = parseFloat(cleaned);
      if (isNaN(number)) return null;
      
      return isNegative ? -Math.abs(number) : number;
    }
    
    return null;
  }
  
  private extractCardFromFileName(fileName: string): string {
    const name = fileName.replace(/\.(xlsx?|csv)$/i, '');
    const parts = name.split(/[-_\s]/);
    
    // Enhanced bank names including Ukrainian banks
    const bankNames = [
      'monzo', 'santander', 'chase', 'amex', 'barclays', 'hsbc', 'natwest', 'lloyds',
      'приват', 'приватбанк', 'privatbank', 'mono', 'monobank', 'ощад', 'ощадбанк',
      'укрсиббанк', 'укргазбанк', 'альфа', 'альфабанк', 'райффайзен', 'raiffeisen',
      'креди агриколь', 'credit', 'agricole', 'ubs', 'ing', 'dkb'
    ];
    
    for (const part of parts) {
      const lowerPart = part.toLowerCase();
      if (bankNames.some(bank => lowerPart.includes(bank))) {
        return part;
      }
    }
    
    // Try to extract meaningful card/account identifier
    const meaningfulPart = parts.find(part => 
      part.length >= 3 && 
      part.length <= 20 && 
      !/^\d+$/.test(part) // Not just numbers
    );
    
    return meaningfulPart || parts[0] || 'Imported';
  }
  
  private cleanDescription(description: string): string {
    // Enhanced cleaning for various bank statement formats
    let cleaned = description
      .replace(/^(POS|ATM|DIR|TFR|DD|SO|CHQ|FEE|INT|PAYMENT|PURCHASE|WITHDRAWAL)\s+/i, '')
      .replace(/\s+\d{2}[\/\.-]\d{2}[\/\.-]\d{4}$/, '') // Remove trailing dates
      .replace(/\s+\d{2}[\/\.-]\d{2}$/, '') // Remove trailing MM/DD
      .replace(/\s+\d{4}$/, '') // Remove trailing year
      .replace(/^\w{3}\s+\d{1,2}\s+/, '') // Remove "JAN 15 " style prefixes
      .replace(/\s{2,}/g, ' ') // Normalize multiple spaces
      .trim();
    
    // Remove redundant bank codes and references
    cleaned = cleaned
      .replace(/^REF:\s*/i, '')
      .replace(/\s+REF\s+\w+$/i, '')
      .replace(/\s+TXN\s+\w+$/i, '')
      .replace(/\s+AUTH\s+\w+$/i, '');
    
    // Capitalize properly
    if (cleaned.length > 0) {
      cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
      
      // Capitalize after certain punctuation
      cleaned = cleaned.replace(/([.!?]\s+)([a-z])/g, (match, punct, letter) => 
        punct + letter.toUpperCase()
      );
    }
    
    return cleaned || 'Imported transaction';
  }
  
  private isDocumentInfoRow(row: any[]): boolean {
    if (!row || row.length === 0) return true;
    
    const rowText = row.map(cell => String(cell || '').trim()).join(' ').toLowerCase();
    
    // Skip empty rows
    if (rowText.replace(/\s/g, '').length < 3) return true;
    
    // Enhanced document header patterns
    const documentPatterns = [
      /виписка.*карток.*період/,
      /statement.*cards.*period/,
      /період.*\d{2}\.\d{2}\.\d{4}.*\d{2}\.\d{2}\.\d{4}/,
      /bank.*statement/,
      /financial.*report/,
      /account.*summary/,
      /transaction.*history/,
      /виписка.*операцій/,
      /звіт.*операції/,
      /банківська.*виписка/,
      /^\s*банк\s+/,
      /^\s*bank\s+/,
      /card.*number.*\*+/,
      /номер.*карти.*\*+/
    ];
    
    return documentPatterns.some(pattern => pattern.test(rowText));
  }

  private isDataRow(row: any[]): boolean {
    if (!row || row.length === 0) return false;
    
    const rowText = row.map(cell => String(cell || '').trim()).join(' ').toLowerCase();
    
    // Skip empty rows
    if (rowText.replace(/\s/g, '').length < 3) return false;
    
    // Check for data patterns that indicate this is a transaction row
    const hasDatePattern = /\d{1,2}[.\/-]\d{1,2}[.\/-]\d{4}/.test(rowText);
    const hasAmountPattern = /[-+]?\d+[.,]?\d*/.test(rowText);
    const hasDescriptiveText = row.some(cell => {
      const str = String(cell || '').trim();
      return str.length > 5 && !/^(дата|date|сума|amount|опис|description|баланс|balance)$/i.test(str);
    });
    
    // A data row should have at least a date pattern and an amount pattern
    return hasDatePattern && hasAmountPattern && hasDescriptiveText;
  }

  private isHeaderRow(row: any[]): boolean {
    if (!row || row.length === 0) return true;
    
    // Use negation: if it's not a data row and not a document info row, it might be a header
    if (this.isDataRow(row) || this.isDocumentInfoRow(row)) {
      return false;
    }
    
    const rowText = row.map(cell => String(cell || '').trim()).join(' ').toLowerCase();
    
    // Skip empty rows
    if (rowText.replace(/\s/g, '').length < 3) return true;
    
    // Enhanced header patterns - look for column names
    const headerPatterns = [
      /^(дата|date|fecha|datum|data)$/,
      /^(сума|сумма|amount|betrag|montant|importe|kwota)$/,
      /^(опис|описание|description|beschreibung|descripción|opis)$/,
      /^(баланс|balance|saldo)$/,
      /^\s*(no\.?|num\.?|#|№)\s*$/,
      /^\s*(total|subtotal|sum|всього|итого)\s*$/,
      /^(currency|валюта|монета)$/,
      /^(comment|коментар|примітк)$/
    ];
    
    // Check if majority of cells contain header-like content
    const headerCells = row.filter(cell => {
      const str = String(cell || '').trim().toLowerCase();
      return headerPatterns.some(pattern => pattern.test(str));
    });
    
    // If we have header-like content and it's not a data row, consider it a header
    return headerCells.length >= Math.min(2, row.filter(c => String(c).trim()).length);
  }

  private detectDocumentCurrency(content: string, fileName: string): string {
    // First, try to detect from content using existing utility
    const detectedFromContent = detectCurrencyFromText(content);
    if (detectedFromContent) {
      if (!isSupportedCurrency(detectedFromContent)) {
        addCurrencySupport(detectedFromContent);
      }
      return detectedFromContent;
    }
    
    // Try to detect from filename using existing utility
    const detectedFromFilename = detectCurrencyFromText(fileName);
    if (detectedFromFilename) {
      if (!isSupportedCurrency(detectedFromFilename)) {
        addCurrencySupport(detectedFromFilename);
      }
      return detectedFromFilename;
    }
    
    // Enhanced pattern-based detection using SUPPORTED_CURRENCIES
    const contentLower = content.toLowerCase();
    
    // Check for currency symbols and codes from our supported list
    for (const currency of SUPPORTED_CURRENCIES) {
      // Check for currency code
      if (contentLower.includes(currency.code.toLowerCase())) {
        return currency.code;
      }
      
      // Check for currency symbol (handle special characters properly)
      if (currency.symbol !== currency.code && content.includes(currency.symbol)) {
        return currency.code;
      }
      
      // Check for currency names
      for (const name of currency.names) {
        if (contentLower.includes(name.toLowerCase())) {
          return currency.code;
        }
      }
    }
    
    // Ukrainian bank pattern detection (still useful for context)
    if (contentLower.includes('виписка') || contentLower.includes('картк') ||
        contentLower.includes('приват') || contentLower.includes('mono') ||
        contentLower.includes('ощад') || contentLower.includes('укр')) {
      return 'UAH';
    }
    
    // Default to UAH (primary currency for Ukrainian market)
    return 'UAH';
  }
} 