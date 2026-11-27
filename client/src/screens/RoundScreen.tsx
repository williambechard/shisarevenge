import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
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
import { WaitingIndicator } from '../components/molecules/WaitingIndicator.js';
import { GainedCard } from '../components/organisms/GainedCard.js';
import { HandTray } from '../components/organisms/HandTray.js';
import { PickPanel } from '../components/organisms/PickPanel.js';
import { PlayArea } from '../components/organisms/PlayArea.js';
import { RevealPanel } from '../components/organisms/RevealPanel.js';
import { RoundTrack } from '../components/organisms/RoundTrack.js';
import { cardArt, NUMBER_CARD_ART, SPECIAL_CARD_ART } from '../assets/cards/index.js';
import type { GameState } from '../state/gameState.js';
import { ColdOverlay } from '../components/organisms/ColdOverlay.js';
import { canChooseCard, opponentIn } from '../state/roundPhase.js';

type RoundScreenProps = {
  state: GameState;
  room: PublicRoomState | null;
  onSelect: (card: PlayedCard) => void;
  onLockIn: (card: PlayedCard) => void;
  onPick: (index: number) => void;
  onGainedDone: () => void;
};

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

// The round screen: team bar, card counts, the table, the fan of cards, and the reveal once both
// players lock in. A winner of a duel takes a card here too, from a face-down pool. Every wait
// names what it is waiting for.
export function RoundScreen({
  state,
  room,
  onSelect,
  onLockIn,
  onPick,
  onGainedDone,
}: RoundScreenProps) {
  const view = state.roundView;
  const self = state.privateState;
  // The opponent is taken from this round's pairing. A name is shown only for a player who is still in the room and not out.
  const pairedOpponent = opponentIn(view?.pairings ?? [], state.playerId);
  const opponentPlayer =
    room?.players.find((player) => player.id === pairedOpponent && !player.eliminated) ?? null;
  const opponentId = opponentPlayer?.id ?? null;
  const opponentName = opponentPlayer ? opponentPlayer.name : 'your opponent';
  const isWarmUp = view !== null && view.warmUpPlayerId === state.playerId;
  const locked = self?.encounter?.selectionLocked ?? false;
  const reveal = state.reveal;
  const round = view?.round ?? 1;
  const phase = room?.phase ?? null;
  const notice = state.specialNotice ? noticeText(state.specialNotice) : null;
  // The cold overlay is shown once per notice, to the player who caught the cold only.
  const [coldSeen, setColdSeen] = useState<PrivateNotice | null>(null);
  const coldNotice = state.specialNotice?.kind === 'caught-cold' ? state.specialNotice : null;
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

  // What the player is waiting for right now, if anything. Null when the player has a choice to make.
  const waiting = (() => {
    if (out) return null;
    if (reveal !== null) {
      return phase === 'resolved'
        ? {
            title: 'Waiting for the round summary',
            detail: 'Any card still being taken is finished first.',
          }
        : {
            title: 'Waiting for the other duels',
            detail: 'The round ends when every duel and every card take is done.',
          };
    }
    if (phase === 'announce') {
      return {
        title: `Round ${String(round)} is starting`,
        detail: 'Pairing players. Each duel starts once everyone is paired.',
      };
    }
    if (isWarmUp) {
      return {
        title: 'Warm-Up: you sit out this round',
        detail: 'The other duels are still being played.',
      };
    }
    if (locked && canChooseCard(phase)) {
      return {
        title: `Waiting for ${opponentName} to lock in`,
        detail: 'Your card is locked. The duel reveals as soon as they lock in.',
      };
    }
    return null;
  })();

  return (
    <section aria-labelledby="round-heading" className="flex flex-1 flex-col gap-5 pt-4">
      <header className="flex flex-col gap-3">
        <h1 className="sr-only">
          Round {String(round)} of {String(ROUND_COUNT)}
        </h1>
        <RoundTrack current={round} total={ROUND_COUNT} />
        {room ? (
          <TeamBar survivors={room.teamCounts.survivors} infected={room.teamCounts.infected} />
        ) : null}
        {view?.deadline && !reveal && !isWarmUp && !out && canChooseCard(phase) && !locked ? (
          <Countdown deadline={view.deadline} label="Choose before" />
        ) : null}{' '}
      </header>

      {notice ? <StatusMessage tone={notice.tone}>{notice.text}</StatusMessage> : null}

      {out ? (
        <StatusMessage>You are out of the match. Watch the rest of the game.</StatusMessage>
      ) : opponentId && phase !== 'announce' ? (
        <PlayArea
          opponentName={opponentName}
          opponentCount={self?.encounter?.opponentCardCount ?? 0}
          opponentLocked={self?.encounter?.opponentLocked ?? false}
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

      {!out && !isWarmUp && reveal === null && self && canChooseCard(phase) ? (
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

      {waiting ? <WaitingIndicator title={waiting.title} detail={waiting.detail} /> : null}

      {coldNotice && coldNotice !== coldSeen ? (
        <ColdOverlay
          lostSpecial={coldNotice.lostSpecial}
          newSpecial={coldNotice.newSpecial}
          onDone={() => {
            setColdSeen(coldNotice);
          }}
        />
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

      <AnimatePresence>
        {state.gained ? (
          <GainedCard key={state.gained.nonce} value={state.gained.value} onDone={onGainedDone} />
        ) : null}
      </AnimatePresence>
    </section>
  );
}
