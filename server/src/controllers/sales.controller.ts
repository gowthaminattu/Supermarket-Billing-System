import { prisma } from '../lib/prisma';
import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';

export const createSale = async (req: AuthRequest, res: Response): Promise<void> => {
  const { customerId, couponId, items, payments, subtotal, tax, discount, total, amountPaid, change, paymentMethod } = req.body;

  if (!items || items.length === 0) {
    res.status(400).json({ error: 'No items in cart' });
    return;
  }

  try {
    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) { res.status(404).json({ error: `Product ${item.productId} not found` }); return; }
      if (product.stock < item.quantity) {
        res.status(400).json({ error: `Insufficient stock for "${product.name}". Available: ${product.stock}` });
        return;
      }
    }

    if (couponId) {
      const coupon = await prisma.coupon.findUnique({ where: { id: couponId } });
      if (!coupon || !coupon.isActive) { res.status(400).json({ error: 'Invalid or inactive coupon' }); return; }
      if (coupon.validUntil && new Date() > new Date(coupon.validUntil)) { res.status(400).json({ error: 'Coupon expired' }); return; }
      if (coupon.minPurchase && parseFloat(subtotal) < coupon.minPurchase) { res.status(400).json({ error: `Minimum purchase of ₹${coupon.minPurchase} required` }); return; }
    }

    const count = await prisma.sale.count();
    const invoiceNo = `INV-${String(count + 1).padStart(6, '0')}`;

    const sale = await prisma.$transaction(async (tx) => {
      const newSale = await tx.sale.create({
        data: {
          invoiceNo,
          subtotal: parseFloat(subtotal),
          tax: parseFloat(tax),
          discount: parseFloat(discount || 0),
          total: parseFloat(total),
          amountPaid: parseFloat(amountPaid),
          change: parseFloat(change || 0),
          paymentMethod,
          userId: req.user!.role === 'CUSTOMER' ? null : req.user!.id,
          branchId: req.user!.branchId || null,
          customerId: customerId || null,
          couponId: couponId || null,
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              quantity: parseInt(item.quantity),
              price: parseFloat(item.price),
              total: parseFloat(item.total)
            }))
          },
          payments: payments && payments.length > 0 ? {
            create: payments.map((p: any) => ({
              method: p.method,
              amount: parseFloat(p.amount)
            }))
          } : undefined
        },
        include: { items: { include: { product: true } }, customer: true, payments: true }
      });

      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: parseInt(item.quantity) } }
        });
        await tx.inventoryHistory.create({
          data: { type: 'OUT', quantity: parseInt(item.quantity), reason: `Sale ${invoiceNo}`, productId: item.productId }
        });
      }

      if (customerId) {
        const loyaltyPoints = Math.floor(parseFloat(total) / 10);
        await tx.customer.update({ where: { id: customerId }, data: { loyaltyPoints: { increment: loyaltyPoints } } });
      }

      return newSale;
    });

    let smsSent = false;
    if (customerId) {
      const customer = await prisma.customer.findUnique({ where: { id: customerId } });
      if (customer && customer.phone) {
        smsSent = true;
        console.log(`\n========================================`);
        console.log(`📱 SMS SENT TO: ${customer.phone}`);
        console.log(`Hello ${customer.name},\nThank you for shopping at ShopPOS!\nYour Bill (Invoice: ${sale.invoiceNo}) total is ₹${sale.total.toFixed(2)}.\nThank you, come again!`);
        console.log(`========================================\n`);
      }
    }

    res.status(201).json({ ...sale, smsSent });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process sale' });
  }
};

