import { useMemo, useRef, useState } from "react";

const ADMIN_ROLE_ID = "69fc5af582ef85451120772a";
const JD_STORAGE_KEY = "hto_job_descriptions";

const ROLE_OPTIONS = [
  { id: "admin", label: "Admin" },
  { id: "bangiamdoc", label: "Ban giám đốc" },
  { id: "truongbophan", label: "Trưởng bộ phận" },
  { id: "nhansu", label: "Nhân sự" },
  { id: "daily", label: "Đại lý" },
  { id: "congtacvien", label: "Cộng tác viên" },
  { id: "user", label: "Người dùng" },
];

const ROLE_LABELS = Object.fromEntries(ROLE_OPTIONS.map((role) => [role.id, role.label]));

const DEPARTMENT_OPTIONS = [
  { id: "dept-ban-giam-doc", name: "Ban Giám Đốc" },
  { id: "dept-tuyen-sinh", name: "Tuyển Sinh" },
  { id: "dept-ho-so", name: "Hồ Sơ" },
  { id: "dept-hanh-chinh", name: "Hành Chính" },
  { id: "dept-nhan-su", name: "Nhân Sự" },
  { id: "dept-ke-toan", name: "Kế Toán" },
];

const DEPARTMENT_LABELS = Object.fromEntries(
  DEPARTMENT_OPTIONS.map((department) => [department.id, department.name]),
);

const emptyForm = {
  title: "",
  departmentId: "dept-nhan-su",
  role: "nhansu",
  level: "Nhân viên",
  reportsTo: "",
  summary: "",
  responsibilities: "",
  requirements: "",
  kpis: "",
  hidden: false,
};

