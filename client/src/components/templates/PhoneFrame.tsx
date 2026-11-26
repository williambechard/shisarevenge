import type { ReactNode } from 'react';

type PhoneFrameProps = {
  children: ReactNode;
  // An optional full-frame background image. It covers the whole frame, from top to bottom, behind the content.
  background?: string | undefined;
};

// Portrait container with safe-area padding. Every screen uses it.
export function PhoneFrame({ children, background }: PhoneFrameProps) {
  return (
    <div
      className={`mx-auto flex h-dvh w-full max-w-md flex-col overflow-hidden px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] text-navy ${background ? 'bg-cover bg-center' : 'bg-sand'}`}
      style={background ? { backgroundImage: `url(${background})` } : undefined}
    >
      {children}
    </div>
  );
}
