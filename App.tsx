import React from 'react';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import { TransactionListScreen } from './src/features/transactions/ui/screens/TransactionListScreen';

// Custom theme based on our design
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6366F1',
    secondary: '#8B5CF6',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    text: '#1F2937',
  },
};

export default function App() {
  return (
    <PaperProvider theme={theme}>
      <TransactionListScreen />
    </PaperProvider>
  );
}
