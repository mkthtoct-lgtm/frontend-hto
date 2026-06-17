import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { API_BASE_URL } from "../config/api";
import { authFetch, getAuthHeaders } from "../auth/session";
import { ToastDispatchContext, useToast } from "./ToastContext";

const STATIC_BASE_URL = API_BASE_URL.replace("/api/v1", "");

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
    error:   "border-red-200 bg-red-50",
    warning: "border-amber-200 bg-amber-50",
    info:    "border-cyan-200 bg-cyan-50",
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
    danger:  "bg-red-600 hover:bg-red-700 text-white",
    warning: "bg-amber-500 hover:bg-amber-600 text-white",
    primary: "bg-cyan-900 hover:bg-cyan-950 text-white",
  };

  const iconStyles = {
    danger:  { bg: "bg-red-100", icon: "text-red-600", path: "M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" },
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
// INITIAL MOCK CATEGORIES AND PROGRAMS
// ==========================================
const INITIAL_CATEGORIES = [
  {
    id: "cat-1",
    name: "Du học hè",
    description: "Các chương trình du học hè ngắn hạn kết hợp học tập, rèn luyện kỹ năng và giao lưu văn hóa tại nhiều quốc gia phát triển.",
    status: "active",
    coverImageUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80",
    programs: []
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
    programs: []
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
    "Content-Type": "application/json",
    ...getAuthHeaders(),
    ...(options.headers || {})
  };
  const response = await authFetch(url, { ...options, headers });
  if (!response.ok) {
    const msg = await parseApiError(response);
    throw new Error(msg);
  }
  const text = await response.text();
  return text ? JSON.parse(text) : null;
};

// Helper: parse extended info từ description (lưu dưới dạng JSON)
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
    } catch  {
      // Không phải JSON hợp lệ, trả về nguyên bản
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

  const image = apiProduct.image
    ? (apiProduct.image.startsWith("http")
        ? apiProduct.image
        : `${STATIC_BASE_URL}/${apiProduct.image.replace(/^\//, "")}`)
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
    updatedAt: apiProduct.updatedAt || extendedData.updatedAt || ""
  };
};

const USE_MOCK_WHEN_API_FAIL = true;

const getMockData = () => INITIAL_CATEGORIES;

