import type { ReactNode } from 'react';

type ButtonProps = {
  children: ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  type?: 'button' | 'submit';
};

// Touch target is at least 44 px tall (design/09 and design/05 section 8).
export function Button({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  type = 'button',
}: ButtonProps) {
  const base =
    'min-h-11 w-full rounded-xl px-4 py-3 text-base font-semibold transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:opacity-50';
  const styles =
    variant === 'primary'
      ? 'bg-coral text-sand hover:bg-shisa'
      : 'border-2 border-navy text-navy hover:bg-navy/10';

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${styles}`}>
      {children}
    </button>
  );
}
