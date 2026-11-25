# Shisa Revenge

A winter party card game set in Okinawa. Phones join from a browser with a room code. No app or account needed.

Design lives in `design/`. The build plan lives in `plan/`.

## Layout

- `client/`: React and Vite app, deployed to Vercel with Root Directory `client`.
- `server/`: Node, Express, and Socket.IO server, deployed to Render with Root Directory `server`.
- `shared/`: types, Zod schemas, and constants used by both.
- `design/`: game design and specs.
- `plan/`: ordered build plans (`wip/` and `complete/`).

## Setup

Requires Node 22 or newer.

```bash
npm install
npm run dev        # server and client together
npm run lint
npm run typecheck
npm test
npm run build
```

Copy `.env.example` to `.env` for local values. Never commit `.env`.

## Plans

Run `npm run plans:sweep` to move finished plans from `plan/wip/` to `plan/complete/`.

## Deployment

Deployment instructions and the live URL are added in plan 06.
