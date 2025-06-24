import { z } from 'zod';

// Personal Info Schema
export const personalInfoSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional()
}).refine((data) => data.email || data.phone, {
  message: "Either email or phone is required",
  path: ["phone"]
});

// Address Schema
export const addressSchema = z.object({
  street: z.string().min(1, "Street is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(2, "State is required"),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, "Invalid ZIP code"),
  country: z.string().min(1, "Country is required")
});

// Customer Schema
export const customerSchema = z.object({
  personalInfo: personalInfoSchema,
  billingAddress: addressSchema,
  shippingAddress: addressSchema,
  sameAsShipping: z.boolean()
});

//Invoice Item Schema
export const invoiceItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  price: z.number().min(0, "Price must be positive"),
  total: z.number(),
  taxRate: z.number().min(0).max(100).optional() // Made optional and moved after total
});

//Invoice Schema
export const invoiceSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  date: z.string().min(1, "Date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
  globalTaxRate: z.number().min(0).max(100).optional(),
  discount: z.number().min(0).optional(),
  discountType: z.enum(['percentage', 'fixed']).optional(),
  subtotal: z.number().optional(),
  totalTax: z.number().optional(),
  notes: z.string().optional()
});

//Export types from schemas
export type PersonalInfo = z.infer<typeof personalInfoSchema>;
export type Address = z.infer<typeof addressSchema>;
export type Customer = z.infer<typeof customerSchema> & {
  id: string;
  createdAt: Date;
  updatedAt: Date;
};
export type InvoiceItem = z.infer<typeof invoiceItemSchema>;
export type Invoice = z.infer<typeof invoiceSchema> & {
  id: string;
  invoiceNumber: string;
  total: number;
  status: 'paid' | 'unpaid';
  createdAt: Date;
};

export type CustomerFormData = z.infer<typeof customerSchema>;
export type InvoiceFormData = z.infer<typeof invoiceSchema>;