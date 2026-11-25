import type { PublicRoomState } from '@shisa-revenge/shared';
import { LobbyPanel } from '../components/organisms/LobbyPanel.js';
import { StatusMessage } from '../components/molecules/StatusMessage.js';

type LobbyScreenProps = {
  room: PublicRoomState | null;
  selfId: string | null;
  name: string | null;
  notice: string | null;
  onStartNow: () => void;
  onLeave: () => void;
};

export function LobbyScreen({ room, selfId, name, notice, onStartNow, onLeave }: LobbyScreenProps) {
  if (!room) {
    return (
      <section className="flex flex-1 items-center justify-center">
        <StatusMessage showSpinner>Finding a room for you...</StatusMessage>
      </section>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 pt-6">
      {name ? (
        <p className="text-center text-sm text-navy/70">
          You are <span className="font-semibold text-navy">{name}</span>
        </p>
      ) : null}
      <LobbyPanel room={room} selfId={selfId} onStartNow={onStartNow} onLeave={onLeave} />
      <div className="mt-auto">
        {notice ? <StatusMessage tone="error">{notice}</StatusMessage> : null}
      </div>
    </div>
  );
}
