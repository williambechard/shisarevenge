import type { ReactNode } from 'react';
import { Spinner } from '../atoms/Spinner.js';

type StatusMessageProps = {
  children: ReactNode;
  tone?: 'info' | 'error';
  showSpinner?: boolean;
};

// Live status text. Screen readers announce changes politely.
export function StatusMessage({
  children,
  tone = 'info',
  showSpinner = false,
}: StatusMessageProps) {
  const color = tone === 'error' ? 'text-shisa' : 'text-navy';
  return (
    <div role="status" aria-live="polite" className={`flex items-center gap-2 text-sm ${color}`}>
      {showSpinner ? <Spinner /> : null}
      <span>{children}</span>
    </div>
  );
}
