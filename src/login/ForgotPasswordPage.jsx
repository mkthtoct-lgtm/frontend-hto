import { useState } from "react";
import { useForm } from "react-hook-form";
import "./Login.css";

export const ForgotPasswordPage = ({ onSwitchToLogin, onSwitchToNewPassword }) => {
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    mode: "onTouched",
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // Giả lập gửi mail
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log("Reset email sent to:", data.email);
      setIsSuccess(true);
      
      // Sau khi thành công, có thể chuyển sang trang nhập mật khẩu mới 
      // hoặc thông báo người dùng kiểm tra email.
      // Ở đây tôi sẽ giả lập chuyển sang NewPassword sau 2s nếu muốn, 
      // nhưng thường là chờ người dùng click.
    } catch (err) {
      console.error(err);
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
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
          </div>
          <h1 className="login-title">Kiểm tra email!</h1>
          <p className="login-subtitle">
            Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến email của bạn.
          </p>
          <button 
            type="button"
            className="btn-login" 
            onClick={() => onSwitchToNewPassword()}
          >
            Tiếp tục đặt mật khẩu mới
          </button>
          <div className="auth-links">
            <a href="#" onClick={(e) => { e.preventDefault(); onSwitchToLogin(); }}>Quay lại Đăng nhập</a>
          </div>
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

        <h1 className="login-title">Quên mật khẩu?</h1>
        <p className="login-subtitle">Nhập email của bạn để nhận liên kết đặt lại mật khẩu.</p>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-4">
            <label className="form-label" htmlFor="email">Email tài khoản</label>
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

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? (
              <>
                <div className="spinner"></div>
                Đang gửi yêu cầu...
              </>
            ) : (
              "Gửi yêu cầu"
            )}
          </button>
        </form>

        <div className="auth-links">
          Nhớ mật khẩu? <a href="#" onClick={(e) => { e.preventDefault(); onSwitchToLogin(); }}>Đăng nhập ngay</a>
        </div>

        <img src="/assets/images/logo-dolphin.png" alt="" className="login-mascot" />
      </div>
    </div>
  );
};
