export function formatCurrency(amount: number, currency: string = 'USD'): string {
  // Convert from smallest unit (cents) to main currency unit
  const mainAmount = amount / 100;
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(mainAmount);
}

export function parseCurrencyToSmallestUnit(amount: string | number): number {
  if (typeof amount === 'string') {
    // Remove currency symbols and commas
    const cleanAmount = amount.replace(/[^0-9.-]/g, '');
    const numericAmount = parseFloat(cleanAmount);
    return Math.round(numericAmount * 100);
  }
  
  return Math.round(amount * 100);
}

export function formatAmount(amount: number): string {
  const mainAmount = amount / 100;
  return mainAmount.toFixed(2);
}

export const SUPPORTED_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' }
] as const; 