import { useEffect, useRef, useState } from "react";

const ADMIN_ROLE_ID = "69fc5af582ef85451120772a";
const NOTIFICATIONS_STORAGE_KEY = "hto_internal_notifications";
const NOTIFICATION_READ_STORAGE_KEY = "hto_internal_notification_reads";

const ROLE_LABELS = {
  admin: "Admin",
  bangiamdoc: "Ban giam doc",
  truongbophan: "Truong bo phan",
  nhansu: "Nhan su",
  daily: "Dai ly",
  congtacvien: "Cong tac vien",
  user: "Nguoi dung",
};

const defaultNotifications = [
  {
    id: "notice-001",
    title: "Cập nhật quy trình upload tài liệu",
    content: "Tài liệu nội bộ cần được phân quyền trước khi chuyển trạng thái Đang dùng.",
    createdAt: "2026-05-30T08:00:00.000Z",
    priority: "important",
    target: { groups: ["internal"], roles: ["admin", "truongbophan", "nhansu"], departments: [] },
  },
  {
    id: "notice-002",
    title: "Lịch kiểm tra hồ sơ cuối tuần",
    content: "Bộ phận Hồ sơ kiểm tra danh sách tài liệu pending trước 17:00 hôm nay.",
    createdAt: "2026-05-30T09:30:00.000Z",
    priority: "urgent",
    target: { groups: [], roles: [], departments: ["dept-ho-so"] },
  },
];

const isAdminUser = (user) => user?.role === "admin" || user?.roleId === ADMIN_ROLE_ID;

const readNotifications = () => {
  try {
    const stored = JSON.parse(window.localStorage.getItem(NOTIFICATIONS_STORAGE_KEY) || "null");
    return Array.isArray(stored) ? stored : defaultNotifications;
  } catch {
    return defaultNotifications;
  }
};

