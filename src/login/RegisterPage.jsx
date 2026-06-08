import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { TailwindDropdown } from "../components/ui/TailwindDropdown";
import { RegisterSuccessPopup } from "./components/RegisterSuccessPopup";


import { API_BASE_URL } from "../config/api";

const GMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;

const PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

const ACCOUNT_BLANK_MESSAGE = "Vui lòng điền đầy đủ các thông tin: Họ tên, Email và Mật khẩu.";
const ACCOUNT_REQUIRED_MESSAGE = "Vui lòng nhập đầy đủ thông tin.";

const getRegisteredUserFromResponse = (response, fallback) => {
  const user = response?.data?.user || response?.data || response?.user || {};

  return {
    id: user.id || user._id || user.sub || "",
    name: user.fullName || user.name || fallback.name,
    email: user.email || fallback.email,
  };
};

const getApiMessage = (response, fallback) => {
  return response?.message || response?.error || response?.data?.message || fallback;
};

const isEmailErrorMessage = (message) => {
  const normalizedMessage = message.toLowerCase();
  return (
    normalizedMessage.includes("email") &&
    (normalizedMessage.includes("tồn tại") ||
      normalizedMessage.includes("sử dụng") ||
      normalizedMessage.includes("đã"))
  );
};

const isReferralErrorMessage = (message) => {
  const normalizedMessage = message.toLowerCase();
  return normalizedMessage.includes("mã giới thiệu") || normalizedMessage.includes("referral");
};

