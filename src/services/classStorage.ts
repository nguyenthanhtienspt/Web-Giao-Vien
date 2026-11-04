import { SavedClass } from "../types";

export function getVietnameseGivenName(fullName: string): string {
  const s = fullName.replace(/\s*\([^)]*\)/g, "").trim();
  const words = s.split(/\s+/);
  if (words.length === 0) return fullName;
  let last = words[words.length - 1];
  if (/^\d+$/.test(last) && words.length > 1) {
    words.pop();
    last = words[words.length - 1];
  }
  if (/^[A-ZÀ-Ỹa-zà-ỹ]+[A-Z]$/u.test(last) && last.length > 2) {
    last = last.slice(0, -1);
  }
  return last;
}

export function sortVietnameseStudentNames(names: string[]): string[] {
  return [...names].sort((a, b) => {
    const tenA = getVietnameseGivenName(a);
    const tenB = getVietnameseGivenName(b);
    const cmp = tenA.localeCompare(tenB, "vi", { sensitivity: "base" });
    if (cmp !== 0) return cmp;
    return a.localeCompare(b, "vi", { sensitivity: "base" });
  });
}

export function sortClassesByGrade(classes: SavedClass[]): SavedClass[] {
  return [...classes].sort((a, b) => {
    const matchA = a.name.match(/\d+/);
    const matchB = b.name.match(/\d+/);
    const gradeA = matchA ? parseInt(matchA[0], 10) : 999;
    const gradeB = matchB ? parseInt(matchB[0], 10) : 999;
    if (gradeA !== gradeB) return gradeA - gradeB;
    return a.name.localeCompare(b.name, "vi", { numeric: true, sensitivity: "base" });
  });
}

const STORAGE_KEY = "tro_ly_lop_hoc_classes_v8";
const ACTIVE_CLASS_KEY = "tro_ly_lop_hoc_active_class_id_v8";

