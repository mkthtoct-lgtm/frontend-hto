// src/UserList/UserList.jsx
import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import "./UserList.css";

// --- CẤU HÌNH DANH SÁCH ROLE VÀ LINK CHỨC NĂNG TƯƠNG ỨNG ---
const ROLE_MAP = {
  admin: { label: "Admin", color: "bg-danger", link: "/role-links/admin" },
  bangiamdoc: { label: "Ban giám đốc", color: "bg-primary", link: "/role-links/ban-giam-doc" },
  truongbophan: { label: "Trưởng bộ phận", color: "bg-warning text-dark", link: "/role-links/truong-bo-phan" },
  nhansu: { label: "Nhân sự", color: "bg-info text-dark", link: "/role-links/nhan-su" },
  daily: { label: "Đại lý", color: "bg-success", link: "/role-links/dai-ly" },
  congtacvien: { label: "Cộng tác viên", color: "bg-secondary", link: "/role-links/cong-tac-vien" },
  hethong: { label: "Hệ thống", color: "bg-dark", link: "/role-links/he-thong" }
};

// --- MOCK DATA ---
const MOCK_USERS = [
  { id: 1, name: "Nguyễn Văn Admin", email: "admin@hto.vn", role: "admin", department: "Ban Giám Đốc", status: "active" },
  { id: 2, name: "Trần Thị B", email: "tranb@hto.vn", role: "nhansu", department: "Tuyển Sinh", status: "active" },
  { id: 3, name: "Lê Văn C", email: "lec@hto.vn", role: "daily", department: "Hồ Sơ", status: "locked" },
  { id: 4, name: "Phạm D", email: "phamd@hto.vn", role: "congtacvien", department: "Kế Toán", status: "active" },
  { id: 5, name: "Hoàng Thị E", email: "hoange@hto.vn", role: "truongbophan", department: "Marketing", status: "active" },
];

