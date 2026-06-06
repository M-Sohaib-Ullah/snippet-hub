import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Maps our language keys to the identifiers Prism understands.
const PRISM_LANG = {
  javascript: 'javascript',
  typescript: 'typescript',
  python: 'python',
  java: 'java',
  c: 'c',
  cpp: 'cpp',
  csharp: 'csharp',
  go: 'go',
  rust: 'rust',
  ruby: 'ruby',
  php: 'php',
  swift: 'swift',
  kotlin: 'kotlin',
  sql: 'sql',
  bash: 'bash',
  html: 'markup',
  css: 'css',
  json: 'json',
  yaml: 'yaml',
  markdown: 'markdown',
  plaintext: 'text',
};

export default function CodeView({ code, language, languageLabel }) {
  const [raw, setRaw] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="code-view">
      <div className="code-view-bar">
        <span className="muted small">{languageLabel || language}</span>
        <div className="code-view-actions">
          <button
            className={`mini-btn ${raw ? 'active' : ''}`}
            onClick={() => setRaw((r) => !r)}
            title="Toggle raw / highlighted view"
          >
            {raw ? 'Highlighted' : 'Raw'}
          </button>
          <button className="mini-btn" onClick={copy}>
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {raw ? (
        <pre className="raw-code">
          <code>{code}</code>
        </pre>
      ) : (
        <SyntaxHighlighter
          language={PRISM_LANG[language] || 'text'}
          style={oneDark}
          showLineNumbers
          customStyle={{
            margin: 0,
            borderRadius: '0 0 10px 10px',
            fontSize: 14,
            background: '#1e2230',
          }}
        >
          {code}
        </SyntaxHighlighter>
      )}
    </div>
  );
}
