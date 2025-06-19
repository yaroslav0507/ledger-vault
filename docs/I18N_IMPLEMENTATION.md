# 🌍 Internationalization (i18n) Implementation

## Overview

LedgerVault includes comprehensive internationalization support using `react-i18next`, providing multi-language support for the application interface. The implementation includes automatic language detection, translation management, and easy language switching.

## Supported Languages

- **English (en)** - Default language
- **Ukrainian (uk)** - Primary target language

## Technical Implementation

### Dependencies

- `react-i18next` - React integration for i18next
- `i18next` - Core internationalization framework
- `react-native-localize` - Device locale detection

### File Structure

```
src/shared/i18n/
├── index.ts              # Main i18n configuration
├── useTranslation.ts     # Custom translation hook
└── locales/
    ├── en.json          # English translations
    └── uk.json          # Ukrainian translations
```

### Configuration

The i18n system is configured in `src/shared/i18n/index.ts`:

- **Automatic Language Detection**: Uses device locale settings
- **Fallback Language**: English (en)
- **JSON Compatibility**: v3 format for better React Native support
- **Suspense**: Disabled for React Native compatibility

### Translation Keys Structure

Translations are organized into logical namespaces:

```json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete"
  },
  "navigation": {
    "transactions": "Transactions",
    "analytics": "Analytics",
    "settings": "Settings"
  },
  "transactions": {
    "addTransaction": "Add Transaction",
    "editTransaction": "Edit Transaction"
  },
  "analytics": {
    "totalIncome": "Total Income",
    "totalExpenses": "Total Expenses"
  },
  "settings": {
    "title": "Settings",
    "language": "Language"
  }
}
```

### Features

#### 1. Pluralization Support

The implementation supports plural forms for different languages:

```typescript
t('transactions.noFilteredTransactionsDescription', { count: transactions.length })
```

#### 2. Interpolation

Dynamic values can be inserted into translations:

```typescript
t('analytics.noFilteredAnalytics', { count: transactions.length })
```

#### 3. Language Switching

Users can switch languages through the Settings screen:

```typescript
const { changeLanguage, getCurrentLanguage } = useTranslation();
changeLanguage('uk'); // Switch to Ukrainian
```

#### 4. Automatic Language Detection

The app automatically detects the user's device language and selects the appropriate translation:

```typescript
const getDeviceLanguage = () => {
  const locales = RNLocalize.getLocales();
  if (locales && locales.length > 0) {
    const locale = locales[0];
    if (locale.languageCode === 'uk' || locale.languageCode === 'ua') {
      return 'uk';
    }
  }
  return 'en';
};
```

## Usage

### Basic Translation

```typescript
import { useTranslation } from '../shared/i18n/useTranslation';

const MyComponent = () => {
  const { t } = useTranslation();
  
  return (
    <Text>{t('common.save')}</Text>
  );
};
```

### Language Management

```typescript
const { t, changeLanguage, getCurrentLanguage, getAvailableLanguages } = useTranslation();

// Get current language
const currentLang = getCurrentLanguage(); // 'en' or 'uk'

// Change language
changeLanguage('uk');

// Get available languages
const languages = getAvailableLanguages(); // ['en', 'uk']
```

## Translation Keys Reference

### Common Actions
- `common.save` - Save
- `common.cancel` - Cancel
- `common.delete` - Delete
- `common.edit` - Edit
- `common.add` - Add
- `common.update` - Update
- `common.back` - Back
- `common.close` - Close

### Navigation
- `navigation.transactions` - Transactions
- `navigation.analytics` - Analytics
- `navigation.settings` - Settings

### Transaction Management
- `transactions.addTransaction` - Add Transaction
- `transactions.editTransaction` - Edit Transaction
- `transactions.noTransactions` - No transactions yet
- `transactions.loadingTransactions` - Loading transactions...

### Analytics
- `analytics.title` - Analytics
- `analytics.totalIncome` - Total Income
- `analytics.totalExpenses` - Total Expenses
- `analytics.netIncome` - Net Income
- `analytics.insights.positiveCashFlow` - Positive cash flow insights
- `analytics.insights.topSpendingCategory` - Top spending category insights
- `analytics.insights.netIncomeDecreased` - Net income change insights
- `analytics.insights.savingsRatePositive` - Savings rate insights
- (and other insight keys...)

### Settings
- `settings.title` - Settings
- `settings.language` - Language
- `settings.defaultCurrency` - Default Currency
- `settings.exportData` - Export Data
- `settings.clearAllData` - Clear All Data

### Filters
- `filters.title` - Filters
- `filters.dateRange` - Date Range
- `filters.categories` - Categories
- `filters.today` - Today
- `filters.week` - This Week
- `filters.month` - This Month

### Error Messages
- `errors.required` - This field is required
- `errors.invalidAmount` - Please enter a valid amount
- `errors.networkError` - Network error occurred

## Implementation Status

### ✅ Completed Components
- App.tsx (Navigation labels)
- AddTransactionModal
- SettingsScreen
- useBaseScreen hook (Empty states)
- AnalyticsScreen (complete with insights and month localization)
- TransactionFilter component
- AnalyticsService (insights generation and month formatting)
- ActionButtonRow component

### 🔄 In Progress
- TransactionListScreen
- Filter components
- Import components

### 📋 Planned
- Error messages
- Validation messages
- Date formatting
- Currency formatting

## Ukrainian Language Support

The Ukrainian translation includes:
- Proper plural forms handling
- Culturally appropriate terminology
- Accurate financial and technical terms
- Consistent UI terminology

### Ukrainian Plural Rules

Ukrainian has complex plural rules handled by i18next:
- 1: one form (транзакція)
- 2-4: few form (транзакції)
- 5+: many form (транзакцій)

## Best Practices

### 1. Key Naming Convention
- Use dot notation for namespacing: `transactions.addTransaction`
- Use camelCase for key names
- Group related keys by feature/component

### 2. Dynamic Content
- Use interpolation for dynamic values: `{{count}}`
- Use pluralization for countable items: `{{count, plural, one {...} other {...}}}`

### 3. Context-Aware Translations
- Provide context in key names: `deleteConfirmMessage` vs `deleteTitle`
- Use descriptive suffixes: `Placeholder`, `Description`, `Title`

### 4. Consistent Terminology
- Maintain consistency across similar contexts
- Use established terminology from the target language

## Future Enhancements

### Additional Languages
- Russian (ru)
- Polish (pl)
- German (de)
- French (fr)

### Advanced Features
- Right-to-left (RTL) language support
- ✅ Date/time localization (month names implemented)
- Number formatting localization
- Currency formatting per locale
- Regional preferences

### Developer Tools
- Translation validation
- Missing translation detection
- Unused translation cleanup
- Translation coverage reports

## Troubleshooting

### Common Issues

1. **Missing Translations**: Check console for missing key warnings
2. **Plural Forms**: Ensure proper plural syntax in translation files
3. **Language Not Switching**: Verify language code matches available locales
4. **Device Detection**: Check React Native Localize configuration

### Debug Mode

Enable debug mode to see translation keys in development:

```typescript
i18n.init({
  debug: __DEV__,
  // ... other config
});
``` 