# 🔧 LedgerVault Technical Specifications

## 📐 Architecture Overview

LedgerVault is a React Native financial transaction management app built with Expo, designed primarily for the Ukrainian market but supporting international currencies. The app features a modern, responsive interface with comprehensive import capabilities for bank statements.

### Project Structure
```
ledger-vault/
├── src/
│   ├── features/
│   │   ├── transactions/
│   │   │   ├── model/
│   │   │   │   ├── Transaction.ts         # Core transaction types
│   │   │   │   ├── validation.ts          # Zod validation schemas
│   │   │   │   └── index.ts
│   │   │   ├── storage/
│   │   │   │   ├── TransactionRepository.ts
│   │   │   │   └── TransactionDatabase.ts  # Dexie IndexedDB wrapper
│   │   │   ├── store/
│   │   │   │   └── transactionStore.ts     # Zustand state management
│   │   │   └── ui/
│   │   │       ├── screens/
│   │   │       │   └── TransactionListScreen.tsx
│   │   │       ├── components/
│   │   │       │   ├── TransactionCard.tsx
│   │   │       │   ├── AddTransactionModal.tsx
│   │   │       │   ├── TransactionFilters.tsx
│   │   │       │   └── BalanceCard.tsx
│   │   │       └── hooks/
│   │   │           ├── useTransactionActions.ts
│   │   │           └── useTransactionFilters.ts
│   │   ├── import/
│   │   │   ├── strategies/
│   │   │   │   ├── ImportStrategy.ts       # Interface definition
│   │   │   │   └── XlsImportStrategy.ts    # Excel/XLSX parser
│   │   │   ├── service/
│   │   │   │   └── ImportService.ts        # Main import orchestrator
│   │   │   └── ui/
│   │   │       ├── components/
│   │   │       │   ├── ImportButton.tsx
│   │   │       │   └── ImportPreviewModal.tsx
│   │   │       └── hooks/
│   │   │           └── useImport.ts
│   │   └── categories/
│   │       └── model/
│   │           └── Category.ts
│   ├── shared/
│   │   ├── ui/
│   │   │   ├── components/                # Reusable UI components
│   │   │   ├── theme/
│   │   │   │   └── theme.ts               # React Native Paper theme
│   │   │   └── styles/
│   │   ├── hooks/                         # Shared custom hooks
│   │   ├── utils/
│   │   │   ├── dateUtils.ts               # Date formatting/parsing
│   │   │   └── currencyUtils.ts           # Multi-currency support
│   │   ├── constants/                     # App constants
│   │   └── types/                         # Shared TypeScript types
│   └── tests/
│       └── fixtures/
├── assets/                                # Static assets
├── docs/                                  # Documentation
├── app.json                               # Expo configuration
├── App.tsx                                # Main app component
├── index.ts                               # Entry point
├── package.json
└── tsconfig.json
```

---

## 🗄️ Data Models & Interfaces

### Core Transaction Interface
```typescript
interface Transaction {
  id: string;                    // UUID v4
  date: string;                  // ISO 8601 (YYYY-MM-DD)
  card: string;                  // Card/account identifier
  amount: number;                // Amount in smallest currency unit (kopecks/cents)
  currency: string;              // ISO 4217 currency code (UAH, USD, EUR, etc.)
  originalDescription: string;    // Raw description from bank statement
  description: string;           // Cleaned description for display
  category: string;              // Transaction category
  comment?: string;              // User or system-generated comment
  isDuplicate: boolean;          // Duplicate detection flag
  isIncome: boolean;             // Income vs expense classification
  metadata: TransactionMetadata; // System metadata
}

interface TransactionMetadata {
  createdAt: string;            // ISO timestamp
  updatedAt: string;            // ISO timestamp
  importedAt?: string;          // When imported from file
  importBatchId?: string;       // Batch identifier for imports
  aiEnriched: boolean;          // Whether AI has processed this
  version: number;              // For data versioning
  source: 'manual' | 'import';  // How transaction was created
}
```

### Time Period Filtering Interfaces
```typescript
type TimePeriod = 'today' | 'week' | 'month' | 'year' | 'custom';

interface DateRange {
  start: string;                // ISO date (YYYY-MM-DD)
  end: string;                  // ISO date (YYYY-MM-DD)
}

interface TransactionFilters {
  dateRange?: DateRange;        // Time period filter
  categories?: string[];        // Selected categories
  cards?: string[];            // Selected cards/accounts
  amountRange?: {
    min: number;
    max: number;
  };
  isIncome?: boolean;          // Income/expense filter
  searchQuery?: string;        // Text search filter
}
```

### Import System Interfaces
```typescript
interface ImportFile {
  name: string;
  type: 'xls' | 'xlsx' | 'csv';
  size: number;
  content: ArrayBuffer;
}

interface ImportResult {
  transactions: Transaction[];
  duplicates: Transaction[];
  errors: ImportError[];
  summary: ImportSummary;
}

interface ImportError {
  row: number;
  column: string;
  error: string;
  rawData: any;
}

interface ImportSummary {
  totalRows: number;
  successfulImports: number;
  duplicatesFound: number;
  errorsCount: number;
  timeRange: {
    earliest: string;
    latest: string;
  };
}

interface ImportMapping {
  dateColumn: string;
  amountColumn: string;
  descriptionColumn: string;
  cardColumn?: string;
  categoryColumn?: string;
  commentColumn?: string;
  dateFormat: string;
  hasHeader: boolean;
  headerRowIndex?: number;       // Which row contains headers
  skippedInfo?: string[];        // Information about skipped rows
}
```

---

## 🔧 Technical Implementation

### State Management
- **Zustand** for global transaction state management
- **React state** for local component state
- **Persistent storage** via Dexie (IndexedDB wrapper)

### Data Validation
- **Zod schemas** for runtime validation
- **TypeScript** for compile-time type safety
- **Real-time validation** in forms with error display

### Import Processing
- **Strategy pattern** for different file formats
- **Enhanced header detection** supporting multiple header rows
- **Intelligent column mapping** with multilingual support
- **Comprehensive error reporting** with row-level details
- **Duplicate detection** using fuzzy matching algorithms

### Currency Support
- **Multi-currency architecture** supporting any ISO currency
- **Dynamic currency detection** from imported files
- **Automatic currency fallback** with UAH as primary
- **Extended currency support** (UAH, USD, EUR, GBP, ILS, JPY, CHF, CAD, AUD, RUB)
- **Intelligent currency parsing** from various formats and symbols

### Time Period Filtering
- **Quick time period selection** with predefined periods (Today, This Week, This Month, This Year)
- **Custom date range picker** for arbitrary time periods
- **Intelligent period detection** that recognizes current filter state
- **Seamless filter integration** with existing transaction filters
- **Dynamic date range calculation** using date-fns for accurate period boundaries
- **User-friendly time period display** with localized date formatting (DD.MM.YYYY)
- **Horizontal scrollable interface** optimized for mobile devices

This technical specification provides the detailed implementation guidance needed to build LedgerVault according to the architectural blueprint. 