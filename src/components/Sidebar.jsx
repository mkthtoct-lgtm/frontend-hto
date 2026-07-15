import { useEffect, useState, useMemo } from "react";
import { API_BASE_URL } from "../config/api";
import { authFetch, getAuthHeaders } from "../auth/session";

const ADMIN_ROLE_ID = "69fc5af582ef85451120772a";

// Key dùng chung với ProductOverviewPage.jsx để truyền danh mục được chọn khi điều hướng
const SIDEBAR_CATEGORY_STORAGE_KEY = "hto_selected_product_category";
// Sự kiện dùng để báo cho ProductOverviewPage (nếu đã mount sẵn) cập nhật ngay khi đổi danh mục
const SIDEBAR_CATEGORY_EVENT = "hto:select-product-category";

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

const ROLE_ID_MAP = {
  "69fc5af582ef85451120772a": "admin",
  "69fc5af582ef85451120772b": "bangiamdoc",
  "69fc5af582ef85451120772c": "truongbophan",
  "69fc5af582ef85451120772d": "nhansu",
  "69fc5af582ef85451120772e": "daily",
  "69fc5af682ef85451120772f": "user",
  "69fc5af782ef854511207730": "congtacvien",
  "60c72b2f9b1d8b2bad000001": "staff",
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

// KIỂM TRA QUYỀN XEM CHI TIẾT SẢN PHẨM (cho phép tất cả người dùng xem)
const canViewProductDetails = (user) => {
  return true;
};

// KIỂM TRA QUYỀN HẠN ĐỘNG CỦA USER
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
      name: cat?.name || "Danh mục chưa đặt tên",
      status: cat?.status || "active",
    }))
    .filter((cat) => cat.id && cat.name);
};

