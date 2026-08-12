import { useEffect, useState, useMemo } from "react";
import { API_BASE_URL } from "../config/api";
import { authFetch, getAuthHeaders } from "../auth/session";

const ADMIN_ROLE_ID = "69fc5af582ef85451120772a";

// Key dÃ¹ng chung vá»›i ProductOverviewPage.jsx Ä‘á»ƒ truyá»n danh má»¥c Ä‘Æ°á»£c chá»n khi Ä‘iá»u hÆ°á»›ng
const SIDEBAR_CATEGORY_STORAGE_KEY = "hto_selected_product_category";
// Sá»± kiá»‡n dÃ¹ng Ä‘á»ƒ bÃ¡o cho ProductOverviewPage (náº¿u Ä‘Ã£ mount sáºµn) cáº­p nháº­t ngay khi Ä‘á»•i danh má»¥c
const SIDEBAR_CATEGORY_EVENT = "hto:select-product-category";

const COUNTRY_CODE_MAP = {
  AF: "Afghanistan", AL: "Albania", DZ: "Algeria", AR: "Argentina",
  AU: "Ãšc", AT: "Ão", BE: "Bá»‰", BR: "Brazil", KH: "Campuchia",
  CA: "Canada", CL: "Chile", CN: "Trung Quá»‘c", CO: "Colombia",
  HR: "Croatia", CZ: "Cá»™ng hÃ²a SÃ©c", DK: "Äan Máº¡ch", EG: "Ai Cáº­p",
  FI: "Pháº§n Lan", FR: "PhÃ¡p", DE: "Äá»©c", GH: "Ghana", GR: "Hy Láº¡p",
  HK: "Há»“ng KÃ´ng", HU: "Hungary", IN: "áº¤n Äá»™", ID: "Indonesia",
  IR: "Iran", IQ: "Iraq", IE: "Ireland", IL: "Israel", IT: "Ã",
  JP: "Nháº­t Báº£n", JO: "Jordan", KZ: "Kazakhstan", KE: "Kenya",
  KR: "HÃ n Quá»‘c", KW: "Kuwait", LA: "LÃ o", LB: "Lebanon",
  MY: "Malaysia", MX: "Mexico", MA: "Morocco", MM: "Myanmar",
  NL: "HÃ  Lan", NZ: "New Zealand", NG: "Nigeria", NO: "Na Uy",
  PK: "Pakistan", PH: "Philippines", PL: "Ba Lan", PT: "Bá»“ ÄÃ o Nha",
  QA: "Qatar", RO: "Romania", RU: "Nga", SA: "áº¢ Ráº­p XÃª Ãšt",
  SG: "Singapore", ZA: "Nam Phi", ES: "TÃ¢y Ban Nha", LK: "Sri Lanka",
  SE: "Thá»¥y Äiá»ƒn", CH: "Thá»¥y SÄ©", TW: "ÄÃ i Loan", TH: "ThÃ¡i Lan",
  TR: "Thá»• NhÄ© Ká»³", UA: "Ukraine", AE: "UAE", GB: "Anh Quá»‘c",
  US: "Má»¹", VN: "Viá»‡t Nam", YE: "Yemen",
};

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
  "60c72b2f9b1d8b2bad000001": "staff",
};

const normalizeRoleKey = (roleValue) => {
  return String(roleValue || "")
    .trim()
    .toLowerCase()
    .replace(/Ä‘/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
};

const getUserRoleKey = (user) => {
  const roleFromObject = user?.role?.name || user?.roleName || user?.role;
  const roleFromId = ROLE_ID_MAP[user?.roleId];

  return normalizeRoleKey(roleFromObject || roleFromId || "user");
};

const isAdmin = (user) => {
  const roleKey = getUserRoleKey(user);
  const permissions = Array.isArray(user?.permissions) ? user.permissions : [];
  return roleKey === "admin" || 
         user?.roleId === ADMIN_ROLE_ID ||
         permissions.includes("*") ||
         permissions.includes("departments:write") ||
         permissions.includes("departments:read");
};

const canViewAIManagement = (user) => {
  const roleKey = getUserRoleKey(user);

  return ["admin", "bangiamdoc", "truongbophan", "hethong"].includes(roleKey);
};

const canManageNewsEvents = (user) => {
  const roleKey = getUserRoleKey(user);

  return ["admin", "bangiamdoc", "truongbophan"].includes(roleKey);
};

// KIá»‚M TRA QUYá»€N XEM CHI TIáº¾T Sáº¢N PHáº¨M (cho phÃ©p táº¥t cáº£ ngÆ°á»i dÃ¹ng xem)
const canViewProductDetails = (user) => {
  return true;
};

// KIá»‚M TRA QUYá»€N Háº N Äá»˜NG Cá»¦A USER
const hasPermission = (user, requiredPermission) => {
  const roleKey = getUserRoleKey(user);
  if (roleKey === "admin") return true;

  const permissions = Array.isArray(user?.permissions) ? user.permissions : [];
  return permissions.includes("*") || permissions.includes(requiredPermission);
};

const normalizeApiCategoryList = (payload) => {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.items)
        ? payload.items
        : Array.isArray(payload?.categories)
          ? payload.categories
          : [];

  return list
    .map((cat) => ({
      id: String(cat?._id?.$oid || cat?._id || cat?.id || ""),
      name: cat?.name || "Danh má»¥c chÆ°a Ä‘áº·t tÃªn",
      status: cat?.status || "active",
    }))
    .filter((cat) => cat.id && cat.name);
};

