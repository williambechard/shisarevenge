import { useState } from 'react';

type RoomCodeProps = {
  code: string;
};

// Shows the room code large, with a copy button. Copy failures are shown as text.
export function RoomCode({ code }: RoomCodeProps) {
  const [copied, setCopied] = useState<'idle' | 'copied' | 'failed'>('idle');

  const copy = (): void => {
    navigator.clipboard
      .writeText(code)
      .then(() => {
        setCopied('copied');
      })
      .catch(() => {
        setCopied('failed');
      });
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-sm text-navy/70">Room code</p>
      <p
        className="font-mono text-4xl font-bold tracking-widest text-navy"
        aria-label={`Room code ${code.split('').join(' ')}`}
      >
        {code}
      </p>
      <button
        type="button"
        onClick={copy}
        className="min-h-11 rounded-lg px-4 text-sm font-semibold text-sea underline underline-offset-4"
      >
        Copy code
      </button>
      <p role="status" className="text-xs text-navy/70">
        {copied === 'copied'
          ? 'Copied.'
          : copied === 'failed'
            ? 'Copy failed. Type the code instead.'
            : ''}
      </p>
    </div>
  );
}
