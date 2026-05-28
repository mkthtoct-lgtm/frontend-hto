// src/UserList/UserList.jsx
import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import "./UserList.css";

// const API_BASE_URL =
//   import.meta.env.VITE_API_BASE_URL ||
//   (import.meta.env.PROD ? "/api/v1" : "http://qlnb-api.hto.edu.vn/api/v1");
const API_BASE_URL = "http://localhost:8080/api/v1";

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
const DASHBOARD_EDITORS_KEY = "hto_dashboard_editors";

const readDashboardEditors = () => {
  try {
    const value = localStorage.getItem(DASHBOARD_EDITORS_KEY);
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
};

const writeDashboardEditors = (editors) => {
  localStorage.setItem(DASHBOARD_EDITORS_KEY, JSON.stringify(editors));
};

const ROLE_ID_TO_KEY = Object.fromEntries(
  Object.entries(ROLE_MAP).map(([key, value]) => [value.roleId, key]),
);

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");

  return token ? { Authorization: `Bearer ${token}` } : {};
};

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

const getApiErrorMessage = (payload, fallback) => {
  const details = payload?.error?.details;

  if (Array.isArray(details) && details.length > 0) return details[0];
  if (payload?.message && payload.message !== "Bad Request") return payload.message;

  return fallback;
};

async function usersRequest(path = "", options = {}) {
  const response = await fetch(`${API_BASE_URL}/users${path}`, {
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

  // Dashboard editor permissions (admin-only feature)
  const [dashboardEditors, setDashboardEditors] = useState(() => readDashboardEditors());
  const isCurrentUserAdmin = currentUser?.role === "admin" || currentUser?.roleId === ADMIN_ROLE_ID;

  // States quản lý Modal (Create/Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // 'create' | 'edit'
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    mode: "onTouched"
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const payload = await usersRequest();
      setUsers(normalizeApiData(payload).map(normalizeUser));
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
    reset({ name: "", email: "", password: "", role: "", departmentId: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setModalMode("edit");
    setSelectedUser(user);
    // Fill data vào form
    reset({
      name: user.name,
      email: user.email,
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

  // Lấy danh sách phòng ban unique (dùng cho bộ lọc)
  const departments = Array.from(
    new Map(
      users
        .filter((user) => user.departmentId)
        .map((user) => [user.departmentId, user.department || user.departmentId]),
    ),
  );

  const toggleDashboardEditor = (userId) => {
    setDashboardEditors((prev) => {
      const next = prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId];
      writeDashboardEditors(next);
      return next;
    });
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
                <th style={{ width: "24%" }}>Vai trò & Quyền</th>
                <th style={{ width: "14%" }}>Phòng ban</th>
                <th style={{ width: "14%" }}>Trạng thái</th>
                {isCurrentUserAdmin && <th style={{ width: "10%" }}>Quyền dashboard</th>}
                <th style={{ width: "9%", textAlign: "center" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={isCurrentUserAdmin ? 7 : 6} className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={isCurrentUserAdmin ? 7 : 6} className="text-center py-4 text-danger">{error}</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={isCurrentUserAdmin ? 7 : 6} className="text-center py-5 text-body-secondary">
                    Không tìm thấy tài khoản nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, index) => {
                  const roleData = ROLE_MAP[user.role] || { label: user.role, color: "bg-secondary", link: "#" };
                  const isDashboardEditor = dashboardEditors.includes(user.id);
                  
                  return (
                    <tr key={user.id}>
                      <td>{index + 1}</td>
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
                          <a 
                            href={roleData.link} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-primary text-decoration-none" 
                            style={{ fontSize: "12px" }}
                            title="Xem chi tiết chức năng của quyền này"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-1">
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                              <polyline points="15 3 21 3 21 9"></polyline>
                              <line x1="10" y1="14" x2="21" y2="3"></line>
                            </svg>
                            Xem chức năng
                          </a>
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
                      {isCurrentUserAdmin && (
                        <td className="text-center">
                          <button
                            type="button"
                            className={`btn btn-sm ${isDashboardEditor ? "btn-success" : "btn-light border"}`}
                            onClick={() => toggleDashboardEditor(user.id)}
                            disabled={actionLoading}
                          >
                            {isDashboardEditor ? "Được sửa" : "Chỉ xem"}
                          </button>
                        </td>
                      )}
                      <td className="text-center">
                        <div className="d-inline-flex align-items-center justify-content-center gap-2" style={{ minWidth: "76px" }}>
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
        <div className="card-footer bg-transparent border-top py-3">
          <span className="text-body-secondary" style={{ fontSize: "13px" }}>Hiển thị {filteredUsers.length} tài khoản</span>
        </div>
      </div>

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
