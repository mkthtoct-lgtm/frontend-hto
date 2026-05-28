import { useEffect, useMemo, useState } from "react";

// const API_BASE_URL =
//   import.meta.env.VITE_API_BASE_URL ||
//   (import.meta.env.PROD ? "/api/v1" : "http://qlnb-api.hto.edu.vn/api/v1");
const API_BASE_URL = "http://localhost:8080/api/v1";

const ADMIN_ROLE_ID = "69fc5af582ef85451120772a";
const DEPARTMENT_HEAD_ROLE_ID = "69fc5af582ef85451120772c";
const DOCUMENT_PERMISSIONS_STORAGE_KEY = "hto_document_permissions";
const DOCUMENT_STATUS_STORAGE_KEY = "hto_document_statuses";

const ROLE_OPTIONS = [
  { id: "admin", roleId: ADMIN_ROLE_ID, label: "Admin" },
  { id: "bangiamdoc", roleId: "69fc5af582ef85451120772b", label: "Ban giám đốc" },
  { id: "truongbophan", roleId: DEPARTMENT_HEAD_ROLE_ID, label: "Trưởng bộ phận" },
  { id: "nhansu", roleId: "69fc5af582ef85451120772d", label: "Nhân sự" },
  { id: "daily", roleId: "69fc5af582ef85451120772e", label: "Đại lý" },
  { id: "congtacvien", roleId: "69fc5af682ef85451120772f", label: "Cộng tác viên" },
  { id: "user", roleId: "69fc5af782ef854511207730", label: "Người dùng" },
];

const USER_GROUP_OPTIONS = [
  { id: "all", label: "Tất cả người dùng" },
  { id: "internal", label: "Nội bộ" },
  { id: "partner", label: "Đối tác/Cộng tác viên" },
  { id: "manager", label: "Quản lý" },
];

const PERMISSION_ACTIONS = [
  { id: "view", label: "Xem" },
  { id: "download", label: "Tải" },
  { id: "edit", label: "Sửa" },
];

const DOCUMENT_STATUS_OPTIONS = [
  "Nháp",
  "Chờ duyệt",
  "Đang dùng",
  "Cần cập nhật",
  "Ngừng dùng",
];

const DOCUMENT_DOWNLOAD_BLOCKED_STATUSES = new Set(["Nháp", "Ngừng dùng"]);
const REMOTE_DOCUMENT_PAGE_SIZE = 100;

const canUploadDocument = (user) =>
  ["admin", "truongbophan"].includes(user?.role) ||
  [ADMIN_ROLE_ID, DEPARTMENT_HEAD_ROLE_ID].includes(user?.roleId);

const initialDepartments = [
  { id: "dept-hanh-chinh", name: "Hành chính" },
  { id: "dept-nhan-su", name: "Nhân sự" },
  { id: "dept-ke-toan", name: "Kế toán" },
  { id: "dept-ho-so", name: "Hồ sơ" },
  { id: "dept-tuyen-sinh", name: "Tuyển sinh" },
];

const initialDocuments = [
  {
    id: 1,
    title: "Đơn xin nghỉ phép",
    categoryId: 2,
    departmentId: "dept-nhan-su",
    updatedAt: "2026-05-05",
    status: "Đang dùng",
    sourceType: "file",
    sourceName: "don-xin-nghi-phep.docx",
    permissions: {
      view: { groups: ["all"], roles: [], departments: [] },
      download: { groups: ["all"], roles: [], departments: [] },
      edit: { groups: ["manager"], roles: ["admin", "truongbophan"], departments: [] },
    },
  },
  {
    id: 2,
    title: "Phiếu đề nghị thanh toán",
    categoryId: 3,
    departmentId: "dept-ke-toan",
    updatedAt: "2026-05-02",
    status: "Đang dùng",
    sourceType: "file",
    sourceName: "phieu-de-nghi-thanh-toan.pdf",
    permissions: {
      view: { groups: ["all"], roles: [], departments: [] },
      download: { groups: ["internal"], roles: [], departments: ["dept-ke-toan"] },
      edit: { groups: ["manager"], roles: ["admin", "truongbophan"], departments: [] },
    },
  },
  {
    id: 3,
    title: "Biên bản bàn giao",
    categoryId: 1,
    departmentId: "dept-hanh-chinh",
    updatedAt: "2026-05-01",
    status: "Nháp",
    sourceType: "link",
    sourceName: "https://drive.google.com/bien-ban-ban-giao",
    permissions: {
      view: { groups: ["internal"], roles: [], departments: ["dept-hanh-chinh"] },
      download: { groups: ["internal"], roles: [], departments: ["dept-hanh-chinh"] },
      edit: { groups: ["manager"], roles: ["admin", "truongbophan"], departments: [] },
    },
  },
];

const emptyForm = { name: "", description: "" };
const CATEGORY_PAGE_SIZE =4
const emptyUploadForm = {
  title: "",
  categoryId: "",
  departmentId: "",
  sourceType: "file",
  file: null,
  link: "",
  description: "",
};

const getAuthHeaders = () => {
  const token = window.localStorage.getItem("token");

  return token ? { Authorization: `Bearer ${token}` } : {};
};

const emptyPermissionRule = () => ({ groups: [], roles: [], departments: [] });

const createDefaultPermissions = (departmentId = "") => ({
  view: { groups: ["all"], roles: [], departments: departmentId ? [departmentId] : [] },
  download: { groups: ["all"], roles: [], departments: departmentId ? [departmentId] : [] },
  edit: { groups: ["manager"], roles: ["admin", "truongbophan"], departments: [] },
});

const normalizePermissions = (permissions, departmentId) => {
  const defaults = createDefaultPermissions(departmentId);

  return PERMISSION_ACTIONS.reduce((acc, action) => {
    const rule = permissions?.[action.id] || defaults[action.id] || emptyPermissionRule();

    acc[action.id] = {
      groups: Array.isArray(rule.groups) ? rule.groups : [],
      roles: Array.isArray(rule.roles) ? rule.roles : [],
      departments: Array.isArray(rule.departments) ? rule.departments : [],
    };

    return acc;
  }, {});
};

const getUserGroupIds = (user) => {
  const role = user?.role || "";
  const groups = ["all"];

  if (["admin", "bangiamdoc", "truongbophan", "nhansu", "user"].includes(role)) {
    groups.push("internal");
  }

  if (["daily", "congtacvien"].includes(role)) {
    groups.push("partner");
  }

  if (["admin", "bangiamdoc", "truongbophan"].includes(role)) {
    groups.push("manager");
  }

  return groups;
};

const isAdminUser = (user) => user?.role === "admin" || user?.roleId === ADMIN_ROLE_ID;

