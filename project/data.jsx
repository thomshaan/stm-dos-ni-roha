// Dummy data — Sistem Tabungan STM Dos Ni Roha (savings-only)

const MARGA = [
  "Marpaung","Sitorus","Simanjuntak","Hutabarat","Hutahaean",
  "Pasaribu","Panggabean","Siregar","Tobing","Aritonang",
  "Manurung","Silalahi","Simbolon","Nainggolan","Tampubolon",
  "Hutapea","Lubis","Sianturi","Pakpahan","Sihotang",
  "Sinaga","Damanik","Saragih","Purba","Tarigan",
  "Sembiring","Ginting","Sitanggang","Sihombing","Napitupulu",
  "Marbun","Lumbantobing","Pardede","Simatupang","Siahaan",
  "Sagala","Sitompul","Hutagalung","Hutagaol","Lumban Gaol",
];
const FIRST = [
  "Bonar","Marsada","Tigor","Parlin","Jansen","Robert","Daud",
  "Hotma","Tumpal","Domu","Sahala","Mangihut","Berton","Hasudungan",
  "Marolop","Sintong","Manogu","Pardomuan","Sutan","Sahat",
  "Posma","Tahi","Marudut","Binsar","Toga","Maruli","Parmonangan",
  "Maruba","Halomoan","Mangaratua","Anggiat","Tongam","Rolas",
  "Marojahan","Saur","Bona","Parlindungan","Jonggi","Marasi",
];
// Hanya kategori tabungan
const JENIS_IURAN = [
  { id_jenis: 1, nama_jenis: "Tabungan Pokok",    nominal_default: 25000, tipe: "tabungan" },
  { id_jenis: 2, nama_jenis: "Tabungan Sukarela", nominal_default: 20000, tipe: "tabungan" },
  { id_jenis: 3, nama_jenis: "Dana Bersama",      nominal_default: 10000, tipe: "tabungan" },
];

const USERS = [
  { id_user: 1, nama: "Robert Marpaung",   username: "robert.m",   role: "admin",     last_login: "2026-05-18 08:12" },
  { id_user: 2, nama: "Tiurma Sitorus",    username: "tiurma.s",   role: "bendahara", last_login: "2026-05-18 07:40" },
  { id_user: 3, nama: "Pdt. Daud Hutapea", username: "daud.h",     role: "admin",     last_login: "2026-05-15 19:08" },
  { id_user: 4, nama: "Maruli Panggabean", username: "maruli.p",   role: "bendahara", last_login: "2026-05-12 11:24" },
];

const METODE = ["Tunai","Transfer","QRIS"];

