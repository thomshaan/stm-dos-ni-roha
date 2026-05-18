// Shared shell components: icons, sidebar, topbar, toasts, modal, charts, table primitives.
// All globals exported at the bottom for cross-file Babel scoping.

// ── Icons ────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 18, color = "currentColor", strokeWidth = 1.7 }) => {
  const paths = {
    dashboard: <><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></>,
    users: <><circle cx="9" cy="8" r="3.5"/><path d="M3 20c0-3 3-5 6-5s6 2 6 5"/><circle cx="16.5" cy="9" r="2.5"/><path d="M14 14c2 0 5 1.5 5 4"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    receipt: <><path d="M5 3h14v18l-3-2-3 2-2-2-3 2-3-2V3z"/><path d="M9 8h6M9 12h6M9 16h4"/></>,
    chart: <><path d="M4 20V8M10 20V4M16 20v-7M22 20H2"/></>,
    pie: <><path d="M12 3a9 9 0 1 0 9 9h-9V3z"/><path d="M14 3.2A9 9 0 0 1 20.8 10H14V3.2z"/></>,
    alert: <><path d="M12 3 2 21h20L12 3z"/><path d="M12 10v5M12 18.5v.01"/></>,
    book: <><path d="M4 4h12a4 4 0 0 1 4 4v13H8a4 4 0 0 1-4-4V4z"/><path d="M4 17a4 4 0 0 1 4-4h12"/></>,
    tag: <><path d="M3 12V4h8l10 10-8 8L3 12z"/><circle cx="7.5" cy="7.5" r="1.2"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></>,
    history: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5"/><path d="M12 8v5l3 2"/></>,
    print: <><rect x="6" y="3" width="12" height="6"/><rect x="3" y="9" width="18" height="9" rx="1.5"/><rect x="6" y="14" width="12" height="7"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></>,
    bell: <><path d="M6 16V11a6 6 0 0 1 12 0v5l2 3H4l2-3z"/><path d="M10 19a2 2 0 0 0 4 0"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .4 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></>,
    chev: <><path d="m9 6 6 6-6 6"/></>,
    chev_down: <><path d="m6 9 6 6 6-6"/></>,
    sort: <><path d="m7 4 0 16M3 16l4 4 4-4M17 20l0-16M13 8l4-4 4 4"/></>,
    sort_up: <><path d="m6 14 6-6 6 6"/></>,
    sort_down: <><path d="m6 10 6 6 6-6"/></>,
    download: <><path d="M12 3v13m-5-5 5 5 5-5"/><path d="M4 21h16"/></>,
    file_excel: <><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="m9 13 6 6M15 13l-6 6"/></>,
    file_pdf: <><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M8 17v-4h1.5a1.5 1.5 0 0 1 0 3H8m4 1v-4h1.5a1.5 1.5 0 0 1 1.5 1.5v1A1.5 1.5 0 0 1 13.5 17H12m4-4h2m-2 0v4m0-2h1.5"/></>,
    check: <><path d="m5 12 5 5L20 7"/></>,
    x: <><path d="M6 6l12 12M18 6 6 18"/></>,
    panel_left: <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/></>,
    money: <><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M6 10v.01M18 14v.01"/></>,
    trending: <><path d="m3 17 6-6 4 4 8-8"/><path d="M14 7h7v7"/></>,
    edit: <><path d="M14 4 4 14v6h6L20 10z"/><path d="m13 5 6 6"/></>,
    trash: <><path d="M4 7h16M9 7V4h6v3m1 0v13H8V7"/></>,
    eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></>,
    filter: <><path d="M3 4h18l-7 9v7l-4-2v-5L3 4z"/></>,
    sektor: <><path d="m3 7 9-4 9 4-9 4-9-4z"/><path d="m3 12 9 4 9-4M3 17l9 4 9-4"/></>,
    arrowUp: <><path d="m6 14 6-6 6 6"/></>,
    arrowDown: <><path d="m6 10 6 6 6-6"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke={color} strokeWidth={strokeWidth}
         strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
};

