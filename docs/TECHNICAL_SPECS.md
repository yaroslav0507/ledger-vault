# 🔧 LedgerVault Technical Specifications

## 📐 Architecture Details

### Project Structure
```
ledger-vault/
├── src/
│   ├── app/
│   │   ├── index.tsx              # Main app entry
│   │   ├── navigation/            # Navigation configuration
│   │   └── providers/             # Context providers
│   ├── features/
│   │   ├── transactions/
│   │   │   ├── model/
│   │   │   │   ├── Transaction.ts    # Type definitions
│   │   │   │   ├── TransactionValidator.ts
│   │   │   │   └── index.ts
│   │   │   ├── storage/
│   │   │   │   ├── TransactionRepository.ts
│   │   │   │   ├── TransactionDatabase.ts
│   │   │   │   └── migrations/
│   │   │   ├── service/
│   │   │   │   ├── TransactionService.ts
│   │   │   │   ├── DuplicateDetectionService.ts
│   │   │   │   └── TransactionAggregationService.ts
│   │   │   ├── store/
│   │   │   │   └── transactionStore.ts
│   │   │   └── ui/
│   │   │       ├── screens/
│   │   │       ├── components/
│   │   │       └── hooks/
│   │   ├── import/
│   │   │   ├── strategies/
│   │   │   │   ├── ImportStrategy.ts
│   │   │   │   ├── XlsImportStrategy.ts
│   │   │   │   └── CsvImportStrategy.ts
│   │   │   ├── service/
│   │   │   │   ├── FileParsingService.ts
│   │   │   │   └── ImportValidationService.ts
│   │   │   └── ui/
│   │   ├── export/
│   │   │   ├── service/
│   │   │   │   ├── EncryptionService.ts
│   │   │   │   ├── ExportService.ts
│   │   │   │   └── PasswordGenerator.ts
│   │   │   └── ui/
│   │   ├── ai/
│   │   │   ├── service/
│   │   │   │   ├── AIService.ts
│   │   │   │   ├── PromptTemplates.ts
│   │   │   │   └── AIResponseValidator.ts
│   │   │   └── types/
│   │   ├── dashboard/
│   │   │   ├── service/
│   │   │   │   └── AnalyticsService.ts
│   │   │   └── ui/
│   │   ├── auth/
│   │   └── settings/
│   ├── shared/
│   │   ├── ui/
│   │   │   ├── components/    # Reusable UI components
│   │   │   ├── theme/         # Theme configuration
│   │   │   └── styles/        # Shared styles
│   │   ├── hooks/
│   │   │   ├── useStorage.ts
│   │   │   ├── useAsyncOperation.ts
│   │   │   └── useDebounce.ts
│   │   ├── utils/
│   │   │   ├── dateUtils.ts
│   │   │   ├── currencyUtils.ts
│   │   │   ├── validationUtils.ts
│   │   │   └── errorUtils.ts
│   │   ├── constants/
│   │   │   ├── categories.ts
│   │   │   ├── currencies.ts
│   │   │   └── config.ts
│   │   └── types/
│   │       └── global.ts
│   └── tests/
│       ├── __mocks__/
│       ├── fixtures/
│       └── utils/
├── assets/
├── docs/
├── expo-config/
└── package.json
```

---

## 🗄️ Data Models & Interfaces

### Core Transaction Interface
```typescript
interface Transaction {
  id: string;                    // UUID v4
  date: string;                  // ISO 8601 (YYYY-MM-DD)
  card: string;                  // Card identifier (e.g., "Monzo", "Santander")
  amount: number;                // Amount in smallest currency unit (cents)
  currency: string;              // ISO 4217 currency code (GBP, USD, EUR)
  originalDescription: string;    // Raw description from bank
  description: string;           // Cleaned/AI-enhanced description
  category: string;              // Category name
  comment?: string;              // User or AI-generated comment
  tags?: string[];               // Optional tags for flexible categorization
  isDuplicate: boolean;          // Duplicate detection flag
  isIncome: boolean;             // Income vs expense flag
  isRecurring?: boolean;         // Recurring transaction flag
  merchantInfo?: MerchantInfo;   // Optional merchant details
  location?: TransactionLocation; // Optional location data
  metadata: TransactionMetadata; // System metadata
}

interface MerchantInfo {
  name: string;
  category: string;
  website?: string;
  logo?: string;
}

interface TransactionLocation {
  latitude?: number;
  longitude?: number;
  address?: string;
  city?: string;
  country?: string;
}

interface TransactionMetadata {
  createdAt: string;            // ISO timestamp
  updatedAt: string;            // ISO timestamp
  importedAt?: string;          // When imported from file
  importBatchId?: string;       // Batch identifier for imports
  aiEnriched: boolean;          // Whether AI has processed this
  aiEnrichedAt?: string;        // When AI enrichment occurred
  version: number;              // For optimistic locking
  source: 'manual' | 'import' | 'api'; // How transaction was created
}
```

