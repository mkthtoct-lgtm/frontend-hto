// const API_BASE_URL =
//   import.meta.env.VITE_API_BASE_URL ||
//   (import.meta.env.PROD ? "/api/v1" : "http://qlnb-api.hto.edu.vn/api/v1");
const API_BASE_URL = "http://localhost:8080/api/v1";

const LOCAL_AUDIT_LOGS_KEY = "hto_audit_logs_mock";

const DEFAULT_AUDIT_LOGS = [
  {
    id: "log-1001",
    actor: { id: "user-admin", fullName: "Nguyễn Văn Admin", email: "admin@hto.vn" },
    action: "department.create",
    target: { type: "department", id: "dept-tuyen-sinh", name: "Tuyển Sinh" },
    metadata: { name: "Tuyển Sinh", source: "Admin Portal" },
    createdAt: "2026-05-21T02:12:00.000Z",
  },
  {
    id: "log-1002",
    actor: { id: "user-admin", fullName: "Nguyễn Văn Admin", email: "admin@hto.vn" },
    action: "department.assign_user",
    target: { type: "department", id: "dept-ho-so", name: "Hồ Sơ" },
    metadata: { userEmail: "lec@hto.vn", userName: "Lê Văn C" },
    createdAt: "2026-05-21T03:05:00.000Z",
  },
  {
    id: "log-1003",
    actor: { id: "user-tran-b", fullName: "Trần Thị B", email: "tranb@hto.vn" },
    action: "auth.login",
    target: { type: "user", id: "user-tran-b", name: "Trần Thị B" },
    metadata: { ip: "127.0.0.1", device: "Chrome / Windows" },
    createdAt: "2026-05-20T09:40:00.000Z",
  },
  {
    id: "log-1004",
    actor: { id: "user-admin", fullName: "Nguyễn Văn Admin", email: "admin@hto.vn" },
    action: "user.update",
    target: { type: "user", id: "user-pham-d", name: "Phạm D" },
    metadata: { fields: ["role", "status"], status: "active" },
    createdAt: "2026-05-19T07:25:00.000Z",
  },
  {
    id: "log-1005",
    actor: { id: "user-le-c", fullName: "Lê Văn C", email: "lec@hto.vn" },
    action: "document.download",
    target: { type: "document", id: "doc-contract-v3", name: "Mẫu Hợp Đồng Du Học Đức V3.0" },
    metadata: { fileType: "DOCX", size: "248 KB" },
    createdAt: "2026-05-18T11:10:00.000Z",
  },
];

export const AUDIT_ACTION_OPTIONS = [
  { value: "auth.login", label: "Đăng nhập" },
  { value: "department.create", label: "Tạo phòng ban" },
  { value: "department.update", label: "Cập nhật phòng ban" },
  { value: "department.assign_user", label: "Thêm nhân sự phòng ban" },
  { value: "department.remove_user", label: "Gỡ nhân sự phòng ban" },
  { value: "user.update", label: "Cập nhật người dùng" },
  { value: "document.download", label: "Tải tài liệu" },
];

export async function getAuditLogs(filters = {}) {
  return await withLocalFallback(
    () => {
      const searchParams = new URLSearchParams();

      if (filters.userId) searchParams.set("userId", filters.userId);
      if (filters.action) searchParams.set("action", filters.action);
      if (filters.from) searchParams.set("from", filters.from);
      if (filters.to) searchParams.set("to", filters.to);

      const query = searchParams.toString();
      return apiRequest(`/audit-logs${query ? `?${query}` : ""}`);
    },
    () => filterAuditLogs(readAuditLogs(), filters),
  );
}

export async function getAuditActors() {
  return await withLocalFallback(
    () => apiRequest("/audit-logs/actors"),
    () => {
      const actors = readAuditLogs().map((log) => log.actor);
      const actorMap = new Map(actors.map((actor) => [actor.id, actor]));

      return Array.from(actorMap.values()).sort((a, b) =>
        a.fullName.localeCompare(b.fullName, "vi"),
      );
    },
  );
}

async function apiRequest(path) {
  const token = window.localStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(getApiErrorMessage(payload, response.status));
    error.status = response.status;
    throw error;
  }

  return payload?.data ?? payload ?? [];
}

async function withLocalFallback(apiCall, localCall) {
  try {
    return await apiCall();
  } catch (error) {
    if (error?.status && error.status !== 404) {
      throw error;
    }

    return localCall();
  }
}

function filterAuditLogs(logs, filters) {
  const fromTime = filters.from ? new Date(filters.from).getTime() : null;
  const toTime = filters.to ? new Date(filters.to).getTime() : null;

  return logs
    .filter((log) => !filters.userId || log.actor.id === filters.userId)
    .filter((log) => !filters.action || log.action === filters.action)
    .filter((log) => {
      const logTime = new Date(log.createdAt).getTime();
      return (fromTime === null || logTime >= fromTime) && (toTime === null || logTime <= toTime);
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function readAuditLogs() {
  const storedValue = window.localStorage.getItem(LOCAL_AUDIT_LOGS_KEY);

  if (!storedValue) {
    window.localStorage.setItem(LOCAL_AUDIT_LOGS_KEY, JSON.stringify(DEFAULT_AUDIT_LOGS));
    return DEFAULT_AUDIT_LOGS;
  }

  try {
    return JSON.parse(storedValue);
  } catch {
    window.localStorage.setItem(LOCAL_AUDIT_LOGS_KEY, JSON.stringify(DEFAULT_AUDIT_LOGS));
    return DEFAULT_AUDIT_LOGS;
  }
}

function getApiErrorMessage(payload, status) {
  const details = payload?.error?.details;

  if (Array.isArray(details) && details.length > 0) {
    return details[0];
  }

  if (payload?.message && payload.message !== "Bad Request") {
    return payload.message;
  }

  return status === 403
    ? "Bạn không có quyền xem lịch sử thao tác."
    : "Không thể tải lịch sử thao tác.";
}
