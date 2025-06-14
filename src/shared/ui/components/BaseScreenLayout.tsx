import React from 'react';
import { View, StyleSheet, StatusBar, SectionList } from 'react-native';
import { FAB, Text } from 'react-native-paper';
import { EmptyState } from '@/shared/ui/components/EmptyState';
import { MetricsSummaryHeader } from '@/shared/ui/components';
import { TransactionFilterContainer } from '@/shared/ui/components/TransactionFilter/TransactionFilterContainer';
import { TransactionFilters, Transaction } from '@/features/transactions/model/Transaction';
import { theme } from '@/shared/ui/theme/theme';

export interface BaseScreenLayoutProps {
  // Screen state
  isInitialized: boolean;
  screenName: string;
  
  // SectionList props
  sections: any[];
  renderItem: ({ item }: { item: any }) => React.ReactElement;
  keyExtractor: (item: any) => string;
  
  // Configurable header component
  headerComponent?: React.ReactElement | null;
  
  // Legacy header props (for backward compatibility)
  headerProps?: {
    balance: any;
    transactionCount: number;
    currency: string;
    currentFilters: any;
    error: string | null;
    onAddTransaction: () => void;
    onFileSelect: (file: File) => void;
  };
  
  // Sticky header props (TransactionFilterContainer)
  stickyHeaderProps: {
    transactionCount: number;
    totalTransactionCount: number;
    filters: TransactionFilters;
    setFilters: (filters: Partial<TransactionFilters>) => void;
    clearFilters: () => void;
    availableCards: string[];
    transactions: Transaction[];
    screenTitle?: string;
  };
  
  // Additional header content (for analytics insights)
  additionalHeaderContent?: React.ReactElement | null;
  
  // Empty state
  emptyStateProps: any;
  
  // Scroll to top FAB
  showScrollToTop?: boolean;
  onScrollToTop?: () => void;
  
  // SectionList ref and props
  sectionListRef: React.RefObject<SectionList | null>;
  sectionListProps: any;
}

export const BaseScreenLayout: React.FC<BaseScreenLayoutProps> = ({
  isInitialized,
  screenName,
  sections,
  renderItem,
  keyExtractor,
  headerComponent,
  headerProps,
  stickyHeaderProps,
  additionalHeaderContent,
  emptyStateProps,
  showScrollToTop = false,
  onScrollToTop,
  sectionListRef,
  sectionListProps
}) => {
  const renderListHeader = () => (
    <View>
      {headerComponent || (headerProps && <MetricsSummaryHeader {...headerProps} />)}
      {additionalHeaderContent}
    </View>
  );

  const renderStickyHeader = () => (
    <TransactionFilterContainer {...stickyHeaderProps} />
  );

  const renderEmptyComponent = () => {
    if (!emptyStateProps) return null;
    return <EmptyState {...emptyStateProps} />;
  };

  if (!isInitialized) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Initializing {screenName}...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

      <SectionList
        ref={sectionListRef}
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        sections={sections}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        renderSectionHeader={renderStickyHeader}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderEmptyComponent}
        {...sectionListProps}
      />

      {showScrollToTop && onScrollToTop && (
        <FAB
          style={styles.scrollToTopFab}
          icon="arrow-up"
          color={theme.colors.text.inverse}
          onPress={onScrollToTop}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundSecondary,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...theme.typography.bodyLarge,
    color: theme.colors.text.secondary,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  scrollToTopFab: {
    position: 'absolute',
    margin: theme.spacing.md,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
    opacity: 0.7,
    elevation: 2,
    shadowOpacity: 0.2,
  },
}); 