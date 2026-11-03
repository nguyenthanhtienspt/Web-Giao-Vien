import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Play, RotateCcw, Volume2, Trophy, Sparkles, Wand2, Eye, Flame, Maximize2, Minimize2 } from 'lucide-react';
import { soundManager } from '../services/sound';

interface Contestant {
  id: string | number;
  number?: number;
  studentName: string;
  label: string;
  element: {
    name: string;
    icon: string;
    badgeBg: string;
    borderGlow: string;
  };
}

interface MagicCardGameProps {
  candidates: (string | number)[];
  batchCount: 1 | 2;
  isLightMode: boolean;
  studentNames?: string[];
  onSelectWinners: (winners: (string | number)[]) => void;
  onClose?: () => void;
  isGameFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

const MAGIC_ELEMENTS = [
  { name: 'Phượng Hoàng Lửa', icon: '🔥', badgeBg: 'from-amber-500 to-red-600', borderGlow: 'border-amber-400 shadow-amber-500/50' },
  { name: 'Rồng Thần Biển Cả', icon: '🐉', badgeBg: 'from-cyan-500 to-blue-600', borderGlow: 'border-cyan-400 shadow-cyan-500/50' },
  { name: 'Sấm Sét Hoàng Kim', icon: '⚡', badgeBg: 'from-yellow-400 to-amber-600', borderGlow: 'border-yellow-400 shadow-yellow-500/50' },
  { name: 'Kỳ Lân Ánh Sáng', icon: '🦄', badgeBg: 'from-pink-400 to-purple-600', borderGlow: 'border-pink-400 shadow-pink-500/50' },
  { name: 'Sao Băng Huyền Thoại', icon: '🌟', badgeBg: 'from-emerald-400 to-teal-600', borderGlow: 'border-emerald-400 shadow-emerald-500/50' },
  { name: 'Gió Lốc Bão Táp', icon: '🌪️', badgeBg: 'from-indigo-400 to-violet-600', borderGlow: 'border-indigo-400 shadow-indigo-500/50' },
  { name: 'Mặt Trời Thái Dương', icon: '☀️', badgeBg: 'from-orange-400 to-red-500', borderGlow: 'border-orange-400 shadow-orange-500/50' },
  { name: 'Mặt Trăng Huyền Bí', icon: '🌙', badgeBg: 'from-purple-400 to-indigo-600', borderGlow: 'border-purple-400 shadow-purple-500/50' },
];

export const MagicCardGame: React.FC<MagicCardGameProps> = ({
  candidates,
  batchCount,
  isLightMode,
  studentNames = [],
  onSelectWinners,
  isGameFullscreen = false,
  onToggleFullscreen,
}) => {
  const [maxCardsOption, setMaxCardsOption] = useState<'all' | '12' | '20'>(
    candidates.length <= 16 ? 'all' : '20'
  );

  const contestants: Contestant[] = useMemo(() => {
    let pool = [...candidates];
    if (maxCardsOption === '12' && pool.length > 12) {
      pool = [...pool].sort(() => Math.random() - 0.5).slice(0, 12);
    } else if (maxCardsOption === '20' && pool.length > 20) {
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

      const elem = MAGIC_ELEMENTS[index % MAGIC_ELEMENTS.length];
      return {
        id: item,
        number: resolvedNumber,
        studentName: resolvedName,
        label: resolvedNumber ? `Số ${resolvedNumber} - ${resolvedName}` : resolvedName,
        element: elem,
      };
    });
  }, [candidates, maxCardsOption, studentNames]);

  const [gameState, setGameState] = useState<'ready' | 'shuffling' | 'revealing' | 'flipped'>('ready');
  const [activeHighlightIndex, setActiveHighlightIndex] = useState<number>(0);
  const [chosenContestants, setChosenContestants] = useState<Contestant[]>([]);