const readNotificationState = () => {
  try {
    return JSON.parse(window.localStorage.getItem(NOTIFICATION_READ_STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
};

const writeNotificationState = (state) => {
  window.localStorage.setItem(NOTIFICATION_READ_STORAGE_KEY, JSON.stringify(state));
};

const getUserNotificationReadKey = (user) => user?.id || user?.email || user?.roleId || "guest";

const getUserReadNotifications = (user) => {
  const state = readNotificationState();
  const userKey = getUserNotificationReadKey(user);

  return state[userKey] || {};
};

const writeUserReadNotifications = (user, readByNotificationId) => {
  const state = readNotificationState();
  const userKey = getUserNotificationReadKey(user);

  writeNotificationState({
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

const getUnreadNotificationCount = (user) => {
  const readByNotificationId = getUserReadNotifications(user);

  return readNotifications().filter(
    (notification) => canSeeNotification(user, notification) && !readByNotificationId[notification.id],
  ).length;
};

const getVisibleNotifications = (user) => {
  const readByNotificationId = getUserReadNotifications(user);

  return readNotifications()
    .filter(
      (notification) => canSeeNotification(user, notification) && !readByNotificationId[notification.id],
    )
    .map((notification) => ({
      ...notification,
      isRead: false,
    }))
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
};

const markNotificationAsRead = (user, notificationId) => {
  const readByNotificationId = getUserReadNotifications(user);
  writeUserReadNotifications(user, {
    ...readByNotificationId,
    [notificationId]: readByNotificationId[notificationId] || new Date().toISOString(),
  });
};

const formatDateTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
};

export const Header = ({ user, onNavigate, onToggleSidebar, onToggleTheme, onLogout }) => {
  const displayName = user?.fullName || user?.name || "Nguoi dung";
  const displayEmail = user?.email || "";
  const displayRole = ROLE_LABELS[user?.role] || "Tai khoan";
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(() =>
    getUnreadNotificationCount(user),
  );
  const [notificationItems, setNotificationItems] = useState(() => getVisibleNotifications(user));
  const [isNotificationMenuOpen, setIsNotificationMenuOpen] = useState(false);
  const hasAutoOpenedNotifications = useRef(false);

  useEffect(() => {
    const refreshUnreadCount = () => {
      const nextUnreadCount = getUnreadNotificationCount(user);

      setUnreadNotificationCount(nextUnreadCount);
      setNotificationItems(getVisibleNotifications(user));

      if (nextUnreadCount > 0 && !hasAutoOpenedNotifications.current) {
        setIsNotificationMenuOpen(true);
        hasAutoOpenedNotifications.current = true;
      }
    };

    refreshUnreadCount();
    window.addEventListener("focus", refreshUnreadCount);
    document.addEventListener("visibilitychange", refreshUnreadCount);
    const timer = window.setInterval(refreshUnreadCount, 1500);

    return () => {
      window.removeEventListener("focus", refreshUnreadCount);
      document.removeEventListener("visibilitychange", refreshUnreadCount);
      window.clearInterval(timer);
    };
  }, [user]);

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <div className="app-header-start">
          <button
            className="app-toggler"
            type="button"
            onClick={onToggleSidebar}
          >
            <i className="fi fi-br-angle-small-left"></i>
          </button>
          <div className="app-header-brand">
            <a className="navbar-brand-logo" href="index-2.html">
              <img
                src="/assets/images/logo-HTO.png"
                alt="UrbanHub Admin Dashboard"
                width="40"
                height="40"
              />
            </a>
            <a
              className="navbar-brand-mini visible-light"
              href="index-2.html"
              style={{ textDecoration: "none" }}
            >
              <span
                style={{
                  fontSize: "18px",
                  fontWeight: "bold",
                  color: "#003366",
                  display: "inline-block",
                  lineHeight: "30px",
                }}
              >
                HT OCEAN GROUP
              </span>
            </a>
          </div>
          <form
            className="d-none d-xl-flex align-items-center h-100 w-lg-250px w-xxl-300px position-relative"
            action="#"
          >
            <input
              type="text"
              className="form-control px-sm-3 bg-light"
              placeholder="Search anything"
            />
            <button
              type="button"
              className="btn btn-sm text-primary border-0 position-absolute end-0 me-3 p-0"
            >
              <i className="fi fi-rr-search"></i>
            </button>
          </form>
        </div>
        <div className="app-header-end">
          <div className="d-flex align-items-center gap-sm-1 gap-0 px-lg-2 px-sm-2 px-1">
            <div className="position-relative text-end">
              <a
                href="#"
                className="btn btn-icon btn-action-gray position-relative"
                aria-label="Thông báo nội bộ"
                onClick={(e) => {
                  e.preventDefault();
                  setIsNotificationMenuOpen((isOpen) => !isOpen);
                }}
              >
                <i className="icon-bell">
                  <span className="visually-hidden">New alerts</span>
                </i>
                {unreadNotificationCount > 0 && (
                  <>
                    <span
                      className="position-absolute bg-danger border border-white rounded-circle"
                      style={{ width: "9px", height: "9px", top: "7px", right: "8px" }}
                    />
                    <span
                      className="position-absolute badge rounded-pill bg-danger"
                      style={{
                        minWidth: "18px",
                        height: "18px",
                        lineHeight: "12px",
                        fontSize: "10px",
                        top: "-2px",
                        right: "-4px",
                        padding: "3px 5px",
                      }}
                    >
                      {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
                    </span>
                  </>
                )}
              </a>
              {isNotificationMenuOpen && (
                <div
                  className="position-absolute end-0 mt-2 card shadow-lg border-0 text-start"
                  style={{ width: "340px", maxWidth: "calc(100vw - 24px)", zIndex: 1085 }}
                >
                  <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="mb-0">Thông báo nội bộ</h6>
                      <div className="text-body-secondary" style={{ fontSize: "12px" }}>
                        {unreadNotificationCount > 0
                          ? `${unreadNotificationCount} thông báo chưa đọc`
                          : "Không có thông báo mới"}
                      </div>
                    </div>
                    {unreadNotificationCount > 0 && (
                      <span className="badge bg-danger rounded-pill">
                        {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
                      </span>
                    )}
                  </div>
                  <div className="card-body p-2" style={{ maxHeight: "320px", overflowY: "auto" }}>
                    {notificationItems.slice(0, 6).map((notification) => (
                      <button
                        key={notification.id}
                        type="button"
                        className={`w-100 border-0 rounded text-start p-2 mb-1 ${
                          notification.isRead ? "bg-body" : "bg-primary-subtle"
                        }`}
                        onClick={() => {
                          markNotificationAsRead(user, notification.id);
                          setUnreadNotificationCount(getUnreadNotificationCount(user));
                          setNotificationItems(getVisibleNotifications(user));
                          setIsNotificationMenuOpen(false);
                          onNavigate?.("notifications", { notificationId: notification.id });
                        }}
                      >
                        <div className="d-flex align-items-start gap-2">
                          {!notification.isRead && (
                            <span
                              className="bg-danger rounded-circle flex-shrink-0 mt-1"
                              style={{ width: "8px", height: "8px" }}
                            />
                          )}
                          <div className="min-w-0">
                            <div className="fw-semibold text-body-emphasis text-truncate">
                              {notification.title || "Thông báo nội bộ"}
                            </div>
                            <div
                              className="text-body-secondary text-truncate"
                              style={{ fontSize: "12px" }}
                            >
                              {notification.content || "Bạn có thông báo mới."}
                            </div>
                            <div className="text-body-secondary mt-1" style={{ fontSize: "11px" }}>
                              {formatDateTime(notification.createdAt)}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                    {notificationItems.length === 0 && (
                      <div className="text-center text-body-secondary py-3" style={{ fontSize: "13px" }}>
                        Không có thông báo phù hợp.
                      </div>
                    )}
                  </div>
                  <div className="card-footer bg-white border-0 p-2">
                    <button
                      type="button"
                      className="btn btn-primary w-100"
                      onClick={() => {
                        setIsNotificationMenuOpen(false);
                        onNavigate?.("notifications");
                      }}
                    >
                      Xem tất cả thông báo
                    </button>
                  </div>
                </div>
              )}
            </div>
            <a
              href="email/inbox.html"
              className="btn btn-md btn-icon btn-action-gray"
            >
              <i className="icon-message-square-text"></i>
              <span className="visually-hidden">Inbox</span>
            </a>
            <a
              href="calendar.html"
              className="btn btn-md btn-icon btn-action-gray d-none d-sm-flex"
            >
              <i className="icon-calendar"></i>
              <span className="visually-hidden">Calendar</span>
            </a>
            <a
              href="#"
              className="btn btn-md btn-icon btn-action-gray theme-btn"
              onClick={onToggleTheme}
            >
              <i className="icon-sun-medium icon-light"></i>
              <i className="icon-moon icon-dark"></i>
            </a>
          </div>
          <div className="d-flex align-items-center gap-sm-2 gap-0 px-lg-2 px-sm-2 px-1">
            <div className="dropdown text-end">
              <a
                href="#"
                className="d-flex align-items-center py-2"
                data-bs-toggle="dropdown"
                data-bs-auto-close="outside"
                aria-expanded="true"
              >
                <div className="text-end me-2 d-none d-lg-inline-block">
                  <div className="fw-bold text-dark">{displayName}</div>
                  <small className="text-body d-block lh-sm">
                    <i className="fi fi-rr-angle-down text-3xs me-1"></i>{" "}
                    {displayRole}
                  </small>
                </div>
                <div className="avatar avatar-sm rounded-circle avatar-status-success">
                  <img src="/assets/images/avatar/avatar1.webp" alt="" />
                </div>
              </a>
              <ul className="dropdown-menu dropdown-menu-end w-225px mt-1">
                <li className="d-flex align-items-center p-2">
                  <div className="avatar avatar-sm rounded-circle">
                    <img src="/assets/images/avatar/avatar1.webp" alt="" />
                  </div>
                  <div className="ms-2">
                    <div className="fw-bold text-dark">{displayName}</div>
                    <small className="text-body d-block lh-sm">{displayEmail}</small>
                  </div>
                </li>
                <li>
                  <div className="dropdown-divider my-1"></div>
                </li>
                <li>
                  <a
                    className="dropdown-item d-flex align-items-center gap-2"
                    href="profile.html"
                  >
                    <i className="fi fi-rr-user scale-1x"></i> View Profile
                  </a>
                </li>
                <li>
                  <a
                    className="dropdown-item d-flex align-items-center gap-2"
                    href="pages/faq.html"
                  >
                    <i className="fi fi-rs-interrogation scale-1x"></i> Help
                    Center
                  </a>
                </li>
                <li>
                  <a
                    className="dropdown-item d-flex align-items-center gap-2"
                    href="profile.html"
                  >
                    <i className="fi fi-rr-settings scale-1x"></i> Account
                    Settings
                  </a>
                </li>
                <li>
                  <a
                    className="dropdown-item d-flex align-items-center gap-2"
                    href="pages/pricing.html"
                  >
                    <i className="fi fi-rr-usd-circle scale-1x"></i> Upgrade
                    Plan
                  </a>
                </li>
                <li>
                  <div className="dropdown-divider my-1"></div>
                </li>
                <li>
                  <a
                    className="dropdown-item d-flex align-items-center gap-2 text-danger"
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      onLogout?.();
                    }}
                  >
                    <i className="fi fi-sr-exit scale-1x"></i> Log Out
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
