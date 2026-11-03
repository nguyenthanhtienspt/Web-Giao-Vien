import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { RotateCcw, Shuffle, Sparkles, CheckCircle2, Layers, FileText, Hash, Edit3, X, Check, Trash2, CheckSquare, Square, CheckCheck, RefreshCw, AlertCircle, Play, Trophy, Maximize2, Minimize2 } from 'lucide-react';
import { soundManager } from '../services/sound';
import { SavedClass } from '../types';
import { DuckRaceGame } from './DuckRaceGame';
import { MarbleDropGame } from './MarbleDropGame';
import { CarRaceGame } from './CarRaceGame';
import { BoatRaceGame } from './BoatRaceGame';
import { MagicCardGame } from './MagicCardGame';

export type PickerGameType = 'wheel' | 'duck' | 'marble' | 'car' | 'boat' | 'magic';

interface RandomPickerTabProps {
  studentCount: number;
  isLightMode: boolean;
  customList: string[];
  setCustomList: (list: string[]) => void;
  activeClass: SavedClass | null;
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
  'Câu 1: Nêu khái niệm và vai trò của quang hợp ở thực vật?',
  'Câu 2: Phát biểu định luật Ôm và viết hệ thức?',
  'Câu 3: Phân tích nguyên nhân dẫn đến cuộc Cách mạng tháng Tám 1945?',
  'Câu 4: Nêu các biện pháp bảo vệ nguồn nước ngọt tại địa phương?',
  'Câu 5: Trình bày cấu tạo của nguyên tử theo mô hình Rutherford – Bohr?',
  'Câu 6: Em hãy kể tên các thể thơ truyền thống của dân tộc Việt Nam?',
  'Câu 7: Trình bày các bước giải một bài toán thực tế bằng cách lập phương trình?',
  'Câu 8: Nêu đặc điểm khí hậu nhiệt đới gió mùa của nước ta?',
];

