// ── Types ──

export type Suit = "spades" | "hearts" | "diamonds" | "clubs";
export type Difficulty = "beginner" | "advanced" | "expert" | "master";
export type Phase = "preflop" | "flop" | "turn" | "river" | "showdown";
export type PlayerAction = "fold" | "check" | "call" | "raise" | "allin";
export type GameStatus = "idle" | "playing" | "handOver" | "gameOver" | "win";

export interface Card {
  suit: Suit;
  rank: number; // 2-14 (11=J, 12=Q, 13=K, 14=A)
  id: string;
}

export interface Player {
  id: number;
  name: string;
  avatar: string;
  chips: number;
  holeCards: Card[];
  currentBet: number;
  totalBetThisRound: number;
  folded: boolean;
  isAllIn: boolean;
  isHuman: boolean;
  personality: "tight" | "loose" | "balanced";
  lastAction: string;
}

export interface HandResult {
  playerId: number;
  rank: number;      // 1=high card ... 10=royal flush
  rankName: string;
  bestFive: Card[];
  kickers: number[];
}

export interface GameState {
  players: Player[];
  deck: Card[];
  communityCards: Card[];
  pot: number;
  sidePots: { amount: number; eligible: number[] }[];
  phase: Phase;
  status: GameStatus;
  dealerIdx: number;
  currentPlayerIdx: number;
  lastRaiseAmount: number;
  minRaise: number;
  bigBlind: number;
  smallBlind: number;
  revealedCommunity: number; // how many community cards to show
  handMessage: string;
  winnerIds: number[];
  winningCards: string[]; // card IDs of the winning hand
}

// ── Constants ──

const SUITS: Suit[] = ["spades", "hearts", "diamonds", "clubs"];
const SUIT_SYMBOLS: Record<Suit, string> = {
  spades: "\u2660", hearts: "\u2665", diamonds: "\u2666", clubs: "\u2663",
};
const RANK_NAMES: Record<number, string> = {
  2: "2", 3: "3", 4: "4", 5: "5", 6: "6", 7: "7", 8: "8",
  9: "9", 10: "10", 11: "J", 12: "Q", 13: "K", 14: "A",
};

export { SUITS, SUIT_SYMBOLS, RANK_NAMES };

// ── Deck ──

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (let rank = 2; rank <= 14; rank++) {
      deck.push({ suit, rank, id: `${suit}-${rank}` });
    }
  }
  return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const a = [...deck];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Hand Evaluation ──

function groupByRank(cards: Card[]): Map<number, Card[]> {
  const m = new Map<number, Card[]>();
  for (const c of cards) {
    if (!m.has(c.rank)) m.set(c.rank, []);
    m.get(c.rank)!.push(c);
  }
  return m;
}

function isFlush(cards: Card[]): Card[] | null {
  const bySuit = new Map<Suit, Card[]>();
  for (const c of cards) {
    if (!bySuit.has(c.suit)) bySuit.set(c.suit, []);
    bySuit.get(c.suit)!.push(c);
  }
  const suitEntries = Array.from(bySuit.entries());
  for (let i = 0; i < suitEntries.length; i++) {
    const suited = suitEntries[i][1];
    if (suited.length >= 5) {
      return suited.sort((a, b) => b.rank - a.rank).slice(0, 5);
    }
  }
  return null;
}

function findStraight(cards: Card[]): Card[] | null {
  const uniqueMap = new Map<number, Card>();
  for (const c of cards) {
    if (!uniqueMap.has(c.rank)) uniqueMap.set(c.rank, c);
  }
  const uniqueRanks = Array.from(uniqueMap.values()).sort((a, b) => b.rank - a.rank);

  // Check A-2-3-4-5 (wheel)
  const hasAce = uniqueRanks.some(c => c.rank === 14);
  if (hasAce) {
    const wheel = [14, 5, 4, 3, 2];
    const wheelCards: Card[] = [];
    for (const r of wheel) {
      const c = uniqueRanks.find(x => x.rank === r);
      if (c) wheelCards.push(c);
    }
    if (wheelCards.length === 5) {
      return wheelCards;
    }
  }

  for (let i = 0; i <= uniqueRanks.length - 5; i++) {
    const run: Card[] = [uniqueRanks[i]];
    for (let j = i + 1; j < uniqueRanks.length && run.length < 5; j++) {
      if (uniqueRanks[j].rank === run[run.length - 1].rank - 1) {
        run.push(uniqueRanks[j]);
      }
    }
    if (run.length === 5) return run;
  }
  return null;
}

