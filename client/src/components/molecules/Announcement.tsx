type AnnouncementProps = {
  round: number;
  caughtCount: number;
};

// Round summary banner for everyone. It counts changes only and never names a player.
export function Announcement({ round, caughtCount }: AnnouncementProps) {
  const text =
    caughtCount === 0
      ? `Round ${String(round)} is over. No one caught a cold.`
      : `Round ${String(round)} is over. ${String(caughtCount)} ${caughtCount === 1 ? 'player caught' : 'players caught'} a cold.`;
  return (
    <p
      role="status"
      aria-live="polite"
      className="rounded-xl bg-white/70 px-4 py-2 text-center text-sm font-semibold text-navy"
    >
      {text}
    </p>
  );
}
