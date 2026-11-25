// Reads environment variables once at startup and fails fast on bad values
// (design/05-coding-standards.md section 5). Never log secrets from here.

import { z } from 'zod';

const envSchema = z.object({
  CLIENT_ORIGIN: z.url().default('http://localhost:5173'),
  PORT: z.coerce.number().int().positive().default(3001),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

export type ServerConfig = z.infer<typeof envSchema>;

export function loadConfig(env: NodeJS.ProcessEnv): ServerConfig {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const problems = parsed.error.issues.map((issue) => issue.path.join('.')).join(', ');
    throw new Error(`Invalid server environment: ${problems}`);
  }
  return parsed.data;
}
