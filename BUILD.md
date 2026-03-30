# PumaResilience Build Guide

## Prerequisites

- Node.js 18+
- npm

Install dependencies:
```bash
npm install
```

## Build Modes

### Development Server
```bash
npm run dev
```
Starts a local dev server with HMR at `http://localhost:5173`.

### Standard Build
```bash
npm run build
```
Outputs a multi-file production build to `dist/`. Deploy this to any static hosting (Netlify, Vercel, S3, etc.).

### Standalone Single-HTML Build
```bash
npm run build:standalone
```
Outputs a single self-contained `dist-standalone/index.html` file (~3-4 MB). This file:
- Contains all JavaScript, CSS, and fonts inlined
- Works from `file://` (uses HashRouter instead of BrowserRouter)
- Has the favicon embedded as a base64 data URI
- Requires no server — just open the file in any modern browser
- All data is still stored in the browser's IndexedDB

### Demo Single-HTML Build
```bash
npm run build:demo
```
Outputs a single self-contained `dist-demo/index.html` file. Same as standalone, plus:
- Pre-loaded with sample data (Pawsitive Care Veterinary Group)
- Shows a "Demo Mode" banner at the top
- Import, export, and clear data features are hidden
- PDF export remains available
- Data resets to demo defaults on each page load

## How It Works

The build system uses Vite's `--mode` flag to control three build variants:

| Flag | `__STANDALONE_MODE__` | `__DEMO_MODE__` | Router | Output |
|------|----------------------|-----------------|--------|--------|
| (default) | `false` | `false` | BrowserRouter | `dist/` |
| `--mode standalone` | `true` | `false` | HashRouter | `dist-standalone/` |
| `--mode demo` | `true` | `true` | HashRouter | `dist-demo/` |

**Key files:**
- `vite.config.ts` — Mode detection, single-file plugin, asset inlining
- `src/env.d.ts` — TypeScript declarations for compile-time flags
- `src/main.tsx` — Conditional demo data loading before React render
- `src/demo-data-loader.ts` — Imports `demo-data.json` and populates IndexedDB
- `src/App.tsx` — Router switching + demo banner
- `src/pages/DataPage.tsx` — Hides import/export/clear in demo mode
- `demo-data.json` — Sample dataset (Pawsitive Care Veterinary Group)

## Updating Demo Data

To regenerate demo data:
1. Run the app normally (`npm run dev`)
2. Enter your sample data through the UI
3. Go to Data > Export to JSON
4. Replace `demo-data.json` with the exported file
5. Rebuild with `npm run build:demo`
