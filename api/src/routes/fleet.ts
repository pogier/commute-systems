import { Router, Request, Response } from 'express';
import { pgPool } from '../config/db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';

const router = Router();

router.get('/vehicles', async (_req: Request, res: Response) => {
  try {
    const result = await pgPool.query(
      `SELECT v.*, u.name as driver_name
       FROM vehicles v LEFT JOIN users u ON v.driver_id = u.id
       ORDER BY v.id`
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/vehicles', authMiddleware as any, requireRole('admin') as any, async (req: Request, res: Response) => {
  const { plate_number, model, capacity, driver_id } = req.body;
  try {
    const result = await pgPool.query(
      `INSERT INTO vehicles (plate_number, model, capacity, driver_id)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [plate_number, model, capacity, driver_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/vehicles/:id/status', authMiddleware as any, async (req: Request, res: Response) => {
  const { status, latitude, longitude, speed, bearing } = req.body;
  try {
    const result = await pgPool.query(
      `UPDATE vehicles SET status = COALESCE($1, status),
       latitude = COALESCE($2, latitude), longitude = COALESCE($3, longitude),
       speed = COALESCE($4, speed), bearing = COALESCE($5, bearing),
       last_seen = NOW() WHERE id = $6 RETURNING *`,
      [status, latitude, longitude, speed, bearing, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/routes', async (_req: Request, res: Response) => {
  try {
    const result = await pgPool.query('SELECT * FROM routes ORDER BY id');
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/routes', authMiddleware as any, requireRole('admin') as any, async (req: Request, res: Response) => {
  const { name, origin, destination, fare } = req.body;
  try {
    const result = await pgPool.query(
      `INSERT INTO routes (name, origin, destination, fare)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, origin, destination, fare]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/routes/:id', authMiddleware as any, requireRole('admin') as any, async (req: Request, res: Response) => {
  try {
    await pgPool.query('DELETE FROM routes WHERE id = $1', [req.params.id]);
    res.json({ message: 'Route deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/vehicles/:id', authMiddleware as any, requireRole('admin') as any, async (req: Request, res: Response) => {
  try {
    await pgPool.query('DELETE FROM vehicles WHERE id = $1', [req.params.id]);
    res.json({ message: 'Vehicle deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/drivers', authMiddleware as any, async (_req: Request, res: Response) => {
  try {
    const result = await pgPool.query(
      `SELECT id, name, email, phone FROM users WHERE role = 'driver' ORDER BY name`
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;