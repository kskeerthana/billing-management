import React, { useMemo, useState } from 'react';
import { FileText, DollarSign } from 'lucide-react';
import type { Invoice } from '../../types';
import { useStore } from '../../store';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { Pagination } from '../shared/Pagination';

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

export const InvoiceList: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Getting state from Zustand
  const {
    invoices,
    customers,
    invoicesLoading,
    invoicesError,
    selectedCustomerId,
    setSelectedCustomerId,
    updateInvoice
  } = useStore();

  // filtered invoices using useMemo
  const filteredInvoices = useMemo(() => {
    if (selectedCustomerId) {
      return invoices.filter(inv => inv.customerId === selectedCustomerId);
    }
    return invoices;
  }, [invoices, selectedCustomerId]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentInvoices = filteredInvoices.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [selectedCustomerId, itemsPerPage]);

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

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const paid = filteredInvoices.filter(inv => inv.status === 'paid').length;
    const unpaid = filteredInvoices.filter(inv => inv.status === 'unpaid').length;
    const totalAmount = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const paidAmount = filteredInvoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.total, 0);
    const unpaidAmount = filteredInvoices
      .filter(inv => inv.status === 'unpaid')
      .reduce((sum, inv) => sum + inv.total, 0);
    
    return { paid, unpaid, totalAmount, paidAmount, unpaidAmount };
  }, [filteredInvoices]);

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
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Invoices</h2>
            <div className="flex items-center space-x-2">
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
              <select
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
              >
                {ITEMS_PER_PAGE_OPTIONS.map(option => (
                  <option key={option} value={option}>
                    {option} per page
                  </option>
                ))}
              </select>
            </div>
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
          <>
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
                  {currentInvoices.map((invoice) => {
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

            {/* Summary Statistics */}
            <div className="mt-6 pt-6 border-t grid grid-cols-1 md:grid-cols-5 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Total Invoices</p>
                <p className="text-lg font-semibold">{filteredInvoices.length}</p>
              </div>
              <div>
                <p className="text-gray-600">Paid</p>
                <p className="text-lg font-semibold text-green-600">{summaryStats.paid}</p>
              </div>
              <div>
                <p className="text-gray-600">Unpaid</p>
                <p className="text-lg font-semibold text-yellow-600">{summaryStats.unpaid}</p>
              </div>
              <div>
                <p className="text-gray-600">Total Amount</p>
                <p className="text-lg font-semibold">${summaryStats.totalAmount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-600">Outstanding</p>
                <p className="text-lg font-semibold text-red-600">
                  ${summaryStats.unpaidAmount.toFixed(2)}
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {filteredInvoices.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredInvoices.length}
          itemsPerPage={itemsPerPage}
          itemName="invoices"
        />
      )}
    </div>
  );
};