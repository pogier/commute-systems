import { Router, Request, Response } from 'express';
import { pgPool } from '../config/db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { getIO } from '../socket';

const router = Router();

router.get('/', authMiddleware as any, async (req: Request, res: Response) => {
  const u = (req as AuthRequest).user!;
  try {
    let result;
    if (u.role === 'driver') {
      result = await pgPool.query(
        `SELECT b.*, u.name as passenger_name, r.name as route_name
         FROM bookings b
         LEFT JOIN users u ON b.passenger_id = u.id
         LEFT JOIN routes r ON b.route_id = r.id
         ORDER BY b.created_at DESC`
      );
    } else {
      result = await pgPool.query(
        `SELECT b.*, r.name as route_name
         FROM bookings b
         LEFT JOIN routes r ON b.route_id = r.id
         WHERE b.passenger_id = $1
         ORDER BY b.created_at DESC`,
        [u.id]
      );
    }
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware as any, async (req: Request, res: Response) => {
  const u = (req as AuthRequest).user!;
  const { route_id, pickup_address, dropoff_address } = req.body;
  try {
    const routeRes = await pgPool.query('SELECT fare, name FROM routes WHERE id = $1', [route_id]);
    if (routeRes.rows.length === 0) { res.status(400).json({ error: 'Route not found' }); return; }
    const { fare, name: route_name } = routeRes.rows[0];

    const result = await pgPool.query(
      `INSERT INTO bookings (passenger_id, route_id, pickup_address, dropoff_address, fare, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING *`,
      [u.id, route_id, pickup_address, dropoff_address, fare]
    );
    const booking = { ...result.rows[0], route_name };
    getIO().emit('new_booking', booking);
    res.status(201).json(booking);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/status', authMiddleware as any, async (req: Request, res: Response) => {
  const { status, vehicle_id } = req.body;
  try {
    const result = await pgPool.query(
      `UPDATE bookings SET status = $1, vehicle_id = COALESCE($2, vehicle_id)
       WHERE id = $3 RETURNING *`,
      [status, vehicle_id || null, req.params.id]
    );
    const booking = result.rows[0];
    getIO().emit('booking_status_changed', { booking_id: booking.id, status, booking });
    res.json(booking);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authMiddleware as any, async (req: Request, res: Response) => {
  const u = (req as AuthRequest).user!;
  try {
    await pgPool.query(
      'DELETE FROM bookings WHERE id = $1 AND passenger_id = $2',
      [req.params.id, u.id]
    );
    res.json({ message: 'Booking cancelled' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;