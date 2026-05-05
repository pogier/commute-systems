import { Server, Socket } from 'socket.io';
import { redisClient, pgPool } from '../config/db';

export const initSocket = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log(`📱 Client connected: ${socket.id}`);

    socket.on('driver:location_update', async (data: any) => {
      const { vehicle_id, lat, lng, speed = 0, heading = 0 } = data;
      const locationData = { lat, lng, speed, heading, timestamp: new Date().toISOString() };
      try {
        await redisClient.setEx(`vehicle:${vehicle_id}:location`, 300, JSON.stringify(locationData));
        await pgPool.query('UPDATE vehicles SET current_lat=$1, current_lng=$2, status=$3 WHERE id=$4', [lat, lng, 'active', vehicle_id]);
        io.emit(`vehicle:${vehicle_id}:location`, locationData);
        io.emit('fleet:location_update', { vehicle_id, ...locationData });
      } catch (err) {
        console.error('Location update error:', err);
      }
    });

    socket.on('driver:offline', async (data: any) => {
      try {
        await pgPool.query('UPDATE vehicles SET status=$1 WHERE id=$2', ['idle', data.vehicle_id]);
        await redisClient.del(`vehicle:${data.vehicle_id}:location`);
        io.emit('fleet:vehicle_offline', { vehicle_id: data.vehicle_id });
      } catch (err) {
        console.error('Driver offline error:', err);
      }
    });

    socket.on('subscribe:vehicle', (data: any) => {
      socket.join(`vehicle_room_${data.vehicle_id}`);
    });

    socket.on('disconnect', () => {
      console.log(`📴 Client disconnected: ${socket.id}`);
    });
  });
};