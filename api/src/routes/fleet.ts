import { Router, Request, Response } from 'express';
import { pgPool, redisClient } from '../config/db';
import { authMiddleware, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/vehicles', async (_req: Request, res: Response) => {
  try {
    const result = await pgPool.query(`
      SELECT v.*, u.name AS driver_name
      FROM vehicles v
      LEFT JOIN users u ON v.driver_id = u.id
      ORDER BY v.id
    `);
    const vehicles = await Promise.all(result.rows.map(async (v) => {
      try {
        const liveData = await redisClient.get(`vehicle:${v.id}:location`);
        if (liveData) {
          const loc = JSON.parse(liveData.toString());
          return { ...v, live_lat: loc.lat, live_lng: loc.lng, live_speed: loc.speed };
        }
      } catch {}
      return v;
    }));
    res.json(vehicles);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/vehicles', authMiddleware, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  const { plate_number, type, capacity, driver_id } = req.body;
  if (!plate_number) return res.status(400).json({ error: 'plate_number is required' });
  try {
    const result = await pgPool.query(
      `INSERT INTO vehicles (plate_number, type, capacity, driver_id) VALUES ($1,$2,$3,$4) RETURNING *`,
      [plate_number, type || 'jeepney', capacity || 20, driver_id || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    if (err.code === '23505') return res.status(409).json({ error: 'Plate number already exists' });
    res.status(500).json({ error: err.message });
  }
});

router.patch('/vehicles/:id/status', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { status } = req.body;
  try {
    const result = await pgPool.query('UPDATE vehicles SET status=$1 WHERE id=$2 RETURNING *', [status, req.params.id]);
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/vehicles/:id/location', async (req: Request, res: Response) => {
  try {
    const data = await redisClient.get(`vehicle:${req.params.id}:location`);
    if (!data) return res.json({ message: 'No live location data' });
    res.json(JSON.parse(data.toString()));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/routes', async (_req: Request, res: Response) => {
  try {
    const result = await pgPool.query('SELECT * FROM routes WHERE is_active = true ORDER BY id');
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/routes', authMiddleware, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  const { name, origin, destination, stops, fare } = req.body;
  if (!name || !origin || !destination) return res.status(400).json({ error: 'name, origin, and destination are required' });
  try {
    const result = await pgPool.query(
      `INSERT INTO routes (name, origin, destination, stops, fare, is_active) VALUES ($1,$2,$3,$4,$5,true) RETURNING *`,
      [name, origin, destination, JSON.stringify(stops || []), fare || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/drivers', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const result = await pgPool.query(`SELECT id, name, email, phone FROM users WHERE role='driver' AND is_active=true ORDER BY name`);
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;