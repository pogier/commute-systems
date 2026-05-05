import { Pool } from 'pg';
import { createClient } from 'redis';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// ─── PostgreSQL ───────────────────────────────────────────────────────────────
export const pgPool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: Number(process.env.PG_PORT) || 5432,
  database: process.env.PG_DATABASE || 'commute_db',
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || 'postgres',
});

// ─── Redis ────────────────────────────────────────────────────────────────────
export const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redisClient.on('error', (err) => console.error('Redis error:', err));

// ─── MongoDB ──────────────────────────────────────────────────────────────────
export const connectMongo = async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/commute_logs');
};

// ─── Run all migrations ───────────────────────────────────────────────────────
const runMigrations = async () => {
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role VARCHAR(20) DEFAULT 'passenger' CHECK (role IN ('passenger','driver','admin')),
      phone VARCHAR(20),
      fcm_token TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS vehicles (
      id SERIAL PRIMARY KEY,
      plate_number VARCHAR(20) UNIQUE NOT NULL,
      type VARCHAR(50) DEFAULT 'jeepney',
      capacity INT DEFAULT 20,
      status VARCHAR(20) DEFAULT 'idle' CHECK (status IN ('idle','active','maintenance')),
      driver_id INT REFERENCES users(id) ON DELETE SET NULL,
      current_lat DECIMAL(10,8),
      current_lng DECIMAL(11,8),
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS routes (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      origin VARCHAR(150) NOT NULL,
      destination VARCHAR(150) NOT NULL,
      stops JSONB DEFAULT '[]',
      fare DECIMAL(10,2) DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id SERIAL PRIMARY KEY,
      passenger_id INT REFERENCES users(id) ON DELETE CASCADE,
      vehicle_id INT REFERENCES vehicles(id) ON DELETE SET NULL,
      route_id INT REFERENCES routes(id) ON DELETE SET NULL,
      pickup_address TEXT,
      dropoff_address TEXT,
      pickup_lat DECIMAL(10,8),
      pickup_lng DECIMAL(11,8),
      dropoff_lat DECIMAL(10,8),
      dropoff_lng DECIMAL(11,8),
      status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending','confirmed','onboard','completed','cancelled')),
      fare DECIMAL(10,2),
      scheduled_time TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // Seed sample data if empty
  const { rows: routeRows } = await pgPool.query('SELECT COUNT(*) FROM routes');
  if (parseInt(routeRows[0].count) === 0) {
    await pgPool.query(`
      INSERT INTO routes (name, origin, destination, stops, fare) VALUES
        ('Route 1 - Cubao to Makati', 'Cubao, Quezon City', 'Makati CBD', '[{"name":"EDSA Ortigas","lat":14.5871,"lng":121.0567},{"name":"Shaw Blvd","lat":14.5829,"lng":121.0585}]', 45.00),
        ('Route 2 - Fairview to Quiapo', 'Fairview, Quezon City', 'Quiapo, Manila', '[{"name":"SM Fairview","lat":14.7468,"lng":121.0580},{"name":"Novaliches","lat":14.7273,"lng":121.0388}]', 30.00),
        ('Route 3 - Antipolo to Pasig', 'Antipolo, Rizal', 'Pasig City', '[{"name":"Tikling","lat":14.5974,"lng":121.1231},{"name":"Cainta Junction","lat":14.5761,"lng":121.1133}]', 25.00);
    `);
    console.log('✅ Sample routes seeded');
  }

  const { rows: vehicleRows } = await pgPool.query('SELECT COUNT(*) FROM vehicles');
  if (parseInt(vehicleRows[0].count) === 0) {
    await pgPool.query(`
      INSERT INTO vehicles (plate_number, type, capacity, status) VALUES
        ('ABC-1234', 'jeepney', 20, 'idle'),
        ('XYZ-5678', 'bus', 45, 'idle'),
        ('DEF-9012', 'van', 12, 'idle');
    `);
    console.log('✅ Sample vehicles seeded');
  }

  console.log('✅ Database migrations complete');
};

// ─── Connect all ──────────────────────────────────────────────────────────────
export const connectDatabases = async () => {
  await pgPool.connect();
  console.log('✅ PostgreSQL connected');

  await redisClient.connect();
  console.log('✅ Redis connected');

  await connectMongo();
  console.log('✅ MongoDB connected');

  await runMigrations();
};
