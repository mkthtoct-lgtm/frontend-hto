import { useEffect, useState } from "react";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { Footer } from "./components/Footer";
import { DocumentsPage } from "./components/DocumentsPage";
import { LoginPage } from "./login/LoginPage";
import { RegisterPage } from "./login/RegisterPage";
import { ForgotPasswordPage } from "./login/ForgotPasswordPage";
import { ResetPasswordPage } from "./login/ResetPasswordPage";
import { AuthLayout } from "./login/AuthLayout";
import { UserList } from "./UserList/UserList";
import { DepartmentsPage } from "./departments/DepartmentsPage";
import { AuditLogPage } from "./auditLogs/AuditLogPage";

const ROLE_IDS = {
  ADMIN: "69fc5af582ef85451120772a",
};

const hasStoredSession = () => {
  const token = window.localStorage.getItem("token");
  const refreshToken = window.localStorage.getItem("refresh_token");

  return Boolean(token && refreshToken);
};

const clearStoredSession = () => {
  window.localStorage.removeItem("token");
  window.localStorage.removeItem("refresh_token");
  document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
};

const getAuthModeFromLocation = () => {
  const searchParams = new URLSearchParams(window.location.search);
  const hasResetToken =
    searchParams.has("token") || searchParams.has("resetToken");
  const normalizedPathname = `/${window.location.pathname
    .replace(/^\/+|\/+$/g, "")
    .replace(/\/{2,}/g, "/")}`;
  const isResetPasswordPath = normalizedPathname === "/reset-password";

  return hasResetToken && isResetPasswordPath ? "reset-password" : "login";
};

const resetAuthUrl = () => {
  window.history.replaceState({}, "", "/");
};

