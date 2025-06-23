import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Customer, Invoice } from '../types';
import { storageService } from '../services/storage.services';

interface AppState {
  // Customer State
  customers: Customer[];
  customersLoading: boolean;
  customersError: string | null;
  
  // Invoice State
  invoices: Invoice[];
  invoicesLoading: boolean;
  invoicesError: string | null;
  
  // Filter States
  customerSearchTerm: string;
  customerSortBy: 'name' | 'date';
  customerSortOrder: 'asc' | 'desc';
  selectedCustomerId: string;
  
  // Actions - Customers
  loadCustomers: () => Promise<void>;
  addCustomer: (customer: Customer) => Promise<void>;
  updateCustomer: (id: string, customer: Customer) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  setCustomerSearchTerm: (term: string) => void;
  setCustomerSort: (sortBy: 'name' | 'date', sortOrder: 'asc' | 'desc') => void;
  
  // Actions - Invoices
  loadInvoices: () => Promise<void>;
  addInvoice: (invoice: Invoice) => Promise<void>;
  updateInvoice: (id: string, invoice: Invoice) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  setSelectedCustomerId: (id: string) => void;
  
  // Computed Values
  getFilteredCustomers: () => Customer[];
  getFilteredInvoices: () => Invoice[];
  getCustomerById: (id: string) => Customer | undefined;
  getInvoicesByCustomerId: (customerId: string) => Invoice[];
  getNextInvoiceNumber: () => Promise<string>;
  
  // Utility Actions
  initializeData: () => Promise<void>;
  exportData: () => Promise<{ customers: Customer[], invoices: Invoice[] }>;
  importData: (data: { customers: Customer[], invoices: Invoice[] }) => Promise<void>;
}

export const useStore = create<AppState>()(
  devtools(
    (set, get) => ({
      // Initial State
      customers: [],
      customersLoading: false,
      customersError: null,
      invoices: [],
      invoicesLoading: false,
      invoicesError: null,
      customerSearchTerm: '',
      customerSortBy: 'name',
      customerSortOrder: 'asc',
      selectedCustomerId: '',
      
      // Customer Actions
      loadCustomers: async () => {
        set({ customersLoading: true, customersError: null });
        try {
          const customers = await storageService.getAllCustomers();
          set({ customers, customersLoading: false });
        } catch (error) {
          set({ 
            customersError: error instanceof Error ? error.message : 'Failed to load customers',
            customersLoading: false 
          });
        }
      },
      
      addCustomer: async (customer) => {
        try {
          await storageService.createCustomer(customer);
          set(state => ({ customers: [...state.customers, customer] }));
        } catch (error) {
          console.error('Error adding customer:', error);
          throw error;
        }
      },
      
      updateCustomer: async (id, customer) => {
        try {
          await storageService.updateCustomer(id, customer);
          set(state => ({
            customers: state.customers.map(c => c.id === id ? customer : c)
          }));
        } catch (error) {
          console.error('Error updating customer:', error);
          throw error;
        }
      },
      
      deleteCustomer: async (id) => {
        try {
          await storageService.deleteCustomer(id);
          set(state => ({
            customers: state.customers.filter(c => c.id !== id),
            invoices: state.invoices.filter(inv => inv.customerId !== id)
          }));
        } catch (error) {
          console.error('Error deleting customer:', error);
          throw error;
        }
      },
      
      setCustomerSearchTerm: (term) => set({ customerSearchTerm: term }),
      
      setCustomerSort: (sortBy, sortOrder) => set({ customerSortBy: sortBy, customerSortOrder: sortOrder }),
      
      // Invoice Actions
      loadInvoices: async () => {
        set({ invoicesLoading: true, invoicesError: null });
        try {
          const invoices = await storageService.getAllInvoices();
          set({ invoices, invoicesLoading: false });
        } catch (error) {
          set({ 
            invoicesError: error instanceof Error ? error.message : 'Failed to load invoices',
            invoicesLoading: false 
          });
        }
      },
      
      addInvoice: async (invoice) => {
        try {
          await storageService.createInvoice(invoice);
          set(state => ({ invoices: [...state.invoices, invoice] }));
        } catch (error) {
          console.error('Error adding invoice:', error);
          throw error;
        }
      },
      
      updateInvoice: async (id, invoice) => {
        try {
          await storageService.updateInvoice(id, invoice);
          set(state => ({
            invoices: state.invoices.map(inv => inv.id === id ? invoice : inv)
          }));
        } catch (error) {
          console.error('Error updating invoice:', error);
          throw error;
        }
      },
      
      deleteInvoice: async (id) => {
        try {
          await storageService.deleteInvoice(id);
          set(state => ({
            invoices: state.invoices.filter(inv => inv.id !== id)
          }));
        } catch (error) {
          console.error('Error deleting invoice:', error);
          throw error;
        }
      },
      
      setSelectedCustomerId: (id) => set({ selectedCustomerId: id }),
      
      // Computed Values
      getFilteredCustomers: () => {
        const state = get();
        let filtered = state.customers.filter(customer =>
          customer.personalInfo.name.toLowerCase().includes(state.customerSearchTerm.toLowerCase()) ||
          customer.personalInfo.email.toLowerCase().includes(state.customerSearchTerm.toLowerCase()) ||
          (customer.personalInfo.phone?.toLowerCase().includes(state.customerSearchTerm.toLowerCase()) ?? false)
        );
        
        filtered.sort((a, b) => {
          let comparison = 0;
          if (state.customerSortBy === 'name') {
            comparison = a.personalInfo.name.localeCompare(b.personalInfo.name);
          } else {
            comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          }
          return state.customerSortOrder === 'asc' ? comparison : -comparison;
        });
        
        return filtered;
      },
      
      getFilteredInvoices: () => {
        const state = get();
        if (state.selectedCustomerId) {
          return state.invoices.filter(inv => inv.customerId === state.selectedCustomerId);
        }
        return state.invoices;
      },
      
      getCustomerById: (id) => {
        return get().customers.find(c => c.id === id);
      },
      
      getInvoicesByCustomerId: (customerId) => {
        return get().invoices.filter(inv => inv.customerId === customerId);
      },
      
      getNextInvoiceNumber: async () => {
        return await storageService.getNextInvoiceNumber();
      },
      
      // Utility Actions
      initializeData: async () => {
        const loadPromises = [get().loadCustomers(), get().loadInvoices()];
        await Promise.all(loadPromises);
      },
      
      exportData: async () => {
        const state = get();
        return {
          customers: state.customers,
          invoices: state.invoices
        };
      },
      
      importData: async (data) => {
        try {
          await storageService.importData(data);
          // Reload data from storage
          await get().initializeData();
        } catch (error) {
          console.error('Error importing data:', error);
          throw error;
        }
      }
    }),
    {
      name: 'billing-app-store', // name for devtools
    }
  )
);

// Selectors for easy access
export const useCustomers = () => useStore(state => state.customers);
export const useInvoices = () => useStore(state => state.invoices);
// export const useFilteredCustomers = () => useStore(state => state.getFilteredCustomers());
// export const useFilteredInvoices = () => useStore(state => state.getFilteredInvoices());