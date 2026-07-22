const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// === PRODUCT API ===

// Get all products
app.get('/api/products', (req, res) => {
  db.all('SELECT * FROM products', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Add a product
app.post('/api/products', (req, res) => {
  const { id, name, category, price, stock } = req.body;
  if (!id || !name || !price || stock === undefined) {
     return res.status(400).json({ error: 'Missing required fields' });
  }

  db.run(
    'INSERT INTO products (id, name, category, price, stock) VALUES (?, ?, ?, ?, ?)',
    [id, name, category, price, stock],
    function(err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ message: 'Product added successfully' });
    }
  );
});

// Update product
app.put('/api/products/:id', (req, res) => {
  const { name, category, price, stock } = req.body;
  db.run(
    'UPDATE products SET name = ?, category = ?, price = ?, stock = ? WHERE id = ?',
    [name, category, price, stock, req.params.id],
    function(err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ message: 'Product updated successfully' });
    }
  );
});

// Delete a product
app.delete('/api/products/:id', (req, res) => {
  db.run('DELETE FROM products WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ message: 'Product deleted' });
  });
});

// === SALES / POS API ===

// Process Sale Transaction
app.post('/api/sales', (req, res) => {
  const { id, date, subtotal, discount, tax, total, items } = req.body;
  
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    // Insert Sale
    db.run(
      'INSERT INTO sales (id, date, subtotal, discount, tax, total) VALUES (?, ?, ?, ?, ?, ?)',
      [id, date, subtotal, discount, tax, total],
      function(err) {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: 'Failed to record sale' });
        }
      }
    );

    const stmtSales = db.prepare('INSERT INTO sale_items (sale_id, product_id, name, price, qty) VALUES (?, ?, ?, ?, ?)');
    const stmtUpdateStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');
    
    let hasError = false;

    items.forEach(item => {
      stmtSales.run(id, item.id, item.name, item.price, item.qty, (err) => {
        if (err) hasError = true;
      });
      stmtUpdateStock.run(item.qty, item.id, (err) => {
        if (err) hasError = true;
      });
    });

    stmtSales.finalize();
    stmtUpdateStock.finalize((err) => {
      if (hasError) {
        db.run('ROLLBACK');
        res.status(500).json({ error: 'Failed to process sale items' });
      } else {
        db.run('COMMIT');
        res.json({ message: 'Transaction successful' });
      }
    });
  });
});

// Get Analytics / Reports (Recent Sales)
app.get('/api/reports', (req, res) => {
  db.all('SELECT * FROM sales ORDER BY date DESC LIMIT 100', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Get Analytics / Dashboard Metrics
app.get('/api/dashboard', (req, res) => {
   // get total revenue, total sales, items sold
   db.get('SELECT COUNT(*) as totalOrders, SUM(total) as totalRevenue FROM sales', [], (err, salesRow) => {
       if (err) return res.status(500).json({ error: err.message });
       
       db.get('SELECT COUNT(*) as totalProducts FROM products', [], (err, productsRow) => {
           res.json({
               totalOrders: salesRow.totalOrders || 0,
               totalRevenue: salesRow.totalRevenue || 0,
               totalProducts: productsRow.totalProducts || 0
           });
       });
   });
});

app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});
