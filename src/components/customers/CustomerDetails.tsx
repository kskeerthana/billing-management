import React from 'react';
import { X } from 'lucide-react';
import type { Customer } from '../../types';

interface CustomerDetailsProps {
  customer: Customer;
  onClose: () => void;
}

export const CustomerDetails: React.FC<CustomerDetailsProps> = ({ 
  customer, 
  onClose 
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Customer Details</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">
              Personal Information
            </h4>
            <div className="bg-gray-50 rounded p-3 space-y-1">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Name:</span> {customer.personalInfo.name}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Email:</span> {customer.personalInfo.email}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Phone:</span> {customer.personalInfo.phone || 'Not provided'}
              </p>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 mb-2">
              Billing Address
            </h4>
            <div className="bg-gray-50 rounded p-3">
              <p className="text-sm text-gray-600">
                {customer.billingAddress.street}<br />
                {customer.billingAddress.city}, {customer.billingAddress.state} {customer.billingAddress.zipCode}<br />
                {customer.billingAddress.country}
              </p>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 mb-2">
              Shipping Address
            </h4>
            <div className="bg-gray-50 rounded p-3">
              <p className="text-sm text-gray-600">
                {customer.sameAsShipping ? (
                  <span className="italic">Same as billing address</span>
                ) : (
                  <>
                    {customer.shippingAddress.street}<br />
                    {customer.shippingAddress.city}, {customer.shippingAddress.state} {customer.shippingAddress.zipCode}<br />
                    {customer.shippingAddress.country}
                  </>
                )}
              </p>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 mb-2">
              Account Information
            </h4>
            <div className="bg-gray-50 rounded p-3 space-y-1">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Customer ID:</span> {customer.id}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Created:</span> {new Date(customer.createdAt).toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Last Updated:</span> {new Date(customer.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};