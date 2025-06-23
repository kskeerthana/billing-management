import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2 } from 'lucide-react';
import { z } from 'zod';
import { invoiceSchema } from '../../schemas';
import type { Invoice } from '../../types';
import { Input } from '../shared/Input';
import { Button } from '../shared/Button';
import { useStore, useCustomers } from '../../store';

// Extend the invoice item schema to include tax for UI
const invoiceItemWithTaxSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  price: z.number().min(0, "Price must be positive"),
  taxRate: z.number().min(0).max(100).default(0),
  total: z.number()
});

// Create extended invoice schema for the form
const extendedInvoiceSchema = invoiceSchema.extend({
  items: z.array(invoiceItemWithTaxSchema),
  taxRate: z.number().min(0).max(100).optional(),
  discount: z.number().min(0).default(0),
  discountType: z.enum(['percentage', 'fixed']).default('percentage'),
  notes: z.string().optional()
});

type ExtendedInvoiceFormData = z.infer<typeof extendedInvoiceSchema>;

interface InvoiceFormProps {
  onComplete: () => void;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({ onComplete }) => {
  const [loading, setLoading] = useState(false);
  const [useGlobalTax, setUseGlobalTax] = useState(false);
  
  // Get customers from Zustand store
  const customers = useCustomers();
  const { addInvoice, getNextInvoiceNumber } = useStore();

  const { 
    register, 
    control, 
    handleSubmit, 
    watch,
    setValue,
    formState: { errors } 
  } = useForm<ExtendedInvoiceFormData>({
    resolver: zodResolver(extendedInvoiceSchema),
    defaultValues: {
      customerId: '',
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      items: [{ description: '', quantity: 1, price: 0, taxRate: 0, total: 0 }],
      discount: 0,
      discountType: 'percentage',
      taxRate: 0,
      notes: ''
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });

  const watchItems = watch('items');
  const watchDiscount = watch('discount') || 0;
  const watchDiscountType = watch('discountType') || 'percentage';
  const watchGlobalTaxRate = watch('taxRate') || 0;

  // Calculate item totals with tax
  useEffect(() => {
    watchItems.forEach((item, index) => {
      const subtotal = (item.quantity || 0) * (item.price || 0);
      const taxRate = useGlobalTax ? watchGlobalTaxRate : (item.taxRate || 0);
      const taxAmount = subtotal * (taxRate / 100);
      const total = subtotal + taxAmount;
      
      if (total !== item.total) {
        setValue(`items.${index}.total`, total);
      }
    });
  }, [watchItems, setValue, useGlobalTax, watchGlobalTaxRate]);

  const calculateSubtotal = () => {
    return watchItems.reduce((sum, item) => {
      const itemSubtotal = (item.quantity || 0) * (item.price || 0);
      return sum + itemSubtotal;
    }, 0);
  };

  const calculateTotalTax = () => {
    return watchItems.reduce((sum, item) => {
      const itemSubtotal = (item.quantity || 0) * (item.price || 0);
      const taxRate = useGlobalTax ? watchGlobalTaxRate : (item.taxRate || 0);
      const taxAmount = itemSubtotal * (taxRate / 100);
      return sum + taxAmount;
    }, 0);
  };

  const calculateDiscount = () => {
    const subtotal = calculateSubtotal();
    if (watchDiscountType === 'percentage') {
      return subtotal * (watchDiscount / 100);
    }
    return watchDiscount;
  };

  const calculateGrandTotal = () => {
    const subtotal = calculateSubtotal();
    const totalTax = calculateTotalTax();
    const discount = calculateDiscount();
    return subtotal + totalTax - discount;
  };

  // Explicitly type the submit handler
  const onSubmit: SubmitHandler<ExtendedInvoiceFormData> = async (data) => {
    try {
      setLoading(true);
      const invoiceNumber = await getNextInvoiceNumber();
      
      // Transform to match the base Invoice type
      const invoice: Invoice = {
        id: Date.now().toString(),
        invoiceNumber,
        customerId: data.customerId,
        date: data.date,
        dueDate: data.dueDate,
        items: data.items
          .filter(item => item.description)
          .map(item => ({
            description: item.description,
            quantity: item.quantity,
            price: item.price,
            total: item.total
          })),
        total: calculateGrandTotal(),
        status: 'unpaid',
        createdAt: new Date()
      };
      
      await addInvoice(invoice);
      onComplete();
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('Failed to create invoice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Create New Invoice</h2>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer <span className="text-red-500">*</span>
            </label>
            <select
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.customerId ? 'border-red-500' : 'border-gray-300'
              }`}
              {...register('customerId')}
            >
              <option value="">Select a customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.personalInfo.name} ({customer.personalInfo.email})
                </option>
              ))}
            </select>
            {errors.customerId && (
              <p className="text-sm text-red-600 mt-1">
                {errors.customerId.message}
              </p>
            )}
          </div>
          
          <Input
            label="Invoice Date *"
            type="date"
            {...register('date')}
            error={errors.date?.message}
          />
          
          <Input
            label="Due Date *"
            type="date"
            {...register('dueDate')}
            error={errors.dueDate?.message}
          />
        </div>

        {/* Global Tax Option */}
        <div className="mb-4 flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={useGlobalTax}
              onChange={(e) => setUseGlobalTax(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Use global tax rate</span>
          </label>
          {useGlobalTax && (
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-700">Tax Rate:</label>
              <Controller
                name="taxRate"
                control={control}
                render={({ field }) => (
                  <input
                    type="number"
                    className="w-20 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    min="0"
                    max="100"
                    step="0.1"
                  />
                )}
              />
              <span className="text-sm text-gray-700">%</span>
            </div>
          )}
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Items</h3>
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => append({ description: '', quantity: 1, price: 0, taxRate: 0, total: 0 })}
            >
              <Plus className="w-4 h-4 mr-1 inline" />
              Add Item
            </Button>
          </div>
          
          {errors.items && (
            <p className="text-sm text-red-600 mb-2">
              {errors.items.message || errors.items.root?.message}
            </p>
          )}
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item Name *
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  {!useGlobalTax && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tax Rate (%)
                    </th>
                  )}
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {fields.map((field, index) => (
                  <tr key={field.id}>
                    <td className="px-4 py-4">
                      <input
                        type="text"
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.items?.[index]?.description ? 'border-red-500' : 'border-gray-300'
                        }`}
                        {...register(`items.${index}.description`)}
                        placeholder="Service or product name"
                      />
                      {errors.items?.[index]?.description && (
                        <p className="text-xs text-red-600 mt-1">
                          {errors.items[index]?.description?.message}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <Controller
                        name={`items.${index}.quantity`}
                        control={control}
                        render={({ field }) => (
                          <input
                            type="number"
                            className={`w-20 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              errors.items?.[index]?.quantity ? 'border-red-500' : 'border-gray-300'
                            }`}
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            min="1"
                          />
                        )}
                      />
                    </td>
                    <td className="px-4 py-4">
                      <Controller
                        name={`items.${index}.price`}
                        control={control}
                        render={({ field }) => (
                          <input
                            type="number"
                            className={`w-24 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              errors.items?.[index]?.price ? 'border-red-500' : 'border-gray-300'
                            }`}
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                          />
                        )}
                      />
                    </td>
                    {!useGlobalTax && (
                      <td className="px-4 py-4">
                        <Controller
                          name={`items.${index}.taxRate`}
                          control={control}
                          render={({ field }) => (
                            <select
                              className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            >
                              <option value="0">0%</option>
                              <option value="5">5%</option>
                              <option value="10">10%</option>
                              <option value="15">15%</option>
                              <option value="20">20%</option>
                            </select>
                          )}
                        />
                      </td>
                    )}
                    <td className="px-4 py-4">
                      <span className="text-gray-900 font-medium">
                        ${watchItems[index]?.total?.toFixed(2) || '0.00'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="text-red-600 hover:text-red-700 transition-colors"
                        disabled={fields.length === 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Discount Section */}
        <div className="mb-6 flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Discount:</label>
            <Controller
              name="discount"
              control={control}
              render={({ field }) => (
                <input
                  type="number"
                  className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                />
              )}
            />
            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              {...register('discountType')}
            >
              <option value="percentage">%</option>
              <option value="fixed">$</option>
            </select>
          </div>
        </div>

        {/* Notes Section */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes (Optional)
          </label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            {...register('notes')}
            placeholder="Add any additional notes or terms..."
          />
        </div>

        {/* Totals Section */}
        <div className="border-t pt-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">${calculateSubtotal().toFixed(2)}</span>
            </div>
            {calculateTotalTax() > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Tax:</span>
                <span className="font-medium">${calculateTotalTax().toFixed(2)}</span>
              </div>
            )}
            {calculateDiscount() > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Discount:</span>
                <span className="font-medium text-red-600">-${calculateDiscount().toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-semibold pt-2 border-t">
              <span>Grand Total:</span>
              <span className="text-blue-600">${calculateGrandTotal().toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <Button 
            type="button" 
            variant="secondary"
            onClick={onComplete}
          >
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Create Invoice
          </Button>
        </div>
      </form>
    </div>
  );
};