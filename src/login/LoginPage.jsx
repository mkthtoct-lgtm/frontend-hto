import { useState } from "react";
import { useForm } from "react-hook-form";

import { API_BASE_URL } from "../config/api";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const ROLE_ID_MAP = {
  "69fc5af582ef85451120772a": "admin",
  "69fc5af582ef85451120772b": "bangiamdoc",
  "69fc5af582ef85451120772c": "truongbophan",
  "69fc5af582ef85451120772d": "nhansu",
  "69fc5af582ef85451120772e": "daily",
  "69fc5af682ef85451120772f": "congtacvien",
  "69fc5af782ef854511207730": "user",
  "60c72b2f9b1d8b2bad000001": "staff",
};

const PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

function normalizeRole(roleId) {
  return ROLE_ID_MAP[roleId] || "user";
}

// Helper ngoài component để tránh vi phạm React Compiler rule "value cannot be modified"
function setAuthCookie(token, remember) {
  document.cookie = `token=${token}; path=/; max-age=${remember ? 604800 : 86400}; SameSite=Lax`;
}

function getLoginErrorMessage(response, status) {
  const detailMessages = response?.error?.details;

  if (Array.isArray(detailMessages) && detailMessages.length > 0) {
    return detailMessages[0];
  }

  const message = response?.message;

  if (typeof message === "string" && message.trim() && message !== "Bad Request") {
    return message;
  }

  if (status === 400) {
    return "Thông tin đăng nhập không hợp lệ. Vui lòng kiểm tra lại email và mật khẩu.";
  }

  if (status === 401) {
    return "Email hoặc mật khẩu không chính xác.";
  }

  return "Đăng nhập thất bại";
}

const normalizePermissionList = (...permissionSources) => {
  const permissions = [];

  permissionSources.forEach((source) => {
    if (!source) return;
    if (typeof source === "string") {
      permissions.push(source);
      return;
    }
    if (Array.isArray(source)) {
      source.forEach((permission) => {
        if (typeof permission === "string") {
          permissions.push(permission);
        } else if (permission?.id) {
          permissions.push(String(permission.id));
        } else if (permission?.name) {
          permissions.push(String(permission.name));
        }
      });
      return;
    }
    if (typeof source === "object") {
      normalizePermissionList(source.permissions).forEach((permission) => {
        permissions.push(permission);
      });
    }
  });

  return Array.from(new Set(permissions.filter(Boolean).map((permission) => permission.trim())));
};

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
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      email: "",
      password: "",
      remember: false,
    },
  });

  const onSubmit = async (data) => {
    if (loading) return;
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

      const response = await res.json().catch(() => null);
      const responseData = response?.data;

      if (!res.ok) {
        throw new Error(getLoginErrorMessage(response, res.status));
      }

      if (!responseData?.access_token || !responseData?.user) {
        throw new Error("Phản hồi đăng nhập không hợp lệ");
      }

      localStorage.setItem("token", responseData.access_token);

      if (responseData.refresh_token) {
        localStorage.setItem("refresh_token", responseData.refresh_token);
      }

      setAuthCookie(responseData.access_token, data.remember);

      const user = {
        id: responseData.user.id,
        name: responseData.user.fullName || "",
        fullName: responseData.user.fullName || "",
        email: responseData.user.email,
        avatarUrl: responseData.user.avatarUrl || "",
        roleId: responseData.user.roleId,
        departmentId: responseData.user.departmentId,
        departmentName: responseData.user.departmentName || null,
        role: responseData.user.role || normalizeRole(responseData.user.roleId),
        permissions: normalizePermissionList(
          responseData.user.permissions,
          responseData.user.role?.permissions,
          responseData.user.roleId?.permissions,
          responseData.user.grantedPermissions,
        ),
        grantedPermissions: normalizePermissionList(responseData.user.grantedPermissions),
        hasSeenAdminTutorial: responseData.user.hasSeenAdminTutorial,
        seenTours: responseData.user.seenTours || [],
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

      <form noValidate onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-3">
          <label className="mb-1.5 block text-[13px] font-semibold text-[#374151] app-dark:text-[#e5e7eb]" htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            className={`${inputClass} ${errors.email || apiError ? invalidInputClass : ""}`}
            placeholder="Example@gmail.com"
            disabled={loading}
            {...register("email", {
              required: "Vui lòng nhập email.",
              pattern: {
                value: EMAIL_PATTERN,
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
              {...register("password", {
                required: "Vui lòng nhập mật khẩu.",
                minLength: {
                  value: 8,
                  message: "Mật khẩu phải có ít nhất 8 ký tự.",
                },
                pattern: {
                  value: PASSWORD_PATTERN,
                  message:
                    "Mật khẩu phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.",
                },
              })}
            />
            <button
              type="button"
              className="absolute top-1/2 right-3 z-5 flex -translate-y-1/2 items-center border-0 bg-transparent p-0 text-[#9ca3af]"
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

      <div className="text-center text-[13px] text-[#6b7280]">
        Chưa có tài khoản? <a href="#" className="ml-1 font-semibold text-[#4f46e5] no-underline hover:underline" onClick={(e) => { e.preventDefault(); onSwitchToRegister(); }}>Đăng ký ngay</a>
      </div>
    </>
  );
};
