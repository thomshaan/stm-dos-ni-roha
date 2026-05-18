// Root app — routing, tweaks panel, font + theme application.
const { ToastHost, useTweaks, TweaksPanel, TweakSection, TweakColor, TweakRadio, TweakSelect,
        Sidebar, Topbar, Icon, Dashboard, Keluarga, InputPembayaran,
        RekapBulanan, RekapTahunan, JenisIuran, UsersAdmin, Aktivitas, PrintPreview } = window;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "palette": ["#b8694a", "#7a8c4d", "#4a6f8a"],
  "density": "cozy",
  "sidebar": "expanded",
  "currency": "rp",
  "font": "Plus Jakarta Sans"
}/*EDITMODE-END*/;

const PALETTES = {
  "Terracotta · Olive · Indigo": { value: ["#b8694a","#7a8c4d","#4a6f8a"], accent:"#b8694a",accent2:"#9a5638",accentSoft:"#f2d9c8",success:"#6f8a3f",sidebar:"#2a1d12",sidebar2:"#3a281a",bg:"#f6efe1",bg2:"#faf5e9",ink:"#2a1d12",line:"#e6d9bd",line2:"#efe4ca" },
  "Burgundy · Sage · Cream":     { value: ["#9a3b3b","#7a8c4d","#e8dbc1"], accent:"#9a3b3b",accent2:"#7c2e2e",accentSoft:"#f0d4d4",success:"#6f8a3f",sidebar:"#2a1818",sidebar2:"#3c2424",bg:"#f5ece0",bg2:"#faf3e8",ink:"#2a1818",line:"#e6d6c0",line2:"#efe2cc" },
  "Coffee · Caramel · Mocha":    { value: ["#8b5a2b","#c8893a","#3a2818"], accent:"#8b5a2b",accent2:"#6e4220",accentSoft:"#ecd6b8",success:"#6f8a3f",sidebar:"#241712",sidebar2:"#34241c",bg:"#f5ebd9",bg2:"#fbf2e3",ink:"#241712",line:"#e4d4b4",line2:"#ede0c4" },
  "Forest · Moss · Stone":       { value: ["#4d6b3a","#7a8c4d","#3a3528"], accent:"#4d6b3a",accent2:"#3a5429",accentSoft:"#d5e0c2",success:"#6f8a3f",sidebar:"#1f2418",sidebar2:"#2c3422",bg:"#f1eee0",bg2:"#f7f4e8",ink:"#22281b",line:"#dcd8c3",line2:"#e5e2d0" },
};
const PALETTE_NAMES = Object.keys(PALETTES);

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [route, setRoute] = React.useState("dashboard");
  const [search, setSearch] = React.useState("");
  const [presetKeluarga, setPresetKeluarga] = React.useState(null);

  // Apply theme via inline style on :root
  React.useEffect(() => {
    const match = Object.entries(PALETTES).find(([_, p]) =>
      JSON.stringify(p.value) === JSON.stringify(t.palette));
    const p = match ? match[1] : PALETTES[PALETTE_NAMES[0]];
    const r = document.documentElement.style;
    r.setProperty("--accent", p.accent);
    r.setProperty("--accent-2", p.accent2);
    r.setProperty("--accent-soft", p.accentSoft);
    r.setProperty("--success", p.success);
    r.setProperty("--sidebar", p.sidebar);
    r.setProperty("--sidebar-2", p.sidebar2);
    r.setProperty("--bg", p.bg);
    r.setProperty("--bg-2", p.bg2);
    r.setProperty("--ink", p.ink);
    r.setProperty("--line", p.line);
    r.setProperty("--line-2", p.line2);
  }, [t.palette]);

  React.useEffect(() => {
    document.documentElement.style.setProperty("--font", `'${t.font}', ui-sans-serif, system-ui, sans-serif`);
  }, [t.font]);

  const goAddPayment = (kel) => {
    setPresetKeluarga(kel);
    setRoute("input");
  };

  const titles = {
    dashboard: ["Dashboard", "Ringkasan saldo tabungan & tren setoran"],
    keluarga:  ["Daftar Keluarga", "Anggota terdaftar pada STM Dos Ni Roha"],
    input:     ["Input Setoran", "Catat setoran tabungan anggota"],
    "rekap-bulan": ["Rekap Bulanan", "Setoran agregat per bulan"],
    "rekap-tahun": ["Rekap Tahunan", "Perbandingan tahunan & multi-tahun"],
    print:     ["Cetak / Export", "Pratinjau laporan A4 & ekspor file"],
    jenis:     ["Jenis Tabungan", "Konfigurasi kategori setoran"],
    users:     ["User & Pengurus", "Akses sistem admin & bendahara"],
    aktivitas: ["Riwayat Aktivitas", "Audit log aksi pengurus"],
  };
  const [title, crumb] = titles[route] || titles.dashboard;

  const renderScreen = () => {
    switch (route) {
      case "dashboard": return <Dashboard setRoute={setRoute} currency={t.currency}/>;
      case "keluarga":  return <Keluarga search={search} setSearch={setSearch} currency={t.currency} onAddPayment={goAddPayment}/>;
      case "input":     return <InputPembayaran presetKeluarga={presetKeluarga} currency={t.currency}/>;
      case "rekap-bulan": return <RekapBulanan currency={t.currency}/>;
      case "rekap-tahun": return <RekapTahunan currency={t.currency}/>;
      case "print":     return <PrintPreview currency={t.currency}/>;
      case "jenis":     return <JenisIuran currency={t.currency}/>;
      case "users":     return <UsersAdmin/>;
      case "aktivitas": return <Aktivitas/>;
      default:          return <Dashboard setRoute={setRoute} currency={t.currency}/>;
    }
  };

  const sidebarShowSearch = route === "keluarga";
  const cyclePalette = () => {
    const i = PALETTE_NAMES.findIndex(n => JSON.stringify(PALETTES[n].value) === JSON.stringify(t.palette));
    const next = PALETTES[PALETTE_NAMES[(i + 1) % PALETTE_NAMES.length]].value;
    setTweak("palette", next);
  };

  return (
    <ToastHost>
      <div className="app" data-sidebar={t.sidebar} data-density={t.density}>
        <Sidebar route={route} setRoute={(r) => { setRoute(r); if (r !== "input") setPresetKeluarga(null); }}/>
        <div className="main">
          <Topbar
            title={title}
            crumb={crumb}
            onToggleSidebar={() => setTweak("sidebar", t.sidebar === "expanded" ? "collapsed" : "expanded")}
            search={sidebarShowSearch ? search : null}
            onSearch={sidebarShowSearch ? setSearch : null}
            rightSlot={
              <>
                <button className="tb-icon-btn" onClick={cyclePalette} aria-label="Ganti tema" title="Ganti tema warna">
                  <span style={{display:"inline-flex",gap:2}}>
                    {t.palette.slice(0,3).map((c,i) => <span key={i} style={{width:8,height:14,borderRadius:2,background:c}}/>)}
                  </span>
                </button>
                <button className="btn btn-primary btn-sm"
                        onClick={() => { setPresetKeluarga(null); setRoute("input"); }}>
                  <Icon name="plus" size={14}/> Catat Setoran
                </button>
              </>
            }
          />
          <main className="content">{renderScreen()}</main>
        </div>
      </div>

      <TweaksPanel>
        <TweakSection label="Tema">
          <TweakColor label="Palette" value={t.palette}
                      options={PALETTE_NAMES.map(n => PALETTES[n].value)}
                      onChange={(v) => setTweak("palette", v)}/>
        </TweakSection>
        <TweakSection label="Tata Letak">
          <TweakRadio label="Sidebar" value={t.sidebar}
                      options={[
                        {value:"expanded",label:"Full"},
                        {value:"iconOnly",label:"Ikon"},
                      ]}
                      onChange={(v) => setTweak("sidebar", v)}/>
          <TweakRadio label="Density Tabel" value={t.density}
                      options={[
                        {value:"cozy",label:"Cozy"},
                        {value:"compact",label:"Compact"},
                      ]}
                      onChange={(v) => setTweak("density", v)}/>
        </TweakSection>
        <TweakSection label="Format & Tipografi">
          <TweakRadio label="Mata Uang" value={t.currency}
                      options={[
                        {value:"rp",label:"Rp"},
                        {value:"idr",label:"IDR"},
                      ]}
                      onChange={(v) => setTweak("currency", v)}/>
          <TweakSelect label="Font" value={t.font}
                       options={["Plus Jakarta Sans","Inter","Manrope"]}
                       onChange={(v) => setTweak("font", v)}/>
        </TweakSection>
      </TweaksPanel>
    </ToastHost>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
