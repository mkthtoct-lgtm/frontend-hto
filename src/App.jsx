import { useCallback, useEffect, useState } from "react";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { Footer } from "./components/Footer";
import { AccountingManagementPage } from "./components/AccountingManagementPage";
import { AiChatPage } from "./components/AiChatPage";
import { DocumentsPage } from "./components/DocumentsPage";
import { LoginPage } from "./login/LoginPage";
import { RegisterPage } from "./login/RegisterPage";
import { ForgotPasswordPage } from "./login/ForgotPasswordPage";
import { ResetPasswordPage } from "./login/ResetPasswordPage";
import { AuthLayout } from "./login/AuthLayout";
import { UserList } from "./UserList/UserList";
import { RoleManagementPage } from "./RoleManagement/RoleManagementPage";
import { DepartmentsPage } from "./departments/DepartmentsPage";
import DepartmentGeneralPage from "./departments/DepartmentGeneralPage";
import { AuditLogPage } from "./auditLogs/AuditLogPage";
import { ChecklistPage } from "./Checklist/ChecklistPage";
import { SOPPage } from "./SOP/SOPPage";
import { DocumentSearchPage } from "./DocumentSearch/DocumentSearchPage";
import { LeadFormPage } from "./LeadForm/LeadFormPage";
import { AIConfigPage } from "./AIConfig/AIConfigPage";
import { AIPendingQuestionsPage } from "./AIPendingQuestions/AIPendingQuestionsPage";
import { AIHistoryPage } from "./AIHistory/AIHistoryPage";
import { JobDescriptionsPage } from "./jobDescriptions/JobDescriptionsPage";
import { NotificationsPage } from "./notifications/NotificationsPage";
import { ProductsPage } from "./products/ProductsPage";
import { ProductOverviewPage } from "./products/ProductOverviewPage";
import { ProductManagementPage } from "./products/ProductManagementPage";
import { HomePage } from "./home/HomePage";
import { DashboardPage } from "./dashboard/DashboardPage";
import { NewsEventsPage } from "./newsEvents/NewsEventsPage";
import { ProfilePage } from "./profile/ProfilePage";
import { NewsEventsManagementPage } from "./newsEvents/NewsEventsManagementPage";
import { AUTH_EVENTS, authFetch, getAuthHeaders } from "./auth/session";
import { SupportPage } from "./components/SupportPage";
import { SystemSettingsPage } from "./systemSettings/SystemSettingsPage";
import { API_BASE_URL } from "./config/api";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

const AUTH_BANNER_IMAGES = {
  login: "/assets/images/BIA%20%C4%90S/BIA_HTO-03.png",
  register: "/assets/images/BIA%20%C4%90S/BIA_HTO-01.png",
  forgot: "/assets/images/BIA%20%C4%90S/BIA_HTO-01.png",
  "reset-password": "/assets/images/BIA%20%C4%90S/BIA_HTO-01.png",
};

