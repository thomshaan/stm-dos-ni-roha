// Input setoran (functional form), Rekap bulanan, Rekap tahunan (savings-only)
const { Icon, Avatar, BarChart, useToast, Pager } = window;

function InputPembayaran({ presetKeluarga, currency, onSaved, initialDirection = "setoran" }) {
  const S = window.STM;
  const toast = useToast();
  const today = new Date().toISOString().slice(0,10);
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  const [form, setForm] = React.useState({
    id_keluarga: presetKeluarga?.id_keluarga || "",
    id_jenis: 1,
    jenis_transaksi: initialDirection,
    bulan: currentMonth,
    tahun: currentYear,
    nominal: 25000,
    tanggal_bayar: today,
    metode_pembayaran: "Tunai",
    keterangan: "",
  });
  const [historyLimit, setHistoryLimit] = React.useState(10);
  const [entryMode, setEntryMode] = React.useState("single");
  const [bulkFamilies, setBulkFamilies] = React.useState([]);
  const [bulkType, setBulkType] = React.useState(1);
  const [bulkDirection, setBulkDirection] = React.useState(initialDirection);
  const [bulkDate, setBulkDate] = React.useState(today);
  const [bulkMonth, setBulkMonth] = React.useState(currentMonth);
  const [bulkYear, setBulkYear] = React.useState(currentYear);
  const [bulkMethod, setBulkMethod] = React.useState("Tunai");
  const [bulkNote, setBulkNote] = React.useState("");
  const [bulkAmounts, setBulkAmounts] = React.useState({});
  const [bulkSelectAll, setBulkSelectAll] = React.useState(false);
  const [bulkSearch, setBulkSearch] = React.useState("");
  const [saved, setSaved] = React.useState(() => [...S.PEMBAYARAN].sort((a,b) => b.id_pembayaran - a.id_pembayaran).map(p => ({...p, _kel_name:S.KELUARGA.find(k => k.id_keluarga === p.id_keluarga)?.kepala_keluarga || "Keluarga tidak ditemukan", _jenis_name:S.JENIS_IURAN.find(j => j.id_jenis === p.id_jenis)?.nama_jenis || "Jenis tidak ditemukan"})));

  React.useEffect(() => {
    setForm(f => ({ ...f, jenis_transaksi: initialDirection }));
    setBulkDirection(initialDirection);
  }, [initialDirection]);

  React.useEffect(() => {
    if (presetKeluarga) setForm(f => ({ ...f, id_keluarga: presetKeluarga.id_keluarga }));
  }, [presetKeluarga]);

  const onJenisChange = (id) => {
    const j = S.JENIS_IURAN.find(x => x.id_jenis === Number(id));
    setForm(f => ({ ...f, id_jenis: Number(id), nominal: j?.nominal_default || f.nominal }));
  };

  const submit = (e) => {
    e.preventDefault();
    if (!form.id_keluarga) { toast({ kind:"error", title:"Pilih anggota terlebih dahulu" }); return; }
    if (!Number.isFinite(Number(form.nominal)) || Number(form.nominal) < 1000) { toast({ kind:"error", title:"Nominal tidak valid" }); return; }
    const paidAt = new Date(String(form.tanggal_bayar) + "T00:00:00");
    if (!form.tanggal_bayar || Number.isNaN(paidAt.getTime()) || !Number.isInteger(Number(form.bulan)) || Number(form.bulan) < 1 || Number(form.bulan) > 12 || !Number.isInteger(Number(form.tahun)) || Number(form.tahun) < 2000) { toast({ kind:"error", title:"Tanggal atau periode tidak valid" }); return; }
    const k = S.KELUARGA.find(x => x.id_keluarga === Number(form.id_keluarga));
    const j = S.JENIS_IURAN.find(x => x.id_jenis === Number(form.id_jenis));
    if (!k || k.status !== "aktif") { toast({ kind:"error", title:"Anggota tidak ditemukan atau non-aktif" }); return; }
    if (!j) { toast({ kind:"error", title:"Jenis tabungan tidak valid" }); return; }
    if (form.jenis_transaksi === "penarikan") {
      const saldoJenis = S.PEMBAYARAN.filter(p => Number(p.id_keluarga) === Number(form.id_keluarga) && Number(p.id_jenis) === Number(form.id_jenis)).reduce((sum,p) => sum + Number(p.nominal), 0);
      if (Number(form.nominal) > saldoJenis) { toast({kind:"error",title:"Saldo tidak mencukupi",body:"Saldo tersedia untuk jenis tabungan ini: " + S.formatCurrency(Math.max(0,saldoJenis), currency)}); return; }
    }
    const rec = {
      id_pembayaran: Math.max(0, ...S.PEMBAYARAN.map(p => Number(p.id_pembayaran) || 0)) + 1,
      ...form,
      id_keluarga: Number(form.id_keluarga),
      id_jenis: Number(form.id_jenis),
      bulan: Number(form.bulan),
      tahun: Number(form.tahun),
      jenis_transaksi: form.jenis_transaksi || "setoran",
      nominal: form.jenis_transaksi === "penarikan" ? -Math.abs(Number(form.nominal)) : Math.abs(Number(form.nominal)),
      dicatat_oleh: "Thomas",
      _kel_name: k?.kepala_keluarga,
      _jenis_name: j?.nama_jenis,
    };
    const next = [rec, ...saved];
    window.__sessionPayments = next;
    setSaved(next);
    S.PEMBAYARAN.push({
      id_pembayaran: rec.id_pembayaran,
      id_keluarga: rec.id_keluarga,
      id_jenis: rec.id_jenis,
      bulan: rec.bulan, tahun: rec.tahun, nominal: rec.nominal,
      jenis_transaksi: rec.jenis_transaksi,
      tanggal_bayar: rec.tanggal_bayar, metode_pembayaran: rec.metode_pembayaran,
      keterangan: rec.keterangan, dicatat_oleh: rec.dicatat_oleh,
    });
    S.AKTIVITAS.unshift({ id: Date.now(), waktu: new Date().toISOString().slice(0,16).replace("T"," "), user: rec.dicatat_oleh, aksi: rec.jenis_transaksi === "penarikan" ? "Mencatat penarikan" : "Mencatat setoran", detail: k.kepala_keluarga + " — " + j.nama_jenis + " · " + S.formatCurrency(Math.abs(rec.nominal)), tipe: "payment" });
    S.persistSTM();
    toast({
      kind:"success",
      title: rec.jenis_transaksi === "penarikan" ? "Penarikan tercatat" : "Setoran tercatat",
      body:`${k?.kepala_keluarga} — ${j?.nama_jenis} ${S.BULAN_ID_FULL[rec.bulan-1]} ${rec.tahun} · ${S.formatCurrency(Math.abs(rec.nominal), currency)}`,
    });
    setForm(f => ({ ...f, jenis_transaksi: initialDirection, nominal: S.JENIS_IURAN.find(x => x.id_jenis === f.id_jenis)?.nominal_default || 25000, keterangan: "", id_keluarga: "" }));
    onSaved && onSaved(rec);
  };

  const activeFamilies = S.KELUARGA.filter(k => k.status === "aktif").slice().sort((a,b) => String(a.kepala_keluarga).localeCompare(String(b.kepala_keluarga)));
  const bulkDefaultAmount = Number(S.JENIS_IURAN.find(j => j.id_jenis === Number(bulkType))?.nominal_default || 0);
  const toggleBulkFamily = (id) => {
    setBulkFamilies(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    setBulkAmounts(prev => ({...prev, [id]: prev[id] ?? bulkDefaultAmount}));
  };
  const submitBulk = (e) => {
    e.preventDefault();
    if (!bulkFamilies.length) { toast({kind:"error",title:"Pilih minimal satu keluarga"}); return; }
    if (!bulkDate || Number.isNaN(new Date(bulkDate + "T00:00:00").getTime()) || !Number.isInteger(Number(bulkMonth)) || Number(bulkMonth)<1 || Number(bulkMonth)>12 || !Number.isInteger(Number(bulkYear)) || Number(bulkYear)<2000) {
      toast({kind:"error",title:"Tanggal atau periode tidak valid"}); return;
    }
    const j = S.JENIS_IURAN.find(x => x.id_jenis === Number(bulkType));
    if (!j) { toast({kind:"error",title:"Jenis tabungan tidak valid"}); return; }
    const selected = bulkFamilies.map(id => S.KELUARGA.find(k => Number(k.id_keluarga) === Number(id))).filter(k => k && k.status === "aktif");
    if (selected.length !== bulkFamilies.length) { toast({kind:"error",title:"Ada anggota yang tidak aktif atau tidak ditemukan"}); return; }
    const invalid = selected.find(k => !Number.isFinite(Number(bulkAmounts[k.id_keluarga] ?? bulkDefaultAmount)) || Number(bulkAmounts[k.id_keluarga] ?? bulkDefaultAmount) < 1000);
    if (invalid) { toast({kind:"error",title:"Nominal tidak valid",body:"Periksa nominal untuk " + invalid.kepala_keluarga}); return; }
    if (bulkDirection === "penarikan") {
      const insufficient = selected.find(k => {
        const saldoJenis = S.PEMBAYARAN.filter(p => Number(p.id_keluarga) === Number(k.id_keluarga) && Number(p.id_jenis) === Number(bulkType)).reduce((sum,p) => sum + Number(p.nominal), 0);
        return Number(bulkAmounts[k.id_keluarga] ?? bulkDefaultAmount) > saldoJenis;
      });
      if (insufficient) {
        const saldoJenis = S.PEMBAYARAN.filter(p => Number(p.id_keluarga) === Number(insufficient.id_keluarga) && Number(p.id_jenis) === Number(bulkType)).reduce((sum,p) => sum + Number(p.nominal), 0);
        toast({kind:"error",title:"Saldo tidak mencukupi",body:insufficient.kepala_keluarga + " hanya memiliki " + S.formatCurrency(Math.max(0,saldoJenis), currency) + " untuk jenis tabungan ini."}); return;
      }
    }
    let nextId = Math.max(0, ...S.PEMBAYARAN.map(p => Number(p.id_pembayaran)||0)) + 1;
    const created = selected.map(k => ({
      id_pembayaran: nextId++,
      id_keluarga: Number(k.id_keluarga),
      id_jenis: Number(bulkType),
      jenis_transaksi: bulkDirection,
      bulan: Number(bulkMonth),
      tahun: Number(bulkYear),
      nominal: bulkDirection === "penarikan" ? -Math.abs(Number(bulkAmounts[k.id_keluarga] ?? bulkDefaultAmount)) : Math.abs(Number(bulkAmounts[k.id_keluarga] ?? bulkDefaultAmount)),
      tanggal_bayar: bulkDate,
      metode_pembayaran: bulkMethod,
      keterangan: bulkNote.trim(),
      dicatat_oleh: "Thomas",
      _kel_name: k.kepala_keluarga,
      _jenis_name: j.nama_jenis,
    }));
    S.PEMBAYARAN.push(...created.map(({_kel_name,_jenis_name,...p}) => p));
    S.AKTIVITAS.unshift({id:Date.now(),waktu:new Date().toISOString().slice(0,16).replace("T"," "),user:"Thomas",aksi:bulkDirection === "penarikan" ? "Mencatat penarikan massal" : "Mencatat setoran massal",detail:created.length+" keluarga · "+j.nama_jenis+" · "+bulkDate,tipe:"payment"});
    S.persistSTM();
    const next = [...created, ...saved];
    window.__sessionPayments = next;
    setSaved(next);
    toast({kind:"success",title:bulkDirection === "penarikan" ? "Penarikan massal tersimpan" : "Setoran massal tersimpan",body:created.length+" transaksi berhasil dicatat."});
    setBulkFamilies([]);
    setBulkAmounts({});
    setBulkNote("");
    setBulkSelectAll(false);
    onSaved && onSaved(created[0]);
  };

  const fmt = (v) => S.formatCurrency(v, currency);

  return (
    <div>
      <div className="card mb-16">
        <div className="card-hd">
          <div><h3>Mode Pencatatan</h3><div className="muted" style={{fontSize:12}}>Catat satu transaksi atau beberapa keluarga sekaligus dengan tanggal yang sama.</div></div>
          <div className="seg">
            <button type="button" data-active={entryMode === "single" ? "1" : "0"} onClick={() => setEntryMode("single")}>Satu transaksi</button>
            <button type="button" data-active={entryMode === "bulk" ? "1" : "0"} onClick={() => setEntryMode("bulk")}>Massal</button>
          </div>
        </div>
        {entryMode === "bulk" && <form className="card-pad" onSubmit={submitBulk} style={{display:"grid",gap:14}}>
          <div className="grid grid-4">
            <div className="field"><label>Jenis Transaksi</label><select className="select" value={bulkDirection} onChange={e=>setBulkDirection(e.target.value)}><option value="setoran">Setoran (uang masuk)</option><option value="penarikan">Penarikan (ambil uang kembali)</option></select></div>
            <div className="field"><label>Jenis Tabungan</label><select className="select" value={bulkType} onChange={e => {const id=Number(e.target.value);const def=Number(S.JENIS_IURAN.find(j=>j.id_jenis===id)?.nominal_default||0);setBulkType(id);setBulkAmounts(prev=>Object.fromEntries(Object.entries(prev).map(([k,v])=>[k,v===Number(S.JENIS_IURAN.find(j=>j.id_jenis===Number(bulkType))?.nominal_default||0)?def:v])));}}>{S.JENIS_IURAN.map(j=><option key={j.id_jenis} value={j.id_jenis}>{j.nama_jenis}</option>)}</select></div>
            <div className="field"><label>{bulkDirection === "penarikan" ? "Tanggal Penarikan" : "Tanggal Setor"}</label><input className="input" type="date" value={bulkDate} onChange={e=>setBulkDate(e.target.value)} required /></div>
            <div className="field"><label>{bulkDirection === "penarikan" ? "Metode Penarikan" : "Metode Setor"}</label><select className="select" value={bulkMethod} onChange={e=>setBulkMethod(e.target.value)}>{S.METODE.map(m=><option key={m} value={m}>{m}</option>)}</select></div>
          </div>
          <div className="grid grid-3">
            <div className="field"><label>Bulan Periode</label><select className="select" value={bulkMonth} onChange={e=>setBulkMonth(Number(e.target.value))}>{S.BULAN_ID_FULL.map((b,i)=><option key={i} value={i+1}>{b}</option>)}</select></div>
            <div className="field"><label>Tahun</label><select className="select" value={bulkYear} onChange={e=>setBulkYear(Number(e.target.value))}>{Array.from({length:5},(_,i)=>currentYear-2+i).map(y=><option key={y} value={y}>{y}</option>)}</select></div>
            <div className="field"><label>Keterangan <span className="muted" style={{fontWeight:400}}>(opsional, untuk semua)</span></label><input className="input" value={bulkNote} onChange={e=>setBulkNote(e.target.value)} placeholder={bulkDirection === "penarikan" ? "cth. pengambilan sebagian saldo" : "cth. setoran melalui koordinator"}/></div>
          </div>
          <div className="field">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap",marginBottom:8}}>
              <label style={{margin:0}}>Pilih keluarga ({bulkFamilies.length} dipilih)</label>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <input className="input" style={{width:180}} placeholder="Cari nama / no. anggota" value={bulkSearch} onChange={e=>setBulkSearch(e.target.value)}/>
                <button type="button" className="btn btn-sec btn-sm" onClick={()=>{const visible=activeFamilies.filter(k=>(k.kepala_keluarga+" "+k.no_anggota).toLowerCase().includes(bulkSearch.toLowerCase()));const all=visible.every(k=>bulkFamilies.includes(k.id_keluarga));setBulkFamilies(prev=>all?prev.filter(id=>!visible.some(k=>k.id_keluarga===id)):[...new Set([...prev,...visible.map(k=>k.id_keluarga)])]);setBulkAmounts(prev=>{const n={...prev};visible.forEach(k=>{if(n[k.id_keluarga]===undefined)n[k.id_keluarga]=bulkDefaultAmount;});return n;});}}>Pilih hasil pencarian</button>
              </div>
            </div>
            <div style={{maxHeight:260,overflowY:"auto",border:"1px solid var(--line)",borderRadius:10}}>
              {activeFamilies.filter(k=>(k.kepala_keluarga+" "+k.no_anggota).toLowerCase().includes(bulkSearch.toLowerCase())).map(k=><div key={k.id_keluarga} style={{display:"grid",gridTemplateColumns:"minmax(180px,1fr) 150px",alignItems:"center",gap:12,padding:"9px 12px",borderBottom:"1px solid var(--line-2)"}}>
                <label style={{display:"flex",alignItems:"center",gap:8,fontSize:13}}><input type="checkbox" checked={bulkFamilies.includes(k.id_keluarga)} onChange={()=>toggleBulkFamily(k.id_keluarga)}/><span><b>{k.kepala_keluarga}</b><span className="muted" style={{display:"block",fontSize:11}}>{k.no_anggota}</span></span></label>
                <div className="input-wrap"><span className="input-prefix">Rp</span><input className="input" aria-label={"Nominal "+k.kepala_keluarga} type="number" min="1000" step="500" value={bulkAmounts[k.id_keluarga] ?? bulkDefaultAmount} onChange={e=>setBulkAmounts(prev=>({...prev,[k.id_keluarga]:Number(e.target.value)||0}))}/></div>
              </div>)}
              {activeFamilies.filter(k=>(k.kepala_keluarga+" "+k.no_anggota).toLowerCase().includes(bulkSearch.toLowerCase())).length===0 && <div className="empty-state">Tidak ada keluarga yang cocok.</div>}
            </div>
            <div className="hint">Nominal setiap keluarga bisa diubah satu per satu. Jenis, tanggal, periode, metode, dan keterangan berlaku untuk semua transaksi yang dipilih.</div>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"}}>
            <b>Total {bulkDirection === "penarikan" ? "penarikan" : "setoran"} · {bulkFamilies.length} transaksi · {fmt(bulkFamilies.reduce((sum,id)=>sum+Number(bulkAmounts[id] ?? bulkDefaultAmount),0))}</b>
            <button type="submit" className="btn btn-primary" disabled={!bulkFamilies.length}><Icon name="check" size={14}/> Simpan {bulkFamilies.length} {bulkDirection === "penarikan" ? "penarikan" : "setoran"}</button>
          </div>
        </form>}
      </div>
      {entryMode === "single" && <div className="grid" style={{gridTemplateColumns:"1.3fr 1fr",gap:20,alignItems:"flex-start"}}>
      <div className="card">
        <div className="card-hd">
          <div>
            <h3>{form.jenis_transaksi === "penarikan" ? "Catat Penarikan" : "Catat Setoran Baru"}</h3>
            <div className="muted" style={{fontSize:12}}>Form dicatat atas nama: <b style={{color:"var(--ink-2)"}}>Thomas (admin)</b></div>
          </div>
        </div>
        <form className="card-pad" onSubmit={submit} style={{display:"grid",gap:14}}>
          <div className="field">
            <label>Anggota</label>
            <select className="select" value={form.id_keluarga}
                    onChange={e => setForm(f => ({...f, id_keluarga: e.target.value}))}>
              <option value="">— Pilih anggota —</option>
              {S.KELUARGA.filter(k => k.status === "aktif").map(k => (
                <option key={k.id_keluarga} value={k.id_keluarga}>
                  {k.no_anggota} · {k.kepala_keluarga}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-3">
            <div className="field">
              <label>Jenis Transaksi</label>
              <select className="select" value={form.jenis_transaksi} onChange={e => setForm(f => ({...f, jenis_transaksi:e.target.value}))}>
                <option value="setoran">Setoran (uang masuk)</option>
                <option value="penarikan">Penarikan (ambil uang kembali)</option>
              </select>
            </div>
            <div className="field">
              <label>Jenis Tabungan</label>
              <select className="select" value={form.id_jenis}
                      onChange={e => onJenisChange(e.target.value)}>
                {S.JENIS_IURAN.map(j => (
                  <option key={j.id_jenis} value={j.id_jenis}>{j.nama_jenis}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Nominal {form.jenis_transaksi === "penarikan" ? "yang Diambil" : "Setoran"}</label>
              <div className="input-wrap">
                <span className="input-prefix">{currency === "idr" ? "IDR" : "Rp"}</span>
                <input className="input" type="number" data-prefix="1" min="1000" step="500"
                       value={form.nominal}
                       onChange={e => setForm(f => ({...f, nominal: Number(e.target.value) || 0}))}/>
              </div>
              <div className="hint">Default: {fmt(S.JENIS_IURAN.find(j => j.id_jenis === Number(form.id_jenis))?.nominal_default || 0)}</div>
            </div>
          </div>

          <div className="grid grid-3">
            <div className="field">
              <label>Bulan Periode</label>
              <select className="select" value={form.bulan}
                      onChange={e => setForm(f => ({...f, bulan: Number(e.target.value)}))}>
                {S.BULAN_ID_FULL.map((b,i) => <option key={i} value={i+1}>{b}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Tahun</label>
              <select className="select" value={form.tahun}
                      onChange={e => setForm(f => ({...f, tahun: Number(e.target.value)}))}>
                {Array.from({length:5}, (_,i) => currentYear - 2 + i).map(y => <option key={y}>{y}</option>)}
              </select>
            </div>
            <div className="field">
              <label>{form.jenis_transaksi === "penarikan" ? "Tanggal Penarikan" : "Tanggal Setor"}</label>
              <input className="input" type="date" value={form.tanggal_bayar}
                     onChange={e => setForm(f => ({...f, tanggal_bayar: e.target.value}))}/>
            </div>
          </div>

          <div className="grid grid-2">
            <div className="field">
              <label>{form.jenis_transaksi === "penarikan" ? "Metode Penarikan" : "Metode Setor"}</label>
              <div className="seg" style={{width:"100%"}}>
                {S.METODE.map(m => (
                  <button key={m} type="button" style={{flex:1}}
                          data-active={form.metode_pembayaran === m ? "1" : "0"}
                          onClick={() => setForm(f => ({...f, metode_pembayaran: m}))}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div className="field">
              <label>Keterangan <span className="muted" style={{fontWeight:400}}>(opsional)</span></label>
              <input className="input" type="text" placeholder="cth. lewat koordinator"
                     value={form.keterangan}
                     onChange={e => setForm(f => ({...f, keterangan: e.target.value}))}/>
            </div>
          </div>

          <div className="flex gap-12" style={{justifyContent:"flex-end",marginTop:6}}>
            <button type="button" className="btn btn-ghost" onClick={() => setForm({
              id_keluarga: "", id_jenis: 1, jenis_transaksi: initialDirection, bulan: currentMonth, tahun: currentYear, nominal: 25000,
              tanggal_bayar: today, metode_pembayaran: "Tunai", keterangan: "",
            })}>Reset</button>
            <button type="submit" className="btn btn-primary">
              <Icon name="check" size={14}/> {form.jenis_transaksi === "penarikan" ? "Simpan Penarikan" : "Simpan Setoran"}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="card-hd">
          <div>
            <h3>Riwayat Transaksi</h3>
            <div className="muted" style={{fontSize:12}}>Semua transaksi tersimpan di browser ini</div>
          </div>
          <div className="card-hd-actions" style={{display:"flex",alignItems:"center",gap:10}}>
            <label htmlFor="transaction-history-limit" className="muted" style={{fontSize:12,whiteSpace:"nowrap"}}>Tampilkan</label>
            <select id="transaction-history-limit" className="select" value={historyLimit} onChange={e => setHistoryLimit(Number(e.target.value))} style={{width:88,padding:"7px 28px 7px 10px"}}>
              <option value={10}>10</option>
              <option value={30}>30</option>
              <option value={50}>50</option>
            </select>
            <span className="badge badge-accent tab-num">{Math.min(saved.length, historyLimit)} / {saved.length} entri</span>
          </div>
        </div>
        {saved.length === 0 ? (
          <div className="empty-state">
            <Icon name="receipt" size={36}/>
            <div>Belum ada transaksi tersimpan.</div>
            <div style={{fontSize:12,marginTop:4}}>Form di sebelah kiri akan menambahkan entri di sini.</div>
          </div>
        ) : (
          <div style={{maxHeight:520,overflowY:"auto"}}>
            {saved.slice(0, historyLimit).map(s => (
              <div key={s.id_pembayaran} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 18px",borderBottom:"1px solid var(--line-2)"}}>
                <Avatar name={s._kel_name} size="sm"/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:600,color:"var(--ink)"}}>{s._kel_name}</div>
                  <div style={{fontSize:11.5,color:"var(--muted)"}}>{s._jenis_name} · {S.BULAN_ID[s.bulan-1]} {s.tahun} · {s.metode_pembayaran}</div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div className="tab-num" style={{fontSize:13,fontWeight:700,color:s.nominal < 0 ? "var(--danger)" : "var(--success)"}}>{s.nominal < 0 ? "−" : "+"}{fmt(Math.abs(s.nominal))}<div className="muted" style={{fontSize:10,textAlign:"right"}}>{s.nominal < 0 ? "Penarikan" : "Setoran"}</div></div>
                  <button type="button" className="btn btn-sec btn-sm" title="Edit transaksi" onClick={() => {
                    const amountText = window.prompt("Nominal transaksi (angka, tanpa tanda minus)", String(Math.abs(s.nominal)));
                    if (amountText === null) return;
                    const amount = Number(amountText);
                    if (!Number.isFinite(amount) || amount < 1000) { toast({kind:"error",title:"Nominal tidak valid"}); return; }
                    const date = window.prompt("Tanggal bayar (YYYY-MM-DD)", s.tanggal_bayar);
                    if (date === null) return;
                    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(new Date(date+"T00:00:00").getTime())) { toast({kind:"error",title:"Tanggal tidak valid"}); return; }
                    const note = window.prompt("Keterangan", s.keterangan || "");
                    if (note === null) return;
                    const target = S.PEMBAYARAN.find(p => p.id_pembayaran === s.id_pembayaran);
                    if (!target) { toast({kind:"error",title:"Transaksi tidak ditemukan"}); return; }
                    const before = target.nominal;
                    target.nominal = before < 0 || s.jenis_transaksi === "penarikan" ? -Math.abs(amount) : Math.abs(amount);
                    target.jenis_transaksi = target.nominal < 0 ? "penarikan" : "setoran";
                    target.tanggal_bayar = date;
                    target.bulan = Number(date.slice(5,7));
                    target.tahun = Number(date.slice(0,4));
                    target.keterangan = note.trim();
                    S.AKTIVITAS.unshift({id:Date.now(),waktu:new Date().toISOString().slice(0,16).replace("T"," "),user:"Thomas",aksi:"Mengubah transaksi",detail:"ID "+s.id_pembayaran+" · "+S.formatCurrency(before)+" -> "+S.formatCurrency(target.nominal),tipe:"update"});
                    S.persistSTM();
                    const next = [...S.PEMBAYARAN].sort((a,b) => b.id_pembayaran - a.id_pembayaran).map(p => ({...p,_kel_name:S.KELUARGA.find(k => k.id_keluarga === p.id_keluarga)?.kepala_keluarga || "Keluarga tidak ditemukan",_jenis_name:S.JENIS_IURAN.find(j => j.id_jenis === p.id_jenis)?.nama_jenis || "Jenis tidak ditemukan"}));
                    window.__sessionPayments = next;
                    setSaved(next);
                    toast({kind:"success",title:"Transaksi diperbarui",body:"Perubahan tersimpan di browser ini."});
                  }}><Icon name="edit" size={12}/> Edit</button>
                  <button type="button" className="btn btn-ghost btn-sm" title="Hapus transaksi" onClick={() => {
                    if (!window.confirm(`Hapus ${s.nominal < 0 ? "penarikan" : "setoran"} ${S.formatCurrency(Math.abs(s.nominal))} dari ${s._kel_name} pada ${s.tanggal_bayar}? Tindakan ini tidak dapat dibatalkan.`)) return;
                    const index = S.PEMBAYARAN.findIndex(x => x.id_pembayaran === s.id_pembayaran);
                    if (index < 0) { toast({kind:"error",title:"Transaksi tidak ditemukan"}); return; }
                    const [removed] = S.PEMBAYARAN.splice(index, 1);
                    S.AKTIVITAS.unshift({id:Date.now(),waktu:new Date().toISOString().slice(0,16).replace("T"," "),user:"Thomas",aksi:"Menghapus transaksi",detail:"ID "+removed.id_pembayaran+" · "+S.formatCurrency(removed.nominal),tipe:"warn"});
                    S.persistSTM();
                    const next = [...S.PEMBAYARAN].sort((a,b) => b.id_pembayaran - a.id_pembayaran).map(item => ({...item,_kel_name:S.KELUARGA.find(k => k.id_keluarga === item.id_keluarga)?.kepala_keluarga || "Keluarga tidak ditemukan",_jenis_name:S.JENIS_IURAN.find(j => j.id_jenis === item.id_jenis)?.nama_jenis || "Jenis tidak ditemukan"}));
                    window.__sessionPayments = next;
                    setSaved(next);
                    toast({kind:"success",title:"Transaksi dihapus",body:"Data tersimpan di browser ini."});
                  }}><Icon name="trash" size={12}/> Hapus</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>}
    </div>
  );
}

// ── Rekap Bulanan ─────────────────────────────────────────────────────────
function RekapBulanan({ currency }) {
  const S = window.STM;
  const [bulan, setBulan] = React.useState(new Date().getMonth()+1);
  const [tahun, setTahun] = React.useState(new Date().getFullYear());
  const fmt = (v) => S.formatCurrency(v, currency);
  const fmtC = (v) => S.formatCurrencyCompact(v, currency);

  const pays = S.pembayaranBulan(bulan, tahun);
  const total = pays.reduce((s,p) => s + p.nominal, 0);
  const perJenis = {};
  for (const j of S.JENIS_IURAN) perJenis[j.id_jenis] = 0;
  for (const p of pays) perJenis[p.id_jenis] += p.nominal;

  // hanya tampilkan keluarga yang setor di bulan ini
  const map = new Map();
  for (const p of pays) {
    if (!map.has(p.id_keluarga)) map.set(p.id_keluarga, { perJenis: {}, total: 0, count: 0 });
    const row = map.get(p.id_keluarga);
    row.perJenis[p.id_jenis] = (row.perJenis[p.id_jenis] || 0) + p.nominal;
    row.total += p.nominal;
    row.count += 1;
  }
  const rows = Array.from(map.entries()).map(([id, r]) => ({
    k: S.KELUARGA.find(x => x.id_keluarga === id),
    ...r,
  })).sort((a,b) => b.total - a.total);

  return (
    <div className="grid" style={{gap:16}}>
      <div className="card">
        <div className="card-hd" style={{flexWrap:"wrap"}}>
          <div>
            <h3 className="report-title">Rekap Transaksi {S.BULAN_ID_FULL[bulan-1]} {tahun}</h3>
            <div className="muted" style={{fontSize:12}}>Setoran dikurangi penarikan pada periode terpilih</div>
          </div>
          <div className="card-hd-actions" style={{gap:8,flexWrap:"wrap"}}>
            <select className="select" style={{width:130}} value={bulan} onChange={e => setBulan(Number(e.target.value))}>
              {S.BULAN_ID_FULL.map((b,i) => <option key={i} value={i+1}>{b}</option>)}
            </select>
            <select className="select" style={{width:100}} value={tahun} onChange={e => setTahun(Number(e.target.value))}>
              {Array.from({length: Math.max(3, new Date().getFullYear() - 2022)}, (_, i) => new Date().getFullYear() - i).reverse().map(y => <option key={y}>{y}</option>)}
            </select>
            <button className="btn btn-sec btn-sm" onClick={() => { const rows = pays.slice().sort((a,b)=>String(a.tanggal_bayar).localeCompare(String(b.tanggal_bayar))).map(p=>{const k=S.KELUARGA.find(x=>Number(x.id_keluarga)===Number(p.id_keluarga));const j=S.JENIS_IURAN.find(x=>Number(x.id_jenis)===Number(p.id_jenis));return [p.id_pembayaran,p.tanggal_bayar,k?.no_anggota||"",k?.kepala_keluarga||"",j?.nama_jenis||"",p.nominal<0?"Penarikan":"Setoran",S.BULAN_ID_FULL[p.bulan-1],p.tahun,p.metode_pembayaran,p.nominal,p.keterangan||""];});S.downloadCSVRows("Rekap-Bulanan-"+S.BULAN_ID[bulan-1]+"-"+tahun+".csv",["ID Transaksi","Tanggal","No Anggota","Keluarga","Jenis Tabungan","Jenis Transaksi","Periode Bulan","Tahun","Metode","Nominal Bersih","Keterangan"],rows); }}><Icon name="file_excel" size={14}/> Excel / CSV</button>
            <button className="btn btn-dark btn-sm" onClick={() => window.print()}><Icon name="file_pdf" size={14}/> PDF / Print</button>
          </div>
        </div>

        <div className="card-pad" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,borderBottom:"1px solid var(--line)"}}>
          <div>
            <div className="stat-lbl">Saldo Bersih</div>
            <div className="stat-val tab-num" style={{fontSize:22}}>{fmtC(total)}</div>
          </div>
          <div>
            <div className="stat-lbl">Transaksi</div>
            <div className="stat-val tab-num" style={{fontSize:22}}>{pays.length}</div>
          </div>
          <div>
            <div className="stat-lbl">Anggota Bertransaksi</div>
            <div className="stat-val tab-num" style={{fontSize:22}}>{rows.length}</div>
          </div>
          <div>
            <div className="stat-lbl">Rata-rata / Anggota</div>
            <div className="stat-val tab-num" style={{fontSize:22}}>{fmtC(rows.length === 0 ? 0 : total / rows.length)}</div>
          </div>
        </div>

        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th style={{width:42}}>#</th>
                <th>Kepala Keluarga</th>
                {S.JENIS_IURAN.map(j => <th key={j.id_jenis} style={{textAlign:"right"}}>{j.nama_jenis}</th>)}
                <th style={{textAlign:"right"}}>Transaksi</th>
                <th style={{textAlign:"right"}}>Saldo Bersih</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={4 + S.JENIS_IURAN.length}><div className="empty-state">
                  <Icon name="receipt" size={28}/>
                  <div>Belum ada transaksi pada periode ini.</div>
                </div></td></tr>
              )}
              {rows.map((r,i) => (
                <tr key={r.k.id_keluarga}>
                  <td className="tab-num" style={{color:"var(--muted)"}}>{i+1}</td>
                  <td>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <Avatar name={r.k.kepala_keluarga} size="sm"/>
                      <div>
                        <div style={{fontWeight:600,color:"var(--ink)"}}>{r.k.kepala_keluarga}</div>
                        <div className="tab-num" style={{fontSize:11,color:"var(--muted)"}}>{r.k.no_anggota}</div>
                      </div>
                    </div>
                  </td>
                  {S.JENIS_IURAN.map(j => (
                    <td key={j.id_jenis} className="tbl-num" style={{color: (r.perJenis[j.id_jenis] || 0) === 0 ? "var(--muted)" : "var(--ink)"}}>
                      {(r.perJenis[j.id_jenis] || 0) === 0 ? "—" : fmt(r.perJenis[j.id_jenis])}
                    </td>
                  ))}
                  <td className="tbl-num">{r.count}×</td>
                  <td className="tbl-num"><b>{fmt(r.total)}</b></td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{background:"var(--surface-2)",fontWeight:700}}>
                <td colSpan={2} style={{padding:"12px 16px"}}>Total Kolom</td>
                {S.JENIS_IURAN.map(j => (
                  <td key={j.id_jenis} className="tbl-num" style={{padding:"12px 16px",borderTop:"2px solid var(--ink-2)"}}>{fmt(perJenis[j.id_jenis])}</td>
                ))}
                <td className="tbl-num" style={{padding:"12px 16px",borderTop:"2px solid var(--ink-2)"}}>{pays.length}</td>
                <td className="tbl-num" style={{padding:"12px 16px",borderTop:"2px solid var(--ink-2)"}}>{fmt(total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Rekap Tahunan ─────────────────────────────────────────────────────────
function RekapTahunan({ currency }) {
  const S = window.STM;
  const [tahun, setTahun] = React.useState(new Date().getFullYear());
  const fmt = (v) => S.formatCurrency(v, currency);
  const fmtC = (v) => S.formatCurrencyCompact(v, currency);

  const perBulan = S.pemasukanBulanan(tahun);
  const total = perBulan.reduce((a,b) => a + b, 0);
  const perJenis = S.pemasukanPerJenis(tahun);
  const allYears = S.pemasukanPerTahun();

  // running balance untuk line chart
  const running = (() => {
    let acc = 0;
    return perBulan.map(v => { acc += v; return acc; });
  })();

  return (
    <div className="grid" style={{gap:16}}>
      <div className="card">
        <div className="card-hd">
          <div>
            <h3 className="report-title">Rekap Tahunan {tahun}</h3>
            <div className="muted" style={{fontSize:12}}>Perubahan saldo bersih bulanan & breakdown jenis tabungan</div>
          </div>
          <div className="card-hd-actions">
            <select className="select" style={{width:100}} value={tahun} onChange={e => setTahun(Number(e.target.value))}>
              {Array.from({length:Math.max(5,new Date().getFullYear()-2022)},(_,i)=>new Date().getFullYear()-2+i).reverse().map(y=><option key={y} value={y}>{y}</option>)}
            </select>
            <button className="btn btn-sec btn-sm" onClick={() => { const rows = S.PEMBAYARAN.filter(p=>Number(p.tahun)===Number(tahun)).slice().sort((a,b)=>String(a.tanggal_bayar).localeCompare(String(b.tanggal_bayar))).map(p=>{const k=S.KELUARGA.find(x=>Number(x.id_keluarga)===Number(p.id_keluarga));const j=S.JENIS_IURAN.find(x=>Number(x.id_jenis)===Number(p.id_jenis));return [p.id_pembayaran,p.tanggal_bayar,k?.no_anggota||"",k?.kepala_keluarga||"",j?.nama_jenis||"",p.nominal<0?"Penarikan":"Setoran",S.BULAN_ID_FULL[p.bulan-1],p.tahun,p.metode_pembayaran,p.nominal,p.keterangan||""];});S.downloadCSVRows("Rekap-Tahunan-"+tahun+".csv",["ID Transaksi","Tanggal","No Anggota","Keluarga","Jenis Tabungan","Jenis Transaksi","Periode Bulan","Tahun","Metode","Nominal Bersih","Keterangan"],rows); }}><Icon name="file_excel" size={14}/> Excel / CSV</button>
            <button className="btn btn-dark btn-sm" onClick={() => window.print()}><Icon name="file_pdf" size={14}/> PDF / Print</button>
          </div>
        </div>

        <div className="card-pad" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,borderBottom:"1px solid var(--line)"}}>
          <div>
            <div className="stat-lbl">Total {tahun}</div>
            <div className="stat-val tab-num" style={{fontSize:22}}>{fmtC(total)}</div>
          </div>
          <div>
            <div className="stat-lbl">Rata-rata Bulanan</div>
            <div className="stat-val tab-num" style={{fontSize:22}}>{fmtC(total / Math.max(1, perBulan.filter(v => v > 0).length))}</div>
          </div>
          <div>
            <div className="stat-lbl">Bulan Tertinggi</div>
            <div className="stat-val tab-num" style={{fontSize:22}}>
              {S.BULAN_ID[perBulan.indexOf(Math.max(...perBulan))]}
              <span style={{fontSize:13,color:"var(--muted)",fontWeight:500}}> · {fmtC(Math.max(...perBulan))}</span>
            </div>
          </div>
          <div>
            <div className="stat-lbl">Saldo Akhir Tahun</div>
            <div className="stat-val tab-num" style={{fontSize:22}}>{fmtC(running[running.length-1] || 0)}</div>
          </div>
        </div>

        <div className="chart-wrap">
          <div style={{fontSize:11,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".06em",fontWeight:600,marginBottom:6}}>Perubahan Saldo Bersih per Bulan</div>
          <BarChart data={perBulan} labels={S.BULAN_ID} height={240} formatY={fmtC}/>
        </div>

        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Bulan</th>
                {S.JENIS_IURAN.map(j => <th key={j.id_jenis} style={{textAlign:"right"}}>{j.nama_jenis}</th>)}
                <th style={{textAlign:"right"}}>Total</th>
                <th style={{textAlign:"right"}}>Saldo Berjalan</th>
              </tr>
            </thead>
            <tbody>
              {S.BULAN_ID_FULL.map((b,i) => {
                const pays = S.PEMBAYARAN.filter(p => p.tahun === tahun && p.bulan === i + 1);
                const perJ = {};
                for (const j of S.JENIS_IURAN) perJ[j.id_jenis] = 0;
                for (const p of pays) perJ[p.id_jenis] += p.nominal;
                const t = pays.reduce((s,p) => s + p.nominal, 0);
                const isF = t === 0;
                return (
                  <tr key={i} style={isF ? {opacity:.4} : {}}>
                    <td><b>{b}</b></td>
                    {S.JENIS_IURAN.map(j => (
                      <td key={j.id_jenis} className="tbl-num">{perJ[j.id_jenis] === 0 ? "—" : fmt(perJ[j.id_jenis])}</td>
                    ))}
                    <td className="tbl-num"><b>{isF ? "—" : fmt(t)}</b></td>
                    <td className="tbl-num" style={{color:"var(--accent)"}}><b>{isF ? "—" : fmt(running[i])}</b></td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{background:"var(--surface-2)",fontWeight:700}}>
                <td style={{padding:"12px 16px"}}>Total {tahun}</td>
                {S.JENIS_IURAN.map(j => (
                  <td key={j.id_jenis} className="tbl-num" style={{padding:"12px 16px",borderTop:"2px solid var(--ink-2)"}}>{fmt(perJenis.find(x => x.jenis.id_jenis === j.id_jenis)?.total || 0)}</td>
                ))}
                <td className="tbl-num" style={{padding:"12px 16px",borderTop:"2px solid var(--ink-2)"}}>{fmt(total)}</td>
                <td style={{borderTop:"2px solid var(--ink-2)"}}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-hd">
          <div>
            <h3>Perbandingan Multi-Tahun</h3>
            <div className="muted" style={{fontSize:12}}>Saldo bersih per tahun</div>
          </div>
        </div>
        <div className="card-pad">
          {allYears.map(y => {
            const max = Math.max(...allYears.map(a => a.total));
            const pct = (y.total / max) * 100;
            return (
              <div key={y.tahun} style={{display:"flex",alignItems:"center",gap:14,padding:"10px 0",borderBottom:"1px solid var(--line-2)"}}>
                <div style={{width:60,fontWeight:700}}>{y.tahun}</div>
                <div style={{flex:1,height:14,background:"var(--surface-2)",borderRadius:7,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${pct}%`,background:y.tahun === 2026 ? "var(--accent)" : "var(--success)",borderRadius:7,transition:"width .3s"}}/>
                </div>
                <div className="tab-num" style={{width:140,textAlign:"right",fontWeight:700}}>{fmt(y.total)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


function RekapKeluarga({ currency }) {
  const S = window.STM;
  const [query, setQuery] = React.useState("");
  const [selectedId, setSelectedId] = React.useState("");
  const [tahun, setTahun] = React.useState(new Date().getFullYear());
  const fmt = v => S.formatCurrency(v, currency);
  const families = S.KELUARGA.slice().sort((a,b)=>String(a.kepala_keluarga).localeCompare(String(b.kepala_keluarga),"id"));
  const matches = families.filter(k => (String(k.kepala_keluarga)+" "+String(k.no_anggota)).toLowerCase().includes(query.toLowerCase()));
  const selected = families.find(k => String(k.id_keluarga) === String(selectedId)) || null;
  const allPays = selected ? S.PEMBAYARAN.filter(p=>Number(p.id_keluarga)===Number(selected.id_keluarga)).slice().sort((a,b)=>String(b.tanggal_bayar).localeCompare(String(a.tanggal_bayar)) || Number(b.id_pembayaran)-Number(a.id_pembayaran)) : [];
  const deposits = allPays.filter(p=>Number(p.nominal)>0).reduce((s,p)=>s+Number(p.nominal),0);
  const withdrawals = allPays.filter(p=>Number(p.nominal)<0).reduce((s,p)=>s+Math.abs(Number(p.nominal)),0);
  const net = deposits-withdrawals;
  const yearPays = allPays.filter(p=>Number(p.tahun)===Number(tahun));
  const monthlyDeposits = S.BULAN_ID.map((_,i)=>yearPays.filter(p=>Number(p.bulan)===i+1 && Number(p.nominal)>0).reduce((s,p)=>s+Number(p.nominal),0));
  const monthlyWithdrawals = S.BULAN_ID.map((_,i)=>yearPays.filter(p=>Number(p.bulan)===i+1 && Number(p.nominal)<0).reduce((s,p)=>s+Math.abs(Number(p.nominal)),0));
  const exportLedger = () => {
    if (!selected) return;
    const rows = allPays.map(p=>{const j=S.JENIS_IURAN.find(x=>Number(x.id_jenis)===Number(p.id_jenis));return [p.id_pembayaran,p.tanggal_bayar,p.nominal<0?"Penarikan":"Setoran",j?.nama_jenis||"",S.BULAN_ID_FULL[Number(p.bulan)-1],p.tahun,p.metode_pembayaran,p.nominal,p.keterangan||"",p.dicatat_oleh||""];});
    S.downloadCSVRows("Rekap-Keluarga-"+String(selected.no_anggota||selected.id_keluarga).replace(/[^a-z0-9_-]/gi,"-")+".csv",["ID Transaksi","Tanggal","Jenis Transaksi","Jenis Tabungan","Periode Bulan","Tahun","Metode","Nominal Bersih","Keterangan","Dicatat Oleh"],rows);
  };
  return <div className="grid" style={{gap:16}}>
    <div className="card no-print">
      <div className="card-hd" style={{flexWrap:"wrap"}}>
        <div><h3>Rekap Keluarga</h3><div className="muted" style={{fontSize:12}}>Cari nama atau nomor anggota untuk melihat saldo dan seluruh riwayat transaksi.</div></div>
        <div className="card-hd-actions" style={{flexWrap:"wrap"}}>
          <button className="btn btn-sec btn-sm" disabled={!selected} onClick={exportLedger}><Icon name="file_excel" size={14}/> Excel / CSV</button>
          <button className="btn btn-dark btn-sm" disabled={!selected} onClick={()=>window.print()}><Icon name="file_pdf" size={14}/> PDF / Print</button>
        </div>
      </div>
      <div className="card-pad family-picker-grid" style={{display:"grid",gridTemplateColumns:"minmax(220px,1fr) minmax(260px,1.2fr)",gap:12}}>
        <div className="field"><label>Cari keluarga</label><div className="input-wrap"><span className="input-prefix"><Icon name="search" size={14}/></span><input className="input" value={query} onChange={e=>{setQuery(e.target.value);setSelectedId("");}} placeholder="Nama kepala keluarga / STM-001"/></div><div className="hint">{matches.length} keluarga cocok</div></div>
        <div className="field"><label>Pilih keluarga</label><select className="select" value={selectedId} onChange={e=>setSelectedId(e.target.value)}><option value="">— Pilih keluarga —</option>{matches.map(k=><option key={k.id_keluarga} value={k.id_keluarga}>{k.no_anggota} · {k.kepala_keluarga}{k.status==="nonaktif"?" (nonaktif)":""}</option>)}</select></div>
      </div>
    </div>
    {!selected ? <div className="card empty-state"><Icon name="users" size={32}/><div>Pilih keluarga untuk melihat rekapnya.</div><div className="muted" style={{fontSize:12}}>Rekap mencakup saldo bersih, grafik bulanan, dan seluruh transaksi yang pernah dicatat.</div></div> : <>
      <div className="card">
        <div className="card-hd"><Avatar name={selected.kepala_keluarga} size="md"/><div style={{flex:1}}><h3>{selected.kepala_keluarga}</h3><div className="muted" style={{fontSize:12}}>{selected.no_anggota} · {selected.status==="aktif"?"Aktif":"Nonaktif"} · Bergabung {selected.tanggal_gabung||"—"}</div></div><span className="badge badge-accent">{allPays.length} transaksi</span></div>
        <div className="card-pad family-summary-grid" style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:14}}>
          <div><div className="stat-lbl">Saldo Bersih</div><div className="stat-val tab-num" style={{fontSize:21,color:net<0?"var(--danger)":"var(--ink)"}}>{fmt(net)}</div></div>
          <div><div className="stat-lbl">Total Setoran</div><div className="stat-val tab-num" style={{fontSize:21,color:"var(--success)"}}>{fmt(deposits)}</div></div>
          <div><div className="stat-lbl">Total Penarikan</div><div className="stat-val tab-num" style={{fontSize:21,color:"var(--danger)"}}>{fmt(withdrawals)}</div></div>
          <div><div className="stat-lbl">Jenis Tabungan</div><div className="stat-val tab-num" style={{fontSize:21}}>{new Set(allPays.map(p=>p.id_jenis)).size}</div></div>
        </div>
      </div>
      <div className="card">
        <div className="card-hd" style={{flexWrap:"wrap"}}><div><h3>Aktivitas Bulanan</h3><div className="muted" style={{fontSize:12}}>Bandingkan uang masuk dan uang yang diambil.</div></div><div className="card-hd-actions no-print"><label style={{fontSize:12,color:"var(--muted)"}}>Tahun <select className="select" style={{width:100,marginLeft:6}} value={tahun} onChange={e=>setTahun(Number(e.target.value))}>{Array.from({length:Math.max(5,new Date().getFullYear()-2022)},(_,i)=>new Date().getFullYear()-2+i).reverse().map(y=><option key={y} value={y}>{y}</option>)}</select></label></div></div>
        <div className="card-pad"><div style={{fontWeight:700,fontSize:12,marginBottom:8}}>Setoran per bulan · {tahun}</div><BarChart data={monthlyDeposits} labels={S.BULAN_ID} height={220} formatY={v=>S.formatCurrencyCompact(v,currency)}/><div style={{fontWeight:700,fontSize:12,margin:"20px 0 8px"}}>Penarikan per bulan · {tahun}</div><BarChart data={monthlyWithdrawals} labels={S.BULAN_ID} height={220} formatY={v=>S.formatCurrencyCompact(v,currency)} accent="var(--danger)" softAccent="var(--danger-soft)"/></div>
      </div>
      <div className="card">
        <div className="card-hd" style={{flexWrap:"wrap"}}><div><h3>Seluruh Riwayat Transaksi</h3><div className="muted" style={{fontSize:12}}>Urut terbaru ke terlama · saldo bersih seluruh periode {fmt(net)}</div></div><span className="badge badge-neutral">{allPays.length} entri</span></div>
        <div className="tbl-wrap"><table className="tbl"><thead><tr><th>Tanggal</th><th>Jenis transaksi</th><th>Periode</th><th>Metode</th><th>Keterangan</th><th style={{textAlign:"right"}}>Nominal</th><th style={{textAlign:"right"}}>Saldo berjalan</th></tr></thead><tbody>
          {allPays.length===0 && <tr><td colSpan={7}><div className="empty-state">Belum ada transaksi untuk keluarga ini.</div></td></tr>}
          {allPays.map((p)=>{const j=S.JENIS_IURAN.find(x=>Number(x.id_jenis)===Number(p.id_jenis));const running=allPays.filter(x=>String(x.tanggal_bayar)<String(p.tanggal_bayar)||(String(x.tanggal_bayar)===String(p.tanggal_bayar)&&Number(x.id_pembayaran)<=Number(p.id_pembayaran))).reduce((sum,x)=>sum+Number(x.nominal),0);return <tr key={p.id_pembayaran}><td className="tab-num">{p.tanggal_bayar}</td><td>{p.nominal<0?"Penarikan":"Setoran"} · {j?.nama_jenis||"Jenis dihapus"}</td><td>{S.BULAN_ID_FULL[Number(p.bulan)-1]} {p.tahun}</td><td>{p.metode_pembayaran||"—"}</td><td>{p.keterangan||"—"}</td><td className="tbl-num"><b style={{color:p.nominal<0?"var(--danger)":"var(--success)"}}>{p.nominal<0?"−":"+"}{fmt(Math.abs(Number(p.nominal)))}</b></td><td className="tbl-num">{fmt(running)}</td></tr>})}
        </tbody><tfoot><tr><td colSpan={5}>Saldo bersih</td><td className="tbl-num"><b>{fmt(net)}</b></td><td></td></tr></tfoot></table></div>
      </div>
    </>}
  </div>;
}



function RekapAkhir({ currency }) {
  const S = window.STM;
  const [query, setQuery] = React.useState("");
  const fmt = v => S.formatCurrency(v, currency);
  const families = S.KELUARGA.map(k => {
    const transactions = S.PEMBAYARAN.filter(p => Number(p.id_keluarga) === Number(k.id_keluarga));
    const tabungan = transactions.reduce((sum,p) => sum + Math.max(0, Number(p.nominal) || 0), 0);
    const pengeluaran = transactions.reduce((sum,p) => sum + Math.max(0, -(Number(p.nominal) || 0)), 0);
    return { ...k, tabungan, pengeluaran, saldo: tabungan - pengeluaran, transaksi: transactions.length };
  }).sort((a,b) => String(a.kepala_keluarga).localeCompare(String(b.kepala_keluarga), "id"));
  const filtered = families.filter(k => (String(k.kepala_keluarga) + " " + String(k.no_anggota)).toLowerCase().includes(query.trim().toLowerCase()));
  const allDeposits = S.PEMBAYARAN.reduce((sum,p) => sum + Math.max(0, Number(p.nominal) || 0), 0);
  const allWithdrawals = S.PEMBAYARAN.reduce((sum,p) => sum + Math.max(0, -(Number(p.nominal) || 0)), 0);
  const years = Array.from(new Set(S.PEMBAYARAN.map(p => Number(p.tahun)).filter(Number.isFinite))).sort((a,b)=>a-b);
  const chartYears = years.length ? years : [new Date().getFullYear()];
  const depositsByYear = chartYears.map(y => S.PEMBAYARAN.filter(p=>Number(p.tahun)===y && Number(p.nominal)>0).reduce((sum,p)=>sum+Number(p.nominal),0));
  const withdrawalsByYear = chartYears.map(y => S.PEMBAYARAN.filter(p=>Number(p.tahun)===y && Number(p.nominal)<0).reduce((sum,p)=>sum+Math.abs(Number(p.nominal)),0));
  const exportAll = () => {
    const rows = families.map(k => [k.no_anggota,k.kepala_keluarga,k.status,k.tabungan,k.pengeluaran,k.saldo,k.transaksi]);
    S.downloadCSVRows("Rekap-Akhir-Seluruh-Keluarga.csv",["No Anggota","Kepala Keluarga","Status","Total Tabungan Sepanjang Waktu","Total Pengeluaran/Penarikan Sepanjang Waktu","Saldo Bersih Saat Ini","Jumlah Transaksi"],rows);
  };
  return <div className="grid rekap-akhir-page" style={{gap:16}}>
    <div className="grid grid-3 rekap-akhir-summary">
      <div className="card stat"><div className="stat-hd"><div className="stat-lbl">Total Tabungan Sepanjang Waktu</div><div className="stat-ico green"><Icon name="trending_up" size={16}/></div></div><div className="stat-val" style={{color:"var(--success)",fontSize:22}}>{fmt(allDeposits)}</div><div className="stat-sub">Akumulasi seluruh setoran</div></div>
      <div className="card stat"><div className="stat-hd"><div className="stat-lbl">Total Pengeluaran</div><div className="stat-ico red"><Icon name="trending_down" size={16}/></div></div><div className="stat-val" style={{color:"var(--danger)",fontSize:22}}>{fmt(allWithdrawals)}</div><div className="stat-sub">Akumulasi seluruh penarikan</div></div>
      <div className="card stat"><div className="stat-hd"><div className="stat-lbl">Saldo Bersih Tercatat</div><div className="stat-ico"><Icon name="wallet" size={16}/></div></div><div className="stat-val" style={{fontSize:22,color:allDeposits-allWithdrawals<0?"var(--danger)":"var(--ink)"}}>{fmt(allDeposits-allWithdrawals)}</div><div className="stat-sub">{families.length} keluarga · {S.PEMBAYARAN.length} transaksi</div></div>
    </div>
    <div className="card">
      <div className="card-hd rekap-akhir-toolbar">
        <div><h3>Grafik Akumulasi Tahunan</h3><div className="muted">Setoran dan penarikan dari seluruh transaksi yang tercatat, semua tahun.</div></div>
      </div>
      <div className="card-pad rekap-akhir-charts">
        <section><div className="rekap-chart-title"><span className="legend-sw" style={{background:"var(--success)"}}/> Total tabungan per tahun</div><BarChart data={depositsByYear} labels={chartYears.map(String)} height={220} formatY={v=>S.formatCurrencyCompact(v,currency)} accent="var(--success)" softAccent="var(--success-soft)"/></section>
        <section><div className="rekap-chart-title"><span className="legend-sw" style={{background:"var(--danger)"}}/> Total pengeluaran per tahun</div><BarChart data={withdrawalsByYear} labels={chartYears.map(String)} height={220} formatY={v=>S.formatCurrencyCompact(v,currency)} accent="var(--danger)" softAccent="var(--danger-soft)"/></section>
      </div>
    </div>
    <div className="card">
      <div className="card-hd rekap-akhir-toolbar">
        <div><h3>Rekap Semua Keluarga</h3><div className="muted">Total setoran, penarikan, dan saldo bersih sepanjang riwayat yang tersimpan.</div></div>
        <div className="card-hd-actions rekap-akhir-actions">
          <button className="btn btn-sec btn-sm" onClick={exportAll}><Icon name="file_excel" size={14}/> Ekspor CSV</button>
        </div>
      </div>
      <div className="card-pad rekap-akhir-filter">
        <div className="input-wrap"><span className="input-prefix"><Icon name="search" size={14}/></span><input className="input" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Cari nama keluarga atau nomor anggota…"/></div>
        <span className="muted rekap-akhir-count">Menampilkan {filtered.length} dari {families.length} keluarga</span>
      </div>
      <div className="tbl-wrap"><table className="tbl rekap-akhir-table"><thead><tr><th>Keluarga</th><th>Status</th><th className="tbl-num">Total Tabungan</th><th className="tbl-num">Total Pengeluaran</th><th className="tbl-num">Saldo Bersih</th><th className="tbl-num">Transaksi</th></tr></thead><tbody>
        {filtered.length===0 && <tr><td colSpan={6}><div className="empty-state">Tidak ada keluarga yang cocok dengan pencarian.</div></td></tr>}
        {filtered.map(k=><tr key={k.id_keluarga}>
          <td><div className="rekap-family-name"><Avatar name={k.kepala_keluarga} size="sm"/><div><b>{k.kepala_keluarga}</b><small>{k.no_anggota}</small></div></div></td>
          <td><span className={k.status==="aktif"?"badge badge-green":"badge badge-neutral"}>{k.status==="aktif"?"Aktif":"Nonaktif"}</span></td>
          <td className="tbl-num"><b style={{color:"var(--success)"}}>{fmt(k.tabungan)}</b></td>
          <td className="tbl-num"><b style={{color:"var(--danger)"}}>{fmt(k.pengeluaran)}</b></td>
          <td className="tbl-num"><b style={{color:k.saldo<0?"var(--danger)":"var(--ink)"}}>{fmt(k.saldo)}</b></td>
          <td className="tbl-num">{k.transaksi}</td>
        </tr>)}
      </tbody><tfoot><tr><td colSpan={2}>Total seluruh keluarga</td><td className="tbl-num">{fmt(allDeposits)}</td><td className="tbl-num">{fmt(allWithdrawals)}</td><td className="tbl-num">{fmt(allDeposits-allWithdrawals)}</td><td className="tbl-num">{S.PEMBAYARAN.length}</td></tr></tfoot></table></div>
    </div>
  </div>;
}

Object.assign(window, { InputPembayaran, RekapBulanan, RekapTahunan, RekapKeluarga, RekapAkhir });
