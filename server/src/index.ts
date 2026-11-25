import { loadConfig } from './config.js';
import { createGameServer } from './server.js';

const config = loadConfig(process.env);
const game = createGameServer(config);

game.httpServer.listen(config.PORT, () => {
  console.log(`Shisa Revenge server listening on port ${String(config.PORT)}`);
});

// Close cleanly when the host stops the process (Render sends SIGTERM on deploys).
const shutdown = (): void => {
  void game.close().then(() => {
    process.exit(0);
  });
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
