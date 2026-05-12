import { useState } from "react";
import { useForm } from "react-hook-form";
import "./Login.css";

export const LoginPage = ({ onLogin, onSwitchToRegister, onSwitchToForgot }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: {
      email: "",
      password: "",
      remember: false,
    },
  });

  const onSubmit = async (data) => {
    setApiError("");
    setLoading(true);

    try {
      /* --- LOGIC API THẬT ---
      const res = await fetch("http://localhost:3001/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      });
      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.message || "Đăng nhập thất bại");
      }

      localStorage.setItem("token", responseData);
      document.cookie = `token=${responseData}; path=/; max-age=${data.remember ? 604800 : 86400}; SameSite=Lax`;

      const userInfoResponse = await fetch("http://localhost:3001/users/userinfo", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${responseData}`,
        },
      });

      const userInfo = await userInfoResponse.json();

      if (!userInfoResponse.ok) {
        throw new Error(userInfo.message || "Không thể lấy thông tin người dùng");
      }

      onLogin(userInfo);
      ------------------------------ */

      // --- LOGIC GIẢ LẬP (MOCK API) ---
      await new Promise(resolve => setTimeout(resolve, 1500)); // Giả lập độ trễ mạng

      if (data.email === "admin@hto.vn" && data.password === "Admin@123") {
        const mockUserInfo = { name: "Administrator", role: "admin", email: data.email };
        localStorage.setItem("token", "mock-token-admin");
        onLogin(mockUserInfo);
      } else if (data.email === "user@hto.vn" && data.password === "User@123") {
        const mockUserInfo = { name: "Nguyễn Văn A", role: "user", email: data.email };
        localStorage.setItem("token", "mock-token-user");
        onLogin(mockUserInfo);
      } else {
        throw new Error("Email hoặc mật khẩu không chính xác");
      }
      // -------------------------------

    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="text-center">
          <img src="/assets/images/logo-HTO.png" alt="HTO Logo" className="login-logo visible-light" />
        </div>

        <h1 className="login-title">Chào mừng trở lại!</h1>
        <p className="login-subtitle">Đăng nhập để quản lý hồ sơ và cập nhật tin tức mới nhất.</p>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-3">
            <label className="form-label" htmlFor="email">Email đăng nhập</label>
            <input
              type="email"
              id="email"
              className={`form-control ${errors.email || apiError ? "is-invalid" : ""}`}
              placeholder="name@example.com"
              disabled={loading}
              {...register("email", {
                required: "Vui lòng nhập email.",
                pattern: {
                  value: /\S+@\S+\.\S+/,
                  message: "Định dạng email không hợp lệ."
                }
              })}
            />
            {errors.email && <div className="field-error">{errors.email.message}</div>}
          </div>

          <div className="mb-3">
            <div className="d-flex justify-content-between align-items-center">
              <label className="form-label" htmlFor="password">Mật khẩu</label>
              <a href="#" className="forgot-password" onClick={(e) => { e.preventDefault(); onSwitchToForgot(); }}>Quên mật khẩu?</a>
            </div>
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                className={`form-control ${errors.password || apiError ? "is-invalid" : ""}`}
                placeholder="********"
                disabled={loading}
                {...register("password", { required: "Vui lòng nhập mật khẩu." })}
              />
              <button
                type="button"
                className="hto-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
            {errors.password && <div className="field-error">{errors.password.message}</div>}
            {apiError && !errors.password && <div className="field-error">{apiError}</div>}
          </div>

          <div className="mb-4">
            <div className="form-check">
              <input
                type="checkbox"
                className="form-check-input"
                id="remember"
                {...register("remember")}
              />
              <label className="form-check-label" htmlFor="remember" style={{ fontSize: '13px' }}>Ghi nhớ đăng nhập</label>
            </div>
          </div>

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? (
              <>
                <div className="spinner"></div>
                Đang xử lý...
              </>
            ) : (
              "Đăng nhập"
            )}
          </button>
        </form>

        <div className="auth-links">
          Chưa có tài khoản? <a href="#" onClick={(e) => { e.preventDefault(); onSwitchToRegister(); }}>Đăng ký ngay</a>
        </div>

        {/* Mascot decoration */}
        <img src="/assets/images/logo-dolphin.png" alt="" className="login-mascot" />
      </div>
    </div>
  );
};
