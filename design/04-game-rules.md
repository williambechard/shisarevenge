# 04. Game Rules Specification

**Status:** Locked for the jam build. This is the executable spec. The server's `game/` module must match it. Where `01-game-design.md` is vague, this file decides, and each decision is listed in section 12.

## 1. Constants

| Constant | Value | Notes |
|---|---|---|
| `MIN_PLAYERS` | 4 | |
| `MAX_PLAYERS` | 8 | |
| `ROUND_COUNT` | 5 | |
| `CARD_VALUES` | 1, 2, 3, 4, 5 | Each once per game. |
| `MAGIC_BONUS` | +2 | Shisa Mask. |
| `MAX_EFFECTIVE_STRENGTH` | 5 | Cap after bonuses. |
| `SELECTION_SECONDS` | 45 | Tunable. |
| `RECONNECT_GRACE_SECONDS` | 120 | A disconnected player keeps their seat for this long. |

## 2. Entities

- **Player:** `id`, `name`, `sessionToken`, `team`, `hand` (unused card values), `special` (`{ kind, status }`), `byeCount`, `connected`.
- **Team:** `'survivor' | 'infected'`. Display names come from the terminology table. Code uses the neutral names.
- **Special kinds:** `'bingata-shawl' | 'hot-shikuwasa' | 'shisa-mask'`.
- **Special status:** `'available' | 'committed' | 'spent' | 'lost'`.
- **Encounter:** `{ a, b, selections: { [playerId]: Selection | null } }`.
- **Selection:** `{ value: 1..5, useSpecial: boolean }`.

## 3. Setup

1. Require 4 to 8 players, all ready. Otherwise the host's Start button is disabled.
2. Pick one player at random as origin. Give that player team `infected` and special `shisa-mask`, status `available`.
3. Every other player gets team `survivor`.
4. Give each survivor one special at random: `bingata-shawl` or `hot-shikuwasa`, status `available`.
5. Give every player the full hand `[1, 2, 3, 4, 5]`.
6. Set `round = 1`.

## 4. Round flow

Phases, in order: `announce` -> `pairing` -> `selecting` -> `revealed` -> `resolved`. Then the next round, or `ended`.

### 4.1 Pairing

- Pool: all players. (Under the current rules every player has a card in every round, so no one is excluded for lack of cards.)
- If the pool has an odd count, choose one player as Warm-Up:
  - Pick the player with the fewest `byeCount` so far.
  - Break ties at random.
  - Increment that player's `byeCount`.
- Shuffle the rest and pair them in order.
- No pair may repeat a pair from the previous round. Reshuffle up to 50 times. If no valid pairing is found, pair each player with the opponent they faced least recently.
- A Warm-Up player does not select a card and does not commit a special this round.

### 4.2 Selection

- A player may select one value in their hand.
- A player may commit their special card only if its status is `available`.
- Selections are secret until both players in the encounter lock in.
- Locking in is final. The server rejects later changes with a clear message.
- The server records the selection, sets `selections[playerId]`, and sends that player a `waiting` status.

### 4.3 Timeout

If a player has not locked in when the timer ends, the server auto-selects for them:

- Pick the lowest value in their hand. The lowest value is the default because it is the safest cost.
- Do not commit a special.
- Log nothing that includes the selection itself. Show "Auto-locked" to the player.

### 4.4 Disconnect

- A disconnected player keeps their seat for `RECONNECT_GRACE_SECONDS`.
- While they are disconnected, their encounter timer still runs. The auto-select rule in 4.3 applies.
- After the grace period, the player stays in the match but is treated as auto-selecting every round. The rest of the room is not blocked.

### 4.5 Reveal

When both players in an encounter have locked in, the server reveals both values and any committed specials to those two players only. The reveal is sent to the whole room only as public team counts after the round.

## 5. Effective strength

For each side:

1. Start with the played value.
2. If the side committed `shisa-mask` and the card is available, add `MAGIC_BONUS`.
3. Cap at `MAX_EFFECTIVE_STRENGTH`.

Ties are compared on effective strength, not the raw card.

## 6. Resolution

Let `A` and `B` be the two players in an encounter. Resolve in this order.

### Step 1: Spend special cards

Every committed special is marked `spent`, whatever the outcome. This includes a Shawl or Cocoa committed in a losing or tied duel.

### Step 2: Determine the winner

- If effective strengths are equal, the duel is a **tie**. Go to step 4 with no team change.
- Otherwise the higher effective strength wins.

### Step 3: Apply team effects

Only mixed-team duels can change teams. Same-team duels never change teams.

