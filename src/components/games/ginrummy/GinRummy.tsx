"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ── Types ──

type Suit = "spades" | "hearts" | "diamonds" | "clubs";
type Difficulty = "beginner" | "advanced" | "expert" | "master";
type GamePhase = "difficulty" | "playing" | "discard" | "roundEnd" | "layoff" | "gameOver";

interface Card {
  suit: Suit;
  rank: number; // 1=A, 2-10, 11=J, 12=Q, 13=K
  id: string;
}

interface Meld {
  cards: Card[];
  type: "set" | "run";
}

interface RoundResult {
  playerMelds: Meld[];
  playerDeadwood: Card[];
  playerDeadwoodPoints: number;
  opponentMelds: Meld[];
  opponentDeadwood: Card[];
  opponentDeadwoodPoints: number;
  knocker: "player" | "opponent";
  isGin: boolean;
  isUndercut: boolean;
  pointsAwarded: number;
  winner: "player" | "opponent" | "draw";
  layoffs: Card[];
}

// ── Constants ──

const SUITS: Suit[] = ["spades", "hearts", "diamonds", "clubs"];
const SUIT_SYMBOLS: Record<Suit, string> = {
  spades: "\u2660", hearts: "\u2665", diamonds: "\u2666", clubs: "\u2663",
};
const RANK_NAMES: Record<number, string> = {
  1: "A", 2: "2", 3: "3", 4: "4", 5: "5", 6: "6", 7: "7",
  8: "8", 9: "9", 10: "10", 11: "J", 12: "Q", 13: "K",
};

const GREEN = "#00ff41";
const WHITE = "#ffffff";

const WOJAK_AVATAR = "/images/wojak.jpg";
const PEPE_AVATAR = "/images/pepe1.jpg";

const DIFFICULTIES: { key: Difficulty; label: string }[] = [
  { key: "beginner", label: "Beginner" },
  { key: "advanced", label: "Advanced" },
  { key: "expert", label: "Expert" },
  { key: "master", label: "Master" },
];

const WINNING_SCORE = 100;
const GIN_BONUS = 25;
const UNDERCUT_BONUS = 25;

// ── Helpers ──

function isRedSuit(suit: Suit): boolean {
  return suit === "hearts" || suit === "diamonds";
}

function cardColor(suit: Suit): string {
  return isRedSuit(suit) ? WHITE : GREEN;
}

function deadwoodValue(card: Card): number {
  if (card.rank >= 10) return 10; // 10, J, Q, K
  return card.rank; // A=1, 2-9
}

function totalDeadwood(cards: Card[]): number {
  return cards.reduce((sum, c) => sum + deadwoodValue(c), 0);
}

