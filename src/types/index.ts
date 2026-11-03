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
}

export interface SavedClass {
  id: string;
  name: string;
  studentCount: number;
  students: string[];
  updatedAt: number;
}
