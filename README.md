# ⚓ PortMasters 2 · React + TypeScript Edition

> 🌐 **Bilingual Documentation** | [🇨🇳 查看中文文档](README_zh-CN.md)

A full rebuild of PortMasters 2 on a modern TypeScript stack. The Python and single file HTML original has been rewritten end to end into a typed Node backend and a React frontend, with the same game, the same rules, and the same bilingual interface, now organized as a tidy monorepo instead of two giant files.

---

## 📖 1. Overview

Welcome back to the Maritime Silk Road. Two captains sail one shared voyage, always on the same round and the same phase. You compete for renown, and along the way you barter goods, gold and rumors with each other. Draw a fortune from the Navigator's Compass, buy whispers from the brokers, fit your flagship with modules, and keep enough cash on hand for wages, upkeep and taxes every voyage (8 rounds on Easy, 12 on Standard, 16 on Hard). The richer reputation wins.

This edition keeps everything the original did and changes only the engine room:

- 🧩 **One game, two apps, one shared core.** A Node WebSocket server holds all the authoritative game logic; a React client renders it. Both import the same `packages/shared` data tables and wire types, so the two sides can never drift apart.
- 🔤 **TypeScript everywhere**, from the difficulty ladder to the barter exploit guard, with strict compiler settings.
- 🧪 **A real test suite.** 214 unit and integration tests cover the formulas, the phase state machine, the auth hashing, the lobby, and a full socket round trip.
- 🌍 **English (default) and Simplified Chinese**, switchable any time with the 🌐 button on every screen, including the login and lobby pages.
- 🪶 **Small, readable files.** The original's 1862 line server and 4098 line HTML file became roughly a hundred focused files, each one mapping to a single piece of the original.

If you have never played, the gameplay is identical to PortMasters 2. The sections below explain both how to run it and how it plays.

---

## 🛠️ 2. Installation & Running

### ✅ Prerequisites

- **Node.js 20.19+ or 22.12+** on the machine that hosts the game (the Vite build needs a recent runtime).
- **npm** (it ships with Node).
- Windows, macOS or Linux. Players themselves only need a modern browser.

### 🚀 Quick Start (one shared port, best for sharing)

This is the way to run it for real play, and the way to share it over the internet.

```bash
npm install        # install all workspaces once
npm run serve      # build the client, then serve everything on one port
```

Open **http://localhost:8080** in a browser, register an account, and log in. The web page and the WebSocket live on the same port, so a single tunnel carries the whole game:

```bash
ngrok http 8080
```

Share the ngrok URL with a friend. The https and wss adaptation is automatic, so there is nothing else to configure.

### 🧑‍💻 Developer Mode (hot reload, two ports)

While working on the code you usually want hot reload, so the client and server run separately. Use two terminals:

```bash
npm run dev:server   # Node backend on :8080, restarts on change
npm run dev:client   # Vite dev server on :5173, hot module reload
```

Open **http://localhost:5173**. Vite proxies the `/ws` WebSocket through to the backend, so you still only ever point your browser at one address.

### 🎯 Two browsers, one game

PortMasters 2 is a two captain game, so you need two logged in sessions to leave the login screen. Open the site in two separate browsers, or one normal window and one private/incognito window, and register a different account in each.

---

## 🗂️ 3. Project Structure

The project is an npm workspaces monorepo. Three packages, each with one job:

```
ReactPM2/
├── packages/shared/      # the single source of truth shared by both apps
│   └── src/
│       ├── data/         # game data tables: recipes, prices, wages, boons,
│       │                 # modules, monsoon, ports, the difficulty ladder…
│       ├── domain/       # core types: Worker, TradeOrder, IntelClue, cards…
│       └── protocol/     # the wire contract: PlayerGameState, messages
│
├── apps/server/          # authoritative Node game server (no UI)
│   ├── src/
│   │   ├── game/         # PlayerGame + the pure rule functions it delegates to
│   │   │                 # (costs, production, pirates, modules, card generation)
│   │   ├── session/      # SharedSession, the two player phase state machine
│   │   ├── actions/      # one handler per game action (purchase, trade, hire…)
│   │   ├── lobby/        # online registry, invitations, chat
│   │   ├── auth/         # PBKDF2 password hashing, the user store
│   │   ├── ws/           # the WebSocket connection loop and message router
│   │   ├── http/         # static file serving for the built client
│   │   └── main.ts       # the entry point that wires it all together
│   ├── tests/            # 214 vitest tests mirroring the src/ tree
│   └── data/users.json   # account store (created and updated at runtime)
│
└── apps/client/          # React frontend (Vite)
    └── src/
        ├── i18n/         # the bilingual layer: every label, the manual text,
        │                 # the server log translation table, item names…
        ├── ws/           # the single WebSocket hook
        ├── state/        # session, toast and spectate React contexts
        ├── components/   # layout, auth, lobby, the panels, the phase screens,
        │                 # the modal/manual/chat/tooltip/spectate systems
        └── styles/       # the global stylesheet
```

