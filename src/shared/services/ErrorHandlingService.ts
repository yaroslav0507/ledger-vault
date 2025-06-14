import { Alert } from 'react-native';

export interface ErrorContext {
  operation: string;
  userMessage?: string;
  shouldAlert?: boolean;
  logLevel?: 'error' | 'warn' | 'info';
}

export class ErrorHandlingService {
  static handleError(error: unknown, context: ErrorContext): void {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const { operation, userMessage, shouldAlert = true, logLevel = 'error' } = context;
    
    console[logLevel](`${operation} error:`, error);
    
    if (shouldAlert) {
      const displayMessage = userMessage || `Failed to ${operation.toLowerCase()}`;
      Alert.alert('Error', displayMessage);
    }
  }

  static handleAsyncError<T>(
    asyncOperation: () => Promise<T>,
    context: ErrorContext
  ): Promise<T | null> {
    return asyncOperation().catch((error) => {
      this.handleError(error, context);
      return null;
    });
  }
} 