# WOJAK.IO — Project Scope

## Tagline
**The OG WOJAK — Since April 2023**

---

## Overview
wojak.io is the official community website for the original WOJAK token (0x5026F006B85729a8b14553FAE6af249aD16c9aaB) on Ethereum. It serves as a dashboard, education hub, community rally point, and entertainment destination for OG WOJAK holders. The site exists to counter a hostile CTO migration attempt and give the 14,000+ non-migrated holders a legitimate home.

---

## Tech Stack
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Deployment:** Vercel (hobby tier, public repo)
- **Repo:** GitHub (public, MIT license)
- **Swap Widget:** CoW Swap iframe embed (MEV-protected swaps)
- **Charts:** DEX Screener embed (price chart), Etherscan free API (data)
- **No backend.** All data fetched client-side.

---

## Environment Variables
All secrets stored in `.env.local` (gitignored). A `.env.example` is committed to the repo with blank values.

```
NEXT_PUBLIC_ETHERSCAN_API_KEY=your_key_here
```

---

## Key Contract Info
- **OG WOJAK Contract:** 0x5026F006B85729a8b14553FAE6af249aD16c9aaB
- **OG Uniswap Pool:** 0x0f23...496e (created April 17, 2023)
- **New/CTO Contract (hostile):** 0x8De39B057CC6522230AB19C0205080a8663331Ef
- **OG Twitter:** @WojakToken
- **CTO Twitter:** @wojakcto

---

## Site Structure

### Navbar
Fixed top navbar with:
- WOJAK logo + "The OG WOJAK — Since April 2023" tagline
- Nav links: **Dashboard** | **Crypto 101** | **Wojak TV** | **Games** (dropdown)
- Games dropdown lists all available games. Clicking one opens a modal overlay.
- Buy WOJAK button links to the on-page CoW Swap widget or scrolls to swap section.

---

### 1. Dashboard (Landing Page `/`)
The main page. Everything a holder or potential buyer needs at a glance.

**Hero Section:**
- WOJAK logo/branding large and centered
- Tagline: "The OG WOJAK — Since April 2023"
- Current price (pulled from Etherscan/DEX Screener)
- Quick stats row: Market Cap | TVL | 24h Volume | Holders

**Price Chart:**
- DEX Screener embed iframe pointed at OG contract
- Timeframe toggles (1H, 1D, 1W, 1M, 1Y, ALL)

**Dashboard Tabs (below chart):**
- **Recent Trades** — Live trade feed from Etherscan API (buy/sell, amount, wallet, time)
- **TVL / Liquidity** — Current TVL, LP lock status, lock expiry (year 2100)
- **Holders** — Current holder count from Etherscan API, displayed prominently

**Contract Info Section:**
- OG contract address (click to copy)
- Direct links: Etherscan | DEX Screener | Uniswap Pool
- LP lock proof link
- "Contract RENOUNCED — No admin functions" badge

**Swap Widget Section:**
- Embedded CoW Swap widget (iframe embed, no SDK dependency)
- Pre-filled: Sell ETH → Buy WOJAK (OG contract)
- Secondary link to Matcha.xyz with WOJAK pre-filled
- MEV protection badge/note explaining why CoW Swap

---

### 2. Crypto 101 (`/crypto-101`)
Education hub for newcomers. Written in plain language.

**Subsections (each is a collapsible accordion or sub-page):**
1. **What is a Wallet?** — MetaMask setup, what a wallet address is, hot vs cold wallets
2. **Private Keys & Seed Phrases** — What they are, why NEVER share them, how to back up safely
3. **How to Buy ETH** — On-ramps (Coinbase, MoonPay, etc.), sending ETH to your wallet
4. **How to Swap Tokens** — What a DEX is, how to use CoW Swap, slippage explained, MEV protection explained
5. **Reading Etherscan** — How to look up a contract, verify transactions, check token approvals
6. **What is Liquidity?** — LP explained simply, why locked LP matters, what TVL means
7. **Token Safety Basics** — How to spot scams, what "renounced" means, red flags to watch for (ties into migration report)
8. **Revoking Approvals** — How to check and revoke token approvals at etherscan.io/tokenapprovalchecker

---

### 3. Wojak TV (`/wojak-tv`)
Curated YouTube content from Wojak-related channels.

**Features:**
- Two featured channels: Low Budget Stories and Lord Wojak
- Video grid (3 columns desktop, 2 tablet, 1 mobile) with thumbnails, titles, dates
- Click-to-play modal with YouTube embed (no page navigation)
- YouTube Data API v3 with 10-minute in-memory cache
- Loading skeletons while fetching

---

### 4. Games (Modal Overlay System)
Games tab in navbar is a dropdown menu listing available games. Clicking a game opens a full-screen modal overlay with an X button to close. Play until done, close, back to site.

**Architecture:**
- `GameModal` component wraps any game component
- Games are lazy-loaded React components
- Easy to add new games: create component, add to dropdown list