const DEFAULT_JOB_DESCRIPTIONS = [
  {
    id: "jd-ceo",
    title: "Giám đốc điều hành",
    departmentId: "dept-ban-giam-doc",
    role: "bangiamdoc",
    level: "Lãnh đạo",
    reportsTo: "Hội đồng quản trị",
    updatedAt: "2026-05-20",
    hidden: false,
    summary: "Điều hành tổng thể hoạt động kinh doanh, nhân sự, vận hành và chất lượng dịch vụ của HTO.",
    responsibilities: [
      "Xây dựng mục tiêu, kế hoạch vận hành và chỉ tiêu kinh doanh theo quý.",
      "Phê duyệt chính sách, ngân sách và các quyết định nhân sự quan trọng.",
      "Theo dõi hiệu quả các phòng ban và xử lý các vấn đề liên phòng ban.",
      "Đại diện công ty trong các quan hệ đối tác chiến lược.",
    ],
    requirements: [
      "Kinh nghiệm quản lý đội ngũ hoặc vận hành doanh nghiệp dịch vụ.",
      "Năng lực hoạch định chiến lược, quản trị rủi ro và ra quyết định.",
      "Giao tiếp tốt, chịu trách nhiệm với kết quả cuối cùng.",
    ],
    kpis: ["Doanh thu quý", "Tỷ lệ hoàn thành kế hoạch", "Hiệu suất phòng ban"],
  },
  {
    id: "jd-hr-specialist",
    title: "Chuyên viên nhân sự",
    departmentId: "dept-nhan-su",
    role: "nhansu",
    level: "Nhân viên",
    reportsTo: "Trưởng phòng Nhân Sự",
    updatedAt: "2026-05-18",
    hidden: false,
    summary: "Quản lý hồ sơ nhân sự, tuyển dụng, chấm công và hỗ trợ các hoạt động nội bộ.",
    responsibilities: [
      "Cập nhật hồ sơ nhân sự, hợp đồng, quyết định và thông tin phòng ban.",
      "Phối hợp tuyển dụng, đặt lịch phỏng vấn và theo dõi onboarding.",
      "Tổng hợp chấm công, nghỉ phép và dữ liệu phục vụ tính lương.",
      "Hỗ trợ truyền thông nội bộ và giải đáp chính sách nhân sự.",
    ],
    requirements: [
      "Nắm nghiệp vụ nhân sự căn bản và bảo mật dữ liệu cá nhân.",
      "Sử dụng tốt Excel/Google Sheets và các công cụ quản lý nội bộ.",
      "Cẩn thận, giao tiếp rõ ràng, xử lý tình huống mềm mỏng.",
    ],
    kpis: ["Tỷ lệ cập nhật hồ sơ đúng hạn", "Thời gian tuyển dụng", "Mức độ hài lòng nội bộ"],
  },
  {
    id: "jd-admission-consultant",
    title: "Tư vấn tuyển sinh",
    departmentId: "dept-tuyen-sinh",
    role: "user",
    level: "Nhân viên",
    reportsTo: "Trưởng bộ phận Tuyển Sinh",
    updatedAt: "2026-05-17",
    hidden: false,
    summary: "Tư vấn chương trình du học, chăm sóc học viên tiềm năng và chuyển đổi hồ sơ đầu vào.",
    responsibilities: [
      "Tiếp nhận lead, tư vấn lộ trình phù hợp và cập nhật trạng thái chăm sóc.",
      "Chuẩn bị thông tin chương trình, học phí, điều kiện và timeline cho khách hàng.",
      "Phối hợp bộ phận hồ sơ để bàn giao thông tin học viên sau khi ký hợp đồng.",
      "Theo dõi phản hồi khách hàng và đề xuất cải thiện kịch bản tư vấn.",
    ],
    requirements: [
      "Kỹ năng tư vấn, thuyết phục và chăm sóc khách hàng.",
      "Hiểu quy trình du học hoặc có khả năng học nhanh sản phẩm giáo dục.",
      "Chủ động theo đuổi mục tiêu, ghi nhận dữ liệu đầy đủ trên hệ thống.",
    ],
    kpis: ["Số lead được xử lý", "Tỷ lệ chuyển đổi", "Tỷ lệ phản hồi đúng SLA"],
  },
  {
    id: "jd-document-specialist",
    title: "Chuyên viên hồ sơ",
    departmentId: "dept-ho-so",
    role: "user",
    level: "Nhân viên",
    reportsTo: "Trưởng bộ phận Hồ Sơ",
    updatedAt: "2026-05-16",
    hidden: false,
    summary: "Theo dõi, kiểm tra và hoàn thiện bộ hồ sơ du học theo yêu cầu từng chương trình.",
    responsibilities: [
      "Kiểm tra checklist hồ sơ, nhắc bổ sung giấy tờ và cập nhật tiến độ.",
      "Soạn, rà soát biểu mẫu, bản dịch và tài liệu nộp trường/visa.",
      "Phối hợp tư vấn viên và học viên để xử lý các điểm thiếu hoặc sai thông tin.",
      "Lưu trữ hồ sơ theo đúng cấu trúc và quy định bảo mật.",
    ],
    requirements: [
      "Cẩn thận, có khả năng đọc hiểu biểu mẫu và quy trình tài liệu.",
      "Quản lý deadline tốt, ưu tiên công việc theo mức độ rủi ro.",
      "Có kinh nghiệm hồ sơ du học/visa là lợi thế.",
    ],
    kpis: ["Tỷ lệ hồ sơ đúng hạn", "Số lỗi hồ sơ", "Thời gian xử lý checklist"],
  },
];

const isAdmin = (user) => user?.role === "admin" || user?.roleId === ADMIN_ROLE_ID;

const getDepartmentName = (departmentId) => DEPARTMENT_LABELS[departmentId] || departmentId || "Chưa gán";

const getRoleLabel = (role) => ROLE_LABELS[role] || role || "Chưa gán";

const formatDate = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value || "-";
  }

  return date.toLocaleDateString("vi-VN");
};

const splitListText = (value) =>
  Array.isArray(value)
    ? value.map(String).map((item) => item.trim()).filter(Boolean)
    : String(value || "")
        .split(/\r?\n|;|\|/g)
        .map((item) => item.trim())
        .filter(Boolean);

const listToFormText = (items) => (Array.isArray(items) ? items.join("\n") : String(items || ""));

