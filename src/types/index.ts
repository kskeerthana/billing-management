import { z } from 'zod';
import { customerSchema, invoiceSchema } from '../schemas';

// Infer types from Zod schemas
export type CustomerFormData = z.infer<typeof customerSchema>;
export type InvoiceFormData = z.infer<typeof invoiceSchema>;

// Complete types with metadata
export interface Customer extends CustomerFormData {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Invoice extends InvoiceFormData {
  id: string;
  invoiceNumber: string;
  total: number;
  status: 'paid' | 'unpaid';
  createdAt: Date;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  price: number;
  total: number;
}