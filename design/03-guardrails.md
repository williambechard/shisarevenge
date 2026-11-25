# 03. Guardrails

**Status:** Locked for the jam build. Every task must respect these rules. If a task breaks one, stop and raise it.

Guardrails are the non-negotiable lines. Coding conventions are in `05-coding-standards.md`. Rules of play are in `04-game-rules.md`.

## 1. Server authority

The server is the only source of truth for:

- Room membership and room codes
- Player identity and session tokens
- Teams and roles
- Numbered cards remaining
- Special cards and their status
- Pairings and byes
- Submitted selections
- Duel resolution
- Round and win conditions

The client sends **intentions**, for example `encounter:submit { value: 4, useSpecial: true }`. It never sends results, such as "I won" or "I am a Survivor."

## 2. Hidden information

- Never send an opponent's selection before both players lock in.
- Never send one player's private state to another player, even in error messages.
- Never send another player's team in a payload unless the game has made that team public.
- Use separate payloads for public state and private state. Do not put private fields in the public room state.
- The server, not the client, filters what each socket receives. Check this in code review.

## 3. Input validation

- Validate every incoming socket payload with a Zod schema before it touches game logic.
- Reject a payload with a safe, user-readable error. Do not echo the raw input.
- Verify on every action:
  - The socket belongs to a player in that room.
  - The card is in that player's hand and unused.
  - The player has not already locked in for this encounter.
  - The current phase accepts this event.
  - The player is eligible for this encounter.

## 4. Abuse limits

- Rate limit socket events per connection. Start with 10 events per second, and tune as needed.
- Reject room creation after a small cap per IP address (for example, 5 per minute).
- Rooms close when the last player leaves after the match. Otherwise they expire after 2 hours of inactivity.
- Maximum 8 players per room. Reject extra joins with a clear message.

## 5. Room codes and tokens

- Room codes use 6 characters from an alphabet without ambiguous letters (no `0`, `O`, `1`, `I`). Generate them with `crypto.randomInt`.
- Session tokens use `crypto.randomUUID()` or 32 random bytes from `crypto.randomBytes`.
- Session tokens are stored in the browser's `localStorage`, keyed by room code. They are never placed in a URL or logged.
- Never log session tokens, room codes with tokens, or full socket payloads.

## 6. Transport and CORS

- Serve everything over HTTPS. The client connects with `wss://`.
- Set CORS on the server to allow only the `CLIENT_ORIGIN` value.
- Do not use wildcard origins in production.

## 7. Secrets and configuration

- The jam build has no secrets. Keep it that way.
- If a secret is ever needed, put it in Render or Vercel environment settings. Never in source code, the client bundle, or `shared/`.
- Keep `.env` out of Git. Commit a `.env.example` with variable names only.

## 8. Privacy

- Collect only display names.
- Do not store data after a room expires.
- Do not record IP addresses beyond what the rate limiter needs in memory.
- Display names are length-limited (1 to 16 characters) and stripped of control characters.

## 9. Content rules

- Keep the theme tasteful: playful folklore horror, never graphic.
- Do not use real people's names, faces, or likenesses in art.
- Credit any third-party art, fonts, or icons used. Prefer license-free assets.

## 10. Scope guardrails for a two-week build

- Build only what `01-game-design.md` section 13 lists under "Must have."
- Anything else goes into a parking-lot list in `07-implementation-plan.md`, to decide after the jam.
- **Feature freeze on day 12.** After that, only bug fixes and deployment work.
- No new special cards, numbered cards, or round events during the build.
- If a must-have is at risk on day 9, use the cut list in `07-implementation-plan.md` before extending hours.

## 11. Quality gates

A change merges only when:

- `npm run lint`, `npm run typecheck`, and `npm test` all pass.
- Game rules changes come with a unit test.
- Any change to what a player can see has been checked against the hidden-information rules above.

## 12. Things we will not do

- Trust the client's dice, card values, or team claims.
- Let the server reveal a selection early for "convenience."
- Add accounts, payments, or tracking.
- Add a database without a new design decision and a recorded change to this file.

## 13. Chat, emotes, and announcements

- Emotes come from a fixed list in `shared/constants.ts`. The server rejects any other value.
- The game has no free text. Display names are the only player-typed text.
- Emotes are rate limited to one per 3 seconds per player.
- Announcements come from the server and use public team counts only. They never name a player, and they never reveal a team change before the round summary.
