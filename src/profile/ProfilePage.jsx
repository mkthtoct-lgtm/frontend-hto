import { useEffect, useMemo, useState } from "react";
import { authFetch, getAuthHeaders } from "../auth/session";
import { API_BASE_URL } from "../config/api";

const PROFILE_EXTRAS_KEY = "hto_profile_extras";
const ADMIN_ROLE_ID = "69fc5af582ef85451120772a";
const COLLABORATOR_ROLE_ID = "69fc5af682ef85451120772f";

const ROLE_ID_MAP = {
  "69fc5af582ef85451120772a": "admin",
  "69fc5af582ef85451120772b": "bangiamdoc",
  "69fc5af582ef85451120772c": "truongbophan",
  "69fc5af582ef85451120772d": "nhansu",
  "69fc5af582ef85451120772e": "daily",
  "69fc5af682ef85451120772f": "congtacvien",
  "69fc5af782ef854511207730": "user",
};

const ROLE_LABELS = {
  admin: "Quản trị viên",
  bangiamdoc: "Ban giám đốc",
  truongbophan: "Trưởng bộ phận",
  nhansu: "Nhân sự",
  daily: "Đại lý",
  congtacvien: "Cộng tác viên",
  user: "Người dùng",
};

const RANKS = [
  { key: "none", name: "Chưa có deal", title: "Chưa có deal", minDeals: 0, color: "#64748b" },
  { key: "loyal", name: "Khách hàng thân thiết", title: "Khách hàng thân thiết", minDeals: 5, color: "#0ea5e9", badgeImage: "/assets/images/huyhieu7.png" },
  { key: "bronze", name: "Đồng", title: "Đại sứ gieo mầm", minDeals: 15, color: "#b45309" },
  { key: "silver", name: "Bạc", title: "Đại sứ kết nối", minDeals: 50, color: "#64748b" },
  { key: "gold", name: "Vàng", title: "Đại sứ trụ cột", minDeals: 150, color: "#ca8a04" },
  { key: "diamond", name: "Kim cương", title: "Đại sứ tinh anh", minDeals: null, color: "#0891b2" },
  { key: "master", name: "Master", title: "Đại sứ tận tâm", minDeals: null, color: "#7c3aed" },
];

const DEMO_QUARTER_MONTHS = [
  { month: "Tháng 4", target: 5, deals: 6 },
  { month: "Tháng 5", target: 5, deals: 3 },
  { month: "Tháng 6", target: 5, deals: 4 },
];

const ADDRESS_PROVINCES = [
  "An Giang",
  "Bắc Ninh",
  "Cà Mau",
  "Cần Thơ",
  "Cao Bằng",
  "Đà Nẵng",
  "Đắk Lắk",
  "Điện Biên",
  "Đồng Nai",
  "Đồng Tháp",
  "Gia Lai",
  "Hà Nội",
  "Hà Tĩnh",
  "Hải Phòng",
  "Hồ Chí Minh",
  "Huế",
  "Hưng Yên",
  "Khánh Hòa",
  "Lai Châu",
  "Lâm Đồng",
  "Lạng Sơn",
  "Lào Cai",
  "Nghệ An",
  "Ninh Bình",
  "Phú Thọ",
  "Quảng Ngãi",
  "Quảng Ninh",
  "Quảng Trị",
  "Sơn La",
  "Tây Ninh",
  "Thái Nguyên",
  "Thanh Hóa",
  "Tuyên Quang",
  "Vĩnh Long",
];

const ADDRESS_WARDS = {
  "Hà Nội": ["Ba Đình", "Hoàn Kiếm", "Cửa Nam", "Tây Hồ", "Long Biên", "Hà Đông"],
  "Hồ Chí Minh": ["Sài Gòn", "Bến Thành", "Tân Định", "Chợ Lớn", "Bình Tây", "Thủ Đức"],
  "Đà Nẵng": ["Hải Châu", "Thanh Khê", "Sơn Trà", "Ngũ Hành Sơn", "Cẩm Lệ"],
  "Hải Phòng": ["Hồng Bàng", "Lê Chân", "Ngô Quyền", "Kiến An", "Đồ Sơn"],
  "Cần Thơ": ["Ninh Kiều", "Cái Răng", "Bình Thủy", "Ô Môn", "Thốt Nốt"],
  Huế: ["Thuận Hóa", "Phú Xuân", "Hương Thủy", "Hương Trà", "Phong Điền"],
};

const getInitials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "HT";

const readProfileExtras = (userId) => {
  try {
    const allExtras = JSON.parse(window.localStorage.getItem(PROFILE_EXTRAS_KEY) || "{}");
    return allExtras[userId] || {};
  } catch {
    return {};
  }
};

const writeProfileExtras = (userId, extras) => {
  try {
    const allExtras = JSON.parse(window.localStorage.getItem(PROFILE_EXTRAS_KEY) || "{}");
    window.localStorage.setItem(
      PROFILE_EXTRAS_KEY,
      JSON.stringify({ ...allExtras, [userId]: extras }),
    );
  } catch {
    // Local profile extras are a convenience layer only.
  }
};

const getApiMessage = (payload, fallback) => {
  const details = payload?.error?.details;
  if (Array.isArray(details) && details.length > 0) return details[0];
  return payload?.message || payload?.data?.message || fallback;
};

