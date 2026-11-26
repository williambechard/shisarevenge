import type { PublicRoomState } from '@shisa-revenge/shared';
import { LobbyPanel } from '../components/organisms/LobbyPanel.js';
import { StatusMessage } from '../components/molecules/StatusMessage.js';
import { WaitingIndicator } from '../components/molecules/WaitingIndicator.js';

type LobbyScreenProps = {
  room: PublicRoomState | null;
  selfId: string | null;
  notice: string | null;
  onStartNow: () => void;
  onLeave: () => void;
};

export function LobbyScreen({ room, selfId, notice, onStartNow, onLeave }: LobbyScreenProps) {
  if (!room) {
    return (
      <section className="flex flex-1 items-center justify-center">
        <WaitingIndicator
          title="Finding a room"
          detail="Joining a lobby that has space, or starting a new one."
        />
      </section>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 pt-6">
      <LobbyPanel room={room} selfId={selfId} onStartNow={onStartNow} onLeave={onLeave} />
      <div className="mt-auto">
        {notice ? <StatusMessage tone="error">{notice}</StatusMessage> : null}
      </div>
    </div>
  );
}
