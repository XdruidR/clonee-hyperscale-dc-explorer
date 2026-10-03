/**
 * Headless browser smoke test.
 *
 * Starts the production preview server, drives the real application in headless
 * Chrome over the DevTools protocol, exercises every mode, and fails on any
 * console error, page error or failed request. Also captures screenshots so the
 * render can be eyeballed.
 *
 * Run with:  npm run smoke
 */
import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

const CHROME = process.env.CHROME_BIN || '/usr/bin/google-chrome';
const OUT = 'smoke-out';
const PORT = 4173;

if (!existsSync('dist/index.html')) {
  console.error('dist/ not found - run `npm run build` first');
  process.exit(1);
}

/* --------------------------------------------------------- static file server */
const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.map': 'application/json',
};
/**
 * Serve dist/ under a subdirectory, the way GitHub Pages serves a project site
 * (https://<owner>.github.io/<repo>/). Mounting at a base path means this suite
 * fails if the build ever regresses to root-absolute asset URLs, which is the
 * single most common way a Vite app breaks on Pages.
 */
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const REPO = process.env.GITHUB_REPOSITORY?.split('/')[1] || pkg.name;
const BASE = `/${REPO}/`;

const server = createServer((req, res) => {
  const url = (req.url || '/').split('?')[0];
  if (url !== BASE && !url.startsWith(BASE)) {
    res.writeHead(404).end('not found');
    return;
  }
  const rel = url.slice(BASE.length);
  const file = `dist/${rel === '' ? 'index.html' : rel}`;
  try {
    const body = readFileSync(file);
    const ext = file.slice(file.lastIndexOf('.'));
    res.writeHead(200, { 'content-type': MIME[ext] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end('not found');
  }
});
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));

/* ------------------------------------------------------------- chrome driver */
const userDir = '/tmp/dcx-smoke-profile';
rmSync(userDir, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const chrome = spawn(CHROME, [
  '--headless=new',
  '--no-sandbox',
  '--disable-dev-shm-usage',
  '--remote-debugging-port=9222',
  `--user-data-dir=${userDir}`,
  '--window-size=1600,1000',
  '--use-angle=swiftshader',
  '--enable-unsafe-swiftshader',
  '--disable-gpu-sandbox',
  '--hide-scrollbars',
  'about:blank',
]);
chrome.stderr.on('data', () => {});

async function waitForDevtools() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch('http://127.0.0.1:9222/json/version');
      if (r.ok) return (await r.json()).webSocketDebuggerUrl;
    } catch {}
    await sleep(250);
  }
  throw new Error('chrome devtools did not come up');
}

const wsUrl = await waitForDevtools();

/* minimal CDP client over the raw websocket */
const { WebSocket } = await import('node:worker_threads').then(() => ({ WebSocket: globalThis.WebSocket }));
const ws = new WebSocket(wsUrl);
await new Promise((res, rej) => {
  ws.onopen = res;
  ws.onerror = rej;
});

let msgId = 0;
const pending = new Map();
const events = [];
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m);
    pending.delete(m.id);
  } else if (m.method) {
    events.push(m);
  }
};
function send(method, params = {}, sessionId) {
  const id = ++msgId;
  return new Promise((res, rej) => {
    pending.set(id, (m) => (m.error ? rej(new Error(`${method}: ${JSON.stringify(m.error)}`)) : res(m.result)));
    ws.send(JSON.stringify({ id, method, params, sessionId }));
  });
}

/* attach to a fresh tab */
const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
const S = (m, p) => send(m, p, sessionId);

await S('Page.enable');
await S('Runtime.enable');
await S('Log.enable');
await S('Network.enable');

const problems = [];
function drain() {
  for (const e of events.splice(0)) {
    if (e.method === 'Runtime.exceptionThrown') {
      const d = e.params.exceptionDetails;
      problems.push(`PAGE EXCEPTION: ${d.exception?.description || d.text}`);
    }
    if (e.method === 'Runtime.consoleAPICalled' && (e.params.type === 'error' || e.params.type === 'warning')) {
      problems.push(`CONSOLE ${e.params.type}: ${e.params.args.map((a) => a.value ?? a.description).join(' ')}`);
    }
    if (e.method === 'Log.entryAdded' && e.params.entry.level === 'error') {
      problems.push(`LOG: ${e.params.entry.text}`);
    }
    if (e.method === 'Network.loadingFailed') {
      problems.push(`REQUEST FAILED: ${e.params.errorText}`);
    }
  }
}

