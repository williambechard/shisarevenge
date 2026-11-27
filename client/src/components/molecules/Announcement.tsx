type AnnouncementProps = {
  round: number;
  caughtCount: number;
};

// Round summary banner for everyone. It counts changes only and never names a player.
// When anyone caught a cold, it also says what that means, so the change is not a mystery.
export function Announcement({ round, caughtCount }: AnnouncementProps) {
  const text =
    caughtCount === 0
      ? `Round ${String(round)} is over. No one caught a cold.`
      : `Round ${String(round)} is over. ${String(caughtCount)} ${caughtCount === 1 ? 'player caught' : 'players caught'} a cold.`;
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col gap-1 rounded-xl bg-white/70 px-4 py-2 text-center text-sm text-navy"
    >
      <p className="font-semibold">{text}</p>
      {caughtCount > 0 ? (
        <p className="text-xs">
          A cold means switching sides. A Survivor who loses a duel to Shisa&apos;s Army joins
          Shisa&apos;s Army and keeps playing. Any unused Survivor special is lost.
        </p>
      ) : null}
    </div>
  );
}
