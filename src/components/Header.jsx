import { useCallback, useEffect, useRef, useState } from "react";
import { authFetch, getAuthHeaders } from "../auth/session";
import { API_BASE_URL } from "../config/api";

const NOTIFICATIONS_CHANGED_EVENT = "notifications:changed";

const ROLE_LABELS = {
  admin: "Admin",
  bangiamdoc: "Ban giam doc",
  truongbophan: "Truong bo phan",
  nhansu: "Nhan su",
  daily: "Dai ly",
  congtacvien: "Cong tac vien",
  user: "Nguoi dung",
};

const COLLABORATOR_ROLE_ID = "69fc5af682ef85451120772f";
const PROFILE_EXTRAS_KEY = "hto_profile_extras";

// [Topbar - Liên hệ nhanh] Các kênh liên lạc chính thức của HT Ocean Group,
// hiển thị trực quan ngay trên thanh điều hướng để nhân viên/CTV/Đại lý tiện
// bấm vào liên hệ hoặc chia sẻ nhanh cho khách hàng khi cần. Nhấn vào sẽ mở
// tab mới tới đúng trang/kênh tương ứng.
const CONTACT_LINKS = [
  {
    key: "hotline",
    label: "Hotline 1800 9078",
    shortLabel: "Hotline",
    href: "https://hto.edu.vn/lien-he/",
    bg: "#16a34a",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    ),
  },
  {
    key: "zalo",
    label: "Nhắn tin qua Zalo",
    shortLabel: "Zalo",
    href: "https://zalo.me/2112176407138597287",
    bg: "#0068FF",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.49 10.2722v-.4496h1.3467v6.3218h-.7704a.576.576 0 01-.5763-.5729l-.0006.0005a3.273 3.273 0 01-1.9372.6321c-1.8138 0-3.2844-1.4697-3.2844-3.2823 0-1.8125 1.4706-3.2822 3.2844-3.2822a3.273 3.273 0 011.9372.6321l.0006.0005zM6.9188 7.7896v.205c0 .3823-.051.6944-.2995 1.0605l-.03.0343c-.0542.0615-.1815.206-.2421.2843L2.024 14.8h4.8948v.7682a.5764.5764 0 01-.5767.5761H0v-.3622c0-.4436.1102-.6414.2495-.8476L4.8582 9.23H.1922V7.7896h6.7266zm8.5513 8.3548a.4805.4805 0 01-.4803-.4798v-7.875h1.4416v8.3548H15.47zM20.6934 9.6C22.52 9.6 24 11.0807 24 12.9044c0 1.8252-1.4801 3.306-3.3066 3.306-1.8264 0-3.3066-1.4808-3.3066-3.306 0-1.8237 1.4802-3.3044 3.3066-3.3044zm-10.1412 5.253c1.0675 0 1.9324-.8645 1.9324-1.9312 0-1.065-.865-1.9295-1.9324-1.9295s-1.9324.8644-1.9324 1.9295c0 1.0667.865 1.9312 1.9324 1.9312zm10.1412-.0033c1.0737 0 1.945-.8707 1.945-1.9453 0-1.073-.8713-1.9436-1.945-1.9436-1.0753 0-1.945.8706-1.945 1.9436 0 1.0746.8697 1.9453 1.945 1.9453z" />
      </svg>
    ),
  },
  {
    key: "facebook",
    label: "Facebook HT Ocean Group",
    shortLabel: "Facebook",
    href: "https://www.facebook.com/htoceangroup?locale=vi_VN",
    bg: "#1877F2",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z" />
      </svg>
    ),
  },
  {
    key: "tiktok",
    label: "TikTok @ht_ocean_group",
    shortLabel: "TikTok",
    href: "https://www.tiktok.com/@ht_ocean_group",
    bg: "#000000",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0 1 15.54 3h-3.09v12.4a2.592 2.592 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6c0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64c0 3.33 2.76 5.7 5.69 5.7c3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48z" />
      </svg>
    ),
  },
];

const getInitials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "HT";

const readProfileExtras = (userId) => {
  try {
    const allExtras = JSON.parse(window.localStorage.getItem(PROFILE_EXTRAS_KEY) || "{}");
    return allExtras[userId] || {};
  } catch {
    return {};
  }
};

