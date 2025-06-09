# 🚀 LedgerVault Quick Start Guide

## 📱 What is LedgerVault?

LedgerVault is a modern React Native financial transaction management app designed for the Ukrainian market with international currency support. It features comprehensive bank statement import capabilities, intelligent transaction categorization, and a responsive interface that works on both web and mobile platforms.

---

## ✨ **Current Features**

### 🏦 **Transaction Management**
- ✅ **Manual transaction entry** with real-time validation
- ✅ **Transaction list** with filtering and search
- ✅ **Multi-currency support** (UAH, USD, EUR, GBP, ILS, JPY, etc.)
- ✅ **Transaction categories** with smart detection
- ✅ **Comments and descriptions** with original data preservation
- ✅ **Duplicate detection** and prevention

### 📂 **File Import System**
- ✅ **Excel import** (XLS/XLSX) with advanced parsing
- ✅ **Ukrainian bank support** (PrivatBank, Monobank, OschadBank)
- ✅ **Multi-row header detection** (up to 20 rows analyzed)
- ✅ **Intelligent column mapping** (Ukrainian/English/European languages)
- ✅ **Currency auto-detection** from file content
- ✅ **Import preview** with error reporting
- ✅ **Comprehensive validation** with row-level feedback

### 🎨 **User Interface**
- ✅ **Responsive design** supporting long content
- ✅ **Sticky header** with smooth scrolling
- ✅ **Scroll-to-top** floating action button
- ✅ **Dynamic filters** with real-time updates
- ✅ **Empty states** for better UX
- ✅ **Modern Material Design** with React Native Paper

---

## 🚀 **Getting Started**

### Prerequisites
- **Node.js** 18+ installed
- **npm** or **yarn** package manager
- **Web browser** for testing (Chrome recommended)

### 1. **Clone and Setup**
```bash
# Clone the repository
git clone https://github.com/your-username/ledger-vault.git
cd ledger-vault

# Install dependencies
npm install

# Start development server
npm run web
```

### 2. **Open the App**
- Navigate to **http://localhost:8081** in your browser
- The app will automatically load with the transaction management interface

### 3. **Add Your First Transaction**
1. Click the **"Add Transaction"** button
2. Fill in the transaction details:
   - **Description**: What was purchased/paid for
   - **Amount**: Transaction amount (positive for income, negative for expenses)
   - **Card**: Card or account name
   - **Category**: Select from predefined categories
   - **Date**: Transaction date (defaults to today)
   - **Currency**: Auto-detected or manually selected
3. Click **"Add Transaction"** to save

---

## 📂 **Importing Bank Statements**

### Supported Formats
- **Excel files** (.xls, .xlsx)
- **Ukrainian banks** (PrivatBank, Monobank, OschadBank, others)
- **International banks** (with proper column structure)

### Import Process
1. **Prepare your file**: Ensure your Excel file contains transaction data with columns for date, amount, and description
2. **Click "Import Bank"** button on the main screen
3. **Select your file**: Choose the XLS/XLSX file from your device
4. **Review preview**: The app will analyze your file and show:
   - Detected columns and mappings
   - Sample transactions
   - Any errors or warnings
   - Currency detection results
5. **Confirm import**: Review duplicates and click "Import" to proceed
6. **Success**: Your transactions will appear in the main list

### File Format Requirements
Your Excel file should contain columns for:
- **Date** (DD.MM.YYYY, YYYY-MM-DD, or similar formats)
- **Amount** (numeric values, can include currency symbols)
- **Description** (transaction details)
- **Optional**: Card/Account, Category, Comments

### Example Data Structure
```
Date          | Amount    | Description              | Card
01.06.2025   | -500.00   | Сільпо                  | ****1234
02.06.2025   | +1000.00  | Salary                  | ****1234
03.06.2025   | -75.50    | Coffee Shop             | ****1234
```

---

## 🔍 **Using Filters and Search**

### Filter Options
- **Date Range**: Filter transactions by specific periods
- **Categories**: Show only specific transaction types
- **Cards**: Filter by specific cards or accounts
- **Amount Range**: Set minimum and maximum amounts
- **Income/Expense**: Show only income or expense transactions

### Search Functionality
- **Text search**: Search transaction descriptions
- **Real-time filtering**: Results update as you type
- **Clear filters**: Reset all filters with one click

---

## 💰 **Currency Support**

