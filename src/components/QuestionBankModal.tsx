import React, { useState, useRef, useEffect } from 'react';
import { X, HelpCircle, FileSpreadsheet, RotateCcw, Check } from 'lucide-react';
import * as XLSX from 'xlsx';
import { QuestionBankState, DEFAULT_QUESTIONS } from '../services/classroomStateStorage';

interface QuestionBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  questionBank: QuestionBankState;
  onSaveQuestionBank: (next: QuestionBankState) => void;
  isLightMode: boolean;
}

export const QuestionBankModal: React.FC<QuestionBankModalProps> = ({
  isOpen,
  onClose,
  questionBank,
  onSaveQuestionBank,
  isLightMode,
}) => {
  const [text, setText] = useState(() => questionBank.questions.join('\n'));
  const [enabled, setEnabled] = useState(questionBank.enabled);
  const [avoidRepeat, setAvoidRepeat] = useState(questionBank.avoidRepeat);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setText(questionBank.questions.join('\n'));
      setEnabled(questionBank.enabled);
      setAvoidRepeat(questionBank.avoidRepeat);
    }
  }, [isOpen, questionBank]);

  if (!isOpen) return null;

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      if (file.name.endsWith('.txt')) {
        const raw = await file.text();
        setText(raw);
      } else {
        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(buffer, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, { header: 1 });
        const extracted: string[] = [];
        rows.forEach((r) => {
          const line = (r || [])
            .map((c) => String(c ?? '').trim())
            .filter(Boolean)
            .join(' - ');
          if (line.length > 3) extracted.push(line);
        });
        if (extracted.length > 0) {
          setText(extracted.join('\n'));
        }
      }
    } catch {
      alert('Không thể đọc file câu hỏi. Vui lòng chọn file .xlsx hoặc .txt!');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = () => {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const finalQuestions = lines.length > 0 ? lines : DEFAULT_QUESTIONS;
    onSaveQuestionBank({
      enabled,
      avoidRepeat,
      questions: finalQuestions,
      asked: questionBank.asked.filter((q) => finalQuestions.includes(q)),
    });
    onClose();
  };

  const countLines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div
        className={`w-full max-w-2xl rounded-3xl border-4 overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 ${
          isLightMode
            ? 'bg-white border-amber-500 text-slate-900'
            : 'bg-slate-900 border-amber-500 text-white'
        }`}
      >
        <div className="p-5 bg-amber-500 text-slate-950 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <HelpCircle className="w-7 h-7" />
            <div>
              <h3 className="text-lg sm:text-xl font-black font-display uppercase">
                NGÂN HÀNG CÂU HỎI KIỂM TRA BÀI CŨ
              </h3>
              <p className="text-xs font-semibold text-amber-950/80">
                Tự động rút ngẫu nhiên 1 câu hỏi hiển thị kèm tên học sinh được gọi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-black/10 hover:bg-black/20 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto flex-1 flex flex-col gap-4">
          {/* Toggles */}
          <div
            className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              isLightMode ? 'bg-amber-50/70 border-amber-200' : 'bg-slate-950/60 border-slate-800'
            }`}
          >
            <label className="flex items-center gap-2.5 text-sm font-black cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="w-4 h-4 rounded accent-amber-500 cursor-pointer"
              />
              <span>Bật ghép câu hỏi khi gọi tên học sinh</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
              <input
                type="checkbox"
                checked={avoidRepeat}
                onChange={(e) => setAvoidRepeat(e.target.checked)}
                className="w-4 h-4 rounded accent-indigo-600 cursor-pointer"
              />
              <span>Không lặp lại câu đã hỏi ({questionBank.asked.length} câu đã hỏi)</span>
            </label>
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-bold text-slate-400">
              Mỗi dòng là 1 câu hỏi ({countLines} câu):
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-500 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Nhập từ Excel / .txt</span>
              </button>
              {questionBank.asked.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    onSaveQuestionBank({
                      ...questionBank,
                      asked: [],
                    })
                  }
                  className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-500 text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Đặt lại câu đã hỏi</span>
                </button>
              )}
            </div>
          </div>

          <textarea
            rows={9}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Nhập mỗi dòng 1 câu hỏi bài dạy..."
            className={`w-full p-4 rounded-2xl border font-sans text-sm leading-relaxed outline-none resize-none ${
              isLightMode
                ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
                : 'bg-slate-950 border-slate-700 text-white focus:border-amber-400'
            }`}
          />

          <input
            type="file"
            ref={fileInputRef}
            accept=".xlsx,.xls,.csv,.txt"
            className="hidden"
            onChange={handleImportFile}
          />
        </div>

        <div
          className={`px-5 py-3.5 border-t flex items-center justify-end gap-3 shrink-0 ${
            isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
          }`}
        >
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-xl border text-sm font-bold cursor-pointer ${
              isLightMode ? 'border-slate-300 text-slate-700 hover:bg-slate-100' : 'border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Check className="w-4 h-4" />
            <span>Lưu ngân hàng câu hỏi</span>
          </button>
        </div>
      </div>
    </div>
  );
};