export const RandomPickerTab: React.FC<RandomPickerTabProps> = ({
  studentCount,
  isLightMode,
  customList,
  setCustomList,
  activeClass,
  onOpenClassManager,
  onSaveToActiveClass,
}) => {
  // Mode selection: by numbers (1-N) or by custom entered list
  const [pickerMode, setPickerMode] = useState<'numbers' | 'customList'>('numbers');
  // Visual Game / Style: Classic Wheel / Duck Race / Marble Drop
  const [pickerGameType, setPickerGameType] = useState<PickerGameType>('wheel');

  // State for Numbers mode
  const [pickedNumbers, setPickedNumbers] = useState<number[]>([]);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>(() =>
    Array.from({ length: studentCount }, (_, i) => i + 1)
  );
  const [currentDisplayNumber, setCurrentDisplayNumber] = useState<number | null>(null);

  // State for Custom List mode
  const [pickedCustomItems, setPickedCustomItems] = useState<string[]>([]);
  const [selectedCustomItems, setSelectedCustomItems] = useState<string[]>(customList);
  const [currentDisplayItem, setCurrentDisplayItem] = useState<string | null>(null);
  const [latestPickedItems, setLatestPickedItems] = useState<string[]>([]);

  // Modal for editing custom list
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorText, setEditorText] = useState(customList.join('\n'));

  // Shared roll states
  const [isRolling, setIsRolling] = useState(false);
  const [batchCount, setBatchCount] = useState<1 | 2>(1); // pick 1 or 2 at once
  const [latestPicksNumbers, setLatestPicksNumbers] = useState<number[]>([]);
  const rollIntervalRef = useRef<number | null>(null);

  // Fullscreen Theater Mode State for Games
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

  // Winner announcement notification modal state
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

  // Handler for winners picked via Duck Race or Marble Drop
  const handleWinnersFromMiniGame = (winnerIds: (string | number)[]) => {
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

    setWinnerNotification({
      gameModeName:
        pickerGameType === 'duck'
          ? 'Đua vịt đại chiến'
          : pickerGameType === 'marble'
            ? 'Thả viên bi Plinko'
            : pickerGameType === 'car'
              ? 'Đua siêu xe F1 Turbo'
              : pickerGameType === 'boat'
                ? 'Đua thuyền rồng vượt sóng'
                : pickerGameType === 'magic'
                  ? 'Rút thăm bài ma thuật'
                  : 'Quay số ngẫu nhiên',
      icon:
        pickerGameType === 'duck'
          ? '🦆'
          : pickerGameType === 'marble'
            ? '🔮'
            : pickerGameType === 'car'
              ? '🏎️'
              : pickerGameType === 'boat'
                ? '🚣'
                : pickerGameType === 'magic'
                  ? '🃏'
                  : '🎰',
      winners: resolvedWinners,
    });
  };

  // Synchronize selected pools when props change
  useEffect(() => {
    setSelectedCustomItems(customList);
    setPickedCustomItems([]);
    setCurrentDisplayItem(null);
    setLatestPickedItems([]);
  }, [customList]);

  useEffect(() => {
    setSelectedNumbers(Array.from({ length: studentCount }, (_, i) => i + 1));
    setPickedNumbers([]);
    setCurrentDisplayNumber(null);
    setLatestPicksNumbers([]);
  }, [studentCount]);

  // Numbers mode pools (considering selected / checked numbers)
  const allNumbers = Array.from({ length: studentCount }, (_, i) => i + 1);
  const activeNumbers = allNumbers.filter((n) => selectedNumbers.includes(n));
  const remainingNumbers = activeNumbers.filter((n) => !pickedNumbers.includes(n));
  const isAllNumbersPicked = activeNumbers.length > 0 && remainingNumbers.length === 0;

  // Custom list pools (considering selected / checked items)
  const activeCustomItems = customList.filter((item) => selectedCustomItems.includes(item));
  const remainingCustomItems = activeCustomItems.filter((item) => !pickedCustomItems.includes(item));
  const isAllCustomPicked = activeCustomItems.length > 0 && remainingCustomItems.length === 0;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rollIntervalRef.current) {
        window.clearTimeout(rollIntervalRef.current);
      }
    };
  }, []);

  // Update editor text when customList changes
  useEffect(() => {
    setEditorText(customList.join('\n'));
  }, [customList]);

  // Keyboard shortcut: Spacebar to trigger roll, F to toggle fullscreen, Esc to exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleGameFullscreen();
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
      if (e.code === 'Space' && !isRolling) {
        if (pickerMode === 'numbers' && !isAllNumbersPicked && remainingNumbers.length > 0) {
          e.preventDefault();
          handleRollNumbers();
        } else if (pickerMode === 'customList' && !isAllCustomPicked && remainingCustomItems.length > 0) {
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
  }, [isRolling, pickerMode, isAllNumbersPicked, isAllCustomPicked, remainingNumbers, remainingCustomItems, batchCount, isGameFullscreen]);

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

  /**
   * Selection / Checkbox Handlers for Custom List
   */
  const handleToggleCustomItem = (item: string) => {
    if (selectedCustomItems.includes(item)) {
      setSelectedCustomItems((prev) => prev.filter((i) => i !== item));
    } else {
      setSelectedCustomItems((prev) => [...prev, item]);
    }
  };

  const handleSelectAllCustom = () => {
    setSelectedCustomItems([...customList]);
  };

  const handleDeselectAllCustom = () => {
    setSelectedCustomItems([]);
  };

  const handleInvertCustom = () => {
    setSelectedCustomItems(customList.filter((item) => !selectedCustomItems.includes(item)));
  };

  /**
   * Selection / Checkbox Handlers for Numbers Mode
   */
  const handleToggleNumber = (num: number) => {
    if (selectedNumbers.includes(num)) {
      setSelectedNumbers((prev) => prev.filter((n) => n !== num));
    } else {
      setSelectedNumbers((prev) => [...prev, num]);
    }
  };

  const handleSelectAllNumbers = () => {
    setSelectedNumbers(Array.from({ length: studentCount }, (_, i) => i + 1));
  };

  const handleDeselectAllNumbers = () => {
    setSelectedNumbers([]);
  };

  /**
   * Roll logic for Numbers mode
   */
  const handleRollNumbers = () => {
    if (isRolling || isAllNumbersPicked || remainingNumbers.length === 0) return;

    setIsRolling(true);
    setLatestPicksNumbers([]);

    const countToPick = Math.min(batchCount, remainingNumbers.length);
    const shuffledRemaining = [...remainingNumbers].sort(() => Math.random() - 0.5);
    const chosen = shuffledRemaining.slice(0, countToPick);

    let ticks = 0;
    const maxTicks = 24;
    let currentSpeed = 60;

    const doTick = () => {
      ticks++;
      const tempPreview = remainingNumbers[Math.floor(Math.random() * remainingNumbers.length)];
      setCurrentDisplayNumber(tempPreview);
      soundManager.playWheelTick(1 + (ticks / maxTicks) * 0.4);

      if (ticks < maxTicks) {
        currentSpeed = Math.floor(60 + Math.pow(ticks / maxTicks, 2) * 160);
        rollIntervalRef.current = window.setTimeout(doTick, currentSpeed);
      } else {
        const mainWinner = chosen[0];
        setCurrentDisplayNumber(mainWinner);
        setLatestPicksNumbers(chosen);
        setPickedNumbers((prev) => [...prev, ...chosen]);
        setIsRolling(false);
        soundManager.playWinner();
        fireConfetti();
      }
    };

    rollIntervalRef.current = window.setTimeout(doTick, currentSpeed);
  };

  /**
   * Roll logic for Custom List mode
   */
  const handleRollCustom = () => {
    if (isRolling || isAllCustomPicked || remainingCustomItems.length === 0) return;

    setIsRolling(true);
    setLatestPickedItems([]);

    const countToPick = Math.min(batchCount, remainingCustomItems.length);
    const shuffledRemaining = [...remainingCustomItems].sort(() => Math.random() - 0.5);
    const chosen = shuffledRemaining.slice(0, countToPick);

    let ticks = 0;
    const maxTicks = 24;
    let currentSpeed = 60;

    const doTick = () => {
      ticks++;
      const tempPreview = remainingCustomItems[Math.floor(Math.random() * remainingCustomItems.length)];
      setCurrentDisplayItem(tempPreview);
      soundManager.playWheelTick(1 + (ticks / maxTicks) * 0.4);

      if (ticks < maxTicks) {
        currentSpeed = Math.floor(60 + Math.pow(ticks / maxTicks, 2) * 160);
        rollIntervalRef.current = window.setTimeout(doTick, currentSpeed);
      } else {
        const mainWinner = chosen[0];
        setCurrentDisplayItem(mainWinner);
        setLatestPickedItems(chosen);
        setPickedCustomItems((prev) => [...prev, ...chosen]);
        setIsRolling(false);
        soundManager.playWinner();
        fireConfetti();
      }
    };

    rollIntervalRef.current = window.setTimeout(doTick, currentSpeed);
  };

  const handleResetNumbers = () => {
    if (pickedNumbers.length > 0 && !window.confirm('Thầy/Cô có muốn bắt đầu lượt quay mới (đặt lại các số đã gọi)?')) {
      return;
    }
    setPickedNumbers([]);
    setCurrentDisplayNumber(null);
    setLatestPicksNumbers([]);
  };

  const handleResetCustom = () => {
    if (pickedCustomItems.length > 0 && !window.confirm('Thầy/Cô có muốn bắt đầu lượt quay mới cho danh sách này?')) {
      return;
    }
    setPickedCustomItems([]);
    setCurrentDisplayItem(null);
    setLatestPickedItems([]);
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

  // Save parsed items from editor
  const handleSaveEditor = () => {
    const lines = editorText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length === 0) {
      alert('Vui lòng nhập ít nhất 1 mục vào danh sách!');
      return;
    }

    setCustomList(lines);
    setSelectedCustomItems(lines);
    setPickedCustomItems([]);
    setCurrentDisplayItem(null);
    setLatestPickedItems([]);
    setIsEditorOpen(false);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col gap-6">
      {/* Game Style & Mode Switcher Deck */}
      <div className={`p-4 sm:p-5 rounded-3xl border flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 ${
        isLightMode ? 'bg-white border-slate-200 shadow-md' : 'bg-slate-900/90 border-slate-800 shadow-xl'
      }`}>
        {/* Left: 3 Fun Picker Styles (Wheel / Duck Race / Marble Drop) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5">
          <span className="text-xs font-black uppercase tracking-wider text-amber-400 shrink-0 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>HÌNH THỨC CHỌN:</span>
          </span>
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-950/70 border border-slate-700/80 flex-wrap">
            {/* 1. Classic Wheel Roll */}
            <button
              onClick={() => setPickerGameType('wheel')}
              className={`px-3.5 sm:px-4 py-2 rounded-xl font-display font-black text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
                pickerGameType === 'wheel'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md scale-[1.02]'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <span>🎰</span>
              <span>QUAY SỐ LỚN</span>
            </button>

            {/* 2. Duck Race */}
            <button
              onClick={() => setPickerGameType('duck')}
              className={`px-3.5 sm:px-4 py-2 rounded-xl font-display font-black text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
                pickerGameType === 'duck'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/30 scale-[1.02]'
                  : 'text-amber-300 hover:text-amber-200 hover:bg-amber-950/30'
              }`}
            >
              <span>🦆</span>
              <span>ĐUA VỊT</span>
            </button>

            {/* 3. Marble Drop */}
            <button
              onClick={() => setPickerGameType('marble')}
              className={`px-3.5 sm:px-4 py-2 rounded-xl font-display font-black text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
                pickerGameType === 'marble'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-500/30 scale-[1.02]'
                  : 'text-purple-300 hover:text-purple-200 hover:bg-purple-950/30'
              }`}
            >
              <span>🔮</span>
              <span>THẢ BI PLINKO</span>
            </button>

            {/* 4. Car Race */}
            <button
              onClick={() => setPickerGameType('car')}
              className={`px-3.5 sm:px-4 py-2 rounded-xl font-display font-black text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
                pickerGameType === 'car'
                  ? 'bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 text-white shadow-md shadow-red-500/30 scale-[1.02]'
                  : 'text-red-300 hover:text-red-200 hover:bg-red-950/30'
              }`}
            >
              <span>🏎️</span>
              <span>ĐUA XE F1</span>
            </button>

            {/* 5. Boat Race */}
            <button
              onClick={() => setPickerGameType('boat')}
              className={`px-3.5 sm:px-4 py-2 rounded-xl font-display font-black text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
                pickerGameType === 'boat'
                  ? 'bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 text-white shadow-md shadow-cyan-500/30 scale-[1.02]'
                  : 'text-cyan-300 hover:text-cyan-200 hover:bg-cyan-950/30'
              }`}
            >
              <span>🚣</span>
              <span>ĐUA THUYỀN RỒNG</span>
            </button>

            {/* 6. Magic Card Draw */}
            <button
              onClick={() => setPickerGameType('magic')}
              className={`px-3.5 sm:px-4 py-2 rounded-xl font-display font-black text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
                pickerGameType === 'magic'
                  ? 'bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 text-white shadow-md shadow-purple-500/30 scale-[1.02]'
                  : 'text-purple-300 hover:text-purple-200 hover:bg-purple-950/30'
              }`}
            >
              <span>🃏</span>
              <span>BÀI MA THUẬT</span>
            </button>

            {/* Fullscreen Button */}
            <button
              onClick={toggleGameFullscreen}
              className={`px-3.5 sm:px-4 py-2 rounded-xl font-display font-black text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer ${
                isGameFullscreen
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                  : 'bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 hover:text-white'
              }`}
              title={isGameFullscreen ? 'Thu nhỏ lại (Esc)' : 'Phóng to toàn màn hình máy chiếu (Phím F)'}
            >
              {isGameFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4 text-indigo-300" />}
              <span>{isGameFullscreen ? 'Thu nhỏ (Esc)' : 'Toàn màn hình (F)'}</span>
            </button>
          </div>
        </div>

        {/* Right: Roster Mode (Numbers vs Custom List) */}
        <div className="flex items-center flex-wrap gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-700/60">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 shrink-0">
            NGUỒN:
          </span>
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-800/80 border border-slate-700">
            <button
              onClick={() => setPickerMode('numbers')}
              className={`px-3 sm:px-3.5 py-1.5 rounded-xl font-display font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer ${
                pickerMode === 'numbers'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Hash className="w-3.5 h-3.5" />
              <span>Số (1–{studentCount})</span>
            </button>

            <button
              onClick={() => setPickerMode('customList')}
              className={`px-3 sm:px-3.5 py-1.5 rounded-xl font-display font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer ${
                pickerMode === 'customList'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Danh sách ({customList.length})</span>
            </button>
          </div>

          {/* Custom List Editor Button */}
          {pickerMode === 'customList' && (
            <button
              onClick={() => setIsEditorOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow transition-all cursor-pointer active:scale-95"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Nhập / Dán</span>
            </button>
          )}
        </div>
      </div>

      {/* Status Deck */}
      <div className={`p-4 sm:p-5 rounded-2xl border flex flex-wrap items-center justify-between gap-4 ${
        isLightMode 
          ? 'bg-white border-slate-200 shadow-sm' 
          : 'bg-slate-900/90 border-slate-800'
      }`}>
        <div className="flex items-center flex-wrap gap-4 sm:gap-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 block mb-0.5">
              TIẾN ĐỘ LƯỢT QUAY
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black font-display tabular-nums text-indigo-500">
                {pickerMode === 'numbers' ? pickedNumbers.length : pickedCustomItems.length}
              </span>
              <span className="text-lg font-bold text-slate-400">
                / {pickerMode === 'numbers' ? activeNumbers.length : activeCustomItems.length} {pickerMode === 'numbers' ? 'học sinh' : 'mục'}
              </span>
            </div>
          </div>

          <div className="h-10 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block mb-0.5">
              ĐANG TÍCH CHỌN THAM GIA
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black font-display tabular-nums text-amber-400">
                {pickerMode === 'numbers' ? selectedNumbers.length : selectedCustomItems.length}
              </span>
              <span className="text-sm font-semibold text-slate-400">
                / {pickerMode === 'numbers' ? studentCount : customList.length} tổng số
              </span>
            </div>
          </div>

          <div className="h-10 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block mb-0.5">
              CÒN LẠI CHƯA GỌI
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black font-display tabular-nums text-emerald-500">
                {pickerMode === 'numbers' ? remainingNumbers.length : remainingCustomItems.length}
              </span>
              <span className="text-sm font-semibold text-slate-400">
                {pickerMode === 'numbers' ? 'học sinh' : 'mục'}
              </span>
            </div>
          </div>
        </div>

        {/* Options and Reset */}
        <div className="flex items-center flex-wrap gap-3">
          {/* Batch pick selector */}
          <div className={`flex items-center gap-1 p-1 rounded-xl border ${
            isLightMode ? 'bg-slate-100 border-slate-200' : 'bg-slate-800 border-slate-700'
          }`}>
            <span className="text-xs font-semibold px-2 text-slate-500">Gọi một lần:</span>
            <button
              onClick={() => setBatchCount(1)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                batchCount === 1
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              1 mục
            </button>
            <button
              onClick={() => setBatchCount(2)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                batchCount === 2
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              2 mục (Cặp)
            </button>
          </div>

          {/* Reset round button */}
          <button
            onClick={pickerMode === 'numbers' ? handleResetNumbers : handleResetCustom}
            disabled={pickerMode === 'numbers' ? pickedNumbers.length === 0 : pickedCustomItems.length === 0}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              (pickerMode === 'numbers' ? pickedNumbers.length > 0 : pickedCustomItems.length > 0)
                ? isLightMode
                  ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                  : 'bg-rose-950/60 text-rose-300 hover:bg-rose-900 border border-rose-800'
                : 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-500'
            }`}
            title="Xóa danh sách đã gọi để bắt đầu lượt mới"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Lượt mới (Đặt lại)</span>
          </button>
        </div>
      </div>

      {/* Persistent Winner Alert on Screen: Displays whenever a student was chosen */}
      {((pickerMode === 'numbers' && latestPicksNumbers.length > 0) || (pickerMode === 'customList' && latestPickedItems.length > 0)) && (
        <div className={`p-4 sm:p-5 rounded-3xl border-2 flex flex-wrap items-center justify-between gap-4 shadow-xl animate-in fade-in slide-in-from-top-2 duration-300 ${
          isLightMode 
            ? 'bg-gradient-to-r from-amber-50 via-emerald-50 to-indigo-50 border-amber-300 shadow-amber-200/50' 
            : 'bg-gradient-to-r from-amber-950/40 via-emerald-950/40 to-slate-900 border-amber-500/60 shadow-amber-950/40'
        }`}>
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-2xl shadow-lg shadow-amber-400/40 animate-bounce">
              🏆
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-amber-500 block mb-0.5">
                NGƯỜI CHIẾN THẮNG VỪA ĐƯỢC CHỌN
              </span>
              <div className="text-2xl sm:text-4xl font-black font-display tracking-tight text-slate-900 dark:text-white flex items-center flex-wrap gap-2.5">
                {pickerMode === 'numbers' ? (
                  latestPicksNumbers.map((num, i) => (
                    <span key={num} className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-xl bg-amber-400 text-slate-950 text-xl sm:text-2xl font-black">
                        Số {num}
                      </span>
                      {customList[num - 1] && (
                        <span className="text-amber-500 dark:text-amber-300">{customList[num - 1]}</span>
                      )}
                      {i < latestPicksNumbers.length - 1 && <span className="text-slate-400">·</span>}
                    </span>
                  ))
                ) : (
                  latestPickedItems.map((item, i) => (
                    <span key={item} className="flex items-center gap-2 text-emerald-500 dark:text-emerald-300">
                      <span>{item}</span>
                      {i < latestPickedItems.length - 1 && <span className="text-slate-400">·</span>}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
            <span className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-slate-300">
              Đã ghi nhận vào lịch sử gọi
            </span>
          </div>
        </div>
      )}

      {/* Main Stage: Huge Rolling Display & Action Button */}
      <div className={
        isGameFullscreen
          ? 'fixed inset-0 z-50 bg-slate-950 p-4 sm:p-6 flex flex-col justify-start overflow-y-auto w-screen h-screen'
          : `rounded-3xl border p-6 sm:p-10 text-center flex flex-col items-center justify-center relative overflow-hidden transition-all ${
              isLightMode
                ? 'bg-gradient-to-b from-indigo-50/60 via-white to-slate-50 border-indigo-200/80 shadow-lg'
                : 'bg-gradient-to-b from-slate-900 via-indigo-950/30 to-slate-900 border-indigo-500/30 shadow-2xl shadow-indigo-950/50'
            }`
      }>
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Sticky Fullscreen Navigation Header when isGameFullscreen is active */}
        {isGameFullscreen && (
          <div className="w-full sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 mb-4 bg-slate-900/95 backdrop-blur-md border border-slate-800 px-4 py-3 rounded-2xl shadow-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black uppercase text-amber-400 flex items-center gap-1.5 mr-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>TRÒ CHƠI:</span>
              </span>
              <button
                onClick={() => setPickerGameType('wheel')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  pickerGameType === 'wheel' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>🎰</span>
                <span>Quay số</span>
              </button>
              <button
                onClick={() => setPickerGameType('duck')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  pickerGameType === 'duck' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>🦆</span>
                <span>Đua vịt</span>
              </button>
              <button
                onClick={() => setPickerGameType('marble')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  pickerGameType === 'marble' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>🔮</span>
                <span>Thả bi</span>
              </button>
              <button
                onClick={() => setPickerGameType('car')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  pickerGameType === 'car' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>🏎️</span>
                <span>Đua F1</span>
              </button>
              <button
                onClick={() => setPickerGameType('boat')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  pickerGameType === 'boat' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>🚣</span>
                <span>Thuyền rồng</span>
              </button>
              <button
                onClick={() => setPickerGameType('magic')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  pickerGameType === 'magic' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>🃏</span>
                <span>Bài ma thuật</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded-xl text-xs border border-slate-700">
                <span className="text-slate-400">Số lượng:</span>
                <button
                  onClick={() => setBatchCount(1)}
                  className={`px-2 py-0.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    batchCount === 1 ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  1 HS
                </button>
                <button
                  onClick={() => setBatchCount(2)}
                  className={`px-2 py-0.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    batchCount === 2 ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  2 HS
                </button>
              </div>

              <button
                onClick={toggleGameFullscreen}
                className="px-4 py-2 rounded-xl font-display font-black text-xs sm:text-sm bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5 shadow-lg shadow-rose-600/30 transition-all cursor-pointer active:scale-95"
                title="Thu nhỏ màn hình (Phím Esc hoặc F)"
              >
                <Minimize2 className="w-4 h-4" />
                <span>Thu nhỏ (Esc)</span>
              </button>
            </div>
          </div>
        )}

        {/* --- CASE A: NO ITEMS SELECTED / CHECKED --- */}
        {(pickerMode === 'numbers' ? selectedNumbers.length === 0 : selectedCustomItems.length === 0) ? (
          <div className="py-8 flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center border-2 border-amber-500">
              <AlertCircle className="w-10 h-10" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-display text-amber-400">
              CHƯA TÍCH CHỌN MỤC NÀO ĐỂ QUAY!
            </h2>
            <p className="text-sm sm:text-base text-slate-300 max-w-lg">
              Thầy/Cô hãy tích chọn ít nhất 1 {pickerMode === 'numbers' ? 'học sinh' : 'tên trong danh sách'} bên dưới để tham gia quay ngẫu nhiên.
            </p>
            <button
              onClick={pickerMode === 'numbers' ? handleSelectAllNumbers : handleSelectAllCustom}
              className="mt-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-base shadow-lg transition-transform active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <CheckCheck className="w-5 h-5" />
              <span>Tích chọn tất cả ({pickerMode === 'numbers' ? studentCount : customList.length} em)</span>
            </button>
          </div>
        ) : ((pickerMode === 'numbers' ? isAllNumbersPicked : isAllCustomPicked) && !winnerNotification) ? (
          /* --- CASE B: ALL CHECKED ITEMS WERE PICKED IN THIS ROUND --- */
          <div className="py-8 flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border-2 border-emerald-500">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-black font-display text-emerald-500">
              {pickerMode === 'numbers'
                ? `ĐÃ GỌI HẾT ${activeNumbers.length}/${activeNumbers.length} HỌC SINH ĐƯỢC CHỌN!`
                : `ĐÃ GỌI HẾT ${activeCustomItems.length}/${activeCustomItems.length} MỤC ĐƯỢC TÍCH CHỌN!`}
            </h2>
            <p className="text-base sm:text-lg text-slate-400 max-w-lg">
              Tất cả các mục được tích chọn đều đã được gọi một lượt. Thầy/Cô hãy bấm nút bên dưới để bắt đầu lượt mới.
            </p>
            <button
              onClick={pickerMode === 'numbers' ? handleResetNumbers : handleResetCustom}
              className="mt-4 px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xl shadow-xl shadow-emerald-600/30 transition-transform active:scale-95 flex items-center gap-3 cursor-pointer"
            >
              <RotateCcw className="w-6 h-6" />
              <span>BẮT ĐẦU LƯỢT MỚI</span>
            </button>
          </div>
        ) : pickerMode === 'customList' && customList.length === 0 ? (
          /* CASE C: EMPTY CUSTOM LIST */
          <div className="py-8 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black font-display">Chưa có danh sách nhập</h3>
            <p className="text-sm text-slate-400 max-w-md">
              Thầy/Cô hãy bấm nút bên dưới để dán hoặc nhập danh sách tên học sinh, câu hỏi, hoặc chủ đề.
            </p>
            <button
              onClick={() => setIsEditorOpen(true)}
              className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-2 cursor-pointer shadow-lg"
            >
              <Edit3 className="w-5 h-5" />
              <span>Nhập danh sách ngay</span>
            </button>
          </div>
        ) : pickerGameType === 'duck' ? (
          /* CASE D1: DUCK RACE GAME (30 SECONDS) */
          <div className="w-full">
            <DuckRaceGame
              candidates={pickerMode === 'numbers' ? remainingNumbers : remainingCustomItems}
              batchCount={batchCount}
              isLightMode={isLightMode}
              studentNames={customList}
              onSelectWinners={handleWinnersFromMiniGame}
              isGameFullscreen={isGameFullscreen}
              onToggleFullscreen={toggleGameFullscreen}
            />
          </div>
        ) : pickerGameType === 'marble' ? (
          /* CASE D2: MARBLE DROP GAME */
          <div className="w-full">
            <MarbleDropGame
              candidates={pickerMode === 'numbers' ? remainingNumbers : remainingCustomItems}
              batchCount={batchCount}
              isLightMode={isLightMode}
              studentNames={customList}
              onSelectWinners={handleWinnersFromMiniGame}
              isGameFullscreen={isGameFullscreen}
              onToggleFullscreen={toggleGameFullscreen}
            />
          </div>
        ) : pickerGameType === 'car' ? (
          /* CASE D3: F1 CAR RACE GAME */
          <div className="w-full">
            <CarRaceGame
              candidates={pickerMode === 'numbers' ? remainingNumbers : remainingCustomItems}
              batchCount={batchCount}
              isLightMode={isLightMode}
              studentNames={customList}
              onSelectWinners={handleWinnersFromMiniGame}
              isGameFullscreen={isGameFullscreen}
              onToggleFullscreen={toggleGameFullscreen}
            />
          </div>
        ) : pickerGameType === 'boat' ? (
          /* CASE D4: DRAGON BOAT RACE GAME */
          <div className="w-full">
            <BoatRaceGame
              candidates={pickerMode === 'numbers' ? remainingNumbers : remainingCustomItems}
              batchCount={batchCount}
              isLightMode={isLightMode}
              studentNames={customList}
              onSelectWinners={handleWinnersFromMiniGame}
              isGameFullscreen={isGameFullscreen}
              onToggleFullscreen={toggleGameFullscreen}
            />
          </div>
        ) : pickerGameType === 'magic' ? (
          /* CASE D5: MAGIC CARDS GAME */
          <div className="w-full">
            <MagicCardGame
              candidates={pickerMode === 'numbers' ? remainingNumbers : remainingCustomItems}
              batchCount={batchCount}
              isLightMode={isLightMode}
              studentNames={customList}
              onSelectWinners={handleWinnersFromMiniGame}
              isGameFullscreen={isGameFullscreen}
              onToggleFullscreen={toggleGameFullscreen}
            />
          </div>
        ) : (
          /* CASE D6: CLASSIC WHEEL / DIGITAL ROLLING */
          <div className="w-full flex flex-col items-center">
            {/* Quick Fullscreen button for Classic Wheel */}
            <div className="w-full flex justify-end mb-2">
              <button
                onClick={toggleGameFullscreen}
                className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                  isGameFullscreen
                    ? 'bg-indigo-500 text-white border-indigo-400'
                    : 'bg-slate-800 hover:bg-slate-700 text-indigo-300 border-slate-700'
                }`}
                title={isGameFullscreen ? 'Thu nhỏ lại (Esc)' : 'Phóng to toàn màn hình máy chiếu (Phím F)'}
              >
                {isGameFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                <span className="hidden sm:inline">{isGameFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}</span>
              </button>
            </div>

            <span className="text-sm sm:text-base font-bold tracking-widest uppercase text-indigo-400 mb-2">
              {isRolling
                ? 'ĐANG QUAY NGẪU NHIÊN...'
                : (pickerMode === 'numbers' ? latestPicksNumbers.length > 0 : latestPickedItems.length > 0)
                  ? 'KẾT QUẢ VỪA CHỌN'
                  : 'SẴN SÀNG QUAY'}
            </span>

            {/* Giant Stage Display */}
            <div className="my-4 min-h-[180px] sm:min-h-[220px] flex items-center justify-center w-full max-w-4xl px-4">
              {pickerMode === 'numbers' ? (
                /* --- NUMBERS MODE DISPLAY --- */
                latestPicksNumbers.length === 2 && !isRolling ? (
                  <div className="flex items-center gap-4 sm:gap-8 flex-wrap justify-center">
                    {latestPicksNumbers.map((num, idx) => (
                      <div
                        key={idx}
                        className={`px-8 py-6 rounded-3xl border-4 transition-all transform hover:scale-105 text-center ${
                          isLightMode
                            ? 'bg-white border-indigo-500 shadow-xl text-indigo-600'
                            : 'bg-indigo-950/80 border-indigo-400 shadow-2xl shadow-indigo-500/40 text-indigo-300'
                        }`}
                      >
                        <span className="text-xs sm:text-sm font-bold uppercase tracking-wider block text-slate-400 mb-1">
                          HỌC SINH {idx + 1}
                        </span>
                        <span className="text-7xl sm:text-9xl font-black font-display tabular-nums tracking-tighter block">
                          {num}
                        </span>
                        {customList[num - 1] && (
                          <span className="mt-2 text-xl sm:text-2xl font-black text-amber-400 block truncate max-w-[280px]">
                            {customList[num - 1]}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={`transition-all duration-150 transform ${isRolling ? 'scale-110' : 'scale-100'}`}>
                    {currentDisplayNumber !== null ? (
                      <div className="flex flex-col items-center">
                        <div className={`px-10 sm:px-16 py-8 sm:py-10 rounded-3xl border-4 transition-all text-center ${
                          isLightMode
                            ? isRolling 
                              ? 'bg-indigo-50 border-indigo-400 shadow-lg text-indigo-600'
                              : 'bg-white border-emerald-500 shadow-2xl text-emerald-600'
                            : isRolling
                              ? 'bg-slate-800/90 border-indigo-500 shadow-xl text-indigo-300'
                              : 'bg-indigo-950 border-emerald-400 shadow-2xl shadow-emerald-500/30 text-emerald-300 ring-8 ring-emerald-500/20'
                        }`}>
                          <span className="text-8xl sm:text-[13rem] font-black font-display tabular-nums tracking-tighter leading-none block">
                            {currentDisplayNumber}
                          </span>
                          {customList[currentDisplayNumber - 1] && !isRolling && (
                            <div className="mt-4 pt-3 border-t border-emerald-500/30 flex flex-col items-center justify-center">
                              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                                HỌ VÀ TÊN HỌC SINH
                              </span>
                              <span className="text-3xl sm:text-5xl md:text-6xl font-black font-display text-amber-400 drop-shadow-md">
                                {customList[currentDisplayNumber - 1]}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="px-8 py-10 rounded-3xl border-2 border-dashed border-indigo-400/40 text-slate-400 flex flex-col items-center gap-2">
                        <Sparkles className="w-12 h-12 text-indigo-400 animate-pulse" />
                        <span className="text-xl sm:text-2xl font-bold font-display">
                          Bấm nút để chọn ngẫu nhiên
                        </span>
                        <span className="text-xs sm:text-sm text-slate-500">
                          (Đang tích chọn {activeNumbers.length}/{studentCount} học sinh · Mỗi số chỉ gọi 1 lần)
                        </span>
                      </div>
                    )}
                  </div>
                )
              ) : (
                /* --- CUSTOM LIST MODE DISPLAY --- */
                latestPickedItems.length === 2 && !isRolling ? (
                  <div className="flex items-center gap-4 sm:gap-6 flex-wrap justify-center w-full">
                    {latestPickedItems.map((item, idx) => (
                      <div
                        key={idx}
                        className={`flex-1 min-w-[280px] max-w-md px-6 py-5 rounded-3xl border-4 transition-all ${
                          isLightMode
                            ? 'bg-white border-emerald-500 shadow-xl text-slate-900'
                            : 'bg-indigo-950/90 border-emerald-400 shadow-2xl text-white'
                        }`}
                      >
                        <span className="text-xs font-bold uppercase tracking-wider block text-emerald-400 mb-1">
                          KẾT QUẢ {idx + 1}
                        </span>
                        <span className="text-2xl sm:text-4xl font-black font-display tracking-tight break-words">
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={`w-full transition-all duration-150 transform ${isRolling ? 'scale-105' : 'scale-100'}`}>
                    {currentDisplayItem !== null ? (
                      <div className="flex flex-col items-center">
                        <div className={`w-full max-w-3xl px-8 sm:px-14 py-8 sm:py-10 rounded-3xl border-4 transition-all ${
                          isLightMode
                            ? isRolling
                              ? 'bg-indigo-50 border-indigo-400 shadow-lg text-indigo-900'
                              : 'bg-white border-emerald-500 shadow-2xl text-slate-900 ring-8 ring-emerald-500/20'
                            : isRolling
                              ? 'bg-slate-800/90 border-indigo-500 shadow-xl text-indigo-200'
                              : 'bg-indigo-950 border-emerald-400 shadow-2xl shadow-emerald-500/30 text-white ring-8 ring-emerald-500/20'
                        }`}>
                          <span className="text-3xl sm:text-5xl md:text-6xl font-black font-display tracking-tight leading-tight block break-words">
                            {currentDisplayItem}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="px-8 py-10 rounded-3xl border-2 border-dashed border-indigo-400/40 text-slate-400 flex flex-col items-center gap-2">
                        <Sparkles className="w-12 h-12 text-indigo-400 animate-pulse" />
                        <span className="text-xl sm:text-2xl font-bold font-display">
                          Bấm nút để chọn ngẫu nhiên từ danh sách
                        </span>
                        <span className="text-xs sm:text-sm text-slate-500">
                          (Đang tích chọn {activeCustomItems.length}/{customList.length} mục tham gia quay)
                        </span>
                      </div>
                    )}
                  </div>
                )
              )}
            </div>

            {/* Giant Big Roll Button */}
            <div className="mt-4 flex flex-col items-center gap-2">
              <button
                onClick={pickerMode === 'numbers' ? handleRollNumbers : handleRollCustom}
                disabled={isRolling || (pickerMode === 'numbers' ? isAllNumbersPicked || remainingNumbers.length === 0 : isAllCustomPicked || remainingCustomItems.length === 0)}
                className={`w-full sm:w-auto px-10 sm:px-16 py-5 sm:py-6 rounded-2xl sm:rounded-3xl font-black font-display text-2xl sm:text-4xl tracking-wide flex items-center justify-center gap-4 transition-all cursor-pointer shadow-2xl ${
                  isRolling
                    ? 'bg-slate-700 text-slate-400 cursor-wait'
                    : isLightMode
                      ? 'bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 hover:from-indigo-500 hover:to-indigo-700 text-white shadow-indigo-600/40 hover:scale-[1.02] active:scale-[0.98]'
                      : 'bg-gradient-to-r from-indigo-500 via-indigo-600 to-emerald-600 hover:from-indigo-400 hover:to-emerald-500 text-white shadow-indigo-500/50 hover:scale-[1.02] active:scale-[0.98]'
                }`}
              >
                <Shuffle className={`w-8 h-8 sm:w-10 sm:h-10 ${isRolling ? 'animate-spin' : ''}`} />
                <span>{isRolling ? 'ĐANG QUAY...' : 'CHỌN NGẪU NHIÊN'}</span>
              </button>

              <span className="text-xs sm:text-sm text-slate-400 font-medium">
                Mẹo: Thầy/Cô có thể nhấn phím <kbd className="px-2 py-0.5 rounded bg-slate-700 text-white font-mono text-xs">Space (Phím cách)</kbd> hoặc chuột trình chiếu
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Grid of items (Numbers or Custom List) with Checkbox Selection */}
      <div className={`p-5 sm:p-6 rounded-3xl border ${
        isLightMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/90 border-slate-800'
      }`}>
        {pickerMode === 'numbers' ? (
          /* --- NUMBERS GRID --- */
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="text-base sm:text-lg font-bold font-display">
                    BẢNG SĨ SỐ (1 – {studentCount}) · TÍCH CHỌN SỐ QUAY
                  </h3>
                  <span className="text-xs text-slate-400 block">
                    Nhấp vào số bất kỳ để bật/tắt (loại trừ học sinh vắng hoặc chọn trước danh sách)
                  </span>
                </div>
              </div>

              {/* Bulk Check Buttons for Numbers */}
              <div className="flex items-center flex-wrap gap-2 text-xs">
                <button
                  onClick={handleSelectAllNumbers}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>Chọn tất cả ({studentCount})</span>
                </button>
                <button
                  onClick={handleDeselectAllNumbers}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Square className="w-4 h-4" />
                  <span>Bỏ chọn hết</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 sm:gap-2.5">
              {allNumbers.map((num) => {
                const isSelected = selectedNumbers.includes(num);
                const isPicked = pickedNumbers.includes(num);
                const isCurrent = latestPicksNumbers.includes(num);
                const orderIndex = pickedNumbers.indexOf(num);

                return (
                  <div
                    key={num}
                    onClick={() => handleToggleNumber(num)}
                    className={`relative py-3 sm:py-3.5 px-1 rounded-xl text-center font-display font-black text-lg sm:text-xl transition-all select-none cursor-pointer group ${
                      isCurrent
                        ? 'bg-amber-400 text-slate-950 ring-4 ring-amber-300 scale-105 z-10 shadow-lg'
                        : isPicked
                          ? isLightMode
                            ? 'bg-slate-100 text-slate-400 border border-slate-200 line-through opacity-70'
                            : 'bg-slate-800/60 text-slate-500 border border-slate-800 line-through opacity-60'
                          : !isSelected
                            ? isLightMode
                              ? 'bg-slate-100/60 text-slate-400 border border-dashed border-slate-300 opacity-40'
                              : 'bg-slate-900 text-slate-600 border border-dashed border-slate-800 opacity-40'
                            : isLightMode
                              ? 'bg-indigo-50/80 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 shadow-xs'
                              : 'bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 hover:border-emerald-500/60 shadow-sm'
                    }`}
                    title={
                      isPicked
                        ? `Số ${num} (Đã gọi lượt #${orderIndex + 1})`
                        : !isSelected
                          ? `Số ${num} (Đang bỏ chọn - không tham gia quay)`
                          : `Số ${num} (Đang chọn quay - nhấp để bỏ chọn)`
                    }
                  >
                    <span className="tabular-nums">{num}</span>

                    {/* Small checkbox indicator */}
                    <div className="absolute top-1 left-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                      {isSelected ? (
                        <div className="w-2 h-2 rounded-full bg-emerald-400" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-slate-600" />
                      )}
                    </div>

                    {isPicked && (
                      <span className="absolute -top-1.5 -right-1 text-[9px] bg-slate-600 text-white px-1 rounded-full font-mono font-normal">
                        #{orderIndex + 1}
                      </span>
                    )}

                    {!isSelected && !isPicked && (
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] bg-slate-800 text-slate-400 px-1 rounded font-normal whitespace-nowrap">
                        Bỏ qua
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {pickedNumbers.length > 0 && (
              <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto text-xs sm:text-sm">
                <span className="font-bold text-slate-400 shrink-0">Thứ tự đã gọi:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {pickedNumbers.map((num, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleRemoveNumber(num)}
                      className={`px-2.5 py-1 rounded-lg font-bold font-mono text-xs flex items-center gap-1 group transition-colors ${
                        isLightMode 
                          ? 'bg-slate-200 hover:bg-rose-100 text-slate-700 hover:text-rose-700' 
                          : 'bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 border border-slate-700'
                      }`}
                      title={`Bấm để hoàn lại số ${num} vào danh sách chưa gọi (nếu vắng)`}
                    >
                      <span>{num}</span>
                      <span className="text-[10px] opacity-0 group-hover:opacity-100 text-rose-500 font-sans">×</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* --- CUSTOM LIST CARDS WITH CHECKBOXES --- */
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-base sm:text-lg font-bold font-display flex items-center gap-2">
                    <span>DANH SÁCH MỤC ĐÃ NHẬP</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Tích chọn {selectedCustomItems.length}/{customList.length} mục
                    </span>
                  </h3>
                  <span className="text-xs text-slate-400 block">
                    Tích chọn những học sinh tham gia lượt quay này (bỏ tích học sinh vắng hoặc không quay)
                  </span>
                </div>
              </div>

              {/* Bulk Selection Actions */}
              <div className="flex items-center flex-wrap gap-2 text-xs">
                <button
                  onClick={handleSelectAllCustom}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5 shadow transition-all cursor-pointer"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>Chọn tất cả ({customList.length})</span>
                </button>
                <button
                  onClick={handleDeselectAllCustom}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
                >
                  <Square className="w-4 h-4" />
                  <span>Bỏ chọn hết</span>
                </button>
                <button
                  onClick={handleInvertCustom}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Đảo chọn</span>
                </button>
              </div>
            </div>

            {/* Grid of Custom Item Cards with Checkboxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {customList.map((item, idx) => {
                const isSelected = selectedCustomItems.includes(item);
                const isPicked = pickedCustomItems.includes(item);
                const isCurrent = latestPickedItems.includes(item);
                const orderIndex = pickedCustomItems.indexOf(item);

                return (
                  <div
                    key={idx}
                    onClick={() => handleToggleCustomItem(item)}
                    className={`relative p-3.5 rounded-2xl border-2 transition-all text-sm font-bold flex items-center justify-between gap-3 cursor-pointer select-none group ${
                      isCurrent
                        ? 'bg-amber-400 text-slate-950 border-amber-500 ring-4 ring-amber-300 shadow-lg scale-[1.02] z-10'
                        : isPicked
                          ? isLightMode
                            ? 'bg-slate-100 text-slate-400 border-slate-200 line-through opacity-70'
                            : 'bg-slate-900/60 text-slate-500 border-slate-800 line-through opacity-60'
                          : !isSelected
                            ? isLightMode
                              ? 'bg-slate-100/60 text-slate-400 border-dashed border-slate-300 opacity-45'
                              : 'bg-slate-950 text-slate-600 border-dashed border-slate-800 opacity-40 hover:opacity-70'
                            : isLightMode
                              ? 'bg-white hover:bg-indigo-50 text-slate-800 border-slate-300 hover:border-indigo-400 shadow-sm'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700 hover:border-emerald-500/80 shadow-md'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      {/* Interactive Checkbox */}
                      <div className="shrink-0">
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-500" />
                        )}
                      </div>

                      <span className="text-xs text-indigo-400 font-mono shrink-0">#{idx + 1}</span>
                      <span className="truncate">{item}</span>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5">
                      {isPicked ? (
                        <span className="text-[10px] bg-slate-600 text-white px-2 py-0.5 rounded-full font-mono">
                          Đã gọi #{orderIndex + 1}
                        </span>
                      ) : !isSelected ? (
                        <span className="text-[10px] bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full font-medium border border-slate-700">
                          Bỏ qua
                        </span>
                      ) : (
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-medium border border-emerald-500/20">
                          Sẵn sàng
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {pickedCustomItems.length > 0 && (
              <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto text-xs sm:text-sm">
                <span className="font-bold text-slate-400 shrink-0">Đã gọi:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {pickedCustomItems.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveCustomItem(item);
                      }}
                      className={`px-3 py-1 rounded-lg font-semibold text-xs flex items-center gap-1.5 group transition-colors ${
                        isLightMode 
                          ? 'bg-slate-200 hover:bg-rose-100 text-slate-700 hover:text-rose-700' 
                          : 'bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 border border-slate-700'
                      }`}
                      title={`Bấm để hoàn lại "${item}" vào danh sách chưa gọi`}
                    >
                      <span>{item}</span>
                      <span className="text-rose-500 font-bold">×</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal: Custom List Editor */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-2xl rounded-3xl border-4 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 ${
            isLightMode ? 'bg-white border-indigo-500' : 'bg-slate-900 border-indigo-500'
          }`}>
            {/* Modal Header */}
            <div className="p-5 bg-indigo-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-6 h-6" />
                <h3 className="text-xl font-black font-display uppercase tracking-wide">
                  NHẬP / DÁN DANH SÁCH TÙY CHỌN
                </h3>
              </div>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs sm:text-sm font-semibold text-slate-400">
                  Nhập mỗi dòng 1 mục (Tên học sinh, câu hỏi, chủ đề):
                </span>
                <span className="text-xs font-mono font-bold text-indigo-400">
                  {editorText.split('\n').filter((l) => l.trim().length > 0).length} mục
                </span>
              </div>

              {/* Textarea */}
              <textarea
                value={editorText}
                onChange={(e) => setEditorText(e.target.value)}
                placeholder="Nhập hoặc dán danh sách tại đây...&#10;Ví dụ:&#10;Nguyễn Văn An&#10;Trần Thị Bình&#10;Lê Văn Cường"
                rows={10}
                className={`w-full p-4 rounded-2xl border font-mono text-sm sm:text-base outline-none resize-none leading-relaxed ${
                  isLightMode
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-500'
                    : 'bg-slate-950 border-slate-700 text-white focus:border-indigo-400'
                }`}
              />

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-400">Mẫu sẵn:</span>
                <button
                  type="button"
                  onClick={() => setEditorText(PRESET_STUDENT_NAMES.join('\n'))}
                  className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 text-xs font-semibold cursor-pointer"
                >
                  Mẫu tên học sinh (16 em)
                </button>
                <button
                  type="button"
                  onClick={() => setEditorText(PRESET_QUESTIONS.join('\n'))}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-xs font-semibold cursor-pointer"
                >
                  Mẫu câu hỏi bài học
                </button>
                <button
                  type="button"
                  onClick={() => setEditorText('')}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 text-xs font-semibold flex items-center gap-1 cursor-pointer ml-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa hết</span>
                </button>
              </div>

              {/* Modal Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-700">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const lines = editorText
                        .split('\n')
                        .map((l) => l.trim())
                        .filter((l) => l.length > 0);
                      onSaveToActiveClass(lines);
                      setIsEditorOpen(false);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white border border-indigo-500/40 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                    title={`Lưu danh sách này vào ${activeClass?.name || 'lớp hiện tại'}`}
                  >
                    <span>💾 Lưu vào {activeClass?.name || 'lớp'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsEditorOpen(false);
                      onOpenClassManager();
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>📂 Quản lý các lớp</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditorOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-bold cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleSaveEditor}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-black flex items-center gap-2 cursor-pointer shadow-lg"
                  >
                    <Check className="w-4 h-4" />
                    <span>Áp dụng danh sách</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Classroom Winner Announcement Notification Modal */}
      {winnerNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in zoom-in duration-200">
          <div className="relative w-full max-w-2xl rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 border-2 border-amber-400 shadow-2xl shadow-amber-500/30 p-6 sm:p-8 flex flex-col items-center text-center">
            {/* Close Button top-right */}
            <button
              onClick={() => setWinnerNotification(null)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-slate-700"
              title="Đóng thông báo"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Glowing Trophy Icon */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-slate-950 shadow-xl shadow-amber-500/40 mb-3 animate-bounce">
              <Trophy className="w-12 h-12 sm:w-14 sm:h-14 fill-current" />
            </div>

            {/* Header Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs sm:text-sm font-black uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              <span>THÔNG BÁO NGƯỜI CHIẾN THẮNG</span>
              <Sparkles className="w-4 h-4" />
            </div>

            <p className="text-xs sm:text-sm text-slate-400 mb-4">
              Kết quả từ: <strong className="text-white">{winnerNotification.icon} {winnerNotification.gameModeName}</strong>
            </p>

            {/* Winner Name Cards */}
            <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-4 my-2">
              {winnerNotification.winners.map((winner, idx) => (
                <div
                  key={idx}
                  className="w-full flex-1 p-6 rounded-3xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 text-slate-950 shadow-2xl border-4 border-white flex flex-col items-center justify-center transform hover:scale-[1.02] transition-transform"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-black uppercase tracking-wider text-amber-950">
                      {winnerNotification.winners.length > 1 ? `HẠNG ${idx + 1}` : '🏆 QUÁN QUÂN'}
                    </span>
                    {winner.number && (
                      <span className="text-xs font-black bg-slate-950 text-amber-300 px-2.5 py-0.5 rounded-full font-display">
                        Số #{winner.number}
                      </span>
                    )}
                  </div>
                  <h2 className="text-4xl sm:text-5xl md:text-6xl font-black font-display tracking-tight text-slate-950 my-1 leading-tight break-words">
                    {winner.studentName}
                  </h2>
                </div>
              ))}
            </div>

            <p className="text-xs sm:text-sm text-emerald-400 font-bold mt-4 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Đã tự động lưu vào danh sách học sinh đã gọi của lớp!</span>
            </p>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 w-full">
              <button
                onClick={() => setWinnerNotification(null)}
                className="w-full sm:w-auto px-10 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black font-display text-base sm:text-lg shadow-xl shadow-amber-500/30 transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>XÁC NHẬN & TIẾP TỤC</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