const HeaderAvatar = ({ avatarUrl, name, status = false }) => {
  const [imageError, setImageError] = useState(false);
  const showImage = avatarUrl && !imageError;

  useEffect(() => {
    setImageError(false);
  }, [avatarUrl]);

  return (
    <div className={`avatar avatar-sm rounded-circle ${status ? "avatar-status-success" : ""}`}>
      {showImage ? (
        <img src={avatarUrl} alt={name || "Avatar"} onError={() => setImageError(true)} />
      ) : (
        <div className="d-flex h-100 w-100 align-items-center justify-content-center rounded-circle bg-primary text-white fw-bold">
          {getInitials(name)}
        </div>
      )}
    </div>
  );
};

// Nút tròn 1 kênh liên hệ (Hotline/Zalo/Facebook/TikTok) - dùng chung cho cả
// hàng ngang trên desktop lẫn danh sách trong popover trên mobile.
const ContactLinkButton = ({ link, showLabel = false }) => (
  <a
    href={link.href}
    target="_blank"
    rel="noopener noreferrer"
    title={link.label}
    aria-label={link.label}
    className={`d-flex align-items-center text-decoration-none text-white ${showLabel ? "gap-2 px-2 py-1 w-100 rounded-2" : "justify-content-center rounded-circle flex-shrink-0"}`}
    style={
      showLabel
        ? { backgroundColor: "transparent" }
        : { backgroundColor: link.bg, width: "32px", height: "32px", boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }
    }
    onMouseEnter={(e) => { if (!showLabel) e.currentTarget.style.transform = "scale(1.08)"; }}
    onMouseLeave={(e) => { if (!showLabel) e.currentTarget.style.transform = "scale(1)"; }}
  >
    <span
      className="d-flex align-items-center justify-content-center flex-shrink-0 rounded-circle"
      style={showLabel ? { backgroundColor: link.bg, width: "28px", height: "28px", color: "#fff" } : { color: "#fff" }}
    >
      {link.icon}
    </span>
    {showLabel && <span className="fw-semibold text-body-emphasis" style={{ fontSize: "13px" }}>{link.label}</span>}
  </a>
);