### Import Related Interfaces
```typescript
interface ImportFile {
  name: string;
  type: 'xls' | 'xlsx' | 'csv';
  size: number;
  content: ArrayBuffer;
  checksum: string;              // For duplicate file detection
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
  dateFormat: string;
  hasHeader: boolean;
}
```

### AI Service Interfaces
```typescript
interface AIEnrichmentRequest {
  transactions: Partial<Transaction>[];
  context?: {
    userPreferences?: UserPreferences;
    existingCategories?: string[];
    merchantHistory?: MerchantInfo[];
  };
}

interface AIEnrichmentResponse {
  enrichedTransactions: AIEnrichedTransaction[];
  confidence: number;
  processingTime: number;
}

interface AIEnrichedTransaction {
  id: string;
  suggestions: {
    description?: string;
    category?: string;
    comment?: string;
    tags?: string[];
    merchantInfo?: MerchantInfo;
  };
  confidence: {
    description?: number;
    category?: number;
    comment?: number;
  };
}
```

---

## 🏪 Store Architecture (Zustand)

### Transaction Store
```typescript
interface TransactionStore {
  // State
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  filters: TransactionFilters;
  pagination: PaginationState;
  
  // Actions
  loadTransactions: (params?: LoadParams) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'metadata'>) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  bulkOperations: (operations: BulkOperation[]) => Promise<void>;
  
  // Filters & Search
  setFilters: (filters: Partial<TransactionFilters>) => void;
  clearFilters: () => void;
  searchTransactions: (query: string) => void;
  
  // Pagination
  loadMore: () => Promise<void>;
  goToPage: (page: number) => Promise<void>;
  
  // Utilities
  getTransactionsByDateRange: (start: string, end: string) => Transaction[];
  getTransactionsByCategory: (category: string) => Transaction[];
  calculateTotals: () => TransactionTotals;
}

interface TransactionFilters {
  dateRange?: {
    start: string;
    end: string;
  };
  categories?: string[];
  cards?: string[];
  amountRange?: {
    min: number;
    max: number;
  };
  isIncome?: boolean;
  searchQuery?: string;
  tags?: string[];
}
```

### Import Store
```typescript
interface ImportStore {
  // State
  currentFile: ImportFile | null;
  importResult: ImportResult | null;
  isProcessing: boolean;
  progress: number;
  
  // Actions
  selectFile: (file: ImportFile) => void;
  previewImport: () => Promise<ImportResult>;
  confirmImport: (options: ImportOptions) => Promise<void>;
  cancelImport: () => void;
  
  // Duplicate handling
  resolveDuplicates: (resolutions: DuplicateResolution[]) => void;
  markAsNotDuplicate: (transactionId: string) => void;
}
```

---

## 💾 Storage Layer Specifications

### Database Schema (Dexie.js)
```typescript
export class LedgerVaultDatabase extends Dexie {
  transactions!: Table<Transaction>;
  categories!: Table<Category>;
  importHistory!: Table<ImportHistory>;
  settings!: Table<Setting>;

  constructor() {
    super('LedgerVaultDB');
    
    this.version(1).stores({
      transactions: '++id, date, card, category, amount, isIncome, createdAt, importBatchId',
      categories: '++id, name, color, parentId',
      importHistory: '++id, filename, importedAt, transactionCount',
      settings: '++key, value'
    });

    // Indexes for performance
    this.version(2).stores({
      transactions: '++id, date, card, category, amount, isIncome, createdAt, importBatchId, [date+card], [date+category]'
    });
  }
}
```

### Repository Pattern
```typescript
export interface ITransactionRepository {
  // CRUD operations
  create(transaction: Omit<Transaction, 'id'>): Promise<Transaction>;
  findById(id: string): Promise<Transaction | null>;
  findMany(filters?: TransactionFilters, pagination?: PaginationParams): Promise<PaginatedResult<Transaction>>;
  update(id: string, updates: Partial<Transaction>): Promise<Transaction>;
  delete(id: string): Promise<void>;
  
  // Bulk operations
  bulkCreate(transactions: Omit<Transaction, 'id'>[]): Promise<Transaction[]>;
  bulkUpdate(updates: { id: string; updates: Partial<Transaction> }[]): Promise<void>;
  bulkDelete(ids: string[]): Promise<void>;
  
  // Queries
  findDuplicates(transaction: Partial<Transaction>): Promise<Transaction[]>;
  findByDateRange(start: string, end: string): Promise<Transaction[]>;
  findByCategory(category: string): Promise<Transaction[]>;
  searchByDescription(query: string): Promise<Transaction[]>;
  
  // Aggregations
  getTotalsByPeriod(period: 'day' | 'week' | 'month' | 'year', start: string, end: string): Promise<PeriodTotals[]>;
  getCategoryTotals(start: string, end: string): Promise<CategoryTotals[]>;
  getSpendingTrends(period: 'month' | 'week', count: number): Promise<TrendData[]>;
}
```

---

## 🔐 Security Specifications

