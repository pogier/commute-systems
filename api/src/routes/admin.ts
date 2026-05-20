import { Router, Request, Response } from 'express';
import { pgPool } from '../config/db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';

const router = Router();

router.get('/users', authMiddleware as any, requireRole('admin') as any, async (_req: Request, res: Response) => {
  try {
    const result = await pgPool.query('SELECT id, name, email, role, phone, created_at FROM users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/users/:id/role', authMiddleware as any, requireRole('admin') as any, async (req: Request, res: Response) => {
  const { role } = req.body;
  try {
    const result = await pgPool.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role',
      [role, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/users/:id/active', authMiddleware as any, requireRole('admin') as any, async (req: Request, res: Response) => {
  const { active } = req.body;
  try {
    const result = await pgPool.query(
      'UPDATE users SET active = $1 WHERE id = $2 RETURNING id, name, email, active',
      [active, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;