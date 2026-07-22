import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import POSPage from './pages/POSPage';
import InventoryPage from './pages/InventoryPage';
import CustomersPage from './pages/CustomersPage';
import SuppliersPage from './pages/SuppliersPage';
import SalesPage from './pages/SalesPage';
import CouponsPage from './pages/CouponsPage';
import SettingsPage from './pages/SettingsPage';
import ExpensesPage from './pages/ExpensesPage';
import BranchesPage from './pages/BranchesPage';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155', borderRadius: '12px', fontSize: '14px' },
              success: { iconTheme: { primary: '#10b981', secondary: '#1e293b' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#1e293b' } },
            }}
          />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            
            {/* Admin & Manager Routes */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']} />}>
              <Route element={<Layout><DashboardPage /></Layout>} path="/dashboard" />
              <Route element={<Layout><InventoryPage /></Layout>} path="/inventory" />
              <Route element={<Layout><SuppliersPage /></Layout>} path="/suppliers" />
              <Route element={<Layout><SalesPage /></Layout>} path="/sales" />
              <Route element={<Layout><CouponsPage /></Layout>} path="/coupons" />
            </Route>

            {/* Admin-only Routes */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
              <Route element={<Layout><SettingsPage /></Layout>} path="/settings" />
              <Route element={<Layout><ExpensesPage /></Layout>} path="/expenses" />
              <Route element={<Layout><BranchesPage /></Layout>} path="/branches" />
            </Route>

            {/* All Authenticated Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout><CustomersPage /></Layout>} path="/customers" />
            </Route>
            
            {/* Customer-only Routes */}
            <Route element={<ProtectedRoute allowedRoles={['CUSTOMER']} />}>
              <Route element={<Layout><POSPage /></Layout>} path="/customer/dashboard" />
            </Route>

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
