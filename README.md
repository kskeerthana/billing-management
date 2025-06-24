# 🧾 Customer Billing Management App

A modern React-based billing system that allows users to create and manage customers and invoices with advanced client-side data management using IndexedDB. It supports multi-step form validation, dynamic calculations, and a clean, responsive UI.

---

## 🌐 Hosted URL
**Live App**: https://billing-management-six.vercel.app/

## 🎥 Demo Video
**Watch the demo**: https://www.loom.com/share/bf4ad43b1d4a4f81bc4048132c4fb0cb?sid=502aac62-76b2-48cb-bfd4-1cee80ea1d6e

---

## 🛠 Tech Stack

- **React** + **TypeScript**
- **React Hook Form** for form state management
- **Zod** for schema validation and conditional logic
- **localforage** for IndexedDB data storage
- **Tailwind CSS** for utility-first styling
- **Vite** for fast local development
- **Vercel** for deployment

---

## 🚀 Features

-  Multi step form for customer creation with conditional and async validation
- IndexedDB (via localforage) to persist customer and invoice data
- Dynamic invoice builder with subtotal, tax, discount, and grand total
- Sortable and filterable customer and invoice lists
- Status tracking for paid/unpaid invoices
- Fast, responsive UI using Tailwind CSS

---

## 🧑‍💻 Running Locally

### 1. Clone the repository

```bash
git clone https://github.com/kskeerthana/billing-management.git
cd billing-management
npm install
npm run dev

