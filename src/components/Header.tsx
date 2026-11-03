import React from 'react';
import { Volume2, VolumeX, Maximize2, Minimize2, Sun, Moon, Users, School, FolderOpen } from 'lucide-react';
import { soundManager } from '../services/sound';
import { SavedClass } from '../types';

interface HeaderProps {
  studentCount: number;
  setStudentCount: (count: number) => void;
  isSoundEnabled: boolean;
  setIsSoundEnabled: (enabled: boolean) => void;
  isLightMode: boolean;
  setIsLightMode: (light: boolean) => void;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  activeClass: SavedClass | null;
  savedClasses: SavedClass[];
  onSelectClass: (cls: SavedClass) => void;
  onOpenClassManager: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  studentCount,
  setStudentCount,
  isSoundEnabled,
  setIsSoundEnabled,
  isLightMode,
  setIsLightMode,
  isFullscreen,
  toggleFullscreen,
  activeClass,
  savedClasses,
  onSelectClass,
  onOpenClassManager,
}) => {
  const handleToggleSound = () => {
    const newState = soundManager.toggle();
    setIsSoundEnabled(newState);
  };

  const handleAdjustCount = (delta: number) => {
    const next = Math.max(5, Math.min(60, studentCount + delta));
    setStudentCount(next);
  };

  return (
    <header className={`px-4 sm:px-6 py-3 border-b transition-colors ${
      isLightMode 
        ? 'bg-white border-slate-200 text-slate-900 shadow-sm' 
        : 'bg-slate-900/90 backdrop-blur border-slate-800 text-white'
    }`}>
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand Zone - Single text element wordmark */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center text-white font-black text-xl shadow-md">
            TL
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight font-display flex items-center gap-2">
              <span>TRỢ LÝ LỚP HỌC</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                isLightMode ? 'bg-indigo-100 text-indigo-700' : 'bg-indigo-950 text-indigo-300 border border-indigo-700/50'
              }`}>
                THCS · MÁY CHIẾU
              </span>
            </h1>
          </div>
        </div>

        {/* Global Controls & Class Switcher */}
        <div className="flex items-center flex-wrap gap-2 sm:gap-3">
          {/* Active Class Switcher & Manager Button */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${
            isLightMode 
              ? 'bg-indigo-50/80 border-indigo-200 text-slate-800' 
              : 'bg-slate-800/80 border-slate-700 text-slate-200'
          }`}>
            <School className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs sm:text-sm font-semibold hidden sm:inline">Lớp:</span>

            <select
              value={activeClass?.id || ''}
              onChange={(e) => {
                const found = savedClasses.find((c) => c.id === e.target.value);
                if (found) onSelectClass(found);
              }}
              aria-label="Chọn lớp học đã lưu"
              className={`text-xs sm:text-sm font-black rounded-lg px-2 py-1 outline-none cursor-pointer max-w-[130px] truncate ${
                isLightMode 
                  ? 'bg-white border border-slate-300 text-indigo-900' 
                  : 'bg-slate-900 border border-slate-700 text-emerald-300'
              }`}
            >
              {savedClasses.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({cls.studentCount} HS)
                </option>
              ))}
            </select>

            <button
              onClick={onOpenClassManager}
              className="p-1 rounded-lg hover:bg-black/20 text-indigo-400 hover:text-white transition-colors cursor-pointer"
              title="Quản lý / Thêm / Sửa danh sách các lớp đã lưu"
            >
              <FolderOpen className="w-4 h-4" />
            </button>
          </div>

          {/* Class size selector */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${
            isLightMode 
              ? 'bg-slate-50 border-slate-300 text-slate-800' 
              : 'bg-slate-800/80 border-slate-700 text-slate-200'
          }`}>
            <Users className="w-4 h-4 text-indigo-400" />
            <span className="text-xs sm:text-sm font-semibold">Sĩ số:</span>
            
            <button
              onClick={() => handleAdjustCount(-1)}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-sm font-bold transition-transform active:scale-95 cursor-pointer"
              title="Giảm 1 học sinh"
            >
              −
            </button>
            <span className="w-8 text-center font-black text-base sm:text-lg text-indigo-500 tabular-nums">
              {studentCount}
            </span>
            <button
              onClick={() => handleAdjustCount(1)}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-sm font-bold transition-transform active:scale-95 cursor-pointer"
              title="Tăng 1 học sinh"
            >
              +
            </button>

            {/* Quick preset selector */}
            <select
              value={studentCount}
              onChange={(e) => setStudentCount(Number(e.target.value))}
              aria-label="Chọn sĩ số nhanh"
              className={`ml-1 text-xs font-semibold rounded-lg px-2 py-1 outline-none cursor-pointer ${
                isLightMode 
                  ? 'bg-white border border-slate-300 text-slate-700' 
                  : 'bg-slate-900 border border-slate-700 text-slate-300'
              }`}
            >
              {[30, 35, 38, 40, 42, 45, 48, 50].map((num) => (
                <option key={num} value={num}>
                  {num} HS
                </option>
              ))}
            </select>
          </div>

          {/* Quick Teacher Soundboard for classroom interaction */}
          <div className={`hidden lg:flex items-center gap-1 px-2 py-1 rounded-xl border ${
            isLightMode ? 'bg-slate-50 border-slate-300' : 'bg-slate-800/80 border-slate-700'
          }`}>
            <button
              onClick={() => soundManager.playApplause()}
              className="px-2 py-1 rounded-lg text-xs font-bold text-amber-400 hover:bg-amber-400/20 transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
              title="Tiếng vỗ tay hoan hô học sinh"
            >
              <span>👏</span>
              <span className="hidden xl:inline">Vỗ tay</span>
            </button>
            <button
              onClick={() => soundManager.playCorrectChime()}
              className="px-2 py-1 rounded-lg text-xs font-bold text-emerald-400 hover:bg-emerald-400/20 transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
              title="Chuông báo trả lời đúng (Ting ting!)"
            >
              <span>🔔</span>
              <span className="hidden xl:inline">Đúng rồi!</span>
            </button>
            <button
              onClick={() => soundManager.playTryAgain()}
              className="px-2 py-1 rounded-lg text-xs font-bold text-indigo-400 hover:bg-indigo-400/20 transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
              title="Âm thanh động viên (Cố lên!)"
            >
              <span>💡</span>
              <span className="hidden xl:inline">Cố lên</span>
            </button>
          </div>

          {/* Sound toggle */}
          <button
            onClick={handleToggleSound}
            className={`p-2 rounded-xl border flex items-center gap-1.5 text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
              isSoundEnabled
                ? isLightMode
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
                : isLightMode
                  ? 'bg-slate-100 border-slate-200 text-slate-500'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
            title={isSoundEnabled ? 'Đang bật âm thanh máy chiếu' : 'Đang tắt âm thanh'}
          >
            {isSoundEnabled ? <Volume2 className="w-4 h-4 text-emerald-500" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden md:inline">{isSoundEnabled ? 'Âm báo' : 'Tắt tiếng'}</span>
          </button>

          {/* Light/Dark Projector Mode */}
          <button
            onClick={() => setIsLightMode(!isLightMode)}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              isLightMode
                ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
            }`}
            title={isLightMode ? 'Chuyển sang Chế độ Máy chiếu Tối' : 'Chuyển sang Chế độ Máy chiếu Sáng'}
          >
            {isLightMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>

          {/* Fullscreen toggle */}
          <button
            onClick={toggleFullscreen}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
            title="Trình chiếu toàn màn hình (F11)"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
