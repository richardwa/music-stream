# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A music streaming web app. Built with **Express** (server) + **Vite** (bundler) + **solid-vanilla** (frontend UI library, a vanilla-JS rendering library, not SolidJS).

## Commands

```bash
bun run dev         # Start Vite dev server on port 5177 (includes Express routes via plugin)
bun run build       # Format typecheck and build
bun run start       # Production mode run - no vite server
bun run format      # Format with Prettier
```

TypeScript strict mode is enforced. `bun` is the package manager.

## Architecture

```
src/
├── server/
│   ├── server.ts        # Express standalone server (production entry point)
│   ├── routes.ts        # Configures Express middleware, auto-maps ServerApi methods to POST routes
│   └── resources/       # server methods 
├── client/
│   ├── index.html       # SPA shell
│   ├── index.ts         # Entry: renders App into #app
│   └── app/
│       ├── app.ts       # Top-level App component with title + router root
│       ├── routes.ts    # HashRouter setup
│       ├── components.ts # Reusable UI primitives (Title, Panel, Button, TextInput, etc.)
│       └── player.ts     # Main page
└── common/
    ├── interface.ts     # Type enforced interface between client and server.
    └── util.ts          # Shared utilities (must not contain node or browser calls) - formatDate helper
```

### Key patterns

- **API routing**: `configureRoutes` and `fetchJson` are used for and type enforcement and method alignment.   `routes.ts` auto-generates POST endpoints from the `ServerApi` interface. Each server method becomes `/api/<methodName>`. The client calls them via `fetchJson("methodName", ...args)` which POSTs the args as a JSON array.
- **solid-vanilla**: This is not SolidJS. It's a custom vanilla-JS reactive UI library (`h()`, `div()`, `vbox()`, `hbox()`, `grid()`, `signal()`, `watch()`, `fragment()`, etc.). Signals drive reactivity; `watch()` and `.do()` handle async updates.
- **Frontend routes**: Uses `HashRouter` from solid-vanilla with `#`-based routing (currently single route `/` → `GitDemo`).
- **Dev vs prod**: During dev, Express runs inside Vite via a custom plugin (`expressPlugin`). In production, `server.ts` runs standalone and serves the built `dist/` directory as static files with SPA fallback.
