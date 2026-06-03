import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { API_BASE_URL } from "../config/api";

const GMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;

const PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

const LOCATION_OPTIONS = [
  {
    city: "TP. Hồ Chí Minh",
    wards: [
      "Phường Sài Gòn",
      "Phường Bến Thành",
      "Phường Tân Định",
      "Phường Chợ Lớn",
      "Phường Gia Định",
      "Phường Thủ Đức",
    ],
  },
  {
    city: "Hà Nội",
    wards: [
      "Phường Hoàn Kiếm",
      "Phường Cửa Nam",
      "Phường Ba Đình",
      "Phường Đống Đa",
      "Phường Cầu Giấy",
      "Phường Tây Hồ",
    ],
  },
  {
    city: "Đà Nẵng",
    wards: [
      "Phường Hải Châu",
      "Phường Thanh Khê",
      "Phường Sơn Trà",
      "Phường Ngũ Hành Sơn",
      "Phường Liên Chiểu",
    ],
  },
  {
    city: "Cần Thơ",
    wards: [
      "Phường Ninh Kiều",
      "Phường Cái Răng",
      "Phường Bình Thủy",
      "Phường Ô Môn",
      "Phường Thốt Nốt",
    ],
  },
  {
    city: "Hải Phòng",
    wards: [
      "Phường Hồng Bàng",
      "Phường Lê Chân",
      "Phường Ngô Quyền",
      "Phường Kiến An",
      "Phường Đồ Sơn",
    ],
  },
];

