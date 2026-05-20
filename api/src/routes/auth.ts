import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pgPool } from '../config/db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
  const { name, email, password, role = 'passenger', phone } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'name, email, and password are required' });
  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await pgPool.query(
      `INSERT INTO users (name, email, password_hash, role, phone)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, role, phone, created_at`,
      [name, email, hash, role, phone]
    );
    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );
    res.status(201).json({ token, user });
  } catch (err: any) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email already registered' });
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password required' });
  try {
    const result = await pgPool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash)))
      return res.status(401).json({ error: 'Invalid email or password' });

    let vehicleId: number | null = null;
    if (user.role === 'driver') {
      const vRes = await pgPool.query(
        'SELECT id FROM vehicles WHERE driver_id = $1 LIMIT 1', [user.id]
      );
      vehicleId = vRes.rows[0]?.id || null;
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, vehicleId },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', authMiddleware as any, async (req: Request, res: Response) => {
  const u = (req as AuthRequest).user!;
  try {
    const result = await pgPool.query(
      'SELECT id, name, email, role, phone, created_at FROM users WHERE id = $1', [u.id]
    );
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/fcm-token', authMiddleware as any, async (req: Request, res: Response) => {
  const u = (req as AuthRequest).user!;
  const fcm_token = (req as any).body?.fcm_token;
  try {
    await pgPool.query('UPDATE users SET fcm_token = $1 WHERE id = $2', [fcm_token, u.id]);
    res.json({ message: 'FCM token updated' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;