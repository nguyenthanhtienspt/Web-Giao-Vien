import React, { useEffect, useRef, useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Play, RotateCcw, Volume2, Trophy, Clock, Zap, Flag, Sparkles } from 'lucide-react';
import { soundManager } from '../services/sound';

interface Contestant {
  id: string | number;
  number?: number;
  studentName: string;
  label: string;
  color: string;
  accentColor: string;
}

interface CarRaceGameProps {
  candidates: (string | number)[];
  batchCount: 1 | 2;
  isLightMode: boolean;
  studentNames?: string[];
  onSelectWinners: (winners: (string | number)[]) => void;
  onClose?: () => void;
}

const CAR_COLOR_PALETTES = [
  { main: '#ef4444', accent: '#fca5a5' }, // Ferrari Red
  { main: '#3b82f6', accent: '#93c5fd' }, // Alpine Blue
  { main: '#10b981', accent: '#6ee7b7' }, // Aston Green
  { main: '#f59e0b', accent: '#fde68a' }, // McLaren Papaya
  { main: '#8b5cf6', accent: '#c4b5fd' }, // Purple Cyber
  { main: '#ec4899', accent: '#fbcfe8' }, // Neon Pink
  { main: '#06b6d4', accent: '#a5f3fc' }, // Cyan Bolt
  { main: '#f97316', accent: '#fed7aa' }, // Orange Porsche
  { main: '#84cc16', accent: '#d9f99d' }, // Lime Racer
  { main: '#14b8a6', accent: '#99f6e4' }, // Teal Turbo
];

interface CarState {
  id: string | number;
  studentName: string;
  label: string;
  number?: number;
  color: string;
  accentColor: string;
  lane: number;
  x: number; // 0 to 100 percentage
  y: number;
  offsetFactor: number;
  burstTimer: number;
  burstSpeed: number;
  isNitro: boolean;
  rank: number;
  finished: boolean;
  finishTime: number | null;
  tireSmokeTimer: number;
}

