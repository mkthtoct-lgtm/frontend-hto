// src/UserList/UserList.jsx
import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import "./UserList.css";

// =========================================================================
// --- KHU VỰC CẤU HÌNH DATA TĨNH VÀ MOCK DATA CHUNG ---
// =========================================================================

const ROLE_MAP = {
  admin: { label: "Admin", color: "bg-danger", link: "/role-links/admin" },
  bangiamdoc: { label: "Ban giám đốc", color: "bg-primary", link: "/role-links/ban-giam-doc" },
  truongbophan: { label: "Trưởng bộ phận", color: "bg-warning text-dark", link: "/role-links/truong-bo-phan" },
  nhansu: { label: "Nhân sự", color: "bg-info text-dark", link: "/role-links/nhan-su" },
  daily: { label: "Đại lý", color: "bg-success", link: "/role-links/dai-ly" },
  congtacvien: { label: "Cộng tác viên", color: "bg-secondary", link: "/role-links/cong-tac-vien" },
  hethong: { label: "Hệ thống", color: "bg-dark", link: "/role-links/he-thong" }
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

const INITIAL_MOCK_USERS = [
  { id: 1, name: "Nguyễn Văn Admin", email: "admin@hto.vn", role: "admin", department: "Ban Giám Đốc", status: "active" },
  { id: 2, name: "Trần Thị B", email: "tranb@hto.vn", role: "nhansu", department: "Tuyển Sinh", status: "active" },
  { id: 3, name: "Lê Văn C", email: "lec@hto.vn", role: "daily", department: "Hồ Sơ", status: "locked" },
  { id: 4, name: "Phạm D", email: "phamd@hto.vn", role: "congtacvien", department: "Kế Toán", status: "active" },
  { id: 5, name: "Hoàng Thị E", email: "hoange@hto.vn", role: "truongbophan", department: "Marketing", status: "active" },
];

const INITIAL_MOCK_ROLES = [
  { 
    id: 1, key: "admin", name: "Admin", description: "Quản trị viên cấp cao nhất hệ thống, kiểm soát toàn quyền thao tác.", 
    permissions: ["view_dashboard", "export_report", "view_users", "create_users", "edit_users", "lock_users", "view_roles", "create_roles", "edit_roles", "delete_roles", "view_products", "create_products", "edit_products", "delete_products"],
    userCount: 1 
  },
  { 
    id: 2, key: "bangiamdoc", name: "Ban giám đốc", description: "Theo dõi dữ liệu báo cáo tổng hợp và xét duyệt hồ sơ.", 
    permissions: ["view_dashboard", "export_report", "view_users", "view_products"],
    userCount: 1 
  },
  { 
    id: 3, key: "nhansu", name: "Nhân sự", description: "Quản lý nhân viên, phòng ban và tài khoản nội bộ.", 
    permissions: ["view_dashboard", "view_users", "create_users", "edit_users", "lock_users"],
    userCount: 1 
  },
];


// =========================================================================
// --- START: COMPONENT NỘI BỘ (DICTIONARY MODAL) ---
// Chức năng: Modal hiển thị tra cứu Ma trận phân quyền của tất cả Role
// =========================================================================
const PermissionDictionaryModal = ({ isOpen, onClose, roles }) => {
  if (!isOpen) return null;

  // Hàm hỗ trợ tìm tên Quyền từ ID
  const getActionName = (actionId) => {
    for (const mod of PERMISSION_MODULES) {
      const found = mod.actions.find(a => a.id === actionId);
      if (found) return found.name;
    }
    return actionId;
  };

  return (
    <div className="custom-modal-overlay" style={{ zIndex: 1100 }}>
      <div className="custom-modal-content modal-dict-wide">
        <div className="custom-modal-header bg-primary-subtle text-primary-emphasis">
          <h5 className="d-flex align-items-center gap-2">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
            Từ điển Ma Trận Phân Quyền
          </h5>
          <button className="btn-close-modal text-primary-emphasis" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        
        <div className="custom-modal-body" style={{ maxHeight: "70vh" }}>
          <p className="text-body-secondary mb-4" style={{ fontSize: "14px" }}>
            Bảng dưới đây liệt kê chi tiết các chức năng mà từng Nhóm vai trò được phép thao tác trong hệ thống. Nếu chức năng không có tên trong danh sách, người dùng thuộc vai trò đó sẽ bị vô hiệu hóa quyền thao tác.
          </p>

          {roles.map((role) => {
            const roleUI = ROLE_MAP[role.key] || { color: "bg-secondary", label: role.name };
            return (
              <div className="dict-role-card" key={role.id}>
                <div className="dict-role-header">
                  <span className={`badge ${roleUI.color} px-2 py-1`} style={{ fontSize: "13px" }}>{role.name}</span>
                  <span className="text-body-secondary fw-normal" style={{ fontSize: "12px" }}>({role.permissions?.length || 0} quyền hạn)</span>
                </div>
                <div className="dict-role-body">
                  {(!role.permissions || role.permissions.length === 0) ? (
                    <span className="text-muted fst-italic" style={{ fontSize: "13px" }}>Vai trò này chưa được gán bất kỳ quyền nào.</span>
                  ) : (
                    <div className="d-flex flex-wrap gap-2">
                      {role.permissions.map(permId => (
                        <span key={permId} className="badge bg-body-secondary text-body-emphasis border fw-medium" style={{ fontSize: "12px" }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" className="me-1"><polyline points="20 6 9 17 4 12"></polyline></svg>
                          {getActionName(permId)}
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
// === END: DICTIONARY MODAL ===


// =========================================================================
// --- START: COMPONENT NỘI BỘ (ROLE LIST) ---
// Chức năng: Hiển thị danh sách vai trò, tạo mới và cấp quyền (Permissions)
// =========================================================================
const RoleManagementSection = ({ roles, setRoles }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    reset({ name: "", key: "", description: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (role) => {
    setModalMode("edit");
    setSelectedRole(role);
    setSelectedPermissions(role.permissions || []);
    reset({ name: role.name, key: role.key, description: role.description });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const togglePermission = (permissionId) => {
    setSelectedPermissions(prev => 
      prev.includes(permissionId) ? prev.filter(id => id !== permissionId) : [...prev, permissionId]
    );
  };

  const toggleModuleAll = (module, isChecked) => {
    const modulePermissionIds = module.actions.map(action => action.id);
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
        key: data.key,
        description: data.description,
        permissions: selectedPermissions
      };

      /* --- LOGIC KẾT NỐI API THẬT CHO ROLE ---
      const url = modalMode === "create" ? "https://api.domaincuaban.com/api/roles" : `https://api.domaincuaban.com/api/roles/${selectedRole.id}`;
      const method = modalMode === "create" ? "POST" : "PUT";
      const res = await fetch(url, {
        method: method,
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Cập nhật vai trò thất bại từ API");
      ---------------------------------------- */

      await new Promise(resolve => setTimeout(resolve, 800)); 
      
      if (modalMode === "create") {
        // eslint-disable-next-line react-hooks/purity
        const newRole = { ...payload, id: Date.now(), userCount: 0 };
        setRoles(prev => [...prev, newRole]);
      } else {
        setRoles(prev => prev.map(item => item.id === selectedRole.id ? { ...item, ...payload } : item));
      }

      closeModal();
    } catch (err) {
      alert("Lỗi hệ thống: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteRole = async (role) => {
    if (role.key === "admin") return; // Nút xóa đã bị ẩn, check thêm logic an toàn
    
    if (role.userCount > 0) {
      alert(`Từ chối lệnh xóa: Đang có ${role.userCount} tài khoản nhân sự đang áp dụng vai trò này.`);
      return;
    }
    if (!window.confirm(`Xác nhận xóa bỏ hoàn toàn vai trò "${role.name}" ra khỏi hệ thống phân quyền?`)) return;

    setActionLoading(true);
    try {
      /* --- LOGIC KẾT NỐI API THẬT CHO ROLE ---
      const res = await fetch(`https://api.domaincuaban.com/api/roles/${role.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      if (!res.ok) throw new Error("Yêu cầu xóa từ API thất bại");
      ---------------------------------------- */

      await new Promise(resolve => setTimeout(resolve, 600)); 
      setRoles(prev => prev.filter(item => item.id !== role.id));
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
              ) : error ? (
                <tr><td colSpan="4" className="text-center py-4 text-danger">{error}</td></tr>
              ) : roles.length === 0 ? (
                <tr><td colSpan="4" className="text-center py-5 text-body-secondary">Hệ thống chưa ghi nhận cấu hình vai trò nào.</td></tr>
              ) : (
                roles.map((role) => {
                  const isAdmin = role.key === "admin";
                  
                  return (
                    <tr key={role.id}>
                      <td>
                        <span className="fw-bold text-body-emphasis">{role.name}</span>
                        <div className="text-body-secondary" style={{ fontSize: "11px", marginTop: "2px" }}>Mã định danh: {role.key}</div>
                      </td>
                      <td><span className="text-body-secondary text-wrap" style={{ fontSize: "13px" }}>{role.description || "Chưa thiết lập mô tả cụ thể cho nhóm này."}</span></td>
                      <td>
                        <span className="badge bg-secondary-subtle text-body-emphasis border">
                          {role.userCount} nhân sự
                        </span>
                      </td>
                      <td className="text-center">
                        {/* Nút sửa */}
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
                        
                        {/* Nút xóa */}
                        {isAdmin ? (
                          <span className="wrapper-tooltip" title="Tài khoản Admin hệ thống đã bị khóa bảo vệ, không thể xóa">
                            <button className="action-btn btn-disabled" disabled>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                            </button>
                          </span>
                        ) : (
                          <button 
                            className="action-btn btn-lock"
                            title={role.userCount > 0 ? "Không thể xóa Role đang có nhân sự sử dụng" : "Xóa nhóm vai trò khỏi hệ thống"}
                            onClick={() => handleDeleteRole(role)}
                            disabled={actionLoading || role.userCount > 0}
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
                      type="text" className={`form-control ${errors.name ? 'is-invalid' : ''}`} 
                      placeholder="Ví dụ: Trưởng phòng nghiệp vụ" disabled={actionLoading}
                      {...register("name", { required: "Yêu cầu bắt buộc điền tên hiển thị vai trò" })}
                    />
                    {errors.name && <div className="invalid-feedback">{errors.name.message}</div>}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label" style={{ fontWeight: "600" }}>Mã hệ thống định danh (Key) <span className="text-danger">*</span></label>
                    <input 
                      type="text" className={`form-control ${errors.key ? 'is-invalid' : ''}`} 
                      placeholder="Ví dụ: truong_phong_nghiep_vu" disabled={actionLoading || modalMode === "edit"}
                      {...register("key", { 
                        required: "Mã định danh hệ thống không được để trống",
                        pattern: { value: /^[a-z0-9_]+$/, message: "Quy ước mã viết thường liền nhau, số hoặc dấu gạch dưới" }
                      })}
                    />
                    {errors.key && <div className="invalid-feedback">{errors.key.message}</div>}
                  </div>
                  <div className="col-12 mt-3">
                    <label className="form-label" style={{ fontWeight: "600" }}>Mô tả diễn giải chi tiết</label>
                    <input 
                      type="text" className="form-control" placeholder="Mô tả phân cấp trách nhiệm của vai trò..." disabled={actionLoading}
                      {...register("description")}
                    />
                  </div>
                </div>

                <h6 className="fw-bold mb-3 d-flex align-items-center" style={{ fontSize: "14px" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="me-2 text-primary"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                  Thiết lập phân quyền theo cấu trúc module tác vụ
                </h6>
                
                <div className="permissions-container">
                  {PERMISSION_MODULES.map((module) => {
                    const modulePermissionIds = module.actions.map(action => action.id);
                    const isAllChecked = modulePermissionIds.every(id => selectedPermissions.includes(id));
                    const isSomeChecked = modulePermissionIds.some(id => selectedPermissions.includes(id)) && !isAllChecked;

                    return (
                      <div className="module-group" key={module.id}>
                        <div className="module-header">
                          <h6 className="module-title">{module.name}</h6>
                          <label className="permission-checkbox fw-bold text-primary">
                            <input 
                              type="checkbox" 
                              checked={isAllChecked}
                              ref={input => { if (input) input.indeterminate = isSomeChecked; }}
                              onChange={(e) => toggleModuleAll(module, e.target.checked)}
                              disabled={actionLoading}
                            />
                            Bật tất cả
                          </label>
                        </div>
                        <div className="permissions-grid">
                          {module.actions.map(action => (
                            <label key={action.id} className="permission-checkbox">
                              <input 
                                type="checkbox"
                                checked={selectedPermissions.includes(action.id)}
                                onChange={() => togglePermission(action.id)}
                                disabled={actionLoading}
                              />
                              {action.name}
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="custom-modal-footer mt-auto">
                <button type="button" className="btn btn-light border" onClick={closeModal} disabled={actionLoading}>Đóng lại</button>
                <button type="submit" className="btn btn-primary d-flex align-items-center gap-2" disabled={actionLoading}>
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
// === END: COMPONENT NỘI BỘ (ROLE LIST) ===


// =========================================================================
// --- START: MAIN COMPONENT (USER LIST & TAB CONTROLLER) ---
// Chức năng: Component xuất khẩu chính, quản lý Tabs và danh sách Người dùng
// =========================================================================
export const UserList = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState("users");
  const [isDictOpen, setIsDictOpen] = useState(false); // State bật tắt từ điển phân quyền

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState(INITIAL_MOCK_ROLES);
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
  const departments = [...new Set(users.map(user => user.department).filter(Boolean))];

  // LOGIC TRÍCH XUẤT QUYỀN HIỆN TẠI (Dùng để khóa UI thông minh)
  const currentUserRoleData = roles.find(r => r.key === currentUser?.role);
  const userPermissions = currentUserRoleData?.permissions || [];
  
  // Xác định quyền Thêm/Sửa/Khóa (Admin luôn được phép hoặc check trong mảng permissions)
  const isAdmin = currentUser?.role === "admin";
  const canCreateUser = isAdmin || userPermissions.includes("create_users");
  const canEditUser = isAdmin || userPermissions.includes("edit_users");
  const canLockUser = isAdmin || userPermissions.includes("lock_users");

  // Kiểm soát quyền truy cập trang tổng thể
  if (!["admin", "bangiamdoc", "nhansu"].includes(currentUser?.role)) {
    return (
      <div className="container-fluid pt-5 text-center">
        <h2 className="text-danger">Từ chối quyền truy cập</h2>
        <p className="text-body-secondary">Tài khoản hiện tại của bạn không nằm trong phân cấp quản lý nhân sự.</p>
      </div>
    );
  }

  // Fetch danh sách Users
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      /* --- LOGIC KẾT NỐI API THẬT CHO USER ---
      const res = await fetch("https://api.domaincuaban.com/api/users", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Không thể đồng bộ dữ liệu tài khoản");
      setUsers(data);
      ----------------------------------------- */

      await new Promise(resolve => setTimeout(resolve, 800));
      setUsers(INITIAL_MOCK_USERS);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xảy ra lỗi đồng bộ hệ thống");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers();
    }
  }, [fetchUsers, activeTab]);

  const resetFilters = () => {
    setSearchTerm("");
    setFilterRole("");
    setFilterDepartment("");
  };

  const openCreateModal = () => {
    setModalMode("create");
    setSelectedUser(null);
    reset({ name: "", email: "", role: "", departmentSelect: "", departmentInput: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setModalMode("edit");
    setSelectedUser(user);
    
    const isKnownDepartment = departments.includes(user.department);
    const initialDeptSelect = isKnownDepartment ? user.department : (user.department ? "other" : "");
    const initialDeptInput = isKnownDepartment ? "" : (user.department || "");

    reset({
      name: user.name,
      email: user.email,
      role: user.role,
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
      const finalDepartment = data.departmentSelect === "other" ? data.departmentInput : data.departmentSelect;
      const payload = {
        name: data.name,
        email: data.email,
        role: data.role,
        department: finalDepartment
      };

      /* --- LOGIC KẾT NỐI API THẬT CHO USER ---
      const url = modalMode === "create" ? "https://api.domaincuaban.com/api/users" : `https://api.domaincuaban.com/api/users/${selectedUser.id}`;
      const method = modalMode === "create" ? "POST" : "PUT";
      const res = await fetch(url, {
        method: method,
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Thao tác cập nhật tài khoản trên API thất bại");
      ----------------------------------------- */

      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (modalMode === "create") {
        // eslint-disable-next-line react-hooks/purity
        const newUser = { ...payload, id: Date.now(), status: "active" };
        setUsers(prev => [newUser, ...prev]);
        setRoles(prev => prev.map(r => r.key === payload.role ? { ...r, userCount: r.userCount + 1 } : r));
      } else {
        const oldRole = selectedUser.role;
        const newRole = payload.role;
        if (oldRole !== newRole) {
          setRoles(prev => prev.map(r => {
            if (r.key === oldRole) return { ...r, userCount: Math.max(0, r.userCount - 1) };
            if (r.key === newRole) return { ...r, userCount: r.userCount + 1 };
            return r;
          }));
        }
        setUsers(prev => prev.map(item => item.id === selectedUser.id ? { ...item, ...payload } : item));
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
      /* --- LOGIC KẾT NỐI API THẬT ---
      const res = await fetch(`https://api.domaincuaban.com/api/users/${userId}/status`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error("Lệnh PATCH cập nhật trạng thái thất bại");
      ------------------------------- */

      await new Promise(resolve => setTimeout(resolve, 600));
      setUsers(prev => prev.map(item => item.id === userId ? { ...item, status: newStatus } : item));
    } catch (err) {
      alert("Lỗi hệ thống: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = filterRole ? user.role === filterRole : true;
    const matchDept = filterDepartment ? user.department === filterDepartment : true;
    return matchSearch && matchRole && matchDept;
  });

  return (
    <div className="user-list-wrapper container-fluid pt-3 pb-4" style={{ maxWidth: "1600px" }}>
      
      {/* ========================================================================= */}
      {/* BANNER THÔNG TIN ROLE CỦA NGƯỜI DÙNG HIỆN TẠI VÀ NÚT XEM TỪ ĐIỂN */}
      {/* ========================================================================= */}
      <div className="current-role-banner mb-4 p-3 rounded-3 d-flex justify-content-between align-items-center">
        <div>
          <span className="text-body-secondary me-2">Đang đăng nhập:</span> 
          <span className="fw-bold text-body-emphasis">{currentUser?.name}</span> 
          <span className="mx-2 text-body-secondary">|</span>
          <span className="text-body-secondary me-2">Vai trò hiện tại:</span>
          <span className={`badge ${ROLE_MAP[currentUser?.role]?.color || 'bg-secondary'} px-2 py-1`} style={{ fontSize: '13px' }}>
            {ROLE_MAP[currentUser?.role]?.label || currentUser?.role}
          </span>
        </div>
        <button 
          className="btn btn-sm btn-outline-primary fw-medium d-flex align-items-center gap-2"
          onClick={() => setIsDictOpen(true)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
          <span className="d-none d-sm-inline">Xem ma trận phân quyền</span>
        </button>
      </div>

      {/* Tích hợp Modal Từ Điển Phân Quyền */}
      <PermissionDictionaryModal 
        isOpen={isDictOpen} 
        onClose={() => setIsDictOpen(false)} 
        roles={roles} 
      />

      {/* ========================================================================= */}
      {/* UI GIAO DIỆN CHỌN TAB THEO PHONG CÁCH TỐI GIẢN (MINIMALIST) */}
      {/* ========================================================================= */}
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

      {/* ========================================================================= */}
      {/* RENDER MÀN HÌNH TƯƠNG ỨNG VỚI TAB */}
      {/* ========================================================================= */}
      
      {activeTab === 'roles' && isAdmin ? (
        <RoleManagementSection roles={roles} setRoles={setRoles} />
      ) : (
        <>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h4 className="fw-bold text-body-emphasis mb-1">Quản lý tài khoản người dùng</h4>
              <span className="text-body-secondary" style={{ fontSize: "14px" }}>Kiểm soát trạng thái hoạt động, cấp quyền và tổ chức phòng ban nhân viên.</span>
            </div>
            
            {/* KIỂM TRA QUYỀN THÊM TÀI KHOẢN (Hiển thị ổ khóa nếu không có quyền) */}
            {canCreateUser ? (
              <button className="btn btn-primary d-flex align-items-center gap-2" onClick={openCreateModal}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <span className="d-none d-sm-inline">Tạo tài khoản mới</span>
              </button>
            ) : (
              <span className="wrapper-tooltip" title="Tài khoản của bạn không được cấp quyền Thêm tài khoản hệ thống">
                <button className="btn btn-secondary d-flex align-items-center gap-2 btn-disabled" disabled>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  <span className="d-none d-sm-inline">Tạo tài khoản mới</span>
                </button>
              </span>
            )}
          </div>

          <div className="filter-bar">
            <div className="search-box">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input 
                type="text" 
                className="form-control form-control-sm bg-body border-1" 
                placeholder="Tìm kiếm theo họ tên hoặc hòm thư..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <select 
              className="form-select form-select-sm bg-body filter-select"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="">Lọc theo vai trò</option>
              {Object.entries(ROLE_MAP).map(([key, data]) => (
                <option key={key} value={key}>{data.label}</option>
              ))}
            </select>

            <select 
              className="form-select form-select-sm bg-body filter-select"
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
            >
              <option value="">Lọc theo phòng ban</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>

            {hasActiveFilters && (
              <button className="btn btn-outline-secondary btn-sm btn-reset-filter" onClick={resetFilters} title="Khôi phục trạng thái danh sách ban đầu">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                  <polyline points="3 3 3 8 8 8"></polyline>
                </svg>
                Hoàn tác bộ lọc
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
                    <tr><td colSpan="6" className="text-center py-5 text-body-secondary">Hệ thống dữ liệu trống hoặc không tìm thấy kết quả phù hợp.</td></tr>
                  ) : (
                    filteredUsers.map((user, index) => {
                      const roleData = ROLE_MAP[user.role] || { label: user.role, color: "bg-secondary", link: "#" };
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
                              <span className={`badge ${roleData.color}`}>{roleData.label}</span>
                              <a href={roleData.link} target="_blank" rel="noopener noreferrer" className="text-primary text-decoration-none" style={{ fontSize: "12px" }}>
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
                                <><span className="spinner-grow spinner-grow-sm bg-success" style={{width: '6px', height: '6px'}}></span> Đang hoạt động</>
                              ) : (
                                <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg> Đang khóa</>
                              )}
                            </span>
                          </td>
                          <td className="text-center">
                            
                            {/* KIỂM TRA QUYỀN SỬA USER TẠI MỖI DÒNG */}
                            {canEditUser ? (
                              <button className="action-btn btn-edit me-2" title="Chỉnh sửa tài khoản" onClick={() => openEditModal(user)} disabled={actionLoading}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                              </button>
                            ) : (
                              <span className="wrapper-tooltip me-2" title="Tài khoản của bạn không được cấp quyền Sửa thông tin nhân sự">
                                <button className="action-btn btn-disabled" disabled>
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                </button>
                              </span>
                            )}

                            {/* KIỂM TRA QUYỀN KHÓA/MỞ KHÓA TẠI MỖI DÒNG */}
                            {currentUser?.email !== user.email && (
                              canLockUser ? (
                                <button className={`action-btn ${user.status === 'active' ? 'btn-lock' : 'btn-unlock'}`} title={user.status === 'active' ? 'Khóa tài khoản' : 'Kích hoạt mở khóa'} onClick={() => toggleUserStatus(user.id, user.status)} disabled={actionLoading}>
                                  {user.status === 'active' ? (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                  ) : (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>
                                  )}
                                </button>
                              ) : (
                                <span className="wrapper-tooltip" title="Tài khoản của bạn không có quyền Khóa/Mở khóa nhân sự">
                                  <button className="action-btn btn-disabled" disabled>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                  </button>
                                </span>
                              )
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
              <span className="text-body-secondary" style={{ fontSize: "13px" }}>Tổng số ghi nhận hệ thống: {filteredUsers.length} tài khoản</span>
            </div>
          </div>

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
                      <label className="form-label" style={{ fontSize: "14px", fontWeight: "600" }}>Họ và tên nhân sự <span className="text-danger">*</span></label>
                      <input 
                        type="text" className={`form-control ${errors.name ? 'is-invalid' : ''}`} 
                        placeholder="Nhập họ và tên..." disabled={actionLoading}
                        {...register("name", { required: "Trường họ và tên bắt buộc nhập" })}
                      />
                      {errors.name && <div className="invalid-feedback">{errors.name.message}</div>}
                    </div>

                    <div className="mb-3">
                      <label className="form-label" style={{ fontSize: "14px", fontWeight: "600" }}>Hòm thư Email hệ thống <span className="text-danger">*</span></label>
                      <input 
                        type="email" className={`form-control ${errors.email ? 'is-invalid' : ''}`} 
                        placeholder="username@hto.vn" disabled={actionLoading || modalMode === "edit"} 
                        {...register("email", { 
                          required: "Hòm thư đăng nhập bắt buộc nhập",
                          pattern: { value: /\S+@\S+\.\S+/, message: "Định dạng hòm thư không đúng quy chuẩn mã định danh" }
                        })}
                      />
                      {errors.email && <div className="invalid-feedback">{errors.email.message}</div>}
                      {modalMode === "edit" && <small className="text-body-secondary mt-1 d-block">Khóa nghiệp vụ: Định danh email dùng làm tài khoản gốc không được sửa.</small>}
                    </div>

                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label" style={{ fontSize: "14px", fontWeight: "600" }}>Phân cấp vai trò <span className="text-danger">*</span></label>
                        <select 
                          className={`form-select ${errors.role ? 'is-invalid' : ''}`} disabled={actionLoading}
                          {...register("role", { required: "Bắt buộc chỉ định vai trò quyền" })}
                        >
                          <option value="">-- Chọn vai trò hệ thống --</option>
                          {Object.entries(ROLE_MAP).map(([key, data]) => (
                            <option key={key} value={key}>{data.label}</option>
                          ))}
                        </select>
                        {errors.role && <div className="invalid-feedback">{errors.role.message}</div>}
                      </div>

                      <div className="col-md-6 mb-3">
                        <label className="form-label" style={{ fontSize: "14px", fontWeight: "600" }}>Sơ đồ tổ chức phòng ban</label>
                        <select className="form-select mb-2" disabled={actionLoading} {...register("departmentSelect")}>
                          <option value="">-- Bỏ trống --</option>
                          {departments.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                          ))}
                          <option value="other" className="fw-bold text-primary">-- Nhập phòng ban mới --</option>
                        </select>
                        
                        {watchDepartmentSelect === "other" && (
                          <input 
                            type="text" className={`form-control ${errors.departmentInput ? 'is-invalid' : ''}`} 
                            placeholder="Nhập tên phòng ban mới..." autoFocus disabled={actionLoading}
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
      {/* ========================================================================= */}
      {/* --- END: MAIN COMPONENT (USER LIST & TAB CONTROLLER) --- */}
      {/* ========================================================================= */}
    </div>
  );
};