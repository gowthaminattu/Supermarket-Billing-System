import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Edit2, AlertTriangle } from 'lucide-react';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ id: '', name: '', category: '', price: '', stock: '' });
  const [isEditing, setIsEditing] = useState(false);

  const fetchProducts = () => {
    axios.get('/api/products').then(res => setProducts(res.data)).catch(console.error);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if(isEditing) {
      axios.put(`/api/products/${form.id}`, form).then(() => {
        fetchProducts();
        resetForm();
      });
    } else {
      axios.post('/api/products', form).then(() => {
        fetchProducts();
        resetForm();
      });
    }
  };

  const resetForm = () => {
    setForm({ id: '', name: '', category: '', price: '', stock: '' });
    setIsEditing(false);
  };

  const editProduct = (p) => {
    setForm(p);
    setIsEditing(true);
  };

  const deleteProduct = (id) => {
    if(confirm('Are you sure you want to delete this product?')) {
      axios.delete(`/api/products/${id}`).then(fetchProducts);
    }
  };

  return (
    <div className="split-view">
      <div className="card">
        <h2 style={{ marginBottom: '1.5rem' }}>Inventory List</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.name}</td>
                  <td>{p.category}</td>
                  <td>₹{p.price.toFixed(2)}</td>
                  <td>
                    {p.stock <= 5 ? (
                      <span className="badge badge-danger" style={{ display: 'flex', gap: '4px', alignItems: 'center', width: 'fit-content' }}>
                        <AlertTriangle size={12}/> {p.stock} (Low)
                      </span>
                    ) : (
                      <span className="badge badge-success">{p.stock}</span>
                    )}
                  </td>
                  <td>
                    <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', marginRight: '0.5rem' }} onClick={() => editProduct(p)}>
                      <Edit2 size={14} />
                    </button>
                    <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem' }} onClick={() => deleteProduct(p.id)}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No products found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ height: 'fit-content' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>{isEditing ? 'Edit Product' : 'Add New Product'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Product ID</label>
            <input className="input" required value={form.id} onChange={e => setForm({...form, id: e.target.value})} disabled={isEditing} />
          </div>
          <div className="form-group">
            <label>Name</label>
            <input className="input" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Category</label>
            <input className="input" required value={form.category} onChange={e => setForm({...form, category: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Price (₹)</label>
            <input type="number" step="0.01" className="input" required value={form.price} onChange={e => setForm({...form, price: parseFloat(e.target.value)})} />
          </div>
          <div className="form-group">
            <label>Initial Stock</label>
            <input type="number" className="input" required value={form.stock} onChange={e => setForm({...form, stock: parseInt(e.target.value)})} />
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
              {isEditing ? 'Update Product' : 'Add Product'}
            </button>
            {isEditing && (
              <button type="button" className="btn btn-outline" onClick={resetForm}>Cancel</button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
