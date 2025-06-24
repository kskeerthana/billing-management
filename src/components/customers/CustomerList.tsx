import React, { useState, useMemo } from 'react';
import { Search, Edit, Trash2, Eye, ChevronDown } from 'lucide-react';
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
    const [showFilters, setShowFilters] = useState(false);
    
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
  
    const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentCustomers = filteredCustomers.slice(startIndex, endIndex);
  
    useMemo(() => {
      setCurrentPage(1);
    }, [customerSearchTerm, customerSortBy, customerSortOrder, itemsPerPage]);
  
    const handleDelete = async (id: string) => {
      if (window.confirm('Are you sure you want to delete this customer? All associated invoices will also be deleted.')) {
        try {
          await deleteCustomer(id);
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
        <div className="p-4 sm:p-6">
          {/* Header */}
          <div className="mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Customers</h2>
              
              {/* Desktop Filters */}
              <div className="hidden sm:flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search customers..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
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
  
            {/* Mobile Filters Toggle */}
            <div className="sm:hidden">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 rounded-md text-gray-700 hover:bg-gray-100"
              >
                <span>Filters & Search</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>
  
            {/* Mobile Filters Content */}
            {showFilters && (
              <div className="sm:hidden mt-4 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search customers..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={customerSearchTerm}
                    onChange={(e) => setCustomerSearchTerm(e.target.value)}
                  />
                </div>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={`${customerSortBy}-${customerSortOrder}`}
                  onChange={handleSortChange}
                >
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                  <option value="date-desc">Newest First</option>
                  <option value="date-asc">Oldest First</option>
                </select>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            )}
          </div>
  
          {/* Customer List */}
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {customerSearchTerm ? 'No customers found matching your search.' : 'No customers yet. Add your first customer!'}
            </div>
          ) : (
            <>
              {/* Desktop View */}
              <div className="hidden sm:block space-y-4">
                {currentCustomers.map((customer) => (
                  <div 
                    key={customer.id} 
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-blue-600 font-medium">
                              {customer.personalInfo.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-medium text-gray-900 truncate">
                              {customer.personalInfo.name}
                            </h3>
                            <p className="text-sm text-gray-600 truncate">
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
                      <div className="flex items-center space-x-2 ml-4">
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
  
              {/* Mobile View - Card Layout */}
              <div className="sm:hidden space-y-4">
                {currentCustomers.map((customer) => (
                  <div 
                    key={customer.id} 
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-600 font-medium">
                            {customer.personalInfo.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">
                            {customer.personalInfo.name}
                          </h3>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-1 mb-3">
                      <p className="text-sm text-gray-600 truncate">
                        {customer.personalInfo.email}
                      </p>
                      {customer.personalInfo.phone && (
                        <p className="text-sm text-gray-500">
                          {customer.personalInfo.phone}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => setSelectedCustomer(customer)}
                        className="px-3 py-1.5 text-sm text-gray-600 hover:text-blue-600 transition-colors"
                      >
                        View
                      </button>
                      <button
                        onClick={() => onEditCustomer(customer)}
                        className="px-3 py-1.5 text-sm text-gray-600 hover:text-blue-600 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(customer.id)}
                        className="px-3 py-1.5 text-sm text-gray-600 hover:text-red-600 transition-colors"
                      >
                        Delete
                      </button>
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