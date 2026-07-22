import { Router } from 'express';
import { login, register, registerCustomer, loginCustomer, getUsers, createUser, updateUser, deleteUser } from '../controllers/auth.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();
router.post('/login', login);
router.post('/register', register);
router.post('/customer/login', loginCustomer);
router.post('/customer/register', registerCustomer);
router.get('/users', authenticate, requireRole('ADMIN'), getUsers);
router.post('/users', authenticate, requireRole('ADMIN'), createUser);
router.put('/users/:id', authenticate, requireRole('ADMIN'), updateUser);
router.delete('/users/:id', authenticate, requireRole('ADMIN'), deleteUser);

export default router;
