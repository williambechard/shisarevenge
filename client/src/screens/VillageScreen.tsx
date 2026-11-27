import { useEffect, useState } from 'react';
import {
  CARD_NAMES,
  SPECIAL_NAMES,
  type CardValue,
  type PlayedCard,
  type PrivateNotice,
  type PublicRoomState,
} from '@shisa-revenge/shared';
import { Button } from '../components/atoms/Button.js';
import { Countdown } from '../components/atoms/Countdown.js';
import { StatusMessage } from '../components/molecules/StatusMessage.js';
import { AccusePanel } from '../components/organisms/AccusePanel.js';
import { LockInOverlay } from '../components/organisms/LockInOverlay.js';
import { VendingPanel } from '../components/organisms/VendingPanel.js';
import { VillageBoard } from '../components/organisms/VillageBoard.js';
import type { GameState } from '../state/gameState.js';

// How long the glide and recoil after a meeting take, before the overlay opens (450 ms glide, 300 ms recoil).
const MEETING_BOUNCE_MS = 800;
// How long a new accusation stays on screen for everyone.
const ACCUSATION_NOTE_MS = 6000;
// How long the vending hint stays above the machine.
const VENDING_HINT_MS = 3000;
// Village messages sit on a dark card, so white text stays readable over the background.
const VILLAGE_NOTICE_MS = 3500;
const noticeCard = 'rounded-xl bg-navy/90 px-4 py-3 text-sm text-white shadow-md';

type VillageScreenProps = {
  state: GameState;
  room: PublicRoomState;
  onStep: (x: number, y: number) => void;
  onChallenge: (targetId: string | null) => void;
  onAccuse: (targetId: string, card: PlayedCard | null) => void;
  onInsert: (value: CardValue) => void;
  // A message for this player from the last village action, or null.
  message: string | null;
  onClearNotice: () => void;
};

function nameOf(room: PublicRoomState, playerId: string): string {
  return room.players.find((player) => player.id === playerId)?.name ?? 'A player';
}

