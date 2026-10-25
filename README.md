# music-streamer

Self-hosted web app to stream your own music files over your local network.

## Run

```bash
MUSIC_FOLDER=./sample-music npm run dev     # dev server
npm run start                               # build + production server
```

The server requires the `MUSIC_FOLDER` env var; `PORT` defaults to 5177.

## Optional OpenID Connect login

Login is optional — without the env vars below the app works with no
authentication at all.

To enable login, register a confidential client with redirect URI
`http://<host>:<port>/auth/callback` and set:

| Variable | Description |
| --- | --- |
| `OIDC_ISSUER` | Issuer URL (default `https://auth.mangosplit.com`) |
| `OIDC_CLIENT_ID` | Client ID from your IdP |
| `OIDC_CLIENT_SECRET` | Client secret from your IdP |
| `OIDC_REDIRECT_URI` | Optional override of the callback URL |
| `OIDC_REQUIRE_LOGIN` | `true` to require a session for `/api` and `/stream` |

Endpoints added when enabled:

- `GET /auth/login` — starts the authorization-code + PKCE flow
- `GET /auth/callback` — IdP callback, creates a session cookie
- `GET /auth/logout` — clears the session
- `POST /api/me` — current user (or `null`), `POST /api/authEnabled` — whether login is configured
