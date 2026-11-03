import React, { useState, useRef } from 'react';
import { X, Plus, Trash2, Edit2, Check, Download, Upload, School, Users, CheckCircle2, Copy, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { SavedClass } from '../types';
import { classStorage } from '../services/classStorage';

interface ClassManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeClass: SavedClass | null;
  onSelectClass: (cls: SavedClass) => void;
  isLightMode: boolean;
}

export const ClassManagerModal: React.FC<ClassManagerModalProps> = ({
  isOpen,
  onClose,
  activeClass,
  onSelectClass,
  isLightMode,
}) => {
  const [classes, setClasses] = useState<SavedClass[]>(() => classStorage.getClasses());
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [formName, setFormName] = useState<string>('');
  const [formCount, setFormCount] = useState<number>(40);
  const [formStudentsText, setFormStudentsText] = useState<string>('');
  const [copiedExport, setCopiedExport] = useState<boolean>(false);
  const excelInputRef = useRef<HTMLInputElement | null>(null);

  // Excel (.xlsx, .xls, .csv) parser
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const sheetName = wb.SheetNames[0];
      const sheet = wb.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, { header: 1 });

      let detectedClassName = '';
      for (let r = 0; r < Math.min(rows.length, 10); r++) {
        const rowStr = (rows[r] || []).join(' ');
        const match = rowStr.match(/LỚP\s+([0-9]+[a-zA-Z0-9]*)/i);
        if (match) {
          detectedClassName = 'Lớp ' + match[1].toUpperCase();
          break;
        }
      }
      if (!detectedClassName) {
        detectedClassName = file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
      }

      let headerRowIdx = -1;
      let nameColIdx = -1;
      let hoDemColIdx = -1;
      let tenColIdx = -1;

      for (let r = 0; r < Math.min(rows.length, 25); r++) {
        const row = rows[r] || [];
        for (let c = 0; c < row.length; c++) {
          const val = String(row[c] || '').trim().toLowerCase();
          if (val.includes('họ tên') || val.includes('họ và tên') || val === 'tên học sinh' || val === 'học sinh') {
            headerRowIdx = r;
            nameColIdx = c;
            break;
          }
          if (val.includes('họ đệm') || val === 'họ') {
            hoDemColIdx = c;
          }
          if (val === 'tên') {
            tenColIdx = c;
          }
        }
        if (nameColIdx !== -1) break;
        if (hoDemColIdx !== -1 && tenColIdx !== -1) {
          headerRowIdx = r;
          break;
        }
      }

      const students: string[] = [];
      const startRow = headerRowIdx !== -1 ? headerRowIdx + 1 : 0;

      for (let r = startRow; r < rows.length; r++) {
        const row = rows[r] || [];
        let name = '';
        if (nameColIdx !== -1) {
          name = String(row[nameColIdx] || '').trim();
        } else if (hoDemColIdx !== -1 && tenColIdx !== -1) {
          const ho = String(row[hoDemColIdx] || '').trim();
          const ten = String(row[tenColIdx] || '').trim();
          name = (ho + ' ' + ten).trim();
        }
        if (
          name &&
          name.length >= 2 &&
          !/^\d+$/.test(name) &&
          !name.toLowerCase().includes('họ tên') &&
          !name.toLowerCase().includes('tổng số')
        ) {
          students.push(name);
        }
      }

      if (students.length === 0) {
        alert('Không tìm thấy cột Họ và Tên trong file Excel! Thầy vui lòng kiểm tra lại file.');
        return;
      }

      // Automatically fill the edit form with the parsed class data
      setIsEditing(true);
      setEditingId(null);
      setFormName(detectedClassName);
      setFormCount(students.length);
      setFormStudentsText(students.join('\n'));
      alert(`Đã đọc thành công ${students.length} học sinh từ file "${file.name}"! Thầy hãy kiểm tra và nhấn "Thêm lớp mới" nhé.`);
    } catch (err) {
      console.error('Lỗi khi đọc file Excel:', err);
      alert('Không thể đọc file Excel này. Vui lòng kiểm tra file định dạng .xlsx, .xls hoặc .csv!');
    } finally {
      if (excelInputRef.current) {
        excelInputRef.current.value = '';
      }
    }
  };

  if (!isOpen) return null;

  const refreshList = () => {
    const list = classStorage.getClasses();
    setClasses(list);
  };

  const handleOpenAdd = () => {
    setIsEditing(true);
    setEditingId(null);
    setFormName(`Lớp ${classes.length + 6}A`);
    setFormCount(40);
    setFormStudentsText('');
  };

  const handleOpenEdit = (cls: SavedClass) => {
    setIsEditing(true);
    setEditingId(cls.id);
    setFormName(cls.name);
    setFormCount(cls.studentCount);
    setFormStudentsText(cls.students.join('\n'));
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = formName.trim();
    if (!trimmedName) {
      alert('Vui lòng nhập tên lớp!');
      return;
    }

    const students = formStudentsText
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    // Auto-adjust count if student list exceeds count
    const finalCount = Math.max(formCount, students.length || formCount);

    if (editingId) {
      // Update
      const existing = classes.find((c) => c.id === editingId);
      if (existing) {
        const updated: SavedClass = {
          ...existing,
          name: trimmedName,
          studentCount: finalCount,
          students,
          updatedAt: Date.now(),
        };
        classStorage.updateClass(updated);
        if (activeClass?.id === editingId) {
          onSelectClass(updated);
        }
      }
    } else {
      // Add
      const created = classStorage.addClass({
        name: trimmedName,
        studentCount: finalCount,
        students,
      });
      onSelectClass(created);
    }

    refreshList();
    setIsEditing(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (classes.length <= 1) {
      alert('Phải giữ lại ít nhất 1 lớp học trong hệ thống!');
      return;
    }
    if (window.confirm(`Thầy/Cô có chắc chắn muốn xóa danh sách "${name}"?`)) {
      const remaining = classStorage.deleteClass(id);
      setClasses(remaining);
      if (activeClass?.id === id && remaining.length > 0) {
        onSelectClass(remaining[0]);
      }
    }
  };

  const handleExportJSON = () => {
    const json = classStorage.exportJSON();
    navigator.clipboard.writeText(json);
    setCopiedExport(true);
    setTimeout(() => setCopiedExport(false), 2500);
  };

  const handleImportJSONPrompt = () => {
    const input = prompt('Dán chuỗi dữ liệu JSON danh sách lớp vào đây:');
    if (input) {
      const success = classStorage.importJSON(input);
      if (success) {
        refreshList();
        const first = classStorage.getClasses()[0];
        if (first) onSelectClass(first);
        alert('Đã nhập danh sách lớp thành công!');
      } else {
        alert('Dữ liệu JSON không hợp lệ!');
      }
    }
  };

  const handleResetToSystemDefault = () => {
    if (window.confirm('Thầy có chắc chắn muốn nạp lại danh sách lớp chuẩn (Lớp 9A1, 9B...) từ hệ thống không?')) {
      const defaultList = classStorage.resetToDefault();
      setClasses(defaultList);
      if (defaultList.length > 0) {
        onSelectClass(defaultList[0]);
      }
      alert('Đã nạp thành công danh sách lớp chuẩn (Lớp 9A1, 9B...) vào hệ thống!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className={`w-full max-w-3xl rounded-3xl border-4 overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 ${
        isLightMode ? 'bg-white border-indigo-500' : 'bg-slate-900 border-indigo-500'
      }`}>
        {/* Header */}
        <div className="p-5 bg-indigo-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <School className="w-7 h-7" />
            <div>
              <h3 className="text-xl font-black font-display uppercase tracking-wide">
                QUẢN LÝ DANH SÁCH THEO LỚP
              </h3>
              <p className="text-xs text-indigo-200">
                Lưu trữ các lớp để tái sử dụng nhanh khi chuyển tiết dạy
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

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 flex flex-col gap-6">
          {isEditing ? (
            /* --- FORM ADD / EDIT CLASS --- */
            <form onSubmit={handleSaveForm} className="flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                <h4 className="font-bold text-base text-indigo-400 font-display">
                  {editingId ? 'CHỈNH SỬA THÔNG TIN LỚP' : 'THÊM LỚP HỌC MỚI'}
                </h4>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                >
                  Quay lại danh sách
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">
                    Tên lớp / Nhóm học tập:
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ví dụ: Lớp 6A, Lớp 7B, Nhóm Bồi dưỡng..."
                    className={`w-full px-4 py-2.5 rounded-xl border font-bold text-sm outline-none ${
                      isLightMode
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-500'
                        : 'bg-slate-950 border-slate-700 text-white focus:border-indigo-400'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">
                    Sĩ số lớp (Học sinh):
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={60}
                    required
                    value={formCount}
                    onChange={(e) => setFormCount(Number(e.target.value))}
                    className={`w-full px-4 py-2.5 rounded-xl border font-bold text-sm outline-none ${
                      isLightMode
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-500'
                        : 'bg-slate-950 border-slate-700 text-white focus:border-indigo-400'
                    }`}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                  <label className="text-xs font-bold text-slate-400">
                    Danh sách tên học sinh (Mỗi dòng 1 em - có thể để trống nếu chỉ dùng số 1–{formCount}):
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => excelInputRef.current?.click()}
                      className="text-xs px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 cursor-pointer font-bold"
                      title="Tự động nạp tên học sinh từ file Excel"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Nạp từ file Excel</span>
                    </button>
                    <span className="text-xs font-mono text-indigo-400">
                      {formStudentsText.split('\n').filter((s) => s.trim().length > 0).length} tên
                    </span>
                  </div>
                </div>
                <textarea
                  rows={8}
                  value={formStudentsText}
                  onChange={(e) => setFormStudentsText(e.target.value)}
                  placeholder="Dán danh sách tên học sinh từ Excel hoặc Word tại đây...&#10;Nguyễn Văn An&#10;Trần Thị Bình&#10;Lê Văn Cường"
                  className={`w-full p-4 rounded-xl border font-mono text-xs sm:text-sm leading-relaxed outline-none resize-none ${
                    isLightMode
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-500'
                      : 'bg-slate-950 border-slate-700 text-white focus:border-indigo-400'
                  }`}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-black flex items-center gap-2 cursor-pointer shadow-lg"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingId ? 'Lưu thay đổi' : 'Thêm lớp mới'}</span>
                </button>
              </div>
            </form>
          ) : (
            /* --- CLASS LIST OVERVIEW --- */
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  CÁC LỚP HỌC ĐÃ LƯU TRÊN TRÌNH DUYỆT ({classes.length} LỚP)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => excelInputRef.current?.click()}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-black flex items-center gap-1.5 shadow transition-all cursor-pointer active:scale-95"
                    title="Tải lên file Excel (.xlsx, .xls) danh sách học sinh"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Nhập từ Excel (.xlsx)</span>
                  </button>
                  <button
                    onClick={handleOpenAdd}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-black flex items-center gap-1.5 shadow transition-all cursor-pointer active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Thêm lớp mới</span>
                  </button>
                </div>
              </div>

              {/* Grid of Classes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {classes.map((cls) => {
                  const isActive = activeClass?.id === cls.id;

                  return (
                    <div
                      key={cls.id}
                      className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between gap-3 ${
                        isActive
                          ? isLightMode
                            ? 'bg-indigo-50/80 border-indigo-600 shadow-md ring-2 ring-indigo-500/30'
                            : 'bg-indigo-950/60 border-indigo-400 shadow-lg ring-2 ring-indigo-500/40'
                          : isLightMode
                            ? 'bg-slate-50 border-slate-200 hover:border-slate-300'
                            : 'bg-slate-800/80 border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-black font-display text-lg tracking-tight">
                              {cls.name}
                            </h4>
                            {isActive && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Đang dạy
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                            <span>Sĩ số: <strong className="text-white">{cls.studentCount} HS</strong></span>
                            <span>·</span>
                            <span>Danh sách tên: <strong className="text-white">{cls.students.length} em</strong></span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(cls)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors cursor-pointer"
                            title="Sửa thông tin lớp"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(cls.id, cls.name)}
                            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/60 transition-colors cursor-pointer"
                            title="Xóa lớp này"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Preview names snippet */}
                      {cls.students.length > 0 && (
                        <div className="text-[11px] text-slate-400 line-clamp-1 bg-black/20 px-2.5 py-1 rounded-lg">
                          {cls.students.slice(0, 5).join(', ')}...
                        </div>
                      )}

                      {/* Select this class button */}
                      <button
                        onClick={() => {
                          onSelectClass(cls);
                          onClose();
                        }}
                        className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          isActive
                            ? 'bg-emerald-600 text-white shadow'
                            : isLightMode
                              ? 'bg-slate-200 hover:bg-indigo-600 hover:text-white text-slate-800'
                              : 'bg-slate-700 hover:bg-indigo-600 hover:text-white text-slate-200'
                        }`}
                      >
                        {isActive ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Đang chọn lớp này</span>
                          </>
                        ) : (
                          <span>Chọn lớp này để giảng dạy</span>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Backup & Restore Tools */}
              <div className="mt-4 pt-4 border-t border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
                <span className="text-slate-400 font-semibold">
                  Dữ liệu được lưu an toàn trên máy tính này (Offline)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportJSON}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5 cursor-pointer"
                    title="Sao chép toàn bộ danh sách lớp dạng JSON để lưu trữ"
                  >
                    {copiedExport ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedExport ? 'Đã sao chép JSON!' : 'Sao lưu danh sách'}</span>
                  </button>
                  <button
                    onClick={handleImportJSONPrompt}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5 cursor-pointer"
                    title="Nhập danh sách từ chuỗi JSON đã sao lưu"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Khôi phục từ file</span>
                  </button>
                  <button
                    onClick={handleResetToSystemDefault}
                    className="px-3 py-1.5 rounded-lg bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/60 flex items-center gap-1.5 cursor-pointer"
                    title="Nạp lại danh sách học sinh chuẩn từ hệ thống (Lớp 6A1, 6A2, 6B, 7A1, 7A2, 9A1, 9B)"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Nạp lớp chuẩn (6A1, 6A2, 6B, 7A1, 7A2, 9A1, 9B)</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Hidden Excel File Input */}
        <input
          type="file"
          ref={excelInputRef}
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={handleExcelUpload}
        />
      </div>
    </div>
  );
};
