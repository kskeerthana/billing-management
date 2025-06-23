import localforage from 'localforage';
import type { Customer, Invoice } from '../types';

// Configure localforage with explicit config
localforage.config({
  driver: localforage.INDEXEDDB,
  name: 'billing-app',
  version: 1.0,
  size: 4980736, // Size of database, in bytes (4MB)
  storeName: 'keyvaluepairs', // Default store name
  description: 'Billing Management App Storage'
});

// Create separate stores for customers and invoices
const customersDB = localforage.createInstance({
  name: "billing-app",
  storeName: "customers",
  driver: [
    localforage.INDEXEDDB,
    localforage.WEBSQL,
    localforage.LOCALSTORAGE
  ]
});

const invoicesDB = localforage.createInstance({
  name: "billing-app",
  storeName: "invoices",
  driver: [
    localforage.INDEXEDDB,
    localforage.WEBSQL,
    localforage.LOCALSTORAGE
  ]
});

class StorageService {
  private initialized = false;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      await this.ensureInitialized();
      console.log('StorageService initialized on construction');
    } catch (error) {
      console.error('Failed to initialize StorageService:', error);
    }
  }

  private async ensureInitialized() {
    if (!this.initialized) {
      try {
        // Force initialization by checking if databases are ready
        await customersDB.ready();
        await invoicesDB.ready();
        
        // Log which drivers are being used
        console.log('Storage initialized successfully');
        console.log('Customers DB using:', customersDB.driver());
        console.log('Invoices DB using:', invoicesDB.driver());
        
        // Create test entries to ensure DB is created
        const testKey = '__test__';
        await customersDB.setItem(testKey, { test: true });
        await customersDB.removeItem(testKey);
        await invoicesDB.setItem(testKey, { test: true });
        await invoicesDB.removeItem(testKey);
        
        this.initialized = true;
      } catch (error) {
        console.error('Storage initialization failed:', error);
        // Fall back to in-memory storage if needed
        this.initialized = false;
        throw error;
      }
    }
  }

  // Customer methods
  async getAllCustomers(): Promise<Customer[]> {
    await this.ensureInitialized();
    try {
      const keys = await customersDB.keys();
      const customers: Customer[] = [];
      
      for (const key of keys) {
        const customer = await customersDB.getItem<Customer>(key);
        if (customer) {
          // Ensure dates are Date objects
          customer.createdAt = new Date(customer.createdAt);
          customer.updatedAt = new Date(customer.updatedAt);
          customers.push(customer);
        }
      }
      
      return customers.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      console.error('Error getting all customers:', error);
      return [];
    }
  }

  async getCustomerById(id: string): Promise<Customer | null> {
    await this.ensureInitialized();
    try {
      const customer = await customersDB.getItem<Customer>(id);
      if (customer) {
        customer.createdAt = new Date(customer.createdAt);
        customer.updatedAt = new Date(customer.updatedAt);
      }
      return customer;
    } catch (error) {
      console.error('Error getting customer by ID:', error);
      return null;
    }
  }

  async createCustomer(customer: Customer): Promise<Customer> {
    await this.ensureInitialized();
    try {
      // Ensure dates are serializable
      const customerToStore = {
        ...customer,
        createdAt: customer.createdAt.toISOString(),
        updatedAt: customer.updatedAt.toISOString()
      };
      
      await customersDB.setItem(customer.id, customerToStore);
      console.log('Customer created:', customer.id);
      return customer;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  }

  async updateCustomer(id: string, customer: Customer): Promise<Customer> {
    await this.ensureInitialized();
    try {
      // Ensure dates are serializable
      const customerToStore = {
        ...customer,
        createdAt: customer.createdAt.toISOString(),
        updatedAt: customer.updatedAt.toISOString()
      };
      
      await customersDB.setItem(id, customerToStore);
      console.log('Customer updated:', id);
      return customer;
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  }

  async deleteCustomer(id: string): Promise<void> {
    await this.ensureInitialized();
    try {
      await customersDB.removeItem(id);
      // Also delete all invoices for this customer
      const invoices = await this.getInvoicesByCustomerId(id);
      for (const invoice of invoices) {
        await this.deleteInvoice(invoice.id);
      }
      console.log('Customer deleted:', id);
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  }

  async checkEmailExists(email: string, excludeId?: string): Promise<boolean> {
    await this.ensureInitialized();
    try {
      const customers = await this.getAllCustomers();
      return customers.some(c => 
        c.personalInfo.email.toLowerCase() === email.toLowerCase() && 
        c.id !== excludeId
      );
    } catch (error) {
      console.error('Error checking email:', error);
      return false;
    }
  }

  // Invoice methods
  async getAllInvoices(): Promise<Invoice[]> {
    await this.ensureInitialized();
    try {
      const keys = await invoicesDB.keys();
      const invoices: Invoice[] = [];
      
      for (const key of keys) {
        const invoice = await invoicesDB.getItem<Invoice>(key);
        if (invoice) {
          // Ensure date is a Date object
          invoice.createdAt = new Date(invoice.createdAt);
          invoices.push(invoice);
        }
      }
      
      return invoices.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      console.error('Error getting all invoices:', error);
      return [];
    }
  }

  async getInvoiceById(id: string): Promise<Invoice | null> {
    await this.ensureInitialized();
    try {
      const invoice = await invoicesDB.getItem<Invoice>(id);
      if (invoice) {
        invoice.createdAt = new Date(invoice.createdAt);
      }
      return invoice;
    } catch (error) {
      console.error('Error getting invoice by ID:', error);
      return null;
    }
  }

  async getInvoicesByCustomerId(customerId: string): Promise<Invoice[]> {
    await this.ensureInitialized();
    try {
      const allInvoices = await this.getAllInvoices();
      return allInvoices.filter(inv => inv.customerId === customerId);
    } catch (error) {
      console.error('Error getting invoices by customer ID:', error);
      return [];
    }
  }

  async createInvoice(invoice: Invoice): Promise<Invoice> {
    await this.ensureInitialized();
    try {
      // Ensure date is serializable
      const invoiceToStore = {
        ...invoice,
        createdAt: invoice.createdAt.toISOString()
      };
      
      await invoicesDB.setItem(invoice.id, invoiceToStore);
      console.log('Invoice created:', invoice.id);
      return invoice;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  }

  async updateInvoice(id: string, invoice: Invoice): Promise<Invoice> {
    await this.ensureInitialized();
    try {
      // Ensure date is serializable
      const invoiceToStore = {
        ...invoice,
        createdAt: invoice.createdAt.toISOString()
      };
      
      await invoicesDB.setItem(id, invoiceToStore);
      console.log('Invoice updated:', id);
      return invoice;
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw error;
    }
  }

  async deleteInvoice(id: string): Promise<void> {
    await this.ensureInitialized();
    try {
      await invoicesDB.removeItem(id);
      console.log('Invoice deleted:', id);
    } catch (error) {
      console.error('Error deleting invoice:', error);
      throw error;
    }
  }

  async getNextInvoiceNumber(): Promise<string> {
    await this.ensureInitialized();
    try {
      const invoices = await this.getAllInvoices();
      const numbers = invoices
        .map(inv => {
          const match = inv.invoiceNumber.match(/INV-(\d+)/);
          return match ? parseInt(match[1]) : 0;
        })
        .filter(num => !isNaN(num));
      
      const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
      return `INV-${String(maxNumber + 1).padStart(5, '0')}`;
    } catch (error) {
      console.error('Error getting next invoice number:', error);
      return `INV-${String(Date.now()).slice(-5)}`;
    }
  }

  // Utility methods
  async clearAllData(): Promise<void> {
    await this.ensureInitialized();
    try {
      await customersDB.clear();
      await invoicesDB.clear();
      console.log('All data cleared');
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  }

  async exportData(): Promise<{ customers: Customer[], invoices: Invoice[] }> {
    await this.ensureInitialized();
    try {
      const customers = await this.getAllCustomers();
      const invoices = await this.getAllInvoices();
      return { customers, invoices };
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  async importData(data: { customers: Customer[], invoices: Invoice[] }): Promise<void> {
    await this.ensureInitialized();
    try {
      // Clear existing data first
      await this.clearAllData();
      
      // Import customers
      for (const customer of data.customers) {
        await this.createCustomer(customer);
      }
      
      // Import invoices
      for (const invoice of data.invoices) {
        await this.createInvoice(invoice);
      }
      
      console.log('Data imported successfully');
    } catch (error) {
      console.error('Error importing data:', error);
      throw error;
    }
  }

  // Debug method to check if storage is working
  async testStorage(): Promise<void> {
    console.log('Testing storage...');
    try {
      await this.ensureInitialized();
      
      // Test customer storage
      const testCustomer: Customer = {
        id: 'test-' + Date.now(),
        personalInfo: {
          name: 'Test User',
          email: 'test@example.com',
          phone: '123-456-7890'
        },
        billingAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'Test Country'
        },
        shippingAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'Test Country'
        },
        sameAsShipping: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Create
      await this.createCustomer(testCustomer);
      console.log('Test customer created');
      
      // Read
      const retrieved = await this.getCustomerById(testCustomer.id);
      console.log('Test customer retrieved:', retrieved);
      
      // Delete
      await this.deleteCustomer(testCustomer.id);
      console.log('Test customer deleted');
      
      console.log('Storage test completed successfully!');
    } catch (error) {
      console.error('Storage test failed:', error);
    }
  }
}

// Create and export a singleton instance
export const storageService = new StorageService();

// For debugging in browser console
if (typeof window !== 'undefined') {
  (window as any).storageService = storageService;
  (window as any).testStorage = () => storageService.testStorage();
  console.log('StorageService available at window.storageService');
  console.log('Run window.testStorage() to test the storage');
}