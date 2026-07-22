import { Router } from 'express';
import { getProducts, getProduct, createProduct, updateProduct, deleteProduct, getLowStock, getInventoryHistory, getCategories, createCategory } from '../controllers/product.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getProducts);
router.get('/low-stock', authenticate, getLowStock);
router.get('/categories', authenticate, getCategories);
router.post('/categories', authenticate, requireRole('ADMIN', 'MANAGER'), createCategory);
router.get('/:id', authenticate, getProduct);
router.get('/:id/history', authenticate, getInventoryHistory);
router.post('/', authenticate, requireRole('ADMIN', 'MANAGER'), createProduct);
router.put('/:id', authenticate, requireRole('ADMIN', 'MANAGER'), updateProduct);
router.delete('/:id', authenticate, requireRole('ADMIN'), deleteProduct);

export default router;
