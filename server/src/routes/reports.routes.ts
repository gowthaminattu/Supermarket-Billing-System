import { Router } from 'express';
import { getDashboard, getRevenueChart, getSalesReport, getAuditLogs, getCoupons, createCoupon, validateCoupon } from '../controllers/reports.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.get('/dashboard', authenticate, getDashboard);
router.get('/revenue-chart', authenticate, requireRole('ADMIN', 'MANAGER'), getRevenueChart);
router.get('/sales-report', authenticate, requireRole('ADMIN', 'MANAGER'), getSalesReport);
router.get('/audit-logs', authenticate, requireRole('ADMIN'), getAuditLogs);
router.get('/coupons', authenticate, getCoupons);
router.post('/coupons', authenticate, requireRole('ADMIN', 'MANAGER'), createCoupon);
router.post('/coupons/validate', authenticate, validateCoupon);

export default router;
