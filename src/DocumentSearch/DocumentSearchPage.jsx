import { useCallback, useEffect, useMemo, useState } from "react";
import "./DocumentSearchPage.css";

const API_BASE_URL = "http://localhost:3000/api/v1";
const USE_MOCK_WHEN_API_FAIL = true;
const PAGE_SIZE = 6;

const MOCK_DOCUMENTS = [
  {
    id: "doc-001",
    title: "Biểu mẫu thông tin khách hàng du học Đức",
    description: "Form thu thập thông tin khách hàng quan tâm chương trình du học Đức.",
    category: "Biểu mẫu",
    department: "Tư vấn du học",
    fileType: "DOCX",
    status: "active",
    version: "v1.3",
    ownerName: "Phòng tư vấn",
    updatedAt: "2026-05-24",
    downloadCount: 128,
    tags: ["du học", "khách hàng", "form"],
    url: "#"
  },
  {
    id: "doc-002",
    title: "Checklist hồ sơ visa du học",
    description: "Danh sách giấy tờ cần kiểm tra trước khi nộp hồ sơ visa.",
    category: "Checklist",
    department: "Visa",
    fileType: "PDF",
    status: "active",
    version: "v2.0",
    ownerName: "Bộ phận Visa",
    updatedAt: "2026-05-22",
    downloadCount: 95,
    tags: ["visa", "checklist", "hồ sơ"],
    url: "#"
  },
  {
    id: "doc-003",
    title: "SOP xử lý lead từ website",
    description: "Quy trình tiếp nhận lead, phân loại, gán tư vấn viên và cập nhật CRM.",
    category: "SOP",
    department: "CRM",
    fileType: "PDF",
    status: "active",
    version: "v1.1",
    ownerName: "Trưởng bộ phận CRM",
    updatedAt: "2026-05-20",
    downloadCount: 76,
    tags: ["lead", "crm", "sop"],
    url: "#"
  },
  {
    id: "doc-004",
    title: "Chính sách phân quyền tài khoản nội bộ",
    description: "Mô tả quyền truy cập theo vai trò Admin, Ban giám đốc, Trưởng bộ phận, Nhân sự.",
    category: "Chính sách",
    department: "Hệ thống",
    fileType: "PDF",
    status: "active",
    version: "v1.5",
    ownerName: "Admin hệ thống",
    updatedAt: "2026-05-18",
    downloadCount: 44,
    tags: ["role", "permission", "security"],
    url: "#"
  },
  {
    id: "doc-005",
    title: "Template hợp đồng dịch vụ tư vấn",
    description: "Mẫu hợp đồng dành cho khách hàng sử dụng dịch vụ tư vấn du học, visa hoặc định cư.",
    category: "Hợp đồng",
    department: "Pháp lý",
    fileType: "DOCX",
    status: "active",
    version: "v3.2",
    ownerName: "Phòng Pháp lý",
    updatedAt: "2026-05-16",
    downloadCount: 221,
    tags: ["hợp đồng", "dịch vụ", "template"],
    url: "#"
  },
  {
    id: "doc-006",
    title: "Bảng giá dịch vụ tham khảo",
    description: "Bảng giá dùng nội bộ cho tư vấn viên khi trao đổi sơ bộ với khách hàng.",
    category: "Bảng giá",
    department: "Kinh doanh",
    fileType: "XLSX",
    status: "active",
    version: "v2.4",
    ownerName: "Phòng Kinh doanh",
    updatedAt: "2026-05-15",
    downloadCount: 183,
    tags: ["bảng giá", "sale", "tư vấn"],
    url: "#"
  },
  {
    id: "doc-007",
    title: "Tài liệu đào tạo tư vấn viên mới",
    description: "Tài liệu onboarding dành cho nhân sự mới trong đội tư vấn.",
    category: "Đào tạo",
    department: "Nhân sự",
    fileType: "PDF",
    status: "active",
    version: "v1.0",
    ownerName: "Phòng Nhân sự",
    updatedAt: "2026-05-12",
    downloadCount: 58,
    tags: ["đào tạo", "onboarding", "tư vấn"],
    url: "#"
  },
  {
    id: "doc-008",
    title: "Quy trình xử lý khiếu nại khách hàng",
    description: "Hướng dẫn phân loại, tiếp nhận và xử lý phản hồi hoặc khiếu nại của khách hàng.",
    category: "SOP",
    department: "Chăm sóc khách hàng",
    fileType: "PDF",
    status: "draft",
    version: "v0.9",
    ownerName: "CSKH",
    updatedAt: "2026-05-10",
    downloadCount: 17,
    tags: ["khiếu nại", "cskh", "quy trình"],
    url: "#"
  }
];

