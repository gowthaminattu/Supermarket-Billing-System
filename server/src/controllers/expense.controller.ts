import { prisma } from '../lib/prisma';
import { Request, Response } from 'express';

export const getExpenses = async (req: Request, res: Response): Promise<void> => {
  try {
    const { branchId, startDate, endDate } = req.query;
    
    let whereClause: any = {};
    if (branchId) whereClause.branchId = branchId;
    
    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) whereClause.date.gte = new Date(startDate as string);
      if (endDate) whereClause.date.lte = new Date(endDate as string);
    }
    
    const expenses = await prisma.expense.findMany({
      where: whereClause,
      include: {
        user: { select: { name: true } },
        branch: { select: { name: true } }
      },
      orderBy: { date: 'desc' }
    });
    
    res.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createExpense = async (req: Request, res: Response): Promise<void> => {
  try {
    const { amount, description, category, branchId } = req.body;
    
    // Auth middleware ensures req.user is set
    const userId = (req as any).user.id;
    
    const expense = await prisma.expense.create({
      data: {
        amount: parseFloat(amount),
        description,
        category,
        branchId,
        userId
      }
    });
    
    res.status(201).json(expense);
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteExpense = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.expense.delete({ where: { id } });
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
