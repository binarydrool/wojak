"use client";

import { useState, useEffect, useRef, useMemo } from "react";

// ── Types ──

type DrawMode = "draw1" | "draw3";
type Suit = "spades" | "hearts" | "diamonds" | "clubs";

interface Card {
  suit: Suit;
  rank: number;
  faceUp: boolean;
  id: string;
}

interface GameState {
  stock: Card[];
  waste: Card[];
  foundations: Card[][];
  tableau: Card[][];
}

interface Selection {
  source: "waste" | "tableau" | "foundation";
  colIdx?: number;
  cardIdx?: number;
}

interface DragInfo {
  cards: Card[];
  source: "waste" | "tableau" | "foundation";
  colIdx?: number;
  cardIdx?: number;
  x: number;
  y: number;
  active: boolean;
}

// ── Constants ──

const SUITS: Suit[] = ["spades", "hearts", "diamonds", "clubs"];
const RANK_NAMES: Record<number, string> = {
  1: "A", 2: "2", 3: "3", 4: "4", 5: "5", 6: "6", 7: "7",
  8: "8", 9: "9", 10: "10", 11: "J", 12: "Q", 13: "K",
};
const SUIT_SYMBOLS: Record<Suit, string> = {
  spades: "\u2660", hearts: "\u2665", diamonds: "\u2666", clubs: "\u2663",
};

// Green for spades/clubs, white for hearts/diamonds — clearly distinct
const GREEN = "#00ff41";
const WHITE = "#ffffff";

function isRedSuit(suit: Suit): boolean {
  return suit === "hearts" || suit === "diamonds";
}

function cardColor(suit: Suit): string {
  return isRedSuit(suit) ? WHITE : GREEN;
}

function alternatingColors(a: Suit, b: Suit): boolean {
  return isRedSuit(a) !== isRedSuit(b);
}

// ── Deck / game helpers ──

function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (let rank = 1; rank <= 13; rank++) {
      deck.push({ suit, rank, faceUp: false, id: `${suit}-${rank}` });
    }
  }
  return deck;
}

