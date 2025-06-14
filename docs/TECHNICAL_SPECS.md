# 🔧 LedgerVault Technical Specifications

## 📐 Architecture Overview

LedgerVault is a React Native financial transaction management app built with Expo, designed primarily for the Ukrainian market but supporting international currencies. The app features a clean, modern interface with comprehensive import capabilities for bank statements and advanced filtering system.

### Project Structure
```
ledger-vault/
├── src/
│   ├── features/
│   │   ├── settings/
│   │   │   └── ui/
│   │   │       └── screens/
│   │   │           └── SettingsScreen.tsx  # Settings feature screen
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
│   │   │       │   └── TransactionListScreen.tsx  # Main transactions screen
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
│   │   │   │   ├── TimePeriodSelector.tsx  # Date range selection
│   │   │   │   └── MetricsSummaryHeader.tsx # Reusable metrics summary layout
│   │   │   ├── theme/
│   │   │   │   └── theme.ts               # React Native Paper theme
│   │   │   └── styles/
│   │   ├── hooks/                         # Shared custom hooks
│   │   ├── utils/
│   │   │   ├── dateUtils.ts               # Date formatting/parsing utilities
│   │   │   ├── currencyUtils.ts           # Multi-currency support
│   │   │   ├── filterPersistence.ts       # URL query parameter management
│   │   │   └── tabPersistence.ts          # Tab state URL persistence
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

### Analytics System Interfaces
```typescript
interface AnalyticsData {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  transactionCount: number;
  categoryBreakdown: CategoryData[];        // Combined categories (legacy)
  expenseCategories: CategoryData[];        // Expense-only categories
  incomeCategories: CategoryData[];         // Income-only categories
  monthlyTrends: MonthlyTrendData[];
  topCategories: CategoryData[];            // Top combined categories
  topExpenseCategories: CategoryData[];     // Top expense categories
}

interface CategoryData {
  category: string;
  amount: number;
  percentage: number;                       // Percentage within category type
  count: number;
  color: string;
}
```

### Enhanced Insights Generation
- **Statistical Financial Analysis**: Comprehensive statistical insights including cash flow, spending patterns, and trends
- **Savings Rate Analysis**: Automatic calculation and benchmarking against standard thresholds
- **Accurate Category Analysis**: Separate analysis of expense and income categories for precise insights
- **Top Spending Category Identification**: Correctly identifies highest expense categories (not income)
- **Trend Analysis**: Month-over-month financial performance comparison with quantified changes
- **Transaction Pattern Analysis**: Average transaction amounts, volume patterns, and spending frequency statistics
- **Category Concentration Metrics**: Statistical analysis of spending concentration across expense categories
- **Expense Ratio Analysis**: Income vs expenses statistical analysis with benchmark comparisons
- **Activity Level Metrics**: Transaction volume statistical analysis and pattern recognition
- **Factual Data Presentation**: Objective statistical insights without advisory language
- **Multi-line Support**: Rich, descriptive statistical insights that utilize full text display capabilities

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
- **Filter Persistence**: Filters automatically saved to URL query parameters
- **Tab Persistence**: Selected tab (transactions/analytics/settings) preserved in URL
- **Shareable URLs**: Complete application state including filters and active tab
- **Automatic Restoration**: Full state restoration on page reload
- **Deep Linking**: Support for direct navigation to specific tabs with filters

**URL Format Examples:**
- **Transactions**: `https://app.com/` (no tab parameter - default)
- **Analytics**: `https://app.com/?tab=analytics`
- **Settings**: `https://app.com/?tab=settings`

---

## 🎨 UI/UX Architecture

