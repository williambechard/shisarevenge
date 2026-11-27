# 04. Game Rules Specification

**Status:** Locked for the jam build. This is the executable spec. The server's `game/` module must match it. Where `01-game-design.md` is vague, this file decides, and each decision is listed in section 12.

## 1. Constants

| Constant | Value | Notes |
|---|---|---|
| `MIN_PLAYERS` | 4 | |
| `MAX_PLAYERS` | 8 | |
| `roundCountFor(players)` | 4 players: 5 rounds. 6 or 8 players: 7 rounds | Set per match. See design/14. |
| `CARD_VALUES` | 1, 2, 3, 4, 5 | Each once per game. |
| `SPECIAL_STRENGTH` | Talisman 2, Ramen 3, Shisa Mask 4 | Strength of a special card when it is played. See section 5. |
| `SELECTION_SECONDS` | 45 | Tunable. |
| `PICK_SECONDS` | 10 | Time for the winner of a duel to take a card. On timeout the server takes one at random. |
| `RECONNECT_GRACE_SECONDS` | 120 | A disconnected player keeps their seat for this long. |

## 2. Entities

- **Player:** `id`, `name`, `sessionToken`, `team`, `hand` (number cards held, values 1 to 5, duplicates allowed after a take), `special` (`{ kind, status }`), `byeCount`, `connected`, `eliminated`.
- **Team:** `'survivor' | 'infected'`. Display names come from the terminology table. Code uses the neutral names.
- **Special kinds:** `'protection-talisman' | 'ramen' | 'shisa-mask'`.
- **Special status:** `'available' | 'committed' | 'spent' | 'lost'`.
- **Encounter:** `{ a, b, selections: { [playerId]: Selection | null } }`.
- **Played card:** either a number card `{ type: 'number', value: 1..5 }` or the player's special card `{ type: 'special' }`. A special is played in place of a number. Each round a player plays exactly one card.

## 3. Setup

1. The match starts when the room reaches `MAX_PLAYERS` (8) players, or when a player starts it after the lobby wait (15 seconds for testing, 60 for the party) with an even number of players, from `MIN_PLAYERS` (4) to 6. An odd count never starts early, so no player sits out. There is no ready step and no host. Players are placed automatically (see `01-game-design.md` section 8).
2. Pick one player at random as origin. Give that player team `infected` and special `shisa-mask`, status `available`.
3. Every other player gets team `survivor`.
4. Give each survivor one special at random: `protection-talisman` or `ramen`, status `available`.
5. Give every player the full hand `[1, 2, 3, 4, 5]`. Each player also holds their special card, so six cards in total. A player plays one card each round. Cards can also be taken from the hand (section 4.6), so a hand can run out. Running out is elimination (section 4.7).
6. Set `round = 1`.

## 4. Round flow

Phases, in order: `announce` -> `pairing` -> `selecting` -> `revealed` -> `resolved`. Then the next round, or `ended`.

### 4.1 Pairing

Pair only active players. A player who is eliminated (section 4.7) is not paired and does not play.

- Pool: all players. (Under the current rules every player has a card in every round, so no one is excluded for lack of cards.)
- If the pool has an odd count, choose one player as Warm-Up:
  - Pick the player with the fewest `byeCount` so far.
  - Break ties at random.
  - Increment that player's `byeCount`.
- Shuffle the rest and pair them in order.
- No pair may repeat a pair from the previous round. Reshuffle up to 50 times. If no valid pairing is found, pair each player with the opponent they faced least recently.
- A Warm-Up player does not select a card and does not play a card this round.

### 4.2 Selection

- A player may select one value in their hand.
- A player may play their special card in place of a number card, only if its status is `available`. Playing it moves the status to `committed`.
- Selections are secret until both players in the encounter lock in.
- Locking in is final. The server rejects later changes with a clear message.
- The server records the selection, sets `selections[playerId]`, and sends that player a `waiting` status.

### 4.3 Timeout

If a player has not locked in when the timer ends, the server auto-selects for them:

