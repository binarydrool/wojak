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

## Phase 24 — Spades Game ✓
- [x] Create `src/components/games/spades/Spades.tsx` component
- [x] Classic 4-player Spades: WOJAK (player) + ALLY (AI teammate) vs PEPE 1 + PEPE 2
- [x] Four difficulty levels (Beginner/Advanced/Expert/Master)
- [x] Standard 52-card deck, 13 cards dealt per player
- [x] Bidding phase with clickable number buttons (0-13), AI bids with delay
- [x] Trick-taking with follow-suit rules, spades as trump, spades-broken mechanic
- [x] Valid plays highlighted, invalid cards dimmed
- [x] Tap-to-select then tap-to-confirm card play interface
- [x] Team scoring: 10 pts per bid trick met, 1 pt per overtrick bag, nil bids (100/-100)
- [x] 10-bag penalty (-100 pts), first to 500 wins
- [x] Score panel showing both teams' running scores and bags
- [x] Round-end scorecard summary, game-end result with play again
- [x] AI difficulty scaling: beginner plays simply, master counts cards and coordinates
- [x] Card styling matching other card games: dark bg, green spades/clubs, white hearts/diamonds
- [x] Player positions: bottom (WOJAK), top (ALLY), left (PEPE 1), right (PEPE 2)
- [x] Center trick area with card play animations
- [x] Register in GameModal.tsx (lazy import) and GamesDropdown.tsx (GAMES array)
- [x] Update README.md, SCOPE.md, TODO.md, PROGRESS.md
- [x] Verify `npm run build` — zero errors

---

## Phase 25 — Gin Rummy Game ✓
- [x] Create `src/components/games/ginrummy/GinRummy.tsx` component
- [x] Classic 2-player Gin Rummy: WOJAK (player) vs PEPE (AI opponent)
- [x] Four difficulty levels (Beginner/Advanced/Expert/Master)
- [x] Standard 52-card deck, 10 cards dealt to each player
- [x] Stock pile and discard pile centered between player hands
- [x] Draw from stock or discard pile by clicking/tapping
- [x] Discard by clicking/tapping a card or dragging to discard pile
- [x] Drag to rearrange hand for visual meld grouping
- [x] Mobile: tap to draw, tap to discard, hold and drag to rearrange
- [x] Meld detection: sets (3-4 same rank) and runs (3+ consecutive same suit)
- [x] Knock button activates when deadwood ≤ 10
- [x] Gin detection (0 deadwood) with 25-point bonus
- [x] Layoff phase: after opponent knocks, player can lay off cards on knocker's melds
- [x] Undercut: defender gets 25-point bonus if deadwood ≤ knocker's after layoffs
- [x] Multi-round scoring to 100 points
- [x] Round-end scorecard showing melds, deadwood, points awarded
- [x] Draw round when stock depletes to 2 cards with no knock
- [x] AI difficulty scaling: Beginner draws/discards randomly, Master tracks discards and infers hand
- [x] Card styling matching other card games: dark bg, green spades/clubs, white hearts/diamonds
- [x] WOJAK and PEPE avatars from existing project images
- [x] Register in GameModal.tsx (lazy import) and GamesDropdown.tsx (GAMES array)
- [x] Update README.md, SCOPE.md, TODO.md, PROGRESS.md
- [x] Verify `npm run build` — zero errors

---

