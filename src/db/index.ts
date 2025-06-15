import { Platform } from 'react-native';
import { Database } from '@nozbe/watermelondb';
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs';
import { schema } from './schema';
import Transaction from './models/Transaction';

let adapter: any;

if (Platform.OS === 'web') {
  adapter = new LokiJSAdapter({
    schema,
    useWebWorker: false,
    useIncrementalIndexedDB: true,
    dbName: 'LedgerVaultDB',
  });
} else {
  // Dynamically require SQLiteAdapter to avoid bundling it for web
  const SQLiteAdapter = require('@nozbe/watermelondb/adapters/sqlite').default;
  adapter = new SQLiteAdapter({
    schema,
    dbName: 'LedgerVaultDB',
    jsi: true,
    onSetUpError: (error: any) => {
      console.error('❌ WatermelonDB setup error:', error);
    },
  });
}

export const database = new Database({
  adapter,
  modelClasses: [Transaction],
  actionsEnabled: true,
});

export async function initializeDatabase() {
  try {
    console.log('✅ WatermelonDB initialized');
    return database;
  } catch (error) {
    console.error('❌ WatermelonDB initialization failed:', error);
    throw error;
  }
} 