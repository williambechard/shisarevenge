# Plan 02: Multiplayer foundation

**Goal:** Four phones join one room and see the same lobby. Refreshing keeps the same seat.
**Source:** `design/07-implementation-plan.md` M1, `03-guardrails.md`, `08-socket-contract.md` sections 3 to 6.

## Steps

### Server

- [ ] Create the Express app with `/health` and Socket.IO attached.
- [ ] Set CORS to allow only `CLIENT_ORIGIN`.
- [ ] Add Zod schemas in `shared/events.ts` for `room:create`, `room:join`, `room:leave`, and `lobby:ready`.
- [ ] Add a validation wrapper that returns `INVALID_PAYLOAD` on bad input.
- [ ] Implement room codes with `crypto.randomInt` and the unambiguous alphabet. Unit test them.
- [ ] Implement the room registry: create, find, and expire. Expire rooms after 2 hours of inactivity.
- [ ] Implement session tokens with `crypto.randomUUID()`. Unit test reconnect by token.
- [ ] Broadcast `room:state` to everyone in the room on each lobby change.
- [ ] Enforce the 8-player limit with `ROOM_FULL`.
- [ ] Add per-socket rate limiting at 10 events per second.
- [ ] Add the room creation cap of 5 per IP per minute.

### Client

- [ ] Build the Landing and Join screens.
- [ ] Build the Lobby screen with room code, player list, and ready toggle.
- [ ] Add the QR code on the Lobby screen, linking to the URL with the room code.
- [ ] Store the session token in `localStorage`, keyed by room code.
- [ ] Show connection status: connecting, connected, reconnecting, and offline.
- [ ] Show a "Server waking up" spinner while the first connection is pending.
- [ ] Add the socket client with reconnect settings.

### Tests and checks

- [ ] Socket test: a bad payload returns `INVALID_PAYLOAD` and no state change.
- [ ] Socket test: a rejoin with a known token reuses the seat.
- [ ] Manual test: four browser windows join one room and see the same player list.
- [ ] Manual test: refreshing one window keeps the same seat.

## Done when

All steps are checked. Four windows share one lobby, and a refresh keeps the seat.