export const getSales = async (req: Request, res: Response): Promise<void> => {
  try {
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;
    const status = req.query.status as string | undefined;
    const cashierId = req.query.cashierId as string | undefined;
    const branchId = req.query.branchId as string | undefined;

    const where: any = {};
    if (from && to) where.createdAt = { gte: new Date(from), lte: new Date(to) };
    if (status) where.status = status;
    if (cashierId) where.userId = cashierId;
    if (branchId) where.branchId = branchId;
    
    // Role-based filtering: Managers/Cashiers only see their branch's sales
    if (req.user?.role !== 'ADMIN' && req.user?.branchId) {
      where.branchId = req.user.branchId;
    }

    const sales = await prisma.sale.findMany({
      where,
      include: {
        items: { include: { product: { select: { name: true, sku: true } } } },
        customer: { select: { name: true, phone: true } },
        user: { select: { name: true } },
        payments: true
      },
      orderBy: { createdAt: 'desc' },
      take: 200
    });
    res.json(sales);
  } catch {
    res.status(500).json({ error: 'Failed to fetch sales' });
  }
};

export const getSale = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  try {
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        customer: true,
        user: { select: { name: true } },
        payments: true
      }
    });
    if (!sale) { res.status(404).json({ error: 'Sale not found' }); return; }
    res.json(sale);
  } catch {
    res.status(500).json({ error: 'Failed to fetch sale' });
  }
};

export const refundSale = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;
  try {
    const sale = await prisma.sale.findUnique({ where: { id }, include: { items: true } });
    if (!sale) { res.status(404).json({ error: 'Sale not found' }); return; }
    if (sale.status === 'REFUNDED') { res.status(400).json({ error: 'Sale already refunded' }); return; }

    await prisma.$transaction(async (tx) => {
      await tx.sale.update({ where: { id }, data: { status: 'REFUNDED' } });
      for (const item of sale.items) {
        await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
        await tx.inventoryHistory.create({
          data: { type: 'RETURN', quantity: item.quantity, reason: `Refund of ${sale.invoiceNo}`, productId: item.productId }
        });
      }
    });

    await prisma.auditLog.create({ data: { action: 'REFUND_SALE', details: `Refunded invoice: ${sale.invoiceNo}`, userId: req.user?.id } });
    res.json({ message: 'Sale refunded successfully' });
  } catch {
    res.status(500).json({ error: 'Failed to refund sale' });
  }
};

export const holdSale = async (req: AuthRequest, res: Response): Promise<void> => {
  const { customerId, items, subtotal, tax, discount, total, paymentMethod } = req.body;
  try {
    const count = await prisma.sale.count();
    const invoiceNo = `HELD-${String(count + 1).padStart(6, '0')}`;
    const held = await prisma.sale.create({
      data: {
        invoiceNo,
        subtotal: parseFloat(subtotal || 0),
        tax: parseFloat(tax || 0),
        discount: parseFloat(discount || 0),
        total: parseFloat(total || 0),
        amountPaid: 0,
        change: 0,
        status: 'HELD',
        paymentMethod: paymentMethod || 'CASH',
        userId: req.user!.role === 'CUSTOMER' ? null : req.user!.id,
        branchId: req.user!.branchId || null,
        customerId: customerId || null,
        items: { create: items.map((item: any) => ({ productId: item.productId, quantity: item.quantity, price: item.price, total: item.total })) }
      },
      include: { items: { include: { product: true } } }
    });
    res.status(201).json(held);
  } catch {
    res.status(500).json({ error: 'Failed to hold bill' });
  }
};

export const getHeldSales = async (req: AuthRequest, res: Response): Promise<void> => {
  const held = await prisma.sale.findMany({
    where: { status: 'HELD' },
    include: { items: { include: { product: { select: { name: true } } } }, customer: { select: { name: true } } },
    orderBy: { createdAt: 'desc' }
  });
  res.json(held);
};

export const deleteHeldSale = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  await prisma.saleItem.deleteMany({ where: { saleId: id } });
  await prisma.sale.delete({ where: { id } });
  res.json({ message: 'Held bill deleted' });
};

export const sendReceipt = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }
  
  // Mock sending email
  console.log(`[EMAIL] Sending receipt for Sale ${id} to ${email}...`);
  // In a real app, integrate SendGrid/NodeMailer here
  
  res.json({ message: 'Receipt sent successfully to ' + email });
};
