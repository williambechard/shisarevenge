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
import { VendingPanel } from '../components/organisms/VendingPanel.js';
import { VillageBoard } from '../components/organisms/VillageBoard.js';
import { VILLAGE_BACKGROUND_ART } from '../assets/village/index.js';
import type { GameState } from '../state/gameState.js';

// How long the bounce after a meeting lasts, before the overlay opens.
const MEETING_BOUNCE_MS = 700;

type VillageScreenProps = {
  state: GameState;
  room: PublicRoomState;
  onStep: (x: number, y: number) => void;
  onChallenge: (targetId: string | null) => void;
  onAccuse: (targetId: string, card: PlayedCard | null) => void;
  onInsert: (value: CardValue) => void;
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
}: VillageScreenProps) {
  // Which meeting the player has already dismissed. A new arrival on the tile opens the overlay again.
  const [walkedOn, setWalkedOn] = useState<string | null>(null);
  // The overlay waits for the bounce after a meeting to finish.
  const meetingAt = room.village?.meeting?.at ?? 0;
  const [readyFor, setReadyFor] = useState(0);
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
  const overlayOpen =
    !out &&
    onTile.length > 0 &&
    walkedOn !== meetingKey &&
    (meetingAt === 0 || readyFor === meetingAt);
  const onVending = here !== undefined && village.board[here.y]?.[here.x] === 'V';
  const hand = self?.hand ?? [];
  const special = self?.special?.status === 'available' ? self.special.kind : null;
  const recent = village.log.slice(-5);

  return (
    <section
      aria-labelledby="village-heading"
      className="flex flex-1 flex-col gap-4 rounded-xl bg-cover bg-center p-3"
      style={{
        backgroundImage: `url(${VILLAGE_BACKGROUND_ART})`,
      }}
    >
      <header className="flex justify-center">
        <Countdown deadline={village.endsAt} label="Next round in" />
      </header>

      <section
        aria-label="Tags and accusations"
        className="flex flex-col gap-1 text-xs text-navy/80"
      >
        <p className="font-semibold">Tags on the walkway</p>
        <ul className="flex flex-wrap gap-x-3 gap-y-1">
          {room.players.map((player) => (
            <li key={player.id} className={player.eliminated ? 'line-through' : ''}>
              {player.name}: {String(village.tags[player.id] ?? 0)}
              {village.revealed[player.id] === 'infected' ? " (Shisa's Army)" : ''}
            </li>
          ))}
        </ul>
        {recent.length > 0 ? (
          <>
            <p className="pt-1 font-semibold">Accusations</p>
            <ul className="flex flex-col gap-0.5">
              {recent.map((entry, index) => (
                <li key={index}>
                  {nameOf(room, entry.accuserId)} accused {nameOf(room, entry.targetId)}:{' '}
                  {entry.correct ? "correct, they served Shisa's Army" : 'not them'}
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </section>

      <VillageBoard
        board={village.board}
        meeting={village.meeting}
        positions={village.positions}
        players={room.players}
        selfId={selfId}
        onStep={onStep}
      />

      {notice ? <StatusMessage tone={notice.tone}>{notice.text}</StatusMessage> : null}

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

      {onVending && !out ? <VendingPanel hand={hand} onInsert={onInsert} /> : null}
    </section>
  );
}
