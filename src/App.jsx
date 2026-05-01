import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home, ShoppingCart, Package, BarChart2 } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Products from './pages/Products';
import Reports from './pages/Reports';

function Sidebar() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <div className="sidebar print-hide">
      <div className="brand">
        <ShoppingCart size={28} />
        SuperBilling
      </div>
      <div className="nav-links">
        <Link to="/" className={`nav-item ${isActive('/')}`}>
          <Home size={20} /> Dashboard
        </Link>
        <Link to="/pos" className={`nav-item ${isActive('/pos')}`}>
          <ShoppingCart size={20} /> POS System
        </Link>
        <Link to="/products" className={`nav-item ${isActive('/products')}`}>
          <Package size={20} /> Products
        </Link>
        <Link to="/reports" className={`nav-item ${isActive('/reports')}`}>
          <BarChart2 size={20} /> Reports
        </Link>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/pos" element={<POS />} />
            <Route path="/products" element={<Products />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
