import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  assignUserToDepartment,
  createDepartment,
  deleteDepartment,
  getAssignableUsers,
  getDepartmentMembers,
  getDepartments,
  removeUserFromDepartment,
  updateDepartment,
} from "./departmentMockData.jsx";
import "./DepartmentsPage.css";

const ADMIN_ROLE_ID = "69fc5af582ef85451120772a";

const isAdmin = (user) => user?.role === "admin" || user?.roleId === ADMIN_ROLE_ID;

export const DepartmentsPage = ({ currentUser }) => {
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [memberError, setMemberError] = useState("");
  const [modalMode, setModalMode] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm({
    mode: "onChange",
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const selectedDepartment = useMemo(
    () => departments.find((department) => department.id === selectedDepartmentId),
    [departments, selectedDepartmentId],
  );

  const filteredDepartments = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    if (!keyword) {
      return departments;
    }

    return departments.filter((department) =>
      `${department.name} ${department.description || ""}`.toLowerCase().includes(keyword),
    );
  }, [departments, searchTerm]);

  const assignableUsers = useMemo(() => {
    const memberIds = new Set(members.map((member) => member.id));

    return users.filter((user) => !memberIds.has(user.id));
  }, [members, users]);

  const loadDepartments = useCallback(async () => {
    setLoading(true);
    setApiError("");

    try {
      const [departmentData, userData] = await Promise.all([
        getDepartments(),
        getAssignableUsers(),
      ]);

      setDepartments(departmentData);
      setUsers(userData);
      setSelectedDepartmentId((currentId) =>
        departmentData.some((department) => department.id === currentId)
          ? currentId
          : departmentData[0]?.id || "",
      );
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Không thể tải danh sách phòng ban.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMembers = useCallback(async (departmentId) => {
    if (!departmentId) {
      setMembers([]);
      return;
    }

    setMembersLoading(true);
    setMemberError("");

    try {
      const memberData = await getDepartmentMembers(departmentId);
      setMembers(memberData);
    } catch (error) {
      setMemberError(error instanceof Error ? error.message : "Không thể tải nhân sự phòng ban.");
    } finally {
      setMembersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin(currentUser)) {
      void Promise.resolve().then(() => loadDepartments());
    }
  }, [currentUser, loadDepartments]);

  useEffect(() => {
    void Promise.resolve().then(() => loadMembers(selectedDepartmentId));
  }, [loadMembers, selectedDepartmentId]);

  const openCreateModal = () => {
    setApiError("");
    setModalMode("create");
    reset({ name: "", description: "" });
  };

  const openEditModal = (department) => {
    setApiError("");
    setSelectedDepartmentId(department.id);
    setModalMode("edit");
    reset({
      name: department.name,
      description: department.description || "",
    });
  };

  const closeModal = () => {
    setModalMode(null);
    reset({ name: "", description: "" });
  };

  const submitDepartment = async (data) => {
    const normalizedName = data.name.trim();

    if (!normalizedName) {
      setError("name", { type: "required", message: "Vui lòng nhập tên phòng ban." });
      return;
    }

    setActionLoading(true);
    setApiError("");

    try {
      if (modalMode === "create") {
        const createdDepartment = await createDepartment({
          name: normalizedName,
          description: data.description,
        });
        setDepartments((currentDepartments) => [createdDepartment, ...currentDepartments]);
        setSelectedDepartmentId(createdDepartment.id);
      } else if (selectedDepartment) {
        const updatedDepartment = await updateDepartment(selectedDepartment.id, {
          name: normalizedName,
          description: data.description,
        });
        setDepartments((currentDepartments) =>
          currentDepartments.map((department) =>
            department.id === updatedDepartment.id ? updatedDepartment : department,
          ),
        );
      }

      closeModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể lưu phòng ban.";

      if (message.toLowerCase().includes("tên phòng ban")) {
        setError("name", { type: "server", message });
      } else {
        setApiError(message);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteDepartment = async (department) => {
    if (!window.confirm(`Xóa phòng ban "${department.name}"? Nhân sự sẽ được gỡ khỏi phòng ban này.`)) {
      return;
    }

    setActionLoading(true);
    setApiError("");

    try {
      await deleteDepartment(department.id);
      const nextDepartments = departments.filter((item) => item.id !== department.id);
      setDepartments(nextDepartments);
      setSelectedDepartmentId(nextDepartments[0]?.id || "");
      setMembers([]);
      await loadDepartments();
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Không thể xóa phòng ban.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignUser = async (event) => {
    const userId = event.target.value;

    if (!selectedDepartmentId || !userId) {
      return;
    }

    setActionLoading(true);
    setMemberError("");

    try {
      await assignUserToDepartment(selectedDepartmentId, userId);
      event.target.value = "";
      await Promise.all([loadMembers(selectedDepartmentId), loadDepartments()]);
    } catch (error) {
      setMemberError(error instanceof Error ? error.message : "Không thể thêm nhân sự vào phòng ban.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveUser = async (userId) => {
    setActionLoading(true);
    setMemberError("");

    try {
      await removeUserFromDepartment(selectedDepartmentId, userId);
      await Promise.all([loadMembers(selectedDepartmentId), loadDepartments()]);
    } catch (error) {
      setMemberError(error instanceof Error ? error.message : "Không thể gỡ nhân sự khỏi phòng ban.");
    } finally {
      setActionLoading(false);
    }
  };

  if (!isAdmin(currentUser)) {
    return (
      <div className="container-fluid pt-5 text-center">
        <h2 className="text-danger">Từ chối truy cập</h2>
        <p className="text-body-secondary">Chỉ admin được truy cập màn hình quản lý phòng ban.</p>
      </div>
    );
  }

  return (
    <div className="departments-page container-fluid pt-3 pb-4" style={{ maxWidth: "1600px" }}>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h4 className="fw-bold text-body-emphasis mb-1">Quản lý phòng ban</h4>
          <span className="text-body-secondary" style={{ fontSize: "14px" }}>
            Danh sách phòng ban, thành viên và phân bổ nhân sự
          </span>
        </div>
        <button className="btn btn-primary d-flex align-items-center gap-2" onClick={openCreateModal}>
          <PlusIcon />
          Thêm phòng ban
        </button>
      </div>

      <div className="departments-toolbar">
        <div className="departments-search">
          <SearchIcon />
          <input
            type="text"
            className="form-control bg-body"
            placeholder="Tìm theo tên hoặc mô tả phòng ban..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
        <button className="btn btn-outline-secondary" onClick={loadDepartments} disabled={loading}>
          Làm mới
        </button>
      </div>

      {apiError && (
        <div className="alert alert-danger d-flex align-items-center gap-2" role="alert">
          <WarningIcon />
          {apiError}
        </div>
      )}

      <div className="departments-grid">
        <section className="card department-list-card">
          <div className="card-header bg-transparent border-bottom d-flex justify-content-between align-items-center">
            <span className="fw-bold text-body-emphasis">Danh sách phòng ban</span>
            <span className="badge text-bg-light">{filteredDepartments.length} phòng ban</span>
          </div>

          {loading ? (
            <LoadingState label="Đang tải phòng ban..." />
          ) : filteredDepartments.length === 0 ? (
            <EmptyState label="Chưa có phòng ban phù hợp." />
          ) : (
            <>
              <div className="table-responsive department-table-wrap">
                <table className="table custom-table mb-0">
                  <thead>
                    <tr>
                      <th>Tên phòng ban</th>
                      <th>Mô tả</th>
                      <th className="text-center">Nhân sự</th>
                      <th className="text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDepartments.map((department) => (
                      <tr
                        key={department.id}
                        className={`department-row ${selectedDepartmentId === department.id ? "active" : ""}`}
                        onClick={() => setSelectedDepartmentId(department.id)}
                      >
                        <td className="department-name-cell">
                          <span className="fw-bold text-body-emphasis">{department.name}</span>
                        </td>
                        <td className="text-body-secondary">{department.description || "—"}</td>
                        <td className="text-center">{department.memberCount || 0}</td>
                        <td onClick={(event) => event.stopPropagation()}>
                          <div className="department-actions">
                            <button
                              className="action-btn btn-edit"
                              title="Chỉnh sửa phòng ban"
                              onClick={() => openEditModal(department)}
                              disabled={actionLoading}
                            >
                              <EditIcon />
                            </button>
                            <button
                              className="action-btn btn-lock"
                              title="Xóa phòng ban"
                              onClick={() => handleDeleteDepartment(department)}
                              disabled={actionLoading}
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="department-mobile-list">
                {filteredDepartments.map((department) => (
                  <button
                    type="button"
                    key={department.id}
                    className={`department-mobile-item w-100 text-start bg-transparent border-0 ${selectedDepartmentId === department.id ? "active" : ""}`}
                    onClick={() => setSelectedDepartmentId(department.id)}
                  >
                    <div className="d-flex justify-content-between gap-2">
                      <strong>{department.name}</strong>
                      <span className="badge text-bg-light">{department.memberCount || 0} người</span>
                    </div>
                    <div className="text-body-secondary mt-1" style={{ fontSize: "13px" }}>
                      {department.description || "Chưa có mô tả"}
                    </div>
                    <div className="d-flex gap-2 mt-3">
                      <span className="btn btn-sm btn-outline-primary" onClick={() => openEditModal(department)}>
                        Sửa
                      </span>
                      <span className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteDepartment(department)}>
                        Xóa
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </section>

        <section className="card department-members-card">
          <div className="card-header bg-transparent border-bottom">
            <div className="d-flex justify-content-between align-items-start gap-2">
              <div>
                <span className="fw-bold text-body-emphasis d-block">
                  {selectedDepartment?.name || "Thành viên phòng ban"}
                </span>
                <span className="text-body-secondary" style={{ fontSize: "13px" }}>
                  {selectedDepartment ? "Quản lý nhân sự đang thuộc phòng ban này" : "Chọn một phòng ban để xem thành viên"}
                </span>
              </div>
              <span className="badge text-bg-primary">{members.length}</span>
            </div>
          </div>

          <div className="card-body">
            {selectedDepartment && (
              <div className="mb-3">
                <label className="form-label fw-semibold" style={{ fontSize: "14px" }}>
                  Thêm nhân sự vào phòng ban
                </label>
                <select
                  className="form-select"
                  onChange={handleAssignUser}
                  disabled={actionLoading || assignableUsers.length === 0}
                  defaultValue=""
                >
                  <option value="">
                    {assignableUsers.length === 0 ? "Không còn nhân sự để thêm" : "-- Chọn nhân sự --"}
                  </option>
                  {assignableUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.fullName} - {user.email}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {memberError && (
              <div className="alert alert-danger py-2" role="alert">
                {memberError}
              </div>
            )}

            {!selectedDepartment ? (
              <EmptyState label="Chưa chọn phòng ban." />
            ) : membersLoading ? (
              <LoadingState label="Đang tải thành viên..." />
            ) : members.length === 0 ? (
              <EmptyState label="Phòng ban này chưa có nhân sự." />
            ) : (
              <div className="member-list">
                {members.map((member) => (
                  <div className="member-item" key={member.id}>
                    <div className="d-flex align-items-center gap-2" style={{ minWidth: 0 }}>
                      <span className="member-avatar">{getInitials(member.fullName)}</span>
                      <div style={{ minWidth: 0 }}>
                        <div className="fw-bold text-body-emphasis text-truncate">{member.fullName}</div>
                        <div className="text-body-secondary text-truncate" style={{ fontSize: "12px" }}>
                          {member.email} · {member.role || "Nhân sự"}
                        </div>
                      </div>
                    </div>
                    <button
                      className="btn btn-sm btn-outline-danger flex-shrink-0"
                      onClick={() => handleRemoveUser(member.id)}
                      disabled={actionLoading}
                    >
                      Gỡ
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {modalMode && (
        <div className="custom-modal-overlay">
          <div className="custom-modal-content department-modal-content">
            <div className="custom-modal-header">
              <h5>{modalMode === "create" ? "Thêm phòng ban" : "Cập nhật phòng ban"}</h5>
              <button className="btn-close-modal" onClick={closeModal} type="button">
                <CloseIcon />
              </button>
            </div>
            <form noValidate onSubmit={handleSubmit(submitDepartment)}>
              <div className="custom-modal-body">
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Tên phòng ban <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control ${errors.name ? "is-invalid" : ""}`}
                    placeholder="Ví dụ: Tuyển Sinh"
                    disabled={actionLoading}
                    {...register("name", {
                      required: "Vui lòng nhập tên phòng ban.",
                      minLength: {
                        value: 2,
                        message: "Tên phòng ban phải có ít nhất 2 ký tự.",
                      },
                      maxLength: {
                        value: 120,
                        message: "Tên phòng ban không được vượt quá 120 ký tự.",
                      },
                      validate: (value) =>
                        value.trim().length > 0 || "Tên phòng ban không được chỉ gồm khoảng trắng.",
                    })}
                  />
                  {errors.name && <div className="invalid-feedback">{errors.name.message}</div>}
                </div>

                <div className="mb-0">
                  <label className="form-label fw-semibold">Mô tả</label>
                  <textarea
                    className="form-control"
                    rows="4"
                    placeholder="Mô tả ngắn chức năng của phòng ban..."
                    disabled={actionLoading}
                    {...register("description", {
                      maxLength: {
                        value: 500,
                        message: "Mô tả không được vượt quá 500 ký tự.",
                      },
                    })}
                  />
                  {errors.description && (
                    <div className="mt-1 text-danger" style={{ fontSize: "12px" }}>
                      {errors.description.message}
                    </div>
                  )}
                </div>
              </div>

              <div className="custom-modal-footer">
                <button type="button" className="btn btn-light border" onClick={closeModal} disabled={actionLoading}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary d-flex align-items-center gap-2" disabled={actionLoading}>
                  {actionLoading && <span className="spinner-border spinner-border-sm" aria-hidden="true"></span>}
                  {modalMode === "create" ? "Tạo phòng ban" : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

function LoadingState({ label }) {
  return (
    <div className="department-empty">
      <div className="spinner-border text-primary mb-2" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
      <div>{label}</div>
    </div>
  );
}

function EmptyState({ label }) {
  return (
    <div className="department-empty">
      <FolderIcon />
      <div className="mt-2">{label}</div>
    </div>
  );
}

function getInitials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
      <path d="M10 11v6"></path>
      <path d="M14 11v6"></path>
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
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

function WarningIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
    </svg>
  );
}
