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
      const columnMapping = mapping || await this.detectColumnMapping(rawData);
      
      // Parse transactions
      const result = await this.parseTransactions(rawData, columnMapping, file.name);
      
      return result;
    } catch (error) {
      console.error('Failed to parse Excel file:', error);
      throw new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async detectColumnMapping(data: any[][]): Promise<ImportMapping> {
    if (data.length === 0) {
      throw new Error('Empty file');
    }

    // Find the actual header row (skip document info rows)
    let headerRowIndex = 0;
    let header: string[] = [];
    
    for (let i = 0; i < Math.min(data.length, 10); i++) {
      const row = data[i] as string[];
      if (!this.isHeaderRow(row) && row.some(cell => String(cell).trim())) {
        // This might be our header row, check if it contains recognizable column names
        const cleanedRow = this.extractColumnNames(row);
        if (this.hasValidColumnStructure(cleanedRow)) {
          header = cleanedRow;
          headerRowIndex = i;
          break;
        }
      }
    }
    
    // If no good header found, use the first non-empty row
    if (header.length === 0) {
      for (let i = 0; i < data.length; i++) {
        const row = data[i] as string[];
        if (row.some(cell => String(cell).trim())) {
          header = this.extractColumnNames(row);
          headerRowIndex = i;
          break;
        }
      }
    }
    
    console.log(`📋 Found header row at index ${headerRowIndex}:`, header);
    
    // Use AI to detect column types
    const aiMapping = await this.detectColumnsWithAI(header);
    
    return {
      dateColumn: aiMapping.dateColumn || header[0] || '',
      amountColumn: aiMapping.amountColumn || header[1] || '',
      descriptionColumn: aiMapping.descriptionColumn || header[2] || '',
      dateFormat: 'auto',
      hasHeader: true
    };
  }

  private extractColumnNames(row: any[]): string[] {
    return row.map(cell => {
      const str = String(cell || '').trim();
      
      // If it's a long Ukrainian document title, try to extract the column name
      if (str.includes('Виписка з Ваших карток')) {
        // This is likely a document title, not a column header
        return '';
      }
      
      // Extract meaningful parts from complex headers
      if (str.includes('період')) {
        // Extract just the meaningful part
        const parts = str.split(/\s+/);
        for (const part of parts) {
          if (/^(дата|сума|опис|баланс)$/i.test(part)) {
            return part;
          }
        }
      }
      
      return str;
    });
  }

  private hasValidColumnStructure(headers: string[]): boolean {
    // Check if this row looks like actual column headers
    const nonEmpty = headers.filter(h => h.trim()).length;
    if (nonEmpty < 2) return false;
    
    // Look for typical column patterns
    const headerText = headers.join(' ').toLowerCase();
    const hasDateColumn = /дата|date|time|час/.test(headerText);
    const hasAmountColumn = /сума|сумма|amount|value|баланс/.test(headerText);
    const hasDescColumn = /опис|описание|description|details/.test(headerText);
    
    // Need at least 2 out of 3 typical columns
    return [hasDateColumn, hasAmountColumn, hasDescColumn].filter(Boolean).length >= 2;
  }

  private async detectColumnsWithAI(headers: string[]): Promise<{
    dateColumn: string | null;
    amountColumn: string | null;
    descriptionColumn: string | null;
  }> {
    try {
      console.log('🤖 AI Column Detection - Analyzing headers:', headers);
      
      // Create a prompt for AI to analyze the headers
      const prompt = `Analyze these bank statement column headers and identify which column contains:
1. DATE/TIME information (transaction date, posting date, etc.)
2. AMOUNT/VALUE information (transaction amount, debit, credit, balance, etc.)  
3. DESCRIPTION information (transaction description, narrative, details, etc.)

Headers: ${headers.map((h, i) => `${i}: "${h}"`).join(', ')}

Please respond in JSON format:
{
  "dateColumn": "exact_header_name_or_null",
  "amountColumn": "exact_header_name_or_null", 
  "descriptionColumn": "exact_header_name_or_null",
  "reasoning": "brief explanation"
}

Use the exact header names from the list above. If a type is not found, use null.`;

      // Use a simple AI detection method (you can replace this with actual AI service)
      const result = await this.simpleAIColumnDetection(headers);
      
      console.log('🎯 AI Detection Result:', {
        dateColumn: result.dateColumn,
        amountColumn: result.amountColumn,
        descriptionColumn: result.descriptionColumn
      });
      
      return result;
    } catch (error) {
      console.warn('AI column detection failed, falling back to heuristics:', error);
      return this.fallbackColumnDetection(headers);
    }
  }

  private async simpleAIColumnDetection(headers: string[]): Promise<{
    dateColumn: string | null;
    amountColumn: string | null;
    descriptionColumn: string | null;
  }> {
    // For now, implement a sophisticated heuristic-based AI simulation
    // In production, this would call an actual AI service like OpenAI
    
    const headerAnalysis = headers.map((header, index) => {
      const h = header.toLowerCase().trim();
      
      // Analyze each header for its likely content type
      const dateScore = this.calculateDateScore(h);
      const amountScore = this.calculateAmountScore(h);
      const descriptionScore = this.calculateDescriptionScore(h);
      
      const analysis = {
        index,
        header: header,
        dateScore,
        amountScore,
        descriptionScore
      };
      
      console.log(`📊 Header "${header}":`, {
        date: dateScore.toFixed(2),
        amount: amountScore.toFixed(2), 
        description: descriptionScore.toFixed(2)
      });
      
      return analysis;
    });
    
    // Find the best match for each column type
    const dateColumn = headerAnalysis
      .sort((a, b) => b.dateScore - a.dateScore)[0]
      ?.dateScore > 0.3 ? headerAnalysis.sort((a, b) => b.dateScore - a.dateScore)[0].header : null;
      
    const amountColumn = headerAnalysis
      .sort((a, b) => b.amountScore - a.amountScore)[0]
      ?.amountScore > 0.3 ? headerAnalysis.sort((a, b) => b.amountScore - a.amountScore)[0].header : null;
      
    const descriptionColumn = headerAnalysis
      .sort((a, b) => b.descriptionScore - a.descriptionScore)[0]
      ?.descriptionScore > 0.3 ? headerAnalysis.sort((a, b) => b.descriptionScore - a.descriptionScore)[0].header : null;

    return {
      dateColumn,
      amountColumn,
      descriptionColumn
    };
  }

  private calculateDateScore(header: string): number {
    const dateKeywords = [
      // English
      { word: 'date', score: 1.0 },
      { word: 'time', score: 0.8 },
      { word: 'when', score: 0.7 },
      { word: 'posting', score: 0.9 },
      { word: 'transaction', score: 0.8 },
      { word: 'value date', score: 1.0 },
      
      // Ukrainian
      { word: 'дата', score: 1.0 },
      { word: 'час', score: 0.8 },
      { word: 'операції', score: 0.8 },
      { word: 'транзакції', score: 0.8 },
      
      // Russian
      { word: 'дата', score: 1.0 },
      { word: 'время', score: 0.8 },
      { word: 'проведения', score: 0.9 },
      
      // German
      { word: 'datum', score: 1.0 },
      { word: 'zeit', score: 0.8 },
      { word: 'buchung', score: 0.9 },
      
      // French
      { word: 'date', score: 1.0 },
      { word: 'heure', score: 0.8 },
      { word: 'opération', score: 0.8 },
      
      // Spanish
      { word: 'fecha', score: 1.0 },
      { word: 'hora', score: 0.8 },
      
      // Polish
      { word: 'data', score: 1.0 },
      { word: 'czas', score: 0.8 },
    ];
    
    let score = 0;
    for (const keyword of dateKeywords) {
      if (header.includes(keyword.word)) {
        score = Math.max(score, keyword.score);
      }
    }
    
    // Boost score if it contains date-like patterns
    if (/\d{2}[\/\.-]\d{2}[\/\.-]\d{4}/.test(header)) score += 0.5;
    
    return Math.min(score, 1.0);
  }

  private calculateAmountScore(header: string): number {
    const amountKeywords = [
      // English
      { word: 'amount', score: 1.0 },
      { word: 'value', score: 0.9 },
      { word: 'sum', score: 0.9 },
      { word: 'total', score: 0.8 },
      { word: 'balance', score: 0.8 },
      { word: 'debit', score: 0.9 },
      { word: 'credit', score: 0.9 },
      { word: 'money', score: 0.8 },
      { word: 'cost', score: 0.7 },
      { word: 'price', score: 0.7 },
      
      // Ukrainian
      { word: 'сума', score: 1.0 },
      { word: 'кількість', score: 0.9 },
      { word: 'баланс', score: 0.8 },
      { word: 'дебет', score: 0.9 },
      { word: 'кредит', score: 0.9 },
      
      // Russian
      { word: 'сумма', score: 1.0 },
      { word: 'количество', score: 0.9 },
      { word: 'баланс', score: 0.8 },
      
      // German
      { word: 'betrag', score: 1.0 },
      { word: 'summe', score: 0.9 },
      { word: 'wert', score: 0.8 },
      
      // French
      { word: 'montant', score: 1.0 },
      { word: 'somme', score: 0.9 },
      { word: 'valeur', score: 0.8 },
      
      // Spanish
      { word: 'importe', score: 1.0 },
      { word: 'cantidad', score: 0.9 },
      { word: 'valor', score: 0.8 },
      
      // Polish
      { word: 'kwota', score: 1.0 },
      { word: 'suma', score: 0.9 },
    ];
    
    let score = 0;
    for (const keyword of amountKeywords) {
      if (header.includes(keyword.word)) {
        score = Math.max(score, keyword.score);
      }
    }
    
    // Boost score if it contains currency symbols
    if (/[$€£¥₽₴]/.test(header)) score += 0.3;
    
    return Math.min(score, 1.0);
  }

  private calculateDescriptionScore(header: string): number {
    const descriptionKeywords = [
      // English
      { word: 'description', score: 1.0 },
      { word: 'narrative', score: 0.9 },
      { word: 'details', score: 0.9 },
      { word: 'reference', score: 0.8 },
      { word: 'memo', score: 0.9 },
      { word: 'note', score: 0.8 },
      { word: 'comment', score: 0.8 },
      { word: 'purpose', score: 0.7 },
      { word: 'reason', score: 0.7 },
      
      // Ukrainian
      { word: 'опис', score: 1.0 },
      { word: 'призначення', score: 0.9 },
      { word: 'деталі', score: 0.9 },
      { word: 'коментар', score: 0.8 },
      
      // Russian
      { word: 'описание', score: 1.0 },
      { word: 'назначение', score: 0.9 },
      { word: 'детали', score: 0.9 },
      { word: 'комментарий', score: 0.8 },
      
      // German
      { word: 'beschreibung', score: 1.0 },
      { word: 'verwendungszweck', score: 0.9 },
      { word: 'details', score: 0.9 },
      
      // French
      { word: 'description', score: 1.0 },
      { word: 'libellé', score: 0.9 },
      { word: 'détails', score: 0.9 },
      
      // Spanish
      { word: 'descripcion', score: 1.0 },
      { word: 'descripción', score: 1.0 },
      { word: 'detalles', score: 0.9 },
      
      // Polish
      { word: 'opis', score: 1.0 },
      { word: 'szczegóły', score: 0.9 },
    ];
    
    let score = 0;
    for (const keyword of descriptionKeywords) {
      if (header.includes(keyword.word)) {
        score = Math.max(score, keyword.score);
      }
    }
    
    return Math.min(score, 1.0);
  }

  private fallbackColumnDetection(headers: string[]): {
    dateColumn: string | null;
    amountColumn: string | null;
    descriptionColumn: string | null;
  } {
    // Simple fallback - assume first 3 columns are date, amount, description
    return {
      dateColumn: headers[0] || null,
      amountColumn: headers[1] || null,
      descriptionColumn: headers[2] || null
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
        
        // Skip header-like rows (containing text like "Дата", "Amount", etc.)
        if (this.isHeaderRow(row)) continue;
        
        // Parse date
        const parsedDate = this.parseDate(rawDate);
        if (!parsedDate) {
          errors.push({
            row: rowNumber,
            column: mapping.dateColumn,
            error: `Invalid date: ${rawDate} (type: ${typeof rawDate})`,
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
            error: `Invalid amount: ${rawAmount} (type: ${typeof rawAmount})`,
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
    
    // Skip header values like "Дата" (Ukrainian for "Date")
    if (typeof value === 'string' && /^(дата|date|fecha|datum)$/i.test(value.trim())) {
      return null;
    }
    
    try {
      let date: Date;
      
      if (typeof value === 'number') {
        // Excel date serial number
        date = new Date((value - 25569) * 86400 * 1000);
      } else if (typeof value === 'string') {
        const dateStr = value.trim();
        
        // Skip empty or header-like values
        if (!dateStr || /^(дата|date|fecha|datum)$/i.test(dateStr)) {
          return null;
        }
        
        // Handle various date formats
        date = this.parseStringDate(dateStr);
        
        if (!date || isNaN(date.getTime())) {
          return null;
        }
      } else {
        return null;
      }
      
      if (isNaN(date.getTime())) return null;
      
      return format(date, 'yyyy-MM-dd');
    } catch {
      return null;
    }
  }
  
  private parseStringDate(dateStr: string): Date {
    // Remove time portion if present (e.g., "31.05.2025 19:28:11" -> "31.05.2025")
    const datePart = dateStr.split(' ')[0];
    
    // Try different date formats
    const formats = [
      // DD.MM.YYYY (Ukrainian, German, etc.)
      /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/,
      // DD/MM/YYYY (British, etc.)
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
      // MM/DD/YYYY (American)
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
      // YYYY-MM-DD (ISO)
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
      // DD-MM-YYYY
      /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
    ];
    
    // Try DD.MM.YYYY format first (most common for Ukrainian banks)
    const dotMatch = datePart.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (dotMatch) {
      const [, day, month, year] = dotMatch;
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(date.getTime())) return date;
    }
    
    // Try DD/MM/YYYY format
    const slashMatch = datePart.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (slashMatch) {
      const [, day, month, year] = slashMatch;
      // Assume European format (DD/MM/YYYY) first
      let date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(date.getTime()) && parseInt(day) <= 12) {
        return date;
      }
      
      // If day > 12, definitely DD/MM/YYYY
      if (parseInt(day) > 12) {
        return date;
      }
      
      // If day <= 12, could be MM/DD/YYYY (American format)
      date = new Date(parseInt(year), parseInt(day) - 1, parseInt(month));
      if (!isNaN(date.getTime())) return date;
    }
    
    // Try YYYY-MM-DD (ISO format)
    const isoMatch = datePart.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(date.getTime())) return date;
    }
    
    // Try DD-MM-YYYY format
    const dashMatch = datePart.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (dashMatch) {
      const [, day, month, year] = dashMatch;
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(date.getTime())) return date;
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

  private isHeaderRow(row: any[]): boolean {
    if (!row || row.length === 0) return true;
    
    // Convert all cells to string and join
    const rowText = row.map(cell => String(cell || '').trim()).join(' ').toLowerCase();
    
    // Skip if the row is mostly empty
    if (rowText.replace(/\s/g, '').length < 3) return true;
    
    // Advanced header detection patterns for Ukrainian bank statements
    const headerPatterns = [
      // Ukrainian bank statement document headers
      /виписка.*карток.*період/,  // "Виписка з Ваших карток за період"
      /statement.*cards.*period/,  // English equivalent
      /виписка.*рахунк/,  // "Виписка з рахунку" - Account statement
      /період.*\d{2}\.\d{2}\.\d{4}.*\d{2}\.\d{2}\.\d{4}/,  // Date ranges
      
      // Single column headers (when a cell just contains header text)
      /^(дата|date|fecha|datum|data)$/,
      /^(сума|сумма|amount|betrag|montant|importe|kwota)$/,
      /^(опис|описание|description|beschreibung|descripción|opis)$/,
      /^(баланс|balance|saldo)$/,
      /^(валюта|currency|moneda|devise)$/,
      /^(картка|карта|card|karte|carte)$/,
      
      // Document metadata
      /statement.*period/,
      /transaction.*history/,
      /account.*summary/,
      /balance.*report/,
      /bank.*statement/,
      /financial.*report/,
      
      // Table headers and formatting
      /^\s*(no\.?|num\.?|#|№)\s*$/,  // Row numbers
      /^\s*total\s*$/,
      /^\s*subtotal\s*$/,
      /^\s*sum\s*$/,
      /^\s*всього\s*$/,  // Ukrainian "total"
      /^\s*итого\s*$/,   // Russian "total"
      
      // Common Ukrainian bank terms that appear in headers
      /операц/,  // операція/операції - operation/operations
      /транзакц/,  // транзакція - transaction  
      /переказ/,   // переказ - transfer
      /платіж/,    // платіж - payment
      /зарахування/, // зарахування - credit
      /списання/,   // списання - debit
    ];
    
    // Check if any pattern matches
    const isHeaderByPattern = headerPatterns.some(pattern => pattern.test(rowText));
    
    // Special check for rows that contain only document metadata
    const isDocumentInfo = /виписка|statement|звіт|report|період|period/.test(rowText) && 
                           !/\d{1,2}\.\d{1,2}\.\d{4}\s+\d/.test(rowText); // No date+amount pattern
    
    // Check if the row contains only header-like values
    const cellTypes = row.map(cell => {
      const str = String(cell || '').trim().toLowerCase();
      
      // Skip empty cells
      if (str === '') return 'empty';
      
      // Check if it's a common header word
      const headerWords = [
        'дата', 'date', 'time', 'час', 'время',
        'сума', 'сумма', 'amount', 'value', 'betrag',
        'опис', 'описание', 'description', 'details',
        'card', 'account', 'рахунок', 'счет', 'картка',
        'balance', 'баланс', 'total', 'всього', 'итого',
        'валюта', 'currency', 'монета',
        'операція', 'операции', 'transaction', 'операця',
        'виписка', 'statement', 'звіт', 'report'
      ];
      
      if (headerWords.some(word => str.includes(word))) return 'header';
      
      // Check if it's a pure number (could be row number)
      if (/^\d+$/.test(str)) return 'number';
      
      // Check if it's a date range or period info
      if (/\d{2}\.\d{2}\.\d{4}.*\d{2}\.\d{2}\.\d{4}/.test(str)) return 'period';
      
      // Check if it contains Ukrainian document keywords
      if (/виписка|період|карток|рахунк/.test(str)) return 'document';
      
      return 'data';
    });
    
    // Count different cell types
    const headerCells = cellTypes.filter(type => 
      type === 'header' || type === 'empty' || type === 'period' || type === 'document'
    ).length;
    
    // If more than 70% of cells are header-like, empty, or document info, skip the row
    const isHeaderByRatio = (headerCells / cellTypes.length) > 0.7;
    
    // Also skip if it's clearly a document info row
    const isHeaderByContent = cellTypes.includes('document') || cellTypes.includes('period');
    
    const shouldSkip = isHeaderByPattern || isDocumentInfo || isHeaderByRatio || isHeaderByContent;
    
    if (shouldSkip) {
      console.log(`🚫 Skipping header/info row: "${rowText}"`);
    }
    
    return shouldSkip;
  }
} 