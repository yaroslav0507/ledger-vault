import { read, utils, WorkBook } from 'xlsx';
import { v4 as uuidv4 } from 'uuid';
import { Transaction, DEFAULT_CATEGORIES } from '@/features/transactions/model/Transaction';
import { parseCurrencyToSmallestUnit } from '@/shared/utils/currencyUtils';
import { XlsImportStrategy } from '@/features/import/strategies/XlsImportStrategy';

interface RealTransactionTemplate {
  description: string;
  originalDescription: string;
  amount: number;
  category: string;
  isIncome: boolean;
  merchantType?: string;
  timePattern?: 'morning' | 'afternoon' | 'evening' | 'night';
}

export class RealBankStatementParser {
  private xlsStrategy = new XlsImportStrategy();
  private templates: RealTransactionTemplate[] = [];

  async parseRealBankStatement(filePath: string): Promise<void> {
    try {
      // Load the real bank statement file
      const workbook: WorkBook = read(require('fs').readFileSync(filePath));
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON
      const rawData = utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      
      console.log('🏦 Analyzing real bank statement with', rawData.length, 'rows');
      
      // Use our AI detection to find columns
      const mapping = await this.xlsStrategy['detectColumnMapping'](rawData);
      
      // Extract real transaction patterns
      this.extractTransactionPatterns(rawData, mapping);
      
    } catch (error) {
      console.warn('Failed to parse real bank statement, using fallback templates:', error);
      this.generateFallbackTemplates();
    }
  }

  private extractTransactionPatterns(data: any[][], mapping: any): void {
    // Skip header and info rows, find actual transactions
    const startRow = 2; // Skip first few rows that are likely headers
    
    for (let i = startRow; i < Math.min(data.length, 50); i++) { // Analyze up to 50 transactions
      const row = data[i];
      if (!row || row.length < 3) continue;
      
      try {
        const dateCol = row[0];
        const amountCol = row[1];
        const descCol = row[2];
        
        // Skip if clearly not a transaction row
        if (!dateCol || !amountCol || !descCol) continue;
        if (typeof dateCol === 'string' && dateCol.toLowerCase().includes('дата')) continue;
        
        // Parse the transaction
        const amount = this.parseAmount(amountCol);
        const description = String(descCol).trim();
        
        if (amount !== null && description && description.length > 2) {
          const template: RealTransactionTemplate = {
            description: this.cleanDescription(description),
            originalDescription: description,
            amount: Math.abs(amount),
            category: this.guessCategory(description),
            isIncome: amount >= 0,
            merchantType: this.detectMerchantType(description),
            timePattern: this.detectTimePattern(String(dateCol))
          };
          
          this.templates.push(template);
        }
      } catch (error) {
        // Skip problematic rows
        continue;
      }
    }
    
    console.log('📊 Extracted', this.templates.length, 'real transaction patterns');
    this.logPatternAnalysis();
  }

  private parseAmount(value: any): number | null {
    if (value === null || value === undefined || value === '') return null;
    
    if (typeof value === 'number') return value;
    
    if (typeof value === 'string') {
      // Handle various currency formats
      const cleaned = value.replace(/[£$€₴₽,\s]/g, '').replace(',', '.');
      const number = parseFloat(cleaned);
      return isNaN(number) ? null : number;
    }
    
    return null;
  }

