import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io('http://localhost:4000', { transports: ['websocket'] });
    socket.on('connect', () => console.log('✅ WebSocket connected'));
    socket.on('disconnect', () => console.log('📴 WebSocket disconnected'));
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) { socket.disconnect(); socket = null; }
};