import { API_BASE_URL } from "../config/api";
import { authFetch, getAuthHeaders } from "../auth/session";

const LEAD_SUBMISSION_LOCKS_KEY = "hto_recent_lead_submissions";
const LEAD_DUPLICATE_WINDOW_MS = 24 * 60 * 60 * 1000;

export const normalizeLeadPhone = (value) => String(value || "").trim().replace(/[\s.-]/g, "");

const readLocks = () => {
  try {
    return JSON.parse(window.localStorage.getItem(LEAD_SUBMISSION_LOCKS_KEY) || "{}");
  } catch {
    return {};
  }
};

const writeLocks = (locks) => {
  try {
    window.localStorage.setItem(LEAD_SUBMISSION_LOCKS_KEY, JSON.stringify(locks));
  } catch {
    // Ignore storage quota/private mode errors; server response still protects the main flow.
  }
};

export const beginLeadSubmission = (phone) => {
  const normalizedPhone = normalizeLeadPhone(phone);
  if (!normalizedPhone) {
    return { allowed: false, message: "Số điện thoại chưa hợp lệ." };
  }

  const now = Date.now();
  const locks = readLocks();

  for (const [key, value] of Object.entries(locks)) {
    if (!value?.expiresAt || value.expiresAt <= now) {
      delete locks[key];
    }
  }

  const existing = locks[normalizedPhone];
  if (existing?.expiresAt > now) {
    const remainingSeconds = Math.ceil((existing.expiresAt - now) / 1000);
    return {
      allowed: false,
      message: `Số điện thoại này vừa được gửi. Vui lòng chờ khoảng ${remainingSeconds} giây trước khi gửi lại.`,
    };
  }

  locks[normalizedPhone] = {
    status: "pending",
    expiresAt: now + LEAD_DUPLICATE_WINDOW_MS,
  };
  writeLocks(locks);

  return { allowed: true, phone: normalizedPhone };
};

export const finishLeadSubmission = (phone, success) => {
  const normalizedPhone = normalizeLeadPhone(phone);
  if (!normalizedPhone) return;

  const locks = readLocks();
  if (success) {
    locks[normalizedPhone] = {
      status: "submitted",
      expiresAt: Date.now() + LEAD_DUPLICATE_WINDOW_MS,
    };
  } else {
    delete locks[normalizedPhone];
  }
  writeLocks(locks);
};

export const markLeadReadyForReconciliation = async (leadId) => {
  if (!leadId) {
    return { ok: false, message: "API không trả về mã lead để tạo deal đối soát." };
  }

  const headers = getAuthHeaders();
  if (!headers.Authorization) {
    return { ok: false, message: "Thiếu phiên đăng nhập nên chưa thể tạo deal đối soát." };
  }

  const response = await authFetch(`${API_BASE_URL}/leads/${leadId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify({ status: "xu_ly_ho_so" }),
  });

  const payload = await response.json().catch(() => ({}));
  return {
    ok: response.ok && payload?.success !== false,
    status: response.status,
    message: payload?.message || (response.ok ? "Đã tạo deal chờ đối soát." : "Chưa tạo được deal đối soát."),
  };
};
