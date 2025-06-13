import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AppContextType {
  currentTabTitle: string;
  setCurrentTabTitle: (title: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [currentTabTitle, setCurrentTabTitle] = useState('Transactions');

  return (
    <AppContext.Provider value={{ currentTabTitle, setCurrentTabTitle }}>
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