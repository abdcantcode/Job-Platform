import { Router } from 'express';
import authRoutes from './auth.routes.js';
import applicationRoutes from './application.routes.js';

const router = Router();

router.get('/health', (req, res) => res.json({ status: 'ok', uptime: Math.round(process.uptime()) }));
router.use('/auth', authRoutes);
router.use('/applications', applicationRoutes);

export default router;
