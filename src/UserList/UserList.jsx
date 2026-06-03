// src/UserList/UserList.jsx
import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { authFetch, getAuthHeaders } from "../auth/session";
import { API_BASE_URL } from "../config/api";
import "./UserList.css";

// --- CẤU HÌNH DANH SÁCH ROLE VÀ LINK CHỨC NĂNG TƯƠNG ỨNG ---
// BẠN HÃY THAY THẾ CÁC LINK TRONG BIẾN NÀY BẰNG LINK TỪ FILE EXCEL CỦA BẠN
const ROLE_MAP = {
  admin: { label: "Admin", color: "bg-danger", link: "/role-links/admin", roleId: "69fc5af582ef85451120772a" },
  bangiamdoc: { label: "Ban giám đốc", color: "bg-primary", link: "/role-links/ban-giam-doc", roleId: "69fc5af582ef85451120772b" },
  truongbophan: { label: "Trưởng bộ phận", color: "bg-warning text-dark", link: "/role-links/truong-bo-phan", roleId: "69fc5af582ef85451120772c" },
  nhansu: { label: "Nhân sự", color: "bg-info text-dark", link: "/role-links/nhan-su", roleId: "69fc5af582ef85451120772d" },
  daily: { label: "Đại lý", color: "bg-success", link: "/role-links/dai-ly", roleId: "69fc5af582ef85451120772e" },
  congtacvien: { label: "Cộng tác viên", color: "bg-secondary", link: "/role-links/cong-tac-vien", roleId: "69fc5af682ef85451120772f" },
  hethong: { label: "Hệ thống", color: "bg-dark", link: "/role-links/he-thong", roleId: "69fc5af782ef854511207730" }
};

const ADMIN_ROLE_ID = "69fc5af582ef85451120772a";
const USER_FEATURE_PERMISSIONS_KEY = "hto_user_feature_permissions";
const USER_PAGE_SIZE = 12;

const FEATURE_PERMISSION_GROUPS = [
  {
    id: "dashboard",
    title: "Dashboard",
    permissions: [
      { id: "dashboard:view", label: "Xem dashboard" },
      { id: "dashboard:edit", label: "Chỉnh sửa dashboard" },
      { id: "dashboard:export", label: "Xuất báo cáo" },
    ],
  },
  {
    id: "documents",
    title: "Tài liệu",
    permissions: [
      { id: "documents:view", label: "Xem tài liệu" },
      { id: "documents:upload", label: "Upload tài liệu" },
      { id: "documents:edit", label: "Sửa tài liệu" },
      { id: "documents:delete", label: "Xóa tài liệu" },
    ],
  },
  {
    id: "notifications",
    title: "Thông báo",
    permissions: [
      { id: "notifications:view", label: "Xem thông báo" },
      { id: "notifications:create", label: "Tạo thông báo" },
    ],
  },
  {
    id: "users",
    title: "Tài khoản",
    permissions: [
      { id: "users:view", label: "Xem tài khoản" },
      { id: "users:edit", label: "Sửa tài khoản" },
      { id: "users:lock", label: "Khóa/mở khóa" },
    ],
  },
];

const DEFAULT_FEATURE_PERMISSIONS_BY_ROLE = {
  admin: FEATURE_PERMISSION_GROUPS.flatMap((group) => group.permissions.map((permission) => permission.id)),
  bangiamdoc: ["dashboard:view", "dashboard:export", "documents:view", "notifications:view", "notifications:create", "users:view"],
  truongbophan: ["dashboard:view", "documents:view", "documents:upload", "notifications:view", "notifications:create"],
  nhansu: ["dashboard:view", "documents:view", "documents:upload", "notifications:view", "users:view"],
  daily: ["dashboard:view", "documents:view", "notifications:view"],
  congtacvien: ["documents:view", "notifications:view"],
  hethong: ["dashboard:view", "documents:view", "notifications:view"],
};

const readUserFeaturePermissions = () => {
  try {
    const value = localStorage.getItem(USER_FEATURE_PERMISSIONS_KEY);
    return value ? JSON.parse(value) : {};
  } catch {
    return {};
  }
};

const writeUserFeaturePermissions = (permissionsByUserId) => {
  localStorage.setItem(USER_FEATURE_PERMISSIONS_KEY, JSON.stringify(permissionsByUserId));
};

const getDefaultFeaturePermissions = (role) => DEFAULT_FEATURE_PERMISSIONS_BY_ROLE[role] || [];

