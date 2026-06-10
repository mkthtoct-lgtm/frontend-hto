import { createContext, useContext, useEffect, useMemo, useState } from "react";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://api.hto.edu.vn/api/v1";

// ─── STATIC DATA (chart trend – backend chưa có endpoint) ────────────────────
const PERIOD_OPTIONS = [
  { id: "day",     label: "Ngày",  caption: "03/06/2026" },
  { id: "month",   label: "Tháng", caption: "Tháng 06/2026" },
  { id: "quarter", label: "Quý",   caption: "Quý II/2026" },
  { id: "year",    label: "Năm",   caption: "Năm 2026" },
];

const STATIC_TREND = {
  day: {
    trend: [
      { label: "08:00", done: 4,   files: 3,   processing: 8,  events: 1 },
      { label: "10:00", done: 9,   files: 7,   processing: 11, events: 2 },
      { label: "12:00", done: 15,  files: 12,  processing: 13, events: 2 },
      { label: "14:00", done: 23,  files: 18,  processing: 16, events: 3 },
      { label: "16:00", done: 31,  files: 26,  processing: 17, events: 3 },
      { label: "18:00", done: 37,  files: 31,  processing: 18, events: 4 },
    ],
  },
  month: {
    trend: [
      { label: "Tuần 1", done: 32,  files: 21,  processing: 24, events: 4  },
      { label: "Tuần 2", done: 68,  files: 49,  processing: 42, events: 8  },
      { label: "Tuần 3", done: 121, files: 91,  processing: 63, events: 13 },
      { label: "Tuần 4", done: 186, files: 142, processing: 86, events: 19 },
    ],
  },
  quarter: {
    trend: [
      { label: "Tháng 4", done: 156, files: 118, processing: 52,  events: 13 },
      { label: "Tháng 5", done: 362, files: 276, processing: 109, events: 31 },
      { label: "Tháng 6", done: 548, files: 421, processing: 164, events: 46 },
    ],
  },
  year: {
    trend: [
      { label: "T1", done: 132,  files: 96,   processing: 34,  events: 8   },
      { label: "T2", done: 296,  files: 214,  processing: 72,  events: 19  },
      { label: "T3", done: 521,  files: 402,  processing: 106, events: 36  },
      { label: "T4", done: 884,  files: 689,  margin:0, processing: 178, events: 65  },
      { label: "T5", done: 1510, files: 1184, processing: 326, events: 121 },
      { label: "T6", done: 2148, files: 1682, processing: 438, events: 168 },
    ],
  },
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const formatNumber = (value) =>
  value != null ? Number(value).toLocaleString("vi-VN") : "—";

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
};

const getStatusLabel = (status) => {
  const map = {
    active:   "Hoạt động",
    inactive: "Không hoạt động",
    draft:    "Nháp",
    pending:  "Chờ duyệt",
    suspended:"Đình chỉ",
  };
  return map[status] || status;
};

// ─── DARK MODE DETECTION ─────────────────────────────────────────────────────
function useDarkMode() {
  const isDark = () =>
    document.documentElement.getAttribute("data-bs-theme") === "dark" ||
    window.localStorage.getItem("app-theme") === "dark";

  const [dark, setDark] = useState(isDark);

  useEffect(() => {
    // Vue set data-bs-theme ngay lập tức khi toggle — fire không delay
    const obs = new MutationObserver(() => setDark(isDark()));
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-bs-theme"],
    });
    return () => obs.disconnect();
  }, []);

  return dark;
}

function makeTokens(dark) {
  return {
    blue:       "#2563eb",
    blueSoft:   "rgba(37,99,235,.09)",
    blueMid:    "rgba(37,99,235,.28)",
    green:      "#059669",
    greenSoft:  "rgba(5,150,105,.09)",
    amber:      "#d97706",
    amberSoft:  "rgba(217,119,6,.09)",
    cyan:       "#0284c7",
    cyanSoft:   "rgba(2,132,199,.09)",
    violet:     "#7c3aed",
    rose:       "#e11d48",
    roseSoft:   "rgba(225,29,72,.09)",

    ink:         dark ? "#f1f5f9"  : "#0f172a",
    inkMid:      dark ? "#cbd5e1"  : "#334155",
    inkMuted:    dark ? "#94a3b8"  : "#64748b",
    inkFaint:    dark ? "#64748b"  : "#94a3b8",
    surface:     dark ? "#1e293b"  : "#ffffff",
    surfaceSub:  dark ? "#0f172a"  : "#f8fafc",
    border:      dark ? "#334155"  : "#e2e8f0",
    borderFaint: dark ? "#1e293b"  : "#f1f5f9",
    bg:          dark ? "#0f172a"  : "#f1f5f9",

    statusGreenBg: dark ? "rgba(5,150,105,.15)"  : "#ecfdf5",
    statusAmberBg: dark ? "rgba(217,119,6,.15)"  : "#fffbeb",

    r:    "14px",
    rSm:  "9px",
    rXs:  "6px",
    sh:   dark
      ? "0 1px 2px rgba(0,0,0,.3), 0 4px 16px rgba(0,0,0,.4)"
      : "0 1px 2px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.09)",
    shSm: "0 1px 2px rgba(0,0,0,.05)",
  };
}

function makeTone(T) {
  return {
    "text-primary": { color: T.blue,  soft: T.blueSoft,  mid: "rgba(37,99,235,.3)"  },
    "text-success": { color: T.green, soft: T.greenSoft, mid: "rgba(5,150,105,.3)"  },
    "text-warning": { color: T.amber, soft: T.amberSoft, mid: "rgba(217,119,6,.3)"  },
    "text-info":    { color: T.cyan,  soft: T.cyanSoft,  mid: "rgba(2,132,199,.3)"  },
  };
}

// Static fallback (light) — dùng cho constant ngoài component
const T = makeTokens(false);