function shuffle(deck: Card[]): Card[] {
  const a = [...deck];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function deal(): GameState {
  const deck = shuffle(createDeck());
  const tableau: Card[][] = [[], [], [], [], [], [], []];
  let idx = 0;
  for (let col = 0; col < 7; col++) {
    for (let row = 0; row <= col; row++) {
      const card = { ...deck[idx++] };
      card.faceUp = row === col;
      tableau[col].push(card);
    }
  }
  return {
    stock: deck.slice(idx).map((c) => ({ ...c, faceUp: false })),
    waste: [],
    foundations: [[], [], [], []],
    tableau,
  };
}

function clone(s: GameState): GameState {
  return {
    stock: s.stock.map((c) => ({ ...c })),
    waste: s.waste.map((c) => ({ ...c })),
    foundations: s.foundations.map((f) => f.map((c) => ({ ...c }))),
    tableau: s.tableau.map((t) => t.map((c) => ({ ...c }))),
  };
}

function canPlaceFoundation(card: Card, pile: Card[]): boolean {
  if (pile.length === 0) return card.rank === 1;
  const top = pile[pile.length - 1];
  return top.suit === card.suit && card.rank === top.rank + 1;
}

function canPlaceTableau(card: Card, col: Card[]): boolean {
  if (col.length === 0) return card.rank === 13;
  const top = col[col.length - 1];
  return top.faceUp && alternatingColors(card.suit, top.suit) && card.rank === top.rank - 1;
}

function autoFlip(s: GameState): GameState {
  for (const col of s.tableau) {
    if (col.length > 0 && !col[col.length - 1].faceUp) {
      col[col.length - 1].faceUp = true;
    }
  }
  return s;
}

function checkWin(s: GameState): boolean {
  return s.foundations.every((f) => f.length === 13);
}

// ── Component ──

export default function Solitaire() {
  const [game, setGame] = useState<GameState>(() => deal());
  const [mode, setMode] = useState<DrawMode>("draw1");
  const [moves, setMoves] = useState(0);
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(false);
  const [won, setWon] = useState(false);
  const [history, setHistory] = useState<GameState[]>([]);
  const [sel, setSel] = useState<Selection | null>(null);
  const [drag, setDrag] = useState<DragInfo | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTapRef = useRef<{ time: number; source: string; colIdx?: number }>({ time: 0, source: "" });
  const dragStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  // Use refs for current state to avoid stale closures in event handlers
  const gameRef = useRef(game);
  gameRef.current = game;
  const selRef = useRef(sel);
  selRef.current = sel;

  // ── Responsive sizing ──
  const boardRef = useRef<HTMLDivElement>(null);
  const [cardW, setCardW] = useState(48);

  useEffect(() => {
    const measure = () => {
      if (boardRef.current) {
        const w = Math.floor((boardRef.current.clientWidth - 24) / 7);
        setCardW(Math.max(38, Math.min(w, 76)));
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const D = useMemo(() => {
    const w = cardW;
    const h = Math.round(w * 1.4);
    const gap = Math.max(3, Math.round(w * 0.07));
    const downOff = Math.max(5, Math.round(w * 0.13));
    const upOff = Math.max(14, Math.round(w * 0.35));
    const boardW = 7 * w + 6 * gap;
    const fs = Math.max(9, Math.round(w * 0.2));
    const bigSuit = Math.max(16, Math.round(w * 0.4));
    return { w, h, gap, downOff, upOff, boardW, fs, bigSuit };
  }, [cardW]);

  // ── Timer ──
  useEffect(() => {
    if (running && !won) {
      timerRef.current = setInterval(() => setTime((t) => t + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [running, won]);

  const fmtTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  // ── Actions ──

  function saveUndo() {
    setHistory((h) => [...h, clone(gameRef.current)]);
  }

  function applyState(s: GameState) {
    const flipped = autoFlip(s);
    setGame(flipped);
    setMoves((m) => m + 1);
    if (!running) setRunning(true);
    if (checkWin(flipped)) { setWon(true); setRunning(false); }
    setSel(null);
  }

  function newDeal() {
    if (timerRef.current) clearInterval(timerRef.current);
    setGame(deal());
    setMoves(0);
    setTime(0);
    setRunning(false);
    setWon(false);
    setHistory([]);
    setSel(null);
    setDrag(null);
  }

  function changeMode(m: DrawMode) {
    setMode(m);
    newDeal();
  }

  function undo() {
    if (history.length === 0) return;
    setGame(history[history.length - 1]);
    setHistory((h) => h.slice(0, -1));
    setMoves((m) => Math.max(0, m - 1));
    setSel(null);
  }

  function drawStock() {
    const s = clone(gameRef.current);
    saveUndo();
    if (s.stock.length === 0) {
      if (s.waste.length === 0) return;
      s.stock = [...s.waste].reverse().map((c) => ({ ...c, faceUp: false }));
      s.waste = [];
    } else {
      const n = Math.min(mode === "draw1" ? 1 : 3, s.stock.length);
      for (let i = 0; i < n; i++) {
        const c = s.stock.pop()!;
        c.faceUp = true;
        s.waste.push(c);
      }
    }
    applyState(s);
  }

  // Try to move cards from source to destination
  function tryMove(
    fromSource: string, fromCol: number | undefined, fromCard: number | undefined,
    toSource: string, toCol: number | undefined
  ): boolean {
    const s = clone(gameRef.current);
    let cards: Card[] = [];

    if (fromSource === "waste") {
      if (s.waste.length === 0) return false;
      cards = [s.waste[s.waste.length - 1]];
    } else if (fromSource === "tableau" && fromCol !== undefined && fromCard !== undefined) {
      const col = s.tableau[fromCol];
      if (fromCard >= col.length || !col[fromCard].faceUp) return false;
      cards = col.slice(fromCard);
    } else if (fromSource === "foundation" && fromCol !== undefined) {
      if (s.foundations[fromCol].length === 0) return false;
      cards = [s.foundations[fromCol][s.foundations[fromCol].length - 1]];
    }

    if (cards.length === 0) return false;

    let ok = false;
    if (toSource === "foundation" && toCol !== undefined) {
      if (cards.length === 1 && canPlaceFoundation(cards[0], s.foundations[toCol])) {
        s.foundations[toCol].push({ ...cards[0], faceUp: true });
        ok = true;
      }
    } else if (toSource === "tableau" && toCol !== undefined) {
      if (canPlaceTableau(cards[0], s.tableau[toCol])) {
        cards.forEach((c) => s.tableau[toCol!].push({ ...c, faceUp: true }));
        ok = true;
      }
    }

    if (!ok) return false;

    // Remove from source
    if (fromSource === "waste") s.waste.pop();
    else if (fromSource === "tableau" && fromCol !== undefined && fromCard !== undefined) s.tableau[fromCol].splice(fromCard);
    else if (fromSource === "foundation" && fromCol !== undefined) s.foundations[fromCol].pop();

    saveUndo();
    applyState(s);
    return true;
  }

  // Auto-send single card to foundation
  function autoSend(source: string, colIdx?: number) {
    const s = clone(gameRef.current);
    let card: Card | null = null;

    if (source === "waste" && s.waste.length > 0) card = s.waste[s.waste.length - 1];
    else if (source === "tableau" && colIdx !== undefined) {
      const col = s.tableau[colIdx];
      if (col.length > 0 && col[col.length - 1].faceUp) card = col[col.length - 1];
    }

    if (!card) return;

    for (let fi = 0; fi < 4; fi++) {
      if (canPlaceFoundation(card, s.foundations[fi])) {
        s.foundations[fi].push({ ...card, faceUp: true });
        if (source === "waste") s.waste.pop();
        else if (source === "tableau" && colIdx !== undefined) s.tableau[colIdx].pop();
        saveUndo();
        applyState(s);
        return;
      }
    }
  }

  // ── Click handling ──

  function handleClick(source: "waste" | "tableau" | "foundation", colIdx?: number, cardIdx?: number) {
    if (won) return;

    // Double-click detection
    const now = Date.now();
    const last = lastTapRef.current;
    if (now - last.time < 400 && last.source === source && last.colIdx === colIdx) {
      lastTapRef.current = { time: 0, source: "" };
      autoSend(source, colIdx);
      return;
    }
    lastTapRef.current = { time: now, source, colIdx };

    const currentSel = selRef.current;

    // Nothing selected — select this card
    if (!currentSel) {
      if (source === "waste" && game.waste.length > 0) {
        setSel({ source: "waste" });
      } else if (source === "tableau" && colIdx !== undefined && cardIdx !== undefined) {
        if (cardIdx < game.tableau[colIdx].length && game.tableau[colIdx][cardIdx].faceUp) {
          setSel({ source: "tableau", colIdx, cardIdx });
        }
      } else if (source === "foundation" && colIdx !== undefined && game.foundations[colIdx].length > 0) {
        setSel({ source: "foundation", colIdx });
      }
      return;
    }

    // Click same card — deselect
    if (currentSel.source === source && currentSel.colIdx === colIdx &&
        (source !== "tableau" || currentSel.cardIdx === cardIdx)) {
      setSel(null);
      return;
    }

    // Try to move selected to clicked destination
    const moved = tryMove(currentSel.source, currentSel.colIdx, currentSel.cardIdx, source, colIdx);
    if (!moved) {
      // If move failed and clicked a valid card, select it instead
      if (source === "waste" && game.waste.length > 0) {
        setSel({ source: "waste" });
      } else if (source === "tableau" && colIdx !== undefined && cardIdx !== undefined) {
        if (cardIdx < game.tableau[colIdx].length && game.tableau[colIdx][cardIdx].faceUp) {
          setSel({ source: "tableau", colIdx, cardIdx });
        } else {
          setSel(null);
        }
      } else if (source === "foundation" && colIdx !== undefined && game.foundations[colIdx].length > 0) {
        setSel({ source: "foundation", colIdx });
      } else {
        setSel(null);
      }
    }
  }

  // ── Drag and drop ──

  function getCardsForDrag(source: string, colIdx?: number, cardIdx?: number): Card[] {
    if (source === "waste" && game.waste.length > 0) return [game.waste[game.waste.length - 1]];
    if (source === "tableau" && colIdx !== undefined && cardIdx !== undefined) {
      const col = game.tableau[colIdx];
      if (cardIdx < col.length && col[cardIdx].faceUp) return col.slice(cardIdx);
    }
    if (source === "foundation" && colIdx !== undefined && game.foundations[colIdx].length > 0) {
      return [game.foundations[colIdx][game.foundations[colIdx].length - 1]];
    }
    return [];
  }

  function startDrag(
    e: React.MouseEvent | React.TouchEvent,
    source: "waste" | "tableau" | "foundation",
    colIdx?: number,
    cardIdx?: number
  ) {
    const cards = getCardsForDrag(source, colIdx, cardIdx);
    if (cards.length === 0) return;

    const pt = "touches" in e ? e.touches[0] : e;
    dragStartRef.current = { x: pt.clientX, y: pt.clientY, time: Date.now() };

    setDrag({
      cards,
      source,
      colIdx,
      cardIdx,
      x: pt.clientX,
      y: pt.clientY,
      active: false,
    });
  }

  useEffect(() => {
    if (!drag) return;

    function onMove(e: MouseEvent | TouchEvent) {
      const pt = "touches" in e ? e.touches[0] : e;
      const start = dragStartRef.current;
      if (!start) return;

      const dx = pt.clientX - start.x;
      const dy = pt.clientY - start.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 5 || drag!.active) {
        e.preventDefault();
        setDrag((d) => d ? { ...d, x: pt.clientX, y: pt.clientY, active: true } : null);
      }
    }

    function onEnd(e: MouseEvent | TouchEvent) {
      const d = drag;
      if (!d) return;

      if (d.active && boardRef.current) {
        // Determine drop target
        const pt = "changedTouches" in e ? e.changedTouches[0] : e;
        const rect = boardRef.current.getBoundingClientRect();
        const relX = pt.clientX - rect.left;
        const relY = pt.clientY - rect.top;

        // Check foundations (top-right area)
        const foundationStartX = D.boardW - 4 * D.w - 3 * D.gap;
        if (relY < D.h + 20 && relX >= foundationStartX - 10) {
          const fIdx = Math.floor((relX - foundationStartX + D.gap / 2) / (D.w + D.gap));
          if (fIdx >= 0 && fIdx < 4) {
            tryMove(d.source, d.colIdx, d.cardIdx, "foundation", fIdx);
          }
        } else if (relY > D.h) {
          // Check tableau columns
          const colIdx = Math.floor((relX + D.gap / 2) / (D.w + D.gap));
          if (colIdx >= 0 && colIdx < 7) {
            tryMove(d.source, d.colIdx, d.cardIdx, "tableau", colIdx);
          }
        }
      } else if (!d.active) {
        // Was a click, not a drag
        handleClick(d.source, d.colIdx, d.cardIdx);
      }

      setDrag(null);
      dragStartRef.current = null;
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onEnd);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onEnd);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
    };
  }, [drag, D]);

  // ── Card selection check ──

  function isSel(source: string, colIdx?: number, cardIdx?: number): boolean {
    if (!sel) return false;
    if (sel.source !== source) return false;
    if (source === "waste") return true;
    if (source === "foundation") return sel.colIdx === colIdx;
    if (source === "tableau") {
      return sel.colIdx === colIdx && sel.cardIdx !== undefined && cardIdx !== undefined && cardIdx >= sel.cardIdx;
    }
    return false;
  }

  function isDragged(source: string, colIdx?: number, cardIdx?: number): boolean {
    if (!drag || !drag.active) return false;
    if (drag.source !== source) return false;
    if (source === "waste") return true;
    if (source === "foundation") return drag.colIdx === colIdx;
    if (source === "tableau") {
      return drag.colIdx === colIdx && drag.cardIdx !== undefined && cardIdx !== undefined && cardIdx >= drag.cardIdx;
    }
    return false;
  }

  // ── Column height calc ──

  function colTop(col: Card[], idx: number): number {
    let t = 0;
    for (let i = 0; i < idx; i++) t += col[i].faceUp ? D.upOff : D.downOff;
    return t;
  }

  function colHeight(col: Card[]): number {
    if (col.length === 0) return D.h;
    return colTop(col, col.length - 1) + D.h;
  }

  // ── Card rendering ──

  function CardFace({ card, selected, ghost }: { card: Card; selected: boolean; ghost?: boolean }) {
    const color = cardColor(card.suit);
    const sym = SUIT_SYMBOLS[card.suit];
    const rank = RANK_NAMES[card.rank];
    const borderColor = isRedSuit(card.suit) ? "rgba(255,255,255,0.4)" : "rgba(0,255,65,0.4)";
    const selBorder = "rgba(250,204,21,0.9)";

    return (
      <div
        style={{
          width: D.w, height: D.h,
          backgroundColor: "#0d1117",
          borderRadius: 5,
          border: `1.5px solid ${selected ? selBorder : borderColor}`,
          boxShadow: selected ? "0 0 12px rgba(250,204,21,0.5)" : "0 1px 4px rgba(0,0,0,0.6)",
          display: "flex", flexDirection: "column", justifyContent: "space-between",
          padding: Math.max(2, D.w * 0.05),
          cursor: "pointer", userSelect: "none",
          transform: selected && !ghost ? "translateY(-4px)" : "none",
          opacity: ghost ? 0.3 : 1,
          transition: ghost ? "none" : "transform 0.1s, box-shadow 0.1s",
        }}
      >
        <div style={{ color, display: "flex", alignItems: "center", lineHeight: 1 }}>
          <span style={{ fontSize: D.fs, fontWeight: 700 }}>{rank}</span>
          <span style={{ fontSize: D.fs * 0.85, marginLeft: 1 }}>{sym}</span>
        </div>
        <div style={{ color, textAlign: "center", fontSize: D.bigSuit, lineHeight: 1 }}>{sym}</div>
        <div style={{ color, display: "flex", alignItems: "center", alignSelf: "flex-end", transform: "rotate(180deg)", lineHeight: 1 }}>
          <span style={{ fontSize: D.fs, fontWeight: 700 }}>{rank}</span>
          <span style={{ fontSize: D.fs * 0.85, marginLeft: 1 }}>{sym}</span>
        </div>
      </div>
    );
  }

  function CardBack() {
    return (
      <div
        style={{
          width: D.w, height: D.h,
          backgroundColor: "#0a0f14",
          backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(0,255,65,0.07) 3px, rgba(0,255,65,0.07) 4px)",
          borderRadius: 5,
          border: "1.5px solid rgba(0,255,65,0.2)",
          boxShadow: "0 1px 4px rgba(0,0,0,0.6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          userSelect: "none",
        }}
      >
        <span style={{ fontSize: D.fs * 1.1, fontWeight: 800, color: GREEN, opacity: 0.3 }}>W</span>
      </div>
    );
  }

  function EmptySlot() {
    return (
      <div style={{
        width: D.w, height: D.h, borderRadius: 5,
        border: "1.5px dashed rgba(0,255,65,0.15)",
        backgroundColor: "rgba(0,255,65,0.02)",
      }} />
    );
  }

  // ── Render sections ──

  // Stock pile
  const stockEl = (
    <div
      onClick={(e) => { e.stopPropagation(); drawStock(); }}
      style={{ cursor: "pointer", position: "relative" }}
    >
      {game.stock.length > 0 ? (
        <>
          <CardBack />
          <span style={{
            position: "absolute", bottom: 2, right: 4,
            fontSize: Math.max(8, D.fs * 0.6), color: "rgba(0,255,65,0.4)", fontFamily: "monospace",
          }}>
            {game.stock.length}
          </span>
        </>
      ) : (
        <div style={{
          width: D.w, height: D.h, borderRadius: 5,
          border: "1.5px dashed rgba(0,255,65,0.25)",
          backgroundColor: "rgba(0,255,65,0.03)",
          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
        }}>
          <svg width={D.w * 0.35} height={D.w * 0.35} viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2" opacity={0.35}>
            <path d="M1 4v6h6" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </svg>
        </div>
      )}
    </div>
  );

  // Waste pile
  const wasteEl = (() => {
    if (game.waste.length === 0) return <EmptySlot />;

    if (mode === "draw3") {
      const vis = game.waste.slice(-3);
      const fan = Math.round(D.w * 0.28);
      return (
        <div style={{ position: "relative", width: D.w + (vis.length - 1) * fan, height: D.h }}>
          {vis.map((card, i) => {
            const isTop = i === vis.length - 1;
            return (
              <div
                key={card.id}
                style={{ position: "absolute", top: 0, left: i * fan, zIndex: i }}
                onMouseDown={isTop ? (e) => { e.preventDefault(); startDrag(e, "waste"); } : undefined}
                onTouchStart={isTop ? (e) => startDrag(e, "waste") : undefined}
              >
                <CardFace card={card} selected={isTop && isSel("waste")} ghost={isTop && isDragged("waste")} />
              </div>
            );
          })}
        </div>
      );
    }

    const top = game.waste[game.waste.length - 1];
    return (
      <div
        onMouseDown={(e) => { e.preventDefault(); startDrag(e, "waste"); }}
        onTouchStart={(e) => startDrag(e, "waste")}
      >
        <CardFace card={top} selected={isSel("waste")} ghost={isDragged("waste")} />
      </div>
    );
  })();

  // Foundations
  const foundationsEl = (
    <div style={{ display: "flex", gap: D.gap }}>
      {game.foundations.map((fnd, fi) => (
        <div
          key={fi}
          onClick={(e) => {
            e.stopPropagation();
            if (sel) {
              const moved = tryMove(sel.source, sel.colIdx, sel.cardIdx, "foundation", fi);
              if (!moved) setSel(null);
            } else if (fnd.length > 0) {
              handleClick("foundation", fi);
            }
          }}
          onMouseDown={fnd.length > 0 ? (e) => { e.preventDefault(); startDrag(e, "foundation", fi); } : undefined}
          onTouchStart={fnd.length > 0 ? (e) => startDrag(e, "foundation", fi) : undefined}
        >
          {fnd.length > 0
            ? <CardFace card={fnd[fnd.length - 1]} selected={isSel("foundation", fi)} ghost={isDragged("foundation", fi)} />
            : <EmptySlot />
          }
        </div>
      ))}
    </div>
  );

  // Tableau
  const tableauEl = (
    <div style={{ display: "flex", gap: D.gap, width: D.boardW }}>
      {game.tableau.map((col, ci) => (
        <div
          key={ci}
          style={{ width: D.w, height: colHeight(col), position: "relative", flexShrink: 0 }}
          onClick={(e) => {
            e.stopPropagation();
            if (col.length === 0 && sel) {
              const moved = tryMove(sel.source, sel.colIdx, sel.cardIdx, "tableau", ci);
              if (!moved) setSel(null);
            } else if (col.length === 0) {
              // Clicking empty column with selection
              handleClick("tableau", ci, 0);
            }
          }}
        >
          {col.length === 0 ? (
            <EmptySlot />
          ) : (
            col.map((card, idx) => {
              const top = colTop(col, idx);
              const ghost = isDragged("tableau", ci, idx);
              return (
                <div
                  key={card.id}
                  style={{ position: "absolute", top, left: 0, zIndex: idx }}
                  onMouseDown={card.faceUp ? (e) => { e.preventDefault(); e.stopPropagation(); startDrag(e, "tableau", ci, idx); } : undefined}
                  onTouchStart={card.faceUp ? (e) => { e.stopPropagation(); startDrag(e, "tableau", ci, idx); } : undefined}
                  onClick={card.faceUp ? (e) => { e.stopPropagation(); handleClick("tableau", ci, idx); } : undefined}
                >
                  {card.faceUp
                    ? <CardFace card={card} selected={isSel("tableau", ci, idx)} ghost={ghost} />
                    : <CardBack />
                  }
                </div>
              );
            })
          )}
        </div>
      ))}
    </div>
  );

  // Floating drag cards
  const dragEl = drag && drag.active ? (
    <div
      style={{
        position: "fixed",
        left: drag.x - D.w / 2,
        top: drag.y - 15,
        zIndex: 10000,
        pointerEvents: "none",
        filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.6))",
      }}
    >
      {drag.cards.map((card, i) => (
        <div key={card.id} style={{ marginTop: i > 0 ? D.upOff - D.h : 0 }}>
          <CardFace card={card} selected={false} />
        </div>
      ))}
    </div>
  ) : null;

  // ── Main render ──

  return (
    <div
      className="flex flex-col items-center gap-2 sm:gap-3 p-2 sm:p-4 select-none w-full"
      onClick={() => setSel(null)}
    >
      {/* Controls */}
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
        <div className="flex gap-1.5 sm:gap-2">
          {([{ key: "draw1" as DrawMode, label: "Draw 1" }, { key: "draw3" as DrawMode, label: "Draw 3" }]).map((d) => (
            <button
              key={d.key}
              onClick={(e) => { e.stopPropagation(); changeMode(d.key); }}
              className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                mode === d.key
                  ? "bg-wojak-green text-black"
                  : "bg-wojak-card border border-wojak-border text-gray-300 hover:text-white hover:bg-white/5"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); undo(); }}
          disabled={history.length === 0}
          className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
            history.length > 0
              ? "bg-wojak-card border border-wojak-border text-gray-300 hover:text-white hover:bg-white/5"
              : "bg-wojak-card/50 border border-wojak-border/50 text-gray-600 cursor-not-allowed"
          }`}
        >
          Undo
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); newDeal(); }}
          className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm bg-wojak-card border border-wojak-border text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
        >
          New Deal
        </button>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs sm:text-sm text-gray-400 font-mono">
        <span>Moves: <span style={{ color: GREEN }}>{moves}</span></span>
        <span>Time: <span style={{ color: GREEN }}>{fmtTime(time)}</span></span>
      </div>

      {/* Board */}
      <div ref={boardRef} style={{ width: "100%", maxWidth: 560 }}>
        {/* Top row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: D.boardW, margin: "0 auto" }}>
          <div style={{ display: "flex", gap: D.gap, alignItems: "flex-start" }}>
            {stockEl}
            {wasteEl}
          </div>
          {foundationsEl}
        </div>

        {/* Tableau */}
        <div style={{ marginTop: D.gap * 3, display: "flex", justifyContent: "center" }}>
          {tableauEl}
        </div>
      </div>

      {/* Floating drag cards */}
      {dragEl}

      {/* Win overlay */}
      {won && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
          <div
            className="bg-wojak-dark border rounded-xl p-6 sm:p-8 flex flex-col items-center gap-4 mx-4 animate-bounce"
            style={{ borderColor: "rgba(0,255,65,0.4)", boxShadow: "0 0 40px rgba(0,255,65,0.3), 0 0 80px rgba(0,255,65,0.1)" }}
          >
            <div className="text-2xl sm:text-3xl font-bold" style={{ color: GREEN }}>You Win!</div>
            <div className="text-gray-400 text-sm sm:text-base text-center">
              Completed in {moves} moves and {fmtTime(time)}
            </div>
            <button
              onClick={newDeal}
              className="px-6 py-2.5 bg-wojak-green text-black font-bold rounded-lg hover:bg-wojak-green/80 transition-colors text-sm sm:text-base"
            >
              Play Again
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="text-gray-500 text-xs text-center max-w-md px-2">
        <span className="hidden sm:inline">Click to select, click destination to move. Drag cards to move. Double-click to auto-send to foundation.</span>
        <span className="sm:hidden">Tap to select, tap destination to move. Drag to move. Double-tap for auto-send.</span>
      </div>
    </div>
  );
}
