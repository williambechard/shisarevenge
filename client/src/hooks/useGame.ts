import { useCallback, useEffect, useReducer } from 'react';
import type { AckResponse, PublicRoomState } from '@shisa-revenge/shared';
import { getSocket } from '../socket/socketClient.js';
import { createInitialState, type GameState } from '../state/gameState.js';
import { gameReducer } from '../state/gameReducer.js';
import { clearSession, readSession, writeSession, type KeyValueStorage } from '../state/session.js';

type SeatAck = AckResponse<{ roomCode: string; playerId: string; sessionToken: string }>;
type PlainAck = AckResponse;

// After this long without a connection, the message says the server is waking up.
const WAKING_AFTER_MS = 3000;

function browserStorage(): KeyValueStorage {
  return window.localStorage;
}

export type GameActions = {
  createRoom: (name: string) => void;
  joinRoom: (code: string, name: string) => void;
  leaveRoom: () => void;
  setReady: (ready: boolean) => void;
  navigate: (screen: GameState['screen']) => void;
  clearNotice: () => void;
};

export function useGame(): { state: GameState } & GameActions {
  const [state, dispatch] = useReducer(gameReducer, window.location.search, createInitialState);

  useEffect(() => {
    const socket = getSocket();
    const storage = browserStorage();
    let hasConnected = false;

    const onConnect = (): void => {
      hasConnected = true;
      clearTimeout(wakingTimer);
      dispatch({ type: 'connection', connection: 'connected' });

      // Rejoin the stored seat after a refresh or reconnect.
      const session = readSession(storage);
      if (!session) return;
      socket.emit(
        'room:join',
        { roomCode: session.roomCode, name: session.name, sessionToken: session.sessionToken },
        (response: SeatAck) => {
          if (response.ok) {
            writeSession(storage, {
              roomCode: response.roomCode,
              playerId: response.playerId,
              sessionToken: response.sessionToken,
              name: session.name,
            });
            dispatch({ type: 'joined', roomCode: response.roomCode, playerId: response.playerId });
            return;
          }
          clearSession(storage);
          dispatch({ type: 'notice', message: response.error.message });
        },
      );
    };

    const onDisconnect = (): void => {
      dispatch({
        type: 'connection',
        connection: hasConnected ? 'reconnecting' : 'connecting',
      });
    };

    const onConnectError = (): void => {
      dispatch({
        type: 'connection',
        connection: hasConnected ? 'reconnecting' : 'waking',
      });
    };

    const onRoomState = (room: PublicRoomState): void => {
      dispatch({ type: 'room-state', room });
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('room:state', onRoomState);

    const wakingTimer = setTimeout(() => {
      if (!hasConnected) dispatch({ type: 'connection', connection: 'waking' });
    }, WAKING_AFTER_MS);

    socket.connect();

    return () => {
      clearTimeout(wakingTimer);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('room:state', onRoomState);
    };
  }, []);

  const createRoom = useCallback((name: string): void => {
    const storage = browserStorage();
    getSocket().emit('room:create', { name }, (response: SeatAck) => {
      if (!response.ok) {
        dispatch({ type: 'notice', message: response.error.message });
        return;
      }
      writeSession(storage, {
        roomCode: response.roomCode,
        playerId: response.playerId,
        sessionToken: response.sessionToken,
        name,
      });
      dispatch({ type: 'joined', roomCode: response.roomCode, playerId: response.playerId });
    });
  }, []);

  const joinRoom = useCallback((code: string, name: string): void => {
    const storage = browserStorage();
    getSocket().emit('room:join', { roomCode: code, name }, (response: SeatAck) => {
      if (!response.ok) {
        dispatch({ type: 'notice', message: response.error.message });
        return;
      }
      writeSession(storage, {
        roomCode: response.roomCode,
        playerId: response.playerId,
        sessionToken: response.sessionToken,
        name,
      });
      dispatch({ type: 'joined', roomCode: response.roomCode, playerId: response.playerId });
    });
  }, []);

  const leaveRoom = useCallback((): void => {
    const storage = browserStorage();
    clearSession(storage);
    dispatch({ type: 'left' });
    getSocket().emit('room:leave', {});
  }, []);

  const setReady = useCallback((ready: boolean): void => {
    getSocket().emit('lobby:ready', { ready }, (response: PlainAck) => {
      if (!response.ok) dispatch({ type: 'notice', message: response.error.message });
    });
  }, []);

  const navigate = useCallback((screen: GameState['screen']): void => {
    dispatch({ type: 'navigate', screen });
  }, []);

  const clearNotice = useCallback((): void => {
    dispatch({ type: 'notice', message: null });
  }, []);

  return { state, createRoom, joinRoom, leaveRoom, setReady, navigate, clearNotice };
}
