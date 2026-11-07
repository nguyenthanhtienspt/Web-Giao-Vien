import React, { useState } from 'react';
import { X, Mail, Lock, User as UserIcon, LogIn, UserPlus, KeyRound, CheckCircle2, AlertCircle, Sparkles, Settings, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { saveSupabaseCustomCredentials, supabaseUrl, supabaseAnonKey } from '../services/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLightMode: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, isLightMode }) => {
  const {
    isConfigured,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'signin' | 'signup' | 'forgot' | 'config'>(
    isConfigured ? 'signin' : 'config'
  );

  // Form inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  // Custom Supabase credentials form (if not set in env)
  const [customUrl, setCustomUrl] = useState(supabaseUrl);
  const [customKey, setCustomKey] = useState(supabaseAnonKey);

  // Status feedback
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Detect OAuth error redirected from Supabase in URL hash/query
  React.useEffect(() => {
    const raw = (window.location.hash || '') + (window.location.search || '');
    if (
      raw.includes('provider+is+not+enabled') ||
      raw.includes('provider_not_enabled') ||
      raw.includes('Unsupported+provider') ||
      raw.includes('validation_failed')
    ) {
      setMessage({
        type: 'error',
        text: 'Đăng nhập Google chưa được bật trên Supabase. Thầy/Cô dùng mục Đăng ký / Đăng nhập bằng Email & Mật khẩu bên dưới nhé!',
      });
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  if (!isOpen) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setMessage({ type: 'error', text: 'Vui lòng nhập đầy đủ Email và Mật khẩu' });
      return;
    }
    setLoading(true);
    setMessage(null);

    const { error } = await signInWithEmail(email, password);
    setLoading(false);

    if (error) {
      if (error.message?.includes('Email not confirmed')) {
        setMessage({
          type: 'error',
          text: 'Email này chưa xác nhận. Thầy/Cô vui lòng kiểm tra hộp thư email để bấm xác nhận (hoặc vào Supabase -> Auth -> Providers -> Email và TẮT "Confirm email" để đăng nhập được ngay).',
        });
      } else if (error.message?.includes('Invalid login')) {
        setMessage({
          type: 'error',
          text: 'Email hoặc mật khẩu không chính xác.',
        });
      } else {
        setMessage({
          type: 'error',
          text: `Lỗi: ${error.message}`,
        });
      }
    } else {
      setMessage({ type: 'success', text: 'Đăng nhập thành công!' });
      setTimeout(() => {
        onClose();
        setMessage(null);
      }, 800);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) {
      setMessage({ type: 'error', text: 'Vui lòng điền đầy đủ Họ tên, Email và Mật khẩu' });
      return;
    }
    if (password.length < 6) {
      setMessage({ type: 'error', text: 'Mật khẩu phải có tối thiểu 6 ký tự' });
      return;
    }
    setLoading(true);
    setMessage(null);

    const { error } = await signUpWithEmail(email, password, fullName);
    setLoading(false);

    if (error) {
      setMessage({ type: 'error', text: `Lỗi đăng ký: ${error.message}` });
    } else {
      setMessage({
        type: 'success',
        text: 'Tạo tài khoản thành công! Thầy/Cô có thể đăng nhập ngay bằng Email và Mật khẩu vừa tạo.',
      });
      setTimeout(() => {
        setActiveTab('signin');
      }, 1500);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setMessage(null);
    const { error } = await signInWithGoogle();
    if (error) {
      setLoading(false);
      if (error.message?.includes('provider is not enabled') || error.message?.includes('validation_failed')) {
        setMessage({
          type: 'error',
          text: 'Google Sign-In chưa được bật trong Supabase. Thầy/Cô vui lòng dùng Email & Mật khẩu bên dưới ạ.',
        });
      } else {
        setMessage({ type: 'error', text: `Lỗi đăng nhập Google: ${error.message}` });
      }
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setMessage({ type: 'error', text: 'Vui lòng nhập địa chỉ Email của Thầy/Cô' });
      return;
    }
    setLoading(true);
    setMessage(null);

    const { error } = await resetPassword(email);
    setLoading(false);

    if (error) {
      setMessage({ type: 'error', text: `Lỗi: ${error.message}` });
    } else {
      setMessage({
        type: 'success',
        text: 'Đã gửi hướng dẫn đặt lại mật khẩu về email. Thầy/Cô vui lòng kiểm tra hộp thư!',
      });
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim() || !customKey.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng nhập cả Supabase URL và Anon Key' });
      return;
    }
    saveSupabaseCustomCredentials(customUrl, customKey);
    setMessage({ type: 'success', text: 'Đã lưu cấu hình Supabase! Đang tải lại...' });
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className={`w-full max-w-md rounded-3xl border-2 overflow-hidden shadow-2xl flex flex-col ${
          isLightMode ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700 text-white'
        }`}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-emerald-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-300" />
            <h3 className="font-black font-display text-lg tracking-wide uppercase">
              TÀI KHOẢN GIÁO VIÊN
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/40 p-1.5 gap-1 text-xs font-bold">
          <button
            onClick={() => {
              setActiveTab('signin');
              setMessage(null);
            }}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'signin'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Đăng nhập</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('signup');
              setMessage(null);
            }}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'signup'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Đăng ký</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('config');
              setMessage(null);
            }}
            className={`px-3 py-2 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'config'
                ? 'bg-amber-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Cấu hình kết nối Supabase Cloud"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Kết nối</span>
          </button>
        </div>

        {/* Alert / Feedback message */}
        {message && (
          <div
            className={`mx-6 mt-4 p-3 rounded-xl flex items-center gap-2 text-xs font-bold ${
              message.type === 'success'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 flex flex-col gap-4">
          {/* TAB 1: SIGN IN */}
          {activeTab === 'signin' && (
            <div className="flex flex-col gap-4">
              {/* 1-Click Google Sign In */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm border-2 border-slate-200 shadow-sm flex items-center justify-center gap-2.5 transition-transform active:scale-95 cursor-pointer"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Đăng nhập với Google</span>
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-300 dark:bg-slate-700" />
                <span className="text-xs font-semibold text-slate-400">hoặc dùng Email</span>
                <div className="flex-1 h-px bg-slate-300 dark:bg-slate-700" />
              </div>

              <form onSubmit={handleSignIn} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-400">Email giáo viên</label>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 absolute left-3 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="thaytien@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full pl-9 pr-3 py-2 rounded-xl text-sm border outline-none font-medium ${
                        isLightMode
                          ? 'bg-slate-50 border-slate-300 focus:border-indigo-500 focus:bg-white'
                          : 'bg-slate-800 border-slate-700 focus:border-indigo-400 text-white'
                      }`}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-400">Mật khẩu</label>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('forgot');
                        setMessage(null);
                      }}
                      className="text-xs text-indigo-400 hover:underline cursor-pointer"
                    >
                      Quên mật khẩu?
                    </button>
                  </div>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 absolute left-3 text-slate-400" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full pl-9 pr-3 py-2 rounded-xl text-sm border outline-none font-medium ${
                        isLightMode
                          ? 'bg-slate-50 border-slate-300 focus:border-indigo-500 focus:bg-white'
                          : 'bg-slate-800 border-slate-700 focus:border-indigo-400 text-white'
                      }`}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 w-full py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md shadow-indigo-600/30 transition-transform active:scale-95 cursor-pointer"
                >
                  {loading ? 'Đang xác thực...' : 'ĐĂNG NHẬP'}
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: SIGN UP */}
          {activeTab === 'signup' && (
            <form onSubmit={handleSignUp} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-400">Họ và tên Thầy / Cô</label>
                <div className="relative flex items-center">
                  <UserIcon className="w-4 h-4 absolute left-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Thầy Nguyễn Thanh Tiến"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={`w-full pl-9 pr-3 py-2 rounded-xl text-sm border outline-none font-medium ${
                      isLightMode
                        ? 'bg-slate-50 border-slate-300 focus:border-emerald-500 focus:bg-white'
                        : 'bg-slate-800 border-slate-700 focus:border-emerald-400 text-white'
                    }`}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-400">Email giáo viên</label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 absolute left-3 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="thaytien@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full pl-9 pr-3 py-2 rounded-xl text-sm border outline-none font-medium ${
                      isLightMode
                        ? 'bg-slate-50 border-slate-300 focus:border-emerald-500 focus:bg-white'
                        : 'bg-slate-800 border-slate-700 focus:border-emerald-400 text-white'
                    }`}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-400">Mật khẩu (tối thiểu 6 ký tự)</label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 absolute left-3 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full pl-9 pr-3 py-2 rounded-xl text-sm border outline-none font-medium ${
                      isLightMode
                        ? 'bg-slate-50 border-slate-300 focus:border-emerald-500 focus:bg-white'
                        : 'bg-slate-800 border-slate-700 focus:border-emerald-400 text-white'
                    }`}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md shadow-emerald-600/30 transition-transform active:scale-95 cursor-pointer"
              >
                {loading ? 'Đang tạo tài khoản...' : 'TẠO TÀI KHOẢN'}
              </button>

              <p className="text-center text-xs text-slate-400 mt-1">
                Đã có tài khoản?{' '}
                <button
                  type="button"
                  onClick={() => setActiveTab('signin')}
                  className="text-emerald-400 font-bold hover:underline cursor-pointer"
                >
                  Đăng nhập ngay
                </button>
              </p>
            </form>
          )}

          {/* TAB 3: FORGOT PASSWORD */}
          {activeTab === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="flex flex-col gap-3">
              <span className="text-xs text-slate-400 leading-relaxed">
                Nhập địa chỉ email Thầy/Cô đã dùng khi đăng ký. Hệ thống sẽ gửi thư hướng dẫn đặt lại mật khẩu an toàn.
              </span>

              <div className="flex flex-col gap-1 mt-1">
                <label className="text-xs font-bold text-slate-400">Email của Thầy/Cô</label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 absolute left-3 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="thaytien@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full pl-9 pr-3 py-2 rounded-xl text-sm border outline-none font-medium ${
                      isLightMode
                        ? 'bg-slate-50 border-slate-300 focus:border-indigo-500 focus:bg-white'
                        : 'bg-slate-800 border-slate-700 focus:border-indigo-400 text-white'
                    }`}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md transition-transform active:scale-95 cursor-pointer"
              >
                {loading ? 'Đang gửi...' : 'GỬI LIÊN KẾT ĐẶT LẠI'}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('signin')}
                className="text-center text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                ← Quay lại đăng nhập
              </button>
            </form>
          )}

          {/* TAB 4: SUPABASE CONFIGURATION */}
          {activeTab === 'config' && (
            <form onSubmit={handleSaveConfig} className="flex flex-col gap-3">
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4" />
                  <span>Kết nối Supabase Cloud Database</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Để lưu tài khoản và đồng bộ lớp học trên Cloud miễn phí vĩnh viễn, Thầy/Cô chỉ cần tạo dự án tại{' '}
                  <a
                    href="https://supabase.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-amber-400 underline inline-flex items-center gap-0.5"
                  >
                    supabase.com <ExternalLink className="w-3 h-3" />
                  </a>{' '}
                  rồi dán Project URL và Anon Key vào đây.
                </p>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-400">Project URL (Supabase URL)</label>
                <input
                  type="url"
                  required
                  placeholder="https://xyzcompany.supabase.co"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-mono border outline-none ${
                    isLightMode
                      ? 'bg-slate-50 border-slate-300 focus:border-amber-500'
                      : 'bg-slate-800 border-slate-700 text-white focus:border-amber-400'
                  }`}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-400">Anon Public Key</label>
                <textarea
                  rows={2}
                  required
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={customKey}
                  onChange={(e) => setCustomKey(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-mono border outline-none resize-none ${
                    isLightMode
                      ? 'bg-slate-50 border-slate-300 focus:border-amber-500'
                      : 'bg-slate-800 border-slate-700 text-white focus:border-amber-400'
                  }`}
                />
              </div>

              <button
                type="submit"
                className="mt-2 w-full py-2.5 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-sm shadow-md transition-transform active:scale-95 cursor-pointer"
              >
                LƯU KẾT NỐI VÀ ÁP DỤNG
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