const checkEmailAvailability = async (email) => {
  const res = await fetch(`${API_BASE_URL}/auth/check-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const response = await res.json().catch(() => null);
  const message = getApiMessage(response, "Không thể kiểm tra email. Vui lòng thử lại.");
  const available = response?.data?.available;

  if (!res.ok) {
    throw new Error(message);
  }

  if (available === false) {
    return {
      available: false,
      message: response?.data?.message || message || "Email đã được sử dụng.",
    };
  }

  return {
    available: true,
    message: response?.data?.message || message,
  };
};

const ADDRESS_API_URL = "https://provinces.open-api.vn/api/v2/?depth=2";

const FALLBACK_LOCATION_OPTIONS = [
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

const normalizeLocationOptions = (items) => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((province) => ({
      city: province.name,
      wards: Array.isArray(province.wards)
        ? province.wards.map((ward) => ward.name).filter(Boolean)
        : [],
    }))
    .filter((province) => province.city && province.wards.length > 0);
};

export const RegisterPage = ({ onLayoutModeChange, onSwitchToLogin, onRegister }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [registrationStep, setRegistrationStep] = useState("account");
  const [registeredUser, setRegisteredUser] = useState(null);
  const [pendingAccountData, setPendingAccountData] = useState(null);
  const [profileDraft, setProfileDraft] = useState(null);
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
    getValues,
    clearErrors,
    setError,
    trigger,
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
  const emailField = register("email", {
    required: "Vui lòng nhập email.",
    pattern: {
      value: GMAIL_PATTERN,
      message: "Email phải là địa chỉ Gmail hợp lệ (ví dụ: example@gmail.com).",
    },
  });
  const shouldShowFieldError = (fieldName) => {
    const error = errors[fieldName];
    if (!error) return false;
    if (fieldName === "agreed") return true;
    return error.type !== "required";
  };

  useEffect(() => {
    onLayoutModeChange?.(registrationStep === "account" ? "account" : "profile");
  }, [onLayoutModeChange, registrationStep]);

  const onSubmit = async (data) => {
    setApiError("");
    clearErrors("email");
    setLoading(true);

    try {
      const emailCheck = await checkEmailAvailability(data.email);

      if (!emailCheck.available) {
        setError("email", {
          type: "server",
          message: emailCheck.message,
        });
        setApiError("");
        return;
      }

      const accountData = {
        name: data.name,
        email: data.email,
        password: data.password,
      };

      setPendingAccountData(accountData);
      setRegisteredUser({
        id: "",
        name: data.name,
        email: data.email,
      });
      setRegistrationStep("profile");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không thể kiểm tra email.";
      setError("email", {
        type: "server",
        message,
      });
      setApiError("");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailBlur = async () => {
    const isEmailValid = await trigger("email");
    const email = getValues("email")?.trim();

    if (!isEmailValid || !email) {
      return;
    }

    try {
      const emailCheck = await checkEmailAvailability(email);

      if (!emailCheck.available) {
        setError("email", {
          type: "server",
          message: emailCheck.message,
        });
        setApiError("");
        return;
      }

      if (errors.email?.type === "server") {
        clearErrors("email");
      }
    } catch (err) {
      setError("email", {
        type: "server",
        message: err instanceof Error ? err.message : "Không thể kiểm tra email.",
      });
      setApiError("");
    }
  };

  const handleAccountInvalid = (formErrors) => {
    const hasInvalidFieldError = Object.entries(formErrors).some(([fieldName, error]) => {
      if (!error) return false;
      if (fieldName === "agreed") return false;
      return error.type !== "required";
    });

    if (hasInvalidFieldError) {
      setApiError("");
      return;
    }

    const requiredAccountFields = ["name", "email", "password", "confirmPassword"];
    const hasRequiredAccountError = requiredAccountFields.some(
      (fieldName) => formErrors[fieldName]?.type === "required",
    );

    if (hasRequiredAccountError) {
      const currentValues = getValues();
      const isBlankAccountForm =
        !currentValues.name?.trim() &&
        !currentValues.email?.trim() &&
        !currentValues.password &&
        !currentValues.confirmPassword;

      setApiError(isBlankAccountForm ? ACCOUNT_BLANK_MESSAGE : ACCOUNT_REQUIRED_MESSAGE);
      return;
    }

    if (formErrors.agreed?.type === "required") {
      setApiError("");
      return;
    }

    const emailError = formErrors.email;
    if (emailError?.type === "server") {
      setError("email", emailError);
    }
  };

  const handleProfileComplete = async (profileData) => {
    setApiError("");
    setLoading(true);

    try {
      if (!pendingAccountData) {
        throw new Error("Thiếu thông tin tài khoản. Vui lòng quay lại bước đăng ký.");
      }

      const registerRes = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: pendingAccountData.name,
          email: pendingAccountData.email,
          password: pendingAccountData.password,
          phone: profileData.phone,
          city: profileData.city,
          ward: profileData.ward,
          addressDetail: profileData.addressDetail,
          address: profileData.address,
          socialLink: profileData.socialLink,
          socialUrl: profileData.socialLink,
          referralCode: profileData.referralCode || "",
          referral_code: profileData.referralCode || "",
          referral: profileData.referralCode || "",
          ref: profileData.referralCode || "",
          referral_code_user: profileData.referralCode || "",
          maGioiThieu: profileData.referralCode || "",
        }),
      });
      const registerResponse = await registerRes.json().catch(() => null);

      if (!registerRes.ok) {
        const message = getApiMessage(registerResponse, "Đăng ký thất bại");
        if (isEmailErrorMessage(message)) {
          setRegistrationStep("account");
          setError("email", {
            type: "server",
            message,
          });
          setApiError("");
          setLoading(false);
          return;
        }
        if (isReferralErrorMessage(message)) {
          throw new Error(message);
        }
        throw new Error(message);
      }

      const createdUser = getRegisteredUserFromResponse(registerResponse, {
        name: pendingAccountData.name,
        email: pendingAccountData.email,
      });

      const profileRes = await fetch(`${API_BASE_URL}/auth/register-profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: createdUser.id || "",
          phone: profileData.phone,
          socialLink: profileData.socialLink,
          city: profileData.city,
          ward: profileData.ward,
          addressDetail: profileData.addressDetail,
          referralCode: profileData.referralCode || "",
        }),
      });
      const profileResponse = await profileRes.json().catch(() => null);

      if (!profileRes.ok) {
        const message = getApiMessage(
          profileResponse,
          "Không thể cập nhật thông tin bổ sung.",
        );
        if (isReferralErrorMessage(message)) {
          throw new Error(message);
        }
        throw new Error(message);
      }

      setRegisteredUser(
        getRegisteredUserFromResponse(profileResponse, createdUser),
      );
      setPendingAccountData(null);
      setProfileDraft(null);
      setRegistrationStep("success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không thể cập nhật thông tin bổ sung.";
      if (message.toLowerCase().includes("mã giới thiệu")) {
        throw err;
      }
      setApiError(message);
    } finally {
      setLoading(false);
    }
  };

  const isProfileStep = registrationStep === "profile";
  const isSuccessStep = registrationStep === "success";

  if (isProfileStep || isSuccessStep) {
    const customerName =
      registeredUser?.name ||
      registeredUser?.fullName ||
      registeredUser?.email ||
      "khách hàng";

    return (
      <>
        <RegistrationProfilePage
          inputClass={inputClass}
          loading={loading}
          profileError={apiError}
          initialData={profileDraft}
          onComplete={handleProfileComplete}
          onDraftChange={setProfileDraft}
          onBack={(draft) => {
            setProfileDraft(draft);
            setApiError("");
            setRegistrationStep("account");
          }}
          referralFromUrl={referralFromUrl}
          userName={registeredUser?.name}
        />
        {isSuccessStep && (
          <RegisterSuccessPopup
            customerName={customerName}
            onBackToLogin={onSwitchToLogin}
          />
        )}
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

      <form autoComplete="off" noValidate onSubmit={(event) => event.preventDefault()}>
        <div className="mb-3">
          <label className="mb-1.5 block text-[13px] font-semibold text-[#374151] app-dark:text-[#e5e7eb]" htmlFor="name">Họ và tên</label>
          <input
            type="text"
            id="name"
            className={inputClass}
            placeholder="Ví dụ: Nguyễn Văn A"
            autoComplete="off"
            disabled={loading}
            {...register("name", { required: "Vui lòng nhập họ tên." })}
          />
          {shouldShowFieldError("name") && <div className="mt-1 text-[11px] font-medium text-[#f5365c]">{errors.name.message}</div>}
        </div>

        <div className="mb-3">
          <label className="mb-1.5 block text-[13px] font-semibold text-[#374151] app-dark:text-[#e5e7eb]" htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            className={`${inputClass} ${errors.email ? "border-[#f5365c]" : ""}`}
            placeholder="Ví dụ: name@gmail.com"
            autoComplete="off"
            disabled={loading}
            {...emailField}
            onBlur={(event) => {
              emailField.onBlur(event);
              void handleEmailBlur();
            }}
          />
          {shouldShowFieldError("email") && <div className="mt-1 text-[11px] font-medium text-[#f5365c]">{errors.email.message}</div>}
        </div>

        <div className="mb-3">
          <label className="mb-1.5 block text-[13px] font-semibold text-[#374151] app-dark:text-[#e5e7eb]" htmlFor="password">Mật khẩu</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              className={inputClass}
              placeholder="Ít nhất 8 ký tự"
              autoComplete="new-password"
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
          {shouldShowFieldError("password") && <div className="mt-1 text-[11px] font-medium text-[#f5365c]">{errors.password.message}</div>}
        </div>

        <div className="mb-3">
          <label className="mb-1.5 block text-[13px] font-semibold text-[#374151] app-dark:text-[#e5e7eb]" htmlFor="confirmPassword">Xác nhận mật khẩu</label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="confirmPassword"
              className={inputClass}
              placeholder="Ít nhất 8 ký tự"
              autoComplete="new-password"
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
          {shouldShowFieldError("confirmPassword") && <div className="mt-1 text-[11px] font-medium text-[#f5365c]">{errors.confirmPassword.message}</div>}
        </div>

        <div className="mt-2 mb-4">
          <div className="flex items-center">
            <input type="checkbox" id="agreed" className="mt-0 mr-2 h-4 w-4 rounded border border-[#d1d5db] text-[#4f46e5]" {...register("agreed", { required: "Bạn chưa đồng ý." })} />
            <label className="mb-0 block text-xs font-normal text-[#374151] app-dark:text-[#e5e7eb]" htmlFor="agreed">
              Tôi đồng ý với <a href="#" className="text-[#4f46e5] no-underline" onClick={(e) => e.preventDefault()}>Điều khoản & Điều kiện</a>
            </label>
          </div>
          {shouldShowFieldError("agreed") && <div className="mt-1 text-[11px] font-medium text-[#f5365c]">{errors.agreed.message}</div>}
        </div>

        <button type="button" className="mt-1.5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-[8px] border-0 bg-[#111827] px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1f2937] disabled:cursor-not-allowed disabled:opacity-70 app-dark:bg-[#4f46e5] app-dark:hover:bg-[#4338ca]" disabled={loading} onClick={handleSubmit(onSubmit, handleAccountInvalid)}>
          {loading ? <div className="h-[18px] w-[18px] animate-spin rounded-full border-2 border-[rgba(255,255,255,0.3)] border-t-white"></div> : "Tiếp theo"}
        </button>
      </form>

      <div className="text-center text-[13px] text-[#6b7280]">
        Đã có tài khoản? <a href="#" className="ml-1 font-semibold text-[#4f46e5] no-underline hover:underline" onClick={(e) => { e.preventDefault(); onSwitchToLogin(); }}>Đăng nhập ngay</a>
      </div>
    </>
  );
};

