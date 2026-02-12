"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Card, Suit, Difficulty, Phase, GameStatus, Player, GameState, HandResult,
  SUITS, SUIT_SYMBOLS, RANK_NAMES,
  createDeck, shuffleDeck, evaluateHand, compareHands, getAIDecision,
  getNextActivePlayer, getActivePlayers, getActiveNonAllInPlayers,
  isRoundComplete, calculateSidePots,
} from "./pokerLogic";

// ── Config ──

const DIFFICULTIES: { key: Difficulty; label: string }[] = [
  { key: "beginner", label: "Beginner" },
  { key: "advanced", label: "Advanced" },
  { key: "expert", label: "Expert" },
  { key: "master", label: "Master" },
];

const STARTING_CHIPS = 1000;
const SMALL_BLIND = 10;
const BIG_BLIND = 20;

const WOJAK_AVATAR = "/images/wojak.jpg";
const PEPE_AVATARS = ["/images/pepe1.jpg", "/images/pepe2.jpg", "/images/pepe3.jpg"];
const PEPE_NAMES = ["PEPE 1", "PEPE 2", "PEPE 3"];
const PEPE_PERSONALITIES: ("tight" | "loose" | "balanced")[] = ["tight", "loose", "balanced"];

const GREEN = "#00ff41";
const WHITE = "#ffffff";

function isRedSuit(suit: Suit): boolean {
  return suit === "hearts" || suit === "diamonds";
}

function cardColor(suit: Suit): string {
  return isRedSuit(suit) ? WHITE : GREEN;
}

// ── Initial state ──

function createPlayers(): Player[] {
  return [
    {
      id: 0, name: "WOJAK", avatar: WOJAK_AVATAR, chips: STARTING_CHIPS,
      holeCards: [], currentBet: 0, totalBetThisRound: 0, folded: false,
      isAllIn: false, isHuman: true, personality: "balanced", lastAction: "",
    },
    ...PEPE_NAMES.map((name, i) => ({
      id: i + 1, name, avatar: PEPE_AVATARS[i], chips: STARTING_CHIPS,
      holeCards: [] as Card[], currentBet: 0, totalBetThisRound: 0, folded: false,
      isAllIn: false, isHuman: false, personality: PEPE_PERSONALITIES[i], lastAction: "",
    })),
  ];
}

function createInitialState(): GameState {
  return {
    players: createPlayers(),
    deck: [],
    communityCards: [],
    pot: 0,
    sidePots: [],
    phase: "preflop",
    status: "idle",
    dealerIdx: 0,
    currentPlayerIdx: 0,
    lastRaiseAmount: BIG_BLIND,
    minRaise: BIG_BLIND,
    bigBlind: BIG_BLIND,
    smallBlind: SMALL_BLIND,
    revealedCommunity: 0,
    handMessage: "",
    winnerIds: [],
    winningCards: [],
  };
}

// ── Component ──

