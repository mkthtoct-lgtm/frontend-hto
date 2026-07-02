import { useCallback, useEffect, useMemo, useState } from "react";
import { TailwindDropdown } from "../components/ui/TailwindDropdown";
import "./SOPPage.css";

import { API_BASE_URL } from "../config/api";
const USE_MOCK_WHEN_API_FAIL = true;

const MOCK_SOPS = [
  {
    id: "sop-hr-001",
    code: "SOP-HR-001",
    title: "SOP tạo và xác thực tài khoản nhân sự",
    summary: "Quy trình tiếp nhận thông tin, tạo tài khoản, gán vai trò, phòng ban và xác thực email cho nhân sự mới.",
    category: "Nhân sự",
    department: "Phòng Nhân sự",
    ownerName: "Trưởng phòng Nhân sự",
    version: "v1.4",
    status: "published",
    effectiveDate: "2026-05-01",
    updatedAt: "2026-05-24",
    allowedRoles: ["admin", "nhansu", "bangiamdoc"],
    tags: ["onboarding", "tài khoản", "phân quyền"],
    conditions: [
      "Áp dụng cho tài khoản nhân viên nội bộ.",
      "Chỉ thực hiện sau khi hồ sơ nhân sự đã được xác nhận.",
      "Người tạo phải có quyền users:create hoặc quyền quản trị hệ thống."
    ],
    steps: [
      "Tiếp nhận thông tin nhân sự từ phòng phụ trách.",
      "Kiểm tra email, số điện thoại và phòng ban.",
      "Tạo tài khoản trên hệ thống, gán role_id và department_id phù hợp.",
      "Gửi thông tin đăng nhập ban đầu và yêu cầu đổi mật khẩu.",
      "Ghi nhận kết quả vào audit log hoặc checklist onboarding."
    ],
    relatedDocs: [
      { id: "doc-01", title: "Biểu mẫu thông tin nhân sự mới", type: "Form", url: "#" },
      { id: "doc-02", title: "Ma trận phân quyền tài khoản", type: "Policy", url: "#" }
    ]
  },
  {
    id: "sop-doc-002",
    code: "SOP-DOC-002",
    title: "SOP kiểm soát phiên bản tài liệu",
    summary: "Chuẩn hóa cách đặt mã, cập nhật version, liên kết tài liệu và duyệt SOP trước khi phát hành cho người dùng.",
    category: "Tài liệu",
    department: "Ban điều hành",
    ownerName: "Ban giám đốc",
    version: "v2.1",
    status: "published",
    effectiveDate: "2026-04-15",
    updatedAt: "2026-05-20",
    allowedRoles: ["admin", "bangiamdoc", "truongbophan", "nhansu"],
    tags: ["document", "version", "approval"],
    conditions: [
      "Mọi tài liệu SOP phát hành nội bộ đều phải có mã SOP.",
      "Version mới cần có người duyệt và ngày hiệu lực.",
      "Không chỉnh sửa trực tiếp SOP đã published nếu chưa tạo bản nháp mới."
    ],
    steps: [
      "Tạo bản nháp SOP với mã và tiêu đề rõ ràng.",
      "Liên kết biểu mẫu, chính sách hoặc tài liệu tham chiếu.",
      "Gửi duyệt cho người phụ trách nghiệp vụ.",
      "Cập nhật trạng thái published khi được duyệt.",
      "Thông báo cho nhóm người dùng được quyền xem."
    ],
    relatedDocs: [
      { id: "doc-03", title: "Template SOP chuẩn", type: "Template", url: "#" },
      { id: "doc-04", title: "Checklist rà soát tài liệu", type: "Checklist", url: "#" }
    ]
  },
  {
    id: "sop-sec-003",
    code: "SOP-SEC-003",
    title: "SOP kiểm tra và xử lý audit log",
    summary: "Hướng dẫn đọc log, phân loại mức độ rủi ro và xử lý các thao tác bất thường liên quan đến tài khoản, vai trò và phòng ban.",
    category: "Bảo mật",
    department: "Hệ thống",
    ownerName: "Admin hệ thống",
    version: "v1.0",
    status: "reviewing",
    effectiveDate: "2026-05-10",
    updatedAt: "2026-05-22",
    allowedRoles: ["admin", "hethong", "bangiamdoc"],
    tags: ["audit", "security", "risk"],
    conditions: [
      "Áp dụng khi phát hiện đăng nhập thất bại nhiều lần hoặc thay đổi quyền bất thường.",
      "Chỉ người có quyền audit_logs:view hoặc admin mới xem được log chi tiết."
    ],
    steps: [
      "Lọc audit log theo thời gian và loại hành động.",
      "Xác định tài khoản thực hiện, IP và module bị tác động.",
      "Đánh giá mức độ rủi ro: thấp, trung bình, cao.",
      "Khóa tài khoản hoặc thu hồi quyền nếu có dấu hiệu bất thường.",
      "Ghi nhận kết quả xử lý và thông báo cho quản lý liên quan."
    ],
    relatedDocs: [
      { id: "doc-05", title: "Quy định bảo mật tài khoản", type: "Policy", url: "#" }
    ]
  },
  {
    id: "sop-dept-004",
    code: "SOP-DEPT-004",
    title: "SOP quản lý phòng ban",
    summary: "Quy trình tạo, sửa, ẩn phòng ban và liên kết nhân sự vào phòng ban đúng cấu trúc tổ chức.",
    category: "Phòng ban",
    department: "Phòng Nhân sự",
    ownerName: "Phòng Nhân sự",
    version: "v1.2",
    status: "published",
    effectiveDate: "2026-03-28",
    updatedAt: "2026-05-18",
    allowedRoles: ["all"],
    tags: ["department", "organization"],
    conditions: [
      "Phòng ban mới phải có tên rõ ràng và không trùng với phòng ban đang hoạt động.",
      "Ẩn phòng ban chỉ áp dụng khi không còn nhu cầu hiển thị trong form tạo tài khoản."
    ],
    steps: [
      "Kiểm tra phòng ban đã tồn tại hay chưa.",
      "Tạo mới hoặc cập nhật thông tin phòng ban.",
      "Gán nhân sự vào phòng ban nếu cần.",
      "Ẩn phòng ban không còn sử dụng thay vì xóa cứng.",
      "Kiểm tra lại dropdown ở form tài khoản."
    ],
    relatedDocs: [
      { id: "doc-06", title: "Sơ đồ tổ chức nội bộ", type: "Diagram", url: "#" }
    ]
  }
];

