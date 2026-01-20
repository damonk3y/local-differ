import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued'
import { Highlight, themes } from 'prism-react-renderer'
import { ViewMode, ChangedFile } from '../../types/diff'
import './DiffViewer.css'

interface DiffViewerProps {
  file: ChangedFile | null
  oldContent: string
  newContent: string
  language: string
  viewMode: ViewMode
  loading: boolean
}

const darkStyles = {
  variables: {
    dark: {
      diffViewerBackground: '#1e1e1e',
      diffViewerColor: '#d4d4d4',
      addedBackground: 'rgba(46, 160, 67, 0.15)',
      addedColor: '#d4d4d4',
      removedBackground: 'rgba(248, 81, 73, 0.15)',
      removedColor: '#d4d4d4',
      wordAddedBackground: 'rgba(46, 160, 67, 0.4)',
      wordRemovedBackground: 'rgba(248, 81, 73, 0.4)',
      addedGutterBackground: 'rgba(46, 160, 67, 0.2)',
      removedGutterBackground: 'rgba(248, 81, 73, 0.2)',
      gutterBackground: '#1e1e1e',
      gutterBackgroundDark: '#1e1e1e',
      highlightBackground: 'rgba(255, 255, 255, 0.1)',
      highlightGutterBackground: 'rgba(255, 255, 255, 0.1)',
      codeFoldGutterBackground: '#252526',
      codeFoldBackground: '#252526',
      emptyLineBackground: '#1e1e1e',
      gutterColor: '#858585',
      addedGutterColor: '#3fb950',
      removedGutterColor: '#f85149',
      codeFoldContentColor: '#808080',
      diffViewerTitleBackground: '#252526',
      diffViewerTitleColor: '#d4d4d4',
      diffViewerTitleBorderColor: '#404040'
    }
  },
  line: {
    padding: '0 10px',
    fontSize: '13px',
    fontFamily: '"Fira Code", "Cascadia Code", Menlo, Monaco, monospace'
  },
  gutter: {
    padding: '0 10px',
    minWidth: '40px',
    fontSize: '12px'
  },
  contentText: {
    fontFamily: '"Fira Code", "Cascadia Code", Menlo, Monaco, monospace',
    fontSize: '13px',
    lineHeight: '1.5'
  }
}

// Map our language names to Prism language names
function mapLanguage(lang: string): string {
  const langMap: Record<string, string> = {
    typescript: 'tsx',
    javascript: 'jsx',
    text: 'text'
  }
  return langMap[lang] || lang
}

export function DiffViewer({
  file,
  oldContent,
  newContent,
  language,
  viewMode,
  loading
}: DiffViewerProps) {
  if (loading) {
    return (
      <div className="diff-viewer-empty">
        <div className="loading-spinner" />
        <p>Loading diff...</p>
      </div>
    )
  }

  if (!file) {
    return (
      <div className="diff-viewer-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="9" y1="15" x2="15" y2="15" />
        </svg>
        <p>Select a file to view diff</p>
      </div>
    )
  }

  const highlightSyntax = (str: string) => {
    const prismLang = mapLanguage(language)
    return (
      <Highlight theme={themes.vsDark} code={str} language={prismLang as any}>
        {({ tokens, getLineProps, getTokenProps }) => (
          <pre style={{ margin: 0, background: 'transparent' }}>
            {tokens.map((line, i) => {
              const lineProps = getLineProps({ line, key: i })
              return (
                <span key={i} {...lineProps} style={{ display: 'block' }}>
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token })} />
                  ))}
                  {line.length === 0 && ' '}
                </span>
              )
            })}
          </pre>
        )}
      </Highlight>
    )
  }

  return (
    <div className="diff-viewer">
      <div className="diff-header">
        <span className="diff-filename">{file.path}</span>
        <span className={`diff-status ${file.staged ? 'staged' : 'unstaged'}`}>
          {file.staged ? 'Staged' : 'Unstaged'}
        </span>
      </div>
      <div className="diff-content">
        <ReactDiffViewer
          oldValue={oldContent}
          newValue={newContent}
          splitView={viewMode === 'split'}
          useDarkTheme={true}
          compareMethod={DiffMethod.WORDS}
          renderContent={highlightSyntax}
          styles={darkStyles}
          leftTitle="Before"
          rightTitle="After"
        />
      </div>
    </div>
  )
}