// ─── Cấu hình tour hướng dẫn riêng biệt cho từng trang ────────────────────────
// Mỗi entry: { anchorId, steps[] } - anchorId là id phần tử đầu tiên dùng để kiểm tra DOM đã sẵn sàng
const PAGE_TOURS = {
  // Trang Sản Phẩm
  products: {
    anchorId: "products-filter-section",
    steps: [
      {
        element: "#products-stats-grid",
        popover: {
          title: "Tổng Quan Sản Phẩm",
          description: "Bảng thống kê nhanh: tổng số sản phẩm, số danh mục đang hoạt động và số chương trình đang mở.",
          side: "bottom", align: "center",
        },
      },
      {
        element: "#products-filter-section",
        popover: {
          title: "Tìm Kiếm & Lọc",
          description: "Dùng ô tìm kiếm và các bộ lọc để nhanh chóng tìm đúng sản phẩm cần quản lý.",
          side: "bottom", align: "center",
        },
      },
      {
        element: "#products-add-category-btn",
        popover: {
          title: "Thêm Danh Mục Mới",
          description: "Bấm đây để tạo danh mục sản phẩm mới (du học, ngôn ngữ, visa, định cư...).",
          side: "bottom", align: "end",
        },
      },
      {
        element: "#tour-first-program-card",
        popover: {
          title: "Thẻ Sản Phẩm / Chương Trình",
          description: "Mỗi thẻ đại diện cho một chương trình/gói dịch vụ. Bấm vào thẻ để xem chi tiết, chỉnh sửa thông tin, brochure và tài liệu tư vấn nội bộ.",
          side: "right", align: "center",
        },
      },
    ],
  },

  // Trang Quy Trình Nghiệp Vụ
  nghiepvu: {
    anchorId: "nghiepvu-sync-crm-btn",
    steps: [
      {
        element: "#nghiepvu-sync-crm-btn",
        popover: {
          title: "Đồng Bộ Dữ Liệu CRM",
          description: "Khi có dữ liệu từ CRM, bấm đây để đồng bộ hồ sơ khách hàng, người phụ trách và trạng thái ký hợp đồng.",
          side: "bottom", align: "start",
        },
      },
      {
        element: "#nghiepvu-metrics-grid",
        popover: {
          title: "Chỉ Số Nghiệp Vụ",
          description: "Hoa hồng dự kiến, doanh thu đã ghi nhận, hồ sơ đủ điều kiện và trạng thái đối soát kế toán sẽ hiển thị ở đây khi có dữ liệu thực.",
          side: "bottom", align: "center",
        },
      },
      {
        element: "#nghiepvu-empty-state",
        popover: {
          title: "Chờ Dữ Liệu Kế Toán",
          description: "Bảng hoa hồng chưa có số liệu. Hệ thống cần hồ sơ CRM hợp lệ và khoản thu đã được kế toán xác nhận thì mới tính được.",
          side: "top", align: "center",
        },
      },
      {
        element: "#nghiepvu-conditions-card",
        popover: {
          title: "Điều Kiện Ghi Nhận Hoa Hồng",
          description: "3 bước cần đủ: dữ liệu CRM → kế toán xác nhận khoản thu → đối soát hoàn tất. Khi đủ điều kiện, hệ thống tự động hiển thị hoa hồng của bạn.",
          side: "left", align: "center",
        },
      },
    ],
  },

  // Trang Hỗ Trợ / Gửi Lead
  hotro: {
    anchorId: "lead-form-completion-card",
    steps: [
      {
        element: "#lead-form-completion-card",
        popover: {
          title: "Tiến Độ Hoàn Thiện Form",
          description: "Chỉ số % hiển thị mức độ bạn đã điền đầy đủ thông tin khách hàng. Hãy đảm bảo đạt tối thiểu 80% trước khi gửi.",
          side: "bottom", align: "center",
        },
      },
      {
        element: "#lead-form-main-card",
        popover: {
          title: "Form Nhập Thông Tin Lead",
          description: "Điền đầy đủ thông tin khách hàng: tên, số điện thoại, sản phẩm quan tâm, kênh nguồn và ghi chú để CRM xử lý chính xác.",
          side: "top", align: "center",
        },
      },
      {
        element: "#lead-form-guide-panel",
        popover: {
          title: "Preview API Payload",
          description: "Khung bên phải cho bạn xem trước dữ liệu JSON sẽ được gửi lên hệ thống CRM, giúp kiểm tra thông tin trước khi gửi.",
          side: "left", align: "center",
        },
      },
      {
        element: "#lead-form-submit-btn",
        popover: {
          title: "Gửi Lead Cho Khách Hàng",
          description: "Sau khi điền đủ thông tin, bấm đây để gửi lead sang CRM. Hệ thống sẽ thông báo kết quả ngay lập tức.",
          side: "top", align: "end",
        },
      },
    ],
  },

  // Trang Tin Tức & Sự Kiện
  news: {
    anchorId: "news-search-input",
    steps: [
      {
        element: "#news-search-input",
        popover: {
          title: "Tìm Kiếm Tin Tức",
          description: "Nhập từ khóa để tìm nhanh bài viết theo tiêu đề, nội dung hoặc thẻ tag.",
          side: "bottom", align: "start",
        },
      },
      {
        element: "#news-type-filter-group",
        popover: {
          title: "Lọc Theo Loại Bài Viết",
          description: "Chọn xem tất cả, chỉ Tin tức, hoặc chỉ Sự kiện để thu hẹp danh sách bài viết phù hợp.",
          side: "bottom", align: "center",
        },
      },
      {
        element: "#news-articles-list",
        popover: {
          title: "Danh Sách Bài Viết",
          description: "Tất cả bài viết được hiển thị ở đây. Bấm vào một bài để đọc chi tiết hoặc chia sẻ link cho đồng nghiệp.",
          side: "top", align: "center",
        },
      },
      {
        element: "#news-sidebar",
        popover: {
          title: "Tin Nổi Bật & Lịch Sự Kiện",
          description: "Thanh bên hiển thị tin mới nhất, bài đọc nhiều nhất và lịch các sự kiện sắp diễn ra của HTO.",
          side: "left", align: "start",
        },
      },
    ],
  },

  // Trang Thông Báo Nội Bộ
  notifications: {
    anchorId: "notifications-unread-badge",
    steps: [
      {
        element: "#notifications-unread-badge",
        popover: {
          title: "Thông Báo Chưa Đọc",
          description: "Badge này hiển thị số lượng thông báo bạn chưa đọc. Bấm \"Làm mới\" để cập nhật danh sách.",
          side: "bottom", align: "start",
        },
      },
      {
        element: "#notifications-create-panel",
        popover: {
          title: "Tạo Thông Báo Mới",
          description: "(Dành cho Admin/Quản lý) Soạn thảo và gửi thông báo nội bộ đến toàn bộ hoặc một nhóm thành viên cụ thể.",
          side: "right", align: "start",
        },
      },
      {
        element: "#notifications-filter-group",
        popover: {
          title: "Lọc Thông Báo",
          description: "Chọn xem tất cả, chỉ thông báo chưa đọc, hoặc chỉ thông báo đã đọc để quản lý hiệu quả hơn.",
          side: "bottom", align: "end",
        },
      },
      {
        element: "#notifications-list-card",
        popover: {
          title: "Danh Sách Thông Báo",
          description: "Bấm vào thông báo để đọc nội dung đầy đủ. Bấm \"Đánh dấu đã đọc\" để cập nhật trạng thái.",
          side: "top", align: "center",
        },
      },
    ],
  },

  // Trang Tài Liệu & Biểu Mẫu
  documents: {
    anchorId: "documents-list-card",
    steps: [
      {
        element: "#documents-categories-card",
        popover: {
          title: "Quản Lý Danh Mục",
          description: "Tạo và quản lý các danh mục tài liệu (hợp đồng, quy trình, biểu mẫu...). Admin có thể thêm, sửa, xóa danh mục.",
          side: "bottom", align: "start",
        },
      },
      {
        element: "#documents-list-card",
        popover: {
          title: "Danh Sách Tài Liệu",
          description: "Toàn bộ tài liệu được hiển thị ở đây. Bấm vào tài liệu để xem, tải xuống hoặc chia sẻ link.",
          side: "top", align: "center",
        },
      },
      {
        element: "#documents-category-filter",
        popover: {
          title: "Lọc Theo Danh Mục",
          description: "Dùng dropdown để lọc chỉ hiển thị tài liệu thuộc danh mục bạn đang cần.",
          side: "bottom", align: "end",
        },
      },
      {
        element: "#documents-upload-card",
        popover: {
          title: "Tải Lên Tài Liệu Mới",
          description: "Tải file từ máy tính lên hoặc dán link tài liệu ngoài (Google Drive, OneDrive...) để thêm vào kho tài nguyên.",
          side: "top", align: "center",
        },
      },
      {
        element: "#documents-permission-card",
        popover: {
          title: "Phân Quyền Tài Liệu",
          description: "Thiết lập ai được Xem, Tải xuống và Chỉnh sửa từng tài liệu theo vai trò trong hệ thống.",
          side: "top", align: "center",
        },
      },
    ],
  },

  // Trang Trợ Lý AI
  aiConfig: {
    anchorId: "aiconfig-group-grid",
    steps: [
      {
        element: "#aiconfig-group-grid",
        popover: {
          title: "Nguồn Tri Thức AI",
          description: "Chọn các nhóm tài liệu mà AI sẽ sử dụng để trả lời câu hỏi. Tích chọn nhóm phù hợp với phạm vi hoạt động của chatbot.",
          side: "top", align: "center",
        },
      },
      {
        element: "#aiconfig-side-panel",
        popover: {
          title: "Thiết Lập Tham Số AI",
          description: "Điều chỉnh chế độ trả lời (chính xác/sáng tạo), ngưỡng khớp tài liệu, thông điệp fallback khi AI không tìm thấy câu trả lời.",
          side: "left", align: "start",
        },
      },
      {
        element: "#aiconfig-save-btn",
        popover: {
          title: "Lưu Cấu Hình AI",
          description: "Sau khi chọn nguồn tri thức và điều chỉnh tham số, bấm \"Lưu cấu hình AI\" để áp dụng thay đổi ngay lập tức.",
          side: "top", align: "center",
        },
      },
    ],
  },

  // Trang JD Công Việc
  jobDescriptions: {
    anchorId: "jd-search-input",
    steps: [
      {
        element: "#jd-search-input",
        popover: {
          title: "Tìm Kiếm JD",
          description: "Nhập tên vị trí, phòng ban hoặc từ khóa để tìm nhanh bản mô tả công việc cần xem hoặc chỉnh sửa.",
          side: "bottom", align: "start",
        },
      },
      {
        element: "#jd-create-btn",
        popover: {
          title: "Tạo JD Mới",
          description: "Bấm đây để mở form tạo mô tả công việc mới cho một vị trí tuyển dụng, bao gồm yêu cầu, trách nhiệm và quyền lợi.",
          side: "bottom", align: "end",
        },
      },
      {
        element: "#jd-list-card",
        popover: {
          title: "Danh Sách JD",
          description: "Tất cả bản mô tả công việc hiện có. Bấm vào một JD để xem chi tiết, chỉnh sửa hoặc chia sẻ với ứng viên.",
          side: "right", align: "start",
        },
      },
      {
        element: "#jd-detail-card",
        popover: {
          title: "Chi Tiết Mô Tả Công Việc",
          description: "Xem đầy đủ mô tả, yêu cầu kỹ năng, quyền lợi và thông tin liên hệ tuyển dụng. Từ đây bạn có thể sửa, xóa hoặc tải file JD.",
          side: "left", align: "start",
        },
      },
    ],
  },

  // Trang Quản Lý Tài Khoản
  users: {
    anchorId: "users-filter-bar",
    steps: [
      {
        element: "#users-add-btn",
        popover: {
          title: " Thêm Tài Khoản Mới",
          description: "Bấm đây để mở form tạo tài khoản nhân viên mới. Bạn sẽ nhập: họ tên, email, mật khẩu ban đầu, số điện thoại, vai trò (Admin / Nhân sự / CTV...) và phân phòng ban.",
          side: "bottom", align: "end",
        },
      },
      {
        element: "#users-filter-bar",
        popover: {
          title: "Tìm Kiếm & Lọc Nhân Viên",
          description: "Nhập tên hoặc email để tìm nhanh tài khoản. Sử dụng dropdown để lọc theo <strong>Vai trò</strong> (Admin, Nhân sự, CTV...) hoặc <strong>Phòng ban</strong> cụ thể.",
          side: "bottom", align: "center",
        },
      },
      {
        element: "#users-table-card",
        popover: {
          title: "Danh Sách Tài Khoản",
          description: "Mỗi dòng hiển thị họ tên, email, vai trò, phòng ban và trạng thái. Bấm vào một dòng bất kỳ để xem cả profile chi tiết của tài khoản đó.",
          side: "top", align: "center",
        },
      },
      {
        element: "#users-permission-col",
        popover: {
          title: "Cột Quyền Chức Năng",
          description: "Hiển thị số quyền chức năng được phân cho tài khoản. Bấm nút số quyền để mở bảng phân quyền chi tiết theo từng tính năng (xem thông kê, tạo tin tức, quản lý sản phẩm...). Khác với vai trò, đây là quyền từng tính năng riêng lẻ.",
          side: "top", align: "center",
        },
      },
      {
        element: "#users-action-col",
        popover: {
          title: " Các Nút Thao Tác",
          description: "Mỗi dòng có 3 nút thác: <strong>👁 Xem</strong> (mở hộp thoại chi tiết), <strong>✏️ Sửa</strong> (chỉnh sửa thông tin nhân viên), <strong>🔒 Khóa/Mở khóa</strong> (vô hiệu hóa hoặc kích hoạt tài khoản đó). Tài khoản bị khóa sẽ không thể đăng nhập vào hệ thống.",
          side: "top", align: "center",
        },
      },
    ],
  },

  // Trang Lịch Sử Thao Tác (Audit Log)
  auditLogs: {
    anchorId: "audit-filter-section",
    steps: [
      {
        element: "#audit-refresh-btn",
        popover: {
          title: " Nút Làm Mới",
          description: "Bấm để tải lại danh sách audit log mới nhất từ hệ thống. Nếu có thê bộ lọc, dữ liệu sẽ được lọc theo các điều kiện hiện tại.",
          side: "bottom", align: "end",
        },
      },
      {
        element: "#audit-filter-section",
        popover: {
          title: " Bộ Lọc Audit Log",
          description: "Lọc bản ghi theo 4 tiêu chí: <strong>Người thực hiện</strong> (ai?), <strong>Loại hành động</strong> (tạo/sửa/xóa), <strong>Từ thời điểm</strong> và <strong>Đến thời điểm</strong>. Kết hợp nhiều bộ lọc để tìm chính xác thao tác cần kiểm tra.",
          side: "bottom", align: "center",
        },
      },
      {
        element: "#audit-clear-filter-btn",
        popover: {
          title: " Xóa Bộ Lọc",
          description: "Bấm để xóa tất cả các tiêu chí đang áp dụng và quay lại xem toàn bộ lịch sử thao tác gần đây nhất (không giới hạn).",
          side: "bottom", align: "end",
        },
      },
      {
        element: "#audit-log-table",
        popover: {
          title: "📝 Danh Sách Audit Log",
          description: "Mỗi dòng là một bản ghi lưu: <strong>Thời gian</strong>, <strong>Người thực hiện (Actor)</strong>, <strong>Loại hành động</strong> (tạo/sửa/xóa), <strong>Đối tượng bị tác động (Target)</strong>. Bấm vào dòng bất kỳ để xem chi tiết ở cột bên phải.",
          side: "top", align: "center",
        },
      },
      {
        element: "#audit-log-detail",
        popover: {
          title: " Chi Tiết Thao Tác",
          description: "Hiển thị đầy đủ thông tin của bản ghi được chọn: Actor, hành động cụ thể, đối tượng bị tác động và thời điểm xảy ra. Dùng để kiểm tra ai đã thay đổi dữ liệu gì khi cần điều tra bảo mật.",
          side: "left", align: "start",
        },
      },
    ],
  },

  // Trang Quản Lý Phòng Ban
  departments: {
    anchorId: "departments-list-card",
    steps: [
      {
        element: "#departments-create-btn",
        popover: {
          title: "Thêm Phòng Ban Mới",
          description: "Bấm đây để tạo phòng ban mới: đặt tên, mô tả nhiệm vụ và chỉ định trưởng phòng ban.",
          side: "bottom", align: "end",
        },
      },
      {
        element: "#departments-list-card",
        popover: {
          title: "Danh Sách Phòng Ban",
          description: "Hiển thị toàn bộ phòng ban trong tổ chức. Bấm vào phòng ban để xem thành viên và quản lý nhân sự thuộc phòng đó.",
          side: "right", align: "start",
        },
      },
      {
        element: "#departments-members-card",
        popover: {
          title: "Quản Lý Nhân Sự Phòng Ban",
          description: "Gán nhân viên vào phòng ban hoặc gỡ thành viên khỏi phòng ban. Thay đổi sẽ được cập nhật ngay lập tức trên toàn hệ thống.",
          side: "left", align: "start",
        },
      },
    ],
  },
};

