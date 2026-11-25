import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import type { PublicRoomState } from '@shisa-revenge/shared';
import { Button } from '../atoms/Button.js';
import { RoomCode } from '../molecules/RoomCode.js';
import { PlayerList } from './PlayerList.js';

type LobbyPanelProps = {
  room: PublicRoomState;
  selfId: string | null;
  onToggleReady: (ready: boolean) => void;
  onLeave: () => void;
};

// The join link opens the join screen with the code filled in.
export function joinLinkFor(origin: string, code: string): string {
  return `${origin}/?room=${encodeURIComponent(code)}`;
}

export function LobbyPanel({ room, selfId, onToggleReady, onLeave }: LobbyPanelProps) {
  const [qrSrc, setQrSrc] = useState<string | null>(null);
  const me = room.players.find((player) => player.id === selfId);
  const link = joinLinkFor(window.location.origin, room.roomCode);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(link, { margin: 1, width: 220 })
      .then((url) => {
        if (!cancelled) setQrSrc(url);
      })
      .catch(() => {
        if (!cancelled) setQrSrc(null);
      });
    return () => {
      cancelled = true;
    };
  }, [link]);

  return (
    <section aria-labelledby="lobby-heading" className="flex w-full flex-col items-center gap-6">
      <h1 id="lobby-heading" className="text-2xl font-bold text-navy">
        Lobby
      </h1>

      <RoomCode code={room.roomCode} />

      {qrSrc ? (
        <img
          src={qrSrc}
          alt={`QR code that opens the game with room code ${room.roomCode}`}
          width={220}
          height={220}
          className="rounded-xl bg-white p-2"
        />
      ) : null}

      <PlayerList players={room.players} selfId={selfId} />

      <div className="flex w-full flex-col gap-3">
        <Button
          variant={me?.ready ? 'secondary' : 'primary'}
          onClick={() => {
            onToggleReady(!(me?.ready ?? false));
          }}
        >
          {me?.ready ? 'Not ready' : 'Ready'}
        </Button>
        <Button variant="secondary" onClick={onLeave}>
          Leave room
        </Button>
      </div>
    </section>
  );
}
