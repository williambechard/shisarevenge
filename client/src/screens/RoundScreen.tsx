import { AnimatePresence, motion } from 'motion/react';
import {
  CARD_NAMES,
  ROUND_COUNT,
  SPECIAL_NAMES,
  type PlayedCard,
  type PrivateNotice,
  type PublicRoomState,
} from '@shisa-revenge/shared';
import { Countdown } from '../components/atoms/Countdown.js';
import { Announcement } from '../components/molecules/Announcement.js';
import { StatusMessage } from '../components/molecules/StatusMessage.js';
import { TeamBar } from '../components/molecules/TeamBar.js';
import { HandTray } from '../components/organisms/HandTray.js';
import { PickPanel } from '../components/organisms/PickPanel.js';
import { PlayArea } from '../components/organisms/PlayArea.js';
import { RevealPanel } from '../components/organisms/RevealPanel.js';
import { cardArt, NUMBER_CARD_ART, SPECIAL_CARD_ART } from '../assets/cards/index.js';
import type { GameState } from '../state/gameState.js';

type RoundScreenProps = {
  state: GameState;
  room: PublicRoomState | null;
  onSelect: (card: PlayedCard) => void;
  onLockIn: (card: PlayedCard) => void;
  onPick: (index: number) => void;
};

function nameOf(room: PublicRoomState | null, playerId: string | null): string {
  return room?.players.find((player) => player.id === playerId)?.name ?? 'Opponent';
}

// Each notice is said in words, so the player knows what changed and why.
function noticeText(notice: PrivateNotice): { text: string; tone: 'info' | 'error' } | null {
  if (notice.kind === 'caught-cold') {
    const lost = notice.lostSpecial ? ` Your ${SPECIAL_NAMES[notice.lostSpecial]} is gone.` : '';
    return {
      text: `You caught a cold.${lost} You now have a ${SPECIAL_NAMES[notice.newSpecial]}.`,
      tone: 'error',
    };
  }
  if (notice.kind === 'recovered') {
    return {
      text: `You recovered. Your ${SPECIAL_NAMES[notice.lostSpecial ?? 'shisa-mask']} is gone. You now have a ${SPECIAL_NAMES[notice.newSpecial]}.`,
      tone: 'info',
    };
  }
  if (notice.kind === 'card-gained') {
    return {
      text: `You took a ${String(notice.value)} ${CARD_NAMES[notice.value]}.`,
      tone: 'info',
    };
  }
  if (notice.kind === 'card-lost') {
    return { text: 'A card was taken from your hand.', tone: 'info' };
  }
  if (notice.kind === 'eliminated') {
    return {
      text: 'You have no cards left. You are out, but you can watch the match.',
      tone: 'error',
    };
  }
  return null;
}

// Everyone can see how many cards each player holds, updated at each round summary.
function CardCounts({ room }: { room: PublicRoomState }) {
  return (
    <section aria-label="Cards left" className="text-xs text-navy/80">
      <p className="font-semibold">Cards left</p>
      <ul className="flex flex-wrap gap-x-3 gap-y-1">
        {room.players.map((player) => (
          <motion.li
            key={player.id}
            animate={{
              opacity: player.eliminated ? 0.45 : 1,
              filter: player.eliminated ? 'grayscale(1)' : 'grayscale(0)',
            }}
            transition={{ duration: 0.8 }}
            className={player.eliminated ? 'line-through' : ''}
          >
            {player.name}:{' '}
            {player.eliminated ? 'out' : player.cardCount === null ? '-' : String(player.cardCount)}
          </motion.li>
        ))}
      </ul>
    </section>
  );
}

