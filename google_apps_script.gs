/**
 * ============================================================================
 * GOOGLE APPS SCRIPT - DATABASE CHO WEB "TRỢ LÝ LỚP HỌC THCS" (PHƯƠNG ÁN 1)
 * ============================================================================
 * HƯỚNG DẪN CÀI ĐẶT (CHỈ LÀM 1 LẦN DUY NHẤT - MẤT ~2 PHÚT):
 * 1. Mở https://sheets.new để tạo 1 file Google Sheet mới trên Google Drive của Thầy
 *    (Đặt tên file ví dụ: "Trợ Lý Lớp Học THCS - Database").
 * 2. Trên thanh menu Google Sheet, chọn: Tiện ích mở rộng (Extensions) -> Apps Script.
 * 3. Xóa hết đoạn mã mặc định trong khung soạn thảo, dán TOÀN BỘ mã này vào.
 * 4. Đổi mã SECRET_PIN bên dưới thành mã PIN 4–6 số bí mật của riêng Thầy -> Bấm Lưu (Ctrl+S).
 * 5. Góc trên bên phải bấm: Triển khai (Deploy) -> Tùy chọn triển khai mới (New deployment):
 *    - Chọn loại (Select type - biểu tượng bánh răng): Ứng dụng web (Web app)
 *    - Thực thi dưới dạng (Execute as): Tôi (Me)
 *    - Ai có quyền truy cập (Who has access): BẤT KỲ AI (Anyone)  <-- Rất quan trọng!
 *    - Bấm Triển khai (Deploy) -> Cấp quyền truy cập Google -> Copy đường link Web App URL (.../exec).
 * 6. Dán đường link Web App URL và mã PIN vào nút "📊 Google Sheet" trên trang web!
 * ============================================================================
 */

const SECRET_PIN = "123456"; // <-- THẦY ĐỔI MÃ PIN BẢO MẬT TẠI ĐÂY