function findStraightFlush(cards: Card[]): Card[] | null {
  const bySuit = new Map<Suit, Card[]>();
  for (const c of cards) {
    if (!bySuit.has(c.suit)) bySuit.set(c.suit, []);
    bySuit.get(c.suit)!.push(c);
  }
  const entries = Array.from(bySuit.entries());
  for (let i = 0; i < entries.length; i++) {
    const suited = entries[i][1];
    if (suited.length >= 5) {
      const sf = findStraight(suited);
      if (sf) return sf;
    }
  }
  return null;
}

export function evaluateHand(holeCards: Card[], communityCards: Card[]): HandResult {
  const all = [...holeCards, ...communityCards];
  const byRank = groupByRank(all);

  const pairs: number[] = [];
  const trips: number[] = [];
  const quads: number[] = [];
  const rankEntries = Array.from(byRank.entries());
  for (let i = 0; i < rankEntries.length; i++) {
    const rank = rankEntries[i][0];
    const cards = rankEntries[i][1];
    if (cards.length === 2) pairs.push(rank);
    if (cards.length === 3) trips.push(rank);
    if (cards.length === 4) quads.push(rank);
  }
  pairs.sort((a, b) => b - a);
  trips.sort((a, b) => b - a);
  quads.sort((a, b) => b - a);

  // Check straight flush / royal flush
  const sf = findStraightFlush(all);
  if (sf) {
    const isRoyal = sf[0].rank === 14 && sf[1].rank === 13;
    return {
      playerId: -1,
      rank: isRoyal ? 10 : 9,
      rankName: isRoyal ? "Royal Flush" : "Straight Flush",
      bestFive: sf,
      kickers: sf.map(c => c.rank),
    };
  }

  // Four of a kind
  if (quads.length > 0) {
    const q = quads[0];
    const quadCards = byRank.get(q)!;
    const kicker = all.filter(c => c.rank !== q).sort((a, b) => b.rank - a.rank)[0];
    return {
      playerId: -1, rank: 8, rankName: "Four of a Kind",
      bestFive: [...quadCards, kicker],
      kickers: [q, kicker.rank],
    };
  }

  // Full house
  if (trips.length > 0 && (pairs.length > 0 || trips.length > 1)) {
    const t = trips[0];
    const tripCards = byRank.get(t)!.slice(0, 3);
    let pairRank = 0;
    if (trips.length > 1) pairRank = trips[1];
    if (pairs.length > 0 && pairs[0] > pairRank) pairRank = pairs[0];
    const pairCards = byRank.get(pairRank)!.slice(0, 2);
    return {
      playerId: -1, rank: 7, rankName: "Full House",
      bestFive: [...tripCards, ...pairCards],
      kickers: [t, pairRank],
    };
  }

  // Flush
  const fl = isFlush(all);
  if (fl) {
    return {
      playerId: -1, rank: 6, rankName: "Flush",
      bestFive: fl,
      kickers: fl.map(c => c.rank),
    };
  }

  // Straight
  const st = findStraight(all);
  if (st) {
    return {
      playerId: -1, rank: 5, rankName: "Straight",
      bestFive: st,
      kickers: [st[0].rank],
    };
  }

  // Three of a kind
  if (trips.length > 0) {
    const t = trips[0];
    const tripCards = byRank.get(t)!.slice(0, 3);
    const kickers = all.filter(c => c.rank !== t).sort((a, b) => b.rank - a.rank).slice(0, 2);
    return {
      playerId: -1, rank: 4, rankName: "Three of a Kind",
      bestFive: [...tripCards, ...kickers],
      kickers: [t, ...kickers.map(c => c.rank)],
    };
  }

  // Two pair
  if (pairs.length >= 2) {
    const p1 = pairs[0], p2 = pairs[1];
    const pair1 = byRank.get(p1)!.slice(0, 2);
    const pair2 = byRank.get(p2)!.slice(0, 2);
    const kicker = all.filter(c => c.rank !== p1 && c.rank !== p2).sort((a, b) => b.rank - a.rank)[0];
    return {
      playerId: -1, rank: 3, rankName: "Two Pair",
      bestFive: [...pair1, ...pair2, kicker],
      kickers: [p1, p2, kicker.rank],
    };
  }

  // One pair
  if (pairs.length === 1) {
    const p = pairs[0];
    const pairCards = byRank.get(p)!.slice(0, 2);
    const kickers = all.filter(c => c.rank !== p).sort((a, b) => b.rank - a.rank).slice(0, 3);
    return {
      playerId: -1, rank: 2, rankName: "Pair",
      bestFive: [...pairCards, ...kickers],
      kickers: [p, ...kickers.map(c => c.rank)],
    };
  }

  // High card
  const sorted = all.sort((a, b) => b.rank - a.rank).slice(0, 5);
  return {
    playerId: -1, rank: 1, rankName: "High Card",
    bestFive: sorted,
    kickers: sorted.map(c => c.rank),
  };
}

