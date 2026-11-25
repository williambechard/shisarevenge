import { useCallback, useEffect, useReducer } from 'react';
import {
  SELECTION_SECONDS,
  type AckResponse,
  type CardValue,
  type DuelOutcome,
  type PrivatePlayerState,
  type PublicRoomState,
} from '@shisa-revenge/shared';
import { getSocket } from '../socket/socketClient.js';
import {
  createInitialState,
  type GameState,
  type Pairing,
  type Screen,
} from '../state/gameState.js';
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
  startGame: () => void;
  selectCard: (value: CardValue) => void;
  submitCard: (value: CardValue) => void;
  navigate: (screen: Screen) => void;
  clearNotice: () => void;
};

type RoundPairedPayload = { round: number; pairings: Pairing[]; warmUpPlayerId: string | null };
type RevealedPayload = { myValue: CardValue; opponentValue: CardValue };

export function useGame(): { state: GameState } & GameActions {
  const [state, dispatch] = useReducer(gameReducer, window.location.search, createInitialState);

  useEffect(() => {
    const socket = getSocket();
    const storage = browserStorage();
    let hasConnected = false;

    const onConnect = (): void => {
      hasConnected = true;
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
      dispatch({ type: 'connection', connection: hasConnected ? 'reconnecting' : 'connecting' });
    };

    const onConnectError = (): void => {
      dispatch({ type: 'connection', connection: hasConnected ? 'reconnecting' : 'waking' });
    };

    const onRoomState = (room: PublicRoomState): void => {
      dispatch({ type: 'room-state', room });
    };

    const onGameStarted = (): void => {
      dispatch({ type: 'game-started' });
    };

    const onRoundPaired = (payload: RoundPairedPayload): void => {
      dispatch({
        type: 'round-paired',
        round: payload.round,
        pairings: payload.pairings,
        warmUpPlayerId: payload.warmUpPlayerId,
        deadline: Date.now() + SELECTION_SECONDS * 1000,
      });
    };

    const onPrivateState = (payload: PrivatePlayerState): void => {
      dispatch({ type: 'private-state', state: payload });
    };

    const onRevealed = (payload: RevealedPayload): void => {
      dispatch({
        type: 'revealed',
        myValue: payload.myValue,
        opponentValue: payload.opponentValue,
      });
    };

    const onResult = (outcome: DuelOutcome): void => {
      dispatch({ type: 'duel-result', outcome });
    };

    const onNotice = (notice: { kind: string }): void => {
      if (notice.kind === 'auto-locked') dispatch({ type: 'auto-locked' });
    };

    const subscriptions: Array<() => void> = [];
    socket.on('connect', onConnect);
    subscriptions.push(() => {
      socket.off('connect', onConnect);
    });
    socket.on('disconnect', onDisconnect);
    subscriptions.push(() => {
      socket.off('disconnect', onDisconnect);
    });
    socket.on('connect_error', onConnectError);
    subscriptions.push(() => {
      socket.off('connect_error', onConnectError);
    });
    socket.on('room:state', onRoomState);
    subscriptions.push(() => {
      socket.off('room:state', onRoomState);
    });
    socket.on('game:started', onGameStarted);
    subscriptions.push(() => {
      socket.off('game:started', onGameStarted);
    });
    socket.on('round:paired', onRoundPaired);
    subscriptions.push(() => {
      socket.off('round:paired', onRoundPaired);
    });
    socket.on('player:private-state', onPrivateState);
    subscriptions.push(() => {
      socket.off('player:private-state', onPrivateState);
    });
    socket.on('encounter:revealed', onRevealed);
    subscriptions.push(() => {
      socket.off('encounter:revealed', onRevealed);
    });
    socket.on('encounter:result', onResult);
    subscriptions.push(() => {
      socket.off('encounter:result', onResult);
    });
    socket.on('player:notice', onNotice);
    subscriptions.push(() => {
      socket.off('player:notice', onNotice);
    });
    const wakingTimer = setTimeout(() => {
      if (!hasConnected) dispatch({ type: 'connection', connection: 'waking' });
    }, WAKING_AFTER_MS);

    socket.connect();

    return () => {
      clearTimeout(wakingTimer);
      for (const unsubscribe of subscriptions) unsubscribe();
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
    clearSession(browserStorage());
    dispatch({ type: 'left' });
    getSocket().emit('room:leave', {});
  }, []);

  const setReady = useCallback((ready: boolean): void => {
    getSocket().emit('lobby:ready', { ready }, (response: PlainAck) => {
      if (!response.ok) dispatch({ type: 'notice', message: response.error.message });
    });
  }, []);

  const startGame = useCallback((): void => {
    getSocket().emit('game:start', {}, (response: PlainAck) => {
      if (!response.ok) dispatch({ type: 'notice', message: response.error.message });
    });
  }, []);

  const selectCard = useCallback((value: CardValue): void => {
    dispatch({ type: 'select', value });
  }, []);

  const submitCard = useCallback((value: CardValue): void => {
    getSocket().emit('encounter:submit', { value, useSpecial: false }, (response: PlainAck) => {
      if (!response.ok) dispatch({ type: 'notice', message: response.error.message });
    });
  }, []);

  const navigate = useCallback((screen: Screen): void => {
    dispatch({ type: 'navigate', screen });
  }, []);

  const clearNotice = useCallback((): void => {
    dispatch({ type: 'notice', message: null });
  }, []);

  return {
    state,
    createRoom,
    joinRoom,
    leaveRoom,
    setReady,
    startGame,
    selectCard,
    submitCard,
    navigate,
    clearNotice,
  };
}
