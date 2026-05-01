import { useState, useEffect } from 'react';
import axios from 'axios';
import { IndianRupee, ShoppingBag, PackageOpen } from 'lucide-react';

export default function Dashboard() {
  const [metrics, setMetrics] = useState({ totalOrders: 0, totalRevenue: 0, totalProducts: 0 });

  useEffect(() => {
    axios.get('/api/dashboard')
      .then(res => setMetrics(res.data))
      .catch(console.error);
  }, []);

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Dashboard Overview</h1>
      <div className="stats-grid">
        <div className="card">
          <div className="text-muted" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
            <IndianRupee size={18} /> Total Revenue
          </div>
          <h2 style={{ fontSize: '2rem', color: 'var(--primary)' }}>₹{metrics.totalRevenue.toFixed(2)}</h2>
        </div>
        <div className="card">
          <div className="text-muted" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
            <ShoppingBag size={18} /> Total Orders
          </div>
          <h2 style={{ fontSize: '2rem' }}>{metrics.totalOrders}</h2>
        </div>
        <div className="card">
          <div className="text-muted" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
            <PackageOpen size={18} /> Total Products
          </div>
          <h2 style={{ fontSize: '2rem' }}>{metrics.totalProducts}</h2>
        </div>
      </div>
    </div>
  );
}
