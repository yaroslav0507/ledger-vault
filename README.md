# 💰 LedgerVault

> **Modern Financial Transaction Management for the Digital Age**

A production-ready React Native web application designed for comprehensive transaction management with advanced import capabilities, intelligent filtering, and privacy-first design. Built specifically for the Ukrainian market with full international currency support.

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-Visit_App-blue?style=for-the-badge)](https://yaroslav0507.github.io/ledger-vault)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![React Native](https://img.shields.io/badge/React_Native-Expo-61DAFB?style=flat&logo=react)](https://reactnative.dev/)
[![Privacy First](https://img.shields.io/badge/Privacy-First-green?style=flat&logo=shield)](https://github.com/yaroslav0507/ledger-vault)

---

## 🎯 **What is LedgerVault?**

LedgerVault is a sophisticated financial transaction management application that transforms how you handle personal finance data. With advanced Excel import capabilities and intelligent filtering, it provides a professional-grade solution for tracking transactions across multiple currencies and accounts.

### 🌟 **Key Highlights**
- **🏦 Bank Statement Import**: Advanced Excel processing with interactive column mapping
- **🔍 Smart Filtering**: URL-persistent filters with shareable links  
- **💱 Multi-Currency**: Support for any ISO currency with intelligent detection
- **🛡️ Privacy-First**: 100% local database, no data transmission
- **📱 Cross-Platform**: Optimized for web and mobile devices
- **🇺�� Ukrainian Focus**: Designed with Ukrainian market in mind

---

## ✨ **Features**

### 📊 **Transaction Management**
- ✅ **Full CRUD Operations** - Add, edit, delete transactions with validation
- ✅ **Advanced Filtering** - Date ranges, categories, cards, income/expense types
- ✅ **Text Search** - Search descriptions and comments
- ✅ **URL Persistence** - Share filtered views via bookmarkable URLs
- ✅ **Duplicate Detection** - Intelligent duplicate prevention during import
- ✅ **Multi-Currency Support** - UAH, USD, EUR, GBP, ILS, JPY, and more

### 📂 **Import System**
- ✅ **Excel Processing** - XLS/XLSX files with advanced parsing
- ✅ **Interactive Column Mapping** - Visual interface for field assignment
- ✅ **Smart Detection** - Automatic column type recognition
- ✅ **Multi-language Column Recognition** - Ukrainian/English/European column headers
- ✅ **Multi-row Headers** - Handle complex bank export formats
- ✅ **Preview & Validation** - Review before importing with error detection

### 🎨 **User Interface**
- ✅ **FAB Navigation** - Floating Action Buttons for clean interface
- ✅ **Responsive Design** - Works on desktop, tablet, and mobile
- ✅ **Material Design** - Modern UI with React Native Paper
- ✅ **Time Period Filtering** - Seasonal periods with special winter logic
- ✅ **Category Management** - Include/exclude filtering modes
- ✅ **Settings Panel** - Comprehensive app configuration

---

## 🚀 **Live Demo**

**Try it now:** [https://yaroslav0507.github.io/ledger-vault](https://yaroslav0507.github.io/ledger-vault)

- No installation required
- Runs directly in your browser
- All data stored in local database for privacy
- Mobile-friendly interface

---

## 🛠️ **Technology Stack**

### **Frontend**
[![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-1B1F23?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React Native Paper](https://img.shields.io/badge/Material_Design-0081CB?style=for-the-badge&logo=material-design&logoColor=white)](https://reactnativepaper.com/)

- **React Native** with Expo for cross-platform compatibility
- **TypeScript** for type safety and developer experience
- **React Native Paper** for Material Design components
- **Zustand** for lightweight state management

### **Data & Storage**
[![Dexie.js](https://img.shields.io/badge/Dexie.js-FF6B35?style=for-the-badge&logo=javascript&logoColor=white)](https://dexie.org/)
[![IndexedDB](https://img.shields.io/badge/IndexedDB-4285F4?style=for-the-badge&logo=google-chrome&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
[![Zod](https://img.shields.io/badge/Zod-000000?style=for-the-badge&logo=zod&logoColor=3068B7)](https://zod.dev/)

- **Dexie.js** for IndexedDB management
- **Local database** - no server dependencies
- **URL state persistence** for shareable filter states
- **Zod** for runtime validation

### **Import & Processing**
[![XLSX](https://img.shields.io/badge/XLSX-217346?style=for-the-badge&logo=microsoft-excel&logoColor=white)](https://github.com/SheetJS/sheetjs)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

- **XLSX** library for Excel file processing
- **Strategy pattern** for extensible file format support
- **Advanced parsing** with multi-language column detection
- **Currency detection** with symbol recognition

### **Development & Build**
[![Yarn](https://img.shields.io/badge/Yarn-2C8EBB?style=for-the-badge&logo=yarn&logoColor=white)](https://yarnpkg.com/)
[![ESLint](https://img.shields.io/badge/ESLint-4B32C3?style=for-the-badge&logo=eslint&logoColor=white)](https://eslint.org/)
[![Prettier](https://img.shields.io/badge/Prettier-F7B93E?style=for-the-badge&logo=prettier&logoColor=black)](https://prettier.io/)
[![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white)](https://git-scm.com/)

### **Deployment & Hosting**
[![GitHub Pages](https://img.shields.io/badge/GitHub_Pages-222222?style=for-the-badge&logo=github&logoColor=white)](https://pages.github.com/)
[![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white)](https://github.com/features/actions)

---

## 📁 **Project Structure**

```
ledger-vault/
├── src/
│   ├── features/
│   │   ├── transactions/         # Core transaction management
│   │   │   ├── model/           # Types and interfaces
│   │   │   ├── service/         # Business logic
│   │   │   ├── storage/         # Data access layer
│   │   │   ├── store/           # State management
│   │   │   └── ui/              # Components and screens
│   │   ├── import/              # File import system
│   │   │   ├── strategies/      # Import format handlers
│   │   │   ├── service/         # Import orchestration
│   │   │   └── ui/              # Import interface
│   │   └── categories/          # Category management
│   ├── shared/
│   │   ├── ui/                  # Reusable components
│   │   ├── utils/               # Utility functions
│   │   ├── hooks/               # Custom React hooks
│   │   └── types/               # Shared TypeScript types
│   └── tests/                   # Test files and fixtures
├── docs/                        # Comprehensive documentation
├── assets/                      # Static assets
└── App.tsx                      # Application entry point
```

---

## 🚀 **Getting Started**

### **Option 1: Use Live Demo (Recommended)**
Visit [https://yaroslav0507.github.io/ledger-vault](https://yaroslav0507.github.io/ledger-vault) - no setup required!

### **Option 2: Local Development**

#### Prerequisites
- **Node.js** 18+ 
- **npm** or **yarn**
- **Modern web browser**

#### Installation
```bash
# Clone the repository
git clone https://github.com/yaroslav0507/ledger-vault.git
cd ledger-vault

# Install dependencies
npm install

# Start development server
npm run web

# Open browser
open http://localhost:8081
```

---

## 📖 **Quick Usage Guide**

### **Add Your First Transaction**
1. Click **"Add Transaction"** (blue button)
2. Fill in description, amount, card, and category
3. Save and see it appear in your transaction list

### **Import Bank Statements**
1. Click **"Import Bank"** button
2. Select your Excel file (.xls or .xlsx)
3. Use the interactive column mapping interface
4. Preview and confirm your import

### **Advanced Filtering**
1. Click **"Filters"** in the transaction header  
2. Set date ranges, categories, cards, or search terms
3. Apply filters and bookmark the URL for future use
4. Share filtered views with others via URL

### **Manage Settings**
1. Click the **gear icon (⚙️)** in bottom-right
2. Configure currencies, categories, and preferences
3. Export data or clear all transactions

---

## 🔧 **Development**

### **Available Scripts**
```bash
npm run web          # Start web development server
npm run start        # Start Expo development server  
npm run build        # Build for production
npm run test         # Run tests
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

### **Key Development Features**
- **Hot reload** for fast development iteration
- **TypeScript** with strict type checking
- **ESLint + Prettier** for code quality
- **Component-driven architecture** with reusable UI elements
- **Feature-based organization** for scalability

---

## 🌍 **Internationalization & Bank Support**

### **Current Implementation**
- **Column Recognition**: Ukrainian/English/European column headers during import
- **Date Formats**: European and international date parsing
- **Currency Detection**: Multi-currency symbol recognition

### **Planned Features**
- **Full UI Internationalization**: Complete Ukrainian/English interface
- **Bank-Specific Templates**: PrivatBank, Monobank, OschadBank optimization
- **Enhanced Language Support**: Extended multilingual capabilities

---

## 🛡️ **Privacy & Security**

### **Privacy-First Design**
- ✅ **100% Local Database** - All data stays in your browser's IndexedDB
- ✅ **No Server Communication** - Completely offline operation  
- ✅ **No Tracking** - No analytics, cookies, or user tracking
- ✅ **No Data Transmission** - Files processed entirely locally

### **Security Features**
- ✅ **Input Validation** - All user input sanitized and validated
- ✅ **Error Handling** - Comprehensive error management
- ✅ **Safe Operations** - Confirmation dialogs for destructive actions
- ✅ **Cross-platform Compatibility** - Secure operation on web and mobile

---

## 📊 **Current Status**

### **Production Ready** ✅
- **Core Features**: 100% complete
- **Import System**: 100% complete with interactive mapping
- **Filtering**: 100% complete with URL persistence  
- **UI/UX**: 100% complete with FAB navigation
- **Cross-platform**: 100% complete
- **Documentation**: 100% complete

### **Architecture Highlights**
- **Clean Architecture** with feature-based organization
- **State Management** with Zustand and URL persistence
- **Database Layer** with Dexie and optimized queries
- **Import System** using Strategy pattern
- **Type Safety** with 100% TypeScript coverage

---

## 📚 **Documentation**

Comprehensive documentation is available in the `/docs` folder:

- **[📋 Implementation Plan](docs/IMPLEMENTATION_PLAN.md)** - Development status and roadmap
- **[🚀 Quick Start Guide](docs/QUICK_START.md)** - User guide and tutorials  
- **[🔧 Technical Specifications](docs/TECHNICAL_SPECS.md)** - Architecture and technical details

---

## 🚀 **Deployment**

### **Live Production**
- **URL**: [https://yaroslav0507.github.io/ledger-vault](https://yaroslav0507.github.io/ledger-vault)
- **Hosting**: GitHub Pages with automated deployment
- **Build**: Optimized static web application
- **Performance**: Fast loading with efficient bundle size

### **Deployment Pipeline**
- **GitHub Actions** for automated builds
- **Static hosting** for reliability and speed
- **Custom domain** support available
- **Progressive Web App** capabilities

---

## 🤝 **Contributing**

We welcome contributions! Here's how to get started:

### **Development Setup**
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes with proper TypeScript types
4. Add tests for new functionality
5. Run linting: `npm run lint`
6. Commit with descriptive messages
7. Push to your branch and create a Pull Request

### **Contribution Guidelines**
- **Code Quality**: Follow existing patterns and TypeScript best practices
- **Testing**: Add tests for new features and bug fixes
- **Documentation**: Update docs for any user-facing changes
- **Performance**: Consider performance impact of changes
- **Privacy**: Maintain privacy-first principles

---

## 🎯 **Future Roadmap**

### **Phase 1: Project Foundation & Core Setup** ✅ **COMPLETED**
- ✅ **Expo React Native**: TypeScript project with cross-platform compatibility
- ✅ **Architecture**: Feature-based folder structure and component organization
- ✅ **State Management**: Zustand store with URL persistence capabilities
- ✅ **Database**: Dexie.js IndexedDB integration for local storage
- ✅ **UI Framework**: React Native Paper theme system and responsive layouts
- ✅ **Development Tools**: Hot reload, TypeScript, ESLint, and Prettier setup

### **Phase 2: Transaction Management Core** ✅ **COMPLETED**
- ✅ **CRUD Operations**: Full transaction create, read, update, delete functionality
- ✅ **Advanced Filtering**: Date ranges, categories, cards, income/expense types
- ✅ **Search & Validation**: Text search with comprehensive Zod validation
- ✅ **Duplicate Detection**: Intelligent duplicate prevention during operations
- ✅ **Multi-Currency**: Support for any ISO currency with automatic detection
- ✅ **Transaction Cards**: Enhanced UI with comments and original descriptions

### **Phase 3: Advanced Import System** ✅ **COMPLETED**
- ✅ **Excel Processing**: Sophisticated XLS/XLSX import with advanced parsing
- ✅ **Interactive Column Mapping**: Visual interface for manual field assignment
- ✅ **Smart Detection**: Automatic column type and currency recognition
- ✅ **Multi-language Support**: Ukrainian/English/European column header recognition
- ✅ **Header Detection**: Multi-row header analysis (up to 20 rows)
- ✅ **Preview & Validation**: Import preview with comprehensive error reporting

### **Phase 4: Advanced Navigation & Filtering** ✅ **COMPLETED**
- ✅ **Clean Navigation**: Action buttons and streamlined interface design
- ✅ **Settings Access**: Gear icon with modal-based settings experience
- ✅ **Enhanced Filtering**: Include/exclude category modes with real-time loading
- ✅ **URL Persistence**: All filters automatically saved to shareable URLs
- ✅ **Context-aware Categories**: Categories filtered by selected date ranges
- ✅ **Cross-platform Alerts**: Custom alert system for web and mobile

### **Phase 5: Code Quality & Architecture** ✅ **COMPLETED**
- ✅ **Codebase Cleanup**: Removed debug code and unused features
- ✅ **Architecture Improvements**: Clean state management and error handling
- ✅ **Performance Optimization**: Efficient rendering and hooks usage
- ✅ **Type Safety**: Full TypeScript coverage with clean interfaces

### **Phase 6: Time Period Management** ✅ **COMPLETED**  
- ✅ **Time Period Selector**: Comprehensive date range selection
- ✅ **Winter Period Handling**: Special logic for Dec/Jan/Feb
- ✅ **Seasonal Filtering**: Spring, Summer, Autumn, Winter support
- ✅ **URL Integration**: Time periods preserved in query parameters

### **Phase 7: Analytics & Insights** (Ready for Implementation)
- 📊 **Dashboard Components**: Visual charts and spending trends
- 📈 **Category Analysis**: Pie/bar charts for spending breakdown  
- 💡 **Transaction Insights**: AI-powered spending analysis
- 📄 **Enhanced Export**: PDF reports with charts and analysis
- 📋 **Balance Overview**: Income/expense breakdown by time period
- 📉 **Spending Trends**: Visual representation of spending patterns

### **Phase 8: Advanced Features & AI**
- 🤖 **AI Integration**: Smart categorization using machine learning
- 🔄 **Recurring Detection**: Automatic subscription and pattern recognition
- 🎯 **Spending Predictions**: AI-powered budget forecasting
- 🔍 **Transaction Similarity**: Enhanced duplicate detection
- 👥 **Collaboration**: Shared budgets and multi-user support
- ☁️ **Sync Options**: Optional cloud synchronization
- 🏦 **Bank Integration**: Direct bank API connections (future)

### **Phase 9: Full Internationalization** (Planned)
- 🌍 **Complete UI Translation**: Full Ukrainian/English interface
- 🏛️ **Bank Templates**: Specific optimization for Ukrainian banks
- 📋 **Localized Categories**: Region-specific transaction categories
- 🗣️ **Voice Input**: Speech-to-text for transaction entry
- 📱 **Mobile App**: Native iOS/Android applications

### **Phase 10: Enterprise Features** (Future Vision)
- 🏢 **Multi-Account Management**: Business account support
- 👥 **Team Collaboration**: Shared financial management
- 🔐 **Advanced Security**: Biometric authentication, encryption
- 📊 **Business Analytics**: Advanced reporting and insights
- 🔗 **API Access**: Third-party integrations and extensions

---

## 📄 **License**

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 📞 **Contact & Support**

- **🐛 Issues**: [GitHub Issues](https://github.com/yaroslav0507/ledger-vault/issues)
- **💡 Feature Requests**: [GitHub Discussions](https://github.com/yaroslav0507/ledger-vault/discussions)
- **📧 Contact**: Create an issue for support questions

---

## ⭐ **Show Your Support**

If LedgerVault helps manage your finances, please consider:
- ⭐ **Starring this repository**
- 🐛 **Reporting bugs** or suggesting features
- 🤝 **Contributing** to the codebase
- 📢 **Sharing** with others who might benefit

---

<div align="center">

**[🚀 Try LedgerVault Now](https://yaroslav0507.github.io/ledger-vault)**

*Take control of your financial data with privacy, security, and intelligence.*

</div>

## 📊 **Data Privacy & Security**

### Local Database
- **All data stored locally** in your browser's IndexedDB
- **No server communication** - completely offline operation
- **Privacy-first design** - no tracking or analytics
- **Data remains on your device** - never transmitted anywhere 