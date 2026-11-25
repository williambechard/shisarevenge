import { MAX_PLAYERS, type EndgameSummary, type PublicPlayer } from '@shisa-revenge/shared';
import { Button } from '../atoms/Button.js';

type EndgameSummaryProps = {
  summary: EndgameSummary;
  players: PublicPlayer[];
  onBackToStart: () => void;
};

const WINNER_TEXT = {
  survivor: 'The Survivors win.',
  infected: "Shisa's Army wins.",
} as const;

function nameFor(players: PublicPlayer[], playerId: string): string {
  return players.find((player) => player.id === playerId)?.name ?? 'A player';
}

// The overview after a match: who won, the final counts, the origin, and each player's history.
export function EndgameSummary({ summary, players, onBackToStart }: EndgameSummaryProps) {
  return (
    <section aria-labelledby="endgame-heading" className="flex flex-col gap-5 pt-6">
      <h1 id="endgame-heading" className="text-center text-3xl font-bold text-shisa">
        {WINNER_TEXT[summary.winner]}
      </h1>

      <p className="text-center text-base">
        Survivors: <span className="font-semibold">{summary.survivors}</span> · Shisa&apos;s Army:{' '}
        <span className="font-semibold">{summary.infected}</span> (of {String(MAX_PLAYERS)})
      </p>

      <p className="text-center text-sm text-navy/80">
        The Cursed Shisa was {nameFor(players, summary.originPlayerId)}.
      </p>

      <section aria-labelledby="history-heading" className="flex flex-col gap-2">
        <h2 id="history-heading" className="text-sm font-semibold">
          History
        </h2>
        <ul className="flex flex-col gap-2">
          {summary.history.map((entry) => (
            <li
              key={entry.playerId}
              className="flex min-h-11 items-center justify-between rounded-xl bg-white/60 px-4 py-2 text-sm"
            >
              <span className="font-semibold">{nameFor(players, entry.playerId)}</span>
              <span className="text-navy/80">
                {entry.transformations.length === 0
                  ? 'Never caught a cold'
                  : `Caught a cold in round ${entry.transformations.map(String).join(', ')}`}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <Button onClick={onBackToStart}>Back to start</Button>
    </section>
  );
}
