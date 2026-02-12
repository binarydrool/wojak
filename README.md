# wojak.io

**The OG WOJAK — Since April 2023**

Official community website for the original WOJAK token on Ethereum. Dashboard, education hub, migration analysis, and games for 14,000+ OG WOJAK holders.

## About

wojak.io serves the holders of the original WOJAK token (`0x5026F006B85729a8b14553FAE6af249aD16c9aaB`) on Ethereum. The site exists to provide a legitimate home for the OG community and counter a hostile CTO migration attempt.

## Features

- **Dashboard** — Live DexTools/GeckoTerminal price chart, token stats (market cap, TVL, volume, holders) via CoinGecko API, recent trades feed, and an embedded CoW Swap widget for buying WOJAK with MEV protection
- **Crypto 101** — Plain-language education hub with 8 collapsible sections covering wallets, private keys, buying ETH, swapping tokens, reading Etherscan, liquidity, token safety, and revoking approvals
- **Migration Report** — Full analysis of the hostile CTO migration attempt with side-by-side contract comparison, red flags, and action items for the community
- **Minesweeper** — Classic minesweeper game with Wojak-themed expressions, three difficulty levels (Easy/Medium/Hard), timer, and mobile touch support. Launches from the navbar Games dropdown in a full-screen modal
- **Chess** — Full chess game with AI opponent, four difficulty levels (Beginner/Advanced/Expert/Master), drag-and-drop and click-to-move, dark/light board themes
- **Breakout** — Canvas-based brick breaker game with four difficulty levels (Easy/Medium/Hard/Expert), mouse and touch controls, multi-hit bricks with green-themed colors, 3 lives system
- **Pong** — Canvas-based Pong game vs AI opponent (WOJAK vs PEPE), four difficulty levels (Beginner/Advanced/Expert/Master), mouse and touch controls, first to 5 wins
- **Snake** — Canvas-based classic Snake game, four difficulty levels (Easy/Medium/Hard/Expert), arrow keys/WASD and swipe controls, score and high score tracking, random wall obstacles on Hard/Expert, disappearing food on Expert
- **Tetris** — Canvas-based classic Tetris game, four difficulty levels (Easy/Medium/Hard/Expert), 7 standard tetrominoes with green-themed colors, ghost piece preview, next piece display, arrow keys and touch controls, line clear scoring with combo bonuses, level progression
- **Connect Four** — Classic Connect Four game vs AI opponent (WOJAK vs PEPE), four difficulty levels (Beginner/Advanced/Expert/Master), 7x6 grid with piece drop animations, minimax AI with alpha-beta pruning, winning line highlighting, click/tap controls, responsive design
- **2048** — Classic 2048 puzzle game, four difficulty levels (Easy/Medium/Hard/Expert), slide tiles with arrow keys/WASD or swipe gestures, merge matching numbers to reach 2048, green-themed tile gradient, score tracking with best score, undo support, Expert mode features 5x5 grid and 4096 target
- **Tic Tac Toe** — Classic Tic Tac Toe vs AI opponent (WOJAK vs PEPE), four difficulty levels (Beginner/Advanced/Expert/Master), 3x3 grid with SVG X and O marks, minimax AI (unbeatable on Master), winning line glow animation, series score tracking, click/tap controls, responsive design
- **Flappy Bird** — Canvas-based Flappy Bird clone with WOJAK avatar as the bird, four difficulty levels (Easy/Medium/Hard/Expert), click/tap/spacebar to flap, green pipes with random gap positions, score and best score tracking, Expert mode features pipes that oscillate vertically
- **Simon Says** — Classic Simon Says memory pattern game, four difficulty levels (Easy/Medium/Hard/Expert), 4 colored buttons using green palette with distinct tones via Web Audio API, watch the sequence then repeat it, each round adds one more step, glow/pulse animations on active buttons, round and best score tracking, Expert mode adds a 5th button after round 10
- **Whack-a-PEPE** — Whack-a-Mole game themed as "Whack-a-PEPE", four difficulty levels (Easy/Medium/Hard/Expert), 3x3 grid of holes where PEPE pops up to be whacked, 30-second timed rounds, click/tap to whack with bonk animation, score tracking with per-difficulty best scores, Hard/Expert modes add WOJAK decoys that cost points if whacked, multiple simultaneous PEPEs at higher difficulties
- **Space Invaders** — Canvas-based classic Space Invaders with WOJAK ship and PEPE invaders, four difficulty levels (Easy/Medium/Hard/Expert), arrow keys/A,D to move and spacebar to shoot on desktop, touch drag and fire button on mobile, rows of PEPE invaders move side-to-side and drop down, invaders shoot back, 3 lives, wave progression, score tracking with per-difficulty best score, Expert mode adds a boss PEPE that takes multiple hits
- **Solitaire** — Classic Klondike Solitaire with two draw modes (Draw 1/Draw 3), 7 tableau columns, 4 foundation piles built by suit from Ace to King, click-to-select and click-destination to move, double-click to auto-send to foundation, undo support, move counter and timer, dark-themed cards with green suit symbols, mobile tap-tap interface, win animation with play again option

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Deployment:** Vercel (hobby tier, public repo)
- **Swap Widget:** CoW Swap iframe embed (MEV-protected swaps)
- **Charts:** DexTools widget / GeckoTerminal embed (fallback)
- **Data:** CoinGecko + GeckoTerminal APIs, Etherscan free API (client-side only, no backend)

## Getting Started

1. Clone the repo:
   ```bash
   git clone https://github.com/YOUR-USERNAME/wojak-finance.git
   cd wojak-finance
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create your environment file:
   ```bash
   cp .env.example .env.local
   ```
   Add your [free Etherscan API key](https://etherscan.io/apis) to `.env.local`:
   ```
   NEXT_PUBLIC_ETHERSCAN_API_KEY=your_key_here
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

## OG WOJAK Contract

| | Details |
|---|---|
| **Contract Address** | `0x5026F006B85729a8b14553FAE6af249aD16c9aaB` |
| **Uniswap V2 Pool** | `0x0f23D49bC92Ec52FF591D091b3e16c937034496e` |
| **LP Lock** | Locked until year 2100 |
| **Contract Status** | Renounced — no admin functions |
| **Chain** | Ethereum Mainnet |

## Community

- **Twitter:** [@WojakToken](https://twitter.com/WojakToken)
- **Etherscan:** [View Token](https://etherscan.io/token/0x5026F006B85729a8b14553FAE6af249aD16c9aaB)
- **DexTools:** [View Chart](https://www.dextools.io/app/en/ether/pair-explorer/0x5026F006B85729a8b14553FAE6af249aD16c9aaB)

## License

MIT — see [LICENSE](LICENSE).

---

*DYOR. Verify everything on-chain. The blockchain doesn't lie.*
