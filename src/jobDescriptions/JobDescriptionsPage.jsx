import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { authFetch, getAuthHeaders } from "../auth/session";
import { API_BASE_URL } from "../config/api";
import { TailwindDropdown } from "../components/ui/TailwindDropdown";

const ADMIN_ROLE_ID = "69fc5af582ef85451120772a";
const DIRECTOR_ROLE_ID = "69fc5af582ef85451120772b";
const DEPARTMENT_HEAD_ROLE_ID = "69fc5af582ef85451120772c";
const HR_ROLE_ID = "69fc5af582ef85451120772d";
const JD_FETCH_LIMIT = 1000;

const ROLE_LABELS = {
  admin: "Admin",
  bangiamdoc: "Ban giám đốc",
  truongbophan: "Trưởng bộ phận",
  nhansu: "Nhân sự",
  daily: "Đại lý",
  congtacvien: "Cộng tác viên",
  user: "Người dùng",
  hethong: "Hệ thống",
};

const WORKING_TYPE_OPTIONS = [
  { id: "full-time", label: "Toàn thời gian" },
  { id: "part-time", label: "Bán thời gian" },
  { id: "remote", label: "Từ xa" },
  { id: "hybrid", label: "Hybrid" },
  { id: "freelance", label: "Freelance" },
];

const STATUS_OPTIONS = [
  { id: "active", label: "Đang hiển thị", badge: "bg-success-subtle text-success" },
  { id: "inactive", label: "Đang ẩn", badge: "bg-warning-subtle text-warning" },
  { id: "draft", label: "Bản nháp", badge: "bg-body-secondary text-body" },
];

const emptyForm = {
  title: "",
  departmentId: "",
  description: "",
  requirements: "",
  benefits: "",
  salaryMin: "",
  salaryMax: "",
  currency: "VND",
  workingType: "full-time",
  location: "",
  status: "active",
};

const isManager = (user) =>
  ["admin", "bangiamdoc", "truongbophan", "nhansu"].includes(user?.role) ||
  [ADMIN_ROLE_ID, DIRECTOR_ROLE_ID, DEPARTMENT_HEAD_ROLE_ID, HR_ROLE_ID].includes(user?.roleId);

const isAdmin = (user) => user?.role === "admin" || user?.roleId === ADMIN_ROLE_ID;

const getRoleLabel = (role) => ROLE_LABELS[role] || role || "Người dùng";

const getStatusOption = (status) =>
  STATUS_OPTIONS.find((option) => option.id === status) || STATUS_OPTIONS[0];

const getWorkingTypeLabel = (workingType) =>
  WORKING_TYPE_OPTIONS.find((option) => option.id === workingType)?.label || workingType || "-";

const getApiErrorMessage = (payload, fallback) => {
  const details = payload?.error?.details;

  if (Array.isArray(details) && details.length > 0) return details[0];
  if (payload?.message && payload.message !== "Bad Request") return payload.message;

  return fallback;
};

const normalizeApiData = (payload) => payload?.data ?? payload ?? {};

const normalizeApiList = (payload) => {
  const data = normalizeApiData(payload);

  if (Array.isArray(data)) return { items: data, total: data.length };
  if (Array.isArray(data.items)) return { items: data.items, total: data.total ?? data.items.length };
  if (Array.isArray(data.jobDescriptions)) {
    return { items: data.jobDescriptions, total: data.total ?? data.jobDescriptions.length };
  }

  return { items: [], total: 0 };
};

const normalizeDepartment = (department) => {
  const data = department?.data ?? department ?? {};

  return {
    id: String(data.id || data._id || ""),
    name: data.name || data.title || "Phòng ban",
  };
};

const normalizeDepartmentsPayload = (payload) =>
  normalizeApiList(payload)
    .items.map(normalizeDepartment)
    .filter((department) => department.id);

const splitListText = (value) =>
  Array.isArray(value)
    ? value.map(String).map((item) => item.trim()).filter(Boolean)
    : String(value || "")
        .split(/\r?\n|;|\|/g)
        .map((item) => item.trim())
        .filter(Boolean);

const listToFormText = (items) => (Array.isArray(items) ? items.join("\n") : String(items || ""));

const formatDate = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value || "-";
  }

  return date.toLocaleDateString("vi-VN");
};

const formatSalary = (salaryRange) => {
  const min = Number(salaryRange?.min);
  const max = Number(salaryRange?.max);
  const currency = salaryRange?.currency || "VND";

  if (!Number.isFinite(min) && !Number.isFinite(max)) return "Chưa khai báo";
  if (Number.isFinite(min) && Number.isFinite(max)) return `${min.toLocaleString("vi-VN")} - ${max.toLocaleString("vi-VN")} ${currency}`;
  if (Number.isFinite(min)) return `Từ ${min.toLocaleString("vi-VN")} ${currency}`;

  return `Đến ${max.toLocaleString("vi-VN")} ${currency}`;
};

