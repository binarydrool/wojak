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

## Phase 13: Snake Game
- [x] Create `src/components/games/snake/Snake.tsx` — canvas-based classic Snake game
- [x] Implement 4 difficulty levels (Easy/Medium/Hard/Expert) with same button style as other games
- [x] Implement desktop controls: Arrow keys and WASD to change direction
- [x] Implement mobile controls: Swipe gestures (swipe up/down/left/right) via touch events
- [x] Implement snake movement on grid, food spawning, snake growth on eating
- [x] Implement game over on wall collision, self collision, and obstacle collision
- [x] Implement score tracking (+10 per food) and per-difficulty high score
- [x] Hard mode: random wall obstacles spawn every 5 food eaten
- [x] Expert mode: smaller grid (15x15), faster speed, more obstacles (2 per 3 food), food disappears after 7 seconds
- [x] Snake body uses #00ff41 green with gradient, food uses #ff4444 red, dark background #0a0a0a
- [x] Register in GameModal.tsx (lazy import) and GamesDropdown.tsx (GAMES array)
- [x] Update README.md, SCOPE.md, TODO.md, PROGRESS.md
- [x] Verify `npm run build` — zero errors

---

## Phase 14: Tetris Game
- [x] Create `src/components/games/tetris/Tetris.tsx` — canvas-based classic Tetris game
- [x] Implement 4 difficulty levels (Easy/Medium/Hard/Expert) with same button style as other games
- [x] Implement 10x20 grid with 7 standard tetromino pieces (I, O, T, S, Z, J, L)
- [x] Implement piece rotation with wall kick system
- [x] Implement ghost piece (drop preview) with translucent rendering
- [x] Implement next piece preview in canvas sidebar
- [x] Implement desktop controls: Arrow left/right to move, up/W to rotate, down to soft drop, space to hard drop
- [x] Implement mobile controls: Tap left/right side to move, swipe up to rotate, swipe down to soft drop, tap center to hard drop
- [x] Implement line clear scoring with combo bonuses (single 100, double 300, triple 500, tetris 800) multiplied by level
- [x] Implement level progression (level up every 10 lines, increasing drop speed)
- [x] Implement lock delay system (configurable per difficulty)
- [x] Use 7 distinct green shades for pieces (#00ff41, #00cc33, #009926, #006619, #33ff66, #00e639, #4dff7a)
- [x] Display score, lines cleared, and current level in stats bar and canvas sidebar
- [x] Register in GameModal.tsx (lazy import) and GamesDropdown.tsx (GAMES array)
- [x] Update README.md, SCOPE.md, TODO.md, PROGRESS.md

---

## Phase 15: Connect Four Game
- [x] Create `src/components/games/connectfour/ConnectFour.tsx` — classic Connect Four vs AI (WOJAK vs PEPE)
- [x] Implement 7-column by 6-row grid with piece drop animations
- [x] Implement 4 difficulty levels (Beginner/Advanced/Expert/Master) with same button style as other games
- [x] Beginner: AI picks randomly, occasionally blocks obvious wins
- [x] Advanced: AI blocks player wins, takes winning moves, uses board evaluation
- [x] Expert: AI uses minimax with alpha-beta pruning, depth 4
- [x] Master: AI uses minimax with alpha-beta pruning, depth 6, center column preference
- [x] Display WOJAK (#00ff41 green) and PEPE (#ff4444 red) avatars with names matching Chess/Pong pattern
- [x] Highlight winning 4 pieces with glow animation when someone wins
- [x] Display win/loss/draw result overlay with Play Again button
- [x] Responsive board with hover column indicators, mobile tap support
- [x] Register in GameModal.tsx (lazy import) and GamesDropdown.tsx (GAMES array)
- [x] Update README.md, SCOPE.md, TODO.md, PROGRESS.md
- [x] Verify `npm run build` — zero errors

---

## Phase 16: 2048 Game
- [x] Create `src/components/games/twentyfortyeight/TwentyFortyEight.tsx` — classic 2048 puzzle game
- [x] Implement 4x4 grid with sliding and merging tile mechanics
- [x] Implement 4 difficulty levels (Easy/Medium/Hard/Expert) with same button style as other games
- [x] Easy: 4x4 grid, 90% chance of 2 spawn, 10% chance of 4
- [x] Medium: 4x4 grid, 80% chance of 2, 20% chance of 4
- [x] Hard: 4x4 grid, 60% chance of 2, 40% chance of 4, occasional 8 spawns
- [x] Expert: 5x5 grid, 50/50 split of 2s and 4s, 4096 win target
- [x] Implement desktop controls: Arrow keys and WASD to slide tiles
- [x] Implement mobile controls: Swipe gestures (up/down/left/right) via touch events
- [x] Implement tile merge animations (pop on merge, scale-in on spawn)
- [x] Implement score tracking with current score and best score display
- [x] Implement undo button (1 move back) and new game button
- [x] Win condition: reach 2048 tile (4096 on Expert), show congratulations, allow continuing
- [x] Game over detection: no valid moves remaining
- [x] Green-themed tile colors as gradient based on value (dark #1a2e1a for 2 → bright #00ff41 for 2048)
- [x] Register in GameModal.tsx (lazy import) and GamesDropdown.tsx (GAMES array)
- [x] Update README.md, SCOPE.md, TODO.md, PROGRESS.md
- [x] Verify `npm run build` — zero errors

---

## Phase 17: Tic Tac Toe Game
- [x] Create `src/components/games/tictactoe/TicTacToe.tsx` — classic Tic Tac Toe vs AI (WOJAK vs PEPE)
- [x] Implement 3x3 grid with SVG X and O marks
- [x] Implement 4 difficulty levels (Beginner/Advanced/Expert/Master) with same button style as other games
- [x] Beginner: AI picks randomly from available cells
- [x] Advanced: AI blocks player wins, takes winning moves, prefers center and corners
- [x] Expert: AI uses minimax but 15% chance of random move
- [x] Master: AI uses full minimax with alpha-beta pruning, unbeatable
- [x] Display WOJAK (#00ff41 green X) and PEPE (#ff4444 red O) avatars with names matching Chess/Pong/Connect Four pattern
- [x] Highlight winning 3 cells with glow animation when someone wins
- [x] Display win/loss/draw result overlay with Play Again button
- [x] Track and display series score (WOJAK wins, PEPE wins, Draws) persisting across rounds
- [x] Series score resets on difficulty change or modal close
- [x] AI responds after 300-500ms natural delay
- [x] Responsive board with hover highlight, mobile tap support
- [x] Register in GameModal.tsx (lazy import) and GamesDropdown.tsx (GAMES array)
- [x] Update README.md, SCOPE.md, TODO.md, PROGRESS.md
- [x] Verify `npm run build` — zero errors

---

## Phase 18: Flappy Bird Game
- [x] Create `src/components/games/flappybird/FlappyBird.tsx` — canvas-based Flappy Bird clone with WOJAK avatar as bird
- [x] Implement 4 difficulty levels (Easy/Medium/Hard/Expert) with same button style as other games
- [x] Implement bird gravity and flap physics (click, tap, or spacebar to flap)
- [x] Implement green pipes (#00ff41) scrolling right-to-left with random gap positions and pipe caps
- [x] Implement collision detection for pipes, floor, and ceiling
- [x] Implement score tracking (+1 per pipe passed) and per-difficulty best score
- [x] Implement WOJAK avatar as circular bird sprite with green border and velocity-based tilt rotation
- [x] Implement ground strip at bottom with scrolling pattern and green top line
- [x] Easy: large gap (180px), slow speed (2px/frame), light gravity (0.35)
- [x] Medium: standard gap (150px), medium speed (2.8px/frame), normal gravity (0.45)
- [x] Hard: smaller gap (125px), fast speed (3.5px/frame), heavier gravity (0.55)
- [x] Expert: very small gap (115px), fast speed (4px/frame), heavy gravity (0.6), pipes oscillate vertically
- [x] Register in GameModal.tsx (lazy import) and GamesDropdown.tsx (GAMES array)
- [x] Update README.md, SCOPE.md, TODO.md, PROGRESS.md
- [x] Verify `npm run build` — zero errors

---

## Phase 19: Simon Says Game
- [x] Create `src/components/games/simonsays/SimonSays.tsx` — classic Simon Says memory pattern game
- [x] Implement 4 colored buttons in 2x2 grid using green palette (#00ff41, #009926, #006619, #33ff66)
- [x] Implement Web Audio API oscillator tones — each button plays a distinct pitch (E4, C4, A3, G4)
- [x] Implement sequence playback with glow/pulse animations and sound
- [x] Implement player input phase — click/tap buttons to repeat the sequence
- [x] Implement round progression — each correct sequence adds one more step
- [x] Implement game over on wrong button — show round reached, best score, play again
- [x] Implement 4 difficulty levels (Easy/Medium/Hard/Expert) with same button style as other games
- [x] Easy: 800ms flash duration, 300ms pause between flashes
- [x] Medium: 600ms flash duration, 250ms pause
- [x] Hard: 400ms flash duration, 200ms pause
- [x] Expert: 300ms flash duration, 150ms pause, 5th button added after round 10
- [x] Display round number, best score, and status (Ready/Watch/Your turn/Game Over) in stats bar
- [x] Responsive design with mobile tap support
- [x] Register in GameModal.tsx (lazy import) and GamesDropdown.tsx (GAMES array)
- [x] Update README.md, SCOPE.md, TODO.md, PROGRESS.md
- [x] Verify `npm run build` — zero errors

---

## Phase 20: Whack-a-PEPE Game
- [x] Create `src/components/games/whackamole/WhackAMole.tsx` — Whack-a-Mole themed as "Whack-a-PEPE"
- [x] Implement 3x3 grid of holes with dark oval styling and depth shadows
- [x] Implement PEPE avatar popping up from random holes with smooth slide-up animation
- [x] Implement click/tap to whack PEPE — bonk squish animation on hit, slide back down on miss
- [x] Implement 30-second timed rounds with visible countdown timer
- [x] Implement score tracking (+1 per PEPE whacked) and per-difficulty best score
- [x] Implement 4 difficulty levels (Easy/Medium/Hard/Expert) with same button style as other games
- [x] Easy: 1500ms pop-up duration, 1 PEPE at a time, 1200ms spawn interval
- [x] Medium: 1000ms pop-up, up to 2 PEPEs at once, 900ms spawn interval
- [x] Hard: 700ms pop-up, up to 3 PEPEs, 700ms spawn interval, occasional WOJAK decoy (-1 point)
- [x] Expert: 500ms pop-up, up to 4 PEPEs, 500ms spawn interval, frequent WOJAK decoys (-2 points)
- [x] Display score, timer, and best score in stats bar using green accent (#00ff41)
- [x] Game over screen with final score, best score indicator, and Play Again button
- [x] Desktop click and mobile tap both fully supported
- [x] Register in GameModal.tsx (lazy import) and GamesDropdown.tsx (GAMES array)
- [x] Update README.md, SCOPE.md, TODO.md, PROGRESS.md
- [x] Verify `npm run build` — zero errors

---

## Phase 21: Space Invaders Game
- [x] Create `src/components/games/spaceinvaders/SpaceInvaders.tsx` — canvas-based classic Space Invaders game
- [x] Implement WOJAK avatar as player ship (circular, green border) at bottom of screen
- [x] Implement PEPE avatar invaders arranged in rows at top of screen
- [x] Implement desktop controls: Arrow left/right or A/D to move ship, spacebar to shoot
- [x] Implement mobile controls: Touch drag to move ship, fire button or 2nd finger tap to shoot
- [x] Implement invader group movement: side-to-side, drop down on reaching wall edge
- [x] Implement invader random shooting with difficulty-scaled fire rate
- [x] Implement player shooting with green (#00ff41) projectiles upward
- [x] Implement enemy shooting with orange (#ff6b35) projectiles downward
- [x] Implement collision detection: player bullets vs invaders, enemy bullets vs player
- [x] Implement 3 lives system with invincibility frames after hit (player blinks)
- [x] Implement game over if all lives lost or invaders reach player row
- [x] Implement wave progression: all invaders destroyed = advance to next wave
- [x] Implement score tracking (+10 per invader, +5 boss damage, +50 boss kill) and per-difficulty best score
- [x] Implement explosion effects (green particle burst) on invader destruction
- [x] Implement 4 difficulty levels (Easy/Medium/Hard/Expert) with same button style as other games
- [x] Easy: 3 rows of 6 invaders, slow movement and fire rate, slow projectiles
- [x] Medium: 4 rows of 8 invaders, medium movement and fire rate
- [x] Hard: 5 rows of 8 invaders, fast movement, frequent invader fire, fast projectiles
- [x] Expert: 5 rows of 10 invaders, very fast, aggressive fire, invaders speed up as numbers thin, boss PEPE with multi-hit HP bar
- [x] Display score, lives, wave, and best score in stats bar using green accent
- [x] Register in GameModal.tsx (lazy import) and GamesDropdown.tsx (GAMES array)
- [x] Update README.md, SCOPE.md, TODO.md, PROGRESS.md
- [x] Verify `npm run build` — zero errors

---

## Phase 22: Solitaire Game
- [x] Create `src/components/games/solitaire/Solitaire.tsx` — Classic Klondike Solitaire card game
- [x] Implement standard 52-card deck with shuffling
- [x] Implement 7 tableau columns dealt in standard pattern (column N has N cards, top face-up, rest face-down)
- [x] Implement stock pile — click to draw cards to waste pile
- [x] Implement waste pile — shows drawn cards, top card is playable
- [x] Implement 4 foundation piles — build up by suit from Ace to King
- [x] Implement tableau building — descending rank, alternating colors
- [x] Implement click-to-select then click-destination card movement
- [x] Implement double-click to auto-send card to correct foundation
- [x] Implement move validation — only allow legal moves
- [x] Implement moving single cards and face-up stacks between tableau columns
- [x] Implement auto-flip of exposed face-down cards
- [x] Implement win condition — all 52 cards in foundations with celebration overlay
- [x] Implement undo button (restores previous game state)
- [x] Implement new deal button to restart
- [x] Implement move counter and timer display
- [x] Implement two draw modes using same button style as other games: Draw 1 (easier) and Draw 3 (classic)
- [x] Draw 1: Draw one card at a time from stock to waste
- [x] Draw 3: Draw three cards at a time, only top card playable
- [x] Card styling: dark background (#0d1117) with green suit symbols (#00ff41 for black suits, #33ff66 for red suits)
- [x] Card backs: dark with subtle green pattern and "W" logo
- [x] Empty slots: dashed green border placeholders
- [x] Mobile support: tap-to-select, tap-destination interface, double-tap auto-send
- [x] Register in GameModal.tsx (lazy import) and GamesDropdown.tsx (GAMES array)
- [x] Update README.md, SCOPE.md, TODO.md, PROGRESS.md
- [x] Verify `npm run build` — zero errors

---

## Phase 23: Texas Hold'em Game
- [x] Create `src/components/games/texasholdem/pokerLogic.ts` — poker hand evaluation, AI decision engine, game helpers
- [x] Create `src/components/games/texasholdem/TexasHoldem.tsx` — Texas Hold'em Poker (WOJAK vs 3 PEPE AI opponents)
- [x] Implement standard 52-card deck with Texas Hold'em dealing (2 hole cards per player, 5 community cards)
- [x] Implement 4 difficulty levels (Beginner/Advanced/Expert/Master) with same button style as other games
- [x] Beginner: AI plays predictably, rarely bluffs, folds weak hands, calls too often with mediocre hands
- [x] Advanced: AI has basic hand strength awareness, occasional bluffs, better fold discipline
- [x] Expert: AI evaluates pot odds, position-aware, bluffs strategically, varies play style
- [x] Master: AI plays near-optimally, reads betting patterns, aggressive with strong hands, well-timed bluffs
- [x] Implement AI personalities: tight, loose/aggressive, and balanced across 3 PEPE opponents
- [x] Implement full betting rounds: Pre-flop, Flop, Turn, River with proper blind rotation
- [x] Implement player actions: Fold, Check, Call, Raise, All-In with raise slider and quick presets (Min/2x/3x/Pot)
- [x] Implement hand evaluation: high card through royal flush with proper kicker comparison
- [x] Implement showdown with winning hand name display and winning card highlighting
- [x] Implement pot distribution with animation, side pot calculation
- [x] Implement game over (player loses all chips) and win screen (all PEPEs eliminated)
- [x] Card styling matching Solitaire: dark background, green for spades/clubs, white for hearts/diamonds, green borders
- [x] Dark table felt with green border/glow, green chip display
- [x] Display WOJAK and PEPE avatars with chip counts, dealer button rotation
- [x] Responsive design with mobile tap support
- [x] Register in GameModal.tsx (lazy import) and GamesDropdown.tsx (GAMES array)
- [x] Update README.md, SCOPE.md, TODO.md
- [x] Verify `npm run build` — zero errors

---

## Future Additions (Post v1)
- [ ] Find the Pair memory game (crypto meme faces)
- [ ] Holder count historical chart (requires tracking over time)
- [ ] Community Telegram widget or feed
- [ ] Governance / community voting section
- [ ] NFT gallery for WOJAK-related NFTs
- [ ] Multi-language support
- [ ] Blog / news section for community updates
