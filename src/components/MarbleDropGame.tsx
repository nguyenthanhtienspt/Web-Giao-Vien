import React, { useEffect, useRef, useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Play, RotateCcw, Volume2, Trophy, Clock, Sparkles, Zap, ShieldAlert, Maximize2, Minimize2 } from 'lucide-react';
import { soundManager } from '../services/sound';

interface Contestant {
  id: string | number;
  number?: number;
  studentName: string;
  label: string;
  color: string;
}

interface MarbleDropGameProps {
  candidates: (string | number)[];
  batchCount: 1 | 2;
  isLightMode: boolean;
  studentNames?: string[];
  onSelectWinners: (winners: (string | number)[]) => void;
  onClose?: () => void;
  isGameFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

const MARBLE_COLORS = [
  '#ef4444', // Red
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#14b8a6', // Teal
  '#84cc16', // Lime
];

interface Peg {
  x: number;
  y: number;
  radius: number;
  glow: number;
}

interface Spinner {
  x: number;
  y: number;
  radius: number;
  angle: number;
  speed: number;
}

interface Marble {
  id: string | number;
  studentName: string;
  number?: number;
  label: string;
  color: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  finished: boolean;
  finishTime: number | null;
  score: number;
}

export const MarbleDropGame: React.FC<MarbleDropGameProps> = ({
  candidates,
  batchCount,
  isLightMode,
  studentNames = [],
  onSelectWinners,
  isGameFullscreen = false,
  onToggleFullscreen,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Exact 10 seconds duration limit as requested
  const DROP_DURATION = 10; // seconds

  const [maxMarblesOption, setMaxMarblesOption] = useState<'all' | '12' | '20'>(
    candidates.length <= 16 ? 'all' : '20'
  );

  // Map candidates to rich contestant objects with resolved student names
  const contestants: Contestant[] = useMemo(() => {
    let pool = [...candidates];
    if (maxMarblesOption === '12' && pool.length > 12) {
      pool = [...pool].sort(() => Math.random() - 0.5).slice(0, 12);
    } else if (maxMarblesOption === '20' && pool.length > 20) {
      pool = [...pool].sort(() => Math.random() - 0.5).slice(0, 20);
    }

    return pool.map((item, index) => {
      let resolvedNumber: number | undefined;
      let resolvedName = '';

      if (typeof item === 'number') {
        resolvedNumber = item;
        resolvedName = studentNames[item - 1] || `Học sinh số ${item}`;
      } else {
        resolvedName = String(item);
        const foundIdx = studentNames.findIndex((name) => name.toLowerCase() === resolvedName.toLowerCase());
        if (foundIdx !== -1) {
          resolvedNumber = foundIdx + 1;
        } else {
          resolvedNumber = index + 1;
        }
      }

      return {
        id: item,
        number: resolvedNumber,
        studentName: resolvedName,
        label: resolvedNumber ? `Số ${resolvedNumber} - ${resolvedName}` : resolvedName,
        color: MARBLE_COLORS[index % MARBLE_COLORS.length],
      };
    });
  }, [candidates, maxMarblesOption, studentNames]);

  const [gameState, setGameState] = useState<'ready' | 'countdown' | 'dropping' | 'finished'>('ready');
  const [countdown, setCountdown] = useState<number>(3);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(DROP_DURATION);
  const [winners, setWinners] = useState<Contestant[]>([]);

  // Refs for physics loop
  const marblesRef = useRef<Marble[]>([]);
  const pegsRef = useRef<Peg[]>([]);
  const spinnersRef = useRef<Spinner[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const dropStartTimeRef = useRef<number>(0);
  const finishOrderRef = useRef<Contestant[]>([]);
  const lastTickTimeRef = useRef<number>(0);

  // Setup board elements (pegs, spinners, starting marbles)
  const initBoard = () => {
    finishOrderRef.current = [];
    setWinners([]);
    setGameState('ready');
    setSecondsRemaining(DROP_DURATION);

    const width = 800;
    const height = 620;

    // Pegs layout (Plinko field)
    const pegs: Peg[] = [];
    const rows = 9;
    const startY = 140;
    const rowSpacing = 42;

    for (let r = 0; r < rows; r++) {
      const cols = 9 + (r % 2 === 0 ? 0 : 1);
      const colSpacing = 68;
      const startX = (width - (cols - 1) * colSpacing) / 2;

      for (let c = 0; c < cols; c++) {
        const px = startX + c * colSpacing;
        const py = startY + r * rowSpacing;

        if (
          (r === 4 && (c === 2 || c === cols - 3)) ||
          (r === 6 && c === Math.floor(cols / 2))
        ) {
          continue;
        }

        pegs.push({
          x: px,
          y: py,
          radius: 6,
          glow: 0,
        });
      }
    }
    pegsRef.current = pegs;

    // Spinners
    spinnersRef.current = [
      { x: 220, y: startY + 4 * rowSpacing, radius: 26, angle: 0, speed: 1.5 },
      { x: width - 220, y: startY + 4 * rowSpacing, radius: 26, angle: 0, speed: -1.5 },
      { x: width / 2, y: startY + 6 * rowSpacing, radius: 30, angle: 0, speed: 2 },
    ];

    // Marbles lined up in the top hopper
    const marbleRadius = Math.max(14, Math.min(20, Math.floor(260 / contestants.length)));
    marblesRef.current = contestants.map((c, idx) => {
      const total = contestants.length;
      const spacing = Math.min(36, (width - 120) / Math.max(total, 1));
      const startX = width / 2 - ((total - 1) * spacing) / 2;

      return {
        id: c.id,
        studentName: c.studentName,
        number: c.number,
        label: c.label,
        color: c.color,
        x: startX + idx * spacing + (Math.random() - 0.5) * 6,
        y: 65 + (idx % 2 === 0 ? 0 : 14),
        vx: (Math.random() - 0.5) * 2,
        vy: 0,
        radius: marbleRadius,
        finished: false,
        finishTime: null,
        score: 0,
      };
    });
  };

  // Only re-initialize board if we are in 'ready' state!
  // NEVER reset if marbles are dropping or finished (to preserve winner announcement on screen)
  useEffect(() => {
    if (gameState === 'ready') {
      initBoard();
    }
  }, [contestants]);

  // Start Drop Countdown
  const handleStartDrop = () => {
    if (gameState !== 'ready') return;
    setGameState('countdown');
    setCountdown(3);
    soundManager.playRaceCountdown();

    let count = 3;
    const interval = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdown(count);
        soundManager.playRaceCountdown();
      } else {
        clearInterval(interval);
        setGameState('dropping');
        soundManager.playRaceStartHorn();
        dropStartTimeRef.current = performance.now();
        setSecondsRemaining(DROP_DURATION);

        // Initial impulse
        marblesRef.current.forEach((m) => {
          m.vy = 2 + Math.random() * 3;
          m.vx = (Math.random() - 0.5) * 4;
        });
      }
    }, 900);
  };