const normalizeJd = (input, index = 0) => {
  const data = input?.data ?? input ?? {};
  const id = String(data.id || data._id || `jd-${index}`);
  const departmentId = String(data.departmentId || data.department?._id || data.department?.id || "");

  return {
    id,
    title: data.title || `JD ${index + 1}`,
    departmentId,
    departmentName: data.department?.name || data.departmentName || "",
    description: data.description || "",
    requirements: splitListText(data.requirements),
    benefits: splitListText(data.benefits),
    salaryRange: {
      min: data.salaryRange?.min ?? null,
      max: data.salaryRange?.max ?? null,
      currency: data.salaryRange?.currency || "VND",
    },
    workingType: data.workingType || "full-time",
    location: data.location || "",
    status: data.status || "active",
    createdBy: data.creator?.fullName || data.creator?.email || data.createdByName || "",
    updatedAt: data.updatedAt || data.createdAt || new Date().toISOString(),
  };
};

const normalizeJdsPayload = (payload) => {
  const { items, total } = normalizeApiList(payload);

  return {
    items: items.map(normalizeJd).filter((jd) => jd.id),
    total,
  };
};

const parseCsv = (text) => {
  const rows = text
    .split(/\r?\n/g)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, "")));
  const [headers = [], ...bodyRows] = rows;

  if (headers.length === 0) {
    return [];
  }

  return bodyRows.map((row) =>
    headers.reduce((item, header, index) => {
      item[header] = row[index] || "";
      return item;
    }, {}),
  );
};

const parseImportedJds = (text, fileName, fallbackDepartmentId) => {
  const trimmedText = text.trim();

  if (!trimmedText) {
    return [];
  }

  const normalizeImportItem = (item, index = 0) => ({
    title: item.title || item.position || item["ten vi tri"] || fileName.replace(/\.[^.]+$/, "") || `JD import ${index + 1}`,
    departmentId: item.departmentId || fallbackDepartmentId,
    description: item.description || item.summary || trimmedText.slice(0, 500),
    requirements: listToFormText(splitListText(item.requirements)),
    benefits: listToFormText(splitListText(item.benefits || item.responsibilities || item.tasks)),
    salaryRange: item.salaryRange || undefined,
    workingType: item.workingType || "full-time",
    location: item.location || "",
    status: item.status || "active",
  });

  if (fileName.toLowerCase().endsWith(".json") || trimmedText.startsWith("[") || trimmedText.startsWith("{")) {
    const parsedValue = JSON.parse(trimmedText);
    const rows = Array.isArray(parsedValue) ? parsedValue : parsedValue.items || [parsedValue];

    return rows.map(normalizeImportItem);
  }

  if (fileName.toLowerCase().endsWith(".csv")) {
    return parseCsv(trimmedText).map(normalizeImportItem);
  }

  return [normalizeImportItem({ description: trimmedText })];
};

const formFromJd = (jd) => ({
  title: jd.title,
  departmentId: jd.departmentId,
  description: jd.description,
  requirements: listToFormText(jd.requirements),
  benefits: listToFormText(jd.benefits),
  salaryMin: jd.salaryRange?.min ?? "",
  salaryMax: jd.salaryRange?.max ?? "",
  currency: jd.salaryRange?.currency || "VND",
  workingType: jd.workingType,
  location: jd.location,
  status: jd.status,
});

const toNumberOrNull = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : null;
};

const jdPayloadFromForm = (form) => ({
  title: form.title.trim(),
  departmentId: form.departmentId,
  description: form.description.trim(),
  requirements: form.requirements.trim(),
  benefits: form.benefits.trim(),
  salaryRange: {
    min: toNumberOrNull(form.salaryMin),
    max: toNumberOrNull(form.salaryMax),
    currency: form.currency || "VND",
  },
  workingType: form.workingType,
  location: form.location.trim(),
  status: form.status,
});