export const DEFAULT_CLASSES: SavedClass[] = [
  {
    id: "class_6a1",
    name: "Lớp 6A1",
    studentCount: 30,
    students: [
      "Hoàng Hải Anh",
      "Ngô Quyền Anh",
      "Vũ Quốc Anh",
      "Nguyễn Hoàng Bảo Chúc",
      "Tằng Văn Cương",
      "Nguyễn Tiến Đạt",
      "Hoàng Thị Thanh Hà",
      "Lê Mạnh Hải",
      "Nguyễn Xuân Hinh",
      "Phạm Đức Hùng",
      "Lê Thu Huyền",
      "Hoàng Gia Hưng",
      "Hoàng Thế Hưng",
      "Hoàng Nhã Khanh",
      "Đặng Kiều Linh",
      "Vũ Đón Lộc",
      "Lê Đức Lượng",
      "Lê Thảo My",
      "Lê Thị Trà My",
      "Phạm Khánh Nga",
      "Trạc Cắm Ngằn",
      "Lê Mạnh Nhất",
      "Lê Đại Phong",
      "Hứa Danh Sơn",
      "Lê Thị Tâm",
      "Vũ Thị Thủy",
      "Phạm Bảo Trâm",
      "Hứa Thanh Tùng",
      "Vũ Kha Tuyền",
      "Lê Thị Vui",
    ],
    updatedAt: Date.now(),
  },
  {
    id: "class_6a2",
    name: "Lớp 6A2",
    studentCount: 30,
    students: [
      "Nguyễn Hoài An",
      "Hoàng Thế Anh",
      "Nguyễn Tuấn Anh",
      "Nguyễn Khương Duy",
      "Vũ Đức Dương",
      "Lê Tiến Đạt",
      "Vũ Thị Thu Hằng",
      "Hoàng Thị Hiền",
      "Vương Đức Hiếu",
      "Phạm Thị Thu Huyền",
      "Hoàng Gia Hưng",
      "Lê Thị Lan Hương",
      "Hứa Minh Khôi",
      "Hoàng Thị Hà Linh",
      "Hứa Hoàng Bảo Long",
      "Phạm Thị Hằng Nga",
      "Lê Bảo Ngọc",
      "Vương Thị Yến Nhi",
      "Hoàng Đại Phong",
      "Lê Đình Phúc",
      "Phạm Tiến Quang",
      "Hoàng Như Quỳnh",
      "Trần Phi Sơn",
      "Bùi Nguyễn Công Thành",
      "Nguyễn Tiến Thành",
      "Hứa Anh Thương",
      "Lê Thị Tiền",
      "Mã Thanh Tỉnh",
      "Trần Duy Tuấn",
      "Hoàng Thị Hải Yến",
    ],
    updatedAt: Date.now(),
  },
  {
    id: "class_6b",
    name: "Lớp 6B",
    studentCount: 37,
    students: [
      "Hoàng Thị Phương Anh",
      "Nguyễn Thị Hồng Ánh",
      "Tô Gia Bảo",
      "Nguyễn Thị Bảo Châu",
      "Lê Kiều Dung",
      "Phạm Tiến Dũng",
      "Lê Kiên Giáp",
      "Bế Thị Hải",
      "Hoàng Thị Thu Hằng",
      "Triệu Phúc Hùng",
      "Vương Thị Lan Hương",
      "Phạm Văn Khánh",
      "Lê Tuấn Kiệt",
      "Đoàn Hồng Loan",
      "Đoàn Văn Mạnh",
      "Lê Trà My",
      "Lê Hoàng Bảo Nam",
      "Hoàng Thị Thanh Nga",
      "Đoàn Thảo Nhi",
      "Đoàn Thị Yến Nhi",
      "Hoàng Thị Tâm Như",
      "Đoàn Thị Oanh",
      "Nguyễn Đại Phong",
      "Phạm Thanh Phong",
      "Nguyễn Hà Phương",
      "Phạm Thị Như Quỳnh",
      "Lê Thị Thu Thảo",
      "Phạm Thanh Thúy",
      "Đoàn Thị Thư",
      "Trần Hoàng Minh Thư",
      "Đoàn Thị Tiền",
      "Hoàng Lâm Tùng",
      "Phạm Sơn Tùng",
      "Hoàng Thị Bạch Tuyết",
      "Phạm Huy Vũ",
      "Lê Thảo Vy",
      "Phạm Thế Vỹ",
    ],
    updatedAt: Date.now(),
  },
  {
    id: "class_7a1",
    name: "Lớp 7A1",
    studentCount: 30,
    students: [
      "Lê Quang Anh",
      "Phạm Thị Lan Anh",
      "Phạm Bảo Chi",
      "Hoàng Thanh Dũng",
      "Hứa Thị Hồng Duyên",
      "Lê Anh Đức",
      "Lê Văn Được",
      "Lê Thị Thúy Hằng",
      "Trần Minh Huân",
      "Ngô Quốc Huy",
      "Trần Gia Khánh",
      "Hứa Tuấn Kiệt",
      "Choóng Vĩnh Kim",
      "Hoàng Tường Lam",
      "Nguyễn Sinh Lộc",
      "Hoàng Tiến Mạnh",
      "Đoàn Đức Nam",
      "Lê Thị Bảo NgọcA 1",
      "Hoàng Thị Tuyết Nhi",
      "Ngô Tú Quyên",
      "Vũ Tiến Thành",
      "Hoàng Ngọc ThảoA",
      "Hứa Như Phương Thảo",
      "Lê Thị Hồng Thuý",
      "Vương Ngọc Thuý",
      "Lê Quỳnh Trang",
      "Phạm Thị Bảo Trang",
      "Phạm Quang Vinh",
      "Phạm Ngọc Vượt",
      "Phạm Thị Thảo Vy",
    ],
    updatedAt: Date.now(),
  },
  {
    id: "class_7a2",
    name: "Lớp 7A2",
    studentCount: 31,
    students: [
      "Lê Tuấn Anh",
      "Nguyễn Vân Anh",
      "Phạm Thị Ngọc Anh",
      "Đào Mạnh Dũng",
      "Hứa Đặng Thùy Ánh Duyên",
      "Bùi Hoàng Dương",
      "Lê Thị Thùy DươngA",
      "Trần Xuân Đại",
      "Lê Thị Thu HàA",
      "Nguyễn Đoàn Mai Hân",
      "Hoàng Văn Hùng",
      "Ôn Gia Huy",
      "Phạm Nhật Khải",
      "Hoàng Tuấn Kiệt",
      "Hoàng Ngọc Lan",
      "Hoàng Kim Ngân",
      "Nguyễn Bảo NgọcA",
      "Phạm Khải Nguyên",
      "Hoàng Minh NhậtA",
      "Nguyễn Bảo Nhi",
      "Trần Thị Thảo NhiA",
      "Lê Văn Quang",
      "Phạm Duy Thành",
      "Trần Đức ThịnhA",
      "Vương Anh Thư",
      "Phạm Thị Trang",
      "Từ Thị Thu Trang",
      "Trần Bảo Trâm",
      "Phạm Hoàng Nam Trung",
      "Nguyễn Quốc ViệtA",
      "Lê Hoàng Hà Vy",
    ],
    updatedAt: Date.now(),
  },
  {
    id: "class_7b",
    name: "Lớp 7B",
    studentCount: 40,
    students: [
      "Bùi Thị Ngọc Anh",
      "Nguyễn Tô Thiên Ân",
      "Phạm Thị Chinh",
      "Phạm Tiến DũngA",
      "Hoàng Thế Duy",
      "Phạm Văn Đại",
      "Đoàn Tiến Đạt",
      "Phạm Văn Đạt",
      "Lê Minh Đức",
      "Lê Thị Hương Giang",
      "Lê Thị Kiều Hân",
      "Hoàng Đăng Khôi",
      "Phạm Thùy Linh",
      "Vương Phương Linh",
      "Hoàng Thị Thanh Ngân",
      "Phạm Thị Ngọc",
      "Tô Thị Nhàn",
      "Vương Quang Nhật",
      "Đặng Yến Nhi",
      "Lê Thị Yến Nhi",
      "Phạm Nhật Thế Phong",
      "Đoàn Gia Phú",
      "Phạm Thế Phương",
      "Ôn Bích Quyên",
      "Tô Thị Hồng Sang",
      "Lê Thị Phương Thảo",
      "Nguyễn Thị Thu Thảo",
      "Phạm Thị Thảo",
      "Hoàng Thị Ngọc Thi",
      "Đoàn Đức Thiện",
      "Phạm Đức Thịnh",
      "Đặng Thị Anh Thư",
      "Hoàng Hoài Thư",
      "Phạm Tiến Toàn",
      "Lê Thị Thu Trà",
      "Đoàn Thị Kiều Trang",
      "Đoàn Thị Ngọc Trâm",
      "Hoàng Thị Bảo Trâm",
      "Lê Thị Thanh Trúc",
      "Đoàn Bảo Uyên",
    ],
    updatedAt: Date.now(),
  },
  {
    id: "class_8a1",
    name: "Lớp 8A1",
    studentCount: 34,
    students: [
      "Lê Thị Ngọc Châu",
      "Hoàng Thị Vân Chi",
      "Ngô Kiến Duy",
      "Bùi Thành Đạt",
      "Vương Trần Thành Đạt",
      "Vũ Hoàng Gia",
      "Hoàng Minh Hiếu",
      "Hứa Gia Huy",
      "Hoàng Thị Thanh Huyền",
      "Phạm Thị Huyền",
      "Hứa Lê Duy Khánh",
      "Hoàng Thị Hà Linh",
      "Trần Tiến Lợi",
      "Vũ Viết Nam",
      "Trần Thị Thúy Nga",
      "Hoàng Thị Hồng Nhung",
      "Trương Thị Kiều Oanh",
      "Hoàng Anh Quốc",
      "Nguyễn Quyết Tâm",
      "Hoàng Thu Thảo",
      "Trần Thị Thu Thủy",
      "Lê Anh Thư",
      "Lê Nhật Tiến",
      "Hoàng Bảo Toàn",
      "Trần Quốc Toản",
      "Hoàng Thị Huyền Trang",
      "Hứa Văn Trong",
      "Lê Thanh Trường",
      "Hoàng Mạnh Tùng",
      "Trần Thị Ánh Tuyết",
      "Lê Hoàng Anh Vũ",
      "Hoàng Bảo Vy",
      "Lê Thanh Xuân",
      "Lê Thị Hải Yến",
    ],
    updatedAt: Date.now(),
  },
  {
    id: "class_8a2",
    name: "Lớp 8A2",
    studentCount: 32,
    students: [
      "Ôn Gia Bảo",
      "Hoàng Thanh Bình",
      "Lê Quỳnh Chi",
      "Lê Thị Quý Di",
      "Đoàn Việt Dũng",
      "Hoàng Thị Thùy Dương",
      "Hoàng Trung Đạo",
      "Ngô Mạnh Độ",
      "Vũ Thị Hồng Giàu",
      "Hoàng Đức Hải",
      "Hoàng Minh Hiếu",
      "Lê Minh Hiếu",
      "Mã Thị Thanh Hòa",
      "Trần Huy Hoàng",
      "Nguyễn Lý Hùng",
      "Lê Việt Hưng",
      "Lê Trần Quỳnh Hương",
      "Nguyễn Thị Nhật Lệ",
      "Dương Hoàng Mai Linh",
      "Nguyễn Duy Mạnh",
      "Nguyễn Bảo Nam",
      "Hứa Mạnh Nguyên",
      "Lê Thị Ánh Nguyệt",
      "Phạm Thị Hồng Nhung",
      "Lê Hòa Phát",
      "Nguyễn Tiến Phong",
      "Trần Thế Quyền",
      "Hoàng Đức Thịnh",
      "Hoàng Đức Thùy",
      "Chóong Phương Trinh",
      "Lê Triệu Kiều Trinh",
      "Mã Thị Thanh Tươi",
    ],
    updatedAt: Date.now(),
  },
  {
    id: "class_8b",
    name: "Lớp 8B",
    studentCount: 39,
    students: [
      "Đặng Việt Anh",
      "Hoàng Thế Anh",
      "Lê Quỳnh Anh",
      "Phạm Thị Kiều Băng",
      "Đặng Thành Duy",
      "Lê Mạnh Đạt",
      "Nguyễn Tiến Đạt",
      "Phạm Duy Khánh Đạt",
      "Phạm Thành Đạt",
      "Tô Thành Đạt",
      "Vương Thành Đạt",
      "Phạm Thị Hiền",
      "Phạm Thị Hồng",
      "Vương Gia Hưng",
      "Phạm Văn Kiên",
      "Đoàn Thị Cẩm Ly",
      "Nguyễn Đức Mạnh",
      "Bùi Đại Nam",
      "Phạm Thị Thảo Ngọc",
      "Tô Ánh Ngọc",
      "Lê Ánh Nguyệt",
      "Hoàng Yến Nhi",
      "Lê Thị Yến Nhi",
      "Phạm Văn Phú",
      "Nguyễn Bình Phước",
      "Lê Hồng Quang",
      "Hoàng Văn Quân",
      "Hoàng Thị Như Quỳnh",
      "Lê Tiến Thành",
      "Phạm Quyết Thắng",
      "Đoàn Thị Thủy",
      "Phạm Thị Anh Thư",
      "Đoàn Sơn Tùng",
      "Phạm An Tường",
      "Đặng Thị Nhã Uyên",
      "Lê Thị Hồng Vân",
      "Phạm Văn Vĩnh",
      "Đặng Thị Hải Yến",
      "Ôn Hoàng Bảo Yến",
    ],
    updatedAt: Date.now(),
  },
  {
    id: "class_9a1",
    name: "Lớp 9A1",
    studentCount: 35,
    students: [
      "Hứa Nhất Anh",
      "Nguyễn Đức Anh",
      "Vương Thị Ngọc Ánh",
      "Trương Mạnh Cừ",
      "Hoàng Mạnh Cường",
      "Nguyễn Công Doanh",
      "Trần Nhật Dương",
      "Lê Quang Giáp",
      "Phạm Thu Hà",
      "Ngô Thị Lệ Hằng",
      "Trần Ngọc Hân",
      "Hoàng Minh Hòa",
      "Lê Nguyễn Duy Hoàng",
      "Nguyễn Hoàng Gia Huy",
      "Trần Gia Huy",
      "Trần Thu Huyền",
      "Hoàng Gia Hưng",
      "Hứa Anh Kiều",
      "Đoàn Thúy Liên",
      "Trần Thị Mỹ Linh",
      "Hoàng Hắc Long",
      "Hoàng Thị Bảo Ngọc",
      "Hoàng Thị Hồng Ngọc",
      "Ngô Thị Kiều Oanh",
      "Bùi Hoàng Tâm",
      "Lê Mạnh Thắm",
      "Lê Thị Thu Thủy",
      "Phạm Thị Mai Thùy",
      "Lê Thị Ngọc Thư",
      "Lê Khánh Thy",
      "Trần Thị Bảo Trâm",
      "Hoàng Ngọc Tuấn",
      "Hoàng Thanh Tùng",
      "Ngô Bảo Uyên",
      "Hoàng Minh Vũ",
    ],
    updatedAt: Date.now(),
  },
  {
    id: "class_9a2",
    name: "Lớp 9A2",
    studentCount: 36,
    students: [
      "Lê Minh Anh",
      "Trần Mai Anh",
      "Vi Ngọc Ánh",
      "Lê Gia Bảo",
      "Nguyễn Hữu Gia Bảo",
      "Lê Trí Dũng",
      "Vương Ngọc Duy",
      "Vũ Tài Em",
      "Vũ Gia Long Hải",
      "Phạm Mai Hân",
      "Chiều Văn Hoan",
      "Ngô Thị Bảo Hoan",
      "Lê Mạnh Hùng",
      "Nguyễn Sinh Hùng",
      "Nguyễn Hoàng Gia Hưng",
      "Hứa Đức Khải",
      "Mạc Minh Khang",
      "Trần Minh Khang",
      "Nguyễn Đăng Khoa",
      "Phạm Hoàng Hải Long",
      "Phạm Khánh Ly",
      "Trần Hoàng Khánh Na",
      "Trần Mạnh Nam",
      "Mạc Thị Kim Ngân",
      "Ngô Ngọc Ngân",
      "Lê Thị Hồng Nhung",
      "Lê Thị Tú Quyên",
      "Hoàng Hồng Sơn",
      "Nguyễn Thị Thanh Tâm",
      "Phạm Văn Thái",
      "Trần Thị Thu Thủy",
      "Hoàng Mạnh Thương",
      "Phạm Thùy Trang",
      "Từ Thị Thanh Vân",
      "Lê Nhật Vy",
      "Trần Thị Hoàng Yến",
    ],
    updatedAt: Date.now(),
  },
  {
    id: "class_9b",
    name: "Lớp 9B",
    studentCount: 41,
    students: [
      "Đoàn Thế Anh",
      "Lê Đức Anh",
      "Lê Nguyễn Tuấn Anh",
      "Phạm Ngọc Ánh",
      "Phạm Thị Phương Anh",
      "Vương Thị Mai Anh",
      "Lê Đình Cơ",
      "Phạm Trung Dũng",
      "Đoàn Thành Đạt",
      "Hoàng Thành Đạt",
      "Lê Anh Đức",
      "Vương Thị Hà Giang",
      "Phạm Minh Hằng",
      "Trần Thị Ngọc Hân",
      "Vũ Hà Ngọc Hân",
      "Phạm Trung Hiếu",
      "Nguyễn Duy Hoàng",
      "Phạm Gia Huy",
      "Phạm Lê Huy",
      "Phạm Thịnh Hưng",
      "Đặng Quân Kiệt",
      "Hồ Trần Hà Linh",
      "Lê Đức Mạnh",
      "Phạm Ngọc Minh",
      "Phạm Tiến Minh",
      "Hoàng Ngọc Nam",
      "Hoàng Thị Tuyết Nhi",
      "Hoàng Thị Tuyết Nhi",
      "Đặng Hồng Nhung",
      "Lê Khánh Phương",
      "Phạm Thanh Quyên",
      "Hoàng Như Quỳnh",
      "Đoàn Tiến Tài",
      "Hoàng Thị Ngọc Thu",
      "Lê Ngọc Tranh",
      "Ngân Thị Bảo Trinh",
      "Nguyễn Quốc Tuấn",
      "Lê Thị Ánh Tuyết",
      "Phạm Thị Thảo Vi",
      "Lê Thế Vinh",
      "Lê Nhật Vy",
    ],
    updatedAt: Date.now(),
  },
];

