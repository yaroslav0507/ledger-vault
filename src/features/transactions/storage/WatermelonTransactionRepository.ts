import { Q } from '@nozbe/watermelondb';
import { database } from '@/db';
import Transaction from '@/db/models/Transaction';
import { Transaction as TransactionInterface, TransactionFilters, CreateTransactionRequest, UpdateTransactionRequest } from '../model/Transaction';

export class WatermelonTransactionRepository {
  private collection = database.collections.get('transactions');

  // Helper to convert WatermelonDB model to interface
  private modelToInterface(model: Transaction): TransactionInterface {
    return {
      id: model.id,
      date: model.date,
      card: model.card,
      amount: model.amount,
      currency: model.currency,
      description: model.description,
      category: model.category,
      comment: model.comment || undefined,
      isDuplicate: model.isDuplicate,
      isIncome: model.isIncome,
      isArchived: model.isArchived || false,
      createdAt: new Date(model.createdAt).toISOString(),
    };
  }

  async create(request: CreateTransactionRequest): Promise<TransactionInterface> {
    const transaction = await database.write(async () => {
      return await this.collection.create((transaction: Transaction) => {
        transaction.date = request.date;
        transaction.card = request.card;
        transaction.amount = request.amount;
        transaction.currency = request.currency;
        transaction.description = request.description;
        transaction.category = request.category;
        transaction.comment = request.comment || '';
        transaction.isDuplicate = false;
        transaction.isIncome = request.isIncome;
        transaction.isArchived = false;
        transaction.createdAt = Date.now();
      });
    });

    return this.modelToInterface(transaction);
  }

  async bulkCreate(requests: CreateTransactionRequest[]): Promise<TransactionInterface[]> {
    const transactions = await database.write(async () => {
      const batch = requests.map(request => 
        this.collection.prepareCreate((record: any) => {
          const transaction = record as Transaction;
          transaction.date = request.date;
          transaction.card = request.card;
          transaction.amount = request.amount;
          transaction.currency = request.currency;
          transaction.description = request.description;
          transaction.category = request.category;
          transaction.comment = request.comment || '';
          transaction.isDuplicate = false;
          transaction.isIncome = request.isIncome;
          transaction.isArchived = false;
          transaction.createdAt = Date.now();
        })
      );
      
      await database.batch(...batch);
      return batch;
    });

    return transactions.map((t: Transaction) => this.modelToInterface(t));
  }

  async findById(id: string): Promise<TransactionInterface | null> {
    try {
      const transaction = await this.collection.find(id);
      return this.modelToInterface(transaction);
    } catch (error) {
      return null;
    }
  }

  async findAll(filters?: TransactionFilters): Promise<TransactionInterface[]> {
    // Collect query conditions in an array first
    const conditions: any[] = [];

    // Exclude archived by default
    const includeArchived = filters?.includeArchived ?? false;
    if (!includeArchived) {
      conditions.push(Q.where('is_archived', Q.notEq(true)));
    }

    if (filters) {
      // Date range
      if (filters.dateRange) {
        const { start, end } = filters.dateRange;
        conditions.push(Q.where('date', Q.gte(start)));
        conditions.push(Q.where('date', Q.lte(end)));
      }

      // Category filter
      if (filters.categories && filters.categories.length > 0) {
        const mode = filters.categoriesMode ?? 'include';
        if (mode === 'include') {
          conditions.push(Q.where('category', Q.oneOf(filters.categories)));
        } else {
          conditions.push(Q.where('category', Q.notIn(filters.categories)));
        }
      }

      // Card filter
      if (filters.cards && filters.cards.length > 0) {
        conditions.push(Q.where('card', Q.oneOf(filters.cards)));
      }

      // Income / expense
      if (filters.isIncome !== undefined) {
        conditions.push(Q.where('is_income', filters.isIncome));
      }

      // Amount range
      if (filters.amountRange) {
        conditions.push(Q.where('amount', Q.gte(filters.amountRange.min)));
        conditions.push(Q.where('amount', Q.lte(filters.amountRange.max)));
      }

      // Free-text search
      if (filters.searchQuery) {
        const term = filters.searchQuery.toLowerCase();
        conditions.push(
          Q.or(
            Q.where('description', Q.like(`%${term}%`)),
            Q.where('comment', Q.like(`%${term}%`))
          )
        );
      }
    }

    // Always sort newest first
    conditions.push(Q.sortBy('date', Q.desc));

    const transactions = await this.collection.query(...conditions).fetch();
    return transactions.map((t: Transaction) => this.modelToInterface(t));
  }

  async update(id: string, updates: UpdateTransactionRequest): Promise<TransactionInterface> {
    const transaction = await database.write(async () => {
      const transaction = await this.collection.find(id);
      return await transaction.update((transaction: Transaction) => {
        if (updates.date !== undefined) transaction.date = updates.date;
        if (updates.card !== undefined) transaction.card = updates.card;
        if (updates.amount !== undefined) transaction.amount = updates.amount;
        if (updates.currency !== undefined) transaction.currency = updates.currency;
        if (updates.description !== undefined) transaction.description = updates.description;
        if (updates.category !== undefined) transaction.category = updates.category;
        if (updates.comment !== undefined) transaction.comment = updates.comment;
        if (updates.isIncome !== undefined) transaction.isIncome = updates.isIncome;
        if (updates.isArchived !== undefined) transaction.isArchived = updates.isArchived;
      });
    });

    return this.modelToInterface(transaction);
  }

  async archive(id: string): Promise<void> {
    await database.write(async () => {
      const transaction = await this.collection.find(id);
      await transaction.update((transaction: Transaction) => {
        transaction.isArchived = true;
      });
    });
  }

  async unarchive(id: string): Promise<void> {
    await database.write(async () => {
      const transaction = await this.collection.find(id);
      await transaction.update((transaction: Transaction) => {
        transaction.isArchived = false;
      });
    });
  }

  async delete(id: string): Promise<void> {
    await database.write(async () => {
      const transaction = await this.collection.find(id);
      await transaction.markAsDeleted();
    });
  }

  async clearAll(): Promise<void> {
    await database.write(async () => {
      const allTransactions = await this.collection.query().fetch();
      const batch = allTransactions.map((transaction: Transaction) => transaction.prepareMarkAsDeleted());
      await database.batch(...batch);
    });
  }

  async getTotalCount(): Promise<number> {
    const count = await this.collection.query().fetchCount();
    return count;
  }

  async getAllCardsForDateRange(dateRange?: { start: string; end: string }): Promise<string[]> {
    let query = this.collection.query(Q.where('is_archived', Q.notEq(true)));

    if (dateRange) {
      query = this.collection.query(
        Q.where('is_archived', Q.notEq(true)),
        Q.where('date', Q.gte(dateRange.start)),
        Q.where('date', Q.lte(dateRange.end))
      );
    }

    const transactions = await query.fetch();
    const cards = Array.from(new Set<string>(transactions.map((t: Transaction) => t.card))).filter(Boolean) as string[];
    return cards.sort();
  }

  async getAllTransactionDates(): Promise<string[]> {
    const transactions = await this.collection.query().fetch();
    return transactions.map((t: Transaction) => t.date);
  }

  // Helper method to check if date is in range
  private isDateInRange(date: string, start: string, end: string): boolean {
    return date >= start && date <= end;
  }

  async findPotentialDuplicates(_transaction: TransactionInterface): Promise<TransactionInterface[]> {
    // Duplicate detection not implemented in WatermelonDB POC
    return [];
  }
} 