async function apiRequest(path, options = {}) {
  const response = await authFetch(`${API_BASE_URL}${path}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...options.headers,
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(getApiErrorMessage(payload, "Không thể xử lý dữ liệu mô tả công việc."));
  }

  return payload;
}

const fetchDepartments = async () =>
  normalizeDepartmentsPayload(await apiRequest("/departments?page=1&limit=1000"));

const fetchJobDescriptions = async () =>
  normalizeJdsPayload(await apiRequest(`/job-descriptions?page=1&limit=${JD_FETCH_LIMIT}`));

const createJobDescription = async (payload) =>
  normalizeJd(normalizeApiData(await apiRequest("/job-descriptions", { method: "POST", body: payload })));

const updateJobDescription = async (id, payload) =>
  normalizeJd(normalizeApiData(await apiRequest(`/job-descriptions/${id}`, { method: "PATCH", body: payload })));

const deleteJobDescription = async (id) =>
  await apiRequest(`/job-descriptions/${id}`, { method: "DELETE" });

export const JobDescriptionsPage = ({ currentUser, filterDepartmentId }) => {
  const [jds, setJds] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [totalJds, setTotalJds] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState(() => {
    if (filterDepartmentId) return filterDepartmentId;
    const isSystemAdmin = ["admin", "bangiamdoc", "nhansu"].includes(currentUser?.role) || 
                          [ADMIN_ROLE_ID, DIRECTOR_ROLE_ID, HR_ROLE_ID].includes(currentUser?.roleId);
    return isSystemAdmin ? "all" : (currentUser?.departmentId || "all");
  });
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (filterDepartmentId) {
      setDepartmentFilter(filterDepartmentId);
    } else {
      const isSystemAdmin = ["admin", "bangiamdoc", "nhansu"].includes(currentUser?.role) || 
                            [ADMIN_ROLE_ID, DIRECTOR_ROLE_ID, HR_ROLE_ID].includes(currentUser?.roleId);
      setDepartmentFilter(isSystemAdmin ? "all" : (currentUser?.departmentId || "all"));
    }
  }, [filterDepartmentId, currentUser]);
  const [selectedJdId, setSelectedJdId] = useState("");
  const [jdListPage, setJdListPage] = useState(1);
  const [formMode, setFormMode] = useState(null);
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [importMessage, setImportMessage] = useState("");
  const [isDragActive, setIsDragActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);
  const [importDepartmentId, setImportDepartmentId] = useState("");
  const [importFilesList, setImportFilesList] = useState([]);
  const modalFileInputRef = useRef(null);

  const canManage = isManager(currentUser);
  const canDelete = isAdmin(currentUser);

  const departmentNameById = useMemo(
    () => Object.fromEntries(departments.map((department) => [department.id, department.name])),
    [departments],
  );

  const getDepartmentName = useCallback(
    (jd) => jd.departmentName || departmentNameById[jd.departmentId] || "Chưa gán",
    [departmentNameById],
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setApiError("");

    try {
      // Tải phòng ban và JD song song nhưng bắt lỗi phòng ban riêng biệt để tránh làm lỗi cả trang
      const departmentPromise = fetchDepartments().catch((err) => {
        console.warn("Không có quyền tải danh mục phòng ban hoặc API chưa sẵn sàng:", err);
        return [];
      });

      const jdPromise = fetchJobDescriptions();

      const [departmentData, jdData] = await Promise.all([departmentPromise, jdPromise]);
      setDepartments(departmentData);
      setJds(jdData.items);
      setTotalJds(jdData.total);
      setSelectedJdId((currentId) =>
        jdData.items.some((jd) => jd.id === currentId) ? currentId : jdData.items[0]?.id || "",
      );
      if (filterDepartmentId) {
        setImportDepartmentId(filterDepartmentId);
      } else if (departmentData.length > 0) {
        setImportDepartmentId(departmentData[0].id);
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "";
      // Không hiện lỗi cảnh báo nếu chỉ liên quan đến thiếu quyền phòng ban (departments:read)
      if (!errMsg.includes("departments:read") && !errMsg.includes("403")) {
        setApiError(errMsg || "Không thể tải danh sách JD.");
      }
      setDepartments([]);
      setJds([]);
      setTotalJds(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadData();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadData]);

  const filteredJds = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    const isSystemAdmin = ["admin", "bangiamdoc", "nhansu"].includes(currentUser?.role) || 
                          [ADMIN_ROLE_ID, DIRECTOR_ROLE_ID, HR_ROLE_ID].includes(currentUser?.roleId);

    return jds.filter((jd) => {
      // Nếu không phải Admin/BGĐ/Nhân sự thì chỉ hiển thị JD thuộc phòng ban của mình
      if (!isSystemAdmin) {
        if (!currentUser?.departmentId || jd.departmentId !== currentUser.departmentId) {
          return false;
        }
      }

      const matchesDepartment = departmentFilter === "all" || jd.departmentId === departmentFilter;
      const matchesStatus = statusFilter === "all" || jd.status === statusFilter;
      const matchesKeyword =
        !keyword ||
        `${jd.title} ${jd.description} ${getDepartmentName(jd)} ${jd.location}`
          .toLowerCase()
          .includes(keyword);

      return matchesDepartment && matchesStatus && matchesKeyword;
    });
  }, [departmentFilter, getDepartmentName, jds, searchTerm, statusFilter, currentUser]);

  useEffect(() => {
    setJdListPage(1);
  }, [searchTerm, departmentFilter, statusFilter]);

  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(filteredJds.length / ITEMS_PER_PAGE) || 1;
  const currentPageClamped = Math.max(1, Math.min(jdListPage, totalPages));

  const paginatedJds = useMemo(() => {
    const startIndex = (currentPageClamped - 1) * ITEMS_PER_PAGE;
    return filteredJds.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredJds, currentPageClamped]);

  const selectedJd = filteredJds.find((jd) => jd.id === selectedJdId) || filteredJds[0] || null;

  const openCreateForm = () => {
    setFormMode("create");
    setEditingId("");
    setForm({ ...emptyForm, departmentId: filterDepartmentId || departments[0]?.id || "" });
    setFormError("");
  };

  const openEditForm = (jd) => {
    setFormMode("edit");
    setEditingId(jd.id);
    setForm(formFromJd(jd));
    setFormError("");
  };

  const closeForm = () => {
    setFormMode(null);
    setEditingId("");
    setForm({ ...emptyForm, departmentId: filterDepartmentId || "" });
    setFormError("");
  };

  const updateForm = (field, value) => {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
  };

  const submitForm = async (event) => {
    event.preventDefault();

    if (!form.title.trim() || !form.departmentId || !form.description.trim()) {
      setFormError("Vui lòng nhập tên vị trí, phòng ban và mô tả công việc.");
      return;
    }

    setActionLoading(true);
    setFormError("");

    try {
      const payload = jdPayloadFromForm(form);
      const savedJd =
        formMode === "edit"
          ? await updateJobDescription(editingId, payload)
          : await createJobDescription(payload);

      setJds((currentJds) =>
        formMode === "edit"
          ? currentJds.map((jd) => (jd.id === editingId ? savedJd : jd))
          : [savedJd, ...currentJds],
      );
      setSelectedJdId(savedJd.id);
      setTotalJds((currentTotal) => (formMode === "edit" ? currentTotal : currentTotal + 1));
      closeForm();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Không thể lưu JD.");
    } finally {
      setActionLoading(false);
    }
  };

  const deleteJd = async (jd) => {
    if (!window.confirm(`Xóa JD "${jd.title}"?`)) {
      return;
    }

    setActionLoading(true);
    setApiError("");

    try {
      await deleteJobDescription(jd.id);
      setJds((currentJds) => currentJds.filter((item) => item.id !== jd.id));
      setTotalJds((currentTotal) => Math.max(0, currentTotal - 1));
      setSelectedJdId((currentId) => (currentId === jd.id ? "" : currentId));
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Không thể xóa JD.");
    } finally {
      setActionLoading(false);
    }
  };

  const toggleStatus = async (jd) => {
    const nextStatus = jd.status === "active" ? "inactive" : "active";
    setActionLoading(true);
    setApiError("");

    try {
      const updatedJd = await updateJobDescription(jd.id, { status: nextStatus });
      setJds((currentJds) => currentJds.map((item) => (item.id === jd.id ? updatedJd : item)));
      setSelectedJdId(updatedJd.id);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Không thể cập nhật trạng thái JD.");
    } finally {
      setActionLoading(false);
    }
  };

  const importFiles = async (files, targetDepartmentId) => {
    const fileList = Array.from(files || []);
    const depId = targetDepartmentId || importDepartmentId || departments[0]?.id || "";

    if (fileList.length === 0) {
      return;
    }

    if (!depId) {
      setImportMessage("Vui lòng chọn hoặc tạo phòng ban trước khi import JD.");
      return;
    }

    setActionLoading(true);
    setImportMessage("");

    try {
      const importedGroups = await Promise.all(
        fileList.map(async (file) => parseImportedJds(await file.text(), file.name, depId)),
      );
      const importedInputs = importedGroups.flat().filter((item) => item.title && item.description);

      if (importedInputs.length === 0) {
        setImportMessage("File import không có JD hợp lệ.");
        return;
      }

      const importedJds = await Promise.all(importedInputs.map(createJobDescription));
      setJds((currentJds) => [...importedJds, ...currentJds]);
      setSelectedJdId(importedJds[0]?.id || "");
      setTotalJds((currentTotal) => currentTotal + importedJds.length);
      setImportMessage(`Đã import ${importedJds.length} JD từ ${fileList.length} file.`);
      setShowImportModal(false);
      setImportFilesList([]);
    } catch (error) {
      setImportMessage(error instanceof Error ? error.message : "Không thể import file JD.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragActive(false);

    if (!canManage) {
      return;
    }

    if (event.dataTransfer.files.length > 0) {
      setImportFilesList(Array.from(event.dataTransfer.files));
      setShowImportModal(true);
      setImportMessage("");
      return;
    }

    const droppedText = event.dataTransfer.getData("text/plain");

    if (droppedText.trim()) {
      const virtualFile = new File([droppedText], "noi-dung-keo-tha.txt", { type: "text/plain" });
      setImportFilesList([virtualFile]);
      setShowImportModal(true);
      setImportMessage("");
    }
  };

  const filteredDepartmentName = useMemo(() => {
    if (!filterDepartmentId || departments.length === 0) return "";
    const match = departments.find(d => String(d.id) === String(filterDepartmentId));
    return match ? match.name : "";
  }, [filterDepartmentId, departments]);

  return (
    <div
      className="container-fluid pt-3 pb-4"
      style={{ maxWidth: "1600px" }}
      onDragOver={(event) => {
        if (!canManage) {
          return;
        }

        event.preventDefault();
        setIsDragActive(true);
      }}
      onDragLeave={() => setIsDragActive(false)}
      onDrop={handleDrop}
    >
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h4 className="fw-bold text-body-emphasis mb-1">
            JD vị trí / phòng ban {filteredDepartmentName ? `— ${filteredDepartmentName}` : ""}
          </h4>
          
        </div>
        {canManage ? (
          <div className="d-flex flex-wrap justify-content-end gap-2">
            <button
              className="btn btn-outline-primary d-flex align-items-center gap-2"
              disabled={actionLoading}
              onClick={() => {
                setImportFilesList([]);
                setImportMessage("");
                setShowImportModal(true);
              }}
            >
              <UploadIcon />
              Import JD
            </button>
            <button
              id="jd-create-btn"
              className="btn btn-primary d-flex align-items-center gap-2"
              disabled={actionLoading || departments.length === 0}
              onClick={openCreateForm}
            >
              <PlusIcon />
              Tạo JD mới
            </button>
          </div>
        ) : (
          <span className="badge bg-primary-subtle text-primary px-3 py-2">
            {getRoleLabel(currentUser?.role)}
          </span>
        )}
      </div>

      {apiError && (
        <div className="alert alert-danger py-2 mb-3" role="alert">
          {apiError}
        </div>
      )}

      {canManage && (importMessage || isDragActive) && (
        <div className={`alert py-2 mb-3 ${isDragActive ? "alert-primary" : "alert-info"}`} role="alert">
          {isDragActive ? "Thả file hoặc nội dung JD vào màn hình này để import." : importMessage}
        </div>
      )}

      <div className="row g-3 mb-3">
        <div className="col-12 col-lg-6">
          <div className="position-relative">
            <SearchIcon />
            <input
              id="jd-search-input"
              type="text"
              className="form-control bg-body ps-5"
              placeholder="Tìm theo vị trí, phòng ban, địa điểm hoặc nội dung JD..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
        </div>
        {!filterDepartmentId && (
          <div className="col-12 col-md-6 col-lg-3">
            <TailwindDropdown
              onChange={setDepartmentFilter}
              options={
                (() => {
                  const isSystemAdmin = ["admin", "bangiamdoc", "nhansu"].includes(currentUser?.role) || 
                                        [ADMIN_ROLE_ID, DIRECTOR_ROLE_ID, HR_ROLE_ID].includes(currentUser?.roleId);
                  if (isSystemAdmin) {
                    return [
                      { label: "Tất cả phòng ban", value: "all" },
                      ...departments.map((department) => ({
                        label: department.name,
                        value: department.id,
                      })),
                    ];
                  } else {
                    // Chỉ hiển thị phòng ban của chính user
                    const myDep = departments.find(d => d.id === currentUser?.departmentId);
                    return myDep 
                      ? [{ label: myDep.name, value: myDep.id }] 
                      : [{ label: "Phòng ban của tôi", value: currentUser?.departmentId || "none" }];
                  }
                })()
              }
              placeholder="Tất cả phòng ban"
              value={departmentFilter}
            />
          </div>
        )}
        <div className="col-12 col-md-6 col-lg-3">
          <TailwindDropdown
            onChange={setStatusFilter}
            options={[
              { label: "Tất cả trạng thái", value: "all" },
              ...STATUS_OPTIONS.map((status) => ({
                label: status.label,
                value: status.id,
              })),
            ]}
            placeholder="Tất cả trạng thái"
            value={statusFilter}
          />
        </div>
      </div>

      <div className="row g-4">
        <div className="col-12 col-xl-5">
          <section id="jd-list-card" className="card border-0 shadow-sm h-100">
            <div className="card-header bg-transparent border-bottom d-flex justify-content-between align-items-center">
              <span className="fw-bold text-body-emphasis">Danh sách JD</span>
              <span className="badge bg-body-secondary text-body">
                {filteredJds.length}/{totalJds || filteredJds.length}
              </span>
            </div>
            <div className="card-body p-0">
              {loading ? (
                <div className="text-center text-body-secondary py-5 px-3">
                  Đang tải danh sách JD...
                </div>
              ) : filteredJds.length === 0 ? (
                <div className="text-center text-body-secondary py-5 px-3">
                  Không tìm thấy JD phù hợp.
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {paginatedJds.map((jd) => {
                    const status = getStatusOption(jd.status);

                    return (
                      <button
                        key={jd.id}
                        type="button"
                        className={`list-group-item list-group-item-action border-0 border-bottom p-3 text-start ${
                          selectedJd?.id === jd.id ? "bg-primary-subtle" : "bg-transparent"
                        } ${jd.status === "inactive" ? "opacity-75" : ""}`}
                        onClick={() => setSelectedJdId(jd.id)}
                      >
                        <div className="d-flex justify-content-between align-items-start gap-2">
                          <div style={{ minWidth: 0 }}>
                            <div className="fw-bold text-body-emphasis text-truncate">{jd.title}</div>
                            <div className="text-body-secondary mt-1" style={{ fontSize: "12px" }}>
                              {getDepartmentName(jd)} {jd.location ? `- ${jd.location}` : ""}
                            </div>
                          </div>
                          <div className="d-flex flex-column align-items-end gap-1 flex-shrink-0">
                            <span className={`badge ${status.badge}`}>{status.label}</span>
                            <span className="badge bg-body text-body border">{getWorkingTypeLabel(jd.workingType)}</span>
                          </div>
                        </div>
                        <p className="text-body-secondary mb-0 mt-2" style={{ fontSize: "13px", lineHeight: 1.45 }}>
                          {jd.description && jd.description.length > 100
                            ? jd.description.substring(0, 100) + "..."
                            : jd.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            {totalPages > 1 && (
              <div className="card-footer bg-transparent border-top d-flex justify-content-between align-items-center py-2 px-3">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  disabled={currentPageClamped === 1}
                  onClick={() => setJdListPage(currentPageClamped - 1)}
                >
                  Trước
                </button>
                <span className="small text-body-secondary">
                  Trang {currentPageClamped} / {totalPages}
                </span>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  disabled={currentPageClamped === totalPages}
                  onClick={() => setJdListPage(currentPageClamped + 1)}
                >
                  Sau
                </button>
              </div>
            )}
          </section>
        </div>

        <div className="col-12 col-xl-7">
          {selectedJd ? (
            <section id="jd-detail-card" className="card border-0 shadow-sm h-100">
              <div className="card-header bg-transparent border-bottom">
                <div className="d-flex justify-content-between align-items-start gap-3">
                  <div style={{ minWidth: 0 }}>
                    <h5 className="fw-bold text-body-emphasis mb-1">{selectedJd.title}</h5>
                    <div className="text-body-secondary" style={{ fontSize: "13px" }}>
                      {getDepartmentName(selectedJd)} {selectedJd.location ? `- ${selectedJd.location}` : ""}
                    </div>
                  </div>
                  <div className="d-flex flex-column align-items-end gap-2 flex-shrink-0">
                    <div className="d-flex flex-wrap gap-2 justify-content-end">
                      <span className={`badge ${getStatusOption(selectedJd.status).badge}`}>
                        {getStatusOption(selectedJd.status).label}
                      </span>
                      <span className="badge bg-primary-subtle text-primary">
                        {getWorkingTypeLabel(selectedJd.workingType)}
                      </span>
                      <span className="badge bg-body-secondary text-body">
                        Cập nhật {formatDate(selectedJd.updatedAt)}
                      </span>
                    </div>
                    {canManage && (
                      <div className="d-flex flex-wrap gap-2 justify-content-end">
                        <button
                          className="btn btn-sm btn-outline-primary d-inline-flex align-items-center justify-content-center"
                          style={{ width: "34px", height: "34px", padding: 0 }}
                          title="Sửa JD"
                          aria-label="Sửa JD"
                          disabled={actionLoading}
                          onClick={() => openEditForm(selectedJd)}
                        >
                          <EditIcon />
                        </button>
                        <button
                          className="btn btn-sm btn-outline-warning d-inline-flex align-items-center justify-content-center"
                          style={{ width: "34px", height: "34px", padding: 0 }}
                          title={selectedJd.status === "active" ? "Ẩn JD" : "Hiện JD"}
                          aria-label={selectedJd.status === "active" ? "Ẩn JD" : "Hiện JD"}
                          disabled={actionLoading}
                          onClick={() => toggleStatus(selectedJd)}
                        >
                          {selectedJd.status === "active" ? <EyeOffIcon /> : <EyeIcon />}
                        </button>
                        {canDelete && (
                          <button
                            className="btn btn-sm btn-outline-danger d-inline-flex align-items-center justify-content-center"
                            style={{ width: "34px", height: "34px", padding: 0 }}
                            title="Xóa JD"
                            aria-label="Xóa JD"
                            disabled={actionLoading}
                            onClick={() => deleteJd(selectedJd)}
                          >
                            <TrashIcon />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="card-body">
                <InfoBlock title="Mô tả công việc" items={[selectedJd.description]} />
                <InfoBlock title="Yêu cầu năng lực" items={selectedJd.requirements} />
                <InfoBlock title="Quyền lợi" items={selectedJd.benefits} />
                <div className="mt-4">
                  <h6 className="fw-bold text-body-emphasis mb-2">Thông tin thêm</h6>
                  <div className="d-flex flex-wrap gap-2">
                    <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-2">
                      Lương: {formatSalary(selectedJd.salaryRange)}
                    </span>
                    <span className="badge bg-info-subtle text-info border border-info-subtle px-3 py-2">
                      Hình thức: {getWorkingTypeLabel(selectedJd.workingType)}
                    </span>
                    {selectedJd.createdBy && (
                      <span className="badge bg-body-secondary text-body px-3 py-2">
                        Người tạo: {selectedJd.createdBy}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </section>
          ) : (
            <section className="card border-0 shadow-sm">
              <div className="card-body text-center text-body-secondary py-5">
                {loading ? "Đang tải JD..." : "Chưa có JD nào phù hợp."}
              </div>
            </section>
          )}
        </div>
      </div>

      {formMode && canManage && (
        <div className="fixed inset-0 z-[1050] flex items-center justify-center bg-black/50 p-3 backdrop-blur-[2px]">
          <div
            className="flex w-full max-w-[820px] flex-col overflow-hidden rounded-xl bg-[var(--bs-body-bg)] shadow-xl"
            style={{ maxHeight: "calc(100vh - 24px)" }}
          >
            <div className="d-flex flex-shrink-0 justify-content-between align-items-center border-bottom p-4">
              <h5 className="m-0 fw-bold text-body-emphasis">
                {formMode === "create" ? "Tạo JD mới" : "Chỉnh sửa JD"}
              </h5>
              <button className="btn btn-sm btn-light border" type="button" onClick={closeForm}>
                Đóng
              </button>
            </div>
            <form className="flex min-h-0 flex-1 flex-col" onSubmit={submitForm}>
              <div className="min-h-0 flex-1 overflow-y-auto p-4">
                {formError && <div className="alert alert-danger py-2">{formError}</div>}

                <div className="row g-3">
                  <Field label="Tên vị trí" required>
                    <input
                      className="form-control"
                      value={form.title}
                      disabled={actionLoading}
                      onChange={(event) => updateForm("title", event.target.value)}
                      placeholder="Ví dụ: Chuyên viên nhân sự"
                    />
                  </Field>
                  <Field label="Phòng ban" required>
                    <TailwindDropdown
                      disabled={actionLoading || Boolean(filterDepartmentId)}
                      onChange={(value) => updateForm("departmentId", value)}
                      options={[
                        { label: "Chọn phòng ban", value: "" },
                        ...departments.map((department) => ({
                          label: department.name,
                          value: department.id,
                        })),
                      ]}
                      placeholder="Chọn phòng ban"
                      value={form.departmentId}
                    />
                  </Field>
                  <Field label="Địa điểm">
                    <input
                      className="form-control"
                      value={form.location}
                      disabled={actionLoading}
                      onChange={(event) => updateForm("location", event.target.value)}
                      placeholder="Ví dụ: TP. Hồ Chí Minh"
                    />
                  </Field>
                  <Field label="Hình thức làm việc">
                    <TailwindDropdown
                      disabled={actionLoading}
                      onChange={(value) => updateForm("workingType", value)}
                      options={WORKING_TYPE_OPTIONS.map((option) => ({
                        label: option.label,
                        value: option.id,
                      }))}
                      placeholder="Chọn hình thức"
                      value={form.workingType}
                    />
                  </Field>
                  <Field label="Lương tối thiểu">
                    <input
                      className="form-control"
                      type="number"
                      min="0"
                      value={form.salaryMin}
                      disabled={actionLoading}
                      onChange={(event) => updateForm("salaryMin", event.target.value)}
                    />
                  </Field>
                  <Field label="Lương tối đa">
                    <input
                      className="form-control"
                      type="number"
                      min="0"
                      value={form.salaryMax}
                      disabled={actionLoading}
                      onChange={(event) => updateForm("salaryMax", event.target.value)}
                    />
                  </Field>
                  <Field label="Tiền tệ">
                    <input
                      className="form-control"
                      value={form.currency}
                      disabled={actionLoading}
                      onChange={(event) => updateForm("currency", event.target.value)}
                    />
                  </Field>
                  <Field label="Trạng thái">
                    <TailwindDropdown
                      disabled={actionLoading}
                      onChange={(value) => updateForm("status", value)}
                      options={STATUS_OPTIONS.map((option) => ({
                        label: option.label,
                        value: option.id,
                      }))}
                      placeholder="Chọn trạng thái"
                      value={form.status}
                    />
                  </Field>
                  <Field label="Mô tả công việc" required wide>
                    <textarea
                      className="form-control"
                      rows="4"
                      value={form.description}
                      disabled={actionLoading}
                      onChange={(event) => updateForm("description", event.target.value)}
                    />
                  </Field>
                  <Field label="Yêu cầu năng lực" wide>
                    <textarea
                      className="form-control"
                      rows="4"
                      value={form.requirements}
                      disabled={actionLoading}
                      onChange={(event) => updateForm("requirements", event.target.value)}
                      placeholder="Mỗi dòng là một yêu cầu"
                    />
                  </Field>
                  <Field label="Quyền lợi" wide>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={form.benefits}
                      disabled={actionLoading}
                      onChange={(event) => updateForm("benefits", event.target.value)}
                      placeholder="Mỗi dòng là một quyền lợi"
                    />
                  </Field>
                </div>
              </div>
              <div className="d-flex flex-shrink-0 justify-content-end gap-2 border-top p-4">
                <button type="button" className="btn btn-light border" disabled={actionLoading} onClick={closeForm}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? "Đang lưu..." : formMode === "create" ? "Tạo JD" : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showImportModal && canManage && (
        <div className="fixed inset-0 z-[1050] flex items-center justify-center bg-black/50 p-3 backdrop-blur-[2px]">
          <div
            className="flex w-full max-w-[520px] flex-col overflow-hidden rounded-xl bg-[var(--bs-body-bg)] shadow-xl"
            style={{ maxHeight: "calc(100vh - 24px)" }}
          >
            <div className="d-flex flex-shrink-0 justify-content-between align-items-center border-bottom p-4">
              <h5 className="m-0 fw-bold text-body-emphasis">
                Import Mô tả công việc (JD)
              </h5>
              <button
                className="btn btn-sm btn-light border"
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setImportFilesList([]);
                  setImportMessage("");
                }}
              >
                Đóng
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto" style={{ minHeight: "0", flex: "1" }}>
              <div className="mb-4">
                <label className="form-label fw-semibold">Chọn phòng ban nhận import <span className="text-danger">*</span></label>
                <TailwindDropdown
                  onChange={setImportDepartmentId}
                  options={departments.map((d) => ({ label: d.name, value: d.id }))}
                  placeholder="Chọn phòng ban"
                  value={importDepartmentId}
                  disabled={Boolean(filterDepartmentId)}
                />
              </div>

              <div className="mb-4">
                <label className="form-label fw-semibold">Chọn file import (.json, .csv, .txt) <span className="text-danger">*</span></label>
                <div
                  className="border border-dashed rounded p-4 text-center cursor-pointer hover:bg-body-secondary/20 transition-colors"
                  onClick={() => modalFileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.dataTransfer.files.length > 0) {
                      setImportFilesList(Array.from(e.dataTransfer.files));
                    }
                  }}
                  style={{ borderColor: "#cbd5e1" }}
                >
                  <input
                    ref={modalFileInputRef}
                    type="file"
                    className="d-none"
                    accept=".json,.csv,.txt"
                    multiple
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setImportFilesList(Array.from(e.target.files));
                      }
                    }}
                  />
                  <div className="text-primary mb-2">
                    <UploadIcon />
                  </div>
                  <div className="fw-semibold text-body-emphasis mb-1" style={{ fontSize: "14px" }}>
                    Kéo thả file hoặc click để chọn file
                  </div>
                  <span className="text-body-secondary small">
                    Hỗ trợ định dạng .json, .csv hoặc .txt
                  </span>
                </div>

                {importFilesList.length > 0 && (
                  <div className="mt-3">
                    <div className="fw-semibold small text-body-emphasis mb-2">Các file đã chọn ({importFilesList.length}):</div>
                    <div className="border rounded overflow-hidden" style={{ maxHeight: "150px", overflowY: "auto" }}>
                      <ul className="list-group list-group-flush">
                        {importFilesList.map((file, idx) => (
                          <li key={idx} className="list-group-item d-flex justify-content-between align-items-center py-2 px-3 bg-body" style={{ fontSize: "13px" }}>
                            <span className="text-truncate me-2" style={{ maxWidth: '85%' }}>{file.name}</span>
                            <button
                              type="button"
                              className="btn-close"
                              style={{ fontSize: '10px', padding: "0.25rem" }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setImportFilesList((prev) => prev.filter((_, i) => i !== idx));
                              }}
                            ></button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {importMessage && (
                <div className="alert alert-info py-2 px-3 small mb-0" role="alert">
                  {importMessage}
                </div>
              )}
            </div>

            <div className="d-flex flex-shrink-0 justify-content-end gap-2 border-top p-4">
              <button
                type="button"
                className="btn btn-light border"
                onClick={() => {
                  setShowImportModal(false);
                  setImportFilesList([]);
                  setImportMessage("");
                }}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={actionLoading || !importDepartmentId || importFilesList.length === 0}
                onClick={() => void importFiles(importFilesList, importDepartmentId)}
              >
                {actionLoading ? "Đang import..." : "Bắt đầu Import"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function Field({ children, label, required = false, wide = false }) {
  return (
    <div className={wide ? "col-12" : "col-md-6"}>
      <label className="form-label fw-semibold">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      {children}
    </div>
  );
}

function InfoBlock({ items, title }) {
  const safeItems = items.length > 0 ? items : ["Chưa khai báo."];

  return (
    <div className="mt-4 first:mt-0">
      <h6 className="fw-bold text-body-emphasis mb-2">{title}</h6>
      <ul className="mb-0 ps-3 text-body-secondary" style={{ lineHeight: 1.7 }}>
        {safeItems.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="17 8 12 3 7 8"></polyline>
      <line x1="12" y1="3" x2="12" y2="15"></line>
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"></path>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"></path>
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"></path>
      <line x1="1" y1="1" x2="23" y2="23"></line>
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
      <path d="M10 11v6"></path>
      <path d="M14 11v6"></path>
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      className="position-absolute text-body-secondary"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      style={{ left: "16px", top: "50%", transform: "translateY(-50%)" }}
    >
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  );
}