async function evaluate(expression) {
  const r = await S('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(`eval failed: ${JSON.stringify(r.exceptionDetails)}`);
  return r.result.value;
}

const steps = [];
console.log(`serving dist/ at ${BASE} (project-site layout)`);
async function step(name, fn) {
  process.stdout.write(`- ${name} ... `);
  try {
    await fn();
    drain();
    console.log('ok');
    steps.push({ name, ok: true });
  } catch (err) {
    drain();
    console.log('FAILED');
    steps.push({ name, ok: false, error: String(err) });
    problems.push(`STEP "${name}": ${err}`);
  }
}

/* ------------------------------------------------------------------- the run */

await step('load application', async () => {
  await S('Page.navigate', { url: `http://127.0.0.1:${PORT}${BASE}` });
  await sleep(3500);
  const title = await evaluate('document.title');
  if (!title.includes('Hyperscale')) throw new Error(`unexpected title: ${title}`);
  const canvas = await evaluate(
    "(() => { const c = document.querySelector('canvas'); return c ? {w: c.width, h: c.height} : null; })()",
  );
  if (!canvas || canvas.w < 100) throw new Error('no WebGL canvas found');
});

await step('webgl context is live', async () => {
  const info = await evaluate(`(() => {
    const c = document.querySelector('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    return gl ? { vendor: gl.getParameter(gl.VERSION), lost: gl.isContextLost() } : null;
  })()`);
  if (!info) throw new Error('no WebGL context');
  if (info.lost) throw new Error('WebGL context lost');
});

async function shotBytes(name) {
  const { data } = await S('Page.captureScreenshot', { format: 'png' });
  const buf = Buffer.from(data, 'base64');
  writeFileSync(`${OUT}/${name}.png`, buf);
  return buf.length;
}

/** A blank single-colour frame compresses to a very small PNG. */
async function shot(name, minBytes = 0) {
  const bytes = await shotBytes(name);
  if (bytes < minBytes) throw new Error(`${name} looks blank (${bytes} bytes of PNG)`);
  return bytes;
}

await step('3D scene has renderable content', async () => {
  const bytes = await shot('01-overview', 120_000);
  console.log(`(${Math.round(bytes / 1024)} KB) `);
});

await step('component count in the DOM-adjacent model', async () => {
  const n = await evaluate(`(() => {
    const el = [...document.querySelectorAll('.w3d-label-text')].length;
    return el;
  })()`);
  if (typeof n !== 'number') throw new Error('could not count labels');
  console.log(`(${n} labels) `);
});

for (const mode of ['POWER', 'COOLING', 'WATER', 'DATA', 'RESILIENCE', 'CONSTRUCTION', 'COMMISSIONING']) {
  await step(`mode: ${mode}`, async () => {
    await evaluate(`(() => {
      const b = [...document.querySelectorAll('.tabs button')].find(x => x.textContent.trim() === ${JSON.stringify(mode)});
      if (!b) throw new Error('mode button not found');
      b.click();
      return true;
    })()`);
    await sleep(mode === 'CONSTRUCTION' ? 1200 : 700);
    await shot(`mode-${mode.toLowerCase()}`, 60_000);
    const panelText = await evaluate(`(() => {
      const p = document.querySelector('.panel.left');
      return p ? p.innerText.length : 0;
    })()`);
    if (!panelText || panelText < 120) throw new Error(`mode panel did not render (${panelText} chars)`);
  });
}

await step('construction slider changes the model', async () => {
  await evaluate(`(() => {
    [...document.querySelectorAll('.tabs button')].find(x => x.textContent.trim() === 'CONSTRUCTION').click();
    return true;
  })()`);
  await sleep(500);
  const r = await evaluate(`(async () => {
    if (!document.querySelector('.panel.left input[type=range]')) return { error: 'no range input in the construction panel' };
    const set = (v) => {
      const s = document.querySelector('.panel.left input[type=range]');
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(s, String(v));
      s.dispatchEvent(new Event('input', { bubbles: true }));
    };
    const counts = [];
    for (const v of [0, 6, 12, 20, 28, 35]) {
      set(v);
      await new Promise(r => setTimeout(r, 500));
      counts.push(document.querySelectorAll('.w3d-label-text').length);
    }
    return counts;
  })()`);
  if (!Array.isArray(r)) throw new Error(`slider did not respond: ${JSON.stringify(r)}`);
  if (r[0] > r[5]) throw new Error(`labels did not increase with construction progress: ${r.join(',')}`);
  console.log(`(${r.join(' -> ')}) `);
  await shot('construction-complete', 60_000);
});

await step('view toggles: roof off, cutaway, exploded, labels', async () => {
  await evaluate(`(() => {
    const click = (txt) => {
      const l = [...document.querySelectorAll('.toolrow label')].find(x => x.textContent.includes(txt));
      l.querySelector('input').click();
    };
    click('roof off'); click('cutaway'); click('labels');
    const range = [...document.querySelectorAll('.explode input')][0];
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(range, '0.8');
    range.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  })()`);
  await sleep(1200);
  await shot('view-toggles', 40_000);
  const labelsAfter = await evaluate(`document.querySelectorAll('.w3d-label-text').length`);
  if (labelsAfter !== 0) throw new Error('label toggle did not hide labels');
});

await step('day / night and package colouring', async () => {
  const setSel = await evaluate(`(() => {
    const sels = [...document.querySelectorAll('.toolrow select')];
    const has = (s, v) => [...s.options].some(o => o.value === v);
    const colour = sels.find(s => has(s, 'package'));
    const day = sels.find(s => has(s, 'night'));
    if (!colour || !day) return { error: 'could not find the two toolrow selects' };
    window.__set = (el, v) => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
      setter.call(el, v);
      el.dispatchEvent(new Event('change', { bubbles: true }));
    };
    window.__set(colour, 'package');
    window.__set(day, 'night');
    return { colour: colour.value, day: day.value };
  })()`);
  if (setSel.error || setSel.colour !== 'package' || setSel.day !== 'night')
    throw new Error(`selectors not applied: ${JSON.stringify(setSel)}`);
  await sleep(900);
  await shot('night-package-colours', 40_000);
});

await step('resilience: inject a failure', async () => {
  await evaluate(`(() => {
    const sels = [...document.querySelectorAll('.toolrow select')];
    const day = sels.find(s => [...s.options].some(o => o.value === 'night'));
    window.__set(day, 'day');
    [...document.querySelectorAll('.tabs button')].find(x => x.textContent.trim() === 'RESILIENCE').click();
    return true;
  })()`);
  await sleep(300);
  const backToDay = await evaluate(
    `[...document.querySelectorAll('.toolrow select')].some(s => s.value === 'day')`,
  );
  if (!backToDay) throw new Error('day/night select did not accept day');
  await sleep(500);
  await evaluate(`(() => {
    const b = [...document.querySelectorAll('.panel.left button.row')].find(x => x.textContent.includes('Cooling pump'));
    b.click();
    return true;
  })()`);
  await sleep(700);
  const txt = await evaluate(`document.querySelector('.panel.left').innerText`);
  if (!/Remaining pumps take the flow/.test(txt)) throw new Error('failure outcome not explained in the panel');
  await shot('resilience-pump-failed');
});

await step('power: run the utility failure animation', async () => {
  await evaluate(`(() => {
    [...document.querySelectorAll('.tabs button')].find(x => x.textContent.trim() === 'POWER').click();
    return true;
  })()`);
  await sleep(400);
  await evaluate(`(() => {
    [...document.querySelectorAll('.panel.left button')].find(x => x.textContent.trim() === '▶ Play').click();
    return true;
  })()`);
  await sleep(6000);
  const txt = await evaluate(`document.querySelector('.panel.left').innerText`);
  if (!/UPS carries the load|Generators start|Generators stabilise|Load transferred/.test(txt))
    throw new Error('utility failure sequence did not advance');
  await shot('grid-failure');
});

await step('commissioning: progress and blocking', async () => {
  await evaluate(`(() => {
    [...document.querySelectorAll('.tabs button')].find(x => x.textContent.trim() === 'COMMISSIONING').click();
    return true;
  })()`);
  await sleep(400);
  await evaluate(`(() => {
    const b = [...document.querySelectorAll('.tabs button')].find(x => x.textContent.trim() === 'OVERVIEW');
    return true;
  })()`);
  const txt = await evaluate(`document.querySelector('.panel.left').innerText`);
  if (!/You cannot commission this rack yet because .+ has not completed/.test(txt))
    throw new Error(`commissioning dependency gating is not being demonstrated:\n${txt.slice(0, 400)}`);

  /* walk the programme in order; the correct order must never be gated */
  for (let i = 0; i < 6; i++) {
    const state = await evaluate(`(() => {
      const b = [...document.querySelectorAll('.panel.left button')].find(x => x.textContent.startsWith('Complete:'));
      return b ? { label: b.textContent, disabled: b.disabled } : { label: null, disabled: true };
    })()`);
    if (!state.label) break;
    if (state.disabled) throw new Error(`following the correct order, "${state.label}" was unexpectedly gated`);
    await evaluate(`(() => {
      const b = [...document.querySelectorAll('.panel.left button')].find(x => x.textContent.startsWith('Complete:'));
      b.click();
      return true;
    })()`);
    await sleep(320);
  }
  const done = await evaluate(`document.querySelector('.panel.left').innerText`);
  if (!/■/.test(done)) throw new Error('completed commissioning stages are not shown in the programme list');
  await shot('commissioning', 30_000);
});

await step('guided journey moves the camera', async () => {
  await evaluate(`(() => {
    const b = [...document.querySelectorAll('.journey-strip button')].find(x => x.textContent.includes('How does electricity reach a GPU'));
    b.click();
    return true;
  })()`);
  await sleep(1200);
  const card = await evaluate(`(() => { const c = document.querySelector('.journey-card'); return c ? c.innerText : ''; })()`);
  if (!card) throw new Error('journey card did not open');
  await evaluate(`(() => {
    const b = [...document.querySelectorAll('.journey-card button')].find(x => x.textContent.includes('Next'));
    b.click(); b.click();
    return true;
  })()`);
  await sleep(1500);
  await shot('journey', 40_000);
});

await step('inspector: select a component', async () => {
  await evaluate(`(() => {
    const b = [...document.querySelectorAll('.journey-card button')].find(x => x.textContent.includes('Exit'));
    if (b) b.click();
    return true;
  })()`);
  await sleep(300);
  await evaluate(`(() => {
    [...document.querySelectorAll('.tabs button')].find(x => x.textContent.trim() === 'COOLING').click();
    return true;
  })()`);
  await sleep(400);
  await sleep(500);
  await evaluate(`(() => {
    const b = [...document.querySelectorAll('.panel.left button.row')].find(x => x.textContent.includes('GPU'));
    b.click();
    return true;
  })()`);
  await sleep(800);
  const insp = await evaluate(`(() => { const p = document.querySelector('.panel.right'); return p ? p.innerText : ''; })()`);
  if (!/why it exists/i.test(insp)) throw new Error('inspector did not open with the technical view');
  if (!/failure modes/i.test(insp)) throw new Error('inspector is missing the failure mode view');
  if (!/PUBLIC FACT|TYPICAL/.test(insp)) throw new Error('inspector is missing the classification badge');
  if (!/dependenc/i.test(insp)) throw new Error('inspector is missing the dependency view');
  await shot('inspector', 30_000);
});

await step('sources and method panel', async () => {
  await evaluate(`(() => {
    [...document.querySelectorAll('button')].find(x => x.textContent.includes('Sources & method')).click();
    return true;
  })()`);
  await sleep(600);
  const t = await evaluate(`document.querySelector('.sources-inner').innerText`);
  if (!t.includes('PUBLIC FACT')) throw new Error('method panel missing classification rule');
  await shot('sources', 30_000);
  await evaluate(`(() => {
    [...document.querySelectorAll('.tabs2 button')].find(x => x.textContent.includes('Public facts')).click();
    return true;
  })()`);
  await sleep(400);
  const facts = await evaluate(`document.querySelector('.sources-inner').innerText`);
  if (!facts.includes('Emergency generation') || !facts.includes('PUBLIC FACT'))
    throw new Error('fact register did not render');
  await shot('facts', 30_000);
  await evaluate(`(() => {
    [...document.querySelectorAll('.tabs2 button')].find(x => x.textContent.includes('Sources')).click();
    return true;
  })()`);
  await sleep(300);
  const links = await evaluate(
    `[...document.querySelectorAll('.sources-inner a[href^="https"]')].map(a => a.href).length`,
  );
  if (!(links >= 12)) throw new Error(`source register has only ${links} external links`);
});

/* ------------------------------------------------------------------ wrap up */
drain();

const filtered = problems.filter(
  (p) => !/favicon|swiftshader|Automatic fallback to software|GroupMarkerNotSet|WebGL.*deprecat/i.test(p),
);

console.log('\n--- results ---');
for (const s of steps) console.log(`${s.ok ? 'PASS' : 'FAIL'}  ${s.name}${s.error ? ' :: ' + s.error : ''}`);
if (filtered.length) {
  console.log('\nconsole/page problems:');
  for (const p of [...new Set(filtered)].slice(0, 30)) console.log('  ' + p);
}
console.log(`\nscreenshots written to ${OUT}/`);

ws.close();
chrome.kill();
server.close();
const failed = steps.some((s) => !s.ok) || filtered.length > 0;
process.exit(failed ? 1 : 0);