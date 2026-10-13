// Google Sheets cloud storage. OAuth token is kept in memory only; no client secret is stored in the site.
const { Icon } = window;
(() => {
  const CONFIG_KEY = "stm-google-sheets-config-v1";
  const READY_KEY = "stm-google-sheets-ready-v1";
  const TAB_COLUMNS = {
    KELUARGA: ["id_keluarga","no_anggota","kepala_keluarga","no_hp","status","tanggal_gabung"],
    JENIS_IURAN: ["id_jenis","nama_jenis","nominal_default","tipe"],
    PEMBAYARAN: ["id_pembayaran","id_keluarga","id_jenis","bulan","tahun","nominal","tanggal_bayar","metode_pembayaran","keterangan","dicatat_oleh","jenis_transaksi"],
    USERS: ["id_user","nama","username","role","last_login"],
    AKTIVITAS: ["id","waktu","user","aksi","detail","tipe"]
  };
  let accessToken = null;
  let tokenClient = null;
  let saveTimer = null;
  let syncing = false;
  let queued = false;
  let gasFrame = null;
  let gasFrameReady = null;
  let gasSaving = false;
  let gasQueued = false;
  let gasDirty = false;
  let applyingGasData = false;
  let gasPollTimer = null;
  const gasPending = new Map();

  function gasConfig() {
    const config = readConfig();
    if (!config.gasUrl || !config.gasPin) throw new Error("Masukkan URL Apps Script dan kode akses keluarga.");
    let url;
    try { url = new URL(config.gasUrl); } catch (_) { throw new Error("URL Apps Script tidak valid."); }
    if (url.protocol !== "https:" || url.hostname !== "script.google.com" || !url.pathname.includes("/macros/s/") || !url.pathname.endsWith("/exec")) {
      throw new Error("Gunakan URL deployment Google Apps Script yang berakhir dengan /exec.");
    }
    return config;
  }
  function ensureGasFrame() {
    const config = gasConfig();
    if (gasFrame && gasFrame.src === config.gasUrl && gasFrameReady) return gasFrameReady;
    if (gasFrame) gasFrame.remove();
    gasFrame = document.createElement("iframe");
    gasFrame.title = "STM Dos Ni Roha secure sync bridge";
    gasFrame.setAttribute("aria-hidden", "true");
    gasFrame.style.cssText = "position:fixed;width:1px;height:1px;left:-10px;bottom:-10px;border:0;opacity:0;pointer-events:none";
    gasFrameReady = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Apps Script bridge tidak merespons. Periksa URL deployment dan akses Anyone.")), 20000);
      gasFrame.addEventListener("load", () => { clearTimeout(timeout); resolve(); }, { once: true });
      gasFrame.addEventListener("error", () => { clearTimeout(timeout); reject(new Error("Gagal memuat Apps Script bridge.")); }, { once: true });
    });
    gasFrame.src = config.gasUrl;
    document.body.appendChild(gasFrame);
    return gasFrameReady;
  }
  window.addEventListener("message", event => {
    if (!gasFrame || event.source !== gasFrame.contentWindow) return;
    const message = event.data || {};
    if (message.type !== "stm-gas-response" || !gasPending.has(message.id)) return;
    const pending = gasPending.get(message.id);
    gasPending.delete(message.id);
    clearTimeout(pending.timeout);
    if (message.ok) pending.resolve(message.result);
    else pending.reject(new Error(message.error || "Permintaan Apps Script gagal."));
  });
  async function gasRequest(action, payload = {}) {
    const config = gasConfig();
    await ensureGasFrame();
    return new Promise((resolve, reject) => {
      const id = "gas-" + Date.now() + "-" + Math.random().toString(36).slice(2);
      const timeout = setTimeout(() => {
        gasPending.delete(id);
        reject(new Error("Permintaan sinkronisasi melewati batas waktu. Periksa koneksi internet dan deployment Apps Script."));
      }, 30000);
      gasPending.set(id, { resolve, reject, timeout });
      gasFrame.contentWindow.postMessage({
        type: "stm-gas-request", id, action, passphrase: config.gasPin, payload
      }, "*");
    });
  }
  function currentDatasets() {
    const S = window.STM;
    return { KELUARGA:S.KELUARGA, JENIS_IURAN:S.JENIS_IURAN, PEMBAYARAN:S.PEMBAYARAN, USERS:S.USERS, AKTIVITAS:S.AKTIVITAS };
  }
  async function gasTest() {
    const result = await gasRequest("ping");
    if (!result || !result.ok) throw new Error("Apps Script tidak mengonfirmasi koneksi.");
    emit("connected", "Apps Script terhubung. Kode akses keluarga diterima.");
    return result;
  }
  function applyGasDatasets(datasets) {
    const S = window.STM;
    for (const key of Object.keys(TAB_COLUMNS)) {
      const rows = datasets[key];
      if (!Array.isArray(rows)) throw new Error("Data tab tidak valid: " + key);
      S[key].splice(0, S[key].length, ...rows);
    }
    applyingGasData = true;
    try { S.persistSTM({ skipCloud: true }); }
    finally { applyingGasData = false; }
  }
  async function gasLoadAll() {
    emit("working", "Memuat data keluarga dari Google Sheets…");
    const response = await gasRequest("getAll");
    if (!response || !response.ok || !response.datasets) throw new Error("Backend tidak mengembalikan data yang valid.");
    applyGasDatasets(response.datasets);
    writeConfig({ backendReady: true });
    gasDirty = false;
    startGasPolling();
    emit("saved", "Data terbaru berhasil dimuat. Sinkronisasi otomatis aktif pada perangkat ini.");
    return response.datasets;
  }
  async function gasPoll() {
    const config = readConfig();
    if (!config.backendReady || !config.gasUrl || !config.gasPin || gasSaving || gasDirty || document.visibilityState !== "visible") return;
    try {
      const response = await gasRequest("getAll");
      if (response && response.ok && response.datasets && !gasSaving && !gasDirty) {
        applyGasDatasets(response.datasets);
      }
    } catch (error) {
      emit("error", "Pembaruan cloud otomatis gagal: " + error.message);
    }
  }
  function startGasPolling() {
    if (gasPollTimer) clearInterval(gasPollTimer);
    gasPollTimer = setInterval(gasPoll, 30000);
  }
  async function gasUploadLocal() {
    emit("working", "Mengunggah data perangkat ke Google Sheets…");
    const response = await gasRequest("replaceAll", { datasets: currentDatasets() });
    if (!response || !response.ok) throw new Error("Backend gagal menyimpan data.");
    writeConfig({ backendReady: true });
    emit("saved", "Data perangkat berhasil diunggah. Sinkronisasi otomatis aktif.");
    return response;
  }
  async function gasSaveAll() {
    const config = readConfig();
    if (!config.gasUrl || !config.gasPin || !config.backendReady) return;
    if (gasSaving) { gasQueued = true; return; }
    gasSaving = true;
    emit("syncing", "Menyinkronkan perubahan ke Google Sheets…");
    try {
      gasDirty = false;
      await gasRequest("replaceAll", { datasets: currentDatasets() });
      emit("saved", "Perubahan tersimpan di Google Sheets.");
    } catch (error) {
      emit("error", "Sinkronisasi Apps Script gagal: " + error.message);
      throw error;
    } finally {
      gasSaving = false;
      if (gasQueued) { gasQueued = false; gasSaveAll().catch(() => {}); }
    }
  }

  function readConfig() {
    try { return JSON.parse(localStorage.getItem(CONFIG_KEY) || "{}"); }
    catch (_) { return {}; }
  }
  function writeConfig(next) {
    const current = readConfig();
    const merged = { ...current, ...next };
    localStorage.setItem(CONFIG_KEY, JSON.stringify(merged));
    window.dispatchEvent(new CustomEvent("stm:cloud-status", { detail: { config: merged } }));
    return merged;
  }
  function emit(status, message) {
    window.dispatchEvent(new CustomEvent("stm:cloud-status", { detail: { status, message, config: readConfig() } }));
  }
  function setReady(value) {
    if (value) localStorage.setItem(READY_KEY, "1");
    else localStorage.removeItem(READY_KEY);
  }
  function isReady() { return localStorage.getItem(READY_KEY) === "1"; }
  function waitForGoogle() {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const check = () => {
        if (window.google?.accounts?.oauth2) return resolve();
        if (++attempts > 40) return reject(new Error("Google Identity Services belum termuat. Muat ulang halaman dan coba lagi."));
        setTimeout(check, 150);
      };
      check();
    });
  }
  function authorize() {
    return waitForGoogle().then(() => new Promise((resolve, reject) => {
      const config = readConfig();
      if (!config.clientId) return reject(new Error("Masukkan OAuth Client ID terlebih dahulu."));
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: config.clientId,
        scope: "https://www.googleapis.com/auth/drive.file",
        callback: async (response) => {
          if (response.error || !response.access_token) {
            emit("error", response.error_description || response.error || "Google authorization gagal.");
            reject(new Error(response.error_description || response.error || "Google authorization gagal."));
            return;
          }
          accessToken = response.access_token;
          emit("connected", "Terhubung ke Google. Token hanya disimpan sementara di memori browser.");
          resolve();
        },
        error_callback: (error) => {
          const message = error?.message || "Jendela login Google tidak dapat dibuka. Izinkan pop-up lalu coba lagi.";
          emit("error", message); reject(new Error(message));
        }
      });
      tokenClient.requestAccessToken();
    }));
  }
  async function api(url, options = {}) {
    if (!accessToken) throw new Error("Hubungkan akun Google terlebih dahulu.");
    const response = await fetch(url, {
      ...options,
      headers: { Authorization: "Bearer " + accessToken, ...(options.body ? { "Content-Type": "application/json" } : {}), ...(options.headers || {}) }
    });
    const raw = await response.text();
    let body = {};
    try { body = raw ? JSON.parse(raw) : {}; } catch (_) {}
    if (!response.ok) {
      const message = body?.error?.message || ("Google API error " + response.status);
      if (response.status === 401) accessToken = null;
      throw new Error(message);
    }
    return body;
  }
  async function createSpreadsheet() {
    const config = readConfig();
    if (!accessToken) await authorize();
    emit("working", "Membuat spreadsheet baru di Google Drive…");
    const result = await api("https://sheets.googleapis.com/v4/spreadsheets", {
      method: "POST",
      body: JSON.stringify({
        properties: { title: "STM Dos Ni Roha — Database" },
        sheets: Object.keys(TAB_COLUMNS).map(title => ({ properties: { title } }))
      })
    });
    writeConfig({ spreadsheetId: result.spreadsheetId, spreadsheetUrl: result.spreadsheetUrl || ("https://docs.google.com/spreadsheets/d/" + result.spreadsheetId + "/edit") });
    setReady(false);
    emit("connected", "Spreadsheet dibuat. Pilih “Upload data perangkat ini” untuk mengisi data awal.");
    return result;
  }
  function toSheetRows(name, records) {
    const fields = [...new Set([...TAB_COLUMNS[name], ...records.flatMap(row => Object.keys(row))])];
    return [fields, ...records.map(record => fields.map(field => {
      const value = record[field];
      return value == null ? "" : (typeof value === "object" ? JSON.stringify(value) : value);
    }))];
  }
  async function saveAll() {
    const config = readConfig();
    if (!accessToken || !config.spreadsheetId || !isReady()) return;
    if (syncing) { queued = true; return; }
    syncing = true;
    emit("syncing", "Menyimpan perubahan ke Google Sheets…");
    try {
      const sid = encodeURIComponent(config.spreadsheetId);
      const ranges = Object.keys(TAB_COLUMNS).map(name => name + "!A:AZ");
      await api("https://sheets.googleapis.com/v4/spreadsheets/" + sid + "/values:batchClear", {
        method: "POST", body: JSON.stringify({ ranges })
      });
      const S = window.STM;
      const datasets = {
        KELUARGA: S.KELUARGA,
        JENIS_IURAN: S.JENIS_IURAN,
        PEMBAYARAN: S.PEMBAYARAN,
        USERS: S.USERS,
        AKTIVITAS: S.AKTIVITAS
      };
      const data = Object.keys(TAB_COLUMNS).map(name => ({
        range: name + "!A1",
        majorDimension: "ROWS",
        values: toSheetRows(name, datasets[name])
      }));
      await api("https://sheets.googleapis.com/v4/spreadsheets/" + sid + "/values:batchUpdate", {
        method: "POST", body: JSON.stringify({ valueInputOption: "RAW", data })
      });
      emit("saved", "Semua data tersimpan di Google Sheets.");
    } catch (error) {
      emit("error", "Sinkronisasi gagal: " + error.message + ". Data lokal tetap tersedia.");
      throw error;
    } finally {
      syncing = false;
      if (queued) { queued = false; saveAll().catch(() => {}); }
    }
  }
  async function loadAll() {
    const config = readConfig();
    if (!accessToken) await authorize();
    if (!config.spreadsheetId) throw new Error("Buat spreadsheet terlebih dahulu.");
    emit("working", "Membaca data dari Google Sheets…");
    const sid = encodeURIComponent(config.spreadsheetId);
    const ranges = Object.keys(TAB_COLUMNS).map(name => name + "!A:AZ");
    const response = await api("https://sheets.googleapis.com/v4/spreadsheets/" + sid + "/values:batchGet?ranges=" + ranges.map(encodeURIComponent).join("&ranges="), { method: "GET" });
    const mapped = {};
    for (const valueRange of response.valueRanges || []) {
      const name = (valueRange.range || "").split("!")[0].replace(/^'/, "").replace(/'$/, "");
      if (!TAB_COLUMNS[name]) continue;
      const values = valueRange.values || [];
      if (values.length < 2) { mapped[name] = []; continue; }
      const headers = values[0].map(v => String(v));
      mapped[name] = values.slice(1).filter(row => row.some(v => v !== "")).map(row => {
        const record = {};
        headers.forEach((key, i) => {
          let value = row[i] ?? "";
          if (value !== "" && ["id_keluarga","id_jenis","id_pembayaran","id_user","id","bulan","tahun","nominal","nominal_default"].includes(key)) {
            const number = Number(value);
            if (Number.isFinite(number)) value = number;
          }
          record[key] = value;
        });
        return record;
      });
    }
    const S = window.STM;
    for (const [tab, key] of [["KELUARGA","KELUARGA"],["JENIS_IURAN","JENIS_IURAN"],["PEMBAYARAN","PEMBAYARAN"],["USERS","USERS"],["AKTIVITAS","AKTIVITAS"]]) {
      if (Array.isArray(mapped[tab])) S[key].splice(0, S[key].length, ...mapped[tab]);
    }
    S.persistSTM({ skipCloud: true });
    setReady(true);
    emit("saved", "Data cloud berhasil dimuat ke website.");
    return mapped;
  }
  async function uploadLocal() {
    const config = readConfig();
    if (!accessToken) await authorize();
    if (!config.spreadsheetId) throw new Error("Buat spreadsheet terlebih dahulu.");
    setReady(true);
    try { await saveAll(); }
    catch (error) { setReady(false); throw error; }
  }
  function scheduleSave() {
    if (applyingGasData) return;
    const config = readConfig();
    if (config.gasUrl && config.gasPin && config.backendReady) {
      gasDirty = true;
      if (gasSaving) gasQueued = true;
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => gasSaveAll().catch(() => {}), 900);
      return;
    }
    if (!accessToken || !config.spreadsheetId || !isReady()) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => saveAll().catch(() => {}), 900);
  }
  async function connect() {
    await authorize();
    const config = readConfig();
    if (config.spreadsheetId && isReady()) {
      await loadAll();
    } else {
      emit("connected", config.spreadsheetId ? "Terhubung. Pilih untuk memuat data cloud atau mengunggah data perangkat ini." : "Terhubung. Buat spreadsheet untuk mulai menyimpan data.");
    }
  }
  window.STMCloudSync = { readConfig, writeConfig, authorize, connect, createSpreadsheet, loadAll, uploadLocal, scheduleSave, isConnected: () => !!accessToken, isReady, gasTest, gasLoadAll, gasUploadLocal };
  window.addEventListener("stm:data-updated", scheduleSave);
  setTimeout(() => {
    const config = readConfig();
    if (config.gasUrl && config.gasPin && config.backendReady) {
      gasLoadAll().catch(error => emit("error", "Gagal memuat data cloud otomatis: " + error.message));
    }
  }, 1200);
})();
function CloudSettings() {
  const S = window.STMCloudSync;
  const [clientId, setClientId] = React.useState(S.readConfig().clientId || "");
  const [spreadsheetId, setSpreadsheetId] = React.useState(S.readConfig().spreadsheetId || "");
  const [spreadsheetUrl, setSpreadsheetUrl] = React.useState(S.readConfig().spreadsheetUrl || "");
  const [gasUrl, setGasUrl] = React.useState(S.readConfig().gasUrl || "");
  const [gasPin, setGasPin] = React.useState(S.readConfig().gasPin || "");
  const [status, setStatus] = React.useState({ status: "idle", message: "Belum terhubung. Data tetap disimpan di browser sampai sinkronisasi diaktifkan." });
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  React.useEffect(() => {
    const handler = (event) => {
      const detail = event.detail || {};
      setStatus({ status: detail.status || "idle", message: detail.message || "" });
      if (detail.config) {
        setSpreadsheetId(detail.config.spreadsheetId || "");
        setSpreadsheetUrl(detail.config.spreadsheetUrl || "");
        setGasUrl(detail.config.gasUrl || "");
        setGasPin(detail.config.gasPin || "");
      }
    };
    window.addEventListener("stm:cloud-status", handler);
    return () => window.removeEventListener("stm:cloud-status", handler);
  }, []);
  const run = async (task) => {
    setBusy(true); setError("");
    try { await task(); }
    catch (e) { setError(e.message || String(e)); }
    finally { setBusy(false); }
  };
  const saveSettings = () => {
    const id = clientId.trim();
    if (!id.endsWith(".apps.googleusercontent.com")) {
      setError("OAuth Client ID belum valid. Biasanya berakhir dengan .apps.googleusercontent.com");
      return false;
    }
    const next = S.writeConfig({ clientId: id, spreadsheetId: spreadsheetId.trim(), spreadsheetUrl });
    setClientId(next.clientId);
    setError("");
    setStatus({ status: "idle", message: "Pengaturan disimpan pada browser ini." });
    return true;
  };
  const badge = status.status === "saved" ? "Tersimpan" : status.status === "syncing" || status.status === "working" ? "Sedang bekerja" : status.status === "connected" ? "Terhubung" : status.status === "error" ? "Perlu perhatian" : "Belum aktif";
  const badgeClass = status.status === "saved" ? "badge-green" : status.status === "error" ? "badge-red" : "badge-neutral";
  return (
    <div className="grid" style={{gap:16}}>
      <div className="card card-pad">
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
          <div className="stat-ico"><Icon name="settings" size={17}/></div>
          <div><h3 style={{margin:0}}>Penyimpanan Google Sheets</h3><div className="muted" style={{fontSize:12}}>Database online pribadi untuk STM Dos Ni Roha</div></div>
        </div>
        <p className="muted" style={{fontSize:13,lineHeight:1.65}}>Website ini tetap berjalan di GitHub Pages. Setelah Google OAuth diatur dan kamu menghubungkan akun, data keluarga, jenis tabungan, transaksi, pengguna, dan aktivitas akan disimpan ke spreadsheet milik akun Google kamu.</p>
        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:12}}>
          <span className={"badge " + badgeClass}>{badge}</span><span className="muted" style={{fontSize:12}}>{status.message}</span>
        </div>
        <div className="grid grid-2" style={{gap:12}}>
          <div className="field"><label>Google OAuth Client ID</label><input className="input" value={clientId} onChange={e=>setClientId(e.target.value)} placeholder="123456789-abc.apps.googleusercontent.com"/><div className="hint">Public client ID saja — jangan masukkan client secret.</div></div>
          <div className="field"><label>Spreadsheet ID (otomatis setelah dibuat)</label><input className="input" value={spreadsheetId} onChange={e=>setSpreadsheetId(e.target.value)} placeholder="Dibuat dari tombol di bawah" /></div>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:14}}>
          <button className="btn btn-sec" disabled={busy} onClick={saveSettings}><Icon name="check" size={14}/> Simpan Pengaturan</button>
          <button className="btn btn-primary" disabled={busy || !clientId.trim()} onClick={()=>run(async()=>{ if (!saveSettings()) throw new Error("Periksa OAuth Client ID terlebih dahulu."); await S.connect(); })}> <Icon name="user" size={14}/> Hubungkan Google</button>
          <button className="btn btn-sec" disabled={busy || !clientId.trim()} onClick={()=>run(async()=>{ if (!saveSettings()) throw new Error("Periksa OAuth Client ID terlebih dahulu."); if (!S.isConnected()) await S.authorize(); const created=await S.createSpreadsheet(); setSpreadsheetId(created.spreadsheetId); setSpreadsheetUrl(created.spreadsheetUrl || ""); })}><Icon name="plus" size={14}/> Buat Spreadsheet di Drive</button>
        </div>
        {spreadsheetUrl && <p style={{fontSize:13,marginTop:12}}><a href={spreadsheetUrl} target="_blank" rel="noreferrer">Buka database STM di Google Sheets ↗</a></p>}
      </div>
      <div className="card card-pad">
        <h3 style={{marginTop:0}}>Sinkronisasi data</h3>
        <p className="muted" style={{fontSize:13,lineHeight:1.65}}>Pilih sumber data awal dengan sengaja. “Muat dari Google Sheets” mengganti data browser ini dengan data cloud. “Upload data perangkat ini” mengganti isi spreadsheet dengan data browser ini. Setelah pilihan pertama berhasil, perubahan berikutnya otomatis disinkronkan saat tersambung.</p>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <button className="btn btn-primary" disabled={busy || !spreadsheetId || !clientId} onClick={()=>run(async()=>{ if (!saveSettings()) throw new Error("Periksa OAuth Client ID terlebih dahulu."); await S.loadAll(); })}><Icon name="download" size={14}/> Muat dari Google Sheets</button>
          <button className="btn btn-sec" disabled={busy || !spreadsheetId || !clientId} onClick={()=>run(async()=>{ if (!saveSettings()) throw new Error("Periksa OAuth Client ID terlebih dahulu."); await S.uploadLocal(); })}><Icon name="file_excel" size={14}/> Upload data perangkat ini</button>
        </div>
        {error && <div className="badge badge-red" style={{marginTop:12,whiteSpace:"normal"}}>{error}</div>}
        <div style={{fontSize:12,color:"var(--muted)",marginTop:14,lineHeight:1.7}}>Catatan keamanan: akses memakai Google OAuth dan scope <code>drive.file</code> agar aplikasi hanya mendapat akses ke file Drive yang dibuat/dibuka lewat aplikasi ini. Access token tidak disimpan permanen di browser. Tetap ekspor CSV sebagai cadangan.</div>
      </div>
      <div className="card card-pad">
        <h3 style={{marginTop:0}}>Automatic family sync (tanpa Google login di setiap HP)</h3>
        <p className="muted" style={{fontSize:13,lineHeight:1.65}}>Gunakan backend Google Apps Script agar keluarga dapat membaca dan menyimpan data ke spreadsheet bersama tanpa memasukkan OAuth Client ID atau login Google pada tiap perangkat. Siapkan deployment Apps Script terlebih dahulu sesuai panduan setup.</p>
        <div className="grid grid-2" style={{gap:12}}>
          <div className="field"><label>Apps Script Web App URL (/exec)</label><input className="input" value={gasUrl} onChange={e=>setGasUrl(e.target.value)} placeholder="https://script.google.com/macros/s/.../exec" autoComplete="url"/><div className="hint">Gunakan URL deployment dari Apps Script, bukan URL editor.</div></div>
          <div className="field"><label>Kode akses keluarga</label><input className="input" type="password" value={gasPin} onChange={e=>setGasPin(e.target.value)} placeholder="Masukkan passphrase keluarga" autoComplete="current-password"/><div className="hint">Disimpan pada browser perangkat ini agar sinkronisasi otomatis. Jangan gunakan PIN pendek.</div></div>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:14}}>
          <button className="btn btn-sec" disabled={busy} onClick={()=>run(async()=>{ if(!gasUrl.trim() || gasPin.length < 12) throw new Error("Masukkan URL Apps Script dan passphrase minimal 12 karakter (disarankan 20+)."); const u=new URL(gasUrl.trim()); if(u.protocol!=="https:" || u.hostname!=="script.google.com" || !u.pathname.includes("/macros/s/") || !u.pathname.endsWith("/exec")) throw new Error("URL harus berupa URL deployment Apps Script yang berakhir dengan /exec."); S.writeConfig({gasUrl:u.href,gasPin}); setGasUrl(u.href); await S.gasTest(); })}><Icon name="check" size={14}/> Test connection</button>
          <button className="btn btn-primary" disabled={busy || !gasUrl.trim() || !gasPin} onClick={()=>run(async()=>{ S.writeConfig({gasUrl:gasUrl.trim(),gasPin}); await S.gasLoadAll(); })}><Icon name="download" size={14}/> Load cloud data</button>
          <button className="btn btn-sec" disabled={busy || !gasUrl.trim() || !gasPin} onClick={()=>run(async()=>{ if(!window.confirm("Upload akan mengganti seluruh data pada lima tab Google Sheets dengan data perangkat ini. Pastikan perangkat ini berisi data yang benar dan sudah ada backup. Lanjutkan?")) return; S.writeConfig({gasUrl:gasUrl.trim(),gasPin}); await S.gasUploadLocal(); })}><Icon name="file_excel" size={14}/> Upload this device</button>
        </div>
        <div style={{fontSize:12,color:"var(--muted)",marginTop:14,lineHeight:1.7}}>Peringatan: siapa pun yang memiliki URL deployment dan passphrase dapat membaca/mengubah data. Bagikan passphrase hanya kepada keluarga yang dipercaya. Sinkronisasi otomatis memakai strategi last-write-wins; hindari mengedit dari dua perangkat pada saat yang sama. Ekspor CSV sebagai backup.</div>
        <p style={{fontSize:13,marginTop:10}}><a href="https://github.com/thomshaan/stm-dos-ni-roha/blob/main/APPS-SCRIPT-FAMILY-SYNC.md" target="_blank" rel="noreferrer">Buka panduan setup Apps Script ↗</a></p>
      </div>
    </div>
  );
}
