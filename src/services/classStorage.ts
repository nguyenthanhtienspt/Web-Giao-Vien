import { SavedClass } from '../types';

const STORAGE_KEY = 'tro_ly_lop_hoc_classes_v7';
const ACTIVE_CLASS_KEY = 'tro_ly_lop_hoc_active_class_id_v7';

export const DEFAULT_CLASSES: SavedClass[] = [
  {
    id: 'class_6a1',
    name: 'Lớp 6A1',
    studentCount: 30,
    students: [
      'Hoàng Hải Anh',
      'Ngô Quyền Anh',
      'Vũ Quốc Anh',
      'Nguyễn Hoàng Bảo Chúc',
      'Tằng Văn Cương',
      'Nguyễn Tiến Đạt',
      'Hoàng Thị Thanh Hà',
      'Lê Mạnh Hải',
      'Nguyễn Xuân Hinh',
      'Phạm Đức Hùng',
      'Lê Thu Huyền',
      'Hoàng Gia Hưng',
      'Hoàng Thế Hưng',
      'Hoàng Nhã Khanh',
      'Đặng Kiều Linh',
      'Vũ Đón Lộc',
      'Lê Đức Lượng',
      'Lê Thảo My',
      'Lê Thị Trà My',
      'Phạm Khánh Nga',
      'Trạc Cắm Ngằn',
      'Lê Mạnh Nhất',
      'Lê Đại Phong',
      'Hứa Danh Sơn',
      'Lê Thị Tâm',
      'Vũ Thị Thủy',
      'Phạm Bảo Trâm',
      'Hứa Thanh Tùng',
      'Vũ Kha Tuyền',
      'Lê Thị Vui',
    ],
    updatedAt: Date.now(),
  },
  {
    id: 'class_6a2',
    name: 'Lớp 6A2',
    studentCount: 30,
    students: [
      'Nguyễn Hoài An',
      'Hoàng Thế Anh',
      'Nguyễn Tuấn Anh',
      'Nguyễn Khương Duy',
      'Vũ Đức Dương',
      'Lê Tiến Đạt',
      'Vũ Thị Thu Hằng',
      'Hoàng Thị Hiền',
      'Vương Đức Hiếu',
      'Phạm Thị Thu Huyền',
      'Hoàng Gia Hưng',
      'Lê Thị Lan Hương',
      'Hứa Minh Khôi',
      'Hoàng Thị Hà Linh',
      'Hứa Hoàng Bảo Long',
      'Phạm Thị Hằng Nga',
      'Lê Bảo Ngọc',
      'Vương Thị Yến Nhi',
      'Hoàng Đại Phong',
      'Lê Đình Phúc',
      'Phạm Tiến Quang',
      'Hoàng Như Quỳnh',
      'Trần Phi Sơn',
      'Bùi Nguyễn Công Thành',
      'Nguyễn Tiến Thành',
      'Hứa Anh Thương',
      'Lê Thị Tiền',
      'Mã Thanh Tỉnh',
      'Trần Duy Tuấn',
      'Hoàng Thị Hải Yến',
    ],
    updatedAt: Date.now(),
  },
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
    id: 'class_7a1',
    name: 'Lớp 7A1',
    studentCount: 30,
    students: [
      'Lê Quang Anh',
      'Phạm Thị Lan Anh',
      'Phạm Bảo Chi',
      'Hoàng Thanh Dũng',
      'Hứa Thị Hồng Duyên',
      'Lê Anh Đức',
      'Lê Văn Được',
      'Lê Thị Thúy Hằng',
      'Trần Minh Huân',
      'Ngô Quốc Huy',
      'Trần Gia Khánh',
      'Hứa Tuấn Kiệt',
      'Choóng Vĩnh Kim',
      'Hoàng Tường Lam',
      'Nguyễn Sinh Lộc',
      'Hoàng Tiến Mạnh',
      'Đoàn Đức Nam',
      'Hoàng Thị Tuyết Nhi',
      'Lê Thị Bảo NgọcA 1',
      'Ngô Tú Quyên',
      'Vũ Tiến Thành',
      'Hoàng Ngọc ThảoA',
      'Hứa Như Phương Thảo',
      'Lê Thị Hồng Thuý',
      'Vương Ngọc Thuý',
      'Phạm Thị Bảo Trang',
      'Lê Quỳnh Trang',
      'Phạm Quang Vinh',
      'Phạm Ngọc Vượt',
      'Phạm Thị Thảo Vy',
    ],
    updatedAt: Date.now(),
  },
  {
    id: 'class_7a2',
    name: 'Lớp 7A2',
    studentCount: 31,
    students: [
      'Nguyễn Vân Anh',
      'Lê Tuấn Anh',
      'Đào Mạnh Dũng',
      'Hứa Đặng Thùy Ánh Duyên',
      'Bùi Hoàng Dương',
      'Lê Thị Thùy DươngA',
      'Trần Xuân Đại',
      'Lê Thị Thu HàA',
      'Nguyễn Đoàn Mai Hân',
      'Hoàng Văn Hùng',
      'Ôn Gia Huy',
      'Phạm Nhật Khải',
      'Hoàng Tuấn Kiệt',
      'Hoàng Ngọc Lan',
      'Hoàng Minh NhậtA',
      'Hoàng Kim Ngân',
      'Nguyễn Bảo NgọcA',
      'Phạm Khải Nguyên',
      'Nguyễn Bảo Nhi',
      'Trần Thị Thảo NhiA',
      'Lê Văn Quang',
      'Phạm Duy Thành',
      'Trần Đức ThịnhA',
      'Vương Anh Thư',
      'Phạm Thị Trang',
      'Từ Thị Thu Trang',
      'Trần Bảo Trâm',
      'Phạm Hoàng Nam Trung',
      'Nguyễn Quốc ViệtA',
      'Lê Hoàng Hà Vy',
      'Phạm Thị Ngọc Anh',
    ],
    updatedAt: Date.now(),
  },
  {
    id: 'class_7b',
    name: 'Lớp 7B',
    studentCount: 40,
    students: [
      'Bùi Thị Ngọc Anh',
      'Nguyễn Tô Thiên Ân',
      'Phạm Thị Chinh',
      'Phạm Văn Đạt',
      'Phạm Văn Đại',
      'Đoàn Tiến Đạt',
      'Lê Minh Đức',
      'Phạm Tiến DũngA',
      'Hoàng Thế Duy',
      'Lê Thị Hương Giang',
      'Lê Thị Kiều Hân',
      'Hoàng Đăng Khôi',
      'Phạm Thùy Linh',
      'Vương Phương Linh',
      'Hoàng Thị Thanh Ngân',
      'Phạm Thị Ngọc',
      'Tô Thị Nhàn',
      'Vương Quang Nhật',
      'Đặng Yến Nhi',
      'Lê Thị Yến Nhi',
      'Phạm Nhật Thế Phong',
      'Đoàn Gia Phú',
      'Phạm Thế Phương',
      'Ôn Bích Quyên',
      'Tô Thị Hồng Sang',
      'Lê Thị Phương Thảo',
      'Nguyễn Thị Thu Thảo',
      'Phạm Thị Thảo',
      'Hoàng Thị Ngọc Thi',
      'Đoàn Đức Thiện',
      'Phạm Đức Thịnh',
      'Đặng Thị Anh Thư',
      'Hoàng Hoài Thư',
      'Phạm Tiến Toàn',
      'Lê Thị Thu Trà',
      'Đoàn Thị Ngọc Trâm',
      'Hoàng Thị Bảo Trâm',
      'Đoàn Thị Kiều Trang',
      'Lê Thị Thanh Trúc',
      'Đoàn Bảo Uyên',
    ],
    updatedAt: Date.now(),
  },
  {
    id: 'class_8a1',
    name: 'Lớp 8A1',
    studentCount: 34,
    students: [
      'Hoàng Thị Vân Chi',
      'Hứa Gia Huy',
      'Hứa Lê Duy Khánh',
      'Hứa Văn Trong',
      'Lê Anh Thư',
      'Lê Nhật Tiến',
      'Lê Thanh Trường',
      'Lê Thanh Xuân',
      'Lê Thị Hải Yến',
      'Lê Thị Ngọc Châu',
      'Nguyễn Quyết Tâm',
      'Ngô Kiến Duy',
      'Phạm Thị Huyền',
      'Trương Thị Kiều Oanh',
      'Trần Quốc Toản',
      'Trần Thị Thu Thủy',
      'Trần Thị Thúy Nga',
      'Trần Thị Ánh Tuyết',
      'Trần Tiến Lợi',
      'Vũ Hoàng Gia',
      'Vũ Viết Nam',
      'Vương Trần Thành Đạt',
      'Hoàng Minh Hiếu',
      'Hoàng Thị Thanh Huyền',
      'Hoàng Thị Hà Linh',
      'Hoàng Thị Hồng Nhung',
      'Hoàng Anh Quốc',
      'Hoàng Thu Thảo',
      'Hoàng Bảo Toàn',
      'Hoàng Thị Huyền Trang',
      'Hoàng Mạnh Tùng',
      'Hoàng Bảo Vy',
      'Bùi Thành Đạt',
      'Lê Hoàng Anh Vũ',
    ],
    updatedAt: Date.now(),
  },
  {
    id: 'class_8a2',
    name: 'Lớp 8A2',
    studentCount: 32,
    students: [
      'Chóong Phương Trinh',
      'Dương Hoàng Mai Linh',
      'Hoàng Minh Hiếu',
      'Hoàng Thanh Bình',
      'Hoàng Thị Thùy Dương',
      'Hoàng Trung Đạo',
      'Hoàng Đức Hải',
      'Hoàng Đức Thùy',
      'Hoàng Đức Thịnh',
      'Hứa Mạnh Nguyên',
      'Lê Hòa Phát',
      'Lê Minh Hiếu',
      'Lê Quỳnh Chi',
      'Lê Thị Quý Di',
      'Lê Thị Ánh Nguyệt',
      'Lê Triệu Kiều Trinh',
      'Lê Trần Quỳnh Hương',
      'Lê Việt Hưng',
      'Mã Thị Thanh Hòa',
      'Mã Thị Thanh Tươi',
      'Nguyễn Bảo Nam',
      'Nguyễn Duy Mạnh',
      'Nguyễn Lý Hùng',
      'Nguyễn Thị Nhật Lệ',
      'Nguyễn Tiến Phong',
      'Ngô Mạnh Độ',
      'Phạm Thị Hồng Nhung',
      'Trần Huy Hoàng',
      'Trần Thế Quyền',
      'Vũ Thị Hồng Giàu',
      'Ôn Gia Bảo',
      'Đoàn Việt Dũng',
    ],
    updatedAt: Date.now(),
  },
  {
    id: 'class_8b',
    name: 'Lớp 8B',
    studentCount: 39,
    students: [
      'Đặng Việt Anh',
      'Hoàng Thế Anh',
      'Lê Quỳnh Anh',
      'Phạm Thị Kiều Băng',
      'Đặng Thành Duy',
      'Lê Mạnh Đạt',
      'Nguyễn Tiến Đạt',
      'Phạm Duy Khánh Đạt',
      'Phạm Thành Đạt',
      'Tô Thành Đạt',
      'Vương Thành Đạt',
      'Phạm Thị Hiền',
      'Phạm Thị Hồng',
      'Vương Gia Hưng',
      'Phạm Văn Kiên',
      'Đoàn Thị Cẩm Ly',
      'Nguyễn Đức Mạnh',
      'Bùi Đại Nam',
      'Phạm Thị Thảo Ngọc',
      'Tô Ánh Ngọc',
      'Lê Ánh Nguyệt',
      'Hoàng Yến Nhi',
      'Lê Thị Yến Nhi',
      'Phạm Văn Phú',
      'Nguyễn Bình Phước',
      'Lê Hồng Quang',
      'Hoàng Văn Quân',
      'Hoàng Thị Như Quỳnh',
      'Lê Tiến Thành',
      'Phạm Quyết Thắng',
      'Đoàn Thị Thủy',
      'Phạm Thị Anh Thư',
      'Đoàn Sơn Tùng',
      'Phạm An Tường',
      'Đặng Thị Nhã Uyên',
      'Lê Thị Hồng Vân',
      'Phạm Văn Vĩnh',
      'Đặng Thị Hải Yến',
      'Ôn Hoàng Bảo Yến',
    ],
    updatedAt: Date.now(),
  },
  {
    id: 'class_9a1',
    name: 'Lớp 9A1',
    studentCount: 35,
    students: [
      'Bùi Hoàng Tâm',
      'Hoàng Gia Hưng',
      'Hoàng Hắc Long',
      'Hoàng Minh Hòa',
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
    id: 'class_9a2',
    name: 'Lớp 9A2',
    studentCount: 36,
    students: [
      'Lê Minh Anh',
      'Vi Ngọc Ánh',
      'Lê Gia Bảo',
      'Nguyễn Hữu Gia Bảo',
      'Vương Ngọc Duy',
      'Lê Trí Dũng',
      'Vũ Tài Em',
      'Vũ Gia Long Hải',
      'Phạm Mai Hân',
      'Chiều Văn Hoan',
      'Ngô Thị Bảo Hoan',
      'Lê Mạnh Hùng',
      'Nguyễn Sinh Hùng',
      'Nguyễn Hoàng Gia Hưng',
      'Mạc Minh Khang',
      'Trần Minh Khang',
      'Hứa Đức Khải',
      'Nguyễn Đăng Khoa',
      'Phạm Hoàng Hải Long',
      'Phạm Khánh Ly',
      'Trần Hoàng Khánh Na',
      'Trần Mạnh Nam',
      'Mạc Thị Kim Ngân',
      'Ngô Ngọc Ngân',
      'Lê Thị Hồng Nhung',
      'Lê Thị Tú Quyên',
      'Hoàng Hồng Sơn',
      'Nguyễn Thị Thanh Tâm',
      'Phạm Văn Thái',
      'Trần Thị Thu Thủy',
      'Hoàng Mạnh Thương',
      'Phạm Thùy Trang',
      'Từ Thị Thanh Vân',
      'Lê Nhật Vy',
      'Trần Thị Hoàng Yến',
      'Trần Mai Anh',
    ],
    updatedAt: Date.now(),
  },
  {
    id: 'class_9b',
    name: 'Lớp 9B',
    studentCount: 41,
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
      'Lê Anh Đức',
      'Vương Thị Hà Giang',
      'Phạm Minh Hằng',
      'Trần Thị Ngọc Hân',
      'Vũ Hà Ngọc Hân',
      'Phạm Trung Hiếu',
      'Nguyễn Duy Hoàng',
      'Phạm Gia Huy',
      'Phạm Lê Huy',
      'Lê Đức Mạnh',
      'Phạm Thịnh Hưng',
      'Đặng Quân Kiệt',
      'Hồ Trần Hà Linh',
      'Phạm Tiến Minh',
      'Phạm Ngọc Minh',
      'Hoàng Ngọc Nam',
      'Hoàng Thị Tuyết Nhi',
      'Hoàng Thị Tuyết Nhi',
      'Đặng Hồng Nhung',
      'Lê Khánh Phương',
      'Phạm Thanh Quyên',
      'Hoàng Như Quỳnh',
      'Đoàn Tiến Tài',
      'Hoàng Thị Ngọc Thu',
      'Lê Ngọc Tranh',
      'Nguyễn Quốc Tuấn',
      'Lê Thị Ánh Tuyết',
      'Phạm Thị Thảo Vi',
      'Lê Thế Vinh',
      'Lê Nhật Vy',
      'Ngân Thị Bảo Trinh',
    ],
    updatedAt: Date.now(),
  },
];