function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (let rank = 1; rank <= 13; rank++) {
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

// ── Meld Detection ──

function findAllMelds(hand: Card[]): { melds: Meld[]; deadwood: Card[]; deadwoodPoints: number } {
  // Try all combinations and find the one with lowest deadwood
  const best = findBestMeldArrangement(hand);
  return best;
}

function findBestMeldArrangement(hand: Card[]): { melds: Meld[]; deadwood: Card[]; deadwoodPoints: number } {
  let bestResult = { melds: [] as Meld[], deadwood: [...hand], deadwoodPoints: totalDeadwood(hand) };

  // Get all possible melds
  const allSets = findAllSets(hand);
  const allRuns = findAllRuns(hand);
  const allPossibleMelds = [...allSets, ...allRuns];

  // Try combinations of non-overlapping melds
  function tryMelds(idx: number, usedIds: Set<string>, currentMelds: Meld[]) {
    // Calculate current deadwood
    const remaining = hand.filter(c => !usedIds.has(c.id));
    const dw = totalDeadwood(remaining);
    if (dw < bestResult.deadwoodPoints) {
      bestResult = { melds: [...currentMelds], deadwood: remaining, deadwoodPoints: dw };
    }

    for (let i = idx; i < allPossibleMelds.length; i++) {
      const meld = allPossibleMelds[i];
      if (meld.cards.some(c => usedIds.has(c.id))) continue;
      const newUsed = new Set(usedIds);
      meld.cards.forEach(c => newUsed.add(c.id));
      currentMelds.push(meld);
      tryMelds(i + 1, newUsed, currentMelds);
      currentMelds.pop();
    }
  }

  tryMelds(0, new Set(), []);
  return bestResult;
}

function findAllSets(hand: Card[]): Meld[] {
  const melds: Meld[] = [];
  const byRank: Record<number, Card[]> = {};
  hand.forEach(c => {
    if (!byRank[c.rank]) byRank[c.rank] = [];
    byRank[c.rank].push(c);
  });

  for (const rank in byRank) {
    const cards = byRank[rank];
    if (cards.length >= 3) {
      // All combinations of 3
      for (let i = 0; i < cards.length; i++) {
        for (let j = i + 1; j < cards.length; j++) {
          for (let k = j + 1; k < cards.length; k++) {
            melds.push({ cards: [cards[i], cards[j], cards[k]], type: "set" });
          }
        }
      }
      // All combinations of 4
      if (cards.length === 4) {
        melds.push({ cards: [...cards], type: "set" });
      }
    }
  }
  return melds;
}

function findAllRuns(hand: Card[]): Meld[] {
  const melds: Meld[] = [];
  const bySuit: Record<Suit, Card[]> = { spades: [], hearts: [], diamonds: [], clubs: [] };
  hand.forEach(c => bySuit[c.suit].push(c));

  for (const suit of SUITS) {
    const cards = bySuit[suit].sort((a, b) => a.rank - b.rank);
    if (cards.length < 3) continue;

    // Find all consecutive runs of length 3+
    for (let start = 0; start < cards.length; start++) {
      const run: Card[] = [cards[start]];
      for (let next = start + 1; next < cards.length; next++) {
        if (cards[next].rank === run[run.length - 1].rank + 1) {
          run.push(cards[next]);
          if (run.length >= 3) {
            melds.push({ cards: [...run], type: "run" });
          }
        } else {
          break;
        }
      }
    }
  }
  return melds;
}

// Check if a card can be laid off on existing melds
function canLayOff(card: Card, melds: Meld[]): boolean {
  for (const meld of melds) {
    if (meld.type === "set") {
      if (card.rank === meld.cards[0].rank && meld.cards.length < 4 && !meld.cards.some(c => c.suit === card.suit)) {
        return true;
      }
    } else {
      // Run - check if card extends either end
      const sorted = [...meld.cards].sort((a, b) => a.rank - b.rank);
      if (card.suit === sorted[0].suit) {
        if (card.rank === sorted[0].rank - 1 || card.rank === sorted[sorted.length - 1].rank + 1) {
          return true;
        }
      }
    }
  }
  return false;
}

// Apply layoff to melds (return new melds array with card added)
function applyLayOff(card: Card, melds: Meld[]): Meld[] {
  const newMelds = melds.map(m => ({ ...m, cards: [...m.cards] }));
  for (const meld of newMelds) {
    if (meld.type === "set") {
      if (card.rank === meld.cards[0].rank && meld.cards.length < 4 && !meld.cards.some(c => c.suit === card.suit)) {
        meld.cards.push(card);
        return newMelds;
      }
    } else {
      const sorted = [...meld.cards].sort((a, b) => a.rank - b.rank);
      if (card.suit === sorted[0].suit) {
        if (card.rank === sorted[0].rank - 1) {
          meld.cards.unshift(card);
          return newMelds;
        }
        if (card.rank === sorted[sorted.length - 1].rank + 1) {
          meld.cards.push(card);
          return newMelds;
        }
      }
    }
  }
  return newMelds;
}

// ── AI Logic ──

function aiDrawDecision(
  hand: Card[],
  topDiscard: Card | null,
  difficulty: Difficulty,
  discardPile: Card[],
  playerDiscards: Card[],
): "stock" | "discard" {
  if (!topDiscard) return "stock";

  switch (difficulty) {
    case "beginner":
      // Random draw
      return Math.random() < 0.5 ? "stock" : "discard";

    case "advanced": {
      // Draw from discard if it immediately helps form a meld
      const withDiscard = [...hand, topDiscard];
      const currentDW = findBestMeldArrangement(hand).deadwoodPoints;
      const newDW = findBestMeldArrangement(withDiscard).deadwoodPoints;
      // Need to account for discarding a card too (rough estimate: subtract min deadwood card)
      const minCard = Math.min(...hand.map(c => deadwoodValue(c)));
      if (newDW - minCard < currentDW - 3) return "discard";
      return "stock";
    }

    case "expert":
    case "master": {
      const withDiscard = [...hand, topDiscard];
      const currentResult = findBestMeldArrangement(hand);
      const newResult = findBestMeldArrangement(withDiscard);
      const improvement = currentResult.deadwoodPoints - (newResult.deadwoodPoints - Math.min(...hand.map(c => deadwoodValue(c))));
      if (improvement > 2) return "discard";
      // Expert/Master: also consider if taking tells the player useful info
      if (difficulty === "master" && improvement > 0 && Math.random() < 0.3) {
        return "stock"; // Sometimes hide intent
      }
      if (improvement > 0) return "discard";
      return "stock";
    }

    default:
      return "stock";
  }
}

function aiChooseDiscard(
  hand: Card[],
  difficulty: Difficulty,
  discardPile: Card[],
  playerDiscards: Card[],
): Card {
  switch (difficulty) {
    case "beginner": {
      // Discard highest deadwood card
      const result = findBestMeldArrangement(hand);
      if (result.deadwood.length > 0) {
        return result.deadwood.sort((a, b) => deadwoodValue(b) - deadwoodValue(a))[0];
      }
      return hand.sort((a, b) => deadwoodValue(b) - deadwoodValue(a))[0];
    }

    case "advanced": {
      // Discard highest deadwood, with some awareness
      const result = findBestMeldArrangement(hand);
      if (result.deadwood.length > 0) {
        // Prefer discarding cards that don't help potential melds
        const sorted = result.deadwood.sort((a, b) => deadwoodValue(b) - deadwoodValue(a));
        return sorted[0];
      }
      return hand[hand.length - 1];
    }

    case "expert": {
      // Strategic: discard highest deadwood but avoid discarding cards the player might need
      const result = findBestMeldArrangement(hand);
      if (result.deadwood.length > 0) {
        const sorted = result.deadwood.sort((a, b) => deadwoodValue(b) - deadwoodValue(a));
        // Check what player has been discarding to infer what they DON'T need
        // Avoid discarding ranks/suits near what player has picked up
        for (const card of sorted) {
          // Check if player recently discarded similar rank (they probably don't need it)
          const playerDiscardedRank = playerDiscards.some(d => d.rank === card.rank);
          if (playerDiscardedRank) return card;
        }
        return sorted[0];
      }
      return hand[hand.length - 1];
    }

    case "master": {
      // Optimal: track all discards, infer player hand, avoid feeding melds
      const result = findBestMeldArrangement(hand);
      if (result.deadwood.length > 0) {
        const sorted = result.deadwood.sort((a, b) => deadwoodValue(b) - deadwoodValue(a));
        const safeDiscards = sorted.filter(card => {
          // Don't discard if adjacent to cards player picked from discard
          const dangerous = playerDiscards.some(d =>
            (d.suit === card.suit && Math.abs(d.rank - card.rank) <= 1) ||
            (d.rank === card.rank)
          );
          return !dangerous;
        });
        if (safeDiscards.length > 0) return safeDiscards[0];
        // If all are dangerous, discard least dangerous high card
        return sorted[0];
      }
      return hand[hand.length - 1];
    }

    default:
      return hand[0];
  }
}

function aiShouldKnock(
  hand: Card[],
  difficulty: Difficulty,
  stockRemaining: number,
): boolean {
  const result = findBestMeldArrangement(hand);
  const dw = result.deadwoodPoints;

  if (dw > 10) return false;

  switch (difficulty) {
    case "beginner":
      // Knock as soon as possible
      return true;
    case "advanced":
      return dw <= 7;
    case "expert":
      // Try for gin a bit longer if close
      if (dw === 0) return true;
      if (stockRemaining < 10) return dw <= 8;
      return dw <= 4;
    case "master":
      // Optimally balance gin vs knock
      if (dw === 0) return true;
      if (stockRemaining < 6) return dw <= 10;
      if (stockRemaining < 12) return dw <= 5;
      return dw <= 2;
    default:
      return true;
  }
}

// AI layoff: find cards from deadwood that can be laid off on knocker's melds
function aiLayOff(deadwood: Card[], knockerMelds: Meld[]): Card[] {
  const layoffs: Card[] = [];
  let currentMelds = knockerMelds.map(m => ({ ...m, cards: [...m.cards] }));
  let remaining = [...deadwood];

  // Keep trying to lay off until no more possible
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = remaining.length - 1; i >= 0; i--) {
      if (canLayOff(remaining[i], currentMelds)) {
        layoffs.push(remaining[i]);
        currentMelds = applyLayOff(remaining[i], currentMelds);
        remaining.splice(i, 1);
        changed = true;
      }
    }
  }
  return layoffs;
}

