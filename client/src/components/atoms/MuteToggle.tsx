import { useSyncExternalStore } from 'react';
import { isMuted, subscribeMuted, toggleMuted } from '../../audio/audioManager.js';

// Turns all sound on or off. The choice is kept between visits.
export function MuteToggle() {
  const muted = useSyncExternalStore(subscribeMuted, isMuted, isMuted);
  return (
    <button
      type="button"
      aria-pressed={muted}
      aria-label={muted ? 'Sound is off. Turn sound on' : 'Sound is on. Turn sound off'}
      onClick={() => {
        toggleMuted();
      }}
      className="rounded-full bg-navy/85 px-2.5 py-1 text-xs font-bold text-white shadow-md focus-visible:outline-3 focus-visible:outline-gold"
    >
      {muted ? 'Sound off' : 'Sound on'}
    </button>
  );
}
