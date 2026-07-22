import { prisma } from '../lib/prisma';
import { Request, Response } from 'express';

export const getSuppliers = async (req: Request, res: Response): Promise<void> => {
  const suppliers = await prisma.supplier.findMany({ orderBy: { name: 'asc' } });
  res.json(suppliers);
};

export const createSupplier = async (req: Request, res: Response): Promise<void> => {
  const { name, contact, email, address } = req.body;
  const supplier = await prisma.supplier.create({ data: { name, contact, email, address } });
  res.status(201).json(supplier);
};

export const updateSupplier = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const { name, contact, email, address } = req.body;
  const supplier = await prisma.supplier.update({ where: { id }, data: { name, contact, email, address } });
  res.json(supplier);
};

export const deleteSupplier = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  await prisma.supplier.delete({ where: { id } });
  res.json({ message: 'Supplier deleted' });
};
