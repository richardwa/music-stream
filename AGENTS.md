# AGENTS.md

Guidance for coding agents working in this repository.

## Project Overview

**music-streamer** — a self-hosted web app to stream your own music files over your local network.

- **Server:** Express 5 (TypeScript, run via tsx). Serves the built frontend from `dist/`, a JSON API, and streams audio files from a configurable music folder.
- **Client:** Vite + TypeScript SPA built with [solid-vanilla](https://github.com/richardwa/solid-vanilla) (signals, `h()`-style element builders — no JSX) and Tabulator Tables for the track list.
- **Shared:** `src/common/` contains the API types and the typed `fetchJson` client used by both sides.

## Commands

```bash
npm run dev      # vite dev server (port 5177) with an embedded express API plugin
npm run build    # prettier (via prebuild) + tsc + vite build → dist/
npm run start    # build, then run the production express server (src/server/server.ts)
npm run format   # prettier on json/ts/src

# Development with sample data:
MUSIC_FOLDER=./sample-music npm run dev
# or: ./run-dev.sh   (builds, then runs dev with sample-music)
```

The server **requires** the `MUSIC_FOLDER` env var (throws without it). Optional: `PORT` (default 5177).

## Architecture

```
src/
├── server/
│   ├── server.ts    # production entry: express + static dist/ + SPA fallback
│   ├── routes.ts    # ServerApi routes mounted at /api/<method>, /stream serves MUSIC_FOLDER
│   └── conf.ts      # MUSIC_FOLDER env config
├── client/
│   ├── index.html / index.ts   # Vite entry
│   └── app/
│       ├── app.ts, routes.ts   # router / app shell
│       ├── player.ts           # main play page: Tabulator track list + audio player
│       └── components.ts       # shared UI components
└── common/
    ├── interface.ts  # Track/ServerApi types, apiPath, fetchJson RPC helper
    └── util.ts       # date formatting
```

### API pattern

The API is a simple JSON-RPC-style convention: every method of the `ServerApi` type in `src/common/interface.ts` is exposed as `POST /api/<method>` with the arguments array as the JSON body. To add an endpoint, add a method to `ServerApi`, implement it in `serverImpl` in `src/server/routes.ts`, and call it from the client via `fetchJson("methodName", ...args)` — types flow through end to end.

Audio files are streamed directly from `MUSIC_FOLDER` at `/stream/<relative path>`.

## Conventions

- TypeScript strict mode; ES2020 target, ESNext modules.
- Client UI is built programmatically with solid-vanilla builders (`h`, `div`, `button`, `vbox`, `signal`, ...) — follow that style, don't introduce JSX or another framework.
- Prettier runs automatically before builds (`prebuild`); keep code formatted.
- `sample-music/` is gitignored test data; don't commit media files.

## Notes for agents

- After changes, verify with `npx tsc` (fast typecheck) and, where feasible, `npm run build`.
- The dev server binds to all interfaces (`host: true`) on a fixed port 5177; production port comes from `PORT`.
