import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import * as XLSX from 'xlsx';
import {
  Trophy,
  RotateCcw,
  Plus,
  Minus,
  Award,
  Sparkles,
  Edit2,
  Check,
  PartyPopper,
  Flame,
  Undo2,
  Crown,
  Users2,
  GraduationCap,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Search,
  ArrowUpDown,
  FileSpreadsheet,
} from 'lucide-react';
import { GroupScore, ClassMonthlyStudentScores } from '../types';
import { soundManager } from '../services/sound';
import {
  getCurrentMonthKey,
  shiftMonthKey,
  formatMonthLabel,
} from '../services/classroomStateStorage';

interface ScoreboardTabProps {
  isLightMode: boolean;
  isActive?: boolean;
  activeClassName?: string;
  students: string[];
  absentStudents?: string[];
  groups: GroupScore[];
  onUpdateGroups: (next: GroupScore[], recordUndo?: boolean) => void;
  canUndoGroups: boolean;
  onUndoGroups: () => void;
  onChangeGroupCount: (count: number) => void;
  monthlyScores: ClassMonthlyStudentScores;
  selectedMonth: string;
  onSelectMonth: (monthKey: string) => void;
  onUpdateStudentScore: (studentName: string, delta: number, monthKey?: string) => void;
  onResetMonthScores: (monthKey: string) => void;
  canUndoStudentScore: boolean;
  onUndoStudentScore: () => void;
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
  students,
  absentStudents = [],
  groups,
  onUpdateGroups,
  canUndoGroups,
  onUndoGroups,
  onChangeGroupCount,
  monthlyScores,
  selectedMonth,
  onSelectMonth,
  onUpdateStudentScore,
  onResetMonthScores,
  canUndoStudentScore,
  onUndoStudentScore,
}) => {
  const [scoreMode, setScoreMode] = useState<'students' | 'groups'>('students');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [showCeremony, setShowCeremony] = useState<boolean>(false);

  // Student mode UI states
  const [studentQuery, setStudentQuery] = useState<string>('');
  const [studentSort, setStudentSort] = useState<'stt' | 'score'>('stt');

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

  // Ctrl+Z shortcut for Undo depending on active sub-mode
  useEffect(() => {
    if (!isActive) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (scoreMode === 'students' && canUndoStudentScore) {
          e.preventDefault();
          onUndoStudentScore();
        } else if (scoreMode === 'groups' && canUndoGroups) {
          e.preventDefault();
          onUndoGroups();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, scoreMode, canUndoGroups, canUndoStudentScore, onUndoGroups, onUndoStudentScore]);

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

  // --- GROUP SCORE HANDLERS ---
  const updateGroupScore = (id: number, delta: number) => {
    const targetGroup = groups.find((g) => g.id === id);
    if (!targetGroup) return;

    const oldScore = targetGroup.score;
    const newScore = Math.max(0, oldScore + delta);

    if (delta > 0) soundManager.playPointAdd();
    else soundManager.playPointSub();

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

  const handleCongratulateEntity = (name: string, score: number, e?: React.MouseEvent) => {
    let xRatio = 0.5;
    if (e) {
      xRatio = Math.max(0.15, Math.min(0.85, e.clientX / window.innerWidth));
    }
    launchGrandFireworks(xRatio);
    triggerCelebrationBanner(
      name,
      score,
      score > 0
        ? `ĐẠT ${score} ĐIỂM · CHÚC MỪNG HOÀN THÀNH XUẤT SẮC!`
        : `CHÚC MỪNG PHẦN THỂ HIỆN TUYỆT VỜI!`
    );
  };

  const handleResetGroupScores = () => {
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

  // --- STUDENT MONTHLY SCORE HANDLERS ---
  const currentMonthMap = monthlyScores[selectedMonth] || {};
  const currentRealMonth = getCurrentMonthKey();

  const handleModifyStudentScore = (studentName: string, delta: number, e?: React.MouseEvent) => {
    const oldScore = currentMonthMap[studentName] || 0;
    const newScore = Math.max(0, oldScore + delta);

    if (delta > 0) soundManager.playPointAdd();
    else soundManager.playPointSub();

    onUpdateStudentScore(studentName, delta, selectedMonth);

    if (delta > 0 && newScore > oldScore) {
      const milestones = [5, 10, 15, 20, 25, 30, 40, 50];
      const hit = milestones.find((m) => oldScore < m && newScore >= m);
      if (hit) {
        let xRatio = 0.5;
        if (e) xRatio = Math.max(0.15, Math.min(0.85, e.clientX / window.innerWidth));
        launchGrandFireworks(xRatio);
        triggerCelebrationBanner(
          studentName,
          newScore,
          `CHẠM MỐC ${hit} ĐIỂM TÍCH LŨY ${formatMonthLabel(selectedMonth).toUpperCase()}!`
        );
      }
    }
  };

  const handleResetCurrentMonth = () => {
    if (
      window.confirm(
        `Thầy/Cô có chắc chắn muốn đặt lại toàn bộ điểm cá nhân ${formatMonthLabel(selectedMonth)} của ${activeClassName || 'lớp này'} về 0? (Điểm các tháng khác vẫn được giữ nguyên)`
      )
    ) {
      onResetMonthScores(selectedMonth);
      setShowCeremony(false);
      setCelebrationBanner(null);
    }
  };

  // Compute student rows & rankings for selectedMonth
  const studentRows = students.map((name, idx) => ({
    stt: idx + 1,
    name,
    score: currentMonthMap[name] || 0,
    isAbsent: absentStudents.includes(name),
  }));

  const maxStudentScore =
    studentRows.length > 0 ? Math.max(...studentRows.map((s) => s.score)) : 0;
  const studentsSortedByScore = [...studentRows].sort(
    (a, b) => b.score - a.score || a.stt - b.stt
  );
  const topStudents = studentRows.filter(
    (s) => s.score === maxStudentScore && maxStudentScore > 0
  );
  const totalMonthPoints = studentRows.reduce((sum, s) => sum + s.score, 0);
  const scoredStudentsCount = studentRows.filter((s) => s.score > 0).length;

  // Assign dense rank by unique positive score
  const uniquePositiveScores = Array.from(
    new Set(studentRows.map((s) => s.score).filter((sc) => sc > 0))
  ).sort((a, b) => b - a);

  const getStudentRank = (score: number): number | null => {
    if (score <= 0) return null;
    return uniquePositiveScores.indexOf(score) + 1;
  };

  const normalizedQuery = studentQuery.trim().toLowerCase();
  const visibleStudents = (
    studentSort === 'score' ? studentsSortedByScore : studentRows
  ).filter((item) => {
    if (!normalizedQuery) return true;
    return (
      item.name.toLowerCase().includes(normalizedQuery) ||
      String(item.stt) === normalizedQuery
    );
  });

  // Recorded months list for quick month pills
  const recordedMonths = Array.from(
    new Set([
      currentRealMonth,
      selectedMonth,
      ...Object.keys(monthlyScores).filter((mKey) =>
        Object.values(monthlyScores[mKey] || {}).some((v) => v > 0)
      ),
    ])
  ).sort();

  // Export Monthly & All-Months Summary Excel (.xlsx)
  const handleExportMonthlyExcel = () => {
    const wb = XLSX.utils.book_new();
    const classLabel = activeClassName || 'Lop';

    // Sheet 1: Current Selected Month
    const monthSheetRows: (string | number)[][] = [
      [`BẢNG ĐIỂM TÍCH LŨY CÁ NHÂN - ${classLabel.toUpperCase()} (${formatMonthLabel(selectedMonth)})`],
      [],
      ['STT', 'Họ và tên học sinh', `Điểm ${formatMonthLabel(selectedMonth)}`, 'Xếp hạng tháng'],
      ...studentRows.map((s) => {
        const r = getStudentRank(s.score);
        return [s.stt, s.name, s.score, r ? `Hạng ${r}` : '-'];
      }),
    ];
    const wsMonth = XLSX.utils.aoa_to_sheet(monthSheetRows);
    wsMonth['!cols'] = [{ wch: 8 }, { wch: 28 }, { wch: 22 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(wb, wsMonth, `Thang_${selectedMonth}`);

    // Sheet 2: All recorded months summary across the school year
    const allMonthsSorted = Array.from(
      new Set([selectedMonth, ...Object.keys(monthlyScores)])
    ).sort();
    const summaryHeader = [
      'STT',
      'Họ và tên học sinh',
      ...allMonthsSorted.map((m) => formatMonthLabel(m)),
      'Tổng điểm tích lũy',
    ];
    const summaryData = students.map((name, idx) => {
      const perMonth = allMonthsSorted.map((m) => (monthlyScores[m] || {})[name] || 0);
      const total = perMonth.reduce((a, b) => a + b, 0);
      return [idx + 1, name, ...perMonth, total];
    });
    const wsSummary = XLSX.utils.aoa_to_sheet([summaryHeader, ...summaryData]);
    wsSummary['!cols'] = [
      { wch: 8 },
      { wch: 28 },
      ...allMonthsSorted.map(() => ({ wch: 18 })),
      { wch: 20 },
    ];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Tong_Hop_Cac_Thang');

    const safeClass = classLabel.replace(/\s+/g, '_');
    XLSX.writeFile(wb, `Bang_Diem_Ca_Nhan_${safeClass}_${selectedMonth}.xlsx`);
  };

  // Group stats
  const maxGroupScore = groups.length > 0 ? Math.max(...groups.map((g) => g.score)) : 0;
  const sortedGroupsByScore = [...groups].sort((a, b) => b.score - a.score);
  const topGroups = groups.filter((g) => g.score === maxGroupScore && maxGroupScore > 0);

  const handleOpenCeremony = () => {
    setShowCeremony(true);
    launchContinuousCelebration();
  };

  const ceremonyHasWinner =
    scoreMode === 'students' ? maxStudentScore > 0 : maxGroupScore > 0;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col gap-5 relative">
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
                  <div className="flex items-center gap-2 flex-wrap">
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

      {/* Mode Switcher Bar: Individual Students (Monthly) vs Groups */}
      <div
        className={`p-2 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
          isLightMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/90 border-slate-800'
        }`}
      >
        <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-500/10 flex-1 sm:flex-initial">
          <button
            onClick={() => setScoreMode('students')}
            className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl font-display font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              scoreMode === 'students'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md scale-[1.01]'
                : isLightMode
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-300 hover:text-white'
            }`}
          >
            <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>ĐIỂM CÁ NHÂN HỌC SINH (THEO THÁNG)</span>
          </button>

          <button
            onClick={() => setScoreMode('groups')}
            className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl font-display font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              scoreMode === 'groups'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md scale-[1.01]'
                : isLightMode
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-300 hover:text-white'
            }`}
          >
            <Users2 className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>ĐIỂM NHÓM / TỔ ({groups.length} NHÓM)</span>
          </button>
        </div>

        {/* Month Selector right on the switcher bar when in student mode */}
        {scoreMode === 'students' && (
          <div className="flex items-center flex-wrap gap-2">
            <div
              className={`flex items-center gap-1 p-1 rounded-xl border ${
                isLightMode ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-950 border-slate-700'
              }`}
            >
              <button
                onClick={() => onSelectMonth(shiftMonthKey(selectedMonth, -1))}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isLightMode ? 'hover:bg-emerald-100 text-emerald-800' : 'hover:bg-slate-800 text-slate-300'
                }`}
                title="Xem điểm tháng trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1.5 px-2">
                <Calendar className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="font-display font-black text-xs sm:text-sm text-emerald-500">
                  {formatMonthLabel(selectedMonth)}
                </span>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => e.target.value && onSelectMonth(e.target.value)}
                  aria-label="Chọn tháng lưu điểm"
                  className={`text-xs font-bold rounded px-1.5 py-0.5 outline-none cursor-pointer border ${
                    isLightMode
                      ? 'bg-white border-emerald-200 text-slate-700'
                      : 'bg-slate-800 border-slate-700 text-slate-200'
                  }`}
                />
              </div>

              <button
                onClick={() => onSelectMonth(shiftMonthKey(selectedMonth, 1))}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isLightMode ? 'hover:bg-emerald-100 text-emerald-800' : 'hover:bg-slate-800 text-slate-300'
                }`}
                title="Chuyển sang tháng tiếp theo"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {selectedMonth !== currentRealMonth && (
              <button
                onClick={() => onSelectMonth(currentRealMonth)}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer"
              >
                Về tháng hiện tại
              </button>
            )}
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* MODE 1: INDIVIDUAL STUDENT MONTHLY SCOREBOARD                         */}
      {/* ===================================================================== */}
      {scoreMode === 'students' ? (
        <>
          {/* Student Monthly Control & Summary Deck */}
          <div
            className={`p-4 sm:p-5 rounded-3xl border flex flex-col gap-4 ${
              isLightMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/90 border-slate-800'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black font-display tracking-tight flex items-center gap-2 flex-wrap">
                    <span>
                      BẢNG ĐIỂM HỌC SINH · {activeClassName || 'LỚP HIỆN TẠI'} ·{' '}
                      <span className="text-emerald-500">{formatMonthLabel(selectedMonth)}</span>
                    </span>
                  </h3>
                  <div className="flex items-center flex-wrap gap-3 text-xs font-bold mt-1">
                    <span className={isLightMode ? 'text-slate-600' : 'text-slate-400'}>
                      Đã có điểm:{' '}
                      <strong className="text-emerald-500">
                        {scoredStudentsCount}/{students.length} HS
                      </strong>
                    </span>
                    <span className="opacity-40">•</span>
                    <span className={isLightMode ? 'text-slate-600' : 'text-slate-400'}>
                      Tổng điểm phát ra tháng này:{' '}
                      <strong className="text-indigo-500">{totalMonthPoints} điểm</strong>
                    </span>
                    {topStudents.length > 0 && (
                      <>
                        <span className="opacity-40">•</span>
                        <span className="text-amber-500 flex items-center gap-1">
                          <Crown className="w-3.5 h-3.5 fill-amber-400" />
                          <span>
                            Dẫn đầu: {topStudents.slice(0, 2).map((s) => s.name).join(', ')} (
                            {maxStudentScore}đ)
                          </span>
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center flex-wrap gap-2">
                <button
                  onClick={onUndoStudentScore}
                  disabled={!canUndoStudentScore}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                    canUndoStudentScore
                      ? isLightMode
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 cursor-pointer'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 cursor-pointer'
                      : 'opacity-40 cursor-not-allowed border-slate-700/40 text-slate-500'
                  }`}
                  title="Hoàn tác cộng/trừ điểm cá nhân vừa rồi (Ctrl+Z)"
                >
                  <Undo2 className="w-4 h-4" />
                  <span>Hoàn tác</span>
                </button>

                <button
                  onClick={handleExportMonthlyExcel}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1.5 shadow cursor-pointer active:scale-95 transition-all"
                  title="Xuất file Excel điểm tháng này kèm Sheet tổng hợp tất cả các tháng"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Xuất Excel tháng</span>
                </button>

                <button
                  onClick={handleResetCurrentMonth}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-colors cursor-pointer ${
                    isLightMode
                      ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                      : 'bg-rose-950/60 hover:bg-rose-900 text-rose-300 border-rose-800'
                  }`}
                  title="Đặt lại điểm của riêng tháng đang chọn về 0"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Đặt lại tháng</span>
                </button>

                <button
                  onClick={handleOpenCeremony}
                  disabled={!ceremonyHasWinner}
                  className={`px-4 py-2 rounded-2xl font-black font-display text-xs sm:text-sm flex items-center gap-1.5 shadow-lg transition-transform active:scale-95 ${
                    ceremonyHasWinner
                      ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 shadow-amber-500/30 cursor-pointer'
                      : 'opacity-50 cursor-not-allowed bg-slate-800 text-slate-500'
                  }`}
                >
                  <Award className="w-4 h-4 fill-current" />
                  <span>VINH DANH THÁNG 🥇</span>
                </button>
              </div>
            </div>

            {/* Search, Sort & Recorded Month Pills */}
            <div
              className={`pt-3 border-t flex flex-wrap items-center justify-between gap-3 ${
                isLightMode ? 'border-slate-200' : 'border-slate-800'
              }`}
            >
              <div className="flex items-center flex-wrap gap-2 flex-1 min-w-[240px]">
                <div className="relative flex-1 max-w-xs">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={studentQuery}
                    onChange={(e) => setStudentQuery(e.target.value)}
                    placeholder="Tìm nhanh tên hoặc số thứ tự..."
                    className={`w-full pl-9 pr-3 py-1.5 rounded-xl border text-xs sm:text-sm font-medium outline-none ${
                      isLightMode
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500'
                        : 'bg-slate-950 border-slate-700 text-white focus:border-emerald-400'
                    }`}
                  />
                </div>

                <button
                  onClick={() => setStudentSort(studentSort === 'stt' ? 'score' : 'stt')}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                    studentSort === 'score'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                      : isLightMode
                        ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                        : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                  }`}
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  <span>
                    {studentSort === 'score' ? 'Đang xếp: Điểm cao → thấp' : 'Đang xếp: Số thứ tự (A–Z)'}
                  </span>
                </button>
              </div>

              {/* Quick pills for months that have recorded data */}
              {recordedMonths.length > 1 && (
                <div className="flex items-center flex-wrap gap-1.5 text-xs">
                  <span className="text-slate-400 font-bold">Tháng đã lưu:</span>
                  {recordedMonths.map((mKey) => (
                    <button
                      key={mKey}
                      onClick={() => onSelectMonth(mKey)}
                      className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-all ${
                        mKey === selectedMonth
                          ? 'bg-emerald-600 text-white shadow'
                          : isLightMode
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      T.{mKey.split('-')[1]}/{mKey.slice(2, 4)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Student Score Cards Grid */}
          {students.length === 0 ? (
            <div
              className={`p-10 rounded-3xl border text-center ${
                isLightMode ? 'bg-white border-slate-200 text-slate-600' : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              Lớp này chưa có danh sách tên học sinh. Thầy/Cô hãy mở mục <strong>Quản lý lớp</strong> trên thanh tiêu đề để nhập danh sách tên nhé!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
              {visibleStudents.map((st) => {
                const rank = getStudentRank(st.score);
                const isTop1 = rank === 1;

                return (
                  <div
                    key={`${st.stt}_${st.name}`}
                    className={`rounded-2xl border-2 p-3.5 flex flex-col justify-between gap-3 transition-all ${
                      isTop1
                        ? isLightMode
                          ? 'bg-amber-50/70 border-amber-400 ring-2 ring-amber-300/60 shadow-lg'
                          : 'bg-gradient-to-b from-amber-500/15 via-slate-900 to-slate-900 border-amber-400 ring-2 ring-amber-400/30 shadow-xl'
                        : isLightMode
                          ? 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                          : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 shadow-md'
                    } ${st.isAbsent ? 'opacity-60' : ''}`}
                  >
                    {/* Top Row: STT + Name + Rank */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center shrink-0 tabular-nums ${
                            isTop1
                              ? 'bg-amber-400 text-slate-950'
                              : isLightMode
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-slate-800 text-indigo-300 border border-slate-700'
                          }`}
                        >
                          {st.stt}
                        </span>
                        <div className="min-w-0">
                          <h4 className="font-display font-black text-sm sm:text-base leading-snug truncate">
                            {st.name}
                          </h4>
                          {st.isAbsent && (
                            <span className="text-[10px] font-bold text-rose-500">Vắng hôm nay</span>
                          )}
                        </div>
                      </div>

                      {rank !== null && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-black shrink-0 ${
                            rank === 1
                              ? 'bg-amber-400 text-amber-950 shadow'
                              : rank === 2
                                ? 'bg-slate-300 text-slate-900'
                                : rank === 3
                                  ? 'bg-orange-400/30 text-orange-400 border border-orange-400/40'
                                  : isLightMode
                                    ? 'bg-slate-100 text-slate-600'
                                    : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {rank === 1 ? '🥇 #1' : rank === 2 ? '🥈 #2' : rank === 3 ? '🥉 #3' : `#${rank}`}
                        </span>
                      )}
                    </div>

                    {/* Middle Score + Quick Controls */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <div className="flex items-baseline gap-1">
                        <span
                          className={`font-display font-black text-4xl sm:text-5xl tabular-nums leading-none ${
                            isTop1
                              ? 'text-amber-500'
                              : st.score >= 5
                                ? 'text-emerald-500'
                                : st.score > 0
                                  ? 'text-indigo-500'
                                  : isLightMode
                                    ? 'text-slate-400'
                                    : 'text-slate-600'
                          }`}
                        >
                          {st.score}
                        </span>
                        <span className="text-[11px] font-bold text-slate-400">điểm</span>
                      </div>

                      {/* Score Action Buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => handleModifyStudentScore(st.name, -1, e)}
                          disabled={st.score <= 0}
                          className="w-9 h-9 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-30 text-white font-black flex items-center justify-center shadow-xs active:scale-95 transition-all cursor-pointer"
                          title="Trừ 1 điểm"
                        >
                          <Minus className="w-4 h-4 stroke-[3]" />
                        </button>

                        <button
                          onClick={(e) => handleModifyStudentScore(st.name, 1, e)}
                          className="px-3 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-display font-black text-sm flex items-center gap-0.5 shadow-sm shadow-emerald-600/30 active:scale-95 transition-all cursor-pointer"
                          title="Cộng 1 điểm"
                        >
                          <Plus className="w-4 h-4 stroke-[3]" />
                          <span>1</span>
                        </button>

                        <button
                          onClick={(e) => handleModifyStudentScore(st.name, 2, e)}
                          className={`px-2.5 h-9 rounded-xl font-black text-xs active:scale-95 transition-all cursor-pointer ${
                            isLightMode
                              ? 'bg-indigo-100 hover:bg-indigo-200 text-indigo-800'
                              : 'bg-indigo-600/25 hover:bg-indigo-600/40 text-indigo-300'
                          }`}
                          title="Cộng 2 điểm"
                        >
                          +2
                        </button>

                        <button
                          onClick={(e) => handleModifyStudentScore(st.name, 5, e)}
                          className={`px-2.5 h-9 rounded-xl font-black text-xs active:scale-95 transition-all cursor-pointer ${
                            isLightMode
                              ? 'bg-amber-100 hover:bg-amber-200 text-amber-900'
                              : 'bg-amber-500/20 hover:bg-amber-500/35 text-amber-300'
                          }`}
                          title="Thưởng nóng 5 điểm"
                        >
                          +5
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* ===================================================================== */
        /* MODE 2: GROUP / TEAM SCOREBOARD                                       */
        /* ===================================================================== */
        <>
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
                  {maxGroupScore >= 10 && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-500 border border-amber-400/30 flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 fill-amber-400" />
                      Cao nhất: {maxGroupScore} điểm
                    </span>
                  )}
                </h3>
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
              <button
                onClick={onUndoGroups}
                disabled={!canUndoGroups}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 border transition-all ${
                  canUndoGroups
                    ? isLightMode
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 cursor-pointer'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 cursor-pointer'
                    : 'opacity-40 cursor-not-allowed border-slate-700/40 text-slate-500'
                }`}
                title="Hoàn tác thao tác cộng/trừ điểm nhóm vừa rồi (Ctrl+Z)"
              >
                <Undo2 className="w-4 h-4" />
                <span>Hoàn tác</span>
              </button>

              <button
                onClick={() => {
                  launchGrandFireworks(0.5);
                  triggerCelebrationBanner('CẢ LỚP', maxGroupScore, 'TIẾT HỌC SÔI NỔI · BẮN PHÁO HOA ĂN MỪNG!');
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

              <button
                onClick={handleResetGroupScores}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 border transition-colors cursor-pointer ${
                  isLightMode
                    ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                    : 'bg-rose-950/60 hover:bg-rose-900 text-rose-300 border-rose-800'
                }`}
              >
                <RotateCcw className="w-4 h-4" />
                <span>Đặt về 0</span>
              </button>

              <button
                onClick={handleOpenCeremony}
                disabled={maxGroupScore === 0}
                className={`px-4 py-2.5 rounded-2xl font-black font-display text-xs sm:text-sm flex items-center gap-1.5 shadow-lg transition-transform active:scale-95 ${
                  maxGroupScore > 0
                    ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 shadow-amber-500/30 cursor-pointer'
                    : 'opacity-50 cursor-not-allowed bg-slate-800 text-slate-500'
                }`}
              >
                <Award className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                <span>VINH DANH 🥇</span>
              </button>
            </div>
          </div>

          <div
            className={`grid gap-4 sm:gap-5 ${
              groups.length <= 4
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
                : 'grid-cols-2 md:grid-cols-4'
            }`}
          >
            {groups.map((group) => {
              const isTopScorer = group.score === maxGroupScore && maxGroupScore > 0;
              const rank = sortedGroupsByScore.findIndex((g) => g.id === group.id) + 1;
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

                    {maxGroupScore > 0 && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-black shrink-0 ${
                          rank === 1 ? 'bg-amber-400 text-amber-950 shadow' : 'bg-black/30 text-white'
                        }`}
                      >
                        {rank === 1 ? '🥇 #1' : rank === 2 ? '🥈 #2' : rank === 3 ? '🥉 #3' : `#${rank}`}
                      </span>
                    )}
                  </div>

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
                      onClick={(e) => handleCongratulateEntity(group.name, group.score, e)}
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

                  <div
                    className={`p-3 sm:p-4 bg-slate-500/5 border-t flex flex-col gap-2 ${
                      isLightMode ? 'border-slate-200' : 'border-slate-800'
                    }`}
                  >
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => updateGroupScore(group.id, -1)}
                        className="py-3 px-2 rounded-2xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-black font-display text-2xl flex items-center justify-center gap-1 shadow-md shadow-rose-600/30 transition-all cursor-pointer"
                      >
                        <Minus className="w-6 h-6 stroke-[3]" />
                        <span>1</span>
                      </button>

                      <button
                        onClick={() => updateGroupScore(group.id, 1)}
                        className="py-3 px-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black font-display text-2xl flex items-center justify-center gap-1 shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
                      >
                        <Plus className="w-6 h-6 stroke-[3]" />
                        <span>1</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => updateGroupScore(group.id, 2)}
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
                          updateGroupScore(group.id, 5);
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
        </>
      )}

      {/* Award Ceremony Celebration Modal (Works for BOTH Top Students of Month & Top Groups!) */}
      {showCeremony && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div
            className={`w-full max-w-2xl rounded-3xl border-4 border-amber-400 p-8 sm:p-10 text-center shadow-2xl relative animate-in zoom-in-95 duration-200 ${
              isLightMode ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'
            }`}
          >
            <div className="w-24 h-24 mx-auto rounded-full bg-amber-400/20 text-amber-500 flex items-center justify-center mb-4 ring-8 ring-amber-400/30 animate-pulse">
              <Trophy className="w-14 h-14" />
            </div>

            <span className="text-sm font-bold uppercase tracking-widest text-amber-500 block mb-1">
              {scoreMode === 'students'
                ? `NGÔI SAO XUẤT SẮC · ${formatMonthLabel(selectedMonth).toUpperCase()}`
                : 'CHÚC MỪNG NHÓM CHIẾN THẮNG XUẤT SẮC!'}
            </span>
            <h2 className="text-3xl sm:text-5xl font-black font-display mb-4 leading-tight">
              {scoreMode === 'students'
                ? topStudents.map((s) => s.name).join(' & ')
                : topGroups.map((g) => g.name).join(' & ')}
            </h2>

            <div className="inline-block px-8 py-3 rounded-2xl bg-amber-400 text-amber-950 font-black text-2xl sm:text-3xl font-display mb-6 shadow-xl">
              ĐẠT {scoreMode === 'students' ? maxStudentScore : maxGroupScore} ĐIỂM DẪN ĐẦU 🥇
            </div>

            {/* Top 3 Leaderboard Podium for Monthly Student Ceremony */}
            {scoreMode === 'students' && studentsSortedByScore.filter((s) => s.score > 0).length > 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-6 text-left">
                {studentsSortedByScore
                  .filter((s) => s.score > 0)
                  .slice(0, 3)
                  .map((s, idx) => (
                    <div
                      key={s.name}
                      className={`p-3 rounded-2xl border flex items-center justify-between gap-2 ${
                        isLightMode
                          ? 'bg-slate-50 border-slate-200'
                          : 'bg-slate-800/80 border-slate-700'
                      }`}
                    >
                      <div className="min-w-0">
                        <span className="text-xs font-black text-amber-500 block">
                          {idx === 0 ? '🥇 Hạng 1' : idx === 1 ? '🥈 Hạng 2' : '🥉 Hạng 3'}
                        </span>
                        <span className="text-sm font-bold truncate block">{s.name}</span>
                      </div>
                      <span className="font-display font-black text-lg text-emerald-500 shrink-0">
                        {s.score}đ
                      </span>
                    </div>
                  ))}
              </div>
            )}

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
