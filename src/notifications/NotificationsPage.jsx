import { useCallback, useEffect, useMemo, useState } from "react";
import { authFetch, getAuthHeaders } from "../auth/session";
import { API_BASE_URL } from "../config/api";
import { TailwindDropdown } from "../components/ui/TailwindDropdown";

const ADMIN_ROLE_ID = "69fc5af582ef85451120772a";
const DEPARTMENT_HEAD_ROLE_ID = "69fc5af582ef85451120772c";
const NOTIFICATIONS_CHANGED_EVENT = "notifications:changed";
const NOTIFICATION_PAGE_SIZE = 20;

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

const normalizeNotificationsPayload = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.notifications)) return payload.notifications;
  return [];
};

const normalizeNotification = (notification) => {
  const data = notification?.data ?? notification ?? {};
  const id = data.id || data._id;
  const createdBy =
    data.createdByName ||
    data.createdBy?.fullName ||
    data.createdBy?.name ||
    data.createdBy?.email ||
    data.createdBy ||
    "Hệ thống";

  return {
    ...data,
    id,
    title: data.title || "Thông báo nội bộ",
    content: data.content || "",
    priority: data.priority || "normal",
    createdAt: data.createdAt || new Date().toISOString(),
    createdBy,
    target: {
      groups: Array.isArray(data.target?.groups) ? data.target.groups : ["all"],
      roles: Array.isArray(data.target?.roles) ? data.target.roles : [],
      departments: Array.isArray(data.target?.departments) ? data.target.departments : [],
    },
    isRead: Boolean(data.isRead),
  };
};

const getReadStateFromNotifications = (notifications) =>
  notifications.reduce((state, notification) => {
    if (notification.isRead) {
      state[notification.id] = notification.readAt || notification.updatedAt || new Date().toISOString();
    }

    return state;
  }, {});

