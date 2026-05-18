import { useState } from "react";
import { useForm } from "react-hook-form";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";

export const RegisterPage = ({ onSwitchToLogin, onRegister }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const inputClass =
    "w-full rounded-[8px] border border-[#d1d5db] bg-[#f9fafb] px-3.5 py-2.5 text-sm text-[#111827] transition focus:border-[#4f46e5] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[rgba(79,70,229,0.1)] app-dark:border-[#4b5563] app-dark:bg-[#374151] app-dark:text-white app-dark:focus:bg-[#1f2937]";

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
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: data.name,
          email: data.email,
          password: data.password,
        }),
      });
      const response = await res.json();

      if (!res.ok) {
        throw new Error(response?.message || "Đăng ký thất bại");
      }

      alert("Đăng ký thành công! Vui lòng đăng nhập.");
      onSwitchToLogin();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mb-4 flex justify-center">
        <img src="/assets/images/logo-HTO.png" alt="HTO Logo" className="h-[60px] w-auto" />
      </div>
      <h2 className="mb-1.5 text-center text-[22px] font-bold text-[#111827] app-dark:text-white">Tạo tài khoản</h2>
      <p className="mb-3 text-center text-[13px] leading-[1.45] text-[#6b7280]">Tham gia cùng chúng tôi và bắt đầu hành trình của bạn.</p>

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
          <label className="mb-1.5 block text-[13px] font-semibold text-[#374151] app-dark:text-[#e5e7eb]" htmlFor="name">Họ và tên</label>
          <input
            type="text"
            id="name"
            className={inputClass}
            placeholder="Ví dụ: Nguyễn Văn A"
            disabled={loading}
            {...register("name", { required: "Vui lòng nhập họ tên." })}
          />
          {errors.name && <div className="mt-1 text-[11px] font-medium text-[#f5365c]">{errors.name.message}</div>}
        </div>

        <div className="mb-3">
          <label className="mb-1.5 block text-[13px] font-semibold text-[#374151] app-dark:text-[#e5e7eb]" htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            className={inputClass}
            placeholder="Ví dụ: name@example.com"
            disabled={loading}
            {...register("email", {
              required: "Vui lòng nhập email.",
              pattern: { value: /\S+@\S+\.\S+/, message: "Sai định dạng." }
            })}
          />
          {errors.email && <div className="mt-1 text-[11px] font-medium text-[#f5365c]">{errors.email.message}</div>}
        </div>

        <div className="mb-3">
          <label className="mb-1.5 block text-[13px] font-semibold text-[#374151] app-dark:text-[#e5e7eb]" htmlFor="password">Mật khẩu</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              className={inputClass}
              placeholder="Ít nhất 8 ký tự"
              disabled={loading}
              {...register("password", { required: "Nhập mật khẩu." })}
            />
            <button
              type="button"
              className="absolute top-1/2 right-3 z-[5] flex -translate-y-1/2 items-center border-0 bg-transparent p-0 text-[#9ca3af]"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
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
              className={inputClass}
              placeholder="Ít nhất 8 ký tự"
              disabled={loading}
              {...register("confirmPassword", {
                required: "Xác nhận mật khẩu.",
                validate: v => v === password || "Không khớp."
              })}
            />
            <button
              type="button"
              className="absolute top-1/2 right-3 z-[5] flex -translate-y-1/2 items-center border-0 bg-transparent p-0 text-[#9ca3af]"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              )}
            </button>
          </div>
          {errors.confirmPassword && <div className="mt-1 text-[11px] font-medium text-[#f5365c]">{errors.confirmPassword.message}</div>}
        </div>

        <div className="mt-2 mb-4">
          <div className="flex items-center">
            <input type="checkbox" id="agreed" className="mt-0 mr-2 h-4 w-4 rounded border border-[#d1d5db] text-[#4f46e5]" {...register("agreed", { required: "Bạn chưa đồng ý." })} />
            <label className="mb-0 block text-xs font-normal text-[#374151] app-dark:text-[#e5e7eb]" htmlFor="agreed">
              Tôi đồng ý với <a href="#" className="text-[#4f46e5] no-underline" onClick={(e) => e.preventDefault()}>Điều khoản & Điều kiện</a>
            </label>
          </div>
          {errors.agreed && <div className="mt-1 text-[11px] font-medium text-[#f5365c]">{errors.agreed.message}</div>}
        </div>

        <button type="submit" className="mt-1.5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-[8px] border-0 bg-[#111827] px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1f2937] disabled:cursor-not-allowed disabled:opacity-70 app-dark:bg-[#4f46e5] app-dark:hover:bg-[#4338ca]" disabled={loading}>
          {loading ? <div className="h-[18px] w-[18px] animate-spin rounded-full border-2 border-[rgba(255,255,255,0.3)] border-t-white"></div> : "Đăng ký"}
        </button>
      </form>

      <div className="text-center text-[13px] text-[#6b7280]">
        Đã có tài khoản? <a href="#" className="ml-1 font-semibold text-[#4f46e5] no-underline hover:underline" onClick={(e) => { e.preventDefault(); onSwitchToLogin(); }}>Đăng nhập ngay</a>
      </div>
    </>
  );
};