The guiding rule is that anything which must be identical on both sides lives in `packages/shared` and is imported, never copied. That is the main defense against the client and server ever disagreeing about a price or a rule.

---

## 🎮 4. Gameplay Mechanics

A game lasts **8 voyages** (rounds) on Easy, **12** on Standard or **16** on Hard, and each voyage runs through **8 phases**. No phase advances until both captains confirm.

| Phase | What happens |
|:---|:---|
| **⚓ Set Sail** | Confirm the start of the round. From round 2 on, this page also recaps how the last round went. |
| **🧭 Fortune** | The compass deals you 4 of the fortunes at random, and your partner gets a different hand. Lock one in; it lasts this round only. |
| **🛒 Procure** | Buy materials and goods from the supply cards. The Broker's Whisper panel sits at the top and sells intel about coming demand. |
| **🤝 Barter** | Trade with your partner. Post an offer like "I give this for that" and it settles the moment they accept. |
| **👥 Artisans** | Hire or dismiss artisans and hand out production tasks. Materials are consumed right away. |
| **📦 Trade** | Deliver port orders from your stock. Clues you bought show up here as guaranteed orders marked 🗣️. |
| **🔧 Upkeep** | Production arrives and wages are paid automatically, then you pay 15 gold of fleet upkeep. If you cannot, your fleet goes bankrupt. |
| **🚢 Shipyard** | Upgrade the ship if you like (levels 0 to 3), draft modules, then end the voyage. |

### ⚖️ Difficulty Modes

Every session starts on **Easy**. The inviting captain chooses the level and the other reads what it means and confirms before the voyage begins, so both captains always sail the same difficulty.

- **Easy (8 rounds)** keeps the whole voyage on the founding set of goods: three raw materials, four starter products, the first three artisan guilds, and their matching fortunes, modules, ports and weather. The market never gets crowded, which makes it the gentle place to start.
- **Standard (12 rounds)** opens the full trade at a brisker pace, with the Silk Road Charter expanding on Rounds 4 and 8, but no corrupt brokers.
- **Hard (16 rounds)** is the full challenge with the corrupt broker hazard switched on, expanding on Rounds 6 and 10. There is far more to manage and the competition for cargo and coin is fierce.

### 📦 Resources & Products

You buy raw materials, turn them into finished products with artisans, then deliver products on orders. Finished goods are worth far more than raw materials, so the buy → craft → sell loop is where the money is. Prices are lower at a commodity's home port and shift with the weather.

### 🧭 Fortunes

Each round the Navigator's Compass deals you a private hand of 4 random buffs and you lock in one for that round only. They range from a flat gold grant to halved shipping, cheaper hiring, an extra order, or a free Broker's Whisper clue.

### 🔧 Ship Modules

Upgrade your ship to unlock module slots (one per level, up to 3). Each Shipyard phase you can draft a fixed batch of three modules and install one, from the Smuggler's Hold to the Overdrive Engine. You get one re roll of the batch per round.

### 💰 Taxes & Finance

Product orders pay roughly 5% VAT, and at the end of each round you pay about 10% income tax on the round's net profit (5% with the Tax Exemption fortune). Wages and the 15 gold upkeep are due every round whether you earned anything or not, so cash flow comes first.

### 🌐 Multiplayer

Accounts are stored with salted PBKDF2 hashing. The lobby lists who is online, invitations carry the chosen difficulty, and a one per minute cooldown keeps things calm. If you drop, your account and the running session survive on the server, so you can log back in and pick up where you left off, as long as your partner is still around.

---

## ⌨️ 5. Controls

### ⚡ Keyboard Shortcuts

