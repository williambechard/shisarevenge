import {
  CARD_NAMES,
  SPECIAL_NAMES,
  type CardValue,
  type PlayedCard,
  type PrivateNotice,
  type PublicRoomState,
  type SpecialKind,
} from '@shisa-revenge/shared';
import { Countdown } from '../components/atoms/Countdown.js';
import { StatusMessage } from '../components/molecules/StatusMessage.js';
import { AccusePanel } from '../components/organisms/AccusePanel.js';
import { VendingPanel } from '../components/organisms/VendingPanel.js';
import { VillageBoard } from '../components/organisms/VillageBoard.js';
import { VILLAGE_BACKGROUND_ART } from '../assets/village/index.js';
import type { GameState } from '../state/gameState.js';

type VillageScreenProps = {
  state: GameState;
  room: PublicRoomState;
  onStep: (x: number, y: number) => void;
  onAccuse: (targetId: string, card: PlayedCard | null) => void;
  onInsert: (value: CardValue) => void;
};

// What the village notices say, in words. Accusations never name the accuser.
function villageNoticeText(notice: PrivateNotice): { text: string; tone: 'info' | 'error' } | null {
  if (notice.kind === 'accused') {
    return {
      text: 'Someone has accused you. The tags on the walkway show how many.',
      tone: 'error',
    };
  }
  if (notice.kind === 'accusation-result') {
    return notice.correct
      ? { text: "Correct. They served Shisa's Army.", tone: 'info' }
      : { text: 'Not them. Your card is gone.', tone: 'info' };
  }
  if (notice.kind === 'vended') {
    if (notice.special !== null) {
      return { text: `The machine gave you a ${SPECIAL_NAMES[notice.special]}.`, tone: 'info' };
    }
    if (notice.value !== null) {
      return {
        text: `The machine gave you a ${String(notice.value)} ${CARD_NAMES[notice.value]}.`,
        tone: 'info',
      };
    }
  }
  return null;
}

function cardLabel(hand: CardValue[], special: SpecialKind | null): string {
  const numbers = [...hand].sort().map((value) => `${String(value)} ${CARD_NAMES[value]}`);
  const parts = special ? [...numbers, SPECIAL_NAMES[special]] : numbers;
  return parts.length > 0 ? parts.join(', ') : 'none';
}

// The village between matches: the walkway, the tags, the timer, and the actions for the tile you stand on.
export function VillageScreen({ state, room, onStep, onAccuse, onInsert }: VillageScreenProps) {
  const village = room.village;
  const self = state.privateState;
  const selfId = state.playerId;
  const out = room.players.find((player) => player.id === selfId)?.eliminated === true;
  const notice = state.specialNotice ? villageNoticeText(state.specialNotice) : null;

  if (village === null) {
    return <StatusMessage showSpinner>Opening the village...</StatusMessage>;
  }

  const here = selfId === null ? undefined : village.positions[selfId];
  const onTile = room.players.filter((player) => {
    if (player.id === selfId || here === undefined) return false;
    const at = village.positions[player.id];
    return at !== undefined && at.x === here.x && at.y === here.y;
  });
  const onVending = here !== undefined && village.board[here.y]?.[here.x] === 'V';
  const hand = self?.hand ?? [];
  const special = self?.special?.status === 'available' ? self.special.kind : null;

  return (
    <section
      aria-labelledby="village-heading"
      className="flex flex-1 flex-col gap-4 rounded-xl bg-cover bg-center p-3"
      style={{
        backgroundImage: `linear-gradient(rgba(247,241,227,0.86), rgba(247,241,227,0.94)), url(${VILLAGE_BACKGROUND_ART})`,
      }}
    >
      <header className="flex flex-col gap-2">
        <h1 id="village-heading" className="text-xl font-bold text-navy">
          The village
        </h1>
        <p className="text-sm text-navy/80">
          Walk the walkway between matches. Stand with someone to accuse them, or use the vending
          machine.
        </p>
        <Countdown deadline={village.endsAt} label="Next match in" />
      </header>

      <section aria-label="Tags" className="text-xs text-navy/80">
        <p className="font-semibold">Tags on the walkway</p>
        <ul className="flex flex-wrap gap-x-3 gap-y-1">
          {room.players.map((player) => (
            <li key={player.id}>
              {player.name}: {String(village.tags[player.id] ?? 0)}
            </li>
          ))}
        </ul>
      </section>

      <VillageBoard
        board={village.board}
        positions={village.positions}
        players={room.players}
        selfId={selfId}
        onStep={onStep}
      />

      {notice ? <StatusMessage tone={notice.tone}>{notice.text}</StatusMessage> : null}

      {out ? (
        <StatusMessage>
          You are out of the match. You can accuse for free, but you cannot join the next match.
        </StatusMessage>
      ) : (
        <p className="text-xs text-navy/80">Your cards: {cardLabel(hand, special)}</p>
      )}

      <AccusePanel
        targets={onTile.map((player) => ({ id: player.id, name: player.name }))}
        hand={hand}
        special={special}
        onAccuse={onAccuse}
      />

      {onVending && !out ? <VendingPanel hand={hand} onInsert={onInsert} /> : null}
    </section>
  );
}
