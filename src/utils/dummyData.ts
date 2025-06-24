import type { Customer, Invoice } from '../types';


const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emma', 'Robert', 'Lisa', 'William', 'Jennifer'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
const companies = ['Tech Corp', 'Digital Solutions', 'Creative Agency', 'Marketing Pro', 'Design Studio', 'Consulting Inc', 'Software Ltd', 'Media Group', 'Innovation Lab', 'Global Services'];
const streets = ['123 Main St', '456 Oak Ave', '789 Pine Rd', '321 Elm St', '654 Maple Dr', '987 Cedar Ln', '147 Birch Way', '258 Spruce Ct', '369 Walnut Pl', '741 Cherry Blvd'];
const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'];
const states = ['NY', 'CA', 'IL', 'TX', 'AZ', 'PA', 'TX', 'CA', 'TX', 'CA'];
const services = [
  'Website Development',
  'Mobile App Design',
  'SEO Optimization',
  'Social Media Management',
  'Logo Design',
  'Content Writing',
  'Video Production',
  'Marketing Campaign',
  'UI/UX Design',
  'Consulting Services',
  'Data Analysis',
  'Cloud Migration',
  'Security Audit',
  'Training Workshop',
  'API Development'
];

export const generateDummyCustomers = (): Customer[] => {
  const customers: Customer[] = [];
  
  for (let i = 0; i < 10; i++) {
    const firstName = firstNames[i];
    const lastName = lastNames[i];
    const company = companies[i];
    const street = streets[i];
    const city = cities[i];
    const state = states[i];
    
    const customer: Customer = {
      id: `customer-${i + 1}`,
      personalInfo: {
        name: `${firstName} ${lastName}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${company.toLowerCase().replace(/\s+/g, '')}.com`,
        phone: `+1 (555) ${String(Math.floor(Math.random() * 900) + 100)}-${String(Math.floor(Math.random() * 9000) + 1000)}`
      },
      billingAddress: {
        street: street,
        city: city,
        state: state,
        zipCode: String(10000 + Math.floor(Math.random() * 89999)),
        country: 'United States'
      },
      shippingAddress: {
        street: street,
        city: city,
        state: state,
        zipCode: String(10000 + Math.floor(Math.random() * 89999)),
        country: 'United States'
      },
      sameAsShipping: Math.random() > 0.5,
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)),
      updatedAt: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000))
    };
    
    customers.push(customer);
  }
  
  return customers;
};

export const generateDummyInvoices = (customers: Customer[]): Invoice[] => {
  const invoices: Invoice[] = [];
  let invoiceCounter = 1;
  
  customers.forEach((customer) => {
    const invoiceCount = Math.floor(Math.random() * 2) + 2;
    
    for (let i = 0; i < invoiceCount; i++) {
      const itemCount = Math.floor(Math.random() * 3) + 1;
      const items = [];
      
      for (let j = 0; j < itemCount; j++) {
        const service = services[Math.floor(Math.random() * services.length)];
        const quantity = Math.floor(Math.random() * 5) + 1;
        const price = Math.round((Math.random() * 500 + 50) * 100) / 100;
        const taxRate = [0, 5, 10, 15, 20][Math.floor(Math.random() * 5)];
        const subtotal = quantity * price;
        const tax = subtotal * (taxRate / 100);
        const total = subtotal + tax;
        
        items.push({
          description: service,
          quantity: quantity,
          price: price,
          total: total,
          taxRate: taxRate
        });
      }
      
      const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
      const totalTax = items.reduce((sum, item) => {
        const itemSubtotal = item.quantity * item.price;
        return sum + (itemSubtotal * (item.taxRate || 0) / 100);
      }, 0);
      const discount = Math.random() > 0.7 ? Math.round(subtotal * 0.1 * 100) / 100 : 0;
      const total = subtotal + totalTax - discount;
      
      const createdDate = new Date(Date.now() - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000));
      const dueDate = new Date(createdDate.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      const invoice: Invoice = {
        id: `invoice-${invoiceCounter}`,
        invoiceNumber: `INV-${String(invoiceCounter).padStart(5, '0')}`,
        customerId: customer.id,
        date: createdDate.toISOString().split('T')[0],
        dueDate: dueDate.toISOString().split('T')[0],
        items: items,
        subtotal: subtotal,
        totalTax: totalTax,
        discount: discount,
        discountType: 'percentage',
        globalTaxRate: 0,
        notes: discount > 0 ? 'Thank you for your continued business! 10% loyalty discount applied.' : 'Thank you for your business!',
        total: total,
        status: Math.random() > 0.3 ? 'paid' : 'unpaid',
        createdAt: createdDate
      };
      
      invoices.push(invoice);
      invoiceCounter++;
    }
  });
  
  return invoices.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

export const initializeDummyData = async () => {
  const { storageService } = await import('../services/storage.services');
  
  try {
    const existingCustomers = await storageService.getAllCustomers();
    if (existingCustomers.length > 0) {
      console.log('Data already exists, skipping dummy data generation');
      return;
    }
    
    const customers = generateDummyCustomers();
    const invoices = generateDummyInvoices(customers);
    
    for (const customer of customers) {
      await storageService.createCustomer(customer);
    }
    
    for (const invoice of invoices) {
      await storageService.createInvoice(invoice);
    }
    
    console.log(`Generated ${customers.length} customers and ${invoices.length} invoices`);
  } catch (error) {
    console.error('Error initializing dummy data:', error);
  }
};