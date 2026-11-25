// Socket event handlers for the lobby. Each payload is parsed with its Zod schema first.
// Errors go back in the acknowledgement. Hidden state never goes to the room.

import type { Server, Socket } from 'socket.io';
import {
  ERROR_MESSAGES,
  RATE_LIMIT_EVENTS_PER_SECOND,
  lobbyReadyPayload,
  roomCreatePayload,
  roomJoinPayload,
  roomLeavePayload,
  type AckResponse,
  type ErrorCode,
} from '@shisa-revenge/shared';
import type { z } from 'zod';
import type { RoomRegistry, RoomRecord } from '../rooms/roomRegistry.js';
import type { KeyedLimiter } from './rateLimit.js';
import { SlidingWindowLimiter } from './rateLimit.js';

type SeatAck = AckResponse<{ roomCode: string; playerId: string; sessionToken: string }>;
type PlainAck = AckResponse;

type SocketSession = {
  roomCode: string | null;
  playerId: string | null;
};

// Returns the parsed payload, or null when it does not match the schema.
function parse<S extends z.ZodType>(schema: S, raw: unknown): z.output<S> | null {
  const result = schema.safeParse(raw);
  return result.success ? result.data : null;
}

function fail(code: ErrorCode): { ok: false; error: { code: ErrorCode; message: string } } {
  return { ok: false, error: { code, message: ERROR_MESSAGES[code] } };
}

// Sends the broadcast state to everyone currently in the room.
function broadcastState(io: Server, registry: RoomRegistry, room: RoomRecord): void {
  io.to(room.code).emit('room:state', registry.toPublicState(room));
}

// The client IP is used only for the room-creation cap. Behind a proxy, use the first
// X-Forwarded-For entry. This value is never logged or sent to other players.
function clientIp(socket: Socket): string {
  const header = socket.handshake.headers['x-forwarded-for'];
  const raw = Array.isArray(header) ? header[0] : header;
  const first = raw?.split(',')[0]?.trim();
  return first && first.length > 0 ? first : socket.handshake.address;
}

export function registerConnectionHandlers(
  io: Server,
  registry: RoomRegistry,
  createRoomLimiter: KeyedLimiter,
): void {
  io.on('connection', (socket) => {
    const session: SocketSession = { roomCode: null, playerId: null };
    const eventLimiter = new SlidingWindowLimiter(RATE_LIMIT_EVENTS_PER_SECOND, 1000);

    // Removes this socket's seat from its current room, if it has one.
    const leaveCurrentRoom = (): void => {
      if (!session.roomCode || !session.playerId) return;
      const code = session.roomCode;
      const room = registry.leave(code, session.playerId);
      // The in-memory adapter applies room membership synchronously, so the promise is not needed.
      void socket.leave(code);
      session.roomCode = null;
      session.playerId = null;
      if (room) broadcastState(io, registry, room);
    };

    const attach = (code: string, playerId: string): void => {
      void socket.join(code);
      registry.bindSocket(code, playerId, socket.id);
      session.roomCode = code;
      session.playerId = playerId;
    };

    socket.on('room:create', (raw: unknown, ack?: (response: SeatAck) => void) => {
      if (!eventLimiter.take()) return ack?.(fail('RATE_LIMITED'));
      const payload = parse(roomCreatePayload, raw);
      if (!payload) return ack?.(fail('INVALID_PAYLOAD'));
      if (!createRoomLimiter.take(clientIp(socket))) return ack?.(fail('RATE_LIMITED'));

      leaveCurrentRoom();
      const { room, player } = registry.create(payload.name);
      attach(room.code, player.id);

      const seat = { roomCode: room.code, playerId: player.id, sessionToken: player.token };
      socket.emit('room:joined', seat);
      ack?.({ ok: true, ...seat });
      broadcastState(io, registry, room);
    });

    socket.on('room:join', (raw: unknown, ack?: (response: SeatAck) => void) => {
      if (!eventLimiter.take()) return ack?.(fail('RATE_LIMITED'));
      const payload = parse(roomJoinPayload, raw);
      if (!payload) return ack?.(fail('INVALID_PAYLOAD'));

      const previous = { ...session };
      const result = registry.join(payload.roomCode, payload.name, payload.sessionToken);
      if (!result.ok) return ack?.(fail(result.error));

      const { room, player, reconnected } = result.value;

      // Leave the previous room only after the join succeeds, so a failed join keeps the old seat.
      if (previous.roomCode && previous.playerId) {
        const isSameSeat = previous.roomCode === room.code && previous.playerId === player.id;
        if (!isSameSeat) {
          const oldRoom = registry.leave(previous.roomCode, previous.playerId);
          void socket.leave(previous.roomCode);
          if (oldRoom) broadcastState(io, registry, oldRoom);
        }
      }

      attach(room.code, player.id);
      const seat = { roomCode: room.code, playerId: player.id, sessionToken: player.token };
      socket.emit('room:joined', seat);
      ack?.({ ok: true, ...seat });

      if (reconnected) {
        io.to(room.code).emit('player:reconnected', { playerId: player.id, name: player.name });
      }
      broadcastState(io, registry, room);
    });

    socket.on('room:leave', (raw: unknown, ack?: (response: PlainAck) => void) => {
      if (!eventLimiter.take()) return ack?.(fail('RATE_LIMITED'));
      if (!parse(roomLeavePayload, raw)) return ack?.(fail('INVALID_PAYLOAD'));
      if (!session.roomCode) return ack?.(fail('ROOM_NOT_FOUND'));

      leaveCurrentRoom();
      ack?.({ ok: true });
    });

    socket.on('lobby:ready', (raw: unknown, ack?: (response: PlainAck) => void) => {
      if (!eventLimiter.take()) return ack?.(fail('RATE_LIMITED'));
      const payload = parse(lobbyReadyPayload, raw);
      if (!payload) return ack?.(fail('INVALID_PAYLOAD'));
      if (!session.roomCode || !session.playerId) return ack?.(fail('ROOM_NOT_FOUND'));

      const result = registry.setReady(session.roomCode, session.playerId, payload.ready);
      if (!result.ok) return ack?.(fail(result.error));

      broadcastState(io, registry, result.value);
      ack?.({ ok: true });
    });

    socket.on('disconnect', () => {
      if (!session.roomCode || !session.playerId) return;
      const code = session.roomCode;
      const player = registry.markDisconnected(code, session.playerId, socket.id);
      const room = registry.find(code);
      if (!player || !room) return;

      io.to(code).emit('player:disconnected', { playerId: player.id, name: player.name });
      broadcastState(io, registry, room);
    });
  });
}
