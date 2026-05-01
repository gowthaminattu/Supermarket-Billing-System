import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, ShoppingCart, Trash2, Printer } from 'lucide-react';

export default function POS() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [isGenerated, setIsGenerated] = useState(false);
  const [billMeta, setBillMeta] = useState(null);

  useEffect(() => {
    // Load products to local state for fast search
    axios.get('/api/products').then(res => setProducts(res.data)).catch(console.error);
  }, []);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || p.id.includes(search)
  ).slice(0, 5); // show top 5 matches

  const addToCart = (product) => {
    if (isGenerated) return;

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      
      // Prevent exceeding stock
      if (existing && existing.qty >= product.stock) {
        alert(`Cannot add more. Only ${product.stock} in stock.`);
        return prev;
      }
      if (!existing && product.stock <= 0) {
        alert('Item is out of stock.');
        return prev;
      }

      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      } else {
        return [...prev, { ...product, qty: 1 }];
      }
    });
    setSearch('');
  };

  const updateQty = (id, delta) => {
    if (isGenerated) return;
    setCart(prev => {
      return prev.map(item => {
        if (item.id === id) {
          const newQty = item.qty + delta;
          if (newQty <= 0) return item; // Handled by remove
          const stockRef = products.find(p => p.id === id)?.stock || 0;
          if (newQty > stockRef) {
            alert(`Cannot exceed stock limit of ${stockRef}`);
            return item;
          }
          return { ...item, qty: newQty };
        }
        return item;
      });
    });
  };

  const removeFromCart = (id) => {
    if (isGenerated) return;
    setCart(prev => prev.filter(item => item.id !== id));
  };

  // Math
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const discount = subtotal > 1000 ? subtotal * 0.10 : 0;
  const taxable = subtotal - discount;
  const tax = taxable * 0.05;
  const total = taxable + tax;

  const checkout = () => {
    if (cart.length === 0) return;
    setIsGenerated(true);
    
    const saleId = `INV-${Date.now()}`;
    const date = new Date().toISOString();
    setBillMeta({ id: saleId, date: new Date().toLocaleString() });

    const payload = {
      id: saleId,
      date,
      subtotal,
      discount,
      tax,
      total,
      items: cart
    };

    axios.post('/api/sales', payload)
      .then(() => {
        // success
        // In a real app we'd reload stock here or depend on next POS load
        axios.get('/api/products').then(res => setProducts(res.data));
      })
      .catch(err => {
        alert("Failed to process transaction");
        setIsGenerated(false);
      });
  };

  const startNew = () => {
    setCart([]);
    setIsGenerated(false);
    setBillMeta(null);
  };

  return (
    <div className="split-view">
      {/* Left Context: Search & Cart */}
      <div className="print-hide" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="card">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', top: '12px', left: '12px', color: 'var(--text-muted)' }} />
              <input 
                className="input" 
                placeholder="Search product by name or ID..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', paddingLeft: '2.5rem' }}
                disabled={isGenerated}
              />
            </div>
            {search && (
              <div style={{ border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 8px 8px', overflow: 'hidden' }}>
                {filteredProducts.map(p => (
                  <div 
                    key={p.id} 
                    onClick={() => addToCart(p)}
                    style={{ padding: '0.75rem', cursor: 'pointer', borderBottom: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', justifyContent: 'space-between' }}
                  >
                    <span>{p.name} <small className="text-muted">({p.id})</small></span>
                    <span className="text-success" style={{ fontWeight: 600 }}>₹{p.price}</span>
                  </div>
                ))}
                {filteredProducts.length === 0 && <div style={{ padding: '0.75rem', background: 'var(--surface)' }}>No products found</div>}
              </div>
            )}
          </div>
        </div>

        <div className="card" style={{ flex: 1, overflowY: 'auto' }}>
          <h2 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShoppingCart size={20}/> Current Cart
          </h2>
          <table style={{ marginTop: 0 }}>
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {cart.map(item => (
                <tr key={item.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{item.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>₹{item.price} each</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button disabled={isGenerated} onClick={() => updateQty(item.id, -1)} style={{ width: '24px', height: '24px', cursor: 'pointer' }}>-</button>
                      <span>{item.qty}</span>
                      <button disabled={isGenerated} onClick={() => updateQty(item.id, 1)} style={{ width: '24px', height: '24px', cursor: 'pointer' }}>+</button>
                    </div>
                  </td>
                  <td style={{ fontWeight: 600 }}>₹{(item.price * item.qty).toFixed(2)}</td>
                  <td>
                    <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem' }} onClick={() => removeFromCart(item.id)} disabled={isGenerated}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {cart.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Cart is empty</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right Context: Invoice */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', height: 'fit-content' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
          <h2 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>SuperBilling AI</h2>
          <p className="text-muted" style={{ fontSize: '0.875rem' }}>Store Invoice #{billMeta?.id || 'PENDING'}</p>
          <p className="text-muted" style={{ fontSize: '0.875rem' }}>{billMeta?.date}</p>
        </div>

        <div style={{ flex: 1, marginBottom: '2rem' }}>
          {cart.map(item => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              <span>{item.name} x {item.qty}</span>
              <span>₹{(item.price * item.qty).toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="text-muted">Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)' }}>
              <span>Discount (10% off)</span>
              <span>-₹{discount.toFixed(2)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span>GST (5%)</span>
            <span>+₹{tax.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>
            <span>Total Payable</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
        </div>

        <div className="print-hide" style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexDirection: 'column' }}>
          {!isGenerated ? (
            <button className="btn btn-success" style={{ width: '100%', justifyContent: 'center' }} onClick={checkout} disabled={cart.length === 0}>
              Complete Checkout
            </button>
          ) : (
            <>
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => window.print()}>
                <Printer size={18} /> Print Invoice
              </button>
              <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }} onClick={startNew}>
                Start New Bill
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
