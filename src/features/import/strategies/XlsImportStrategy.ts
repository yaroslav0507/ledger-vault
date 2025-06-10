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

    if (!mapping) {
      throw new Error('Column mapping is required. Please use the import wizard to map columns.');
    }

    try {
      const workbook: WorkBook = read(file.content, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      const rawData = utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      
      // Always use the user-provided mapping
      const result = await this.parseTransactions(rawData, mapping, file.name);
      
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
      
      console.log('🔍 Raw Excel data (first 10 rows):', rawData.slice(0, 10));
      
      if (rawData.length === 0) {
        throw new Error('Empty file');
      }

      // Better header detection using existing logic
      let headerRowIndex = 0;
      let columns: string[] = [];
      
      // First try to find a proper header row using validation
      for (let i = 0; i < Math.min(rawData.length, 10); i++) {
        const row = rawData[i] as string[];
        console.log(`🔍 Checking row ${i} for headers:`, row);
        if (this.hasValidColumnStructure(row)) {
          columns = this.extractColumnNames(row).filter(col => col.trim());
          headerRowIndex = i;
          console.log(`✅ Found valid header at row ${i}:`, columns);
          break;
        }
      }

      // Fallback to first non-empty row with meaningful content
      if (columns.length === 0) {
        console.log('⚠️ No valid header found, using fallback logic');
        for (let i = 0; i < Math.min(rawData.length, 5); i++) {
          const row = rawData[i] as string[];
          if (row.some(cell => String(cell).trim())) {
            columns = row.map((cell, index) => 
              String(cell).trim() || `Column ${index + 1}`
            );
            headerRowIndex = i;
            console.log(`🔄 Using fallback header at row ${i}:`, columns);
            break;
          }
        }
      }

      if (columns.length === 0) {
        throw new Error('Unable to detect columns in file');
      }

      // Get sample data (excluding the detected header)
      const sampleData: string[][] = [];
      const startRow = headerRowIndex + 1;
      const maxSamples = Math.min(5, rawData.length - startRow);
      
      console.log(`📋 Extracting sample data from row ${startRow}, ${maxSamples} samples`);
      
      for (let i = 0; i < maxSamples; i++) {
        const row = rawData[startRow + i] as any[];
        if (row && row.some(cell => String(cell).trim())) {
          const mappedRow = columns.map((_, colIndex) => 
            String(row[colIndex] || '').trim()
          );
          sampleData.push(mappedRow);
          console.log(`📊 Sample row ${i}:`, mappedRow);
        }
      }

      // Generate smart suggested mapping based on column names
      const suggestedMapping = this.detectColumnTypes(columns);
      console.log('🎯 Suggested mapping:', suggestedMapping);

      return {
        columns,
        sampleData,
        suggestedMapping: {
          dateColumn: suggestedMapping.dateColumn || undefined,
          amountColumn: suggestedMapping.amountColumn || undefined,
          descriptionColumn: suggestedMapping.descriptionColumn || undefined,
          cardColumn: suggestedMapping.cardColumn || undefined,
          categoryColumn: suggestedMapping.categoryColumn || undefined,
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
    cardColumn: string | null;
    categoryColumn: string | null;
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
        cardScore: this.calculateCardScore(h),
        categoryScore: this.calculateCategoryScore(h),
        commentScore: this.calculateCommentScore(h)
      };
    });
    
    // Find best matches with improved thresholds
    const dateColumn = this.findBestMatch(analysis, 'dateScore', 0.4);
    const amountColumn = this.findBestMatch(analysis, 'amountScore', 0.4);
    const descriptionColumn = this.findBestMatch(analysis, 'descriptionScore', 0.3);
    const cardColumn = this.findBestMatch(analysis, 'cardScore', 0.4);
    const categoryColumn = this.findBestMatch(analysis, 'categoryScore', 0.4);
    const commentColumn = this.findBestMatch(analysis, 'commentScore', 0.3);

    return {
      dateColumn,
      amountColumn,
      descriptionColumn,
      cardColumn,
      categoryColumn,
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

  private calculateCommentScore(header: string): number {
    const commentKeywords = [
      { word: 'опис', score: 1.0 },     // Ukrainian description/comment
      { word: 'коментар', score: 1.0 },
      { word: 'комментарий', score: 1.0 },
      { word: 'comment', score: 1.0 },
      { word: 'note', score: 0.9 },
      { word: 'notes', score: 0.9 },
      { word: 'remarks', score: 0.8 },
      { word: 'примітк', score: 0.9 },
      { word: 'заметк', score: 0.9 },
      { word: 'additional', score: 0.7 },
      { word: 'extra', score: 0.6 },
      { word: 'додатков', score: 0.7 }  // additional in Ukrainian
    ];
    
    let score = 0;
    for (const keyword of commentKeywords) {
      if (header.includes(keyword.word)) {
        score = Math.max(score, keyword.score);
      }
    }
    
    return Math.min(score, 1.0);
  }

  private calculateCardScore(header: string): number {
    const headerLower = header.toLowerCase().trim();
    
    // First, exclude columns that are clearly amounts/sums
    if (headerLower.includes('сума') || headerLower.includes('amount') || 
        headerLower.includes('sum') || headerLower.includes('total') ||
        headerLower.includes('баланс') || headerLower.includes('balance') ||
        headerLower.includes('валют') || headerLower.includes('currency')) {
      return 0; // These are amount/currency columns, not card columns
    }
    
    const cardKeywords = [
      // Exact card column names (highest priority)
      { word: 'картка', score: 1.0 },
      { word: 'card', score: 1.0 },
      { word: 'account', score: 0.9 },
      { word: 'рахунок', score: 0.9 },
      
      // Card identifiers
      { word: 'номер картки', score: 1.0 },
      { word: 'card number', score: 1.0 },
      { word: 'card no', score: 0.9 },
      { word: 'account no', score: 0.9 },
      
      // Bank/card types
      { word: 'visa', score: 0.8 },
      { word: 'mastercard', score: 0.8 },
      { word: 'приватбанк', score: 0.7 },
      { word: 'privatbank', score: 0.7 },
      { word: 'моно', score: 0.7 },
      { word: 'mono', score: 0.7 },
      { word: 'ощад', score: 0.7 },
      { word: 'oschadbank', score: 0.7 },
      
      // Generic identifiers (lower scores)
      { word: 'джерело', score: 0.6 }, // source
      { word: 'source', score: 0.6 },
      { word: 'банк', score: 0.5 },
      { word: 'bank', score: 0.5 }
    ];
    
    let score = 0;
    for (const keyword of cardKeywords) {
      if (headerLower.includes(keyword.word)) {
        score = Math.max(score, keyword.score);
      }
    }
    
    // Boost score for patterns that look like card identifiers
    if (/\*+\s*\d+/.test(headerLower)) score += 0.4; // **** 1234 patterns
    if (/card\s*\d+/i.test(headerLower)) score += 0.3; // card 1, card2, etc.
    if (/\d{4}.*\d{4}/i.test(headerLower)) score += 0.3; // 1234...5678 patterns
    
    // Penalize if it looks like a date, amount, or description field
    if (/дата|date|час|time/i.test(headerLower)) score *= 0.1;
    if (/опис|description|операц|transaction/i.test(headerLower)) score *= 0.1;
    
    return Math.min(score, 1.0);
  }

  private calculateCategoryScore(header: string): number {
    const categoryKeywords = [
      { word: 'категор', score: 1.0 },  // категорія, категории
      { word: 'category', score: 1.0 },
    ];
    
    let score = 0;
    for (const keyword of categoryKeywords) {
      if (header.includes(keyword.word)) {
        score = Math.max(score, keyword.score);
      }
    }
    
    // Boost score for MCC-like patterns
    if (/mcc/i.test(header)) score += 0.3;
    if (/\d{4}/.test(header) && header.length < 15) score += 0.2; // 4-digit codes
    
    return Math.min(score, 1.0);
  }

  private calculateDescriptionScore(header: string): number {
    const headerLower = header.toLowerCase().trim();
    
    // Exclude columns that are clearly other types
    if (headerLower.includes('сума') || headerLower.includes('amount') || 
        headerLower.includes('sum') || headerLower.includes('total') ||
        headerLower.includes('баланс') || headerLower.includes('balance') ||
        headerLower.includes('валют') || headerLower.includes('currency') ||
        headerLower.includes('дата') || headerLower.includes('date') ||
        headerLower.includes('час') || headerLower.includes('time') ||
        headerLower.includes('картк') || headerLower.includes('card') ||
        headerLower.includes('категор') || headerLower.includes('category')) {
      return 0; // These are other column types
    }
    
    const descriptionKeywords = [
      // Primary description keywords
      { word: 'опис', score: 1.0 },        // Ukrainian description
      { word: 'описание', score: 1.0 },    // Russian description  
      { word: 'description', score: 1.0 },
      { word: 'narrative', score: 0.9 },
      { word: 'details', score: 0.8 },
      { word: 'reference', score: 0.7 },
      { word: 'memo', score: 0.8 },
      { word: 'purpose', score: 0.7 },
      { word: 'merchant', score: 0.8 },
      { word: 'payee', score: 0.7 },
      { word: 'transaction', score: 0.6 },
      { word: 'операція', score: 0.8 },    // Ukrainian operation
      { word: 'операция', score: 0.8 },    // Russian operation
      { word: 'деталі', score: 0.7 },      // Ukrainian details
      { word: 'детали', score: 0.7 },      // Russian details
      { word: 'призначення', score: 0.7 }, // Ukrainian purpose
      { word: 'назначение', score: 0.7 },  // Russian purpose
      { word: 'примітка', score: 0.6 },    // Ukrainian note
      { word: 'примечание', score: 0.6 }   // Russian note
    ];
    
    let score = 0;
    for (const keyword of descriptionKeywords) {
      if (headerLower.includes(keyword.word)) {
        score = Math.max(score, keyword.score);
      }
    }
    
    // Boost score if it looks like a general text field
    if (headerLower.includes('text') || headerLower.includes('info')) {
      score = Math.max(score, 0.5);
    }
    
    return Math.min(score, 1.0);
  }

  private async parseTransactions(data: any[][], mapping: ImportMapping, fileName: string): Promise<ImportResult> {
    const transactions: Transaction[] = [];
    const errors: ImportError[] = [];
    const duplicates: Transaction[] = [];
    
    console.log('🚀 Starting parseTransactions with mapping:', mapping);
    console.log('📁 File name:', fileName);
    console.log('📊 Data rows to process:', data.length);
    
    if (data.length <= 1) {
      throw new Error('File contains no data rows');
    }
    
    let earliestDate = '';
    let latestDate = '';
    
    // Use user-provided mapping settings
    const headerRow = mapping.hasHeader ? data[mapping.headerRowIndex || 0] || [] : [];
    const dataStartRow = mapping.hasHeader ? (mapping.headerRowIndex || 0) + 1 : 0;
    const dataRows = data.slice(dataStartRow);
    
    console.log('📋 Header row:', headerRow);
    console.log('📋 Data starts at row:', dataStartRow);
    console.log('📋 User mapping:');
    console.log('  📅 Date column:', mapping.dateColumn);
    console.log('  💰 Amount column:', mapping.amountColumn);
    console.log('  📝 Description column:', mapping.descriptionColumn);
    console.log('  💳 Card column:', mapping.cardColumn);
    console.log('  🏷️ Category column:', mapping.categoryColumn);
    console.log('  💬 Comment column:', mapping.commentColumn);
    
    // Improved currency detection with proper fallback
    const allText = data.flat().map(cell => String(cell || '')).join(' ');
    const detectedCurrency = this.detectDocumentCurrency(allText, fileName);

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowNumber = dataStartRow + i + 1;
      
      try {
        // Skip empty rows
        if (!row || !row.some(cell => String(cell || '').trim())) {
          continue;
        }
        
        // Extract values using user mapping
        const dateColumnIndex = this.getColumnIndex(headerRow, mapping.dateColumn);
        const amountColumnIndex = this.getColumnIndex(headerRow, mapping.amountColumn);
        const descriptionColumnIndex = this.getColumnIndex(headerRow, mapping.descriptionColumn);
        const cardColumnIndex = mapping.cardColumn ? this.getColumnIndex(headerRow, mapping.cardColumn) : null;
        const categoryColumnIndex = mapping.categoryColumn ? this.getColumnIndex(headerRow, mapping.categoryColumn) : null;
        const commentColumnIndex = mapping.commentColumn ? this.getColumnIndex(headerRow, mapping.commentColumn) : null;
        
        const rawDate = row[dateColumnIndex];
        const rawAmount = row[amountColumnIndex];
        const rawDescription = row[descriptionColumnIndex];
        const rawCard = cardColumnIndex !== null ? row[cardColumnIndex] : null;
        const rawCategory = categoryColumnIndex !== null ? row[categoryColumnIndex] : null;
        const rawComment = commentColumnIndex !== null ? row[commentColumnIndex] : null;
        
        console.log(`📊 Row ${rowNumber} data extraction:`, {
          dateIndex: dateColumnIndex, rawDate,
          amountIndex: amountColumnIndex, rawAmount,
          descriptionIndex: descriptionColumnIndex, rawDescription,
          cardIndex: cardColumnIndex, rawCard,
          categoryIndex: categoryColumnIndex, rawCategory,
          commentIndex: commentColumnIndex, rawComment
        });
        
        // Skip if essential fields are missing
        if (!rawDate && !rawAmount && !rawDescription) continue;
        
        // Parse date
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
        
        // Parse amount
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
        
        // Extract description and other fields
        const description = this.extractDescription(rawDescription);
        const comment = this.extractComment(rawComment, rawDescription, description);
        
        // Use mapped card/category or defaults
        const card = this.cleanCardName(String(rawCard).trim());
        const category = rawCategory ? String(rawCategory).trim() : DEFAULT_CATEGORIES[8]; // 'Other'
        
        // Determine transaction type (income vs expense)
        const isIncome = this.determineTransactionType(rawAmount, parsedAmount, description, category);
        
        // Store the original amount with its sign - don't use Math.abs()
        const finalAmount = parsedAmount;
        
        // Create transaction
        const transaction: Transaction = {
          id: uuidv4(),
          date: parsedDate,
          card: card || 'Imported',
          amount: parseCurrencyToSmallestUnit(finalAmount, detectedCurrency),
          currency: detectedCurrency,
          description: description,
          category: category,
          comment: comment || undefined,
          isDuplicate: false,
          isIncome,
          createdAt: new Date().toISOString()
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

  private determineTransactionType(rawAmount: any, parsedAmount: number, description?: string, category?: string): boolean {
    // Debug the input values
    console.log('🔍 determineTransactionType called with:', {
      rawAmount,
      parsedAmount,
      description: description?.substring(0, 50),
      category
    });
    // Default to amount-based logic: positive = income, negative = expense
    const isIncome = rawAmount >= 0;
    console.log(`💰 Amount-based detection: ${parsedAmount} -> ${isIncome ? 'INCOME' : 'EXPENSE'}`);
    
    return isIncome;
  }
  
  private getColumnIndex(header: string[], columnName: string): number {
    if (!header.length || !columnName) {
      console.warn('⚠️ getColumnIndex called with empty header or columnName:', { header, columnName });
      return 0;
    }
    
    // First try exact match
    let index = header.findIndex(h => String(h).trim() === columnName);
    
    if (index >= 0) {
      console.log(`✅ Found exact column match for "${columnName}" at index ${index}`);
      return index;
    }
    
    // Try case-insensitive match
    index = header.findIndex(h => String(h).trim().toLowerCase() === columnName.toLowerCase());
    
    if (index >= 0) {
      console.log(`✅ Found case-insensitive column match for "${columnName}" at index ${index}`);
      return index;
    }
    
    // Try partial match (contains)
    index = header.findIndex(h => 
      String(h).trim().toLowerCase().includes(columnName.toLowerCase()) ||
      columnName.toLowerCase().includes(String(h).trim().toLowerCase())
    );
    
    if (index >= 0) {
      console.log(`✅ Found partial column match for "${columnName}" at index ${index}`);
      return index;
    }
    
    console.error(`❌ Could not find column "${columnName}" in headers:`, header);
    console.error(`❌ This will cause incorrect data mapping! Using index 0 as fallback.`);
    return 0;
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
          // 1900 date system - Excel stores dates as days since 1900-01-01
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
      
      // Return full ISO timestamp instead of just date
      return date.toISOString();
    } catch (error) {
      console.warn(`Failed to parse date: ${value}`, error);
      return null;
    }
  }
  
  private parseStringDate(dateStr: string): Date {
    // Extract date and time parts
    const parts = dateStr.trim().split(/\s+/);
    const datePart = parts[0];
    const timePart = parts[1] || '00:00:00'; // Default to midnight if no time
    
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
    
    let date: Date | null = null;
    
    for (const format of formats) {
      const match = datePart.match(format.regex);
      if (match) {
        const [, part1, part2, part3] = match;
        const parts = [part1, part2, part3];
        const year = parseInt(parts[format.order[0]]);
        const month = parseInt(parts[format.order[1]]) - 1; // JS months are 0-indexed
        const day = parseInt(parts[format.order[2]]);
        
        date = new Date(year, month, day);
        if (!isNaN(date.getTime()) && 
            date.getFullYear() === year && 
            date.getMonth() === month && 
            date.getDate() === day) {
          break;
        } else {
          date = null;
        }
      }
    }
    
    if (!date) {
      // Fall back to JavaScript's native Date parsing
      const fallbackDate = new Date(datePart);
      if (!isNaN(fallbackDate.getTime())) {
        date = fallbackDate;
      }
    }
    
    if (!date) {
      throw new Error(`Unable to parse date: ${dateStr}`);
    }
    
    // Parse and apply time if provided
    if (timePart && timePart !== '00:00:00') {
      const timeMatch = timePart.match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/);
      if (timeMatch) {
        const hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2]);
        const seconds = parseInt(timeMatch[3] || '0');
        
        if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59 && seconds >= 0 && seconds <= 59) {
          date.setHours(hours, minutes, seconds, 0);
        }
      }
    }
    
    return date;
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

  private cleanCardName(cardName: string): string {
    if (!cardName || cardName.trim().length === 0) {
      return 'Imported Card';
    }
    
    const cleaned = cardName.trim();
      
    // Handle masked card numbers like "**** 5460" - these are valid and should be kept as-is
    if (/\*{4,}\s*\d{4}/.test(cleaned)) {
      console.log(`✅ Found masked card number: "${cleaned}"`);
      return cleaned;
    }
    
    // Handle other card masking patterns
    if (/\*+.*\d+/.test(cleaned) && cleaned.length >= 7) {
      console.log(`✅ Found card masking pattern: "${cleaned}"`);
      return cleaned;
    }
    
    // Reject pure numbers (likely account IDs or transaction IDs) but allow if it has asterisks
    if (/^-?\d+$/.test(cleaned)) {
      console.log(`❌ Rejecting pure number: "${cleaned}"`);
      return 'Imported Card';
    }
    
    // Reject very short values (likely codes) unless they contain card patterns
    if (cleaned.length < 3 && !/\*/.test(cleaned)) {
      console.log(`❌ Rejecting short value: "${cleaned}"`);
      return 'Imported Card';
    }
    
    // Reject negative values that don't look like card names
    if (cleaned.startsWith('-') && !/card|карт|visa|master|\*/.test(cleaned)) {
      console.log(`❌ Rejecting negative value: "${cleaned}"`);
      return 'Imported Card';
    }
    
    // Reject common non-card values
    const rejectPatterns = [
      /^(null|undefined|n\/a|none|#ref|#error)$/i,
      /^\d{4}-\d{2}-\d{2}$/, // dates
      /^[0-9.,\-+\s]+$/, // pure numbers/amounts (without asterisks)
    ];
    
    for (const pattern of rejectPatterns) {
      if (pattern.test(cleaned)) {
        console.log(`❌ Rejecting pattern match: "${cleaned}"`);
        return 'Imported Card';
      }
    }
    
    // If it looks like a valid card name, clean it up
    let result = cleaned;
    
    // Keep masked card numbers as-is
    if (/\*/.test(result)) {
      console.log(`✅ Keeping masked card as-is: "${result}"`);
      return result;
    }
    
    // Capitalize first letter for named cards
    result = result.charAt(0).toUpperCase() + result.slice(1).toLowerCase();
    
    // Handle common card patterns
    result = result
      .replace(/\bvisa\b/gi, 'Visa')
      .replace(/\bmastercard\b/gi, 'Mastercard')
      .replace(/\bmaster\b/gi, 'Master')
      .replace(/\bприват\b/gi, 'ПриватБанк')
      .replace(/\bmono\b/gi, 'Monobank')
      .replace(/\bощад\b/gi, 'Ощадбанк');
    
    console.log(`✅ Cleaned card name: "${cleaned}" -> "${result}"`);
    return result;
  }
} 