// The round screen: team bar, card counts, the table, the fan of cards, and the reveal once both
// players lock in. A winner of a duel takes a card here too, from a face-down pool.
export function RoundScreen({ state, room, onSelect, onLockIn, onPick }: RoundScreenProps) {
  const view = state.roundView;
  const self = state.privateState;
  const opponentId = self?.encounter?.opponentId ?? null;
  const opponentName = nameOf(room, opponentId);
  const isWarmUp = view !== null && view.warmUpPlayerId === state.playerId;
  const locked = self?.encounter?.selectionLocked ?? false;
  const reveal = state.reveal;
  const round = view?.round ?? 1;
  const notice = state.specialNotice ? noticeText(state.specialNotice) : null;
  const out = room?.players.find((player) => player.id === state.playerId)?.eliminated === true;
  const pending = self?.pendingPick ?? null;

  // Art for the card on the table. Once revealed, the revealed card is the source.
  const lockedFront =
    state.lockedCard === null
      ? null
      : state.lockedCard.type === 'number'
        ? NUMBER_CARD_ART[state.lockedCard.value]
        : self?.special
          ? SPECIAL_CARD_ART[self.special.kind]
          : null;
  const mySlot = reveal
    ? { front: cardArt(reveal.myValue, reveal.mySpecial) }
    : lockedFront
      ? { front: lockedFront }
      : null;
  const opponentFront = reveal ? cardArt(reveal.opponentValue, reveal.opponentSpecial) : null;

  return (
    <section aria-labelledby="round-heading" className="flex flex-1 flex-col gap-5 pt-4">
      <header className="flex flex-col gap-2">
        <h1 id="round-heading" className="text-2xl font-bold text-shisa">
          Round {String(round)} of {String(ROUND_COUNT)}
        </h1>
        {room ? (
          <TeamBar
            survivors={room.teamCounts.survivors}
            infected={room.teamCounts.infected}
            round={round}
          />
        ) : null}
        {room ? <CardCounts room={room} /> : null}
        {view?.deadline && !reveal && !isWarmUp && !out ? (
          <Countdown deadline={view.deadline} label="Choose before" />
        ) : null}
      </header>

      {notice ? <StatusMessage tone={notice.tone}>{notice.text}</StatusMessage> : null}

      {out ? (
        <StatusMessage>You are out of the match. Watch the rest of the game.</StatusMessage>
      ) : isWarmUp ? (
        <StatusMessage>Warm-Up: you sit out this round.</StatusMessage>
      ) : opponentId ? (
        <PlayArea
          opponentName={opponentName}
          mySlot={mySlot}
          opponentFront={opponentFront}
          revealed={reveal !== null}
          discarded={state.playedDiscarded}
        />
      ) : null}

      {reveal ? (
        <RevealPanel
          myValue={reveal.myValue}
          opponentValue={reveal.opponentValue}
          opponentName={opponentName}
          result={state.duel?.result ?? 'tie'}
          mySpecial={reveal.mySpecial}
          opponentSpecial={reveal.opponentSpecial}
        />
      ) : null}

      {!out && !isWarmUp && reveal === null && self ? (
        <HandTray
          key={round}
          hand={self.hand}
          selected={state.selected}
          lockedCard={state.lockedCard}
          locked={locked}
          special={self.special}
          onSelect={onSelect}
          onLockIn={onLockIn}
        />
      ) : null}

      {!out && !isWarmUp && locked && reveal === null ? (
        <StatusMessage>Waiting for {opponentName} to lock in.</StatusMessage>
      ) : null}

      {state.autoLocked && reveal === null ? (
        <StatusMessage>Time ran out. Your lowest card was locked in for you.</StatusMessage>
      ) : null}

      {state.roundSummary ? (
        <Announcement
          round={state.roundSummary.round}
          caughtCount={state.roundSummary.caughtCount}
        />
      ) : null}

      <AnimatePresence>
        {pending ? (
          <PickPanel
            key="pick"
            loserName={opponentName}
            poolSize={pending.poolSize}
            deadline={pending.deadline}
            onPick={onPick}
          />
        ) : null}
      </AnimatePresence>
    </section>
  );
}
