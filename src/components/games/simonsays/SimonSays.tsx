"use client";

import { useState, useCallback, useEffect, useRef } from "react";

// ── Types ──

type Difficulty = "easy" | "medium" | "hard" | "expert";
type GamePhase = "idle" | "watching" | "playing" | "gameover";

interface DifficultyConfig {
  flashDuration: number; // ms each button stays lit
  pauseDuration: number; // ms between flashes
}

// ── Constants ──

const DIFFICULTIES: { key: Difficulty; label: string; config: DifficultyConfig }[] = [
  { key: "easy", label: "Easy", config: { flashDuration: 800, pauseDuration: 300 } },
  { key: "medium", label: "Medium", config: { flashDuration: 600, pauseDuration: 250 } },
  { key: "hard", label: "Hard", config: { flashDuration: 400, pauseDuration: 200 } },
  { key: "expert", label: "Expert", config: { flashDuration: 300, pauseDuration: 150 } },
];

interface ButtonDef {
  id: number;
  color: string;       // inactive/dim color
  activeColor: string;  // lit/active color
  glowColor: string;    // glow shadow color
  freq: number;         // oscillator frequency in Hz
}

const BASE_BUTTONS: ButtonDef[] = [
  { id: 0, color: "#004d14", activeColor: "#00ff41", glowColor: "#00ff41", freq: 329.63 },  // bright green - E4
  { id: 1, color: "#00330d", activeColor: "#009926", glowColor: "#009926", freq: 261.63 },  // mid green - C4
  { id: 2, color: "#001a06", activeColor: "#006619", glowColor: "#006619", freq: 220.00 },  // dark green - A3
  { id: 3, color: "#0a5c1f", activeColor: "#33ff66", glowColor: "#33ff66", freq: 392.00 },  // light green - G4
];

const FIFTH_BUTTON: ButtonDef = {
  id: 4, color: "#1a4d00", activeColor: "#66ff8c", glowColor: "#66ff8c", freq: 440.00,  // extra green - A4
};

const ERROR_FREQ = 110; // low buzz for wrong answer

// ── Audio ──

function playTone(freq: number, duration: number, audioCtxRef: React.MutableRefObject<AudioContext | null>) {
  try {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration / 1000);
  } catch {
    // Audio not supported - fail silently
  }
}

// ── Main component ──

