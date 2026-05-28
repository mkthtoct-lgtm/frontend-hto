import { useState } from "react";
import { useForm } from "react-hook-form";

// const API_BASE_URL =
//   import.meta.env.VITE_API_BASE_URL ||
//   (import.meta.env.PROD ? "/api/v1" : "http://qlnb-api.hto.edu.vn/api/v1");
const API_BASE_URL = "http://localhost:8080/api/v1";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const ForgotPasswordPage = ({ onSwitchToLogin }) => {
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [apiError, setApiError] = useState("");
  const inputClass =
    "w-full rounded-[8px] border border-[#d1d5db] bg-[#f9fafb] px-3.5 py-2.5 text-sm text-[#111827] transition focus:border-[#4f46e5] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[rgba(79,70,229,0.1)] app-dark:border-[#4b5563] app-dark:bg-[#374151] app-dark:text-white app-dark:focus:bg-[#1f2937]";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data) => {
    setApiError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
        }),
      });

      const response = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          response?.message ||
            "Chưa thể gửi yêu cầu đặt lại mật khẩu. Vui lòng thử lại.",
        );
      }

      setIsSuccess(true);
    } catch (err) {
      setApiError(
        err instanceof Error
          ? err.message
          : "Chưa thể gửi yêu cầu đặt lại mật khẩu.",
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
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
        </div>
        <h1 className="mb-1.5 justify-center text-[22px] font-bold text-[#111827] app-dark:text-white">Kiểm tra email!</h1>
        <p className="mb-5 justify-center text-[13px] leading-[1.45] text-[#6b7280]">
          Kiểm tra hộp thư của bạn để mở liên kết đặt lại mật khẩu và tạo mật khẩu mới.
        </p>
        <div className="mt-4 text-left text-[13px] text-[#6b7280]">
          <a href="#" className="font-semibold text-[#4f46e5] no-underline hover:underline" onClick={(e) => { e.preventDefault(); onSwitchToLogin(); }}>Quay lại Đăng nhập</a>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex justify-center">
        <img src="/assets/images/logo-HTO.png" alt="HTO Logo" className="h-[60px] w-auto" />
      </div>
      <h1 className="mb-1.5 text-center text-[22px] font-bold text-[#111827] app-dark:text-white">Quên mật khẩu?</h1>
      <p className="mb-5 text-center text-[13px] leading-[1.45] text-[#6b7280]">Nhập email của bạn để nhận liên kết đặt lại mật khẩu.</p>

      {apiError && !errors.email && (
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-[#fecdd3] bg-[#fff1f2] px-3 py-2 text-[13px] text-[#be123c] app-dark:border-[#7f1d1d] app-dark:bg-[#2a1215] app-dark:text-[#fecdd3]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          {apiError}
        </div>
      )}

      <form noValidate onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-4">
          <label className="mb-1.5 block text-[13px] font-semibold text-[#374151] app-dark:text-[#e5e7eb]" htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            className={`${inputClass} ${errors.email ? "border-[#f5365c]" : ""}`}
            placeholder="Ví dụ: name@example.com"
            disabled={loading}
            {...register("email", {
              required: "Vui lòng nhập email.",
              pattern: {
                value: EMAIL_PATTERN,
                message: "Định dạng email không hợp lệ."
              }
            })}
          />
          {errors.email && <div className="mt-1 text-[11px] font-medium text-[#f5365c]">{errors.email.message}</div>}
        </div>

        <button type="submit" className="mt-1.5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-[8px] border-0 bg-[#111827] px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1f2937] disabled:cursor-not-allowed disabled:opacity-70 app-dark:bg-[#4f46e5] app-dark:hover:bg-[#4338ca]" disabled={loading}>
          {loading ? <div className="h-[18px] w-[18px] animate-spin rounded-full border-2 border-[rgba(255,255,255,0.3)] border-t-white"></div> : "Gửi yêu cầu"}
        </button>
      </form>

      <div className="mt-4 text-center text-[13px] text-[#6b7280]">
        Nhớ mật khẩu? <a href="#" className="ml-1 font-semibold text-[#4f46e5] no-underline hover:underline" onClick={(e) => { e.preventDefault(); onSwitchToLogin(); }}>Đăng nhập ngay</a>
      </div>
    </>
  );

};