### Navigation System
- **Primary Navigation**: Action buttons for main functionality
- **Settings Access**: Gear icon for accessing app settings
- **Scroll-to-top Button**: Dynamic visibility based on scroll position
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
- **Chart Library Migration**: Migrated from react-native-chart-kit to recharts for web compatibility
  - **Web-first Architecture**: Recharts provides native web performance and compatibility
  - **Responsive Charts**: ResponsiveContainer enables automatic sizing for different screen sizes
  - **Enhanced Interactivity**: Native web tooltip support with custom styling
  - **Performance Optimization**: Better performance on web platforms with SVG rendering
  - **Maintained Visual Design**: Preserved all original chart styling and functionality
  - **Components Updated**:
    - CategoryPieChart: Now uses recharts PieChart with Cell components for color mapping
    - MonthlyTrendsChart: Migrated to recharts LineChart with proper axis configuration
    - Custom tooltips with currency formatting maintained across both components

### UI/UX Consistency
- **Standardized Typography**: Consistent font sizes and weights across all components
- **Theme-based Styling**: All components use centralized theme system for colors and spacing
- **Improved Text Layout**: Fixed text wrapping and overflow issues in charts and lists
- **Unified Currency Display**: Consistent currency formatting across analytics and transaction views
- **Enhanced Chart Readability**: Improved font consistency and label sizing in data visualizations
- **Multi-line Insights Support**: Key insights now support longer, more descriptive text with proper line wrapping and visual hierarchy
- **Optimized Chart Layouts**: Full-width utilization in analytics components with proper spacing and alignment
- **Collapsible Analytics Sections**: All analytics sections are now collapsible for better content organization
  - KeyInsights with built-in collapsible functionality
  - CategoryPieChart wrapped in CollapsibleSection with category count
  - MonthlyTrendsChart wrapped in CollapsibleSection with months count
  - Consistent expand/collapse behavior across all sections
  - Space-efficient design allowing users to focus on relevant data
- **Refactored Component Architecture**: Eliminated code duplication and improved maintainability
  - Extracted ActionButtonRow component for reusable action button layouts
  - Created ErrorDisplay component for consistent error messaging
  - Removed duplicate TransactionListHeader component
  - Applied DRY principles to reduce code duplication by ~150 lines
  - Improved component composition and reusability
  - **Clean Architecture Refactoring**: Comprehensive code quality improvements
    - Removed unused components: SummaryCards.tsx and AnalyticsHeader.tsx (~200 lines of dead code)
    - Eliminated duplicate analytics display logic between components
    - Standardized typography usage across all components with theme.typography
    - Unified styling with UI_CONSTANTS for font weights, card heights, and button dimensions
    - Optimized chart components with consistent style patterns
    - Reduced hardcoded styling in favor of centralized theme system
    - Applied DRY principles to minimize code duplication without overengineering

### Reusable UI Components

#### useBaseScreen Hook
A comprehensive custom hook that extracts all common screen logic:
- **Eliminates 80%+ code duplication** between TransactionListScreen and AnalyticsScreen
- **Configurable behavior** through BaseScreenConfig interface
- **Consistent state management** across all screens
- **Built-in performance optimizations** and error handling

Key Features:
- **Initialization Logic**: Database setup and data loading
- **Transaction Management**: All CRUD operations and modal state
- **Scroll Handling**: Scroll-to-top functionality and swipe detection
- **Empty State Management**: Consistent empty state rendering
- **Performance Props**: Pre-configured SectionList optimizations

Usage:
```typescript
const baseScreen = useBaseScreen({
  screenName: 'Analytics',
  loadAvailableCards: false,
  enableScrollToTop: true,
  enableSwipeHandling: false
});
```

#### TransactionModalsContainer Component
An autonomous modal container that manages all transaction-related modals internally:
- **Zero-prop component** - completely self-contained
- **Internal state management** using transaction hooks
- **Eliminates prop drilling** and reduces coupling between screens and modals
- **Consistent modal behavior** across all screens
- **Portal management** for proper modal rendering

Features:
- Add/Edit Transaction Modals
- Import Preview and Column Mapping Modals
- Confirmation Dialogs
- Snackbar notifications with undo functionality
- Uses same hooks as screens for consistent behavior

