import { useCallback, useEffect, useMemo, useState } from "react";
import { TailwindDropdown } from "../components/ui/TailwindDropdown";
import "./ChecklistPage.css";

import { API_BASE_URL } from "../config/api";
const USE_MOCK_WHEN_API_FAIL = true;

const MOCK_CHECKLISTS = [
  {
    id: "chk-onboarding-01",
    title: "Kiểm tra hồ sơ onboarding nhân sự mới",
    description: "Đối chiếu thông tin cá nhân, email công ty, vai trò và phòng ban trước khi kích hoạt tài khoản.",
    category: "Nhân sự",
    frequency: "Theo yêu cầu",
    priority: "high",
    status: "in_progress",
    progress: 65,
    dueDate: "2026-05-30",
    updatedAt: "2026-05-24",
    ownerName: "Phòng Nhân sự",
    assignedUserIds: [],
    allowedRoles: ["admin", "nhansu", "bangiamdoc"],
    editableForAssignee: true,
    sopId: "sop-hr-001",
    sopTitle: "SOP tạo và xác thực tài khoản nhân sự",
    tasks: [
      { id: "task-1", name: "Xác minh email và số điện thoại", done: true },
      { id: "task-2", name: "Gán vai trò hệ thống đúng nghiệp vụ", done: true },
      { id: "task-3", name: "Gán phòng ban và người quản lý trực tiếp", done: false },
      { id: "task-4", name: "Gửi thông tin đăng nhập ban đầu", done: false }
    ]
  },
  {
    id: "chk-doc-02",
    title: "Rà soát tài liệu SOP trước khi phát hành",
    description: "Kiểm tra version, người duyệt, tài liệu liên quan và phạm vi áp dụng trước khi chuyển trạng thái published.",
    category: "Tài liệu",
    frequency: "Hàng tuần",
    priority: "medium",
    status: "todo",
    progress: 20,
    dueDate: "2026-05-28",
    updatedAt: "2026-05-23",
    ownerName: "Ban điều hành",
    assignedUserIds: [],
    allowedRoles: ["admin", "bangiamdoc", "truongbophan", "nhansu"],
    editableForAssignee: false,
    sopId: "sop-doc-002",
    sopTitle: "SOP kiểm soát phiên bản tài liệu",
    tasks: [
      { id: "task-1", name: "Đọc lại nội dung nghiệp vụ", done: false },
      { id: "task-2", name: "Kiểm tra file đính kèm", done: true },
      { id: "task-3", name: "Xác nhận quyền xem theo role", done: false }
    ]
  },
  {
    id: "chk-system-03",
    title: "Kiểm tra log hoạt động bất thường",
    description: "Xem audit log, rà soát đăng nhập thất bại, thao tác khóa/mở khóa user và cập nhật quyền.",
    category: "Hệ thống",
    frequency: "Hàng ngày",
    priority: "high",
    status: "todo",
    progress: 0,
    dueDate: "2026-05-24",
    updatedAt: "2026-05-22",
    ownerName: "Admin hệ thống",
    assignedUserIds: [],
    allowedRoles: ["admin", "hethong"],
    editableForAssignee: false,
    sopId: "sop-sec-003",
    sopTitle: "SOP kiểm tra và xử lý audit log",
    tasks: [
      { id: "task-1", name: "Lọc log theo mức cảnh báo", done: false },
      { id: "task-2", name: "Xác nhận tài khoản thao tác", done: false },
      { id: "task-3", name: "Ghi nhận kết quả kiểm tra", done: false }
    ]
  },
  {
    id: "chk-done-04",
    title: "Đối soát danh sách phòng ban đang hiển thị",
    description: "Đảm bảo phòng ban ẩn không xuất hiện trong dropdown tạo tài khoản và báo cáo nhân sự.",
    category: "Phòng ban",
    frequency: "Hàng tháng",
    priority: "low",
    status: "completed",
    progress: 100,
    dueDate: "2026-05-20",
    updatedAt: "2026-05-20",
    ownerName: "Phòng Nhân sự",
    assignedUserIds: [],
    allowedRoles: ["all"],
    editableForAssignee: true,
    sopId: "sop-dept-004",
    sopTitle: "SOP quản lý phòng ban",
    tasks: [
      { id: "task-1", name: "Kiểm tra danh sách phòng ban", done: true },
      { id: "task-2", name: "Đối chiếu trạng thái ẩn/hiện", done: true },
      { id: "task-3", name: "Lưu kết quả rà soát", done: true }
    ]
  }
];

