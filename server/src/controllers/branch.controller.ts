import { prisma } from '../lib/prisma';
import { Request, Response } from 'express';

export const getBranches = async (req: Request, res: Response): Promise<void> => {
  try {
    const branches = await prisma.branch.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(branches);
  } catch (error) {
    console.error('Error fetching branches:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createBranch = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, address, phone } = req.body;
    
    if (!name) {
      res.status(400).json({ error: 'Branch name is required' });
      return;
    }
    
    const branch = await prisma.branch.create({
      data: { name, address, phone }
    });
    
    res.status(201).json(branch);
  } catch (error) {
    console.error('Error creating branch:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateBranch = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, address, phone } = req.body;
    
    const branch = await prisma.branch.update({
      where: { id: id as string },
      data: { name, address, phone }
    });
    
    res.json(branch);
  } catch (error) {
    console.error('Error updating branch:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteBranch = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.branch.delete({ where: { id: id as string } });
    res.json({ message: 'Branch deleted successfully' });
  } catch (error) {
    console.error('Error deleting branch:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
