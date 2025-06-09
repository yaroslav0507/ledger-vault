export function formatCurrency(amount: number, currency: string = 'USD', digits?: number): string {
  // Convert from smallest unit (cents) to main currency unit
  const mainAmount = amount / 100;
  
  // Handle currencies that don't have fractional units
  const currencyConfig = SUPPORTED_CURRENCIES.find(c => c.code === currency);
  const fractionDigits = digits !== undefined ? digits : (currencyConfig?.fractionDigits ?? 2);
  
  // Special formatting for UAH - Ukrainian convention places ₴ after amount
  if (currency === 'UAH') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits
    }).format(mainAmount).replace('UAH', '') + ' ₴';
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
    // Fallback for unsupported currencies - consistent format with proper number formatting
    const multiplier = fractionDigits === 0 ? 1 : 100;
    const displayAmount = amount / multiplier;
    const formattedNumber = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits
    }).format(displayAmount);
    
    const symbol = getCurrencySymbol(currency);
    return `${formattedNumber} ${symbol}`;
  }
}

export function parseCurrencyToSmallestUnit(amount: string | number, currency: string = 'USD'): number {
  if (typeof amount === 'string') {
    // Remove currency symbols and commas, but preserve minus sign
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
  
  // Check for currency symbols first (more reliable)
  for (const currency of SUPPORTED_CURRENCIES) {
    if (currency.symbol && text.includes(currency.symbol)) {
      return currency.code;
    }
  }
  
  // Then check for currency codes
  for (const currency of SUPPORTED_CURRENCIES) {
    if (textUpper.includes(currency.code)) {
      return currency.code;
    }
  }
  
  // Check for currency names and variations
  for (const currency of SUPPORTED_CURRENCIES) {
    for (const name of currency.names) {
      if (textUpper.includes(name.toUpperCase())) {
        return currency.code;
      }
    }
  }
  
  // Extended detection for common currencies not in our main list
  const extendedCurrencyDetection = [
    { pattern: /JPY|¥|YEN|円/i, code: 'JPY' },
    { pattern: /CHF|FRANC/i, code: 'CHF' },
    { pattern: /CAD|C\$|CANADIAN/i, code: 'CAD' },
    { pattern: /AUD|A\$|AUSTRALIAN/i, code: 'AUD' },
    { pattern: /CNY|¥|YUAN|人民币/i, code: 'CNY' },
    { pattern: /RUB|₽|РУБЛ/i, code: 'RUB' },
    { pattern: /PLN|ZŁ|ZŁOTY/i, code: 'PLN' },
    { pattern: /CZK|КЧ|КОРОН/i, code: 'CZK' },
    { pattern: /HUF|FT|ФОРИНТ/i, code: 'HUF' },
    { pattern: /RON|LEI|ЛЕЙ/i, code: 'RON' },
    { pattern: /BGN|ЛВ|LEV/i, code: 'BGN' },
    { pattern: /SEK|KR|КРОН|SWEDISH/i, code: 'SEK' },
    { pattern: /NOK|KR|НОРВЕЖ/i, code: 'NOK' },
    { pattern: /DKK|KR|ДАНСК/i, code: 'DKK' }
  ];
  
  for (const { pattern, code } of extendedCurrencyDetection) {
    if (pattern.test(text)) {
      return code;
    }
  }
  
  return null;
}

export function getCurrencySymbol(currencyCode: string): string {
  const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
  if (currency) {
    return currency.symbol;
  }
  
  // Fallback symbols for common currencies
  const commonSymbols: { [key: string]: string } = {
    'JPY': '¥',
    'CHF': 'CHF',
    'CAD': 'C$',
    'AUD': 'A$',
    'CNY': '¥',
    'RUB': '₽',
    'PLN': 'zł',
    'CZK': 'Kč',
    'HUF': 'Ft',
    'RON': 'lei',
    'BGN': 'лв',
    'SEK': 'kr',
    'NOK': 'kr',
    'DKK': 'kr'
  };
  
  return commonSymbols[currencyCode] ?? currencyCode;
}

export function getCurrencyName(currencyCode: string): string {
  const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
  if (currency) {
    return currency.name;
  }
  
  // Fallback names for common currencies
  const commonNames: { [key: string]: string } = {
    'JPY': 'Japanese Yen',
    'CHF': 'Swiss Franc',
    'CAD': 'Canadian Dollar',
    'AUD': 'Australian Dollar',
    'CNY': 'Chinese Yuan',
    'RUB': 'Russian Ruble',
    'PLN': 'Polish Złoty',
    'CZK': 'Czech Koruna',
    'HUF': 'Hungarian Forint',
    'RON': 'Romanian Leu',
    'BGN': 'Bulgarian Lev',
    'SEK': 'Swedish Krona',
    'NOK': 'Norwegian Krone',
    'DKK': 'Danish Krone'
  };
  
  return commonNames[currencyCode] ?? currencyCode;
}

export function isSupportedCurrency(currencyCode: string): boolean {
  return SUPPORTED_CURRENCIES.some(c => c.code === currencyCode);
}

export function addCurrencySupport(currencyCode: string): void {
  // Try to auto-detect currency properties if not in our supported list
  if (!isSupportedCurrency(currencyCode)) {
    try {
      // Use Intl to get currency info
      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
      });
      
      console.log(`ℹ️ Adding temporary support for currency: ${currencyCode}`);
      console.log(`ℹ️ Symbol: ${getCurrencySymbol(currencyCode)}`);
      console.log(`ℹ️ Name: ${getCurrencyName(currencyCode)}`);
    } catch (error) {
      console.warn(`⚠️ Currency ${currencyCode} may not be fully supported`);
    }
  }
}

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  fractionDigits: number;
  names: string[];
}