function RegistrationProfilePage({
  inputClass,
  loading,
  initialData,
  onBack,
  onComplete,
  onDraftChange,
  profileError,
  referralFromUrl,
  userName,
}) {
  const {
    register,
    handleSubmit,
    watch,
    getValues,
    setError,
    setValue,
    formState: { errors },
  } = useForm({
    mode: "onChange",
    defaultValues: {
      phone: initialData?.phone || "",
      city: initialData?.city || "",
      ward: initialData?.ward || "",
      addressDetail: initialData?.addressDetail || "",
      socialLink: initialData?.socialLink || "",
      referralCode: initialData?.referralCode ?? referralFromUrl,
    },
  });
  const [locationOptions, setLocationOptions] = useState(FALLBACK_LOCATION_OPTIONS);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState("");
  const selectedCity = watch("city");
  const selectedWard = watch("ward");
  const wardOptions = locationOptions.find((option) => option.city === selectedCity)?.wards || [];

  useEffect(() => {
    let isMounted = true;

    const loadLocationOptions = async () => {
      setAddressLoading(true);
      setAddressError("");

      try {
        const res = await fetch(ADDRESS_API_URL);
        const data = await res.json().catch(() => null);
        const normalizedOptions = normalizeLocationOptions(data);

        if (!res.ok || normalizedOptions.length === 0) {
          throw new Error("Không thể tải danh sách địa chỉ.");
        }

        if (isMounted) {
          setLocationOptions(normalizedOptions);
        }
      } catch {
        if (isMounted) {
          setLocationOptions(FALLBACK_LOCATION_OPTIONS);
          setAddressError("Không thể tải địa chỉ mới nhất, đang dùng danh sách dự phòng.");
        }
      } finally {
        if (isMounted) {
          setAddressLoading(false);
        }
      }
    };

    void loadLocationOptions();

    return () => {
      isMounted = false;
    };
  }, []);

  const submitProfile = async (data) => {
    onDraftChange?.(data);
    try {
      await onComplete({
        ...data,
        address: [data.addressDetail, data.ward, data.city].filter(Boolean).join(", "),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không thể cập nhật thông tin bổ sung.";
      if (isReferralErrorMessage(message)) {
        setError("referralCode", {
          type: "server",
          message,
        });
        return;
      }
      throw err;
    }
  };

  const handleBack = () => {
    onBack?.(getValues());
  };

  return (
    <>
      <div className="mb-2 grid grid-cols-[32px_1fr_32px] items-center">
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-full  bg-white text-[#374151] transition hover:bg-[#f3f4f6] disabled:cursor-not-allowed disabled:opacity-60 app-dark:border-[#4b5563] app-dark:bg-[#374151] app-dark:text-white app-dark:hover:bg-[#4b5563]"
          disabled={loading}
          onClick={handleBack}
          aria-label="Quay lại bước tạo tài khoản"
          title="Quay lại"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5"></path>
            <path d="M12 19l-7-7 7-7"></path>
          </svg>
        </button>
        <img src="/assets/images/logo-HTO.png" alt="HTO Logo" className="mx-auto h-12 w-auto" />
        <span aria-hidden="true"></span>
      </div>
      <h2 className="mb-1 text-center text-[20px] font-bold text-[#111827] app-dark:text-white">Bổ sung thông tin</h2>
      <p className="mb-2.5 text-center text-[13px] leading-[1.35] text-[#6b7280]">Xin chào 
        {userName ? `${userName}, ` : ""}vui lòng hoàn tất thông tin liên hệ để tiếp tục.
      </p>

      {profileError && (
        <div className="mb-2.5 rounded-xl border border-[#fecdd3] bg-[#fff1f2] px-3 py-2 text-[13px] text-[#be123c] app-dark:border-[#7f1d1d] app-dark:bg-[#2a1215] app-dark:text-[#fecdd3]">
          {profileError}
        </div>
      )}

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
            <input
              type="hidden"
              {...register("city", { required: "Vui lòng chọn thành phố/tỉnh." })}
            />
            <TailwindDropdown
              buttonClassName={`!rounded-[8px] border bg-[#f9fafb] app-dark:border-[#4b5563] app-dark:bg-[#374151] ${
                errors.city ? "border-[#f5365c]" : "border-[#d1d5db]"
              }`}
              disabled={loading || addressLoading}
              error={Boolean(errors.city)}
              onChange={(value) => {
                setValue("city", value, { shouldDirty: true, shouldValidate: true });
                setValue("ward", "", { shouldDirty: true, shouldValidate: true });
              }}
              options={[
                { label: addressLoading ? "Đang tải địa chỉ..." : "-- Chọn thành phố/tỉnh --", value: "" },
                ...locationOptions.map((option) => ({ label: option.city, value: option.city })),
              ]}
              placeholder={addressLoading ? "Đang tải địa chỉ..." : "-- Chọn thành phố/tỉnh --"}
              value={selectedCity}
            />
            {errors.city && <div className="mt-1 text-[11px] font-medium text-[#f5365c]">{errors.city.message}</div>}
            {addressError && !errors.city && <div className="mt-1 text-[11px] font-medium text-[#f59e0b]">{addressError}</div>}
          </div>
          <div>
            <label className="mb-1 block text-[13px] font-semibold text-[#374151] app-dark:text-[#e5e7eb]" htmlFor="ward">Phường/Xã</label>
            <input
              type="hidden"
              {...register("ward", { required: "Vui lòng chọn phường/xã." })}
            />
            <TailwindDropdown
              buttonClassName={`!rounded-[8px] border bg-[#f9fafb] app-dark:border-[#4b5563] app-dark:bg-[#374151] ${
                errors.ward ? "border-[#f5365c]" : "border-[#d1d5db]"
              }`}
              disabled={loading || !selectedCity}
              error={Boolean(errors.ward)}
              onChange={(value) => setValue("ward", value, { shouldDirty: true, shouldValidate: true })}
              options={[
                { label: selectedCity ? "-- Chọn phường/xã --" : "Chọn thành phố trước", value: "" },
                ...wardOptions.map((ward) => ({ label: ward, value: ward })),
              ]}
              placeholder={selectedCity ? "-- Chọn phường/xã --" : "Chọn thành phố trước"}
              value={selectedWard}
            />
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
            {errors.referralCode && <div className="mt-1 text-[11px] font-medium text-[#f5365c]">{errors.referralCode.message}</div>}
          </div>
        </div>

        <button
          type="submit"
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-[8px] border-0 bg-[#111827] px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1f2937] disabled:cursor-not-allowed disabled:opacity-70 app-dark:bg-[#4f46e5] app-dark:hover:bg-[#4338ca]"
          disabled={loading}
        >
          {loading ? <div className="h-[18px] w-[18px] animate-spin rounded-full border-2 border-[rgba(255,255,255,0.3)] border-t-white"></div> : "Hoàn tất thông tin"}
        </button>
      </form>
    </>
  );
}
