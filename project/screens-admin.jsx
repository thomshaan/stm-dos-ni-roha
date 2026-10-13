// Jenis Tabungan, Users, Aktivitas, Print preview (savings-only, tanpa sektor & alamat)
const { Icon, Avatar, Modal, useToast } = window;

function JenisIuran({ currency }) {
  const S = window.STM;
  const toast = useToast();
  const [list, setList] = React.useState(S.JENIS_IURAN);
  const [edit, setEdit] = React.useState(null);
  const fmt = (v) => S.formatCurrency(v, currency);

  const usage = (id) => S.PEMBAYARAN.filter(p => Number(p.id_jenis) === Number(id)).length;
  const total = (id) => S.PEMBAYARAN.filter(p => Number(p.id_jenis) === Number(id)).reduce((s,p) => s+p.nominal, 0);

  return (
    <div className="card">
      <div className="card-hd">
        <div>
          <h3>Jenis Tabungan</h3>
          <div className="muted" style={{fontSize:12}}>Kategori setoran & nominal default</div>
        </div>
        <div className="card-hd-actions">
          <button className="btn btn-primary btn-sm" onClick={() => setEdit({ id_jenis: null, nama_jenis: "", nominal_default: 10000, tipe: "tabungan" })}>
            <Icon name="plus" size={14}/> Tambah Jenis
          </button>
        </div>
      </div>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>Nama</th>
              <th style={{textAlign:"right"}}>Nominal Default</th>
              <th className="tab-num" style={{textAlign:"right"}}>Transaksi</th>
              <th className="tab-num" style={{textAlign:"right"}}>Akumulasi</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.map(j => (
              <tr key={j.id_jenis}>
                <td>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:28,height:28,borderRadius:8,background:"var(--accent-soft)",color:"var(--accent-2)",display:"grid",placeItems:"center"}}>
                      <Icon name="tag" size={14}/>
                    </div>
                    <b style={{color:"var(--ink)"}}>{j.nama_jenis}</b>
                  </div>
                </td>
                <td className="tbl-num"><b>{fmt(j.nominal_default)}</b></td>
                <td className="tbl-num">{usage(j.id_jenis)}</td>
                <td className="tbl-num"><b>{fmt(total(j.id_jenis))}</b></td>
                <td>
                  <div style={{display:"flex",gap:6,justifyContent:"flex-end",flexWrap:"wrap"}}>
                    <button className="btn btn-sec btn-sm" onClick={() => setEdit(j)}><Icon name="edit" size={12}/> Edit</button>
                    <button className="btn btn-ghost btn-sm" title="Hapus jenis tabungan" onClick={() => {
                      const used = usage(j.id_jenis);
                      if (list.length <= 1) { toast({kind:"error",title:"Jenis terakhir tidak dapat dihapus",body:"Sistem harus memiliki minimal satu jenis tabungan."}); return; }
                      if (used > 0) { toast({kind:"error",title:"Jenis masih digunakan",body:`${j.nama_jenis} dipakai oleh ${used} transaksi. Data historis dipertahankan; hapus atau pindahkan transaksi terkait terlebih dahulu.`}); return; }
                      if (!window.confirm(`Hapus jenis tabungan “${j.nama_jenis}”? Tindakan ini tidak dapat dibatalkan.`)) return;
                      const nextList = list.filter(x => Number(x.id_jenis) !== Number(j.id_jenis));
                      S.JENIS_IURAN.splice(0, S.JENIS_IURAN.length, ...nextList);
                      S.AKTIVITAS.unshift({id:Date.now(),waktu:new Date().toISOString().slice(0,16).replace("T"," "),user:"Thomas",aksi:"Menghapus jenis tabungan",detail:j.nama_jenis,tipe:"warn"});
                      S.persistSTM(); setList(nextList);
                      toast({kind:"success",title:"Jenis tabungan dihapus",body:j.nama_jenis});
                    }}><Icon name="trash" size={12}/> Hapus</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!edit} onClose={() => setEdit(null)}
             title={edit?.id_jenis ? "Edit Jenis Tabungan" : "Tambah Jenis Tabungan"}
             width="520px"
             footer={<>
               <button className="btn btn-ghost" onClick={() => setEdit(null)}>Batal</button>
               <button className="btn btn-primary" onClick={() => {
                 if (!edit.nama_jenis.trim()) { toast({kind:"error",title:"Nama wajib diisi"}); return; }
                 let nextList;
                 if (edit.id_jenis) {
                   nextList = list.map(x => x.id_jenis === edit.id_jenis ? edit : x);
                   toast({kind:"success",title:"Jenis tabungan diperbarui",body:edit.nama_jenis});
                 } else {
                   const id = Math.max(0, ...list.map(x => Number(x.id_jenis) || 0)) + 1;
                   nextList = [...list, {...edit, id_jenis: id}];
                   toast({kind:"success",title:"Jenis tabungan ditambahkan",body:edit.nama_jenis});
                 }
                 S.JENIS_IURAN.splice(0, S.JENIS_IURAN.length, ...nextList);
                 S.persistSTM();
                 setList(nextList);
                 setEdit(null);
               }}>
                 <Icon name="check" size={14}/> Simpan
               </button>
             </>}>
        {edit && (
          <div className="grid" style={{gap:14}}>
            <div className="field">
              <label>Nama Jenis</label>
              <input className="input" value={edit.nama_jenis} onChange={e => setEdit({...edit, nama_jenis: e.target.value})} placeholder="cth. Tabungan Pendidikan"/>
            </div>
            <div className="field">
              <label>Nominal Default</label>
              <div className="input-wrap">
                <span className="input-prefix">{currency === "idr" ? "IDR" : "Rp"}</span>
                <input className="input" data-prefix="1" type="number" value={edit.nominal_default} onChange={e => setEdit({...edit, nominal_default: Number(e.target.value) || 0})}/>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function UsersAdmin() {
  const S = window.STM;
  const [list, setList] = React.useState(S.USERS);
  const [edit, setEdit] = React.useState(null);
  const toast = useToast();
  return (
    <div className="card">
      <div className="card-hd">
        <div>
          <h3>User & Pengurus</h3>
          <div className="muted" style={{fontSize:12}}>Daftar pengurus lokal (bukan autentikasi/login aktif)</div>
        </div>
        <div className="card-hd-actions">
          <button className="btn btn-primary btn-sm" onClick={() => setEdit({id_user:null,nama:"",username:"",role:"bendahara"})}>
            <Icon name="plus" size={14}/> Tambah User
          </button>
        </div>
      </div>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>Nama</th>
              <th>Username</th>
              <th>Role</th>
              <th>Login Terakhir</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.map(u => (
              <tr key={u.id_user}>
                <td>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <Avatar name={u.nama} size="sm"/>
                    <div>
                      <div style={{fontWeight:600,color:"var(--ink)"}}>{u.nama}</div>
                      <div style={{fontSize:11.5,color:"var(--muted)"}}>ID: {u.id_user}</div>
                    </div>
                  </div>
                </td>
                <td className="tab-num">@{u.username}</td>
                <td>
                  {u.role === "admin"
                    ? <span className="badge badge-accent">Administrator</span>
                    : <span className="badge badge-green">Bendahara</span>}
                </td>
                <td className="tab-num" style={{fontSize:12.5}}>{u.last_login}</td>
                <td>
                  <div style={{display:"flex",gap:6,justifyContent:"flex-end"}}>
                    <button className="btn btn-sec btn-sm" onClick={() => setEdit(u)}><Icon name="edit" size={12}/> Edit</button>
                    <button className="btn btn-ghost btn-sm" title="Hapus user" onClick={() => {
                      if (u.role === "admin" && list.filter(x => x.role === "admin").length <= 1) {
                        toast({kind:"error",title:"Admin terakhir tidak dapat dihapus"});
                        return;
                      }
                      if (!window.confirm(`Hapus user ${u.nama} (@${u.username})? Tindakan ini tidak dapat dibatalkan.`)) return;
                      const nextList = list.filter(x => x.id_user !== u.id_user);
                      S.USERS.splice(0, S.USERS.length, ...nextList);
                      S.AKTIVITAS.unshift({id:Date.now(),waktu:new Date().toISOString().slice(0,16).replace("T"," "),user:"Thomas",aksi:"Menghapus user",detail:u.nama+" (@"+u.username+")",tipe:"warn"});
                      S.persistSTM();
                      setList(nextList);
                      toast({kind:"success",title:"User dihapus",body:u.nama});
                    }}><Icon name="trash" size={12}/> Hapus</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => toast({kind:"info",title:"Reset password terkirim",body:`Tautan dikirim ke ${u.nama}`})}>
                      <Icon name="settings" size={12}/>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!edit} onClose={() => setEdit(null)}
             title={edit?.id_user ? "Edit User" : "Tambah User"} width="520px"
             footer={<>
               <button className="btn btn-ghost" onClick={() => setEdit(null)}>Batal</button>
               <button className="btn btn-primary" onClick={() => {
                 const nama = edit.nama.trim();
                 const username = edit.username.trim();
                 if (!nama || !username) { toast({kind:"error",title:"Lengkapi data"}); return; }
                 if (list.some(x => x.username.toLowerCase() === username.toLowerCase() && x.id_user !== edit.id_user)) {
                   toast({kind:"error",title:"Username sudah digunakan"}); return;
                 }
                 let nextList;
                 if (edit.id_user) {
                   nextList = list.map(x => x.id_user === edit.id_user ? {...edit,nama,username} : x);
                   toast({kind:"success",title:"User diperbarui",body:nama});
                 } else {
                   const id = Math.max(0, ...list.map(x => Number(x.id_user) || 0)) + 1;
                   nextList = [...list, {...edit,nama,username,id_user:id,last_login:"—"}];
                   toast({kind:"success",title:"User ditambahkan",body:nama});
                 }
                 S.USERS.splice(0, S.USERS.length, ...nextList);
                 S.AKTIVITAS.unshift({id:Date.now(),waktu:new Date().toISOString().slice(0,16).replace("T"," "),user:"Thomas",aksi:edit.id_user ? "Memperbarui user" : "Menambah user",detail:nama+" (@"+username+")",tipe:edit.id_user ? "update" : "create"});
                 S.persistSTM();
                 setList(nextList);
                 setEdit(null);
               }}><Icon name="check" size={14}/> Simpan</button>
             </>}>
        {edit && (
          <div className="grid" style={{gap:14}}>
            <div className="field"><label>Nama Lengkap</label>
              <input className="input" value={edit.nama} onChange={e => setEdit({...edit,nama:e.target.value})}/>
            </div>
            <div className="grid grid-2">
              <div className="field"><label>Username</label>
                <input className="input" value={edit.username} onChange={e => setEdit({...edit,username:e.target.value})}/>
              </div>
              <div className="field"><label>Role</label>
                <select className="select" value={edit.role} onChange={e => setEdit({...edit,role:e.target.value})}>
                  <option value="admin">Administrator</option>
                  <option value="bendahara">Bendahara</option>
                </select>
              </div>
            </div>
            <div className="field"><label>Password Baru <span className="muted" style={{fontWeight:400}}>(kosongkan jika tidak diubah)</span></label>
              <input className="input" type="password" placeholder="••••••••"/>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Aktivitas() {
  const S = window.STM;
  const [filter, setFilter] = React.useState("Semua");
  const [historyLimit, setHistoryLimit] = React.useState(10);
  const iconMap = { payment:"money", create:"plus", update:"edit", auth:"user", export:"download", warn:"alert" };
  const colorMap = { payment:"var(--success)", create:"var(--accent)", update:"var(--info)", auth:"var(--muted)", export:"var(--accent-2)", warn:"var(--danger)" };
  const list = (filter === "Semua" ? S.AKTIVITAS : S.AKTIVITAS.filter(a => a.tipe === filter)).slice().sort((a,b) => b.waktu.localeCompare(a.waktu)).slice(0, historyLimit);

  const grouped = {};
  for (const a of list) {
    const d = a.waktu.slice(0,10);
    (grouped[d] = grouped[d] || []).push(a);
  }
  const days = Object.keys(grouped).sort().reverse();

  return (
    <div className="card">
      <div className="card-hd">
        <div>
          <h3>Riwayat Aktivitas Admin</h3>
          <div className="muted" style={{fontSize:12}}>Log aksi pengurus pada sistem · {list.length} dari {filter === "Semua" ? S.AKTIVITAS.length : S.AKTIVITAS.filter(a => a.tipe === filter).length} entri</div>
        </div>
        <div className="card-hd-actions">
          <label style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:"var(--muted)"}}>Tampilkan
            <select aria-label="Jumlah aktivitas ditampilkan" className="select" style={{width:82,padding:"7px 24px 7px 10px"}} value={historyLimit} onChange={e => setHistoryLimit(Number(e.target.value))}>
              <option value={10}>10</option><option value={30}>30</option><option value={50}>50</option>
            </select>
          </label>
          <div className="seg">
            {["Semua","payment","create","update","export","warn","auth"].map(t => (
              <button key={t} data-active={filter === t ? "1" : "0"} onClick={() => setFilter(t)}>
                {t === "Semua" ? "Semua" : t}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="card-pad">
        {days.map(d => (
          <div key={d} style={{marginBottom:24}}>
            <div style={{fontSize:11,fontWeight:700,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".08em",marginBottom:10,paddingLeft:42}}>
              {d}
            </div>
            <div style={{position:"relative",paddingLeft:14}}>
              <div style={{position:"absolute",left:28,top:0,bottom:0,width:2,background:"var(--line)"}}/>
              {grouped[d].map(a => (
                <div key={a.id} style={{display:"flex",alignItems:"flex-start",gap:14,padding:"8px 0",position:"relative"}}>
                  <div style={{width:30,height:30,borderRadius:8,background:"var(--surface-2)",color:colorMap[a.tipe],display:"grid",placeItems:"center",border:"2px solid var(--surface)",zIndex:1,boxShadow:"0 0 0 1px var(--line)",flexShrink:0}}>
                    <Icon name={iconMap[a.tipe] || "history"} size={14}/>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,color:"var(--ink-2)"}}>
                      <b style={{color:"var(--ink)"}}>{a.user}</b> {a.aksi.toLowerCase()}
                    </div>
                    <div style={{fontSize:12,color:"var(--muted)",marginTop:1}}>{a.detail}</div>
                  </div>
                  <div className="tab-num" style={{fontSize:11.5,color:"var(--muted)",whiteSpace:"nowrap"}}>{a.waktu.slice(11)}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PrintPreview({ currency }) {
  const S = window.STM;
  const [bulan, setBulan] = React.useState(new Date().getMonth()+1);
  const [tahun, setTahun] = React.useState(new Date().getFullYear());
  const [importType, setImportType] = React.useState("families");
  const fmt = (v) => S.formatCurrency(v, currency);
  const toast = useToast();

  const pays = S.pembayaranBulan(bulan, tahun);
  const total = pays.reduce((s,p) => s + p.nominal, 0);
  const map = new Map();
  for (const p of pays) {
    if (!map.has(p.id_keluarga)) map.set(p.id_keluarga, { perJenis: {}, total: 0 });
    const row = map.get(p.id_keluarga);
    row.perJenis[p.id_jenis] = (row.perJenis[p.id_jenis] || 0) + p.nominal;
    row.total += p.nominal;
  }
  const rows = Array.from(map.entries()).map(([idK, r]) => ({
    keluarga: S.KELUARGA.find(k => k.id_keluarga === idK),
    ...r,
  })).sort((a,b) => b.total - a.total);

  return (
    <div>
      <div className="card mb-16 no-print">
        <div className="card-hd">
          <div>
            <h3>Backup Data Lokal (CSV)</h3>
            <div className="muted" style={{fontSize:12}}>Simpan salinan data di komputer. Impor akan menggabungkan data berdasarkan ID, bukan menghapus data lama.</div>
          </div>
        </div>
        <div className="card-pad" style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
          <button className="btn btn-sec btn-sm" onClick={() => { try { const n = S.exportCSV("families"); toast({kind:"success",title:"CSV keluarga diunduh",body:n + " anggota"}); } catch (err) { toast({kind:"error",title:"Ekspor gagal",body:err.message}); } }}><Icon name="download" size={14}/> Keluarga CSV</button>
          <button className="btn btn-sec btn-sm" onClick={() => { try { const n = S.exportCSV("transactions"); toast({kind:"success",title:"CSV transaksi diunduh",body:n + " transaksi"}); } catch (err) { toast({kind:"error",title:"Ekspor gagal",body:err.message}); } }}><Icon name="download" size={14}/> Transaksi CSV</button>
          <button className="btn btn-sec btn-sm" onClick={() => { try { const n = S.exportCSV("savings_types"); toast({kind:"success",title:"CSV jenis tabungan diunduh",body:n + " jenis tabungan"}); } catch (err) { toast({kind:"error",title:"Ekspor gagal",body:err.message}); } }}><Icon name="download" size={14}/> Jenis Tabungan CSV</button>
          <button className="btn btn-sec btn-sm" onClick={() => { try { const n = S.exportCSV("activity"); toast({kind:"success",title:"CSV aktivitas diunduh",body:n + " catatan aktivitas"}); } catch (err) { toast({kind:"error",title:"Ekspor gagal",body:err.message}); } }}><Icon name="download" size={14}/> Aktivitas CSV</button>
        </div>
        <div className="card-pad" style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center",borderTop:"1px solid var(--line)"}}>
          <label htmlFor="stm-csv-type" style={{fontSize:12,fontWeight:600}}>Impor jenis data</label>
          <select id="stm-csv-type" className="select" style={{width:190}} value={importType} onChange={e => setImportType(e.target.value)}>
            <option value="families">Keluarga</option><option value="savings_types">Jenis tabungan</option><option value="transactions">Transaksi</option><option value="activity">Aktivitas</option>
          </select>
          <label className="btn btn-primary btn-sm" style={{cursor:"pointer"}}><Icon name="upload" size={14}/> Pilih CSV untuk Impor
            <input type="file" accept=".csv,text/csv" style={{display:"none"}} onChange={async e => {
              const file = e.target.files && e.target.files[0]; if (!file) return;
              try { const count = S.importCSV(importType, await file.text()); toast({kind:"success",title:"Impor CSV berhasil",body:count + " baris diproses. Memuat ulang data…"}); window.location.reload(); }
              catch (err) { toast({kind:"error",title:"Impor CSV gagal",body:err.message || "Format file tidak valid"}); }
              finally { e.target.value = ""; }
            }}/>
          </label>
          <div className="muted" style={{fontSize:11,flexBasis:"100%"}}>Urutan pemulihan: jenis tabungan → keluarga → transaksi → aktivitas. Impor transaksi membutuhkan ID keluarga dan jenis tabungan yang sudah tersedia.</div>
        </div>
      </div>
      <div className="card mb-16 no-print">
        <div className="card-hd">
          <div>
            <h3>Cetak & Export</h3>
            <div className="muted" style={{fontSize:12}}>Pratinjau laporan A4 sebelum dicetak atau di-export</div>
          </div>
          <div className="card-hd-actions">
            <select className="select" style={{width:140}} value={bulan} onChange={e => setBulan(Number(e.target.value))}>
              {S.BULAN_ID_FULL.map((b,i) => <option key={i} value={i+1}>{b}</option>)}
            </select>
            <select className="select" style={{width:100}} value={tahun} onChange={e => setTahun(Number(e.target.value))}>
              {Array.from({length:Math.max(5,new Date().getFullYear()-2022)},(_,i)=>new Date().getFullYear()-2+i).reverse().map(y=><option key={y} value={y}>{y}</option>)}
            </select>
            <button className="btn btn-sec btn-sm" onClick={() => { const rows=pays.slice().sort((a,b)=>String(a.tanggal_bayar).localeCompare(String(b.tanggal_bayar))).map(p=>{const k=S.KELUARGA.find(x=>Number(x.id_keluarga)===Number(p.id_keluarga));const j=S.JENIS_IURAN.find(x=>Number(x.id_jenis)===Number(p.id_jenis));return [p.id_pembayaran,p.tanggal_bayar,k?.no_anggota||"",k?.kepala_keluarga||"",j?.nama_jenis||"",p.nominal<0?"Penarikan":"Setoran",S.BULAN_ID_FULL[p.bulan-1],p.tahun,p.metode_pembayaran,p.nominal,p.keterangan||""];});S.downloadCSVRows("Rekap-"+S.BULAN_ID[bulan-1]+"-"+tahun+".csv",["ID Transaksi","Tanggal","No Anggota","Keluarga","Jenis Tabungan","Jenis Transaksi","Periode Bulan","Tahun","Metode","Nominal Bersih","Keterangan"],rows);toast({kind:"success",title:"CSV laporan diunduh",body:rows.length+" transaksi. File CSV dapat dibuka di Excel."}); }}>
              <Icon name="file_excel" size={14}/> Excel / CSV
            </button>
            <button className="btn btn-sec btn-sm" onClick={() => window.print()}>
              <Icon name="file_pdf" size={14}/> PDF / Print
            </button>
            <button className="btn btn-dark btn-sm" onClick={() => window.print()}>
              <Icon name="print" size={14}/> Print
            </button>
          </div>
        </div>
      </div>

      <div style={{display:"flex",justifyContent:"center",padding:"20px 0"}}>
        <div className="print-page">
          <div className="print-hd">
            <div>
              <h1>LAPORAN REKAP TABUNGAN</h1>
              <h2>{S.BULAN_ID_FULL[bulan-1]} {tahun}</h2>
            </div>
            <div className="print-meta">
              <div>Dicetak: {new Date().toLocaleDateString("id-ID",{day:"2-digit",month:"long",year:"numeric"})}</div>
              <div>Periode: {S.BULAN_ID_FULL[bulan-1]} {tahun}</div>
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginTop:20,fontSize:11}}>
            <div style={{padding:"10px 12px",background:"#f6efe1",borderRadius:6}}>
              <div style={{color:"#777",textTransform:"uppercase",letterSpacing:".05em",fontWeight:600,fontSize:10}}>Saldo Bersih</div>
              <div style={{fontSize:15,fontWeight:700,marginTop:2}} className="tab-num">{fmt(total)}</div>
            </div>
            <div style={{padding:"10px 12px",background:"#f6efe1",borderRadius:6}}>
              <div style={{color:"#777",textTransform:"uppercase",letterSpacing:".05em",fontWeight:600,fontSize:10}}>Jumlah Transaksi</div>
              <div style={{fontSize:15,fontWeight:700,marginTop:2}} className="tab-num">{pays.length}</div>
            </div>
            <div style={{padding:"10px 12px",background:"#f6efe1",borderRadius:6}}>
              <div style={{color:"#777",textTransform:"uppercase",letterSpacing:".05em",fontWeight:600,fontSize:10}}>Anggota Bertransaksi</div>
              <div style={{fontSize:15,fontWeight:700,marginTop:2}} className="tab-num">{rows.length}</div>
            </div>
            <div style={{padding:"10px 12px",background:"#f6efe1",borderRadius:6}}>
              <div style={{color:"#777",textTransform:"uppercase",letterSpacing:".05em",fontWeight:600,fontSize:10}}>Rata-rata</div>
              <div style={{fontSize:15,fontWeight:700,marginTop:2}} className="tab-num">{fmt(rows.length ? total/rows.length : 0)}</div>
            </div>
          </div>

          <table className="print-tbl">
            <thead>
              <tr>
                <th style={{width:28}}>#</th>
                <th>Anggota</th>
                {S.JENIS_IURAN.map(j => <th key={j.id_jenis} className="num">{j.nama_jenis}</th>)}
                <th className="num">Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r,i) => (
                <tr key={r.keluarga?.id_keluarga}>
                  <td className="num">{i+1}</td>
                  <td>
                    <div style={{fontWeight:600}}>{r.keluarga?.kepala_keluarga}</div>
                    <div style={{fontSize:10,color:"#777"}} className="tab-num">{r.keluarga?.no_anggota}</div>
                  </td>
                  {S.JENIS_IURAN.map(j => (
                    <td key={j.id_jenis} className="num">{r.perJenis[j.id_jenis] ? fmt(r.perJenis[j.id_jenis]) : "—"}</td>
                  ))}
                  <td className="num"><b>{fmt(r.total)}</b></td>
                </tr>
              ))}
              
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2}>TOTAL</td>
                {S.JENIS_IURAN.map(j => {
                  const t = pays.filter(p => p.id_jenis === j.id_jenis).reduce((s,p) => s+p.nominal, 0);
                  return <td key={j.id_jenis} className="num">{fmt(t)}</td>;
                })}
                <td className="num">{fmt(total)}</td>
              </tr>
            </tfoot>
          </table>

          <div className="print-ft">
            <div>
              <div>Catatan:</div>
              <div style={{marginTop:4,maxWidth:520,color:"#555"}}>Mohon periksa kembali nominal dan keterangan transaksi sebelum laporan disahkan.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { JenisIuran, UsersAdmin, Aktivitas, PrintPreview });
