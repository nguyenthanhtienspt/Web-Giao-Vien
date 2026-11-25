import React, { useEffect, useRef, useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Play, RotateCcw, Maximize2, Minimize2, Sparkles } from 'lucide-react';
import { soundManager } from '../services/sound';

interface SpinningWheelGameProps {
  candidates: (string | number)[];
  batchCount: 1 | 2;
  isLightMode: boolean;
  studentNames?: string[];
  onSelectWinners: (winners: (string | number)[]) => void;
  isGameFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

const SLICE_PALETTE = [
  '#4f46e5', // Indigo
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#14b8a6', // Teal
  '#84cc16', // Lime
];

interface WheelEntry {
  id: string | number;
  shortLabel: string;
  fullName: string;
  color: string;
}

export const SpinningWheelGame: React.FC<SpinningWheelGameProps> = ({
  candidates,
  batchCount,
  isLightMode,
  studentNames = [],
  onSelectWinners,
  isGameFullscreen = false,
  onToggleFullscreen,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [spinState, setSpinState] = useState<'ready' | 'spinning' | 'finished'>('ready');
  const [sliceLimit, setSliceLimit] = useState<'all' | '16' | '24'>(
    candidates.length <= 24 ? 'all' : '24'
  );
  const [pointingName, setPointingName] = useState<string>('');

  const angleRef = useRef<number>(0);
  const pointerKickRef = useRef<number>(0);
  const animRef = useRef<number | null>(null);
  const lastSliceIdxRef = useRef<number>(-1);

  const entries: WheelEntry[] = useMemo(() => {
    let pool = [...candidates];
    if (sliceLimit === '16' && pool.length > 16) {
      pool = [...pool].sort(() => Math.random() - 0.5).slice(0, 16);
    } else if (sliceLimit === '24' && pool.length > 24) {
      pool = [...pool].sort(() => Math.random() - 0.5).slice(0, 24);
    }

    return pool.map((item, idx) => {
      if (typeof item === 'number') {
        const name = studentNames[item - 1] || `Số ${item}`;
        const parts = name.trim().split(/\s+/);
        const short = parts.length >= 2 ? `${item}. ${parts.slice(-2).join(' ')}` : `${item}. ${name}`;
        return {
          id: item,
          shortLabel: short,
          fullName: name,
          color: SLICE_PALETTE[idx % SLICE_PALETTE.length],
        };
      }
      const full = String(item);
      const parts = full.trim().split(/\s+/);
      const short = parts.length > 2 ? parts.slice(-2).join(' ') : full;
      return {
        id: item,
        shortLabel: short,
        fullName: full,
        color: SLICE_PALETTE[idx % SLICE_PALETTE.length],
      };
    });
  }, [candidates, sliceLimit, studentNames]);

  const getPointedIndex = (angle: number, count: number): number => {
    if (count === 0) return 0;
    const sliceArc = (Math.PI * 2) / count;
    // Pointer is at top (-Math.PI / 2)
    let rel = (-Math.PI / 2 - angle) % (Math.PI * 2);
    if (rel < 0) rel += Math.PI * 2;
    return Math.floor(rel / sliceArc) % count;
  };

  const drawWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - 26;

    ctx.clearRect(0, 0, size, size);

    const n = entries.length;
    if (n === 0) return;

    // Outer glowing rim
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 12, 0, Math.PI * 2);
    ctx.fillStyle = isLightMode ? '#1e293b' : '#0f172a';
    ctx.shadowColor = 'rgba(99, 102, 241, 0.45)';
    ctx.shadowBlur = 22;
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#fbbf24';
    ctx.stroke();
    ctx.restore();

    const sliceArc = (Math.PI * 2) / n;

    entries.forEach((entry, i) => {
      const startAngle = angleRef.current + i * sliceArc;
      const endAngle = startAngle + sliceArc;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = entry.color;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.stroke();

      // Label along slice radius
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(startAngle + sliceArc / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      const fontSize = n > 28 ? 11 : n > 18 ? 13 : 15;
      ctx.font = `800 ${fontSize}px Lexend, Plus Jakarta Sans, sans-serif`;
      ctx.shadowColor = 'rgba(0,0,0,0.45)';
      ctx.shadowBlur = 3;
      const maxChars = n > 24 ? 14 : 18;
      const labelText =
        entry.shortLabel.length > maxChars
          ? entry.shortLabel.slice(0, maxChars - 1) + '…'
          : entry.shortLabel;
      ctx.fillText(labelText, radius - 16, fontSize / 3);
      ctx.restore();

      // Peg dots around outer border
      const pegAngle = startAngle;
      const px = cx + Math.cos(pegAngle) * (radius + 6);
      const py = cy + Math.sin(pegAngle) * (radius + 6);
      ctx.beginPath();
      ctx.arc(px, py, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#fde68a';
      ctx.fill();
    });

    // Center hub
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, 38, 0, Math.PI * 2);
    const grad = ctx.createRadialGradient(cx, cy, 6, cx, cy, 38);
    grad.addColorStop(0, '#fde047');
    grad.addColorStop(1, '#f59e0b');
    ctx.fillStyle = grad;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.font = '900 18px Lexend, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('QUAY', cx, cy + 1);
    ctx.restore();

    // Top Pointer Needle (with bounce kick)
    ctx.save();
    ctx.translate(cx, 18);
    ctx.rotate(pointerKickRef.current);
    ctx.beginPath();
    ctx.moveTo(-16, -10);
    ctx.lineTo(16, -10);
    ctx.lineTo(0, 26);
    ctx.closePath();
    ctx.fillStyle = '#f43f5e';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    ctx.restore();
  };

  useEffect(() => {
    if (spinState === 'ready') {
      const idx = getPointedIndex(angleRef.current, entries.length);
      setPointingName(entries[idx]?.fullName || '');
      drawWheel();
    }
  }, [entries, isLightMode, spinState]);

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  const handleStartSpin = () => {
    if (spinState === 'spinning' || entries.length === 0) return;

    setSpinState('spinning');
    const chosenWinnerIndex = Math.floor(Math.random() * entries.length);
    const sliceArc = (Math.PI * 2) / entries.length;

    // Compute exact target angle so chosenWinnerIndex lands under top pointer (-PI/2)
    const jitterWithinSlice = (0.2 + Math.random() * 0.6) * sliceArc;
    const targetMod = -Math.PI / 2 - (chosenWinnerIndex * sliceArc + jitterWithinSlice);
    const currentBase = angleRef.current;
    const extraSpins = (6 + Math.floor(Math.random() * 3)) * Math.PI * 2;
    let delta = targetMod - (currentBase % (Math.PI * 2));
    if (delta < 0) delta += Math.PI * 2;
    const finalAngle = currentBase + extraSpins + delta;

    const startAngle = currentBase;
    const duration = 5200; // 5.2s exciting spin with smooth deceleration
    const startTime = performance.now();
    lastSliceIdxRef.current = getPointedIndex(startAngle, entries.length);

    const step = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      // Cubic-quartic ease-out for realistic wheel friction
      const easeOut = 1 - Math.pow(1 - t, 3.8);
      angleRef.current = startAngle + (finalAngle - startAngle) * easeOut;

      const curIdx = getPointedIndex(angleRef.current, entries.length);
      if (curIdx !== lastSliceIdxRef.current) {
        lastSliceIdxRef.current = curIdx;
        pointerKickRef.current = -0.32;
        setPointingName(entries[curIdx]?.fullName || '');
        soundManager.playWheelTick(0.9 + (1 - t) * 0.35);
      } else {
        pointerKickRef.current *= 0.82;
      }

      drawWheel();

      if (t < 1) {
        animRef.current = requestAnimationFrame(step);
      } else {
        pointerKickRef.current = 0;
        drawWheel();
        setSpinState('finished');
        soundManager.playWinner();
        confetti({
          particleCount: 95,
          spread: 85,
          origin: { y: 0.55 },
        });

        const firstWinner = entries[chosenWinnerIndex];
        const winnerIds: (string | number)[] = [firstWinner.id];

        if (batchCount === 2 && entries.length > 1) {
          const otherPool = entries.filter((_, idx) => idx !== chosenWinnerIndex);
          const second = otherPool[Math.floor(Math.random() * otherPool.length)];
          winnerIds.push(second.id);
        }

        window.setTimeout(() => {
          onSelectWinners(winnerIds);
          setSpinState('ready');
        }, 450);
      }
    };

    animRef.current = requestAnimationFrame(step);
  };

