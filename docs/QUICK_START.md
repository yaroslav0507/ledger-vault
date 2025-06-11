# 🚀 LedgerVault Quick Start Guide

## 📱 What is LedgerVault?

LedgerVault is a modern React Native financial transaction management app designed for the Ukrainian market with international currency support. It features comprehensive bank statement import capabilities, advanced filtering with URL persistence, clean navigation, and a responsive interface that works seamlessly on both web and mobile platforms.

---

## ✨ **Current Features**

### 🏦 **Transaction Management**
- ✅ **Manual transaction entry** with real-time validation
- ✅ **Transaction list** with advanced filtering and search
- ✅ **Multi-currency support** (UAH, USD, EUR, GBP, ILS, JPY, etc.)
- ✅ **Transaction categories** with include/exclude filtering
- ✅ **Comments and descriptions** with original data preservation
- ✅ **Duplicate detection** and prevention
- ✅ **URL state persistence** - shareable filter URLs

### 📂 **File Import System**
- ✅ **Excel import** (XLS/XLSX) with advanced parsing
- ✅ **Interactive column mapping** with smart suggestions
- ✅ **Ukrainian bank support** (PrivatBank, Monobank, OschadBank)
- ✅ **Multi-row header detection** (up to 20 rows analyzed)
- ✅ **Intelligent column mapping** (Ukrainian/English/European languages)
- ✅ **Currency auto-detection** from file content
- ✅ **Import preview** with error reporting
- ✅ **Comprehensive validation** with row-level feedback

### 🎨 **User Interface**
- ✅ **Clean Navigation** - Action buttons for primary functions
- ✅ **Settings Access** - Easy access to app preferences
- ✅ **Scroll-to-top Button** - Dynamic visibility while scrolling
- ✅ **Advanced filter modal** with real-time category loading
- ✅ **Time period selector** with seasonal support (including winter logic)
- ✅ **Responsive design** supporting long content
- ✅ **Cross-platform alerts** optimized for web and mobile
- ✅ **Modern Material Design** with React Native Paper

### 🔍 **Advanced Filtering**
- ✅ **Date range filtering** with seasonal periods
- ✅ **Category filtering** with include/exclude modes
- ✅ **Card/account filtering** with multi-selection
- ✅ **Income/expense filtering** with toggle support
- ✅ **Text search** in descriptions and comments
- ✅ **URL persistence** - filters saved in browser URL
- ✅ **Shareable filtered views** via URL bookmarks

---

## 🚀 **Getting Started**

### Live Demo
**Visit: https://yaroslav0507.github.io/ledger-vault**

The app is deployed and ready to use immediately in your browser!

### Prerequisites
- **Modern web browser** (Chrome, Firefox, Safari, Edge)
- **No installation required** - runs directly in browser
- **Mobile compatible** - works on smartphones and tablets

### 1. **Access the App**
- Navigate to **https://yaroslav0507.github.io/ledger-vault**
- The app loads instantly with the main transaction interface
- All data is stored locally in your browser (privacy-first design)

### 2. **Add Your First Transaction**
1. Click the **"Add Transaction"** button (prominent blue button)
2. Fill in the transaction details:
   - **Description**: What was purchased/paid for
   - **Amount**: Transaction amount (positive for income, negative for expenses)
   - **Card**: Card or account name
   - **Category**: Select from available categories
   - **Date**: Transaction date (defaults to today)
   - **Currency**: Auto-detected or manually selected
3. Click **"Add Transaction"** to save

### 3. **Access Settings**
- Click the **gear icon (⚙️)** in the bottom-right corner
- Configure app preferences, manage data, or export transactions
- Access comprehensive settings in a full-screen modal

### **Manage Settings**
1. Click the **gear icon (⚙️)** in bottom-right
2. Configure currencies, categories, and preferences
3. Export data or clear all transactions

---

## 🔍 **Using Advanced Filters**

### Opening the Filter Modal
- Click the **"Filters"** button in the sticky transaction header
- Or use the search icon (🔍) for quick access

### Filter Options
- **Date Range**: Select from predefined periods or custom ranges
  - Today, This Week, This Month, Last Month
  - Seasonal periods: Spring, Summer, Autumn, Winter (special logic)
  - Custom date ranges with calendar picker
- **Transaction Type**: All, Expenses only, Income only
- **Categories**: Multi-select with include/exclude toggle
  - **Include mode**: Show only selected categories
  - **Exclude mode**: Hide selected categories
- **Cards/Accounts**: Multi-select from available cards
- **Search**: Text search in transaction descriptions and comments

### Filter Actions
- **"Filter Transactions"** (bottom button): Apply current filter selections
- **"Clear"** (header button): Remove all filters and show everything
- All filters are automatically saved to the URL for easy sharing

### URL Persistence
- Your filter settings are automatically saved in the browser URL
- Bookmark filtered views for quick access
- Share URLs with others to show specific transaction views
- Filters are restored when you reload the page

---

## 📂 **Importing Bank Statements**

