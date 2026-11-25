import { serverUrl } from './config.js';

// Placeholder shell. Screens are added in plans 02 to 06.
export function App() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-2 bg-sand p-6 text-navy">
      <h1 className="text-3xl font-bold">Shisa Revenge</h1>
      <p className="text-sm text-navy/70">Server: {serverUrl()}</p>
    </main>
  );
}