export const Sidebar = ({
  currentUser,
  onNavigate,
  currentPage,
  onToggleSidebar,
  isSidebarMini,
}) => {
  const [openMenu, setOpenMenu] = useState(() =>
    ["tintuc", "newsEventsManage"].includes(currentPage)
      ? "newsEvents"
      : "sanpham",
  );

  // ==========================================
  // DANH Má»¤C Sáº¢N PHáº¨M Tá»ª API
  // ==========================================
  const [productCategories, setProductCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [selectedCountryName, setSelectedCountryName] = useState(null);
  const [expandedProductCatId, setExpandedProductCatId] = useState(null);
  const [selectedRegionName, setSelectedRegionName] = useState(null);
  const [expandedRegions, setExpandedRegions] = useState({});
  const [isTuyensinhExpanded, setIsTuyensinhExpanded] = useState(true);
  const [isServicesExpanded, setIsServicesExpanded] = useState(false);

  const isProductPage =
    [
      "duhocduc",
      "dinhcu",
      "visa",
      "daotaongonngu",
      "nophosoonline",
      "sanpham",
    ].includes(currentPage) ||
    (currentPage === "productOverview" && (selectedCategoryId !== null || selectedRegionName !== null)) ||
    currentPage.startsWith("product:");
  const isNewsPage = ["tintuc", "newsEventsManage"].includes(currentPage);
  const canManageNews = canManageNewsEvents(currentUser);
  const handleGoHome = () => {
    onNavigate?.("dashboard");
  };

  // Láº¯ng nghe sá»± kiá»‡n chá»n danh má»¥c (tá»« bá»™ lá»c MegaMenu)
  useEffect(() => {
    const handleCategorySelect = (event) => {
      const detail = event?.detail || {};
      if (detail.fromSidebar) return; // Bá» qua náº¿u sá»± kiá»‡n phÃ¡t ra tá»« chÃ­nh sidebar

      if (detail.id) {
        setSelectedCategoryId(detail.id);
        setSelectedCountryName(detail.country && detail.country !== "Táº¥t cáº£" ? detail.country : null);
        setExpandedProductCatId(detail.id);
        setSelectedRegionName(detail.region && detail.region !== "Táº¥t cáº£" ? detail.region : null);
      } else {
        if (detail.name === "Táº¥t cáº£") {
          setSelectedCategoryId(null);
          setSelectedCountryName(null);
          setSelectedRegionName(detail.region && detail.region !== "Táº¥t cáº£" ? detail.region : null);
        } else {
          // Find category by name
          const cat = productCategories.find(c => c.name === detail.name);
          if (cat) {
            setSelectedCategoryId(cat.id);
            setSelectedCountryName(detail.country && detail.country !== "Táº¥t cáº£" ? detail.country : null);
            setExpandedProductCatId(cat.id);
            setSelectedRegionName(detail.region && detail.region !== "Táº¥t cáº£" ? detail.region : null);
          } else {
            setSelectedCategoryId(null);
            setSelectedCountryName(null);
            setSelectedRegionName(detail.region && detail.region !== "Táº¥t cáº£" ? detail.region : null);
          }
        }
      }

      // Tá»± Ä‘á»™ng má»Ÿ rá»™ng nhÃ³m tÆ°Æ¡ng á»©ng
      const serviceNames = ["visa", "Ä‘á»‹nh cÆ°", "dinh cu"];
      const isService = (detail.name && serviceNames.some(n => detail.name.toLowerCase().includes(n))) || currentPage === "nophosoonline";
      if (isService) {
        setIsServicesExpanded(true);
      } else {
        setIsTuyensinhExpanded(true);
      }
    };

    window.addEventListener(SIDEBAR_CATEGORY_EVENT, handleCategorySelect);
    return () =>
      window.removeEventListener(SIDEBAR_CATEGORY_EVENT, handleCategorySelect);
  }, [productCategories, currentPage]);

  // Fetch danh má»¥c tá»« API vÃ  trÃ­ch xuáº¥t danh sÃ¡ch quá»‘c gia
  useEffect(() => {
    let isMounted = true;

    const fetchCategories = async () => {
      try {
        const headers = {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        };
        const response = await authFetch(`${API_BASE_URL}/product-categories`, {
          headers,
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = await response.json().catch(() => null);
        const normalized = normalizeApiCategoryList(payload);

        const isActiveProduct = (p) => {
          if (!p) return false;
          const status = p.status || (p.isActive === false ? "inactive" : "active");
          return status === "active";
        };

        // Fetch products for each category to extract unique countries and raw products list
        const categoriesWithCountries = await Promise.all(
          normalized.map(async (cat) => {
            try {
              const resProducts = await authFetch(`${API_BASE_URL}/products?categoryId=${cat.id}`, { headers });
              if (!resProducts.ok) return { ...cat, countries: [], products: [] };
              const prodPayload = await resProducts.json().catch(() => null);

              const productsRaw = Array.isArray(prodPayload)
                ? prodPayload
                : Array.isArray(prodPayload?.data)
                  ? prodPayload.data
                  : Array.isArray(prodPayload?.items)
                    ? prodPayload.items
                    : [];

              const seen = new Set();
              const countries = [];
              const activeProds = productsRaw.filter(p => p && isActiveProduct(p));
              activeProds
                .filter(p => p.country)
                .forEach(p => {
                  const raw = p.country.trim();
                  const resolved = resolveCountryName(raw);
                  if (!seen.has(resolved)) {
                    seen.add(resolved);
                    countries.push(raw);
                  }
                });
              countries.sort((a, b) => resolveCountryName(a).localeCompare(resolveCountryName(b), "vi"));

              return { ...cat, countries, products: activeProds };
            } catch (err) {
              console.warn(`[Sidebar] Lá»—i táº£i sáº£n pháº©m cho danh má»¥c ${cat.name}:`, err.message);
              return { ...cat, countries: [], products: [] };
            }
          })
        );

        // Di chuyá»ƒn sáº£n pháº©m "Dá»‹ch vá»¥ Visa" (Nháº­t Báº£n) tá»« danh má»¥c "Dá»‹ch vá»¥" sang danh má»¥c "Visa"
        const catDichVu = categoriesWithCountries.find(c => c.name.toLowerCase() === "dá»‹ch vá»¥" || c.name.toLowerCase() === "dich vu");
        const catVisa = categoriesWithCountries.find(c => c.name.toLowerCase() === "visa");

        if (catDichVu && catVisa) {
          const visaJapanProds = catDichVu.products.filter(p => {
            const nameLower = (p.name || "").toLowerCase();
            return nameLower.includes("visa") && resolveCountryName(p.country) === "Nháº­t Báº£n";
          });

          if (visaJapanProds.length > 0) {
            // Cáº­p nháº­t categoryId cho cÃ¡c sáº£n pháº©m di chuyá»ƒn
            visaJapanProds.forEach(p => {
              p.categoryId = catVisa.id;
              p.categoryName = catVisa.name;
            });

            // XÃ³a khá»i Dá»‹ch vá»¥
            catDichVu.products = catDichVu.products.filter(p => !visaJapanProds.includes(p));
            // Cáº­p nháº­t láº¡i countries cá»§a Dá»‹ch vá»¥
            const seenDichVu = new Set();
            catDichVu.countries = [];
            catDichVu.products.forEach(p => {
              if (p.country && !seenDichVu.has(p.country)) {
                seenDichVu.add(p.country);
                catDichVu.countries.push(p.country);
              }
            });

            // ThÃªm vÃ o Visa
            catVisa.products = [...catVisa.products, ...visaJapanProds];
            // Cáº­p nháº­t láº¡i countries cá»§a Visa
            const seenVisa = new Set(catVisa.countries);
            visaJapanProds.forEach(p => {
              if (p.country && !seenVisa.has(p.country)) {
                seenVisa.add(p.country);
                catVisa.countries.push(p.country);
              }
            });
            // Sáº¯p xáº¿p láº¡i countries cá»§a Visa
            catVisa.countries.sort((a, b) => resolveCountryName(a).localeCompare(resolveCountryName(b), "vi"));
          }
        }

        if (isMounted) setProductCategories(categoriesWithCountries);
      } catch (err) {
        console.warn(
          "[Sidebar] KhÃ´ng táº£i Ä‘Æ°á»£c danh má»¥c sáº£n pháº©m, sá»­ dá»¥ng Mock Data dá»± phÃ²ng:",
          err.message,
        );
        
        // Mock fallback to keep development functional
        const mockCategoriesNormalized = [
          {
            id: "cat-1",
            name: "Du há»c hÃ¨",
            countries: ["Singapore"],
            products: [
              {
                id: "prog-1-1",
                name: "Du há»c hÃ¨ Singapore",
                country: "Singapore",
                region: "ChÃ¢u Ã",
                status: "active"
              }
            ]
          },
          {
            id: "cat-2",
            name: "Du há»c nghá»",
            countries: ["Äá»©c"],
            products: [
              {
                id: "prog-voc-1",
                name: "Du há»c nghá» Äá»©c",
                country: "Äá»©c",
                region: "ChÃ¢u Ã‚u",
                status: "active"
              }
            ]
          },
          {
            id: "cat-3",
            name: "Visa",
            countries: ["Ãšc"],
            products: [
              {
                id: "prog-visa-1",
                name: "Dá»‹ch vá»¥ xin Visa Ãšc trá»n gÃ³i",
                country: "Ãšc",
                region: "ChÃ¢u Äáº¡i DÆ°Æ¡ng",
                status: "active"
              }
            ]
          },
          {
            id: "cat-4",
            name: "Äá»‹nh cÆ°",
            countries: ["Canada"],
            products: [
              {
                id: "prog-settle-1",
                name: "Äá»‹nh cÆ° Ä‘áº§u tÆ° Canada",
                country: "Canada",
                region: "ChÃ¢u Má»¹",
                status: "active"
              }
            ]
          },
          {
            id: "cat-5",
            name: "ÄÃ o táº¡o ngÃ´n ngá»¯",
            countries: ["Äá»©c"],
            products: [
              {
                id: "prog-lang-1",
                name: "KhÃ³a há»c tiáº¿ng Äá»©c B1",
                country: "Äá»©c",
                region: "ChÃ¢u Ã‚u",
                status: "active"
              }
            ]
          }
        ];

        if (isMounted) setProductCategories(mockCategoriesNormalized);
      } finally {
        if (isMounted) setCategoriesLoading(false);
      }
    };

    fetchCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  // PhÃ¢n chia danh má»¥c thÃ nh cÃ¡c nhÃ³m cho Tuyá»ƒn Sinh Du Há»c vÃ  Dá»‹ch Vá»¥
  const categorizedMenu = useMemo(() => {
    const trainingKeywords = ["Ä‘Ã o táº¡o ngÃ´n ngá»¯", "dao tao ngon ngu", "ngÃ´n ngá»¯", "ngon ngu", "ngoáº¡i ngá»¯", "tiáº¿ng"];
    const continentKeywords = ["chÃ¢u má»¹", "chÃ¢u Ã¢u", "chÃ¢u Ã¡", "chÃ¢u Ä‘áº¡i dÆ°Æ¡ng", "chau my", "chau au", "chau a", "chau dai duong"];
    const vocationalKeywords = ["du há»c nghá»", "du hoc nghe", "nghá»", "nghe", "tts quá»‘c táº¿", "tts quoc te"];
    const summerKeywords = ["du há»c hÃ¨", "du hoc he", "hÃ¨", "he", "tráº¡i hÃ¨", "trai he"];

    const result = {
      tuyenSinh: {
        ttsQuocTe: null, // Danh má»¥c Du há»c nghá»
        duHocHe: null,   // Danh má»¥c Du há»c hÃ¨
        continents: []   // CÃ¡c danh má»¥c chÃ¢u lá»¥c (ChÃ¢u Má»¹, ChÃ¢u Ã‚u...)
      },
      daoTao: null,      // Danh má»¥c ÄÃ o táº¡o ngÃ´n ngá»¯
      dichVu: []         // CÃ¡c danh má»¥c Dá»‹ch vá»¥ (Visa, Äá»‹nh cÆ°...)
    };

    productCategories.forEach(cat => {
      const nameLower = cat.name.toLowerCase();
      
      // Bá» qua danh má»¥c Dá»‹ch vá»¥ rá»—ng (vÃ¬ sáº£n pháº©m cá»§a nÃ³ Ä‘Ã£ Ä‘Æ°á»£c chuyá»ƒn sang Visa)
      if (nameLower === "dá»‹ch vá»¥" || nameLower === "dich vu") {
        return;
      }

      if (trainingKeywords.some(n => nameLower.includes(n))) {
        result.daoTao = cat;
      } else if (continentKeywords.some(n => nameLower.includes(n))) {
        result.tuyenSinh.continents.push(cat);
      } else if (vocationalKeywords.some(n => nameLower.includes(n))) {
        result.tuyenSinh.ttsQuocTe = cat;
      } else if (summerKeywords.some(n => nameLower.includes(n))) {
        result.tuyenSinh.duHocHe = cat;
      } else {
        result.dichVu.push(cat);
      }
    });

    // Sáº¯p xáº¿p thá»© tá»± cÃ¡c ChÃ¢u lá»¥c
    const order = ["chÃ¢u má»¹", "chÃ¢u Ã¢u", "chÃ¢u Ã¡", "chÃ¢u Ä‘áº¡i dÆ°Æ¡ng"];
    result.tuyenSinh.continents.sort((a, b) => {
      const idxA = order.findIndex(o => a.name.toLowerCase().includes(o));
      const idxB = order.findIndex(o => b.name.toLowerCase().includes(o));
      return idxA - idxB;
    });

    return result;
  }, [productCategories]);

  const [departments, setDepartments] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);
  const [expandedDeptId, setExpandedDeptId] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchDepts = async () => {
      try {
        const roleKey = getUserRoleKey(currentUser);
        const canReadDepts = hasPermission(currentUser, "departments:read") || ["admin", "bangiamdoc", "truongbophan", "nhansu", "staff"].includes(roleKey);

        let normalized = [];
        if (canReadDepts) {
          const headers = { "Content-Type": "application/json", ...getAuthHeaders() };
          const response = await authFetch(`${API_BASE_URL}/departments?includeHidden=true`, { headers });
          if (response.ok) {
            const payload = await response.json().catch(() => null);
            const list = payload?.data || payload || [];
            normalized = list.map(d => ({ id: d._id || d.id, name: d.name })).filter(d => d.id && d.name);
          } else if (response.status === 403) {
            normalized = [];
          } else {
            throw new Error(`HTTP ${response.status}`);
          }
        }

        // --- Bá»” SUNG PHÃ’NG BAN áº¨N MÃ€ USER THUá»˜C Vá»€ ---
        const userDeptIds = currentUser?.departmentIds || (currentUser?.departmentId ? [currentUser.departmentId] : []);
        const KNOWN_HIDDEN_DEPTS = {
          "6a2928bd198af598139ab42a": "laptop M4",
          "6a389e5cd30baf58a6859c5e": "cá»™ng tÃ¡c viÃªn",
          "6a389e7bd30baf58a6859cf3": "Äáº¡i sá»© thÆ°Æ¡ng hiá»‡u",
          "6a1d026bd982af7420184420": "Tuyá»ƒn Sinh du há»c hÃ¨",
          "6a1d03fc6d7314acd051155a": "Tuyá»ƒn sinh du há»c Má»¹",
          "6a1d04686d7314acd051155c": "Nghiá»‡p vá»¥",
          "6a1d047a6d7314acd051155d": "Telesale & CSKH",
          "6a1d048b6d7314acd051155e": "IT & Marketing & Social",
          "6a1d04996d7314acd051155f": "Kinh doanh",
          "6a1d04a86d7314acd0511560": "Tá»•ng Há»£p",
          "6a1e3941e43b5d5e028e9e9d": "Tuyá»ƒn sinh"
        };
        if (currentUser?.departmentId && currentUser?.departmentName) {
          KNOWN_HIDDEN_DEPTS[currentUser.departmentId] = currentUser.departmentName;
        }

        userDeptIds.forEach(id => {
          if (id && !normalized.some(d => String(d.id) === String(id))) {
            const hiddenName = KNOWN_HIDDEN_DEPTS[id] || `PhÃ²ng ban áº©n (${id.substring(id.length - 4)})`;
            normalized.push({ id, name: hiddenName });
          }
        });

        if (isMounted) setDepartments(normalized);
      } catch (err) {
        console.warn("[Sidebar] KhÃ´ng táº£i Ä‘Æ°á»£c danh má»¥c phÃ²ng ban:", err.message);

        const userDeptIds = currentUser?.departmentIds || (currentUser?.departmentId ? [currentUser.departmentId] : []);
        const KNOWN_HIDDEN_DEPTS = {
          "6a2928bd198af598139ab42a": "laptop M4",
          "6a389e5cd30baf58a6859c5e": "cá»™ng tÃ¡c viÃªn",
          "6a389e7bd30baf58a6859cf3": "Äáº¡i sá»© thÆ°Æ¡ng hiá»‡u",
          "6a1d026bd982af7420184420": "Tuyá»ƒn Sinh du há»c hÃ¨",
          "6a1d03fc6d7314acd051155a": "Tuyá»ƒn sinh du há»c Má»¹",
          "6a1d04686d7314acd051155c": "Nghiá»‡p vá»¥",
          "6a1d047a6d7314acd051155d": "Telesale & CSKH",
          "6a1d048b6d7314acd051155e": "IT & Marketing & Social",
          "6a1d04996d7314acd051155f": "Kinh doanh",
          "6a1d04a86d7314acd0511560": "Tá»•ng Há»£p",
          "6a1e3941e43b5d5e028e9e9d": "Tuyá»ƒn sinh"
        };
        if (currentUser?.departmentId && currentUser?.departmentName) {
          KNOWN_HIDDEN_DEPTS[currentUser.departmentId] = currentUser.departmentName;
        }
        const fallback = [];
        userDeptIds.forEach(id => {
          if (id) {
            const hiddenName = KNOWN_HIDDEN_DEPTS[id] || `PhÃ²ng ban áº©n (${id.substring(id.length - 4)})`;
            fallback.push({ id, name: hiddenName });
          }
        });
        if (isMounted) setDepartments(fallback);
      } finally {
        if (isMounted) setDepartmentsLoading(false);
      }
    };

    fetchDepts();
    return () => { isMounted = false; };
  }, [currentUser]);

  // Xá»­ lÃ½ click vÃ o danh má»¥c
  const handleToggleCategory = (categoryId) => {
    setSelectedCategoryId(categoryId);
    setSelectedCountryName(null);
    setSelectedRegionName(null);
    setExpandedProductCatId(expandedProductCatId === categoryId ? null : categoryId); // Toggle expand/collapse when clicking parent category name

    const category = productCategories.find((c) => c.id === categoryId);
    if (category) {
      const detail = {
        id: category.id,
        name: category.name,
        country: "Táº¥t cáº£",
        region: "Táº¥t cáº£",
        fromSidebar: true,
      };
      try {
        sessionStorage.setItem(
          SIDEBAR_CATEGORY_STORAGE_KEY,
          JSON.stringify(detail),
        );
      } catch {
        // bá» qua
      }
      window.dispatchEvent(new CustomEvent(SIDEBAR_CATEGORY_EVENT, { detail }));
    }

    onNavigate?.("productOverview");
  };

  const handleSelectCountry = (categoryId, country) => {
    setSelectedCategoryId(categoryId);
    setSelectedCountryName(country);
    setSelectedRegionName(null);

    const category = productCategories.find((c) => c.id === categoryId);
    if (category) {
      const detail = {
        id: category.id,
        name: category.name,
        country: country,
        region: "Táº¥t cáº£",
        fromSidebar: true,
      };
      try {
        sessionStorage.setItem(
          SIDEBAR_CATEGORY_STORAGE_KEY,
          JSON.stringify(detail),
        );
      } catch {
        // bá» qua
      }
      window.dispatchEvent(new CustomEvent(SIDEBAR_CATEGORY_EVENT, { detail }));
    }

    onNavigate?.("productOverview");
  };

  const handleSelectRegion = (region) => {
    setSelectedCategoryId(null);
    setSelectedCountryName(null);
    setSelectedRegionName(region);
    setExpandedRegions(prev => ({ ...prev, [region]: !prev[region] }));

    const detail = {
      id: null,
      name: "Táº¥t cáº£",
      country: "Táº¥t cáº£",
      region: region,
      fromSidebar: true,
    };
    try {
      sessionStorage.setItem(
        SIDEBAR_CATEGORY_STORAGE_KEY,
        JSON.stringify(detail),
      );
    } catch {
      // bá» qua
    }
    window.dispatchEvent(new CustomEvent(SIDEBAR_CATEGORY_EVENT, { detail }));
    onNavigate?.("productOverview");
  };

  const handleSelectRegionCountry = (region, country) => {
    setSelectedCategoryId(null);
    setSelectedCountryName(country);
    setSelectedRegionName(region);

    const detail = {
      id: null,
      name: "Táº¥t cáº£",
      country: country,
      region: region,
      fromSidebar: true,
    };
    try {
      sessionStorage.setItem(
        SIDEBAR_CATEGORY_STORAGE_KEY,
        JSON.stringify(detail),
      );
    } catch {
      // bá» qua
    }
    window.dispatchEvent(new CustomEvent(SIDEBAR_CATEGORY_EVENT, { detail }));
    onNavigate?.("productOverview");
  };

  const handleGoToProductOverview = () => {
    const detail = { id: null, name: "Táº¥t cáº£", country: "Táº¥t cáº£", fromSidebar: true };
    try {
      sessionStorage.setItem(
        SIDEBAR_CATEGORY_STORAGE_KEY,
        JSON.stringify(detail),
      );
    } catch {
      // bá» qua
    }
    window.dispatchEvent(new CustomEvent(SIDEBAR_CATEGORY_EVENT, { detail }));
    setSelectedCategoryId(null);
    setSelectedCountryName(null);
    onNavigate?.("productOverview");
  };

  const hasProductDetailPermission = canViewProductDetails(currentUser);

  return (
    <aside className={`app-menubar ${isSidebarMini ? "sidebar-mini" : ""}`} id="menubar">
      <button className="app-toggler" type="button" onClick={onToggleSidebar}>
        <i className="fi fi-br-angle-small-left"></i>
      </button>
      <div className="app-navbar-brand">
        <button
          className="navbar-brand-logo border-0 bg-transparent p-0"
          type="button"
          onClick={handleGoHome}
        >
          <img
            src="/assets/images/logo-HTO.png"
            alt="UrbanHub Admin Dashboard"
            width="40"
            height="40"
          />
        </button>

        <button
          className="navbar-brand-mini visible-light"
          type="button"
          onClick={handleGoHome}
          style={{
            textDecoration: "none",
            border: 0,
            background: "transparent",
            padding: 0,
          }}
        >
          <span
            style={{
              fontSize: "13px",
              fontWeight: "bold",
              color: "#003366",
              display: "inline-block",
              lineHeight: "20px",
            }}
          >
            HT OCEAN GROUP
          </span>
        </button>
      </div>

      <nav className="app-navbar" data-simplebar>
        <ul className="menubar list-unstyled" style={{ padding: "0 12px" }}>
          {/* --- 1. DASHBOARD --- */}
          <li className="menu-item mb-2">
            <a
              className={`menu-link d-flex align-items-center px-2 py-2 rounded-2 ${currentPage === "dashboard" ? "text-primary fw-bold" : "text-body-secondary"}`}
              href="#"
              style={{ textDecoration: "none" }}
              onClick={(e) => {
                e.preventDefault();
                onNavigate?.("dashboard");
              }}
            >
              <div
                className="d-flex align-items-center justify-content-center rounded-3 bg-body-secondary me-3 flex-shrink-0"
                style={{ width: "36px", height: "36px" }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
              </div>
              <span
                className="menu-label"
                style={{ flex: 1, fontSize: "14px" }}
              >
                Trang chá»§
              </span>
            </a>
          </li>

          <li className="menu-item mb-2">
            <a
              className={`menu-link d-flex align-items-center px-2 py-2 rounded-2 ${currentPage === "dashboardStats" ? "text-primary fw-bold" : "text-body-secondary"}`}
              href="#"
              style={{ textDecoration: "none" }}
              onClick={(e) => {
                e.preventDefault();
                onNavigate?.("dashboardStats");
              }}
            >
              <div
                className="d-flex align-items-center justify-content-center rounded-3 bg-body-secondary me-3 flex-shrink-0"
                style={{ width: "36px", height: "36px" }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 3v18h18"></path>
                  <path d="M7 15l4-4 3 3 5-7"></path>
                </svg>
              </div>
              <span
                className="menu-label"
                style={{ flex: 1, fontSize: "14px" }}
              >
                Dashboard thá»‘ng kÃª
              </span>
            </a>
          </li>

          {/* --- 1C. Tá»”NG Sáº¢N PHáº¨M --- */}
          {hasProductDetailPermission && (
            <li className="menu-item mb-2">
              <a
                className={`menu-link d-flex align-items-center px-2 py-2 rounded-2 ${
                  (currentPage === "productOverview" || currentPage === "nophosoonline" || currentPage.startsWith("product:") || ["duhocduc", "dinhcu", "visa", "daotaongonngu", "sanpham"].includes(currentPage))
                    ? "text-primary fw-bold"
                    : "text-body-secondary"
                }`}
                href="#"
                style={{ textDecoration: "none" }}
                onClick={(e) => {
                  e.preventDefault();
                  handleGoToProductOverview();
                }}
              >
                <div
                  className="d-flex align-items-center justify-content-center rounded-3 bg-body-secondary me-3 flex-shrink-0"
                  style={{ width: "36px", height: "36px" }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="3" width="7" height="9"></rect>
                    <rect x="14" y="3" width="7" height="5"></rect>
                    <rect x="14" y="12" width="7" height="9"></rect>
                    <rect x="3" y="16" width="7" height="5"></rect>
                  </svg>
                </div>
                <span
                  className="menu-label"
                  style={{ flex: 1, fontSize: "14px" }}
                >
                  Tá»•ng sáº£n pháº©m
                </span>

                <span
                  style={{ cursor: "pointer", padding: "4px" }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setOpenMenu(openMenu === "sanpham" ? "" : "sanpham"); if (isSidebarMini && onToggleSidebar) onToggleSidebar();
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      transform:
                        openMenu === "sanpham"
                          ? "rotate(180deg)"
                          : "rotate(0deg)",
                      transition: "transform 0.3s ease",
                    }}
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </span>
              </a>

              <ul
                className="menu-inner list-unstyled mb-0"
                style={{
                  display: openMenu === "sanpham" ? "block" : "none",
                  paddingLeft: "28px",
                }}
              >
              {categoriesLoading ? (
                <li className="menu-item mb-1">
                  <span
                    className="d-block px-3 py-2 text-body-secondary"
                    style={{ fontSize: "13px" }}
                  >
                    Äang táº£i danh má»¥c...
                  </span>
                </li>
              ) : (
                <>
                  {/* --- A. TUYá»‚N SINH DU Há»ŒC (Dropdown Group) --- */}
                  <li className="menu-item mb-2" style={{ listStyleType: "none" }}>
                    <div className="d-flex align-items-center justify-content-between rounded-2 hover-bg-light" style={{ transition: "all 0.2s" }}>
                      <a
                        className={`menu-link d-block px-3 py-2 rounded-2 flex-grow-1 fw-bold ${
                          isTuyensinhExpanded ? "text-primary" : "text-body-secondary"
                        }`}
                        style={{ textDecoration: "none", fontSize: "13px", cursor: "pointer" }}
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setIsTuyensinhExpanded(!isTuyensinhExpanded);
                        }}
                      >
                        Tuyá»ƒn Sinh Du Há»c
                      </a>
                      <span
                        className="d-flex align-items-center justify-content-center text-body-secondary"
                        style={{ cursor: "pointer", width: "28px", height: "28px" }}
                        onClick={(e) => {
                          e.preventDefault();
                          setIsTuyensinhExpanded(!isTuyensinhExpanded);
                        }}
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          style={{
                            transform: isTuyensinhExpanded ? "rotate(180deg)" : "rotate(0deg)",
                            transition: "transform 0.2s ease"
                          }}
                        >
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </span>
                    </div>

                    {isTuyensinhExpanded && (
                      <ul
                        className="list-unstyled mb-0 mt-1"
                        style={{
                          borderLeft: "1px dashed var(--bs-border-color)",
                          marginLeft: "15px",
                          paddingLeft: "8px",
                          listStyleType: "none"
                        }}
                      >
                        {/* 1. TTS Quá»‘c Táº¿ (Du há»c nghá») */}
                        {categorizedMenu.tuyenSinh.ttsQuocTe && (() => {
                          const cat = categorizedMenu.tuyenSinh.ttsQuocTe;
                          const isCatSelected = selectedCategoryId === cat.id && currentPage === "productOverview";
                          const hasCountries = Array.isArray(cat.countries) && cat.countries.length > 0;
                          const isExpanded = expandedProductCatId === cat.id;

                          return (
                            <li className="menu-item mb-1" style={{ listStyleType: "none" }}>
                              <div className="d-flex align-items-center justify-content-between rounded-2 hover-bg-light">
                                <a
                                  className={`menu-link d-block px-3 py-1.5 rounded-2 flex-grow-1 ${
                                    isCatSelected && !selectedCountryName ? "bg-primary-subtle text-primary fw-medium" : "text-body-secondary"
                                  }`}
                                  style={{ textDecoration: "none", fontSize: "13px", cursor: "pointer" }}
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleToggleCategory(cat.id);
                                  }}
                                >
                                  TTS Quá»‘c Táº¿
                                </a>
                                {hasCountries && (
                                  <span
                                    className="d-flex align-items-center justify-content-center text-body-secondary"
                                    style={{ cursor: "pointer", width: "24px", height: "24px" }}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setExpandedProductCatId(isExpanded ? null : cat.id);
                                    }}
                                  >
                                    <svg
                                      width="10"
                                      height="10"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="3"
                                      style={{
                                        transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                                        transition: "transform 0.2s ease"
                                      }}
                                    >
                                      <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                  </span>
                                )}
                              </div>
                              {hasCountries && isExpanded && (
                                <ul className="list-unstyled mb-0 mt-1" style={{ borderLeft: "1px dotted var(--bs-border-color)", marginLeft: "12px", paddingLeft: "8px" }}>
                                  {cat.countries.map(country => {
                                    const isCountrySelected = isCatSelected && selectedCountryName === country;
                                    const resolvedName = resolveCountryName(country);
                                    return (
                                      <li key={country} className="mb-0.5">
                                        <a
                                          className={`menu-link py-1 rounded-2 d-block ${isCountrySelected ? "text-primary fw-bold" : "text-body-secondary"}`}
                                          style={{ textDecoration: "none", fontSize: "12px", cursor: "pointer" }}
                                          href="#"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            handleSelectCountry(cat.id, country);
                                          }}
                                        >
                                          â€¢ {resolvedName}
                                        </a>
                                      </li>
                                    );
                                  })}
                                </ul>
                              )}
                            </li>
                          );
                        })()}

                        {/* 2. Du Há»c HÃ¨ */}
                        {categorizedMenu.tuyenSinh.duHocHe && (() => {
                          const cat = categorizedMenu.tuyenSinh.duHocHe;
                          const isCatSelected = selectedCategoryId === cat.id && currentPage === "productOverview";
                          const hasCountries = Array.isArray(cat.countries) && cat.countries.length > 0;
                          const isExpanded = expandedProductCatId === cat.id;

                          return (
                            <li className="menu-item mb-1" style={{ listStyleType: "none" }}>
                              <div className="d-flex align-items-center justify-content-between rounded-2 hover-bg-light">
                                <a
                                  className={`menu-link d-block px-3 py-1.5 rounded-2 flex-grow-1 ${
                                    isCatSelected && !selectedCountryName ? "bg-primary-subtle text-primary fw-medium" : "text-body-secondary"
                                  }`}
                                  style={{ textDecoration: "none", fontSize: "13px", cursor: "pointer" }}
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleToggleCategory(cat.id);
                                  }}
                                >
                                  Du Há»c HÃ¨
                                </a>
                                {hasCountries && (
                                  <span
                                    className="d-flex align-items-center justify-content-center text-body-secondary"
                                    style={{ cursor: "pointer", width: "24px", height: "24px" }}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setExpandedProductCatId(isExpanded ? null : cat.id);
                                    }}
                                  >
                                    <svg
                                      width="10"
                                      height="10"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="3"
                                      style={{
                                        transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                                        transition: "transform 0.2s ease"
                                      }}
                                    >
                                      <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                  </span>
                                )}
                              </div>
                              {hasCountries && isExpanded && (
                                <ul className="list-unstyled mb-0 mt-1" style={{ borderLeft: "1px dotted var(--bs-border-color)", marginLeft: "12px", paddingLeft: "8px" }}>
                                  {cat.countries.map(country => {
                                    const isCountrySelected = isCatSelected && selectedCountryName === country;
                                    const resolvedName = resolveCountryName(country);
                                    return (
                                      <li key={country} className="mb-0.5">
                                        <a
                                          className={`menu-link py-1 rounded-2 d-block ${isCountrySelected ? "text-primary fw-bold" : "text-body-secondary"}`}
                                          style={{ textDecoration: "none", fontSize: "12px", cursor: "pointer" }}
                                          href="#"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            handleSelectCountry(cat.id, country);
                                          }}
                                        >
                                          â€¢ {resolvedName}
                                        </a>
                                      </li>
                                    );
                                  })}
                                </ul>
                              )}
                            </li>
                          );
                        })()}

                        {/* 3. CÃ¡c ChÃ¢u Lá»¥c (ChÃ¢u Má»¹, ChÃ¢u Ã‚u, ChÃ¢u Ã, ChÃ¢u Äáº¡i DÆ°Æ¡ng) */}
                        {categorizedMenu.tuyenSinh.continents.filter(cat => Array.isArray(cat.countries) && cat.countries.length > 0).map(cat => {
                          const isCatSelected = selectedCategoryId === cat.id && currentPage === "productOverview";
                          const hasCountries = Array.isArray(cat.countries) && cat.countries.length > 0;
                          const isExpanded = expandedProductCatId === cat.id;

                          return (
                            <li key={cat.id} className="menu-item mb-1" style={{ listStyleType: "none" }}>
                              <div className="d-flex align-items-center justify-content-between rounded-2 hover-bg-light">
                                <a
                                  className={`menu-link d-block px-3 py-1.5 rounded-2 flex-grow-1 ${
                                    isCatSelected && !selectedCountryName ? "bg-primary-subtle text-primary fw-medium" : "text-body-secondary"
                                  }`}
                                  style={{ textDecoration: "none", fontSize: "13px", cursor: "pointer" }}
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleToggleCategory(cat.id);
                                  }}
                                >
                                  {cat.name}
                                </a>
                                {hasCountries && (
                                  <span
                                    className="d-flex align-items-center justify-content-center text-body-secondary"
                                    style={{ cursor: "pointer", width: "24px", height: "24px" }}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setExpandedProductCatId(isExpanded ? null : cat.id);
                                    }}
                                  >
                                    <svg
                                      width="10"
                                      height="10"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="3"
                                      style={{
                                        transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                                        transition: "transform 0.2s ease"
                                      }}
                                    >
                                      <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                  </span>
                                )}
                              </div>
                              {hasCountries && isExpanded && (
                                <ul className="list-unstyled mb-0 mt-1" style={{ borderLeft: "1px dotted var(--bs-border-color)", marginLeft: "12px", paddingLeft: "8px" }}>
                                  {cat.countries.map(country => {
                                    const isCountrySelected = isCatSelected && selectedCountryName === country;
                                    const resolvedName = resolveCountryName(country);
                                    return (
                                      <li key={country} className="mb-0.5">
                                        <a
                                          className={`menu-link py-1 rounded-2 d-block ${isCountrySelected ? "text-primary fw-bold" : "text-body-secondary"}`}
                                          style={{ textDecoration: "none", fontSize: "12px", cursor: "pointer" }}
                                          href="#"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            handleSelectCountry(cat.id, country);
                                          }}
                                        >
                                          â€¢ {resolvedName}
                                        </a>
                                      </li>
                                    );
                                  })}
                                </ul>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>

                  {/* --- B. ÄÃ€O Táº O NGÃ”N NGá»® (Single Dropdown/Link if exists) --- */}
                  {categorizedMenu.daoTao && (() => {
                    const cat = categorizedMenu.daoTao;
                    const isCatSelected = selectedCategoryId === cat.id && currentPage === "productOverview";
                    const hasCountries = Array.isArray(cat.countries) && cat.countries.length > 0;
                    const isExpanded = expandedProductCatId === cat.id;

                    return (
                      <li className="menu-item mb-2" style={{ listStyleType: "none" }}>
                        <div className="d-flex align-items-center justify-content-between rounded-2 hover-bg-light" style={{ transition: "all 0.2s" }}>
                          <a
                            className={`menu-link d-block px-3 py-2 rounded-2 flex-grow-1 fw-bold ${
                              isCatSelected && !selectedCountryName ? "text-primary" : "text-body-secondary"
                            }`}
                            style={{ textDecoration: "none", fontSize: "13px", cursor: "pointer" }}
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              handleToggleCategory(cat.id);
                            }}
                          >
                            ÄÃ o táº¡o ngÃ´n ngá»¯
                          </a>
                          {hasCountries && (
                            <span
                              className="d-flex align-items-center justify-content-center text-body-secondary"
                              style={{ cursor: "pointer", width: "28px", height: "28px" }}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setExpandedProductCatId(isExpanded ? null : cat.id);
                              }}
                            >
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                style={{
                                  transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                                  transition: "transform 0.2s ease"
                                }}
                              >
                                <polyline points="6 9 12 15 18 9"></polyline>
                              </svg>
                            </span>
                          )}
                        </div>
                        {hasCountries && isExpanded && (
                          <ul
                            className="list-unstyled mb-0 mt-1"
                            style={{
                              borderLeft: "1px dashed var(--bs-border-color)",
                              marginLeft: "15px",
                              paddingLeft: "8px",
                              listStyleType: "none"
                            }}
                          >
                            {cat.countries.map(country => {
                              const isCountrySelected = isCatSelected && selectedCountryName === country;
                              const resolvedName = resolveCountryName(country);
                              return (
                                <li key={country} className="mb-1">
                                  <a
                                    className={`menu-link py-1 rounded-2 d-block ${isCountrySelected ? "text-primary fw-bold" : "text-body-secondary"}`}
                                    style={{ textDecoration: "none", fontSize: "12px", cursor: "pointer" }}
                                    href="#"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleSelectCountry(cat.id, country);
                                    }}
                                  >
                                    â€¢ {resolvedName}
                                  </a>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </li>
                    );
                  })()}

                  {/* --- C. Dá»ŠCH Vá»¤ (Dropdown Group) --- */}
                  <li className="menu-item mb-2" style={{ listStyleType: "none" }}>
                    <div className="d-flex align-items-center justify-content-between rounded-2 hover-bg-light" style={{ transition: "all 0.2s" }}>
                      <a
                        className={`menu-link d-block px-3 py-2 rounded-2 flex-grow-1 fw-bold ${
                          isServicesExpanded ? "text-primary" : "text-body-secondary"
                        }`}
                        style={{ textDecoration: "none", fontSize: "13px", cursor: "pointer" }}
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setIsServicesExpanded(!isServicesExpanded);
                        }}
                      >
                        Dá»‹ch vá»¥
                      </a>
                      <span
                        className="d-flex align-items-center justify-content-center text-body-secondary"
                        style={{ cursor: "pointer", width: "28px", height: "28px" }}
                        onClick={(e) => {
                          e.preventDefault();
                          setIsServicesExpanded(!isServicesExpanded);
                        }}
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          style={{
                            transform: isServicesExpanded ? "rotate(180deg)" : "rotate(0deg)",
                            transition: "transform 0.2s ease"
                          }}
                        >
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </span>
                    </div>

                    {isServicesExpanded && (
                      <ul
                        className="list-unstyled mb-0 mt-1"
                        style={{
                          borderLeft: "1px dashed var(--bs-border-color)",
                          marginLeft: "15px",
                          paddingLeft: "8px",
                          listStyleType: "none"
                        }}
                      >
                        {/* 1. Visa, Äá»‹nh cÆ°... */}
                        {categorizedMenu.dichVu.filter(cat => Array.isArray(cat.products) && cat.products.length > 0).map(cat => {
                          const isCatSelected = selectedCategoryId === cat.id && currentPage === "productOverview";
                          const hasCountries = Array.isArray(cat.countries) && cat.countries.length > 0;
                          const isExpanded = expandedProductCatId === cat.id;

                          return (
                            <li key={cat.id} className="menu-item mb-1" style={{ listStyleType: "none" }}>
                              <div className="d-flex align-items-center justify-content-between rounded-2 hover-bg-light">
                                <a
                                  className={`menu-link d-block px-3 py-1.5 rounded-2 flex-grow-1 ${
                                    isCatSelected && !selectedCountryName ? "bg-primary-subtle text-primary fw-medium" : "text-body-secondary"
                                  }`}
                                  style={{ textDecoration: "none", fontSize: "13px", cursor: "pointer" }}
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleToggleCategory(cat.id);
                                  }}
                                >
                                  {cat.name}
                                </a>
                                {hasCountries && (
                                  <span
                                    className="d-flex align-items-center justify-content-center text-body-secondary"
                                    style={{ cursor: "pointer", width: "24px", height: "24px" }}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setExpandedProductCatId(isExpanded ? null : cat.id);
                                    }}
                                  >
                                    <svg
                                      width="10"
                                      height="10"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="3"
                                      style={{
                                        transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                                        transition: "transform 0.2s ease"
                                      }}
                                    >
                                      <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                  </span>
                                )}
                              </div>
                              {hasCountries && isExpanded && (
                                <ul className="list-unstyled mb-0 mt-1" style={{ borderLeft: "1px dotted var(--bs-border-color)", marginLeft: "12px", paddingLeft: "8px" }}>
                                  {cat.countries.map(country => {
                                    const isCountrySelected = isCatSelected && selectedCountryName === country;
                                    const resolvedName = resolveCountryName(country);
                                    return (
                                      <li key={country} className="mb-0.5">
                                        <a
                                          className={`menu-link py-1 rounded-2 d-block ${isCountrySelected ? "text-primary fw-bold" : "text-body-secondary"}`}
                                          style={{ textDecoration: "none", fontSize: "12px", cursor: "pointer" }}
                                          href="#"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            handleSelectCountry(cat.id, country);
                                          }}
                                        >
                                          â€¢ {resolvedName}
                                        </a>
                                      </li>
                                    );
                                  })}
                                </ul>
                              )}
                            </li>
                          );
                        })}

                        {/* 2. Ná»™p há»“ sÆ¡ online */}
                        <li className="menu-item mb-1" style={{ listStyleType: "none" }}>
                          <a
                            className={`menu-link d-block px-3 py-1.5 rounded-2 ${
                              currentPage === "nophosoonline" ? "bg-primary-subtle text-primary fw-medium" : "text-body-secondary"
                            }`}
                            style={{ textDecoration: "none", fontSize: "13px" }}
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              onNavigate?.("nophosoonline");
                            }}
                          >
                            Ná»™p há»“ sÆ¡ online
                          </a>
                        </li>

                      </ul>
                    )}
                  </li>
                  <li className="menu-item mt-2 mb-1" style={{ listStyleType: "none" }}>
                    <a
                      className={`menu-link d-block px-3 py-2 rounded-2 ${
                        currentPage === "daotao" ? "bg-primary-subtle text-primary fw-medium" : "text-body-secondary"
                      }`}
                      style={{ textDecoration: "none", fontSize: "13.5px" }}
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigate?.("daotao");
                      }}
                    >
                      ÄÃ o táº¡o
                    </a>
                  </li>
                  <li className="menu-item mb-1" style={{ listStyleType: "none" }}>
                    <a
                      className={`menu-link d-block px-3 py-2 rounded-2 ${
                        currentPage === "banggia" ? "bg-primary-subtle text-primary fw-medium" : "text-body-secondary"
                      }`}
                      style={{ textDecoration: "none", fontSize: "13.5px" }}
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigate?.("banggia");
                      }}
                    >
                      Báº£ng giÃ¡
                    </a>
                  </li>
                  <li className="menu-item mb-1" style={{ listStyleType: "none" }}>
                    <a
                      className={`menu-link d-block px-3 py-2 rounded-2 ${
                        currentPage === "thongtintracuu" ? "bg-primary-subtle text-primary fw-medium" : "text-body-secondary"
                      }`}
                      style={{ textDecoration: "none", fontSize: "13.5px" }}
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigate?.("thongtintracuu");
                      }}
                    >
                      ThÃ´ng tin tra cá»©u
                    </a>
                  </li>
                </>
              )}
            </ul>
          </li>
        )}

          {/* --- 3. NGHIá»†P Vá»¤ --- */}
          <li className="menu-item mb-2 mt-2">
            <a
              className={`menu-link d-flex align-items-center px-2 py-2 rounded-2 ${["nghiepvu", "checklist", "sop", "doisoatdeal"].includes(currentPage) || (typeof currentPage === "string" && currentPage.startsWith("dept-")) ? "text-primary fw-bold" : "text-body-secondary"}`}
              href="#"
              role="button"
              style={{ textDecoration: "none" }}
              onClick={(e) => {
                e.preventDefault();
                setOpenMenu(openMenu === "nghiepvu" ? "" : "nghiepvu"); if (isSidebarMini && onToggleSidebar) onToggleSidebar();
              }}
            >
              <div
                className="d-flex align-items-center justify-content-center rounded-3 bg-body-secondary me-3 flex-shrink-0"
                style={{ width: "36px", height: "36px" }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                  <line x1="8" y1="21" x2="16" y2="21"></line>
                  <line x1="12" y1="17" x2="12" y2="21"></line>
                </svg>
              </div>
              <span
                className="menu-label"
                style={{ flex: 1, fontSize: "14px" }}
              >
                Nghiá»‡p vá»¥
              </span>
              <span
                style={{ cursor: "pointer", padding: "4px" }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setOpenMenu(openMenu === "nghiepvu" ? "" : "nghiepvu"); if (isSidebarMini && onToggleSidebar) onToggleSidebar();
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    transform:
                      openMenu === "nghiepvu"
                        ? "rotate(180deg)"
                        : "rotate(0deg)",
                    transition: "transform 0.3s ease",
                  }}
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </span>
            </a>
            <ul
              className="menu-inner list-unstyled mb-0"
              style={{
                display: openMenu === "nghiepvu" ? "block" : "none",
                paddingLeft: "32px",
              }}
            >
              {(() => {
                const roleKey = getUserRoleKey(currentUser);
                const isSystemAdmin = ["admin", "bangiamdoc"].includes(roleKey);
                const userDeptIds = currentUser?.departmentIds || (currentUser?.departmentId ? [currentUser.departmentId] : []);

                const visibleDepartments = isSystemAdmin
                  ? departments
                  : departments.filter(d => userDeptIds.includes(d.id));

                if (departmentsLoading) {
                  return (
                    <li className="menu-item mb-1">
                      <span className="d-block px-3 py-2 text-body-secondary" style={{ fontSize: "13px" }}>
                        Äang táº£i phÃ²ng ban...
                      </span>
                    </li>
                  );
                }

                if (visibleDepartments.length === 0) {
                  return (
                    <li className="menu-item mb-1">
                      <span className="d-block px-3 py-2 text-body-secondary" style={{ fontSize: "13px" }}>
                        KhÃ´ng cÃ³ phÃ²ng ban nghiá»‡p vá»¥
                      </span>
                    </li>
                  );
                }

                return visibleDepartments.map((dept) => {
                  const isDeptExpanded = expandedDeptId === dept.id;
                  const isSopActive = currentPage === `dept-sop:${dept.id}`;
                  const isDocsActive = currentPage === `dept-docs:${dept.id}`;
                  const isJdsActive = currentPage === `dept-jds:${dept.id}`;

                  return (
                    <li key={dept.id} className="menu-item mb-2 pb-1" style={{ listStyleType: "none" }}>
                      <a
                        className="menu-link d-flex align-items-center justify-content-between px-3 py-1.5 rounded-2 text-body-secondary"
                        href="#"
                        style={{ textDecoration: "none", fontSize: "13px", fontWeight: "600", transition: "all 0.2s" }}
                        onClick={(e) => {
                          e.preventDefault();
                          setExpandedDeptId(isDeptExpanded ? null : dept.id);
                        }}
                      >
                        <span className="text-truncate" style={{ maxWidth: "80%" }}>{dept.name}</span>
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          style={{
                            transform: isDeptExpanded ? "rotate(180deg)" : "rotate(0deg)",
                            transition: "transform 0.2s ease"
                          }}
                        >
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </a>

                      <ul
                        className="list-unstyled mb-0 mt-1 pl-3"
                        style={{
                          display: isDeptExpanded ? "block" : "none",
                          borderLeft: "1px dashed var(--bs-border-color)",
                          marginLeft: "16px",
                          paddingLeft: "12px",
                          listStyleType: "none"
                        }}
                      >
                        <li className="mb-1" style={{ listStyleType: "none" }}>
                          <a
                            className={`menu-link d-block py-1 rounded-2 ${isSopActive ? "text-primary fw-bold" : "text-body-secondary"}`}
                            style={{ textDecoration: "none", fontSize: "12px" }}
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              onNavigate?.(`dept-sop:${dept.id}`);
                            }}
                          >
                            â€¢ Ná»™i dung chung
                          </a>
                        </li>
                        <li className="mb-1" style={{ listStyleType: "none" }}>
                          <a
                            className={`menu-link d-block py-1 rounded-2 ${isDocsActive ? "text-primary fw-bold" : "text-body-secondary"}`}
                            style={{ textDecoration: "none", fontSize: "12px" }}
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              onNavigate?.(`dept-docs:${dept.id}`);
                            }}
                          >
                            â€¢ TÃ i liá»‡u phÃ²ng ban
                          </a>
                        </li>
                        <li className="mb-1" style={{ listStyleType: "none" }}>
                          <a
                            className={`menu-link d-block py-1 rounded-2 ${isJdsActive ? "text-primary fw-bold" : "text-body-secondary"}`}
                            style={{ textDecoration: "none", fontSize: "12px" }}
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              onNavigate?.(`dept-jds:${dept.id}`);
                            }}
                          >
                            â€¢ JD cÃ´ng viá»‡c
                          </a>
                        </li>
                      </ul>
                    </li>
                  );
                });
              })()}

              {/* Tra cá»©u trÆ°á»ng du há»c */}
              <li className="menu-item mb-1 border-top pt-1 mt-1" style={{ listStyleType: "none" }}>
                <a
                  className={`menu-link d-block px-3 py-2 rounded-2 ${currentPage === "schoolSearch" ? "bg-primary-subtle text-primary fw-medium" : "text-body-secondary"}`}
                  style={{ textDecoration: "none", fontSize: "13px" }}
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate?.("schoolSearch");
                  }}
                >
                  Tra cá»©u trÆ°á»ng du há»c
                </a>
              </li>

              {/* Váº«n giá»¯ trang Äá»‘i soÃ¡t Deal cho káº¿ toÃ¡n vÃ  quáº£n trá»‹ náº¿u cáº§n */}
              {(["admin", "bangiamdoc", "truongbophan", "congtacvien", "daily", "staff"].includes(getUserRoleKey(currentUser)) ||
                currentUser?.permissions?.includes("*") ||
                currentUser?.permissions?.includes("settings:manage") ||
                currentUser?.permissions?.includes("commissions:read") ||
                currentUser?.permissions?.includes("commissions:write")
              ) && (
                <li className="menu-item mb-1 border-top pt-1 mt-1" style={{ listStyleType: "none" }}>
                  <a
                    className={`menu-link d-block px-3 py-2 rounded-2 ${currentPage === "doisoatdeal" ? "bg-primary-subtle text-primary fw-medium" : "text-body-secondary"}`}
                    style={{ textDecoration: "none", fontSize: "13px" }}
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate?.("doisoatdeal");
                    }}
                  >
                    Äá»‘i soÃ¡t Deal
                  </a>
                </li>
              )}
            </ul>
          </li>

          {/* --- 4. Há»– TRá»¢ --- */}
          <li className="menu-item mb-2">
            <a
              className={`menu-link d-flex align-items-center px-2 py-2 rounded-2 ${["hotro", "leadForm"].includes(currentPage) ? "text-primary fw-bold" : "text-body-secondary"}`}
              href="#"
              role="button"
              style={{ textDecoration: "none" }}
              onClick={(e) => {
                e.preventDefault();
                onNavigate?.("hotro");
              }}
            >
              <div
                className="d-flex align-items-center justify-content-center rounded-3 bg-body-secondary me-3 flex-shrink-0"
                style={{ width: "36px", height: "36px" }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              </div>
              <span
                className="menu-label"
                style={{ flex: 1, fontSize: "14px" }}
              >
                Há»— trá»£
              </span>
              <span
                style={{ cursor: "pointer", padding: "4px" }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setOpenMenu(openMenu === "hotro" ? "" : "hotro"); if (isSidebarMini && onToggleSidebar) onToggleSidebar();
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    transform:
                      openMenu === "hotro" ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.3s ease",
                  }}
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </span>
            </a>
            <ul
              className="menu-inner list-unstyled mb-0"
              style={{
                display: openMenu === "hotro" ? "block" : "none",
                paddingLeft: "52px",
              }}
            >
              <li className="menu-item mb-1">
                <a
                  className="menu-link d-block px-3 py-2 rounded-2 text-body-secondary"
                  style={{ textDecoration: "none", fontSize: "13px" }}
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate?.("hotro", { activeTab: "ticket" });
                  }}
                >
                  Táº¡o Ticket
                </a>
              </li>
              <li className="menu-item mb-1">
                <a
                  className={`menu-link d-block px-3 py-2 rounded-2 ${currentPage === "leadForm" ? "bg-primary-subtle text-primary fw-medium" : "text-body-secondary"}`}
                  style={{ textDecoration: "none", fontSize: "13px" }}
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate?.("leadForm");
                  }}
                >
                  Gá»­i lead khÃ¡ch hÃ ng
                </a>
              </li>
              <li className="menu-item mb-1">
                <a
                  className="menu-link d-block px-3 py-2 rounded-2 text-body-secondary"
                  style={{ textDecoration: "none", fontSize: "13px" }}
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate?.("hotro", { activeTab: "guide" });
                  }}
                >
                  ðŸ“˜ HÆ°á»›ng dáº«n sá»­ dá»¥ng Portal
                </a>
              </li>
            </ul>
          </li>

          {/* --- 5. TIN Tá»¨C & Sá»° KIá»†N --- */}
          <li className="menu-item mb-2">
            <a
              className={`menu-link d-flex align-items-center px-2 py-2 rounded-2 ${isNewsPage ? "text-primary fw-bold" : "text-body-secondary"}`}
              href="#"
              style={{ textDecoration: "none" }}
              role="button"
              onClick={(e) => {
                e.preventDefault();
                if (canManageNews) {
                  setOpenMenu(openMenu === "newsEvents" ? "" : "newsEvents"); if (isSidebarMini && onToggleSidebar) onToggleSidebar();
                } else {
                  onNavigate?.("tintuc");
                }
              }}
            >
              <div
                className="d-flex align-items-center justify-content-center rounded-3 bg-body-secondary me-3 flex-shrink-0"
                style={{ width: "36px", height: "36px" }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
              <span
                className="menu-label"
                style={{ flex: 1, fontSize: "14px" }}
              >
                Tin tá»©c & Sá»± kiá»‡n
              </span>
              {canManageNews && (
                <span
                  style={{
                    cursor: "pointer",
                    padding: "4px",
                    display: "inline-flex",
                    alignItems: "center",
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setOpenMenu(openMenu === "newsEvents" ? "" : "newsEvents"); if (isSidebarMini && onToggleSidebar) onToggleSidebar();
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      transform:
                        openMenu === "newsEvents"
                          ? "rotate(180deg)"
                          : "rotate(0deg)",
                      transition: "transform 0.3s ease",
                    }}
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </span>
              )}
            </a>
            {canManageNews && (
              <ul
                className="menu-inner list-unstyled mb-0"
                style={{
                  display: openMenu === "newsEvents" ? "block" : "none",
                  paddingLeft: "52px",
                  marginTop: "4px",
                }}
              >
                <li className="menu-item mb-1">
                  <a
                    className={`menu-link d-block px-3 py-2 rounded-2 ${currentPage === "tintuc" ? "bg-primary-subtle text-primary fw-medium" : "text-body-secondary"}`}
                    href="#"
                    style={{ textDecoration: "none", fontSize: "13px" }}
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate?.("tintuc");
                    }}
                  >
                    ChuyÃªn trang tin
                  </a>
                </li>
                <li className="menu-item mb-1">
                  <a
                    className={`menu-link d-block px-3 py-2 rounded-2 ${currentPage === "newsEventsManage" ? "bg-primary-subtle text-primary fw-medium" : "text-body-secondary"}`}
                    href="#"
                    style={{ textDecoration: "none", fontSize: "13px" }}
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate?.("newsEventsManage");
                    }}
                  >
                    Quáº£n lÃ½ bÃ i viáº¿t
                  </a>
                </li>
              </ul>
            )}
          </li>

          {/* --- KHO MEDIA --- */}
          <li className="menu-item mb-2">
            <a
              className={`menu-link d-flex align-items-center px-2 py-2 rounded-2 ${currentPage === "media-repository" ? "text-primary fw-bold" : "text-body-secondary"}`}
              href="#"
              style={{ textDecoration: "none" }}
              onClick={(e) => {
                e.preventDefault();
                onNavigate?.("media-repository");
              }}
            >
              <div
                className="d-flex align-items-center justify-content-center rounded-3 bg-body-secondary me-3 flex-shrink-0"
                style={{ width: "36px", height: "36px" }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
              </div>
              <span
                className="menu-label"
                style={{ flex: 1, fontSize: "14px" }}
              >
                Media Repository
              </span>
            </a>
          </li>

          {/* --- 7. TÃ€I LIá»†U & BIá»‚U MáºªU --- */}
          <li className="menu-item mb-2">
            <a
              className={`menu-link d-flex align-items-center px-2 py-2 rounded-2 ${currentPage === "notifications" ? "text-primary fw-bold" : "text-body-secondary"}`}
              href="#"
              style={{ textDecoration: "none" }}
              onClick={(e) => {
                e.preventDefault();
                onNavigate?.("notifications");
              }}
            >
              <div
                className="d-flex align-items-center justify-content-center rounded-3 bg-body-secondary me-3 flex-shrink-0"
                style={{ width: "36px", height: "36px" }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
              </div>
              <span
                className="menu-label"
                style={{ flex: 1, fontSize: "14px" }}
              >
                ThÃ´ng bÃ¡o ná»™i bá»™
              </span>
            </a>
          </li>

          <li className="menu-item mb-2">
            <a
              className={`menu-link d-flex align-items-center px-2 py-2 rounded-2 ${["documents", "documentSearch"].includes(currentPage) ? "text-primary fw-bold" : "text-body-secondary"}`}
              href="#"
              role="button"
              style={{ textDecoration: "none" }}
              onClick={(e) => {
                e.preventDefault();
                onNavigate?.("documents");
              }}
            >
              <div
                className="d-flex align-items-center justify-content-center rounded-3 bg-body-secondary me-3 flex-shrink-0"
                style={{ width: "36px", height: "36px" }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </div>
              <span
                className="menu-label"
                style={{ flex: 1, fontSize: "14px" }}
              >
                TÃ i liá»‡u & Biá»ƒu máº«u
              </span>
              <span
                style={{ cursor: "pointer", padding: "4px" }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setOpenMenu(openMenu === "documents" ? "" : "documents"); if (isSidebarMini && onToggleSidebar) onToggleSidebar();
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    transform:
                      openMenu === "documents"
                        ? "rotate(180deg)"
                        : "rotate(0deg)",
                    transition: "transform 0.3s ease",
                  }}
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </span>
            </a>
            <ul
              className="menu-inner list-unstyled mb-0"
              style={{
                display: openMenu === "documents" ? "block" : "none",
                paddingLeft: "52px",
                marginTop: "4px",
              }}
            >
              <li className="menu-item mb-1">
                <a
                  className={`menu-link d-block px-3 py-2 rounded-2 ${currentPage === "documentSearch" ? "bg-primary-subtle text-primary fw-medium" : "text-body-secondary"}`}
                  style={{ textDecoration: "none", fontSize: "13px" }}
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate?.("documentSearch");
                  }}
                >
                  TÃ¬m kiáº¿m tÃ i liá»‡u
                </a>
              </li>
            </ul>
          </li>

          {/* --- 8A. AI Ná»˜I Bá»˜ --- */}
          {canViewAIManagement(currentUser) && (
            <li className="menu-item mb-2">
              <a
                className={`menu-link d-flex align-items-center px-2 py-2 rounded-2 ${["aiConfig", "aiPending", "aiHistory"].includes(currentPage) ? "text-primary fw-bold" : "text-body-secondary"}`}
                href="#"
                role="button"
                style={{ textDecoration: "none" }}
                onClick={(e) => {
                  e.preventDefault();
                  setOpenMenu(openMenu === "ai" ? "" : "ai"); if (isSidebarMini && onToggleSidebar) onToggleSidebar();
                }}
              >
                <div
                  className="d-flex align-items-center justify-content-center rounded-3 bg-body-secondary me-3 flex-shrink-0"
                  style={{ width: "36px", height: "36px" }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 2a4 4 0 0 0-4 4v2H6a4 4 0 0 0-4 4v2a4 4 0 0 0 4 4h2v2a4 4 0 0 0 8 0v-2h2a4 4 0 0 0 4-4v-2a4 4 0 0 0-4-4h-2V6a4 4 0 0 0-4-4z"></path>
                    <path d="M9 12h6"></path>
                    <path d="M12 9v6"></path>
                  </svg>
                </div>
                <span
                  className="menu-label"
                  style={{ flex: 1, fontSize: "14px" }}
                >
                  AI ná»™i bá»™
                </span>
                <span
                  style={{ cursor: "pointer", padding: "4px" }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setOpenMenu(openMenu === "ai" ? "" : "ai"); if (isSidebarMini && onToggleSidebar) onToggleSidebar();
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      transform:
                        openMenu === "ai" ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.3s ease",
                    }}
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </span>
              </a>

              {/* <ul className="menu-inner list-unstyled mb-0" style={{ display: openMenu === "ai" ? "block" : "none", paddingLeft: "52px", marginTop: "4px" }}>
                {isAdmin(currentUser) && (
                  <li className="menu-item mb-1">
                    <a
                      className={`menu-link d-block px-3 py-2 rounded-2 ${currentPage === "aiConfig" ? "bg-primary-subtle text-primary fw-medium" : "text-body-secondary"}`}
                      style={{ textDecoration: "none", fontSize: "13px" }}
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigate?.("aiConfig");
                      }}
                    >
                      Cáº¥u hÃ¬nh AI
                    </a>
                  </li>
                )}

                <li className="menu-item mb-1">
                  <a
                    className={`menu-link d-block px-3 py-2 rounded-2 ${currentPage === "aiPending" ? "bg-primary-subtle text-primary fw-medium" : "text-body-secondary"}`}
                    style={{ textDecoration: "none", fontSize: "13px" }}
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate?.("aiPending");
                    }}
                  >
                    CÃ¢u há»i AI pending
                  </a>
                </li>

                {["admin", "bangiamdoc", "hethong"].includes(currentUser?.role) && (
                  <li className="menu-item mb-1">
                    <a
                      className={`menu-link d-block px-3 py-2 rounded-2 ${currentPage === "aiHistory" ? "bg-primary-subtle text-primary fw-medium" : "text-body-secondary"}`}
                      style={{ textDecoration: "none", fontSize: "13px" }}
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigate?.("aiHistory");
                      }}
                    >
                      Thá»‘ng kÃª lá»‹ch sá»­ AI
                    </a>
                  </li>
                )}
              </ul> */}
            </li>
          )}

          {/* --- 8. QUáº¢N LÃ TÃ€I KHOáº¢N --- */}

          {(["admin", "bangiamdoc"].includes(getUserRoleKey(currentUser)) ||
            currentUser?.permissions?.includes("users:read") ||
            currentUser?.permissions?.includes("*")
          ) && (
            <li className="menu-item mb-2 border-top pt-3 mt-3">
              <a
                className={`menu-link d-flex align-items-center px-2 py-2 rounded-2 ${currentPage === "users" ? "text-primary fw-bold" : "text-body-secondary"}`}
                href="#"
                style={{ textDecoration: "none" }}
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate?.("users");
                }}
              >
                <div
                  className="d-flex align-items-center justify-content-center rounded-3 bg-body-secondary me-3 flex-shrink-0"
                  style={{ width: "36px", height: "36px" }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </div>
                <span
                  className="menu-label"
                  style={{ flex: 1, fontSize: "14px" }}
                >
                  Quáº£n lÃ½ tÃ i khoáº£n
                </span>
              </a>
            </li>
          )}

          {/* --- 8B. QUáº¢N LÃ VAI TRÃ’ --- */}
          {(["admin", "bangiamdoc"].includes(getUserRoleKey(currentUser)) ||
            currentUser?.permissions?.includes("roles:read") ||
            currentUser?.permissions?.includes("roles:write") ||
            currentUser?.permissions?.includes("*")
          ) && (
            <li className="menu-item mb-2">
              <a
                className={`menu-link d-flex align-items-center px-2 py-2 rounded-2 ${currentPage === "roles" ? "text-primary fw-bold" : "text-body-secondary"}`}
                href="#"
                style={{ textDecoration: "none" }}
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate?.("roles");
                }}
              >
                <div
                  className="d-flex align-items-center justify-content-center rounded-3 bg-body-secondary me-3 flex-shrink-0"
                  style={{ width: "36px", height: "36px" }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                </div>
                <span
                  className="menu-label"
                  style={{ flex: 1, fontSize: "14px" }}
                >
                  Quáº£n lÃ½ vai trÃ²
                </span>
              </a>
            </li>
          )}

          {/* --- 7B. QUáº¢N LÃ Sáº¢N PHáº¨M --- */}
          {(["admin", "bangiamdoc", "truongbophan"].includes(getUserRoleKey(currentUser)) ||
            currentUser?.permissions?.includes("products:write") ||
            currentUser?.permissions?.includes("*")
          ) && (
            <li className="menu-item mb-2">
              <a
                className={`menu-link d-flex align-items-center px-2 py-2 rounded-2 ${currentPage === "productManagement" ? "text-primary fw-bold" : "text-body-secondary"}`}
                href="#"
                style={{ textDecoration: "none" }}
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate?.("productManagement");
                }}
              >
                <div
                  className="d-flex align-items-center justify-content-center rounded-3 bg-body-secondary me-3 flex-shrink-0"
                  style={{ width: "36px", height: "36px" }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="3" width="7" height="9"></rect>
                    <rect x="14" y="3" width="7" height="5"></rect>
                    <rect x="14" y="12" width="7" height="9"></rect>
                    <rect x="3" y="16" width="7" height="5"></rect>
                  </svg>
                </div>
                <span
                  className="menu-label"
                  style={{ flex: 1, fontSize: "14px" }}
                >
                  Quáº£n lÃ½ sáº£n pháº©m
                </span>
              </a>
            </li>
          )}

          {isAdmin(currentUser) && (
            <>
              <li className="menu-item mb-2">
                <a
                  className={`menu-link d-flex align-items-center px-2 py-2 rounded-2 ${currentPage === "departments" ? "text-primary fw-bold" : "text-body-secondary"}`}
                  href="#"
                  style={{ textDecoration: "none" }}
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate?.("departments");
                  }}
                >
                  <div
                    className="d-flex align-items-center justify-content-center rounded-3 bg-body-secondary me-3 flex-shrink-0"
                    style={{ width: "36px", height: "36px" }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                      <path d="M8 13h8"></path>
                      <path d="M8 16h5"></path>
                    </svg>
                  </div>
                  <span
                    className="menu-label"
                    style={{ flex: 1, fontSize: "14px" }}
                  >
                    PhÃ²ng ban
                  </span>
                </a>
              </li>

              <li className="menu-item mb-2">
                <a
                  className={`menu-link d-flex align-items-center px-2 py-2 rounded-2 ${currentPage === "auditLogs" ? "text-primary fw-bold" : "text-body-secondary"}`}
                  href="#"
                  style={{ textDecoration: "none" }}
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate?.("auditLogs");
                  }}
                >
                  <div
                    className="d-flex align-items-center justify-content-center rounded-3 bg-body-secondary me-3 flex-shrink-0"
                    style={{ width: "36px", height: "36px" }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M8 6h13"></path>
                      <path d="M8 12h13"></path>
                      <path d="M8 18h13"></path>
                      <path d="M3 6h.01"></path>
                      <path d="M3 12h.01"></path>
                      <path d="M3 18h.01"></path>
                    </svg>
                  </div>
                  <span
                    className="menu-label"
                    style={{ flex: 1, fontSize: "14px" }}
                  >
                    Lá»‹ch sá»­ thao tÃ¡c
                  </span>
                </a>
              </li>

              <li className="menu-item mb-2">
                <a
                  className={`menu-link d-flex align-items-center px-2 py-2 rounded-2 ${currentPage === "systemSettings" ? "text-primary fw-bold" : "text-body-secondary"}`}
                  href="#"
                  style={{ textDecoration: "none" }}
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate?.("systemSettings");
                  }}
                >
                  <div
                    className="d-flex align-items-center justify-content-center rounded-3 bg-body-secondary me-3 flex-shrink-0"
                    style={{ width: "36px", height: "36px" }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="3"></circle>
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                    </svg>
                  </div>
                  <span
                    className="menu-label"
                    style={{ flex: 1, fontSize: "14px" }}
                  >
                    Cáº¥u hÃ¬nh há»‡ thá»‘ng
                  </span>
                </a>
              </li>

              <li className="menu-item mb-2">
                <a
                  className={`menu-link d-flex align-items-center px-2 py-2 rounded-2 ${currentPage === "surveyManagement" ? "text-primary fw-bold" : "text-body-secondary"}`}
                  href="#"
                  style={{ textDecoration: "none" }}
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate?.("surveyManagement");
                  }}
                >
                  <div
                    className="d-flex align-items-center justify-content-center rounded-3 bg-body-secondary me-3 flex-shrink-0"
                    style={{ width: "36px", height: "36px" }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 11l3 3L22 4"></path>
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                    </svg>
                  </div>
                  <span
                    className="menu-label"
                    style={{ flex: 1, fontSize: "14px" }}
                  >
                    Quáº£n lÃ½ kháº£o sÃ¡t
                  </span>
                </a>
              </li>
            </>
          )}

          {/* ========================================================================= */}
          {/* TOÃ€N Bá»˜ CÃC ÄOáº N COMMENT CÅ¨ GIá»® NGUYÃŠN BÃŠN DÆ¯á»šI (ÄÃƒ FIX Lá»–I /) */}
          {/* ========================================================================= */}

          {/* <li className="menu-item">
              <a className="menu-link" href="/chat.html">
                <i className="icon-message-square-text"></i>
                <span className="menu-label">Chat</span>
              </a>
            </li>
            <li className="menu-item">
              <a className="menu-link" href="/calendar.html">
                <i className="icon-calendar-days"></i>
                <span className="menu-label">Calendar</span>
              </a>
            </li> */}

          {/* <li className="menu-item menu-arrow">
              <a className="menu-link" href="#" role="button">
                <i className="icon-mail-open"></i>
                <span className="menu-label">Email</span>
              </a>
              <ul className="menu-inner">
                <li className="menu-item"><a className="menu-link" href="/email/inbox.html"><span className="menu-label">Inbox</span></a></li>
                <li className="menu-item"><a className="menu-link" href="/email/compose.html"><span className="menu-label">Compose</span></a></li>
                <li className="menu-item"><a className="menu-link" href="/email/read-email.html"><span className="menu-label">Read email</span></a></li>
              </ul>
            </li> */}

          {/* <li className="menu-item menu-arrow">
              <a className="menu-link" href="#" role="button">
                <i className="icon-file"></i>
                <span className="menu-label">Pages</span>
              </a>
              <ul className="menu-inner">
                <li className="menu-item"><a className="menu-link" href="/pages/pricing.html"><span className="menu-label">Pricing</span></a></li>
                <li className="menu-item"><a className="menu-link" href="/pages/faq.html"><span className="menu-label">FAQ's</span></a></li>
                <li className="menu-item"><a className="menu-link" href="/pages/coming-soon.html"><span className="menu-label">Coming Soon</span></a></li>
                <li className="menu-item"><a className="menu-link" href="/pages/error-404.html"><span className="menu-label">Error 404</span></a></li>
              </ul>
            </li>  */}

          {/* <li className="menu-item menu-arrow">
              <a className="menu-link" href="#" role="button">
                <i className="icon-circle-user-round"></i>
                <span className="menu-label">Authentication</span>
              </a>
              <ul className="menu-inner">
                <li className="menu-item"><a className="menu-link" href="/authentication/login.html"><span className="menu-label">Login</span></a></li>
                <li className="menu-item"><a className="menu-link" href="/authentication/register.html"><span className="menu-label">Register</span></a></li>
                <li className="menu-item"><a className="menu-link" href="/authentication/forgot-password.html"><span className="menu-label">Forgot Password</span></a></li>
                <li className="menu-item"><a className="menu-link" href="/authentication/new-password.html"><span className="menu-label">New Password</span></a></li>
              </ul>
            </li> */}

          {/* <li className="menu-item menu-arrow">
              <a className="menu-link" href="#" role="button">
                <i className="icon-folder-open"></i>
                <span className="menu-label">UI Components</span>
              </a>
              <ul className="menu-inner">
                <li className="menu-item"><a className="menu-link" href="/components/accordion.html"><span className="menu-label">Accordion</span></a></li>
                <li className="menu-item"><a className="menu-link" href="/components/alerts.html"><span className="menu-label">Alerts</span></a></li>
                <li className="menu-item"><a className="menu-link" href="/components/badge.html"><span className="menu-label">Badge</span></a></li>
                <li className="menu-item"><a className="menu-link" href="/components/breadcrumb.html"><span className="menu-label">Breadcrumb</span></a></li>
                <li className="menu-item"><a className="menu-link" href="/components/buttons.html"><span className="menu-label">Buttons</span></a></li>
                <li className="menu-item"><a className="menu-link" href="/components/typography.html"><span className="menu-label">Typography</span></a></li>
                <li className="menu-item"><a className="menu-link" href="/components/button-group.html"><span className="menu-label">Button Group</span></a></li>
                <li className="menu-item"><a className="menu-link" href="/components/card.html"><span className="menu-label">Card</span></a></li>
                <li className="menu-item"><a className="menu-link" href="/components/collapse.html"><span className="menu-label">Collapse</span></a></li>
                <li className="menu-item"><a className="menu-link" href="/components/carousel.html"><span className="menu-label">Carousel</span></a></li>
                <li className="menu-item"><a className="menu-link" href="/components/dropdowns.html"><span className="menu-label">Dropdowns</span></a></li>
                <li className="menu-item"><a className="menu-link" href="/components/modal.html"><span className="menu-label">Modal</span></a></li>
                <li className="menu-item"><a className="menu-link" href="/components/list-group.html"><span className="menu-label">List Group</span></a></li>
                <li className="menu-item"><a className="menu-link" href="/components/tabs.html"><span className="menu-label">Tabs</span></a></li>
                <li className="menu-item"><a className="menu-link" href="/components/offcanvas.html"><span className="menu-label">Offcanvas</span></a></li>
                <li className="menu-item"><a className="menu-link" href="/components/pagination.html"><span className="menu-label">Pagination</span></a></li>
                <li className="menu-item"><a className="menu-link" href="/components/popovers.html"><span className="menu-label">Popovers</span></a></li>
                <li className="menu-item"><a className="menu-link" href="/components/progress.html"><span className="menu-label">Progress</span></a></li>
                <li className="menu-item"><a className="menu-link" href="/components/scrollspy.html"><span className="menu-label">Scrollspy</span></a></li>
                <li className="menu-item"><a className="menu-link" href="/components/spinners.html"><span className="menu-label">Spinners</span></a></li>
                <li className="menu-item"><a className="menu-link" href="/components/toasts.html"><span className="menu-label">Toasts</span></a></li>
                <li className="menu-item"><a className="menu-link" href="/components/tooltips.html"><span className="menu-label">Tooltips</span></a></li>
              </ul>
            </li> */}

          {/* <li className="menu-item menu-arrow">
              <a className="menu-link" href="#" role="button">
                <i className="icon-star"></i>
                <span className="menu-label">Icons</span>
              </a>
              <ul className="menu-inner">
                <li className="menu-item"><a className="menu-link" href="/icons/flaticon.html"><span className="menu-label">Flaticon</span></a></li>
                <li className="menu-item"><a className="menu-link" href="/icons/lucide.html"><span className="menu-label">Lucide</span></a></li>
                <li className="menu-item"><a className="menu-link" href="/icons/fontawesome.html"><span className="menu-label">Font Awesome</span></a></li>
              </ul>
            </li> */}

          {/* <li className="menu-item menu-arrow">
              <a className="menu-link" href="#" role="button">
                <i className="icon-table-2"></i>
                <span className="menu-label">Table</span>
              </a>
              <ul className="menu-inner">
                <li className="menu-item"><a className="menu-link" href="/table/tables-basic.html"><span className="menu-label">Table</span></a></li>
                <li className="menu-item"><a className="menu-link" href="/table/tables-datatable.html"><span className="menu-label">Datatable</span></a></li>
              </ul>
            </li>
            
            <li className="menu-item menu-arrow">
              <a className="menu-link" href="#" role="button">
                <i className="icon-chart-pie"></i>
                <span className="menu-label">Charts</span>
              </a>
              <ul className="menu-inner">
                <li className="menu-item"><a className="menu-link" href="/chart/apexchart.html"><span className="menu-label">Apex Chart</span></a></li>
                <li className="menu-item"><a className="menu-link" href="/chart/chartjs.html"><span className="menu-label">Chart JS</span></a></li>
              </ul>
            </li>
            
            <li className="menu-item menu-arrow">
              <a className="menu-link" href="#" role="button">
                <i className="icon-map-pinned"></i>
                <span className="menu-label">Maps</span>
              </a>
              <ul className="menu-inner">
                <li className="menu-item"><a className="menu-link" href="/maps/jsvectormap.html"><span className="menu-label">JS Vector Map</span></a></li>
                <li className="menu-item"><a className="menu-link" href="/maps/leaflet.html"><span className="menu-label">Leaflet</span></a></li>
              </ul>
            </li>
            
            <li className="menu-item">
              <a className="menu-link" href="#">
                <i className="icon-badge-percent"></i>
                <span className="menu-label">Badge</span>
                <span className="badge badge-sm rounded-pill bg-secondary ms-2 float-end">5</span>
              </a>
            </li>
            
            <li className="menu-item menu-arrow">
              <a className="menu-link" href="#" role="button">
                <i className="icon-layers"></i>
                <span className="menu-label">Multi Level</span>
              </a>
              <ul className="menu-inner">
                <li className="menu-item menu-arrow">
                  <a className="menu-link" href="#">
                    <span className="menu-label">Multi Level 2</span>
                  </a>
                  <ul className="menu-inner">
                    <li className="menu-item"><a className="menu-link" href="#"><span className="menu-label">Multi Level 3</span></a></li>
                    <li className="menu-item"><a className="menu-link" href="#"><span className="menu-label">Multi Level 3</span></a></li>
                    <li className="menu-item"><a className="menu-link" href="#"><span className="menu-label">Multi Level 3</span></a></li>
                  </ul>
                </li>
              </ul>
            </li> */}
        </ul>
      </nav>
      <div className="app-footer">
        <button
          onClick={(e) => {
            e.preventDefault();
            onNavigate?.("hotro");
          }}
          className="btn btn-outline-light btn-shadow btn-app-nav w-100 d-flex align-items-center justify-content-center bg-transparent border"
          style={{ textDecoration: "none" }}
        >
          <i className="fi fi-rs-interrogation text-primary me-2"></i>
          <span className="nav-text">Help and Support</span>
        </button>
      </div>
    </aside>
  );
};

