const { cpSync, mkdirSync } = require('node:fs');
const { spawn } = require('node:child_process');

mkdirSync('.next/standalone/.next', { recursive: true });
cpSync('.next/static', '.next/standalone/.next/static', { recursive: true, force: true });
cpSync('public', '.next/standalone/public', { recursive: true, force: true });

const server = spawn(process.execPath, ['.next/standalone/server.js'], { stdio: 'inherit', env: process.env });
server.on('exit', code => { process.exitCode = code ?? 1; });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.kill(signal));
