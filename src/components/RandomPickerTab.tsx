import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import confetti from 'canvas-confetti';
import {
  RotateCcw,
  Shuffle,
  Sparkles,
  CheckCircle2,
  FileText,
  Hash,
  Edit3,
  X,
  Check,
  Trash2,
  CheckSquare,
  Square,
  CheckCheck,
  RefreshCw,
  AlertCircle,
  Trophy,
  Maximize2,
  Minimize2,
  ArrowUpDown,
  HelpCircle,
  Timer,
  Plus,
  GraduationCap,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Target,
} from 'lucide-react';
import { soundManager } from '../services/sound';
import { SavedClass, GroupScore, GroupItem } from '../types';
import { sortVietnameseStudentNames } from '../services/classStorage';
import {
  classroomStateStorage,
  QuestionBankState,
  QuestionSetKey,
  QUESTION_SET_LABELS,
  detectQuestionSetForClassName,
  parseQuestionWithAnswer,
  calcGradeStats,
} from '../services/classroomStateStorage';
import { QuestionBankModal } from './QuestionBankModal';

const SpinningWheelGame = lazy(() =>
  import('./SpinningWheelGame').then((m) => ({ default: m.SpinningWheelGame }))
);
const MysteryBoxGame = lazy(() =>
  import('./MysteryBoxGame').then((m) => ({ default: m.MysteryBoxGame }))
);
const DuckRaceGame = lazy(() =>
  import('./DuckRaceGame').then((m) => ({ default: m.DuckRaceGame }))
);
const MarbleDropGame = lazy(() =>
  import('./MarbleDropGame').then((m) => ({ default: m.MarbleDropGame }))
);
const CarRaceGame = lazy(() =>
  import('./CarRaceGame').then((m) => ({ default: m.CarRaceGame }))
);

export type PickerGameType = 'digital' | 'wheelSpin' | 'mysteryBox' | 'duck' | 'marble' | 'car';
export type PriorityPoolFilter = 'all' | 'ungraded' | 'under2';

interface RandomPickerTabProps {
  studentCount: number;
  isLightMode: boolean;
  isActive?: boolean;
  customList: string[];
  setCustomList: (list: string[]) => void;
  activeClass: SavedClass | null;
  scoreGroups?: GroupScore[];
  splitGroups?: GroupItem[];
  onQuickAwardScore?: (groupId: number, delta: number) => void;
  selectedMonthLabel?: string;
  currentMonthStudentScores?: Record<string, number[]>;
  onQuickAwardStudentScore?: (studentName: string, grade: number) => void;
  onReplaceLastStudentScore?: (studentName: string, newGrade: number) => void;
  onStartQuickTimer?: (seconds: number) => void;
  onQuestionBankChanged?: () => void;
  onOpenClassManager: () => void;
  onSaveToActiveClass: (students: string[]) => void;
}

const PRESET_STUDENT_NAMES = [
  'Nguyễn Văn An',
  'Trần Thị Bình',
  'Lê Văn Cường',
  'Phạm Thị Dung',
  'Hoàng Văn Em',
  'Đỗ Thị Hoa',
  'Vũ Đình Khang',
  'Bùi Thị Linh',
  'Đặng Minh Long',
  'Ngô Phương Mai',
  'Dương Quốc Nam',
  'Lý Thu Nga',
  'Mai Tuấn Phong',
  'Đinh Hải Quân',
  'Trịnh Như Quỳnh',
  'Hồ Thanh Sơn',
];

const PRESET_QUESTIONS = [
  'Câu 1: Nêu khái niệm và vai trò của quang hợp ở thực vật? | Tổng hợp chất hữu cơ, giải phóng khí O2',
  'Câu 2: Phát biểu định luật Ôm và viết hệ thức? | I = U / R',
  'Câu 3: Phân tích nguyên nhân dẫn đến cuộc Cách mạng tháng Tám 1945?',
  'Câu 4: Nêu các biện pháp bảo vệ nguồn nước ngọt tại địa phương?',
];

const GAME_OPTIONS: { id: PickerGameType; icon: string; label: string; activeBg: string }[] = [
  { id: 'wheelSpin', icon: '🎡', label: 'Vòng quay', activeBg: 'bg-amber-500 text-slate-950' },
  { id: 'mysteryBox', icon: '🎁', label: 'Hộp quà', activeBg: 'bg-pink-600 text-white' },
  { id: 'digital', icon: '🎰', label: 'Nhảy số', activeBg: 'bg-indigo-600 text-white' },
  { id: 'duck', icon: '🦆', label: 'Đua vịt', activeBg: 'bg-orange-500 text-slate-950' },
  { id: 'marble', icon: '🔮', label: 'Plinko', activeBg: 'bg-purple-600 text-white' },
  { id: 'car', icon: '🏎️', label: 'Đua F1', activeBg: 'bg-red-600 text-white' },
];

