"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ── Types ──

type Suit = "spades" | "hearts" | "diamonds" | "clubs";
type Speed = "casual" | "normal" | "fast" | "blitz";
type GamePhase = "speed" | "playing" | "flipping" | "war" | "warFlipping" | "result" | "gameOver";

interface Card {
  suit: Suit;
  rank: number; // 1=A, 2-10, 11=J, 12=Q, 13=K
  id: string;
}

interface LogEntry {
  round: number;
  playerCard: Card;
  pepeCard: Card;
  winner: "player" | "pepe" | "war";
  warDepth?: number;
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

const SPEEDS: { key: Speed; label: string }[] = [
  { key: "casual", label: "Casual" },
  { key: "normal", label: "Normal" },
  { key: "fast", label: "Fast" },
  { key: "blitz", label: "Blitz" },
];

const SPEED_CONFIGS: Record<Speed, { flipMs: number; pauseMs: number; warPauseMs: number }> = {
  casual: { flipMs: 800, pauseMs: 1200, warPauseMs: 1500 },
  normal: { flipMs: 500, pauseMs: 800, warPauseMs: 1000 },
  fast: { flipMs: 300, pauseMs: 500, warPauseMs: 600 },
  blitz: { flipMs: 150, pauseMs: 300, warPauseMs: 350 },
};

const LOG_MAX = 8;

// ── Helpers ──

let cardIdCounter = 0;

function warValue(rank: number): number {
  return rank === 1 ? 14 : rank;
}

function isRedSuit(suit: Suit): boolean {
  return suit === "hearts" || suit === "diamonds";
}

function cardColor(suit: Suit): string {
  return isRedSuit(suit) ? WHITE : GREEN;
}

function createDeck(): Card[] {
  const cards: Card[] = [];
  for (const suit of SUITS) {
    for (let rank = 1; rank <= 13; rank++) {
      cards.push({ suit, rank, id: `w${cardIdCounter++}` });
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

// ── Component ──

export default function War() {
  const [speed, setSpeed] = useState<Speed | null>(null);
  const [phase, setPhase] = useState<GamePhase>("speed");
  const [playerDeck, setPlayerDeck] = useState<Card[]>([]);
  const [pepeDeck, setPepeDeck] = useState<Card[]>([]);
  const [playerCard, setPlayerCard] = useState<Card | null>(null);
  const [pepeCard, setPepeCard] = useState<Card | null>(null);
  const [playerWarCards, setPlayerWarCards] = useState<Card[]>([]);
  const [pepeWarCards, setPepeWarCards] = useState<Card[]>([]);
  const [warFacePlayer, setWarFacePlayer] = useState<Card | null>(null);
  const [warFacePepe, setWarFacePepe] = useState<Card | null>(null);
  const [roundNum, setRoundNum] = useState(0);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [showWarBanner, setShowWarBanner] = useState(false);
  const [flipAnim, setFlipAnim] = useState(false);
  const [warFlipAnim, setWarFlipAnim] = useState(false);
  const [winnerGlow, setWinnerGlow] = useState<"player" | "pepe" | null>(null);
  const [resultMessage, setResultMessage] = useState("");
  const [autoPlay, setAutoPlay] = useState(false);
  const [busy, setBusy] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoPlayRef = useRef(autoPlay);
  autoPlayRef.current = autoPlay;
  const busyRef = useRef(busy);
  busyRef.current = busy;
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const playerDeckRef = useRef(playerDeck);
  playerDeckRef.current = playerDeck;
  const pepeDeckRef = useRef(pepeDeck);
  pepeDeckRef.current = pepeDeck;
  const speedRef = useRef(speed);
  speedRef.current = speed;

  const config = speed ? SPEED_CONFIGS[speed] : SPEED_CONFIGS.normal;
  const configRef = useRef(config);
  configRef.current = config;

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Auto play loop
  useEffect(() => {
    if (autoPlay && phase === "playing" && !busy) {
      timerRef.current = setTimeout(() => {
        if (autoPlayRef.current && phaseRef.current === "playing" && !busyRef.current) {
          doFlip();
        }
      }, 1000);
      return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay, phase, busy, playerDeck.length, pepeDeck.length]);

  // ── Start Game ──
  function startGame(s: Speed) {
    if (timerRef.current) clearTimeout(timerRef.current);
    setSpeed(s);
    const deck = createDeck();
    setPlayerDeck(deck.slice(0, 26));
    setPepeDeck(deck.slice(26));
    setPhase("playing");
    setPlayerCard(null);
    setPepeCard(null);
    setPlayerWarCards([]);
    setPepeWarCards([]);
    setWarFacePlayer(null);
    setWarFacePepe(null);
    setRoundNum(0);
    setLog([]);
    setShowWarBanner(false);
    setFlipAnim(false);
    setWarFlipAnim(false);
    setWinnerGlow(null);
    setResultMessage("");
    setAutoPlay(false);
    setBusy(false);
  }

  // ── Flip Cards ──
  const doFlip = useCallback(() => {
    if (busyRef.current) return;
    const pDeck = [...playerDeckRef.current];
    const eDeck = [...pepeDeckRef.current];

    if (pDeck.length === 0 || eDeck.length === 0) return;

    setBusy(true);
    setWinnerGlow(null);
    setPlayerWarCards([]);
    setPepeWarCards([]);
    setWarFacePlayer(null);
    setWarFacePepe(null);
    setShowWarBanner(false);
    setResultMessage("");

    const pc = pDeck.shift()!;
    const ec = eDeck.shift()!;

    setPlayerCard(pc);
    setPepeCard(ec);
    setFlipAnim(true);
    setPhase("flipping");

    const cfg = configRef.current;

    timerRef.current = setTimeout(() => {
      setFlipAnim(false);
      const pVal = warValue(pc.rank);
      const eVal = warValue(ec.rank);
      const round = (prev: number) => prev + 1;

      if (pVal > eVal) {
        // Player wins
        const newPDeck = [...pDeck, pc, ec];
        setPlayerDeck(newPDeck);
        setPepeDeck(eDeck);
        setWinnerGlow("player");
        setRoundNum(round);
        setLog(prev => [{ round: prev.length + 1, playerCard: pc, pepeCard: ec, winner: "player" as const }, ...prev].slice(0, LOG_MAX));

        timerRef.current = setTimeout(() => {
          setWinnerGlow(null);
          setBusy(false);
          if (eDeck.length === 0) {
            setPhase("gameOver");
            setResultMessage("WOJAK WINS!");
          } else {
            setPhase("playing");
          }
        }, cfg.pauseMs);
      } else if (eVal > pVal) {
        // Pepe wins
        const newEDeck = [...eDeck, pc, ec];
        setPlayerDeck(pDeck);
        setPepeDeck(newEDeck);
        setWinnerGlow("pepe");
        setRoundNum(round);
        setLog(prev => [{ round: prev.length + 1, playerCard: pc, pepeCard: ec, winner: "pepe" as const }, ...prev].slice(0, LOG_MAX));

        timerRef.current = setTimeout(() => {
          setWinnerGlow(null);
          setBusy(false);
          if (pDeck.length === 0) {
            setPhase("gameOver");
            setResultMessage("PEPE WINS!");
          } else {
            setPhase("playing");
          }
        }, cfg.pauseMs);
      } else {
        // WAR!
        setRoundNum(round);
        setLog(prev => [{ round: prev.length + 1, playerCard: pc, pepeCard: ec, winner: "war" as const }, ...prev].slice(0, LOG_MAX));
        setShowWarBanner(true);

        timerRef.current = setTimeout(() => {
          resolveWar(pDeck, eDeck, [pc], [ec]);
        }, cfg.warPauseMs);
      }
    }, cfg.flipMs);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Resolve War ──
  function resolveWar(pDeck: Card[], eDeck: Card[], tablePCards: Card[], tableECards: Card[]) {
    const cfg = configRef.current;

    // Check if either player has insufficient cards for war
    if (pDeck.length < 4) {
      // Player doesn't have enough cards - loses
      setPlayerDeck([]);
      setPepeDeck([...eDeck, ...pDeck, ...tablePCards, ...tableECards]);
      setPhase("gameOver");
      setResultMessage("PEPE WINS!");
      setBusy(false);
      return;
    }
    if (eDeck.length < 4) {
      // Pepe doesn't have enough cards - loses
      setPepeDeck([]);
      setPlayerDeck([...pDeck, ...eDeck, ...tablePCards, ...tableECards]);
      setPhase("gameOver");
      setResultMessage("WOJAK WINS!");
      setBusy(false);
      return;
    }

    setPhase("war");

    // Take 3 face-down cards each
    const pFaceDown = pDeck.splice(0, 3);
    const eFaceDown = eDeck.splice(0, 3);
    setPlayerWarCards(pFaceDown);
    setPepeWarCards(eFaceDown);

    // Take 1 face-up card each
    const pFace = pDeck.shift()!;
    const eFace = eDeck.shift()!;

    const allTableP = [...tablePCards, ...pFaceDown, pFace];
    const allTableE = [...tableECards, ...eFaceDown, eFace];

    timerRef.current = setTimeout(() => {
      setWarFacePlayer(pFace);
      setWarFacePepe(eFace);
      setWarFlipAnim(true);
      setPhase("warFlipping");

      timerRef.current = setTimeout(() => {
        setWarFlipAnim(false);
        const pVal = warValue(pFace.rank);
        const eVal = warValue(eFace.rank);

        if (pVal > eVal) {
          const newPDeck = [...pDeck, ...allTableP, ...allTableE];
          setPlayerDeck(newPDeck);
          setPepeDeck(eDeck);
          setWinnerGlow("player");

          timerRef.current = setTimeout(() => {
            setWinnerGlow(null);
            setShowWarBanner(false);
            setBusy(false);
            if (eDeck.length === 0) {
              setPhase("gameOver");
              setResultMessage("WOJAK WINS!");
            } else {
              setPhase("playing");
              setPlayerWarCards([]);
              setPepeWarCards([]);
              setWarFacePlayer(null);
              setWarFacePepe(null);
            }
          }, cfg.pauseMs);
        } else if (eVal > pVal) {
          const newEDeck = [...eDeck, ...allTableP, ...allTableE];
          setPlayerDeck(pDeck);
          setPepeDeck(newEDeck);
          setWinnerGlow("pepe");

          timerRef.current = setTimeout(() => {
            setWinnerGlow(null);
            setShowWarBanner(false);
            setBusy(false);
            if (pDeck.length === 0) {
              setPhase("gameOver");
              setResultMessage("PEPE WINS!");
            } else {
              setPhase("playing");
              setPlayerWarCards([]);
              setPepeWarCards([]);
              setWarFacePlayer(null);
              setWarFacePepe(null);
            }
          }, cfg.pauseMs);
        } else {
          // Double war!
          timerRef.current = setTimeout(() => {
            resolveWar(pDeck, eDeck, allTableP, allTableE);
          }, cfg.warPauseMs);
        }
      }, cfg.flipMs);
    }, cfg.flipMs);
  }

  // ── Card Components ──

  function CardFace({ card, highlight, glow, small }: {
    card: Card; highlight?: boolean; glow?: boolean; small?: boolean;
  }) {
    const color = cardColor(card.suit);
    const sym = SUIT_SYMBOLS[card.suit];
    const rank = RANK_NAMES[card.rank];
    const w = small ? 42 : 56;
    const h = small ? 58 : 78;

    return (
      <div
        style={{
          width: w, height: h,
          backgroundColor: "#0d1117",
          borderRadius: 6,
          border: `1.5px solid ${highlight ? GREEN : "rgba(0,255,65,0.2)"}`,
          boxShadow: glow
            ? "0 0 16px rgba(0,255,65,0.6)"
            : highlight ? "0 0 8px rgba(0,255,65,0.3)" : "0 1px 4px rgba(0,0,0,0.6)",
          display: "flex", flexDirection: "column", justifyContent: "space-between",
          padding: small ? 2 : 3,
          userSelect: "none",
          flexShrink: 0,
        }}
      >
        <div style={{ color, display: "flex", alignItems: "center", lineHeight: 1 }}>
          <span style={{ fontSize: small ? 10 : 13, fontWeight: 700 }}>{rank}</span>
          <span style={{ fontSize: small ? 8 : 11, marginLeft: 1 }}>{sym}</span>
        </div>
        <div style={{ color, textAlign: "center", fontSize: small ? 16 : 22, lineHeight: 1 }}>{sym}</div>
        <div style={{ color, display: "flex", alignItems: "center", alignSelf: "flex-end", transform: "rotate(180deg)", lineHeight: 1 }}>
          <span style={{ fontSize: small ? 10 : 13, fontWeight: 700 }}>{rank}</span>
          <span style={{ fontSize: small ? 8 : 11, marginLeft: 1 }}>{sym}</span>
        </div>
      </div>
    );
  }

  function CardBack({ small, onClick, clickable }: { small?: boolean; onClick?: () => void; clickable?: boolean }) {
    const w = small ? 42 : 56;
    const h = small ? 58 : 78;
    return (
      <div
        onClick={onClick}
        style={{
          width: w, height: h,
          backgroundColor: "#0a0f14",
          backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(0,255,65,0.07) 3px, rgba(0,255,65,0.07) 4px)",
          borderRadius: 6,
          border: "1.5px solid rgba(0,255,65,0.2)",
          boxShadow: "0 1px 4px rgba(0,0,0,0.6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          userSelect: "none",
          flexShrink: 0,
          cursor: clickable ? "pointer" : "default",
          transition: "transform 0.1s",
        }}
        onMouseEnter={(e) => { if (clickable) e.currentTarget.style.transform = "scale(1.05)"; }}
        onMouseLeave={(e) => { if (clickable) e.currentTarget.style.transform = "scale(1)"; }}
      >
        <span style={{ fontSize: small ? 10 : 14, fontWeight: 800, color: GREEN, opacity: 0.3 }}>W</span>
      </div>
    );
  }

  function DeckStack({ count, onClick, clickable, label }: { count: number; onClick?: () => void; clickable?: boolean; label?: string }) {
    return (
      <div className="flex flex-col items-center gap-1" style={{ position: "relative" }}>
        {label && <span className="text-gray-500" style={{ fontSize: 9 }}>{label}</span>}
        <div style={{ position: "relative", width: 56, height: 78 }}>
          {count > 2 && (
            <div style={{ position: "absolute", left: 4, top: -4 }}>
              <CardBack />
            </div>
          )}
          {count > 1 && (
            <div style={{ position: "absolute", left: 2, top: -2 }}>
              <CardBack />
            </div>
          )}
          {count > 0 ? (
            <div style={{ position: "relative", zIndex: 2 }}>
              <CardBack onClick={onClick} clickable={clickable} />
            </div>
          ) : (
            <div style={{
              width: 56, height: 78, borderRadius: 6,
              border: "1.5px dashed rgba(0,255,65,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.15)" }}>Empty</span>
            </div>
          )}
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: count > 0 ? GREEN : "rgba(255,255,255,0.3)" }}>
          {count}
        </span>
      </div>
    );
  }

  // ── Render ──

  return (
    <div className="flex flex-col items-center gap-2 sm:gap-3 p-2 sm:p-4 select-none w-full max-w-2xl mx-auto">
      {/* Injected animations */}
      <style>{`
        @keyframes warFlipIn {
          from { transform: perspective(600px) rotateY(180deg); opacity: 0; }
          to { transform: perspective(600px) rotateY(0deg); opacity: 1; }
        }
        @keyframes warDealIn {
          from { transform: scale(0.3) translateY(-20px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes warBannerPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.15); opacity: 0.8; }
        }
        @keyframes warBannerIn {
          from { transform: scale(0.3); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {/* ── Speed Select ── */}
      {phase === "speed" && (
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="text-gray-400 text-sm text-center">
            War — WOJAK vs PEPE
          </div>
          <div className="text-gray-500 text-xs text-center max-w-sm">
            Classic War card game. Flip cards, highest wins. Ties trigger WAR!
            Capture all 52 cards to win.
          </div>
          <div className="flex gap-1.5 sm:gap-2 flex-wrap justify-center">
            {SPEEDS.map((s) => (
              <button
                key={s.key}
                onClick={() => startGame(s.key)}
                className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-colors bg-wojak-card border border-wojak-border text-gray-300 hover:text-white hover:bg-white/5"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Active Game ── */}
      {phase !== "speed" && (
        <>
          {/* Speed buttons */}
          <div className="flex gap-1.5 sm:gap-2 flex-wrap justify-center">
            {SPEEDS.map((s) => (
              <button
                key={s.key}
                onClick={() => startGame(s.key)}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  speed === s.key
                    ? "bg-wojak-green/20 border border-wojak-green/50 text-white"
                    : "bg-wojak-card border border-wojak-border text-gray-300 hover:text-white hover:bg-white/5"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Score panel */}
          <div className="flex gap-3 sm:gap-6 text-xs sm:text-sm w-full justify-center">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-wojak-card/60 border border-wojak-border/50">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-wojak-card border border-wojak-border overflow-hidden flex-shrink-0">
                <img src={WOJAK_AVATAR} alt="WOJAK" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              </div>
              <div className="flex flex-col">
                <span className="text-green-300 font-bold" style={{ fontSize: 10 }}>WOJAK</span>
                <span style={{ color: GREEN, fontWeight: 700 }}>{playerDeck.length}</span>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center">
              <span className="text-gray-500 text-xs">Round {roundNum}</span>
              <span className="text-gray-600" style={{ fontSize: 9 }}>
                {playerDeck.length + pepeDeck.length + (playerCard ? 1 : 0) + (pepeCard ? 1 : 0) + playerWarCards.length + pepeWarCards.length + (warFacePlayer ? 1 : 0) + (warFacePepe ? 1 : 0)} cards in play
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-wojak-card/60 border border-wojak-border/50">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-wojak-card border border-wojak-border overflow-hidden flex-shrink-0">
                <img src={PEPE_AVATAR} alt="PEPE" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              </div>
              <div className="flex flex-col">
                <span className="text-white font-bold" style={{ fontSize: 10 }}>PEPE</span>
                <span style={{ color: WHITE, fontWeight: 700 }}>{pepeDeck.length}</span>
              </div>
            </div>
          </div>

          {/* ── Game Table ── */}
          <div
            className="relative w-full rounded-2xl p-3 sm:p-5"
            style={{
              backgroundColor: "#0a120a",
              border: "2px solid rgba(0,255,65,0.15)",
              boxShadow: "inset 0 0 60px rgba(0,255,65,0.03), 0 0 20px rgba(0,0,0,0.5)",
              minHeight: 340,
            }}
          >
            {/* PEPE section (top) */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-wojak-card border border-wojak-border overflow-hidden flex-shrink-0">
                  <img src={PEPE_AVATAR} alt="PEPE" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                </div>
                <span className="text-xs font-bold text-white">PEPE</span>
                <span style={{ fontSize: 10, color: "#999", backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "1px 7px", fontWeight: 700 }}>
                  {pepeDeck.length} cards
                </span>
              </div>
              <DeckStack count={pepeDeck.length} label="PEPE's Deck" />
            </div>

            {/* Center Battle Area */}
            <div className="flex flex-col items-center py-3 sm:py-4" style={{ minHeight: 160 }}>
              {/* WAR banner */}
              {showWarBanner && (
                <div
                  style={{
                    animation: "warBannerIn 0.3s ease-out, warBannerPulse 0.8s ease-in-out infinite 0.3s",
                    fontSize: 28,
                    fontWeight: 900,
                    color: GREEN,
                    textShadow: `0 0 20px rgba(0,255,65,0.6), 0 0 40px rgba(0,255,65,0.3)`,
                    letterSpacing: 6,
                    marginBottom: 8,
                  }}
                >
                  WAR!
                </div>
              )}

              {/* Flipped cards */}
              <div className="flex items-center gap-4 sm:gap-8">
                {/* Pepe's card */}
                <div className="flex flex-col items-center gap-1">
                  <span className="text-gray-500" style={{ fontSize: 9 }}>PEPE</span>
                  {pepeCard ? (
                    <div style={{
                      animation: flipAnim ? `warFlipIn ${config.flipMs}ms ease-out` : undefined,
                    }}>
                      <CardFace card={pepeCard} glow={winnerGlow === "pepe"} highlight={winnerGlow === "pepe"} />
                    </div>
                  ) : (
                    <div style={{
                      width: 56, height: 78, borderRadius: 6,
                      border: "1.5px dashed rgba(0,255,65,0.1)",
                    }} />
                  )}
                </div>

                {/* VS */}
                <div className="flex flex-col items-center">
                  <span style={{ fontSize: 14, fontWeight: 800, color: "rgba(255,255,255,0.15)" }}>VS</span>
                </div>

                {/* Player's card */}
                <div className="flex flex-col items-center gap-1">
                  <span className="text-gray-500" style={{ fontSize: 9 }}>WOJAK</span>
                  {playerCard ? (
                    <div style={{
                      animation: flipAnim ? `warFlipIn ${config.flipMs}ms ease-out` : undefined,
                    }}>
                      <CardFace card={playerCard} glow={winnerGlow === "player"} highlight={winnerGlow === "player"} />
                    </div>
                  ) : (
                    <div style={{
                      width: 56, height: 78, borderRadius: 6,
                      border: "1.5px dashed rgba(0,255,65,0.1)",
                    }} />
                  )}
                </div>
              </div>

              {/* War cards display */}
              {(playerWarCards.length > 0 || pepeWarCards.length > 0) && (
                <div className="flex items-center gap-4 sm:gap-8 mt-3">
                  {/* Pepe war cards */}
                  <div className="flex items-center gap-0.5">
                    {pepeWarCards.map((c, i) => (
                      <div key={c.id} style={{ animation: `warDealIn 0.3s ease-out ${i * 0.1}s both` }}>
                        <CardBack small />
                      </div>
                    ))}
                    {warFacePepe && (
                      <div style={{
                        animation: warFlipAnim ? `warFlipIn ${config.flipMs}ms ease-out` : undefined,
                        marginLeft: 2,
                      }}>
                        <CardFace card={warFacePepe} small glow={winnerGlow === "pepe"} highlight={winnerGlow === "pepe"} />
                      </div>
                    )}
                  </div>

                  {/* Spacer */}
                  <div style={{ width: 20 }} />

                  {/* Player war cards */}
                  <div className="flex items-center gap-0.5">
                    {playerWarCards.map((c, i) => (
                      <div key={c.id} style={{ animation: `warDealIn 0.3s ease-out ${i * 0.1}s both` }}>
                        <CardBack small />
                      </div>
                    ))}
                    {warFacePlayer && (
                      <div style={{
                        animation: warFlipAnim ? `warFlipIn ${config.flipMs}ms ease-out` : undefined,
                        marginLeft: 2,
                      }}>
                        <CardFace card={warFacePlayer} small glow={winnerGlow === "player"} highlight={winnerGlow === "player"} />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* WOJAK section (bottom) */}
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-wojak-card border border-wojak-border overflow-hidden flex-shrink-0">
                  <img src={WOJAK_AVATAR} alt="WOJAK" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                </div>
                <span className="text-xs font-bold" style={{ color: GREEN }}>WOJAK</span>
                <span style={{ fontSize: 10, color: GREEN, backgroundColor: "rgba(0,255,65,0.08)", border: "1px solid rgba(0,255,65,0.2)", borderRadius: 8, padding: "1px 7px", fontWeight: 700 }}>
                  {playerDeck.length} cards
                </span>
              </div>
              <DeckStack
                count={playerDeck.length}
                label="Your Deck"
                onClick={() => {
                  if (phase === "playing" && !busy) doFlip();
                }}
                clickable={phase === "playing" && !busy}
              />
            </div>
          </div>

          {/* ── Controls ── */}
          {phase !== "gameOver" && (
            <div className="flex flex-col items-center gap-2">
              <div className="flex gap-3 items-center">
                <button
                  onClick={doFlip}
                  disabled={phase !== "playing" || busy}
                  className="px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-bold transition-all disabled:opacity-30"
                  style={{
                    backgroundColor: (phase === "playing" && !busy) ? GREEN : "rgba(0,255,65,0.2)",
                    color: (phase === "playing" && !busy) ? "#000" : "rgba(0,255,65,0.5)",
                    boxShadow: (phase === "playing" && !busy) ? "0 0 20px rgba(0,255,65,0.3)" : "none",
                  }}
                >
                  FLIP
                </button>

                {/* Auto Play toggle */}
                <button
                  onClick={() => setAutoPlay(prev => !prev)}
                  className={`px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                    autoPlay
                      ? "bg-wojak-green/20 border border-wojak-green/50 text-white"
                      : "bg-wojak-card border border-wojak-border text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  Auto {autoPlay ? "ON" : "OFF"}
                </button>
              </div>

              {busy && phase !== "playing" && (
                <span className="text-gray-500 text-xs animate-pulse">
                  {showWarBanner ? "Resolving war..." : "Resolving..."}
                </span>
              )}
            </div>
          )}

          {/* ── Battle Log ── */}
          {log.length > 0 && phase !== "gameOver" && (
            <div className="w-full max-w-sm">
              <div className="text-gray-500 text-xs mb-1 font-medium">Battle Log</div>
              <div
                className="rounded-lg p-2"
                style={{
                  backgroundColor: "rgba(0,0,0,0.3)",
                  border: "1px solid rgba(0,255,65,0.08)",
                  maxHeight: 140,
                  overflowY: "auto",
                }}
              >
                {log.map((entry, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-0.5 text-xs"
                    style={{
                      borderBottom: i < log.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none",
                      opacity: i === 0 ? 1 : 0.6 + (1 - i / log.length) * 0.4,
                    }}
                  >
                    <span className="text-gray-600">#{entry.round}</span>
                    <span className="flex items-center gap-1">
                      <span style={{ color: cardColor(entry.pepeCard.suit), fontSize: 10 }}>
                        {RANK_NAMES[entry.pepeCard.rank]}{SUIT_SYMBOLS[entry.pepeCard.suit]}
                      </span>
                      <span className="text-gray-600">vs</span>
                      <span style={{ color: cardColor(entry.playerCard.suit), fontSize: 10 }}>
                        {RANK_NAMES[entry.playerCard.rank]}{SUIT_SYMBOLS[entry.playerCard.suit]}
                      </span>
                    </span>
                    <span style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: entry.winner === "player" ? GREEN : entry.winner === "pepe" ? "#ff6b6b" : "#ffd700",
                    }}>
                      {entry.winner === "player" ? "WIN" : entry.winner === "pepe" ? "LOSE" : "WAR"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Game Over ── */}
      {phase === "gameOver" && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
          <div
            className="bg-wojak-dark border rounded-xl p-6 sm:p-8 flex flex-col items-center gap-4 mx-4"
            style={{
              borderColor: resultMessage.includes("WOJAK") ? "rgba(0,255,65,0.4)" : "rgba(255,50,50,0.4)",
              boxShadow: resultMessage.includes("WOJAK")
                ? "0 0 40px rgba(0,255,65,0.2)"
                : "0 0 40px rgba(255,50,50,0.2)",
            }}
          >
            <div className="w-16 h-16 rounded-full bg-wojak-card border-2 overflow-hidden" style={{
              borderColor: resultMessage.includes("WOJAK") ? GREEN : "#ff6b6b",
            }}>
              <img
                src={resultMessage.includes("WOJAK") ? WOJAK_AVATAR : PEPE_AVATAR}
                alt={resultMessage.includes("WOJAK") ? "WOJAK" : "PEPE"}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-2xl sm:text-3xl font-bold" style={{
              color: resultMessage.includes("WOJAK") ? GREEN : "#ff6b6b",
            }}>
              {resultMessage}
            </div>
            <div className="text-gray-400 text-sm sm:text-base text-center">
              {resultMessage.includes("WOJAK")
                ? "You captured all 52 cards!"
                : "PEPE captured all your cards!"}
            </div>
            <div className="text-gray-500 text-xs">
              Total rounds: {roundNum}
            </div>
            <button
              onClick={() => { setPhase("speed"); setAutoPlay(false); }}
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
