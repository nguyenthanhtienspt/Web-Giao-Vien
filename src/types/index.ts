/**
 * Shared types for Classroom Projector Assistant
 */

export type TabId = 'random' | 'groups' | 'timer' | 'scores';

export interface GroupItem {
  id: number;
  name: string;
  color: string;
  borderColor: string;
  bgColor: string;
  textColor: string;
  members: (number | string)[];
  leader?: number | string;
}

export interface GroupScore {
  id: number;
  name: string;
  score: number;
  color: string;
  badgeColor: string;
  leader?: number | string;
  memberCount?: number;
}

/**
 * Map of monthKey ("YYYY-MM") -> { [studentName]: score }
 */
export type ClassMonthlyStudentScores = Record<string, Record<string, number>>;

export interface SavedClass {
  id: string;
  name: string;
  studentCount: number;
  students: string[];
  updatedAt: number;
}

export interface TimerSnapshot {
  timeLeft: number;
  initialDuration: number;
  isRunning: boolean;
  isTimeUp: boolean;
}
