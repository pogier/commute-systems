import { Router, Response } from "express";
import { pgPool } from "../config/db";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { io } from "../index";

const router = Router();

// GET /api/bookings
router.get("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    let query: string; let params: any[];
    if (req.user!.role === "admin") {
      query = `SELECT b.*, u.name AS passenger_name,
               v.plate_number, r.name AS route_name
               FROM bookings b
               LEFT JOIN users u ON b.passenger_id = u.id
               LEFT JOIN vehicles v ON b.vehicle_id = v.id
               LEFT JOIN routes r ON b.route_id = r.id
               ORDER BY b.created_at DESC`;
      params = [];
    } else if (req.user!.role === "driver") {
      // All pending bookings + this driver's confirmed/onboard bookings
      query = `SELECT b.*, r.name AS route_name
               FROM bookings b
               LEFT JOIN routes r ON b.route_id = r.id
               WHERE b.status = $1
               OR (b.vehicle_id = $2 AND b.status IN ($3,$4))
               ORDER BY b.created_at DESC LIMIT 20`;
      params = ["pending", req.user!.vehicleId, "confirmed", "onboard"];
    } else {
      query = `SELECT b.*, v.plate_number, r.name AS route_name
               FROM bookings b
               LEFT JOIN vehicles v ON b.vehicle_id = v.id
               LEFT JOIN routes r ON b.route_id = r.id
               WHERE b.passenger_id = $1
               ORDER BY b.created_at DESC`;
      params = [req.user!.id];
    }
    const result = await pgPool.query(query, params);
    res.json(result.rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// POST /api/bookings  — passenger creates a booking
router.post("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  const { route_id, pickup_address, dropoff_address, scheduled_time } = req.body;
  if (!route_id || !pickup_address || !dropoff_address)
    return res.status(400).json({ error: "route_id, pickup_address, dropoff_address required" });
  try {
    const rRes = await pgPool.query(
      "SELECT fare, name FROM routes WHERE id = $1", [route_id]
    );
    const { fare, name: route_name } = rRes.rows[0] || { fare: 0, name: "" };
    const result = await pgPool.query(
      `INSERT INTO bookings
       (passenger_id, route_id, pickup_address, dropoff_address, scheduled_time, fare)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.user!.id, route_id, pickup_address, dropoff_address, scheduled_time||null, fare]
    );
    const booking = { ...result.rows[0], route_name };
    io.emit("new_booking", booking);
    res.status(201).json(booking);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/bookings/:id/status  — driver moves booking through lifecycle
router.patch("/:id/status", authMiddleware, async (req: AuthRequest, res: Response) => {
  const { status, vehicle_id } = req.body;
  const valid = ["pending","confirmed","onboard","completed","cancelled"];
  if (!valid.includes(status))
    return res.status(400).json({ error: "Invalid status" });
  try {
    const result = await pgPool.query(
      `UPDATE bookings
       SET status = $1, vehicle_id = COALESCE($2, vehicle_id)
       WHERE id = $3 RETURNING *`,
      [status, vehicle_id || null, req.params.id]
    );
    if (!result.rows.length)
      return res.status(404).json({ error: "Booking not found" });
    const booking = result.rows[0];
    io.emit("booking_status_changed", { booking_id: booking.id, status, booking });
    res.json(booking);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/bookings/:id  — soft cancel by passenger
router.delete("/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await pgPool.query(
      "UPDATE bookings SET status=$1 WHERE id=$2 AND passenger_id=$3",
      ["cancelled", req.params.id, req.user!.id]
    );
    io.emit("booking_status_changed", { booking_id: req.params.id, status: "cancelled" });
    res.json({ message: "Booking cancelled" });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

export default router;
