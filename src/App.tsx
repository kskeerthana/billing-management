import React, { useState, useEffect } from 'react';
import { Users, FileText, Plus, Download, Upload } from 'lucide-react';
import { CustomerForm } from './components/customers/CustomerForm';
import { CustomerList } from './components/customers/CustomerList';
import { InvoiceForm } from './components/invoices/InvoiceForm';
import { InvoiceList } from './components/invoices/InvoiceList';
import { Button } from './components/shared/Button';
import type { Customer } from './types';
import { useStore } from './store';
import { initializeDummyData } from './utils/dummyData';

function App() {
  const [activeTab, setActiveTab] = useState<'customers' | 'invoices'>('customers');
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  
  // Zustand actions
  const initializeData = useStore(state => state.initializeData);
  const exportData = useStore(state => state.exportData);
  const importData = useStore(state => state.importData);

  // Initialize data on mount
  useEffect(() => {
    const init = async () => {
      console.log('Initializing app data...');
      
      // Check if this is the first load
      const hasSeenApp = localStorage.getItem('billing-app-initialized');
      
      if (!hasSeenApp) {
        // Initialize dummy data on first load
        await initializeDummyData();
        localStorage.setItem('billing-app-initialized', 'true');
      }
      
      // Load data from storage
      await initializeData();
      setIsFirstLoad(false);
    };
    
    init();
  }, [initializeData]);

  // Rest of your component remains the same...
  const handleCustomerComplete = () => {
    setShowCustomerForm(false);
    setEditingCustomer(null);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setShowCustomerForm(true);
  };

  const handleExportData = async () => {
    try {
      const data = await exportData();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `billing-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data');
    }
  };

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (window.confirm('This will replace all existing data. Are you sure?')) {
        await importData(data);
        // Reset UI state
        setShowCustomerForm(false);
        setShowInvoiceForm(false);
        setEditingCustomer(null);
      }
    } catch (error) {
      console.error('Error importing data:', error);
      alert('Invalid file format. Please select a valid backup file.');
    }
    
    // Reset input
    event.target.value = '';
  };

  // Add a button to reset and regenerate dummy data (optional)
  const handleResetDummyData = async () => {
    if (window.confirm('This will delete all existing data and generate new dummy data. Are you sure?')) {
      localStorage.removeItem('billing-app-initialized');
      await storageService.clearAllData();
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Billing Management
            </h1>
            <nav className="flex items-center space-x-8">
              <button
                onClick={() => setActiveTab('customers')}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'customers'
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Users className="w-4 h-4 mr-2" />
                Customers
              </button>
              <button
                onClick={() => setActiveTab('invoices')}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'invoices'
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FileText className="w-4 h-4 mr-2" />
                Invoices
              </button>
              
              <div className="border-l pl-8 flex items-center space-x-2">
                <button
                  onClick={handleExportData}
                  className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                  title="Export Data"
                >
                  <Download className="w-4 h-4" />
                </button>
                <label className="p-2 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer" title="Import Data">
                  <Upload className="w-4 h-4" />
                  <input
                    type="file"
                    accept="application/json"
                    onChange={handleImportData}
                    className="hidden"
                  />
                </label>
              </div>
            </nav>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'customers' && (
          <div className="space-y-6">
            {!showCustomerForm && (
              <div className="flex justify-end">
                <Button onClick={() => setShowCustomerForm(true)}>
                  <Plus className="w-4 h-4 mr-2 inline" />
                  Add Customer
                </Button>
              </div>
            )}
            
            {showCustomerForm ? (
              <CustomerForm 
                onComplete={handleCustomerComplete} 
                editingCustomer={editingCustomer} 
              />
            ) : (
              <CustomerList onEditCustomer={handleEditCustomer} />
            )}
          </div>
        )}

        {activeTab === 'invoices' && (
          <div className="space-y-6">
            {!showInvoiceForm && (
              <div className="flex justify-end">
                <Button onClick={() => setShowInvoiceForm(true)}>
                  <Plus className="w-4 h-4 mr-2 inline" />
                  Create Invoice
                </Button>
              </div>
            )}
            
            {showInvoiceForm ? (
              <InvoiceForm onComplete={() => setShowInvoiceForm(false)} />
            ) : (
              <InvoiceList />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;