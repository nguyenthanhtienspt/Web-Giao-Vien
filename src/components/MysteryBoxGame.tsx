import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Shuffle, Sparkles, Maximize2, Minimize2, RotateCcw } from 'lucide-react';
import { soundManager } from '../services/sound';

interface MysteryBoxGameProps {
  candidates: (string | number)[];
  batchCount: 1 | 2;
  isLightMode: boolean;
  studentNames?: string[];
  onSelectWinners: (winners: (string | number)[]) => void;
  isGameFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

const BOX_THEMES = [
  { bg: 'from-amber-400 to-orange-500', ribbon: 'bg-rose-600', border: 'border-amber-200', emoji: '🎁' },
  { bg: 'from-indigo-500 to-purple-600', ribbon: 'bg-amber-400', border: 'border-indigo-300', emoji: '🎁' },
  { bg: 'from-emerald-400 to-teal-600', ribbon: 'bg-amber-300', border: 'border-emerald-200', emoji: '🎁' },
  { bg: 'from-rose-500 to-pink-600', ribbon: 'bg-yellow-300', border: 'border-rose-200', emoji: '🎁' },
  { bg: 'from-cyan-400 to-blue-600', ribbon: 'bg-amber-300', border: 'border-cyan-200', emoji: '🎁' },
  { bg: 'from-fuchsia-500 to-purple-700', ribbon: 'bg-emerald-300', border: 'border-fuchsia-200', emoji: '🎁' },
];

export const MysteryBoxGame: React.FC<MysteryBoxGameProps> = ({
  candidates,
  batchCount,
  isLightMode,
  studentNames = [],
  onSelectWinners,
  isGameFullscreen = false,
  onToggleFullscreen,
}) => {
  const [boxCount, setBoxCount] = useState<6 | 9 | 12>(9);
  const [shakingBox, setShakingBox] = useState<number | null>(null);
  const [openedBoxes, setOpenedBoxes] = useState<Record<number, string>>({});
  const [isOpening, setIsOpening] = useState<boolean>(false);

  // Reset opened visual state if candidate pool resets
  useEffect(() => {
    setOpenedBoxes({});
    setShakingBox(null);
    setIsOpening(false);
  }, [boxCount]);

  const resolveDisplayName = (id: string | number): string => {
    if (typeof id === 'number') {
      return studentNames[id - 1] ? `Số ${id} · ${studentNames[id - 1]}` : `Số ${id}`;
    }
    return String(id);
  };

  const handleOpenBox = (boxIndex: number) => {
    if (isOpening || openedBoxes[boxIndex] || candidates.length === 0) return;

    setIsOpening(true);
    setShakingBox(boxIndex);
    soundManager.playMagicShimmer();

    window.setTimeout(() => {
      const pool = [...candidates].sort(() => Math.random() - 0.5);
      const picked = pool.slice(0, Math.min(batchCount, pool.length));
      const label = picked.map(resolveDisplayName).join(' & ');

      setShakingBox(null);
      setOpenedBoxes((prev) => ({
        ...prev,
        [boxIndex]: label,
      }));
      soundManager.playWinner();
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 },
      });

      window.setTimeout(() => {
        onSelectWinners(picked);
        setIsOpening(false);
      }, 650);
    }, 600);
  };

  const handleOpenRandomBox = () => {
    if (isOpening || candidates.length === 0) return;
    const closedIndices = Array.from({ length: boxCount }, (_, i) => i).filter(
      (i) => !openedBoxes[i]
    );
    if (closedIndices.length === 0) {
      setOpenedBoxes({});
      return;
    }
    const randomBox = closedIndices[Math.floor(Math.random() * closedIndices.length)];
    handleOpenBox(randomBox);
  };

  const rootRef = useRef<HTMLDivElement | null>(null);

  // Space / PageDown opens a random closed box!
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;
      if (rootRef.current && rootRef.current.offsetParent === null) return;
      if ((e.code === 'Space' || e.key === 'PageDown') && !isOpening) {
        e.preventDefault();
        handleOpenRandomBox();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpening, openedBoxes, boxCount, candidates, batchCount]);

  return (
    <div ref={rootRef} className="w-full flex flex-col items-center gap-4">
      {/* Top Bar */}
      <div className="w-full flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-black uppercase text-amber-500 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Mở hộp quà bí ẩn · Cho học sinh chọn số hộp!</span>
          </span>
          <div
            className={`flex items-center gap-1 p-0.5 rounded-lg border text-xs ${
              isLightMode ? 'bg-slate-100 border-slate-200' : 'bg-slate-800 border-slate-700'
            }`}
          >
            {([6, 9, 12] as const).map((cnt) => (
              <button
                key={cnt}
                type="button"
                onClick={() => setBoxCount(cnt)}
                className={`px-2 py-0.5 rounded-md font-bold text-[11px] cursor-pointer ${
                  boxCount === cnt ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                {cnt} hộp
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {Object.keys(openedBoxes).length > 0 && (
            <button
              type="button"
              onClick={() => setOpenedBoxes({})}
              className="px-2.5 py-1 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Đóng lại các hộp</span>
            </button>
          )}
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
              {isGameFullscreen ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
              <span>{isGameFullscreen ? 'Thu nhỏ' : 'Phóng to (F)'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid of Mystery Gift Boxes */}
      <div
        className={`w-full max-w-4xl grid gap-3 sm:gap-4 ${
          boxCount === 6
            ? 'grid-cols-2 sm:grid-cols-3'
            : boxCount === 9
              ? 'grid-cols-3'
              : 'grid-cols-3 sm:grid-cols-4'
        }`}
      >
        {Array.from({ length: boxCount }, (_, idx) => {
          const theme = BOX_THEMES[idx % BOX_THEMES.length];
          const isShaking = shakingBox === idx;
          const openedLabel = openedBoxes[idx];

          return (
            <button
              key={idx}
              type="button"
              disabled={isOpening || Boolean(openedLabel)}
              onClick={() => handleOpenBox(idx)}
              className={`relative h-28 sm:h-36 rounded-3xl border-2 p-3 flex flex-col items-center justify-center transition-all select-none overflow-hidden ${
                openedLabel
                  ? isLightMode
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-900 shadow-inner'
                    : 'bg-emerald-950/50 border-emerald-500/60 text-emerald-200 shadow-inner'
                  : `bg-gradient-to-br ${theme.bg} ${theme.border} text-white shadow-xl hover:scale-[1.04] active:scale-95 cursor-pointer`
              } ${isShaking ? 'animate-bounce scale-105 ring-4 ring-white' : ''}`}
            >
              {openedLabel ? (
                <div className="flex flex-col items-center gap-1 px-1 text-center animate-in zoom-in duration-200">
                  <span className="text-xs font-black uppercase text-emerald-500">
                    ✨ Hộp #{idx + 1}
                  </span>
                  <span className="font-display font-black text-sm sm:text-base leading-tight line-clamp-2">
                    {openedLabel}
                  </span>
                </div>
              ) : (
                <>
                  <span className="absolute top-2 left-3 px-2 py-0.5 rounded-full bg-black/25 text-white font-display font-black text-xs sm:text-sm">
                    #{idx + 1}
                  </span>
                  <span className="text-4xl sm:text-5xl drop-shadow-md mb-1">{theme.emoji}</span>
                  <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider bg-black/20 px-2.5 py-0.5 rounded-full">
                    Chạm để mở
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>

      {/* Random Open Button */}
      <button
        type="button"
        onClick={handleOpenRandomBox}
        disabled={isOpening || candidates.length === 0}
        className="mt-1 px-8 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-display font-black text-base sm:text-xl flex items-center gap-2.5 shadow-xl cursor-pointer active:scale-95 transition-all"
      >
        <Shuffle className="w-5 h-5" />
        <span>MỞ NGẪU NHIÊN 1 HỘP (SPACE)</span>
      </button>
    </div>
  );
};