const ROLE_ID_TO_KEY = Object.fromEntries(
  Object.entries(ROLE_MAP).map(([key, value]) => [value.roleId, key]),
);

const normalizeUser = (user) => {
  const role = user.role || ROLE_ID_TO_KEY[user.roleId] || "hethong";
  const department =
    user.department?.name ||
    user.departmentName ||
    user.department ||
    user.departmentId ||
    "";

  return {
    id: user.id || user._id,
    name: user.name || user.fullName || "",
    email: user.email || "",
    phone: user.phone || "",
    address: user.address || user.profile?.address || "",
    socialLink: user.socialLink || user.socialUrl || user.profile?.socialLink || "",
    referralCode: user.referralCode || user.referral_code || user.profile?.referralCode || "",
    role,
    roleId: user.roleId || ROLE_MAP[role]?.roleId || "",
    department,
    departmentId: user.departmentId || "",
    status: user.status || "active",
  };
};

const normalizeApiData = (payload) => {
  const data = payload?.data ?? payload;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.users)) return data.users;

  return [];
};

const normalizeUsersPayload = (payload) => {
  const data = payload?.data ?? payload;
  const users = normalizeApiData(payload);
  const total = Number(data?.total ?? users.length) || users.length;
  const pages = Number(data?.pages ?? data?.totalPages ?? 1) || 1;

  return { users, total, pages };
};

const getApiErrorMessage = (payload, fallback) => {
  const details = payload?.error?.details;

  if (Array.isArray(details) && details.length > 0) return details[0];
  if (payload?.message && payload.message !== "Bad Request") return payload.message;

  return fallback;
};

