"use client";

import { useState, useCallback, useEffect, useRef } from "react";

// ── Difficulty config ──

type Difficulty = "easy" | "medium" | "hard" | "expert";

interface DifficultyConfig {
  label: string;
  rows: number;
  cols: number;
  invaderSpeed: number;
  invaderDropSpeed: number;
  invaderFireRate: number; // lower = more frequent (frames between shots)
  invaderBulletSpeed: number;
  playerBulletSpeed: number;
  playerFireCooldown: number; // frames between player shots
  speedUpFactor: number; // how much invaders speed up as numbers thin
  hasBoss: boolean;
}

const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  easy: {
    label: "Easy",
    rows: 3,
    cols: 6,
    invaderSpeed: 0.6,
    invaderDropSpeed: 12,
    invaderFireRate: 120,
    invaderBulletSpeed: 2.5,
    playerBulletSpeed: 6,
    playerFireCooldown: 15,
    speedUpFactor: 1.2,
    hasBoss: false,
  },
  medium: {
    label: "Medium",
    rows: 4,
    cols: 8,
    invaderSpeed: 0.8,
    invaderDropSpeed: 14,
    invaderFireRate: 80,
    invaderBulletSpeed: 3,
    playerBulletSpeed: 6,
    playerFireCooldown: 18,
    speedUpFactor: 1.4,
    hasBoss: false,
  },
  hard: {
    label: "Hard",
    rows: 5,
    cols: 8,
    invaderSpeed: 1.0,
    invaderDropSpeed: 16,
    invaderFireRate: 50,
    invaderBulletSpeed: 4,
    playerBulletSpeed: 6,
    playerFireCooldown: 20,
    speedUpFactor: 1.6,
    hasBoss: false,
  },
  expert: {
    label: "Expert",
    rows: 5,
    cols: 10,
    invaderSpeed: 1.2,
    invaderDropSpeed: 18,
    invaderFireRate: 35,
    invaderBulletSpeed: 4.5,
    playerBulletSpeed: 7,
    playerFireCooldown: 18,
    speedUpFactor: 2.5,
    hasBoss: true,
  },
};

// ── Canvas dimensions ──

const CANVAS_W = 480;
const CANVAS_H = 600;

// ── Player config ──

const PLAYER_W = 40;
const PLAYER_H = 40;
const PLAYER_Y = CANVAS_H - 50;
const PLAYER_SPEED = 4;

// ── Invader config ──

const INVADER_W = 28;
const INVADER_H = 28;
const INVADER_PAD_X = 8;
const INVADER_PAD_Y = 8;
const INVADER_OFFSET_TOP = 50;

// ── Boss config ──

const BOSS_W = 56;
const BOSS_H = 56;
const BOSS_HP = 5;

// ── Bullet config ──

const BULLET_W = 3;
const BULLET_H = 10;

// ── Images ──

const WOJAK_IMG = "/images/favicon.jpg";
const PEPE_IMG = "/images/pepe1.jpg";

// ── Colors ──

const GREEN = "#00ff41";
const DARK_GREEN = "#009926";
const BG_COLOR = "#0a0a0a";
const ENEMY_BULLET_COLOR = "#ff6b35";
const EXPLOSION_COLOR = "#00ff41";

// ── Types ──

interface Invader {
  x: number;
  y: number;
  alive: boolean;
  isBoss: boolean;
  hp: number;
  maxHp: number;
}

interface Bullet {
  x: number;
  y: number;
  dy: number;
  isPlayer: boolean;
}

interface Explosion {
  x: number;
  y: number;
  frame: number;
  maxFrames: number;
}

interface GameStateData {
  playerX: number;
  invaders: Invader[];
  playerBullets: Bullet[];
  enemyBullets: Bullet[];
  explosions: Explosion[];
  lives: number;
  score: number;
  wave: number;
  direction: number; // 1 = right, -1 = left
  status: "idle" | "playing" | "won" | "lost";
  frameCount: number;
  fireCooldown: number;
  invaderFireTimer: number;
  playerHitTimer: number; // invincibility frames after being hit
  totalInvaders: number;
}

// ── Helpers ──