### Supported Currencies
LedgerVault supports **any ISO currency** with special optimization for:
- **UAH** (Ukrainian Hryvnia) - Primary currency
- **USD** (US Dollar)
- **EUR** (Euro)
- **GBP** (British Pound)
- **ILS** (Israeli Shekel)
- **JPY** (Japanese Yen)
- **And many more...**

### Currency Detection
- **Auto-detection** from imported files
- **Symbol recognition** (₴, $, €, £, ₪, ¥, etc.)
- **Dynamic support** for new currencies
- **Fallback to UAH** for Ukrainian market

---

## 🎯 **Best Practices**

### Transaction Entry
- **Use descriptive names**: "Coffee at Starbucks" vs "Coffee"
- **Consistent card names**: Use the same identifier for each card
- **Regular categorization**: Keep categories consistent for better analysis
- **Add comments**: Use comments for additional context

### File Import
- **Clean your data**: Remove header rows with bank info
- **Check dates**: Ensure date formats are consistent
- **Verify amounts**: Confirm positive/negative values are correct
- **Review duplicates**: Always check duplicate detection results

### Organization
- **Regular imports**: Import statements monthly for best results
- **Category consistency**: Use the same categories across imports
- **Backup data**: Regular exports for data safety (coming soon)

---

## 🔧 **Troubleshooting**

### Common Issues

#### Import Problems
**Problem**: "Unable to detect valid columns"
**Solution**: Ensure your Excel file has clear headers like "Date", "Amount", "Description"

**Problem**: "Invalid date format"
**Solution**: Use standard date formats (DD.MM.YYYY, YYYY-MM-DD, DD/MM/YYYY)

**Problem**: "Currency not detected"
**Solution**: Include currency symbols in your data or manually specify after import

#### Performance Issues
**Problem**: App slow with many transactions
**Solution**: Use filters to limit displayed transactions; pagination coming soon

**Problem**: Large file import fails
**Solution**: Split large files into smaller chunks (< 5000 transactions per file)

### Getting Help
1. **Check console errors**: Open browser developer tools for error details
2. **Verify file format**: Ensure Excel file structure matches expected format
3. **Try sample data**: Test with a smaller file first
4. **Contact support**: Report issues with specific error messages

---

## 📊 **Data Privacy & Security**

### Local Storage
- **All data stored locally** in your browser (IndexedDB)
- **No cloud sync** - your data stays on your device
- **No tracking** - no analytics or user tracking
- **Private by design** - transactions never leave your device

### File Handling
- **Local processing** - files processed entirely in browser
- **No uploads** - files never sent to external servers
- **Memory cleanup** - temporary data cleared after import
- **Original preservation** - original descriptions kept for audit

---

## 🚧 **Coming Soon**

### Planned Features
- **📊 Dashboard**: Spending analytics and visual charts
- **📈 Trends**: Monthly/weekly spending patterns
- **📤 Export**: CSV/Excel export functionality
- **🔍 Advanced Search**: More sophisticated filtering options
- **📱 Mobile App**: Native iOS/Android applications
- **🤖 AI Integration**: Smart categorization and insights

### Current Status
LedgerVault is **production-ready** for:
- ✅ Daily transaction management
- ✅ Bank statement imports
- ✅ Multi-currency tracking
- ✅ Transaction organization and filtering

---

## 💡 **Tips for Ukrainian Users**

### Bank-Specific Notes
- **PrivatBank**: Exports work directly without modification
- **Monobank**: Use Excel export feature in mobile app
- **OschadBank**: May require header row cleanup
- **Other banks**: Should work with standard export formats

### Ukrainian Features
- **UAH default currency**: Automatically detected for Ukrainian files
- **Ukrainian keywords**: Category detection includes Ukrainian terms
- **Date formats**: Supports DD.MM.YYYY format common in Ukraine
- **Bank names**: Recognizes Ukrainian bank identifiers

---

## 🎉 **Ready to Start?**

1. **Run the app**: `npm run web`
2. **Open browser**: Navigate to http://localhost:8081
3. **Add a transaction**: Click "Add Transaction" and fill in details
4. **Try importing**: Use "Import Bank" with an Excel file
5. **Explore filters**: Use the Filters button to organize your data

**Welcome to LedgerVault!** 🎯

Your personal financial data stays private and organized. Start managing your transactions today! 