async function requestNotifications(path = "", options = {}) {
  const response = await authFetch(`${API_BASE_URL}/notifications${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...options.headers,
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.message || "Không thể xử lý thông báo nội bộ.");
  }

  return payload?.data ?? payload;
}

const getNotifications = async () =>
  normalizeNotificationsPayload(await requestNotifications())
    .map(normalizeNotification)
    .filter((notification) => notification.id);

const createNotificationRequest = async (input) =>
  normalizeNotification(
    await requestNotifications("", {
      method: "POST",
      body: input,
    }),
  );

const markNotificationReadRequest = async (notificationId) =>
  normalizeNotification(await requestNotifications(`/${notificationId}/read`, { method: "PATCH" }));

const markNotificationUnreadRequest = async (notificationId) =>
  normalizeNotification(await requestNotifications(`/${notificationId}/unread`, { method: "PATCH" }));

const markAllNotificationsReadRequest = async () =>
  await requestNotifications("/read-all", { method: "POST" });

const notifyNotificationsChanged = (detail = {}) => {
  window.dispatchEvent(
    new CustomEvent(NOTIFICATIONS_CHANGED_EVENT, {
      detail: { source: "page", ...detail },
    }),
  );
};

export const NotificationsPage = ({ currentUser, selectedNotificationId }) => {
  const [notifications, setNotifications] = useState([]);
  const [readByNotificationId, setReadByNotificationId] = useState({});
  const [manualActiveNotificationId, setManualActiveNotificationId] = useState(null);
  const [closedSelectedNotificationId, setClosedSelectedNotificationId] = useState(null);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [notificationPage, setNotificationPage] = useState(1);
  const canCreate = canCreateNotification(currentUser);
  const activeNotificationId =
    manualActiveNotificationId ||
    (selectedNotificationId !== closedSelectedNotificationId ? selectedNotificationId : null);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setApiError("");

    try {
      const notificationData = await getNotifications();
      setNotifications(notificationData);
      setReadByNotificationId(getReadStateFromNotifications(notificationData));
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Không thể tải thông báo nội bộ.");
      setNotifications([]);
      setReadByNotificationId({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    setNotificationPage(1);
  }, [filter]);

  useEffect(() => {
    const refreshFromExternalChange = (event) => {
      if (event.detail?.source !== "page") {
        void loadNotifications();
      }
    };

    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, refreshFromExternalChange);

    return () => {
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, refreshFromExternalChange);
    };
  }, [loadNotifications]);

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

  const notificationPageCount = Math.max(
    1,
    Math.ceil(visibleNotifications.length / NOTIFICATION_PAGE_SIZE),
  );
  const safeNotificationPage = Math.min(notificationPage, notificationPageCount);
  const paginatedNotifications = useMemo(() => {
    return visibleNotifications.slice(
      (safeNotificationPage - 1) * NOTIFICATION_PAGE_SIZE,
      safeNotificationPage * NOTIFICATION_PAGE_SIZE,
    );
  }, [visibleNotifications, safeNotificationPage]);

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
  };

  const markAsRead = (notificationId) => {
    updateReadState({ ...readByNotificationId, [notificationId]: new Date().toISOString() });
    setNotifications((currentNotifications) =>
      currentNotifications.map((notification) =>
        notification.id === notificationId ? { ...notification, isRead: true } : notification,
      ),
    );

    notifyNotificationsChanged({ action: "read", notificationId });
    void markNotificationReadRequest(notificationId)
      .then(() => notifyNotificationsChanged({ action: "refresh" }))
      .catch((error) => {
        setApiError(error instanceof Error ? error.message : "Không thể đánh dấu đã đọc.");
        void loadNotifications();
        notifyNotificationsChanged({ action: "refresh" });
      });
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
    setNotifications((currentNotifications) =>
      currentNotifications.map((notification) =>
        notification.id === notificationId ? { ...notification, isRead: false } : notification,
      ),
    );

    notifyNotificationsChanged({ action: "unread", notificationId });
    void markNotificationUnreadRequest(notificationId)
      .then(() => notifyNotificationsChanged({ action: "refresh" }))
      .catch((error) => {
        setApiError(error instanceof Error ? error.message : "Không thể đánh dấu chưa đọc.");
        void loadNotifications();
        notifyNotificationsChanged({ action: "refresh" });
      });
  };

  const markAllAsRead = () => {
    const nextState = { ...readByNotificationId };
    visibleNotifications.forEach((notification) => {
      nextState[notification.id] = nextState[notification.id] || new Date().toISOString();
    });
    updateReadState(nextState);
    setNotifications((currentNotifications) =>
      currentNotifications.map((notification) =>
        visibleNotifications.some((visibleNotification) => visibleNotification.id === notification.id)
          ? { ...notification, isRead: true }
          : notification,
      ),
    );

    notifyNotificationsChanged({ action: "read-all" });
    void markAllNotificationsReadRequest()
      .then(() => notifyNotificationsChanged({ action: "refresh" }))
      .catch((error) => {
        setApiError(error instanceof Error ? error.message : "Không thể đánh dấu tất cả đã đọc.");
        void loadNotifications();
        notifyNotificationsChanged({ action: "refresh" });
      });
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

  const createNotification = async (e) => {
    e.preventDefault();
    const nextErrors = {};

    if (!form.title.trim()) nextErrors.title = "Vui lòng nhập tiêu đề thông báo.";
    if (!form.content.trim()) nextErrors.content = "Vui lòng nhập nội dung thông báo.";
    if (form.groups.length + form.roles.length + form.departments.length === 0) {
      nextErrors.target = "Vui lòng chọn ít nhất một nhóm nhận thông báo.";
    }

    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setActionLoading(true);
    setApiError("");

    try {
      const nextNotification = await createNotificationRequest({
        title: form.title.trim(),
        content: form.content.trim(),
        priority: form.priority,
        target: {
          groups: form.groups,
          roles: form.roles,
          departments: form.departments,
        },
      });

      setNotifications((currentNotifications) => [nextNotification, ...currentNotifications]);
      setForm(emptyForm);
      setFormErrors({});
      notifyNotificationsChanged({ action: "created", notificationId: nextNotification.id });
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Không thể tạo thông báo.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="notifications-page mx-auto flex w-full max-w-[1600px] flex-col px-3 pt-3 pb-3 xl:h-full xl:overflow-hidden">
      <div className="app-page-head flex flex-shrink-0 flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="app-page-title mb-1">Thông báo nội bộ</h1>

        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="badge bg-primary-subtle text-primary">{unreadCount} chưa đọc</span>
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={loadNotifications} disabled={loading}>
            Làm mới
          </button>
          <button type="button" className="btn btn-sm btn-outline-primary" onClick={markAllAsRead} disabled={loading || visibleNotifications.length === 0}>
            Đánh dấu tất cả đã đọc
          </button>
        </div>
      </div>

      {apiError && (
        <div className="alert alert-danger py-2" role="alert">
          {apiError}
        </div>
      )}

      <div className="notifications-page-workspace grid min-h-0 flex-1 grid-cols-1 items-start gap-4 xl:grid-cols-12 xl:overflow-hidden">
        {canCreate && (
          <div className="notifications-page-panel min-w-0 min-h-0 xl:col-span-4 xl:h-full">
            <div className="card !flex min-h-0 w-full !flex-col overflow-hidden xl:h-full">
              <div className="card-header border-0 pb-0">
                <h6 className="card-title mb-1">Tạo thông báo</h6>
              </div>
              <div className="notifications-page-scroll card-body min-h-0 flex-1 overflow-y-auto overscroll-contain">
                <form onSubmit={createNotification} noValidate>
                  <div className="mb-3">
                    <label className="form-label">Tiêu đề</label>
                    <input
                      className={`form-control ${formErrors.title ? "is-invalid" : ""}`}
                      value={form.title}
                      disabled={actionLoading}
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
                      disabled={actionLoading}
                      onChange={(e) => setForm((currentForm) => ({ ...currentForm, content: e.target.value }))}
                    />
                    {formErrors.content && <div className="invalid-feedback">{formErrors.content}</div>}
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Mức độ</label>
                    <TailwindDropdown
                      disabled={actionLoading}
                      onChange={(value) => setForm((currentForm) => ({ ...currentForm, priority: value }))}
                      options={PRIORITY_OPTIONS.map((option) => ({
                        label: option.label,
                        value: option.id,
                      }))}
                      placeholder="Chọn mức độ"
                      value={form.priority}
                    />
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
                    <button type="button" className="btn btn-light border" onClick={() => setForm(emptyForm)} disabled={actionLoading}>
                      Làm mới
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                      {actionLoading && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>}
                      Tạo thông báo
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        <div className={`notifications-page-panel ${canCreate ? "min-w-0 min-h-0 xl:col-span-8 xl:h-full" : "min-w-0 min-h-0 xl:col-span-12 xl:h-full"}`}>
          <div className="card !flex min-h-0 w-full !flex-col overflow-hidden xl:h-full">
            <div className="card-header border-0 pb-0 flex flex-wrap items-center justify-between gap-2">
              <h6 className="card-title mb-0">Danh sách thông báo</h6>
              <div className="btn-group flex-shrink-0 gap-2" role="group" aria-label="Lọc thông báo">
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
            <div className="notifications-page-scroll card-body min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <div className="flex flex-col gap-2">
                {loading ? (
                  <div className="rounded border bg-body-tertiary p-4 text-center text-body-secondary">
                    <div className="spinner-border text-primary mb-2" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <div>Đang tải thông báo...</div>
                  </div>
                ) : paginatedNotifications.map((notification) => {
                  const isRead = Boolean(readByNotificationId[notification.id]);
                  const priority = getPriorityOption(notification.priority);

                  return (
                    <div
                      key={notification.id}
                      className={`min-w-0 cursor-pointer overflow-hidden rounded border p-3 ${isRead ? "bg-body" : "bg-primary-subtle border-primary-subtle"}`}
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
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <h6 className="mb-0 min-w-0 break-words text-body-emphasis">{notification.title}</h6>
                            <span className={`badge flex-shrink-0 ${priority.className}`}>{priority.label}</span>
                            {!isRead && <span className="badge bg-primary">Chưa đọc</span>}
                          </div>
                          <div className="break-words text-body-secondary" style={{ fontSize: "12px" }}>
                            {notification.createdBy} · {formatDateTime(notification.createdAt)}
                          </div>
                        </div>
                        <button
                          type="button"
                          className={`btn btn-sm flex-shrink-0 ${isRead ? "btn-outline-secondary" : "btn-outline-primary"}`}
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
                      <p className="mb-0 mt-2 break-words text-body" style={{ whiteSpace: "pre-wrap" }}>
                        {notification.content}
                      </p>
                      <NotificationAudience target={notification.target} />
                      <div className="mt-3 flex justify-end">
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
                {!loading && visibleNotifications.length === 0 && (
                  <div className="rounded border bg-body-tertiary p-4 text-center text-body-secondary">
                    Không có thông báo phù hợp.
                  </div>
                )}
              </div>
              {visibleNotifications.length > NOTIFICATION_PAGE_SIZE && (
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-3 pt-3 border-top">
                  <span className="text-body-secondary" style={{ fontSize: "13px" }}>
                    Hiển thị {(safeNotificationPage - 1) * NOTIFICATION_PAGE_SIZE + 1}-
                    {Math.min(safeNotificationPage * NOTIFICATION_PAGE_SIZE, visibleNotifications.length)} trong{" "}
                    {visibleNotifications.length} thông báo
                  </span>
                  <div className="btn-group gap-2" role="group" aria-label="Phân trang thông báo">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => setNotificationPage((page) => Math.max(1, page - 1))}
                      disabled={safeNotificationPage === 1}
                    >
                      Trước
                    </button>
                    {Array.from({ length: notificationPageCount }, (_, index) => index + 1).map(
                      (page) => (
                        <button
                          key={page}
                          type="button"
                          className={`btn btn-sm ${page === safeNotificationPage ? "btn-primary" : "btn-outline-secondary"}`}
                          onClick={() => setNotificationPage(page)}
                        >
                          {page}
                        </button>
                      ),
                    )}
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() =>
                        setNotificationPage((page) => Math.min(notificationPageCount, page + 1))
                      }
                      disabled={safeNotificationPage === notificationPageCount}
                    >
                      Sau
                    </button>
                  </div>
                </div>
              )}
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
    <div className="mt-3 flex min-w-0 flex-wrap gap-2 overflow-hidden">
      {[...groups, ...roles, ...departments].map((option) => (
        <span key={option.id} className="badge bg-body-secondary min-w-0 max-w-full break-words text-body">
          {option.label || option.name}
        </span>
      ))}
    </div>
  );
}
