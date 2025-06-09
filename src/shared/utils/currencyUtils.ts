export function formatCurrency(amount: number, currency: string = 'USD'): string {
  // Convert from smallest unit (cents) to main currency unit
  const mainAmount = amount / 100;
  
  // Handle currencies that don't have fractional units
  const currencyConfig = SUPPORTED_CURRENCIES.find(c => c.code === currency);
  const fractionDigits = currencyConfig?.fractionDigits ?? 2;
  
  // Special formatting for UAH - Ukrainian convention places ₴ after amount
  if (currency === 'UAH') {
    return `${mainAmount.toFixed(fractionDigits)}₴`;
  }
  
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      currencyDisplay: 'symbol',
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits
    }).format(mainAmount);
  } catch (error) {
    // Fallback for unsupported currencies - consistent format with code after amount
    const multiplier = fractionDigits === 0 ? 1 : 100;
    const displayAmount = amount / multiplier;
    return `${displayAmount.toFixed(fractionDigits)} ${currency}`;
  }
}

export function parseCurrencyToSmallestUnit(amount: string | number, currency: string = 'USD'): number {
  if (typeof amount === 'string') {
    // Remove currency symbols and commas
    const cleanAmount = amount.replace(/[^0-9.-]/g, '');
    const numericAmount = parseFloat(cleanAmount);
    
    // Handle currencies without fractional units (like JPY, KRW)
    const currencyConfig = SUPPORTED_CURRENCIES.find(c => c.code === currency);
    const multiplier = currencyConfig?.fractionDigits === 0 ? 1 : 100;
    
    return Math.round(numericAmount * multiplier);
  }
  
  const currencyConfig = SUPPORTED_CURRENCIES.find(c => c.code === currency);
  const multiplier = currencyConfig?.fractionDigits === 0 ? 1 : 100;
  return Math.round(amount * multiplier);
}

export function formatAmount(amount: number, currency: string = 'USD'): string {
  const currencyConfig = SUPPORTED_CURRENCIES.find(c => c.code === currency);
  const fractionDigits = currencyConfig?.fractionDigits ?? 2;
  const multiplier = fractionDigits === 0 ? 1 : 100;
  const mainAmount = amount / multiplier;
  return mainAmount.toFixed(fractionDigits);
}

export function detectCurrencyFromText(text: string): string | null {
  if (!text) return null;
  
  const textUpper = text.toUpperCase();
  
  // Check for currency symbols
  for (const currency of SUPPORTED_CURRENCIES) {
    if (currency.symbol && text.includes(currency.symbol)) {
      return currency.code;
    }
    
    // Check for currency codes
    if (textUpper.includes(currency.code)) {
      return currency.code;
    }
    
    // Check for currency names and variations
    for (const name of currency.names) {
      if (textUpper.includes(name.toUpperCase())) {
        return currency.code;
      }
    }
  }
  
  return null;
}

export function getCurrencySymbol(currencyCode: string): string {
  const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
  return currency?.symbol ?? currencyCode;
}

export function getCurrencyName(currencyCode: string): string {
  const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
  return currency?.name ?? currencyCode;
}

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  fractionDigits: number;
  names: string[];
}

export const SUPPORTED_CURRENCIES: CurrencyInfo[] = [
  { 
    code: 'UAH', 
    symbol: '₴', 
    name: 'Ukrainian Hryvnia', 
    fractionDigits: 2,
    names: ['UAH', 'Hryvnia', 'Гривна', 'Гривень', 'Ukrainian Hryvnia']
  },
  { 
    code: 'USD', 
    symbol: '$', 
    name: 'US Dollar', 
    fractionDigits: 2,
    names: ['USD', 'Dollar', 'Dollars', 'US Dollar']
  },
  { 
    code: 'EUR', 
    symbol: '€', 
    name: 'Euro', 
    fractionDigits: 2,
    names: ['EUR', 'Euro', 'Euros']
  },
  { 
    code: 'GBP', 
    symbol: '£', 
    name: 'British Pound', 
    fractionDigits: 2,
    names: ['GBP', 'Pound', 'Pounds', 'British Pound', 'Sterling']
  },
  { 
    code: 'ILS', 
    symbol: '₪', 
    name: 'Israeli New Shekel', 
    fractionDigits: 2,
    names: ['ILS', 'Shekel', 'Shekels', 'Israeli Shekel', 'New Shekel']
  }
] as const; 