export function compareHands(a: HandResult, b: HandResult): number {
  if (a.rank !== b.rank) return a.rank - b.rank;
  for (let i = 0; i < Math.min(a.kickers.length, b.kickers.length); i++) {
    if (a.kickers[i] !== b.kickers[i]) return a.kickers[i] - b.kickers[i];
  }
  return 0;
}

// ── Hand strength estimate (for AI) ──

export function handStrength(holeCards: Card[], communityCards: Card[]): number {
  if (communityCards.length === 0) {
    return preflopStrength(holeCards);
  }
  const result = evaluateHand(holeCards, communityCards);
  // Normalize: 1 (high card) to 10 (royal flush) → 0.0 to 1.0
  let base = (result.rank - 1) / 9;
  // Boost for high kickers
  if (result.kickers.length > 0) {
    base += (result.kickers[0] - 2) / (12 * 20);
  }
  return Math.min(1, base);
}

function preflopStrength(cards: Card[]): number {
  const [a, b] = cards.sort((x, y) => y.rank - x.rank);
  const highRank = a.rank;
  const lowRank = b.rank;
  const suited = a.suit === b.suit;
  const paired = a.rank === b.rank;

  if (paired) {
    if (highRank >= 13) return 0.95; // AA, KK
    if (highRank >= 11) return 0.85; // QQ, JJ
    if (highRank >= 8) return 0.7;
    return 0.55;
  }

  let strength = 0.2;
  if (highRank === 14) strength += 0.25; // Ace high
  else if (highRank >= 12) strength += 0.15;
  else if (highRank >= 10) strength += 0.1;

  if (lowRank >= 10) strength += 0.15;
  else if (lowRank >= 8) strength += 0.08;

  const gap = highRank - lowRank;
  if (gap <= 1) strength += 0.1; // connectors
  else if (gap <= 2) strength += 0.05;

  if (suited) strength += 0.08;

  return Math.min(0.9, strength);
}

// ── AI Decision ──

export interface AIDecision {
  action: PlayerAction;
  raiseAmount?: number;
}

export function getAIDecision(
  player: Player,
  gameState: GameState,
  difficulty: Difficulty
): AIDecision {
  const { communityCards, pot, bigBlind, lastRaiseAmount } = gameState;
  const strength = handStrength(player.holeCards, communityCards);
  const callAmount = getCallAmount(player, gameState);
  const potOdds = callAmount > 0 ? callAmount / (pot + callAmount) : 0;
  const personality = player.personality;

  // Random factor for unpredictability
  const rand = Math.random();

  switch (difficulty) {
    case "beginner":
      return beginnerAI(player, strength, callAmount, potOdds, personality, rand, gameState);
    case "advanced":
      return advancedAI(player, strength, callAmount, potOdds, personality, rand, gameState);
    case "expert":
      return expertAI(player, strength, callAmount, potOdds, personality, rand, gameState);
    case "master":
      return masterAI(player, strength, callAmount, potOdds, personality, rand, gameState);
  }
}

function getCallAmount(player: Player, state: GameState): number {
  const maxBet = Math.max(...state.players.filter(p => !p.folded).map(p => p.currentBet));
  return Math.max(0, maxBet - player.currentBet);
}

function beginnerAI(
  player: Player, strength: number, callAmount: number,
  _potOdds: number, personality: string, rand: number, state: GameState
): AIDecision {
  // Beginner: predictable, rarely bluffs, folds weak, calls too much with mediocre
  if (strength < 0.25) {
    // Weak hand
    if (callAmount === 0) return { action: "check" };
    if (personality === "loose" && rand < 0.3) return { action: "call" };
    return { action: "fold" };
  }
  if (strength < 0.5) {
    // Mediocre - calls too often
    if (callAmount === 0) return { action: "check" };
    if (rand < 0.75) return { action: "call" }; // calls 75% of time
    return { action: "fold" };
  }
  // Decent+ hand
  if (callAmount === 0) {
    if (strength > 0.7 && rand < 0.3) {
      return { action: "raise", raiseAmount: state.bigBlind * 2 };
    }
    return { action: "check" };
  }
  return { action: "call" };
}

