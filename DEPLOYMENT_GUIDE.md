# PortMasters 2: Production Deployment Guide

> 🌐 **Bilingual Documentation** | [🇨🇳 查看中文文档](DEPLOYMENT_GUIDE_zh-CN.md)

This is a record of why login and register broke when PortMasters 2 went live at
`https://www.portmasters2.guru/`, every problem hit while fixing it, and how each one
got solved. The goal is to explain *why* things are set up this way, not just list steps.

---

## 1. The original symptom

Everyone visiting the live site got stuck on the login/register page. Nothing happened
after clicking "Log In" or "Create Account."

## 2. The real root cause (not what it looked like)

A quick scan of the code turns up `localhost:8080` in two places
([apps/client/vite.config.ts](apps/client/vite.config.ts) and
[apps/server/src/main.ts](apps/server/src/main.ts)), so it's tempting to assume that's
the bug. It isn't. Those are dev-only defaults: the Vite dev proxy target and the local
fallback port. Neither one is reachable in production anyway, so fixing them wouldn't
have changed anything.

The actual problem is architectural, not a typo.

The backend ([apps/server](apps/server)) is a single long-running Node process. It opens
one `http.createServer`, attaches a `ws` `WebSocketServer` to that same socket, and keeps
all game state (rooms, sessions, who's online) in memory for as long as the process stays
alive. See [createHttpServer.ts](apps/server/src/http/createHttpServer.ts).

Vercel cannot run that kind of process. Vercel Functions are short-lived and stateless:
they spin up per request and don't hold a persistent socket connection or in-memory
state between requests. There's no setting that makes a `ws.WebSocketServer` work there;
it's a platform limitation, not a misconfiguration.

Since the repo had no `vercel.json`, no `/api` folder, and no Dockerfile, Vercel was only
ever building and serving the React client (`apps/client`). The backend never deployed
anywhere. The login form was sending requests into a void.

For what it's worth, the client itself was already written correctly for this kind of
setup. [WsContext.tsx](apps/client/src/ws/WsContext.tsx) built its WebSocket URL from
`window.location.host` dynamically instead of hardcoding anything. The bug wasn't in that
logic; it was that there was simply no server behind that origin in production.

## 3. The fix: split hosting

Vercel is good at one thing here (serving the static React build) and bad at another
(running a persistent stateful process), so the fix is to split them:

- **Client** stays on **Vercel**. No change needed, it already worked for serving pages.
- **Server** moves to **Railway**, a platform that runs real, persistent Node processes
  and supports WebSockets natively.

That means the client and server now live on two different domains, which needed a few
code changes:

| File | Change | Why |
|---|---|---|
| [WsContext.tsx](apps/client/src/ws/WsContext.tsx) | `wsUrl()` now reads `import.meta.env.VITE_WS_URL` if it's set, otherwise falls back to same-origin `/ws` as before | The client needs to know the server's address now that it isn't the same domain. Falling back to same-origin keeps local dev working exactly like before. |
| [main.ts](apps/server/src/main.ts) | Added a `USERS_FILE_PATH` env var, falling back to the old local path | Railway wipes the container disk on every redeploy. Accounts need to live on a mounted persistent volume instead, so the path to that volume has to be configurable. |
| [createHttpServer.ts](apps/server/src/http/createHttpServer.ts) | Added an `ALLOWED_ORIGINS` env var that restricts which origins can open a WebSocket connection, via `ws`'s `verifyClient` option | Once the server has its own public origin, anyone could otherwise point a browser at it from any site. Locking it to your own domain is the safer production default. Leaving it unset allows any origin, which matches the old behavior and is fine for local dev. |
| `railway.json` (new) | Pins Railway's build to `npm install` and the start command to `npm run start -w @pm2/server` | Without this, Railway's auto-detection tried to also build the client, which was wasteful and, as it turned out, also wrong (see Problem 3 below). |
| `apps/client/.env.example` (new) | Documents `VITE_WS_URL` | So nobody has to rediscover this from scratch later. |

All 246 existing tests, typecheck, and lint passed unchanged. This was purely additive
config, no game logic was touched.

## 4. Problem: "the branch already merged, where did my changes go?"

**What happened:** while these code changes were being made, a different, already
in-progress release branch (`release/pm2-react-v1.0.0b2`) got merged into `main` through
PR #5. The deployment fix changes were uncommitted edits sitting in the working tree at
the time, so they belonged to neither branch.

**Why it looked scary:** `git merge-base --is-ancestor HEAD main` reported the checked
out branch as not an ancestor of main, which is correct, but uncommitted file edits
aren't part of any commit, so they don't move with branches at all. They just stay in
the working directory no matter which branch is checked out, as long as they're not
stashed or discarded.

**The fix:** checked out `main` fresh (`git checkout main && git pull`), created a new
branch off of it (`fix/vercel-railway-split`), and the uncommitted edits came along
automatically (git carries working-tree changes across a checkout as long as they don't
conflict with the files changing). Committed there, pushed, opened PR #6, merged into
`main`. Nothing was lost; it was never tied to a branch in the first place.

**Lesson:** uncommitted changes don't belong to any particular branch. Commit early if
you want to keep track of which branch a change is meant for.

## 5. Problem: Railway dashboard was empty

**What happened:** after signing in to Railway, no projects showed up at all, even
though it looked like a "create project" flow had already been done earlier.

**Why:** the project creation never actually finished. The GitHub App authorization step
most likely got interrupted or skipped.

**The fix:** went directly to `railway.app/new` instead of trusting the dashboard,
chose "Deploy from GitHub repo," completed the GitHub App authorization fully (granting
access to the repo), and picked the repo from the list that appeared. That created a
real project with a service that actually started building.

## 6. Problem: Railway created two services instead of one

**What happened:** Railway auto-detected the npm-workspaces monorepo and split it into
two separate services, one rooted at `apps/client` and one at `apps/server`, instead of
using the root-level `railway.json`.

This mattered for two reasons. The `apps/client` service is pure waste: Vercel already
serves the client, so this extra copy on Railway doesn't connect to anything real. More
importantly, if a service's "Root Directory" is scoped to `apps/server` alone, running
`npm install` from inside that folder can't resolve `"@pm2/shared": "*"`, since that's an
npm workspaces link that only resolves when `npm install` runs from the repo root, where
the workspace structure is actually declared.

**The fix:** deleted the redundant `apps/client` service. For the `apps/server` service,
checked Settings → Root Directory. In this case it turned out fine, the build logs
showed `tsx src/main.ts` starting successfully and printing `✅ Server started: web
http://0.0.0.0:8080, WebSocket ws://0.0.0.0:8080`, which confirmed the workspace
dependency resolved correctly. If your root directory is scoped to a subfolder and the
build fails resolving a workspace package, clear that field back to blank so
`railway.json`'s commands run from the repo root instead.

## 7. Problem: copied the wrong domain (private vs. public)

**What happened:** Railway's Networking settings showed `pm2server.railway.internal`
first, and that got used as "the domain."

That's wrong because `.railway.internal` addresses are private network addresses. They
only work for service to service traffic inside Railway's own infrastructure, like one
Railway service talking to another (a database, say). A browser on the public internet
can never reach a `.railway.internal` address.

**The fix:** under the same Networking settings, the Public Networking section
(separate from Private Networking) has its own "Generate Domain" button. That produces a
real public address, `pm2server-production.up.railway.app`, reachable from any browser.
That's the one that belongs in the client config.

## 8. Problem: Vercel's env var page looked different than expected

**What happened:** Vercel's settings sidebar didn't have an obvious "Environment
Variables" entry. It now lives under a newer "Environments" feature, which reorganized
things.

**The fix:** used Vercel's command palette (`Cmd+K` / `Ctrl+K`) and searched for
"Environment Variables" directly, which jumped straight to the right page regardless of
how the sidebar was organized. Worth remembering for any dashboard that's been
redesigned since written instructions were last accurate.

## 9. Problem: the env var was never actually saved

**What happened:** that page said "No Environment Variables Added." Despite earlier
instructions to add `VITE_WS_URL`, it had never actually been saved.

This caused the exact original symptom for a different reason. With no env var, the
client fell back to its default same-origin `/ws` behavior, meaning it tried to talk to
`wss://www.portmasters2.guru/ws`, which (per Section 2) has no server behind it.

**The fix:** added the variable for real, scoped to the Production environment
specifically, the one tied to the `main` branch and the real domain.

## 10. Problem: redeployed the wrong deployment

**What happened:** after adding the env var, a redeploy was triggered, but on a Preview
deployment tied to the `fix/vercel-railway-split` branch, not the Production deployment
tied to `main`. Preview deployments get their own throwaway URLs and have no effect on
what visitors see at the real domain.

**The fix:** found the entry tagged Production (branch `main`) in the Deployments list
specifically, and redeployed that one.

## 11. Problem: the env var value itself was wrong

**What happened:** even after fixing which deployment got redeployed, login still
failed, and the browser's Network tab showed no WebSocket connection attempt at all, not
even a failed one.

**How this got diagnosed without more dashboard guesswork:** instead of asking for more
browser DevTools screenshots, the live site got inspected directly from the command
line:

```bash
curl -s https://www.portmasters2.guru/ | head           # find the JS bundle filename
curl -s https://www.portmasters2.guru/assets/index-XXXX.js -o bundle.js
grep -o '.\{0,40\}railway\.app.\{0,40\}' bundle.js       # see what got baked in
```

That turned up the actual deployed code:

```js
function wsUrl(){return `pm2server-production.up.railway.app`}
```

The bug: the Vercel variable had been set to the bare domain
(`pm2server-production.up.railway.app`) instead of a full WebSocket URL. A bare hostname
with no `wss://` scheme and no `/ws` path isn't a valid WebSocket URL, so
`new WebSocket(...)` throws an error immediately, before ever attempting a network
connection. That's exactly why no WS row ever appeared in the Network tab: the
connection was never attempted, it failed at construction.

**The fix:** corrected the value to the full URL:

```
wss://pm2server-production.up.railway.app/ws
```

(`wss://` scheme required, `/ws` path required, matching what
[createHttpServer.ts](apps/server/src/http/createHttpServer.ts) listens on.)

One more trick worth keeping: testing a server's WebSocket endpoint directly with
`curl`, no browser needed:

```bash
curl -sv --http1.1 --max-time 10 \
  -H "Connection: Upgrade" -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
  -H "Sec-WebSocket-Version: 13" \
  -H "Origin: https://www.portmasters2.guru" \
  https://<your-railway-domain>/ws
```

A server that's working correctly responds `HTTP/1.1 101 Switching Protocols`. This
confirmed Railway itself was fine well before the actual bug (the env var value) was
found, which ruled out "is the server even reachable" as a question entirely.

One catch: forcing this over HTTP/2 (curl's default when a server's TLS advertises it)
gives a misleading `404`, because the `Upgrade` header doesn't carry the same meaning
over HTTP/2. Always force `--http1.1` when testing a WebSocket handshake this way.

## 12. Current status and what's still worth double-checking

- Done: code merged to `main` (PR #6, commit `73f39d9`).
- Done: Railway server confirmed live and responding correctly to WS handshakes.
- Done: `VITE_WS_URL` corrected to the full `wss://.../ws` form on Vercel Production and
  redeployed.
- Not yet confirmed: whether a persistent volume was actually attached on Railway (mount
  path `/data`) with `USERS_FILE_PATH=/data/users.json` set to match. Without this,
  registered accounts get wiped on every Railway redeploy, since container disks are
  otherwise temporary. Worth checking before this matters for real, meaning before real
  users register.
- Not yet confirmed: whether `ALLOWED_ORIGINS` was set on Railway (for example
  `https://www.portmasters2.guru,https://portmasters2.guru`). Without it, the server
  currently accepts WebSocket connections from any origin. Functionally fine, just not
  locked down.
- Cleanup: the redundant Railway service auto-created for `apps/client` should be
  deleted if that hasn't happened yet. It does nothing useful and just burns Railway
  usage and build minutes.

## 13. Quick mental model for next time

- **Vercel** is great for static sites and short request/response APIs. Bad for
  anything that needs to hold a connection open or keep state in memory between
  requests.
- **Railway** (or similar: Render, Fly.io) runs a real, persistent process. Good for
  WebSocket servers, background workers, anything stateful.
- When a client and server live on different domains, the client needs to be told the
  server's address explicitly (`VITE_WS_URL` here). Same-origin assumptions silently
  stop working.
- Vite environment variables get baked in at build time, not read at runtime. Changing
  one always needs a fresh deploy to take effect.
- `.railway.internal` is private, service to service only. `*.up.railway.app` (or a
  custom domain) is public and reachable from browsers.
- When debugging whether deployed code is actually doing what you think, `curl` the
  live site and grep the built JS bundle directly. It's faster and more certain than
  going back and forth through browser DevTools screenshots.
