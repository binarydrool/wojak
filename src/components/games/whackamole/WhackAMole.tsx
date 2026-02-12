"use client";

import { useState, useCallback, useEffect, useRef } from "react";

// ── Types ──

type Difficulty = "easy" | "medium" | "hard" | "expert";
type GamePhase = "idle" | "playing" | "gameover";

interface DifficultyConfig {
  popUpDuration: number;   // ms PEPE stays visible
  spawnInterval: number;   // ms between spawns
  maxMoles: number;        // max simultaneous moles
  wojakChance: number;     // 0-1, chance a mole is a WOJAK decoy
  wojakPenalty: number;     // points lost for whacking WOJAK
}

interface Mole {
  id: number;
  holeIndex: number;
  isWojak: boolean;
  spawnTime: number;
  whacked: boolean;
  bonking: boolean;
}

// ── Constants ──

const DIFFICULTIES: { key: Difficulty; label: string; config: DifficultyConfig }[] = [
  { key: "easy",   label: "Easy",   config: { popUpDuration: 1500, spawnInterval: 1200, maxMoles: 1, wojakChance: 0,    wojakPenalty: 0  } },
  { key: "medium", label: "Medium", config: { popUpDuration: 1000, spawnInterval: 900,  maxMoles: 2, wojakChance: 0,    wojakPenalty: 0  } },
  { key: "hard",   label: "Hard",   config: { popUpDuration: 700,  spawnInterval: 700,  maxMoles: 3, wojakChance: 0.2,  wojakPenalty: 1  } },
  { key: "expert", label: "Expert", config: { popUpDuration: 500,  spawnInterval: 500,  maxMoles: 4, wojakChance: 0.35, wojakPenalty: 2  } },
];

const GAME_DURATION = 30; // seconds
const PEPE_IMG = "/images/pepe1.jpg";
const WOJAK_IMG = "/images/favicon.jpg";

// ── Main component ──

