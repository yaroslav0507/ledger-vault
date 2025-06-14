export type TabName = 'transactions' | 'analytics' | 'settings';

export const getInitialTabFromUrl = (): TabName => {
  try {
    if (typeof window === 'undefined') return 'transactions';
    
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab') as TabName;
    
    return tab || 'transactions';
  } catch (error) {
    console.warn('Failed to load tab from URL:', error);
    return 'transactions';
  }
};

export const updateUrlWithTab = (tabName: TabName): void => {
  try {
    if (typeof window === 'undefined') return;
    
    const url = new URL(window.location.href);
    
    if (tabName === 'transactions') {
      url.searchParams.delete('tab');
    } else {
      url.searchParams.set('tab', tabName);
    }
    
    window.history.replaceState({}, '', url.toString());
  } catch (error) {
    console.warn('Failed to update URL with tab:', error);
  }
}; 