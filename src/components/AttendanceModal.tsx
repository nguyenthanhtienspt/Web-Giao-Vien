import React, { useState } from 'react';
import { X, UserCheck, UserX, Search, CheckCircle2 } from 'lucide-react';
import { SavedClass } from '../types';

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeClass: SavedClass | null;
  students: string[];
  absentStudents: string[];
  onChangeAbsent: (nextAbsent: string[]) => void;
  isLightMode: boolean;
}

export const AttendanceModal: React.FC<AttendanceModalProps> = ({
  isOpen,
  onClose,
  activeClass,
  students,
  absentStudents,
  onChangeAbsent,
  isLightMode,
}) => {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const toggleAbsent = (studentName: string) => {
    if (absentStudents.includes(studentName)) {
      onChangeAbsent(absentStudents.filter((s) => s !== studentName));
    } else {
      onChangeAbsent([...absentStudents, studentName]);
    }
  };

  const presentCount = Math.max(0, students.length - absentStudents.length);
  const normalizedQuery = query.trim().toLowerCase();

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div
        className={`w-full max-w-3xl rounded-3xl border-4 overflow-hidden shadow-2xl flex flex-col max-h-[88vh] animate-in zoom-in-95 duration-200 ${
          isLightMode
            ? 'bg-white border-emerald-500 text-slate-900'
            : 'bg-slate-900 border-emerald-500 text-white'
        }`}
      >
        {/* Header */}
        <div className="p-5 bg-emerald-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <UserCheck className="w-7 h-7" />
            <div>
              <h3 className="text-xl font-black font-display uppercase tracking-wide">
                ĐIỂM DANH ĐẦU GIỜ · {activeClass?.name || 'LỚP HIỆN TẠI'}
              </h3>
              <p className="text-xs text-emerald-100">
                Bấm vào tên học sinh vắng mặt — tự động loại khỏi Gọi tên &amp; Chia nhóm nhanh
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary & Search */}
        <div
          className={`px-5 py-3.5 border-b flex flex-wrap items-center justify-between gap-3 shrink-0 ${
            isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
          }`}
        >
          <div className="flex items-center gap-3 text-xs sm:text-sm font-bold">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              Có mặt: {presentCount}/{students.length} HS
            </span>
            <span
              className={`px-3 py-1 rounded-full border ${
                absentStudents.length > 0
                  ? 'bg-rose-500/20 text-rose-500 border-rose-500/40'
                  : isLightMode
                    ? 'bg-slate-200 text-slate-600 border-slate-300'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              Vắng: {absentStudents.length} HS
            </span>
          </div>

          <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm nhanh tên học sinh..."
                className={`w-full pl-9 pr-3 py-1.5 rounded-xl border text-xs sm:text-sm font-medium outline-none ${
                  isLightMode
                    ? 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500'
                    : 'bg-slate-900 border-slate-700 text-white focus:border-emerald-400'
                }`}
              />
            </div>

            {absentStudents.length > 0 && (
              <button
                onClick={() => onChangeAbsent([])}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Có mặt đủ</span>
              </button>
            )}
          </div>
        </div>

        {/* Student Grid */}
        <div className="p-5 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {students.map((student, idx) => {
              if (normalizedQuery && !student.toLowerCase().includes(normalizedQuery)) {
                return null;
              }
              const isAbsent = absentStudents.includes(student);
              return (
                <button
                  key={`${student}_${idx}`}
                  type="button"
                  onClick={() => toggleAbsent(student)}
                  className={`px-3.5 py-2.5 rounded-xl border-2 text-left flex items-center justify-between gap-2 transition-all cursor-pointer active:scale-[0.98] ${
                    isAbsent
                      ? 'bg-rose-500/15 border-rose-500 text-rose-500 shadow-sm'
                      : isLightMode
                        ? 'bg-slate-50 hover:bg-emerald-50 border-slate-200 text-slate-800'
                        : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0 tabular-nums ${
                        isAbsent
                          ? 'bg-rose-500 text-white'
                          : isLightMode
                            ? 'bg-slate-200 text-slate-700'
                            : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className={`text-xs sm:text-sm font-bold truncate ${isAbsent ? 'line-through opacity-80' : ''}`}>
                      {student}
                    </span>
                  </div>
                  {isAbsent ? (
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-500 text-white shrink-0 flex items-center gap-1">
                      <UserX className="w-3 h-3" />
                      Vắng
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-emerald-500 shrink-0">Có mặt</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div
          className={`px-5 py-3.5 border-t flex items-center justify-between gap-3 shrink-0 ${
            isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
          }`}
        >
          <span className={`text-xs ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
            Danh sách điểm danh được tự động lưu riêng cho từng lớp học.
          </span>
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm cursor-pointer shadow-md"
          >
            Xong
          </button>
        </div>
      </div>
    </div>
  );
};