Usage:
```typescript
// Before: 25+ props needed
<TransactionModalsContainer
  addModalVisible={...}
  onAddModalClose={...}
  onAddTransaction={...}
  editModalVisible={...}
  // ... 20+ more props
/>

// After: Zero props - completely autonomous
<TransactionModalsContainer />
```

#### BaseScreenLayout Component
A common screen layout component that provides consistent structure with configurable headers:
- **Standardized screen layout** across all screens
- **Configurable header component** - can accept any custom header or default to MetricsSummaryHeader
- **Built-in TransactionFilterContainer** as sticky header with filtering functionality
- **Built-in scroll-to-top FAB** functionality
- **Consistent loading and empty states**

Key Features:
- **Unified Layout Structure**: Consistent header, sticky section, and content areas
- **Flexible Header System**: Accept custom header components via `headerComponent` prop
- **Backward Compatibility**: Legacy `headerProps` support for MetricsSummaryHeader
- **Integrated Filtering**: Built-in TransactionFilterContainer with customizable screen titles
- **Flexible Content**: Support for additional header content (like analytics insights)
- **Performance Optimized**: Pre-configured SectionList with optimal settings

Usage Examples:
```typescript
// Option 1: Using custom header component
const customHeader = (
  <AnalyticsHeader 
    balance={balanceData}
    transactionCount={transactionCount}
    currency="UAH"
  />
);

<BaseScreenLayout
  isInitialized={baseScreen.isInitialized}
  screenName="Analytics"
  sections={sectionsData}
  renderItem={renderAnalyticsItem}
  keyExtractor={(item) => item}
  headerComponent={customHeader}
  stickyHeaderProps={stickyHeaderProps}
  emptyStateProps={emptyStateProps}
  showScrollToTop={showScrollToTop}
  onScrollToTop={scrollToTop}
  sectionListRef={scrollViewRef}
  sectionListProps={commonSectionListProps}
/>

// Option 2: Using MetricsSummaryHeader with modifications
const headerComponent = (
  <MetricsSummaryHeader 
    {...baseScreen.renderListHeader()}
    onAddTransaction={undefined} // Remove action buttons for analytics
    onFileSelect={undefined}
  />
);

// Option 3: Legacy support (backward compatibility)
<BaseScreenLayout
  // ... other props
  headerProps={baseScreen.renderListHeader()} // Still works
  // ... other props
/>
```

#### MetricsSummaryHeader Component
A self-contained reusable component that provides financial summary layout with built-in filtering logic:
- **Reuses BalanceCard**: For the cash flow display with income/expense metrics
- **Built-in Filtering**: Internal income/expense filtering logic using transaction store
- **Optional Action Buttons**: Configurable Add Transaction and Import File buttons
- **Consistent Styling**: Uses shared theme and layout patterns
- **Store Integration**: Direct access to transaction store for filtering operations

Key Features:
- **Self-contained Logic**: No need to pass filtering callbacks from parent components
- **Automatic State Management**: Handles filter state updates internally
- **Reusable Across Screens**: Used in both Transactions and Analytics screens
- **Clean API**: Simple props interface without complex callback management

Usage examples:
```typescript
// Transactions Screen (with action buttons)
<MetricsSummaryHeader
  balance={balanceData}
  transactionCount={filteredTransactions.length}
  currency="UAH"
  currentFilters={filters}
  error={error}
  onAddTransaction={openAddModal}
  onFileSelect={handleFileSelect}
/>

// Analytics Screen (display only)
<MetricsSummaryHeader
  balance={balanceData}
  transactionCount={analyticsData.transactionCount}
  currency="UAH"
  currentFilters={filters}
/>
```

#### Utility Functions
- **getTimePeriodDisplayText**: Shared utility for consistent time period text formatting across components

#### Analytics Components
- **CollapsibleSection**: Reusable wrapper component for creating collapsible UI sections
  - Generic collapsible functionality with consistent header design
  - Toggle expand/collapse with chevron indicator
  - Optional subtitle display for additional context
  - Smooth card-based layout with proper spacing
  - Customizable default expanded state