  // Keyboard shortcut: Space / Enter to start drop or restart
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        if (gameState === 'ready') {
          handleStartDrop();
        } else if (gameState === 'finished') {
          initBoard();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, contestants]);

  // Main Canvas Physics & Animation Loop tuned for 30 seconds
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();
    let clinkSoundThrottle = 0;

    const render = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.05);
      lastTime = currentTime;

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Background Board
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      if (isLightMode) {
        bgGrad.addColorStop(0, '#f8fafc');
        bgGrad.addColorStop(1, '#e2e8f0');
      } else {
        bgGrad.addColorStop(0, '#0f172a');
        bgGrad.addColorStop(0.5, '#1e1b4b');
        bgGrad.addColorStop(1, '#090d16');
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Outer Frame
      ctx.strokeStyle = isLightMode ? '#cbd5e1' : '#312e81';
      ctx.lineWidth = 8;
      ctx.strokeRect(4, 4, width - 8, height - 8);

      // Top Hopper
      const hopperY = 100;
      ctx.fillStyle = isLightMode ? 'rgba(203, 213, 225, 0.4)' : 'rgba(30, 27, 75, 0.6)';
      ctx.fillRect(40, 20, width - 80, 85);
      ctx.strokeStyle = isLightMode ? '#94a3b8' : '#4338ca';
      ctx.lineWidth = 3;
      ctx.strokeRect(40, 20, width - 80, 85);

      if (gameState === 'ready' || gameState === 'countdown') {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(40, hopperY + 5);
        ctx.lineTo(width - 40, hopperY + 5);
        ctx.stroke();

        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('CỬA THẢ BI ĐANG ĐÓNG (30 GIÂY)', width / 2, hopperY - 2);
      }

      // Funnel & Catch Cup at bottom
      const finishY = height - 60;
      const slotWidth = 160;
      const slotX = width / 2 - slotWidth / 2;

      ctx.save();
      ctx.fillStyle = isLightMode ? 'rgba(79, 70, 229, 0.15)' : 'rgba(99, 102, 241, 0.25)';
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 3;

      // Left ramp
      ctx.beginPath();
      ctx.moveTo(30, height - 120);
      ctx.lineTo(slotX, finishY);
      ctx.lineTo(slotX, height - 10);
      ctx.lineTo(30, height - 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Right ramp
      ctx.beginPath();
      ctx.moveTo(width - 30, height - 120);
      ctx.lineTo(slotX + slotWidth, finishY);
      ctx.lineTo(slotX + slotWidth, height - 10);
      ctx.lineTo(width - 30, height - 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Winner Pod
      ctx.fillStyle = isLightMode ? '#e0e7ff' : '#312e81';
      ctx.fillRect(slotX, finishY, slotWidth, 50);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 4;
      ctx.strokeRect(slotX, finishY, slotWidth, 50);

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🏆 CÚP QUÁN QUÂN (30s)', width / 2, finishY + 30);
      ctx.restore();

      // Side Bouncers with trampolines
      const bouncers = [
        { x: 30, y: 200, w: 20, h: 80 },
        { x: width - 50, y: 200, w: 20, h: 80 },
        { x: 30, y: 340, w: 20, h: 80 },
        { x: width - 50, y: 340, w: 20, h: 80 },
        // Lower bouncy trampolines to keep marbles in play across 30s
        { x: 70, y: height - 125, w: 100, h: 16 },
        { x: width - 170, y: height - 125, w: 100, h: 16 },
      ];

      bouncers.forEach((b) => {
        ctx.fillStyle = '#ec4899';
        ctx.beginPath();
        ctx.roundRect(b.x, b.y, b.w, b.h, 8);
        ctx.fill();
        ctx.strokeStyle = '#f472b6';
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // Spinners
      spinnersRef.current.forEach((s) => {
        if (gameState === 'dropping') {
          s.angle += s.speed * dt;
        }

        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.angle);

        for (let b = 0; b < 4; b++) {
          ctx.rotate(Math.PI / 2);
          ctx.fillStyle = b % 2 === 0 ? '#06b6d4' : '#38bdf8';
          ctx.beginPath();
          ctx.roundRect(-4, -s.radius, 8, s.radius * 2, 4);
          ctx.fill();
        }

        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0891b2';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
      });

      // Pegs
      pegsRef.current.forEach((peg) => {
        if (peg.glow > 0) {
          peg.glow = Math.max(0, peg.glow - dt * 2.5);
        }

        if (peg.glow > 0) {
          ctx.save();
          ctx.fillStyle = `rgba(245, 158, 11, ${peg.glow * 0.6})`;
          ctx.beginPath();
          ctx.arc(peg.x, peg.y, peg.radius + 8 * peg.glow, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        const pegGrad = ctx.createRadialGradient(
          peg.x - 2,
          peg.y - 2,
          1,
          peg.x,
          peg.y,
          peg.radius
        );
        pegGrad.addColorStop(0, '#ffffff');
        pegGrad.addColorStop(0.4, '#e2e8f0');
        pegGrad.addColorStop(1, '#64748b');

        ctx.fillStyle = pegGrad;
        ctx.beginPath();
        ctx.arc(peg.x, peg.y, peg.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = isLightMode ? '#475569' : '#94a3b8';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      // Update 10-Second Timer & Marbles Physics
      const marbles = marblesRef.current;
      clinkSoundThrottle = Math.max(0, clinkSoundThrottle - dt);

      if (gameState === 'dropping') {
        const elapsedSec = (currentTime - dropStartTimeRef.current) / 1000;
        const currentRemaining = Math.max(0, Math.ceil(DROP_DURATION - elapsedSec));
        setSecondsRemaining(currentRemaining);

        // Sound tick in last 3 seconds
        if (currentRemaining <= 3 && currentRemaining > 0) {
          if (Math.floor(elapsedSec) !== lastTickTimeRef.current) {
            lastTickTimeRef.current = Math.floor(elapsedSec);
            soundManager.playTimerTick();
          }
        }

        // Tuned gravity & bounce for 10s suspense
        const gravity = 280; // active descent

        marbles.forEach((m) => {
          if (!m.finished) {
            m.vy += gravity * dt;
            m.vx *= 0.992;
            m.vy *= 0.992;

            m.x += m.vx * dt * 2.8;
            m.y += m.vy * dt * 2.8;

            // Walls
            const minX = 40 + m.radius;
            const maxX = width - 40 - m.radius;
            if (m.x < minX) {
              m.x = minX;
              m.vx = Math.abs(m.vx) * 0.75 + 3;
            } else if (m.x > maxX) {
              m.x = maxX;
              m.vx = -Math.abs(m.vx) * 0.75 - 3;
            }

            // Bouncers & Trampolines
            bouncers.forEach((b) => {
              if (
                m.x + m.radius > b.x &&
                m.x - m.radius < b.x + b.w &&
                m.y + m.radius > b.y &&
                m.y - m.radius < b.y + b.h
              ) {
                if (b.w > b.h) {
                  // Trampoline bounce upward before 7.5 seconds
                  if (elapsedSec < 7.5) {
                    m.vy = -Math.abs(m.vy) * 0.85 - 5;
                    m.vx += (Math.random() - 0.5) * 5;
                  }
                } else {
                  // Side bouncers
                  m.vx = b.x < width / 2 ? Math.abs(m.vx) + 5 : -Math.abs(m.vx) - 5;
                  m.vy = -Math.abs(m.vy) * 0.4;
                }
                if (clinkSoundThrottle <= 0) {
                  soundManager.playBoing();
                  clinkSoundThrottle = 0.08;
                }
              }
            });

            // Ramp collision
            if (m.y > height - 130) {
              if (m.x < slotX && m.y > height - 120 + ((finishY - (height - 120)) / (slotX - 30)) * (m.x - 30) - m.radius) {
                m.x += 4;
                m.vx = Math.abs(m.vx) * 0.6 + 4;
                m.vy = Math.abs(m.vy) * 0.6;
              }
              if (m.x > slotX + slotWidth && m.y > height - 120 + ((finishY - (height - 120)) / (width - 30 - (slotX + slotWidth))) * (width - 30 - m.x) - m.radius) {
                m.x -= 4;
                m.vx = -Math.abs(m.vx) * 0.6 - 4;
                m.vy = Math.abs(m.vy) * 0.6;
              }
            }

            // Pegs collision
            pegsRef.current.forEach((peg) => {
              const dx = m.x - peg.x;
              const dy = m.y - peg.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              const minDist = m.radius + peg.radius;

              if (dist < minDist) {
                const nx = dx / (dist || 1);
                const ny = dy / (dist || 1);

                m.x = peg.x + nx * minDist;
                m.y = peg.y + ny * minDist;

                const dot = m.vx * nx + m.vy * ny;
                m.vx = (m.vx - 2 * dot * nx) * 0.72 + (Math.random() - 0.5) * 4;
                m.vy = (m.vy - 2 * dot * ny) * 0.72 + (Math.random() - 0.5) * 2;

                peg.glow = 1;
                m.score += 1;

                if (clinkSoundThrottle <= 0) {
                  soundManager.playMarbleClink(1 + (peg.y / height) * 0.5);
                  clinkSoundThrottle = 0.06;
                }
              }
            });

            // Spinners collision
            spinnersRef.current.forEach((s) => {
              const dx = m.x - s.x;
              const dy = m.y - s.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < m.radius + s.radius) {
                const nx = dx / (dist || 1);
                const ny = dy / (dist || 1);
                m.vx = nx * 8 + (Math.random() - 0.5) * 6;
                m.vy = ny * 8;
                if (clinkSoundThrottle <= 0) {
                  soundManager.playBoing();
                  clinkSoundThrottle = 0.07;
                }
              }
            });

            // Winner Gate opens when elapsedSec >= 8.6s (marble lands into winner cup)
            if (elapsedSec >= 8.6) {
              if (m.y >= finishY + 8 && m.x >= slotX && m.x <= slotX + slotWidth) {
                m.finished = true;
                m.finishTime = currentTime;
                m.vx = 0;
                m.vy = 0;

                const matched = contestants.find((c) => c.id === m.id);
                if (matched && !finishOrderRef.current.some((w) => w.id === matched.id)) {
                  finishOrderRef.current.push(matched);
                  soundManager.playPointAdd();
                }
              }
            }

            // Bottom bounce before 8.6s
            if (elapsedSec < 8.6 && m.y > height - m.radius - 12) {
              m.y = height - m.radius - 12;
              m.vy = -Math.abs(m.vy) * 0.75 - 4;
              m.vx += (Math.random() - 0.5) * 6;
            }
          }
        });

        // 10 seconds reached OR required winners in cup at end of drop
        const needed = Math.min(batchCount, contestants.length);
        const reachedAtEnd = finishOrderRef.current.length >= needed && elapsedSec >= 9.2;
        const timeExpired = elapsedSec >= DROP_DURATION;

        if ((reachedAtEnd || timeExpired) && gameState === 'dropping') {
          // If time is up, pick marbles closest to the winner cup
          if (finishOrderRef.current.length < needed) {
            const sorted = [...marbles].sort((a, b) => {
              const distA = Math.hypot(a.x - width / 2, a.y - finishY);
              const distB = Math.hypot(b.x - width / 2, b.y - finishY);
              return distA - distB;
            });
            sorted.forEach((m) => {
              const matched = contestants.find((c) => c.id === m.id);
              if (matched && !finishOrderRef.current.some((w) => w.id === matched.id)) {
                finishOrderRef.current.push(matched);
              }
            });
          }

          const finalWinners = finishOrderRef.current.slice(0, needed);
          setWinners(finalWinners);
          setGameState('finished');
          setSecondsRemaining(0);
          soundManager.playWinner();
          confetti({
            particleCount: 160,
            spread: 130,
            origin: { y: 0.65 },
            colors: ['#f59e0b', '#ec4899', '#3b82f6', '#10b981', '#8b5cf6'],
          });
          onSelectWinners(finalWinners.map((w) => w.id));
        }
      }

      // Draw Marbles with crisp student name tags
      marbles.forEach((m) => {
        ctx.save();
        ctx.translate(m.x, m.y);

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
        ctx.beginPath();
        ctx.ellipse(0, m.radius * 0.7, m.radius * 0.9, m.radius * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();

        // 3D Marble Gradient
        const sphereGrad = ctx.createRadialGradient(
          -m.radius * 0.35,
          -m.radius * 0.35,
          m.radius * 0.1,
          0,
          0,
          m.radius
        );
        sphereGrad.addColorStop(0, '#ffffff');
        sphereGrad.addColorStop(0.3, m.color);
        sphereGrad.addColorStop(1, '#0f172a');

        ctx.fillStyle = sphereGrad;
        ctx.beginPath();
        ctx.arc(0, 0, m.radius, 0, Math.PI * 2);
        ctx.fill();

        // Highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.beginPath();
        ctx.ellipse(-m.radius * 0.3, -m.radius * 0.35, m.radius * 0.4, m.radius * 0.22, -0.4, 0, Math.PI * 2);
        ctx.fill();

        // Text on marble: Student Number or short name
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${m.radius >= 18 ? '10px' : '9px'} "Lexend", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 4;

        const shortName = m.number
          ? `${m.number}`
          : m.studentName.split(' ').pop() || m.studentName;
        ctx.fillText(shortName, 0, 1);

        ctx.restore();

        // Label above marble showing student's real name
        ctx.save();
        ctx.font = 'bold 10px "Lexend", sans-serif';
        const tagText = m.number ? `${m.number}. ${m.studentName}` : m.studentName;
        const tw = ctx.measureText(tagText).width;
        ctx.fillStyle = isLightMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(15, 23, 42, 0.9)';
        ctx.strokeStyle = m.color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(m.x - tw / 2 - 4, m.y - m.radius - 16, tw + 8, 14, 3);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isLightMode ? '#0f172a' : '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(tagText, m.x, m.y - m.radius - 9);
        ctx.restore();
      });

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isLightMode, gameState, contestants, batchCount]);

  return (
    <div className="w-full flex flex-col gap-4 animate-in fade-in duration-300">
      {/* Marble Board Control Header with 10s Countdown Clock */}
      <div className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4 ${
        isLightMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/90 border-slate-800'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/40 text-2xl">
            🔮
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-black text-lg sm:text-xl text-indigo-400">
                THẢ VIÊN BI PLINKO
              </h3>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {contestants.length} viên bi
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Đợt thả bi va đập kịch tính · Hiển thị rõ người chiến thắng lên màn hình
            </p>
          </div>
        </div>

        {/* Countdown Clock & Controls */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className={`px-4 py-2 rounded-2xl border flex items-center gap-2.5 font-display transition-all ${
            gameState === 'dropping'
              ? secondsRemaining <= 3
                ? 'bg-rose-500/20 border-rose-500 text-rose-400 ring-4 ring-rose-500/30 animate-pulse'
                : 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400'
              : 'bg-slate-800 border-slate-700 text-slate-300'
          }`}>
            <Clock className={`w-5 h-5 ${gameState === 'dropping' ? 'animate-spin' : ''}`} />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {gameState === 'dropping' ? 'ĐANG ĐẾM NGƯỢC' : 'THỜI GIAN THẢ'}
              </span>
              <span className="text-xl sm:text-2xl font-black tabular-nums tracking-tight">
                00:{secondsRemaining < 10 ? `0${secondsRemaining}` : secondsRemaining}
              </span>
            </div>
          </div>

          {/* Fullscreen Zoom Toggle Button */}
          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                isGameFullscreen
                  ? 'bg-indigo-500 text-white border-indigo-400'
                  : 'bg-slate-800 hover:bg-slate-700 text-indigo-300 border-slate-700'
              }`}
              title={isGameFullscreen ? 'Thu nhỏ lại (Esc)' : 'Phóng to toàn màn hình máy chiếu (Phím F)'}
            >
              {isGameFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              <span className="hidden sm:inline">{isGameFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}</span>
            </button>
          )}

          {/* Action buttons */}
          {gameState === 'ready' && (
            <button
              onClick={handleStartDrop}
              className="px-6 py-2.5 rounded-xl font-display font-black text-sm bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/30 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>MỞ CỬA THẢ BI</span>
            </button>
          )}

          {gameState === 'finished' && (
            <button
              onClick={initBoard}
              className="px-5 py-2.5 rounded-xl font-display font-bold text-sm bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Thả đợt mới</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar for 10 Seconds */}
      {gameState === 'dropping' && (
        <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-200 ease-linear"
            style={{ width: `${((DROP_DURATION - secondsRemaining) / DROP_DURATION) * 100}%` }}
          />
        </div>
      )}

      {/* Winner Spotlight Banner in Header if finished */}
      {gameState === 'finished' && winners.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-indigo-500/20 border-2 border-purple-400/60 flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-amber-400 shrink-0" />
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-purple-300 block">
                🏆 NGƯỜI CHIẾN THẮNG VỪA RƠI VÀO CÚP:
              </span>
              <span className="text-lg sm:text-2xl font-black font-display text-white">
                {winners.map((w) => (w.number ? `${w.studentName} (Số #${w.number})` : w.studentName)).join(' · ')}
              </span>
            </div>
          </div>
          <button
            onClick={initBoard}
            className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs shrink-0 cursor-pointer shadow"
          >
            Thả lượt tiếp
          </button>
        </div>
      )}

      {/* Main Board Canvas */}
      <div className={`relative rounded-3xl border overflow-hidden shadow-2xl flex justify-center ${
        isLightMode ? 'border-indigo-200 bg-slate-200' : 'border-indigo-500/40 bg-slate-950'
      }`}>
        <canvas
          ref={canvasRef}
          width={800}
          height={620}
          className="max-w-full block select-none"
        />

        {/* Ready Overlay */}
        {gameState === 'ready' && (
          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 rounded-3xl bg-indigo-500/20 border-2 border-indigo-400 flex items-center justify-center text-4xl mb-3 shadow-xl">
              🔮
            </div>
            <h2 className="text-2xl sm:text-4xl font-display font-black text-white mb-2 drop-shadow-md">
              THẢ VIÊN BI HỒI HỘP!
            </h2>
            <p className="text-sm sm:text-base text-indigo-200 max-w-md mb-6">
              Có <strong className="text-amber-400">{contestants.length} viên bi</strong> mang tên học sinh đang chờ trên máng thả để tìm người chiến thắng!
            </p>
            <button
              onClick={handleStartDrop}
              className="px-8 sm:px-12 py-4 rounded-2xl font-display font-black text-xl sm:text-2xl bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 hover:from-indigo-400 hover:to-pink-400 text-white shadow-2xl shadow-indigo-500/50 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 cursor-pointer"
            >
              <Play className="w-6 h-6 fill-current" />
              <span>THẢ BI NGAY</span>
            </button>
            <span className="mt-3 text-xs text-indigo-200/80">
              Nhấn phím Space hoặc chuột để thả bi
            </span>
          </div>
        )}

        {/* Countdown Overlay */}
        {gameState === 'countdown' && (
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex flex-col items-center justify-center pointer-events-none">
            <div className="text-8xl sm:text-9xl font-display font-black text-purple-400 animate-bounce drop-shadow-[0_10px_20px_rgba(168,85,247,0.5)]">
              {countdown}
            </div>
            <span className="text-2xl font-bold font-display text-white mt-4 tracking-widest uppercase">
              MỞ CỬA THẢ BI...
            </span>
          </div>
        )}

        {/* Prominent Winner Display: Shows Full Student Name on Screen */}
        {gameState === 'finished' && winners.length > 0 && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 rounded-full bg-purple-500/20 border-4 border-purple-400 flex items-center justify-center text-purple-300 text-4xl mb-2 shadow-2xl animate-bounce">
              <Trophy className="w-10 h-10 text-amber-400" />
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/20 border border-purple-400/40 text-purple-300 text-sm font-black uppercase tracking-widest mb-3">
              <Sparkles className="w-4 h-4" />
              <span>🏆 NGƯỜI CHIẾN THẮNG THẢ BI 🏆</span>
            </div>

            {/* Winner Card Showing FULL STUDENT NAME in Huge Typography */}
            <div className="flex items-center gap-6 flex-wrap justify-center my-4 w-full max-w-2xl">
              {winners.map((winner, idx) => (
                <div
                  key={idx}
                  className="flex-1 min-w-[280px] px-8 py-6 rounded-3xl bg-gradient-to-b from-indigo-600 via-purple-600 to-pink-600 text-white shadow-2xl border-4 border-white transform scale-105"
                >
                  <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-purple-300/30">
                    <span className="text-xs font-black uppercase tracking-wider text-purple-200">
                      {winners.length > 1 ? `HẠNG ${idx + 1}` : '🏆 VIÊN BI QUÁN QUÂN'}
                    </span>
                    {winner.number && (
                      <span className="text-xs font-black bg-slate-950 text-amber-300 px-2.5 py-0.5 rounded-full font-display">
                        Số thứ tự #{winner.number}
                      </span>
                    )}
                  </div>

                  {/* HUGE STUDENT NAME READABLE ACROSS THE ENTIRE CLASSROOM */}
                  <div className="text-4xl sm:text-6xl md:text-7xl font-black font-display tracking-tight text-white my-2 leading-tight drop-shadow-md break-words">
                    {winner.studentName}
                  </div>
                </div>
              ))}
            </div>

            <p className="text-base text-slate-300 max-w-md mb-6 font-medium">
              Đã tự động ghi nhận học sinh vào danh sách đã gọi của lớp!
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={initBoard}
                className="px-8 py-4 rounded-2xl font-display font-black text-lg bg-purple-600 hover:bg-purple-500 text-white shadow-xl shadow-purple-600/40 transition-transform active:scale-95 flex items-center gap-2.5 cursor-pointer"
              >
                <RotateCcw className="w-5 h-5" />
                <span>Thả lại lượt mới</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
