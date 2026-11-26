import type { ReactNode } from 'react';

type ButtonProps = {
  children: ReactNode;
  onClick: () => void;
  // onDark is for buttons on a dark background, such as the card preview. Its outline and text are sand.
  variant?: 'primary' | 'secondary' | 'onDark';
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
      : variant === 'onDark'
        ? 'border-2 border-sand bg-navy text-sand hover:bg-sand/10'
        : 'border-2 border-navy text-navy hover:bg-navy/10';

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${styles}`}>
      {children}
    </button>
  );
}
