// WOJAK Contract Addresses
export const OG_WOJAK_CONTRACT = "0x8De39B057CC6522230AB19C0205080a8663331Ef";
export const OG_UNISWAP_POOL = "0xcaA3A16F8440F85303aFaab1992f2b97D12469B1";
export const CTO_CONTRACT = "0x8De39B057CC6522230AB19C0205080a8663331Ef";

// Etherscan
export const ETHERSCAN_BASE_URL = "https://etherscan.io";
export const ETHERSCAN_API_BASE = "https://api.etherscan.io/api";
export const ETHERSCAN_TOKEN_URL = `${ETHERSCAN_BASE_URL}/token/${OG_WOJAK_CONTRACT}`;
export const ETHERSCAN_POOL_URL = `${ETHERSCAN_BASE_URL}/address/${OG_UNISWAP_POOL}`;

// DexTools
export const DEXTOOLS_URL = `https://www.dextools.io/app/en/ether/pair-explorer/${OG_WOJAK_CONTRACT}`;

// DexTools widget embed — chart only
export const DEXTOOLS_EMBED_URL = `https://www.dextools.io/widget-chart/en/ether/pe-light/${OG_WOJAK_CONTRACT}?theme=dark&chartType=2&chartResolution=30&drawingToolbars=false`;

// GeckoTerminal embed — fallback if DexTools doesn't load
export const GECKOTERMINAL_EMBED_URL = `https://www.geckoterminal.com/eth/pools/${OG_UNISWAP_POOL}?embed=1&info=0&swaps=0&grayscale=0&light_chart=0&currency=token`;

// GeckoTerminal TVL chart embed
export const GECKOTERMINAL_TVL_EMBED_URL = `https://www.geckoterminal.com/eth/pools/${OG_UNISWAP_POOL}?embed=1&info=0&swaps=0&grayscale=0&light_chart=0&chart_type=tvl`;

// Uniswap
export const UNISWAP_POOL_URL = `https://app.uniswap.org/explore/pools/ethereum/0xcaa3a16f8440f85303afaab1992f2b97d12469b1`;
export const UNISWAP_ADD_LIQUIDITY = "https://app.uniswap.org/positions/create/v3?currencyA=NATIVE&currencyB=0x8de39b057cc6522230ab19c0205080a8663331ef&chain=ethereum";

// Swap Links (legacy — kept for reference)
export const COW_SWAP_URL = `https://swap.cow.fi/#/1/swap/ETH/${OG_WOJAK_CONTRACT}`;
export const MATCHA_URL = `https://matcha.xyz/tokens/ethereum/${OG_WOJAK_CONTRACT}`;

// Uniswap V2 Router + WETH (for on-chain swaps)
export const UNISWAP_V2_ROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
export const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

// Social Links
export const TWITTER_URL = "https://x.com/Wojakcto";
export const CTO_TWITTER_URL = "https://x.com/Wojakcto";
export const TELEGRAM_URL = "https://t.me/wojakctoeth";
export const TELEGRAM_COMMUNITY_URL = "https://t.me/wojakctoeth";
export const X_URL = "https://x.com/Wojakcto";

// Token Approval Checker
export const APPROVAL_CHECKER_URL = "https://etherscan.io/tokenapprovalchecker";

// Shared timing — used by SwapCard rolodex ticker and PriceStatsCard toggle
export const TICKER_INTERVAL = 7000;

// Site Metadata
export const SITE_NAME = "WOJAK Stats";
export const SITE_TAGLINE = "WOJAK";
export const SITE_DESCRIPTION =
  "Official community website for the original WOJAK token on Ethereum. Dashboard, education hub, and community rally point for OG WOJAK holders.";

// LP Lock Info

// YouTube Channels
export const YOUTUBE_LOW_BUDGET = "https://www.youtube.com/@LowBudgetStories";
export const YOUTUBE_LORD_WOJAK = "https://www.youtube.com/@lordwojak4034";
