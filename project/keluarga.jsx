// Daftar keluarga + detail modal (savings-only, no sektor).
const { Icon, Avatar, SortHeader, sortBy, Pager, Modal, BarChart } = window;

function Keluarga({ search, setSearch, currency, onAddPayment }) {
  const S = window.STM;
  const [statusFilter, setStatusFilter] = React.useState("Semua");
  const [sort, setSort] = React.useState({ field: "no_anggota", dir: "asc" });
  const [page, setPage] = React.useState(1);
  const perPage = 10;
  const [detail, setDetail] = React.useState(null);
  const fmt = (v) => S.formatCurrency(v, currency);

  const filtered = React.useMemo(() => {
    let arr = S.KELUARGA;
    if (statusFilter !== "Semua") arr = arr.filter(k => k.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      arr = arr.filter(k =>
        k.kepala_keluarga.toLowerCase().includes(q) ||
        k.no_anggota.toLowerCase().includes(q)
      );
    }
    return arr;
  }, [search, statusFilter]);

  const withTotals = React.useMemo(() => filtered.map(k => ({
    ...k,
    total: S.totalKeluarga(k.id_keluarga),
    setoran_count: S.pembayaranByKeluarga(k.id_keluarga).length,
    last_pay: (() => {
      const ps = S.pembayaranByKeluarga(k.id_keluarga);
      if (!ps.length) return "—";
      return ps.map(p => p.tanggal_bayar).sort().pop();
    })(),
  })), [filtered]);

  const sorted = sortBy(withTotals, sort.field, sort.dir);
  const pageRows = sorted.slice((page - 1) * perPage, page * perPage);

  React.useEffect(() => { setPage(1); }, [search, statusFilter]);

  return (
    <>
      <div className="card">
        <div className="card-hd">
          <div>
            <h3>Daftar Keluarga · {filtered.length} anggota</h3>
            <div className="muted" style={{fontSize:12}}>Klik baris untuk membuka detail & riwayat setoran</div>
          </div>
          <div className="card-hd-actions">
            <select className="select" style={{width:140,padding:"7px 32px 7px 12px"}}
                    value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option>Semua</option>
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Non-aktif</option>
            </select>
            <button className="btn btn-primary btn-sm" onClick={() => onAddPayment(null)}>
              <Icon name="plus" size={14}/> Anggota Baru
            </button>
          </div>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <SortHeader label="No. Anggota" field="no_anggota" sort={sort} setSort={setSort}/>
                <SortHeader label="Kepala Keluarga" field="kepala_keluarga" sort={sort} setSort={setSort}/>
                <th>Kontak</th>
                <SortHeader label="Status" field="status" sort={sort} setSort={setSort}/>
                <SortHeader label="Setoran" field="setoran_count" sort={sort} setSort={setSort} align="right"/>
                <SortHeader label="Saldo Tabungan" field="total" sort={sort} setSort={setSort} align="right"/>
                <SortHeader label="Setoran Terakhir" field="last_pay" sort={sort} setSort={setSort}/>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 && (
                <tr><td colSpan={8}><div className="empty-state">
                  <Icon name="search" size={32}/>
                  <div>Tidak ada anggota yang cocok dengan filter.</div>
                </div></td></tr>
              )}
              {pageRows.map(k => (
                <tr key={k.id_keluarga} className="clickable" onClick={() => setDetail(k)}>
                  <td><span className="tab-num" style={{fontWeight:600,color:"var(--ink)"}}>{k.no_anggota}</span></td>
                  <td>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <Avatar name={k.kepala_keluarga} size="sm"/>
                      <div>
                        <div style={{fontWeight:600,color:"var(--ink)"}}>{k.kepala_keluarga}</div>
                        <div style={{fontSize:11.5,color:"var(--muted)"}} className="tab-num">Bergabung {k.tanggal_gabung}</div>
                      </div>
                    </div>
                  </td>
                  <td className="tab-num" style={{fontSize:12.5}}>{k.no_hp}</td>
                  <td>
                    {k.status === "aktif"
                      ? <span className="badge badge-green"><span className="badge-dot"/>Aktif</span>
                      : <span className="badge badge-neutral"><span className="badge-dot"/>Non-aktif</span>}
                  </td>
                  <td className="tbl-num">{k.setoran_count}</td>
                  <td className="tbl-num"><b>{fmt(k.total)}</b></td>
                  <td className="tab-num" style={{fontSize:12.5}}>{k.last_pay}</td>
                  <td>
                    <button className="btn btn-sec btn-sm" onClick={(e) => { e.stopPropagation(); onAddPayment(k); }}>
                      <Icon name="plus" size={12}/> Setor
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pager page={page} setPage={setPage} total={filtered.length} perPage={perPage}/>
      </div>

      <KeluargaDetailModal keluarga={detail} onClose={() => setDetail(null)} currency={currency}
                           onAddPayment={onAddPayment}/>
    </>
  );
}

function KeluargaDetailModal({ keluarga, onClose, currency, onAddPayment }) {
  const S = window.STM;
  const fmt = (v) => S.formatCurrency(v, currency);
  if (!keluarga) return null;
  const pays = S.pembayaranByKeluarga(keluarga.id_keluarga)
    .sort((a,b) => b.tanggal_bayar.localeCompare(a.tanggal_bayar));
  const total = pays.reduce((s,p) => s + p.nominal, 0);
  const perJenis = {};
  for (const j of S.JENIS_IURAN) perJenis[j.id_jenis] = 0;
  for (const p of pays) perJenis[p.id_jenis] += p.nominal;

  const TODAY = { tahun: 2026, bulan: 5 };
  const months12 = [];
  for (let k = 11; k >= 0; k--) {
    const d = new Date(TODAY.tahun, TODAY.bulan - 1 - k, 1);
    months12.push({ bulan: d.getMonth() + 1, tahun: d.getFullYear() });
  }
  const bars = months12.map(m => pays.filter(p => p.bulan === m.bulan && p.tahun === m.tahun).reduce((s,p) => s + p.nominal, 0));
  const labels = months12.map(m => S.BULAN_ID[m.bulan-1]);

  return (
    <Modal open={!!keluarga} onClose={onClose} title={keluarga.kepala_keluarga}
           subtitle={`${keluarga.no_anggota} · Bergabung ${keluarga.tanggal_gabung}`}
           width="960px"
           footer={<>
             <button className="btn btn-ghost" onClick={onClose}>Tutup</button>
             <button className="btn btn-primary" onClick={() => { onClose(); onAddPayment(keluarga); }}>
               <Icon name="plus" size={14}/> Catat Setoran
             </button>
           </>}>
      <div className="grid" style={{gridTemplateColumns:"260px 1fr",gap:24,marginBottom:18}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
            <div style={{width:54,height:54,borderRadius:12,background:S.avatarColor(keluarga.kepala_keluarga),color:"#fff",display:"grid",placeItems:"center",fontSize:18,fontWeight:700}}>
              {S.initials(keluarga.kepala_keluarga).toUpperCase()}
            </div>
            <div>
              <div style={{fontSize:11,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".06em",fontWeight:600}}>Saldo Tabungan</div>
              <div style={{fontSize:22,fontWeight:700,letterSpacing:"-0.01em"}} className="tab-num">{fmt(total)}</div>
            </div>
          </div>
          <dl className="kv">
            <dt>No. Anggota</dt><dd>{keluarga.no_anggota}</dd>
            <dt>No. HP</dt><dd className="tab-num">{keluarga.no_hp}</dd>
            <dt>Status</dt><dd>
              {keluarga.status === "aktif"
                ? <span className="badge badge-green"><span className="badge-dot"/>Aktif</span>
                : <span className="badge badge-neutral"><span className="badge-dot"/>Non-aktif</span>}
            </dd>
            <dt>Bergabung</dt><dd>{keluarga.tanggal_gabung}</dd>
            <dt>Total Setoran</dt><dd className="tab-num">{pays.length} kali</dd>
          </dl>
          <div className="divider"/>
          <div style={{fontSize:11,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".06em",fontWeight:600,marginBottom:8}}>Breakdown per Jenis</div>
          {S.JENIS_IURAN.map(j => (
            <div key={j.id_jenis} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",fontSize:13}}>
              <span style={{color:"var(--ink-2)"}}>{j.nama_jenis}</span>
              <b className="tab-num">{fmt(perJenis[j.id_jenis] || 0)}</b>
            </div>
          ))}
        </div>
        <div>
          <div style={{fontSize:11,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".06em",fontWeight:600,marginBottom:6}}>Setoran 12 Bulan Terakhir</div>
          <BarChart data={bars} labels={labels} height={160} formatY={(v) => S.formatCurrencyCompact(v, currency)}/>
          <div style={{fontSize:11,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".06em",fontWeight:600,marginTop:14,marginBottom:6}}>
            Riwayat Setoran ({pays.length})
          </div>
          <div style={{maxHeight:280,overflowY:"auto",border:"1px solid var(--line)",borderRadius:10}}>
            <table className="tbl tbl-noborder">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Jenis</th>
                  <th>Periode</th>
                  <th>Metode</th>
                  <th style={{textAlign:"right"}}>Nominal</th>
                </tr>
              </thead>
              <tbody>
                {pays.slice(0, 30).map(p => {
                  const j = S.JENIS_IURAN.find(x => x.id_jenis === p.id_jenis);
                  return (
                    <tr key={p.id_pembayaran}>
                      <td className="tab-num">{p.tanggal_bayar}</td>
                      <td>{j?.nama_jenis}</td>
                      <td className="tab-num">{S.BULAN_ID[p.bulan-1]} {p.tahun}</td>
                      <td><span className="badge badge-neutral" style={{fontSize:10.5}}>{p.metode_pembayaran}</span></td>
                      <td className="tbl-num"><b>{fmt(p.nominal)}</b></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Modal>
  );
}

Object.assign(window, { Keluarga });
