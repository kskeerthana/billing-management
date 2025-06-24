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

// Complete Customer Schema
export const customerSchema = z.object({
  personalInfo: personalInfoSchema,
  billingAddress: addressSchema,
  shippingAddress: addressSchema,
  sameAsShipping: z.boolean()
});

// Enhanced Invoice Item Schema with tax
export const invoiceItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  price: z.number().min(0, "Price must be positive"),
  taxRate: z.number().min(0).max(100).default(0), // Tax rate as percentage
  total: z.number()
});

// Enhanced Invoice Schema with all fields
export const invoiceSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  date: z.string().min(1, "Date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
  // Additional fields for the enhanced form
  globalTaxRate: z.number().min(0).max(100).default(0), // Changed to have default
  discount: z.number().min(0).default(0), // Discount amount
  discountType: z.enum(['percentage', 'fixed']).default('percentage'),
  subtotal: z.number().default(0), // Changed to have default
  totalTax: z.number().default(0), // Changed to have default
  notes: z.string().default('') // Changed to have default
});

// Export types from schemas
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

// Form-specific types (for use in forms)
export type CustomerFormData = z.infer<typeof customerSchema>;
export type InvoiceFormData = z.infer<typeof invoiceSchema>;