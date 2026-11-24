import React, { useState, useEffect } from 'react';
import {
  X,
  FileSpreadsheet,
  DownloadCloud,
  UploadCloud,
  Lock,
  Unlock,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Code2,
} from 'lucide-react';
import {
  googleSheetSync,
  GOOGLE_APPS_SCRIPT_TEMPLATE,
} from '../services/googleSheetSync';

interface GoogleSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLightMode: boolean;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  onAfterPull: () => void;
  onSyncStateChanged: () => void;
}

export const GoogleSheetModal: React.FC<GoogleSheetModalProps> = ({
  isOpen,
  onClose,
  isLightMode,
  syncStatus,
  onAfterPull,
  onSyncStateChanged,
}) => {
  const [tab, setTab] = useState<'sync' | 'guide'>(() =>
    googleSheetSync.getScriptUrl() ? 'sync' : 'sync'
  );
  const [scriptUrl, setScriptUrl] = useState(() => googleSheetSync.getScriptUrl());
  const [pin, setPin] = useState(() => googleSheetSync.getActivePin());
  const [rememberPin, setRememberPin] = useState(() => googleSheetSync.isPinRemembered());
  const [autoSync, setAutoSync] = useState(() => googleSheetSync.isAutoSyncEnabled());

  const [busyAction, setBusyAction] = useState<'pull' | 'push' | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setScriptUrl(googleSheetSync.getScriptUrl());
      setPin(googleSheetSync.getActivePin());
      setRememberPin(googleSheetSync.isPinRemembered());
      setAutoSync(googleSheetSync.isAutoSyncEnabled());
      setFeedback(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const meta = googleSheetSync.getSheetMeta();
  const isUnlocked = googleSheetSync.isReadyForSync();

  const persistCredentials = () => {
    googleSheetSync.setScriptUrl(scriptUrl);
    if (pin.trim()) {
      googleSheetSync.savePin(pin, rememberPin);
    }
    googleSheetSync.setAutoSyncEnabled(autoSync);
    onSyncStateChanged();
  };

  const handlePull = async () => {
    setFeedback(null);
    setBusyAction('pull');
    const res = await googleSheetSync.pullFromSheet(scriptUrl, pin);
    setBusyAction(null);

    if (res.ok) {
      persistCredentials();
      onAfterPull();
      setFeedback({ type: 'ok', text: res.message });
    } else {
      setFeedback({ type: 'err', text: res.message });
    }
  };

  const handlePush = async () => {
    setFeedback(null);
    setBusyAction('push');
    const res = await googleSheetSync.pushToSheet(scriptUrl, pin);
    setBusyAction(null);

    if (res.ok) {
      persistCredentials();
      setFeedback({ type: 'ok', text: res.message });
    } else {
      setFeedback({ type: 'err', text: res.message });
    }
  };

  const handleLock = () => {
    googleSheetSync.lockSession();
    setPin('');
    setRememberPin(false);
    onSyncStateChanged();
    setFeedback({
      type: 'ok',
      text: 'Đã khóa phiên mã PIN trên trình duyệt này — an toàn khi rời máy tính phòng học chung!',
    });
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div
        className={`w-full max-w-2xl rounded-3xl border-4 overflow-hidden shadow-2xl flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200 ${
          isLightMode
            ? 'bg-white border-emerald-500 text-slate-900'
            : 'bg-slate-900 border-emerald-500 text-white'
        }`}
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-7 h-7" />
            <div>
              <h3 className="text-lg sm:text-xl font-black font-display uppercase tracking-wide">
                DATABASE GOOGLE SHEET CÁ NHÂN
              </h3>
              <p className="text-xs text-emerald-100">
                Lưu trữ vĩnh viễn trên Google Drive của Thầy · Không bao giờ tự ngắt · Có khóa PIN
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-tabs */}
        <div
          className={`flex p-1.5 gap-1.5 border-b text-xs sm:text-sm font-black shrink-0 ${
            isLightMode ? 'bg-slate-100 border-slate-200' : 'bg-slate-950/60 border-slate-800'
          }`}
        >
          <button
            onClick={() => setTab('sync')}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
              tab === 'sync'
                ? 'bg-emerald-600 text-white shadow'
                : isLightMode
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-white'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
            <span>Đồng bộ &amp; Mã PIN</span>
          </button>
          <button
            onClick={() => setTab('guide')}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
              tab === 'guide'
                ? 'bg-indigo-600 text-white shadow'
                : isLightMode
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-white'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Mã Apps Script &amp; Hướng dẫn 2 phút</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 flex flex-col gap-4">
          {feedback && (
            <div
              className={`p-3.5 rounded-2xl border text-xs sm:text-sm font-bold flex items-start gap-2 ${
                feedback.type === 'ok'
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-500'
                  : 'bg-rose-500/15 border-rose-500/40 text-rose-500'
              }`}
            >
              {feedback.type === 'ok' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}

          {tab === 'sync' ? (
            <div className="flex flex-col gap-4">
              {/* Current Sheet Connection Badge */}
              {meta.sheetName && (
                <div
                  className={`px-4 py-2.5 rounded-2xl border flex items-center justify-between gap-2 text-xs ${
                    isLightMode
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold truncate">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="truncate">File đang kết nối: <strong>{meta.sheetName}</strong></span>
                  </div>
                  {meta.lastSyncedAt && (
                    <span className="text-[11px] opacity-80 shrink-0">
                      Đồng bộ: {new Date(meta.lastSyncedAt).toLocaleTimeString('vi-VN')}
                    </span>
                  )}
                </div>
              )}

              {/* Script URL */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-400">
                    1. Đường link Web App Google Apps Script:
                  </label>
                  {!scriptUrl && (
                    <button
                      type="button"
                      onClick={() => setTab('guide')}
                      className="text-xs font-bold text-indigo-500 hover:underline cursor-pointer"
                    >
                      Chưa có link? Xem hướng dẫn 2 phút →
                    </button>
                  )}
                </div>
                <input
                  type="url"
                  value={scriptUrl}
                  onChange={(e) => setScriptUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-mono outline-none ${
                    isLightMode
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500'
                      : 'bg-slate-950 border-slate-700 text-white focus:border-emerald-400'
                  }`}
                />
              </div>

              {/* Secret PIN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    {isUnlocked ? (
                      <Unlock className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-amber-500" />
                    )}
                    <span>2. Mã PIN bảo mật của Thầy:</span>
                  </label>
                  <input
                    type="password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="Nhập mã PIN (mặc định: 123456)"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-bold tracking-widest outline-none ${
                      isLightMode
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500'
                        : 'bg-slate-950 border-slate-700 text-white focus:border-emerald-400'
                    }`}
                  />
                </div>

                <label className="flex items-center gap-2 pb-2.5 text-xs font-bold cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberPin}
                    onChange={(e) => {
                      setRememberPin(e.target.checked);
                      if (pin.trim()) {
                        googleSheetSync.savePin(pin, e.target.checked);
                        onSyncStateChanged();
                      }
                    }}
                    className="w-4 h-4 rounded accent-emerald-600 cursor-pointer"
                  />
                  <span>Nhớ mã PIN trên máy cá nhân này (bỏ tích nếu là máy chiếu chung ở lớp)</span>
                </label>
              </div>

              {/* Primary Pull / Push Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={handlePull}
                  disabled={busyAction !== null}
                  className="py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-display font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 cursor-pointer active:scale-95 transition-all"
                >
                  <DownloadCloud className={`w-5 h-5 ${busyAction === 'pull' ? 'animate-bounce' : ''}`} />
                  <span>{busyAction === 'pull' ? 'Đang tải về...' : 'TẢI TỪ SHEET VỀ MÁY'}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePush}
                  disabled={busyAction !== null}
                  className="py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-display font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 cursor-pointer active:scale-95 transition-all"
                >
                  <UploadCloud className={`w-5 h-5 ${busyAction === 'push' ? 'animate-bounce' : ''}`} />
                  <span>{busyAction === 'push' ? 'Đang lưu lên Sheet...' : 'LƯU TỪ MÁY LÊN SHEET'}</span>
                </button>
              </div>

              {/* Auto-sync toggle & Lock Session */}
              <div
                className={`p-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-3 mt-1 ${
                  isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <label className="flex items-center gap-2 text-xs sm:text-sm font-bold cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoSync}
                    onChange={(e) => {
                      setAutoSync(e.target.checked);
                      googleSheetSync.setAutoSyncEnabled(e.target.checked);
                      onSyncStateChanged();
                    }}
                    className="w-4 h-4 rounded accent-emerald-600 cursor-pointer"
                  />
                  <span>Tự động lưu ngầm lên Google Sheet sau mỗi thay đổi (2.5 giây)</span>
                </label>

                {isUnlocked && (
                  <button
                    type="button"
                    onClick={handleLock}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-500 text-xs font-black flex items-center gap-1.5 cursor-pointer"
                    title="Xóa mã PIN khỏi trình duyệt khi dạy xong trên máy tính phòng học"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Khóa phiên máy chung</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* --- SETUP GUIDE TAB --- */
            <div className="flex flex-col gap-4 text-xs sm:text-sm">
              <div
                className={`p-4 rounded-2xl border space-y-2.5 leading-relaxed ${
                  isLightMode
                    ? 'bg-indigo-50/70 border-indigo-200 text-slate-800'
                    : 'bg-indigo-950/30 border-indigo-800/60 text-slate-200'
                }`}
              >
                <p className="font-black text-indigo-500 uppercase text-xs tracking-wider">
                  CHỈ CẦN CÀI 1 LẦN DUY NHẤT (KHOẢNG 2 PHÚT):
                </p>
                <ol className="list-decimal list-inside space-y-1.5 font-medium">
                  <li>
                    Bấm mở{' '}
                    <a
                      href="https://sheets.new"
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-500 font-black underline inline-flex items-center gap-1"
                    >
                      https://sheets.new <ExternalLink className="w-3.5 h-3.5" />
                    </a>{' '}
                    để tạo 1 file Google Sheet mới trên Google Drive của Thầy (đặt tên VD:{' '}
                    <strong>Trợ Lý Lớp Học - Database</strong>).
                  </li>
                  <li>
                    Trên thanh menu Google Sheet, chọn{' '}
                    <strong>Tiện ích mở rộng (Extensions) → Apps Script</strong>.
                  </li>
                  <li>
                    Xoá mã mặc định trong cửa sổ Apps Script, bấm nút{' '}
                    <strong>&ldquo;Sao chép mã Apps Script&rdquo;</strong> bên dưới dán vào, đổi dòng{' '}
                    <code className="px-1.5 py-0.5 rounded bg-black/20 font-mono font-bold">
                      SECRET_PIN = &quot;123456&quot;
                    </code>{' '}
                    thành PIN của Thầy rồi bấm <strong>Ctrl+S</strong> để lưu.
                  </li>
                  <li>
                    Góc phải trên bấm <strong>Triển khai (Deploy) → Tùy chọn triển khai mới</strong> → Chọn loại{' '}
                    <strong>Ứng dụng web (Web app)</strong> → Mục <em>Ai có quyền truy cập</em> chọn{' '}
                    <strong className="text-amber-500">Bất kỳ ai (Anyone)</strong> → Bấm <strong>Triển khai</strong>.
                  </li>
                  <li>
                    Copy đường link <code className="font-mono">https://script.google.com/.../exec</code> dán sang tab{' '}
                    <strong>Đồng bộ &amp; Mã PIN</strong> và bấm <strong>&ldquo;LƯU TỪ MÁY LÊN SHEET&rdquo;</strong> —
                    toàn bộ 12 lớp (415 HS), câu hỏi và bảng điểm sẽ tự động tạo thành 3 bảng đẹp mắt trên Sheet!
                  </li>
                </ol>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-400">
                  Mã nguồn Google Apps Script chuẩn:
                </span>
                <button
                  type="button"
                  onClick={handleCopyScript}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1.5 shadow cursor-pointer active:scale-95"
                >
                  {copiedScript ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedScript ? 'Đã sao chép mã Apps Script!' : 'Sao chép mã Apps Script'}</span>
                </button>
              </div>

              <pre
                className={`p-3.5 rounded-2xl border text-[11px] font-mono overflow-x-auto max-h-52 ${
                  isLightMode
                    ? 'bg-slate-900 text-emerald-300 border-slate-700'
                    : 'bg-slate-950 text-emerald-300 border-slate-800'
                }`}
              >
                {GOOGLE_APPS_SCRIPT_TEMPLATE}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