- Pick the lowest value in their hand. The lowest value is the default because it is the safest cost.
- Do not play the special card. Play the lowest number.
- Log nothing that includes the selection itself. Show "Auto-locked" to the player.

### 4.4 Disconnect

- A disconnected player keeps their seat for `RECONNECT_GRACE_SECONDS`.
- While they are disconnected, their encounter timer still runs. The auto-select rule in 4.3 applies.
- After the grace period, the player stays in the match but is treated as auto-selecting every round. The rest of the room is not blocked.
- After the grace period, the seat cannot be reclaimed. A window that presents the old token gets GRACE_EXPIRED. The seat stays in the match as auto-selecting.
- New players never join a started match. A lobby that holds a dropped player's seat is closed to new players until that seat is released after LOBBY_DISCONNECT_GRACE_SECONDS. A new window starts its own lobby.

### 4.5 Reveal

When both players in an encounter have locked in, the server reveals both played cards (a number, or a special and its strength) to those two players only. The reveal is sent to the whole room only as public team counts after the round.

### 4.6 Taking a card

Every duel with a winner has a take. A tie has no take. This includes a duel between two players on the same team.

1. After the duel resolves, the server gathers the loser's number cards that remain in hand. The played card is already removed. These form the pool. The server shuffles the pool, so position carries no information.
2. The winner gets a blind pick. The winner sees how many cards are in the pool, and nothing about their values. The winner chooses one by its position.
3. The chosen card is removed from the loser's hand and added to the winner's hand. The winner sees its value. The loser sees a card leave their hand.
4. Special cards are never in the pool. A special stays with its owner.
5. If the pool is empty, there is no take.
6. The winner has `PICK_SECONDS` to choose. On timeout the server chooses at random. A pending pick does not stop other duels from resolving, but the round summary waits until every pick is made.

### 4.7 Elimination

- A player holds one card for each number in hand, and one for the special card if it is `available`.
- At the round summary, a player who holds no cards is eliminated. An eliminated player is not paired, does not select, cannot take a card, and cannot be taken from. They stay in the room and watch.
- Eliminated players do not count in team counts or win checks (section 9).

## 5. Strength of played cards

A played number has its value. A played special has the fixed strength in `SPECIAL_STRENGTH`:

| Special | Strength | Who holds it |
|---|---|---|
| Protection Talisman | 2 | Survivors (one of the two Survivor specials) |
| Ramen | 3 | Survivors (one of the two Survivor specials) |
| Shisa Mask | 4 | Shisa's Army |

- Specials are compared the same way as numbers. A higher strength wins, and an equal strength is a tie.
- The Shisa Mask has no bonus. It is a card of strength 4 for the Army member who holds it.
- Ties are compared on strength, not on the card's name.

## 6. Resolution

Let `A` and `B` be the two players in an encounter. Resolve in this order.

### Step 1: Spend special cards

Every special card played is marked `spent`, whatever the outcome. This includes a Talisman or Ramen played in a losing or tied duel. A number card played is removed from the hand.

### Step 2: Determine the winner

- If effective strengths are equal, the duel is a **tie**. Go to step 4 with no team change.
- Otherwise the higher effective strength wins.

### Step 3: Apply team effects

Only mixed-team duels can change teams. Same-team duels never change teams.

Let `S` be the Shisa's Army member and `V` be the Survivor.

- **Army wins (`S` stronger than `V`):**
  - If `V` played `protection-talisman`, the freeze is blocked. No team change.
  - Otherwise `V` catches a cold. See section 7.
- **Survivor wins (`V` stronger than `S`):**
  - The attack is repelled.
  - If `V` played `ramen`, `S` recovers. See section 8.
- **Tie:** no team change, regardless of specials.

Rules precedence: a played Talisman blocks a freeze regardless of the margin.

### Step 4: Record results

- Store the duel result for both players' private views.
- Do not update the public team counts here. They change only at the round summary (`round:ended` in `08-socket-contract.md`), so the progress bar cannot reveal mid-round freezes.
- Mark the encounter `resolved`.

### Step 5: Take a card (section 4.6)

