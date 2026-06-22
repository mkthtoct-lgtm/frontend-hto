import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { TailwindDropdown } from "../components/ui/TailwindDropdown";
import {
  assignUserToDepartment,
  createDepartment,
  getAssignableUsers,
  getDepartmentMembers,
  getDepartments,
  removeUserFromDepartment,
  toggleDepartmentVisibility,
  updateDepartment,
} from "./departmentMockData.jsx";

const ADMIN_ROLE_ID = "69fc5af582ef85451120772a";
const DEPARTMENT_PAGE_SIZE = 10;
const MEMBER_PAGE_SIZE = 10;

const isAdmin = (user) => user?.role === "admin" || user?.roleId === ADMIN_ROLE_ID;
const isDepartmentHidden = (department) => Boolean(department?.isHidden || department?.hidden);

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
  const [assignUserValue, setAssignUserValue] = useState("");
  const [departmentPage, setDepartmentPage] = useState(1);
  const [memberPage, setMemberPage] = useState(1);

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
  const selectedDepartmentHidden = isDepartmentHidden(selectedDepartment);

  const filteredDepartments = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    if (!keyword) {
      return departments;
    }

    return departments.filter((department) =>
      `${department.name} ${department.description || ""}`.toLowerCase().includes(keyword),
    );
  }, [departments, searchTerm]);

  const departmentPageCount = Math.max(
    1,
    Math.ceil(filteredDepartments.length / DEPARTMENT_PAGE_SIZE),
  );
  const safeDepartmentPage = Math.min(departmentPage, departmentPageCount);
  const paginatedDepartments = useMemo(() => {
    return filteredDepartments.slice(
      (safeDepartmentPage - 1) * DEPARTMENT_PAGE_SIZE,
      safeDepartmentPage * DEPARTMENT_PAGE_SIZE,
    );
  }, [filteredDepartments, safeDepartmentPage]);

  const assignableUsers = useMemo(() => {
    const memberIds = new Set(members.map((member) => member.id));

    return users.filter((user) => !memberIds.has(user.id));
  }, [members, users]);

  const memberPageCount = Math.max(
    1,
    Math.ceil(members.length / MEMBER_PAGE_SIZE),
  );
  const safeMemberPage = Math.min(memberPage, memberPageCount);
  const paginatedMembers = useMemo(() => {
    return members.slice(
      (safeMemberPage - 1) * MEMBER_PAGE_SIZE,
      safeMemberPage * MEMBER_PAGE_SIZE,
    );
  }, [members, safeMemberPage]);

  const loadDepartments = useCallback(async (showSpinner = true) => {
    if (showSpinner === true) {
      setLoading(true);
    }
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
      if (showSpinner === true) {
        setLoading(false);
      }
    }
  }, []);

  const loadMembers = useCallback(async (departmentId, showSpinner = true) => {
    if (!departmentId) {
      setMembers([]);
      return;
    }

    if (showSpinner === true) {
      setMembersLoading(true);
    }
    setMemberError("");

    try {
      const memberData = await getDepartmentMembers(departmentId);
      setMembers(memberData);
    } catch (error) {
      setMemberError(error instanceof Error ? error.message : "Không thể tải nhân sự phòng ban.");
    } finally {
      if (showSpinner === true) {
        setMembersLoading(false);
      }
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

  useEffect(() => {
    setDepartmentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    setMemberPage(1);
  }, [selectedDepartmentId]);

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

  const handleToggleDepartmentVisibility = async (department) => {
    const departmentHidden = isDepartmentHidden(department);
    const actionLabel = departmentHidden ? "hiện lại" : "ẩn";

    if (!window.confirm(`Bạn muốn ${actionLabel} phòng ban "${department.name}"?`)) {
      return;
    }

    setActionLoading(true);
    setApiError("");

    try {
      const updatedDepartment = await toggleDepartmentVisibility(department);
      const nextIsHidden = isDepartmentHidden(updatedDepartment);
      setDepartments((currentDepartments) =>
        currentDepartments.map((item) =>
          item.id === department.id
            ? {
                ...item,
                ...updatedDepartment,
                isHidden: nextIsHidden,
                hidden: nextIsHidden,
              }
            : item,
        ),
      );
      setSelectedDepartmentId(department.id);
      await loadMembers(department.id);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : `Không thể ${actionLabel} phòng ban.`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignUser = async (userId) => {

    if (!selectedDepartmentId || !userId || isDepartmentHidden(selectedDepartment)) {
      return;
    }

    setActionLoading(true);
    setMemberError("");

    try {
      await assignUserToDepartment(selectedDepartmentId, userId);
      setAssignUserValue("");
      await Promise.all([
        loadMembers(selectedDepartmentId, false),
        loadDepartments(false),
      ]);
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
      if (isDepartmentHidden(selectedDepartment)) {
        throw new Error("Phòng ban đang ẩn nên không thể gỡ nhân sự.");
      }

      await removeUserFromDepartment(selectedDepartmentId, userId);
      await Promise.all([
        loadMembers(selectedDepartmentId, false),
        loadDepartments(false),
      ]);
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
    <div className="mx-auto w-full max-w-[1600px] px-3 pb-4 pt-3">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h4 className="fw-bold text-body-emphasis mb-1">Quản lý phòng ban</h4>
       
        </div>
        <button className="btn btn-primary d-flex align-items-center gap-2" onClick={openCreateModal}>
          <PlusIcon />
          Thêm phòng ban
        </button>
      </div>

      <div className="mb-4 grid grid-cols-1 items-center gap-3 md:grid-cols-[minmax(220px,1fr)_auto]">
        <div className="relative">
          <SearchIcon />
          <input
            type="text"
            className="form-control !pl-11 bg-body"
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

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <section className="card overflow-hidden rounded-xl border-0 shadow-sm">
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
              <div className="table-responsive hidden md:block">
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
                    {paginatedDepartments.map((department) => {
                      const departmentHidden = isDepartmentHidden(department);

                      return (
                      <tr
                        key={department.id}
                        className={`cursor-pointer ${departmentHidden ? "opacity-50" : ""} ${selectedDepartmentId === department.id ? "[&>td]:!bg-[var(--bs-primary-bg-subtle)]" : ""}`}
                        onClick={() => setSelectedDepartmentId(department.id)}
                      >
                        <td className="min-w-[220px]">
                          <div className="d-flex flex-wrap align-items-center gap-2">
                            <span className="fw-bold text-body-emphasis">{department.name}</span>
                            {departmentHidden && (
                              <span className="badge bg-warning-subtle text-warning">Đang ẩn</span>
                            )}
                          </div>
                        </td>
                        <td className="text-body-secondary">{department.description || "—"}</td>
                        <td className="text-center">{department.memberCount || 0}</td>
                        <td onClick={(event) => event.stopPropagation()}>
                          <div className="flex min-w-[76px] items-center justify-center gap-2 whitespace-nowrap">
                            <button
                              className="action-btn btn-edit h-8 w-8 flex-none"
                              title="Chỉnh sửa phòng ban"
                              onClick={() => openEditModal(department)}
                              disabled={actionLoading}
                            >
                              <EditIcon />
                            </button>
                            <button
                              className={`action-btn h-8 w-8 flex-none ${departmentHidden ? "btn-edit" : "btn-lock"}`}
                              title={departmentHidden ? "Hiện lại phòng ban" : "Ẩn phòng ban"}
                              onClick={() => handleToggleDepartmentVisibility(department)}
                              disabled={actionLoading}
                            >
                              {departmentHidden ? <EyeIcon /> : <EyeOffIcon />}
                            </button>
                          </div>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="block md:hidden">
                {paginatedDepartments.map((department) => {
                  const departmentHidden = isDepartmentHidden(department);

                  return (
                  <button
                    type="button"
                    key={department.id}
                    className={`w-100 border-0 border-b border-[var(--bs-border-color-translucent)] bg-transparent p-3 text-start ${departmentHidden ? "opacity-50" : ""} ${selectedDepartmentId === department.id ? "bg-[var(--bs-primary-bg-subtle)]" : ""}`}
                    onClick={() => setSelectedDepartmentId(department.id)}
                  >
                    <div className="d-flex justify-content-between gap-2">
                      <div className="d-flex flex-wrap align-items-center gap-2">
                        <strong>{department.name}</strong>
                        {departmentHidden && (
                          <span className="badge bg-warning-subtle text-warning">Đang ẩn</span>
                        )}
                      </div>
                      <span className="badge text-bg-light flex-shrink-0">{department.memberCount || 0} người</span>
                    </div>
                    <div className="text-body-secondary mt-1" style={{ fontSize: "13px" }}>
                      {department.description || "Chưa có mô tả"}
                    </div>
                    <div className="d-flex gap-2 mt-3">
                      <span className="btn btn-sm btn-outline-primary" onClick={(event) => {
                        event.stopPropagation();
                        openEditModal(department);
                      }}>
                        Sửa
                      </span>
                      <span className={`btn btn-sm ${departmentHidden ? "btn-outline-success" : "btn-outline-danger"}`} onClick={(event) => {
                        event.stopPropagation();
                        handleToggleDepartmentVisibility(department);
                      }}>
                        {departmentHidden ? "Hiện lại" : "Ẩn"}
                      </span>
                    </div>
                  </button>
                  );
                })}
              </div>
              {filteredDepartments.length > DEPARTMENT_PAGE_SIZE && (
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 p-3 border-top">
                  <span className="text-body-secondary" style={{ fontSize: "13px" }}>
                    Hiển thị {(safeDepartmentPage - 1) * DEPARTMENT_PAGE_SIZE + 1}-
                    {Math.min(safeDepartmentPage * DEPARTMENT_PAGE_SIZE, filteredDepartments.length)} trong{" "}
                    {filteredDepartments.length} phòng ban
                  </span>
                  <div className="btn-group gap-2" role="group" aria-label="Phân trang phòng ban">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => setDepartmentPage((page) => Math.max(1, page - 1))}
                      disabled={safeDepartmentPage === 1}
                    >
                      Trước
                    </button>
                    {Array.from({ length: departmentPageCount }, (_, index) => index + 1).map(
                      (page) => (
                        <button
                          key={page}
                          type="button"
                          className={`btn btn-sm ${page === safeDepartmentPage ? "btn-primary" : "btn-outline-secondary"}`}
                          onClick={() => setDepartmentPage(page)}
                        >
                          {page}
                        </button>
                      ),
                    )}
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() =>
                        setDepartmentPage((page) => Math.min(departmentPageCount, page + 1))
                      }
                      disabled={safeDepartmentPage === departmentPageCount}
                    >
                      Sau
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        <section className="card overflow-hidden rounded-xl border-0 shadow-sm">
          <div className="card-header bg-transparent border-bottom">
            <div className="d-flex justify-content-between align-items-start gap-2">
              <div>
                <span className="fw-bold text-body-emphasis d-block">
                  {selectedDepartment?.name || "Thành viên phòng ban"}
                  {selectedDepartmentHidden && (
                    <span className="badge bg-warning-subtle text-warning ms-2 align-middle">
                      Đang ẩn
                    </span>
                  )}
                </span>
                <span className="text-body-secondary" style={{ fontSize: "13px" }}>
                  {selectedDepartmentHidden
                    ? "Phòng ban đang bị ẩn. Hãy hiện lại trước khi phân bổ nhân sự."
                    : selectedDepartment
                      ? "Quản lý nhân sự đang thuộc phòng ban này"
                      : "Chọn một phòng ban để xem thành viên"}
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
                <TailwindDropdown
                  onChange={(value) => {
                    setAssignUserValue(value);
                    void handleAssignUser(value);
                  }}
                  options={[
                    {
                      label: selectedDepartmentHidden
                        ? "Phòng ban đang ẩn"
                        : assignableUsers.length === 0
                          ? "Không còn nhân sự để thêm"
                          : "-- Chọn nhân sự --",
                      value: "",
                    },
                    ...assignableUsers.map((user) => ({
                      label: `${user.fullName} - ${user.email}`,
                      value: user.id,
                    })),
                  ]}
                  placeholder={
                    selectedDepartmentHidden
                      ? "Phòng ban đang ẩn"
                      : assignableUsers.length === 0
                        ? "Không còn nhân sự để thêm"
                        : "-- Chọn nhân sự --"
                  }
                  disabled={actionLoading || selectedDepartmentHidden || assignableUsers.length === 0}
                  value={assignUserValue}
                />
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
              <>
                <div className="flex flex-col gap-2.5">
                  {paginatedMembers.map((member) => (
                    <div className="flex items-center justify-between gap-3 rounded-lg border border-[var(--bs-border-color-translucent)] p-2.5 max-md:items-start" key={member.id}>
                      <div className="d-flex align-items-center gap-2" style={{ minWidth: 0 }}>
                        <span className="inline-flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-full bg-[var(--bs-primary-bg-subtle)] font-bold text-[var(--bs-primary)]">{getInitials(member.fullName)}</span>
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
                        disabled={actionLoading || selectedDepartmentHidden}
                      >
                        Gỡ
                      </button>
                    </div>
                  ))}
                </div>
                {members.length > MEMBER_PAGE_SIZE && (
                  <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-3 pt-3 border-top">
                    <span className="text-body-secondary" style={{ fontSize: "13px" }}>
                      Hiển thị {(safeMemberPage - 1) * MEMBER_PAGE_SIZE + 1}-
                      {Math.min(safeMemberPage * MEMBER_PAGE_SIZE, members.length)} trong{" "}
                      {members.length} nhân sự
                    </span>
                    <div className="btn-group gap-2" role="group" aria-label="Phân trang thành viên">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => setMemberPage((page) => Math.max(1, page - 1))}
                        disabled={safeMemberPage === 1}
                      >
                        Trước
                      </button>
                      {Array.from({ length: memberPageCount }, (_, index) => index + 1).map(
                        (page) => (
                          <button
                            key={page}
                            type="button"
                            className={`btn btn-sm ${page === safeMemberPage ? "btn-primary" : "btn-outline-secondary"}`}
                            onClick={() => setMemberPage(page)}
                          >
                            {page}
                          </button>
                        ),
                      )}
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() =>
                          setMemberPage((page) => Math.min(memberPageCount, page + 1))
                        }
                        disabled={safeMemberPage === memberPageCount}
                      >
                        Sau
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </div>

      {modalMode && (
        <div className="fixed inset-0 z-[1050] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
          <div className="flex max-h-[90vh] w-full max-w-[560px] flex-col rounded-xl bg-[var(--bs-body-bg)] shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--bs-border-color-translucent)] p-5">
              <h5 className="m-0 font-bold text-[var(--bs-emphasis-color)]">{modalMode === "create" ? "Thêm phòng ban" : "Cập nhật phòng ban"}</h5>
              <button className="border-0 bg-transparent p-1 text-[var(--bs-secondary-color)] hover:text-[var(--bs-emphasis-color)]" onClick={closeModal} type="button">
                <CloseIcon />
              </button>
            </div>
            <form noValidate onSubmit={handleSubmit(submitDepartment)}>
              <div className="overflow-y-auto p-5">
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

              <div className="flex justify-end gap-2.5 border-t border-[var(--bs-border-color-translucent)] px-5 py-4">
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
    <div className="px-4 py-10 text-center text-[var(--bs-secondary-color)]">
      <div className="spinner-border text-primary mb-2" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
      <div>{label}</div>
    </div>
  );
}

function EmptyState({ label }) {
  return (
    <div className="px-4 py-10 text-center text-[var(--bs-secondary-color)]">
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
    <svg
      className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-[var(--bs-secondary-color)]"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
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

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"></path>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"></path>
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"></path>
      <line x1="1" y1="1" x2="23" y2="23"></line>
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
