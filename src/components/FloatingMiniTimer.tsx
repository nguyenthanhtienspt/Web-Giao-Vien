import React from 'react';
import { Timer, Play, Pause, RotateCcw, BellRing } from 'lucide-react';
import { TimerSnapshot } from '../types';

interface FloatingMiniTimerProps {
  snapshot: TimerSnapshot;
  onTogglePlayPause: () => void;
  onReset: () => void;
  onOpenTimerTab: () => void;
  isLightMode: boolean;
}

export const FloatingMiniTimer: React.FC<FloatingMiniTimerProps> = ({
  snapshot,
  onTogglePlayPause,
  onReset,
  onOpenTimerTab,
  isLightMode,
}) => {
  const { timeLeft, initialDuration, isRunning, isTimeUp } = snapshot;

  // Show only if running, time's up, or paused mid-countdown
  const isMidCountdown = timeLeft > 0 && timeLeft < initialDuration;
  if (!isRunning && !isTimeUp && !isMidCountdown) {
    return null;
  }

  const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const secs = String(timeLeft % 60).padStart(2, '0');
  const isUrgent = timeLeft <= 10 && timeLeft > 0;

  return (
    <div className="fixed bottom-4 right-4 z-40 animate-in slide-in-from-bottom-4 duration-200">
      <div
        className={`rounded-2xl border-2 px-4 py-2.5 shadow-2xl flex items-center gap-3 ${
          isTimeUp
            ? 'bg-rose-600 border-rose-300 text-white animate-bounce'
            : isUrgent
              ? 'bg-rose-950/95 border-rose-500 text-rose-200 ring-4 ring-rose-500/30'
              : isLightMode
                ? 'bg-white/95 backdrop-blur border-indigo-400 text-slate-900'
                : 'bg-slate-900/95 backdrop-blur border-indigo-500 text-white'
        }`}
      >
        <button
          onClick={onOpenTimerTab}
          className="flex items-center gap-2 cursor-pointer text-left group"
          title="Nhấn để mở màn hình Đồng hồ đếm ngược"
        >
          {isTimeUp ? (
            <BellRing className="w-5 h-5 animate-ping shrink-0" />
          ) : (
            <Timer
              className={`w-5 h-5 shrink-0 ${
                isRunning ? 'text-emerald-400 animate-pulse' : 'text-amber-400'
              }`}
            />
          )}
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider opacity-80">
              {isTimeUp ? 'HẾT GIỜ THẢO LUẬN!' : isRunning ? 'ĐANG ĐẾM NGƯỢC' : 'ĐỒNG HỒ TẠM DỪNG'}
            </div>
            <div className="font-display font-black text-2xl tabular-nums leading-none">
              {mins}:{secs}
            </div>
          </div>
        </button>

        <div className="flex items-center gap-1.5 pl-2 border-l border-current/20">
          {!isTimeUp && (
            <button
              onClick={onTogglePlayPause}
              className={`p-2 rounded-xl font-bold transition-transform active:scale-95 cursor-pointer ${
                isRunning
                  ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                  : 'bg-emerald-600 text-white hover:bg-emerald-500'
              }`}
              title={isRunning ? 'Tạm dừng' : 'Tiếp tục đếm ngược'}
            >
              {isRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            </button>
          )}
          <button
            onClick={onReset}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isTimeUp
                ? 'bg-white text-rose-700 font-black text-xs px-3'
                : isLightMode
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
            title="Đặt lại / Tắt đồng hồ nổi"
          >
            {isTimeUp ? 'Đã rõ' : <RotateCcw className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
