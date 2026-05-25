const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? "/api/v1" : "http://qlnb-api.hto.edu.vn/api/v1");

const LOCAL_DEPARTMENTS_KEY = "hto_departments_mock";
const LOCAL_USERS_KEY = "hto_department_users_mock";

const DEFAULT_DEPARTMENTS = [
  {
    id: "dept-ban-giam-doc",
    name: "Ban Giám Đốc",
    description: "Điều hành và phê duyệt các hoạt động trọng yếu.",
    createdAt: "2026-05-01T08:00:00.000Z",
    updatedAt: "2026-05-01T08:00:00.000Z",
  },
  {
    id: "dept-tuyen-sinh",
    name: "Tuyển Sinh",
    description: "Tư vấn, tiếp nhận và chăm sóc hồ sơ đầu vào.",
    createdAt: "2026-05-02T08:00:00.000Z",
    updatedAt: "2026-05-02T08:00:00.000Z",
  },
  {
    id: "dept-ho-so",
    name: "Hồ Sơ",
    description: "Theo dõi tài liệu, biểu mẫu và tiến độ xử lý hồ sơ.",
    createdAt: "2026-05-03T08:00:00.000Z",
    updatedAt: "2026-05-03T08:00:00.000Z",
  },
];

const DEFAULT_USERS = [
  {
    id: "user-admin",
    fullName: "Nguyễn Văn Admin",
    email: "admin@hto.vn",
    role: "Admin",
    departmentId: "dept-ban-giam-doc",
    status: "active",
  },
  {
    id: "user-tran-b",
    fullName: "Trần Thị B",
    email: "tranb@hto.vn",
    role: "Nhân sự",
    departmentId: "dept-tuyen-sinh",
    status: "active",
  },
  {
    id: "user-le-c",
    fullName: "Lê Văn C",
    email: "lec@hto.vn",
    role: "Đại lý",
    departmentId: "dept-ho-so",
    status: "active",
  },
  {
    id: "user-pham-d",
    fullName: "Phạm D",
    email: "phamd@hto.vn",
    role: "Cộng tác viên",
    departmentId: null,
    status: "active",
  },
];

export async function getDepartments() {
  return await withLocalFallback(
    () => apiRequest("/departments"),
    () => enrichDepartments(readDepartments(), readUsers()),
  );
}

export async function createDepartment(input) {
  return await withLocalFallback(
    () => apiRequest("/departments", { method: "POST", body: input }),
    () => {
      const departments = readDepartments();
      assertUniqueDepartmentName(input.name, departments);

      const now = new Date().toISOString();
      const department = {
        id: `dept-${Date.now()}`,
        name: input.name.trim(),
        description: input.description?.trim() || "",
        createdAt: now,
        updatedAt: now,
      };

      writeDepartments([department, ...departments]);
      return enrichDepartment(department, readUsers());
    },
  );
}

export async function updateDepartment(departmentId, input) {
  return await withLocalFallback(
    () => apiRequest(`/departments/${departmentId}`, { method: "PATCH", body: input }),
    () => {
      const departments = readDepartments();
      assertUniqueDepartmentName(input.name, departments, departmentId);

      const nextDepartments = departments.map((department) =>
        department.id === departmentId
          ? {
              ...department,
              name: input.name.trim(),
              description: input.description?.trim() || "",
              updatedAt: new Date().toISOString(),
            }
          : department,
      );
      const updatedDepartment = nextDepartments.find((department) => department.id === departmentId);

      writeDepartments(nextDepartments);
      return enrichDepartment(updatedDepartment, readUsers());
    },
  );
}

export async function deleteDepartment(departmentId) {
  return await withLocalFallback(
    () => apiRequest(`/departments/${departmentId}`, { method: "DELETE" }),
    () => {
      writeDepartments(readDepartments().filter((department) => department.id !== departmentId));
      writeUsers(
        readUsers().map((user) =>
          user.departmentId === departmentId ? { ...user, departmentId: null } : user,
        ),
      );
      return { id: departmentId };
    },
  );
}

export async function getDepartmentMembers(departmentId) {
  return await withLocalFallback(
    async () => {
      const searchParams = new URLSearchParams({ departmentId });
      const users = await apiRequest(`/users?${searchParams.toString()}`);

      return normalizeUsers(users).filter((user) => user.departmentId === departmentId);
    },
    () => readUsers().filter((user) => user.departmentId === departmentId),
  );
}

export async function getAssignableUsers() {
  return await withLocalFallback(
    async () => {
      const users = await apiRequest("/users");

      return normalizeUsers(users);
    },
    () => readUsers(),
  );
}

export async function assignUserToDepartment(departmentId, userId) {
  return await withLocalFallback(
    async () => normalizeUser(
      await apiRequest(`/users/${userId}`, {
        method: "PATCH",
        body: { departmentId },
      }),
    ),
    () => {
      const nextUsers = readUsers().map((user) =>
        user.id === userId ? { ...user, departmentId } : user,
      );
      writeUsers(nextUsers);
      return nextUsers.find((user) => user.id === userId);
    },
  );
}

export async function removeUserFromDepartment(departmentId, userId) {
  return await withLocalFallback(
    async () => normalizeUser(
      await apiRequest(`/users/${userId}`, {
        method: "PATCH",
        body: { departmentId: null },
      }),
    ),
    () => {
      const nextUsers = readUsers().map((user) =>
        user.id === userId && user.departmentId === departmentId
          ? { ...user, departmentId: null }
          : user,
      );
      writeUsers(nextUsers);
      return nextUsers.find((user) => user.id === userId);
    },
  );
}

async function apiRequest(path, options = {}) {
  const token = window.localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || "GET",
    headers,
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

function normalizeApiData(payload) {
  return payload?.data ?? payload ?? [];
}

function normalizeUsers(payload) {
  const users = Array.isArray(payload)
    ? payload
    : payload?.items || payload?.users || [];

  return users.map(normalizeUser).filter((user) => user.id);
}

function normalizeUser(user) {
  const data = user?.data ?? user;

  return {
    id: data.id || data._id,
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

function enrichDepartments(departments, users) {
  return departments.map((department) => enrichDepartment(department, users));
}

function enrichDepartment(department, users) {
  const members = users.filter((user) => user.departmentId === department.id);

  return {
    ...department,
    memberCount: members.length,
    members,
  };
}

function readDepartments() {
  return readJson(LOCAL_DEPARTMENTS_KEY, DEFAULT_DEPARTMENTS);
}

function writeDepartments(departments) {
  window.localStorage.setItem(LOCAL_DEPARTMENTS_KEY, JSON.stringify(departments));
}

function readUsers() {
  return readJson(LOCAL_USERS_KEY, DEFAULT_USERS);
}

function writeUsers(users) {
  window.localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
}

function readJson(key, fallback) {
  const storedValue = window.localStorage.getItem(key);

  if (!storedValue) {
    window.localStorage.setItem(key, JSON.stringify(fallback));
    return fallback;
  }

  try {
    return JSON.parse(storedValue);
  } catch {
    window.localStorage.setItem(key, JSON.stringify(fallback));
    return fallback;
  }
}

function assertUniqueDepartmentName(name, departments, currentDepartmentId) {
  const normalizedName = name.trim().toLowerCase();
  const exists = departments.some(
    (department) =>
      department.id !== currentDepartmentId &&
      department.name.trim().toLowerCase() === normalizedName,
  );

  if (exists) {
    throw new Error("Tên phòng ban đã tồn tại.");
  }
}
