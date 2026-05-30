import { useMemo, useState } from "react";

const ADMIN_ROLE_ID = "69fc5af582ef85451120772a";
const DEPARTMENT_HEAD_ROLE_ID = "69fc5af582ef85451120772c";
const NOTIFICATIONS_STORAGE_KEY = "hto_internal_notifications";
const NOTIFICATION_READ_STORAGE_KEY = "hto_internal_notification_reads";

const ROLE_OPTIONS = [
  { id: "admin", roleId: ADMIN_ROLE_ID, label: "Admin" },
  { id: "bangiamdoc", roleId: "69fc5af582ef85451120772b", label: "Ban giám đốc" },
  { id: "truongbophan", roleId: DEPARTMENT_HEAD_ROLE_ID, label: "Trưởng bộ phận" },
  { id: "nhansu", roleId: "69fc5af582ef85451120772d", label: "Nhân sự" },
  { id: "daily", roleId: "69fc5af582ef85451120772e", label: "Đại lý" },
  { id: "congtacvien", roleId: "69fc5af682ef85451120772f", label: "Cộng tác viên" },
  { id: "user", roleId: "69fc5af782ef854511207730", label: "Người dùng" },
];

const USER_GROUP_OPTIONS = [
  { id: "all", label: "Tất cả người dùng" },
  { id: "internal", label: "Nội bộ" },
  { id: "partner", label: "Đối tác/Cộng tác viên" },
  { id: "manager", label: "Quản lý" },
];

const DEPARTMENT_OPTIONS = [
  { id: "dept-hanh-chinh", name: "Hành chính" },
  { id: "dept-nhan-su", name: "Nhân sự" },
  { id: "dept-ke-toan", name: "Kế toán" },
  { id: "dept-ho-so", name: "Hồ sơ" },
  { id: "dept-tuyen-sinh", name: "Tuyển sinh" },
];

const PRIORITY_OPTIONS = [
  { id: "normal", label: "Bình thường", className: "bg-body-secondary text-body" },
  { id: "important", label: "Quan trọng", className: "bg-warning-subtle text-warning" },
  { id: "urgent", label: "Khẩn", className: "bg-danger-subtle text-danger" },
];

const defaultNotifications = [
  {
    id: "notice-001",
    title: "Cập nhật quy trình upload tài liệu",
    content: "Từ hôm nay, tài liệu nội bộ cần được phân quyền trước khi chuyển trạng thái Đang dùng.",
    priority: "important",
    createdAt: "2026-05-30T08:00:00.000Z",
    createdBy: "Admin",
    target: { groups: ["internal"], roles: ["admin", "truongbophan", "nhansu"], departments: [] },
  },
  {
    id: "notice-002",
    title: "Lịch kiểm tra hồ sơ cuối tuần",
    content: "Bộ phận Hồ sơ kiểm tra danh sách tài liệu pending trước 17:00 hôm nay.",
    priority: "urgent",
    createdAt: "2026-05-30T09:30:00.000Z",
    createdBy: "Ban giám đốc",
    target: { groups: [], roles: [], departments: ["dept-ho-so"] },
  },
];

const emptyForm = {
  title: "",
  content: "",
  priority: "normal",
  groups: ["all"],
  roles: [],
  departments: [],
};

const isAdminUser = (user) => user?.role === "admin" || user?.roleId === ADMIN_ROLE_ID;

const canCreateNotification = (user) =>
  isAdminUser(user) || user?.role === "truongbophan" || user?.roleId === DEPARTMENT_HEAD_ROLE_ID;

const readNotifications = () => {
  try {
    const stored = JSON.parse(window.localStorage.getItem(NOTIFICATIONS_STORAGE_KEY) || "null");
    return Array.isArray(stored) ? stored : defaultNotifications;
  } catch {
    window.localStorage.removeItem(NOTIFICATIONS_STORAGE_KEY);
    return defaultNotifications;
  }
};

const writeNotifications = (notifications) => {
  window.localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
};

const readState = () => {
  try {
    return JSON.parse(window.localStorage.getItem(NOTIFICATION_READ_STORAGE_KEY) || "{}");
  } catch {
    window.localStorage.removeItem(NOTIFICATION_READ_STORAGE_KEY);
    return {};
  }
};

const writeState = (state) => {
  window.localStorage.setItem(NOTIFICATION_READ_STORAGE_KEY, JSON.stringify(state));
};

const getUserNotificationReadKey = (user) => user?.id || user?.email || user?.roleId || "guest";

const readUserState = (user) => {
  const state = readState();
  const userKey = getUserNotificationReadKey(user);

  return state[userKey] || {};
};

const writeUserState = (user, readByNotificationId) => {
  const state = readState();
  const userKey = getUserNotificationReadKey(user);

  writeState({
    ...state,
    [userKey]: readByNotificationId,
  });
};

