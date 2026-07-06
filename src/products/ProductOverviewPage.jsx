import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { API_BASE_URL } from "../config/api";
import { authFetch, getAuthHeaders } from "../auth/session";
import { ToastDispatchContext, useToast } from "./ToastContext";
import { beginLeadSubmission, finishLeadSubmission, markLeadReadyForReconciliation, normalizeLeadPhone } from "../utils/leadSubmission";
const STATIC_BASE_URL = API_BASE_URL.replace("/api/v1", "");

// Key dùng chung với Sidebar.jsx để truyền danh mục được chọn khi điều hướng
const SIDEBAR_CATEGORY_STORAGE_KEY = "hto_selected_product_category";
// Sự kiện dùng để Sidebar báo ngay cho trang này (nếu đã mount sẵn) khi người dùng đổi danh mục
const SIDEBAR_CATEGORY_EVENT = "hto:select-product-category";

// Đọc (và xóa) danh mục được Sidebar chọn — gọi trong lazy initializer của useState,
// KHÔNG gọi trong effect, để tránh setState đồng bộ bên trong effect (react-hooks/set-state-in-effect)
const readPendingSidebarCategory = () => {
  try {
    const raw = sessionStorage.getItem(SIDEBAR_CATEGORY_STORAGE_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(SIDEBAR_CATEGORY_STORAGE_KEY);
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
};

const getReferralCode = () => {
  try {
    const params = new URLSearchParams(window.location.search);
    const urlCode = params.get("ref") || params.get("referral") || params.get("referralCode") || params.get("maGioiThieu");
    if (urlCode) {
      window.localStorage.setItem("hto_referral_code", urlCode);
      return urlCode;
    }

    const storedUser = JSON.parse(window.localStorage.getItem("auth_user") || "null");
    return storedUser?.referralCode || storedUser?.referral_code || window.localStorage.getItem("hto_referral_code") || "";
  } catch {
    return "";
  }
};

const cleanVietnameseText = (str) => {
  if (!str) return "";
  let res = str.normalize("NFC");
  const replacements = {
    "a`": "à", "A`": "À",
    "â`": "ầ", "Â`": "Ầ",
    "ă`": "ằ", "Ă`": "Ằ",
    "e`": "è", "E`": "È",
    "ê`": "ề", "Ê`": "Ề",
    "i`": "ì", "I`": "Ì",
    "o`": "ò", "O`": "Ò",
    "ô`": "ồ", "Ô`": "Ồ",
    "ơ`": "ờ", "Ơ`": "Ờ",
    "u`": "ù", "U`": "Ù",
    "ư`": "ừ", "Ư`": "Ừ",
    "y`": "ỳ", "Y`": "Ỳ",
    "a´": "á", "A´": "Á",
    "â´": "ấ", "Â´": "Ấ",
    "ă´": "ắ", "Ă´": "Ắ",
    "e´": "é", "E´": "É",
    "ê´": "ế", "Ê´": "Ế",
    "i´": "í", "I´": "Í",
    "o´": "ó", "O´": "Ó",
    "ô´": "ố", "Ô´": "Ố",
    "ơ´": "ớ", "Ơ´": "Ớ",
    "u´": "ú", "U´": "Ú",
    "ư´": "ứ", "Ư´": "Ứ",
    "y´": "ý", "Y´": "Ý"
  };
  for (const [key, val] of Object.entries(replacements)) {
    res = res.replace(new RegExp(key, "g"), val);
  }
  return res.replace(/[`´]/g, "");
};

const numberToVietnameseWords = (num) => {
  if (!num || isNaN(num)) return "Không đồng";
  const units = ["", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
  const unitsTen = ["", "mười", "hai mươi", "ba mươi", "bốn mươi", "năm mươi", "sáu mươi", "bảy mươi", "tám mươi", "chín mươi"];
  
  const readThreeDigits = (threeDigits, showZeroHundred) => {
    let hundred = Math.floor(threeDigits / 100);
    let ten = Math.floor((threeDigits % 100) / 10);
    let unit = threeDigits % 10;
    let res = "";
    
    if (hundred > 0 || showZeroHundred) {
      res += units[hundred] + " trăm ";
    }
    
    if (ten > 0) {
      res += unitsTen[ten] + " ";
    } else if (hundred > 0 && unit > 0) {
      res += "lẻ ";
    }
    
    if (unit > 0) {
      if (unit === 1 && ten > 1) {
        res += "mốt";
      } else if (unit === 5 && ten > 0) {
        res += "lăm";
      } else {
        res += units[unit];
      }
    }
    return res.trim();
  };

  let strNum = Math.floor(num).toString();
  let groups = [];
  while (strNum.length > 0) {
    groups.push(parseInt(strNum.slice(-3)));
    strNum = strNum.slice(0, -3);
  }

  const levels = ["", "nghìn", "triệu", "tỷ", "nghìn tỷ", "triệu tỷ"];
  let words = "";
  for (let i = groups.length - 1; i >= 0; i--) {
    let g = groups[i];
    if (g > 0) {
      let gWords = readThreeDigits(g, i < groups.length - 1);
      words += gWords + " " + levels[i] + " ";
    }
  }

  words = words.trim();
  if (!words) return "Không đồng";
  return words.charAt(0).toUpperCase() + words.slice(1) + " đồng chẵn";
};

// ==========================================
// MOCK DATA - LUÔN CÓ SẴN ĐỂ FALLBACK
// ==========================================
const VISA_TYPES = [
  { id: "vtype-1", name: "Visa Du học", icon: "fa-graduation-cap", desc: "Hồ sơ xin visa du học các nước", color: "text-[#2563eb]", gradient: "bg-linear-to-b from-[#e0f2fe] to-white", btnBg: "bg-[#eff6ff] text-[#2563eb] hover:bg-[#dbeafe]", docsCount: 12, filesCount: 18 },
  { id: "vtype-2", name: "Visa Du lịch", icon: "fa-plane", desc: "Hồ sơ xin visa du lịch, thăm thân", color: "text-[#059669]", gradient: "bg-linear-to-b from-[#d1fae5] to-white", btnBg: "bg-[#ecfdf5] text-[#059669] hover:bg-[#d1fae5]", docsCount: 8, filesCount: 10 },
  { id: "vtype-3", name: "Visa Định cư", icon: "fa-house", desc: "Hồ sơ xin định cư, bảo lãnh", color: "text-[#d97706]", gradient: "bg-linear-to-b from-[#fef3c7] to-white", btnBg: "bg-[#fffbeb] text-[#d97706] hover:bg-[#fef3c7]", docsCount: 7, filesCount: 12 },
  { id: "vtype-4", name: "Visa Công tác", icon: "fa-briefcase", desc: "Hồ sơ xin visa công tác, làm việc", color: "text-[#7c3aed]", gradient: "bg-linear-to-b from-[#f3e8ff] to-white", btnBg: "bg-[#faf5ff] text-[#7c3aed] hover:bg-[#f3e8ff]", docsCount: 5, filesCount: 6 }
];

const MOCK_CATEGORIES = [
  {
    id: "cat-1",
    name: "Du học hè",
    description: "Các chương trình du học hè ngắn hạn kết hợp học tập, rèn luyện kỹ năng và giao lưu văn hóa tại nhiều quốc gia phát triển.",
    status: "active",
    coverImageUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80",
    programs: [
      {
        id: "prog-1-1",
        name: "Du học hè Singapore",
        country: "Singapore",
        region: "Châu Á",
        description: "Chương trình du học hè tại Singapore",
        detailDescription: "Chi tiết chương trình du học hè Singapore",
        targetAudience: "Học sinh 7-17 tuổi",
        highlights: ["Học tiếng Anh với giáo viên bản ngữ", "Tham quan các địa danh nổi tiếng"],
        processSteps: ["Đăng ký", "Nộp hồ sơ", "Phỏng vấn"],
        tags: ["Chất lượng cao", "An toàn"],
        websiteUrl: "",
        serviceFee: 0,
        currency: "VND",
        image: "",
        brochure: null,
        documents: [],
        updatedAt: "2026-06-17",
        status: "active",
        isActive: true
      }
    ]
  },
  {
    id: "cat-2",
    name: "Du học nghề",
    description: "Lộ trình du học nghề kép vừa học vừa làm có hưởng lương. Miễn 100% học phí, nhận trợ cấp thực hành và cam kết việc làm sau tốt nghiệp.",
    status: "active",
    coverImageUrl: "https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=800&q=80",
    programs: []
  },
  {
    id: "cat-3",
    name: "Visa",
    description: "Dịch vụ tư vấn, thẩm định hồ sơ, luyện phỏng vấn và hoàn thiện thủ tục xin Visa du học, du lịch, định cư và công tác các nước.",
    status: "active",
    coverImageUrl: "https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?auto=format&fit=crop&w=800&q=80",
    programs: [
      {
        id: "prog-visa-1",
        name: "Dịch vụ xin Visa Úc trọn gói",
        country: "Úc",
        region: "Châu Đại Dương",
        description: "Tư vấn và xử lý hồ sơ xin visa Úc chuyên nghiệp",
        targetAudience: "Khách hàng có nhu cầu xin visa",
        status: "active",
        isActive: true
      }
    ]
  },
  {
    id: "cat-4",
    name: "Định cư",
    description: "Giải pháp định cư an toàn cho cả gia đình thông qua các chương trình lao động tay nghề cao, đầu tư kinh doanh hoặc bảo lãnh nhân thân.",
    status: "active",
    coverImageUrl: "https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?auto=format&fit=crop&w=800&q=80",
    programs: []
  },
  {
    id: "cat-5",
    name: "Đào tạo ngôn ngữ",
    description: "Khóa đào tạo ngoại ngữ cấp tốc chất lượng cao (Tiếng Đức, Anh, Hàn, Nhật) cam kết chuẩn đầu ra phục vụ làm việc và xin visa.",
    status: "active",
    coverImageUrl: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80",
    programs: []
  }
];

// ==========================================
// TOAST NOTIFICATION SYSTEM
// ==========================================
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dispatch = useCallback((toast) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, ...toast }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, toast.duration || 3500);
  }, []);

  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const ICONS = {
    success: (
      <svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5 text-cyan-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  const STYLES = {
    success: "border-emerald-200 bg-emerald-50",
    error: "border-red-200 bg-red-50",
    warning: "border-amber-200 bg-amber-50",
    info: "border-cyan-200 bg-cyan-50",
  };

  return (
    <ToastDispatchContext.Provider value={dispatch}>
      {children}
      <div className="fixed top-4 right-4 z-9999 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-lg animate-[slideInRight_0.25s_ease-out] ${STYLES[t.type] || STYLES.info}`}
          >
            {ICONS[t.type] || ICONS.info}
            <div className="flex-1 min-w-0">
              {t.title && <p className="text-sm font-semibold text-slate-800 mb-0.5">{t.title}</p>}
              <p className="text-xs text-slate-600 leading-relaxed">{t.message}</p>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-slate-600 transition-colors shrink-0 mt-0.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastDispatchContext.Provider>
  );
}

// ==========================================
// CONFIRM MODAL COMPONENT
// ==========================================
function ConfirmModal({ isOpen, title, message, confirmLabel = "Xác nhận", cancelLabel = "Hủy", variant = "danger", onConfirm, onCancel }) {
  if (!isOpen) return null;

  const btnStyles = {
    danger: "bg-red-600 hover:bg-red-700 text-white",
    warning: "bg-amber-500 hover:bg-amber-600 text-white",
    primary: "bg-cyan-900 hover:bg-cyan-950 text-white",
  };

  const iconStyles = {
    danger: { bg: "bg-red-100", icon: "text-red-600", path: "M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" },
    warning: { bg: "bg-amber-100", icon: "text-amber-600", path: "M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" },
    primary: { bg: "bg-cyan-100", icon: "text-cyan-700", path: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  };

  const s = iconStyles[variant] || iconStyles.danger;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[3px] flex items-center justify-center p-4 z-9998 animate-[fadeIn_0.15s_ease-out]">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-[slideUp_0.2s_cubic-bezier(0.16,1,0.3,1)]">
        <div className="flex items-start gap-4">
          <div className={`shrink-0 w-10 h-10 rounded-full ${s.bg} flex items-center justify-center`}>
            <svg className={`w-5 h-5 ${s.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.path} />
            </svg>
          </div>
          <div className="flex-1">
            {title && <h6 className="font-bold text-slate-800 text-sm mb-1">{title}</h6>}
            <p className="text-slate-500 text-sm leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="flex gap-3 mt-5 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="text-slate-600 border border-slate-200 hover:bg-slate-50 text-xs font-semibold py-2 px-4 rounded-xl transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`text-xs font-semibold py-2 px-4 rounded-xl transition-colors ${btnStyles[variant] || btnStyles.danger}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// API HELPERS — Products & Categories
// ==========================================

const parseApiError = async (response) => {
  if (response.status === 403) return "Bạn không có quyền thực hiện thao tác này.";
  if (response.status === 401) return "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.";
  if (response.status === 404) return "Không tìm thấy dữ liệu yêu cầu.";
  try {
    const body = await response.json();
    return body?.message || body?.error || `Lỗi máy chủ (${response.status}).`;
  } catch {
    return `Lỗi máy chủ (${response.status}).`;
  }
};

const apiRequest = async (url, options = {}) => {
  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {})
  };
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  const response = await authFetch(url, { ...options, headers });
  if (!response.ok) {
    const msg = await parseApiError(response);
    throw new Error(msg);
  }
  const text = await response.text();
  return text ? JSON.parse(text) : null;
};

// Helper: parse extended info từ description (lưu dưới dạng JSON)
const parseExtendedInfo = (description) => {
  if (!description) return { mainDescription: "", extendedData: {} };
  if (description.startsWith('{') && description.includes('"__extended__"')) {
    try {
      const parsed = JSON.parse(description);
      if (parsed.__extended__) {
        return {
          mainDescription: parsed.mainDescription || "",
          extendedData: parsed
        };
      }
    } catch {
      return { mainDescription: description, extendedData: {} };
    }
  }
  return { mainDescription: description, extendedData: {} };
};

// Build description với extended data
const buildDescription = (mainDescription, extendedData) => {
  if (Object.keys(extendedData).length === 0) return mainDescription;
  return JSON.stringify({
    __extended__: true,
    mainDescription: mainDescription || "",
    ...extendedData
  });
};

// Map product từ API về UI format
const mapApiProductToUiProduct = (apiProduct, categoryId, categoryName) => {
  if (!apiProduct) return null;
  const id = apiProduct._id || apiProduct.id;
  const catId = (typeof apiProduct.categoryId === "object"
    ? apiProduct.categoryId?._id || apiProduct.categoryId?.id
    : apiProduct.categoryId) || categoryId || "";
  const catName = apiProduct.categoryName || categoryName || "";

  const { mainDescription, extendedData } = parseExtendedInfo(apiProduct.description);

  const requirements = Array.isArray(apiProduct.requirements) ? apiProduct.requirements : [];
  const highlights = requirements
    .filter(r => r.criteriaType !== "tag" && r.criteriaType !== "processStep")
    .map(r => r.criteriaValue || `${r.criteriaType}: ${r.criteriaValue}`)
    .filter(Boolean);

  const steps = Array.isArray(apiProduct.steps) ? apiProduct.steps : [];
  const processSteps = steps
    .slice()
    .sort((a, b) => (a.stepOrder || 0) - (b.stepOrder || 0))
    .map(s => s.stepName || s.description || "")
    .filter(Boolean);

  const costs = Array.isArray(apiProduct.costs) ? apiProduct.costs : [];

  const status = apiProduct.status ||
    (apiProduct.isActive === false ? "inactive" : "active");

  let cleanImagePath = apiProduct.image || "";
  if (cleanImagePath.includes("localhost:3000")) {
    cleanImagePath = cleanImagePath.replace(/^http:\/\/localhost:3000/, "");
  }

  const image = cleanImagePath
    ? (cleanImagePath.startsWith("http")
      ? cleanImagePath
      : `${STATIC_BASE_URL}/${cleanImagePath.replace(/^\//, "")}`)
    : "";

  const tags = requirements.filter(r => r.criteriaType === "tag").map(r => r.criteriaValue).filter(Boolean);

  const serviceFeeItem = costs.find(c => c.itemName === "Phí dịch vụ");
  const serviceFee = serviceFeeItem?.amount || apiProduct.serviceFee || 0;
  const currency = serviceFeeItem?.currency || apiProduct.currency || "VND";

  return {
    id,
    name: apiProduct.name || "",
    categoryId: catId,
    categoryName: catName,
    country: apiProduct.country || "",
    region: extendedData.region || "Châu Á",
    status,
    isActive: apiProduct.isActive !== false,
    description: mainDescription,
    detailDescription: extendedData.detailDescription || mainDescription,
    targetAudience: extendedData.targetAudience || "",
    highlights,
    processSteps,
    steps,
    requirements,
    costs,
    serviceFee,
    currency,
    tags: extendedData.tags || tags,
    websiteUrl: extendedData.websiteUrl || "",
    image,
    brochure: extendedData.brochure || null,
    documents: extendedData.documents || [],
    gradientFrom: extendedData.gradientFrom || "#0d2040",
    gradientTo: extendedData.gradientTo || "#1a3a6b",
    updatedAt: apiProduct.updatedAt || extendedData.updatedAt || "",
    visaCode: apiProduct.visaCode || "",
    shortCode: apiProduct.shortCode || "",
    purpose: apiProduct.purpose || ""
  };
};

/**
 * Chuyển đổi dữ liệu danh mục từ API về định dạng chuẩn của giao diện (UI)
 */
const mapApiCategoryToUiCategory = (apiCategory) => {
  if (!apiCategory) return null;

  const id = apiCategory._id || apiCategory.id || "";
  const name = apiCategory.name || "";
  const description = apiCategory.description || "";
  const status = apiCategory.status || (apiCategory.isActive === false ? "inactive" : "active");
  const updatedAt = apiCategory.updatedAt || "";

  let rawUrl = apiCategory.coverImageUrl || apiCategory.imageUrl || apiCategory.image || "";

  if (rawUrl.includes("localhost:3000")) {
    rawUrl = rawUrl.replace(/^http:\/\/localhost:3000/, "");
  }

  const coverImageUrl = rawUrl
    ? (rawUrl.startsWith("http://") || rawUrl.startsWith("https://") || rawUrl.startsWith("data:")
      ? rawUrl
      : `${STATIC_BASE_URL}/${rawUrl.replace(/^\//, "")}`)
    : "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80";

  return {
    id,
    name,
    description,
    status,
    updatedAt,
    coverImageUrl,
    programs: [],
    products: []
  };
};

const safeText = (value) => String(value || "").toLowerCase().trim();
const safeArray = (value) => Array.isArray(value) ? value : [];

// Map mã quốc gia ISO → tên tiếng Việt đầy đủ
const COUNTRY_CODE_MAP = {
  AF: "Afghanistan", AL: "Albania", DZ: "Algeria", AR: "Argentina",
  AU: "Úc", AT: "Áo", BE: "Bỉ", BR: "Brazil", KH: "Campuchia",
  CA: "Canada", CL: "Chile", CN: "Trung Quốc", CO: "Colombia",
  HR: "Croatia", CZ: "Cộng hòa Séc", DK: "Đan Mạch", EG: "Ai Cập",
  FI: "Phần Lan", FR: "Pháp", DE: "Đức", GH: "Ghana", GR: "Hy Lạp",
  HK: "Hồng Kông", HU: "Hungary", IN: "Ấn Độ", ID: "Indonesia",
  IR: "Iran", IQ: "Iraq", IE: "Ireland", IL: "Israel", IT: "Ý",
  JP: "Nhật Bản", JO: "Jordan", KZ: "Kazakhstan", KE: "Kenya",
  KR: "Hàn Quốc", KW: "Kuwait", LA: "Lào", LB: "Lebanon",
  MY: "Malaysia", MX: "Mexico", MA: "Morocco", MM: "Myanmar",
  NL: "Hà Lan", NZ: "New Zealand", NG: "Nigeria", NO: "Na Uy",
  PK: "Pakistan", PH: "Philippines", PL: "Ba Lan", PT: "Bồ Đào Nha",
  QA: "Qatar", RO: "Romania", RU: "Nga", SA: "Ả Rập Xê Út",
  SG: "Singapore", ZA: "Nam Phi", ES: "Tây Ban Nha", LK: "Sri Lanka",
  SE: "Thụy Điển", CH: "Thụy Sĩ", TW: "Đài Loan", TH: "Thái Lan",
  TR: "Thổ Nhĩ Kỳ", UA: "Ukraine", AE: "UAE", GB: "Anh Quốc",
  US: "Mỹ", VN: "Việt Nam", YE: "Yemen",
};

// Chuyển mã quốc gia → tên đầy đủ (nếu có), ngược lại giữ nguyên
const resolveCountryName = (value) => {
  if (!value) return "";
  const upper = value.trim().toUpperCase();
  return COUNTRY_CODE_MAP[upper] || value.trim();
};

const ROLE_ID_MAP = {
  "69fc5af582ef85451120772a": "admin",
  "69fc5af582ef85451120772b": "bangiamdoc",
  "69fc5af582ef85451120772c": "truongbophan",
  "69fc5af582ef85451120772d": "nhansu",
  "69fc5af582ef85451120772e": "daily",
  "69fc5af682ef85451120772f": "congtacvien",
  "69fc5af782ef854511207730": "user",
};

const normalizeRoleKey = (roleValue) => {
  return String(roleValue || "")
    .trim()
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
};

const getUserRoleKey = (user) => {
  const roleFromObject = user?.role?.name || user?.roleName || user?.role || user?.role_key || "";
  const roleFromId = ROLE_ID_MAP[user?.roleId];
  return normalizeRoleKey(roleFromObject || roleFromId || "user");
};

// ==========================================
// CUSTOM DROPDOWN COMPONENT
// ==========================================
function CustomDropdown({ value, options, onChange, placeholder }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const selectedOption = options.find(opt => opt.value === value) || options[0];
  const isAll = value === "Tất cả" || value === "all";
  const displayLabel = isAll ? placeholder : (selectedOption?.label || placeholder);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full h-10 bg-white app-dark:bg-[#1e1e1e]! border ${isOpen ? "border-cyan-400 ring-2 ring-cyan-500/20" : "border-slate-200 app-dark:border-slate-700!"
          } force-rounded-xl px-3 text-sm text-slate-700 app-dark:text-slate-200! flex items-center justify-between shadow-sm transition-all duration-200 cursor-pointer focus:outline-none`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={`truncate pr-2 ${isAll ? "text-slate-700 app-dark:text-slate-400! font-medium" : "text-slate-800 app-dark:text-slate-100! font-semibold"}`}>
          {displayLabel}
        </span>
        <svg
          className={`w-4 h-4 text-slate-400 app-dark:text-slate-500! transition-transform duration-200 shrink-0 ${isOpen ? "rotate-180" : ""
            }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 z-9999 mt-1.5 max-h-[280px] overflow-y-auto force-rounded-xl border border-slate-200 app-dark:border-slate-700! bg-white app-dark:bg-[#252525]! shadow-xl p-1 animate-fade-in">
          <div role="listbox" className="flex flex-col gap-0.5">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`w-full force-rounded-lg px-3 py-2 text-left text-sm transition-colors duration-150 flex items-center justify-between cursor-pointer ${isSelected
                    ? "bg-cyan-100 app-dark:bg-cyan-900/40! text-cyan-800 app-dark:text-cyan-100! font-semibold"
                    : "text-slate-700 app-dark:text-slate-200! hover:bg-cyan-50 app-dark:hover:bg-cyan-900/30! hover:text-cyan-700 app-dark:hover:text-cyan-400"
                    }`}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                >
                  <span className="truncate pr-2">{opt.label}</span>
                  {isSelected && (
                    <svg className="w-4 h-4 text-cyan-700 app-dark:text-cyan-400! shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function MegaMenuFilter({ categories, selectedCategoryName, selectedCountry, selectedRegion, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCat, setSelectedCat] = useState(null);
  const [selectedRegionItem, setSelectedRegionItem] = useState(null);
  const [selectedCountryItem, setSelectedCountryItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const menuRef = useRef(null);

  // Lọc danh mục
  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return categories;
    const term = searchTerm.toLowerCase().trim();
    return categories.filter(cat =>
      cat?.name?.toLowerCase().includes(term) ||
      cat?.description?.toLowerCase().includes(term)
    );
  }, [categories, searchTerm]);

  // Lấy danh sách khu vực theo danh mục đã chọn
  const regionsForCat = useMemo(() => {
    if (!selectedCat) return [];
    const cat = categories.find(c => c.name === selectedCat);
    if (!cat) return [];

    const seen = new Set();
    const result = [];
    (cat.programs || []).forEach(p => {
      const raw = p?.region?.trim();
      if (raw && !seen.has(raw)) {
        seen.add(raw);
        result.push(raw);
      }
    });
    return result.sort();
  }, [categories, selectedCat]);

  // Lấy danh sách quốc gia theo danh mục + khu vực đã chọn
  const countriesForSelection = useMemo(() => {
    if (!selectedCat || !selectedRegionItem) return [];
    const cat = categories.find(c => c.name === selectedCat);
    if (!cat) return [];

    let programs = cat.programs || [];
    if (selectedRegionItem !== "Tất cả khu vực") {
      programs = programs.filter(p => safeText(p?.region) === safeText(selectedRegionItem));
    }

    const seen = new Set();
    const result = [];
    programs.forEach(p => {
      const raw = p?.country?.trim();
      if (raw && !seen.has(raw)) {
        seen.add(raw);
        result.push(raw);
      }
    });
    return result.sort((a, b) =>
      resolveCountryName(a).localeCompare(resolveCountryName(b), "vi")
    );
  }, [categories, selectedCat, selectedRegionItem]);

  // Lấy chương trình theo danh mục, khu vực và quốc gia đã chọn
  const programsForSelection = useMemo(() => {
    if (!selectedCat || !selectedRegionItem || !selectedCountryItem) return [];

    const cat = categories.find(c => c.name === selectedCat);
    if (!cat) return [];

    let programs = cat.programs || [];

    if (selectedRegionItem !== "Tất cả khu vực") {
      programs = programs.filter(p => safeText(p?.region) === safeText(selectedRegionItem));
    }

    if (selectedCountryItem !== "Tất cả quốc gia") {
      programs = programs.filter(p => safeText(p?.country) === safeText(selectedCountryItem));
    }

    return programs;
  }, [categories, selectedCat, selectedRegionItem, selectedCountryItem]);

  // Click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
        setSelectedCat(null);
        setSelectedRegionItem(null);
        setSelectedCountryItem(null);
        setSearchTerm("");
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const hasSelection = selectedCategoryName !== "Tất cả" || selectedCountry !== "Tất cả" || selectedRegion !== "Tất cả";

  const displayLabel = hasSelection
    ? [
      selectedCategoryName !== "Tất cả" && selectedCategoryName,
      selectedRegion !== "Tất cả" && selectedRegion,
      selectedCountry !== "Tất cả" && resolveCountryName(selectedCountry)
    ]
      .filter(Boolean)
      .join(" › ")
    : "Danh mục & Quốc gia";

  const handleSelectCategory = (catName) => {
    if (selectedCat === catName) {
      setSelectedCat(null);
      setSelectedRegionItem(null);
      setSelectedCountryItem(null);
    } else {
      setSelectedCat(catName);
      setSelectedRegionItem(null);
      setSelectedCountryItem(null);
    }
  };

  const handleSelectRegion = (region) => {
    if (selectedRegionItem === region) {
      setSelectedRegionItem(null);
      setSelectedCountryItem(null);
    } else {
      setSelectedRegionItem(region);
      setSelectedCountryItem(null);
    }
  };

  const handleSelectCountry = (country) => {
    if (selectedCountryItem === country) {
      setSelectedCountryItem(null);
    } else {
      setSelectedCountryItem(country);
    }
  };

  const handleApplyFilter = (catName, region, country) => {
    onSelect({
      category: catName || "Tất cả",
      region: region || "Tất cả",
      country: country || "Tất cả"
    });
    setIsOpen(false);
    setSelectedCat(null);
    setSelectedRegionItem(null);
    setSelectedCountryItem(null);
    setSearchTerm("");
  };

  const handleReset = () => {
    onSelect({ category: "Tất cả", region: "Tất cả", country: "Tất cả" });
    setIsOpen(false);
    setSelectedCat(null);
    setSelectedRegionItem(null);
    setSelectedCountryItem(null);
    setSearchTerm("");
  };

  const renderCategoryList = () => (
    <div className="p-2">
      <div className="relative mb-2">
        <input
          type="text"
          placeholder="Tìm danh mục..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full h-9 pl-8 pr-3 bg-slate-50 app-dark:bg-[#1e1e1e]! border border-slate-200 app-dark:border-slate-700! rounded-lg text-sm text-slate-700 app-dark:text-slate-200! placeholder-slate-400 app-dark:placeholder-slate-500! focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
        />
        <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      <button
        onClick={handleReset}
        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${selectedCategoryName === "Tất cả" && selectedCountry === "Tất cả" && selectedRegion === "Tất cả"
          ? "bg-cyan-50 app-dark:bg-cyan-955/35! text-cyan-700 app-dark:text-cyan-300! font-semibold"
          : "hover:bg-slate-50 app-dark:hover:bg-white/5! text-slate-600 app-dark:text-slate-300!"
          }`}
      >
        Tất cả danh mục
      </button>

      {filteredCategories.map(cat => {
        const isActive = selectedCat === cat.name;
        const count = cat.programs?.length || 0;
        return (
          <button
            key={cat.id}
            onClick={() => handleSelectCategory(cat.name)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-between ${isActive ? "bg-cyan-50 app-dark:bg-cyan-955/35! text-cyan-700 app-dark:text-cyan-300! font-semibold" : "hover:bg-slate-50 app-dark:hover:bg-white/5! text-slate-600 app-dark:text-slate-300!"
              }`}
          >
            <span>{cat.name}</span>
            <div className="flex items-center gap-2">
              {count > 0 && (
                <span className="text-[10px] text-slate-400 app-dark:text-slate-500! bg-slate-100 app-dark:bg-slate-800! px-1.5 py-0.5 rounded">
                  {count}
                </span>
              )}
              <svg className={`w-4 h-4 transition-transform ${isActive ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        );
      })}
    </div>
  );

  const renderRegionList = () => {
    if (!selectedCat) return (
      <div className="p-4 text-center text-slate-400 app-dark:text-slate-500! text-sm">
        ← Chọn danh mục để xem khu vực
      </div>
    );

    if (regionsForCat.length === 0) return (
      <div className="p-4 text-center text-slate-400 app-dark:text-slate-500! text-sm">
        Chưa có khu vực
      </div>
    );

    return (
      <div className="p-2">
        <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 app-dark:text-slate-500! uppercase tracking-wider">
          Khu vực
        </div>
        <button
          onClick={() => handleSelectRegion("Tất cả khu vực")}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${selectedRegionItem === "Tất cả khu vực" ? "bg-cyan-50 app-dark:bg-cyan-955/35! text-cyan-700 app-dark:text-cyan-300! font-semibold" : "hover:bg-slate-50 app-dark:hover:bg-white/5! text-slate-600 app-dark:text-slate-300!"
            }`}
        >
          Tất cả khu vực
        </button>
        {regionsForCat.map(region => (
          <button
            key={region}
            onClick={() => handleSelectRegion(region)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${selectedRegionItem === region ? "bg-cyan-50 app-dark:bg-cyan-955/35! text-cyan-700 app-dark:text-cyan-300! font-semibold" : "hover:bg-slate-50 app-dark:hover:bg-white/5! text-slate-600 app-dark:text-slate-300!"
              }`}
          >
            {region}
          </button>
        ))}
      </div>
    );
  };

  const renderCountryList = () => {
    if (!selectedCat || !selectedRegionItem) return (
      <div className="p-4 text-center text-slate-400 app-dark:text-slate-500! text-sm">
        {!selectedCat ? "← Chọn danh mục" : "← Chọn khu vực để xem quốc gia"}
      </div>
    );

    if (countriesForSelection.length === 0) return (
      <div className="p-4 text-center text-slate-400 app-dark:text-slate-500! text-sm">
        {selectedRegionItem === "Tất cả khu vực"
          ? "Chọn khu vực cụ thể để xem quốc gia"
          : "Chưa có quốc gia"}
      </div>
    );

    return (
      <div className="p-2">
        <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 app-dark:text-slate-500! uppercase tracking-wider">
          Quốc gia
        </div>
        <button
          onClick={() => handleSelectCountry("Tất cả quốc gia")}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${selectedCountryItem === "Tất cả quốc gia" ? "bg-cyan-50 app-dark:bg-cyan-955/35! text-cyan-700 app-dark:text-cyan-300! font-semibold" : "hover:bg-slate-50 app-dark:hover:bg-white/5! text-slate-600 app-dark:text-slate-300!"
            }`}
        >
          Tất cả quốc gia
        </button>
        {countriesForSelection.map(country => (
          <button
            key={country}
            onClick={() => handleSelectCountry(country)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${selectedCountryItem === country ? "bg-cyan-50 app-dark:bg-cyan-955/35! text-cyan-700 app-dark:text-cyan-300! font-semibold" : "hover:bg-slate-50 app-dark:hover:bg-white/5! text-slate-600 app-dark:text-slate-300!"
              }`}
          >
            {resolveCountryName(country)}
          </button>
        ))}
      </div>
    );
  };

  const renderProgramList = () => {
    if (!selectedCat || !selectedRegionItem || !selectedCountryItem) return (
      <div className="p-4 text-center text-slate-400 app-dark:text-slate-500! text-sm">
        {!selectedCat ? "← Chọn danh mục" :
          !selectedRegionItem ? "← Chọn khu vực" :
            "← Chọn quốc gia để xem chương trình"}
      </div>
    );

    if (programsForSelection.length === 0) return (
      <div className="p-4 text-center text-slate-400 app-dark:text-slate-500! text-sm">
        {selectedCountryItem === "Tất cả quốc gia"
          ? "Chọn quốc gia cụ thể để xem chương trình"
          : "Chưa có chương trình"}
      </div>
    );

    return (
      <div className="p-2">
        <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 app-dark:text-slate-500! uppercase tracking-wider">
          Chương trình
        </div>
        {programsForSelection.slice(0, 10).map(prog => (
          <button
            key={prog.id}
            onClick={() => handleApplyFilter(selectedCat, selectedRegionItem, selectedCountryItem)}
            className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-cyan-50 app-dark:hover:bg-cyan-955/20! transition-all border-b border-slate-50 app-dark:border-slate-800! last:border-0"
          >
            <div className="font-medium text-slate-700 app-dark:text-slate-300!">{prog.name}</div>
            <div className="text-[10px] text-slate-400 app-dark:text-slate-500! mt-0.5">
              {prog.region} · {resolveCountryName(prog.country)}
            </div>
          </button>
        ))}
        {programsForSelection.length > 10 && (
          <button
            onClick={() => handleApplyFilter(selectedCat, selectedRegionItem, selectedCountryItem)}
            className="w-full text-center px-3 py-2 text-sm text-cyan-700 app-dark:text-cyan-400! font-semibold hover:bg-cyan-50 app-dark:hover:bg-cyan-955/20! rounded-lg transition-all mt-1"
          >
            Xem tất cả {programsForSelection.length} chương trình →
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="w-full" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full h-11 px-4 rounded-2xl border bg-white app-dark:bg-[#1e1e1e]! shadow-sm transition-all
          flex items-center justify-between
          ${isOpen
            ? "border-cyan-400 ring-2 ring-cyan-500/20"
            : "border-slate-200 app-dark:border-slate-700! hover:border-cyan-300"}
        `}
      >
        <span className={`truncate text-sm ${hasSelection ? "font-semibold text-slate-800 app-dark:text-slate-100!" : "text-slate-500"}`}>
          {displayLabel}
        </span>
        <svg
          className={`w-4 h-4 text-slate-400 app-dark:text-slate-500! transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-2 z-9999 bg-white app-dark:bg-[#252525]! rounded-2xl border border-slate-200 app-dark:border-slate-700! shadow-[0_20px_60px_rgba(0,0,0,0.12)] overflow-hidden" style={{ width: "min(860px, calc(100vw - 280px))" }}>
          <div className="flex flex-row max-h-[500px]">
            <div className="flex-1 min-w-0 border-r border-slate-100 app-dark:border-slate-700! overflow-y-auto">
              {renderCategoryList()}
            </div>
            <div className="flex-1 min-w-0 border-r border-slate-100 app-dark:border-slate-700! bg-slate-50/30 app-dark:bg-white/3! overflow-y-auto">
              {renderRegionList()}
            </div>
            <div className="flex-1 min-w-0 border-r border-slate-100 app-dark:border-slate-700! bg-slate-50/20 app-dark:bg-white/2! overflow-y-auto">
              {renderCountryList()}
            </div>
            <div className="flex-1 min-w-0 bg-white app-dark:bg-transparent! overflow-y-auto">
              {renderProgramList()}
            </div>
          </div>

          {selectedCat && selectedRegionItem && selectedCountryItem && programsForSelection.length > 0 && (
            <div className="border-t border-slate-100 app-dark:border-slate-700! p-3 bg-slate-50 app-dark:bg-slate-900!">
              <button
                onClick={() => handleApplyFilter(selectedCat, selectedRegionItem, selectedCountryItem)}
                className="w-full bg-cyan-900 hover:bg-cyan-950 text-white text-sm font-semibold py-2 rounded-xl transition-colors"
              >
                Áp dụng bộ lọc
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ==========================================
// MAIN COMPONENT
// ==========================================
function ProductOverviewPageInner({ currentUser }) {
  const toast = useToast();
  const userRole = getUserRoleKey(currentUser);
  const canManageProducts = ["admin", "bangiamdoc", "truongbophan"].includes(userRole);

  // Confirm modal state
  const [confirmModal, setConfirmModal] = useState({ isOpen: false });

  const showConfirm = useCallback(({ title, message, confirmLabel, cancelLabel, variant, onConfirm }) => {
    setConfirmModal({ isOpen: true, title, message, confirmLabel, cancelLabel, variant, onConfirm });
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmModal({ isOpen: false });
  }, []);

  const [categories, setCategories] = useState(MOCK_CATEGORIES);
  const [loading] = useState(false);
  const [, setError] = useState("");
  const [apiMode, setApiMode] = useState("mock");

  // Đọc sản phẩm được Sidebar chọn từ sessionStorage (nếu có)
  const [pendingSidebarProduct] = useState(() => {
    try {
      const raw = sessionStorage.getItem("hto_selected_product");
      if (raw) {
        sessionStorage.removeItem("hto_selected_product");
        return JSON.parse(raw);
      }
    } catch {
      // bỏ qua
    }
    return null;
  });

  const [viewMode, setViewMode] = useState(() => pendingSidebarProduct ? "detail" : "overview");
  const [selectedProduct, setSelectedProduct] = useState(() => pendingSidebarProduct);

  // Danh mục Sidebar đã chọn (nếu có), đọc một lần duy nhất lúc khởi tạo component
  const [pendingSidebarCategory] = useState(() => readPendingSidebarCategory());

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryName, setSelectedCategoryName] = useState(() => pendingSidebarCategory?.name || "Tất cả");
  const [selectedCountry, setSelectedCountry] = useState(() => pendingSidebarCategory?.country || "Tất cả");
  const [selectedRegion, setSelectedRegion] = useState(() => pendingSidebarCategory?.region || "Tất cả");
  const [selectedStatus, setSelectedStatus] = useState("all");
    const [selectedVisaType, setSelectedVisaType] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});

  const [editingCategory, setEditingCategory] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingProductParentCatId, setEditingProductParentCatId] = useState("");
  const [showInterestModal, setShowInterestModal] = useState(false);

  const [interestCccdFrontFile, setInterestCccdFrontFile] = useState(null);
  const [interestCccdBackFile, setInterestCccdBackFile] = useState(null);
  const [interestCccdFrontPreview, setInterestCccdFrontPreview] = useState("");
  const [interestCccdBackPreview, setInterestCccdBackPreview] = useState("");
  const [interestInvalidFields, setInterestInvalidFields] = useState([]);

  const [activeCategoryTab, setActiveCategoryTab] = useState("info");
  const [activeProductTab, setActiveProductTab] = useState("basic");

  const [brochureLinkInput, setBrochureLinkInput] = useState("");
  const [docLinkNameInput, setDocLinkNameInput] = useState("");
  const [docLinkUrlInput, setDocLinkUrlInput] = useState("");
  const [docLinkTypeInput, setDocLinkTypeInput] = useState("Checklist");

  const [isBrochureDragging, setIsBrochureDragging] = useState(false);
  const [isDocsDragging, setIsDocsDragging] = useState(false);

  const [formCategory, setFormCategory] = useState({
    id: "",
    name: "",
    description: "",
    status: "active",
    coverImageUrl: "",
    programs: []
  });

  const [formProduct, setFormProduct] = useState({
    id: "",
    name: "",
    categoryId: "",
    categoryName: "",
    country: "",
    region: "Châu Á",
    status: "active",
    description: "",
    detailDescription: "",
    targetAudience: "",
    highlightsText: "",
    processStepsText: "",
    tagsText: "",
    websiteUrl: "",
    serviceFee: 0,
    currency: "VND",
    image: "",
    brochure: null,
    documents: [],
    updatedAt: "",
    gradientFrom: "#0d2040",
    gradientTo: "#1a3a6b",
    visaCode: "",
    shortCode: "",
    purpose: ""
  });

  const [interestForm, setInterestForm] = useState({
    customerName: "",
    phone: "",
    email: "",
    note: "",
    sourceChannel: "CTV/Đại lý"
  });

  const [isSubmittingInterest, setIsSubmittingInterest] = useState(false);
  const [showContractPreview, setShowContractPreview] = useState(false);
  const [contractType, setContractType] = useState("main");

  const currentUserName = useMemo(() => {
    return currentUser?.name || currentUser?.username || "CTV/Đại lý HTO";
  }, [currentUser]);

  // Status options matching backend enum
  const statusOptions = useMemo(() => [
    { label: "Tất cả", value: "all" },
    { label: "Đang hoạt động", value: "active" },
    { label: "Sắp mở", value: "coming_soon" },
    { label: "Tạm ngưng", value: "inactive" },
    { label: "Đã ẩn", value: "hidden" }
  ], []);

  // Load dữ liệu từ API - VẪN GỌI NHƯNG KHÔNG ẢNH HƯỞNG NẾU LỖI
  useEffect(() => {
    const normalizeArray = (p) => {
      if (!p) return [];
      if (Array.isArray(p)) return p;
      if (p.success && Array.isArray(p.data)) return p.data;
      if (Array.isArray(p.items)) return p.items;
      if (Array.isArray(p.categories)) return p.categories;
      if (Array.isArray(p.products)) return p.products;
      return [];
    };

    const fetchData = async () => {
      setError("");
      try {
        const catsPayload = await apiRequest(`${API_BASE_URL}/product-categories`);
        const apiCats = normalizeArray(catsPayload);

        if (apiCats.length === 0) {
          console.warn("[API] Không có dữ liệu từ API, giữ mock data");
          setApiMode("mock");
          return;
        }

        const catMap = {};
        apiCats.forEach(rawCat => {
          const id = rawCat._id?.$oid || rawCat._id || rawCat.id || "";
          const name = rawCat.name || "";
          const rawCoverUrl = rawCat.coverImageUrl || rawCat.imageUrl || rawCat.image || "";
          catMap[id] = {
            id,
            name,
            description: rawCat.description || "",
            status: rawCat.status || "active",
            updatedAt: rawCat.updatedAt || "",
            coverImageUrl: rawCoverUrl && !rawCoverUrl.startsWith("http") && !rawCoverUrl.startsWith("data:")
              ? `${STATIC_BASE_URL}/${rawCoverUrl.replace(/^\//, "")}`
              : rawCoverUrl,
            programs: []
          };
        });

        const categoryIds = Object.keys(catMap);
        const productFetches = categoryIds.map(catId =>
          apiRequest(`${API_BASE_URL}/products?categoryId=${catId}`)
            .then(payload => ({ catId, products: normalizeArray(payload) }))
            .catch(() => ({ catId, products: [] }))
        );

        const productResults = await Promise.all(productFetches);

        productResults.forEach(({ catId, products }) => {
          const catEntry = catMap[catId];
          if (!catEntry) return;
          products.forEach(p => {
            const mapped = mapApiProductToUiProduct(p, catId, catEntry.name);
            if (mapped) {
              catEntry.programs.push(mapped);
            }
          });
        });

        // Di chuyển "Dịch vụ Visa Nhật Bản" từ danh mục "Dịch vụ" sang "Visa"
        const dichVuEntry = Object.values(catMap).find(c => c.name.toLowerCase() === "dịch vụ" || c.name.toLowerCase() === "dich vu");
        const visaEntry = Object.values(catMap).find(c => c.name.toLowerCase() === "visa");

        if (dichVuEntry && visaEntry) {
          const visaJapanProds = (dichVuEntry.programs || []).filter(p => {
            const nameLower = (p.name || "").toLowerCase();
            const countryLower = (p.country || "").trim().toLowerCase();
            const isJapan = countryLower === "nhật bản" || countryLower === "jp" || countryLower === "nhật";
            return nameLower.includes("visa") && isJapan;
          });

          if (visaJapanProds.length > 0) {
            // Cập nhật categoryId và categoryName cho các sản phẩm di chuyển
            visaJapanProds.forEach(p => {
              p.categoryId = visaEntry.id;
              p.categoryName = visaEntry.name;
            });

            // Xóa khỏi Dịch vụ
            dichVuEntry.programs = (dichVuEntry.programs || []).filter(p => !visaJapanProds.includes(p));

            // Thêm vào Visa
            visaEntry.programs = [...(visaEntry.programs || []), ...visaJapanProds];
          }
        }

        const result = categoryIds
          .map(id => catMap[id])
          .filter(cat => {
            if (!cat) return false;
            // Ẩn danh mục "Dịch vụ" nếu nó rỗng sau khi chuyển sản phẩm
            if ((cat.name.toLowerCase() === "dịch vụ" || cat.name.toLowerCase() === "dich vu") && cat.programs.length === 0) {
              return false;
            }
            return true;
          });

        if (result.length > 0) {
          setCategories(result);
          setApiMode("api");
        } else {
          console.warn("[API] Không có dữ liệu, giữ mock data");
        }
      } catch (err) {
        console.warn("[API] Lỗi kết nối, giữ mock data:", err.message);
      }
    };

    fetchData();
  }, []);

  // Lắng nghe khi Sidebar chọn danh mục khác trong lúc trang này đã mount sẵn
  useEffect(() => {
    const handleSidebarCategorySelect = (event) => {
      const detail = event?.detail || {};
      setViewMode("overview");
      setSelectedProduct(null);
      setSelectedCategoryName(detail.name || "Tất cả");
      setSelectedCountry(detail.country || "Tất cả");
      setSelectedRegion(detail.region || "Tất cả");
            setSelectedVisaType(null);
      if (detail.id) {
        setExpandedCategories(prev => ({ ...prev, [detail.id]: true }));
      }
    };

    window.addEventListener(SIDEBAR_CATEGORY_EVENT, handleSidebarCategorySelect);
    return () => window.removeEventListener(SIDEBAR_CATEGORY_EVENT, handleSidebarCategorySelect);
  }, []);

  // Đồng bộ ngược từ Page sang Sidebar khi chọn bộ lọc trên trang
  useEffect(() => {
    const cat = categories.find(c => c && c.name === selectedCategoryName);
    const detail = {
      id: cat?.id || null,
      name: selectedCategoryName,
      country: selectedCountry,
      region: selectedRegion,
      fromSidebar: false
    };
    window.dispatchEvent(new CustomEvent(SIDEBAR_CATEGORY_EVENT, { detail }));
  }, [selectedCategoryName, selectedCountry, selectedRegion, categories]);

  // Lắng nghe khi Sidebar chọn sản phẩm con cụ thể (trong lúc trang này đã mount sẵn)
  useEffect(() => {
    const handleSidebarProductSelect = (event) => {
      const detail = event?.detail || {};
      if (detail.product) {
        let foundProduct = null;
        for (const cat of categories) {
          const progs = cat.programs || cat.products || [];
          const found = progs.find(p => String(p.id) === String(detail.product.id || detail.product._id));
          if (found) {
            foundProduct = found;
            break;
          }
        }
        const prodToSelect = foundProduct || detail.product;
        setSelectedProduct(prodToSelect);
        setViewMode("detail");

        if (prodToSelect.categoryName) {
          setSelectedCategoryName(prodToSelect.categoryName);
        } else if (prodToSelect.categoryId) {
          const cat = categories.find(c => c.id === prodToSelect.categoryId);
          if (cat) setSelectedCategoryName(cat.name);
        }
      }
    };

    window.addEventListener("hto:select-product", handleSidebarProductSelect);
    return () => window.removeEventListener("hto:select-product", handleSidebarProductSelect);
  }, [categories]);

  // Cập nhật selectedProduct hoàn chỉnh sau khi dữ liệu categories/products được đồng bộ từ API/Mock
  const selectedProductRef = useRef(selectedProduct);
  useEffect(() => { selectedProductRef.current = selectedProduct; }, [selectedProduct]);

  useEffect(() => {
    const current = selectedProductRef.current;
    if (!current) return;
    if (current.highlights && current.highlights.length > 0) return;
    let foundProduct = null;
    for (const cat of categories) {
      const progs = cat.programs || cat.products || [];
      const found = progs.find(p => String(p.id) === String(current.id || current._id));
      if (found) { foundProduct = found; break; }
    }
    if (foundProduct && foundProduct.highlights?.length > 0) {
      const t = setTimeout(() => setSelectedProduct(foundProduct), 0);
      return () => clearTimeout(t);
    }
  }, [categories]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategoryName("Tất cả");
    setSelectedCountry("Tất cả");
    setSelectedRegion("Tất cả");
    setSelectedStatus("all");
        setSelectedVisaType(null);
    setCategoryPage(0);
  };

  const CATEGORIES_PER_PAGE = 6;
  const [categoryPage, setCategoryPage] = useState(0);

  const handleGoBack = () => {
    setSelectedProduct(null);
    setViewMode("overview");
  };

  useEffect(() => {
    setCategoryPage(0);
  }, [searchQuery, selectedCategoryName, selectedCountry, selectedRegion, selectedStatus]);

  const filteredCategories = useMemo(() => {
    const q = safeText(searchQuery);
    const hasFilter = q || selectedCountry !== "Tất cả" || selectedStatus !== "all" || selectedRegion !== "Tất cả";

    return safeArray(categories)
      .map(cat => {
        if (!cat) return null;

        if (selectedCategoryName !== "Tất cả" && safeText(cat.name) !== safeText(selectedCategoryName)) {
          return null;
        }

        const progs = safeArray(cat.programs || cat.products);

        const filteredProgs = progs.filter(prog => {
          if (!prog) return false;

          if (!canManageProducts) {
            if (prog.status === "hidden" || prog.isActive === false) return false;
          }

          const matchSearch =
            !q ||
            safeText(prog.name).includes(q) ||
            safeText(prog.country).includes(q) ||
            safeText(prog.description).includes(q) ||
            safeArray(prog.tags).some(t => safeText(t).includes(q));

          const matchCountry =
            selectedCountry === "Tất cả" ||
            safeText(prog.country) === safeText(selectedCountry);

          const matchStatus =
            selectedStatus === "all" ||
            safeText(prog.status) === safeText(selectedStatus);

          const matchRegion =
            selectedRegion === "Tất cả" ||
            safeText(prog.region) === safeText(selectedRegion);

          return matchSearch && matchCountry && matchStatus && matchRegion;
        });

        if (hasFilter) {
          const isCatNameMatch =
            q &&
            selectedCountry === "Tất cả" &&
            selectedStatus === "all" &&
            selectedRegion === "Tất cả" &&
            (safeText(cat.name).includes(q) || safeText(cat.description).includes(q));

          if (filteredProgs.length === 0 && !isCatNameMatch) return null;
        }

        return { ...cat, filteredPrograms: filteredProgs };
      })
      .filter(Boolean);
  }, [categories, searchQuery, selectedCategoryName, selectedCountry, selectedRegion, selectedStatus, canManageProducts]);

  const stats = useMemo(() => {
    let totalChildren = 0;
    let activeChildren = 0;
    let docsCount = 0;

    safeArray(categories).forEach(c => {
      if (!c) return;
      const progs = safeArray(c.programs || c.products);
      totalChildren += progs.length;
      progs.forEach(p => {
        if (!p) return;
        if (p.status === "active") activeChildren++;
        if (p.brochure) docsCount++;
        docsCount += safeArray(p.documents).length;
      });
    });

    return {
      totalCategories: safeArray(categories).length,
      totalPrograms: totalChildren,
      activePrograms: activeChildren,
      totalDocuments: docsCount,
      hiddenCategories: safeArray(categories).filter(c => c && (c.status === "hidden" || c.status === "inactive")).length
    };
  }, [categories]);

  const isValidUrl = (url) => {
    const trimmed = url.trim();
    if (!trimmed) return false;
    return trimmed.includes(".") && trimmed.length > 3;
  };

  const normalizeUrl = (url) => {
    if (!url) return "";
    let target = url.trim();
    if (!/^https?:\/\//i.test(target)) {
      target = "https://" + target;
    }
    return target;
  };

  const handleOpenWebsite = (url) => {
    if (!url) return;
    const finalUrl = normalizeUrl(url);
    window.open(finalUrl, "_blank", "noopener,noreferrer");
  };

  const handleDownloadDoc = (name) => {
    toast.info(`Đang tải tài liệu: ${name}`);
  };

  const cleanupInterestCccdPreviews = () => {
    if (interestCccdFrontPreview) URL.revokeObjectURL(interestCccdFrontPreview);
    if (interestCccdBackPreview) URL.revokeObjectURL(interestCccdBackPreview);
    setInterestCccdFrontPreview("");
    setInterestCccdBackPreview("");
    setInterestCccdFrontFile(null);
    setInterestCccdBackFile(null);
    setInterestInvalidFields([]);
  };

  const handleOpenInterestModal = () => {
    cleanupInterestCccdPreviews();
    setInterestForm({
      customerName: "",
      phone: "",
      email: "",
      note: "",
      sourceChannel: "CTV/Đại lý"
    });
    setShowInterestModal(true);
  };

  const handleCloseInterestModal = () => {
    cleanupInterestCccdPreviews();
    setShowInterestModal(false);
  };

  const handleSubmitInterest = async (e) => {
    e.preventDefault();

    const invalidFields = [];
    if (!interestForm.customerName.trim()) invalidFields.push("customerName");
    if (!interestForm.phone.trim()) invalidFields.push("phone");
    if (!interestCccdFrontFile) invalidFields.push("cccdFront");
    if (!interestCccdBackFile) invalidFields.push("cccdBack");

    setInterestInvalidFields(invalidFields);

    if (invalidFields.length > 0) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc và tải lên cả hai mặt của CCCD khách hàng.", "Thiếu thông tin");
      return;
    }

    const duplicateGuard = beginLeadSubmission(interestForm.phone);
    if (!duplicateGuard.allowed) {
      toast.error(duplicateGuard.message, "Thông tin đã gửi");
      return;
    }

    setIsSubmittingInterest(true);

    const payload = new FormData();
    payload.append("customerName", interestForm.customerName.trim());
    payload.append("phone", normalizeLeadPhone(interestForm.phone));
    payload.append("email", interestForm.email ? interestForm.email.trim() : "");
    payload.append("source", interestForm.sourceChannel || "CTV/Đại lý");
    payload.append("productInterest", selectedProduct?.name || "Sản phẩm quan tâm");
    payload.append("countryInterest", resolveCountryName(selectedProduct?.country) || "Đức");
    payload.append("note", interestForm.note ? interestForm.note.trim() : "");
    const referralCode = getReferralCode();
    if (referralCode) {
      payload.append("referralCode", referralCode);
    }
    payload.append("cccdFront", interestCccdFrontFile);
    payload.append("cccdBack", interestCccdBackFile);

    try {
      const response = await apiRequest(`${API_BASE_URL}/leads`, {
        method: "POST",
        body: payload
      });

      const leadId = response?.data?._id || response?.data?.id || response?.code || response?._id || response?.id;
      const dealResult = await markLeadReadyForReconciliation(leadId);
      const successCode = response?.data?.bizflyContactId || response?.bizflyContactId || response?.data?._id || response?._id || `HTO-${Date.now().toString().slice(-6)}`;
      toast.success(
        dealResult.ok
          ? `Đã đăng ký thành công cho khách hàng ${interestForm.customerName}. Deal đã vào đối soát. Mã liên hệ: ${successCode}`
          : `Đã đăng ký thành công cho khách hàng ${interestForm.customerName}. ${dealResult.message} Mã liên hệ: ${successCode}`,
        "Gửi liên hệ thành công"
      );
      finishLeadSubmission(interestForm.phone, true);
      handleCloseInterestModal();
    } catch (err) {
      toast.error(err.message || "Gửi liên hệ tư vấn thất bại. Vui lòng thử lại sau.", "Lỗi gửi liên hệ");
      finishLeadSubmission(interestForm.phone, false);
    } finally {
      setIsSubmittingInterest(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      toast.warning("Ảnh quá lớn! Vui lòng chọn ảnh nhỏ hơn 500KB", "File quá lớn");
      e.target.value = '';
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.warning("Vui lòng chọn file ảnh (JPG, PNG, WEBP, GIF)", "Định dạng không hỗ trợ");
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target.result;
      setFormCategory(prev => ({ ...prev, coverImageUrl: base64String }));
      toast.success("Đã chọn ảnh thành công!", "Upload ảnh");
    };
    reader.onerror = () => {
      toast.error("Không thể đọc file", "Lỗi");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setFormCategory(prev => ({ ...prev, coverImageUrl: '' }));
    toast.info("Đã xóa ảnh", "Xóa ảnh");
  };

  const handleOpenNewCategory = () => {
    if (!canManageProducts) return;
    setFormCategory({
      id: "new",
      name: "",
      description: "",
      status: "active",
      coverImageUrl: "",
      programs: []
    });
    setActiveCategoryTab("info");
    setEditingCategory("new");
  };

  const handleEditCategory = (cat) => {
    if (!canManageProducts) return;
    setFormCategory({
      id: cat.id,
      name: cat.name,
      description: cat.description || "",
      status: cat.status || "active",
      coverImageUrl: cat.coverImageUrl || "",
      programs: cat.programs || []
    });
    setActiveCategoryTab("info");
    setEditingCategory(cat.id);
  };

  const handleToggleCategoryStatus = async (catId, currentStatus) => {
    if (!canManageProducts) return;

    let newStatus;
    if (currentStatus === "active") {
      newStatus = "inactive";
    } else if (currentStatus === "inactive") {
      newStatus = "active";
    } else if (currentStatus === "coming_soon") {
      newStatus = "hidden";
    } else if (currentStatus === "hidden") {
      newStatus = "active";
    } else {
      newStatus = "active";
    }

    const statusTextMap = {
      active: "hiện",
      inactive: "tạm ngưng",
      coming_soon: "sắp mở",
      hidden: "ẩn"
    };
    const statusText = statusTextMap[newStatus] || "thay đổi trạng thái";

    showConfirm({
      title: "Thay đổi trạng thái danh mục",
      message: `Bạn có chắc chắn muốn chuyển danh mục sang trạng thái "${statusText}" không?`,
      confirmLabel: "Xác nhận",
      variant: "warning",
      onConfirm: async () => {
        closeConfirm();
        try {
          const catToUpdate = categories.find(cat => cat.id === catId);
          if (!catToUpdate) return;
          if (apiMode === "api") {
            await apiRequest(`${API_BASE_URL}/product-categories/${catId}`, {
              method: "PATCH",
              body: JSON.stringify({
                name: catToUpdate.name,
                description: catToUpdate.description || "",
                status: newStatus
              })
            });
          }
          const updated = categories.map(cat =>
            cat.id === catId ? { ...cat, status: newStatus } : cat
          );
          setCategories(updated);
          toast.success(`Đã chuyển sang trạng thái ${statusText}`, "Cập nhật trạng thái");
        } catch (err) {
          toast.error(err.message, "Lỗi cập nhật trạng thái");
        }
      }
    });
  };

  const handleDeleteCategory = async (catId) => {
    if (!canManageProducts) return;
    showConfirm({
      title: "Xóa danh mục",
      message: "Bạn có chắc chắn muốn xóa danh mục này không? Thao tác này không thể hoàn tác.",
      confirmLabel: "Xóa danh mục",
      variant: "danger",
      onConfirm: async () => {
        closeConfirm();
        try {
          if (apiMode === "api") {
            await apiRequest(`${API_BASE_URL}/product-categories/${catId}`, { method: "DELETE" });
          }
          const updated = categories.filter(cat => cat.id !== catId);
          setCategories(updated);
          setEditingCategory(null);
          toast.success("Danh mục đã được xóa thành công", "Xóa thành công");
        } catch (err) {
          toast.error(err.message, "Lỗi khi xóa danh mục");
        }
      }
    });
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!canManageProducts) return;
    if (!formCategory.name.trim()) {
      toast.warning("Tên danh mục không được để trống!", "Thiếu thông tin");
      return;
    }
    try {
      const payload = {
        name: formCategory.name,
        description: formCategory.description || '',
        status: formCategory.status,
        coverImageUrl: formCategory.coverImageUrl || '',
      };

      const url = editingCategory === "new"
        ? `${API_BASE_URL}/product-categories`
        : `${API_BASE_URL}/product-categories/${editingCategory}`;

      const response = await apiRequest(url, {
        method: editingCategory === "new" ? "POST" : "PATCH",
        body: JSON.stringify(payload),
      });

      const savedCategory = response?.data || response;
      const localCoverUrl = formCategory.coverImageUrl || '';
      const mapped = mapApiCategoryToUiCategory({
        ...savedCategory,
        coverImageUrl: savedCategory?.coverImageUrl || localCoverUrl,
        image: savedCategory?.image || localCoverUrl,
      });

      if (editingCategory === "new") {
        setCategories(prev => [...prev, mapped]);
      } else {
        setCategories(prev => prev.map(cat => {
          if (cat.id !== editingCategory) return cat;
          return { ...cat, ...mapped, programs: cat.programs || [] };
        }));
      }

      setApiMode("api");
      setEditingCategory(null);
      toast.success(editingCategory === "new" ? "Danh mục mới đã được thêm thành công" : "Danh mục đã được cập nhật", "Lưu thành công");
    } catch (err) {
      toast.error(err.message, "Lỗi khi lưu danh mục");
    }
  };

  // ==========================================
  // CRUD: PRODUCT ACTIONS
  // ==========================================
  const handleOpenNewProduct = (catId) => {
    if (!canManageProducts) return;
    setEditingProductParentCatId(catId);
    setFormProduct({
      id: "new",
      name: "",
      categoryId: catId,
      country: "",
      region: "Châu Á",
      status: "active",
      description: "",
      detailDescription: "",
      targetAudience: "",
      highlightsText: "",
      processStepsText: "",
      tagsText: "",
      websiteUrl: "",
      serviceFee: 0,
      currency: "VND",
      image: "",
      brochure: null,
      documents: [],
      visaCode: "",
      shortCode: "",
      purpose: ""
    });
    setBrochureLinkInput("");
    setDocLinkNameInput("");
    setDocLinkUrlInput("");
    setDocLinkTypeInput("Checklist");
    setActiveProductTab("basic");
    setEditingProduct("new");
  };

  const handleEditProduct = (prod) => {
    if (!canManageProducts) return;

    setEditingProductParentCatId(prod.categoryId);
    setFormProduct({
      id: prod.id,
      name: prod.name,
      categoryId: prod.categoryId,
      categoryName: prod.categoryName,
      country: prod.country,
      region: prod.region || "Châu Á",
      status: prod.status || "active",
      description: prod.description || "",
      detailDescription: prod.detailDescription || "",
      targetAudience: prod.targetAudience || "",
      highlightsText: (prod.highlights || []).join("\n"),
      processStepsText: (prod.processSteps || []).join("\n"),
      tagsText: (prod.tags || []).join(", "),
      websiteUrl: prod.websiteUrl || "",
      serviceFee: prod.serviceFee || 0,
      currency: prod.currency || "VND",
      image: prod.image || "",
      brochure: prod.brochure || null,
      documents: prod.documents || [],
      gradientFrom: prod.gradientFrom || "#0d2040",
      gradientTo: prod.gradientTo || "#1a3a6b",
      visaCode: prod.visaCode || "",
      shortCode: prod.shortCode || "",
      purpose: prod.purpose || ""
    });
    setBrochureLinkInput("");
    setDocLinkNameInput("");
    setDocLinkUrlInput("");
    setDocLinkTypeInput("Checklist");
    setActiveProductTab("basic");
    setEditingProduct(prod.id);
  };

  const handleDeleteProduct = async (prodId) => {
    if (!canManageProducts) return;
    showConfirm({
      title: "Xóa sản phẩm",
      message: "Bạn có chắc chắn muốn xóa sản phẩm này không? Thao tác này không thể hoàn tác.",
      confirmLabel: "Xóa sản phẩm",
      variant: "danger",
      onConfirm: async () => {
        closeConfirm();
        try {
          if (apiMode === "api") {
            await apiRequest(`${API_BASE_URL}/products/${prodId}`, { method: "DELETE" });
          }
          const updated = categories.map(cat => ({
            ...cat,
            programs: (cat.programs || []).filter(p => p.id !== prodId)
          }));
          setCategories(updated);
          if (selectedProduct?.id === prodId) {
            setSelectedProduct(null);
            setViewMode("overview");
          }
          setFormCategory(prev => ({
            ...prev,
            programs: (prev.programs || []).filter(p => p.id !== prodId)
          }));
          toast.success("Sản phẩm đã được xóa thành công", "Xóa thành công");
        } catch (err) {
          toast.error(err.message, "Lỗi khi xóa sản phẩm");
        }
      }
    });
  };

  const handleToggleProductStatus = async (prod) => {
    if (!canManageProducts) return;
    const isCurrentlyHidden = prod.status === "hidden" || prod.isActive === false;
    const newStatus = isCurrentlyHidden ? "active" : "hidden";
    const label = isCurrentlyHidden ? "hiện" : "ẩn";
    showConfirm({
      title: isCurrentlyHidden ? "Hiện sản phẩm" : "Ẩn sản phẩm",
      message: `Bạn có chắc chắn muốn ${label} sản phẩm "${prod.name}" không?`,
      confirmLabel: "Xác nhận",
      variant: "warning",
      onConfirm: async () => {
        closeConfirm();
        try {
          if (apiMode === "api") {
            await apiRequest(`${API_BASE_URL}/products/${prod.id}`, {
              method: "PATCH",
              body: JSON.stringify({ isActive: newStatus !== "hidden", status: newStatus })
            });
          }
          const updated = categories.map(cat => ({
            ...cat,
            programs: (cat.programs || []).map(p =>
              p.id === prod.id ? { ...p, status: newStatus, isActive: newStatus !== "hidden" } : p
            )
          }));
          setCategories(updated);
          const updatedCat = updated.find(c => c.id === (prod.categoryId || editingProductParentCatId));
          if (updatedCat) setFormCategory(prev => ({ ...prev, programs: updatedCat.programs || [] }));
          toast.success(`Đã ${label} sản phẩm thành công`, "Cập nhật trạng thái");
        } catch (err) {
          toast.error(err.message, "Lỗi cập nhật trạng thái");
        }
      }
    });
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!canManageProducts) return;

    if (!formProduct.name.trim()) {
      toast.warning("Tên sản phẩm không được để trống!", "Thiếu thông tin");
      return;
    }
    if (!formProduct.country.trim()) {
      toast.warning("Quốc gia không được để trống!", "Thiếu thông tin");
      return;
    }

    const highlightsArray = formProduct.highlightsText.split("\n").map(s => s.trim()).filter(Boolean);
    const requirements = highlightsArray.map((text, index) => ({
      criteriaType: text.split(":")[0]?.trim() || "Điểm nổi bật",
      criteriaValue: text,
      displayOrder: index
    }));

    const processStepsArray = formProduct.processStepsText.split("\n").map(s => s.trim()).filter(Boolean);
    const steps = processStepsArray.map((stepName, index) => ({
      stepOrder: index,
      stepName: stepName,
      description: "",
      estimatedDuration: ""
    }));

    const tags = formProduct.tagsText.split(",").map(s => s.trim()).filter(Boolean);
    tags.forEach((tag, index) => {
      requirements.push({
        criteriaType: "tag",
        criteriaValue: tag,
        displayOrder: highlightsArray.length + index
      });
    });

    const costs = [];
    if (formProduct.serviceFee > 0) {
      costs.push({
        itemName: "Phí dịch vụ",
        amount: formProduct.serviceFee,
        currency: formProduct.currency || "VND",
        note: "",
        displayOrder: 0
      });
    }

    const extendedData = {
      region: formProduct.region || "Châu Á",
      detailDescription: formProduct.detailDescription || formProduct.description,
      targetAudience: formProduct.targetAudience || "",
      tags: tags || [],
      websiteUrl: formProduct.websiteUrl || "",
      brochure: formProduct.brochure || null,
      documents: formProduct.documents || [],
      gradientFrom: formProduct.gradientFrom || "#0d2040",
      gradientTo: formProduct.gradientTo || "#1a3a6b",
      updatedAt: new Date().toISOString().split("T")[0]
    };

    const finalDescription = buildDescription(formProduct.description, extendedData);

    try {
      const apiPayload = {
        name: formProduct.name,
        categoryId: editingProductParentCatId,
        country: formProduct.country,
        isActive: formProduct.status === "active",
        description: finalDescription,
        requirements,
        costs,
        steps,
        serviceFee: formProduct.serviceFee || 0,
        currency: formProduct.currency || "VND",
        image: formProduct.image || "",
        visaCode: formProduct.visaCode || "",
        shortCode: formProduct.shortCode || "",
        purpose: formProduct.purpose || "",
      };

      let response;
      if (editingProduct === "new") {
        response = await apiRequest(`${API_BASE_URL}/products`, { method: "POST", body: JSON.stringify(apiPayload) });
      } else {
        response = await apiRequest(`${API_BASE_URL}/products/${editingProduct}`, { method: "PATCH", body: JSON.stringify(apiPayload) });
      }

      let savedProd;
      if (apiMode === "api") {
        const normalized = response?.data || response;
        const catName = categories.find(c => c.id === editingProductParentCatId)?.name || "";
        savedProd = mapApiProductToUiProduct(normalized, editingProductParentCatId, catName);
      } else {
        const catName = categories.find(c => c.id === editingProductParentCatId)?.name || "";
        savedProd = {
          id: editingProduct === "new" ? `prod-${Date.now()}` : editingProduct,
          name: formProduct.name,
          categoryId: editingProductParentCatId,
          categoryName: catName,
          country: formProduct.country,
          region: formProduct.region || "Châu Á",
          status: formProduct.status,
          description: formProduct.description,
          highlights: highlightsArray,
          processSteps: processStepsArray,
          tags: tags,
          detailDescription: formProduct.detailDescription || formProduct.description,
          targetAudience: formProduct.targetAudience || "",
          websiteUrl: formProduct.websiteUrl || "",
          image: formProduct.image || "",
          brochure: formProduct.brochure || null,
          documents: formProduct.documents || [],
          gradientFrom: formProduct.gradientFrom || "#0d2040",
          gradientTo: formProduct.gradientTo || "#1a3a6b",
          updatedAt: new Date().toISOString().split("T")[0]
        };
      }

      if (!savedProd) throw new Error("API không trả về dữ liệu hợp lệ.");

      const updated = editingProduct === "new"
        ? categories.map(cat =>
          cat.id === editingProductParentCatId
            ? { ...cat, programs: [...(cat.programs || []), savedProd] }
            : cat
        )
        : categories.map(cat => ({
          ...cat,
          programs: (cat.programs || []).map(p =>
            p.id === editingProduct ? savedProd : p
          )
        }));

      setCategories(updated);
      setEditingProduct(null);
      if (selectedProduct?.id === editingProduct) setSelectedProduct(savedProd);
      const updatedCat = updated.find(c => c.id === editingProductParentCatId);
      if (updatedCat) {
        setFormCategory(prev => ({ ...prev, programs: updatedCat.programs || [] }));
      }
      toast.success(editingProduct === "new" ? "Sản phẩm mới đã được thêm thành công" : "Sản phẩm đã được cập nhật", "Lưu thành công");
    } catch (err) {
      toast.error(err.message, "Lỗi khi lưu sản phẩm");
    }
  };

  // ==========================================
  // BROCHURE & DOCUMENTS UPLOAD HANDLERS
  // ==========================================
  const checkAndReplaceBrochure = (onConfirmCallback) => {
    if (formProduct.brochure) {
      showConfirm({
        title: "Thay thế Brochure",
        message: "Sản phẩm đã có Brochure. Bạn có chắc chắn muốn thay thế bằng Brochure mới không?",
        confirmLabel: "Thay thế",
        variant: "warning",
        onConfirm: () => { closeConfirm(); onConfirmCallback(); }
      });
    } else {
      onConfirmCallback();
    }
  };

  const handleProductBrochureUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const ext = file.name.split(".").pop().toLowerCase();
      const isPdf = ext === "pdf";
      const isImg = ["jpg", "jpeg", "png", "webp"].includes(ext);
      if (!isPdf && !isImg) {
        toast.warning("Vui lòng tải lên file PDF hoặc hình ảnh (JPG, JPEG, PNG, WEBP)!", "Định dạng không hỗ trợ");
        return;
      }
      checkAndReplaceBrochure(() => {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        const previewUrl = isImg ? URL.createObjectURL(file) : "";
        const brochureData = {
          id: `brochure-file-${Date.now()}`,
          name: file.name,
          sourceType: "file",
          fileType: isPdf ? "PDF" : "IMAGE",
          size: `${sizeMB} MB`,
          url: previewUrl,
          updatedAt: new Date().toISOString().split("T")[0]
        };
        setFormProduct(prev => ({ ...prev, brochure: brochureData }));
      });
      e.target.value = "";
    }
  };

  const handleBrochureDragOver = (e) => {
    e.preventDefault();
    setIsBrochureDragging(true);
  };

  const handleBrochureDragLeave = (e) => {
    e.preventDefault();
    setIsBrochureDragging(false);
  };

  const handleBrochureDrop = (e) => {
    e.preventDefault();
    setIsBrochureDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      const ext = file.name.split(".").pop().toLowerCase();
      const isPdf = ext === "pdf";
      const isImg = ["jpg", "jpeg", "png", "webp"].includes(ext);
      if (!isPdf && !isImg) {
        toast.warning("Vui lòng tải lên file PDF hoặc hình ảnh (JPG, JPEG, PNG, WEBP)!", "Định dạng không hỗ trợ");
        return;
      }
      checkAndReplaceBrochure(() => {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        const previewUrl = isImg ? URL.createObjectURL(file) : "";
        const brochureData = {
          id: `brochure-file-${Date.now()}`,
          name: file.name,
          sourceType: "file",
          fileType: isPdf ? "PDF" : "IMAGE",
          size: `${sizeMB} MB`,
          url: previewUrl,
          updatedAt: new Date().toISOString().split("T")[0]
        };
        setFormProduct(prev => ({ ...prev, brochure: brochureData }));
        toast.success(`Đã tải brochure: ${file.name}`, "Tải lên thành công");
      });
    }
  };

  const handleAddBrochureLink = () => {
    if (!brochureLinkInput.trim()) {
      toast.warning("Vui lòng nhập link Brochure.", "Thiếu thông tin");
      return;
    }
    if (!isValidUrl(brochureLinkInput)) {
      toast.warning("Vui lòng nhập link hợp lệ.", "Link không hợp lệ");
      return;
    }
    checkAndReplaceBrochure(() => {
      const finalUrl = normalizeUrl(brochureLinkInput);
      const brochureData = {
        id: `brochure-link-${Date.now()}`,
        name: brochureLinkInput.trim(),
        sourceType: "link",
        fileType: "LINK",
        size: "",
        url: finalUrl,
        updatedAt: new Date().toISOString().split("T")[0]
      };
      setFormProduct(prev => ({ ...prev, brochure: brochureData }));
      setBrochureLinkInput("");
      toast.success("Đã gắn link Brochure thành công!", "Thêm Brochure");
    });
  };

  const removeProductBrochure = () => {
    setFormProduct(prev => ({ ...prev, brochure: null }));
  };

  const handleProductDocsUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const validFiles = files.filter(file => {
        const ext = file.name.split(".").pop().toLowerCase();
        return ["pdf", "docx", "xlsx"].includes(ext);
      });
      if (validFiles.length === 0) {
        toast.warning("Vui lòng chọn các file PDF, DOCX hoặc XLSX!", "Định dạng không hỗ trợ");
        return;
      }
      const newDocs = validFiles.map((file, index) => {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        const kbSize = (file.size / 1024).toFixed(0);
        const finalSize = parseFloat(sizeMB) > 0.1 ? `${sizeMB} MB` : `${kbSize} KB`;
        const ext = file.name.split(".").pop().toUpperCase();
        return {
          id: `prod-doc-${Date.now()}-${index}`,
          name: file.name,
          type: ext === "PDF" ? "PDF" : (ext === "DOCX" ? "DOCX" : "XLSX"),
          sourceType: "file",
          fileType: ext,
          size: finalSize,
          url: "",
          updatedAt: new Date().toISOString().split("T")[0]
        };
      });
      setFormProduct(prev => ({
        ...prev,
        documents: [...(prev.documents || []), ...newDocs]
      }));
      toast.success(`Đã đính kèm ${newDocs.length} tài liệu tư vấn`, "Tải lên thành công");
    }
  };

  const handleDocsDragOver = (e) => {
    e.preventDefault();
    setIsDocsDragging(true);
  };

  const handleDocsDragLeave = (e) => {
    e.preventDefault();
    setIsDocsDragging(false);
  };

  const handleDocsDrop = (e) => {
    e.preventDefault();
    setIsDocsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const validFiles = files.filter(file => {
        const ext = file.name.split(".").pop().toLowerCase();
        return ["pdf", "docx", "xlsx"].includes(ext);
      });
      if (validFiles.length === 0) {
        toast.warning("Vui lòng kéo thả các tệp PDF, DOCX hoặc XLSX!", "Định dạng không hỗ trợ");
        return;
      }
      const newDocs = validFiles.map((file, index) => {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        const kbSize = (file.size / 1024).toFixed(0);
        const finalSize = parseFloat(sizeMB) > 0.1 ? `${sizeMB} MB` : `${kbSize} KB`;
        const ext = file.name.split(".").pop().toUpperCase();
        return {
          id: `prod-doc-${Date.now()}-${index}`,
          name: file.name,
          type: ext === "PDF" ? "PDF" : (ext === "DOCX" ? "DOCX" : "XLSX"),
          sourceType: "file",
          fileType: ext,
          size: finalSize,
          url: "",
          updatedAt: new Date().toISOString().split("T")[0]
        };
      });
      setFormProduct(prev => ({
        ...prev,
        documents: [...(prev.documents || []), ...newDocs]
      }));
      toast.success(`Đã đính kèm ${newDocs.length} tài liệu tư vấn`, "Tải lên thành công");
    }
  };

  const handleAddDocLink = () => {
    if (!docLinkNameInput.trim()) {
      toast.warning("Vui lòng nhập tên tài liệu.", "Thiếu thông tin");
      return;
    }
    if (!docLinkUrlInput.trim() || !isValidUrl(docLinkUrlInput)) {
      toast.warning("Vui lòng nhập link tài liệu hợp lệ.", "Link không hợp lệ");
      return;
    }

    const finalUrl = normalizeUrl(docLinkUrlInput);
    const newDoc = {
      id: `prod-doc-link-${Date.now()}`,
      name: docLinkNameInput.trim(),
      type: docLinkTypeInput,
      sourceType: "link",
      fileType: "LINK",
      size: "",
      url: finalUrl,
      updatedAt: new Date().toISOString().split("T")[0]
    };

    setFormProduct(prev => ({
      ...prev,
      documents: [...(prev.documents || []), newDoc]
    }));

    setDocLinkNameInput("");
    setDocLinkUrlInput("");
    toast.success("Đã thêm liên kết tài liệu tư vấn", "Thêm tài liệu");
  };

  const deleteProductDoc = (docId) => {
    showConfirm({
      title: "Xóa tài liệu",
      message: "Bạn có chắc chắn muốn xóa tài liệu tư vấn này không?",
      confirmLabel: "Xóa",
      variant: "danger",
      onConfirm: () => {
        closeConfirm();
        setFormProduct(prev => ({
          ...prev,
          documents: (prev.documents || []).filter(d => d.id !== docId)
        }));
        toast.success("Đã xóa tài liệu tư vấn", "Xóa thành công");
      }
    });
  };

  if (loading) {
    return (
      <div className="w-full py-20 text-center flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-cyan-200 border-t-cyan-900" role="status">
          <span className="sr-only">Đang tải...</span>
        </div>
        <p className="mt-4 text-slate-500 text-sm">Đang đồng bộ dữ liệu sản phẩm HTO...</p>
      </div>
    );
  }

  return (
    <>
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        cancelLabel={confirmModal.cancelLabel}
        variant={confirmModal.variant}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeConfirm}
      />
      <div className="w-full max-w-[1600px] mx-auto px-4 py-6">
        {/* HEADER SECTION */}
        {viewMode === "overview" ? (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold text-slate-900 app-dark:text-slate-100! m-0">Danh mục sản phẩm</h1>
              </div>
              <p className="text-slate-500 app-dark:text-slate-400! text-sm m-0 mt-1">
                Kho danh mục chương trình và tài liệu tư vấn dành cho cộng tác viên, đại lý và nhân viên tư vấn.
              </p>
            </div>
            {canManageProducts && (
              <button
                id="products-add-category-btn"
                className="bg-cyan-900 hover:bg-cyan-950 text-white text-sm font-semibold px-4 py-2 flex items-center gap-2 shadow-sm force-rounded-xl transition-all duration-200 cursor-pointer"
                onClick={handleOpenNewCategory}
              >
                <i className="fa fa-folder-plus text-base"></i> + Thêm danh mục
              </button>
            )}
          </div>
        ) : (
          <div className="mb-6">
            <button
              className="border border-slate-300 app-dark:border-white/15! hover:bg-slate-50 app-dark:hover:bg-white/5! text-slate-700 app-dark:text-slate-300! text-sm font-semibold force-rounded-xl px-4 py-2 flex items-center gap-2 transition-colors duration-200"
              onClick={handleGoBack}
            >
              <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Quay lại danh sách
            </button>
          </div>
        )}

        {/* STATS SECTION */}
        {viewMode === "overview" && canManageProducts && selectedCategoryName === "Tất cả" && (
          <div id="products-stats-grid" className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="bg-white app-dark:bg-[#252525]! rounded-2xl p-4.5 shadow-sm border border-slate-100 app-dark:border-white/8! flex items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 app-dark:bg-cyan-955/40! text-cyan-900 app-dark:text-cyan-300! shrink-0 mr-4">
                <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <div>
                <span className="text-slate-450 app-dark:text-slate-400! text-xs block font-medium">Danh mục lớn</span>
                <span className="font-bold text-slate-800 app-dark:text-slate-100! text-lg md:text-xl leading-none block mt-1">{stats.totalCategories}</span>
              </div>
            </div>
            <div className="bg-white app-dark:bg-[#252525]! rounded-2xl p-4.5 shadow-sm border border-slate-100 app-dark:border-white/8! flex items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 app-dark:bg-emerald-955/40! text-emerald-650 app-dark:text-emerald-350! shrink-0 mr-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0v6m-7.244-2.244L12 20l7.244-2.244" />
                </svg>
              </div>
              <div>
                <span className="text-slate-455 app-dark:text-slate-400! text-xs block font-medium">Sản phẩm/Chương trình con</span>
                <span className="font-bold text-slate-800 app-dark:text-slate-100! text-lg md:text-xl leading-none block mt-1">{stats.totalPrograms}</span>
              </div>
            </div>
            <div className="bg-white app-dark:bg-[#252525]! rounded-2xl p-4.5 shadow-sm border border-slate-100 app-dark:border-white/8! flex items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 app-dark:bg-sky-955/40! text-sky-650 app-dark:text-sky-300! shrink-0 mr-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <span className="text-slate-455 app-dark:text-slate-400! text-xs block font-medium">Đang tuyển sinh</span>
                <span className="font-bold text-slate-800 app-dark:text-slate-100! text-lg md:text-xl leading-none block mt-1">{stats.activePrograms}</span>
              </div>
            </div>
            <div className="bg-white app-dark:bg-[#252525]! rounded-2xl p-4.5 shadow-sm border border-slate-100 app-dark:border-white/8! flex items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 app-dark:bg-amber-955/40! text-amber-650 app-dark:text-amber-300! shrink-0 mr-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <span className="text-slate-455 app-dark:text-slate-400! text-xs block font-medium">Brochures & Tài liệu tư vấn</span>
                <span className="font-bold text-slate-800 app-dark:text-slate-100! text-lg md:text-xl leading-none block mt-1">{stats.totalDocuments}</span>
              </div>
            </div>
          </div>
        )}

        {/* FILTER SECTION */}
        {viewMode === "overview" && (() => {
          const activeFilters = [
            searchQuery && { key: "search", label: `"${searchQuery}"`, onClear: () => setSearchQuery("") },
            selectedCategoryName !== "Tất cả" && { key: "cat", label: selectedCategoryName, onClear: () => setSelectedCategoryName("Tất cả") },
            selectedRegion !== "Tất cả" && { key: "region", label: selectedRegion, onClear: () => setSelectedRegion("Tất cả") },
            selectedCountry !== "Tất cả" && { key: "country", label: resolveCountryName(selectedCountry), onClear: () => setSelectedCountry("Tất cả") },
            selectedStatus !== "all" && { key: "status", label: statusOptions.find(o => o.value === selectedStatus)?.label || selectedStatus, onClear: () => setSelectedStatus("all") },
          ].filter(Boolean);

          const totalResults = filteredCategories.reduce((sum, cat) => sum + (cat.filteredPrograms?.length || 0), 0);
          const hasActiveFilter = activeFilters.length > 0;

          return (
            <div id="products-filter-section" className="bg-white app-dark:bg-[#252525]! rounded-2xl border border-slate-100 app-dark:border-white/8! px-4 py-3 shadow-sm app-dark:shadow-none! mb-5 overflow-visible">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-center relative">
                {/* Search */}
                <div className="md:col-span-12 xl:col-span-5">
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-slate-400 app-dark:text-slate-500! flex items-center justify-center pointer-events-none">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      className="w-full h-10 bg-white app-dark:bg-[#1e1e1e]! border border-slate-200 app-dark:border-slate-700! rounded-xl pl-9 pr-8 text-sm text-slate-700 app-dark:text-slate-100! placeholder-slate-400 app-dark:placeholder-slate-500! focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 focus:outline-none transition-all duration-200"
                      placeholder="Tìm kiếm theo tên, quốc gia, tag..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        className="absolute right-2.5 text-slate-400 hover:text-slate-600 app-dark:hover:text-slate-200! transition-colors"
                        onClick={() => setSearchQuery("")}
                        aria-label="Xóa tìm kiếm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Mega menu */}
                <div className="md:col-span-8 xl:col-span-5">
                  <MegaMenuFilter
                    categories={categories}
                    selectedCategoryName={selectedCategoryName}
                    selectedCountry={selectedCountry}
                    selectedRegion={selectedRegion}
                    onSelect={({ category, region, country }) => {
                      setSelectedCategoryName(category);
                      setSelectedRegion(region);
                      setSelectedCountry(country);
                    }}
                  />
                </div>

                {/* Trạng thái */}
                <div className="md:col-span-4 xl:col-span-2">
                  <CustomDropdown
                    value={selectedStatus}
                    options={statusOptions}
                    onChange={setSelectedStatus}
                    placeholder="Trạng thái"
                  />
                </div>
              </div>

              {/* Active filter badges */}
              {hasActiveFilter && (
                <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-100 app-dark:border-white/8!">
                  <span className="text-xs text-slate-400 app-dark:text-slate-500! font-medium shrink-0">
                    {filteredCategories.length > 0
                      ? <><span className="text-cyan-800 app-dark:text-cyan-400! font-bold">{totalResults}</span> chương trình trong <span className="text-cyan-800 app-dark:text-cyan-400! font-bold">{filteredCategories.length}</span> danh mục</>
                      : <span className="text-orange-500 font-semibold">Không tìm thấy kết quả</span>
                    }
                  </span>
                  <span className="text-slate-200 app-dark:text-slate-700! mx-1 hidden sm:inline">·</span>
                  {activeFilters.map(f => (
                    <span key={f.key} className="inline-flex items-center gap-1 bg-cyan-50 app-dark:bg-cyan-955/30! border border-cyan-200 app-dark:border-cyan-900/60! text-cyan-800 app-dark:text-cyan-300! text-[11px] font-semibold px-2.5 py-1 rounded-full">
                      {f.label}
                      <button
                        type="button"
                        onClick={f.onClear}
                        className="ml-0.5 text-cyan-500 hover:text-cyan-800 app-dark:hover:text-cyan-100! transition-colors"
                        aria-label={`Xóa lọc ${f.label}`}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                  {activeFilters.length > 1 && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="text-[11px] text-slate-400 hover:text-red-500 app-dark:hover:text-red-400! font-semibold transition-colors underline underline-offset-2"
                    >
                      Xóa tất cả
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })()}

        {/* CATEGORIES GRID VIEW */}
        {viewMode === "overview" && (
          <>
            <div className="space-y-8 relative z-0">
              {filteredCategories.length > 0 ? (
                (() => {
                  const totalCatPages = Math.ceil(filteredCategories.length / CATEGORIES_PER_PAGE);
                  const safeCatPage = Math.min(categoryPage, totalCatPages - 1);
                  const pagedCategories = filteredCategories.slice(
                    safeCatPage * CATEGORIES_PER_PAGE,
                    safeCatPage * CATEGORIES_PER_PAGE + CATEGORIES_PER_PAGE
                  );
                  return pagedCategories.map((cat) => {
                    const displayPrograms = cat.filteredPrograms || cat.programs || [];
                    if (displayPrograms.length === 0 && !canManageProducts) return null;

                    const ITEMS_PER_ROW = 3;
                    const isExpanded = !!expandedCategories[cat.id];
                    const visiblePrograms = isExpanded ? displayPrograms : displayPrograms.slice(0, ITEMS_PER_ROW);
                    const hasMore = displayPrograms.length > ITEMS_PER_ROW;
                    const hiddenCount = displayPrograms.length - ITEMS_PER_ROW;

                    const renderProductGrid = (programsToRender) => (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {programsToRender.map((prog, progIdx) => {
                          const totalDocs = (prog.brochure ? 1 : 0) + (prog.documents?.length || 0);
                          const isFirstCard = progIdx === 0;
                          return (
                            <div
                              key={prog.id}
                              id={isFirstCard ? "tour-first-program-card" : undefined}
                              className="bg-slate-50 app-dark:bg-[#1e1e1e]! border-2 border-slate-200 app-dark:border-slate-700! rounded-xl overflow-hidden transition-all duration-200 hover:bg-cyan-50/30 app-dark:hover:bg-cyan-955/20! hover:border-cyan-300 app-dark:hover:border-cyan-900/60! hover:shadow-sm cursor-pointer flex flex-row items-stretch relative group"
                              onClick={() => {
                                setSelectedProduct(prog);
                                setViewMode("detail");
                              }}
                            >
                              <div className="shrink-0 w-20 sm:w-24 bg-slate-200 app-dark:bg-slate-700! relative overflow-hidden m-2 rounded-lg border-2 border-slate-200 app-dark:border-slate-600!">
                                {prog.image ? (
                                  <img
                                    src={prog.image}
                                    alt={prog.name}
                                    className="w-full h-full object-cover absolute inset-0"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-cyan-900/10 to-cyan-700/20 app-dark:from-cyan-900/30 app-dark:to-cyan-700/40">
                                    <i className="fa fa-image text-2xl text-slate-300 app-dark:text-slate-600!"></i>
                                  </div>
                                )}
                              </div>

                              <div className="flex flex-col justify-between flex-1 min-w-0 p-3">
                                <div>
                                  <div className="font-bold text-slate-800 app-dark:text-slate-100! text-[13px] mb-1 line-clamp-2 leading-snug pr-14" title={prog.name}>
                                    {prog.name}
                                  </div>
                                  {prog.description && (
                                    <p className="text-[11px] text-slate-450 app-dark:text-slate-400! line-clamp-2 leading-relaxed m-0">
                                      {prog.description}
                                    </p>
                                  )}
                                </div>
                                <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-200/40 app-dark:border-white/8!">
                                  <div className="flex gap-1.5 flex-wrap items-center">
                                    <span className="bg-white app-dark:bg-[#252525]! text-slate-700 app-dark:text-slate-300! border border-slate-200 app-dark:border-white/8! px-2 py-0.5 rounded-lg text-[10px] font-medium flex items-center gap-1">
                                      <i className="fa fa-earth-asia text-cyan-750 app-dark:text-cyan-400!"></i>
                                      {resolveCountryName(prog.country)}
                                    </span>
                                    {prog.shortCode && (
                                      <span className="bg-cyan-50 app-dark:bg-cyan-900/30 text-cyan-700 app-dark:text-cyan-300 border border-cyan-100 app-dark:border-cyan-900/40 px-2 py-0.5 rounded-lg text-[10px] font-semibold">
                                        {prog.shortCode}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-slate-400 app-dark:text-slate-500! font-medium flex items-center gap-1">
                                    <i className="fa fa-folder-open text-slate-400 app-dark:text-slate-500!"></i>
                                    {totalDocs} Tài liệu
                                  </span>
                                </div>
                              </div>

                              {canManageProducts && (
                                <div
                                  className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    type="button"
                                    onClick={() => handleEditProduct(prog)}
                                    className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-cyan-700 hover:border-cyan-300 flex items-center justify-center shadow-sm transition-colors"
                                    title="Sửa sản phẩm"
                                  >
                                    <i className="fa fa-pen text-[10px]"></i>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteProduct(prog.id)}
                                    className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-300 flex items-center justify-center shadow-sm transition-colors"
                                    title="Xóa sản phẩm"
                                  >
                                    <i className="fa fa-trash text-[10px]"></i>
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );

                    const renderShowMoreBtn = (hasMoreItems, hiddenItemsCount) => {
                      if (!hasMoreItems) return null;
                      return (
                        <div className="mt-3 flex justify-center">
                          <button
                            type="button"
                            onClick={() => setExpandedCategories(prev => ({ ...prev, [cat.id]: !isExpanded }))}
                            className="flex items-center gap-2 text-xs font-semibold text-cyan-800 app-dark:text-cyan-400! hover:text-cyan-950 app-dark:hover:text-cyan-300! bg-cyan-50 app-dark:bg-cyan-955/20! hover:bg-cyan-100 app-dark:hover:bg-cyan-955/40! border border-cyan-200/70 app-dark:border-cyan-900/50! px-4 py-1.5 rounded-full transition-all duration-200"
                          >
                            {isExpanded ? (
                              <>
                                <i className="fa fa-chevron-up text-[10px]"></i>
                                Thu gọn
                              </>
                            ) : (
                              <>
                                <i className="fa fa-chevron-down text-[10px]"></i>
                                Xem thêm {hiddenItemsCount} sản phẩm
                              </>
                            )}
                          </button>
                        </div>
                      );
                    };

                    // ============ CATEGORY "VISA" - GIỮ NGUYÊN HIỂN THỊ VISA_TYPES ============
                    if (cat.name === "Visa") {
                      return (
                        <div key={cat.id} className="mb-6 relative z-0">
                          {/* Header */}
                          <div className="bg-linear-to-b from-[#f0f7ff] to-[#f8fafc] app-dark:bg-none! app-dark:bg-[#111827]! rounded-t-[20px] rounded-b-[12px] border border-blue-100 app-dark:border-[#334155]! p-4 md:p-5 flex flex-col md:flex-row justify-between mb-4 shadow-sm relative">
                            <div className="absolute top-0 right-0 bottom-0 w-1/3 md:w-2/5 bg-linear-to-l from-blue-100/15 to-transparent pointer-events-none overflow-hidden rounded-t-[20px] rounded-b-[12px]">
                              <img
                                src="https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=600&q=80"
                                alt="passport background"
                                className="absolute right-0 w-[300px] md:w-[350px] h-[150%] object-cover mix-blend-overlay opacity-15 -rotate-12 translate-x-8 -translate-y-10"
                              />
                            </div>

                            <div className="relative z-10 w-full">
                              <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-4 w-full">
                                <div className="flex items-start gap-3">
                                  <div className="w-[48px] h-[48px] rounded-[16px] bg-[#2563eb] flex items-center justify-center shadow-md shrink-0">
                                    <i className="fa fa-earth-americas text-white text-xl"></i>
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                      <h3 className="text-xl md:text-2xl font-extrabold text-slate-800 app-dark:text-slate-100! m-0 leading-none tracking-tight">Visa</h3>
                                      <span className="bg-blue-100 app-dark:bg-blue-955/40! text-blue-600 app-dark:text-blue-400! px-2 py-0.5 rounded-full text-[10px] font-bold">4 SP</span>
                                    </div>
                                    <p className="text-slate-500 app-dark:text-slate-400! text-xs md:text-sm m-0 line-clamp-1">Quản lý các danh mục visa và hồ sơ liên quan</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                                  {canManageProducts && (
                                    <>
                                      <button
                                        onClick={() => handleEditCategory(cat)}
                                        className="bg-white app-dark:bg-slate-800! border border-slate-200 app-dark:border-slate-700! text-[#ea580c] app-dark:text-orange-400! hover:bg-orange-50 app-dark:hover:bg-slate-700! px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1 shadow-sm transition-colors"
                                      >
                                        <i className="fa fa-pen text-[10px]"></i> Sửa
                                      </button>
                                      <button
                                        onClick={() => handleToggleCategoryStatus(cat.id, cat.status)}
                                        className="bg-white app-dark:bg-slate-800! border border-slate-200 app-dark:border-slate-700! text-slate-600 app-dark:text-slate-300! hover:bg-slate-50 app-dark:hover:bg-slate-700! px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1 shadow-sm transition-colors"
                                      >
                                        {cat.status === "inactive" || cat.status === "hidden" ? <><i className="fa fa-eye text-[10px]"></i> Hiện</> : <><i className="fa fa-eye-slash text-[10px]"></i> Ẩn</>}
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Stats */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                <div className="bg-white app-dark:bg-slate-900! rounded-xl p-2.5 flex items-center gap-2 shadow-sm border border-slate-100/50 app-dark:border-[#334155]!">
                                  <div className="w-8 h-8 rounded-lg bg-[#f0fdf4] app-dark:bg-[#16a34a]/15! text-[#16a34a] app-dark:text-[#16a34a]! flex items-center justify-center text-sm shrink-0">
                                    <i className="fa fa-folder-open"></i>
                                  </div>
                                  <div>
                                    <div className="text-[9px] font-semibold text-slate-400 app-dark:text-slate-500! uppercase tracking-wider mb-0.5">Danh mục</div>
                                    <div className="text-lg font-bold text-slate-800 app-dark:text-slate-100! leading-none">4</div>
                                  </div>
                                </div>
                                <div className="bg-white app-dark:bg-slate-900! rounded-xl p-2.5 flex items-center gap-2 shadow-sm border border-slate-100/50 app-dark:border-[#334155]!">
                                  <div className="w-8 h-8 rounded-lg bg-[#eff6ff] app-dark:bg-[#2563eb]/15! text-[#2563eb] app-dark:text-[#2563eb]! flex items-center justify-center text-sm shrink-0">
                                    <i className="fa fa-file-lines"></i>
                                  </div>
                                  <div>
                                    <div className="text-[9px] font-semibold text-slate-400 app-dark:text-slate-500! uppercase tracking-wider mb-0.5">Hồ sơ</div>
                                    <div className="text-lg font-bold text-slate-800 app-dark:text-slate-100! leading-none">32</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Content - HIỂN THỊ VISA_TYPES */}
                          <div className="bg-white app-dark:bg-[#111827]! rounded-[20px] border border-slate-100 app-dark:border-[#334155]! p-4 shadow-sm relative z-0">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-bold text-slate-800 app-dark:text-slate-100! text-sm">Danh sách sản phẩm</h4>
                              <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-0.5">
                                <button className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm text-xs">
                                  <i className="fa fa-grid-2"></i>
                                </button>
                                <button className="w-6 h-6 rounded-md text-slate-400 hover:text-slate-600 flex items-center justify-center text-xs">
                                  <i className="fa fa-list"></i>
                                </button>
                              </div>
                            </div>

                            {!selectedVisaType ? (
                              <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                  {VISA_TYPES.map(type => (
                                    <div
                                      key={type.id}
                                      onClick={() => setSelectedVisaType(type.id)}
                                      className={`relative flex flex-col border border-slate-100/50 app-dark:border-[#334155]! rounded-[16px] overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ${type.gradient} app-dark:bg-none! app-dark:bg-[#1e293b]/50!`}
                                    >
                                      <div className="px-3 pt-4 pb-3 flex flex-col items-center text-center flex-1">
                                        <div className={`w-[48px] h-[48px] rounded-full bg-white app-dark:bg-slate-800! flex items-center justify-center shadow-[0_8px_24px_-8px_rgba(0,0,0,0.15)] mb-3 ${type.color}`}>
                                          <i className={`fa ${type.icon} text-xl`}></i>
                                        </div>
                                        <h5 className={`text-sm font-bold mb-1 ${type.color}`}>{type.name}</h5>
                                        <p className="text-slate-500 app-dark:text-slate-400! text-[11px] leading-relaxed mb-2 line-clamp-2">{type.desc}</p>

                                        <div className="w-full border-t border-dashed border-slate-200/80 app-dark:border-slate-700/80! my-1.5"></div>

                                        <div className="w-full flex justify-between px-0.5">
                                          <div className="flex items-center gap-1.5">
                                            <div className={`w-[18px] h-[18px] rounded-full bg-white app-dark:bg-slate-800! flex items-center justify-center shadow-sm ${type.color}`}>
                                              <i className="fa fa-user text-[8px]"></i>
                                            </div>
                                            <div className="text-left">
                                              <div className="text-xs font-extrabold text-slate-800 app-dark:text-slate-150! leading-none mb-0.5">{type.docsCount}</div>
                                              <div className="text-[8px] text-slate-400 app-dark:text-slate-500!">Hồ sơ</div>
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-1.5">
                                            <div className={`w-[18px] h-[18px] rounded-full bg-white app-dark:bg-slate-800! flex items-center justify-center shadow-sm ${type.color}`}>
                                              <i className="fa fa-file-lines text-[8px]"></i>
                                            </div>
                                            <div className="text-left">
                                              <div className="text-xs font-extrabold text-slate-800 app-dark:text-slate-150! leading-none mb-0.5">{type.filesCount}</div>
                                              <div className="text-[8px] text-slate-400 app-dark:text-slate-500!">Tài liệu</div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="px-2.5 pb-2.5">
                                        <button className={`w-full py-1.5 rounded-xl flex items-center justify-center transition-colors shadow-sm text-xs ${type.btnBg} app-dark:bg-[#0b6fb3]/25! app-dark:text-[#0b6fb3]!`}>
                                          <i className="fa fa-arrow-right"></i>
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <div className="mt-3 bg-[#f8fafc] app-dark:bg-[#1e1e1e]! border border-[#f1f5f9] app-dark:border-slate-850! rounded-xl px-3 py-2 flex items-center gap-2">
                                  <i className="fa fa-circle-info text-blue-500 text-sm"></i>
                                  <span className="text-[11px] text-slate-500 app-dark:text-slate-400! font-medium">Click vào danh mục để xem chi tiết và quản lý hồ sơ, tài liệu.</span>
                                </div>
                              </>
                            ) : (
                              <div className="flex flex-col gap-3 bg-white app-dark:bg-[#111827]! p-3 rounded-2xl border border-slate-100 app-dark:border-[#334155]! shadow-sm">
                                <div className="flex items-center gap-2 bg-slate-50 app-dark:bg-slate-900! p-2 rounded-lg border border-slate-200 app-dark:border-slate-800!">
                                  <button
                                    onClick={() => setSelectedVisaType(null)}
                                    className="text-slate-600 app-dark:text-slate-300! hover:text-cyan-700 app-dark:hover:text-cyan-400! bg-white app-dark:bg-slate-850! border border-slate-200 app-dark:border-slate-700! px-2.5 py-1 rounded-lg text-[10px] font-semibold shadow-sm transition-colors flex items-center gap-1"
                                  >
                                    <i className="fa fa-arrow-left text-[8px]"></i> Trở lại
                                  </button>
                                  <span className="font-bold text-slate-800 app-dark:text-slate-100! text-xs">
                                    Đang hiển thị: {VISA_TYPES.find(t => t.id === selectedVisaType)?.name}
                                  </span>
                                </div>
                                {renderProductGrid(visiblePrograms)}
                                {renderShowMoreBtn(hasMore, hiddenCount)}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }

                    // ============ STANDARD CATEGORY ============
                    const totalCatDocs = displayPrograms.reduce((sum, prog) => sum + (prog.brochure ? 1 : 0) + (prog.documents?.length || 0), 0);
                    const defaultCoverImage = "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80";

                    return (
                      <div key={cat.id} className="mb-6 relative z-0">
                        <div className="bg-linear-to-b from-[#f0f7ff] to-[#f8fafc] app-dark:bg-none! app-dark:bg-[#111827]! rounded-t-[20px] rounded-b-[12px] border border-blue-100 app-dark:border-[#334155]! p-4 md:p-5 flex flex-col md:flex-row justify-between mb-4 shadow-sm relative">
                          <div className="absolute top-0 right-0 bottom-0 w-1/3 md:w-2/5 bg-linear-to-l from-blue-100/15 to-transparent pointer-events-none overflow-hidden rounded-t-[20px] rounded-b-[12px]">
                            <img
                              src={cat.coverImageUrl || defaultCoverImage}
                              alt={cat.name}
                              className="absolute right-0 w-[300px] md:w-[350px] h-[150%] object-cover mix-blend-overlay opacity-15 -rotate-12 translate-x-8 -translate-y-10"
                            />
                          </div>

                          <div className="relative z-10 w-full">
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-4 w-full">
                              <div className="flex items-start gap-3">
                                <div className="w-[48px] h-[48px] rounded-[16px] bg-[#2563eb] flex items-center justify-center shadow-md shrink-0">
                                  <i className="fa fa-layer-group text-white text-xl"></i>
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                    <h3 className="text-xl md:text-2xl font-extrabold text-slate-800 app-dark:text-slate-100! m-0 leading-none tracking-tight">{cat.name}</h3>
                                  </div>
                                  {cat.description && (
                                    <p className="text-slate-500 app-dark:text-slate-400! text-xs md:text-sm m-0 max-w-xl leading-relaxed line-clamp-2">{cat.description}</p>
                                  )}
                                </div>
                              </div>

                              {canManageProducts && (
                                <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                                  <button
                                    type="button"
                                    onClick={() => handleEditCategory(cat)}
                                    className="bg-white app-dark:bg-slate-800! border border-slate-200 app-dark:border-slate-700! text-[#ea580c] app-dark:text-orange-400! hover:bg-orange-50 app-dark:hover:bg-slate-700! px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1 shadow-sm transition-colors"
                                  >
                                    <i className="fa fa-pen text-[10px]"></i> Sửa
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleCategoryStatus(cat.id, cat.status)}
                                    className="bg-white app-dark:bg-slate-800! border border-slate-200 app-dark:border-slate-700! text-slate-600 app-dark:text-slate-300! hover:bg-slate-50 app-dark:hover:bg-slate-700! px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1 shadow-sm transition-colors"
                                  >
                                    {cat.status === "inactive" || cat.status === "hidden" ? (
                                      <><i className="fa fa-eye text-[10px]"></i> Hiện</>
                                    ) : (
                                      <><i className="fa fa-eye-slash text-[10px]"></i> Ẩn</>
                                    )}
                                  </button>
                                </div>
                              )}
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              <div className="bg-white app-dark:bg-slate-900! rounded-xl p-2.5 flex items-center gap-2 shadow-sm border border-slate-100/50 app-dark:border-[#334155]!">
                                <div className="w-8 h-8 rounded-lg bg-[#f0fdf4] app-dark:bg-[#16a34a]/15! text-[#16a34a] app-dark:text-[#16a34a]! flex items-center justify-center text-sm shrink-0">
                                  <i className="fa fa-box-open"></i>
                                </div>
                                <div>
                                  <div className="text-[9px] font-semibold text-slate-400 app-dark:text-slate-500! uppercase tracking-wider mb-0.5">Sản phẩm</div>
                                  <div className="text-lg font-bold text-slate-800 app-dark:text-slate-100! leading-none">{displayPrograms.length}</div>
                                </div>
                              </div>
                              <div className="bg-white app-dark:bg-slate-900! rounded-xl p-2.5 flex items-center gap-2 shadow-sm border border-slate-100/50 app-dark:border-[#334155]!">
                                <div className="w-8 h-8 rounded-lg bg-[#eff6ff] app-dark:bg-[#2563eb]/15! text-[#2563eb] app-dark:text-[#2563eb]! flex items-center justify-center text-sm shrink-0">
                                  <i className="fa fa-file-lines"></i>
                                </div>
                                <div>
                                  <div className="text-[9px] font-semibold text-slate-400 app-dark:text-slate-500! uppercase tracking-wider mb-0.5">Tài liệu</div>
                                  <div className="text-lg font-bold text-slate-800 app-dark:text-slate-100! leading-none">{totalCatDocs}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {displayPrograms.length > 0 && (
                          <div className="bg-white app-dark:bg-[#111827]! rounded-[20px] border border-slate-100 app-dark:border-[#334155]! p-4 shadow-sm relative z-0">
                            {renderProductGrid(visiblePrograms)}
                            {renderShowMoreBtn(hasMore, hiddenCount)}
                          </div>
                        )}
                      </div>
                    );
                  })
                })()
              ) : (
                <div className="col-span-full text-center py-16 bg-white app-dark:bg-[#252525]! border border-slate-100 app-dark:border-white/8! rounded-2xl shadow-sm app-dark:shadow-none!">
                  <svg className="w-12 h-12 text-slate-300 app-dark:text-slate-600! mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <h5 className="text-slate-500 app-dark:text-slate-400! font-semibold text-sm mb-1">Không tìm thấy kết quả phù hợp</h5>
                  <p className="text-slate-400 app-dark:text-slate-500! text-xs mb-4">Thử thay đổi từ khóa hoặc xóa bộ lọc đang áp dụng.</p>
                  <button className="bg-cyan-900 hover:bg-cyan-950 text-white text-xs font-semibold px-4 py-2 rounded-xl mt-1 transition-colors" onClick={handleResetFilters}>
                    Xóa bộ lọc
                  </button>
                </div>
              )}
            </div>

            {/* PHÂN TRANG DANH MỤC */}
            {(() => {
              const totalCatPages = Math.ceil(filteredCategories.length / CATEGORIES_PER_PAGE);
              if (totalCatPages <= 1) return null;
              const safeCatPage = Math.min(categoryPage, totalCatPages - 1);
              return (
                <div className="flex items-center justify-center gap-3 mt-6">
                  <button
                    type="button"
                    disabled={safeCatPage === 0}
                    onClick={() => setCategoryPage(p => Math.max(0, p - 1))}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 app-dark:border-slate-700! text-slate-500 app-dark:text-slate-300! disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 app-dark:hover:bg-[#252525]! transition-colors"
                    aria-label="Trang trước"
                  >
                    <i className="fa fa-chevron-left text-xs"></i>
                  </button>

                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: totalCatPages }).map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCategoryPage(idx)}
                        className={`rounded-full transition-all duration-200 font-semibold text-xs ${idx === safeCatPage
                          ? "h-8 w-8 bg-cyan-900 text-white shadow-sm"
                          : "h-8 w-8 bg-white app-dark:bg-[#252525]! border border-slate-200 app-dark:border-slate-700! text-slate-500 app-dark:text-slate-400! hover:bg-slate-50 app-dark:hover:bg-[#2e2e2e]!"
                          }`}
                        aria-label={`Trang ${idx + 1}`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    disabled={safeCatPage === totalCatPages - 1}
                    onClick={() => setCategoryPage(p => Math.min(totalCatPages - 1, p + 1))}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 app-dark:border-slate-700! text-slate-500 app-dark:text-slate-300! disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 app-dark:hover:bg-[#252525]! transition-colors"
                    aria-label="Trang sau"
                  >
                    <i className="fa fa-chevron-right text-xs"></i>
                  </button>

                  <span className="text-xs text-slate-400 app-dark:text-slate-500! ml-2">
                    Trang {safeCatPage + 1} / {totalCatPages}
                  </span>
                </div>
              );
            })()}
          </>
        )}

        {/* PRODUCT DETAIL VIEW */}
        {viewMode === "detail" && selectedProduct && (
          <div className="bg-white app-dark:bg-[#252525]! rounded-2xl shadow-sm border border-slate-100 app-dark:border-white/8! overflow-hidden">

            {/* ── HERO BANNER — bố cục 2 cột trắng theo mẫu ── */}
            <div className="relative overflow-hidden rounded-t-2xl border-b border-slate-100 app-dark:border-white/8! bg-white app-dark:bg-[#1e1e1e]!" style={{ minHeight: "260px" }}>
              <div className="grid grid-cols-1 lg:grid-cols-2 items-stretch" style={{ minHeight: "260px" }}>

                {/* Cột trái: thông tin */}
                <div className="flex flex-col justify-between p-6 md:p-8 gap-4">
                  {/* Breadcrumb text-only (không có nút quay lại) */}
                  <div className="flex items-center gap-1.5 flex-wrap text-xs text-slate-400 app-dark:text-slate-500!">
                    <span
                      className="hover:text-[#005bbf] cursor-pointer transition-colors font-medium"
                      onClick={() => setViewMode("overview")}
                    >
                      {selectedProduct.categoryName || "Sản phẩm"}
                    </span>
                    {(selectedProduct.region || selectedProduct.country) && (
                      <>
                        <span>›</span>
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {[selectedProduct.region, resolveCountryName(selectedProduct.country)].filter(Boolean).join(" · ")}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Nội dung chính */}
                  <div className="flex-1">
                    {/* Badge danh mục */}
                    <div className="flex gap-2 mb-3 flex-wrap items-center">
                      <span className="inline-block bg-slate-100 app-dark:bg-white/10! text-slate-600 app-dark:text-slate-300! text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border border-slate-200 app-dark:border-white/15!">
                        {selectedProduct.categoryName || "Chương trình"}
                      </span>
                      {selectedProduct.shortCode && (
                        <span className="inline-block bg-cyan-50 app-dark:bg-cyan-900/30 text-cyan-700 app-dark:text-cyan-300 text-[10px] font-bold px-2.5 py-1 rounded-full border border-cyan-100 app-dark:border-cyan-900/40">
                          Mã: {selectedProduct.shortCode}
                        </span>
                      )}
                      {selectedProduct.visaCode && (
                        <span className="inline-block bg-indigo-50 app-dark:bg-indigo-900/30 text-indigo-700 app-dark:text-indigo-300 text-[10px] font-bold px-2.5 py-1 rounded-full border border-indigo-100 app-dark:border-indigo-900/40">
                          Visa Code: {selectedProduct.visaCode}
                        </span>
                      )}
                      {selectedProduct.purpose && (
                        <span className="inline-block bg-amber-50 app-dark:bg-amber-900/30 text-amber-700 app-dark:text-amber-300 text-[10px] font-bold px-2.5 py-1 rounded-full border border-amber-100 app-dark:border-amber-900/40">
                          Mục đích: {selectedProduct.purpose}
                        </span>
                      )}
                    </div>
                    <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 app-dark:text-white! m-0 leading-tight">
                      {selectedProduct.name}
                    </h2>
                    <p className="text-slate-500 app-dark:text-slate-400! text-sm leading-relaxed mt-2 mb-0 max-w-lg">
                      {selectedProduct.description || selectedProduct.detailDescription || "Chương trình chất lượng cao, uy tín quốc tế."}
                    </p>
                  </div>

                  {/* Footer: ngày cập nhật + website */}
                  <div className="flex items-center gap-3 flex-wrap pt-2">
                    <p className="text-slate-400 app-dark:text-slate-500! text-[11px] flex items-center gap-1.5 m-0">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Cập nhật:{" "}
                      {selectedProduct.updatedAt
                        ? (() => {
                          try {
                            const d = new Date(selectedProduct.updatedAt);
                            return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
                          } catch { return selectedProduct.updatedAt; }
                        })()
                        : new Date().toLocaleDateString("vi-VN")}
                    </p>
                    {selectedProduct.websiteUrl && (
                      <button
                        className="bg-slate-100 hover:bg-slate-200 app-dark:bg-white/8! app-dark:hover:bg-white/15! text-slate-700 app-dark:text-slate-300! border border-slate-200 app-dark:border-white/15! font-semibold text-xs rounded-xl px-3 py-1.5 flex items-center gap-1.5 transition-all"
                        onClick={() => handleOpenWebsite(selectedProduct.websiteUrl)}
                      >
                        <i className="fa fa-globe text-[11px]"></i> Website
                      </button>
                    )}
                  </div>
                </div>

                {/* Cột phải: ảnh nghiêng + hover về thẳng */}
                <div className="hidden lg:flex items-center justify-end pr-8 overflow-hidden">

                  {/* Nút Chỉnh sửa — góc phải trên banner (theo mẫu) */}
                  {canManageProducts && (
                    <button
                      className="absolute top-4 right-5 bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold text-xs rounded-xl px-4 py-2 flex items-center gap-1.5 transition-all shadow-md z-10"
                      onClick={() => handleEditProduct(selectedProduct)}
                    >
                      <i className="fa fa-pen text-[11px]"></i> Chỉnh sửa
                    </button>
                  )}
                  {selectedProduct.image ? (
                    <div
                      className="rounded-2xl overflow-hidden shadow-2xl border border-slate-200 app-dark:border-white/10! transition-transform duration-500"
                      style={{ width: "380px", height: "240px", transform: "rotate(3deg)", flexShrink: 0 }}
                      onMouseEnter={e => e.currentTarget.style.transform = "rotate(0deg)"}
                      onMouseLeave={e => e.currentTarget.style.transform = "rotate(3deg)"}
                    >
                      <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div
                      className="rounded-2xl bg-linear-to-br from-blue-50 to-slate-100 app-dark:from-blue-900/20 app-dark:to-slate-800/30 border border-slate-200 app-dark:border-white/10! flex items-center justify-center shadow-2xl transition-transform duration-500"
                      style={{ width: "380px", height: "240px", transform: "rotate(3deg)", flexShrink: 0 }}
                      onMouseEnter={e => e.currentTarget.style.transform = "rotate(0deg)"}
                      onMouseLeave={e => e.currentTarget.style.transform = "rotate(3deg)"}
                    >
                      <i className="fa fa-image text-5xl text-slate-300 app-dark:text-slate-600!"></i>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── CONTENT ── */}
            <div className="p-6 md:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">

                {/* LEFT: Main content (7/10) */}
                <div className="lg:col-span-7 space-y-7">

                  {/* Mô tả chi tiết */}
                  {selectedProduct.detailDescription && (
                    <div>
                      <h4 className="font-bold text-slate-800 app-dark:text-slate-100! text-sm mb-3 flex items-center gap-2">
                        <i className="fa fa-align-left text-[#005bbf]"></i>
                        <span className="text-[#005bbf] uppercase tracking-wide text-xs">Giới thiệu chương trình</span>
                      </h4>
                      <p className="text-slate-600 app-dark:text-slate-300! text-sm leading-relaxed whitespace-pre-line m-0">
                        {selectedProduct.detailDescription}
                      </p>
                    </div>
                  )}

                  {/* Đối tượng phù hợp */}
                  {selectedProduct.targetAudience && (
                    <div className="flex gap-3 p-4 rounded-2xl bg-blue-50 app-dark:bg-white/5! border border-blue-100 app-dark:border-white/8!">
                      <div className="w-9 h-9 rounded-xl bg-[#005bbf] text-white flex items-center justify-center shrink-0 text-sm shadow-sm">
                        <i className="fa fa-users text-xs"></i>
                      </div>
                      <div>
                        <p className="font-bold text-[#005bbf] app-dark:text-blue-300! text-[10px] uppercase tracking-widest mb-1">Đối tượng phù hợp</p>
                        <p className="text-slate-600 app-dark:text-slate-300! text-sm leading-relaxed m-0">{selectedProduct.targetAudience}</p>
                      </div>
                    </div>
                  )}

                </div>

                {/* RIGHT: Sidebar (3/10) */}
                <div className="lg:col-span-3 space-y-4">

                  {/* Card tài liệu & brochure */}
                  <div className="bg-slate-50 app-dark:bg-white/5! rounded-2xl border border-slate-200 app-dark:border-white/8! overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-200 app-dark:border-white/8! flex items-center gap-2">
                      <div className="w-7 h-7 bg-[#005bbf]/10 rounded-lg flex items-center justify-center">
                        <i className="fa fa-folder-open text-[#005bbf] text-sm"></i>
                      </div>
                      <span className="font-bold text-slate-700 app-dark:text-slate-200! text-sm">Tài liệu & Brochure</span>
                    </div>

                    <div className="p-4 space-y-4">
                      {/* Brochure */}
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Brochure chính thức</p>
                        {selectedProduct.brochure ? (
                          <div className="bg-white app-dark:bg-white/5! border border-slate-200/80 app-dark:border-white/10! rounded-xl p-3 flex justify-between items-center gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              {selectedProduct.brochure.sourceType === "link" ? (
                                <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                                  <i className="fa fa-link text-[#005bbf] text-xs"></i>
                                </div>
                              ) : selectedProduct.brochure.fileType === "IMAGE" ? (
                                selectedProduct.brochure.url ? (
                                  <img src={selectedProduct.brochure.url} alt="preview" className="rounded-lg w-7 h-7 object-cover shrink-0 border border-slate-200" />
                                ) : (
                                  <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0">
                                    <i className="fa fa-file-image text-emerald-500 text-xs"></i>
                                  </div>
                                )
                              ) : (
                                <div className="w-7 h-7 bg-red-50 rounded-lg flex items-center justify-center shrink-0">
                                  <i className="fa fa-file-pdf text-red-500 text-xs"></i>
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-semibold text-xs text-slate-800 app-dark:text-slate-200! truncate m-0" title={selectedProduct.brochure.name}>{selectedProduct.brochure.name}</p>
                                <p className="text-slate-400 text-[10px] m-0">{selectedProduct.brochure.size || "Link"}</p>
                              </div>
                            </div>
                            {selectedProduct.brochure.sourceType === "link" ? (
                              <button className="text-[#005bbf] border border-blue-200 bg-blue-50 hover:bg-blue-100 text-xs font-semibold py-1 px-3 rounded-lg shrink-0 transition-colors" onClick={() => handleOpenWebsite(selectedProduct.brochure.url)}>Mở</button>
                            ) : selectedProduct.brochure.fileType === "IMAGE" && selectedProduct.brochure.url ? (
                              <a href={selectedProduct.brochure.url} target="_blank" rel="noreferrer" className="text-[#005bbf] border border-blue-200 bg-blue-50 hover:bg-blue-100 text-xs font-semibold py-1 px-3 rounded-lg shrink-0 transition-colors">Xem</a>
                            ) : (
                              <button className="text-[#005bbf] border border-blue-200 bg-blue-50 hover:bg-blue-100 text-xs font-semibold py-1 px-3 rounded-lg shrink-0 transition-colors" onClick={() => handleDownloadDoc(selectedProduct.brochure.name)}>Tải</button>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 py-2.5 px-3 bg-white app-dark:bg-white/3! border border-dashed border-slate-200 app-dark:border-white/10! rounded-xl">
                            <i className="fa fa-description text-slate-300 text-sm"></i>
                            <p className="text-slate-400 text-xs italic m-0">Chưa có brochure</p>
                          </div>
                        )}
                      </div>

                      {/* Tài liệu tư vấn */}
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Tài liệu hướng dẫn tư vấn</p>
                        {selectedProduct.documents && selectedProduct.documents.length > 0 ? (
                          <div className="flex flex-col gap-2">
                            {selectedProduct.documents.map((doc) => (
                              <div key={doc.id} className="bg-white app-dark:bg-white/5! border border-slate-200/80 app-dark:border-white/10! rounded-xl p-3 flex justify-between items-center gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  {doc.sourceType === "link" ? (
                                    <div className="w-6 h-6 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                                      <i className="fa fa-link text-[#005bbf] text-[10px]"></i>
                                    </div>
                                  ) : (
                                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${doc.type === "PDF" ? "bg-red-50" : doc.type === "XLSX" ? "bg-emerald-50" : "bg-sky-50"}`}>
                                      <i className={`fa ${doc.type === "PDF" ? "fa-file-pdf text-red-500" : doc.type === "XLSX" ? "fa-file-excel text-emerald-500" : "fa-file-lines text-sky-500"} text-[10px]`}></i>
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <p className="font-semibold text-xs text-slate-800 app-dark:text-slate-200! truncate m-0" title={doc.name}>{doc.name}</p>
                                    <p className="text-slate-400 text-[10px] m-0">{doc.size || "Link"} · {doc.updatedAt || "2026-06-01"}</p>
                                  </div>
                                </div>
                                {doc.sourceType === "link" ? (
                                  <button className="text-slate-600 border border-slate-200 hover:bg-slate-50 text-xs font-semibold py-1 px-3 rounded-lg shrink-0 transition-colors" onClick={() => handleOpenWebsite(doc.url)}>Mở</button>
                                ) : (
                                  <button className="text-slate-600 border border-slate-200 hover:bg-slate-50 text-xs font-semibold py-1 px-3 rounded-lg shrink-0 transition-colors" onClick={() => handleDownloadDoc(doc.name)}>Tải</button>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 py-2.5 px-3 bg-white app-dark:bg-white/3! border border-dashed border-slate-200 app-dark:border-white/10! rounded-xl">
                            <i className="fa fa-menu-book text-slate-300 text-sm"></i>
                            <p className="text-slate-400 text-xs italic m-0">Chưa có tài liệu</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Nút Quan tâm sản phẩm — GIỮ NGUYÊN onClick & logic */}
                  <button
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-3.5 px-4 rounded-2xl font-bold shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm"
                    onClick={handleOpenInterestModal}
                  >
                    <i className="fa fa-paper-plane"></i> Quan tâm sản phẩm
                  </button>
                </div>
              </div>

              {/* ── ROW: Điểm nổi bật (7) + Quy trình (3) ── */}
              {(selectedProduct.highlights?.length > 0 || selectedProduct.processSteps?.length > 0) && (
                <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 mt-6 pt-6 border-t border-slate-100 app-dark:border-white/8!">

                  {/* Điểm nổi bật — 7/10 */}
                  {selectedProduct.highlights && selectedProduct.highlights.length > 0 && (
                    <div className="lg:col-span-7">
                      <h4 className="font-bold text-slate-800 app-dark:text-slate-100! text-sm mb-4 flex items-center gap-2">
                        <i className="fa fa-star text-amber-400"></i>
                        <span className="text-slate-700 app-dark:text-slate-200!">Điểm nổi bật</span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {selectedProduct.highlights.map((hl, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-3 p-3.5 rounded-xl bg-white app-dark:bg-white/5! border border-slate-200 app-dark:border-white/8! shadow-sm hover:border-blue-200 hover:shadow-md transition-all duration-200"
                          >
                            <div className="w-8 h-8 bg-blue-50 app-dark:bg-blue-900/30! rounded-lg flex items-center justify-center shrink-0">
                              <i className="fa fa-circle-check text-[#005bbf] app-dark:text-blue-400! text-sm"></i>
                            </div>
                            <span className="text-slate-700 app-dark:text-slate-300! text-sm leading-relaxed">{hl}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quy trình xử lý — 3/10, stepper dọc */}
                  {selectedProduct.processSteps && selectedProduct.processSteps.length > 0 && (
                    <div className="lg:col-span-3">
                      <h4 className="font-bold text-slate-800 app-dark:text-slate-100! text-sm mb-4 flex items-center gap-2">
                        <i className="fa fa-list-check text-[#005bbf]"></i>
                        <span className="text-slate-700 app-dark:text-slate-200!">Quy trình xử lý</span>
                        <span className="ml-auto text-[10px] font-semibold text-slate-400 bg-slate-100 app-dark:bg-white/10! px-2 py-0.5 rounded-full">
                          {selectedProduct.processSteps.length} bước
                        </span>
                      </h4>
                      <div className="flex flex-col">
                        {selectedProduct.processSteps.map((step, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <div className="flex flex-col items-center shrink-0">
                              <div className="w-7 h-7 bg-[#005bbf] text-white font-bold rounded-full flex items-center justify-center text-[11px] shadow-sm z-10">
                                {i + 1}
                              </div>
                              {i < selectedProduct.processSteps.length - 1 && (
                                <div className="w-0.5 h-5 bg-blue-200 app-dark:bg-blue-900/50! my-1" />
                              )}
                            </div>
                            <p className="text-slate-600 app-dark:text-slate-300! text-xs leading-relaxed pt-1.5 pb-3 m-0">{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tags */}
              {selectedProduct.tags && selectedProduct.tags.length > 0 && (
                <div className="flex items-center flex-wrap gap-2 mt-5 pt-5 border-t border-slate-100 app-dark:border-white/8!">
                  {selectedProduct.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="bg-blue-50 app-dark:bg-blue-900/20! text-[#005bbf] app-dark:text-blue-300! border border-blue-100 app-dark:border-blue-900/40! px-3 py-1 rounded-full text-xs font-semibold"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODAL: THÊM / SỬA DANH MỤC LỚN */}
        {editingCategory && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-6 z-1050 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-[650px] max-h-[90vh] flex flex-col overflow-hidden animate-slide-up">
              <div className="bg-slate-50 border-b border-slate-100 px-5 py-4 flex justify-between items-center">
                <h5 className="font-bold text-slate-800 text-base m-0">
                  {editingCategory === "new" ? "Thêm danh mục lớn mới" : "Sửa danh mục lớn"}
                </h5>
                <button className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 w-8 h-8 rounded-lg flex items-center justify-center transition-colors" onClick={() => setEditingCategory(null)}>
                  <i className="fa fa-times"></i>
                </button>
              </div>

              <form onSubmit={handleSaveCategory} className="flex flex-col grow overflow-hidden">
                <div className="bg-slate-50/50 border-b border-slate-150 px-5 flex gap-4">
                  <button
                    type="button"
                    className={`border-b-2 px-1 py-3 text-[13.5px] font-semibold transition-all duration-200 ${activeCategoryTab === "info"
                      ? "text-cyan-900 border-cyan-900"
                      : "text-slate-400 border-transparent hover:text-slate-600"
                      }`}
                    onClick={() => setActiveCategoryTab("info")}
                  >
                    <i className="fa fa-info-circle mr-1.5"></i> 1. Thông tin danh mục
                  </button>
                  <button
                    type="button"
                    className={`border-b-2 px-1 py-3 text-[13.5px] font-semibold transition-all duration-200 ${activeCategoryTab === "programs"
                      ? "text-cyan-900 border-cyan-900"
                      : "text-slate-400 border-transparent hover:text-slate-600 disabled:opacity-40"
                      }`}
                    onClick={() => setActiveCategoryTab("programs")}
                    disabled={editingCategory === "new"}
                  >
                    <i className="fa fa-list-check mr-1.5"></i> 2. Sản phẩm con ({formCategory.programs?.length || 0})
                  </button>
                </div>

                <div className="p-6 overflow-y-auto text-[13.5px] grow">
                  {activeCategoryTab === "info" ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block font-semibold text-xs text-slate-500 mb-1.5">Tên danh mục lớn <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[13.5px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all"
                          placeholder="Ví dụ: Du học hè, Định cư..."
                          value={formCategory.name}
                          onChange={(e) => setFormCategory({ ...formCategory, name: e.target.value })}
                          required
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-xs text-slate-500 mb-1.5">Trạng thái hoạt động</label>
                        <select
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[13.5px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all cursor-pointer"
                          value={formCategory.status}
                          onChange={(e) => setFormCategory({ ...formCategory, status: e.target.value })}
                        >
                          <option value="active">Đang hoạt động</option>
                          <option value="coming_soon">Sắp mở</option>
                          <option value="inactive">Tạm ngưng</option>
                          <option value="hidden">Đã ẩn</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-xs text-slate-500 mb-1.5">Ảnh bìa danh mục</label>
                        {formCategory.coverImageUrl && (
                          <div className="mb-3 relative group">
                            <img
                              src={formCategory.coverImageUrl}
                              alt="Cover"
                              className="w-full h-40 object-cover rounded-xl border border-slate-200"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                            <button
                              type="button"
                              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm transition-colors shadow-lg opacity-0 group-hover:opacity-100"
                              onClick={handleRemoveImage}
                            >
                              <i className="fa fa-times"></i>
                            </button>
                          </div>
                        )}

                        {!formCategory.coverImageUrl && (
                          <div className="mb-3 border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-cyan-400 transition-colors">
                            <i className="fa fa-image text-3xl text-slate-300 mb-2"></i>
                            <p className="text-sm text-slate-500">Chưa có ảnh</p>
                            <p className="text-xs text-slate-400 mt-1">Upload từ máy hoặc nhập link</p>
                          </div>
                        )}

                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-3">
                            <label className="flex-1 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 text-cyan-700 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors cursor-pointer text-center">
                              <i className="fa fa-upload mr-2"></i>
                              Chọn ảnh từ máy
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                              />
                            </label>
                            <span className="text-xs text-slate-400">(Tối đa 500KB)</span>
                          </div>

                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <hr className="flex-1 border-slate-200" />
                              <span className="text-xs text-slate-400 font-medium">HOẶC</span>
                              <hr className="flex-1 border-slate-200" />
                            </div>
                            <input
                              type="text"
                              placeholder="Dán link ảnh từ Internet (Unsplash, Google...)"
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-[13px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all"
                              value={formCategory.coverImageUrl?.startsWith('data:') ? '' : (formCategory.coverImageUrl || '')}
                              onChange={(e) => {
                                const value = e.target.value;
                                let finalValue = value;
                                if (value && !/^https?:\/\//i.test(value) && !value.startsWith('data:')) {
                                  if (value.includes('.') && value.length > 3) {
                                    finalValue = 'https://' + value;
                                  }
                                }
                                setFormCategory(prev => ({ ...prev, coverImageUrl: finalValue }));
                              }}
                            />
                          </div>
                        </div>

                        <div className="mt-4">
                          <p className="text-[10px] text-slate-400 mb-2">Chọn ảnh gợi ý nhanh:</p>
                          <div className="flex gap-2 flex-wrap">
                            {[
                              'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
                              'https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=800&q=80',
                              'https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?auto=format&fit=crop&w=800&q=80',
                              'https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?auto=format&fit=crop&w=800&q=80',
                              'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80',
                            ].map((url, index) => (
                              <button
                                key={index}
                                type="button"
                                className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${formCategory.coverImageUrl === url
                                    ? 'border-cyan-500 ring-2 ring-cyan-500/20'
                                    : 'border-slate-200 hover:border-cyan-300'
                                  }`}
                                onClick={() => {
                                  setFormCategory(prev => ({ ...prev, coverImageUrl: url }));
                                }}
                              >
                                <img src={url} alt="suggestion" className="w-full h-full object-cover" />
                              </button>
                            ))}
                          </div>
                        </div>

                        <p className="text-[10px] text-slate-400 mt-3">
                          <i className="fa fa-info-circle mr-1"></i>
                          Ảnh được lưu dưới dạng Base64 hoặc URL. Nên dùng ảnh nhỏ hơn 500KB cho Base64.
                        </p>
                      </div>

                      <div>
                        <label className="block font-semibold text-xs text-slate-500 mb-1.5">Mô tả tóm tắt</label>
                        <textarea
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[13.5px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all"
                          rows="4"
                          placeholder="Mô tả ngắn gọn mục đích và nội dung cốt lõi của danh mục lớn này..."
                          value={formCategory.description}
                          onChange={(e) => setFormCategory({ ...formCategory, description: e.target.value })}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-slate-500 text-xs">Danh sách sản phẩm con thuộc danh mục:</span>
                        <button
                          type="button"
                          className="bg-cyan-900 hover:bg-cyan-950 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                          onClick={() => handleOpenNewProduct(formCategory.id)}
                        >
                          + Thêm sản phẩm con
                        </button>
                      </div>

                      {formCategory.programs && formCategory.programs.length > 0 ? (
                        <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
                          {formCategory.programs.map((prod) => (
                            <div key={prod.id} className="p-3 border border-slate-100 rounded-xl bg-slate-50 flex justify-between items-center">
                              <div className="text-truncate pr-4 grow" style={{ minWidth: 0 }}>
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="font-bold text-slate-800 text-[13px] block text-truncate" title={prod.name}>
                                    {prod.name}
                                  </span>
                                  {(prod.status === "hidden" || prod.isActive === false) && (
                                    <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-slate-200 text-slate-500">Đã ẩn</span>
                                  )}
                                  {prod.status === "inactive" && (
                                    <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-orange-100 text-orange-600">Tạm ngưng</span>
                                  )}
                                  {prod.status === "coming_soon" && (
                                    <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-yellow-100 text-yellow-700">Sắp mở</span>
                                  )}
                                </div>
                                <span className="text-slate-450 block text-[11px]">
                                  {prod.region} · {prod.country}
                                </span>
                              </div>
                              <div className="flex gap-2 shrink-0">
                                <button
                                  type="button"
                                  title={(prod.status === "hidden" || prod.isActive === false) ? "Hiện sản phẩm" : "Ẩn sản phẩm"}
                                  className={`bg-transparent text-xs font-semibold py-1 px-3 rounded-lg transition-colors border ${(prod.status === "hidden" || prod.isActive === false) ? "hover:bg-emerald-50 text-emerald-600 border-emerald-200" : "hover:bg-slate-100 text-slate-500 border-slate-200"}`}
                                  onClick={() => handleToggleProductStatus(prod)}
                                >
                                  {(prod.status === "hidden" || prod.isActive === false) ? "Hiện" : "Ẩn"}
                                </button>
                                <button
                                  type="button"
                                  className="bg-transparent hover:bg-amber-50 text-amber-600 border border-amber-200 text-xs font-semibold py-1 px-3 rounded-lg transition-colors"
                                  onClick={() => handleEditProduct(prod)}
                                >
                                  Sửa
                                </button>
                                <button
                                  type="button"
                                  className="bg-transparent hover:bg-red-50 text-red-600 border border-red-200 text-xs font-semibold py-1 px-3 rounded-lg transition-colors"
                                  onClick={() => handleDeleteProduct(prod.id)}
                                >
                                  Xóa
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400 text-xs rounded-xl">
                          Chưa có sản phẩm con nào trong danh mục này. Bấm nút phía trên để tạo mới.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 p-4 border-t border-slate-100 flex gap-3 justify-end items-center">
                  {editingCategory !== "new" && (
                    <button
                      type="button"
                      className="bg-transparent hover:bg-red-50 text-red-650 border border-red-200 hover:border-red-350 text-xs font-semibold py-2 px-4 rounded-xl transition-all duration-200 mr-auto cursor-pointer flex items-center gap-1.5"
                      onClick={() => handleDeleteCategory(editingCategory)}
                    >
                      <i className="fa fa-trash-can text-sm"></i> Xóa danh mục
                    </button>
                  )}
                  <button type="button" className="bg-transparent hover:bg-slate-150 text-slate-650 border border-slate-250 text-xs font-semibold py-2 px-4 rounded-xl transition-colors cursor-pointer" onClick={() => setEditingCategory(null)}>
                    Hủy bỏ
                  </button>
                  <button type="submit" className="bg-cyan-900 hover:bg-cyan-950 text-white text-xs font-semibold py-2 px-5 rounded-xl transition-colors cursor-pointer">
                    {editingCategory === "new" ? "Lưu danh mục" : "Cập nhật danh mục"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: THÊM / SỬA SẢN PHẨM CON */}
        {editingProduct && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-6 z-1060 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-[1000px] max-h-[90vh] flex flex-col overflow-hidden animate-slide-up">
              <div className="bg-slate-50 border-b border-slate-100 px-5 py-4 flex justify-between items-center">
                <h5 className="font-bold text-slate-800 text-base m-0">
                  {editingProduct === "new" ? "Thêm sản phẩm con mới" : "Sửa thông tin sản phẩm con"}
                </h5>
                <button className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 w-8 h-8 rounded-lg flex items-center justify-center transition-colors" onClick={() => setEditingProduct(null)}>
                  <i className="fa fa-times"></i>
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="flex flex-col grow overflow-hidden">
                <div className="bg-slate-50/50 border-b border-slate-150 px-5 flex gap-4">
                  <button
                    type="button"
                    className={`border-b-2 px-1 py-3 text-[13.5px] font-semibold transition-all duration-200 ${activeProductTab === "basic"
                      ? "text-cyan-900 border-cyan-900"
                      : "text-slate-400 border-transparent hover:text-slate-600"
                      }`}
                    onClick={() => setActiveProductTab("basic")}
                  >
                    <i className="fa fa-info-circle mr-1.5"></i> 1. Thông tin cơ bản
                  </button>
                  <button
                    type="button"
                    className={`border-b-2 px-1 py-3 text-[13.5px] font-semibold transition-all duration-200 ${activeProductTab === "content"
                      ? "text-cyan-900 border-cyan-900"
                      : "text-slate-400 border-transparent hover:text-slate-600"
                      }`}
                    onClick={() => setActiveProductTab("content")}
                  >
                    <i className="fa fa-file-invoice mr-1.5"></i> 2. Nội dung tư vấn
                  </button>
                  <button
                    type="button"
                    className={`border-b-2 px-1 py-3 text-[13.5px] font-semibold transition-all duration-200 ${activeProductTab === "docs"
                      ? "text-cyan-900 border-cyan-900"
                      : "text-slate-400 border-transparent hover:text-slate-600"
                      }`}
                    onClick={() => setActiveProductTab("docs")}
                  >
                    <i className="fa fa-file-pdf mr-1.5"></i> 3. Tài liệu ({formProduct.brochure ? 1 : 0} Brochure / {formProduct.documents?.length || 0} Tư vấn)
                  </button>
                </div>

                <div className="p-6 overflow-y-auto text-[13.5px] grow">
                  {/* TAB 1: BASIC INFORMATION */}
                  {activeProductTab === "basic" && (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      <div className="md:col-span-6">
                        <label className="block font-semibold text-xs text-slate-500 mb-1.5">Tên sản phẩm <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[13.5px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all"
                          value={formProduct.name}
                          onChange={(e) => setFormProduct({ ...formProduct, name: e.target.value })}
                          placeholder="Ví dụ: Du học hè tiếng Anh Philippines"
                          required
                        />
                      </div>
                      <div className="md:col-span-6">
                        <label className="block font-semibold text-xs text-slate-500 mb-1.5">Thuộc danh mục lớn <span className="text-red-500">*</span></label>
                        <select
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[13.5px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all cursor-pointer"
                          value={formProduct.categoryId}
                          onChange={(e) => setFormProduct({ ...formProduct, categoryId: e.target.value, categoryName: categories.find(c => c.id === e.target.value)?.name || "" })}
                          required
                        >
                          <option value="">-- Chọn danh mục lớn --</option>
                          {categories.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-1 md:col-span-4">
                        <label className="block font-semibold text-xs text-slate-500 mb-1.5">Quốc gia <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[13.5px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all"
                          value={formProduct.country}
                          onChange={(e) => setFormProduct({ ...formProduct, country: e.target.value })}
                          placeholder="Ví dụ: Đức, Hàn Quốc"
                          required
                        />
                      </div>
                      <div className="col-span-1 md:col-span-4">
                        <label className="block font-semibold text-xs text-slate-500 mb-1.5">Khu vực địa lý</label>
                        <select
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[13.5px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all cursor-pointer"
                          value={formProduct.region}
                          onChange={(e) => setFormProduct({ ...formProduct, region: e.target.value })}
                        >
                          <option value="Châu Á">Châu Á</option>
                          <option value="Châu Âu">Châu Âu</option>
                          <option value="Châu Mỹ">Châu Mỹ</option>
                          <option value="Châu Đại Dương">Châu Đại Dương</option>
                          <option value="Châu Phi">Châu Phi</option>
                          <option value="Trung Đông">Trung Đông</option>
                        </select>
                      </div>
                      <div className="col-span-1 md:col-span-4">
                        <label className="block font-semibold text-xs text-slate-500 mb-1.5">Trạng thái sản phẩm</label>
                        <select
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[13.5px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all cursor-pointer"
                          value={formProduct.status}
                          onChange={(e) => setFormProduct({ ...formProduct, status: e.target.value })}
                        >
                          <option value="active">Đang hoạt động</option>
                          <option value="inactive">Tạm ngưng</option>
                        </select>
                      </div>

                      <div className="col-span-1 md:col-span-4">
                        <label className="block font-semibold text-xs text-slate-500 mb-1.5">Mã Visa hệ thống (visaCode)</label>
                        <input
                          type="text"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[13.5px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all"
                          value={formProduct.visaCode || ""}
                          onChange={(e) => setFormProduct({ ...formProduct, visaCode: e.target.value })}
                          placeholder="Ví dụ: DE-STUDY-LANG-D41"
                        />
                      </div>
                      <div className="col-span-1 md:col-span-4">
                        <label className="block font-semibold text-xs text-slate-500 mb-1.5">Mã ngắn nội bộ (shortCode)</label>
                        <input
                          type="text"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[13.5px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all"
                          value={formProduct.shortCode || ""}
                          onChange={(e) => setFormProduct({ ...formProduct, shortCode: e.target.value })}
                          placeholder="Ví dụ: VIS-DE-01"
                        />
                      </div>
                      <div className="col-span-1 md:col-span-4">
                        <label className="block font-semibold text-xs text-slate-500 mb-1.5">Mục đích phân loại (purpose)</label>
                        <input
                          type="text"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[13.5px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all"
                          value={formProduct.purpose || ""}
                          onChange={(e) => setFormProduct({ ...formProduct, purpose: e.target.value })}
                          placeholder="Ví dụ: Du học nghề Đức"
                        />
                      </div>

                      <div className="md:col-span-12">
                        <label className="block font-semibold text-xs text-slate-500 mb-1.5">Ảnh đại diện sản phẩm</label>
                        <div className="flex items-stretch gap-0 rounded-xl overflow-hidden border border-slate-200 focus-within:ring-2 focus-within:ring-cyan-900/10 focus-within:border-cyan-900 transition-all">
                          <input
                            type="text"
                            className="flex-1 bg-slate-50 px-4 py-2.5 text-[13.5px] text-slate-700 placeholder-slate-400 focus:outline-none"
                            value={formProduct.image?.startsWith("data:") ? "" : (formProduct.image || "")}
                            onChange={(e) => setFormProduct({ ...formProduct, image: e.target.value })}
                            placeholder="https://example.com/image.jpg"
                            disabled={formProduct.image?.startsWith("data:")}
                          />
                          <label className="shrink-0 flex items-center gap-1.5 cursor-pointer bg-slate-100 hover:bg-slate-200 border-l border-slate-200 text-slate-600 text-xs font-semibold px-4 py-2.5 transition-colors whitespace-nowrap">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            Chọn file
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp,image/gif"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                if (file.size > 500 * 1024) {
                                  toast.warning("Ảnh quá lớn! Vui lòng chọn ảnh nhỏ hơn 500KB", "File quá lớn");
                                  e.target.value = "";
                                  return;
                                }
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                  setFormProduct(prev => ({ ...prev, image: ev.target.result }));
                                  toast.success("Đã chọn ảnh thành công!", "Upload ảnh");
                                };
                                reader.onerror = () => toast.error("Không thể đọc file", "Lỗi");
                                reader.readAsDataURL(file);
                                e.target.value = "";
                              }}
                            />
                          </label>
                        </div>

                        {formProduct.image && (
                          <div className="mt-2 relative inline-block">
                            <img
                              src={formProduct.image}
                              alt="preview"
                              className="h-20 rounded-xl border border-slate-200 object-cover"
                              onError={(e) => { e.target.style.display = "none"; }}
                            />
                            <button
                              type="button"
                              className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs transition-colors"
                              onClick={() => setFormProduct({ ...formProduct, image: "" })}
                            >×</button>
                          </div>
                        )}

                        {formProduct.image?.startsWith("data:") && (
                          <p className="text-[11px] text-slate-400 mt-1">Ảnh đã được chuyển sang Base64 — sẽ lưu cùng dữ liệu sản phẩm</p>
                        )}
                      </div>

                      <div className="md:col-span-12">
                        <label className="block font-semibold text-xs text-slate-500 mb-2">Bảng màu gradient banner</label>
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-slate-500 whitespace-nowrap">Màu bắt đầu</label>
                            <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-slate-200 cursor-pointer shadow-sm">
                              <input
                                type="color"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                value={formProduct.gradientFrom || "#0d2040"}
                                onChange={(e) => setFormProduct({ ...formProduct, gradientFrom: e.target.value })}
                              />
                              <div className="w-full h-full rounded-lg" style={{ background: formProduct.gradientFrom || "#0d2040" }} />
                            </div>
                            <input
                              type="text"
                              className="w-24 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[12px] text-slate-700 font-mono focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all"
                              value={formProduct.gradientFrom || "#0d2040"}
                              onChange={(e) => setFormProduct({ ...formProduct, gradientFrom: e.target.value })}
                              placeholder="#0d2040"
                            />
                          </div>

                          <svg className="w-4 h-4 text-slate-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>

                          <div className="flex items-center gap-2">
                            <label className="text-xs text-slate-500 whitespace-nowrap">Màu kết thúc</label>
                            <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-slate-200 cursor-pointer shadow-sm">
                              <input
                                type="color"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                value={formProduct.gradientTo || "#1a3a6b"}
                                onChange={(e) => setFormProduct({ ...formProduct, gradientTo: e.target.value })}
                              />
                              <div className="w-full h-full rounded-lg" style={{ background: formProduct.gradientTo || "#1a3a6b" }} />
                            </div>
                            <input
                              type="text"
                              className="w-24 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[12px] text-slate-700 font-mono focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all"
                              value={formProduct.gradientTo || "#1a3a6b"}
                              onChange={(e) => setFormProduct({ ...formProduct, gradientTo: e.target.value })}
                              placeholder="#1a3a6b"
                            />
                          </div>

                          <div
                            className="flex-1 min-w-[120px] h-9 rounded-lg border border-slate-200 shadow-sm"
                            style={{ background: `linear-gradient(135deg, ${formProduct.gradientFrom || "#0d2040"} 0%, ${formProduct.gradientTo || "#1a3a6b"} 100%)` }}
                          />

                          <button
                            type="button"
                            className="text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2 whitespace-nowrap"
                            onClick={() => setFormProduct({ ...formProduct, gradientFrom: "#0d2040", gradientTo: "#1a3a6b" })}
                          >
                            Đặt lại
                          </button>
                        </div>
                      </div>

                      <div className="md:col-span-12">
                        <label className="block font-semibold text-xs text-slate-500 mb-1.5">Link trang web sản phẩm</label>
                        <input
                          type="text"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[13.5px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all"
                          value={formProduct.websiteUrl}
                          onChange={(e) => setFormProduct({ ...formProduct, websiteUrl: e.target.value })}
                          placeholder="Ví dụ: https://htocean.edu.vn/du-hoc-he-singapore"
                        />
                        <span className="text-slate-450 block mt-1.5 text-[11px]">
                          Dán link WordPress/public landing page của sản phẩm để CTV mở xem khi cần.
                        </span>
                      </div>

                      <div className="md:col-span-12">
                        <label className="block font-semibold text-xs text-slate-500 mb-1.5">Mô tả tóm tắt chương trình</label>
                        <textarea
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[13.5px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all"
                          rows="3"
                          value={formProduct.description}
                          onChange={(e) => setFormProduct({ ...formProduct, description: e.target.value })}
                          placeholder="Nhập mô tả ngắn gọn giới thiệu chung về chương trình..."
                        />
                      </div>
                    </div>
                  )}

                  {/* TAB 2: CONSULTING CONTENT */}
                  {activeProductTab === "content" && (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      <div className="md:col-span-12">
                        <label className="block font-semibold text-xs text-slate-500 mb-1.5">Mô tả chi tiết chương trình</label>
                        <textarea
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[13.5px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all"
                          rows="4"
                          value={formProduct.detailDescription}
                          onChange={(e) => setFormProduct({ ...formProduct, detailDescription: e.target.value })}
                          placeholder="Nhập nội dung chi tiết lộ trình học tập, chỗ ở, thời gian biểu..."
                        />
                      </div>

                      <div className="md:col-span-12">
                        <label className="block font-semibold text-xs text-slate-500 mb-1.5">Đối tượng phù hợp tuyển sinh</label>
                        <input
                          type="text"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[13.5px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all"
                          value={formProduct.targetAudience}
                          onChange={(e) => setFormProduct({ ...formProduct, targetAudience: e.target.value })}
                          placeholder="Ví dụ: Học sinh từ 7 đến 17 tuổi..."
                        />
                      </div>

                      <div className="md:col-span-6">
                        <label className="block font-semibold text-xs text-slate-500 mb-1.5">Điểm nổi bật (Mỗi dòng một điểm nổi bật)</label>
                        <textarea
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[13.5px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all"
                          rows="4"
                          value={formProduct.highlightsText}
                          onChange={(e) => setFormProduct({ ...formProduct, highlightsText: e.target.value })}
                          placeholder="Ví dụ:&#10;Học 1 kèm 1 với giáo viên bản ngữ&#10;Hỗ trợ 24/7..."
                        />
                      </div>

                      <div className="md:col-span-6">
                        <label className="block font-semibold text-xs text-slate-500 mb-1.5">Các bước quy trình (Mỗi dòng một bước)</label>
                        <textarea
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[13.5px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all"
                          rows="4"
                          value={formProduct.processStepsText}
                          onChange={(e) => setFormProduct({ ...formProduct, processStepsText: e.target.value })}
                          placeholder="Ví dụ:&#10;Tư vấn chọn lịch trình&#10;Nộp phí ghi danh&#10;Phỏng vấn chọn trường..."
                        />
                      </div>

                      <div className="md:col-span-12">
                        <label className="block font-semibold text-xs text-slate-500 mb-1.5">Tags nhãn dán (Ngăn cách bởi dấu phẩy)</label>
                        <input
                          type="text"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[13.5px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all"
                          value={formProduct.tagsText}
                          onChange={(e) => setFormProduct({ ...formProduct, tagsText: e.target.value })}
                          placeholder="Chất lượng cao, Miễn học phí, Cơ hội PR"
                        />
                      </div>
                    </div>
                  )}

                  {/* TAB 3: DOCUMENTS */}
                  {activeProductTab === "docs" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 h-full flex flex-col justify-start gap-4">
                          <div>
                            <label className="block font-bold text-cyan-900 text-[14px] mb-2">
                              <i className="fa fa-file-invoice text-cyan-900 mr-2"></i>Tài liệu chính (Brochure)
                            </label>
                            <p className="text-slate-400 text-xs mb-3">Hỗ trợ PDF, hình ảnh hoặc link tài liệu</p>

                            <div
                              className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all duration-200 cursor-pointer ${isBrochureDragging
                                ? "border-cyan-600 bg-cyan-50/50"
                                : "border-slate-300 bg-white hover:bg-slate-55"
                                }`}
                              onDragOver={handleBrochureDragOver}
                              onDragLeave={handleBrochureDragLeave}
                              onDrop={handleBrochureDrop}
                            >
                              <input
                                type="file"
                                className="hidden"
                                id="prod-brochure-file"
                                accept="application/pdf,image/*"
                                onChange={handleProductBrochureUpload}
                              />
                              <label htmlFor="prod-brochure-file" style={{ cursor: "pointer" }} className="w-full m-0 block">
                                <i className="fa fa-cloud-arrow-up text-cyan-900 text-2xl mb-2 block"></i>
                                <span className="text-xs font-semibold text-cyan-900 block">
                                  {isBrochureDragging ? "Thả file để tải lên" : "Kéo thả Brochure hoặc bấm để chọn file"}
                                </span>
                                <span className="text-slate-400 block mt-1 text-[10px]">Hỗ trợ PDF, hình ảnh hoặc link tài liệu</span>
                              </label>
                            </div>

                            <div className="flex items-center my-4">
                              <hr className="grow border-slate-200 my-0" />
                              <span className="mx-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">hoặc</span>
                              <hr className="grow border-slate-200 my-0" />
                            </div>

                            <div>
                              <label className="block font-semibold text-xs text-slate-500 mb-1.5">Link Brochure</label>
                              <div className="flex rounded-xl overflow-hidden border border-slate-200 bg-white">
                                <input
                                  type="text"
                                  className="w-full px-3 py-1.5 text-xs text-slate-705 placeholder-slate-400 focus:outline-none"
                                  placeholder="Ví dụ: https://drive.google.com/..."
                                  value={brochureLinkInput}
                                  onChange={(e) => setBrochureLinkInput(e.target.value)}
                                />
                                <button
                                  type="button"
                                  className="bg-cyan-900 hover:bg-cyan-950 text-white text-xs font-semibold px-4 transition-colors"
                                  onClick={handleAddBrochureLink}
                                >
                                  Gắn link
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="mt-auto pt-3 border-t border-slate-100">
                            <label className="font-semibold text-slate-500 text-xs mb-2 block">Brochure hiện tại:</label>
                            {formProduct.brochure ? (
                              <div className="flex items-center justify-between p-2.5 border border-slate-100 rounded-xl bg-white shadow-sm">
                                <div className="text-truncate pr-3 flex items-center" style={{ minWidth: 0 }}>
                                  {formProduct.brochure.sourceType === "link" ? (
                                    <i className="fa fa-link text-cyan-900 mr-2 text-base shrink-0"></i>
                                  ) : formProduct.brochure.fileType === "IMAGE" ? (
                                    formProduct.brochure.url ? (
                                      <img
                                        src={formProduct.brochure.url}
                                        alt="preview"
                                        className="rounded border mr-2 w-8 h-8 object-cover shrink-0"
                                      />
                                    ) : (
                                      <i className="fa fa-file-image text-emerald-600 mr-2 text-base shrink-0"></i>
                                    )
                                  ) : (
                                    <i className="fa fa-file-pdf text-red-500 mr-2 text-base shrink-0"></i>
                                  )}
                                  <div className="text-truncate" style={{ minWidth: 0 }}>
                                    <span
                                      className="font-bold text-slate-800 text-xs block text-truncate"
                                      title={formProduct.brochure.name}
                                      style={{ maxWidth: "160px" }}
                                    >
                                      {formProduct.brochure.name}
                                    </span>
                                    <span className="text-slate-405 block text-[10px] text-truncate mt-0.5">
                                      {formProduct.brochure.sourceType === "link" ? (
                                        <span className="text-cyan-700 font-medium">Link đính kèm</span>
                                      ) : formProduct.brochure.fileType === "IMAGE" ? (
                                        <span>Ảnh tải lên ({formProduct.brochure.size})</span>
                                      ) : (
                                        <span>File tải lên ({formProduct.brochure.size})</span>
                                      )}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex gap-1.5 items-center shrink-0">
                                  {formProduct.brochure.sourceType === "link" && (
                                    <button
                                      type="button"
                                      className="bg-transparent hover:bg-slate-50 text-cyan-900 border border-slate-200 text-[11px] font-semibold px-2 py-1 rounded"
                                      onClick={() => handleOpenWebsite(formProduct.brochure.url)}
                                    >
                                      Mở link
                                    </button>
                                  )}
                                  {formProduct.brochure.fileType === "IMAGE" && formProduct.brochure.url && (
                                    <a
                                      href={formProduct.brochure.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="bg-transparent hover:bg-slate-50 text-cyan-900 border border-slate-200 text-[11px] font-semibold px-2 py-1 rounded text-decoration-none inline-block text-center leading-normal"
                                    >
                                      Xem ảnh
                                    </a>
                                  )}
                                  <button
                                    type="button"
                                    className="bg-transparent hover:bg-red-550 hover:text-white text-red-650 border border-red-200 text-[11px] font-semibold px-2 py-1 rounded"
                                    onClick={removeProductBrochure}
                                  >
                                    <i className="fa fa-trash-can"></i> Gỡ
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="text-slate-400 text-xs italic text-center py-3 border border-dashed border-slate-200 bg-white/50 rounded-xl">Chưa có Brochure</div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 h-full flex flex-col justify-between">
                          <div>
                            <label className="block font-bold text-sky-900 text-[14px] mb-2">
                              <i className="fa fa-folder-open text-sky-800 mr-2"></i>Tài liệu hướng dẫn tư vấn kèm theo
                            </label>
                            <p className="text-slate-400 text-xs mb-3">Tải lên file hoặc gắn link tài liệu tư vấn nội bộ.</p>

                            <div
                              className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all duration-200 cursor-pointer ${isDocsDragging
                                ? "border-sky-500 bg-sky-50/50"
                                : "border-slate-300 bg-white hover:bg-slate-50"
                                }`}
                              onDragOver={handleDocsDragOver}
                              onDragLeave={handleDocsDragLeave}
                              onDrop={handleDocsDrop}
                            >
                              <input
                                type="file"
                                multiple
                                className="hidden"
                                id="prod-docs-file"
                                onChange={handleProductDocsUpload}
                              />
                              <label htmlFor="prod-docs-file" style={{ cursor: "pointer" }} className="w-full m-0 block">
                                <i className="fa fa-cloud-arrow-up text-sky-800 text-2xl mb-2 block"></i>
                                <span className="text-xs font-semibold text-sky-800 block">
                                  {isDocsDragging ? "Thả file để tải lên" : "Kéo thả tài liệu hoặc bấm để chọn file"}
                                </span>
                                <span className="text-slate-400 block mt-1 text-[10px]">Hỗ trợ PDF, DOCX, XLSX hoặc link tài liệu</span>
                              </label>
                            </div>

                            <div className="flex items-center my-4">
                              <hr className="grow border-slate-200 my-0" />
                              <span className="mx-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">hoặc</span>
                              <hr className="grow border-slate-200 my-0" />
                            </div>

                            <div className="p-3 border border-slate-150 rounded-xl bg-white shadow-sm mb-3 space-y-2">
                              <span className="font-semibold text-slate-500 text-xs block mb-1">Gắn link tài liệu mới</span>
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none"
                                  placeholder="Tên tài liệu..."
                                  value={docLinkNameInput}
                                  onChange={(e) => setDocLinkNameInput(e.target.value)}
                                />
                                <input
                                  type="text"
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none"
                                  placeholder="Link tài liệu (ví dụ: drive.google.com/...)"
                                  value={docLinkUrlInput}
                                  onChange={(e) => setDocLinkUrlInput(e.target.value)}
                                />
                                <div className="flex gap-2">
                                  <select
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none cursor-pointer"
                                    value={docLinkTypeInput}
                                    onChange={(e) => setDocLinkTypeInput(e.target.value)}
                                  >
                                    <option value="Checklist">Checklist</option>
                                    <option value="Bảng phí">Bảng phí</option>
                                    <option value="Quy trình tư vấn">Quy trình tư vấn</option>
                                    <option value="FAQ">FAQ</option>
                                    <option value="Mẫu form khách hàng">Mẫu form khách hàng</option>
                                    <option value="Khác">Khác</option>
                                  </select>
                                  <button
                                    type="button"
                                    className="bg-sky-800 hover:bg-sky-900 text-white text-xs font-semibold px-4 rounded-lg transition-colors shrink-0"
                                    onClick={handleAddDocLink}
                                  >
                                    Thêm link
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="mt-3">
                            <span className="fw-semibold text-slate-500 text-xs block mb-2">Các tài liệu tư vấn đính kèm:</span>
                            {formProduct.documents && formProduct.documents.length > 0 ? (
                              <div className="flex flex-col gap-2 max-h-[150px] overflow-y-auto pr-1">
                                {formProduct.documents.map((doc) => (
                                  <div key={doc.id} className="flex items-center justify-between p-2.5 border border-slate-100 rounded-xl bg-white shadow-sm">
                                    <div className="text-truncate pr-3 flex items-center" style={{ minWidth: 0 }}>
                                      {doc.sourceType === "link" ? (
                                        <i className="fa fa-link text-sky-850 mr-2 text-base shrink-0"></i>
                                      ) : (
                                        <i className={`fa ${doc.type === "PDF" ? "fa-file-pdf text-red-500" : (doc.type === "XLSX" ? "fa-file-excel text-emerald-650" : "fa-file-word text-primary")} mr-2 text-base shrink-0`}></i>
                                      )}
                                      <div className="text-truncate" style={{ minWidth: 0 }}>
                                        <span className="font-bold text-slate-800 text-xs block text-truncate" title={doc.name}>
                                          {doc.name}
                                        </span>
                                        <span className="text-slate-400 block text-[10px] mt-0.5">
                                          {doc.sourceType === "link" ? (
                                            <span className="text-sky-700 font-semibold">{doc.type} (Link)</span>
                                          ) : (
                                            <span>File ({doc.size})</span>
                                          )}
                                        </span>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      className="bg-transparent hover:bg-red-50 text-red-600 border border-red-200 text-xs font-semibold py-1 px-3 rounded-lg transition-colors shrink-0"
                                      onClick={() => deleteProductDoc(doc.id)}
                                    >
                                      Xóa
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-slate-400 text-xs italic text-center py-3 border border-dashed border-slate-200 bg-white/50 rounded-xl">Chưa có tài liệu đính kèm</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 p-4 border-t border-slate-100 flex gap-3 justify-end">
                  <button type="button" className="bg-transparent hover:bg-slate-150 text-slate-650 border border-slate-250 text-xs font-semibold py-2 px-4 rounded-xl transition-colors" onClick={() => setEditingProduct(null)}>
                    Hủy bỏ
                  </button>
                  <button type="submit" className="bg-cyan-900 hover:bg-cyan-950 text-white text-xs font-semibold py-2 px-5 rounded-xl transition-colors">
                    Lưu thay đổi
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: FORM QUAN TÂM SẢN PHẨM */}
        {showInterestModal && selectedProduct && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-6 z-1050 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-[550px] flex flex-col animate-slide-up" style={{ maxHeight: "90vh", overflow: "hidden" }}>
              <div className="bg-slate-50 border-b border-slate-100 px-5 py-4 flex justify-between items-center">
                <h5 className="font-bold text-slate-800 text-base m-0 flex items-center gap-2">
                  <i className="fa fa-envelope-open-text text-red-500"></i> Đăng ký khách hàng quan tâm
                </h5>
                <button className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 w-8 h-8 rounded-lg flex items-center justify-center transition-colors" onClick={handleCloseInterestModal}>
                  <i className="fa fa-times"></i>
                </button>
              </div>

              <form id="interestForm" onSubmit={handleSubmitInterest} className="flex-1 min-h-0 overflow-y-auto">
                <div className="p-5 text-[13.5px]">
                  <div className="mb-3">
                    <label className="block font-semibold text-xs text-slate-500 mb-1.5">Sản phẩm quan tâm</label>
                    <input
                      type="text"
                      className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2 text-[13.5px] text-slate-600 focus:outline-none"
                      value={selectedProduct.name}
                      readOnly
                    />
                  </div>

                  <div className="mb-3">
                    <label className="block font-semibold text-xs text-slate-500 mb-1.5">Họ tên khách hàng <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      className={`w-full bg-slate-50 border rounded-xl px-4 py-2 text-[13.5px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all disabled:opacity-50 ${
                        interestInvalidFields.includes("customerName") ? "border-red-500 focus:ring-red-500/10 focus:border-red-500" : "border-slate-200"
                      }`}
                      placeholder="Ví dụ: Nguyễn Văn A"
                      value={interestForm.customerName}
                      onChange={(e) => {
                        setInterestForm({ ...interestForm, customerName: e.target.value });
                        if (interestInvalidFields.includes("customerName")) {
                          setInterestInvalidFields(prev => prev.filter(f => f !== "customerName"));
                        }
                      }}
                      required
                      disabled={isSubmittingInterest}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block font-semibold text-xs text-slate-500 mb-1.5">Số điện thoại <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        className={`w-full bg-slate-50 border rounded-xl px-4 py-2 text-[13.5px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all disabled:opacity-50 ${
                          interestInvalidFields.includes("phone") ? "border-red-500 focus:ring-red-500/10 focus:border-red-500" : "border-slate-200"
                        }`}
                        placeholder="Ví dụ: 0987654321"
                        value={interestForm.phone}
                        onChange={(e) => {
                          setInterestForm({ ...interestForm, phone: e.target.value });
                          if (interestInvalidFields.includes("phone")) {
                            setInterestInvalidFields(prev => prev.filter(f => f !== "phone"));
                          }
                        }}
                        required
                        disabled={isSubmittingInterest}
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-xs text-slate-500 mb-1.5">Email (nếu có)</label>
                      <input
                        type="email"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[13.5px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all disabled:opacity-50"
                        placeholder="customer@email.com"
                        value={interestForm.email}
                        onChange={(e) => setInterestForm({ ...interestForm, email: e.target.value })}
                        disabled={isSubmittingInterest}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block font-semibold text-xs text-slate-500 mb-1.5">Người phụ trách / CTV giới thiệu</label>
                      <input
                        type="text"
                        className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2 text-[13.5px] text-slate-600 focus:outline-none"
                        value={currentUserName}
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-xs text-slate-500 mb-1.5">Kênh nguồn tuyển sinh</label>
                      <select
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[13.5px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all cursor-pointer disabled:opacity-50"
                        value={interestForm.sourceChannel}
                        onChange={(e) => setInterestForm({ ...interestForm, sourceChannel: e.target.value })}
                        disabled={isSubmittingInterest}
                      >
                        <option value="CTV/Đại lý">CTV / Đại lý</option>
                        <option value="Nhân viên tư vấn">Nhân viên tư vấn</option>
                        <option value="Website">Website</option>
                        <option value="Facebook">Facebook</option>
                        <option value="Zalo">Zalo</option>
                        <option value="Sự kiện">Sự kiện hội thảo</option>
                        <option value="Khác">Khác</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="block font-semibold text-xs text-slate-500 mb-1.5">Ảnh thẻ CCCD / Hộ chiếu khách hàng (Mặt trước & Mặt sau) <span className="text-red-500">*</span></label>
                    <div className="grid grid-cols-2 gap-3">
                      {/* Mặt trước */}
                      <div className="flex flex-col gap-1">
                        <div
                          className={`relative h-24 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden bg-slate-50 ${
                            interestInvalidFields.includes("cccdFront") ? "border-red-500" : "border-slate-200 hover:border-cyan-900/45"
                          }`}
                          onClick={() => document.getElementById("interest-cccd-front-input").click()}
                        >
                          {interestCccdFrontPreview ? (
                            <>
                              <img src={interestCccdFrontPreview} alt="Mặt trước" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/45 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (interestCccdFrontPreview) URL.revokeObjectURL(interestCccdFrontPreview);
                                    setInterestCccdFrontFile(null);
                                    setInterestCccdFrontPreview("");
                                  }}
                                  className="bg-red-600 hover:bg-red-700 text-white rounded-full p-1.5 text-xs transition-colors shadow-md border-0 cursor-pointer flex items-center justify-center w-7 h-7"
                                >
                                  <i className="fa fa-trash"></i>
                                </button>
                              </div>
                              <span className="absolute bottom-1.5 left-1.5 bg-emerald-500/90 text-white px-1.5 py-0.5 rounded text-[8px] font-bold shadow-sm">
                                ✓ Đã chọn
                              </span>
                            </>
                          ) : (
                            <div className="flex flex-col items-center gap-1 text-center px-2">
                              <i className="fa fa-cloud-arrow-up text-slate-400 text-base"></i>
                              <div>
                                <div className="text-xs font-semibold text-slate-600">Mặt trước CCCD</div>
                                <div className="text-[9px] text-slate-400">Nhấp để tải lên</div>
                              </div>
                            </div>
                          )}
                        </div>
                        <input
                          type="file"
                          id="interest-cccd-front-input"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (interestCccdFrontPreview) URL.revokeObjectURL(interestCccdFrontPreview);
                              setInterestCccdFrontFile(file);
                              setInterestCccdFrontPreview(URL.createObjectURL(file));
                              setInterestInvalidFields(prev => prev.filter(f => f !== "cccdFront"));
                            }
                          }}
                        />
                      </div>

                      {/* Mặt sau */}
                      <div className="flex flex-col gap-1">
                        <div
                          className={`relative h-24 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden bg-slate-50 ${
                            interestInvalidFields.includes("cccdBack") ? "border-red-500" : "border-slate-200 hover:border-cyan-900/45"
                          }`}
                          onClick={() => document.getElementById("interest-cccd-back-input").click()}
                        >
                          {interestCccdBackPreview ? (
                            <>
                              <img src={interestCccdBackPreview} alt="Mặt sau" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/45 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (interestCccdBackPreview) URL.revokeObjectURL(interestCccdBackPreview);
                                    setInterestCccdBackFile(null);
                                    setInterestCccdBackPreview("");
                                  }}
                                  className="bg-red-600 hover:bg-red-700 text-white rounded-full p-1.5 text-xs transition-colors shadow-md border-0 cursor-pointer flex items-center justify-center w-7 h-7"
                                >
                                  <i className="fa fa-trash"></i>
                                </button>
                              </div>
                              <span className="absolute bottom-1.5 left-1.5 bg-emerald-500/90 text-white px-1.5 py-0.5 rounded text-[8px] font-bold shadow-sm">
                                ✓ Đã chọn
                              </span>
                            </>
                          ) : (
                            <div className="flex flex-col items-center gap-1 text-center px-2">
                              <i className="fa fa-cloud-arrow-up text-slate-400 text-base"></i>
                              <div>
                                <div className="text-xs font-semibold text-slate-600">Mặt sau CCCD</div>
                                <div className="text-[9px] text-slate-400">Nhấp để tải lên</div>
                              </div>
                            </div>
                          )}
                        </div>
                        <input
                          type="file"
                          id="interest-cccd-back-input"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (interestCccdBackPreview) URL.revokeObjectURL(interestCccdBackPreview);
                              setInterestCccdBackFile(file);
                              setInterestCccdBackPreview(URL.createObjectURL(file));
                              setInterestInvalidFields(prev => prev.filter(f => f !== "cccdBack"));
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-2">
                    <label className="block font-semibold text-xs text-slate-500 mb-1.5">Nhu cầu cụ thể / Ghi chú</label>
                    <textarea
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[13.5px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all disabled:opacity-50"
                      rows="2"
                      placeholder="Nhập yêu cầu đặc biệt của khách hàng hoặc khu giờ liên hệ phù hợp..."
                      value={interestForm.note}
                      onChange={(e) => setInterestForm({ ...interestForm, note: e.target.value })}
                      disabled={isSubmittingInterest}
                    />
                  </div>
                </div>
              </form>

              <div className="bg-slate-50 p-4 border-t border-slate-100 flex gap-3 justify-end shrink-0">
                <button
                  type="button"
                  className="mr-auto bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold py-2 px-4 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
                  onClick={() => setShowContractPreview(true)}
                >
                  <i className="fa fa-file-signature text-blue-600 text-sm"></i>
                  Xem hợp đồng mẫu
                </button>
                <button type="button" className="bg-transparent hover:bg-slate-150 text-slate-650 border border-slate-250 text-xs font-semibold py-2 px-4 rounded-xl transition-colors disabled:opacity-50" onClick={handleCloseInterestModal} disabled={isSubmittingInterest}>
                  Hủy bỏ
                </button>
                <button type="submit" form="interestForm" className="bg-cyan-900 hover:bg-cyan-950 text-white text-xs font-semibold py-2 px-5 rounded-xl transition-colors disabled:opacity-50" disabled={isSubmittingInterest}>
                  {isSubmittingInterest ? "Đang gửi..." : "Gửi liên hệ tư vấn"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: XEM TRƯỚC HỢP ĐỒNG MẪU */}
        {showContractPreview && selectedProduct && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-[6px] flex items-center justify-center p-4 md:p-6 z-1100 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[850px] flex flex-col animate-slide-up overflow-hidden" style={{ maxHeight: "95vh" }}>
              <div className="bg-slate-50 border-b border-slate-100 px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
                <div>
                  <h5 className="font-bold text-slate-800 text-base m-0 flex items-center gap-2">
                    <i className="fa fa-file-contract text-blue-600"></i> Xem trước Hợp đồng & Phụ lục
                  </h5>
                  <p className="text-[11px] text-slate-405 m-0 mt-0.5">Dữ liệu được điền tự động từ form đăng ký quan tâm</p>
                </div>
                
                <div className="flex items-center bg-slate-200/65 rounded-lg p-0.5 self-start md:self-auto">
                  <button
                    type="button"
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${contractType === "main" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                    onClick={() => setContractType("main")}
                  >
                    Hợp đồng chính
                  </button>
                  <button
                    type="button"
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${contractType === "appendix" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                    onClick={() => setContractType("appendix")}
                  >
                    Phụ lục hợp đồng
                  </button>
                </div>
              </div>

              {/* Scrollable A4 Container */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-150/40 select-text">
                <style>{`
                  @media print {
                    body * {
                      visibility: hidden;
                    }
                    #contract-print-area, #contract-print-area * {
                      visibility: visible;
                    }
                    #contract-print-area {
                      position: absolute;
                      left: 0;
                      top: 0;
                      width: 100%;
                      padding: 0;
                      margin: 0;
                      box-shadow: none !important;
                      border: none !important;
                    }
                  }
                `}</style>

                {contractType === "main" ? (
                  <div id="contract-print-area" className="bg-white shadow-lg mx-auto max-w-[794px] p-[30px] sm:p-[50px] border border-slate-200 text-slate-800 font-sans leading-relaxed text-[13px] relative rounded-lg">
                    {/* Header Block like Image 2 */}
                    <div className="flex items-center gap-4 border-b-2 border-sky-400 pb-3 mb-6">
                      <img src="/assets/images/logo-HTO.png" alt="HT Ocean Group" className="h-16 w-auto object-contain shrink-0" />
                      <div className="flex-1 text-slate-800 text-[11px] leading-tight text-left">
                        <div className="font-extrabold text-[#0066b2] text-[13px] uppercase">
                          CÔNG TY CỔ PHẦN TƯ VẤN GIÁO DỤC & ĐỊNH CƯ HT ĐẠI DƯƠNG
                        </div>
                        <div className="font-bold text-slate-600 text-[9.5px] uppercase mt-0.5">
                          HT OCEAN EDUCATION & IMMIGRATION CONSULTANCY JOINT STOCK COMPANY
                        </div>
                        <div className="mt-1 text-slate-500">
                          Tầng 1, Toà nhà số 284/41/2 Lý Thường Kiệt, Phường Diên Hồng, TP. HCM
                        </div>
                        <div className="text-slate-500">
                          0334.585.198 - 0866.934.579 <span className="text-sky-400 mx-1">|</span> administrator@htogroup.com.vn <span className="text-sky-400 mx-1">|</span> www.htogroup.com.vn
                        </div>
                      </div>
                    </div>

                    {/* National Motto and Company Reference */}
                    <div className="grid grid-cols-2 gap-4 text-center text-[12px] mb-6">
                      <div className="flex flex-col items-center">
                        <div className="font-bold uppercase text-slate-900 leading-tight">
                          CÔNG TY CỔ PHẦN TƯ VẤN GIÁO DỤC &<br />ĐỊNH CƯ HT ĐẠI DƯƠNG
                        </div>
                        <div className="text-slate-400 text-[10px] my-0.5">---</div>
                        <div className="font-bold text-slate-800">
                          Số: {Date.now().toString().slice(-6)}/DHDE
                        </div>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="font-bold uppercase text-slate-900 leading-tight">
                          CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                        </div>
                        <div className="font-bold text-slate-800 mt-1">
                          Độc lập - Tự do - Hạnh phúc
                        </div>
                        <div className="text-slate-400 text-[10px] my-0.5">---</div>
                      </div>
                    </div>

                    <div className="text-center font-bold text-[16px] mt-8 mb-4 text-slate-900">
                      HỢP ĐỒNG TƯ VẤN DU HỌC
                    </div>

                    <div className="space-y-3">
                      <p className="italic text-slate-600">- Căn cứ Bộ luật Dân sự số 91/2015/QH13 ban hành ngày 24/11/2015;</p>
                      <p className="italic text-slate-600">- Căn cứ nhu cầu và năng lực thực tế của hai Bên.</p>

                      <p className="mt-4">Hôm nay, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}, tại văn phòng Công ty, chúng tôi gồm:</p>

                      {/* BÊN A */}
                      <div className="mt-4">
                        <div className="font-bold text-[12.5px] border-b border-slate-200 pb-1 mb-2 text-slate-900">
                          BÊN A: ĐƠN VỊ TƯ VẤN (HT OCEAN GROUP)
                        </div>
                        <table className="w-full text-left table-fixed text-[13px]">
                          <tbody>
                            <tr>
                              <td className="w-1/3 py-1 font-bold">Tên đơn vị:</td>
                              <td className="w-2/3 py-1 font-semibold">CÔNG TY CỔ PHẦN TƯ VẤN GIÁO DỤC & ĐỊNH CƯ HT ĐẠI DƯƠNG</td>
                            </tr>
                            <tr>
                              <td className="py-1 font-bold">Địa chỉ:</td>
                              <td className="py-1">Tầng 1, Toà nhà số 284/41/2 Lý Thường Kiệt, Phường Diên Hồng, TP. HCM</td>
                            </tr>
                            <tr>
                              <td className="py-1 font-bold">Người đại diện:</td>
                              <td className="py-1 font-bold text-cyan-950 bg-slate-50 px-2 rounded">VŨ ĐỨC HÙNG</td>
                            </tr>
                            <tr>
                              <td className="py-1 font-bold">Chức vụ:</td>
                              <td className="py-1">Giám đốc điều hành</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* BÊN B */}
                      <div className="mt-4">
                        <div className="font-bold text-[12.5px] border-b border-slate-200 pb-1 mb-2 text-slate-900">
                          BÊN B: BÊN ĐƯỢC TƯ VẤN (KHÁCH HÀNG / HỌC VIÊN)
                        </div>
                        <table className="w-full text-left table-fixed text-[13px]">
                          <tbody>
                            <tr>
                              <td className="w-1/3 py-1 font-bold">Họ và tên:</td>
                              <td className="w-2/3 py-1 text-cyan-950 font-bold bg-yellow-100/50 px-2 rounded">{cleanVietnameseText(interestForm.customerName) || "...................................................."}</td>
                            </tr>
                            <tr>
                              <td className="py-1 font-bold">Số điện thoại:</td>
                              <td className="py-1 text-cyan-950 font-bold bg-slate-50 px-2 rounded">{cleanVietnameseText(interestForm.phone) || "...................................................."}</td>
                            </tr>
                            <tr>
                              <td className="py-1 font-bold">Email:</td>
                              <td className="py-1 text-cyan-950 bg-slate-50 px-2 rounded">{cleanVietnameseText(interestForm.email) || "...................................................."}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <div className="font-bold text-[12.5px] mt-6 mb-2 text-slate-900">ĐIỀU 1: NỘI DUNG DỊCH VỤ & PHẠM VI CÔNG VIỆC</div>
                      <p>1. Bên B tự nguyện đăng ký và Bên A nhận cung cấp dịch vụ tư vấn, làm thủ tục du học cho Bên B đối với:</p>
                      <ul className="list-disc pl-5 space-y-1 mt-2">
                        <li><strong>Chương trình du học:</strong> <span className="text-cyan-950 font-bold bg-yellow-100/50 px-1 rounded">{cleanVietnameseText(selectedProduct.name)}</span></li>
                        <li><strong>Quốc gia học tập:</strong> <span className="text-cyan-950 font-bold bg-slate-50 px-1 rounded">{cleanVietnameseText(resolveCountryName(selectedProduct.country))}</span></li>
                        {selectedProduct.visaCode && <li><strong>Mã Visa hệ thống (visaCode):</strong> <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-[11.5px]">{selectedProduct.visaCode}</span></li>}
                      </ul>
                      <p className="mt-2">2. Bên A chịu trách nhiệm hướng dẫn Bên B chuẩn bị hồ sơ cá nhân đầy đủ và hợp lệ, liên hệ các trường đối tác nước ngoài để xin thư mời học, hướng dẫn thủ tục xin Visa, tổ chức đào tạo định hướng hành trang trước khi xuất cảnh.</p>

                      <div className="font-bold text-[12.5px] mt-6 mb-2 text-slate-900">ĐIỀU 2: PHÍ DỊCH VỤ VÀ PHƯƠNG THỨC THANH TOÁN</div>
                      <p>1. Phí dịch vụ tư vấn du học trọn gói đối với chương trình này là: <strong>{selectedProduct.serviceFee ? selectedProduct.serviceFee.toLocaleString("vi-VN") : "0"} {selectedProduct.currency || "VND"}</strong></p>
                      <p>2. Bằng chữ: <em className="text-cyan-950 font-bold bg-yellow-100/50 px-2 py-0.5 rounded block mt-1">{cleanVietnameseText(numberToVietnameseWords(selectedProduct.serviceFee))}</em></p>
                      <p>3. Chi phí trên chưa bao gồm các khoản lệ phí đóng trực tiếp cho Đại sứ quán, vé máy bay, bảo hiểm hoặc học phí đóng trực tiếp cho nhà trường tại nước sở tại (nếu có).</p>

                      <div className="font-bold text-[12.5px] mt-6 mb-2 text-slate-900">ĐIỀU 3: CAM KẾT VÀ HIỆU LỰC</div>
                      <p>1. Bên B cam kết cung cấp toàn bộ thông tin cá nhân, bằng cấp, học bạ và hình ảnh thẻ CCCD/Hộ chiếu trung thực và chính xác. Mọi sai sót dẫn đến việc từ chối hồ sơ Bên B hoàn toàn chịu trách nhiệm.</p>
                      <p>2. Bên A cam kết thực hiện đúng tiến độ xử lý hồ sơ theo quy định của chương trình. Hợp đồng có hiệu lực kể từ ngày ký và tự động thanh lý khi Bên B hoàn thành thủ tục nhập học.</p>

                      {/* SIGNATURE SECTION */}
                      <div className="grid grid-cols-2 gap-8 text-center mt-12 pt-6 border-t border-dashed border-slate-200">
                        <div>
                          <div className="font-bold text-slate-900 uppercase">BÊN B</div>
                          <div className="font-bold text-slate-900">Khách hàng</div>
                          <div className="text-slate-400 italic text-[11px] mt-0.5">(Ký và ghi rõ họ tên)</div>
                          <div className="h-20"></div>
                          <div className="font-bold text-cyan-950">{cleanVietnameseText(interestForm.customerName) || "...................................................."}</div>
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 uppercase">BÊN A</div>
                          <div className="font-bold text-slate-900">Giám đốc điều hành</div>
                          <div className="text-slate-400 italic text-[11px] mt-0.5">(Ký và ghi rõ họ tên)</div>
                          <div className="h-20"></div>
                          <div className="font-bold text-cyan-950">VŨ ĐỨC HÙNG</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div id="contract-print-area" className="bg-white shadow-lg mx-auto max-w-[794px] p-[30px] sm:p-[50px] border border-slate-200 text-slate-800 font-sans leading-relaxed text-[13px] relative rounded-lg">
                    {/* Header Block like Image 2 */}
                    <div className="flex items-center gap-4 border-b-2 border-sky-400 pb-3 mb-6">
                      <img src="/assets/images/logo-HTO.png" alt="HT Ocean Group" className="h-16 w-auto object-contain shrink-0" />
                      <div className="flex-1 text-slate-800 text-[11px] leading-tight text-left">
                        <div className="font-extrabold text-[#0066b2] text-[13px] uppercase">
                          CÔNG TY CỔ PHẦN TƯ VẤN GIÁO DỤC & ĐỊNH CƯ HT ĐẠI DƯƠNG
                        </div>
                        <div className="font-bold text-slate-600 text-[9.5px] uppercase mt-0.5">
                          HT OCEAN EDUCATION & IMMIGRATION CONSULTANCY JOINT STOCK COMPANY
                        </div>
                        <div className="mt-1 text-slate-500">
                          Tầng 1, Toà nhà số 284/41/2 Lý Thường Kiệt, Phường Diên Hồng, TP. HCM
                        </div>
                        <div className="text-slate-500">
                          0334.585.198 - 0866.934.579 <span className="text-sky-400 mx-1">|</span> administrator@htogroup.com.vn <span className="text-sky-400 mx-1">|</span> www.htogroup.com.vn
                        </div>
                      </div>
                    </div>

                    {/* National Motto and Company Reference */}
                    <div className="grid grid-cols-2 gap-4 text-center text-[12px] mb-6">
                      <div className="flex flex-col items-center">
                        <div className="font-bold uppercase text-slate-900 leading-tight">
                          CÔNG TY CỔ PHẦN TƯ VẤN GIÁO DỤC &<br />ĐỊNH CƯ HT ĐẠI DƯƠNG
                        </div>
                        <div className="text-slate-400 text-[10px] my-0.5">---</div>
                        <div className="font-bold text-slate-800">
                          Số: {Date.now().toString().slice(-6)}/DHDE
                        </div>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="font-bold uppercase text-slate-900 leading-tight">
                          CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                        </div>
                        <div className="font-bold text-slate-800 mt-1">
                          Độc lập - Tự do - Hạnh phúc
                        </div>
                        <div className="text-slate-400 text-[10px] my-0.5">---</div>
                      </div>
                    </div>

                    <div className="text-center font-bold text-[16px] mt-8 mb-4 text-slate-900">
                      PHỤ LỤC HỢP ĐỒNG TƯ VẤN DU HỌC
                    </div>
                    <div className="text-center font-bold text-[12px] italic -mt-2 mb-6 text-slate-500">
                      (Kèm theo Hợp đồng tư vấn du học ký ngày {new Date().getDate()}/{new Date().getMonth() + 1}/{new Date().getFullYear()})
                    </div>

                    <div className="space-y-3">
                      <p>Căn cứ Hợp đồng dịch vụ tư vấn du học số {Date.now().toString().slice(-6)}/HĐTVDH-HTO giữa các Bên, hai Bên thống nhất ký kết Phụ lục này với các nội dung chi tiết sau:</p>

                      {/* PHẦN I */}
                      <div className="mt-4">
                        <div className="font-bold text-[12.5px] border-b border-slate-200 pb-1 mb-2 text-slate-900">
                          I. THÔNG TIN CHI TIẾT CHƯƠNG TRÌNH & HỌC VIÊN
                        </div>
                        <table className="w-full text-left table-fixed text-[13px]">
                          <tbody>
                            <tr>
                              <td className="w-1/3 py-1 font-bold">Họ tên học viên (Bên B):</td>
                              <td className="w-2/3 py-1 text-cyan-950 font-bold bg-yellow-100/50 px-2 rounded">{cleanVietnameseText(interestForm.customerName) || "...................................................."}</td>
                            </tr>
                            <tr>
                              <td className="py-1 font-bold">Chương trình tuyển sinh:</td>
                              <td className="py-1 text-cyan-950 font-bold bg-slate-50 px-2 rounded">{cleanVietnameseText(selectedProduct.name)}</td>
                            </tr>
                            <tr>
                              <td className="py-1 font-bold">Quốc gia đích đến:</td>
                              <td className="py-1 text-cyan-950 font-bold bg-slate-50 px-2 rounded">{cleanVietnameseText(resolveCountryName(selectedProduct.country))}</td>
                            </tr>
                            <tr>
                              <td className="py-1 font-bold">Mã ngắn nội bộ (shortCode):</td>
                              <td className="py-1 font-mono bg-slate-100 px-2 rounded text-[12px]">{selectedProduct.shortCode || "Chưa thiết lập"}</td>
                            </tr>
                            <tr>
                              <td className="py-1 font-bold">Mã Visa diện tuyển sinh:</td>
                              <td className="py-1 font-mono bg-slate-100 px-2 rounded text-[12px]">{selectedProduct.visaCode || "Chưa thiết lập"}</td>
                            </tr>
                            <tr>
                              <td className="py-1 font-bold">Mục đích phân loại (purpose):</td>
                              <td className="py-1 bg-slate-50 px-2 rounded">{selectedProduct.purpose || "Chưa thiết lập"}</td>
                            </tr>
                          </tbody>
                        </table>

                        {/* Referral Information Table matching the user's screenshot */}
                        <div className="font-bold text-[12.5px] border-b border-slate-200 pb-1 mb-2 mt-4 text-slate-900">
                          THÔNG TIN NGƯỜI GIỚI THIỆU
                        </div>
                        <table className="w-full border border-collapse border-slate-300 text-center my-2 text-[12px] table-fixed">
                          <thead>
                            <tr className="bg-slate-50 text-slate-700">
                              <th className="border border-slate-300 p-2 font-bold w-5/12">Option 1: Tên nhân viên giới thiệu</th>
                              <th className="border border-slate-300 p-2 font-bold w-5/12">Option 2: Tên khách giới thiệu</th>
                              <th className="border border-slate-300 p-2 font-bold w-2/12">Số điện thoại</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border border-slate-300 p-2 text-cyan-950 font-medium">
                                {["admin", "bangiamdoc", "truongbophan", "nhansu"].includes(userRole) 
                                  ? cleanVietnameseText(currentUserName) 
                                  : "—"}
                              </td>
                              <td className="border border-slate-300 p-2 text-cyan-950 font-medium">
                                {!["admin", "bangiamdoc", "truongbophan", "nhansu"].includes(userRole) 
                                  ? cleanVietnameseText(currentUserName) 
                                  : "—"}
                              </td>
                              <td className="border border-slate-300 p-2 text-cyan-950 font-medium">
                                {currentUser?.phone || "—"}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* PHẦN II */}
                      <div className="mt-4">
                        <div className="font-bold text-[12.5px] border-b border-slate-200 pb-1 mb-2 text-slate-900">
                          II. BIỂU PHÍ & LỘ TRÌNH THANH TOÁN
                        </div>
                        <table className="w-full border border-collapse border-slate-350 text-center my-3 text-[13px]">
                          <thead>
                            <tr className="bg-slate-50">
                              <th className="border border-slate-300 p-2 font-bold w-1/12">STT</th>
                              <th className="border border-slate-300 p-2 font-bold w-6/12">Khoản mục chi phí</th>
                              <th className="border border-slate-300 p-2 font-bold w-5/12">Số tiền</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border border-slate-300 p-2">1</td>
                              <td className="border border-slate-300 p-2 text-left">Phí dịch vụ tư vấn (HT Ocean Group)</td>
                              <td className="border border-slate-300 p-2 text-right font-bold text-cyan-950">
                                {selectedProduct.serviceFee ? selectedProduct.serviceFee.toLocaleString("vi-VN") : "0"} {selectedProduct.currency || "VND"}
                              </td>
                            </tr>
                            <tr className="bg-slate-50 font-bold">
                              <td className="border border-slate-300 p-2" colSpan="2">Tổng chi phí dịch vụ:</td>
                              <td className="border border-slate-300 p-2 text-right text-cyan-950">
                                {selectedProduct.serviceFee ? selectedProduct.serviceFee.toLocaleString("vi-VN") : "0"} {selectedProduct.currency || "VND"}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        <p className="italic">Bằng chữ: <strong className="text-cyan-950 bg-yellow-100/50 px-2 py-0.5 rounded">{cleanVietnameseText(numberToVietnameseWords(selectedProduct.serviceFee))}</strong></p>
                      </div>

                      {/* PHẦN III */}
                      <div className="mt-4">
                        <div className="font-bold text-[12.5px] border-b border-slate-200 pb-1 mb-2 text-slate-900">
                          III. LỘ TRÌNH XỬ LÝ HỒ SƠ & THỦ TỤC
                        </div>
                        <ol className="list-decimal pl-5 space-y-2 mt-2">
                          <li><strong>Giai đoạn 1:</strong> Tiếp nhận thông tin học viên, đối soát thông tin cá nhân và thẩm định học bạ/CCCD. Tổ chức ký Hợp đồng tư vấn du học.</li>
                          <li><strong>Giai đoạn 2:</strong> Dịch thuật hồ sơ công chứng, nộp hồ sơ xin Thư mời học (Admission Letter) từ trường đối tác thuộc diện tuyển dụng.</li>
                          <li><strong>Giai đoạn 3:</strong> Hoàn tất hồ sơ chứng minh tài chính, nộp xin lịch hẹn phỏng vấn Visa tại cơ quan Ngoại giao theo diện <strong>{selectedProduct.visaCode || "tương ứng"}</strong>.</li>
                          <li><strong>Giai đoạn 4:</strong> Nhận kết quả Visa, đào tạo định hướng kỹ năng hội nhập, hướng dẫn xuất cảnh và nhập học chính thức.</li>
                        </ol>
                      </div>

                      {/* SIGNATURE SECTION */}
                      <div className="grid grid-cols-2 gap-8 text-center mt-12 pt-6 border-t border-dashed border-slate-200">
                        <div>
                          <div className="font-bold text-slate-900 uppercase">BÊN B</div>
                          <div className="font-bold text-slate-900">Khách hàng</div>
                          <div className="text-slate-400 italic text-[11px] mt-0.5">(Ký và ghi rõ họ tên)</div>
                          <div className="h-20"></div>
                          <div className="font-bold text-cyan-950">{cleanVietnameseText(interestForm.customerName) || "...................................................."}</div>
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 uppercase">BÊN A</div>
                          <div className="font-bold text-slate-900">Giám đốc điều hành</div>
                          <div className="text-slate-400 italic text-[11px] mt-0.5">(Ký và ghi rõ họ tên)</div>
                          <div className="h-20"></div>
                          <div className="font-bold text-cyan-950">VŨ ĐỨC HÙNG</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="bg-slate-50 p-4 border-t border-slate-100 flex gap-3 justify-end shrink-0">
                <button
                  type="button"
                  className="bg-transparent hover:bg-slate-150 text-slate-650 border border-slate-250 text-xs font-semibold py-2 px-4 rounded-xl transition-colors"
                  onClick={() => setShowContractPreview(false)}
                >
                  Quay lại
                </button>
                <button
                  type="button"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 px-5 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
                  onClick={() => window.print()}
                >
                  <i className="fa fa-print"></i> In / Xuất PDF
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export function ProductOverviewPage({ currentUser }) {
  return (
    <ToastProvider>
      <ProductOverviewPageInner currentUser={currentUser} />
    </ToastProvider>
  );
}
