import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Store, Lock, Mail, Phone, User as UserIcon } from 'lucide-react';

const staffLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const customerLoginSchema = z.object({
  phone: z.string().min(10, 'Valid phone number required'),
  password: z.string().min(1, 'Password is required'),
});

const customerRegisterSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  phone: z.string().min(10, 'Valid phone number required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type StaffLoginForm = z.infer<typeof staffLoginSchema>;
type CustomerLoginForm = z.infer<typeof customerLoginSchema>;
type CustomerRegisterForm = z.infer<typeof customerRegisterSchema>;

const LoginPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'staff' | 'customer_login' | 'customer_register'>('staff');
  const { login } = useAuth();
  const navigate = useNavigate();

  // Staff Login Form
  const { register: registerStaff, handleSubmit: handleStaffSubmit, setValue: setStaffValue, formState: { errors: staffErrors, isSubmitting: isStaffSubmitting } } = useForm<StaffLoginForm>({
    resolver: zodResolver(staffLoginSchema)
  });

  // Customer Login Form
  const { register: registerCustomerLogin, handleSubmit: handleCustomerLoginSubmit, formState: { errors: custLoginErrors, isSubmitting: isCustLoginSubmitting } } = useForm<CustomerLoginForm>({
    resolver: zodResolver(customerLoginSchema)
  });

  // Customer Register Form
  const { register: registerCustomerSignup, handleSubmit: handleCustomerSignupSubmit, formState: { errors: custSignupErrors, isSubmitting: isCustSignupSubmitting } } = useForm<CustomerRegisterForm>({
    resolver: zodResolver(customerRegisterSchema)
  });

  const handleQuickLogin = (role: 'admin' | 'cashier') => {
    setActiveTab('staff');
    if (role === 'admin') {
      setStaffValue('email', 'admin@pos.com');
      setStaffValue('password', 'admin123');
    } else {
      setStaffValue('email', 'cashier@pos.com');
      setStaffValue('password', 'cashier123');
    }
  };

  const onStaffLogin = async (data: StaffLoginForm) => {
    try {
      const res = await api.post('/auth/login', data);
      login(res.data.token, res.data.user);
      toast.success(`Welcome back, ${res.data.user.name}!`);
      if (res.data.user.role === 'CASHIER') navigate('/pos');
      else navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Login failed');
    }
  };

  const onCustomerLogin = async (data: CustomerLoginForm) => {
    try {
      const res = await api.post('/auth/customer/login', data);
      login(res.data.token, res.data.user);
      toast.success(`Welcome back, ${res.data.user.name}!`);
      navigate('/customer/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Login failed');
    }
  };

  const onCustomerRegister = async (data: CustomerRegisterForm) => {
    try {
      const res = await api.post('/auth/customer/register', data);
      login(res.data.token, res.data.user);
      toast.success(`Account created! Welcome, ${res.data.user.name}!`);
      navigate('/customer/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-600/30">
            <Store size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">ShopPOS</h1>
          <p className="text-slate-400 mt-1">Point of Sale System</p>
        </div>

        {/* Form Card */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 shadow-xl">
          
          {/* Main Tabs */}
          <div className="flex rounded-lg bg-slate-800 p-1 mb-6">
            <button
              onClick={() => setActiveTab('staff')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'staff' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Staff Login
            </button>
            <button
              onClick={() => setActiveTab(activeTab === 'customer_register' ? 'customer_register' : 'customer_login')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab.startsWith('customer') ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Customer Portal
            </button>
          </div>

          {activeTab.startsWith('customer') && (
            <div className="flex border-b border-slate-700 mb-6">
              <button
                onClick={() => setActiveTab('customer_login')}
                className={`flex-1 py-2 text-sm font-medium border-b-2 transition-all ${activeTab === 'customer_login' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-300'}`}
              >
                Sign In
              </button>
              <button
                onClick={() => setActiveTab('customer_register')}
                className={`flex-1 py-2 text-sm font-medium border-b-2 transition-all ${activeTab === 'customer_register' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-300'}`}
              >
                Sign Up
              </button>
            </div>
          )}

          {/* Form Content */}
          {activeTab === 'staff' && (
            <div>
              <form onSubmit={handleStaffSubmit(onStaffLogin)} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      {...registerStaff('email')}
                      type="email"
                      placeholder="admin@pos.com"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    />
                  </div>
                  {staffErrors.email && <p className="text-red-400 text-xs mt-1">{staffErrors.email.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      {...registerStaff('password')}
                      type="password"
                      placeholder="••••••••"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    />
                  </div>
                  {staffErrors.password && <p className="text-red-400 text-xs mt-1">{staffErrors.password.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isStaffSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2"
                >
                  {isStaffSubmitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Sign In as Staff'}
                </button>
              </form>

              <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                <p className="text-xs text-slate-400 font-medium mb-3 text-center">Quick Login (Demo)</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('admin')}
                    className="py-2 text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-white rounded-md transition-colors"
                  >
                    Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('cashier')}
                    className="py-2 text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-white rounded-md transition-colors"
                  >
                    Cashier
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'customer_login' && (
            <form onSubmit={handleCustomerLoginSubmit(onCustomerLogin)} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Phone Number</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    {...registerCustomerLogin('phone')}
                    type="text"
                    placeholder="9876543210"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>
                {custLoginErrors.phone && <p className="text-red-400 text-xs mt-1">{custLoginErrors.phone.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    {...registerCustomerLogin('password')}
                    type="password"
                    placeholder="••••••••"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>
                {custLoginErrors.password && <p className="text-red-400 text-xs mt-1">{custLoginErrors.password.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isCustLoginSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2"
              >
                {isCustLoginSubmitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Sign In'}
              </button>
            </form>
          )}

          {activeTab === 'customer_register' && (
            <form onSubmit={handleCustomerSignupSubmit(onCustomerRegister)} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                <div className="relative">
                  <UserIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    {...registerCustomerSignup('name')}
                    type="text"
                    placeholder="John Doe"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>
                {custSignupErrors.name && <p className="text-red-400 text-xs mt-1">{custSignupErrors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Phone Number</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    {...registerCustomerSignup('phone')}
                    type="tel"
                    placeholder="9876543210"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>
                {custSignupErrors.phone && <p className="text-red-400 text-xs mt-1">{custSignupErrors.phone.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    {...registerCustomerSignup('password')}
                    type="password"
                    placeholder="••••••••"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>
                {custSignupErrors.password && <p className="text-red-400 text-xs mt-1">{custSignupErrors.password.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isCustSignupSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2"
              >
                {isCustSignupSubmitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Create Account'}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};

export default LoginPage;
