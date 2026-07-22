import React from 'react';
import { TrendingUp, ShoppingBag, Users, AlertTriangle, DollarSign, ArrowUpRight, Receipt, BadgeIndianRupee } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../lib/api';
import type { DashboardData, Sale } from '../types';
import toast from 'react-hot-toast';
import { useEffect, useState } from 'react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode; color: string; sub?: string }> = ({ label, value, icon, color, sub }) => (
  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-start gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-slate-400 text-sm font-medium">{label}</p>
      <p className="text-2xl font-bold text-white mt-0.5">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
  </div>
);

const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reports/dashboard')
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!data) return <div className="text-slate-400 text-center mt-20">Failed to load dashboard data.</div>;

  const paymentData = data.salesByPayment.map(p => ({ name: p.paymentMethod, value: p._sum.total || 0 }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-0.5">Welcome back — here's your business overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard label="Today's Revenue" value={`₹${(data.today.revenue || 0).toFixed(2)}`} icon={<DollarSign size={22} className="text-white" />} color="bg-blue-600" sub={`${data.today.orders} orders today`} />
        <StatCard label="Today's Expenses" value={`₹${(data.today.expenses || 0).toFixed(2)}`} icon={<Receipt size={22} className="text-white" />} color="bg-rose-600" />
        <StatCard label="Net Profit" value={`₹${(data.today.netProfit || 0).toFixed(2)}`} icon={<BadgeIndianRupee size={22} className="text-white" />} color="bg-emerald-600" />
        
        <StatCard label="Total Orders" value={data.totals.orders} icon={<ShoppingBag size={22} className="text-white" />} color="bg-indigo-600" />
        <StatCard label="Customers" value={data.totals.customers} icon={<Users size={22} className="text-white" />} color="bg-violet-600" />
        <StatCard label="Low Stock Items" value={data.totals.lowStock} icon={<AlertTriangle size={22} className="text-white" />} color={data.totals.lowStock > 0 ? "bg-amber-600" : "bg-slate-700"} sub={`${data.totals.products} total products`} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white font-semibold">Weekly Revenue</h3>
              <p className="text-slate-400 text-xs">Last 7 days</p>
            </div>
            <TrendingUp size={18} className="text-blue-400" />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.weeklySales}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#475569" tick={{ fontSize: 11 }} />
              <YAxis stroke="#475569" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} formatter={(v: unknown) => [`₹${Number(v).toFixed(2)}`, 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="url(#grad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-1">Payment Methods</h3>
          <p className="text-slate-400 text-xs mb-4">Revenue by payment type</p>
          {paymentData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={paymentData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={4}>
                    {paymentData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} formatter={(v: unknown) => [`₹${Number(v).toFixed(2)}`, 'Revenue']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {paymentData.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-slate-300">{item.name}</span>
                    </div>
                    <span className="text-white font-medium">₹{item.value.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-40 text-slate-500 text-sm">No payment data yet</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Recent Sales</h3>
          <div className="space-y-3">
            {data.recentSales.length === 0 && <p className="text-slate-500 text-sm text-center py-6">No sales yet</p>}
            {data.recentSales.map((sale: Sale) => (
              <div key={sale.id} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                <div>
                  <p className="text-white text-sm font-medium">{sale.invoiceNo}</p>
                  <p className="text-slate-400 text-xs">{sale.customer?.name || 'Walk-in'} • {sale.user?.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-white text-sm font-bold">₹{sale.total.toFixed(2)}</p>
                  <p className="text-slate-500 text-xs">{new Date(sale.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Top Products</h3>
          <div className="space-y-3">
            {data.topProducts.length === 0 && <p className="text-slate-500 text-sm text-center py-6">No sales data yet</p>}
            {data.topProducts.map((item, idx) => (
              <div key={item.productId} className="flex items-center gap-3">
                <div className="w-7 h-7 bg-slate-800 rounded-lg flex items-center justify-center text-xs font-bold text-slate-400">#{idx + 1}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{item.product?.name || 'Unknown'}</p>
                  <p className="text-slate-400 text-xs">{item._sum?.quantity || 0} units sold</p>
                </div>
                <div className="flex items-center gap-1 text-emerald-400 text-sm font-medium">
                  <ArrowUpRight size={14} />
                  ₹{(item._sum?.total || 0).toFixed(0)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-1 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Top Performing Staff</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="pb-3 font-medium">Staff Member</th>
                  <th className="pb-3 font-medium">Role</th>
                  <th className="pb-3 text-right font-medium">Sales Count</th>
                  <th className="pb-3 text-right font-medium">Revenue Generated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {data.staffPerformance && data.staffPerformance.length === 0 && (
                  <tr><td colSpan={4} className="py-4 text-center text-slate-500">No data available</td></tr>
                )}
                {data.staffPerformance?.map((staff: any) => (
                  <tr key={staff.userId} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 text-white font-medium">{staff.user?.name || 'Unknown'}</td>
                    <td className="py-3 text-slate-400">{staff.user?.role || '-'}</td>
                    <td className="py-3 text-right text-slate-300">{staff._count?.id || 0}</td>
                    <td className="py-3 text-right text-emerald-400 font-medium">₹{(staff._sum?.total || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
