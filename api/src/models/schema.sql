CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) DEFAULT 'passenger', -- passenger | driver | admin
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plate_number VARCHAR(20) UNIQUE NOT NULL,
  driver_id UUID REFERENCES users(id),
  capacity INT NOT NULL,
  status VARCHAR(20) DEFAULT 'idle', -- idle | en_route | offline
  current_lat DECIMAL(9,6),
  current_lng DECIMAL(9,6)
);

CREATE TABLE routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  origin VARCHAR(200) NOT NULL,
  destination VARCHAR(200) NOT NULL,
  stops JSONB DEFAULT '[]'
);

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  passenger_id UUID REFERENCES users(id),
  vehicle_id UUID REFERENCES vehicles(id),
  route_id UUID REFERENCES routes(id),
  status VARCHAR(20) DEFAULT 'pending', -- pending | confirmed | onboard | completed | cancelled
  pickup_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);