  // Spacebar / PageDown presenter support
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;
      if (canvasRef.current && canvasRef.current.offsetParent === null) return;
      if ((e.code === 'Space' || e.key === 'PageDown') && spinState === 'ready') {
        e.preventDefault();
        handleStartSpin();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [spinState, entries, batchCount]);

  return (
    <div className="w-full flex flex-col items-center gap-3">
      {/* Compact Header Bar */}
      <div className="w-full flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-black uppercase text-amber-500 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Vòng quay may mắn</span>
          </span>
          {candidates.length > 16 && (
            <div
              className={`flex items-center gap-1 p-0.5 rounded-lg border ${
                isLightMode ? 'bg-slate-100 border-slate-200' : 'bg-slate-800 border-slate-700'
              }`}
            >
              {(['16', '24', 'all'] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  disabled={spinState === 'spinning'}
                  onClick={() => setSliceLimit(opt)}
                  className={`px-2 py-0.5 rounded-md font-bold text-[11px] cursor-pointer ${
                    sliceLimit === opt
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {opt === 'all' ? `Tất cả (${candidates.length})` : `${opt} ô`}
                </button>
              ))}
            </div>
          )}
        </div>

        {onToggleFullscreen && (
          <button
            type="button"
            onClick={onToggleFullscreen}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 border cursor-pointer ${
              isLightMode
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-indigo-300'
            }`}
          >
            {isGameFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span>{isGameFullscreen ? 'Thu nhỏ' : 'Phóng to (F)'}</span>
          </button>
        )}
      </div>

      {/* Live Pointer Readout */}
      <div
        className={`px-5 py-1.5 rounded-full border text-sm sm:text-lg font-display font-black tracking-tight min-h-[2.25rem] flex items-center justify-center ${
          spinState === 'spinning'
            ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md scale-105 transition-transform'
            : isLightMode
              ? 'bg-white border-slate-200 text-indigo-700 shadow-xs'
              : 'bg-slate-900/90 border-slate-700 text-amber-300'
        }`}
      >
        {pointingName || 'Sẵn sàng quay!'}
      </div>

      {/* Wheel Canvas */}
      <div
        onClick={handleStartSpin}
        className="relative cursor-pointer select-none transition-transform active:scale-[0.99]"
        title="Bấm vào vòng quay hoặc nhấn phím Space để quay!"
      >
        <canvas
          ref={canvasRef}
          width={isGameFullscreen ? 540 : 440}
          height={isGameFullscreen ? 540 : 440}
          className="max-w-[86vw] max-h-[58vh] w-auto h-auto mx-auto"
        />
      </div>

      {/* Spin Button */}
      <div className="flex items-center gap-3 mt-1">
        <button
          type="button"
          onClick={handleStartSpin}
          disabled={spinState === 'spinning' || entries.length === 0}
          className={`px-8 sm:px-12 py-3.5 rounded-2xl font-display font-black text-lg sm:text-2xl flex items-center gap-3 shadow-xl transition-all cursor-pointer ${
            spinState === 'spinning'
              ? 'bg-slate-700 text-slate-400 cursor-wait'
              : 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 hover:scale-[1.03] active:scale-95'
          }`}
        >
          {spinState === 'spinning' ? (
            <RotateCcw className="w-6 h-6 animate-spin" />
          ) : (
            <Play className="w-6 h-6 fill-current" />
          )}
          <span>{spinState === 'spinning' ? 'ĐANG QUAY...' : 'QUAY NGAY (SPACE)'}</span>
        </button>
      </div>
    </div>
  );
};
