import type { PublicRoomState } from '@shisa-revenge/shared';

export type Screen = 'landing' | 'join' | 'lobby';

export type ConnectionState = 'connecting' | 'waking' | 'connected' | 'reconnecting' | 'offline';

export type GameState = {
  screen: Screen;
  connection: ConnectionState;
  room: PublicRoomState | null;
  roomCode: string | null;
  playerId: string | null;
  prefillCode: string;
  notice: string | null;
};

// Reads ?room=CODE from a link or QR code so the join screen can prefill it.
export function prefillCodeFrom(search: string): string {
  const value = new URLSearchParams(search).get('room');
  return value ? value.trim().toUpperCase() : '';
}

export function createInitialState(search: string): GameState {
  return {
    screen: 'landing',
    connection: 'connecting',
    room: null,
    roomCode: null,
    playerId: null,
    prefillCode: prefillCodeFrom(search),
    notice: null,
  };
}
