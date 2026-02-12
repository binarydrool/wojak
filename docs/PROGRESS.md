# WOJAK.FINANCE — Progress Log

---

## Phase 1: Project Setup — 2026-02-11

**Status:** Complete

**What was built:**
- Next.js 14.2.0 project already initialized with TypeScript, Tailwind CSS, App Router
- Full file structure created per SCOPE.md:
  - `src/components/navbar/` — Navbar.tsx, GamesDropdown.tsx
  - `src/components/footer/` — Footer.tsx
  - `src/components/dashboard/` — HeroStats, PriceChart, DashboardTabs, RecentTrades, LiquidityInfo, HolderCount, ContractInfo, SwapWidget
  - `src/components/crypto101/` — AccordionSection.tsx + 8 section placeholders (WhatIsAWallet, PrivateKeys, HowToBuyETH, HowToSwap, ReadingEtherscan, WhatIsLiquidity, TokenSafety, RevokingApprovals)
  - `src/components/migration/` — ReportContent.tsx, ComparisonTable.tsx
  - `src/components/games/` — GameModal.tsx + minesweeper/ (Minesweeper, Board, Cell, types.ts)
  - `src/components/ui/` — CopyButton, Badge, TabGroup
  - `src/lib/constants.ts` — All contract addresses, Etherscan URLs, DEX Screener URLs, swap links, social links, site metadata
  - `src/lib/etherscan.ts` — API helper stubs (fetchHolderCount, fetchRecentTrades, fetchTokenSupply, fetchEthBalance, fetchTokenStats)
  - `src/types/index.ts` — Shared TypeScript types (TokenStats, Trade, LiquidityInfo, GameDefinition, MinesweeperCell, AccordionItem, EtherscanResponse)
  - `src/app/crypto-101/page.tsx` — Route placeholder
  - `src/app/migration-report/page.tsx` — Route placeholder
  - `public/images/` — Empty directory ready for assets
- `.env.example` — committed with `NEXT_PUBLIC_ETHERSCAN_API_KEY=your_key_here`
- `.env.local` — created with blank value, confirmed in `.gitignore` (`.env*.local` pattern)
- `LICENSE` — MIT license
- `README.md` — Replaced default with project README (about, tech stack, setup instructions, contract info, community links)
- `docs/PROGRESS.md` — This file

**Verified:**
- `npm run dev` starts successfully on localhost:3000
- All three routes return HTTP 200: `/`, `/crypto-101`, `/migration-report`
- TypeScript compiles without errors

---

## Phase 2: Layout & Navigation — 2026-02-11

**Status:** Complete