// Cụm "Liên hệ nhanh" trên Topbar: hiển thị đầy đủ 4 icon màu thương hiệu
// thành 1 hàng ngang trên màn hình vừa/lớn; thu gọn thành 1 nút bấm mở popover
// trên màn hình nhỏ để tránh làm rối thanh điều hướng.
const HeaderContactLinks = ({ isMenuOpen, onToggleMenu, onCloseMenu }) => (
  <>
    {/* Desktop / tablet: hiển thị thẳng 4 icon màu thương hiệu trên thanh điều hướng */}
    <div className="d-none d-md-flex align-items-center gap-2 px-lg-2 px-sm-1">
      {CONTACT_LINKS.map((link) => (
        <ContactLinkButton key={link.key} link={link} />
      ))}
    </div>

    {/* Mobile: gộp thành 1 nút "Liên hệ nhanh" mở popover danh sách kênh */}
    <div className="d-md-none position-relative">
      <a
        href="#"
        className="btn btn-icon btn-action-gray"
        aria-label="Liên hệ nhanh"
        title="Liên hệ nhanh"
        onClick={(e) => {
          e.preventDefault();
          onToggleMenu();
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
      </a>
      {isMenuOpen && (
        <div
          className="position-absolute end-0 mt-2 card shadow-lg border-0 p-2"
          style={{ width: "220px", zIndex: 1085 }}
        >
          <div className="fw-bold text-body-secondary px-1 pb-1" style={{ fontSize: "11px" }}>
            LIÊN HỆ NHANH
          </div>
          <div className="d-flex flex-column gap-1">
            {CONTACT_LINKS.map((link) => (
              <div key={link.key} onClick={onCloseMenu}>
                <ContactLinkButton link={link} showLabel />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  </>
);

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

const normalizeNotificationsPayload = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.notifications)) return payload.notifications;
  return [];
};

const normalizeNotification = (notification) => {
  const data = notification?.data ?? notification ?? {};

  return {
    ...data,
    id: data.id || data._id,
    title: data.title || "Thông báo nội bộ",
    content: data.content || "Bạn có thông báo mới.",
    createdAt: data.createdAt || new Date().toISOString(),
    isRead: Boolean(data.isRead),
  };
};

async function requestNotifications(path = "", options = {}) {
  const response = await authFetch(`${API_BASE_URL}/notifications${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...options.headers,
    },
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.message || "Không thể tải thông báo nội bộ.");
  }

  return payload?.data ?? payload;
}

const getUnreadNotifications = async () =>
  normalizeNotificationsPayload(await requestNotifications())
    .map(normalizeNotification)
    .filter((notification) => notification.id && !notification.isRead)
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

const markNotificationAsRead = async (notificationId) =>
  await requestNotifications(`/${notificationId}/read`, { method: "PATCH" });

async function requestReferralInfo() {
  const response = await authFetch(`${API_BASE_URL}/auth/me/referral`, {
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.message || "Không thể tải mã giới thiệu.");
  }

  return payload?.data ?? payload;
}

const notifyNotificationsChanged = (detail = {}) => {
  window.dispatchEvent(
    new CustomEvent(NOTIFICATIONS_CHANGED_EVENT, {
      detail: { source: "header", ...detail },
    }),
  );
};

export const Header = ({ user, onNavigate, onToggleSidebar, onToggleTheme, onLogout }) => {
  const profileExtras = user?.id ? readProfileExtras(user.id) : {};
  const displayName = user?.fullName || user?.name || "Nguoi dung";
  const displayEmail = user?.email || "";
  const displayRole = ROLE_LABELS[user?.role] || "Tai khoan";
  const avatarUrl = user?.avatarUrl || profileExtras.avatarUrl || "";
  const isCollaborator = user?.role === "congtacvien" || user?.roleId === COLLABORATOR_ROLE_ID;
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [notificationItems, setNotificationItems] = useState([]);
  const [isNotificationMenuOpen, setIsNotificationMenuOpen] = useState(false);
  const [isContactMenuOpen, setIsContactMenuOpen] = useState(false);
  const [referralInfo, setReferralInfo] = useState(null);
  const [referralLoading, setReferralLoading] = useState(false);
  const [referralError, setReferralError] = useState("");
  const [referralCopied, setReferralCopied] = useState(false);
  const hasAutoOpenedNotifications = useRef(false);
  const isFetchingRef = useRef(false);

  const refreshUnreadCount = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const unreadNotifications = await getUnreadNotifications();
      const nextUnreadCount = unreadNotifications.length;

      setUnreadNotificationCount(nextUnreadCount);
      setNotificationItems(unreadNotifications);

      // if (nextUnreadCount > 0 && !hasAutoOpenedNotifications.current) {
      //   setIsNotificationMenuOpen(true);
      //   hasAutoOpenedNotifications.current = true;
      // }
    } catch {
      setUnreadNotificationCount(0);
      setNotificationItems([]);
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  const applyNotificationChange = useCallback((event) => {
    const { action, notificationId } = event.detail || {};

    if (action === "read" && notificationId) {
      setUnreadNotificationCount((count) => Math.max(0, count - 1));
      setNotificationItems((items) => items.filter((item) => item.id !== notificationId));
    } else if (action === "read-all") {
      setUnreadNotificationCount(0);
      setNotificationItems([]);
    } else if (action === "unread" || action === "created" || action === "refresh") {
      void refreshUnreadCount();
      return;
    }

    window.setTimeout(() => {
      void refreshUnreadCount();
    }, 250);
  }, [refreshUnreadCount]);

  useEffect(() => {
    void refreshUnreadCount();
    window.addEventListener("focus", refreshUnreadCount);
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, applyNotificationChange);
    document.addEventListener("visibilitychange", refreshUnreadCount);
    const timer = window.setInterval(refreshUnreadCount, 30000);

    return () => {
      window.removeEventListener("focus", refreshUnreadCount);
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, applyNotificationChange);
      document.removeEventListener("visibilitychange", refreshUnreadCount);
      window.clearInterval(timer);
    };
  }, [applyNotificationChange, refreshUnreadCount]);

  useEffect(() => {
    let isMounted = true;

    const loadReferralInfo = async () => {
      setReferralLoading(true);
      setReferralError("");

      try {
        const data = await requestReferralInfo();
        if (!isMounted) return;
        setReferralInfo({
          referralCode: data?.referralCode || "",
          referralUrl: data?.referralUrl || "",
        });
      } catch (error) {
        if (!isMounted) return;
        setReferralInfo(null);
        setReferralError(error instanceof Error ? error.message : "Không thể tải mã giới thiệu.");
      } finally {
        if (isMounted) {
          setReferralLoading(false);
        }
      }
    };

    if (user?.id && isCollaborator) {
      void loadReferralInfo();
    } else {
      setReferralInfo(null);
      setReferralError("");
    }

    return () => {
      isMounted = false;
    };
  }, [isCollaborator, user?.id]);

  const copyReferralUrl = async () => {
    const url = referralInfo?.referralUrl;
    if (!url) return;

    try {
      await navigator.clipboard.writeText(url);
      setReferralCopied(true);
      window.setTimeout(() => setReferralCopied(false), 1800);
    } catch {
      setReferralError("Không thể sao chép link giới thiệu.");
    }
  };

  const handleGoHome = () => {
    onNavigate?.("dashboard");
  };

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
            <button
              className="navbar-brand-logo border-0 bg-transparent p-0"
              type="button"
              onClick={handleGoHome}
            >
              <img
                src="/assets/images/logo-HTO.png"
                alt="UrbanHub Admin Dashboard"
                width="40"
                height="40"
              />
            </button>
            <button
              className="navbar-brand-mini visible-light"
              type="button"
              onClick={handleGoHome}
              style={{ textDecoration: "none", border: 0, background: "transparent", padding: 0 }}
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
            </button>
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
          <HeaderContactLinks
            isMenuOpen={isContactMenuOpen}
            onToggleMenu={() => setIsContactMenuOpen((isOpen) => !isOpen)}
            onCloseMenu={() => setIsContactMenuOpen(false)}
          />
          <div className="d-none d-md-block bg-body-secondary" style={{ width: "1px", height: "24px" }}></div>
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
                  className="header-notification-popover position-absolute end-0 mt-2 card shadow-lg border-0 text-start"
                  style={{ width: "340px", maxWidth: "calc(100vw - 24px)", zIndex: 1085 }}
                >
                  <div className="header-notification-head card-header bg-white border-0 d-flex justify-content-between align-items-center">
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
                  <div className="header-notification-body card-body p-2" style={{ maxHeight: "320px", overflowY: "auto" }}>
                    {notificationItems.slice(0, 6).map((notification) => (
                      <button
                        key={notification.id}
                        type="button"
                        className={`header-notification-item w-100 border-0 rounded-3 text-start p-2 mb-1 ${notification.isRead ? "bg-body" : "bg-primary-subtle"
                          }`}
                        onClick={() => {
                          setUnreadNotificationCount((count) => Math.max(0, count - 1));
                          setNotificationItems((items) => items.filter((item) => item.id !== notification.id));
                          void markNotificationAsRead(notification.id).catch(() => {
                            void refreshUnreadCount();
                          });
                          notifyNotificationsChanged({ action: "read", notificationId: notification.id });
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
                  <div className="header-notification-foot card-footer bg-white border-0 p-2">
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
                <HeaderAvatar avatarUrl={avatarUrl} name={displayName} status />
              </a>
              <ul className="dropdown-menu dropdown-menu-end mt-1" style={{ width: "280px" }}>
                <li className="d-flex align-items-center p-2">
                  <HeaderAvatar avatarUrl={avatarUrl} name={displayName} />
                  <div className="ms-2">
                    <div className="fw-bold text-dark">{displayName}</div>
                    <small className="text-body d-block lh-sm">{displayEmail}</small>
                  </div>
                </li>
                <li>
                  <div className="dropdown-divider my-1"></div>
                </li>
                {isCollaborator && (
                  <>
                    <li className="px-2 py-2">
                      <div className="rounded border bg-light p-2">
                        <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
                          <span className="fw-semibold text-dark" style={{ fontSize: "13px" }}>
                            Mã giới thiệu
                          </span>
                          {referralLoading ? (
                            <span className="spinner-border spinner-border-sm text-primary" role="status" aria-hidden="true"></span>
                          ) : (
                            <span className="badge bg-primary">
                              {referralInfo?.referralCode || "--"}
                            </span>
                          )}
                        </div>
                        {referralError ? (
                          <div className="text-danger" style={{ fontSize: "12px" }}>
                            {referralError}
                          </div>
                        ) : (
                          <>
                            <div className="text-body-secondary text-truncate mb-2" style={{ fontSize: "12px" }}>
                              {referralInfo?.referralUrl || "Đang tải link giới thiệu..."}
                            </div>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary w-100"
                              disabled={!referralInfo?.referralUrl || referralLoading}
                              onClick={copyReferralUrl}
                            >
                              <i className="fi fi-rr-copy-alt me-1"></i>
                              {referralCopied ? "Đã sao chép" : "Sao chép link"}
                            </button>
                          </>
                        )}
                      </div>
                    </li>
                    <li>
                      <div className="dropdown-divider my-1"></div>
                    </li>
                  </>
                )}
                <li>
                  <a
                    className="dropdown-item d-flex align-items-center gap-2"
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate?.("profile");
                    }}
                  >
                    <i className="fi fi-rr-user scale-1x"></i> Hồ sơ cá nhân
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
