import { v4 as uuidv4 } from 'uuid';
import { Transaction, DEFAULT_CATEGORIES } from '@/features/transactions/model/Transaction';
import { getCurrentDateISO } from '@/shared/utils/dateUtils';
import { parseCurrencyToSmallestUnit } from '@/shared/utils/currencyUtils';

export function generateSampleTransactions(count: number = 5): Transaction[] {
  const sampleTemplates = [
    {
      description: 'Starbucks Coffee',
      originalDescription: 'POS STARBUCKS COFFEE #1234',
      amount: 4.85,
      category: DEFAULT_CATEGORIES[0], // Food & Dining
      card: 'Monzo',
      isIncome: false,
      comment: 'Morning coffee'
    },
    {
      description: 'Salary Payment',
      originalDescription: 'TFR PAYROLL DEPOSIT COMPANY INC',
      amount: 3200.00,
      category: DEFAULT_CATEGORIES[7], // Income
      card: 'Santander',
      isIncome: true,
      comment: 'Monthly salary'
    },
    {
      description: 'Amazon Purchase',
      originalDescription: 'AMAZON.COM PURCHASE',
      amount: 89.99,
      category: DEFAULT_CATEGORIES[2], // Shopping
      card: 'Revolut',
      isIncome: false
    },
    {
      description: 'Uber Ride',
      originalDescription: 'UBER TRIP HELP.UBER.COM',
      amount: 25.40,
      category: DEFAULT_CATEGORIES[1], // Transportation
      card: 'Chase',
      isIncome: false,
      comment: 'To airport'
    },
    {
      description: 'Electric Bill',
      originalDescription: 'DD ELECTRIC COMPANY PAYMENT',
      amount: 120.00,
      category: DEFAULT_CATEGORIES[4], // Bills & Utilities
      card: 'Amex',
      isIncome: false
    },
    {
      description: 'Grocery Shopping',
      originalDescription: 'POS WHOLE FOODS MARKET',
      amount: 67.23,
      category: DEFAULT_CATEGORIES[0], // Food & Dining
      card: 'Monzo',
      isIncome: false
    },
    {
      description: 'Netflix Subscription',
      originalDescription: 'NETFLIX.COM MONTHLY',
      amount: 15.99,
      category: DEFAULT_CATEGORIES[6], // Entertainment
      card: 'Revolut',
      isIncome: false
    },
    {
      description: 'Gas Station',
      originalDescription: 'SHELL FUEL PURCHASE',
      amount: 45.67,
      category: DEFAULT_CATEGORIES[1], // Transportation
      card: 'Chase',
      isIncome: false
    },
    {
      description: 'Freelance Payment',
      originalDescription: 'WIRE TRANSFER CLIENT ABC',
      amount: 750.00,
      category: DEFAULT_CATEGORIES[7], // Income
      card: 'Santander',
      isIncome: true,
      comment: 'Web development project'
    },
    {
      description: 'Pharmacy',
      originalDescription: 'CVS PHARMACY PURCHASE',
      amount: 28.45,
      category: DEFAULT_CATEGORIES[5], // Healthcare
      card: 'Amex',
      isIncome: false
    }
  ];

  const selectedSamples = [];
  
  for (let i = 0; i < count; i++) {
    const template = sampleTemplates[i % sampleTemplates.length];
    
    // Add some randomness to dates (within last 30 days)
    const daysAgo = Math.floor(Math.random() * 30);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    
    // Add some randomness to amounts (±20%)
    const variance = 0.8 + (Math.random() * 0.4); // 0.8 to 1.2
    const amount = Math.round(template.amount * variance * 100) / 100;
    
    const transaction: Transaction = {
      id: uuidv4(),
      date: date.toISOString().split('T')[0], // YYYY-MM-DD format
      card: template.card,
      amount: parseCurrencyToSmallestUnit(amount),
      currency: 'USD',
      originalDescription: template.originalDescription,
      description: template.description,
      category: template.category,
      comment: template.comment,
      isDuplicate: false,
      isIncome: template.isIncome,
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        aiEnriched: false,
        version: 1,
        source: 'sample'
      }
    };
    
    selectedSamples.push(transaction);
  }
  
  return selectedSamples;
} 