import React, { useState, useRef, useEffect } from 'react';
import { X, HelpCircle, FileSpreadsheet, RotateCcw, Check, Eye } from 'lucide-react';
import {
  QuestionBankState,
  QuestionSetKey,
  QUESTION_SET_LABELS,
  DEFAULT_QUESTIONS,
} from '../services/classroomStateStorage';

interface QuestionBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  questionBank: QuestionBankState;
  activeClassName?: string;
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
  const [editingSet, setEditingSet] = useState<QuestionSetKey>(questionBank.activeSet || 'chung');
  const [setsDraft, setSetsDraft] = useState<Record<QuestionSetKey, string>>(() => ({
    chung: (questionBank.sets.chung || []).join('\n'),
    khoi6: (questionBank.sets.khoi6 || []).join('\n'),
    khoi7: (questionBank.sets.khoi7 || []).join('\n'),
    khoi8: (questionBank.sets.khoi8 || []).join('\n'),
    khoi9: (questionBank.sets.khoi9 || []).join('\n'),
  }));
  const [enabled, setEnabled] = useState(questionBank.enabled);
  const [avoidRepeat, setAvoidRepeat] = useState(questionBank.avoidRepeat);
  const [autoMatchGrade, setAutoMatchGrade] = useState(questionBank.autoMatchGrade);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setEditingSet(questionBank.activeSet || 'chung');
      setSetsDraft({
        chung: (questionBank.sets.chung || []).join('\n'),
        khoi6: (questionBank.sets.khoi6 || []).join('\n'),
        khoi7: (questionBank.sets.khoi7 || []).join('\n'),
        khoi8: (questionBank.sets.khoi8 || []).join('\n'),
        khoi9: (questionBank.sets.khoi9 || []).join('\n'),
      });
      setEnabled(questionBank.enabled);
      setAvoidRepeat(questionBank.avoidRepeat);
      setAutoMatchGrade(questionBank.autoMatchGrade);
    }
  }, [isOpen, questionBank]);

  if (!isOpen) return null;

  const currentText = setsDraft[editingSet] || '';

  const updateCurrentText = (val: string) => {
    setSetsDraft((prev) => ({
      ...prev,
      [editingSet]: val,
    }));
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      if (file.name.endsWith('.txt')) {
        const raw = await file.text();
        updateCurrentText(raw);
      } else {
        const XLSX = await import('xlsx');
        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(buffer, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, { header: 1 });
        const extracted: string[] = [];
        rows.forEach((r) => {
          const cells = (r || []).map((c) => String(c ?? '').trim()).filter(Boolean);
          if (cells.length === 0) return;
          // If 2+ columns in Excel, treat Col 1 as Question and Col 2 as Answer!
          if (cells.length >= 2) {
            extracted.push(`${cells[0]} | ${cells.slice(1).join(' - ')}`);
          } else if (cells[0].length > 3) {
            extracted.push(cells[0]);
          }
        });
        if (extracted.length > 0) {
          updateCurrentText(extracted.join('\n'));
        }
      }
    } catch {
      // Ignore file parse failure silently or reset input
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = () => {
    const parseLines = (raw: string) =>
      raw
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);

    const nextSets: Record<QuestionSetKey, string[]> = {
      chung: parseLines(setsDraft.chung),
      khoi6: parseLines(setsDraft.khoi6),
      khoi7: parseLines(setsDraft.khoi7),
      khoi8: parseLines(setsDraft.khoi8),
      khoi9: parseLines(setsDraft.khoi9),
    };

    if (
      nextSets.chung.length === 0 &&
      nextSets.khoi6.length === 0 &&
      nextSets.khoi7.length === 0 &&
      nextSets.khoi8.length === 0 &&
      nextSets.khoi9.length === 0
    ) {
      nextSets.chung = [...DEFAULT_QUESTIONS];
    }

    const nextAsked: Record<QuestionSetKey, string[]> = {
      chung: (questionBank.askedBySet.chung || []).filter((q) => nextSets.chung.includes(q)),
      khoi6: (questionBank.askedBySet.khoi6 || []).filter((q) => nextSets.khoi6.includes(q)),
      khoi7: (questionBank.askedBySet.khoi7 || []).filter((q) => nextSets.khoi7.includes(q)),
      khoi8: (questionBank.askedBySet.khoi8 || []).filter((q) => nextSets.khoi8.includes(q)),
      khoi9: (questionBank.askedBySet.khoi9 || []).filter((q) => nextSets.khoi9.includes(q)),
    };

    onSaveQuestionBank({
      enabled,
      avoidRepeat,
      autoMatchGrade,
      activeSet: editingSet,
      sets: nextSets,
      askedBySet: nextAsked,
    });
    onClose();
  };

  const countLines = currentText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean).length;

  const askedInEditingSet = (questionBank.askedBySet[editingSet] || []).length;

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
                NGÂN HÀNG CÂU HỎI THEO KHỐI &amp; ĐÁP ÁN
              </h3>
              <p className="text-xs font-semibold text-amber-950/80">
                Lưu riêng theo Khối 6–9 · Hỗ trợ ẩn đáp án và bấm &ldquo;Lật đáp án&rdquo; trên màn chiếu
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
            className={`p-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
              isLightMode ? 'bg-amber-50/70 border-amber-200' : 'bg-slate-950/60 border-slate-800'
            }`}
          >
            <label className="flex items-center gap-2 text-sm font-black cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="w-4 h-4 rounded accent-amber-500 cursor-pointer"
              />
              <span>Bật ghép câu hỏi khi gọi tên</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
              <input
                type="checkbox"
                checked={autoMatchGrade}
                onChange={(e) => setAutoMatchGrade(e.target.checked)}
                className="w-4 h-4 rounded accent-emerald-600 cursor-pointer"
              />
              <span>Tự khớp theo Khối của lớp</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
              <input
                type="checkbox"
                checked={avoidRepeat}
                onChange={(e) => setAvoidRepeat(e.target.checked)}
                className="w-4 h-4 rounded accent-indigo-600 cursor-pointer"
              />
              <span>Không lặp câu đã hỏi</span>
            </label>
          </div>

          {/* Grade / Set Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {(Object.keys(QUESTION_SET_LABELS) as QuestionSetKey[]).map((key) => {
              const cnt = (setsDraft[key] || '')
                .split('\n')
                .map((s) => s.trim())
                .filter(Boolean).length;
              const isCurrent = editingSet === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setEditingSet(key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    isCurrent
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : isLightMode
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  <span>{QUESTION_SET_LABELS[key]}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      isCurrent ? 'bg-black/15 text-slate-950' : 'bg-slate-500/20 text-slate-400'
                    }`}
                  >
                    {cnt}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Syntax Hint */}
          <div
            className={`px-3.5 py-2.5 rounded-xl border text-xs flex items-start gap-2 ${
              isLightMode
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200'
            }`}
          >
            <Eye className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <strong>Mẹo tạo nút Lật Đáp Án:</strong> Dùng dấu gạch đứng{' '}
              <code className="px-1.5 py-0.5 rounded bg-black/20 font-mono font-bold">|</code> để ngăn cách câu hỏi và đáp án. Ví dụ:{' '}
              <span className="italic">
                Phát biểu hệ thức định luật Ôm? | I = U / R
              </span>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-bold text-slate-400">
              Đang soạn <strong>{QUESTION_SET_LABELS[editingSet]}</strong> ({countLines} câu):
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-500 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                title="Nếu file Excel có 2 cột: Cột 1 là Câu hỏi, Cột 2 tự nhận là Đáp án!"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Nhập Excel (2 cột) / .txt</span>
              </button>
              {askedInEditingSet > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    onSaveQuestionBank({
                      ...questionBank,
                      askedBySet: {
                        ...questionBank.askedBySet,
                        [editingSet]: [],
                      },
                    })
                  }
                  className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-500 text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Đặt lại câu đã hỏi ({askedInEditingSet})</span>
                </button>
              )}
            </div>
          </div>

          <textarea
            rows={8}
            value={currentText}
            onChange={(e) => updateCurrentText(e.target.value)}
            placeholder={`Nhập mỗi dòng 1 câu hỏi cho ${QUESTION_SET_LABELS[editingSet]}...\nVí dụ:\nCâu 1: Công thức tính vận tốc là gì? | v = s / t\nCâu 2: Nêu ý nghĩa lịch sử của chiến thắng Bạch Đằng năm 938?`}
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
              isLightMode
                ? 'border-slate-300 text-slate-700 hover:bg-slate-100'
                : 'border-slate-700 text-slate-300 hover:bg-slate-800'
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
