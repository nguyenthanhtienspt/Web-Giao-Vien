import { GroupItem, GroupScore } from '../types';

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
const LEGACY_SCOREBOARD_KEY = 'tro_ly_lop_hoc_scoreboard_v2';
const QUESTION_BANK_KEY = 'tro_ly_question_bank_v1';

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