// What the village notices say, in words. Only the people involved see their own notices.
function villageNoticeText(
  notice: PrivateNotice,
  room: PublicRoomState,
): { text: string; tone: 'info' | 'error' } | null {
  if (notice.kind === 'accused') {
    return { text: 'Someone has accused you. The log shows who.', tone: 'error' };
  }
  if (notice.kind === 'accusation-result') {
    return notice.correct
      ? { text: "Correct. They served Shisa's Army, and everyone now knows.", tone: 'info' }
      : { text: 'Not them. Your card is gone.', tone: 'info' };
  }
  if (notice.kind === 'challenged') {
    return {
      text: `${nameOf(room, notice.byId)} challenged you. Challenge them back to pair up.`,
      tone: 'info',
    };
  }
  if (notice.kind === 'partnered') {
    return {
      text: `You are partners with ${nameOf(room, notice.partnerId)} for the next round.`,
      tone: 'info',
    };
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

// The village between rounds and between matches: the walkway, the public log, the timer, and the
// meeting overlay when two or more players share a tile.
export function VillageScreen({
  state,
  room,
  onStep,
  onChallenge,
  onAccuse,
  onInsert,
  message,
  onClearNotice,
}: VillageScreenProps) {
  // Which meeting the player has already dismissed. A new arrival on the tile opens the overlay again.
  const [walkedOn, setWalkedOn] = useState<string | null>(null);
  // The vending panel opens when the player taps the machine from a tile next to it.
  const [vendingOpen, setVendingOpen] = useState(false);
  // Village messages go away after a few seconds.
  useEffect(() => {
    if (message === null) return;
    const handle = setTimeout(() => {
      onClearNotice();
    }, VILLAGE_NOTICE_MS);
    return () => {
      clearTimeout(handle);
    };
  }, [message, onClearNotice]);
  // A short hint above the machine, shown when the player taps it without a duplicate card.
  const [hint, setHint] = useState<{ id: number } | null>(null);
  useEffect(() => {
    if (hint === null) return;
    const handle = setTimeout(() => {
      setHint((current) => (current === hint ? null : current));
    }, VENDING_HINT_MS);
    return () => {
      clearTimeout(handle);
    };
  }, [hint]);
  // The overlay waits for the bounce after a meeting to finish.
  const meetingAt = room.village?.meeting?.at ?? 0;
  const [readyFor, setReadyFor] = useState(0);
  // The newest accusation, shown briefly to everyone. The full log stays in the village state.
  const logLength = room.village?.log.length ?? 0;
  const latestEntry = room.village?.log.at(-1);
  const latestNote = latestEntry
    ? `${nameOf(room, latestEntry.accuserId)} accused ${nameOf(room, latestEntry.targetId)}: ${latestEntry.correct ? "correct, they served Shisa's Army" : 'not them'}`
    : null;
  // Hides the note once it has been on screen for a while. Keyed by the log length, so each new entry shows once.
  const [hiddenLogLength, setHiddenLogLength] = useState(-1);
  const note = latestNote !== null && logLength !== hiddenLogLength ? latestNote : null;
  useEffect(() => {
    if (logLength === 0) return;
    const handle = setTimeout(() => {
      setHiddenLogLength(logLength);
    }, ACCUSATION_NOTE_MS);
    return () => {
      clearTimeout(handle);
    };
  }, [logLength]);
  useEffect(() => {
    if (meetingAt === 0) return;
    const handle = setTimeout(() => {
      setReadyFor(meetingAt);
    }, MEETING_BOUNCE_MS);
    return () => {
      clearTimeout(handle);
    };
  }, [meetingAt]);
  const village = room.village;
  const self = state.privateState;
  const selfId = state.playerId;
  const out = room.players.find((player) => player.id === selfId)?.eliminated === true;
  const notice = state.specialNotice ? villageNoticeText(state.specialNotice, room) : null;

  if (village === null) {
    return <StatusMessage showSpinner>Opening the village...</StatusMessage>;
  }

  const here = selfId === null ? undefined : village.positions[selfId];
  const onTile = room.players.filter((player) => {
    if (player.id === selfId || here === undefined || player.eliminated) return false;
    const at = village.positions[player.id];
    return at !== undefined && at.x === here.x && at.y === here.y;
  });
  const meetingKey = `${String(here?.x)},${String(here?.y)}:${onTile.map((player) => player.id).join(',')}`;
  // A challenge locks both players until the next round starts.
  const pair = room.village?.partners.find(([a, b]) => a === selfId || b === selfId);
  const partnerId = pair ? (pair[0] === selfId ? pair[1] : pair[0]) : null;
  const partner = room.players.find((player) => player.id === partnerId);
  const me = room.players.find((player) => player.id === selfId);
  const lockedPair = partner !== undefined && me !== undefined ? { partner, me } : null;
  const locked = lockedPair !== null;
  const overlayOpen =
    !out &&
    !locked &&
    onTile.length > 0 &&
    walkedOn !== meetingKey &&
    (meetingAt === 0 || readyFor === meetingAt);
  const isMachine = (x: number, y: number): boolean => village.board[y]?.[x] === 'V';
  const onMachine = here !== undefined && isMachine(here.x, here.y);
  const nextToMachine =
    here !== undefined &&
    [
      [here.x + 1, here.y],
      [here.x - 1, here.y],
      [here.x, here.y + 1],
      [here.x, here.y - 1],
    ].some(([x, y]) => x !== undefined && y !== undefined && isMachine(x, y));
  const hand = self?.hand ?? [];
  const hasDuplicate = new Set(hand).size < hand.length;
  const special = self?.special?.status === 'available' ? self.special.kind : null;

  return (
    <section aria-labelledby="village-heading" className="flex min-h-0 flex-1 flex-col gap-4">
      <header className="flex justify-center">
        <Countdown deadline={village.endsAt} label="Next round in" />
      </header>

      {note ? (
        <div role="status" aria-live="polite" className={noticeCard}>
          {note}
        </div>
      ) : null}

      <VillageBoard
        board={village.board}
        meeting={village.meeting}
        positions={village.positions}
        players={room.players}
        selfId={selfId}
        onStep={(x, y) => {
          setVendingOpen(false);
          onStep(x, y);
          // Stepping onto the machine opens its panel when you hold a duplicate, or shows the hint otherwise.
          if (village.board[y]?.[x] === 'V') {
            if (hasDuplicate) {
              setVendingOpen(true);
            } else {
              setHint({ id: Date.now() });
            }
          }
        }}
        vendingHint={
          hint
            ? 'Vending machine. Insert two copies of a card to get a random one. No duplicates in your hand.'
            : null
        }
      />

      {notice ? (
        <div role="status" aria-live="polite" className={noticeCard}>
          {notice.text}
        </div>
      ) : null}

      {lockedPair ? (
        <LockInOverlay
          self={{ name: lockedPair.me.name, icon: lockedPair.me.icon }}
          partner={{ name: lockedPair.partner.name, icon: lockedPair.partner.icon }}
        />
      ) : null}
      {message ? (
        <div role="status" aria-live="polite" className={noticeCard}>
          {message}
        </div>
      ) : null}
      {overlayOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Someone is here"
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy/70 p-4"
        >
          <div className="flex w-full max-w-sm flex-col gap-3 rounded-xl bg-sand p-4 text-navy">
            <h2 className="text-lg font-bold">
              {onTile.length === 1 ? `${onTile[0]?.name ?? 'Someone'} is here` : 'Others are here'}
            </h2>
            {onTile.map((player) => {
              return (
                <div key={player.id} className="flex flex-col gap-2 border-b border-navy/20 pb-2">
                  <p className="font-semibold">{player.name}</p>
                  <Button
                    onClick={() => {
                      onChallenge(player.id);
                    }}
                  >
                    Challenge {player.name} to a duel next round
                  </Button>
                  <AccusePanel
                    targets={[{ id: player.id, name: player.name }]}
                    hand={hand}
                    special={special}
                    onAccuse={onAccuse}
                  />
                </div>
              );
            })}
            <Button
              variant="secondary"
              onClick={() => {
                setWalkedOn(meetingKey);
              }}
            >
              Walk on
            </Button>
          </div>
        </div>
      ) : null}

      {vendingOpen && (nextToMachine || onMachine) && !out && !locked ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Vending machine"
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy/70 p-4"
        >
          <div className="flex w-full max-w-sm flex-col gap-3 rounded-xl bg-sand p-4 text-navy">
            <VendingPanel hand={hand} onInsert={onInsert} />
            <Button
              variant="secondary"
              onClick={() => {
                setVendingOpen(false);
              }}
            >
              Close
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
