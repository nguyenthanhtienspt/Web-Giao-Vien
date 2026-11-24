import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Plus, Minus, Award, Sparkles, Edit2, Check, PartyPopper, Flame, Undo2, Crown } from 'lucide-react';
import { GroupScore } from '../types';
import { soundManager } from '../services/sound';

interface ScoreboardTabProps {
  isLightMode: boolean;
  isActive?: boolean;
  activeClassName?: string;
  groups: GroupScore[];
  onUpdateGroups: (next: GroupScore[], recordUndo?: boolean) => void;
  canUndo: boolean;
  onUndo: () => void;
  onChangeGroupCount: (count: number) => void;
}

const FIREWORK_COLORS = [
  '#FFD700',
  '#FF3366',
  '#00E5FF',
  '#76FF03',
  '#FF9100',
  '#D500F9',
  '#FFFFFF',
];

export const ScoreboardTab: React.FC<ScoreboardTabProps> = ({
  isLightMode,
  isActive = true,
  activeClassName,
  groups,
  onUpdateGroups,
  canUndo,
  onUndo,
  onChangeGroupCount,
}) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [showCeremony, setShowCeremony] = useState<boolean>(false);

  const [celebrationBanner, setCelebrationBanner] = useState<{
    groupName: string;
    score: number;
    message: string;
  } | null>(null);

  const bannerTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (bannerTimeoutRef.current) {
        window.clearTimeout(bannerTimeoutRef.current);
      }
    };
  }, []);

  // Ctrl+Z shortcut for Undo when ScoreboardTab is active
  useEffect(() => {
    if (!isActive) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && canUndo) {
        e.preventDefault();
        onUndo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, canUndo, onUndo]);

  const launchGrandFireworks = (originX: number = 0.5) => {
    soundManager.playFireworksSound();

    confetti({
      particleCount: 80,
      angle: 90,
      spread: 70,
      origin: { x: originX, y: 0.65 },
      colors: FIREWORK_COLORS,
      startVelocity: 45,
      gravity: 0.9,
      scalar: 1.2,
      ticks: 200,
    });

    setTimeout(() => {
      confetti({
        particleCount: 65,
        angle: 60,
        spread: 60,
        origin: { x: Math.max(0.1, originX - 0.25), y: 0.55 },
        colors: FIREWORK_COLORS,
        startVelocity: 40,
        gravity: 0.85,
        scalar: 1.1,
      });
      confetti({
        particleCount: 65,
        angle: 120,
        spread: 60,
        origin: { x: Math.min(0.9, originX + 0.25), y: 0.55 },
        colors: FIREWORK_COLORS,
        startVelocity: 40,
        gravity: 0.85,
        scalar: 1.1,
      });
    }, 250);

    setTimeout(() => {
      confetti({
        particleCount: 90,
        spread: 120,
        origin: { x: originX, y: 0.35 },
        colors: ['#FFD700', '#FFFFFF', '#00E5FF', '#FF3366', '#76FF03'],
        shapes: ['circle', 'star'],
        startVelocity: 35,
        gravity: 0.7,
        scalar: 1.3,
        ticks: 250,
      });
    }, 550);
  };

  const launchContinuousCelebration = () => {
    soundManager.playWinner();
    launchGrandFireworks(0.5);
    setTimeout(() => launchGrandFireworks(0.25), 400);
    setTimeout(() => launchGrandFireworks(0.75), 800);
    setTimeout(() => {
      confetti({
        particleCount: 120,
        spread: 160,
        origin: { x: 0.5, y: 0.4 },
        colors: FIREWORK_COLORS,
        startVelocity: 50,
      });
    }, 1200);
  };

  const triggerCelebrationBanner = (groupName: string, score: number, message: string) => {
    if (bannerTimeoutRef.current) {
      window.clearTimeout(bannerTimeoutRef.current);
    }
    setCelebrationBanner({ groupName, score, message });
    bannerTimeoutRef.current = window.setTimeout(() => {
      setCelebrationBanner(null);
    }, 4000);
  };

  const updateScore = (id: number, delta: number) => {
    const targetGroup = groups.find((g) => g.id === id);
    if (!targetGroup) return;

    const oldScore = targetGroup.score;
    const newScore = Math.max(0, oldScore + delta);

    if (delta > 0) {
      soundManager.playPointAdd();
    } else {
      soundManager.playPointSub();
    }

    const next = groups.map((g) => (g.id === id ? { ...g, score: newScore } : g));
    onUpdateGroups(next, true);

    if (delta > 0 && newScore > oldScore) {
      const milestoneIntervals = [10, 15, 20, 25, 30, 40, 50];
      const hitMilestone = milestoneIntervals.find((m) => oldScore < m && newScore >= m);
      if (hitMilestone) {
        launchGrandFireworks(0.5);
        triggerCelebrationBanner(
          targetGroup.name,
          newScore,
          `XUẤT SẮC CHẠM MỐC ${hitMilestone} ĐIỂM!`
        );
      }
    }
  };

  const handleCongratulateGroup = (group: GroupScore, e?: React.MouseEvent) => {
    let xRatio = 0.5;
    if (e) {
      xRatio = Math.max(0.15, Math.min(0.85, e.clientX / window.innerWidth));
    }
    launchGrandFireworks(xRatio);
    triggerCelebrationBanner(
      group.name,
      group.score,
      group.score > 0
        ? `ĐẠT ${group.score} ĐIỂM · CHÚC MỪNG HOÀN THÀNH XUẤT SẮC!`
        : `CHÚC MỪNG PHẦN THỂ HIỆN TUỆT VỜI!`
    );
  };

  const handleResetScores = () => {
    if (window.confirm(`Thầy/Cô có chắc chắn muốn đặt lại điểm của tất cả ${groups.length} nhóm về 0?`)) {
      onUpdateGroups(
        groups.map((g) => ({ ...g, score: 0 })),
        true
      );
      setShowCeremony(false);
      setCelebrationBanner(null);
    }
  };

  const startEditing = (group: GroupScore) => {
    setEditingId(group.id);
    setEditName(group.name);
  };

  const saveEditing = () => {
    if (editingId !== null && editName.trim()) {
      onUpdateGroups(
        groups.map((g) => (g.id === editingId ? { ...g, name: editName.trim() } : g)),
        true
      );
    }
    setEditingId(null);
  };

  const handleOpenCeremony = () => {
    setShowCeremony(true);
    launchContinuousCelebration();
  };

  const maxScore = groups.length > 0 ? Math.max(...groups.map((g) => g.score)) : 0;
  const sortedByScore = [...groups].sort((a, b) => b.score - a.score);
  const topGroups = groups.filter((g) => g.score === maxScore && maxScore > 0);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col gap-6 relative">
      {/* Floating High-Score / Congratulatory Banner */}
      {celebrationBanner && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-2xl animate-in slide-in-from-top-6 duration-300 pointer-events-none">
          <div className="bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 p-1 rounded-3xl shadow-2xl shadow-indigo-500/40">
            <div
              className={`px-6 py-4 rounded-[22px] flex items-center justify-between gap-4 text-white ${
                isLightMode ? 'bg-slate-900' : 'bg-slate-950'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-lg animate-bounce">
                  <PartyPopper className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl sm:text-2xl font-black font-display text-amber-400 uppercase tracking-wide">
                      {celebrationBanner.groupName}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-xs font-bold font-mono">
                      {celebrationBanner.score} ĐIỂM
                    </span>
                  </div>
                  <p className="text-sm sm:text-base font-bold text-slate-200 mt-0.5">
                    {celebrationBanner.message} 🎆
                  </p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-1 text-amber-300 font-black text-xl animate-pulse">
                <span>✨ 🎆 ✨</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Banner Actions */}
      <div
        className={`p-4 sm:p-5 rounded-3xl border flex flex-wrap items-center justify-between gap-4 ${
          isLightMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/90 border-slate-800'
        }`}
      >
        <div className="flex items-center gap-3 flex-wrap">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-500 flex items-center justify-center">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black font-display tracking-tight flex items-center gap-2 flex-wrap">
              <span>
                BẢNG ĐIỂM THI ĐUA {groups.length} NHÓM
                {activeClassName ? ` · ${activeClassName}` : ''}
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                ✓ Lưu riêng theo lớp
              </span>
              {maxScore >= 10 && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-500 border border-amber-400/30 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 fill-amber-400" />
                  Cao nhất: {maxScore} điểm
                </span>
              )}
            </h3>
            {/* Group Count Quick Adjuster */}
            <div className="flex items-center flex-wrap gap-1.5 mt-1.5 text-xs">
              <span className="text-slate-400 font-bold">Số tổ/nhóm:</span>
              {[4, 6, 8, 10].map((cnt) => (
                <button
                  key={cnt}
                  onClick={() => onChangeGroupCount(cnt)}
                  className={`px-2 py-0.5 rounded-lg font-black cursor-pointer transition-colors ${
                    groups.length === cnt
                      ? 'bg-indigo-600 text-white'
                      : isLightMode
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {cnt}
                </button>
              ))}
              <div
                className={`flex items-center border rounded-lg px-1 ${
                  isLightMode ? 'border-slate-300' : 'border-slate-700'
                }`}
              >
                <button
                  onClick={() => onChangeGroupCount(groups.length - 1)}
                  className="px-1.5 font-bold text-slate-400 hover:text-indigo-500 cursor-pointer"
                >
                  −
                </button>
                <span className="px-1 font-black text-indigo-500">{groups.length}</span>
                <button
                  onClick={() => onChangeGroupCount(groups.length + 1)}
                  className="px-1.5 font-bold text-slate-400 hover:text-indigo-500 cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2 sm:gap-2.5">
          {/* Undo Button */}
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 border transition-all ${
              canUndo
                ? isLightMode
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 cursor-pointer'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 cursor-pointer'
                : 'opacity-40 cursor-not-allowed border-slate-700/40 text-slate-500'
            }`}
            title="Hoàn tác thao tác cộng/trừ điểm vừa rồi (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
            <span>Hoàn tác</span>
          </button>

          {/* Quick Fireworks Launcher */}
          <button
            onClick={() => {
              launchGrandFireworks(0.5);
              triggerCelebrationBanner('CẢ LỚP', maxScore, 'TIẾT HỌC SÔI NỔI · BẮN PHÁO HOA ĂN MỪNG!');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer shadow-sm ${
              isLightMode
                ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                : 'bg-amber-950/70 hover:bg-amber-900 text-amber-300 border border-amber-700/60'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
            <span>Pháo hoa 🎆</span>
          </button>

          {/* Reset points */}
          <button
            onClick={handleResetScores}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 border transition-colors cursor-pointer ${
              isLightMode
                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                : 'bg-rose-950/60 hover:bg-rose-900 text-rose-300 border-rose-800'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Đặt về 0</span>
          </button>

          {/* Award ceremony */}
          <button
            onClick={handleOpenCeremony}
            disabled={maxScore === 0}
            className={`px-4 py-2.5 rounded-2xl font-black font-display text-xs sm:text-sm flex items-center gap-1.5 shadow-lg transition-transform active:scale-95 ${
              maxScore > 0
                ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 shadow-amber-500/30 cursor-pointer'
                : 'opacity-50 cursor-not-allowed bg-slate-800 text-slate-500'
            }`}
          >
            <Award className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
            <span>VINH DANH 🥇</span>
          </button>
        </div>
      </div>

      {/* Groups Scoreboard Grid */}
      <div
        className={`grid gap-4 sm:gap-5 ${
          groups.length <= 4
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
            : 'grid-cols-2 md:grid-cols-4'
        }`}
      >
        {groups.map((group) => {
          const isTopScorer = group.score === maxScore && maxScore > 0;
          const rank = sortedByScore.findIndex((g) => g.id === group.id) + 1;
          const isHighScorer = group.score >= 10;

          return (
            <div
              key={group.id}
              className={`rounded-3xl border-3 flex flex-col justify-between overflow-hidden transition-all duration-300 relative ${
                isTopScorer
                  ? 'border-amber-400 ring-4 ring-amber-400/40 shadow-2xl scale-[1.02] bg-gradient-to-b from-amber-500/10 via-transparent to-transparent'
                  : isLightMode
                    ? 'bg-white border-slate-300 shadow-md hover:border-slate-400'
                    : 'bg-slate-900/90 border-slate-800 shadow-xl hover:border-slate-700'
              }`}
            >
              {/* Group Name Header */}
              <div className={`px-4 py-3 text-white flex items-center justify-between ${group.badgeColor}`}>
                <div className="flex items-center gap-2 flex-1 mr-2 min-w-0">
                  {editingId === group.id ? (
                    <div className="flex items-center gap-1 w-full">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && saveEditing()}
                        autoFocus
                        className="w-full bg-black/40 text-white px-2 py-0.5 rounded font-bold text-sm outline-none border border-white/40"
                      />
                      <button onClick={saveEditing} className="p-1 hover:bg-black/30 rounded cursor-pointer">
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      className="flex items-center gap-1.5 group cursor-pointer min-w-0"
                      onClick={() => startEditing(group)}
                      title="Bấm để đổi tên nhóm/tổ"
                    >
                      <h4 className="font-black font-display text-base sm:text-lg uppercase tracking-wider truncate">
                        {group.name}
                      </h4>
                      <Edit2 className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </div>
                  )}
                </div>

                {maxScore > 0 && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-black shrink-0 ${
                      rank === 1 ? 'bg-amber-400 text-amber-950 shadow' : 'bg-black/30 text-white'
                    }`}
                  >
                    {rank === 1 ? '🥇 #1' : rank === 2 ? '🥈 #2' : rank === 3 ? '🥉 #3' : `#${rank}`}
                  </span>
                )}
              </div>

              {/* Optional Leader Subtitle synced from GroupSplitter */}
              {group.leader !== undefined && (
                <div
                  className={`px-3 py-1.5 text-xs font-bold flex items-center justify-center gap-1 border-b truncate ${
                    isLightMode
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : 'bg-amber-950/30 border-slate-800 text-amber-300'
                  }`}
                >
                  <Crown className="w-3.5 h-3.5 fill-amber-400 text-amber-500 shrink-0" />
                  <span className="truncate">
                    NT: {typeof group.leader === 'number' ? `Số ${group.leader}` : group.leader}
                  </span>
                </div>
              )}

              {/* Main Score Display */}
              <div className="py-5 sm:py-6 px-4 flex flex-col items-center justify-center relative">
                <span
                  className={`font-black font-display text-6xl sm:text-8xl tabular-nums tracking-tighter leading-none transition-all ${
                    isTopScorer
                      ? 'text-amber-500 text-shadow-glow'
                      : isHighScorer
                        ? 'text-emerald-500'
                        : isLightMode
                          ? 'text-slate-900'
                          : 'text-white'
                  }`}
                >
                  {group.score}
                </span>

                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[11px] uppercase font-bold text-slate-400 tracking-widest">
                    ĐIỂM SỐ
                  </span>
                  {isHighScorer && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-500 px-1.5 py-0.2 rounded font-bold">
                      ⭐ ĐIỂM CAO
                    </span>
                  )}
                </div>

                <button
                  onClick={(e) => handleCongratulateGroup(group, e)}
                  className={`mt-3 px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all transform hover:scale-105 active:scale-95 cursor-pointer shadow-sm ${
                    isTopScorer
                      ? 'bg-amber-400 text-amber-950 hover:bg-amber-300'
                      : isLightMode
                        ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                        : 'bg-slate-800 hover:bg-indigo-950 text-indigo-300 border border-slate-700 hover:border-indigo-500'
                  }`}
                >
                  <PartyPopper className="w-3.5 h-3.5" />
                  <span>Chúc mừng 🎉</span>
                </button>
              </div>

              {/* Score Action Buttons */}
              <div
                className={`p-3 sm:p-4 bg-slate-500/5 border-t flex flex-col gap-2 ${
                  isLightMode ? 'border-slate-200' : 'border-slate-800'
                }`}
              >
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => updateScore(group.id, -1)}
                    className="py-3 px-2 rounded-2xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-black font-display text-2xl flex items-center justify-center gap-1 shadow-md shadow-rose-600/30 transition-all cursor-pointer"
                  >
                    <Minus className="w-6 h-6 stroke-[3]" />
                    <span>1</span>
                  </button>

                  <button
                    onClick={() => updateScore(group.id, 1)}
                    className="py-3 px-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black font-display text-2xl flex items-center justify-center gap-1 shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
                  >
                    <Plus className="w-6 h-6 stroke-[3]" />
                    <span>1</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => updateScore(group.id, 2)}
                    className={`py-1.5 px-2 rounded-xl font-bold text-xs sm:text-sm active:scale-95 transition-all cursor-pointer ${
                      isLightMode
                        ? 'bg-indigo-100 hover:bg-indigo-200 text-indigo-800'
                        : 'bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400'
                    }`}
                  >
                    +2 điểm
                  </button>
                  <button
                    onClick={() => {
                      updateScore(group.id, 5);
                      launchGrandFireworks(0.5);
                    }}
                    className={`py-1.5 px-2 rounded-xl font-bold text-xs sm:text-sm active:scale-95 transition-all cursor-pointer ${
                      isLightMode
                        ? 'bg-amber-100 hover:bg-amber-200 text-amber-900'
                        : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-400'
                    }`}
                  >
                    +5 điểm ⭐
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Award Ceremony Celebration Modal */}
      {showCeremony && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div
            className={`w-full max-w-xl rounded-3xl border-4 border-amber-400 p-8 sm:p-10 text-center shadow-2xl relative animate-in zoom-in-95 duration-200 ${
              isLightMode ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'
            }`}
          >
            <div className="w-24 h-24 mx-auto rounded-full bg-amber-400/20 text-amber-500 flex items-center justify-center mb-4 ring-8 ring-amber-400/30 animate-pulse">
              <Trophy className="w-14 h-14" />
            </div>

            <span className="text-sm font-bold uppercase tracking-widest text-amber-500 block mb-1">
              CHÚC MỪNG CHIẾN THẮNG XUẤT SẮC!
            </span>
            <h2 className="text-3xl sm:text-5xl font-black font-display mb-6">
              {topGroups.map((g) => g.name).join(' & ')}
            </h2>

            <div className="inline-block px-8 py-3 rounded-2xl bg-amber-400 text-amber-950 font-black text-2xl sm:text-3xl font-display mb-8 shadow-xl">
              ĐẠT {maxScore} ĐIỂM DẪN ĐẦU 🥇
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={launchContinuousCelebration}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black flex items-center gap-2 cursor-pointer shadow-lg hover:scale-105 active:scale-95 transition-all"
              >
                <Sparkles className="w-5 h-5 fill-current" />
                <span>Bắn thêm pháo hoa 🎆</span>
              </button>
              <button
                onClick={() => setShowCeremony(false)}
                className="px-6 py-3 rounded-2xl bg-slate-700 hover:bg-slate-600 text-white font-bold cursor-pointer transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
