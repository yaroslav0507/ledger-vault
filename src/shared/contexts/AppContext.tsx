import React, { createContext, useContext, useState, ReactNode } from 'react';
import { TabName, getInitialTabFromUrl, updateUrlWithTab } from '../utils/tabPersistence';

interface AppContextType {
  currentTabTitle: TabName;
  setCurrentTabTitle: (title: TabName) => void;
  initialTab: TabName;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [initialTab] = useState<TabName>(() => getInitialTabFromUrl());
  const [currentTabTitle, setCurrentTabTitleState] = useState<TabName>(initialTab);

  const setCurrentTabTitle = (title: TabName) => {
    setCurrentTabTitleState(title);
    updateUrlWithTab(title);
  };

  return (
    <AppContext.Provider value={{ currentTabTitle, setCurrentTabTitle, initialTab }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}; 