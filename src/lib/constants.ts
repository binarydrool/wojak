// WOJAK Contract Addresses
export const OG_WOJAK_CONTRACT = "0x5026F006B85729a8b14553FAE6af249aD16c9aaB";
export const OG_UNISWAP_POOL = "0x0f23D49bC92Ec52FF591D091b3e16c937034496e";
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
export const GECKOTERMINAL_EMBED_URL = `https://www.geckoterminal.com/eth/pools/${OG_UNISWAP_POOL}?embed=1&info=0&swaps=0&grayscale=0&light_chart=0`;

// GeckoTerminal TVL chart embed
export const GECKOTERMINAL_TVL_EMBED_URL = `https://www.geckoterminal.com/eth/pools/${OG_UNISWAP_POOL}?embed=1&info=0&swaps=0&grayscale=0&light_chart=0&chart_type=tvl`;

// Uniswap
export const UNISWAP_POOL_URL = `https://app.uniswap.org/explore/pools/ethereum/0x0f23d49bc92ec52ff591d091b3e16c937034496e`;
export const UNISWAP_ADD_LIQUIDITY = "https://app.uniswap.org/positions/create/v3?currencyA=NATIVE&currencyB=0x5026f006b85729a8b14553fae6af249ad16c9aab&chain=ethereum";

// Swap Links
export const COW_SWAP_URL = `https://swap.cow.fi/#/1/swap/ETH/${OG_WOJAK_CONTRACT}`;
export const MATCHA_URL = `https://matcha.xyz/tokens/ethereum/${OG_WOJAK_CONTRACT}`;

// Social Links
export const TWITTER_URL = "https://twitter.com/WojakToken";
export const CTO_TWITTER_URL = "https://twitter.com/wojakcto";
export const TELEGRAM_URL = "https://t.me/Wojakog";

// Token Approval Checker
export const APPROVAL_CHECKER_URL = "https://etherscan.io/tokenapprovalchecker";

// Site Metadata
export const SITE_NAME = "wojak.io";
export const SITE_TAGLINE = "The OG WOJAK — Since April 2023";
export const SITE_DESCRIPTION =
  "Official community website for the original WOJAK token on Ethereum. Dashboard, education hub, and community rally point for OG WOJAK holders.";

// LP Lock Info
export const LP_LOCK_EXPIRY = "Year 2100";

// YouTube Channels
export const YOUTUBE_LOW_BUDGET = "https://www.youtube.com/@LowBudgetStories";
export const YOUTUBE_LORD_WOJAK = "https://www.youtube.com/@lordwojak4034";
