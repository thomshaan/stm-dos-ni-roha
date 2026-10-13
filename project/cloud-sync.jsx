// Google Sheets sync for STM DOS Ni Roha.
// The OAuth client ID and spreadsheet ID are public configuration, NOT secrets.
// Access is enforced by Google's OAuth token and the spreadsheet's own sharing permissions.
const STM_GOOGLE_CONFIG = {
  CLIENT_ID: "PASTE_YOUR_GOOGLE_OAUTH_CLIENT_ID.apps.googleusercontent.com",
  SPREADSHEET_ID: "PASTE_YOUR_GOOGLE_SPREADSHEET_ID",
};
const STM_CLOUD_TABS = [
  { title: "Families", key: "KELUARGA", id: "id_keluarga" },
  { title: "Transactions", key: "PEMBAYARAN", id: "id_pembayaran" },
  { title: "SavingsTypes", key: "JENIS_IURAN", id: "id_jenis" },
  { title: "Users", key: "USERS", id: "id_user" },
  { title: "Activity", key: "AKTIVITAS", id: "id" },
];
const STM_CLOUD = (() => {
  let accessToken = null;
  let saveTimer = null;
  let saveChain = Promise.resolve();
  let isLoadingRemote = false;

  function status(message, kind = "info") {
    window.dispatchEvent(new CustomEvent("stm:cloud-status", { detail: { message, kind } }));
  }
  function configReady() {
    return STM_GOOGLE_CONFIG.CLIENT_ID && !STM_GOOGLE_CONFIG.CLIENT_ID.startsWith("PASTE_") &&
      STM_GOOGLE_CONFIG.SPREADSHEET_ID && !STM_GOOGLE_CONFIG.SPREADSHEET_ID.startsWith("PASTE_");
  }
  async function api(path, options = {}) {
    if (!accessToken) throw new Error("Hubungkan akun Google terlebih dahulu.");
    const response = await fetch("https://sheets.googleapis.com/v4/spreadsheets/" +
      encodeURIComponent(STM_GOOGLE_CONFIG.SPREADSHEET_ID) + path, {
        ...options,
        headers: { Authorization: "Bearer " + accessToken, "Content-Type": "application/json", ...(options.headers || {}) },
      });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = body?.error?.message || ("Google Sheets API error " + response.status);
      throw new Error(message);
    }
    return body;
  }
  function collectionRows(tab) {
    const records = window.STM[tab.key] || [];
    return [["id", "record_json"], ...records.map((record, i) => [
      String(record[tab.id] ?? i + 1), JSON.stringify(record)
    ])];
  }
  async function saveAll() {
    if (!accessToken || isLoadingRemote) return;
    status("Menyimpan ke Google Sheets…", "busy");
    const ranges = STM_CLOUD_TABS.map(t => t.title + "!A:B");
    // Clear old rows first so deleted records do not reappear on the next load.
    await api("/values:batchClear", { method: "POST", body: JSON.stringify({ ranges }) });
    await api("/values:batchUpdate", {
      method: "POST",
      body: JSON.stringify({
        valueInputOption: "RAW",
        data: STM_CLOUD_TABS.map(t => ({
          range: t.title + "!A1",
          majorDimension: "ROWS",
          values: collectionRows(t),
        })),
      }),
    });
    status("Tersimpan di Google Sheets", "success");
  }
  function queueSave() {
    if (!accessToken || isLoadingRemote) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      saveChain = saveChain.then(saveAll).catch(err => {
        console.error("Google Sheets sync failed", err);
        status("Gagal menyimpan: " + err.message, "error");
      });
    }, 650);
  }
  async function readAll() {
    const params = new URLSearchParams();
    STM_CLOUD_TABS.forEach(t => params.append("ranges", t.title + "!A:B"));
    params.set("valueRenderOption", "FORMATTED_VALUE");
    const result = await api("/values:batchGet?" + params.toString());
    const byTitle = new Map((result.valueRanges || []).map(v => [String(v.range || "").split("!")[0].replace(/^'/, "").replace(/'$/, ""), v.values || []]));
    const records = {};
    for (const tab of STM_CLOUD_TABS) {
      const rows = byTitle.get(tab.title) || [];
      records[tab.key] = rows.slice(1).filter(row => row[1]).map(row => {
        const record = JSON.parse(row[1]);
        if (!record || typeof record !== "object" || Array.isArray(record)) throw new Error("Data tidak valid pada tab " + tab.title);
        return record;
      });
    }
    return records;
  }
  function applyRecords(records) {
    const S = window.STM;
    for (const tab of STM_CLOUD_TABS) {
      const target = S[tab.key];
      target.splice(0, target.length, ...(records[tab.key] || []));
    }
    // Update local cache and refresh all screens, without queuing a redundant cloud write.
    isLoadingRemote = true;
    try {
      localStorage.setItem("stm-dos-ni-roha-v1", JSON.stringify({
        KELUARGA: S.KELUARGA, JENIS_IURAN: S.JENIS_IURAN,
        PEMBAYARAN: S.PEMBAYARAN, USERS: S.USERS, AKTIVITAS: S.AKTIVITAS,
      }));
      window.dispatchEvent(new Event("stm:data-updated"));
    } finally { isLoadingRemote = false; }
  }
  async function connect(token) {
    accessToken = token;
    status("Memeriksa spreadsheet…", "busy");
    try {
      const meta = await api("?fields=sheets.properties.title");
      const sheetNames = new Set((meta.sheets || []).map(s => s.properties?.title));
      const missing = STM_CLOUD_TABS.map(t => t.title).filter(t => !sheetNames.has(t));
      if (missing.length) throw new Error("Buat tab berikut di Google Sheet terlebih dahulu: " + missing.join(", "));
      const records = await readAll();
      const remoteCount = STM_CLOUD_TABS.reduce((n, t) => n + (records[t.key] || []).length, 0);
      const localCount = STM_CLOUD_TABS.reduce((n, t) => n + ((window.STM[t.key] || []).length), 0);
      if (remoteCount > 0) {
        if (!window.confirm("Spreadsheet berisi " + remoteCount + " record. Muat data dari Google Sheets ke website? Data lokal browser akan diganti dengan data cloud.")) {
          accessToken = null; status("Koneksi dibatalkan", "warning"); return;
        }
        applyRecords(records);
        status("Terhubung — data dimuat dari Google Sheets", "success");
      } else {
        if (!window.confirm("Google Sheet masih kosong. " + localCount + " record lokal akan diunggah sebagai data awal. Lanjutkan?")) {
          accessToken = null; status("Koneksi dibatalkan", "warning"); return;
        }
        await saveAll();
      }
    } catch (err) {
      accessToken = null;
      console.error("Google Sheets connection failed", err);
      status("Koneksi gagal: " + err.message, "error");
    }
  }
  function beginAuth() {
    if (!configReady()) {
      status("Isi CLIENT_ID dan SPREADSHEET_ID di project/cloud-sync.jsx terlebih dahulu", "error");
      return;
    }
    if (!window.google?.accounts?.oauth2) {
      status("Google Sign-In belum siap. Muat ulang halaman dan coba lagi.", "error");
      return;
    }
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: STM_GOOGLE_CONFIG.CLIENT_ID,
      scope: "https://www.googleapis.com/auth/spreadsheets",
      callback: async response => {
        if (response.error || !response.access_token) {
          status("Login Google gagal: " + (response.error_description || response.error || "token tidak diterima"), "error");
          return;
        }
        await connect(response.access_token);
      },
      error_callback: error => status("Popup Google gagal: " + (error.message || error.type || "periksa izin popup"), "error"),
    });
    client.requestAccessToken({ prompt: "select_account" });
  }
  function disconnect() {
    if (accessToken && window.google?.accounts?.oauth2) {
      window.google.accounts.oauth2.revoke(accessToken, () => {});
    }
    accessToken = null;
    clearTimeout(saveTimer);
    status("Tidak terhubung — perubahan hanya tersimpan di browser", "warning");
  }
  return { beginAuth, disconnect, queueSave, get connected() { return !!accessToken; } };
})();
window.STM_CLOUD = STM_CLOUD;

function CloudSyncControl() {
  const [state, setState] = React.useState({ message: "Google Sheets belum terhubung", kind: "warning" });
  const [connected, setConnected] = React.useState(false);
  React.useEffect(() => {
    const update = e => {
      setState(e.detail || { message: "Status berubah", kind: "info" });
      setConnected(!!window.STM_CLOUD?.connected);
    };
    window.addEventListener("stm:cloud-status", update);
    return () => window.removeEventListener("stm:cloud-status", update);
  }, []);
  return (
    <div style={{display:"inline-flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
      <span title={state.message} style={{fontSize:11,color:state.kind==="error"?"#b42318":state.kind==="success"?"#32764b":"var(--muted,#777)",maxWidth:210,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{state.message}</span>
      {connected
        ? <button className="btn btn-sec btn-sm" onClick={() => { STM_CLOUD.disconnect(); setConnected(false); }}>Putuskan</button>
        : <button className="btn btn-sec btn-sm" onClick={() => STM_CLOUD.beginAuth()}><Icon name="cloud" size={14}/> Hubungkan Sheets</button>}
    </div>
  );
}
window.CloudSyncControl = CloudSyncControl;
