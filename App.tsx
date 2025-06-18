import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider, DefaultTheme, Icon } from 'react-native-paper';
import { TransactionListScreen } from './src/features/transactions/ui/screens/TransactionListScreen';
import { AnalyticsScreen } from './src/features/analytics/ui/screens/AnalyticsScreen';
import { SettingsScreen } from './src/features/settings/ui/screens/SettingsScreen';
import { AppProvider, useAppContext } from './src/shared/contexts/AppContext';
import { TransactionManagementProvider } from './src/shared/contexts/TransactionManagementContext';
import { AppHeader } from './src/shared/ui/components/AppHeader';
import { TransactionModalsContainer } from './src/shared/ui/components/TransactionModalsContainer';
import { useFonts } from 'expo-font';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { initializeDatabase } from './src/db';
import './src/shared/i18n';
import { useTranslation } from './src/shared/i18n/useTranslation';

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
    navigation.navigate('transactions');
  };
  
  return <SettingsScreen onClose={handleClose} />;
}

function AppNavigator() {
  const { setCurrentTabTitle, initialTab } = useAppContext();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <AppHeader />
      <Tab.Navigator
        initialRouteName={initialTab}
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
            const routeName = e.target?.split('-')[0] as any;
            if (routeName === 'transactions' || routeName === 'analytics' || routeName === 'settings') {
              setCurrentTabTitle(routeName);
            }
          },
        }}
      >
        <Tab.Screen
          name="transactions"
          component={TransactionListScreen}
          options={{
            tabBarLabel: t('navigation.transactions'),
            tabBarIcon: ({ color, size }) => (
              <Icon source="format-list-bulleted" size={size} color={color} />
            ),
          }}
          listeners={{
            focus: () => setCurrentTabTitle('transactions'),
          }}
        />
        <Tab.Screen
          name="analytics"
          component={AnalyticsScreen}
          options={{
            tabBarLabel: t('navigation.analytics'),
            tabBarIcon: ({ color, size }) => (
              <Icon source="chart-line" size={size} color={color} />
            ),
          }}
          listeners={{
            focus: () => setCurrentTabTitle('analytics'),
          }}
        />
        <Tab.Screen
          name="settings"
          component={SettingsWrapper}
          options={{
            tabBarLabel: t('navigation.settings'),
            tabBarIcon: ({ color, size }) => (
              <Icon source="cog" size={size} color={color} />
            ),
          }}
          listeners={{
            focus: () => setCurrentTabTitle('settings'),
          }}
        />
      </Tab.Navigator>
      <TransactionModalsContainer />
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    ...MaterialCommunityIcons.font,
  });

  // Initialize WatermelonDB
  useEffect(() => {
    initializeDatabase().catch(console.error);
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <PaperProvider theme={theme}>
      <AppProvider>
        <TransactionManagementProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </TransactionManagementProvider>
      </AppProvider>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    // @ts-ignore
    paddingBottom: 8
  },
});
