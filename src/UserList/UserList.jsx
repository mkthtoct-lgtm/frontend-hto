// src/UserList/UserList.jsx
import { useState, useEffect, useCallback } from "react";
import { useForm, useWatch } from "react-hook-form";
import { authFetch, getAuthHeaders } from "../auth/session";
import { API_BASE_URL } from "../config/api";
import { TailwindDropdown } from "../components/ui/TailwindDropdown";
import "./UserList.css";

// --- CẤU HÌNH DANH SÁCH ROLE VÀ LINK CHỨC NĂNG TƯƠNG ỨNG ---
// BẠN HÃY THAY THẾ CÁC LINK TRONG BIẾN NÀY BẰNG LINK TỪ FILE EXCEL CỦA BẠN
const ROLE_MAP = {
  admin: { label: "Admin", color: "bg-danger", link: "/role-links/admin", roleId: "69fc5af582ef85451120772a" },
  bangiamdoc: { label: "Ban giám đốc", color: "bg-primary", link: "/role-links/ban-giam-doc", roleId: "69fc5af582ef85451120772b" },
  truongbophan: { label: "Trưởng bộ phận", color: "bg-warning text-dark", link: "/role-links/truong-bo-phan", roleId: "69fc5af582ef85451120772c" },
  nhansu: { label: "Nhân sự", color: "bg-info text-dark", link: "/role-links/nhan-su", roleId: "69fc5af582ef85451120772d" },
  daily: { label: "Đại lý", color: "bg-success", link: "/role-links/dai-ly", roleId: "69fc5af582ef85451120772e" },
  congtacvien: { label: "Cộng tác viên", color: "bg-secondary", link: "/role-links/cong-tac-vien", roleId: "69fc5af782ef854511207730" },
  hethong: { label: "Hệ thống", color: "bg-dark", link: "/role-links/he-thong", roleId: "69fc5af682ef85451120772f" }
};

const ADMIN_ROLE_ID = "69fc5af582ef85451120772a";
const USER_FEATURE_PERMISSIONS_KEY = "hto_user_feature_permissions";
const USER_PAGE_SIZE = 12;

const FEATURE_PERMISSION_GROUPS = [
  {
    id: "dashboard",
    title: "Dashboard",
    permissions: [
      { id: "dashboard:view", label: "Xem dashboard" },
      { id: "dashboard:edit", label: "Chỉnh sửa dashboard" },
      { id: "dashboard:export", label: "Xuất báo cáo" },
    ],
  },
  {
    id: "documents",
    title: "Tài liệu",
    permissions: [
      { id: "documents:view", label: "Xem tài liệu" },
      { id: "documents:download", label: "Tải tài liệu" },
      { id: "documents:upload", label: "Upload tài liệu" },
      { id: "documents:edit", label: "Sửa tài liệu" },
      { id: "documents:delete", label: "Xóa tài liệu" },
    ],
  },
  {
    id: "notifications",
    title: "Thông báo",
    permissions: [
      { id: "notifications:view", label: "Xem thông báo" },
      { id: "notifications:create", label: "Tạo thông báo" },
    ],
  },
  {
    id: "users",
    title: "Tài khoản",
    permissions: [
      { id: "users:view", label: "Xem tài khoản" },
      { id: "users:edit", label: "Sửa tài khoản" },
      { id: "users:lock", label: "Khóa/mở khóa" },
    ],
  },
];

const DEFAULT_FEATURE_PERMISSIONS_BY_ROLE = {
  admin: FEATURE_PERMISSION_GROUPS.flatMap((group) => group.permissions.map((permission) => permission.id)),
  bangiamdoc: ["dashboard:view", "dashboard:export", "documents:view", "documents:download", "notifications:view", "notifications:create", "users:view"],
  truongbophan: ["dashboard:view", "documents:view", "documents:upload", "notifications:view", "notifications:create"],
  nhansu: ["dashboard:view", "documents:view", "documents:upload", "notifications:view", "users:view"],
  daily: ["dashboard:view", "documents:view", "notifications:view"],
  congtacvien: ["documents:view", "notifications:view"],
  hethong: ["dashboard:view", "documents:view", "notifications:view"],
};

const readUserFeaturePermissions = () => {
  try {
    const value = localStorage.getItem(USER_FEATURE_PERMISSIONS_KEY);
    return value ? JSON.parse(value) : {};
  } catch {
    return {};
  }
};

const writeUserFeaturePermissions = (permissionsByUserId) => {
  localStorage.setItem(USER_FEATURE_PERMISSIONS_KEY, JSON.stringify(permissionsByUserId));
};

const getDefaultFeaturePermissions = (role) => DEFAULT_FEATURE_PERMISSIONS_BY_ROLE[role] || [];
const ALL_FEATURE_PERMISSION_IDS = FEATURE_PERMISSION_GROUPS.flatMap((group) =>
  group.permissions.map((permission) => permission.id),
);