// Map currentPage sang key trong PAGE_TOURS
const getPageTourKey = (page) => {
  const MAP = {
    products: "products",
    productOverview: "products",
    nghiepvu: "nghiepvu",
    checklist: "nghiepvu",
    sop: "nghiepvu",
    hotro: "hotro",
    leadForm: "hotro",
    news: "news",
    newsManagement: "news",
    notifications: "notifications",
    documents: "documents",
    documentSearch: "documents",
    aiConfig: "aiConfig",
    aiPending: "aiConfig",
    aiHistory: "aiConfig",
    jobDescriptions: "jobDescriptions",
    users: "users",
    auditLogs: "auditLogs",
    departments: "departments",
  };
  return MAP[page] || null;
};


const ROLE_IDS = {
  ADMIN: "69fc5af582ef85451120772a",
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

const AUTH_USER_STORAGE_KEY = "auth_user";
const CURRENT_PAGE_STORAGE_KEY = "current_page";

const normalizeRole = (roleId) => ROLE_ID_MAP[roleId] || "user";

const hasStoredSession = () => {
  const token = window.localStorage.getItem("token");
  const refreshToken = window.localStorage.getItem("refresh_token");

  if (!token || !refreshToken) {
    return false;
  }

  const tokenPayload = decodeJwtPayload(token);

  if (tokenPayload?.exp && tokenPayload.exp * 1000 <= Date.now()) {
    return false;
  }

  return true;
};

const clearStoredSession = () => {
  window.localStorage.removeItem("token");
  window.localStorage.removeItem("refresh_token");
  window.localStorage.removeItem(AUTH_USER_STORAGE_KEY);
  window.localStorage.removeItem(CURRENT_PAGE_STORAGE_KEY);
  document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
};

const getUserDepartmentsMapping = () => {
  try {
    const stored = window.localStorage.getItem("hto_user_departments_mapping");
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const normalizeUser = (userData) => {
  if (!userData?.id || !userData?.email || !userData?.roleId) {
    return null;
  }

  const mapping = getUserDepartmentsMapping();
  const departmentIds = mapping[userData.id] || (userData.departmentId ? [userData.departmentId] : []);

  return {
    id: userData.id,
    name: userData.name || userData.fullName || "",
    fullName: userData.fullName || userData.name || "",
    email: userData.email,
    avatarUrl: userData.avatarUrl || "",
    roleId: userData.roleId,
    departmentId: userData.departmentId || null,
    departmentIds,
    role: userData.role || normalizeRole(userData.roleId),
    // Quyền được admin/bangiamdoc cấp thêm (mảng string, ví dụ: ["view_product_details"])
    grantedPermissions: Array.isArray(userData.grantedPermissions)
      ? userData.grantedPermissions
      : [],
    hasSeenAdminTutorial: userData.hasSeenAdminTutorial,
    seenTours: userData.seenTours || [],
  };
};

const decodeJwtPayload = (token) => {
  try {
    const payload = token.split(".")[1];

    if (!payload) {
      return null;
    }

    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const paddedBase64 = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );
    const json = window.atob(paddedBase64);

    return JSON.parse(json);
  } catch {
    return null;
  }
};

const getStoredUser = () => {
  if (!hasStoredSession()) {
    clearStoredSession();
    return null;
  }

  try {
    const storedUser = JSON.parse(
      window.localStorage.getItem(AUTH_USER_STORAGE_KEY) || "null",
    );
    const normalizedUser = normalizeUser(storedUser);

    if (normalizedUser) {
      return normalizedUser;
    }
  } catch {
    window.localStorage.removeItem(AUTH_USER_STORAGE_KEY);
  }

  const tokenPayload = decodeJwtPayload(window.localStorage.getItem("token"));

  return normalizeUser({
    id: tokenPayload?.sub,
    email: tokenPayload?.email,
    roleId: tokenPayload?.roleId,
    departmentId: tokenPayload?.departmentId,
  });
};

const storeAuthUser = (userData) => {
  const normalizedUser = normalizeUser(userData);

  if (!normalizedUser) {
    return null;
  }

  window.localStorage.setItem(
    AUTH_USER_STORAGE_KEY,
    JSON.stringify(normalizedUser),
  );

  return normalizedUser;
};

const getStoredPage = () => {
  return window.localStorage.getItem(CURRENT_PAGE_STORAGE_KEY) || "dashboard";
};

const getAuthModeFromLocation = () => {
  const searchParams = new URLSearchParams(window.location.search);
  const hasResetToken =
    searchParams.has("token") || searchParams.has("resetToken");
  const hasReferralCode =
    searchParams.has("ref") ||
    searchParams.has("referral") ||
    searchParams.has("referralCode") ||
    searchParams.has("maGioiThieu");
  const normalizedPathname = `/${window.location.pathname
    .replace(/^\/+|\/+$/g, "")
    .replace(/\/{2,}/g, "/")}`;
  const isResetPasswordPath = normalizedPathname === "/reset-password";
  const isRegisterPath = normalizedPathname === "/register";

  if (hasResetToken && isResetPasswordPath) return "reset-password";
  if (isRegisterPath || hasReferralCode) return "register";

  return "login";
};

const resetAuthUrl = () => {
  window.history.replaceState({}, "", "/");
};

function App() {
  const [currentPage, setCurrentPage] = useState(() => getStoredPage());
  const [selectedNotificationId, setSelectedNotificationId] = useState(null);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [supportInitialTab, setSupportInitialTab] = useState("faq");
  const [user, setUser] = useState(() => getStoredUser());
  const [isNotificationMenuOpen, setIsNotificationMenuOpen] = useState(false);
  const [authMode, setAuthMode] = useState(() => getAuthModeFromLocation()); // 'login', 'register', 'forgot', 'reset-password'
  const [registerLayoutMode, setRegisterLayoutMode] = useState("account");

  const handleUserUpdate = useCallback((nextUserData) => {
    setUser((currentUser) => {
      const nextUser = {
        ...currentUser,
        ...nextUserData,
        name: nextUserData.name || nextUserData.fullName || currentUser?.name || "",
        fullName: nextUserData.fullName || nextUserData.name || currentUser?.fullName || "",
      };
      window.localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(nextUser));
      return nextUser;
    });
  }, []);
  const [theme, setTheme] = useState(() => {
    const storedTheme = window.localStorage.getItem("app-theme");

    if (storedTheme === "light" || storedTheme === "dark") {
      return storedTheme;
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  useEffect(() => {
    if (window.location.pathname === "/index-2.html") {
      window.history.replaceState(
        {},
        "",
        `/${window.location.search}${window.location.hash}`,
      );
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-bs-theme", theme);
    window.localStorage.setItem("app-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!user) {
      return;
    }

    window.localStorage.setItem(CURRENT_PAGE_STORAGE_KEY, currentPage);
  }, [currentPage, user]);

  useEffect(() => {
    const hasSeenLocally = window.localStorage.getItem(`hto_tour_seen_admin_${user?.id}`) === "true";
    if (!user || user.role !== "admin" || user.hasSeenAdminTutorial || hasSeenLocally) {
      return undefined;
    }

    if (currentPage !== "dashboard") {
      return undefined;
    }

    // Không bắt đầu giới thiệu khi thông báo đang bật
    if (isNotificationMenuOpen) {
      return undefined;
    }

    const timer = setTimeout(() => {
      // Đợi DOM render xong, kiểm tra phần tử chính tương ứng
      if (!document.getElementById("sidebar-nav-home")) {
        return;
      }

      const steps = [
        {
          element: "#menubar",
          popover: {
            title: "Thanh Menu Quản Trị",
            description: "Đây là thanh điều hướng chính của hệ thống HTO.",
            side: "right",
            align: "start",
          },
        },
        {
          element: "#sidebar-nav-home",
          popover: {
            title: "Trang Chủ",
            description: "Quay về màn hình chính, xem tổng quan và thông báo sự kiện.",
            side: "right",
            align: "center",
          },
        },
        {
          element: "#sidebar-nav-stats",
          popover: {
            title: "Dashboard Thống Kê",
            description: "Xem các biểu đồ báo cáo hiệu suất, số liệu tài chính và khách hàng.",
            side: "right",
            align: "center",
          },
        },
        {
          element: "#sidebar-nav-products",
          popover: {
            title: "Quản Lý Sản Phẩm",
            description: "Quản lý danh sách sản phẩm du học, đào tạo ngôn ngữ, dịch vụ visa và định cư.",
            side: "right",
            align: "center",
          },
        },
        {
          element: "#sidebar-nav-tasks",
          popover: {
            title: "Quy Trình Nghiệp Vụ",
            description: "Quản lý và giám sát các checklist, quy trình nghiệp vụ chi tiết của nhân sự.",
            side: "right",
            align: "center",
          },
        },
        {
          element: "#sidebar-nav-support",
          popover: {
            title: "Trung Tâm Hỗ Trợ",
            description: "Gửi thông tin lead khách hàng mới và quản lý các yêu cầu hỗ trợ khác.",
            side: "right",
            align: "center",
          },
        },
        {
          element: "#sidebar-nav-news",
          popover: {
            title: "Tin Tức & Sự Kiện",
            description: "Đăng tải và quản lý các bài viết tin tức, sự kiện nội bộ của HTO.",
            side: "right",
            align: "center",
          },
        },
        {
          element: "#sidebar-nav-notifications",
          popover: {
            title: "Thông Báo Nội Bộ",
            description: "Xem và quản lý các thông báo nội bộ gửi tới các thành viên.",
            side: "right",
            align: "center",
          },
        },
        {
          element: "#sidebar-nav-documents",
          popover: {
            title: "Tài Liệu & Biểu Mẫu",
            description: "Kho tài liệu hướng dẫn, biểu mẫu hợp đồng và các file tài nguyên dùng chung.",
            side: "right",
            align: "center",
          },
        },
        {
          element: "#sidebar-nav-ai",
          popover: {
            title: "Trợ Lý AI Nội Bộ",
            description: "Cấu hình chatbot AI, quản lý câu hỏi pending và lịch sử truy vấn của AI trợ lý.",
            side: "right",
            align: "center",
          },
        },
        {
          element: "#sidebar-nav-jd",
          popover: {
            title: "JD Công Việc",
            description: "Quản lý bảng mô tả công việc (Job Descriptions) cho các vị trí tuyển dụng.",
            side: "right",
            align: "center",
          },
        },
        {
          element: "#sidebar-nav-users",
          popover: {
            title: "Quản Lý Tài Khoản",
            description: "Quản lý thông tin tài khoản, nhân viên, phân quyền và trạng thái hoạt động.",
            side: "right",
            align: "center",
          },
        },
        {
          element: "#sidebar-nav-departments",
          popover: {
            title: "Quản Lý Phòng Ban",
            description: "Tạo mới, chỉnh sửa thông tin phòng ban và phân bổ nhân sự.",
            side: "right",
            align: "center",
          },
        },
        {
          element: "#sidebar-nav-auditlogs",
          popover: {
            title: "Lịch Sử Thao Tác",
            description: "Giám sát lịch sử cập nhật và hành vi của toàn bộ hệ thống để đảm bảo bảo mật.",
            side: "right",
            align: "center",
          },
        },
      ];

      const driverObj = driver({
        showProgress: true,
        animate: true,
        doneBtnText: "Hoàn thành",
        nextBtnText: "Tiếp theo",
        prevBtnText: "Trước đó",
        allowClose: true,
        steps: steps.filter((step) => {
          const selector = step.element;
          if (!selector) return true;
          const el = document.querySelector(selector);
          return el !== null && el.offsetParent !== null;
        }),
        onDestroyed: async () => {
          // Lưu vào localStorage và state trước
          window.localStorage.setItem(`hto_tour_seen_admin_${user.id}`, "true");
          handleUserUpdate({ hasSeenAdminTutorial: true });
          window.localStorage.removeItem("hto_admin_tour_step");
          try {
            await authFetch(`${API_BASE_URL}/users/${user.id}`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                ...getAuthHeaders(),
              },
              body: JSON.stringify({ hasSeenAdminTutorial: true }),
            });
          } catch (error) {
            console.error("Lỗi khi lưu trạng thái xem tutorial lên server:", error);
          }
        },
      });

      driverObj.drive();
    }, 800);

    return () => clearTimeout(timer);
  }, [user, currentPage, isNotificationMenuOpen, handleUserUpdate]);

  // ─── Tour hướng dẫn riêng biệt cho từng trang con ────────────────────────────
  useEffect(() => {
    if (!user) {
      return undefined;
    }

    const tourKey = getPageTourKey(currentPage);
    if (!tourKey) {
      return undefined;
    }

    const tourConfig = PAGE_TOURS[tourKey];

    // Đã xem rồi thì không hiển thị lại (lưu trên server qua user.seenTours hoặc localStorage)
    const hasSeenLocally = window.localStorage.getItem(`hto_tour_seen_${user.id}_${tourKey}`) === "true";
    if ((user.seenTours && user.seenTours.includes(tourKey)) || hasSeenLocally) {
      return undefined;
    }

    // Không bắt đầu giới thiệu khi thông báo đang bật
    if (isNotificationMenuOpen) {
      return undefined;
    }

    const timer = setTimeout(() => {
      // Kiểm tra DOM đã render phần tử anchor chưa
      if (!document.getElementById(tourConfig.anchorId)) {
        return;
      }

      // Lọc bỏ các bước mà phần tử không tồn tại trên DOM (tránh crash)
      const availableSteps = tourConfig.steps.filter((step) => {
        const selector = step.element;
        return selector ? document.querySelector(selector) !== null : true;
      });

      if (availableSteps.length === 0) {
        return;
      }

      const driverObj = driver({
        showProgress: true,
        animate: true,
        doneBtnText: "Đã hiểu!",
        nextBtnText: "Tiếp theo",
        prevBtnText: "Trước đó",
        allowClose: true,
        steps: availableSteps,
        onDestroyed: async () => {
          const nextSeenTours = Array.from(new Set([...(user.seenTours || []), tourKey]));
          
          // Lưu vào localStorage và state trước
          window.localStorage.setItem(`hto_tour_seen_${user.id}_${tourKey}`, "true");
          handleUserUpdate({ seenTours: nextSeenTours });

          try {
            // Cập nhật trạng thái đã xem lên server
            await authFetch(`${API_BASE_URL}/users/${user.id}`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                ...getAuthHeaders(),
              },
              body: JSON.stringify({ seenTours: nextSeenTours }),
            });
          } catch (error) {
            console.error("Lỗi khi lưu trạng thái xem tour lên server:", error);
          }
        },
      });

      driverObj.drive();
    }, 900);

    return () => clearTimeout(timer);
  }, [user, currentPage, isNotificationMenuOpen, handleUserUpdate]);

  useEffect(() => {
    window.resetTours = async () => {
      if (!user) {
        console.warn("Chưa đăng nhập user để reset tour");
        return;
      }
      try {
        // Xóa trong localStorage
        window.localStorage.removeItem(`hto_tour_seen_admin_${user.id}`);
        Object.keys(PAGE_TOURS).forEach((key) => {
          window.localStorage.removeItem(`hto_tour_seen_${user.id}_${key}`);
        });

        await authFetch(`${API_BASE_URL}/users/${user.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify({
            seenTours: [],
            hasSeenAdminTutorial: false,
          }),
        });
        handleUserUpdate({
          seenTours: [],
          hasSeenAdminTutorial: false,
        });
        window.localStorage.removeItem("hto_admin_tour_step");
        console.log("✅ Đã reset toàn bộ trạng thái hướng dẫn (tours). Vui lòng chuyển trang hoặc F5 để xem lại!");
      } catch (error) {
        console.error("❌ Lỗi khi reset tour:", error);
      }
    };
    return () => {
      delete window.resetTours;
    };
  }, [user, handleUserUpdate]);

  useEffect(() => {
    if (user) {
      return undefined;
    }

    const syncAuthModeFromUrl = () => {
      if (getAuthModeFromLocation() === "reset-password") {
        setAuthMode("reset-password");
      } else if (window.location.search === "" || window.location.pathname !== "/reset-password") {
        setAuthMode((currentMode) =>
          currentMode === "reset-password" ? "login" : currentMode,
        );
      }
    };

    syncAuthModeFromUrl();
    window.addEventListener("popstate", syncAuthModeFromUrl);

    return () => {
      window.removeEventListener("popstate", syncAuthModeFromUrl);
    };
  }, [user]);

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    const handleExpiredSession = () => {
      setUser(null);
      setCurrentPage("dashboard");
      setAuthMode("login");
    };

    const enforceAuthSession = () => {
      if (!hasStoredSession()) {
        setUser(null);
        setCurrentPage("dashboard");
        setAuthMode("login");
        clearStoredSession();
      }
    };

    enforceAuthSession();

    window.addEventListener("focus", enforceAuthSession);
    window.addEventListener(AUTH_EVENTS.expired, handleExpiredSession);
    document.addEventListener("visibilitychange", enforceAuthSession);

    const sessionGuard = window.setInterval(enforceAuthSession, 1000);

    return () => {
      window.removeEventListener("focus", enforceAuthSession);
      window.removeEventListener(AUTH_EVENTS.expired, handleExpiredSession);
      document.removeEventListener("visibilitychange", enforceAuthSession);
      window.clearInterval(sessionGuard);
    };
  }, [user]);

  const handleToggleSidebar = (e) => {
    const togglerBtn = e?.currentTarget;
    togglerBtn?.classList?.toggle("active");

    if (window.innerWidth >= 1191) {
      const currentValue =
        document.documentElement.getAttribute("data-app-sidebar");
      const nextValue = currentValue === "full" ? "mini" : "full";
      document.documentElement.setAttribute("data-app-sidebar", nextValue);
      return;
    }

    document.querySelectorAll(".app-menubar").forEach((menubar) => {
      menubar.classList.toggle("open");
    });
  };

  const handleToggleTheme = (e) => {
    e?.preventDefault?.();
    setTheme((currentTheme) => (currentTheme === "light" ? "dark" : "light"));
  };

  const handleNavigate = (page, options = {}) => {
    if (page === "qna") {
      setIsAiChatOpen(true);
      return;
    }

    setCurrentPage(page);
    setSelectedNotificationId(
      page === "notifications" ? options.notificationId || null : null,
    );
    if (page === "hotro") {
      setSupportInitialTab(options.activeTab || "faq");
    }
  };

  // Lắng nghe navigate event từ DashboardPage
  useEffect(() => {
    const handler = (e) => handleNavigate(e.detail?.page);
    window.addEventListener("app:navigate", handler);
    return () => window.removeEventListener("app:navigate", handler);
  }, []);

  const handleLogin = (userData) => {
    if (!hasStoredSession()) {
      setUser(null);
      setAuthMode("login");
      return;
    }

    const nextUser = storeAuthUser(userData);

    if (!nextUser) {
      clearStoredSession();
      setUser(null);
      setAuthMode("login");
      return;
    }

    setUser(nextUser);
    // Điều hướng dựa trên vai trò
    if (nextUser.roleId === ROLE_IDS.ADMIN) {
      setCurrentPage("dashboard");
    } else {
      setCurrentPage("documents");
    }
  };

  const handleLogout = () => {
    // Xóa thông tin đăng nhập
    setUser(null);
    clearStoredSession();
    resetAuthUrl();
    setCurrentPage("dashboard");
    setAuthMode("login");
  };


  if (!user) {
    let authContent;

    if (authMode === "login") {
      authContent = (
        <LoginPage
          onLogin={handleLogin}
          onSwitchToRegister={() => setAuthMode("register")}
          onSwitchToForgot={() => {
            resetAuthUrl();
            setAuthMode("forgot");
          }}
        />
      );
    } else if (authMode === "register") {
      authContent = (
        <RegisterPage
          onLayoutModeChange={setRegisterLayoutMode}
          onRegister={handleLogin}
          onSwitchToLogin={() => {
            resetAuthUrl();
            setRegisterLayoutMode("account");
            setAuthMode("login");
          }}
        />
      );
    } else if (authMode === "forgot") {
      authContent = (
        <ForgotPasswordPage
          onSwitchToLogin={() => {
            resetAuthUrl();
            setRegisterLayoutMode("account");
            setAuthMode("login");
          }}
        />
      );
    } else if (authMode === "reset-password") {
      authContent = (
        <ResetPasswordPage
          onSwitchToLogin={() => {
            resetAuthUrl();
            setRegisterLayoutMode("account");
            setAuthMode("login");
          }}
        />
      );
    }

    return (
      <AuthLayout
        authMode={authMode}
        imageSrc={AUTH_BANNER_IMAGES[authMode] || AUTH_BANNER_IMAGES.login}
        registerLayoutMode={registerLayoutMode}
      >
        {authContent}
      </AuthLayout>
    );
  }

  const getDeptRouteInfo = () => {
    if (typeof currentPage === "string") {
      if (currentPage.startsWith("dept-sop:")) {
        return { type: "sop", id: currentPage.split(":")[1] };
      }
      if (currentPage.startsWith("dept-docs:")) {
        return { type: "docs", id: currentPage.split(":")[1] };
      }
      if (currentPage.startsWith("dept-jds:")) {
        return { type: "jds", id: currentPage.split(":")[1] };
      }
    }
    return null;
  };

  const deptRoute = getDeptRouteInfo();

  return (
    <div className="page-layout bg-body-tertiary d-flex flex-column min-vh-100">
      <Header
        user={user}
        onNavigate={handleNavigate}
        onToggleSidebar={handleToggleSidebar} 
        onToggleTheme={handleToggleTheme} 
        onLogout={handleLogout}
      />

      <Sidebar
        currentUser={user}
        onNavigate={handleNavigate}
        currentPage={currentPage}
        onToggleSidebar={handleToggleSidebar}
      />

      <main
        className={`app-wrapper${
          currentPage === "notifications" ? " notifications-wrapper" : ""
        }`}
      >
        {deptRoute ? (
          deptRoute.type === "sop" ? (
            <DepartmentGeneralPage currentUser={user} departmentId={deptRoute.id} />
          ) : deptRoute.type === "docs" ? (
            <DocumentsPage currentUser={user} filterDepartmentId={deptRoute.id} />
          ) : (
            <JobDescriptionsPage currentUser={user} filterDepartmentId={deptRoute.id} />
          )
        ) : currentPage === "profile" ? (
          <ProfilePage currentUser={user} onUserUpdate={handleUserUpdate} />
        ) : currentPage === "users" ? (
          // Truyền currentUser (chính là state 'user' ở App.jsx) xuống để check quyền
          <UserList currentUser={user} />
        ) : currentPage === "roles" ? (
          <RoleManagementPage currentUser={user} />
        ) : currentPage === "departments" ? (
          <DepartmentsPage currentUser={user} />
        ) : currentPage === "auditLogs" ? (
          <AuditLogPage currentUser={user} />
        ) : currentPage === "checklist" ? (
          <ChecklistPage currentUser={user} />
        ) : currentPage === "sop" ? (
          <SOPPage currentUser={user} />
        ) : currentPage === "documentSearch" ? (
          <DocumentSearchPage currentUser={user} />
        ) : currentPage === "leadForm" ? (
          <LeadFormPage currentUser={user} />
        ) : currentPage === "aiConfig" ? (
          <AIConfigPage currentUser={user} />
        ) : currentPage === "aiPending" ? (
          <AIPendingQuestionsPage currentUser={user} />
        ) : currentPage === "aiHistory" ? (
          <AIHistoryPage currentUser={user} />
        ) : currentPage === "jobDescriptions" ? (
          <JobDescriptionsPage currentUser={user} />
        ) : currentPage === "notifications" ? (
          <NotificationsPage
            currentUser={user}
            selectedNotificationId={selectedNotificationId}
          />
        ) : currentPage === "hotro" ? (
          <SupportPage currentUser={user} initialTab={supportInitialTab} />
        ) : currentPage === "documents" ? (
          <DocumentsPage currentUser={user} />
        ) : currentPage === "nghiepvu" ? (
          <JobDescriptionsPage currentUser={user} />
        ) : currentPage === "doisoatdeal" ? (
          <AccountingManagementPage currentUser={user} />
        ) : currentPage === "dashboardStats" ? (
          <DashboardPage currentUser={user} />
        ) : currentPage === "newsEventsManage" ? (
          <NewsEventsManagementPage currentUser={user} />
        ) : currentPage === "tintuc" ? (
          <NewsEventsPage currentUser={user} />
        ) : currentPage === "dashboard" ? (
          <HomePage theme={theme} onNavigate={handleNavigate} currentUser={user} />
        ) : currentPage === "productOverview" ? (
          <ProductOverviewPage currentUser={user} />
        ) : currentPage === "productManagement" ? (
          <ProductManagementPage currentUser={user} />
        ) : currentPage === "systemSettings" ? (
          <SystemSettingsPage currentUser={user} />
        ) : ["sanpham", "duhocduc", "dinhcu", "visa", "daotaongonngu", "nophosoonline"].includes(currentPage) || currentPage.startsWith("product:") ? (
          <ProductsPage currentUser={user} currentPage={currentPage} onNavigate={setCurrentPage} />
        ) : (
          <div className="container-fluid pt-3 pb-1" style={{ maxWidth: "1600px" }}>
            {/* --- ROW 1: BANNER --- */}
            <div className="row mb-3 gx-2 gx-xl-3 align-items-stretch">
              {/* Box 1 nằm dọc trên Mobile (mb-3), ngang trên Tablet/Desktop */}
              <div className="col-12 col-md-8 col-lg-8 col-xl-8 mb-3 mb-md-0">
                <div className="card border-0 bg-transparent h-100">
                  <img src="./assets/images/banner-web-korean.jpg" alt="Banner Du học Hàn Quốc" className="img-fluid w-100 h-100 bg-primary-subtle" style={{ borderRadius: "12px", objectFit: "cover", minHeight: "180px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }} />
                </div>
              </div>

              {/* Box 2 nằm dọc dưới Box 1 trên Mobile */}
              <div className="col-12 col-md-4 col-lg-4 col-xl-4">
                <div className="card border-0 bg-transparent h-100">
                  <img src="./assets/images/banner-second.jpg" alt="HITO Support Box" className="img-fluid w-100 h-100 bg-body" style={{ borderRadius: "12px", objectFit: "cover", minHeight: "180px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }} />
                </div>
              </div>
            </div>

            {/* --- ROW 2: TỔNG QUAN, ĐIỀU KIỆN, THỦ TỤC --- */}
            <div className="row mb-3 gx-2 gx-xl-3 align-items-stretch">
              {/* TỔNG QUAN */}
              <div className="col-12 col-md-3 col-lg-3 col-xl-3 mb-3 mb-md-0">
                <div className="card border-0 h-100" style={{ borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", minHeight: "240px" }}>
                  <div className="card-body p-2 p-xl-3 d-flex flex-column justify-content-between">
                    <h6 className="fw-bold d-flex align-items-center mb-2 text-body-emphasis" style={{ fontSize: "14px" }}>
                      <img src="./assets/images/germany-banner.png" alt="Cờ Đức" className="bg-secondary-subtle border border-secondary-subtle" style={{ width: "20px", height: "14px", marginRight: "8px", borderRadius: "2px" }} />
                      TỔNG QUAN
                    </h6>
                    <p className="text-body-secondary mb-2" style={{ fontSize: "12px", lineHeight: "1.3" }}>
                      HTO cập nhật nhanh chóng và chính xác các thông tin du học Đức mới nhất.
                    </p>
                    <div className="d-flex align-items-center flex-grow-1">
                      <div className="w-40 text-center pe-1 pe-xl-2">
                        <img src="./assets/images/germany-map.png" alt="Bản đồ Đức" className="img-fluid bg-body-tertiary rounded" style={{ width: "100%", maxHeight: "110px", objectFit: "contain" }} />
                      </div>
                      <div className="w-60 d-grid gap-1 gap-xl-2" style={{ gridTemplateColumns: "1fr 1fr" }}>
                        <div className="text-center rounded p-1 bg-body-secondary overflow-hidden">
                          <div className="fw-bold text-body-emphasis text-truncate" style={{ fontSize: "13px" }}>157 key</div>
                          <div className="text-body-secondary" style={{ fontSize: "10px", lineHeight: "1.2" }}>đại học & cao đẳng</div>
                        </div>
                        <div className="text-center rounded p-1 bg-body-secondary overflow-hidden">
                          <div className="fw-bold text-body-emphasis text-truncate" style={{ fontSize: "13px" }}>24 sites</div>
                          <div className="text-body-secondary" style={{ fontSize: "10px", lineHeight: "1.2" }}>thi tiếng</div>
                        </div>
                        <div className="text-center rounded p-1 bg-body-secondary overflow-hidden">
                          <div className="fw-bold text-body-emphasis text-truncate" style={{ fontSize: "13px" }}>200 ngành</div>
                          <div className="text-body-secondary" style={{ fontSize: "10px", lineHeight: "1.2" }}>đào tạo</div>
                        </div>
                        <div className="text-center rounded p-1 bg-body-secondary overflow-hidden">
                          <div className="fw-bold text-body-emphasis text-truncate" style={{ fontSize: "13px" }}>Số liệu</div>
                          <div className="text-body-secondary" style={{ fontSize: "10px", lineHeight: "1.2" }}>chứng minh</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ĐIỀU KIỆN */}
              <div className="col-12 col-md-3 col-lg-3 col-xl-3 mb-3 mb-md-0">
                <div className="card border-0 h-100" style={{ borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", minHeight: "240px" }}>
                  <div className="card-body p-2 p-xl-3 d-flex flex-column justify-content-between">
                    <h6 className="fw-bold d-flex align-items-center mb-2 text-body-emphasis" style={{ fontSize: "14px" }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="text-primary me-2">
                        <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="currentColor" />
                      </svg>
                      ĐIỀU KIỆN
                    </h6>

                    {/* Bổ sung flex-wrap cho trường hợp màn iPad quá hẹp */}
                    <div className="d-flex flex-wrap justify-content-between mb-2 gap-1 gap-xl-2">
                      <div className="text-center rounded p-1 p-xl-2 flex-fill bg-primary-subtle text-primary overflow-hidden">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="mb-1">
                          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                        </svg>
                        <span className="fw-bold text-body-emphasis d-block text-truncate" style={{ fontSize: "11.5px" }}>Tuổi</span>
                      </div>
                      <div className="text-center rounded p-1 p-xl-2 flex-fill bg-warning-subtle text-warning overflow-hidden">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="mb-1">
                          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
                        </svg>
                        <span className="fw-bold text-body-emphasis" style={{ fontSize: "11.5px", lineHeight: "1.2", display: "block" }}>B1/B2<br />Tiếng Đức</span>
                      </div>
                      <div className="text-center rounded p-1 p-xl-2 flex-fill bg-body-secondary text-primary overflow-hidden">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="mb-1">
                          <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72l5 2.73 5-2.73v3.72z" />
                        </svg>
                        <span className="fw-bold text-body-emphasis" style={{ fontSize: "11.5px", lineHeight: "1.2", display: "block" }}>Tốt nghiệp<br />THPT</span>
                      </div>
                    </div>

                    <div className="d-flex flex-wrap gap-1 gap-xl-2">
                      <div className="flex-fill text-white rounded p-1 px-xl-2 py-xl-2 d-flex justify-content-center align-items-center text-nowrap overflow-hidden" style={{ backgroundColor: "#5b6cf9", fontSize: "11.5px" }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="me-1 d-none d-xl-block"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" /></svg>
                        <span className="text-truncate">Tờ tiền CM</span>
                      </div>
                      <div className="flex-fill text-white rounded p-1 px-xl-2 py-xl-2 d-flex justify-content-center align-items-center text-nowrap overflow-hidden" style={{ backgroundColor: "#0b6fb3", fontSize: "11.5px" }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="me-1 d-none d-xl-block"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" /></svg>
                        <span className="text-truncate">Số tiền CM</span>
                      </div>
                      <div className="flex-fill text-white rounded p-1 px-xl-2 py-xl-2 d-flex justify-content-center align-items-center text-nowrap overflow-hidden" style={{ backgroundColor: "#5b6cf9", fontSize: "11.5px", opacity: 0.9 }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="me-1 d-none d-xl-block"><path d="M12 1L3 6v2h18V6l-9-5zm0 2.18l5.36 2.82H6.64L12 3.18zM5 10h2v7H5v-7zm6 0h2v7h-2v-7zm6 0h2v7h-2v-7zM3 19h18v2H3v-2z" /></svg>
                        <span className="text-truncate">TK phong tỏa</span>
                      </div>
                      <div className="flex-fill text-white rounded p-1 px-xl-2 py-xl-2 d-flex justify-content-center align-items-center text-nowrap overflow-hidden" style={{ backgroundColor: "#0b6fb3", fontSize: "11.5px", opacity: 0.9 }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="me-1 d-none d-xl-block"><path d="M21 7.28V5c0-1.1-.9-2-2-2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-2.28c.59-.35 1-.98 1-1.72V9c0-.74-.41-1.37-1-1.72zM20 9v6h-7V9h7zM5 19V5h14v2h-6c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h6v2H5z" /><circle cx="16" cy="12" r="1.5" /></svg>
                        <span className="text-truncate">Sổ tiết kiệm</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* THỦ TỤC */}
              <div className="col-12 col-md-6 col-lg-6 col-xl-6">
                <div className="card border-0 h-100" style={{ borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", minHeight: "240px" }}>
                  <div className="card-body p-2 p-xl-3 d-flex flex-column overflow-hidden">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="fw-bold d-flex align-items-center mb-0 text-body-emphasis" style={{ fontSize: "14px" }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="text-primary me-2" fill="currentColor">
                          <path d="M19 3H14.82C14.4 1.84 13.3 1 12 1C10.7 1 9.6 1.84 9.18 3H5C3.9 3 3 3.9 3 5V20C3 21.1 3.9 22 5 22H19C20.1 22 21 21.1 21 20V5C21 3.9 20.1 3 19 3ZM12 3C12.55 3 13 3.45 13 4C13 4.55 12.55 5 12 5C11.45 5 11 4.55 11 4C11 3.45 11.45 3 12 3ZM16 15H8V13H16V15ZM16 11H8V9H16V11Z" />
                        </svg>
                        THỦ TỤC
                      </h6>
                      <span className="text-body-secondary d-none d-md-inline text-truncate" style={{ fontSize: "11px" }}>Cập nhật: 15/03/2026</span>
                    </div>

                    <div className="d-flex justify-content-between align-items-start mt-auto mb-auto overflow-x-auto pb-2" style={{ minWidth: "100%" }}>
                      <div className="d-flex justify-content-between w-100" style={{ minWidth: "400px" }}>
                        {[
                          { step: 1, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>, title: "Tư vấn\nban đầu", sub: "20 min." },
                          { step: 2, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm-2 14l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" /></svg>, title: "Đào tạo\nngôn ngữ", sub: "25 min.\n(03 tuần)" },
                          { step: 3, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6 10H6v-2h8v2zm4-4H6v-2h12v2z" /></svg>, title: "Nộp hồ sơ\ntrường", sub: "33 min.\n(3h nhận bot)" },
                          { step: 4, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" /></svg>, title: "Xin Visa", sub: "" },
                          { step: 5, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M2.5 19h19v2h-19zm19.57-9.36c-.21-.8-1.04-1.28-1.84-1.06L14.92 10l-6.9-6.43-1.93.51 4.14 7.17-4.97 1.33-1.97-1.54-1.45.39 1.82 3.16.77 1.33 1.6-.43 5.31-1.42 4.35-1.16L21 11.49c.81-.23 1.28-1.05 1.07-1.85z" /></svg>, title: "Bay &\nNhập học", sub: "90 min.\n(3h nhận tỉnh)" },
                          { step: 6, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" /></svg>, title: "Đến nơi", sub: "" }
                        ].map((item, index) => (
                          <div key={index} className="d-flex flex-column align-items-center position-relative" style={{ flex: 1 }}>
                            {index < 5 && (
                              <div className="position-absolute" style={{ top: "12px", left: "50%", width: "100%", height: "2px", backgroundColor: theme === "dark" ? "#ffffff" : "#1e40af", zIndex: 0 }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="position-absolute top-50 start-50 translate-middle" style={{ color: theme === "dark" ? "#ffffff" : "#1e40af", backgroundColor: "var(--bs-card-bg)", padding: "0 2px" }}>
                                  <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
                                </svg>
                              </div>
                            )}

                            <div className="rounded-circle d-flex align-items-center justify-content-center mb-2 position-relative shadow-sm" style={{ backgroundColor: theme === "dark" ? "#ffffff" : "#1e40af", color: theme === "dark" ? "#1e40af" : "#ffffff", width: "24px", height: "24px", fontSize: "12px", fontWeight: "bold", zIndex: 1 }}>
                              {item.step}
                            </div>

                            <div className="d-flex align-items-center justify-content-center mb-1 text-primary" style={{ height: "30px" }}>
                              {item.icon}
                            </div>

                            <div className="fw-bold text-center text-body-emphasis mt-1 text-wrap" style={{ fontSize: "12.5px", lineHeight: "1.2", whiteSpace: "pre-line" }}>{item.title}</div>
                            <div className="text-body-secondary text-center mt-1 text-wrap" style={{ fontSize: "10.5px", lineHeight: "1.2", whiteSpace: "pre-line" }}>{item.sub}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* --- ROW 3: CHI PHÍ, KHO TÀI LIỆU, Q&A --- */}
            <div className="row mb-3 gx-2 gx-xl-3 align-items-stretch">
              {/* CHI PHÍ DỰ KIẾN */}
              <div className="col-12 col-md-4 col-lg-4 col-xl-4 mb-3 mb-md-0">
                <div className="card border-0 h-100" style={{ borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", minHeight: "320px" }}>
                  <div className="card-header bg-transparent border-0 p-3 pb-0">
                    <h6 className="fw-bold d-flex align-items-center mb-0 text-body-emphasis" style={{ fontSize: "14px" }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" className="text-primary me-2" fill="currentColor">
                        <path d="M19 4H5C3.895 4 3 4.895 3 6V18C3 19.105 3.895 20 5 20H19C20.105 20 21 19.105 21 18V6C21 4.895 20.105 4 19 4ZM6 7H9V10H6V7ZM6 12H9V15H6V12ZM18 15H11V12H18V15ZM18 10H11V7H18V10Z" />
                      </svg>
                      CHI PHÍ DỰ KIẾN
                    </h6>
                  </div>
                  <div className="card-body p-0 mt-2 d-flex flex-column justify-content-center table-responsive">
                    <table className="table table-borderless align-middle mb-0" style={{ fontSize: "13px", minWidth: "100%" }}>
                      <thead className="border-bottom">
                        <tr>
                          <th className="fw-bold text-body-emphasis ps-4 py-2" style={{ width: "45%" }}>Hạng mục phí</th>
                          <th className="fw-bold text-body-emphasis text-end py-2 pe-4">Số tiền (VNĐ)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="ps-4 py-2 text-body-secondary fw-medium text-nowrap">Phí dịch vụ HTO</td>
                          <td className="text-end fw-bold py-2 pe-4 text-success" style={{ fontSize: "13px" }}>5.000.000</td>
                        </tr>
                        <tr>
                          <td className="ps-4 py-2 text-body-secondary fw-medium text-nowrap">Học phí</td>
                          <td className="text-end fw-bold py-2 pe-4 text-success" style={{ fontSize: "13px" }}>4.000.000</td>
                        </tr>
                        <tr>
                          <td className="ps-4 py-2 text-body-secondary fw-medium text-wrap">Sinh hoạt phí dự kiến</td>
                          <td className="text-end fw-bold py-2 pe-4 text-success" style={{ fontSize: "13px" }}>2.000.000</td>
                        </tr>
                        <tr>
                          <td className="ps-4 py-2 text-body-secondary fw-medium text-nowrap">Bảo hiểm</td>
                          <td className="text-end fw-bold py-2 pe-4 text-success" style={{ fontSize: "13px" }}>1.200.000</td>
                        </tr>
                        <tr>
                          <td className="ps-4 py-2 border-bottom text-body-secondary fw-medium text-nowrap">Vé máy bay</td>
                          <td className="text-end fw-bold py-2 border-bottom pe-4 text-success" style={{ fontSize: "13px" }}>350.000</td>
                        </tr>
                        <tr className="bg-body-secondary">
                          <td className="ps-4 py-3 fw-bold text-body-emphasis text-nowrap">Tổng chi phí</td>
                          <td className="text-end fw-bold py-3 pe-4 text-danger" style={{ fontSize: "15px" }}>38.900.000</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* KHO TÀI LIỆU */}
              <div className="col-12 col-md-4 col-lg-4 col-xl-4 mb-3 mb-md-0">
                <div className="card border-0 h-100" style={{ borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", minHeight: "320px" }}>
                  <div className="card-header bg-transparent border-0 p-3 pb-0">
                    <h6 className="fw-bold d-flex align-items-center mb-0 text-body-emphasis" style={{ fontSize: "14px" }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" className="text-primary me-2" fill="currentColor">
                        <path d="M20 6H12L10 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V8C22 6.9 21.1 6 20 6ZM14 16H6V14H14V16ZM18 12H6V10H18V12Z" />
                      </svg>
                      KHO TÀI LIỆU
                    </h6>
                  </div>
                  <div className="card-body p-3 d-flex flex-column justify-content-between">
                    <ul className="list-unstyled mb-0 flex-grow-1">
                      <li className="d-flex justify-content-between align-items-center py-2">
                        {/* Style minWidth 0 là cần thiết để text-truncate hoạt động chuẩn trong Flexbox */}
                        <div className="d-flex align-items-center gap-3 pe-2 w-100" style={{ minWidth: 0 }}>
                          <img src="./assets/images/Logo-TUM.svg.png" alt="TUM" className="rounded bg-body-secondary flex-shrink-0" style={{ width: "32px", height: "32px", objectFit: "contain" }} />
                          <span className="fw-medium text-body-emphasis text-truncate" style={{ fontSize: "13px" }}>Technical University of Munich</span>
                        </div>
                        <button className="btn btn-sm btn-outline-primary border px-2 bg-body-tertiary text-nowrap flex-shrink-0" style={{ fontSize: "11px", fontWeight: "600" }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="me-1 d-none d-md-inline"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" /></svg> Tải
                        </button>
                      </li>
                      <li className="d-flex justify-content-between align-items-center py-2 border-top">
                        <div className="d-flex align-items-center gap-3 pe-2 w-100" style={{ minWidth: 0 }}>
                          <img src="./assets/images/Huberlin-logo.svg.png" alt="Humboldt" className="rounded bg-body-secondary flex-shrink-0" style={{ width: "32px", height: "32px", objectFit: "contain" }} />
                          <span className="fw-medium text-body-emphasis text-truncate" style={{ fontSize: "13px" }}>Humboldt University Berlin</span>
                        </div>
                        <button className="btn btn-sm btn-outline-primary border px-2 bg-body-tertiary text-nowrap flex-shrink-0" style={{ fontSize: "11px", fontWeight: "600" }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="me-1 d-none d-md-inline"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" /></svg> Tải
                        </button>
                      </li>

                      <li className="d-flex justify-content-between align-items-center py-2 border-top">
                        <div className="d-flex align-items-center gap-3 pe-2 w-100" style={{ minWidth: 0 }}>
                          <div className="rounded d-flex align-items-center justify-content-center text-white fw-bold shadow-sm flex-shrink-0" style={{ width: "32px", height: "32px", backgroundColor: "#2563eb", fontSize: "10px", letterSpacing: "0.5px" }}>
                            DOCX
                          </div>
                          <div className="text-truncate w-100">
                            <span className="fw-medium text-body-emphasis d-block text-truncate" style={{ fontSize: "13px" }}>Mẫu Hợp Đồng Du Học Đức V3.0</span>
                            <span className="text-body-secondary d-block text-truncate" style={{ fontSize: "11px" }}>(DOCX)</span>
                          </div>
                        </div>
                        <button className="btn btn-sm btn-outline-primary border px-2 bg-body-tertiary text-nowrap flex-shrink-0" style={{ fontSize: "11px", fontWeight: "600" }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="me-1 d-none d-md-inline"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" /></svg> Tải
                        </button>
                      </li>
                      <li className="d-flex justify-content-between align-items-center py-2 border-top">
                        <div className="d-flex align-items-center gap-3 pe-2 w-100" style={{ minWidth: 0 }}>
                          <div className="rounded d-flex align-items-center justify-content-center text-white fw-bold shadow-sm flex-shrink-0" style={{ width: "32px", height: "32px", backgroundColor: "#ef4444", fontSize: "11px", letterSpacing: "0.5px" }}>
                            PDF
                          </div>
                          <div className="text-truncate w-100">
                            <span className="fw-medium text-body-emphasis d-block text-truncate" style={{ fontSize: "13px" }}>Bảng Kế Hồ Sơ Cần Thiết</span>
                            <span className="text-body-secondary d-block text-truncate" style={{ fontSize: "11px" }}>(PDF)</span>
                          </div>
                        </div>
                        <button className="btn btn-sm btn-outline-primary border px-2 bg-body-tertiary text-nowrap flex-shrink-0" style={{ fontSize: "11px", fontWeight: "600" }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="me-1 d-none d-md-inline"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" /></svg> Tải
                        </button>
                      </li>
                    </ul>
                    <div className="text-center pt-2 mt-1 border-top">
                      <a href="#" className="text-decoration-none fw-bold text-primary d-flex justify-content-center align-items-center" style={{ fontSize: "13px" }}>
                        Xem tất cả <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="ms-1"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" /></svg>
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Q&A */}
              <div className="col-12 col-md-4 col-lg-4 col-xl-4">
                <div className="card border-0 h-100" style={{ borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", minHeight: "320px" }}>
                  <div className="card-header bg-transparent border-0 p-3 pb-0 d-flex flex-column justify-content-between align-items-start">
                    <h6 className="fw-bold d-flex align-items-center mb-2 text-body-emphasis" style={{ fontSize: "14px" }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" className="text-primary me-2" fill="currentColor">
                        <path d="M20 2H8C6.9 2 6 2.9 6 4V16L10 12H20C21.1 12 22 11.1 22 10V4C22 2.9 21.1 2 20 2ZM15 9H13V7H15V9ZM11 9H9V7H11V9ZM19 9H17V7H19V9ZM4 6H2V20C2 21.1 2.9 22 4 22H18V20H4V6Z" />
                      </svg>
                      Q&A CÙNG HITO
                    </h6>
                    <div className="position-relative w-100 mt-1">
                      <input type="text" className="form-control form-control-sm border bg-body-tertiary text-body w-100" placeholder="Tìm câu hỏi..." style={{ fontSize: "12px", paddingRight: "30px", borderRadius: "6px", padding: "6px 10px" }} />
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="position-absolute text-body-secondary" style={{ top: "50%", transform: "translateY(-50%)", right: "10px" }}>
                        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                      </svg>
                    </div>
                  </div>
                  <div className="card-body p-3 d-flex flex-column justify-content-between">
                    <div>
                      {/* Q1 */}
                      <div className="d-flex mb-3 align-items-start">
                        <div className="rounded-circle text-white d-flex justify-content-center align-items-center me-2 flex-shrink-0" style={{ width: "22px", height: "22px", backgroundColor: "#1d4ed8", fontSize: "12px", fontWeight: "bold", marginTop: "2px" }}>1</div>
                        <div className="flex-grow-1 pe-2 w-100" style={{ minWidth: 0 }}>
                          <h6 className="fw-bold mb-1 text-body-emphasis text-truncate" style={{ fontSize: "13px" }}>Có được làm thêm không?</h6>
                          <p className="text-body-secondary mb-0 text-truncate" style={{ fontSize: "11.5px", lineHeight: "1.3" }}>Có. Sinh viên được phép làm thêm tối đa...</p>
                        </div>
                        <img src="./assets/images/hito_6.png" width="32" height="32" alt="HITO" className="rounded-circle flex-shrink-0 bg-secondary-subtle" style={{ objectFit: "cover" }} />
                      </div>

                      {/* Q2 */}
                      <div className="d-flex mb-3 pt-2 border-top align-items-start">
                        <div className="rounded-circle text-white d-flex justify-content-center align-items-center me-2 flex-shrink-0" style={{ width: "22px", height: "22px", backgroundColor: "#1d4ed8", fontSize: "12px", fontWeight: "bold", marginTop: "2px" }}>2</div>
                        <div className="flex-grow-1 pe-2 w-100" style={{ minWidth: 0 }}>
                          <h6 className="fw-bold mb-1 text-body-emphasis text-truncate" style={{ fontSize: "13px" }}>Học bổng thế nào?</h6>
                          <p className="text-body-secondary mb-0 text-truncate" style={{ fontSize: "11.5px", lineHeight: "1.3" }}>HTO hỗ trợ săn học bổng từ các trường...</p>
                        </div>
                        <img src="./assets/images/hito_6.png" width="32" height="32" alt="HITO" className="rounded-circle flex-shrink-0 bg-secondary-subtle" style={{ objectFit: "cover" }} />
                      </div>

                      {/* Q3 */}
                      <div className="d-flex mb-2 pt-2 border-top align-items-start">
                        <div className="rounded-circle text-white d-flex justify-content-center align-items-center me-2 flex-shrink-0" style={{ width: "22px", height: "22px", backgroundColor: "#1d4ed8", fontSize: "12px", fontWeight: "bold", marginTop: "2px" }}>3</div>
                        <div className="flex-grow-1 pe-2 w-100" style={{ minWidth: 0 }}>
                          <h6 className="fw-bold mb-1 text-body-emphasis text-truncate" style={{ fontSize: "13px" }}>Tài chính bao nhiêu?</h6>
                          <p className="text-body-secondary mb-0 text-truncate" style={{ fontSize: "11.5px", lineHeight: "1.3" }}>Tối thiểu 11.904 EUR/năm (quy định 2026).</p>
                        </div>
                        <img src="./assets/images/hito_6.png" width="32" height="32" alt="HITO" className="rounded-circle flex-shrink-0 bg-secondary-subtle" style={{ objectFit: "cover" }} />
                      </div>
                    </div>

                    <div className="d-flex flex-row justify-content-between align-items-center pt-2 mt-2 border-top gap-2">
                      <a href="#" className="text-decoration-none fw-bold text-primary d-flex align-items-center text-truncate" style={{ fontSize: "13px" }}>
                        Xem tất cả <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="ms-1 flex-shrink-0"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" /></svg>
                      </a>
                      <button className="btn text-white py-1 px-3 d-flex align-items-center bg-primary flex-shrink-0 text-nowrap" style={{ borderRadius: "20px", fontSize: "12px", fontWeight: "600" }}>
                        Hỏi mới
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
      <AiChatPage
        currentUser={user}
        isOpen={isAiChatOpen}
        onOpenChange={setIsAiChatOpen}
      />
    </div>
  );
}

export default App;
