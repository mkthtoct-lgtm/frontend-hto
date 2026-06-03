import { authFetch, getAuthHeaders } from "../auth/session";
import { API_BASE_URL } from "../config/api";

const LEGACY_LOCAL_KEYS = ["hto_departments_mock", "hto_department_users_mock"];

const cleanupLegacyMockData = () => {
  try {
    LEGACY_LOCAL_KEYS.forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // Ignore storage failures; API remains the source of truth.
  }
};

export async function getDepartments() {
  cleanupLegacyMockData();
  const departments = await apiRequest("/departments?includeHidden=true");

  return normalizeDepartments(departments);
}

export async function createDepartment(input) {
  return normalizeDepartment(await apiRequest("/departments", { method: "POST", body: input }));
}

export async function updateDepartment(departmentId, input) {
  return normalizeDepartment(
    await apiRequest(`/departments/${departmentId}`, { method: "PATCH", body: input }),
  );
}

export async function toggleDepartmentVisibility(department) {
  const departmentId = typeof department === "string" ? department : department?.id;

  if (!departmentId) {
    throw new Error("Không tìm thấy phòng ban cần ẩn/hiện.");
  }

  return normalizeDepartment(
    await apiRequest(`/departments/${departmentId}/toggle-visibility`, { method: "PATCH" }),
  );
}

export async function getDepartmentMembers(departmentId) {
  if (!departmentId) {
    return [];
  }

  const searchParams = new URLSearchParams({ departmentId });
  const users = await fetchAllUsers(`?${searchParams.toString()}`);

  return users.filter((user) => user.departmentId === departmentId);
}

export async function getAssignableUsers() {
  return await fetchAllUsers();
}

export async function assignUserToDepartment(departmentId, userId) {
  return normalizeUser(
    await apiRequest(`/users/${userId}`, {
      method: "PATCH",
      body: { departmentId },
    }),
  );
}

export async function removeUserFromDepartment(departmentId, userId) {
  return normalizeUser(
    await apiRequest(`/users/${userId}`, {
      method: "PATCH",
      body: { departmentId: null },
    }),
  );
}

async function apiRequest(path, options = {}) {
  const response = await authFetch(`${API_BASE_URL}${path}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(getApiErrorMessage(payload, response.status));
    error.status = response.status;
    throw error;
  }

  return normalizeApiData(payload);
}

function normalizeApiData(payload) {
  return payload?.data ?? payload ?? [];
}

function normalizeListPayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.users)) return payload.users;
  if (Array.isArray(payload?.departments)) return payload.departments;

  return [];
}

function normalizeDepartments(payload) {
  return normalizeListPayload(payload).map(normalizeDepartment).filter((department) => department.id);
}

function normalizeDepartment(department) {
  const data = department?.data ?? department ?? {};

  return {
    ...data,
    id: String(data.id || data._id || ""),
    name: data.name || "",
    description: data.description || "",
    memberCount: Number(data.memberCount || 0),
    isHidden: Boolean(data.isHidden || data.hidden),
    hidden: Boolean(data.isHidden || data.hidden),
  };
}

async function fetchAllUsers(query = "") {
  const separator = query ? (query.includes("?") ? "&" : "?") : "?";
  const firstPath = query ? `/users${query}${separator}page=1` : "/users?page=1";
  const firstPayload = await apiRequest(firstPath);
  const firstPage = normalizeUsersPage(firstPayload);
  let users = firstPage.users;

  if (firstPage.pages > 1 && firstPage.total > firstPage.users.length) {
    const nextPages = await Promise.all(
      Array.from({ length: firstPage.pages - 1 }, (_, index) =>
        apiRequest(query ? `/users${query}${separator}page=${index + 2}` : `/users?page=${index + 2}`),
      ),
    );
    users = [...users, ...nextPages.flatMap((payload) => normalizeUsersPage(payload).users)];
  }

  return users.map(normalizeUser).filter((user) => user.id);
}

function normalizeUsersPage(payload) {
  const users = normalizeListPayload(payload);
  const total = Number(payload?.total ?? users.length) || users.length;
  const pages = Number(payload?.pages ?? payload?.totalPages ?? 1) || 1;

  return { users, total, pages };
}

function normalizeUser(user) {
  const data = user?.data ?? user ?? {};

  return {
    id: String(data.id || data._id || ""),
    fullName: data.fullName || data.name || "",
    email: data.email || "",
    role: data.role || data.roleName || data.roleId || "",
    departmentId: data.departmentId || data.department?.id || data.department?._id || null,
    status: data.status || "active",
  };
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
    ? "Bạn không có quyền thao tác phòng ban."
    : "Không thể xử lý yêu cầu phòng ban.";
}
