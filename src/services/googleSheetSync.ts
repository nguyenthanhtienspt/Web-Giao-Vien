import { SavedClass, GroupScore, GroupItem, ClassMonthlyStudentScores, ClassMonthlyGradeDates } from '../types';
import { classStorage, sortClassesByGrade } from './classStorage';
import {
  classroomStateStorage,
  normalizeMonthlyScores,
  flattenQuestionSetsForCloud,
  parseCloudQuestionsToSets,
} from './classroomStateStorage';

const URL_STORAGE_KEY = 'tro_ly_gsheet_webapp_url_v1';
const PIN_REMEMBER_KEY = 'tro_ly_gsheet_pin_remember_v1';
const PIN_SESSION_KEY = 'tro_ly_gsheet_pin_session_v1';
const AUTOSYNC_KEY = 'tro_ly_gsheet_autosync_v1';
const SHEET_NAME_KEY = 'tro_ly_gsheet_name_v1';
const LAST_SYNC_KEY = 'tro_ly_gsheet_last_sync_v1';

const BUILTIN_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycby_H1Q-7AlZ41G3gUzQWF2Gb7uZdYLVKjza4lmvsM3gWvkIlJLctoOO8KjCI-R94VTC/exec';
const ENV_DEFAULT_URL =
  (import.meta.env.VITE_GSHEET_SCRIPT_URL as string | undefined) || BUILTIN_SCRIPT_URL;

export interface ScoreGroupsCloudEnvelope {
  __v: 2;
  groups: GroupScore[];
  monthlyStudentScores: ClassMonthlyStudentScores;
  monthlyGradeDates?: ClassMonthlyGradeDates;
}

export interface RemoteClassStateItem {
  className: string;
  scoreGroups?: GroupScore[] | ScoreGroupsCloudEnvelope | null;
  absent?: string[];
  splitGroups?: GroupItem[] | null;
  updatedAt?: string;
}

export interface SheetSyncPayload {
  classes: SavedClass[];
  questions: string[];
  classStates: Record<string, RemoteClassStateItem>;
}

export interface SheetPullResponse {
  ok: boolean;
  error?: string;
  message?: string;
  data?: {
    spreadsheetName: string;
    classes: SavedClass[];
    questions: string[];
    classStates: Record<string, RemoteClassStateItem>;
    syncedAt: string;
  };
}