- **F1** opens the full manual at any time.
- **Esc** closes whichever overlay is on top, in this order: a dialog first, then the spectator window, then the chat window.

### 🖱️ Mouse

Everything else is point and click. Hover any underlined hint for a tooltip, and use the 🌐 button to switch language, the 📖 button for the manual, and the 💬 button to chat with your partner.

---

## 💡 6. Strategy Tips

- **Cash flow is everything.** Wages plus upkeep are due every round, and failing to pay them is far worse than earning a little less. The left panel tallies what you owe this round; keep an eye on it.
- **Sell finished goods, not raw materials.** A Scented Sachet is worth far more than the materials inside it.
- **Buy whispers.** Every clue becomes a guaranteed order later in the round, so stock up early for a sure sale, and the Broker's Network module makes whispers even cheaper.
- **Watch the weather.** Each round's monsoon raises some ports' payouts and lowers some prices, and it changes the pirate risk too.
- **Talk to your partner.** You can see each other's cargo and gold, so use the barter phase and the chat to cover each other's gaps.

---

## 🏆 7. Game End & Rankings

When the last voyage settles, your renown (the cumulative net profit of every delivered order) earns you a merchant rating. Because a longer voyage earns far more, each difficulty has its own thresholds. The top **Sovereign of the Silk Road** rating asks for renown of **1200+ on Easy**, **3000+ on Standard**, or **6000+ on Hard**. A bankrupt captain can still open the spectator window and watch the partner finish, and once both captains are done, either one can set sail again.

---

## 🛡️ 8. Troubleshooting

- **`Cannot find module ... .bin/...` when running a script.** The `node_modules/.bin` symlinks can get flattened into plain files by some cloud sync tools (iCloud Drive on a synced Desktop is the usual culprit). Rebuild them with `rm -rf node_modules/.bin && npm install`.
- **The page loads but looks unstyled.** Make sure you started the client through `npm run dev:client` or built it with `npm run build`. The stylesheet is bundled by Vite; opening a raw file will not pick it up.
- **Nothing past the login screen.** It takes two accounts. Open a second browser or a private window and register a separate captain.
- **The server restarted.** Accounts survive in `apps/server/data/users.json`, but a running voyage lives in memory and is gone. Start a fresh session.
- **Sharing over the internet.** Use the single port build (`npm run serve`) and tunnel that one port (`ngrok http 8080`) so the page and the WebSocket share one https origin.

---

## 🔧 9. Useful Commands

| Command | What it does |
|:---|:---|
| `npm install` | Install every workspace. |
| `npm run serve` | Build the client and serve the whole game on port 8080. |
| `npm run dev:server` | Run the backend, auto restarting on :8080. |
| `npm run dev:client` | Run the Vite dev server with hot reload on :5173. |
| `npm run build` | Build the client into `apps/client/dist`. |
| `npm run start` | Serve a prebuilt client on :8080. |
| `npm test` | Run the 214 server tests. |
| `npm run typecheck` | Type check all three workspaces. |
| `npm run lint` | Lint the whole repo. |

---

## 👤 10. Credits & License

- **Original game**: PortMasters 2 by `Joe Zhou, Aaron Zhu`.
- **Stack**: TypeScript, Node.js with `ws`, React 19, Vite, Vitest.
- **Language Support**: English (default) and Simplified Chinese, switchable inside the game.
- **License**: MIT License. Use it, change it, share it, for personal or commercial projects.
- New to the series? [PortMasters 1](https://lostinhustle.github.io/PortMasters/PortMasters_Web_Edition/PortMasters_v1.4.0) is a gentler, single player place to start.

---

## 🌟 Quick Reference

- **Run it**: `npm install`, then `npm run serve`, then open `http://localhost:8080`.
- **Share it**: `ngrok http 8080`.
- **Core loop**: Set Sail → Fortune → Procure → Barter → Artisans → Trade → Upkeep → Shipyard.
- **Best sellers**: Scented Sachets and Fine Brocade (mind the VAT).
- **Sure money**: buy whispers and equip the Broker's Network.
- **Bankruptcy warning**: if gold cannot cover wages and upkeep at settlement, you are out (though you can spectate).
- **Win condition**: reach the top Sovereign rating, which is renown of 1200+ on Easy, 3000+ on Standard, or 6000+ on Hard.

---

🌊 *Fair winds and following seas, Captains!* 🏴‍☠️
