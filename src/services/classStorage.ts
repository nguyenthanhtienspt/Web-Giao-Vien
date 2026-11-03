import { SavedClass } from '../types';

const STORAGE_KEY = 'tro_ly_lop_hoc_classes_v1';
const ACTIVE_CLASS_KEY = 'tro_ly_lop_hoc_active_class_id_v1';

const DEFAULT_CLASSES: SavedClass[] = [
  {
    id: 'class_6a',
    name: 'Lớp 6A',
    studentCount: 40,
    students: [
      'Nguyễn Văn An',
      'Trần Thị Bình',
      'Lê Văn Cường',
      'Phạm Thị Dung',
      'Hoàng Văn Em',
      'Đỗ Thị Hoa',
      'Vũ Đình Khang',
      'Bùi Thị Linh',
      'Đặng Minh Long',
      'Ngô Phương Mai',
      'Dương Quốc Nam',
      'Lý Thu Nga',
      'Mai Tuấn Phong',
      'Đinh Hải Quân',
      'Trịnh Như Quỳnh',
      'Hồ Thanh Sơn',
      'Nguyễn Ngọc Ánh',
      'Trần Quốc Bảo',
      'Lê Minh Châu',
      'Phạm Đức Dũng',
    ],
    updatedAt: Date.now(),
  },
  {
    id: 'class_7b',
    name: 'Lớp 7B',
    studentCount: 38,
    students: [
      'Nguyễn Hoàng Bách',
      'Trần Thùy Chi',
      'Lê Gia Hân',
      'Phạm Quang Huy',
      'Hoàng Minh Khôi',
      'Đỗ Diệu Linh',
      'Vũ Gia Nguyên',
      'Bùi Yến Nhi',
      'Đặng Phúc Khang',
      'Ngô Thảo Nguyên',
      'Dương Trí Đức',
      'Lý Khánh Vân',
    ],
    updatedAt: Date.now(),
  },
  {
    id: 'class_8a1',
    name: 'Lớp 8A1',
    studentCount: 42,
    students: [
      'Nguyễn Tuấn Kiệt',
      'Trần Bảo Ngọc',
      'Lê Tấn Phát',
      'Phạm Khánh Huyền',
      'Võ Minh Quân',
      'Đào Phương Trinh',
      'Lâm Gia Bảo',
      'Nguyễn Hải Đăng',
    ],
    updatedAt: Date.now(),
  },
];

export const classStorage = {
  getClasses: (): SavedClass[] => {
    if (typeof window === 'undefined') return DEFAULT_CLASSES;
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        // Initialize with default sample classes
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CLASSES));
        return DEFAULT_CLASSES;
      }
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
      return DEFAULT_CLASSES;
    } catch {
      return DEFAULT_CLASSES;
    }
  },

  saveClasses: (classes: SavedClass[]) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(classes));
    } catch (e) {
      console.error('Error saving classes to localStorage', e);
    }
  },

  addClass: (newClass: Omit<SavedClass, 'id' | 'updatedAt'>): SavedClass => {
    const classes = classStorage.getClasses();
    const createdClass: SavedClass = {
      ...newClass,
      id: `class_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      updatedAt: Date.now(),
    };
    const updated = [createdClass, ...classes];
    classStorage.saveClasses(updated);
    classStorage.setActiveClassId(createdClass.id);
    return createdClass;
  },

  updateClass: (updatedClass: SavedClass) => {
    const classes = classStorage.getClasses();
    const updated = classes.map((c) =>
      c.id === updatedClass.id ? { ...updatedClass, updatedAt: Date.now() } : c
    );
    classStorage.saveClasses(updated);
  },

  deleteClass: (id: string): SavedClass[] => {
    const classes = classStorage.getClasses();
    const filtered = classes.filter((c) => c.id !== id);
    classStorage.saveClasses(filtered);

    // If active class deleted, switch to first available
    const activeId = classStorage.getActiveClassId();
    if (activeId === id && filtered.length > 0) {
      classStorage.setActiveClassId(filtered[0].id);
    }
    return filtered;
  },

  getActiveClassId: (): string => {
    if (typeof window === 'undefined') return DEFAULT_CLASSES[0].id;
    try {
      return localStorage.getItem(ACTIVE_CLASS_KEY) || DEFAULT_CLASSES[0].id;
    } catch {
      return DEFAULT_CLASSES[0].id;
    }
  },

  setActiveClassId: (id: string) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(ACTIVE_CLASS_KEY, id);
    } catch {
      // Ignore
    }
  },

  exportJSON: (): string => {
    const classes = classStorage.getClasses();
    return JSON.stringify(classes, null, 2);
  },

  importJSON: (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Validate items
        const valid = parsed.every(
          (c) => typeof c.name === 'string' && typeof c.studentCount === 'number'
        );
        if (valid) {
          classStorage.saveClasses(parsed);
          if (parsed[0]?.id) {
            classStorage.setActiveClassId(parsed[0].id);
          }
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  },
};
