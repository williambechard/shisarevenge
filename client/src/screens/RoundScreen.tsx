import { ROUND_COUNT, type CardValue, type PublicRoomState } from '@shisa-revenge/shared';
import { Countdown } from '../components/atoms/Countdown.js';
import { StatusMessage } from '../components/molecules/StatusMessage.js';
import { HandTray } from '../components/organisms/HandTray.js';
import { RevealPanel } from '../components/organisms/RevealPanel.js';
import type { GameState } from '../state/gameState.js';

type RoundScreenProps = {
  state: GameState;
  room: PublicRoomState | null;
  onSelect: (value: CardValue) => void;
  onLockIn: () => void;
};

function nameOf(room: PublicRoomState | null, playerId: string | null): string {
  return room?.players.find((player) => player.id === playerId)?.name ?? 'Opponent';
}

// The round screen: opponent, timer, hand, lock-in, and the reveal once both players lock in.
export function RoundScreen({ state, room, onSelect, onLockIn }: RoundScreenProps) {
  const view = state.roundView;
  const self = state.privateState;
  const opponentId = self?.encounter?.opponentId ?? null;
  const opponentName = nameOf(room, opponentId);
  const isWarmUp = view !== null && view.warmUpPlayerId === state.playerId;
  const locked = self?.encounter?.selectionLocked ?? false;
  const reveal = state.reveal;

  const winner: 'me' | 'opponent' | 'tie' =
    reveal === null
      ? 'tie'
      : state.duel?.result === 'won'
        ? 'me'
        : state.duel?.result === 'lost'
          ? 'opponent'
          : 'tie';

  return (
    <section aria-labelledby="round-heading" className="flex flex-1 flex-col gap-5 pt-4">
      <header className="flex flex-col gap-1">
        <h1 id="round-heading" className="text-2xl font-bold text-shisa">
          Round {view ? String(view.round) : '1'} of {String(ROUND_COUNT)}
        </h1>
        {view?.deadline && !reveal && !isWarmUp ? (
          <Countdown deadline={view.deadline} label="Choose before" />
        ) : null}
      </header>

      {isWarmUp ? (
        <StatusMessage>Warm-Up: you sit out this round.</StatusMessage>
      ) : opponentId ? (
        <p className="text-base">
          Your opponent: <span className="font-semibold">{opponentName}</span>
        </p>
      ) : null}

      {!isWarmUp && reveal === null && self ? (
        <HandTray
          hand={self.hand}
          selected={state.selected}
          locked={locked}
          onSelect={onSelect}
          onLockIn={onLockIn}
        />
      ) : null}

      {!isWarmUp && locked && reveal === null ? (
        <StatusMessage>Waiting for {opponentName} to lock in.</StatusMessage>
      ) : null}

      {state.autoLocked && reveal === null ? (
        <StatusMessage>Time ran out. Your lowest card was locked in for you.</StatusMessage>
      ) : null}

      {reveal ? (
        <RevealPanel
          myValue={reveal.myValue}
          opponentValue={reveal.opponentValue}
          opponentName={opponentName}
          winner={winner}
        />
      ) : null}
    </section>
  );
}
