import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
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
  ChevronLeft,
  ChevronRight,
  Search,
  FileSpreadsheet,
  School,
  X,
  TrendingUp,
  Download,
  Medal,
} from 'lucide-react';
import {
  GroupScore,
  ClassMonthlyStudentScores,
  ClassMonthlyGradeDates,
  SavedClass,
} from '../types';
import { soundManager } from '../services/sound';
import {
  classroomStateStorage,
  shiftMonthKey,
  formatMonthLabel,
  calcGradeStats,
} from '../services/classroomStateStorage';

interface ScoreboardTabProps {
  isLightMode: boolean;
  isActive?: boolean;
  activeClassName?: string;
  savedClasses?: SavedClass[];
  students: string[];
  groups: GroupScore[];
  onUpdateGroups: (next: GroupScore[], recordUndo?: boolean) => void;
  canUndoGroups: boolean;
  onUndoGroups: () => void;
  onChangeGroupCount: (count: number) => void;
  monthlyScores: ClassMonthlyStudentScores;
  monthlyGradeDates?: ClassMonthlyGradeDates;
  selectedMonth: string;
  onSelectMonth: (monthKey: string) => void;
  onAddStudentGrade: (studentName: string, grade: number, monthKey?: string) => void;
  onRemoveStudentGrade: (studentName: string, gradeIndex: number, monthKey?: string) => void;
  onResetMonthScores: (monthKey: string) => void;
  canUndoStudentScore: boolean;
  onUndoStudentScore: () => void;
  onNotify?: (msg: string) => void;
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

const QUICK_GRADES = [5, 6, 7, 8, 9, 10];
const INLINE_GRADES = [4, 5, 6, 7, 8, 9, 10];

function formatGradeValue(g: number): string {
  return Number.isInteger(g) ? String(g) : g.toFixed(1).replace(/\.0$/, '');
}

function getGradeChipStyle(grade: number, isLightMode: boolean): string {
  if (grade >= 9) {
    return isLightMode
      ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-rose-100 hover:text-rose-700 hover:border-rose-300'
      : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-rose-950 hover:text-rose-300 hover:border-rose-500/50';
  }
  if (grade >= 7) {
    return isLightMode
      ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-rose-100 hover:text-rose-700 hover:border-rose-300'
      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-rose-950 hover:text-rose-300 hover:border-rose-500/50';
  }
  if (grade >= 5) {
    return isLightMode
      ? 'bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-rose-100 hover:text-rose-700 hover:border-rose-300'
      : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 hover:bg-rose-950 hover:text-rose-300 hover:border-rose-500/50';
  }
  return isLightMode
    ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-200'
    : 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-900';
}

export type StudentBadgeType = 'streak' | 'improved' | null;

function detectStudentBadge(grades: number[]): StudentBadgeType {
  if (grades.length < 2) return null;
  const last = grades[grades.length - 1];
  const prev = grades[grades.length - 2];
  if (last >= 9 && prev >= 9) {
    return 'streak';
  }
  const first = grades[0];
  if (last - first >= 1.5 && last > prev) {
    return 'improved';
  }
  if (last - prev >= 2) {
    return 'improved';
  }
  return null;
}

export const ScoreboardTab: React.FC<ScoreboardTabProps> = ({
  isLightMode,
  isActive = true,
  activeClassName,
  savedClasses = [],
  students,
  groups,
  onUpdateGroups,
  canUndoGroups,
  onUndoGroups,
  onChangeGroupCount,
  monthlyScores,
  monthlyGradeDates = {},
  selectedMonth,
  onSelectMonth,
  onAddStudentGrade,
  onRemoveStudentGrade,
  onResetMonthScores,
  canUndoStudentScore,
  onUndoStudentScore,
  onNotify,
}) => {
  const [scoreMode, setScoreMode] = useState<'students' | 'podium' | 'groups'>('students');
  const [rankingScope, setRankingScope] = useState<'inClass' | 'allClasses'>('inClass');
  const [rankMetric, setRankMetric] = useState<'avg' | 'count'>('avg');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [showCeremony, setShowCeremony] = useState<boolean>(false);
  const [studentQuery, setStudentQuery] = useState<string>('');
  const [quickGradePreset, setQuickGradePreset] = useState<number | null>(null);
  const [activeGradeStudent, setActiveGradeStudent] = useState<string | null>(null);
  const [customGradeInput, setCustomGradeInput] = useState<string>('');

  const [celebrationBanner, setCelebrationBanner] = useState<{
    groupName: string;
    score: string;
    message: string;
  } | null>(null);

  const bannerTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (bannerTimeoutRef.current) window.clearTimeout(bannerTimeoutRef.current);
    };
  }, []);

  // Ctrl+Z Undo shortcut
  useEffect(() => {
    if (!isActive) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if ((scoreMode === 'students' || scoreMode === 'podium') && canUndoStudentScore) {
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
      });
      confetti({
        particleCount: 65,
        angle: 120,
        spread: 60,
        origin: { x: Math.min(0.9, originX + 0.25), y: 0.55 },
        colors: FIREWORK_COLORS,
        startVelocity: 40,
      });
    }, 250);
  };

  const launchContinuousCelebration = () => {
    soundManager.playWinner();
    launchGrandFireworks(0.5);
    setTimeout(() => launchGrandFireworks(0.25), 400);
    setTimeout(() => launchGrandFireworks(0.75), 800);
  };

  const triggerCelebrationBanner = (groupName: string, score: string, message: string) => {
    if (bannerTimeoutRef.current) window.clearTimeout(bannerTimeoutRef.current);
    setCelebrationBanner({ groupName, score, message });
    bannerTimeoutRef.current = window.setTimeout(() => {
      setCelebrationBanner(null);
    }, 3200);
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
      const hitMilestone = [10, 15, 20, 25, 30, 40, 50].find((m) => oldScore < m && newScore >= m);
      if (hitMilestone) {
        launchGrandFireworks(0.5);
        triggerCelebrationBanner(targetGroup.name, `${newScore}đ`, `CHẠM MỐC ${hitMilestone} ĐIỂM!`);
      }
    }
  };

  const handleCongratulateEntity = (name: string, score: number, e?: React.MouseEvent) => {
    let xRatio = 0.5;
    if (e) xRatio = Math.max(0.15, Math.min(0.85, e.clientX / window.innerWidth));
    launchGrandFireworks(xRatio);
    triggerCelebrationBanner(
      name,
      `${score}đ`,
      score > 0 ? `ĐẠT ${score} ĐIỂM · XUẤT SẮC!` : `CHÚC MỪNG PHẦN THỂ HIỆN TỐT!`
    );
  };

  const handleResetGroupScores = () => {
    if (window.confirm(`Đặt lại điểm của tất cả ${groups.length} nhóm về 0?`)) {
      onUpdateGroups(
        groups.map((g) => ({ ...g, score: 0 })),
        true
      );
      setShowCeremony(false);
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

  // --- INDIVIDUAL STUDENT GRADE HANDLERS ---
  const currentMonthMap = monthlyScores[selectedMonth] || {};
  const currentMonthDatesMap = monthlyGradeDates[selectedMonth] || {};

  const handleRecordGrade = (studentName: string, grade: number, e?: React.MouseEvent) => {
    if (!Number.isFinite(grade) || grade < 0 || grade > 10) {
      onNotify?.('Vui lòng nhập điểm từ 0 đến 10 (VD: 7, 8, 8.5, 9, 10)!');
      return;
    }
    const cleanGrade = Math.round(grade * 100) / 100;
    soundManager.playPointAdd();
    onAddStudentGrade(studentName, cleanGrade, selectedMonth);

    if (cleanGrade >= 9) {
      let xRatio = 0.5;
      if (e) xRatio = Math.max(0.15, Math.min(0.85, e.clientX / window.innerWidth));
      launchGrandFireworks(xRatio);
      triggerCelebrationBanner(
        studentName,
        `Điểm ${formatGradeValue(cleanGrade)}`,
        cleanGrade === 10 ? 'ĐIỂM 10 TUYỆT ĐỐI · XUẤT SẮC!' : 'ĐẠT ĐIỂM GIỎI · RẤT ĐÁNG KHEN!'
      );
    } else {
      onNotify?.(`Đã ghi điểm ${formatGradeValue(cleanGrade)} cho ${studentName}!`);
    }
  };

  const handleDeleteGrade = (studentName: string, gradeIndex: number) => {
    soundManager.playPointSub();
    onRemoveStudentGrade(studentName, gradeIndex, selectedMonth);
  };

  const handleResetCurrentMonth = () => {
    if (
      window.confirm(
        `Xóa toàn bộ điểm ${formatMonthLabel(selectedMonth)} của ${activeClassName || 'lớp này'}? (Điểm các tháng khác giữ nguyên)`
      )
    ) {
      onResetMonthScores(selectedMonth);
      setShowCeremony(false);
    }
  };

  const studentRows = students.map((name, idx) => {
    const grades = currentMonthMap[name] || [];
    const dates = currentMonthDatesMap[name] || [];
    const stats = calcGradeStats(grades);
    const badge = detectStudentBadge(grades);
    return {
      stt: idx + 1,
      name,
      grades,
      dates,
      count: stats.count,
      avg: stats.avg,
      sum: stats.sum,
      max: stats.max,
      badge,
    };
  });

  const rankedStudents = [...studentRows]
    .filter((s) => s.count > 0)
    .sort((a, b) => {
      if (rankMetric === 'avg') {
        return b.avg - a.avg || b.count - a.count || b.sum - a.sum || a.stt - b.stt;
      }
      return b.count - a.count || b.avg - a.avg || b.sum - a.sum || a.stt - b.stt;
    });

  const getStudentRank = (studentName: string): number | null => {
    const idx = rankedStudents.findIndex((s) => s.name === studentName);
    if (idx === -1) return null;
    if (idx === 0) return 1;
    const prev = rankedStudents[idx - 1];
    const cur = rankedStudents[idx];
    const isTie =
      rankMetric === 'avg'
        ? prev.avg === cur.avg && prev.count === cur.count
        : prev.count === cur.count && prev.avg === cur.avg;
    if (isTie) {
      return getStudentRank(prev.name);
    }
    return idx + 1;
  };

  const topStudents = rankedStudents.filter((s) => getStudentRank(s.name) === 1);
  const improvedStudents = studentRows.filter((s) => s.badge === 'improved');

  // Class-level summary stats for active class
  const allActiveClassGrades = studentRows.flatMap((s) => s.grades);
  const activeClassStats = calcGradeStats(allActiveClassGrades);

  // Cross-class leaderboard for the selected month ("Đua Top 12 lớp")
  const classLeaderboard = savedClasses
    .map((cls) => {
      const mScores =
        cls.name === activeClassName
          ? currentMonthMap
          : classroomStateStorage.getMonthlyScoresForClass(cls.id)[selectedMonth] || {};
      const allGrades = Object.values(mScores).flat();
      const stats = calcGradeStats(allGrades);
      const activeStudentCount = Object.values(mScores).filter((arr) => arr.length > 0).length;
      return {
        id: cls.id,
        name: cls.name,
        studentCount: cls.students.length || cls.studentCount,
        gradeCount: stats.count,
        avgGrade: stats.avg,
        totalPts: stats.sum,
        activeStudentCount,
      };
    })
    .sort(
      (a, b) =>
        b.avgGrade - a.avgGrade ||
        b.gradeCount - a.gradeCount ||
        a.name.localeCompare(b.name, 'vi', { numeric: true })
    );

  // Parse smart search query: supports plain search ("An" or "12") AND command ("An 9" or "12 8.5")
  const parseQuickCommand = (raw: string): { filterPart: string; gradePart: number | null } => {
    const trimmed = raw.trim();
    const match = trimmed.match(/^(.+?)\s+(\d+(?:[.,]\d+)?)$/);
    if (match) {
      const num = parseFloat(match[2].replace(',', '.'));
      if (Number.isFinite(num) && num >= 0 && num <= 10) {
        return { filterPart: match[1].trim(), gradePart: num };
      }
    }
    return { filterPart: trimmed, gradePart: null };
  };

  const { filterPart, gradePart } = parseQuickCommand(studentQuery);
  const normalizedQuery = filterPart.toLowerCase();

  const visibleStudents = studentRows.filter((item) => {
    if (!normalizedQuery) return true;
    return (
      item.name.toLowerCase().includes(normalizedQuery) ||
      String(item.stt) === normalizedQuery
    );
  });

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    if (visibleStudents.length === 0) return;
    const target = visibleStudents[0];
    if (gradePart !== null) {
      e.preventDefault();
      handleRecordGrade(target.name, gradePart);
      setStudentQuery('');
    } else if (quickGradePreset !== null) {
      e.preventDefault();
      handleRecordGrade(target.name, quickGradePreset);
      setStudentQuery('');
    } else {
      e.preventDefault();
      setActiveGradeStudent(target.name);
    }
  };

  // Lazy-loaded Excel export
  const handleExportMonthlyExcel = async () => {
    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();
    const classLabel = activeClassName || 'Lop';

    const monthSheetRows: (string | number)[][] = [
      [`BẢNG ĐIỂM CÁ NHÂN - ${classLabel.toUpperCase()} (${formatMonthLabel(selectedMonth)})`],
      [],
      [
        'STT',
        'Họ và tên học sinh',
        'Các con điểm trong tháng',
        'Số cột điểm',
        'Điểm trung bình (ĐTB)',
        'Tổng điểm',
        'Xếp hạng lớp',
      ],
      ...studentRows.map((s) => {
        const r = getStudentRank(s.name);
        return [
          s.stt,
          s.name,
          s.grades.map(formatGradeValue).join('; '),
          s.count,
          s.count > 0 ? s.avg : '',
          s.count > 0 ? s.sum : '',
          r ? `Hạng ${r}` : '-',
        ];
      }),
    ];
    const wsMonth = XLSX.utils.aoa_to_sheet(monthSheetRows);
    wsMonth['!cols'] = [
      { wch: 7 },
      { wch: 28 },
      { wch: 26 },
      { wch: 13 },
      { wch: 20 },
      { wch: 13 },
      { wch: 14 },
    ];
    XLSX.utils.book_append_sheet(wb, wsMonth, `Thang_${selectedMonth}`);

    const allMonthsSorted = Array.from(
      new Set([selectedMonth, ...Object.keys(monthlyScores)])
    ).sort();
    const summaryHeader = [
      'STT',
      'Họ và tên học sinh',
      ...allMonthsSorted.map((m) => `${formatMonthLabel(m)} (Điểm / ĐTB)`),
      'Tổng số cột điểm',
      'ĐTB chung cả năm',
    ];
    const summaryData = students.map((name, idx) => {
      const yearGrades: number[] = [];
      const perMonthCells = allMonthsSorted.map((m) => {
        const gList = (monthlyScores[m] || {})[name] || [];
        yearGrades.push(...gList);
        if (gList.length === 0) return '';
        const st = calcGradeStats(gList);
        return `${gList.map(formatGradeValue).join(', ')} (TB: ${st.avg})`;
      });
      const yearStats = calcGradeStats(yearGrades);
      return [
        idx + 1,
        name,
        ...perMonthCells,
        yearStats.count,
        yearStats.count > 0 ? yearStats.avg : '',
      ];
    });
    const wsSummary = XLSX.utils.aoa_to_sheet([summaryHeader, ...summaryData]);
    wsSummary['!cols'] = [
      { wch: 7 },
      { wch: 28 },
      ...allMonthsSorted.map(() => ({ wch: 24 })),
      { wch: 16 },
      { wch: 16 },
    ];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Tong_Hop_Nam');

    XLSX.writeFile(wb, `Bang_Diem_${classLabel.replace(/\s+/g, '_')}_${selectedMonth}.xlsx`);
    onNotify?.('Đã xuất file Excel bảng điểm thành công!');
  };

  // 1-Click Export Honor Board PNG Image for Zalo / Parents Group!
  const handleDownloadHonorBoardPng = () => {
    if (rankedStudents.length === 0) {
      onNotify?.('Chưa có học sinh nào có điểm trong tháng này để xuất Bảng Vàng!');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 1400;
    canvas.height = 920;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Deep celebratory royal gradient background
    const bg = ctx.createLinearGradient(0, 0, 1400, 920);
    bg.addColorStop(0, '#0f172a');
    bg.addColorStop(0.5, '#1e1b4b');
    bg.addColorStop(1, '#064e3b');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1400, 920);

    // Gold decorative border
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 6;
    ctx.strokeRect(24, 24, 1352, 872);

    // Title Banner
    ctx.fillStyle = '#fbbf24';
    ctx.font = '900 44px Lexend, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      `🏆 BẢNG VÀNG VINH DANH · ${(activeClassName || 'LỚP HỌC').toUpperCase()}`,
      700,
      95
    );

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '700 24px Plus Jakarta Sans, sans-serif';
    ctx.fillText(
      `${formatMonthLabel(selectedMonth).toUpperCase()}  ·  ĐTB chung cả lớp: ${activeClassStats.avg.toFixed(1)} (${activeClassStats.count} lượt điểm)`,
      700,
      138
    );

    // Top 3 Podium Cards
    const podiumOrder = [
      { item: rankedStudents[1], label: '🥈 Á QUÂN (#2)', x: 110, y: 205, w: 360, h: 210, accent: '#cbd5e1' },
      { item: rankedStudents[0], label: '🥇 QUÁN QUÂN (#1)', x: 520, y: 175, w: 360, h: 240, accent: '#fbbf24' },
      { item: rankedStudents[2], label: '🥉 HẠNG BA (#3)', x: 930, y: 215, w: 360, h: 200, accent: '#f59e0b' },
    ];

    podiumOrder.forEach((slot) => {
      if (!slot.item) return;
      ctx.save();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = slot.accent;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(slot.x, slot.y, slot.w, slot.h, 24);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = slot.accent;
      ctx.font = '900 20px Lexend, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(slot.label, slot.x + slot.w / 2, slot.y + 42);

      ctx.fillStyle = '#ffffff';
      ctx.font = '800 26px Lexend, sans-serif';
      const nameStr =
        slot.item.name.length > 22 ? slot.item.name.slice(0, 21) + '…' : slot.item.name;
      ctx.fillText(nameStr, slot.x + slot.w / 2, slot.y + 92);

      ctx.fillStyle = '#34d399';
      ctx.font = '900 34px Lexend, sans-serif';
      ctx.fillText(`ĐTB: ${slot.item.avg.toFixed(1)}`, slot.x + slot.w / 2, slot.y + 142);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 17px Plus Jakarta Sans, sans-serif';
      ctx.fillText(
        `Điểm: ${slot.item.grades.map(formatGradeValue).join(', ')} (${slot.item.count} cột)`,
        slot.x + slot.w / 2,
        slot.y + 178
      );
      ctx.restore();
    });

    // Top 4..10 List
    const rest = rankedStudents.slice(3, 11);
    if (rest.length > 0) {
      ctx.fillStyle = '#fde68a';
      ctx.font = '800 22px Lexend, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('🌟 TOP HỌC SINH TÍCH CỰC TIẾP THEO:', 90, 470);

      rest.forEach((st, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const rx = 90 + col * 620;
        const ry = 495 + row * 72;

        ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
        ctx.beginPath();
        ctx.roundRect(rx, ry, 590, 58, 14);
        ctx.fill();

        ctx.fillStyle = '#fbbf24';
        ctx.font = '800 20px Lexend, sans-serif';
        ctx.fillText(`#${idx + 4}`, rx + 20, ry + 36);

        ctx.fillStyle = '#ffffff';
        ctx.font = '700 21px Plus Jakarta Sans, sans-serif';
        ctx.fillText(st.name, rx + 72, ry + 36);

        ctx.fillStyle = '#34d399';
        ctx.font = '800 21px Lexend, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`TB ${st.avg.toFixed(1)} (${st.count} cột)`, rx + 568, ry + 36);
        ctx.textAlign = 'left';
      });
    }

    // Footer credit
    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 16px Plus Jakarta Sans, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      `Trợ lý Lớp học THCS · Xuất ngày ${new Date().toLocaleDateString('vi-VN')}`,
      700,
      868
    );

    const link = document.createElement('a');
    link.download = `Bang_Vang_${(activeClassName || 'Lop').replace(/\s+/g, '_')}_${selectedMonth}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    onNotify?.('Đã tải ảnh Bảng Vàng (.png) để gửi nhóm lớp!');
  };

  // Group stats
  const maxGroupScore = groups.length > 0 ? Math.max(...groups.map((g) => g.score)) : 0;
  const sortedGroupsByScore = [...groups].sort((a, b) => b.score - a.score);
  const topGroups = groups.filter((g) => g.score === maxGroupScore && maxGroupScore > 0);
  const ceremonyHasWinner =
    scoreMode !== 'groups' ? rankedStudents.length > 0 : maxGroupScore > 0;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col gap-4 relative">
      {/* Floating Celebration Banner */}
      {celebrationBanner && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-xl animate-in slide-in-from-top-6 duration-300 pointer-events-none">
          <div className="bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 p-1 rounded-2xl shadow-2xl">
            <div className="px-5 py-3 rounded-[14px] bg-slate-950 flex items-center justify-between gap-3 text-white">
              <div className="flex items-center gap-3">
                <PartyPopper className="w-6 h-6 text-amber-400 shrink-0 animate-bounce" />
                <div>
                  <span className="font-black font-display text-amber-400 uppercase">
                    {celebrationBanner.groupName} · {celebrationBanner.score}
                  </span>
                  <p className="text-xs font-bold text-slate-200">{celebrationBanner.message}</p>
                </div>
              </div>
              <span>🎆</span>
            </div>
          </div>
        </div>
      )}

      {/* Compact Single Top Toolbar */}
      <div
        className={`px-3.5 py-2.5 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
          isLightMode ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/90 border-slate-800'
        }`}
      >
        {/* Left: Mode Toggle (Học sinh | Bảng Vàng | Nhóm) + Month Navigator */}
        <div className="flex items-center flex-wrap gap-2">
          <div
            className={`flex items-center gap-1 p-1 rounded-xl ${
              isLightMode ? 'bg-slate-100' : 'bg-slate-950 border border-slate-800'
            }`}
          >
            <button
              onClick={() => setScoreMode('students')}
              className={`px-3 py-1.5 rounded-lg font-display font-black text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer transition-all ${
                scoreMode === 'students'
                  ? 'bg-emerald-600 text-white shadow'
                  : isLightMode
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-slate-400 hover:text-white'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Học sinh</span>
            </button>

            <button
              onClick={() => {
                setScoreMode('podium');
                if (rankedStudents.length > 0) soundManager.playWinner();
              }}
              className={`px-3 py-1.5 rounded-lg font-display font-black text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer transition-all ${
                scoreMode === 'podium'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : isLightMode
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-amber-400 hover:text-amber-300'
              }`}
              title="Chiếu Bảng Vàng & Bục Vinh Quang Top 1–2–3 toàn màn hình"
            >
              <Medal className="w-4 h-4" />
              <span>Bảng Vàng</span>
            </button>

            <button
              onClick={() => setScoreMode('groups')}
              className={`px-3 py-1.5 rounded-lg font-display font-black text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer transition-all ${
                scoreMode === 'groups'
                  ? 'bg-indigo-600 text-white shadow'
                  : isLightMode
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users2 className="w-4 h-4" />
              <span>Nhóm ({groups.length})</span>
            </button>
          </div>

          {scoreMode !== 'groups' && (
            <div
              className={`flex items-center gap-1 px-1.5 py-1 rounded-xl border ${
                isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
              }`}
            >
              <button
                onClick={() => onSelectMonth(shiftMonthKey(selectedMonth, -1))}
                className="p-1 rounded hover:bg-slate-500/20 cursor-pointer"
                title="Tháng trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => e.target.value && onSelectMonth(e.target.value)}
                aria-label="Chọn tháng"
                className="bg-transparent text-xs sm:text-sm font-display font-black text-emerald-500 outline-none cursor-pointer px-1"
              />
              <button
                onClick={() => onSelectMonth(shiftMonthKey(selectedMonth, 1))}
                className="p-1 rounded hover:bg-slate-500/20 cursor-pointer"
                title="Tháng sau"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {scoreMode === 'students' && (
            <div
              className={`flex items-center gap-1 p-1 rounded-xl border ${
                isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
              }`}
              title="Chọn sẵn 1 mức điểm (5–10) nếu muốn chấm 1 chạm hàng loạt"
            >
              <span className="text-[11px] font-bold text-slate-400 px-1 hidden xl:inline">
                Chấm nhanh:
              </span>
              <button
                type="button"
                onClick={() => setQuickGradePreset(null)}
                className={`px-2 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  quickGradePreset === null
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : isLightMode
                      ? 'text-slate-600 hover:bg-slate-200/70'
                      : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                Từng em
              </button>
              {QUICK_GRADES.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setQuickGradePreset(quickGradePreset === g ? null : g)}
                  className={`px-2 py-1 rounded-lg font-display font-black text-xs cursor-pointer transition-all ${
                    quickGradePreset === g
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : isLightMode
                        ? 'text-slate-600 hover:bg-slate-200/70'
                        : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {g}đ
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Minimalist Actions */}
        {scoreMode !== 'groups' ? (
          <div className="flex items-center flex-wrap gap-2">
            {scoreMode === 'students' && (
              <div className="relative w-48 sm:w-60">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={studentQuery}
                  onChange={(e) => setStudentQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Tìm tên/STT (VD: An 9 ↵)"
                  title="Gõ tên hoặc 'Tên + Điểm' rồi nhấn Enter để chấm nhanh bằng bàn phím (VD: An 9)"
                  className={`w-full pl-8 pr-2.5 py-1.5 rounded-xl border text-xs font-medium outline-none ${
                    isLightMode
                      ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500'
                      : 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500'
                  }`}
                />
              </div>
            )}

            <button
              onClick={onUndoStudentScore}
              disabled={!canUndoStudentScore}
              className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all ${
                canUndoStudentScore
                  ? isLightMode
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700 cursor-pointer'
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200 cursor-pointer'
                  : 'opacity-35 cursor-not-allowed border-transparent text-slate-500'
              }`}
              title="Hoàn tác (Ctrl+Z)"
            >
              <Undo2 className="w-4 h-4" />
            </button>

            <button
              onClick={handleDownloadHonorBoardPng}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                isLightMode
                  ? 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-900'
                  : 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/30 text-amber-300'
              }`}
              title="Tải ảnh Bảng Vàng (.png) để gửi tuyên dương vào nhóm Zalo lớp"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ảnh Bảng Vàng</span>
            </button>

            <button
              onClick={handleExportMonthlyExcel}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                isLightMode
                  ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-800'
                  : 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/30 text-emerald-300'
              }`}
              title="Xuất sổ điểm Excel tháng và tổng hợp năm"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel</span>
            </button>

            <button
              onClick={handleResetCurrentMonth}
              className={`p-2 rounded-xl border text-xs cursor-pointer ${
                isLightMode
                  ? 'hover:bg-rose-50 border-slate-200 text-rose-600'
                  : 'hover:bg-rose-950/60 border-slate-800 text-rose-400'
              }`}
              title="Xóa điểm tháng này để làm mới"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* Group Mode Toolbar Controls */
          <div className="flex items-center flex-wrap gap-2">
            <div className="flex items-center gap-1 text-xs mr-1">
              {[4, 6, 8, 10].map((cnt) => (
                <button
                  key={cnt}
                  onClick={() => onChangeGroupCount(cnt)}
                  className={`px-2 py-1 rounded-lg font-black cursor-pointer ${
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
            </div>
            <button
              onClick={onUndoGroups}
              disabled={!canUndoGroups}
              className={`p-2 rounded-xl border ${
                canUndoGroups ? 'cursor-pointer border-slate-700' : 'opacity-35 cursor-not-allowed border-transparent'
              }`}
              title="Hoàn tác (Ctrl+Z)"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetGroupScores}
              className="p-2 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 cursor-pointer"
              title="Đặt lại điểm nhóm về 0"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setShowCeremony(true);
                launchContinuousCelebration();
              }}
              disabled={!ceremonyHasWinner}
              className={`px-3.5 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 ${
                ceremonyHasWinner
                  ? 'bg-amber-400 text-slate-950 cursor-pointer shadow'
                  : 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-500'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Vinh danh</span>
            </button>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* MODE 1: FULL-SCREEN PROJECTOR PODIUM ("BẢNG VÀNG & BỤC VINH QUANG")   */}
      {/* ===================================================================== */}
      {scoreMode === 'podium' ? (
        <div
          className={`rounded-3xl border-2 p-6 sm:p-8 flex flex-col gap-6 ${
            isLightMode
              ? 'bg-gradient-to-b from-amber-50/70 via-white to-slate-50 border-amber-300 shadow-lg'
              : 'bg-gradient-to-b from-slate-900 via-indigo-950/40 to-slate-900 border-amber-500/40 shadow-2xl'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-amber-500 block">
                BẢNG VÀNG THI ĐUA CÁ NHÂN · {formatMonthLabel(selectedMonth).toUpperCase()}
              </span>
              <h2 className="text-2xl sm:text-4xl font-black font-display">
                {(activeClassName || 'LỚP HIỆN TẠI').toUpperCase()}
              </h2>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={launchContinuousCelebration}
                className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer shadow"
              >
                <Sparkles className="w-4 h-4 fill-current" />
                <span>Bắn pháo hoa chúc mừng 🎆</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadHonorBoardPng}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer shadow"
              >
                <Download className="w-4 h-4" />
                <span>Tải ảnh gửi nhóm lớp</span>
              </button>
            </div>
          </div>

          {rankedStudents.length === 0 ? (
            <div className="py-14 text-center text-slate-400">
              Chưa có học sinh nào có điểm trong {formatMonthLabel(selectedMonth)}. Hãy chuyển sang thẻ{' '}
              <button
                type="button"
                onClick={() => setScoreMode('students')}
                className="text-emerald-500 font-bold underline cursor-pointer"
              >
                Học sinh
              </button>{' '}
              để chấm điểm!
            </div>
          ) : (
            <>
              {/* Podium Top 1 - 2 - 3 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-2">
                {/* #2 Silver */}
                {rankedStudents[1] ? (
                  <div
                    className={`order-2 md:order-1 rounded-3xl border-2 p-5 text-center flex flex-col items-center gap-1.5 ${
                      isLightMode
                        ? 'bg-slate-50 border-slate-300 shadow'
                        : 'bg-slate-800/80 border-slate-500/50 shadow-xl'
                    }`}
                  >
                    <span className="text-4xl">🥈</span>
                    <span className="text-xs font-black uppercase text-slate-400">Hạng Nhì</span>
                    <h3 className="text-xl sm:text-2xl font-black font-display">
                      {rankedStudents[1].name}
                    </h3>
                    <span className="px-3.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-500 font-display font-black text-lg">
                      ĐTB {rankedStudents[1].avg.toFixed(1)}
                    </span>
                    <span className="text-xs text-slate-400">
                      Điểm: {rankedStudents[1].grades.map(formatGradeValue).join(', ')} ({rankedStudents[1].count} cột)
                    </span>
                  </div>
                ) : (
                  <div className="hidden md:block order-1" />
                )}

                {/* #1 Gold Champion */}
                {rankedStudents[0] && (
                  <div
                    className={`order-1 md:order-2 rounded-3xl border-4 border-amber-400 p-6 sm:p-7 text-center flex flex-col items-center gap-2 ring-4 ring-amber-400/25 shadow-2xl md:-translate-y-2 ${
                      isLightMode
                        ? 'bg-gradient-to-b from-amber-50 to-white'
                        : 'bg-gradient-to-b from-amber-500/20 via-slate-900 to-slate-900'
                    }`}
                  >
                    <span className="text-5xl animate-bounce">🥇</span>
                    <span className="px-3 py-0.5 rounded-full bg-amber-400 text-slate-950 text-xs font-black uppercase">
                      Quán Quân Dẫn Đầu
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-black font-display">
                      {rankedStudents[0].name}
                    </h3>
                    <span className="px-4 py-1.5 rounded-2xl bg-amber-400 text-slate-950 font-display font-black text-xl sm:text-2xl shadow">
                      ĐTB {rankedStudents[0].avg.toFixed(1)}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">
                      Điểm: {rankedStudents[0].grades.map(formatGradeValue).join(', ')} ({rankedStudents[0].count} cột)
                    </span>
                  </div>
                )}

                {/* #3 Bronze */}
                {rankedStudents[2] ? (
                  <div
                    className={`order-3 rounded-3xl border-2 p-5 text-center flex flex-col items-center gap-1.5 ${
                      isLightMode
                        ? 'bg-orange-50/60 border-orange-300 shadow'
                        : 'bg-orange-950/30 border-orange-500/40 shadow-xl'
                    }`}
                  >
                    <span className="text-4xl">🥉</span>
                    <span className="text-xs font-black uppercase text-orange-400">Hạng Ba</span>
                    <h3 className="text-xl sm:text-2xl font-black font-display">
                      {rankedStudents[2].name}
                    </h3>
                    <span className="px-3.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-500 font-display font-black text-lg">
                      ĐTB {rankedStudents[2].avg.toFixed(1)}
                    </span>
                    <span className="text-xs text-slate-400">
                      Điểm: {rankedStudents[2].grades.map(formatGradeValue).join(', ')} ({rankedStudents[2].count} cột)
                    </span>
                  </div>
                ) : (
                  <div className="hidden md:block order-3" />
                )}
              </div>

              {/* "Tiến bộ vượt bậc" Encouragement Spotlight */}
              {improvedStudents.length > 0 && (
                <div
                  className={`p-4 rounded-2xl border flex flex-wrap items-center gap-2 ${
                    isLightMode
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                      : 'bg-emerald-950/30 border-emerald-700/50 text-emerald-200'
                  }`}
                >
                  <span className="text-xs font-black uppercase flex items-center gap-1.5 text-emerald-500 mr-1">
                    <TrendingUp className="w-4 h-4" />
                    <span>Gương mặt Tiến bộ vượt bậc:</span>
                  </span>
                  {improvedStudents.map((st) => (
                    <span
                      key={st.name}
                      className={`px-3 py-1 rounded-xl text-xs font-bold border ${
                        isLightMode
                          ? 'bg-white border-emerald-300 text-emerald-900'
                          : 'bg-slate-900 border-emerald-600/40 text-emerald-300'
                      }`}
                    >
                      🚀 {st.name} ({st.grades.map(formatGradeValue).join(' → ')})
                    </span>
                  ))}
                </div>
              )}

              {/* Full Ranked Bar List */}
              {rankedStudents.length > 3 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {rankedStudents.slice(3, 15).map((st) => {
                    const r = getStudentRank(st.name) || 4;
                    return (
                      <div
                        key={st.name}
                        className={`px-4 py-2.5 rounded-2xl border flex items-center justify-between gap-3 ${
                          isLightMode
                            ? 'bg-white border-slate-200'
                            : 'bg-slate-900/80 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 font-display font-black text-xs flex items-center justify-center shrink-0">
                            #{r}
                          </span>
                          <div className="min-w-0">
                            <span className="font-bold text-sm truncate block">{st.name}</span>
                            <span className="text-[11px] text-slate-400">
                              Điểm: {st.grades.map(formatGradeValue).join(', ')}
                            </span>
                          </div>
                        </div>
                        <span className="font-display font-black text-emerald-500 shrink-0">
                          TB {st.avg.toFixed(1)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      ) : scoreMode === 'students' ? (
        /* ===================================================================== */
        /* MODE 2: MINIMALIST STUDENT GRADEBOOK + CLASS LEADERBOARD              */
        /* ===================================================================== */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* LEFT / SIDEBAR: CLASS LEADERBOARD */}
          <div
            className={`lg:col-span-4 rounded-2xl border p-4 flex flex-col gap-3 lg:sticky lg:top-4 ${
              isLightMode ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/90 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500 shrink-0" />
                <h3 className="font-display font-black text-sm sm:text-base uppercase tracking-tight">
                  BẢNG XẾP HẠNG · T.{selectedMonth.split('-')[1]}
                </h3>
              </div>

              {rankingScope === 'inClass' && rankedStudents.length > 0 && (
                <button
                  onClick={() => setScoreMode('podium')}
                  className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[11px] flex items-center gap-1 cursor-pointer"
                  title="Phóng to Bục Vinh Quang toàn màn chiếu"
                >
                  <Sparkles className="w-3 h-3 fill-current" />
                  <span>Bục Vinh Quang</span>
                </button>
              )}
            </div>

            {/* Scope Toggle: In Class vs Across 12 Classes */}
            <div
              className={`grid grid-cols-2 gap-1 p-1 rounded-xl text-xs font-bold ${
                isLightMode ? 'bg-slate-100' : 'bg-slate-950 border border-slate-800'
              }`}
            >
              <button
                onClick={() => setRankingScope('inClass')}
                className={`py-1.5 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all ${
                  rankingScope === 'inClass'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                    : isLightMode
                      ? 'text-slate-600 hover:text-slate-900'
                      : 'text-slate-400 hover:text-white'
                }`}
              >
                <Crown className="w-3.5 h-3.5" />
                <span className="truncate">{activeClassName || 'Trong lớp'}</span>
              </button>
              <button
                onClick={() => setRankingScope('allClasses')}
                className={`py-1.5 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all ${
                  rankingScope === 'allClasses'
                    ? 'bg-indigo-600 text-white font-black shadow-xs'
                    : isLightMode
                      ? 'text-slate-600 hover:text-slate-900'
                      : 'text-slate-400 hover:text-white'
                }`}
              >
                <School className="w-3.5 h-3.5" />
                <span>Đua Top 12 lớp</span>
              </button>
            </div>

            {rankingScope === 'inClass' && (
              <div className="flex items-center justify-between text-[11px] px-1">
                <span className="text-slate-400 font-semibold">
                  Đã chấm: <strong className="text-emerald-500">{activeClassStats.count}</strong> cột
                  {activeClassStats.count > 0 && ` · ĐTB lớp: ${activeClassStats.avg.toFixed(1)}`}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setRankMetric('avg')}
                    className={`px-1.5 py-0.5 rounded font-bold cursor-pointer ${
                      rankMetric === 'avg'
                        ? 'bg-emerald-500/20 text-emerald-500'
                        : 'text-slate-400 hover:text-slate-300'
                    }`}
                    title="Xếp hạng theo Điểm trung bình cao nhất"
                  >
                    ĐTB
                  </button>
                  <button
                    type="button"
                    onClick={() => setRankMetric('count')}
                    className={`px-1.5 py-0.5 rounded font-bold cursor-pointer ${
                      rankMetric === 'count'
                        ? 'bg-emerald-500/20 text-emerald-500'
                        : 'text-slate-400 hover:text-slate-300'
                    }`}
                    title="Xếp hạng theo mức độ Tích cực phát biểu (nhiều cột điểm nhất)"
                  >
                    Tích cực
                  </button>
                </div>
              </div>
            )}

            {/* Leaderboard Body */}
            {rankingScope === 'inClass' ? (
              rankedStudents.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Chưa có điểm trong {formatMonthLabel(selectedMonth)}.<br />
                  Bấm <strong>+ Điểm</strong> cạnh tên học sinh để nhập điểm (VD: 7, 8, 9)!
                </div>
              ) : (
                <div className="flex flex-col gap-1.5 max-h-[60vh] overflow-y-auto pr-1">
                  {rankedStudents.map((st) => {
                    const rank = getStudentRank(st.name) || 1;
                    return (
                      <div
                        key={st.name}
                        className={`px-3 py-2 rounded-xl flex items-center justify-between gap-2 text-xs sm:text-sm ${
                          rank === 1
                            ? isLightMode
                              ? 'bg-amber-50 border border-amber-300 text-amber-950 font-black'
                              : 'bg-amber-500/15 border border-amber-500/40 text-amber-200 font-black'
                            : rank <= 3
                              ? isLightMode
                                ? 'bg-slate-50 border border-slate-200 font-bold'
                                : 'bg-slate-800/80 border border-slate-700 font-bold'
                              : isLightMode
                                ? 'hover:bg-slate-50 text-slate-700 font-semibold'
                                : 'hover:bg-slate-800/40 text-slate-300 font-semibold'
                        }`}
                      >
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="w-6 text-center shrink-0 font-display font-black">
                              {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                            </span>
                            <span className="truncate">{st.name}</span>
                            {st.badge === 'streak' && (
                              <span title="Phong độ xuất sắc (liên tiếp đạt 9–10)">🔥</span>
                            )}
                            {st.badge === 'improved' && (
                              <span title="Tiến bộ vượt bậc">🚀</span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-normal pl-7 truncate">
                            Điểm: {st.grades.map(formatGradeValue).join(', ')} ({st.count} cột)
                          </span>
                        </div>

                        <div className="text-right shrink-0">
                          <span
                            className={`font-display font-black tabular-nums block ${
                              rank === 1 ? 'text-amber-500 text-base' : 'text-emerald-500'
                            }`}
                          >
                            {rankMetric === 'avg'
                              ? `TB ${st.avg.toFixed(1)}`
                              : `${st.count} cột`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              /* Ranking Across 12 Classes with Visual Progress Bar */
              <div className="flex flex-col gap-1.5 max-h-[62vh] overflow-y-auto pr-1">
                {classLeaderboard.map((cls, idx) => {
                  const isCurrent = cls.name === activeClassName;
                  const pct = Math.min(100, Math.round((cls.avgGrade / 10) * 100));
                  return (
                    <div
                      key={cls.id}
                      className={`px-3 py-2 rounded-xl flex flex-col gap-1 text-xs sm:text-sm ${
                        isCurrent
                          ? isLightMode
                            ? 'bg-indigo-50 border border-indigo-300 text-indigo-950 font-black'
                            : 'bg-indigo-500/20 border border-indigo-500/40 text-indigo-200 font-black'
                          : isLightMode
                            ? 'bg-slate-50/70 text-slate-700 font-semibold'
                            : 'bg-slate-800/40 text-slate-300 font-semibold'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-6 text-center shrink-0 font-display font-black">
                            {idx === 0 && cls.gradeCount > 0
                              ? '🥇'
                              : idx === 1 && cls.gradeCount > 0
                                ? '🥈'
                                : idx === 2 && cls.gradeCount > 0
                                  ? '🥉'
                                  : `#${idx + 1}`}
                          </span>
                          <span className="truncate">{cls.name}</span>
                          <span className="text-[11px] text-slate-400 font-normal">
                            ({cls.gradeCount} cột)
                          </span>
                        </div>
                        <span className="font-display font-black tabular-nums text-emerald-500 shrink-0">
                          {cls.gradeCount > 0 ? `TB ${cls.avgGrade.toFixed(1)}` : '—'}
                        </span>
                      </div>
                      {cls.gradeCount > 0 && (
                        <div className="w-full h-1.5 rounded-full bg-slate-500/20 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT: STUDENT GRADE LIST — INDIVIDUAL GRADES + STATS RIGHT BESIDE NAME */}
          <div className="lg:col-span-8">
            {students.length === 0 ? (
              <div
                className={`p-8 rounded-2xl border text-center text-sm ${
                  isLightMode
                    ? 'bg-white border-slate-200 text-slate-600'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                Chưa có danh sách học sinh cho lớp này.
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {gradePart !== null && visibleStudents.length > 0 && (
                  <div className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-between">
                    <span>
                      Nhấn <strong>Enter ↵</strong> để ghi ngay điểm <strong>{gradePart}</strong> cho{' '}
                      <strong>{visibleStudents[0].name}</strong>
                    </span>
                  </div>
                )}

                {visibleStudents.map((st) => {
                  const rank = getStudentRank(st.name);
                  const isExpanded = activeGradeStudent === st.name;

                  return (
                    <div
                      key={`${st.stt}_${st.name}`}
                      className={`px-3 py-2 rounded-xl border flex flex-col gap-2 transition-colors ${
                        isExpanded
                          ? isLightMode
                            ? 'bg-indigo-50/70 border-indigo-400 shadow-sm'
                            : 'bg-indigo-950/30 border-indigo-500 shadow-md'
                          : rank === 1
                            ? isLightMode
                              ? 'bg-amber-50/60 border-amber-300'
                              : 'bg-amber-950/20 border-amber-500/50'
                            : isLightMode
                              ? 'bg-white border-slate-200 hover:border-slate-300'
                              : 'bg-slate-900/85 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        {/* Left + Middle: STT + Name + Individual Grade Chips right beside Name */}
                        <div className="flex items-center flex-wrap gap-2 min-w-0 flex-1">
                          <span
                            className={`w-6 h-6 rounded-md text-[11px] font-black flex items-center justify-center shrink-0 tabular-nums ${
                              isLightMode ? 'bg-slate-100 text-slate-600' : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {st.stt}
                          </span>

                          <span className="font-bold text-xs sm:text-sm shrink-0">{st.name}</span>

                          {st.badge === 'streak' && (
                            <span className="text-xs" title="Phong độ xuất sắc (liên tiếp điểm 9–10)">
                              🔥
                            </span>
                          )}
                          {st.badge === 'improved' && (
                            <span className="text-xs" title="Tiến bộ vượt bậc so với đầu tháng">
                              🚀
                            </span>
                          )}

                          {/* Individual Grade Badges (7, 8, 9...) right next to student name */}
                          {st.grades.length > 0 && (
                            <div className="flex items-center flex-wrap gap-1 ml-0.5">
                              {st.grades.map((g, gIdx) => {
                                const dateStr = st.dates[gIdx];
                                return (
                                  <button
                                    key={`${st.name}_g_${gIdx}`}
                                    type="button"
                                    onClick={() => handleDeleteGrade(st.name, gIdx)}
                                    className={`group px-2 py-0.5 rounded-md border font-display font-black text-xs tabular-nums flex items-center gap-0.5 transition-all cursor-pointer ${getGradeChipStyle(
                                      g,
                                      isLightMode
                                    )}`}
                                    title={`Điểm lần ${gIdx + 1}: ${formatGradeValue(g)}${
                                      dateStr ? ` (ngày ${dateStr})` : ''
                                    } — Bấm để xóa con điểm này`}
                                  >
                                    <span>{formatGradeValue(g)}</span>
                                    <X className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity -mr-0.5" />
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Right: Summary Stats beside grades + Add Grade button */}
                        <div className="flex items-center gap-2 shrink-0 ml-auto">
                          {st.count > 0 && (
                            <div
                              className={`px-2 py-1 rounded-lg text-[11px] sm:text-xs font-bold tabular-nums flex items-center gap-1.5 ${
                                isLightMode
                                  ? 'bg-slate-100 text-slate-700'
                                  : 'bg-slate-800/90 text-slate-300'
                              }`}
                              title={`Đã có ${st.count} con điểm · Tổng: ${st.sum} · Điểm trung bình: ${st.avg.toFixed(1)}`}
                            >
                              <span className="text-slate-400">{st.count} cột</span>
                              <span>·</span>
                              <span
                                className={`font-display font-black ${
                                  st.avg >= 8
                                    ? 'text-emerald-500'
                                    : st.avg >= 6.5
                                      ? 'text-indigo-400'
                                      : 'text-amber-500'
                                }`}
                              >
                                TB {st.avg.toFixed(1)}
                              </span>
                            </div>
                          )}

                          {quickGradePreset !== null ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={(e) => handleRecordGrade(st.name, quickGradePreset, e)}
                                className="px-2.5 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-display font-black text-xs flex items-center gap-1 shadow-xs active:scale-95 transition-all cursor-pointer"
                                title={`Ghi ngay điểm ${quickGradePreset} cho ${st.name}`}
                              >
                                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                                <span>{quickGradePreset}đ</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveGradeStudent(isExpanded ? null : st.name);
                                  setCustomGradeInput('');
                                }}
                                className={`px-1.5 h-7 rounded-lg border text-[11px] font-bold cursor-pointer ${
                                  isLightMode
                                    ? 'border-slate-200 hover:bg-slate-100 text-slate-600'
                                    : 'border-slate-700 hover:bg-slate-800 text-slate-300'
                                }`}
                                title="Mở bảng chọn điểm khác / điểm lẻ"
                              >
                                •••
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveGradeStudent(isExpanded ? null : st.name);
                                setCustomGradeInput('');
                              }}
                              className={`px-2.5 h-7 rounded-lg font-display font-black text-xs flex items-center gap-1 transition-all cursor-pointer active:scale-95 ${
                                isExpanded
                                  ? 'bg-slate-700 text-white'
                                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                              }`}
                            >
                              {isExpanded ? (
                                <span>Đóng</span>
                              ) : (
                                <>
                                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                                  <span>Điểm</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Inline Quick Grade Picker */}
                      {isExpanded && (
                        <div
                          className={`pt-2 border-t flex flex-wrap items-center justify-between gap-2 text-xs animate-in fade-in duration-150 ${
                            isLightMode ? 'border-indigo-200' : 'border-slate-800'
                          }`}
                        >
                          <div className="flex items-center flex-wrap gap-1">
                            <span className="text-[11px] font-bold text-slate-400 mr-1">
                              Chọn điểm:
                            </span>
                            {INLINE_GRADES.map((g) => (
                              <button
                                key={g}
                                type="button"
                                onClick={(e) => handleRecordGrade(st.name, g, e)}
                                className={`w-8 h-7 rounded-lg font-display font-black text-xs cursor-pointer transition-transform active:scale-90 ${
                                  g >= 9
                                    ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-xs'
                                    : g >= 7
                                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                      : isLightMode
                                        ? 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                                }`}
                                title={`Thêm điểm ${g} cho ${st.name}`}
                              >
                                {g}
                              </button>
                            ))}
                          </div>

                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              const normalized = customGradeInput.trim().replace(',', '.');
                              if (!normalized) return;
                              const parsed = parseFloat(normalized);
                              if (!isNaN(parsed)) {
                                handleRecordGrade(st.name, parsed);
                                setCustomGradeInput('');
                              }
                            }}
                            className="flex items-center gap-1"
                          >
                            <input
                              type="text"
                              inputMode="decimal"
                              value={customGradeInput}
                              onChange={(e) => setCustomGradeInput(e.target.value)}
                              placeholder="Điểm lẻ (8.5)"
                              className={`w-24 px-2 py-1 rounded-lg border text-center font-bold text-xs outline-none ${
                                isLightMode
                                  ? 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500'
                                  : 'bg-slate-950 border-slate-700 text-white focus:border-indigo-500'
                              }`}
                            />
                            <button
                              type="submit"
                              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer"
                            >
                              Ghi
                            </button>
                          </form>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ===================================================================== */
        /* MODE 3: GROUP / TEAM SCOREBOARD                                       */
        /* ===================================================================== */
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
                        <Flame className="w-3 h-3 inline" /> CAO
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
      )}

      {/* Group Ceremony Modal */}
      {showCeremony && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div
            className={`w-full max-w-xl rounded-3xl border-4 border-amber-400 p-8 text-center shadow-2xl animate-in zoom-in-95 duration-200 ${
              isLightMode ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'
            }`}
          >
            <div className="w-20 h-20 mx-auto rounded-full bg-amber-400/20 text-amber-500 flex items-center justify-center mb-4 ring-8 ring-amber-400/30">
              <Trophy className="w-11 h-11" />
            </div>

            <span className="text-xs font-black uppercase tracking-widest text-amber-500 block mb-1">
              NHÓM DẪN ĐẦU XUẤT SẮC
            </span>
            <h2 className="text-3xl sm:text-4xl font-black font-display mb-4">
              {topGroups.map((g) => g.name).join(' & ')}
            </h2>

            <div className="inline-block px-6 py-2.5 rounded-2xl bg-amber-400 text-amber-950 font-black text-xl sm:text-2xl font-display mb-6 shadow-lg">
              {maxGroupScore} ĐIỂM 🥇
            </div>

            <div className="flex justify-center gap-3">
              <button
                onClick={launchContinuousCelebration}
                className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 fill-current" />
                <span>Pháo hoa 🎆</span>
              </button>
              <button
                onClick={() => setShowCeremony(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-sm cursor-pointer"
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
