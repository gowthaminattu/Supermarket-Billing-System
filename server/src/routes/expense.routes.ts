import { Router } from 'express';
import { getExpenses, createExpense, deleteExpense } from '../controllers/expense.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// Apply auth middleware to all routes
router.use(authenticate);

router.get('/', getExpenses);
router.post('/', createExpense);
router.delete('/:id', requireRole('ADMIN', 'MANAGER'), deleteExpense);

export default router;
