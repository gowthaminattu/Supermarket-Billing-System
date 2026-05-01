import { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText } from 'lucide-react';

export default function Reports() {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    axios.get('/api/reports')
      .then(res => setReports(res.data))
      .catch(console.error);
  }, []);

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
        <FileText size={24} color="var(--primary)" />
        <h2 style={{ borderBottom: 'none', margin: 0, padding: 0 }}>Recent Transaction Logs</h2>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Invoice ID</th>
              <th>Date & Time</th>
              <th>Subtotal</th>
              <th>Discount</th>
              <th>Tax (GST)</th>
              <th>Final Total</th>
            </tr>
          </thead>
          <tbody>
            {reports.map(r => (
              <tr key={r.id}>
                <td style={{ fontWeight: 600 }}>{r.id}</td>
                <td className="text-muted">{new Date(r.date).toLocaleString()}</td>
                <td>₹{r.subtotal.toFixed(2)}</td>
                <td className="text-success">-₹{r.discount.toFixed(2)}</td>
                <td className="text-muted">+₹{r.tax.toFixed(2)}</td>
                <td style={{ fontWeight: 700, color: 'var(--primary)' }}>₹{r.total.toFixed(2)}</td>
              </tr>
            ))}
            {reports.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No recent transactions found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