function createInvaders(config: DifficultyConfig, wave: number): Invader[] {
  const invaders: Invader[] = [];
  const totalW = config.cols * (INVADER_W + INVADER_PAD_X) - INVADER_PAD_X;
  const offsetX = (CANVAS_W - totalW) / 2;

  for (let row = 0; row < config.rows; row++) {
    for (let col = 0; col < config.cols; col++) {
      invaders.push({
        x: offsetX + col * (INVADER_W + INVADER_PAD_X),
        y: INVADER_OFFSET_TOP + row * (INVADER_H + INVADER_PAD_Y),
        alive: true,
        isBoss: false,
        hp: 1,
        maxHp: 1,
      });
    }
  }

  // Add boss PEPE on Expert every wave
  if (config.hasBoss) {
    const bossHp = BOSS_HP + Math.floor(wave / 2);
    invaders.push({
      x: CANVAS_W / 2 - BOSS_W / 2,
      y: 10,
      alive: true,
      isBoss: true,
      hp: bossHp,
      maxHp: bossHp,
    });
  }

  return invaders;
}

function createInitialState(config: DifficultyConfig, wave: number): GameStateData {
  const invaders = createInvaders(config, wave);
  return {
    playerX: CANVAS_W / 2 - PLAYER_W / 2,
    invaders,
    playerBullets: [],
    enemyBullets: [],
    explosions: [],
    lives: 3,
    score: 0,
    wave,
    direction: 1,
    status: "idle",
    frameCount: 0,
    fireCooldown: 0,
    invaderFireTimer: 0,
    playerHitTimer: 0,
    totalInvaders: invaders.length,
  };
}

// ── Main component ──

