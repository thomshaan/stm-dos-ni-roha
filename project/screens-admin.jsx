// Jenis Tabungan, Users, Aktivitas, Print preview (savings-only, tanpa sektor & alamat)
const { Icon, Avatar, Modal, useToast } = window;

function JenisIuran({ currency }) {
  const S = window.STM;
  const toast = useToast();
  const [list, setList] = React.useState(S.JENIS_IURAN);
  const [edit, setEdit] = React.useState(null);
  const fmt = (v) => S.formatCurrency(v, currency);

  const usage = (id) => S.PEMBAYARAN.filter(p => p.id_jenis === id).length;
  const total = (id) => S.PEMBAYARAN.filter(p => p.id_jenis === id).reduce((s,p) => s+p.nominal, 0);

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
                  <div style={{display:"flex",gap:6,justifyContent:"flex-end"}}>
                    <button className="btn btn-sec btn-sm" onClick={() => setEdit(j)}><Icon name="edit" size={12}/> Edit</button>
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
                 if (edit.id_jenis) {
                   setList(list.map(x => x.id_jenis === edit.id_jenis ? edit : x));
                   toast({kind:"success",title:"Jenis tabungan diperbarui",body:edit.nama_jenis});
                 } else {
                   const id = Math.max(...list.map(x => x.id_jenis)) + 1;
                   setList([...list, {...edit, id_jenis: id}]);
                   toast({kind:"success",title:"Jenis tabungan ditambahkan",body:edit.nama_jenis});
                 }
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
          <div className="muted" style={{fontSize:12}}>Akses sistem hanya untuk admin & bendahara</div>
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
                 if (!edit.nama || !edit.username) { toast({kind:"error",title:"Lengkapi data"}); return; }
                 if (edit.id_user) {
                   setList(list.map(x => x.id_user === edit.id_user ? edit : x));
                   toast({kind:"success",title:"User diperbarui",body:edit.nama});
                 } else {
                   const id = Math.max(...list.map(x => x.id_user)) + 1;
                   setList([...list, {...edit,id_user:id,last_login:"—"}]);
                   toast({kind:"success",title:"User ditambahkan",body:edit.nama});
                 }
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
  const iconMap = { payment:"money", create:"plus", update:"edit", auth:"user", export:"download", warn:"alert" };
  const colorMap = { payment:"var(--success)", create:"var(--accent)", update:"var(--info)", auth:"var(--muted)", export:"var(--accent-2)", warn:"var(--danger)" };
  const list = filter === "Semua" ? S.AKTIVITAS : S.AKTIVITAS.filter(a => a.tipe === filter);

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
          <div className="muted" style={{fontSize:12}}>Log aksi pengurus pada sistem · {S.AKTIVITAS.length} entri</div>
        </div>
        <div className="card-hd-actions">
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
  const [bulan, setBulan] = React.useState(4);
  const [tahun, setTahun] = React.useState(2026);
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
      <div className="card mb-16">
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
              {[2024,2025,2026].map(y => <option key={y}>{y}</option>)}
            </select>
            <button className="btn btn-sec btn-sm" onClick={() => toast({kind:"success",title:"Excel siap diunduh",body:`Rekap-${S.BULAN_ID[bulan-1]}-${tahun}.xlsx`})}>
              <Icon name="file_excel" size={14}/> Excel
            </button>
            <button className="btn btn-sec btn-sm" onClick={() => toast({kind:"success",title:"PDF siap diunduh",body:`Rekap-${S.BULAN_ID[bulan-1]}-${tahun}.pdf`})}>
              <Icon name="file_pdf" size={14}/> PDF
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
              <h2>STM Dos Ni Roha · {S.BULAN_ID_FULL[bulan-1]} {tahun}</h2>
            </div>
            <div className="print-meta">
              <div>Dicetak: 18 Mei 2026</div>
              <div>Oleh: Robert Marpaung</div>
              <div>Periode: {S.BULAN_ID_FULL[bulan-1]} {tahun}</div>
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginTop:20,fontSize:11}}>
            <div style={{padding:"10px 12px",background:"#f6efe1",borderRadius:6}}>
              <div style={{color:"#777",textTransform:"uppercase",letterSpacing:".05em",fontWeight:600,fontSize:10}}>Total Setor</div>
              <div style={{fontSize:15,fontWeight:700,marginTop:2}} className="tab-num">{fmt(total)}</div>
            </div>
            <div style={{padding:"10px 12px",background:"#f6efe1",borderRadius:6}}>
              <div style={{color:"#777",textTransform:"uppercase",letterSpacing:".05em",fontWeight:600,fontSize:10}}>Transaksi</div>
              <div style={{fontSize:15,fontWeight:700,marginTop:2}} className="tab-num">{pays.length}</div>
            </div>
            <div style={{padding:"10px 12px",background:"#f6efe1",borderRadius:6}}>
              <div style={{color:"#777",textTransform:"uppercase",letterSpacing:".05em",fontWeight:600,fontSize:10}}>Anggota Setor</div>
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
              {rows.slice(0, 20).map((r,i) => (
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
              {rows.length > 20 && (
                <tr><td colSpan={3 + S.JENIS_IURAN.length} style={{textAlign:"center",fontStyle:"italic",color:"#777"}}>
                  … {rows.length - 20} baris lainnya (halaman berikutnya)
                </td></tr>
              )}
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
              <div style={{marginTop:4,maxWidth:280,color:"#888"}}>Laporan ini dihasilkan otomatis oleh sistem tabungan STM Dos Ni Roha. Mohon konfirmasi nominal sebelum disahkan dalam rapat pengurus.</div>
            </div>
            <div className="print-sign">
              <div>Mengetahui,</div>
              <div className="line">Bendahara STM</div>
            </div>
            <div className="print-sign">
              <div>Disusun oleh,</div>
              <div className="line">Admin Sistem</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { JenisIuran, UsersAdmin, Aktivitas, PrintPreview });
