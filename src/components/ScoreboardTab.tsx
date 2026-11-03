import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Plus, Minus, Award, Sparkles, Edit2, Check, PartyPopper, Flame } from 'lucide-react';
import { GroupScore } from '../types';
import { soundManager } from '../services/sound';

interface ScoreboardTabProps {
  isLightMode: boolean;
}

const INITIAL_GROUPS: GroupScore[] = [
  { id: 1, name: 'Nhóm 1', score: 0, color: 'border-blue-500', badgeColor: 'bg-blue-600' },
  { id: 2, name: 'Nhóm 2', score: 0, color: 'border-emerald-500', badgeColor: 'bg-emerald-600' },
  { id: 3, name: 'Nhóm 3', score: 0, color: 'border-amber-500', badgeColor: 'bg-amber-600' },
  { id: 4, name: 'Nhóm 4', score: 0, color: 'border-rose-500', badgeColor: 'bg-rose-600' },
  { id: 5, name: 'Nhóm 5', score: 0, color: 'border-purple-500', badgeColor: 'bg-purple-600' },
  { id: 6, name: 'Nhóm 6', score: 0, color: 'border-cyan-500', badgeColor: 'bg-cyan-600' },
  { id: 7, name: 'Nhóm 7', score: 0, color: 'border-orange-500', badgeColor: 'bg-orange-600' },
  { id: 8, name: 'Nhóm 8', score: 0, color: 'border-pink-500', badgeColor: 'bg-pink-600' },
];

// Vibrant color palette for fireworks particles
const FIREWORK_COLORS = [
  '#FFD700', // Gold
  '#FF3366', // Hot pink / Red
  '#00E5FF', // Cyan
  '#76FF03', // Lime / Emerald
  '#FF9100', // Neon Orange
  '#D500F9', // Electric Purple
  '#FFFFFF', // Starlight White
];

