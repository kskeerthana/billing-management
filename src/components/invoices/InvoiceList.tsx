import React, { useMemo } from 'react';
import { FileText, DollarSign } from 'lucide-react';
import type { Invoice } from '../../types';
import { useStore } from '../../store';
import { LoadingSpinner } from '../shared/LoadingSpinner';

export const InvoiceList: React.FC = () => {
  // Get state from Zustand
  const {
    invoices,
    customers,
    invoicesLoading,
    invoicesError,
    selectedCustomerId,
    setSelectedCustomerId,
    updateInvoice
  } = useStore();

  // Compute filtered invoices using useMemo
  const filteredInvoices = useMemo(() => {
    if (selectedCustomerId) {
      return invoices.filter(inv => inv.customerId === selectedCustomerId);
    }
    return invoices;
  }, [invoices, selectedCustomerId]);

  const toggleInvoiceStatus = async (invoice: Invoice) => {
    try {
      const updatedInvoice: Invoice = {
        ...invoice,
        status: invoice.status === 'paid' ? 'unpaid' : 'paid'
      };
      await updateInvoice(invoice.id, updatedInvoice);
    } catch (error) {
      console.error('Error updating invoice:', error);
      alert('Failed to update invoice status');
    }
  };

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.personalInfo.name || 'Unknown Customer';
  };

  if (invoicesLoading) {
    return <LoadingSpinner />;
  }

  if (invoicesError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        Error loading invoices: {invoicesError}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Invoices</h2>
          <select
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
          >
            <option value="">All Customers</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.personalInfo.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredInvoices.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          {selectedCustomerId 
            ? 'No invoices found for this customer.' 
            : 'No invoices yet. Create your first invoice!'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInvoices.map((invoice) => {
                const isOverdue = new Date(invoice.dueDate) < new Date() && invoice.status === 'unpaid';
                
                return (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {invoice.invoiceNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getCustomerName(invoice.customerId)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(invoice.date).toLocaleDateString()}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                      isOverdue ? 'text-red-600 font-medium' : 'text-gray-900'
                    }`}>
                      {new Date(invoice.dueDate).toLocaleDateString()}
                      {isOverdue && ' (Overdue)'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {invoice.items.length} item{invoice.items.length !== 1 ? 's' : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 text-gray-400 mr-1" />
                        {invoice.total.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleInvoiceStatus(invoice)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                          invoice.status === 'paid'
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                        }`}
                      >
                        {invoice.status === 'paid' ? '✓ Paid' : '○ Unpaid'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 flex justify-between items-center text-sm text-gray-600">
        <div>
          Total Invoices: {filteredInvoices.length}
        </div>
        <div className="space-x-4">
          <span>
            Paid: {filteredInvoices.filter(inv => inv.status === 'paid').length}
          </span>
          <span>
            Unpaid: {filteredInvoices.filter(inv => inv.status === 'unpaid').length}
          </span>
          <span className="font-medium">
            Total Amount: ${filteredInvoices.reduce((sum, inv) => sum + inv.total, 0).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};