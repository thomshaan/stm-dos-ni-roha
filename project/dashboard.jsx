// Dashboard — savings-focused (no compliance/tunggakan)
const { Icon, BarChart, LineChart, DonutChart, Avatar } = window;

function Dashboard({ setRoute, currency }) {
  const S = window.STM;
  const TODAY = { tahun: 2026, bulan: 5 };
  const fmt = (v) => S.formatCurrency(v, currency);
  const fmtCompact = (v) => S.formatCurrencyCompact(v, currency);

  const aktif = S.KELUARGA.filter(k => k.status === "aktif").length;
  const nonaktif = S.KELUARGA.length - aktif;

  const bulanIni = S.pembayaranBulan(TODAY.bulan, TODAY.tahun);
  const totalBulanIni = bulanIni.reduce((s,p) => s + p.nominal, 0);
  const bulanLalu = S.pembayaranBulan(TODAY.bulan - 1, TODAY.tahun);
  const totalBulanLalu = bulanLalu.reduce((s,p) => s + p.nominal, 0);
  const growth = totalBulanLalu === 0 ? 0 : ((totalBulanIni - totalBulanLalu) / totalBulanLalu) * 100;

  const saldoTotal = S.PEMBAYARAN.reduce((s,p) => s + p.nominal, 0);
  const rataRata = aktif === 0 ? 0 : saldoTotal / aktif;
  const transaksiBulanIni = bulanIni.length;
  const anggotaSetorBulanIni = new Set(bulanIni.map(p => p.id_keluarga)).size;

  // 12 bulan terakhir
  const months12 = [];
  for (let k = 11; k >= 0; k--) {
    const d = new Date(TODAY.tahun, TODAY.bulan - 1 - k, 1);
    months12.push({ bulan: d.getMonth() + 1, tahun: d.getFullYear() });
  }
  const incomeBars = months12.map(m =>
    S.PEMBAYARAN.filter(p => p.bulan === m.bulan && p.tahun === m.tahun).reduce((s,p) => s + p.nominal, 0)
  );
  const incomeLabels = months12.map(m => `${S.BULAN_ID[m.bulan-1]}${m.bulan === 1 ? " '" + String(m.tahun).slice(2) : ""}`);

  // Saldo tabungan kumulatif (running balance)
  const tahunan = (() => {
    let acc = 0;
    return months12.map((m,i) => { acc += incomeBars[i]; return acc; });
  })();

  // Per jenis donut (bulan ini)
  const perJenis = S.pemasukanPerJenis(TODAY.tahun, TODAY.bulan);
  const donutTotal = perJenis.reduce((s,p) => s + p.total, 0);

  // Top penabung
  const totalsPerKel = S.KELUARGA.filter(k => k.status === "aktif").map(k => ({
    k, total: S.totalKeluarga(k.id_keluarga)
  })).sort((a,b) => b.total - a.total);
  const topKontrib = totalsPerKel.slice(0, 8);
  const topMax = topKontrib[0]?.total || 1;

  // Setoran terakhir (30 terakhir)
  const recent = [...S.PEMBAYARAN].sort((a,b) => b.tanggal_bayar.localeCompare(a.tanggal_bayar)).slice(0,6);

  return (
    <div className="grid" style={{gap:20}}>
      {/* Stat cards */}
      <div className="grid grid-4">
        <div className="card stat">
          <div className="stat-hd">
            <div className="stat-lbl">Anggota Aktif</div>
            <div className="stat-ico"><Icon name="users" size={16}/></div>
          </div>
          <div className="stat-val">{aktif}<span style={{fontSize:14,color:"var(--muted)",fontWeight:500}}> / {S.KELUARGA.length}</span></div>
          <div className="stat-sub">
            <span className="stat-trend up"><Icon name="arrowUp" size={10}/> 2 baru</span>
            <span>· {nonaktif} non-aktif</span>
          </div>
        </div>

        <div className="card stat">
          <div className="stat-hd">
            <div className="stat-lbl">Saldo Tabungan</div>
            <div className="stat-ico green"><Icon name="money" size={16}/></div>
          </div>
          <div className="stat-val">{fmtCompact(saldoTotal)}</div>
          <div className="stat-sub">
            <span>Akumulasi seluruh waktu</span>
          </div>
        </div>

        <div className="card stat">
          <div className="stat-hd">
            <div className="stat-lbl">Setoran Mei 2026</div>
            <div className="stat-ico"><Icon name="trending" size={16}/></div>
          </div>
          <div className="stat-val">{fmtCompact(totalBulanIni)}</div>
          <div className="stat-sub">
            <span className={`stat-trend ${growth >= 0 ? "up" : "down"}`}>
              <Icon name={growth >= 0 ? "arrowUp" : "arrowDown"} size={10}/>
              {Math.abs(growth).toFixed(1)}%
            </span>
            <span>vs April · {anggotaSetorBulanIni} anggota</span>
          </div>
        </div>

        <div className="card stat">
          <div className="stat-hd">
            <div className="stat-lbl">Rata-rata Saldo / Anggota</div>
            <div className="stat-ico warn"><Icon name="receipt" size={16}/></div>
          </div>
          <div className="stat-val">{fmtCompact(rataRata)}</div>
          <div className="stat-sub">
            <span>{transaksiBulanIni} transaksi bulan ini</span>
          </div>
        </div>
      </div>

      {/* Chart row 1 */}
      <div className="grid" style={{gridTemplateColumns:"1.6fr 1fr",gap:20}}>
        <div className="card">
          <div className="card-hd">
            <div>
              <h3>Setoran 12 Bulan Terakhir</h3>
              <div className="muted" style={{fontSize:12}}>Total setoran per bulan</div>
            </div>
            <div className="card-hd-actions">
              <span className="badge badge-accent"><span className="badge-dot"/> {fmtCompact(incomeBars.reduce((a,b)=>a+b,0))} total</span>
            </div>
          </div>
          <div className="chart-wrap">
            <BarChart data={incomeBars} labels={incomeLabels} height={240} formatY={fmtCompact}/>
          </div>
        </div>

        <div className="card">
          <div className="card-hd">
            <div>
              <h3>Setoran per Jenis · Mei</h3>
              <div className="muted" style={{fontSize:12}}>Breakdown kategori tabungan</div>
            </div>
          </div>
          <div style={{padding:"10px 18px 18px",display:"flex",alignItems:"center",gap:18}}>
            <DonutChart slices={perJenis.map(p => ({label: p.jenis.nama_jenis, value: p.total}))}
                        total={donutTotal} formatY={fmtCompact} size={180}/>
            <div className="legend" style={{flexDirection:"column",gap:9}}>
              {perJenis.map((p,i) => {
                const palette = ["#b8694a","#7a8c4d","#4a6f8a","#c8893a","#9a5638"];
                const pct = donutTotal === 0 ? 0 : Math.round(p.total / donutTotal * 100);
                return (
                  <div className="legend-item" key={i} style={{justifyContent:"space-between",width:"100%"}}>
                    <span style={{display:"flex",alignItems:"center",gap:8}}>
                      <span className="legend-sw" style={{background:palette[i]}}/>
                      <span>{p.jenis.nama_jenis}</span>
                    </span>
                    <span className="muted tab-num" style={{fontSize:11.5}}>{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Chart row 2 — saldo kumulatif + top penabung */}
      <div className="grid" style={{gridTemplateColumns:"1.3fr 1fr",gap:20}}>
        <div className="card">
          <div className="card-hd">
            <div>
              <h3>Pertumbuhan Saldo Tabungan</h3>
              <div className="muted" style={{fontSize:12}}>Saldo berjalan 12 bulan terakhir</div>
            </div>
          </div>
          <div className="chart-wrap">
            <LineChart data={tahunan} labels={incomeLabels} height={240} formatY={fmtCompact}/>
          </div>
        </div>

        <div className="card">
          <div className="card-hd">
            <div>
              <h3>Top Penabung</h3>
              <div className="muted" style={{fontSize:12}}>Akumulasi seluruh waktu</div>
            </div>
            <div className="card-hd-actions">
              <button className="btn btn-ghost btn-sm" onClick={() => setRoute("keluarga")}>Semua</button>
            </div>
          </div>
          <div style={{padding:"4px 18px 14px"}}>
            {topKontrib.map((t,i) => {
              const pct = (t.total / topMax) * 100;
              return (
                <div key={t.k.id_keluarga} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0"}}>
                  <div style={{fontSize:11,color:"var(--muted)",width:14,textAlign:"center",fontWeight:700}}>{i+1}</div>
                  <Avatar name={t.k.kepala_keluarga} size="sm"/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12.5,fontWeight:600,color:"var(--ink)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.k.kepala_keluarga}</div>
                    <div style={{height:5,background:"var(--surface-2)",borderRadius:3,marginTop:3,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${pct}%`,background:"var(--accent)",borderRadius:3}}/>
                    </div>
                  </div>
                  <div className="tab-num" style={{fontSize:12,fontWeight:700,whiteSpace:"nowrap"}}>{fmtCompact(t.total)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 3: setoran terakhir + aktivitas */}
      <div className="grid" style={{gridTemplateColumns:"1fr 1fr",gap:20}}>
        <div className="card">
          <div className="card-hd">
            <div>
              <h3>Setoran Terbaru</h3>
              <div className="muted" style={{fontSize:12}}>6 transaksi terakhir</div>
            </div>
            <div className="card-hd-actions">
              <button className="btn btn-ghost btn-sm" onClick={() => setRoute("input")}>Catat</button>
            </div>
          </div>
          <div style={{padding:"6px 8px 10px"}}>
            {recent.map(p => {
              const k = S.KELUARGA.find(x => x.id_keluarga === p.id_keluarga);
              const j = S.JENIS_IURAN.find(x => x.id_jenis === p.id_jenis);
              return (
                <div key={p.id_pembayaran} style={{display:"flex",alignItems:"center",gap:12,padding:"9px 14px"}}>
                  <Avatar name={k?.kepala_keluarga || ""} size="sm"/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:600,color:"var(--ink)"}}>{k?.kepala_keluarga}</div>
                    <div style={{fontSize:11.5,color:"var(--muted)"}}>{j?.nama_jenis} · {p.tanggal_bayar} · {p.metode_pembayaran}</div>
                  </div>
                  <div className="tab-num" style={{fontSize:13,fontWeight:700,color:"var(--success)"}}>+{fmt(p.nominal)}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <div className="card-hd">
            <div>
              <h3>Aktivitas Terbaru</h3>
              <div className="muted" style={{fontSize:12}}>Catatan pengurus hari ini</div>
            </div>
            <div className="card-hd-actions">
              <button className="btn btn-ghost btn-sm" onClick={() => setRoute("aktivitas")}>Semua</button>
            </div>
          </div>
          <div style={{padding:"6px 8px 10px"}}>
            {S.AKTIVITAS.slice(0,6).map(a => {
              const iconMap = { payment:"money", create:"plus", update:"edit", auth:"user", export:"download", warn:"alert" };
              return (
                <div key={a.id} style={{display:"flex",alignItems:"flex-start",gap:12,padding:"9px 14px"}}>
                  <div style={{width:30,height:30,borderRadius:8,background:"var(--surface-2)",display:"grid",placeItems:"center",color:"var(--accent)",flexShrink:0}}>
                    <Icon name={iconMap[a.tipe] || "history"} size={14}/>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,color:"var(--ink-2)"}}>
                      <b style={{color:"var(--ink)"}}>{a.user}</b> {a.aksi.toLowerCase()}
                    </div>
                    <div style={{fontSize:11.5,color:"var(--muted)",marginTop:2}}>{a.detail}</div>
                  </div>
                  <div style={{fontSize:11,color:"var(--muted)",whiteSpace:"nowrap"}}>{a.waktu.slice(11)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Dashboard });
