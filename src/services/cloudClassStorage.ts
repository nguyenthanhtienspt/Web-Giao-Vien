import { supabase } from './supabase';
import { SavedClass } from '../types';

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
        id: row.id,
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
      const { error } = await supabase.from('classes').upsert(
        {
          id: cls.id,
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
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', classId)
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
   * Sync a batch of classes to Cloud
   */
  async syncAllClassesToCloud(userId: string, classes: SavedClass[]): Promise<boolean> {
    if (!supabase || classes.length === 0) return false;
    try {
      const payload = classes.map((cls) => ({
        id: cls.id,
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
