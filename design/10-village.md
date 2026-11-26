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

- **Board:** 7 columns by 5 rows of tiles. Each tile is walkway, a blocked decor tile (sand, rock, or water), or a landmark.
- **Landmark:** the vending machine occupies one walkway tile. It is the only landmark in the MVP.
- **Movement:** tap an adjacent walkway tile (up, down, left, right, not diagonal). The server validates each move and records the position. A player may move once every `MOVE_COOLDOWN_MS` (proposed: 400 ms) to keep the server quiet.
- **Avatars:** each player is a token with their name's first letter and one of eight colours. The token is code-drawn, so it needs no art.
- **Meeting:** two players are on the same tile when they stand together. Accusations need the accuser and the target on the same tile. This is why the grid matters: you have to walk to the person you suspect.
- **Start positions:** each player starts on a walkway tile spread across the board, chosen by the server.

## 4. Accusation

- **Who:** any player who holds at least one number card and shares a tile with the target. Eliminated players cannot accuse.
- **Limit:** one accusation per player per village. A target can receive many accusations.
- **Cost:** the accuser chooses one of their number cards and gives it up. The card is removed for good, and the cost is paid whatever the outcome (design 2 from the earlier discussion).
- **Resolution, against the final roles of the match that just ended:**
  - **Correct** (the target was Shisa's Army): the accuser receives a random number card, from 1 to 5. The card is not drawn from the target's hand, so the prize does not depend on what the target holds.
  - **Wrong:** nothing is gained. The cost is already paid.
- **Privacy:** only the accuser learns whether the accusation was correct. The target is told that someone accused them, with no name and no result.
- **Public tag:** every accusation adds a public tag to the target, shown on the walkway as a count per player, for example "Habu: 2 tags". The tag shows who was accused, not who accused them or whether it was right.

## 5. Vending machine

- **Use:** stand on the vending machine's tile and insert one duplicate number card, a card whose value you already hold. You receive one random card.
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

- **Walkway screen:** the board, the avatars, the tag counts, the timer, and the player's own cards. Its controls are the accusation panel and the vending machine panel, opened from the tile the player stands on.
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

## 9. Open questions

1. **Accusations target the match that just ended.** Roles reset each match, so an accusation can only be about the roles of the match just ended. Is that the right target, or should accusations be about the next match? (The current proposal is "the match just ended".)
2. **Reveal at the end of the village.** Final roles are revealed after the village. Should they be revealed at all, or kept hidden for the rest of the game?
3. **Carry-over of cards.** Are village cards kept into the next match as extra cards (the current proposal), or does each match start from a fixed hand?
4. **Vending odds and limits.** Are 16% / 20% and one use per village right for a party-sized room?
5. **Accusation cost.** Should the cost be any number card (current proposal), a special card, or a choice of the accuser's cheapest card?
6. **Village length.** 90 seconds for testing and 120 for the party. Is that enough time to walk and act with 8 players?
7. **Elimination in the village.** Out players can accuse and read, but cannot spend cards. Should they be able to join the next match, or stay out for good?
