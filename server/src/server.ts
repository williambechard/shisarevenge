// Assembles the HTTP server, Socket.IO, the room registry, and the idle sweep.
// Kept separate from index.ts so tests can start and stop a server.

import { createServer, type Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import { ROOM_CREATE_PER_IP_PER_MINUTE } from '@shisa-revenge/shared';
import { createApp } from './app.js';
import type { ServerConfig } from './config.js';
import { MatchRunner, type MatchRunnerOptions } from './game/matchRunner.js';
import { RoomRegistry, type RegistryOptions } from './rooms/roomRegistry.js';
import { registerConnectionHandlers } from './socket/registerHandlers.js';
import { KeyedLimiter } from './socket/rateLimit.js';

const SWEEP_INTERVAL_MS = 60_000;

export type GameServer = {
  httpServer: HttpServer;
  io: Server;
  registry: RoomRegistry;
  matches: MatchRunner;
  close: () => Promise<void>;
};

export type GameServerOptions = {
  registry?: RegistryOptions;
  matches?: MatchRunnerOptions;
};

export function createGameServer(
  config: Pick<ServerConfig, 'CLIENT_ORIGIN'>,
  options: GameServerOptions = {},
): GameServer {
  const httpServer = createServer(createApp());
  const io = new Server(httpServer, {
    cors: { origin: config.CLIENT_ORIGIN },
  });

  const registry = new RoomRegistry(options.registry);
  const matches = new MatchRunner(io, registry, options.matches);
  registerConnectionHandlers(
    io,
    registry,
    new KeyedLimiter(ROOM_CREATE_PER_IP_PER_MINUTE, 60_000),
    matches,
  );

  const sweeper = setInterval(() => {
    registry.expireIdle();
  }, SWEEP_INTERVAL_MS);
  sweeper.unref();

  const close = async (): Promise<void> => {
    clearInterval(sweeper);
    matches.disposeAll();
    if (httpServer.listening) {
      await io.close();
    } else {
      io.disconnectSockets(true);
    }
  };

  return { httpServer, io, registry, matches, close };
}
