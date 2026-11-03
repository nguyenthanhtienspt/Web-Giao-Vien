import React, { useEffect, useRef, useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Play, RotateCcw, Volume2, Trophy, Clock, Zap, Flag, Sparkles, UserCheck, Maximize2, Minimize2 } from 'lucide-react';
import { soundManager } from '../services/sound';

interface Contestant {
  id: string | number;
  number?: number;
  studentName: string;
  label: string;
  color: string;
}

interface DuckRaceGameProps {
  candidates: (string | number)[];
  batchCount: 1 | 2;
  isLightMode: boolean;
  studentNames?: string[];
  onSelectWinners: (winners: (string | number)[]) => void;
  onClose?: () => void;
  isGameFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

const DUCK_COLORS = [
  '#f59e0b', // Amber/Yellow
  '#ef4444', // Red
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#84cc16', // Lime
  '#14b8a6', // Teal
];

interface DuckState {
  id: string | number;
  studentName: string;
  label: string;
  number?: number;
  color: string;
  lane: number;
  x: number; // 0 to 100 percentage
  y: number;
  offsetFactor: number; // individual speed variance
  burstTimer: number;
  burstSpeed: number;
  rank: number;
  finished: boolean;
  finishTime: number | null;
  bobPhase: number;
}

export const DuckRaceGame: React.FC<DuckRaceGameProps> = ({
  candidates,
  batchCount,
  isLightMode,
  studentNames = [],
  onSelectWinners,
  isGameFullscreen = false,
  onToggleFullscreen,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Duration option (5s, 10s, 15s)
  const [raceDuration, setRaceDuration] = useState<number>(10);
  const RACE_DURATION = raceDuration;

  const [maxDucksOption, setMaxDucksOption] = useState<'all' | '10' | '16'>(
    candidates.length <= 16 ? 'all' : '16'
  );

  // Map candidates to rich contestant objects with resolved student names
  const contestants: Contestant[] = useMemo(() => {
    let pool = [...candidates];
    if (maxDucksOption === '10' && pool.length > 10) {
      pool = [...pool].sort(() => Math.random() - 0.5).slice(0, 10);
    } else if (maxDucksOption === '16' && pool.length > 16) {
      pool = [...pool].sort(() => Math.random() - 0.5).slice(0, 16);
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
        color: DUCK_COLORS[index % DUCK_COLORS.length],
      };
    });
  }, [candidates, maxDucksOption, studentNames]);

  const [raceState, setRaceState] = useState<'ready' | 'countdown' | 'racing' | 'finished'>('ready');
  const [countdown, setCountdown] = useState<number>(3);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(RACE_DURATION);
  const [winners, setWinners] = useState<Contestant[]>([]);
  const [isQuacking, setIsQuacking] = useState(false);