  private cleanDescription(description: string): string {
    // Clean up merchant names and transaction descriptions
    let cleaned = description
      .replace(/^(POS|ATM|DIR|TFR|DD|SO|CHQ|FEE|INT)\s+/i, '')
      .replace(/\s+\d{2}[\/\.-]\d{2}[\/\.-]\d{4}.*$/, '') // Remove trailing dates and times
      .replace(/\s+\d{2}:\d{2}:\d{2}$/, '') // Remove trailing times
      .replace(/\d{4,}$/, '') // Remove long number sequences at end
      .replace(/[*#+]{2,}/, '') // Remove multiple special chars
      .trim();
    
    // Extract meaningful merchant names
    const words = cleaned.split(/\s+/);
    const meaningfulWords = words.filter(word => 
      word.length > 2 && 
      !/^\d+$/.test(word) && 
      !word.match(/^[*#+\-_=]+$/)
    );
    
    cleaned = meaningfulWords.slice(0, 4).join(' '); // Take first 4 meaningful words
    
    // Capitalize properly
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
  }

  private guessCategory(description: string): string {
    const desc = description.toLowerCase();
    
    // Enhanced category detection based on Ukrainian and international patterns
    const categoryMap: { [key: string]: string[] } = {
      'food & dining': [
        'cafe', 'coffee', 'restaurant', 'pizza', 'burger', 'food', 'dining',
        'starbucks', 'mcdonalds', 'kfc', 'subway', 'grocery', 'supermarket',
        'кафе', 'ресторан', 'їжа', 'продукти'
      ],
      'transportation': [
        'uber', 'taxi', 'bus', 'metro', 'parking', 'fuel', 'gas', 'petrol',
        'transport', 'railway', 'airport', 'автобус', 'таксі', 'паливо'
      ],
      'shopping': [
        'amazon', 'shop', 'store', 'retail', 'mall', 'market', 'purchase',
        'магазин', 'покупка', 'торговий'
      ],
      'bills & utilities': [
        'electric', 'gas', 'water', 'internet', 'phone', 'utility', 'bill',
        'телефон', 'інтернет', 'комунальні'
      ],
      'healthcare': [
        'pharmacy', 'hospital', 'doctor', 'medical', 'health', 'clinic',
        'аптека', 'лікар', 'медицина'
      ],
      'entertainment': [
        'cinema', 'movie', 'netflix', 'spotify', 'game', 'entertainment',
        'кіно', 'розваги'
      ],
      'income': [
        'salary', 'wage', 'payment', 'transfer', 'deposit', 'refund',
        'зарплата', 'переказ', 'депозит'
      ]
    };
    
    for (const [category, keywords] of Object.entries(categoryMap)) {
      if (keywords.some(keyword => desc.includes(keyword))) {
        return category;
      }
    }
    
    return DEFAULT_CATEGORIES[8]; // 'Other'
  }

  private detectMerchantType(description: string): string {
    const desc = description.toLowerCase();
    
    if (desc.includes('atm') || desc.includes('банкомат')) return 'atm';
    if (desc.includes('pos') || desc.includes('card')) return 'card_payment';
    if (desc.includes('online') || desc.includes('web')) return 'online';
    if (desc.includes('transfer') || desc.includes('переказ')) return 'transfer';
    
    return 'unknown';
  }

  private detectTimePattern(dateStr: string): 'morning' | 'afternoon' | 'evening' | 'night' {
    // Extract time if present in the date string
    const timeMatch = dateStr.match(/(\d{1,2}):(\d{2})/);
    if (timeMatch) {
      const hour = parseInt(timeMatch[1]);
      if (hour >= 6 && hour < 12) return 'morning';
      if (hour >= 12 && hour < 18) return 'afternoon';
      if (hour >= 18 && hour < 22) return 'evening';
      return 'night';
    }
    
    // Random time pattern if no time info
    const patterns: ('morning' | 'afternoon' | 'evening' | 'night')[] = ['morning', 'afternoon', 'evening', 'night'];
    return patterns[Math.floor(Math.random() * patterns.length)];
  }

  private logPatternAnalysis(): void {
    console.log('💰 Transaction Analysis:');
    console.log('- Income transactions:', this.templates.filter(t => t.isIncome).length);
    console.log('- Expense transactions:', this.templates.filter(t => !t.isIncome).length);
    
    const avgAmount = this.templates.reduce((sum, t) => sum + t.amount, 0) / this.templates.length;
    console.log('- Average amount:', avgAmount.toFixed(2));
    
    const categories = this.templates.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('- Categories:', Object.entries(categories).map(([cat, count]) => `${cat}: ${count}`).join(', '));
  }

  private generateFallbackTemplates(): void {
    // Fallback to realistic Ukrainian bank transaction patterns
    this.templates = [
      {
        description: 'ATM Withdrawal',
        originalDescription: 'ATM CASH WITHDRAWAL',
        amount: 500,
        category: DEFAULT_CATEGORIES[8],
        isIncome: false,
        merchantType: 'atm'
      },
      {
        description: 'Grocery Store',
        originalDescription: 'POS SILPO SUPERMARKET',
        amount: 150.75,
        category: 'food & dining',
        isIncome: false,
        merchantType: 'card_payment'
      },
      {
        description: 'Salary Transfer',
        originalDescription: 'WIRE TRANSFER SALARY',
        amount: 25000,
        category: 'income',
        isIncome: true,
        merchantType: 'transfer'
      },
      {
        description: 'Mobile Payment',
        originalDescription: 'KYIVSTAR MOBILE PAYMENT',
        amount: 150,
        category: 'bills & utilities',
        isIncome: false,
        merchantType: 'online'
      },
      {
        description: 'Coffee Shop',
        originalDescription: 'POS CAFE LVIV',
        amount: 45,
        category: 'food & dining',
        isIncome: false,
        merchantType: 'card_payment'
      }
    ];
  }

  generateRealisticSamples(count: number = 5): Transaction[] {
    if (this.templates.length === 0) {
      this.generateFallbackTemplates();
    }
    
    const samples: Transaction[] = [];
    
    for (let i = 0; i < count; i++) {
      const template = this.templates[Math.floor(Math.random() * this.templates.length)];
      
      // Add realistic date variation (last 60 days)
      const daysAgo = Math.floor(Math.random() * 60);
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      
      // Add amount variation (±30%)
      const variance = 0.7 + (Math.random() * 0.6); // 0.7 to 1.3
      const amount = Math.round(template.amount * variance * 100) / 100;
      
      const transaction: Transaction = {
        id: uuidv4(),
        date: date.toISOString().split('T')[0],
        card: this.getRandomCard(),
        amount: parseCurrencyToSmallestUnit(amount),
        currency: 'USD',
        originalDescription: template.originalDescription,
        description: template.description,
        category: template.category,
        isDuplicate: false,
        isIncome: template.isIncome,
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          aiEnriched: false,
          version: 1,
          source: 'real_bank_sample'
        }
      };
      
      samples.push(transaction);
    }
    
    return samples;
  }

  private getRandomCard(): string {
    const cards = ['PrivatBank', 'Monobank', 'PUMB', 'Raiffeisen', 'OschadBank'];
    return cards[Math.floor(Math.random() * cards.length)];
  }
}

// Create singleton instance
export const realBankParser = new RealBankStatementParser(); 