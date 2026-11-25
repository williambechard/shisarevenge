import type { ReactNode } from 'react';

type PhoneFrameProps = {
  children: ReactNode;
};

// Portrait container with safe-area padding. Every screen uses it.
export function PhoneFrame({ children }: PhoneFrameProps) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-sand px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] text-navy">
      {children}
    </div>
  );
}