// ── Sidebar ──────────────────────────────────────────────────────────────
const NAV = [
  { section: "Utama" },
  { id: "dashboard",   label: "Dashboard",            icon: "dashboard" },
  { id: "keluarga",    label: "Daftar Keluarga",      icon: "users" },
  { id: "input",       label: "Input Setoran",        icon: "plus" },
  { section: "Laporan" },
  { id: "rekap-bulan", label: "Rekap Bulanan",        icon: "receipt" },
  { id: "rekap-tahun", label: "Rekap Tahunan",        icon: "chart" },
  { id: "print",       label: "Cetak / Export",       icon: "print" },
  { section: "Administrasi" },
  { id: "jenis",       label: "Jenis Tabungan",       icon: "tag" },
  { id: "users",       label: "User & Pengurus",      icon: "user" },
  { id: "aktivitas",   label: "Riwayat Aktivitas",    icon: "history" },
];

function Sidebar({ route, setRoute }) {
  return (
    <aside className="sidebar">
      <div className="sb-brand">
        <div className="sb-mark">SD</div>
        <div>
          <div className="sb-name">STM Dos Ni Roha</div>
          <div className="sb-sub">Admin Panel</div>
        </div>
      </div>
      {NAV.map((item, i) => {
        if (item.section) return <div key={`s${i}`} className="sb-section">{item.section}</div>;
        const active = route === item.id;
        return (
          <div key={item.id} className="sb-item" data-active={active ? "1" : "0"}
               onClick={() => setRoute(item.id)} title={item.label}>
            <span className="sb-ico"><Icon name={item.icon} size={18}/></span>
            <span className="sb-label">{item.label}</span>
          </div>
        );
      })}
      <div className="sb-foot">
        <div className="sb-avatar">RM</div>
        <div style={{minWidth:0,flex:1}}>
          <div className="sb-user-name">Robert Marpaung</div>
          <div className="sb-user-role">Administrator</div>
        </div>
      </div>
    </aside>
  );
}

// ── Topbar ───────────────────────────────────────────────────────────────
function Topbar({ title, crumb, onToggleSidebar, search, onSearch, rightSlot }) {
  return (
    <header className="topbar">
      <button className="tb-icon-btn" onClick={onToggleSidebar} aria-label="Toggle sidebar">
        <Icon name="panel_left" size={17}/>
      </button>
      <div>
        <div className="tb-title">{title}</div>
        {crumb && <div className="tb-crumb">{crumb}</div>}
      </div>
      <div className="tb-spacer"/>
      {onSearch != null && (
        <div className="tb-search">
          <Icon name="search" size={15} color="var(--muted)"/>
          <input value={search || ""} onChange={(e) => onSearch(e.target.value)}
                 placeholder="Cari nama, no. anggota…"/>
        </div>
      )}
      {rightSlot}
      <button className="tb-icon-btn" aria-label="Notifikasi">
        <Icon name="bell" size={17}/>
        <span className="dot"/>
      </button>
    </header>
  );
}

// ── Toast ────────────────────────────────────────────────────────────────
const ToastCtx = React.createContext(() => {});
const useToast = () => React.useContext(ToastCtx);

