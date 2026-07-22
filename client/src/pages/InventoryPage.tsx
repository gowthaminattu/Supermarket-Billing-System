import React, { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../lib/api';
import type { Product, Category, Supplier } from '../types';
import toast from 'react-hot-toast';
import { Plus, Search, Edit2, Trash2, X, AlertTriangle, Package, Download, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';

const schema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  costPrice: z.number().nonnegative('Cost price must be 0 or more'),
  stock: z.number().int().nonnegative('Stock cannot be negative'),
  minStock: z.number().int().nonnegative(),
  categoryId: z.string().min(1, 'Category is required'),
  supplierId: z.string().optional(),
  barcode: z.string().optional(),
});

type ProductForm = z.infer<typeof schema>;

const InventoryPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLowStock, setShowLowStock] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ProductForm>({
    resolver: zodResolver(schema),
    defaultValues: { minStock: 10, stock: 0, costPrice: 0 }
  });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, cRes, sRes] = await Promise.all([
        api.get('/products', { params: { search, category: filterCategory } }),
        api.get('/products/categories'),
        api.get('/suppliers')
      ]);
      setProducts(pRes.data);
      setCategories(cRes.data);
      setSuppliers(sRes.data);
    } catch { toast.error('Failed to load inventory'); }
    finally { setLoading(false); }
  }, [search, filterCategory]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openAdd = () => {
    setEditingProduct(null);
    reset({ minStock: 10, stock: 0, costPrice: 0 });
    setShowModal(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    reset({
      sku: product.sku, name: product.name, description: product.description || '',
      price: product.price, costPrice: product.costPrice, stock: product.stock,
      minStock: product.minStock, categoryId: product.categoryId,
      supplierId: product.supplierId || '', barcode: product.barcode || ''
    });
    setShowModal(true);
  };

  const onSubmit = async (data: ProductForm) => {
    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, data);
        toast.success('Product updated');
      } else {
        await api.post('/products', data);
        toast.success('Product added');
      }
      setShowModal(false);
      fetchAll();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      toast.error(e.response?.data?.error || 'Operation failed');
    }
  };

  const deleteProduct = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deleted');
      fetchAll();
    } catch { toast.error('Failed to delete product'); }
  };

  const exportExcel = () => {
    const data = products.map(p => ({
      SKU: p.sku, Name: p.name, Category: p.category?.name, Price: p.price,
      'Cost Price': p.costPrice, Stock: p.stock, 'Min Stock': p.minStock, Barcode: p.barcode || ''
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventory');
    XLSX.writeFile(wb, 'inventory.xlsx');
    toast.success('Exported to Excel');
  };

  const importExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const wb = XLSX.read(evt.target?.result, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws);
      let success = 0;
      for (const row of data) {
        try {
          const cat = categories.find(c => c.name === row['Category']);
          if (!cat) continue;
          await api.post('/products', {
            sku: row['SKU'], name: row['Name'], price: row['Price'], costPrice: row['Cost Price'] || 0,
            stock: row['Stock'] || 0, minStock: row['Min Stock'] || 10, categoryId: cat.id, barcode: row['Barcode'] || undefined
          });
          success++;
        } catch { /* skip invalid rows */ }
      }
      toast.success(`Imported ${success} products`);
      fetchAll();
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const filteredProducts = showLowStock ? products.filter(p => p.stock <= p.minStock) : products;
  const lowStockCount = products.filter(p => p.stock <= p.minStock).length;

  const InputField: React.FC<{ label: string; name: keyof ProductForm; type?: string; placeholder?: string; step?: string }> = ({ label, name, type = 'text', placeholder, step }) => (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1">{label}</label>
      <input {...register(name, { valueAsNumber: type === 'number' })} type={type} step={step} placeholder={placeholder}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors" />
      {errors[name] && <p className="text-red-400 text-xs mt-1">{errors[name]?.message as string}</p>}
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Inventory</h1>
          <p className="text-slate-400 text-sm mt-0.5">{products.length} products</p>
        </div>
        <div className="flex items-center gap-2">
          {lowStockCount > 0 && (
            <button onClick={() => setShowLowStock(!showLowStock)}
              className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg border transition-colors ${showLowStock ? 'border-amber-500 bg-amber-500/10 text-amber-400' : 'border-slate-700 text-slate-400 hover:text-amber-400 hover:border-amber-700'}`}>
              <AlertTriangle size={14} /> {lowStockCount} Low Stock
            </button>
          )}
          <label className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg border border-slate-700 text-slate-300 hover:border-blue-500 hover:text-blue-400 cursor-pointer transition-colors">
            <Upload size={14} /> Import
            <input type="file" accept=".xlsx,.csv" onChange={importExcel} className="hidden" />
          </label>
          <button onClick={exportExcel} className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg border border-slate-700 text-slate-300 hover:border-blue-500 hover:text-blue-400 transition-colors">
            <Download size={14} /> Export
          </button>
          <button onClick={openAdd} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-lg transition-colors font-medium">
            <Plus size={16} /> Add Product
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
        </div>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-blue-500">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-3 font-medium">Product</th>
                <th className="text-left px-4 py-3 font-medium">SKU</th>
                <th className="text-left px-4 py-3 font-medium">Category</th>
                <th className="text-right px-4 py-3 font-medium">Cost</th>
                <th className="text-right px-4 py-3 font-medium">Price</th>
                <th className="text-right px-4 py-3 font-medium">Stock</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading && Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-4"><div className="h-4 bg-slate-800 rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))}
              {!loading && filteredProducts.map(product => (
                <tr key={product.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Package size={14} className="text-slate-400" />
                      </div>
                      <p className="text-white text-sm font-medium">{product.name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-sm">{product.sku}</td>
                  <td className="px-4 py-3">
                    <span className="bg-slate-800 text-slate-300 text-xs px-2 py-1 rounded-full">{product.category?.name}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-300 text-sm">₹{product.costPrice.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-white text-sm font-medium">₹{product.price.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-sm font-bold ${product.stock === 0 ? 'text-red-400' : product.stock <= product.minStock ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(product)} className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => deleteProduct(product.id, product.name)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filteredProducts.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-slate-500">No products found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-white">{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
              <InputField label="Product Name *" name="name" placeholder="e.g. Organic Apples" />
              <InputField label="SKU *" name="sku" placeholder="e.g. PRD-1001" />
              <InputField label="Selling Price (₹) *" name="price" type="number" step="0.01" placeholder="0.00" />
              <InputField label="Cost Price (₹) *" name="costPrice" type="number" step="0.01" placeholder="0.00" />
              <InputField label="Stock Quantity *" name="stock" type="number" placeholder="0" />
              <InputField label="Min Stock Alert" name="minStock" type="number" placeholder="10" />
              <InputField label="Barcode" name="barcode" placeholder="8901234567890" />
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Category *</label>
                <select {...register('categoryId')} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500">
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {errors.categoryId && <p className="text-red-400 text-xs mt-1">{errors.categoryId.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Supplier</label>
                <select {...register('supplierId')} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500">
                  <option value="">No supplier</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                <textarea {...register('description')} rows={2} placeholder="Optional description..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none" />
              </div>
              <div className="col-span-2 flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-slate-700 text-slate-300 hover:text-white py-3 rounded-xl transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors">
                  {isSubmitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