export const classStorage = {
  getClasses: (): SavedClass[] => {
    if (typeof window === "undefined") return DEFAULT_CLASSES;
    try {
      const data =
        localStorage.getItem(STORAGE_KEY) ||
        localStorage.getItem("tro_ly_lop_hoc_classes_v7") ||
        localStorage.getItem("tro_ly_lop_hoc_classes_v6") ||
        localStorage.getItem("tro_ly_lop_hoc_classes_v5") ||
        localStorage.getItem("tro_ly_lop_hoc_classes_v4") ||
        localStorage.getItem("tro_ly_lop_hoc_classes_v3");
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
          (c) => c.name.toLowerCase().replace(/\s+/g, "") === defCls.name.toLowerCase().replace(/\s+/g, "")
        );
        if (foundIdx === -1) {
          parsed.push(defCls);
          hasNew = true;
        } else {
          // Update classes with official newly provided rosters if existing had fewer/sample students
          if (
            (defCls.name === "Lớp 7B" && parsed[foundIdx].students.length < 40) ||
            (defCls.name === "Lớp 9A1" && parsed[foundIdx].students.length < 35) ||
            (defCls.name === "Lớp 9B" && parsed[foundIdx].students.length < 41)
          ) {
            parsed[foundIdx] = defCls;
            hasNew = true;
          }
        }
      });

      // Remove placeholder sample 6A if 6A1 exists
      parsed = parsed.filter(
        (c) => !(c.id === "class_6a" && c.name === "Lớp 6A" && parsed.some((p) => p.name === "Lớp 6A1"))
      );

      // ALWAYS ensure classes are sorted by grade and section (6A1 -> 6A2 -> 6B -> 7A1 ... -> 9B)
      parsed = sortClassesByGrade(parsed);

      if (hasNew || localStorage.getItem(STORAGE_KEY) !== JSON.stringify(parsed)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
      return parsed;
    } catch {
      return DEFAULT_CLASSES;
    }
  },

  saveClasses: (classes: SavedClass[]) => {
    if (typeof window === "undefined") return;
    try {
      const sorted = sortClassesByGrade(classes);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
    } catch (e) {
      console.error("Error saving classes to localStorage", e);
    }
  },

  addClass: (newClass: Omit<SavedClass, "id" | "updatedAt">): SavedClass => {
    const classes = classStorage.getClasses();
    const createdClass: SavedClass = {
      ...newClass,
      id: `class_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      updatedAt: Date.now(),
    };
    const updated = sortClassesByGrade([createdClass, ...classes]);
    classStorage.saveClasses(updated);
    classStorage.setActiveClassId(createdClass.id);
    return createdClass;
  },

  updateClass: (updatedClass: SavedClass) => {
    const classes = classStorage.getClasses();
    const updated = classes.map((c) =>
      c.id === updatedClass.id ? { ...updatedClass, updatedAt: Date.now() } : c
    );
    classStorage.saveClasses(sortClassesByGrade(updated));
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
    if (typeof window === "undefined") return DEFAULT_CLASSES[0].id;
    try {
      return localStorage.getItem(ACTIVE_CLASS_KEY) || DEFAULT_CLASSES[0].id;
    } catch {
      return DEFAULT_CLASSES[0].id;
    }
  },

  setActiveClassId: (id: string) => {
    if (typeof window === "undefined") return;
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
        const valid = parsed.every(
          (c) => typeof c.name === "string" && typeof c.studentCount === "number"
        );
        if (valid) {
          const sorted = sortClassesByGrade(parsed);
          classStorage.saveClasses(sorted);
          if (sorted[0]?.id) {
            classStorage.setActiveClassId(sorted[0].id);
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
    if (typeof window !== "undefined") {
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