export const RandomPickerTab: React.FC<RandomPickerTabProps> = ({
  studentCount,
  isLightMode,
  isActive = true,
  customList,
  setCustomList,
  activeClass,
  scoreGroups = [],
  splitGroups = [],
  onQuickAwardScore,
  selectedMonthLabel = 'Tháng này',
  currentMonthStudentScores = {},
  onQuickAwardStudentScore,
  onReplaceLastStudentScore,
  onStartQuickTimer,
  onQuestionBankChanged,
  onOpenClassManager,
  onSaveToActiveClass,
}) => {
  const classKey = activeClass?.id || 'default_class';

  const [pickerMode, setPickerMode] = useState<'numbers' | 'customList'>(() =>
    customList.length > 0 ? 'customList' : 'numbers'
  );
  const [pickerGameType, setPickerGameType] = useState<PickerGameType>('wheelSpin');
  const [priorityFilter, setPriorityFilter] = useState<PriorityPoolFilter>('all');
  const [isRosterExpanded, setIsRosterExpanded] = useState<boolean>(false);

  // State for Numbers mode
  const [pickedNumbers, setPickedNumbers] = useState<number[]>(
    () => classroomStateStorage.getPickedForClass(classKey).numbers
  );
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>(() =>
    Array.from({ length: studentCount }, (_, i) => i + 1)
  );
  const [currentDisplayNumber, setCurrentDisplayNumber] = useState<number | null>(null);

  // State for Custom List mode
  const [pickedCustomItems, setPickedCustomItems] = useState<string[]>(
    () => classroomStateStorage.getPickedForClass(classKey).items
  );
  const [selectedCustomItems, setSelectedCustomItems] = useState<string[]>(() => [...customList]);
  const [currentDisplayItem, setCurrentDisplayItem] = useState<string | null>(null);
  const [latestPickedItems, setLatestPickedItems] = useState<string[]>([]);

  // Question Bank + Answer Reveal state
  const [questionBank, setQuestionBank] = useState<QuestionBankState>(() =>
    classroomStateStorage.getQuestionBank()
  );
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState<boolean>(false);
  const [currentPickedQuestion, setCurrentPickedQuestion] = useState<string | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState<boolean>(false);

  // Anti-mistake grading state for the current pick turn:
  // Maps studentName -> the grade awarded in THIS turn (null/undefined if not graded yet this turn)
  const [turnGradedByStudent, setTurnGradedByStudent] = useState<Record<string, number>>({});
  const [decimalGradeInputs, setDecimalGradeInputs] = useState<Record<string, string>>({});
  const [awardedFeedback, setAwardedFeedback] = useState<string | null>(null);

  // Resolve which QuestionSetKey applies to current class
  const resolveEffectiveQuestionSet = (bank: QuestionBankState): QuestionSetKey => {
    if (bank.autoMatchGrade) {
      const matched = detectQuestionSetForClassName(activeClass?.name);
      if (matched !== 'chung' && (bank.sets[matched] || []).length > 0) {
        return matched;
      }
    }
    if ((bank.sets[bank.activeSet] || []).length > 0) {
      return bank.activeSet;
    }
    return 'chung';
  };

  const activeQuestionSetKey = resolveEffectiveQuestionSet(questionBank);
  const activeQuestionsList = questionBank.sets[activeQuestionSetKey] || [];

  const handleUpdateQuestionBank = (next: QuestionBankState) => {
    setQuestionBank(next);
    classroomStateStorage.saveQuestionBank(next);
    if (!next.enabled) {
      setCurrentPickedQuestion(null);
      setIsAnswerRevealed(false);
    }
    onQuestionBankChanged?.();
  };

  const drawNextQuestion = (): string | null => {
    setIsAnswerRevealed(false);
    if (!questionBank.enabled) return null;
    const setKey = resolveEffectiveQuestionSet(questionBank);
    const allQs = questionBank.sets[setKey] || [];
    if (allQs.length === 0) return null;

    const askedInSet = questionBank.askedBySet[setKey] || [];
    const pool = questionBank.avoidRepeat
      ? allQs.filter((q) => !askedInSet.includes(q))
      : allQs;
    const effectivePool = pool.length > 0 ? pool : allQs;
    const chosenQ = effectivePool[Math.floor(Math.random() * effectivePool.length)];
    const nextAsked = pool.length > 0 ? [...askedInSet, chosenQ] : [chosenQ];

    const nextState: QuestionBankState = {
      ...questionBank,
      askedBySet: {
        ...questionBank.askedBySet,
        [setKey]: questionBank.avoidRepeat ? nextAsked : askedInSet,
      },
    };
    setQuestionBank(nextState);
    classroomStateStorage.saveQuestionBank(nextState);
    setCurrentPickedQuestion(chosenQ);
    return chosenQ;
  };

  const resetTurnGrading = () => {
    setTurnGradedByStudent({});
    setDecimalGradeInputs({});
  };

  const findStudentGroupId = (studentNameOrNum: string | number): number | null => {
    for (const g of splitGroups) {
      if (g.members.includes(studentNameOrNum)) return g.id;
      if (typeof studentNameOrNum === 'number' && customList[studentNameOrNum - 1]) {
        if (g.members.includes(customList[studentNameOrNum - 1])) return g.id;
      }
    }
    return null;
  };

  const triggerQuickScore = (groupId: number, groupName: string, delta: number) => {
    onQuickAwardScore?.(groupId, delta);
    soundManager.playPointAdd();
    setAwardedFeedback(`Đã +${delta} điểm cho ${groupName}!`);
    window.setTimeout(() => setAwardedFeedback(null), 2200);
  };

  // Smart Grade Handler: updates grade in-place if already graded in THIS pick turn; otherwise appends!
  const handleSmartStudentGrade = (
    studentName: string,
    rawGrade: number,
    forceNewColumn = false
  ) => {
    if (!Number.isFinite(rawGrade) || rawGrade < 0 || rawGrade > 10) return;
    const cleanGrade = Math.round(rawGrade * 100) / 100;
    const alreadyGradedThisTurn =
      !forceNewColumn && turnGradedByStudent[studentName] !== undefined;

    if (alreadyGradedThisTurn && onReplaceLastStudentScore) {
      onReplaceLastStudentScore(studentName, cleanGrade);
      soundManager.playPointAdd();
      setTurnGradedByStudent((prev) => ({ ...prev, [studentName]: cleanGrade }));
      setAwardedFeedback(`Đã sửa thành điểm ${cleanGrade} cho ${studentName}!`);
    } else {
      onQuickAwardStudentScore?.(studentName, cleanGrade);
      soundManager.playPointAdd();
      setTurnGradedByStudent((prev) => ({ ...prev, [studentName]: cleanGrade }));
      setAwardedFeedback(`Đã ghi điểm ${cleanGrade} (${selectedMonthLabel}) cho ${studentName}!`);
    }

    if (cleanGrade >= 9) {
      fireConfetti();
    }
    window.setTimeout(() => setAwardedFeedback(null), 2500);
  };

  // Start a fresh extra column for the same student if desired
  const allowExtraColumnThisTurn = (studentName: string) => {
    setTurnGradedByStudent((prev) => {
      const next = { ...prev };
      delete next[studentName];
      return next;
    });
    setAwardedFeedback(`Sẵn sàng thêm cột điểm mới cho ${studentName}!`);
    window.setTimeout(() => setAwardedFeedback(null), 1800);
  };

  // Modal for editing custom list
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorText, setEditorText] = useState(customList.join('\n'));

  // Shared roll states
  const [isRolling, setIsRolling] = useState(false);
  const [batchCount, setBatchCount] = useState<1 | 2>(1);
  const [latestPicksNumbers, setLatestPicksNumbers] = useState<number[]>([]);
  const rollIntervalRef = useRef<number | null>(null);

  // Fullscreen Theater Mode State
  const [isGameFullscreen, setIsGameFullscreen] = useState(false);

  const toggleGameFullscreen = () => {
    if (!isGameFullscreen) {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
      setIsGameFullscreen(true);
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      setIsGameFullscreen(false);
    }
  };

  interface WinnerNotificationData {
    gameModeName: string;
    icon: string;
    winners: {
      id: string | number;
      number?: number;
      studentName: string;
    }[];
  }
  const [winnerNotification, setWinnerNotification] = useState<WinnerNotificationData | null>(null);

  const handleWinnersFromMiniGame = (winnerIds: (string | number)[]) => {
    resetTurnGrading();
    let resolvedWinners: { id: string | number; number?: number; studentName: string }[] = [];

    if (pickerMode === 'numbers') {
      const nums = winnerIds.map(Number);
      const mainWinner = nums[0];
      setCurrentDisplayNumber(mainWinner);
      setLatestPicksNumbers(nums);
      setPickedNumbers((prev) => {
        const next = [...prev];
        nums.forEach((n) => {
          if (!next.includes(n)) next.push(n);
        });
        return next;
      });

      resolvedWinners = nums.map((n) => ({
        id: n,
        number: n,
        studentName: customList[n - 1] || `Học sinh số ${n}`,
      }));
    } else {
      const items = winnerIds.map(String);
      const mainWinner = items[0];
      setCurrentDisplayItem(mainWinner);
      setLatestPickedItems(items);
      setPickedCustomItems((prev) => {
        const next = [...prev];
        items.forEach((item) => {
          if (!next.includes(item)) next.push(item);
        });
        return next;
      });

      resolvedWinners = items.map((item, idx) => {
        const foundIdx = customList.findIndex((c) => c.toLowerCase() === item.toLowerCase());
        return {
          id: item,
          number: foundIdx !== -1 ? foundIdx + 1 : idx + 1,
          studentName: item,
        };
      });
    }

    const gameMeta = GAME_OPTIONS.find((g) => g.id === pickerGameType);
    setWinnerNotification({
      gameModeName: gameMeta ? gameMeta.label : 'Chọn ngẫu nhiên',
      icon: gameMeta ? gameMeta.icon : '🎉',
      winners: resolvedWinners,
    });
    drawNextQuestion();
  };

  useEffect(() => {
    setQuestionBank(classroomStateStorage.getQuestionBank());
  }, [customList, activeClass?.id]);

  useEffect(() => {
    const saved = classroomStateStorage.getPickedForClass(classKey);
    setPickedNumbers(saved.numbers);
    setPickedCustomItems(saved.items);
    setCurrentDisplayNumber(null);
    setCurrentDisplayItem(null);
    setLatestPicksNumbers([]);
    setLatestPickedItems([]);
    setCurrentPickedQuestion(null);
    setIsAnswerRevealed(false);
    setPriorityFilter('all');
    resetTurnGrading();
    if (customList.length > 0) {
      setPickerMode('customList');
    }
  }, [classKey]);

  useEffect(() => {
    classroomStateStorage.savePickedForClass(classKey, {
      numbers: pickedNumbers,
      items: pickedCustomItems,
    });
  }, [classKey, pickedNumbers, pickedCustomItems]);

  useEffect(() => {
    setSelectedCustomItems([...customList]);
  }, [customList]);

  useEffect(() => {
    setSelectedNumbers(Array.from({ length: studentCount }, (_, i) => i + 1));
  }, [studentCount, customList]);

  // Priority Filter helper: checks if a student matches 'all' | 'ungraded' | 'under2'
  const matchesPriorityFilter = (studentName: string | undefined): boolean => {
    if (priorityFilter === 'all' || !studentName) return true;
    const cnt = (currentMonthStudentScores[studentName] || []).length;
    if (priorityFilter === 'ungraded') return cnt === 0;
    if (priorityFilter === 'under2') return cnt < 2;
    return true;
  };

  const ungradedCount = customList.filter(
    (name) => (currentMonthStudentScores[name] || []).length === 0
  ).length;
  const under2Count = customList.filter(
    (name) => (currentMonthStudentScores[name] || []).length < 2
  ).length;

  // Numbers mode pools
  const allNumbers = Array.from({ length: studentCount }, (_, i) => i + 1);
  const activeNumbers = allNumbers.filter(
    (n) => selectedNumbers.includes(n) && matchesPriorityFilter(customList[n - 1])
  );
  const remainingNumbers = activeNumbers.filter((n) => !pickedNumbers.includes(n));
  const isAllNumbersPicked = activeNumbers.length > 0 && remainingNumbers.length === 0;

  // Custom list pools
  const activeCustomItems = customList.filter(
    (item) => selectedCustomItems.includes(item) && matchesPriorityFilter(item)
  );
  const remainingCustomItems = activeCustomItems.filter(
    (item) => !pickedCustomItems.includes(item)
  );
  const isAllCustomPicked = activeCustomItems.length > 0 && remainingCustomItems.length === 0;

  useEffect(() => {
    return () => {
      if (rollIntervalRef.current) window.clearTimeout(rollIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    setEditorText(customList.join('\n'));
  }, [customList]);

  // Keyboard shortcuts for Digital Roll, Fullscreen, and Closing Winner Modal
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleGameFullscreen();
        return;
      }
      if ((e.key === 'Escape' || e.key === 'PageUp') && winnerNotification) {
        e.preventDefault();
        setWinnerNotification(null);
        return;
      }
      if (e.key === 'Escape' && isGameFullscreen) {
        e.preventDefault();
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        setIsGameFullscreen(false);
        return;
      }
      if (
        (e.code === 'Space' || e.key === 'PageDown') &&
        !isRolling &&
        !winnerNotification &&
        pickerGameType === 'digital'
      ) {
        if (pickerMode === 'numbers' && !isAllNumbersPicked && remainingNumbers.length > 0) {
          e.preventDefault();
          handleRollNumbers();
        } else if (
          pickerMode === 'customList' &&
          !isAllCustomPicked &&
          remainingCustomItems.length > 0
        ) {
          e.preventDefault();
          handleRollCustom();
        }
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsGameFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [
    isActive,
    isRolling,
    pickerMode,
    pickerGameType,
    winnerNotification,
    isAllNumbersPicked,
    isAllCustomPicked,
    remainingNumbers,
    remainingCustomItems,
    batchCount,
    isGameFullscreen,
  ]);

  const fireConfetti = () => {
    try {
      confetti({
        particleCount: 90,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4'],
      });
    } catch {
      // Fallback
    }
  };

  const handleToggleCustomItem = (item: string) => {
    if (selectedCustomItems.includes(item)) {
      setSelectedCustomItems((prev) => prev.filter((i) => i !== item));
    } else {
      setSelectedCustomItems((prev) => [...prev, item]);
    }
  };

  const handleToggleNumber = (num: number) => {
    if (selectedNumbers.includes(num)) {
      setSelectedNumbers((prev) => prev.filter((n) => n !== num));
    } else {
      setSelectedNumbers((prev) => [...prev, num].sort((a, b) => a - b));
    }
  };

  const handleRollNumbers = () => {
    if (isRolling || remainingNumbers.length === 0) return;
    resetTurnGrading();
    setIsRolling(true);

    const actualBatch = Math.min(batchCount, remainingNumbers.length);
    const shuffled = [...remainingNumbers].sort(() => Math.random() - 0.5);
    const chosen = shuffled.slice(0, actualBatch);

    let ticks = 0;
    const maxTicks = 20;
    let currentSpeed = 55;

    const doTick = () => {
      ticks++;
      const randomPreview =
        remainingNumbers[Math.floor(Math.random() * remainingNumbers.length)];
      setCurrentDisplayNumber(randomPreview);
      soundManager.playWheelTick(0.8 + (ticks / maxTicks) * 0.6);

      if (ticks < maxTicks) {
        currentSpeed = Math.floor(55 + Math.pow(ticks / maxTicks, 2) * 150);
        rollIntervalRef.current = window.setTimeout(doTick, currentSpeed);
      } else {
        setCurrentDisplayNumber(chosen[0]);
        setLatestPicksNumbers(chosen);
        setPickedNumbers((prev) => [...prev, ...chosen]);
        setIsRolling(false);
        soundManager.playWinner();
        fireConfetti();
        drawNextQuestion();
      }
    };

    rollIntervalRef.current = window.setTimeout(doTick, currentSpeed);
  };

  const handleRollCustom = () => {
    if (isRolling || remainingCustomItems.length === 0) return;
    resetTurnGrading();
    setIsRolling(true);

    const actualBatch = Math.min(batchCount, remainingCustomItems.length);
    const shuffled = [...remainingCustomItems].sort(() => Math.random() - 0.5);
    const chosen = shuffled.slice(0, actualBatch);

    let ticks = 0;
    const maxTicks = 20;
    let currentSpeed = 55;

    const doTick = () => {
      ticks++;
      const randomPreview =
        remainingCustomItems[Math.floor(Math.random() * remainingCustomItems.length)];
      setCurrentDisplayItem(randomPreview);
      soundManager.playWheelTick(0.85 + (ticks / maxTicks) * 0.5);

      if (ticks < maxTicks) {
        currentSpeed = Math.floor(55 + Math.pow(ticks / maxTicks, 2) * 150);
        rollIntervalRef.current = window.setTimeout(doTick, currentSpeed);
      } else {
        setCurrentDisplayItem(chosen[0]);
        setLatestPickedItems(chosen);
        setPickedCustomItems((prev) => [...prev, ...chosen]);
        setIsRolling(false);
        soundManager.playWinner();
        fireConfetti();
        drawNextQuestion();
      }
    };

    rollIntervalRef.current = window.setTimeout(doTick, currentSpeed);
  };

  const handleResetNumbers = () => {
    setPickedNumbers([]);
    setCurrentDisplayNumber(null);
    setLatestPicksNumbers([]);
    setCurrentPickedQuestion(null);
    setIsAnswerRevealed(false);
    resetTurnGrading();
  };

  const handleResetCustom = () => {
    setPickedCustomItems([]);
    setCurrentDisplayItem(null);
    setLatestPickedItems([]);
    setCurrentPickedQuestion(null);
    setIsAnswerRevealed(false);
    resetTurnGrading();
  };

  const handleRemoveNumber = (num: number) => {
    setPickedNumbers((prev) => prev.filter((n) => n !== num));
    if (latestPicksNumbers.includes(num)) {
      setLatestPicksNumbers((prev) => prev.filter((n) => n !== num));
    }
  };

  const handleRemoveCustomItem = (item: string) => {
    setPickedCustomItems((prev) => prev.filter((i) => i !== item));
    if (latestPickedItems.includes(item)) {
      setLatestPickedItems((prev) => prev.filter((i) => i !== item));
    }
  };

  const handleSaveEditor = () => {
    const lines = editorText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    if (lines.length === 0) return;

    setCustomList(lines);
    setSelectedCustomItems(lines);
    setPickedCustomItems([]);
    setCurrentDisplayItem(null);
    setLatestPickedItems([]);
    setIsEditorOpen(false);
  };

  const parsedQA = currentPickedQuestion ? parseQuestionWithAnswer(currentPickedQuestion) : null;

  // Reusable Question + Answer Reveal Card
  const renderPairedQuestionCard = (compact = false) => {
    if (!questionBank.enabled || !parsedQA) return null;
    return (
      <div
        className={`w-full ${compact ? 'mt-3 p-3.5' : 'p-4 sm:p-5'} rounded-2xl border-2 text-left flex flex-col gap-2 shadow-md ${
          isLightMode && !compact
            ? 'bg-amber-50 border-amber-400 text-slate-900'
            : 'bg-amber-950/40 border-amber-400/70 text-amber-100'
        }`}
      >
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4" />
            <span>CÂU HỎI ({QUESTION_SET_LABELS[activeQuestionSetKey]}):</span>
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {parsedQA.answer && (
              <button
                type="button"
                onClick={() => {
                  const next = !isAnswerRevealed;
                  setIsAnswerRevealed(next);
                  if (next) soundManager.playCorrectChime();
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-black flex items-center gap-1 cursor-pointer transition-all ${
                  isAnswerRevealed
                    ? 'bg-emerald-500 text-slate-950 shadow'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow'
                }`}
              >
                {isAnswerRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{isAnswerRevealed ? 'Ẩn đáp án' : 'Lật đáp án'}</span>
              </button>
            )}
            {onStartQuickTimer && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onStartQuickTimer(30);
                    if (compact) setWinnerNotification(null);
                  }}
                  className="px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Timer className="w-3 h-3" />
                  <span>30s</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onStartQuickTimer(60);
                    if (compact) setWinnerNotification(null);
                  }}
                  className="px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Timer className="w-3 h-3" />
                  <span>60s</span>
                </button>
              </>
            )}
            <button
              type="button"
              onClick={drawNextQuestion}
              className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Đổi câu</span>
            </button>
          </div>
        </div>

        <p className={`${compact ? 'text-base sm:text-xl text-white' : 'text-lg sm:text-2xl'} font-black font-display leading-snug`}>
          {parsedQA.question}
        </p>

        {parsedQA.answer && isAnswerRevealed && (
          <div className="mt-1 px-3.5 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/60 text-emerald-300 font-bold text-sm sm:text-base animate-in fade-in slide-in-from-top-1 duration-150">
            <span className="font-black uppercase text-xs text-emerald-400 mr-1.5">
              ✓ Đáp án:
            </span>
            <span className={isLightMode && !compact ? 'text-emerald-900' : 'text-emerald-100'}>
              {parsedQA.answer}
            </span>
          </div>
        )}
      </div>
    );
  };

  // Reusable Smart Grading Strip (anti-double-click + decimal input)
  const renderSmartGradingStrip = (studentNamesToGrade: string[], darkForced = false) => {
    if (!onQuickAwardStudentScore || studentNamesToGrade.length === 0) return null;
    const useDark = darkForced || !isLightMode;

    return (
      <div
        className={`w-full p-3 rounded-2xl border flex flex-col gap-2 ${
          useDark
            ? 'bg-emerald-950/40 border-emerald-700/50 text-slate-100'
            : 'bg-emerald-50/90 border-emerald-200 text-slate-800'
        }`}
      >
        {studentNamesToGrade.map((stName) => {
          const gList = currentMonthStudentScores[stName] || [];
          const stats = calcGradeStats(gList);
          const gradedThisTurn = turnGradedByStudent[stName];
          const decVal = decimalGradeInputs[stName] || '';

          return (
            <div
              key={stName}
              className="flex flex-wrap items-center justify-between gap-2 text-xs"
            >
              <div className="flex items-center flex-wrap gap-1.5">
                <GraduationCap className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="font-black text-xs sm:text-sm">{stName}</span>
                {gList.length > 0 ? (
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 font-mono font-bold">
                    Đã có: {gList.join(', ')} · TB {stats.avg.toFixed(1)}
                  </span>
                ) : (
                  <span className="text-slate-400 italic">(Chưa có điểm tháng này)</span>
                )}
              </div>

              <div className="flex items-center flex-wrap gap-1">
                {[5, 6, 7, 8, 9, 10].map((grade) => {
                  const isSelectedNow = gradedThisTurn === grade;
                  return (
                    <button
                      key={grade}
                      type="button"
                      onClick={() => handleSmartStudentGrade(stName, grade)}
                      className={`w-8 h-7 rounded-lg font-display font-black text-xs transition-all cursor-pointer active:scale-90 ${
                        isSelectedNow
                          ? 'ring-2 ring-white scale-105 bg-emerald-500 text-slate-950 shadow'
                          : grade >= 9
                            ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-xs'
                            : grade >= 7
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                              : useDark
                                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                                : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-300'
                      }`}
                      title={
                        gradedThisTurn !== undefined
                          ? `Đổi điểm vừa chấm từ ${gradedThisTurn} sang ${grade}`
                          : `Ghi điểm ${grade} cho ${stName}`
                      }
                    >
                      {grade}
                    </button>
                  );
                })}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const parsed = parseFloat(decVal.trim().replace(',', '.'));
                    if (!isNaN(parsed)) {
                      handleSmartStudentGrade(stName, parsed);
                      setDecimalGradeInputs((prev) => ({ ...prev, [stName]: '' }));
                    }
                  }}
                  className="flex items-center gap-1 ml-0.5"
                >
                  <input
                    type="text"
                    inputMode="decimal"
                    value={decVal}
                    onChange={(e) =>
                      setDecimalGradeInputs((prev) => ({ ...prev, [stName]: e.target.value }))
                    }
                    placeholder="8.5"
                    className={`w-12 h-7 px-1.5 rounded-lg border text-center font-bold text-xs outline-none ${
                      useDark
                        ? 'bg-slate-950 border-slate-700 text-white'
                        : 'bg-white border-slate-300 text-slate-900'
                    }`}
                    title="Nhập điểm lẻ (VD: 7.5, 8.5, 9.5) rồi nhấn Enter"
                  />
                </form>

                {gradedThisTurn !== undefined && (
                  <button
                    type="button"
                    onClick={() => allowExtraColumnThisTurn(stName)}
                    className="px-2 h-7 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white border border-indigo-500/40 font-bold text-[11px] cursor-pointer"
                    title="Bấm nếu muốn thêm 1 cột điểm thứ 2 cho học sinh này trong cùng lượt gọi"
                  >
                    + Cột mới
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const pickedCount = pickerMode === 'numbers' ? pickedNumbers.length : pickedCustomItems.length;
  const remainingCount =
    pickerMode === 'numbers' ? remainingNumbers.length : remainingCustomItems.length;
  const totalPoolCount =
    pickerMode === 'numbers' ? activeNumbers.length : activeCustomItems.length;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col gap-3">
      {/* SINGLE MINIMALIST TOP CONTROL BAR */}
      <div
        className={`px-3.5 py-2.5 rounded-2xl border flex flex-wrap items-center justify-between gap-2.5 ${
          isLightMode ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/90 border-slate-800'
        }`}
      >
        {/* Left: 6 Fun Game Modes */}
        <div
          className={`flex items-center gap-1 p-1 rounded-xl flex-wrap ${
            isLightMode ? 'bg-slate-100' : 'bg-slate-950 border border-slate-800'
          }`}
        >
          {GAME_OPTIONS.map((g) => {
            const active = pickerGameType === g.id;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => setPickerGameType(g.id)}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-display font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  active
                    ? `${g.activeBg} shadow-sm scale-[1.02]`
                    : isLightMode
                      ? 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>{g.icon}</span>
                <span>{g.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Smart Priority Filter + Question Bank + Batch + Reset */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Smart Priority Filter ("Gọi ưu tiên HS chưa có điểm") */}
          {customList.length > 0 && (
            <div
              className={`flex items-center gap-1 p-1 rounded-xl border text-xs ${
                isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
              }`}
              title="Lọc nhanh để gọi các học sinh chưa có điểm hoặc ít cột điểm trong tháng"
            >
              <Target className="w-3.5 h-3.5 text-emerald-500 ml-1 shrink-0" />
              <button
                type="button"
                onClick={() => setPriorityFilter('all')}
                className={`px-2 py-1 rounded-lg font-bold cursor-pointer ${
                  priorityFilter === 'all'
                    ? 'bg-emerald-600 text-white'
                    : isLightMode
                      ? 'text-slate-600 hover:bg-slate-200/70'
                      : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                Tất cả
              </button>
              <button
                type="button"
                onClick={() => setPriorityFilter('ungraded')}
                className={`px-2 py-1 rounded-lg font-bold cursor-pointer ${
                  priorityFilter === 'ungraded'
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : isLightMode
                      ? 'text-slate-600 hover:bg-slate-200/70'
                      : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                Chưa có điểm ({ungradedCount})
              </button>
              <button
                type="button"
                onClick={() => setPriorityFilter('under2')}
                className={`px-2 py-1 rounded-lg font-bold cursor-pointer hidden sm:inline-block ${
                  priorityFilter === 'under2'
                    ? 'bg-indigo-600 text-white'
                    : isLightMode
                      ? 'text-slate-600 hover:bg-slate-200/70'
                      : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                &lt;2 cột ({under2Count})
              </button>
            </div>
          )}

          {/* Question Bank Toggle + Modal */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() =>
                handleUpdateQuestionBank({
                  ...questionBank,
                  enabled: !questionBank.enabled,
                })
              }
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                questionBank.enabled
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs'
                  : isLightMode
                    ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{questionBank.enabled ? 'Câu hỏi: Bật' : 'Câu hỏi'}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsQuestionModalOpen(true)}
              className={`px-2 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                isLightMode
                  ? 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-800'
                  : 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/30 text-amber-300'
              }`}
              title="Soạn ngân hàng câu hỏi & đáp án theo Khối"
            >
              Soạn ({activeQuestionsList.length})
            </button>
          </div>

          {/* 1 HS / 2 HS toggle */}
          <button
            type="button"
            onClick={() => setBatchCount(batchCount === 1 ? 2 : 1)}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold cursor-pointer ${
              batchCount === 2
                ? 'bg-indigo-600 text-white border-indigo-500'
                : isLightMode
                  ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
            }`}
            title="Chuyển đổi gọi 1 học sinh hoặc 1 cặp 2 học sinh"
          >
            {batchCount === 1 ? '1 HS' : '2 HS (Cặp)'}
          </button>

          {/* Compact Progress + Reset */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-bold ${
              isLightMode ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-950 border-slate-800 text-slate-300'
            }`}
          >
            <span>
              Còn <strong className="text-emerald-500 tabular-nums">{remainingCount}</strong>/{totalPoolCount}
            </span>
            {pickedCount > 0 && (
              <button
                type="button"
                onClick={pickerMode === 'numbers' ? handleResetNumbers : handleResetCustom}
                className="p-1 rounded-lg text-rose-500 hover:bg-rose-500/15 cursor-pointer"
                title="Đặt lại danh sách đã gọi cho lượt mới"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Feedback Toast Banner */}
      {awardedFeedback && (
        <div className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs sm:text-sm font-black text-center animate-in fade-in duration-150">
          ✨ {awardedFeedback}
        </div>
      )}

      {/* MAIN CENTERPIECE GAME STAGE */}
      <div
        className={
          isGameFullscreen
            ? 'fixed inset-0 z-50 bg-slate-950 p-4 sm:p-6 flex flex-col justify-start overflow-y-auto w-screen h-screen text-white'
            : `rounded-3xl border p-5 sm:p-7 text-center flex flex-col items-center justify-center relative overflow-hidden transition-all ${
                isLightMode
                  ? 'bg-gradient-to-b from-indigo-50/50 via-white to-slate-50 border-slate-200 shadow-sm'
                  : 'bg-gradient-to-b from-slate-900 via-indigo-950/25 to-slate-900 border-indigo-500/30 shadow-xl'
              }`
        }
      >
        {/* Sticky Fullscreen Navigation Header */}
        {isGameFullscreen && (
          <div className="w-full sticky top-0 z-30 flex flex-wrap items-center justify-between gap-2 mb-4 bg-slate-900/95 backdrop-blur-md border border-slate-800 px-4 py-2.5 rounded-2xl shadow-2xl">
            <div className="flex items-center gap-1.5 flex-wrap">
              {GAME_OPTIONS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setPickerGameType(g.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer ${
                    pickerGameType === g.id
                      ? g.activeBg
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span>{g.icon}</span>
                  <span>{g.label}</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={toggleGameFullscreen}
              className="px-3.5 py-1.5 rounded-xl font-display font-black text-xs bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5 cursor-pointer"
            >
              <Minimize2 className="w-4 h-4" />
              <span>Thu nhỏ (Esc)</span>
            </button>
          </div>
        )}

        {/* EMPTY FILTER / EMPTY SELECTION STATES */}
        {totalPoolCount === 0 ? (
          <div className="py-8 flex flex-col items-center gap-3">
            <AlertCircle className="w-12 h-12 text-amber-500" />
            <h3 className="text-xl sm:text-2xl font-black font-display">
              {priorityFilter !== 'all'
                ? 'Không còn học sinh nào thuộc bộ lọc ưu tiên này!'
                : 'Chưa có học sinh nào trong danh sách quay'}
            </h3>
            {priorityFilter !== 'all' ? (
              <button
                type="button"
                onClick={() => setPriorityFilter('all')}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm cursor-pointer"
              >
                Chuyển về quay Tất cả học sinh
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (pickerMode === 'numbers') {
                    setSelectedNumbers(allNumbers);
                  } else if (customList.length > 0) {
                    setSelectedCustomItems([...customList]);
                  } else {
                    setIsEditorOpen(true);
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm flex items-center gap-2 cursor-pointer"
              >
                <CheckCheck className="w-4 h-4" />
                <span>{customList.length > 0 ? 'Chọn lại tất cả học sinh' : 'Nhập danh sách'}</span>
              </button>
            )}
          </div>
        ) : (pickerMode === 'numbers' ? isAllNumbersPicked : isAllCustomPicked) &&
          !winnerNotification ? (
          <div className="py-8 flex flex-col items-center gap-3">
            <CheckCircle2 className="w-14 h-14 text-emerald-500" />
            <h2 className="text-2xl sm:text-3xl font-black font-display text-emerald-500">
              ĐÃ GỌI HẾT {totalPoolCount}/{totalPoolCount} HỌC SINH TRONG NHÓM LỌC!
            </h2>
            <button
              type="button"
              onClick={pickerMode === 'numbers' ? handleResetNumbers : handleResetCustom}
              className="mt-2 px-7 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-lg flex items-center gap-2 cursor-pointer shadow-lg"
            >
              <RotateCcw className="w-5 h-5" />
              <span>BẮT ĐẦU LƯỢT MỚI</span>
            </button>
          </div>
        ) : pickerGameType === 'wheelSpin' ? (
          <Suspense
            fallback={<div className="py-16 text-sm font-bold text-slate-400">Đang tải Vòng quay...</div>}
          >
            <SpinningWheelGame
              candidates={pickerMode === 'numbers' ? remainingNumbers : remainingCustomItems}
              batchCount={batchCount}
              isLightMode={isLightMode && !isGameFullscreen}
              studentNames={customList}
              onSelectWinners={handleWinnersFromMiniGame}
              isGameFullscreen={isGameFullscreen}
              onToggleFullscreen={toggleGameFullscreen}
            />
          </Suspense>
        ) : pickerGameType === 'mysteryBox' ? (
          <Suspense
            fallback={<div className="py-16 text-sm font-bold text-slate-400">Đang tải Hộp quà...</div>}
          >
            <MysteryBoxGame
              candidates={pickerMode === 'numbers' ? remainingNumbers : remainingCustomItems}
              batchCount={batchCount}
              isLightMode={isLightMode && !isGameFullscreen}
              studentNames={customList}
              onSelectWinners={handleWinnersFromMiniGame}
              isGameFullscreen={isGameFullscreen}
              onToggleFullscreen={toggleGameFullscreen}
            />
          </Suspense>
        ) : pickerGameType === 'duck' ? (
          <Suspense
            fallback={<div className="py-16 text-sm font-bold text-slate-400">Đang tải Đua vịt...</div>}
          >
            <div className="w-full">
              <DuckRaceGame
                candidates={pickerMode === 'numbers' ? remainingNumbers : remainingCustomItems}
                batchCount={batchCount}
                isLightMode={isLightMode && !isGameFullscreen}
                studentNames={customList}
                onSelectWinners={handleWinnersFromMiniGame}
                isGameFullscreen={isGameFullscreen}
                onToggleFullscreen={toggleGameFullscreen}
              />
            </div>
          </Suspense>
        ) : pickerGameType === 'marble' ? (
          <Suspense
            fallback={<div className="py-16 text-sm font-bold text-slate-400">Đang tải Thả bi Plinko...</div>}
          >
            <div className="w-full">
              <MarbleDropGame
                candidates={pickerMode === 'numbers' ? remainingNumbers : remainingCustomItems}
                batchCount={batchCount}
                isLightMode={isLightMode && !isGameFullscreen}
                studentNames={customList}
                onSelectWinners={handleWinnersFromMiniGame}
                isGameFullscreen={isGameFullscreen}
                onToggleFullscreen={toggleGameFullscreen}
              />
            </div>
          </Suspense>
        ) : pickerGameType === 'car' ? (
          <Suspense
            fallback={<div className="py-16 text-sm font-bold text-slate-400">Đang tải Đua xe F1...</div>}
          >
            <div className="w-full">
              <CarRaceGame
                candidates={pickerMode === 'numbers' ? remainingNumbers : remainingCustomItems}
                batchCount={batchCount}
                isLightMode={isLightMode && !isGameFullscreen}
                studentNames={customList}
                onSelectWinners={handleWinnersFromMiniGame}
                isGameFullscreen={isGameFullscreen}
                onToggleFullscreen={toggleGameFullscreen}
              />
            </div>
          </Suspense>
        ) : (
          /* DIGITAL ROLL STAGE ('digital') */
          <div className="w-full flex flex-col items-center">
            <div className="w-full flex justify-end mb-1">
              <button
                type="button"
                onClick={toggleGameFullscreen}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 border cursor-pointer ${
                  isLightMode && !isGameFullscreen
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                    : 'bg-slate-800 hover:bg-slate-700 text-indigo-300 border-slate-700'
                }`}
              >
                {isGameFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                <span>{isGameFullscreen ? 'Thu nhỏ' : 'Phóng to (F)'}</span>
              </button>
            </div>

            <div className="my-3 min-h-[160px] sm:min-h-[200px] flex items-center justify-center w-full max-w-4xl px-2">
              {pickerMode === 'numbers' ? (
                latestPicksNumbers.length === 2 && !isRolling ? (
                  <div className="flex items-center gap-4 sm:gap-8 flex-wrap justify-center">
                    {latestPicksNumbers.map((num, idx) => (
                      <div
                        key={idx}
                        className={`px-8 py-5 rounded-3xl border-4 text-center ${
                          isLightMode && !isGameFullscreen
                            ? 'bg-white border-indigo-500 shadow-lg text-indigo-600'
                            : 'bg-indigo-950/80 border-indigo-400 shadow-2xl text-indigo-300'
                        }`}
                      >
                        <span className="text-xs font-bold uppercase text-slate-400 block">
                          HỌC SINH {idx + 1}
                        </span>
                        <span className="text-6xl sm:text-8xl font-black font-display tabular-nums block">
                          {num}
                        </span>
                        {customList[num - 1] && (
                          <span className="mt-1 text-xl sm:text-2xl font-black text-amber-500 block">
                            {customList[num - 1]}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : currentDisplayNumber !== null ? (
                  <div
                    className={`px-10 sm:px-16 py-7 rounded-3xl border-4 text-center ${
                      isLightMode && !isGameFullscreen
                        ? 'bg-white border-emerald-500 shadow-xl text-emerald-600'
                        : 'bg-indigo-950 border-emerald-400 shadow-2xl text-emerald-300'
                    }`}
                  >
                    <span className="text-7xl sm:text-9xl font-black font-display tabular-nums leading-none block">
                      {currentDisplayNumber}
                    </span>
                    {customList[currentDisplayNumber - 1] && !isRolling && (
                      <span className="mt-3 text-3xl sm:text-5xl font-black font-display text-amber-400 block">
                        {customList[currentDisplayNumber - 1]}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="px-8 py-8 rounded-3xl border-2 border-dashed border-indigo-400/40 text-slate-400 flex flex-col items-center gap-2">
                    <Sparkles className="w-10 h-10 text-indigo-400" />
                    <span className="text-xl font-bold font-display">Bấm nút hoặc Space để quay số</span>
                  </div>
                )
              ) : latestPickedItems.length === 2 && !isRolling ? (
                <div className="flex items-center gap-4 flex-wrap justify-center w-full">
                  {latestPickedItems.map((item, idx) => (
                    <div
                      key={idx}
                      className={`flex-1 min-w-[260px] max-w-md px-6 py-5 rounded-3xl border-4 ${
                        isLightMode && !isGameFullscreen
                          ? 'bg-white border-emerald-500 shadow-lg text-slate-900'
                          : 'bg-indigo-950/90 border-emerald-400 shadow-2xl text-white'
                      }`}
                    >
                      <span className="text-xs font-bold uppercase block text-emerald-500 mb-1">
                        KẾT QUẢ {idx + 1}
                      </span>
                      <span className="text-2xl sm:text-4xl font-black font-display">{item}</span>
                    </div>
                  ))}
                </div>
              ) : currentDisplayItem !== null ? (
                <div
                  className={`w-full max-w-3xl px-8 sm:px-14 py-8 rounded-3xl border-4 ${
                    isLightMode && !isGameFullscreen
                      ? 'bg-white border-emerald-500 shadow-xl text-slate-900'
                      : 'bg-indigo-950 border-emerald-400 shadow-2xl text-white'
                  }`}
                >
                  <span className="text-3xl sm:text-6xl font-black font-display leading-tight block">
                    {currentDisplayItem}
                  </span>
                </div>
              ) : (
                <div className="px-8 py-8 rounded-3xl border-2 border-dashed border-indigo-400/40 text-slate-400 flex flex-col items-center gap-2">
                  <Sparkles className="w-10 h-10 text-indigo-400" />
                  <span className="text-xl font-bold font-display">
                    Sẵn sàng chọn ngẫu nhiên ({remainingCount} học sinh)
                  </span>
                </div>
              )}
            </div>

            {/* Paired Question + Smart Grading Strip on Digital Stage */}
            {!isRolling &&
              ((pickerMode === 'numbers' && latestPicksNumbers.length > 0) ||
                (pickerMode === 'customList' && latestPickedItems.length > 0)) && (
                <div className="w-full max-w-3xl px-2 mt-2 flex flex-col gap-2.5">
                  {renderPairedQuestionCard(false)}
                  {renderSmartGradingStrip(
                    pickerMode === 'numbers'
                      ? latestPicksNumbers
                          .map((n) => customList[n - 1])
                          .filter((s): s is string => Boolean(s))
                      : latestPickedItems.filter((item) => customList.includes(item)),
                    isGameFullscreen
                  )}
                </div>
              )}

            <button
              type="button"
              onClick={pickerMode === 'numbers' ? handleRollNumbers : handleRollCustom}
              disabled={isRolling || remainingCount === 0}
              className="mt-4 px-10 sm:px-14 py-4 rounded-2xl font-black font-display text-xl sm:text-3xl flex items-center gap-3 bg-gradient-to-r from-indigo-500 via-indigo-600 to-emerald-600 hover:from-indigo-400 hover:to-emerald-500 text-white shadow-xl cursor-pointer active:scale-95 transition-all"
            >
              <Shuffle className={`w-7 h-7 ${isRolling ? 'animate-spin' : ''}`} />
              <span>{isRolling ? 'ĐANG QUAY...' : 'QUAY NGẪU NHIÊN (SPACE)'}</span>
            </button>
          </div>
        )}
      </div>

      {/* COLLAPSIBLE STUDENT ROSTER & SOURCE SETTINGS DRAWER (Keeps stage clean!) */}
      <div
        className={`rounded-2xl border overflow-hidden transition-all ${
          isLightMode ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
        }`}
      >
        <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <button
            type="button"
            onClick={() => setIsRosterExpanded(!isRosterExpanded)}
            className="flex items-center gap-2 font-bold cursor-pointer"
          >
            {isRosterExpanded ? (
              <ChevronUp className="w-4 h-4 text-indigo-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-indigo-400" />
            )}
            <span>
              Danh sách tham gia quay &amp; Lịch sử đã gọi ({pickedCount} đã gọi)
            </span>
          </button>

          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-1 p-0.5 rounded-lg border ${
                isLightMode ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800'
              }`}
            >
              <button
                type="button"
                onClick={() => setPickerMode('customList')}
                className={`px-2 py-1 rounded-md font-bold flex items-center gap-1 cursor-pointer ${
                  pickerMode === 'customList'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3 h-3" />
                <span>Theo tên ({customList.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setPickerMode('numbers')}
                className={`px-2 py-1 rounded-md font-bold flex items-center gap-1 cursor-pointer ${
                  pickerMode === 'numbers'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Hash className="w-3 h-3" />
                <span>Theo số (1–{studentCount})</span>
              </button>
            </div>

            {pickerMode === 'customList' && (
              <button
                type="button"
                onClick={() => setIsEditorOpen(true)}
                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                <span>Sửa danh sách</span>
              </button>
            )}
          </div>
        </div>

        {/* Picked Chips Always Visible If Any */}
        {!isRosterExpanded && pickedCount > 0 && (
          <div
            className={`px-4 py-2 border-t flex items-center gap-1.5 flex-wrap text-xs ${
              isLightMode ? 'border-slate-100 bg-slate-50/60' : 'border-slate-800 bg-slate-950/40'
            }`}
          >
            <span className="font-bold text-slate-400 mr-1">Đã gọi:</span>
            {pickerMode === 'numbers'
              ? pickedNumbers.map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleRemoveNumber(num)}
                    className={`px-2 py-0.5 rounded-md font-bold flex items-center gap-1 cursor-pointer ${
                      isLightMode
                        ? 'bg-slate-200 hover:bg-rose-100 text-slate-700'
                        : 'bg-slate-800 hover:bg-rose-950 text-slate-300'
                    }`}
                    title="Bấm để đưa trở lại danh sách chưa gọi"
                  >
                    <span>Số {num}</span>
                    <span className="text-rose-500">×</span>
                  </button>
                ))
              : pickedCustomItems.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleRemoveCustomItem(item)}
                    className={`px-2 py-0.5 rounded-md font-semibold flex items-center gap-1 cursor-pointer ${
                      isLightMode
                        ? 'bg-slate-200 hover:bg-rose-100 text-slate-700'
                        : 'bg-slate-800 hover:bg-rose-950 text-slate-300'
                    }`}
                    title="Bấm để đưa trở lại danh sách chưa gọi"
                  >
                    <span>{item}</span>
                    <span className="text-rose-500">×</span>
                  </button>
                ))}
          </div>
        )}

        {/* Expanded Roster Grid */}
        {isRosterExpanded && (
          <div
            className={`p-4 border-t ${
              isLightMode ? 'border-slate-200' : 'border-slate-800'
            }`}
          >
            {pickerMode === 'numbers' ? (
              <div>
                <div className="flex items-center gap-2 mb-3 text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedNumbers(allNumbers)}
                    className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold cursor-pointer"
                  >
                    Chọn tất cả
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedNumbers([])}
                    className="px-2.5 py-1 rounded-lg bg-slate-700 text-white font-bold cursor-pointer"
                  >
                    Bỏ chọn hết
                  </button>
                </div>
                <div className="grid grid-cols-6 sm:grid-cols-10 gap-2">
                  {allNumbers.map((num) => {
                    const isSelected = selectedNumbers.includes(num);
                    const isPicked = pickedNumbers.includes(num);
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handleToggleNumber(num)}
                        className={`py-2 rounded-xl font-display font-black text-sm cursor-pointer border ${
                          isPicked
                            ? 'opacity-45 line-through border-slate-700'
                            : isSelected
                              ? isLightMode
                                ? 'bg-indigo-50 border-indigo-300 text-indigo-900'
                                : 'bg-slate-800 border-emerald-500/40 text-emerald-300'
                              : 'opacity-35 border-dashed border-slate-600'
                        }`}
                      >
                        {num}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-3 text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedCustomItems([...customList])}
                    className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold cursor-pointer"
                  >
                    Chọn tất cả ({customList.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCustomItems([])}
                    className="px-2.5 py-1 rounded-lg bg-slate-700 text-white font-bold cursor-pointer"
                  >
                    Bỏ chọn hết
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {customList.map((item, idx) => {
                    const isSelected = selectedCustomItems.includes(item);
                    const isPicked = pickedCustomItems.includes(item);
                    return (
                      <div
                        key={idx}
                        onClick={() => handleToggleCustomItem(item)}
                        className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer ${
                          isPicked
                            ? 'opacity-45 line-through border-slate-700'
                            : isSelected
                              ? isLightMode
                                ? 'bg-slate-50 border-slate-300 text-slate-800'
                                : 'bg-slate-800 border-slate-700 text-slate-100'
                              : 'opacity-40 border-dashed border-slate-600'
                        }`}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <span className="text-indigo-400 font-mono">#{idx + 1}</span>
                        <span className="truncate">{item}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal: Custom List Editor */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={`w-full max-w-2xl rounded-3xl border-4 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 ${
              isLightMode ? 'bg-white border-indigo-500' : 'bg-slate-900 border-indigo-500'
            }`}
          >
            <div className="p-5 bg-indigo-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-6 h-6" />
                <h3 className="text-xl font-black font-display uppercase">
                  NHẬP / DÁN DANH SÁCH HỌC SINH
                </h3>
              </div>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <textarea
                value={editorText}
                onChange={(e) => setEditorText(e.target.value)}
                rows={10}
                className={`w-full p-4 rounded-2xl border font-mono text-sm outline-none resize-none ${
                  isLightMode
                    ? 'bg-slate-50 border-slate-300 text-slate-900'
                    : 'bg-slate-950 border-slate-700 text-white'
                }`}
              />

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditorText(PRESET_STUDENT_NAMES.join('\n'))}
                  className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-400 text-xs font-semibold cursor-pointer"
                >
                  Mẫu 16 học sinh
                </button>
                <button
                  type="button"
                  onClick={() => setEditorText(PRESET_QUESTIONS.join('\n'))}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-semibold cursor-pointer"
                >
                  Mẫu câu hỏi
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const lines = editorText
                      .split('\n')
                      .map((l) => l.trim())
                      .filter(Boolean);
                    setEditorText(sortVietnameseStudentNames(lines).join('\n'));
                  }}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  <span>Sắp xếp A–Z</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditorText('')}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-400 text-xs font-semibold flex items-center gap-1 cursor-pointer ml-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa hết</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-700/50">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const lines = editorText
                        .split('\n')
                        .map((l) => l.trim())
                        .filter(Boolean);
                      onSaveToActiveClass(lines);
                      setIsEditorOpen(false);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold cursor-pointer"
                  >
                    💾 Lưu vào {activeClass?.name || 'lớp'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditorOpen(false);
                      onOpenClassManager();
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold cursor-pointer"
                  >
                    📂 Quản lý 12 lớp
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditorOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-600 text-sm font-bold cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEditor}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-black flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Áp dụng</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Classroom Winner Announcement Notification Modal */}
      {winnerNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in zoom-in duration-200">
          <div className="relative w-full max-w-2xl rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 border-2 border-amber-400 shadow-2xl p-6 sm:p-7 flex flex-col items-center text-center max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setWinnerNotification(null)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer border border-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-black uppercase mb-3">
              <span>{winnerNotification.icon}</span>
              <span>{winnerNotification.gameModeName} · KẾT QUẢ</span>
            </div>

            <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-3">
              {winnerNotification.winners.map((winner, idx) => (
                <div
                  key={idx}
                  className="w-full flex-1 p-5 rounded-3xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 text-slate-950 shadow-xl border-4 border-white flex flex-col items-center justify-center"
                >
                  {winner.number && (
                    <span className="text-xs font-black bg-slate-950 text-amber-300 px-2.5 py-0.5 rounded-full font-display mb-1">
                      Số #{winner.number}
                    </span>
                  )}
                  <h2 className="text-3xl sm:text-5xl font-black font-display tracking-tight text-slate-950 leading-tight break-words">
                    {winner.studentName}
                  </h2>
                </div>
              ))}
            </div>

            {/* Paired Question + Answer Reveal inside Winner Modal */}
            {renderPairedQuestionCard(true)}

            {/* Smart Anti-Mistake Grading Strip inside Winner Modal */}
            <div className="w-full mt-3">
              {renderSmartGradingStrip(
                winnerNotification.winners
                  .map((w) => w.studentName)
                  .filter((name) => customList.includes(name)),
                true
              )}
            </div>

            {/* Quick Award Group Score */}
            {onQuickAwardScore && scoreGroups.length > 0 && (
              <div className="w-full mt-2.5 p-2.5 rounded-2xl bg-slate-900/90 border border-slate-700 flex flex-wrap items-center justify-center gap-1.5">
                <span className="text-xs font-bold text-emerald-400 mr-1 flex items-center gap-1">
                  <Trophy className="w-3.5 h-3.5" />
                  <span>Cộng điểm nhóm:</span>
                </span>
                {scoreGroups.map((sg) => {
                  const firstWinner = winnerNotification.winners[0];
                  const isMatched =
                    firstWinner &&
                    (findStudentGroupId(firstWinner.studentName) === sg.id ||
                      (firstWinner.number !== undefined &&
                        findStudentGroupId(firstWinner.number) === sg.id));
                  return (
                    <button
                      key={sg.id}
                      onClick={() => triggerQuickScore(sg.id, sg.name, 1)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-black cursor-pointer active:scale-95 ${
                        isMatched
                          ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-200'
                          : 'bg-emerald-600/25 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      <Plus className="w-3 h-3 inline mr-0.5" />1 {sg.name} {isMatched ? '⭐' : ''}
                    </button>
                  );
                })}
              </div>
            )}

            {awardedFeedback && (
              <span className="text-xs font-black text-amber-300 mt-2">✨ {awardedFeedback}</span>
            )}

            <button
              onClick={() => setWinnerNotification(null)}
              className="mt-5 px-10 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black font-display text-base shadow-xl cursor-pointer active:scale-95"
            >
              TIẾP TỤC (ESC)
            </button>
          </div>
        </div>
      )}

      {/* Question Bank Modal */}
      <QuestionBankModal
        isOpen={isQuestionModalOpen}
        onClose={() => setIsQuestionModalOpen(false)}
        questionBank={questionBank}
        activeClassName={activeClass?.name}
        onSaveQuestionBank={handleUpdateQuestionBank}
        isLightMode={isLightMode}
      />
    </div>
  );
};
