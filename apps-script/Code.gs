/**
 * STM Dos Ni Roha — Google Apps Script bridge.
 * Deploy as a web app: Execute as you; access: Anyone.
 * Store SPREADSHEET_ID and ACCESS_PIN in Script Properties, never in source control.
 */
const TABLES = {
  KELUARGA: ["id_keluarga","no_anggota","kepala_keluarga","no_hp","status","tanggal_gabung"],
  JENIS_IURAN: ["id_jenis","nama_jenis","nominal_default","tipe"],
  PEMBAYARAN: ["id_pembayaran","id_keluarga","id_jenis","bulan","tahun","nominal","tanggal_bayar","metode_pembayaran","keterangan","dicatat_oleh","jenis_transaksi"],
  USERS: ["id_user","nama","username","role","last_login"],
  AKTIVITAS: ["id","waktu","user","aksi","detail","tipe"]
};

function doGet(e) {
  const params = (e && e.parameter) || {};
  if (params.action) return jsonpRequest_(params);
  return HtmlService.createHtmlOutputFromFile("Bridge")
    .setTitle("STM Dos Ni Roha Sync Bridge")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Cross-origin JSONP endpoint for reads and write-status polling.
 * JSONP avoids the HTML Service iframe postMessage bridge entirely.
 */
function jsonpRequest_(params) {
  const callback = String(params.callback || "");
  if (!/^stmJsonp_[A-Za-z0-9_]+$/.test(callback)) {
    return ContentService.createTextOutput("/* Invalid callback */")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  let result;
  try {
    const passphrase = String(params.passphrase || "");
    if (params.action === "status") {
      bridgeRequest("ping", passphrase, {});
      const id = String(params.requestId || "");
      if (!/^[A-Za-z0-9_-]{1,100}$/.test(id)) throw new Error("ID permintaan tidak valid.");
      const cached = CacheService.getScriptCache().get("STM_REQ_" + id);
      result = cached ? JSON.parse(cached) : { ok: false, pending: true };
    } else {
      if (params.action === "replaceAll") throw new Error("Operasi tulis harus menggunakan POST.");
      const payload = params.payload ? JSON.parse(params.payload) : {};
      result = bridgeRequest(String(params.action || ""), passphrase, payload);
    }
  } catch (error) {
    result = { ok: false, error: error && error.message ? error.message : "Permintaan gagal." };
  }

  return ContentService.createTextOutput(callback + "(" + JSON.stringify(result) + ");")
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

/**
 * Cross-origin write endpoint. The browser cannot read this response in no-cors
 * mode, so the result is saved briefly in Script Cache and polled via JSONP.
 */
function doPost(e) {
  let body = {};
  let result;
  try {
    body = JSON.parse(e && e.postData && e.postData.contents || "{}");
    const id = String(body.id || "");
    if (!/^[A-Za-z0-9_-]{1,100}$/.test(id)) throw new Error("ID permintaan tidak valid.");
    result = bridgeRequest(String(body.action || ""), body.passphrase, body.payload || {});
    CacheService.getScriptCache().put("STM_REQ_" + id, JSON.stringify(result), 300);
  } catch (error) {
    result = { ok: false, error: error && error.message ? error.message : "Permintaan gagal." };
    const id = String(body.id || "");
    if (/^[A-Za-z0-9_-]{1,100}$/.test(id)) {
      CacheService.getScriptCache().put("STM_REQ_" + id, JSON.stringify(result), 300);
    }
  }
  return ContentService.createTextOutput(JSON.stringify({ accepted: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Internal operation handler used by the JSONP GET and POST endpoints.
 * A shared family passphrase is required for every operation.
 */
function bridgeRequest(action, passphrase, payload) {
  const props = PropertiesService.getScriptProperties();
  const expected = props.getProperty("ACCESS_PIN");
  if (!expected || typeof passphrase !== "string" || !constantTimeEqual_(passphrase, expected)) {
    throw new Error("Akses ditolak. Periksa kode akses keluarga.");
  }
  const spreadsheetId = props.getProperty("SPREADSHEET_ID");
  if (!spreadsheetId) throw new Error("Backend belum dikonfigurasi: SPREADSHEET_ID tidak ditemukan.");
  if (action === "ping") return { ok: true, message: "Backend siap." };
  if (action === "getAll") return { ok: true, datasets: readAll_(spreadsheetId) };
  if (action === "replaceAll") {
    if (!payload || !payload.datasets || typeof payload.datasets !== "object") throw new Error("Payload data tidak valid.");
    const lock = LockService.getScriptLock();
    lock.waitLock(15000);
    try {
      replaceAll_(spreadsheetId, payload.datasets);
      return { ok: true, message: "Data berhasil disimpan.", savedAt: new Date().toISOString() };
    } finally {
      lock.releaseLock();
    }
  }
  throw new Error("Operasi tidak dikenal.");
}

function readAll_(spreadsheetId) {
  const ss = SpreadsheetApp.openById(spreadsheetId);
  const result = {};
  Object.keys(TABLES).forEach(name => {
    const sheet = ss.getSheetByName(name);
    if (!sheet) throw new Error("Tab tidak ditemukan: " + name);
    const values = sheet.getDataRange().getValues();
    if (!values.length || values.length === 1 && values[0].every(v => v === "")) {
      result[name] = [];
      return;
    }
    const headers = values[0].map(v => String(v));
    result[name] = values.slice(1).filter(row => row.some(v => v !== "")).map(row => {
      const record = {};
      headers.forEach((key, i) => {
        let value = row[i] === undefined ? "" : row[i];
        if (value instanceof Date) value = Utilities.formatDate(value, Session.getScriptTimeZone(), "yyyy-MM-dd");
        if (value !== "" && ["id_keluarga","id_jenis","id_pembayaran","id_user","id","bulan","tahun","nominal","nominal_default"].includes(key)) {
          const n = Number(value);
          if (Number.isFinite(n)) value = n;
        }
        record[key] = value;
      });
      return record;
    });
  });
  return result;
}

function replaceAll_(spreadsheetId, datasets) {
  const ss = SpreadsheetApp.openById(spreadsheetId);
  Object.keys(TABLES).forEach(name => {
    const rows = datasets[name];
    if (!Array.isArray(rows)) throw new Error("Dataset tidak valid: " + name);
    if (rows.length > 20000) throw new Error("Dataset terlalu besar: " + name);
    const sheet = ss.getSheetByName(name) || ss.insertSheet(name);
    const headers = Array.from(new Set(TABLES[name].concat(rows.flatMap(row => Object.keys(row || {})))));
    const values = [headers].concat(rows.map(row => headers.map(key => {
      const value = row && row[key] != null ? row[key] : "";
      return value && typeof value === "object" ? JSON.stringify(value) : value;
    })));
    sheet.clearContents();
    if (values.length && headers.length) {
      sheet.getRange(1, 1, values.length, headers.length).setValues(values);
    }
  });
}

function constantTimeEqual_(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
