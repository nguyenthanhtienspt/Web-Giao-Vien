import { SavedClass } from '../types';

const STORAGE_KEY = 'tro_ly_lop_hoc_classes_v3';
const ACTIVE_CLASS_KEY = 'tro_ly_lop_hoc_active_class_id_v3';

export const DEFAULT_CLASSES: SavedClass[] = [
  {
    id: 'class_6b',
    name: 'Lớp 6B',
    studentCount: 37,
    students: [
      'Hoàng Thị Phương Anh',
      'Nguyễn Thị Hồng Ánh',
      'Tô Gia Bảo',
      'Nguyễn Thị Bảo Châu',
      'Lê Kiều Dung',
      'Phạm Tiến Dũng',
      'Lê Kiên Giáp',
      'Bế Thị Hải',
      'Hoàng Thị Thu Hằng',
      'Triệu Phúc Hùng',
      'Vương Thị Lan Hương',
      'Phạm Văn Khánh',
      'Lê Tuấn Kiệt',
      'Đoàn Hồng Loan',
      'Đoàn Văn Mạnh',
      'Lê Trà My',
      'Lê Hoàng Bảo Nam',
      'Hoàng Thị Thanh Nga',
      'Đoàn Thảo Nhi',
      'Đoàn Thị Yến Nhi',
      'Hoàng Thị Tâm Như',
      'Đoàn Thị Oanh',
      'Nguyễn Đại Phong',
      'Phạm Thanh Phong',
      'Nguyễn Hà Phương',
      'Phạm Thị Như Quỳnh',
      'Lê Thị Thu Thảo',
      'Phạm Thanh Thúy',
      'Đoàn Thị Thư',
      'Trần Hoàng Minh Thư',
      'Đoàn Thị Tiền',
      'Hoàng Lâm Tùng',
      'Phạm Sơn Tùng',
      'Hoàng Thị Bạch Tuyết',
      'Phạm Huy Vũ',
      'Lê Thảo Vy',
      'Phạm Thế Vỹ',
    ],
    updatedAt: Date.now(),
  },
  {
    id: 'class_9a1',
    name: 'Lớp 9A1',
    studentCount: 34,
    students: [
      'Bùi Hoàng Tâm',
      'Hoàng Gia Hưng',
      'Hoàng Hắc Long',
      'Hoàng Minh Vũ',
      'Hoàng Mạnh Cường',
      'Hoàng Ngọc Tuấn',
      'Hoàng Thanh Tùng',
      'Hoàng Thị Bảo Ngọc',
      'Hoàng Thị Hồng Ngọc',
      'Hứa Anh Kiều',
      'Hứa Nhất Anh',
      'Lê Khánh Thy',
      'Lê Mạnh Thắm',
      'Lê Nguyễn Duy Hoàng',
      'Lê Thị Ngọc Thư',
      'Lê Thị Thu Thủy',
      'Nguyễn Công Doanh',
      'Nguyễn Hoàng Gia Huy',
      'Nguyễn Đức Anh',
      'Ngô Bảo Uyên',
      'Ngô Thị Kiều Oanh',
      'Ngô Thị Lệ Hằng',
      'Phạm Thu Hà',
      'Phạm Thị Mai Thùy',
      'Trương Mạnh Cừ',
      'Trần Gia Huy',
      'Trần Nhật Dương',
      'Trần Thu Huyền',
      'Trần Thị Bảo Trâm',
      'Trần Thị Mỹ Linh',
      'Vương Thị Ngọc Ánh',
      'Đoàn Thúy Liên',
      'Lê Quang Giáp',
      'Trần Ngọc Hân',
    ],
    updatedAt: Date.now(),
  },
  {
    id: 'class_9b',
    name: 'Lớp 9B',
    studentCount: 40,
    students: [
      'Đoàn Thế Anh',
      'Lê Đức Anh',
      'Lê Nguyễn Tuấn Anh',
      'Phạm Thị Phương Anh',
      'Vương Thị Mai Anh',
      'Phạm Ngọc Ánh',
      'Lê Đình Cơ',
      'Phạm Trung Dũng',
      'Đoàn Thành Đạt',
      'Hoàng Thành Đạt',
      'Vương Thị Hà Giang',
      'Phạm Minh Hằng',
      'Trần Thị Ngọc Hân',
      'Vũ Hà Ngọc Hân',
      'Phạm Trung Hiếu',
      'Nguyễn Duy Hoàng',
      'Phạm Gia Huy',
      'Phạm Lê Huy',
      'Phạm Thịnh Hưng',
      'Đặng Quân Kiệt',
      'Hồ Trần Hà Linh',
      'Lê Đức Mạnh',
      'Phạm Ngọc Minh',
      'Phạm Tiến Minh',
      'Hoàng Ngọc Nam',
      'Hoàng Thị Tuyết Nhi (21/02)',
      'Hoàng Thị Tuyết Nhi (12/10)',
      'Đặng Hồng Nhung',
      'Lê Khánh Phương',
      'Phạm Thanh Quyên',
      'Hoàng Như Quỳnh',
      'Đoàn Tiến Tài',
      'Hoàng Thị Ngọc Thu',
      'Lê Ngọc Tranh',
      'Ngân Thị Bảo Trinh',
      'Nguyễn Quốc Tuấn',
      'Lê Thị Ánh Tuyết',
      'Phạm Thị Thảo Vi',
      'Lê Thế Vinh',
      'Lê Nhật Vy',
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
      'Bùi Thị Yến',
      'Vũ Gia Huy',
      'Đặng Thùy Dung',
      'Hoàng Gia Khánh',
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
  resetToDefault: (): SavedClass[] => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CLASSES));
        localStorage.setItem(ACTIVE_CLASS_KEY, DEFAULT_CLASSES[0].id);
      } catch {
        // Ignore
      }
    }
    return DEFAULT_CLASSES;
  },
};