// ─── GLOBAL STYLES ───────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght=400;500;600;700;800&display=swap');
  * { box-sizing: border-box; }
  body { font-family: 'Inter', system-ui, sans-serif; }

  .dash-root {
    --dash-ink:          #0f172a;
    --dash-ink-mid:      #334155;
    --dash-ink-muted:    #64748b;
    --dash-ink-faint:    #94a3b8;
    --dash-surface:      #ffffff;
    --dash-surface-sub:  #f8fafc;
    --dash-border:       #e2e8f0;
    --dash-border-faint: #f1f5f9;
    --dash-bg:           #f1f5f9;
    --dash-status-green-bg: #ecfdf5;
    --dash-status-amber-bg: #fffbeb;
  }

  /* CẬP NHẬT: Định nghĩa lại biến Dark Mode và ép các tầng Layout cha đổi màu nền */
  .dark, [data-theme="dark"], .dark .dash-root, [data-theme="dark"] .dash-root {
    --dash-ink:          #f1f5f9 !important;
    --dash-ink-mid:      #cbd5e1 !important;
    --dash-ink-muted:    #94a3b8 !important;
    --dash-ink-faint:    #64748b !important;
    --dash-surface:      #1e293b !important;
    --dash-surface-sub:  #0f172a !important;
    --dash-border:       #334155 !important;
    --dash-border-faint: #1e293b !important;
    --dash-bg:           #0f172a !important;
    --dash-status-green-bg: rgba(5,150,105,.15) !important;
    --dash-status-amber-bg: rgba(217,119,6,.15) !important;
  }

  /* CẬP NHẬT: Ép các class chứa nội dung chính của Layout cha cũng phải ăn theo màu tối */
  .dark body, [data-theme="dark"] body,
  .dark .main-content, [data-theme="dark"] .main-content,
  .dark .content, [data-theme="dark"] .content,
  .dark .wrapper, [data-theme="dark"] .wrapper,
  .dark main, [data-theme="dark"] main {
    background-color: #0f172a !important;
    color: #f1f5f9 !important;
  }

  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
  .dash-fadein { animation: fadeUp .35s ease both; }

  .dash-btn-period {
    padding: 5px 14px; border-radius: 8px; font-size: 12px; font-weight: 600;
    cursor: pointer; border: 1.5px solid var(--dash-border); background: transparent;
    color: var(--dash-ink-mid); transition: all .15s ease; letter-spacing: .01em;
  }
  .dash-btn-period:hover { border-color: #2563eb; color: #2563eb; }
  .dash-btn-period.active { background: #2563eb; border-color: #2563eb; color: #fff; }

  .dash-milestone-btn {
    padding: 3px 11px; border-radius: 7px; font-size: 11px; font-weight: 600;
    cursor: pointer; border: 1.5px solid var(--dash-border); background: transparent;
    color: var(--dash-ink-mid); transition: all .15s ease;
  }
  .dash-milestone-btn:hover { border-color: #2563eb; color: #2563eb; }
  .dash-milestone-btn.active { background: #2563eb; border-color: #2563eb; color: #fff; }

  .dash-link-viewall {
    font-size: 11px; font-weight: 700; color: #2563eb; background: none; border: none;
    cursor: pointer; padding: 4px 8px; border-radius: 6px; transition: all .15s ease;
    display: flex; align-items: center; gap: 4px; text-transform: uppercase; letter-spacing: .02em;
  }
  .dash-link-viewall:hover { background: rgba(37,99,235,.08); color: #1d4ed8; }

  .dash-row-hover:hover { background: var(--dash-surface-sub) !important; }
  .dash-act-row:not(:last-child) { border-bottom: 1px solid var(--dash-border-faint); }

  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--dash-border); border-radius: 999px; }
`;

function GlobalStyles() {
  return <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />;
}

// ─── THEME CONTEXT ────────────────────────────────────────────────────────────
const ThemeCtx = createContext(T);
const useT = () => useContext(ThemeCtx);

// ─── LOADING / ERROR / ACCESS ─────────────────────────────────────────────────
function LoadingSpinner() {
  const T = useT();
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"100px 0", gap:"14px" }}>
      <div style={{ width:"40px", height:"40px", borderRadius:"50%", border:`3px solid ${T.blueMid}`, borderTopColor:T.blue, animation:"spin .75s linear infinite" }} />
      <span style={{ fontSize:"13px", color:T.inkFaint, letterSpacing:".01em" }}>Đang tải dữ liệu...</span>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  const T = useT();
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"100px 0", textAlign:"center", gap:"12px" }}>
      <div style={{ width:"52px", height:"52px", borderRadius:"50%", background:T.roseSoft, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill={T.rose}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
      </div>
      <div style={{ fontWeight:700, fontSize:"15px", color:T.ink }}>Không thể tải dữ liệu</div>
      <p style={{ fontSize:"13px", color:T.inkMuted, maxWidth:"300px", margin:0 }}>{message}</p>
      <button onClick={onRetry} style={{ marginTop:"4px", padding:"8px 22px", borderRadius:T.rSm, background:T.blue, color:"#fff", border:"none", fontWeight:600, fontSize:"13px", cursor:"pointer" }}>
        Thử lại
      </button>
    </div>
  );
}

function AccessDenied() {
  const T = useT();
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"100px 0", textAlign:"center", gap:"12px" }}>
      <div style={{ width:"52px", height:"52px", borderRadius:"50%", background:T.amberSoft, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill={T.amber}><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1 14l-3-3 1.41-1.41L11 12.17l4.59-4.58L17 9l-6 6z"/></svg>
      </div>
      <div style={{ fontWeight:700, fontSize:"15px", color:T.ink }}>Không có quyền truy cập</div>
      <p style={{ fontSize:"13px", color:T.inkMuted, maxWidth:"360px", margin:0 }}>
        Tài khoản chưa được cấp quyền xem Dashboard. Liên hệ quản trị viên để được cấp quyền{" "}
        <code style={{ background:T.surfaceSub, padding:"1px 5px", borderRadius:"4px", fontSize:"11px" }}>dashboard:view</code>.
      </p>
    </div>
  );
}

// ─── CARD WRAPPER ─────────────────────────────────────────────────────────────
function Card({ children, style = {} }) {
  const T = useT();
  return (
    <div style={{ background: T.surface, borderRadius: T.r, boxShadow: T.sh, border: `1px solid ${T.borderFaint}`, ...style }}>
      {children}
    </div>
  );
}

// ─── CARD HEADER ──────────────────────────────────────────────────────────────
function CardHeader({ icon, title, right }) {
  const T = useT();
  return (
    <div style={{ padding:"16px 20px 0", display:"flex", alignItems:"center", justifyContent:"space-between", minHeight:"42px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:"8px", minWidth:0 }}>
        {icon && <span style={{ display:"flex", opacity:.75, flexShrink:0 }}>{icon}</span>}
        <span style={{ fontSize:"11px", fontWeight:700, letterSpacing:".07em", textTransform:"uppercase", color:T.inkMuted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{title}</span>
      </div>
      {right && <div style={{ flexShrink:0 }}>{right}</div>}
    </div>
  );
}

function CardBody({ children, style = {} }) {
  return <div style={{ padding:"14px 20px 20px", ...style }}>{children}</div>;
}

// ─── KPI CARD ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, change, caption, tone, trend, metricKey }) {
  const T = useT();
  const TONE = makeTone(T);
  const t = TONE[tone] || TONE["text-primary"];
  const maxValue = Math.max(...(trend || []).map((item) => item[metricKey] ?? 0), 1);
  const points = (trend || []).map((item, index) => {
    const x = trend.length === 1 ? 0 : index * (280 / (trend.length - 1));
    const y = 52 - ((item[metricKey] ?? 0) / maxValue) * 40;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="dash-fadein" style={{ background: T.surface, borderRadius: T.r, boxShadow: T.sh, border: `1px solid ${T.borderFaint}`, overflow:"hidden", display:"flex", flexDirection:"column" }}>
      <div style={{ height:"3px", background: `linear-gradient(90deg, ${t.color}, ${t.mid})` }} />
      <div style={{ padding:"18px 18px 0", display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"10px" }}>
        <div style={{ minWidth:0 }}>
          <span style={{ fontSize:"11px", fontWeight:600, letterSpacing:".05em", textTransform:"uppercase", color:T.inkFaint, display:"block", marginBottom:"7px" }}>{label}</span>
          <div style={{ fontSize:"28px", fontWeight:800, color:T.ink, lineHeight:1, letterSpacing:"-.02em" }}>
            {value != null ? formatNumber(value) : <span style={{ display:"inline-block", width:"72px", height:"28px", background:T.surfaceSub, borderRadius:"6px" }} />}
          </div>
          <span style={{ fontSize:"11px", fontWeight:500, color:t.color, display:"block", marginTop:"5px" }}>
            {change}{caption ? <span style={{ color:T.inkFaint, fontWeight:400 }}> {caption}</span> : null}
          </span>
        </div>
        <div style={{ width:"38px", height:"38px", borderRadius:"10px", background:t.soft, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill={t.color}><path d="M3 17h2.75l3.5-4.5 3 3.5L19 7.5V11h2V4h-7v2h3.52l-5.35 6.74-3-3.5L3 17Z"/></svg>
        </div>
      </div>
      {trend && (
        <svg viewBox="0 0 280 56" style={{ width:"100%", height:"44px", display:"block", marginTop:"auto" }}>
          <defs>
            <linearGradient id={`kg-${metricKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={t.color} stopOpacity=".15"/>
              <stop offset="100%" stopColor={t.color} stopOpacity="0"/>
            </linearGradient>
          </defs>
          <polygon points={`${points} 280,56 0,56`} fill={`url(#kg-${metricKey})`}/>
          <polyline points={points} fill="none" stroke={t.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </div>
  );
}

// ─── DONUT CHART ─────────────────────────────────────────────────────────────
function DonutChart({ data, selectedIndex }) {
  const T = useT();
  const [hovered, setHovered] = useState(null);
  const point = data[Math.min(selectedIndex, data.length - 1)];

  const SLICES = [
    { key:"done",       color:T.blue,  label:"Hoàn thành"  },
    { key:"files",      color:T.green, label:"Hồ sơ xử lý" },
    { key:"processing", color:T.amber, label:"Đang xử lý"  },
    { key:"events",     color:T.cyan,  label:"Sự kiện"     },
  ];

  const total = SLICES.reduce((s, sl) => s + (point[sl.key] || 0), 0) || 1;

  const SIZE = 320;
  const CX = SIZE / 2, CY = SIZE / 2;
  const R = 128, INNER = 78;
  const toRad = (deg) => (deg - 90) * Math.PI / 180;
  const px = (r, deg) => CX + r * Math.cos(toRad(deg));
  const py = (r, deg) => CY + r * Math.sin(toRad(deg));

  const arcPath = (s, e, r, ri) => {
    if (e - s >= 359.9) {
      return [
        `M ${px(ri, s)} ${py(ri, s)}`,
        `A ${ri} ${ri} 0 1 1 ${px(ri, s + 180)} ${py(ri, s + 180)}`,
        `A ${ri} ${ri} 0 1 1 ${px(ri, s)} ${py(ri, s)}`,
        `L ${px(r, s)} ${py(r, s)}`,
        `A ${r} ${r} 0 1 0 ${px(r, s + 180)} ${py(r, s + 180)}`,
        `A ${r} ${r} 0 1 0 ${px(r, s)} ${py(r, s)}`,
        "Z",
      ].join(" ");
    }
    const large = e - s > 180 ? 1 : 0;
    return [
      `M ${px(ri, s)} ${py(ri, s)}`,
      `A ${ri} ${ri} 0 ${large} 1 ${px(ri, e)} ${py(ri, e)}`,
      `L ${px(r, e)} ${py(r, e)}`,
      `A ${r} ${r} 0 ${large} 0 ${px(r, s)} ${py(r, s)}`,
      "Z",
    ].join(" ");
  };

  let cursor = 0;
  const arcs = SLICES.map((sl) => {
    const pct = (point[sl.key] || 0) / total;
    const sweep = pct * 360;
    const start = cursor;
    const end = cursor + sweep;
    cursor = end;
    return { ...sl, start, end, pct, val: point[sl.key] || 0 };
  });

  const activeSlice = hovered !== null ? arcs[hovered] : null;

  return (
    <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
      <div style={{ flexShrink:0, width:SIZE, height:SIZE }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ display:"block", overflow:"visible" }}>
          <circle cx={CX} cy={CY} r={(R+INNER)/2} fill="none" stroke={T.borderFaint} strokeWidth={R-INNER} />
          {arcs.map((arc, i) => {
            const isHov = hovered === i;
            const GAP = 1.2;
            const r  = isHov ? R  + 8 : R;
            const ri = isHov ? INNER - 8 : INNER;
            if (arc.end - arc.start < 0.5) return null;
            return (
              <path
                key={arc.key}
                d={arcPath(arc.start + GAP, arc.end - GAP, r, ri)}
                fill={arc.color}
                opacity={hovered === null || isHov ? 1 : 0.4}
                style={{ cursor:"pointer", transition:"opacity .18s" }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              />
            );
          })}
          {activeSlice ? (
            <>
              <text x={CX} y={CY - 14} textAnchor="middle" fill={activeSlice.color}
                style={{ fontSize:"26px", fontWeight:800, fontFamily:"Inter,system-ui,sans-serif" }}>
                {activeSlice.val >= 1000 ? `${(activeSlice.val/1000).toFixed(1)}k` : activeSlice.val}
              </text>
              <text x={CX} y={CY + 10} textAnchor="middle" fill={T.inkMuted}
                style={{ fontSize:"13px", fontFamily:"Inter,system-ui,sans-serif" }}>
                {(activeSlice.pct * 100).toFixed(1)}%
              </text>
              <text x={CX} y={CY + 28} textAnchor="middle" fill={T.inkFaint}
                style={{ fontSize:"11px", fontFamily:"Inter,system-ui,sans-serif" }}>
                {activeSlice.label}
              </text>
            </>
          ) : (
            <>
              <text x={CX} y={CY - 10} textAnchor="middle" fill={T.ink}
                style={{ fontSize:"28px", fontWeight:800, fontFamily:"Inter,system-ui,sans-serif" }}>
                {total >= 1000 ? `${(total/1000).toFixed(1)}k` : total}
              </text>
              <text x={CX} y={CY + 14} textAnchor="middle" fill={T.inkFaint}
                style={{ fontSize:"12px", fontFamily:"Inter,system-ui,sans-serif" }}>
                {point.label}
              </text>
            </>
          )}
        </svg>
      </div>

      <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center", gap:"2px", padding:"0 0 0 8px", minWidth:0 }}>
        {arcs.map((arc, i) => (
          <div
            key={arc.key}
            style={{
              display:"flex", alignItems:"center", justifyContent:"space-between", gap:"8px",
              cursor:"pointer",
              opacity: hovered === null || hovered === i ? 1 : .4,
              transition:"opacity .15s",
              padding:"6px 10px",
              borderRadius:T.rSm,
              background: hovered === i ? arc.color + "0f" : "transparent",
              border: `1px solid ${hovered === i ? arc.color + "33" : "transparent"}`,
            }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <div style={{ display:"flex", alignItems:"center", gap:"10px", minWidth:0 }}>
              <span style={{ width:"12px", height:"12px", borderRadius:"4px", background:arc.color, flexShrink:0, display:"inline-block" }}/>
              <span style={{ fontSize:"14px", color:T.inkMid, fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{arc.label}</span>
            </div>
            <div style={{ display:"flex", alignItems:"baseline", gap:"8px", flexShrink:0 }}>
              <span style={{ fontSize:"16px", fontWeight:700, color:arc.color }}>{formatNumber(arc.val)}</span>
              <span style={{ fontSize:"12px", color:T.inkFaint, width:"40px", textAlign:"right" }}>{(arc.pct*100).toFixed(1)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── STAT TILE ────────────────────────────────────────────────────────────────
function StatTile({ label, value, tone }) {
  const T = useT();
  const TONE = makeTone(T);
  const t = TONE[tone] || TONE["text-primary"];
  return (
    <div style={{ flex:"1 1 calc(50% - 6px)", borderRadius:T.rSm, background:t.soft, border:`1px solid ${t.mid}`, padding:"14px" }}>
      <div style={{ fontSize:"22px", fontWeight:800, color:t.color, lineHeight:1, letterSpacing:"-.01em" }}>{formatNumber(value)}</div>
      <div style={{ fontSize:"11px", color:T.inkMuted, marginTop:"4px", lineHeight:1.3 }}>{label}</div>
    </div>
  );
}

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────
function Badge({ status }) {
  const T = useT();
  const STATUS_STYLE = {
    active:    { bg: T.statusGreenBg, color: T.green   },
    inactive:  { bg: T.surfaceSub,    color: T.inkFaint },
    draft:     { bg: T.statusAmberBg, color: T.amber   },
    pending:   { bg: T.blueSoft,      color: T.blue    },
    suspended: { bg: T.roseSoft,      color: T.rose    },
  };
  const s = STATUS_STYLE[status] || STATUS_STYLE.inactive;
  return (
    <span style={{ fontSize:"10px", fontWeight:600, padding:"3px 9px", borderRadius:"999px", background:s.bg, color:s.color, whiteSpace:"nowrap" }}>
      {getStatusLabel(status)}
    </span>
  );
}

// ─── AVATAR ───────────────────────────────────────────────────────────────────
function Avatar({ name, size = 34 }) {
  const T = useT();
  const initials = (name || "?").split(" ").map(w => w[0]).slice(0,2).join("").toUpperCase();
  const hues = [T.blue, T.green, T.violet, T.cyan, T.amber];
  const idx = (name || "").charCodeAt(0) % hues.length;
  const col = hues[idx];
  const bg = col === T.blue ? T.blueSoft : col === T.green ? T.greenSoft : col === T.amber ? T.amberSoft : col === T.cyan ? T.cyanSoft : "#f5f3ff";
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:bg, color:col, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize: size > 30 ? "13px" : "11px", fontWeight:700, letterSpacing:".02em" }}>
      {initials}
    </div>
  );
}

// ─── PERIOD TABS ─────────────────────────────────────────────────────────────
function PeriodTabs({ selected, onChange }) {
  return (
    <div style={{ display:"flex", gap:"6px" }}>
      {PERIOD_OPTIONS.map(opt => (
        <button key={opt.id} className={`dash-btn-period${selected === opt.id ? " active" : ""}`} onClick={() => onChange(opt.id)}>
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ─── BOARD OF DIRECTORS / ADMIN DASHBOARD ────────────────────────────────────
function BoardDashboard({ data }) {
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [selectedPointIndex, setSelectedPointIndex] = useState(STATIC_TREND.month.trend.length - 1);
  const [showAllDocs, setShowAllDocs] = useState(false);
  const T = useT();

  const trendData = STATIC_TREND[selectedPeriod].trend;
  const activeOption = PERIOD_OPTIONS.find(o => o.id === selectedPeriod);
  const selectedPoint = trendData[Math.min(selectedPointIndex, trendData.length - 1)];

  const handleSelectPeriod = (id) => {
    setSelectedPeriod(id);
    setSelectedPointIndex(STATIC_TREND[id].trend.length - 1);
  };

  const kpiCards = useMemo(() => {
    const s = data?.stats || {};
    return [
      { label:"Tổng người dùng",  value:s.totalUsers,          change:"đang hoạt động",            tone:"text-primary", metricKey:"done"       },
      { label:"Tổng phòng ban",   value:s.totalDepartments,    change:"đang hoạt động",            tone:"text-success", metricKey:"files"      },
      { label:"Tổng tài liệu",    value:s.totalDocuments,      change:`${s.totalActiveDocuments ?? "—"} đang active`, tone:"text-warning", metricKey:"processing" },
      { label:"Tài liệu active",  value:s.totalActiveDocuments,change:"đã được duyệt",             tone:"text-info",    metricKey:"events"     },
    ];
  }, [data?.stats]);

  return (
    <div className="dash-fadein">
      {/* ── PAGE HEADER ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom:"20px", display:"flex", flexWrap:"wrap", alignItems:"center", justifyContent:"space-between", gap:"12px" }}>
        <div>
          <h1 style={{ margin:0, fontSize:"20px", fontWeight:800, color:T.ink, letterSpacing:"-.02em" }}>Dashboard thống kê</h1>
          <div style={{ fontSize:"13px", color:T.inkMuted, marginTop:"3px" }}>{data?.roleName} · Tổng quan toàn hệ thống</div>
        </div>
        <PeriodTabs selected={selectedPeriod} onChange={handleSelectPeriod}/>
      </div>

      {/* ── KPI CARDS ───────────────────────────────────────────────────── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:"14px", marginBottom:"18px" }}>
        {kpiCards.map(c => <KpiCard key={c.label} {...c} trend={trendData}/>)}
      </div>

      {/* ── TREND CHART + DETAIL ─────────────────────────────────────────── */}
      <div style={{ display:"grid", gridTemplateColumns:"minmax(0,2fr) minmax(0,1fr)", gap:"14px", marginBottom:"18px", alignItems:"stretch" }}>
        <Card>
          <div style={{ padding:"16px 20px 0", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"10px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"10px", flexWrap:"wrap" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                <span style={{ display:"flex", opacity:.75 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill={T.blue}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/></svg>
                </span>
                <span style={{ fontSize:"11px", fontWeight:700, letterSpacing:".07em", textTransform:"uppercase", color:T.inkMuted }}>Phân bổ theo {activeOption?.label}</span>
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:"5px" }}>
                {trendData.map((item, i) => (
                  <button
                    key={item.label}
                    onClick={() => setSelectedPointIndex(i)}
                    className={`dash-milestone-btn${selectedPointIndex === i ? " active" : ""}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <span style={{ fontSize:"11px", fontWeight:600, color:T.inkMuted, background:T.surfaceSub, border:`1px solid ${T.border}`, padding:"3px 10px", borderRadius:"999px" }}>{activeOption?.caption}</span>
          </div>
          <CardBody style={{ padding:"12px 20px 20px" }}>
            <DonutChart data={trendData} selectedIndex={Math.min(selectedPointIndex, trendData.length - 1)}/>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill={T.blue}><path d="M19 3H5c-1.1 0-2 .9-2 2v14h18V5c0-1.1-.9-2-2-2ZM8 17H5v-2h3v2Zm0-4H5v-2h3v2Zm0-4H5V7h3v2Zm11 8H10v-2h9v2Zm0-4H10v-2h9v2Zm0-4H10V7h9v2Z"/></svg>}
            title="Chi tiết mốc thống kê"
          />
          <CardBody style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
            <div style={{ borderRadius:T.rSm, background:T.blueSoft, border:`1px solid ${T.blueMid}`, padding:"14px" }}>
              <span style={{ fontSize:"10px", fontWeight:600, letterSpacing:".06em", textTransform:"uppercase", color:T.blue, display:"block", marginBottom:"4px" }}>Mốc đang xem</span>
              <div style={{ fontSize:"24px", fontWeight:800, color:T.ink, lineHeight:1 }}>{selectedPoint.label}</div>
              <div style={{ fontSize:"11px", color:T.inkMuted, marginTop:"3px" }}>{activeOption?.caption}</div>
            </div>

            <div style={{ display:"flex", flexWrap:"wrap", gap:"8px" }}>
              <StatTile label="Công việc hoàn thành" value={selectedPoint.done}       tone="text-primary"/>
              <StatTile label="Hồ sơ xử lý"          value={selectedPoint.files}      tone="text-success"/>
              <StatTile label="Đang xử lý"            value={selectedPoint.processing} tone="text-warning"/>
              <StatTile label="Sự kiện"               value={selectedPoint.events}     tone="text-info"/>
            </div>

            <div style={{ borderRadius:T.rSm, background:T.surfaceSub, border:`1px solid ${T.border}`, padding:"14px" }}>
              <div style={{ fontWeight:700, fontSize:"11px", color:T.ink, marginBottom:"6px", letterSpacing:".02em" }}>Nhận định nhanh</div>
              <p style={{ fontSize:"12px", color:T.inkMuted, margin:0, lineHeight:1.6 }}>
                Mốc <strong style={{ color:T.ink }}>{selectedPoint.label}</strong> ghi nhận {formatNumber(selectedPoint.done)} công việc hoàn thành và {formatNumber(selectedPoint.files)} hồ sơ đã xử lý. Còn {formatNumber(selectedPoint.processing)} hồ sơ đang xử lý — nên ưu tiên rà soát checklist.
              </p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* ── 3 BẢNG NẰM CÙNG 1 HÀNG ── */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", 
        gap: "14px", 
        marginBottom: "18px", 
        alignItems: "stretch" 
      }}>
        {/* 1. Top Departments */}
        <Card style={{ display:"flex", flexDirection:"column" }}>
          <CardHeader
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill={T.blue}><path d="M3 21V7l6-4 6 4v3h6v11h-7v-5H10v5H3Zm2-2h3v-5h8v5h3v-7h-6V8L9 5.35 5 8v11Z"/></svg>}
            title="Top phòng ban"
          />
          <CardBody style={{ flex: 1 }}>
            {(data?.topDepartments || []).length === 0 ? (
              <p style={{ fontSize:"13px", color:T.inkFaint, textAlign:"center", padding:"24px 0" }}>Chưa có dữ liệu phòng ban.</p>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
                {(data?.topDepartments || []).map((dept, i) => {
                  const maxC = Math.max(...(data.topDepartments || []).map(d => d.memberCount), 1);
                  const pct = Math.round((dept.memberCount / maxC) * 100);
                  const colors = [T.blue, T.green, T.amber, T.cyan, T.violet];
                  const rc = colors[i % colors.length];
                  return (
                    <div key={dept.id || i} style={{ display:"flex", alignItems:"center", gap:"14px" }}>
                      <span style={{ fontSize:"11px", fontWeight:700, color:rc, width:"22px", textAlign:"center", flexShrink:0 }}>#{i+1}</span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:"flex", alignItems:"baseline", justifyContent:"space-between", marginBottom:"6px" }}>
                          <span style={{ fontWeight:600, fontSize:"13px", color:T.ink, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:"150px" }}>{dept.name}</span>
                          <span style={{ fontWeight:700, fontSize:"14px", color:rc, flexShrink:0, marginLeft:"8px" }}>{formatNumber(dept.memberCount)}</span>
                        </div>
                        <div style={{ height:"5px", borderRadius:"999px", background:T.borderFaint, overflow:"hidden" }}>
                          <div style={{ width:`${pct}%`, height:"100%", background:`linear-gradient(90deg, ${rc}, ${rc}aa)`, borderRadius:"999px", transition:"width .4s ease" }}/>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>

        {/* 2. Recent Activities */}
        <Card style={{ display:"flex", flexDirection:"column" }}>
          <CardHeader
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill={T.blue}><path d="M13 3a9 9 0 1 0 0 18A9 9 0 0 0 13 3Zm0 16a7 7 0 1 1 0-14 7 7 0 0 1 0 14Zm.5-11H12v6l5.25 3.15.75-1.23-4.5-2.67V8Z"/></svg>}
            title="Hoạt động gần đây"
          />
          <CardBody style={{ padding:"14px 20px 14px", flex: 1, maxHeight: "320px", overflowY: "auto" }}>
            {(data?.recentActivities || []).length === 0 ? (
              <p style={{ fontSize:"13px", color:T.inkFaint, textAlign:"center", padding:"24px 0" }}>Chưa có hoạt động nào.</p>
            ) : (
              <div>
                {(data?.recentActivities || []).map((act, i) => (
                  <div key={act.id || i} className="dash-act-row" style={{ display:"flex", gap:"10px", alignItems:"flex-start", padding:"10px 0" }}>
                    <Avatar name={act.actor?.fullName} size={32}/>
                    <div style={{ minWidth:0, flex:1 }}>
                      <div style={{ fontWeight:600, fontSize:"12px", color:T.ink, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{act.actor?.fullName || "Hệ thống"}</div>
                      <div style={{ fontSize:"11.5px", color:T.inkMuted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{act.action}{act.target ? ` · ${act.target}` : ""}</div>
                      <div style={{ fontSize:"10.5px", color:T.inkFaint, marginTop:"1px" }}>{formatDate(act.createdAt)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* 3. Recent Documents */}
        <Card style={{ display:"flex", flexDirection:"column" }}>
          <CardHeader
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill={T.blue}><path d="M20 6H12L10 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V8C22 6.9 21.1 6 20 6ZM14 16H6V14H14V16ZM18 12H6V10H18V12Z"/></svg>}
            title="Tài liệu mới nhất"
            right={
              (data?.recentDocuments || []).length > 5 && (
                <button className="dash-link-viewall" onClick={() => setShowAllDocs(!showAllDocs)}>
                  {showAllDocs ? "Thu gọn" : "Xem tất cả"}
                  <svg 
                    width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    style={{ transform: showAllDocs ? "rotate(-90deg)" : "rotate(90deg)", transition: "transform 0.2s" }}
                  >
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>
              )
            }
          />
          <CardBody style={{ padding:"0 0 14px 0", flex: 1, overflowX: "auto", maxHeight: showAllDocs ? "400px" : "none", overflowY: showAllDocs ? "auto" : "hidden" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"13px" }}>
              <thead>
                <tr style={{ borderTop:`1px solid ${T.borderFaint}`, borderBottom:`1px solid ${T.border}` }}>
                  <th style={{ padding:"11px 20px", textAlign:"left", fontWeight:600, fontSize:"10px", color:T.inkFaint, letterSpacing:".06em", textTransform:"uppercase" }}>Tên tài liệu</th>
                  <th style={{ padding:"11px 12px", textAlign:"left", fontWeight:600, fontSize:"10px", color:T.inkFaint, letterSpacing:".06em", textTransform:"uppercase" }}>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {(data?.recentDocuments || []).length === 0 ? (
                  <tr><td colSpan="2" style={{ textAlign:"center", color:T.inkFaint, padding:"32px", fontSize:"13px" }}>Chưa có tài liệu nào.</td></tr>
                ) : (
                  (showAllDocs ? (data?.recentDocuments || []) : (data?.recentDocuments || []).slice(0, 5)).map((doc, i) => (
                    <tr key={doc.id || i} className="dash-row-hover" style={{ borderBottom:`1px solid ${T.borderFaint}`, transition:"background .12s" }}>
                      <td style={{ padding:"13px 20px", fontWeight:600, color:T.ink, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", maxWidth:"140px" }}>{doc.title}</td>
                      <td style={{ padding:"13px 12px" }}><Badge status={doc.status}/></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

// ─── DEPARTMENT HEAD DASHBOARD ────────────────────────────────────────────────
function DepartmentHeadDashboard({ data }) {
  const dept = data?.department || {};
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [selectedPointIndex, setSelectedPointIndex] = useState(STATIC_TREND.month.trend.length - 1);
  const [showAllDocs, setShowAllDocs] = useState(false);
  const T = useT();

  const trendData = STATIC_TREND[selectedPeriod].trend;
  const activeOption = PERIOD_OPTIONS.find(o => o.id === selectedPeriod);
  const selectedPoint = trendData[Math.min(selectedPointIndex, trendData.length - 1)];

  const handleSelectPeriod = (id) => {
    setSelectedPeriod(id);
    setSelectedPointIndex(STATIC_TREND[id].trend.length - 1);
  };

  const kpiCards = useMemo(() => {
    const ms = data?.memberStats || {};
    const ds = data?.documentStats || {};
    return [
      { label:"Tổng nhân sự",   value:ms.total,   change:`${ms.active ?? "—"} đang hoạt động`, tone:"text-primary", metricKey:"done"       },
      { label:"Nhân sự active", value:ms.active,  change:"đang hoạt động",                     tone:"text-success", metricKey:"files"      },
      { label:"Tổng tài liệu",  value:ds.total,   change:`${ds.active ?? "—"} đang active`,    tone:"text-warning", metricKey:"processing" },
      { label:"Chờ duyệt",      value:ds.pending, change:"tài liệu cần xử lý",                 tone:"text-info",    metricKey:"events"     },
    ];
  }, [data?.memberStats, data?.documentStats]);

  return (
    <div className="dash-fadein">
      {/* ── PAGE HEADER ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom:"20px", display:"flex", flexWrap:"wrap", alignItems:"center", justifyContent:"space-between", gap:"12px" }}>
        <div>
          <h1 style={{ margin:0, fontSize:"20px", fontWeight:800, color:T.ink, letterSpacing:"-.02em" }}>Dashboard vận hành</h1>
          <div style={{ fontSize:"13px", color:T.inkMuted, marginTop:"3px" }}>
            {data?.roleName} · <span style={{ fontWeight:600, color:T.ink }}>{dept.name || "—"}</span>
            {dept.description && <span style={{ marginLeft:"6px", color:T.inkFaint }}>· {dept.description}</span>}
          </div>
        </div>
        <PeriodTabs selected={selectedPeriod} onChange={handleSelectPeriod}/>
      </div>

      {/* ── KPI CARDS ───────────────────────────────────────────────────── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:"14px", marginBottom:"18px" }}>
        {kpiCards.map(c => <KpiCard key={c.label} {...c} trend={trendData}/>)}
      </div>

      {/* ── TREND CHART + DETAIL ─────────────────────────────────────────── */}
      <div style={{ display:"grid", gridTemplateColumns:"minmax(0,2fr) minmax(0,1fr)", gap:"14px", marginBottom:"18px", alignItems:"stretch" }}>
        <Card>
          <div style={{ padding:"16px 20px 0", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"10px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"10px", flexWrap:"wrap" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                <span style={{ display:"flex", opacity:.75 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill={T.blue}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/></svg>
                </span>
                <span style={{ fontSize:"11px", fontWeight:700, letterSpacing:".07em", textTransform:"uppercase", color:T.inkMuted }}>Phân bổ theo {activeOption?.label}</span>
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:"5px" }}>
                {trendData.map((item, i) => (
                  <button
                    key={item.label}
                    onClick={() => setSelectedPointIndex(i)}
                    className={`dash-milestone-btn${selectedPointIndex === i ? " active" : ""}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <span style={{ fontSize:"11px", fontWeight:600, color:T.inkMuted, background:T.surfaceSub, border:`1px solid ${T.border}`, padding:"3px 10px", borderRadius:"999px" }}>{activeOption?.caption}</span>
          </div>
          <CardBody style={{ padding:"12px 20px 20px" }}>
            <DonutChart data={trendData} selectedIndex={Math.min(selectedPointIndex, trendData.length - 1)}/>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill={T.blue}><path d="M19 3H5c-1.1 0-2 .9-2 2v14h18V5c0-1.1-.9-2-2-2ZM8 17H5v-2h3v2Zm0-4H5v-2h3v2Zm0-4H5V7h3v2Zm11 8H10v-2h9v2Zm0-4H10v-2h9v2Zm0-4H10V7h9v2Z"/></svg>}
            title="Chi tiết mốc thống kê"
          />
          <CardBody style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
            <div style={{ borderRadius:T.rSm, background:T.blueSoft, border:`1px solid ${T.blueMid}`, padding:"14px" }}>
              <span style={{ fontSize:"10px", fontWeight:600, letterSpacing:".06em", textTransform:"uppercase", color:T.blue, display:"block", marginBottom:"4px" }}>Mốc đang xem</span>
              <div style={{ fontSize:"24px", fontWeight:800, color:T.ink, lineHeight:1 }}>{selectedPoint.label}</div>
              <div style={{ fontSize:"11px", color:T.inkMuted, marginTop:"3px" }}>{activeOption?.caption}</div>
            </div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:"8px" }}>
              <StatTile label="Công việc hoàn thành" value={selectedPoint.done}       tone="text-primary"/>
              <StatTile label="Hồ sơ xử lý"          value={selectedPoint.files}      tone="text-success"/>
              <StatTile label="Đang xử lý"            value={selectedPoint.processing} tone="text-warning"/>
              <StatTile label="Sự kiện"               value={selectedPoint.events}     tone="text-info"/>
            </div>
            <div style={{ borderRadius:T.rSm, background:T.surfaceSub, border:`1px solid ${T.border}`, padding:"14px" }}>
              <div style={{ fontWeight:700, fontSize:"11px", color:T.ink, marginBottom:"6px", letterSpacing:".02em" }}>Nhận định nhanh</div>
              <p style={{ fontSize:"12px", color:T.inkMuted, margin:0, lineHeight:1.6 }}>
                Mốc <strong style={{ color:T.ink }}>{selectedPoint.label}</strong> có {formatNumber(selectedPoint.done)} công việc hoàn thành và {formatNumber(selectedPoint.files)} hồ sơ đã xử lý. Nhóm hồ sơ đang xử lý còn {formatNumber(selectedPoint.processing)}, nên ưu tiên rà soát checklist.
              </p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* ── 3 BẢNG NẰM CÙNG 1 HÀNG (TRƯỞNG BỘ PHẬN) ── */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", 
        gap: "14px", 
        marginBottom: "18px", 
        alignItems: "stretch" 
      }}>
        {/* 1. Members */}
        <Card style={{ display:"flex", flexDirection:"column" }}>
          <CardHeader
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill={T.blue}><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>}
            title="Danh sách nhân sự"
          />
          <CardBody style={{ flex: 1 }}>
            {(data?.members || []).length === 0 ? (
              <p style={{ fontSize:"13px", color:T.inkFaint, textAlign:"center", padding:"24px 0" }}>Chưa có nhân sự.</p>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:"6px", maxHeight:"320px", overflowY:"auto" }}>
                {(data?.members || []).map((m, i) => (
                  <div key={m.id || i} style={{ borderRadius:T.rSm, background:T.surfaceSub, border:`1px solid ${T.borderFaint}`, padding:"10px 12px", display:"flex", alignItems:"center", gap:"10px" }}>
                    <Avatar name={m.fullName}/>
                    <div style={{ minWidth:0, flex:1 }}>
                      <div style={{ fontWeight:600, fontSize:"13px", color:T.ink, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{m.fullName}</div>
                      <div style={{ fontSize:"11px", color:T.inkFaint, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{m.email}</div>
                    </div>
                    <Badge status={m.status}/>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* 2. Activities */}
        <Card style={{ display:"flex", flexDirection:"column", width:"auto" }}>
          <CardHeader
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill={T.blue}><path d="M13 3a9 9 0 1 0 0 18A9 9 0 0 0 13 3Zm0 16a7 7 0 1 1 0-14 7 7 0 0 1 0 14Zm.5-11H12v6l5.25 3.15.75-1.23-4.5-2.67V8Z"/></svg>}
            title="Hoạt động phòng ban"
          />
          <CardBody style={{ padding:"14px 20px 14px", flex: 1, maxHeight: "320px", overflowY: "auto" }}>
            {(data?.recentActivities || []).length === 0 ? (
              <p style={{ fontSize:"13px", color:T.inkFaint, textAlign:"center", padding:"24px 0" }}>Chưa có hoạt động nào.</p>
            ) : (
              <div>
                {(data?.recentActivities || []).map((act, i) => (
                  <div key={act.id || i} className="dash-act-row" style={{ display:"flex", gap:"10px", alignItems:"flex-start", padding:"10px 0" }}>
                    <Avatar name={act.actor?.fullName} size={32}/>
                    <div style={{ minWidth:0, flex:1 }}>
                      <div style={{ fontWeight:600, fontSize:"12px", color:T.ink, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{act.actor?.fullName}</div>
                      <div style={{ fontSize:"11.5px", color:T.inkMuted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{act.action}{act.target ? ` · ${act.target}` : ""}</div>
                      <div style={{ fontSize:"10.5px", color:T.inkFaint, marginTop:"1px" }}>{formatDate(act.createdAt)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* 3. Department Documents */}
        <Card style={{ display:"flex", flexDirection:"column" }}>
          <CardHeader
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill={T.blue}><path d="M20 6H12L10 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V8C22 6.9 21.1 6 20 6Z"/></svg>}
            title="Tài liệu phòng ban"
            right={
              (data?.recentDocuments || []).length > 5 && (
                <button className="dash-link-viewall" onClick={() => setShowAllDocs(!showAllDocs)}>
                  {showAllDocs ? "Thu gọn" : "Xem tất cả"}
                  <svg 
                    width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    style={{ transform: showAllDocs ? "rotate(-90deg)" : "rotate(90deg)", transition: "transform 0.2s" }}
                  >
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>
              )
            }
          />
          <CardBody style={{ padding:"0 0 14px 0", flex: 1, overflowX: "auto", maxHeight: showAllDocs ? "400px" : "none", overflowY: showAllDocs ? "auto" : "hidden" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"13px" }}>
              <thead>
                <tr style={{ borderTop:`1px solid ${T.borderFaint}`, borderBottom:`1px solid ${T.border}` }}>
                  <th style={{ padding:"11px 20px", textAlign:"left", fontWeight:600, fontSize:"10px", color:T.inkFaint, letterSpacing:".06em", textTransform:"uppercase" }}>Tên tài liệu</th>
                  <th style={{ padding:"11px 12px", textAlign:"left", fontWeight:600, fontSize:"10px", color:T.inkFaint, letterSpacing:".06em", textTransform:"uppercase" }}>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {(data?.recentDocuments || []).length === 0 ? (
                  <tr><td colSpan="2" style={{ textAlign:"center", color:T.inkFaint, padding:"32px", fontSize:"13px" }}>Chưa có tài liệu nào.</td></tr>
                ) : (
                  (showAllDocs ? (data?.recentDocuments || []) : (data?.recentDocuments || []).slice(0, 5)).map((doc, i) => (
                    <tr key={doc.id || i} className="dash-row-hover" style={{ borderBottom:`1px solid ${T.borderFaint}`, transition:"background .12s" }}>
                      <td style={{ padding:"13px 20px", fontWeight:600, color:T.ink, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", maxWidth:"140px" }}>{doc.title}</td>
                      <td style={{ padding:"13px 12px" }}><Badge status={doc.status}/></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

// ─── ROLE / AUTH ──────────────────────────────────────────────────────────────
const ROLE_ID_MAP = {
  "69fc5af582ef85451120772a": "admin",
  "69fc5af582ef85451120772b": "bangiamdoc",
  "69fc5af582ef85451120772c": "truongbophan",
  "69fc5af582ef85451120772d": "nhansu",
  "69fc5af582ef85451120772e": "daily",
  "69fc5af682ef85451120772f": "congtacvien",
  "69fc5af782ef854511207730": "user",
};
const ALLOWED_ROLES = ["admin", "bangiamdoc", "truongbophan"];

function decodeJwt(token) {
  try {
    const payload = token.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    return JSON.parse(window.atob(padded));
  } catch { return null; }
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────
export const DashboardPage = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [accessDenied, setAccessDenied]   = useState(false);
  const [retryCount, setRetryCount]       = useState(0);
  const dark = useDarkMode();
  const tokens = useMemo(() => makeTokens(dark), [dark]);

  const handleRetry = () => setRetryCount(c => c + 1);

  useEffect(() => {
    let cancelled = false;
    const fetchDashboardData = async () => {
      setLoading(true); setError(null); setAccessDenied(false);
      try {
        const token = window.localStorage.getItem("token");
        if (!token) throw new Error("Chưa đăng nhập.");
        const decoded = decodeJwt(token);
        const roleId = decoded?.roleId || "";
        const roleSlug = ROLE_ID_MAP[roleId] || "user";
        if (!ALLOWED_ROLES.includes(roleSlug)) { if (!cancelled) setAccessDenied(true); return; }
        const endpoint = roleSlug === "truongbophan"
          ? `${API_BASE_URL}/dashboard/department-head`
          : `${API_BASE_URL}/dashboard/board-of-directors`;
        const res = await fetch(endpoint, { headers: { Authorization:`Bearer ${token}`, "Content-Type":"application/json" } });
        if (cancelled) return;
        if (res.status === 403) { if (!cancelled) setAccessDenied(true); return; }
        if (!res.ok) { const err = await res.json().catch(()=>({})); throw new Error(err.message || `HTTP ${res.status}`); }
        const json = await res.json();
        if (!cancelled) setDashboardData(json.data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchDashboardData();
    return () => { cancelled = true; };
  }, [retryCount]);

  const renderContent = () => {
    if (loading)      return <LoadingSpinner/>;
    if (accessDenied) return <AccessDenied/>;
    if (error)        return <ErrorState message={error} onRetry={handleRetry}/>;
    if (!dashboardData) return null;
    const role = dashboardData.role;
    if (role === "admin" || role === "board_of_directors" || role === "bangiamdoc") return <BoardDashboard data={dashboardData}/>;
    if (role === "truongbophan") return <DepartmentHeadDashboard data={dashboardData}/>;
    return <AccessDenied/>;
  };

  return (
    <ThemeCtx.Provider value={tokens}>
      <GlobalStyles/>
      <div className="dash-root" style={{ padding:"24px 28px", maxWidth:"1600px", background:tokens.bg, minHeight:"100vh", fontFamily:"'Inter', system-ui, sans-serif" }}>
        {renderContent()}
      </div>
    </ThemeCtx.Provider>
  );
};