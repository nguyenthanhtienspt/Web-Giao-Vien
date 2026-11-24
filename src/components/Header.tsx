import React from 'react';
import { Volume2, VolumeX, Maximize2, Minimize2, Sun, Moon, School, FolderOpen, UserCheck, Mic, FileSpreadsheet, RefreshCw } from 'lucide-react';
import { soundManager } from '../services/sound';
import { SavedClass } from '../types';
import { sortClassesByGrade } from '../services/classStorage';

interface HeaderProps {
  studentCount?: number;
  setStudentCount?: (count: number) => void;
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
  absentCount: number;
  onOpenAttendance: () => void;
  onOpenNoiseMeter: () => void;
  sheetSyncStatus: 'locked' | 'idle' | 'syncing' | 'synced' | 'error';
  onOpenGoogleSheet: () => void;
}

export const Header: React.FC<HeaderProps> = ({
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
  absentCount,
  onOpenAttendance,
  onOpenNoiseMeter,
  sheetSyncStatus,
  onOpenGoogleSheet,
}) => {
  const handleToggleSound = () => {
    const newState = soundManager.toggle();
    setIsSoundEnabled(newState);
  };

  return (
    <header className={`px-4 sm:px-6 py-3 border-b transition-colors ${
      isLightMode 
        ? 'bg-white border-slate-200 text-slate-900 shadow-sm' 
        : 'bg-slate-900/90 backdrop-blur border-slate-800 text-white'
    }`}>
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand Zone */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center text-white font-black text-xl shadow-md">
            TL
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight font-display">
              TRỢ LÝ LỚP HỌC
            </h1>
          </div>
        </div>

        {/* Global Controls & Class Switcher */}
        <div className="flex items-center flex-wrap gap-2 sm:gap-2.5">
          {/* Active Class Switcher & Manager Button */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${
            isLightMode 
              ? 'bg-indigo-50/80 border-indigo-200 text-slate-800' 
              : 'bg-slate-800/80 border-slate-700 text-slate-200'
          }`}>
            <School className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="text-xs sm:text-sm font-semibold hidden sm:inline">Lớp:</span>

            <select
              value={activeClass?.id || ''}
              onChange={(e) => {
                const found = savedClasses.find((c) => c.id === e.target.value);
                if (found) onSelectClass(found);
              }}
              aria-label="Chọn lớp học đã lưu"
              className={`text-xs sm:text-sm font-black rounded-lg px-2 py-1 outline-none cursor-pointer ${
                isLightMode 
                  ? 'bg-white border border-slate-300 text-indigo-900' 
                  : 'bg-slate-900 border border-slate-700 text-emerald-300'
              }`}
            >
              {sortClassesByGrade(savedClasses).map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>

            <button
              onClick={onOpenClassManager}
              className={`p-1 rounded-lg transition-colors cursor-pointer ${
                isLightMode ? 'hover:bg-indigo-100 text-indigo-600' : 'hover:bg-black/20 text-indigo-400 hover:text-white'
              }`}
              title="Quản lý / Thêm / Sửa danh sách các lớp đã lưu"
            >
              <FolderOpen className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Attendance Button */}
          <button
            onClick={onOpenAttendance}
            className={`px-2.5 py-2 rounded-xl border flex items-center gap-1.5 text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
              absentCount > 0
                ? 'bg-rose-500/15 border-rose-500/50 text-rose-500'
                : isLightMode
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
            }`}
            title="Điểm danh học sinh vắng mặt đầu giờ"
          >
            <UserCheck className="w-4 h-4 text-emerald-500" />
            <span className="hidden lg:inline">Điểm danh</span>
            {absentCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[11px] font-black tabular-nums">
                Vắng {absentCount}
              </span>
            )}
          </button>

          {/* Google Sheet Database Sync Button */}
          <button
            onClick={onOpenGoogleSheet}
            className={`px-2.5 py-2 rounded-xl border flex items-center gap-1.5 text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
              sheetSyncStatus === 'synced'
                ? isLightMode
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
                : sheetSyncStatus === 'syncing'
                  ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400'
                  : sheetSyncStatus === 'error'
                    ? 'bg-rose-500/15 border-rose-500/40 text-rose-400'
                    : isLightMode
                      ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                      : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
            }`}
            title="Đồng bộ dữ liệu với Google Sheet cá nhân của Thầy"
          >
            {sheetSyncStatus === 'syncing' ? (
              <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
            ) : (
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            )}
            <span className="hidden lg:inline">
              {sheetSyncStatus === 'syncing'
                ? 'Đang lưu Sheet...'
                : sheetSyncStatus === 'synced'
                  ? 'Sheet ✓'
                  : 'Google Sheet'}
            </span>
            {sheetSyncStatus !== 'locked' && sheetSyncStatus !== 'syncing' && (
              <span
                className={`w-2 h-2 rounded-full ${
                  sheetSyncStatus === 'error' ? 'bg-rose-500' : 'bg-emerald-400'
                }`}
              />
            )}
          </button>

          {/* Classroom Noise Meter Button */}
          <button
            onClick={onOpenNoiseMeter}
            className={`p-2 sm:px-2.5 rounded-xl border flex items-center gap-1.5 text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
              isLightMode
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
            }`}
            title="Đồng hồ đo tiếng ồn lớp học"
          >
            <Mic className="w-4 h-4 text-amber-500" />
            <span className="hidden xl:inline">Đo ồn</span>
          </button>

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
