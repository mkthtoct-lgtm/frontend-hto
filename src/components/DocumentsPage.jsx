import { useEffect, useMemo, useState } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? "/api/v1" : "http://qlnb-api.hto.edu.vn/api/v1");

const ADMIN_ROLE_ID = "69fc5af582ef85451120772a";
const DEPARTMENT_HEAD_ROLE_ID = "69fc5af582ef85451120772c";

const canUploadDocument = (user) =>
  ["admin", "truongbophan"].includes(user?.role) ||
  [ADMIN_ROLE_ID, DEPARTMENT_HEAD_ROLE_ID].includes(user?.roleId);

const initialCategories = [
  { id: 1, name: "Hành chính", description: "Biểu mẫu nội bộ", isHidden: false },
  { id: 2, name: "Nhân sự", description: "Hợp đồng, nghỉ phép", isHidden: false },
  { id: 3, name: "Kế toán", description: "Phiếu thu/chi", isHidden: false },
];

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

const normalizeCategory = (category) => ({
  id: category.id || category._id,
  name: category.name || "",
  description: category.description || "",
  isHidden: Boolean(category.isHidden ?? category.hidden),
});

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
  const [categories, setCategories] = useState(initialCategories);
  const [documents, setDocuments] = useState(initialDocuments);
  const [activeCategory, setActiveCategory] = useState("all");
  const [categoryPage, setCategoryPage] = useState(1);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categoryActionLoading, setCategoryActionLoading] = useState(false);
  const [categoryError, setCategoryError] = useState("");
  const [uploadForm, setUploadForm] = useState(emptyUploadForm);
  const [uploadErrors, setUploadErrors] = useState({});
  const [uploadSuccess, setUploadSuccess] = useState("");

  const canUpload = canUploadDocument(currentUser);

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [String(c.id), c])),
    [categories],
  );
  const departmentMap = useMemo(
    () => new Map(initialDepartments.map((department) => [department.id, department])),
    [],
  );

  const visibleCategories = categories.filter((c) => !c.isHidden);
  const categoryPageCount = Math.max(1, Math.ceil(categories.length / CATEGORY_PAGE_SIZE));
  const safeCategoryPage = Math.min(categoryPage, categoryPageCount);
  const paginatedCategories = categories.slice(
    (safeCategoryPage - 1) * CATEGORY_PAGE_SIZE,
    safeCategoryPage * CATEGORY_PAGE_SIZE,
  );
  const filteredDocuments = documents.filter((doc) => {
    if (activeCategory === "all") return true;
    return String(doc.categoryId) === activeCategory;
  });

  useEffect(() => {
    let isMounted = true;

    const loadCategories = async () => {
      setCategoryLoading(true);
      setCategoryError("");

      try {
        const categoryData = await getDocumentCategories();

        if (isMounted && categoryData.length > 0) {
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
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;

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
    setEditingId(category.id);
    setForm({ name: category.name, description: category.description });
  };

  const toggleHidden = async (categoryId) => {
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
      description: uploadForm.description.trim(),
    };

    setDocuments((prev) => [uploadedDocument, ...prev]);
    setUploadForm(emptyUploadForm);
    setUploadErrors({});
    setUploadSuccess("Đã thêm tài liệu vào danh sách tạm thời.");
  };

  return (
    <div className="container-fluid">
      <div className="app-page-head d-flex flex-wrap gap-3 align-items-center justify-content-between">
        <div className="clearfix">
          <h1 className="app-page-title mb-0">Tài Liệu & Biểu Mẫu</h1>
          <p className="text-body mb-0">Quản lý danh mục và danh sách tài liệu</p>
        </div>
      </div>

      <div className="row g-3">
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

        <div className="col-xxl-8">
          <div className="card">
            <div className="card-header border-0 pb-0 d-flex justify-content-between align-items-center">
              <h6 className="card-title mb-0">Danh mục tài liệu</h6>
              <span className="badge bg-primary-subtle text-primary">
                {categoryLoading
                  ? "Đang tải..."
                  : `${visibleCategories.length} danh mục đang dùng`}
              </span>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table align-middle">
                  <thead>
                    <tr>
                      <th>Tên danh mục</th>
                      <th>Mô tả</th>
                      <th className="text-nowrap" style={{ width: "120px" }}>
                        Trạng thái
                      </th>
                      <th className="text-center text-nowrap" style={{ width: "96px" }}>
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCategories.map((category) => (
                      <tr key={category.id}>
                        <td>{category.name}</td>
                        <td>{category.description || "-"}</td>
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
                      </tr>
                    ))}
                    {paginatedCategories.length === 0 && (
                      <tr>
                        <td colSpan="4" className="text-center text-body-secondary py-4">
                          Chưa có danh mục tài liệu.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {categories.length > CATEGORY_PAGE_SIZE && (
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-3">
                  <span className="text-body-secondary" style={{ fontSize: "13px" }}>
                    Hiển thị {(safeCategoryPage - 1) * CATEGORY_PAGE_SIZE + 1}-
                    {Math.min(safeCategoryPage * CATEGORY_PAGE_SIZE, categories.length)} trong{" "}
                    {categories.length} danh mục
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

      <div className="card mt-3">
        <div className="card-header border-0 pb-0 d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div>
            <h6 className="card-title mb-1">Upload tài liệu</h6>
            <span className="text-body-secondary" style={{ fontSize: "13px" }}>
              Admin và trưởng bộ phận có thể thêm file hoặc link kèm metadata.
            </span>
          </div>
          <span className={`badge ${canUpload ? "bg-success-subtle text-success" : "bg-warning-subtle text-warning"}`}>
            {canUpload ? "Có quyền upload" : "Chỉ xem"}
          </span>
        </div>
        <div className="card-body">
          {!canUpload && (
            <div className="alert alert-warning py-2" role="alert">
              Tài khoản hiện tại không có quyền upload tài liệu.
            </div>
          )}

          {uploadSuccess && (
            <div className="alert alert-success py-2" role="alert">
              {uploadSuccess}
            </div>
          )}

          <form noValidate onSubmit={handleUploadSubmit}>
            <fieldset disabled={!canUpload} className="border-0 p-0 m-0">
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

      <div className="card mt-3">
        <div className="card-header border-0 pb-0 d-flex justify-content-between align-items-center">
          <h6 className="card-title mb-0">Danh sách tài liệu</h6>
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
                  <th>Phòng ban nhận</th>
                  <th>Nguồn</th>
                  <th>Cập nhật</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.map((doc) => (
                  <tr key={doc.id}>
                    <td>
                      <div className="fw-semibold text-body-emphasis">{doc.title}</div>
                      {doc.description && (
                        <div className="text-body-secondary" style={{ fontSize: "12px" }}>
                          {doc.description}
                        </div>
                      )}
                    </td>
                    <td>{categoryMap.get(String(doc.categoryId))?.name || "Danh mục ẩn"}</td>
                    <td>{departmentMap.get(doc.departmentId)?.name || "-"}</td>
                    <td>
                      <span className="badge bg-body-secondary text-body">
                        {doc.sourceType === "link" ? "Link" : "File"}
                      </span>
                      <span className="ms-2 text-body-secondary" style={{ fontSize: "12px" }}>
                        {doc.sourceName || "-"}
                      </span>
                    </td>
                    <td>{doc.updatedAt}</td>
                    <td>{doc.status}</td>
                  </tr>
                ))}
                {filteredDocuments.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center text-body">
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