export default function TexasHoldem() {
  const [difficulty, setDifficulty] = useState<Difficulty>("beginner");
  const [game, setGame] = useState<GameState>(createInitialState);
  const [raiseAmount, setRaiseAmount] = useState(BIG_BLIND * 2);
  const [animatingCards, setAnimatingCards] = useState<Set<string>>(new Set());
  const [potAnimation, setPotAnimation] = useState(false);

  const gameRef = useRef(game);
  gameRef.current = game;
  const difficultyRef = useRef(difficulty);
  difficultyRef.current = difficulty;
  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Start new game ──

  const startNewGame = useCallback(() => {
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    const state = createInitialState();
    state.status = "idle";
    setGame(state);
    setRaiseAmount(BIG_BLIND * 2);
  }, []);

  const changeDifficulty = useCallback((d: Difficulty) => {
    setDifficulty(d);
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    const state = createInitialState();
    state.status = "idle";
    setGame(state);
    setRaiseAmount(BIG_BLIND * 2);
  }, []);

  // ── Deal a new hand ──

  const dealNewHand = useCallback((prevState?: GameState) => {
    const base = prevState || gameRef.current;
    const deck = shuffleDeck(createDeck());
    const players = base.players.map(p => ({
      ...p,
      holeCards: [] as Card[],
      currentBet: 0,
      totalBetThisRound: 0,
      folded: p.chips <= 0,
      isAllIn: false,
      lastAction: "",
    }));

    // Rotate dealer
    let dealerIdx = base.status === "idle" ? 0 : (base.dealerIdx + 1) % 4;
    while (players[dealerIdx].chips <= 0) dealerIdx = (dealerIdx + 1) % 4;

    // Deal 2 cards to each active player
    let deckIdx = 0;
    for (let round = 0; round < 2; round++) {
      for (let i = 0; i < 4; i++) {
        const pIdx = (dealerIdx + 1 + i) % 4;
        if (players[pIdx].chips > 0) {
          players[pIdx].holeCards.push(deck[deckIdx++]);
        }
      }
    }

    // Post blinds
    const activePlayers = players.filter(p => p.chips > 0 && !p.folded);
    if (activePlayers.length < 2) return;

    let sbIdx = (dealerIdx + 1) % 4;
    while (players[sbIdx].folded || players[sbIdx].chips <= 0) sbIdx = (sbIdx + 1) % 4;
    let bbIdx = (sbIdx + 1) % 4;
    while (players[bbIdx].folded || players[bbIdx].chips <= 0) bbIdx = (bbIdx + 1) % 4;

    const sbAmount = Math.min(SMALL_BLIND, players[sbIdx].chips);
    players[sbIdx].chips -= sbAmount;
    players[sbIdx].currentBet = sbAmount;
    players[sbIdx].totalBetThisRound = sbAmount;
    if (players[sbIdx].chips === 0) players[sbIdx].isAllIn = true;

    const bbAmount = Math.min(BIG_BLIND, players[bbIdx].chips);
    players[bbIdx].chips -= bbAmount;
    players[bbIdx].currentBet = bbAmount;
    players[bbIdx].totalBetThisRound = bbAmount;
    if (players[bbIdx].chips === 0) players[bbIdx].isAllIn = true;

    // First to act is after BB
    let firstToAct = (bbIdx + 1) % 4;
    let safety = 0;
    while ((players[firstToAct].folded || players[firstToAct].chips <= 0 || players[firstToAct].isAllIn) && safety < 4) {
      firstToAct = (firstToAct + 1) % 4;
      safety++;
    }

    const communityCards = deck.slice(deckIdx, deckIdx + 5);

    // Animate cards
    const newAnimCards = new Set<string>();
    players.forEach(p => p.holeCards.forEach(c => newAnimCards.add(c.id)));
    setAnimatingCards(newAnimCards);
    setTimeout(() => setAnimatingCards(new Set()), 600);

    setGame({
      players,
      deck: deck.slice(deckIdx + 5),
      communityCards,
      pot: sbAmount + bbAmount,
      sidePots: [],
      phase: "preflop",
      status: "playing",
      dealerIdx,
      currentPlayerIdx: firstToAct,
      lastRaiseAmount: BIG_BLIND,
      minRaise: BIG_BLIND,
      bigBlind: BIG_BLIND,
      smallBlind: SMALL_BLIND,
      revealedCommunity: 0,
      handMessage: "",
      winnerIds: [],
      winningCards: [],
    });
    setRaiseAmount(BIG_BLIND * 2);
  }, []);

  // ── Advance phase ──

  const advancePhase = useCallback((state: GameState): GameState => {
    const newState = { ...state };
    // Reset bets for new round
    newState.players = newState.players.map(p => ({ ...p, currentBet: 0, lastAction: "" }));
    newState.lastRaiseAmount = BIG_BLIND;
    newState.minRaise = BIG_BLIND;

    switch (state.phase) {
      case "preflop":
        newState.phase = "flop";
        newState.revealedCommunity = 3;
        break;
      case "flop":
        newState.phase = "turn";
        newState.revealedCommunity = 4;
        break;
      case "turn":
        newState.phase = "river";
        newState.revealedCommunity = 5;
        break;
      case "river":
        return resolveShowdown(newState);
    }

    // Animate new community cards
    const newAnim = new Set<string>();
    for (let i = state.revealedCommunity; i < newState.revealedCommunity; i++) {
      newAnim.add(newState.communityCards[i].id);
    }
    setAnimatingCards(newAnim);
    setTimeout(() => setAnimatingCards(new Set()), 500);

    // Set first to act (after dealer)
    let firstToAct = (newState.dealerIdx + 1) % 4;
    let safety = 0;
    while ((newState.players[firstToAct].folded || newState.players[firstToAct].isAllIn || newState.players[firstToAct].chips <= 0) && safety < 4) {
      firstToAct = (firstToAct + 1) % 4;
      safety++;
    }
    newState.currentPlayerIdx = firstToAct;

    // Check if only all-in players remain
    const activeNonAllIn = newState.players.filter(p => !p.folded && !p.isAllIn && p.chips > 0);
    if (activeNonAllIn.length <= 1) {
      // Run out remaining community cards
      if (newState.phase !== "river") {
        return advancePhase(newState);
      }
      return resolveShowdown(newState);
    }

    return newState;
  }, []);

  // ── Resolve showdown ──

  const resolveShowdown = useCallback((state: GameState): GameState => {
    const newState = { ...state, phase: "showdown" as Phase, revealedCommunity: 5 };
    const active = getActivePlayers(newState);

    if (active.length === 1) {
      // Everyone else folded
      const winner = active[0];
      newState.players = newState.players.map(p =>
        p.id === winner.id ? { ...p, chips: p.chips + newState.pot } : p
      );
      newState.handMessage = `${winner.name} wins $${newState.pot}!`;
      newState.winnerIds = [winner.id];
      newState.status = "handOver";
      setPotAnimation(true);
      setTimeout(() => setPotAnimation(false), 800);
      return newState;
    }

    // Evaluate hands
    const community = newState.communityCards.slice(0, 5);
    const results: HandResult[] = active.map(p => {
      const result = evaluateHand(p.holeCards, community);
      return { ...result, playerId: p.id };
    });

    // Sort by hand strength (best first)
    results.sort((a, b) => compareHands(b, a));

    // Find winners (may be ties)
    const bestResult = results[0];
    const winners = results.filter(r => compareHands(r, bestResult) === 0);
    const winnerIds = winners.map(w => w.playerId);

    // Distribute pot
    const share = Math.floor(newState.pot / winnerIds.length);
    newState.players = newState.players.map(p => {
      if (winnerIds.includes(p.id)) {
        return { ...p, chips: p.chips + share };
      }
      return p;
    });

    // Handle remainder
    const remainder = newState.pot - share * winnerIds.length;
    if (remainder > 0) {
      const firstWinner = newState.players.findIndex(p => winnerIds.includes(p.id));
      if (firstWinner >= 0) newState.players[firstWinner].chips += remainder;
    }

    const winnerNames = winners.map(w => newState.players.find(p => p.id === w.playerId)!.name);
    const handName = bestResult.rankName;
    const winningCardIds = bestResult.bestFive.map(c => c.id);

    if (winnerIds.length === 1) {
      newState.handMessage = `${winnerNames[0]} wins $${newState.pot} with ${handName}!`;
    } else {
      newState.handMessage = `Split pot! ${winnerNames.join(" & ")} tie with ${handName}`;
    }

    newState.winnerIds = winnerIds;
    newState.winningCards = winningCardIds;
    newState.status = "handOver";

    setPotAnimation(true);
    setTimeout(() => setPotAnimation(false), 800);

    return newState;
  }, []);

  // ── Process player action ──

  const processAction = useCallback((action: string, amount?: number) => {
    const state = { ...gameRef.current };
    const player = { ...state.players[state.currentPlayerIdx] };
    state.players = [...state.players];
    state.players[state.currentPlayerIdx] = player;

    const maxBet = Math.max(...state.players.filter(p => !p.folded).map(p => p.currentBet));
    const callAmount = maxBet - player.currentBet;

    switch (action) {
      case "fold":
        player.folded = true;
        player.lastAction = "Fold";
        break;
      case "check":
        player.lastAction = "Check";
        break;
      case "call": {
        const toCall = Math.min(callAmount, player.chips);
        player.chips -= toCall;
        player.currentBet += toCall;
        player.totalBetThisRound += toCall;
        state.pot += toCall;
        if (player.chips === 0) player.isAllIn = true;
        player.lastAction = player.isAllIn ? "All-In" : `Call $${toCall}`;
        break;
      }
      case "raise": {
        const raiseTotal = amount || state.bigBlind * 2;
        const actualRaise = Math.min(raiseTotal + callAmount, player.chips);
        player.chips -= actualRaise;
        player.currentBet += actualRaise;
        player.totalBetThisRound += actualRaise;
        state.pot += actualRaise;
        state.lastRaiseAmount = actualRaise - callAmount;
        state.minRaise = Math.max(state.bigBlind, state.lastRaiseAmount);
        if (player.chips === 0) player.isAllIn = true;
        player.lastAction = player.isAllIn ? "All-In" : `Raise $${actualRaise}`;
        // Reset other players' lastAction so they need to act again
        state.players = state.players.map((p, i) =>
          i !== state.currentPlayerIdx && !p.folded && !p.isAllIn
            ? { ...p, lastAction: "" }
            : p
        );
        break;
      }
      case "allin": {
        const allInAmount = player.chips;
        player.currentBet += allInAmount;
        player.totalBetThisRound += allInAmount;
        state.pot += allInAmount;
        player.chips = 0;
        player.isAllIn = true;
        if (allInAmount > callAmount) {
          state.lastRaiseAmount = allInAmount - callAmount;
          state.minRaise = Math.max(state.bigBlind, state.lastRaiseAmount);
          state.players = state.players.map((p, i) =>
            i !== state.currentPlayerIdx && !p.folded && !p.isAllIn
              ? { ...p, lastAction: "" }
              : p
          );
        }
        player.lastAction = `All-In $${allInAmount}`;
        break;
      }
    }

    // Check if hand is over (all folded except one)
    const activePlayers = state.players.filter(p => !p.folded);
    if (activePlayers.length === 1) {
      const final = resolveShowdown(state);
      setGame(final);
      return;
    }

    // Check if round is complete
    if (isRoundComplete(state)) {
      const advanced = advancePhase(state);
      setGame(advanced);
      return;
    }

    // Move to next player
    const nextIdx = getNextActivePlayer(state, state.currentPlayerIdx);
    if (nextIdx === -1) {
      const advanced = advancePhase(state);
      setGame(advanced);
      return;
    }
    state.currentPlayerIdx = nextIdx;
    setGame(state);
  }, [advancePhase, resolveShowdown]);

  // ── AI turns ──

  useEffect(() => {
    if (game.status !== "playing") return;
    const current = game.players[game.currentPlayerIdx];
    if (!current || current.isHuman || current.folded || current.isAllIn) return;

    const delay = 600 + Math.random() * 800;
    aiTimerRef.current = setTimeout(() => {
      const decision = getAIDecision(current, gameRef.current, difficultyRef.current);
      processAction(decision.action, decision.raiseAmount);
    }, delay);

    return () => {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    };
  }, [game.currentPlayerIdx, game.status, game.phase, processAction]);

  // ── Auto-continue after hand over ──

  const continueGame = useCallback(() => {
    const state = gameRef.current;
    // Check for game over / win conditions
    const alive = state.players.filter(p => p.chips > 0);
    const humanAlive = state.players[0].chips > 0;

    if (!humanAlive) {
      setGame(prev => ({ ...prev, status: "gameOver", handMessage: "You ran out of chips!" }));
      return;
    }

    if (alive.length === 1 && alive[0].isHuman) {
      setGame(prev => ({ ...prev, status: "win", handMessage: "You eliminated all PEPEs!" }));
      return;
    }

    dealNewHand(state);
  }, [dealNewHand]);

  // ── Player actions ──

  const currentPlayer = game.players[game.currentPlayerIdx];
  const isPlayerTurn = game.status === "playing" && currentPlayer?.isHuman && !currentPlayer.folded && !currentPlayer.isAllIn;
  const maxBet = Math.max(...game.players.filter(p => !p.folded).map(p => p.currentBet), 0);
  const callAmount = isPlayerTurn ? Math.max(0, maxBet - currentPlayer.currentBet) : 0;
  const canCheck = callAmount === 0;
  const minRaiseTotal = Math.max(game.bigBlind, game.minRaise);
  const maxRaise = isPlayerTurn ? currentPlayer.chips - callAmount : 0;

  // ── Card rendering ──

  function CardFace({ card, small, highlight }: { card: Card; small?: boolean; highlight?: boolean }) {
    const color = cardColor(card.suit);
    const sym = SUIT_SYMBOLS[card.suit];
    const rank = RANK_NAMES[card.rank];
    const w = small ? 40 : 56;
    const h = small ? 56 : 78;
    const fs = small ? 10 : 13;
    const bigSuit = small ? 16 : 22;
    const borderColor = highlight ? GREEN : isRedSuit(card.suit) ? "rgba(255,255,255,0.3)" : "rgba(0,255,65,0.3)";
    const isAnimating = animatingCards.has(card.id);
    const isWinning = game.winningCards.includes(card.id);

    return (
      <div
        style={{
          width: w, height: h,
          backgroundColor: "#0d1117",
          borderRadius: 5,
          border: `1.5px solid ${isWinning ? GREEN : borderColor}`,
          boxShadow: isWinning
            ? `0 0 12px rgba(0,255,65,0.6)`
            : "0 1px 4px rgba(0,0,0,0.6)",
          display: "flex", flexDirection: "column", justifyContent: "space-between",
          padding: small ? 2 : 3,
          userSelect: "none",
          transform: isAnimating ? "rotateY(180deg)" : "none",
          transition: "transform 0.4s ease, box-shadow 0.3s",
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
    const w = small ? 40 : 56;
    const h = small ? 56 : 78;
    const fs = small ? 9 : 11;
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
        <span style={{ fontSize: fs, fontWeight: 800, color: GREEN, opacity: 0.3 }}>W</span>
      </div>
    );
  }

  // ── Player position component ──

  function PlayerSeat({ player, position }: { player: Player; position: "bottom" | "top" | "left" | "right" }) {
    const isActive = game.currentPlayerIdx === player.id && game.status === "playing";
    const isWinner = game.winnerIds.includes(player.id);
    const showCards = player.isHuman || game.phase === "showdown";
    const isEliminated = player.chips <= 0 && player.folded;

    return (
      <div
        className={`flex flex-col items-center gap-1 ${position === "bottom" ? "order-last" : ""}`}
        style={{ opacity: isEliminated ? 0.3 : player.folded ? 0.5 : 1 }}
      >
        {/* Avatar + name + chips */}
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all ${
          isActive ? "bg-wojak-green/15 border border-wojak-green/40" :
          isWinner ? "bg-wojak-green/20 border border-wojak-green/50" :
          "bg-wojak-card/60 border border-wojak-border/50"
        }`}>
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-wojak-card border border-wojak-border overflow-hidden flex-shrink-0">
            <img
              src={player.avatar}
              alt={player.name}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          </div>
          <div className="flex flex-col">
            <span className={`text-xs font-bold ${isActive ? "text-wojak-green" : isWinner ? "text-wojak-green" : "text-gray-300"}`}>
              {player.name}
              {isActive && !player.isHuman && (
                <span className="text-yellow-400 animate-pulse ml-1">...</span>
              )}
            </span>
            <div className="flex items-center gap-1">
              <span
                className="inline-flex items-center justify-center text-xs font-bold px-1.5 py-0.5 rounded"
                style={{ backgroundColor: "rgba(0,255,65,0.15)", color: GREEN, minWidth: 20, fontSize: 10 }}
              >
                ${player.chips}
              </span>
              {player.lastAction && (
                <span className="text-xs text-gray-400">{player.lastAction}</span>
              )}
            </div>
          </div>
        </div>

        {/* Hole cards */}
        <div className="flex gap-0.5">
          {player.holeCards.length > 0 ? (
            showCards && !player.folded ? (
              player.holeCards.map(c => <CardFace key={c.id} card={c} small highlight={isWinner} />)
            ) : (
              player.holeCards.map((_, i) => <CardBack key={i} small />)
            )
          ) : null}
        </div>

        {/* Dealer chip */}
        {game.dealerIdx === player.id && game.status !== "idle" && (
          <span
            className="text-xs font-bold rounded-full px-1.5 py-0.5"
            style={{ backgroundColor: "#1a1a2e", color: WHITE, border: "1px solid rgba(255,255,255,0.3)", fontSize: 9 }}
          >
            D
          </span>
        )}
      </div>
    );
  }

  // ── Raise slider ──

  const clampedRaise = Math.max(minRaiseTotal, Math.min(raiseAmount, maxRaise));

  // ── Render ──

  return (
    <div className="flex flex-col items-center gap-2 sm:gap-3 p-2 sm:p-4 select-none w-full max-w-2xl mx-auto">
      {/* Difficulty buttons */}
      <div className="flex gap-1.5 sm:gap-2 flex-wrap justify-center">
        {DIFFICULTIES.map((d) => (
          <button
            key={d.key}
            onClick={() => changeDifficulty(d.key)}
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

      {/* Start / idle screen */}
      {game.status === "idle" && (
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="text-gray-400 text-sm text-center">
            Texas Hold&apos;em Poker — WOJAK vs 3 PEPEs
          </div>
          <button
            onClick={() => dealNewHand()}
            className="px-6 py-2.5 rounded-lg font-bold text-sm sm:text-base transition-colors"
            style={{ backgroundColor: GREEN, color: "#000" }}
          >
            Deal Cards
          </button>
        </div>
      )}

      {/* Game table */}
      {game.status !== "idle" && (
        <div
          className="relative w-full rounded-2xl p-3 sm:p-4"
          style={{
            backgroundColor: "#0a120a",
            border: "2px solid rgba(0,255,65,0.15)",
            boxShadow: "inset 0 0 60px rgba(0,255,65,0.03), 0 0 20px rgba(0,0,0,0.5)",
            minHeight: 400,
          }}
        >
          {/* Top opponents (PEPE 1 center top, PEPE 2 left, PEPE 3 right) */}
          <div className="flex justify-between items-start mb-3 sm:mb-4 gap-2">
            <div className="flex-1 flex justify-center">
              {game.players[1].chips > 0 || game.status === "handOver" ? (
                <PlayerSeat player={game.players[1]} position="top" />
              ) : <div />}
            </div>
            <div className="flex-1 flex justify-center">
              {game.players[2].chips > 0 || game.status === "handOver" ? (
                <PlayerSeat player={game.players[2]} position="top" />
              ) : <div />}
            </div>
            <div className="flex-1 flex justify-center">
              {game.players[3].chips > 0 || game.status === "handOver" ? (
                <PlayerSeat player={game.players[3]} position="top" />
              ) : <div />}
            </div>
          </div>

          {/* Community cards + pot (center) */}
          <div className="flex flex-col items-center gap-2 my-4 sm:my-6">
            {/* Pot */}
            <div
              className={`text-center font-bold text-sm sm:text-base transition-transform ${potAnimation ? "scale-125" : "scale-100"}`}
              style={{ color: GREEN, transition: "transform 0.3s" }}
            >
              Pot: ${game.pot}
            </div>

            {/* Community cards */}
            <div className="flex gap-1 sm:gap-1.5 justify-center flex-wrap">
              {game.communityCards.slice(0, game.revealedCommunity).map((card) => (
                <CardFace key={card.id} card={card} highlight={game.winningCards.includes(card.id)} />
              ))}
              {/* Empty slots for unrevealed */}
              {Array.from({ length: 5 - game.revealedCommunity }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  style={{
                    width: 56, height: 78,
                    borderRadius: 5,
                    border: "1.5px dashed rgba(0,255,65,0.12)",
                    backgroundColor: "rgba(0,255,65,0.02)",
                  }}
                />
              ))}
            </div>

            {/* Hand result message */}
            {game.handMessage && (
              <div
                className="text-center text-sm sm:text-base font-bold px-3 py-1.5 rounded-lg mt-1"
                style={{ color: GREEN, backgroundColor: "rgba(0,255,65,0.08)", border: "1px solid rgba(0,255,65,0.2)" }}
              >
                {game.handMessage}
              </div>
            )}

            {/* Phase indicator */}
            {game.status === "playing" && (
              <div className="text-gray-500 text-xs uppercase tracking-wider">
                {game.phase}
              </div>
            )}
          </div>

          {/* Player (WOJAK) at bottom */}
          <div className="flex justify-center mt-2">
            <PlayerSeat player={game.players[0]} position="bottom" />
          </div>
        </div>
      )}

      {/* Action buttons */}
      {isPlayerTurn && (
        <div className="flex flex-col items-center gap-2 w-full max-w-md">
          {/* Main actions */}
          <div className="flex gap-2 flex-wrap justify-center">
            <button
              onClick={() => processAction("fold")}
              className="px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors bg-wojak-card border border-red-900/50 text-red-400 hover:bg-red-900/20 hover:text-red-300"
            >
              Fold
            </button>
            {canCheck ? (
              <button
                onClick={() => processAction("check")}
                className="px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors bg-wojak-card border border-wojak-border text-gray-300 hover:text-white hover:bg-white/5"
              >
                Check
              </button>
            ) : (
              <button
                onClick={() => processAction("call")}
                className="px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors bg-wojak-card border border-wojak-green/40 text-wojak-green hover:bg-wojak-green/10"
              >
                Call ${callAmount}
              </button>
            )}
            {maxRaise > 0 && (
              <button
                onClick={() => processAction("raise", clampedRaise)}
                className="px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors border text-black"
                style={{ backgroundColor: GREEN, borderColor: GREEN }}
              >
                Raise ${callAmount + clampedRaise}
              </button>
            )}
            <button
              onClick={() => processAction("allin")}
              className="px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors border"
              style={{
                backgroundColor: "rgba(0,255,65,0.15)",
                borderColor: GREEN,
                color: GREEN,
              }}
            >
              All-In ${currentPlayer.chips}
            </button>
          </div>

          {/* Raise slider */}
          {maxRaise > minRaiseTotal && (
            <div className="flex items-center gap-2 w-full px-2">
              <span className="text-xs text-gray-500">${minRaiseTotal}</span>
              <input
                type="range"
                min={minRaiseTotal}
                max={maxRaise}
                step={Math.max(1, Math.floor(maxRaise / 20))}
                value={clampedRaise}
                onChange={(e) => setRaiseAmount(Number(e.target.value))}
                className="flex-1 accent-green-500"
                style={{ accentColor: GREEN }}
              />
              <span className="text-xs text-gray-500">${maxRaise}</span>
            </div>
          )}

          {/* Quick raise presets */}
          {maxRaise > minRaiseTotal && (
            <div className="flex gap-1.5 flex-wrap justify-center">
              {[
                { label: "Min", value: minRaiseTotal },
                { label: "2x", value: game.bigBlind * 4 },
                { label: "3x", value: game.bigBlind * 6 },
                { label: "Pot", value: game.pot },
              ].filter(p => p.value <= maxRaise && p.value >= minRaiseTotal).map(preset => (
                <button
                  key={preset.label}
                  onClick={() => setRaiseAmount(preset.value)}
                  className={`px-2 py-1 rounded text-xs transition-colors ${
                    raiseAmount === preset.value
                      ? "bg-wojak-green/20 border border-wojak-green/50 text-white"
                      : "bg-wojak-card/60 border border-wojak-border/50 text-gray-400 hover:text-white"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Hand over: continue / game over buttons */}
      {game.status === "handOver" && (
        <button
          onClick={continueGame}
          className="px-6 py-2.5 rounded-lg font-bold text-sm sm:text-base transition-colors"
          style={{ backgroundColor: GREEN, color: "#000" }}
        >
          Next Hand
        </button>
      )}

      {/* Game over overlay */}
      {game.status === "gameOver" && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
          <div
            className="bg-wojak-dark border rounded-xl p-6 sm:p-8 flex flex-col items-center gap-4 mx-4"
            style={{ borderColor: "rgba(255,50,50,0.4)", boxShadow: "0 0 40px rgba(255,50,50,0.2)" }}
          >
            <div className="text-2xl sm:text-3xl font-bold text-red-400">Game Over</div>
            <div className="text-gray-400 text-sm sm:text-base text-center">You ran out of chips!</div>
            <button
              onClick={startNewGame}
              className="px-6 py-2.5 font-bold rounded-lg hover:opacity-80 transition-colors text-sm sm:text-base"
              style={{ backgroundColor: GREEN, color: "#000" }}
            >
              Play Again
            </button>
          </div>
        </div>
      )}

      {/* Win overlay */}
      {game.status === "win" && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
          <div
            className="bg-wojak-dark border rounded-xl p-6 sm:p-8 flex flex-col items-center gap-4 mx-4 animate-bounce"
            style={{ borderColor: "rgba(0,255,65,0.4)", boxShadow: "0 0 40px rgba(0,255,65,0.3), 0 0 80px rgba(0,255,65,0.1)" }}
          >
            <div className="text-2xl sm:text-3xl font-bold" style={{ color: GREEN }}>You Win!</div>
            <div className="text-gray-400 text-sm sm:text-base text-center">
              All PEPEs eliminated! Final chips: ${game.players[0].chips}
            </div>
            <button
              onClick={startNewGame}
              className="px-6 py-2.5 font-bold rounded-lg hover:opacity-80 transition-colors text-sm sm:text-base"
              style={{ backgroundColor: GREEN, color: "#000" }}
            >
              Play Again
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="text-gray-500 text-xs text-center max-w-md px-2">
        <span className="hidden sm:inline">Texas Hold&apos;em — Use buttons to Fold, Check, Call, or Raise. Drag the slider to set raise amount.</span>
        <span className="sm:hidden">Tap buttons to act. Use slider for raise amount.</span>
      </div>
    </div>
  );
}
