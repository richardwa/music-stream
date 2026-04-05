# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A music streaming web app — currently implemented as a git log viewer demo. Built with **Express** (server) + **Vite** (bundler) + **solid-vanilla** (frontend UI library, a vanilla-JS rendering library, not SolidJS).

## Commands

```bash
bun run dev         # Start Vite dev server on port 5177 (includes Express routes via plugin)
bun run build       # Format then build (tsc + vite build → dist/)
bun run start       # Build then run the Express server (src/server/server.ts)
bun run format      # Format with Prettier
```

TypeScript strict mode is enforced. `bun` is the package manager.

## Architecture

```
src/
├── server/
│   ├── server.ts        # Express standalone server (production entry point)
│   ├── routes.ts        # Configures Express middleware, auto-maps ServerApi methods to POST routes
│   └── resources/git.ts # Git CLI wrappers (getGitLog, getBranches)
├── client/
│   ├── index.html       # SPA shell
│   ├── index.ts         # Entry: renders App into #app
│   └── app/
│       ├── app.ts       # Top-level App component with title + router root
│       ├── routes.ts    # HashRouter setup
│       ├── components.ts # Reusable UI primitives (Title, Panel, Button, TextInput, etc.)
│       └── gitdemo.ts   # Main page: branch selector + git log grid
└── common/
    ├── interface.ts     # Shared types (GitLog, ServerApi) + fetchJson client helper
    └── util.ts          # formatDate helper
```

### Key patterns

- **API routing**: `configureRoutes()` in `routes.ts` auto-generates POST endpoints from the `ServerApi` interface. Each server method becomes `/api/<methodName>`. The client calls them via `fetchJson("methodName", ...args)` which POSTs the args as a JSON array.
- **solid-vanilla**: This is not SolidJS. It's a custom vanilla-JS reactive UI library (`h()`, `div()`, `vbox()`, `hbox()`, `grid()`, `signal()`, `watch()`, `fragment()`, etc.). Signals drive reactivity; `watch()` and `.do()` handle async updates.
- **Frontend routes**: Uses `HashRouter` from solid-vanilla with `#`-based routing (currently single route `/` → `GitDemo`).
- **Dev vs prod**: During dev, Express runs inside Vite via a custom plugin (`expressPlugin`). In production, `server.ts` runs standalone and serves the built `dist/` directory as static files with SPA fallback.