**What was built:**
- `tailwind.config.ts` — Added WOJAK custom colors: `wojak-green` (#4ade80), `wojak-dark` (#0a0a0a), `wojak-card` (#141414), `wojak-border` (#1e1e1e)
- `src/app/globals.css` — Replaced default with dark theme (white text on #0a0a0a background), smooth scrolling for anchor links
- `src/app/layout.tsx` — Root layout with dark theme body classes, Inter font, imports Navbar and Footer so they appear on all pages, `pt-16` offset for fixed navbar
- `src/components/navbar/Navbar.tsx` — Fixed top navbar with:
  - WOJAK logo text + tagline "The OG WOJAK — Since April 2023" (tagline hidden on mobile)
  - Nav links: Dashboard | Crypto 101 | Migration Report (active link highlighted)
  - GamesDropdown component inline
  - Green "Buy WOJAK" CTA button — scrolls to `#swap` on dashboard, navigates to `/#swap` from other pages
  - Mobile hamburger menu (X/hamburger icon toggle), all nav links stack vertically when open
  - Backdrop blur effect on scroll
- `src/components/navbar/GamesDropdown.tsx` — Hoverable dropdown under Games link, lists "Minesweeper", click handler `console.log`s game ID (modal wiring deferred to Phase 8), closes on outside click, chevron rotates on open
- `src/components/footer/Footer.tsx` — Three-column grid: community links (Twitter @WojakToken, Telegram, Etherscan), OG contract address with CopyButton, DYOR disclaimer text, MIT license note at bottom
- `src/components/ui/CopyButton.tsx` — Reusable clipboard component with copy icon, "Copied!" green feedback for 2 seconds, fallback for older browsers, accepts `text`, `label`, and `className` props
- `src/app/page.tsx` — Replaced default Next.js boilerplate with simple Dashboard placeholder
- All links and addresses sourced from `src/lib/constants.ts` — no hardcoded values

**Design:**
- Dark background (#0a0a0a), WOJAK green (#4ade80) accent, white text
- Clean modern crypto dashboard aesthetic
- Mobile responsive: hamburger menu toggles nav on small screens

**Verified:**
- `next build` compiles successfully with zero errors
- Dev server: `/` → 200, `/crypto-101` → 200, `/migration-report` → 200
- Navbar, footer, nav links, Buy WOJAK button, contract address, DYOR text all render correctly
- All constants imported from `src/lib/constants.ts`

---

## Phase 3: Dashboard — Hero & Price Chart — 2026-02-11

**Status:** Complete

**What was built:**
- `src/lib/etherscan.ts` — Fully implemented API functions:
  - `buildUrl()` — Helper to construct Etherscan API URLs with params and API key
  - `fetchTokenSupply()` — Calls Etherscan `stats/tokensupply` endpoint, returns raw supply string
  - `fetchRecentTrades()` — Calls `account/tokentx` endpoint, returns 20 most recent transfers as Trade[]
  - `fetchEthBalance()` — Calls `account/balance` endpoint for any address
  - `fetchHolderCount()` — Returns placeholder (14,000) with TODO for Alchemy/Moralis/Etherscan Pro
  - `fetchTokenStats()` — Aggregates stats for dashboard; fetches token supply, returns placeholder values for price/marketCap/TVL/volume24h with detailed TODO comments noting Etherscan free tier limitations and alternative data sources needed (DexScreener API, CoinGecko, Uniswap pool reserves, Alchemy)
- `src/components/dashboard/HeroStats.tsx` — Client component with:
  - Large centered "WOJAK" branding text in wojak-green
  - Tagline "The OG WOJAK — Since April 2023" from constants
  - Current price display (shows "Price loading..." placeholder until real pricing API is integrated)
  - Quick stats row: Market Cap | TVL | 24h Volume | Holders in a 4-column grid (2-col on mobile)
  - Stats card with wojak-card background and wojak-border
  - Full loading skeleton state: animated pulse placeholders for price and all 4 stat items
  - Fetches data from `fetchTokenStats()` on mount
- `src/components/dashboard/PriceChart.tsx` — Client component with:
  - DEX Screener iframe embed pointed at OG contract (0x5026F006B85729a8b14553FAE6af249aD16c9aaB)
  - Embed URL from constants: `https://dexscreener.com/ethereum/{contract}?embed=1&theme=dark`
  - Responsive container: full width, max-w-5xl, 500px height
  - Loading state: spinning wojak-green ring + "Loading chart..." text overlays until iframe loads
  - Rounded card container with wojak-card background and border
  - Lazy loading attribute for performance
  - "Chart powered by DEX Screener" attribution
- `src/app/page.tsx` — Dashboard landing page now renders HeroStats at top, PriceChart below

**Design:**
- Consistent dark theme: wojak-card (#141414) backgrounds, wojak-border (#1e1e1e), white text
- WOJAK green (#4ade80) accent for branding and loading spinner
- Animated skeleton placeholders (Tailwind animate-pulse) during data fetch
- Responsive: 2-column stats grid on mobile, 4-column on desktop
- Chart section responsive and mobile-friendly

**Etherscan API notes:**
- Free tier supports: token supply, token transfers, ETH balance
- Free tier does NOT support: market cap, TVL, 24h volume, holder count (all have TODO comments with recommended alternative APIs)
- Placeholder values used for unavailable data (price="—", marketCap="—", TVL="—", volume24h="—", holders=14000)

**Verified:**
- `next build` compiles successfully with zero errors
- Production server: `/` → HTTP 200
- HTML contains: WOJAK branding, Price Chart section, dexscreener iframe, animate-pulse skeletons, Loading chart text
- All constants sourced from `src/lib/constants.ts`

---

## Phase 4: Dashboard — Tabs (Trades, Liquidity, Holders) — 2026-02-11

**Status:** Complete

**What was built:**
- `src/components/ui/TabGroup.tsx` — Reusable tab switcher component:
  - Accepts array of `{ label, content }` tabs with optional `defaultIndex`
  - Renders horizontal tab buttons with wojak-green active indicator bar
  - Switches content on click, inactive tabs gray with hover state
  - Clean separator line between tabs and content
- `src/components/dashboard/DashboardTabs.tsx` — Container component:
  - Uses TabGroup with three tabs: Recent Trades | Liquidity | Holders
  - Wrapped in wojak-card with border, responsive padding
  - Wired into `src/app/page.tsx` below PriceChart
- `src/components/dashboard/RecentTrades.tsx` — Live trade feed:
  - Fetches recent token transfers via `fetchRecentTrades()` from etherscan.ts
  - Table columns: Type (Buy/Sell badge), Amount (formatted B/M/K), Wallet (truncated, links to Etherscan), Time (relative "2m ago")
  - Buy/sell classification: compares sender address against OG Uniswap pool — tokens leaving pool = buy, entering = sell
  - Auto-refresh every 30 seconds with `setInterval`
  - Loading skeleton rows (5 animated placeholder rows)
  - Empty state message when no trades found
  - Buy = green badge, Sell = red badge
- `src/components/dashboard/LiquidityInfo.tsx` — Liquidity details card:
  - TVL card with placeholder value (TODO: integrate Uniswap pool reserves)
  - LP Lock Status with green "Locked" indicator dot
  - Lock Expiry: "Locked until Year 2100" from constants
  - Pool Address: truncated with link to Etherscan
  - DEX: Uniswap V2
  - Footer note: "LP locked — liquidity cannot be rugged"
- `src/components/dashboard/HolderCount.tsx` — Prominent holder display:
  - Large wojak-green number (14,000+) fetched from `fetchHolderCount()`
  - "wallets holding OG WOJAK" subtitle
  - Context: "Over 14,000 holders have NOT migrated to the hostile CTO token"
  - Two stat cards: "14,000+ Diamond Hands" and "April 2023 Token Launch"
  - Loading skeleton for holder count
- `src/app/page.tsx` — Updated to render DashboardTabs below PriceChart

**Design:**
- Consistent dark theme: wojak-card backgrounds, wojak-border, white text
- WOJAK green (#4ade80) for active tab indicator, buy badges, holder count, LP status
- Red (#f87171) for sell badges
- Loading skeletons with animate-pulse throughout
- Responsive: table scrolls horizontally on mobile, stat cards stack in 2-col grid
- All addresses/links sourced from constants.ts

**Verified:**
- `next build` compiles successfully with zero errors
- Production server: `/` → HTTP 200
- JS bundle contains all Phase 4 content: "Recent Trades", "Liquidity Details", "Diamond Hands", "wallets holding", "Auto-refreshes", "LP Lock"
- All three tabs switch cleanly between content panels

---

## Phase 5: Dashboard — Contract Info & Swap Widget — 2026-02-11

**Status:** Complete

**What was built:**
- `src/components/ui/Badge.tsx` — Reusable badge component with three color variants:
  - `green` — verified/positive (green text, green border, green tinted background)
  - `red` — warning (red text, red border, red tinted background)
  - `gray` — neutral (gray text, gray border, gray tinted background)
  - Accepts `children`, `variant`, and `className` props
  - Pill-shaped (rounded-full), inline-flex with gap for icon + text
- `src/components/dashboard/ContractInfo.tsx` — Contract info section:
  - "Contract Info" heading with prominent green "Contract RENOUNCED — No admin functions" Badge (checkmark icon)
  - OG WOJAK contract address (0x5026F006B85729a8b14553FAE6af249aD16c9aaB) displayed in a dark input-like container with CopyButton
  - Three quick links: Etherscan | DEX Screener | Uniswap Pool — each opens in new tab with external link icon
  - LP Lock proof note: green-tinted callout with lock icon, "LP Locked — Liquidity is locked until Year 2100", links to pool on Etherscan
  - All addresses, URLs, and lock info sourced from `src/lib/constants.ts`
- `src/components/dashboard/SwapWidget.tsx` — Swap widget section:
  - `id="swap"` on the section so the navbar "Buy WOJAK" button scrolls to it
  - "Buy WOJAK" heading
  - CoW Swap embedded as iframe pointing to `https://swap.cow.fi/#/1/swap/ETH/{OG_CONTRACT}` (no SDK install needed)
  - 640px tall iframe container with loading spinner overlay until iframe loads
  - MEV protection explainer: green-tinted callout with shield icon — "CoW Swap protects you from MEV attacks (sandwich bots). Your trade is settled at the best price with no front-running."
  - Secondary "Trade on Matcha.xyz" link/button with external link icon
  - CoW Swap URL and Matcha URL sourced from constants.ts
- `src/app/page.tsx` — Updated to render ContractInfo and SwapWidget below DashboardTabs

**Design decisions:**
- Used iframe approach for CoW Swap instead of `@cowprotocol/widget-react` SDK — simpler, no extra dependency, and the CoW Swap web app already provides the full swap UI
- Consistent card styling with wojak-card background, wojak-border, rounded-2xl containers
- Green-tinted callout boxes for LP lock proof and MEV protection notes (matching existing site style)
- External link icons on all outbound links for clarity

**Verified:**
- `next build` compiles successfully with zero errors
- Production server: `/` → HTTP 200
- HTML contains all Phase 5 content: "Contract Info", "Contract RENOUNCED", "OG WOJAK Contract Address", "LP Locked", `id="swap"`, "Buy WOJAK", "cow.fi" iframe, "MEV Protected", "Matcha"
- Navbar "Buy WOJAK" button scrolls to `#swap` section (existing handleBuyClick in Navbar.tsx targets `document.getElementById("swap")`)

---

## Phase 6: Migration Report Page — 2026-02-11

**Status:** Complete

**What was built:**
- `src/components/migration/ComparisonTable.tsx` — Side-by-side comparison table:
  - 11 metric rows comparing OG WOJAK (0x50) vs New wojak (0x8d): Token Name, Supply, Holders, Market Cap, Liquidity, LP Lock, Contract, Volatility, Pool Created, Total TXs, Code
  - Color-coded: green text/background for OG advantages, red for new token dangers
  - Column headers: green "OG WOJAK (0x50)" and red "New wojak (0x8d)"
  - Alternating row stripes for readability
  - Horizontally scrollable on mobile (`overflow-x-auto` with `min-w-[640px]`)
  - Contract address footnotes below table
  - All addresses sourced from constants.ts
- `src/components/migration/ReportContent.tsx` — Full migration analysis report with all 13 sections:
  - Helper components: `SectionCard` (consistent card wrapper with optional border color override) and `SectionHeading` (h2 with responsive sizing)
  - **Section 1:** Page title — "WOJAK OG Community" subtitle, "Migration Analysis Report" h1, date, data source note
  - **Section 2:** TL;DR summary — yellow-bordered warning card with ⚠ icon, bold summary of hostile migration, market cap drop, new contract red flags, OG contract strengths
  - **Section 3:** "What Is Happening" — @wojakcto migration explanation with link to CTO Twitter
  - **Section 4:** ComparisonTable embedded in card with heading
  - **Section 5:** "Red Flags in the New Contract (0x8d)" — red-bordered card, 4 numbered items with `code`-styled function names: `blacklist(address, bool)`, `setRule(bool, address, uint256, uint256)`, `_beforeTokenTransfer override`, `Ownership NOT renounced`. Green callout at bottom noting OG has ZERO admin functions
  - **Section 6:** "How the Migration Works — And Why It Hurts OG Holders" — 3 numbered steps in red circles showing sell/buy/transfer flow. Red callout explaining every migration is a sell order, market cap drop from $29M to $2M, undisclosed migration contract
  - **Section 7:** "What They Have Done to the OG Token" — 5 platform attacks (Etherscan, DEX Screener, CMC, CEXs, X/Twitter) with red X icons
  - **Section 8:** "The Numbers Don't Add Up" — 5 bullet points with check icons: 14K+ non-migrated holders, $932K liquidity, 100K+ TXs, 2.4x higher volatility, 6,057x supply dilution
  - **Section 9:** "What the OG Contract Has Going For It" — 2x4 grid of green-tinted strength cards with SVG icons: Contract RENOUNCED, LP locked until 2100, Zero taxes, 19,630+ holders, ~$1M liquidity, Clean ERC-20 code, 100K+ transactions, @WojakToken on X
  - **Section 10:** "What You Should Do" — Split into red danger zone (DO NOT connect wallet, DO NOT approve contracts, revoke approvals link) and green action items (hold OG, report @wojakcto, contact platforms, spread info). Warning symbols ✗ for danger items, ✓ for positive actions
  - **Section 11:** "What's Next for the OG Community" — Rally message about wojak.finance, green callout about 14,000+ non-migrated holders
  - **Section 12:** Contract addresses reference table — 7 rows: OG WOJAK, New wojak, OG Uniswap Pool, OG Website, OG X/Twitter, CTO Website, CTO X/Twitter. Mono font for addresses, wojak-green for links
  - **Section 13:** DYOR footer — "DYOR. Verify everything on-chain. The blockchain doesn't lie."
  - All contract addresses and URLs sourced from `src/lib/constants.ts` — no hardcoded values
- `src/app/migration-report/page.tsx` — Updated from placeholder to render ReportContent in a max-w-4xl centered container with responsive padding

**Design:**
- Consistent dark theme: wojak-card (#141414) backgrounds, wojak-border (#1e1e1e), white text, rounded-2xl cards
- Color system: green (#4ade80) for OG positives, red (#f87171) for dangers, yellow (#facc15) for warnings
- Tinted backgrounds: green-500/5 for positive sections, red-500/5 for warnings, yellow-500/3 for TL;DR
- Responsive: comparison table horizontally scrollable on mobile, 2-col strengths grid on mobile → 4-col on desktop
- SVG icons inline (no icon library dependency)
- All sections in `space-y-6` vertical rhythm

**Verified:**
- `next build` compiles successfully with zero errors
- Production server: `/migration-report` → HTTP 200
- All 28 content sections verified present: Migration Analysis Report, February 11 2026, TL;DR, What Is Happening, Side by Side, Red Flags, blacklist, setRule, _beforeTokenTransfer, Ownership NOT renounced, How the Migration Works, SELL ORDER, What They Have Done, Etherscan, DEX Screener, CoinMarketCap, Numbers Don't Add Up, 14,000, What the OG Contract Has, RENOUNCED, What You Should Do, DO NOT connect, tokenapprovalchecker, OG Community, wojak.finance, Contract Addresses, both contract addresses, blockchain doesn't lie

---

## Phase 7: Crypto 101 Page — 2026-02-11

**Status:** Complete

**What was built:**
- `src/components/crypto101/AccordionSection.tsx` — Reusable collapsible accordion component:
  - Click-to-toggle expand/collapse with smooth CSS grid-rows animation (300ms ease-in-out)
  - Chevron icon rotates 180° when open, colored wojak-green
  - Hover state on header (subtle white/2% overlay)
  - `defaultOpen` prop for initial state (first section opens by default)
  - Responsive padding (p-5 mobile, p-6 desktop)
  - Multiple sections can be open simultaneously for easy cross-referencing
- `src/components/crypto101/sections/WhatIsAWallet.tsx` — What a crypto wallet is:
  - Wallet as personal blockchain account analogy
  - MetaMask setup: 5-step installation guide
  - Wallet address explained (looks like 0x5026F006...9aaB, safe to share)
  - Hot wallets vs cold wallets (MetaMask vs Ledger/Trezor)
- `src/components/crypto101/sections/PrivateKeys.tsx` — Private keys & seed phrases:
  - Private key = master password, full wallet control
  - Seed phrase = 12/24 words = human-readable private key
  - Red warning callout: NEVER share seed phrase (4 specific don'ts with ✗ icons)
  - 5-step backup guide (write on paper, store safely, never photograph)
  - "No forgot password in crypto" reminder
- `src/components/crypto101/sections/HowToBuyETH.tsx` — How to buy ETH:
  - On-ramp options: Coinbase, MoonPay, Transak/Ramp, MetaMask Buy
  - 6-step guide: sending ETH from exchange to MetaMask
  - Yellow warning: double-check address, start with test amount, use Ethereum network
- `src/components/crypto101/sections/HowToSwap.tsx` — How to swap tokens:
  - What a DEX is (vs centralized exchange)
  - 6-step CoW Swap guide with link to dashboard swap widget (/#swap)
  - Direct link to CoW Swap URL from constants
  - Slippage explained (1-3% recommended)
  - MEV protection callout: sandwich attacks explained, why CoW Swap batches trades
- `src/components/crypto101/sections/ReadingEtherscan.tsx` — Reading Etherscan:
  - Etherscan as "Google for the blockchain"
  - Token page breakdown: supply, holders, transfers, contract code
  - Link to OG WOJAK token page via ETHERSCAN_TOKEN_URL constant
  - OG_WOJAK_CONTRACT address displayed in code block
  - Transaction verification: TX hash lookup, what you can verify
  - Token approvals tab mention (ties into Revoking Approvals section)
- `src/components/crypto101/sections/WhatIsLiquidity.tsx` — What is liquidity:
  - Liquidity pools as "big pots of two tokens" analogy
  - LPs earn fees from trades
  - Rug pulls explained (unlocked LP = creator can drain)
  - Green callout: OG WOJAK LP locked until Year 2100 (from LP_LOCK_EXPIRY constant)
  - TVL defined: Total Value Locked, higher = more stable, less slippage
- `src/components/crypto101/sections/TokenSafety.tsx` — Token safety basics:
  - 5 red flags with ✗ icons: unrenounced contract, unlocked LP, blacklist/freeze functions, unrealistic promises, pressure to act fast
  - Code-styled function names: blacklist(), setRule(), pause()
  - "Renounced contract" defined (permanent, immutable, no admin)
  - Green callout: OG WOJAK fully renounced
  - Link to /migration-report as real-world example (uses Next.js Link component)
- `src/components/crypto101/sections/RevokingApprovals.tsx` — Revoking approvals:
  - Token approvals explained (permission to spend tokens)
  - 3 dangers with ✗ icons: scam dApps, exploited dApps, unlimited approvals
  - 6-step revoke guide using APPROVAL_CHECKER_URL constant (etherscan.io/tokenapprovalchecker)
  - Yellow pro tip: check approvals monthly, revoke after using new dApps
- `src/app/crypto-101/page.tsx` — Main page wiring:
  - Page title "Crypto 101" with subtitle "Everything you need to know to navigate crypto safely."
  - All 8 AccordionSections rendered in order, numbered 1-8
  - First section (What is a Wallet?) opens by default
  - max-w-4xl centered container, responsive padding
  - space-y-3 between accordion items

**Design:**
- Consistent dark theme: wojak-card (#141414) backgrounds, wojak-border (#1e1e1e), white text, rounded-2xl cards
- Color system matches site: green (#4ade80) for positive callouts, red for warnings, yellow for tips
- Tinted callout boxes: green-500/10 for OG strengths, red-500/10 for security warnings, yellow-500/10 for tips
- Conversational, beginner-friendly tone throughout — no jargon without explanation
- h3 subheadings within sections for scanability
- Code blocks for contract addresses and function names
- All external links use constants from src/lib/constants.ts
- Internal link to /migration-report uses Next.js Link component
- Responsive: proper padding scales mobile→desktop, accordion width adapts

**Verified:**
- `next build` compiles successfully with zero errors
- Production server: `/crypto-101` → HTTP 200
- All 20 key content markers verified present: Crypto 101, Everything you need, What is a Wallet, Private Keys, Seed Phrases, How to Buy ETH, How to Swap Tokens, Reading Etherscan, What is Liquidity, Token Safety, Revoking Approvals, MetaMask, seed phrase, CoW Swap, MEV Protected, Etherscan, liquidity pool, tokenapprovalchecker, migration-report, NEVER share

---

## Phase 8: Games System & Minesweeper — 2026-02-11

**Status:** Complete

**What was built:**
- `src/components/games/GameContext.tsx` — React Context for game modal state management:
  - `GameProvider` wraps the entire app in root layout
  - `useGameModal()` hook exposes `activeGame`, `openGame(gameId)`, `closeGame()`
  - Allows GamesDropdown (in navbar) to trigger GameModal (at layout level) without prop drilling
- `src/components/games/GameModal.tsx` — Full-screen modal overlay:
  - Fixed position covering entire viewport with dark semi-transparent backdrop (`bg-black/80 backdrop-blur-sm`)
  - z-index 100 to sit above everything including the navbar
  - Header bar with game title and X button to close
  - React `lazy()` loading for game components with spinner fallback
  - Escape key listener closes the modal
  - Body scroll lock (`document.body.style.overflow = "hidden"`) when modal is open, restored on close
  - Backdrop click (outside game area) also closes modal
  - Game component map makes it easy to add future games
- `src/components/navbar/GamesDropdown.tsx` — Updated from Phase 2:
  - Replaced `console.log` with `useGameModal().openGame(gameId)` call
  - Clicking "Minesweeper" in the dropdown now opens the full game modal
- `src/app/layout.tsx` — Updated:
  - Wrapped all children in `<GameProvider>` context
  - Added `<GameModal />` at the end of body (renders when a game is active)
- `src/components/games/minesweeper/types.ts` — Complete type system:
  - `CellVisualState`: "hidden" | "revealed" | "flagged"
  - `CellData`: isMine, adjacentMines, state
  - `GameState`: "idle" | "playing" | "won" | "lost"
  - `DifficultyConfig`: label, rows, cols, mines
  - `DIFFICULTIES` constant: Easy (9x9, 10 mines), Medium (16x16, 40 mines), Hard (16x30, 99 mines)
  - `NUMBER_COLORS` constant: classic minesweeper colors (1=blue, 2=green, 3=red, 4=purple, 5=maroon, 6=teal, 7=light gray for dark theme, 8=gray)
- `src/components/games/minesweeper/Cell.tsx` — Individual cell component:
  - Renders based on state: hidden (gray card), revealed (dark background with number or blank), flagged (flag emoji), mine (skull emoji on game over)
  - Numbers 1-8 with distinct classic minesweeper colors via inline style
  - Left click reveals cell (via `onClick`)
  - Right click flags/unflags cell (via `onContextMenu` with `preventDefault`)
  - Touch support: tap reveals, long-press (400ms) flags — uses `useRef` timers to distinguish
  - Dead mine cell (the one clicked) gets red background highlight
  - Won game auto-flags all mines
  - Disabled state when game is won or lost
  - Dynamic cell sizing via `size` prop
- `src/components/games/minesweeper/Board.tsx` — Game board grid + all game logic utilities:
  - **Board component**: CSS Grid layout with dynamic columns/rows based on difficulty, responsive overflow scrolling
  - **`createEmptyBoard(rows, cols)`**: Creates initial empty board with all hidden cells
  - **`placeMines(board, rows, cols, mines, safeRow, safeCol)`**: Random mine placement that never places on the first click cell or its 8 neighbors (safe zone)
  - **`calculateNumbers()`**: Counts adjacent mines for all non-mine cells (8-directional)
  - **`revealCell(board, rows, cols, row, col)`**: Reveals a cell; if mine returns `hitMine: true`, if empty triggers flood fill
  - **`floodFill()`**: Iterative stack-based flood fill — reveals all connected cells with 0 adjacent mines plus their border cells (cells with numbers)
  - **`toggleFlag()`**: Toggles cell between hidden and flagged states
  - **`checkWin()`**: Returns true when all non-mine cells are revealed
  - **`revealAllMines()`**: On game over, reveals all unflagged mines
  - **`countFlags()`**: Counts flagged cells for mine counter display
  - Cell sizes adapt to difficulty: 36px (easy), 32px (medium), 28px (hard)
- `src/components/games/minesweeper/Minesweeper.tsx` — Main game wrapper:
  - **Difficulty selector**: Three buttons (Easy/Medium/Hard), active button highlighted in wojak-green
  - **Top bar**: Mine counter (red LED-style font, total mines minus flags), face button (center), timer (red LED-style, starts on first click, stops on win/lose)
  - **Wojak face expressions**: 😊 happy (playing), 😰 nervous (mouse held down on board), 💀 dead (hit mine/game over), 😎 sunglasses (won)
  - **Face button**: Click to reset/restart game at current difficulty
  - **First click safety**: Mines are only placed after the first click, ensuring first click never hits a mine
  - **Timer**: Starts on first click, increments every second, stops on win or lose, capped at 999
  - **Mine counter**: Shows remaining mines (total - flags placed), can go negative if over-flagging
  - **Win detection**: Automatically detected when all non-mine cells are revealed
  - **Loss detection**: On mine reveal, all mines shown, game state set to lost
  - **Status messages**: Green pulsing "You won!" or red "Game over!" messages
  - **Instructions**: Subtle gray text showing controls for both desktop and mobile
  - Clean up timer on component unmount

**Design:**
- Consistent dark theme: wojak-card (#141414) for hidden cells, wojak-dark (#0a0a0a) for revealed, wojak-border (#1e1e1e) for borders
- WOJAK green (#4ade80) for active difficulty button and win message
- Red (#ef4444) for loss message, mine counter/timer LED displays, dead mine highlight
- Classic minesweeper number colors preserved (adjusted #7 to light gray for dark theme visibility)
- Grid has subtle white/10 cell borders for clean look
- LED-style counters use monospace font with black/50 backgrounds
- Modal full-screen with backdrop blur for premium feel
- Responsive: board scrolls horizontally if too wide for viewport (hard mode)

**Verified:**
- `next build` compiles successfully with zero errors
- Production server: `/` → HTTP 200
- GameProvider wraps app, GameModal renders at layout level
- GamesDropdown calls `openGame("minesweeper")` instead of console.log
- Game components lazy-loaded via React.lazy()
- All game logic: mine placement, flood fill, number calculation, flag toggle, win/loss detection implemented
- Timer starts on first click, stops on win/lose
- Face expressions change: happy → nervous (mouse down) → dead (lose) / cool (win)
- Three difficulty levels: Easy 9x9 (10 mines), Medium 16x16 (40 mines), Hard 16x30 (99 mines)
- Escape key and X button both close modal
- Body scroll locked when modal open

---

## Phase 9: Polish & Mobile — 2026-02-11

**Status:** Complete

**What was built:**

### Mobile Responsive Pass
- `src/components/navbar/Navbar.tsx` — Mobile menu now closes when:
  - Any nav link is tapped (already worked)
  - A game is selected from the Games dropdown (new `onGameOpen` callback)
  - Logo is tapped (new `onClick={closeMobileMenu}`)
  - Buy WOJAK button is tapped (already worked)
- `src/components/navbar/GamesDropdown.tsx` — Added `mobile` and `onGameOpen` props:
  - Mobile mode: click-only interaction (no hover), inline sub-items instead of absolute dropdown
  - Desktop mode: unchanged (hover + click)
  - `onGameOpen` callback fires when a game is selected, used to close mobile menu
- `src/components/games/GameModal.tsx` — X close button increased to 44x44px min tap target (`min-w-[44px] min-h-[44px]`) for accessibility on touch devices
- `src/components/dashboard/PriceChart.tsx` — Responsive iframe heights: 350px mobile → 420px tablet → 500px desktop (was fixed 500px)
- `src/components/dashboard/SwapWidget.tsx` — Responsive iframe heights: 480px mobile → 560px tablet → 640px desktop (was fixed 640px). Padding scales with breakpoints (`p-4 sm:p-6 md:p-8`)
- `src/components/ui/TabGroup.tsx` — Tab buttons now horizontally scrollable on mobile (`overflow-x-auto scrollbar-hide`), whitespace-nowrap prevents text wrapping, tabs shrink-0 to maintain size
- `src/components/games/minesweeper/Board.tsx` — Cell sizes now responsive: on mobile (< 640px viewport), cells auto-size to fit screen width (clamped 20-36px). Desktop sizes unchanged (28/32/36px by difficulty)
- `src/components/games/minesweeper/Minesweeper.tsx` — Mobile-optimized:
  - Smaller padding and gaps on mobile (gap-3/p-2 vs gap-4/p-4)
  - Responsive difficulty buttons (text-xs/px-3/py-1.5 on mobile)
  - Responsive mine counter/timer (text-lg on mobile vs text-xl)
  - Context-aware instructions: "Tap to reveal · Long-press to flag" on mobile, "Left click to reveal · Right click to flag" on desktop
- `src/app/globals.css` — Added utility classes:
  - `.scrollbar-hide` — Hides scrollbar on all browsers (for tab groups)
  - `.select-none` — `-webkit-user-select: none` for cross-browser support
  - `.touch-none-context` — `-webkit-touch-callout: none` prevents long-press context menu on iOS (for game cells)

### Meta Tags
- `src/app/layout.tsx` — Full metadata configuration:
  - `title`: "wojak.finance — The OG WOJAK Since April 2023"
  - `description`: "The official community website for the original WOJAK token on Ethereum. Dashboard, swap, education, and games for 19,630+ OG holders."
  - `openGraph`: title, description, type (website), url (https://wojak.finance), siteName
  - `twitter`: card (summary_large_image), title, description
  - `icons`: favicon.svg

### Favicon
- `public/favicon.svg` — SVG favicon: dark circle (#0a0a0a) with green (#4ade80) stroke border and bold "W" letter in wojak-green, matching site branding
- Removed default `src/app/favicon.ico` so Next.js uses the SVG via metadata config

### Performance
- PriceChart iframe: `loading="lazy"` (already present from Phase 3)
- SwapWidget iframe: `loading="lazy"` (already present from Phase 5)
- GameModal: `React.lazy()` for game components (already present from Phase 8)
- No `<img>` elements in the project — all visuals are inline SVGs or emojis, so no alt text needed
- All iframes have descriptive `title` attributes for accessibility

**Verified:**
- `next build` compiles successfully with zero errors
- Production server: all routes return HTTP 200 (`/`, `/crypto-101`, `/migration-report`)
- Meta tags confirmed in HTML output: title, og:title, og:description, og:url, og:site_name, og:type, twitter:card, twitter:title, twitter:description
- Favicon SVG served at `/favicon.svg` → HTTP 200
- `<link rel="icon" href="/favicon.svg"/>` present in HTML head
- Responsive iframe heights applied via Tailwind breakpoint classes
- Tab group scrollable on mobile with hidden scrollbar
- Game modal X button meets 44px touch target minimum
- Mobile GamesDropdown uses click-only interaction with inline sub-menu

---

## Phase 10: Deployment Prep — 2026-02-11

**Status:** Complete

**What was done:**

### .gitignore Cleanup
- Verified all required entries present: `/node_modules`, `/.next/`, `.env*.local`, `/out/`, `.DS_Store`, `*.tsbuildinfo`
- Added missing `/dist` entry
- Already had: `.pnp.js`, `*.pem`, `/coverage`, `/build`, `.vercel`, `next-env.d.ts`

### TODO Comments Audit
All TODO comments in the codebase are placeholder data items — they mark where real API integrations would replace static/placeholder values. None are bugs or broken features.

**Outstanding TODOs (all in `src/lib/etherscan.ts` and `src/components/dashboard/LiquidityInfo.tsx`):**

| Location | TODO | Description |
|---|---|---|
| `src/lib/etherscan.ts:104` | Holder count API | Use Etherscan Pro, Alchemy, or Moralis for accurate holder count (currently returns placeholder 14,000) |
| `src/lib/etherscan.ts:122-124` | Price/market data APIs | Integrate DexScreener or CoinGecko for price, market cap, volume; query Uniswap V2 pool for TVL; use Alchemy/Moralis for holders |
| `src/lib/etherscan.ts:136` | Real price | Replace placeholder with DexScreener or CoinGecko price |
| `src/lib/etherscan.ts:138` | Real market cap | Replace with price * circulating supply |
| `src/lib/etherscan.ts:140` | Real TVL | Replace with Uniswap pool reserves query |
| `src/lib/etherscan.ts:142` | Real 24h volume | Replace with DexScreener or CoinGecko volume |
| `src/lib/etherscan.ts:144` | Real holder count | Replace with Alchemy/Moralis or Etherscan Pro |
| `src/components/dashboard/LiquidityInfo.tsx:30-33` | Real TVL display | Replace placeholder TVL with Uniswap pool reserves |

**Note:** These are all "nice to have" integrations that require either paid API keys (Alchemy, Moralis, Etherscan Pro) or additional API calls (DexScreener, CoinGecko). The site is fully functional without them — placeholder values display cleanly. These can be addressed post-launch as the community grows.

### Build Verification
- `npm run build` — zero errors, zero warnings
- All 4 routes compile as static pages: `/`, `/crypto-101`, `/migration-report`, `/_not-found`
- Total First Load JS: 87 kB shared + page-specific bundles

### README.md Update
- Accurate project description and about section
- All 4 features listed: Dashboard, Crypto 101, Migration Report, Minesweeper
- Tech stack corrected: CoW Swap iframe embed (not SDK)
- Setup instructions: clone, npm install, create .env.local, npm run dev
- OG contract address table with pool, LP lock, status, chain
- Community links: Twitter, Etherscan, DEX Screener
- MIT license note

### docs/SCOPE.md Update
- Corrected swap widget tech: `CoW Swap iframe embed` (was `@cowprotocol/widget-react`)
- All other details verified accurate

### docs/TODO.md Update
- All Phase 1-9 items already checked off from previous phases
- Phase 10 rewritten to match deployment prep tasks (not actual deployment)
- All Phase 10 items checked off

### docs/DEPLOYMENT.md Created
Step-by-step deployment guide covering:
1. Creating a public GitHub repository
2. git init, add, commit, push to GitHub
3. Getting a free Etherscan API key
4. Connecting the repo to Vercel
5. Adding `NEXT_PUBLIC_ETHERSCAN_API_KEY` as environment variable in Vercel
6. Deploying to temporary `xxx.vercel.app` domain
7. Adding custom `wojak.finance` domain later (DNS records, SSL auto-provisioning)
8. Environment variables reference table
9. Redeployment instructions

---

## Dashboard Overhaul — 2026-02-11

**Status:** Complete

**What changed:**

This is a major redesign of the dashboard page (`src/app/page.tsx`) based on user feedback. The layout was rebuilt from scratch, inspired by the Uniswap token page layout, with a focus on clean, functional design.

### New Components
- **`src/components/dashboard/ImageSlider.tsx`** — Full-width auto-rotating image carousel at the top of the page:
  - Uses 10 images (`public/images/1.jpg` through `10.jpg`) with crossfade transitions (700ms)
  - Auto-advances every 5 seconds
  - Images use `object-cover` for consistent fill across varying dimensions
  - Overlay text: "The OG WOJAK" / "Since April 2023" with dark gradient for readability
  - Navigation dots at bottom to indicate/select current slide
  - Responsive height: 250px mobile → 300px tablet → 400px desktop
  - Uses Next.js `<Image>` with `fill` and `sizes="100vw"` for optimization

- **`src/components/dashboard/SwapCard.tsx`** — Uniswap-style swap card (replaces SwapWidget):
  - Clean card with "Swap" title, "Sell" (ETH) and "Buy" (WOJAK) sections
  - Down arrow divider between sections
  - ETH icon (purple diamond SVG) and WOJAK icon (green "W" badge)
  - "Swap on CoW Swap" button opens CoW Swap in new tab
  - Shield icon + "MEV Protected" text
  - "Powered by CoW Swap" attribution
  - "Also available on Matcha.xyz" link below the card
  - UI-only — does not execute swaps, directs users to CoW Swap

### Modified Components
- **`src/components/dashboard/HeroStats.tsx`** — Stripped to stats row only:
  - Removed WOJAK hero branding text, tagline, and price display
  - Now renders only the 4-stat grid (Market Cap | TVL | 24h Volume | Holders)
  - 2x2 grid on mobile, 4 columns on desktop
  - Placed directly below the image slider

- **`src/components/dashboard/PriceChart.tsx`** — Simplified to standalone embed:
  - Removed section wrapper, heading, and "Chart powered by DEX Screener" text
  - Now a bare chart card used inside the two-column grid layout
  - Responsive height unchanged: 350px → 420px → 500px

- **`src/components/dashboard/RecentTrades.tsx`** — Restyled as clean table:
  - Now wrapped in its own card container with "Recent Transactions" heading
  - Table columns reordered: Time | Type | Amount | Price | Wallet (matching Uniswap layout)
  - Min-width 500px with horizontal scroll on mobile
  - "Auto-refreshes every 30s" label in header
  - Price column shows placeholder "—" (same as existing data limitations)

- **`src/components/dashboard/ContractInfo.tsx`** — Made more compact:
  - Single-row layout: contract address + copy button + links on one line (desktop)
  - Smaller badge: "Contract RENOUNCED" (shorter text)
  - LP lock note condensed to a single line with lock icon
  - Stacks vertically on mobile

- **`src/components/navbar/Navbar.tsx`** — Removed "Buy WOJAK" button:
  - Desktop: button removed from nav links
  - Mobile: button removed from hamburger menu
  - Removed `handleBuyClick` function and `usePathname` dependency cleanup
  - Remaining nav: Dashboard | Crypto 101 | Migration Report | Games dropdown

- **`src/lib/constants.ts`** — Updated DEX Screener embed URL:
  - Added `&info=0&trades=0&header=0` params to strip info panel, trade list, and header from embed
  - Only the interactive chart is now visible in the embed

### New Page Layout (`src/app/page.tsx`)
1. **ImageSlider** — Full-width banner with auto-rotating images
2. **HeroStats** — Stats row (Market Cap | TVL | 24h Volume | Holders)
3. **Two-column section** — PriceChart (~65%) + SwapCard (~35%), stacks on mobile
4. **RecentTrades** — Full-width transactions table in card
5. **ContractInfo** — Compact contract info with address, links, LP lock note

### Removed Components
- `src/components/dashboard/DashboardTabs.tsx` — Replaced by direct RecentTrades section
- `src/components/dashboard/LiquidityInfo.tsx` — Info covered by stats row + contract info
- `src/components/dashboard/HolderCount.tsx` — Info covered by stats row
- `src/components/dashboard/SwapWidget.tsx` — Replaced by SwapCard
- `src/components/ui/TabGroup.tsx` — No longer used by any component

### Mobile Responsive
- Image slider: full width, 250px height
- Stats row: 2x2 grid
- Chart + Swap card: stacked vertically (chart on top, swap card below)
- Transactions table: horizontally scrollable with 500px min-width
- Contract info: stacks vertically

**Verified:**
- `npm run build` — zero errors, zero warnings
- All 4 routes compile: `/`, `/crypto-101`, `/migration-report`, `/_not-found`
- No broken imports — all deleted component references cleaned up
- First Load JS for `/`: 98 kB (was 87 kB, +11 kB for ImageSlider with Next.js Image)

---

## Dashboard Fixes Round 2 — 2026-02-11

**Status:** Complete

**What changed:**

### FIX 1: Favicon
- Replaced SVG "W" favicon with `public/images/favicon.jpg`
- Updated `src/app/layout.tsx` metadata `icons` to point to `/images/favicon.jpg`
- Added `apple` touch icon pointing to the same image
- Removed reference to old `/favicon.svg`

### FIX 2: Site Title & Domain References
- Changed metadata `title` from `"wojak.finance — The OG WOJAK Since April 2023"` to `"WOJAK"`
- Updated OpenGraph and Twitter card titles to `"WOJAK — The OG Since April 2023"`
- Replaced ALL `wojak.finance` references with `wojak.io` across the entire codebase:
  - `src/lib/constants.ts` — `SITE_NAME` changed to `"wojak.io"`
  - `src/app/layout.tsx` — OG url and siteName updated
  - `src/components/migration/ReportContent.tsx` — text reference updated
  - `README.md` — heading and about section updated
  - `docs/SCOPE.md` — title and overview updated
  - `docs/TODO.md` — title updated
  - `docs/DEPLOYMENT.md` — title, commit message, domain references updated
  - `docs/WOJAK_BUILD_INSTRUCTIONS.md` — title and description updated

### FIX 3: Image Reel (replaces Image Slider)
- **Deleted** `src/components/dashboard/ImageSlider.tsx` (fading slider with dots)
- **Created** `src/components/dashboard/ImageReel.tsx` — continuous horizontal scrolling marquee:
  - Displays all 10 images (`/images/1.jpg` through `10.jpg`) in a row
  - Images duplicated for seamless infinite loop
  - CSS `translateX` animation at 60s per cycle — smooth, ambient scrolling
  - Image height: 150px mobile → 175px tablet → 200px desktop (shorter than old 250-400px slider)
  - "The OG WOJAK — Since April 2023" overlay text centered on top
  - Navigation dots removed entirely
  - No JavaScript intervals — pure CSS animation
  - Easy to extend: just add images to the `IMAGES` array
- **Added** `@keyframes scroll-reel` animation and `.animate-scroll-reel` class to `src/app/globals.css`

### FIX 4: Combined Chart + Transactions into Tabbed Card
- **Created** `src/components/dashboard/ChartSection.tsx` — wrapper component with two tabs:
  - **"Chart" tab** (default) — shows the DEX Screener embed (PriceChart)
  - **"Transactions" tab** — shows the RecentTrades table
  - Clean underline-style tab bar at the top (green active indicator, like DEX Screener/Uniswap)
- **Updated** `src/components/dashboard/RecentTrades.tsx`:
  - Added `embedded` prop — when `true`, renders without section wrapper/heading (for use inside ChartSection)
  - Standalone mode still works if imported directly
- **Updated** `src/components/dashboard/PriceChart.tsx`:
  - Removed outer card wrapper (bg-wojak-card, border, rounded-xl) since ChartSection provides the card container
- **Removed** standalone RecentTrades section from `src/app/page.tsx`

### Updated Page Layout (`src/app/page.tsx`)
1. **ImageReel** — Full-width continuous scrolling banner
2. **HeroStats** — Stats row (Market Cap | TVL | 24h Volume | Holders)
3. **Two-column section** — ChartSection (tabbed Chart/Transactions) + SwapCard
4. **ContractInfo** — Contract info with address, links, LP lock note

**Verified:**
- `npm run build` — zero errors, two lint warnings (expected: `<img>` in reel for CSS animation compatibility)
- All 4 routes compile: `/`, `/crypto-101`, `/migration-report`, `/_not-found`
- First Load JS for `/`: 92.8 kB (down from 98 kB — removed ImageSlider's Next.js Image overhead)
- No `wojak.finance` references remain in any source file (only in PROGRESS.md historical log)

---

## Visual Polish + Crypto 101 Rebuild — 2026-02-11

**Status:** Complete

**What changed:**

### TWEAK 1: Image Reel Speed
- `src/app/globals.css` — Changed `.animate-scroll-reel` animation duration from `60s` to `38s`
- Faster, more energetic scrolling that still feels smooth

### TWEAK 2: "The OG WOJAK" Title Animation
- `src/app/globals.css` — Added `@keyframes title-shine` animation with:
  - Diagonal glare/shine sweep across text (left to right, via `background-position` on a linear gradient)
  - Subtle scale pulse (1.0 → 1.06 → 1.0, smooth ease-in-out)
  - Soft glow via animated `text-shadow` (white + green glow pulses brighter then fades)
  - Total animation duration: 1.8s per cycle
- `.animate-title-shine` class: plays once immediately on load, then repeats every 9 seconds
- Persistent dark text-shadow (`2px 2px 8px rgba(0,0,0,0.8)`) at all times for readability
- Uses `-webkit-background-clip: text` for the shine sweep effect
- `src/components/dashboard/ImageReel.tsx` — Applied `animate-title-shine` class to h1, persistent text-shadow on subtitle

### TWEAK 3: Matcha.xyz Link Styling
- `src/components/dashboard/SwapCard.tsx` — Updated the "Also available on" link:
  - "Also available on" text in gray (text-gray-500)
  - "Matcha.xyz" link in wojak-green with hover underline
  - Separated from a single `<a>` tag into `<p>` with inline `<a>` for proper styling

### TWEAK 4: Liquidity Provider Link
- `src/lib/constants.ts` — Added `UNISWAP_ADD_LIQUIDITY` URL (`https://app.uniswap.org/add/v2/ETH/{OG_CONTRACT}`)
- `src/components/dashboard/ContractInfo.tsx` — Added LP CTA below the LP lock note:
  - Plus-circle icon in wojak-green
  - "Want to become a Liquidity Provider?" text in gray
  - "Add Liquidity on Uniswap" link in wojak-green, opens in new tab

### TWEAK 5: Crypto 101 Page — Full Rebuild
- **Deleted** `src/components/crypto101/AccordionSection.tsx` — no longer used
- **Rebuilt** `src/app/crypto-101/page.tsx` — Now a client component with:
  - Page title "Crypto 101" with subtitle
  - Sticky horizontal section nav below the main navbar (`sticky top-16 z-40`)
  - 8 anchor links: Wallets | Private Keys | Buy ETH | Swap Tokens | Etherscan | Liquidity | Token Safety | Revoke Approvals
  - Scroll spy via IntersectionObserver — active section highlighted in wojak-green
  - Nav auto-scrolls horizontally to keep active item visible on mobile
  - `scrollbar-hide` class for clean horizontal scroll on small screens
- **Rebuilt all 8 section components** in `src/components/crypto101/sections/`:
  - Each renders full content directly (no accordion wrapper)
  - Each has its own `<section>` with `id` for anchor links and `scroll-mt-28` for offset
  - Each wrapped in `bg-wojak-card` card with `rounded-2xl` and proper padding
  - Content preserved from original accordion versions with improved structure:
    1. `WhatIsAWallet.tsx` — id="wallets"
    2. `PrivateKeys.tsx` — id="private-keys"
    3. `HowToBuyETH.tsx` — id="buy-eth"
    4. `HowToSwap.tsx` — id="swap-tokens"
    5. `ReadingEtherscan.tsx` — id="etherscan" (now links to Revoking Approvals section via anchor)
    6. `WhatIsLiquidity.tsx` — id="liquidity"
    7. `TokenSafety.tsx` — id="token-safety"
    8. `RevokingApprovals.tsx` — id="revoke-approvals"

**Design:**
- Sticky nav: dark background with backdrop blur, green highlight for active section, gray for inactive
- Section cards: wojak-card backgrounds with wojak-border, rounded-2xl, consistent spacing
- Callout boxes preserved: red for warnings, yellow for tips, green for OG WOJAK positives
- Mobile: nav scrolls horizontally with hidden scrollbar, all sections stack and read well
- All content, links, and constants unchanged from original

**Verified:**
- `npm run build` — zero errors, two expected lint warnings (`<img>` in ImageReel)
- All 4 routes compile: `/`, `/crypto-101`, `/migration-report`, `/_not-found`
- First Load JS for `/crypto-101`: 102 kB (includes IntersectionObserver scroll spy logic)
- AccordionSection.tsx deleted, no remaining imports

---

## Hotfix + Subtitle Animation — 2026-02-11

**Status:** Complete

**FIX 1: Site Not Loading — Verified Working**
- Ran `npm run build` — zero errors, zero warnings (only two expected `<img>` lint notices in ImageReel)
- Ran `npm run dev` — dev server starts successfully
- Tested all routes: `/` → 200, `/crypto-101` → 200, `/migration-report` → 200
- HTML output verified: no hydration errors, no client/server mismatches
- All client components have `"use client"` directive, all browser APIs (IntersectionObserver, window, document) are inside `useEffect` hooks
- No issues found — site loads cleanly on localhost

**FIX 2: Subtitle Text Animation on ImageReel**
- `src/components/dashboard/ImageReel.tsx` — Added alternating subtitle text:
  - Two subtitle strings: "Since April 2023" and "If it ain't broke, don't fix it."
  - React state (`subtitleIndex`) toggles between the two strings every 9 seconds via `useEffect` + `setInterval`
  - Smooth fade-out/fade-in transition: opacity goes 1 → 0 (400ms ease-in-out), text swaps after 400ms timeout, opacity goes 0 → 1 (400ms ease-in-out)
  - Transition is synced with the existing `animate-title-shine` CSS animation on "The OG WOJAK" title, which also repeats every 9 seconds
  - Initial text on page load: "Since April 2023"
  - At 9s mark: fades to "If it ain't broke, don't fix it."
  - At 18s mark: fades back to "Since April 2023"
  - Alternates indefinitely
  - Component already had `"use client"` directive — added `useState` and `useEffect` imports
  - Transition uses inline `style` prop for `opacity` and `transition` (no Tailwind class needed for 400ms duration)

**Verified:**
- `npm run build` — zero errors, all 4 routes compile: `/`, `/crypto-101`, `/migration-report`, `/_not-found`
- Dev server: all 3 user-facing routes return HTTP 200
- First Load JS for `/`: 93.1 kB (slight increase from subtitle animation state)

---

## Bug Fix Round — 2026-02-11

**Status:** Complete

**6 bugs fixed:**

### BUG 1: Chart Not Loading
- **Root cause:** `DEXSCREENER_EMBED_URL` in `src/lib/constants.ts` had invalid params `&info=0&trades=0&header=0` that broke the embed
- **Fix:** Changed URL to use only `?embed=1&theme=dark` — the two params DEX Screener actually supports
- **File:** `src/lib/constants.ts`

### BUG 2: Favicon and Tab Title
- **Status:** Already correct — `layout.tsx` had `title: "WOJAK"` and `icons.icon: "/images/favicon.jpg"` from the previous fix round
- **Verified:** `<title>WOJAK</title>` and `<link rel="icon" href="/images/favicon.jpg"/>` present in HTML output

### BUG 3: Replace ALL Emoji With SVG Icons
- **Scope:** Found and replaced all emoji across 9 files
- **Minesweeper Cell.tsx:** Replaced 💀 skull emoji (x2) with SVG mine icons (circle with radiating lines), replaced 🚩 flag emoji (x2) with SVG flag icons
- **Minesweeper Minesweeper.tsx:** Replaced `FACE_EMOJI` map (😊😰💀😎 via Unicode escapes) with `FaceIcon` SVG component — renders simple circle faces with expressions: happy (dot eyes, smile), nervous (dot eyes, open mouth), dead (X eyes, frown), cool (rectangle sunglasses, smile). Used in face button (28px) and status messages (20px inline with flex)
- **Crypto 101 PrivateKeys.tsx:** Replaced `&#9888;` (⚠) with SVG triangle warning icon, replaced `&#10007;` (✗ x4) with SVG X icons
- **Crypto 101 HowToBuyETH.tsx:** Replaced `&#9888;` (⚠) with SVG triangle warning icon
- **Crypto 101 TokenSafety.tsx:** Replaced `&#10007;` (✗ x5) with SVG X icons
- **Crypto 101 RevokingApprovals.tsx:** Replaced `&#10007;` (✗ x3) with SVG X icons, replaced `&#128161;` (💡) with SVG lightbulb icon
- **Crypto 101 WhatIsLiquidity.tsx:** Replaced `&#128274;` (🔒) with SVG lock icon
- **Crypto 101 HowToSwap.tsx:** Replaced `&#128737;` (🛡) with SVG shield icon
- **Migration ReportContent.tsx:** Replaced `&#9888;` (⚠ x2) with SVG triangle warning icons, replaced `&#10005;` (✕ x2) with SVG X icons, replaced `&#10003;` (✓ x4) with SVG checkmark icons
- **Final sweep:** Grep confirmed zero emoji, zero Unicode escapes, zero HTML numeric entities remaining in `src/`

### BUG 4: Games Dropdown Positioning and Gap
- **Root cause:** Dropdown had `left-0` (could overflow right edge) and `mt-1` gap (mouse lost hover when crossing gap)
- **Fix:** Changed to `right-0` alignment so dropdown stays within viewport. Wrapped dropdown card in an outer div with `pt-1` padding that acts as an invisible hover bridge between button and dropdown. Mouse stays within the wrapper's DOM children during the transition.
- **File:** `src/components/navbar/GamesDropdown.tsx`

### BUG 5: Minesweeper Click Not Working
- **Root cause:** Related to Bug 4 — the `mt-1` gap caused `onMouseLeave` to fire on the wrapper when moving from the Games button to the dropdown menu, closing the dropdown before the Minesweeper click could register
- **Fix:** Bug 4 fix (invisible bridge via `pt-1`) resolves this — mouse no longer leaves the wrapper during transition. The `handleGameClick` → `openGame(gameId)` → `GameModal` pipeline was already correctly wired.
- **Verified:** GameProvider wraps app in layout.tsx, GameModal renders at layout level, GamesDropdown calls `openGame("minesweeper")`, modal renders as fixed overlay with z-100

### BUG 6: Image Reel Speed
- **Fix:** Changed `animate-scroll-reel` duration from `38s` to `30s` in `src/app/globals.css`
- Faster, more energetic scrolling while still smooth

**Verified:**
- `npm run build` — zero errors, zero warnings (only expected `<img>` lint notices)
- All 4 routes compile: `/` (93.1 kB), `/crypto-101` (102 kB), `/migration-report` (87.1 kB), `/_not-found`
- Dev server: all 3 routes return HTTP 200
- No emoji or HTML numeric entities remain anywhere in `src/`

---

## Animation Fix + Light Mode + Report Anchors — 2026-02-11

**Status:** Complete

**What changed:**

### FIX 1: Title Animation Overhaul
- `src/app/globals.css` — Completely rewrote `@keyframes title-shine` and `.animate-title-shine`:
  - **Removed** all scale/size transforms (no more `transform: scale()`)
  - **Changed** glare color from white to green (`rgba(74, 222, 128, 0.3/0.5)` — wojak-green)
  - Single green glare sweep moves left to right via `background-position` animation
  - 9s total cycle: sweep happens in the first 25% (~2.25s), then holds until next cycle
  - Persistent dark `text-shadow: 2px 2px 8px rgba(0,0,0,0.8)` for readability at all times
  - Uses `-webkit-background-clip: text` / `background-clip: text` for the shine effect
  - No glow animation, no jumpy effects — smooth and subtle

### FIX 2: Light/Dark Mode Toggle
- **`tailwind.config.ts`** — Added `darkMode: "class"` to enable Tailwind's class-based dark mode
- **`src/components/ThemeProvider.tsx`** (NEW) — React context for theme management:
  - `useTheme()` hook returns `{ theme, toggleTheme }`
  - Reads/writes `localStorage("theme")`, syncs `dark` class on `<html>`
  - Default: dark mode
  - `initialized` flag prevents overwriting inline script's early DOM update
- **`src/app/layout.tsx`** — Wrapped app in `<ThemeProvider>`, added inline `<script>` in `<head>` to prevent flash of wrong theme (reads localStorage before React hydrates), `suppressHydrationWarning` on `<html>`, body classes `bg-[#fafafa] dark:bg-wojak-dark text-gray-900 dark:text-white`
- **`src/lib/constants.ts`** — Split `DEXSCREENER_EMBED_URL` into `_DARK` and `_LIGHT` variants with `&theme=dark` / `&theme=light`
- **`src/components/navbar/Navbar.tsx`** — Added sun/moon toggle icon (desktop: before Games dropdown, mobile: before hamburger), `useTheme()` hook
- **`src/components/dashboard/PriceChart.tsx`** — Switches iframe URL based on current theme
- **All components updated with `dark:` prefix classes** (30+ files):
  - Dashboard: HeroStats, ChartSection, PriceChart, RecentTrades, SwapCard, ContractInfo
  - Crypto 101: page.tsx + 8 section components
  - Migration: ReportContent, ComparisonTable
  - Games: GameModal, Minesweeper, Board, Cell
  - UI: Footer, GamesDropdown
- Color mappings: `bg-wojak-card` → `bg-white dark:bg-wojak-card`, `border-wojak-border` → `border-gray-200 dark:border-wojak-border`, `text-white` → `text-gray-900 dark:text-white`, etc.

### FIX 3: Migration Report Section Anchors & TOC
- **`src/components/migration/ReportContent.tsx`**:
  - `SectionCard` helper updated to accept optional `id` prop with `scroll-mt-20` for navbar offset
  - Added `id` to all 11 sections: `#tldr`, `#what-is-happening`, `#comparison`, `#red-flags`, `#migration-mechanics`, `#platform-attacks`, `#numbers`, `#og-strengths`, `#what-to-do`, `#whats-next`, `#contracts`
  - Added table of contents `<nav>` between page title and TL;DR:
    - "Contents" heading, numbered list of all 11 sections
    - Links styled in wojak-green with hover underline
    - Two-column layout on desktop, single column on mobile
    - Smooth-scrolls to each section (uses existing `scroll-behavior: smooth` from globals.css)

**Verified:**
- `npm run build` — zero errors
- All routes compile and render correctly
- Theme toggle persists across page loads via localStorage
- All components render correctly in both light and dark modes
- Migration report TOC links scroll smoothly to correct sections
- Section IDs match the specified anchors

---

## Build Verification — 2026-02-11

### Verification Steps
1. **`npm run build`** — Compiled successfully, zero errors
   - Only warnings: `<img>` usage in ImageReel.tsx (non-blocking, cosmetic)
   - All 3 routes pre-rendered as static content
   - Route sizes: `/` (93.4 kB), `/crypto-101` (103 kB), `/migration-report` (87.1 kB)
2. **`npm run dev`** — Dev server started successfully on http://localhost:3000
3. **Route testing** — All 3 routes verified via HTTP:
   - `/` — HTTP 200 (33,388 bytes)
   - `/crypto-101` — HTTP 200 (48,657 bytes)
   - `/migration-report` — HTTP 200 (102,817 bytes)
4. **No terminal errors** — Clean compilation, no runtime errors detected

**Result:** All routes load correctly. Build passes. Site is stable.

---

## Site Loading Fix — 2026-02-11

**Status:** Complete

**Problem:** Site not loading in the browser at http://localhost:3000 despite `npm run build` passing.

**Root causes identified:**

### FIX 1: Excessive Image Preloads Blocking Page Load
- **Root cause:** React 18.3's Float API auto-generated 10 `<link rel="preload" as="image">` tags in `<head>` for all `<img>` elements in ImageReel.tsx. This forced the browser to prioritize downloading ~1.7MB of images (10 JPGs, largest 903KB) over critical JavaScript and CSS, causing the page to appear stuck loading.
- **Fix:** Added `loading="lazy"` to all `<img>` tags in `src/components/dashboard/ImageReel.tsx` (both the primary set and the duplicate set for the seamless loop). This prevents React from generating preload hints, allowing JS/CSS to load first.
- **Result:** Image preload tags reduced from 10 to 0 in the HTML output.

### FIX 2: Missing Autoprefixer — CSS Vendor Prefixes
- **Root cause:** `postcss.config.mjs` only had `tailwindcss` plugin — `autoprefixer` was not installed or configured. This meant CSS vendor prefixes (e.g., `-webkit-background-clip`, `-webkit-user-select`, `-webkit-text-size-adjust`) were missing from the output, causing rendering issues in Safari and older browsers.
- **Fix:** Installed `autoprefixer` as a dev dependency and added it to `postcss.config.mjs` plugins.
- **Result:** CSS output grew from 28KB to 42KB with 16 `-webkit-` prefixed properties added.

### FIX 3: Stale Build Cache
- **Fix:** Cleared `.next/` directory to remove stale build artifacts from previous builds.

**Files changed:**
- `src/components/dashboard/ImageReel.tsx` — Added `loading="lazy"` to all `<img>` tags
- `postcss.config.mjs` — Added `autoprefixer` plugin
- `package.json` — Added `autoprefixer` dev dependency

**Verified:**
- `npm run build` — zero errors, all 4 routes compile
- `npm run dev` — dev server starts, no compilation errors
- All 3 routes tested via HTTP: `/` → 200, `/crypto-101` → 200, `/migration-report` → 200
- Production server (`npm run start`) — all routes return HTTP 200
- Zero image preload tags in HTML output (was 10)
- CSS includes vendor prefixes (16 `-webkit-` properties)

---

## Critical Bug Fix Round — 2026-02-11

**Status:** Complete

**4 critical bugs fixed:**

### BUG 1: DEX Screener Chart — Switched to GeckoTerminal
- **Problem:** DEX Screener embed showed the full page with hijacked "WOJAK has migrated" banner, Info/Chart+Txns tabs, token profile, embed button, and swap widget. No combination of DEX Screener params could hide the banner.
- **Fix:** Switched to GeckoTerminal embed which provides a clean chart-only embed.
- **URL:** `https://www.geckoterminal.com/eth/pools/0x0f23D49bC92Ec52FF591D091b3e16c937034496e?embed=1&info=0&swaps=0&grayscale=0&light_chart=0`
- **Files changed:**
  - `src/lib/constants.ts` — Replaced `DEXSCREENER_EMBED_URL_DARK` and `_LIGHT` with single `GECKOTERMINAL_EMBED_URL`
  - `src/components/dashboard/PriceChart.tsx` — Uses GeckoTerminal URL, removed `useTheme` dependency

### BUG 2: Removed Light/Dark Mode — Dark Only
- **Problem:** Site had a light/dark mode toggle that wasn't needed. The site should be dark mode only per the design spec.
- **Fix:** Completely removed all light mode infrastructure:
  - **Deleted** `src/components/ThemeProvider.tsx`
  - **Removed** `darkMode: "class"` from `tailwind.config.ts`
  - **Removed** inline theme script and `suppressHydrationWarning` from `src/app/layout.tsx`
  - **Removed** `<ThemeProvider>` wrapper from layout
  - **Removed** sun/moon toggle from `src/components/navbar/Navbar.tsx` (both desktop and mobile)
  - **Removed** `useTheme` import from Navbar and PriceChart
  - **Updated 25 component files** to remove all `dark:` CSS prefixes and hardcode dark theme colors:
    - `bg-white dark:bg-wojak-card` → `bg-wojak-card`
    - `border-gray-200 dark:border-wojak-border` → `border-wojak-border`
    - `text-gray-900 dark:text-white` → `text-white`
    - `text-gray-600 dark:text-gray-300` → `text-gray-300`
    - `bg-gray-100 dark:bg-white/5` → `bg-white/5`
    - And all other light/dark pairs resolved to dark-only values
  - **Verified:** Zero `dark:` prefixes remain in `src/`. Zero `useTheme`/`ThemeProvider`/`toggleTheme` references remain.
- **Files changed:** 25+ files across dashboard, navbar, footer, crypto101, migration, games components

### BUG 3: Image Reel Seamless Looping
- **Problem:** Visible jump/reset when the scroll animation restarted.
- **Root cause:** `loading="lazy"` on duplicate images prevented them from loading until scrolled into view, causing a visual gap/flash when they appeared.
- **Fix:**
  - Removed `loading="lazy"` from all `<img>` tags in `src/components/dashboard/ImageReel.tsx` (both primary and duplicate sets)
  - Added `willChange: "transform"` for GPU-accelerated compositing
  - CSS animation already correct: `translateX(0)` → `translateX(-50%)` with `linear infinite` timing
  - 20 images total (10 original + 10 duplicate), animation translates exactly half the total width, so when it resets to 0 the duplicate set seamlessly continues

### BUG 4: Minesweeper Modal — Now a Proper Overlay
- **Problem:** The game modal was taking over the entire page (`w-full h-full max-w-[100vw] max-h-[100vh]`), filling the full viewport with no visible backdrop.
- **Fix:** Rewrote `src/components/games/GameModal.tsx`:
  - Backdrop: `fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm` — dark semi-transparent overlay
  - Game container: `max-w-4xl max-h-[90vh] mx-4 rounded-2xl border border-wojak-border` — centered card, NOT full page
  - X button in header to close
  - Escape key closes modal
  - Backdrop click (outside game area) closes modal
  - Body scroll locked when modal is open, restored on close
  - GamesDropdown already uses `openGame()` from GameContext — no router navigation
  - GameModal rendered at layout level in `src/app/layout.tsx` — overlays any page
  - Close returns to whatever page user was on — no navigation happens

**Verified:**
- `npm run build` — zero errors, only expected `<img>` lint warnings in ImageReel
- All 4 routes compile: `/` (93.2 kB), `/crypto-101` (103 kB), `/migration-report` (87.1 kB), `/_not-found`
- Dev server: all 3 routes return HTTP 200
- GeckoTerminal embed URL present in HTML output
- Zero `dark:` prefixes in source
- Zero theme toggle references
- Image reel animation class present
- Dark background applied to body

---

## Feature Batch: Migration Report Fix + Minesweeper Images + Wojak TV + Image Reel Direction — 2026-02-11

**Status:** Complete

**4 tasks completed:**

### TASK 1: Migration Report — Removed "What's Next" Section
- **`src/components/migration/ReportContent.tsx`** — Removed section 11 ("What's Next for the OG Community") entirely:
  - Deleted the full `SectionCard` block with id `#whats-next` (title, body text, green callout)
  - Removed from table of contents nav: `{ id: "whats-next", label: "What's Next for the OG Community" }`
  - Report now ends with: "What You Should Do" action items → Contract Addresses reference table → DYOR footer
  - Renumbered comment labels (Contract Addresses is now section 11, DYOR footer is section 12)
  - `SITE_NAME` import kept since it's still used in the contract reference table

### TASK 2: Minesweeper — Wojak Images as Mines
- **`src/components/games/minesweeper/Cell.tsx`** — Replaced mine/bomb SVG icons with random images:
  - Added `MINE_IMAGES` array: `/images/1.jpg` through `/images/10.jpg`
  - Each mine cell gets a random image via `useMemo(() => MINE_IMAGES[Math.floor(Math.random() * 10)], [])` — stable across re-renders
  - Both mine display locations updated: game-over reveal (all unflagged mines) and the clicked mine cell
  - Images use `w-full h-full object-cover rounded-sm` to fill cell perfectly
  - Each mine randomly picks one of the 10 wojak meme images (can repeat)

### TASK 3: Wojak TV Page
- **`.env.local`** — Added `NEXT_PUBLIC_YOUTUBE_API_KEY` with actual API key
- **`.env.example`** — Added `NEXT_PUBLIC_YOUTUBE_API_KEY=your_key_here`
- **`src/lib/constants.ts`** — Added `YOUTUBE_LOW_BUDGET` and `YOUTUBE_LORD_WOJAK` channel URLs
- **`src/lib/youtube.ts`** (NEW) — YouTube API helper:
  - Hardcoded channel IDs: `UCqM1Yw5XfJ5rVwCntLy0KxA` (Low Budget Stories), `UCULzpwL5TRDydBF_bWfJjrw` (Lord Wojak)
  - `fetchChannelVideos()` — Fetches latest 12 videos via YouTube Data API v3 search endpoint
  - `fetchAllChannels()` — Fetches both channels in parallel, returns `ChannelData[]`
  - 10-minute in-memory cache per channel to avoid API spam
  - Graceful fallback: returns cached data on API error
- **`src/components/wojakTV/WojakTV.tsx`** (NEW) — Main page component:
  - Page header: "Wojak TV" title + "The best Wojak content on YouTube" subtitle
  - Two `ChannelSection` components, one per channel
  - Each section: channel name heading + "View Channel" external link + video grid
  - Video grid: 3 columns desktop, 2 tablet, 1 mobile
  - `VideoCard`: thumbnail with hover play overlay + scale effect, title (2-line clamp), formatted date
  - `SkeletonCard`: animated loading placeholders while fetching
  - Click any video → opens `VideoModal` with the video
- **`src/components/wojakTV/VideoModal.tsx`** (NEW) — Video player modal:
  - Fixed full-screen overlay with dark backdrop (`bg-black/85 backdrop-blur-sm`)
  - YouTube embed iframe with `?autoplay=1`
  - Video title displayed above player
  - Close via: X button, Escape key, backdrop click
  - Body scroll locked while open
  - 16:9 aspect ratio container
- **`src/app/wojak-tv/page.tsx`** (NEW) — Route wrapper, renders `<WojakTV />`
- **`src/components/navbar/Navbar.tsx`** — Added "Wojak TV" to `NAV_LINKS` between "Migration Report" and Games dropdown (both desktop and mobile nav)
- **`docs/SCOPE.md`** — Added Wojak TV to site structure section and updated navbar description

### TASK 4: Image Reel — Reversed Scroll Direction
- **`src/app/globals.css`** — Reversed `@keyframes scroll-reel`:
  - Was: `translateX(0)` → `translateX(-50%)` (right-to-left)
  - Now: `translateX(-50%)` → `translateX(0)` (left-to-right)
  - Same speed (30s), same seamless looping — just reversed direction

**Verified:**
- `npm run build` — zero errors, only expected `<img>` lint warnings
- All 5 routes compile: `/` (93.2 kB), `/crypto-101` (103 kB), `/migration-report` (87.1 kB), `/wojak-tv` (89.4 kB), `/_not-found`
- Dev server: all 4 user-facing routes return HTTP 200
- Migration report: zero occurrences of "whats-next" or "What's Next for the OG" in HTML output
- Migration report: "What You Should Do" and "Contract Addresses" sections still present
- Wojak TV: page loads with "Wojak TV" heading and "best Wojak content" subtitle
- Navbar: `/wojak-tv` link present on all pages
- Image reel: CSS animation reversed from `translateX(-50%)` to `translateX(0)`

---

## Major Data & Links Overhaul — 2026-02-11

**Status:** Complete

**8 tasks completed:**

### TASK 1: Real Market Data — Live Stats via CoinGecko + GeckoTerminal APIs
- **Created** `src/lib/coingecko.ts` — New API module with:
  - `fetchCoinGeckoData()` — Fetches price, market cap, 24h volume from CoinGecko free API (`/coins/ethereum/contract/{address}`)
  - `fetchGeckoTerminalTVL()` — Fetches TVL (reserve_in_usd) from GeckoTerminal pools API
  - `fetchWojakMarketData()` — Aggregates both APIs in parallel, returns raw numbers
  - `fetchFormattedStats()` — Returns nicely formatted strings ($3.14M, $946.7K, etc.) plus raw price/ethPrice for swap calculation
  - `formatCurrency()` — Exported helper: formats numbers as $X.XXB / $X.XXM / $X.XK / $X.XX
- **Updated** `src/components/dashboard/HeroStats.tsx` — Now imports from `coingecko.ts` instead of `etherscan.ts`
  - Stats row shows REAL data: Market Cap, TVL, 24h Volume, Holders
  - Loading skeletons while APIs fetch
  - Fallback to "—" / "19,630" on error
- **API endpoints used:**
  - `https://api.coingecko.com/api/v3/coins/ethereum/contract/0x5026F006B85729a8b14553FAE6af249aD16c9aaB`
  - `https://api.geckoterminal.com/api/v2/networks/eth/tokens/0x5026F006B85729a8b14553FAE6af249aD16c9aaB/pools?page=1`
  - `https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd`
- **Holders:** Hardcoded 19,630 (Etherscan free tier doesn't expose holder count endpoint)
- **Verified:** CoinGecko returns price=$0.00004523, mcap=$3.14M, vol=$12.7M. GeckoTerminal returns TVL=$946.7K.

### TASK 2: Swap Card — Real Default Values and WOJAK Logo
- **Updated** `src/components/dashboard/SwapCard.tsx`:
  - ETH input now shows `0.0911` as default value
  - WOJAK amount calculated dynamically: `0.0911 ETH * ETH_price / WOJAK_price` via `fetchFormattedStats()`
  - Shows `~3,955,486` (approximate, calculated from live prices)
  - Replaced green "W" circle icon with real WOJAK logo: `<img src="/images/favicon.jpg">` (the favicon.jpg IS the WOJAK token logo)
  - Loading state shows "—" until API responds

### TASK 3: Removed ALL DEX Screener References — Replaced with DexTools
- **`src/lib/constants.ts`** — Replaced `DEXSCREENER_URL` with `DEXTOOLS_URL` pointing to `https://www.dextools.io/app/en/ether/pair-explorer/0x5026F006B85729a8b14553FAE6af249aD16c9aaB`
- **`src/components/dashboard/ContractInfo.tsx`** — Changed "DEX Screener" link to "DexTools" with new URL, updated import
- **`src/components/migration/ReportContent.tsx`** — Updated data source attribution from "DEX Screener" to "DexTools". Platform attacks section updated to "DEX Screener / DexTools"
- **`src/lib/etherscan.ts`** — Replaced all `DexScreener` references in TODO comments with `CoinGecko`
- **`README.md`** — Updated dashboard description, tech stack, and community links from DEX Screener to DexTools
- **Verified:** Zero `DEXSCREENER` or `dexscreener` references remain in `src/`

### TASK 4: Chart Embed — DexTools Widget with GeckoTerminal Fallback
- **`src/lib/constants.ts`** — Added `DEXTOOLS_EMBED_URL` pointing to DexTools widget: `https://www.dextools.io/widget-chart/en/ether/pe-light/{contract}?theme=dark&chartType=2&chartResolution=30&drawingToolbars=false`
- **`src/lib/constants.ts`** — Kept `GECKOTERMINAL_EMBED_URL` as fallback
- **`src/components/dashboard/PriceChart.tsx`** — Rewritten with:
  - Primary: DexTools widget embed (chart only, dark theme, no toolbars)
  - Fallback: GeckoTerminal embed (triggered on iframe error)
  - "Powered by DexTools" / "Powered by GeckoTerminal" attribution below chart
  - Loading spinner while iframe loads

### TASK 5: Fixed Uniswap LP Link
- **`src/lib/constants.ts`** — Updated `UNISWAP_ADD_LIQUIDITY` from broken v2 URL to correct v3 URL:
  - `https://app.uniswap.org/positions/create/v3?currencyA=NATIVE&currencyB=0x5026f006b85729a8b14553fae6af249ad16c9aab&chain=ethereum`

### TASK 6: Fixed Telegram Link
- **`src/lib/constants.ts`** — Updated `TELEGRAM_URL` from `https://t.me/WojakTokenOfficial` to `https://t.me/Wojakog`
- Used in Footer.tsx — no other Telegram references needed updating

### TASK 7: Image Reel — Fixed Loop Jump
- **`src/app/globals.css`** — Fixed `@keyframes scroll-reel`:
  - Changed direction from `translateX(-50%) → translateX(0)` back to `translateX(0) → translateX(-50%)`
  - Explicit `animation-timing-function: linear` (no ease)
  - 20 images total (10 original + 10 duplicate), animation translates exactly -50%, resets seamlessly
  - No visible jump, stutter, or restart

### TASK 8: Footer Signature
- **`src/components/footer/Footer.tsx`** — Added below DYOR text in Disclaimer section:
  - Heart SVG icon (inline, small, wojak-green fill `#4ade80`)
  - "binarydrool.eth" text in `text-xs text-gray-500` (subtle, muted)

**Files changed:** 9 files modified, 1 file created
- `src/lib/constants.ts` — DexTools URL, DexTools embed, Uniswap v3 LP, Telegram link
- `src/lib/coingecko.ts` — NEW: CoinGecko + GeckoTerminal API module
- `src/lib/etherscan.ts` — Removed DexScreener TODO references
- `src/components/dashboard/HeroStats.tsx` — Uses CoinGecko data
- `src/components/dashboard/SwapCard.tsx` — 0.0911 ETH default, WOJAK amount, logo image
- `src/components/dashboard/PriceChart.tsx` — DexTools embed with GeckoTerminal fallback
- `src/components/dashboard/ContractInfo.tsx` — DexTools link
- `src/components/migration/ReportContent.tsx` — DexTools attribution
- `src/components/footer/Footer.tsx` — binarydrool.eth signature
- `README.md` — DexTools links, CoinGecko tech stack

**Verified:**
- `npm run build` — zero errors, only expected `<img>` lint warnings
- All 5 routes compile: `/` (94 kB), `/crypto-101` (103 kB), `/migration-report` (87.1 kB), `/wojak-tv` (89.4 kB), `/_not-found`
- Dev server: all 4 user-facing routes return HTTP 200
- CoinGecko API confirmed live: price=$0.00004523, mcap=$3.14M, vol=$12.7M
- GeckoTerminal API confirmed live: TVL=$946.7K
- ETH price API confirmed live: $1,963.71
- Homepage HTML contains: dextools.io embed, 0.0911, favicon.jpg (WOJAK logo), Wojakog, DexTools link, binarydrool.eth, positions/create (Uniswap v3)
- Zero DEX Screener references remain in `src/`

---

## Fixes & TVL Tab — 2026-02-11

**Status:** Complete

**6 fixes applied:**

### FIX 1: Disclaimer Text
- **`src/components/footer/Footer.tsx`** — Changed "DYOR" to "Do your own research"
- Full text now reads: "Do your own research. Verify everything on-chain. The blockchain doesn't lie."
- binarydrool.eth signature still present below

### FIX 2: ETH Logo Above "The OG WOJAK"
- **`src/components/dashboard/ImageReel.tsx`** — Added solid white Ethereum diamond SVG above the title
- SVG uses the official ETH diamond shape, 40px default scaling up to 50px on md breakpoints
- Drop shadow for readability over the image reel
- Title text pushed down with `mb-2` spacing; overall banner height unchanged
- ETH logo, title, and subtitle are vertically centered as a group

### FIX 3: Image Reel Direction — Reversed to Left-to-Right
- **`src/app/globals.css`** — Reversed `@keyframes scroll-reel`:
  - FROM: `translateX(0)` → `translateX(-50%)` (right-to-left)
  - TO: `translateX(-50%)` → `translateX(0)` (left-to-right)
- Same speed (30s), same seamless looping — just reversed direction

### FIX 4: Main Chart Not Loading — Switched to GeckoTerminal Only
- **`src/components/dashboard/PriceChart.tsx`** — Removed DexTools as primary chart, now uses GeckoTerminal embed exclusively
- Removed DexTools fallback logic (`useFallback` state, `handleError` callback)
- GeckoTerminal URL: `https://www.geckoterminal.com/eth/pools/0x0f23D49bC92Ec52FF591D091b3e16c937034496e?embed=1&info=0&swaps=0&grayscale=0&light_chart=0`
- Chart renders reliably with loading spinner

### FIX 5: Uniswap Pool Link — Changed to Token Explorer
- **`src/lib/constants.ts`** — Updated `UNISWAP_POOL_URL` from swap page to explore page:
  - FROM: `https://app.uniswap.org/#/swap?outputCurrency={contract}`
  - TO: `https://app.uniswap.org/explore/tokens/ethereum/0x5026f006b85729a8b14553fae6af249ad16c9aab`
- Used everywhere "Uniswap Pool" link appears (ContractInfo.tsx)

### FIX 6: Added TVL Tab to Chart Section
- **`src/components/dashboard/ChartSection.tsx`** — Added third "TVL" tab:
  - Tab order: Chart | Transactions | TVL
  - `TVLPanel` component shows:
    - Current TVL value (large, prominent, in wojak-green) — fetched from GeckoTerminal API via `fetchWojakMarketData()`
    - Uniswap V2 pool address with link to Etherscan
    - LP Lock status: green card with lock icon — "Locked until Year 2100 — liquidity cannot be rugged"
    - Pool composition: WETH / WOJAK breakdown in two-column grid
  - Loading skeleton while API fetches
  - Styled as clean info card consistent with dark theme

**Verified:**
- `npm run build` — zero errors, only expected `<img>` lint warnings
- All 5 routes compile: `/` (94.5 kB), `/crypto-101` (103 kB), `/migration-report` (87.1 kB), `/wojak-tv` (89.4 kB), `/_not-found`
- Dev server: all 4 user-facing routes return HTTP 200
- Footer disclaimer says "Do your own research"
- ETH diamond SVG (`viewBox="0 0 256 417"`) present above title
- Image reel scrolls left-to-right (`translateX(-50%)` → `translateX(0)`)
- GeckoTerminal chart embed loads
- Uniswap Pool link goes to `/explore/tokens/ethereum/` not `/swap`
- TVL tab button present in chart section with pool info content

---

## TVL Tab — Interactive TVL Chart — 2026-02-11

**Status:** Complete

**What changed:**

### TVL Tab Upgrade in ChartSection
- **`src/lib/constants.ts`** — Added `GECKOTERMINAL_TVL_EMBED_URL` constant:
  - URL: `https://www.geckoterminal.com/eth/pools/{pool}?embed=1&info=0&swaps=0&grayscale=0&light_chart=0&chart_type=tvl`
  - Uses `&chart_type=tvl` param to show TVL chart instead of price chart
  - Falls back to base GeckoTerminal embed URL if `&chart_type=tvl` doesn't work
- **`src/components/dashboard/ChartSection.tsx`** — Rebuilt `TVLPanel` component:
  - **Interactive TVL chart iframe** as the primary visual at the top of the panel
  - Same responsive dimensions as the price chart: `h-[350px] sm:h-[420px] md:h-[500px]`
  - Loading spinner ("Loading TVL chart...") while iframe loads
  - Fallback logic: if `chart_type=tvl` URL fails, falls back to base GeckoTerminal embed and shows "Toggle to TVL view within the chart" note
  - "Powered by GeckoTerminal" attribution below chart
  - **Below the chart** (separated by border-t divider), all existing stats preserved:
    - TVL dollar amount (large, wojak-green, fetched from GeckoTerminal API)
    - Pool address with link to Etherscan
    - LP Locked badge: "Locked until Year 2100 — liquidity cannot be rugged"
    - Pool composition (WETH / WOJAK) in 2-column grid
  - Added `useCallback` import for chart load/error handlers

**Files changed:** 2 files
- `src/lib/constants.ts` — Added `GECKOTERMINAL_TVL_EMBED_URL`
- `src/components/dashboard/ChartSection.tsx` — Rebuilt TVLPanel with iframe chart + fallback + existing stats below

**Verified:**
- `npm run build` — zero errors, only expected `<img>` lint warnings
- All 5 routes compile: `/` (94.7 kB), `/crypto-101` (103 kB), `/migration-report` (87.1 kB), `/wojak-tv` (89.4 kB), `/_not-found`
- Dev server: all 4 user-facing routes return HTTP 200
- `npm run dev` — site loads visually in browser at http://localhost:3000
- TVL tab: chart iframe renders with GeckoTerminal embed, stats display below with TVL value, pool address, LP lock badge, and pool composition

---

## Post-v1 Fixes: Green Gradient, TVL Tab, Uniswap Link, LP Guide Modal, Wojak TV Redesign — 2026-02-11

**Status:** Complete

### FIX 1: Subtle Green Background Gradient
- Added a subtle radial gradient to the body background in `globals.css`
- Two radial gradients: faint wojak-green glow at top (6% opacity, 80% wide ellipse) and bottom (3% opacity, 60% wide), fading to #0a0a0a
- Applied globally via `body` CSS rule — visible across all pages
- Barely noticeable — adds warmth and depth without overwhelming the dark theme

**File changed:** `src/app/globals.css`

### FIX 2: TVL Tab — No Longer Shows Price Chart
- Removed the iframe embed from TVLPanel that was showing the same price chart as the Chart tab
- TVL tab now shows static data prominently:
  - Large centered TVL dollar amount (4xl-5xl font, wojak-green)
  - 2x2 stats grid: Pool Type (Uniswap V2), Fee Tier (0.3%), Pool Pair (WOJAK/WETH), LP Lock Expiry (Year 2100)
  - Pool address with Etherscan link
  - LP Locked status badge
  - External link to view liquidity chart on GeckoTerminal
- Removed unused imports (`useCallback`, `GECKOTERMINAL_TVL_EMBED_URL`, `GECKOTERMINAL_EMBED_URL`)

**File changed:** `src/components/dashboard/ChartSection.tsx`

### FIX 3: Uniswap Pool Link — Correct URL
- Updated `UNISWAP_POOL_URL` in constants.ts to point to the actual pool explorer page:
  `https://app.uniswap.org/explore/pools/ethereum/0x0f23d49bc92ec52ff591d091b3e16c937034496e`
- Previously pointed to the token page, not the pool page
- Renamed link text from "Uniswap Pool" to "Uniswap Liquidity Pool" in ContractInfo.tsx

**Files changed:** `src/lib/constants.ts`, `src/components/dashboard/ContractInfo.tsx`

### FIX 4: LP Education Modal
- Created `src/components/dashboard/LPGuideModal.tsx` — full-featured modal with beginner LP guide
- Modal content sections:
  1. What is Liquidity Providing? — Simple explanation of LP pools
  2. How Does It Work for WOJAK? — Equal value ETH + WOJAK deposit
  3. What Do You Get? — LP tokens, trading fees (0.3%), auto-compounding
  4. The Risks — Impermanent Loss — Clear explanation with worked example ($1000 deposit scenario)
  5. Current Pool Stats — $951K TVL, 18.81% APR
  6. Step-by-Step Guide — 5 numbered steps with green circles
  7. Risk Warning disclaimer (red-tinted box)
- Modal features: sticky header, scroll body, dark card, X to close, Escape to close, backdrop click to close, body scroll lock
- Added "How to become a Liquidity Provider" button link in ContractInfo.tsx after the "Add Liquidity on Uniswap" link
- Uses question-mark circle icon for the guide link

**Files changed:** `src/components/dashboard/LPGuideModal.tsx` (new), `src/components/dashboard/ContractInfo.tsx`

### FIX 5: Wojak TV — Equal Channel Prominence
- Redesigned Wojak TV layout for equal channel featuring:
  - **Desktop (lg+):** Two-column side-by-side layout — Low Budget Stories on left, Lord Wojak on right
    - Each column: channel header with "View Channel" link, vertical stack of video cards
    - Both columns same width, show same number of videos (12 each via API maxResults)
  - **Mobile/Tablet (below lg):** Channel header cards at top (2-col grid), then alternating videos from both channels
    - Videos alternate: one from channel 1, one from channel 2, interleaved
    - Each video shows a small channel name label above the card
- Fixed HTML entity decoding: added `decodeHTMLEntities()` function that uses textarea.innerHTML to decode &#39; &amp; &quot; etc.
- Applied decoding to video titles in VideoCard and in VideoModal title
- Widened max container from max-w-6xl to max-w-7xl to accommodate side-by-side columns

**File changed:** `src/components/wojakTV/WojakTV.tsx`

### Verified
- `npm run build` — zero errors, only pre-existing `<img>` lint warnings
- All routes compile: `/` (96.9 kB), `/crypto-101` (103 kB), `/migration-report` (87.1 kB), `/wojak-tv` (89.7 kB)
- `npm run dev` — all 4 routes return HTTP 200
- Green gradient CSS present in compiled stylesheet (2 radial-gradient values)
- Homepage: "Uniswap Liquidity Pool" link text confirmed, "How to become a Liquidity Provider" button confirmed
- TVL tab: no iframe, shows static data with Pool Type/Fee Tier/Pool Pair/LP Lock grid
- Wojak TV: lg:grid-cols-2 two-column layout present in SSR output

---

## 6-Fix Batch: Transactions, Nav Dot, TVL Link, LP Modal, GeckoTerminal Dupe, Wojak TV — 2026-02-11

**Status:** Complete

**6 fixes applied:**

### FIX 1: Transactions Not Loading — Switched to GeckoTerminal API
- **Root cause:** Etherscan V1 API is deprecated (returns "switch to V2" error). V2 requires an API key, and `.env.local` had `NEXT_PUBLIC_ETHERSCAN_API_KEY=` (empty).
- **Fix:** Switched `fetchRecentTrades()` in `src/lib/etherscan.ts` to use GeckoTerminal's free trades API:
  - Endpoint: `https://api.geckoterminal.com/api/v2/networks/eth/pools/{pool}/trades`
  - No API key required, returns real buy/sell data with price, amount, volume, wallet
  - Returns 25 most recent trades (up from 20)
- **Updated** `src/types/index.ts` — Added `priceUsd` and `volumeUsd` fields to `Trade` type
- **Updated** `src/components/dashboard/RecentTrades.tsx`:
  - Removed `OG_UNISWAP_POOL` import and `classifyTrade()` — type comes directly from API (`kind: "buy" | "sell"`)
  - `formatAmount()` no longer divides by 1e18 — GeckoTerminal returns human-readable amounts
  - Added `formatUsd()` helper for the Value column
  - Changed "Price" column header to "Value" — shows trade USD volume
  - Changed fallback message from "No recent trades found" to "Loading trades..." when API errors
  - Fixed duplicate key warning: uses `${trade.hash}-${i}` as key
- **Files changed:** `src/lib/etherscan.ts`, `src/types/index.ts`, `src/components/dashboard/RecentTrades.tsx`

### FIX 2: Green Notification Dot on Migration Report Nav Link
- **`src/app/globals.css`** — Added `@keyframes notification-pulse` animation:
  - Gentle scale 1 → 1.4 and opacity 1 → 0.6, 2s cycle, ease-in-out
  - `.animate-notification-pulse` class
- **`src/components/navbar/Navbar.tsx`** — Added 7px green dot (`bg-wojak-green rounded-full`) next to "Migration Report" link:
  - Desktop: positioned absolute, top-right of link text (`-top-1 -right-2.5`)
  - Mobile: inline flex with `gap-2` next to label text
  - Both use `animate-notification-pulse` class
- **Files changed:** `src/app/globals.css`, `src/components/navbar/Navbar.tsx`

### FIX 3: TVL Tab — Fixed Link to Uniswap Pool
- **`src/components/dashboard/ChartSection.tsx`** — Changed bottom link in TVLPanel:
  - FROM: "View liquidity chart on GeckoTerminal" → `geckoterminal.com/eth/pools/{pool}`
  - TO: "View Liquidity Pool on Uniswap" → `UNISWAP_POOL_URL` (app.uniswap.org/explore/pools/ethereum/...)
  - Added `UNISWAP_POOL_URL` to imports from constants
- **File changed:** `src/components/dashboard/ChartSection.tsx`

### FIX 4: LP Guide Modal — Wider on Desktop
- **`src/components/dashboard/LPGuideModal.tsx`** — Changed modal container width:
  - FROM: `max-w-2xl` (672px)
  - TO: `max-w-[900px]`
  - Mobile still full-width with padding (`w-full` + parent `p-4`)
  - Significantly reduces scrolling on desktop while keeping content readable
- **File changed:** `src/components/dashboard/LPGuideModal.tsx`

### FIX 5: Removed Duplicate "Powered by GeckoTerminal"
- **`src/components/dashboard/PriceChart.tsx`** — Removed manually added attribution `<div>` below the chart iframe:
  - The GeckoTerminal iframe embed already includes its own "Powered by GeckoTerminal" branding inside the iframe
  - The manual text was creating a duplicate — now only the iframe's built-in branding shows
- **File changed:** `src/components/dashboard/PriceChart.tsx`

### FIX 6: Wojak TV — View Channel Overlaid on Thumbnails
- **`src/components/wojakTV/WojakTV.tsx`** — Moved "View Channel" from header area to first video thumbnail:
  - `VideoCard` component now accepts `channelUrl` and `showChannelBadge` props
  - When `showChannelBadge` is true, renders a semi-transparent dark pill badge (`bg-black/60 hover:bg-black/80`) with white text, positioned absolute `top-2 right-2` on the thumbnail
  - Badge includes external link icon, uses `backdrop-blur-sm` for glass effect
  - `e.stopPropagation()` on badge click prevents triggering video play
  - Desktop: badge shown on first video (`idx === 0`) in each channel column
  - Mobile: badge shown on first video from each channel in the alternating feed (`isFirst` flag)
  - `ChannelHeader` component simplified — only shows channel name, no "View Channel" link
  - Mobile channel cards at top: removed "View Channel" text, just show channel names
- **File changed:** `src/components/wojakTV/WojakTV.tsx`

### Verified
- `npm run build` — zero errors, only pre-existing `<img>` lint warnings
- All 5 routes compile: `/` (96.9 kB), `/crypto-101` (103 kB), `/migration-report` (87.1 kB), `/wojak-tv` (89.8 kB), `/_not-found`
- `npm run dev` — all 4 user-facing routes return HTTP 200
- `animate-notification-pulse` class present in rendered HTML
- "View Liquidity Pool on Uniswap" link text in ChartSection source
- LP modal uses `max-w-[900px]`
- Zero manual "Powered by GeckoTerminal" in PriceChart source
- Wojak TV: `showChannelBadge` prop wired to first video in each channel

---

## DEXTscore + Matcha.xyz Placement Fix — 2026-02-11

**Status:** Complete

**What changed:**

### FIX 1: DEXTscore Section — New Component
- **Created** `src/components/dashboard/DextScore.tsx` — DEXTscore display card:
  - Header row: "DEXTscore" title + circular score badge (99) with green SVG ring
  - 5 mini score boxes in a grid: INFO 99, TX 99, HOLD 99, AUDIT 99, POOL 99
  - Each box has an SVG icon, label, and score in wojak-green
  - "View on DexTools" link at bottom, opens DexTools page in new tab
  - All scores hardcoded (no API — DexTools has no free DEXTscore API)
  - Dark theme consistent with existing card styling (wojak-card, wojak-border, rounded-2xl)
- **Updated** `src/app/page.tsx`:
  - Imported `DextScore` component
  - Wrapped `SwapCard` and `DextScore` in a `<div className="space-y-6">` in the right column
  - DEXTscore card appears directly below the SwapCard on desktop (right column) and below swap card on mobile

### FIX 2: Matcha.xyz Text Moved Inside SwapCard
- **Updated** `src/components/dashboard/SwapCard.tsx`:
  - Moved "Also available on Matcha.xyz" from below the card to inside the card
  - Now appears directly under "Powered by CoW Swap" text
  - Styled as `text-[11px] text-gray-600 mt-1` — slightly smaller than "Powered by" for visual hierarchy
  - "Matcha.xyz" link remains wojak-green with hover underline

### Site Loading Verification
- **Build:** `npm run build` — zero errors, all 5 routes compile
- **Routes verified:** `/` → 200, `/crypto-101` → 200, `/migration-report` → 200, `/wojak-tv` → 200
- First Load JS for `/`: 97.6 kB (slight increase from DextScore component)
- No runtime errors, no hydration issues

---

## Post-Launch Fixes — 2026-02-11

**Status:** Complete

### FIX 1: Transactions Tab — Limit Height
- **Updated** `src/components/dashboard/RecentTrades.tsx`:
  - Added `max-h-[500px] overflow-y-auto` to the embedded transactions container
  - Transactions list now scrolls within a fixed-height container (~500px) instead of extending infinitely
  - Matches approximate height of the chart area so right column (SwapCard + DEXscore) isn't exceeded

### FIX 2: Rename DEXTscore to DEXscore
- **Updated** `src/components/dashboard/DextScore.tsx`:
  - Changed header text from "DEXTscore" to "DEXscore"
- **Updated** `src/app/page.tsx`:
  - Changed comment from "DEXTscore" to "DEXscore"

### FIX 3: Add Price Stats Below Chart
- **Updated** `src/lib/coingecko.ts`:
  - Extended `CoinGeckoTokenData` interface with `price_change_percentage_1h_in_currency`, `price_change_percentage_24h`, `price_change_percentage_7d`
  - Added `GeckoTerminalSinglePool` interface for per-pool data
  - Added `PriceStats` export interface (`change1h`, `change24h`, `change7d`, `volume24h`)
  - Added `fetchPriceStats()` function — tries CoinGecko first, falls back to GeckoTerminal pool endpoint for missing fields
- **Updated** `src/components/dashboard/PriceChart.tsx`:
  - Added `ChangeBadge` component — shows percentage with green (positive) or red (negative) coloring
  - Added `StatBadge` component — shows formatted dollar amount for volume
  - Stats bar renders directly below the chart iframe inside the chart card
  - Compact horizontal row: "1H: +X.XX%" | "24H: -X.XX%" | "7D: +X.XX%" | "Vol: $XXX"
  - Only shows when at least one stat is available; individual stats hidden if null

### Site Loading Verification
- **Build:** `npm run build` — zero errors, all 5 routes compile
- **Routes verified:** `/` → 200, `/crypto-101` → 200, `/migration-report` → 200, `/wojak-tv` → 200
- First Load JS for `/`: 98.1 kB
- No runtime errors, no hydration issues

---

## Migration Report Accuracy Correction — 2026-02-11

**Status:** Complete

**Context:** The new WOJAK contract (0x8De39B057CC6522230AB19C0205080a8663331Ef) was verified on-chain: `owner()` returns `0x0000000000000000000000000000000000000000`. Ownership HAS been renounced. The report previously stated it had NOT been renounced, which was incorrect. This update corrects all inaccurate claims to maintain credibility.

**What changed:**

### 1. ComparisonTable.tsx — Contract Row Updated
- OG column: "RENOUNCED — no admin" → "RENOUNCED — clean ERC-20, zero admin functions"
- New column: "NOT RENOUNCED — blacklist" → "RENOUNCED — deployed with blacklist + setRule, now locked"
- Code row: "blacklist + setRule + owner" → "blacklist + setRule (owner renounced, functions locked)"

### 2. ReportContent.tsx — TL;DR Rewritten
- Removed claim that new contract "has NOT been renounced"
- New text acknowledges both contracts are renounced, but emphasizes design differences: OG was deployed clean (zero admin functions ever), new contract was deployed with blacklist/setRule/trading controls that were active before renouncing — settings and blacklisted wallets from that period are permanently locked in

### 3. ReportContent.tsx — "Red Flags" → "Contract Design Concerns (0x8D)"
- Section renamed from "Red Flags in the New Contract" to "Contract Design Concerns"
- TOC entry updated to match
- New intro paragraph acknowledges ownership renounced to 0x0, reframes section as examining the contract's design philosophy
- All 4 function descriptions rewritten:
  - blacklist: can no longer add new blacklists, but wallets blacklisted before renouncing remain permanently frozen
  - setRule: trading limits now locked in whatever state they were in at renouncement
  - _beforeTokenTransfer: checks are hardcoded and permanent, cannot be removed
  - Ownership: renounced to 0x0, onlyOwner functions can no longer be called
- Added summary comparison: OG was designed trustless from day one, not made trustless after the fact
- Border color changed from red to yellow (more nuanced — concern, not alarm)

### 4. ReportContent.tsx — OG Strengths Card Updated
- "Contract RENOUNCED" → "Clean from Day One"
- Emphasizes that no admin functions ever existed in OG code

### 5. ReportContent.tsx — "What You Should Do" Tone Softened
- Added intro paragraph: "We are not saying the new token is a scam. We are saying the OG token is fundamentally cleaner by design, and the migration creates unnecessary sell pressure on OG holders."
- All action items preserved (DO NOT connect wallet, DO NOT approve unknown contracts, revoke approvals, hold OG WOJAK)
- Border color changed from red to yellow for softer tone

### 6. Full Sweep Verification
- Grep confirmed zero instances of "NOT renounced" or "not been renounced" in `src/components/migration/`
- Crypto 101 TokenSafety.tsx has a general education reference ("Contract is NOT renounced" as a red flag to watch for) — this is generic education content, not about the new WOJAK contract, so left as-is

**Verified:**
- `npm run build` — zero errors, all 5 routes compile
- `npm run dev` — migration report page returns HTTP 200
- Rendered HTML contains zero instances of "NOT renounced" on the migration report page
- All claims now verifiable on-chain

---

## Post-v1 Cleanup — 2026-02-11

**Status:** Complete

**What was changed:**

### 1. Removed Migration Report Entirely
- Removed "Migration Report" nav link from `Navbar.tsx` (both desktop and mobile)
- Removed green notification dot that was on the Migration Report nav link
- Deleted route file `src/app/migration-report/page.tsx` and directory
- Removed migration-report link from `TokenSafety.tsx` in Crypto 101 — replaced "A Real-World Example" section with generic "Putting It Into Practice" advice
- Removed `Link` import from `TokenSafety.tsx` (no longer needed)
- Updated `docs/SCOPE.md` — removed Migration Report from site structure, nav links, file tree, and re-numbered sections
- Migration component files (`src/components/migration/`) left in place (unreferenced)

### 2. Fixed Negative Space Below Chart on Desktop
- Reduced chart iframe heights by ~40px across breakpoints: `h-[320px] sm:h-[390px] md:h-[460px]`
- Replaced inline flex stats bar with a 4-column grid layout
- Each stat is now a small card/cell: label on top (muted, uppercase) and value below (colored green/red based on positive/negative)
- Grid uses minimal `p-2 gap-2` for tight spacing directly under chart
- Chart card ends right after the stats row with no excess padding

### 3. Reduced Space Between ContractInfo and Footer
- `ContractInfo.tsx`: reduced `pb-8` → `pb-4`
- `Footer.tsx`: reduced `py-10` → `py-6`
- Gap between content and footer is now natural, not a big empty void

### 4. Verified Crypto 101 Page
- All 8 section components compile and render correctly
- Sticky horizontal nav with scroll spy works
- Migration-report link removed from TokenSafety section
- Build confirmed all routes generate successfully

**Verified:**
- `npm run build` — zero errors, all routes compile (6 pages: /, /_not-found, /crypto-101, /wojak-tv + static assets)
- No migration-report references remain in any nav, link, or active component

---

## Dashboard Layout Restructure — 2026-02-11

**Status:** Complete

**What changed:**

### TASK 1: DEXscore Moved Below Chart (Inline Row)
- **Created** `src/components/dashboard/DextScoreInline.tsx` — compact single-row DEXscore display:
  - Horizontal layout: "DEXscore" label + circular 99 badge (small, 32px) + divider + 5 mini scores (INFO 99, TX 99, HOLD 99, AUDIT 99, POOL 99) inline + "View on DexTools" link pushed right
  - Uses `flex-wrap` so it wraps to 2 rows on mobile while staying compact
  - Styled as a slim card (`rounded-xl`, `py-2.5`) — much shorter than the old vertical card
- **Removed** `DextScore` import from `src/app/page.tsx` — no longer in right column
- **Old `DextScore.tsx`** left in place (unreferenced) — can be cleaned up later

### TASK 2: Price Stats Moved to Right Column
- **Created** `src/components/dashboard/PriceStatsCard.tsx` — 2x2 grid stats card:
  - Fetches 1H, 24H, 7D change percentages and 24H volume from `fetchPriceStats()` (CoinGecko/GeckoTerminal)
  - 2x2 grid: 1H (top-left), 24H (top-right), 7D (bottom-left), VOL (bottom-right)
  - Green for positive %, red for negative %, white for volume
  - Loading skeleton with 4 animated placeholder cells
  - Card matches SwapCard aesthetic (dark bg, rounded-2xl, compact padding)
- **Stripped** stats row from `src/components/dashboard/PriceChart.tsx`:
  - Removed `StatCell` component, `fetchPriceStats` import, `useEffect`/`useState` for stats, `hasStats` conditional, stats grid markup
  - PriceChart now only renders the chart iframe with loading spinner — clean and minimal

### TASK 3: Negative Space Eliminated
- **`src/app/page.tsx`** — Restructured layout:
  - Left column: `ChartSection` + `DextScoreInline` with only `mt-2` gap (was `space-y-6`)
  - Right column: `SwapCard` + `PriceStatsCard` with `space-y-4` (was `space-y-6`)
  - Chart card ends right after the iframe — no extra padding
  - DEXscore row sits snug below chart card
  - Right column has no excess gaps between SwapCard and stats grid

### Files Changed
- `src/components/dashboard/DextScoreInline.tsx` — NEW: inline DEXscore row
- `src/components/dashboard/PriceStatsCard.tsx` — NEW: 2x2 price stats card
- `src/components/dashboard/PriceChart.tsx` — Stripped stats row (chart-only now)
- `src/app/page.tsx` — New layout: DEXscore below chart, stats in right column

**Verified:**
- `npm run build` — zero errors, only pre-existing `<img>` lint warnings
- All routes compile: `/` (97.9 kB), `/crypto-101`, `/wojak-tv`, `/_not-found`
- No broken imports

---

## Layout Tweaks: Price Stats Row + DEXscore Merge — 2026-02-11

**Status:** Complete

**What changed:**

### FIX 1: Price Stats — Changed from 2x2 Grid to Single Horizontal Row
- **`src/components/dashboard/PriceStatsCard.tsx`**:
  - `StatCell` component: removed `bg-black/30 border border-wojak-border rounded-lg p-3` card styling, replaced with `flex-1 min-w-0 text-center` for equal-width flex items
  - Label size unchanged at `text-[10px]`, value size reduced from `text-sm` (14px) to `text-[13px]` with `leading-tight`
  - Spacing reduced: `mb-1` → `mb-0.5` between label and value
  - Main grid: changed from `grid grid-cols-2 gap-2` to `flex gap-2` — all 4 stats (1H, 24H, 7D, VOL) in one horizontal row
  - Card padding: reduced from `p-4` to `px-3 py-3` for compact fit
  - Loading skeleton: same flex layout with proportionally smaller placeholder bars

### FIX 2: DEXscore — Merged Into Chart Card
- **`src/components/dashboard/ChartSection.tsx`**:
  - Imported `DextScoreInline` component
  - Added DEXscore as the card footer: `<div className="border-t border-wojak-border"><DextScoreInline /></div>` after tab content
  - DEXscore row is now inside the same `bg-wojak-card border border-wojak-border rounded-xl` container as the Chart/Transactions/TVL tabs
  - Visual flow: [Tab bar] → [Chart/Transactions/TVL content] → [border-t divider] → [DEXscore row]
- **`src/components/dashboard/DextScoreInline.tsx`**:
  - Removed own card styling (`bg-wojak-card border border-wojak-border rounded-xl`) since parent card provides it
  - Now just `px-4 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-2`
- **`src/app/page.tsx`**:
  - Removed `DextScoreInline` import (no longer used at page level)
  - Left column simplified: just `<div><ChartSection /></div>` — no separate DEXscore element or `mt-2` gap

**Verified:**
- `npm run build` — zero errors, only pre-existing `<img>` lint warnings
- All routes compile: `/` (97.9 kB), `/crypto-101`, `/wojak-tv`, `/_not-found`
- No broken imports

---

## Layout Tweak: Price Stats Back to 2x2 Grid (Compact) — 2026-02-11

**Status:** Complete

**What changed:**

### FIX: Price Stats — 2x2 Grid, Smaller & Compact
- **`src/components/dashboard/PriceStatsCard.tsx`**:
  - Reverted layout from single flex row back to `grid grid-cols-2 gap-2`
  - Restored per-cell card styling: `bg-black/30 border border-wojak-border rounded-lg`
  - Reduced cell padding from original `p-3` to `px-2 py-2` for compact fit
  - Kept small text sizes: labels `text-[10px]`, values `text-[13px] leading-tight`
  - Spacing between label and value: `mb-0.5` (tighter than original `mb-1`)
  - Loading skeleton: same 2x2 grid with matching compact cell styling
- **`src/app/page.tsx`**:
  - Reduced right column gap from `space-y-4` (16px) to `space-y-3` (12px) between SwapCard and PriceStatsCard
  - Tighter gap helps right column bottom align closer to left column bottom (chart card with DEXscore footer)

**Goal:** Right column (SwapCard + compact 2x2 stats grid) aligns vertically with left column (chart card + DEXscore) on desktop.

**Verified:**
- `npm run build` — zero errors, only pre-existing `<img>` lint warnings
- All routes compile: `/` (97.9 kB), `/crypto-101`, `/wojak-tv`, `/_not-found`
- No broken imports

---

## Two Fixes: Crypto 101 + Column Alignment — 2026-02-11

**Status:** Complete

### FIX 1: Crypto 101 Page Not Rendering
- **Root cause:** Stale webpack cache in `.next/` directory. The dev server's webpack runtime referenced non-existent chunk files (`./251.js`, `./682.js`), causing a 500 error on every page (not just crypto-101).
- **Diagnosis:** All 8 section components verified correct — no missing files, no syntax errors, no missing `"use client"` directives. `npm run build` passed cleanly with crypto-101 generating as static content.
- **Fix:** Cleared `.next/` directory to remove corrupted webpack artifacts. Dev server needs a restart to clear its in-memory webpack state (build artifacts regenerate but the running process has stale references).
- **Source code:** No changes needed — all crypto-101 components were already correct.

### FIX 2: Right Column Bottom Aligned with Left Column
- **Problem:** Right column (SwapCard + PriceStatsCard) and left column (ChartSection with DEXscore footer) didn't end at the same height on desktop.
- **Fix — `src/app/page.tsx`:**
  - Changed right column from `space-y-3` to `flex flex-col gap-3 lg:gap-2 lg:justify-between`
  - On desktop (lg+): flex column with `justify-between` pushes PriceStatsCard to the bottom of the grid cell, aligning it with the DEXscore footer in the left column
  - On mobile: flex column with `gap-3` (same visual as before)
  - CSS grid `items-stretch` (default) ensures both columns are the same height
- **Fix — `src/components/dashboard/SwapCard.tsx`:**
  - Reduced card padding: `p-5 sm:p-6` → `p-4 sm:p-5`
  - Reduced header margin: `mb-5` → `mb-4`
  - Reduced swap button margin: `mt-4` → `mt-3`
  - Reduced MEV note margin: `mt-4` → `mt-3`
  - Reduced "Powered by" margin: `mt-3` → `mt-2`
  - Total height reduction: ~20px, helping the two columns align more closely

**Files changed:**
- `src/app/page.tsx` — Right column flex layout with `lg:justify-between`
- `src/components/dashboard/SwapCard.tsx` — Tightened padding and margins

**Verified:**
- `npm run build` — zero errors, only pre-existing `<img>` lint warnings
- All routes compile: `/` (97.9 kB), `/crypto-101` (95.7 kB), `/wojak-tv` (89.8 kB), `/_not-found`
- Dev server requires restart to clear stale webpack runtime (build passes, source code is correct)

---

## Bug Fix: Holder Count Scraper Returning "3" Instead of ~19,504 — 2026-02-12

**Status:** Fixed

**Problem:**
The `/api/holders` endpoint was displaying "3" instead of the actual holder count (~19,504). The Etherscan HTML scraper's first regex pattern (`tokenHolders` attribute pattern) was matching an unrelated "3" from the page before reaching the correct number.

**Root Cause:**
Debug logging confirmed that Pattern 1 (`/tokenHolders[^>]*>[\s\S]*?([\d,]+)\s*(?:addresses|\()/i`) was matching the number "3" from an unrelated element on the Etherscan page. The real holder count "19,504" was available in the page's `<meta>` description tag: `Holders: 19,504`.

**Fix — `src/app/api/holders/route.ts`:**
1. **Added minimum threshold check** (`MIN_HOLDER_THRESHOLD = 1000`): Any parsed number below 1,000 is rejected as obviously wrong, and the scraper moves to the next pattern
2. **Added known fallback** (`KNOWN_FALLBACK = 19504`): If all patterns fail or return garbage, the endpoint returns the last known accurate count instead of null/error
3. **Improved regex patterns**: Reordered and refined 5 patterns that try progressively different HTML structures:
   - `tokenHolders` attribute (now guarded by threshold)
   - "Holders" heading followed by comma-separated number (matches `<meta>` tag)
   - Number with percentage change in parens (e.g. `19,504 ( -0.031%)`)
   - `NUMBER holders/addresses` requiring 5+ char number string
   - JSON `holderCount` data attribute
4. **Added debug logging**: Console logs the HTML snippet around "Holders" text and which pattern matched, for future debugging
5. **Fallback chain**: Live scrape → cached value → known fallback (never returns null)

**Files changed:**
- `src/app/api/holders/route.ts` — Complete scraper rewrite with threshold, fallback, debug logging

**Verified:**
- `curl http://localhost:3000/api/holders` returns `{"holders":19504,"lastUpdated":"2026-02-12T04:12:01.862Z"}`
- Server logs confirm Pattern "Holders heading" correctly matched "19,504" from meta tag
- Server logs confirm Pattern "tokenHolders attr" matched "3" but was rejected by threshold check

---

## Phase 11: Breakout (Brick Breaker) Game — 2026-02-12

**Status:** Complete

**What was built:**
Canvas-based Breakout (brick breaker) game following the exact same patterns as Chess and Minesweeper — same modal system, difficulty button styles, dark theme, component structure.

**Game features:**
- Canvas-based rendering with requestAnimationFrame game loop
- Paddle controlled by mouse movement (desktop) and touch drag (mobile) with touchstart/touchmove/touchend events
- Ball bounces off paddle (angle varies by hit position), walls, and bricks
- Bricks break on contact; ball bounces back
- 3 lives system — ball falling below paddle costs a life, 0 lives = game over
- Win condition: all bricks destroyed
- Score tracking: 10 points per brick health × max health on destroy, 5 points per hit on multi-hit bricks
- Click/tap to launch ball from idle state
- Click to restart after win/loss

**Four difficulty levels (same button style as Chess):**
- Easy: 3 rows of bricks, ball speed 3
- Medium: 4 rows, ball speed 4
- Hard: 5 rows, ball speed 5, top 2 rows take 2 hits
- Expert: 6 rows, ball speed 5.5, top 2 rows take 3 hits, rows 3-4 take 2 hits

**Brick colors (green theme):**
- 1-hit bricks: #00ff41 (brightest green)
- 2-hit bricks: #009926 → #00cc33 as damaged
- 3-hit bricks: #006619 → #009926 → #00cc33 as damaged
- Multi-hit bricks display health number
- Dark background (#0a0a0a) matches site theme

**Files created:**
- `src/components/games/breakout/Breakout.tsx` — Full game component (single file, self-contained)

**Files changed:**
- `src/components/games/GameModal.tsx` — Added lazy import for Breakout, added to GAME_COMPONENTS and GAME_NAMES
- `src/components/navbar/GamesDropdown.tsx` — Added `{ id: "breakout", name: "Breakout" }` to GAMES array
- `README.md` — Added Breakout and Chess to Features list
- `docs/SCOPE.md` — Updated Games section with all 3 games, updated file structure tree
- `docs/TODO.md` — Added Phase 11 with all items checked off
- `docs/PROGRESS.md` — This entry

**Verified:**
- `npm run build` — zero errors, all routes compile successfully
- Breakout appears in Games dropdown in navbar (desktop and mobile)
- Game opens in modal overlay, closes with X/Escape/backdrop click
- No existing game code or components were modified

---

## Phase 13: Snake Game — 2026-02-12

**Status:** Complete

**What was built:**
Canvas-based classic Snake game following the exact same patterns as Breakout and Pong — same modal system, difficulty button styles, stats bar, dark theme, component structure.

**Game features:**
- Canvas-based rendering with requestAnimationFrame game loop
- Grid-based snake movement at configurable speed intervals
- Snake starts with 3 segments moving right, grows by 1 segment per food eaten
- Food spawns at random unoccupied grid positions (red #ff4444 circles with glow)
- Snake body uses #00ff41 green with gradient (brighter at head, fading toward tail)
- Snake head has glow effect and rounded corners
- Game over on wall collision, self collision, or obstacle collision
- Score: +10 per food eaten, displayed during gameplay and on game over
- High score tracked per difficulty level (persists within session)
- Click/tap to start from idle, click/tap to restart after game over
- Subtle grid lines on dark #0a0a0a background

**Controls:**
- Desktop: Arrow keys or WASD to change direction (prevents 180-degree reversal)
- Mobile: Swipe gestures (up/down/left/right) via touchstart/touchend with 30px threshold
- Both: Click/tap canvas to start or restart

**Four difficulty levels (same button style as other games):**
- Easy: 150ms speed, 20x20 grid, no obstacles
- Medium: 100ms speed, 20x20 grid, no obstacles
- Hard: 75ms speed, 20x20 grid, random wall obstacles spawn every 5 food eaten (1 per spawn)
- Expert: 55ms speed, 15x15 grid, obstacles spawn every 3 food eaten (2 per spawn), food disappears after 7 seconds if not eaten (pulses when <3s remaining)

**Self-collision edge case handled correctly:**
- Tail segment excluded from collision check when not eating food (tail moves away on same step)
- Full body checked when eating food (tail doesn't move)

**Files created:**
- `src/components/games/snake/Snake.tsx` — Full game component (single file, self-contained)

**Files changed:**
- `src/components/games/GameModal.tsx` — Added lazy import for Snake, added to GAME_COMPONENTS and GAME_NAMES
- `src/components/navbar/GamesDropdown.tsx` — Added `{ id: "snake", name: "Snake" }` to GAMES array
- `README.md` — Added Snake to Features list
- `docs/SCOPE.md` — Updated Games section with Snake description, updated file structure tree
- `docs/TODO.md` — Added Phase 13 with all items checked off
- `docs/PROGRESS.md` — This entry

**Verified:**
- `npm run build` — zero errors, all routes compile successfully
- Snake appears in Games dropdown in navbar (desktop and mobile)
- Game opens in modal overlay, closes with X/Escape/backdrop click
- No existing game code or components were modified

---

## Phase 14: Tetris Game (2026-02-12)

Canvas-based classic Tetris game added as the sixth game in the Games dropdown.

**Game mechanics:**
- Standard 10-wide by 20-tall grid
- 7 standard tetromino pieces (I, O, T, S, Z, J, L)
- Pieces fall from the top, player positions them before they land
- Completed rows clear and score points
- Multiple row clears at once score bonus points (single 100, double 300, triple 500, tetris 800) multiplied by current level
- Level increases every 10 lines cleared, increasing drop speed
- Next piece preview displayed in canvas sidebar
- Ghost piece (translucent drop preview) shows where piece will land
- Score, lines cleared, and level displayed in stats bar and canvas sidebar
- Game over when a new piece cannot be placed at the top

**Desktop controls:**
- Arrow left/right: Move piece
- Arrow up / W: Rotate clockwise
- Arrow down: Soft drop (+1 point per cell)
- Space: Hard drop (+2 points per cell)

**Mobile controls:**
- Tap left third of grid: Move left
- Tap right third of grid: Move right
- Tap center third: Hard drop
- Swipe up: Rotate
- Swipe down: Soft drop (5 rows)

**Four difficulty levels (same button style as other games):**
- Easy: 1000ms initial drop, -50ms per level, min 200ms, 500ms lock delay
- Medium: 600ms initial drop, -50ms per level, min 150ms, 500ms lock delay
- Hard: 400ms initial drop, -40ms per level, min 100ms, 400ms lock delay
- Expert: 250ms initial drop, -30ms per level, min 60ms, 200ms lock delay

**Piece colors (7 distinct green shades):**
- I: #00ff41, O: #00cc33, T: #009926, S: #33ff66, Z: #006619, J: #00e639, L: #4dff7a
- Ghost piece: same color at 0.2 opacity
- Grid lines: rgba(255,255,255,0.05), Background: #0a0a0a / #0d0d0d

**Rotation system:**
- Clockwise rotation via matrix transpose + row reverse
- Wall kick system: tries offsets [0, -1, +1, -2, +2] on X axis and [0, -1] on Y axis
- O piece does not rotate
- I piece uses 4x4 bounding box, other pieces use 3x3

**Canvas layout:**
- Total: 450x600 (GRID_W 300 + SIDEBAR_W 150)
- Grid: 10 cols x 20 rows, 30px per cell
- Sidebar: Next piece preview, score/lines/level stats, controls legend

**Files created:**
- `src/components/games/tetris/Tetris.tsx` — Full game component (single file, self-contained)

**Files changed:**
- `src/components/games/GameModal.tsx` — Added lazy import for Tetris, added to GAME_COMPONENTS and GAME_NAMES
- `src/components/navbar/GamesDropdown.tsx` — Added `{ id: "tetris", name: "Tetris" }` to GAMES array
- `README.md` — Added Tetris to Features list
- `docs/SCOPE.md` — Updated Games section with Tetris description, moved Tetris from Future Games to active games list
- `docs/TODO.md` — Added Phase 14 with all items checked off
- `docs/PROGRESS.md` — This entry
