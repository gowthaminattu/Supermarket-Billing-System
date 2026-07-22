import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import type { Sale } from '../types';
import toast from 'react-hot-toast';
import { Search, RefreshCw, Eye, X, Printer, MapPin, User as UserIcon } from 'lucide-react';
import Receipt from '../components/Receipt';
import { useAuth } from '../context/AuthContext';

const SalesPage: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [cashierId, setCashierId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const { user: currentUser } = useAuth();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [salesRes, usersRes, branchesRes] = await Promise.all([
        api.get('/sales', { params: { from: dateFrom || undefined, to: dateTo || undefined, cashierId: cashierId || undefined, branchId: branchId || undefined } }),
        api.get('/auth/users'),
        api.get('/branches')
      ]);
      setSales(salesRes.data);
      setUsers(usersRes.data);
      setBranches(branchesRes.data);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [dateFrom, dateTo, cashierId, branchId]);

  const refundSale = async (id: string, invoiceNo: string) => {
    if (!confirm(`Refund invoice ${invoiceNo}? Stock will be restored.`)) return;
    try {
      await api.post(`/sales/${id}/refund`);
      toast.success('Sale refunded and stock restored');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Refund failed');
    }
  };

  const filteredSales = sales.filter(s =>
    s.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
    (s.customer?.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.user?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      COMPLETED: 'bg-emerald-900/40 text-emerald-400 border-emerald-800',
      HELD: 'bg-amber-900/40 text-amber-400 border-amber-800',
      REFUNDED: 'bg-red-900/40 text-red-400 border-red-800',
    };
    return map[status] || 'bg-slate-800 text-slate-400 border-slate-700';
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Sales History</h1>
          <p className="text-slate-400 text-sm">{filteredSales.length} transactions</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 border border-slate-700 text-slate-300 hover:text-white text-sm px-3 py-2 rounded-lg transition-colors">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by invoice, customer..."
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
        </div>
        <div className="flex items-center gap-2">
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
          <span className="text-slate-500">to</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
        </div>
        
        {currentUser?.role === 'ADMIN' && (
          <>
            <select value={branchId} onChange={e => setBranchId(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
              <option value="">All Branches</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <select value={cashierId} onChange={e => setCashierId(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
              <option value="">All Staff</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </>
        )}
        
        {(dateFrom || dateTo || cashierId || branchId) && (
          <button onClick={() => { setDateFrom(''); setDateTo(''); setCashierId(''); setBranchId(''); }} className="text-slate-400 hover:text-white px-2">
            Clear Filters
          </button>
        )}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-3 font-medium">Invoice</th>
                <th className="text-left px-4 py-3 font-medium">Date & Time</th>
                <th className="text-left px-4 py-3 font-medium">Customer</th>
                <th className="text-left px-4 py-3 font-medium">Cashier</th>
                <th className="text-left px-4 py-3 font-medium">Payment</th>
                <th className="text-right px-4 py-3 font-medium">Total</th>
                <th className="text-center px-4 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading && Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 8 }).map((_, j) => (
                  <td key={j} className="px-4 py-3"><div className="h-4 bg-slate-800 rounded animate-pulse" /></td>
                ))}</tr>
              ))}
              {!loading && filteredSales.map(sale => (
                <tr key={sale.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 text-blue-400 font-mono text-sm font-medium">{sale.invoiceNo}</td>
                  <td className="px-4 py-3 text-slate-400 text-sm">{new Date(sale.createdAt).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-slate-300 text-sm">{sale.customer?.name || 'Walk-in'}</td>
                  <td className="px-4 py-3 text-slate-300 text-sm">{sale.user?.name || '—'}</td>
                  <td className="px-4 py-3 text-slate-300 text-sm">{sale.paymentMethod}</td>
                  <td className="px-4 py-3 text-right text-white font-semibold text-sm">₹{sale.total.toFixed(2)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${getStatusBadge(sale.status)}`}>
                      {sale.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setSelectedSale(sale)} className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all" title="View">
                        <Eye size={14} />
                      </button>
                      {sale.status === 'COMPLETED' && (
                        <button onClick={() => refundSale(sale.id, sale.invoiceNo)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all" title="Refund">
                          <RefreshCw size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filteredSales.length === 0 && (
                <tr><td colSpan={8} className="text-center py-12 text-slate-500">No sales found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sale Detail Modal */}
      {selectedSale && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                {selectedSale.invoiceNo}
                <button onClick={() => setTimeout(() => window.print(), 100)} className="ml-4 text-blue-400 hover:text-blue-300 bg-blue-400/10 hover:bg-blue-400/20 px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 transition-colors">
                  <Printer size={16} /> Print Receipt
                </button>
              </h2>
              <button onClick={() => setSelectedSale(null)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-slate-800/50 rounded-lg p-3"><p className="text-slate-400 text-xs">Customer</p><p className="text-white font-medium mt-0.5">{selectedSale.customer?.name || 'Walk-in'}</p></div>
                <div className="bg-slate-800/50 rounded-lg p-3"><p className="text-slate-400 text-xs">Cashier</p><p className="text-white font-medium mt-0.5">{selectedSale.user?.name}</p></div>
                <div className="bg-slate-800/50 rounded-lg p-3"><p className="text-slate-400 text-xs">Date</p><p className="text-white font-medium mt-0.5">{new Date(selectedSale.createdAt).toLocaleString('en-IN')}</p></div>
                <div className="bg-slate-800/50 rounded-lg p-3"><p className="text-slate-400 text-xs">Payment</p><p className="text-white font-medium mt-0.5">{selectedSale.paymentMethod}</p></div>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-4">
                <p className="text-slate-400 text-xs uppercase tracking-wide mb-3">Items</p>
                <div className="space-y-2">
                  {selectedSale.items.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-slate-300">{item.product?.name || 'Product'} <span className="text-slate-500">× {item.quantity}</span></span>
                      <span className="text-white font-medium">₹{item.total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-400"><span>Subtotal</span><span>₹{selectedSale.subtotal.toFixed(2)}</span></div>
                {selectedSale.discount > 0 && <div className="flex justify-between text-emerald-400"><span>Discount</span><span>-₹{selectedSale.discount.toFixed(2)}</span></div>}
                <div className="flex justify-between text-slate-400"><span>GST</span><span>₹{selectedSale.tax.toFixed(2)}</span></div>
                <div className="flex justify-between text-white text-lg font-bold border-t border-slate-700 pt-2"><span>Total</span><span>₹{selectedSale.total.toFixed(2)}</span></div>
                <div className="flex justify-between text-slate-400"><span>Amount Paid</span><span>₹{selectedSale.amountPaid.toFixed(2)}</span></div>
                {selectedSale.change > 0 && <div className="flex justify-between text-amber-400"><span>Change</span><span>₹{selectedSale.change.toFixed(2)}</span></div>}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Hidden Receipt Component */}
      {selectedSale && (
        <Receipt 
          invoiceNo={selectedSale.invoiceNo}
          items={selectedSale.items?.map((i: any) => ({ name: i.product?.name || 'Item', quantity: i.quantity, price: i.price, total: i.total }))}
          subtotal={selectedSale.subtotal}
          tax={selectedSale.tax}
          discount={selectedSale.discount}
          total={selectedSale.total}
          amountPaid={selectedSale.amountPaid}
          change={selectedSale.change}
          payments={selectedSale.payments}
          cashierName={selectedSale.user?.name}
          customerName={selectedSale.customer?.name}
          date={new Date(selectedSale.createdAt)}
        />
      )}
    </div>
  );
};

export default SalesPage;