## Phase 26 — Blackjack Game ✓
- [x] Create `src/components/games/blackjack/Blackjack.tsx` component
- [x] Classic Blackjack (21): WOJAK (player) vs PEPE (dealer)
- [x] Four difficulty levels (Beginner/Advanced/Expert/Master)
- [x] Difficulty-scaled shoe: 1 deck (Beginner), 2 decks (Advanced), 4 decks (Expert), 6 decks (Master)
- [x] Dealer stands on soft 17 (Beginner/Advanced), hits on soft 17 (Expert/Master)
- [x] Blackjack pays 3:2 (Beginner/Advanced/Expert), 6:5 (Master)
- [x] 1000 starting chips with chip betting UI (10, 25, 50, 100, All In, custom input)
- [x] Deal: player 2 cards face up, dealer 1 up + 1 hole card face down
- [x] Card values: number = face value, J/Q/K = 10, Ace = 1 or 11 auto-calculated
- [x] Player actions: Hit, Stand, Double Down (first two cards only), Split (same rank pair)
- [x] Split creates two separate hands each with own bet, aces split auto-stand
- [x] Double Down doubles bet, draws one card, auto-stands
- [x] Insurance offered when dealer shows Ace (half bet, pays 2:1 if dealer has BJ)
- [x] Dealer reveals hole card and draws until 17+ after player stands
- [x] Push returns bet, bust = automatic loss
- [x] Smooth card deal animation and dealer hole card flip animation
- [x] Live hand total badges (soft hands show both values, BJ/BUST indicators)
- [x] Result display with per-hand outcomes and net chips won/lost
- [x] Game over overlay when chips reach 0 with Play Again option
- [x] Card styling matching other card games: dark bg, green spades/clubs, white hearts/diamonds
- [x] Dark table with green felt-like border, PEPE dealer at top, WOJAK player at bottom
- [x] Action buttons: dark bg, green border/text, green fill on hover
- [x] WOJAK and PEPE avatars from existing project images
- [x] Register in GameModal.tsx (lazy import) and GamesDropdown.tsx (GAMES array)
- [x] Update README.md, SCOPE.md, TODO.md, PROGRESS.md
- [x] Verify `npm run build` — zero errors

---

