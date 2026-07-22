import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../lib/api';
import type { Coupon } from '../types';
import toast from 'react-hot-toast';
import { Plus, Tag, X, CheckCircle2, XCircle } from 'lucide-react';

const schema = z.object({
  code: z.string().min(3, 'Code must be at least 3 characters'),
  discountType: z.enum(['PERCENTAGE', 'FLAT']),
  discountValue: z.number().positive('Must be positive'),
  minPurchase: z.number().optional(),
  maxDiscount: z.number().optional(),
  validFrom: z.string().optional(),
  validUntil: z.string().optional(),
});

type CouponForm = z.infer<typeof schema>;

const CouponsPage: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<CouponForm>({
    resolver: zodResolver(schema),
    defaultValues: { discountType: 'PERCENTAGE' }
  });

  const discountType = watch('discountType');

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/coupons');
      setCoupons(res.data);
    } catch { toast.error('Failed to load coupons'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCoupons(); }, []);

  const onSubmit = async (data: CouponForm) => {
    try {
      await api.post('/reports/coupons', data);
      toast.success('Coupon created');
      setShowModal(false);
      reset();
      fetchCoupons();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create coupon');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Coupons</h1>
          <p className="text-slate-400 text-sm">{coupons.length} coupons</p>
        </div>
        <button onClick={() => { reset(); setShowModal(true); }} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors">
          <Plus size={16} /> Create Coupon
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading && Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-5 animate-pulse h-32" />
        ))}
        {!loading && coupons.map(c => (
          <div key={c.id} className={`bg-slate-900 border rounded-xl p-5 ${c.isActive ? 'border-slate-800' : 'border-slate-800 opacity-60'}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Tag size={16} className="text-blue-400" />
                <span className="font-mono text-white font-bold tracking-wider">{c.code}</span>
              </div>
              {c.isActive ? (
                <span className="flex items-center gap-1 text-xs text-emerald-400"><CheckCircle2 size={12} />Active</span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-slate-500"><XCircle size={12} />Inactive</span>
              )}
            </div>
            <p className="text-2xl font-bold text-white">
              {c.discountType === 'PERCENTAGE' ? `${c.discountValue}% off` : `₹${c.discountValue} off`}
            </p>
            <div className="mt-3 space-y-1 text-xs text-slate-400">
              {c.minPurchase && <p>Min. purchase: ₹{c.minPurchase}</p>}
              {c.maxDiscount && <p>Max. discount: ₹{c.maxDiscount}</p>}
              {c.validUntil && <p>Expires: {new Date(c.validUntil).toLocaleDateString('en-IN')}</p>}
            </div>
          </div>
        ))}
        {!loading && coupons.length === 0 && (
          <div className="col-span-3 flex flex-col items-center justify-center py-20 text-slate-500">
            <Tag size={48} className="mb-3 opacity-30" />
            <p>No coupons yet</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-white">Create Coupon</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Coupon Code *</label>
                <input {...register('code')} placeholder="e.g. SAVE20" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white uppercase tracking-wider focus:outline-none focus:border-blue-500" />
                {errors.code && <p className="text-red-400 text-xs mt-1">{errors.code.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Discount Type *</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['PERCENTAGE', 'FLAT'] as const).map(t => (
                    <label key={t} className={`flex items-center justify-center gap-2 border rounded-lg py-2.5 cursor-pointer text-sm transition-all ${discountType === t ? 'border-blue-500 bg-blue-600/10 text-blue-400' : 'border-slate-700 text-slate-400'}`}>
                      <input type="radio" {...register('discountType')} value={t} className="hidden" />
                      {t === 'PERCENTAGE' ? 'Percentage (%)' : 'Flat Amount (₹)'}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  {discountType === 'PERCENTAGE' ? 'Percentage (%)' : 'Amount (₹)'} *
                </label>
                <input {...register('discountValue', { valueAsNumber: true })} type="number" step="0.01" placeholder="0"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-blue-500" />
                {errors.discountValue && <p className="text-red-400 text-xs mt-1">{errors.discountValue.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Min. Purchase (₹)</label>
                  <input {...register('minPurchase', { valueAsNumber: true })} type="number" step="0.01" placeholder="0"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Max. Discount (₹)</label>
                  <input {...register('maxDiscount', { valueAsNumber: true })} type="number" step="0.01" placeholder="No limit"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Valid From</label>
                  <input {...register('validFrom')} type="date"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Valid Until</label>
                  <input {...register('validUntil')} type="date"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-slate-700 text-slate-300 py-3 rounded-xl hover:text-white transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors">
                  {isSubmitting ? 'Creating...' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CouponsPage;