export const UserList = ({ currentUser }) => {
  // States quản lý Data
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // States quản lý Filter & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");

  // States quản lý Modal (Create/Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // 'create' | 'edit'
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Cấu hình React Hook Form
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    mode: "onTouched"
  });

  // Theo dõi giá trị của ô Select Phòng ban để biết khi nào hiện ô Input "Khác"
  const watchDepartmentSelect = watch("departmentSelect");

  // Kiểm tra xem có bộ lọc nào đang hoạt động không để hiện nút Hoàn tác
  const hasActiveFilters = searchTerm !== "" || filterRole !== "" || filterDepartment !== "";

  // Lấy danh sách phòng ban unique từ dữ liệu hiện tại để đưa vào bộ lọc & dropdown
  const departments = [...new Set(users.map(u => u.department).filter(Boolean))];

  // 1. Kiểm tra quyền truy cập
  if (!["admin", "bangiamdoc"].includes(currentUser?.role)) {
    return (
      <div className="container-fluid pt-5 text-center">
        <h2 className="text-danger">Từ chối truy cập</h2>
        <p className="text-body-secondary">Bạn không có quyền truy cập trang Quản lý tài khoản.</p>
      </div>
    );
  }

  // 2. Fetch danh sách Users
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      /* --- LOGIC API THẬT (Chỉ cần mở comment và thay link) ---
      const res = await fetch("https://api.domaincuaban.com/api/users", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Lỗi tải dữ liệu");
      setUsers(data);
      ------------------------- */

      // --- LOGIC GIẢ LẬP ---
      await new Promise(resolve => setTimeout(resolve, 800));
      setUsers(MOCK_USERS);
      // ---------------------
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // 3. Hàm Hoàn tác Filter
  const resetFilters = () => {
    setSearchTerm("");
    setFilterRole("");
    setFilterDepartment("");
  };

  // 4. Xử lý mở đóng Modal
  const openCreateModal = () => {
    setModalMode("create");
    setSelectedUser(null);
    reset({ 
      name: "", 
      email: "", 
      role: "", 
      departmentSelect: "", 
      departmentInput: "" 
    });
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setModalMode("edit");
    setSelectedUser(user);
    
    // Kiểm tra xem phòng ban của user có nằm trong danh sách hiện tại không
    const isKnownDepartment = departments.includes(user.department);
    const initialDeptSelect = isKnownDepartment ? user.department : (user.department ? "other" : "");
    const initialDeptInput = isKnownDepartment ? "" : (user.department || "");

    // Fill data vào form
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
    reset(); // Reset form
  };

  // 5. Xử lý Submit Form (Create / Update)
  const onSubmit = async (data) => {
    setActionLoading(true);
    try {
      // Logic xử lý Phòng ban: Nếu chọn 'other' thì lấy giá trị ở ô Input, ngược lại lấy giá trị ở ô Select
      const finalDepartment = data.departmentSelect === "other" ? data.departmentInput : data.departmentSelect;

      // Xây dựng Payload để ném cho API (Loại bỏ 2 trường phụ trợ Select/Input)
      const payload = {
        name: data.name,
        email: data.email,
        role: data.role,
        department: finalDepartment
      };

      /* --- LOGIC API THẬT ---
      const url = modalMode === "create" ? "https://api.domaincuaban.com/api/users" : `https://api.domaincuaban.com/api/users/${selectedUser.id}`;
      const method = modalMode === "create" ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Thao tác thất bại");
      // Cập nhật lại UI sau khi API thành công
      // Nếu có trả về data mới từ API: const savedUser = await res.json();
      ------------------------- */

      // --- LOGIC GIẢ LẬP ---
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (modalMode === "create") {
        const newUser = { ...payload, id: Date.now(), status: "active" };
        setUsers(prev => [newUser, ...prev]);
      } else {
        setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, ...payload } : u));
      }
      // ---------------------

      closeModal();
    } catch (err) {
      alert("Lỗi: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // 6. Xử lý Lock / Unlock tài khoản
  const toggleUserStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === "active" ? "locked" : "active";
    const confirmMsg = currentStatus === "active" ? "Bạn có chắc muốn KHÓA tài khoản này?" : "Bạn có chắc muốn MỞ KHÓA tài khoản này?";
    
    if (!window.confirm(confirmMsg)) return;

    setActionLoading(true);
    try {
      /* --- LOGIC API THẬT ---
      const res = await fetch(`https://api.domaincuaban.com/api/users/${userId}/status`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error("Cập nhật trạng thái thất bại");
      ------------------------- */

      // --- LOGIC GIẢ LẬP ---
      await new Promise(resolve => setTimeout(resolve, 600));
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
      // ---------------------
    } catch (err) {
      alert("Lỗi: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // 7. Lọc dữ liệu hiển thị
  const filteredUsers = users.filter(user => {
    const matchSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = filterRole ? user.role === filterRole : true;
    const matchDept = filterDepartment ? user.department === filterDepartment : true;
    return matchSearch && matchRole && matchDept;
  });

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
          <span className="d-none d-sm-inline">Thêm tài khoản</span>
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
          {departments.map(dept => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>

        {/* Nút Hoàn Tác (Chỉ hiện khi có filter) */}
        {hasActiveFilters && (
          <button 
            className="btn btn-outline-secondary btn-sm btn-reset-filter"
            onClick={resetFilters}
            title="Xóa bộ lọc"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
              <polyline points="3 3 3 8 8 8"></polyline>
            </svg>
            Hoàn tác
          </button>
        )}
      </div>

      {/* Main Table Card */}
      <div className="card table-card">
        <div className="table-responsive">
          <table className="table custom-table">
            <thead>
              <tr>
                <th style={{ width: "5%" }}>#</th>
                <th style={{ width: "25%" }}>Thông tin nhân viên</th>
                <th style={{ width: "25%" }}>Vai trò & Quyền</th>
                <th style={{ width: "15%" }}>Phòng ban</th>
                <th style={{ width: "15%" }}>Trạng thái</th>
                <th style={{ width: "15%", textAlign: "center" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-danger">{error}</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-body-secondary">
                    Không tìm thấy tài khoản nào phù hợp.
                  </td>
                </tr>
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
                            <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg> Đã khóa</>
                          )}
                        </span>
                      </td>
                      <td className="text-center">
                        <button 
                          className="action-btn btn-edit me-2" 
                          title="Chỉnh sửa"
                          onClick={() => openEditModal(user)}
                          disabled={actionLoading}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        
                        {/* Không cho tự khóa chính mình */}
                        {currentUser?.email !== user.email && (
                          <button 
                            className={`action-btn ${user.status === 'active' ? 'btn-lock' : 'btn-unlock'}`}
                            title={user.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                            onClick={() => toggleUserStatus(user.id, user.status)}
                            disabled={actionLoading}
                          >
                            {user.status === 'active' ? (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                            ) : (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>
                            )}
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
                    disabled={actionLoading || modalMode === "edit"} 
                    {...register("email", { 
                      required: "Vui lòng nhập email",
                      pattern: { value: /\S+@\S+\.\S+/, message: "Email không hợp lệ" }
                    })}
                  />
                  {errors.email && <div className="invalid-feedback">{errors.email.message}</div>}
                  {modalMode === "edit" && <small className="text-body-secondary mt-1 d-block">Email dùng để đăng nhập nên không thể thay đổi.</small>}
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

                  {/* Khu vực chọn / nhập phòng ban */}
                  <div className="col-md-6 mb-3">
                    <label className="form-label" style={{ fontSize: "14px", fontWeight: "600" }}>Phòng ban</label>
                    
                    {/* Dùng register bắt sự thay đổi của Select */}
                    <select 
                      className="form-select mb-2"
                      disabled={actionLoading}
                      {...register("departmentSelect")}
                    >
                      <option value="">-- Trống --</option>
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                      <option value="other" className="fw-bold text-primary">-- Nhập tên khác --</option>
                    </select>

                    {/* Nếu chọn Khác thì mới hiện ô Input này ra để người dùng tự gõ */}
                    {watchDepartmentSelect === "other" && (
                      <input 
                        type="text" 
                        className={`form-control ${errors.departmentInput ? 'is-invalid' : ''}`} 
                        placeholder="Nhập tên phòng ban..."
                        autoFocus
                        disabled={actionLoading}
                        {...register("departmentInput", {
                          required: watchDepartmentSelect === "other" ? "Vui lòng nhập tên phòng ban" : false
                        })}
                      />
                    )}
                    {errors.departmentInput && <div className="invalid-feedback">{errors.departmentInput.message}</div>}
                  </div>
                </div>

                {modalMode === "create" && (
                  <div className="alert alert-info py-2" style={{ fontSize: "13px" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="me-2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                    Mật khẩu mặc định sẽ được gửi qua email cho người dùng mới.
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