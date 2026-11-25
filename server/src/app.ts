// Builds the HTTP app. Socket.IO is attached in index.ts so this stays testable.

import express from 'express';

export function createApp(): express.Express {
  const app = express();

  app.disable('x-powered-by');

  app.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  return app;
}
