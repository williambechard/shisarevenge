# 14. Round count and balance (simulation notes)

Question: should a match have more than 5 rounds, or a round count that depends on the number of players?

## 1. Method

- The real game engine (`server/src/game/gameEngine.ts`) ran every round: pairing, selection, reveal, card takes, and elimination.
- The win rules match `winConditions.ts`, with the round count as a parameter. The round limit gives the win to the Survivors if any survivor is still in play, as in `04-game-rules.md` section 9.
- 4,000 matches per combination. Each player's choice was simple: 20% special when they have one, 30% their lowest number, otherwise a random number from the hand.
- Not modelled: the village (accusations, vending, challenges), so those rounds have no village effects.

## 2. Results

| Players | Rounds | Army wins | Average rounds played |
|---|---|---|---|
| 4 | 5 | 58.7% | 4.07 |
| 4 | 8 | 73.9% | 4.37 |
| 4 | 10 | 74.2% | 4.32 |
| 6 | 5 | 27.4% | 4.59 |
| 6 | 8 | 64.6% | 5.41 |
| 6 | 10 | 63.7% | 5.39 |
| 8 | 5 | 10.1% | 4.67 |
| 8 | 8 | 58.3% | 5.77 |
| 8 | 10 | 58.2% | 5.80 |

## 3. Reading the results

- The round limit is the Survivors' main way to win. With 5 rounds, the limit is often reached with survivors still in play, so Survivors win at 6 and 8 players.
- With 8 or 10 rounds, most matches end because the Army takes every survivor first. The Army then wins 58% to 65% of the time at 6 and 8 players.
- More rounds did not give more play. Matches ended after about 4 to 6 rounds in every case, because the Army converted the room first.
- With 4 players, the Army wins most matches at every round count.

## 4. Caveats

- The play policy is simple and not how people play. A real player keeps good cards and watches for threats, so the numbers will shift.
- The village is not modelled. Accusations and card payments matter there.
- These results are for the current rules. They do not show that 8 rounds is wrong. They show that a longer game changes the balance a lot.

## 5. Options to keep the balance

1. Keep 5 rounds, and let the round count change with player count only if the win rule changes too.
2. Keep 8 rounds, and change the round-limit win so the Survivors need more survivors than the Army, not just one.
3. Keep 8 rounds, and give the Survivors a catch-back: a survivor who wins a duel against the Army can recover one caught player. This is a rule change and needs review.

Recommendation: do not change the round count until the village and a human-play test are added to the simulation or the playtest.