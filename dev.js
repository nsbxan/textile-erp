import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("=================================================");
console.log("🚀 Textile Fabric & Apparel ERP Tizimi Ishga Tushmoqda...");
console.log("=================================================");

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

// 1. Backend serverni ishga tushirish
const server = spawn('node', ['server/index.js'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

// 2. Frontend (Vite) ni ishga tushirish
const client = spawn(npmCmd, ['--prefix', 'client', 'run', 'dev'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

process.on('SIGINT', () => {
  server.kill();
  client.kill();
  process.exit();
});
