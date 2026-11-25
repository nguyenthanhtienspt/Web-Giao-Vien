import { GroupItem, GroupScore, ClassMonthlyStudentScores } from '../types';

export const SCORE_GROUP_PALETTES = [
  { color: 'border-blue-500', badgeColor: 'bg-blue-600' },
  { color: 'border-emerald-500', badgeColor: 'bg-emerald-600' },
  { color: 'border-amber-500', badgeColor: 'bg-amber-600' },
  { color: 'border-rose-500', badgeColor: 'bg-rose-600' },
  { color: 'border-purple-500', badgeColor: 'bg-purple-600' },
  { color: 'border-cyan-500', badgeColor: 'bg-cyan-600' },
  { color: 'border-orange-500', badgeColor: 'bg-orange-600' },
  { color: 'border-pink-500', badgeColor: 'bg-pink-600' },
  { color: 'border-lime-500', badgeColor: 'bg-lime-600' },
  { color: 'border-teal-500', badgeColor: 'bg-teal-600' },
  { color: 'border-indigo-500', badgeColor: 'bg-indigo-600' },
  { color: 'border-fuchsia-500', badgeColor: 'bg-fuchsia-600' },
];

export const DEFAULT_QUESTIONS = [
  'Câu 1: Nêu nội dung trọng tâm của bài học hôm trước?',
  'Câu 2: Trình bày khái niệm hoặc công thức quan trọng nhất vừa học?',
  'Câu 3: Cho một ví dụ thực tế minh họa cho kiến thức trong bài?',
  'Câu 4: Giải thích nguyên nhân / ý nghĩa của hiện tượng được nêu trong bài?',
  'Câu 5: Vận dụng kiến thức vừa học để giải quyết bài tập tình huống nhanh?',
  'Câu 6: So sánh điểm giống và khác nhau giữa hai khái niệm vừa tìm hiểu?',
];

const ABSENT_KEY = 'tro_ly_absent_by_class_v1';
const PICKED_KEY = 'tro_ly_picked_by_class_v1';
const SPLIT_GROUPS_KEY = 'tro_ly_split_groups_by_class_v1';
const SCOREBOARD_BY_CLASS_KEY = 'tro_ly_scoreboard_by_class_v1';
const STUDENT_MONTHLY_SCORES_KEY = 'tro_ly_student_monthly_scores_v1';
const LEGACY_SCOREBOARD_KEY = 'tro_ly_lop_hoc_scoreboard_v2';
const QUESTION_BANK_KEY = 'tro_ly_question_bank_v1';

