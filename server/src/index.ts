import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { createApp } from './app.js';
import { loadConfig } from './config.js';

const config = loadConfig(process.env);

const app = createApp();
const httpServer = createServer(app);

// CORS allows only the client origin. Design: design/03-guardrails.md section 6.
const io = new Server(httpServer, {
  cors: { origin: config.CLIENT_ORIGIN },
});

io.on('connection', (socket) => {
  // Event handlers are added in plan 02.
  socket.emit('connected', { ok: true });
});

httpServer.listen(config.PORT, () => {
  console.log(`Shisa Revenge server listening on port ${String(config.PORT)}`);
});
