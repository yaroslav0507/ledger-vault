# 🔧 LedgerVault Technical Specifications

## 📐 Architecture Overview

LedgerVault is a React Native financial transaction management app built with Expo, designed primarily for the Ukrainian market but supporting international currencies. The app features a clean, modern interface with comprehensive import capabilities for bank statements and advanced filtering system.

### Project Structure
```
ledger-vault/
├── src/
│   ├── features/
│   │   ├── transactions/
│   │   │   ├── model/
│   │   │   │   └── Transaction.tsx         # Core transaction types & filters
│   │   │   ├── service/
│   │   │   │   └── CategoryService.ts      # Category management with date filtering
│   │   │   ├── storage/
│   │   │   │   ├── TransactionRepository.ts # Data access layer with filtering
│   │   │   │   └── TransactionDatabase.ts  # Dexie IndexedDB wrapper
│   │   │   ├── store/
│   │   │   │   └── transactionStore.ts     # Zustand state management with URL persistence
│   │   │   └── ui/
│   │   │       ├── screens/
│   │   │       │   ├── TransactionListScreen.tsx  # Main screen with FAB navigation
│   │   │       │   └── SettingsScreen.tsx         # App settings & data management
│   │   │       ├── components/
│   │   │       │   ├── TransactionCard.tsx
│   │   │       │   ├── AddTransactionModal.tsx
│   │   │       │   ├── TransactionFilters.tsx     # Advanced filtering modal
│   │   │       │   └── BalanceCard.tsx
│   │   │       └── hooks/
│   │   │           └── useTransactionActions.ts
│   │   ├── import/
│   │   │   ├── strategies/
│   │   │   │   ├── ImportStrategy.ts       # Interface definition
│   │   │   │   └── XlsImportStrategy.ts    # Excel/XLSX parser
│   │   │   ├── service/
│   │   │   │   └── ImportService.ts        # Main import orchestrator
│   │   │   └── ui/
│   │   │       └── components/
│   │   │           ├── ImportButton.tsx
│   │   │           ├── ImportPreviewModal.tsx
│   │   │           └── ColumnMappingModal.tsx  # Manual column mapping
│   │   └── categories/
│   │       └── model/
│   │           └── Category.ts
│   ├── shared/
│   │   ├── ui/
│   │   │   ├── components/
│   │   │   │   ├── ModalHeader.tsx         # Reusable modal header
│   │   │   │   └── TimePeriodSelector.tsx  # Date range selection
│   │   │   ├── theme/
│   │   │   │   └── theme.ts               # React Native Paper theme
│   │   │   └── styles/
│   │   ├── hooks/                         # Shared custom hooks
│   │   ├── utils/
│   │   │   ├── dateUtils.ts               # Date formatting/parsing utilities
│   │   │   ├── currencyUtils.ts           # Multi-currency support
│   │   │   └── filterPersistence.ts       # URL query parameter management
│   │   ├── constants/                     # App constants
│   │   └── types/                         # Shared TypeScript types
│   └── tests/
│       └── fixtures/
├── assets/                                # Static assets
├── docs/                                  # Documentation
├── app.json                               # Expo configuration
├── App.tsx                                # Main app component (direct rendering)
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
  date: string;                  // ISO 8601 (YYYY-MM-DDTHH:mm:ss) - full timestamp
  card: string;                  // Card/account identifier
  amount: number;                // Amount in smallest currency unit (kopecks/cents)
  currency: string;              // ISO 4217 currency code (UAH, USD, EUR, etc.)
  description: string;           // Transaction description
  category: string;              // Transaction category
  comment?: string;              // User or system-generated comment
  isDuplicate: boolean;          // Duplicate detection flag
  isIncome: boolean;             // Income vs expense classification
  createdAt: string;             // Creation timestamp
}
```

### Advanced Filtering System
```typescript
interface TransactionFilters {
  dateRange?: DateRange;                    // Time period filtering
  categories?: string[];                    // Selected categories
  categoriesMode?: 'include' | 'exclude';  // Include or exclude selected categories
  cards?: string[];                         // Selected cards/accounts
  isIncome?: boolean;                       // Income/expense filter
  searchQuery?: string;                     // Text search in descriptions/comments
  amountRange?: {                          // Amount range filtering
    min: number;
    max: number;
  };
}

interface DateRange {
  start: string;                           // ISO date string or special markers
  end: string;                             // ISO date string or year for special periods
}

type TimePeriod = 'today' | 'week' | 'month' | 'lastMonth' | 'quarter' | 
                  'year' | 'spring' | 'summer' | 'autumn' | 'winter' | 'custom';
```

### Import System Interfaces
```typescript
interface ImportResult {
  transactions: Transaction[];
  duplicates: Transaction[];
  errors: ImportError[];
  summary: ImportSummary;
}

interface ImportMapping {
  dateColumn: string;
  amountColumn: string;
  descriptionColumn: string;
  cardColumn?: string;
  categoryColumn?: string;
  commentColumn?: string;
  dateFormat: string;
  hasHeaders: boolean;
  skipRows: number;
}
```

---

## 🏗️ State Management Architecture

