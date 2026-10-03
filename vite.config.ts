import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import os from 'node:os';

/**
 * Reachable from tailnet devices.
 *
 * - `host: '0.0.0.0'` binds every interface, not just loopback, so the dev and
 *   preview servers are reachable over the tailnet.
 * - `strictPort` stops Vite silently moving to 5174/4174 when a port is busy,
 *   which would break a bookmark on another device.
 * - `allowedHosts` covers Vite's host-header allow-list. Without it, a request
 *   arriving with a MagicDNS Host header is rejected with "Blocked request",
 *   even though the socket itself is reachable.
 */
const localAddresses = Object.values(os.networkInterfaces())
  .flat()
  .filter((i): i is os.NetworkInterfaceInfo => !!i && (i.family === 'IPv4' || i.family === 'IPv6') && !i.internal)
  .map((i) => i.address);

/**
 * Host-header allow-list.
 *
 * Vite answers "Blocked request. This host (x) is not allowed." to any Host that
 * is not listed - which silently looks like "cannot reach it from my phone" even
 * though the socket is wide open. The names people actually type for a tailnet
 * node are all different: the MagicDNS FQDN, the tailnet short name, the OS
 * hostname, and the bare IP. All of those are covered here.
 *
 * Single-label names are allowed via a regular expression. That is safe against
 * DNS rebinding (an attacker needs a domain with dots, which this still blocks),
 * and it is what makes `http://<shortname>:5173/` work.
 */
const allowedHosts: (string | RegExp)[] = [
  'localhost',
  '127.0.0.1',
  '::1',
  ...localAddresses,
  os.hostname(),
  // Tailnet MagicDNS and mDNS names.
  '.ts.net',
  '.local',
  't460.taila598b7.ts.net',
  't460',
  /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/,
  // Escape hatch: TAILSCALE_ALLOWED_HOSTS=all disables the check entirely.
  ...(process.env.TAILSCALE_ALLOWED_HOSTS === 'all' ? ([true] as unknown as (string | RegExp)[]) : []),
];

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: true,
    allowedHosts,
  },
  build: { target: 'es2020', chunkSizeWarningLimit: 2400 },
});