const canUseDocumentAction = (user, document, action) => {
  if (isAdminUser(user)) {
    return true;
  }

  const rule = document.permissions?.[action] || emptyPermissionRule();
  const userGroups = getUserGroupIds(user);
  const userRole = user?.role;
  const userDepartmentId = user?.departmentId;

  return (
    rule.groups.some((groupId) => userGroups.includes(groupId)) ||
    rule.roles.includes(userRole) ||
    Boolean(userDepartmentId && rule.departments.includes(userDepartmentId))
  );
};

const getDocumentActionUrl = (document) =>
  document.fileUrl ||
  (document.sourceType === "link" ? getAbsoluteDocumentUrl(document.sourceName) : "");

const hasDownloadPermission = (user, document) => {
  if (DOCUMENT_DOWNLOAD_BLOCKED_STATUSES.has(document.status)) {
    return false;
  }

  return canUseDocumentAction(user, document, "download");
};

const getDownloadPermissionReason = (user, document) => {
  if (!canUseDocumentAction(user, document, "download")) {
    return "Bạn chưa có quyền tải";
  }

  if (DOCUMENT_DOWNLOAD_BLOCKED_STATUSES.has(document.status)) {
    return `Tài liệu đang ở trạng thái "${document.status}" nên chưa thể tải xuống`;
  }

  return "";
};

const getDownloadDisabledReason = (user, document) => {
  const permissionReason = getDownloadPermissionReason(user, document);

  if (permissionReason) {
    return permissionReason;
  }

  if (!getDocumentActionUrl(document)) {
    return "Tài liệu đã được cấp quyền tải nhưng chưa có link tải.";
  }

  return "";
};

const readStoredPermissions = () => {
  try {
    return JSON.parse(window.localStorage.getItem(DOCUMENT_PERMISSIONS_STORAGE_KEY) || "{}");
  } catch {
    window.localStorage.removeItem(DOCUMENT_PERMISSIONS_STORAGE_KEY);
    return {};
  }
};

const writeStoredPermissions = (permissionsByDocumentId) => {
  window.localStorage.setItem(
    DOCUMENT_PERMISSIONS_STORAGE_KEY,
    JSON.stringify(permissionsByDocumentId),
  );
};

const readStoredStatuses = () => {
  try {
    return JSON.parse(window.localStorage.getItem(DOCUMENT_STATUS_STORAGE_KEY) || "{}");
  } catch {
    window.localStorage.removeItem(DOCUMENT_STATUS_STORAGE_KEY);
    return {};
  }
};

const writeStoredStatuses = (statusesByDocumentId) => {
  window.localStorage.setItem(
    DOCUMENT_STATUS_STORAGE_KEY,
    JSON.stringify(statusesByDocumentId),
  );
};

const getStatusBadgeClass = (status) => {
  switch (status) {
    case "Đang dùng":
      return "bg-success-subtle text-success";
    case "Chờ duyệt":
      return "bg-warning-subtle text-warning";
    case "Cần cập nhật":
      return "bg-info-subtle text-info";
    case "Ngừng dùng":
      return "bg-danger-subtle text-danger";
    default:
      return "bg-body-secondary text-body";
  }
};

const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("vi-VN");
};

const formatDateTime = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const normalizeDocumentStatus = (status) => {
  switch (status) {
    case "draft":
      return "Nháp";
    case "pending":
      return "Chờ duyệt";
    case "inactive":
    case "archived":
      return "Ngừng dùng";
    case "active":
      return "Đang dùng";
    default:
      return status || "Đang dùng";
  }
};

const getFileNameFromUrl = (url) => {
  if (!url) return "";

  try {
    const parsedUrl = new URL(url, window.location.origin);
    const pathnameParts = parsedUrl.pathname.split("/").filter(Boolean);

    return decodeURIComponent(pathnameParts[pathnameParts.length - 1] || "");
  } catch {
    const pathnameParts = String(url).split("?")[0].split("/").filter(Boolean);

    return decodeURIComponent(pathnameParts[pathnameParts.length - 1] || "");
  }
};

const getAbsoluteDocumentUrl = (url) => {
  if (!url) return "";

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  const apiOrigin = API_BASE_URL.replace(/\/api\/v\d+\/?$/, "");

  return `${apiOrigin}${url.startsWith("/") ? "" : "/"}${url}`;
};

const normalizeDocumentsPayload = (payload) => {
  if (Array.isArray(payload)) return { items: payload, total: payload.length };
  if (Array.isArray(payload?.items)) return { items: payload.items, total: payload.total };
  if (Array.isArray(payload?.data)) return { items: payload.data, total: payload.total };

  return { items: [], total: 0 };
};

const normalizeDocument = (document) => {
  const id = document.id || document._id;
  const storedPermissions = readStoredPermissions();
  const storedStatuses = readStoredStatuses();
  const category = normalizeDocumentCategory(document);
  const fileUrl = document.fileUrl || document.url || document.link || "";
  const absoluteFileUrl = getAbsoluteDocumentUrl(fileUrl);
  const fileName =
    document.fileName ||
    document.sourceName ||
    getFileNameFromUrl(fileUrl) ||
    document.title ||
    "Tài liệu";
  const fileType =
    document.fileType ||
    document.mimeType ||
    fileName.split(".").pop()?.toLowerCase() ||
    "";
  const status = normalizeDocumentStatus(document.status);
  const departmentId =
    document.departmentId ||
    document.allowedDepartmentId ||
    document.category?.departmentId ||
    "";
  const metadata = {
    fileType: fileType || "-",
    productId: document.productId || "-",
    schoolId: document.schoolId || "-",
    uploadedById: document.uploadedById || "-",
    isAiTrainingSource: Boolean(document.isAiTrainingSource),
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
    rawStatus: document.status || "-",
  };
  const canDownload =
    typeof document.canDownload === "boolean"
      ? document.canDownload
      : true;
  const permissions = normalizePermissions(
    storedPermissions[id] ||
      document.permissions || {
        view: { groups: ["all"], roles: [], departments: [] },
        download: {
          groups: canDownload ? ["all"] : [],
          roles: [],
          departments: [],
        },
        edit: { groups: ["manager"], roles: ["admin", "truongbophan"], departments: [] },
      },
    departmentId,
  );

  return {
    ...document,
    id,
    categoryId: category?.id || document.categoryId || "",
    categoryName: category?.name || document.categoryName || "Danh mục chưa đặt tên",
    departmentId,
    updatedAt: formatDate(document.updatedAt),
    createdAt: formatDate(document.createdAt),
    status: storedStatuses[id] || status,
    sourceType: document.sourceType || (absoluteFileUrl ? "file" : "link"),
    sourceName: fileName,
    fileType,
    fileUrl: absoluteFileUrl,
    previewImage: document.previewImage || document.thumbnailUrl || "",
    metadata,
    canDownload,
    canView: document.canView ?? true,
    isRemote: true,
    permissions,
  };
};

