/**
 * Bundles the TypeScript self test with esbuild (already a vite dependency) and
 * runs it under node. Avoids adding a test runner or a TS loader to the project.
 */
import { build } from 'esbuild';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const dir = mkdtempSync(join(tmpdir(), 'dcx-selftest-'));
const out = join(dir, 'selftest.mjs');

await build({
  entryPoints: ['scripts/selftest.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  outfile: out,
  logLevel: 'error',
});

const res = spawnSync(process.execPath, [out], { stdio: 'inherit' });
rmSync(dir, { recursive: true, force: true });
process.exit(res.status ?? 1);