**Games:**
- **Wojak Minesweeper** — Classic minesweeper. Wojak face is the bomb/mine. Grid sizes: Easy (9x9, 10 mines), Medium (16x16, 40 mines), Hard (30x16, 99 mines). Timer and mine counter. Wojak expressions change based on game state (happy, nervous, dead).
- **Chess** — Full chess game vs AI opponent. Four difficulties (Beginner/Advanced/Expert/Master). Drag-and-drop and click-to-move. Dark/light board themes. WOJAK vs PEPE theming.
- **Breakout** — Canvas-based brick breaker. Four difficulties (Easy/Medium/Hard/Expert). Mouse and touch controls. Multi-hit bricks with green-themed colors (#00ff41, #00cc33, #009926, #006619). 3 lives, score tracking.
- **Pong** — Canvas-based Pong vs AI. Four difficulties (Beginner/Advanced/Expert/Master). Player (WOJAK, left paddle) vs AI (PEPE, right paddle). Mouse and touch controls. Ball and paddles use #00ff41 green. First to 5 points wins.
- **Snake** — Canvas-based classic Snake. Four difficulties (Easy/Medium/Hard/Expert). Arrow keys/WASD on desktop, swipe gestures on mobile. Snake body uses #00ff41 green with gradient, food uses #ff4444 red. Score and high score tracking. Hard mode spawns random wall obstacles every 5 food eaten. Expert mode has smaller grid (15x15), faster speed, more obstacles, and food disappears after 7 seconds if not eaten.

**Future Games (dropdown is ready):**
- Find the Pair (memory match with crypto meme faces)
- Wojak Tetris (themed pieces)
- More as community suggests

---

### 5. Footer (unchanged numbering)
- Community links: Telegram | Twitter (@WojakToken) | Etherscan
- Contract address (click to copy)
- "DYOR. Verify everything on-chain. The blockchain doesn't lie."
- MIT License note

---

## Design Direction
- Dark mode primary (dark background, green/white accent — matching WOJAK green)
- Clean, modern crypto dashboard aesthetic — NOT cheap memecoin site
- Wojak meme elements used tastefully (logo, game assets, expressions)
- Mobile responsive — must work well on phones (most Telegram users will open links on mobile)
- Fast loading — no heavy assets, lazy load games and chart embeds

---

## File Structure
```
wojak-finance/
├── .env.local              (gitignored — secrets)
├── .env.example            (committed — blank template)
├── .gitignore
├── LICENSE                  (MIT)
├── README.md
├── SCOPE.md
├── TODO.md
├── PROGRESS.md             (running build log, updated every prompt)
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── public/
│   ├── images/
│   │   ├── wojak-logo.png
│   │   ├── wojak-happy.png
│   │   ├── wojak-nervous.png
│   │   ├── wojak-dead.png
│   │   └── ...game assets
│   └── favicon.ico
├── src/
│   ├── app/
│   │   ├── layout.tsx           (root layout, navbar, footer)
│   │   ├── page.tsx             (dashboard / landing)
│   │   ├── crypto-101/
│   │   │   └── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── navbar/
│   │   │   ├── Navbar.tsx
│   │   │   └── GamesDropdown.tsx
│   │   ├── footer/
│   │   │   └── Footer.tsx
│   │   ├── dashboard/
│   │   │   ├── HeroStats.tsx
│   │   │   ├── PriceChart.tsx       (DEX Screener embed)
│   │   │   ├── DashboardTabs.tsx
│   │   │   ├── RecentTrades.tsx
│   │   │   ├── LiquidityInfo.tsx
│   │   │   ├── HolderCount.tsx
│   │   │   ├── ContractInfo.tsx
│   │   │   └── SwapWidget.tsx       (CoW Swap embed)
│   │   ├── crypto101/
│   │   │   ├── AccordionSection.tsx
│   │   │   └── sections/
│   │   │       ├── WhatIsAWallet.tsx
│   │   │       ├── PrivateKeys.tsx
│   │   │       ├── HowToBuyETH.tsx
│   │   │       ├── HowToSwap.tsx
│   │   │       ├── ReadingEtherscan.tsx
│   │   │       ├── WhatIsLiquidity.tsx
│   │   │       ├── TokenSafety.tsx
│   │   │       └── RevokingApprovals.tsx
│   │   ├── migration/
│   │   │   ├── ReportContent.tsx
│   │   │   └── ComparisonTable.tsx
│   │   ├── games/
│   │   │   ├── GameModal.tsx
│   │   │   ├── minesweeper/
│   │   │   │   ├── Minesweeper.tsx
│   │   │   │   ├── Board.tsx
│   │   │   │   ├── Cell.tsx
│   │   │   │   └── types.ts
│   │   │   ├── chess/
│   │   │   │   ├── ChessGame.tsx
│   │   │   │   ├── chessLogic.ts
│   │   │   │   ├── chessAI.ts
│   │   │   │   └── chessTypes.ts
│   │   │   ├── breakout/
│   │   │   │   └── Breakout.tsx
│   │   │   ├── pong/
│   │   │   │   └── Pong.tsx
│   │   │   └── snake/
│   │   │       └── Snake.tsx
│   │   └── ui/
│   │       ├── CopyButton.tsx
│   │       ├── Badge.tsx
│   │       └── TabGroup.tsx
│   ├── lib/
│   │   ├── constants.ts         (contract addresses, links, etc.)
│   │   └── etherscan.ts         (API helper functions)
│   └── types/
│       └── index.ts
```

---

## Handoff & Security Notes
- All API keys in `.env.local` only — never committed
- `.env.example` shows required vars with blank values
- Public GitHub repo (transparency, community trust, free Vercel tier)
- MIT License
- To hand off: new maintainer forks/clones repo, creates own `.env.local`, deploys to their own Vercel account
- No personal info anywhere in codebase
- Vercel project can be transferred or redeployed independently

---

## External Links (for reference)
- CoW Swap Widget SDK: https://github.com/cowprotocol/widget-lib
- DEX Screener embed docs: https://docs.dexscreener.com
- Etherscan API docs: https://docs.etherscan.io
- Matcha.xyz: https://matcha.xyz
- CoW Swap: https://cow.fi