const SHEET_CLASSES = "DanhSachLop";
const SHEET_QUESTIONS = "CauHoi";
const SHEET_STATES = "BangDiem";

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function slugifyClassId(name, idx) {
  var clean = String(name || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/^lop\s*/i, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return clean ? "class_" + clean : "class_custom_" + (idx + 1);
}

function ensureSheets(ss) {
  var shClasses = ss.getSheetByName(SHEET_CLASSES);
  if (!shClasses) {
    shClasses = ss.insertSheet(SHEET_CLASSES);
  }

  var shQuestions = ss.getSheetByName(SHEET_QUESTIONS);
  if (!shQuestions) {
    shQuestions = ss.insertSheet(SHEET_QUESTIONS);
    shQuestions.getRange(1, 1).setValue("Câu hỏi kiểm tra bài cũ").setFontWeight("bold");
    shQuestions.setColumnWidth(1, 550);
  }

  var shStates = ss.getSheetByName(SHEET_STATES);
  if (!shStates) {
    shStates = ss.insertSheet(SHEET_STATES);
    shStates
      .getRange(1, 1, 1, 6)
      .setValues([["MaLop", "TenLop", "DiemThiDuaJSON", "HocSinhVangJSON", "NhomChiaJSON", "CapNhatLuc"]])
      .setFontWeight("bold");
  }

  return { shClasses: shClasses, shQuestions: shQuestions, shStates: shStates };
}

function readAllData(ss) {
  var sheets = ensureSheets(ss);

  // 1. Read DanhSachLop (Each column = 1 class, Row 1 = Class Name, Row 2+ = Students)
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

  // 2. Read CauHoi (Column A, Row 2+)
  var questions = [];
  var lastRowQ = sheets.shQuestions.getLastRow();
  if (lastRowQ >= 2) {
    var valuesQ = sheets.shQuestions.getRange(2, 1, lastRowQ - 1, 1).getValues();
    for (var i = 0; i < valuesQ.length; i++) {
      var q = String(valuesQ[i][0] || "").trim();
      if (q) questions.push(q);
    }
  }

  // 3. Read BangDiem & Attendance & SplitGroups
  var classStates = {};
  var lastRowS = sheets.shStates.getLastRow();
  if (lastRowS >= 2) {
    var valuesS = sheets.shStates.getRange(2, 1, lastRowS - 1, 6).getValues();
    for (var r = 0; r < valuesS.length; r++) {
      var cId = String(valuesS[r][0] || "").trim();
      if (!cId) continue;
      var scoreGroups = null;
      var absent = [];
      var splitGroups = null;
      try { scoreGroups = valuesS[r][2] ? JSON.parse(valuesS[r][2]) : null; } catch (err) {}
      try { absent = valuesS[r][3] ? JSON.parse(valuesS[r][3]) : []; } catch (err) {}
      try { splitGroups = valuesS[r][4] ? JSON.parse(valuesS[r][4]) : null; } catch (err) {}
      classStates[cId] = {
        className: String(valuesS[r][1] || ""),
        scoreGroups: scoreGroups,
        absent: absent,
        splitGroups: splitGroups,
        updatedAt: String(valuesS[r][5] || "")
      };
    }
  }

  return {
    spreadsheetName: ss.getName(),
    classes: classes,
    questions: questions,
    classStates: classStates,
    syncedAt: new Date().toISOString()
  };
}

function doGet(e) {
  try {
    var params = (e && e.parameter) ? e.parameter : {};
    var pin = String(params.pin || "");
    var action = String(params.action || "pull");

    if (pin !== SECRET_PIN) {
      return jsonResponse({ ok: false, error: "INVALID_PIN", message: "Mã PIN bảo mật không đúng!" });
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (action === "ping") {
      ensureSheets(ss);
      return jsonResponse({ ok: true, spreadsheetName: ss.getName(), syncedAt: new Date().toISOString() });
    }

    var data = readAllData(ss);
    return jsonResponse({ ok: true, data: data });
  } catch (err) {
    return jsonResponse({ ok: false, error: "SERVER_ERROR", message: String(err) });
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    var raw = (e && e.postData && e.postData.contents) ? e.postData.contents : "{}";
    var body = JSON.parse(raw);
    var pin = String(body.pin || "");

    if (pin !== SECRET_PIN) {
      return jsonResponse({ ok: false, error: "INVALID_PIN", message: "Mã PIN bảo mật không đúng!" });
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheets = ensureSheets(ss);

    // 1. Write DanhSachLop (Columns = Classes)
    if (Array.isArray(body.classes) && body.classes.length > 0) {
      sheets.shClasses.clearContents();
      var numCols = body.classes.length;
      var maxStudents = 0;
      for (var c = 0; c < numCols; c++) {
        var len = Array.isArray(body.classes[c].students) ? body.classes[c].students.length : 0;
        if (len > maxStudents) maxStudents = len;
      }
      var totalRows = Math.max(1, maxStudents + 1);
      var grid = [];
      var headerRow = [];
      for (var c2 = 0; c2 < numCols; c2++) {
        headerRow.push(body.classes[c2].name || ("Lớp " + (c2 + 1)));
      }
      grid.push(headerRow);

      for (var r = 0; r < maxStudents; r++) {
        var rowArr = [];
        for (var c3 = 0; c3 < numCols; c3++) {
          var stList = body.classes[c3].students || [];
          rowArr.push(stList[r] || "");
        }
        grid.push(rowArr);
      }

      sheets.shClasses.getRange(1, 1, totalRows, numCols).setValues(grid);
      sheets.shClasses
        .getRange(1, 1, 1, numCols)
        .setFontWeight("bold")
        .setBackground("#4f46e5")
        .setFontColor("#ffffff");
      for (var cw = 1; cw <= numCols; cw++) {
        sheets.shClasses.setColumnWidth(cw, 190);
      }
    }

    // 2. Write CauHoi
    if (Array.isArray(body.questions)) {
      sheets.shQuestions.clearContents();
      var qRows = [["Câu hỏi kiểm tra bài cũ"]];
      for (var qIdx = 0; qIdx < body.questions.length; qIdx++) {
        if (body.questions[qIdx]) qRows.push([String(body.questions[qIdx])]);
      }
      sheets.shQuestions.getRange(1, 1, qRows.length, 1).setValues(qRows);
      sheets.shQuestions
        .getRange(1, 1)
        .setFontWeight("bold")
        .setBackground("#f59e0b")
        .setFontColor("#0f172a");
      sheets.shQuestions.setColumnWidth(1, 560);
    }

    // 3. Write BangDiem & Attendance & SplitGroups
    if (body.classStates && typeof body.classStates === "object") {
      sheets.shStates.clearContents();
      var sRows = [["MaLop", "TenLop", "DiemThiDuaJSON", "HocSinhVangJSON", "NhomChiaJSON", "CapNhatLuc"]];
      var nowStr = new Date().toLocaleString("vi-VN");
      var keys = Object.keys(body.classStates);
      for (var k = 0; k < keys.length; k++) {
        var classId = keys[k];
        var stObj = body.classStates[classId] || {};
        sRows.push([
          classId,
          stObj.className || classId,
          JSON.stringify(stObj.scoreGroups || []),
          JSON.stringify(stObj.absent || []),
          JSON.stringify(stObj.splitGroups || []),
          nowStr
        ]);
      }
      sheets.shStates.getRange(1, 1, sRows.length, 6).setValues(sRows);
      sheets.shStates
        .getRange(1, 1, 1, 6)
        .setFontWeight("bold")
        .setBackground("#059669")
        .setFontColor("#ffffff");
    }

    return jsonResponse({
      ok: true,
      spreadsheetName: ss.getName(),
      syncedAt: new Date().toISOString()
    });
  } catch (err) {
    return jsonResponse({ ok: false, error: "SERVER_ERROR", message: String(err) });
  } finally {
    lock.releaseLock();
  }
}
