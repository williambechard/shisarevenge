import {
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
import { PlayArea } from '../components/organisms/PlayArea.js';
import { RevealPanel } from '../components/organisms/RevealPanel.js';
import { cardArt, NUMBER_CARD_ART, SPECIAL_CARD_ART } from '../assets/cards/index.js';
import type { GameState } from '../state/gameState.js';

type RoundScreenProps = {
  state: GameState;
  room: PublicRoomState | null;
  onSelect: (card: PlayedCard) => void;
  onLockIn: (card: PlayedCard) => void;
};

function nameOf(room: PublicRoomState | null, playerId: string | null): string {
  return room?.players.find((player) => player.id === playerId)?.name ?? 'Opponent';
}

// Lost or gained specials are always said in words, and the player is told each time.
function noticeText(notice: PrivateNotice): string | null {
  if (notice.kind === 'caught-cold') {
    const lost = notice.lostSpecial ? ` Your ${SPECIAL_NAMES[notice.lostSpecial]} is gone.` : '';
    return `You caught a cold.${lost} You now have a ${SPECIAL_NAMES[notice.newSpecial]}.`;
  }
  if (notice.kind === 'recovered') {
    return `You recovered. Your ${SPECIAL_NAMES[notice.lostSpecial ?? 'shisa-mask']} is gone. You now have a ${SPECIAL_NAMES[notice.newSpecial]}.`;
  }
  return null;
}

// The round screen: team bar, the table, the fan of cards, and the reveal once both players lock in.
export function RoundScreen({ state, room, onSelect, onLockIn }: RoundScreenProps) {
  const view = state.roundView;
  const self = state.privateState;
  const opponentId = self?.encounter?.opponentId ?? null;
  const opponentName = nameOf(room, opponentId);
  const isWarmUp = view !== null && view.warmUpPlayerId === state.playerId;
  const locked = self?.encounter?.selectionLocked ?? false;
  const reveal = state.reveal;
  const round = view?.round ?? 1;
  const notice = state.specialNotice ? noticeText(state.specialNotice) : null;

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
        {view?.deadline && !reveal && !isWarmUp ? (
          <Countdown deadline={view.deadline} label="Choose before" />
        ) : null}
      </header>

      {notice ? (
        <StatusMessage tone={state.specialNotice?.kind === 'caught-cold' ? 'error' : 'info'}>
          {notice}
        </StatusMessage>
      ) : null}

      {isWarmUp ? (
        <StatusMessage>Warm-Up: you sit out this round.</StatusMessage>
      ) : opponentId ? (
        <PlayArea
          opponentName={opponentName}
          mySlot={mySlot}
          opponentFront={opponentFront}
          revealed={reveal !== null}
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

      {!isWarmUp && reveal === null && self ? (
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

      {!isWarmUp && locked && reveal === null ? (
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
    </section>
  );
}
