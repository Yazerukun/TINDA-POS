#!/usr/bin/env node
// TINDA POS — Native Windows smoke QA (CDP-based, launch + renderer + SQLite probe).
// Usage:
//   node windows-smoke.mjs <path-to-exe> [--label <name>]
// Expectations (fresh machine, first launch):
//   - packaged app starts and keeps running
//   - Chromium DevTools is reachable and the renderer (login/setup) is loaded
//   - the first-run SQLite database is created under %APPDATA%\TINDA POS\database
//     (proves better-sqlite3 win32-x64 native module loaded inside the app)
// Exits 0 on PASS, 1 on FAIL.

import { spawn, spawnSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname, resolve } from 'node:path';

const [exe, ...args] = process.argv.slice(2);
const labelArg = args.indexOf('--label');
const label = labelArg >= 0 ? args[labelArg + 1] : 'app';

if (!exe) {
  console.error('usage: node windows-smoke.mjs <exe> [--label NAME]');
  process.exit(2);
}

const CDP_PORT = 9400 + Math.floor(Math.random() * 500);
const exePath = resolve(exe);
const appData = process.env.APPDATA || join(homedir(), 'AppData', 'Roaming');
const dbPath = join(appData, 'TINDA POS', 'database', 'tindapos.db');

const DB_WAIT_S = 90;
const CDP_WAIT_S = 120;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let child;
let exited = false;

function startApp() {
  child = spawn(exePath, [`--remote-debugging-port=${CDP_PORT}`], {
    cwd: dirname(exePath),
    detached: true,
    stdio: ['ignore', 'ignore', 'ignore'],
  });
  child.unref();
  child.on('exit', (code, signal) => {
    exited = true;
    console.log(`[${label}] app process exited unexpectedly: code=${code} signal=${signal}`);
  });
  console.log(`[${label}] launched: ${exePath} (pid ${child.pid}, cdp :${CDP_PORT})`);
}

async function fetchJson(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`http ${res.status}`);
  return res.json();
}

async function findPageTarget() {
  const deadline = Date.now() + CDP_WAIT_S * 1000;
  while (Date.now() < deadline) {
    if (exited) return null;
    try {
      const targets = await fetchJson(`http://127.0.0.1:${CDP_PORT}/json/list`);
      const page = targets.find((t) => t.type === 'page');
      if (page) return page;
    } catch {
      /* not up yet */
    }
    await sleep(1000);
  }
  return null;
}

async function evaluateInPage(target) {
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  const done = new Promise((resolveMsg, reject) => {
    const timer = setTimeout(() => reject(new Error('CDP evaluate timeout')), 15000);
    ws.addEventListener('open', () => {
      ws.send(
        JSON.stringify({
          id: 1,
          method: 'Runtime.evaluate',
          params: {
            expression: `JSON.stringify((() => {
              const t = document.title || '';
              const root = !!document.getElementById('root');
              const text = (document.body && document.body.innerText || '').slice(0, 120);
              return { title: t, hasRoot: root, text };
            })())`,
            returnByValue: true,
          },
        }),
      );
    });
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id === 1) {
        clearTimeout(timer);
        resolveMsg(msg);
      }
    });
    ws.addEventListener('error', reject);
  });
  try {
    const msg = await done;
    const value = JSON.parse(msg.result.result.value);
    ws.close();
    return value;
  } catch (e) {
    ws.close();
    throw e;
  }
}

async function waitForDb() {
  const deadline = Date.now() + DB_WAIT_S * 1000;
  while (Date.now() < deadline) {
    if (exited) return null;
    if (existsSync(dbPath) && statSync(dbPath).size > 0) {
      return statSync(dbPath).size;
    }
    await sleep(1000);
  }
  return null;
}

function killTree() {
  if (child && !exited) {
    if (process.platform === 'win32') {
      console.log(`[${label}] taskkill /pid ${child.pid} /T /F`);
      spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
    } else {
      child.kill('SIGKILL');
    }
  }
}

async function waitForRoot(target, timeoutS = 60) {
  const deadline = Date.now() + timeoutS * 1000;
  let page = null;
  while (Date.now() < deadline) {
    if (exited) return null;
    try {
      page = await evaluateInPage(target);
      if (page.hasRoot) return page;
    } catch (e) {
      console.warn(`[${label}] CDP evaluate retry: ${e.message}`);
    }
    await sleep(1500);
  }
  return page;
}

async function main() {
  startApp();
  let pass = true;

  const target = await findPageTarget();
  if (!target) {
    console.error(`[${label}] FAIL: never reached Chromium DevTools (:${CDP_PORT})`);
    pass = false;
  } else {
    console.log(`[${label}] CDP page target up: ${target.url || target.title}`);
    try {
      const page = await waitForRoot(target);
      if (!page) {
        console.error(`[${label}] FAIL: app exited while waiting for renderer root (#root)`);
        pass = false;
      } else {
        console.log(`[${label}] renderer: title=${JSON.stringify(page.title)} hasRoot=${page.hasRoot}`);
        console.log(`[${label}] body text: ${JSON.stringify(page.text)}`);
      }
      if (page && !page.hasRoot) {
        console.error(`[${label}] FAIL: renderer root (#root) not found after wait`);
        pass = false;
      } else if (page) {
        console.log(`[${label}] login/setup renderer is reachable`);
      }
    } catch (e) {
      console.error(`[${label}] FAIL: CDP evaluate error: ${e.message}`);
      pass = false;
    }
  }

  const dbSize = await waitForDb();
  if (!dbSize) {
    console.error(`[${label}] FAIL: first-run DB not created: ${dbPath}`);
    pass = false;
  } else {
    console.log(`[${label}] SQLite DB created (proves better-sqlite3 native module loaded): ${dbPath} (${dbSize} bytes)`);
  }

  if (exited) {
    console.error(`[${label}] FAIL: app process died during smoke`);
    pass = false;
  } else {
    console.log(`[${label}] app process still running after checks`);
  }

  killTree();
  await sleep(2000);

  console.log(`[${label}] RESULT: ${pass ? 'PASS' : 'FAIL'}`);
  process.exit(pass ? 0 : 1);
}

main().catch((e) => {
  console.error(`[${label}] FATAL: ${e.stack || e.message}`);
  process.exit(1);
});