const applyStoredPermissions = (documents) => {
  const storedPermissions = readStoredPermissions();
  const storedStatuses = readStoredStatuses();

  return documents.map((document) => ({
    ...document,
    status: storedStatuses[document.id] || document.status,
    permissions: normalizePermissions(
      storedPermissions[document.id] || document.permissions,
      document.departmentId,
    ),
  }));
};

const normalizeCategory = (category) => ({
  id: category.id || category._id,
  name: category.name || "",
  description: category.description || "",
  isHidden: Boolean(category.isHidden ?? category.hidden),
});

const normalizeDocumentCategory = (document) => {
  const category = document.category || document.documentCategory || null;
  const id = category?.id || category?._id || document.categoryId;

  if (!id) {
    return null;
  }

  return normalizeCategory({
    id,
    name: category?.name || document.categoryName || "Danh mục chưa đặt tên",
    description: category?.description || "",
    isHidden: category?.isHidden ?? category?.hidden ?? false,
  });
};

async function requestDocumentCategories(path = "", options = {}) {
  const response = await fetch(`${API_BASE_URL}/document-categories${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...options.headers,
    },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.message || "Không thể xử lý danh mục tài liệu.");
  }

  return payload?.data ?? payload;
}

const getDocumentCategories = async () => {
  const payload = await requestDocumentCategories();
  const categories = Array.isArray(payload) ? payload : payload?.items || [];

  return categories.map(normalizeCategory).filter((category) => category.id);
};

async function requestReadableDocuments(path = "", options = {}) {
  const response = await fetch(`${API_BASE_URL}/documents${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...options.headers,
    },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.message || "Không thể tải danh mục tài liệu.");
  }

  return payload?.data ?? payload;
}

const getReadableDocumentCategories = async () => {
  const payload = await requestReadableDocuments("?page=1&limit=100");
  const { items: documents } = normalizeDocumentsPayload(payload);
  const categoriesById = new Map();

  documents.forEach((document) => {
    const category = normalizeDocumentCategory(document);

    if (category) {
      categoriesById.set(String(category.id), category);
    }
  });

  return Array.from(categoriesById.values());
};

const getReadableDocuments = async (params = {}) => {
  const searchParams = new URLSearchParams({
    page: String(params.page || 1),
    limit: String(params.limit || REMOTE_DOCUMENT_PAGE_SIZE),
  });

  if (params.categoryId && params.categoryId !== "all") {
    searchParams.set("categoryId", params.categoryId);
  }

  const payload = await requestReadableDocuments(`?${searchParams.toString()}`);
  const { items, total } = normalizeDocumentsPayload(payload);

  return {
    items: items.map(normalizeDocument).filter((document) => document.id),
    total: total ?? items.length,
  };
};

const getReadableDocumentDetail = async (documentId) => {
  const payload = await requestReadableDocuments(`/${documentId}`);

  return normalizeDocument(payload);
};

