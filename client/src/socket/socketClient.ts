import { io, type Socket } from 'socket.io-client';
import { serverUrl } from '../config.js';

let socket: Socket | null = null;

// One connection for the whole app. It opens on first use, not at import time.
export function getSocket(): Socket {
  if (!socket) {
    socket = io(serverUrl(), {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      reconnectionDelayMax: 5000,
    });
  }
  return socket;
}
