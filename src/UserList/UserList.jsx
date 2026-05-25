// src/UserList/UserList.jsx
import { useState, useEffect, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import "./UserList.css";

// =========================================================================
// --- KHU VỰC 1: CẤU HÌNH API VÀ GIAO DIỆN BADGE ---
// =========================================================================

const API_BASE_URL = "http://localhost:3000/api/v1";

// Cấu hình giao diện màu sắc Badge theo tên Role (name) thực tế từ Database
const ROLE_UI_MAP = {
  "admin": { color: "bg-danger" },
  "ban giám đốc": { color: "bg-primary" },
  "trưởng bộ phận": { color: "bg-warning text-dark" },
  "nhân sự": { color: "bg-info text-dark" },
  "chuyên viên nhân sự": { color: "bg-info text-dark" },
  "đại lý": { color: "bg-success" },
  "cộng tác viên": { color: "bg-secondary" },
  "hệ thống": { color: "bg-dark" }
};

const PERMISSION_MODULES = [
  {
    id: "dashboard",
    name: "Dashboard & Báo cáo tổng hợp",
    actions: [
      { id: "view_dashboard", name: "Xem Dashboard" },
      { id: "export_report", name: "Xuất báo cáo doanh nghiệp" }
    ]
  },
  {
    id: "users",
    name: "Hệ thống quản lý tài khoản nhân viên",
    actions: [
      { id: "view_users", name: "Xem danh sách tài khoản" },
      { id: "create_users", name: "Tạo mới tài khoản" },
      { id: "edit_users", name: "Chỉnh sửa thông tin" },
      { id: "lock_users", name: "Khóa / Mở khóa tài khoản" }
    ]
  },
  {
    id: "roles",
    name: "Phân quyền và Quản lý vai trò",
    actions: [
      { id: "view_roles", name: "Xem danh sách vai trò" },
      { id: "create_roles", name: "Thêm vai trò hệ thống" },
      { id: "edit_roles", name: "Sửa cấu hình quyền" },
      { id: "delete_roles", name: "Xóa cấu hình vai trò" }
    ]
  },
  {
    id: "products",
    name: "Quản lý danh mục Sản phẩm & Nghiệp vụ",
    actions: [
      { id: "view_products", name: "Xem danh mục sản phẩm" },
      { id: "create_products", name: "Thêm mới sản phẩm" },
      { id: "edit_products", name: "Cập nhật sản phẩm" },
      { id: "delete_products", name: "Xóa bỏ sản phẩm" }
    ]
  }
];

// =========================================================================
// --- KHU VỰC 2: TỪ ĐIỂN TRA CỨU MA TRẬN PHÂN QUYỀN (DICTIONARY MODAL) ---
// =========================================================================
const PermissionDictionaryModal = ({ isOpen, onClose, roles, permissions }) => {
  if (!isOpen) return null;

  const getPermissionDesc = (permId) => {
    const perm = permissions.find(p => p._id === permId);
    return perm ? (perm.description || perm.name) : permId;
  };

  return (
    <div className="custom-modal-overlay" style={{ zIndex: 1100 }}>
      <div className="custom-modal-content modal-dict-wide">
        <div className="custom-modal-header bg-primary-subtle text-primary-emphasis">
          <h5 className="d-flex align-items-center gap-2">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
            </svg>
            Từ điển Ma Trận Phân Quyền
          </h5>
          <button className="btn-close-modal text-primary-emphasis" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div className="custom-modal-body" style={{ maxHeight: "70vh" }}>
          <p className="text-body-secondary mb-4" style={{ fontSize: "14px" }}>
            Bảng dưới đây liệt kê chi tiết các chức năng mà từng Nhóm vai trò được phép thao tác trong hệ thống dựa trên dữ liệu thực tế.
          </p>

          {roles.map((role, idx) => {
            const roleUI = ROLE_UI_MAP[role.name?.toLowerCase()] || { color: "bg-secondary" };
            const permsArray = role.permissionIds || [];
            const roleId = role._id || role.id || idx;
            
            return (
              <div className="dict-role-card" key={roleId}>
                <div className="dict-role-header">
                  <span className={`badge ${roleUI.color} px-2 py-1`} style={{ fontSize: "13px" }}>
                    {role.name}
                  </span>
                  <span className="text-body-secondary fw-normal" style={{ fontSize: "12px" }}>
                    ({permsArray.length} quyền hạn)
                  </span>
                </div>
                <div className="dict-role-body">
                  {permsArray.length === 0 ? (
                    <span className="text-muted fst-italic" style={{ fontSize: "13px" }}>
                      Vai trò này chưa được gán bất kỳ quyền nào.
                    </span>
                  ) : (
                    <div className="d-flex flex-wrap gap-2">
                      {permsArray.map(permId => (
                        <span key={permId} className="badge bg-body-secondary text-body-emphasis border fw-medium" style={{ fontSize: "12px" }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" className="me-1">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                          {getPermissionDesc(permId)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// --- KHU VỰC 3: LOGIC & GIAO DIỆN QUẢN LÝ VAI TRÒ (ROLE LIST COMPONENT) ---
// =========================================================================
const RoleManagementSection = ({ roles, setRoles, users, permissions, permissionModules }) => {
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedRole, setSelectedRole] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    mode: "onTouched"
  });

  const openCreateModal = () => {
    setModalMode("create");
    setSelectedRole(null);
    setSelectedPermissions([]);
    reset({ name: "", description: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (role) => {
    setModalMode("edit");
    setSelectedRole(role);
    setSelectedPermissions(role.permissionIds || []);
    reset({ name: role.name, description: role.description });
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const togglePermission = (permissionId) => {
    setSelectedPermissions(prev => 
      prev.includes(permissionId) ? prev.filter(id => id !== permissionId) : [...prev, permissionId]
    );
  };

  const toggleModuleAll = (moduleActions, isChecked) => {
    const modulePermissionIds = moduleActions.map(action => action._id);
    if (isChecked) {
      setSelectedPermissions(prev => [...new Set([...prev, ...modulePermissionIds])]);
    } else {
      setSelectedPermissions(prev => prev.filter(id => !modulePermissionIds.includes(id)));
    }
  };

  const onSubmitRole = async (data) => {
    setActionLoading(true);
    try {
      const payload = {
        name: data.name,
        description: data.description,
        permissionIds: selectedPermissions
      };

      const rId = selectedRole?._id;
      const url = modalMode === "create" ? `${API_BASE_URL}/roles` : `${API_BASE_URL}/roles/${rId}`;
      const method = modalMode === "create" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method: method,
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(payload)
      });
      const responseData = await res.json();

      if (!res.ok) throw new Error(responseData.message || "Thao tác vai trò thất bại");
      let updatedRecord = responseData.data || responseData;

      if (modalMode === "edit") {
        try {
          const permRes = await fetch(`${API_BASE_URL}/roles/${rId}/permissions`, {
            method: "PATCH",
            headers: { 
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`
            },
            body: JSON.stringify({ permissionIds: selectedPermissions })
          });
          const permData = await permRes.json();
          if (permRes.ok) {
             updatedRecord = permData.data || permData;
          }
        } catch (e) {
          console.log("Cập nhật quyền tích hợp cùng PATCH /roles/:id");
        }
      }

      if (modalMode === "create") {
        setRoles(prev => [...prev, updatedRecord]);
      } else {
        setRoles(prev => prev.map(item => item._id === rId ? updatedRecord : item));
      }
      closeModal();
    } catch (err) {
      alert("Lỗi hệ thống: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteRole = async (role) => {
    if (role.name?.toLowerCase() === "admin") return; 
    
    // Sửa logic đếm: Khớp Object_id dạng chuỗi từ MongoDB toàn diện
    const currentUserCount = users.filter(u => String(u.role_id) === String(role._id)).length;

    if (currentUserCount > 0) {
      alert(`Từ chối lệnh xóa: Đang có ${currentUserCount} tài khoản nhân sự đang áp dụng vai trò này.`);
      return;
    }
    if (!window.confirm(`Xác nhận xóa bỏ hoàn toàn vai trò "${role.name}" ra khỏi hệ thống phân quyền?`)) return;

    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/roles/${role._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData.message || "Yêu cầu xóa từ API thất bại");

      setRoles(prev => prev.filter(item => item._id !== role._id));
    } catch (err) {
      alert("Lỗi hệ thống: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="role-list-wrapper">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h5 className="fw-bold text-body-emphasis mb-1">Cấu hình phân quyền vai trò</h5>
          <span className="text-body-secondary" style={{ fontSize: "13px" }}>Quản lý ma trận phân quyền và thiết lập các nhóm nhân sự chi tiết.</span>
        </div>
        <button className="btn btn-primary d-flex align-items-center gap-2" onClick={openCreateModal}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span className="d-none d-sm-inline">Thêm vai trò hệ thống</span>
        </button>
      </div>

      <div className="card role-table-card">
        <div className="table-responsive">
          <table className="table custom-table">
            <thead>
              <tr>
                <th style={{ width: "25%" }}>Tên nhóm vai trò</th>
                <th style={{ width: "40%" }}>Mô tả chức năng nghiệp vụ</th>
                <th style={{ width: "15%" }}>Liên kết nhân sự</th>
                <th style={{ width: "20%", textAlign: "center" }}>Hành động thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" className="text-center py-5">
                    <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
                  </td>
                </tr>
              ) : roles.length === 0 ? (
                <tr><td colSpan="4" className="text-center py-5 text-body-secondary">Hệ thống chưa ghi nhận cấu hình vai trò nào.</td></tr>
              ) : (
                roles.map((role, idx) => {
                  const isAdmin = role.name?.toLowerCase() === "admin";
                  const roleId = role._id || role.id || idx;
                  
                  // FIX LỖI 0 LIÊN KẾT: So sánh string của ObjectId chính xác tuyệt đối
                  const userCount = users.filter(u => String(u.role_id) === String(roleId)).length;

                  return (
                    <tr key={roleId}>
                      <td>
                        <span className="fw-bold text-body-emphasis">{role.name}</span>
                        <div className="text-body-secondary" style={{ fontSize: "11px", marginTop: "2px" }}>ID: {roleId}</div>
                      </td>
                      <td><span className="text-body-secondary text-wrap" style={{ fontSize: "13px" }}>{role.description || "Chưa thiết lập mô tả cụ thể cho nhóm này."}</span></td>
                      <td>
                        <span className="badge bg-secondary-subtle text-body-emphasis border">
                          {userCount} nhân sự
                        </span>
                      </td>
                      <td className="text-center">
                        {isAdmin ? (
                          <span className="wrapper-tooltip" title="Tài khoản Admin hệ thống đã bị khóa bảo vệ, không thể sửa">
                            <button className="action-btn btn-disabled me-2" disabled>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                            </button>
                          </span>
                        ) : (
                          <button 
                            className="action-btn btn-edit me-2" 
                            title="Chỉnh sửa cấu hình phân quyền" 
                            onClick={() => openEditModal(role)} 
                            disabled={actionLoading}
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                          </button>
                        )}
                        
                        {isAdmin ? (
                          <span className="wrapper-tooltip" title="Tài khoản Admin hệ thống đã bị khóa bảo vệ, không thể xóa">
                            <button className="action-btn btn-disabled" disabled>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                            </button>
                          </span>
                        ) : (
                          <button 
                            className="action-btn btn-lock" 
                            title={userCount > 0 ? "Không thể xóa Role đang có nhân sự sử dụng" : "Xóa nhóm vai trò khỏi hệ thống"} 
                            onClick={() => handleDeleteRole(role)} 
                            disabled={actionLoading || userCount > 0}
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="custom-modal-overlay">
          <div className="custom-modal-content modal-role-wide">
            <div className="custom-modal-header">
              <h5>{modalMode === "create" ? "Khởi tạo cấu hình vai trò mới" : `Cập nhật ma trận phân quyền: ${selectedRole?.name}`}</h5>
              <button className="btn-close-modal" onClick={closeModal}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmitRole)} className="d-flex flex-column" style={{ overflow: "hidden" }}>
              <div className="custom-modal-body flex-grow-1" style={{ overflowY: "auto" }}>
                <div className="row mb-4">
                  <div className="col-md-6 mb-3 mb-md-0">
                    <label className="form-label" style={{ fontWeight: "600" }}>Tên nhóm hiển thị <span className="text-danger">*</span></label>
                    <input 
                      type="text" 
                      className={`form-control ${errors.name ? 'is-invalid' : ''}`} 
                      placeholder="Ví dụ: Trưởng phòng nghiệp vụ" 
                      disabled={actionLoading || (modalMode === "edit" && selectedRole?.name?.toLowerCase() === "admin")} 
                      {...register("name", { required: "Yêu cầu bắt buộc điền tên hiển thị vai trò" })} 
                    />
                    {errors.name && <div className="invalid-feedback">{errors.name.message}</div>}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label" style={{ fontWeight: "600" }}>Mô tả diễn giải chi tiết</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Mô tả phân cấp trách nhiệm của vai trò..." 
                      disabled={actionLoading} 
                      {...register("description")} 
                    />
                  </div>
                </div>

                <h6 className="fw-bold mb-3 d-flex align-items-center" style={{ fontSize: "14px" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="me-2 text-primary"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                  Thiết lập phân quyền tự động từ Database
                </h6>
                
                <div className="permissions-container">
                  {permissionModules.length === 0 ? (
                     <div className="text-center text-body-secondary py-4 fst-italic">Đang tải cấu trúc quyền từ hệ thống...</div>
                  ) : (
                    permissionModules.map((module) => {
                      const isAllChecked = module.actions.every(action => selectedPermissions.includes(action._id));
                      const isSomeChecked = module.actions.some(action => selectedPermissions.includes(action._id)) && !isAllChecked;

                      return (
                        <div className="module-group" key={module.id}>
                          <div className="module-header">
                            <h6 className="module-title text-capitalize">{module.id}</h6>
                            <label className="permission-checkbox fw-bold text-primary">
                              <input 
                                type="checkbox" 
                                checked={isAllChecked} 
                                ref={input => { if (input) input.indeterminate = isSomeChecked; }} 
                                onChange={(e) => toggleModuleAll(module.actions, e.target.checked)} 
                                disabled={actionLoading || (modalMode === "edit" && selectedRole?.name?.toLowerCase() === "admin")} 
                              />
                              Bật tất cả
                            </label>
                          </div>
                          <div className="permissions-grid">
                            {module.actions.map(action => (
                              <label key={action._id} className="permission-checkbox">
                                <input 
                                  type="checkbox" 
                                  checked={selectedPermissions.includes(action._id)} 
                                  onChange={() => togglePermission(action._id)} 
                                  disabled={actionLoading || (modalMode === "edit" && selectedRole?.name?.toLowerCase() === "admin")} 
                                />
                                <span className="text-truncate" title={action.description || action.name}>
                                  {action.description || action.name}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="custom-modal-footer mt-auto">
                <button type="button" className="btn btn-light border" onClick={closeModal} disabled={actionLoading}>Đóng lại</button>
                <button type="submit" className="btn btn-primary d-flex align-items-center gap-2" disabled={actionLoading || (modalMode === "edit" && selectedRole?.name?.toLowerCase() === "admin")}>
                  {actionLoading && <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>}
                  {modalMode === "create" ? "Khởi tạo ngay" : "Cập nhật phân quyền"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// =========================================================================
// --- KHU VỰC 4: LOGIC & GIAO DIỆN QUẢN LÝ TÀI KHOẢN (USER LIST COMPONENT) ---
// =========================================================================
export const UserList = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState("users");
  const [isDictOpen, setIsDictOpen] = useState(false);

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [permissions, setPermissions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    mode: "onTouched"
  });

  const watchDepartmentSelect = watch("departmentSelect");
  const hasActiveFilters = searchTerm !== "" || filterRole !== "" || filterDepartment !== "";

  // Helper chuyển mảng Permissions phẳng thành nhóm theo Module
  const permissionModules = useMemo(() => {
    const groups = {};
    permissions.forEach(p => {
      const mod = p.module || 'Khác';
      if (!groups[mod]) groups[mod] = [];
      groups[mod].push(p);
    });
    return Object.keys(groups).map(mod => ({
      id: mod,
      actions: groups[mod]
    }));
  }, [permissions]);

  // LOGIC TRÍCH XUẤT QUYỀN TRUY CẬP HIỆN TẠI
  const currentUserRoleData = roles.find(r => String(r._id) === String(currentUser?.role_id) || r.name === currentUser?.role);
  const userPermissionIds = currentUserRoleData?.permissionIds || [];
  
  const isAdmin = currentUserRoleData?.name?.toLowerCase() === "admin" || currentUser?.role === "admin";
  
  const hasPermissionStr = (searchStr) => {
      if (isAdmin) return true;
      const permObj = permissions.find(p => p.name && p.name.includes(searchStr));
      return permObj ? userPermissionIds.includes(permObj._id) : false;
  };

  const canCreateUser = hasPermissionStr("users:create");
  const canEditUser = hasPermissionStr("users:update");
  const canLockUser = hasPermissionStr("users:status") || hasPermissionStr("users:update");

  // Multi-Fetch API Đồng Bộ Toàn Hệ Thống
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [usersRes, rolesRes, deptsRes, permsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/users`, { headers }),
        fetch(`${API_BASE_URL}/roles`, { headers }),
        fetch(`${API_BASE_URL}/departments`, { headers }),
        fetch(`${API_BASE_URL}/permissions`, { headers }).catch(() => null)
      ]);

      const [usersData, rolesData, deptsData, permsData] = await Promise.all([
        usersRes.json(),
        rolesRes.json(),
        deptsRes.json(),
        permsRes ? permsRes.json() : { data: [] }
      ]);

      setUsers(usersData.data || usersData || []);
      setRoles(rolesData.data || rolesData || []);
      setDepartments(deptsData.data || deptsData || []);
      setPermissions(permsData.data || permsData || []);

    } catch (err) {
      setError("Lỗi đồng bộ dữ liệu với máy chủ.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const resetFilters = () => {
    setSearchTerm("");
    setFilterRole("");
    setFilterDepartment("");
  };

  const openCreateModal = () => {
    setModalMode("create");
    setSelectedUser(null);
    reset({ full_name: "", email: "", role_id: "", departmentSelect: "", departmentInput: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setModalMode("edit");
    setSelectedUser(user);
    
    const isKnownDept = departments.some(d => String(d._id) === String(user.department_id));
    const initialDeptSelect = isKnownDept ? user.department_id : (user.department_id ? "other" : "");
    const initialDeptInput = isKnownDept ? "" : "Phòng ban mới";

    reset({
      full_name: user.full_name || user.name,
      email: user.email,
      role_id: user.role_id,
      departmentSelect: initialDeptSelect,
      departmentInput: initialDeptInput,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    reset(); 
  };

  const onSubmitUser = async (data) => {
    setActionLoading(true);
    try {
      let finalDepartmentId = data.departmentSelect;
      
      // Khởi tạo phòng ban tự động nếu chọn 'other'
      if (data.departmentSelect === "other" && data.departmentInput) {
        try {
          const deptRes = await fetch(`${API_BASE_URL}/departments`, {
            method: "POST",
            headers: { 
              "Content-Type": "application/json", 
              Authorization: `Bearer ${localStorage.getItem("token")}` 
            },
            body: JSON.stringify({ name: data.departmentInput })
          });
          const newDeptData = await deptRes.json();
          if (deptRes.ok) {
            const createdDept = newDeptData.data || newDeptData;
            setDepartments(prev => [...prev, createdDept]);
            finalDepartmentId = createdDept._id;
          }
        } catch (e) {
          console.log("Lỗi tạo phòng ban mới.");
        }
      }

      // Khớp dữ liệu Payload thực tế Database (full_name, role_id, department_id)
      const payload = {
        full_name: data.full_name,
        email: data.email,
        role_id: data.role_id,
        department_id: finalDepartmentId
      };

      if (modalMode === "create") {
        payload.password = "Hito@123456"; // Tránh lỗi 400 Bad Request từ BE validation
      }

      const uId = selectedUser?._id;
      const url = modalMode === "create" ? `${API_BASE_URL}/users` : `${API_BASE_URL}/users/${uId}`;
      const method = modalMode === "create" ? "POST" : "PATCH"; 

      const res = await fetch(url, {
        method: method,
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(payload)
      });
      
      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData.message || "Thao tác cập nhật tài khoản trên API thất bại");
      
      const savedUserRecord = responseData.data || responseData;
      
      if (modalMode === "create") {
        setUsers(prev => [savedUserRecord, ...prev]);
      } else {
        setUsers(prev => prev.map(item => item._id === uId ? savedUserRecord : item));
      }
      closeModal();
    } catch (err) {
      alert("Lỗi: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === "active" ? "locked" : "active";
    const confirmMessage = currentStatus === "active" ? "Xác nhận KHÓA tài khoản này ngừng truy cập hệ thống?" : "Xác nhận MỞ KHÓA khôi phục quyền truy cập?";
    
    if (!window.confirm(confirmMessage)) return;

    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/users/${userId}/status`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const responseData = await res.json();

      if (!res.ok) throw new Error(responseData.message || "Lệnh PATCH cập nhật trạng thái thất bại");
      setUsers(prev => prev.map(item => item._id === userId ? { ...item, status: newStatus } : item));
    } catch (err) {
      alert("Lỗi hệ thống: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const deleteUser = async (userId, userName) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa mềm tài khoản của nhân viên "${userName}" không?`)) return;

    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      const responseData = await res.json();

      if (!res.ok) throw new Error(responseData.message || "Lệnh xóa mềm trên API thất bại");
      setUsers(prev => prev.filter(item => item._id !== userId));
    } catch (err) {
      alert("Lỗi hệ thống: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Filter an toàn tránh crash giao diện
  const filteredUsers = users.filter(user => {
    if (!user) return false;

    const name = (user.full_name || user.name || "").toLowerCase();
    const email = (user.email || "").toLowerCase();
    const term = searchTerm.toLowerCase();

    const matchSearch = name.includes(term) || email.includes(term);
    const matchRole = filterRole ? String(user.role_id) === String(filterRole) : true;
    const matchDept = filterDepartment ? String(user.department_id) === String(filterDepartment) : true;
    
    return matchSearch && matchRole && matchDept;
  });

  return (
    <div className="user-list-wrapper container-fluid pt-3 pb-4" style={{ maxWidth: "1600px" }}>
      
      {/* THANH ĐIỀU HƯỚNG TAB TỐI GIẢN */}
      <div className="custom-tab-container">
        <button 
          className={`custom-tab-btn ${activeTab === 'users' ? 'active' : ''}`} 
          onClick={() => setActiveTab('users')}
        >
          Danh sách tài khoản nhân sự
        </button>
        {isAdmin && (
          <button 
            className={`custom-tab-btn ${activeTab === 'roles' ? 'active' : ''}`} 
            onClick={() => setActiveTab('roles')}
          >
            Cấu hình & Phân quyền vai trò
          </button>
        )}
      </div>

      <div className="current-role-banner mb-4 p-3 rounded-3 d-flex justify-content-between align-items-center">
        <div>
          <span className="text-body-secondary me-2">Đang đăng nhập:</span> 
          <span className="fw-bold text-body-emphasis">{currentUser?.full_name || currentUser?.name}</span> 
          <span className="mx-2 text-body-secondary">|</span>
          <span className="text-body-secondary me-2">Vai trò:</span>
          <span className={`badge ${ROLE_UI_MAP[currentUserRoleData?.name?.toLowerCase()]?.color || 'bg-secondary'} px-2 py-1`} style={{ fontSize: '13px' }}>
            {currentUserRoleData?.name || "Không rõ"}
          </span>
        </div>
        <button 
          className="btn btn-sm btn-outline-primary fw-medium d-flex align-items-center gap-2" 
          onClick={() => setIsDictOpen(true)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
          <span className="d-none d-sm-inline">Ma trận phân quyền</span>
        </button>
      </div>

      <PermissionDictionaryModal isOpen={isDictOpen} onClose={() => setIsDictOpen(false)} roles={roles} permissions={permissions} />

      {activeTab === 'roles' && isAdmin ? (
        <RoleManagementSection roles={roles} setRoles={setRoles} users={users} permissions={permissions} permissionModules={permissionModules} />
      ) : (
        <>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h4 className="fw-bold text-body-emphasis mb-1">Quản lý tài khoản người dùng</h4>
              <span className="text-body-secondary" style={{ fontSize: "14px" }}>Kiểm soát trạng thái hoạt động, cấp quyền và tổ chức phòng ban nhân viên.</span>
            </div>
            
            {canCreateUser ? (
              <button 
                className="btn btn-primary d-flex align-items-center gap-2" 
                onClick={openCreateModal}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <span className="d-none d-sm-inline">Tạo tài khoản mới</span>
              </button>
            ) : (
              <span className="wrapper-tooltip" title="Tài khoản của bạn không được cấp quyền Thêm tài khoản">
                <button className="btn btn-secondary d-flex align-items-center gap-2 btn-disabled" disabled>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  <span className="d-none d-sm-inline">Tạo tài khoản mới</span>
                </button>
              </span>
            )}
          </div>

          <div className="filter-bar">
            <div className="search-box">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input type="text" className="form-control form-control-sm bg-body border-1" placeholder="Tìm kiếm theo họ tên hoặc hòm thư..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            
            <select className="form-select form-select-sm bg-body filter-select" value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
              <option value="">Lọc theo vai trò</option>
              {roles.map(role => (
                <option key={role._id} value={role._id}>{role.name}</option>
              ))}
            </select>

            <select className="form-select form-select-sm bg-body filter-select" value={filterDepartment} onChange={(e) => setFilterDepartment(e.target.value)}>
              <option value="">Lọc theo phòng ban</option>
              {departments.map(dept => (
                <option key={dept._id} value={dept._id}>{dept.name}</option>
              ))}
            </select>

            {hasActiveFilters && (
              <button 
                className="btn btn-outline-secondary btn-sm btn-reset-filter" 
                onClick={resetFilters} 
                title="Khôi phục danh sách ban đầu"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><polyline points="3 3 3 8 8 8"></polyline></svg>
                Hoàn tác
              </button>
            )}
          </div>

          <div className="card table-card">
            <div className="table-responsive">
              <table className="table table-hover custom-table">
                <thead>
                  <tr>
                    <th style={{ width: "5%" }}>STT</th>
                    <th style={{ width: "25%" }}>Thông tin nhân viên</th>
                    <th style={{ width: "25%" }}>Chức vụ & Quyền hạn</th>
                    <th style={{ width: "15%" }}>Sơ đồ phòng ban</th>
                    <th style={{ width: "15%" }}>Trạng thái vận hành</th>
                    <th style={{ width: "15%", textAlign: "center" }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="text-center py-5">
                        <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr><td colSpan="6" className="text-center py-4 text-danger">{error}</td></tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr><td colSpan="6" className="text-center py-5 text-body-secondary">Hệ thống dữ liệu trống hoặc không tìm thấy kết quả.</td></tr>
                  ) : (
                    filteredUsers.map((user, index) => {
                      const uRole = roles.find(r => String(r._id) === String(user.role_id)) || {};
                      const roleName = uRole.name || "Chưa gán quyền";
                      const roleUI = ROLE_UI_MAP[roleName.toLowerCase()] || { color: "bg-secondary" };
                      
                      const uDept = departments.find(d => String(d._id) === String(user.department_id));
                      const deptName = uDept?.name || "—";

                      return (
                        <tr key={user._id}>
                          <td>{index + 1}</td>
                          <td>
                            <div className="d-flex flex-column">
                              <span className="fw-bold text-body-emphasis">{user.full_name || user.name}</span>
                              <span className="text-body-secondary" style={{ fontSize: "12px" }}>{user.email}</span>
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <span className={`badge ${roleUI.color}`}>{roleName}</span>
                              <a href="#" onClick={(e) => { e.preventDefault(); setIsDictOpen(true); }} className="text-primary text-decoration-none" style={{ fontSize: "12px" }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-1"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                                Xem chức năng
                              </a>
                            </div>
                          </td>
                          <td>{deptName}</td>
                          <td>
                            <span className={`status-badge ${user.status === 'active' ? 'status-active' : 'status-locked'}`}>
                              {user.status === 'active' ? (
                                <><span className="spinner-grow spinner-grow-sm bg-success" style={{width: '6px', height: '6px'}}></span> Đang hoạt động</>
                              ) : (
                                <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg> Đã khóa</>
                              )}
                            </span>
                          </td>
                          <td className="text-center">
                            {canEditUser ? (
                              <button 
                                className="action-btn btn-edit me-1" 
                                title="Chỉnh sửa tài khoản" 
                                onClick={() => openEditModal(user)} 
                                disabled={actionLoading}
                              >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                              </button>
                            ) : (
                              <span className="wrapper-tooltip me-1" title="Bạn không có quyền Sửa nhân sự">
                                <button className="action-btn btn-disabled" disabled>
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                </button>
                              </span>
                            )}

                            {currentUser?.email !== user.email && (
                              canLockUser ? (
                                <button 
                                  className={`action-btn ${user.status === 'active' ? 'btn-lock' : 'btn-unlock'} me-1`} 
                                  title={user.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'} 
                                  onClick={() => toggleUserStatus(user._id, user.status)} 
                                  disabled={actionLoading}
                                >
                                  {user.status === 'active' ? (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                  ) : (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>
                                  )}
                                </button>
                              ) : (
                                <span className="wrapper-tooltip me-1" title="Bạn không có quyền Khóa nhân sự">
                                  <button className="action-btn btn-disabled" disabled>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                  </button>
                                </span>
                              )
                            )}

                            {currentUser?.email !== user.email && isAdmin && (
                              <button 
                                className="action-btn btn-delete" 
                                title="Xóa mềm người dùng" 
                                onClick={() => deleteUser(user._id, user.full_name || user.name)} 
                                disabled={actionLoading}
                              >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="card-footer bg-transparent border-top py-3">
              <span className="text-body-secondary" style={{ fontSize: "13px" }}>Tổng số ghi nhận: {filteredUsers.length} tài khoản</span>
            </div>
          </div>

          {/* Modal Tạo/Sửa User */}
          {isModalOpen && (
            <div className="custom-modal-overlay">
              <div className="custom-modal-content">
                <div className="custom-modal-header">
                  <h5>{modalMode === "create" ? "Khởi tạo tài khoản nhân sự mới" : "Cập nhật dữ liệu nhân sự"}</h5>
                  <button className="btn-close-modal" onClick={closeModal}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                </div>
                
                <form onSubmit={handleSubmit(onSubmitUser)}>
                  <div className="custom-modal-body">
                    <div className="mb-3">
                      <label className="form-label" style={{ fontSize: "14px", fontWeight: "600" }}>Họ và tên nhân sự (full_name) <span className="text-danger">*</span></label>
                      <input 
                        type="text" 
                        className={`form-control ${errors.full_name ? 'is-invalid' : ''}`} 
                        placeholder="Nhập họ và tên..." 
                        disabled={actionLoading} 
                        {...register("full_name", { required: "Trường họ và tên bắt buộc nhập" })} 
                      />
                      {errors.full_name && <div className="invalid-feedback">{errors.full_name.message}</div>}
                    </div>

                    <div className="mb-3">
                      <label className="form-label" style={{ fontSize: "14px", fontWeight: "600" }}>Hòm thư Email hệ thống <span className="text-danger">*</span></label>
                      <input 
                        type="email" 
                        className={`form-control ${errors.email ? 'is-invalid' : ''}`} 
                        placeholder="username@hto.vn" 
                        disabled={actionLoading || modalMode === "edit"} 
                        {...register("email", { required: "Hòm thư bắt buộc nhập", pattern: { value: /\S+@\S+\.\S+/, message: "Định dạng hòm thư không đúng" } })} 
                      />
                      {errors.email && <div className="invalid-feedback">{errors.email.message}</div>}
                    </div>

                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label" style={{ fontSize: "14px", fontWeight: "600" }}>Phân cấp vai trò <span className="text-danger">*</span></label>
                        <select 
                          className={`form-select ${errors.role_id ? 'is-invalid' : ''}`} 
                          disabled={actionLoading} 
                          {...register("role_id", { required: "Bắt buộc chỉ định vai trò quyền" })}
                        >
                          <option value="">-- Chọn vai trò --</option>
                          {roles.map(role => (
                            <option key={role._id} value={role._id}>{role.name}</option>
                          ))}
                        </select>
                        {errors.role_id && <div className="invalid-feedback">{errors.role_id.message}</div>}
                      </div>

                      <div className="col-md-6 mb-3">
                        <label className="form-label" style={{ fontSize: "14px", fontWeight: "600" }}>Sơ đồ tổ chức phòng ban</label>
                        <select 
                          className="form-select mb-2" 
                          disabled={actionLoading} 
                          {...register("departmentSelect")}
                        >
                          <option value="">-- Bỏ trống --</option>
                          {departments.map(dept => (
                            <option key={dept._id} value={dept._id}>{dept.name}</option>
                          ))}
                          <option value="other" className="fw-bold text-primary">-- Nhập phòng ban mới --</option>
                        </select>
                        
                        {watchDepartmentSelect === "other" && (
                          <input 
                            type="text" 
                            className={`form-control ${errors.departmentInput ? 'is-invalid' : ''}`} 
                            placeholder="Nhập tên phòng ban mới..." 
                            autoFocus 
                            disabled={actionLoading} 
                            {...register("departmentInput", { required: watchDepartmentSelect === "other" ? "Yêu cầu gõ tên phòng ban tùy biến" : false })} 
                          />
                        )}
                        {errors.departmentInput && <div className="invalid-feedback">{errors.departmentInput.message}</div>}
                      </div>
                    </div>
                  </div>

                  <div className="custom-modal-footer">
                    <button type="button" className="btn btn-light border" onClick={closeModal} disabled={actionLoading}>Hủy bỏ</button>
                    <button type="submit" className="btn btn-primary d-flex align-items-center gap-2" disabled={actionLoading}>
                      {actionLoading && <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>}
                      {modalMode === "create" ? "Tạo tài khoản" : "Cập nhật dữ liệu"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};