// Production entry: Express API on an internal port, Next.js on the public $PORT (it proxies to the API).
import { spawn } from 'node:child_process';

const API_PORT = process.env.API_PORT || '3001';
const PORT = process.env.PORT || '3000';
const env = { ...process.env, API_PORT, API_ORIGIN: `http://127.0.0.1:${API_PORT}` };

const procs = [
  spawn(process.execPath, ['server/index.js'], { stdio: 'inherit', env }),
  spawn(process.execPath, ['web/node_modules/next/dist/bin/next', 'start', 'web', '-p', PORT, '-H', '0.0.0.0'], { stdio: 'inherit', env }),
];
for (const p of procs) p.on('exit', (code) => { for (const q of procs) if (q !== p) q.kill(); process.exit(code ?? 1); });
for (const sig of ['SIGTERM', 'SIGINT']) process.on(sig, () => procs.forEach((p) => p.kill(sig)));