const STATUS_META = {
  active: { label: "Đang dùng", className: "doc-status-active" },
  draft: { label: "Bản nháp", className: "doc-status-draft" },
  archived: { label: "Lưu trữ", className: "doc-status-archived" }
};

const normalizeArrayResponse = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const formatDate = (dateValue) => {
  if (!dateValue) return "—";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const getSafeId = (item) => String(item?._id || item?.id || item?.documentId || "");

export const DocumentSearchPage = ({ currentUser }) => {
  const [documents, setDocuments] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [apiMode, setApiMode] = useState("mock");
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [fileTypeFilter, setFileTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("updatedAt_desc");
  const [currentPageIndex, setCurrentPageIndex] = useState(1);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/documents`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });

      if (!response.ok) {
        throw new Error("API tài liệu chưa sẵn sàng hoặc tài khoản hiện tại chưa có quyền truy cập.");
      }

      const payload = await response.json();
      const data = normalizeArrayResponse(payload);

      setDocuments(data);
      setSelectedId((currentId) => currentId || getSafeId(data[0]));
      setApiMode("real");
    } catch (err) {
      if (!USE_MOCK_WHEN_API_FAIL) {
        setError(err.message || "Không thể tải danh sách tài liệu.");
        setDocuments([]);
      } else {
        setDocuments(MOCK_DOCUMENTS);
        setSelectedId((currentId) => currentId || MOCK_DOCUMENTS[0]?.id || "");
        setApiMode("mock");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  useEffect(() => {
    setCurrentPageIndex(1);
  }, [searchTerm, categoryFilter, departmentFilter, fileTypeFilter, statusFilter, sortBy]);

  const categories = useMemo(() => Array.from(new Set(documents.map((item) => item.category).filter(Boolean))), [documents]);
  const departments = useMemo(() => Array.from(new Set(documents.map((item) => item.department).filter(Boolean))), [documents]);
  const fileTypes = useMemo(() => Array.from(new Set(documents.map((item) => item.fileType).filter(Boolean))), [documents]);

  const filteredDocuments = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    const result = documents.filter((item) => {
      const matchSearch =
        !term ||
        String(item.title || "").toLowerCase().includes(term) ||
        String(item.description || "").toLowerCase().includes(term) ||
        String(item.ownerName || "").toLowerCase().includes(term) ||
        (item.tags || []).some((tag) => String(tag).toLowerCase().includes(term));

      return (
        matchSearch &&
        (categoryFilter === "all" || item.category === categoryFilter) &&
        (departmentFilter === "all" || item.department === departmentFilter) &&
        (fileTypeFilter === "all" || item.fileType === fileTypeFilter) &&
        (statusFilter === "all" || item.status === statusFilter)
      );
    });

    return result.sort((a, b) => {
      if (sortBy === "updatedAt_desc") return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      if (sortBy === "updatedAt_asc") return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      if (sortBy === "title_asc") return String(a.title || "").localeCompare(String(b.title || ""), "vi");
      if (sortBy === "download_desc") return Number(b.downloadCount || 0) - Number(a.downloadCount || 0);
      return 0;
    });
  }, [documents, searchTerm, categoryFilter, departmentFilter, fileTypeFilter, statusFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredDocuments.length / PAGE_SIZE));

  const paginatedDocuments = useMemo(() => {
    const startIndex = (currentPageIndex - 1) * PAGE_SIZE;
    return filteredDocuments.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredDocuments, currentPageIndex]);

  const selectedDocument = useMemo(() => {
    return documents.find((item) => getSafeId(item) === selectedId) || paginatedDocuments[0] || documents[0] || null;
  }, [documents, selectedId, paginatedDocuments]);

  const resetFilters = () => {
    setSearchTerm("");
    setCategoryFilter("all");
    setDepartmentFilter("all");
    setFileTypeFilter("all");
    setStatusFilter("all");
    setSortBy("updatedAt_desc");
  };

  const hasActiveFilters =
    searchTerm ||
    categoryFilter !== "all" ||
    departmentFilter !== "all" ||
    fileTypeFilter !== "all" ||
    statusFilter !== "all" ||
    sortBy !== "updatedAt_desc";

  const handleOpenDocument = (documentItem) => {
    if (!documentItem?.url || documentItem.url === "#") {
      alert("Đây là dữ liệu giả. Khi có API thật, hãy truyền link file vào field url.");
      return;
    }

    window.open(documentItem.url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="document-search-page container-fluid pt-3 pb-4" style={{ maxWidth: "1600px" }}>
      <div className="document-search-hero mb-4">
        <div>
          <span className="document-search-eyebrow">Document center</span>
          <h4 className="fw-bold text-body-emphasis mb-1">Tìm kiếm & lọc tài liệu</h4>
          <p className="text-body-secondary mb-0">
            Tìm nhanh tài liệu theo từ khóa, nhóm tài liệu, phòng ban, loại file, trạng thái và sắp xếp theo nhu cầu sử dụng.
          </p>
        </div>

        <div className="d-flex flex-wrap align-items-center justify-content-end gap-2">
          <span className={`document-api-badge ${apiMode === "real" ? "real" : "mock"}`}>
            {apiMode === "real" ? "Đang dùng API thật" : "Đang dùng dữ liệu giả"}
          </span>

          <button className="btn btn-outline-primary btn-sm" onClick={fetchDocuments} disabled={loading}>
            Đồng bộ lại
          </button>
        </div>
      </div>

      <div className="document-filter-panel mb-4">
        <div className="document-search-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>

          <input
            className="form-control form-control-sm bg-body"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Tìm theo tên tài liệu, mô tả, tag hoặc người phụ trách..."
          />
        </div>

        <select className="form-select form-select-sm bg-body document-filter-select" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
          <option value="all">Tất cả nhóm</option>
          {categories.map((category) => <option key={category} value={category}>{category}</option>)}
        </select>

        <select className="form-select form-select-sm bg-body document-filter-select" value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}>
          <option value="all">Tất cả phòng ban</option>
          {departments.map((department) => <option key={department} value={department}>{department}</option>)}
        </select>

        <select className="form-select form-select-sm bg-body document-filter-select" value={fileTypeFilter} onChange={(event) => setFileTypeFilter(event.target.value)}>
          <option value="all">Tất cả loại file</option>
          {fileTypes.map((fileType) => <option key={fileType} value={fileType}>{fileType}</option>)}
        </select>

        <select className="form-select form-select-sm bg-body document-filter-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Đang dùng</option>
          <option value="draft">Bản nháp</option>
          <option value="archived">Lưu trữ</option>
        </select>

        <select className="form-select form-select-sm bg-body document-filter-select" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
          <option value="updatedAt_desc">Mới cập nhật nhất</option>
          <option value="updatedAt_asc">Cũ nhất trước</option>
          <option value="title_asc">Tên A-Z</option>
          <option value="download_desc">Tải nhiều nhất</option>
        </select>

        {hasActiveFilters && (
          <button className="btn btn-outline-secondary btn-sm document-reset-btn" onClick={resetFilters}>
            Xóa lọc
          </button>
        )}
      </div>

      {error && <div className="alert alert-danger py-2">{error}</div>}

      <div className="row g-3 align-items-start">
        <div className="col-12 col-xl-8">
          <div className="document-table-card">
            <div className="d-flex justify-content-between align-items-center gap-3 p-3 border-bottom">
              <div>
                <h6 className="fw-bold mb-0">Danh sách tài liệu</h6>
                <span className="text-body-secondary small">{filteredDocuments.length} kết quả phù hợp</span>
              </div>
            </div>

            <div className="table-responsive">
              <table className="table document-table table-hover mb-0 align-middle">
                <thead>
                  <tr>
                    <th style={{ width: "34%" }}>Tài liệu</th>
                    <th style={{ width: "14%" }}>Nhóm</th>
                    <th style={{ width: "14%" }}>Phòng ban</th>
                    <th style={{ width: "10%" }}>Loại</th>
                    <th style={{ width: "12%" }}>Trạng thái</th>
                    <th style={{ width: "16%" }}>Cập nhật</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="text-center py-5">
                        <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
                      </td>
                    </tr>
                  ) : paginatedDocuments.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-5 text-body-secondary">Không tìm thấy tài liệu phù hợp.</td>
                    </tr>
                  ) : (
                    paginatedDocuments.map((item) => {
                      const itemId = getSafeId(item);
                      const statusMeta = STATUS_META[item.status] || STATUS_META.draft;

                      return (
                        <tr
                          key={itemId}
                          className={selectedDocument && getSafeId(selectedDocument) === itemId ? "selected-row" : ""}
                          onClick={() => setSelectedId(itemId)}
                        >
                          <td>
                            <div className="fw-bold text-body-emphasis">{item.title}</div>
                            <div className="text-body-secondary small document-line-clamp">{item.description}</div>
                          </td>
                          <td>{item.category || "—"}</td>
                          <td>{item.department || "—"}</td>
                          <td><span className="document-file-pill">{item.fileType || "FILE"}</span></td>
                          <td><span className={`document-status-pill ${statusMeta.className}`}>{statusMeta.label}</span></td>
                          <td>
                            <div className="fw-semibold">{formatDate(item.updatedAt)}</div>
                            <div className="text-body-secondary small">{item.downloadCount || 0} lượt tải</div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="document-pagination-bar">
              <span className="text-body-secondary small">Trang {currentPageIndex}/{totalPages}</span>

              <div className="d-flex gap-2">
                <button className="btn btn-outline-secondary btn-sm" disabled={currentPageIndex <= 1} onClick={() => setCurrentPageIndex((page) => Math.max(1, page - 1))}>
                  Trước
                </button>

                <button className="btn btn-outline-secondary btn-sm" disabled={currentPageIndex >= totalPages} onClick={() => setCurrentPageIndex((page) => Math.min(totalPages, page + 1))}>
                  Sau
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-4">
          <div className="document-detail-panel">
            {selectedDocument ? (
              <>
                <span className="document-search-eyebrow">Chi tiết tài liệu</span>
                <h5 className="fw-bold text-body-emphasis mb-2">{selectedDocument.title}</h5>
                <p className="text-body-secondary">{selectedDocument.description}</p>

                <div className="document-meta-grid mb-4">
                  <div><span>Phiên bản</span><strong>{selectedDocument.version || "—"}</strong></div>
                  <div><span>Loại file</span><strong>{selectedDocument.fileType || "—"}</strong></div>
                  <div><span>Phòng ban</span><strong>{selectedDocument.department || "—"}</strong></div>
                  <div><span>Người phụ trách</span><strong>{selectedDocument.ownerName || "—"}</strong></div>
                </div>

                <div className="mb-4">
                  <div className="small text-body-secondary mb-2">Tag tìm kiếm</div>
                  <div className="d-flex flex-wrap gap-2">
                    {(selectedDocument.tags || []).map((tag) => <span key={tag} className="document-tag-pill">{tag}</span>)}
                  </div>
                </div>

                <button className="btn btn-primary w-100" onClick={() => handleOpenDocument(selectedDocument)}>
                  Mở tài liệu
                </button>
              </>
            ) : (
              <div className="text-center py-5 text-body-secondary">Chọn một tài liệu để xem chi tiết.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