const mapApiCategoryToUiCategory = (apiCategory) => {
  const name = apiCategory.name || "";
  const id = apiCategory._id || apiCategory.id || "";
  const rawUrl = apiCategory.coverImageUrl || apiCategory.imageUrl || apiCategory.image || "";
  const coverImageUrl = rawUrl && !rawUrl.startsWith("http")
    ? `${STATIC_BASE_URL}/${rawUrl.replace(/^\//, "")}`
    : rawUrl;
  return {
    id,
    name,
    description: apiCategory.description || "",
    status: apiCategory.status || "active",  // Mặc định là active nếu thiếu
    updatedAt: apiCategory.updatedAt || "",
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
        <div className="absolute left-0 right-0 z-100 mt-1.5 max-h-[280px] overflow-y-auto force-rounded-xl border border-slate-200 app-dark:border-slate-700! bg-white app-dark:bg-[#252525]! shadow-xl p-1 animate-fade-in">
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

function MegaMenuFilter({ categories, selectedCategoryName, selectedCountry, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredCat, setHoveredCat] = useState(null);
  const [hoveredCountry, setHoveredCountry] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const menuRef = useRef(null);
  const timeoutRef = useRef(null);

  // Lọc danh mục theo từ khóa tìm kiếm
  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return categories;
    const term = searchTerm.toLowerCase().trim();
    return categories.filter(cat => 
      cat?.name?.toLowerCase().includes(term) ||
      cat?.description?.toLowerCase().includes(term)
    );
  }, [categories, searchTerm]);
  // Lấy chương trình theo danh mục và quốc gia đã chọn
  const programsForSelection = useMemo(() => {
    if (!hoveredCat) return [];
    
    const cat = categories.find(c => c.name === hoveredCat);
    if (!cat) return [];

    let programs = cat.programs || [];
    
    // Nếu chọn "Tất cả quốc gia" hoặc "ALL" thì hiển thị tất cả chương trình của danh mục
    if (hoveredCountry === "Tất cả quốc gia" || hoveredCountry === "ALL" || !hoveredCountry) {
      return programs;
    }

    // Lọc theo quốc gia
    return programs.filter(
      p => safeText(p?.country) === safeText(hoveredCountry)
    );
  }, [categories, hoveredCat, hoveredCountry]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
        setHoveredCat(null);
        setHoveredCountry(null);
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

  // Cleanup timeout
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const hasSelection = selectedCategoryName !== "Tất cả" || selectedCountry !== "Tất cả";

  const displayLabel = hasSelection
    ? [
        selectedCategoryName !== "Tất cả" && selectedCategoryName,
        selectedCountry !== "Tất cả" && resolveCountryName(selectedCountry)
      ]
      .filter(Boolean)
      .join(" › ")
    : "Danh mục & Quốc gia";

  const handleSelectCatOnly = (catName) => {
    onSelect({ category: catName, country: "Tất cả" });
    setIsOpen(false);
    setHoveredCat(null);
    setHoveredCountry(null);
    setSearchTerm("");
  };

  const handleSelectCountry = (catName, country) => {
    onSelect({ category: catName, country });
    setIsOpen(false);
    setHoveredCat(null);
    setHoveredCountry(null);
    setSearchTerm("");
  };

  const handleReset = () => {
    onSelect({ category: "Tất cả", country: "Tất cả" });
    setIsOpen(false);
    setHoveredCat(null);
    setHoveredCountry(null);
    setSearchTerm("");
  };

  const handleMouseEnter = (catName) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setHoveredCat(catName);
    setHoveredCountry("Tất cả quốc gia");
  };

  const handleMenuLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setHoveredCat(null);
      setHoveredCountry(null);
    }, 200);
  };

  // Lấy danh sách quốc gia cho danh mục đang hover
  const countriesForCat = useMemo(() => {
    if (!hoveredCat) return [];
    const cat = categories.find(c => c.name === hoveredCat);
    if (!cat) return [];

    const seen = new Set();
    const result = [];
    (cat.programs || []).forEach(p => {
      const raw = p?.country?.trim();
      if (raw && !seen.has(raw)) {
        seen.add(raw);
        result.push(raw);
      }
    });
    return result.sort((a, b) =>
      resolveCountryName(a).localeCompare(resolveCountryName(b), "vi")
    );
  }, [categories, hoveredCat]);

  // Danh sách quốc gia hiển thị (bao gồm "Tất cả quốc gia")
  const displayCountries = useMemo(() => {
    const countryList = ["Tất cả quốc gia", ...countriesForCat];
    if (countriesForCat.length > 1) {
      countryList.splice(1, 0, "ALL");
    }
    return countryList;
  }, [countriesForCat]);

  return (
    <div className="relative w-full" ref={menuRef}>
      {/* Button trigger */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(v => !v);
          if (!isOpen) {
            setHoveredCat(null);
            setHoveredCountry(null);
            setSearchTerm("");
          }
        }}
        className={`
          w-full h-11 px-4 rounded-2xl border bg-white shadow-sm transition-all
          flex items-center justify-between
          ${isOpen
            ? "border-cyan-400 ring-2 ring-cyan-500/20"
            : "border-slate-200 hover:border-cyan-300"}
        `}
      >
        <span className={`truncate text-sm ${hasSelection ? "font-semibold text-slate-800" : "text-slate-500"}`}>
          {displayLabel}
        </span>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          className="
            absolute left-0 top-full mt-2 z-200
            bg-white rounded-2xl
            border border-slate-200
            shadow-[0_20px_60px_rgba(0,0,0,0.12)]
            overflow-hidden
            min-w-[320px] md:min-w-[680px] lg:min-w-[820px]
          "
          onMouseLeave={handleMenuLeave}
        >
          <div className="flex flex-col md:flex-row max-h-[520px]">
            {/* Cột 1: Danh mục */}
            <div className="w-full md:w-[240px] lg:w-[280px] shrink-0 border-r border-slate-100">
              <div className="p-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Danh mục
                </span>
              </div>
              <div className="overflow-y-auto max-h-[440px] py-1">
                {/* Ô tìm kiếm danh mục */}
                <div className="px-3 pb-2 border-b border-slate-100 mb-1">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Tìm danh mục..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="
                        w-full h-9 pl-9 pr-3
                        bg-slate-50 border border-slate-200 rounded-xl
                        text-sm text-slate-700 placeholder-slate-400
                        focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500
                        transition-all duration-200
                      "
                    />
                    <svg
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={() => setSearchTerm("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Nút Tất cả danh mục */}
                <button
                  onClick={handleReset}
                  className={`
                    w-full px-4 py-2.5 text-left text-sm transition-all
                    flex items-center gap-3
                    ${selectedCategoryName === "Tất cả" && selectedCountry === "Tất cả"
                      ? "bg-cyan-50 text-cyan-700 font-semibold"
                      : "hover:bg-slate-50 text-slate-600"
                    }
                  `}
                >
                  <span className="text-sm">Tất cả danh mục</span>
                  {selectedCategoryName === "Tất cả" && selectedCountry === "Tất cả" && (
                    <svg className="w-4 h-4 ml-auto text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>

                {/* Danh sách danh mục đã được lọc */}
                {filteredCategories.length > 0 ? (
                  filteredCategories.map(cat => {
                    const isHovered = hoveredCat === cat.name;
                    const isSelected = selectedCategoryName === cat.name;
                    const count = cat.programs?.length || 0;
                    
                    return (
                      <button
                        key={cat.id}
                        onMouseEnter={() => handleMouseEnter(cat.name)}
                        onClick={() => handleSelectCatOnly(cat.name)}
                        className={`
                          w-full px-4 py-2.5 text-left text-sm transition-all
                          flex items-center gap-3 relative
                          ${isHovered ? "bg-cyan-50 text-cyan-700" : "hover:bg-slate-50 text-slate-600"}
                          ${isSelected ? "font-semibold text-cyan-700" : ""}
                        `}
                      >
                        {isHovered && (
                          <div className="absolute left-0 top-1 bottom-1 w-1 bg-cyan-600 rounded-r-full" />
                        )}
                        <span className="truncate text-sm">{cat.name}</span>
                        {count > 0 && (
                          <span className="text-[10px] text-slate-400 ml-auto shrink-0 bg-slate-100 px-1.5 py-0.5 rounded">
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })
                ) : (
                  <div className="px-4 py-8 text-center text-slate-400 text-sm">
                    Không tìm thấy danh mục "{searchTerm}"
                  </div>
                )}
              </div>
            </div>

            {/* Cột 2: Quốc gia */}
            <div className="w-full md:w-[200px] lg:w-[220px] shrink-0 border-r border-slate-100 bg-slate-50/30">
              <div className="p-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Quốc gia
                </span>
              </div>
              <div className="overflow-y-auto max-h-[440px] py-1">
                {hoveredCat ? (
                  <>
                    {displayCountries.length > 0 ? (
                      displayCountries.map(country => {
                        const isHovered = hoveredCountry === country;
                        const isSelected = selectedCountry === country;
                        
                        return (
                          <button
                            key={country}
                            onMouseEnter={() => setHoveredCountry(country)}
                            onClick={() => {
                              if (hoveredCat) {
                                handleSelectCountry(hoveredCat, country);
                              }
                            }}
                            className={`
                              w-full px-4 py-2.5 text-left text-sm transition-all
                              flex items-center gap-2
                              ${isHovered ? "bg-cyan-50 text-cyan-700 font-semibold" : "hover:bg-white text-slate-600"}
                              ${isSelected ? "text-cyan-700 font-semibold" : ""}
                            `}
                          >
                            <span className="truncate text-sm">{country}</span>
                          </button>
                        );
                      })
                    ) : (
                      <div className="px-4 py-8 text-center text-slate-400 text-sm">
                        Chưa có quốc gia
                      </div>
                    )}
                  </>
                ) : (
                  <div className="px-4 py-8 text-center text-slate-400 text-sm">
                    Chọn danh mục để xem quốc gia
                  </div>
                )}
              </div>
            </div>

            {/* Cột 3: Chương trình */}
            <div className="w-full md:w-[240px] lg:w-[280px] shrink-0 bg-white">
              <div className="p-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Chương trình
                </span>
              </div>
              <div className="overflow-y-auto max-h-[440px] py-1">
                {hoveredCat && hoveredCountry ? (
                  <>
                    {programsForSelection.length > 0 ? (
                      programsForSelection.slice(0, 10).map(prog => (
                        <button
                          key={prog.id}
                          onClick={() => {
                            if (hoveredCat && hoveredCountry) {
                              handleSelectCountry(hoveredCat, hoveredCountry);
                            }
                          }}
                          className="
                            w-full px-4 py-2.5 text-left text-sm
                            hover:bg-cyan-50 transition-all
                            border-b border-slate-50 last:border-0
                            flex flex-col gap-0.5
                          "
                        >
                          <span className="font-medium text-slate-700 text-sm line-clamp-1">{prog.name}</span>
                          {prog.description && (
                            <span className="text-[11px] text-slate-400 line-clamp-1">
                              {prog.description.slice(0, 60)}...
                            </span>
                          )}
                          {prog.country && (
                            <span className="text-[10px] text-slate-400">
                              {resolveCountryName(prog.country)}
                            </span>
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-8 text-center text-slate-400 text-sm">
                        {hoveredCountry === "Tất cả quốc gia" || hoveredCountry === "ALL"
                          ? "Chọn quốc gia cụ thể để xem chương trình"
                          : "Chưa có chương trình cho quốc gia này"}
                      </div>
                    )}
                    
                    {/* Nút Xem tất cả */}
                    {programsForSelection.length > 3 && (
                      <button
                        onClick={() => {
                          if (hoveredCat && hoveredCountry) {
                            handleSelectCountry(hoveredCat, hoveredCountry);
                          }
                        }}
                        className="
                          w-full px-4 py-3 text-center text-sm
                          text-cyan-700 font-semibold
                          hover:bg-cyan-50 transition-all
                          border-t border-slate-100 mt-1
                        "
                      >
                        Xem tất cả {programsForSelection.length} chương trình →
                      </button>
                    )}
                  </>
                ) : (
                  <div className="px-4 py-8 text-center text-slate-400 text-sm">
                    {!hoveredCat ? "Chọn danh mục trước" : "Chọn quốc gia để xem chương trình"}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState("");
  const [apiMode, setApiMode] = useState("mock");

  const [viewMode, setViewMode] = useState("overview");
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryName, setSelectedCategoryName] = useState("Tất cả");
  const [selectedCountry, setSelectedCountry] = useState("Tất cả");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const [openCardPrograms, setOpenCardPrograms] = useState({});

  const [editingCategory, setEditingCategory] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingProductParentCatId, setEditingProductParentCatId] = useState("");
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [submittingInterest, setSubmittingInterest] = useState(false);

  const [activeCategoryTab, setActiveCategoryTab] = useState("info");
  const [activeProductTab, setActiveProductTab] = useState("basic");

  const [brochureLinkInput, setBrochureLinkInput] = useState("");
  const [docLinkNameInput, setDocLinkNameInput] = useState("");
  const [docLinkUrlInput, setDocLinkUrlInput] = useState("");
  const [docLinkTypeInput, setDocLinkTypeInput] = useState("Checklist");

  const [isBrochureDragging, setIsBrochureDragging] = useState(false);
  const [isDocsDragging, setIsDocsDragging] = useState(false);
  const [isCategoryCoverDragging, setIsCategoryCoverDragging] = useState(false);
  const categoryCoverInputRef = useRef(null);
  const [categoryCoverFile, setCategoryCoverFile] = useState(null);

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
    updatedAt: ""
  });

  const [interestForm, setInterestForm] = useState({
    customerName: "",
    phone: "",
    email: "",
    note: "",
    sourceChannel: "CTV/Đại lý"
  });

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

  const getStatusBadgeInfo = (status) => {
    switch (status) {
      case "coming_soon":
        return { bg: "bg-yellow-500", text: "SẮP MỞ" };
      case "inactive":
        return { bg: "bg-orange-500", text: "TẠM NGƯNG" };
      case "hidden":
        return { bg: "bg-red-600", text: "ĐÃ ẨN" };
      default:
        return null;
    }
  };

  // Load dữ liệu từ API
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
      setLoading(true);
      setError("");
      try {
        const catsPayload = await apiRequest(`${API_BASE_URL}/product-categories`);
        const apiCats = normalizeArray(catsPayload);

        if (apiCats.length === 0) {
          if (USE_MOCK_WHEN_API_FAIL) {
            setCategories(getMockData());
            setApiMode("mock");
          }
          setLoading(false);
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
            coverImageUrl: rawCoverUrl && !rawCoverUrl.startsWith("http")
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

        const result = categoryIds.map(id => catMap[id]).filter(Boolean);
        setCategories(result);
        setApiMode("api");
      } catch (err) {
        console.warn("[API] Dùng dữ liệu mẫu do không kết nối được server:", err.message);
        if (USE_MOCK_WHEN_API_FAIL) {
          setCategories(getMockData());
          setApiMode("mock");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategoryName("Tất cả");
    setSelectedCountry("Tất cả");
    setSelectedStatus("all");
    setCategoryPage(0);
  };

  const toggleProgramsAccordion = (catId) => {
    setOpenCardPrograms(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };


  const CATEGORIES_PER_PAGE = 6;
  const [categoryPage, setCategoryPage] = useState(0);

  const handleGoBack = () => {
    setSelectedProduct(null);
    setViewMode("overview");
  };

  // Reset trang danh mục khi bộ lọc thay đổi
  useEffect(() => {
    setCategoryPage(0);
  }, [searchQuery, selectedCategoryName, selectedCountry, selectedStatus]);

  const filteredCategories = useMemo(() => {
    const q = safeText(searchQuery);
    const hasFilter = q || selectedCountry !== "Tất cả" || selectedStatus !== "all";

    return safeArray(categories)
      .map(cat => {
        if (!cat) return null;

        // Lọc category theo tên đã chọn
        if (selectedCategoryName !== "Tất cả" && safeText(cat.name) !== safeText(selectedCategoryName)) {
          return null;
        }

        const progs = safeArray(cat.programs || cat.products);

        // Lọc programs theo tất cả điều kiện
        const filteredProgs = progs.filter(prog => {
          if (!prog) return false;

          // Ẩn sản phẩm hidden/inactive với người dùng thường (không phải admin/manager)
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

          return matchSearch && matchCountry && matchStatus;
        });

        // Nếu có bộ lọc: chỉ hiện category khi có ít nhất 1 program khớp
        // Nếu không có bộ lọc: luôn hiện category (kể cả khi chưa có program)
        if (hasFilter) {
          // Cho phép match theo tên/mô tả category khi search text (không lọc quốc gia/trạng thái)
          const isCatNameMatch =
            q &&
            selectedCountry === "Tất cả" &&
            selectedStatus === "all" &&
            (safeText(cat.name).includes(q) || safeText(cat.description).includes(q));

          if (filteredProgs.length === 0 && !isCatNameMatch) return null;
        }

        return { ...cat, filteredPrograms: filteredProgs };
      })
      .filter(Boolean);
  }, [categories, searchQuery, selectedCategoryName, selectedCountry, selectedStatus, canManageProducts]);

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

  const handleOpenInterestModal = () => {
    setInterestForm({
      customerName: "",
      phone: "",
      email: "",
      note: "",
      sourceChannel: "CTV/Đại lý"
    });
    setShowInterestModal(true);
  };

  const handleSubmitInterest = async (e) => {
    e.preventDefault();

    if (!interestForm.customerName.trim()) {
      toast.warning("Vui lòng nhập họ tên khách hàng.", "Thiếu thông tin");
      return;
    }
    if (!interestForm.phone.trim()) {
      toast.warning("Vui lòng nhập số điện thoại.", "Thiếu thông tin");
      return;
    }

    setSubmittingInterest(true);

    try {
      const leadPayload = {
        customerName: interestForm.customerName,
        phone: interestForm.phone,
        email: interestForm.email || undefined,
        note: interestForm.note || undefined,
        sourceChannel: interestForm.sourceChannel,
        productId: selectedProduct?.id,
        productName: selectedProduct?.name,
        assignedTo: currentUser?._id || currentUser?.id || undefined,
        assignedName: currentUserName
      };

      await apiRequest(`${API_BASE_URL}/leads`, {
        method: "POST",
        body: JSON.stringify(leadPayload)
      });

      toast.success(`Đã đăng ký thành công cho khách hàng ${interestForm.customerName}`, "Gửi liên hệ thành công");
      setShowInterestModal(false);
    } catch (err) {
      toast.error(err.message, "Gửi liên hệ thất bại");
    } finally {
      setSubmittingInterest(false);
    }
  };

  const handleTestSendInterest = async (e) => {
    if (e) e.preventDefault();

    if (!interestForm.customerName.trim()) {
      toast.warning("Vui lòng nhập họ tên khách hàng.", "Thiếu thông tin");
      return;
    }
    if (!interestForm.phone.trim()) {
      toast.warning("Vui lòng nhập số điện thoại.", "Thiếu thông tin");
      return;
    }

    setSubmittingInterest(true);

    const payload = {
      customerName: interestForm.customerName.trim(),
      phone: interestForm.phone.trim(),
      email: interestForm.email.trim(),
      source: interestForm.sourceChannel || "CTV/Đại lý",
      productInterest: selectedProduct.name,
      countryInterest: selectedProduct.country || "Đức",
      budgetRange: "",
      urgency: "Chưa xác định",
      preferredContact: "Zalo/Điện thoại",
      note: (interestForm.note || "").trim() + " (Gửi thử nghiệm từ UI)",
      status: "new",
      createdAt: new Date().toISOString()
    };

    try {
      const headers = {
        "Content-Type": "application/json",
        ...getAuthHeaders()
      };

      const response = await authFetch(`${API_BASE_URL}/leads`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || `HTTP error ${response.status}`);
      }

      toast.success(`Đã gửi lead thử nghiệm vào CRM thành công!`, "Gửi thử thành công");
      setShowInterestModal(false);
    } catch (err) {
      console.error("Lỗi gửi thử API thật:", err);
      toast.error(`Không thể kết nối hoặc gửi vào CRM: ${err.message}`, "Gửi thử thất bại");
    } finally {
      setSubmittingInterest(false);
    }
  };

  // ==========================================
  // CRUD: CATEGORY ACTIONS
  // ==========================================
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
    setCategoryCoverFile(null);
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
    setCategoryCoverFile(null);
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
      const formData = new FormData();
      formData.append('name', formCategory.name);
      formData.append('description', formCategory.description || '');
      formData.append('status', formCategory.status);
      
      if (categoryCoverFile) {
        formData.append('coverImage', categoryCoverFile);
      } else if (formCategory.coverImageUrl && formCategory.coverImageUrl.trim()) {
        if (formCategory.coverImageUrl.startsWith('http')) {
          formData.append('coverImageUrl', formCategory.coverImageUrl);
        }
      }

      const url = editingCategory === "new" 
        ? `${API_BASE_URL}/product-categories`
        : `${API_BASE_URL}/product-categories/${editingCategory}`;
      
      const response = await authFetch(url, {
        method: editingCategory === "new" ? "POST" : "PATCH",
        body: formData,
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorMsg = await parseApiError(response);
        throw new Error(errorMsg);
      }
      
      const result = await response.json();
      const savedCategory = result?.data || result;
      const mapped = mapApiCategoryToUiCategory(savedCategory);
      
      if (editingCategory === "new") {
        setCategories(prev => [...prev, mapped]);
      } else {
        setCategories(prev => prev.map(cat => {
          if (cat.id !== editingCategory) return cat;
          return { ...cat, ...mapped, programs: cat.programs || [] };
        }));
      }
      
      setApiMode("api");
      setCategoryCoverFile(null);
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
      documents: []
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
      documents: prod.documents || []
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
          // Sync formCategory.programs so modal tab 2 reflects deletion immediately
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
      region: formProduct.region,
      detailDescription: formProduct.detailDescription,
      targetAudience: formProduct.targetAudience,
      tags: tags,
      websiteUrl: formProduct.websiteUrl,
      brochure: formProduct.brochure,
      documents: formProduct.documents,
      updatedAt: new Date().toISOString().split("T")[0]
    };
    
    const finalDescription = buildDescription(formProduct.description, extendedData);

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
    };

    try {
      let savedProd;

      if (apiMode === "api") {
        let response;
        if (editingProduct === "new") {
          response = await apiRequest(`${API_BASE_URL}/products`, {
            method: "POST",
            body: JSON.stringify(apiPayload)
          });
        } else {
          response = await apiRequest(`${API_BASE_URL}/products/${editingProduct}`, {
            method: "PATCH",
            body: JSON.stringify(apiPayload)
          });
        }
        const normalized = response?.data || response;
        const catName = categories.find(c => c.id === editingProductParentCatId)?.name || "";
        savedProd = mapApiProductToUiProduct(normalized, editingProductParentCatId, catName);
      } else {
        const catName = categories.find(c => c.id === editingProductParentCatId)?.name || "";
        savedProd = {
          ...apiPayload,
          id: editingProduct === "new" ? `prod-${Date.now()}` : editingProduct,
          categoryId: editingProductParentCatId,
          categoryName: catName,
          region: formProduct.region,
          status: formProduct.status,
          highlights: highlightsArray,
          processSteps: processStepsArray,
          tags: tags,
          detailDescription: formProduct.detailDescription,
          targetAudience: formProduct.targetAudience,
          websiteUrl: formProduct.websiteUrl,
          brochure: formProduct.brochure,
          documents: formProduct.documents,
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
      // Sync formCategory.programs so modal tab 2 reflects changes immediately
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
              <h1 className="text-2xl font-bold text-slate-900 app-dark:text-slate-100! m-0">Tổng quan sản phẩm</h1>
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
            id="tour-back-btn"
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
      {viewMode === "overview" && (
        <div id="products-stats-grid" className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="bg-white app-dark:bg-[#252525]! rounded-2xl p-4.5 shadow-sm border border-slate-100 app-dark:border-white/8! flex items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 app-dark:bg-cyan-955/40! text-cyan-900 app-dark:text-cyan-300! shrink-0 mr-4">
              <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
          selectedCountry !== "Tất cả" && { key: "country", label: resolveCountryName(selectedCountry), onClear: () => setSelectedCountry("Tất cả") },
          selectedStatus !== "all" && { key: "status", label: statusOptions.find(o => o.value === selectedStatus)?.label || selectedStatus, onClear: () => setSelectedStatus("all") },
        ].filter(Boolean);

        const totalResults = filteredCategories.reduce((sum, cat) => sum + (cat.filteredPrograms?.length || 0), 0);
        const hasActiveFilter = activeFilters.length > 0;

        return (
          <div id="products-filter-section" className="bg-white app-dark:bg-[#252525]! rounded-2xl border border-slate-100 app-dark:border-white/8! px-4 py-3 shadow-sm app-dark:shadow-none! mb-5">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-center">
              {/* Search */}
              <div className="md:col-span-12 xl:col-span-6">
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

              {/* Mega menu: Danh mục + Quốc gia */}
              <div className="md:col-span-8 xl:col-span-4">
                <MegaMenuFilter
                  categories={categories}
                  selectedCategoryName={selectedCategoryName}
                  selectedCountry={selectedCountry}
                  onSelect={({ category, country }) => {
                    setSelectedCategoryName(category);
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

            {/* Active filter badges + result count */}
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
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
          {filteredCategories.length > 0 ? (
            (() => {
              const totalCatPages = Math.ceil(filteredCategories.length / CATEGORIES_PER_PAGE);
              const safeCatPage = Math.min(categoryPage, totalCatPages - 1);
              const pagedCategories = filteredCategories.slice(
                safeCatPage * CATEGORIES_PER_PAGE,
                safeCatPage * CATEGORIES_PER_PAGE + CATEGORIES_PER_PAGE
              );
              return pagedCategories.map((cat) => {
              const statusBadge = getStatusBadgeInfo(cat.status);
              const isInactiveOrHidden = cat.status === "inactive" || cat.status === "hidden";
              const isExpanded = !!openCardPrograms[cat.id];
              const displayPrograms = cat.filteredPrograms || cat.programs || [];

              return (
                <div key={cat.id} className="flex flex-col">
                  <div className="relative bg-white app-dark:bg-[#252525]! rounded-2xl overflow-hidden shadow-sm border border-slate-100 app-dark:border-white/8! transition-shadow duration-200 hover:shadow-md flex flex-col h-full">
                    {/* Header Card với Ảnh Nền */}
                    <div className={`relative overflow-hidden rounded-t-2xl h-[180px] md:h-[190px] ${isInactiveOrHidden ? "opacity-75" : ""}`}>
                      <div className="absolute inset-0 bg-slate-100 app-dark:bg-[#1a1a1a]! flex flex-col items-center justify-center text-slate-400 app-dark:text-slate-500! gap-1.5 force-rounded-t-2xl">
                        <svg className="w-10 h-10 text-slate-350" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-[11px] font-medium tracking-wide">Chưa có ảnh bìa</span>
                      </div>

                      {cat.coverImageUrl && (
                        <img
                          src={cat.coverImageUrl}
                          alt={cat.name}
                          className="absolute inset-0 h-full w-full object-cover force-rounded-t-2xl"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      )}

                      <div className="absolute inset-0 bg-linear-to-t from-slate-950/65 via-slate-900/25 to-slate-900/15" />

                      <div className="relative flex h-full flex-col p-5 justify-between">
                        <div className="flex items-start justify-between gap-3">
                          {canManageProducts ? (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleEditCategory(cat);
                                }}
                                className="flex h-9 w-9 items-center justify-center border border-white/60 app-dark:border-white/20! bg-white/90 app-dark:bg-white/10! text-amber-500 shadow-sm transition hover:scale-105 hover:bg-white app-dark:hover:bg-white/20! force-rounded-full cursor-pointer"
                                aria-label="Sửa danh mục"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-2.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleToggleCategoryStatus(cat.id, cat.status);
                                }}
                                className="flex h-9 w-9 items-center justify-center border border-white/60 app-dark:border-white/20! bg-white/90 app-dark:bg-white/10! text-cyan-700 shadow-sm transition hover:scale-105 hover:bg-white app-dark:hover:bg-white/20! force-rounded-full cursor-pointer"
                                aria-label="Thay đổi trạng thái danh mục"
                              >
                                {isInactiveOrHidden ? (
                                  <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          ) : (
                            <div />
                          )}

                          <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-semibold border border-white/15 text-white">
                            {displayPrograms.length} Chương trình
                          </span>
                        </div>

                        <div>
                          <h5 className="text-xl font-bold m-0 [text-shadow:0_2px_4px_rgba(0,0,0,0.15)] leading-tight flex items-center flex-wrap gap-2 text-white">
                            {cat.name}
                            {statusBadge && (
                              <span className={`${statusBadge.bg} text-white font-bold px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider`}>
                                {statusBadge.text}
                              </span>
                            )}
                          </h5>
                        </div>
                      </div>
                    </div>

                    {/* Body Card */}
                    <div className="p-5 grow flex flex-col">
                      <p className="text-slate-500 app-dark:text-slate-400! text-xs mb-4 line-clamp-2 h-10 overflow-hidden leading-relaxed">
                        {cat.description || "Chưa có mô tả danh mục lớn."}
                      </p>

                      <div className="border-t border-slate-100 app-dark:border-white/8! pt-4 mt-4">
                        <button
                          type="button"
                          className="w-full flex justify-between items-center font-semibold text-xs text-slate-600 app-dark:text-slate-300! hover:text-cyan-955 transition-colors"
                          onClick={() => toggleProgramsAccordion(cat.id)}
                        >
                          <span>Các chương trình cụ thể</span>
                          <i className={`fa ${isExpanded ? "fa-chevron-up" : "fa-chevron-down"} text-[10px]`}></i>
                        </button>

                        {isExpanded && (
                          <div className="mt-4 animate-fade-in">
                            {displayPrograms.length > 0 ? (
                              <>
                                <div className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
                                  {displayPrograms.map((prog) => {
                                    const totalDocs = (prog.brochure ? 1 : 0) + (prog.documents?.length || 0);
                                    return (
                                      <div key={prog.id} className="snap-start shrink-0 w-[calc(50%-0.375rem)] sm:w-[200px]">
                                        <div
                                          id={prog.id === "prod-1-1" ? "tour-first-program-card" : undefined}
                                          className="bg-slate-50 app-dark:bg-[#1e1e1e]! border border-slate-200/80 app-dark:border-slate-700! rounded-xl p-3.5 transition-all duration-200 hover:bg-cyan-50/50 app-dark:hover:bg-cyan-955/40! hover:border-cyan-200 app-dark:hover:border-cyan-900/60! hover:translate-x-0.5 cursor-pointer h-full flex flex-col justify-between"
                                          onClick={() => {
                                            setSelectedProduct(prog);
                                            setViewMode("detail");
                                          }}
                                        >
                                          <div>
                                            <div className="font-semibold text-xs text-slate-800 app-dark:text-slate-100! mb-2 line-clamp-2 leading-snug min-h-[2.8em]" title={prog.name}>
                                              {prog.name}
                                            </div>
                                          </div>

                                          <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-slate-200/40 app-dark:border-white/8/60!">
                                            <span className="bg-slate-100 app-dark:bg-[#252525]! text-slate-700 app-dark:text-slate-300! border border-slate-200 app-dark:border-white/8! px-2 py-0.5 rounded-lg text-[10px] font-medium flex items-center gap-1">
                                              <i className="fa fa-earth-asia text-cyan-750 app-dark:text-cyan-400!"></i>
                                              {resolveCountryName(prog.country)}
                                            </span>

                                            <span className="text-[10px] text-slate-400 app-dark:text-slate-500! font-medium flex items-center gap-1">
                                              <i className="fa fa-folder-open text-slate-400 app-dark:text-slate-500!"></i>
                                              {totalDocs} Tài liệu
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </>
                            ) : (
                              <div className="text-slate-400 app-dark:text-slate-500! text-xs italic py-4 text-center bg-slate-50 app-dark:bg-[#1e1e1e]! rounded-xl border border-dashed border-slate-200 app-dark:border-slate-700!">
                                Chưa có chương trình nào hoạt động khớp bộ lọc.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
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
                    className={`rounded-full transition-all duration-200 font-semibold text-xs ${
                      idx === safeCatPage
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
        <div id="tour-product-detail-view" className="bg-white app-dark:bg-[#252525]! rounded-2xl shadow-sm border border-slate-100 app-dark:border-white/8! p-6 md:p-8">
          <div className="border-b border-slate-100 app-dark:border-white/8! pb-6 mb-6 flex flex-col md:flex-row justify-between items-start gap-4">
            <div className="flex gap-4 items-start">
              <div
                className="w-14 h-14 rounded-2xl text-white flex items-center justify-center text-2xl shrink-0"
                style={{
                  background: "linear-gradient(135deg, #003366 0%, #002244 100%)",
                  boxShadow: "0 4px 10px rgba(0,51,102,0.2)"
                }}
              >
                <i className="fa fa-graduation-cap"></i>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold text-slate-800 app-dark:text-slate-100! m-0 leading-tight">{selectedProduct.name}</h2>
                  <span className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-cyan-50 text-cyan-800 border border-cyan-150">
                    {selectedProduct.categoryName || "Chương trình"}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200">
                    {selectedProduct.region} · {selectedProduct.country}
                  </span>
                </div>
                <p className="text-slate-400 app-dark:text-slate-500! text-xs m-0 mt-1.5 font-medium">
                  Cập nhật lần cuối: {selectedProduct.updatedAt || new Date().toISOString().split("T")[0]}
                </p>
              </div>
            </div>

            <div className="flex gap-2 w-full md:w-auto flex-wrap">
              {selectedProduct.websiteUrl && (
                <button
                  className="flex-1 md:flex-none bg-transparent hover:bg-slate-50 text-cyan-900 hover:text-cyan-950 font-semibold text-xs border-2 border-cyan-900 force-rounded-xl px-4 py-2 flex items-center justify-center gap-1.5 transition-all duration-200"
                  onClick={() => handleOpenWebsite(selectedProduct.websiteUrl)}
                >
                  <i className="fa fa-globe"></i> Xem trang web sản phẩm
                </button>
              )}
              {canManageProducts && (
                <button
                  className="flex-1 md:flex-none bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold text-xs force-rounded-xl px-4 py-2 flex items-center justify-center gap-1.5 transition-all duration-200 shadow-sm"
                  onClick={() => handleEditProduct(selectedProduct)}
                >
                  <i className="fa fa-pen"></i> Sửa sản phẩm
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h5 className="font-bold text-cyan-900 app-dark:text-cyan-400! text-sm tracking-wide uppercase mb-3 flex items-center gap-2">
                  <i className="fa fa-circle-info text-cyan-800"></i>Tổng quan chương trình
                </h5>
                <p className="text-slate-600 app-dark:text-slate-300! text-[13.5px] leading-relaxed whitespace-pre-line">
                  {selectedProduct.detailDescription || selectedProduct.description || "Đang cập nhật nội dung chi tiết..."}
                </p>
              </div>

              {selectedProduct.targetAudience && (
                <div className="p-4 rounded-2xl bg-slate-50/70 app-dark:bg-white/5! border border-slate-100 app-dark:border-white/8!">
                  <h6 className="font-bold text-slate-800 app-dark:text-slate-200! text-xs tracking-wide uppercase mb-2 flex items-center gap-2">
                    <i className="fa fa-users text-cyan-800"></i>Đối tượng tuyển sinh phù hợp
                  </h6>
                  <p className="text-slate-600 app-dark:text-slate-300! text-[13px] leading-relaxed m-0">{selectedProduct.targetAudience}</p>
                </div>
              )}

              {selectedProduct.highlights && selectedProduct.highlights.length > 0 && (
                <div>
                  <h5 className="font-bold text-cyan-900 text-sm tracking-wide uppercase mb-3 flex items-center gap-2">
                    <i className="fa fa-star text-amber-500"></i>Điểm nổi bật chương trình
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedProduct.highlights.map((hl, i) => (
                      <div key={i} className="bg-emerald-50/40 border border-emerald-100 text-emerald-800 rounded-xl p-3 text-[13px] flex items-start gap-2.5">
                        <i className="fa fa-circle-check text-emerald-650 text-base mt-0.5 shrink-0"></i>
                        <span className="leading-relaxed font-medium">{hl}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedProduct.processSteps && selectedProduct.processSteps.length > 0 && (
                <div>
                  <h5 className="font-bold text-cyan-900 text-sm tracking-wide uppercase mb-3 flex items-center gap-2">
                    <i className="fa fa-list-check text-cyan-800"></i>Quy trình xử lý hồ sơ
                  </h5>
                  <div className="flex flex-col gap-3">
                    {selectedProduct.processSteps.map((step, i) => (
                      <div className="flex items-center gap-4 bg-slate-50/80 app-dark:bg-white/5! p-3.5 border border-slate-100 app-dark:border-white/8! rounded-2xl" key={i}>
                        <span className="w-6 h-6 bg-cyan-900 text-white font-bold rounded-full flex items-center justify-center text-[11px] shrink-0">{i + 1}</span>
                        <span className="text-slate-700 app-dark:text-slate-300! text-[13px] font-medium leading-normal">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedProduct.tags && selectedProduct.tags.length > 0 && (
                <div className="flex items-center flex-wrap gap-2 pt-2">
                  <span className="text-slate-400 text-xs font-semibold">Nhãn dán:</span>
                  {selectedProduct.tags.map((tag, i) => (
                    <span key={i} className="bg-slate-100 app-dark:bg-white/8! text-slate-600 app-dark:text-slate-300! border border-slate-200 app-dark:border-white/10! px-2.5 py-1 rounded-lg text-[11px] font-medium">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="border border-slate-100 app-dark:border-white/8! rounded-2xl p-5 bg-slate-50/40 app-dark:bg-white/5!">
                <h5 className="font-bold text-slate-800 app-dark:text-slate-200! mb-4 text-[14.5px] border-b border-slate-100 app-dark:border-white/8! pb-3 flex items-center gap-2">
                  <i className="fa fa-folder-open text-cyan-900"></i> Tài liệu &amp; Brochure
                </h5>

                <div id="tour-product-brochure" className="mb-5">
                  <label className="font-bold text-slate-550 text-xs tracking-wider uppercase d-block mb-2.5">Brochure chính thức:</label>
                  {selectedProduct.brochure ? (
                    <div className="bg-white app-dark:bg-white/5! border border-slate-200/80 app-dark:border-white/10! rounded-xl p-3 flex justify-between items-center shadow-sm">
                      <div className="text-truncate pr-2 flex items-center" style={{ minWidth: 0 }}>
                        {selectedProduct.brochure.sourceType === "link" ? (
                          <i className="fa fa-link text-cyan-900 mr-2.5 text-lg shrink-0"></i>
                        ) : selectedProduct.brochure.fileType === "IMAGE" ? (
                          selectedProduct.brochure.url ? (
                            <img
                              src={selectedProduct.brochure.url}
                              alt="preview"
                              className="rounded border mr-2.5 w-8 h-8 object-cover shrink-0"
                            />
                          ) : (
                            <i className="fa fa-file-image text-emerald-650 mr-2.5 text-lg shrink-0"></i>
                          )
                        ) : (
                          <i className="fa fa-file-pdf text-red-500 mr-2.5 text-lg shrink-0"></i>
                        )}
                        <div className="text-truncate" style={{ minWidth: 0 }}>
                          <span className="font-semibold text-xs text-slate-800 d-block text-truncate" title={selectedProduct.brochure.name}>{selectedProduct.brochure.name}</span>
                          {selectedProduct.brochure.sourceType === "link" ? (
                            <span className="text-slate-400 d-block text-[10px] mt-0.5">Link đính kèm</span>
                          ) : selectedProduct.brochure.fileType === "IMAGE" ? (
                            <span className="text-slate-400 d-block text-[10px] mt-0.5">Ảnh tải lên ({selectedProduct.brochure.size})</span>
                          ) : (
                            <span className="text-slate-400 d-block text-[10px] mt-0.5">{selectedProduct.brochure.size}</span>
                          )}
                        </div>
                      </div>
                      {selectedProduct.brochure.sourceType === "link" ? (
                        <button className="bg-transparent hover:bg-slate-50 text-cyan-900 border border-slate-200 text-xs font-semibold py-1 px-3 rounded-lg transition-colors shrink-0" onClick={() => handleOpenWebsite(selectedProduct.brochure.url)}>
                          Mở link
                        </button>
                      ) : selectedProduct.brochure.fileType === "IMAGE" && selectedProduct.brochure.url ? (
                        <a
                          href={selectedProduct.brochure.url}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-transparent hover:bg-slate-50 text-cyan-900 border border-slate-200 text-xs font-semibold py-1 px-3 rounded-lg text-decoration-none transition-colors shrink-0 inline-block text-center"
                        >
                          Xem ảnh
                        </a>
                      ) : (
                        <button className="bg-transparent hover:bg-slate-50 text-cyan-900 border border-slate-200 text-xs font-semibold py-1 px-3 rounded-lg transition-colors shrink-0" onClick={() => handleDownloadDoc(selectedProduct.brochure.name)}>
                          Tải về
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="text-slate-400 app-dark:text-slate-500! text-xs italic bg-white app-dark:bg-white/5! border border-dashed border-slate-200 app-dark:border-white/10! rounded-xl py-3 px-4 text-center">Chưa có brochure riêng cho sản phẩm này.</div>
                  )}
                </div>

                <div id="tour-product-documents">
                  <label className="font-bold text-slate-550 text-xs tracking-wider uppercase d-block mb-2.5">Tài liệu hướng dẫn tư vấn:</label>
                  {selectedProduct.documents && selectedProduct.documents.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {selectedProduct.documents.map((doc) => (
                        <div key={doc.id} className="bg-white app-dark:bg-white/5! border border-slate-200/80 app-dark:border-white/10! rounded-xl p-3 flex justify-between items-center shadow-sm">
                          <div className="text-truncate pr-2 grow" style={{ minWidth: 0 }}>
                            <div className="flex items-center text-truncate">
                              {doc.sourceType === "link" ? (
                                <i className="fa fa-link text-cyan-900 mr-2 shrink-0"></i>
                              ) : (
                                <i className={`fa ${doc.type === "PDF" ? "fa-file-pdf text-red-500" : (doc.type === "XLSX" ? "fa-file-excel text-emerald-650" : "fa-file-lines text-sky-505")} mr-2 shrink-0`}></i>
                              )}
                              <span className="font-semibold text-xs text-slate-800 app-dark:text-slate-200! text-truncate" title={doc.name}>{doc.name}</span>
                            </div>
                            {doc.sourceType === "link" ? (
                              <span className="text-slate-400 d-block text-[10px] mt-1 pl-6">Link đính kèm ({doc.type}) · {doc.updatedAt || "2026-06-01"}</span>
                            ) : (
                              <span className="text-slate-400 d-block text-[10px] mt-1 pl-6">{doc.size} · {doc.updatedAt || "2026-06-01"}</span>
                            )}
                          </div>
                          {doc.sourceType === "link" ? (
                            <button className="bg-transparent hover:bg-slate-50 text-slate-750 border border-slate-200 text-xs font-semibold py-1 px-3 rounded-lg transition-colors shrink-0" onClick={() => handleOpenWebsite(doc.url)}>
                              Mở link
                            </button>
                          ) : (
                            <button className="bg-transparent hover:bg-slate-50 text-slate-750 border border-slate-200 text-xs font-semibold py-1 px-3 rounded-lg transition-colors shrink-0" onClick={() => handleDownloadDoc(doc.name)}>
                              Tải về
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-slate-400 app-dark:text-slate-500! text-xs italic bg-white app-dark:bg-white/5! border border-dashed border-slate-200 app-dark:border-white/10! rounded-xl py-3 px-4 text-center">Chưa đính kèm tài liệu tư vấn nào khác.</div>
                  )}
                </div>
              </div>

              <button
                id="tour-interest-btn"
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-4 force-rounded-xl font-bold shadow-md hover:shadow-lg transition-all duration-250 flex items-center justify-center gap-2"
                onClick={handleOpenInterestModal}
                style={{ fontSize: "14.5px" }}
              >
                <i className="fa fa-paper-plane"></i> QUAN TÂM SẢN PHẨM
              </button>
            </div>
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

                      {formCategory.coverImageUrl && !categoryCoverFile && formCategory.coverImageUrl.startsWith('/uploads/') && (
                        <div className="mb-3 relative">
                          <img
                            src={`${API_BASE_URL}${formCategory.coverImageUrl}`}
                            alt="Current cover"
                            className="w-full h-32 object-cover rounded-xl border border-slate-200"
                          />
                          <button
                            type="button"
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                            onClick={() => {
                              setFormCategory({ ...formCategory, coverImageUrl: "" });
                              setCategoryCoverFile(null);
                            }}
                          >
                            ×
                          </button>
                        </div>
                      )}

                      {categoryCoverFile && (
                        <div className="mb-3 relative">
                          <img
                            src={URL.createObjectURL(categoryCoverFile)}
                            alt="Preview new"
                            className="w-full h-32 object-cover rounded-xl border border-slate-200"
                          />
                          <button
                            type="button"
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                            onClick={() => {
                              setCategoryCoverFile(null);
                              setFormCategory({ ...formCategory, coverImageUrl: "" });
                            }}
                          >
                            ×
                          </button>
                        </div>
                      )}

                      <div
                        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${isCategoryCoverDragging ? "border-cyan-500 bg-cyan-50/30" : "border-slate-200 hover:border-slate-350 bg-slate-50/50"
                          }`}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsCategoryCoverDragging(true);
                        }}
                        onDragLeave={() => setIsCategoryCoverDragging(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsCategoryCoverDragging(false);
                          const file = e.dataTransfer.files?.[0];
                          if (file) {
                            if (!file.type.startsWith("image/")) {
                              toast.warning("Vui lòng chọn file ảnh hợp lệ!", "Định dạng không hỗ trợ");
                              return;
                            }
                            if (file.size > 5 * 1024 * 1024) {
                              toast.warning("Kích thước ảnh không được vượt quá 5MB!", "File quá lớn");
                              return;
                            }
                            setCategoryCoverFile(file);
                            setFormCategory({ ...formCategory, coverImageUrl: URL.createObjectURL(file) });
                          }
                        }}
                        onClick={() => categoryCoverInputRef.current?.click()}
                      >
                        <input
                          type="file"
                          ref={categoryCoverInputRef}
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (!file.type.startsWith("image/")) {
                                toast.warning("Vui lòng chọn file ảnh hợp lệ!", "Định dạng không hỗ trợ");
                                return;
                              }
                              if (file.size > 5 * 1024 * 1024) {
                                toast.warning("Kích thước ảnh không được vượt quá 5MB!", "File quá lớn");
                                return;
                              }
                              setCategoryCoverFile(file);
                              setFormCategory({ ...formCategory, coverImageUrl: URL.createObjectURL(file) });
                            }
                          }}
                        />
                        <svg className="mx-auto h-8 w-8 text-slate-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-xs font-semibold text-slate-600 mb-1">
                          Kéo thả ảnh vào đây hoặc nhấp để chọn ảnh từ máy
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Hỗ trợ PNG, JPG, JPEG, WEBP lên đến 5MB
                        </p>
                      </div>

                      <div className="mt-3">
                        <div className="flex items-center gap-2 mb-2">
                          <hr className="flex-1 border-slate-200" />
                          <span className="text-xs text-slate-400">HOẶC NHẬP LINK URL</span>
                          <hr className="flex-1 border-slate-200" />
                        </div>
                        <input
                          type="text"
                          placeholder="Dán hoặc nhập trực tiếp link ảnh bìa (URL)..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-[13px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all"
                          value={!categoryCoverFile ? (formCategory.coverImageUrl || "") : ""}
                          onChange={(e) => {
                            let value = e.target.value;
                            if (value && !/^https?:\/\//i.test(value) && !value.startsWith("data:")) {
                              if (value.includes(".") && value.length > 3) {
                                value = "https://" + value;
                              }
                            }
                            setFormCategory({ ...formCategory, coverImageUrl: value });
                            setCategoryCoverFile(null);
                          }}
                        />
                      </div>
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

                    <div className="col-span-1 md:col-span-3">
                      <label className="block font-semibold text-xs text-slate-500 mb-1.5">Phí dịch vụ</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[13.5px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all"
                          value={formProduct.serviceFee}
                          onChange={(e) => setFormProduct({ ...formProduct, serviceFee: parseInt(e.target.value) || 0 })}
                          placeholder="0"
                        />
                        <select
                          className="w-24 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[13.5px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all cursor-pointer"
                          value={formProduct.currency}
                          onChange={(e) => setFormProduct({ ...formProduct, currency: e.target.value })}
                        >
                          <option value="VND">VND</option>
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                          <option value="KRW">KRW</option>
                          <option value="JPY">JPY</option>
                        </select>
                      </div>
                    </div>

                    <div className="md:col-span-9">
                      <label className="block font-semibold text-xs text-slate-500 mb-1.5">Ảnh đại diện sản phẩm (URL)</label>
                      <input
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[13.5px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all"
                        value={formProduct.image}
                        onChange={(e) => setFormProduct({ ...formProduct, image: e.target.value })}
                        placeholder="https://example.com/image.jpg"
                      />
                      <span className="text-slate-450 block mt-1.5 text-[11px]">
                        Nhập URL ảnh đại diện cho sản phẩm.
                      </span>
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-[550px] max-h-[90vh] flex flex-col overflow-hidden animate-slide-up">
            <div className="bg-slate-50 border-b border-slate-100 px-5 py-4 flex justify-between items-center">
              <h5 className="font-bold text-slate-800 text-base m-0 flex items-center gap-2">
                <i className="fa fa-envelope-open-text text-red-500"></i> Đăng ký khách hàng quan tâm
              </h5>
              <button className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 w-8 h-8 rounded-lg flex items-center justify-center transition-colors" onClick={() => setShowInterestModal(false)}>
                <i className="fa fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleSubmitInterest} className="flex flex-col grow overflow-hidden">
              <div className="p-6 overflow-y-auto text-[13.5px] grow">
                <div className="mb-4">
                  <label className="block font-semibold text-xs text-slate-500 mb-1.5">Sản phẩm quan tâm</label>
                  <input
                    type="text"
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2 text-[13.5px] text-slate-600 focus:outline-none"
                    value={selectedProduct.name}
                    readOnly
                  />
                </div>

                <div className="mb-4">
                  <label className="block font-semibold text-xs text-slate-500 mb-1.5">Họ tên khách hàng <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[13.5px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all"
                    placeholder="Ví dụ: Nguyễn Văn A"
                    value={interestForm.customerName}
                    onChange={(e) => setInterestForm({ ...interestForm, customerName: e.target.value })}
                    required
                    disabled={submittingInterest}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block font-semibold text-xs text-slate-500 mb-1.5">Số điện thoại <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[13.5px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all"
                      placeholder="Ví dụ: 0987654321"
                      value={interestForm.phone}
                      onChange={(e) => setInterestForm({ ...interestForm, phone: e.target.value })}
                      required
                      disabled={submittingInterest}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-xs text-slate-500 mb-1.5">Email (nếu có)</label>
                    <input
                      type="email"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[13.5px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all"
                      placeholder="customer@email.com"
                      value={interestForm.email}
                      onChange={(e) => setInterestForm({ ...interestForm, email: e.target.value })}
                      disabled={submittingInterest}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[13.5px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all cursor-pointer"
                      value={interestForm.sourceChannel}
                      onChange={(e) => setInterestForm({ ...interestForm, sourceChannel: e.target.value })}
                      disabled={submittingInterest}
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

                <div className="mb-2">
                  <label className="block font-semibold text-xs text-slate-500 mb-1.5">Nhu cầu cụ thể / Ghi chú</label>
                  <textarea
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[13.5px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all"
                    rows="3"
                    placeholder="Nhập yêu cầu đặc biệt của khách hàng hoặc khu giờ liên hệ phù hợp..."
                    value={interestForm.note}
                    onChange={(e) => setInterestForm({ ...interestForm, note: e.target.value })}
                    disabled={submittingInterest}
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-4 border-t border-slate-100 flex gap-3 justify-end">
                <button type="button" className="bg-transparent hover:bg-slate-150 text-slate-650 border border-slate-250 text-xs font-semibold py-2 px-4 rounded-xl transition-colors" onClick={() => setShowInterestModal(false)} disabled={submittingInterest}>
                  Hủy bỏ
                </button>
                <button type="button" className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold py-2 px-4 rounded-xl transition-colors" onClick={handleTestSendInterest} disabled={submittingInterest}>
                  {submittingInterest ? "Đang gửi..." : "Gửi thử (CRM)"}
                </button>
                <button type="submit" className="bg-cyan-900 hover:bg-cyan-950 text-white text-xs font-semibold py-2 px-5 rounded-xl transition-colors" disabled={submittingInterest}>
                  {submittingInterest ? "Đang gửi..." : "Gửi"}
                </button>
              </div>
            </form>
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