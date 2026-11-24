import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, X, Volume2, Minimize2, Maximize2, AlertTriangle } from 'lucide-react';
import { soundManager } from '../services/sound';

interface NoiseMeterModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLightMode: boolean;
}

export const NoiseMeterModal: React.FC<NoiseMeterModalProps> = ({
  isOpen,
  onClose,
  isLightMode,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [noiseLevel, setNoiseLevel] = useState(0); // 0 - 100
  const [threshold, setThreshold] = useState(70);
  const [sensitivity, setSensitivity] = useState(1.4);
  const [autoChime, setAutoChime] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const loudStartRef = useRef<number | null>(null);
  const lastChimeRef = useRef<number>(0);
  const sensitivityRef = useRef(sensitivity);
  const thresholdRef = useRef(threshold);
  const autoChimeRef = useRef(autoChime);

  useEffect(() => {
    sensitivityRef.current = sensitivity;
  }, [sensitivity]);

  useEffect(() => {
    thresholdRef.current = threshold;
  }, [threshold]);

  useEffect(() => {
    autoChimeRef.current = autoChime;
  }, [autoChime]);

  const stopMicrophone = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    setIsListening(false);
    setNoiseLevel(0);
    loudStartRef.current = null;
  };

  useEffect(() => {
    if (!isOpen) {
      stopMicrophone();
      setIsMinimized(false);
    }
    return () => {
      stopMicrophone();
    };
  }, [isOpen]);

  const startMicrophone = async () => {
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      streamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.82;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      setIsListening(true);

      const updateMeter = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const scaled = Math.min(100, Math.round((avg / 95) * 100 * sensitivityRef.current));
        setNoiseLevel(scaled);

        const now = Date.now();
        if (scaled >= thresholdRef.current) {
          if (!loudStartRef.current) {
            loudStartRef.current = now;
          } else if (
            autoChimeRef.current &&
            now - loudStartRef.current >= 2500 &&
            now - lastChimeRef.current >= 6000
          ) {
            lastChimeRef.current = now;
            soundManager.playTimeUpAlarm();
          }
        } else {
          loudStartRef.current = null;
        }

        rafRef.current = requestAnimationFrame(updateMeter);
      };

      rafRef.current = requestAnimationFrame(updateMeter);
    } catch {
      setErrorMsg('Không thể truy cập Micro. Thầy/Cô vui lòng bấm "Cho phép" (Allow) quyền Micro trên trình duyệt nhé!');
      stopMicrophone();
    }
  };

  if (!isOpen) return null;

  const isTooLoud = noiseLevel >= threshold;
  const isModerate = noiseLevel >= threshold * 0.65 && !isTooLoud;

  const statusInfo = !isListening
    ? { emoji: '🎙️', label: 'Chưa bật đo tiếng ồn', color: 'text-slate-400', bar: 'bg-slate-500' }
    : isTooLoud
      ? { emoji: '🚨', label: 'LỚP HƠI ỒN RỒI · GIỮ TRẬT TỰ NHÉ!', color: 'text-rose-500', bar: 'bg-rose-500' }
      : isModerate
        ? { emoji: '💬', label: 'Thảo luận sôi nổi vừa phải', color: 'text-amber-500', bar: 'bg-amber-400' }
        : { emoji: '🤫', label: 'Lớp yên tĩnh tuyệt vời!', color: 'text-emerald-500', bar: 'bg-emerald-500' };

  // Compact floating pill when minimized
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 left-4 z-40 animate-in slide-in-from-bottom-4 duration-200">
        <div
          className={`rounded-2xl border-2 px-4 py-2.5 shadow-2xl flex items-center gap-3 ${
            isTooLoud
              ? 'bg-rose-600 border-rose-300 text-white animate-bounce'
              : isLightMode
                ? 'bg-white/95 backdrop-blur border-slate-300 text-slate-900'
                : 'bg-slate-900/95 backdrop-blur border-slate-700 text-white'
          }`}
        >
          <span className="text-xl">{statusInfo.emoji}</span>
          <div className="w-32">
            <div className="flex items-center justify-between text-[11px] font-black">
              <span>ĐỘ ỒN LỚP</span>
              <span className="tabular-nums">{noiseLevel}%</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-black/20 overflow-hidden mt-1">
              <div
                className={`h-full transition-all duration-100 ${isTooLoud ? 'bg-white' : statusInfo.bar}`}
                style={{ width: `${noiseLevel}%` }}
              />
            </div>
          </div>
          <button
            onClick={() => setIsMinimized(false)}
            className="p-1.5 rounded-lg hover:bg-black/20 cursor-pointer"
            title="Phóng to bảng đo tiếng ồn"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-black/20 cursor-pointer"
            title="Tắt đo tiếng ồn"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className={`w-full max-w-xl rounded-3xl border-4 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 ${
          isTooLoud
            ? 'border-rose-500 ring-8 ring-rose-500/30'
            : isLightMode
              ? 'bg-white border-indigo-500 text-slate-900'
              : 'bg-slate-900 border-indigo-500 text-white'
        } ${isLightMode ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'}`}
      >
        {/* Header */}
        <div className="p-5 bg-indigo-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Mic className="w-6 h-6" />
            <div>
              <h3 className="text-lg sm:text-xl font-black font-display uppercase">
                ĐỒNG HỒ ĐO TIẾNG ỒN LỚP HỌC
              </h3>
              <p className="text-xs text-indigo-200">
                Giữ trật tự trực quan khi học sinh thảo luận nhóm hoặc làm bài cá nhân
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {isListening && (
              <button
                onClick={() => setIsMinimized(true)}
                className="px-2.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-xs font-bold flex items-center gap-1 cursor-pointer"
                title="Thu nhỏ xuống góc màn hình để vừa dạy vừa theo dõi"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Thu nhỏ</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 sm:p-8 flex flex-col items-center gap-6">
          {errorMsg && (
            <div className="w-full p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-500 text-xs sm:text-sm font-bold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Big Status Display */}
          <div className="text-center">
            <div className="text-6xl sm:text-7xl mb-2">{statusInfo.emoji}</div>
            <div className={`font-display font-black text-5xl sm:text-6xl tabular-nums ${statusInfo.color}`}>
              {noiseLevel}%
            </div>
            <p className={`text-sm sm:text-base font-black mt-1 ${statusInfo.color}`}>
              {statusInfo.label}
            </p>
          </div>

          {/* Meter Gauge Bar with Threshold Marker */}
          <div className="w-full">
            <div className="relative w-full h-8 rounded-2xl bg-slate-200 dark:bg-slate-800 overflow-hidden border border-slate-300 dark:border-slate-700">
              <div
                className={`h-full transition-all duration-100 ${statusInfo.bar}`}
                style={{ width: `${noiseLevel}%` }}
              />
              {/* Threshold line */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-rose-600 shadow"
                style={{ left: `${threshold}%` }}
                title={`Ngưỡng cảnh báo: ${threshold}%`}
              />
            </div>
            <div className="flex justify-between text-[11px] font-bold text-slate-400 mt-1">
              <span>0% (Yên tĩnh)</span>
              <span className="text-rose-500">Ngưỡng báo ồn: {threshold}%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Sliders & Auto-chime */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold">
            <label className="flex flex-col gap-1.5">
              <span className={isLightMode ? 'text-slate-700' : 'text-slate-300'}>
                Ngưỡng nhắc trật tự: {threshold}%
              </span>
              <input
                type="range"
                min={35}
                max={95}
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="accent-rose-500 cursor-pointer"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className={isLightMode ? 'text-slate-700' : 'text-slate-300'}>
                Độ nhạy Micro: {Math.round(sensitivity * 100)}%
              </span>
              <input
                type="range"
                min={60}
                max={250}
                value={Math.round(sensitivity * 100)}
                onChange={(e) => setSensitivity(Number(e.target.value) / 100)}
                className="accent-indigo-500 cursor-pointer"
              />
            </label>
          </div>

          <label className="flex items-center gap-2 text-xs sm:text-sm font-bold cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoChime}
              onChange={(e) => setAutoChime(e.target.checked)}
              className="w-4 h-4 rounded accent-indigo-600 cursor-pointer"
            />
            <Volume2 className="w-4 h-4 text-amber-500" />
            <span>Tự động phát chuông nhắc nhở khi vượt ngưỡng ồn quá 2.5 giây</span>
          </label>

          {/* Start / Stop Button */}
          <div className="flex items-center gap-3">
            {!isListening ? (
              <button
                onClick={startMicrophone}
                className="px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-display font-black text-base flex items-center gap-2 shadow-lg cursor-pointer active:scale-95 transition-transform"
              >
                <Mic className="w-5 h-5" />
                <span>BẮT ĐẦU ĐO TIẾNG ỒN</span>
              </button>
            ) : (
              <button
                onClick={stopMicrophone}
                className="px-8 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-display font-black text-base flex items-center gap-2 shadow-lg cursor-pointer active:scale-95 transition-transform"
              >
                <MicOff className="w-5 h-5" />
                <span>DỪNG ĐO</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
