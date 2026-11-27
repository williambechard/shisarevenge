import { useCallback, useEffect, useReducer, type Dispatch } from 'react';
import {
  SELECTION_SECONDS,
  type AckResponse,
  type CardValue,
  type DuelOutcome,
  type EndgameSummary,
  type PlayedCard,
  type PrivateNotice,
  type PrivatePlayerState,
  type SpecialKind,
  type PublicRoomState,
} from '@shisa-revenge/shared';
import type { Socket } from 'socket.io-client';
import { getSocket } from '../socket/socketClient.js';
import { createInitialState, type GameState, type Pairing } from '../state/gameState.js';
import { gameReducer, type GameAction } from '../state/gameReducer.js';
import { clearSession, readSession, writeSession, type KeyValueStorage } from '../state/session.js';
import { playSfx } from '../audio/audioManager.js';
import { soundForNotice } from '../audio/sounds.js';

type EnterAck = AckResponse<{
  roomCode: string;
  playerId: string;
  sessionToken: string;
  name: string;
}>;
type PlainAck = AckResponse;

// After a reveal, the played cards stay on the table this long, then toss away.
const DISCARD_AFTER_MS = 1400;

// After this long without a connection, the message says the server is waking up.
const WAKING_AFTER_MS = 3000;

// A seat can still be held by the old socket for a moment after a refresh. Retry before giving up.
const REENTER_RETRY_MS = 1500;
const REENTER_ATTEMPTS = 10;

// sessionStorage is per tab. Two windows in one browser profile can each hold their own seat.
function browserStorage(): KeyValueStorage {
  return window.sessionStorage;
}

// Places this window in a room. A stored token reclaims the seat. Otherwise the server
// assigns an open lobby, or starts a new one.
function enterRoom(
  socket: Socket,
  storage: KeyValueStorage,
  dispatch: Dispatch<GameAction>,
  attempt = 1,
): void {
  const stored = readSession(storage);
  const payload = stored ? { sessionToken: stored.sessionToken } : {};

  socket.emit('room:enter', payload, (response: EnterAck) => {
    if (response.ok) {
      writeSession(storage, {
        roomCode: response.roomCode,
        playerId: response.playerId,
        sessionToken: response.sessionToken,
        name: response.name,
      });
      dispatch({
        type: 'joined',
        roomCode: response.roomCode,
        playerId: response.playerId,
        name: response.name,
      });
      return;
    }

    if (stored && response.error.code === 'SEAT_IN_USE' && attempt < REENTER_ATTEMPTS) {
      setTimeout(() => {
        enterRoom(socket, storage, dispatch, attempt + 1);
      }, REENTER_RETRY_MS);
      return;
    }

    // The stored seat is no longer usable. Start fresh.
    if (stored) clearSession(storage);
    dispatch({ type: 'notice', message: response.error.message });
  });
}

export type GameActions = {
  leaveRoom: () => void;
  startNow: () => void;
  selectCard: (card: PlayedCard) => void;
  submitCard: (card: PlayedCard) => void;
  pickCard: (index: number) => void;
  dismissGained: () => void;
  continueToVillage: () => void;
  villageStep: (x: number, y: number, bump: boolean) => void;
  villageAccuse: (targetId: string, card: PlayedCard | null) => void;
  villageInsert: (value: CardValue) => void;
  villageChallenge: (targetId: string | null) => void;
  storyDone: () => void;
  clearNotice: () => void;
};

type RoundPairedPayload = { round: number; pairings: Pairing[]; warmUpPlayerId: string | null };
type RevealedPayload = {
  myValue: CardValue;
  opponentValue: CardValue;
  mySpecial: SpecialKind | null;
  opponentSpecial: SpecialKind | null;
};

