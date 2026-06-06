// Supported languages: maps a language key to a human label and a file
// extension used when a snippet is downloaded as a source file.
export const LANGUAGES = {
  javascript: { label: 'JavaScript', ext: 'js' },
  typescript: { label: 'TypeScript', ext: 'ts' },
  python: { label: 'Python', ext: 'py' },
  java: { label: 'Java', ext: 'java' },
  c: { label: 'C', ext: 'c' },
  cpp: { label: 'C++', ext: 'cpp' },
  csharp: { label: 'C#', ext: 'cs' },
  go: { label: 'Go', ext: 'go' },
  rust: { label: 'Rust', ext: 'rs' },
  ruby: { label: 'Ruby', ext: 'rb' },
  php: { label: 'PHP', ext: 'php' },
  swift: { label: 'Swift', ext: 'swift' },
  kotlin: { label: 'Kotlin', ext: 'kt' },
  sql: { label: 'SQL', ext: 'sql' },
  bash: { label: 'Bash / Shell', ext: 'sh' },
  html: { label: 'HTML', ext: 'html' },
  css: { label: 'CSS', ext: 'css' },
  json: { label: 'JSON', ext: 'json' },
  yaml: { label: 'YAML', ext: 'yml' },
  markdown: { label: 'Markdown', ext: 'md' },
  plaintext: { label: 'Plain Text', ext: 'txt' },
};

export function isValidLanguage(key) {
  return Object.prototype.hasOwnProperty.call(LANGUAGES, key);
}

export function extensionFor(key) {
  return LANGUAGES[key]?.ext || 'txt';
}
