import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { API_BASE_URL } from "../config/api";
import { authFetch, getAuthHeaders } from "../auth/session";
import { ToastDispatchContext, useToast } from "./ToastContext";

const STATIC_BASE_URL = API_BASE_URL.replace("/api/v1", "");

// ==========================================
// TOAST PROVIDER (LOCAL TO PRODUCT MANAGEMENT)
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
      <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5 text-cyan-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-lg ${STYLES[t.type] || STYLES.info}`}
          >
            {ICONS[t.type] || ICONS.info}
            <div className="flex-1 min-w-0">
              {t.title && <p className="text-sm font-semibold text-slate-800 mb-0.5">{t.title}</p>}
              <p className="text-xs text-slate-600 leading-relaxed">{t.message}</p>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0 mt-0.5"
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
// CONFIRM MODAL (LOCAL TO PRODUCT MANAGEMENT)
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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[3px] flex items-center justify-center p-4 z-[9998] animate-[fadeIn_0.15s_ease-out]">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 w-10 h-10 rounded-full ${s.bg} flex items-center justify-center`}>
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

  // Lọc sạch phần visaCode bị nối tự động trong name khi lưu (nếu có dạng "Tên - VisaCode")
  let cleanName = apiProduct.name || "";
  if (apiProduct.visaCode && cleanName.includes(apiProduct.visaCode)) {
    cleanName = cleanName.split(` - ${apiProduct.visaCode}`)[0] || cleanName;
  } else if (cleanName.includes(" - ")) {
    cleanName = cleanName.split(" - ")[0] || cleanName;
  }

  return {
    id,
    name: cleanName.trim(),
    fullName: apiProduct.name || "",
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

const mapApiCategoryToUiCategory = (apiCategory) => {
  if (!apiCategory) return null;
  const id = apiCategory._id || apiCategory.id || "";
  const name = apiCategory.name || "";
  const description = apiCategory.description || "";
  const status = apiCategory.status || (apiCategory.isActive === false ? "inactive" : "active");
  const updatedAt = apiCategory.updatedAt || "";
  return {
    id,
    name,
    description,
    status,
    updatedAt,
    programs: []
  };
};

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

const resolveCountryName = (value) => {
  if (!value) return "";
  const upper = value.trim().toUpperCase();
  return COUNTRY_CODE_MAP[upper] || value.trim();
};

const apiRequest = async (url, options = {}) => {
  const headers = {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
    ...(options.headers || {})
  };
  const response = await authFetch(url, { ...options, headers });
  if (!response.ok) {
    const text = await response.text();
    let msg = `Lỗi máy chủ (${response.status})`;
    try {
      const body = JSON.parse(text);
      msg = body?.message || body?.error || msg;
    } catch { }
    throw new Error(msg);
  }
  const text = await response.text();
  return text ? JSON.parse(text) : null;
};

const isValidUrl = (str) => {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
};

const normalizeUrl = (str) => {
  let u = str.trim();
  if (!/^https?:\/\//i.test(u)) {
    u = "https://" + u;
  }
  return u;
};

export function ProductManagementPageContent({ currentUser }) {
  const toast = useToast();

  // Data States
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [currentPageNum, setCurrentPageNum] = useState(1);
  const itemsPerPage = 10;

  // CRUD Editing Modals
  const [editingProduct, setEditingProduct] = useState(null); // 'new' or ID
  const [editingCategory, setEditingCategory] = useState(null); // 'new' or ID
  const [activeProductTab, setActiveProductTab] = useState("basic");

  // Form states
  const [formProduct, setFormProduct] = useState({
    id: "",
    name: "",
    categoryId: "",
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
    gradientFrom: "#0d2040",
    gradientTo: "#1a3a6b",
    visaCode: "",
    shortCode: "",
    purpose: ""
  });

  const [formCategory, setFormCategory] = useState({
    id: "",
    name: "",
    description: "",
    status: "active"
  });

  // Brochure/Documents link additions
  const [brochureLinkInput, setBrochureLinkInput] = useState("");
  const [docLinkNameInput, setDocLinkNameInput] = useState("");
  const [docLinkUrlInput, setDocLinkUrlInput] = useState("");
  const [docLinkTypeInput, setDocLinkTypeInput] = useState("Checklist");

  // Confirm Modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmLabel: "Xác nhận",
    cancelLabel: "Hủy",
    variant: "danger",
    onConfirm: () => { }
  });

  const showConfirm = (options) => {
    setConfirmModal({
      isOpen: true,
      title: options.title || "",
      message: options.message || "",
      confirmLabel: options.confirmLabel || "Xác nhận",
      cancelLabel: options.cancelLabel || "Hủy",
      variant: options.variant || "danger",
      onConfirm: options.onConfirm
    });
  };

  const closeConfirm = () => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
  };

  // Fetch API
  const fetchData = async () => {
    try {
      setLoading(true);
      const [categoriesData, productsData] = await Promise.all([
        apiRequest(`${API_BASE_URL}/product-categories`),
        apiRequest(`${API_BASE_URL}/products`)
      ]);

      const cats = Array.isArray(categoriesData?.data) ? categoriesData.data : (Array.isArray(categoriesData) ? categoriesData : []);
      const prods = Array.isArray(productsData?.data) ? productsData.data : (Array.isArray(productsData) ? productsData : []);

      const normalizedCats = cats.map(mapApiCategoryToUiCategory).filter(Boolean);
      setCategories(normalizedCats);

      const normalizedProds = prods.map(p => {
        const catName = normalizedCats.find(c => c.id === p.categoryId)?.name || "";
        return mapApiProductToUiProduct(p, p.categoryId, catName);
      }).filter(Boolean);

      setProducts(normalizedProds);
    } catch (err) {
      toast.error(err.message, "Lỗi đồng bộ dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered & Paginated lists
  const filteredProducts = useMemo(() => {
    return products.filter(prod => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q ||
        (prod.name || "").toLowerCase().includes(q) ||
        (prod.country || "").toLowerCase().includes(q) ||
        (prod.shortCode || "").toLowerCase().includes(q) ||
        (prod.visaCode || "").toLowerCase().includes(q) ||
        (prod.purpose || "").toLowerCase().includes(q);

      const matchCategory = selectedCategoryFilter === "all" || prod.categoryId === selectedCategoryFilter;

      const matchStatus = selectedStatusFilter === "all" ||
        (selectedStatusFilter === "active" && prod.isActive) ||
        (selectedStatusFilter === "inactive" && !prod.isActive);

      return matchSearch && matchCategory && matchStatus;
    });
  }, [products, searchQuery, selectedCategoryFilter, selectedStatusFilter]);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPageNum - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPageNum]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;

  // Actions
  const handleOpenNewProduct = () => {
    setFormProduct({
      id: "new",
      name: "",
      categoryId: categories[0]?.id || "",
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
      gradientFrom: "#0d2040",
      gradientTo: "#1a3a6b",
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
    setFormProduct({
      id: prod.id,
      name: prod.name,
      categoryId: prod.categoryId,
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

  const handleSaveProduct = async (e) => {
    e.preventDefault();
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

    const apiPayload = {
      name: formProduct.name,
      categoryId: formProduct.categoryId,
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
      purpose: formProduct.purpose || ""
    };

    try {
      let response;
      if (editingProduct === "new") {
        response = await apiRequest(`${API_BASE_URL}/products`, { method: "POST", body: JSON.stringify(apiPayload) });
      } else {
        response = await apiRequest(`${API_BASE_URL}/products/${editingProduct}`, { method: "PATCH", body: JSON.stringify(apiPayload) });
      }

      const normalized = response?.data || response;
      const catName = categories.find(c => c.id === formProduct.categoryId)?.name || "";
      const savedProd = mapApiProductToUiProduct(normalized, formProduct.categoryId, catName);

      if (editingProduct === "new") {
        setProducts(prev => [savedProd, ...prev]);
        toast.success(`Đã thêm sản phẩm "${savedProd.fullName}" thành công!`, "Thành công");
      } else {
        setProducts(prev => prev.map(p => p.id === editingProduct ? savedProd : p));
        toast.success(`Đã cập nhật sản phẩm "${savedProd.fullName}" thành công!`, "Thành công");
      }
      setEditingProduct(null);
    } catch (err) {
      toast.error(err.message, "Lỗi lưu sản phẩm");
    }
  };

  const handleDeleteProduct = (prodId, prodName) => {
    showConfirm({
      title: "Xóa sản phẩm",
      message: `Bạn có chắc chắn muốn xóa sản phẩm "${prodName}"? Thao tác này không thể hoàn tác.`,
      confirmLabel: "Xóa sản phẩm",
      variant: "danger",
      onConfirm: async () => {
        closeConfirm();
        try {
          await apiRequest(`${API_BASE_URL}/products/${prodId}`, { method: "DELETE" });
          setProducts(prev => prev.filter(p => p.id !== prodId));
          toast.success("Đã xóa sản phẩm thành công", "Xóa thành công");
        } catch (err) {
          toast.error(err.message, "Lỗi xóa sản phẩm");
        }
      }
    });
  };

  // Categories CRUD
  const handleOpenNewCategory = () => {
    setFormCategory({
      id: "new",
      name: "",
      description: "",
      status: "active"
    });
    setEditingCategory("new");
  };

  const handleEditCategory = (cat) => {
    setFormCategory({
      id: cat.id,
      name: cat.name,
      description: cat.description || "",
      status: cat.status || "active"
    });
    setEditingCategory(cat.id);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!formCategory.name.trim()) {
      toast.warning("Tên danh mục không được để trống!", "Thiếu thông tin");
      return;
    }

    const apiPayload = {
      name: formCategory.name.trim(),
      description: formCategory.description.trim(),
      isActive: formCategory.status === "active"
    };

    try {
      let response;
      if (editingCategory === "new") {
        response = await apiRequest(`${API_BASE_URL}/product-categories`, { method: "POST", body: JSON.stringify(apiPayload) });
      } else {
        response = await apiRequest(`${API_BASE_URL}/product-categories/${editingCategory}`, { method: "PATCH", body: JSON.stringify(apiPayload) });
      }

      const savedCat = mapApiCategoryToUiCategory(response?.data || response);

      if (editingCategory === "new") {
        setCategories(prev => [...prev, savedCat]);
        toast.success(`Đã thêm danh mục "${savedCat.name}" thành công!`, "Thành công");
      } else {
        setCategories(prev => prev.map(c => c.id === editingCategory ? savedCat : c));
        toast.success(`Đã cập nhật danh mục "${savedCat.name}" thành công!`, "Thành công");
      }
      setEditingCategory(null);
    } catch (err) {
      toast.error(err.message, "Lỗi lưu danh mục");
    }
  };

  const handleDeleteCategory = (catId, catName) => {
    showConfirm({
      title: "Xóa danh mục",
      message: `Bạn có chắc chắn muốn xóa danh mục "${catName}" không? Tất cả các sản phẩm thuộc danh mục này cũng sẽ bị ảnh hưởng.`,
      confirmLabel: "Xóa danh mục",
      variant: "danger",
      onConfirm: async () => {
        closeConfirm();
        try {
          await apiRequest(`${API_BASE_URL}/product-categories/${catId}`, { method: "DELETE" });
          setCategories(prev => prev.filter(c => c.id !== catId));
          toast.success("Đã xóa danh mục thành công", "Xóa thành công");
        } catch (err) {
          toast.error(err.message, "Lỗi xóa danh mục");
        }
      }
    });
  };

  // Link additions logic
  const handleAddBrochureLink = () => {
    if (!brochureLinkInput.trim() || !isValidUrl(brochureLinkInput)) {
      toast.warning("Vui lòng nhập link brochure hợp lệ.", "Link không hợp lệ");
      return;
    }
    const finalUrl = normalizeUrl(brochureLinkInput);
    setFormProduct(prev => ({
      ...prev,
      brochure: {
        id: `brochure-link-${Date.now()}`,
        name: "Tài liệu Brochure chương trình",
        type: "Brochure",
        sourceType: "link",
        fileType: "LINK",
        size: "",
        url: finalUrl,
        updatedAt: new Date().toISOString().split("T")[0]
      }
    }));
    setBrochureLinkInput("");
    toast.success("Đã thêm liên kết tài liệu quảng bá (Brochure)", "Thành công");
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
    toast.success("Đã thêm liên kết tài liệu tư vấn", "Thành công");
  };

  const deleteProductDoc = (docId) => {
    setFormProduct(prev => ({
      ...prev,
      documents: (prev.documents || []).filter(d => d.id !== docId)
    }));
    toast.success("Đã xóa liên kết tài liệu", "Thành công");
  };

  if (loading) {
    return (
      <div className="w-full py-20 text-center flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-cyan-200 border-t-cyan-900" role="status">
          <span className="sr-only">Đang tải...</span>
        </div>
        <p className="mt-4 text-slate-500 text-sm">Đang tải cơ sở dữ liệu sản phẩm HTO...</p>
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

      <div className="w-full max-w-[1600px] mx-auto px-4 pt-2 md:pt-4 pb-6">

        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-2">
          <div>
            <h1 className="text-[30px] md:text-xl font-bold text-slate-900 app-dark:!text-slate-100 m-0">
              Quản lý sản phẩm & dịch vụ HTO
            </h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleOpenNewCategory}
              className="border border-cyan-900 hover:bg-cyan-50 text-cyan-900 app-dark:border-cyan-400 app-dark:text-cyan-400 text-xs font-semibold px-4 py-2 rounded-xl force-rounded-xl transition-all duration-200 cursor-pointer"
            >
              + Danh mục mới
            </button>
            <button
              onClick={handleOpenNewProduct}
              className="bg-cyan-900 hover:bg-cyan-950 text-white text-xs font-semibold px-4 py-2 flex items-center gap-2 shadow-sm rounded-xl force-rounded-xl transition-all duration-200 cursor-pointer"
            >
              + Thêm sản phẩm
            </button>
          </div>
        </div>

        {/* SEARCH AND FILTERS */}
        <div className="app-dark:!bg-[#1e1e1e] app-dark:!border-slate-800 rounded-2xl p-2 mb-2 flex flex-col md:flex-row gap-3">
          <div className="flex-1 flex gap-2 w-full">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Tìm theo tên sản phẩm, quốc gia, mã Visa, mã ngắn..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPageNum(1);
                }}
                className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all"
              />
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Mobile Filter Toggle Icon Button */}
            <button
              type="button"
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className={`md:hidden w-10 h-10 flex items-center justify-center border rounded-xl transition-all cursor-pointer ${showMobileFilters
                ? "bg-cyan-900 border-cyan-900 text-white shadow-sm"
                : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                }`}
              title="Bộ lọc nâng cao"
            >
              <i className="fa fa-sliders-h text-sm"></i>
            </button>
          </div>

          {/* Filters Select Dropdowns */}
          <div className={`${showMobileFilters ? "flex" : "hidden"} md:flex flex-col md:flex-row gap-3 w-full md:w-auto`}>
            <div className="w-full md:w-56">
              <select
                value={selectedCategoryFilter}
                onChange={(e) => {
                  setSelectedCategoryFilter(e.target.value);
                  setCurrentPageNum(1);
                }}
                className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm text-slate-700 cursor-pointer focus:outline-none"
              >
                <option value="all">Tất cả danh mục</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="w-full md:w-48">
              <select
                value={selectedStatusFilter}
                onChange={(e) => {
                  setSelectedStatusFilter(e.target.value);
                  setCurrentPageNum(1);
                }}
                className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm text-slate-700 cursor-pointer focus:outline-none"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Đang hoạt động</option>
                <option value="inactive">Tạm ngưng</option>
              </select>
            </div>
          </div>
        </div>

        {/* PRODUCTS DATA TABLE (DESKTOP MODE) */}
        <div className="hidden lg:block bg-white app-dark:!bg-[#1e1e1e] border border-slate-200 app-dark:!border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="table-responsive !overflow-x-hidden">
            <table className="w-full text-left border-collapse text-[13px] table-fixed">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider whitespace-nowrap">
                  <th className="py-2.5 px-3 w-[21%] truncate" title="Tên sản phẩm">Tên sản phẩm</th>
                  <th className="py-2.5 px-3 w-[8%] truncate" title="Mã ngắn">Mã ngắn</th>
                  <th className="py-2.5 px-3 w-[11%] truncate" title="Quốc gia">Quốc gia</th>
                  <th className="py-2.5 px-3 w-[10%] truncate" title="Danh mục">Danh mục</th>
                  <th className="py-2.5 px-3 w-[14%] truncate" title="Mã Visa">Mã Visa</th>
                  <th className="py-2.5 px-3 w-[13%] truncate" title="Mục đích">Mục đích</th>
                  <th className="py-2.5 px-3 w-[13%] truncate" title="Tài liệu">Tài liệu</th>
                  <th className="py-2.5 px-3 w-[10%] truncate" title="Trạng thái">Trạng thái</th>
                  <th className="py-2.5 px-3 w-[10%] text-center truncate" title="Thao tác">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginatedProducts.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="py-2 px-3">
                      <div className="font-semibold text-slate-900 app-dark:!text-slate-100 truncate" title={prod.name}>
                        {prod.name}
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <span className="bg-cyan-50 text-cyan-800 border border-cyan-100 text-[11px] px-1.5 py-0.5 rounded font-mono font-semibold block truncate text-center" title={prod.shortCode || ""}>
                        {prod.shortCode || "-"}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <div className="text-slate-650 truncate" title={`${resolveCountryName(prod.country)} (${prod.region})`}>
                        {resolveCountryName(prod.country)} <span className="text-slate-400 text-xs">({prod.region})</span>
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <div className="text-slate-600 truncate" title={prod.categoryName || ""}>
                        {prod.categoryName || "-"}
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      {prod.visaCode ? (
                        <span className="bg-indigo-50 text-indigo-800 border border-indigo-100 text-[11px] px-1.5 py-0.5 rounded font-mono font-semibold block truncate text-center" title={prod.visaCode}>
                          {prod.visaCode}
                        </span>
                      ) : (
                        <span className="text-slate-350">-</span>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      <div className="text-slate-600 truncate" title={prod.purpose || ""}>
                        {prod.purpose || <span className="text-slate-350">-</span>}
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <div className="text-xs text-slate-500 font-medium truncate" title={`${prod.brochure ? 1 : 0} Brochure / ${prod.documents?.length || 0} Tư vấn`}>
                        <i className="fa fa-file-pdf text-red-500 mr-1 flex-shrink-0"></i>
                        {prod.brochure ? 1 : 0} Br / {prod.documents?.length || 0} Tv
                      </div>
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      {prod.isActive ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-750 border border-emerald-100 text-[11.5px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 flex-shrink-0"></span> Đang hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 border border-slate-200 text-[11.5px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0"></span> Tạm ngưng
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center whitespace-nowrap">
                      <div className="flex justify-center gap-1.5">
                        <button
                          onClick={() => handleEditProduct(prod)}
                          className="w-8 h-8 rounded-lg border border-slate-200 hover:border-cyan-300 text-slate-500 hover:text-cyan-900 flex items-center justify-center transition-all cursor-pointer bg-white"
                          title="Chỉnh sửa sản phẩm"
                        >
                          <i className="fa fa-pen text-xs"></i>
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(prod.id, prod.fullName)}
                          className="w-8 h-8 rounded-lg border border-slate-200 hover:border-red-300 text-slate-500 hover:text-red-655 flex items-center justify-center transition-all cursor-pointer bg-white"
                          title="Xóa sản phẩm"
                        >
                          <i className="fa fa-trash text-xs"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan="9" className="py-8 text-center text-slate-400 font-medium">
                      Không tìm thấy sản phẩm nào phù hợp với bộ lọc hiện tại.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* PRODUCTS CARDS (MOBILE & TABLET MODE) */}
        <div className="block lg:hidden space-y-3">
          {paginatedProducts.map((prod) => (
            <div
              key={prod.id}
              className="bg-white app-dark:!bg-[#1e1e1e] border border-slate-200 app-dark:!border-slate-800 rounded-xl p-4 shadow-sm"
            >
              {/* Card Header: Name & Quick info */}
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 app-dark:!border-slate-800 pb-2.5 mb-2.5">
                <div className="min-w-0">
                  <h5 className="font-bold text-slate-900 app-dark:!text-slate-100 text-[14px] m-0 leading-snug">
                    {prod.name}
                  </h5>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    <span className="bg-cyan-50 text-cyan-800 border border-cyan-100 text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold">
                      {prod.shortCode || "-"}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      • {resolveCountryName(prod.country)} ({prod.region})
                    </span>
                  </div>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => handleEditProduct(prod)}
                    className="w-7 h-7 rounded border border-slate-200 text-slate-500 hover:text-cyan-900 flex items-center justify-center bg-white cursor-pointer"
                    title="Chỉnh sửa"
                  >
                    <i className="fa fa-pen text-[11px]"></i>
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(prod.id, prod.fullName)}
                    className="w-7 h-7 rounded border border-slate-200 text-slate-500 hover:text-red-600 flex items-center justify-center bg-white cursor-pointer"
                    title="Xóa"
                  >
                    <i className="fa fa-trash text-[11px]"></i>
                  </button>
                </div>
              </div>

              {/* Card Details: 2 columns grid */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-[12px] text-slate-600 app-dark:!text-slate-400">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold tracking-wider">Danh mục</span>
                  <span className="text-slate-850 app-dark:!text-slate-200 font-semibold">{prod.categoryName || "-"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold tracking-wider">Mã Visa</span>
                  <span className="text-slate-850 app-dark:!text-slate-200 font-mono font-semibold truncate block" title={prod.visaCode}>
                    {prod.visaCode || "-"}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold tracking-wider">Mục đích</span>
                  <span className="text-slate-850 app-dark:!text-slate-200 font-medium truncate block" title={prod.purpose}>
                    {prod.purpose || "-"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold tracking-wider">Tài liệu</span>
                  <span className="text-slate-850 app-dark:!text-slate-200 font-medium flex items-center gap-1">
                    <i className="fa fa-file-pdf text-red-500 text-xs"></i>
                    {prod.brochure ? 1 : 0} Br / {prod.documents?.length || 0} Tv
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold tracking-wider">Trạng thái</span>
                  {prod.isActive ? (
                    <span className="inline-flex items-center gap-1.5 text-emerald-600 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Đang hoạt động
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-slate-500 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Tạm ngưng
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filteredProducts.length === 0 && (
            <div className="text-center text-slate-400 py-8 bg-white app-dark:!bg-[#1e1e1e] border border-slate-200 app-dark:!border-slate-800 rounded-xl">
              Không tìm thấy sản phẩm nào phù hợp với bộ lọc.
            </div>
          )}
        </div>

        {/* RESPONSIVE COMMON PAGINATION */}
        {totalPages > 1 && (
          <div className="bg-white app-dark:!bg-[#1e1e1e] border border-slate-200 app-dark:!border-slate-800 rounded-2xl p-4 mt-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-slate-500 text-xs text-center sm:text-left">
              Hiển thị {(currentPageNum - 1) * itemsPerPage + 1}-
              {Math.min(currentPageNum * itemsPerPage, filteredProducts.length)} trong{" "}
              {filteredProducts.length} sản phẩm
            </span>
            <div className="flex gap-1.5 flex-wrap justify-center">
              <button
                onClick={() => setCurrentPageNum(p => Math.max(1, p - 1))}
                disabled={currentPageNum === 1}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-650 hover:bg-slate-50 disabled:opacity-50 transition-colors cursor-pointer"
              >
                Trước
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPageNum(page)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${page === currentPageNum
                    ? "bg-cyan-900 text-white"
                    : "border border-slate-200 text-slate-650 hover:bg-slate-50"
                    }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPageNum(p => Math.min(totalPages, p + 1))}
                disabled={currentPageNum === totalPages}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-650 hover:bg-slate-50 disabled:opacity-50 transition-colors cursor-pointer"
              >
                Sau
              </button>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* PRODUCT EDIT MODAL */}
        {/* ========================================== */}
        {editingProduct && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[3px] flex justify-end z-[9997] animate-[fadeIn_0.2s_ease-out]">
            <div className="bg-white app-dark:!bg-[#1a1a1a] w-full max-w-2xl h-full flex flex-col shadow-2xl animate-[slideInRight_0.25s_cubic-bezier(0.16,1,0.3,1)]">

              {/* Modal Header */}
              <div className="p-5 border-b border-slate-200 app-dark:!border-slate-800 flex items-center justify-between bg-slate-50/50 app-dark:!bg-[#151515]">
                <div>
                  <h4 className="font-bold text-slate-800 app-dark:!text-slate-100 text-sm m-0">
                    {editingProduct === "new" ? "Tạo sản phẩm mới" : "Chỉnh sửa thông tin sản phẩm"}
                  </h4>
                  <p className="text-slate-500 app-dark:!text-slate-400 text-xs m-0 mt-0.5">
                    {editingProduct === "new" ? "Nhập thông tin ban đầu cho chương trình" : `Cấu hình sản phẩm ID: ${editingProduct}`}
                  </p>
                </div>
                <button
                  onClick={() => setEditingProduct(null)}
                  className="text-slate-400 hover:text-slate-650 bg-slate-100 hover:bg-slate-200 w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                >
                  <i className="fa fa-times"></i>
                </button>
              </div>

              {/* Form container */}
              <form onSubmit={handleSaveProduct} className="flex flex-col flex-grow overflow-hidden m-0">

                {/* Form Tabs Bar */}
                <div className="flex px-6 border-b border-slate-150 app-dark:!border-slate-800 gap-6">
                  <button
                    type="button"
                    className={`border-b-2 px-1 py-3 text-[13.5px] font-semibold transition-all duration-200 ${activeProductTab === "basic" ? "text-cyan-900 border-cyan-900" : "text-slate-450 border-transparent hover:text-slate-650"
                      }`}
                    onClick={() => setActiveProductTab("basic")}
                  >
                    <i className="fa fa-info-circle mr-1.5"></i> 1. Thông tin chung
                  </button>
                  <button
                    type="button"
                    className={`border-b-2 px-1 py-3 text-[13.5px] font-semibold transition-all duration-200 ${activeProductTab === "details" ? "text-cyan-900 border-cyan-900" : "text-slate-455 border-transparent hover:text-slate-655"
                      }`}
                    onClick={() => setActiveProductTab("details")}
                  >
                    <i className="fa fa-align-left mr-1.5"></i> 2. Chi tiết & Lộ trình
                  </button>
                  <button
                    type="button"
                    className={`border-b-2 px-1 py-3 text-[13.5px] font-semibold transition-all duration-200 ${activeProductTab === "docs" ? "text-cyan-900 border-cyan-900" : "text-slate-455 border-transparent hover:text-slate-655"
                      }`}
                    onClick={() => setActiveProductTab("docs")}
                  >
                    <i className="fa fa-file-pdf mr-1.5"></i> 3. Tài liệu tư vấn ({formProduct.brochure ? 1 : 0} Brochure / {formProduct.documents?.length || 0} Tư vấn)
                  </button>
                </div>

                {/* Form Scrollable Area */}
                <div className="p-6 overflow-y-auto text-[13.5px] flex-grow">

                  {/* TAB 1: BASIC */}
                  {activeProductTab === "basic" && (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

                      <div className="md:col-span-6">
                        <label className="block font-semibold text-xs text-slate-500 mb-1.5">Tên sản phẩm <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[13.5px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-900/10"
                          value={formProduct.name}
                          onChange={(e) => setFormProduct({ ...formProduct, name: e.target.value })}
                          placeholder="Ví dụ: Du học nghề Đức"
                          required
                        />
                      </div>

                      <div className="md:col-span-6">
                        <label className="block font-semibold text-xs text-slate-500 mb-1.5">Thuộc danh mục lớn <span className="text-red-500">*</span></label>
                        <select
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[13.5px] text-slate-700 cursor-pointer focus:outline-none"
                          value={formProduct.categoryId}
                          onChange={(e) => setFormProduct({ ...formProduct, categoryId: e.target.value })}
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
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[13.5px] text-slate-700 placeholder-slate-400 focus:outline-none"
                          value={formProduct.country}
                          onChange={(e) => setFormProduct({ ...formProduct, country: e.target.value })}
                          placeholder="Ví dụ: Đức"
                          required
                        />
                      </div>

                      <div className="col-span-1 md:col-span-4">
                        <label className="block font-semibold text-xs text-slate-500 mb-1.5">Khu vực địa lý</label>
                        <select
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[13.5px] text-slate-700 cursor-pointer focus:outline-none"
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
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[13.5px] text-slate-700 cursor-pointer focus:outline-none"
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
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[13.5px] text-slate-700 placeholder-slate-400 focus:outline-none"
                          value={formProduct.visaCode || ""}
                          onChange={(e) => setFormProduct({ ...formProduct, visaCode: e.target.value })}
                          placeholder="Ví dụ: DE-STUDY-LANG-D41"
                        />
                      </div>

                      <div className="col-span-1 md:col-span-4">
                        <label className="block font-semibold text-xs text-slate-500 mb-1.5">Mã ngắn nội bộ (shortCode)</label>
                        <input
                          type="text"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[13.5px] text-slate-700 placeholder-slate-400 focus:outline-none"
                          value={formProduct.shortCode || ""}
                          onChange={(e) => setFormProduct({ ...formProduct, shortCode: e.target.value })}
                          placeholder="Ví dụ: VIS-DE-01"
                        />
                      </div>

                      <div className="col-span-1 md:col-span-4">
                        <label className="block font-semibold text-xs text-slate-500 mb-1.5">Mục đích phân loại (purpose)</label>
                        <input
                          type="text"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[13.5px] text-slate-700 placeholder-slate-400 focus:outline-none"
                          value={formProduct.purpose || ""}
                          onChange={(e) => setFormProduct({ ...formProduct, purpose: e.target.value })}
                          placeholder="Ví dụ: Du học nghề Đức"
                        />
                      </div>

                      <div className="md:col-span-12">
                        <label className="block font-semibold text-xs text-slate-500 mb-1.5">Ảnh đại diện sản phẩm (URL)</label>
                        <input
                          type="text"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[13.5px] text-slate-700 placeholder-slate-400 focus:outline-none"
                          value={formProduct.image || ""}
                          onChange={(e) => setFormProduct({ ...formProduct, image: e.target.value })}
                          placeholder="Ví dụ: /uploads/1718001092-germany.jpg"
                        />
                      </div>

                      <div className="md:col-span-6">
                        <label className="block font-semibold text-xs text-slate-500 mb-1.5">Phí dịch vụ HTO (VND/USD)</label>
                        <input
                          type="number"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[13.5px] text-slate-700"
                          value={formProduct.serviceFee}
                          onChange={(e) => setFormProduct({ ...formProduct, serviceFee: Number(e.target.value) })}
                        />
                      </div>

                      <div className="md:col-span-6">
                        <label className="block font-semibold text-xs text-slate-500 mb-1.5">Đơn vị tiền tệ</label>
                        <select
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[13.5px] text-slate-700 cursor-pointer focus:outline-none"
                          value={formProduct.currency}
                          onChange={(e) => setFormProduct({ ...formProduct, currency: e.target.value })}
                        >
                          <option value="VND">VND (Việt Nam Đồng)</option>
                          <option value="USD">USD (Đô la Mỹ)</option>
                          <option value="EUR">EUR (Euro)</option>
                        </select>
                      </div>

                      <div className="md:col-span-12">
                        <label className="block font-semibold text-xs text-slate-500 mb-1.5">Liên kết ngoài (Website giới thiệu)</label>
                        <input
                          type="text"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[13.5px] text-slate-700 placeholder-slate-400 focus:outline-none"
                          value={formProduct.websiteUrl}
                          onChange={(e) => setFormProduct({ ...formProduct, websiteUrl: e.target.value })}
                          placeholder="https://example.com/study-germany"
                        />
                      </div>

                    </div>
                  )}

                  {/* TAB 2: DETAILS & STEPS */}
                  {activeProductTab === "details" && (
                    <div className="space-y-4">

                      <div>
                        <label className="block font-semibold text-xs text-slate-500 mb-1.5">Mô tả ngắn gọn (Hiển thị ngoài card)</label>
                        <textarea
                          rows={2}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[13.5px] text-slate-700 placeholder-slate-450 focus:outline-none"
                          value={formProduct.description}
                          onChange={(e) => setFormProduct({ ...formProduct, description: e.target.value })}
                          placeholder="Mô tả tóm tắt dịch vụ..."
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-xs text-slate-500 mb-1.5">Giới thiệu chương trình chi tiết</label>
                        <textarea
                          rows={4}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[13.5px] text-slate-700 placeholder-slate-455 focus:outline-none"
                          value={formProduct.detailDescription}
                          onChange={(e) => setFormProduct({ ...formProduct, detailDescription: e.target.value })}
                          placeholder="Mô tả cụ thể về chương trình, ưu thế..."
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-xs text-slate-500 mb-1.5">Đối tượng phù hợp</label>
                        <input
                          type="text"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[13.5px] text-slate-700 placeholder-slate-400 focus:outline-none"
                          value={formProduct.targetAudience}
                          onChange={(e) => setFormProduct({ ...formProduct, targetAudience: e.target.value })}
                          placeholder="Ví dụ: Học sinh 18-28 tuổi, đã tốt nghiệp THPT"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-xs text-slate-500 mb-1.5">Các điều kiện / Điểm nổi bật (Nhập mỗi điều kiện trên 1 dòng)</label>
                        <textarea
                          rows={4}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[13.5px] text-slate-700 font-mono"
                          value={formProduct.highlightsText}
                          onChange={(e) => setFormProduct({ ...formProduct, highlightsText: e.target.value })}
                          placeholder="Tốt nghiệp THPT&#10;Độ tuổi: 18 - 30 tuổi&#10;Tiếng Đức trình độ B1"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-xs text-slate-500 mb-1.5">Các bước quy trình (Nhập mỗi bước trên 1 dòng)</label>
                        <textarea
                          rows={4}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[13.5px] text-slate-700 font-mono"
                          value={formProduct.processStepsText}
                          onChange={(e) => setFormProduct({ ...formProduct, processStepsText: e.target.value })}
                          placeholder="Bước 1: Tư vấn và thẩm định hồ sơ&#10;Bước 2: Học tiếng Đức và hoàn tất hồ sơ dịch thuật&#10;Bước 3: Xin Visa và chuẩn bị xuất cảnh"
                        />
                      </div>

                    </div>
                  )}

                  {/* TAB 3: DOCUMENTS */}
                  {activeProductTab === "docs" && (
                    <div className="space-y-5">

                      {/* BROCHURE LINK SECTION */}
                      <div className="bg-slate-50 app-dark:!bg-white/5 border border-slate-200 app-dark:!border-slate-800 rounded-xl p-4">
                        <h6 className="font-bold text-slate-800 app-dark:!text-slate-100 text-xs mb-2 uppercase tracking-wide">
                          <i className="fa fa-file-invoice text-cyan-900 mr-1.5"></i> Tài liệu Brochure (Quảng bá)
                        </h6>
                        {formProduct.brochure ? (
                          <div className="flex items-center justify-between bg-white border border-emerald-200 rounded-lg p-2 text-xs">
                            <span className="font-semibold text-emerald-800 truncate pr-4">
                              <i className="fa fa-link mr-1"></i> {formProduct.brochure.url}
                            </span>
                            <button
                              type="button"
                              onClick={() => setFormProduct(prev => ({ ...prev, brochure: null }))}
                              className="text-red-500 hover:text-red-700 text-xs font-semibold px-2 py-1 transition-colors cursor-pointer"
                            >
                              Gỡ bỏ
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={brochureLinkInput}
                              onChange={(e) => setBrochureLinkInput(e.target.value)}
                              placeholder="Nhập đường link tài liệu Brochure..."
                              className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={handleAddBrochureLink}
                              className="bg-cyan-900 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-cyan-950 font-semibold cursor-pointer"
                            >
                              Thêm link
                            </button>
                          </div>
                        )}
                      </div>

                      {/* CONSULTING DOCS & CHECKLISTS SECTION */}
                      <div className="bg-slate-50 app-dark:!bg-white/5 border border-slate-200 app-dark:!border-slate-800 rounded-xl p-4">
                        <h6 className="font-bold text-slate-800 app-dark:!text-slate-100 text-xs mb-3 uppercase tracking-wide">
                          <i className="fa fa-folder-open text-cyan-900 mr-1.5"></i> Tài liệu tư vấn / Checklist hồ sơ
                        </h6>

                        {/* List current attachments */}
                        <div className="space-y-2 mb-4">
                          {(formProduct.documents || []).map((doc) => (
                            <div key={doc.id} className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-2.5 text-xs shadow-sm">
                              <div className="flex flex-col min-w-0 pr-4">
                                <span className="font-bold text-slate-800 truncate">{doc.name}</span>
                                <span className="text-[10px] text-slate-450 mt-0.5">Phân loại: {doc.type} | Link: {doc.url}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => deleteProductDoc(doc.id)}
                                className="text-red-500 hover:text-red-700 text-xs font-semibold px-2 py-1 transition-colors cursor-pointer"
                              >
                                Xóa
                              </button>
                            </div>
                          ))}
                          {(formProduct.documents || []).length === 0 && (
                            <p className="text-center text-slate-450 text-xs py-3 bg-white border border-dashed border-slate-200 rounded-lg m-0">
                              Chưa có tài liệu tư vấn nào được đính kèm.
                            </p>
                          )}
                        </div>

                        {/* Add new attachment form */}
                        <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-3">
                          <p className="font-semibold text-slate-705 text-xs m-0">Đính kèm liên kết mới:</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] text-slate-455 mb-1">Tên tài liệu:</label>
                              <input
                                type="text"
                                value={docLinkNameInput}
                                onChange={(e) => setDocLinkNameInput(e.target.value)}
                                placeholder="Ví dụ: Checklist hồ sơ du học Đức"
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] text-slate-455 mb-1">Phân loại:</label>
                              <select
                                value={docLinkTypeInput}
                                onChange={(e) => setDocLinkTypeInput(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs cursor-pointer focus:outline-none"
                              >
                                <option value="Checklist">Checklist (Danh sách hồ sơ)</option>
                                <option value="Form">Form (Mẫu đơn/Liên kết form)</option>
                                <option value="Brochure">Brochure (Quảng bá)</option>
                                <option value="Quy trình">Quy trình (Nghiệp vụ)</option>
                                <option value="Khác">Khác</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="block text-[11px] text-slate-455 mb-1">Đường dẫn liên kết (Link Google Drive / URL):</label>
                            <input
                              type="text"
                              value={docLinkUrlInput}
                              onChange={(e) => setDocLinkUrlInput(e.target.value)}
                              placeholder="https://drive.google.com/file/d/.../view"
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none"
                            />
                          </div>
                          <div className="flex justify-end pt-1">
                            <button
                              type="button"
                              onClick={handleAddDocLink}
                              className="bg-cyan-900 hover:bg-cyan-950 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer"
                            >
                              + Thêm vào danh sách
                            </button>
                          </div>
                        </div>

                      </div>

                    </div>
                  )}

                </div>

                {/* Modal Footer */}
                <div className="p-4 border-t border-slate-200 app-dark:!border-slate-800 bg-slate-50 app-dark:!bg-[#151515] flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="text-slate-600 border border-slate-250 hover:bg-slate-100 text-xs font-semibold py-2 px-4 rounded-xl transition-all cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="bg-cyan-900 hover:bg-cyan-950 text-white text-xs font-semibold py-2 px-4 rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    Lưu cấu hình
                  </button>
                </div>

              </form>

            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* CATEGORY EDIT MODAL */}
        {/* ========================================== */}
        {editingCategory && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[3px] flex items-center justify-center p-4 z-[9997] animate-[fadeIn_0.15s_ease-out]">
            <div className="bg-white app-dark:!bg-[#1e1e1e] rounded-2xl shadow-xl w-full max-w-md p-6 animate-[slideUp_0.2s_cubic-bezier(0.16,1,0.3,1)]">

              <div className="flex items-center justify-between mb-4">
                <h5 className="font-bold text-slate-850 m-0">
                  {editingCategory === "new" ? "Tạo danh mục mới" : "Chỉnh sửa danh mục"}
                </h5>
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="text-slate-400 hover:text-slate-650 cursor-pointer"
                >
                  <i className="fa fa-times"></i>
                </button>
              </div>

              <form onSubmit={handleSaveCategory} className="space-y-4 m-0">
                <div>
                  <label className="block font-semibold text-xs text-slate-500 mb-1.5">Tên danh mục <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-700 focus:outline-none"
                    value={formCategory.name}
                    onChange={(e) => setFormCategory({ ...formCategory, name: e.target.value })}
                    placeholder="Ví dụ: Visa"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-xs text-slate-500 mb-1.5">Mô tả ngắn</label>
                  <textarea
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-700 focus:outline-none"
                    value={formCategory.description}
                    onChange={(e) => setFormCategory({ ...formCategory, description: e.target.value })}
                    placeholder="Mô tả chức năng/nghiệp vụ chính của danh mục..."
                  />
                </div>

                <div>
                  <label className="block font-semibold text-xs text-slate-500 mb-1.5">Trạng thái hoạt động</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 cursor-pointer focus:outline-none"
                    value={formCategory.status}
                    onChange={(e) => setFormCategory({ ...formCategory, status: e.target.value })}
                  >
                    <option value="active">Đang hoạt động</option>
                    <option value="inactive">Tạm dừng</option>
                  </select>
                </div>

                <div className="flex gap-3 justify-end pt-3">
                  <button
                    type="button"
                    onClick={() => setEditingCategory(null)}
                    className="text-slate-600 border border-slate-200 hover:bg-slate-50 text-xs font-semibold py-2.5 px-4 rounded-xl transition-colors cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="bg-cyan-900 hover:bg-cyan-950 text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-md transition-colors cursor-pointer"
                  >
                    Xác nhận lưu
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

export function ProductManagementPage({ currentUser }) {
  return (
    <ToastProvider>
      <ProductManagementPageContent currentUser={currentUser} />
    </ToastProvider>
  );
}