### Encryption Service
```typescript
export interface IEncryptionService {
  // Core encryption
  encrypt(data: string, password: string): Promise<EncryptedData>;
  decrypt(encryptedData: EncryptedData, password: string): Promise<string>;
  
  // Key derivation
  deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey>;
  generateSalt(): Uint8Array;
  
  // Validation
  validatePassword(password: string): PasswordValidation;
  generateSecurePassword(length?: number): string;
}

interface EncryptedData {
  data: string;          // Base64 encoded encrypted data
  salt: string;          // Base64 encoded salt
  iv: string;            // Base64 encoded initialization vector
  algorithm: string;     // Encryption algorithm used
  keyDerivation: string; // Key derivation method
  version: number;       // Encryption format version
}

interface PasswordValidation {
  isValid: boolean;
  strength: 'weak' | 'medium' | 'strong';
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumbers: boolean;
    hasSpecialChars: boolean;
  };
}
```

---

## 🤖 AI Integration Specifications

### AI Service Configuration
```typescript
interface AIServiceConfig {
  provider: 'openai' | 'anthropic';
  apiKey: string;
  model: string;
  baseURL?: string;
  timeout: number;
  retryAttempts: number;
  batchSize: number;
}

interface AIPromptTemplate {
  name: string;
  template: string;
  variables: string[];
  maxTokens: number;
  temperature: number;
}

// Prompt templates
export const PROMPT_TEMPLATES = {
  CATEGORIZE_TRANSACTION: {
    name: 'categorize_transaction',
    template: `
      Analyze the following transaction and provide categorization:
      
      Transaction: {description}
      Amount: {amount} {currency}
      Date: {date}
      Merchant: {merchant}
      
      Based on this information, provide:
      1. A clear, concise description (max 50 chars)
      2. The most appropriate category from: {categories}
      3. A brief comment explaining the transaction (optional)
      4. Confidence score (0-100)
      
      Respond in JSON format.
    `,
    variables: ['description', 'amount', 'currency', 'date', 'merchant', 'categories'],
    maxTokens: 200,
    temperature: 0.3
  },
  
  BATCH_ENRICHMENT: {
    name: 'batch_enrichment',
    template: `
      Analyze the following transactions and provide enrichment for each:
      
      Transactions:
      {transactions}
      
      Available categories: {categories}
      
      For each transaction, provide:
      - Enhanced description
      - Category assignment
      - Optional comment
      - Confidence score
      
      Respond with a JSON array matching the input order.
    `,
    variables: ['transactions', 'categories'],
    maxTokens: 1000,
    temperature: 0.3
  }
};
```

---

## 🎨 UI Component Specifications

### Design System
```typescript
// Theme configuration
interface Theme {
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    background: string;
    surface: string;
    text: {
      primary: string;
      secondary: string;
      disabled: string;
    };
    border: string;
  };
  
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  
  typography: {
    h1: TextStyle;
    h2: TextStyle;
    h3: TextStyle;
    body: TextStyle;
    caption: TextStyle;
  };
  
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    round: number;
  };
}

// Component specifications
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'outline' | 'ghost';
  size: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  isDisabled?: boolean;
  onPress: () => void;
  children: React.ReactNode;
}

interface TransactionCardProps {
  transaction: Transaction;
  onPress?: () => void;
  onLongPress?: () => void;
  showCategory?: boolean;
  showCard?: boolean;
  isSelected?: boolean;
}
```

---

## 📱 Performance Specifications

### Optimization Requirements
- **Initial load time**: < 2 seconds on average devices
- **Transaction list rendering**: Handle 10,000+ items with virtualization
- **Search performance**: < 500ms for full-text search
- **Import performance**: Process 5,000 transactions in < 30 seconds
- **Memory usage**: < 100MB for typical usage patterns
- **Database operations**: 90% of queries complete in < 100ms

### Implementation Strategies
```typescript
// Virtual list for large datasets
interface VirtualListConfig {
  itemHeight: number;
  overscan: number;
  bufferSize: number;
  windowSize: number;
}

// Pagination configuration
interface PaginationConfig {
  pageSize: number;
  prefetchPages: number;
  maxCachedPages: number;
}

// Caching strategy
interface CacheConfig {
  maxSize: number;          // Maximum cache size in MB
  ttl: number;              // Time to live in milliseconds
  persistOnDisk: boolean;   // Whether to persist cache
  compressionEnabled: boolean;
}
```

---

## 🧪 Testing Specifications

### Test Categories
1. **Unit Tests** (Jest + React Native Testing Library)
2. **Integration Tests** (Database + API interactions)
3. **E2E Tests** (Detox for mobile, Playwright for web)
4. **Performance Tests** (Large dataset scenarios)
5. **Security Tests** (Encryption/decryption validation)

### Test Coverage Requirements
- **Minimum overall coverage**: 85%
- **Critical paths coverage**: 95%
- **Business logic coverage**: 90%
- **UI component coverage**: 80%

This technical specification provides the detailed implementation guidance needed to build LedgerVault according to the architectural blueprint. 