export const RegisterPage = ({ onSwitchToLogin, onRegister }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [registrationStep, setRegistrationStep] = useState("account");
  const [registeredUser, setRegisteredUser] = useState(null);
  const referralFromUrl = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return (
      params.get("ref") ||
      params.get("referral") ||
      params.get("referralCode") ||
      params.get("maGioiThieu") ||
      ""
    ).trim();
  }, []);
  const inputClass =
    "w-full rounded-[8px] border border-[#d1d5db] bg-[#f9fafb] px-3.5 py-2 text-sm text-[#111827] transition focus:border-[#4f46e5] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[rgba(79,70,229,0.1)] app-dark:border-[#4b5563] app-dark:bg-[#374151] app-dark:text-white app-dark:focus:bg-[#1f2937]";

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    mode: "onChange",
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
      const response = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(response?.message || "Đăng ký thất bại");
      }

      setRegisteredUser({
        id: response?.data?.user?.id || response?.data?.id || response?.user?.id || "",
        name: data.name,
        email: data.email,
      });
      setRegistrationStep("profile");
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileComplete = (profileData) => {
    try {
      window.localStorage.setItem(
        `hto_registration_profile_${registeredUser?.email || Date.now()}`,
        JSON.stringify({
          ...profileData,
          userId: registeredUser?.id || "",
          email: registeredUser?.email || "",
          updatedAt: new Date().toISOString(),
        }),
      );
    } catch {
      // Profile data is best-effort until backend supports these fields.
    }

    setRegistrationStep("success");
  };

  if (registrationStep === "profile") {
    return (
      <RegistrationProfilePage
        inputClass={inputClass}
        loading={loading}
        onComplete={handleProfileComplete}
        referralFromUrl={referralFromUrl}
        userName={registeredUser?.name}
      />
    );
  }

  if (registrationStep === "success") {
    return (
      <>
        <div className="mb-4 flex justify-center">
          <img src="/assets/images/logo-HTO.png" alt="HTO Logo" className="h-[60px] w-auto" />
        </div>
        <div className="rounded-2xl border border-[#bbf7d0] bg-[#f0fdf4] p-5 text-center app-dark:border-[#14532d] app-dark:bg-[#052e16]">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#22c55e] text-white">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5"></path>
            </svg>
          </div>
          <h2 className="mb-2 text-[22px] font-bold text-[#166534] app-dark:text-[#bbf7d0]">Chúc mừng!</h2>
          <p className="mb-4 text-sm leading-6 text-[#166534] app-dark:text-[#dcfce7]">
            Tài khoản của {registeredUser?.name || "bạn"} đã được đăng ký thành công. Vui lòng đăng nhập để tiếp tục.
          </p>
          <button
            type="button"
            className="w-full rounded-[8px] border-0 bg-[#111827] px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1f2937] app-dark:bg-[#4f46e5] app-dark:hover:bg-[#4338ca]"
            onClick={onSwitchToLogin}
          >
            Đến trang đăng nhập
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="mb-4 flex justify-center">
        <img src="/assets/images/logo-HTO.png" alt="HTO Logo" className="h-[60px] w-auto" />
      </div>
      <h2 className="mb-1.5 text-center text-[22px] font-bold text-[#111827] app-dark:text-white">Tạo tài khoản</h2>
      <p className="mb-3 text-center text-[13px] leading-[1.45] text-[#6b7280]">Tham gia cùng chúng tôi và bắt đầu hành trình của bạn.</p>

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
            className={`${inputClass} ${errors.email ? "border-[#f5365c]" : ""}`}
            placeholder="Ví dụ: name@gmail.com"
            disabled={loading}
            {...register("email", {
              required: "Vui lòng nhập email.",
              pattern: {
                value: GMAIL_PATTERN,
                message: "Email phải là địa chỉ Gmail hợp lệ (ví dụ: example@gmail.com).",
              }
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
                required: "Vui lòng nhập lại mật khẩu.",
                validate: (v) => v === password || "Mật khẩu xác nhận không khớp.",
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

function RegistrationProfilePage({ inputClass, loading, onComplete, referralFromUrl, userName }) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    mode: "onChange",
    defaultValues: {
      phone: "",
      city: "",
      ward: "",
      addressDetail: "",
      socialLink: "",
      referralCode: referralFromUrl,
    },
  });
  const selectedCity = watch("city");
  const wardOptions = LOCATION_OPTIONS.find((option) => option.city === selectedCity)?.wards || [];

  const submitProfile = (data) => {
    onComplete({
      ...data,
      address: [data.addressDetail, data.ward, data.city].filter(Boolean).join(", "),
    });
  };

  return (
    <>
      <div className="mb-2 flex justify-center">
        <img src="/assets/images/logo-HTO.png" alt="HTO Logo" className="h-12 w-auto" />
      </div>
      <h2 className="mb-1 text-center text-[20px] font-bold text-[#111827] app-dark:text-white">Bổ sung thông tin</h2>
      <p className="mb-2.5 text-center text-[13px] leading-[1.35] text-[#6b7280]">
        {userName ? `${userName}, ` : ""}vui lòng hoàn tất thông tin liên hệ để tiếp tục.
      </p>

      <form noValidate onSubmit={handleSubmit(submitProfile)}>
        <div className="mb-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-[13px] font-semibold text-[#374151] app-dark:text-[#e5e7eb]" htmlFor="phone">Số điện thoại</label>
            <input
              type="tel"
              id="phone"
              className={inputClass}
              placeholder="Ví dụ: 0901234567"
              disabled={loading}
              {...register("phone", { required: "Vui lòng nhập số điện thoại." })}
            />
            {errors.phone && <div className="mt-1 text-[11px] font-medium text-[#f5365c]">{errors.phone.message}</div>}
          </div>
          <div>
            <label className="mb-1 block text-[13px] font-semibold text-[#374151] app-dark:text-[#e5e7eb]" htmlFor="socialLink">Link mạng xã hội</label>
            <input
              type="url"
              id="socialLink"
              className={inputClass}
              placeholder="Facebook/Zalo/LinkedIn..."
              disabled={loading}
              {...register("socialLink", { required: "Vui lòng nhập link mạng xã hội." })}
            />
            {errors.socialLink && <div className="mt-1 text-[11px] font-medium text-[#f5365c]">{errors.socialLink.message}</div>}
          </div>
        </div>

        <div className="mb-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-[13px] font-semibold text-[#374151] app-dark:text-[#e5e7eb]" htmlFor="city">Thành phố/Tỉnh</label>
            <select
              id="city"
              className={inputClass}
              disabled={loading}
              {...register("city", {
                required: "Vui lòng chọn thành phố/tỉnh.",
                onChange: () => setValue("ward", ""),
              })}
            >
              <option value="">-- Chọn thành phố/tỉnh --</option>
              {LOCATION_OPTIONS.map((option) => (
                <option key={option.city} value={option.city}>{option.city}</option>
              ))}
            </select>
            {errors.city && <div className="mt-1 text-[11px] font-medium text-[#f5365c]">{errors.city.message}</div>}
          </div>
          <div>
            <label className="mb-1 block text-[13px] font-semibold text-[#374151] app-dark:text-[#e5e7eb]" htmlFor="ward">Phường/Xã</label>
            <select
              id="ward"
              className={inputClass}
              disabled={loading || !selectedCity}
              {...register("ward", { required: "Vui lòng chọn phường/xã." })}
            >
              <option value="">{selectedCity ? "-- Chọn phường/xã --" : "Chọn thành phố trước"}</option>
              {wardOptions.map((ward) => (
                <option key={ward} value={ward}>{ward}</option>
              ))}
            </select>
            {errors.ward && <div className="mt-1 text-[11px] font-medium text-[#f5365c]">{errors.ward.message}</div>}
          </div>
        </div>

        <div className="mb-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-[13px] font-semibold text-[#374151] app-dark:text-[#e5e7eb]" htmlFor="addressDetail">Địa chỉ cụ thể</label>
            <input
              type="text"
              id="addressDetail"
              className={inputClass}
              placeholder="Số nhà, tên đường, tòa nhà..."
              disabled={loading}
              {...register("addressDetail", { required: "Vui lòng nhập địa chỉ cụ thể." })}
            />
            {errors.addressDetail && <div className="mt-1 text-[11px] font-medium text-[#f5365c]">{errors.addressDetail.message}</div>}
          </div>
          <div>
            <label className="mb-1 block text-[13px] font-semibold text-[#374151] app-dark:text-[#e5e7eb]" htmlFor="referralCode">Mã giới thiệu</label>
            <input
              type="text"
              id="referralCode"
              className={`${inputClass} ${referralFromUrl ? "opacity-75" : ""}`}
              placeholder="Nhập mã giới thiệu nếu có"
              disabled={loading || Boolean(referralFromUrl)}
              readOnly={Boolean(referralFromUrl)}
              {...register("referralCode")}
            />
            {referralFromUrl && (
              <div className="mt-1 text-[11px] font-medium text-[#6b7280]">
                Mã giới thiệu được tự động áp dụng.
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-[8px] border-0 bg-[#111827] px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1f2937] disabled:cursor-not-allowed disabled:opacity-70 app-dark:bg-[#4f46e5] app-dark:hover:bg-[#4338ca]"
          disabled={loading}
        >
          Hoàn tất thông tin
        </button>
      </form>
    </>
  );
}