- **KeyInsights**: Collapsible multi-line insights display with emoji extraction
  - Built-in collapsible design with expand/collapse toggle and chevron indicator
  - Displays insight count in header for quick overview
  - Supports long-form insights with proper text wrapping
  - Automatically extracts emojis for visual appeal
  - Provides consistent card-based layout with accent borders
  - Optimized for readability with proper spacing and typography

- **CategoryPieChart**: Professional category breakdown visualization (now collapsible with interactive features)
  - **Collapsible Design**: Wrapped in CollapsibleSection with category count display
  - **Show All Categories**: Interactive "more categories" button to expand/collapse full list
  - **Interactive Hover Effects**: CustomActiveShapePieChart implementation with:
    - Auto-selected first category on load for immediate insights
    - Active shape highlighting on hover with expanded outer ring
    - Dynamic center hole that appears when hovering over slices
    - Detailed callout labels showing full category names, amounts, and percentages
    - Proper text positioning with adequate margins to prevent text cutoff
    - Smooth visual feedback with connecting lines and anchor points
    - Returns to first category when hover ends (persistent information display)
    - Consistent font-family matching the main application
  - Full-width centered pie chart with vertical legend layout
  - Responsive chart sizing with proper SVG positioning
  - Enhanced legend design with structured layout and clear typography
  - Individual legend items with background cards and proper spacing
  - Right-aligned amounts and percentages for easy scanning
  - Professional color indicators with subtle elevation
  - **UI Enhancements**:
    - Improved text readability with larger font sizes (15px category names, 14px amounts, 13px percentages)
    - Enhanced color indicators (18x18px) for better visual association
    - Optimized spacing throughout the component
    - Interactive show more/less functionality for category lists
    - Rich hover tooltips with complete category information

- **MonthlyTrendsChart**: Time-series visualization for income and expense trends (now collapsible)
  - **Collapsible Design**: Wrapped in CollapsibleSection with months count display
  - Line chart visualization showing income vs expense trends over time
  - Dual-line display with color-coded income (green) and expense (red) lines
  - Interactive chart with proper formatting and responsive design
  - Summary table showing last 3 months with income, expense, and net values
  - Automatic Y-axis formatting (K for thousands, M for millions)
  - Bezier curve smoothing for better visual appeal

- **AnalyticsGridHeader**: Primary metrics display for analytics screens
  - Compact 2x2 grid design showing Total Income, Total Expenses, Net Income, and Categories
  - Color-coded metrics with appropriate icons for each data type
  - Highlighted design with visual emphasis for key metrics
  - Space-efficient layout optimized for analytics overview
  - Clean, focused design without action buttons for distraction-free analytics
  - Replaces duplicate summary cards for cleaner UI

- **AnalyticsHeader**: Alternative custom header component example
  - Demonstrates flexibility of configurable BaseScreenLayout headers
  - Clean, analytics-focused design with centered metrics display
  - Three-column layout for Net Flow, Income, and Expenses
  - Color-coded values with proper theme integration

#### Core Components
- **ConfirmationDialog**: Cross-platform confirmation dialogs
- **TimePeriodSelector**: Date range selection component
- **ModalHeader**: Consistent modal header design
- **ActionButtonRow**: Reusable action button layout for Add Transaction and Import File buttons
- **ErrorDisplay**: Consistent error message display component

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
- **Standardized Currency Formatting**: Unified `formatCurrency()` function from shared utils
- **Automatic Currency Conversion**: Handles smallest unit conversion (kopecks/cents to main units)
- **Dynamic Currency Detection**: Any ISO 4217 currency support
- **Symbol Recognition**: ₴, $, €, £, ₪, ¥, etc.
- **Ukrainian Market Focus**: Special UAH formatting with symbol placement after amount
- **Consistent Display**: All components use shared currency utilities for uniform presentation
- **Fallback Mechanisms**: Default currency handling with graceful error recovery

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