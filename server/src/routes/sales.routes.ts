import { Router } from 'express';
import { createSale, getSales, getSale, refundSale, holdSale, getHeldSales, deleteHeldSale, sendReceipt } from '../controllers/sales.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getSales);
router.get('/held', authenticate, getHeldSales);
router.get('/:id', authenticate, getSale);
router.post('/', authenticate, createSale);
router.post('/hold', authenticate, holdSale);
router.post('/:id/refund', authenticate, requireRole('ADMIN', 'MANAGER'), refundSale);
router.post('/:id/receipt', authenticate, sendReceipt);
router.delete('/held/:id', authenticate, deleteHeldSale);

export default router;
