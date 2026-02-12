"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// ── Types ──

type Suit = "spades" | "hearts" | "diamonds" | "clubs";
type Difficulty = "beginner" | "advanced" | "expert" | "master";
type GamePhase = "difficulty" | "bidding" | "playing" | "roundEnd" | "gameOver";

interface Card {
  suit: Suit;
  rank: number; // 2-14 (11=J, 12=Q, 13=K, 14=A)
  id: string;
}

interface SpadesPlayer {
  id: number;
  name: string;
  avatar: string;
  hand: Card[];
  bid: number;
  tricks: number;
  isHuman: boolean;
  position: "bottom" | "top" | "left" | "right";
}

interface TeamScore {
  score: number;
  bags: number;
}

interface TrickCard {
  playerId: number;
  card: Card;
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

const GREEN = "#00ff41";
const WHITE = "#ffffff";

const WOJAK_AVATAR = "/images/wojak.jpg";
const PEPE_AVATARS = ["/images/pepe1.jpg", "/images/pepe2.jpg"];

const DIFFICULTIES: { key: Difficulty; label: string }[] = [
  { key: "beginner", label: "Beginner" },
  { key: "advanced", label: "Advanced" },
  { key: "expert", label: "Expert" },
  { key: "master", label: "Master" },
];

const WINNING_SCORE = 500;

// ── Helpers ──

function isRedSuit(suit: Suit): boolean {
  return suit === "hearts" || suit === "diamonds";
}

function cardColor(suit: Suit): string {
  return isRedSuit(suit) ? WHITE : GREEN;
}

function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (let rank = 2; rank <= 14; rank++) {
      deck.push({ suit, rank, id: `${suit}-${rank}` });
    }
  }
  return deck;
}

