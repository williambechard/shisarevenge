import { MAX_PLAYERS, type PublicRoomState } from '@shisa-revenge/shared';
import { Button } from '../atoms/Button.js';
import { Countdown } from '../atoms/Countdown.js';
import { PlayerList } from './PlayerList.js';

type LobbyPanelProps = {
  room: PublicRoomState;
  selfId: string | null;
  onStartNow: () => void;
  onLeave: () => void;
};

// The lobby shows who is here and how many seats are left. The game starts when the room is full.
export function LobbyPanel({ room, selfId, onStartNow, onLeave }: LobbyPanelProps) {
  const count = room.players.length;
  const remaining = MAX_PLAYERS - count;

  return (
    <section aria-labelledby="lobby-heading" className="flex w-full flex-col items-center gap-6">
      <h1 id="lobby-heading" className="text-2xl font-bold text-navy">
        Waiting for players
      </h1>

      <p className="text-center text-base">
        {count} of {MAX_PLAYERS} here.{' '}
        {remaining > 0
          ? `${String(remaining)} more ${remaining === 1 ? 'seat' : 'seats'} to fill. The game starts when the room is full, or when the wait ends with at least 4 players.`
          : 'The game is starting.'}
      </p>

      <PlayerList players={room.players} selfId={selfId} />

      <div className="flex w-full flex-col gap-3">
        {room.startAvailable ? (
          <Button onClick={onStartNow}>Start with {count} players</Button>
        ) : room.startsAt !== null && remaining > 0 ? (
          <Countdown deadline={room.startsAt} label="Start available in" />
        ) : null}
        <Button variant="secondary" onClick={onLeave}>
          Leave room
        </Button>
      </div>
    </section>
  );
}
