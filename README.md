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
