# Shisa Revenge

A winter party card game set in Okinawa. Four to eight players join from a phone browser. No app, no account, no room code.

**Play it:** https://shisa-revenge.vercel.app

The game server runs on Render (`https://shisa-revenge-serve.onrender.com`). The free tier sleeps when nobody is playing, so the first connection can take up to a minute. The page shows "Server waking up" while that happens.

Design lives in `design/`. The build plan lives in `plan/`.

## Layout

- `client/`: React and Vite app, deployed to Vercel with Root Directory `client`.
- `server/`: Node, Express, and Socket.IO server, deployed to Render with Root Directory `server`.
- `shared/`: types, Zod schemas, and constants used by both.
- `design/`: game design and specs.
- `plan/`: ordered build plans (`wip/` and `complete/`).
- `deploy/`: step-by-step setup for Render and Vercel.

## Run locally

Requires Node 22 or newer.

```bash
npm install
npm run dev          # server on localhost:3001, client on localhost:5173
npm run test:windows # opens four small app windows side by side, for testing
```

Copy `.env.example` to `.env` for local values. Never commit `.env`.

Other scripts:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run plans:sweep  # moves finished plans from plan/wip to plan/complete
```

## Deploy

- Server: follow [`deploy/RENDER.md`](deploy/RENDER.md).
- Client: follow [`deploy/VERCEL.md`](deploy/VERCEL.md).

Deploy the server first, then the client, then set the server's `CLIENT_ORIGIN` to the Vercel URL.

## How to play

- Open the game page. You are placed in a lobby with names assigned for you.
- The game starts when eight players are in, or when the wait ends and someone presses Start. Starts with an even number of players only, so nobody sits out.
- Each round you pick one card to play: a number from 1 to 5, or your special card. Tap a card to review it, then lock in.
- The higher card wins the duel. A winner takes one of the loser's cards without seeing which one.
- Survivors who lose a duel to Shisa's Army catch a cold and join Shisa's Army.
- Players with no cards left are out. Survivors win if they last until the end or if everyone is out in the same round.

The full rules are in `design/04-game-rules.md`.
