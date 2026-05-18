import { useState } from "react";
import { useForm } from "react-hook-form";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";

const ROLE_ID_MAP = {
  "69fc5af582ef85451120772a": "admin",
  "69fc5af582ef85451120772b": "bangiamdoc",
  "69fc5af582ef85451120772c": "truongbophan",
  "69fc5af582ef85451120772d": "nhansu",
  "69fc5af582ef85451120772e": "daily",
  "69fc5af682ef85451120772f": "congtacvien",
  "69fc5af782ef854511207730": "user",
};

function normalizeRole(roleId) {
  return ROLE_ID_MAP[roleId] || "user";
}

export const LoginPage = ({ onLogin, onSwitchToRegister, onSwitchToForgot }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const inputClass =
    "w-full rounded-[8px] border border-[#d1d5db] bg-[#f9fafb] px-3.5 py-2.5 text-sm text-[#111827] transition focus:border-[#4f46e5] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[rgba(79,70,229,0.1)] app-dark:border-[#4b5563] app-dark:bg-[#374151] app-dark:text-white app-dark:focus:bg-[#1f2937]";
  const invalidInputClass = "border-[#f5365c]";

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
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      });

      const response = await res.json();
      const responseData = response?.data;

      if (!res.ok) {
        throw new Error(response?.message || "Đăng nhập thất bại");
      }

      if (!responseData?.access_token || !responseData?.user) {
        throw new Error("Phản hồi đăng nhập không hợp lệ");
      }

      localStorage.setItem("token", responseData.access_token);

      if (responseData.refresh_token) {
        localStorage.setItem("refresh_token", responseData.refresh_token);
      }

      document.cookie = `token=${responseData.access_token}; path=/; max-age=${data.remember ? 604800 : 86400}; SameSite=Lax`;

      const user = {
        id: responseData.user.id,
        name: responseData.user.fullName || "",
        fullName: responseData.user.fullName || "",
        email: responseData.user.email,
        avatarUrl: responseData.user.avatarUrl || "",
        roleId: responseData.user.roleId,
        departmentId: responseData.user.departmentId,
        role: normalizeRole(responseData.user.roleId),
      };

      onLogin(user);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mb-3 flex justify-center ">
        <img src="/assets/images/logo-HTO.png" alt="HTO Logo" className="h-[60px] w-auto" />
      </div>
      <h2 className="mb-1.5 text-center text-[15px] font-bold text-[#111827] app-dark:text-white">Đăng nhập</h2>
      <p className="mb-3 text-center text-[13px] leading-[1.45] text-[#6b7280]">Hôm nay là một ngày mới. Hãy đăng nhập để bắt đầu.</p>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-3">
          <label className="mb-1.5 block text-[13px] font-semibold text-[#374151] app-dark:text-[#e5e7eb]" htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            className={`${inputClass} ${errors.email || apiError ? invalidInputClass : ""}`}
            placeholder="Example@email.com"
            disabled={loading}
            {...register("email", {
              required: "Vui lòng nhập email.",
              pattern: {
                value: /\S+@\S+\.\S+/,
                message: "Định dạng email không hợp lệ.",
              },
            })}
          />
          {errors.email && <div className="mt-1 text-[11px] font-medium text-[#f5365c]">{errors.email.message}</div>}
        </div>

        <div className="mb-3">
          <div className="flex items-center justify-between">
            <label className="mb-1.5 block text-[13px] font-semibold text-[#374151] app-dark:text-[#e5e7eb]" htmlFor="password">Mật khẩu</label>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              className={`${inputClass} ${errors.password || apiError ? invalidInputClass : ""}`}
              placeholder="Ít nhất 8 ký tự"
              disabled={loading}
              {...register("password", { required: "Vui lòng nhập mật khẩu." })}
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
          {apiError && !errors.password && <div className="mt-1 text-[11px] font-medium text-[#f5365c]">{apiError}</div>}
          <div className="mt-1 flex justify-end">
            <a href="#" className="ml-auto text-xs font-semibold text-[#4f46e5] no-underline hover:underline" onClick={(e) => { e.preventDefault(); onSwitchToForgot(); }}>Quên mật khẩu?</a>
          </div>
        </div>

        <button type="submit" className="mt-1.5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-[8px] border-0 bg-[#111827] px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1f2937] disabled:cursor-not-allowed disabled:opacity-70 app-dark:bg-[#4f46e5] app-dark:hover:bg-[#4338ca]" disabled={loading}>
          {loading ? <div className="h-[18px] w-[18px] animate-spin rounded-full border-2 border-[rgba(255,255,255,0.3)] border-t-white"></div> : "Đăng nhập"}
        </button>
      </form>

      <div className="my-4 flex items-center text-center text-[11px] text-[#9ca3af] before:mr-2 before:flex-1 before:border-b before:border-[#e5e7eb] after:ml-2 after:flex-1 after:border-b after:border-[#e5e7eb] app-dark:before:border-[#374151] app-dark:after:border-[#374151]">Hoặc</div>

      <div className="text-center text-[13px] text-[#6b7280]">
        Chưa có tài khoản? <a href="#" className="ml-1 font-semibold text-[#4f46e5] no-underline hover:underline" onClick={(e) => { e.preventDefault(); onSwitchToRegister(); }}>Đăng ký ngay</a>
      </div>
    </>
  );
};
