import { prisma } from '../lib/prisma';
import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';

export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const search = req.query.search as string | undefined;
    const category = req.query.category as string | undefined;
    const lowStock = req.query.lowStock as string | undefined;

    const where: any = {};
    if (search) where.name = { contains: search };
    if (category) where.categoryId = category;

    const products = await prisma.product.findMany({
      where,
      include: { category: true, supplier: true },
      orderBy: { name: 'asc' }
    });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

export const getProduct = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true, supplier: true }
    });
    if (!product) { res.status(404).json({ error: 'Product not found' }); return; }
    res.json(product);
  } catch {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
};

export const createProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  const { sku, name, description, price, costPrice, stock, minStock, categoryId, supplierId, barcode } = req.body;
  try {
    const product = await prisma.product.create({
      data: { sku, name, description, price: parseFloat(price), costPrice: parseFloat(costPrice), stock: parseInt(stock), minStock: parseInt(minStock || 10), categoryId, supplierId: supplierId || null, barcode: barcode || null },
      include: { category: true, supplier: true }
    });
    await prisma.auditLog.create({ data: { action: 'CREATE_PRODUCT', details: `Created product: ${name}`, userId: req.user?.id } });
    await prisma.inventoryHistory.create({ data: { type: 'IN', quantity: parseInt(stock), reason: 'Initial stock', productId: product.id } });
    res.status(201).json(product);
  } catch (err: any) {
    if (err.code === 'P2002') res.status(400).json({ error: 'SKU or barcode already exists' });
    else res.status(500).json({ error: 'Failed to create product' });
  }
};

export const updateProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const { sku, name, description, price, costPrice, stock, minStock, categoryId, supplierId, barcode } = req.body;
  try {
    const old = await prisma.product.findUnique({ where: { id } });
    const product = await prisma.product.update({
      where: { id },
      data: { sku, name, description, price: parseFloat(price), costPrice: parseFloat(costPrice), stock: parseInt(stock), minStock: parseInt(minStock || 10), categoryId, supplierId: supplierId || null, barcode: barcode || null },
      include: { category: true, supplier: true }
    });
    if (old && old.stock !== parseInt(stock)) {
      const diff = parseInt(stock) - old.stock;
      await prisma.inventoryHistory.create({ data: { type: 'ADJUSTMENT', quantity: diff, reason: 'Manual stock adjustment', productId: id } });
    }
    await prisma.auditLog.create({ data: { action: 'UPDATE_PRODUCT', details: `Updated product: ${name}`, userId: req.user?.id } });
    res.json(product);
  } catch (err: any) {
    if (err.code === 'P2002') res.status(400).json({ error: 'SKU or barcode already exists' });
    else res.status(500).json({ error: 'Failed to update product' });
  }
};

export const deleteProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;
  try {
    await prisma.product.delete({ where: { id } });
    await prisma.auditLog.create({ data: { action: 'DELETE_PRODUCT', details: `Deleted product id: ${id}`, userId: req.user?.id } });
    res.json({ message: 'Product deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete product' });
  }
};

export const getLowStock = async (req: Request, res: Response): Promise<void> => {
  try {
    const products = await prisma.$queryRaw`
      SELECT p.*, c.name as categoryName FROM Product p
      LEFT JOIN Category c ON p.categoryId = c.id
      WHERE p.stock <= p.minStock
      ORDER BY p.stock ASC
    `;
    res.json(products);
  } catch {
    res.status(500).json({ error: 'Failed to fetch low stock products' });
  }
};

export const getInventoryHistory = async (req: Request, res: Response): Promise<void> => {
  const productId = req.params.id as string;
  try {
    const history = await prisma.inventoryHistory.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(history);
  } catch {
    res.status(500).json({ error: 'Failed to fetch inventory history' });
  }
};

export const getCategories = async (req: Request, res: Response): Promise<void> => {
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
  res.json(categories);
};

export const createCategory = async (req: Request, res: Response): Promise<void> => {
  const { name, description } = req.body;
  try {
    const cat = await prisma.category.create({ data: { name, description } });
    res.status(201).json(cat);
  } catch (err: any) {
    if (err.code === 'P2002') res.status(400).json({ error: 'Category already exists' });
    else res.status(500).json({ error: 'Failed to create category' });
  }
};