function advancedAI(
  player: Player, strength: number, callAmount: number,
  potOdds: number, personality: string, rand: number, state: GameState
): AIDecision {
  // Advanced: basic hand awareness, occasional bluffs, better fold discipline
  if (strength < 0.2) {
    if (callAmount === 0) {
      // Occasional bluff
      if (personality === "loose" && rand < 0.15) {
        return { action: "raise", raiseAmount: state.bigBlind * 2 };
      }
      return { action: "check" };
    }
    if (personality === "loose" && rand < 0.1) return { action: "call" }; // rare bluff call
    return { action: "fold" };
  }
  if (strength < 0.45) {
    if (callAmount === 0) return { action: "check" };
    if (callAmount <= state.bigBlind * 2) return { action: "call" };
    if (rand < 0.4) return { action: "call" };
    return { action: "fold" };
  }
  if (strength < 0.65) {
    if (callAmount === 0) {
      if (rand < 0.3) return { action: "raise", raiseAmount: state.bigBlind * 2 };
      return { action: "check" };
    }
    return { action: "call" };
  }
  // Strong hand
  if (rand < 0.5) {
    const raise = state.bigBlind * (2 + Math.floor(rand * 3));
    return { action: "raise", raiseAmount: raise };
  }
  if (callAmount > 0) return { action: "call" };
  return { action: "raise", raiseAmount: state.bigBlind * 2 };
}

function expertAI(
  player: Player, strength: number, callAmount: number,
  potOdds: number, personality: string, rand: number, state: GameState
): AIDecision {
  // Expert: pot odds aware, position-aware, strategic bluffs, varies style
  const positionBonus = isLatePosition(player, state) ? 0.05 : 0;
  const adjustedStrength = strength + positionBonus;

  if (adjustedStrength < 0.2) {
    if (callAmount === 0) {
      // Strategic bluff from late position
      if (isLatePosition(player, state) && rand < 0.2) {
        return { action: "raise", raiseAmount: state.bigBlind * (2 + Math.floor(rand * 2)) };
      }
      return { action: "check" };
    }
    // Bluff call occasionally
    if (personality === "loose" && rand < 0.08) return { action: "call" };
    return { action: "fold" };
  }

  if (adjustedStrength < 0.4) {
    if (callAmount === 0) {
      if (personality !== "tight" && rand < 0.2) {
        return { action: "raise", raiseAmount: state.bigBlind * 2 };
      }
      return { action: "check" };
    }
    // Use pot odds
    if (potOdds > adjustedStrength) return { action: "fold" };
    return { action: "call" };
  }

  if (adjustedStrength < 0.65) {
    if (callAmount === 0) {
      if (rand < 0.4) return { action: "raise", raiseAmount: state.bigBlind * (2 + Math.floor(rand * 3)) };
      return { action: "check" };
    }
    if (potOdds > adjustedStrength + 0.1) return { action: "fold" };
    return { action: "call" };
  }

  // Strong hand - vary between calling and raising (slow play sometimes)
  if (adjustedStrength > 0.85 && rand < 0.25) {
    // Slow play monster
    if (callAmount === 0) return { action: "check" };
    return { action: "call" };
  }

  const raiseSize = Math.floor(state.pot * (0.5 + rand * 0.75));
  const raise = Math.max(state.bigBlind * 2, raiseSize);
  if (callAmount > 0 && callAmount > player.chips * 0.5 && adjustedStrength < 0.75) {
    return { action: "call" };
  }
  return { action: "raise", raiseAmount: raise };
}