  // Animation refs
  const ducksRef = useRef<DuckState[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const raceStartTimeRef = useRef<number>(0);
  const finishOrderRef = useRef<Contestant[]>([]);
  const lastTickTimeRef = useRef<number>(0);

  // Initialize or reset ducks
  const initDucks = () => {
    finishOrderRef.current = [];
    setWinners([]);
    setRaceState('ready');
    setSecondsRemaining(RACE_DURATION);

    ducksRef.current = contestants.map((c, i) => ({
      id: c.id,
      studentName: c.studentName,
      number: c.number,
      label: c.label,
      color: c.color,
      lane: i,
      x: 4, // Start line at 4%
      y: 0,
      offsetFactor: 0.94 + Math.random() * 0.12, // subtle variance for tight race
      burstTimer: 1.5 + Math.random() * 2.0,
      burstSpeed: 0,
      rank: i + 1,
      finished: false,
      finishTime: null,
      bobPhase: Math.random() * Math.PI * 2,
    }));
  };

  // Only re-initialize ducks if we are in 'ready' state!
  // NEVER reset if race is currently racing or finished (to preserve the winner announcement on screen)
  useEffect(() => {
    if (raceState === 'ready') {
      initDucks();
    }
  }, [contestants]);

  // Start race countdown (3, 2, 1 -> 10s race)
  const handleStartRace = () => {
    if (raceState !== 'ready') return;
    setRaceState('countdown');
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
        setRaceState('racing');
        soundManager.playRaceStartHorn();
        raceStartTimeRef.current = performance.now();
        setSecondsRemaining(RACE_DURATION);
      }
    }, 900);
  };

  const handlePlayQuack = () => {
    setIsQuacking(true);
    soundManager.playDuckQuack();
    setTimeout(() => setIsQuacking(false), 400);
  };

  // Keyboard shortcut: Space / Enter to start race or restart
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        if (raceState === 'ready') {
          handleStartRace();
        } else if (raceState === 'finished') {
          initDucks();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [raceState, contestants]);

  // Main Canvas Render & Physics Loop tuned for 30 seconds
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();

    const render = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      const laneCount = Math.max(ducksRef.current.length, 1);
      const laneHeight = height / laneCount;

      // Draw River Water Background
      const waterGradient = ctx.createLinearGradient(0, 0, width, height);
      if (isLightMode) {
        waterGradient.addColorStop(0, '#38bdf8');
        waterGradient.addColorStop(0.5, '#0ea5e9');
        waterGradient.addColorStop(1, '#0284c7');
      } else {
        waterGradient.addColorStop(0, '#0c4a6e');
        waterGradient.addColorStop(0.5, '#075985');
        waterGradient.addColorStop(1, '#0369a1');
      }
      ctx.fillStyle = waterGradient;
      ctx.fillRect(0, 0, width, height);

      // Water current ripples
      const waveOffset = (currentTime * 0.08) % 80;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
      ctx.lineWidth = 2;
      for (let y = 14; y < height; y += 26) {
        ctx.beginPath();
        for (let x = -80; x < width + 80; x += 60) {
          const cy = y + Math.sin((x + waveOffset) * 0.04) * 3.5;
          if (x === -80) ctx.moveTo(x, cy);
          else ctx.lineTo(x, cy);
        }
        ctx.stroke();
      }

      // Start Line (at 6% of width)
      const startX = width * 0.06;
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(startX, 0);
      ctx.lineTo(startX, height);
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('XUẤT PHÁT', startX, 16);

      // Finish Line (at 90% of width)
      const finishX = width * 0.90;
      const checkerSize = 14;
      const checkerCols = 2;
      for (let col = 0; col < checkerCols; col++) {
        for (let y = 0; y < height; y += checkerSize) {
          const isWhite = (Math.floor(y / checkerSize) + col) % 2 === 0;
          ctx.fillStyle = isWhite ? '#ffffff' : '#e11d48';
          ctx.fillRect(finishX + col * checkerSize, y, checkerSize, checkerSize);
        }
      }

      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ĐÍCH 🏁', finishX + checkerSize, 18);

      // Lane dividers
      for (let i = 0; i <= laneCount; i++) {
        const y = i * laneHeight;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Update Ducks & 10-Second Timing
      const ducks = ducksRef.current;
      const finishLinePercent = 90;

      if (raceState === 'racing') {
        const elapsedSec = (currentTime - raceStartTimeRef.current) / 1000;
        const currentRemaining = Math.max(0, Math.ceil(RACE_DURATION - elapsedSec));
        setSecondsRemaining(currentRemaining);

        // Sound tick in last 3 seconds
        if (currentRemaining <= 3 && currentRemaining > 0) {
          if (Math.floor(elapsedSec) !== lastTickTimeRef.current) {
            lastTickTimeRef.current = Math.floor(elapsedSec);
            soundManager.playTimerTick();
          }
        }

        // Global baseline progress: 0 to 1 over 10 seconds
        const raceProgress = Math.min(elapsedSec / RACE_DURATION, 1.0);
        let anyJustFinished = false;

        ducks.forEach((duck) => {
          if (!duck.finished) {
            // Burst/turbo speed variation to make overtakes realistic
            duck.burstTimer -= dt;
            if (duck.burstTimer <= 0) {
              duck.burstTimer = 1.0 + Math.random() * 1.8;
              duck.burstSpeed = (Math.random() - 0.45) * 6.5; // forward or slight slowdown
              if (Math.random() < 0.15) {
                soundManager.playDuckQuack();
              }
            }

            // Target X based on 10-second pacing (from 4% to 88%)
            // Distance = 84%
            const targetCourseX = 4 + raceProgress * 78 * duck.offsetFactor + duck.burstSpeed;
            // Smoothly ease position toward target
            duck.x += (targetCourseX - duck.x) * dt * 3.5;

            // In final 1.5 seconds (elapsedSec >= 8.5), leading ducks sprint towards finish!
            if (elapsedSec >= 8.5) {
              duck.x += (elapsedSec - 8.2) * dt * 10;
            }

            // Check if duck crossed finish line (or time elapsed >= 10s)
            if (duck.x >= finishLinePercent || (elapsedSec >= RACE_DURATION && finishOrderRef.current.length === 0)) {
              duck.finished = true;
              duck.x = Math.max(duck.x, finishLinePercent);
              duck.finishTime = currentTime;

              const matched = contestants.find((c) => c.id === duck.id);
              if (matched && !finishOrderRef.current.some((w) => w.id === matched.id)) {
                finishOrderRef.current.push(matched);
                anyJustFinished = true;
              }
            }
          } else {
            // Decelerate past finish
            duck.x += 8 * dt;
          }

          duck.bobPhase += dt * 12;
        });

        if (anyJustFinished) {
          soundManager.playSplash();
        }

        // Check if needed winners reached AND elapsedSec is at least 9.4s, OR 10s timer is up
        const neededWinners = Math.min(batchCount, contestants.length);
        const reachedAtEnd = finishOrderRef.current.length >= neededWinners && elapsedSec >= 9.2;
        const timeExpired = elapsedSec >= RACE_DURATION;

        if ((reachedAtEnd || timeExpired) && raceState === 'racing') {
          // If time is up and no one crossed, pick current leader
          if (finishOrderRef.current.length < neededWinners) {
            const sorted = [...ducks].sort((a, b) => b.x - a.x);
            sorted.forEach((d) => {
              const matched = contestants.find((c) => c.id === d.id);
              if (matched && !finishOrderRef.current.some((w) => w.id === matched.id)) {
                finishOrderRef.current.push(matched);
              }
            });
          }

          const finalWinners = finishOrderRef.current.slice(0, neededWinners);
          setWinners(finalWinners);
          setRaceState('finished');
          setSecondsRemaining(0);
          soundManager.playWinner();
          confetti({
            particleCount: 160,
            spread: 130,
            origin: { y: 0.6 },
            colors: ['#fbbf24', '#f59e0b', '#38bdf8', '#ef4444', '#10b981'],
          });
          onSelectWinners(finalWinners.map((w) => w.id));
        }
      }

      // Rank ducks by current position
      const sortedByX = [...ducks].sort((a, b) => b.x - a.x);
      ducks.forEach((d) => {
        d.rank = sortedByX.findIndex((s) => s.id === d.id) + 1;
      });

      // Render each Duck with student name label
      ducks.forEach((duck) => {
        const laneY = duck.lane * laneHeight + laneHeight / 2;
        duck.y = laneY;

        const posX = (duck.x / 100) * width;
        const bobOffset = Math.sin(duck.bobPhase) * 3;
        const posY = laneY + bobOffset;

        // Water Wake
        if (duck.x > 4) {
          ctx.save();
          ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
          ctx.beginPath();
          ctx.ellipse(posX - 18, posY + 4, 16, 3.5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Draw Rubber Duck
        ctx.save();
        ctx.translate(posX, posY);

        const duckScale = Math.min(Math.max(laneHeight / 48, 0.7), 1.15);
        ctx.scale(duckScale, duckScale);

        // Body
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.ellipse(0, 0, 16, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Shading
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.ellipse(-4, -4, 10, 6, -0.2, 0, Math.PI * 2);
        ctx.fill();

        // Tail
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.moveTo(-14, 0);
        ctx.lineTo(-22, -6);
        ctx.lineTo(-15, 4);
        ctx.closePath();
        ctx.fill();

        // Head
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(10, -8, 10, 0, Math.PI * 2);
        ctx.fill();

        // Eye
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(13, -10, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(14, -11, 0.8, 0, Math.PI * 2);
        ctx.fill();

        // Beak
        ctx.fillStyle = '#ea580c';
        ctx.beginPath();
        ctx.moveTo(18, -8);
        ctx.lineTo(26, -6);
        ctx.lineTo(18, -3);
        ctx.closePath();
        ctx.fill();

        // Wing
        const wingFlap = Math.sin(duck.bobPhase * 1.5) * 0.15;
        ctx.save();
        ctx.rotate(wingFlap);
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.ellipse(-2, -1, 9, 6, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Racing Cap
        ctx.fillStyle = duck.color;
        ctx.beginPath();
        ctx.arc(8, -14, 6, Math.PI, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(8, -14, 6, 2);

        ctx.restore();

        // Prominent Student Name & Number Label above duck
        const isLeader = duck.rank === 1 && raceState === 'racing';
        ctx.save();
        ctx.font = `bold ${laneHeight < 36 ? '11px' : '12px'} "Lexend", sans-serif`;

        // Text display on lane: show student's actual name
        const displayLabel = duck.number
          ? `${duck.number}. ${duck.studentName}`
          : duck.studentName;

        const textMetrics = ctx.measureText(displayLabel);
        const tagWidth = Math.max(textMetrics.width + 14, 46);
        const tagHeight = 19;
        const tagX = posX - tagWidth / 2;
        const tagY = posY - (laneHeight < 40 ? 16 : 22);

        // Tag background
        ctx.fillStyle = isLeader ? '#f59e0b' : isLightMode ? '#ffffff' : '#0f172a';
        ctx.strokeStyle = isLeader ? '#fbbf24' : duck.color;
        ctx.lineWidth = isLeader ? 2.5 : 1.5;

        ctx.beginPath();
        ctx.roundRect(tagX, tagY - tagHeight / 2, tagWidth, tagHeight, 5);
        ctx.fill();
        ctx.stroke();

        // Text
        ctx.fillStyle = isLeader ? '#0f172a' : isLightMode ? '#0f172a' : '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(displayLabel, posX, tagY);

        // Rank badge
        if (raceState === 'racing' && duck.rank <= 3) {
          ctx.fillStyle = duck.rank === 1 ? '#fbbf24' : duck.rank === 2 ? '#cbd5e1' : '#b45309';
          ctx.beginPath();
          ctx.arc(tagX - 6, tagY, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 9px sans-serif';
          ctx.fillText(String(duck.rank), tagX - 6, tagY);
        }

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
  }, [isLightMode, raceState, contestants, batchCount]);

  return (
    <div className="w-full flex flex-col gap-4 animate-in fade-in duration-300">
      {/* Race Dashboard Header with 10s Countdown Clock */}
      <div className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4 ${
        isLightMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/90 border-slate-800'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40 text-2xl">
            🦆
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-black text-lg sm:text-xl text-amber-400">
                ĐUA VỊT ĐẠI CHIẾN
              </h3>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {contestants.length} chú vịt bơi
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Đường đua nước rút tốc độ cao · Hiển thị rõ người chiến thắng lên màn hình
            </p>
          </div>
        </div>

        {/* Live Timer Display & Duration Selector */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Race Duration Selector */}
          <div className="flex items-center gap-1 bg-slate-800/80 px-2.5 py-2 rounded-2xl text-xs border border-slate-700">
            <span className="text-slate-400">Thời gian:</span>
            <select
              value={raceDuration}
              onChange={(e) => {
                const dur = Number(e.target.value);
                setRaceDuration(dur);
                setSecondsRemaining(dur);
              }}
              disabled={raceState !== 'ready'}
              className="bg-transparent text-amber-300 font-bold outline-none cursor-pointer"
            >
              <option value={5}>Nhanh (5s)</option>
              <option value={10}>Chuẩn (10s)</option>
              <option value={15}>Hồi hộp (15s)</option>
            </select>
          </div>

          <div className={`px-4 py-2 rounded-2xl border flex items-center gap-2.5 font-display transition-all ${
            raceState === 'racing'
              ? secondsRemaining <= 3
                ? 'bg-rose-500/20 border-rose-500 text-rose-400 ring-4 ring-rose-500/30 animate-pulse'
                : 'bg-amber-500/20 border-amber-500/40 text-amber-400'
              : 'bg-slate-800 border-slate-700 text-slate-300'
          }`}>
            <Clock className={`w-5 h-5 ${raceState === 'racing' ? 'animate-spin' : ''}`} />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {raceState === 'racing' ? 'ĐANG ĐẾM NGƯỢC' : 'THỜI GIAN ĐUA'}
              </span>
              <span className="text-xl sm:text-2xl font-black tabular-nums tracking-tight">
                00:{secondsRemaining < 10 ? `0${secondsRemaining}` : secondsRemaining}
              </span>
            </div>
          </div>

          {/* Sound & Quack Button */}
          <button
            onClick={handlePlayQuack}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              isQuacking
                ? 'bg-amber-400 text-slate-950 scale-105'
                : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700'
            }`}
            title="Bấm để vịt kêu cạc cạc khuấy động lớp học!"
          >
            <Volume2 className="w-4 h-4" />
            <span className="hidden sm:inline">Cạc Cạc!</span>
          </button>

          {/* Fullscreen Zoom Toggle Button */}
          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                isGameFullscreen
                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                  : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
              }`}
              title={isGameFullscreen ? 'Thu nhỏ lại (Esc)' : 'Phóng to toàn màn hình máy chiếu (Phím F)'}
            >
              {isGameFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              <span className="hidden sm:inline">{isGameFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}</span>
            </button>
          )}

          {/* Action buttons */}
          {raceState === 'ready' && (
            <button
              onClick={handleStartRace}
              className="px-6 py-2.5 rounded-xl font-display font-black text-sm bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-lg shadow-amber-500/30 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>BẮT ĐẦU ĐUA</span>
            </button>
          )}

          {raceState === 'finished' && (
            <button
              onClick={initDucks}
              className="px-5 py-2.5 rounded-xl font-display font-bold text-sm bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Đua hiệp mới</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar for 10 Seconds */}
      {raceState === 'racing' && (
        <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 transition-all duration-200 ease-linear"
            style={{ width: `${((RACE_DURATION - secondsRemaining) / RACE_DURATION) * 100}%` }}
          />
        </div>
      )}

      {/* Winner Spotlight Banner in Header if finished */}
      {raceState === 'finished' && winners.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border-2 border-amber-400/60 flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-amber-400 shrink-0" />
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block">
                🏆 NGƯỜI CHIẾN THẮNG VỪA VỀ ĐÍCH:
              </span>
              <span className="text-lg sm:text-2xl font-black font-display text-white">
                {winners.map((w) => (w.number ? `${w.studentName} (Số #${w.number})` : w.studentName)).join(' · ')}
              </span>
            </div>
          </div>
          <button
            onClick={initDucks}
            className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shrink-0 cursor-pointer shadow"
          >
            Đua lượt tiếp
          </button>
        </div>
      )}

      {/* Main River Canvas Stage */}
      <div className={`relative rounded-3xl border overflow-hidden shadow-2xl ${
        isLightMode ? 'border-sky-300/80 bg-sky-900' : 'border-sky-600/40 bg-sky-950'
      }`}>
        <canvas
          ref={canvasRef}
          width={1000}
          height={Math.min(Math.max(contestants.length * 44, 380), 650)}
          className="w-full block select-none"
        />

        {/* Ready Overlay */}
        {raceState === 'ready' && (
          <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 rounded-3xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-4xl mb-3 shadow-xl">
              🦆
            </div>
            <h2 className="text-2xl sm:text-4xl font-display font-black text-white mb-2 drop-shadow-md">
              ĐUA VỊT TỐC ĐỘ CAO!
            </h2>
            <p className="text-sm sm:text-base text-sky-200 max-w-md mb-6">
              Có <strong className="text-amber-400">{contestants.length} chú vịt</strong> mang tên học sinh đang sẵn sàng bơi để tìm người chiến thắng!
            </p>
            <button
              onClick={handleStartRace}
              className="px-8 sm:px-12 py-4 rounded-2xl font-display font-black text-xl sm:text-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 shadow-2xl shadow-amber-500/50 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 cursor-pointer"
            >
              <Play className="w-6 h-6 fill-current" />
              <span>BẮT ĐẦU ĐUA NGAY</span>
            </button>
            <span className="mt-3 text-xs text-sky-200/80">
              Nhấn phím Space hoặc chuột để bắt đầu
            </span>
          </div>
        )}

        {/* Countdown Overlay (3, 2, 1) */}
        {raceState === 'countdown' && (
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex flex-col items-center justify-center pointer-events-none">
            <div className="text-8xl sm:text-9xl font-display font-black text-amber-400 animate-bounce drop-shadow-[0_10px_20px_rgba(245,158,11,0.5)]">
              {countdown}
            </div>
            <span className="text-2xl font-bold font-display text-white mt-4 tracking-widest uppercase">
              XUẤT PHÁT ĐUA...
            </span>
          </div>
        )}

        {/* Prominent Winner Display: Shows Full Student Name on Screen */}
        {raceState === 'finished' && winners.length > 0 && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 rounded-full bg-amber-500/20 border-4 border-amber-400 flex items-center justify-center text-amber-300 text-4xl mb-2 shadow-2xl animate-bounce">
              <Trophy className="w-10 h-10 text-amber-400" />
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-sm font-black uppercase tracking-widest mb-3">
              <Sparkles className="w-4 h-4" />
              <span>🏆 NGƯỜI CHIẾN THẮNG ĐUA VỊT 🏆</span>
            </div>

            {/* Winner Card Showing FULL STUDENT NAME in Huge Typography */}
            <div className="flex items-center gap-6 flex-wrap justify-center my-4 w-full max-w-2xl">
              {winners.map((winner, idx) => (
                <div
                  key={idx}
                  className="flex-1 min-w-[280px] px-8 py-6 rounded-3xl bg-gradient-to-b from-amber-400 via-amber-500 to-orange-500 text-slate-950 shadow-2xl border-4 border-white transform scale-105"
                >
                  <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-amber-600/30">
                    <span className="text-xs font-black uppercase tracking-wider text-amber-950">
                      {winners.length > 1 ? `HẠNG ${idx + 1}` : '🏆 QUÁN QUÂN ĐƯỜNG ĐUA'}
                    </span>
                    {winner.number && (
                      <span className="text-xs font-black bg-slate-950 text-amber-400 px-2.5 py-0.5 rounded-full font-display">
                        Số thứ tự #{winner.number}
                      </span>
                    )}
                  </div>

                  {/* HUGE STUDENT NAME READABLE ACROSS THE ENTIRE CLASSROOM */}
                  <div className="text-4xl sm:text-6xl md:text-7xl font-black font-display tracking-tight text-slate-950 my-2 leading-tight drop-shadow-sm break-words">
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
                onClick={initDucks}
                className="px-8 py-4 rounded-2xl font-display font-black text-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/40 transition-transform active:scale-95 flex items-center gap-2.5 cursor-pointer"
              >
                <RotateCcw className="w-5 h-5" />
                <span>Đua lại lượt mới</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
