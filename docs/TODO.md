# WOJAK.IO — TODO

## Instructions for Claude
**Every prompt, Claude MUST:**
1. Read `SCOPE.md`, `TODO.md`, and `PROGRESS.md` before writing any code
2. Understand current state from PROGRESS.md
3. Build the next unchecked items in order
4. After building, update TODO.md checkboxes and append to PROGRESS.md
5. Test on localhost before marking complete
6. Keep all docs in sync

---

## Phase 1: Project Setup
- [x] Initialize Next.js 14+ project with TypeScript and Tailwind CSS
- [x] Set up file structure per SCOPE.md
- [x] Create `.env.example` with `NEXT_PUBLIC_ETHERSCAN_API_KEY=your_key_here`
- [x] Add `.env.local` to `.gitignore`
- [x] Create `src/lib/constants.ts` with all contract addresses, links, social URLs
- [x] Create MIT LICENSE file
- [x] Create README.md with project description and setup instructions
- [x] Create PROGRESS.md (empty, ready for logging)
- [x] Verify `npm run dev` works on localhost

---

## Phase 2: Layout & Navigation
- [x] Build root layout (`src/app/layout.tsx`) with dark theme, global styles
- [x] Build Navbar component with logo + tagline "The OG WOJAK — Since April 2023"
- [x] Add nav links: Dashboard, Crypto 101, Migration Report
- [x] Build Games dropdown in navbar (lists games, click opens modal)
- [x] Add "Buy WOJAK" CTA button in navbar (green, stands out)
- [x] Build Footer component with community links, contract address, DYOR text
- [x] Mobile responsive hamburger menu for navbar
- [x] Test all nav links route correctly on localhost

---

## Phase 3: Dashboard — Hero & Price Chart
- [x] Build HeroStats component (logo, tagline, current price, quick stats row)
- [x] Integrate DEX Screener embed iframe for price chart (OG contract)
- [x] Style chart section with proper container and loading state
- [x] Build quick stats row: Market Cap | TVL | 24h Volume | Holders
- [x] Pull stats from Etherscan free API (`src/lib/etherscan.ts`)
- [x] Add loading skeletons for async data
- [x] Test on localhost — chart loads, stats populate

---

## Phase 4: Dashboard — Tabs (Trades, Liquidity, Holders)
- [x] Build TabGroup UI component for switching between tabs
- [x] Build DashboardTabs container component
- [x] Build RecentTrades tab — fetch recent token transfers from Etherscan API, display as table (type, amount, wallet, time)
- [x] Build LiquidityInfo tab — display TVL, LP lock status, lock expiry (year 2100), pool address
- [x] Build HolderCount tab — fetch current holder count from Etherscan, display prominently
- [x] Add auto-refresh interval for trades (every 30s)
- [x] Test all tabs on localhost

---

## Phase 5: Dashboard — Contract Info & Swap Widget
- [x] Build ContractInfo section — OG address with copy button, Etherscan link, DEX Screener link, Uniswap pool link, "Contract RENOUNCED" badge
- [x] Build Badge component with green/red/gray variants
- [x] Build SwapWidget component — CoW Swap iframe embedded with ETH→WOJAK pre-filled (no SDK, iframe approach)
- [x] Add secondary Matcha.xyz link/button
- [x] Add MEV protection explainer note near swap widget
- [x] Test swap widget loads and connects on localhost

---

## Phase 6: Migration Report Page
- [x] Create `/migration-report/page.tsx`
- [x] Build ReportContent component with all sections from the report
- [x] Build TL;DR summary section at top
- [x] Build ComparisonTable component (OG vs new, color-coded green/red)
- [x] Add red flags section with numbered items
- [x] Add migration mechanics section
- [x] Add platform attacks section
- [x] Add numbers analysis section
- [x] Add OG strengths section
- [x] Add action items section (DO NOT connect wallet, revoke approvals, etc.)
- [x] Add community next steps section
- [x] Add contract reference table at bottom
- [x] Add DYOR footer
- [x] Style everything consistent with site dark theme
- [x] Test on localhost

---

## Phase 7: Crypto 101 Page
- [x] Create `/crypto-101/page.tsx`
- [x] Build AccordionSection component (collapsible sections)
- [x] Write and build: What is a Wallet?
- [x] Write and build: Private Keys & Seed Phrases
- [x] Write and build: How to Buy ETH
- [x] Write and build: How to Swap Tokens (reference CoW Swap on our site)
- [x] Write and build: Reading Etherscan
- [x] Write and build: What is Liquidity?
- [x] Write and build: Token Safety Basics (ties into migration report)
- [x] Write and build: Revoking Approvals
- [x] Test all accordion sections expand/collapse on localhost
- [x] Test on mobile viewport

