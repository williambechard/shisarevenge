// Socket event handlers. Each payload is parsed with its Zod schema first.
// Errors go back in the acknowledgement. Hidden state never goes to the room.

import type { Server, Socket } from 'socket.io';
import {
  ERROR_MESSAGES,
  cardPickPayload,
  encounterSubmitPayload,
  villageAccusePayload,
  villageMovePayload,
  villageVendPayload,
  RATE_LIMIT_EVENTS_PER_SECOND,
  roomEnterPayload,
  lobbyStartNowPayload,
  roomLeavePayload,
  LOBBY_DISCONNECT_GRACE_SECONDS,
  type AckResponse,
  type ErrorCode,
} from '@shisa-revenge/shared';
import type { z } from 'zod';
import type { MatchRunner } from '../game/matchRunner.js';
import type { RoomRecord, RoomRegistry } from '../rooms/roomRegistry.js';
import type { KeyedLimiter } from './rateLimit.js';
import { SlidingWindowLimiter } from './rateLimit.js';

type SeatAck = AckResponse<{
  roomCode: string;
  playerId: string;
  sessionToken: string;
  name: string;
}>;
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
  matches: MatchRunner,
  lobbyDisconnectMs: number = LOBBY_DISCONNECT_GRACE_SECONDS * 1000,
): void {
  // Frees a lobby seat whose player never came back. A player who reconnected to the seat, or who
  // left, is not affected.
  const releaseLobbySeatLater = (code: string, playerId: string, socketId: string): void => {
    const timer = setTimeout(() => {
      const room = registry.find(code);
      const seat = room?.players.find((candidate) => candidate.id === playerId);
      if (!room || !seat || seat.connected || seat.socketId !== socketId) return;
      if (room.phase !== 'lobby') return;

      const remaining = registry.leave(code, playerId);
      if (remaining) broadcastState(io, registry, remaining);
      matches.lobbyChanged(code);
    }, lobbyDisconnectMs);
    // A pending release must not keep the process alive.
    timer.unref();
  };

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
      matches.lobbyChanged(code);
    };

    const attach = (code: string, playerId: string): void => {
      void socket.join(code);
      registry.bindSocket(code, playerId, socket.id);
      session.roomCode = code;
      session.playerId = playerId;
    };

    // Places the player automatically. A full lobby starts its match.
    socket.on('room:enter', (raw: unknown, ack?: (response: SeatAck) => void) => {
      if (!eventLimiter.take()) return ack?.(fail('RATE_LIMITED'));
      const payload = parse(roomEnterPayload, raw);
      if (!payload) return ack?.(fail('INVALID_PAYLOAD'));

      // The per-IP cap guards room creation only. Joining an open lobby is not limited.
      const startsRoom = payload.sessionToken === undefined && !registry.hasOpenLobby();
      if (startsRoom && !createRoomLimiter.take(clientIp(socket))) {
        return ack?.(fail('RATE_LIMITED'));
      }

      const previous = { ...session };
      const result = registry.enter(payload.sessionToken, socket.id);
      if (!result.ok) return ack?.(fail(result.error));

      const { room, player, reconnected } = result.value;

      // Leave the previous room only after entry succeeds, so a failed entry keeps the old seat.
      if (previous.roomCode && previous.playerId) {
        const isSameSeat = previous.roomCode === room.code && previous.playerId === player.id;
        if (!isSameSeat) {
          const oldRoom = registry.leave(previous.roomCode, previous.playerId);
          void socket.leave(previous.roomCode);
          if (oldRoom) broadcastState(io, registry, oldRoom);
          matches.lobbyChanged(previous.roomCode);
        }
      }

      attach(room.code, player.id);
      const seat = {
        roomCode: room.code,
        playerId: player.id,
        sessionToken: player.token,
        name: player.name,
      };
      socket.emit('room:joined', seat);
      ack?.({ ok: true, ...seat });

      if (reconnected) {
        io.to(room.code).emit('player:reconnected', { playerId: player.id, name: player.name });
      }
      broadcastState(io, registry, room);

      if (reconnected) {
        matches.resync(room.code, player.id);
      } else {
        matches.lobbyChanged(room.code);
      }
    });

    socket.on('room:leave', (raw: unknown, ack?: (response: PlainAck) => void) => {
      if (!eventLimiter.take()) return ack?.(fail('RATE_LIMITED'));
      if (!parse(roomLeavePayload, raw)) return ack?.(fail('INVALID_PAYLOAD'));
      if (!session.roomCode) return ack?.(fail('ROOM_NOT_FOUND'));

      leaveCurrentRoom();
      ack?.({ ok: true });
    });

    socket.on('lobby:start-now', (raw: unknown, ack?: (response: PlainAck) => void) => {
      if (!eventLimiter.take()) return ack?.(fail('RATE_LIMITED'));
      if (!parse(lobbyStartNowPayload, raw)) return ack?.(fail('INVALID_PAYLOAD'));
      if (!session.roomCode) return ack?.(fail('ROOM_NOT_FOUND'));

      const result = matches.startNow(session.roomCode);
      if (!result.ok) return ack?.(fail(result.error));
      ack?.({ ok: true });
    });

    socket.on('encounter:submit', (raw: unknown, ack?: (response: PlainAck) => void) => {
      if (!eventLimiter.take()) return ack?.(fail('RATE_LIMITED'));
      const payload = parse(encounterSubmitPayload, raw);
      if (!payload) return ack?.(fail('INVALID_PAYLOAD'));
      if (!session.roomCode || !session.playerId) return ack?.(fail('ROOM_NOT_FOUND'));

      const result = matches.submit(session.roomCode, session.playerId, payload);
      if (!result.ok) return ack?.(fail(result.error));
      ack?.({ ok: true });
    });

    // The winner of a duel takes one card from the face-down pool (design section 4.6).
    socket.on('card:pick', (raw: unknown, ack?: (response: PlainAck) => void) => {
      if (!eventLimiter.take()) return ack?.(fail('RATE_LIMITED'));
      const payload = parse(cardPickPayload, raw);
      if (!payload) return ack?.(fail('INVALID_PAYLOAD'));
      if (!session.roomCode || !session.playerId) return ack?.(fail('ROOM_NOT_FOUND'));

      const result = matches.pick(session.roomCode, session.playerId, payload.index);
      if (!result.ok) return ack?.(fail(result.error));
      ack?.({ ok: true });
    });
    // Village actions between matches (design/10-village.md).
    socket.on('village:move', (raw: unknown, ack?: (response: PlainAck) => void) => {
      if (!eventLimiter.take()) return ack?.(fail('RATE_LIMITED'));
      const payload = parse(villageMovePayload, raw);
      if (!payload) return ack?.(fail('INVALID_PAYLOAD'));
      if (!session.roomCode || !session.playerId) return ack?.(fail('ROOM_NOT_FOUND'));
      const result = matches.villageMove(session.roomCode, session.playerId, payload.x, payload.y);
      if (!result.ok) return ack?.(fail(result.error));
      ack?.({ ok: true });
    });

    socket.on('village:accuse', (raw: unknown, ack?: (response: PlainAck) => void) => {
      if (!eventLimiter.take()) return ack?.(fail('RATE_LIMITED'));
      const payload = parse(villageAccusePayload, raw);
      if (!payload) return ack?.(fail('INVALID_PAYLOAD'));
      if (!session.roomCode || !session.playerId) return ack?.(fail('ROOM_NOT_FOUND'));
      const result = matches.villageAccuse(
        session.roomCode,
        session.playerId,
        payload.targetId,
        payload.card,
      );
      if (!result.ok) return ack?.(fail(result.error));
      ack?.({ ok: true });
    });

    socket.on('village:vend', (raw: unknown, ack?: (response: PlainAck) => void) => {
      if (!eventLimiter.take()) return ack?.(fail('RATE_LIMITED'));
      const payload = parse(villageVendPayload, raw);
      if (!payload) return ack?.(fail('INVALID_PAYLOAD'));
      if (!session.roomCode || !session.playerId) return ack?.(fail('ROOM_NOT_FOUND'));
      const result = matches.villageVend(session.roomCode, session.playerId, payload.value);
      if (!result.ok) return ack?.(fail(result.error));
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
      if (room.phase === 'lobby') releaseLobbySeatLater(code, player.id, socket.id);
    });
  });
}
