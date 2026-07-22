import { prisma } from '../lib/prisma';
import { Request, Response } from 'express';

export const getDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [
      todaySales,
      totalOrders,
      totalCustomers,
      totalProducts,
      lowStockItems,
      recentSales,
      topProducts,
      salesByPayment,
      weeklySales,
      todayExpenses,
      staffPerformance
    ] = await Promise.all([
      prisma.sale.aggregate({
        where: { createdAt: { gte: today, lte: todayEnd }, status: 'COMPLETED' },
        _sum: { total: true },
        _count: { id: true }
      }),
      prisma.sale.count({ where: { status: 'COMPLETED' } }),
      prisma.customer.count(),
      prisma.product.count(),
      prisma.$queryRaw<{ count: number }[]>`SELECT COUNT(*) as count FROM Product WHERE stock <= minStock`,
      prisma.sale.findMany({
        where: { status: 'COMPLETED' },
        include: { customer: { select: { name: true } }, user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),
      prisma.saleItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true, total: true },
        orderBy: { _sum: { total: 'desc' } },
        take: 5
      }),
      prisma.sale.groupBy({
        by: ['paymentMethod'],
        _count: { id: true },
        _sum: { total: true },
        where: { status: 'COMPLETED' }
      }),
      // Last 7 days sales
      prisma.$queryRaw<{ date: string; revenue: number; orders: number }[]>`
        SELECT date(createdAt) as date, SUM(total) as revenue, COUNT(*) as orders
        FROM Sale
        WHERE status = 'COMPLETED' AND createdAt >= date('now', '-7 days')
        GROUP BY date(createdAt)
        ORDER BY date ASC
      `,
      prisma.expense.aggregate({
        where: { date: { gte: today, lte: todayEnd } },
        _sum: { amount: true }
      }),
      prisma.sale.groupBy({
        by: ['userId'],
        _count: { id: true },
        _sum: { total: true },
        where: { status: 'COMPLETED' },
        orderBy: { _sum: { total: 'desc' } },
        take: 5
      })
    ]);

    // Enrich top products with product details
    const topProductsEnriched = await Promise.all(
      topProducts.map(async (item) => {
        const product = await prisma.product.findUnique({ where: { id: item.productId }, select: { name: true, sku: true } });
        return { ...item, product };
      })
    );

    // Enrich staff performance with user details
    const staffPerformanceEnriched = await Promise.all(
      staffPerformance.map(async (item) => {
        let user = null;
        if (item.userId) {
          user = await prisma.user.findUnique({ where: { id: item.userId }, select: { name: true, role: true, branchId: true } });
        } else {
          user = { name: 'Self-Checkout', role: 'CUSTOMER', branchId: null };
        }
        return { ...item, user };
      })
    );

    // Compute total inventory value
    const inventoryValue = await prisma.$queryRaw<{ value: number }[]>`
      SELECT SUM(price * stock) as value FROM Product
    `;

    res.json({
      today: {
        revenue: todaySales._sum.total || 0,
        orders: todaySales._count.id || 0,
        expenses: todayExpenses._sum.amount || 0,
        netProfit: (todaySales._sum.total || 0) - (todayExpenses._sum.amount || 0)
      },
      totals: {
        orders: totalOrders,
        customers: totalCustomers,
        products: totalProducts,
        lowStock: Number((lowStockItems[0] as any)?.count || 0),
        inventoryValue: Number((inventoryValue[0] as any)?.value || 0)
      },
      recentSales,
      topProducts: topProductsEnriched,
      salesByPayment,
      weeklySales,
      staffPerformance: staffPerformanceEnriched
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
};

export const getRevenueChart = async (req: Request, res: Response): Promise<void> => {
  const { period } = req.query;
  let groupBy = "date(createdAt)";
  let range = "-30 days";

  if (period === 'weekly') { groupBy = "strftime('%Y-%W', createdAt)"; range = "-12 weeks"; }
  else if (period === 'monthly') { groupBy = "strftime('%Y-%m', createdAt)"; range = "-12 months"; }
  else if (period === 'yearly') { groupBy = "strftime('%Y', createdAt)"; range = "-5 years"; }

  try {
    const data = await prisma.$queryRawUnsafe<any[]>(`
      SELECT ${groupBy} as label, SUM(total) as revenue, COUNT(*) as orders
      FROM Sale
      WHERE status = 'COMPLETED' AND createdAt >= date('now', '${range}')
      GROUP BY ${groupBy}
      ORDER BY label ASC
    `);
    res.json(data);
  } catch {
    res.status(500).json({ error: 'Failed to fetch revenue chart' });
  }
};

export const getSalesReport = async (req: Request, res: Response): Promise<void> => {
  const { from, to } = req.query;
  try {
    const where: any = { status: 'COMPLETED' };
    if (from && to) where.createdAt = { gte: new Date(from as string), lte: new Date(to as string) };

    const [sales, aggregate] = await Promise.all([
      prisma.sale.findMany({
        where,
        include: {
          items: { include: { product: { select: { name: true, costPrice: true } } } },
          customer: { select: { name: true } },
          user: { select: { name: true } },
          payments: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.sale.aggregate({ where, _sum: { total: true, discount: true, tax: true }, _count: { id: true } })
    ]);

    // Calculate profit
    let totalProfit = 0;
    for (const sale of sales) {
      for (const item of sale.items) {
        const profit = (item.price - (item.product as any).costPrice) * item.quantity;
        totalProfit += profit;
      }
    }

    res.json({ sales, summary: { ...aggregate, totalProfit } });
  } catch {
    res.status(500).json({ error: 'Failed to generate report' });
  }
};

export const getAuditLogs = async (req: Request, res: Response): Promise<void> => {
  const logs = await prisma.auditLog.findMany({
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 200
  });
  res.json(logs);
};

// Coupons
export const getCoupons = async (req: Request, res: Response): Promise<void> => {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(coupons);
};

export const createCoupon = async (req: Request, res: Response): Promise<void> => {
  const { code, discountType, discountValue, minPurchase, maxDiscount, validFrom, validUntil } = req.body;
  try {
    const coupon = await prisma.coupon.create({
      data: { code: code.toUpperCase(), discountType, discountValue: parseFloat(discountValue), minPurchase: minPurchase ? parseFloat(minPurchase) : null, maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null, validFrom: validFrom ? new Date(validFrom) : null, validUntil: validUntil ? new Date(validUntil) : null }
    });
    res.status(201).json(coupon);
  } catch (err: any) {
    if (err.code === 'P2002') res.status(400).json({ error: 'Coupon code already exists' });
    else res.status(500).json({ error: 'Failed to create coupon' });
  }
};

export const validateCoupon = async (req: Request, res: Response): Promise<void> => {
  const { code, subtotal } = req.body;
  try {
    const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
    if (!coupon || !coupon.isActive) { res.status(404).json({ error: 'Invalid or expired coupon' }); return; }
    if (coupon.validUntil && new Date() > coupon.validUntil) { res.status(400).json({ error: 'Coupon has expired' }); return; }
    if (coupon.minPurchase && parseFloat(subtotal) < coupon.minPurchase) { res.status(400).json({ error: `Minimum purchase of ₹${coupon.minPurchase} required` }); return; }

    let discountAmount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discountAmount = (parseFloat(subtotal) * coupon.discountValue) / 100;
      if (coupon.maxDiscount) discountAmount = Math.min(discountAmount, coupon.maxDiscount);
    } else {
      discountAmount = coupon.discountValue;
    }

    res.json({ coupon, discountAmount });
  } catch {
    res.status(500).json({ error: 'Failed to validate coupon' });
  }
};
