import { useState } from "react";
import { useForm } from "react-hook-form";
import "./Login.css";

export const RegisterPage = ({ onSwitchToLogin, onRegister }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      agreed: false,
    },
  });

  const password = watch("password");

  const onSubmit = async (data) => {
    setApiError("");
    setLoading(true);

    try {
      /* --- LOGIC API THẬT (Đã ẩn) ---
      const res = await fetch("http://localhost:3001/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      });
      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.message || "Đăng ký thất bại");
      }

      alert("Đăng ký thành công! Vui lòng đăng nhập.");
      onSwitchToLogin();
      ------------------------------ */

      // --- LOGIC GIẢ LẬP (MOCK API) ---
      await new Promise(resolve => setTimeout(resolve, 2000)); // Giả lập độ trễ mạng
      
      alert("Đăng ký thành công! Bạn có thể dùng tài khoản này để đăng nhập (giả lập).");
      onSwitchToLogin();
      // -------------------------------
      
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Đăng ký thất bại");
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

        <h1 className="login-title">Tạo tài khoản mới</h1>
        <p className="login-subtitle">Tham gia HTO để bắt đầu hành trình của bạn.</p>

        {apiError && (
          <div className="error-message">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-3">
            <label className="form-label" htmlFor="name">Họ và tên</label>
            <input
              type="text"
              id="name"
              className={`form-control ${errors.name ? "is-invalid" : ""}`}
              placeholder="Nguyễn Văn A"
              disabled={loading}
              {...register("name", { required: "Vui lòng nhập họ và tên." })}
            />
            {errors.name && <div className="field-error">{errors.name.message}</div>}
          </div>

          <div className="mb-3">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              className={`form-control ${errors.email ? "is-invalid" : ""}`}
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
            <label className="form-label" htmlFor="password">Mật khẩu</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                className={`form-control ${errors.password ? "is-invalid" : ""}`}
                placeholder="********"
                disabled={loading}
                {...register("password", { 
                  required: "Vui lòng nhập mật khẩu.",
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/,
                    message: "Mật khẩu tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường và ký tự đặc biệt."
                  }
                })}
              />
              <button
                type="button"
                className="toggle-password"
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
          </div>

          <div className="mb-4">
            <label className="form-label" htmlFor="confirmPassword">Xác nhận mật khẩu</label>
            <div className="password-wrapper">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                className={`form-control ${errors.confirmPassword ? "is-invalid" : ""}`}
                placeholder="********"
                disabled={loading}
                {...register("confirmPassword", { 
                  required: "Vui lòng xác nhận mật khẩu.",
                  validate: (value) => value === password || "Mật khẩu xác nhận không khớp."
                })}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showConfirmPassword ? (
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
            {errors.confirmPassword && <div className="field-error">{errors.confirmPassword.message}</div>}
          </div>

          <div className="mb-4">
            <div className="form-check">
              <input 
                type="checkbox" 
                className="form-check-input" 
                id="agreed" 
                {...register("agreed", { required: "Bạn phải đồng ý với chính sách bảo mật." })}
              />
              <label className="form-check-label" htmlFor="agreed" style={{ fontSize: '13px' }}>
                Tôi đồng ý với <a href="#">chính sách bảo mật & điều khoản</a>
              </label>
            </div>
            {errors.agreed && <div className="field-error">{errors.agreed.message}</div>}
          </div>

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? (
              <>
                <div className="spinner"></div>
                Đang đăng ký...
              </>
            ) : (
              "Đăng ký"
            )}
          </button>
        </form>

        <div className="auth-links">
          Đã có tài khoản? <a href="#" onClick={(e) => { e.preventDefault(); onSwitchToLogin(); }}>Đăng nhập ngay</a>
        </div>
      </div>
    </div>
  );
};
