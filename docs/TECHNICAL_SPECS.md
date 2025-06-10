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
  date: string;                  // ISO 8601 (YYYY-MM-DDTHH:mm:ss) - full timestamp
  card: string;                  // Card/account identifier
  amount: number;                // Amount in smallest currency unit (kopecks/cents)
  currency: string;              // ISO 4217 currency code (UAH, USD, EUR, etc.)
  description: string;           // Single description field - simplified for POC
  category: string;              // Transaction category
  comment?: string;              // User or system-generated comment
  isDuplicate: boolean;          // Duplicate detection flag
  isIncome: boolean;             // Income vs expense classification
  createdAt: string;             // Simplified metadata - only keep creation timestamp
}
```

### Time Period Filtering Interfaces
```