import React from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider, DefaultTheme, Icon } from 'react-native-paper';
import { TransactionListScreen } from './src/features/transactions/ui/screens/TransactionListScreen';
import { AnalyticsScreen } from './src/features/analytics/ui/screens/AnalyticsScreen';
import { SettingsScreen } from './src/features/transactions/ui/screens/SettingsScreen';
import { AppProvider, useAppContext } from './src/shared/contexts/AppContext';
import { AppHeader } from './src/shared/ui/components/AppHeader';

// Custom theme based on our design
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#0353a4',
    secondary: '#023e7d',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    text: '#1F2937',
  },
};

const Tab = createBottomTabNavigator();

function SettingsWrapper({ navigation }: any) {
  const handleClose = () => {
    // Navigate back to the Transactions tab
    navigation.navigate('Transactions');
  };
  
  return <SettingsScreen onClose={handleClose} />;
}

function AppNavigator() {
  const { setCurrentTabTitle } = useAppContext();

  return (
    <View style={styles.container}>
      <AppHeader />
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
        screenListeners={{
          tabPress: (e) => {
            // Update title based on tab name
            const routeName = e.target?.split('-')[0];
            switch (routeName) {
              case 'Transactions':
                setCurrentTabTitle('Transactions');
                break;
              case 'Analytics':
                setCurrentTabTitle('Analytics');
                break;
              case 'Settings':
                setCurrentTabTitle('Settings');
                break;
              default:
                setCurrentTabTitle('Transactions');
            }
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
          listeners={{
            focus: () => setCurrentTabTitle('Transactions'),
          }}
        />
        <Tab.Screen
          name="Analytics"
          component={AnalyticsScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Icon source="chart-line" size={size} color={color} />
            ),
          }}
          listeners={{
            focus: () => setCurrentTabTitle('Analytics'),
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
          listeners={{
            focus: () => setCurrentTabTitle('Settings'),
          }}
        />
      </Tab.Navigator>
    </View>
  );
}

export default function App() {
  return (
    <PaperProvider theme={theme}>
      <AppProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </AppProvider>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});