const normalizeJd = (input, index = 0) => {
  const now = new Date().toISOString().slice(0, 10);
  const title = String(input?.title || input?.["ten vi tri"] || input?.position || "").trim();

  return {
    id: String(input?.id || `jd-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`),
    title: title || `JD mới ${index + 1}`,
    departmentId: String(input?.departmentId || input?.department || "dept-nhan-su").trim(),
    role: String(input?.role || "nhansu").trim(),
    level: String(input?.level || "Nhân viên").trim(),
    reportsTo: String(input?.reportsTo || input?.manager || "").trim(),
    updatedAt: String(input?.updatedAt || now).trim(),
    hidden: Boolean(input?.hidden),
    summary: String(input?.summary || input?.description || "").trim(),
    responsibilities: splitListText(input?.responsibilities || input?.tasks),
    requirements: splitListText(input?.requirements),
    kpis: splitListText(input?.kpis || input?.kpi),
  };
};

const readStoredJds = () => {
  try {
    const storedValue = window.localStorage.getItem(JD_STORAGE_KEY);

    if (!storedValue) {
      window.localStorage.setItem(JD_STORAGE_KEY, JSON.stringify(DEFAULT_JOB_DESCRIPTIONS));
      return DEFAULT_JOB_DESCRIPTIONS;
    }

    const parsedValue = JSON.parse(storedValue);
    const rows = Array.isArray(parsedValue) ? parsedValue : parsedValue?.items || [];

    return rows.map(normalizeJd);
  } catch {
    window.localStorage.setItem(JD_STORAGE_KEY, JSON.stringify(DEFAULT_JOB_DESCRIPTIONS));
    return DEFAULT_JOB_DESCRIPTIONS;
  }
};