const normalizeUserPayload = (payload, fallback = {}) => {
  const data = payload?.data?.user || payload?.data || payload?.user || payload || {};
  const profile = data.profile || {};

  return {
    id: data.id || data._id || fallback.id || "",
    fullName: data.fullName || data.name || fallback.fullName || fallback.name || "",
    name: data.name || data.fullName || fallback.name || fallback.fullName || "",
    email: data.email || fallback.email || "",
    phone: data.phone || fallback.phone || "",
    address: data.address || profile.address || fallback.address || "",
    socialLink: data.socialLink || data.socialUrl || profile.socialLink || fallback.socialLink || "",
    avatarUrl: data.avatarUrl || profile.avatarUrl || fallback.avatarUrl || "",
    bannerUrl: data.bannerUrl || profile.bannerUrl || fallback.bannerUrl || "",
    referralCode: data.referralCode || data.referral_code || profile.referralCode || fallback.referralCode || "",
    roleId: data.roleId || fallback.roleId || "",
    role: data.role || ROLE_ID_MAP[data.roleId] || fallback.role || ROLE_ID_MAP[fallback.roleId] || "user",
    departmentId: data.departmentId || fallback.departmentId || "",
    status: data.status || fallback.status || "active",
    dealCount: Number(data.dealCount ?? data.deals ?? profile.dealCount ?? fallback.dealCount ?? 18) || 0,
  };
};

