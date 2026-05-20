import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabases } from './config/db';
import authRoutes from './routes/auth';
import bookingRoutes from './routes/booking';
import fleetRoutes from './routes/fleet';
import adminRoutes from './routes/admin';
import { initSocket } from './sockets/fleetSocket';
import { setIO } from './socket';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});
setIO(io);

app.use(cors({
  origin: '*',
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Commute System API is running', timestamp: new Date() });
});

app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/fleet', fleetRoutes);
app.use('/api/admin', adminRoutes);

initSocket(io);

const PORT = process.env.PORT || 4000;

connectDatabases().then(() => {
  server.listen(PORT, () => {
    console.log(`\n✅ API running on http://localhost:${PORT}`);
    console.log(`✅ WebSocket ready`);
    console.log(`✅ Health check: http://localhost:${PORT}/health\n`);
  });
}).catch((err) => {
  console.error('❌ Failed to connect to databases:', err);
  process.exit(1);
});

export { io };