const CANONICAL_PERMISSION_TO_FEATURE_IDS = {
  "dashboard:view": ["dashboard:view"],
  "dashboard:edit": ["dashboard:edit"],
  "dashboard:export": ["dashboard:export"],
  "documents:read": ["documents:view"],
  "documents:download": ["documents:download"],
  "documents:write": ["documents:upload", "documents:edit", "documents:delete"],
  "documents:view": ["documents:view"],
  "documents:upload": ["documents:upload"],
  "documents:edit": ["documents:edit"],
  "documents:delete": ["documents:delete"],
  "notifications:read": ["notifications:view"],
  "notifications:write": ["notifications:create"],
  "notifications:view": ["notifications:view"],
  "notifications:create": ["notifications:create"],
  "users:read": ["users:view"],
  "users:write": ["users:edit", "users:lock"],
  "users:view": ["users:view"],
  "users:edit": ["users:edit"],
  "users:lock": ["users:lock"],
};

const expandFeaturePermissions = (permissions = []) => {
  const expanded = new Set();
  if (!Array.isArray(permissions)) return expanded;

  permissions.filter(Boolean).forEach((permission) => {
    if (permission === "*") {
      ALL_FEATURE_PERMISSION_IDS.forEach((item) => expanded.add(item));
      expanded.add("*");
      return;
    }

    expanded.add(permission);
    const featureIds = CANONICAL_PERMISSION_TO_FEATURE_IDS[permission] || [];
    featureIds.forEach((item) => expanded.add(item));
  });

  return expanded;
};

const getRoleColorBySlug = (slug) => {
  const map = {
    admin: "bg-danger text-white",
    bangiamdoc: "bg-primary text-white",
    truongbophan: "bg-warning text-dark",
    nhansu: "bg-info text-dark",
    daily: "bg-success text-white",
    congtacvien: "bg-secondary text-white",
    staff: "bg-dark text-white",
    user: "bg-light text-dark border"
  };
  return map[slug] || "bg-secondary text-white";
};

const ROLE_ID_TO_KEY = Object.fromEntries(
  Object.entries(ROLE_MAP).map(([key, value]) => [value.roleId, key]),
);

const normalizeRoleId = (value) => String(value?._id || value?.id || value || "");

const getUserDepartmentsMapping = () => {
  try {
    const value = localStorage.getItem("hto_user_departments_mapping");
    return value ? JSON.parse(value) : {};
  } catch {
    return {};
  }
};

const saveUserDepartmentsMapping = (mapping) => {
  localStorage.setItem("hto_user_departments_mapping", JSON.stringify(mapping));
};

const normalizeUser = (user, apiRoles = []) => {
  const rawRoleId = normalizeRoleId(user.roleId);
  const matchedRole = apiRoles.find((r) => (
    normalizeRoleId(r.id) === rawRoleId ||
    r.slug === user.role ||
    r.slug === user.roleId
  ));
  const role = matchedRole?.slug || user.role || ROLE_ID_TO_KEY[rawRoleId] || "hethong";
  const roleLabel = matchedRole?.name || ROLE_MAP[role]?.label || role;
  const roleColor = matchedRole?.color || ROLE_MAP[role]?.color || getRoleColorBySlug(role);

  const department =
    user.department?.name ||
    user.departmentName ||
    user.department ||
    user.departmentId ||
    "";

  const mapping = getUserDepartmentsMapping();
  const departmentIds = mapping[user.id || user._id] || (user.departmentId ? [user.departmentId] : []);

  return {
    id: user.id || user._id,
    name: user.name || user.fullName || "",
    fullName: user.fullName || user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    address: user.address || user.profile?.address || "",
    socialLink: user.socialLink || user.socialUrl || user.profile?.socialLink || "",
    referralCode: user.referralCode || user.referral_code || user.profile?.referralCode || "",
    role,
    roleLabel,
    roleColor,
    roleId: rawRoleId || matchedRole?.id || ROLE_MAP[role]?.roleId || "",
    department,
    departmentId: user.departmentId || "",
    departmentIds,
    status: user.status || "active",
    permissions: Array.isArray(user.permissions) ? user.permissions : [],
    grantedPermissions: Array.isArray(user.grantedPermissions) ? user.grantedPermissions : [],
  };
};

const normalizeApiData = (payload) => {
  const data = payload?.data ?? payload;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.users)) return data.users;

  return [];
};

const normalizeDepartment = (department) => {
  const data = department?.data ?? department ?? {};

  return {
    id: String(data.id || data._id || ""),
    name: data.name || data.title || "Phòng ban",
    isHidden: Boolean(data.isHidden || data.hidden),
  };
};

const normalizeDepartmentsData = (payload) =>
  normalizeApiData(payload).map(normalizeDepartment).filter((department) => department.id);

const normalizeUsersPayload = (payload) => {
  const data = payload?.data ?? payload;
  const users = normalizeApiData(payload);
  const total = Number(data?.total ?? users.length) || users.length;
  const pages = Number(data?.pages ?? data?.totalPages ?? 1) || 1;

  return { users, total, pages };
};

const getApiErrorMessage = (payload, fallback) => {
  const details = payload?.error?.details;

  if (Array.isArray(details) && details.length > 0) return details[0];
  if (payload?.message && payload.message !== "Bad Request") return payload.message;

  return fallback;
};