// Enhanced supported currencies with better name variations
export const SUPPORTED_CURRENCIES: CurrencyInfo[] = [
  { 
    code: 'UAH', 
    symbol: '₴', 
    name: 'Ukrainian Hryvnia', 
    fractionDigits: 2,
    names: ['UAH', 'Hryvnia', 'Гривна', 'Гривень', 'Ukrainian Hryvnia', 'Hryvnias', 'Грн']
  },
  { 
    code: 'USD', 
    symbol: '$', 
    name: 'US Dollar', 
    fractionDigits: 2,
    names: ['USD', 'Dollar', 'Dollars', 'US Dollar', 'American Dollar', 'Buck', 'Greenback']
  },
  { 
    code: 'EUR', 
    symbol: '€', 
    name: 'Euro', 
    fractionDigits: 2,
    names: ['EUR', 'Euro', 'Euros', 'European Euro']
  },
  { 
    code: 'GBP', 
    symbol: '£', 
    name: 'British Pound', 
    fractionDigits: 2,
    names: ['GBP', 'Pound', 'Pounds', 'British Pound', 'Sterling', 'Pound Sterling']
  },
  { 
    code: 'ILS', 
    symbol: '₪', 
    name: 'Israeli New Shekel', 
    fractionDigits: 2,
    names: ['ILS', 'Shekel', 'Shekels', 'Israeli Shekel', 'New Shekel', 'NIS']
  },
  { 
    code: 'JPY', 
    symbol: '¥', 
    name: 'Japanese Yen', 
    fractionDigits: 0,
    names: ['JPY', 'Yen', 'Japanese Yen', 'Yen']
  },
  { 
    code: 'CHF', 
    symbol: 'CHF', 
    name: 'Swiss Franc', 
    fractionDigits: 2,
    names: ['CHF', 'Franc', 'Swiss Franc', 'Francs']
  },
  { 
    code: 'CAD', 
    symbol: 'C$', 
    name: 'Canadian Dollar', 
    fractionDigits: 2,
    names: ['CAD', 'Canadian Dollar', 'Canadian Dollars', 'Loonie']
  },
  { 
    code: 'AUD', 
    symbol: 'A$', 
    name: 'Australian Dollar', 
    fractionDigits: 2,
    names: ['AUD', 'Australian Dollar', 'Australian Dollars', 'Aussie Dollar']
  },
  { 
    code: 'RUB', 
    symbol: '₽', 
    name: 'Russian Ruble', 
    fractionDigits: 2,
    names: ['RUB', 'Ruble', 'Rubles', 'Russian Ruble', 'Рубль', 'Рублей']
  }
] as const; 