  const handleStartDraw = () => {
    if (gameState !== 'ready' || contestants.length === 0) return;
    setGameState('shuffling');
    soundManager.playMagicShimmer();

    // Rapid shuffle cycling through cards
    let cycleCount = 0;
    const maxCycles = 24;
    const interval = setInterval(() => {
      cycleCount++;
      setActiveHighlightIndex(Math.floor(Math.random() * contestants.length));
      if (cycleCount % 4 === 0) {
        soundManager.playWheelTick(1.4);
      }

      if (cycleCount >= maxCycles) {
        clearInterval(interval);

        // Pick winners
        const shuffled = [...contestants].sort(() => Math.random() - 0.5);
        const winners = shuffled.slice(0, Math.min(batchCount, contestants.length));
        setChosenContestants(winners);
        setGameState('revealing');

        // Reveal card flip after dramatic pause
        setTimeout(() => {
          soundManager.playCardFlip();
          setGameState('flipped');
          soundManager.playWinner();
          confetti({
            particleCount: 160,
            spread: 120,
            origin: { y: 0.55 },
            colors: ['#a855f7', '#fbbf24', '#38bdf8', '#f43f5e', '#ffffff'],
          });
          onSelectWinners(winners.map((w) => w.id));
        }, 900);
      }
    }, 90);
  };

  const handleReset = () => {
    setGameState('ready');
    setChosenContestants([]);
    setActiveHighlightIndex(0);
  };

