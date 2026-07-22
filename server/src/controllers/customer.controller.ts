import { prisma } from '../lib/prisma';
import { Request, Response } from 'express';

export const getCustomers = async (req: Request, res: Response): Promise<void> => {
  const search = req.query.search as string | undefined;
  const where = search ? { OR: [{ name: { contains: search } }, { phone: { contains: search } }, { email: { contains: search } }] } : {};
  const customers = await prisma.customer.findMany({ where, orderBy: { name: 'asc' } });
  res.json(customers);
};

export const getCustomer = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: { sales: { orderBy: { createdAt: 'desc' }, take: 20, include: { items: { include: { product: { select: { name: true } } } } } } }
  });
  if (!customer) { res.status(404).json({ error: 'Customer not found' }); return; }
  res.json(customer);
};

export const createCustomer = async (req: Request, res: Response): Promise<void> => {
  const { name, phone, email, loyaltyId, gstNumber } = req.body;
  try {
    const customer = await prisma.customer.create({ data: { name, phone: phone || null, email: email || null, loyaltyId: loyaltyId || null, gstNumber: gstNumber || null } });
    res.status(201).json(customer);
  } catch (err: any) {
    if (err.code === 'P2002') res.status(400).json({ error: 'Customer with this phone/email already exists' });
    else res.status(500).json({ error: 'Failed to create customer' });
  }
};

export const updateCustomer = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const { name, phone, email, loyaltyId, gstNumber } = req.body;
  try {
    const customer = await prisma.customer.update({ where: { id }, data: { name, phone: phone || null, email: email || null, loyaltyId: loyaltyId || null, gstNumber: gstNumber || null } });
    res.json(customer);
  } catch (err: any) {
    if (err.code === 'P2002') res.status(400).json({ error: 'Phone or email already in use' });
    else res.status(500).json({ error: 'Failed to update customer' });
  }
};

export const deleteCustomer = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  try {
    await prisma.customer.delete({ where: { id } });
    res.json({ message: 'Customer deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete customer' });
  }
};
