"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ── Types ──

type Suit = "spades" | "hearts" | "diamonds" | "clubs";
type Difficulty = "beginner" | "advanced" | "expert" | "master";
type GamePhase = "difficulty" | "betting" | "insurance" | "playerTurn" | "dealerTurn" | "result" | "gameOver";
type HandResult = "win" | "lose" | "push" | "blackjack" | null;

interface Card {
  suit: Suit;
  rank: number; // 1=A, 2-10, 11=J, 12=Q, 13=K
  id: string;
}

interface Hand {
  cards: Card[];
  bet: number;
  result: HandResult;
  doubled: boolean;
  stood: boolean;
  fromSplit: boolean;
}

interface DifficultyConfig {
  decks: number;
  dealerHitsSoft17: boolean;
  blackjackPays: [number, number];
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

const STARTING_CHIPS = 1000;
const CHIP_VALUES = [10, 25, 50, 100];

const DIFFICULTIES: { key: Difficulty; label: string }[] = [
  { key: "beginner", label: "Beginner" },
  { key: "advanced", label: "Advanced" },
  { key: "expert", label: "Expert" },
  { key: "master", label: "Master" },
];

const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  beginner: { decks: 1, dealerHitsSoft17: false, blackjackPays: [3, 2] },
  advanced: { decks: 2, dealerHitsSoft17: false, blackjackPays: [3, 2] },
  expert: { decks: 4, dealerHitsSoft17: true, blackjackPays: [3, 2] },
  master: { decks: 6, dealerHitsSoft17: true, blackjackPays: [6, 5] },
};

// ── Helpers ──

let cardIdCounter = 0;

function isRedSuit(suit: Suit): boolean {
  return suit === "hearts" || suit === "diamonds";
}

function cardColor(suit: Suit): string {
  return isRedSuit(suit) ? WHITE : GREEN;
}

