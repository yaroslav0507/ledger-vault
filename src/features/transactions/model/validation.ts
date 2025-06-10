import { z } from 'zod';

export const transactionFormSchema = z.object({
  description: z
    .string()
    .min(1, 'Description is required')
    .max(100, 'Description must be less than 100 characters')
    .trim(),
  
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    }, 'Amount must be a valid positive number'),
  
  card: z
    .string()
    .min(1, 'Card/Account is required')
    .max(50, 'Card/Account name must be less than 50 characters')
    .trim(),
  
  category: z
    .string()
    .min(1, 'Category is required')
    .max(50, 'Category must be less than 50 characters')
    .trim(),
  
  comment: z
    .string()
    .max(200, 'Comment must be less than 200 characters')
    .optional(),
  
  isIncome: z
    .boolean()
    .default(false),
  
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$|^\d{4}-\d{2}-\d{2}$/, 'Date must be in ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ) or YYYY-MM-DD format')
    .refine((date) => {
      const parsed = new Date(date);
      return !isNaN(parsed.getTime());
    }, 'Please enter a valid date'),
  
  currency: z
    .enum(['UAH', 'USD', 'EUR', 'GBP', 'ILS'])
    .default('UAH')
});

export type TransactionFormData = z.infer<typeof transactionFormSchema>;

export interface ValidationErrors {
  description?: string;
  amount?: string;
  card?: string;
  category?: string;
  comment?: string;
  date?: string;
  currency?: string;
  isIncome?: string;
}

export const validateTransactionForm = (data: any): { 
  success: boolean; 
  data?: TransactionFormData; 
  errors?: ValidationErrors 
} => {
  try {
    const validatedData = transactionFormSchema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors: ValidationErrors = {};
      
      error.errors.forEach((err) => {
        const path = err.path[0] as keyof ValidationErrors;
        if (path) {
          fieldErrors[path] = err.message;
        }
      });
      
      return { success: false, errors: fieldErrors };
    }
    
    return { success: false, errors: { description: 'Validation failed' } };
  }
}; 