---

## Phase 8: Games System & Minesweeper
- [x] Build GameModal component (full-screen overlay, X to close, lazy loads game)
- [x] Wire GamesDropdown to open GameModal with selected game
- [x] Build Minesweeper game component
- [x] Implement game board with configurable grid sizes (Easy 9x9, Medium 16x16, Hard 30x16)
- [x] Implement mine placement, number calculation, flood-fill reveal
- [x] Implement flag/unflag with right-click
- [x] Implement win/loss detection
- [x] Add timer and remaining mines counter
- [x] Add wojak face expressions (happy = playing, nervous = close call, dead = game over, sunglasses = win)
- [x] Add difficulty selector (Easy/Medium/Hard)
- [x] Style with site theme colors
- [x] Test game fully playable in modal on localhost
- [x] Test modal opens from navbar dropdown and closes cleanly

---

## Phase 9: Polish & Mobile
- [x] Full mobile responsive pass on all pages
- [x] Test navbar hamburger menu + games dropdown on mobile
- [x] Test swap widget on mobile
- [x] Test minesweeper playable on mobile (touch events for flag vs reveal)
- [x] Test migration report table scrolls properly on mobile
- [x] Optimize image assets (compress, proper sizing)
- [x] Add proper meta tags (title, description, og:image for social sharing)
- [x] Add favicon (wojak themed)
- [x] Performance check — lazy load games, chart embed, swap widget
- [x] Cross-browser test (Chrome, Firefox, Safari)

---

## Phase 10: Deployment Prep
- [x] Ensure .gitignore is clean (node_modules, .next, .env*.local, out, dist, *.tsbuildinfo, .DS_Store)
- [x] Review and catalog all TODO comments in codebase — listed in PROGRESS.md
- [x] Run final `npm run build` — zero errors, zero warnings confirmed
- [x] Update README.md (project description, tech stack, setup instructions, all features, contract address, MIT license)
- [x] Update docs/SCOPE.md — corrected swap widget implementation detail (iframe, not SDK)
- [x] Update docs/TODO.md — all Phase 1-10 items checked off
- [x] Update docs/PROGRESS.md — complete log of all phases with final note
- [x] Create docs/DEPLOYMENT.md — step-by-step guide for GitHub + Vercel deployment

---

## Phase 11: Breakout Game
- [x] Create `src/components/games/breakout/Breakout.tsx` — canvas-based brick breaker game
- [x] Implement 4 difficulty levels (Easy/Medium/Hard/Expert) with same button style as Chess
- [x] Implement paddle control via mouse movement and touch drag (mobile support)
- [x] Implement ball physics, wall bounces, paddle angle deflection, brick collisions
- [x] Implement multi-hit bricks (2-hit on Hard, 2-hit and 3-hit on Expert)
- [x] Implement 3 lives system, score tracking, win/loss conditions
- [x] Use green theme brick colors (#00ff41, #00cc33, #009926, #006619) with dark background
- [x] Register in GameModal.tsx (lazy import) and GamesDropdown.tsx (GAMES array)
- [x] Update README.md, SCOPE.md, TODO.md, PROGRESS.md
- [x] Verify `npm run build` — zero errors

---

## Phase 12: Pong Game
- [x] Create `src/components/games/pong/Pong.tsx` — canvas-based Pong game (WOJAK vs PEPE)
- [x] Implement 4 difficulty levels (Beginner/Advanced/Expert/Master) with same button style as other games
- [x] Implement player paddle control via mouse movement and touch drag (mobile support)
- [x] Implement AI opponent with difficulty-scaled reaction speed, error margin, and tracking behavior
- [x] Implement ball physics, wall bounces, paddle angle deflection, scoring system
- [x] Implement first-to-5-points win condition with score display and round transitions
- [x] Display WOJAK and PEPE avatars with names matching Chess game pattern
- [x] Use green theme (#00ff41) for ball and paddles with dark background
- [x] Register in GameModal.tsx (lazy import) and GamesDropdown.tsx (GAMES array)
- [x] Update README.md, SCOPE.md, TODO.md
- [x] Verify `npm run build` — zero errors

---

## Future Additions (Post v1)
- [ ] Find the Pair memory game (crypto meme faces)
- [ ] Wojak Tetris (themed pieces)
- [ ] Holder count historical chart (requires tracking over time)
- [ ] Community Telegram widget or feed
- [ ] Governance / community voting section
- [ ] NFT gallery for WOJAK-related NFTs
- [ ] Multi-language support
- [ ] Blog / news section for community updates