async function usersRequest(path = "", options = {}) {
  const response = await authFetch(`${API_BASE_URL}/users${path}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(getApiErrorMessage(payload, "Không thể xử lý tài khoản."));
  }

  return payload;
}

export const UserList = ({ currentUser }) => {
  // States quản lý Data
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // States quản lý Filter & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [featurePermissionsByUserId, setFeaturePermissionsByUserId] = useState(() => readUserFeaturePermissions());
  const isCurrentUserAdmin = currentUser?.role === "admin" || currentUser?.roleId === ADMIN_ROLE_ID;

  // States quản lý Modal (Create/Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // 'create' | 'edit'
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailUser, setDetailUser] = useState(null);
  const [permissionUser, setPermissionUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    mode: "onTouched"
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const firstPayload = await usersRequest("?page=1");
      const firstPage = normalizeUsersPayload(firstPayload);
      let allUsers = firstPage.users;

      if (firstPage.pages > 1 && firstPage.total > firstPage.users.length) {
        const nextPages = await Promise.all(
          Array.from({ length: firstPage.pages - 1 }, (_, index) =>
            usersRequest(`?page=${index + 2}`),
          ),
        );

        allUsers = [
          ...allUsers,
          ...nextPages.flatMap((payload) => normalizeUsersPayload(payload).users),
        ];
      }

      setUsers(allUsers.map(normalizeUser));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => fetchUsers());
  }, [fetchUsers]);

  // 3. Xử lý mở đóng Modal
  const openCreateModal = () => {
    setModalMode("create");
    setSelectedUser(null);
    reset({ name: "", email: "", password: "", role: "", departmentId: "", phone: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setModalMode("edit");
    setSelectedUser(user);
    // Fill data vào form
    reset({
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      departmentId: user.departmentId,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    reset(); // Reset form
  };

  // 4. Xử lý Submit Form (Create / Update)
  const onSubmit = async (data) => {
    setActionLoading(true);
    try {
      const input = {
        fullName: data.name.trim(),
        email: data.email.trim(),
        phone: data.phone?.trim() || undefined,
        roleId: ROLE_MAP[data.role]?.roleId,
        departmentId: data.departmentId?.trim() || undefined,
      };

      if (modalMode === "create") {
        const payload = await usersRequest("", {
          method: "POST",
          body: {
            ...input,
            password: data.password,
            status: "active",
          },
        });
        const createdUser = normalizeUser(payload?.data ?? payload);
        setUsers(prev => [createdUser, ...prev]);
      } else {
        const payload = await usersRequest(`/${selectedUser.id}`, {
          method: "PATCH",
          body: input,
        });
        const updatedUser = normalizeUser(payload?.data ?? payload);
        setUsers(prev => prev.map(u => u.id === selectedUser.id ? updatedUser : u));
        setDetailUser((current) => current?.id === selectedUser.id ? updatedUser : current);
      }

      closeModal();
    } catch (err) {
      alert("Lỗi: " + (err instanceof Error ? err.message : "Thao tác thất bại"));
    } finally {
      setActionLoading(false);
    }
  };

  // 5. Xử lý Lock / Unlock tài khoản
  const toggleUserStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === "active" ? "suspended" : "active";
    const confirmMsg = currentStatus === "active" ? "Bạn có chắc muốn KHÓA tài khoản này?" : "Bạn có chắc muốn MỞ KHÓA tài khoản này?";
    
    if (!window.confirm(confirmMsg)) return;

    setActionLoading(true);
    try {
      const payload = await usersRequest(`/${userId}/status`, {
        method: "PATCH",
        body: { status: newStatus },
      });
      const updatedUser = normalizeUser(payload?.data ?? payload);
      setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
    } catch (err) {
      alert("Lỗi: " + (err instanceof Error ? err.message : "Cập nhật trạng thái thất bại"));
    } finally {
      setActionLoading(false);
    }
  };

  // 6. Lọc dữ liệu hiển thị (Derived State)
  const filteredUsers = users.filter(user => {
    const matchSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = filterRole ? user.role === filterRole : true;
    const matchDept = filterDepartment ? user.departmentId === filterDepartment : true;
    return matchSearch && matchRole && matchDept;
  });
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / USER_PAGE_SIZE));
  const pageStartIndex = (currentPage - 1) * USER_PAGE_SIZE;
  const paginatedUsers = filteredUsers.slice(pageStartIndex, pageStartIndex + USER_PAGE_SIZE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterRole, filterDepartment]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Lấy danh sách phòng ban unique (dùng cho bộ lọc)
  const departments = Array.from(
    new Map(
      users
        .filter((user) => user.departmentId)
        .map((user) => [user.departmentId, user.department || user.departmentId]),
    ),
  );

  const getUserFeaturePermissions = (user) => {
    const customPermissions = featurePermissionsByUserId[user.id];
    return Array.isArray(customPermissions) ? customPermissions : getDefaultFeaturePermissions(user.role);
  };

  const getFeaturePermissionCount = (user) => getUserFeaturePermissions(user).length;

  const openPermissionModal = (user) => {
    setPermissionUser(user);
  };

  const closePermissionModal = () => {
    setPermissionUser(null);
  };

  const toggleFeaturePermission = (userId, permissionId) => {
    if (!isCurrentUserAdmin) return;

    const user = users.find((item) => item.id === userId) || permissionUser;
    const currentPermissions = getUserFeaturePermissions(user);
    const nextPermissions = currentPermissions.includes(permissionId)
      ? currentPermissions.filter((item) => item !== permissionId)
      : [...currentPermissions, permissionId];

    setFeaturePermissionsByUserId((current) => {
      const next = {
        ...current,
        [userId]: nextPermissions,
      };
      writeUserFeaturePermissions(next);
      return next;
    });
  };

  const openUserDetail = async (user) => {
    setDetailUser(user);

    try {
      const payload = await usersRequest(`/${user.id}`);
      setDetailUser(normalizeUser(payload?.data ?? payload));
    } catch {
      setDetailUser(user);
    }
  };

  const closeUserDetail = () => {
    setDetailUser(null);
  };

  if (!["admin", "bangiamdoc"].includes(currentUser?.role)) {
    return (
      <div className="container-fluid pt-5 text-center">
        <h2 className="text-danger">Từ chối truy cập</h2>
        <p className="text-body-secondary">Bạn không có quyền truy cập trang Quản lý tài khoản.</p>
      </div>
    );
  }

  return (
    <div className="user-list-wrapper container-fluid pt-3 pb-4" style={{ maxWidth: "1600px" }}>
      {/* Header & Title */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold text-body-emphasis mb-1">Quản lý tài khoản</h4>
          <span className="text-body-secondary" style={{ fontSize: "14px" }}>Quản lý phân quyền và nhân sự hệ thống</span>
        </div>
        <button className="btn btn-primary d-flex align-items-center gap-2" onClick={openCreateModal}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Thêm tài khoản
        </button>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="search-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input 
            type="text" 
            className="form-control form-control-sm bg-body border-1" 
            placeholder="Tìm theo tên hoặc email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <select 
          className="form-select form-select-sm bg-body filter-select"
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
        >
          <option value="">Tất cả vai trò</option>
          {Object.entries(ROLE_MAP).map(([key, data]) => (
            <option key={key} value={key}>{data.label}</option>
          ))}
        </select>

        <select 
          className="form-select form-select-sm bg-body filter-select"
          value={filterDepartment}
          onChange={(e) => setFilterDepartment(e.target.value)}
        >
          <option value="">Tất cả phòng ban</option>
          {departments.map(([departmentId, departmentName]) => (
            <option key={departmentId} value={departmentId}>{departmentName}</option>
          ))}
        </select>
      </div>

      {/* Main Table Card */}
      <div className="card table-card">
        <div className="table-responsive">
          <table className="table custom-table">
            <thead>
              <tr>
                <th style={{ width: "5%" }}>#</th>
                <th style={{ width: "24%" }}>Thông tin nhân viên</th>
                <th style={{ width: "20%" }}>Vai trò</th>
                <th style={{ width: "14%" }}>Phòng ban</th>
                <th style={{ width: "14%" }}>Trạng thái</th>
                <th style={{ width: "14%" }}>Quyền chức năng</th>
                <th style={{ width: "9%", textAlign: "center" }}>Thao tác</th>
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
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-body-secondary">
                    Không tìm thấy tài khoản nào phù hợp.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user, index) => {
                  const roleData = ROLE_MAP[user.role] || { label: user.role, color: "bg-secondary", link: "#" };
                  const featurePermissionCount = getFeaturePermissionCount(user);
                  
                  return (
                    <tr key={user.id} className="cursor-pointer" onClick={() => openUserDetail(user)}>
                      <td>{pageStartIndex + index + 1}</td>
                      <td>
                        <div className="d-flex flex-column">
                          <span className="fw-bold text-body-emphasis">{user.name}</span>
                          <span className="text-body-secondary" style={{ fontSize: "12px" }}>{user.email}</span>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <span className={`badge ${roleData.color}`}>
                            {roleData.label}
                          </span>
                        </div>
                      </td>
                      <td>{user.department || '—'}</td>
                      <td>
                        <span className={`status-badge ${user.status === 'active' ? 'status-active' : 'status-locked'}`}>
                          {user.status === 'active' ? (
                            <><span className="spinner-grow spinner-grow-sm bg-success" style={{width: '6px', height: '6px'}}></span> Hoạt động</>
                          ) : (
                            <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg> {user.status === "inactive" ? "Ngừng hoạt động" : "Đã khóa"}</>
                          )}
                        </span>
                      </td>
                      <td className="text-center" onClick={(event) => event.stopPropagation()}>
                        <button
                          type="button"
                          className={`btn btn-sm ${featurePermissionCount > 0 ? "btn-outline-primary" : "btn-light border"}`}
                          onClick={() => openPermissionModal(user)}
                          disabled={actionLoading}
                          title={isCurrentUserAdmin ? "Xem và phân quyền chức năng" : "Xem quyền chức năng"}
                        >
                          {featurePermissionCount} quyền
                        </button>
                      </td>
                      <td className="text-center">
                        <div className="d-inline-flex align-items-center justify-content-center gap-2" style={{ minWidth: "76px" }} onClick={(event) => event.stopPropagation()}>
                        <button
                          className="action-btn btn-view"
                          title="Xem chi tiết"
                          onClick={() => openUserDetail(user)}
                          disabled={actionLoading}
                        >
                          <EyeIcon />
                        </button>
                        <button 
                          className="action-btn btn-edit" 
                          title="Chỉnh sửa"
                          onClick={() => openEditModal(user)}
                          disabled={actionLoading}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        
                        <button 
                          className={`action-btn ${user.status === 'active' ? 'btn-lock' : 'btn-unlock'}`}
                          title={
                            currentUser?.email === user.email
                              ? "Không thể tự khóa tài khoản đang đăng nhập"
                              : user.status === 'active'
                                ? 'Khóa tài khoản'
                                : 'Mở khóa tài khoản'
                          }
                          onClick={() => toggleUserStatus(user.id, user.status)}
                          disabled={actionLoading || currentUser?.email === user.email}
                        >
                          {user.status === 'active' ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                          ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>
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
        <div className="card-footer bg-transparent border-top py-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
          <span className="text-body-secondary" style={{ fontSize: "13px" }}>
            {filteredUsers.length === 0
              ? "Hiển thị 0 tài khoản"
              : `Hiển thị ${pageStartIndex + 1}-${Math.min(pageStartIndex + paginatedUsers.length, filteredUsers.length)} / ${filteredUsers.length} tài khoản`}
          </span>
          {totalPages > 1 && (
            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              >
                Trước
              </button>
              <span className="text-body-secondary" style={{ fontSize: "13px" }}>
                Trang {currentPage}/{totalPages}
              </span>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              >
                Sau
              </button>
            </div>
          )}
        </div>
      </div>

      {detailUser && (
        <div className="custom-modal-overlay">
          <div className="custom-modal-content">
            <div className="custom-modal-header">
              <h5>Chi tiết tài khoản</h5>
              <button className="btn-close-modal" onClick={closeUserDetail}>
                <CloseIcon />
              </button>
            </div>
            <div className="custom-modal-body">
              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="user-detail-avatar">
                  {detailUser.name
                    .split(" ")
                    .filter(Boolean)
                    .slice(-2)
                    .map((part) => part[0])
                    .join("")
                    .toUpperCase() || "U"}
                </div>
                <div className="min-w-0">
                  <h5 className="mb-1 text-body-emphasis">{detailUser.name || "Chưa cập nhật tên"}</h5>
                  <div className="text-body-secondary text-break">{detailUser.email || "Chưa cập nhật email"}</div>
                </div>
              </div>

              <div className="user-detail-grid">
                <DetailItem label="Tên" value={detailUser.name} />
                <DetailItem label="Email" value={detailUser.email} />
                <DetailItem label="Số điện thoại" value={detailUser.phone} />
                <DetailItem label="Địa chỉ" value={detailUser.address} />
                <DetailItem label="Link mạng xã hội" value={detailUser.socialLink} isLink />
                <DetailItem label="Mã giới thiệu" value={detailUser.referralCode} />
                <DetailItem label="Vai trò" value={ROLE_MAP[detailUser.role]?.label || detailUser.role} />
                <DetailItem label="Phòng ban" value={detailUser.department} />
                <DetailItem label="Trạng thái" value={detailUser.status === "active" ? "Hoạt động" : "Đã khóa/Ngừng hoạt động"} />
              </div>
            </div>
            <div className="custom-modal-footer">
              <button type="button" className="btn btn-light border" onClick={closeUserDetail}>Đóng</button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  closeUserDetail();
                  openEditModal(detailUser);
                }}
                disabled={!isCurrentUserAdmin}
              >
                Chỉnh sửa
              </button>
            </div>
          </div>
        </div>
      )}

      {permissionUser && (
        <div className="custom-modal-overlay">
          <div className="custom-modal-content modal-role-wide">
            <div className="custom-modal-header">
              <div>
                <h5>Quyền chức năng</h5>
                <div className="text-body-secondary" style={{ fontSize: "13px" }}>
                  {permissionUser.name} · {ROLE_MAP[permissionUser.role]?.label || permissionUser.role}
                </div>
              </div>
              <button className="btn-close-modal" onClick={closePermissionModal}>
                <CloseIcon />
              </button>
            </div>
            <div className="custom-modal-body">
              {!isCurrentUserAdmin && (
                <div className="alert alert-info py-2" style={{ fontSize: "13px" }}>
                  Bạn chỉ có thể xem quyền chức năng. Chỉ Admin mới được phân thêm hoặc thu hồi quyền.
                </div>
              )}
              <div className="permissions-container">
                {FEATURE_PERMISSION_GROUPS.map((group) => (
                  <div className="module-group" key={group.id}>
                    <div className="module-header">
                      <h6 className="module-title">{group.title}</h6>
                    </div>
                    <div className="permissions-grid">
                      {group.permissions.map((permission) => {
                        const checked = getUserFeaturePermissions(permissionUser).includes(permission.id);

                        return (
                          <label className="permission-checkbox" key={permission.id}>
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={!isCurrentUserAdmin}
                              onChange={() => toggleFeaturePermission(permissionUser.id, permission.id)}
                            />
                            <span>{permission.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="custom-modal-footer">
              <button type="button" className="btn btn-primary" onClick={closePermissionModal}>Xong</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL CREATE / EDIT --- */}
      {isModalOpen && (
        <div className="custom-modal-overlay">
          <div className="custom-modal-content">
            <div className="custom-modal-header">
              <h5>{modalMode === "create" ? "Thêm tài khoản mới" : "Cập nhật thông tin"}</h5>
              <button className="btn-close-modal" onClick={closeModal}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="custom-modal-body">
                <div className="mb-3">
                  <label className="form-label" style={{ fontSize: "14px", fontWeight: "600" }}>Họ và tên <span className="text-danger">*</span></label>
                  <input 
                    type="text" 
                    className={`form-control ${errors.name ? 'is-invalid' : ''}`} 
                    placeholder="Nhập họ và tên..."
                    disabled={actionLoading}
                    {...register("name", { required: "Vui lòng nhập họ tên" })}
                  />
                  {errors.name && <div className="invalid-feedback">{errors.name.message}</div>}
                </div>

                <div className="mb-3">
                  <label className="form-label" style={{ fontSize: "14px", fontWeight: "600" }}>Email <span className="text-danger">*</span></label>
                  <input 
                    type="email" 
                    className={`form-control ${errors.email ? 'is-invalid' : ''}`} 
                    placeholder="name@hto.vn"
                    disabled={actionLoading || modalMode === "edit"} // Khóa email khi Edit (Tùy logic nghiệp vụ)
                    {...register("email", { 
                      required: "Vui lòng nhập email",
                      pattern: { value: /\S+@\S+\.\S+/, message: "Email không hợp lệ" }
                    })}
                  />
                  {errors.email && <div className="invalid-feedback">{errors.email.message}</div>}
                  {modalMode === "edit" && <small className="text-body-secondary mt-1 d-block">Email dùng để đăng nhập nên không thể thay đổi.</small>}
                </div>

                {modalMode === "create" && (
                  <div className="mb-3">
                    <label className="form-label" style={{ fontSize: "14px", fontWeight: "600" }}>Mật khẩu <span className="text-danger">*</span></label>
                    <input 
                      type="password" 
                      className={`form-control ${errors.password ? 'is-invalid' : ''}`} 
                      placeholder="Ít nhất 8 ký tự"
                      disabled={actionLoading}
                      {...register("password", {
                        required: "Vui lòng nhập mật khẩu",
                        minLength: { value: 8, message: "Mật khẩu phải có ít nhất 8 ký tự" },
                      })}
                    />
                    {errors.password && <div className="invalid-feedback">{errors.password.message}</div>}
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label" style={{ fontSize: "14px", fontWeight: "600" }}>Số điện thoại</label>
                  <input
                    type="tel"
                    className="form-control"
                    placeholder="Ví dụ: 0901234567"
                    disabled={actionLoading}
                    {...register("phone")}
                  />
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label" style={{ fontSize: "14px", fontWeight: "600" }}>Vai trò <span className="text-danger">*</span></label>
                    <select 
                      className={`form-select ${errors.role ? 'is-invalid' : ''}`}
                      disabled={actionLoading}
                      {...register("role", { required: "Vui lòng chọn vai trò" })}
                    >
                      <option value="">-- Chọn vai trò --</option>
                      {Object.entries(ROLE_MAP).map(([key, data]) => (
                        <option key={key} value={key}>{data.label}</option>
                      ))}
                    </select>
                    {errors.role && <div className="invalid-feedback">{errors.role.message}</div>}
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label" style={{ fontSize: "14px", fontWeight: "600" }}>ID phòng ban</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Nhập departmentId nếu có"
                      disabled={actionLoading}
                      {...register("departmentId")}
                    />
                  </div>
                </div>

                {modalMode === "create" && (
                  <div className="alert alert-info py-2" style={{ fontSize: "13px" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="me-2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                    Tài khoản sẽ được tạo trực tiếp qua API người dùng.
                  </div>
                )}
              </div>

              <div className="custom-modal-footer">
                <button type="button" className="btn btn-light border" onClick={closeModal} disabled={actionLoading}>Hủy</button>
                <button type="submit" className="btn btn-primary d-flex align-items-center gap-2" disabled={actionLoading}>
                  {actionLoading && <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>}
                  {modalMode === "create" ? "Tạo tài khoản" : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

function DetailItem({ isLink = false, label, value }) {
  const displayValue = value || "Chưa cập nhật";

  return (
    <div className="user-detail-item">
      <div className="user-detail-label">{label}</div>
      {isLink && value ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="user-detail-value text-primary">
          {value}
        </a>
      ) : (
        <div className="user-detail-value">{displayValue}</div>
      )}
    </div>
  );
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}