export const ScoreboardTab: React.FC<ScoreboardTabProps> = ({ isLightMode }) => {
  const [groups, setGroups] = useState<GroupScore[]>(INITIAL_GROUPS);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [showCeremony, setShowCeremony] = useState<boolean>(false);
  
  // Celebration banner state when high score reached or congratulation button clicked
  const [celebrationBanner, setCelebrationBanner] = useState<{
    groupName: string;
    score: number;
    message: string;
  } | null>(null);

  const bannerTimeoutRef = useRef<number | null>(null);

  // Clean up banner timer
  useEffect(() => {
    return () => {
      if (bannerTimeoutRef.current) {
        window.clearTimeout(bannerTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Multi-stage Realistic Fireworks Launcher
   */
  const launchGrandFireworks = (originX: number = 0.5) => {
    soundManager.playFireworksSound();

    // Burst 1: Initial core rocket explosion
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

    // Burst 2 & 3: Staggered side rockets left and right
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

    // Burst 4: Sky-filling star canopy with gentle drift
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

  /**
   * Continuous Cascading Fireworks (for Ceremony & Big Victories)
   */
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

  /**
   * Show Celebration Banner
   */
  const triggerCelebrationBanner = (groupName: string, score: number, message: string) => {
    if (bannerTimeoutRef.current) {
      window.clearTimeout(bannerTimeoutRef.current);
    }
    setCelebrationBanner({ groupName, score, message });
    bannerTimeoutRef.current = window.setTimeout(() => {
      setCelebrationBanner(null);
    }, 4000);
  };

  // Modify score with milestone check
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

    setGroups((prev) =>
      prev.map((g) => {
        if (g.id === id) {
          return { ...g, score: newScore };
        }
        return g;
      })
    );

    // Auto-fireworks check on reaching milestone high scores (e.g. 10, 15, 20, 25, 30...)
    if (delta > 0 && newScore > oldScore) {
      const milestoneIntervals = [10, 15, 20, 25, 30, 40, 50];
      const hitMilestone = milestoneIntervals.find((m) => oldScore < m && newScore >= m);

      if (hitMilestone) {
        // High score milestone achieved! Trigger fireworks & celebratory banner
        launchGrandFireworks(0.5);
        triggerCelebrationBanner(
          targetGroup.name,
          newScore,
          `XUẤT SẮC CHẠM MỐC ${hitMilestone} ĐIỂM!`
        );
      }
    }
  };

  // Teacher manually clicks "Chúc mừng" on a specific group
  const handleCongratulateGroup = (group: GroupScore, e?: React.MouseEvent) => {
    // Estimate horizontal position of click or group
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
        : `CHÚC MỪNG PHẦN THỂ HIỆN TUYỆT VỜI!`
    );
  };

  // Reset all scores
  const handleResetScores = () => {
    if (window.confirm('Thầy/Cô có chắc chắn muốn đặt lại điểm của tất cả 8 nhóm về 0?')) {
      setGroups((prev) => prev.map((g) => ({ ...g, score: 0 })));
      setShowCeremony(false);
      setCelebrationBanner(null);
    }
  };

  // Edit group name
  const startEditing = (group: GroupScore) => {
    setEditingId(group.id);
    setEditName(group.name);
  };

  const saveEditing = () => {
    if (editingId !== null && editName.trim()) {
      setGroups((prev) =>
        prev.map((g) => (g.id === editingId ? { ...g, name: editName.trim() } : g))
      );
    }
    setEditingId(null);
  };

  // Award ceremony modal
  const handleOpenCeremony = () => {
    setShowCeremony(true);
    launchContinuousCelebration();
  };

  // Calculate highest score and rankings
  const maxScore = Math.max(...groups.map((g) => g.score));
  const sortedByScore = [...groups].sort((a, b) => b.score - a.score);
  const topGroups = groups.filter((g) => g.score === maxScore && maxScore > 0);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col gap-6 relative">
      {/* Floating High-Score / Congratulatory Banner on Projector */}
      {celebrationBanner && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-2xl animate-in slide-in-from-top-6 duration-300 pointer-events-none">
          <div className="bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 p-1 rounded-3xl shadow-2xl shadow-indigo-500/40">
            <div className={`px-6 py-4 rounded-[22px] flex items-center justify-between gap-4 text-white ${
              isLightMode ? 'bg-slate-900' : 'bg-slate-950'
            }`}>
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
      <div className={`p-4 sm:p-5 rounded-3xl border flex flex-wrap items-center justify-between gap-4 ${
        isLightMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/90 border-slate-800'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black font-display tracking-tight flex items-center gap-2">
              <span>BẢNG ĐIỂM THI ĐUA 8 NHÓM</span>
              {maxScore >= 10 && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-400 border border-amber-400/30 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 fill-amber-400" />
                  Cao nhất: {maxScore} điểm
                </span>
              )}
            </h3>
            <span className="text-xs text-slate-400 font-semibold">
              Cộng / trừ điểm theo hoạt động học tập, có hiệu ứng pháo hoa ăn mừng điểm số cao
            </span>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5 sm:gap-3">
          {/* Quick Fireworks Launcher Button */}
          <button
            onClick={() => {
              launchGrandFireworks(0.5);
              triggerCelebrationBanner('CẢ LỚP', maxScore, 'TIẾT HỌC SÔI NỔI · BẮN PHÁO HOA ĂN MỪNG!');
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer shadow-md ${
              isLightMode
                ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                : 'bg-amber-950/70 hover:bg-amber-900 text-amber-300 border border-amber-700/60'
            }`}
            title="Bắn pháo hoa ăn mừng ngay trên máy chiếu"
          >
            <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>Bắn pháo hoa 🎆</span>
          </button>

          {/* Reset points button */}
          <button
            onClick={handleResetScores}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 border transition-colors ${
              isLightMode
                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                : 'bg-rose-950/60 hover:bg-rose-900 text-rose-300 border-rose-800'
            }`}
            title="Đặt lại toàn bộ điểm số về 0"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Đặt lại điểm (0)</span>
          </button>

          {/* Celebrate top team / Award ceremony button */}
          <button
            onClick={handleOpenCeremony}
            disabled={maxScore === 0}
            className={`px-5 py-2.5 rounded-2xl font-black font-display text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer ${
              maxScore > 0
                ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 shadow-amber-500/30'
                : 'opacity-50 cursor-not-allowed bg-slate-800 text-slate-500'
            }`}
          >
            <Award className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
            <span>VINH DANH NHÓM XUẤT SẮC 🥇</span>
          </button>
        </div>
      </div>

      {/* 8 Groups Scoreboard Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {groups.map((group) => {
          const isLeader = group.score === maxScore && maxScore > 0;
          const rank = sortedByScore.findIndex((g) => g.id === group.id) + 1;
          const isHighScorer = group.score >= 10;

          return (
            <div
              key={group.id}
              className={`rounded-3xl border-3 flex flex-col justify-between overflow-hidden transition-all duration-300 relative ${
                isLeader
                  ? 'border-amber-400 ring-4 ring-amber-400/40 shadow-2xl scale-[1.02] bg-gradient-to-b from-amber-500/10 via-transparent to-transparent'
                  : isLightMode
                    ? 'bg-white border-slate-300 shadow-md hover:border-slate-400'
                    : 'bg-slate-900/90 border-slate-800 shadow-xl hover:border-slate-700'
              }`}
            >
              {/* Group Name Header */}
              <div className={`px-4 py-3 text-white flex items-center justify-between ${group.badgeColor}`}>
                <div className="flex items-center gap-2 flex-1 mr-2">
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
                      <button onClick={saveEditing} className="p-1 hover:bg-black/30 rounded">
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 group cursor-pointer" onClick={() => startEditing(group)}>
                      <h4 className="font-black font-display text-base sm:text-lg uppercase tracking-wider truncate">
                        {group.name}
                      </h4>
                      <Edit2 className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )}
                </div>

                {/* Rank Badge */}
                {maxScore > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
                    rank === 1 ? 'bg-amber-400 text-amber-950 shadow' : 'bg-black/30 text-white'
                  }`}>
                    {rank === 1 ? '🥇 #1' : rank === 2 ? '🥈 #2' : rank === 3 ? '🥉 #3' : `#${rank}`}
                  </span>
                )}
              </div>

              {/* Main Score Display */}
              <div className="py-5 sm:py-7 px-4 flex flex-col items-center justify-center relative">
                <span className={`font-black font-display text-6xl sm:text-8xl tabular-nums tracking-tighter leading-none transition-all ${
                  isLeader
                    ? 'text-amber-400 text-shadow-glow'
                    : isHighScorer
                      ? 'text-emerald-400'
                      : isLightMode
                        ? 'text-slate-900'
                        : 'text-white'
                }`}>
                  {group.score}
                </span>

                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[11px] uppercase font-bold text-slate-400 tracking-widest">
                    ĐIỂM SỐ
                  </span>
                  {isHighScorer && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded font-bold">
                      ⭐ ĐIỂM CAO
                    </span>
                  )}
                </div>

                {/* Dedicated Congratulate / Fireworks button for this specific group */}
                <button
                  onClick={(e) => handleCongratulateGroup(group, e)}
                  className={`mt-3 px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all transform hover:scale-105 active:scale-95 cursor-pointer shadow-sm ${
                    isLeader
                      ? 'bg-amber-400 text-amber-950 hover:bg-amber-300'
                      : isLightMode
                        ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                        : 'bg-slate-800 hover:bg-indigo-950 text-indigo-300 border border-slate-700 hover:border-indigo-500'
                  }`}
                  title={`Bắn pháo hoa chúc mừng ${group.name}`}
                >
                  <PartyPopper className="w-3.5 h-3.5" />
                  <span>Chúc mừng 🎉</span>
                </button>
              </div>

              {/* Action Buttons: +1 / -1 and Bonus */}
              <div className="p-3 sm:p-4 bg-slate-500/5 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
                {/* Main +1 / -1 buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => updateScore(group.id, -1)}
                    className="py-3 px-2 rounded-2xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-black font-display text-2xl flex items-center justify-center gap-1 shadow-md shadow-rose-600/30 transition-all cursor-pointer"
                    title="Trừ 1 điểm"
                  >
                    <Minus className="w-6 h-6 stroke-[3]" />
                    <span>1</span>
                  </button>

                  <button
                    onClick={() => updateScore(group.id, 1)}
                    className="py-3 px-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black font-display text-2xl flex items-center justify-center gap-1 shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
                    title="Cộng 1 điểm"
                  >
                    <Plus className="w-6 h-6 stroke-[3]" />
                    <span>1</span>
                  </button>
                </div>

                {/* Quick Bonus +2 / +5 buttons (triggers celebrations for big jumps!) */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => updateScore(group.id, 2)}
                    className="py-1.5 px-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 font-bold text-xs sm:text-sm active:scale-95 transition-all"
                  >
                    +2 điểm
                  </button>
                  <button
                    onClick={() => {
                      updateScore(group.id, 5);
                      // Extra confetti sparkle for +5 big score answer
                      launchGrandFireworks(0.5);
                    }}
                    className="py-1.5 px-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 font-bold text-xs sm:text-sm active:scale-95 transition-all"
                  >
                    +5 điểm ⭐
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Award Ceremony Celebration Modal with Cascading Fireworks */}
      {showCeremony && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className={`w-full max-w-xl rounded-3xl border-4 border-amber-400 p-8 sm:p-10 text-center shadow-2xl relative animate-in zoom-in-95 duration-200 ${
            isLightMode ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'
          }`}>
            <div className="w-24 h-24 mx-auto rounded-full bg-amber-400/20 text-amber-400 flex items-center justify-center mb-4 ring-8 ring-amber-400/30 animate-pulse">
              <Trophy className="w-14 h-14" />
            </div>

            <span className="text-sm font-bold uppercase tracking-widest text-amber-400 block mb-1">
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
