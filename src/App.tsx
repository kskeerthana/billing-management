import React, { useState, useEffect } from 'react';
import { Users, FileText, Plus, Download, Upload, RefreshCw } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CustomerForm } from './components/customers/CustomerForm';
import { CustomerList } from './components/customers/CustomerList';
import { InvoiceForm } from './components/invoices/InvoiceForm';
import { InvoiceList } from './components/invoices/InvoiceList';
import { Button } from './components/shared/Button';
import { LoadingSpinner } from './components/shared/LoadingSpinner';
import type { Customer } from './types';
import { useStore } from './store';
import { initializeDummyData } from './utils/dummyData';
import { storageService } from './services/storage.services';

function App() {
  const [activeTab, setActiveTab] = useState<'customers' | 'invoices'>('customers');
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  
  // Zustand actions and state
  const initializeData = useStore(state => state.initializeData);
  const importData = useStore(state => state.importData);
  const customers = useStore(state => state.customers);
  const invoices = useStore(state => state.invoices);

  // Initialize data on mount
  useEffect(() => {
    const init = async () => {
      try {
        console.log('Initializing app data...');
        
        // Check if this is the first time using the app
        const hasSeenApp = localStorage.getItem('billing-app-initialized');
        
        if (!hasSeenApp) {
          // Initialize dummy data on first load
          await initializeDummyData();
          localStorage.setItem('billing-app-initialized', 'true');
        }
        
        // Load data from storage
        await initializeData();
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setIsFirstLoad(false);
      }
    };
    
    init();
  }, [initializeData]);

  // Handle tab change - always show list view when switching tabs
  const handleTabChange = (tab: 'customers' | 'invoices') => {
    setActiveTab(tab);
    // Reset forms when switching tabs
    setShowCustomerForm(false);
    setShowInvoiceForm(false);
    setEditingCustomer(null);
  };

  const handleCustomerComplete = () => {
    setShowCustomerForm(false);
    setEditingCustomer(null);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setShowCustomerForm(true);
  };

  // Export current table as PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    if (activeTab === 'customers') {
      // Add title
      doc.setFontSize(20);
      doc.text('Customer List', pageWidth / 2, 20, { align: 'center' });
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, 30, { align: 'center' });
      
      // Prepare customer data for table
      const tableData = customers.map(customer => [
        customer.personalInfo.name,
        customer.personalInfo.email,
        customer.personalInfo.phone || 'N/A',
        `${customer.billingAddress.city}, ${customer.billingAddress.state}`,
        new Date(customer.createdAt).toLocaleDateString()
      ]);
      
      // Add customer table
      autoTable(doc, {
        head: [['Name', 'Email', 'Phone', 'Location', 'Created Date']],
        body: tableData,
        startY: 40,
        styles: {
          fontSize: 9,
          cellPadding: 3
        },
        headStyles: {
          fillColor: [37, 99, 235], // Blue color
          textColor: 255
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251] // Light gray
        }
      });
      
      // Save the PDF
      doc.save(`customers-${new Date().toISOString().split('T')[0]}.pdf`);
      
    } else {
      // Export invoices
      doc.setFontSize(20);
      doc.text('Invoice List', pageWidth / 2, 20, { align: 'center' });
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, 30, { align: 'center' });
      
      // Calculate summary
      const totalAmount = invoices.reduce((sum, inv) => sum + inv.total, 0);
      const paidAmount = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.total, 0);
      const unpaidAmount = invoices.filter(inv => inv.status === 'unpaid').reduce((sum, inv) => sum + inv.total, 0);
      
      // Add summary
      doc.setFontSize(11);
      doc.text(`Total Invoices: ${invoices.length} | Total Amount: $${totalAmount.toFixed(2)}`, 15, 40);
      doc.text(`Paid: $${paidAmount.toFixed(2)} | Outstanding: $${unpaidAmount.toFixed(2)}`, 15, 47);
      
      // Prepare invoice data for table
      const tableData = invoices.map(invoice => {
        const customer = customers.find(c => c.id === invoice.customerId);
        return [
          invoice.invoiceNumber,
          customer?.personalInfo.name || 'Unknown',
          new Date(invoice.date).toLocaleDateString(),
          new Date(invoice.dueDate).toLocaleDateString(),
          `$${invoice.total.toFixed(2)}`,
          invoice.status.toUpperCase()
        ];
      });
      
      // Add invoice table
      autoTable(doc, {
        head: [['Invoice #', 'Customer', 'Date', 'Due Date', 'Total', 'Status']],
        body: tableData,
        startY: 55,
        styles: {
          fontSize: 9,
          cellPadding: 3
        },
        headStyles: {
          fillColor: [37, 99, 235], // Blue color
          textColor: 255
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251] // Light gray
        },
        didDrawCell: (data) => {
          // Color code status column
          if (data.section === 'body' && data.column.index === 5) {
            const status = data.cell.raw as string;
            if (status === 'PAID') {
              doc.setTextColor(34, 197, 94); // Green
            } else {
              doc.setTextColor(234, 179, 8); // Yellow
            }
          }
        }
      });
      
      // Save the PDF
      doc.save(`invoices-${new Date().toISOString().split('T')[0]}.pdf`);
    }
  };

  // Import data from JSON
  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Validate the data structure
      if (!data.customers || !data.invoices || !Array.isArray(data.customers) || !Array.isArray(data.invoices)) {
        throw new Error('Invalid data format. Expected { customers: [], invoices: [] }');
      }
      
      if (window.confirm(`This will replace all existing data with ${data.customers.length} customers and ${data.invoices.length} invoices. Are you sure?`)) {
        await importData(data);
        // Reset UI state
        setShowCustomerForm(false);
        setShowInvoiceForm(false);
        setEditingCustomer(null);
        alert('Data imported successfully!');
      }
    } catch (error) {
      console.error('Error importing data:', error);
      alert(error instanceof Error ? error.message : 'Invalid file format. Please select a valid backup file.');
    }
    
    // Reset input
    event.target.value = '';
  };

  // Export data as JSON (for backup purposes)
  const handleExportJSON = async () => {
    try {
      const data = await storageService.exportData();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `billing-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data');
    }
  };

  // Add a button to reset and regenerate dummy data (development only)
  const handleResetDummyData = async () => {
    if (window.confirm('This will delete all existing data and generate new dummy data. Are you sure?')) {
      setIsFirstLoad(true);
      try {
        localStorage.removeItem('billing-app-initialized');
        await storageService.clearAllData();
        await initializeDummyData();
        localStorage.setItem('billing-app-initialized', 'true');
        await initializeData();
      } catch (error) {
        console.error('Error resetting data:', error);
      } finally {
        setIsFirstLoad(false);
      }
    }
  };

  // Show loading screen during initial load
  if (isFirstLoad) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">Loading your billing data...</p>
        </div>
      </div>
    );
  }

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
                onClick={() => handleTabChange('customers')}
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
                onClick={() => handleTabChange('invoices')}
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
                <div className="relative group">
                  <button
                    onClick={handleExportPDF}
                    className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                    title="Export as PDF"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                    <button
                      onClick={handleExportPDF}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Export as PDF
                    </button>
                    <button
                      onClick={handleExportJSON}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Backup as JSON
                    </button>
                  </div>
                </div>
                
                <label className="p-2 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer" title="Import Data (JSON)">
                  <Upload className="w-4 h-4" />
                  <input
                    type="file"
                    accept="application/json"
                    onChange={handleImportData}
                    className="hidden"
                  />
                </label>
                
                {/* Only show in development */}
                {process.env.NODE_ENV === 'development' && (
                  <button
                    onClick={handleResetDummyData}
                    className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                    title="Reset with dummy data"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                )}
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