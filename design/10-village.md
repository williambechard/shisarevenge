# 10. Village (between matches)

**Status:** Proposed. Not built. Review the open questions in section 9 before implementation. This doc replaces the optional "village with preset emotes" idea in `01-game-design.md` section 5 and `07-implementation-plan.md`.

## 1. Purpose

The village is the time between two matches. The room stays together, and the walk is where players read each other. It has three jobs:

1. **Accuse:** players tag who they think was Shisa's Army in the match that just ended. Accusations cost a card, and a correct one pays the accuser.
2. **Trade:** the vending machine turns a spare duplicate card into a random card.
3. **Read:** every accusation is a public tag, so the walk becomes a record of who is suspected.

The village matters because its results carry into the next match (section 6).

## 2. Flow

1. A match ends. The overview shows the winner and the history of team changes, as now.
2. The overview's **Back to start** button becomes **Continue to the village**. The room stays together.
3. The village opens for `VILLAGE_SECONDS` (proposed: 90 seconds for testing, 120 for the party). Players walk and act until the timer ends.
4. The village ends. The final roles of the match just ended are revealed to everyone on the walkway.
5. The next match starts in the same room with the same players. Roles are assigned again, as in `04-game-rules.md` section 3.

Players who are out of cards at the end of a match are still in the village. They can walk, accuse, and read, but they have no cards to spend.

## 3. The walkway (grid)

- **Board:** 7 columns by 10 rows of tiles, all walkway except the vending machine. The board in data/settings.json may still use blocked tiles (X), but the MVP board has none, so every tile can be reached.
- **Landmark:** the vending machine occupies one walkway tile. It is the only landmark in the MVP.
- **Movement:** tap an adjacent walkway tile (up, down, left, right, not diagonal). The four tiles next to the player's token are enabled and show a direction arrow pointing at them. The server validates each move and records the position. A player may move once every `MOVE_COOLDOWN_MS` (proposed: 400 ms) to keep the server quiet.
- **Avatars:** each player is a token showing their player icon (one of eight 128x128 pictures in client/src/assets/playericons/). The server gives each seat a different icon in the room, at random, and a reconnecting player keeps theirs. The same icon shows left of the name in the header and in the lobby list.
- **Meeting:** two players are on the same tile when they stand together. The player who stepped on stays there. The token glides in, then recoils once, and the overlay opens after about 0.8 s. The arrows follow that tile.
Accusations need the accuser and the target on the same tile. This is why the grid matters: you have to walk to the person you suspect.
- **Start positions:** each player starts on a walkway tile spread across the board, chosen by the server.

## 4. Accusation