export function useGame(): { state: GameState } & GameActions {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState);

  useEffect(() => {
    const socket = getSocket();
    const storage = browserStorage();
    let hasConnected = false;

    const onConnect = (): void => {
      hasConnected = true;
      dispatch({ type: 'connection', connection: 'connected' });
      enterRoom(socket, storage, dispatch);
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
      window.setTimeout(() => {
        dispatch({ type: 'discard-played' });
      }, DISCARD_AFTER_MS);
      dispatch({
        type: 'revealed',
        myValue: payload.myValue,
        opponentValue: payload.opponentValue,
        mySpecial: payload.mySpecial,
        opponentSpecial: payload.opponentSpecial,
      });
    };

    const onResult = (outcome: DuelOutcome): void => {
      dispatch({ type: 'duel-result', outcome });
    };

    const onNotice = (notice: PrivateNotice): void => {
      const sound = soundForNotice(notice);
      if (sound) playSfx(sound);
      if (notice.kind === 'auto-locked') {
        dispatch({ type: 'auto-locked' });
        return;
      }
      if (notice.kind === 'card-gained') {
        dispatch({ type: 'card-gained', value: notice.value });
      }
      dispatch({ type: 'special-notice', notice });
    };

    const onRoundEnded = (payload: { round: number; caughtCount: number }): void => {
      dispatch({ type: 'round-ended', round: payload.round, caughtCount: payload.caughtCount });
    };

    const onGameEnded = (summary: EndgameSummary): void => {
      dispatch({ type: 'game-ended', summary });
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
    socket.on('round:ended', onRoundEnded);
    subscriptions.push(() => {
      socket.off('round:ended', onRoundEnded);
    });
    socket.on('game:ended', onGameEnded);
    subscriptions.push(() => {
      socket.off('game:ended', onGameEnded);
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

  const leaveRoom = useCallback((): void => {
    const socket = getSocket();
    const storage = browserStorage();
    socket.emit('room:leave', {});
    clearSession(storage);
    dispatch({ type: 'left' });
    enterRoom(socket, storage, dispatch);
  }, []);

  const startNow = useCallback((): void => {
    getSocket().emit('lobby:start-now', {}, (response: PlainAck) => {
      if (!response.ok) dispatch({ type: 'notice', message: response.error.message });
    });
  }, []);

  const selectCard = useCallback((card: PlayedCard): void => {
    dispatch({ type: 'select', card });
  }, []);

  const submitCard = useCallback((card: PlayedCard): void => {
    // Show the card on the table at once. Revert if the server refuses it.
    dispatch({ type: 'lock', card });
    getSocket().emit('encounter:submit', card, (response: PlainAck) => {
      if (response.ok) return;
      dispatch({ type: 'unlock' });
      dispatch({ type: 'notice', message: response.error.message });
    });
  }, []);

  // Takes one card from the face-down pool. The server answers with the new hand and a notice.
  const pickCard = useCallback((index: number): void => {
    getSocket().emit('card:pick', { index }, (response: PlainAck) => {
      if (!response.ok) dispatch({ type: 'notice', message: response.error.message });
    });
  }, []);

  const dismissGained = useCallback((): void => {
    dispatch({ type: 'gained-done' });
  }, []);

  const continueToVillage = useCallback((): void => {
    dispatch({ type: 'continue-to-village' });
  }, []);

  // Village actions. The server answers with the new village and any notice for this player.
  const villageStep = useCallback((x: number, y: number, bump: boolean): void => {
    getSocket().emit('village:move', { x, y }, (response: PlainAck) => {
      if (!response.ok) {
        dispatch({ type: 'notice', message: response.error.message });
        return;
      }
      // Bumping into a player or the vending machine gets the success chime. Any other step gets the step sound.
      playSfx(bump ? 'success' : 'step');
    });
  }, []);

  const villageAccuse = useCallback((targetId: string, card: PlayedCard | null): void => {
    getSocket().emit('village:accuse', { targetId, card }, (response: PlainAck) => {
      if (!response.ok) dispatch({ type: 'notice', message: response.error.message });
    });
  }, []);

  const villageInsert = useCallback((value: CardValue): void => {
    getSocket().emit('village:vend', { value }, (response: PlainAck) => {
      if (!response.ok) dispatch({ type: 'notice', message: response.error.message });
    });
  }, []);

  // Challenge a player on the same tile to a duel next round. Null withdraws the challenge.
  const villageChallenge = useCallback((targetId: string | null): void => {
    getSocket().emit('village:challenge', { targetId }, (response: PlainAck) => {
      if (!response.ok) dispatch({ type: 'notice', message: response.error.message });
    });
  }, []);

  // The player has read the story, or skipped it. The village timer starts once everyone is past it.
  const storyDone = useCallback((): void => {
    getSocket().emit('story:done', {}, (response: PlainAck) => {
      if (!response.ok) dispatch({ type: 'notice', message: response.error.message });
    });
  }, []);

  const clearNotice = useCallback((): void => {
    dispatch({ type: 'notice', message: null });
  }, []);

  return {
    state,
    leaveRoom,
    startNow,
    selectCard,
    submitCard,
    pickCard,
    dismissGained,
    continueToVillage,
    villageStep,
    villageAccuse,
    villageInsert,
    villageChallenge,
    storyDone,
    clearNotice,
  };
}
