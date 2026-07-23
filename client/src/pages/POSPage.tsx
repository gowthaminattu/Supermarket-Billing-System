import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useCart } from '../context/CartContext';
import api from '../lib/api';
import type { Product, Customer, Payment } from '../types';
import toast from 'react-hot-toast';
import {
  Search, Trash2, Plus, Minus, ShoppingCart, User, Tag,
  Pause, Play, Banknote, CreditCard, Smartphone,
  Receipt as ReceiptIcon, X, CheckCircle2, Split, Package
} from 'lucide-react';
import Receipt from '../components/Receipt';
import { useAuth } from '../context/AuthContext';

// --- Sub Components ---

const PaymentModal: React.FC<{
  total: number;
  onClose: () => void;
  onComplete: (payments: Payment[], amountPaid: number, change: number, method: string) => void;
}> = ({ total, onClose, onComplete }) => {
  const [method, setMethod] = useState<'CASH' | 'CARD' | 'UPI' | 'SPLIT'>('CASH');
  const [cashAmount, setCashAmount] = useState(total.toFixed(2));
  const [splitCash, setSplitCash] = useState('');
  const [splitCard, setSplitCard] = useState('');

  const handlePay = () => {
    if (method === 'SPLIT') {
      const c = parseFloat(splitCash) || 0;
      const d = parseFloat(splitCard) || 0;
      if (Math.abs(c + d - total) > 0.01) { toast.error('Split amounts must equal total'); return; }
      const payments: Payment[] = [];
      if (c > 0) payments.push({ method: 'CASH', amount: c });
      if (d > 0) payments.push({ method: 'CARD', amount: d });
      onComplete(payments, c + d, 0, 'SPLIT');
    } else if (method === 'CASH') {
      const paid = parseFloat(cashAmount);
      if (paid < total) { toast.error('Amount paid is less than total'); return; }
      onComplete([{ method: 'CASH', amount: paid }], paid, paid - total, 'CASH');
    } else {
      onComplete([{ method, amount: total }], total, 0, method);
    }
  };

  const cashChange = Math.max(0, parseFloat(cashAmount) - total);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-white">Payment</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>

        <div className="bg-slate-800/60 rounded-xl p-4 mb-5 text-center">
          <p className="text-slate-400 text-sm">Amount Due</p>
          <p className="text-4xl font-bold text-white mt-1">₹{total.toFixed(2)}</p>
        </div>

        {/* Method Selection */}
        <div className="grid grid-cols-4 gap-2 mb-5">
          {([['CASH', Banknote, 'Cash'], ['CARD', CreditCard, 'Card'], ['UPI', Smartphone, 'UPI'], ['SPLIT', Split, 'Split']] as const).map(([m, Icon, label]) => (
            <button key={m} onClick={() => setMethod(m as any)}
              className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-medium transition-all ${method === m ? 'border-blue-500 bg-blue-600/20 text-blue-400' : 'border-slate-700 text-slate-400 hover:border-slate-600'}`}>
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>

        {method === 'CASH' && (
          <div className="space-y-3 mb-5">
            <div>
              <label className="text-slate-400 text-sm mb-1 block">Amount Tendered</label>
              <input type="number" value={cashAmount} onChange={e => setCashAmount(e.target.value)} step="0.01"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white text-lg font-bold focus:outline-none focus:border-blue-500" />
            </div>
            <div className="flex justify-between items-center bg-emerald-900/20 border border-emerald-800/50 rounded-lg px-4 py-3">
              <span className="text-emerald-400 font-medium">Change to Return</span>
              <span className="text-emerald-400 text-xl font-bold">₹{cashChange.toFixed(2)}</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[100, 200, 500, 1000].map(amt => (
                <button key={amt} onClick={() => setCashAmount(amt.toFixed(2))}
                  className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg py-2 text-white text-sm font-medium transition-colors">
                  ₹{amt}
                </button>
              ))}
            </div>
          </div>
        )}

        {method === 'SPLIT' && (
          <div className="space-y-3 mb-5">
            <div>
              <label className="text-slate-400 text-sm mb-1 block">Cash Amount</label>
              <input type="number" value={splitCash} onChange={e => setSplitCash(e.target.value)} placeholder="0.00" step="0.01"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-slate-400 text-sm mb-1 block">Card Amount</label>
              <input type="number" value={splitCard} onChange={e => setSplitCard(e.target.value)} placeholder="0.00" step="0.01"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500" />
            </div>
            <p className={`text-xs ${Math.abs((parseFloat(splitCash) || 0) + (parseFloat(splitCard) || 0) - total) < 0.01 ? 'text-emerald-400' : 'text-amber-400'}`}>
              Total: ₹{((parseFloat(splitCash) || 0) + (parseFloat(splitCard) || 0)).toFixed(2)} / ₹{total.toFixed(2)}
            </p>
          </div>
        )}

        {(method === 'CARD' || method === 'UPI') && (
          <div className="mb-5 p-4 bg-slate-800/50 rounded-xl text-center text-slate-400 text-sm">
            {method === 'CARD' ? 'Swipe or tap the card on the terminal' : 'Show QR code to customer for UPI payment'}
          </div>
        )}

        <button onClick={handlePay}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-lg">
          <CheckCircle2 size={20} /> Complete Payment
        </button>
      </div>
    </div>
  );
};

// --- Main POS Page ---

const POSPage: React.FC = () => {
  // Removed unused useAuth
  const { items, addItem, removeItem, updateQty, clearCart, setCustomer, setCoupon, customer, coupon, discount, subtotal, taxAmount, total } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [showHeld, setShowHeld] = useState(false);
  const [heldBills, setHeldBills] = useState<any[]>([]);
  const [lastSale, setLastSale] = useState<any>(null);

  const { user } = useAuth();

  useEffect(() => {
    if (user && (user.role as string) === 'CUSTOMER') {
      setCustomer({ id: user.id, name: user.name, phone: (user as any).phone || '', loyaltyPoints: 0 });
    }
  }, [user]);
  
  const searchRef = useRef<HTMLInputElement>(null);
  const barcodeBuffer = useRef('');
  const lastKeyTime = useRef(Date.now());

  // Keyboard shortcut & barcode scanner handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Barcode Scanner Logic
      const now = Date.now();
      if (now - lastKeyTime.current > 100) {
        barcodeBuffer.current = ''; // Reset if typing is too slow (human)
      }
      lastKeyTime.current = now;

      if (e.key !== 'Enter' && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Only buffer if it's not an input field (or if we want scanner to work globally)
        if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          barcodeBuffer.current += e.key;
        }
      } else if (e.key === 'Enter' && barcodeBuffer.current.length > 3) {
        // Scanner fired Enter
        const scannedCode = barcodeBuffer.current;
        const found = products.find(p => p.barcode === scannedCode || p.sku === scannedCode);
        if (found) {
          addItem({ id: found.id, sku: found.sku, name: found.name, price: found.price, stock: found.stock });
          toast.success(`Scanned: ${found.name}`);
        } else {
          toast.error('Product not found for barcode: ' + scannedCode);
        }
        barcodeBuffer.current = '';
        e.preventDefault();
      }

      // Keyboard shortcuts
      if (e.ctrlKey && e.key === 'n') { e.preventDefault(); clearCart(); toast.success('New bill started'); setLastSale(null); }
      if (e.ctrlKey && e.key === 's') { e.preventDefault(); if (items.length > 0) setShowPayment(true); }
      if (e.key === 'Escape') { setShowPayment(false); setShowHeld(false); }
      if (e.ctrlKey && e.key === 'f') { e.preventDefault(); searchRef.current?.focus(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [items, clearCart, products, addItem]);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await api.get('/products', { params: { search } });
      setProducts(res.data);
    } catch { toast.error('Failed to load products'); }
  }, [search]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleBarcodeSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && search) {
      const found = products.find(p => p.barcode === search || p.sku === search);
      if (found) { addItem({ id: found.id, sku: found.sku, name: found.name, price: found.price, stock: found.stock }); setSearch(''); }
      else toast.error('Product not found');
    }
  };

  const handleCustomerSearch = async (q: string) => {
    setCustomerSearch(q);
    if (q.length < 2) { setCustomerResults([]); return; }
    try {
      const res = await api.get('/customers', { params: { search: q } });
      setCustomerResults(res.data.slice(0, 5));
    } catch {}
  };

  const applyCoupon = async () => {
    if (!couponCode) return;
    try {
      const res = await api.post('/reports/coupons/validate', { code: couponCode, subtotal });
      setCoupon(res.data.coupon, res.data.discountAmount);
      toast.success(`Coupon applied! Saved ₹${res.data.discountAmount.toFixed(2)}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Invalid coupon');
    }
  };

  const holdBill = async () => {
    if (items.length === 0) { toast.error('Cart is empty'); return; }
    try {
      await api.post('/sales/hold', {
        customerId: customer?.id, items: items.map(i => ({ productId: i.productId, quantity: i.quantity, price: i.price, total: i.total })),
        subtotal, tax: taxAmount, discount, total, paymentMethod: 'CASH'
      });
      clearCart();
      toast.success('Bill held successfully');
    } catch { toast.error('Failed to hold bill'); }
  };

  const fetchHeldBills = async () => {
    const res = await api.get('/sales/held');
    setHeldBills(res.data);
    setShowHeld(true);
  };

  const resumeBill = (bill: any) => {
    clearCart();
    bill.items.forEach((item: any) => {
      addItem({ id: item.productId, sku: item.product?.sku || '', name: item.product?.name || '', price: item.price, stock: 999 });
    });
    api.delete(`/sales/held/${bill.id}`).catch(() => {});
    setShowHeld(false);
    toast.success('Bill resumed');
  };

  const handleCheckout = async (payments: Payment[], amountPaid: number, change: number, method: string) => {
    if (items.length === 0) return;
    setLoading(true);
    try {
      const payload = {
        customerId: customer?.id,
        couponId: coupon?.id,
        items: items.map(i => ({ productId: i.productId, quantity: i.quantity, price: i.price, total: i.total })),
        payments,
        subtotal,
        tax: taxAmount,
        discount,
        total,
        amountPaid,
        change,
        paymentMethod: method
      };
      const res = await api.post('/sales', payload);
      setLastSale(res.data);
      toast.success('Sale completed successfully');
      if (res.data.smsSent) {
        toast.success('📱 SMS Receipt sent to customer!');
      }
      clearCart();
      setShowPayment(false);
      setCustomerSearch('');
      setCouponCode('');
      
      // Trigger print after state update
      setTimeout(() => {
        window.print();
      }, 500);
      
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to complete sale');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase()) ||
    (p.barcode && p.barcode.includes(search))
  );

  return (
    <div className="flex h-full gap-4 overflow-hidden">
      {/* Left: Product Grid */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Search Bar */}
        <div className="relative mb-4 flex-shrink-0 flex gap-2">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={handleBarcodeSearch}
              placeholder="Search products or scan barcode... (Ctrl+F)"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          {lastSale && (
            <button onClick={() => window.print()} className="bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 px-4 py-3 rounded-xl font-medium transition-colors flex items-center gap-2">
              <ReceiptIcon size={20} /> Print Last Receipt
            </button>
          )}
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 pb-4">
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => addItem({ id: product.id, sku: product.sku, name: product.name, price: product.price, stock: product.stock })}
                disabled={product.stock === 0}
                className={`bg-slate-900 border rounded-xl p-3 text-left hover:border-blue-500 hover:bg-slate-800 transition-all duration-150 group disabled:opacity-50 disabled:cursor-not-allowed ${product.stock <= product.minStock && product.stock > 0 ? 'border-amber-800' : 'border-slate-800'}`}
              >
                <div className="w-full h-10 bg-slate-800 group-hover:bg-slate-700 rounded-lg flex items-center justify-center mb-2 transition-colors">
                  <ShoppingCart size={18} className="text-slate-500 group-hover:text-blue-400 transition-colors" />
                </div>
                <p className="text-white text-xs font-medium leading-tight truncate">{product.name}</p>
                <p className="text-slate-500 text-xs mt-0.5">{product.sku}</p>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-blue-400 font-bold text-sm">₹{product.price}</span>
                  <span className={`text-xs ${product.stock === 0 ? 'text-red-400' : product.stock <= product.minStock ? 'text-amber-400' : 'text-slate-400'}`}>
                    {product.stock === 0 ? 'Out' : `${product.stock} left`}
                  </span>
                </div>
              </button>
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-500">
                <Package size={48} className="mb-3 opacity-30" />
                <p>No products found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: Cart */}
      <div className="w-80 xl:w-96 flex-shrink-0 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {/* Cart Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} className="text-blue-400" />
            <span className="text-white font-semibold">Cart</span>
            {items.length > 0 && <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{items.length}</span>}
          </div>
          <div className="flex items-center gap-2">
            {(user?.role as string) !== 'CUSTOMER' && (
              <button onClick={fetchHeldBills} title="Held Bills" className="text-slate-400 hover:text-amber-400 transition-colors"><Pause size={16} /></button>
            )}
            <button onClick={clearCart} title="Clear Cart" className="text-slate-400 hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
          </div>
        </div>

        {/* Customer */}
        <div className="px-4 py-2 border-b border-slate-800 relative">
          {customer ? (
            <div className="flex items-center gap-2">
              <User size={14} className="text-blue-400" />
              <span className="text-white text-sm flex-1">{customer.name}</span>
              {(user?.role as string) !== 'CUSTOMER' && (
                <button onClick={() => setCustomer(null)} className="text-slate-500 hover:text-red-400"><X size={14} /></button>
              )}
            </div>
          ) : (
            <div className="relative">
              <div className="flex items-center gap-2">
                <User size={14} className="text-slate-400" />
                <input
                  type="text"
                  value={customerSearch}
                  onChange={e => handleCustomerSearch(e.target.value)}
                  placeholder="Search customer..."
                  className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
                />
              </div>
              {customerResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10">
                  {customerResults.map(c => (
                    <button key={c.id} onClick={() => { setCustomer(c); setCustomerSearch(''); setCustomerResults([]); }}
                      className="w-full text-left px-3 py-2 text-sm text-white hover:bg-slate-700 first:rounded-t-lg last:rounded-b-lg">
                      <span className="font-medium">{c.name}</span>
                      <span className="text-slate-400 ml-2">{c.phone}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
          {items.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 text-slate-600">
              <ShoppingCart size={40} className="mb-2 opacity-30" />
              <p className="text-sm">Cart is empty</p>
              <p className="text-xs mt-1">Click a product or scan a barcode</p>
            </div>
          )}
          {items.map(item => (
            <div key={item.productId} className="flex items-center gap-2 bg-slate-800/60 rounded-lg p-2">
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium truncate">{item.name}</p>
                <p className="text-blue-400 text-xs">₹{item.price}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => updateQty(item.productId, item.quantity - 1)}
                  className="w-6 h-6 bg-slate-700 hover:bg-slate-600 rounded text-white flex items-center justify-center transition-colors">
                  <Minus size={12} />
                </button>
                <span className="text-white text-sm font-bold w-6 text-center">{item.quantity}</span>
                <button onClick={() => updateQty(item.productId, item.quantity + 1)}
                  className="w-6 h-6 bg-slate-700 hover:bg-slate-600 rounded text-white flex items-center justify-center transition-colors">
                  <Plus size={12} />
                </button>
              </div>
              <div className="text-right w-16">
                <p className="text-white text-xs font-bold">₹{item.total.toFixed(2)}</p>
                <button onClick={() => removeItem(item.productId)} className="text-slate-500 hover:text-red-400 mt-0.5"><X size={12} /></button>
              </div>
            </div>
          ))}
        </div>

        {/* Coupon */}
        <div className="px-4 py-2 border-t border-slate-800">
          {coupon ? (
            <div className="flex items-center gap-2 text-sm">
              <Tag size={14} className="text-emerald-400" />
              <span className="text-emerald-400 font-medium">{coupon.code}</span>
              <span className="text-slate-400">-₹{discount.toFixed(2)}</span>
              <button onClick={() => setCoupon(null, 0)} className="ml-auto text-slate-500 hover:text-red-400"><X size={14} /></button>
            </div>
          ) : (
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5">
                <Tag size={13} className="text-slate-400" />
                <input value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Coupon code" className="bg-transparent text-sm text-white placeholder-slate-500 flex-1 focus:outline-none" />
              </div>
              <button onClick={applyCoupon} className="bg-slate-700 hover:bg-slate-600 text-white text-xs px-3 rounded-lg transition-colors">Apply</button>
            </div>
          )}
        </div>

        {/* Totals */}
        <div className="px-4 py-3 border-t border-slate-800 space-y-1.5">
          <div className="flex justify-between text-sm text-slate-400">
            <span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm text-emerald-400">
              <span>Discount</span><span>-₹{discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm text-slate-400">
            <span>GST (5%)</span><span>₹{taxAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-white pt-1.5 border-t border-slate-700">
            <span>Total</span><span>₹{total.toFixed(2)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="px-4 pb-4 flex gap-2">
          {(user?.role as string) !== 'CUSTOMER' && (
            <button onClick={holdBill} disabled={items.length === 0}
              className="flex-1 flex items-center justify-center gap-2 border border-slate-700 hover:border-amber-600 text-slate-300 hover:text-amber-400 py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-50">
              <Pause size={16} /> Hold
            </button>
          )}
          <button onClick={() => setShowPayment(true)} disabled={items.length === 0 || loading}
            className="flex-[2] flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-bold transition-colors">
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><ReceiptIcon size={16} /> Pay ₹{total.toFixed(2)}</>}
          </button>
        </div>

        {/* Shortcuts hint */}
        <div className="px-4 pb-3 text-center text-xs text-slate-600">
          Ctrl+N New • Ctrl+S Pay • Ctrl+F Search • Esc Close
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && <PaymentModal total={total} onClose={() => setShowPayment(false)} onComplete={handleCheckout} />}
      
      {/* Hidden Receipt for Printing */}
      {lastSale && (
        <Receipt 
          invoiceNo={lastSale.invoiceNo}
          items={lastSale.items?.map((i: any) => ({ productId: i.productId || '', sku: '', name: i.product?.name || 'Item', quantity: i.quantity, price: i.price, total: i.total, stock: 0 }))}
          subtotal={lastSale.subtotal}
          tax={lastSale.tax}
          discount={lastSale.discount}
          total={lastSale.total}
          amountPaid={lastSale.amountPaid}
          change={lastSale.change}
          payments={lastSale.payments}
          cashierName={user?.name}
          customerName={lastSale.customer?.name}
          date={new Date(lastSale.createdAt)}
          branchName={user?.branchId ? "Branch ID: " + user.branchId : "Main Branch"}
        />
      )}

      {/* Held Bills Modal */}
      {showHeld && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Held Bills</h2>
              <button onClick={() => setShowHeld(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            {heldBills.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No bills on hold</p>
            ) : (
              <div className="space-y-3">
                {heldBills.map(bill => (
                  <div key={bill.id} className="flex items-center gap-3 bg-slate-800 rounded-xl p-4">
                    <div className="flex-1">
                      <p className="text-white font-medium">{bill.invoiceNo}</p>
                      <p className="text-slate-400 text-xs">{bill.items.length} items • {bill.customer?.name || 'Walk-in'}</p>
                      <p className="text-blue-400 text-sm font-bold mt-1">₹{bill.total.toFixed(2)}</p>
                    </div>
                    <button onClick={() => resumeBill(bill)}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-lg transition-colors">
                      <Play size={14} /> Resume
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Last Sale Toast-like display (already handled by toast) */}
    </div>
  );
};

export default POSPage;