export function getCurrentMonthKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function shiftMonthKey(monthKey: string, deltaMonths: number): string {
  const [yStr, mStr] = monthKey.split('-');
  const y = parseInt(yStr, 10) || new Date().getFullYear();
  const m = (parseInt(mStr, 10) || 1) - 1;
  const d = new Date(y, m + deltaMonths, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function formatMonthLabel(monthKey: string): string {
  const [yStr, mStr] = monthKey.split('-');
  const m = parseInt(mStr, 10);
  if (!yStr || isNaN(m)) return monthKey;
  return `Tháng ${String(m).padStart(2, '0')} / ${yStr}`;
}

export function normalizeGradeList(raw: unknown): number[] {
  if (Array.isArray(raw)) {
    return raw
      .map((v) => Number(v))
      .filter((n) => Number.isFinite(n) && n >= 0 && n <= 10)
      .map((n) => Math.round(n * 100) / 100);
  }
  if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0 && raw <= 10) {
    return [Math.round(raw * 100) / 100];
  }
  return [];
}

export function normalizeMonthlyScores(raw: unknown): ClassMonthlyStudentScores {
  if (!raw || typeof raw !== 'object') return {};
  const result: ClassMonthlyStudentScores = {};
  Object.entries(raw as Record<string, unknown>).forEach(([monthKey, monthVal]) => {
    if (!monthVal || typeof monthVal !== 'object') return;
    const cleanMonth: Record<string, number[]> = {};
    Object.entries(monthVal as Record<string, unknown>).forEach(([studentName, val]) => {
      const grades = normalizeGradeList(val);
      if (grades.length > 0) {
        cleanMonth[studentName] = grades;
      }
    });
    result[monthKey] = cleanMonth;
  });
  return result;
}

export function calcGradeStats(grades: number[]): {
  count: number;
  sum: number;
  avg: number;
  max: number;
} {
  if (!grades || grades.length === 0) {
    return { count: 0, sum: 0, avg: 0, max: 0 };
  }
  const sum = grades.reduce((acc, g) => acc + g, 0);
  const avg = Math.round((sum / grades.length) * 10) / 10;
  const max = Math.max(...grades);
  return {
    count: grades.length,
    sum: Math.round(sum * 100) / 100,
    avg,
    max,
  };
}

export interface QuestionBankState {
  enabled: boolean;
  avoidRepeat: boolean;
  questions: string[];
  asked: string[];
}

export function createDefaultScoreGroups(count: number = 8): GroupScore[] {
  const safeCount = Math.max(2, Math.min(12, count));
  return Array.from({ length: safeCount }, (_, i) => {
    const p = SCORE_GROUP_PALETTES[i % SCORE_GROUP_PALETTES.length];
    return {
      id: i + 1,
      name: `Nhóm ${i + 1}`,
      score: 0,
      color: p.color,
      badgeColor: p.badgeColor,
    };
  });
}

export function convertSplitGroupsToScoreGroups(
  splitGroups: GroupItem[],
  existingScores?: GroupScore[]
): GroupScore[] {
  return splitGroups.map((g, idx) => {
    const p = SCORE_GROUP_PALETTES[idx % SCORE_GROUP_PALETTES.length];
    const prev = existingScores?.find((e) => e.id === g.id || e.name === g.name);
    return {
      id: g.id,
      name: g.name,
      score: prev ? prev.score : 0,
      color: g.borderColor || p.color,
      badgeColor: p.badgeColor,
      leader: g.leader,
      memberCount: g.members.length,
    };
  });
}

function readJsonMap<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJsonMap<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Failed to write ${key}`, e);
  }
}

export const classroomStateStorage = {
  // 1. Absent students per class
  getAbsentForClass(classId: string): string[] {
    const map = readJsonMap<Record<string, string[]>>(ABSENT_KEY, {});
    return Array.isArray(map[classId]) ? map[classId] : [];
  },

  saveAbsentForClass(classId: string, absentNames: string[]): void {
    const map = readJsonMap<Record<string, string[]>>(ABSENT_KEY, {});
    map[classId] = absentNames;
    writeJsonMap(ABSENT_KEY, map);
  },

  // 2. Picked history per class
  getPickedForClass(classId: string): { numbers: number[]; items: string[] } {
    const map = readJsonMap<Record<string, { numbers: number[]; items: string[] }>>(PICKED_KEY, {});
    return map[classId] || { numbers: [], items: [] };
  },

  savePickedForClass(classId: string, data: { numbers: number[]; items: string[] }): void {
    const map = readJsonMap<Record<string, { numbers: number[]; items: string[] }>>(PICKED_KEY, {});
    map[classId] = data;
    writeJsonMap(PICKED_KEY, map);
  },

  // 3. Split groups per class
  getSplitGroupsForClass(classId: string): GroupItem[] | null {
    const map = readJsonMap<Record<string, GroupItem[]>>(SPLIT_GROUPS_KEY, {});
    return Array.isArray(map[classId]) && map[classId].length > 0 ? map[classId] : null;
  },

  saveSplitGroupsForClass(classId: string, groups: GroupItem[]): void {
    const map = readJsonMap<Record<string, GroupItem[]>>(SPLIT_GROUPS_KEY, {});
    map[classId] = groups;
    writeJsonMap(SPLIT_GROUPS_KEY, map);
  },

  // 4. Scoreboard per class
  getScoreboardForClass(classId: string): GroupScore[] {
    const map = readJsonMap<Record<string, GroupScore[]>>(SCOREBOARD_BY_CLASS_KEY, {});
    if (Array.isArray(map[classId]) && map[classId].length > 0) {
      return map[classId];
    }
    // Migrate legacy single scoreboard once if map is completely empty
    if (Object.keys(map).length === 0) {
      const legacy = readJsonMap<GroupScore[] | null>(LEGACY_SCOREBOARD_KEY, null);
      if (Array.isArray(legacy) && legacy.length > 0) {
        map[classId] = legacy;
        writeJsonMap(SCOREBOARD_BY_CLASS_KEY, map);
        return legacy;
      }
    }
    return createDefaultScoreGroups(8);
  },

  saveScoreboardForClass(classId: string, groups: GroupScore[]): void {
    const map = readJsonMap<Record<string, GroupScore[]>>(SCOREBOARD_BY_CLASS_KEY, {});
    map[classId] = groups;
    writeJsonMap(SCOREBOARD_BY_CLASS_KEY, map);
  },

  // 4b. Individual student grades by month per class: classId -> { "YYYY-MM": { [studentName]: [7, 8, 9] } }
  getMonthlyScoresForClass(classId: string): ClassMonthlyStudentScores {
    const map = readJsonMap<Record<string, unknown>>(STUDENT_MONTHLY_SCORES_KEY, {});
    return normalizeMonthlyScores(map[classId]);
  },

  saveMonthlyScoresForClass(classId: string, monthlyScores: ClassMonthlyStudentScores): void {
    const map = readJsonMap<Record<string, ClassMonthlyStudentScores>>(STUDENT_MONTHLY_SCORES_KEY, {});
    map[classId] = monthlyScores;
    writeJsonMap(STUDENT_MONTHLY_SCORES_KEY, map);
  },

  // 5. Question bank for Random Picker
  getQuestionBank(): QuestionBankState {
    const fallback: QuestionBankState = {
      enabled: false,
      avoidRepeat: true,
      questions: DEFAULT_QUESTIONS,
      asked: [],
    };
    const saved = readJsonMap<QuestionBankState | null>(QUESTION_BANK_KEY, null);
    if (!saved || !Array.isArray(saved.questions)) return fallback;
    return {
      enabled: Boolean(saved.enabled),
      avoidRepeat: saved.avoidRepeat !== false,
      questions: saved.questions.length > 0 ? saved.questions : DEFAULT_QUESTIONS,
      asked: Array.isArray(saved.asked) ? saved.asked : [],
    };
  },

  saveQuestionBank(state: QuestionBankState): void {
    writeJsonMap(QUESTION_BANK_KEY, state);
  },
};