Let `S` be the Shisa's Army member and `V` be the Survivor.

- **Army wins (`S` stronger than `V`):**
  - If `V` committed `bingata-shawl`, the freeze is blocked. No team change.
  - Otherwise `V` catches a cold. See section 7.
- **Survivor wins (`V` stronger than `S`):**
  - The attack is repelled.
  - If `V` committed `hot-shikuwasa`, `S` recovers. See section 8.
- **Tie:** no team change, regardless of specials.

Rules precedence: a committed Shawl blocks a freeze regardless of the margin.

### Step 4: Record results

- Store the duel result for both players' private views.
- Do not update the public team counts here. They change only at the round summary (`round:ended` in `08-socket-contract.md`), so the progress bar cannot reveal mid-round freezes.
- Mark the encounter `resolved`.

## 7. Catching a cold (survivor becomes Shisa's Army)

1. Set the player's `team` to `infected`.
2. If the player's Survivor special is `available`, set it to `lost`. The player's private view shows: "You caught a cold. Your [special name] is gone." A special that is already `spent` is not lost, and no message is sent for it.
3. Give the player `shisa-mask`, status `available`.
4. Send the player a private message: "You caught a cold. You now have a Shisa Mask."
5. Do not send the change to the rest of the room. Public team counts change.

The `lost` notification must appear on the player's screen. Do not hide it.

## 8. Recovering (Shisa's Army becomes survivor)

1. Set the player's `team` to `survivor`.
2. If the player's special is `shisa-mask` (`available` or `spent`), set it to `lost`. The private view shows: "You recovered. Your Shisa Mask is gone."
3. Give the player a fresh survivor special chosen at random: `bingata-shawl` or `hot-shikuwasa`, status `available`.
4. Send the player a private message describing their new special.

Recovery applies only to the duel's Shisa's Army member, and only when the Survivor committed `hot-shikuwasa` and won.

## 9. Win checks

Run after every round's resolution, in this order:

1. If every player is `infected`, Shisa's Army wins immediately.
2. If no player is `infected`, Survivors win immediately.
3. If `round === ROUND_COUNT`, Survivors win if any player is `survivor`, otherwise Shisa's Army wins.
4. Otherwise, increment `round` and go to the next round.

## 10. Rounds and phases

| Phase | Entered when | Exit when |
|---|---|---|
| `announce` | Start of round, or after resolution | Announce period ends (3 seconds) |
| `pairing` | Announce ends | Pairs and Warm-Up are set |
| `selecting` | Pairing done | All encounters locked in, or timer ends |
| `revealed` | All encounters locked in or auto-locked | Reveals sent (immediate) |
| `resolved` | Reveal done | Win check runs |
| `ended` | Win check says the game is over | Host restarts or room expires |

## 11. Invariants

The engine must uphold these at all times. Each one needs a unit test.

- A card value appears at most once in a player's hand.
- A used card never returns to the hand.
- Each special card is used at most once. A special's status moves only in this order: `available` -> `committed` -> `spent`, or `available` -> `lost`.
- Each player is in at most one encounter per round.
- Warm-Up players do not select and do not change `hand`.
- A player's team changes at most once per round.
- A `shisa-mask` is always fresh when given.
- Hidden selections never appear in any payload sent before both players lock in.

## 12. Decisions made in this spec

These fill gaps in `01-game-design.md` and the original doc. Review them after playtesting.

1. Committing a special spends it, win or lose. (The original doc said this for ties only.)
2. Hot Shikuwasa's recovery is decided at commit time. Committing it means "recover this opponent if I win." No second choice after the reveal.
3. Bingata Shawl is an active commit, not automatic. It is hidden until reveal.
4. Each Survivor receives one of the two Survivor specials at random at setup.
5. A recovered player receives a fresh random Survivor special. Their Shisa Mask is lost.
6. A caught player's unused Survivor special is lost, and the player is told.
7. The auto-select on timeout picks the lowest card and no special.
8. Pairing uses the Warm-Up rule with the fewest byes first.
9. Round five ends the game regardless of team counts, unless a team has already won.
10. The card exhaustion rule stays in the engine as a safety net. It is not expected to trigger under the current pairing rules.
11. Opponents never repeat in consecutive rounds. The check runs after the Warm-Up is chosen.
12. Pairing is fully random. There is no opposite-team priority.
13. Round announcements are built from public counts at the round summary only. They never name a player.
14. If no pairing avoids every repeat in 50 shuffles, the engine keeps the attempt with the fewest repeats. It does not pick the least recently faced opponent as section 4.1 states. Revisit after playtests (known gap, plan 03).
