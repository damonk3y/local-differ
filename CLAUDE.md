# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

Always use yarn (not npm).

```bash
# Development
yarn dev              # Start Vite dev server (frontend only)
yarn tauri:dev        # Run full Tauri desktop app with hot-reload

# Production
yarn build            # Build frontend with Vite
yarn tauri:build      # Create production desktop application
```

## Architecture Overview

Local Differ is a local code fixing tool that helps software engineers review and refine their work before committing. It provides syntax-highlighted diffs, inline comments, file approval tracking, and markdown context export—enabling a self-review workflow that improves code quality before it reaches teammates or CI.

### Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Desktop:** Tauri 2 (Rust backend)
- **Styling:** Tailwind CSS 4
- **Diff Display:** react-diff-viewer-continued + Prism

### Data Flow

```
React Frontend (TypeScript)
    ↓ (Tauri IPC invoke)
Rust Backend (Tauri Commands)
    ↓ (git CLI calls)
Local Git Repository
```

All git operations go through Rust via Tauri commands. The frontend never directly accesses git.

### Key Directories

- `/src/components/` - React UI components; `App.tsx` is the main orchestrator
- `/src/hooks/` - State management hooks:
  - `useGitDiff` - Git operations via Tauri commands
  - `useComments` - Comment persistence to localStorage
  - `useFileApproval` - File approval state tracking
- `/src/services/` - Business logic:
  - `contextGenerator.ts` - Generates markdown export with LCS-based diff algorithm
  - `languageDetector.ts` - File extension to language mapping
- `/src-tauri/src/` - Rust backend:
  - `git.rs` - Git operations (staged/unstaged changes, file content)
  - `settings.rs` - Persistent settings

### State Management

No external state library. Uses React hooks + localStorage:
- Comments keyed by `filePath:staged` with version migrations
- Debounced saves to localStorage
- Separate tracking for staged vs unstaged files

### Context Export

The context generator (`contextGenerator.ts`) creates markdown for AI-assisted code fixing:
- Detects "major rewrites" (>60% changes or >3x size change)
- Shows structural changes (added/removed functions/classes) for large rewrites
- Shows hunked diffs with line numbers for normal changes
- Places comments inline near relevant code