function shuffleDeck(deck: Card[]): Card[] {
  const a = [...deck];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function sortHand(hand: Card[]): Card[] {
  const suitOrder: Record<Suit, number> = { spades: 0, hearts: 1, diamonds: 2, clubs: 3 };
  return [...hand].sort((a, b) => {
    if (suitOrder[a.suit] !== suitOrder[b.suit]) return suitOrder[a.suit] - suitOrder[b.suit];
    return b.rank - a.rank;
  });
}

function cardValue(card: Card): number {
  return card.rank;
}

function getWinnerOfTrick(trick: TrickCard[], leadSuit: Suit): number {
  let winnerIdx = 0;
  let winnerCard = trick[0].card;
  for (let i = 1; i < trick.length; i++) {
    const c = trick[i].card;
    const wIsSpade = winnerCard.suit === "spades";
    const cIsSpade = c.suit === "spades";
    if (cIsSpade && !wIsSpade) {
      winnerIdx = i;
      winnerCard = c;
    } else if (cIsSpade && wIsSpade && cardValue(c) > cardValue(winnerCard)) {
      winnerIdx = i;
      winnerCard = c;
    } else if (!cIsSpade && !wIsSpade && c.suit === leadSuit && winnerCard.suit === leadSuit && cardValue(c) > cardValue(winnerCard)) {
      winnerIdx = i;
      winnerCard = c;
    }
  }
  return trick[winnerIdx].playerId;
}

function canPlayCard(card: Card, hand: Card[], leadSuit: Suit | null, spadesBroken: boolean, isLeading: boolean): boolean {
  if (isLeading) {
    if (card.suit === "spades" && !spadesBroken) {
      // Can only lead spades if that's all you have
      return hand.every(c => c.suit === "spades");
    }
    return true;
  }
  if (leadSuit === null) return true;
  const hasSuit = hand.some(c => c.suit === leadSuit);
  if (hasSuit) return card.suit === leadSuit;
  return true; // Can play anything if void in lead suit
}

// ── AI Bidding ──

function getAIBid(hand: Card[], difficulty: Difficulty, partnerBid: number | null): number {
  // Count likely tricks
  let tricks = 0;

  // Count by suit
  const bySuit: Record<Suit, Card[]> = { spades: [], hearts: [], diamonds: [], clubs: [] };
  hand.forEach(c => bySuit[c.suit].push(c));
  for (const s of SUITS) bySuit[s].sort((a, b) => b.rank - a.rank);

  // Spades - high spades are almost always tricks
  for (const c of bySuit.spades) {
    if (c.rank >= 12) tricks += 1; // Q, K, A of spades
    else if (c.rank >= 10 && bySuit.spades.length >= 3) tricks += 0.7;
    else if (bySuit.spades.length >= 4) tricks += 0.3;
  }

  // Side suits
  for (const suit of (["hearts", "diamonds", "clubs"] as Suit[])) {
    const cards = bySuit[suit];
    if (cards.length === 0) continue;
    if (cards[0].rank === 14) tricks += cards.length >= 2 ? 0.9 : 0.7; // Ace
    if (cards.length >= 2 && cards[1].rank === 13) tricks += cards.length >= 3 ? 0.7 : 0.4; // King
    if (cards.length >= 3 && cards[2].rank === 12) tricks += 0.3;
    // Void or singleton = can trump
    if (cards.length <= 1 && bySuit.spades.length >= 2) tricks += 0.5;
  }

  let bid = Math.round(tricks);

  switch (difficulty) {
    case "beginner":
      // Conservative, round down
      bid = Math.max(1, Math.floor(tricks * 0.8));
      break;
    case "advanced":
      bid = Math.max(1, Math.round(tricks));
      break;
    case "expert":
      bid = Math.max(1, Math.round(tricks));
      // Consider partner's bid
      if (partnerBid !== null && partnerBid + bid > 10) {
        bid = Math.max(1, bid - 1);
      }
      break;
    case "master":
      bid = Math.max(0, Math.round(tricks)); // Can bid nil
      // Strategic nil
      if (tricks <= 1 && bySuit.spades.length <= 1 && Math.random() < 0.3) {
        bid = 0;
      }
      if (partnerBid !== null && partnerBid + bid > 11) {
        bid = Math.max(1, bid - 1);
      }
      break;
  }

  return Math.min(13, Math.max(difficulty === "master" ? 0 : 1, bid));
}

// ── AI Card Play ──

function getAIPlay(
  player: SpadesPlayer,
  trick: TrickCard[],
  leadSuit: Suit | null,
  spadesBroken: boolean,
  difficulty: Difficulty,
  cardsPlayed: Card[],
  players: SpadesPlayer[],
): Card {
  const hand = player.hand;
  const isLeading = trick.length === 0;
  const validCards = hand.filter(c => canPlayCard(c, hand, leadSuit, spadesBroken, isLeading));

  if (validCards.length === 1) return validCards[0];

  switch (difficulty) {
    case "beginner":
      return beginnerPlay(validCards, trick, leadSuit, isLeading);
    case "advanced":
      return advancedPlay(validCards, trick, leadSuit, isLeading, player);
    case "expert":
      return expertPlay(validCards, trick, leadSuit, isLeading, player, players, cardsPlayed);
    case "master":
      return masterPlay(validCards, trick, leadSuit, isLeading, player, players, cardsPlayed);
    default:
      return validCards[0];
  }
}

function beginnerPlay(valid: Card[], trick: TrickCard[], leadSuit: Suit | null, isLeading: boolean): Card {
  // Just play highest available, poor strategy
  if (isLeading) {
    // Lead highest non-spade
    const nonSpades = valid.filter(c => c.suit !== "spades");
    if (nonSpades.length > 0) return nonSpades.sort((a, b) => b.rank - a.rank)[0];
    return valid.sort((a, b) => b.rank - a.rank)[0];
  }
  // Following: play highest in suit or highest trump
  return valid.sort((a, b) => b.rank - a.rank)[0];
}

function advancedPlay(valid: Card[], trick: TrickCard[], leadSuit: Suit | null, isLeading: boolean, player: SpadesPlayer): Card {
  if (isLeading) {
    // Lead aces from side suits first
    const sideAces = valid.filter(c => c.suit !== "spades" && c.rank === 14);
    if (sideAces.length > 0) return sideAces[0];
    // Then high non-spades
    const nonSpades = valid.filter(c => c.suit !== "spades");
    if (nonSpades.length > 0) return nonSpades.sort((a, b) => b.rank - a.rank)[0];
    return valid.sort((a, b) => a.rank - b.rank)[0]; // lowest spade
  }

  if (leadSuit && trick.length > 0) {
    const suitCards = valid.filter(c => c.suit === leadSuit);
    if (suitCards.length > 0) {
      // Try to win with minimum winning card
      const currentHigh = Math.max(...trick.filter(t => t.card.suit === leadSuit).map(t => t.card.rank), 0);
      const hasTrump = trick.some(t => t.card.suit === "spades" && leadSuit !== "spades");
      if (hasTrump) {
        // Already trumped, play lowest
        return suitCards.sort((a, b) => a.rank - b.rank)[0];
      }
      const winners = suitCards.filter(c => c.rank > currentHigh);
      if (winners.length > 0) return winners.sort((a, b) => a.rank - b.rank)[0]; // lowest winner
      return suitCards.sort((a, b) => a.rank - b.rank)[0]; // dump lowest
    }
    // Void in suit - trump with low spade if we need tricks
    if (player.tricks < player.bid) {
      const spades = valid.filter(c => c.suit === "spades");
      if (spades.length > 0) return spades.sort((a, b) => a.rank - b.rank)[0];
    }
    // Dump lowest
    return valid.sort((a, b) => a.rank - b.rank)[0];
  }

  return valid.sort((a, b) => b.rank - a.rank)[0];
}

function expertPlay(valid: Card[], trick: TrickCard[], leadSuit: Suit | null, isLeading: boolean, player: SpadesPlayer, players: SpadesPlayer[], cardsPlayed: Card[]): Card {
  const partnerId = (player.id + 2) % 4;
  const needTricks = player.bid - player.tricks;
  const isNilBid = player.bid === 0;

  if (isNilBid) {
    // Play lowest possible card to avoid winning
    return valid.sort((a, b) => a.rank - b.rank)[0];
  }

  if (isLeading) {
    // Lead aces to cash tricks
    if (needTricks > 0) {
      const sideAces = valid.filter(c => c.suit !== "spades" && c.rank === 14);
      if (sideAces.length > 0) return sideAces[0];
    }
    // Lead from short suit to create voids
    const bySuit: Record<Suit, Card[]> = { spades: [], hearts: [], diamonds: [], clubs: [] };
    valid.forEach(c => bySuit[c.suit].push(c));
    const sideNonEmpty = (["hearts", "diamonds", "clubs"] as Suit[]).filter(s => bySuit[s].length > 0);
    if (sideNonEmpty.length > 0) {
      sideNonEmpty.sort((a, b) => bySuit[a].length - bySuit[b].length);
      const shortSuit = sideNonEmpty[0];
      if (needTricks <= 0) {
        // Met bid, play low
        return bySuit[shortSuit].sort((a, b) => a.rank - b.rank)[0];
      }
      return bySuit[shortSuit].sort((a, b) => b.rank - a.rank)[0];
    }
    return valid.sort((a, b) => needTricks > 0 ? b.rank - a.rank : a.rank - b.rank)[0];
  }

  // Following
  if (leadSuit && trick.length > 0) {
    const suitCards = valid.filter(c => c.suit === leadSuit);
    const currentWinner = getWinnerOfTrick(trick, leadSuit);
    const partnerIsWinning = currentWinner === partnerId;

    if (suitCards.length > 0) {
      if (partnerIsWinning && needTricks <= 0) {
        // Partner winning, dump low
        return suitCards.sort((a, b) => a.rank - b.rank)[0];
      }
      const currentHigh = Math.max(...trick.filter(t => t.card.suit === leadSuit).map(t => t.card.rank), 0);
      const hasTrump = trick.some(t => t.card.suit === "spades" && leadSuit !== "spades");
      if (hasTrump && !partnerIsWinning) {
        return suitCards.sort((a, b) => a.rank - b.rank)[0];
      }
      if (needTricks > 0) {
        const winners = suitCards.filter(c => c.rank > currentHigh);
        if (winners.length > 0) return winners.sort((a, b) => a.rank - b.rank)[0];
      }
      return suitCards.sort((a, b) => a.rank - b.rank)[0];
    }

    // Void in suit
    if (needTricks > 0 && !partnerIsWinning) {
      const spades = valid.filter(c => c.suit === "spades");
      const highestTrump = Math.max(...trick.filter(t => t.card.suit === "spades").map(t => t.card.rank), 0);
      const winningTrumps = spades.filter(c => c.rank > highestTrump);
      if (winningTrumps.length > 0) return winningTrumps.sort((a, b) => a.rank - b.rank)[0];
    }
    // Dump lowest non-spade or lowest overall
    const nonSpades = valid.filter(c => c.suit !== "spades");
    if (nonSpades.length > 0) return nonSpades.sort((a, b) => a.rank - b.rank)[0];
    return valid.sort((a, b) => a.rank - b.rank)[0];
  }

  return valid.sort((a, b) => a.rank - b.rank)[0];
}

function masterPlay(valid: Card[], trick: TrickCard[], leadSuit: Suit | null, isLeading: boolean, player: SpadesPlayer, players: SpadesPlayer[], cardsPlayed: Card[]): Card {
  const partnerId = (player.id + 2) % 4;
  const opp1Id = (player.id + 1) % 4;
  const opp2Id = (player.id + 3) % 4;
  const needTricks = player.bid - player.tricks;
  const isNilBid = player.bid === 0;
  const partnerNilBid = players[partnerId].bid === 0;

  // Track remaining cards in each suit
  const allCardIds = new Set(cardsPlayed.map(c => c.id));
  const remainingInSuit: Record<Suit, number> = { spades: 0, hearts: 0, diamonds: 0, clubs: 0 };
  for (const suit of SUITS) {
    for (let r = 2; r <= 14; r++) {
      if (!allCardIds.has(`${suit}-${r}`)) {
        // Check if it's in our hand
        if (!player.hand.some(c => c.id === `${suit}-${r}`)) {
          remainingInSuit[suit]++;
        }
      }
    }
  }

  if (isNilBid) {
    // Nil strategy: play lowest, avoid winning at all costs
    if (leadSuit) {
      const suitCards = valid.filter(c => c.suit === leadSuit);
      if (suitCards.length > 0) {
        // Play just under the current highest if possible
        const currentHigh = Math.max(...trick.filter(t => t.card.suit === leadSuit).map(t => t.card.rank), 0);
        const under = suitCards.filter(c => c.rank < currentHigh);
        if (under.length > 0) return under.sort((a, b) => b.rank - a.rank)[0]; // highest that still loses
        return suitCards.sort((a, b) => a.rank - b.rank)[0];
      }
    }
    return valid.sort((a, b) => a.rank - b.rank)[0];
  }

  // Cover partner's nil
  if (partnerNilBid && trick.length >= 2) {
    const partnerPlayed = trick.find(t => t.playerId === partnerId);
    if (partnerPlayed && leadSuit) {
      const partnerMightWin = getWinnerOfTrick(trick, leadSuit) === partnerId;
      if (partnerMightWin) {
        // Try to overtake partner's card
        const suitCards = valid.filter(c => c.suit === leadSuit);
        if (suitCards.length > 0) {
          const overCards = suitCards.filter(c => c.rank > partnerPlayed.card.rank);
          if (overCards.length > 0) return overCards.sort((a, b) => a.rank - b.rank)[0];
        }
        const trumps = valid.filter(c => c.suit === "spades");
        if (trumps.length > 0 && leadSuit !== "spades") return trumps.sort((a, b) => a.rank - b.rank)[0];
      }
    }
  }

  if (isLeading) {
    // Set opponents: lead suits they're void in (if known)
    if (needTricks > 0) {
      const sideAces = valid.filter(c => c.suit !== "spades" && c.rank === 14);
      if (sideAces.length > 0) return sideAces[0];
      const sideKings = valid.filter(c => c.suit !== "spades" && c.rank === 13);
      const safeSideKings = sideKings.filter(c => allCardIds.has(`${c.suit}-14`));
      if (safeSideKings.length > 0) return safeSideKings[0];
    }

    // Lead low from long suit if bid met
    if (needTricks <= 0) {
      const nonSpades = valid.filter(c => c.suit !== "spades");
      if (nonSpades.length > 0) return nonSpades.sort((a, b) => a.rank - b.rank)[0];
    }

    // Lead through opponents
    const bySuit: Record<Suit, Card[]> = { spades: [], hearts: [], diamonds: [], clubs: [] };
    valid.forEach(c => bySuit[c.suit].push(c));
    const sides = (["hearts", "diamonds", "clubs"] as Suit[]).filter(s => bySuit[s].length > 0);
    if (sides.length > 0) {
      sides.sort((a, b) => bySuit[a].length - bySuit[b].length);
      const best = sides[0];
      return needTricks > 0
        ? bySuit[best].sort((a, b) => b.rank - a.rank)[0]
        : bySuit[best].sort((a, b) => a.rank - b.rank)[0];
    }
    return valid.sort((a, b) => needTricks > 0 ? b.rank - a.rank : a.rank - b.rank)[0];
  }

  // Following suit - same as expert but with better counting
  if (leadSuit && trick.length > 0) {
    const suitCards = valid.filter(c => c.suit === leadSuit);
    const currentWinner = getWinnerOfTrick(trick, leadSuit);
    const partnerIsWinning = currentWinner === partnerId;

    if (suitCards.length > 0) {
      if (partnerIsWinning && needTricks <= 0) {
        return suitCards.sort((a, b) => a.rank - b.rank)[0];
      }
      const currentHigh = Math.max(...trick.filter(t => t.card.suit === leadSuit).map(t => t.card.rank), 0);
      const hasTrump = trick.some(t => t.card.suit === "spades" && leadSuit !== "spades");

      if (hasTrump && !partnerIsWinning) {
        return suitCards.sort((a, b) => a.rank - b.rank)[0];
      }

      // If last to play, play minimum winner
      if (trick.length === 3) {
        if (!partnerIsWinning || needTricks > 0) {
          const winners = suitCards.filter(c => c.rank > currentHigh);
          if (winners.length > 0) return winners.sort((a, b) => a.rank - b.rank)[0];
        }
        return suitCards.sort((a, b) => a.rank - b.rank)[0];
      }

      if (needTricks > 0 && !partnerIsWinning) {
        const winners = suitCards.filter(c => c.rank > currentHigh);
        if (winners.length > 0) return winners.sort((a, b) => a.rank - b.rank)[0];
      }
      return suitCards.sort((a, b) => a.rank - b.rank)[0];
    }

    // Void - decide whether to trump
    if (!partnerIsWinning && needTricks > 0) {
      const spades = valid.filter(c => c.suit === "spades");
      const highestTrump = Math.max(...trick.filter(t => t.card.suit === "spades").map(t => t.card.rank), 0);
      const winningTrumps = spades.filter(c => c.rank > highestTrump);
      if (winningTrumps.length > 0) return winningTrumps.sort((a, b) => a.rank - b.rank)[0];
    }

    const nonSpades = valid.filter(c => c.suit !== "spades");
    if (nonSpades.length > 0) return nonSpades.sort((a, b) => a.rank - b.rank)[0];
    return valid.sort((a, b) => a.rank - b.rank)[0];
  }

  return valid.sort((a, b) => a.rank - b.rank)[0];
}

// ── Scoring ──

function calculateRoundScore(bid: number, tricks: number, currentBags: number): { points: number; newBags: number; bagPenalty: boolean } {
  let points = 0;
  let newBags = currentBags;
  let bagPenalty = false;

  if (bid === 0) {
    // Nil bid
    points = tricks === 0 ? 100 : -100;
    return { points, newBags, bagPenalty };
  }

  if (tricks >= bid) {
    points = bid * 10;
    const overtricks = tricks - bid;
    points += overtricks;
    newBags += overtricks;
    if (newBags >= 10) {
      points -= 100;
      newBags -= 10;
      bagPenalty = true;
    }
  } else {
    points = -(bid * 10);
  }

  return { points, newBags, bagPenalty };
}

// ── Component ──

export default function Spades() {
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [phase, setPhase] = useState<GamePhase>("difficulty");
  const [players, setPlayers] = useState<SpadesPlayer[]>([]);
  const [teamAScore, setTeamAScore] = useState<TeamScore>({ score: 0, bags: 0 }); // WOJAK + Partner
  const [teamBScore, setTeamBScore] = useState<TeamScore>({ score: 0, bags: 0 }); // PEPEs
  const [currentTrick, setCurrentTrick] = useState<TrickCard[]>([]);
  const [leadPlayerIdx, setLeadPlayerIdx] = useState(0);
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  const [spadesBroken, setSpadesBroken] = useState(false);
  const [biddingIdx, setBiddingIdx] = useState(0);
  const [cardsPlayed, setCardsPlayed] = useState<Card[]>([]);
  const [trickWinner, setTrickWinner] = useState<number | null>(null);
  const [roundScoreInfo, setRoundScoreInfo] = useState<string[]>([]);
  const [gameWinner, setGameWinner] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [animatingTrick, setAnimatingTrick] = useState(false);
  const [dealerIdx, setDealerIdx] = useState(0);
  const [roundNumber, setRoundNumber] = useState(1);

  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playersRef = useRef(players);
  playersRef.current = players;
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const difficultyRef = useRef(difficulty);
  difficultyRef.current = difficulty;

  // Cleanup
  useEffect(() => {
    return () => {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    };
  }, []);

  // ── Initialize players ──

  function createPlayers(): SpadesPlayer[] {
    return [
      { id: 0, name: "WOJAK", avatar: WOJAK_AVATAR, hand: [], bid: -1, tricks: 0, isHuman: true, position: "bottom" },
      { id: 1, name: "PEPE 1", avatar: PEPE_AVATARS[0], hand: [], bid: -1, tricks: 0, isHuman: false, position: "left" },
      { id: 2, name: "ALLY", avatar: WOJAK_AVATAR, hand: [], bid: -1, tricks: 0, isHuman: false, position: "top" },
      { id: 3, name: "PEPE 2", avatar: PEPE_AVATARS[1], hand: [], bid: -1, tricks: 0, isHuman: false, position: "right" },
    ];
  }

  // ── Deal cards ──

  const dealCards = useCallback((existingPlayers?: SpadesPlayer[], dealer?: number) => {
    const deck = shuffleDeck(createDeck());
    const p = existingPlayers || createPlayers();
    const newPlayers = p.map((pl, i) => ({
      ...pl,
      hand: sortHand(deck.slice(i * 13, (i + 1) * 13)),
      bid: -1,
      tricks: 0,
    }));
    setPlayers(newPlayers);
    setCurrentTrick([]);
    setSpadesBroken(false);
    setCardsPlayed([]);
    setTrickWinner(null);
    setSelectedCard(null);
    setAnimatingTrick(false);

    // Player left of dealer bids first
    const d = dealer !== undefined ? dealer : dealerIdx;
    const firstBidder = (d + 1) % 4;
    setBiddingIdx(firstBidder);
    setLeadPlayerIdx(firstBidder);
    setCurrentPlayerIdx(firstBidder);
    setPhase("bidding");
  }, [dealerIdx]);

  // ── Start game ──

  function startGame(d: Difficulty) {
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    setDifficulty(d);
    setTeamAScore({ score: 0, bags: 0 });
    setTeamBScore({ score: 0, bags: 0 });
    setDealerIdx(0);
    setRoundNumber(1);
    setGameWinner(null);
    setRoundScoreInfo([]);
    const p = createPlayers();
    dealCards(p, 0);
  }

  // ── Bidding phase ──

  const placeBid = useCallback((playerIdx: number, bid: number) => {
    setPlayers(prev => {
      const updated = [...prev];
      updated[playerIdx] = { ...updated[playerIdx], bid };
      return updated;
    });

    // Check if all have bid
    const nextBidder = (playerIdx + 1) % 4;
    const bidsPlaced = playersRef.current.filter(p => p.bid >= 0).length;

    if (bidsPlaced >= 3) {
      // All 4 will have bid after this
      setTimeout(() => {
        const lead = (dealerIdx + 1) % 4;
        setLeadPlayerIdx(lead);
        setCurrentPlayerIdx(lead);
        setPhase("playing");
      }, 400);
    } else {
      setBiddingIdx(nextBidder);
    }
  }, [dealerIdx]);

  // AI bidding
  useEffect(() => {
    if (phase !== "bidding") return;
    const player = players[biddingIdx];
    if (!player || player.isHuman || player.bid >= 0) return;

    const partnerId = (biddingIdx + 2) % 4;
    const partnerBid = players[partnerId].bid >= 0 ? players[partnerId].bid : null;

    aiTimerRef.current = setTimeout(() => {
      if (phaseRef.current !== "bidding") return;
      const bid = getAIBid(player.hand, difficultyRef.current || "beginner", partnerBid);
      placeBid(biddingIdx, bid);
    }, 600 + Math.random() * 400);

    return () => { if (aiTimerRef.current) clearTimeout(aiTimerRef.current); };
  }, [phase, biddingIdx, players, placeBid]);

  // ── Playing phase ──

  const playCard = useCallback((playerIdx: number, card: Card) => {
    if (animatingTrick) return;

    // Remove card from hand
    setPlayers(prev => {
      const updated = [...prev];
      updated[playerIdx] = {
        ...updated[playerIdx],
        hand: updated[playerIdx].hand.filter(c => c.id !== card.id),
      };
      return updated;
    });

    // Break spades
    if (card.suit === "spades") setSpadesBroken(true);

    const newTrick = [...currentTrick, { playerId: playerIdx, card }];
    setCurrentTrick(newTrick);
    setCardsPlayed(prev => [...prev, card]);
    setSelectedCard(null);

    if (newTrick.length === 4) {
      // Trick complete
      setAnimatingTrick(true);
      const leadSuit = newTrick[0].card.suit;
      const winnerId = getWinnerOfTrick(newTrick, leadSuit);
      setTrickWinner(winnerId);

      setTimeout(() => {
        // Award trick
        setPlayers(prev => {
          const updated = [...prev];
          updated[winnerId] = { ...updated[winnerId], tricks: updated[winnerId].tricks + 1 };
          return updated;
        });

        setTimeout(() => {
          setCurrentTrick([]);
          setTrickWinner(null);
          setAnimatingTrick(false);

          // Check if round is over (all cards played)
          const totalTricks = playersRef.current.reduce((sum, p) => sum + p.tricks, 0) + 1;
          if (totalTricks >= 13) {
            // End of round
            endRound(winnerId);
          } else {
            setLeadPlayerIdx(winnerId);
            setCurrentPlayerIdx(winnerId);
          }
        }, 800);
      }, 1000);
    } else {
      const nextPlayer = (playerIdx + 1) % 4;
      setCurrentPlayerIdx(nextPlayer);
    }
  }, [currentTrick, animatingTrick]);

  // AI play
  useEffect(() => {
    if (phase !== "playing" || animatingTrick) return;
    const player = players[currentPlayerIdx];
    if (!player || player.isHuman || player.hand.length === 0) return;

    const leadSuit = currentTrick.length > 0 ? currentTrick[0].card.suit : null;

    aiTimerRef.current = setTimeout(() => {
      if (phaseRef.current !== "playing") return;
      const card = getAIPlay(
        player, currentTrick, leadSuit, spadesBroken,
        difficultyRef.current || "beginner", cardsPlayed, playersRef.current
      );
      playCard(currentPlayerIdx, card);
    }, 500 + Math.random() * 500);

    return () => { if (aiTimerRef.current) clearTimeout(aiTimerRef.current); };
  }, [phase, currentPlayerIdx, animatingTrick, currentTrick, spadesBroken, cardsPlayed, players, playCard]);

  // ── End round ──

  function endRound(lastWinnerId: number) {
    const p = playersRef.current;
    // Team A: players 0 + 2, Team B: players 1 + 3
    const teamATricks = p[0].tricks + p[2].tricks;
    const teamBTricks = p[1].tricks + p[3].tricks;
    const teamABid = p[0].bid + p[2].bid;
    const teamBBid = p[1].bid + p[3].bid;

    // Handle nil bids individually then sum
    let teamAPoints = 0;
    let teamABags = teamAScore.bags;
    let teamBPoints = 0;
    let teamBBags = teamBScore.bags;

    const info: string[] = [];
    info.push(`--- Round ${roundNumber} Results ---`);

    // Team A scoring
    const p0Nil = p[0].bid === 0;
    const p2Nil = p[2].bid === 0;
    if (p0Nil) {
      const nilResult = p[0].tricks === 0 ? 100 : -100;
      teamAPoints += nilResult;
      info.push(`${p[0].name}: Nil ${p[0].tricks === 0 ? "SUCCESS (+100)" : "FAILED (-100)"}`);
    }
    if (p2Nil) {
      const nilResult = p[2].tricks === 0 ? 100 : -100;
      teamAPoints += nilResult;
      info.push(`${p[2].name}: Nil ${p[2].tricks === 0 ? "SUCCESS (+100)" : "FAILED (-100)"}`);
    }
    // Non-nil combined scoring
    const teamANonNilBid = (p0Nil ? 0 : p[0].bid) + (p2Nil ? 0 : p[2].bid);
    const teamANonNilTricks = (p0Nil ? 0 : p[0].tricks) + (p2Nil ? 0 : p[2].tricks);
    if (teamANonNilBid > 0) {
      const result = calculateRoundScore(teamANonNilBid, teamANonNilTricks, teamABags);
      teamAPoints += result.points;
      teamABags = result.newBags;
      info.push(`Team WOJAK: Bid ${teamANonNilBid}, Got ${teamANonNilTricks} => ${result.points >= 0 ? "+" : ""}${result.points}${result.bagPenalty ? " (BAG PENALTY -100!)" : ""}`);
    }

    // Team B scoring
    const p1Nil = p[1].bid === 0;
    const p3Nil = p[3].bid === 0;
    if (p1Nil) {
      const nilResult = p[1].tricks === 0 ? 100 : -100;
      teamBPoints += nilResult;
      info.push(`${p[1].name}: Nil ${p[1].tricks === 0 ? "SUCCESS (+100)" : "FAILED (-100)"}`);
    }
    if (p3Nil) {
      const nilResult = p[3].tricks === 0 ? 100 : -100;
      teamBPoints += nilResult;
      info.push(`${p[3].name}: Nil ${p[3].tricks === 0 ? "SUCCESS (+100)" : "FAILED (-100)"}`);
    }
    const teamBNonNilBid = (p1Nil ? 0 : p[1].bid) + (p3Nil ? 0 : p[3].bid);
    const teamBNonNilTricks = (p1Nil ? 0 : p[1].tricks) + (p3Nil ? 0 : p[3].tricks);
    if (teamBNonNilBid > 0) {
      const result = calculateRoundScore(teamBNonNilBid, teamBNonNilTricks, teamBBags);
      teamBPoints += result.points;
      teamBBags = result.newBags;
      info.push(`Team PEPE: Bid ${teamBNonNilBid}, Got ${teamBNonNilTricks} => ${result.points >= 0 ? "+" : ""}${result.points}${result.bagPenalty ? " (BAG PENALTY -100!)" : ""}`);
    }

    const newTeamA = { score: teamAScore.score + teamAPoints, bags: teamABags };
    const newTeamB = { score: teamBScore.score + teamBPoints, bags: teamBBags };
    setTeamAScore(newTeamA);
    setTeamBScore(newTeamB);

    info.push("");
    info.push(`Team WOJAK: ${newTeamA.score} pts (${newTeamA.bags} bags)`);
    info.push(`Team PEPE: ${newTeamB.score} pts (${newTeamB.bags} bags)`);

    // Check for game over
    if (newTeamA.score >= WINNING_SCORE || newTeamB.score >= WINNING_SCORE) {
      if (newTeamA.score >= WINNING_SCORE && newTeamB.score >= WINNING_SCORE) {
        setGameWinner(newTeamA.score >= newTeamB.score ? "WOJAK" : "PEPE");
      } else {
        setGameWinner(newTeamA.score >= WINNING_SCORE ? "WOJAK" : "PEPE");
      }
      setPhase("gameOver");
    } else {
      setPhase("roundEnd");
    }

    setRoundScoreInfo(info);
  }

  // ── Next round ──

  function nextRound() {
    const newDealer = (dealerIdx + 1) % 4;
    setDealerIdx(newDealer);
    setRoundNumber(prev => prev + 1);
    const p = players.map(pl => ({ ...pl, hand: [], bid: -1, tricks: 0 }));
    dealCards(p, newDealer);
  }

  // ── Player card click ──

  function handleCardClick(card: Card) {
    if (phase !== "playing" || currentPlayerIdx !== 0 || animatingTrick) return;

    const player = players[0];
    const leadSuit = currentTrick.length > 0 ? currentTrick[0].card.suit : null;
    const isLeading = currentTrick.length === 0;
    const isValid = canPlayCard(card, player.hand, leadSuit, spadesBroken, isLeading);

    if (!isValid) return;

    if (selectedCard === card.id) {
      // Double click / confirm - play the card
      playCard(0, card);
    } else {
      setSelectedCard(card.id);
    }
  }

  // ── Valid card check ──

  function isCardValid(card: Card): boolean {
    if (phase !== "playing" || currentPlayerIdx !== 0) return false;
    const player = players[0];
    const leadSuit = currentTrick.length > 0 ? currentTrick[0].card.suit : null;
    const isLeading = currentTrick.length === 0;
    return canPlayCard(card, player.hand, leadSuit, spadesBroken, isLeading);
  }

  // ── Card rendering ──

  function CardFace({ card, small, highlight, dimmed, selected, onClick }: {
    card: Card; small?: boolean; highlight?: boolean; dimmed?: boolean; selected?: boolean;
    onClick?: () => void;
  }) {
    const color = cardColor(card.suit);
    const sym = SUIT_SYMBOLS[card.suit];
    const rank = RANK_NAMES[card.rank];
    const w = small ? 40 : 52;
    const h = small ? 56 : 72;
    const fs = small ? 10 : 12;
    const bigSuit = small ? 16 : 20;

    return (
      <div
        onClick={onClick}
        style={{
          width: w, height: h,
          backgroundColor: "#0d1117",
          borderRadius: 5,
          border: `1.5px solid ${selected ? "rgba(250,204,21,0.9)" : highlight ? GREEN : "rgba(0,255,65,0.2)"}`,
          boxShadow: selected
            ? "0 0 12px rgba(250,204,21,0.5)"
            : highlight ? `0 0 8px rgba(0,255,65,0.4)` : "0 1px 4px rgba(0,0,0,0.6)",
          display: "flex", flexDirection: "column", justifyContent: "space-between",
          padding: small ? 2 : 3,
          userSelect: "none",
          cursor: onClick ? "pointer" : "default",
          opacity: dimmed ? 0.35 : 1,
          transition: "transform 0.15s, box-shadow 0.15s, opacity 0.15s",
          flexShrink: 0,
        }}
      >
        <div style={{ color, display: "flex", alignItems: "center", lineHeight: 1 }}>
          <span style={{ fontSize: fs, fontWeight: 700 }}>{rank}</span>
          <span style={{ fontSize: fs * 0.85, marginLeft: 1 }}>{sym}</span>
        </div>
        <div style={{ color, textAlign: "center", fontSize: bigSuit, lineHeight: 1 }}>{sym}</div>
        <div style={{ color, display: "flex", alignItems: "center", alignSelf: "flex-end", transform: "rotate(180deg)", lineHeight: 1 }}>
          <span style={{ fontSize: fs, fontWeight: 700 }}>{rank}</span>
          <span style={{ fontSize: fs * 0.85, marginLeft: 1 }}>{sym}</span>
        </div>
      </div>
    );
  }

  function CardBack({ small }: { small?: boolean }) {
    const w = small ? 32 : 40;
    const h = small ? 44 : 56;
    return (
      <div
        style={{
          width: w, height: h,
          backgroundColor: "#0a0f14",
          backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(0,255,65,0.07) 3px, rgba(0,255,65,0.07) 4px)",
          borderRadius: 5,
          border: "1.5px solid rgba(0,255,65,0.2)",
          boxShadow: "0 1px 4px rgba(0,0,0,0.6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          userSelect: "none",
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: small ? 8 : 10, fontWeight: 800, color: GREEN, opacity: 0.3 }}>W</span>
      </div>
    );
  }

  // ── Player position display ──

  function PlayerSeat({ player }: { player: SpadesPlayer }) {
    const isActive = phase === "playing" && currentPlayerIdx === player.id && !animatingTrick;
    const isWinner = trickWinner === player.id;
    const isBidding = phase === "bidding" && biddingIdx === player.id;
    const trickInPlay = currentTrick.find(t => t.playerId === player.id);
    const isTeamA = player.id === 0 || player.id === 2;

    return (
      <div className="flex flex-col items-center gap-1">
        {/* Avatar + info */}
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all ${
          isActive ? "bg-wojak-green/15 border border-wojak-green/40" :
          isWinner ? "bg-wojak-green/20 border border-wojak-green/50" :
          isBidding ? "bg-yellow-500/10 border border-yellow-500/30" :
          "bg-wojak-card/60 border border-wojak-border/50"
        }`}>
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-wojak-card border border-wojak-border overflow-hidden flex-shrink-0">
            <img
              src={player.avatar}
              alt={player.name}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          </div>
          <div className="flex flex-col">
            <span className={`text-xs font-bold ${
              isActive ? "text-wojak-green" : isWinner ? "text-wojak-green" : "text-white"
            }`}>
              {player.name}
              {isActive && !player.isHuman && <span className="text-yellow-400 animate-pulse ml-1">...</span>}
              {isBidding && !player.isHuman && <span className="text-yellow-400 animate-pulse ml-1">...</span>}
            </span>
            <div className="flex items-center gap-1 text-xs">
              {player.bid >= 0 && (
                <span style={{ color: GREEN, fontSize: 10 }}>
                  Bid: {player.bid} | Won: {player.tricks}
                </span>
              )}
              {player.bid === -1 && phase === "bidding" && (
                <span className="text-gray-500" style={{ fontSize: 10 }}>Waiting...</span>
              )}
            </div>
          </div>
        </div>

        {/* Show card count for non-human */}
        {!player.isHuman && player.hand.length > 0 && phase === "playing" && (
          <div className="flex gap-px">
            {Array.from({ length: Math.min(player.hand.length, 6) }).map((_, i) => (
              <CardBack key={i} small />
            ))}
            {player.hand.length > 6 && (
              <span className="text-gray-500 text-xs ml-1">+{player.hand.length - 6}</span>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── Trick display (center area) ──

  function TrickArea() {
    // Position trick cards relative to their player position
    const positions: Record<number, { top: string; left: string }> = {
      0: { top: "70%", left: "50%" },   // bottom
      1: { top: "50%", left: "15%" },   // left
      2: { top: "15%", left: "50%" },   // top
      3: { top: "50%", left: "85%" },   // right
    };

    return (
      <div
        className="relative mx-auto"
        style={{
          width: "100%",
          maxWidth: 280,
          height: 180,
          border: "1.5px solid rgba(0,255,65,0.1)",
          borderRadius: 12,
          backgroundColor: "rgba(0,255,65,0.02)",
        }}
      >
        {currentTrick.map((tc) => {
          const pos = positions[tc.playerId];
          return (
            <div
              key={tc.card.id}
              style={{
                position: "absolute",
                top: pos.top,
                left: pos.left,
                transform: "translate(-50%, -50%)",
                transition: "all 0.3s ease-out",
              }}
            >
              <CardFace
                card={tc.card}
                small
                highlight={trickWinner === tc.playerId}
              />
            </div>
          );
        })}
        {currentTrick.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-600 text-xs">
            {phase === "playing" ? "Play a card" : ""}
          </div>
        )}
      </div>
    );
  }

  // ── Render ──

  return (
    <div className="flex flex-col items-center gap-2 sm:gap-3 p-2 sm:p-4 select-none w-full max-w-2xl mx-auto">

      {/* Difficulty select */}
      {phase === "difficulty" && (
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="text-gray-400 text-sm text-center">
            Spades — WOJAK + ALLY vs PEPE 1 + PEPE 2
          </div>
          <div className="text-gray-500 text-xs text-center max-w-sm">
            Classic 4-player Spades. First team to {WINNING_SCORE} wins!
          </div>
          <div className="flex gap-1.5 sm:gap-2 flex-wrap justify-center">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.key}
                onClick={() => startGame(d.key)}
                className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-colors bg-wojak-card border border-wojak-border text-gray-300 hover:text-white hover:bg-white/5"
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active game header - difficulty + scores */}
      {phase !== "difficulty" && (
        <>
          {/* Difficulty buttons */}
          <div className="flex gap-1.5 sm:gap-2 flex-wrap justify-center">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.key}
                onClick={() => startGame(d.key)}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  difficulty === d.key
                    ? "bg-wojak-green/20 border border-wojak-green/50 text-white"
                    : "bg-wojak-card border border-wojak-border text-gray-300 hover:text-white hover:bg-white/5"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Score panel */}
          <div className="flex gap-3 sm:gap-6 text-xs sm:text-sm">
            <div className="flex flex-col items-center px-3 py-1.5 rounded-lg bg-wojak-card/60 border border-wojak-border/50">
              <span className="text-green-300 font-bold text-xs">Team WOJAK</span>
              <span style={{ color: GREEN, fontWeight: 700 }}>{teamAScore.score}</span>
              <span className="text-gray-500" style={{ fontSize: 9 }}>Bags: {teamAScore.bags}</span>
            </div>
            <div className="flex flex-col items-center justify-center">
              <span className="text-gray-500 text-xs">Round {roundNumber}</span>
              <span className="text-gray-600" style={{ fontSize: 9 }}>First to {WINNING_SCORE}</span>
            </div>
            <div className="flex flex-col items-center px-3 py-1.5 rounded-lg bg-wojak-card/60 border border-wojak-border/50">
              <span className="text-white font-bold text-xs">Team PEPE</span>
              <span style={{ color: WHITE, fontWeight: 700 }}>{teamBScore.score}</span>
              <span className="text-gray-500" style={{ fontSize: 9 }}>Bags: {teamBScore.bags}</span>
            </div>
          </div>
        </>
      )}

      {/* Bidding phase */}
      {phase === "bidding" && (
        <div className="flex flex-col items-center gap-3 w-full">
          {/* Show all player seats during bidding */}
          <div className="w-full rounded-2xl p-3 sm:p-4" style={{
            backgroundColor: "#0a120a",
            border: "2px solid rgba(0,255,65,0.15)",
            boxShadow: "inset 0 0 60px rgba(0,255,65,0.03)",
          }}>
            {/* Top: partner */}
            <div className="flex justify-center mb-3">
              <PlayerSeat player={players[2]} />
            </div>
            {/* Middle row: left + center + right */}
            <div className="flex justify-between items-center mb-3">
              <PlayerSeat player={players[1]} />
              <div className="text-center">
                <div className="text-gray-400 text-sm font-bold mb-1">Bidding Phase</div>
                <div className="text-gray-500 text-xs">Select your bid (0-13)</div>
              </div>
              <PlayerSeat player={players[3]} />
            </div>
            {/* Bottom: player */}
            <div className="flex justify-center">
              <PlayerSeat player={players[0]} />
            </div>
          </div>

          {/* Player's bid selection */}
          {biddingIdx === 0 && players[0].bid === -1 && (
            <div className="flex flex-col items-center gap-2">
              <span className="text-gray-300 text-sm font-medium">Your bid:</span>
              <div className="flex gap-1 flex-wrap justify-center">
                {Array.from({ length: 14 }, (_, i) => i).map(bid => (
                  <button
                    key={bid}
                    onClick={() => placeBid(0, bid)}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg text-xs sm:text-sm font-bold transition-colors bg-wojak-card border border-wojak-border text-gray-300 hover:text-white hover:bg-wojak-green/20 hover:border-wojak-green/50"
                  >
                    {bid}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Player hand preview during bidding */}
          <div className="flex gap-0.5 sm:gap-1 flex-wrap justify-center max-w-full overflow-x-auto pb-1">
            {players[0]?.hand.map(card => (
              <div key={card.id} style={{ marginLeft: -4, marginRight: -4 }}>
                <CardFace card={card} small />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Playing phase */}
      {phase === "playing" && (
        <div className="flex flex-col items-center gap-2 w-full">
          {/* Game table */}
          <div
            className="relative w-full rounded-2xl p-3 sm:p-4"
            style={{
              backgroundColor: "#0a120a",
              border: "2px solid rgba(0,255,65,0.15)",
              boxShadow: "inset 0 0 60px rgba(0,255,65,0.03), 0 0 20px rgba(0,0,0,0.5)",
            }}
          >
            {/* Top: Partner (ALLY) */}
            <div className="flex justify-center mb-2">
              <PlayerSeat player={players[2]} />
            </div>

            {/* Middle: Left opponent + Trick area + Right opponent */}
            <div className="flex justify-between items-center gap-2">
              <div className="flex-shrink-0">
                <PlayerSeat player={players[1]} />
              </div>
              <div className="flex-1">
                <TrickArea />
              </div>
              <div className="flex-shrink-0">
                <PlayerSeat player={players[3]} />
              </div>
            </div>

            {/* Bottom: Player info */}
            <div className="flex justify-center mt-2">
              <PlayerSeat player={players[0]} />
            </div>
          </div>

          {/* Player's hand */}
          <div className="flex gap-0.5 flex-wrap justify-center max-w-full pb-1" style={{ minHeight: 80 }}>
            {players[0]?.hand.map(card => {
              const valid = isCardValid(card);
              const isSel = selectedCard === card.id;
              return (
                <div
                  key={card.id}
                  style={{
                    marginLeft: -6,
                    marginRight: -6,
                    transform: isSel ? "translateY(-8px)" : valid ? "translateY(0)" : "translateY(0)",
                    transition: "transform 0.15s",
                    zIndex: isSel ? 10 : 1,
                  }}
                  className={valid ? "hover:-translate-y-2" : ""}
                >
                  <CardFace
                    card={card}
                    selected={isSel}
                    dimmed={!valid}
                    onClick={valid ? () => handleCardClick(card) : undefined}
                  />
                </div>
              );
            })}
          </div>

          {/* Play hint */}
          {currentPlayerIdx === 0 && !animatingTrick && (
            <div className="text-gray-500 text-xs text-center">
              {selectedCard ? "Tap again to play, or select another card" : "Tap a card to select, tap again to play"}
            </div>
          )}
        </div>
      )}

      {/* Round end */}
      {phase === "roundEnd" && (
        <div className="flex flex-col items-center gap-3 py-4">
          <div
            className="bg-wojak-card border border-wojak-border rounded-xl p-4 sm:p-6 max-w-sm w-full"
            style={{ boxShadow: "0 0 20px rgba(0,255,65,0.1)" }}
          >
            {roundScoreInfo.map((line, i) => (
              <div
                key={i}
                className={`text-xs sm:text-sm ${
                  line.startsWith("---") ? "text-gray-300 font-bold text-center mb-2" :
                  line.startsWith("Team WOJAK") ? "text-green-300 font-bold mt-1" :
                  line.startsWith("Team PEPE") ? "text-white font-bold" :
                  line.includes("SUCCESS") ? "text-green-400" :
                  line.includes("FAILED") || line.includes("PENALTY") ? "text-red-400" :
                  line === "" ? "mt-2" :
                  "text-gray-400"
                }`}
              >
                {line || "\u00A0"}
              </div>
            ))}
          </div>
          <button
            onClick={nextRound}
            className="px-6 py-2.5 rounded-lg font-bold text-sm sm:text-base transition-colors"
            style={{ backgroundColor: GREEN, color: "#000" }}
          >
            Next Round
          </button>
        </div>
      )}

      {/* Game over */}
      {phase === "gameOver" && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
          <div
            className={`bg-wojak-dark border rounded-xl p-6 sm:p-8 flex flex-col items-center gap-4 mx-4 ${gameWinner === "WOJAK" ? "animate-bounce" : ""}`}
            style={{
              borderColor: gameWinner === "WOJAK" ? "rgba(0,255,65,0.4)" : "rgba(255,50,50,0.4)",
              boxShadow: gameWinner === "WOJAK"
                ? "0 0 40px rgba(0,255,65,0.3), 0 0 80px rgba(0,255,65,0.1)"
                : "0 0 40px rgba(255,50,50,0.2)",
            }}
          >
            <div
              className="text-2xl sm:text-3xl font-bold"
              style={{ color: gameWinner === "WOJAK" ? GREEN : "#ff6b6b" }}
            >
              {gameWinner === "WOJAK" ? "You Win!" : "Game Over"}
            </div>
            <div className="text-gray-400 text-sm sm:text-base text-center">
              {gameWinner === "WOJAK"
                ? `Team WOJAK wins with ${teamAScore.score} points!`
                : `Team PEPE wins with ${teamBScore.score} points.`}
            </div>
            <div className="bg-wojak-card border border-wojak-border rounded-lg p-3 w-full max-w-xs">
              {roundScoreInfo.map((line, i) => (
                <div key={i} className={`text-xs ${
                  line.startsWith("---") ? "text-gray-300 font-bold text-center mb-1" :
                  line.startsWith("Team WOJAK") ? "text-green-300 font-bold mt-1" :
                  line.startsWith("Team PEPE") ? "text-white font-bold" :
                  line === "" ? "mt-1" :
                  "text-gray-400"
                }`}>
                  {line || "\u00A0"}
                </div>
              ))}
            </div>
            <button
              onClick={() => { setPhase("difficulty"); setGameWinner(null); }}
              className="px-6 py-2.5 font-bold rounded-lg hover:opacity-80 transition-colors text-sm sm:text-base"
              style={{ backgroundColor: GREEN, color: "#000" }}
            >
              Play Again
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      {phase !== "difficulty" && phase !== "gameOver" && (
        <div className="text-gray-500 text-xs text-center max-w-md px-2">
          <span className="hidden sm:inline">Spades — Tap a card to select, tap again to play. Spades are trump. First to {WINNING_SCORE} wins.</span>
          <span className="sm:hidden">Tap to select, tap again to play. First to {WINNING_SCORE}.</span>
        </div>
      )}
    </div>
  );
}