function createShoe(numDecks: number): Card[] {
  const cards: Card[] = [];
  for (let d = 0; d < numDecks; d++) {
    for (const suit of SUITS) {
      for (let rank = 1; rank <= 13; rank++) {
        cards.push({ suit, rank, id: `c${cardIdCounter++}` });
      }
    }
  }
  return shuffleArray(cards);
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function cardPointValue(rank: number): number {
  if (rank === 1) return 11;
  if (rank >= 10) return 10;
  return rank;
}

function handValue(cards: Card[]): { value: number; soft: boolean } {
  let total = 0;
  let aces = 0;
  for (const card of cards) {
    total += cardPointValue(card.rank);
    if (card.rank === 1) aces++;
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return { value: total, soft: aces > 0 };
}

function isBlackjack(cards: Card[]): boolean {
  return cards.length === 2 && handValue(cards).value === 21;
}

function isBusted(cards: Card[]): boolean {
  return handValue(cards).value > 21;
}

function handValueStr(cards: Card[]): string {
  const { value, soft } = handValue(cards);
  if (isBlackjack(cards)) return "BJ";
  if (value > 21) return String(value);
  if (soft) return `${value - 10}/${value}`;
  return String(value);
}

// ── Component ──

export default function Blackjack() {
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [phase, setPhase] = useState<GamePhase>("difficulty");
  const [chips, setChips] = useState(STARTING_CHIPS);
  const [shoe, setShoe] = useState<Card[]>([]);
  const [playerHands, setPlayerHands] = useState<Hand[]>([]);
  const [activeHandIdx, setActiveHandIdx] = useState(0);
  const [dealerCards, setDealerCards] = useState<Card[]>([]);
  const [dealerHoleRevealed, setDealerHoleRevealed] = useState(false);
  const [betAmount, setBetAmount] = useState(0);
  const [customBet, setCustomBet] = useState("");
  const [insuranceBet, setInsuranceBet] = useState(0);
  const [message, setMessage] = useState("");
  const [resultLines, setResultLines] = useState<string[]>([]);
  const [netResult, setNetResult] = useState(0);
  const [newCardIds, setNewCardIds] = useState<Set<string>>(new Set());
  const [revealHole, setRevealHole] = useState(false);
  const [handNum, setHandNum] = useState(0);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerRef2 = useRef<ReturnType<typeof setTimeout> | null>(null);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const chipsRef = useRef(chips);
  chipsRef.current = chips;
  const shoeRef = useRef(shoe);
  shoeRef.current = shoe;
  const dealerCardsRef = useRef(dealerCards);
  dealerCardsRef.current = dealerCards;

  const config = difficulty ? DIFFICULTY_CONFIGS[difficulty] : DIFFICULTY_CONFIGS.beginner;

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (timerRef2.current) clearTimeout(timerRef2.current);
    };
  }, []);

  // Auto game-over when chips hit 0 during result
  useEffect(() => {
    if (phase === "result" && chips <= 0) {
      const t = setTimeout(() => setPhase("gameOver"), 1800);
      return () => clearTimeout(t);
    }
  }, [phase, chips]);

  // ── Animation helper ──
  function animateCards(ids: string[]) {
    setNewCardIds(new Set(ids));
    setTimeout(() => setNewCardIds(new Set()), 500);
  }

  // Ensure shoe has enough cards
  function ensureShoe(s: Card[]): Card[] {
    if (s.length < Math.max(20, config.decks * 13)) {
      return createShoe(config.decks);
    }
    return s;
  }

  // ── Start Game ──
  function startGame(d: Difficulty) {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (timerRef2.current) clearTimeout(timerRef2.current);
    setDifficulty(d);
    setChips(STARTING_CHIPS);
    setShoe(createShoe(DIFFICULTY_CONFIGS[d].decks));
    setPhase("betting");
    setBetAmount(0);
    setCustomBet("");
    setPlayerHands([]);
    setDealerCards([]);
    setDealerHoleRevealed(false);
    setMessage("");
    setResultLines([]);
    setNetResult(0);
    setInsuranceBet(0);
    setActiveHandIdx(0);
    setRevealHole(false);
    setHandNum(0);
  }

  // ── New Hand ──
  function newHand() {
    if (chips <= 0) {
      setPhase("gameOver");
      return;
    }
    setPhase("betting");
    setBetAmount(0);
    setCustomBet("");
    setPlayerHands([]);
    setDealerCards([]);
    setDealerHoleRevealed(false);
    setMessage("");
    setResultLines([]);
    setNetResult(0);
    setInsuranceBet(0);
    setActiveHandIdx(0);
    setRevealHole(false);
    setHandNum(prev => prev + 1);
  }

  // ── Betting ──
  function addChipToBet(amount: number) {
    setBetAmount(prev => Math.min(prev + amount, chips));
  }

  function handleAllIn() {
    setBetAmount(chips);
  }

  function clearBet() {
    setBetAmount(0);
    setCustomBet("");
  }

  function applyCustomBet() {
    const val = parseInt(customBet);
    if (!isNaN(val) && val > 0) {
      setBetAmount(Math.min(val, chips));
    }
    setCustomBet("");
  }

  // ── Deal ──
  function deal() {
    if (betAmount <= 0 || betAmount > chips) return;

    let s = ensureShoe([...shoe]);

    const pc1 = s.shift()!;
    const dc1 = s.shift()!;
    const pc2 = s.shift()!;
    const dc2 = s.shift()!;

    const newChips = chips - betAmount;
    setChips(newChips);
    setShoe(s);

    const hand: Hand = {
      cards: [pc1, pc2],
      bet: betAmount,
      result: null,
      doubled: false,
      stood: false,
      fromSplit: false,
    };
    setPlayerHands([hand]);
    setDealerCards([dc1, dc2]);
    setDealerHoleRevealed(false);
    setActiveHandIdx(0);
    setInsuranceBet(0);
    setResultLines([]);
    setNetResult(0);
    setRevealHole(false);

    animateCards([pc1.id, dc1.id, pc2.id, dc2.id]);

    // Dealer shows Ace → insurance
    if (dc1.rank === 1) {
      setPhase("insurance");
      setMessage("Dealer shows an Ace — Insurance?");
      return;
    }

    resolveNaturals([hand], [dc1, dc2], newChips, 0, s);
  }

  // ── Insurance ──
  function acceptInsurance() {
    const insBet = Math.floor(betAmount / 2);
    const newChips = chips - insBet;
    setChips(newChips);
    setInsuranceBet(insBet);
    resolveNaturals(playerHands, dealerCards, newChips, insBet, shoe);
  }

  function declineInsurance() {
    setInsuranceBet(0);
    resolveNaturals(playerHands, dealerCards, chips, 0, shoe);
  }

  function resolveNaturals(
    hands: Hand[],
    dc: Card[],
    currentChips: number,
    insBet: number,
    currentShoe: Card[],
  ) {
    const playerBJ = isBlackjack(hands[0].cards);
    const dealerBJ = isBlackjack(dc);

    if (dealerBJ) {
      setDealerHoleRevealed(true);
      setRevealHole(true);
      setTimeout(() => setRevealHole(false), 600);

      const insReturn = insBet > 0 ? insBet * 3 : 0;

      if (playerBJ) {
        const nc = currentChips + hands[0].bet + insReturn;
        setChips(nc);
        setNetResult(nc - (currentChips + hands[0].bet + insBet));
        setPlayerHands([{ ...hands[0], result: "push" }]);
        setResultLines([
          "Push — Both have Blackjack!",
          ...(insReturn > 0 ? [`Insurance pays +${insReturn - insBet}`] : []),
        ]);
      } else {
        const nc = currentChips + insReturn;
        setChips(nc);
        setNetResult(nc - (currentChips + hands[0].bet + insBet));
        setPlayerHands([{ ...hands[0], result: "lose" }]);
        setResultLines([
          "Dealer has Blackjack!",
          ...(insReturn > 0 ? [`Insurance pays +${insReturn - insBet}`] : []),
        ]);
      }
      setMessage("");
      setPhase("result");
      return;
    }

    // No dealer BJ
    if (playerBJ) {
      const [num, den] = config.blackjackPays;
      const bjWin = Math.floor(hands[0].bet * num / den);
      const nc = currentChips + hands[0].bet + bjWin;
      setChips(nc);
      setNetResult(bjWin - insBet);
      setPlayerHands([{ ...hands[0], result: "blackjack" }]);
      setDealerHoleRevealed(true);
      setRevealHole(true);
      setTimeout(() => setRevealHole(false), 600);
      setResultLines([
        `Blackjack! +${bjWin}`,
        ...(insBet > 0 ? [`Insurance lost: -${insBet}`] : []),
      ]);
      setMessage("");
      setPhase("result");
      return;
    }

    // Normal play
    setMessage(insBet > 0 ? `Insurance lost (-${insBet}). Your turn.` : "");
    setPhase("playerTurn");
  }

  // ── Player Actions ──

  function hit() {
    if (phase !== "playerTurn") return;

    let s = ensureShoe([...shoe]);
    const card = s.shift()!;
    setShoe(s);
    animateCards([card.id]);

    const hands = playerHands.map((h, i) =>
      i === activeHandIdx ? { ...h, cards: [...h.cards, card] } : h
    );

    if (isBusted(hands[activeHandIdx].cards)) {
      hands[activeHandIdx] = { ...hands[activeHandIdx], result: "lose", stood: true };
      setPlayerHands(hands);
      advanceHand(hands, activeHandIdx, s);
    } else {
      setPlayerHands(hands);
    }
  }

  function stand() {
    if (phase !== "playerTurn") return;
    const hands = playerHands.map((h, i) =>
      i === activeHandIdx ? { ...h, stood: true } : h
    );
    setPlayerHands(hands);
    advanceHand(hands, activeHandIdx, shoe);
  }

  function doubleDown() {
    if (phase !== "playerTurn") return;
    const hand = playerHands[activeHandIdx];
    if (hand.cards.length !== 2 || hand.bet > chipsRef.current) return;

    setChips(prev => prev - hand.bet);

    let s = ensureShoe([...shoe]);
    const card = s.shift()!;
    setShoe(s);
    animateCards([card.id]);

    const hands = playerHands.map((h, i) => {
      if (i !== activeHandIdx) return h;
      const newHand = {
        ...h,
        cards: [...h.cards, card],
        bet: h.bet * 2,
        doubled: true,
        stood: true,
      };
      if (isBusted(newHand.cards)) newHand.result = "lose";
      return newHand;
    });

    setPlayerHands(hands);
    advanceHand(hands, activeHandIdx, s);
  }

  function split() {
    if (phase !== "playerTurn") return;
    const hand = playerHands[activeHandIdx];
    if (hand.cards.length !== 2) return;
    if (hand.cards[0].rank !== hand.cards[1].rank) return;
    if (hand.bet > chipsRef.current) return;
    if (hand.fromSplit) return;

    setChips(prev => prev - hand.bet);

    let s = ensureShoe([...shoe]);
    const c1 = s.shift()!;
    const c2 = s.shift()!;
    setShoe(s);
    animateCards([c1.id, c2.id]);

    const isAces = hand.cards[0].rank === 1;
    const hand1: Hand = {
      cards: [hand.cards[0], c1],
      bet: hand.bet,
      result: null,
      doubled: false,
      stood: isAces,
      fromSplit: true,
    };
    const hand2: Hand = {
      cards: [hand.cards[1], c2],
      bet: hand.bet,
      result: null,
      doubled: false,
      stood: isAces,
      fromSplit: true,
    };

    const hands = [...playerHands];
    hands.splice(activeHandIdx, 1, hand1, hand2);
    setPlayerHands(hands);

    if (isAces) {
      startDealerTurn(hands, s);
    }
  }

  function advanceHand(hands: Hand[], idx: number, currentShoe: Card[]) {
    const next = idx + 1;
    if (next < hands.length && !hands[next].stood) {
      setActiveHandIdx(next);
      return;
    }

    const allBusted = hands.every(h => h.result === "lose");
    if (allBusted) {
      setDealerHoleRevealed(true);
      setRevealHole(true);
      setTimeout(() => setRevealHole(false), 600);
      resolveAllHands(hands, dealerCardsRef.current);
      return;
    }

    startDealerTurn(hands, currentShoe);
  }

  // ── Dealer Turn ──

  function startDealerTurn(hands: Hand[], currentShoe: Card[]) {
    setPhase("dealerTurn");
    setDealerHoleRevealed(true);
    setRevealHole(true);
    setTimeout(() => setRevealHole(false), 600);
    setMessage("Dealer reveals...");

    timerRef.current = setTimeout(() => {
      dealerPlay(hands, [...dealerCardsRef.current], currentShoe);
    }, 1000);
  }

  function dealerPlay(hands: Hand[], dc: Card[], currentShoe: Card[]) {
    const { value, soft } = handValue(dc);
    const mustHit = value < 17 || (value === 17 && soft && config.dealerHitsSoft17);

    if (mustHit) {
      let s = ensureShoe([...currentShoe]);
      const card = s.shift()!;
      const newDc = [...dc, card];

      setDealerCards(newDc);
      setShoe(s);
      animateCards([card.id]);

      timerRef.current = setTimeout(() => {
        dealerPlay(hands, newDc, s);
      }, 700);
    } else {
      setDealerCards(dc);
      resolveAllHands(hands, dc);
    }
  }

  // ── Resolution ──

  function resolveAllHands(hands: Hand[], dc: Card[]) {
    const dealerVal = handValue(dc).value;
    const dealerBust = dealerVal > 21;
    let totalPayback = 0;
    const lines: string[] = [];

    const resolved = hands.map((hand, i) => {
      const prefix = hands.length > 1 ? `Hand ${i + 1}: ` : "";

      if (hand.result === "lose") {
        lines.push(`${prefix}Bust! -${hand.bet}`);
        return hand;
      }

      const pVal = handValue(hand.cards).value;
      let result: HandResult;

      if (dealerBust || pVal > dealerVal) {
        result = "win";
        totalPayback += hand.bet * 2;
        lines.push(`${prefix}${dealerBust ? "Dealer busts! " : ""}Win! +${hand.bet}`);
      } else if (pVal === dealerVal) {
        result = "push";
        totalPayback += hand.bet;
        lines.push(`${prefix}Push. Bet returned.`);
      } else {
        result = "lose";
        lines.push(`${prefix}Dealer wins. -${hand.bet}`);
      }

      return { ...hand, result };
    });

    if (insuranceBet > 0) {
      lines.push(`Insurance lost: -${insuranceBet}`);
    }

    setPlayerHands(resolved);
    setResultLines(lines);
    setMessage("");

    const totalBets = resolved.reduce((s, h) => s + h.bet, 0) + insuranceBet;
    setNetResult(totalPayback - totalBets);
    setChips(prev => prev + totalPayback);
    setPhase("result");
  }

  // ── Derived ──
  const activeHand = playerHands[activeHandIdx] || null;
  const canDouble = phase === "playerTurn" && activeHand && activeHand.cards.length === 2 && activeHand.bet <= chipsRef.current && !activeHand.fromSplit;
  const canSplit = phase === "playerTurn" && activeHand && activeHand.cards.length === 2
    && activeHand.cards[0].rank === activeHand.cards[1].rank
    && activeHand.bet <= chipsRef.current && !activeHand.fromSplit;
  // Allow double after split too
  const canDoubleAfterSplit = phase === "playerTurn" && activeHand && activeHand.cards.length === 2 && activeHand.bet <= chipsRef.current && activeHand.fromSplit;

  // ── Card Components ──

  function CardFace({ card, highlight, glow }: {
    card: Card; highlight?: boolean; glow?: boolean;
  }) {
    const color = cardColor(card.suit);
    const sym = SUIT_SYMBOLS[card.suit];
    const rank = RANK_NAMES[card.rank];
    const isNew = newCardIds.has(card.id);

    return (
      <div
        style={{
          width: 56, height: 78,
          backgroundColor: "#0d1117",
          borderRadius: 6,
          border: `1.5px solid ${highlight ? GREEN : "rgba(0,255,65,0.2)"}`,
          boxShadow: glow
            ? `0 0 12px rgba(0,255,65,0.5)`
            : highlight ? `0 0 8px rgba(0,255,65,0.3)` : "0 1px 4px rgba(0,0,0,0.6)",
          display: "flex", flexDirection: "column", justifyContent: "space-between",
          padding: 3,
          userSelect: "none",
          flexShrink: 0,
          animation: isNew ? "bjDealIn 0.4s ease-out" : undefined,
        }}
      >
        <div style={{ color, display: "flex", alignItems: "center", lineHeight: 1 }}>
          <span style={{ fontSize: 13, fontWeight: 700 }}>{rank}</span>
          <span style={{ fontSize: 11, marginLeft: 1 }}>{sym}</span>
        </div>
        <div style={{ color, textAlign: "center", fontSize: 22, lineHeight: 1 }}>{sym}</div>
        <div style={{ color, display: "flex", alignItems: "center", alignSelf: "flex-end", transform: "rotate(180deg)", lineHeight: 1 }}>
          <span style={{ fontSize: 13, fontWeight: 700 }}>{rank}</span>
          <span style={{ fontSize: 11, marginLeft: 1 }}>{sym}</span>
        </div>
      </div>
    );
  }

  function CardBack({ revealing }: { revealing?: boolean }) {
    return (
      <div
        style={{
          width: 56, height: 78,
          backgroundColor: "#0a0f14",
          backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(0,255,65,0.07) 3px, rgba(0,255,65,0.07) 4px)",
          borderRadius: 6,
          border: "1.5px solid rgba(0,255,65,0.2)",
          boxShadow: "0 1px 4px rgba(0,0,0,0.6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          userSelect: "none",
          flexShrink: 0,
          animation: revealing ? "bjFlip 0.5s ease-out" : undefined,
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 800, color: GREEN, opacity: 0.3 }}>W</span>
      </div>
    );
  }

  function HandValueBadge({ cards }: { cards: Card[] }) {
    const { value } = handValue(cards);
    const bust = value > 21;
    const bj = isBlackjack(cards);
    const display = handValueStr(cards);

    return (
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: bj ? GREEN : bust ? "#ff6b6b" : "#fff",
          backgroundColor: bj ? "rgba(0,255,65,0.15)" : bust ? "rgba(255,50,50,0.15)" : "rgba(255,255,255,0.08)",
          border: `1px solid ${bj ? "rgba(0,255,65,0.4)" : bust ? "rgba(255,50,50,0.3)" : "rgba(255,255,255,0.15)"}`,
          borderRadius: 8,
          padding: "1px 7px",
          whiteSpace: "nowrap",
        }}
      >
        {display}
      </span>
    );
  }

  function ResultBadge({ result }: { result: HandResult }) {
    if (!result) return null;
    const colors: Record<string, { bg: string; border: string; text: string }> = {
      win: { bg: "rgba(0,255,65,0.15)", border: "rgba(0,255,65,0.4)", text: GREEN },
      blackjack: { bg: "rgba(0,255,65,0.2)", border: "rgba(0,255,65,0.5)", text: GREEN },
      push: { bg: "rgba(255,255,255,0.08)", border: "rgba(255,255,255,0.2)", text: "#ccc" },
      lose: { bg: "rgba(255,100,100,0.12)", border: "rgba(255,100,100,0.3)", text: "#ff6b6b" },
    };
    const c = colors[result];
    const labels: Record<string, string> = { win: "WIN", blackjack: "BLACKJACK!", push: "PUSH", lose: "LOSE" };
    return (
      <span
        style={{
          fontSize: 11, fontWeight: 800,
          color: c.text, backgroundColor: c.bg,
          border: `1.5px solid ${c.border}`,
          borderRadius: 8, padding: "2px 10px",
        }}
      >
        {labels[result]}
      </span>
    );
  }

  // ── Render ──

  return (
    <div className="flex flex-col items-center gap-2 sm:gap-3 p-2 sm:p-4 select-none w-full max-w-2xl mx-auto">
      {/* Injected animations */}
      <style>{`
        @keyframes bjDealIn {
          from { transform: scale(0.3) translateY(-20px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes bjFlip {
          0% { transform: perspective(600px) rotateY(180deg); }
          100% { transform: perspective(600px) rotateY(0deg); }
        }
      `}</style>

      {/* ── Difficulty Select ── */}
      {phase === "difficulty" && (
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="text-gray-400 text-sm text-center">
            Blackjack — WOJAK vs PEPE
          </div>
          <div className="text-gray-500 text-xs text-center max-w-sm">
            Classic 21. Beat the dealer without going over. Blackjack pays 3:2 (6:5 on Master). Split, double down, and take insurance.
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

      {/* ── Active Game Header ── */}
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
                <span style={{ color: GREEN, fontWeight: 700 }}>{chips}</span>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center">
              <span className="text-gray-500 text-xs">Hand #{handNum + 1}</span>
              <span className="text-gray-600" style={{ fontSize: 9 }}>
                BJ pays {config.blackjackPays[0]}:{config.blackjackPays[1]}
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-wojak-card/60 border border-wojak-border/50">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-wojak-card border border-wojak-border overflow-hidden flex-shrink-0">
                <img src={PEPE_AVATAR} alt="PEPE" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              </div>
              <div className="flex flex-col">
                <span className="text-white font-bold" style={{ fontSize: 10 }}>PEPE</span>
                <span className="text-gray-400" style={{ fontSize: 10 }}>Dealer</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Betting Phase ── */}
      {phase === "betting" && (
        <div className="flex flex-col items-center gap-3 py-2 w-full max-w-sm">
          {/* Current bet display */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-gray-500 text-xs">Your Bet</span>
            <span
              className="text-2xl sm:text-3xl font-bold"
              style={{ color: betAmount > 0 ? GREEN : "rgba(255,255,255,0.3)" }}
            >
              {betAmount > 0 ? betAmount : "—"}
            </span>
          </div>

          {/* Chip buttons */}
          <div className="flex gap-2 flex-wrap justify-center">
            {CHIP_VALUES.map((val) => (
              <button
                key={val}
                onClick={() => addChipToBet(val)}
                disabled={chips <= 0}
                className="transition-all hover:scale-110 active:scale-95 disabled:opacity-30"
                style={{
                  width: 48, height: 48,
                  borderRadius: "50%",
                  backgroundColor: "#0d1117",
                  border: `2px solid ${GREEN}`,
                  color: GREEN,
                  fontSize: 13,
                  fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: chips > 0 ? "pointer" : "default",
                  boxShadow: `0 0 8px rgba(0,255,65,0.15)`,
                }}
              >
                {val}
              </button>
            ))}
            <button
              onClick={handleAllIn}
              disabled={chips <= 0}
              className="transition-all hover:scale-105 active:scale-95 disabled:opacity-30"
              style={{
                height: 48,
                borderRadius: 24,
                backgroundColor: "rgba(0,255,65,0.15)",
                border: `2px solid ${GREEN}`,
                color: GREEN,
                fontSize: 12,
                fontWeight: 700,
                padding: "0 16px",
                cursor: chips > 0 ? "pointer" : "default",
              }}
            >
              ALL IN
            </button>
          </div>

          {/* Custom amount */}
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={customBet}
              onChange={(e) => setCustomBet(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyCustomBet()}
              placeholder="Custom"
              className="w-24 px-3 py-1.5 rounded-lg text-sm bg-wojak-card border border-wojak-border text-white placeholder-gray-600 outline-none focus:border-wojak-green/50"
              min={1}
              max={chips}
            />
            <button
              onClick={applyCustomBet}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-wojak-card border border-wojak-border text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              Set
            </button>
          </div>

          {/* Clear / Deal */}
          <div className="flex gap-3">
            <button
              onClick={clearBet}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-wojak-card border border-wojak-border text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              Clear
            </button>
            <button
              onClick={deal}
              disabled={betAmount <= 0}
              className="px-6 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-30"
              style={{
                backgroundColor: betAmount > 0 ? GREEN : "rgba(0,255,65,0.2)",
                color: betAmount > 0 ? "#000" : "rgba(0,255,65,0.5)",
                boxShadow: betAmount > 0 ? `0 0 15px rgba(0,255,65,0.3)` : "none",
              }}
            >
              DEAL
            </button>
          </div>
        </div>
      )}

      {/* ── Game Table ── */}
      {(phase === "insurance" || phase === "playerTurn" || phase === "dealerTurn" || phase === "result") && (
        <div className="flex flex-col items-center gap-2 w-full">
          <div
            className="relative w-full rounded-2xl p-3 sm:p-5"
            style={{
              backgroundColor: "#0a120a",
              border: "2px solid rgba(0,255,65,0.15)",
              boxShadow: "inset 0 0 60px rgba(0,255,65,0.03), 0 0 20px rgba(0,0,0,0.5)",
            }}
          >
            {/* ── Dealer Section ── */}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-wojak-card border border-wojak-border overflow-hidden flex-shrink-0">
                <img src={PEPE_AVATAR} alt="PEPE" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              </div>
              <span className="text-xs font-bold text-white">PEPE</span>
              {dealerHoleRevealed && dealerCards.length > 0 && (
                <HandValueBadge cards={dealerCards} />
              )}
              {!dealerHoleRevealed && dealerCards.length > 0 && (
                <span
                  style={{
                    fontSize: 11, fontWeight: 700, color: "#999",
                    backgroundColor: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8, padding: "1px 7px",
                  }}
                >
                  {handValueStr([dealerCards[0]])}
                </span>
              )}
              {phase === "dealerTurn" && (
                <span className="text-yellow-400 animate-pulse text-xs ml-1">Drawing...</span>
              )}
            </div>

            {/* Dealer cards */}
            <div className="flex gap-1.5 justify-center mb-4" style={{ minHeight: 78 }}>
              {dealerCards.map((card, i) => {
                if (i === 1 && !dealerHoleRevealed) {
                  return <CardBack key={card.id} />;
                }
                if (i === 1 && revealHole) {
                  return (
                    <div key={card.id} style={{ animation: "bjFlip 0.5s ease-out" }}>
                      <CardFace card={card} />
                    </div>
                  );
                }
                return <CardFace key={card.id} card={card} />;
              })}
            </div>

            {/* Center divider / bet display */}
            <div className="flex items-center justify-center gap-3 py-2 border-t border-b" style={{ borderColor: "rgba(0,255,65,0.08)" }}>
              <span className="text-gray-500 text-xs">
                Bet: <span style={{ color: GREEN, fontWeight: 700 }}>{playerHands.reduce((s, h) => s + h.bet, 0)}</span>
              </span>
              {insuranceBet > 0 && (
                <span className="text-gray-500 text-xs">
                  Ins: <span className="text-yellow-400 font-bold">{insuranceBet}</span>
                </span>
              )}
              <span className="text-gray-500 text-xs">
                Chips: <span style={{ color: GREEN, fontWeight: 700 }}>{chips}</span>
              </span>
            </div>

            {/* ── Player Section ── */}
            <div className="mt-3">
              {playerHands.map((hand, hIdx) => (
                <div key={hIdx} className="mb-2">
                  {/* Hand label */}
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-wojak-card border border-wojak-border overflow-hidden flex-shrink-0">
                      <img src={WOJAK_AVATAR} alt="WOJAK" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    </div>
                    <span className={`text-xs font-bold ${hIdx === activeHandIdx && phase === "playerTurn" ? "text-wojak-green" : "text-white"}`}>
                      {playerHands.length > 1 ? `Hand ${hIdx + 1}` : "WOJAK"}
                    </span>
                    <HandValueBadge cards={hand.cards} />
                    {hand.result && <ResultBadge result={hand.result} />}
                    {hand.doubled && <span className="text-yellow-400 text-xs font-bold">2x</span>}
                    {playerHands.length > 1 && (
                      <span className="text-gray-600 text-xs">Bet: {hand.bet}</span>
                    )}
                  </div>

                  {/* Cards */}
                  <div className="flex gap-1.5 justify-center" style={{ minHeight: 78 }}>
                    {hand.cards.map((card) => (
                      <CardFace
                        key={card.id}
                        card={card}
                        highlight={hIdx === activeHandIdx && phase === "playerTurn"}
                        glow={hand.result === "win" || hand.result === "blackjack"}
                      />
                    ))}
                  </div>

                  {/* Active hand indicator */}
                  {playerHands.length > 1 && hIdx === activeHandIdx && phase === "playerTurn" && (
                    <div className="text-center mt-1">
                      <span style={{ color: GREEN, fontSize: 9, fontWeight: 700 }}>&#9650; PLAYING</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── Insurance Buttons ── */}
          {phase === "insurance" && (
            <div className="flex flex-col items-center gap-2">
              <div className="text-gray-400 text-xs text-center">{message}</div>
              <div className="text-gray-500 text-xs text-center">
                Insurance costs {Math.floor(betAmount / 2)} chips (pays 2:1 if dealer has Blackjack)
              </div>
              <div className="flex gap-3">
                <button
                  onClick={acceptInsurance}
                  disabled={Math.floor(betAmount / 2) > chips}
                  className="px-5 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-30"
                  style={{
                    backgroundColor: "rgba(0,255,65,0.1)",
                    border: `1.5px solid ${GREEN}`,
                    color: GREEN,
                  }}
                >
                  Yes ({Math.floor(betAmount / 2)})
                </button>
                <button
                  onClick={declineInsurance}
                  className="px-5 py-2 rounded-lg text-sm font-bold transition-colors bg-wojak-card border border-wojak-border text-gray-300 hover:text-white hover:bg-white/5"
                >
                  No Thanks
                </button>
              </div>
            </div>
          )}

          {/* ── Player Action Buttons ── */}
          {phase === "playerTurn" && (
            <div className="flex flex-col items-center gap-2">
              {message && <div className="text-gray-400 text-xs text-center">{message}</div>}
              <div className="flex gap-2 flex-wrap justify-center">
                <button
                  onClick={hit}
                  className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg text-sm font-bold transition-all"
                  style={{
                    backgroundColor: "rgba(0,255,65,0.08)",
                    border: `1.5px solid ${GREEN}`,
                    color: GREEN,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = GREEN; e.currentTarget.style.color = "#000"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "rgba(0,255,65,0.08)"; e.currentTarget.style.color = GREEN; }}
                >
                  Hit
                </button>
                <button
                  onClick={stand}
                  className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg text-sm font-bold transition-all"
                  style={{
                    backgroundColor: "rgba(0,255,65,0.08)",
                    border: `1.5px solid ${GREEN}`,
                    color: GREEN,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = GREEN; e.currentTarget.style.color = "#000"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "rgba(0,255,65,0.08)"; e.currentTarget.style.color = GREEN; }}
                >
                  Stand
                </button>
                {(canDouble || canDoubleAfterSplit) && (
                  <button
                    onClick={doubleDown}
                    className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg text-sm font-bold transition-all"
                    style={{
                      backgroundColor: "rgba(255,200,0,0.08)",
                      border: "1.5px solid rgba(255,200,0,0.5)",
                      color: "#ffd700",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(255,200,0,0.3)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "rgba(255,200,0,0.08)"; }}
                  >
                    Double
                  </button>
                )}
                {canSplit && (
                  <button
                    onClick={split}
                    className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg text-sm font-bold transition-all"
                    style={{
                      backgroundColor: "rgba(100,150,255,0.08)",
                      border: "1.5px solid rgba(100,150,255,0.5)",
                      color: "#7ba3ff",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(100,150,255,0.3)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "rgba(100,150,255,0.08)"; }}
                  >
                    Split
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── Dealer Turn Message ── */}
          {phase === "dealerTurn" && (
            <div className="text-gray-400 text-xs text-center animate-pulse">
              Dealer is playing...
            </div>
          )}

          {/* ── Result ── */}
          {phase === "result" && (
            <div className="flex flex-col items-center gap-2 py-1">
              <div
                className="bg-wojak-card border border-wojak-border rounded-xl p-4 sm:p-5 max-w-sm w-full"
                style={{ boxShadow: "0 0 20px rgba(0,255,65,0.1)" }}
              >
                {resultLines.map((line, i) => (
                  <div key={i} className="text-sm text-center py-0.5" style={{
                    color: line.includes("Win") || line.includes("Blackjack")
                      ? GREEN
                      : line.includes("Push") || line.includes("returned")
                      ? "#ccc"
                      : "#ff6b6b",
                  }}>
                    {line}
                  </div>
                ))}
                <div className="border-t border-wojak-border mt-2 pt-2 text-center">
                  <span
                    className="text-base font-bold"
                    style={{ color: netResult > 0 ? GREEN : netResult < 0 ? "#ff6b6b" : "#ccc" }}
                  >
                    {netResult > 0 ? `+${netResult}` : netResult === 0 ? "±0" : String(netResult)} chips
                  </span>
                </div>
              </div>

              {chips > 0 && (
                <button
                  onClick={newHand}
                  className="px-6 py-2.5 rounded-lg font-bold text-sm sm:text-base transition-colors"
                  style={{ backgroundColor: GREEN, color: "#000" }}
                >
                  Next Hand
                </button>
              )}
              {chips <= 0 && (
                <div className="text-gray-500 text-xs animate-pulse">No chips remaining...</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Game Over ── */}
      {phase === "gameOver" && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
          <div
            className="bg-wojak-dark border rounded-xl p-6 sm:p-8 flex flex-col items-center gap-4 mx-4"
            style={{
              borderColor: "rgba(255,50,50,0.4)",
              boxShadow: "0 0 40px rgba(255,50,50,0.2)",
            }}
          >
            <div className="w-16 h-16 rounded-full bg-wojak-card border-2 overflow-hidden" style={{ borderColor: "#ff6b6b" }}>
              <img src={PEPE_AVATAR} alt="PEPE" className="w-full h-full object-cover" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold" style={{ color: "#ff6b6b" }}>
              Game Over
            </div>
            <div className="text-gray-400 text-sm sm:text-base text-center">
              You&apos;re out of chips! PEPE wins.
            </div>
            <div className="text-gray-500 text-xs">
              Hands played: {handNum + 1}
            </div>
            <button
              onClick={() => { setPhase("difficulty"); }}
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
