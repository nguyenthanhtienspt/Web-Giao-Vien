import React, { useEffect, useRef, useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Play, RotateCcw, Volume2, Trophy, Clock, Zap, Flag, Sparkles, Maximize2, Minimize2 } from 'lucide-react';
import { soundManager } from '../services/sound';

interface Contestant {
  id: string | number;
  number?: number;
  studentName: string;
  label: string;
  color: string;
  dragonColor: string;
}

interface BoatRaceGameProps {
  candidates: (string | number)[];
  batchCount: 1 | 2;
  isLightMode: boolean;
  studentNames?: string[];
  onSelectWinners: (winners: (string | number)[]) => void;
  onClose?: () => void;
  isGameFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

const BOAT_PALETTES = [
  { main: '#dc2626', dragon: '#fbbf24' }, // Red-Gold Dragon
  { main: '#2563eb', dragon: '#67e8f9' }, // Blue Dragon
  { main: '#059669', dragon: '#a7f3d0' }, // Emerald Dragon
  { main: '#d97706', dragon: '#fef08a' }, // Amber Dragon
  { main: '#7c3aed', dragon: '#e9d5ff' }, // Purple Dragon
  { main: '#db2777', dragon: '#fbcfe8' }, // Pink Dragon
  { main: '#0891b2', dragon: '#cffafe' }, // Cyan Dragon
  { main: '#ea580c', dragon: '#ffedd5' }, // Orange Dragon
  { main: '#65a30d', dragon: '#ecfccb' }, // Lime Dragon
  { main: '#0d9488', dragon: '#ccfbf1' }, // Teal Dragon
];

interface BoatState {
  id: string | number;
  studentName: string;
  label: string;
  number?: number;
  color: string;
  dragonColor: string;
  lane: number;
  x: number; // 0 to 100 percentage
  y: number;
  offsetFactor: number;
  burstTimer: number;
  burstSpeed: number;
  oarPhase: number;
  rank: number;
  finished: boolean;
  finishTime: number | null;
}

export const BoatRaceGame: React.FC<BoatRaceGameProps> = ({
  candidates,
  batchCount,
  isLightMode,
  studentNames = [],
  onSelectWinners,
  isGameFullscreen = false,
  onToggleFullscreen,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const RACE_DURATION = 10; // 10 seconds

  const [maxBoatsOption, setMaxBoatsOption] = useState<'all' | '10' | '16'>(
    candidates.length <= 16 ? 'all' : '16'
  );

  const contestants: Contestant[] = useMemo(() => {
    let pool = [...candidates];
    if (maxBoatsOption === '10' && pool.length > 10) {
      pool = [...pool].sort(() => Math.random() - 0.5).slice(0, 10);
    } else if (maxBoatsOption === '16' && pool.length > 16) {
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

      const palette = BOAT_PALETTES[index % BOAT_PALETTES.length];
      return {
        id: item,
        number: resolvedNumber,
        studentName: resolvedName,
        label: resolvedNumber ? `Số ${resolvedNumber} - ${resolvedName}` : resolvedName,
        color: palette.main,
        dragonColor: palette.dragon,
      };
    });
  }, [candidates, maxBoatsOption, studentNames]);

  const [raceState, setRaceState] = useState<'ready' | 'countdown' | 'racing' | 'finished'>('ready');
  const [countdown, setCountdown] = useState<number>(3);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(RACE_DURATION);
  const [winners, setWinners] = useState<Contestant[]>([]);

  const boatsRef = useRef<BoatState[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const raceStartTimeRef = useRef<number>(0);
  const finishOrderRef = useRef<Contestant[]>([]);
  const lastTickTimeRef = useRef<number>(0);
  const lastDrumTimeRef = useRef<number>(0);

  const initBoats = () => {
    finishOrderRef.current = [];
    setWinners([]);
    setRaceState('ready');
    setSecondsRemaining(RACE_DURATION);

    boatsRef.current = contestants.map((c, i) => ({
      id: c.id,
      studentName: c.studentName,
      number: c.number,
      label: c.label,
      color: c.color,
      dragonColor: c.dragonColor,
      lane: i,
      x: 4,
      y: 0,
      offsetFactor: 0.94 + Math.random() * 0.12,
      burstTimer: 1.2 + Math.random() * 1.8,
      burstSpeed: 0,
      oarPhase: Math.random() * Math.PI * 2,
      rank: i + 1,
      finished: false,
      finishTime: null,
    }));
  };

  useEffect(() => {
    if (raceState === 'ready') {
      initBoats();
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
        soundManager.playBoatDrum();
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
          initBoats();
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

      const laneCount = Math.max(boatsRef.current.length, 1);
      const laneHeight = height / laneCount;

      // 1. Water River Gradient
      const waterGrad = ctx.createLinearGradient(0, 0, width, height);
      if (isLightMode) {
        waterGrad.addColorStop(0, '#0284c7');
        waterGrad.addColorStop(0.5, '#0369a1');
        waterGrad.addColorStop(1, '#075985');
      } else {
        waterGrad.addColorStop(0, '#082f49');
        waterGrad.addColorStop(0.5, '#0c4a6e');
        waterGrad.addColorStop(1, '#0369a1');
      }
      ctx.fillStyle = waterGrad;
      ctx.fillRect(0, 0, width, height);

      // Water Ripples
      const waveOffset = (currentTime * 0.06) % 60;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1.8;
      for (let y = 12; y < height; y += 24) {
        ctx.beginPath();
        for (let x = -60; x < width + 60; x += 50) {
          const cy = y + Math.sin((x + waveOffset) * 0.05) * 3;
          if (x === -60) ctx.moveTo(x, cy);
          else ctx.lineTo(x, cy);
        }
        ctx.stroke();
      }

      // Lane separator buoys / rope
      for (let i = 1; i < laneCount; i++) {
        const y = i * laneHeight;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.setLineDash([8, 8]);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();

        // Buoy balls
        for (let bx = 60; bx < width - 60; bx += 90) {
          ctx.fillStyle = (bx / 90) % 2 === 0 ? '#ef4444' : '#fbbf24';
          ctx.beginPath();
          ctx.arc(bx, y, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.setLineDash([]);

      // Start Line
      const startX = width * 0.06;
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(startX, 0);
      ctx.lineTo(startX, height);
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('XUẤT PHÁT', startX, 16);

      // Finish Line (Dragon Boat Finish Gate)
      const finishX = width * 0.90;
      const checkerSize = 14;
      for (let col = 0; col < 2; col++) {
        for (let y = 0; y < height; y += checkerSize) {
          const isGold = (Math.floor(y / checkerSize) + col) % 2 === 0;
          ctx.fillStyle = isGold ? '#fbbf24' : '#dc2626';
          ctx.fillRect(finishX + col * checkerSize, y, checkerSize, checkerSize);
        }
      }

      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ĐÍCH 🏁', finishX + checkerSize, 18);

      // 2. Physics & State
      const boats = boatsRef.current;
      const finishLinePercent = 90;

      if (raceState === 'racing') {
        const elapsedSec = (currentTime - raceStartTimeRef.current) / 1000;
        const currentRemaining = Math.max(0, Math.ceil(RACE_DURATION - elapsedSec));
        setSecondsRemaining(currentRemaining);

        // Dragon Boat Drum Beat every 0.65s
        if (currentTime - lastDrumTimeRef.current >= 650) {
          lastDrumTimeRef.current = currentTime;
          soundManager.playBoatDrum();
        }

        if (currentRemaining <= 3 && currentRemaining > 0) {
          if (Math.floor(elapsedSec) !== lastTickTimeRef.current) {
            lastTickTimeRef.current = Math.floor(elapsedSec);
            soundManager.playTimerTick();
          }
        }

        const raceProgress = Math.min(elapsedSec / RACE_DURATION, 1.0);
        let anyJustFinished = false;

        boats.forEach((boat) => {
          if (!boat.finished) {
            boat.burstTimer -= dt;
            if (boat.burstTimer <= 0) {
              boat.burstTimer = 1.0 + Math.random() * 1.6;
              boat.burstSpeed = (Math.random() - 0.42) * 7.5;
              if (Math.random() < 0.2) {
                soundManager.playSplash();
              }
            }

            const targetX = 4 + raceProgress * 78 * boat.offsetFactor + boat.burstSpeed;
            boat.x += (targetX - boat.x) * dt * 3.6;

            if (elapsedSec >= 8.5) {
              boat.x += (elapsedSec - 8.2) * dt * 10.5;
            }

            if (boat.x >= finishLinePercent || (elapsedSec >= RACE_DURATION && finishOrderRef.current.length === 0)) {
              boat.finished = true;
              boat.x = Math.max(boat.x, finishLinePercent);
              boat.finishTime = currentTime;

              const matched = contestants.find((c) => c.id === boat.id);
              if (matched && !finishOrderRef.current.some((w) => w.id === matched.id)) {
                finishOrderRef.current.push(matched);
                anyJustFinished = true;
              }
            }
          } else {
            boat.x += 8 * dt;
          }

          boat.oarPhase += dt * 9;
        });

        if (anyJustFinished) {
          soundManager.playSplash();
        }

        const neededWinners = Math.min(batchCount, contestants.length);
        const reachedAtEnd = finishOrderRef.current.length >= neededWinners && elapsedSec >= 9.2;
        const timeExpired = elapsedSec >= RACE_DURATION;

        if ((reachedAtEnd || timeExpired) && raceState === 'racing') {
          if (finishOrderRef.current.length < neededWinners) {
            const sorted = [...boats].sort((a, b) => b.x - a.x);
            sorted.forEach((b) => {
              const matched = contestants.find((m) => m.id === b.id);
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
            colors: ['#dc2626', '#fbbf24', '#0284c7', '#10b981', '#fbcfe8'],
          });
          onSelectWinners(finalWinners.map((w) => w.id));
        }
      }

      // 3. Render Boats
      const sortedByX = [...boats].sort((a, b) => b.x - a.x);
      boats.forEach((b) => {
        b.rank = sortedByX.findIndex((s) => s.id === b.id) + 1;
      });

      boats.forEach((boat) => {
        const laneY = boat.lane * laneHeight + laneHeight / 2;
        boat.y = laneY;
        const posX = (boat.x / 100) * width;
        const bob = Math.sin(boat.oarPhase) * 2;
        const posY = laneY + bob;

        ctx.save();
        ctx.translate(posX, posY);

        const boatScale = Math.min(Math.max(laneHeight / 50, 0.75), 1.15);
        ctx.scale(boatScale, boatScale);

        // Water Wake (bọt nước sau thuyền)
        if (boat.x > 4) {
          ctx.save();
          ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
          ctx.beginPath();
          ctx.moveTo(-28, 0);
          ctx.lineTo(-44, -6);
          ctx.lineTo(-40, 0);
          ctx.lineTo(-44, 6);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }

        // Dragon Boat Hull
        ctx.fillStyle = boat.color;
        ctx.beginPath();
        ctx.moveTo(30, 0); // Bow tip
        ctx.lineTo(24, -7);
        ctx.lineTo(-24, -7);
        ctx.lineTo(-30, -3);
        ctx.lineTo(-28, 3);
        ctx.lineTo(-24, 7);
        ctx.lineTo(24, 7);
        ctx.closePath();
        ctx.fill();

        // Hull golden trim
        ctx.strokeStyle = boat.dragonColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Dragon Head at Bow
        ctx.fillStyle = boat.dragonColor;
        ctx.beginPath();
        ctx.moveTo(28, -2);
        ctx.lineTo(38, -6);
        ctx.lineTo(35, 0);
        ctx.lineTo(38, 4);
        ctx.lineTo(28, 2);
        ctx.closePath();
        ctx.fill();

        // Dragon eye
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.arc(33, -2, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Dragon Tail at Stern
        ctx.fillStyle = boat.dragonColor;
        ctx.beginPath();
        ctx.moveTo(-28, 0);
        ctx.lineTo(-38, -8);
        ctx.lineTo(-34, 0);
        ctx.lineTo(-38, 8);
        ctx.closePath();
        ctx.fill();

        // Paddles / Oars (Chèo thuyền nhịp nhàng)
        const oarAngle = Math.sin(boat.oarPhase) * 0.45;
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 2;
        // 3 pairs of oars
        [-12, 0, 12].forEach((ox) => {
          ctx.save();
          ctx.translate(ox, -7);
          ctx.rotate(-oarAngle);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(0, -9);
          ctx.stroke();
          ctx.restore();

          ctx.save();
          ctx.translate(ox, 7);
          ctx.rotate(oarAngle);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(0, 9);
          ctx.stroke();
          ctx.restore();
        });

        // Boat Drum & Drummer
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.arc(-4, 0, 4, 0, Math.PI * 2);
        ctx.fill();

        // Boat Number
        if (boat.number) {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(String(boat.number), 10, 3);
        }

        ctx.restore();

        // Name & Tag
        ctx.save();
        const tagText = boat.studentName || `Thuyền ${boat.number || boat.lane + 1}`;
        ctx.font = 'bold 11px sans-serif';
        const textWidth = ctx.measureText(tagText).width;
        const tagX = posX;
        const tagY = posY - 18;

        ctx.fillStyle = 'rgba(12, 74, 110, 0.9)';
        ctx.fillRect(tagX - textWidth / 2 - 6, tagY - 11, textWidth + 12, 16);
        ctx.strokeStyle = boat.dragonColor;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(tagX - textWidth / 2 - 6, tagY - 11, textWidth + 12, 16);

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(tagText, tagX, tagY + 1);

        // Rank Badge
        if (raceState === 'racing' || raceState === 'finished') {
          const rankColor = boat.rank === 1 ? '#fbbf24' : boat.rank === 2 ? '#94a3b8' : boat.rank === 3 ? '#d97706' : '#64748b';
          ctx.fillStyle = rankColor;
          ctx.beginPath();
          ctx.arc(tagX - textWidth / 2 - 12, tagY - 3, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 9px sans-serif';
          ctx.fillText(String(boat.rank), tagX - textWidth / 2 - 12, tagY);
        }
        ctx.restore();
      });

      // Countdown Overlay
      if (raceState === 'countdown') {
        ctx.fillStyle = 'rgba(8, 47, 73, 0.75)';
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = '#fde047';
        ctx.font = '900 78px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(countdown), width / 2, height / 2 - 10);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText('TIẾNG TRỐNG LỆNH XUẤT PHÁT!', width / 2, height / 2 + 55);
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
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center text-white text-xl shadow-md">
            🚣
          </div>
          <div>
            <h3 className="font-display font-black text-lg sm:text-xl flex items-center gap-2">
              <span>Đua Thuyền Rồng Vượt Sóng</span>
            </h3>
            <p className="text-xs text-slate-400">
              Tiếng trống hội giục giã · Rẽ sóng trắng xóa chọn {batchCount} người
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded-xl text-xs border border-slate-700">
            <span className="text-slate-400">Số thuyền:</span>
            <select
              value={maxBoatsOption}
              onChange={(e) => setMaxBoatsOption(e.target.value as 'all' | '10' | '16')}
              disabled={raceState !== 'ready'}
              className="bg-transparent text-cyan-400 font-bold outline-none cursor-pointer"
            >
              <option value="all">Tất cả ({candidates.length})</option>
              <option value="10">Top 10 thuyền</option>
              <option value="16">Top 16 thuyền</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700 font-mono text-sm font-bold text-amber-400">
            <Clock className="w-4 h-4" />
            <span>{secondsRemaining}s</span>
          </div>

          <button
            onClick={() => soundManager.playBoatDrum()}
            title="Nghe thử tiếng trống hội"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 transition-all cursor-pointer"
          >
            <Volume2 className="w-4 h-4" />
          </button>

          {/* Fullscreen Zoom Toggle Button */}
          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                isGameFullscreen
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                  : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border-slate-700'
              }`}
              title={isGameFullscreen ? 'Thu nhỏ lại (Esc)' : 'Phóng to toàn màn hình máy chiếu (Phím F)'}
            >
              {isGameFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              <span className="hidden sm:inline">{isGameFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}</span>
            </button>
          )}

          {raceState === 'ready' && (
            <button
              onClick={handleStartRace}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 hover:from-blue-500 hover:to-emerald-400 text-white font-black text-sm flex items-center gap-2 shadow-lg shadow-cyan-500/30 transition-all cursor-pointer active:scale-95"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>XUẤT PHÁT ĐUA (Space)</span>
            </button>
          )}

          {raceState === 'racing' && (
            <div className="px-4 py-2 rounded-xl bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 font-bold text-sm flex items-center gap-2 animate-pulse">
              <Zap className="w-4 h-4 text-cyan-400 animate-bounce" />
              <span>Tay chèo rẽ sóng...</span>
            </div>
          )}

          {raceState === 'finished' && (
            <button
              onClick={initBoats}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-black text-sm flex items-center gap-2 shadow-md transition-all cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Chặng đua mới</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Canvas */}
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
        <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-cyan-900/60 via-blue-900/40 to-slate-900 border border-cyan-500/50 flex flex-wrap items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-md">
              <Trophy className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider font-bold text-cyan-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>CÁN ĐÍCH ĐẦU TIÊN · VINH DANH</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-white font-display">
                {winners.map((w, idx) => (
                  <span key={w.id} className="inline-block mr-4 text-cyan-300">
                    🏆 #{idx + 1}: {w.studentName} {w.number ? `(SBD: ${w.number})` : ''}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={initBoats}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-sm shadow-md transition-all cursor-pointer"
          >
            Đua lượt tiếp theo
          </button>
        </div>
      )}
    </div>
  );
};
