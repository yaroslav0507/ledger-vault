import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider, DefaultTheme, Icon } from 'react-native-paper';
import { TransactionListScreen } from './src/features/transactions/ui/screens/TransactionListScreen';
import { SettingsScreen } from './src/features/transactions/ui/screens/SettingsScreen';

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

const Tab = createBottomTabNavigator();

function SettingsWrapper() {
  return <SettingsScreen onClose={() => {}} />;
}

export default function App() {
  return (
    <PaperProvider theme={theme}>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: theme.colors.primary,
            tabBarInactiveTintColor: '#6B7280',
            tabBarStyle: {
              backgroundColor: theme.colors.surface,
              borderTopColor: '#E5E7EB',
              paddingBottom: 8,
              paddingTop: 8,
              height: 68,
            },
          }}
        >
          <Tab.Screen
            name="Transactions"
            component={TransactionListScreen}
            options={{
              tabBarIcon: ({ color, size }) => (
                <Icon source="format-list-bulleted" size={size} color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="Settings"
            component={SettingsWrapper}
            options={{
              tabBarIcon: ({ color, size }) => (
                <Icon source="cog" size={size} color={color} />
              ),
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}