export default function WhackAMole() {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [phase, setPhase] = useState<GamePhase>("idle");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [bestScores, setBestScores] = useState<Record<Difficulty, number>>({
    easy: 0, medium: 0, hard: 0, expert: 0,
  });
  const [moles, setMoles] = useState<Mole[]>([]);

  const phaseRef = useRef<GamePhase>("idle");
  const scoreRef = useRef(0);
  const molesRef = useRef<Mole[]>([]);
  const moleIdRef = useRef(0);
  const spawnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cleanupTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeLeftRef = useRef(GAME_DURATION);
  const difficultyRef = useRef<Difficulty>("easy");

  // Keep refs in sync
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { molesRef.current = moles; }, [moles]);
  useEffect(() => { difficultyRef.current = difficulty; }, [difficulty]);

  const getConfig = useCallback((): DifficultyConfig => {
    return DIFFICULTIES.find((d) => d.key === difficultyRef.current)!.config;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (spawnTimerRef.current) clearTimeout(spawnTimerRef.current);
      if (tickTimerRef.current) clearInterval(tickTimerRef.current);
      if (cleanupTimerRef.current) clearInterval(cleanupTimerRef.current);
    };
  }, []);

  // Remove expired moles (ones that weren't whacked in time)
  const cleanupMoles = useCallback(() => {
    const now = Date.now();
    const config = getConfig();
    setMoles((prev) => {
      const filtered = prev.filter((m) => {
        if (m.whacked || m.bonking) {
          // Keep bonking moles for a bit for the animation
          return now - m.spawnTime < config.popUpDuration + 400;
        }
        return now - m.spawnTime < config.popUpDuration;
      });
      molesRef.current = filtered;
      return filtered;
    });
  }, [getConfig]);

  // Spawn a new mole
  const spawnMole = useCallback(() => {
    if (phaseRef.current !== "playing") return;

    const config = getConfig();
    const currentMoles = molesRef.current.filter((m) => !m.whacked && !m.bonking);

    if (currentMoles.length >= config.maxMoles) {
      // Schedule next spawn attempt
      spawnTimerRef.current = setTimeout(spawnMole, config.spawnInterval / 2);
      return;
    }

    // Pick a hole not currently occupied
    const occupiedHoles = new Set(currentMoles.map((m) => m.holeIndex));
    const availableHoles = Array.from({ length: 9 }, (_, i) => i).filter(
      (i) => !occupiedHoles.has(i)
    );

    if (availableHoles.length === 0) {
      spawnTimerRef.current = setTimeout(spawnMole, config.spawnInterval / 2);
      return;
    }

    const holeIndex = availableHoles[Math.floor(Math.random() * availableHoles.length)];
    const isWojak = config.wojakChance > 0 && Math.random() < config.wojakChance;

    const newMole: Mole = {
      id: moleIdRef.current++,
      holeIndex,
      isWojak,
      spawnTime: Date.now(),
      whacked: false,
      bonking: false,
    };

    setMoles((prev) => {
      const updated = [...prev, newMole];
      molesRef.current = updated;
      return updated;
    });

    // Schedule next spawn
    spawnTimerRef.current = setTimeout(spawnMole, config.spawnInterval);
  }, [getConfig]);

  // End the game
  const endGame = useCallback(() => {
    if (spawnTimerRef.current) clearTimeout(spawnTimerRef.current);
    if (tickTimerRef.current) clearInterval(tickTimerRef.current);
    if (cleanupTimerRef.current) clearInterval(cleanupTimerRef.current);

    setPhase("gameover");
    phaseRef.current = "gameover";

    const finalScore = scoreRef.current;
    const diff = difficultyRef.current;
    setBestScores((prev) => ({
      ...prev,
      [diff]: Math.max(prev[diff], finalScore),
    }));
  }, []);

  // Start the game
  const startGame = useCallback(() => {
    // Clear any existing timers
    if (spawnTimerRef.current) clearTimeout(spawnTimerRef.current);
    if (tickTimerRef.current) clearInterval(tickTimerRef.current);
    if (cleanupTimerRef.current) clearInterval(cleanupTimerRef.current);

    setScore(0);
    scoreRef.current = 0;
    setTimeLeft(GAME_DURATION);
    timeLeftRef.current = GAME_DURATION;
    setMoles([]);
    molesRef.current = [];
    moleIdRef.current = 0;
    setPhase("playing");
    phaseRef.current = "playing";

    // Countdown timer
    tickTimerRef.current = setInterval(() => {
      timeLeftRef.current -= 1;
      setTimeLeft(timeLeftRef.current);
      if (timeLeftRef.current <= 0) {
        endGame();
      }
    }, 1000);

    // Mole cleanup timer
    cleanupTimerRef.current = setInterval(() => {
      if (phaseRef.current === "playing") {
        const now = Date.now();
        const config = DIFFICULTIES.find((d) => d.key === difficultyRef.current)!.config;
        setMoles((prev) => {
          const filtered = prev.filter((m) => {
            if (m.bonking) return now - m.spawnTime < config.popUpDuration + 400;
            if (m.whacked) return false;
            return now - m.spawnTime < config.popUpDuration;
          });
          molesRef.current = filtered;
          return filtered;
        });
      }
    }, 100);

    // Start spawning after a brief delay
    setTimeout(() => {
      if (phaseRef.current === "playing") {
        spawnMole();
      }
    }, 500);
  }, [endGame, spawnMole]);

  // Whack a mole
  const handleWhack = useCallback((moleId: number) => {
    if (phaseRef.current !== "playing") return;

    // Check if mole can be whacked using ref (avoids double-fire from strict mode)
    const mole = molesRef.current.find((m) => m.id === moleId);
    if (!mole || mole.whacked || mole.bonking) return;

    // Update score
    if (mole.isWojak) {
      const config = DIFFICULTIES.find((d) => d.key === difficultyRef.current)!.config;
      scoreRef.current -= config.wojakPenalty;
    } else {
      scoreRef.current += 1;
    }
    setScore(scoreRef.current);

    // Mark mole as whacked
    const updated = molesRef.current.map((m) =>
      m.id === moleId ? { ...m, whacked: true, bonking: true } : m
    );
    molesRef.current = updated;
    setMoles(updated);
  }, []);

  const handleDifficultyChange = useCallback((diff: Difficulty) => {
    if (spawnTimerRef.current) clearTimeout(spawnTimerRef.current);
    if (tickTimerRef.current) clearInterval(tickTimerRef.current);
    if (cleanupTimerRef.current) clearInterval(cleanupTimerRef.current);

    setDifficulty(diff);
    difficultyRef.current = diff;
    setPhase("idle");
    phaseRef.current = "idle";
    setScore(0);
    scoreRef.current = 0;
    setTimeLeft(GAME_DURATION);
    timeLeftRef.current = GAME_DURATION;
    setMoles([]);
    molesRef.current = [];
  }, []);

  // Get mole at a specific hole (if any active)
  const getMoleAtHole = (holeIndex: number): Mole | undefined => {
    return moles.find((m) => m.holeIndex === holeIndex && !m.whacked);
  };

  const getBonkingMoleAtHole = (holeIndex: number): Mole | undefined => {
    return moles.find((m) => m.holeIndex === holeIndex && m.bonking);
  };

  const config = getConfig();

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
      <div className="flex items-center gap-3 sm:gap-4 bg-wojak-card border border-wojak-border rounded-xl px-3 sm:px-4 py-2 min-w-[240px] sm:min-w-[320px] justify-between">
        <div className="flex flex-col items-center">
          <span className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider">Score</span>
          <span className="text-sm sm:text-base font-bold text-wojak-green font-mono">
            {score}
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider">Time</span>
          <span className={`text-sm sm:text-base font-bold font-mono ${
            timeLeft <= 5 ? "text-red-400 animate-pulse" : "text-wojak-green"
          }`}>
            {timeLeft}s
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider">Best</span>
          <span className="text-sm sm:text-base font-bold text-yellow-400 font-mono">
            {bestScores[difficulty]}
          </span>
        </div>
      </div>

      {/* Game grid */}
      <div className="relative">
        <div
          className="grid grid-cols-3 gap-3 sm:gap-4"
          style={{ width: "min(85vw, 340px)" }}
        >
          {Array.from({ length: 9 }, (_, i) => {
            const activeMole = getMoleAtHole(i);
            const bonkingMole = getBonkingMoleAtHole(i);
            const displayMole = activeMole || bonkingMole;
            const isBonking = !!bonkingMole && !activeMole;

            return (
              <div
                key={i}
                className="relative aspect-square flex items-end justify-center"
              >
                {/* Hole background */}
                <div
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-[50%]"
                  style={{
                    width: "90%",
                    height: "35%",
                    background: "radial-gradient(ellipse at center, #1a1a2e 0%, #0d0d1a 60%, #080812 100%)",
                    boxShadow: "inset 0 4px 12px rgba(0,0,0,0.8), inset 0 -1px 3px rgba(255,255,255,0.03)",
                  }}
                />

                {/* Mole container with clip mask */}
                <div
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 overflow-hidden"
                  style={{
                    width: "75%",
                    height: "85%",
                  }}
                >
                  {displayMole && (
                    <div
                      className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-full flex items-center justify-center transition-transform ${
                        isBonking ? "" : "animate-mole-pop"
                      }`}
                      style={{
                        transform: isBonking
                          ? "translateX(-50%) translateY(100%)"
                          : undefined,
                        animation: isBonking
                          ? "moleBonk 0.4s ease-out forwards"
                          : undefined,
                      }}
                    >
                      <button
                        onClick={() => displayMole && !isBonking && handleWhack(displayMole.id)}
                        className={`relative rounded-full overflow-hidden border-2 ${
                          displayMole.isWojak
                            ? "border-red-400/60"
                            : "border-wojak-green/60"
                        } ${phase === "playing" && !isBonking ? "cursor-pointer active:scale-90" : "cursor-default"}`}
                        style={{
                          width: "clamp(48px, 15vw, 72px)",
                          height: "clamp(48px, 15vw, 72px)",
                          boxShadow: displayMole.isWojak
                            ? "0 0 12px rgba(255,68,68,0.3)"
                            : "0 0 12px rgba(0,255,65,0.3)",
                        }}
                        disabled={isBonking || phase !== "playing"}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={displayMole.isWojak ? WOJAK_IMG : PEPE_IMG}
                          alt={displayMole.isWojak ? "WOJAK" : "PEPE"}
                          className="w-full h-full object-cover"
                          draggable={false}
                        />
                        {isBonking && (
                          <div className="absolute inset-0 bg-white/50 animate-pulse" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Idle overlay */}
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
              <span className="text-lg sm:text-xl font-bold text-red-400">Time&apos;s Up!</span>
              <div className="text-center">
                <p className="text-gray-300 text-sm">
                  Final Score: <span className="text-wojak-green font-bold text-lg">{score}</span>
                </p>
                {score === bestScores[difficulty] && score > 0 && (
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

      {/* Penalty warning for Hard/Expert */}
      {(difficulty === "hard" || difficulty === "expert") && (
        <div className="flex items-center gap-2 bg-red-900/20 border border-red-900/30 rounded-lg px-3 py-1.5">
          <span className="text-red-400 text-xs">
            Don&apos;t whack WOJAK! ({difficulty === "hard" ? "-1" : "-2"} pts)
          </span>
        </div>
      )}

      {/* Instructions */}
      <div className="text-gray-500 text-xs text-center max-w-sm px-2">
        <span className="hidden sm:inline">
          Whack the PEPEs as they pop up! You have 30 seconds.
          {difficulty === "hard" && " Watch out for WOJAKs — whacking them costs 1 point!"}
          {difficulty === "expert" && " Watch out for WOJAKs — whacking them costs 2 points!"}
        </span>
        <span className="sm:hidden">
          Tap PEPEs to whack them! 30 seconds.
          {(difficulty === "hard" || difficulty === "expert") && " Avoid WOJAKs!"}
        </span>
      </div>

      {/* CSS animations */}
      <style jsx>{`
        @keyframes molePop {
          0% {
            transform: translateX(-50%) translateY(100%);
          }
          70% {
            transform: translateX(-50%) translateY(-10%);
          }
          100% {
            transform: translateX(-50%) translateY(0%);
          }
        }
        @keyframes moleBonk {
          0% {
            transform: translateX(-50%) translateY(0%) scale(1);
          }
          20% {
            transform: translateX(-50%) translateY(0%) scale(0.7, 1.3);
          }
          40% {
            transform: translateX(-50%) translateY(0%) scale(1.1, 0.8);
          }
          100% {
            transform: translateX(-50%) translateY(100%) scale(0.8);
          }
        }
        .animate-mole-pop {
          animation: molePop 0.25s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
