import type { PublicRoomState } from '@shisa-revenge/shared';
import { LobbyPanel } from '../components/organisms/LobbyPanel.js';
import { StatusMessage } from '../components/molecules/StatusMessage.js';

type LobbyScreenProps = {
  room: PublicRoomState | null;
  selfId: string | null;
  notice: string | null;
  onToggleReady: (ready: boolean) => void;
  onStart: () => void;
  onLeave: () => void;
};

export function LobbyScreen({
  room,
  selfId,
  notice,
  onToggleReady,
  onStart,
  onLeave,
}: LobbyScreenProps) {
  if (!room) {
    return (
      <section className="flex flex-1 items-center justify-center">
        <StatusMessage showSpinner>Loading the lobby...</StatusMessage>
      </section>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 pt-6">
      <LobbyPanel
        room={room}
        selfId={selfId}
        onToggleReady={onToggleReady}
        onStart={onStart}
        onLeave={onLeave}
      />
      <div className="mt-auto">
        {notice ? <StatusMessage tone="error">{notice}</StatusMessage> : null}
      </div>
    </div>
  );
}