const ROLE_ALIASES = {
  admin: "admin",
  bangiamdoc: "bangiamdoc",
  truongbophan: "truongbophan",
  nhansu: "nhansu",
  daily: "daily",
  congtacvien: "congtacvien",
  hethong: "hethong"
};

const normalizeRoleKey = (roleValue) => {
  const normalized = String(roleValue || "")
    .trim()
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

  return ROLE_ALIASES[normalized] || normalized;
};

const getSafeId = (value) => {
  if (!value) return "";
  if (typeof value === "object") {
    return String(value._id || value.id || value.sop_id || "");
  }

  return String(value);
};

const getCurrentRoleName = (currentUser) => {
  const rawRole = currentUser?.role?.name || currentUser?.roleName || currentUser?.role || currentUser?.role_key || "";
  return normalizeRoleKey(rawRole);
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

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
};

const canAccessSop = (sop, currentUser) => {
  const roleName = getCurrentRoleName(currentUser);
  const allowedRoles = (sop.allowedRoles || sop.allowed_roles || []).map(normalizeRoleKey);

  if (roleName === "admin") return true;
  if (allowedRoles.includes("all") || allowedRoles.length === 0) return true;
  if (roleName && allowedRoles.includes(roleName)) return true;

  return false;
};

const STATUS_META = {
  published: { label: "Đã phát hành", className: "sop-status-published" },
  reviewing: { label: "Đang duyệt", className: "sop-status-reviewing" },
  draft: { label: "Bản nháp", className: "sop-status-draft" },
  archived: { label: "Lưu trữ", className: "sop-status-archived" }
};

