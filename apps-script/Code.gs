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

function doGet() {
  return HtmlService.createHtmlOutputFromFile("Bridge")
    .setTitle("STM Dos Ni Roha Sync Bridge")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Called only through google.script.run from Bridge.html.
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