function mulberry32(seed){
  return function(){
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(20260518);
const pick = (arr) => arr[Math.floor(rng() * arr.length)];
const rint = (a,b) => Math.floor(rng() * (b - a + 1)) + a;

// 60 keluarga (tanpa sektor)
const KELUARGA = (() => {
  const out = [];
  const usedNames = new Set();
  for (let i = 1; i <= 60; i++) {
    let name;
    let attempts = 0;
    do {
      name = `${pick(FIRST)} ${pick(MARGA)}`;
      attempts++;
    } while (usedNames.has(name) && attempts < 20);
    usedNames.add(name);
    const noHp = `0812${rint(1000,9999)}${rint(1000,9999)}`;
    const status = rng() < 0.92 ? "aktif" : "nonaktif";
    const monthsAgo = rint(2, 96);
    const join = new Date(2026, 4, 1);
    join.setMonth(join.getMonth() - monthsAgo);
    out.push({
      id_keluarga: i,
      no_anggota: `STM-${String(i).padStart(3,'0')}`,
      kepala_keluarga: name,
      no_hp: noHp,
      status,
      tanggal_gabung: join.toISOString().slice(0,10),
    });
  }
  return out;
})();

// Setoran tabungan 18 bulan terakhir — frekuensi natural, tanpa konsep wajib/tunggakan
const PEMBAYARAN = (() => {
  const out = [];
  let id = 1;
  const TODAY = new Date(2026, 4, 18);
  const months = [];
  for (let k = 17; k >= 0; k--) {
    const d = new Date(TODAY.getFullYear(), TODAY.getMonth() - k, 1);
    months.push({ bulan: d.getMonth() + 1, tahun: d.getFullYear() });
  }
  for (const kel of KELUARGA) {
    if (kel.status !== "aktif") continue;
    const frequency = 0.65 + rng() * 0.30; // 65–95% bulan disetor
    for (const m of months) {
      for (const j of JENIS_IURAN) {
        const isCurrent = m.bulan === TODAY.getMonth() + 1 && m.tahun === TODAY.getFullYear();
        const baseProb = j.id_jenis === 1 ? frequency : frequency * 0.75;
        const prob = isCurrent ? baseProb * 0.55 : baseProb;
        if (rng() > prob) continue;
        let nominal = j.nominal_default;
        if (rng() < 0.22) {
          const variance = [-5000, 5000, 10000, 15000, -2500, 5000, 25000][rint(0,6)];
          nominal = Math.max(5000, nominal + variance);
        }
        const day = isCurrent ? rint(1, TODAY.getDate()) : rint(2, 28);
        const tanggal = `${m.tahun}-${String(m.bulan).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
        out.push({
          id_pembayaran: id++,
          id_keluarga: kel.id_keluarga,
          id_jenis: j.id_jenis,
          bulan: m.bulan,
          tahun: m.tahun,
          nominal,
          tanggal_bayar: tanggal,
          metode_pembayaran: rng() < 0.6 ? "Tunai" : rng() < 0.85 ? "Transfer" : "QRIS",
          keterangan: rng() < 0.08 ? "Disetor via koordinator" : "",
          dicatat_oleh: pick(USERS).nama,
        });
      }
    }
  }
  return out;
})();

const AKTIVITAS = (() => {
  const verbs = [
    { v:"Mencatat setoran",        t:"payment" },
    { v:"Menambah anggota",         t:"create"  },
    { v:"Memperbarui data anggota", t:"update"  },
    { v:"Mengubah jenis tabungan",  t:"update"  },
    { v:"Login",                    t:"auth"    },
    { v:"Export laporan PDF",       t:"export"  },
    { v:"Export Excel",             t:"export"  },
    { v:"Menonaktifkan anggota",    t:"warn"    },
  ];
  const out = [];
  const TODAY = new Date(2026, 4, 18, 9, 12);
  let cursor = new Date(TODAY);
  for (let i = 0; i < 24; i++) {
    cursor = new Date(cursor.getTime() - rint(8, 240) * 60 * 1000);
    const v = pick(verbs);
    const u = pick(USERS);
    let detail = "";
    if (v.t === "payment") {
      const k = pick(KELUARGA);
      const j = pick(JENIS_IURAN);
      detail = `${k.kepala_keluarga} — ${j.nama_jenis} Mei 2026`;
    } else if (v.t === "create" || v.t === "warn") {
      detail = pick(KELUARGA).kepala_keluarga;
    } else if (v.t === "update") {
      detail = rng() < 0.5 ? pick(KELUARGA).kepala_keluarga : "Nominal Dana Bersama";
    } else if (v.t === "export") {
      detail = "Rekap Bulanan April 2026";
    } else {
      detail = "Sesi web";
    }
    out.push({
      id: i + 1,
      waktu: cursor.toISOString().slice(0,16).replace("T"," "),
      user: u.nama,
      aksi: v.v,
      detail,
      tipe: v.t,
    });
  }
  return out;
})();

// ── Helpers ────────────────────────────────────────────────────────────────
const BULAN_ID = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
const BULAN_ID_FULL = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

function formatCurrency(n, mode = "rp") {
  const abs = Math.abs(Math.round(n));
  const grouped = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const sign = n < 0 ? "-" : "";
  if (mode === "idr") return `${sign}IDR ${grouped}`;
  return `${sign}Rp ${grouped}`;
}
function formatCurrencyCompact(n, mode = "rp") {
  const abs = Math.abs(n);
  const prefix = mode === "idr" ? "IDR " : "Rp ";
  const sign = n < 0 ? "-" : "";
  if (abs >= 1e9) return `${sign}${prefix}${(abs/1e9).toFixed(1).replace(/\.0$/,"")}M`;
  if (abs >= 1e6) return `${sign}${prefix}${(abs/1e6).toFixed(1).replace(/\.0$/,"")}jt`;
  if (abs >= 1e3) return `${sign}${prefix}${(abs/1e3).toFixed(0)}rb`;
  return `${sign}${prefix}${abs}`;
}
function avatarColor(name) {
  const palette = ["#b8694a","#9a5638","#7a8c4d","#4a6f8a","#8a6e3f","#7a4f37","#6a5a7a","#a37049"];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}
function initials(name) {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] || "") + (parts[parts.length-1]?.[0] || "");
}

// ── Aggregations ───────────────────────────────────────────────────────────
function pembayaranByKeluarga(idKel) {
  return PEMBAYARAN.filter(p => p.id_keluarga === idKel);
}
function totalKeluarga(idKel) {
  return pembayaranByKeluarga(idKel).reduce((s,p) => s + p.nominal, 0);
}
function pembayaranBulan(bulan, tahun) {
  return PEMBAYARAN.filter(p => p.bulan === bulan && p.tahun === tahun);
}
function pemasukanBulanan(tahun) {
  const arr = new Array(12).fill(0);
  for (const p of PEMBAYARAN) {
    if (p.tahun === tahun) arr[p.bulan - 1] += p.nominal;
  }
  return arr;
}
function pemasukanPerJenis(tahun, bulan = null) {
  const map = {};
  for (const j of JENIS_IURAN) map[j.id_jenis] = 0;
  for (const p of PEMBAYARAN) {
    if (p.tahun !== tahun) continue;
    if (bulan && p.bulan !== bulan) continue;
    map[p.id_jenis] += p.nominal;
  }
  return JENIS_IURAN.map(j => ({ jenis: j, total: map[j.id_jenis] }));
}
function pemasukanPerTahun() {
  const map = {};
  for (const p of PEMBAYARAN) {
    map[p.tahun] = (map[p.tahun] || 0) + p.nominal;
  }
  return Object.entries(map).map(([t,v]) => ({ tahun: Number(t), total: v }))
    .sort((a,b) => a.tahun - b.tahun);
}

Object.assign(window, {
  STM: {
    KELUARGA, JENIS_IURAN, PEMBAYARAN, USERS, AKTIVITAS,
    METODE, BULAN_ID, BULAN_ID_FULL,
    formatCurrency, formatCurrencyCompact,
    avatarColor, initials,
    pembayaranByKeluarga, totalKeluarga, pembayaranBulan,
    pemasukanBulanan, pemasukanPerJenis, pemasukanPerTahun,
  }
});