function ToastHost({ children }) {
  const [items, setItems] = React.useState([]);
  const push = React.useCallback((t) => {
    const id = Math.random().toString(36).slice(2);
    setItems((xs) => [...xs, { id, kind: "info", ...t }]);
    setTimeout(() => setItems((xs) => xs.filter(x => x.id !== id)), t.duration || 3200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toast-stack">
        {items.map(t => (
          <div key={t.id} className={`toast ${t.kind}`}>
            <Icon name={t.kind === "success" ? "check" : t.kind === "error" ? "alert" : "bell"} size={16}/>
            <div>
              <b>{t.title}</b>
              {t.body && <small>{t.body}</small>}
            </div>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

// ── Modal ────────────────────────────────────────────────────────────────
function Modal({ open, onClose, title, subtitle, children, footer, width }) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{width: width || undefined}} onClick={e => e.stopPropagation()}>
        <div className="modal-hd">
          <div>
            <div style={{fontSize:16,fontWeight:700,letterSpacing:"-0.01em"}}>{title}</div>
            {subtitle && <div style={{fontSize:12.5,color:"var(--muted)",marginTop:2}}>{subtitle}</div>}
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Tutup">
            <Icon name="x" size={16}/>
          </button>
        </div>
        <div className="modal-bd">{children}</div>
        {footer && <div className="modal-ft">{footer}</div>}
      </div>
    </div>
  );
}

// ── Charts ───────────────────────────────────────────────────────────────
function BarChart({ data, labels, height = 220, formatY, accent = "var(--accent)", softAccent = "var(--accent-soft)" }) {
  const W = 720, H = height;
  const padL = 50, padR = 12, padT = 14, padB = 28;
  const max = Math.max(1, ...data);
  const niceMax = Math.ceil(max / 5e5) * 5e5;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const bw = innerW / data.length * 0.62;
  const gap = (innerW / data.length) * 0.38;
  const [hover, setHover] = React.useState(null);
  const yticks = 4;
  return (
    <div style={{position:"relative"}}>
      <svg className="chart-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        {/* Y axis */}
        {Array.from({length: yticks + 1}).map((_,i) => {
          const v = (niceMax / yticks) * i;
          const y = padT + innerH - (v / niceMax) * innerH;
          return (
            <g key={i}>
              <line className="chart-grid" x1={padL} x2={W-padR} y1={y} y2={y}/>
              <text className="chart-axis" x={padL - 8} y={y + 3} textAnchor="end">
                {formatY ? formatY(v) : v}
              </text>
            </g>
          );
        })}
        {data.map((v,i) => {
          const x = padL + (innerW / data.length) * i + gap / 2;
          const h = niceMax === 0 ? 0 : (v / niceMax) * innerH;
          const y = padT + innerH - h;
          const hi = hover === i;
          return (
            <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={x} y={padT} width={bw} height={innerH} fill="transparent"/>
              <rect x={x} y={y} width={bw} height={h} rx={4} ry={4}
                    fill={hi ? "var(--accent-2)" : accent}/>
              <text className="chart-axis" x={x + bw/2} y={H - 10} textAnchor="middle">{labels[i]}</text>
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <div className="tooltip"
             style={{left: `calc(${(padL + (innerW / data.length) * hover + gap/2 + bw/2) / W * 100}% - 50px)`,
                     top: `${(padT + innerH - (data[hover] / niceMax) * innerH) / H * 100}%`,
                     transform:"translateY(-130%)"}}>
          <b>{labels[hover]}</b> · {formatY ? formatY(data[hover]) : data[hover]}
        </div>
      )}
    </div>
  );
}

function LineChart({ data, labels, height = 220, formatY }) {
  const W = 720, H = height;
  const padL = 50, padR = 12, padT = 14, padB = 28;
  const max = Math.max(1, ...data);
  const niceMax = Math.ceil(max / 5e5) * 5e5;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const pts = data.map((v,i) => {
    const x = padL + (innerW / Math.max(1, data.length - 1)) * i;
    const y = padT + innerH - (v / niceMax) * innerH;
    return { x, y, v, i };
  });
  const pathD = pts.map((p,i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const areaD = `${pathD} L${pts[pts.length-1].x.toFixed(1)} ${padT + innerH} L${pts[0].x.toFixed(1)} ${padT + innerH} Z`;
  const [hover, setHover] = React.useState(null);
  const yticks = 4;
  return (
    <div style={{position:"relative"}}>
      <svg className="chart-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="chartAreaFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.22"/>
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0"/>
          </linearGradient>
        </defs>
        {Array.from({length: yticks + 1}).map((_,i) => {
          const v = (niceMax / yticks) * i;
          const y = padT + innerH - (v / niceMax) * innerH;
          return (
            <g key={i}>
              <line className="chart-grid" x1={padL} x2={W-padR} y1={y} y2={y}/>
              <text className="chart-axis" x={padL - 8} y={y + 3} textAnchor="end">{formatY ? formatY(v) : v}</text>
            </g>
          );
        })}
        <path className="chart-area" d={areaD}/>
        <path className="chart-line" d={pathD}/>
        {pts.map((p) => (
          <g key={p.i} onMouseEnter={() => setHover(p.i)} onMouseLeave={() => setHover(null)}>
            <circle className="chart-dot" cx={p.x} cy={p.y} r={4}/>
            <rect x={p.x - 18} y={padT} width={36} height={innerH} fill="transparent"/>
            <text className="chart-axis" x={p.x} y={H - 10} textAnchor="middle">{labels[p.i]}</text>
          </g>
        ))}
      </svg>
      {hover !== null && (
        <div className="tooltip"
             style={{left: `calc(${pts[hover].x / W * 100}% - 50px)`,
                     top: `${pts[hover].y / H * 100}%`,
                     transform:"translateY(-160%)"}}>
          <b>{labels[hover]}</b> · {formatY ? formatY(data[hover]) : data[hover]}
        </div>
      )}
    </div>
  );
}

function DonutChart({ slices, total, formatY, size = 200 }) {
  const r = (size - 28) / 2;
  const c = size / 2;
  const C = 2 * Math.PI * r;
  let acc = 0;
  const palette = ["#b8694a","#7a8c4d","#4a6f8a","#c8893a","#9a5638"];
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
      <circle cx={c} cy={c} r={r} fill="none" stroke="var(--line-2)" strokeWidth="22"/>
      {slices.map((s,i) => {
        const frac = total === 0 ? 0 : s.value / total;
        const dash = frac * C;
        const off = -acc * C;
        acc += frac;
        return (
          <circle key={i} cx={c} cy={c} r={r} fill="none"
                  stroke={palette[i % palette.length]} strokeWidth="22"
                  strokeDasharray={`${dash} ${C - dash}`}
                  strokeDashoffset={off}
                  transform={`rotate(-90 ${c} ${c})`}
                  strokeLinecap="butt"/>
        );
      })}
      <text x={c} y={c - 2} textAnchor="middle" fontSize="11"
            fill="var(--muted)" fontFamily="var(--font)" fontWeight="500">Total</text>
      <text x={c} y={c + 16} textAnchor="middle" fontSize="15.5"
            fill="var(--ink)" fontFamily="var(--font)" fontWeight="700"
            style={{fontVariantNumeric:"tabular-nums"}}>
        {formatY ? formatY(total) : total}
      </text>
    </svg>
  );
}

// ── Table primitives ─────────────────────────────────────────────────────
function SortHeader({ label, field, sort, setSort, align = "left", numeric }) {
  const active = sort.field === field;
  const dir = active ? sort.dir : null;
  return (
    <th data-sortable="1" data-sort={active ? dir : null}
        style={{textAlign: align, cursor:"pointer"}}
        onClick={() => setSort({ field, dir: active && dir === "asc" ? "desc" : "asc" })}>
      <span style={{display:"inline-flex",alignItems:"center",gap:4, justifyContent: align === "right" ? "flex-end" : "flex-start"}}>
        {label}
        <span className="sort-ico">
          {!active ? <Icon name="sort" size={12}/> : dir === "asc" ? <Icon name="sort_up" size={12}/> : <Icon name="sort_down" size={12}/>}
        </span>
      </span>
    </th>
  );
}

function sortBy(arr, field, dir) {
  if (!field) return arr;
  const sign = dir === "asc" ? 1 : -1;
  return [...arr].sort((a,b) => {
    const av = a[field], bv = b[field];
    if (typeof av === "number" && typeof bv === "number") return (av - bv) * sign;
    return String(av).localeCompare(String(bv), "id") * sign;
  });
}

function Pager({ page, setPage, total, perPage }) {
  const pages = Math.max(1, Math.ceil(total / perPage));
  const nums = [];
  const win = 2;
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || (i >= page - win && i <= page + win)) nums.push(i);
    else if (nums[nums.length-1] !== "…") nums.push("…");
  }
  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(total, page * perPage);
  return (
    <div className="pager">
      <div>Menampilkan <b className="tab-num" style={{color:"var(--ink)"}}>{from}–{to}</b> dari <b className="tab-num" style={{color:"var(--ink)"}}>{total}</b></div>
      <div className="pager-pages">
        <button disabled={page === 1} onClick={() => setPage(page - 1)}>‹</button>
        {nums.map((n,i) => n === "…"
          ? <button key={i} disabled>…</button>
          : <button key={i} data-active={n === page ? "1" : "0"} onClick={() => setPage(n)}>{n}</button>)}
        <button disabled={page === pages} onClick={() => setPage(page + 1)}>›</button>
      </div>
    </div>
  );
}

// ── Avatar ───────────────────────────────────────────────────────────────
function Avatar({ name, size = "md" }) {
  const { avatarColor, initials } = window.STM;
  return (
    <div className={`avatar ${size === "sm" ? "sm" : ""}`}
         style={{background: avatarColor(name)}}>
      {initials(name).toUpperCase()}
    </div>
  );
}

// Export to window for cross-script use
Object.assign(window, {
  Icon, Sidebar, Topbar, ToastHost, useToast, Modal,
  BarChart, LineChart, DonutChart,
  SortHeader, sortBy, Pager, Avatar,
});
