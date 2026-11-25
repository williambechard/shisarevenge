# Plan 02: Multiplayer foundation

**Goal:** Four phones join one room and see the same lobby. Refreshing keeps the same seat.
**Source:** `design/07-implementation-plan.md` M1, `03-guardrails.md`, `08-socket-contract.md` sections 3 to 6.

## Steps

### Server

- [x] Create the Express app with `/health` and Socket.IO attached.
- [x] Set CORS to allow only `CLIENT_ORIGIN`.
- [x] Add Zod schemas in `shared/events.ts` for `room:create`, `room:join`, `room:leave`, and `lobby:ready`.
- [x] Add a validation wrapper that returns `INVALID_PAYLOAD` on bad input.
- [x] Implement room codes with `crypto.randomInt` and the unambiguous alphabet. Unit test them.
- [x] Implement the room registry: create, find, and expire. Expire rooms after 2 hours of inactivity.
- [x] Implement session tokens with `crypto.randomUUID()`. Unit test reconnect by token.
- [x] Broadcast `room:state` to everyone in the room on each lobby change.
- [x] Enforce the 8-player limit with `ROOM_FULL`.
- [x] Add per-socket rate limiting at 10 events per second.
- [x] Add the room creation cap of 5 per IP per minute.

### Client

- [x] Build the Landing and Join screens.
- [x] Build the Lobby screen with room code, player list, and ready toggle.
- [x] Add the QR code on the Lobby screen, linking to the URL with the room code.
- [x] Store the session token in `localStorage`, keyed by room code.
- [x] Show connection status: connecting, connected, reconnecting, and offline.
- [x] Show a "Server waking up" spinner while the first connection is pending.
- [x] Add the socket client with reconnect settings.

### Tests and checks

- [x] Socket test: a bad payload returns `INVALID_PAYLOAD` and no state change.
- [x] Socket test: a rejoin with a known token reuses the seat.
- [ ] Manual test: four browser windows join one room and see the same player list.
- [ ] Manual test: refreshing one window keeps the same seat.

## Done when

All steps are checked. Four windows share one lobby, and a refresh keeps the seat.

## Notes

- Start the app with `npm run dev`, then open four browser windows at `http://localhost:5173`. The two manual checks need a person at the browser. The plan stays in `wip/` until they pass.
- Room codes are matched in uppercase, so a lowercase code works.
- Client IP for the room-creation cap comes from `X-Forwarded-For` when present. It is never sent to other players.
