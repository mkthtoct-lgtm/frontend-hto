import React, { useState, useMemo, useEffect } from "react";
import { authFetch, getAuthHeaders } from "../auth/session";
import { API_BASE_URL } from "../config/api";
import "./RoleManagementPage.css";

// Các quyền chuẩn của hệ thống HTO
const FEATURE_PERMISSION_GROUPS = [
  {
    id: "dashboard",
    title: "Trang chủ & Báo cáo",
    permissions: [
      { id: "dashboard:view", label: "Xem Dashboard" },
      { id: "dashboard:edit", label: "Chỉnh sửa Dashboard" },
      { id: "dashboard:export", label: "Xuất báo cáo thống kê" }
    ]
  },
  {
    id: "users",
    title: "Quản lý Tài khoản",
    permissions: [
      { id: "users:read", label: "Xem danh sách tài khoản" },
      { id: "users:write", label: "Thêm/Sửa/Xóa tài khoản" },
      { id: "users:lock", label: "Khóa/Mở khóa tài khoản" }
    ]
  },
  {
    id: "departments",
    title: "Phòng ban nghiệp vụ",
    permissions: [
      { id: "departments:read", label: "Xem danh sách phòng ban" },
      { id: "departments:write", label: "Thêm/Sửa/Ẩn phòng ban" }
    ]
  },
  {
    id: "documents",
    title: "Kho Tài liệu & Biểu mẫu",
    permissions: [
      { id: "documents:read", label: "Xem và tìm kiếm tài liệu" },
      { id: "documents:write", label: "Tải lên/Sửa/Xóa tài liệu" },
      { id: "documents:download", label: "Tải file tài liệu về máy" }
    ]
  },
  {
    id: "products",
    title: "Quản lý Sản phẩm dịch vụ",
    permissions: [
      { id: "products:read", label: "Xem danh mục sản phẩm & giá" },
      { id: "products:write", label: "Thêm/Sửa/Xóa sản phẩm" }
    ]
  },
  {
    id: "leads",
    title: "Khách hàng & Hợp đồng",
    permissions: [
      { id: "leads:read", label: "Xem danh sách khách hàng quan tâm" },
      { id: "leads:write", label: "Tạo mới & cập nhật trạng thái khách" }
    ]
  },
  {
    id: "notifications",
    title: "Thông báo & Tin tức",
    permissions: [
      { id: "notifications:read", label: "Nhận và đọc thông báo" },
      { id: "notifications:write", label: "Đăng thông báo & tin tức mới" }
    ]
  },
  {
    id: "settings",
    title: "Cấu hình hệ thống",
    permissions: [
      { id: "settings:manage", label: "Quản lý cấu hình & hoa hồng" }
    ]
  }
];