Runs after steps 1 to 4, for every duel with a winner. The loser's remaining number cards form the pool, and the winner picks one blind.

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
3. Give the player a fresh survivor special chosen at random: `protection-talisman` or `ramen`, status `available`.
4. Send the player a private message describing their new special.

Recovery applies only to the duel's Shisa's Army member, and only when the Survivor played `ramen` and won.

### 8.1 Rebound

- A player who catches a cold (section 7) may rebound, once per match. The flag is set when they catch the cold.
- A rebound happens when that player wins a duel against another Shisa's Army member. Same-team duels are the only duels where it can happen.
- A rebound is the same team change as recovery above: the player rejoins the Survivors, loses the Shisa Mask, and gets a random Survivor special. The `recovered` notice is shown to them.
- The origin never has the flag, because the origin is never caught.
- Rebound is added to tighten the balance of longer matches (see `14-balance-rounds.md`).
## 9. Win checks

Run after every round's resolution, in this order:

1. Only active players count (players not eliminated). If no active player remains at all, the Survivors win immediately (a shared elimination). Otherwise, if no active player is a survivor, Shisa's Army wins immediately.
2. If no active player is `infected`, Survivors win immediately.
3. If `round === ROUND_COUNT`, Survivors win if any active player is `survivor`, otherwise Shisa's Army wins.
4. Otherwise, increment `round` and go to the next round.

## 10. Rounds and phases

| Phase | Entered when | Exit when |
|---|---|---|
| `announce` | Start of round, or after resolution | Announce period ends (3 seconds) |
| `pairing` | Announce ends | Pairs and Warm-Up are set |
| `selecting` | Pairing done | All encounters locked in, or timer ends |
| `revealed` | All encounters locked in or auto-locked | Reveals sent (immediate) |
| `resolved` | Reveal done | Win check runs |
| `ended` | Win check says the game is over | Players leave, and the room closes when it is empty |

## 11. Invariants

The engine must uphold these at all times. Each one needs a unit test.

- A hand may hold the same card value more than once, after a take.
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
2. Ramen's recovery is decided at commit time. Committing it means "recover this opponent if I win." No second choice after the reveal.
3. Protection Talisman is an active commit, not automatic. It is hidden until reveal.
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
15. A room starts only when it is full (8 players). There is no fallback for a smaller room yet. Open question for playtesting.
16. Player names are assigned from `PLAYER_NAMES` and are unique within a room. Players never choose names.
17. The origin is chosen at random when the match starts.
18. A Shisa's Army member who is recovered is also written to the endgame transformation history, the same as a catch. Duel results use the words in  8-socket-contract.md. A Survivor who wins a mixed duel without Ramen gets epelled. Its Army opponent gets lost.

19. Specials are played like number cards. Each player has five numbers and one special card, and plays one card per round in place of a number. A special has a fixed strength (section 5): Protection Talisman 2, Ramen 3, Shisa Mask 4. The Shisa Mask no longer adds a bonus. These strengths and the card count are a first guess and need playtesting.

20. Specials are never taken. Taking applies only to number cards. A special stays with its owner.
21. Every duel with a winner has a take, including a duel between two players on the same team. A tie has no take. Teammates can take from each other, which can eliminate a teammate. Revisit after playtests.
22. The pick is blind. The server shuffles the pool, and the winner sees only the number of cards. A hand can hold duplicate values after a take.
23. The pick has a timeout of `PICK_SECONDS`. On timeout the server takes a random card. The round summary waits for every pick.
24. A player who holds no cards at the round summary is eliminated. Eliminated players are not paired and watch the rest of the match.
25. Public card counts and eliminated flags are shared at the round summary only. Hand contents are never shared.
26. Team counts and win checks count only active players. If every player is out in the same round, the Survivors win. This covers the last two players when their final duel removes both. If some player remains and no active player is a survivor, Shisa's Army wins.
27. The paired opponent's card count and whether they have locked in are shared privately with the two players in that duel. They update during the round, as cards are played and taken. Other players never see them.
