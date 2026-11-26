import { NUMBER_CARD_ART } from '../../assets/cards/index.js';
import { PlayingCard } from '../molecules/PlayingCard.js';
import { PLAYED_LAYOUT_ID } from './HandTray.js';

type PlayAreaProps = {
  opponentName: string;
  // Art for the card this player locked in. Null before lock-in.
  mySlot: { front: string } | null;
  // Art for the opponent's card. Null until the duel reveals.
  opponentFront: string | null;
  // True once the duel has revealed. Both cards turn face up.
  revealed: boolean;
};

// The table: the opponent's card on top, this player's card below. The card you lock in moves
// here from the fan. Both cards turn face up when the duel reveals.
export function PlayArea({ opponentName, mySlot, opponentFront, revealed }: PlayAreaProps) {
  return (
    <section aria-label="Table" className="flex flex-col items-center gap-3">
      <div className="flex flex-col items-center gap-1">
        <PlayingCard front={opponentFront ?? NUMBER_CARD_ART[1]} faceUp={revealed} size="table" />
        <p className="text-xs text-navy/70">{opponentName}</p>
      </div>

      <div className="flex flex-col items-center gap-1">
        {mySlot ? (
          <PlayingCard
            front={mySlot.front}
            faceUp={revealed}
            size="table"
            layoutId={PLAYED_LAYOUT_ID}
          />
        ) : (
          <div
            aria-hidden="true"
            className="h-32 w-[5.5rem] rounded-xl border-2 border-dashed border-navy/40"
          />
        )}
        <p className="text-xs text-navy/70">You</p>
      </div>
    </section>
  );
}
