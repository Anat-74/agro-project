// Держит localtunnel к dev-серверу живым: перезапускает при падении,
// проверяет здоровье туннеля и пишет текущий URL в файл.
// Запуск: node scripts/phone-tunnel.mjs [port]
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const PORT = process.argv[2] || '3000';
const URL_FILE = 'C:/kilo-bridje/tmp/tunnel-url.txt';
const HEALTH_EVERY = 45_000;
const HEALTH_TIMEOUT = 25_000;

mkdirSync(dirname(URL_FILE), { recursive: true });

let child = null;
let currentUrl = null;
let restarting = false;

const log = (msg) => console.log(`[tunnel ${new Date().toISOString().slice(11, 19)}] ${msg}`);

function publishUrl(url) {
  currentUrl = url;
  try {
    writeFileSync(URL_FILE, url, 'utf8');
  } catch (e) {
    log(`не смог записать URL: ${e.message}`);
  }
  log(`URL: ${url}`);
}

function stopChild() {
  if (!child) return;
  const c = child;
  child = null;
  try {
    c.kill('SIGTERM');
  } catch {}
  setTimeout(() => {
    try {
      c.kill('SIGKILL');
    } catch {}
  }, 3000);
}

function start() {
  if (restarting) return;
  restarting = true;
  log('запускаю localtunnel…');
  child = spawn('npx', ['-y', 'localtunnel', '--port', PORT, '--subdomain', 'agro-preview'], {
    shell: true,
    windowsHide: true,
  });

  const onData = (buf) => {
    const text = buf.toString();
    process.stdout.write(text);
    const m = text.match(/https:\/\/[a-z0-9-]+\.loca\.lt/i);
    if (m && m[0] !== currentUrl) publishUrl(m[0]);
  };
  child.stdout.on('data', onData);
  child.stderr.on('data', onData);
  child.on('exit', (code) => {
    log(`localtunnel завершился (code=${code}), перезапуск через 3с`);
    child = null;
    restarting = false;
    setTimeout(start, 3000);
  });
  restarting = false;
}

async function healthy() {
  if (!currentUrl) return false;
  try {
    const res = await fetch(currentUrl + '/', {
      headers: { 'bypass-tunnel-reminder': 'true' },
      signal: AbortSignal.timeout(HEALTH_TIMEOUT),
    });
    return res.status < 500;
  } catch {
    return false;
  }
}

async function loop() {
  if (!(await healthy())) {
    if (currentUrl) log('туннель не отвечает — перезапускаю');
    stopChild();
    currentUrl = null;
    if (!child) start();
  }
  setTimeout(loop, HEALTH_EVERY);
}

start();
setTimeout(loop, HEALTH_EVERY);