// ── Component ──

export default function GinRummy() {
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [phase, setPhase] = useState<GamePhase>("difficulty");
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [opponentHand, setOpponentHand] = useState<Card[]>([]);
  const [stockPile, setStockPile] = useState<Card[]>([]);
  const [discardPile, setDiscardPile] = useState<Card[]>([]);
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [roundNumber, setRoundNumber] = useState(1);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null);
  const [gameWinner, setGameWinner] = useState<"player" | "opponent" | null>(null);
  const [message, setMessage] = useState("");
  const [playerDiscards, setPlayerDiscards] = useState<Card[]>([]);
  const [opponentDiscards, setOpponentDiscards] = useState<Card[]>([]);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [selectedCardIdx, setSelectedCardIdx] = useState<number | null>(null);
  const [layoffCards, setLayoffCards] = useState<Card[]>([]);
  const [layoffMelds, setLayoffMelds] = useState<Meld[]>([]);
  const [layoffDeadwood, setLayoffDeadwood] = useState<Card[]>([]);
  const [pendingKnockResult, setPendingKnockResult] = useState<RoundResult | null>(null);

  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const difficultyRef = useRef(difficulty);
  difficultyRef.current = difficulty;
  const dragStartRef = useRef<{ x: number; y: number; idx: number; time: number } | null>(null);
  const handRef = useRef<HTMLDivElement>(null);
  const touchHoldRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [touchDragIdx, setTouchDragIdx] = useState<number | null>(null);
  const [touchDragPos, setTouchDragPos] = useState<{ x: number; y: number } | null>(null);
  const [discardHighlight, setDiscardHighlight] = useState(false);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
      if (touchHoldRef.current) clearTimeout(touchHoldRef.current);
    };
  }, []);

  // ── Deal a new round ──

  const dealRound = useCallback(() => {
    const deck = shuffleDeck(createDeck());
    const pHand = deck.slice(0, 10);
    const oHand = deck.slice(10, 20);
    const remaining = deck.slice(20);
    const topCard = remaining.shift()!;

    setPlayerHand(pHand);
    setOpponentHand(oHand);
    setStockPile(remaining);
    setDiscardPile([topCard]);
    setHasDrawn(false);
    setIsPlayerTurn(true);
    setPhase("playing");
    setMessage("");
    setPlayerDiscards([]);
    setOpponentDiscards([]);
    setRoundResult(null);
    setSelectedCardIdx(null);
    setLayoffCards([]);
    setLayoffMelds([]);
    setLayoffDeadwood([]);
    setPendingKnockResult(null);
    setDiscardHighlight(false);
  }, []);

  // ── Start game ──

  function startGame(d: Difficulty) {
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    setDifficulty(d);
    setPlayerScore(0);
    setOpponentScore(0);
    setRoundNumber(1);
    setGameWinner(null);
    dealRound();
  }

  // ── Draw from stock ──

  function drawFromStock() {
    if (!isPlayerTurn || hasDrawn || phase !== "playing") return;
    if (stockPile.length === 0) return;

    const newStock = [...stockPile];
    const card = newStock.shift()!;
    setStockPile(newStock);
    setPlayerHand(prev => [...prev, card]);
    setHasDrawn(true);
    setPhase("discard");
    setMessage("Discard a card");
    setSelectedCardIdx(null);
  }

  // ── Draw from discard ──

  function drawFromDiscard() {
    if (!isPlayerTurn || hasDrawn || phase !== "playing") return;
    if (discardPile.length === 0) return;

    const newDiscard = [...discardPile];
    const card = newDiscard.pop()!;
    setDiscardPile(newDiscard);
    setPlayerHand(prev => [...prev, card]);
    setHasDrawn(true);
    setPhase("discard");
    setMessage("Discard a card");
    setSelectedCardIdx(null);
  }

  // ── Player discard ──

  function playerDiscard(idx: number) {
    if (phase !== "discard") return;

    const hand = [...playerHand];
    const card = hand.splice(idx, 1)[0];
    setPlayerHand(hand);
    setDiscardPile(prev => [...prev, card]);
    setPlayerDiscards(prev => [...prev, card]);
    setHasDrawn(false);
    setSelectedCardIdx(null);
    setPhase("playing");
    setMessage("");
    setDiscardHighlight(false);

    // Check if stock is depleted
    if (stockPile.length <= 2) {
      endRoundDraw();
      return;
    }

    // Switch to AI turn
    setIsPlayerTurn(false);
    triggerAITurn(hand);
  }

  // ── AI Turn ──

  const triggerAITurn = useCallback((currentPlayerHand?: Card[]) => {
    aiTimerRef.current = setTimeout(() => {
      if (phaseRef.current !== "playing") return;

      const diff = difficultyRef.current || "beginner";
      setOpponentHand(prevOppHand => {
        setStockPile(prevStock => {
          setDiscardPile(prevDiscard => {
            const topDiscard = prevDiscard.length > 0 ? prevDiscard[prevDiscard.length - 1] : null;

            // AI decides where to draw
            const drawChoice = aiDrawDecision(prevOppHand, topDiscard, diff, prevDiscard, []);

            let drawnCard: Card;
            let newStock = [...prevStock];
            let newDiscard = [...prevDiscard];

            if (drawChoice === "discard" && topDiscard) {
              drawnCard = newDiscard.pop()!;
            } else {
              if (newStock.length === 0) {
                // No stock left, must draw from discard
                if (newDiscard.length > 0) {
                  drawnCard = newDiscard.pop()!;
                } else {
                  // No cards anywhere, end round
                  setTimeout(() => endRoundDraw(), 100);
                  return prevDiscard;
                }
              } else {
                drawnCard = newStock.shift()!;
              }
            }

            const newHand = [...prevOppHand, drawnCard];

            // AI decides which card to discard
            const discardCard = aiChooseDiscard(newHand, diff, prevDiscard, []);
            const finalHand = newHand.filter(c => c.id !== discardCard.id);

            newDiscard = [...(drawChoice === "discard" && topDiscard ? newDiscard : prevDiscard.filter(c => c.id !== drawnCard.id)), discardCard];
            if (drawChoice === "stock") {
              newDiscard = [...prevDiscard, discardCard];
            } else {
              // Drew from discard (already popped), add discard card
              const base = prevDiscard.slice(0, prevDiscard.length - 1);
              newDiscard = [...base, discardCard];
            }

            // Check if AI should knock
            if (aiShouldKnock(finalHand, diff, newStock.length)) {
              setTimeout(() => {
                handleOpponentKnock(finalHand, newStock, newDiscard);
              }, 500);
            } else if (newStock.length <= 2) {
              setTimeout(() => endRoundDraw(), 500);
            } else {
              setTimeout(() => {
                setIsPlayerTurn(true);
                setMessage("");
                setPhase("playing");
              }, 300);
            }

            setOpponentHand(finalHand);
            setStockPile(newStock);
            setOpponentDiscards(prev => [...prev, discardCard]);
            return newDiscard;
          });
          return prevStock;
        });
        return prevOppHand;
      });
    }, 800 + Math.random() * 600);
  }, []);

  // ── Handle AI turn more cleanly ──

  useEffect(() => {
    if (phase === "playing" && !isPlayerTurn) {
      // AI turn is triggered via triggerAITurn after player discards
    }
  }, [phase, isPlayerTurn]);

  // ── Knock ──

  function handlePlayerKnock() {
    if (phase !== "discard") return;
    const result = findBestMeldArrangement(playerHand);
    if (result.deadwoodPoints > 10) return;

    const isGin = result.deadwoodPoints === 0;

    // Find opponent's melds
    const oppResult = findBestMeldArrangement(opponentHand);

    if (isGin) {
      // No layoffs allowed for Gin
      const pointsAwarded = oppResult.deadwoodPoints + GIN_BONUS;
      const roundRes: RoundResult = {
        playerMelds: result.melds,
        playerDeadwood: result.deadwood,
        playerDeadwoodPoints: result.deadwoodPoints,
        opponentMelds: oppResult.melds,
        opponentDeadwood: oppResult.deadwood,
        opponentDeadwoodPoints: oppResult.deadwoodPoints,
        knocker: "player",
        isGin: true,
        isUndercut: false,
        pointsAwarded,
        winner: "player",
        layoffs: [],
      };
      finishRound(roundRes);
    } else {
      // Opponent gets to lay off - AI does it automatically
      const layoffs = aiLayOff(oppResult.deadwood, result.melds);
      const remainingDeadwood = oppResult.deadwood.filter(c => !layoffs.some(l => l.id === c.id));
      const oppDWAfterLayoff = totalDeadwood(remainingDeadwood);

      const isUndercut = oppDWAfterLayoff <= result.deadwoodPoints;
      let pointsAwarded: number;
      let winner: "player" | "opponent";

      if (isUndercut) {
        pointsAwarded = result.deadwoodPoints - oppDWAfterLayoff + UNDERCUT_BONUS;
        winner = "opponent";
      } else {
        pointsAwarded = result.deadwoodPoints === 0 ? oppDWAfterLayoff + GIN_BONUS : result.deadwoodPoints > 0 ? (oppDWAfterLayoff - result.deadwoodPoints) : oppDWAfterLayoff;
        // Correction: knocker gets difference in deadwood
        pointsAwarded = oppDWAfterLayoff - result.deadwoodPoints;
        winner = "player";
      }

      const roundRes: RoundResult = {
        playerMelds: result.melds,
        playerDeadwood: result.deadwood,
        playerDeadwoodPoints: result.deadwoodPoints,
        opponentMelds: oppResult.melds,
        opponentDeadwood: remainingDeadwood,
        opponentDeadwoodPoints: oppDWAfterLayoff,
        knocker: "player",
        isGin: false,
        isUndercut,
        pointsAwarded,
        winner,
        layoffs,
      };
      finishRound(roundRes);
    }
  }

  function handleOpponentKnock(oppHand: Card[], stock: Card[], discard: Card[]) {
    const oppResult = findBestMeldArrangement(oppHand);
    const isGin = oppResult.deadwoodPoints === 0;

    if (isGin) {
      const playerResult = findBestMeldArrangement(playerHand);
      const pointsAwarded = playerResult.deadwoodPoints + GIN_BONUS;
      const roundRes: RoundResult = {
        playerMelds: playerResult.melds,
        playerDeadwood: playerResult.deadwood,
        playerDeadwoodPoints: playerResult.deadwoodPoints,
        opponentMelds: oppResult.melds,
        opponentDeadwood: oppResult.deadwood,
        opponentDeadwoodPoints: oppResult.deadwoodPoints,
        knocker: "opponent",
        isGin: true,
        isUndercut: false,
        pointsAwarded,
        winner: "opponent",
        layoffs: [],
      };
      finishRound(roundRes);
    } else {
      // Player gets to lay off
      const playerResult = findBestMeldArrangement(playerHand);
      setLayoffMelds(oppResult.melds);
      setLayoffDeadwood(playerResult.deadwood);
      setLayoffCards([]);
      setPendingKnockResult({
        playerMelds: playerResult.melds,
        playerDeadwood: playerResult.deadwood,
        playerDeadwoodPoints: playerResult.deadwoodPoints,
        opponentMelds: oppResult.melds,
        opponentDeadwood: oppResult.deadwood,
        opponentDeadwoodPoints: oppResult.deadwoodPoints,
        knocker: "opponent",
        isGin: false,
        isUndercut: false,
        pointsAwarded: 0,
        winner: "opponent",
        layoffs: [],
      });
      setPhase("layoff");
      setMessage("Lay off cards on PEPE's melds, then click Done");
    }
  }

  function toggleLayoff(card: Card) {
    if (phase !== "layoff") return;
    const currentMelds = applyMultipleLayoffs(layoffCards, layoffMelds);
    if (layoffCards.some(c => c.id === card.id)) {
      // Remove from layoffs
      setLayoffCards(prev => prev.filter(c => c.id !== card.id));
    } else if (canLayOff(card, currentMelds)) {
      setLayoffCards(prev => [...prev, card]);
    }
  }

  function applyMultipleLayoffs(cards: Card[], baseMelds: Meld[]): Meld[] {
    let melds = baseMelds.map(m => ({ ...m, cards: [...m.cards] }));
    for (const card of cards) {
      melds = applyLayOff(card, melds);
    }
    return melds;
  }

  function confirmLayoff() {
    if (!pendingKnockResult) return;

    const pResult = findBestMeldArrangement(playerHand);
    const remainingDW = pResult.deadwood.filter(c => !layoffCards.some(l => l.id === c.id));
    const playerDWAfterLayoff = totalDeadwood(remainingDW);
    const oppDW = pendingKnockResult.opponentDeadwoodPoints;

    const isUndercut = playerDWAfterLayoff <= oppDW;
    let pointsAwarded: number;
    let winner: "player" | "opponent";

    if (isUndercut) {
      pointsAwarded = oppDW - playerDWAfterLayoff + UNDERCUT_BONUS;
      winner = "player";
    } else {
      pointsAwarded = playerDWAfterLayoff - oppDW;
      winner = "opponent";
    }

    const roundRes: RoundResult = {
      ...pendingKnockResult,
      playerDeadwood: remainingDW,
      playerDeadwoodPoints: playerDWAfterLayoff,
      isUndercut,
      pointsAwarded,
      winner,
      layoffs: layoffCards,
    };
    finishRound(roundRes);
  }

  // ── Finish round ──

  function finishRound(result: RoundResult) {
    setRoundResult(result);

    if (result.winner === "player") {
      const newScore = playerScore + result.pointsAwarded;
      setPlayerScore(newScore);
      if (newScore >= WINNING_SCORE) {
        setGameWinner("player");
        setPhase("gameOver");
        return;
      }
    } else if (result.winner === "opponent") {
      const newScore = opponentScore + result.pointsAwarded;
      setOpponentScore(newScore);
      if (newScore >= WINNING_SCORE) {
        setGameWinner("opponent");
        setPhase("gameOver");
        return;
      }
    }

    setPhase("roundEnd");
  }

  // ── Draw (no winner) ──

  function endRoundDraw() {
    const playerResult = findBestMeldArrangement(playerHand);
    const oppResult = findBestMeldArrangement(opponentHand);
    const result: RoundResult = {
      playerMelds: playerResult.melds,
      playerDeadwood: playerResult.deadwood,
      playerDeadwoodPoints: playerResult.deadwoodPoints,
      opponentMelds: oppResult.melds,
      opponentDeadwood: oppResult.deadwood,
      opponentDeadwoodPoints: oppResult.deadwoodPoints,
      knocker: "player",
      isGin: false,
      isUndercut: false,
      pointsAwarded: 0,
      winner: "draw",
      layoffs: [],
    };
    setRoundResult(result);
    setPhase("roundEnd");
  }

  // ── Next round ──

  function nextRound() {
    setRoundNumber(prev => prev + 1);
    dealRound();
  }

  // ── Hand reordering (desktop drag) ──

  function handleDragStart(e: React.DragEvent, idx: number) {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(idx));
    setDragIdx(idx);
  }

  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIdx(idx);
  }

  function handleDrop(e: React.DragEvent, targetIdx: number) {
    e.preventDefault();
    const sourceIdx = dragIdx;
    if (sourceIdx === null || sourceIdx === targetIdx) {
      setDragIdx(null);
      setDragOverIdx(null);
      return;
    }

    setPlayerHand(prev => {
      const hand = [...prev];
      const [card] = hand.splice(sourceIdx, 1);
      hand.splice(targetIdx, 0, card);
      return hand;
    });
    setDragIdx(null);
    setDragOverIdx(null);
  }

  function handleDragEnd() {
    setDragIdx(null);
    setDragOverIdx(null);
  }

  // ── Drag card to discard pile ──

  function handleDiscardDragOver(e: React.DragEvent) {
    if (phase !== "discard") return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDiscardHighlight(true);
  }

  function handleDiscardDragLeave() {
    setDiscardHighlight(false);
  }

  function handleDiscardDrop(e: React.DragEvent) {
    e.preventDefault();
    setDiscardHighlight(false);
    if (phase !== "discard" || dragIdx === null) return;
    playerDiscard(dragIdx);
  }

  // ── Touch-based reordering (mobile) ──

  function handleTouchStart(e: React.TouchEvent, idx: number) {
    const touch = e.touches[0];
    dragStartRef.current = { x: touch.clientX, y: touch.clientY, idx, time: Date.now() };

    // Long press to start drag
    touchHoldRef.current = setTimeout(() => {
      setTouchDragIdx(idx);
      setTouchDragPos({ x: touch.clientX, y: touch.clientY });
    }, 300);
  }

  function handleTouchMove(e: React.TouchEvent) {
    const touch = e.touches[0];
    if (touchDragIdx !== null) {
      e.preventDefault();
      setTouchDragPos({ x: touch.clientX, y: touch.clientY });

      // Find which card index we're over
      if (handRef.current) {
        const cards = handRef.current.querySelectorAll("[data-card-idx]");
        for (const el of Array.from(cards)) {
          const rect = el.getBoundingClientRect();
          if (touch.clientX >= rect.left && touch.clientX <= rect.right) {
            const overIdx = parseInt(el.getAttribute("data-card-idx") || "-1");
            if (overIdx >= 0 && overIdx !== touchDragIdx) {
              setDragOverIdx(overIdx);
            }
            break;
          }
        }
      }
    } else if (dragStartRef.current) {
      const dx = touch.clientX - dragStartRef.current.x;
      const dy = touch.clientY - dragStartRef.current.y;
      if (Math.sqrt(dx * dx + dy * dy) > 10) {
        if (touchHoldRef.current) clearTimeout(touchHoldRef.current);
      }
    }
  }

  function handleTouchEnd() {
    if (touchHoldRef.current) clearTimeout(touchHoldRef.current);

    if (touchDragIdx !== null && dragOverIdx !== null && touchDragIdx !== dragOverIdx) {
      setPlayerHand(prev => {
        const hand = [...prev];
        const [card] = hand.splice(touchDragIdx, 1);
        hand.splice(dragOverIdx, 0, card);
        return hand;
      });
    }

    setTouchDragIdx(null);
    setTouchDragPos(null);
    setDragOverIdx(null);
    dragStartRef.current = null;
  }

  // ── Card click/tap handling ──

  function handleCardTap(idx: number) {
    if (touchDragIdx !== null) return; // Ignore taps during drag

    if (phase === "discard") {
      if (selectedCardIdx === idx) {
        // Second tap = confirm discard
        playerDiscard(idx);
      } else {
        setSelectedCardIdx(idx);
      }
    } else if (phase === "playing" && !hasDrawn) {
      // During play phase before drawing, taps on hand do nothing for draw
      // (draw is from stock/discard pile)
    }
  }

  // ── Knock eligibility ──

  const canKnock = phase === "discard" && findBestMeldArrangement(playerHand).deadwoodPoints <= 10;
  const isGinReady = phase === "discard" && findBestMeldArrangement(playerHand).deadwoodPoints === 0;
  const currentDeadwood = findBestMeldArrangement(playerHand).deadwoodPoints;

  // ── Card rendering ──

  function CardFace({ card, small, highlight, dimmed, selected, onClick, draggable, onDragStart: onDS, onDragOver: onDO, onDrop: onDr, onDragEnd: onDE, idx }: {
    card: Card; small?: boolean; highlight?: boolean; dimmed?: boolean; selected?: boolean;
    onClick?: () => void; draggable?: boolean;
    onDragStart?: (e: React.DragEvent) => void;
    onDragOver?: (e: React.DragEvent) => void;
    onDrop?: (e: React.DragEvent) => void;
    onDragEnd?: () => void;
    idx?: number;
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
        draggable={draggable}
        onDragStart={onDS}
        onDragOver={onDO}
        onDrop={onDr}
        onDragEnd={onDE}
        data-card-idx={idx}
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
          cursor: onClick ? "pointer" : draggable ? "grab" : "default",
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
    const w = small ? 40 : 52;
    const h = small ? 56 : 72;
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
        <span style={{ fontSize: small ? 10 : 12, fontWeight: 800, color: GREEN, opacity: 0.3 }}>W</span>
      </div>
    );
  }

  // ── Meld display for round end ──

  function MeldDisplay({ melds, deadwood, label }: { melds: Meld[]; deadwood: Card[]; label: string }) {
    return (
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-bold text-gray-300">{label}</span>
        {melds.map((meld, mi) => (
          <div key={mi} className="flex gap-0.5 items-center">
            <span className="text-gray-500 text-xs mr-1" style={{ fontSize: 9 }}>
              {meld.type === "set" ? "Set" : "Run"}:
            </span>
            {meld.cards.map(c => (
              <div key={c.id} style={{ marginLeft: -3, marginRight: -3 }}>
                <CardFace card={c} small />
              </div>
            ))}
          </div>
        ))}
        {deadwood.length > 0 && (
          <div className="flex gap-0.5 items-center flex-wrap">
            <span className="text-gray-500 text-xs mr-1" style={{ fontSize: 9 }}>Deadwood:</span>
            {deadwood.map(c => (
              <div key={c.id} style={{ marginLeft: -3, marginRight: -3, opacity: 0.6 }}>
                <CardFace card={c} small />
              </div>
            ))}
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
            Gin Rummy — WOJAK vs PEPE
          </div>
          <div className="text-gray-500 text-xs text-center max-w-sm">
            Classic Gin Rummy. Form melds (sets and runs), reduce your deadwood to knock or go for Gin. First to {WINNING_SCORE} points wins!
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

      {/* Active game header */}
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
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-wojak-card/60 border border-wojak-border/50">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-wojak-card border border-wojak-border overflow-hidden flex-shrink-0">
                <img src={WOJAK_AVATAR} alt="WOJAK" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              </div>
              <div className="flex flex-col">
                <span className="text-green-300 font-bold" style={{ fontSize: 10 }}>WOJAK</span>
                <span style={{ color: GREEN, fontWeight: 700 }}>{playerScore}</span>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center">
              <span className="text-gray-500 text-xs">Round {roundNumber}</span>
              <span className="text-gray-600" style={{ fontSize: 9 }}>First to {WINNING_SCORE}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-wojak-card/60 border border-wojak-border/50">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-wojak-card border border-wojak-border overflow-hidden flex-shrink-0">
                <img src={PEPE_AVATAR} alt="PEPE" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              </div>
              <div className="flex flex-col">
                <span className="text-white font-bold" style={{ fontSize: 10 }}>PEPE</span>
                <span style={{ color: WHITE, fontWeight: 700 }}>{opponentScore}</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Game table */}
      {(phase === "playing" || phase === "discard") && (
        <div className="flex flex-col items-center gap-2 w-full">
          <div
            className="relative w-full rounded-2xl p-3 sm:p-4"
            style={{
              backgroundColor: "#0a120a",
              border: "2px solid rgba(0,255,65,0.15)",
              boxShadow: "inset 0 0 60px rgba(0,255,65,0.03), 0 0 20px rgba(0,0,0,0.5)",
            }}
          >
            {/* PEPE's hand (face down) */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-wojak-card border border-wojak-border overflow-hidden flex-shrink-0">
                  <img src={PEPE_AVATAR} alt="PEPE" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                </div>
                <div className="flex flex-col">
                  <span className={`text-xs font-bold ${!isPlayerTurn ? "text-wojak-green" : "text-white"}`}>
                    PEPE
                    {!isPlayerTurn && <span className="text-yellow-400 animate-pulse ml-1">...</span>}
                  </span>
                  <span className="text-gray-500" style={{ fontSize: 9 }}>{opponentHand.length} cards</span>
                </div>
              </div>
              <div className="flex gap-px ml-2 overflow-hidden">
                {opponentHand.slice(0, 10).map((_, i) => (
                  <div key={i} style={{ marginLeft: i > 0 ? -22 : 0 }}>
                    <CardBack small />
                  </div>
                ))}
              </div>
            </div>

            {/* Stock + Discard piles */}
            <div className="flex items-center justify-center gap-4 sm:gap-6 my-3">
              {/* Stock pile */}
              <div className="flex flex-col items-center gap-1">
                <div
                  onClick={phase === "playing" && isPlayerTurn && !hasDrawn ? drawFromStock : undefined}
                  style={{
                    cursor: phase === "playing" && isPlayerTurn && !hasDrawn ? "pointer" : "default",
                    position: "relative",
                  }}
                  className={phase === "playing" && isPlayerTurn && !hasDrawn ? "hover:scale-105 transition-transform" : ""}
                >
                  {stockPile.length > 0 ? (
                    <div style={{ position: "relative" }}>
                      {stockPile.length > 2 && (
                        <div style={{ position: "absolute", top: -2, left: -2, zIndex: 0 }}>
                          <CardBack />
                        </div>
                      )}
                      {stockPile.length > 1 && (
                        <div style={{ position: "absolute", top: -1, left: -1, zIndex: 1 }}>
                          <CardBack />
                        </div>
                      )}
                      <div style={{ position: "relative", zIndex: 2 }}>
                        <CardBack />
                      </div>
                      {phase === "playing" && isPlayerTurn && !hasDrawn && (
                        <div style={{
                          position: "absolute", inset: 0, zIndex: 3,
                          borderRadius: 5,
                          border: `2px solid ${GREEN}`,
                          boxShadow: `0 0 10px rgba(0,255,65,0.3)`,
                          pointerEvents: "none",
                        }} />
                      )}
                    </div>
                  ) : (
                    <div style={{
                      width: 52, height: 72,
                      borderRadius: 5,
                      border: "1.5px dashed rgba(0,255,65,0.2)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <span className="text-gray-600 text-xs">Empty</span>
                    </div>
                  )}
                </div>
                <span className="text-gray-500" style={{ fontSize: 9 }}>Stock ({stockPile.length})</span>
              </div>

              {/* Discard pile */}
              <div className="flex flex-col items-center gap-1">
                <div
                  onClick={phase === "playing" && isPlayerTurn && !hasDrawn && discardPile.length > 0 ? drawFromDiscard : undefined}
                  onDragOver={handleDiscardDragOver}
                  onDragLeave={handleDiscardDragLeave}
                  onDrop={handleDiscardDrop}
                  style={{
                    cursor: phase === "playing" && isPlayerTurn && !hasDrawn && discardPile.length > 0 ? "pointer" : "default",
                    position: "relative",
                  }}
                  className={phase === "playing" && isPlayerTurn && !hasDrawn && discardPile.length > 0 ? "hover:scale-105 transition-transform" : ""}
                >
                  {discardPile.length > 0 ? (
                    <div style={{ position: "relative" }}>
                      <CardFace
                        card={discardPile[discardPile.length - 1]}
                        highlight={phase === "playing" && isPlayerTurn && !hasDrawn}
                      />
                      {discardHighlight && (
                        <div style={{
                          position: "absolute", inset: -2,
                          borderRadius: 7,
                          border: `2px dashed ${GREEN}`,
                          boxShadow: `0 0 15px rgba(0,255,65,0.4)`,
                          pointerEvents: "none",
                        }} />
                      )}
                    </div>
                  ) : (
                    <div style={{
                      width: 52, height: 72,
                      borderRadius: 5,
                      border: "1.5px dashed rgba(0,255,65,0.2)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <span className="text-gray-600 text-xs">Empty</span>
                    </div>
                  )}
                </div>
                <span className="text-gray-500" style={{ fontSize: 9 }}>Discard</span>
              </div>
            </div>

            {/* Player info + hand */}
            <div className="flex items-center gap-2 mt-3 mb-1">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-wojak-card border border-wojak-border overflow-hidden flex-shrink-0">
                  <img src={WOJAK_AVATAR} alt="WOJAK" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                </div>
                <div className="flex flex-col">
                  <span className={`text-xs font-bold ${isPlayerTurn ? "text-wojak-green" : "text-white"}`}>
                    WOJAK
                  </span>
                  <span className="text-gray-500" style={{ fontSize: 9 }}>
                    Deadwood: {currentDeadwood}
                  </span>
                </div>
              </div>
            </div>

            {/* Player's hand */}
            <div
              ref={handRef}
              className="flex gap-0.5 flex-wrap justify-center max-w-full pb-1"
              style={{ minHeight: 80 }}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {playerHand.map((card, idx) => {
                const isSel = selectedCardIdx === idx;
                const isDragSource = dragIdx === idx || touchDragIdx === idx;
                const isDragTarget = dragOverIdx === idx;
                return (
                  <div
                    key={card.id}
                    style={{
                      marginLeft: -6,
                      marginRight: -6,
                      transform: isSel ? "translateY(-8px)" : isDragTarget ? "translateX(8px)" : "translateY(0)",
                      transition: "transform 0.15s",
                      zIndex: isSel ? 10 : isDragSource ? 20 : 1,
                      opacity: isDragSource ? 0.4 : 1,
                    }}
                    className={phase === "discard" ? "hover:-translate-y-2" : ""}
                    onTouchStart={(e) => handleTouchStart(e, idx)}
                  >
                    <CardFace
                      card={card}
                      selected={isSel}
                      onClick={() => handleCardTap(idx)}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDrop={(e) => handleDrop(e, idx)}
                      onDragEnd={handleDragEnd}
                      idx={idx}
                    />
                  </div>
                );
              })}
            </div>

            {/* Touch drag ghost */}
            {touchDragIdx !== null && touchDragPos && (
              <div
                style={{
                  position: "fixed",
                  left: touchDragPos.x - 26,
                  top: touchDragPos.y - 36,
                  zIndex: 1000,
                  pointerEvents: "none",
                  opacity: 0.8,
                }}
              >
                <CardFace card={playerHand[touchDragIdx]} highlight />
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {/* Knock / Gin button */}
            {canKnock && (
              <button
                onClick={handlePlayerKnock}
                className="px-4 py-2 rounded-lg font-bold text-sm transition-all"
                style={{
                  backgroundColor: isGinReady ? GREEN : "rgba(0,255,65,0.15)",
                  color: isGinReady ? "#000" : GREEN,
                  border: `1.5px solid ${GREEN}`,
                  boxShadow: isGinReady ? `0 0 20px rgba(0,255,65,0.4)` : `0 0 8px rgba(0,255,65,0.2)`,
                }}
              >
                {isGinReady ? "GIN!" : `Knock (${currentDeadwood})`}
              </button>
            )}
          </div>

          {/* Message */}
          {message && (
            <div className="text-gray-400 text-xs text-center">{message}</div>
          )}

          {/* Instructions */}
          <div className="text-gray-500 text-xs text-center max-w-md px-2">
            <span className="hidden sm:inline">
              {phase === "playing" && !hasDrawn && isPlayerTurn
                ? "Click the stock pile or discard pile to draw a card. Drag cards to rearrange your hand."
                : phase === "discard"
                ? "Click a card to select, click again to discard. Or drag a card to the discard pile."
                : !isPlayerTurn
                ? "PEPE is thinking..."
                : ""}
            </span>
            <span className="sm:hidden">
              {phase === "playing" && !hasDrawn && isPlayerTurn
                ? "Tap stock or discard to draw. Hold and drag to rearrange."
                : phase === "discard"
                ? "Tap a card to select, tap again to discard."
                : !isPlayerTurn
                ? "PEPE is thinking..."
                : ""}
            </span>
          </div>
        </div>
      )}

      {/* Layoff phase */}
      {phase === "layoff" && pendingKnockResult && (
        <div className="flex flex-col items-center gap-3 w-full">
          <div
            className="bg-wojak-card border border-wojak-border rounded-xl p-4 sm:p-6 max-w-md w-full"
            style={{ boxShadow: "0 0 20px rgba(0,255,65,0.1)" }}
          >
            <div className="text-center mb-3">
              <span className="text-white font-bold text-sm">PEPE Knocks!</span>
              <span className="text-gray-400 text-xs block mt-1">
                Deadwood: {pendingKnockResult.opponentDeadwoodPoints}
              </span>
            </div>

            {/* Opponent's melds */}
            <div className="mb-3">
              <MeldDisplay
                melds={pendingKnockResult.opponentMelds}
                deadwood={pendingKnockResult.opponentDeadwood}
                label="PEPE's Melds"
              />
            </div>

            <div className="border-t border-wojak-border pt-3 mt-3">
              <span className="text-gray-300 text-xs font-bold block mb-2">
                Select cards to lay off on PEPE&apos;s melds:
              </span>
              <div className="flex gap-0.5 flex-wrap justify-center">
                {layoffDeadwood.map(card => {
                  const currentMelds = applyMultipleLayoffs(
                    layoffCards.filter(c => c.id !== card.id),
                    pendingKnockResult.opponentMelds
                  );
                  const isLayoff = layoffCards.some(c => c.id === card.id);
                  const canDo = isLayoff || canLayOff(card, applyMultipleLayoffs(layoffCards, pendingKnockResult.opponentMelds));
                  return (
                    <div key={card.id} style={{ marginLeft: -3, marginRight: -3 }}>
                      <CardFace
                        card={card}
                        selected={isLayoff}
                        dimmed={!canDo && !isLayoff}
                        onClick={canDo || isLayoff ? () => toggleLayoff(card) : undefined}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-center mt-4">
              <button
                onClick={confirmLayoff}
                className="px-6 py-2 rounded-lg font-bold text-sm transition-colors"
                style={{ backgroundColor: GREEN, color: "#000" }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Round end */}
      {phase === "roundEnd" && roundResult && (
        <div className="flex flex-col items-center gap-3 py-2">
          <div
            className="bg-wojak-card border border-wojak-border rounded-xl p-4 sm:p-6 max-w-md w-full"
            style={{ boxShadow: "0 0 20px rgba(0,255,65,0.1)" }}
          >
            <div className="text-center mb-3">
              {roundResult.winner === "draw" ? (
                <span className="text-gray-300 font-bold text-base">Round Draw</span>
              ) : (
                <>
                  <span
                    className="font-bold text-base"
                    style={{ color: roundResult.winner === "player" ? GREEN : "#ff6b6b" }}
                  >
                    {roundResult.winner === "player" ? "WOJAK" : "PEPE"}{" "}
                    {roundResult.isGin ? "gets Gin!" : roundResult.isUndercut ? "Undercut!" : "Wins Round!"}
                  </span>
                  <span className="text-gray-400 text-xs block mt-1">
                    +{roundResult.pointsAwarded} points
                    {roundResult.isGin && " (includes 25 Gin bonus)"}
                    {roundResult.isUndercut && " (includes 25 undercut bonus)"}
                  </span>
                </>
              )}
            </div>

            {/* Player melds */}
            <div className="mb-3">
              <MeldDisplay
                melds={roundResult.playerMelds}
                deadwood={roundResult.playerDeadwood}
                label={`WOJAK — Deadwood: ${roundResult.playerDeadwoodPoints}`}
              />
            </div>

            <div className="border-t border-wojak-border pt-3">
              <MeldDisplay
                melds={roundResult.opponentMelds}
                deadwood={roundResult.opponentDeadwood}
                label={`PEPE — Deadwood: ${roundResult.opponentDeadwoodPoints}`}
              />
            </div>

            {roundResult.layoffs.length > 0 && (
              <div className="border-t border-wojak-border pt-2 mt-2">
                <span className="text-gray-500 text-xs">
                  Laid off: {roundResult.layoffs.map(c => `${RANK_NAMES[c.rank]}${SUIT_SYMBOLS[c.suit]}`).join(", ")}
                </span>
              </div>
            )}
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
            className={`bg-wojak-dark border rounded-xl p-6 sm:p-8 flex flex-col items-center gap-4 mx-4 ${gameWinner === "player" ? "animate-bounce" : ""}`}
            style={{
              borderColor: gameWinner === "player" ? "rgba(0,255,65,0.4)" : "rgba(255,50,50,0.4)",
              boxShadow: gameWinner === "player"
                ? "0 0 40px rgba(0,255,65,0.3), 0 0 80px rgba(0,255,65,0.1)"
                : "0 0 40px rgba(255,50,50,0.2)",
            }}
          >
            <div className="w-16 h-16 rounded-full bg-wojak-card border-2 overflow-hidden" style={{
              borderColor: gameWinner === "player" ? GREEN : "#ff6b6b",
            }}>
              <img
                src={gameWinner === "player" ? WOJAK_AVATAR : PEPE_AVATAR}
                alt={gameWinner === "player" ? "WOJAK" : "PEPE"}
                className="w-full h-full object-cover"
              />
            </div>
            <div
              className="text-2xl sm:text-3xl font-bold"
              style={{ color: gameWinner === "player" ? GREEN : "#ff6b6b" }}
            >
              {gameWinner === "player" ? "You Win!" : "Game Over"}
            </div>
            <div className="text-gray-400 text-sm sm:text-base text-center">
              {gameWinner === "player"
                ? `WOJAK wins with ${playerScore} points!`
                : `PEPE wins with ${opponentScore} points.`}
            </div>
            <div className="flex gap-4 text-sm">
              <span style={{ color: GREEN }}>WOJAK: {playerScore}</span>
              <span className="text-gray-500">|</span>
              <span className="text-white">PEPE: {opponentScore}</span>
            </div>

            {roundResult && (
              <div className="bg-wojak-card border border-wojak-border rounded-lg p-3 w-full max-w-xs">
                <div className="text-center mb-2">
                  <span className="text-gray-300 text-xs font-bold">Final Round</span>
                </div>
                <MeldDisplay melds={roundResult.playerMelds} deadwood={roundResult.playerDeadwood} label="WOJAK" />
                <div className="border-t border-wojak-border pt-2 mt-2">
                  <MeldDisplay melds={roundResult.opponentMelds} deadwood={roundResult.opponentDeadwood} label="PEPE" />
                </div>
              </div>
            )}

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
    </div>
  );
}