// Danh sách vai trò mặc định (khớp với Database Seeder)
const DEFAULT_ROLES = [
  {
    id: "69fc5af582ef85451120772a",
    name: "Quản trị viên",
    slug: "admin",
    description: "Quyền lực cao nhất, quản trị toàn bộ hệ thống HTO.",
    permissions: ["*"],
    userCount: 3,
    color: "bg-danger text-white"
  },
  {
    id: "69fc5af582ef85451120772b",
    name: "Ban Giám Đốc",
    slug: "bangiamdoc",
    description: "Ban giám đốc, quản trị nghiệp vụ, xem nhật ký thao tác và đăng thông báo.",
    permissions: [
      "departments:read", "departments:write", "users:read", "users:write",
      "documents:read", "documents:write", "notifications:read", "notifications:write",
      "products:read", "products:write", "settings:manage"
    ],
    userCount: 2,
    color: "bg-primary text-white"
  },
  {
    id: "69fc5af582ef85451120772c",
    name: "Trưởng bộ phận",
    slug: "truongbophan",
    description: "Quản lý phòng ban chuyên môn, xem tài liệu và đăng tin tức thông báo.",
    permissions: [
      "departments:read", "users:read", "documents:read", "documents:write",
      "notifications:read", "notifications:write", "products:read", "products:write"
    ],
    userCount: 4,
    color: "bg-warning text-dark"
  },
  {
    id: "69fc5af582ef85451120772d",
    name: "Nhân sự",
    slug: "nhansu",
    description: "Bộ phận Nhân sự hỗ trợ vận hành và nhận tin thông báo.",
    permissions: [
      "departments:read", "users:read", "documents:read", "notifications:read", "products:read"
    ],
    userCount: 5,
    color: "bg-info text-dark"
  },
  {
    id: "69fc5af582ef85451120772e",
    name: "Đại lý",
    slug: "daily",
    description: "Hệ thống đại lý phân phối, được phép xem tài liệu và nhận thông báo.",
    permissions: ["documents:read", "notifications:read", "products:read"],
    userCount: 15,
    color: "bg-success text-white"
  },
  {
    id: "69fc5af682ef85451120772f",
    name: "Cộng tác viên",
    slug: "congtacvien",
    description: "Cộng tác viên tự do tuyển sinh, được phép xem tài liệu và nhận thông báo.",
    permissions: ["documents:read", "notifications:read", "products:read"],
    userCount: 120,
    color: "bg-secondary text-white"
  },
  {
    id: "60c72b2f9b1d8b2bad000001",
    name: "Nhân viên",
    slug: "staff",
    description: "Nhân viên thông thường, chỉ được phép xem thông tin và nhận thông báo.",
    permissions: ["departments:read", "users:read", "documents:read", "documents:download", "notifications:read", "products:read"],
    userCount: 22,
    color: "bg-dark text-white"
  },
  {
    id: "69fc5af782ef854511207730",
    name: "Người dùng",
    slug: "user",
    description: "Khách hàng hoặc thành viên đăng ký tự do.",
    permissions: ["documents:read", "notifications:read", "products:read"],
    userCount: 350,
    color: "bg-light text-dark border"
  }
];

const getRoleColorBySlug = (slug) => {
  const map = {
    admin: "bg-danger text-white",
    bangiamdoc: "bg-primary text-white",
    truongbophan: "bg-warning text-dark",
    nhansu: "bg-info text-dark",
    daily: "bg-success text-white",
    congtacvien: "bg-secondary text-white",
    staff: "bg-dark text-white",
    user: "bg-light text-dark border"
  };
  return map[slug] || "bg-secondary text-white";
};