export const GOOGLE_APPS_SCRIPT_TEMPLATE = `// ============================================================================
// GOOGLE APPS SCRIPT - DATABASE CHO WEB "TRỢ LÝ LỚP HỌC THCS"
// Đổi mã SECRET_PIN bên dưới thành 4-6 số bảo mật của riêng Thầy rồi bấm Triển khai!
// ============================================================================
const SECRET_PIN = "123456";

const SHEET_CLASSES = "DanhSachLop";
const SHEET_QUESTIONS = "CauHoi";
const SHEET_STATES = "BangDiem";

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function slugifyClassId(name, idx) {
  var clean = String(name || "").toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "")
    .replace(/đ/g, "d").replace(/^lop\\s*/i, "").replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return clean ? "class_" + clean : "class_custom_" + (idx + 1);
}

function ensureSheets(ss) {
  var shClasses = ss.getSheetByName(SHEET_CLASSES) || ss.insertSheet(SHEET_CLASSES);
  var shQuestions = ss.getSheetByName(SHEET_QUESTIONS);
  if (!shQuestions) {
    shQuestions = ss.insertSheet(SHEET_QUESTIONS);
    shQuestions.getRange(1, 1).setValue("Câu hỏi kiểm tra bài cũ").setFontWeight("bold");
    shQuestions.setColumnWidth(1, 550);
  }
  var shStates = ss.getSheetByName(SHEET_STATES);
  if (!shStates) {
    shStates = ss.insertSheet(SHEET_STATES);
    shStates.getRange(1, 1, 1, 6)
      .setValues([["MaLop", "TenLop", "DiemThiDuaJSON", "HocSinhVangJSON", "NhomChiaJSON", "CapNhatLuc"]])
      .setFontWeight("bold");
  }
  return { shClasses: shClasses, shQuestions: shQuestions, shStates: shStates };
}

function readAllData(ss) {
  var sheets = ensureSheets(ss);
  var classes = [];
  var lastRowC = sheets.shClasses.getLastRow();
  var lastColC = sheets.shClasses.getLastColumn();
  if (lastRowC >= 1 && lastColC >= 1) {
    var valuesC = sheets.shClasses.getRange(1, 1, lastRowC, lastColC).getValues();
    for (var col = 0; col < lastColC; col++) {
      var className = String(valuesC[0][col] || "").trim();
      if (!className) continue;
      var students = [];
      for (var row = 1; row < lastRowC; row++) {
        var st = String(valuesC[row][col] || "").trim();
        if (st) students.push(st);
      }
      classes.push({
        id: slugifyClassId(className, col),
        name: className,
        studentCount: students.length > 0 ? students.length : 35,
        students: students,
        updatedAt: Date.now()
      });
    }
  }
  var questions = [];
  var lastRowQ = sheets.shQuestions.getLastRow();
  if (lastRowQ >= 2) {
    var valuesQ = sheets.shQuestions.getRange(2, 1, lastRowQ - 1, 1).getValues();
    for (var i = 0; i < valuesQ.length; i++) {
      var q = String(valuesQ[i][0] || "").trim();
      if (q) questions.push(q);
    }
  }
  var classStates = {};
  var lastRowS = sheets.shStates.getLastRow();
  if (lastRowS >= 2) {
    var valuesS = sheets.shStates.getRange(2, 1, lastRowS - 1, 6).getValues();
    for (var r = 0; r < valuesS.length; r++) {
      var cId = String(valuesS[r][0] || "").trim();
      if (!cId) continue;
      var scoreGroups = null, absent = [], splitGroups = null;
      try { scoreGroups = valuesS[r][2] ? JSON.parse(valuesS[r][2]) : null; } catch (err) {}
      try { absent = valuesS[r][3] ? JSON.parse(valuesS[r][3]) : []; } catch (err) {}
      try { splitGroups = valuesS[r][4] ? JSON.parse(valuesS[r][4]) : null; } catch (err) {}
      classStates[cId] = { className: String(valuesS[r][1] || ""), scoreGroups: scoreGroups, absent: absent, splitGroups: splitGroups, updatedAt: String(valuesS[r][5] || "") };
    }
  }
  return { spreadsheetName: ss.getName(), classes: classes, questions: questions, classStates: classStates, syncedAt: new Date().toISOString() };
}

function doGet(e) {
  try {
    var params = (e && e.parameter) ? e.parameter : {};
    if (String(params.pin || "") !== SECRET_PIN) {
      return jsonResponse({ ok: false, error: "INVALID_PIN", message: "Mã PIN bảo mật không đúng!" });
    }
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (String(params.action || "pull") === "ping") {
      ensureSheets(ss);
      return jsonResponse({ ok: true, spreadsheetName: ss.getName(), syncedAt: new Date().toISOString() });
    }
    return jsonResponse({ ok: true, data: readAllData(ss) });
  } catch (err) {
    return jsonResponse({ ok: false, error: "SERVER_ERROR", message: String(err) });
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) ? e.postData.contents : "{}");
    if (String(body.pin || "") !== SECRET_PIN) {
      return jsonResponse({ ok: false, error: "INVALID_PIN", message: "Mã PIN bảo mật không đúng!" });
    }
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheets = ensureSheets(ss);
    if (Array.isArray(body.classes) && body.classes.length > 0) {
      sheets.shClasses.clearContents();
      var numCols = body.classes.length;
      var maxStudents = 0;
      for (var c = 0; c < numCols; c++) {
        var len = Array.isArray(body.classes[c].students) ? body.classes[c].students.length : 0;
        if (len > maxStudents) maxStudents = len;
      }
      var grid = [body.classes.map(function(cl, i){ return cl.name || ("Lớp " + (i + 1)); })];
      for (var r = 0; r < maxStudents; r++) {
        grid.push(body.classes.map(function(cl){ return (cl.students || [])[r] || ""; }));
      }
      sheets.shClasses.getRange(1, 1, grid.length, numCols).setValues(grid);
      sheets.shClasses.getRange(1, 1, 1, numCols).setFontWeight("bold").setBackground("#4f46e5").setFontColor("#ffffff");
      for (var cw = 1; cw <= numCols; cw++) sheets.shClasses.setColumnWidth(cw, 190);
    }
    if (Array.isArray(body.questions)) {
      sheets.shQuestions.clearContents();
      var qRows = [["Câu hỏi kiểm tra bài cũ"]];
      body.questions.forEach(function(q){ if (q) qRows.push([String(q)]); });
      sheets.shQuestions.getRange(1, 1, qRows.length, 1).setValues(qRows);
      sheets.shQuestions.getRange(1, 1).setFontWeight("bold").setBackground("#f59e0b").setFontColor("#0f172a");
      sheets.shQuestions.setColumnWidth(1, 560);
    }
    if (body.classStates && typeof body.classStates === "object") {
      sheets.shStates.clearContents();
      var sRows = [["MaLop", "TenLop", "DiemThiDuaJSON", "HocSinhVangJSON", "NhomChiaJSON", "CapNhatLuc"]];
      var nowStr = new Date().toLocaleString("vi-VN");
      Object.keys(body.classStates).forEach(function(classId) {
        var stObj = body.classStates[classId] || {};
        sRows.push([classId, stObj.className || classId, JSON.stringify(stObj.scoreGroups || []), JSON.stringify(stObj.absent || []), JSON.stringify(stObj.splitGroups || []), nowStr]);
      });
      sheets.shStates.getRange(1, 1, sRows.length, 6).setValues(sRows);
      sheets.shStates.getRange(1, 1, 1, 6).setFontWeight("bold").setBackground("#059669").setFontColor("#ffffff");
    }
    return jsonResponse({ ok: true, spreadsheetName: ss.getName(), syncedAt: new Date().toISOString() });
  } catch (err) {
    return jsonResponse({ ok: false, error: "SERVER_ERROR", message: String(err) });
  } finally {
    lock.releaseLock();
  }
}`;

