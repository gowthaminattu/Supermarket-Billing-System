import React, { createContext, useContext, useState, useCallback } from 'react';
import type { CartItem, Customer, Coupon } from '../types';
import toast from 'react-hot-toast';

interface CartContextType {
  items: CartItem[];
  customer: Customer | null;
  coupon: Coupon | null;
  discount: number;
  addItem: (product: { id: string; sku: string; name: string; price: number; stock: number }) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  setCustomer: (c: Customer | null) => void;
  setCoupon: (c: Coupon | null, discountAmt: number) => void;
  subtotal: number;
  taxAmount: number;
  total: number;
}

const CartContext = createContext<CartContextType | null>(null);

const TAX_RATE = 0.05;

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [coupon, setCouponState] = useState<Coupon | null>(null);
  const [discount, setDiscount] = useState(0);

  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const taxAmount = parseFloat(((subtotal - discount) * TAX_RATE).toFixed(2));
  const total = parseFloat((subtotal - discount + taxAmount).toFixed(2));

  const addItem = useCallback((product: { id: string; sku: string; name: string; price: number; stock: number }) => {
    setItems(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.error(`Only ${product.stock} units in stock`);
          return prev;
        }
        return prev.map(i => i.productId === product.id
          ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.price }
          : i
        );
      }
      if (product.stock === 0) { toast.error('Item is out of stock'); return prev; }
      return [...prev, { productId: product.id, sku: product.sku, name: product.name, price: product.price, quantity: 1, total: product.price, stock: product.stock }];
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems(prev => prev.filter(i => i.productId !== productId));
  }, []);

  const updateQty = useCallback((productId: string, qty: number) => {
    if (qty <= 0) { removeItem(productId); return; }
    setItems(prev => prev.map(i => {
      if (i.productId !== productId) return i;
      if (qty > i.stock) { toast.error(`Only ${i.stock} units available`); return i; }
      return { ...i, quantity: qty, total: qty * i.price };
    }));
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
    setCustomer(null);
    setCouponState(null);
    setDiscount(0);
  }, []);

  const setCoupon = useCallback((c: Coupon | null, discountAmt: number) => {
    setCouponState(c);
    setDiscount(discountAmt);
  }, []);

  return (
    <CartContext.Provider value={{ items, customer, coupon, discount, addItem, removeItem, updateQty, clearCart, setCustomer, setCoupon, subtotal, taxAmount, total }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
