export const theme = {
  colors: {
    primary: '#3B82F6',        // Blue-500
    primaryDark: '#1D4ED8',    // Blue-700
    secondary: '#6B7280',      // Gray-500
    success: '#10B981',        // Emerald-500
    warning: '#F59E0B',        // Amber-500
    error: '#EF4444',          // Red-500
    income: '#10B981',         // Green for income
    expense: '#64748B',        // Slate-500 - Much more neutral than red
    
    background: '#FFFFFF',
    backgroundSecondary: '#F9FAFB',  // Gray-50
    surface: '#FFFFFF',
    
    text: {
      primary: '#111827',      // Gray-900
      secondary: '#6B7280',    // Gray-500
      disabled: '#9CA3AF',     // Gray-400
      inverse: '#FFFFFF'
    },
    
    border: '#E5E7EB',         // Gray-200
    borderFocus: '#3B82F6',    // Blue-500
    
    shadow: 'rgba(0, 0, 0, 0.1)'
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48
  },
  
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    round: 50
  },
  
  typography: {
    h1: {
      fontSize: 24,
      fontWeight: 'bold' as const,
      lineHeight: 32
    },
    h2: {
      fontSize: 20,
      fontWeight: 'bold' as const,
      lineHeight: 28
    },
    h3: {
      fontSize: 18,
      fontWeight: '600' as const,
      lineHeight: 24
    },
    body: {
      fontSize: 14,
      fontWeight: 'normal' as const,
      lineHeight: 20
    },
    bodyLarge: {
      fontSize: 16,
      fontWeight: 'normal' as const,
      lineHeight: 24
    },
    caption: {
      fontSize: 12,
      fontWeight: 'normal' as const,
      lineHeight: 16
    },
    button: {
      fontSize: 14,
      fontWeight: '600' as const,
      lineHeight: 20
    }
  },
  
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 8
    }
  }
};

export type Theme = typeof theme; 