import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { prisma } from './lib/prisma';
import bcrypt from 'bcryptjs';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import salesRoutes from './routes/sales.routes';
import customerRoutes from './routes/customer.routes';
import supplierRoutes from './routes/supplier.routes';
import reportsRoutes from './routes/reports.routes';
import expenseRoutes from './routes/expense.routes';
import branchRoutes from './routes/branch.routes';

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/branches', branchRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong' });
});

// Auto-seed on startup (handles Render's ephemeral SQLite disk)
async function seedIfEmpty() {
  try {
    console.log('🌱 Checking database seed status...');

    // Seed Branch
    const mainBranch = await prisma.branch.upsert({
      where: { id: 'default-branch' },
      update: {},
      create: { id: 'default-branch', name: 'Main Branch', address: '123 Main St, City', phone: '1800-123-456' }
    });

    // Seed Admin user
    const adminExists = await prisma.user.findFirst({ where: { email: 'admin@pos.com' } });
    if (!adminExists) {
      await prisma.user.create({
        data: {
          name: 'Admin',
          email: 'admin@pos.com',
          password: await bcrypt.hash('admin123', 10),
          role: 'ADMIN',
          branchId: mainBranch.id
        }
      });
      console.log('✅ Admin user seeded (admin@pos.com / admin123)');
    }

    // Seed Cashier
    const cashierExists = await prisma.user.findFirst({ where: { email: 'cashier@pos.com' } });
    if (!cashierExists) {
      await prisma.user.create({
        data: { name: 'Cashier 1', email: 'cashier@pos.com', password: await bcrypt.hash('cashier123', 10), role: 'CASHIER', branchId: mainBranch.id }
      });
      console.log('✅ Cashier user seeded (cashier@pos.com / cashier123)');
    }

    // Seed Categories
    const categoryNames = ['Produce', 'Dairy', 'Bakery', 'Snacks', 'Beverages', 'Pantry', 'Personal Care'];
    const categories: Record<string, string> = {};
    for (const name of categoryNames) {
      const cat = await prisma.category.upsert({ where: { name }, update: {}, create: { name } });
      categories[name] = cat.id;
    }

    // Seed Supplier
    const supplier = await prisma.supplier.upsert({
      where: { id: 'default-supplier' },
      update: {},
      create: { id: 'default-supplier', name: 'Fresh Supplies Co.', contact: '9876543210', email: 'supply@fresh.com', address: '123 Market Street, Mumbai' }
    });

    // Seed Products
    const products = [
      { sku: 'PRD-1001', name: 'Organic Apples', price: 120, costPrice: 80, stock: 50, minStock: 10, categoryId: categories['Produce'], barcode: '8901234567890' },
      { sku: 'PRD-1002', name: 'Whole Wheat Bread', price: 45, costPrice: 28, stock: 30, minStock: 5, categoryId: categories['Bakery'], barcode: '8901234567891' },
      { sku: 'PRD-1003', name: 'Amul Milk 1L', price: 68, costPrice: 55, stock: 80, minStock: 20, categoryId: categories['Dairy'], barcode: '8901234567892' },
      { sku: 'PRD-1004', name: 'Tata Salt 1kg', price: 28, costPrice: 18, stock: 200, minStock: 30, categoryId: categories['Pantry'], barcode: '8901234567893' },
      { sku: 'PRD-1005', name: 'Maggi Noodles', price: 14, costPrice: 9, stock: 4, minStock: 10, categoryId: categories['Snacks'], barcode: '8901234567894' },
      { sku: 'PRD-1006', name: 'Tropicana Orange Juice', price: 99, costPrice: 72, stock: 24, minStock: 8, categoryId: categories['Beverages'], barcode: '8901234567895' },
      { sku: 'PRD-1007', name: "Lay's Chips Classic", price: 20, costPrice: 13, stock: 60, minStock: 15, categoryId: categories['Snacks'], barcode: '8901234567896' },
      { sku: 'PRD-1008', name: 'Dove Soap 100g', price: 55, costPrice: 38, stock: 45, minStock: 10, categoryId: categories['Personal Care'], barcode: '8901234567897' },
    ];
    for (const product of products) {
      await prisma.product.upsert({ where: { sku: product.sku }, update: {}, create: { ...product, supplierId: supplier.id } });
    }

    // Seed Coupons
    await prisma.coupon.upsert({ where: { code: 'SAVE10' }, update: {}, create: { code: 'SAVE10', discountType: 'PERCENTAGE', discountValue: 10, minPurchase: 100, isActive: true } });
    await prisma.coupon.upsert({ where: { code: 'FLAT50' }, update: {}, create: { code: 'FLAT50', discountType: 'FLAT', discountValue: 50, minPurchase: 300, isActive: true } });

    // Seed Walk-in Customer
    await prisma.customer.upsert({ where: { phone: '9999999999' }, update: {}, create: { name: 'Walk-in Customer', phone: '9999999999', loyaltyId: 'LOYAL-001' } });

    console.log('🚀 Database ready! Admin: admin@pos.com / admin123 | Cashier: cashier@pos.com / cashier123');
  } catch (err) {
    console.error('❌ Seed error:', err);
  }
}

app.listen(port, async () => {
  console.log(`✅ Server running at http://localhost:${port}`);
  await seedIfEmpty();
});

export default app;