## Phase 27 — War Game ✓
- [x] Create `src/components/games/war/War.tsx` component
- [x] Classic War card game: WOJAK (player) vs PEPE (AI opponent)
- [x] Four speed modes (Casual/Normal/Fast/Blitz) with same button styling as other games
- [x] Casual: 800ms flip animation, 1200ms pause, 1500ms war pause — dramatic pacing
- [x] Normal: 500ms flip animation, 800ms pause, 1000ms war pause — standard pacing
- [x] Fast: 300ms flip animation, 500ms pause, 600ms war pause — rapid play
- [x] Blitz: 150ms flip animation, 300ms pause, 350ms war pause — instant resolution
- [x] Standard 52-card deck, shuffled and split evenly (26 cards each)
- [x] Each round both players flip top card simultaneously with flip animation
- [x] Higher card wins both cards — Ace high (14), King (13) through 2 (low), suits don't matter
- [x] War triggered on tied ranks: "WAR!" banner with dramatic pulse animation
- [x] War resolution: 3 face-down cards + 1 face-up card each, higher face-up wins all
- [x] Chained wars: if face-up war cards also tie, war process repeats
- [x] Insufficient cards during war: player with fewer than 4 cards loses
- [x] Click/tap Flip button or tap player's deck stack to play each round
- [x] Auto Play toggle: plays rounds automatically with 1-second delay between flips
- [x] Card counts displayed for both players (cards remaining in each deck)
- [x] Battle log showing last 8 flip results with card values, suits, and WIN/LOSE/WAR outcome
- [x] Win screen (WOJAK WINS!) with green glow when opponent runs out of cards
- [x] Loss screen (PEPE WINS!) with red glow when player runs out of cards
- [x] Total rounds played displayed on game over screen with Play Again button
- [x] PEPE at top with avatar, name, card count badge, and face-down deck stack
- [x] WOJAK at bottom with avatar, name, card count badge, and clickable face-down deck stack
- [x] Center battle area with flipped cards side by side, VS divider
- [x] Winning card gets green glow highlight after each flip
- [x] War cards laid out visually: 3 face-down small cards + 1 face-up small card per player
- [x] Card styling matching other card games: dark bg (#0d1117), green (#00ff41) for spades/clubs, white (#ffffff) for hearts/diamonds
- [x] Card backs with green diagonal pattern and "W" logo
- [x] Dark table area with green felt-like border and inner glow
- [x] Flip button: large, centered, green background with glow when active
- [x] WOJAK and PEPE avatars from existing project images (/images/wojak.jpg, /images/pepe1.jpg)
- [x] Fully responsive with mobile tap support
- [x] Register in GameModal.tsx (lazy import) and GamesDropdown.tsx (GAMES array)
- [x] Update README.md, SCOPE.md, TODO.md, PROGRESS.md
- [x] Verify `npm run build` — zero errors

---

## Phase 28 — SkiFree Game ✓
- [x] Create `src/components/games/skifree/SkiFree.tsx` — canvas-based endless downhill skiing/snowboarding game
- [x] Implement WOJAK avatar as player character (circular, green border) with equipment visual (skis or snowboard)
- [x] Implement equipment toggle: Skis (faster top speed, tighter turning, narrower hitbox, two trail lines) vs Snowboard (wider turning, forgiving hitbox, one wide trail)
- [x] Equipment toggle uses same button style as difficulty buttons, disabled during gameplay
- [x] Implement 4 difficulty levels (Easy/Medium/Hard/Expert) with same button style as other games
- [x] Easy: slow base speed (2.5), sparse obstacles, wide gaps, PEPE at 3000m, slow chase
- [x] Medium: medium speed (3.5), moderate obstacles, PEPE at 2000m, medium chase speed
- [x] Hard: fast speed (4.5), dense obstacles, narrow gaps, PEPE at 1500m, fast chase, ice patches that cause sliding
- [x] Expert: very fast speed (5.5), very dense obstacles, PEPE at 1000m, aggressive chase, ice patches, wind gusts pushing player sideways, obstacles shift slightly
- [x] Implement desktop controls: Arrow left/right or A/D to steer, Arrow down/S to speed boost, Arrow up/W to brake
- [x] Implement mobile controls: Touch drag horizontally to steer, tap left side to slow down, tap right side to speed boost
- [x] Implement continuous downhill scrolling with obstacles moving upward
- [x] Implement 5 obstacle types: trees (dark green silhouettes with green snow tips), rocks (dark grey with green tint), moguls (rounded bumps), snow drifts (subtle mounds), ice patches (sliding effect)
- [x] Implement crash animation on obstacle collision: player blinks, green/white particle burst, brief freeze, speed penalty recovery
- [x] Implement 3 bonus item types: speed boosts (green glow circle), jump ramps (green angled shape, launches player over obstacles), coins (gold with $ symbol, +200 score)
- [x] Implement THE ABOMINABLE PEPE chase: PEPE avatar scaled up large (70px) with red/orange danger glow appears after set distance per difficulty
- [x] PEPE gradually gains on player, tracks player horizontally, if caught = game over with "PEPE CAUGHT YOU!" screen
- [x] PEPE gives up after chase duration if player survives, disappears until next trigger
- [x] Implement parallax snow particles (60 particles) falling for atmosphere
- [x] Implement ski/snowboard trails behind player (two thin green lines for skis, one wider green line for snowboard)
- [x] Implement jump mechanic via ramps: player launches upward briefly, shadow on ground, invulnerable while airborne
- [x] Night ski slope theme: dark gradient background (#0d0d0d to #0a0a0a), subtle slope texture lines
- [x] Green (#00ff41) accent throughout: HUD text, tree snow tips, trails, speed boost pickups, ramps
- [x] HUD on canvas: distance (meters), speed (km/h), score (top right), PEPE warning, wind indicator, boost indicator
- [x] Per-difficulty best distance tracking with display in stats bar
- [x] Score based on distance traveled plus bonus coin pickups
- [x] Display distance, speed, score, and best distance in stats bar above canvas
- [x] Canvas 480x700, responsive with width: min(85vw, 480px)
- [x] Register in GameModal.tsx (lazy import) and GamesDropdown.tsx (GAMES array)
- [x] Update README.md (game count to 20, added SkiFree to features), SCOPE.md (added SkiFree description), TODO.md (this phase), PROGRESS.md
- [x] Verify `npm run build` — zero errors

---

## Phase 29 — Games Dropdown Redesign ✓
- [x] Replace single-column dropdown with wide categorized grid panel (4 columns)
- [x] Column 1 — Arcade: Breakout, Pong, Snake, Flappy Bird, Space Invaders, SkiFree, Whack-a-PEPE
- [x] Column 2 — Puzzle: Minesweeper, Tetris, 2048, Simon Says
- [x] Column 3 — Board: Chess, Tic Tac Toe, Connect Four
- [x] Column 4 — Card: Solitaire, Blackjack, War, Texas Hold'em, Spades, Gin Rummy
- [x] Add category-specific inline SVG icons in #00ff41 green (gamepad, puzzle piece, chess pawn, spade)
- [x] Dark panel background (bg-wojak-card) with green border (#009926) and green box-shadow
- [x] Category headers: 11px uppercase, dim green (#00cc33/70), non-interactive labels
- [x] Game hover state: text turns #00ff41 with subtle bg highlight
- [x] Smooth fade-in + slide-down animation (games-dropdown-in CSS keyframes)
- [x] Desktop: hover-triggered, right-aligned, 620px min-width, 4-column grid
- [x] Mobile: click-triggered, 2-column grid within hamburger menu
- [x] All game click handlers unchanged — same openGame(gameId) → GameModal flow
- [x] Outside click and Escape still close dropdown
- [x] Rounded corners (rounded-xl) matching site patterns
- [x] Update README.md, SCOPE.md, TODO.md, PROGRESS.md
- [x] Verify `npm run build` — zero errors

---

## Phase 30 — Swap Widget Enhancement ✓
- [x] Create `/api/gas/route.ts` — fetches ETH gas price from public Ethereum RPCs (LlamaRPC, Ankr, Cloudflare) with 30-second in-memory cache
- [x] Make ETH input field in Sell section fully editable — user types any ETH amount
- [x] Make WOJAK input field in Buy section editable — reverse-calculates ETH from WOJAK amount
- [x] Bidirectional real-time conversion using live WOJAK/ETH prices from CoinGecko via `fetchFormattedStats()`
- [x] Input fields styled with green (#00ff41) focus border glow (`focus-within:border-[#00ff41]/40`), text cursor, selection highlight
- [x] Add rolodex ticker in top-right of Swap header cycling through 3 values every 3.5 seconds:
  - WOJAK price in USD (e.g. "$0.00003133")
  - WOJAK price in ETH (e.g. "0.00000001284 ETH")
  - ETH Gas price in Gwei (e.g. "0.06 Gwei")
- [x] Rolodex uses smooth vertical slide animation (`@keyframes rolodex-up`) — value slides up into place and slides up out
- [x] All ticker text in green (#00ff41) with monospace font
- [x] Gas price refreshes every 45 seconds on client
- [x] "Swap on CoW Swap" button, MEV Protected badge, and Matcha.xyz link all preserved exactly as before
- [x] Buy section label changed to "Buy (estimate)" to clarify estimation-only nature
- [x] Add `rolodex-up` keyframes and `animate-rolodex-up` class to globals.css
- [x] Update README.md, SCOPE.md, TODO.md, PROGRESS.md
- [x] Verify `npm run build` — zero errors, all routes compile including new `/api/gas`

---

## Phase 31 — Bubble Map Visualization ✓
- [x] Create `/api/holders/list/route.ts` — fetches top 100 WOJAK token holders from Ethplorer API (`getTopTokenHolders` endpoint with freekey)
- [x] Implement 30-minute in-memory cache with stale-cache fallback
- [x] Implement realistic mock data fallback (100 holders) if API unavailable
- [x] Create `src/components/dashboard/BubbleMapModal.tsx` — canvas-based interactive bubble map
- [x] Implement force-directed simulation: bubbles attract to center, repel from each other, settle into packed layout
- [x] Implement animated simulation: bubbles fade in and float into position over ~200 simulation steps
- [x] Bubble size proportional to sqrt of token balance (larger balance = larger bubble)
- [x] Green color gradient: brighter green (#00ff41) for top holders, darker green (#006619) for smaller holders
- [x] Radial gradient fill on each bubble with glow effect
- [x] Labels on larger bubbles showing truncated address and supply percentage
- [x] Pan: click and drag (desktop), touch drag (mobile)
- [x] Zoom: scroll wheel (desktop), pinch to zoom (mobile), zoom toward cursor/pinch center
- [x] Hover: bubble grows slightly with brighter glow, shows tooltip with full address, formatted balance, supply %, Etherscan link
- [x] Click bubble: opens wallet on Etherscan in new tab
- [x] Mobile tap: shows tooltip for tapped bubble
- [x] Search bar: search wallet address, highlights and zooms to matching bubble
- [x] Reset View button: returns to default zoom/pan, clears search highlight
- [x] Loading spinner while fetching data
- [x] Empty state if data unavailable
- [x] Footer legend: color gradient, "Size = Token Balance", holder count
- [x] Modal styled to match game modals: dark bg, green accents, X close button, Escape key, backdrop click to close
- [x] Modal size: 95vw × 90vh, max 1400px wide
- [x] Body scroll locked when modal open
- [x] Add "Bubble Map" tab after Volume in ChartSection tab bar
- [x] Tab opens modal overlay (does NOT switch chart view like other tabs)
- [x] Lazy-loaded with React.lazy + Suspense
- [x] Existing chart tabs (Chart, Transactions, TVL, Volume) unchanged
- [x] Update README.md, SCOPE.md, TODO.md, PROGRESS.md
- [x] Verify `npm run build` — zero errors, all routes compile including new `/api/holders/list`

---

## Phase 32 — About Section ✓
- [x] Create `src/components/dashboard/AboutSection.tsx` — compact About strip between hero banner and stats row
- [x] Horizontal layout: Wojak_black.png image on left, text content on right
- [x] "THE OG WOJAK" green tag label with pill styling
- [x] "WOJAK" heading in bold white, matching site heading style
- [x] Subtitle: "The original and very first Wojak memecoin. Since April 2023."
- [x] Brief intro paragraph covering community origins, contract renounced, LP locked, 0% tax
- [x] "I know that feel, bro." tagline in green italic
- [x] Contract address with CA label and CopyButton component
- [x] Inline token stats row: Total Supply (69.42B), Tax (0%), LP Locked (Until 2100), Contract (Renounced) — green values, grey labels
- [x] Subtle green glow around Wojak image, rounded with green border
- [x] Fade-in on scroll via IntersectionObserver
- [x] Responsive: stacks image above text on mobile
- [x] Integrated into `src/app/page.tsx` between ImageReel and HeroStats
- [x] Update README.md, SCOPE.md, TODO.md, PROGRESS.md
- [x] Verify `npm run build` — zero errors

---

## Phase 33 — About & Contract Info Redundancy Cleanup ✓
- [x] Remove "THE OG WOJAK" green pill tag from AboutSection
- [x] Remove CA: contract address line and CopyButton from AboutSection
- [x] Remove token stats row entirely from AboutSection (Total Supply, Tax, LP Locked, Contract)
- [x] Merge "I know that feel, bro." tagline inline with paragraph ending on same line as "We are all Wojak."
- [x] Add Total Supply (69.42B) and Tax (0%) inline stats row to ContractInfo section
- [x] Stats displayed with green values and dim grey labels matching existing ContractInfo styling
- [x] Remove unused CopyButton and OG_WOJAK_CONTRACT imports from AboutSection
- [x] TypeScript compiles with zero errors
- [x] Update README.md, SCOPE.md, TODO.md, PROGRESS.md

---

## Phase 34 — About Section Styling Refinement ✓
- [x] Move "I know that feel, bro." tagline to its own line below the paragraph (no longer inline)
- [x] Keep tagline green italic with small top margin (`mt-2`)
- [x] Remove background card from About section (`bg-wojak-card`, `border`, `rounded-xl`, `p-5/p-6`)
- [x] About section now transparent — blends with page background
- [x] Equalize spacing: About-to-stats gap now matches stats-to-chart gap (both 24px via `py-6`)
- [x] About section changed from `pt-6 pb-2` to `pt-4` (no bottom padding)
- [x] TypeScript compiles with zero errors
- [x] Update SCOPE.md, TODO.md, PROGRESS.md

---

## Phase 35 — Stats Bar & Contract Info Layout ✓
- [x] Reduce HeroStats vertical padding: section `py-6` → `py-3`, card `p-6` → `px-6 py-3`
- [x] Move Total Supply (69.42B) and Tax (0%) inline with "Contract RENOUNCED" badge on same row
- [x] Badge, Total Supply, and Tax separated by vertical dividers (`w-px h-3 bg-wojak-border`)
- [x] Grouped in flex-wrap container for clean mobile stacking
- [x] Removed separate token stats row from ContractInfo
- [x] TypeScript compiles with zero errors
- [x] Update SCOPE.md, TODO.md, PROGRESS.md

---

## Phase 36 — Stats Bar Background Removal ✓
- [x] Remove `bg-wojak-card border border-wojak-border rounded-xl` from HeroStats inner div
- [x] Stats bar now fully transparent — blends with page background
- [x] Text, values, layout, and spacing unchanged
- [x] TypeScript compiles with zero errors
- [x] Update TODO.md, PROGRESS.md

---

## Phase 37 — Homepage Disclaimer ✓
- [x] Add compact disclaimer section at bottom of homepage (`src/app/page.tsx`), below ContractInfo
- [x] Single line: "WOJAK is a memecoin with no intrinsic value. No team. No roadmap. For entertainment only. DYOR — never invest more than you can afford to lose. We know that feel, bro."
- [x] Small dim grey text (11px, `text-gray-600`), centered, transparent background
- [x] "We know that feel, bro." in green italic (`text-[#00ff41]/70`)
- [x] Thin dark grey horizontal divider above disclaimer (`border-t border-gray-800/60`)
- [x] Homepage-only — not in global footer, layout, or other pages
- [x] Update SCOPE.md, TODO.md, PROGRESS.md
- [x] TypeScript compiles with zero errors

---

## Phase 38 — Stats Bar Label Brightness ✓
- [x] Change stats bar label color from `text-gray-500` to `text-gray-400` for better readability
- [x] Add `font-medium` weight to labels for additional contrast
- [x] Values (`text-white`, `font-semibold`) unchanged
- [x] TypeScript compiles with zero errors
- [x] Update TODO.md, PROGRESS.md

---

## Phase 39 — Stats Bar Mobile Fix & About Section Social Icons ✓
- [x] Fix stats bar mobile layout — reduce gap and horizontal padding on mobile so TVL and other stats don't overlap
- [x] Mobile grid: `gap-x-4 gap-y-4 sm:gap-6 px-2 sm:px-6` — desktop layout unchanged (single row, 4 columns)
- [x] Add Telegram and X (Twitter) inline SVG icons next to "WOJAK" heading in AboutSection
- [x] Icons styled white/light grey (text-gray-400), green (#00ff41) on hover with transition
- [x] Telegram links to https://t.me/wojakcoincommunity, X links to https://x.com/wojaboriginal
- [x] Both links open in new tab with proper rel attributes
- [x] Icons responsive: w-5 h-5 mobile, w-6 h-6 on sm+ screens
- [x] Add `TELEGRAM_COMMUNITY_URL` and `X_URL` to constants.ts
- [x] Update README.md, SCOPE.md, TODO.md, PROGRESS.md
- [x] Verify `npm run build` — zero errors

---

## Phase 40 — Footer OG Contract Column Removal ✓
- [x] Remove entire "OG Contract" column from Footer (heading, contract address, CopyButton)
- [x] Remove unused CopyButton and OG_WOJAK_CONTRACT imports from Footer
- [x] Change footer grid from 3 columns (`md:grid-cols-3`) to 2 columns (`md:grid-cols-2`)
- [x] Center remaining columns with `max-w-3xl mx-auto` for even spacing
- [x] Community and Disclaimer columns unchanged in content
- [x] MIT License footer bar unchanged
- [x] Update SCOPE.md, TODO.md, PROGRESS.md
- [x] Verify `npm run build` — zero errors

---

## Phase 41 — Tab Content Mobile Overflow Fix ✓
- [x] Fix tab content container in `ChartSection.tsx` cutting off TVL/Volume/Transactions content on mobile
- [x] Change `h-[320px]` (fixed height on mobile) to `min-h-[320px]` so content can grow on mobile
- [x] Desktop/tablet layout unchanged — `sm:h-[390px]` and `md:h-[460px]` remain fixed
- [x] All tab content (TVL, Volume, Transactions, Bubble Map) benefits from this fix
- [x] Update TODO.md, PROGRESS.md
- [x] Verify `npm run build` — zero errors

---

## Phase 42 — Hero Banner Looping Text Update ✓
- [x] Remove "If it ain't broke, don't fix it." from SUBTITLES array in ImageReel.tsx
- [x] Add "I know that feel, bro." to SUBTITLES array
- [x] Add "The most recognized face on the internet." to SUBTITLES array
- [x] Update modulo to use SUBTITLES.length for dynamic array sizing
- [x] Rotation: "Since April 2023" → "I know that feel, bro." → "The most recognized face on the internet."
- [x] Update PROGRESS.md
- [x] Verify TypeScript compiles — zero errors

---

## Phase 44 — Hero Banner Looping Text Final ✓
- [x] Remove "Since April 2023" from SUBTITLES array in ImageReel.tsx — only 2 phrases remain
- [x] Final SUBTITLES: "I know that feel, bro." and "The most recognized face on the internet."
- [x] Increase rotation interval from 9000ms to 18000ms (18 seconds between swaps)
- [x] Fade transition animation (0.4s opacity) unchanged
- [x] No other components modified
- [x] Update PROGRESS.md
- [x] Verify TypeScript compiles — zero errors

---

## Phase 45 — Hero Banner Loop Reset Fix ✓
- [x] Fix orphaned setTimeout in ImageReel.tsx useEffect causing visible loop reset
- [x] Track fadeTimeout with `let` variable in effect closure
- [x] Clear both setInterval and setTimeout in useEffect cleanup
- [x] Loop now cycles seamlessly: phrase 1 → phrase 2 → phrase 1 forever with no glitch
- [x] 18-second interval and 0.4s fade transition unchanged
- [x] No other components modified
- [x] Update PROGRESS.md
- [x] Verify TypeScript compiles — zero errors

---

## Phase 43 — Chart Tab Inactive Text Brightness ✓
- [x] Change inactive tab text color in ChartSection.tsx from `text-gray-500` to `text-gray-400`
- [x] Applies to both the regular TABS buttons (Chart, Transactions, TVL, Volume) and the Bubble Map button
- [x] Matches HeroStats label brightness (`text-gray-400 font-medium`)
- [x] Active tab (`text-white` + green underline) unchanged
- [x] Hover state (`hover:text-gray-300`) unchanged
- [x] Update PROGRESS.md
- [x] Verify TypeScript compiles — zero errors

---

## Future Additions (Post v1)
- [ ] Find the Pair memory game (crypto meme faces)
- [ ] Holder count historical chart (requires tracking over time)
- [ ] Community Telegram widget or feed
- [ ] Governance / community voting section
- [ ] NFT gallery for WOJAK-related NFTs
- [ ] Multi-language support
- [ ] Blog / news section for community updates
