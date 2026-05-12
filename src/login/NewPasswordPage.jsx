import { useState } from "react";
import { useForm } from "react-hook-form";
import "./Login.css";

export const NewPasswordPage = ({ onSwitchToLogin }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    mode: "onTouched",
  });

  const password = watch("password");

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // Giả lập xử lý đổi mật khẩu 
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log("Cập nhật mật khẩu thành công");
      setIsSuccess(true);
    } catch (err) {
      console.error("Lỗi cập nhật:", err);
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="login-container">
        <div className="login-card text-center">
          <div className="mb-4">
            <div className="success-icon-wrapper">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
          </div>
          <h1 className="login-title">Thành công!</h1>
          <p className="login-subtitle">
            Mật khẩu của bạn đã được cập nhật. Bây giờ bạn có thể đăng nhập bằng mật khẩu mới.
          </p>
          <button
            className="btn-login"
            onClick={() => onSwitchToLogin()}
          >
            Đăng nhập ngay
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <button className="back-button" onClick={onSwitchToLogin} aria-label="Quay lại">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
        <div className="text-center">
          <img src="/assets/images/logo-HTO.png" alt="HTO Logo" className="login-logo visible-light" />
        </div>

        <h1 className="login-title">Mật khẩu mới</h1>
        <p className="login-subtitle">Thiết lập mật khẩu mạnh để bảo vệ tài khoản của bạn.</p>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-3">
            <label className="form-label" htmlFor="password">Mật khẩu mới</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                className={`form-control ${errors.password ? "is-invalid" : ""}`}
                placeholder="********"
                disabled={loading}
                {...register("password", {
                  required: "Vui lòng nhập mật khẩu mới.",
                  minLength: { value: 8, message: "Mật khẩu phải có ít nhất 8 ký tự." },
                  validate: {
                    hasUpper: v => /[A-Z]/.test(v) || "Phải có ít nhất 1 chữ hoa.",
                    hasLower: v => /[a-z]/.test(v) || "Phải có ít nhất 1 chữ thường.",
                    hasSpecial: v => /[!@#$%^&*(),.?":{}|<>]/.test(v) || "Phải có ít nhất 1 ký tự đặc biệt."
                  }
                })}
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
                  required: "Vui lòng xác nhận lại mật khẩu.",
                  validate: value => value === password || "Mật khẩu xác nhận không khớp."
                })}
              />
              <button
                type="button"
                className="hto-password-toggle"
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
                id="terms"
                {...register("terms", { required: "Bạn phải đồng ý với điều khoản." })}
              />
              <label className="form-check-label" htmlFor="terms" style={{ fontSize: '13px' }}>
                Tôi đồng ý với <a href="#" style={{ color: 'var(--hto-primary)', fontWeight: '600' }}>Điều khoản & Điều kiện</a>
              </label>
            </div>
            {errors.terms && <div className="field-error">{errors.terms.message}</div>}
          </div>

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? (
              <>
                <div className="spinner"></div>
                Đang cập nhật...
              </>
            ) : (
              "Cập nhật mật khẩu"
            )}
          </button>
        </form>

        <img src="/assets/images/logo-dolphin.png" alt="" className="login-mascot" />
      </div>
    </div>
  );
};