export const RoleManagementPage = ({ currentUser }) => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // 'create' | 'edit'
  const [selectedRole, setSelectedRole] = useState(null);
  const [toast, setToast] = useState(null);

  // Form State
  const [roleName, setRoleName] = useState("");
  const [roleSlug, setRoleSlug] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [roleColor, setRoleColor] = useState("bg-secondary text-white");

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const fetchRoles = async () => {
    setLoading(true);
    setError("");
    try {
      const headers = {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      };
      const response = await authFetch(`${API_BASE_URL}/roles?includeHidden=true`, { headers });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const payload = await response.json();
      const list = Array.isArray(payload) ? payload : (payload?.data || payload?.items || []);
      
      const mapped = list.map(r => ({
        id: r._id || r.id,
        name: r.name,
        slug: r.slug,
        description: r.description || "",
        permissions: r.permissions || [],
        userCount: r.userCount || 0,
        isHidden: r.isHidden || false,
        color: r.color || getRoleColorBySlug(r.slug)
      }));
      setRoles(mapped);
    } catch (err) {
      setError("Không thể tải danh sách vai trò từ hệ thống.");
      showToast("Không thể tải danh sách vai trò từ hệ thống.", "error");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  // Hệ thống vai trò được bảo vệ (không cho xóa)
  const systemSlugs = ["admin", "bangiamdoc", "truongbophan", "nhansu", "daily", "congtacvien", "staff", "user"];

  const handleOpenCreateModal = () => {
    setModalMode("create");
    setSelectedRole(null);
    setRoleName("");
    setRoleSlug("");
    setRoleDescription("");
    setSelectedPermissions([]);
    setRoleColor("bg-secondary text-white");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (role) => {
    setModalMode("edit");
    setSelectedRole(role);
    setRoleName(role.name);
    setRoleSlug(role.slug);
    setRoleDescription(role.description || "");
    setSelectedPermissions(role.permissions || []);
    setRoleColor(role.color || "bg-secondary text-white");
    setIsModalOpen(true);
  };

  const handleTogglePermission = (permissionId) => {
    if (selectedRole?.slug === "admin" && permissionId === "*") return;

    setSelectedPermissions((prev) => {
      if (permissionId === "*") {
        return prev.includes("*") ? [] : ["*"];
      }

      const clean = prev.filter((p) => p !== "*");
      if (clean.includes(permissionId)) {
        return clean.filter((p) => p !== permissionId);
      } else {
        return [...clean, permissionId];
      }
    });
  };

  const handleSelectAllInGroup = (groupPermissions, isAllChecked) => {
    if (selectedRole?.slug === "admin") return;

    setSelectedPermissions((prev) => {
      const clean = prev.filter((p) => p !== "*");
      const groupIds = groupPermissions.map(p => p.id);

      if (isAllChecked) {
        return clean.filter((p) => !groupIds.includes(p));
      } else {
        const union = new Set([...clean, ...groupIds]);
        return Array.from(union);
      }
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (actionLoading) return;
    if (!roleName.trim() || !roleSlug.trim()) {
      showToast("Họ tên vai trò và Slug không được để trống!", "warning");
      return;
    }

    const slugFormatted = roleSlug.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    setActionLoading(true);

    try {
      const headers = {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      };

      if (modalMode === "create") {
        if (roles.some((r) => r.slug === slugFormatted)) {
          showToast("Mã định danh (Slug) đã tồn tại! Vui lòng chọn mã khác.", "error");
          setActionLoading(false);
          return;
        }

        const response = await authFetch(`${API_BASE_URL}/roles`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            name: roleName.trim(),
            slug: slugFormatted,
            description: roleDescription.trim(),
            permissions: selectedPermissions,
          })
        });

        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.message || `HTTP ${response.status}`);
        }
      } else {
        const response = await authFetch(`${API_BASE_URL}/roles/${selectedRole.id}`, {
          method: "PUT",
          headers,
          body: JSON.stringify({
            name: roleName.trim(),
            slug: selectedRole.slug,
            description: roleDescription.trim(),
            permissions: selectedPermissions,
          })
        });

        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.message || `HTTP ${response.status}`);
        }
      }

      await fetchRoles();
      showToast(modalMode === "create" ? "Tạo vai trò thành công!" : "Cập nhật vai trò thành công!", "success");
      setIsModalOpen(false);
    } catch (err) {
      showToast("Thao tác thất bại: " + (err instanceof Error ? err.message : "Đã có lỗi xảy ra."), "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleVisibility = async (role) => {
    if (actionLoading) return;
    if (systemSlugs.includes(role.slug)) {
      showToast(`Không thể ẩn vai trò hệ thống "${role.name}"!`, "error");
      return;
    }

    const actionText = role.isHidden ? "hiển thị" : "ẩn";
    if (window.confirm(`Bạn có chắc chắn muốn ${actionText} vai trò "${role.name}"?`)) {
      setActionLoading(true);
      try {
        const headers = {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        };
        const response = await authFetch(`${API_BASE_URL}/roles/${role.id}/toggle-visibility`, {
          method: "PATCH",
          headers
        });

        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.message || `HTTP ${response.status}`);
        }

        await fetchRoles();
        showToast(role.isHidden ? `Đã hiển thị vai trò "${role.name}" thành công!` : `Đã ẩn vai trò "${role.name}" thành công!`, "success");
      } catch (err) {
        showToast("Lỗi khi thay đổi trạng thái ẩn/hiện: " + (err instanceof Error ? err.message : "Thao tác thất bại."), "error");
      } finally {
        setActionLoading(false);
      }
    }
  };

  const filteredRoles = useMemo(() => {
    return roles.filter((r) =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [roles, searchTerm]);

  // Kiểm tra quyền truy cập trang quản lý vai trò
  const isAuthorized = ["admin", "bangiamdoc"].includes(currentUser?.role);

  if (!isAuthorized) {
    return (
      <div className="container-fluid pt-5 text-center">
        <h2 className="text-danger">Từ chối truy cập</h2>
        <p className="text-body-secondary">Bạn không có quyền quản trị vai trò hệ thống.</p>
      </div>
    );
  }

  return (
    <div className="role-management-wrapper container-fluid pt-3 pb-4" style={{ maxWidth: "1600px" }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold text-body-emphasis mb-1">Quản lý vai trò & quyền hạn</h4>
          <p className="text-body-secondary small mb-0">Thiết lập danh sách vai trò của hệ thống HTO và gán các quyền phân hệ tương ứng.</p>
        </div>
        <button className="btn btn-primary d-flex align-items-center gap-2" onClick={handleOpenCreateModal} disabled={actionLoading}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Thêm vai trò mới
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="filter-bar mb-4">
        <div className="search-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            className="form-control form-control-sm bg-body border-1"
            placeholder="Tìm vai trò theo tên hoặc slug..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table of Roles */}
      <div className="card border-0 shadow-sm table-card">
        <div className="table-responsive">
          <table className="table custom-table align-middle mb-0">
            <thead>
              <tr>
                <th style={{ width: "5%" }}>#</th>
                <th style={{ width: "20%" }}>Vai trò</th>
                <th style={{ width: "25%" }}>Mô tả</th>
                <th style={{ width: "15%" }}>Trạng thái</th>
                <th style={{ width: "12%" }}>Số tài khoản</th>
                <th style={{ width: "13%" }}>Quyền phân hệ</th>
                <th style={{ width: "10%", textAlign: "center" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="7" className="text-center py-4 text-danger">{error}</td>
                </tr>
              ) : filteredRoles.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-body-secondary">
                    Không tìm thấy vai trò nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredRoles.map((role, index) => {
                  const isSystem = systemSlugs.includes(role.slug);
                  const permissionCount = role.permissions.includes("*") ? "Toàn bộ (*)" : `${role.permissions.length} quyền`;

                  return (
                    <tr key={role.id}>
                      <td className="fw-semibold text-slate-500">{index + 1}</td>
                      <td>
                        <div className="d-flex flex-column gap-1">
                          <span className="fw-bold text-slate-800 flex align-items-center gap-1.5">
                            {role.name}
                            {isSystem && (
                              <i className="fa fa-shield-alt text-primary text-[10px]" title="Vai trò hệ thống"></i>
                            )}
                          </span>
                          <span className={`badge ${role.color || "bg-secondary"} align-self-start px-2 py-0.5 text-[10px] font-mono uppercase`}>
                            {role.slug}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="text-slate-600 text-xs leading-relaxed" style={{ maxWidth: "350px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "normal" }}>
                          {role.description || "—"}
                        </div>
                      </td>
                      <td>
                        {role.isHidden ? (
                          <span className="badge bg-danger-subtle text-danger px-2.5 py-1 rounded text-[10px] font-semibold">
                            Đang ẩn
                          </span>
                        ) : (
                          <span className="badge bg-success-subtle text-success px-2.5 py-1 rounded text-[10px] font-semibold">
                            Hiển thị
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="text-slate-600 font-medium text-xs">
                          <i className="fa fa-users me-1.5 text-slate-400"></i>
                          {role.userCount} tài khoản
                        </span>
                      </td>
                      <td>
                        <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-xs">
                          {permissionCount}
                        </span>
                      </td>
                      <td className="text-center">
                        <div className="flex gap-1.5 justify-center">
                          <button
                            type="button"
                            className="p-1.5 text-slate-500 hover:text-cyan-900 hover:bg-cyan-50/50 rounded-lg transition-all border border-transparent"
                            onClick={() => handleOpenEditModal(role)}
                          disabled={actionLoading}
                            title="Cấu hình vai trò"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            className={`p-1.5 rounded-lg transition-all border border-transparent ${
                              role.isHidden 
                                ? "text-slate-400 hover:text-green-600 hover:bg-green-55/50" 
                                : "text-slate-400 hover:text-red-650 hover:bg-red-55/50"
                            } disabled:opacity-30 disabled:hover:bg-transparent`}
                            disabled={isSystem || actionLoading}
                            onClick={() => handleToggleVisibility(role)}
                            title={isSystem ? "Không được phép ẩn vai trò hệ thống" : (role.isHidden ? "Hiển thị vai trò" : "Ẩn vai trò")}
                          >
                            {role.isHidden ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL: CREATE / EDIT ROLE --- */}
      {isModalOpen && (
        <div className="custom-modal-overlay">
          <div className="custom-modal-content modal-role-wide animate-slide-up" style={{ maxWidth: "850px", maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div className="custom-modal-header bg-slate-50 border-b border-slate-100">
              <div>
                <h5 className="m-0 font-bold text-slate-800 text-base">
                  {modalMode === "create" ? "Thêm vai trò hệ thống mới" : `Cấu hình vai trò: ${roleName}`}
                </h5>
                <p className="text-slate-400 text-xs m-0 mt-0.5">Thiết lập các thông số định danh và phân quyền chi tiết.</p>
              </div>
              <button className="btn-close-modal text-slate-400 hover:text-slate-600 bg-slate-200/50" onClick={() => setIsModalOpen(false)}>
                <i className="fa fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 min-h-0 overflow-y-auto d-flex flex-column">
              <div className="custom-modal-body p-4 flex-1">
                {/* Form Row: Name & Slug */}
                <div className="row g-3 mb-3.5">
                  <div className="col-12 col-md-5">
                    <label className="form-label text-slate-500 font-bold text-xs uppercase mb-1.5">Tên vai trò <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ví dụ: Kế toán"
                      value={roleName}
                      onChange={(e) => setRoleName(e.target.value)}
                      required
                      maxLength={100}
                      disabled={actionLoading}
                    />
                  </div>
                  <div className="col-12 col-md-4">
                    <label className="form-label text-slate-500 font-bold text-xs uppercase mb-1.5">Mã định danh (Slug) <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control font-mono"
                      placeholder="Ví dụ: ketoan"
                      value={roleSlug}
                      onChange={(e) => setRoleSlug(e.target.value)}
                      disabled={modalMode === "edit" || actionLoading}
                      required
                      maxLength={50}
                    />
                  </div>
                  <div className="col-12 col-md-3">
                    <label className="form-label text-slate-500 font-bold text-xs uppercase mb-1.5">Nhãn màu sắc</label>
                    <select
                      className="form-select text-xs font-semibold"
                      value={roleColor}
                      onChange={(e) => setRoleColor(e.target.value)}
                    >
                      <option value="bg-danger text-white">Đỏ (Danger)</option>
                      <option value="bg-primary text-white">Xanh dương (Primary)</option>
                      <option value="bg-success text-white">Xanh lá (Success)</option>
                      <option value="bg-warning text-dark">Vàng (Warning)</option>
                      <option value="bg-info text-dark">Xanh ngọc (Info)</option>
                      <option value="bg-secondary text-white">Xám (Secondary)</option>
                      <option value="bg-dark text-white">Đen (Dark)</option>
                      <option value="bg-light text-dark border">Trắng (Light)</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-4">
                  <label className="form-label text-slate-500 font-bold text-xs uppercase mb-1.5">Mô tả vai trò</label>
                  <textarea
                    rows="2"
                    className="form-control"
                    placeholder="Ghi chú về trách nhiệm và đối tượng sử dụng vai trò này..."
                    value={roleDescription}
                    onChange={(e) => setRoleDescription(e.target.value)}
                    maxLength={500}
                    disabled={actionLoading}
                  />
                </div>

                {/* Permissions Management */}
                <div className="border-t border-slate-100 pt-3">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <label className="form-label text-slate-700 font-bold text-sm m-0">Phân quyền chức năng</label>
                    
                    {/* Admin Wildcard Shortcut */}
                    <label className="d-flex align-items-center gap-1.5 cursor-pointer text-xs font-semibold bg-danger-subtle/50 text-danger border border-danger-subtle px-2.5 py-1 rounded-lg">
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes("*")}
                        disabled={selectedRole?.slug === "admin"}
                        onChange={() => handleTogglePermission("*")}
                      />
                      <span>Tất cả quyền hạn (*)</span>
                    </label>
                  </div>

                  {selectedPermissions.includes("*") ? (
                    <div className="alert alert-warning py-3 text-center text-xs">
                      <i className="fa fa-info-circle me-1"></i> Vai trò này đang được gán quyền <strong>Wildcard (*)</strong>, đồng nghĩa với việc có toàn bộ mọi quyền hạn trong hệ thống HTO.
                    </div>
                  ) : (
                    <div className="permissions-tree-wrapper">
                      {FEATURE_PERMISSION_GROUPS.map((group) => {
                        const groupIds = group.permissions.map((p) => p.id);
                        const checkedInGroup = groupIds.filter((id) => selectedPermissions.includes(id));
                        const isAllChecked = checkedInGroup.length === groupIds.length;
                        const isPartialChecked = checkedInGroup.length > 0 && !isAllChecked;

                        return (
                          <div className="permission-module-section mb-3.5 border border-slate-150 rounded-xl bg-slate-50/30 overflow-hidden" key={group.id}>
                            <div className="permission-module-header px-3.5 py-2.5 bg-slate-50 border-b border-slate-150 d-flex justify-content-between align-items-center">
                              <span className="font-semibold text-slate-800 text-xs flex align-items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-cyan-900 rounded-circle"></span> {group.title}
                              </span>
                              <button
                                type="button"
                                className="btn btn-xs btn-link text-slate-500 font-semibold text-[11px] p-0"
                                onClick={() => handleSelectAllInGroup(group.permissions, isAllChecked)}
                              >
                                {isAllChecked ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                              </button>
                            </div>
                            <div className="permission-module-body p-3.5 bg-white grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {group.permissions.map((perm) => {
                                const isChecked = selectedPermissions.includes(perm.id);

                                return (
                                  <label className={`permission-item-label d-flex align-items-start gap-2.5 p-2 border rounded-xl cursor-pointer transition-all ${
                                    isChecked ? "border-cyan-900/30 bg-cyan-50/10 text-cyan-950 font-medium" : "border-slate-200 text-slate-650 hover:bg-slate-50/50"
                                  }`} key={perm.id} style={{ fontSize: "12.5px" }}>
                                    <input
                                      type="checkbox"
                                      className="mt-0.5"
                                      checked={isChecked}
                                      onChange={() => handleTogglePermission(perm.id)}
                                    />
                                    <span className="leading-tight">{perm.label}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="custom-modal-footer bg-slate-50 border-t border-slate-100 p-3">
                <button type="button" className="btn btn-light border px-4" onClick={() => setIsModalOpen(false)} disabled={actionLoading}>Hủy bỏ</button>
                <button type="submit" className="btn btn-primary px-4 d-flex align-items-center gap-1.5" disabled={actionLoading}>
                  {actionLoading && <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>}
                  <i className="fa fa-save"></i> {modalMode === "create" ? "Tạo vai trò" : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[9999] flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-lg transition-all duration-300 animate-slide-up ${
          toast.type === "success" 
            ? "border-emerald-200 bg-emerald-50 text-emerald-800" 
            : toast.type === "error"
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-amber-200 bg-amber-50 text-amber-805"
        }`}>
          {toast.type === "success" ? (
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : toast.type === "error" ? (
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )}
          <span className="text-xs font-semibold leading-none">{toast.message}</span>
        </div>
      )}
    </div>
  );
};
