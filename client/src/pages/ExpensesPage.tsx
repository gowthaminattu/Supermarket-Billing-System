import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { Receipt, Plus, Trash2, Calendar, MapPin, Tag } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);

  const [branches, setBranches] = useState<any[]>([]);
  const [formData, setFormData] = useState({ amount: '', description: '', category: 'OTHER', branchId: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [expRes, branchRes] = await Promise.all([
        api.get('/expenses'),
        api.get('/branches')
      ]);
      setExpenses(expRes.data);
      setBranches(branchRes.data);
    } catch (error) {
      toast.error('Failed to load data');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/expenses', formData);
      toast.success('Expense recorded successfully');
      setFormData({ amount: '', description: '', category: 'OTHER', branchId: '' });
      fetchData();
    } catch (error) {
      toast.error('Failed to record expense');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      toast.success('Expense deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete expense');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Receipt className="text-blue-500" />
          Expenses
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-lg font-bold text-white mb-4">Record Expense</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Amount</label>
                <input type="number" step="0.01" required value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Description</label>
                <input type="text" required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Category</label>
                <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-blue-500">
                  <option value="RENT">Rent</option>
                  <option value="UTILITIES">Utilities</option>
                  <option value="SUPPLIES">Supplies</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Branch (Optional)</label>
                <select value={formData.branchId} onChange={e => setFormData({ ...formData, branchId: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-blue-500">
                  <option value="">-- All Branches / Global --</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2">
                <Plus size={18} /> Record
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-800/50 text-slate-400 text-xs uppercase">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Description</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Branch</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {expenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-400">
                          <Calendar size={14} />
                          {new Date(expense.date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-white">{expense.description}</td>
                      <td className="px-6 py-4">
                        <span className="bg-slate-800 px-2 py-1 rounded text-xs flex items-center gap-1 w-max">
                          <Tag size={12} /> {expense.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {expense.branch ? (
                           <div className="flex items-center gap-1 text-slate-400"><MapPin size={14} />{expense.branch.name}</div>
                        ) : (
                           <span className="text-slate-500 italic">Global</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-bold text-red-400">₹{expense.amount.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <button onClick={() => handleDelete(expense.id)} className="text-slate-400 hover:text-red-400">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {expenses.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                        No expenses recorded yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