export default function SpaceInvaders() {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameStateData>(createInitialState(DIFFICULTIES[difficulty], 1));
  const animRef = useRef<number>(0);
  const keysRef = useRef<Set<string>>(new Set());
  const wojakImgRef = useRef<HTMLImageElement | null>(null);
  const pepeImgRef = useRef<HTMLImageElement | null>(null);
  const touchXRef = useRef<number | null>(null);
  const touchFireRef = useRef<boolean>(false);
  const mouseXRef = useRef<number | null>(null);
  const mouseFireRef = useRef<boolean>(false);
  const [displayState, setDisplayState] = useState<{
    lives: number;
    score: number;
    wave: number;
    status: string;
  }>({ lives: 3, score: 0, wave: 1, status: "idle" });

  const bestScoresRef = useRef<Record<Difficulty, number>>({
    easy: 0, medium: 0, hard: 0, expert: 0,
  });

  const difficultyRef = useRef<Difficulty>(difficulty);
  useEffect(() => { difficultyRef.current = difficulty; }, [difficulty]);

  // Load images
  useEffect(() => {
    const wImg = new Image();
    wImg.src = WOJAK_IMG;
    wImg.onload = () => { wojakImgRef.current = wImg; };

    const pImg = new Image();
    pImg.src = PEPE_IMG;
    pImg.onload = () => { pepeImgRef.current = pImg; };
  }, []);

  // Reset game
  const resetGame = useCallback(
    (diff?: Difficulty, wave?: number) => {
      const cfg = DIFFICULTIES[diff || difficulty];
      const w = wave || 1;
      stateRef.current = createInitialState(cfg, w);
      setDisplayState({ lives: 3, score: 0, wave: w, status: "idle" });
    },
    [difficulty]
  );

  // Advance to next wave
  const nextWave = useCallback(() => {
    const s = stateRef.current;
    const cfg = DIFFICULTIES[difficultyRef.current];
    const newWave = s.wave + 1;
    const newInvaders = createInvaders(cfg, newWave);
    s.invaders = newInvaders;
    s.playerBullets = [];
    s.enemyBullets = [];
    s.explosions = [];
    s.wave = newWave;
    s.direction = 1;
    s.frameCount = 0;
    s.fireCooldown = 0;
    s.invaderFireTimer = 0;
    s.playerHitTimer = 0;
    s.totalInvaders = newInvaders.length;
    s.playerX = CANVAS_W / 2 - PLAYER_W / 2;
    setDisplayState((prev) => ({ ...prev, wave: newWave }));
  }, []);

  // Handle difficulty change
  const handleDifficultyChange = useCallback(
    (diff: Difficulty) => {
      setDifficulty(diff);
      cancelAnimationFrame(animRef.current);
      resetGame(diff);
    },
    [resetGame]
  );

  // Start the game
  const startGame = useCallback(() => {
    const s = stateRef.current;
    if (s.status === "idle") {
      s.status = "playing";
      setDisplayState((prev) => ({ ...prev, status: "playing" }));
    } else if (s.status === "won" || s.status === "lost") {
      resetGame();
      stateRef.current.status = "playing";
      setDisplayState((prev) => ({ ...prev, status: "playing" }));
    }
  }, [resetGame]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (["arrowleft", "arrowright", "a", "d", " "].includes(key)) {
        e.preventDefault();
      }
      keysRef.current.add(key);

      if (key === " " || key === "enter") {
        const s = stateRef.current;
        if (s.status !== "playing") {
          startGame();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [startGame]);

  // Touch controls
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getCanvasX = (clientX: number) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_W / rect.width;
      return (clientX - rect.left) * scaleX;
    };

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const s = stateRef.current;

      if (s.status !== "playing") {
        startGame();
        if (e.touches.length > 0) {
          touchXRef.current = getCanvasX(e.touches[0].clientX);
        }
        return;
      }

      if (e.touches.length === 1) {
        touchXRef.current = getCanvasX(e.touches[0].clientX);
      }
      // Second finger or fire button tap = shoot
      if (e.touches.length >= 2) {
        touchFireRef.current = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        touchXRef.current = getCanvasX(e.touches[0].clientX);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 0) {
        touchXRef.current = null;
        touchFireRef.current = false;
      }
    };

    canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("touchend", handleTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleTouchEnd);
    };
  }, [startGame]);

  // Mouse controls: move to position ship, click to shoot
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getCanvasXMouse = (clientX: number) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_W / rect.width;
      return (clientX - rect.left) * scaleX;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const x = getCanvasXMouse(e.clientX);
      mouseXRef.current = x;
    };

    const handleClick = (e: MouseEvent) => {
      e.preventDefault();
      const s = stateRef.current;
      if (s.status !== "playing") {
        startGame();
      } else {
        // Shoot on click during gameplay
        mouseFireRef.current = true;
      }
    };

    const handleMouseLeave = () => {
      mouseXRef.current = null;
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("click", handleClick);
    canvas.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("click", handleClick);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [startGame]);

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cfg = DIFFICULTIES[difficulty];

    const loop = () => {
      const s = stateRef.current;

      // ── Update logic ──
      if (s.status === "playing") {
        s.frameCount++;

        // Decrease hit invincibility timer
        if (s.playerHitTimer > 0) s.playerHitTimer--;

        // Decrease fire cooldown
        if (s.fireCooldown > 0) s.fireCooldown--;

        // ── Player movement ──
        const keys = keysRef.current;
        const moveLeft = keys.has("arrowleft") || keys.has("a");
        const moveRight = keys.has("arrowright") || keys.has("d");
        const shooting = keys.has(" ");

        if (moveLeft) s.playerX -= PLAYER_SPEED;
        if (moveRight) s.playerX += PLAYER_SPEED;

        // Mouse movement: move player toward mouse position
        if (mouseXRef.current !== null) {
          const targetX = mouseXRef.current - PLAYER_W / 2;
          s.playerX = Math.max(0, Math.min(CANVAS_W - PLAYER_W, targetX));
        }

        // Touch movement: move player toward touch position
        if (touchXRef.current !== null) {
          const targetX = touchXRef.current - PLAYER_W / 2;
          const dx = targetX - s.playerX;
          if (Math.abs(dx) > 2) {
            s.playerX += Math.sign(dx) * Math.min(Math.abs(dx), PLAYER_SPEED * 1.5);
          }
        }

        // Clamp player position
        s.playerX = Math.max(0, Math.min(CANVAS_W - PLAYER_W, s.playerX));

        // ── Player shooting ──
        if ((shooting || touchFireRef.current || mouseFireRef.current) && s.fireCooldown <= 0) {
          s.playerBullets.push({
            x: s.playerX + PLAYER_W / 2 - BULLET_W / 2,
            y: PLAYER_Y - BULLET_H,
            dy: -cfg.playerBulletSpeed,
            isPlayer: true,
          });
          s.fireCooldown = cfg.playerFireCooldown;
          touchFireRef.current = false;
          mouseFireRef.current = false;
        }

        // ── Invader movement ──
        const aliveInvaders = s.invaders.filter((inv) => inv.alive && !inv.isBoss);
        const aliveCount = aliveInvaders.length;
        const aliveBosses = s.invaders.filter((inv) => inv.alive && inv.isBoss);

        // Speed increases as invaders are destroyed
        const speedMultiplier = aliveCount > 0
          ? 1 + ((s.totalInvaders - aliveCount - aliveBosses.length) / s.totalInvaders) * (cfg.speedUpFactor - 1)
          : 1;
        const currentSpeed = cfg.invaderSpeed * speedMultiplier;

        // Check if any invader hit the edge
        let hitEdge = false;
        for (const inv of aliveInvaders) {
          if (
            (s.direction === 1 && inv.x + INVADER_W >= CANVAS_W - 5) ||
            (s.direction === -1 && inv.x <= 5)
          ) {
            hitEdge = true;
            break;
          }
        }

        if (hitEdge) {
          // Drop down and reverse direction
          for (const inv of s.invaders) {
            if (!inv.alive) continue;
            if (!inv.isBoss) {
              inv.y += cfg.invaderDropSpeed;
            }
          }
          s.direction *= -1;
        } else {
          for (const inv of aliveInvaders) {
            inv.x += currentSpeed * s.direction;
          }
        }

        // Boss moves independently side to side
        for (const boss of aliveBosses) {
          boss.x += currentSpeed * 0.5 * s.direction;
          if (boss.x + BOSS_W >= CANVAS_W - 5 || boss.x <= 5) {
            boss.x = Math.max(5, Math.min(CANVAS_W - BOSS_W - 5, boss.x));
          }
        }

        // ── Invader shooting ──
        s.invaderFireTimer++;
        if (s.invaderFireTimer >= cfg.invaderFireRate && aliveInvaders.length > 0) {
          s.invaderFireTimer = 0;
          // Pick a random alive invader to shoot
          const shooters = [...aliveInvaders, ...aliveBosses].filter((inv) => inv.alive);
          if (shooters.length > 0) {
            const shooter = shooters[Math.floor(Math.random() * shooters.length)];
            const bw = shooter.isBoss ? BOSS_W : INVADER_W;
            const bh = shooter.isBoss ? BOSS_H : INVADER_H;
            s.enemyBullets.push({
              x: shooter.x + bw / 2 - BULLET_W / 2,
              y: shooter.y + bh,
              dy: cfg.invaderBulletSpeed,
              isPlayer: false,
            });
          }
        }

        // ── Move bullets ──
        for (const b of s.playerBullets) b.y += b.dy;
        for (const b of s.enemyBullets) b.y += b.dy;

        // Remove off-screen bullets
        s.playerBullets = s.playerBullets.filter((b) => b.y + BULLET_H > 0);
        s.enemyBullets = s.enemyBullets.filter((b) => b.y < CANVAS_H);

        // ── Player bullet vs invader collision ──
        for (let bi = s.playerBullets.length - 1; bi >= 0; bi--) {
          const b = s.playerBullets[bi];
          let hit = false;

          for (const inv of s.invaders) {
            if (!inv.alive) continue;
            const iw = inv.isBoss ? BOSS_W : INVADER_W;
            const ih = inv.isBoss ? BOSS_H : INVADER_H;

            if (
              b.x < inv.x + iw &&
              b.x + BULLET_W > inv.x &&
              b.y < inv.y + ih &&
              b.y + BULLET_H > inv.y
            ) {
              inv.hp--;
              if (inv.hp <= 0) {
                inv.alive = false;
                s.score += inv.isBoss ? 50 : 10;
              } else {
                s.score += 5; // partial damage on boss
              }
              // Explosion
              s.explosions.push({
                x: inv.x + iw / 2,
                y: inv.y + ih / 2,
                frame: 0,
                maxFrames: 12,
              });
              hit = true;
              break;
            }
          }

          if (hit) {
            s.playerBullets.splice(bi, 1);
            setDisplayState((prev) => ({ ...prev, score: s.score }));
          }
        }

        // ── Enemy bullet vs player collision ──
        if (s.playerHitTimer <= 0) {
          for (let bi = s.enemyBullets.length - 1; bi >= 0; bi--) {
            const b = s.enemyBullets[bi];
            if (
              b.x < s.playerX + PLAYER_W &&
              b.x + BULLET_W > s.playerX &&
              b.y < PLAYER_Y + PLAYER_H &&
              b.y + BULLET_H > PLAYER_Y
            ) {
              s.lives--;
              s.playerHitTimer = 60; // invincibility frames
              s.enemyBullets.splice(bi, 1);
              s.explosions.push({
                x: s.playerX + PLAYER_W / 2,
                y: PLAYER_Y + PLAYER_H / 2,
                frame: 0,
                maxFrames: 15,
              });
              if (s.lives <= 0) {
                s.status = "lost";
                if (s.score > bestScoresRef.current[difficultyRef.current]) {
                  bestScoresRef.current[difficultyRef.current] = s.score;
                }
                setDisplayState({
                  lives: 0,
                  score: s.score,
                  wave: s.wave,
                  status: "lost",
                });
              } else {
                setDisplayState((prev) => ({
                  ...prev,
                  lives: s.lives,
                }));
              }
              break;
            }
          }
        }

        // ── Check if invaders reached the bottom ──
        for (const inv of s.invaders) {
          if (inv.alive && !inv.isBoss && inv.y + INVADER_H >= PLAYER_Y - 5) {
            s.status = "lost";
            if (s.score > bestScoresRef.current[difficultyRef.current]) {
              bestScoresRef.current[difficultyRef.current] = s.score;
            }
            setDisplayState({
              lives: s.lives,
              score: s.score,
              wave: s.wave,
              status: "lost",
            });
            break;
          }
        }

        // ── Check win condition ──
        if (s.status === "playing" && s.invaders.every((inv) => !inv.alive)) {
          s.status = "won";
          setDisplayState((prev) => ({
            ...prev,
            score: s.score,
            status: "won",
          }));
        }

        // ── Update explosions ──
        for (const exp of s.explosions) exp.frame++;
        s.explosions = s.explosions.filter((exp) => exp.frame < exp.maxFrames);
      }

      // ── Draw ──
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      // Background
      ctx.fillStyle = BG_COLOR;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Subtle star field
      ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
      for (let i = 0; i < 40; i++) {
        const sx = (i * 137 + 50) % CANVAS_W;
        const sy = (i * 97 + 30) % CANVAS_H;
        ctx.fillRect(sx, sy, 1.5, 1.5);
      }

      // ── Draw invaders ──
      for (const inv of s.invaders) {
        if (!inv.alive) continue;

        const iw = inv.isBoss ? BOSS_W : INVADER_W;
        const ih = inv.isBoss ? BOSS_H : INVADER_H;

        if (pepeImgRef.current) {
          // Draw PEPE image for invader
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(inv.x, inv.y, iw, ih, 4);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(pepeImgRef.current, inv.x, inv.y, iw, ih);
          ctx.restore();

          // Border
          ctx.strokeStyle = inv.isBoss ? "#ff4444" : DARK_GREEN;
          ctx.lineWidth = inv.isBoss ? 2 : 1;
          ctx.beginPath();
          ctx.roundRect(inv.x, inv.y, iw, ih, 4);
          ctx.stroke();

          // Boss HP bar
          if (inv.isBoss) {
            const barW = iw;
            const barH = 4;
            const barY = inv.y + ih + 3;
            ctx.fillStyle = "#333";
            ctx.fillRect(inv.x, barY, barW, barH);
            ctx.fillStyle = "#ff4444";
            ctx.fillRect(inv.x, barY, barW * (inv.hp / inv.maxHp), barH);
          }
        } else {
          // Fallback rectangle
          ctx.fillStyle = inv.isBoss ? "#ff4444" : DARK_GREEN;
          ctx.beginPath();
          ctx.roundRect(inv.x, inv.y, iw, ih, 4);
          ctx.fill();
          ctx.fillStyle = "#000";
          ctx.font = "bold 10px monospace";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("P", inv.x + iw / 2, inv.y + ih / 2);
        }
      }

      // ── Draw player (WOJAK ship) ──
      const playerVisible = s.playerHitTimer <= 0 || Math.floor(s.playerHitTimer / 4) % 2 === 0;
      if (playerVisible) {
        if (wojakImgRef.current) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(
            s.playerX + PLAYER_W / 2,
            PLAYER_Y + PLAYER_H / 2,
            PLAYER_W / 2,
            0,
            Math.PI * 2
          );
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(
            wojakImgRef.current,
            s.playerX,
            PLAYER_Y,
            PLAYER_W,
            PLAYER_H
          );
          ctx.restore();

          // Green border ring
          ctx.strokeStyle = GREEN;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(
            s.playerX + PLAYER_W / 2,
            PLAYER_Y + PLAYER_H / 2,
            PLAYER_W / 2,
            0,
            Math.PI * 2
          );
          ctx.stroke();
        } else {
          // Fallback
          ctx.fillStyle = GREEN;
          ctx.beginPath();
          ctx.arc(
            s.playerX + PLAYER_W / 2,
            PLAYER_Y + PLAYER_H / 2,
            PLAYER_W / 2,
            0,
            Math.PI * 2
          );
          ctx.fill();
          ctx.fillStyle = "#000";
          ctx.font = "bold 14px monospace";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("W", s.playerX + PLAYER_W / 2, PLAYER_Y + PLAYER_H / 2);
        }
      }

      // ── Draw player bullets ──
      ctx.shadowColor = GREEN;
      ctx.shadowBlur = 6;
      for (const b of s.playerBullets) {
        ctx.fillStyle = GREEN;
        ctx.fillRect(b.x, b.y, BULLET_W, BULLET_H);
      }
      ctx.shadowBlur = 0;

      // ── Draw enemy bullets ──
      ctx.shadowColor = ENEMY_BULLET_COLOR;
      ctx.shadowBlur = 6;
      for (const b of s.enemyBullets) {
        ctx.fillStyle = ENEMY_BULLET_COLOR;
        ctx.fillRect(b.x, b.y, BULLET_W, BULLET_H);
      }
      ctx.shadowBlur = 0;

      // ── Draw explosions ──
      for (const exp of s.explosions) {
        const progress = exp.frame / exp.maxFrames;
        const radius = 8 + progress * 16;
        const alpha = 1 - progress;
        ctx.fillStyle = `rgba(0, 255, 65, ${alpha * 0.6})`;
        ctx.beginPath();
        ctx.arc(exp.x, exp.y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Inner flash
        if (progress < 0.3) {
          ctx.fillStyle = `rgba(255, 255, 255, ${(1 - progress / 0.3) * 0.5})`;
          ctx.beginPath();
          ctx.arc(exp.x, exp.y, radius * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ── Draw lives indicators ──
      if (s.status === "playing") {
        for (let i = 0; i < s.lives; i++) {
          ctx.fillStyle = GREEN;
          ctx.beginPath();
          ctx.arc(20 + i * 22, CANVAS_H - 12, 7, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ── Idle overlay ──
      if (s.status === "idle") {
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        ctx.fillStyle = GREEN;
        ctx.font = "bold 24px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("SPACE INVADERS", CANVAS_W / 2, CANVAS_H / 2 - 40);

        ctx.fillStyle = "#ffffff";
        ctx.font = "16px monospace";
        ctx.fillText("Click or Press Space", CANVAS_W / 2, CANVAS_H / 2 + 10);

        ctx.fillStyle = "#888888";
        ctx.font = "13px monospace";
        ctx.fillText("Mouse or Arrow keys to move", CANVAS_W / 2, CANVAS_H / 2 + 40);
        ctx.fillText("Click or Space to shoot", CANVAS_W / 2, CANVAS_H / 2 + 60);
      }

      // ── Won overlay ──
      if (s.status === "won") {
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        ctx.fillStyle = GREEN;
        ctx.font = "bold 28px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("WAVE CLEARED!", CANVAS_W / 2, CANVAS_H / 2 - 40);

        ctx.fillStyle = "#ffffff";
        ctx.font = "18px monospace";
        ctx.fillText(`Score: ${s.score}`, CANVAS_W / 2, CANVAS_H / 2);

        ctx.fillStyle = GREEN;
        ctx.font = "16px monospace";
        ctx.fillText(`Wave ${s.wave} complete`, CANVAS_W / 2, CANVAS_H / 2 + 30);

        ctx.fillStyle = "#888888";
        ctx.font = "14px monospace";
        ctx.fillText("Click for next wave", CANVAS_W / 2, CANVAS_H / 2 + 65);
      }

      // ── Lost overlay ──
      if (s.status === "lost") {
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        ctx.fillStyle = "#f87171";
        ctx.font = "bold 32px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("GAME OVER", CANVAS_W / 2, CANVAS_H / 2 - 50);

        ctx.fillStyle = "#ffffff";
        ctx.font = "18px monospace";
        ctx.fillText(`Score: ${s.score}`, CANVAS_W / 2, CANVAS_H / 2 - 10);

        ctx.fillStyle = GREEN;
        ctx.font = "16px monospace";
        ctx.fillText(`Wave: ${s.wave}`, CANVAS_W / 2, CANVAS_H / 2 + 20);
        ctx.fillText(
          `Best: ${bestScoresRef.current[difficultyRef.current]}`,
          CANVAS_W / 2,
          CANVAS_H / 2 + 45
        );

        ctx.fillStyle = "#888888";
        ctx.font = "14px monospace";
        ctx.fillText("Click to play again", CANVAS_W / 2, CANVAS_H / 2 + 80);
      }

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animRef.current);
  }, [difficulty]);

  // Handle won state click -> next wave
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleNextWave = () => {
      const s = stateRef.current;
      if (s.status === "won") {
        nextWave();
        s.status = "playing";
        setDisplayState((prev) => ({ ...prev, status: "playing" }));
      }
    };

    canvas.addEventListener("click", handleNextWave);
    return () => canvas.removeEventListener("click", handleNextWave);
  }, [nextWave]);

  // Fire button for mobile
  const handleFireButton = useCallback(() => {
    const s = stateRef.current;
    if (s.status === "playing" && s.fireCooldown <= 0) {
      const cfg = DIFFICULTIES[difficultyRef.current];
      s.playerBullets.push({
        x: s.playerX + PLAYER_W / 2 - BULLET_W / 2,
        y: PLAYER_Y - BULLET_H,
        dy: -cfg.playerBulletSpeed,
        isPlayer: true,
      });
      s.fireCooldown = cfg.playerFireCooldown;
    }
  }, []);

  return (
    <div className="flex flex-col items-center gap-2 sm:gap-3 p-2 sm:p-4 select-none w-full max-w-fit mx-auto">
      {/* Difficulty selector */}
      <div className="flex gap-1.5 sm:gap-2">
        {(Object.keys(DIFFICULTIES) as Difficulty[]).map((key) => (
          <button
            key={key}
            onClick={() => handleDifficultyChange(key)}
            className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              difficulty === key
                ? "bg-wojak-green text-black"
                : "bg-wojak-card border border-wojak-border text-gray-300 hover:text-white hover:bg-white/5"
            }`}
          >
            {DIFFICULTIES[key].label}
          </button>
        ))}

        {/* New game button */}
        <button
          onClick={() => resetGame()}
          className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm bg-wojak-card border border-wojak-border text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
        >
          New Game
        </button>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-3 sm:gap-4 bg-wojak-card border border-wojak-border rounded-xl px-3 sm:px-4 py-2 min-w-[280px] sm:min-w-[360px] justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400">Lives:</span>
          <span className="font-mono text-sm font-bold text-red-500">
            {displayState.lives}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400">Score:</span>
          <span className="font-mono text-sm font-bold text-wojak-green">
            {displayState.score}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400">Wave:</span>
          <span className="font-mono text-sm font-bold text-wojak-green">
            {displayState.wave}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400">Best:</span>
          <span className="font-mono text-sm font-bold text-yellow-400">
            {bestScoresRef.current[difficulty]}
          </span>
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className="border-2 border-wojak-border rounded-lg cursor-pointer"
        style={{
          width: "min(85vw, 480px)",
          height: "auto",
          aspectRatio: `${CANVAS_W} / ${CANVAS_H}`,
          touchAction: "none",
        }}
      />

      {/* Mobile fire button */}
      <button
        onClick={handleFireButton}
        className="sm:hidden px-8 py-3 bg-wojak-green/20 border border-wojak-green/40 text-wojak-green font-bold rounded-xl active:bg-wojak-green/40 transition-colors text-sm"
      >
        FIRE
      </button>

      {/* Instructions */}
      <div className="text-gray-500 text-xs text-center max-w-sm px-2">
        <span className="hidden sm:inline">
          Mouse or Arrow keys to move, Click or Space to shoot
        </span>
        <span className="sm:hidden">
          Drag to move, tap FIRE or use 2nd finger to shoot
        </span>
      </div>
    </div>
  );
}