  // Keyboard shortcut Space / Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        if (gameState === 'ready') {
          handleStartDraw();
        } else if (gameState === 'flipped') {
          handleReset();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, contestants]);

  return (
    <div className={`w-full rounded-2xl border p-4 sm:p-5 transition-all ${
      isLightMode ? 'bg-white border-slate-200 shadow-lg' : 'bg-slate-900/90 border-slate-800'
    }`}>
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white text-xl shadow-md shadow-purple-500/20">
            🃏
          </div>
          <div>
            <h3 className="font-display font-black text-lg sm:text-xl flex items-center gap-2">
              <span>Rút Thăm Bài Ma Thuật</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30">
                Lật bài 3D
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Bộ bài định mệnh cổ xưa · Triệu hồi ngẫu nhiên {batchCount} học sinh
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded-xl text-xs border border-slate-700">
            <span className="text-slate-400">Số lá bài:</span>
            <select
              value={maxCardsOption}
              onChange={(e) => setMaxCardsOption(e.target.value as 'all' | '12' | '20')}
              disabled={gameState !== 'ready'}
              className="bg-transparent text-purple-300 font-bold outline-none cursor-pointer"
            >
              <option value="all">Tất cả ({candidates.length})</option>
              <option value="12">Top 12 bài</option>
              <option value="20">Top 20 bài</option>
            </select>
          </div>

          <button
            onClick={() => soundManager.playMagicShimmer()}
            title="Nghe thử tiếng chuông phép thuật"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-400 border border-slate-700 transition-all cursor-pointer"
          >
            <Volume2 className="w-4 h-4" />
          </button>

          {/* Fullscreen Zoom Toggle Button */}
          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                isGameFullscreen
                  ? 'bg-purple-600 text-white border-purple-400'
                  : 'bg-slate-800 hover:bg-slate-700 text-purple-300 border-slate-700'
              }`}
              title={isGameFullscreen ? 'Thu nhỏ lại (Esc)' : 'Phóng to toàn màn hình máy chiếu (Phím F)'}
            >
              {isGameFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              <span className="hidden sm:inline">{isGameFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}</span>
            </button>
          )}

          {gameState === 'ready' && (
            <button
              onClick={handleStartDraw}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-sm flex items-center gap-2 shadow-lg shadow-purple-500/30 transition-all cursor-pointer active:scale-95"
            >
              <Wand2 className="w-4 h-4" />
              <span>TRIỆU HỒI BÀI (Space)</span>
            </button>
          )}

          {gameState === 'shuffling' && (
            <div className="px-4 py-2 rounded-xl bg-purple-950/80 border border-purple-500/50 text-purple-300 font-bold text-sm flex items-center gap-2 animate-pulse">
              <Sparkles className="w-4 h-4 text-purple-400 animate-spin" />
              <span>Đang xáo bài ma thuật...</span>
            </div>
          )}

          {gameState === 'revealing' && (
            <div className="px-4 py-2 rounded-xl bg-amber-950/80 border border-amber-500/50 text-amber-300 font-bold text-sm flex items-center gap-2 animate-pulse">
              <Eye className="w-4 h-4 text-amber-400" />
              <span>Lá bài đang bay ra...</span>
            </div>
          )}

          {gameState === 'flipped' && (
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-black text-sm flex items-center gap-2 shadow-md transition-all cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Rút lượt mới</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div className="relative w-full min-h-[380px] rounded-xl overflow-hidden border border-purple-900/60 bg-gradient-to-b from-slate-950 via-slate-900 to-purple-950/50 p-6 flex flex-col items-center justify-center">
        {/* Mystic Background Runes & Particles */}
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#a855f7_1px,transparent_1px)] [background-size:24px_24px]" />
        
        {/* Stage 1: Grid of Face-down Mystic Cards */}
        {(gameState === 'ready' || gameState === 'shuffling') && (
          <div className="w-full max-w-4xl flex flex-wrap justify-center gap-3 py-4 z-10">
            {contestants.map((c, idx) => {
              const isHighlight = gameState === 'shuffling' && activeHighlightIndex === idx;
              return (
                <div
                  key={c.id}
                  className={`w-16 h-24 sm:w-20 sm:h-28 rounded-xl border-2 transition-all duration-150 flex flex-col items-center justify-between p-2 select-none relative shadow-lg ${
                    isHighlight
                      ? 'scale-110 -translate-y-2 border-amber-400 bg-gradient-to-br from-amber-500/40 to-purple-600/40 shadow-amber-500/60 z-20'
                      : 'border-purple-500/40 bg-gradient-to-br from-slate-900 to-purple-950/80 hover:border-purple-400 hover:scale-105'
                  }`}
                >
                  <span className="text-xs text-purple-300 font-mono font-bold">
                    {c.number ? `#${c.number}` : '🔮'}
                  </span>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-purple-400/50 flex items-center justify-center text-sm shadow-inner bg-purple-950/80">
                    ✨
                  </div>
                  <span className="text-[10px] text-slate-300 truncate w-full text-center font-semibold">
                    {c.studentName.split(' ').slice(-1)[0]}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Stage 2 & 3: Revealed Flipped Hero Cards Spotlight */}
        {(gameState === 'revealing' || gameState === 'flipped') && (
          <div className="w-full flex flex-wrap items-center justify-center gap-6 py-4 z-20 animate-in fade-in zoom-in-95 duration-500">
            {chosenContestants.map((winner, idx) => {
              const isFlipped = gameState === 'flipped';
              return (
                <div
                  key={winner.id}
                  className={`w-72 sm:w-80 h-96 rounded-2xl border-4 p-5 flex flex-col items-center justify-between shadow-2xl transition-all duration-700 relative overflow-hidden ${
                    isFlipped
                      ? `bg-gradient-to-b from-slate-900 via-purple-950 to-slate-900 ${winner.element.borderGlow} scale-105 shadow-2xl`
                      : 'bg-slate-900 border-purple-500/50 scale-95 opacity-80'
                  }`}
                >
                  {/* Card Header */}
                  <div className="w-full flex items-center justify-between border-b border-purple-500/30 pb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Lá bài #{idx + 1}</span>
                    </span>
                    <span className="text-xs font-mono font-black px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-200">
                      {winner.number ? `SBD: ${winner.number}` : 'ĐỊNH MỆNH'}
                    </span>
                  </div>

                  {/* Card Center Elemental Icon */}
                  <div className="my-auto flex flex-col items-center gap-3">
                    <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${winner.element.badgeBg} flex items-center justify-center text-5xl shadow-xl shadow-purple-500/30 animate-pulse-subtle`}>
                      {winner.element.icon}
                    </div>
                    <div className="text-center">
                      <div className="text-xs font-bold text-purple-300 uppercase tracking-widest">
                        {winner.element.name}
                      </div>
                      <div className="text-2xl sm:text-3xl font-black text-white font-display mt-1 drop-shadow-md">
                        {winner.studentName}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="w-full text-center pt-2 border-t border-purple-500/30">
                    <span className="text-xs font-bold text-amber-400">
                      ⭐ Học sinh được lựa chọn ⭐
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Winner Celebration Bar */}
      {gameState === 'flipped' && chosenContestants.length > 0 && (
        <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-purple-900/60 via-fuchsia-900/40 to-slate-900 border border-purple-500/50 flex flex-wrap items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-md">
              <Trophy className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider font-bold text-purple-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>BÀI MA THUẬT ĐÃ CHỌN · CHÚC MỪNG</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-white font-display">
                {chosenContestants.map((w, idx) => (
                  <span key={w.id} className="inline-block mr-4 text-amber-300">
                    🃏 #{idx + 1}: {w.studentName} {w.number ? `(SBD: ${w.number})` : ''}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-black text-sm shadow-md transition-all cursor-pointer"
          >
            Rút lượt tiếp theo
          </button>
        </div>
      )}
    </div>
  );
};