const getUserGroupIds = (user) => {
  const role = user?.role || "";
  const groups = ["all"];

  if (["admin", "bangiamdoc", "truongbophan", "nhansu", "user"].includes(role)) {
    groups.push("internal");
  }

  if (["daily", "congtacvien"].includes(role)) {
    groups.push("partner");
  }

  if (["admin", "bangiamdoc", "truongbophan"].includes(role)) {
    groups.push("manager");
  }

  return groups;
};

const canSeeNotification = (user, notification) => {
  if (isAdminUser(user)) return true;

  const target = notification.target || {};
  const groups = Array.isArray(target.groups) ? target.groups : [];
  const roles = Array.isArray(target.roles) ? target.roles : [];
  const departments = Array.isArray(target.departments) ? target.departments : [];

  if (groups.includes("all")) return true;
  if (groups.some((groupId) => getUserGroupIds(user).includes(groupId))) return true;
  if (roles.includes(user?.role) || roles.includes(user?.roleId)) return true;

  return Boolean(user?.departmentId && departments.includes(user.departmentId));
};

const formatDateTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const getPriorityOption = (priority) =>
  PRIORITY_OPTIONS.find((option) => option.id === priority) || PRIORITY_OPTIONS[0];

export const NotificationsPage = ({ currentUser, selectedNotificationId }) => {
  const [notifications, setNotifications] = useState(() => readNotifications());
  const [readByNotificationId, setReadByNotificationId] = useState(() => readUserState(currentUser));
  const [manualActiveNotificationId, setManualActiveNotificationId] = useState(null);
  const [closedSelectedNotificationId, setClosedSelectedNotificationId] = useState(null);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const canCreate = canCreateNotification(currentUser);
  const activeNotificationId =
    manualActiveNotificationId ||
    (selectedNotificationId !== closedSelectedNotificationId ? selectedNotificationId : null);

  const visibleNotifications = useMemo(() => {
    return notifications
      .filter((notification) => canSeeNotification(currentUser, notification))
      .filter((notification) => {
        const isRead = Boolean(readByNotificationId[notification.id]);

        if (filter === "read") return isRead;
        if (filter === "unread") return !isRead;
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [currentUser, filter, notifications, readByNotificationId]);

  const unreadCount = visibleNotifications.filter(
    (notification) => !readByNotificationId[notification.id],
  ).length;

  const activeNotification = useMemo(() => {
    return notifications.find(
      (notification) =>
        notification.id === activeNotificationId && canSeeNotification(currentUser, notification),
    );
  }, [activeNotificationId, currentUser, notifications]);

  const updateReadState = (nextState) => {
    setReadByNotificationId(nextState);
    writeUserState(currentUser, nextState);
  };

  const markAsRead = (notificationId) => {
    updateReadState({ ...readByNotificationId, [notificationId]: new Date().toISOString() });
  };

  const openNotificationDetail = (notificationId) => {
    setManualActiveNotificationId(notificationId);
    setClosedSelectedNotificationId(null);
    if (!readByNotificationId[notificationId]) {
      markAsRead(notificationId);
    }
  };

  const closeNotificationDetail = () => {
    setManualActiveNotificationId(null);
    setClosedSelectedNotificationId(selectedNotificationId);
  };

  const markAsUnread = (notificationId) => {
    const nextState = { ...readByNotificationId };
    delete nextState[notificationId];
    updateReadState(nextState);
  };

  const markAllAsRead = () => {
    const nextState = { ...readByNotificationId };
    visibleNotifications.forEach((notification) => {
      nextState[notification.id] = nextState[notification.id] || new Date().toISOString();
    });
    updateReadState(nextState);
  };

  const toggleTarget = (scope, optionId) => {
    setForm((currentForm) => {
      const values = currentForm[scope];
      const nextValues = values.includes(optionId)
        ? values.filter((value) => value !== optionId)
        : [...values, optionId];

      return { ...currentForm, [scope]: nextValues };
    });
  };

  const createNotification = (e) => {
    e.preventDefault();
    const nextErrors = {};

    if (!form.title.trim()) nextErrors.title = "Vui lòng nhập tiêu đề thông báo.";
    if (!form.content.trim()) nextErrors.content = "Vui lòng nhập nội dung thông báo.";
    if (form.groups.length + form.roles.length + form.departments.length === 0) {
      nextErrors.target = "Vui lòng chọn ít nhất một nhóm nhận thông báo.";
    }

    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const nextNotification = {
      id: `notice-${Date.now()}`,
      title: form.title.trim(),
      content: form.content.trim(),
      priority: form.priority,
      createdAt: new Date().toISOString(),
      createdBy: currentUser?.fullName || currentUser?.name || currentUser?.email || "Người tạo",
      target: {
        groups: form.groups,
        roles: form.roles,
        departments: form.departments,
      },
    };
    const nextNotifications = [nextNotification, ...notifications];

    setNotifications(nextNotifications);
    writeNotifications(nextNotifications);
    setForm(emptyForm);
    setFormErrors({});
  };

  return (
    <div className="container-fluid pt-3 pb-3" style={{ maxWidth: "1600px" }}>
      <div className="app-page-head d-flex flex-wrap gap-3 align-items-center justify-content-between">
        <div>
          <h1 className="app-page-title mb-1">Thông báo nội bộ</h1>
          <div className="text-body-secondary" style={{ fontSize: "13px" }}>
            Danh sách thông báo, trạng thái đã đọc/chưa đọc và phân quyền người nhận.
          </div>
        </div>
        <div className="d-flex flex-wrap align-items-center gap-2">
          <span className="badge bg-primary-subtle text-primary">{unreadCount} chưa đọc</span>
          <button type="button" className="btn btn-sm btn-outline-primary" onClick={markAllAsRead}>
            Đánh dấu tất cả đã đọc
          </button>
        </div>
      </div>

      <div className="row g-3">
        {canCreate && (
          <div className="col-xxl-4">
            <div className="card">
              <div className="card-header border-0 pb-0">
                <h6 className="card-title mb-1">Tạo thông báo</h6>
              </div>
              <div className="card-body">
                <form onSubmit={createNotification} noValidate>
                  <div className="mb-3">
                    <label className="form-label">Tiêu đề</label>
                    <input
                      className={`form-control ${formErrors.title ? "is-invalid" : ""}`}
                      value={form.title}
                      onChange={(e) => setForm((currentForm) => ({ ...currentForm, title: e.target.value }))}
                    />
                    {formErrors.title && <div className="invalid-feedback">{formErrors.title}</div>}
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Nội dung</label>
                    <textarea
                      className={`form-control ${formErrors.content ? "is-invalid" : ""}`}
                      rows="4"
                      value={form.content}
                      onChange={(e) => setForm((currentForm) => ({ ...currentForm, content: e.target.value }))}
                    />
                    {formErrors.content && <div className="invalid-feedback">{formErrors.content}</div>}
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Mức độ</label>
                    <select
                      className="form-select"
                      value={form.priority}
                      onChange={(e) => setForm((currentForm) => ({ ...currentForm, priority: e.target.value }))}
                    >
                      {PRIORITY_OPTIONS.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <NotificationTargetGroup
                    label="Nhóm người dùng"
                    options={USER_GROUP_OPTIONS}
                    values={form.groups}
                    onToggle={(optionId) => toggleTarget("groups", optionId)}
                  />
                  <NotificationTargetGroup
                    label="Role"
                    options={ROLE_OPTIONS}
                    values={form.roles}
                    onToggle={(optionId) => toggleTarget("roles", optionId)}
                  />
                  <NotificationTargetGroup
                    label="Phòng ban"
                    options={DEPARTMENT_OPTIONS}
                    optionLabelKey="name"
                    values={form.departments}
                    onToggle={(optionId) => toggleTarget("departments", optionId)}
                  />
                  {formErrors.target && (
                    <div className="text-danger mt-2" style={{ fontSize: "12px" }}>
                      {formErrors.target}
                    </div>
                  )}

                  <div className="d-flex justify-content-end gap-2 mt-3">
                    <button type="button" className="btn btn-light border" onClick={() => setForm(emptyForm)}>
                      Làm mới
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Tạo thông báo
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        <div className={canCreate ? "col-xxl-8" : "col-12"}>
          <div className="card">
            <div className="card-header border-0 pb-0 d-flex flex-wrap justify-content-between align-items-center gap-2">
              <h6 className="card-title mb-0">Danh sách thông báo</h6>
              <div className="btn-group" role="group" aria-label="Lọc thông báo">
                {[
                  ["all", "Tất cả"],
                  ["unread", "Chưa đọc"],
                  ["read", "Đã đọc"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={`btn btn-sm ${filter === value ? "btn-primary" : "btn-outline-secondary"}`}
                    onClick={() => setFilter(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="card-body">
              <div className="d-flex flex-column gap-2">
                {visibleNotifications.map((notification) => {
                  const isRead = Boolean(readByNotificationId[notification.id]);
                  const priority = getPriorityOption(notification.priority);

                  return (
                    <div
                      key={notification.id}
                      className={`rounded border p-3 cursor-pointer ${isRead ? "bg-body" : "bg-primary-subtle border-primary-subtle"}`}
                      role="button"
                      tabIndex="0"
                      onClick={() => openNotificationDetail(notification.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openNotificationDetail(notification.id);
                        }
                      }}
                    >
                      <div className="d-flex flex-wrap justify-content-between align-items-start gap-2">
                        <div className="min-w-0">
                          <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                            <h6 className="mb-0 text-body-emphasis">{notification.title}</h6>
                            <span className={`badge ${priority.className}`}>{priority.label}</span>
                            {!isRead && <span className="badge bg-primary">Chưa đọc</span>}
                          </div>
                          <div className="text-body-secondary" style={{ fontSize: "12px" }}>
                            {notification.createdBy} · {formatDateTime(notification.createdAt)}
                          </div>
                        </div>
                        <button
                          type="button"
                          className={`btn btn-sm ${isRead ? "btn-outline-secondary" : "btn-outline-primary"}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isRead) {
                              markAsUnread(notification.id);
                            } else {
                              markAsRead(notification.id);
                            }
                          }}
                        >
                          {isRead ? "Đánh dấu chưa đọc" : "Đánh dấu đã đọc"}
                        </button>
                      </div>
                      <p className="mb-0 mt-2 text-body" style={{ whiteSpace: "pre-wrap" }}>
                        {notification.content}
                      </p>
                      <NotificationAudience target={notification.target} />
                      <div className="d-flex justify-content-end mt-3">
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            openNotificationDetail(notification.id);
                          }}
                        >
                          Xem chi tiết
                        </button>
                      </div>
                    </div>
                  );
                })}
                {visibleNotifications.length === 0 && (
                  <div className="rounded border bg-body-tertiary p-4 text-center text-body-secondary">
                    Không có thông báo phù hợp.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {activeNotification && (
        <>
          <div
            className="modal fade show d-block"
            role="dialog"
            aria-modal="true"
            aria-labelledby="notification-detail-title"
            tabIndex="-1"
            style={{ zIndex: 1060 }}
          >
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content border-0 shadow-lg">
                <div className="modal-header border-0 pb-0">
                  <div className="min-w-0">
                    <div className="text-primary fw-semibold mb-1" style={{ fontSize: "12px" }}>
                      Chi tiết thông báo
                    </div>
                    <h5 id="notification-detail-title" className="modal-title text-body-emphasis">
                      {activeNotification.title}
                    </h5>
                  </div>
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Đóng"
                    onClick={closeNotificationDetail}
                  />
                </div>
                <div className="modal-body">
                  <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
                    <span className={`badge ${getPriorityOption(activeNotification.priority).className}`}>
                      {getPriorityOption(activeNotification.priority).label}
                    </span>
                    <span className="text-body-secondary" style={{ fontSize: "12px" }}>
                      {activeNotification.createdBy || "Hệ thống"} · {formatDateTime(activeNotification.createdAt)}
                    </span>
                  </div>
                  <div className="rounded border bg-body-tertiary p-3">
                    <p className="mb-0 text-body" style={{ whiteSpace: "pre-wrap" }}>
                      {activeNotification.content}
                    </p>
                  </div>
                  <NotificationAudience target={activeNotification.target} />
                </div>
                <div className="modal-footer border-0 pt-0">
                  <button
                    type="button"
                    className="btn btn-light border"
                    onClick={closeNotificationDetail}
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div
            className="modal-backdrop fade show"
            style={{ zIndex: 1055 }}
            onClick={closeNotificationDetail}
          />
        </>
      )}
    </div>
  );
};

function NotificationTargetGroup({
  label,
  onToggle,
  optionLabelKey = "label",
  options,
  values,
}) {
  return (
    <div className="mb-3">
      <label className="form-label">{label}</label>
      <div className="d-flex flex-wrap gap-2 rounded border bg-body-tertiary p-2">
        {options.map((option) => (
          <label
            key={option.id}
            className="d-inline-flex align-items-center gap-2 rounded border bg-body px-2 py-1"
            style={{ fontSize: "12px" }}
          >
            <input
              type="checkbox"
              className="form-check-input m-0"
              checked={values.includes(option.id)}
              onChange={() => onToggle(option.id)}
            />
            <span>{option[optionLabelKey]}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function NotificationAudience({ target }) {
  const departments = DEPARTMENT_OPTIONS.filter((option) => target?.departments?.includes(option.id));
  const roles = ROLE_OPTIONS.filter((option) => target?.roles?.includes(option.id));
  const groups = USER_GROUP_OPTIONS.filter((option) => target?.groups?.includes(option.id));

  return (
    <div className="d-flex flex-wrap gap-2 mt-3">
      {[...groups, ...roles, ...departments].map((option) => (
        <span key={option.id} className="badge bg-body-secondary text-body">
          {option.label || option.name}
        </span>
      ))}
    </div>
  );
}
