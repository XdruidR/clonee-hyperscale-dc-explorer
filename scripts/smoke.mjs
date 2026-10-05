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
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

/**
 * Chrome location. Resolved per platform because this suite is developed on
 * Windows and run on Linux CI, and the executable paths differ.
 */
const CHROME =
  process.env.CHROME_BIN ||
  (process.platform === 'win32'
    ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    : process.platform === 'darwin'
      ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
      : '/usr/bin/google-chrome');
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
/**
 * Chrome profile directory and debugging port.
 *
 * Both are platform-resolved because this suite runs on Windows during
 * development and on Linux in CI. The hard-coded POSIX profile path fails the
 * spawn outright on Windows, and a fixed debugging port collides when a preview
 * server is already running.
 */
const userDir = join(tmpdir(), 'dcx-smoke-profile');
const DEBUG_PORT = Number(process.env.SMOKE_DEBUG_PORT || (process.platform === 'win32' ? 9223 : 9222));
rmSync(userDir, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const chrome = spawn(CHROME, [
  '--headless=new',
  '--no-sandbox',
  '--disable-dev-shm-usage',
  `--remote-debugging-port=${DEBUG_PORT}`,
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
      const r = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/version`);
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

for (const mode of [
  'POWER',
  'COOLING',
  'WATER',
  'DATA',
  'RESILIENCE',
  'CONSTRUCTION',
  'COMMISSIONING',
  'PROJECT CONTROLS',
  'AI EVOLUTION',
]) {
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
  if (!/surviving pumps recover the flow/i.test(txt))
    throw new Error('failure outcome not explained in the panel');
  await shot('resilience-pump-failed');
});

await step('power: run the utility failure animation', async () => {
  await evaluate(`(() => {
    [...document.querySelectorAll('.tabs button')].find(x => x.textContent.trim() === 'POWER').click();
    return true;
  })()`);
  await sleep(400);
  await evaluate(`(() => {
    [...document.querySelectorAll('.panel.left button')].find(x => x.textContent.trim() === 'Play').click();
    return true;
  })()`);
  await sleep(6000);
  const txt = await evaluate(`document.querySelector('.panel.left').innerText`);
  if (!/UPS carries the load|Generators start|Generators stabilise|Load transferred/.test(txt))
    throw new Error('utility failure sequence did not advance');
  await shot('grid-failure');
});

await step('commissioning: turnover package gating', async () => {
  await evaluate(`(() => {
    [...document.querySelectorAll('.tabs button')].find(x => x.textContent.trim() === 'COMMISSIONING').click();
    return true;
  })()`);
  await sleep(500);
  const txt = await evaluate(`document.querySelector('.panel.left').innerText`);
  if (!/TURNOVER PACKAGES/i.test(txt)) throw new Error('the commissioning panel is not package based any more');
  if (!/220 kV substation/i.test(txt)) throw new Error('expected the substation turnover package to be listed');
  if (!/CLN1 hall 1/.test(txt) || !/cooling distribution/i.test(txt))
    throw new Error('expected building-qualified hall-scoped turnover packages to be listed');

  /* the hall IT package must be blocked by its upstream packages */
  await evaluate(`(() => {
    const rows = [...document.querySelectorAll('.panel.left .phase-list button')];
    const b = rows.find(x => x.textContent.includes('CLN1 hall 1') && x.textContent.includes('IT fitout'));
    if (!b) throw new Error('no IT fitout turnover package row found');
    b.click();
    return true;
  })()`);
  await sleep(350);
  const itTxt = await evaluate(`document.querySelector('.panel.left').innerText`);
  if (!/Blocked/.test(itTxt)) throw new Error('the IT turnover package should start blocked');
  if (!/cannot (advance|be signed off) because upstream turnover package/.test(itTxt))
    throw new Error(`expected upstream-package dependency reasons, got:\n${itTxt.slice(0, 600)}`);
  const btnState = await evaluate(`(() => {
    const b = [...document.querySelectorAll('.panel.left button')].find(x => x.textContent.startsWith('Complete:'));
    return b ? { disabled: b.disabled, label: b.textContent } : null;
  })()`);
  if (!btnState || !btnState.disabled)
    throw new Error('the Complete button must be disabled while the IT package is blocked');
  await shot('commissioning-blocked', 30_000);

  /* following the correct order on a root package must never gate */
  await evaluate(`(() => {
    const b = [...document.querySelectorAll('.panel.left .phase-list button')].find(x => x.textContent.includes('220 kV substation'));
    b.click();
    return true;
  })()`);
  await sleep(300);
  for (let i = 0; i < 14; i++) {
    const state = await evaluate(`(() => {
      const b = [...document.querySelectorAll('.panel.left button')].find(x => x.textContent.startsWith('Complete:'));
      return b ? { label: b.textContent, disabled: b.disabled } : { label: null };
    })()`);
    if (!state.label) break;
    if (state.disabled)
      throw new Error(`a root package with no prerequisites was gated at "${state.label}"`);
    await evaluate(`(() => {
      const b = [...document.querySelectorAll('.panel.left button')].find(x => x.textContent.startsWith('Complete:'));
      b.click();
      return true;
    })()`);
    await sleep(300);
  }
  const doneTxt = await evaluate(`document.querySelector('.panel.left').innerText`);
  if (!/complete/i.test(doneTxt)) throw new Error('completed package stages are not shown');
  await shot('commissioning', 30_000);
});

await step('guided journey moves the camera', async () => {
  await evaluate(`(() => {
    const b = [...document.querySelectorAll('.journey-strip button')].find(x => x.textContent.includes('Following the electrons'));
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
    const b = [...document.querySelectorAll('.panel.left button.row')].find(x => x.textContent.includes('Servers'));
    b.click();
    return true;
  })()`);
  await sleep(800);
  const insp = await evaluate(`(() => { const p = document.querySelector('.panel.right'); return p ? p.innerText : ''; })()`);
  if (!/why it exists/i.test(insp)) throw new Error('inspector did not open with the technical view');
  if (!/failure modes/i.test(insp)) throw new Error('inspector is missing the failure mode view');
  if (!/PUBLIC FACT|TYPICAL/.test(insp)) throw new Error('inspector is missing the classification badge');
  if (!/dependenc/i.test(insp)) throw new Error('inspector is missing the dependency view');
  if (!/turnover package/i.test(insp)) throw new Error('inspector is missing package-level commissioning status');
  await shot('inspector', 30_000);
});

await step('sources and method panel', async () => {
  await evaluate(`(() => {
    [...document.querySelectorAll('button')].find(x => x.textContent.includes('Sources & method')).click();
    return true;
  })()`);
  await sleep(600);
  const t = await evaluate(`document.querySelector('.sources-inner').innerText`);
  if (!/every claim in the model carries one of four labels/i.test(t))
    throw new Error('method panel missing the classification rule');
  if (!/where a value has to be assumed/i.test(t))
    throw new Error('method panel missing the honesty rule');
  if (!/What is not public/i.test(t))
    throw new Error('method panel missing the boundary of the public record');
  await shot('sources', 30_000);
  await evaluate(`(() => {
    [...document.querySelectorAll('.tabs2 button')].find(x => x.textContent.includes('Public facts')).click();
    return true;
  })()`);
  await sleep(400);
  const facts = await evaluate(`document.querySelector('.sources-inner').innerText`);
  if (!facts.includes('Emergency generation') || !facts.includes('FACT'))
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

await step('phone layout', async () => {
  /* emulate a tailnet Android handset and reload, so the layout is driven by a
     real viewport rather than a forced flag */
  await S('Emulation.setDeviceMetricsOverride', {
    width: 412,
    height: 915,
    deviceScaleFactor: 2.625,
    mobile: true,
    screenOrientation: { angle: 0, type: 'portraitPrimary' },
  });
  await S('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await S('Emulation.setUserAgentOverride', {
    userAgent:
      'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  });
  await S('Page.navigate', { url: `http://127.0.0.1:${PORT}${BASE}` });
  await sleep(4000);

  const layout = await evaluate(`(() => {
    const tabs = document.querySelectorAll('.m-tabbar button');
    const sidePanels = [...document.querySelectorAll('.panel.left, .panel.right')];
    const floating = sidePanels.filter((el) => {
      if (el.closest('.m-sheet-body')) return getComputedStyle(el).position !== 'static';
      return true; // outside the sheet means a desktop panel was left floating
    });
    return {
      tabbar: tabs.length,
      tabLabels: [...tabs].map(t => t.textContent.trim()),
      modepicker: document.querySelectorAll('.m-modepicker button').length,
      sidePanelCount: sidePanels.length,
      floatingSidePanels: floating.length,
      canvas: (() => { const c = document.querySelector('canvas'); return c ? { w: c.clientWidth, h: c.clientHeight } : null; })(),
      viewport: { w: window.innerWidth, h: window.innerHeight },
    };
  })()`);

  if (layout.tabbar !== 4) throw new Error(`expected a 4-tab phone bar, got ${layout.tabbar}`);
  if (layout.floatingSidePanels > 0)
    throw new Error('the desktop side panels are still floating over the phone layout');
  if (layout.modepicker < 8) throw new Error('the mode picker is missing from the phone toolbar');
  if (!layout.canvas || layout.canvas.w < 380)
    throw new Error(`canvas is not using the phone viewport: ${JSON.stringify(layout.canvas)}`);

  /* every tab must open its own sheet */
  for (const label of ['Explain', 'Journeys']) {
    await evaluate(`(() => {
      const target = [...document.querySelectorAll('.m-tabbar button')].find(x => x.textContent.includes(${JSON.stringify(label)}));
      // clicking an already-active tab closes the sheet, so close first if needed
      const sheetOpen = document.querySelector('.m-sheet');
      const isOpen = sheetOpen && ${JSON.stringify(label)} === 'Explain'
        ? document.querySelector('.m-sheet-head span')?.textContent.trim() === 'Explain'
        : false;
      if (isOpen) return true;
      target.click();
      return true;
    })()`);
    await sleep(450);
    const sheetTitle = await evaluate(`(() => {
      const h = document.querySelector('.m-sheet-head span');
      return h ? h.textContent.trim() : '';
    })()`);
    if (sheetTitle.toLowerCase() !== label.toLowerCase())
      throw new Error(`tab "${label}" did not open its sheet (got "${sheetTitle}")`);
  }
  await shot('phone-journeys', 60_000);

  await evaluate(`(() => {
    const b = [...document.querySelectorAll('.m-tabbar button')].find(x => x.textContent.includes('Explain'));
    b.click();
    return true;
  })()`);
  await sleep(500);
  const explainText = await evaluate(`document.querySelector('.m-sheet-body').innerText`);
  if (explainText.length < 200) throw new Error('the explain sheet is empty on a phone');

  /* the 3D labels are a DOM overlay; they must not paint over the sheet */
  const layering = await evaluate(`(() => {
    const sheet = document.querySelector('.m-sheet');
    const tabbar = document.querySelector('.m-tabbar');
    if (!sheet || !tabbar) return { ok: false, why: 'missing chrome' };
    const sheetZ = parseInt(getComputedStyle(sheet).zIndex || '0', 10);
    const tabZ = parseInt(getComputedStyle(tabbar).zIndex || '0', 10);
    // the highest z-index drei gives its Html labels
    let labelMax = 0;
    for (const el of document.querySelectorAll('.w3d-label-text')) {
      let n = el;
      while (n && n !== document.body) {
        const z = parseInt(getComputedStyle(n).zIndex || '0', 10);
        if (z > labelMax) labelMax = z;
        n = n.parentElement;
      }
    }
    return { ok: sheetZ > labelMax && tabZ > labelMax, sheetZ, tabZ, labelMax };
  })()`);
  if (!layering.ok)
    throw new Error(`3D labels paint over the phone chrome: ${JSON.stringify(layering)}`);
  await shot('phone-explain', 60_000);

  /* view options sheet, including the toggles that moved off the toolbar */
  await evaluate(`(() => {
    [...document.querySelectorAll('.m-topbar-actions button')].find(x => x.title === 'View options').click();
    return true;
  })()`);
  await sleep(400);
  const viewOk = await evaluate(`(() => {
    const body = document.querySelector('.m-sheet-body');
    if (!body) return { ok: false, why: 'no sheet' };
    const text = body.innerText;
    return {
      ok: /roof off/i.test(text) && /cutaway/i.test(text) && /evidence mode/i.test(text) && /isolat/i.test(text),
      len: text.length,
    };
  })()`);
  if (!viewOk.ok) throw new Error(`view options sheet incomplete: ${JSON.stringify(viewOk)}`);
  await shot('phone-view', 60_000);

  /* the journey card must not cover the whole campus on a phone */
  await evaluate(`(() => {
    const b = [...document.querySelectorAll('.m-tabbar button')].find(x => x.textContent.includes('Journeys'));
    b.click();
    return true;
  })()`);
  await sleep(350);
  await evaluate(`(() => {
    const b = [...document.querySelectorAll('.m-sheet-body button.row')][0];
    b.click();
    return true;
  })()`);
  await sleep(1500);
  const cardBox = await evaluate(`(() => {
    const c = document.querySelector('.journey-card');
    if (!c) return null;
    const r = c.getBoundingClientRect();
    return { top: r.top, bottom: r.bottom, height: r.height, width: r.width, vh: window.innerHeight };
  })()`);
  if (!cardBox) throw new Error('the journey card did not open on a phone');
  if (cardBox.height > cardBox.vh * 0.75)
    throw new Error(`the journey card covers the screen: ${JSON.stringify(cardBox)}`);
  await shot('phone-journey', 60_000);

  /* back to the campus, and confirm the desktop layout is restored on resize */
  await evaluate(`(() => {
    const b = [...document.querySelectorAll('.m-tabbar button')].find(x => x.textContent.includes('Campus'));
    b.click();
    return true;
  })()`);
  await sleep(300);
  const closed = await evaluate(`document.querySelector('.m-sheet') === null`);
  if (!closed) throw new Error('tapping Campus should close the sheet');
  await shot('phone-campus', 60_000);

  await S('Emulation.clearDeviceMetricsOverride');
  await S('Emulation.setTouchEmulationEnabled', { enabled: false });
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