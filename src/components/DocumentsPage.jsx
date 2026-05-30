import { useEffect, useMemo, useRef, useState } from "react";

// const API_BASE_URL =
//   import.meta.env.VITE_API_BASE_URL ||
//   (import.meta.env.PROD ? "/api/v1" : "http://qlnb-api.hto.edu.vn/api/v1");
const API_BASE_URL = "http://localhost:3000/api/v1";

const ADMIN_ROLE_ID = "69fc5af582ef85451120772a";
const DEPARTMENT_HEAD_ROLE_ID = "69fc5af582ef85451120772c";
const DOCUMENT_PERMISSIONS_STORAGE_KEY = "hto_document_permissions";
const DOCUMENT_STATUS_STORAGE_KEY = "hto_document_statuses";
const DOCUMENT_PREVIEWS_STORAGE_KEY = "hto_document_previews";

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

const emptyDocumentEditForm = {
  title: "",
  categoryId: "",
  departmentId: "",
  fileUrl: "",
  fileType: "",
  status: "Đang dùng",
  description: "",
};

const createDocumentEditForm = (document = {}) => ({
  title: document.title || "",
  categoryId: document.categoryId || "",
  departmentId: document.departmentId || "",
  fileUrl: getDocumentActionUrl(document),
  fileType: document.fileType || document.metadata?.fileType || "",
  status: document.status || "Đang dùng",
  description: document.description || "",
});

const buildUploadPreviewDocument = async (uploadForm, categories = []) => {
  const now = new Date();
  const sourceName =
    uploadForm.sourceType === "file" ? uploadForm.file?.name || "" : uploadForm.link.trim();
  const previewUrl =
    uploadForm.sourceType === "file" && uploadForm.file
      ? URL.createObjectURL(uploadForm.file)
      : uploadForm.link.trim();
  const fileType =
    uploadForm.sourceType === "file"
      ? uploadForm.file?.name.split(".").pop()?.toLowerCase() || ""
      : getFileNameFromUrl(uploadForm.link).split(".").pop()?.toLowerCase() || "link";
  const category = categories.find(
    (item) => String(item.id) === String(uploadForm.categoryId),
  );
  const mimeType = uploadForm.file?.type || "";
  const canCacheImage =
    uploadForm.sourceType === "file" &&
    uploadForm.file &&
    isImagePreview({ fileType, mimeType, sourceName });
  const previewDataUrl = canCacheImage ? await readFileAsDataUrl(uploadForm.file) : "";
  const previewText =
    uploadForm.sourceType === "file" &&
    uploadForm.file &&
    isTextPreview({ fileType, mimeType, sourceName })
      ? await uploadForm.file.text()
      : "";

  return {
    id: `preview-${Date.now()}`,
    title: uploadForm.title.trim(),
    categoryId: uploadForm.categoryId,
    categoryName: category?.name || "Danh mục chưa đặt tên",
    departmentId: uploadForm.departmentId,
    updatedAt: formatDate(now.toISOString()),
    createdAt: formatDate(now.toISOString()),
    status: "Nháp",
    sourceType: uploadForm.sourceType,
    sourceName,
    fileType,
    fileUrl: uploadForm.sourceType === "link" ? uploadForm.link.trim() : "",
    previewUrl: previewDataUrl || previewUrl,
    previewDataUrl,
    previewText,
    mimeType,
    description: uploadForm.description.trim(),
    permissions: createDefaultPermissions(uploadForm.departmentId),
    metadata: {
      fileType: fileType || "-",
      productId: "-",
      schoolId: "-",
      uploadedById: "-",
      isAiTrainingSource: false,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      rawStatus: "draft",
    },
    canDownload: uploadForm.sourceType === "link",
    canView: true,
    isRemote: false,
    isUploadPreview: true,
  };
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

const getDepartmentIdFromPermissions = (permissions) =>
  permissions?.view?.departments?.[0] || permissions?.download?.departments?.[0] || "";

const setPermissionsDepartment = (permissions, departmentId) => {
  const normalizedPermissions = normalizePermissions(permissions, departmentId);

  return {
    ...normalizedPermissions,
    view: {
      ...normalizedPermissions.view,
      departments: departmentId ? [departmentId] : [],
    },
    download: {
      ...normalizedPermissions.download,
      departments: departmentId ? [departmentId] : [],
    },
  };
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

const readStoredPreviews = () => {
  try {
    return JSON.parse(window.localStorage.getItem(DOCUMENT_PREVIEWS_STORAGE_KEY) || "{}");
  } catch {
    window.localStorage.removeItem(DOCUMENT_PREVIEWS_STORAGE_KEY);
    return {};
  }
};

const writeStoredPreviews = (previewsByDocumentId) => {
  try {
    window.localStorage.setItem(
      DOCUMENT_PREVIEWS_STORAGE_KEY,
      JSON.stringify(previewsByDocumentId),
    );
  } catch {
    // Preview cache is best-effort because browser storage can be small.
  }
};

const cacheDocumentPreview = (documentId, previewDocument) => {
  if (!documentId || (!previewDocument.previewDataUrl && !previewDocument.previewText)) {
    return;
  }

  const previewsByDocumentId = readStoredPreviews();

  previewsByDocumentId[documentId] = {
    previewDataUrl: previewDocument.previewDataUrl || "",
    previewText: previewDocument.previewText || "",
    mimeType: previewDocument.mimeType || "",
    fileType: previewDocument.fileType || "",
    sourceName: previewDocument.sourceName || "",
  };

  writeStoredPreviews(previewsByDocumentId);
};

const removeStoredDocumentData = (documentId) => {
  const removeKeyFromStorageObject = (storageKey) => {
    try {
      const values = JSON.parse(window.localStorage.getItem(storageKey) || "{}");
      delete values[documentId];
      window.localStorage.setItem(storageKey, JSON.stringify(values));
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  };

  removeKeyFromStorageObject(DOCUMENT_PERMISSIONS_STORAGE_KEY);
  removeKeyFromStorageObject(DOCUMENT_STATUS_STORAGE_KEY);
  removeKeyFromStorageObject(DOCUMENT_PREVIEWS_STORAGE_KEY);
};

const applyStoredPreview = (document) => {
  const preview = readStoredPreviews()[document.id];

  if (!preview) {
    return document;
  }

  return {
    ...document,
    previewUrl: preview.previewDataUrl || document.previewUrl,
    previewDataUrl: preview.previewDataUrl || document.previewDataUrl,
    previewText: preview.previewText || document.previewText,
    mimeType: preview.mimeType || document.mimeType,
    fileType: document.fileType || preview.fileType,
    sourceName: document.sourceName || preview.sourceName,
  };
};

const readFileAsDataUrl = (file) =>
  new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });

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
  const cleanUrl = String(url || "").trim();

  if (!cleanUrl) return "";

  if (/^(https?:|blob:)/i.test(cleanUrl)) {
    return cleanUrl;
  }

  if (!cleanUrl.startsWith("/") && !cleanUrl.includes("/")) {
    return "";
  }

  const apiOrigin = API_BASE_URL.replace(/\/api\/v\d+\/?$/, "");

  return `${apiOrigin}${cleanUrl.startsWith("/") ? "" : "/"}${cleanUrl}`;
};