const createDocumentCategory = async (input) => {
  const payload = await requestDocumentCategories("", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return normalizeCategory(payload);
};

const updateDocumentCategory = async (categoryId, input) => {
  const payload = await requestDocumentCategories(`/${categoryId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });

  return normalizeCategory(payload);
};

const toggleDocumentCategoryVisibility = async (categoryId) => {
  const payload = await requestDocumentCategories(`/${categoryId}/toggle-visibility`, {
    method: "PATCH",
  });

  return normalizeCategory(payload);
};

export const DocumentsPage = ({ currentUser }) => {
  const [categories, setCategories] = useState([]);
  const [documents, setDocuments] = useState(() => applyStoredPermissions(initialDocuments));
  const [documentTotal, setDocumentTotal] = useState(initialDocuments.length);
  const [documentLoading, setDocumentLoading] = useState(false);
  const [documentDetailLoading, setDocumentDetailLoading] = useState(false);
  const [documentError, setDocumentError] = useState("");
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [categoryPage, setCategoryPage] = useState(1);
  const [editingId, setEditingId] = useState(null);
  const [selectedPermissionDocId, setSelectedPermissionDocId] = useState(
    () => String(initialDocuments[0]?.id || ""),
  );
  const [form, setForm] = useState(emptyForm);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categoryActionLoading, setCategoryActionLoading] = useState(false);
  const [categoryError, setCategoryError] = useState("");
  const [uploadForm, setUploadForm] = useState(emptyUploadForm);
  const [uploadErrors, setUploadErrors] = useState({});
  const [uploadSuccess, setUploadSuccess] = useState("");

  const canUpload = canUploadDocument(currentUser);
  const canManageCategories = isAdminUser(currentUser);
  const canLoadCategories = Boolean(currentUser);
  const canConfigurePermissions = isAdminUser(currentUser);

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [String(c.id), c])),
    [categories],
  );
  const departmentMap = useMemo(
    () => new Map(initialDepartments.map((department) => [department.id, department])),
    [],
  );

  const visibleCategories = categories.filter((c) => !c.isHidden);
  const displayedCategories = canManageCategories ? categories : visibleCategories;
  const categoryPageCount = Math.max(
    1,
    Math.ceil(displayedCategories.length / CATEGORY_PAGE_SIZE),
  );
  const safeCategoryPage = Math.min(categoryPage, categoryPageCount);
  const paginatedCategories = displayedCategories.slice(
    (safeCategoryPage - 1) * CATEGORY_PAGE_SIZE,
    safeCategoryPage * CATEGORY_PAGE_SIZE,
  );
  const filteredDocuments = documents.filter((doc) => {
    if (doc.status === "Nháp" && !isAdminUser(currentUser)) {
      return false;
    }

    if (!canUseDocumentAction(currentUser, doc, "view")) {
      return false;
    }

    if (activeCategory === "all") return true;
    return String(doc.categoryId) === activeCategory;
  });
  const selectedPermissionDocument =
    documents.find((document) => String(document.id) === selectedPermissionDocId) ||
    documents[0] ||
    null;

  useEffect(() => {
    const permissionsByDocumentId = documents.reduce((acc, document) => {
      acc[document.id] = document.permissions;
      return acc;
    }, {});

    writeStoredPermissions(permissionsByDocumentId);
  }, [documents]);

  useEffect(() => {
    const statusesByDocumentId = documents.reduce((acc, document) => {
      acc[document.id] = document.status;
      return acc;
    }, {});

    writeStoredStatuses(statusesByDocumentId);
  }, [documents]);

  useEffect(() => {
    let isMounted = true;

    if (!canLoadCategories) {
      return () => {
        isMounted = false;
      };
    }

    const loadCategories = async () => {
      setCategoryLoading(true);
      setCategoryError("");

      try {
        const categoryData = canManageCategories
          ? await getDocumentCategories()
          : await getReadableDocumentCategories();

        if (isMounted) {
          setCategories(categoryData);
        }
      } catch (error) {
        if (isMounted) {
          setCategoryError(
            error instanceof Error
              ? error.message
              : "Không thể tải danh mục tài liệu từ API.",
          );
        }
      } finally {
        if (isMounted) {
          setCategoryLoading(false);
        }
      }
    };

    void loadCategories();

    return () => {
      isMounted = false;
    };
  }, [canLoadCategories, canManageCategories]);

  useEffect(() => {
    let isMounted = true;

    if (!currentUser) {
      return () => {
        isMounted = false;
      };
    }

    const loadDocuments = async () => {
      setDocumentLoading(true);
      setDocumentError("");

      try {
        const documentData = await getReadableDocuments({
          categoryId: activeCategory,
          limit: REMOTE_DOCUMENT_PAGE_SIZE,
        });
        const nextDocuments =
          documentData.items.length > 0
            ? documentData.items
            : applyStoredPermissions(initialDocuments);

        if (isMounted) {
          setDocuments(nextDocuments);
          setDocumentTotal(documentData.items.length > 0 ? documentData.total : nextDocuments.length);
          setSelectedPermissionDocId((currentId) => {
            if (nextDocuments.some((document) => String(document.id) === currentId)) {
              return currentId;
            }

            return String(nextDocuments[0]?.id || "");
          });
          setSelectedDocument((currentDocument) => {
            if (
              currentDocument &&
              nextDocuments.some(
                (document) => String(document.id) === String(currentDocument.id),
              )
            ) {
              return currentDocument;
            }

            return nextDocuments[0] || null;
          });
        }
      } catch (error) {
        if (isMounted) {
          setDocumentError(
            error instanceof Error
              ? error.message
              : "Không thể tải danh sách tài liệu từ API.",
          );
        }
      } finally {
        if (isMounted) {
          setDocumentLoading(false);
        }
      }
    };

    void loadDocuments();

    return () => {
      isMounted = false;
    };
  }, [activeCategory, currentUser]);

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canManageCategories || !form.name.trim()) return;

    setCategoryActionLoading(true);
    setCategoryError("");

    if (editingId) {
      try {
        const updatedCategory = await updateDocumentCategory(editingId, {
          name: form.name.trim(),
          description: form.description.trim(),
        });

        setCategories((prev) =>
          prev.map((item) => (item.id === editingId ? updatedCategory : item)),
        );
        resetForm();
      } catch (error) {
        setCategoryError(
          error instanceof Error ? error.message : "Không thể cập nhật danh mục.",
        );
      } finally {
        setCategoryActionLoading(false);
      }
      return;
    }

    try {
      const createdCategory = await createDocumentCategory({
        name: form.name.trim(),
        description: form.description.trim(),
      });

      setCategories((prev) => [...prev, createdCategory]);
      resetForm();
    } catch (error) {
      setCategoryError(error instanceof Error ? error.message : "Không thể tạo danh mục.");
    } finally {
      setCategoryActionLoading(false);
    }
  };

  const startEdit = (category) => {
    if (!canManageCategories) return;

    setEditingId(category.id);
    setForm({ name: category.name, description: category.description });
  };

  const toggleHidden = async (categoryId) => {
    if (!canManageCategories) return;

    setCategoryActionLoading(true);
    setCategoryError("");

    try {
      const updatedCategory = await toggleDocumentCategoryVisibility(categoryId);

      setCategories((prev) =>
        prev.map((item) => (item.id === categoryId ? updatedCategory : item)),
      );
    } catch (error) {
      setCategoryError(
        error instanceof Error ? error.message : "Không thể đổi trạng thái danh mục.",
      );
    } finally {
      setCategoryActionLoading(false);
    }
  };

  const validateUploadForm = () => {
    const nextErrors = {};

    if (!uploadForm.title.trim()) {
      nextErrors.title = "Vui lòng nhập tên tài liệu.";
    }

    if (!uploadForm.categoryId) {
      nextErrors.categoryId = "Vui lòng chọn danh mục.";
    }

    if (!uploadForm.departmentId) {
      nextErrors.departmentId = "Vui lòng chọn phòng ban nhận tài liệu.";
    }

    if (uploadForm.sourceType === "file" && !uploadForm.file) {
      nextErrors.file = "Vui lòng chọn file tài liệu.";
    }

    if (uploadForm.sourceType === "link") {
      if (!uploadForm.link.trim()) {
        nextErrors.link = "Vui lòng nhập đường link tài liệu.";
      } else {
        try {
          const parsedUrl = new URL(uploadForm.link.trim());

          if (!["http:", "https:"].includes(parsedUrl.protocol)) {
            nextErrors.link = "Link phải bắt đầu bằng http hoặc https.";
          }
        } catch {
          nextErrors.link = "Đường link không hợp lệ.";
        }
      }
    }

    setUploadErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleUploadSubmit = (e) => {
    e.preventDefault();
    setUploadSuccess("");

    if (!canUpload || !validateUploadForm()) {
      return;
    }

    const now = new Date();
    const uploadedDocument = {
      id: Date.now(),
      title: uploadForm.title.trim(),
      categoryId: uploadForm.categoryId,
      departmentId: uploadForm.departmentId,
      updatedAt: now.toISOString().slice(0, 10),
      status: "Nháp",
      sourceType: uploadForm.sourceType,
      sourceName:
        uploadForm.sourceType === "file"
          ? uploadForm.file.name
          : uploadForm.link.trim(),
      fileUrl: uploadForm.sourceType === "link" ? uploadForm.link.trim() : "",
      description: uploadForm.description.trim(),
      permissions: createDefaultPermissions(uploadForm.departmentId),
    };

    setDocuments((prev) => [uploadedDocument, ...prev]);
    setSelectedPermissionDocId(String(uploadedDocument.id));
    setUploadForm(emptyUploadForm);
    setUploadErrors({});
    setUploadSuccess("Đã thêm tài liệu vào danh sách tạm thời.");
  };

  const updateDocumentPermission = (documentId, action, scope, optionId) => {
    setDocuments((prev) =>
      prev.map((document) => {
        if (String(document.id) !== String(documentId)) {
          return document;
        }

        const permissions = normalizePermissions(document.permissions, document.departmentId);
        const currentValues = permissions[action][scope];
        const nextValues = currentValues.includes(optionId)
          ? currentValues.filter((value) => value !== optionId)
          : [...currentValues, optionId];

        return {
          ...document,
          permissions: {
            ...permissions,
            [action]: {
              ...permissions[action],
              [scope]: nextValues,
            },
          },
        };
      }),
    );
  };

  const resetDocumentPermissions = (documentId) => {
    setDocuments((prev) =>
      prev.map((document) =>
        String(document.id) === String(documentId)
          ? {
              ...document,
              permissions: createDefaultPermissions(document.departmentId),
            }
          : document,
      ),
    );
  };

  const updateDocumentStatus = (documentId, status) => {
    setDocuments((prev) =>
      prev.map((document) =>
        String(document.id) === String(documentId)
          ? {
              ...document,
              status,
              updatedAt: new Date().toISOString().slice(0, 10),
            }
          : document,
      ),
    );
    setUploadSuccess("Đã cập nhật trạng thái tài liệu.");
  };

  const handlePreviewDocument = async (document) => {
    setSelectedDocument(document);
    setUploadSuccess("");
    setDocumentError("");

    if (!document.isRemote) {
      return;
    }

    setDocumentDetailLoading(true);

    try {
      const detail = await getReadableDocumentDetail(document.id);

      setSelectedDocument(detail);
      setDocuments((prev) =>
        prev.map((item) => (String(item.id) === String(detail.id) ? detail : item)),
      );
    } catch (error) {
      setDocumentError(
        error instanceof Error ? error.message : "Không thể tải chi tiết tài liệu.",
      );
    } finally {
      setDocumentDetailLoading(false);
    }
  };

  const handleDownloadDocument = (document) => {
    const downloadDisabledReason = getDownloadDisabledReason(currentUser, document);

    if (downloadDisabledReason) {
      setUploadSuccess("");
      setDocumentError(downloadDisabledReason);
      return;
    }

    const documentUrl = getDocumentActionUrl(document);

    if (!documentUrl) {
      setUploadSuccess("");
      setDocumentError("Tài liệu chưa có link tải.");
      return;
    }

    window.open(documentUrl, "_blank", "noopener,noreferrer");
    setDocumentError("");
    setUploadSuccess(`Đã mở link tải: ${document.title}`);
  };

  return (
    <div className="container-fluid">
      <div className="app-page-head d-flex flex-wrap gap-3 align-items-center justify-content-between">
        <div className="clearfix">
          <h1 className="app-page-title mb-0">Tài Liệu & Biểu Mẫu</h1>
        </div>
        <span className="badge bg-primary-subtle text-primary">
          {documentLoading ? "Đang tải tài liệu..." : `${documentTotal} tài liệu được phân quyền`}
        </span>
      </div>

      <div className="row g-3">
        {canManageCategories && (
          <div className="col-xxl-4">
            <div className="card">
              <div className="card-header border-0 pb-0">
                <h6 className="card-title mb-0">
                  {editingId ? "Sửa danh mục" : "Tạo danh mục mới"}
                </h6>
              </div>
              <div className="card-body">
                {categoryError && (
                  <div className="alert alert-warning py-2" role="alert">
                    {categoryError}
                  </div>
                )}
                <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
                  <div>
                    <label className="form-label">Tên danh mục</label>
                    <input
                      className="form-control"
                      value={form.name}
                      disabled={categoryActionLoading}
                      onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Ví dụ: Pháp lý"
                    />
                  </div>
                  <div>
                    <label className="form-label">Mô tả</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={form.description}
                      disabled={categoryActionLoading}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, description: e.target.value }))
                      }
                      placeholder="Mô tả ngắn cho danh mục"
                    />
                  </div>
                  <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-primary">
                      {categoryActionLoading
                        ? "Đang lưu..."
                        : editingId
                          ? "Lưu thay đổi"
                          : "Tạo danh mục"}
                    </button>
                    {editingId && (
                      <button
                        type="button"
                        className="btn btn-light"
                        onClick={resetForm}
                        disabled={categoryActionLoading}
                      >
                        Hủy
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        <div className={canManageCategories ? "col-xxl-8" : "col-12"}>
          <div className="card">
            <div className="card-header border-0 pb-0 d-flex justify-content-between align-items-center">
              <h6 className="card-title mb-0">Danh mục tài liệu</h6>
              <span className="badge bg-primary-subtle text-primary">
                {categoryLoading
                  ? "Đang tải..."
                  : `${displayedCategories.length} danh mục`}
              </span>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table align-middle">
                  <thead>
                    <tr>
                      <th>Tên danh mục</th>
                      <th>Mô tả</th>
                      {canManageCategories && (
                        <>
                          <th className="text-nowrap" style={{ width: "120px" }}>
                            Trạng thái
                          </th>
                          <th className="text-center text-nowrap" style={{ width: "96px" }}>
                            Thao tác
                          </th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCategories.map((category) => (
                      <tr key={category.id}>
                        <td>{category.name}</td>
                        <td>{category.description || "-"}</td>
                        {canManageCategories && (
                          <>
                            <td className="text-nowrap">
                              <span
                                className={`badge ${
                                  category.isHidden
                                    ? "bg-danger-subtle text-danger"
                                    : "bg-success-subtle text-success"
                                }`}
                              >
                                {category.isHidden ? "Đang ẩn" : "Hiển thị"}
                              </span>
                            </td>
                            <td>
                              <div className="d-flex justify-content-center align-items-center gap-2 flex-nowrap">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary d-inline-flex align-items-center justify-content-center"
                                style={{ width: "32px", height: "32px", padding: 0 }}
                                onClick={() => startEdit(category)}
                                disabled={categoryActionLoading}
                                title="Sửa danh mục"
                                aria-label="Sửa danh mục"
                              >
                                <EditIcon />
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center justify-content-center"
                                style={{ width: "32px", height: "32px", padding: 0 }}
                                onClick={() => toggleHidden(category.id)}
                                disabled={categoryActionLoading}
                                title={category.isHidden ? "Hiện danh mục" : "Ẩn danh mục"}
                                aria-label={category.isHidden ? "Hiện danh mục" : "Ẩn danh mục"}
                              >
                                {category.isHidden ? <EyeIcon /> : <EyeOffIcon />}
                              </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                    {paginatedCategories.length === 0 && (
                      <tr>
                        <td
                          colSpan={canManageCategories ? 4 : 2}
                          className="text-center text-body-secondary py-4"
                        >
                          Chưa có danh mục tài liệu.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {displayedCategories.length > CATEGORY_PAGE_SIZE && (
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-3">
                  <span className="text-body-secondary" style={{ fontSize: "13px" }}>
                    Hiển thị {(safeCategoryPage - 1) * CATEGORY_PAGE_SIZE + 1}-
                    {Math.min(safeCategoryPage * CATEGORY_PAGE_SIZE, displayedCategories.length)} trong{" "}
                    {displayedCategories.length} danh mục
                  </span>
                  <div className="btn-group" role="group" aria-label="Phân trang danh mục">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => setCategoryPage((page) => Math.max(1, page - 1))}
                      disabled={safeCategoryPage === 1}
                    >
                      Trước
                    </button>
                    {Array.from({ length: categoryPageCount }, (_, index) => index + 1).map(
                      (page) => (
                        <button
                          key={page}
                          type="button"
                          className={`btn btn-sm ${
                            page === safeCategoryPage ? "btn-primary" : "btn-outline-secondary"
                          }`}
                          onClick={() => setCategoryPage(page)}
                        >
                          {page}
                        </button>
                      ),
                    )}
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() =>
                        setCategoryPage((page) => Math.min(categoryPageCount, page + 1))
                      }
                      disabled={safeCategoryPage === categoryPageCount}
                    >
                      Sau
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {canUpload && (
        <div className="card mt-3">
          <div className="card-header border-0 pb-0 d-flex flex-wrap justify-content-between align-items-center gap-2">
            <div>
              <h6 className="card-title mb-1">Upload tài liệu</h6>
            </div>
            <span className="badge bg-success-subtle text-success">Có quyền upload</span>
          </div>
          <div className="card-body">
          {uploadSuccess && (
            <div className="alert alert-success py-2" role="alert">
              {uploadSuccess}
            </div>
          )}

          <form noValidate onSubmit={handleUploadSubmit}>
            <fieldset className="border-0 p-0 m-0">
              <div className="row g-3">
                <div className="col-lg-4">
                  <label className="form-label">
                    Tên tài liệu <span className="text-danger">*</span>
                  </label>
                  <input
                    className={`form-control ${uploadErrors.title ? "is-invalid" : ""}`}
                    value={uploadForm.title}
                    onChange={(e) =>
                      setUploadForm((prev) => ({ ...prev, title: e.target.value }))
                    }
                    placeholder="Ví dụ: Mẫu hợp đồng mới"
                  />
                  {uploadErrors.title && (
                    <div className="invalid-feedback">{uploadErrors.title}</div>
                  )}
                </div>

                <div className="col-lg-4">
                  <label className="form-label">
                    Danh mục <span className="text-danger">*</span>
                  </label>
                  <select
                    className={`form-select ${uploadErrors.categoryId ? "is-invalid" : ""}`}
                    value={uploadForm.categoryId}
                    onChange={(e) =>
                      setUploadForm((prev) => ({ ...prev, categoryId: e.target.value }))
                    }
                  >
                    <option value="">Chọn danh mục</option>
                    {visibleCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {uploadErrors.categoryId && (
                    <div className="invalid-feedback">{uploadErrors.categoryId}</div>
                  )}
                </div>

                <div className="col-lg-4">
                  <label className="form-label">
                    Phòng ban nhận <span className="text-danger">*</span>
                  </label>
                  <select
                    className={`form-select ${uploadErrors.departmentId ? "is-invalid" : ""}`}
                    value={uploadForm.departmentId}
                    onChange={(e) =>
                      setUploadForm((prev) => ({ ...prev, departmentId: e.target.value }))
                    }
                  >
                    <option value="">Chọn phòng ban</option>
                    {initialDepartments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                  {uploadErrors.departmentId && (
                    <div className="invalid-feedback">{uploadErrors.departmentId}</div>
                  )}
                </div>

                <div className="col-lg-3">
                  <label className="form-label">Nguồn tài liệu</label>
                  <div className="btn-group w-100" role="group" aria-label="Chọn nguồn tài liệu">
                    <input
                      type="radio"
                      className="btn-check"
                      name="document-source"
                      id="document-source-file"
                      checked={uploadForm.sourceType === "file"}
                      onChange={() =>
                        setUploadForm((prev) => ({ ...prev, sourceType: "file", link: "" }))
                      }
                    />
                    <label className="btn btn-outline-primary" htmlFor="document-source-file">
                      File
                    </label>
                    <input
                      type="radio"
                      className="btn-check"
                      name="document-source"
                      id="document-source-link"
                      checked={uploadForm.sourceType === "link"}
                      onChange={() =>
                        setUploadForm((prev) => ({ ...prev, sourceType: "link", file: null }))
                      }
                    />
                    <label className="btn btn-outline-primary" htmlFor="document-source-link">
                      Link
                    </label>
                  </div>
                </div>

                <div className="col-lg-5">
                  {uploadForm.sourceType === "file" ? (
                    <>
                      <label className="form-label">
                        File tài liệu <span className="text-danger">*</span>
                      </label>
                      <input
                        type="file"
                        className={`form-control ${uploadErrors.file ? "is-invalid" : ""}`}
                        onChange={(e) =>
                          setUploadForm((prev) => ({
                            ...prev,
                            file: e.target.files?.[0] || null,
                          }))
                        }
                      />
                      {uploadErrors.file && (
                        <div className="invalid-feedback">{uploadErrors.file}</div>
                      )}
                    </>
                  ) : (
                    <>
                      <label className="form-label">
                        Link tài liệu <span className="text-danger">*</span>
                      </label>
                      <input
                        type="url"
                        className={`form-control ${uploadErrors.link ? "is-invalid" : ""}`}
                        value={uploadForm.link}
                        onChange={(e) =>
                          setUploadForm((prev) => ({ ...prev, link: e.target.value }))
                        }
                        placeholder="https://..."
                      />
                      {uploadErrors.link && (
                        <div className="invalid-feedback">{uploadErrors.link}</div>
                      )}
                    </>
                  )}
                </div>

                <div className="col-lg-4">
                  <label className="form-label">Metadata ghi chú</label>
                  <textarea
                    className="form-control"
                    rows="1"
                    value={uploadForm.description}
                    onChange={(e) =>
                      setUploadForm((prev) => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="Phiên bản, phạm vi áp dụng..."
                  />
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2 mt-3">
                <button
                  type="button"
                  className="btn btn-light border"
                  onClick={() => {
                    setUploadForm(emptyUploadForm);
                    setUploadErrors({});
                    setUploadSuccess("");
                  }}
                >
                  Làm mới
                </button>
                <button type="submit" className="btn btn-primary">
                  Thêm tài liệu
                </button>
              </div>
            </fieldset>
          </form>
          </div>
        </div>
      )}

      {canConfigurePermissions && (
        <div className="card mt-3">
          <div className="card-header border-0 pb-0 d-flex flex-wrap justify-content-between align-items-center gap-2">
            <div>
              <h6 className="card-title mb-1">Cấu hình quyền tài liệu</h6>
              
            </div>
            {selectedPermissionDocument && (
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => resetDocumentPermissions(selectedPermissionDocument.id)}
              >
                Đặt quyền mặc định
              </button>
            )}
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-lg-4">
                <label className="form-label">Tài liệu</label>
                <select
                  className="form-select"
                  value={String(selectedPermissionDocument?.id || "")}
                  onChange={(e) => setSelectedPermissionDocId(e.target.value)}
                >
                  {documents.map((document) => (
                    <option key={document.id} value={document.id}>
                      {document.title}
                    </option>
                  ))}
                </select>
                {selectedPermissionDocument && (
                  <DocumentPreview
                    categoryName={
                      categoryMap.get(String(selectedPermissionDocument.categoryId))?.name ||
                      "Danh mục ẩn"
                    }
                    departmentName={
                      departmentMap.get(selectedPermissionDocument.departmentId)?.name || "-"
                    }
                    document={selectedPermissionDocument}
                  />
                )}
              </div>

              <div className="col-lg-8">
                {selectedPermissionDocument ? (
                  <div className="table-responsive">
                    <table className="table table-sm table-borderless align-middle mb-0">
                      <thead>
                        <tr>
                          <th style={{ width: "96px" }}>Quyền</th>
                          <th>Nhóm người dùng</th>
                          <th>Role</th>
                          <th>Phòng ban</th>
                        </tr>
                      </thead>
                      <tbody>
                        {PERMISSION_ACTIONS.map((action) => {
                          const permissions = normalizePermissions(
                            selectedPermissionDocument.permissions,
                            selectedPermissionDocument.departmentId,
                          );
                          const rule = permissions[action.id];

                          return (
                            <tr key={action.id} className="border-0">
                              <td>
                                <span className="badge bg-primary-subtle text-primary">
                                  {action.label}
                                </span>
                              </td>
                              <td>
                                <CheckboxGroup
                                  action={action.id}
                                  documentId={selectedPermissionDocument.id}
                                  options={USER_GROUP_OPTIONS}
                                  scope="groups"
                                  values={rule.groups}
                                  onToggle={updateDocumentPermission}
                                />
                              </td>
                              <td>
                                <CheckboxGroup
                                  action={action.id}
                                  documentId={selectedPermissionDocument.id}
                                  options={ROLE_OPTIONS}
                                  scope="roles"
                                  values={rule.roles}
                                  onToggle={updateDocumentPermission}
                                />
                              </td>
                              <td>
                                <CheckboxGroup
                                  action={action.id}
                                  documentId={selectedPermissionDocument.id}
                                  options={initialDepartments}
                                  scope="departments"
                                  values={rule.departments}
                                  onToggle={updateDocumentPermission}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-body-secondary">Chưa có tài liệu để cấu hình.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {(documentError || selectedDocument) && (
        <div className="card mt-3">
          <div className="card-header border-0 pb-0 d-flex flex-wrap justify-content-between align-items-center gap-2">
            <div>
              <h6 className="card-title mb-1">Chi tiết & preview tài liệu</h6>
            </div>
            {documentDetailLoading && (
              <span className="badge bg-info-subtle text-info">Đang tải metadata...</span>
            )}
          </div>
          <div className="card-body">
            {documentError && (
              <div className="alert alert-warning py-2" role="alert">
                {documentError}
              </div>
            )}
            {selectedDocument && (
              <div className="row g-3">
                <div className="col-lg-4">
                  <DocumentPreview
                    categoryName={
                      selectedDocument.categoryName ||
                      categoryMap.get(String(selectedDocument.categoryId))?.name ||
                      "Danh mục ẩn"
                    }
                    departmentName={
                      departmentMap.get(selectedDocument.departmentId)?.name || "Theo danh mục"
                    }
                    document={selectedDocument}
                  />
                </div>
                <div className="col-lg-8">
                  <div className="d-flex flex-wrap justify-content-between gap-2 mb-3">
                    <div>
                      <h5 className="mb-1 text-body-emphasis">{selectedDocument.title}</h5>
                      <div className="text-body-secondary" style={{ fontSize: "13px" }}>
                        {selectedDocument.sourceName || "-"}
                      </div>
                    </div>
                    <div className="d-flex gap-2 align-items-start">
                      {getDocumentActionUrl(selectedDocument) ? (
                        <a
                          className="btn btn-sm btn-outline-primary"
                          href={getDocumentActionUrl(selectedDocument)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Mở preview/link
                        </a>
                      ) : (
                        <button type="button" className="btn btn-sm btn-outline-secondary" disabled>
                          Chưa có link
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn-sm btn-success"
                        disabled={Boolean(getDownloadDisabledReason(currentUser, selectedDocument))}
                        title={
                          getDownloadDisabledReason(currentUser, selectedDocument) ||
                          "Tải tài liệu"
                        }
                        onClick={() => handleDownloadDocument(selectedDocument)}
                      >
                        Tải xuống
                      </button>
                    </div>
                  </div>

                  <div className="row g-2">
                    <MetadataItem label="ID" value={selectedDocument.id} />
                    <MetadataItem
                      label="Danh mục"
                      value={
                        selectedDocument.categoryName ||
                        categoryMap.get(String(selectedDocument.categoryId))?.name ||
                        "-"
                      }
                    />
                    <MetadataItem label="Loại file" value={selectedDocument.fileType || "-"} />
                    <MetadataItem label="Trạng thái" value={selectedDocument.status} />
                    <MetadataItem
                      label="Quyền download"
                      value={
                        hasDownloadPermission(currentUser, selectedDocument)
                          ? "Được tải"
                          : "Không được tải"
                      }
                    />
                    <MetadataItem
                      label="Trạng thái link tải"
                      value={
                        getDocumentActionUrl(selectedDocument)
                          ? "Có link tải"
                          : hasDownloadPermission(currentUser, selectedDocument)
                            ? "Được cấp quyền, chưa có link tải"
                            : "Không có link tải"
                      }
                    />
                    <MetadataItem
                      label="Lý do chặn tải"
                      value={getDownloadDisabledReason(currentUser, selectedDocument) || "Không bị chặn"}
                    />
                    <MetadataItem
                      label="Nguồn AI"
                      value={selectedDocument.metadata?.isAiTrainingSource ? "Có" : "Không"}
                    />
                    <MetadataItem
                      label="Product ID"
                      value={selectedDocument.metadata?.productId || "-"}
                    />
                    <MetadataItem
                      label="School ID"
                      value={selectedDocument.metadata?.schoolId || "-"}
                    />
                    <MetadataItem
                      label="Người upload"
                      value={selectedDocument.metadata?.uploadedById || "-"}
                    />
                    <MetadataItem
                      label="Ngày tạo"
                      value={formatDateTime(selectedDocument.metadata?.createdAt)}
                    />
                    <MetadataItem
                      label="Cập nhật"
                      value={formatDateTime(selectedDocument.metadata?.updatedAt)}
                    />
                    <MetadataItem
                      label="File URL"
                      value={getDocumentActionUrl(selectedDocument) || "-"}
                      wide
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="card mt-3">
        <div className="card-header border-0 pb-0 d-flex justify-content-between align-items-center">
          <div>
            <h6 className="card-title mb-0">Danh sách tài liệu</h6>
            {documentLoading && (
              <div className="text-body-secondary mt-1" style={{ fontSize: "12px" }}>
                Đang tải danh sách từ API...
              </div>
            )}
          </div>
          <select
            className="form-select w-auto"
            value={activeCategory}
            onChange={(e) => setActiveCategory(e.target.value)}
          >
            <option value="all">Tất cả danh mục</option>
            {visibleCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead>
                <tr>
                  <th>Tài liệu</th>
                  <th>Danh mục</th>
                  <th>Quyền download</th>
                  <th>Nguồn</th>
                  <th>Cập nhật</th>
                  <th>Trạng thái</th>
                  <th className="text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.map((doc) => {
                  const downloadDisabledReason = getDownloadDisabledReason(currentUser, doc);
                  const hasDownloadAccess = hasDownloadPermission(currentUser, doc);
                  const canDownload = hasDownloadAccess && !downloadDisabledReason;
                  const canEdit = canUseDocumentAction(currentUser, doc, "edit");

                  return (
                    <tr
                      key={doc.id}
                      className={
                        selectedDocument && String(selectedDocument.id) === String(doc.id)
                          ? "table-active"
                          : ""
                      }
                    >
                      <td>
                        <div className="fw-semibold text-body-emphasis">{doc.title}</div>
                        {doc.description && (
                          <div className="text-body-secondary" style={{ fontSize: "12px" }}>
                            {doc.description}
                          </div>
                        )}
                      </td>
                      <td>{doc.categoryName || categoryMap.get(String(doc.categoryId))?.name || "Danh mục ẩn"}</td>
                      <td>
                        <span
                          className={`badge ${
                            hasDownloadAccess
                              ? "bg-success-subtle text-success"
                              : "bg-danger-subtle text-danger"
                          }`}
                          title={
                            hasDownloadAccess
                              ? getDocumentActionUrl(doc)
                                ? "Được tải"
                                : "Được cấp quyền tải, nhưng chưa có link tải"
                              : getDownloadPermissionReason(currentUser, doc)
                          }
                        >
                          {hasDownloadAccess ? "Được tải" : "Không tải"}
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-body-secondary text-body">
                          {doc.sourceType === "link" ? "Link" : "File"}
                        </span>
                        <span className="ms-2 text-body-secondary" style={{ fontSize: "12px" }}>
                          {doc.sourceName || "-"}
                        </span>
                      </td>
                      <td>{doc.updatedAt}</td>
                      <td>
                        {canEdit ? (
                          <select
                            className="form-select form-select-sm"
                            value={doc.status}
                            onChange={(e) => updateDocumentStatus(doc.id, e.target.value)}
                            aria-label={`Cập nhật trạng thái ${doc.title}`}
                          >
                            {DOCUMENT_STATUS_OPTIONS.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className={`badge ${getStatusBadgeClass(doc.status)}`}>
                            {doc.status}
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="d-flex justify-content-center gap-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary d-inline-flex align-items-center justify-content-center"
                            style={{ width: "32px", height: "32px", padding: 0 }}
                            title="Xem tài liệu"
                            aria-label="Xem tài liệu"
                            onClick={() => handlePreviewDocument(doc)}
                          >
                            <EyeIcon />
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-success d-inline-flex align-items-center justify-content-center"
                            style={{ width: "32px", height: "32px", padding: 0 }}
                            disabled={!canDownload}
                            title={
                              canDownload
                                ? "Tải tài liệu"
                                : downloadDisabledReason ||
                                  "Bạn chưa có quyền tải"
                            }
                            aria-label="Tải tài liệu"
                            onClick={() => handleDownloadDocument(doc)}
                          >
                            <DownloadIcon />
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center justify-content-center"
                            style={{ width: "32px", height: "32px", padding: 0 }}
                            disabled={!canEdit}
                            title={canEdit ? "Sửa tài liệu" : "Bạn chưa có quyền sửa"}
                            aria-label="Sửa tài liệu"
                            onClick={() => setSelectedPermissionDocId(String(doc.id))}
                          >
                            <EditIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredDocuments.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center text-body">
                      Không có tài liệu trong bộ lọc này.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

function CheckboxGroup({ action, documentId, onToggle, options, scope, values }) {
  return (
    <div
      className="d-flex flex-wrap gap-2 rounded border bg-body-tertiary p-2"
      style={{ minHeight: "46px" }}
    >
      {options.map((option) => (
        <label
          key={option.id}
          className="d-inline-flex align-items-center gap-1 rounded border bg-body px-2 py-1"
          style={{ fontSize: "12px" }}
        >
          <input
            type="checkbox"
            className="form-check-input m-0"
            checked={values.includes(option.id)}
            onChange={() => onToggle(documentId, action, scope, option.id)}
          />
          <span>{option.label || option.name}</span>
        </label>
      ))}
    </div>
  );
}

function MetadataItem({ label, value, wide = false }) {
  return (
    <div className={wide ? "col-12" : "col-md-6 col-xl-4"}>
      <div className="rounded border bg-body-tertiary p-2 h-100">
        <div className="text-body-secondary text-uppercase" style={{ fontSize: "10px" }}>
          {label}
        </div>
        <div
          className="fw-medium text-body-emphasis text-break"
          style={{ fontSize: "13px", lineHeight: 1.35 }}
        >
          {value || "-"}
        </div>
      </div>
    </div>
  );
}

function DocumentPreview({ categoryName, departmentName, document }) {
  const extension = document.sourceName?.split(".").pop()?.toUpperCase() || "DOC";
  const isLink = document.sourceType === "link";

  return (
    <div className="rounded border bg-body-tertiary p-2">
      <div className="rounded border bg-body overflow-hidden">
        <div
          className="d-flex align-items-center justify-content-center bg-primary-subtle text-primary"
          style={{ aspectRatio: "4 / 3", minHeight: "260px" }}
        >
          {document.previewImage ? (
            <img
              src={document.previewImage}
              alt={document.title}
              className="h-100 w-100"
              style={{ objectFit: "cover" }}
            />
          ) : (
            <div className="text-center px-3">
              <div
                className="mx-auto mb-2 d-flex align-items-center justify-content-center rounded bg-primary text-white fw-bold"
                style={{ width: "68px", height: "86px", fontSize: "15px" }}
              >
                {isLink ? "LINK" : extension.slice(0, 4)}
              </div>
              <div className="fw-semibold text-body-emphasis text-truncate">
                {document.title}
              </div>
            </div>
          )}
        </div>
        <div className="p-2">
          <div className="fw-semibold text-body-emphasis text-truncate">{document.title}</div>
          <div className="text-body-secondary text-truncate" style={{ fontSize: "12px" }}>
            {document.sourceName || "-"}
          </div>
          <div className="d-flex flex-wrap gap-2 mt-2">
            <span className="badge bg-body-secondary text-body">{categoryName}</span>
            <span className="badge bg-body-secondary text-body">{departmentName}</span>
            <span className="badge bg-body-secondary text-body">{document.updatedAt}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"></path>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"></path>
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"></path>
      <line x1="1" y1="1" x2="23" y2="23"></line>
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="7 10 12 15 17 10"></polyline>
      <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
  );
}