export const googleSheetSync = {
  getScriptUrl(): string {
    if (typeof window === 'undefined') return ENV_DEFAULT_URL;
    return localStorage.getItem(URL_STORAGE_KEY) || ENV_DEFAULT_URL || '';
  },

  setScriptUrl(url: string): void {
    if (typeof window === 'undefined') return;
    const trimmed = url.trim();
    if (trimmed) {
      localStorage.setItem(URL_STORAGE_KEY, trimmed);
    } else {
      localStorage.removeItem(URL_STORAGE_KEY);
    }
  },

  getActivePin(): string {
    if (typeof window === 'undefined') return '';
    return (
      sessionStorage.getItem(PIN_SESSION_KEY) ||
      localStorage.getItem(PIN_REMEMBER_KEY) ||
      ''
    );
  },

  isPinRemembered(): boolean {
    if (typeof window === 'undefined') return false;
    return Boolean(localStorage.getItem(PIN_REMEMBER_KEY));
  },

  savePin(pin: string, rememberOnThisDevice: boolean): void {
    if (typeof window === 'undefined') return;
    const clean = pin.trim();
    sessionStorage.setItem(PIN_SESSION_KEY, clean);
    if (rememberOnThisDevice) {
      localStorage.setItem(PIN_REMEMBER_KEY, clean);
    } else {
      localStorage.removeItem(PIN_REMEMBER_KEY);
    }
  },

  lockSession(): void {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(PIN_SESSION_KEY);
    localStorage.removeItem(PIN_REMEMBER_KEY);
  },

  isAutoSyncEnabled(): boolean {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem(AUTOSYNC_KEY) !== 'false';
  },

  setAutoSyncEnabled(enabled: boolean): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(AUTOSYNC_KEY, enabled ? 'true' : 'false');
  },

  getSheetMeta(): { sheetName: string; lastSyncedAt: string } {
    if (typeof window === 'undefined') return { sheetName: '', lastSyncedAt: '' };
    return {
      sheetName: localStorage.getItem(SHEET_NAME_KEY) || '',
      lastSyncedAt: localStorage.getItem(LAST_SYNC_KEY) || '',
    };
  },

  saveSheetMeta(sheetName: string, syncedAt: string): void {
    if (typeof window === 'undefined') return;
    if (sheetName) localStorage.setItem(SHEET_NAME_KEY, sheetName);
    if (syncedAt) localStorage.setItem(LAST_SYNC_KEY, syncedAt);
  },

  isReadyForSync(): boolean {
    const url = googleSheetSync.getScriptUrl();
    const pin = googleSheetSync.getActivePin();
    return Boolean(url.startsWith('https://script.google.com/') && pin.length > 0);
  },

  /**
   * Collect complete local snapshot to push up to Google Sheet
   */
  collectLocalSnapshot(): SheetSyncPayload {
    const classes = sortClassesByGrade(classStorage.getClasses());
    const qBank = classroomStateStorage.getQuestionBank();
    const classStates: Record<string, RemoteClassStateItem> = {};

    classes.forEach((cls) => {
      classStates[cls.id] = {
        className: cls.name,
        scoreGroups: {
          __v: 2,
          groups: classroomStateStorage.getScoreboardForClass(cls.id),
          monthlyStudentScores: classroomStateStorage.getMonthlyScoresForClass(cls.id),
          monthlyGradeDates: classroomStateStorage.getMonthlyGradeDatesForClass(cls.id),
        },
        absent: classroomStateStorage.getAbsentForClass(cls.id),
        splitGroups: classroomStateStorage.getSplitGroupsForClass(cls.id),
      };
    });

    return {
      classes,
      questions: flattenQuestionSetsForCloud(qBank),
      classStates,
    };
  },

  /**
   * Pull data from Google Sheet and write into localStorage
   */
  async pullFromSheet(customUrl?: string, customPin?: string): Promise<{
    ok: boolean;
    message: string;
    spreadsheetName?: string;
    classCount?: number;
  }> {
    const url = (customUrl ?? googleSheetSync.getScriptUrl()).trim();
    const pin = (customPin ?? googleSheetSync.getActivePin()).trim();

    if (!url || !url.startsWith('https://script.google.com/')) {
      return { ok: false, message: 'Vui lòng nhập đúng đường link Web App Google Apps Script (https://script.google.com/macros/s/.../exec)' };
    }
    if (!pin) {
      return { ok: false, message: 'Vui lòng nhập mã PIN bảo mật của Thầy!' };
    }

    try {
      const separator = url.includes('?') ? '&' : '?';
      const endpoint = `${url}${separator}action=pull&pin=${encodeURIComponent(pin)}&_t=${Date.now()}`;
      const res = await fetch(endpoint, { method: 'GET', redirect: 'follow' });
      const json = (await res.json()) as SheetPullResponse;

      if (!json.ok || !json.data) {
        return {
          ok: false,
          message: json.message || 'Không thể tải dữ liệu từ Google Sheet. Vui lòng kiểm tra lại mã PIN!',
        };
      }

      const { spreadsheetName, classes, questions, classStates, syncedAt } = json.data;

      if (Array.isArray(classes) && classes.length > 0) {
        classStorage.saveClasses(sortClassesByGrade(classes));
      }

      if (Array.isArray(questions) && questions.length > 0) {
        const currentQ = classroomStateStorage.getQuestionBank();
        classroomStateStorage.saveQuestionBank({
          ...currentQ,
          sets: parseCloudQuestionsToSets(questions),
        });
      }

      if (classStates && typeof classStates === 'object') {
        Object.entries(classStates).forEach(([classId, st]) => {
          if (Array.isArray(st.scoreGroups) && st.scoreGroups.length > 0) {
            classroomStateStorage.saveScoreboardForClass(classId, st.scoreGroups);
          } else if (
            st.scoreGroups &&
            typeof st.scoreGroups === 'object' &&
            '__v' in st.scoreGroups
          ) {
            const env = st.scoreGroups as ScoreGroupsCloudEnvelope;
            if (Array.isArray(env.groups) && env.groups.length > 0) {
              classroomStateStorage.saveScoreboardForClass(classId, env.groups);
            }
            if (env.monthlyStudentScores && typeof env.monthlyStudentScores === 'object') {
              classroomStateStorage.saveMonthlyScoresForClass(
                classId,
                normalizeMonthlyScores(env.monthlyStudentScores)
              );
            }
            if (env.monthlyGradeDates && typeof env.monthlyGradeDates === 'object') {
              classroomStateStorage.saveMonthlyGradeDatesForClass(classId, env.monthlyGradeDates);
            }
          }
          if (Array.isArray(st.absent)) {
            classroomStateStorage.saveAbsentForClass(classId, st.absent);
          }
          if (Array.isArray(st.splitGroups) && st.splitGroups.length > 0) {
            classroomStateStorage.saveSplitGroupsForClass(classId, st.splitGroups);
          }
        });
      }

      googleSheetSync.saveSheetMeta(spreadsheetName, syncedAt);
      return {
        ok: true,
        spreadsheetName,
        classCount: classes.length,
        message:
          classes.length > 0
            ? `Đã tải thành công ${classes.length} lớp học từ "${spreadsheetName}"!`
            : `Đã kết nối "${spreadsheetName}" (bảng tính đang trống — hãy bấm "Lưu lên Google Sheet" để đẩy 12 lớp hiện có lên)!`,
      };
    } catch {
      return {
        ok: false,
        message: 'Lỗi kết nối mạng hoặc link Apps Script chưa bật quyền "Bất kỳ ai (Anyone)".',
      };
    }
  },

  /**
   * Push local snapshot up to Google Sheet (CORS-safe text/plain POST)
   */
  async pushToSheet(customUrl?: string, customPin?: string): Promise<{
    ok: boolean;
    message: string;
    spreadsheetName?: string;
  }> {
    const url = (customUrl ?? googleSheetSync.getScriptUrl()).trim();
    const pin = (customPin ?? googleSheetSync.getActivePin()).trim();

    if (!url || !url.startsWith('https://script.google.com/')) {
      return { ok: false, message: 'Chưa có đường link Web App Google Apps Script hợp lệ.' };
    }
    if (!pin) {
      return { ok: false, message: 'Chưa mở khóa mã PIN đồng bộ.' };
    }

    try {
      const payload = googleSheetSync.collectLocalSnapshot();
      const res = await fetch(url, {
        method: 'POST',
        redirect: 'follow',
        headers: {
          // text/plain avoids CORS preflight OPTIONS failure on script.google.com!
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: 'push',
          pin,
          ...payload,
        }),
      });

      const json = await res.json();
      if (!json.ok) {
        return {
          ok: false,
          message: json.message || 'Lưu lên Google Sheet thất bại (kiểm tra mã PIN).',
        };
      }

      googleSheetSync.saveSheetMeta(json.spreadsheetName || '', json.syncedAt || new Date().toISOString());
      return {
        ok: true,
        spreadsheetName: json.spreadsheetName,
        message: `Đã đồng bộ ${payload.classes.length} lớp, câu hỏi và bảng điểm lên "${json.spreadsheetName || 'Google Sheet'}"!`,
      };
    } catch {
      return {
        ok: false,
        message: 'Không thể kết nối Google Sheet (kiểm tra mạng hoặc quyền "Bất kỳ ai / Anyone" khi Deploy Apps Script).',
      };
    }
  },
};