- **Who:** any player who shares a tile with the target. A player who holds number cards pays one to accuse. A player who is out accuses for free (see section 9).
- **Limit:** one accusation per player per village. A target can receive many accusations.
- **Cost:** the accuser chooses any one of their cards and gives it up. The card is removed for good, and the cost is paid whatever the outcome.
- **Resolution, against the final roles of the match that just ended, which stay hidden until an accusation resolves:**
  - **Correct** (the target was Shisa's Army): the accuser receives a random number card, from 1 to 5. The card is not drawn from the target's hand, so the prize does not depend on what the target holds.
  - **Wrong:** nothing is gained. The cost is already paid.
- **Privacy:** only the accuser learns whether the accusation was correct, and the accused's role is shown to the accuser alone. The target is told that someone accused them, with no name and no result.
- **Public tag:** every accusation adds a public tag to the target, shown on the walkway as a count per player, for example "Habu: 2 tags". The tag shows who was accused, not who accused them or whether it was right.

## 5. Vending machine

- **Use:** the machine tile cannot be walked onto. Stand on a tile next to it and tap the machine to open its panel as a modal. The panel opens only if the player holds a duplicate; otherwise a short hint appears above the machine for 3 seconds, saying what it does and that no duplicate is held. Then insert one duplicate number card, a card whose value you already hold. You receive one random card.
- **Odds (proposed):** number 1 to 5 each 16%, special 20%. The special is one of the three kinds, chosen at random.
- **Special rule:** if the player already holds a special card, a special roll becomes a number roll instead.
- **Limit:** one use per player per village.
- **No duplicate, no use:** the machine refuses if the player holds no duplicate, and it says why.

## 6. Carrying results into the next match

These are proposals. The open questions in section 9 decide them.

- Cards gained in the village (vending or a correct accusation) are kept as extra cards for the next match. They sit in the hand alongside that match's starting cards.
- Cards lost in the village (the accusation cost) are gone for good.
- A player who was out at the end of the last match starts the next match with a fresh hand. Elimination is per match.
- Specials are reset each match, as in setup. A special gained in the village is kept only if the player has no special when the next match starts. Otherwise it converts to a number.

## 7. Screens and transitions

- **Walkway screen:** the board, the avatars, and the countdown. No text otherwise. The newest accusation shows for about 6 seconds, for everyone, and the full log stays in the village state. The background covers the whole phone frame below the header. Its controls are the accusation panel and the vending machine panel, opened from the tile the player stands on.
- **Overview to walkway:** the overview fades out and the walkway fades in with a slight rise (about 350 ms). The timer starts once the walkway has settled.
- **Walkway to the next round:** the walkway fades out and the round screen fades in, with a short "Round 1 starts" caption (about 350 ms total).
- **Motion limits:** nothing longer than 400 ms, as set in `07-implementation-plan.md`. Transitions use the same spring as the card moves, so the game feels like one thing.

## 8. Graphics needed

Sizes are for a portrait phone at 3x (1170×2532 for the full screen). The art can be replaced later without code changes.

| Asset | Size | Format | Notes |
|---|---|---|---|
| Village background | 1080×1920 | JPG | Beach and sky, with clear space in the middle band for the board. No walkway, because the grid is drawn from tiles. |
| Walkway stone tile | 128×128 | PNG, opaque | Stone walkway. Two or three variants to break up the repeat. |
| Blocked tile (sand, rock, water) | 128×128 | PNG, opaque | One variant each, or a single tile with decor drawn on top. |
| Vending machine | 256×256 | PNG, transparent | Sits on its walkway tile. Also shown large in the vending panel. |
| Accusation tag | 64×64 | SVG | A flag or tag icon for the tag counts. |
| Decor (palm, bench, lantern) | 128×128 | PNG, transparent | Optional, for the edges of the board. |

If you'd rather not draw these yet, I can build placeholder SVG versions in the same sizes, so the layout can be checked first.

## 9. Decisions (from review)

1. **Accusations are about the match that just ended.** Roles reset each match, so an accusation checks the final roles of the match just played.
2. **Roles stay hidden** after the village, except that a correct accusation reveals the accused's role to the accuser.
3. **Village cards carry into the next match** as extra cards, on top of that match's starting hand.
4. **Vending odds and limits are adjustable.** They live in a settings file (section 10), so they can be changed without code.
5. **The accusation cost is any card**, number or special.
6. **Village length:** `VILLAGE_SECONDS` in `data/settings.json`. 60 seconds for testing (section 11).
7. **Out players can accuse for free and cannot join the next match.** Their accusations still resolve, but a correct one pays no card (section 11).

## 10. Settings file

Tunable values for the village (and later, other tuning) live in one JSON file, `data/settings.json`, that you can edit without touching code. The server reads it at startup. Values the client needs to display (such as the village timer) are sent by the server in room state, so the client never holds its own copy.

Settings covered: `villageSeconds`, `moveCooldownMs`, vending odds, vending limit per village, and accusation limit per village.

## 11. Decisions (second review)

1. **Village timer:** 60 seconds for testing. Set in `data/settings.json` as `villageSeconds`, so it can be changed without code. (The lobby wait stays at 15 seconds for testing, and returns to 60 before the party.)
2. **Out players get no card.** A correct accusation by an out player shows the result privately, and nothing else changes.

## 12. Carry-over rule for specials (implementation decision)

Every player is dealt a special at the start of a match (section 3 of  4-game-rules.md), so the rule in section 6 cannot keep a special gained in the village as written. The rule is now:

- A special gained by vending (Protection Talisman or Ramen) replaces the Survivor special the player would be dealt at the next start.
- If that player is the origin (dealt a Shisa Mask), the gained special becomes one extra number card instead.
- A Shisa Mask carried out of a match is never kept: it becomes one extra number card, because the mask is Army-only.
## 13. Revision: village between rounds (proposed, not built)

This revises sections 1 and 2. The village opens at the start of the match and after every round, not only between matches.

1. **Start:** the match begins in the village, before round 1. Players walk, accuse, use the vending machine, and choose partners.
2. **After each round:** the round summary is followed by the village, for `villageSeconds`. Round 5 is followed by the overview, then the village between matches, as now.
3. **Timer:** 30 seconds for testing, set in `data/settings.json`. This applies to every village.
4. **Partners:** the village is where a player picks who they duel next. If nobody picks, the server assigns a partner at random from those still in the game, as the round pairing does now.

Open questions for review:

1. **What does "partner" mean?** Option A: each player taps one player on their tile, and a mutual choice pairs them for the next round. Option B: a partner is fixed for the whole match. Option B conflicts with the random pairing and the no-repeat rule in `04-game-rules.md` section 4.1, so I recommend Option A.
2. **Unmatched players.** Under Option A, anyone who doesn't match is paired at random. Does a player on a tile with nobody else get a random partner from the whole game, or only from those on the tile?
3. **Accusations during the match.** If the village runs after every round, the accusation can target any player's current role, not only the match that just ended. Would a correct accusation reveal that player's role to everyone, or only to the accuser?
4. **Cards.** Accusation costs and vending rewards carry into the next round, as they do into the next match now.
5. **Eliminated players** still accuse for free, and can still walk the village between rounds. Do they keep watching during matches, or can they accuse each round?
### 13.1 Decisions (from review)

1. **Partner choice:** when two players stand on the same tile, a modal opens for each of them. It offers **Challenge** (propose a duel for the next round), **Accuse**, or **Walk on**. A challenge locks both players as a pair for the next round, at once. A player who is not challenged is paired at random.
2. **Random partners** are drawn from the players still in play. Eliminated players are never paired.
3. **Accusations are public.** Everyone sees who accused whom, and the result of the accusation. A correct accusation also reveals the accused player's role to everyone. A wrong accusation reveals nothing about the accused's role.
4. **Eliminated players are observers.** They can walk and read the village, but they cannot accuse or challenge.

## 14. Layout on phones

- No screen scrolls, vertically or horizontally. The phone frame is exactly the viewport height and hides overflow.
- The walkway takes the largest square-tiled size that fits the width and the height left over. It shrinks on short phones.
- Cards size from the screen height (dvh), so the table and hand fit short phones.

## 15. Challenge lock (pre-battle)

- A challenge pairs the challenger and the target as soon as it is made. Both players must be on the same tile and in play.
- A locked player sees a full-screen CHALLENGE overlay with both icons and names. It stays until the round starts. They can do nothing else: no moving, no accusing, no vending.
- Nobody can walk onto a tile where a locked player stands. The walker sees the message "Locked in for a pre-battle. No interrupting!".
- A locked player cannot be challenged or accused.
- Locks are public. The pair appears in the village state as partners.