const isImagePreview = (document) => {
  const value = `${document.mimeType || ""} ${document.fileType || ""} ${document.sourceName || ""}`;

  return /image\/|\.?(png|jpe?g|gif|webp|bmp|svg)$/i.test(value);
};

const isPdfPreview = (document) => {
  const value = `${document.mimeType || ""} ${document.fileType || ""} ${document.sourceName || ""}`;

  return /application\/pdf|\.?pdf$/i.test(value);
};

const isTextPreview = (document) => {
  const value = `${document.mimeType || ""} ${document.fileType || ""} ${document.sourceName || ""}`;

  return /text\/|\.?(txt|csv|json|md|log)$/i.test(value);
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
    getDepartmentIdFromPermissions(storedPermissions[id] || document.permissions) ||
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

  return applyStoredPreview({
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
  });
};

const applyStoredPermissions = (documents) => {
  const storedPermissions = readStoredPermissions();
  const storedStatuses = readStoredStatuses();

  return documents.map((document) =>
    applyStoredPreview({
      ...document,
      status: storedStatuses[document.id] || document.status,
      permissions: normalizePermissions(
        storedPermissions[document.id] || document.permissions,
        document.departmentId,
      ),
    }),
  );
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

const createReadableDocument = async (input) => {
  const payload = await requestReadableDocuments("", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return normalizeDocument(payload);
};

const updateReadableDocument = async (documentId, input) => {
  const payload = await requestReadableDocuments(`/${documentId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });

  return normalizeDocument(payload);
};

const deleteReadableDocument = async (documentId) => {
  await requestReadableDocuments(`/${documentId}`, {
    method: "DELETE",
  });
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
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
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
  const [uploadPreview, setUploadPreview] = useState(null);
  const [uploadSubmitting, setUploadSubmitting] = useState(false);
  const [editingDocumentId, setEditingDocumentId] = useState("");
  const [documentEditForm, setDocumentEditForm] = useState(emptyDocumentEditForm);
  const [documentEditErrors, setDocumentEditErrors] = useState({});
  const [documentEditSubmitting, setDocumentEditSubmitting] = useState(false);
  const [deleteTargetDocument, setDeleteTargetDocument] = useState(null);
  const [deleteConfirmValue, setDeleteConfirmValue] = useState("");
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const permissionConfigRef = useRef(null);

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

  const importUploadDocument = async (previewDocument) => {
    if (!canUpload || !previewDocument || uploadSubmitting) {
      return;
    }

    setUploadSubmitting(true);
    setDocumentError("");
    setUploadSuccess("");

    try {
      const createdDocument = await createReadableDocument({
        title: previewDocument.title,
        categoryId: previewDocument.categoryId,
        departmentId: previewDocument.departmentId,
        fileUrl: previewDocument.fileUrl,
        fileType: previewDocument.fileType,
        status: "draft",
        permissions: previewDocument.permissions,
      });
      const importedDocument = {
        ...createdDocument,
        departmentId: previewDocument.departmentId,
        permissions: previewDocument.permissions,
        sourceType: previewDocument.sourceType,
        sourceName: previewDocument.sourceName,
        description: previewDocument.description,
        previewText: previewDocument.previewText,
        previewUrl: previewDocument.previewUrl,
        previewDataUrl: previewDocument.previewDataUrl,
        mimeType: previewDocument.mimeType,
        canDownload: previewDocument.sourceType === "link",
      };

      cacheDocumentPreview(importedDocument.id, previewDocument);
      setDocuments((prev) => [importedDocument, ...prev]);
      setSelectedPermissionDocId(String(importedDocument.id));
      setSelectedDocument(importedDocument);
      setUploadPreview(null);
      setUploadForm(emptyUploadForm);
      setUploadErrors({});
      setDocumentTotal((total) => total + 1);
      setUploadSuccess("Đã import tài liệu vào hệ thống.");
    } catch (error) {
      setDocumentError(error instanceof Error ? error.message : "Không thể import tài liệu.");
    } finally {
      setUploadSubmitting(false);
    }
  };

  const prepareUploadPreview = async () => {
    setUploadSuccess("");

    if (!canUpload || !validateUploadForm()) {
      return null;
    }

    const previewDocument = await buildUploadPreviewDocument(uploadForm, categories);

    setUploadPreview(previewDocument);
    setSelectedDocument(previewDocument);
    setUploadErrors({});
    setDocumentError("");

    return previewDocument;
  };

  const handleUploadPreview = (e) => {
    e.preventDefault();

    void (async () => {
      if (await prepareUploadPreview()) {
        setIsDetailPanelOpen(true);
      }
    })();
  };

  const handleDirectUploadImport = async () => {
    const previewDocument = await prepareUploadPreview();

    if (previewDocument) {
      await importUploadDocument(previewDocument);
    }
  };

  const confirmUploadImport = async () => {
    await importUploadDocument(uploadPreview);
  };

  const applyDocumentUpdate = (updatedDocument) => {
    setDocuments((prev) =>
      prev.map((document) =>
        String(document.id) === String(updatedDocument.id) ? updatedDocument : document,
      ),
    );
    setSelectedDocument((currentDocument) =>
      currentDocument && String(currentDocument.id) === String(updatedDocument.id)
        ? updatedDocument
        : currentDocument,
    );
    setSelectedPermissionDocId(String(updatedDocument.id));
  };

  const persistDocumentUpdate = async (document, updateData, successMessage) => {
    const optimisticDocument = {
      ...document,
      ...updateData,
      updatedAt: formatDate(new Date().toISOString()),
      permissions: updateData.permissions || document.permissions,
    };

    applyDocumentUpdate(optimisticDocument);
    setDocumentError("");
    setUploadSuccess("");

    if (!document.isRemote) {
      setUploadSuccess(successMessage);
      return optimisticDocument;
    }

    try {
      const updatedDocument = await updateReadableDocument(document.id, updateData);
      const mergedDocument = {
        ...updatedDocument,
        departmentId:
          updateData.departmentId ??
          document.departmentId ??
          getDepartmentIdFromPermissions(updateData.permissions || document.permissions),
        permissions: updateData.permissions || updatedDocument.permissions || document.permissions,
        sourceType: updateData.fileUrl ? "link" : document.sourceType,
        sourceName:
          updateData.fileUrl !== undefined
            ? getFileNameFromUrl(updateData.fileUrl) || updateData.title || document.title
            : document.sourceName,
        description: updateData.description ?? document.description,
        previewUrl: document.previewUrl,
        previewDataUrl: document.previewDataUrl,
        previewText: document.previewText,
        mimeType: document.mimeType,
      };

      applyDocumentUpdate(mergedDocument);
      setUploadSuccess(successMessage);
      return mergedDocument;
    } catch (error) {
      setDocumentError(error instanceof Error ? error.message : "Không thể cập nhật tài liệu.");
      return optimisticDocument;
    }
  };

  const updateDocumentPermission = async (documentId, action, scope, optionId) => {
    const document = documents.find((item) => String(item.id) === String(documentId));

    if (!document) return;

    const permissions = normalizePermissions(document.permissions, document.departmentId);
    const currentValues = permissions[action][scope];
    const nextValues = currentValues.includes(optionId)
      ? currentValues.filter((value) => value !== optionId)
      : [...currentValues, optionId];
    const nextPermissions = {
      ...permissions,
      [action]: {
        ...permissions[action],
        [scope]: nextValues,
      },
    };

    await persistDocumentUpdate(
      document,
      { permissions: nextPermissions },
      "Đã cập nhật quyền tài liệu.",
    );
  };

  const resetDocumentPermissions = async (documentId) => {
    const document = documents.find((item) => String(item.id) === String(documentId));

    if (!document) return;

    await persistDocumentUpdate(
      document,
      { permissions: createDefaultPermissions(document.departmentId) },
      "Đã đặt lại quyền mặc định.",
    );
  };

  const updateDocumentStatus = async (documentId, status) => {
    const document = documents.find((item) => String(item.id) === String(documentId));

    if (!document) return;

    await persistDocumentUpdate(document, { status }, "Đã cập nhật trạng thái tài liệu.");
  };

  const validateDocumentEditForm = () => {
    const nextErrors = {};

    if (!documentEditForm.title.trim()) {
      nextErrors.title = "Vui lòng nhập tên tài liệu.";
    }

    if (!documentEditForm.categoryId) {
      nextErrors.categoryId = "Vui lòng chọn danh mục.";
    }

    if (documentEditForm.fileUrl.trim()) {
      try {
        const parsedUrl = new URL(documentEditForm.fileUrl.trim());

        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
          nextErrors.fileUrl = "Link file phải bắt đầu bằng http hoặc https.";
        }
      } catch {
        nextErrors.fileUrl = "Link file không hợp lệ.";
      }
    }

    setDocumentEditErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const saveDocumentDetail = async () => {
    if (!selectedDocument || documentEditSubmitting || !validateDocumentEditForm()) {
      return;
    }

    setDocumentEditSubmitting(true);

    try {
      const updatedDocument = await persistDocumentUpdate(
        selectedDocument,
        {
          title: documentEditForm.title.trim(),
          categoryId: documentEditForm.categoryId,
          departmentId: documentEditForm.departmentId,
          fileUrl: documentEditForm.fileUrl.trim(),
          fileType: documentEditForm.fileType.trim(),
          status: documentEditForm.status,
          description: documentEditForm.description.trim(),
          permissions: setPermissionsDepartment(
            selectedDocument.permissions,
            documentEditForm.departmentId,
          ),
        },
        "Đã cập nhật chi tiết tài liệu.",
      );

      setDocumentEditForm(createDocumentEditForm(updatedDocument));
      setEditingDocumentId("");
      setDocumentEditErrors({});
    } finally {
      setDocumentEditSubmitting(false);
    }
  };

  const handlePreviewDocument = async (document) => {
    setSelectedDocument(document);
    setIsDetailPanelOpen(true);
    setUploadSuccess("");
    setDocumentError("");
    setEditingDocumentId("");

    if (!document.isRemote) {
      return;
    }

    setDocumentDetailLoading(true);

    try {
      const detail = await getReadableDocumentDetail(document.id);
      const existingDocument =
        documents.find((item) => String(item.id) === String(document.id)) || document;
      const mergedDetail = {
        ...detail,
        sourceType: existingDocument.sourceType || detail.sourceType,
        sourceName: existingDocument.sourceName || detail.sourceName,
        description: existingDocument.description ?? detail.description,
        previewUrl: existingDocument.previewUrl || detail.previewUrl,
        previewDataUrl: existingDocument.previewDataUrl || detail.previewDataUrl,
        previewText: existingDocument.previewText || detail.previewText,
        mimeType: existingDocument.mimeType || detail.mimeType,
      };

      setSelectedDocument(mergedDetail);
      setDocuments((prev) =>
        prev.map((item) => (String(item.id) === String(mergedDetail.id) ? mergedDetail : item)),
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
      setSelectedDocument(document);
      setIsDetailPanelOpen(true);
      setUploadSuccess("");
      setDocumentError(downloadDisabledReason);
      return;
    }

    const documentUrl = getDocumentActionUrl(document);

    if (!documentUrl) {
      setSelectedDocument(document);
      setIsDetailPanelOpen(true);
      setUploadSuccess("");
      setDocumentError("Tài liệu chưa có link tải.");
      return;
    }

    window.open(documentUrl, "_blank", "noopener,noreferrer");
    setDocumentError("");
    setUploadSuccess(`Đã mở link tải: ${document.title}`);
  };

  const handleEditDocument = (document) => {
    setSelectedPermissionDocId(String(document.id));
    setSelectedDocument(document);
    setDocumentEditForm(createDocumentEditForm(document));
    setDocumentEditErrors({});
    setEditingDocumentId(String(document.id));
    setIsDetailPanelOpen(true);
    setDocumentError("");
    setUploadSuccess(`Đang sửa chi tiết tài liệu: ${document.title}`);
  };

  const openDeleteDocumentDialog = (document) => {
    setDeleteTargetDocument(document);
    setDeleteConfirmValue("");
    setDocumentError("");
  };

  const closeDeleteDocumentDialog = () => {
    if (deleteSubmitting) return;

    setDeleteTargetDocument(null);
    setDeleteConfirmValue("");
  };

  const getDeleteConfirmName = (document) => document?.title || "";

  const confirmDeleteDocument = async () => {
    if (!deleteTargetDocument || deleteSubmitting) return;

    const expectedName = getDeleteConfirmName(deleteTargetDocument);

    if (deleteConfirmValue.trim() !== expectedName) {
      setDocumentError(`Vui lòng nhập đúng tên file: ${expectedName}`);
      return;
    }

    setDeleteSubmitting(true);
    setDocumentError("");
    setUploadSuccess("");

    try {
      if (deleteTargetDocument.isRemote) {
        await deleteReadableDocument(deleteTargetDocument.id);
      }

      setDocuments((prev) =>
        prev.filter((document) => String(document.id) !== String(deleteTargetDocument.id)),
      );
      setDocumentTotal((total) => Math.max(0, total - 1));
      setSelectedPermissionDocId((currentId) =>
        String(currentId) === String(deleteTargetDocument.id) ? "" : currentId,
      );
      setSelectedDocument((currentDocument) =>
        currentDocument && String(currentDocument.id) === String(deleteTargetDocument.id)
          ? null
          : currentDocument,
      );
      if (selectedDocument && String(selectedDocument.id) === String(deleteTargetDocument.id)) {
        setIsDetailPanelOpen(false);
        setEditingDocumentId("");
      }
      removeStoredDocumentData(deleteTargetDocument.id);
      setUploadSuccess(`Đã xóa tài liệu: ${deleteTargetDocument.title}`);
      setDeleteTargetDocument(null);
      setDeleteConfirmValue("");
    } catch (error) {
      setDocumentError(error instanceof Error ? error.message : "Không thể xóa tài liệu.");
    } finally {
      setDeleteSubmitting(false);
    }
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
              <div>
                <div className="d-none d-md-block table-responsive">
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
                          <td className="fw-semibold text-body-emphasis">{category.name}</td>
                          <td className="text-break">{category.description || "-"}</td>
                          {canManageCategories && (
                            <>
                              <td className="text-nowrap">
                                <CategoryStatusBadge isHidden={category.isHidden} />
                              </td>
                              <td>
                                <CategoryActionButtons
                                  category={category}
                                  disabled={categoryActionLoading}
                                  onEdit={startEdit}
                                  onToggleHidden={toggleHidden}
                                />
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
                <div className="d-md-none d-flex flex-column gap-2">
                  {paginatedCategories.map((category) => (
                    <div key={category.id} className="rounded border bg-body p-2">
                      <div className="d-flex align-items-start justify-content-between gap-2">
                        <div className="min-w-0">
                          <div className="fw-semibold text-body-emphasis text-break">
                            {category.name}
                          </div>
                          <div className="text-body-secondary text-break" style={{ fontSize: "13px" }}>
                            {category.description || "-"}
                          </div>
                        </div>
                        {canManageCategories && <CategoryStatusBadge isHidden={category.isHidden} />}
                      </div>
                      {canManageCategories && (
                        <div className="d-flex justify-content-end mt-2">
                          <CategoryActionButtons
                            category={category}
                            disabled={categoryActionLoading}
                            onEdit={startEdit}
                            onToggleHidden={toggleHidden}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                  {paginatedCategories.length === 0 && (
                    <div className="rounded border bg-body-tertiary p-3 text-center text-body-secondary">
                      Chưa có danh mục tài liệu.
                    </div>
                  )}
                </div>
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
          {uploadPreview && (
            <div className="alert alert-info py-2 d-flex flex-wrap justify-content-between align-items-center gap-2" role="alert">
              <span>
                Đã tạo preview cho "{uploadPreview.title}". Kiểm tra nội dung rồi xác nhận import.
              </span>
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center justify-content-center"
                  style={{ width: "32px", height: "32px", padding: 0 }}
                  title="Xem preview"
                  aria-label="Xem preview"
                  onClick={() => {
                    setSelectedDocument(uploadPreview);
                    setIsDetailPanelOpen(true);
                  }}
                >
                  <EyeIcon />
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-primary d-inline-flex align-items-center justify-content-center"
                  style={{ width: "32px", height: "32px", padding: 0 }}
                  disabled={uploadSubmitting}
                  title={uploadSubmitting ? "Đang import" : "Xác nhận import"}
                  aria-label={uploadSubmitting ? "Đang import" : "Xác nhận import"}
                  onClick={confirmUploadImport}
                >
                  <ImportIcon />
                </button>
              </div>
            </div>
          )}

          <form noValidate onSubmit={handleUploadPreview}>
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
                  className="btn btn-light border d-inline-flex align-items-center justify-content-center"
                  style={{ width: "38px", height: "38px", padding: 0 }}
                  title="Làm mới"
                  aria-label="Làm mới"
                  onClick={() => {
                    setUploadForm(emptyUploadForm);
                    setUploadErrors({});
                    setUploadSuccess("");
                    setUploadPreview(null);
                  }}
                >
                  <RefreshIcon />
                </button>
                <button
                  type="submit"
                  className="btn btn-outline-primary d-inline-flex align-items-center justify-content-center"
                  style={{ width: "38px", height: "38px", padding: 0 }}
                  disabled={uploadSubmitting}
                  title="Xem preview"
                  aria-label="Xem preview"
                >
                  <EyeIcon />
                </button>
                <button
                  type="button"
                  className="btn btn-primary d-inline-flex align-items-center justify-content-center"
                  style={{ width: "38px", height: "38px", padding: 0 }}
                  disabled={uploadSubmitting}
                  title={uploadSubmitting ? "Đang import" : "Import tài liệu"}
                  aria-label={uploadSubmitting ? "Đang import" : "Import tài liệu"}
                  onClick={handleDirectUploadImport}
                >
                  <ImportIcon />
                </button>
              </div>
            </fieldset>
          </form>
          </div>
        </div>
      )}

      {canConfigurePermissions && (
        <div className="card mt-3" ref={permissionConfigRef}>
          <div className="card-header border-0 pb-0 d-flex flex-wrap justify-content-between align-items-center gap-2">
            <div>
              <h6 className="card-title mb-1">Cấu hình quyền tài liệu</h6>
              
            </div>
            {selectedPermissionDocument && (
              <div className="d-flex flex-wrap align-items-center gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary"
                  disabled={documentDetailLoading}
                  onClick={() => handlePreviewDocument(selectedPermissionDocument)}
                >
                  Chi tiết & preview tài liệu
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => resetDocumentPermissions(selectedPermissionDocument.id)}
                >
                  Đặt quyền mặc định
                </button>
              </div>
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
                  <div>
                    <div className="d-none d-xl-block table-responsive">
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
                                    layout="wrap"
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
                                    layout="wrap"
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
                                    layout="wrap"
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
                    <div className="d-xl-none d-flex flex-column gap-2">
                      {PERMISSION_ACTIONS.map((action) => {
                        const permissions = normalizePermissions(
                          selectedPermissionDocument.permissions,
                          selectedPermissionDocument.departmentId,
                        );
                        const rule = permissions[action.id];

                        return (
                          <PermissionActionDropdown
                            key={action.id}
                            actionLabel={action.label}
                            rule={rule}
                          >
                            <PermissionMobileGroup label="Nhóm người dùng">
                              <CheckboxGroup
                                action={action.id}
                                documentId={selectedPermissionDocument.id}
                                layout="stack"
                                options={USER_GROUP_OPTIONS}
                                scope="groups"
                                values={rule.groups}
                                onToggle={updateDocumentPermission}
                              />
                            </PermissionMobileGroup>
                            <PermissionMobileGroup label="Role">
                              <CheckboxGroup
                                action={action.id}
                                documentId={selectedPermissionDocument.id}
                                layout="stack"
                                options={ROLE_OPTIONS}
                                scope="roles"
                                values={rule.roles}
                                onToggle={updateDocumentPermission}
                              />
                            </PermissionMobileGroup>
                            <PermissionMobileGroup label="Phòng ban">
                              <CheckboxGroup
                                action={action.id}
                                documentId={selectedPermissionDocument.id}
                                layout="stack"
                                options={initialDepartments}
                                scope="departments"
                                values={rule.departments}
                                onToggle={updateDocumentPermission}
                              />
                            </PermissionMobileGroup>
                          </PermissionActionDropdown>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-body-secondary">Chưa có tài liệu để cấu hình.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {isDetailPanelOpen && (documentError || selectedDocument) && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100"
          style={{
            backgroundColor: "rgba(15, 23, 42, 0.45)",
            zIndex: 1080,
          }}
        >
          <div className="container-fluid h-100 py-4">
            <div
              className="card shadow-lg border-0 mx-auto h-100"
              style={{
                maxWidth: "1120px",
                maxHeight: "calc(100vh - 48px)",
              }}
            >
              <div className="card-header bg-white border-0 d-flex flex-wrap justify-content-between align-items-center gap-2">
                <div>
                  <h6 className="card-title mb-1">Chi tiết & preview tài liệu</h6>
                </div>
                <div className="d-flex flex-wrap align-items-center gap-2">
                  {documentDetailLoading && (
                    <span className="badge bg-info-subtle text-info">Đang tải metadata...</span>
                  )}
                  <button
                    type="button"
                    className="btn btn-sm btn-light border"
                    onClick={() => {
                      setIsDetailPanelOpen(false);
                      setEditingDocumentId("");
                      setDocumentEditErrors({});
                    }}
                  >
                    Đóng
                  </button>
                </div>
              </div>
              <div className="card-body overflow-auto">
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
                      {!selectedDocument.isUploadPreview &&
                        canUseDocumentAction(currentUser, selectedDocument, "edit") && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center justify-content-center"
                            style={{ width: "32px", height: "32px", padding: 0 }}
                            title="Sửa chi tiết tài liệu"
                            aria-label="Sửa chi tiết tài liệu"
                            onClick={() => handleEditDocument(selectedDocument)}
                          >
                            <EditIcon />
                          </button>
                        )}
                      {!selectedDocument.isUploadPreview &&
                        canUseDocumentAction(currentUser, selectedDocument, "edit") && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger d-inline-flex align-items-center justify-content-center"
                            style={{ width: "32px", height: "32px", padding: 0 }}
                            title="Xóa tài liệu"
                            aria-label="Xóa tài liệu"
                            onClick={() => openDeleteDocumentDialog(selectedDocument)}
                          >
                            <TrashIcon />
                          </button>
                        )}
                      {selectedDocument.isUploadPreview && (
                        <button
                          type="button"
                          className="btn btn-sm btn-primary d-inline-flex align-items-center justify-content-center"
                          style={{ width: "32px", height: "32px", padding: 0 }}
                          disabled={uploadSubmitting}
                          title={uploadSubmitting ? "Đang import" : "Xác nhận import"}
                          aria-label={uploadSubmitting ? "Đang import" : "Xác nhận import"}
                          onClick={confirmUploadImport}
                        >
                          <ImportIcon />
                        </button>
                      )}
                      {getDocumentActionUrl(selectedDocument) ? (
                        <a
                          className="btn btn-sm btn-outline-primary d-inline-flex align-items-center justify-content-center"
                          style={{ width: "32px", height: "32px", padding: 0 }}
                          href={getDocumentActionUrl(selectedDocument)}
                          target="_blank"
                          rel="noreferrer"
                          title="Mở preview/link"
                          aria-label="Mở preview/link"
                        >
                          <ExternalLinkIcon />
                        </a>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center justify-content-center"
                          style={{ width: "32px", height: "32px", padding: 0 }}
                          disabled
                          title="Chưa có link"
                          aria-label="Chưa có link"
                        >
                          <ExternalLinkIcon />
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn-sm btn-success d-inline-flex align-items-center justify-content-center"
                        style={{ width: "32px", height: "32px", padding: 0 }}
                        disabled={Boolean(getDownloadDisabledReason(currentUser, selectedDocument))}
                        title={
                          getDownloadDisabledReason(currentUser, selectedDocument) ||
                          "Tải tài liệu"
                        }
                        aria-label="Tải tài liệu"
                        onClick={() => handleDownloadDocument(selectedDocument)}
                      >
                        <DownloadIcon />
                      </button>
                    </div>
                  </div>

                  {editingDocumentId === String(selectedDocument.id) && (
                    <div className="rounded border bg-body-tertiary p-3 mb-3">
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label">Tên tài liệu</label>
                          <input
                            className={`form-control ${documentEditErrors.title ? "is-invalid" : ""}`}
                            value={documentEditForm.title}
                            onChange={(e) =>
                              setDocumentEditForm((prev) => ({ ...prev, title: e.target.value }))
                            }
                          />
                          {documentEditErrors.title && (
                            <div className="invalid-feedback">{documentEditErrors.title}</div>
                          )}
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">Danh mục</label>
                          <select
                            className={`form-select ${documentEditErrors.categoryId ? "is-invalid" : ""}`}
                            value={documentEditForm.categoryId}
                            onChange={(e) =>
                              setDocumentEditForm((prev) => ({ ...prev, categoryId: e.target.value }))
                            }
                          >
                            <option value="">Chọn danh mục</option>
                            {visibleCategories.map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                          {documentEditErrors.categoryId && (
                            <div className="invalid-feedback">{documentEditErrors.categoryId}</div>
                          )}
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">Phòng ban nhận</label>
                          <select
                            className="form-select"
                            value={documentEditForm.departmentId}
                            onChange={(e) =>
                              setDocumentEditForm((prev) => ({
                                ...prev,
                                departmentId: e.target.value,
                              }))
                            }
                          >
                            <option value="">Không chọn</option>
                            {initialDepartments.map((department) => (
                              <option key={department.id} value={department.id}>
                                {department.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-md-3">
                          <label className="form-label">Loại file</label>
                          <input
                            className="form-control"
                            value={documentEditForm.fileType}
                            onChange={(e) =>
                              setDocumentEditForm((prev) => ({ ...prev, fileType: e.target.value }))
                            }
                            placeholder="pdf, docx, png..."
                          />
                        </div>
                        <div className="col-md-3">
                          <label className="form-label">Trạng thái</label>
                          <select
                            className="form-select"
                            value={documentEditForm.status}
                            onChange={(e) =>
                              setDocumentEditForm((prev) => ({ ...prev, status: e.target.value }))
                            }
                          >
                            {DOCUMENT_STATUS_OPTIONS.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-12">
                          <label className="form-label">Link file</label>
                          <input
                            className={`form-control ${documentEditErrors.fileUrl ? "is-invalid" : ""}`}
                            value={documentEditForm.fileUrl}
                            onChange={(e) =>
                              setDocumentEditForm((prev) => ({ ...prev, fileUrl: e.target.value }))
                            }
                            placeholder="https://..."
                          />
                          {documentEditErrors.fileUrl && (
                            <div className="invalid-feedback">{documentEditErrors.fileUrl}</div>
                          )}
                        </div>
                        <div className="col-12">
                          <label className="form-label">Ghi chú</label>
                          <textarea
                            className="form-control"
                            rows="2"
                            value={documentEditForm.description}
                            onChange={(e) =>
                              setDocumentEditForm((prev) => ({
                                ...prev,
                                description: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>
                      <div className="d-flex justify-content-end gap-2 mt-3">
                        <button
                          type="button"
                          className="btn btn-light border"
                          onClick={() => {
                            setEditingDocumentId("");
                            setDocumentEditErrors({});
                            setDocumentEditForm(createDocumentEditForm(selectedDocument));
                          }}
                        >
                          Hủy
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary"
                          disabled={documentEditSubmitting}
                          onClick={saveDocumentDetail}
                        >
                          {documentEditSubmitting ? "Đang lưu..." : "Lưu chi tiết"}
                        </button>
                      </div>
                    </div>
                  )}

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
          </div>
        </div>
      )}

      {deleteTargetDocument && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100"
          style={{
            backgroundColor: "rgba(15, 23, 42, 0.45)",
            zIndex: 1090,
          }}
        >
          <div className="container-fluid h-100 d-flex align-items-center justify-content-center p-3">
            <div className="card shadow-lg border-0" style={{ maxWidth: "520px", width: "100%" }}>
              <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                <h6 className="card-title mb-0">Xác nhận xóa tài liệu</h6>
                <button
                  type="button"
                  className="btn btn-sm btn-light border d-inline-flex align-items-center justify-content-center"
                  style={{ width: "32px", height: "32px", padding: 0 }}
                  disabled={deleteSubmitting}
                  title="Đóng"
                  aria-label="Đóng"
                  onClick={closeDeleteDocumentDialog}
                >
                  <CloseIcon />
                </button>
              </div>
              <div className="card-body">
                <div className="alert alert-danger py-2" role="alert">
                  Bạn có chắc chắn muốn xóa tài liệu này ra khỏi hệ thống? Thao tác này giúp tránh bấm nhầm nên cần nhập đúng tên tài liệu.
                </div>
                <div className="rounded border bg-body-tertiary p-2 mb-3">
                  <div className="text-body-secondary text-uppercase" style={{ fontSize: "10px" }}>
                    Tên tài liệu cần nhập
                  </div>
                  <div className="fw-semibold text-body-emphasis text-break">
                    {getDeleteConfirmName(deleteTargetDocument)}
                  </div>
                </div>
                <label className="form-label">
                  Nhập đúng tên tài liệu để thực hiện xóa
                </label>
                <input
                  className="form-control"
                  value={deleteConfirmValue}
                  onChange={(e) => setDeleteConfirmValue(e.target.value)}
                  placeholder={`Nhập: ${getDeleteConfirmName(deleteTargetDocument)}`}
                  disabled={deleteSubmitting}
                />
                <div className="d-flex justify-content-end gap-2 mt-3">
                  <button
                    type="button"
                    className="btn btn-light border"
                    disabled={deleteSubmitting}
                    onClick={closeDeleteDocumentDialog}
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    disabled={
                      deleteSubmitting ||
                      deleteConfirmValue.trim() !== getDeleteConfirmName(deleteTargetDocument)
                    }
                    onClick={confirmDeleteDocument}
                  >
                    {deleteSubmitting ? "Đang xóa..." : "Xóa tài liệu"}
                  </button>
                </div>
              </div>
            </div>
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
          <div className="d-none d-lg-block table-responsive">
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
                  const categoryName =
                    doc.categoryName || categoryMap.get(String(doc.categoryId))?.name || "Danh mục ẩn";

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
                      <td>{categoryName}</td>
                      <td>
                        <DocumentDownloadBadge
                          document={doc}
                          hasDownloadAccess={hasDownloadAccess}
                          currentUser={currentUser}
                        />
                      </td>
                      <td>
                        <DocumentSource document={doc} />
                      </td>
                      <td>{doc.updatedAt}</td>
                      <td>
                        <DocumentStatusControl
                          canEdit={canEdit}
                          document={doc}
                          onUpdateStatus={updateDocumentStatus}
                        />
                      </td>
                      <td>
                        <DocumentActionButtons
                          canDownload={canDownload}
                          canDelete={canEdit}
                          canEdit={canEdit}
                          document={doc}
                          downloadDisabledReason={downloadDisabledReason}
                          onDelete={openDeleteDocumentDialog}
                          onDownload={handleDownloadDocument}
                          onEdit={handleEditDocument}
                          onPreview={handlePreviewDocument}
                        />
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
          <div className="d-lg-none d-flex flex-column gap-2">
            {filteredDocuments.map((doc) => {
              const downloadDisabledReason = getDownloadDisabledReason(currentUser, doc);
              const hasDownloadAccess = hasDownloadPermission(currentUser, doc);
              const canDownload = hasDownloadAccess && !downloadDisabledReason;
              const canEdit = canUseDocumentAction(currentUser, doc, "edit");
              const categoryName =
                doc.categoryName || categoryMap.get(String(doc.categoryId))?.name || "Danh mục ẩn";

              return (
                <details
                  key={doc.id}
                  className={`rounded border bg-body p-2 ${
                    selectedDocument && String(selectedDocument.id) === String(doc.id)
                      ? "border-primary"
                      : ""
                  }`}
                >
                  <summary
                    className="d-flex align-items-start justify-content-between gap-2"
                    style={{ cursor: "pointer", listStyle: "none" }}
                  >
                    <div className="min-w-0">
                      <div className="fw-semibold text-body-emphasis text-break">{doc.title}</div>
                      <div className="text-body-secondary text-break" style={{ fontSize: "12px" }}>
                        {categoryName} · {doc.updatedAt}
                      </div>
                    </div>
                    <DocumentDownloadBadge
                      document={doc}
                      hasDownloadAccess={hasDownloadAccess}
                      currentUser={currentUser}
                    />
                  </summary>

                  <div className="mt-2 border-top pt-2 d-flex flex-column gap-2">
                    {doc.description && (
                      <DocumentMobileMeta label="Mô tả" value={doc.description} />
                    )}
                    <DocumentMobileMeta label="Danh mục" value={categoryName} />
                    <DocumentMobileMeta label="Nguồn">
                      <DocumentSource document={doc} compact />
                    </DocumentMobileMeta>
                    <DocumentMobileMeta label="Cập nhật" value={doc.updatedAt} />
                    <div>
                      <div
                        className="mb-1 fw-semibold text-body-secondary text-uppercase"
                        style={{ fontSize: "10px" }}
                      >
                        Trạng thái
                      </div>
                      <DocumentStatusControl
                        canEdit={canEdit}
                        document={doc}
                        onUpdateStatus={updateDocumentStatus}
                      />
                    </div>
                  </div>

                  <div className="d-flex justify-content-end mt-2">
                    <DocumentActionButtons
                      canDownload={canDownload}
                      canDelete={canEdit}
                      canEdit={canEdit}
                      document={doc}
                      downloadDisabledReason={downloadDisabledReason}
                      onDelete={openDeleteDocumentDialog}
                      onDownload={handleDownloadDocument}
                      onEdit={handleEditDocument}
                      onPreview={handlePreviewDocument}
                    />
                  </div>
                </details>
              );
            })}
            {filteredDocuments.length === 0 && (
              <div className="rounded border bg-body-tertiary p-3 text-center text-body-secondary">
                Không có tài liệu trong bộ lọc này.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

function DocumentActionButtons({
  canDownload,
  canDelete,
  canEdit,
  document,
  downloadDisabledReason,
  onDelete,
  onDownload,
  onEdit,
  onPreview,
}) {
  return (
    <div className="d-flex justify-content-center gap-2">
      <button
        type="button"
        className="btn btn-sm btn-outline-primary d-inline-flex align-items-center justify-content-center"
        style={{ width: "32px", height: "32px", padding: 0 }}
        title="Xem tài liệu"
        aria-label="Xem tài liệu"
        onClick={() => onPreview(document)}
      >
        <EyeIcon />
      </button>
      <button
        type="button"
        className="btn btn-sm btn-outline-success d-inline-flex align-items-center justify-content-center"
        style={{ width: "32px", height: "32px", padding: 0 }}
        disabled={!canDownload}
        title={canDownload ? "Tải tài liệu" : downloadDisabledReason || "Bạn chưa có quyền tải"}
        aria-label="Tải tài liệu"
        onClick={() => onDownload(document)}
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
        onClick={() => onEdit(document)}
      >
        <EditIcon />
      </button>
      <button
        type="button"
        className="btn btn-sm btn-outline-danger d-inline-flex align-items-center justify-content-center"
        style={{ width: "32px", height: "32px", padding: 0 }}
        disabled={!canDelete}
        title={canDelete ? "Xóa tài liệu" : "Bạn chưa có quyền xóa"}
        aria-label="Xóa tài liệu"
        onClick={() => onDelete(document)}
      >
        <TrashIcon />
      </button>
    </div>
  );
}

function DocumentDownloadBadge({ currentUser, document, hasDownloadAccess }) {
  return (
    <span
      className={`badge flex-shrink-0 ${
        hasDownloadAccess ? "bg-success-subtle text-success" : "bg-danger-subtle text-danger"
      }`}
      title={
        hasDownloadAccess
          ? getDocumentActionUrl(document)
            ? "Được tải"
            : "Được cấp quyền tải, nhưng chưa có link tải"
          : getDownloadPermissionReason(currentUser, document)
      }
    >
      {hasDownloadAccess ? "Được tải" : "Không tải"}
    </span>
  );
}

function DocumentMobileMeta({ children, label, value }) {
  return (
    <div className="rounded border bg-body-tertiary p-2">
      <div
        className="mb-1 fw-semibold text-body-secondary text-uppercase"
        style={{ fontSize: "10px" }}
      >
        {label}
      </div>
      {children || (
        <div className="fw-medium text-body-emphasis text-break" style={{ fontSize: "13px" }}>
          {value || "-"}
        </div>
      )}
    </div>
  );
}

function DocumentSource({ compact = false, document }) {
  return (
    <div className={compact ? "d-flex flex-wrap align-items-center gap-2" : ""}>
      <span className="badge bg-body-secondary text-body">
        {document.sourceType === "link" ? "Link" : "File"}
      </span>
      <span
        className={`${compact ? "" : "ms-2"} text-body-secondary text-break`}
        style={{ fontSize: "12px" }}
      >
        {document.sourceName || "-"}
      </span>
    </div>
  );
}

function DocumentStatusControl({ canEdit, document, onUpdateStatus }) {
  if (!canEdit) {
    return <span className={`badge ${getStatusBadgeClass(document.status)}`}>{document.status}</span>;
  }

  return (
    <select
      className="form-select form-select-sm"
      value={document.status}
      onChange={(e) => onUpdateStatus(document.id, e.target.value)}
      aria-label={`Cập nhật trạng thái ${document.title}`}
    >
      {DOCUMENT_STATUS_OPTIONS.map((status) => (
        <option key={status} value={status}>
          {status}
        </option>
      ))}
    </select>
  );
}

function PermissionActionDropdown({ actionLabel, children, rule }) {
  const selectedCount =
    (rule?.groups?.length || 0) + (rule?.roles?.length || 0) + (rule?.departments?.length || 0);

  return (
    <details className="rounded border bg-body">
      <summary
        className="d-flex align-items-center justify-content-between gap-2 p-2"
        style={{ cursor: "pointer", listStyle: "none" }}
      >
        <span className="badge bg-primary-subtle text-primary">{actionLabel}</span>
        <span className="text-body-secondary" style={{ fontSize: "12px" }}>
          {selectedCount} quyền đã chọn
        </span>
      </summary>
      <div className="border-top p-2">{children}</div>
    </details>
  );
}

function CategoryStatusBadge({ isHidden }) {
  return (
    <span
      className={`badge flex-shrink-0 ${
        isHidden ? "bg-danger-subtle text-danger" : "bg-success-subtle text-success"
      }`}
    >
      {isHidden ? "Đang ẩn" : "Hiển thị"}
    </span>
  );
}

function CategoryActionButtons({ category, disabled, onEdit, onToggleHidden }) {
  return (
    <div className="d-flex justify-content-center align-items-center gap-2 flex-nowrap">
      <button
        type="button"
        className="btn btn-sm btn-outline-primary d-inline-flex align-items-center justify-content-center"
        style={{ width: "32px", height: "32px", padding: 0 }}
        onClick={() => onEdit(category)}
        disabled={disabled}
        title="Sửa danh mục"
        aria-label="Sửa danh mục"
      >
        <EditIcon />
      </button>
      <button
        type="button"
        className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center justify-content-center"
        style={{ width: "32px", height: "32px", padding: 0 }}
        onClick={() => onToggleHidden(category.id)}
        disabled={disabled}
        title={category.isHidden ? "Hiện danh mục" : "Ẩn danh mục"}
        aria-label={category.isHidden ? "Hiện danh mục" : "Ẩn danh mục"}
      >
        {category.isHidden ? <EyeIcon /> : <EyeOffIcon />}
      </button>
    </div>
  );
}

function CheckboxGroup({
  action,
  documentId,
  layout = "wrap",
  onToggle,
  options,
  scope,
  values,
}) {
  const isStacked = layout === "stack";

  return (
    <div
      className={`d-flex gap-2 rounded border bg-body-tertiary p-2 ${
        isStacked ? "flex-column" : "flex-wrap"
      }`}
      style={{ minHeight: "46px", maxWidth: "100%" }}
    >
      {options.map((option) => (
        <label
          key={option.id}
          className={`d-inline-flex align-items-center gap-2 rounded border bg-body px-2 py-1 ${
            isStacked ? "w-100" : ""
          }`}
          style={{ fontSize: "12px", whiteSpace: "nowrap" }}
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

function PermissionMobileGroup({ children, label }) {
  return (
    <div className="mb-2">
      <div
        className="mb-1 fw-semibold text-body-secondary text-uppercase"
        style={{ fontSize: "10px" }}
      >
        {label}
      </div>
      {children}
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
  const previewUrl = document.previewUrl || document.previewImage || getDocumentActionUrl(document);
  const canRenderText = Boolean(document.previewText);
  const canRenderImage = previewUrl && isImagePreview(document);
  const canRenderFrame = previewUrl && (isPdfPreview(document) || isTextPreview(document) || isLink);

  return (
    <div className="rounded border bg-body-tertiary p-2">
      <div className="rounded border bg-body overflow-hidden">
        <div
          className="d-flex align-items-center justify-content-center bg-primary-subtle text-primary overflow-hidden"
          style={{ aspectRatio: "4 / 3", minHeight: "260px" }}
        >
          {canRenderText ? (
            <pre
              className="h-100 w-100 m-0 bg-white text-body text-start overflow-auto p-3"
              style={{ whiteSpace: "pre-wrap", fontSize: "13px", lineHeight: 1.5 }}
            >
              {document.previewText}
            </pre>
          ) : canRenderImage ? (
            <img
              src={previewUrl}
              alt={document.title}
              className="h-100 w-100"
              style={{ objectFit: "contain", backgroundColor: "#fff" }}
            />
          ) : canRenderFrame ? (
            <iframe
              src={previewUrl}
              title={`Preview ${document.title}`}
              className="h-100 w-100 border-0 bg-white"
              style={{ minHeight: "260px" }}
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

function ImportIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="17 8 12 3 7 8"></polyline>
      <line x1="12" y1="3" x2="12" y2="15"></line>
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"></polyline>
      <polyline points="1 20 1 14 7 14"></polyline>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"></path>
      <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"></path>
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
      <polyline points="15 3 21 3 21 9"></polyline>
      <line x1="10" y1="14" x2="21" y2="3"></line>
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
      <path d="M10 11v6"></path>
      <path d="M14 11v6"></path>
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}