export const classStorage = {
  getClasses: (): SavedClass[] => {
    if (typeof window === 'undefined') return DEFAULT_CLASSES;
    try {
      const data =
        localStorage.getItem(STORAGE_KEY) ||
        localStorage.getItem('tro_ly_lop_hoc_classes_v6') ||
        localStorage.getItem('tro_ly_lop_hoc_classes_v5') ||
        localStorage.getItem('tro_ly_lop_hoc_classes_v4') ||
        localStorage.getItem('tro_ly_lop_hoc_classes_v3');
      if (!data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CLASSES));
        return DEFAULT_CLASSES;
      }
      let parsed = JSON.parse(data) as SavedClass[];
      if (!Array.isArray(parsed) || parsed.length === 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CLASSES));
        return DEFAULT_CLASSES;
      }

      // Merge new default classes that are not yet in parsed list ("lớp nào có rồi thì không cần add nữa")
      let hasNew = false;
      DEFAULT_CLASSES.forEach((defCls) => {
        const foundIdx = parsed.findIndex(
          (c) => c.name.toLowerCase().replace(/\s+/g, '') === defCls.name.toLowerCase().replace(/\s+/g, '')
        );
        if (foundIdx === -1) {
          parsed.push(defCls);
          hasNew = true;
        } else {
          // Update classes with official newly provided rosters if existing had fewer/sample students
          if (
            (defCls.name === 'Lớp 7B' && parsed[foundIdx].students.length < 40) ||
            (defCls.name === 'Lớp 9A1' && parsed[foundIdx].students.length < 35) ||
            (defCls.name === 'Lớp 9B' && parsed[foundIdx].students.length < 41)
          ) {
            parsed[foundIdx] = defCls;
            hasNew = true;
          }
        }
      });

      // Remove placeholder sample 6A if 6A1 exists
      parsed = parsed.filter(
        (c) => !(c.id === 'class_6a' && c.name === 'Lớp 6A' && parsed.some((p) => p.name === 'Lớp 6A1'))
      );

      if (hasNew || localStorage.getItem(STORAGE_KEY) !== JSON.stringify(parsed)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
      return parsed;
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
