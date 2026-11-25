import { useState } from 'react';
import { Button } from '../components/atoms/Button.js';
import { StatusMessage } from '../components/molecules/StatusMessage.js';
import type { ConnectionState } from '../state/gameState.js';

type LandingScreenProps = {
  connection: ConnectionState;
  notice: string | null;
  onCreate: (name: string) => void;
  onJoin: () => void;
};

export function LandingScreen({ connection, notice, onCreate, onJoin }: LandingScreenProps) {
  const [name, setName] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const trimmed = name.trim();

  const create = (): void => {
    if (trimmed.length === 0) {
      setLocalError('Enter a display name first.');
      return;
    }
    setLocalError(null);
    onCreate(trimmed);
  };

  return (
    <section aria-labelledby="landing-heading" className="flex flex-1 flex-col gap-6 pt-8">
      <header className="flex flex-col items-center gap-2 text-center">
        <h1 id="landing-heading" className="text-4xl font-bold text-shisa">
          Shisa Revenge
        </h1>
        <p className="text-sm text-navy/70">A winter party card game from Okinawa</p>
      </header>

      <label className="flex flex-col gap-2 text-sm font-semibold">
        Display name
        <input
          value={name}
          maxLength={16}
          autoComplete="nickname"
          onChange={(event) => {
            setName(event.target.value);
          }}
          className="min-h-11 rounded-xl border-2 border-navy/30 bg-white px-4 py-2 text-base font-normal text-navy focus-visible:outline-3 focus-visible:outline-gold"
        />
      </label>

      <div className="flex flex-col gap-3">
        <Button onClick={create}>Create Game</Button>
        <Button
          variant="secondary"
          onClick={() => {
            onJoin();
          }}
        >
          Join Game
        </Button>
      </div>

      <div className="mt-auto flex flex-col gap-2">
        {connection === 'waking' ? (
          <StatusMessage showSpinner>
            Server waking up. The first connection can take up to a minute.
          </StatusMessage>
        ) : null}
        {connection === 'connecting' ? (
          <StatusMessage showSpinner>Connecting...</StatusMessage>
        ) : null}
        {connection === 'reconnecting' ? (
          <StatusMessage showSpinner>Reconnecting...</StatusMessage>
        ) : null}
        {connection === 'offline' ? (
          <StatusMessage tone="error">You are offline.</StatusMessage>
        ) : null}
        {localError ? <StatusMessage tone="error">{localError}</StatusMessage> : null}
        {notice ? <StatusMessage tone="error">{notice}</StatusMessage> : null}
      </div>
    </section>
  );
}
