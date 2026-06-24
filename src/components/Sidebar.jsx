import { useEffect, useState } from "react";
import { API_BASE_URL } from "../config/api";
import { authFetch, getAuthHeaders } from "../auth/session";

const ADMIN_ROLE_ID = "69fc5af582ef85451120772a";

// Key dùng chung với ProductOverviewPage.jsx để truyền danh mục được chọn khi điều hướng
const SIDEBAR_CATEGORY_STORAGE_KEY = "hto_selected_product_category";
// Sự kiện dùng để báo cho ProductOverviewPage (nếu đã mount sẵn) cập nhật ngay khi đổi danh mục
const SIDEBAR_CATEGORY_EVENT = "hto:select-product-category";

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
  const roleFromObject = user?.role?.name || user?.roleName || user?.role;
  const roleFromId = ROLE_ID_MAP[user?.roleId];

  return normalizeRoleKey(roleFromObject || roleFromId || "user");
};

const isAdmin = (user) => {
  return getUserRoleKey(user) === "admin" || user?.roleId === ADMIN_ROLE_ID;
};

const canViewAIManagement = (user) => {
  const roleKey = getUserRoleKey(user);

  return ["admin", "bangiamdoc", "truongbophan", "hethong"].includes(roleKey);
};

const canManageNewsEvents = (user) => {
  const roleKey = getUserRoleKey(user);

  return ["admin", "bangiamdoc", "truongbophan"].includes(roleKey);
};

// KIỂM TRA QUYỀN XEM CHI TIẾT SẢN PHẨM (chỉ dùng cho "Tổng quan sản phẩm")
const canViewProductDetails = (user) => {
  const roleKey = getUserRoleKey(user);
  if (["admin", "bangiamdoc", "truongbophan"].includes(roleKey)) return true;
  const granted = Array.isArray(user?.grantedPermissions)
    ? user.grantedPermissions
    : [];
  return granted.includes("view_product_details");
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

  const isProductPage =
    [
      "duhocduc",
      "dinhcu",
      "visa",
      "daotaongonngu",
      "nophosoonline",
      "sanpham",
    ].includes(currentPage) ||
    (currentPage === "productOverview" && selectedCategoryId !== null) ||
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
      } else {
        setSelectedCategoryId(null);
      }
    };

    window.addEventListener(SIDEBAR_CATEGORY_EVENT, handleCategorySelect);
    return () =>
      window.removeEventListener(SIDEBAR_CATEGORY_EVENT, handleCategorySelect);
  }, []);

  // Fetch danh mục từ API
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
        if (isMounted) setProductCategories(normalized);
      } catch (err) {
        console.warn(
          "[Sidebar] Không tải được danh mục sản phẩm:",
          err.message,
        );
        if (isMounted) setProductCategories([]);
      } finally {
        if (isMounted) setCategoriesLoading(false);
      }
    };

    fetchCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  // Xử lý click vào danh mục
  const handleToggleCategory = (categoryId) => {
    // Cập nhật selected để highlight
    setSelectedCategoryId(categoryId);

    // Gửi sự kiện để ProductOverviewPage lọc theo danh mục
    const category = productCategories.find((c) => c.id === categoryId);
    if (category) {
      const detail = {
        id: category.id,
        name: category.name,
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

    // Điều hướng sang trang tổng quan sản phẩm
    onNavigate?.("productOverview");
  };

  const handleGoToProductOverview = () => {
    const detail = { id: null, name: "Tất cả", fromSidebar: true };
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
                className={`menu-link d-flex align-items-center px-2 py-2 rounded-2 ${currentPage === "productOverview" && !selectedCategoryId ? "text-primary fw-bold" : "text-body-secondary"}`}
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
              </a>
            </li>
          )}

          {/* --- 2. SẢN PHẨM --- */}
          <li className="menu-item mb-2">
            <a
              className={`menu-link d-flex align-items-center px-2 py-2 rounded-2 ${isProductPage ? "text-primary fw-bold" : "text-body-secondary"}`}
              href="#"
              role="button"
              style={{ textDecoration: "none" }}
              onClick={(e) => {
                e.preventDefault();
                onNavigate?.("productOverview");
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
                Sản phẩm
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
                paddingLeft: "52px",
              }}
            >
              {/* DANH SÁCH DANH MỤC */}
              {categoriesLoading ? (
                <li className="menu-item mb-1">
                  <span
                    className="d-block px-3 py-2 text-body-secondary"
                    style={{ fontSize: "13px" }}
                  >
                    Đang tải danh mục...
                  </span>
                </li>
              ) : productCategories.length > 0 ? (
                productCategories.map((category) => {
                  return (
                    <li key={category.id} className="menu-item mb-1">
                      <a
                        className={`menu-link d-block px-3 py-2 rounded-2 ${
                          selectedCategoryId === category.id &&
                          currentPage === "productOverview"
                            ? "bg-primary-subtle text-primary fw-medium"
                            : "text-body-secondary"
                        }`}
                        style={{
                          textDecoration: "none",
                          fontSize: "13px",
                          cursor: "pointer",
                        }}
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handleToggleCategory(category.id);
                        }}
                      >
                        {category.name}
                      </a>
                    </li>
                  );
                })
              ) : (
                <li className="menu-item mb-1">
                  <span
                    className="d-block px-3 py-2 text-body-secondary"
                    style={{ fontSize: "13px" }}
                  >
                    Chưa có danh mục
                  </span>
                </li>
              )}

              {/* NỘP HỒ SƠ ONLINE */}
              <li className="menu-item mb-1">
                <a
                  className={`menu-link d-block px-3 py-2 rounded-2 ${currentPage === "nophosoonline" ? "bg-primary-subtle text-primary fw-medium" : "text-body-secondary"}`}
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
          </li>

          {/* --- 3. NGHIỆP VỤ --- */}
          <li className="menu-item mb-2 mt-2">
            <a
              className={`menu-link d-flex align-items-center px-2 py-2 rounded-2 ${["nghiepvu", "checklist", "sop", "doisoatdeal"].includes(currentPage) ? "text-primary fw-bold" : "text-body-secondary"}`}
              href="#"
              role="button"
              style={{ textDecoration: "none" }}
              onClick={(e) => {
                e.preventDefault();
                setOpenMenu(openMenu === "nghiepvu" ? "" : "nghiepvu");
                onNavigate?.("nghiepvu");
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
                paddingLeft: "52px",
              }}
            >
              <li className="menu-item mb-1">
                <a
                  className={`menu-link d-block px-3 py-2 rounded-2 ${currentPage === "nghiepvu" ? "bg-primary-subtle text-primary fw-medium" : "text-body-secondary"}`}
                  style={{ textDecoration: "none", fontSize: "13px" }}
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate?.("nghiepvu");
                  }}
                >
                  JD công việc
                </a>
              </li>
              <li className="menu-item mb-1">
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