export default function SimonSays() {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [phase, setPhase] = useState<GamePhase>("idle");
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerIndex, setPlayerIndex] = useState(0);
  const [activeButton, setActiveButton] = useState<number | null>(null);
  const [pressedButton, setPressedButton] = useState<number | null>(null);
  const [round, setRound] = useState(0);
  const [bestRound, setBestRound] = useState(0);
  const [showExtraButton, setShowExtraButton] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sequenceRef = useRef<number[]>([]);
  const phaseRef = useRef<GamePhase>("idle");
  const abortRef = useRef(false);

  // Keep refs in sync
  useEffect(() => {
    sequenceRef.current = sequence;
  }, [sequence]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };
  }, []);

  const getButtons = useCallback((): ButtonDef[] => {
    if (difficulty === "expert" && showExtraButton) {
      return [...BASE_BUTTONS, FIFTH_BUTTON];
    }
    return BASE_BUTTONS;
  }, [difficulty, showExtraButton]);

  const getConfig = useCallback((): DifficultyConfig => {
    return DIFFICULTIES.find((d) => d.key === difficulty)!.config;
  }, [difficulty]);

  // Play the sequence with flashing + sounds
  const playSequence = useCallback(
    (seq: number[]) => {
      const config = getConfig();
      setPhase("watching");
      phaseRef.current = "watching";
      abortRef.current = false;

      let i = 0;

      const flashNext = () => {
        if (abortRef.current) return;
        if (i >= seq.length) {
          // Done showing sequence - player's turn
          setPhase("playing");
          phaseRef.current = "playing";
          setPlayerIndex(0);
          return;
        }

        const btnId = seq[i];
        const btn = [...BASE_BUTTONS, FIFTH_BUTTON].find((b) => b.id === btnId);

        // Light up
        setActiveButton(btnId);
        if (btn) playTone(btn.freq, config.flashDuration, audioCtxRef);

        timeoutRef.current = setTimeout(() => {
          if (abortRef.current) return;
          setActiveButton(null);

          // Pause before next flash
          timeoutRef.current = setTimeout(() => {
            if (abortRef.current) return;
            i++;
            flashNext();
          }, config.pauseDuration);
        }, config.flashDuration);
      };

      // Small delay before starting playback
      timeoutRef.current = setTimeout(() => {
        if (abortRef.current) return;
        flashNext();
      }, 500);
    },
    [getConfig]
  );

  // Start a new game
  const startGame = useCallback(() => {
    abortRef.current = true;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    const maxBtns = difficulty === "expert" ? 4 : 4; // start with 4 even on expert
    const firstStep = Math.floor(Math.random() * maxBtns);
    const newSeq = [firstStep];

    setSequence(newSeq);
    sequenceRef.current = newSeq;
    setRound(1);
    setPlayerIndex(0);
    setActiveButton(null);
    setPressedButton(null);
    setShowExtraButton(false);

    // Small delay then play
    setTimeout(() => {
      abortRef.current = false;
      playSequence(newSeq);
    }, 100);
  }, [difficulty, playSequence]);

  // Add next step to sequence and replay
  const advanceRound = useCallback(() => {
    const currentSeq = sequenceRef.current;
    const newRound = currentSeq.length + 1;

    // Expert: add 5th button after round 10
    const useExtraButton = difficulty === "expert" && newRound > 10;
    setShowExtraButton(useExtraButton);

    const maxBtns = useExtraButton ? 5 : 4;
    const nextStep = Math.floor(Math.random() * maxBtns);
    const newSeq = [...currentSeq, nextStep];

    setSequence(newSeq);
    sequenceRef.current = newSeq;
    setRound(newRound);
    setPlayerIndex(0);

    // Delay before replaying
    setTimeout(() => {
      if (!abortRef.current) {
        playSequence(newSeq);
      }
    }, 800);
  }, [difficulty, playSequence]);

  // Handle player button press
  const handleButtonPress = useCallback(
    (btnId: number) => {
      if (phaseRef.current !== "playing") return;

      const btn = [...BASE_BUTTONS, FIFTH_BUTTON].find((b) => b.id === btnId);
      if (btn) playTone(btn.freq, 200, audioCtxRef);

      setPressedButton(btnId);
      setActiveButton(btnId);

      // Brief visual feedback
      setTimeout(() => {
        setPressedButton(null);
        setActiveButton(null);
      }, 200);

      const currentSeq = sequenceRef.current;
      const expectedBtn = currentSeq[playerIndex];

      if (btnId !== expectedBtn) {
        // Wrong button - game over
        playTone(ERROR_FREQ, 500, audioCtxRef);
        setPhase("gameover");
        phaseRef.current = "gameover";
        const finalRound = currentSeq.length;
        setBestRound((prev) => Math.max(prev, finalRound));
        return;
      }

      // Correct button
      const nextIndex = playerIndex + 1;

      if (nextIndex >= currentSeq.length) {
        // Completed the full sequence - advance
        setPhase("watching");
        phaseRef.current = "watching";
        setPlayerIndex(nextIndex);
        advanceRound();
      } else {
        setPlayerIndex(nextIndex);
      }
    },
    [playerIndex, advanceRound]
  );

  const handleDifficultyChange = useCallback(
    (diff: Difficulty) => {
      abortRef.current = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setDifficulty(diff);
      setPhase("idle");
      phaseRef.current = "idle";
      setSequence([]);
      sequenceRef.current = [];
      setRound(0);
      setPlayerIndex(0);
      setActiveButton(null);
      setPressedButton(null);
      setBestRound(0);
      setShowExtraButton(false);
    },
    []
  );

  const buttons = getButtons();
  const isPlaying = phase === "playing";
  const isWatching = phase === "watching";

  return (
    <div className="flex flex-col items-center gap-2 sm:gap-3 p-2 sm:p-4 select-none w-full max-w-fit mx-auto">
      {/* Difficulty selector */}
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
        <div className="flex gap-1.5 sm:gap-2">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.key}
              onClick={() => handleDifficultyChange(d.key)}
              className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                difficulty === d.key
                  ? "bg-wojak-green text-black"
                  : "bg-wojak-card border border-wojak-border text-gray-300 hover:text-white hover:bg-white/5"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-3 sm:gap-4 bg-wojak-card border border-wojak-border rounded-xl px-3 sm:px-4 py-2 min-w-[240px] sm:min-w-[280px] justify-between">
        <div className="flex flex-col items-center">
          <span className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider">Round</span>
          <span className="text-sm sm:text-base font-bold text-wojak-green font-mono">
            {round}
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider">Best</span>
          <span className="text-sm sm:text-base font-bold text-yellow-400 font-mono">
            {bestRound}
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider">Status</span>
          <span className={`text-xs sm:text-sm font-medium ${
            phase === "idle" ? "text-gray-400" :
            phase === "watching" ? "text-yellow-400 animate-pulse" :
            phase === "playing" ? "text-wojak-green" :
            "text-red-400"
          }`}>
            {phase === "idle" ? "Ready" :
             phase === "watching" ? "Watch..." :
             phase === "playing" ? "Your turn" :
             "Game Over"}
          </span>
        </div>
      </div>

      {/* Button grid */}
      <div className="relative">
        <div
          className={`grid gap-3 sm:gap-4 ${buttons.length === 5 ? "grid-cols-3" : "grid-cols-2"}`}
          style={{
            width: "min(85vw, 320px)",
          }}
        >
          {buttons.map((btn) => {
            const isActive = activeButton === btn.id;
            const isPressed = pressedButton === btn.id;
            const canPress = isPlaying;

            return (
              <button
                key={btn.id}
                onClick={() => handleButtonPress(btn.id)}
                disabled={!canPress}
                className={`relative aspect-square rounded-2xl transition-all duration-150 ${
                  canPress ? "cursor-pointer active:scale-95" : "cursor-default"
                } ${buttons.length === 5 && btn.id === 4 ? "col-start-2" : ""}`}
                style={{
                  backgroundColor: isActive ? btn.activeColor : btn.color,
                  boxShadow: isActive
                    ? `0 0 20px ${btn.glowColor}, 0 0 40px ${btn.glowColor}80, 0 0 60px ${btn.glowColor}40, inset 0 0 20px ${btn.glowColor}40`
                    : isPressed
                    ? `0 0 10px ${btn.glowColor}60`
                    : `inset 0 2px 4px rgba(255,255,255,0.05), inset 0 -2px 4px rgba(0,0,0,0.3)`,
                  border: isActive
                    ? `2px solid ${btn.activeColor}`
                    : "2px solid rgba(255,255,255,0.05)",
                  opacity: phase === "gameover" ? 0.4 : isWatching && !isActive ? 0.5 : 1,
                  transform: isActive ? "scale(1.05)" : isPressed ? "scale(0.95)" : "scale(1)",
                }}
              />
            );
          })}
        </div>

        {/* Idle overlay - start button */}
        {phase === "idle" && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <button
              onClick={startGame}
              className="px-6 py-3 bg-wojak-green text-black font-bold rounded-xl hover:bg-wojak-green/80 transition-colors text-sm sm:text-base shadow-lg shadow-wojak-green/20"
            >
              Start Game
            </button>
          </div>
        )}

        {/* Game over overlay */}
        {phase === "gameover" && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10 rounded-2xl">
            <div className="bg-wojak-dark border border-wojak-border rounded-xl p-4 sm:p-6 flex flex-col items-center gap-3 mx-4">
              <span className="text-lg sm:text-xl font-bold text-red-400">Game Over!</span>
              <div className="text-center">
                <p className="text-gray-300 text-sm">
                  You reached round <span className="text-wojak-green font-bold">{round}</span>
                </p>
                {round === bestRound && round > 0 && (
                  <p className="text-yellow-400 text-xs mt-1">New best!</p>
                )}
              </div>
              <button
                onClick={startGame}
                className="px-4 py-2 bg-wojak-green text-black font-bold rounded-lg hover:bg-wojak-green/80 transition-colors text-sm sm:text-base"
              >
                Play Again
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="text-gray-500 text-xs text-center max-w-sm px-2">
        <span className="hidden sm:inline">
          Watch the sequence, then repeat it by clicking the buttons in order.
          {difficulty === "expert" && " A 5th button appears after round 10!"}
        </span>
        <span className="sm:hidden">
          Watch, then repeat the pattern
          {difficulty === "expert" && ". 5th button after round 10!"}
        </span>
      </div>
    </div>
  );
}
