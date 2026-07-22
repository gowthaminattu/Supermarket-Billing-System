import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../lib/api';
import type { Supplier } from '../types';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, X, Truck, Phone, Mail, MapPin } from 'lucide-react';

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  contact: z.string().optional(),
  email: z.string().email('Invalid email').or(z.literal('')).optional(),
  address: z.string().optional(),
});

type SupplierForm = z.infer<typeof schema>;

const SuppliersPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<SupplierForm>({ resolver: zodResolver(schema) });

  const fetchSuppliers = async () => {
    setLoading(true);
    try { const res = await api.get('/suppliers'); setSuppliers(res.data); }
    catch { toast.error('Failed to load suppliers'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSuppliers(); }, []);

  const openEdit = (s: Supplier) => { setEditing(s); reset({ name: s.name, contact: s.contact || '', email: s.email || '', address: s.address || '' }); setShowModal(true); };
  const openAdd = () => { setEditing(null); reset({}); setShowModal(true); };

  const onSubmit = async (data: SupplierForm) => {
    try {
      if (editing) { await api.put(`/suppliers/${editing.id}`, data); toast.success('Supplier updated'); }
      else { await api.post('/suppliers', data); toast.success('Supplier added'); }
      setShowModal(false); fetchSuppliers();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Operation failed'); }
  };

  const deleteSupplier = async (id: string, name: string) => {
    if (!confirm(`Delete supplier "${name}"?`)) return;
    try { await api.delete(`/suppliers/${id}`); toast.success('Supplier deleted'); fetchSuppliers(); }
    catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Suppliers</h1>
          <p className="text-slate-400 text-sm">{suppliers.length} suppliers</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors">
          <Plus size={16} /> Add Supplier
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading && Array.from({ length: 3 }).map((_, i) => <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-5 animate-pulse h-36" />)}
        {!loading && suppliers.map(s => (
          <div key={s.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-violet-600/20 border border-violet-600/30 rounded-full flex items-center justify-center text-violet-400 font-bold">{s.name.charAt(0)}</div>
                <p className="text-white font-semibold">{s.name}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(s)} className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all"><Edit2 size={14} /></button>
                <button onClick={() => deleteSupplier(s.id, s.name)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"><Trash2 size={14} /></button>
              </div>
            </div>
            <div className="mt-4 space-y-1.5">
              {s.contact && <div className="flex items-center gap-2 text-sm text-slate-400"><Phone size={13} />{s.contact}</div>}
              {s.email && <div className="flex items-center gap-2 text-sm text-slate-400"><Mail size={13} />{s.email}</div>}
              {s.address && <div className="flex items-center gap-2 text-sm text-slate-400"><MapPin size={13} /><span className="truncate">{s.address}</span></div>}
            </div>
          </div>
        ))}
        {!loading && suppliers.length === 0 && (
          <div className="col-span-3 flex flex-col items-center justify-center py-20 text-slate-500">
            <Truck size={48} className="mb-3 opacity-30" /><p>No suppliers yet</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-white">{editing ? 'Edit Supplier' : 'Add Supplier'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {[
                { label: 'Business Name *', name: 'name' as const, placeholder: 'Supplier name' },
                { label: 'Contact Number', name: 'contact' as const, placeholder: '9876543210' },
                { label: 'Email', name: 'email' as const, placeholder: 'supplier@email.com' },
                { label: 'Address', name: 'address' as const, placeholder: 'Full address' },
              ].map(f => (
                <div key={f.name}>
                  <label className="block text-sm font-medium text-slate-300 mb-1">{f.label}</label>
                  <input {...register(f.name)} placeholder={f.placeholder}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500" />
                  {errors[f.name] && <p className="text-red-400 text-xs mt-1">{errors[f.name]?.message as string}</p>}
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-slate-700 text-slate-300 py-3 rounded-xl hover:text-white transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors">
                  {isSubmitting ? 'Saving...' : editing ? 'Update' : 'Add Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuppliersPage;