async function requestUser(userId) {
  const response = await authFetch(`${API_BASE_URL}/users/${userId}`, {
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(getApiMessage(payload, "Không thể tải thông tin hồ sơ."));
  }

  return payload;
}

async function updateUser(userId, body) {
  const response = await authFetch(`${API_BASE_URL}/users/${userId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(getApiMessage(payload, "Không thể cập nhật hồ sơ."));
  }

  return payload;
}

async function requestPasswordReset(email) {
  const response = await authFetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ email }),
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(getApiMessage(payload, "Không thể gửi email đổi mật khẩu."));
  }

  return payload;
}

async function requestReferralInfo() {
  const response = await authFetch(`${API_BASE_URL}/auth/me/referral`, {
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(getApiMessage(payload, "Không thể tải mã giới thiệu."));
  }

  return payload?.data ?? payload;
}

const getCurrentQuarterLabel = () => {
  const now = new Date();
  const quarter = Math.floor(now.getMonth() / 3) + 1;
  return `Quý ${quarter}/${now.getFullYear()}`;
};

const getRankByDeals = (dealCount) => {
  const ranked = RANKS.filter((rank) => typeof rank.minDeals === "number" && dealCount >= rank.minDeals);
  return ranked[ranked.length - 1] || RANKS[0];
};

const getNextRank = (dealCount) =>
  RANKS.find((rank) => typeof rank.minDeals === "number" && rank.minDeals > dealCount) || null;

const parseAddressDraft = (address = "") => {
  const parts = String(address || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const province = ADDRESS_PROVINCES.includes(parts.at(-1)) ? parts.pop() : "";
  const ward = province && parts.length ? parts.pop() : "";
  return {
    detail: parts.join(", "),
    ward,
    province,
  };
};

const composeAddress = ({ detail, ward, province }) =>
  [detail, ward, province]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(", ");

const ui = {
  page: "mx-auto w-full max-w-[1480px] px-3 py-4 sm:px-4 sm:py-[18px] sm:pb-7",
  panel:
    "rounded-lg border border-slate-200 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.06)] app-dark:border-slate-700 app-dark:bg-slate-900",
  panelHeading: "mb-[18px] flex items-start justify-between gap-4",
  sectionLabel: "mb-1.5 text-xs font-extrabold uppercase tracking-normal text-slate-500",
  h2: "m-0 text-xl font-extrabold leading-tight text-slate-900 app-dark:text-slate-50",
  iconButton:
    "grid h-[42px] w-[42px] place-items-center rounded-xl border border-white/30 bg-white/15 text-white transition hover:-translate-y-px hover:bg-white/25 [&>svg]:h-5 [&>svg]:w-5",
  textButton: "rounded-xl border-0 bg-slate-200 px-3 py-2.5 text-[13px] font-extrabold text-slate-900 app-dark:bg-slate-800 app-dark:text-slate-100",
  primaryButton:
    "rounded-xl border-0 bg-slate-900 px-3 py-2.5 text-[13px] font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-70 app-dark:bg-sky-500 app-dark:text-white",
  secondaryButton: "rounded-xl border-0 bg-slate-200 px-3 py-2.5 text-[13px] font-extrabold text-slate-900 app-dark:bg-slate-800 app-dark:text-slate-100",
  muted: "text-sm leading-6 text-slate-500 app-dark:text-slate-400",
  input:
    "w-full min-w-0 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 app-dark:border-slate-700 app-dark:bg-slate-800 app-dark:text-slate-50 app-dark:[color-scheme:dark]",
  modalBackdrop: "fixed inset-0 z-[1080] grid place-items-center bg-slate-900/50 p-[18px]",
  modal:
    "max-h-[calc(100vh-36px)] w-full max-w-[760px] overflow-auto rounded-xl bg-white p-[22px] shadow-[0_24px_70px_rgba(15,23,42,0.28)] app-dark:bg-slate-900",
  modalHeader: "mb-[18px] flex items-start justify-between gap-[18px]",
  closeButton: "grid h-[34px] w-[34px] place-items-center rounded-xl border-0 bg-slate-100 text-2xl leading-none text-slate-900 app-dark:bg-slate-800 app-dark:text-slate-50",
};

const Icon = ({ name, className = "h-5 w-5" }) => {
  const paths = {
    camera: (
      <>
        <path d="M14.5 5.5 13 3H7L5.5 5.5H3a2 2 0 0 0-2 2V18a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V7.5a2 2 0 0 0-2-2h-6.5Z" />
        <circle cx="12" cy="13" r="4" />
      </>
    ),
    edit: (
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09A1.65 1.65 0 0 0 15 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.14.31.22.65.22 1H21a2 2 0 0 1 0 4h-.09c-.34 0-.68.08-1 .22Z" />
      </>
    ),
    copy: (
      <>
        <rect x="9" y="9" width="13" height="13" rx="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </>
    ),
    download: (
      <>
        <path d="M12 3v12" />
        <path d="m7 10 5 5 5-5" />
        <path d="M5 21h14" />
      </>
    ),
    user: (
      <>
        <path d="M20 21a8 8 0 0 0-16 0" />
        <circle cx="12" cy="7" r="4" />
      </>
    ),
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </>
    ),
    phone: <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.8 19.8 0 0 1 3.08 5.18 2 2 0 0 1 5.06 3h3a2 2 0 0 1 2 1.72c.12.9.32 1.78.59 2.63a2 2 0 0 1-.45 2.11L9 10.91a16 16 0 0 0 5.09 5.09l1.45-1.2a2 2 0 0 1 2.11-.45c.85.27 1.73.47 2.63.59A2 2 0 0 1 22 16.92Z" />,
    map: (
      <>
        <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 0 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
      </>
    ),
    shield: (
      <>
        <path d="M12 2 20 6v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6Z" />
        <path d="M9 12l2 2 4-5" />
      </>
    ),
    lock: (
      <>
        <rect x="4" y="11" width="16" height="10" rx="2" />
        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      </>
    ),
  };

  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
};

const KpiCircle = ({ percent, tone }) => {
  const color = tone === "warning" ? "#f59e0b" : "#34c27b";
  return (
    <div
      className="grid h-[70px] w-[70px] place-items-center rounded-full"
      style={{ background: `conic-gradient(${color} ${percent}%, #edf2f7 0)` }}
    >
      <div className="grid h-[52px] w-[52px] place-items-center rounded-full bg-white text-sm font-extrabold text-slate-900 app-dark:bg-slate-950 app-dark:text-slate-50">
        {percent}%
      </div>
    </div>
  );
};

export const ProfilePage = ({ currentUser, onUserUpdate }) => {
  const initialRoleKey = currentUser?.role || ROLE_ID_MAP[currentUser?.roleId] || "user";
  const canUseUserManagementApi = initialRoleKey === "admin" || currentUser?.roleId === ADMIN_ROLE_ID;
  const [profile, setProfile] = useState(() =>
    normalizeUserPayload({ data: currentUser }, { ...currentUser, ...readProfileExtras(currentUser?.id) }),
  );
  const [formData, setFormData] = useState(profile);
  const [addressDraft, setAddressDraft] = useState(() => parseAddressDraft(profile.address));
  const [editMode, setEditMode] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(Boolean(currentUser?.id && canUseUserManagementApi));
  const [saving, setSaving] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState("");
  const [referralInfo, setReferralInfo] = useState(null);
  const [referralLoading, setReferralLoading] = useState(false);
  const [referralError, setReferralError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      if (!currentUser?.id) return;
      const extras = readProfileExtras(currentUser.id);

      if (!canUseUserManagementApi) {
        const fallbackProfile = normalizeUserPayload({ data: currentUser }, { ...currentUser, ...extras });
        setProfile(fallbackProfile);
        setFormData(fallbackProfile);
        setError("");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const payload = await requestUser(currentUser.id);
        if (!isMounted) return;
        const nextProfile = normalizeUserPayload(payload, { ...currentUser, ...extras });
        const mergedProfile = { ...nextProfile, ...extras };
        setProfile(mergedProfile);
        setFormData(mergedProfile);
      } catch (requestError) {
        if (!isMounted) return;
        const extras = readProfileExtras(currentUser.id);
        const fallbackProfile = normalizeUserPayload({ data: currentUser }, { ...currentUser, ...extras });
        setProfile(fallbackProfile);
        setFormData(fallbackProfile);
        setError(requestError instanceof Error ? requestError.message : "Không thể tải thông tin hồ sơ.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, [canUseUserManagementApi, currentUser]);

  const currentRank = useMemo(() => getRankByDeals(profile.dealCount), [profile.dealCount]);
  const previewBadgeImage = "/assets/images/huyhieu7.png";
  const nextRank = useMemo(() => getNextRank(profile.dealCount), [profile.dealCount]);
  const roleKey = profile.role || ROLE_ID_MAP[profile.roleId] || currentUser?.role || ROLE_ID_MAP[currentUser?.roleId] || "user";
  const wardOptions = ADDRESS_WARDS[addressDraft.province] || [];
  const isCustomWard = Boolean(addressDraft.ward && !wardOptions.includes(addressDraft.ward));
  const isAdminProfile = roleKey === "admin" || profile.roleId === ADMIN_ROLE_ID;
  const isCollaboratorProfile = roleKey === "congtacvien" || profile.roleId === COLLABORATOR_ROLE_ID;
  const roleLabel = ROLE_LABELS[roleKey] || "Tài khoản";
  const canEditProfile = isAdminProfile;
  const canEditLocalProfile = Boolean(profile.id);
  const referralCode = referralInfo?.referralCode || "";
  const referralUrl = referralInfo?.referralUrl || "";
  const qrUrl = useMemo(
    () =>
      referralUrl
        ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(referralUrl)}`
        : "",
    [referralUrl],
  );

  useEffect(() => {
    let isMounted = true;

    const loadReferralInfo = async () => {
      setReferralLoading(true);
      setReferralError("");

      try {
        const data = await requestReferralInfo();
        if (!isMounted) return;
        setReferralInfo({
          referralCode: data?.referralCode || "",
          referralUrl: data?.referralUrl || "",
        });
      } catch (requestError) {
        if (!isMounted) return;
        setReferralInfo(null);
        setReferralError(requestError instanceof Error ? requestError.message : "Không thể tải mã giới thiệu.");
      } finally {
        if (isMounted) setReferralLoading(false);
      }
    };

    if (isCollaboratorProfile && profile.id) {
      void loadReferralInfo();
    } else {
      setReferralInfo(null);
      setReferralError("");
      setReferralLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [isCollaboratorProfile, profile.id]);

  const quarterStats = useMemo(() => {
    const failedMonths = DEMO_QUARTER_MONTHS.filter((item) => item.deals < item.target).length;
    return {
      failedMonths,
      passedMonths: DEMO_QUARTER_MONTHS.length - failedMonths,
      isDowngradeRisk: failedMonths >= 3,
    };
  }, []);

  const handleFieldChange = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const openEditModal = (mode) => {
    setFormData(profile);
    setAddressDraft(parseAddressDraft(profile.address));
    setEditMode(mode);
    setError("");
  };

  const handleAddressChange = (field, value) => {
    setAddressDraft((current) => {
      const next = field === "province" ? { ...current, province: value, ward: "" } : { ...current, [field]: value };
      setFormData((form) => ({ ...form, address: composeAddress(next) }));
      return next;
    });
  };

  const handleImageFile = (field, file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chọn đúng định dạng ảnh.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Ảnh cần nhỏ hơn 2MB để lưu tạm trên frontend.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      handleFieldChange(field, String(reader.result || ""));
      setError("");
    };
    reader.onerror = () => setError("Không thể đọc ảnh từ máy.");
    reader.readAsDataURL(file);
  };

  const handleImageDrop = (event, field) => {
    event.preventDefault();
    handleImageFile(field, event.dataTransfer.files?.[0]);
  };

  const handleCancelEdit = () => {
    setFormData(profile);
    setEditMode(null);
    setError("");
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!profile.id) return;

    setSaving(true);
    setError("");
    setNotice("");

    const trimmedForm = {
      ...formData,
      fullName: formData.fullName.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      address: formData.address.trim(),
      socialLink: formData.socialLink.trim(),
      avatarUrl: formData.avatarUrl.trim(),
      bannerUrl: formData.bannerUrl.trim(),
    };

    if (!canEditProfile) {
      const mergedProfile = { ...profile, ...trimmedForm };
      const extras = {
        fullName: mergedProfile.fullName,
        phone: mergedProfile.phone,
        address: mergedProfile.address,
        socialLink: mergedProfile.socialLink,
        avatarUrl: mergedProfile.avatarUrl,
        bannerUrl: mergedProfile.bannerUrl,
        dealCount: mergedProfile.dealCount,
      };

      writeProfileExtras(profile.id, extras);
      setProfile(mergedProfile);
      setFormData(mergedProfile);
      setEditMode(null);
      setNotice("Đã lưu thông tin hiển thị trên frontend.");
      onUserUpdate?.(mergedProfile);
      setSaving(false);
      return;
    }

    try {
      const payload = await updateUser(profile.id, {
        fullName: trimmedForm.fullName,
        email: trimmedForm.email,
        phone: trimmedForm.phone || undefined,
        status: profile.status,
        roleId: profile.roleId || undefined,
        departmentId: profile.departmentId || undefined,
      });
      const updatedProfile = normalizeUserPayload(payload, { ...profile, ...trimmedForm });
      const mergedProfile = { ...updatedProfile, ...trimmedForm };
      const extras = {
        address: mergedProfile.address,
        socialLink: mergedProfile.socialLink,
        avatarUrl: mergedProfile.avatarUrl,
        bannerUrl: mergedProfile.bannerUrl,
        dealCount: mergedProfile.dealCount,
      };

      writeProfileExtras(profile.id, extras);
      setProfile(mergedProfile);
      setFormData(mergedProfile);
      setEditMode(null);
      setNotice("Đã lưu thông tin hồ sơ.");
      onUserUpdate?.(mergedProfile);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Không thể cập nhật hồ sơ.");
    } finally {
      setSaving(false);
    }
  };

  const copyText = async (value, label) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      window.setTimeout(() => setCopied(""), 1800);
    } catch {
      setError("Không thể sao chép nội dung.");
    }
  };

  const handleShare = async () => {
    if (!referralUrl) return;
    if (navigator.share) {
      await navigator.share({
        title: "Mã giới thiệu HTO",
        text: `Đăng ký tài khoản với mã giới thiệu ${referralCode}`,
        url: referralUrl,
      });
      return;
    }
    await copyText(referralUrl, "link");
  };

  const handlePasswordReset = async () => {
    if (!profile.email) return;
    setPasswordLoading(true);
    setError("");
    setNotice("");

    try {
      await requestPasswordReset(profile.email);
      setNotice(`Đã gửi liên kết đổi mật khẩu về ${profile.email}.`);
      setIsSettingsOpen(false);
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : "Không thể gửi email đổi mật khẩu.");
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={ui.page}>
        <div className="flex min-h-[260px] items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white font-extrabold text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.06)] app-dark:border-slate-700 app-dark:bg-slate-900">
          <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-slate-300 border-t-sky-500" />
          <span>Đang tải hồ sơ...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page mx-auto w-full max-w-[1280px] bg-[#f8fbff] px-3 py-4 text-slate-900 app-dark:bg-[#151515] app-dark:text-slate-100 sm:px-4">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_10px_28px_rgba(30,64,175,0.08)] app-dark:border-slate-700 app-dark:bg-slate-900">
        <div className="relative h-[150px] overflow-hidden bg-gradient-to-br from-indigo-500 via-sky-300 to-blue-500 sm:h-[180px]">
          <div className="absolute inset-0 opacity-70">
            <div className="absolute -left-16 top-5 h-48 w-[520px] rotate-[-8deg] rounded-[100%] bg-white/20 blur-sm" />
            <div className="absolute left-[16%] top-20 h-28 w-[520px] rotate-[11deg] rounded-[100%] bg-white/35 blur-[2px]" />
            <div className="absolute right-[-8%] top-[-28px] h-72 w-72 rounded-full border-[34px] border-white/18" />
          </div>
          <img
            className="absolute inset-0 h-full w-full object-cover opacity-35 mix-blend-screen"
            src={profile.bannerUrl || "/assets/images/banner-second.jpg"}
            alt="Ảnh banner hồ sơ"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
          {canEditLocalProfile && (
            <div className="absolute right-4 top-4 grid gap-2">
              <button className="inline-flex items-center gap-2 rounded-2xl bg-white/85 px-3 py-2 text-xs font-bold text-slate-800 shadow-sm backdrop-blur app-dark:bg-slate-950/85 app-dark:text-slate-100" type="button" onClick={() => openEditModal("banner")}>
                <Icon name="edit" className="h-4 w-4" />
                Chỉnh sửa banner
              </button>
              <button className="inline-flex items-center gap-2 rounded-2xl bg-white/85 px-3 py-2 text-xs font-bold text-slate-800 shadow-sm backdrop-blur app-dark:bg-slate-950/85 app-dark:text-slate-100" type="button" onClick={() => openEditModal("avatar")}>
                <Icon name="camera" className="h-4 w-4" />
                Chỉnh sửa ảnh
              </button>
            </div>
          )}
        </div>

        <div className="relative flex flex-col gap-3 px-5 pb-4 pt-3 sm:px-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative -mt-16 h-[108px] w-[108px] shrink-0 rounded-full bg-indigo-100 shadow-lg">
              {profile.avatarUrl ? (
                <img
                  className="h-full w-full rounded-full object-cover"
                  src={profile.avatarUrl}
                  alt={profile.fullName || "Ảnh đại diện"}
                  onError={(event) => {
                    event.currentTarget.src = "/assets/images/logo-HTO.png";
                  }}
                />
              ) : (
                <div className="grid h-full w-full place-items-center rounded-full bg-gradient-to-br from-indigo-200 to-slate-100 text-4xl font-black text-indigo-500">
                  {getInitials(profile.fullName)}
                </div>
              )}
              {canEditLocalProfile && (
                <button className="absolute bottom-1 right-0 grid h-9 w-9 place-items-center rounded-full border-2 border-white bg-slate-900 text-white shadow" type="button" onClick={() => openEditModal("avatar")} title="Chỉnh sửa ảnh">
                  <Icon name="camera" className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="m-0 text-2xl font-black leading-tight text-slate-950 app-dark:text-slate-50">{profile.fullName || "Người dùng HTO"}</h1>
              <span className="mt-2 inline-flex rounded-xl bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-600 app-dark:bg-indigo-950 app-dark:text-indigo-200">
                ID: #{String(profile.id || "123456").slice(-6)}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 text-slate-600 app-dark:text-slate-300">
            {canEditLocalProfile && (
              <button className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold hover:bg-slate-50 app-dark:hover:bg-slate-800" type="button" onClick={() => openEditModal("info")}>
                <Icon name="edit" className="h-5 w-5" />
                Chỉnh sửa thông tin
              </button>
            )}
              <button className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold hover:bg-slate-50 app-dark:hover:bg-slate-800" type="button" onClick={() => setIsSettingsOpen(true)}>
              <Icon name="settings" className="h-5 w-5" />
              Cài đặt
            </button>
          </div>
        </div>
      </section>

      {(error || notice) && (
        <div
          className={`mt-4 rounded-lg px-3.5 py-3 text-sm font-bold ${
            error
              ? "border border-rose-200 bg-rose-50 text-rose-700"
              : "border border-green-200 bg-green-50 text-green-700"
          }`}
        >
          {error || notice}
        </div>
      )}

      {isCollaboratorProfile ? (
        <>
      <div className="mt-4 grid grid-cols-1 items-start gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
          <section className="flex min-h-[356px] flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 text-center shadow-[0_10px_28px_rgba(30,64,175,0.07)] app-dark:border-slate-700 app-dark:bg-slate-900">
          <div>
            <h2 className="text-lg font-black text-slate-950">Hạng hiện tại</h2>
            <div className="mx-auto mt-5 grid h-28 w-28 place-items-center">
              {previewBadgeImage ? (
                <img
                  className="h-28 w-28 object-contain"
                  src={previewBadgeImage}
                  alt={`Huy hiệu ${currentRank.name}`}
                />
              ) : (
                <div className="grid h-28 w-28 place-items-center rounded-[26px] border border-blue-100 bg-gradient-to-br from-slate-100 to-blue-100 shadow-inner">
                  <Icon name="shield" className="h-14 w-14 text-slate-500" />
                </div>
              )}
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-950">{currentRank.name}</h3>
            <p className="mt-1 text-sm font-bold text-slate-700">{currentRank.title}</p>
          </div>
          {nextRank ? (
            <div>
              <p className="mx-auto max-w-[210px] text-sm leading-6 text-slate-600">
                Bạn cần <span className="font-black text-orange-500">{Math.max(0, nextRank.minDeals - profile.dealCount)} deal</span> nữa để lên hạng {nextRank.name}
              </p>
              <div className="mt-4">
                <div className="mb-2 flex justify-center gap-1 text-lg font-black">
                  <span className="text-indigo-600">{profile.dealCount}</span>
                  <span className="text-slate-500">/ {nextRank.minDeals} deal</span>
                </div>
                <div className="mx-auto h-2 w-[84%] overflow-hidden rounded-full bg-indigo-100">
                  <span className="block h-full rounded-full bg-indigo-500" style={{ width: `${Math.min(100, (profile.dealCount / nextRank.minDeals) * 100)}%` }} />
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-6 text-sm text-slate-500">Điều kiện hạng tiếp theo đang cập nhật.</p>
          )}
        </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_10px_28px_rgba(30,64,175,0.07)] app-dark:border-slate-700 app-dark:bg-slate-900">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-950">Tiến độ KPI theo quý</h2>
              
            </div>
                <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 app-dark:border-slate-700 app-dark:bg-slate-800 app-dark:text-slate-100">
              {getCurrentQuarterLabel()}
              <span className="text-slate-400">⌄</span>
            </button>
          </div>
          <div className="grid grid-cols-1 gap-2 xl:grid-cols-[repeat(3,minmax(0,1fr))_118px]">
            {DEMO_QUARTER_MONTHS.map((item) => {
              const percent = Math.round((item.deals / item.target) * 100);
              const passed = item.deals >= item.target;
              return (
                <div className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm app-dark:border-slate-700 app-dark:bg-slate-950" key={item.month}>
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-black text-slate-950">{item.month}</h3>
                      <p className="mt-0.5 text-[11px] leading-4 text-slate-600">{passed ? "Đạt KPI" : "Thiếu KPI"}</p>
                    </div>
                    <span className={`text-base font-black ${passed ? "text-green-500" : "text-orange-400"}`}>{passed ? "✓" : "▲"}</span>
                  </div>
                  <div className="flex justify-center">
                    <KpiCircle percent={percent} tone={passed ? "success" : "warning"} />
                  </div>
                  <div className="mt-2 pt-2 text-center">
                    <p className="text-xs font-bold text-slate-950">{item.deals} / {item.target} deal</p>
                    <span className={`mt-1.5 inline-flex rounded-full px-3 py-1 text-[11px] font-black ${passed ? "bg-green-100 text-green-800" : "bg-orange-50 text-orange-700 ring-1 ring-orange-200"}`}>
                      {passed ? "Đạt" : "-1 điểm"}
                    </span>
                  </div>
                </div>
              );
            })}
              <div className="flex flex-col justify-center rounded-xl bg-slate-50 p-3 text-center app-dark:bg-slate-950">
              <p className="text-xs font-black text-slate-950">Cảnh báo</p>
                <div className="my-3 h-px bg-slate-200 app-dark:bg-slate-700" />
              <p className="text-xl font-black text-orange-500">-{quarterStats.failedMonths}</p>
              <p className="mt-2 text-[11px] leading-4 text-slate-600">Đạt KPI mỗi tháng để giữ hạng.</p>
                <button className="mt-3 rounded-2xl border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-[11px] font-black text-indigo-600 app-dark:border-indigo-800 app-dark:bg-indigo-950 app-dark:text-indigo-200" type="button">
                Quy định xếp hạng
              </button>
            </div>
          </div>
        </section>
      </div>

          <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-[0_10px_28px_rgba(30,64,175,0.07)] app-dark:border-slate-700 app-dark:bg-slate-900">
        <h2 className="mb-4 text-lg font-black text-slate-950">Mã giới thiệu của bạn</h2>
        {referralError && <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">{referralError}</div>}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_260px_170px]">
          <div className="grid gap-3">
            <label className="grid gap-2 text-sm font-bold text-slate-800">
              Link giới thiệu
              <div className="grid grid-cols-[minmax(0,1fr)_44px] overflow-hidden rounded-lg border border-slate-200">
                <input className="min-w-0 px-3 py-2.5 text-sm outline-none" value={referralLoading ? "Đang tải link giới thiệu..." : referralUrl} readOnly />
                <button className="grid place-items-center border-l border-slate-200 text-slate-500" type="button" disabled={!referralUrl || referralLoading} onClick={() => copyText(referralUrl, "link")}>
                  <Icon name="copy" className="h-5 w-5" />
                </button>
              </div>
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-800">
              Mã giới thiệu
              <div className="grid grid-cols-[minmax(0,1fr)_44px] overflow-hidden rounded-lg border border-slate-200">
                <input className="min-w-0 px-3 py-2.5 text-sm outline-none" value={referralLoading ? "Đang tải mã giới thiệu..." : referralCode} readOnly />
                <button className="grid place-items-center border-l border-slate-200 text-slate-500" type="button" disabled={!referralCode || referralLoading} onClick={() => copyText(referralCode, "mã")}>
                  <Icon name="copy" className="h-5 w-5" />
                </button>
              </div>
            </label>
            <p className="text-sm text-slate-500">Khi người dùng đăng ký, mã giới thiệu sẽ tự động được áp dụng.</p>
          </div>
          <div className="border-y border-slate-200 py-2 lg:border-x lg:border-y-0 lg:px-5">
            <p className="mb-3 text-sm font-black text-slate-900">Chia sẻ nhanh</p>
            <div className="grid grid-cols-4 gap-3 text-center text-xs text-slate-600">
              {["Facebook", "Zalo", "Messenger", "Khác"].map((item, index) => (
                <button className="grid gap-2 justify-items-center" type="button" onClick={handleShare} key={item}>
                  <span className={`grid h-10 w-10 place-items-center rounded-full text-base font-black text-white ${index === 0 ? "bg-blue-600" : index === 1 ? "bg-sky-500" : index === 2 ? "bg-violet-600" : "bg-slate-400"}`}>
                    {item[0]}
                  </span>
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div className="text-center">
            <p className="mb-3 text-sm font-black text-slate-900">QR Code</p>
                <div className="mx-auto grid h-[116px] w-[116px] place-items-center rounded-xl border border-slate-200 bg-white app-dark:border-slate-700 app-dark:bg-slate-950">
              {referralLoading ? <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-slate-300 border-t-indigo-500" /> : qrUrl ? <img className="h-[96px] w-[96px]" src={qrUrl} alt="QR mã giới thiệu" /> : <span className="text-sm text-slate-400">QR</span>}
            </div>
            <button className="mt-3 inline-flex items-center gap-2 text-sm font-black text-indigo-600" type="button">
              <Icon name="download" className="h-4 w-4" />
              Tải xuống
            </button>
          </div>
        </div>
      </section>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_10px_28px_rgba(30,64,175,0.07)] app-dark:border-slate-700 app-dark:bg-slate-900">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-950">Thông tin cá nhân</h2>
            {canEditLocalProfile && (
              <button className="text-slate-500" type="button" onClick={() => openEditModal("info")}>
                <Icon name="edit" />
              </button>
            )}
          </div>
          <div className="divide-y divide-slate-100">
            {[
              ["user", "Họ và tên", profile.fullName || "Chưa cập nhật"],
              ["mail", "Email", profile.email || "Chưa cập nhật"],
              ["phone", "Số điện thoại", profile.phone || "Chưa cập nhật"],
              ["map", "Địa chỉ", profile.address || "Chưa cập nhật"],
              ["user", "Facebook", profile.socialLink || "Chưa cập nhật"],
              ["user", "Zalo", "Chưa cập nhật"],
              ["user", "Instagram", "Chưa cập nhật"],
            ].map(([icon, label, value]) => (
              <div className="grid grid-cols-[22px_120px_minmax(0,1fr)_12px] items-center gap-3 py-2.5 text-sm" key={label}>
                <Icon name={icon} className="h-4 w-4 text-slate-500" />
                <span className="text-slate-500">{label}</span>
                <strong className="min-w-0 truncate font-medium text-slate-900">{value}</strong>
                <span className="text-slate-400">›</span>
              </div>
            ))}
          </div>
        </section>

            <section className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-[0_10px_28px_rgba(30,64,175,0.07)] app-dark:border-slate-700 app-dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-950">Bảo mật tài khoản</h2>
            <button className="text-slate-500" type="button" onClick={() => setIsSettingsOpen(true)}>
              <Icon name="settings" />
            </button>
          </div>
          <h3 className="text-base font-black text-slate-950">Đổi mật khẩu</h3>
          <p className="mt-2 max-w-[360px] text-sm leading-6 text-slate-600">Chúng tôi sẽ gửi email đến địa chỉ của bạn để xác nhận đổi mật khẩu.</p>
                <button className="mt-4 rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-indigo-200 app-dark:bg-sky-500 app-dark:shadow-none" type="button" onClick={handlePasswordReset} disabled={passwordLoading}>
            {passwordLoading ? "Đang gửi..." : "Gửi yêu cầu đổi mật khẩu"}
          </button>
          <div className="pointer-events-none absolute bottom-0 right-8 hidden h-24 w-36 text-indigo-200 sm:block">
            <Icon name="lock" className="h-full w-full" />
          </div>
        </section>
      </div>

        </>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <section className={ui.panel}>
            <div className={ui.panelHeading}>
              <div>
                <p className={ui.sectionLabel}>Tài khoản quản trị</p>
                <h2 className={ui.h2}>Tổng quan quyền hệ thống</h2>
              </div>
              <span className="rounded-full bg-slate-900 px-3 py-2 text-xs font-extrabold text-white">{roleLabel}</span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                ["Vai trò", roleLabel],
                ["Trạng thái", profile.status === "active" ? "Đang hoạt động" : profile.status || "Chưa rõ"],
                ["Phòng ban", profile.departmentId || "Chưa gán"],
              ].map(([label, value]) => (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 app-dark:border-slate-700 app-dark:bg-slate-950" key={label}>
                  <span className="text-xs font-extrabold uppercase tracking-normal text-slate-500">{label}</span>
                  <strong className="mt-2 block break-words text-sm text-slate-900">{value}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className={ui.panel}>
            <div className={ui.panelHeading}>
              <div>
                <p className={ui.sectionLabel}>Bảo mật</p>
                <h2 className={ui.h2}>Quyền truy cập và mật khẩu</h2>
              </div>
            </div>
            <p className={ui.muted}>Admin không hiển thị rank, KPI và mã giới thiệu. Các mục đó chỉ dành cho cộng tác viên.</p>
            <button className={`${ui.primaryButton} mt-5`} type="button" onClick={() => setIsSettingsOpen(true)}>Cài đặt tài khoản</button>
          </section>
        </div>
      )}

      {editMode && (
        <div className={ui.modalBackdrop} role="dialog" aria-modal="true">
          <form className={`${ui.modal} ${editMode === "info" ? "max-w-[680px]" : "max-w-[560px]"}`} onSubmit={handleSave}>
            <div className={ui.modalHeader}>
              <div>
                <p className={ui.sectionLabel}>Chỉnh sửa</p>
                <h2 className={ui.h2}>
                  {editMode === "avatar"
                    ? "Ảnh đại diện"
                    : editMode === "banner"
                      ? "Ảnh banner phụ"
                      : "Thông tin người dùng"}
                </h2>
              </div>
              <button type="button" className={ui.closeButton} onClick={handleCancelEdit}>×</button>
            </div>
            {editMode === "avatar" || editMode === "banner" ? (
              <div
                className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 app-dark:border-slate-700 app-dark:bg-slate-900"
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => handleImageDrop(event, editMode === "avatar" ? "avatarUrl" : "bannerUrl")}
              >
                {(() => {
                  const field = editMode === "avatar" ? "avatarUrl" : "bannerUrl";
                  const label = editMode === "avatar" ? "Ảnh đại diện" : "Ảnh banner phụ";
                  const isAvatar = editMode === "avatar";
                  const previewClass = isAvatar ? "mx-auto h-28 w-28 rounded-full" : "h-32 w-full rounded-2xl";
                  return (
                    <>
                      <div className="space-y-3">
                        <div className={`grid ${previewClass} place-items-center overflow-hidden bg-slate-100 text-slate-400 app-dark:bg-slate-800`}>
                          {formData[field] ? (
                            <img className="h-full w-full object-cover" src={formData[field]} alt={label} />
                          ) : (
                            <Icon name={editMode === "avatar" ? "user" : "camera"} className="h-8 w-8" />
                          )}
                        </div>
                        <p className="text-center text-sm leading-6 text-slate-500">
                          Nhập URL, chọn ảnh từ máy hoặc kéo thả ảnh vào khung xem trước.
                        </p>
                      </div>
                      <label className="mt-4 grid gap-[7px] text-[13px] font-extrabold text-slate-700 app-dark:text-slate-200">
                        URL {label.toLowerCase()}
                        <input className={ui.input} value={formData[field]} onChange={(event) => handleFieldChange(field, event.target.value)} />
                      </label>
                      <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50 app-dark:border-slate-700 app-dark:text-slate-100 app-dark:hover:bg-slate-800">
                        <Icon name="camera" className="h-4 w-4" />
                        Chọn ảnh từ máy
                        <input
                          className="hidden"
                          type="file"
                          accept="image/*"
                          onChange={(event) => handleImageFile(field, event.target.files?.[0])}
                        />
                      </label>
                    </>
                  );
                })()}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
                <label className="grid gap-[7px] text-[13px] font-extrabold text-slate-700 app-dark:text-slate-200">Họ và tên<input className={ui.input} required value={formData.fullName} onChange={(event) => handleFieldChange("fullName", event.target.value)} /></label>
                <label className="grid gap-[7px] text-[13px] font-extrabold text-slate-700 app-dark:text-slate-200">Email<input className={ui.input} required type="email" value={formData.email} onChange={(event) => handleFieldChange("email", event.target.value)} /></label>
                <label className="grid gap-[7px] text-[13px] font-extrabold text-slate-700 app-dark:text-slate-200">Số điện thoại<input className={ui.input} value={formData.phone} onChange={(event) => handleFieldChange("phone", event.target.value)} /></label>
                <label className="grid gap-[7px] text-[13px] font-extrabold text-slate-700 app-dark:text-slate-200">
                  Tỉnh/Thành phố
                  <select className={ui.input} value={addressDraft.province} onChange={(event) => handleAddressChange("province", event.target.value)}>
                    <option value="">Chọn Tỉnh/Thành phố</option>
                    {ADDRESS_PROVINCES.map((province) => (
                      <option value={province} key={province}>{province}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-[7px] text-[13px] font-extrabold text-slate-700 app-dark:text-slate-200">
                  Phường/Xã
                  <select
                    className={ui.input}
                    value={isCustomWard ? "__custom__" : addressDraft.ward}
                    onChange={(event) => handleAddressChange("ward", event.target.value === "__custom__" ? "" : event.target.value)}
                    disabled={!addressDraft.province}
                  >
                    <option value="">{addressDraft.province ? "Chọn Phường/Xã" : "Chọn Tỉnh/Thành phố trước"}</option>
                    {wardOptions.map((ward) => (
                      <option value={ward} key={ward}>{ward}</option>
                    ))}
                    <option value="__custom__">Nhập Phường/Xã khác</option>
                  </select>
                </label>
                {addressDraft.province && (!addressDraft.ward || isCustomWard) && (
                  <label className="grid gap-[7px] text-[13px] font-extrabold text-slate-700 app-dark:text-slate-200 md:col-span-2">
                    Tên Phường/Xã
                    <input className={ui.input} value={addressDraft.ward} onChange={(event) => handleAddressChange("ward", event.target.value)} />
                  </label>
                )}
                <label className="grid gap-[7px] text-[13px] font-extrabold text-slate-700 app-dark:text-slate-200 md:col-span-2">
                  Số nhà, tên đường
                  <input className={ui.input} value={addressDraft.detail} onChange={(event) => handleAddressChange("detail", event.target.value)} />
                </label>
                <label className="grid gap-[7px] text-[13px] font-extrabold text-slate-700 app-dark:text-slate-200 md:col-span-2">Link mạng xã hội<input className={ui.input} value={formData.socialLink} onChange={(event) => handleFieldChange("socialLink", event.target.value)} /></label>
              </div>
            )}
            <div className="mt-5 flex justify-end gap-2.5">
              <button type="button" className={ui.secondaryButton} onClick={handleCancelEdit}>Hủy</button>
              <button type="submit" className={ui.primaryButton} disabled={saving}>
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </form>
        </div>
      )}

      {isSettingsOpen && (
        <div className={ui.modalBackdrop} role="dialog" aria-modal="true">
          <div className={`${ui.modal} max-w-[560px]`}>
            <div className={ui.modalHeader}>
              <div>
                <p className={ui.sectionLabel}>Cài đặt</p>
                <h2 className={ui.h2}>Tài khoản</h2>
              </div>
              <button type="button" className={ui.closeButton} onClick={() => setIsSettingsOpen(false)}>×</button>
            </div>
            <div className="grid grid-cols-1 items-center gap-[18px] rounded-lg border border-slate-200 bg-slate-50 p-4 app-dark:border-slate-700 app-dark:bg-slate-800 sm:grid-cols-[minmax(0,1fr)_auto]">
              <div>
                <strong className="text-slate-900 app-dark:text-slate-50">Đổi mật khẩu</strong>
                <p className={`mt-1.5 ${ui.muted}`}>Hệ thống sẽ gửi liên kết đổi mật khẩu về email đang đăng nhập: {profile.email}.</p>
              </div>
              <button type="button" className={ui.primaryButton} onClick={handlePasswordReset} disabled={passwordLoading}>
                {passwordLoading ? "Đang gửi..." : "Gửi email đổi mật khẩu"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
