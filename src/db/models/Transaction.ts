import { Model } from '@nozbe/watermelondb';
import { field, readonly, date } from '@nozbe/watermelondb/decorators';

export default class Transaction extends Model {
  static table = 'transactions';

  @field('date') date!: string;
  @field('card') card!: string;
  @field('amount') amount!: number;
  @field('currency') currency!: string;
  @field('description') description!: string;
  @field('category') category!: string;
  @field('comment') comment!: string;
  @field('is_duplicate') isDuplicate!: boolean;
  @field('is_income') isIncome!: boolean;
  @field('is_archived') isArchived!: boolean;
  @field('created_at') createdAt!: number;

  @readonly @date('created_at') createdAtDate!: Date;
} 