function masterAI(
  player: Player, strength: number, callAmount: number,
  potOdds: number, personality: string, rand: number, state: GameState
): AIDecision {
  // Master: near-optimal, reads betting patterns, aggressive, well-timed bluffs
  const positionBonus = isLatePosition(player, state) ? 0.07 : 0;
  const activePlayers = state.players.filter(p => !p.folded && !p.isAllIn).length;
  const adjustedStrength = strength + positionBonus;

  // Heads-up aggression bonus
  const aggressionBonus = activePlayers <= 2 ? 0.1 : 0;
  const effectiveStrength = adjustedStrength + aggressionBonus;

  if (effectiveStrength < 0.2) {
    if (callAmount === 0) {
      // Calculated bluffs with good sizing
      if (isLatePosition(player, state) && rand < 0.25) {
        const bluffSize = Math.floor(state.pot * (0.6 + rand * 0.4));
        return { action: "raise", raiseAmount: Math.max(state.bigBlind * 2, bluffSize) };
      }
      return { action: "check" };
    }
    // Fold to aggression with weak hand
    return { action: "fold" };
  }

  if (effectiveStrength < 0.4) {
    if (callAmount === 0) {
      // Semi-bluff / probe bet
      if (rand < 0.35) {
        const betSize = Math.floor(state.pot * (0.4 + rand * 0.3));
        return { action: "raise", raiseAmount: Math.max(state.bigBlind * 2, betSize) };
      }
      return { action: "check" };
    }
    // GTO-ish pot odds decision
    if (potOdds > effectiveStrength * 1.1) return { action: "fold" };
    return { action: "call" };
  }

  if (effectiveStrength < 0.7) {
    if (callAmount === 0) {
      const betSize = Math.floor(state.pot * (0.5 + rand * 0.5));
      if (rand < 0.55) return { action: "raise", raiseAmount: Math.max(state.bigBlind * 2, betSize) };
      return { action: "check" };
    }
    if (callAmount > player.chips * 0.6 && effectiveStrength < 0.55) return { action: "fold" };
    return { action: "call" };
  }

  // Strong/Monster hand
  if (effectiveStrength > 0.9 && rand < 0.2 && callAmount === 0) {
    // Trap: check with monster
    return { action: "check" };
  }

  // Value bet aggressively
  const raiseSize = Math.floor(state.pot * (0.65 + rand * 0.85));
  const raise = Math.max(state.bigBlind * 2, raiseSize);

  if (effectiveStrength > 0.85 && player.chips < raise * 2) {
    return { action: "allin" };
  }
  return { action: "raise", raiseAmount: raise };
}

function isLatePosition(player: Player, state: GameState): boolean {
  const active = state.players.filter(p => !p.folded);
  const idx = active.findIndex(p => p.id === player.id);
  return idx >= active.length - 2;
}

// ── Game helpers ──

export function getNextActivePlayer(state: GameState, fromIdx: number): number {
  const n = state.players.length;
  let idx = (fromIdx + 1) % n;
  let count = 0;
  while (count < n) {
    const p = state.players[idx];
    if (!p.folded && !p.isAllIn && p.chips > 0) return idx;
    idx = (idx + 1) % n;
    count++;
  }
  return -1;
}

export function getActivePlayers(state: GameState): Player[] {
  return state.players.filter(p => !p.folded);
}

export function getActiveNonAllInPlayers(state: GameState): Player[] {
  return state.players.filter(p => !p.folded && !p.isAllIn && p.chips > 0);
}

export function isRoundComplete(state: GameState): boolean {
  const active = state.players.filter(p => !p.folded);
  if (active.length <= 1) return true;

  const nonAllIn = active.filter(p => !p.isAllIn && p.chips > 0);
  if (nonAllIn.length <= 1) {
    // All but one are all-in or folded, and bets are matched
    const maxBet = Math.max(...active.map(p => p.currentBet));
    const allMatched = nonAllIn.every(p => p.currentBet === maxBet || p.isAllIn);
    return allMatched;
  }

  const maxBet = Math.max(...active.map(p => p.currentBet));
  return nonAllIn.every(p => p.currentBet === maxBet && p.lastAction !== "");
}

export function calculateSidePots(players: Player[]): { amount: number; eligible: number[] }[] {
  const active = players.filter(p => !p.folded).sort((a, b) => a.totalBetThisRound - b.totalBetThisRound);
  const pots: { amount: number; eligible: number[] }[] = [];
  let processed = 0;

  for (let i = 0; i < active.length; i++) {
    const bet = active[i].totalBetThisRound;
    if (bet <= processed) continue;
    const contribution = bet - processed;
    const eligible = active.filter(p => p.totalBetThisRound >= bet).map(p => p.id);
    // Count all players who contributed at least this much
    let amount = 0;
    for (const p of players) {
      if (p.folded) {
        amount += Math.min(contribution, Math.max(0, p.totalBetThisRound - processed));
      } else {
        amount += Math.min(contribution, Math.max(0, p.totalBetThisRound - processed));
      }
    }
    if (amount > 0) {
      pots.push({ amount, eligible });
    }
    processed = bet;
  }

  return pots;
}
