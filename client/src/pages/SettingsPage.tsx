import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Shield, UserPlus, X, Trash2 } from 'lucide-react';

interface UserEntry {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'text-red-400 bg-red-400/10 border-red-400/20',
  MANAGER: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  CASHIER: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
};

const SettingsPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'CASHIER' });
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/auth/users');
      setUsers(res.data);
    } catch { toast.error('Failed to load users'); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const createUser = async () => {
    if (!form.name || !form.email || !form.password) { toast.error('All fields required'); return; }
    setSubmitting(true);
    try {
      await api.post('/auth/users', form);
      toast.success('User created');
      setShowModal(false);
      setForm({ name: '', email: '', password: '', role: 'CASHIER' });
      fetchUsers();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed to create user'); }
    finally { setSubmitting(false); }
  };

  const deleteUser = async (id: string, name: string) => {
    if (id === currentUser?.id) { toast.error("You can't delete yourself"); return; }
    if (!confirm(`Delete user "${name}"?`)) return;
    try { await api.delete(`/auth/users/${id}`); toast.success('User deleted'); fetchUsers(); }
    catch { toast.error('Failed to delete user'); }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 text-sm">Manage users and system settings</p>
      </div>

      {/* User Management */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-blue-400" />
            <h2 className="text-white font-semibold">User Management</h2>
          </div>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm px-3 py-2 rounded-lg font-medium transition-colors">
            <UserPlus size={14} /> Add User
          </button>
        </div>

        <div className="space-y-3">
          {users.map(u => (
            <div key={u.id} className="flex items-center gap-4 bg-slate-800/50 rounded-xl p-4">
              <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0">
                {u.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-white font-medium">{u.name}</p>
                  {u.id === currentUser?.id && <span className="text-xs text-slate-500">(you)</span>}
                </div>
                <p className="text-slate-400 text-sm">{u.email}</p>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${ROLE_COLORS[u.role] || ''}`}>{u.role}</span>
              {u.id !== currentUser?.id && (
                <button onClick={() => deleteUser(u.id, u.name)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* System Info */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-white font-semibold mb-4">System Information</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            ['Version', '1.0.0'],
            ['Database', 'SQLite (Prisma ORM)'],
            ['Backend', 'Node.js + Express + TypeScript'],
            ['Frontend', 'React + Vite + TypeScript'],
            ['Tax Rate', '5% GST'],
            ['Currency', '₹ INR'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between bg-slate-800/50 rounded-lg px-3 py-2">
              <span className="text-slate-400">{k}</span>
              <span className="text-white">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Add User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-white">Create User</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Full Name', field: 'name', type: 'text', placeholder: 'John Doe' },
                { label: 'Email', field: 'email', type: 'email', placeholder: 'user@pos.com' },
                { label: 'Password', field: 'password', type: 'password', placeholder: '••••••••' },
              ].map(f => (
                <div key={f.field}>
                  <label className="block text-sm font-medium text-slate-300 mb-1">{f.label}</label>
                  <input type={f.type} value={(form as any)[f.field]} onChange={e => setForm(p => ({ ...p, [f.field]: e.target.value }))} placeholder={f.placeholder}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500" />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Role</label>
                <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500">
                  <option value="CASHIER">Cashier</option>
                  <option value="MANAGER">Manager</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-slate-700 text-slate-300 py-3 rounded-xl hover:text-white transition-colors">Cancel</button>
                <button onClick={createUser} disabled={submitting} className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors">
                  {submitting ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