export const SOPPage = ({ currentUser, filterDepartmentId }) => {
  const [sops, setSops] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [apiMode, setApiMode] = useState("mock");

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [departmentsList, setDepartmentsList] = useState([]);

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_BASE_URL}/departments?includeHidden=true`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const payload = await response.json().catch(() => null);
        setDepartmentsList(payload?.data || payload || []);
      } catch (e) {
        console.warn("Failed to load departments in SOPPage:", e);
      }
    };
    fetchDepts();
  }, []);

  useEffect(() => {
    if (filterDepartmentId && departmentsList.length > 0) {
      const match = departmentsList.find(d => (d._id || d.id) === filterDepartmentId);
      if (match) {
        setDepartmentFilter(match.name);
      }
    }
  }, [filterDepartmentId, departmentsList]);

  const fetchSops = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_BASE_URL}/sops`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("API SOP chưa sẵn sàng hoặc tài khoản hiện tại chưa có quyền truy cập.");
      }

      const payload = await response.json();
      const data = normalizeArrayResponse(payload);

      setSops(data);
      setSelectedId((currentId) => currentId || getSafeId(data[0]));
      setApiMode("real");
    } catch (err) {
      if (!USE_MOCK_WHEN_API_FAIL) {
        setError(err.message || "Không thể tải danh sách SOP.");
        setSops([]);
      } else {
        setSops(MOCK_SOPS);
        setSelectedId((currentId) => currentId || MOCK_SOPS[0]?.id || "");
        setApiMode("mock");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSops();
  }, [fetchSops]);

  const visibleSops = useMemo(() => {
    return sops.filter((sop) => canAccessSop(sop, currentUser));
  }, [sops, currentUser]);

  const categories = useMemo(() => {
    return Array.from(new Set(visibleSops.map((sop) => sop.category).filter(Boolean)));
  }, [visibleSops]);

  const departments = useMemo(() => {
    return Array.from(new Set(visibleSops.map((sop) => sop.department).filter(Boolean)));
  }, [visibleSops]);

  const filteredSops = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return visibleSops.filter((sop) => {
      const matchSearch =
        !term ||
        String(sop.title || "").toLowerCase().includes(term) ||
        String(sop.summary || "").toLowerCase().includes(term) ||
        String(sop.code || "").toLowerCase().includes(term) ||
        (sop.tags || []).some((tag) => String(tag).toLowerCase().includes(term));

      const matchCategory = categoryFilter === "all" || sop.category === categoryFilter;
      const matchDepartment = departmentFilter === "all" || sop.department === departmentFilter;
      const matchStatus = statusFilter === "all" || sop.status === statusFilter;

      return matchSearch && matchCategory && matchDepartment && matchStatus;
    });
  }, [visibleSops, searchTerm, categoryFilter, departmentFilter, statusFilter]);

  const selectedSop = useMemo(() => {
    return visibleSops.find((sop) => getSafeId(sop) === selectedId) || filteredSops[0] || visibleSops[0] || null;
  }, [visibleSops, filteredSops, selectedId]);

  const stats = useMemo(() => {
    return {
      total: visibleSops.length,
      published: visibleSops.filter((sop) => sop.status === "published").length,
      reviewing: visibleSops.filter((sop) => sop.status === "reviewing").length,
      linkedDocs: visibleSops.reduce((total, sop) => total + (sop.relatedDocs?.length || sop.related_docs?.length || 0), 0)
    };
  }, [visibleSops]);

  const resetFilters = () => {
    setSearchTerm("");
    setCategoryFilter("all");
    if (!filterDepartmentId) {
      setDepartmentFilter("all");
    }
    setStatusFilter("all");
  };

  const hasActiveFilters =
    searchTerm ||
    categoryFilter !== "all" ||
    (!filterDepartmentId && departmentFilter !== "all") ||
    statusFilter !== "all";

  const filteredDepartmentName = useMemo(() => {
    if (!filterDepartmentId || departmentsList.length === 0) return "";
    const match = departmentsList.find(d => (d._id || d.id) === filterDepartmentId);
    return match ? match.name : "";
  }, [filterDepartmentId, departmentsList]);

  return (
    <div className="sop-page container-fluid pt-3 pb-4" style={{ maxWidth: "1600px" }}>
      <div className="sop-hero mb-4">
        <div>
          <span className="page-eyebrow">Standard operating procedures</span>
          <h4 className="fw-bold text-body-emphasis mb-1">
            Thư viện SOP nghiệp vụ {filteredDepartmentName ? `— ${filteredDepartmentName}` : ""}
          </h4>
          <p className="text-body-secondary mb-0">
            Xem danh sách quy trình chuẩn theo quyền, đọc chi tiết từng SOP và truy cập nhanh tài liệu liên quan.
          </p>
        </div>

        <div className="d-flex flex-wrap gap-2 align-items-center justify-content-end">
          <span className={`api-mode-badge ${apiMode === "real" ? "api-mode-real" : "api-mode-mock"}`}>
            {apiMode === "real" ? "Đang dùng API thật" : "Đang dùng dữ liệu giả"}
          </span>

          <button className="btn btn-outline-primary btn-sm" onClick={fetchSops} disabled={loading}>
            Đồng bộ lại
          </button>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-6 col-xl-3">
          <div className="sop-stat-card">
            <span>Tổng SOP được xem</span>
            <strong>{stats.total}</strong>
          </div>
        </div>

        <div className="col-6 col-xl-3">
          <div className="sop-stat-card success">
            <span>Đã phát hành</span>
            <strong>{stats.published}</strong>
          </div>
        </div>

        <div className="col-6 col-xl-3">
          <div className="sop-stat-card warning">
            <span>Đang duyệt</span>
            <strong>{stats.reviewing}</strong>
          </div>
        </div>

        <div className="col-6 col-xl-3">
          <div className="sop-stat-card info">
            <span>Tài liệu liên kết</span>
            <strong>{stats.linkedDocs}</strong>
          </div>
        </div>
      </div>

      <div className="sop-filter-bar mb-4">
        <div className="sop-search-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>

          <input
            className="form-control form-control-sm bg-body"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Tìm theo mã SOP, tên quy trình, tag hoặc mô tả..."
          />
        </div>

        <div className="sop-filter-select"><TailwindDropdown onChange={setCategoryFilter} options={[{ label: "Tất cả nhóm SOP", value: "all" }, ...categories.map((category) => ({ label: category, value: category }))]} placeholder="Tất cả nhóm SOP" value={categoryFilter} /></div>
        {!filterDepartmentId && (
          <div className="sop-filter-select">
            <TailwindDropdown
              onChange={setDepartmentFilter}
              options={[
                { label: "Tất cả phòng ban", value: "all" },
                ...departments.map((department) => ({ label: department, value: department })),
              ]}
              placeholder="Tất cả phòng ban"
              value={departmentFilter}
            />
          </div>
        )}
        <div className="sop-filter-select"><TailwindDropdown onChange={setStatusFilter} options={[{ label: "Tất cả trạng thái", value: "all" }, { label: "Đã phát hành", value: "published" }, { label: "Đang duyệt", value: "reviewing" }, { label: "Bản nháp", value: "draft" }, { label: "Lưu trữ", value: "archived" }]} placeholder="Tất cả trạng thái" value={statusFilter} /></div>

        {hasActiveFilters && (
          <button className="btn btn-outline-secondary btn-sm sop-reset-btn" onClick={resetFilters}>
            Xóa lọc
          </button>
        )}
      </div>

      {error && <div className="alert alert-danger py-2">{error}</div>}

      <div className="row g-3 align-items-start">
        <div className="col-12 col-xl-5">
          <div className="sop-list-panel">
            <div className="sop-list-header">
              <div>
                <h6 className="fw-bold mb-0">Danh sách SOP</h6>
                <span className="text-body-secondary small">{filteredSops.length} kết quả phù hợp</span>
              </div>
            </div>

            <div className="sop-list-scroll">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : filteredSops.length === 0 ? (
                <div className="text-center py-5 text-body-secondary">
                  Không có SOP phù hợp với quyền xem hoặc bộ lọc hiện tại.
                </div>
              ) : (
                filteredSops.map((sop) => {
                  const sopId = getSafeId(sop);
                  const statusMeta = STATUS_META[sop.status] || STATUS_META.draft;
                  const isSelected = selectedSop && getSafeId(selectedSop) === sopId;

                  return (
                    <button
                      key={sopId}
                      type="button"
                      className={`sop-list-item ${isSelected ? "active" : ""}`}
                      onClick={() => setSelectedId(sopId)}
                    >
                      <div className="d-flex justify-content-between gap-3 align-items-start">
                        <span className="sop-code">{sop.code || sopId}</span>
                        <span className={`sop-status-pill ${statusMeta.className}`}>
                          {statusMeta.label}
                        </span>
                      </div>

                      <div className="sop-list-title">{sop.title}</div>
                      <div className="sop-list-summary">{sop.summary}</div>

                      <div className="d-flex flex-wrap gap-2 mt-3">
                        <span className="soft-pill">{sop.category || "Chưa phân nhóm"}</span>
                        <span className="soft-pill">{sop.version || "v1.0"}</span>
                        <span className="soft-pill">{formatDate(sop.updatedAt)}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-7">
          <div className="sop-detail-panel">
            {selectedSop ? (
              <>
                <div className="sop-detail-heading">
                  <div>
                    <span className="sop-code mb-2">{selectedSop.code || getSafeId(selectedSop)}</span>
                    <h4 className="fw-bold text-body-emphasis mb-2">{selectedSop.title}</h4>
                    <p className="text-body-secondary mb-0">{selectedSop.summary}</p>
                  </div>

                  <span className={`sop-status-pill ${STATUS_META[selectedSop.status]?.className || "sop-status-draft"}`}>
                    {STATUS_META[selectedSop.status]?.label || "Bản nháp"}
                  </span>
                </div>

                <div className="sop-meta-grid my-4">
                  <div>
                    <span>Phòng ban</span>
                    <strong>{selectedSop.department || "—"}</strong>
                  </div>

                  <div>
                    <span>Phụ trách</span>
                    <strong>{selectedSop.ownerName || selectedSop.owner_name || "—"}</strong>
                  </div>

                  <div>
                    <span>Phiên bản</span>
                    <strong>{selectedSop.version || "—"}</strong>
                  </div>

                  <div>
                    <span>Ngày hiệu lực</span>
                    <strong>{formatDate(selectedSop.effectiveDate || selectedSop.effective_date)}</strong>
                  </div>
                </div>

                <div className="sop-section mb-4">
                  <div className="sop-section-title">Điều kiện áp dụng</div>
                  <ul className="sop-check-list">
                    {(selectedSop.conditions || []).map((condition) => (
                      <li key={condition}>{condition}</li>
                    ))}
                  </ul>
                </div>

                <div className="sop-section mb-4">
                  <div className="sop-section-title">Các bước thực hiện</div>

                  <div className="sop-step-list">
                    {(selectedSop.steps || []).map((step, index) => (
                      <div key={step} className="sop-step-item">
                        <span>{String(index + 1).padStart(2, "0")}</span>
                        <p>{step}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="sop-section">
                  <div className="sop-section-title">Tài liệu liên quan</div>

                  <div className="related-doc-grid">
                    {(selectedSop.relatedDocs || selectedSop.related_docs || []).length === 0 ? (
                      <div className="text-body-secondary small">SOP này chưa liên kết tài liệu.</div>
                    ) : (
                      (selectedSop.relatedDocs || selectedSop.related_docs || []).map((doc) => (
                        <a
                          key={doc.id || doc.title}
                          href={doc.url || "#"}
                          className="related-doc-card"
                          onClick={(event) => doc.url === "#" && event.preventDefault()}
                        >
                          <span>{doc.type || "Document"}</span>
                          <strong>{doc.title}</strong>
                        </a>
                      ))
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-5 text-body-secondary">Chọn một SOP để xem chi tiết.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