export const CarRaceGame: React.FC<CarRaceGameProps> = ({
  candidates,
  batchCount,
  isLightMode,
  studentNames = [],
  onSelectWinners,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const RACE_DURATION = 10; // 10 seconds

  const [maxCarsOption, setMaxCarsOption] = useState<'all' | '10' | '16'>(
    candidates.length <= 16 ? 'all' : '16'
  );

  const contestants: Contestant[] = useMemo(() => {
    let pool = [...candidates];
    if (maxCarsOption === '10' && pool.length > 10) {
      pool = [...pool].sort(() => Math.random() - 0.5).slice(0, 10);
    } else if (maxCarsOption === '16' && pool.length > 16) {
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

      const palette = CAR_COLOR_PALETTES[index % CAR_COLOR_PALETTES.length];
      return {
        id: item,
        number: resolvedNumber,
        studentName: resolvedName,
        label: resolvedNumber ? `Số ${resolvedNumber} - ${resolvedName}` : resolvedName,
        color: palette.main,
        accentColor: palette.accent,
      };
    });
  }, [candidates, maxCarsOption, studentNames]);

  const [raceState, setRaceState] = useState<'ready' | 'countdown' | 'racing' | 'finished'>('ready');
  const [countdown, setCountdown] = useState<number>(3);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(RACE_DURATION);
  const [winners, setWinners] = useState<Contestant[]>([]);

  const carsRef = useRef<CarState[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const raceStartTimeRef = useRef<number>(0);
  const finishOrderRef = useRef<Contestant[]>([]);
  const lastTickTimeRef = useRef<number>(0);

  const initCars = () => {
    finishOrderRef.current = [];
    setWinners([]);
    setRaceState('ready');
    setSecondsRemaining(RACE_DURATION);

    carsRef.current = contestants.map((c, i) => ({
      id: c.id,
      studentName: c.studentName,
      number: c.number,
      label: c.label,
      color: c.color,
      accentColor: c.accentColor,
      lane: i,
      x: 4,
      y: 0,
      offsetFactor: 0.94 + Math.random() * 0.12,
      burstTimer: 1.2 + Math.random() * 2.0,
      burstSpeed: 0,
      isNitro: false,
      rank: i + 1,
      finished: false,
      finishTime: null,
      tireSmokeTimer: 0,
    }));
  };

  useEffect(() => {
    if (raceState === 'ready') {
      initCars();
    }
  }, [contestants]);

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
        soundManager.playEngineRev();
        raceStartTimeRef.current = performance.now();
        setSecondsRemaining(RACE_DURATION);
      }
    }, 900);
  };

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
          initCars();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [raceState, contestants]);

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

      const laneCount = Math.max(carsRef.current.length, 1);
      const laneHeight = height / laneCount;

      // 1. Draw Asphalt Track
      ctx.fillStyle = isLightMode ? '#334155' : '#0f172a';
      ctx.fillRect(0, 0, width, height);

      // Top and bottom track curb (F1 red/white curbs)
      const curbSize = 14;
      for (let x = 0; x < width; x += curbSize) {
        const isRed = Math.floor(x / curbSize) % 2 === 0;
        ctx.fillStyle = isRed ? '#ef4444' : '#ffffff';
        ctx.fillRect(x, 0, curbSize, 6);
        ctx.fillRect(x, height - 6, curbSize, 6);
      }

      // Lane dividers (dashed road lines)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([16, 12]);
      for (let i = 1; i < laneCount; i++) {
        const y = i * laneHeight;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Start Line
      const startX = width * 0.06;
      ctx.save();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(startX, 0);
      ctx.lineTo(startX, height);
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('XUẤT PHÁT', startX, 18);

      // Finish Line (checkered flag)
      const finishX = width * 0.90;
      const checkerSize = 14;
      for (let col = 0; col < 2; col++) {
        for (let y = 0; y < height; y += checkerSize) {
          const isWhite = (Math.floor(y / checkerSize) + col) % 2 === 0;
          ctx.fillStyle = isWhite ? '#ffffff' : '#000000';
          ctx.fillRect(finishX + col * checkerSize, y, checkerSize, checkerSize);
        }
      }

      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ĐÍCH 🏁', finishX + checkerSize, 18);

      // 2. Physics & State Update
      const cars = carsRef.current;
      const finishLinePercent = 90;

      if (raceState === 'racing') {
        const elapsedSec = (currentTime - raceStartTimeRef.current) / 1000;
        const currentRemaining = Math.max(0, Math.ceil(RACE_DURATION - elapsedSec));
        setSecondsRemaining(currentRemaining);

        if (currentRemaining <= 3 && currentRemaining > 0) {
          if (Math.floor(elapsedSec) !== lastTickTimeRef.current) {
            lastTickTimeRef.current = Math.floor(elapsedSec);
            soundManager.playTimerTick();
          }
        }

        const raceProgress = Math.min(elapsedSec / RACE_DURATION, 1.0);

        cars.forEach((car) => {
          if (!car.finished) {
            car.burstTimer -= dt;
            if (car.burstTimer <= 0) {
              car.burstTimer = 1.0 + Math.random() * 1.6;
              car.burstSpeed = (Math.random() - 0.42) * 8.0;
              car.isNitro = Math.random() < 0.45;
              if (car.isNitro && Math.random() < 0.25) {
                soundManager.playEngineRev();
              } else if (Math.random() < 0.15) {
                soundManager.playTireScreech();
              }
            }

            const targetX = 4 + raceProgress * 78 * car.offsetFactor + car.burstSpeed;
            car.x += (targetX - car.x) * dt * 3.8;

            if (elapsedSec >= 8.5) {
              car.x += (elapsedSec - 8.2) * dt * 11;
            }

            if (car.x >= finishLinePercent || (elapsedSec >= RACE_DURATION && finishOrderRef.current.length === 0)) {
              car.finished = true;
              car.x = Math.max(car.x, finishLinePercent);
              car.finishTime = currentTime;

              const matched = contestants.find((c) => c.id === car.id);
              if (matched && !finishOrderRef.current.some((w) => w.id === matched.id)) {
                finishOrderRef.current.push(matched);
              }
            }
          } else {
            car.x += 10 * dt;
          }
        });

        const neededWinners = Math.min(batchCount, contestants.length);
        const reachedAtEnd = finishOrderRef.current.length >= neededWinners && elapsedSec >= 9.2;
        const timeExpired = elapsedSec >= RACE_DURATION;

        if ((reachedAtEnd || timeExpired) && raceState === 'racing') {
          if (finishOrderRef.current.length < neededWinners) {
            const sorted = [...cars].sort((a, b) => b.x - a.x);
            sorted.forEach((c) => {
              const matched = contestants.find((m) => m.id === c.id);
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
            spread: 120,
            origin: { y: 0.6 },
            colors: ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#ffffff'],
          });
          onSelectWinners(finalWinners.map((w) => w.id));
        }
      }

      // 3. Render Cars
      const sortedByX = [...cars].sort((a, b) => b.x - a.x);
      cars.forEach((c) => {
        c.rank = sortedByX.findIndex((s) => s.id === c.id) + 1;
      });

      cars.forEach((car) => {
        const laneY = car.lane * laneHeight + laneHeight / 2;
        car.y = laneY;
        const posX = (car.x / 100) * width;
        const posY = laneY;

        ctx.save();
        ctx.translate(posX, posY);

        const carScale = Math.min(Math.max(laneHeight / 50, 0.75), 1.2);
        ctx.scale(carScale, carScale);

        // Exhaust Nitro Flame
        if (raceState === 'racing' && !car.finished && car.isNitro) {
          ctx.save();
          const flameLength = 12 + Math.random() * 10;
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.moveTo(-24, -3);
          ctx.lineTo(-24 - flameLength, 0);
          ctx.lineTo(-24, 3);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.moveTo(-24, -1.5);
          ctx.lineTo(-24 - flameLength * 0.6, 0);
          ctx.lineTo(-24, 1.5);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }

        // F1 Car Body - Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.fillRect(-22, -10, 48, 20);

        // F1 Wheels (4 black tires)
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-18, -13, 9, 6); // Front-Top
        ctx.fillRect(-18, 7, 9, 6);   // Front-Bottom
        ctx.fillRect(10, -14, 11, 7); // Rear-Top
        ctx.fillRect(10, 7, 11, 7);   // Rear-Bottom

        // Wheel Rims
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(-15, -11, 3, 2);
        ctx.fillRect(-15, 9, 3, 2);
        ctx.fillRect(14, -12, 3, 3);
        ctx.fillRect(14, 9, 3, 3);

        // Main Car Chasis
        ctx.fillStyle = car.color;
        ctx.beginPath();
        ctx.moveTo(24, 0); // Front nose cone
        ctx.lineTo(8, -5);
        ctx.lineTo(-14, -8);
        ctx.lineTo(-22, -7);
        ctx.lineTo(-22, 7);
        ctx.lineTo(-14, 8);
        ctx.lineTo(8, 5);
        ctx.closePath();
        ctx.fill();

        // Front Wing
        ctx.fillStyle = car.accentColor;
        ctx.fillRect(18, -9, 4, 18);

        // Rear Wing
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-24, -10, 4, 20);

        // Cockpit
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.ellipse(2, 0, 7, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Driver Helmet
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(1, 0, 3, 0, Math.PI * 2);
        ctx.fill();

        // Car Number
        if (car.number) {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(String(car.number), -8, 3);
        }

        ctx.restore();

        // Name & SBD Tag above car
        ctx.save();
        const tagText = car.studentName || `Xe ${car.number || car.lane + 1}`;
        ctx.font = 'bold 11px sans-serif';
        const textWidth = ctx.measureText(tagText).width;
        const tagX = posX;
        const tagY = posY - 16;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(tagX - textWidth / 2 - 6, tagY - 11, textWidth + 12, 16);
        ctx.strokeStyle = car.color;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(tagX - textWidth / 2 - 6, tagY - 11, textWidth + 12, 16);

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(tagText, tagX, tagY + 1);

        // Rank Badge
        if (raceState === 'racing' || raceState === 'finished') {
          const rankColor = car.rank === 1 ? '#fbbf24' : car.rank === 2 ? '#94a3b8' : car.rank === 3 ? '#d97706' : '#64748b';
          ctx.fillStyle = rankColor;
          ctx.beginPath();
          ctx.arc(tagX - textWidth / 2 - 12, tagY - 3, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 9px sans-serif';
          ctx.fillText(String(car.rank), tagX - textWidth / 2 - 12, tagY);
        }
        ctx.restore();
      });

      // 4. Overlays: Countdown
      if (raceState === 'countdown') {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = '#fbbf24';
        ctx.font = '900 78px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(countdown), width / 2, height / 2 - 10);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText('CHUẨN BỊ XUẤT PHÁT!', width / 2, height / 2 + 55);
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [raceState, contestants, isLightMode, batchCount, countdown]);

  return (
    <div className={`w-full rounded-2xl border p-4 sm:p-5 transition-all ${
      isLightMode ? 'bg-white border-slate-200 shadow-lg' : 'bg-slate-900/90 border-slate-800'
    }`}>
      {/* Top Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-amber-500 flex items-center justify-center text-white text-xl shadow-md">
            🏎️
          </div>
          <div>
            <h3 className="font-display font-black text-lg sm:text-xl flex items-center gap-2">
              <span>Đua Siêu Xe F1 Turbo</span>
            </h3>
            <p className="text-xs text-slate-400">
              Trường đua F1 kịch tính · Bứt tốc Nitro cán đích chọn {batchCount} người
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Candidates Selector */}
          <div className="flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded-xl text-xs border border-slate-700">
            <span className="text-slate-400">Số xe đua:</span>
            <select
              value={maxCarsOption}
              onChange={(e) => setMaxCarsOption(e.target.value as 'all' | '10' | '16')}
              disabled={raceState !== 'ready'}
              className="bg-transparent text-red-400 font-bold outline-none cursor-pointer"
            >
              <option value="all">Tất cả ({candidates.length})</option>
              <option value="10">Top 10 xe</option>
              <option value="16">Top 16 xe</option>
            </select>
          </div>

          {/* Timer Display */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700 font-mono text-sm font-bold text-amber-400">
            <Clock className="w-4 h-4" />
            <span>{secondsRemaining}s</span>
          </div>

          {/* Sound Rev Test */}
          <button
            onClick={() => soundManager.playEngineRev()}
            title="Nghe thử tiếng rồ ga nổ máy"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 transition-all cursor-pointer"
          >
            <Volume2 className="w-4 h-4" />
          </button>

          {/* Main Action Button */}
          {raceState === 'ready' && (
            <button
              onClick={handleStartRace}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-black text-sm flex items-center gap-2 shadow-lg shadow-red-500/30 transition-all cursor-pointer active:scale-95"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>XUẤT PHÁT ĐUA (Space)</span>
            </button>
          )}

          {raceState === 'racing' && (
            <div className="px-4 py-2 rounded-xl bg-red-950/80 border border-red-500/50 text-red-300 font-bold text-sm flex items-center gap-2 animate-pulse">
              <Zap className="w-4 h-4 text-red-400 animate-bounce" />
              <span>Đang đua nước rút...</span>
            </div>
          )}

          {raceState === 'finished' && (
            <button
              onClick={initCars}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-black text-sm flex items-center gap-2 shadow-md transition-all cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Chặng đua mới</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="relative w-full rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950 shadow-inner">
        <canvas
          ref={canvasRef}
          width={920}
          height={Math.max(340, Math.min(540, contestants.length * 34))}
          className="w-full h-auto block"
        />
      </div>

      {/* Winner Celebration Bar */}
      {raceState === 'finished' && winners.length > 0 && (
        <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-red-900/60 via-amber-900/40 to-slate-900 border border-amber-500/50 flex flex-wrap items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-md">
              <Trophy className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider font-bold text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>VỀ ĐÍCH ĐẦU TIÊN · CHIẾN THẮNG</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-white font-display">
                {winners.map((w, idx) => (
                  <span key={w.id} className="inline-block mr-4 text-amber-300">
                    🏆 #{idx + 1}: {w.studentName} {w.number ? `(SBD: ${w.number})` : ''}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={initCars}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-md transition-all cursor-pointer"
          >
            Đua lượt tiếp theo
          </button>
        </div>
      )}
    </div>
  );
};