const ROLE_ALIASES = {
  admin: "admin",
  bangiamdoc: "bangiamdoc",
  truongbophan: "truongbophan",
  nhansu: "nhansu",
  daily: "daily",
  congtacvien: "congtacvien",
  hethong: "hethong"
};

const normalizeRoleKey = (roleValue) => {
  const normalized = String(roleValue || "")
    .trim()
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

  return ROLE_ALIASES[normalized] || normalized;
};

const getSafeId = (value) => {
  if (!value) return "";
  if (typeof value === "object") {
    return String(value._id || value.id || value.user_id || value.role_id || "");
  }

  return String(value);
};

const getCurrentRoleName = (currentUser) => {
  const rawRole = currentUser?.role?.name || currentUser?.roleName || currentUser?.role || currentUser?.role_key || "";
  return normalizeRoleKey(rawRole);
};

const normalizeArrayResponse = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const formatDate = (dateValue) => {
  if (!dateValue) return "—";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
};

const isOverdue = (item) => {
  if (!item?.dueDate || item.status === "completed") return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(item.dueDate);
  due.setHours(0, 0, 0, 0);

  return due < today;
};

const getComputedStatus = (item) => {
  if (isOverdue(item)) return "overdue";
  return item?.status || "todo";
};

const STATUS_META = {
  todo: { label: "Chưa làm", className: "checklist-status-todo" },
  in_progress: { label: "Đang xử lý", className: "checklist-status-progress" },
  completed: { label: "Hoàn thành", className: "checklist-status-done" },
  overdue: { label: "Quá hạn", className: "checklist-status-overdue" }
};

const PRIORITY_META = {
  high: { label: "Cao", className: "priority-high" },
  medium: { label: "Trung bình", className: "priority-medium" },
  low: { label: "Thấp", className: "priority-low" }
};

const canAccessItem = (item, currentUser) => {
  const roleName = getCurrentRoleName(currentUser);
  const userId = getSafeId(currentUser);

  const allowedRoles = (item.allowedRoles || item.allowed_roles || []).map(normalizeRoleKey);
  const assignedUserIds = (item.assignedUserIds || item.assigned_user_ids || []).map(getSafeId);

  if (roleName === "admin") return true;
  if (allowedRoles.includes("all") || allowedRoles.length === 0) return true;
  if (roleName && allowedRoles.includes(roleName)) return true;
  if (userId && assignedUserIds.includes(userId)) return true;

  return false;
};

const canUpdateItem = (item, currentUser) => {
  const roleName = getCurrentRoleName(currentUser);
  const userId = getSafeId(currentUser);

  const permissionNames = [
    ...(currentUser?.permissions || []),
    ...(currentUser?.permissionNames || []),
    ...(currentUser?.permission_names || [])
  ].map((permission) => String(permission).toLowerCase());

  const assignedUserIds = (item.assignedUserIds || item.assigned_user_ids || []).map(getSafeId);

  return (
    roleName === "admin" ||
    permissionNames.some((permission) =>
      ["checklist:update", "checklists:update", "checklist:complete", "checklists:complete"].includes(permission)
    ) ||
    (item.editableForAssignee !== false && userId && assignedUserIds.includes(userId))
  );
};

