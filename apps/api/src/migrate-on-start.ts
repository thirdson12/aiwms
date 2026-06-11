import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

const repoRoot = resolve(__dirname, '../../..');

export function applyRenderDatabaseUrlFix() {
  const url = process.env.DATABASE_URL;
  if (!url || url.includes('sslmode=')) return;
  process.env.DATABASE_URL = url.includes('?')
    ? `${url}&sslmode=require`
    : `${url}?sslmode=require`;
}

export async function runDeployMigrations(maxAttempts = 30): Promise<void> {
  applyRenderDatabaseUrlFix();

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      execSync('pnpm db:migrate:deploy && pnpm db:seed', {
        cwd: repoRoot,
        stdio: 'inherit',
        env: process.env,
      });
      return;
    } catch {
      console.error(`Migration attempt ${attempt}/${maxAttempts} failed`);
      if (attempt >= maxAttempts) {
        throw new Error(
          'Database unreachable (P1001). In Render Dashboard: PostgreSQL → Connections → copy External Database URL → paste into aiwms-api DATABASE_URL → redeploy.',
        );
      }
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}
