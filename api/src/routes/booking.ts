import { Router, Response } from 'express';
import { pgPool } from '../config/db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { io } from '../index';

const router = Router();

// GET /api/bookings
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    let query: string;
    let params: any[];

    if (req.user!.role === 'admin') {
      query = `
        SELECT b.*, u.name AS passenger_name, v.plate_number, r.name AS route_name
        FROM bookings b
        LEFT JOIN users u ON b.passenger_id = u.id
        LEFT JOIN vehicles v ON b.vehicle_id = v.id
        LEFT JOIN routes r ON b.route_id = r.id
        ORDER BY b.created_at DESC
      `;
      params = [];
    } else {
      query = `
        SELECT b.*, v.plate_number, v.type AS vehicle_type, r.name AS route_name
        FROM bookings b
        LEFT JOIN vehicles v ON b.vehicle_id = v.id
        LEFT JOIN routes r ON b.route_id = r.id
        WHERE b.passenger_id = $1
        ORDER BY b.created_at DESC
      `;
      params = [req.user!.id];
    }

    const result = await pgPool.query(query, params);
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/bookings
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  console.log('📦 Booking request body:', req.body);

  const route_id = req.body.route_id;
  const pickup_address = req.body.pickup_address;
  const dropoff_address = req.body.dropoff_address;
  const vehicle_id = req.body.vehicle_id || null;
  const scheduled_time = req.body.scheduled_time || null;

  if (!route_id || !pickup_address || !dropoff_address) {
    console.log('❌ Missing fields:', { route_id, pickup_address, dropoff_address });
    return res.status(400).json({ error: 'route_id, pickup_address, and dropoff_address are required' });
  }

  try {
    const routeResult = await pgPool.query('SELECT fare FROM routes WHERE id = $1', [route_id]);
    const fare = routeResult.rows[0]?.fare || 0;

    const result = await pgPool.query(
      `INSERT INTO bookings
        (passenger_id, vehicle_id, route_id, pickup_address, dropoff_address, scheduled_time, fare)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [req.user!.id, vehicle_id, route_id, pickup_address, dropoff_address, scheduled_time, fare]
    );

    const booking = result.rows[0];
    console.log('✅ Booking created:', booking);
    io.emit('new_booking', booking);
    res.status(201).json(booking);
  } catch (err: any) {
    console.error('❌ Booking error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/bookings/:id/status
router.patch('/:id/status', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'confirmed', 'onboard', 'completed', 'cancelled'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const result = await pgPool.query(
      'UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Booking not found' });

    const booking = result.rows[0];
    io.emit('booking_status_changed', { booking_id: booking.id, status, booking });
    res.json(booking);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/bookings/:id
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await pgPool.query(
      'UPDATE bookings SET status = $1 WHERE id = $2 AND passenger_id = $3',
      ['cancelled', req.params.id, req.user!.id]
    );
    res.json({ message: 'Booking cancelled' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;