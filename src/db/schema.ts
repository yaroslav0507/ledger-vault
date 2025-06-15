import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'transactions',
      columns: [
        { name: 'date', type: 'string' },
        { name: 'card', type: 'string' },
        { name: 'amount', type: 'number' },
        { name: 'currency', type: 'string' },
        { name: 'description', type: 'string' },
        { name: 'category', type: 'string' },
        { name: 'comment', type: 'string', isOptional: true },
        { name: 'is_duplicate', type: 'boolean' },
        { name: 'is_income', type: 'boolean' },
        { name: 'is_archived', type: 'boolean', isOptional: true },
        { name: 'created_at', type: 'number' },
      ],
    }),
  ],
}); 