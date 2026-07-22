import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, phone, password } = req.body;
  if ((!email && !phone) || !password) {
    res.status(400).json({ error: 'Phone/Email and password are required' });
    return;
  }
  try {
    const user = phone 
      ? await prisma.user.findUnique({ where: { phone } })
      : await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name, branchId: user.branchId },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '8h' }
    );
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, branchId: user.branchId } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const register = async (req: Request, res: Response): Promise<void> => {
  const { name, phone, password } = req.body;
  if (!name || !phone || !password) {
    res.status(400).json({ error: 'Name, phone, and password are required' });
    return;
  }
  try {
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { 
        name, 
        phone, 
        email: `${phone}@pos.local`, 
        password: hashed, 
        role: 'CASHIER' 
      },
      select: { id: true, name: true, phone: true, role: true, branchId: true }
    });
    
    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name, branchId: null },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '8h' }
    );
    res.status(201).json({ token, user });
  } catch (err: any) {
    if (err.code === 'P2002') res.status(400).json({ error: 'Phone number already registered' });
    else res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true, branchId: true, branch: { select: { name: true } } }
  });
  res.json(users);
};

export const registerCustomer = async (req: Request, res: Response): Promise<void> => {
  const { name, phone, password } = req.body;
  if (!name || !phone || !password) {
    res.status(400).json({ error: 'Name, phone, and password are required' });
    return;
  }
  try {
    const hashed = await bcrypt.hash(password, 10);
    const customer = await prisma.customer.create({
      data: { name, phone, password: hashed },
      select: { id: true, name: true, phone: true }
    });
    
    const token = jwt.sign(
      { id: customer.id, role: 'CUSTOMER', name: customer.name },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '8h' }
    );
    res.status(201).json({ token, user: { ...customer, role: 'CUSTOMER' } });
  } catch (err: any) {
    if (err.code === 'P2002') res.status(400).json({ error: 'Phone number already registered' });
    else res.status(500).json({ error: 'Internal server error' });
  }
};

export const loginCustomer = async (req: Request, res: Response): Promise<void> => {
  const { phone, password } = req.body;
  if (!phone || !password) {
    res.status(400).json({ error: 'Phone and password are required' });
    return;
  }
  try {
    const customer = await prisma.customer.findUnique({ where: { phone } });
    if (!customer || !customer.password || !(await bcrypt.compare(password, customer.password))) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    const token = jwt.sign(
      { id: customer.id, role: 'CUSTOMER', name: customer.name },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '8h' }
    );
    res.json({ token, user: { id: customer.id, name: customer.name, phone: customer.phone, role: 'CUSTOMER' } });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password, role, branchId } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role: role || 'CASHIER', branchId },
      select: { id: true, name: true, email: true, role: true, branchId: true }
    });
    res.status(201).json(user);
  } catch (err: any) {
    if (err.code === 'P2002') res.status(400).json({ error: 'Email already exists' });
    else res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const { name, email, role, password, branchId } = req.body;
  try {
    const data: any = { name, email, role };
    if (password) data.password = await bcrypt.hash(password, 10);
    if (branchId !== undefined) data.branchId = branchId;
    
    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, role: true, branchId: true }
    });
    res.json(user);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  await prisma.user.delete({ where: { id } });
  res.json({ message: 'User deleted' });
};