function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState(() => getAuthModeFromLocation()); // 'login', 'register', 'forgot', 'reset-password'
  const [theme, setTheme] = useState(() => {
    const storedTheme = window.localStorage.getItem("app-theme");

    if (storedTheme === "light" || storedTheme === "dark") {
      return storedTheme;
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-bs-theme", theme);
    window.localStorage.setItem("app-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (user) {
      return undefined;
    }

    const syncAuthModeFromUrl = () => {
      if (getAuthModeFromLocation() === "reset-password") {
        setAuthMode("reset-password");
      } else if (window.location.search === "" || window.location.pathname !== "/reset-password") {
        setAuthMode((currentMode) =>
          currentMode === "reset-password" ? "login" : currentMode,
        );
      }
    };

    syncAuthModeFromUrl();
    window.addEventListener("popstate", syncAuthModeFromUrl);

    return () => {
      window.removeEventListener("popstate", syncAuthModeFromUrl);
    };
  }, [user]);

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    const enforceAuthSession = () => {
      if (!hasStoredSession()) {
        setUser(null);
        setCurrentPage("dashboard");
        setAuthMode("login");
        clearStoredSession();
      }
    };

    enforceAuthSession();

    window.addEventListener("focus", enforceAuthSession);
    document.addEventListener("visibilitychange", enforceAuthSession);

    const sessionGuard = window.setInterval(enforceAuthSession, 1000);

    return () => {
      window.removeEventListener("focus", enforceAuthSession);
      document.removeEventListener("visibilitychange", enforceAuthSession);
      window.clearInterval(sessionGuard);
    };
  }, [user]);

  const handleToggleSidebar = (e) => {
    const togglerBtn = e?.currentTarget;
    togglerBtn?.classList?.toggle("active");

    if (window.innerWidth >= 1191) {
      const currentValue =
        document.documentElement.getAttribute("data-app-sidebar");
      const nextValue = currentValue === "full" ? "mini" : "full";
      document.documentElement.setAttribute("data-app-sidebar", nextValue);
      return;
    }

    document.querySelectorAll(".app-menubar").forEach((menubar) => {
      menubar.classList.toggle("open");
    });
  };

  const handleToggleTheme = (e) => {
    e?.preventDefault?.();
    setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
  };

  const handleLogin = (userData) => {
    if (!hasStoredSession()) {
      setUser(null);
      setAuthMode("login");
      return;
    }

    setUser(userData);
    // Điều hướng dựa trên vai trò
    if (userData.roleId === ROLE_IDS.ADMIN) {
      setCurrentPage("dashboard");
    } else {
      setCurrentPage("documents");
    }
  };

  const handleLogout = () => {
    // Xóa thông tin đăng nhập
    setUser(null);
    clearStoredSession();
    resetAuthUrl();
    setCurrentPage("dashboard");
    setAuthMode("login");
  };

  if (!user) {

    let authContent;
    if (authMode === "login") {
      authContent = (
        <LoginPage 
          onLogin={handleLogin} 
          onSwitchToRegister={() => setAuthMode("register")} 
          onSwitchToForgot={() => {
            resetAuthUrl();
            setAuthMode("forgot");
          }}
        />
      );
    } else if (authMode === "register") {
      authContent = (
        <RegisterPage 
          onRegister={handleLogin} 
          onSwitchToLogin={() => {
            resetAuthUrl();
            setAuthMode("login");
          }} 
        />
      );
    } else if (authMode === "forgot") {
      authContent = (
        <ForgotPasswordPage 
          onSwitchToLogin={() => {
            resetAuthUrl();
            setAuthMode("login");
          }} 
        />
      );
    } else if (authMode === "reset-password") {
      authContent = (
        <ResetPasswordPage 
          onSwitchToLogin={() => {
            resetAuthUrl();
            setAuthMode("login");
          }} 
        />
      );
    }

    return (
      <AuthLayout authMode={authMode} imageSrc="/assets/images/z7832613943587_bf4b220919f48d434d108e0de31e00e9.jpg">
        {authContent}
      </AuthLayout>
    );
  }


  return (
    <div className="page-layout bg-body-tertiary d-flex flex-column min-vh-100">
      <Header 
        user={user}
        onToggleSidebar={handleToggleSidebar} 
        onToggleTheme={handleToggleTheme} 
        onLogout={handleLogout}
      />
      <Sidebar
        currentUser={user}
        onNavigate={setCurrentPage}
        currentPage={currentPage}
        onToggleSidebar={handleToggleSidebar}
      />

      <main className="app-wrapper">
        {currentPage === "users" ? (
        // Truyền currentUser (chính là state 'user' ở App.jsx) xuống để check quyền
        <UserList currentUser={user} />
        ) : currentPage === "departments" ? (
          <DepartmentsPage currentUser={user} />
        ) : currentPage === "auditLogs" ? (
          <AuditLogPage currentUser={user} />
        ) : currentPage === "documents" ? (
          <DocumentsPage currentUser={user} />
        ) : (
          <div className="container-fluid pt-3 pb-1" style={{ maxWidth: "1600px" }}>
            
            {/* --- ROW 1: BANNER --- */}
            <div className="row mb-3 gx-2 gx-xl-3 align-items-stretch">
              {/* Box 1 nằm dọc trên Mobile (mb-3), ngang trên Tablet/Desktop */}
              <div className="col-12 col-md-8 col-lg-8 col-xl-8 mb-3 mb-md-0">
                <div className="card border-0 bg-transparent h-100">
                  <img src="./assets/images/banner-web-korean.jpg" alt="Banner Du học Hàn Quốc" className="img-fluid w-100 h-100 bg-primary-subtle" style={{ borderRadius: "12px", objectFit: "cover", minHeight: "180px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }} />
                </div>
              </div>

              {/* Box 2 nằm dọc dưới Box 1 trên Mobile */}
              <div className="col-12 col-md-4 col-lg-4 col-xl-4">
                <div className="card border-0 bg-transparent h-100">
                  <img src="./assets/images/banner-second.jpg" alt="HITO Support Box" className="img-fluid w-100 h-100 bg-body" style={{ borderRadius: "12px", objectFit: "cover", minHeight: "180px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }} />
                </div>
              </div>
            </div>

            {/* --- ROW 2: TỔNG QUAN, ĐIỀU KIỆN, THỦ TỤC --- */}
            <div className="row mb-3 gx-2 gx-xl-3 align-items-stretch">
              
              {/* TỔNG QUAN */}
              <div className="col-12 col-md-3 col-lg-3 col-xl-3 mb-3 mb-md-0">
                <div className="card border-0 h-100" style={{ borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", minHeight: "240px" }}>
                  <div className="card-body p-2 p-xl-3 d-flex flex-column justify-content-between">
                    <h6 className="fw-bold d-flex align-items-center mb-2 text-body-emphasis" style={{ fontSize: "14px" }}>
                      <img src="./assets/images/germany-banner.png" alt="Cờ Đức" className="bg-secondary-subtle border border-secondary-subtle" style={{ width: "20px", height: "14px", marginRight: "8px", borderRadius: "2px" }} />
                      TỔNG QUAN
                    </h6>
                    <p className="text-body-secondary mb-2" style={{ fontSize: "12px", lineHeight: "1.3" }}>
                      HTO cập nhật nhanh chóng và chính xác các thông tin du học Đức mới nhất.
                    </p>
                    <div className="d-flex align-items-center flex-grow-1">
                      <div className="w-40 text-center pe-1 pe-xl-2">
                        <img src="./assets/images/germany-map.png" alt="Bản đồ Đức" className="img-fluid bg-body-tertiary rounded" style={{ width: "100%", maxHeight: "110px", objectFit: "contain" }} />
                      </div>
                      <div className="w-60 d-grid gap-1 gap-xl-2" style={{ gridTemplateColumns: "1fr 1fr" }}>
                        <div className="text-center rounded p-1 bg-body-secondary overflow-hidden">
                          <div className="fw-bold text-body-emphasis text-truncate" style={{ fontSize: "13px" }}>157 key</div>
                          <div className="text-body-secondary" style={{ fontSize: "10px", lineHeight: "1.2" }}>đại học & cao đẳng</div>
                        </div>
                        <div className="text-center rounded p-1 bg-body-secondary overflow-hidden">
                          <div className="fw-bold text-body-emphasis text-truncate" style={{ fontSize: "13px" }}>24 sites</div>
                          <div className="text-body-secondary" style={{ fontSize: "10px", lineHeight: "1.2" }}>thi tiếng</div>
                        </div>
                        <div className="text-center rounded p-1 bg-body-secondary overflow-hidden">
                          <div className="fw-bold text-body-emphasis text-truncate" style={{ fontSize: "13px" }}>200 ngành</div>
                          <div className="text-body-secondary" style={{ fontSize: "10px", lineHeight: "1.2" }}>đào tạo</div>
                        </div>
                        <div className="text-center rounded p-1 bg-body-secondary overflow-hidden">
                          <div className="fw-bold text-body-emphasis text-truncate" style={{ fontSize: "13px" }}>Số liệu</div>
                          <div className="text-body-secondary" style={{ fontSize: "10px", lineHeight: "1.2" }}>chứng minh</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ĐIỀU KIỆN */}
              <div className="col-12 col-md-3 col-lg-3 col-xl-3 mb-3 mb-md-0">
                <div className="card border-0 h-100" style={{ borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", minHeight: "240px" }}>
                  <div className="card-body p-2 p-xl-3 d-flex flex-column justify-content-between">
                    <h6 className="fw-bold d-flex align-items-center mb-2 text-body-emphasis" style={{ fontSize: "14px" }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="text-primary me-2">
                        <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="currentColor"/>
                      </svg>
                      ĐIỀU KIỆN
                    </h6>
                    
                    {/* Bổ sung flex-wrap cho trường hợp màn iPad quá hẹp */}
                    <div className="d-flex flex-wrap justify-content-between mb-2 gap-1 gap-xl-2">
                      <div className="text-center rounded p-1 p-xl-2 flex-fill bg-primary-subtle text-primary overflow-hidden">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="mb-1">
                          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                        </svg>
                        <span className="fw-bold text-body-emphasis d-block text-truncate" style={{ fontSize: "11.5px" }}>Tuổi</span>
                      </div>
                      <div className="text-center rounded p-1 p-xl-2 flex-fill bg-warning-subtle text-warning overflow-hidden">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="mb-1">
                          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                        </svg>
                        <span className="fw-bold text-body-emphasis" style={{ fontSize: "11.5px", lineHeight: "1.2", display: "block" }}>B1/B2<br/>Tiếng Đức</span>
                      </div>
                      <div className="text-center rounded p-1 p-xl-2 flex-fill bg-body-secondary text-primary overflow-hidden">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="mb-1">
                          <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72l5 2.73 5-2.73v3.72z"/>
                        </svg>
                        <span className="fw-bold text-body-emphasis" style={{ fontSize: "11.5px", lineHeight: "1.2", display: "block" }}>Tốt nghiệp<br/>THPT</span>
                      </div>
                    </div>
                    
                    <div className="d-flex flex-wrap gap-1 gap-xl-2">
                      <div className="flex-fill text-white rounded p-1 px-xl-2 py-xl-2 d-flex justify-content-center align-items-center text-nowrap overflow-hidden" style={{ backgroundColor: "#5b6cf9", fontSize: "11.5px" }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="me-1 d-none d-xl-block"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg> 
                        <span className="text-truncate">Tờ tiền CM</span>
                      </div>
                      <div className="flex-fill text-white rounded p-1 px-xl-2 py-xl-2 d-flex justify-content-center align-items-center text-nowrap overflow-hidden" style={{ backgroundColor: "#10b981", fontSize: "11.5px" }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="me-1 d-none d-xl-block"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>
                        <span className="text-truncate">Số tiền CM</span>
                      </div>
                      <div className="flex-fill text-white rounded p-1 px-xl-2 py-xl-2 d-flex justify-content-center align-items-center text-nowrap overflow-hidden" style={{ backgroundColor: "#5b6cf9", fontSize: "11.5px", opacity: 0.9 }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="me-1 d-none d-xl-block"><path d="M12 1L3 6v2h18V6l-9-5zm0 2.18l5.36 2.82H6.64L12 3.18zM5 10h2v7H5v-7zm6 0h2v7h-2v-7zm6 0h2v7h-2v-7zM3 19h18v2H3v-2z"/></svg>
                        <span className="text-truncate">TK phong tỏa</span>
                      </div>
                      <div className="flex-fill text-white rounded p-1 px-xl-2 py-xl-2 d-flex justify-content-center align-items-center text-nowrap overflow-hidden" style={{ backgroundColor: "#10b981", fontSize: "11.5px", opacity: 0.9 }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="me-1 d-none d-xl-block"><path d="M21 7.28V5c0-1.1-.9-2-2-2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-2.28c.59-.35 1-.98 1-1.72V9c0-.74-.41-1.37-1-1.72zM20 9v6h-7V9h7zM5 19V5h14v2h-6c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h6v2H5z"/><circle cx="16" cy="12" r="1.5"/></svg>
                        <span className="text-truncate">Sổ tiết kiệm</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* THỦ TỤC */}
              <div className="col-12 col-md-6 col-lg-6 col-xl-6">
                <div className="card border-0 h-100" style={{ borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", minHeight: "240px" }}>
                  <div className="card-body p-2 p-xl-3 d-flex flex-column overflow-hidden">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="fw-bold d-flex align-items-center mb-0 text-body-emphasis" style={{ fontSize: "14px" }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="text-primary me-2" fill="currentColor">
                          <path d="M19 3H14.82C14.4 1.84 13.3 1 12 1C10.7 1 9.6 1.84 9.18 3H5C3.9 3 3 3.9 3 5V20C3 21.1 3.9 22 5 22H19C20.1 22 21 21.1 21 20V5C21 3.9 20.1 3 19 3ZM12 3C12.55 3 13 3.45 13 4C13 4.55 12.55 5 12 5C11.45 5 11 4.55 11 4C11 3.45 11.45 3 12 3ZM16 15H8V13H16V15ZM16 11H8V9H16V11Z" />
                        </svg>
                        THỦ TỤC
                      </h6>
                      <span className="text-body-secondary d-none d-md-inline text-truncate" style={{ fontSize: "11px" }}>Cập nhật: 15/03/2026</span>
                    </div>

                    <div className="d-flex justify-content-between align-items-start mt-auto mb-auto overflow-x-auto pb-2" style={{ minWidth: "100%" }}>
                      <div className="d-flex justify-content-between w-100" style={{ minWidth: "400px" }}>
                        {[
                          { step: 1, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>, title: "Tư vấn\nban đầu", sub: "20 min." },
                          { step: 2, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm-2 14l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>, title: "Đào tạo\nngôn ngữ", sub: "25 min.\n(03 tuần)" },
                          { step: 3, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6 10H6v-2h8v2zm4-4H6v-2h12v2z"/></svg>, title: "Nộp hồ sơ\ntrường", sub: "33 min.\n(3h nhận bot)" },
                          { step: 4, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>, title: "Xin Visa", sub: "" },
                          { step: 5, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M2.5 19h19v2h-19zm19.57-9.36c-.21-.8-1.04-1.28-1.84-1.06L14.92 10l-6.9-6.43-1.93.51 4.14 7.17-4.97 1.33-1.97-1.54-1.45.39 1.82 3.16.77 1.33 1.6-.43 5.31-1.42 4.35-1.16L21 11.49c.81-.23 1.28-1.05 1.07-1.85z"/></svg>, title: "Bay &\nNhập học", sub: "90 min.\n(3h nhận tỉnh)" },
                          { step: 6, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>, title: "Đến nơi", sub: "" }
                        ].map((item, index) => (
                          <div key={index} className="d-flex flex-column align-items-center position-relative" style={{ flex: 1 }}>
                            
                            {index < 5 && (
                              <div className="position-absolute" style={{ top: "12px", left: "50%", width: "100%", height: "2px", backgroundColor: theme === 'dark' ? '#ffffff' : '#1e40af', zIndex: 0 }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="position-absolute top-50 start-50 translate-middle" style={{ color: theme === 'dark' ? '#ffffff' : '#1e40af', backgroundColor: "var(--bs-card-bg)", padding: "0 2px" }}>
                                  <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                                </svg>
                              </div>
                            )}

                            <div className="rounded-circle d-flex align-items-center justify-content-center mb-2 position-relative shadow-sm" style={{ backgroundColor: theme === 'dark' ? '#ffffff' : '#1e40af', color: theme === 'dark' ? '#1e40af' : '#ffffff', width: "24px", height: "24px", fontSize: "12px", fontWeight: "bold", zIndex: 1 }}>
                              {item.step}
                            </div>

                            <div className="d-flex align-items-center justify-content-center mb-1 text-primary" style={{ height: "30px" }}>
                              {item.icon}
                            </div>
                            
                            <div className="fw-bold text-center text-body-emphasis mt-1 text-wrap" style={{ fontSize: "12.5px", lineHeight: "1.2", whiteSpace: "pre-line" }}>{item.title}</div>
                            <div className="text-body-secondary text-center mt-1 text-wrap" style={{ fontSize: "10.5px", lineHeight: "1.2", whiteSpace: "pre-line" }}>{item.sub}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* --- ROW 3: CHI PHÍ, KHO TÀI LIỆU, Q&A --- */}
            <div className="row mb-3 gx-2 gx-xl-3 align-items-stretch">
              
              {/* CHI PHÍ DỰ KIẾN */}
              <div className="col-12 col-md-4 col-lg-4 col-xl-4 mb-3 mb-md-0">
                <div className="card border-0 h-100" style={{ borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", minHeight: "320px" }}>
                  <div className="card-header bg-transparent border-0 p-3 pb-0">
                    <h6 className="fw-bold d-flex align-items-center mb-0 text-body-emphasis" style={{ fontSize: "14px" }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" className="text-primary me-2" fill="currentColor">
                        <path d="M19 4H5C3.895 4 3 4.895 3 6V18C3 19.105 3.895 20 5 20H19C20.105 20 21 19.105 21 18V6C21 4.895 20.105 4 19 4ZM6 7H9V10H6V7ZM6 12H9V15H6V12ZM18 15H11V12H18V15ZM18 10H11V7H18V10Z" />
                      </svg>
                      CHI PHÍ DỰ KIẾN
                    </h6>
                  </div>
                  <div className="card-body p-0 mt-2 d-flex flex-column justify-content-center table-responsive">
                    <table className="table table-borderless align-middle mb-0" style={{ fontSize: "13px", minWidth: "100%" }}>
                      <thead className="border-bottom">
                        <tr>
                          <th className="fw-bold text-body-emphasis ps-4 py-2" style={{ width: "45%" }}>Hạng mục phí</th>
                          <th className="fw-bold text-body-emphasis text-end py-2 pe-4">Số tiền (VNĐ)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="ps-4 py-2 text-body-secondary fw-medium text-nowrap">Phí dịch vụ HTO</td>
                          <td className="text-end fw-bold py-2 pe-4 text-success" style={{ fontSize: "13px" }}>5.000.000</td>
                        </tr>
                        <tr>
                          <td className="ps-4 py-2 text-body-secondary fw-medium text-nowrap">Học phí</td>
                          <td className="text-end fw-bold py-2 pe-4 text-success" style={{ fontSize: "13px" }}>4.000.000</td>
                        </tr>
                        <tr>
                          <td className="ps-4 py-2 text-body-secondary fw-medium text-wrap">Sinh hoạt phí dự kiến</td>
                          <td className="text-end fw-bold py-2 pe-4 text-success" style={{ fontSize: "13px" }}>2.000.000</td>
                        </tr>
                        <tr>
                          <td className="ps-4 py-2 text-body-secondary fw-medium text-nowrap">Bảo hiểm</td>
                          <td className="text-end fw-bold py-2 pe-4 text-success" style={{ fontSize: "13px" }}>1.200.000</td>
                        </tr>
                        <tr>
                          <td className="ps-4 py-2 border-bottom text-body-secondary fw-medium text-nowrap">Vé máy bay</td>
                          <td className="text-end fw-bold py-2 border-bottom pe-4 text-success" style={{ fontSize: "13px" }}>350.000</td>
                        </tr>
                        <tr className="bg-body-secondary">
                          <td className="ps-4 py-3 fw-bold text-body-emphasis text-nowrap">Tổng chi phí</td>
                          <td className="text-end fw-bold py-3 pe-4 text-danger" style={{ fontSize: "15px" }}>38.900.000</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* KHO TÀI LIỆU */}
              <div className="col-12 col-md-4 col-lg-4 col-xl-4 mb-3 mb-md-0">
                <div className="card border-0 h-100" style={{ borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", minHeight: "320px" }}>
                  <div className="card-header bg-transparent border-0 p-3 pb-0">
                    <h6 className="fw-bold d-flex align-items-center mb-0 text-body-emphasis" style={{ fontSize: "14px" }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" className="text-primary me-2" fill="currentColor">
                        <path d="M20 6H12L10 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V8C22 6.9 21.1 6 20 6ZM14 16H6V14H14V16ZM18 12H6V10H18V12Z" />
                      </svg>
                      KHO TÀI LIỆU
                    </h6>
                  </div>
                  <div className="card-body p-3 d-flex flex-column justify-content-between">
                    <ul className="list-unstyled mb-0 flex-grow-1">
                      <li className="d-flex justify-content-between align-items-center py-2">
                        {/* Style minWidth 0 là cần thiết để text-truncate hoạt động chuẩn trong Flexbox */}
                        <div className="d-flex align-items-center gap-3 pe-2 w-100" style={{ minWidth: 0 }}>
                          <img src="./assets/images/Logo-TUM.svg.png" alt="TUM" className="rounded bg-body-secondary flex-shrink-0" style={{ width: "32px", height: "32px", objectFit: "contain" }} />
                          <span className="fw-medium text-body-emphasis text-truncate" style={{ fontSize: "13px" }}>Technical University of Munich</span>
                        </div>
                        <button className="btn btn-sm btn-outline-primary border px-2 bg-body-tertiary text-nowrap flex-shrink-0" style={{ fontSize: "11px", fontWeight: "600" }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="me-1 d-none d-md-inline"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg> Tải
                        </button>
                      </li>
                      <li className="d-flex justify-content-between align-items-center py-2 border-top">
                        <div className="d-flex align-items-center gap-3 pe-2 w-100" style={{ minWidth: 0 }}>
                          <img src="./assets/images/Huberlin-logo.svg.png" alt="Humboldt" className="rounded bg-body-secondary flex-shrink-0" style={{ width: "32px", height: "32px", objectFit: "contain" }} />
                          <span className="fw-medium text-body-emphasis text-truncate" style={{ fontSize: "13px" }}>Humboldt University Berlin</span>
                        </div>
                        <button className="btn btn-sm btn-outline-primary border px-2 bg-body-tertiary text-nowrap flex-shrink-0" style={{ fontSize: "11px", fontWeight: "600" }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="me-1 d-none d-md-inline"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg> Tải
                        </button>
                      </li>
                      
                      <li className="d-flex justify-content-between align-items-center py-2 border-top">
                        <div className="d-flex align-items-center gap-3 pe-2 w-100" style={{ minWidth: 0 }}>
                          <div className="rounded d-flex align-items-center justify-content-center text-white fw-bold shadow-sm flex-shrink-0" style={{ width: "32px", height: "32px", backgroundColor: "#2563eb", fontSize: "10px", letterSpacing: "0.5px" }}>
                            DOCX
                          </div>
                          <div className="text-truncate w-100">
                            <span className="fw-medium text-body-emphasis d-block text-truncate" style={{ fontSize: "13px" }}>Mẫu Hợp Đồng Du Học Đức V3.0</span>
                            <span className="text-body-secondary d-block text-truncate" style={{ fontSize: "11px" }}>(DOCX)</span>
                          </div>
                        </div>
                        <button className="btn btn-sm btn-outline-primary border px-2 bg-body-tertiary text-nowrap flex-shrink-0" style={{ fontSize: "11px", fontWeight: "600" }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="me-1 d-none d-md-inline"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg> Tải
                        </button>
                      </li>
                      <li className="d-flex justify-content-between align-items-center py-2 border-top">
                        <div className="d-flex align-items-center gap-3 pe-2 w-100" style={{ minWidth: 0 }}>
                          <div className="rounded d-flex align-items-center justify-content-center text-white fw-bold shadow-sm flex-shrink-0" style={{ width: "32px", height: "32px", backgroundColor: "#ef4444", fontSize: "11px", letterSpacing: "0.5px" }}>
                            PDF
                          </div>
                          <div className="text-truncate w-100">
                            <span className="fw-medium text-body-emphasis d-block text-truncate" style={{ fontSize: "13px" }}>Bảng Kế Hồ Sơ Cần Thiết</span>
                            <span className="text-body-secondary d-block text-truncate" style={{ fontSize: "11px" }}>(PDF)</span>
                          </div>
                        </div>
                        <button className="btn btn-sm btn-outline-primary border px-2 bg-body-tertiary text-nowrap flex-shrink-0" style={{ fontSize: "11px", fontWeight: "600" }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="me-1 d-none d-md-inline"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg> Tải
                        </button>
                      </li>
                    </ul>
                    <div className="text-center pt-2 mt-1 border-top">
                      <a href="#" className="text-decoration-none fw-bold text-primary d-flex justify-content-center align-items-center" style={{ fontSize: "13px" }}>
                        Xem tất cả <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="ms-1"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Q&A */}
              <div className="col-12 col-md-4 col-lg-4 col-xl-4">
                <div className="card border-0 h-100" style={{ borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", minHeight: "320px" }}>
                  <div className="card-header bg-transparent border-0 p-3 pb-0 d-flex flex-column justify-content-between align-items-start">
                    <h6 className="fw-bold d-flex align-items-center mb-2 text-body-emphasis" style={{ fontSize: "14px" }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" className="text-primary me-2" fill="currentColor">
                        <path d="M20 2H8C6.9 2 6 2.9 6 4V16L10 12H20C21.1 12 22 11.1 22 10V4C22 2.9 21.1 2 20 2ZM15 9H13V7H15V9ZM11 9H9V7H11V9ZM19 9H17V7H19V9ZM4 6H2V20C2 21.1 2.9 22 4 22H18V20H4V6Z" />
                      </svg>
                      Q&A CÙNG HITO
                    </h6>
                    <div className="position-relative w-100 mt-1">
                      <input type="text" className="form-control form-control-sm border bg-body-tertiary text-body w-100" placeholder="Tìm câu hỏi..." style={{ fontSize: "12px", paddingRight: "30px", borderRadius: "6px", padding: "6px 10px" }} />
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="position-absolute text-body-secondary" style={{ top: "50%", transform: "translateY(-50%)", right: "10px" }}>
                        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                      </svg>
                    </div>
                  </div>
                  <div className="card-body p-3 d-flex flex-column justify-content-between">
                    <div>
                      {/* Q1 */}
                      <div className="d-flex mb-3 align-items-start">
                        <div className="rounded-circle text-white d-flex justify-content-center align-items-center me-2 flex-shrink-0" style={{ width: "22px", height: "22px", backgroundColor: "#1d4ed8", fontSize: "12px", fontWeight: "bold", marginTop: "2px" }}>1</div>
                        <div className="flex-grow-1 pe-2 w-100" style={{ minWidth: 0 }}>
                          <h6 className="fw-bold mb-1 text-body-emphasis text-truncate" style={{ fontSize: "13px" }}>Có được làm thêm không?</h6>
                          <p className="text-body-secondary mb-0 text-truncate" style={{ fontSize: "11.5px", lineHeight: "1.3" }}>Có. Sinh viên được phép làm thêm tối đa...</p>
                        </div>
                        <img src="./assets/images/hito_6.png" width="32" height="32" alt="HITO" className="rounded-circle flex-shrink-0 bg-secondary-subtle" style={{ objectFit: "cover" }} />
                      </div>
                      
                      {/* Q2 */}
                      <div className="d-flex mb-3 pt-2 border-top align-items-start">
                        <div className="rounded-circle text-white d-flex justify-content-center align-items-center me-2 flex-shrink-0" style={{ width: "22px", height: "22px", backgroundColor: "#1d4ed8", fontSize: "12px", fontWeight: "bold", marginTop: "2px" }}>2</div>
                        <div className="flex-grow-1 pe-2 w-100" style={{ minWidth: 0 }}>
                          <h6 className="fw-bold mb-1 text-body-emphasis text-truncate" style={{ fontSize: "13px" }}>Học bổng thế nào?</h6>
                          <p className="text-body-secondary mb-0 text-truncate" style={{ fontSize: "11.5px", lineHeight: "1.3" }}>HTO hỗ trợ săn học bổng từ các trường...</p>
                        </div>
                        <img src="./assets/images/hito_6.png" width="32" height="32" alt="HITO" className="rounded-circle flex-shrink-0 bg-secondary-subtle" style={{ objectFit: "cover" }} />
                      </div>

                      {/* Q3 */}
                      <div className="d-flex mb-2 pt-2 border-top align-items-start">
                        <div className="rounded-circle text-white d-flex justify-content-center align-items-center me-2 flex-shrink-0" style={{ width: "22px", height: "22px", backgroundColor: "#1d4ed8", fontSize: "12px", fontWeight: "bold", marginTop: "2px" }}>3</div>
                        <div className="flex-grow-1 pe-2 w-100" style={{ minWidth: 0 }}>
                          <h6 className="fw-bold mb-1 text-body-emphasis text-truncate" style={{ fontSize: "13px" }}>Tài chính bao nhiêu?</h6>
                          <p className="text-body-secondary mb-0 text-truncate" style={{ fontSize: "11.5px", lineHeight: "1.3" }}>Tối thiểu 11.904 EUR/năm (quy định 2026).</p>
                        </div>
                        <img src="./assets/images/hito_6.png" width="32" height="32" alt="HITO" className="rounded-circle flex-shrink-0 bg-secondary-subtle" style={{ objectFit: "cover" }} />
                      </div>
                    </div>
                    
                    <div className="d-flex flex-row justify-content-between align-items-center pt-2 mt-2 border-top gap-2">
                      <a href="#" className="text-decoration-none fw-bold text-primary d-flex align-items-center text-truncate" style={{ fontSize: "13px" }}>
                        Xem tất cả <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="ms-1 flex-shrink-0"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
                      </a>
                      <button className="btn text-white py-1 px-3 d-flex align-items-center bg-primary flex-shrink-0 text-nowrap" style={{ borderRadius: "20px", fontSize: "12px", fontWeight: "600" }}>
                        Hỏi mới
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;
