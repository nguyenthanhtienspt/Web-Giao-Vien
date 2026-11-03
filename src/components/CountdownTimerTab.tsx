import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Plus, Bell, Volume2, Sparkles, AlertTriangle, Maximize2, Minimize2 } from 'lucide-react';
import { soundManager } from '../services/sound';

interface CountdownTimerTabProps {
  isLightMode: boolean;
}

export const CountdownTimerTab: React.FC<CountdownTimerTabProps> = ({ isLightMode }) => {
  // Duration in seconds (default 5 minutes = 300 seconds)
  const [initialDuration, setInitialDuration] = useState<number>(300);
  const [timeLeft, setTimeLeft] = useState<number>(300);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isTimeUp, setIsTimeUp] = useState<boolean>(false);
  const [tickAudioEnabled, setTickAudioEnabled] = useState<boolean>(true);
  const [isTimerFullscreen, setIsTimerFullscreen] = useState<boolean>(false);

  // Custom minute input
  const [customMinutes, setCustomMinutes] = useState<number>(5);

  const timerRef = useRef<number | null>(null);

  // Fullscreen toggle handler
  const toggleTimerFullscreen = () => {
    if (!isTimerFullscreen) {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
      setIsTimerFullscreen(true);
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      setIsTimerFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsTimerFullscreen(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Timer interval handling
  useEffect(() => {
    if (isRunning) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Timer reaches 0!
            setIsRunning(false);
            setIsTimeUp(true);
            soundManager.playTimeUpAlarm();
            return 0;
          }

          // In the last 5 seconds, tick
          if (prev <= 6 && tickAudioEnabled) {
            soundManager.playTimerTick();
          }

          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, tickAudioEnabled]);

  // Keyboard shortcut: Spacebar to Start / Pause, F to toggle fullscreen, Esc to exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleTimerFullscreen();
        return;
      }
      if (e.key === 'Escape' && isTimerFullscreen) {
        e.preventDefault();
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        setIsTimerFullscreen(false);
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlayPause();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRunning, timeLeft, initialDuration, isTimerFullscreen]);

  const togglePlayPause = () => {
    if (isTimeUp) {
      // If time was up, reset first
      setTimeLeft(initialDuration);
      setIsTimeUp(false);
      setIsRunning(true);
      return;
    }
    if (timeLeft === 0) {
      setTimeLeft(initialDuration);
      setIsRunning(true);
      return;
    }
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(initialDuration);
    setIsTimeUp(false);
  };

  const handleSetPreset = (minutes: number) => {
    const seconds = minutes * 60;
    setIsRunning(false);
    setInitialDuration(seconds);
    setTimeLeft(seconds);
    setCustomMinutes(minutes);
    setIsTimeUp(false);
  };

  const handleAddExtraTime = (extraSeconds: number) => {
    setTimeLeft((prev) => prev + extraSeconds);
    setInitialDuration((prev) => prev + extraSeconds);
    if (isTimeUp) {
      setIsTimeUp(false);
      setIsRunning(true);
    }
  };

  const handleApplyCustomMinutes = () => {
    const mins = Math.max(1, Math.min(120, customMinutes));
    handleSetPreset(mins);
  };

  const handleTestAlarm = () => {
    soundManager.playTimeUpAlarm();
  };

  // Formatting MM:SS
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(seconds).padStart(2, '0');

  // Percentage for progress ring
  const progressPercent = initialDuration > 0 ? (timeLeft / initialDuration) * 100 : 0;
  const strokeDashoffset = 880 - (880 * progressPercent) / 100;

  // Determine stage colors
  const isEmergency = timeLeft <= 10 && timeLeft > 0;
  const isWarning = timeLeft <= 60 && timeLeft > 10;

  const timerColorClass = isTimeUp
    ? 'text-rose-500 animate-pulse'
    : isEmergency
      ? 'text-rose-500 animate-pulse'
      : isWarning
        ? 'text-amber-400'
        : 'text-emerald-400';

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col gap-6">
      {/* Top Presets Deck */}
      <div className={`p-4 sm:p-5 rounded-3xl border flex flex-wrap items-center justify-between gap-4 ${
        isLightMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/90 border-slate-800'
      }`}>
        <div className="flex items-center flex-wrap gap-2">
          <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-400 mr-2">
            Chọn nhanh:
          </span>
          {[1, 2, 3, 5, 10, 15, 20].map((m) => (
            <button
              key={m}
              onClick={() => handleSetPreset(m)}
              className={`px-3 sm:px-4 py-2 rounded-xl font-display font-black text-sm sm:text-base transition-all ${
                initialDuration === m * 60 && !isTimeUp
                  ? 'bg-indigo-600 text-white shadow-md scale-105'
                  : isLightMode
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              {m} phút
            </button>
          ))}
        </div>

        {/* Custom Minutes Input & Audio Test */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={1}
              max={120}
              value={customMinutes}
              onChange={(e) => setCustomMinutes(Number(e.target.value))}
              aria-label="Nhập số phút đếm ngược"
              className={`w-16 px-2.5 py-1.5 rounded-xl border text-center font-bold text-sm outline-none ${
                isLightMode 
                  ? 'bg-white border-slate-300 text-slate-900' 
                  : 'bg-slate-800 border-slate-700 text-white'
              }`}
            />
            <button
              onClick={handleApplyCustomMinutes}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold"
            >
              Đặt phút
            </button>
          </div>

          <button
            onClick={handleTestAlarm}
            className={`px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors ${
              isLightMode
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
            }`}
            title="Nghe thử chuông báo khi hết giờ"
          >
            <Bell className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Thử chuông</span>
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleTimerFullscreen}
            className={`px-3.5 py-1.5 rounded-xl border text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              isTimerFullscreen
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/30'
                : 'bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border-indigo-500/40 hover:text-white'
            }`}
            title={isTimerFullscreen ? 'Thu nhỏ lại (Esc)' : 'Phóng to toàn màn hình máy chiếu (Phím F)'}
          >
            {isTimerFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span>{isTimerFullscreen ? 'Thu nhỏ (Esc)' : 'Toàn màn hình (F)'}</span>
          </button>
        </div>
      </div>

      {/* Giant Projector Timer Display Stage */}
      <div className={
        isTimerFullscreen
          ? 'fixed inset-0 z-50 bg-slate-950 p-4 sm:p-8 flex flex-col justify-between items-center w-screen h-screen overflow-y-auto'
          : `rounded-3xl border p-8 sm:p-12 text-center flex flex-col items-center justify-center relative overflow-hidden transition-all ${
              isTimeUp
                ? 'bg-rose-950/40 border-rose-500 shadow-2xl shadow-rose-900/50 ring-8 ring-rose-500/20'
                : isLightMode
                  ? 'bg-gradient-to-b from-white via-indigo-50/30 to-white border-indigo-200/80 shadow-lg'
                  : 'bg-gradient-to-b from-slate-900 via-indigo-950/20 to-slate-900 border-slate-800 shadow-2xl'
            }`
      }>
        {/* Fullscreen top control bar */}
        {isTimerFullscreen && (
          <div className="w-full max-w-5xl flex flex-wrap items-center justify-between gap-3 mb-4 bg-slate-900/90 border border-slate-800 px-4 py-3 rounded-2xl shadow-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black uppercase text-amber-400 flex items-center gap-1.5 mr-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>CHỌN NHANH:</span>
              </span>
              {[1, 2, 3, 5, 10, 15, 20].map((m) => (
                <button
                  key={m}
                  onClick={() => handleSetPreset(m)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    initialDuration === m * 60
                      ? 'bg-indigo-600 text-white shadow'
                      : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  {m}p
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setTickAudioEnabled(!tickAudioEnabled)}
                className={`px-3 py-1 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1 ${
                  tickAudioEnabled ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>{tickAudioEnabled ? 'Bật tích tắc' : 'Tắt tích tắc'}</span>
              </button>

              <button
                onClick={toggleTimerFullscreen}
                className="px-4 py-1.5 rounded-xl font-display font-black text-xs sm:text-sm bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5 shadow-lg shadow-rose-600/30 transition-all cursor-pointer active:scale-95"
                title="Thu nhỏ lại (Phím Esc hoặc F)"
              >
                <Minimize2 className="w-4 h-4" />
                <span>Thu nhỏ (Esc)</span>
              </button>
            </div>
          </div>
        )}
        {/* Banner for Time's Up */}
        {isTimeUp && (
          <div className="mb-6 px-6 py-2 rounded-2xl bg-rose-600 text-white font-black text-2xl sm:text-3xl animate-bounce flex items-center gap-3 shadow-lg">
            <AlertTriangle className="w-8 h-8" />
            <span>HẾT GIỜ HOẠT ĐỘNG!</span>
          </div>
        )}

        {/* Circular Progress & Clock Container */}
        <div className={`relative flex items-center justify-center transition-all ${
          isTimerFullscreen
            ? 'w-80 h-80 sm:w-[460px] sm:h-[460px] my-auto'
            : 'w-72 h-72 sm:w-96 sm:h-96'
        }`}>
          {/* SVG Progress Circle */}
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 300 300">
            {/* Background track */}
            <circle
              cx="150"
              cy="150"
              r="140"
              className={isLightMode ? 'stroke-slate-200' : 'stroke-slate-800'}
              strokeWidth="12"
              fill="transparent"
            />
            {/* Dynamic progress bar */}
            <circle
              cx="150"
              cy="150"
              r="140"
              stroke="currentColor"
              strokeWidth="14"
              strokeDasharray="880"
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className={`transition-all duration-1000 ${
                isTimeUp
                  ? 'text-rose-500'
                  : isEmergency
                    ? 'text-rose-500'
                    : isWarning
                      ? 'text-amber-400'
                      : 'text-emerald-500'
              }`}
            />
          </svg>

          {/* Huge Numeric Digits inside circle */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`font-black font-display tabular-nums tracking-tighter leading-none ${
              isTimerFullscreen ? 'text-8xl sm:text-[11rem]' : 'text-7xl sm:text-9xl'
            } ${timerColorClass}`}>
              {formattedMinutes}:{formattedSeconds}
            </div>
            <div className={`font-bold text-slate-400 mt-2 ${isTimerFullscreen ? 'text-base sm:text-xl' : 'text-sm sm:text-base'}`}>
              {isTimeUp 
                ? 'ĐÃ HẾT THỜI GIAN' 
                : isRunning 
                  ? 'ĐANG ĐẾM NGƯỢC...' 
                  : 'ĐANG TẠM DỪNG'}
            </div>
          </div>
        </div>

        {/* Primary Controls */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          {/* Play/Pause Button */}
          <button
            onClick={togglePlayPause}
            className={`px-10 sm:px-14 py-4 sm:py-5 rounded-2xl font-black font-display text-2xl sm:text-3xl flex items-center gap-3 transition-transform active:scale-95 shadow-xl cursor-pointer ${
              isRunning
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/30'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/40'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-8 h-8 fill-current" />
                <span>TẠM DỪNG</span>
              </>
            ) : (
              <>
                <Play className="w-8 h-8 fill-current" />
                <span>{timeLeft === 0 ? 'BẮT ĐẦU LẠI' : 'BẮT ĐẦU'}</span>
              </>
            )}
          </button>

          {/* Reset Button */}
          <button
            onClick={handleReset}
            className={`px-6 sm:px-8 py-4 sm:py-5 rounded-2xl font-bold font-display text-lg sm:text-xl flex items-center gap-2 border transition-all active:scale-95 ${
              isLightMode
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
            }`}
            title="Đặt lại về thời gian ban đầu"
          >
            <RotateCcw className="w-6 h-6" />
            <span>Đặt lại</span>
          </button>

          {/* Quick Extensions (+30s, +1m) */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleAddExtraTime(30)}
              className="px-4 py-4 rounded-2xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/40 font-bold text-base active:scale-95 transition-all"
              title="Cộng thêm 30 giây"
            >
              +30 giây
            </button>
            <button
              onClick={() => handleAddExtraTime(60)}
              className="px-4 py-4 rounded-2xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/40 font-bold text-base active:scale-95 transition-all"
              title="Cộng thêm 1 phút"
            >
              +1 phút
            </button>
          </div>
        </div>

        {/* Tip footer */}
        <div className="mt-6 text-xs sm:text-sm text-slate-400 flex items-center gap-2">
          <span>Phím tắt: Bấm <kbd className="px-2 py-0.5 rounded bg-slate-700 text-white font-mono text-xs">Phím cách (Space)</kbd> để Bắt đầu / Tạm dừng</span>
        </div>
      </div>
    </div>
  );
};
