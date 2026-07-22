import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../lib/api';
import type { Customer } from '../types';
import toast from 'react-hot-toast';
import { Plus, Search, Edit2, Trash2, X, Users, Phone, Mail, Star } from 'lucide-react';

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number').or(z.literal('')).optional(),
  email: z.string().email('Invalid email').or(z.literal('')).optional(),
  loyaltyId: z.string().optional(),
  gstNumber: z.string().optional(),
});

type CustomerForm = z.infer<typeof schema>;

const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CustomerForm>({ resolver: zodResolver(schema) });

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/customers', { params: { search } });
      setCustomers(res.data);
    } catch { toast.error('Failed to load customers'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCustomers(); }, [search]);

  const openAdd = () => { setEditing(null); reset({}); setShowModal(true); };
  const openEdit = (c: Customer) => { setEditing(c); reset({ name: c.name, phone: c.phone || '', email: c.email || '', loyaltyId: c.loyaltyId || '', gstNumber: c.gstNumber || '' }); setShowModal(true); };

  const onSubmit = async (data: CustomerForm) => {
    try {
      if (editing) { await api.put(`/customers/${editing.id}`, data); toast.success('Customer updated'); }
      else { await api.post('/customers', data); toast.success('Customer added'); }
      setShowModal(false);
      fetchCustomers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Operation failed');
    }
  };

  const deleteCustomer = async (id: string, name: string) => {
    if (!confirm(`Delete customer "${name}"?`)) return;
    try {
      await api.delete(`/customers/${id}`);
      toast.success('Customer deleted');
      fetchCustomers();
    } catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Customers</h1>
          <p className="text-slate-400 text-sm">{customers.length} registered customers</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors">
          <Plus size={16} /> Add Customer
        </button>
      </div>

      <div className="relative max-w-xs">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, phone..."
          className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading && Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-5 animate-pulse">
            <div className="h-4 bg-slate-800 rounded w-3/4 mb-2" /><div className="h-3 bg-slate-800 rounded w-1/2" />
          </div>
        ))}
        {!loading && customers.map(c => (
          <div key={c.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600/20 border border-blue-600/30 rounded-full flex items-center justify-center text-blue-400 font-bold">
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-semibold">{c.name}</p>
                  {c.loyaltyId && <p className="text-xs text-slate-500">{c.loyaltyId}</p>}
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(c)} className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all"><Edit2 size={14} /></button>
                <button onClick={() => deleteCustomer(c.id, c.name)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"><Trash2 size={14} /></button>
              </div>
            </div>
            <div className="mt-4 space-y-1.5">
              {c.phone && <div className="flex items-center gap-2 text-sm text-slate-400"><Phone size={13} />{c.phone}</div>}
              {c.email && <div className="flex items-center gap-2 text-sm text-slate-400"><Mail size={13} />{c.email}</div>}
              <div className="flex items-center gap-2 text-sm text-amber-400"><Star size={13} />{c.loyaltyPoints} points</div>
            </div>
          </div>
        ))}
        {!loading && customers.length === 0 && (
          <div className="col-span-3 flex flex-col items-center justify-center py-20 text-slate-500">
            <Users size={48} className="mb-3 opacity-30" />
            <p>No customers found</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-white">{editing ? 'Edit Customer' : 'Add Customer'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {[
                { label: 'Full Name *', name: 'name' as const, placeholder: 'Customer name' },
                { label: 'Phone Number', name: 'phone' as const, placeholder: '9999999999' },
                { label: 'Email', name: 'email' as const, placeholder: 'customer@email.com' },
                { label: 'Loyalty ID', name: 'loyaltyId' as const, placeholder: 'LOYAL-001' },
                { label: 'GST Number', name: 'gstNumber' as const, placeholder: '22AAAAA0000A1Z5' },
              ].map(field => (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-slate-300 mb-1">{field.label}</label>
                  <input {...register(field.name)} placeholder={field.placeholder}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500" />
                  {errors[field.name] && <p className="text-red-400 text-xs mt-1">{errors[field.name]?.message as string}</p>}
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-slate-700 text-slate-300 py-3 rounded-xl hover:text-white transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors">
                  {isSubmitting ? 'Saving...' : editing ? 'Update' : 'Add Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersPage;
