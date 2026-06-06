import { useState } from 'react';
import { runKind, runJavaScript, runViaPiston } from '../runner.js';

// "Run" button + output area for a snippet. Strategy depends on language:
// JS runs in a sandbox, HTML renders a preview, others use the Piston API.
export default function RunPanel({ code, language }) {
  const kind = runKind(language);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null); // { output, error }

  if (!kind) return null;

  async function run() {
    setOpen(true);
    if (kind === 'html') {
      setResult({ html: code });
      return;
    }
    setBusy(true);
    setResult(null);
    const res = kind === 'js' ? await runJavaScript(code) : await runViaPiston(language, code);
    setResult(res);
    setBusy(false);
  }

  const label = kind === 'piston' ? '▶ Run (Piston)' : '▶ Run';

  return (
    <>
      <button className="btn btn-run" onClick={run} disabled={busy}>
        {busy ? 'Running…' : label}
      </button>

      {open && (
        <div className="run-output">
          <div className="run-output-head">
            <span className="muted small">
              {kind === 'html' ? 'Preview' : 'Output'}
              {kind === 'piston' && ' · run remotely on Piston'}
            </span>
            <button className="mini-btn" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>

          {busy ? (
            <p className="muted run-pad">Running…</p>
          ) : result?.html !== undefined ? (
            <iframe
              className="run-preview"
              title="HTML preview"
              sandbox=""
              srcDoc={result.html}
            />
          ) : (
            <>
              {result?.output && <pre className="run-pre">{result.output}</pre>}
              {result?.error && <pre className="run-pre run-err">{result.error}</pre>}
              {!result?.output && !result?.error && (
                <p className="muted run-pad">(no output)</p>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}
