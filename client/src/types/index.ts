export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'CASHIER';
  branchId?: string | null;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact?: string;
  email?: string;
  address?: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  price: number;
  costPrice: number;
  stock: number;
  minStock: number;
  barcode?: string;
  categoryId: string;
  category?: Category;
  supplierId?: string;
  supplier?: Supplier;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  loyaltyId?: string;
  gstNumber?: string;
  loyaltyPoints: number;
}

export interface CartItem {
  productId: string;
  sku: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
  stock: number;
}

export interface Payment {
  method: 'CASH' | 'CARD' | 'UPI';
  amount: number;
}

export interface SaleItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  total: number;
  product?: { name: string; sku: string };
}

export interface Sale {
  id: string;
  invoiceNo: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  amountPaid: number;
  change: number;
  status: 'COMPLETED' | 'HELD' | 'REFUNDED';
  paymentMethod: string;
  createdAt: string;
  customer?: Customer;
  user?: { name: string };
  items: SaleItem[];
  payments: Payment[];
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FLAT';
  discountValue: number;
  minPurchase?: number;
  maxDiscount?: number;
  validUntil?: string;
  isActive: boolean;
}

export interface DashboardData {
  today: { revenue: number; orders: number; expenses: number; netProfit: number };
  totals: { orders: number; customers: number; products: number; lowStock: number; inventoryValue: number };
  recentSales: Sale[];
  topProducts: { productId: string; _sum: { quantity: number; total: number }; product?: { name: string; sku: string } }[];
  salesByPayment: { paymentMethod: string; _count: { id: number }; _sum: { total: number } }[];
  weeklySales: { date: string; revenue: number; orders: number }[];
  staffPerformance: any[];
}
