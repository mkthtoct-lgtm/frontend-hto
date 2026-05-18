import { useState } from "react";
import { useForm } from "react-hook-form";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1" || "http://qlnb-api.hto.edu.vn/api/v1/auth/reset-password";

const getResetToken = () => {
  const searchParams = new URLSearchParams(window.location.search);

  return searchParams.get("token") || searchParams.get("resetToken") || "";
};

export const ResetPasswordPage = ({ onSwitchToLogin }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [apiError, setApiError] = useState("");
  const [resetToken] = useState(() => getResetToken());
  const inputClass =
    "w-full rounded-[8px] border border-[#d1d5db] bg-[#f9fafb] px-3.5 py-2.5 text-sm text-[#111827] transition focus:border-[#4f46e5] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[rgba(79,70,229,0.1)] app-dark:border-[#4b5563] app-dark:bg-[#374151] app-dark:text-white app-dark:focus:bg-[#1f2937]";

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
    setApiError("");

    if (!resetToken) {
      setApiError("Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: resetToken,
          password: data.password,
        }),
      });

      const response = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          response?.message ||
            "Không thể cập nhật mật khẩu. Vui lòng thử lại.",
        );
      }

      window.history.replaceState({}, "", "/");
      setIsSuccess(true);
    } catch (err) {
      setApiError(
        err instanceof Error
          ? err.message
          : "Không thể cập nhật mật khẩu. Vui lòng thử lại.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-left">
        <div className="mb-4 flex justify-start">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#ecfdf5] app-dark:bg-[#163328]">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
        </div>
        <h2 className="mb-1.5 justify-center text-[22px] font-bold text-[#111827] app-dark:text-white">Thành công!</h2>
        <p className="mb-5 justify-center text-[13px] leading-[1.45] text-[#6b7280]">
          Mật khẩu của bạn đã được cập nhật. Bạn có thể đăng nhập bằng mật khẩu mới.
        </p>
        <button
          className="mt-1.5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-[8px] border-0 bg-[#111827] px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1f2937] app-dark:bg-[#4f46e5] app-dark:hover:bg-[#4338ca]"
          onClick={() => onSwitchToLogin()}
        >
          Đăng nhập ngay
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex justify-center">
        <img src="/assets/images/logo-HTO.png" alt="HTO Logo" className="h-[60px] w-auto" />
      </div>
      <h1 className="mb-1.5  text-center text-[22px] font-bold text-[#111827] app-dark:text-white">Mật khẩu mới</h1>
      <p className="mb-5 text-center text-[13px] leading-[1.45] text-[#6b7280]">Thiết lập mật khẩu mạnh để bảo vệ tài khoản của bạn.</p>

      {!resetToken && (
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-[#fecdd3] bg-[#fff1f2] px-3 py-2 text-[13px] text-[#be123c] app-dark:border-[#7f1d1d] app-dark:bg-[#2a1215] app-dark:text-[#fecdd3]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.
        </div>
      )}

      {apiError && (
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-[#fecdd3] bg-[#fff1f2] px-3 py-2 text-[13px] text-[#be123c] app-dark:border-[#7f1d1d] app-dark:bg-[#2a1215] app-dark:text-[#fecdd3]">
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
          <label className="mb-1.5 block text-[13px] font-semibold text-[#374151] app-dark:text-[#e5e7eb]" htmlFor="password">Mật khẩu mới</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              className={`${inputClass} ${errors.password ? "border-[#f5365c]" : ""}`}
              placeholder="Ít nhất 8 ký tự"
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
              className="absolute top-1/2 right-3 z-[5] flex -translate-y-1/2 items-center border-0 bg-transparent p-0 text-[#9ca3af]"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              {showPassword ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              )}
            </button>
          </div>
          {errors.password && <div className="mt-1 text-[11px] font-medium text-[#f5365c]">{errors.password.message}</div>}
        </div>

        <div className="mb-3">
          <label className="mb-1.5 block text-[13px] font-semibold text-[#374151] app-dark:text-[#e5e7eb]" htmlFor="confirmPassword">Xác nhận mật khẩu</label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="confirmPassword"
              className={`${inputClass} ${errors.confirmPassword ? "border-[#f5365c]" : ""}`}
              placeholder="Ít nhất 8 ký tự"
              disabled={loading}
              {...register("confirmPassword", { 
                required: "Vui lòng xác nhận lại mật khẩu.",
                validate: value => value === password || "Mật khẩu xác nhận không khớp."
              })}
            />
            <button
              type="button"
              className="absolute top-1/2 right-3 z-[5] flex -translate-y-1/2 items-center border-0 bg-transparent p-0 text-[#9ca3af]"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              {showConfirmPassword ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              )}
            </button>
          </div>
          {errors.confirmPassword && <div className="mt-1 text-[11px] font-medium text-[#f5365c]">{errors.confirmPassword.message}</div>}
        </div>



        <button type="submit" className="mt-1.5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-[8px] border-0 bg-[#111827] px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1f2937] disabled:cursor-not-allowed disabled:opacity-70 app-dark:bg-[#4f46e5] app-dark:hover:bg-[#4338ca]" disabled={loading || !resetToken}>
          {loading ? <div className="h-[18px] w-[18px] animate-spin rounded-full border-2 border-[rgba(255,255,255,0.3)] border-t-white"></div> : "Cập nhật mật khẩu"}
        </button>
      </form>
      
      <div className="mt-4 text-left text-[13px] text-[#6b7280]">
        <a href="#" className="font-semibold text-[#4f46e5] no-underline hover:underline" onClick={(e) => { e.preventDefault(); onSwitchToLogin(); }}>Quay lại Đăng nhập</a>
      </div>
    </>
  );
};

export const NewPasswordPage = ResetPasswordPage;
