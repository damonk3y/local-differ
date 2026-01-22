# Local Differ

A local code review tool that helps software engineers review and refine their work before committing. Add inline comments, track approvals, and export context for AI-assisted review—all without leaving your local environment. Built with Tauri 2 and React.

## Features

- **Syntax-highlighted diffs** - View changes with proper language highlighting
- **Inline comments** - Add comments directly on diff lines
- **File approval tracking** - Mark files as reviewed/approved
- **Markdown export** - Generate context for code review with diffs and comments
- **Staged/unstaged separation** - Review staged and unstaged changes independently

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Desktop:** Tauri 2 (Rust)
- **Styling:** Tailwind CSS 4
- **Diff Display:** react-diff-viewer-continued + Prism

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Yarn](https://yarnpkg.com/)
- [Rust](https://www.rust-lang.org/tools/install)
- Tauri CLI prerequisites: [https://tauri.app/start/prerequisites/](https://tauri.app/start/prerequisites/)

## Installation

```bash
# Clone the repository
git clone https://github.com/your-username/local-differ.git
cd local-differ

# Install dependencies
yarn install
```

## Development

```bash
# Start the full Tauri desktop app with hot-reload
yarn tauri:dev

# Or start just the Vite dev server (frontend only)
yarn dev
```

## Building

```bash
# Build the production desktop application
yarn tauri:build
```

The built application will be in `src-tauri/target/release`.

## Usage

1. Open Local Differ
2. Select a Git repository folder
3. View staged and unstaged changes
4. Add inline comments by clicking on diff lines
5. Mark files as approved when reviewed
6. Export markdown context for sharing or AI-assisted review

## License

ISC