async function usersRequest(path = "", options = {}) {
  const response = await authFetch(`${API_BASE_URL}/users${path}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(getApiErrorMessage(payload, "Không thể xử lý tài khoản."));
  }

  return payload;
}

async function departmentsRequest(path = "", options = {}) {
  const response = await authFetch(`${API_BASE_URL}/departments${path}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(getApiErrorMessage(payload, "Không thể tải danh sách phòng ban."));
  }

  return payload;
}

export const UserList = ({ currentUser }) => {
   // States quản lý Data
  const [users, setUsers] = useState([]);
  const [apiRoles, setApiRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // States quản lý Filter & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [featurePermissionsByUserId, setFeaturePermissionsByUserId] = useState(() => readUserFeaturePermissions());
  const isCurrentUserAdmin = currentUser?.role === "admin" || 
                             currentUser?.roleId === ADMIN_ROLE_ID ||
                             (Array.isArray(currentUser?.permissions) && (
                               currentUser.permissions.includes("users:write") ||
                               currentUser.permissions.includes("*")
                             ));

  // States quản lý Modal (Create/Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // 'create' | 'edit'
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailUser, setDetailUser] = useState(null);
  const [permissionUser, setPermissionUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const { register, handleSubmit, reset, setValue, control, formState: { errors } } = useForm({
    mode: "onTouched"
  });
  const selectedRoleValue = useWatch({ control, name: "role" });
  const selectedDepartmentIdsValue = useWatch({ control, name: "departmentIds" }) || [];
  const roleOptions = (apiRoles.length > 0
    ? apiRoles
    : Object.entries(ROLE_MAP).map(([key, value]) => ({
        id: value.roleId,
        name: value.label,
        slug: key,
        color: value.color,
        isHidden: false,
      }))
  )
    .filter((role) => !role.isHidden)
    .map((role) => ({
      label: role.name,
      value: role.slug,
    }));

  const fetchRoles = useCallback(async () => {
    setRolesLoading(true);
    try {
      const payload = await usersRequest("/roles?includeHidden=true");
      const list = Array.isArray(payload) ? payload : (payload?.data || payload?.items || []);
      const mapped = list.map(r => ({
        id: r._id || r.id,
        name: r.name,
        slug: r.slug,
        isHidden: r.isHidden || false,
        color: r.color || getRoleColorBySlug(r.slug)
      }));
      setApiRoles(mapped);
      return mapped;
    } catch (err) {
      console.error("Lỗi tải danh sách vai trò động:", err);
      const mapped = Object.entries(ROLE_MAP).map(([key, value]) => ({
        id: value.roleId,
        name: value.label,
        slug: key,
        color: value.color,
        isHidden: false
      }));
      setApiRoles(mapped);
      return mapped;
    } finally {
      setRolesLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async (currentRoles = []) => {
    setLoading(true);
    setError("");
    try {
      const firstPayload = await usersRequest("?page=1");
      const firstPage = normalizeUsersPayload(firstPayload);
      let allUsers = firstPage.users;

      if (firstPage.pages > 1 && firstPage.total > firstPage.users.length) {
        const nextPages = await Promise.all(
          Array.from({ length: firstPage.pages - 1 }, (_, index) =>
            usersRequest(`?page=${index + 2}`),
          ),
        );

        allUsers = [
          ...allUsers,
          ...nextPages.flatMap((payload) => normalizeUsersPayload(payload).users),
        ];
      }

      const normalized = allUsers.map(u => normalizeUser(u, currentRoles));
      setUsers(normalized);

      // Đồng bộ state featurePermissionsByUserId từ dữ liệu server
      setFeaturePermissionsByUserId(prev => {
        const next = { ...prev };
        normalized.forEach(u => {
          next[u.id] = u.grantedPermissions || [];
        });
        writeUserFeaturePermissions(next);
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initData = async () => {
      const rolesData = await fetchRoles();
      await fetchUsers(rolesData);
    };
    void initData();
  }, [fetchRoles, fetchUsers]);

  const fetchDepartments = useCallback(async () => {
    setDepartmentsLoading(true);

    try {
      const payload = await departmentsRequest("?includeHidden=true");
      setDepartmentOptions(normalizeDepartmentsData(payload));
    } catch {
      setDepartmentOptions([]);
    } finally {
      setDepartmentsLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => fetchDepartments());
  }, [fetchDepartments]);

  // 3. Xử lý mở đóng Modal
  const openCreateModal = () => {
    setModalMode("create");
    setSelectedUser(null);
    reset({ name: "", email: "", password: "", role: "", departmentId: "", departmentIds: [], phone: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setModalMode("edit");
    setSelectedUser(user);
    // Fill data vào form
    reset({
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      departmentId: user.departmentId,
      departmentIds: user.departmentIds || [],
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    reset(); // Reset form
  };

  // 4. Xử lý Submit Form (Create / Update)
  const onSubmit = async (data) => {
    setActionLoading(true);
    try {
      const primaryDepartmentId = data.departmentIds && data.departmentIds.length > 0
        ? data.departmentIds[0]
        : undefined;

      const selectedRoleObj = apiRoles.find(r => r.slug === data.role);
      const roleId = selectedRoleObj?.id || ROLE_MAP[data.role]?.roleId;
      if (!roleId) {
        throw new Error("Vai trò đã chọn không hợp lệ hoặc chưa tải xong danh sách vai trò.");
      }

      const input = {
        fullName: data.name.trim(),
        email: data.email.trim(),
        phone: data.phone?.trim() || undefined,
        roleId,
        departmentId: primaryDepartmentId || data.departmentId?.trim() || null,
      };

      let savedUserRaw;
      if (modalMode === "create") {
        const payload = await usersRequest("", {
          method: "POST",
          body: {
            ...input,
            password: data.password,
            status: "active",
          },
        });
        savedUserRaw = payload?.data ?? payload;
      } else {
        const payload = await usersRequest(`/${selectedUser.id}`, {
          method: "PATCH",
          body: input,
        });
        savedUserRaw = payload?.data ?? payload;
      }

      // Lưu trữ ánh xạ đa phòng ban cục bộ ở localStorage
      const mapping = getUserDepartmentsMapping();
      const userId = savedUserRaw.id || savedUserRaw._id || selectedUser?.id;
      if (userId) {
        mapping[userId] = data.departmentIds || [];
        saveUserDepartmentsMapping(mapping);
      }

      const updatedUser = normalizeUser(savedUserRaw, apiRoles);

      setUsers(prev => {
        if (modalMode === "create") {
          return [updatedUser, ...prev];
        } else {
          return prev.map(u => u.id === selectedUser.id ? updatedUser : u);
        }
      });

      // Đồng bộ state featurePermissionsByUserId khi tạo/sửa user
      setFeaturePermissionsByUserId(prev => {
        const next = {
          ...prev,
          [updatedUser.id]: updatedUser.grantedPermissions || []
        };
        writeUserFeaturePermissions(next);
        return next;
      });

      if (modalMode === "edit") {
        setDetailUser((current) => current?.id === selectedUser.id ? updatedUser : current);
      }

      closeModal();
    } catch (err) {
      alert("Lỗi: " + (err instanceof Error ? err.message : "Thao tác thất bại"));
    } finally {
      setActionLoading(false);
    }
  };

  // 5. Xử lý Lock / Unlock tài khoản
  const toggleUserStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === "active" ? "suspended" : "active";
    const confirmMsg = currentStatus === "active" ? "Bạn có chắc muốn KHÓA tài khoản này?" : "Bạn có chắc muốn MỞ KHÓA tài khoản này?";
    
    if (!window.confirm(confirmMsg)) return;

    setActionLoading(true);
    try {
      const payload = await usersRequest(`/${userId}/status`, {
        method: "PATCH",
        body: { status: newStatus },
      });
      const updatedUser = normalizeUser(payload?.data ?? payload, apiRoles);
      setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
    } catch (err) {
      alert("Lỗi: " + (err instanceof Error ? err.message : "Cập nhật trạng thái thất bại"));
    } finally {
      setActionLoading(false);
    }
  };

  // 6. Lọc dữ liệu hiển thị (Derived State)
  const filteredUsers = users.filter(user => {
    const matchSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = filterRole ? user.role === filterRole : true;
    const matchDept = filterDepartment ? user.departmentId === filterDepartment : true;
    return matchSearch && matchRole && matchDept;
  });
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / USER_PAGE_SIZE));

  if (currentPage > totalPages) {
    setCurrentPage(totalPages);
  }

  const activePage = Math.min(currentPage, totalPages);
  const pageStartIndex = (activePage - 1) * USER_PAGE_SIZE;
  const paginatedUsers = filteredUsers.slice(pageStartIndex, pageStartIndex + USER_PAGE_SIZE);

  // Lấy danh sách phòng ban unique (dùng cho bộ lọc)
  const departments = departmentOptions.length > 0
    ? departmentOptions.map((department) => [
        department.id,
        `${department.name}${department.isHidden ? " (đang ẩn)" : ""}`,
      ])
    : Array.from(
        new Map(
          users
            .filter((user) => user.departmentId)
            .map((user) => [user.departmentId, user.department || user.departmentId]),
        ),
      );

  const getRoleFeaturePermissions = (user) => {
    if (!user) return [];

    const matchedRole = apiRoles.find((role) => (
      normalizeRoleId(role.id) === normalizeRoleId(user.roleId) ||
      role.slug === user.role
    ));
    const rolePermissions = Array.isArray(matchedRole?.permissions)
      ? matchedRole.permissions
      : getDefaultFeaturePermissions(user.role);

    return Array.from(expandFeaturePermissions(rolePermissions));
  };

  const getUserGrantedFeaturePermissions = (user) => {
    if (!user) return [];
    const customPermissions = featurePermissionsByUserId[user.id];
    if (Array.isArray(customPermissions)) return Array.from(expandFeaturePermissions(customPermissions));
    return Array.from(expandFeaturePermissions(user.grantedPermissions || []));
  };

  const getUserFeaturePermissions = (user) => {
    const permissions = new Set([
      ...getRoleFeaturePermissions(user),
      ...getUserGrantedFeaturePermissions(user),
    ]);
    return Array.from(permissions);
  };

  // Tự động đồng bộ quyền chức năng từ server khi load trang đã được giải quyết tại fetchUsers.
  // Loại bỏ cơ chế auto-patch ghi đè từ localStorage lên database để tránh lỗi đồng bộ dữ liệu.

  const getFeaturePermissionCount = (user) =>
    getUserFeaturePermissions(user).filter((permission) => permission !== "*").length;

  const openPermissionModal = (user) => {
    setPermissionUser(user);
  };

  const closePermissionModal = () => {
    setPermissionUser(null);
  };

  const toggleFeaturePermission = async (userId, permissionId) => {
    if (!isCurrentUserAdmin) return;

    const user = users.find((item) => item.id === userId) || permissionUser;
    const inheritedPermissions = getRoleFeaturePermissions(user);
    if (inheritedPermissions.includes("*") || inheritedPermissions.includes(permissionId)) {
      return;
    }

    const currentPermissions = getUserGrantedFeaturePermissions(user).filter((item) => item !== "*");
    const nextPermissions = currentPermissions.includes(permissionId)
      ? currentPermissions.filter((item) => item !== permissionId)
      : [...currentPermissions, permissionId];

    const previousPermissionsByUserId = featurePermissionsByUserId;
    setFeaturePermissionsByUserId((current) => {
      const next = {
        ...current,
        [userId]: nextPermissions,
      };
      writeUserFeaturePermissions(next);
      return next;
    });

    setUsers((current) =>
      current.map((item) =>
        item.id === userId ? { ...item, grantedPermissions: nextPermissions } : item,
      ),
    );
    if (permissionUser?.id === userId) {
      setPermissionUser((current) =>
        current ? { ...current, grantedPermissions: nextPermissions } : current,
      );
    }

    try {
      await usersRequest(`/${userId}`, {
        method: "PATCH",
        body: { grantedPermissions: nextPermissions },
      });
    } catch (error) {
      setFeaturePermissionsByUserId(previousPermissionsByUserId);
      writeUserFeaturePermissions(previousPermissionsByUserId);
      setUsers((current) =>
        current.map((item) =>
          item.id === userId ? { ...item, grantedPermissions: currentPermissions } : item,
        ),
      );
      if (permissionUser?.id === userId) {
        setPermissionUser((current) =>
          current ? { ...current, grantedPermissions: currentPermissions } : current,
        );
      }
      alert(error instanceof Error ? error.message : "Không thể lưu quyền chức năng.");
    }
  };

  const openUserDetail = async (user) => {
    setDetailUser(user);

    try {
      const payload = await usersRequest(`/${user.id}`);
      setDetailUser(normalizeUser(payload?.data ?? payload, apiRoles));
    } catch {
      setDetailUser(user);
    }
  };

  const closeUserDetail = () => {
    setDetailUser(null);
  };

  const userPermissions = Array.isArray(currentUser?.permissions) ? currentUser.permissions : [];
  const hasAccess = ["admin", "bangiamdoc"].includes(currentUser?.role) ||
                    userPermissions.includes("users:read") ||
                    userPermissions.includes("*");

  if (!hasAccess) {
    return (
      <div className="container-fluid pt-5 text-center">
        <h2 className="text-danger">Từ chối truy cập</h2>
        <p className="text-body-secondary">Bạn không có quyền truy cập trang Quản lý tài khoản.</p>
      </div>
    );
  }

  return (
    <div className="user-list-wrapper container-fluid pt-3 pb-4" style={{ maxWidth: "1600px" }}>
      {/* Header & Title */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold text-body-emphasis mb-1">Quản lý tài khoản</h4>
        </div>
        <button id="users-add-btn" className="btn btn-primary d-flex align-items-center gap-2" onClick={openCreateModal}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Thêm tài khoản
        </button>
      </div>

      {/* Filter Bar */}
      <div id="users-filter-bar" className="filter-bar">
        <div className="search-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input 
            type="text" 
            className="form-control form-control-sm bg-body border-1" 
            placeholder="Tìm theo tên hoặc email..." 
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        
        <div className="filter-select min-w-[170px]">
          <TailwindDropdown
            onChange={(val) => {
              setFilterRole(val);
              setCurrentPage(1);
            }}
            options={[
              { label: "Tất cả vai trò", value: "" },
              ...roleOptions,
            ]}
            placeholder="Tất cả vai trò"
            value={filterRole}
          />
        </div>

        <div className="filter-select min-w-[190px]">
          <TailwindDropdown
            disabled={departmentsLoading}
            onChange={(val) => {
              setFilterDepartment(val);
              setCurrentPage(1);
            }}
            options={[
              { label: "Tất cả phòng ban", value: "" },
              ...departments.map(([departmentId, departmentName]) => ({
                label: departmentName,
                value: departmentId,
              })),
            ]}
            placeholder={departmentsLoading ? "Đang tải phòng ban..." : "Tất cả phòng ban"}
            value={filterDepartment}
          />
        </div>
      </div>

      {/* Main Table Card */}
      <div id="users-table-card" className="card table-card">
        <div className="table-responsive">
          <table className="table custom-table">
            <thead>
              <tr>
                <th style={{ width: "5%" }}>#</th>
                <th style={{ width: "24%" }}>Thông tin nhân viên</th>
                <th style={{ width: "20%" }}>Vai trò</th>
                <th style={{ width: "14%" }}>Phòng ban</th>
                <th style={{ width: "14%" }}>Trạng thái</th>
                <th style={{ width: "14%" }}>Quyền chức năng</th>
                <th style={{ width: "9%", textAlign: "center" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="7" className="text-center py-4 text-danger">{error}</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-body-secondary">
                    Không tìm thấy tài khoản nào phù hợp.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user, index) => {
                  const featurePermissionCount = getFeaturePermissionCount(user);
                  
                  return (
                    <tr key={user.id} className="cursor-pointer" onClick={() => openUserDetail(user)}>
                      <td>{pageStartIndex + index + 1}</td>
                      <td>
                        <div className="d-flex flex-column">
                          <span className="fw-bold text-body-emphasis">{user.name}</span>
                          <span className="text-body-secondary" style={{ fontSize: "12px" }}>{user.email}</span>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <span className={`badge ${user.roleColor || "bg-secondary text-white"}`}>
                            {user.roleLabel || user.role}
                          </span>
                        </div>
                      </td>
                      <td>
                        {(() => {
                          const userDeptIds = user.departmentIds || [];
                          if (userDeptIds.length > 0 && departmentOptions.length > 0) {
                            return userDeptIds
                              .map(id => departmentOptions.find(d => d.id === id)?.name)
                              .filter(Boolean)
                              .join(", ");
                          }
                          return user.department || '—';
                        })()}
                      </td>
                      <td>
                        <span className={`status-badge ${user.status === 'active' ? 'status-active' : 'status-locked'}`}>
                          {user.status === 'active' ? (
                            <><span className="spinner-grow spinner-grow-sm bg-success" style={{width: '6px', height: '6px'}}></span> Hoạt động</>
                          ) : (
                            <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg> {user.status === "inactive" ? "Ngừng hoạt động" : "Đã khóa"}</>
                          )}
                        </span>
                      </td>
                      <td id="users-permission-col" className="text-center" onClick={(event) => event.stopPropagation()}>
                        <button
                          type="button"
                          className={`btn btn-sm ${featurePermissionCount > 0 ? "btn-outline-primary" : "btn-light border"}`}
                          onClick={() => openPermissionModal(user)}
                          disabled={actionLoading}
                          title={isCurrentUserAdmin ? "Xem và phân quyền chức năng" : "Xem quyền chức năng"}
                        >
                          {featurePermissionCount} quyền
                        </button>
                      </td>
                      <td id="users-action-col" className="text-center">
                        <div className="d-inline-flex align-items-center justify-content-center gap-2" style={{ minWidth: "76px" }} onClick={(event) => event.stopPropagation()}>
                        <button
                          className="action-btn btn-view"
                          title="Xem chi tiết"
                          onClick={() => openUserDetail(user)}
                          disabled={actionLoading}
                        >
                          <EyeIcon />
                        </button>
                        <button 
                          className="action-btn btn-edit" 
                          title="Chỉnh sửa"
                          onClick={() => openEditModal(user)}
                          disabled={actionLoading}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        
                        <button 
                          className={`action-btn ${user.status === 'active' ? 'btn-lock' : 'btn-unlock'}`}
                          title={
                            currentUser?.email === user.email
                              ? "Không thể tự khóa tài khoản đang đăng nhập"
                              : user.status === 'active'
                                ? 'Khóa tài khoản'
                                : 'Mở khóa tài khoản'
                          }
                          onClick={() => toggleUserStatus(user.id, user.status)}
                          disabled={actionLoading || currentUser?.email === user.email}
                        >
                          {user.status === 'active' ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                          ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>
                          )}
                        </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="card-footer bg-transparent border-top py-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
          <span className="text-body-secondary" style={{ fontSize: "13px" }}>
            {filteredUsers.length === 0
              ? "Hiển thị 0 tài khoản"
              : `Hiển thị ${pageStartIndex + 1}-${Math.min(pageStartIndex + paginatedUsers.length, filteredUsers.length)} / ${filteredUsers.length} tài khoản`}
          </span>
          {totalPages > 1 && (
            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              >
                Trước
              </button>
              <span className="text-body-secondary" style={{ fontSize: "13px" }}>
                Trang {currentPage}/{totalPages}
              </span>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              >
                Sau
              </button>
            </div>
          )}
        </div>
      </div>

      {detailUser && (
        <div className="custom-modal-overlay">
          <div className="custom-modal-content">
            <div className="custom-modal-header">
              <h5>Chi tiết tài khoản</h5>
              <button className="btn-close-modal" onClick={closeUserDetail}>
                <CloseIcon />
              </button>
            </div>
            <div className="custom-modal-body">
              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="user-detail-avatar">
                  {detailUser.name
                    .split(" ")
                    .filter(Boolean)
                    .slice(-2)
                    .map((part) => part[0])
                    .join("")
                    .toUpperCase() || "U"}
                </div>
                <div className="min-w-0">
                  <h5 className="mb-1 text-body-emphasis">{detailUser.name || "Chưa cập nhật tên"}</h5>
                  <div className="text-body-secondary text-break">{detailUser.email || "Chưa cập nhật email"}</div>
                </div>
              </div>

              <div className="user-detail-grid">
                <DetailItem label="Tên" value={detailUser.name} />
                <DetailItem label="Email" value={detailUser.email} />
                <DetailItem label="Số điện thoại" value={detailUser.phone} />
                <DetailItem label="Địa chỉ" value={detailUser.address} />
                <DetailItem label="Link mạng xã hội" value={detailUser.socialLink} isLink />
                <DetailItem label="Mã giới thiệu" value={detailUser.referralCode} />
                <DetailItem label="Vai trò" value={detailUser.roleLabel || detailUser.role} />
                <DetailItem label="Phòng ban" value={
                  (() => {
                    const userDeptIds = detailUser.departmentIds || [];
                    if (userDeptIds.length > 0 && departmentOptions.length > 0) {
                      return userDeptIds
                        .map(id => departmentOptions.find(d => d.id === id)?.name)
                        .filter(Boolean)
                        .join(", ");
                    }
                    return detailUser.department || '—';
                  })()
                } />
                <DetailItem label="Trạng thái" value={detailUser.status === "active" ? "Hoạt động" : "Đã khóa/Ngừng hoạt động"} />
              </div>
            </div>
            <div className="custom-modal-footer">
              <button type="button" className="btn btn-light border" onClick={closeUserDetail}>Đóng</button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  closeUserDetail();
                  openEditModal(detailUser);
                }}
                disabled={!isCurrentUserAdmin}
              >
                Chỉnh sửa
              </button>
            </div>
          </div>
        </div>
      )}

      {permissionUser && (
        <div className="custom-modal-overlay">
          <div className="custom-modal-content modal-role-wide">
            <div className="custom-modal-header">
              <div>
                <h5>Quyền chức năng</h5>
                <div className="text-body-secondary" style={{ fontSize: "13px" }}>
                  {permissionUser.name} · {permissionUser.roleLabel || permissionUser.role}
                </div>
              </div>
              <button className="btn-close-modal" onClick={closePermissionModal}>
                <CloseIcon />
              </button>
            </div>
            <div className="custom-modal-body">
              {!isCurrentUserAdmin && (
                <div className="alert alert-info py-2" style={{ fontSize: "13px" }}>
                  Bạn chỉ có thể xem quyền chức năng. Chỉ Admin mới được phân thêm hoặc thu hồi quyền.
                </div>
              )}
              <div className="alert alert-secondary py-2" style={{ fontSize: "13px" }}>
                Quyền được tính theo: quyền vai trò + quyền cấp riêng tài khoản. Quyền kế thừa từ vai trò chỉ sửa ở màn hình Quản lý vai trò.
              </div>
              <div className="permissions-container">
                {FEATURE_PERMISSION_GROUPS.map((group) => (
                  <div className="module-group" key={group.id}>
                    <div className="module-header">
                      <h6 className="module-title">{group.title}</h6>
                    </div>
                    <div className="permissions-grid">
                      {group.permissions.map((permission) => {
                        const rolePermissions = getRoleFeaturePermissions(permissionUser);
                        const grantedPermissions = getUserGrantedFeaturePermissions(permissionUser);
                        const isInherited = rolePermissions.includes("*") || rolePermissions.includes(permission.id);
                        const isGranted = grantedPermissions.includes(permission.id);
                        const checked = isInherited || isGranted;

                        return (
                          <label className="permission-checkbox" key={permission.id}>
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={!isCurrentUserAdmin || isInherited}
                              onChange={() => toggleFeaturePermission(permissionUser.id, permission.id)}
                            />
                            <span>
                              {permission.label}
                              {isInherited && (
                                <small className="text-body-secondary ms-1">(theo vai trò)</small>
                              )}
                              {!isInherited && isGranted && (
                                <small className="text-primary ms-1">(cấp riêng)</small>
                              )}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="custom-modal-footer">
              <button type="button" className="btn btn-primary" onClick={closePermissionModal}>Xong</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL CREATE / EDIT --- */}
      {isModalOpen && (
        <div className="custom-modal-overlay">
          <div className="custom-modal-content">
            <div className="custom-modal-header">
              <h5>{modalMode === "create" ? "Thêm tài khoản mới" : "Cập nhật thông tin"}</h5>
              <button className="btn-close-modal" onClick={closeModal}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="custom-modal-body">
                <div className="mb-3">
                  <label className="form-label" style={{ fontSize: "14px", fontWeight: "600" }}>Họ và tên <span className="text-danger">*</span></label>
                  <input 
                    type="text" 
                    className={`form-control ${errors.name ? 'is-invalid' : ''}`} 
                    placeholder="Nhập họ và tên..."
                    disabled={actionLoading}
                    {...register("name", { required: "Vui lòng nhập họ tên" })}
                  />
                  {errors.name && <div className="invalid-feedback">{errors.name.message}</div>}
                </div>

                <div className="mb-3">
                  <label className="form-label" style={{ fontSize: "14px", fontWeight: "600" }}>Email <span className="text-danger">*</span></label>
                  <input 
                    type="email" 
                    className={`form-control ${errors.email ? 'is-invalid' : ''}`} 
                    placeholder="name@hto.vn"
                    disabled={actionLoading || modalMode === "edit"} // Khóa email khi Edit (Tùy logic nghiệp vụ)
                    {...register("email", { 
                      required: "Vui lòng nhập email",
                      pattern: { value: /\S+@\S+\.\S+/, message: "Email không hợp lệ" }
                    })}
                  />
                  {errors.email && <div className="invalid-feedback">{errors.email.message}</div>}
                  {modalMode === "edit" && <small className="text-body-secondary mt-1 d-block">Email dùng để đăng nhập nên không thể thay đổi.</small>}
                </div>

                {modalMode === "create" && (
                  <div className="mb-3">
                    <label className="form-label" style={{ fontSize: "14px", fontWeight: "600" }}>Mật khẩu <span className="text-danger">*</span></label>
                    <input 
                      type="password" 
                      className={`form-control ${errors.password ? 'is-invalid' : ''}`} 
                      placeholder="Ít nhất 8 ký tự"
                      disabled={actionLoading}
                      {...register("password", {
                        required: "Vui lòng nhập mật khẩu",
                        minLength: { value: 8, message: "Mật khẩu phải có ít nhất 8 ký tự" },
                      })}
                    />
                    {errors.password && <div className="invalid-feedback">{errors.password.message}</div>}
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label" style={{ fontSize: "14px", fontWeight: "600" }}>Số điện thoại</label>
                  <input
                    type="tel"
                    className="form-control"
                    placeholder="Ví dụ: 0901234567"
                    disabled={actionLoading}
                    {...register("phone")}
                  />
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label" style={{ fontSize: "14px", fontWeight: "600" }}>Vai trò <span className="text-danger">*</span></label>
                    <input type="hidden" {...register("role", { required: "Vui lòng chọn vai trò" })} />
                    <TailwindDropdown
                      disabled={actionLoading || rolesLoading}
                      error={Boolean(errors.role)}
                      onChange={(value) => setValue("role", value, { shouldDirty: true, shouldValidate: true })}
                      options={roleOptions}
                      placeholder={rolesLoading ? "Đang tải vai trò..." : "-- Chọn vai trò --"}
                      value={selectedRoleValue}
                    />
                    {errors.role && <div className="invalid-feedback">{errors.role.message}</div>}
                  </div>

                  <div className="col-md-6 mb-3">
                    <input type="hidden" {...register("departmentId")} />
                    <input type="hidden" {...register("departmentIds")} />
                    <label className="form-label" style={{ fontSize: "14px", fontWeight: "600" }}>Phòng ban nghiệp vụ (Chọn nhiều)</label>
                    <div className="d-flex flex-wrap gap-2 border rounded p-2 bg-body-tertiary" style={{ maxHeight: "150px", overflowY: "auto", minHeight: "38px" }}>
                      {departmentOptions.length === 0 ? (
                        <span className="text-body-secondary small">Đang tải phòng ban...</span>
                      ) : (
                        departmentOptions.map((dept) => {
                          const currentIds = selectedDepartmentIdsValue;
                          const isChecked = currentIds.includes(dept.id);
                          return (
                            <label key={dept.id} className="d-flex align-items-center gap-1 cursor-pointer mb-0 px-2 py-0.5 bg-body rounded border" style={{ fontSize: "12px" }}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                disabled={actionLoading}
                                onChange={(e) => {
                                  const nextIds = e.target.checked
                                    ? [...currentIds, dept.id]
                                    : currentIds.filter(id => id !== dept.id);
                                  setValue("departmentIds", nextIds, { shouldDirty: true });
                                  setValue("departmentId", nextIds[0] || "", { shouldDirty: true });
                                }}
                              />
                              <span>{dept.name}</span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                {modalMode === "create" && (
                  <div className="alert alert-info py-2" style={{ fontSize: "13px" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="me-2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                    Tài khoản sẽ được tạo trực tiếp qua API người dùng.
                  </div>
                )}
              </div>

              <div className="custom-modal-footer">
                <button type="button" className="btn btn-light border" onClick={closeModal} disabled={actionLoading}>Hủy</button>
                <button type="submit" className="btn btn-primary d-flex align-items-center gap-2" disabled={actionLoading}>
                  {actionLoading && <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>}
                  {modalMode === "create" ? "Tạo tài khoản" : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

function DetailItem({ isLink = false, label, value }) {
  const displayValue = value || "Chưa cập nhật";

  return (
    <div className="user-detail-item">
      <div className="user-detail-label">{label}</div>
      {isLink && value ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="user-detail-value text-primary">
          {value}
        </a>
      ) : (
        <div className="user-detail-value">{displayValue}</div>
      )}
    </div>
  );
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}
