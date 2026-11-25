import { useState } from 'react';
import { Button } from '../components/atoms/Button.js';
import { StatusMessage } from '../components/molecules/StatusMessage.js';

type JoinScreenProps = {
  prefillCode: string;
  notice: string | null;
  onSubmit: (code: string, name: string) => void;
  onBack: () => void;
};

export function JoinScreen({ prefillCode, notice, onSubmit, onBack }: JoinScreenProps) {
  const [code, setCode] = useState(prefillCode);
  const [name, setName] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const submit = (): void => {
    const trimmedCode = code.trim().toUpperCase();
    const trimmedName = name.trim();
    if (trimmedCode.length === 0) {
      setLocalError('Enter the room code.');
      return;
    }
    if (trimmedName.length === 0) {
      setLocalError('Enter a display name.');
      return;
    }
    setLocalError(null);
    onSubmit(trimmedCode, trimmedName);
  };

  return (
    <section aria-labelledby="join-heading" className="flex flex-1 flex-col gap-6 pt-8">
      <h1 id="join-heading" className="text-3xl font-bold text-shisa">
        Join Game
      </h1>

      <label className="flex flex-col gap-2 text-sm font-semibold">
        Room code
        <input
          value={code}
          maxLength={6}
          autoCapitalize="characters"
          autoComplete="off"
          inputMode="text"
          onChange={(event) => {
            setCode(event.target.value.toUpperCase());
          }}
          className="min-h-11 rounded-xl border-2 border-navy/30 bg-white px-4 py-2 font-mono text-2xl tracking-widest text-navy focus-visible:outline-3 focus-visible:outline-gold"
        />
      </label>

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
        <Button onClick={submit}>Join</Button>
        <Button variant="secondary" onClick={onBack}>
          Back
        </Button>
      </div>

      <div className="mt-auto flex flex-col gap-2">
        {localError ? <StatusMessage tone="error">{localError}</StatusMessage> : null}
        {notice ? <StatusMessage tone="error">{notice}</StatusMessage> : null}
      </div>
    </section>
  );
}
