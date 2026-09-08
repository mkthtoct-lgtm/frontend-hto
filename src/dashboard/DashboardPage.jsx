import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { exportDashboardToExcel } from "./dashboardExport";

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

// Nhãn tiếng Việt cho các loại hành động trong nhật ký hoạt động - đưa lên
// module scope để dùng chung giữa BoardDashboard, DepartmentHeadDashboard
// (trước đây trang này hiển thị thẳng mã hành động thô như "document.create"
// thay vì nhãn tiếng Việt như bên BoardDashboard - nay đã đồng bộ) và cả khi
// xuất Excel.
const ACTIVITY_ACTION_MAP = {
  "auth.login":               "Đăng nhập",
  "auth.logout":              "Đăng xuất",
  "auth.register":            "Đăng ký tài khoản",
  "user.create":               "Tạo người dùng",
  "user.update":               "Cập nhật người dùng",
  "user.delete":               "Xóa người dùng",
  "department.create":         "Tạo phòng ban",
  "department.update":         "Cập nhật phòng ban",
  "department.delete":         "Xóa phòng ban",
  "department.add_user":       "Thêm nhân viên vào phòng ban",
  "department.assign_user":    "Thêm nhân viên vào phòng ban",
  "department.remove_user":    "Xóa thành viên khỏi phòng ban",
  "document.create":           "Tạo tài liệu",
  "document.update":           "Cập nhật tài liệu",
  "document.delete":           "Xóa tài liệu",
  "document.approve":          "Duyệt tài liệu",
  "document.reject":           "Từ chối tài liệu",
  "document.upload":           "Tải lên tài liệu",
};
const getActivityActionLabel = (action) => ACTIVITY_ACTION_MAP[action] || action || "";
const getActivityTargetLabel = (target) =>
  typeof target === "string"
    ? target
    : target?.name || target?.title || target?.fullName || target?.email || "";

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
function KpiCard({ label, value, change, caption, tone, trend, metricKey, href }) {
  const T = useT();
  const TONE = makeTone(T);
  const t = TONE[tone] || TONE["text-primary"];
  const handleNavigate = (page) => window.dispatchEvent(new CustomEvent("app:navigate", { detail: { page } }));
  const maxValue = Math.max(...(trend || []).map((item) => item[metricKey] ?? 0), 1);
  const points = (trend || []).map((item, index) => {
    const x = trend.length === 1 ? 0 : index * (280 / (trend.length - 1));
    const y = 52 - ((item[metricKey] ?? 0) / maxValue) * 40;
    return `${x},${y}`;
  }).join(" ");

  const iconJsx = (
    <div style={{ width:"38px", height:"38px", borderRadius:"10px", background:t.soft, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill={t.color}><path d="M3 17h2.75l3.5-4.5 3 3.5L19 7.5V11h2V4h-7v2h3.52l-5.35 6.74-3-3.5L3 17Z"/></svg>
    </div>
  );

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
        {href ? (
          <button
            onClick={() => handleNavigate(href)}
            title={`Xem chi tiết ${label}`}
            style={{ display:"flex", background:"none", border:"none", padding:0, cursor:"pointer", borderRadius:"10px", transition:"opacity .15s", opacity:1 }}
            onMouseEnter={e => e.currentTarget.style.opacity=".75"}
            onMouseLeave={e => e.currentTarget.style.opacity="1"}
          >
            {iconJsx}
          </button>
        ) : iconJsx}
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

// ─── TREND OVERVIEW CHART (biểu đồ lớn cho TẤT CẢ các mốc/tuần cùng lúc) ──────
// Bổ sung: DonutChart ở trên chỉ cho xem 1 mốc được chọn tại 1 thời điểm.
// Biểu đồ này vẽ toàn bộ các mốc (vd: cả 4 tuần trong tháng) trên cùng 1 biểu
// đồ đường lớn để nhìn được xu hướng tổng thể theo thời gian.
function TrendOverviewChart({ data }) {
  const T = useT();
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const SERIES = [
    { key: "done",       color: T.blue,  label: "Hoàn thành"  },
    { key: "files",      color: T.green, label: "Hồ sơ xử lý" },
    { key: "processing", color: T.amber, label: "Đang xử lý"  },
    { key: "events",     color: T.cyan,  label: "Sự kiện"     },
  ];

  const W = 900, H = 300, PAD_L = 42, PAD_R = 16, PAD_T = 16, PAD_B = 32;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;
  const n = data.length;

  const maxRaw = Math.max(1, ...data.flatMap((d) => SERIES.map((s) => d[s.key] || 0)));
  const niceMax = (() => {
    const magnitude = Math.pow(10, Math.floor(Math.log10(maxRaw)));
    const residual = maxRaw / magnitude;
    const niceResidual = residual > 5 ? 10 : residual > 2 ? 5 : residual > 1 ? 2 : 1;
    return niceResidual * magnitude;
  })();

  const xAt = (i) => (n <= 1 ? PAD_L + chartW / 2 : PAD_L + (chartW * i) / (n - 1));
  const yAt = (v) => PAD_T + chartH - (Math.min(v, niceMax) / niceMax) * chartH;
  const gridSteps = [0, 0.25, 0.5, 0.75, 1];
  const fmtAxis = (v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : Math.round(v));
  const bandW = n <= 1 ? chartW : chartW / (n - 1);
  const tooltipLeftPct = (xAt(hoveredIndex ?? 0) / W) * 100;

  return (
    <div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:"16px", marginBottom:"12px" }}>
        {SERIES.map((s) => (
          <div key={s.key} style={{ display:"flex", alignItems:"center", gap:"6px" }}>
            <span style={{ width:"10px", height:"10px", borderRadius:"3px", background:s.color, display:"inline-block" }} />
            <span style={{ fontSize:"12px", color:T.inkMuted, fontWeight:600 }}>{s.label}</span>
          </div>
        ))}
      </div>

      <div style={{ position:"relative", width:"100%" }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{ width:"100%", height:"auto", display:"block", overflow:"visible" }}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {gridSteps.map((g, gi) => {
            const y = PAD_T + chartH - g * chartH;
            return (
              <g key={gi}>
                <line x1={PAD_L} x2={W - PAD_R} y1={y} y2={y} stroke={T.borderFaint} strokeWidth="1" />
                <text x={PAD_L - 8} y={y + 3} textAnchor="end" fontSize="10" fill={T.inkFaint} fontFamily="Inter,system-ui,sans-serif">
                  {fmtAxis(niceMax * g)}
                </text>
              </g>
            );
          })}

          {data.map((d, i) => (
            <text
              key={i} x={xAt(i)} y={H - 8} textAnchor="middle" fontSize="10.5"
              fontWeight={hoveredIndex === i ? 700 : 500}
              fill={hoveredIndex === i ? T.ink : T.inkFaint}
              fontFamily="Inter,system-ui,sans-serif"
            >
              {d.label}
            </text>
          ))}

          {hoveredIndex !== null && (
            <line x1={xAt(hoveredIndex)} x2={xAt(hoveredIndex)} y1={PAD_T} y2={PAD_T + chartH} stroke={T.inkFaint} strokeWidth="1" strokeDasharray="3,3" />
          )}

          {SERIES.map((s) => {
            const points = data.map((d, i) => `${xAt(i)},${yAt(d[s.key] || 0)}`).join(" ");
            return (
              <g key={s.key}>
                <polyline points={points} fill="none" stroke={s.color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                {data.map((d, i) => (
                  <circle key={i} cx={xAt(i)} cy={yAt(d[s.key] || 0)} r={hoveredIndex === i ? 5 : 3} fill={T.surface} stroke={s.color} strokeWidth="2.2" />
                ))}
              </g>
            );
          })}

          {data.map((_, i) => (
            <rect
              key={i} x={xAt(i) - bandW / 2} y={PAD_T} width={bandW} height={chartH}
              fill="transparent" style={{ cursor:"pointer" }}
              onMouseEnter={() => setHoveredIndex(i)}
            />
          ))}
        </svg>

        {hoveredIndex !== null && (
          <div
            style={{
              position:"absolute", top:"4px",
              left:`${tooltipLeftPct}%`,
              transform: hoveredIndex > (n - 1) / 2 ? "translate(-105%,0)" : "translate(5%,0)",
              background:T.surface, border:`1px solid ${T.border}`, borderRadius:T.rSm, boxShadow:T.sh,
              padding:"10px 12px", fontSize:"12px", minWidth:"150px", pointerEvents:"none", zIndex:2,
            }}
          >
            <div style={{ fontWeight:700, color:T.ink, marginBottom:"6px" }}>{data[hoveredIndex].label}</div>
            {SERIES.map((s) => (
              <div key={s.key} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:"10px", marginBottom:"3px" }}>
                <span style={{ display:"flex", alignItems:"center", gap:"6px", color:T.inkMuted }}>
                  <span style={{ width:"8px", height:"8px", borderRadius:"2px", background:s.color, display:"inline-block" }} />
                  {s.label}
                </span>
                <strong style={{ color:T.ink }}>{formatNumber(data[hoveredIndex][s.key] || 0)}</strong>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── HEADER ACTIONS (Làm mới + Xuất Excel) ────────────────────────────────────
function DashboardHeaderActions({ onRefresh, onExport, exporting }) {
  const T = useT();
  const btnStyle = {
    display:"inline-flex", alignItems:"center", gap:"6px", fontSize:"12px", fontWeight:600,
    padding:"8px 13px", borderRadius:T.rSm, border:`1px solid ${T.border}`, background:T.surface,
    color:T.inkMid, cursor:"pointer", transition:"background .15s, opacity .15s",
  };
  return (
    <div style={{ display:"flex", gap:"8px" }}>
      {onRefresh && (
        <button id="dashboard-stats-refresh-btn" type="button" onClick={onRefresh} style={btnStyle} title="Tải lại dữ liệu mới nhất">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          Làm mới
        </button>
      )}
      {onExport && (
        <button
          id="dashboard-stats-export-btn" type="button" onClick={onExport} disabled={exporting}
          style={{ ...btnStyle, background:T.green, borderColor:T.green, color:"#fff", opacity:exporting?0.7:1, cursor:exporting?"not-allowed":"pointer" }}
          title="Xuất toàn bộ số liệu đang hiển thị ra file Excel"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          {exporting ? "Đang xuất..." : "Xuất Excel"}
        </button>
      )}
    </div>
  );
}

// ─── STAT TILE ────────────────────────────────────────────────────────────────
function StatTile({ label, value, tone }) {
  const T = useT();
  const TONE = makeTone(T);
  const t = TONE[tone] || TONE["text-primary"];
  const displayValue =
    typeof value === "number" || (typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value)))
      ? formatNumber(value)
      : value;
  return (
    <div style={{ flex:"1 1 calc(50% - 6px)", borderRadius:T.rSm, background:t.soft, border:`1px solid ${t.mid}`, padding:"14px" }}>
      <div style={{ fontSize:"22px", fontWeight:800, color:t.color, lineHeight:1, letterSpacing:"-.01em" }}>{displayValue}</div>
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

// ─── STATIC DATA CHO PHỄU CRM, NGÀNH HỌC & CTV ──────────────────────────────
const STATIC_CRM_FUNNEL = [
  { stage: "Mới tiếp nhận", count: 245, pct: 100, color: "#2563eb", desc: "Form website & CTV gửi" },
  { stage: "Đang tư vấn", count: 191, pct: 78, color: "#0284c7", desc: "Chuyên viên HTO hỗ trợ 1-1" },
  { stage: "Chờ chốt hợp đồng", count: 118, pct: 48, color: "#d97706", desc: "Đã hoàn thành tư vấn & gửi HĐ" },
  { stage: "Đã chốt (Xử lý HS)", count: 84, pct: 34, color: "#059669", desc: "Ký hợp đồng & nộp hồ sơ Visa" },
  { stage: "Thất bại (Lost)", count: 29, pct: 12, color: "#e11d48", desc: "Quá hạn hoặc đổi dự định" },
];

const STATIC_PROGRAM_DISTRIBUTION = [
  { name: "Du học nghề Đức - Điều dưỡng", flag: "🇩🇪", count: 93, pct: 38, growth: "+14.2%", color: "#0072ce" },
  { name: "Du học nghề Đức - Nhà hàng KS", flag: "🇩🇪", count: 59, pct: 24, growth: "+8.5%", color: "#2563eb" },
  { name: "Du học nghề Đức - Cơ khí/Điện tử", flag: "🇩🇪", count: 44, pct: 18, growth: "+11.0%", color: "#0284c7" },
  { name: "Khóa học tiếng Đức (A1 - B2)", flag: "🇩🇪", count: 29, pct: 12, growth: "+5.4%", color: "#7c3aed" },
  { name: "Định cư & Việc làm Châu Âu", flag: "🇪🇺", count: 20, pct: 8, growth: "+19.1%", color: "#059669" },
];

const STATIC_TOP_COLLABORATORS = [
  { rank: 1, name: "Nguyễn Thị Mai", code: "CTV-089", referrals: 32, deals: 14, rankTier: "Master", badge: "🥇", commission: 42000000 },
  { rank: 2, name: "Trần Hoàng Nam", code: "CTV-104", referrals: 27, deals: 11, rankTier: "Daimion", badge: "🥈", commission: 33000000 },
  { rank: 3, name: "Lê Minh Tuấn", code: "CTV-042", referrals: 21, deals: 9, rankTier: "Gold", badge: "🥉", commission: 27000000 },
  { rank: 4, name: "Phạm Thanh Hương", code: "CTV-118", referrals: 18, deals: 7, rankTier: "Gold", badge: "#4", commission: 21000000 },
  { rank: 5, name: "Đỗ Quốc Việt", code: "CTV-055", referrals: 15, deals: 6, rankTier: "Silver", badge: "#5", commission: 18000000 },
];

// ─── AI INSIGHTS CARD ─────────────────────────────────────────────────────────
function AiInsightsSection() {
  const T = useT();
  const insights = [
    {
      icon: "⚡",
      title: "Chăm sóc Lead im lặng",
      badge: "CẦN XỬ LÝ GẤP",
      badgeBg: T.roseSoft,
      badgeColor: T.rose,
      desc: "Phát hiện 5 Lead ở trạng thái Đang tư vấn > 24h chưa được cập nhật. Cần nhắc nhở chuyên viên phụ trách liên hệ lại ngay.",
      btnText: "Xem Lead im lặng",
      page: "crm",
    },
    {
      icon: "📈",
      title: "Tỷ lệ Chốt Deal Ấn tượng",
      badge: "+5.8% TĂNG TRƯỞNG",
      badgeBg: T.greenSoft,
      badgeColor: T.green,
      desc: "Tỷ lệ chốt hợp đồng đạt 34.2% trong tháng này. Khối ngành Điều dưỡng Đức tiếp tục dẫn đầu tăng trưởng doanh số.",
      btnText: "Phân tích phễu",
      page: "crm",
    },
    {
      icon: "🎯",
      title: "Tốc độ Phản hồi SLA",
      badge: "ĐẠT CHUẨN 1.8H",
      badgeBg: T.blueSoft,
      badgeColor: T.blue,
      desc: "Thời gian phản hồi Lead mới trung bình 1.8 giờ (đạt chuẩn SLA < 2.0h). Tăng trải nghiệm tin cậy cho khách hàng đăng ký.",
      btnText: "Chi tiết SLA",
      page: "crm",
    },
  ];

  const handleNav = (page) => window.dispatchEvent(new CustomEvent("app:navigate", { detail: { page } }));

  return (
    <div style={{ marginBottom: "18px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px" }}>
        {insights.map((item, idx) => (
          <div
            key={idx}
            className="dash-fadein"
            style={{
              background: T.surface,
              borderRadius: T.r,
              boxShadow: T.sh,
              border: `1px solid ${T.borderFaint}`,
              padding: "16px 18px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "10px",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "18px" }}>{item.icon}</span>
                  <strong style={{ fontSize: "13.5px", color: T.ink }}>{item.title}</strong>
                </div>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    padding: "3px 8px",
                    borderRadius: "999px",
                    background: item.badgeBg,
                    color: item.badgeColor,
                    letterSpacing: ".04em",
                  }}
                >
                  {item.badge}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: "12px", color: T.inkMuted, lineHeight: 1.6 }}>{item.desc}</p>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="dash-link-viewall"
                onClick={() => handleNav(item.page)}
                style={{ fontSize: "11px", fontWeight: 700 }}
              >
                {item.btnText} →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── CRM LEAD PIPELINE FUNNEL CHART ─────────────────────────────────────────
function CrmPipelineFunnelChart() {
  const T = useT();
  const maxCount = STATIC_CRM_FUNNEL[0].count;

  return (
    <Card style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <CardHeader
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill={T.blue}>
            <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z" />
          </svg>
        }
        title="Phễu chuyển đổi Lead CRM"
        right={
          <span style={{ fontSize: "11px", fontWeight: 700, color: T.green, background: T.greenSoft, padding: "3px 10px", borderRadius: "999px" }}>
            Tỷ lệ chốt: 34.2%
          </span>
        }
      />
      <CardBody style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "12px" }}>
        {STATIC_CRM_FUNNEL.map((item) => {
          const widthPct = Math.max(12, Math.round((item.count / maxCount) * 100));
          return (
            <div key={item.stage} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12.5px" }}>
                <span style={{ fontWeight: 600, color: T.ink }}>{item.stage}</span>
                <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                  <strong style={{ color: item.color, fontSize: "13.5px" }}>{formatNumber(item.count)} lead</strong>
                  <span style={{ fontSize: "11px", color: T.inkFaint }}>({item.pct}%)</span>
                </div>
              </div>
              <div style={{ height: "8px", borderRadius: "999px", background: T.borderFaint, overflow: "hidden" }}>
                <div
                  style={{
                    width: `${widthPct}%`,
                    height: "100%",
                    background: `linear-gradient(90deg, ${item.color}, ${item.color}cc)`,
                    borderRadius: "999px",
                    transition: "width .5s ease",
                  }}
                />
              </div>
              <span style={{ fontSize: "10.5px", color: T.inkFaint, marginTop: "1px" }}>{item.desc}</span>
            </div>
          );
        })}
      </CardBody>
    </Card>
  );
}

// ─── PROGRAM & COUNTRY DISTRIBUTION ─────────────────────────────────────────
function ProgramDistributionWidget() {
  const T = useT();

  return (
    <Card style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <CardHeader
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill={T.blue}>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
          </svg>
        }
        title="Phân bổ Chương trình & Quốc gia"
        right={<span style={{ fontSize: "11px", color: T.inkMuted }}>Nhu cầu tuyển sinh</span>}
      />
      <CardBody style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "10px" }}>
        {STATIC_PROGRAM_DISTRIBUTION.map((prog) => (
          <div key={prog.name} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px" }}>
              <span style={{ fontWeight: 600, color: T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "210px" }}>
                {prog.flag} {prog.name}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <strong style={{ color: prog.color, fontSize: "13px" }}>{prog.pct}%</strong>
                <span style={{ fontSize: "10.5px", fontWeight: 700, color: T.green }}>{prog.growth}</span>
              </div>
            </div>
            <div style={{ height: "6px", borderRadius: "999px", background: T.borderFaint, overflow: "hidden" }}>
              <div
                style={{
                  width: `${prog.pct}%`,
                  height: "100%",
                  background: `linear-gradient(90deg, ${prog.color}, ${prog.color}bb)`,
                  borderRadius: "999px",
                }}
              />
            </div>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}

// ─── TOP COLLABORATORS LEADERBOARD WIDGET ────────────────────────────────────
function CollaboratorLeaderboardWidget() {
  const T = useT();

  return (
    <Card style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <CardHeader
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill={T.blue}>
            <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0 0 11 15.9V18H8v2h8v-2h-3v-2.1c2.16-.4 3.79-2.14 3.96-4.36A5.01 5.01 0 0 0 19 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
          </svg>
        }
        title="Top CTV & Đại lý xuất sắc"
        right={<span style={{ fontSize: "11px", fontWeight: 700, color: T.amber }}>Leaderboard</span>}
      />
      <CardBody style={{ flex: 1, padding: "10px 18px 14px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {STATIC_TOP_COLLABORATORS.map((item) => (
            <div
              key={item.code}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 10px",
                borderRadius: T.rSm,
                background: T.surfaceSub,
                border: `1px solid ${T.borderFaint}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                <span style={{ fontSize: "16px", fontWeight: 800, width: "22px", textAlign: "center", flexShrink: 0 }}>{item.badge}</span>
                <Avatar name={item.name} size={30} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: "12.5px", color: T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.name}
                  </div>
                  <span style={{ fontSize: "10.5px", color: T.inkFaint }}>
                    {item.code} · Hạng <strong style={{ color: T.blue }}>{item.rankTier}</strong>
                  </span>
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontWeight: 700, fontSize: "13px", color: T.green }}>{item.deals} chốt</div>
                <div style={{ fontSize: "10.5px", color: T.inkMuted }}>{formatNumber(item.referrals)} lead</div>
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

// ─── BOARD OF DIRECTORS / ADMIN DASHBOARD ────────────────────────────────────
function BoardDashboard({ data, onRefresh }) {
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [selectedPointIndex, setSelectedPointIndex] = useState(STATIC_TREND.month.trend.length - 1);
  const [allDepartments, setAllDepartments] = useState(data?.topDepartments || []);
  const [exporting, setExporting] = useState(false);
  const T = useT();

  useEffect(() => {
    const token = window.localStorage.getItem("token");
    if (!token) return;
    fetch(`${API_BASE_URL}/departments?includeHidden=true`, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    })
      .then((r) => r.json())
      .then((json) => {
        const raw = json?.data ?? json ?? [];
        const list = Array.isArray(raw) ? raw : Array.isArray(raw?.items) ? raw.items : Array.isArray(raw?.departments) ? raw.departments : [];
        const normalized = list
          .map((d) => ({
            ...d,
            id: String(d.id || d._id || ""),
            name: d.name || "",
            memberCount: Number(d.memberCount ?? 0),
          }))
          .filter((d) => d.id);
        if (normalized.length > 0) setAllDepartments(normalized);
      })
      .catch(() => {});
  }, []);

  const trendData = STATIC_TREND[selectedPeriod].trend;
  const activeOption = PERIOD_OPTIONS.find((o) => o.id === selectedPeriod);
  const selectedPoint = trendData[Math.min(selectedPointIndex, trendData.length - 1)];

  const handleSelectPeriod = (id) => {
    setSelectedPeriod(id);
    setSelectedPointIndex(STATIC_TREND[id].trend.length - 1);
  };

  const kpiCards = useMemo(() => {
    const s = data?.stats || {};
    return [
      { label: "Tổng người dùng", value: s.totalUsers, change: "↑ +12.4% so với kỳ trước", tone: "text-primary", metricKey: "done", href: "users" },
      { label: "Tổng phòng ban", value: s.totalDepartments, change: "đang hoạt động", tone: "text-success", metricKey: "files", href: "departments" },
      { label: "Tổng Lead CRM", value: 245, change: "84 deal thành công (34.2%)", tone: "text-warning", metricKey: "processing", href: "crm" },
      { label: "Tài liệu active", value: s.totalActiveDocuments, change: "đã duyệt & ban hành", tone: "text-info", metricKey: "events", href: "documents" },
    ];
  }, [data?.stats]);

  const handleExport = () => {
    setExporting(true);
    try {
      const trendSheetRows = [["Khoảng thời gian", "Mốc", "Công việc hoàn thành", "Hồ sơ xử lý", "Đang xử lý", "Sự kiện"]];
      PERIOD_OPTIONS.forEach((opt) => {
        STATIC_TREND[opt.id].trend.forEach((point) => {
          trendSheetRows.push([opt.label, point.label, point.done || 0, point.files || 0, point.processing || 0, point.events || 0]);
        });
      });

      exportDashboardToExcel({
        fileLabel: "BanGiamDoc",
        sheets: [
          {
            name: "Tổng quan KPI",
            aoa: [["Chỉ số", "Giá trị"], ...kpiCards.map((k) => [k.label, k.value ?? 0])],
            colWidths: [26, 16],
          },
          {
            name: "Phễu chuyển đổi CRM",
            aoa: [
              ["Giai đoạn phễu", "Số lượng Lead", "Tỷ lệ (%)", "Mô tả"],
              ...STATIC_CRM_FUNNEL.map((f) => [f.stage, f.count, `${f.pct}%`, f.desc]),
            ],
            colWidths: [24, 16, 14, 34],
          },
          {
            name: "Phân bổ Ngành học",
            aoa: [
              ["Chương trình / Ngành học", "Quốc gia", "Số lượng đăng ký", "Tỷ trọng (%)", "Tăng trưởng"],
              ...STATIC_PROGRAM_DISTRIBUTION.map((p) => [p.name, p.flag, p.count, `${p.pct}%`, p.growth]),
            ],
            colWidths: [32, 10, 18, 14, 14],
          },
          {
            name: "Leaderboard CTV",
            aoa: [
              ["Hạng", "Mã CTV", "Họ và tên", "Cấp bậc", "Số Lead", "Hợp đồng chốt", "Hoa hồng (VND)"],
              ...STATIC_TOP_COLLABORATORS.map((c) => [c.rank, c.code, c.name, c.rankTier, c.referrals, c.deals, c.commission]),
            ],
            colWidths: [8, 12, 24, 12, 12, 14, 18],
          },
          { name: "Xu hướng theo thời gian", aoa: trendSheetRows, colWidths: [18, 12, 20, 16, 14, 12] },
          {
            name: "Phòng ban",
            aoa: [
              ["#", "Tên phòng ban", "Số nhân sự"],
              ...[...allDepartments].sort((a, b) => (b.memberCount || 0) - (a.memberCount || 0)).map((d, i) => [i + 1, d.name || "", d.memberCount || 0]),
            ],
            colWidths: [5, 32, 14],
          },
        ],
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="dash-fadein">
      {/* ── PAGE HEADER ─────────────────────────────────────────────────── */}
      <div id="dashboard-stats-header" style={{ marginBottom: "20px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <h1 style={{ margin: 0, fontSize: "21px", fontWeight: 800, color: T.ink, letterSpacing: "-.02em" }}>Dashboard Thống Kê Tổng Quan</h1>
            <span style={{ fontSize: "11px", fontWeight: 700, color: T.green, background: T.greenSoft, padding: "3px 10px", borderRadius: "999px", border: `1px solid ${T.green}33` }}>
              🟢 Sức khỏe vận hành: 94/100 (Tối ưu)
            </span>
          </div>
          <div style={{ fontSize: "13px", color: T.inkMuted }}>
            {data?.roleName || "Ban Giám Đốc"} · Báo cáo tổng thể hệ thống HT Ocean Group
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <PeriodTabs selected={selectedPeriod} onChange={handleSelectPeriod} />
          <DashboardHeaderActions onRefresh={onRefresh} onExport={handleExport} exporting={exporting} />
        </div>
      </div>

      {/* ── AI INSIGHTS NOTIFICATIONS ────────────────────────────────────── */}
      <AiInsightsSection />

      {/* ── KPI CARDS ───────────────────────────────────────────────────── */}
      <div id="dashboard-stats-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "14px", marginBottom: "18px" }}>
        {kpiCards.map((c) => (
          <KpiCard key={c.label} {...c} trend={trendData} />
        ))}
      </div>

      {/* ── 3 THẺ CHIẾN LƯỢC MỚI: PHỄU CRM + NGÀNH HỌC + LEADERBOARD CTV ────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "14px", marginBottom: "18px", alignItems: "stretch" }}>
        <CrmPipelineFunnelChart />
        <ProgramDistributionWidget />
        <CollaboratorLeaderboardWidget />
      </div>

      {/* ── TREND CHART + DETAIL ─────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,2fr) minmax(0,1fr)", gap: "14px", marginBottom: "18px", alignItems: "stretch" }}>
        <Card>
          <div style={{ padding: "16px 20px 0", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ display: "flex", opacity: 0.75 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill={T.blue}>
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" />
                  </svg>
                </span>
                <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: T.inkMuted }}>
                  Phân bổ theo {activeOption?.label}
                </span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                {trendData.map((item, i) => (
                  <button key={item.label} onClick={() => setSelectedPointIndex(i)} className={`dash-milestone-btn${selectedPointIndex === i ? " active" : ""}`}>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <span style={{ fontSize: "11px", fontWeight: 600, color: T.inkMuted, background: T.surfaceSub, border: `1px solid ${T.border}`, padding: "3px 10px", borderRadius: "999px" }}>
              {activeOption?.caption}
            </span>
          </div>
          <CardBody style={{ padding: "12px 20px 20px" }}>
            <DonutChart data={trendData} selectedIndex={Math.min(selectedPointIndex, trendData.length - 1)} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill={T.blue}>
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14h18V5c0-1.1-.9-2-2-2ZM8 17H5v-2h3v2Zm0-4H5v-2h3v2Zm0-4H5V7h3v2Zm11 8H10v-2h9v2Zm0-4H10v-2h9v2Zm0-4H10V7h9v2Z" />
              </svg>
            }
            title="Chi tiết mốc thống kê"
          />
          <CardBody style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ borderRadius: T.rSm, background: T.blueSoft, border: `1px solid ${T.blueMid}`, padding: "14px" }}>
              <span style={{ fontSize: "10px", fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: T.blue, display: "block", marginBottom: "4px" }}>
                Mốc đang xem
              </span>
              <div style={{ fontSize: "24px", fontWeight: 800, color: T.ink, lineHeight: 1 }}>{selectedPoint.label}</div>
              <div style={{ fontSize: "11px", color: T.inkMuted, marginTop: "3px" }}>{activeOption?.caption}</div>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              <StatTile label="Công việc hoàn thành" value={selectedPoint.done} tone="text-primary" />
              <StatTile label="Hồ sơ xử lý" value={selectedPoint.files} tone="text-success" />
              <StatTile label="Đang xử lý" value={selectedPoint.processing} tone="text-warning" />
              <StatTile label="Sự kiện" value={selectedPoint.events} tone="text-info" />
            </div>

            <div style={{ borderRadius: T.rSm, background: T.surfaceSub, border: `1px solid ${T.border}`, padding: "14px" }}>
              <div style={{ fontWeight: 700, fontSize: "11px", color: T.ink, marginBottom: "6px", letterSpacing: ".02em" }}>Nhận định nhanh AI</div>
              <p style={{ fontSize: "12px", color: T.inkMuted, margin: 0, lineHeight: 1.6 }}>
                Mốc <strong style={{ color: T.ink }}>{selectedPoint.label}</strong> ghi nhận {formatNumber(selectedPoint.done)} công việc hoàn thành và {formatNumber(selectedPoint.files)} hồ sơ đã xử lý. Còn {formatNumber(selectedPoint.processing)} hồ sơ đang xử lý — tỷ lệ phản hồi SLA đạt 98.2%.
              </p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* ── BIỂU ĐỒ TỔNG QUAN TẤT CẢ CÁC MỐC ────────────────────────────── */}
      <Card style={{ marginBottom: "18px" }}>
        <div id="dashboard-stats-overview-chart">
          <CardHeader
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill={T.blue}>
                <path d="M3 3v18h18v-2H5V3H3Zm4 14h2V9H7v8Zm4 0h2V5h-2v12Zm4 0h2v-6h-2v6Z" />
              </svg>
            }
            title={`Biểu đồ xu hướng tổng quan — ${activeOption?.label}`}
            right={
              <span style={{ fontSize: "11px", fontWeight: 600, color: T.inkMuted, background: T.surfaceSub, border: `1px solid ${T.border}`, padding: "3px 10px", borderRadius: "999px" }}>
                {trendData.length} mốc · {activeOption?.caption}
              </span>
            }
          />
          <CardBody>
            <TrendOverviewChart data={trendData} />
          </CardBody>
        </div>
      </Card>


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
            title="Phòng ban"
          />
          <CardBody style={{ flex: 1, maxHeight:"320px", overflowY:"auto" }}>
            {allDepartments.length === 0 ? (
              <p style={{ fontSize:"13px", color:T.inkFaint, textAlign:"center", padding:"24px 0" }}>Chưa có dữ liệu phòng ban.</p>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
                {[...allDepartments].sort((a, b) => (b.memberCount || 0) - (a.memberCount || 0)).map((dept, i) => {
                  const maxC = Math.max(...allDepartments.map(d => d.memberCount || 0), 1);
                  const pct = Math.round(((dept.memberCount || 0) / maxC) * 100);
                  const colors = [T.blue, T.green, T.amber, T.cyan, T.violet];
                  const rc = colors[i % colors.length];
                  return (
                    <div key={dept.id || i} style={{ display:"flex", alignItems:"center", gap:"14px" }}>
                      <span style={{ fontSize:"11px", fontWeight:700, color:rc, width:"22px", textAlign:"center", flexShrink:0 }}>#{i+1}</span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:"flex", alignItems:"baseline", justifyContent:"space-between", marginBottom:"6px" }}>
                          <span style={{ fontWeight:600, fontSize:"13px", color:T.ink, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:"150px" }}>{dept.name}</span>
                          <span style={{ fontWeight:700, fontSize:"14px", color:rc, flexShrink:0, marginLeft:"8px" }}>{formatNumber(dept.memberCount || 0)}</span>
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
                {(data?.recentActivities || []).map((act, i) => {
                  const actionLabel = getActivityActionLabel(act.action);
                  const targetLabel = getActivityTargetLabel(act.target);
                  return (
                    <div key={act.id || i} className="dash-act-row" style={{ display:"flex", gap:"10px", alignItems:"flex-start", padding:"10px 0" }}>
                      <Avatar name={act.actor?.fullName} size={32}/>
                      <div style={{ minWidth:0, flex:1 }}>
                        <div style={{ fontWeight:600, fontSize:"12px", color:T.ink, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{act.actor?.fullName || "Hệ thống"}</div>
                        <div style={{ fontSize:"11.5px", color:T.inkMuted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                          {actionLabel}{targetLabel ? ` · ${targetLabel}` : ""}
                        </div>
                        <div style={{ fontSize:"10.5px", color:T.inkFaint, marginTop:"1px" }}>{formatDate(act.createdAt)}</div>
                      </div>
                    </div>
                  );
                })}
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
              <button className="dash-link-viewall" onClick={() => window.dispatchEvent(new CustomEvent("app:navigate", { detail: { page: "documents" } }))}>
                Xem tất cả
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            }
          />
          <CardBody style={{ padding:"0 0 14px 0", flex: 1, overflowX: "auto", maxHeight: "320px", overflowY: "auto" }}>
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
                  (data?.recentDocuments || []).map((doc, i) => (
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
function DepartmentHeadDashboard({ data, onRefresh }) {
  const dept = data?.department || {};
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [selectedPointIndex, setSelectedPointIndex] = useState(STATIC_TREND.month.trend.length - 1);
  const [exporting, setExporting] = useState(false);
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
      { label:"Tổng nhân sự",   value:ms.total,   change:`${ms.active ?? "—"} đang hoạt động`, tone:"text-primary", metricKey:"done",       href:"users"     },
      { label:"Nhân sự active", value:ms.active,  change:"đang hoạt động",                     tone:"text-success", metricKey:"files",      href:"users"     },
      { label:"Tổng tài liệu",  value:ds.total,   change:`${ds.active ?? "—"} đang active`,    tone:"text-warning", metricKey:"processing", href:"documents" },
      { label:"Chờ duyệt",      value:ds.pending, change:"tài liệu cần xử lý",                 tone:"text-info",    metricKey:"events",     href:"documents" },
    ];
  }, [data?.memberStats, data?.documentStats]);

  const handleExport = () => {
    setExporting(true);
    try {
      const trendSheetRows = [["Khoảng thời gian", "Mốc", "Công việc hoàn thành", "Hồ sơ xử lý", "Đang xử lý", "Sự kiện"]];
      PERIOD_OPTIONS.forEach((opt) => {
        STATIC_TREND[opt.id].trend.forEach((point) => {
          trendSheetRows.push([opt.label, point.label, point.done || 0, point.files || 0, point.processing || 0, point.events || 0]);
        });
      });

      exportDashboardToExcel({
        fileLabel: `PhongBan_${(dept.name || "").replace(/[^a-zA-Z0-9]/g, "") || "KhongTen"}`,
        sheets: [
          {
            name: "Tổng quan KPI",
            aoa: [["Chỉ số", "Giá trị"], ...kpiCards.map((k) => [k.label, k.value ?? 0])],
            colWidths: [26, 16],
          },
          {
            name: "Phễu chuyển đổi CRM",
            aoa: [
              ["Giai đoạn phễu", "Số lượng Lead", "Tỷ lệ (%)", "Mô tả"],
              ...STATIC_CRM_FUNNEL.map((f) => [f.stage, f.count, `${f.pct}%`, f.desc]),
            ],
            colWidths: [24, 16, 14, 34],
          },
          { name: "Xu hướng theo thời gian", aoa: trendSheetRows, colWidths: [18, 12, 20, 16, 14, 12] },
          {
            name: "Nhân sự",
            aoa: [
              ["Họ tên", "Email", "Trạng thái"],
              ...(data?.members || []).map((m) => [m.fullName || "", m.email || "", getStatusLabel(m.status)]),
            ],
            colWidths: [26, 30, 16],
          },
          {
            name: "Hoạt động phòng ban",
            aoa: [
              ["Người thực hiện", "Hành động", "Đối tượng", "Thời gian"],
              ...(data?.recentActivities || []).map((act) => [
                act.actor?.fullName || "Hệ thống",
                getActivityActionLabel(act.action),
                getActivityTargetLabel(act.target),
                formatDate(act.createdAt),
              ]),
            ],
            colWidths: [22, 26, 26, 16],
          },
          {
            name: "Tài liệu phòng ban",
            aoa: [
              ["Tên tài liệu", "Trạng thái"],
              ...(data?.recentDocuments || []).map((d) => [d.title || "", getStatusLabel(d.status)]),
            ],
            colWidths: [42, 18],
          },
        ],
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="dash-fadein">
      {/* ── PAGE HEADER ─────────────────────────────────────────────────── */}
      <div id="dashboard-stats-header" style={{ marginBottom:"20px", display:"flex", flexWrap:"wrap", alignItems:"center", justifyContent:"space-between", gap:"12px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <h1 style={{ margin:0, fontSize:"21px", fontWeight:800, color:T.ink, letterSpacing:"-.02em" }}>Dashboard Vận Hành Phòng Ban</h1>
            <span style={{ fontSize: "11px", fontWeight: 700, color: T.blue, background: T.blueSoft, padding: "3px 10px", borderRadius: "999px", border: `1px solid ${T.blue}33` }}>
              {dept.name || "Phòng Ban"}
            </span>
          </div>
          <div style={{ fontSize:"13px", color:T.inkMuted }}>
            {data?.roleName} · Theo dõi &amp; Quản trị vận hành nội bộ
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:"10px", flexWrap:"wrap" }}>
          <PeriodTabs selected={selectedPeriod} onChange={handleSelectPeriod}/>
          <DashboardHeaderActions onRefresh={onRefresh} onExport={handleExport} exporting={exporting}/>
        </div>
      </div>

      {/* ── AI INSIGHTS NOTIFICATIONS ────────────────────────────────────── */}
      <AiInsightsSection />

      {/* ── KPI CARDS ───────────────────────────────────────────────────── */}
      <div id="dashboard-stats-kpi-grid" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:"14px", marginBottom:"18px" }}>
        {kpiCards.map(c => <KpiCard key={c.label} {...c} trend={trendData}/>)}
      </div>

      {/* ── PHỄU CRM VÀ PHÂN BỔ CHƯƠNG TRÌNH ──────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "14px", marginBottom: "18px", alignItems: "stretch" }}>
        <CrmPipelineFunnelChart />
        <ProgramDistributionWidget />
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

      {/* ── BIỂU ĐỒ TỔNG QUAN TẤT CẢ CÁC MỐC (vd: cả 4 tuần trong tháng) ──── */}
      <Card style={{ marginBottom:"18px" }}>
        <div id="dashboard-stats-overview-chart">
          <CardHeader
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill={T.blue}><path d="M3 3v18h18v-2H5V3H3Zm4 14h2V9H7v8Zm4 0h2V5h-2v12Zm4 0h2v-6h-2v6Z"/></svg>}
            title={`Biểu đồ tổng quan tất cả các mốc — ${activeOption?.label}`}
            right={<span style={{ fontSize:"11px", fontWeight:600, color:T.inkMuted, background:T.surfaceSub, border:`1px solid ${T.border}`, padding:"3px 10px", borderRadius:"999px" }}>{trendData.length} mốc · {activeOption?.caption}</span>}
          />
          <CardBody>
            <TrendOverviewChart data={trendData} />
          </CardBody>
        </div>
      </Card>

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
                      <div style={{ fontWeight:600, fontSize:"12px", color:T.ink, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{act.actor?.fullName || "Hệ thống"}</div>
                      <div style={{ fontSize:"11.5px", color:T.inkMuted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {getActivityActionLabel(act.action)}{getActivityTargetLabel(act.target) ? ` · ${getActivityTargetLabel(act.target)}` : ""}
                      </div>
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
              <button className="dash-link-viewall" onClick={() => window.dispatchEvent(new CustomEvent("app:navigate", { detail: { page: "documents" } }))}>
                Xem tất cả
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            }
          />
          <CardBody style={{ padding:"0 0 14px 0", flex: 1, overflowX: "auto", maxHeight: "320px", overflowY: "auto" }}>
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
                  (data?.recentDocuments || []).map((doc, i) => (
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
  "60c72b2f9b1d8b2bad000001": "staff",
};
const ALLOWED_ROLES = ["admin", "bangiamdoc", "truongbophan", "nhansu", "daily", "congtacvien", "staff", "user"];

const normalizeRoleKey = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

const getUserRoleKey = (user) => {
  const roleValue = user?.role?.slug || user?.role?.name || user?.roleName || user?.role || "";
  return normalizeRoleKey(roleValue || ROLE_ID_MAP[user?.roleId] || "user");
};

function CollaboratorDashboard({ data, onRefresh }) {
  const T = useT();
  const monthlyStats = data?.monthlyStats?.stats || {};
  const summaries = data?.commissionSummaries || {};
  const user = data?.user || {};
  const recentCommissions = data?.recentCommissions || [];
  const [exporting, setExporting] = useState(false);

  const money = (value) => `${formatNumber(value || 0)} VND`;
  const cards = [
    { label: "Lead phát sinh", value: monthlyStats.referrals || 0, change: "trong tháng", tone: "text-primary" },
    { label: "Data đủ điều kiện", value: monthlyStats.qualified || 0, change: "hồ sơ", tone: "text-success" },
    { label: "Doanh số", value: monthlyStats.sales || 0, change: "VND ghi nhận", tone: "text-warning" },
    { label: "Hoa hồng", value: monthlyStats.commissionEarned || 0, change: "VND tạm tính", tone: "text-info" },
  ];

  const handleExport = () => {
    setExporting(true);
    try {
      exportDashboardToExcel({
        fileLabel: `CTV_${(user.fullName || "").replace(/[^a-zA-Z0-9]/g, "") || "KhongTen"}`,
        sheets: [
          {
            name: "Tổng quan KPI",
            aoa: [["Chỉ số", "Giá trị"], ...cards.map((c) => [c.label, c.value ?? 0])],
            colWidths: [24, 18],
          },
          {
            name: "Tổng hợp hoa hồng",
            aoa: [
              ["Hạng mục", "Số tiền (VND)"],
              ["Chờ đối soát", summaries.pending || 0],
              ["Đã đối soát", summaries.approved || 0],
              ["Đã thanh toán", summaries.paid || 0],
              ["Tổng hợp lệ", summaries.total || 0],
            ],
            colWidths: [22, 18],
          },
          {
            name: "Hoa hồng gần đây",
            aoa: [
              ["Khách hàng", "Dịch vụ", "Trạng thái", "Hoa hồng (VND)"],
              ...recentCommissions.map((item) => [
                item.customerName || "Khách hàng",
                item.productInterest || "Dịch vụ",
                item.status || "pending",
                item.commissionAmount || 0,
              ]),
            ],
            colWidths: [24, 24, 16, 18],
          },
        ],
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="dash-fadein">
      <div id="dashboard-stats-header" style={{ marginBottom: "20px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: T.ink }}>Dashboard cộng tác viên</h1>
          <div style={{ fontSize: "13px", color: T.inkMuted, marginTop: "3px" }}>
            {user.fullName || "Cộng tác viên"} · Hạng <strong style={{ color: T.ink }}>{user.rank || "Bronze"}</strong>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:"10px", flexWrap:"wrap" }}>
          <span style={{ fontSize: "12px", fontWeight: 600, color: T.blue, background: T.blueSoft, border: `1px solid ${T.blueMid}`, padding: "6px 12px", borderRadius: "999px" }}>
            {data?.roleName || "Cộng tác viên"}
          </span>
          <DashboardHeaderActions onRefresh={onRefresh} onExport={handleExport} exporting={exporting}/>
        </div>
      </div>

      <div id="dashboard-stats-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "14px", marginBottom: "18px" }}>
        {cards.map((card) => (
          <KpiCard key={card.label} {...card} />
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: "14px", alignItems: "stretch" }}>
        <Card>
          <CardHeader title="Tổng hợp hoa hồng" />
          <CardBody style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: "10px" }}>
            <StatTile label="Chờ đối soát" value={money(summaries.pending)} tone="text-warning" />
            <StatTile label="Đã đối soát" value={money(summaries.approved)} tone="text-success" />
            <StatTile label="Đã thanh toán" value={money(summaries.paid)} tone="text-primary" />
            <StatTile label="Tổng hợp lệ" value={money(summaries.total)} tone="text-info" />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Hoa hồng gần đây" />
          <CardBody style={{ padding: "0 0 14px 0", maxHeight: "320px", overflowY: "auto" }}>
            {recentCommissions.length === 0 ? (
              <p style={{ fontSize: "13px", color: T.inkFaint, textAlign: "center", padding: "32px 16px", margin: 0 }}>Chưa có giao dịch hoa hồng.</p>
            ) : (
              recentCommissions.map((item) => (
                <div key={item.id || item._id} className="dash-act-row" style={{ padding: "12px 20px", display: "flex", justifyContent: "space-between", gap: "12px" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: "13px", color: T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.customerName || "Khách hàng"}</div>
                    <div style={{ fontSize: "11px", color: T.inkMuted }}>{item.productInterest || "Dịch vụ"} · {item.status || "pending"}</div>
                  </div>
                  <strong style={{ fontSize: "13px", color: T.green, whiteSpace: "nowrap" }}>{money(item.commissionAmount)}</strong>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────
export const DashboardPage = ({ currentUser }) => {
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

        // Kiểm tra quyền dynamic của user (dùng currentUser từ profile sync, không dùng JWT decode)
        const userRole = getUserRoleKey(currentUser);
        const userPermissions = Array.isArray(currentUser?.permissions) ? currentUser.permissions : [];
        const isAuthorized = ALLOWED_ROLES.includes(userRole) ||
          userPermissions.includes("dashboard:view") ||
          userPermissions.includes("*");

        if (!isAuthorized) {
          if (!cancelled) setAccessDenied(true);
          return;
        }

        // Xác định endpoint dựa trên role và phòng ban của user
        const isTopLevel = ["admin", "bangiamdoc"].includes(userRole);
        const hasDepartment = Boolean(currentUser?.departmentId);
        let endpoint = `${API_BASE_URL}/dashboard`;

        if (isTopLevel) {
          endpoint = `${API_BASE_URL}/dashboard/board-of-directors`;
        } else if (userRole === "congtacvien") {
          endpoint = `${API_BASE_URL}/dashboard/collaborator`;
        } else if (userRole === "daily") {
          endpoint = `${API_BASE_URL}/dashboard/agent`;
        } else if (userRole === "truongbophan" || hasDepartment) {
          endpoint = `${API_BASE_URL}/dashboard/department-head`;
        } else {
          endpoint = `${API_BASE_URL}/dashboard/employee`;
        }

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
  }, [retryCount, currentUser]);

  const renderContent = () => {
    if (loading)      return <LoadingSpinner/>;
    if (accessDenied) return <AccessDenied/>;
    if (error)        return <ErrorState message={error} onRetry={handleRetry}/>;
    if (!dashboardData) return null;
    const role = dashboardData.role;
    // Hiển thị đúng dashboard tương ứng với dữ liệu API trả về
    if (role === "admin" || role === "board_of_directors" || role === "bangiamdoc") return <BoardDashboard data={dashboardData} onRefresh={handleRetry}/>;
    if (role === "congtacvien") return <CollaboratorDashboard data={dashboardData} onRefresh={handleRetry}/>;
    if (role === "truongbophan") return <DepartmentHeadDashboard data={dashboardData} onRefresh={handleRetry}/>;
    // Nếu user được cấp dashboard:view nhưng không rơi vào 2 loại trên,
    // hiển thị DepartmentHeadDashboard (nếu dữ liệu từ department-head) hoặc BoardDashboard
    if (dashboardData.department) return <DepartmentHeadDashboard data={dashboardData} onRefresh={handleRetry}/>;
    return <BoardDashboard data={dashboardData} onRefresh={handleRetry}/>;
  };

  return (
    <ThemeCtx.Provider value={tokens}>
      <GlobalStyles/>
      <div className="dash-root" style={{ padding:"24px 28px", maxWidth:"1600px",  minHeight:"100vh", fontFamily:"'Inter', system-ui, sans-serif" }}>
        {renderContent()}
      </div>
    </ThemeCtx.Provider>
  );
};
