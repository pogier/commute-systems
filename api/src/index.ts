import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabases } from './config/db';
import authRoutes from './routes/auth';
import bookingRoutes from './routes/booking';
import fleetRoutes from './routes/fleet';
import { initSocket } from './sockets/fleetSocket';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Commute System API is running', timestamp: new Date() });
});

app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/fleet', fleetRoutes);

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