export const Sidebar = ({
  currentUser,
  onNavigate,
  currentPage,
  onToggleSidebar,
}) => {
  const [openMenu, setOpenMenu] = useState(() =>
    ["tintuc", "newsEventsManage"].includes(currentPage)
      ? "newsEvents"
      : "sanpham",
  );

  // ==========================================
  // DANH MỤC SẢN PHẨM TỪ API
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

  // Lắng nghe sự kiện chọn danh mục (từ bộ lọc MegaMenu)
  useEffect(() => {
    const handleCategorySelect = (event) => {
      const detail = event?.detail || {};
      if (detail.fromSidebar) return; // Bỏ qua nếu sự kiện phát ra từ chính sidebar

      if (detail.id) {
        setSelectedCategoryId(detail.id);
        setSelectedCountryName(detail.country && detail.country !== "Tất cả" ? detail.country : null);
        setExpandedProductCatId(detail.id);
        setSelectedRegionName(detail.region && detail.region !== "Tất cả" ? detail.region : null);
      } else {
        if (detail.name === "Tất cả") {
          setSelectedCategoryId(null);
          setSelectedCountryName(null);
          setSelectedRegionName(detail.region && detail.region !== "Tất cả" ? detail.region : null);
        } else {
          // Find category by name
          const cat = productCategories.find(c => c.name === detail.name);
          if (cat) {
            setSelectedCategoryId(cat.id);
            setSelectedCountryName(detail.country && detail.country !== "Tất cả" ? detail.country : null);
            setExpandedProductCatId(cat.id);
            setSelectedRegionName(detail.region && detail.region !== "Tất cả" ? detail.region : null);
          } else {
            setSelectedCategoryId(null);
            setSelectedCountryName(null);
            setSelectedRegionName(detail.region && detail.region !== "Tất cả" ? detail.region : null);
          }
        }
      }

      // Tự động mở rộng nhóm tương ứng
      const serviceNames = ["visa", "định cư", "dinh cu"];
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

  // Fetch danh mục từ API và trích xuất danh sách quốc gia
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
              console.warn(`[Sidebar] Lỗi tải sản phẩm cho danh mục ${cat.name}:`, err.message);
              return { ...cat, countries: [], products: [] };
            }
          })
        );

        // Di chuyển sản phẩm "Dịch vụ Visa" (Nhật Bản) từ danh mục "Dịch vụ" sang danh mục "Visa"
        const catDichVu = categoriesWithCountries.find(c => c.name.toLowerCase() === "dịch vụ" || c.name.toLowerCase() === "dich vu");
        const catVisa = categoriesWithCountries.find(c => c.name.toLowerCase() === "visa");

        if (catDichVu && catVisa) {
          const visaJapanProds = catDichVu.products.filter(p => {
            const nameLower = (p.name || "").toLowerCase();
            return nameLower.includes("visa") && resolveCountryName(p.country) === "Nhật Bản";
          });

          if (visaJapanProds.length > 0) {
            // Cập nhật categoryId cho các sản phẩm di chuyển
            visaJapanProds.forEach(p => {
              p.categoryId = catVisa.id;
              p.categoryName = catVisa.name;
            });

            // Xóa khỏi Dịch vụ
            catDichVu.products = catDichVu.products.filter(p => !visaJapanProds.includes(p));
            // Cập nhật lại countries của Dịch vụ
            const seenDichVu = new Set();
            catDichVu.countries = [];
            catDichVu.products.forEach(p => {
              if (p.country && !seenDichVu.has(p.country)) {
                seenDichVu.add(p.country);
                catDichVu.countries.push(p.country);
              }
            });

            // Thêm vào Visa
            catVisa.products = [...catVisa.products, ...visaJapanProds];
            // Cập nhật lại countries của Visa
            const seenVisa = new Set(catVisa.countries);
            visaJapanProds.forEach(p => {
              if (p.country && !seenVisa.has(p.country)) {
                seenVisa.add(p.country);
                catVisa.countries.push(p.country);
              }
            });
            // Sắp xếp lại countries của Visa
            catVisa.countries.sort((a, b) => resolveCountryName(a).localeCompare(resolveCountryName(b), "vi"));
          }
        }

        if (isMounted) setProductCategories(categoriesWithCountries);
      } catch (err) {
        console.warn(
          "[Sidebar] Không tải được danh mục sản phẩm, sử dụng Mock Data dự phòng:",
          err.message,
        );
        
        // Mock fallback to keep development functional
        const mockCategoriesNormalized = [
          {
            id: "cat-1",
            name: "Du học hè",
            countries: ["Singapore"],
            products: [
              {
                id: "prog-1-1",
                name: "Du học hè Singapore",
                country: "Singapore",
                region: "Châu Á",
                status: "active"
              }
            ]
          },
          {
            id: "cat-2",
            name: "Du học nghề",
            countries: ["Đức"],
            products: [
              {
                id: "prog-voc-1",
                name: "Du học nghề Đức",
                country: "Đức",
                region: "Châu Âu",
                status: "active"
              }
            ]
          },
          {
            id: "cat-3",
            name: "Visa",
            countries: ["Úc"],
            products: [
              {
                id: "prog-visa-1",
                name: "Dịch vụ xin Visa Úc trọn gói",
                country: "Úc",
                region: "Châu Đại Dương",
                status: "active"
              }
            ]
          },
          {
            id: "cat-4",
            name: "Định cư",
            countries: ["Canada"],
            products: [
              {
                id: "prog-settle-1",
                name: "Định cư đầu tư Canada",
                country: "Canada",
                region: "Châu Mỹ",
                status: "active"
              }
            ]
          },
          {
            id: "cat-5",
            name: "Đào tạo ngôn ngữ",
            countries: ["Đức"],
            products: [
              {
                id: "prog-lang-1",
                name: "Khóa học tiếng Đức B1",
                country: "Đức",
                region: "Châu Âu",
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

  // Phân chia danh mục thành các nhóm cho Tuyển Sinh Du Học và Dịch Vụ
  const categorizedMenu = useMemo(() => {
    const trainingKeywords = ["đào tạo ngôn ngữ", "dao tao ngon ngu", "ngôn ngữ", "ngon ngu", "ngoại ngữ", "tiếng"];
    const continentKeywords = ["châu mỹ", "châu âu", "châu á", "châu đại dương", "chau my", "chau au", "chau a", "chau dai duong"];
    const vocationalKeywords = ["du học nghề", "du hoc nghe", "nghề", "nghe", "tts quốc tế", "tts quoc te"];
    const summerKeywords = ["du học hè", "du hoc he", "hè", "he", "trại hè", "trai he"];

    const result = {
      tuyenSinh: {
        ttsQuocTe: null, // Danh mục Du học nghề
        duHocHe: null,   // Danh mục Du học hè
        continents: []   // Các danh mục châu lục (Châu Mỹ, Châu Âu...)
      },
      daoTao: null,      // Danh mục Đào tạo ngôn ngữ
      dichVu: []         // Các danh mục Dịch vụ (Visa, Định cư...)
    };

    productCategories.forEach(cat => {
      const nameLower = cat.name.toLowerCase();
      
      // Bỏ qua danh mục Dịch vụ rỗng (vì sản phẩm của nó đã được chuyển sang Visa)
      if (nameLower === "dịch vụ" || nameLower === "dich vu") {
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

    // Sắp xếp thứ tự các Châu lục
    const order = ["châu mỹ", "châu âu", "châu á", "châu đại dương"];
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

        // --- BỔ SUNG PHÒNG BAN ẨN MÀ USER THUỘC VỀ ---
        const userDeptIds = currentUser?.departmentIds || (currentUser?.departmentId ? [currentUser.departmentId] : []);
        const KNOWN_HIDDEN_DEPTS = {
          "6a2928bd198af598139ab42a": "laptop M4",
          "6a389e5cd30baf58a6859c5e": "cộng tác viên",
          "6a389e7bd30baf58a6859cf3": "Đại sứ thương hiệu",
          "6a1d026bd982af7420184420": "Tuyển Sinh du học hè",
          "6a1d03fc6d7314acd051155a": "Tuyển sinh du học Mỹ",
          "6a1d04686d7314acd051155c": "Nghiệp vụ",
          "6a1d047a6d7314acd051155d": "Telesale & CSKH",
          "6a1d048b6d7314acd051155e": "IT & Marketing & Social",
          "6a1d04996d7314acd051155f": "Kinh doanh",
          "6a1d04a86d7314acd0511560": "Tổng Hợp",
          "6a1e3941e43b5d5e028e9e9d": "Tuyển sinh"
        };
        if (currentUser?.departmentId && currentUser?.departmentName) {
          KNOWN_HIDDEN_DEPTS[currentUser.departmentId] = currentUser.departmentName;
        }

        userDeptIds.forEach(id => {
          if (id && !normalized.some(d => String(d.id) === String(id))) {
            const hiddenName = KNOWN_HIDDEN_DEPTS[id] || `Phòng ban ẩn (${id.substring(id.length - 4)})`;
            normalized.push({ id, name: hiddenName });
          }
        });

        if (isMounted) setDepartments(normalized);
      } catch (err) {
        console.warn("[Sidebar] Không tải được danh mục phòng ban:", err.message);

        const userDeptIds = currentUser?.departmentIds || (currentUser?.departmentId ? [currentUser.departmentId] : []);
        const KNOWN_HIDDEN_DEPTS = {
          "6a2928bd198af598139ab42a": "laptop M4",
          "6a389e5cd30baf58a6859c5e": "cộng tác viên",
          "6a389e7bd30baf58a6859cf3": "Đại sứ thương hiệu",
          "6a1d026bd982af7420184420": "Tuyển Sinh du học hè",
          "6a1d03fc6d7314acd051155a": "Tuyển sinh du học Mỹ",
          "6a1d04686d7314acd051155c": "Nghiệp vụ",
          "6a1d047a6d7314acd051155d": "Telesale & CSKH",
          "6a1d048b6d7314acd051155e": "IT & Marketing & Social",
          "6a1d04996d7314acd051155f": "Kinh doanh",
          "6a1d04a86d7314acd0511560": "Tổng Hợp",
          "6a1e3941e43b5d5e028e9e9d": "Tuyển sinh"
        };
        if (currentUser?.departmentId && currentUser?.departmentName) {
          KNOWN_HIDDEN_DEPTS[currentUser.departmentId] = currentUser.departmentName;
        }
        const fallback = [];
        userDeptIds.forEach(id => {
          if (id) {
            const hiddenName = KNOWN_HIDDEN_DEPTS[id] || `Phòng ban ẩn (${id.substring(id.length - 4)})`;
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

  // Xử lý click vào danh mục
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
        country: "Tất cả",
        region: "Tất cả",
        fromSidebar: true,
      };
      try {
        sessionStorage.setItem(
          SIDEBAR_CATEGORY_STORAGE_KEY,
          JSON.stringify(detail),
        );
      } catch {
        // bỏ qua
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
        region: "Tất cả",
        fromSidebar: true,
      };
      try {
        sessionStorage.setItem(
          SIDEBAR_CATEGORY_STORAGE_KEY,
          JSON.stringify(detail),
        );
      } catch {
        // bỏ qua
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
      name: "Tất cả",
      country: "Tất cả",
      region: region,
      fromSidebar: true,
    };
    try {
      sessionStorage.setItem(
        SIDEBAR_CATEGORY_STORAGE_KEY,
        JSON.stringify(detail),
      );
    } catch {
      // bỏ qua
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
      name: "Tất cả",
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
      // bỏ qua
    }
    window.dispatchEvent(new CustomEvent(SIDEBAR_CATEGORY_EVENT, { detail }));
    onNavigate?.("productOverview");
  };

  const handleGoToProductOverview = () => {
    const detail = { id: null, name: "Tất cả", country: "Tất cả", fromSidebar: true };
    try {
      sessionStorage.setItem(
        SIDEBAR_CATEGORY_STORAGE_KEY,
        JSON.stringify(detail),
      );
    } catch {
      // bỏ qua
    }
    window.dispatchEvent(new CustomEvent(SIDEBAR_CATEGORY_EVENT, { detail }));
    setSelectedCategoryId(null);
    setSelectedCountryName(null);
    onNavigate?.("productOverview");
  };

  const hasProductDetailPermission = canViewProductDetails(currentUser);

  return (
    <aside className="app-menubar" id="menubar">
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
                Trang chủ
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
                Dashboard thống kê
              </span>
            </a>
          </li>

          {/* --- 1C. TỔNG SẢN PHẨM --- */}
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
                  Tổng sản phẩm
                </span>

                <span
                  style={{ cursor: "pointer", padding: "4px" }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setOpenMenu(openMenu === "sanpham" ? "" : "sanpham");
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
                    Đang tải danh mục...
                  </span>
                </li>
              ) : (
                <>
                  {/* --- A. TUYỂN SINH DU HỌC (Dropdown Group) --- */}
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
                        Tuyển Sinh Du Học
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
                        {/* 1. TTS Quốc Tế (Du học nghề) */}
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
                                  TTS Quốc Tế
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
                                          • {resolvedName}
                                        </a>
                                      </li>
                                    );
                                  })}
                                </ul>
                              )}
                            </li>
                          );
                        })()}

                        {/* 2. Du Học Hè */}
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
                                  Du Học Hè
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
                                          • {resolvedName}
                                        </a>
                                      </li>
                                    );
                                  })}
                                </ul>
                              )}
                            </li>
                          );
                        })()}

                        {/* 3. Các Châu Lục (Châu Mỹ, Châu Âu, Châu Á, Châu Đại Dương) */}
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
                                          • {resolvedName}
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

                  {/* --- B. ĐÀO TẠO NGÔN NGỮ (Single Dropdown/Link if exists) --- */}
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
                            Đào tạo ngôn ngữ
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
                                    • {resolvedName}
                                  </a>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </li>
                    );
                  })()}

                  {/* --- C. DỊCH VỤ (Dropdown Group) --- */}
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
                        Dịch vụ
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
                        {/* 1. Visa, Định cư... */}
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
                                          • {resolvedName}
                                        </a>
                                      </li>
                                    );
                                  })}
                                </ul>
                              )}
                            </li>
                          );
                        })}

                        {/* 2. Nộp hồ sơ online */}
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
                            Nộp hồ sơ online
                          </a>
                        </li>
                      </ul>
                    )}
                  </li>
                </>
              )}
            </ul>
          </li>
        )}

          {/* --- 3. NGHIỆP VỤ --- */}
          <li className="menu-item mb-2 mt-2">
            <a
              className={`menu-link d-flex align-items-center px-2 py-2 rounded-2 ${["nghiepvu", "checklist", "sop", "doisoatdeal"].includes(currentPage) || (typeof currentPage === "string" && currentPage.startsWith("dept-")) ? "text-primary fw-bold" : "text-body-secondary"}`}
              href="#"
              role="button"
              style={{ textDecoration: "none" }}
              onClick={(e) => {
                e.preventDefault();
                setOpenMenu(openMenu === "nghiepvu" ? "" : "nghiepvu");
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
                Nghiệp vụ
              </span>
              <span
                style={{ cursor: "pointer", padding: "4px" }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setOpenMenu(openMenu === "nghiepvu" ? "" : "nghiepvu");
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
                        Đang tải phòng ban...
                      </span>
                    </li>
                  );
                }

                if (visibleDepartments.length === 0) {
                  return (
                    <li className="menu-item mb-1">
                      <span className="d-block px-3 py-2 text-body-secondary" style={{ fontSize: "13px" }}>
                        Không có phòng ban nghiệp vụ
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
                            • Nội dung chung
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
                            • Tài liệu phòng ban
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
                            • JD công việc
                          </a>
                        </li>
                      </ul>
                    </li>
                  );
                });
              })()}

              {/* Tra cứu trường du học */}
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
                  Tra cứu trường du học
                </a>
              </li>

              {/* Vẫn giữ trang Đối soát Deal cho kế toán và quản trị nếu cần */}
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
                    Đối soát Deal
                  </a>
                </li>
              )}
            </ul>
          </li>

          {/* --- 4. HỖ TRỢ --- */}
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
                Hỗ trợ
              </span>
              <span
                style={{ cursor: "pointer", padding: "4px" }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setOpenMenu(openMenu === "hotro" ? "" : "hotro");
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
                  Tạo Ticket
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
                  Gửi lead khách hàng
                </a>
              </li>
            </ul>
          </li>

          {/* --- 5. TIN TỨC & SỰ KIỆN --- */}
          <li className="menu-item mb-2">
            <a
              className={`menu-link d-flex align-items-center px-2 py-2 rounded-2 ${isNewsPage ? "text-primary fw-bold" : "text-body-secondary"}`}
              href="#"
              style={{ textDecoration: "none" }}
              role="button"
              onClick={(e) => {
                e.preventDefault();
                if (canManageNews) {
                  setOpenMenu(openMenu === "newsEvents" ? "" : "newsEvents");
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
                Tin tức & Sự kiện
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
                    setOpenMenu(openMenu === "newsEvents" ? "" : "newsEvents");
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
                    Chuyên trang tin
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
                    Quản lý bài viết
                  </a>
                </li>
              </ul>
            )}
          </li>

          {/* --- 7. TÀI LIỆU & BIỂU MẪU --- */}
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
                Thông báo nội bộ
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
                Tài liệu & Biểu mẫu
              </span>
              <span
                style={{ cursor: "pointer", padding: "4px" }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setOpenMenu(openMenu === "documents" ? "" : "documents");
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
                  Tìm kiếm tài liệu
                </a>
              </li>
            </ul>
          </li>

          {/* --- 8A. AI NỘI BỘ --- */}
          {canViewAIManagement(currentUser) && (
            <li className="menu-item mb-2">
              <a
                className={`menu-link d-flex align-items-center px-2 py-2 rounded-2 ${["aiConfig", "aiPending", "aiHistory"].includes(currentPage) ? "text-primary fw-bold" : "text-body-secondary"}`}
                href="#"
                role="button"
                style={{ textDecoration: "none" }}
                onClick={(e) => {
                  e.preventDefault();
                  setOpenMenu(openMenu === "ai" ? "" : "ai");
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
                  AI nội bộ
                </span>
                <span
                  style={{ cursor: "pointer", padding: "4px" }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setOpenMenu(openMenu === "ai" ? "" : "ai");
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
                      Cấu hình AI
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
                    Câu hỏi AI pending
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
                      Thống kê lịch sử AI
                    </a>
                  </li>
                )}
              </ul> */}
            </li>
          )}

          {/* --- 8. QUẢN LÝ TÀI KHOẢN --- */}

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
                  Quản lý tài khoản
                </span>
              </a>
            </li>
          )}

          {/* --- 8B. QUẢN LÝ VAI TRÒ --- */}
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
                  Quản lý vai trò
                </span>
              </a>
            </li>
          )}

          {/* --- 7B. QUẢN LÝ SẢN PHẨM --- */}
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
                  Quản lý sản phẩm
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
                    Phòng ban
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
                    Lịch sử thao tác
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
                    Cấu hình hệ thống
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
                    Quản lý khảo sát
                  </span>
                </a>
              </li>
            </>
          )}

          {/* ========================================================================= */}
          {/* TOÀN BỘ CÁC ĐOẠN COMMENT CŨ GIỮ NGUYÊN BÊN DƯỚI (ĐÃ FIX LỖI /) */}
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
