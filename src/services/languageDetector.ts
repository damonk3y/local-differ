const extensionMap: Record<string, string> = {
  ts: 'typescript',
  tsx: 'tsx',
  js: 'javascript',
  jsx: 'jsx',
  py: 'python',
  rb: 'ruby',
  go: 'go',
  rs: 'rust',
  java: 'java',
  kt: 'kotlin',
  swift: 'swift',
  c: 'c',
  cpp: 'cpp',
  h: 'c',
  hpp: 'cpp',
  cs: 'csharp',
  php: 'php',
  html: 'html',
  css: 'css',
  scss: 'scss',
  less: 'less',
  json: 'json',
  xml: 'xml',
  yaml: 'yaml',
  yml: 'yaml',
  md: 'markdown',
  sql: 'sql',
  sh: 'bash',
  bash: 'bash',
  zsh: 'bash',
  dockerfile: 'docker',
  makefile: 'makefile'
}

export function detectLanguage(filePath: string): string {
  const fileName = filePath.split('/').pop() || ''
  const ext = fileName.split('.').pop()?.toLowerCase() || ''

  // Check special filenames
  if (fileName.toLowerCase() === 'dockerfile') return 'docker'
  if (fileName.toLowerCase() === 'makefile') return 'makefile'

  return extensionMap[ext] || 'text'
}
