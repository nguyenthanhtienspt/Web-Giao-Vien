import { supabase } from './supabase';
import { SavedClass } from '../types';

/**
 * Helper to ensure class IDs in the database are uniquely scoped to each user.
 * This guarantees that multiple teachers with the same class ID (e.g. 'class_6a1')
 * will never overwrite or conflict with each other in the database.
 */
function toCloudId(userId: string, classId: string): string {
  if (classId.startsWith(`${userId}_`)) return classId;
  return `${userId}_${classId}`;
}

function fromCloudId(userId: string, cloudId: string): string {
  if (cloudId.startsWith(`${userId}_`)) {
    return cloudId.slice(`${userId}_`.length);
  }
  return cloudId;
}

export const cloudClassStorage = {
  /**
   * Fetch all classes owned by the authenticated teacher
   */
  async getClassesFromCloud(userId: string): Promise<SavedClass[] | null> {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('user_id', userId)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error loading classes from Supabase:', error);
        return null;
      }

      if (!data) return [];

      return data.map((row: any) => ({
        id: fromCloudId(userId, row.id),
        name: row.name,
        studentCount: row.student_count || 0,
        students: Array.isArray(row.students) ? row.students : [],
        updatedAt: Number(row.updated_at) || Date.now(),
      }));
    } catch (err) {
      console.error('Unexpected error loading classes from cloud:', err);
      return null;
    }
  },

  /**
   * Save or update a single class on Cloud
   */
  async saveClassToCloud(userId: string, cls: SavedClass): Promise<boolean> {
    if (!supabase) return false;
    try {
      const cloudId = toCloudId(userId, cls.id);
      const { error } = await supabase.from('classes').upsert(
        {
          id: cloudId,
          user_id: userId,
          name: cls.name,
          student_count: cls.studentCount,
          students: cls.students,
          updated_at: cls.updatedAt || Date.now(),
        },
        { onConflict: 'id' }
      );

      if (error) {
        console.error('Error saving class to Supabase:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Unexpected error saving class to cloud:', err);
      return false;
    }
  },

  /**
   * Delete a class from Cloud
   */
  async deleteClassFromCloud(userId: string, classId: string): Promise<boolean> {
    if (!supabase) return false;
    try {
      const cloudId = toCloudId(userId, classId);
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', cloudId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting class from Supabase:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Unexpected error deleting class from cloud:', err);
      return false;
    }
  },

  /**
   * Sync a batch of classes to Cloud for this teacher
   */
  async syncAllClassesToCloud(userId: string, classes: SavedClass[]): Promise<boolean> {
    if (!supabase || classes.length === 0) return false;
    try {
      const payload = classes.map((cls) => ({
        id: toCloudId(userId, cls.id),
        user_id: userId,
        name: cls.name,
        student_count: cls.studentCount,
        students: cls.students,
        updated_at: cls.updatedAt || Date.now(),
      }));

      const { error } = await supabase.from('classes').upsert(payload, { onConflict: 'id' });
      if (error) {
        console.error('Error batch syncing classes to Supabase:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Unexpected error batch syncing classes to cloud:', err);
      return false;
    }
  },
};
