// Snippet execution helpers.
// - JavaScript runs locally in a sandboxed iframe (no network, no DOM access).
// - HTML renders as a live preview in a sandboxed iframe.
// - Other languages run on the public Piston API (https://github.com/engineer-man/piston).

const IFRAME_LANGS = new Set(['javascript']);
const HTML_LANGS = new Set(['html']);

// Our language key -> Piston language name.
const PISTON = {
  typescript: 'typescript',
  python: 'python',
  go: 'go',
  rust: 'rust',
  java: 'java',
  c: 'c',
  cpp: 'c++',
  csharp: 'csharp',
  ruby: 'ruby',
  php: 'php',
  swift: 'swift',
  kotlin: 'kotlin',
  bash: 'bash',
};

// Remote execution is opt-in: set VITE_PISTON_URL to a Piston instance's base
// (e.g. https://your-host/api/v2/piston). The public emkc.org endpoint became
// whitelist-only in Feb 2026, so remote run is disabled unless you self-host.
const PISTON_URL = import.meta.env.VITE_PISTON_URL || '';

export function runKind(language) {
  if (IFRAME_LANGS.has(language)) return 'js';
  if (HTML_LANGS.has(language)) return 'html';
  if (PISTON_URL && PISTON[language]) return 'piston';
  return null;
}

export function canRun(language) {
  return runKind(language) !== null;
}

// Run JavaScript inside a throwaway sandboxed iframe and capture console output.
export function runJavaScript(code, { timeout = 4000 } = {}) {
  return new Promise((resolve) => {
    const id = `run_${Date.now()}_${Math.floor(performance.now())}`;
    const iframe = document.createElement('iframe');
    iframe.sandbox = 'allow-scripts';
    iframe.style.display = 'none';

    const logs = [];
    let settled = false;

    function cleanup() {
      window.removeEventListener('message', onMessage);
      clearTimeout(timer);
      iframe.remove();
    }
    function finish(extra = {}) {
      if (settled) return;
      settled = true;
      cleanup();
      resolve({ output: logs.join('\n'), ...extra });
    }
    function onMessage(e) {
      if (!e.data || e.data.__runId !== id) return;
      if (e.data.type === 'log') logs.push(e.data.line);
      else if (e.data.type === 'error') finish({ error: e.data.line });
      else if (e.data.type === 'done') finish();
    }

    const timer = setTimeout(
      () => finish({ error: 'Timed out after 4s (possible infinite loop).' }),
      timeout
    );
    window.addEventListener('message', onMessage);

    const srcdoc = `<!doctype html><html><body><script>
      const ID = ${JSON.stringify(id)};
      const fmt = (a) => a.map((x) => {
        try { return typeof x === 'object' ? JSON.stringify(x) : String(x); }
        catch { return String(x); }
      }).join(' ');
      const send = (type, line) => parent.postMessage({ __runId: ID, type, line }, '*');
      ['log','info','warn','error','debug'].forEach((m) => {
        console[m] = (...args) => send('log', fmt(args));
      });
      window.onerror = (msg) => { send('error', String(msg)); return true; };
      try {
        ${'\n'}${code}${'\n'}
        send('done');
      } catch (e) {
        send('error', (e && e.stack) ? e.stack : String(e));
      }
    <\/script></body></html>`;

    iframe.srcdoc = srcdoc;
    document.body.appendChild(iframe);
  });
}

// Run a snippet on the Piston API. Returns { output, error }.
let runtimesCache = null;
export async function runViaPiston(language, code) {
  const pistonLang = PISTON[language];
  if (!pistonLang) return { error: `Running ${language} isn't supported.` };

  try {
    if (!runtimesCache) {
      const r = await fetch(`${PISTON_URL}/runtimes`);
      runtimesCache = await r.json();
    }
    const runtime = runtimesCache.find(
      (rt) => rt.language === pistonLang || (rt.aliases || []).includes(pistonLang)
    );
    if (!runtime) return { error: `No runtime available for ${language}.` };

    const res = await fetch(`${PISTON_URL}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: runtime.language,
        version: runtime.version,
        files: [{ content: code }],
      }),
    });
    const data = await res.json();
    if (data.message) return { error: data.message };
    const run = data.run || {};
    const compile = data.compile || {};
    const out = [compile.stderr, run.stdout, run.stderr].filter(Boolean).join('\n');
    return { output: out || '(no output)', error: run.code !== 0 && !run.stdout ? run.stderr : '' };
  } catch (e) {
    return { error: `Could not reach the code runner (needs internet). ${e.message}` };
  }
}