### Supported Formats
- **Excel files** (.xls, .xlsx)
- **Ukrainian banks** (PrivatBank, Monobank, OschadBank, others)
- **International banks** (with proper column structure)

### Import Process
1. **Click "Import Bank"** button on the main screen
2. **Select your file**: Choose the XLS/XLSX file from your device
3. **Column Mapping**: Interactive interface appears
   - Review detected columns and sample data
   - Map required fields (Date, Amount, Description)
   - Map optional fields (Card, Category, Comment)
   - Select date format from dropdown
   - Preview shows how your data will be imported
4. **Validate mapping**: Ensure all required fields are assigned
5. **Preview import**: Review transactions with error detection
6. **Confirm import**: Handle duplicates and complete the import
7. **Success**: Your transactions appear in the main list

### Interactive Column Mapping
- **Smart detection**: Automatically suggests column mappings
- **Preview data**: See sample rows from your file
- **Required fields**: Date, Amount, Description must be mapped
- **Date format selection**: Choose from 6+ international formats
- **Real-time validation**: Immediate feedback on mapping choices

---

## 🕒 **Time Period Management**

### Predefined Periods
- **Today**: Current day transactions
- **This Week**: Monday to Sunday of current week
- **This Month**: Current calendar month
- **Last Month**: Previous calendar month
- **This Quarter**: Current business quarter
- **This Year**: Current calendar year

### Seasonal Periods
- **Spring**: March - May
- **Summer**: June - August  
- **Autumn**: September - November
- **Winter**: December, January, February of current year (special logic)

### Custom Ranges
- Select any start and end date
- Calendar picker interface
- Automatic validation of date ranges

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
- **Review column mapping**: Take time to map columns correctly
- **Preview before import**: Always check the preview for errors

### Filtering & Organization
- **Use URL bookmarks**: Save frequently used filter combinations
- **Share filter URLs**: Send specific views to others
- **Regular time periods**: Use seasonal filters for spending analysis
- **Category organization**: Use include/exclude modes effectively

---

## ⚙️ **Settings & Data Management**

### App Preferences
- **Default Currency**: Set your primary currency (UAH, USD, EUR, etc.)
- **Default Category**: Choose default category for new transactions
- **Default Transaction Type**: Income or Expense default
- **Auto-detect Currency**: Automatically detect currency during imports
- **Confirm Delete**: Ask for confirmation before deleting transactions

### Data Management
- **Export Data**: Download all transactions as CSV file
- **Clear All Data**: Safely remove all transactions with confirmation
- **Data Privacy**: All data stored locally in your browser only

### Access Settings
- Click the **gear icon (⚙️)** in the bottom-right corner
- Full-screen modal with organized preference sections
- Changes are saved automatically

---

## 🔧 **Troubleshooting**

### Common Issues

#### Filter Problems
**Problem**: "No transactions shown after filtering"
**Solution**: Check if filters are too restrictive; use "Clear" button to reset

**Problem**: "Categories not loading in filter"
**Solution**: Ensure you have transactions in the selected date range

#### Import Problems
**Problem**: "Column mapping interface won't proceed"
**Solution**: Ensure Date, Amount, and Description columns are mapped

**Problem**: "Invalid date format during import"
**Solution**: Select the correct date format from dropdown in column mapping

**Problem**: "Currency not detected in import"
**Solution**: Manually specify currency in transaction list after import

#### Performance Issues
**Problem**: "App slow with many transactions"
**Solution**: Use date range filters to limit displayed transactions

**Problem**: "Large file import fails"
**Solution**: Split large files into smaller chunks (< 5000 transactions per file)

### Getting Help
1. **Check browser console**: Open developer tools for error details
2. **Verify file format**: Ensure Excel file structure matches expected format
3. **Try sample data**: Test with a smaller file first
4. **Use filters**: Narrow down transaction views for better performance

---

## 📊 **Data Privacy & Security**

### Local Storage
- **All data stored locally** in your browser (IndexedDB)
- **No server communication** - completely offline operation
- **Privacy-first design** - no tracking or analytics
- **Data remains on your device** - never transmitted anywhere

### Cross-platform Security
- **Web-optimized alerts** for better browser experience
- **Safe data operations** with confirmation dialogs
- **Automatic validation** of all user inputs
- **Error handling** prevents data corruption

---

## 🚀 **What's Next?**

### Upcoming Features (Ready for Implementation)
- **Analytics Dashboard**: Visual charts and spending insights
- **Budget Management**: Set and track spending limits
- **Recurring Transaction Detection**: Automatic pattern recognition
- **Enhanced Export**: PDF reports with charts and analysis

### Current Capabilities Summary
✅ **Full transaction management** with CRUD operations
✅ **Advanced import system** with interactive column mapping  
✅ **Comprehensive filtering** with URL persistence and sharing
✅ **Clean navigation** for modern interface
✅ **Cross-platform compatibility** (web and mobile)
✅ **Multi-currency support** with intelligent detection
✅ **Data export** and management tools
✅ **Settings and preferences** management

The app is **production-ready** and provides a complete transaction management experience with professional-grade features and a clean, intuitive interface. 