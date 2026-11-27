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
## 6. Rebound (added after the first run)

A caught player may rebound once: when they win a duel against another Shisa's Army member, they return to the Survivors (design/04 section 8.1). The same simulation was run with and without it, rounds 3 to 8, 4,000 matches each.

| Players | Rounds | Army wins, no rebound | Army wins, rebound |
|---|---|---|---|
| 4 | 3 | 19.3% | 15.8% |
| 4 | 4 | 38.9% | 28.0% |
| 4 | 5 | 58.5% | 43.2% |
| 4 | 6 | 69.8% | 56.2% |
| 4 | 7 | 73.5% | 63.1% |
| 4 | 8 | 73.3% | 61.0% |
| 6 | 3 | 1.7% | 0.9% |
| 6 | 4 | 8.6% | 3.7% |
| 6 | 5 | 28.8% | 11.8% |
| 6 | 6 | 52.6% | 31.4% |
| 6 | 7 | 62.5% | 44.5% |
| 6 | 8 | 63.5% | 47.1% |
| 8 | 3 | 0.1% | 0.1% |
| 8 | 4 | 1.6% | 0.4% |
| 8 | 5 | 10.4% | 3.5% |
| 8 | 6 | 39.3% | 19.1% |
| 8 | 7 | 56.0% | 37.0% |
| 8 | 8 | 58.2% | 42.0% |

Reading: rebound lowers the Army's win rate at every round count. Eight rounds at 6 or 8 players now gives an Army win rate near half (47% and 42%). At 4 players, 5 rounds gives 43%. The same play policy caveats apply: simple choices, no village.

Candidate setting from these results: 5 rounds at 4 players, 8 rounds at 6 to 8 players. This is a different direction from the earlier suggestion, which relied on the balance before rebound. Confirm with a playtest before changing `ROUND_COUNT`.