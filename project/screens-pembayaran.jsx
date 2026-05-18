// Input setoran (functional form), Rekap bulanan, Rekap tahunan (savings-only)
const { Icon, Avatar, BarChart, useToast, Pager } = window;

function InputPembayaran({ presetKeluarga, currency, onSaved }) {
  const S = window.STM;
  const toast = useToast();
  const today = "2026-05-18";
  const [form, setForm] = React.useState({
    id_keluarga: presetKeluarga?.id_keluarga || "",
    id_jenis: 1,
    bulan: 5,
    tahun: 2026,
    nominal: 25000,
    tanggal_bayar: today,
    metode_pembayaran: "Tunai",
    keterangan: "",
  });
  const [saved, setSaved] = React.useState(() => window.__sessionPayments || []);

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
    if (!form.nominal || form.nominal < 1000) { toast({ kind:"error", title:"Nominal tidak valid" }); return; }
    const k = S.KELUARGA.find(x => x.id_keluarga === Number(form.id_keluarga));
    const j = S.JENIS_IURAN.find(x => x.id_jenis === Number(form.id_jenis));
    const rec = {
      id_pembayaran: 90000 + saved.length + 1,
      ...form,
      id_keluarga: Number(form.id_keluarga),
      id_jenis: Number(form.id_jenis),
      bulan: Number(form.bulan),
      tahun: Number(form.tahun),
      nominal: Number(form.nominal),
      dicatat_oleh: "Robert Marpaung",
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
      tanggal_bayar: rec.tanggal_bayar, metode_pembayaran: rec.metode_pembayaran,
      keterangan: rec.keterangan, dicatat_oleh: rec.dicatat_oleh,
    });
    toast({
      kind:"success",
      title:`Setoran tercatat`,
      body:`${k?.kepala_keluarga} — ${j?.nama_jenis} ${S.BULAN_ID_FULL[rec.bulan-1]} ${rec.tahun} · ${S.formatCurrency(rec.nominal, currency)}`,
    });
    setForm(f => ({ ...f, nominal: S.JENIS_IURAN.find(x => x.id_jenis === f.id_jenis)?.nominal_default || 25000, keterangan: "", id_keluarga: "" }));
    onSaved && onSaved(rec);
  };

  const fmt = (v) => S.formatCurrency(v, currency);

  return (
    <div className="grid" style={{gridTemplateColumns:"1.3fr 1fr",gap:20,alignItems:"flex-start"}}>
      <div className="card">
        <div className="card-hd">
          <div>
            <h3>Catat Setoran Baru</h3>
            <div className="muted" style={{fontSize:12}}>Form dicatat atas nama: <b style={{color:"var(--ink-2)"}}>Robert Marpaung (admin)</b></div>
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

          <div className="grid grid-2">
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
              <label>Nominal</label>
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
                {[2024,2025,2026].map(y => <option key={y}>{y}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Tanggal Setor</label>
              <input className="input" type="date" value={form.tanggal_bayar}
                     onChange={e => setForm(f => ({...f, tanggal_bayar: e.target.value}))}/>
            </div>
          </div>

          <div className="grid grid-2">
            <div className="field">
              <label>Metode Setor</label>
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
              id_keluarga: "", id_jenis: 1, bulan: 5, tahun: 2026, nominal: 25000,
              tanggal_bayar: today, metode_pembayaran: "Tunai", keterangan: "",
            })}>Reset</button>
            <button type="submit" className="btn btn-primary">
              <Icon name="check" size={14}/> Simpan Setoran
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="card-hd">
          <div>
            <h3>Tercatat Sesi Ini</h3>
            <div className="muted" style={{fontSize:12}}>Setoran masuk dari form di sebelah</div>
          </div>
          <div className="card-hd-actions">
            <span className="badge badge-accent tab-num">{saved.length} entri</span>
          </div>
        </div>
        {saved.length === 0 ? (
          <div className="empty-state">
            <Icon name="receipt" size={36}/>
            <div>Belum ada setoran dicatat sesi ini.</div>
            <div style={{fontSize:12,marginTop:4}}>Form di sebelah kiri akan menambahkan entri di sini.</div>
          </div>
        ) : (
          <div style={{maxHeight:520,overflowY:"auto"}}>
            {saved.map(s => (
              <div key={s.id_pembayaran} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 18px",borderBottom:"1px solid var(--line-2)"}}>
                <Avatar name={s._kel_name} size="sm"/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:600,color:"var(--ink)"}}>{s._kel_name}</div>
                  <div style={{fontSize:11.5,color:"var(--muted)"}}>{s._jenis_name} · {S.BULAN_ID[s.bulan-1]} {s.tahun} · {s.metode_pembayaran}</div>
                </div>
                <div className="tab-num" style={{fontSize:13,fontWeight:700,color:"var(--success)"}}>
                  +{fmt(s.nominal)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Rekap Bulanan ─────────────────────────────────────────────────────────
function RekapBulanan({ currency }) {
  const S = window.STM;
  const [bulan, setBulan] = React.useState(5);
  const [tahun, setTahun] = React.useState(2026);
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
            <h3>Rekap Setoran {S.BULAN_ID_FULL[bulan-1]} {tahun}</h3>
            <div className="muted" style={{fontSize:12}}>Akumulasi setoran tabungan untuk periode terpilih</div>
          </div>
          <div className="card-hd-actions" style={{gap:8,flexWrap:"wrap"}}>
            <select className="select" style={{width:130}} value={bulan} onChange={e => setBulan(Number(e.target.value))}>
              {S.BULAN_ID_FULL.map((b,i) => <option key={i} value={i+1}>{b}</option>)}
            </select>
            <select className="select" style={{width:100}} value={tahun} onChange={e => setTahun(Number(e.target.value))}>
              {[2024,2025,2026].map(y => <option key={y}>{y}</option>)}
            </select>
            <button className="btn btn-sec btn-sm"><Icon name="file_excel" size={14}/> Excel</button>
            <button className="btn btn-dark btn-sm"><Icon name="file_pdf" size={14}/> PDF</button>
          </div>
        </div>

        <div className="card-pad" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,borderBottom:"1px solid var(--line)"}}>
          <div>
            <div className="stat-lbl">Total Masuk</div>
            <div className="stat-val tab-num" style={{fontSize:22}}>{fmtC(total)}</div>
          </div>
          <div>
            <div className="stat-lbl">Transaksi</div>
            <div className="stat-val tab-num" style={{fontSize:22}}>{pays.length}</div>
          </div>
          <div>
            <div className="stat-lbl">Anggota Setor</div>
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
                <th style={{textAlign:"right"}}>Total Setor</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={4 + S.JENIS_IURAN.length}><div className="empty-state">
                  <Icon name="receipt" size={28}/>
                  <div>Belum ada setoran pada periode ini.</div>
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
  const [tahun, setTahun] = React.useState(2026);
  const fmt = (v) => S.formatCurrency(v, currency);
  const fmtC = (v) => S.formatCurrencyCompact(v, currency);

  const perBulan = S.pemasukanBulanan(tahun);
  const total = perBulan.reduce((a,b) => a + b, 0);
  const perJenis = S.pemasukanPerJenis(tahun);
  const allYears = S.pemasukanPerTahun();

  // running balance untuk line chart
  const running = (() => {
    let acc = 0;
    return perBulan.map(v => { if (v > 0) acc += v; return acc; });
  })();

  return (
    <div className="grid" style={{gap:16}}>
      <div className="card">
        <div className="card-hd">
          <div>
            <h3>Rekap Tahunan {tahun}</h3>
            <div className="muted" style={{fontSize:12}}>Komparasi setoran bulanan & breakdown jenis tabungan</div>
          </div>
          <div className="card-hd-actions">
            <select className="select" style={{width:100}} value={tahun} onChange={e => setTahun(Number(e.target.value))}>
              {[2024,2025,2026].map(y => <option key={y}>{y}</option>)}
            </select>
            <button className="btn btn-sec btn-sm"><Icon name="file_excel" size={14}/> Excel</button>
            <button className="btn btn-dark btn-sm"><Icon name="file_pdf" size={14}/> PDF</button>
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
          <div style={{fontSize:11,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".06em",fontWeight:600,marginBottom:6}}>Setoran per Bulan</div>
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
            <div className="muted" style={{fontSize:12}}>Total setoran per tahun</div>
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

Object.assign(window, { InputPembayaran, RekapBulanan, RekapTahunan });
