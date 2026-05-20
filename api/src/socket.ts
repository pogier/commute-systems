import { Server } from 'socket.io';

let _io: Server;

export const setIO = (io: Server) => { _io = io; };
export const getIO = (): Server => _io;
