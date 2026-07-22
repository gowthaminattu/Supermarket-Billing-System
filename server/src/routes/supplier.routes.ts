import { Router } from 'express';
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../controllers/supplier.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getSuppliers);
router.post('/', authenticate, requireRole('ADMIN', 'MANAGER'), createSupplier);
router.put('/:id', authenticate, requireRole('ADMIN', 'MANAGER'), updateSupplier);
router.delete('/:id', authenticate, requireRole('ADMIN'), deleteSupplier);

export default router;
