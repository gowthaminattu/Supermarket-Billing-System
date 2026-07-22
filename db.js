const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'supermarket.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    
    // Create tables if they don't exist
    db.serialize(() => {
      // Products Table
      db.run(`
        CREATE TABLE IF NOT EXISTS products (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          category TEXT,
          price REAL NOT NULL,
          stock INTEGER NOT NULL
        )
      `);

      // Invoices/Sales Table
      db.run(`
        CREATE TABLE IF NOT EXISTS sales (
          id TEXT PRIMARY KEY,
          date TEXT NOT NULL,
          subtotal REAL,
          discount REAL,
          tax REAL,
          total REAL
        )
      `);

      // Sale Items Table
      db.run(`
        CREATE TABLE IF NOT EXISTS sale_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          sale_id TEXT,
          product_id TEXT,
          name TEXT,
          price REAL,
          qty INTEGER,
          FOREIGN KEY (sale_id) REFERENCES sales (id)
        )
      `);

      // Seed Dummy Products if empty
      db.get('SELECT COUNT(*) as count FROM products', (err, row) => {
        if (row && row.count === 0) {
          const stmt = db.prepare('INSERT INTO products VALUES (?, ?, ?, ?, ?)');
          stmt.run('1001', 'Organic Apples', 'Produce', 120, 50);
          stmt.run('1002', 'Whole Wheat Bread', 'Bakery', 45, 20);
          stmt.run('1003', 'Amul Milk 1L', 'Dairy', 60, 100);
          stmt.run('1004', 'Tata Salt 1kg', 'Pantry', 25, 200);
          stmt.run('1005', 'Maggi Noodles', 'Snacks', 60, 4); // Low stock example
          stmt.finalize();
          console.log('Database seeded with sample products.');
        }
      });
    });
  }
});

module.exports = db;