const writeStoredJds = (items) => {
  window.localStorage.setItem(JD_STORAGE_KEY, JSON.stringify(items));
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

const parseImportedJds = (text, fileName) => {
  const trimmedText = text.trim();

  if (!trimmedText) {
    return [];
  }

  if (fileName.toLowerCase().endsWith(".json") || trimmedText.startsWith("[") || trimmedText.startsWith("{")) {
    const parsedValue = JSON.parse(trimmedText);
    const rows = Array.isArray(parsedValue) ? parsedValue : parsedValue.items || [parsedValue];

    return rows.map(normalizeJd);
  }

  if (fileName.toLowerCase().endsWith(".csv")) {
    return parseCsv(trimmedText).map(normalizeJd);
  }

  return [
    normalizeJd({
      title: fileName.replace(/\.[^.]+$/, "") || "JD import",
      summary: trimmedText.slice(0, 500),
      responsibilities: trimmedText,
    }),
  ];
};

const formFromJd = (jd) => ({
  title: jd.title,
  departmentId: jd.departmentId,
  role: jd.role,
  level: jd.level,
  reportsTo: jd.reportsTo,
  summary: jd.summary,
  responsibilities: listToFormText(jd.responsibilities),
  requirements: listToFormText(jd.requirements),
  kpis: listToFormText(jd.kpis),
  hidden: Boolean(jd.hidden),
});

const jdFromForm = (form, id) =>
  normalizeJd({
    id,
    ...form,
    responsibilities: splitListText(form.responsibilities),
    requirements: splitListText(form.requirements),
    kpis: splitListText(form.kpis),
    updatedAt: new Date().toISOString().slice(0, 10),
  });

export const JobDescriptionsPage = ({ currentUser }) => {
  const [jds, setJds] = useState(() => readStoredJds());
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedJdId, setSelectedJdId] = useState("");
  const [formMode, setFormMode] = useState(null);
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [importMessage, setImportMessage] = useState("");
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const canManage = isAdmin(currentUser);

  const visibleJds = useMemo(() => {
    if (canManage) {
      return jds;
    }

    return jds.filter((jd) => !jd.hidden && jd.role === currentUser?.role);
  }, [canManage, currentUser?.role, jds]);

  const filteredJds = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return visibleJds.filter((jd) => {
      const matchesDepartment = departmentFilter === "all" || jd.departmentId === departmentFilter;
      const matchesRole = roleFilter === "all" || jd.role === roleFilter;
      const matchesKeyword =
        !keyword ||
        `${jd.title} ${jd.summary} ${getDepartmentName(jd.departmentId)} ${getRoleLabel(jd.role)}`
          .toLowerCase()
          .includes(keyword);

      return matchesDepartment && matchesRole && matchesKeyword;
    });
  }, [departmentFilter, roleFilter, searchTerm, visibleJds]);

  const selectedJd =
    filteredJds.find((jd) => jd.id === selectedJdId) || filteredJds[0] || visibleJds[0] || null;

  const saveJds = (nextJds) => {
    setJds(nextJds);
    writeStoredJds(nextJds);
  };

  const openCreateForm = () => {
    setFormMode("create");
    setEditingId("");
    setForm(emptyForm);
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
    setForm(emptyForm);
    setFormError("");
  };

  const updateForm = (field, value) => {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
  };

  const submitForm = (event) => {
    event.preventDefault();

    if (!form.title.trim() || !form.summary.trim()) {
      setFormError("Vui lòng nhập tên vị trí và tổng quan JD.");
      return;
    }

    const nextItem = jdFromForm(form, formMode === "edit" ? editingId : undefined);
    const nextJds =
      formMode === "edit"
        ? jds.map((jd) => (jd.id === editingId ? nextItem : jd))
        : [nextItem, ...jds];

    saveJds(nextJds);
    setSelectedJdId(nextItem.id);
    closeForm();
  };

  const deleteJd = (jd) => {
    if (!window.confirm(`Xóa JD "${jd.title}"?`)) {
      return;
    }

    const nextJds = jds.filter((item) => item.id !== jd.id);
    saveJds(nextJds);
    setSelectedJdId(nextJds[0]?.id || "");
  };

  const toggleHidden = (jd) => {
    const nextJds = jds.map((item) =>
      item.id === jd.id
        ? { ...item, hidden: !item.hidden, updatedAt: new Date().toISOString().slice(0, 10) }
        : item,
    );

    saveJds(nextJds);
  };

  const importFiles = async (files) => {
    const fileList = Array.from(files || []);

    if (fileList.length === 0) {
      return;
    }

    try {
      const importedGroups = await Promise.all(
        fileList.map(async (file) => parseImportedJds(await file.text(), file.name)),
      );
      const importedJds = importedGroups.flat();

      if (importedJds.length === 0) {
        setImportMessage("File import không có JD hợp lệ.");
        return;
      }

      saveJds([...importedJds, ...jds]);
      setSelectedJdId(importedJds[0].id);
      setImportMessage(`Đã import ${importedJds.length} JD từ ${fileList.length} file.`);
    } catch (error) {
      setImportMessage(error instanceof Error ? error.message : "Không thể import file JD.");
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragActive(false);

    if (!canManage) {
      return;
    }

    if (event.dataTransfer.files.length > 0) {
      void importFiles(event.dataTransfer.files);
      return;
    }

    const droppedText = event.dataTransfer.getData("text/plain");

    if (droppedText.trim()) {
      const importedJds = parseImportedJds(droppedText, "noi-dung-keo-tha.txt");

      saveJds([...importedJds, ...jds]);
      setSelectedJdId(importedJds[0]?.id || "");
      setImportMessage(`Đã tạo ${importedJds.length} JD từ nội dung kéo thả.`);
    }
  };

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
          <h4 className="fw-bold text-body-emphasis mb-1">JD vị trí / phòng ban</h4>
        </div>
        {canManage ? (
          <div className="d-flex flex-wrap justify-content-end gap-2">
            <input
              ref={fileInputRef}
              type="file"
              className="d-none"
              accept=".json,.csv,.txt"
              multiple
              onChange={(event) => {
                void importFiles(event.target.files);
                event.target.value = "";
              }}
            />
            <button className="btn btn-outline-primary d-flex align-items-center gap-2" onClick={() => fileInputRef.current?.click()}>
              <UploadIcon />
              Import JD
            </button>
            <button className="btn btn-primary d-flex align-items-center gap-2" onClick={openCreateForm}>
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
              type="text"
              className="form-control bg-body ps-5"
              placeholder="Tìm theo vị trí, phòng ban hoặc nội dung JD..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
        </div>
        <div className="col-12 col-md-6 col-lg-3">
          <select
            className="form-select bg-body"
            value={departmentFilter}
            onChange={(event) => setDepartmentFilter(event.target.value)}
          >
            <option value="all">Tất cả phòng ban</option>
            {DEPARTMENT_OPTIONS.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
        </div>
        <div className="col-12 col-md-6 col-lg-3">
          <select
            className="form-select bg-body"
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            disabled={!canManage}
          >
            <option value="all">Tất cả role</option>
            {ROLE_OPTIONS.map((role) => (
              <option key={role.id} value={role.id}>
                {role.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-12 col-xl-5">
          <section className="card border-0 shadow-sm h-100">
            <div className="card-header bg-transparent border-bottom d-flex justify-content-between align-items-center">
              <span className="fw-bold text-body-emphasis">Danh sách JD</span>
              <span className="badge bg-body-secondary text-body">{filteredJds.length}</span>
            </div>
            <div className="card-body p-0">
              {filteredJds.length === 0 ? (
                <div className="text-center text-body-secondary py-5 px-3">
                  Không tìm thấy JD phù hợp.
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {filteredJds.map((jd) => (
                    <button
                      key={jd.id}
                      type="button"
                      className={`list-group-item list-group-item-action border-0 border-bottom p-3 text-start ${
                        selectedJd?.id === jd.id ? "bg-primary-subtle" : "bg-transparent"
                      }`}
                      onClick={() => setSelectedJdId(jd.id)}
                    >
                      <div className="d-flex justify-content-between align-items-start gap-2">
                        <div style={{ minWidth: 0 }}>
                          <div className="fw-bold text-body-emphasis text-truncate">{jd.title}</div>
                         
                        </div>
                        <div className="d-flex flex-column align-items-end gap-1 flex-shrink-0">
                          <span className="badge bg-body text-body border">{jd.level}</span>
                          {jd.hidden && <span className="badge bg-warning-subtle text-warning">Đang ẩn</span>}
                        </div>
                      </div>
                      <p className="text-body-secondary mb-0 mt-2" style={{ fontSize: "13px", lineHeight: 1.45 }}>
                        {jd.summary}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="col-12 col-xl-7">
          {selectedJd ? (
            <section className="card border-0 shadow-sm h-100">
              <div className="card-header bg-transparent border-bottom">
                <div className="d-flex justify-content-between align-items-start gap-3">
                  <div style={{ minWidth: 0 }}>
                    <h5 className="fw-bold text-body-emphasis mb-1">{selectedJd.title}</h5>
                    <div className="text-body-secondary" style={{ fontSize: "13px" }}>
                       Chức vụ được xem: {getRoleLabel(selectedJd.role)}
                    </div>
                  </div>
                  <div className="d-flex flex-column align-items-end gap-2 flex-shrink-0">
                    <div className="d-flex flex-wrap gap-2 justify-content-end">
                      {selectedJd.hidden && <span className="badge bg-warning-subtle text-warning">Ẩn</span>}
                      <span className="badge bg-primary-subtle text-primary">{selectedJd.level}</span>
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
                          onClick={() => openEditForm(selectedJd)}
                        >
                          <EditIcon />
                        </button>
                        <button
                          className="btn btn-sm btn-outline-warning d-inline-flex align-items-center justify-content-center"
                          style={{ width: "34px", height: "34px", padding: 0 }}
                          title={selectedJd.hidden ? "Hiện JD" : "Ẩn JD"}
                          aria-label={selectedJd.hidden ? "Hiện JD" : "Ẩn JD"}
                          onClick={() => toggleHidden(selectedJd)}
                        >
                          {selectedJd.hidden ? <EyeIcon /> : <EyeOffIcon />}
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger d-inline-flex align-items-center justify-content-center"
                          style={{ width: "34px", height: "34px", padding: 0 }}
                          title="Xóa JD"
                          aria-label="Xóa JD"
                          onClick={() => deleteJd(selectedJd)}
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="card-body">
                <InfoBlock title="Tổng quan" items={[selectedJd.summary]} />
                <InfoBlock title="Nhiệm vụ chính" items={selectedJd.responsibilities} ordered />
                <InfoBlock title="Yêu cầu năng lực" items={selectedJd.requirements} />
                <div className="mt-4">
                  <h6 className="fw-bold text-body-emphasis mb-2">KPI tham chiếu</h6>
                  <div className="d-flex flex-wrap gap-2">
                    {selectedJd.kpis.length > 0 ? (
                      selectedJd.kpis.map((kpi) => (
                        <span
                          key={kpi}
                          className="badge bg-success-subtle text-success border border-success-subtle px-3 py-2"
                        >
                          {kpi}
                        </span>
                      ))
                    ) : (
                      <span className="text-body-secondary">Chưa khai báo KPI.</span>
                    )}
                  </div>
                </div>
              </div>
            </section>
          ) : (
            <section className="card border-0 shadow-sm">
              <div className="card-body text-center text-body-secondary py-5">
                Chưa có JD nào phù hợp với role của tài khoản này.
              </div>
            </section>
          )}
        </div>
      </div>

      {formMode && canManage && (
        <div className="fixed inset-0 z-[1050] flex items-center justify-center bg-black/50 p-3 backdrop-blur-[2px]">
          <div
            className="flex w-full max-w-[760px] flex-col overflow-hidden rounded-xl bg-[var(--bs-body-bg)] shadow-xl"
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
                      onChange={(event) => updateForm("title", event.target.value)}
                      placeholder="Ví dụ: Chuyên viên nhân sự"
                    />
                  </Field>
                  <Field label="Cấp bậc">
                    <input
                      className="form-control"
                      value={form.level}
                      onChange={(event) => updateForm("level", event.target.value)}
                    />
                  </Field>
                  <Field label="Phòng ban">
                    <select
                      className="form-select"
                      value={form.departmentId}
                      onChange={(event) => updateForm("departmentId", event.target.value)}
                    >
                      {DEPARTMENT_OPTIONS.map((department) => (
                        <option key={department.id} value={department.id}>
                          {department.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Role được xem">
                    <select
                      className="form-select"
                      value={form.role}
                      onChange={(event) => updateForm("role", event.target.value)}
                    >
                      {ROLE_OPTIONS.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Báo cáo cho">
                    <input
                      className="form-control"
                      value={form.reportsTo}
                      onChange={(event) => updateForm("reportsTo", event.target.value)}
                    />
                  </Field>
                  <div className="col-md-6 d-flex align-items-end">
                    <label className="form-check mb-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={form.hidden}
                        onChange={(event) => updateForm("hidden", event.target.checked)}
                      />
                      <span className="form-check-label fw-semibold ms-1">Ẩn JD này</span>
                    </label>
                  </div>
                  <Field label="Tổng quan" required wide>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={form.summary}
                      onChange={(event) => updateForm("summary", event.target.value)}
                    />
                  </Field>
                  <Field label="Nhiệm vụ chính" wide>
                    <textarea
                      className="form-control"
                      rows="4"
                      value={form.responsibilities}
                      onChange={(event) => updateForm("responsibilities", event.target.value)}
                      placeholder="Mỗi dòng là một nhiệm vụ"
                    />
                  </Field>
                  <Field label="Yêu cầu năng lực" wide>
                    <textarea
                      className="form-control"
                      rows="4"
                      value={form.requirements}
                      onChange={(event) => updateForm("requirements", event.target.value)}
                      placeholder="Mỗi dòng là một yêu cầu"
                    />
                  </Field>
                  <Field label="KPI tham chiếu" wide>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={form.kpis}
                      onChange={(event) => updateForm("kpis", event.target.value)}
                      placeholder="Mỗi dòng là một KPI"
                    />
                  </Field>
                </div>
              </div>
              <div className="d-flex flex-shrink-0 justify-content-end gap-2 border-top p-4">
                <button type="button" className="btn btn-light border" onClick={closeForm}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  {formMode === "create" ? "Tạo JD" : "Lưu thay đổi"}
                </button>
              </div>
            </form>
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

function InfoBlock({ items, ordered = false, title }) {
  const ListTag = ordered ? "ol" : "ul";
  const safeItems = items.length > 0 ? items : ["Chưa khai báo."];

  return (
    <div className="mt-4 first:mt-0">
      <h6 className="fw-bold text-body-emphasis mb-2">{title}</h6>
      <ListTag className="mb-0 ps-3 text-body-secondary" style={{ lineHeight: 1.7 }}>
        {safeItems.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ListTag>
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
