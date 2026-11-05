import React, { useState, useRef, useEffect } from 'react';
import { User, LogIn, LogOut, Cloud, CloudCheck, RefreshCw, Sparkles, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface UserMenuProps {
  onOpenAuthModal: () => void;
  isLightMode: boolean;
  onSyncToCloud?: () => void;
  isSyncing?: boolean;
}

export const UserMenu: React.FC<UserMenuProps> = ({
  onOpenAuthModal,
  isLightMode,
  onSyncToCloud,
  isSyncing = false,
}) => {
  const { user, profile, signOut, isConfigured } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicked outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) {
    return (
      <button
        onClick={onOpenAuthModal}
        className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
          isLightMode
            ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 shadow-sm'
            : 'bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border-indigo-500/40'
        }`}
        title={isConfigured ? 'Đăng nhập tài khoản giáo viên' : 'Kết nối & Đăng nhập'}
      >
        <User className="w-4 h-4 text-indigo-400" />
        <span>Đăng nhập</span>
      </button>
    );
  }

  const displayName = profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Giáo viên';
  const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`px-2.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 border transition-all cursor-pointer ${
          isLightMode
            ? 'bg-white border-slate-300 text-slate-800 shadow-sm hover:border-indigo-400'
            : 'bg-slate-800 border-slate-700 text-slate-100 hover:border-slate-600'
        }`}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-5 h-5 rounded-full object-cover ring-1 ring-emerald-400"
          />
        ) : (
          <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}

        <span className="max-w-[120px] truncate">{displayName}</span>

        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Đã kết nối Cloud" />
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute right-0 mt-2 w-64 rounded-2xl border-2 shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150 ${
            isLightMode ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
          }`}
        >
          {/* User Info Header */}
          <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800">
            <p className="text-xs font-black text-emerald-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tài khoản Giáo viên</span>
            </p>
            <p className="text-sm font-bold truncate mt-0.5">{displayName}</p>
            <p className="text-xs text-slate-400 truncate">{user.email}</p>
          </div>

          {/* Cloud Sync Status & Action */}
          <div className="p-2">
            {onSyncToCloud && (
              <button
                onClick={() => {
                  onSyncToCloud();
                  setIsOpen(false);
                }}
                disabled={isSyncing}
                className={`w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                  isLightMode
                    ? 'hover:bg-slate-100 text-slate-700'
                    : 'hover:bg-slate-800 text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-indigo-400" />
                  <span>Đồng bộ lớp lên Cloud</span>
                </div>
                {isSyncing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                ) : (
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded-full">
                    Đồng bộ
                  </span>
                )}
              </button>
            )}

            <button
              onClick={() => {
                onOpenAuthModal();
                setIsOpen(false);
              }}
              className={`w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer ${
                isLightMode ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-slate-800 text-slate-200'
              }`}
            >
              <CloudCheck className="w-4 h-4 text-emerald-400" />
              <span>Cài đặt kết nối Database</span>
            </button>
          </div>

          {/* Sign Out Button */}
          <div className="p-2 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={async () => {
                await signOut();
                setIsOpen(false);
              }}
              className="w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