export const ChecklistPage = ({ currentUser }) => {
  const [checklists, setChecklists] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [apiMode, setApiMode] = useState("mock");
  const [updatingId, setUpdatingId] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const fetchChecklists = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_BASE_URL}/checklists`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("API checklist chưa sẵn sàng hoặc tài khoản hiện tại chưa có quyền truy cập.");
      }

      const payload = await response.json();
      const data = normalizeArrayResponse(payload);

      setChecklists(data);
      setSelectedId((currentId) => currentId || getSafeId(data[0]));
      setApiMode("real");
    } catch (err) {
      if (!USE_MOCK_WHEN_API_FAIL) {
        setError(err.message || "Không thể tải checklist.");
        setChecklists([]);
      } else {
        setChecklists(MOCK_CHECKLISTS);
        setSelectedId((currentId) => currentId || MOCK_CHECKLISTS[0]?.id || "");
        setApiMode("mock");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChecklists();
  }, [fetchChecklists]);

  const visibleChecklists = useMemo(() => {
    return checklists.filter((item) => canAccessItem(item, currentUser));
  }, [checklists, currentUser]);

  const categories = useMemo(() => {
    return Array.from(new Set(visibleChecklists.map((item) => item.category).filter(Boolean)));
  }, [visibleChecklists]);

  const filteredChecklists = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return visibleChecklists.filter((item) => {
      const computedStatus = getComputedStatus(item);

      const matchSearch =
        !term ||
        String(item.title || "").toLowerCase().includes(term) ||
        String(item.description || "").toLowerCase().includes(term) ||
        String(item.ownerName || item.owner_name || "").toLowerCase().includes(term);

      const matchStatus = statusFilter === "all" || computedStatus === statusFilter;
      const matchCategory = categoryFilter === "all" || item.category === categoryFilter;
      const matchPriority = priorityFilter === "all" || item.priority === priorityFilter;

      return matchSearch && matchStatus && matchCategory && matchPriority;
    });
  }, [visibleChecklists, searchTerm, statusFilter, categoryFilter, priorityFilter]);

  const selectedItem = useMemo(() => {
    return visibleChecklists.find((item) => getSafeId(item) === selectedId) || filteredChecklists[0] || visibleChecklists[0] || null;
  }, [visibleChecklists, filteredChecklists, selectedId]);

  const stats = useMemo(() => {
    const total = visibleChecklists.length;
    const done = visibleChecklists.filter((item) => item.status === "completed").length;
    const overdue = visibleChecklists.filter((item) => isOverdue(item)).length;
    const inProgress = visibleChecklists.filter((item) => item.status === "in_progress").length;

    return {
      total,
      done,
      overdue,
      inProgress
    };
  }, [visibleChecklists]);

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setCategoryFilter("all");
    setPriorityFilter("all");
  };

  const updateChecklistLocal = (itemId, updater) => {
    setChecklists((current) => current.map((item) => (getSafeId(item) === itemId ? updater(item) : item)));
  };

  const handleToggleComplete = async (item) => {
    const itemId = getSafeId(item);

    if (!itemId || !canUpdateItem(item, currentUser)) return;

    const nextCompleted = item.status !== "completed";
    const previousItem = { ...item };
    const nextStatus = nextCompleted ? "completed" : "in_progress";
    const nextProgress = nextCompleted ? 100 : Math.min(item.progress || 0, 80);

    updateChecklistLocal(itemId, (current) => ({
      ...current,
      status: nextStatus,
      progress: nextProgress,
      completedAt: nextCompleted ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString()
    }));

    if (apiMode === "mock") return;

    setUpdatingId(itemId);

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_BASE_URL}/checklists/${itemId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: nextStatus,
          progress: nextProgress,
          completedAt: nextCompleted ? new Date().toISOString() : null
        })
      });

      if (!response.ok) {
        throw new Error("Không thể cập nhật checklist trên máy chủ.");
      }

      const payload = await response.json();
      const savedItem = payload?.data || payload;

      if (savedItem && typeof savedItem === "object") {
        updateChecklistLocal(itemId, () => savedItem);
      }
    } catch (err) {
      updateChecklistLocal(itemId, () => previousItem);
      alert(err.message || "Cập nhật checklist thất bại.");
    } finally {
      setUpdatingId("");
    }
  };

  const hasActiveFilters =
    searchTerm ||
    statusFilter !== "all" ||
    categoryFilter !== "all" ||
    priorityFilter !== "all";

  return (
    <div className="checklist-page container-fluid pt-3 pb-4" style={{ maxWidth: "1600px" }}>
      <div className="checklist-hero mb-4">
        <div>
          <span className="page-eyebrow">Workflow checklist</span>
          <h4 className="fw-bold text-body-emphasis mb-1">Danh sách checklist công việc</h4>
          <p className="text-body-secondary mb-0">
            Theo dõi các đầu việc định kỳ, đánh dấu hoàn thành và lọc nhanh theo trạng thái, mức ưu tiên hoặc phòng ban nghiệp vụ.
          </p>
        </div>

        <div className="d-flex flex-wrap gap-2 align-items-center justify-content-end">
          <span className={`api-mode-badge ${apiMode === "real" ? "api-mode-real" : "api-mode-mock"}`}>
            {apiMode === "real" ? "Đang dùng API thật" : "Đang dùng dữ liệu giả"}
          </span>

          <button className="btn btn-outline-primary btn-sm" onClick={fetchChecklists} disabled={loading}>
            Đồng bộ lại
          </button>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-6 col-xl-3">
          <div className="checklist-stat-card">
            <span>Tổng checklist</span>
            <strong>{stats.total}</strong>
          </div>
        </div>

        <div className="col-6 col-xl-3">
          <div className="checklist-stat-card success">
            <span>Đã hoàn thành</span>
            <strong>{stats.done}</strong>
          </div>
        </div>

        <div className="col-6 col-xl-3">
          <div className="checklist-stat-card warning">
            <span>Đang xử lý</span>
            <strong>{stats.inProgress}</strong>
          </div>
        </div>

        <div className="col-6 col-xl-3">
          <div className="checklist-stat-card danger">
            <span>Quá hạn</span>
            <strong>{stats.overdue}</strong>
          </div>
        </div>
      </div>

      <div className="checklist-filter-bar mb-4">
        <div className="checklist-search-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>

          <input
            className="form-control form-control-sm bg-body"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Tìm theo tên checklist, mô tả hoặc người phụ trách..."
          />
        </div>

        <div className="checklist-filter-select"><TailwindDropdown onChange={setStatusFilter} options={[{ label: "Tất cả trạng thái", value: "all" }, { label: "Chưa làm", value: "todo" }, { label: "Đang xử lý", value: "in_progress" }, { label: "Hoàn thành", value: "completed" }, { label: "Quá hạn", value: "overdue" }]} placeholder="Tất cả trạng thái" value={statusFilter} /></div>
        <div className="checklist-filter-select"><TailwindDropdown onChange={setCategoryFilter} options={[{ label: "Tất cả nhóm việc", value: "all" }, ...categories.map((category) => ({ label: category, value: category }))]} placeholder="Tất cả nhóm việc" value={categoryFilter} /></div>
        <div className="checklist-filter-select"><TailwindDropdown onChange={setPriorityFilter} options={[{ label: "Tất cả ưu tiên", value: "all" }, { label: "Cao", value: "high" }, { label: "Trung bình", value: "medium" }, { label: "Thấp", value: "low" }]} placeholder="Tất cả ưu tiên" value={priorityFilter} /></div>

        {hasActiveFilters && (
          <button className="btn btn-outline-secondary btn-sm checklist-reset-btn" onClick={resetFilters}>
            Xóa lọc
          </button>
        )}
      </div>

      {error && <div className="alert alert-danger py-2">{error}</div>}

      <div className="row g-3 align-items-start">
        <div className="col-12 col-xl-8">
          <div className="card checklist-card border-0">
            <div className="table-responsive">
              <table className="table checklist-table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th style={{ width: "6%" }}>Done</th>
                    <th style={{ width: "36%" }}>Checklist</th>
                    <th style={{ width: "14%" }}>Nhóm</th>
                    <th style={{ width: "14%" }}>Hạn xử lý</th>
                    <th style={{ width: "14%" }}>Trạng thái</th>
                    <th style={{ width: "16%" }}>Tiến độ</th>
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
                  ) : filteredChecklists.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-5 text-body-secondary">
                        Không có checklist phù hợp với quyền xem hoặc bộ lọc hiện tại.
                      </td>
                    </tr>
                  ) : (
                    filteredChecklists.map((item) => {
                      const itemId = getSafeId(item);
                      const computedStatus = getComputedStatus(item);
                      const statusMeta = STATUS_META[computedStatus] || STATUS_META.todo;
                      const priorityMeta = PRIORITY_META[item.priority] || PRIORITY_META.low;
                      const canUpdate = canUpdateItem(item, currentUser);

                      return (
                        <tr
                          key={itemId}
                          className={selectedItem && getSafeId(selectedItem) === itemId ? "selected-row" : ""}
                          onClick={() => setSelectedId(itemId)}
                        >
                          <td onClick={(event) => event.stopPropagation()}>
                            <input
                              className="form-check-input checklist-checkbox"
                              type="checkbox"
                              checked={item.status === "completed"}
                              disabled={!canUpdate || updatingId === itemId}
                              title={canUpdate ? "Đánh dấu hoàn thành" : "Bạn chưa có quyền cập nhật checklist này"}
                              onChange={() => handleToggleComplete(item)}
                            />
                          </td>

                          <td>
                            <div className="fw-bold text-body-emphasis">{item.title}</div>
                            <div className="text-body-secondary small line-clamp-1">{item.description}</div>

                            <div className="d-flex flex-wrap gap-2 mt-2">
                              <span className={`priority-pill ${priorityMeta.className}`}>
                                Ưu tiên {priorityMeta.label}
                              </span>
                              <span className="soft-pill">{item.frequency || "Không lặp"}</span>
                            </div>
                          </td>

                          <td>{item.category || "—"}</td>

                          <td>
                            <span className={computedStatus === "overdue" ? "text-danger fw-semibold" : "text-body-secondary"}>
                              {formatDate(item.dueDate)}
                            </span>
                          </td>

                          <td>
                            <span className={`checklist-status-pill ${statusMeta.className}`}>
                              {statusMeta.label}
                            </span>
                          </td>

                          <td>
                            <div className="checklist-progress-label">{item.progress || 0}%</div>
                            <div
                              className="progress checklist-progress"
                              role="progressbar"
                              aria-valuenow={item.progress || 0}
                              aria-valuemin="0"
                              aria-valuemax="100"
                            >
                              <div className="progress-bar" style={{ width: `${item.progress || 0}%` }}></div>
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
        </div>

        <div className="col-12 col-xl-4">
          <div className="checklist-detail-panel">
            {selectedItem ? (
              <>
                <div className="d-flex justify-content-between gap-3 align-items-start mb-3">
                  <div>
                    <span className="page-eyebrow">Chi tiết checklist</span>
                    <h5 className="fw-bold text-body-emphasis mb-1">{selectedItem.title}</h5>
                    <p className="text-body-secondary mb-0">{selectedItem.description}</p>
                  </div>

                  <span className={`checklist-status-pill ${STATUS_META[getComputedStatus(selectedItem)]?.className || "checklist-status-todo"}`}>
                    {STATUS_META[getComputedStatus(selectedItem)]?.label || "Chưa làm"}
                  </span>
                </div>

                <div className="detail-meta-grid mb-4">
                  <div>
                    <span>Người phụ trách</span>
                    <strong>{selectedItem.ownerName || selectedItem.owner_name || "—"}</strong>
                  </div>

                  <div>
                    <span>Nhóm</span>
                    <strong>{selectedItem.category || "—"}</strong>
                  </div>

                  <div>
                    <span>Hạn xử lý</span>
                    <strong>{formatDate(selectedItem.dueDate)}</strong>
                  </div>

                  <div>
                    <span>Cập nhật</span>
                    <strong>{formatDate(selectedItem.updatedAt)}</strong>
                  </div>
                </div>

                <div className="linked-sop-box mb-4">
                  <span className="text-body-secondary small">SOP liên quan</span>
                  <div className="fw-bold text-body-emphasis">{selectedItem.sopTitle || "Chưa liên kết SOP"}</div>
                  {selectedItem.sopId && <div className="small text-primary mt-1">Mã SOP: {selectedItem.sopId}</div>}
                </div>

                <div className="task-stack">
                  {(selectedItem.tasks || []).map((task) => (
                    <div key={task.id || task.name} className="task-item">
                      <span className={`task-dot ${task.done ? "done" : ""}`}></span>
                      <span className={task.done ? "text-decoration-line-through text-body-secondary" : "text-body-emphasis"}>
                        {task.name}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  className="btn btn-primary w-100 mt-4"
                  disabled={!canUpdateItem(selectedItem, currentUser)}
                  onClick={() => handleToggleComplete(selectedItem)}
                >
                  {selectedItem.status === "completed" ? "Chuyển về đang xử lý" : "Đánh dấu hoàn thành"}
                </button>
              </>
            ) : (
              <div className="text-center py-5 text-body-secondary">Chọn một checklist để xem chi tiết.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