### Zustand Store with URL Persistence
```typescript
interface TransactionStore {
  // State
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  filters: TransactionFilters;
  selectedTimePeriod: TimePeriod | undefined;
  
  // Actions
  loadTransactions: () => Promise<void>;
  addTransaction: (request: CreateTransactionRequest) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  clearAllTransactions: () => Promise<void>;
  setFilters: (newFilters: Partial<TransactionFilters>) => void;
  setTimePeriod: (period: TimePeriod, dateRange: DateRange) => void;
  toggleCategoryFilter: (category: string) => void;
  clearFilters: () => void;
  refreshTransactions: () => Promise<void>;
  
  // Computed values
  getBalance: () => { income: number; expenses: number; total: number };
}
```

### URL State Persistence
- Filters automatically saved to URL query parameters
- Shareable URLs with filter state
- Automatic restoration on page reload
- Support for deep linking with filters

---

## 🎨 UI/UX Architecture

### Navigation System
- **FAB-based Navigation**: Floating Action Buttons for primary actions
- **Settings FAB**: Gear icon for accessing app settings
- **Scroll-to-top FAB**: Dynamic visibility based on scroll position
- **Modal-based Settings**: Full-screen settings experience

### Filter System
- **Advanced Filter Modal**: Comprehensive filtering interface
- **Real-time Category Loading**: Context-aware category filtering
- **Include/Exclude Toggle**: Flexible category filtering modes
- **URL State Sync**: Filter persistence across sessions

### Cross-platform Compatibility
- **Web-optimized Alerts**: Custom alert system for web browsers
- **SafeAreaView Integration**: Proper mobile layout handling
- **Responsive Design**: Adaptive layouts for different screen sizes

---

## 💾 Data Storage Architecture

### IndexedDB with Dexie
```typescript
class LedgerVaultDatabase extends Dexie {
  transactions!: Table<Transaction>;

  constructor() {
    super('LedgerVaultDB');
    
    this.version(1).stores({
      transactions: '++id, date, card, category, amount, isIncome, createdAt'
    });

    this.version(2).stores({
      transactions: '++id, date, card, category, amount, isIncome, [date+card], [date+category], createdAt'
    });
  }
}
```

### Repository Pattern
- **TransactionRepository**: Data access abstraction
- **Filtering at Database Level**: Efficient query optimization
- **Special Date Handling**: Custom winter period filtering
- **Category Service**: Context-aware category management

---

## 🔧 Import System Architecture

### Strategy Pattern Implementation
- **ImportStrategy Interface**: Extensible file format support
- **XlsImportStrategy**: Excel/XLSX processing with advanced parsing
- **Column Mapping**: Interactive manual field assignment
- **Smart Detection**: Automatic column type recognition

### Import Workflow
1. **File Selection**: Browser-based file picker
2. **Preview Extraction**: Column analysis and sample data display
3. **Manual Mapping**: Interactive column assignment interface
4. **Validation**: Real-time mapping validation
5. **Preview Import**: Transaction preview with error detection
6. **Confirmation**: Final import with duplicate handling

---

## 🌐 Internationalization & Currency

### Multi-currency Support
- **Dynamic Currency Detection**: Any ISO 4217 currency
- **Symbol Recognition**: ₴, $, €, £, ₪, ¥, etc.
- **Ukrainian Market Focus**: Optimized for UAH transactions
- **Fallback Mechanisms**: Default currency handling

### Language Support
- **Ukrainian/English**: UI text and column recognition
- **European Formats**: Date and number parsing
- **Bank-specific Optimizations**: Major Ukrainian banks

---

## 🔒 Security & Privacy

### Data Privacy
- **Local-only Storage**: All data remains in browser
- **No Server Communication**: Completely offline operation
- **IndexedDB Encryption**: Browser-level security
- **No Analytics Tracking**: Privacy-first design

### Cross-platform Security
- **Platform-specific Alerts**: Native alert dialogs
- **Safe State Management**: Error boundary patterns
- **Validation Layers**: Input sanitization and validation

---

## 📊 Performance Optimizations

### React Performance
- **Optimized Rendering**: UseCallback and useMemo optimization
- **Lazy Loading**: Dynamic component loading
- **Virtual Scrolling**: Efficient large list handling
- **Memory Management**: Proper cleanup and disposal

### Database Performance
- **Compound Indexes**: Optimized filtering queries
- **Batch Operations**: Efficient bulk imports
- **Query Optimization**: Strategic database design
- **Pagination Support**: Ready for large datasets

---

## 🧪 Code Quality & Architecture

### Clean Code Principles
- **Feature-based Structure**: Logical code organization
- **Single Responsibility**: Focused component design
- **Dependency Injection**: Testable architecture
- **Error Handling**: Comprehensive error management

### TypeScript Integration
- **Strict Type Safety**: Full TypeScript coverage
- **Interface-driven Design**: Clear API contracts
- **Generic Types**: Reusable type definitions
- **Runtime Validation**: Zod schema integration

---

## 🚀 Deployment Architecture

### Expo Web Deployment
- **Static Site Generation**: Optimized web builds
- **GitHub Pages**: Automated deployment pipeline
- **Custom Domain Support**: Production-ready hosting
- **Progressive Web App**: Mobile-like experience

### Development Workflow
- **Hot Reload**: Fast development iteration
- **TypeScript Compilation**: Real-time type checking
- **ESLint/Prettier**: Code quality enforcement
- **Git Integration**: Version control best practices