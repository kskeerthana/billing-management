import React, { useState, useMemo } from 'react';
import { Search, Edit, Trash2, Eye } from 'lucide-react';
import type { Customer } from '../../types';
import { useStore } from '../../store';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { CustomerDetails } from './CustomerDetails';
import { Pagination } from '../shared/Pagination';

interface CustomerListProps {
  onEditCustomer: (customer: Customer) => void;
}

const ITEMS_PER_PAGE_OPTIONS = [5, 10, 20, 50];

export const CustomerList: React.FC<CustomerListProps> = ({ onEditCustomer }) => {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Get state and actions from Zustand
  const {
    customers,
    customersLoading,
    customersError,
    customerSearchTerm,
    customerSortBy,
    customerSortOrder,
    setCustomerSearchTerm,
    setCustomerSort,
    deleteCustomer
  } = useStore();

  // Compute filtered customers using useMemo to prevent infinite loops
  const filteredCustomers = useMemo(() => {
    let filtered = customers.filter(customer =>
      customer.personalInfo.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
      customer.personalInfo.email.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
      (customer.personalInfo.phone?.toLowerCase().includes(customerSearchTerm.toLowerCase()) ?? false)
    );
    
    filtered.sort((a, b) => {
      let comparison = 0;
      if (customerSortBy === 'name') {
        comparison = a.personalInfo.name.localeCompare(b.personalInfo.name);
      } else {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return customerSortOrder === 'asc' ? comparison : -comparison;
    });
    
    return filtered;
  }, [customers, customerSearchTerm, customerSortBy, customerSortOrder]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCustomers = filteredCustomers.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [customerSearchTerm, customerSortBy, customerSortOrder, itemsPerPage]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this customer? All associated invoices will also be deleted.')) {
      try {
        await deleteCustomer(id);
        // Adjust page if necessary
        if (currentCustomers.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
      } catch (error) {
        console.error('Error deleting customer:', error);
        alert('Failed to delete customer');
      }
    }
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [by, order] = e.target.value.split('-');
    setCustomerSort(by as 'name' | 'date', order as 'asc' | 'desc');
  };

  if (customersLoading) {
    return <LoadingSpinner />;
  }

  if (customersError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        Error loading customers: {customersError}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Customers</h2>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search customers..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={customerSearchTerm}
                  onChange={(e) => setCustomerSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={`${customerSortBy}-${customerSortOrder}`}
                onChange={handleSortChange}
              >
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
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

        {filteredCustomers.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {customerSearchTerm ? 'No customers found matching your search.' : 'No customers yet. Add your first customer!'}
          </div>
        ) : (
          <>
            <div className="grid gap-4">
              {currentCustomers.map((customer) => (
                <div 
                  key={customer.id} 
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium">
                            {customer.personalInfo.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {customer.personalInfo.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {customer.personalInfo.email}
                          </p>
                          {customer.personalInfo.phone && (
                            <p className="text-sm text-gray-500">
                              {customer.personalInfo.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedCustomer(customer)}
                        className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEditCustomer(customer)}
                        className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                        title="Edit Customer"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(customer.id)}
                        className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                        title="Delete Customer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {filteredCustomers.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredCustomers.length}
          itemsPerPage={itemsPerPage}
          itemName="customers"
        />
      )}

      {selectedCustomer && (
        <CustomerDetails
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
    </div>
  );
};