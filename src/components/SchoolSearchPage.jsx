import React, { useState, useEffect, useMemo } from "react";
import { API_BASE_URL } from "../config/api";
import { authFetch, getAuthHeaders } from "../auth/session";

// Helper function to highlight matching search term keywords
function highlightText(text, search) {
  if (!search || !text) return text;
  const str = String(text);
  const cleanSearch = search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
  const parts = str.split(new RegExp(`(${cleanSearch})`, "gi"));
  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === search.toLowerCase() ? (
          <mark key={index} className="bg-warning-subtle text-warning-emphasis p-0 rounded-1">{part}</mark>
        ) : (
          part
        )
      )}
    </>
  );
}

export function SchoolSearchPage() {
  const [headers, setHeaders] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [regionFilter, setRegionFilter] = useState("all");
  const [systemFilter, setSystemFilter] = useState("all");
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Dynamic Country and Program structure
  const [countries, setCountries] = useState([]);
  const [activeCountry, setActiveCountry] = useState("all");
  const [programs, setPrograms] = useState([]);
  const [activeProgram, setActiveProgram] = useState("all");

  // Filter lists fetched dynamically from DB
  const [regionOptions, setRegionOptions] = useState([]);
  const [systemOptions, setSystemOptions] = useState([]);

  // Auth User check
  const currentUser = useMemo(() => {
    try {
      return JSON.parse(window.localStorage.getItem("auth_user") || "null");
    } catch {
      return null;
    }
  }, []);

  const isAdmin = useMemo(() => {
    return (
      currentUser?.role === "admin" ||
      currentUser?.roleId === "69fc5af582ef85451120772a" ||
      (Array.isArray(currentUser?.permissions) &&
        (currentUser.permissions.includes("users:write") || currentUser.permissions.includes("*")))
    );
  }, [currentUser]);

  // Modals management
  const [isSchoolModalOpen, setIsSchoolModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState(null);
  const [isSourcesModalOpen, setIsSourcesModalOpen] = useState(false);

  // School Form State
  const [schoolForm, setSchoolForm] = useState({
    name: "", country: "", program: "", region: "", address: "", majors: "", website: "",
    admissionSystem: "", deadlineRegister: "", deadlineDocument: "", requirements: "",
    tuitionLanguage: "", tuitionMajor: "", dormitory: "", scholarship: "", imageUrl: "", stt: 0
  });

  // Sources management states
  const [sources, setSources] = useState([]);
  const [sourcesLoading, setSourcesLoading] = useState(false);
  const [syncingId, setSyncingId] = useState(null);
  const [newSource, setNewSource] = useState({ name: "", country: "", program: "", spreadsheetId: "", gid: "" });

  // Fetch filters
  const fetchFilterOptions = async (country = activeCountry, program = activeProgram) => {
    try {
      const regionRes = await authFetch(`${API_BASE_URL}/schools/regions?country=${country}&program=${program}`, { headers: getAuthHeaders() });
      const regionJson = await regionRes.json().catch(() => null);
      if (regionRes.ok && regionJson?.success) {
        setRegionOptions(regionJson.data || []);
      }

      const systemRes = await authFetch(`${API_BASE_URL}/schools/systems?country=${country}&program=${program}`, { headers: getAuthHeaders() });
      const systemJson = await systemRes.json().catch(() => null);
      if (systemRes.ok && systemJson?.success) {
        setSystemOptions(systemJson.data || []);
      }
    } catch (err) {
      console.error("Lỗi tải bộ lọc:", err);
    }
  };

  // Fetch Countries & initial programs
  const fetchCountriesAndPrograms = async () => {
    try {
      const res = await authFetch(`${API_BASE_URL}/schools/countries`, { headers: getAuthHeaders() });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        setCountries(json.data || []);
      }

      const progRes = await authFetch(`${API_BASE_URL}/schools/programs?country=${activeCountry}`, { headers: getAuthHeaders() });
      const progJson = await progRes.json().catch(() => null);
      if (progRes.ok && progJson?.success) {
        setPrograms(progJson.data || []);
      }
    } catch (err) {
      console.error("Lỗi tải thông tin danh mục:", err);
    }
  };

  // Fetch Schools
  const fetchSchools = async (country = activeCountry, program = activeProgram) => {
    setLoading(true);
    setError("");
    try {
      const url = `${API_BASE_URL}/schools?country=${country}&program=${program}&search=${encodeURIComponent(searchTerm)}`;
      const response = await authFetch(url, { headers: getAuthHeaders() });
      const json = await response.json().catch(() => null);
      if (!response.ok || !json?.success) {
        throw new Error(json?.message || "Không thể tải danh sách trường du học.");
      }

      setHeaders(json.data.headers || []);
      setRecords(json.data.records || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi khi tải danh sách.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCountriesAndPrograms();
    fetchSchools(activeCountry, activeProgram);
    fetchFilterOptions(activeCountry, activeProgram);
  }, []);

  const handleCountryChange = async (e) => {
    const countryVal = e.target.value;
    setActiveCountry(countryVal);
    setRegionFilter("all");
    setSystemFilter("all");

    // Load sub-programs
    try {
      const progRes = await authFetch(`${API_BASE_URL}/schools/programs?country=${countryVal}`, { headers: getAuthHeaders() });
      const progJson = await progRes.json().catch(() => null);
      if (progRes.ok && progJson?.success) {
        setPrograms(progJson.data || []);
      }
    } catch (err) {
      console.error(err);
    }

    setActiveProgram("all");
    fetchSchools(countryVal, "all");
    fetchFilterOptions(countryVal, "all");
  };

  const handleProgramChange = (programVal) => {
    setActiveProgram(programVal);
    setRegionFilter("all");
    setSystemFilter("all");
    fetchSchools(activeCountry, programVal);
    fetchFilterOptions(activeCountry, programVal);
  };

  // Client-side filtering
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      // 1. Region Filter
      if (regionFilter !== "all") {
        const region = String(r["Khu vực"] || r["Khu vực "] || "").trim();
        if (region !== regionFilter) return false;
      }

      // 2. System Filter
      if (systemFilter !== "all") {
        const system = String(r["Hệ tuyển sinh"] || r["Hệ tuyển sinh "] || "").trim();
        if (system !== systemFilter) return false;
      }

      return true;
    });
  }, [records, regionFilter, systemFilter]);

  const handleExportCsv = () => {
    if (filteredRecords.length === 0 || headers.length === 0) return;

    const exportHeaders = headers.filter(h => h !== "_id");

    const csvContent = "\uFEFF" + [
      exportHeaders.join(","),
      ...filteredRecords.map(row =>
        exportHeaders.map(h => {
          const val = String(row[h] || "").replace(/"/g, '""');
          return `"${val}"`;
        }).join(",")
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Danh_sach_truong_du_hoc_${Date.now()}.csv`;
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getTabForHeader = (h) => {
    const trimmed = h.trim();
    if (["Tên trường", "Khu vực", "Địa chỉ", "Chuyên ngành", "File ảnh thông báo", "STT", "Website"].includes(trimmed)) {
      return "overview";
    }
    if (["Hệ tuyển sinh", "Hạn báo danh", "Hạn nộp hồ sơ", "Điều kiện tuyển sinh"].includes(trimmed)) {
      return "requirements";
    }
    if (["Học phí học tiếng (1+4) TWD", "Học phí chuyên ngành (TWD)", "Ký túc xá (đài tệ)"].includes(trimmed)) {
      return "tuition";
    }
    if (["Học bổng"].includes(trimmed)) {
      return "scholarship";
    }
    return "overview";
  };

  const handleOpenDetailModal = (row) => {
    setSelectedSchool(row);
    setActiveTab("overview");
  };

  // ──── CRUD SCHOOL FUNCTIONS ───────────────────────────────────────────────
  const openSchoolModal = (school = null) => {
    if (school) {
      // Map row headers back to form fields
      setEditingSchool(school);
      setSchoolForm({
        name: school["Tên trường"] || "",
        country: activeCountry !== "all" ? activeCountry : (school["Quốc gia"] || ""),
        program: activeProgram !== "all" ? activeProgram : (school["Chương trình"] || ""),
        region: school["Khu vực"] || "",
        address: school["Địa chỉ"] || "",
        majors: school["Chuyên ngành"] || "",
        website: school["Website"] || "",
        admissionSystem: school["Hệ tuyển sinh"] || "",
        deadlineRegister: school["Hạn báo danh"] || "",
        deadlineDocument: school["Hạn nộp hồ sơ"] || "",
        requirements: school["Điều kiện tuyển sinh"] || "",
        tuitionLanguage: school["Học phí học tiếng (1+4) TWD"] || "",
        tuitionMajor: school["Học phí chuyên ngành (TWD)"] || "",
        dormitory: school["Ký túc xá (đài tệ)"] || "",
        scholarship: school["Học bổng"] || "",
        imageUrl: school["File ảnh thông báo"] || "",
        stt: parseInt(school["STT"]) || 0
      });
    } else {
      setEditingSchool(null);
      setSchoolForm({
        name: "", country: activeCountry !== "all" ? activeCountry : "", program: activeProgram !== "all" ? activeProgram : "",
        region: "", address: "", majors: "", website: "", admissionSystem: "", deadlineRegister: "", deadlineDocument: "",
        requirements: "", tuitionLanguage: "", tuitionMajor: "", dormitory: "", scholarship: "", imageUrl: "", stt: 0
      });
    }
    setIsSchoolModalOpen(true);
  };

  const handleSchoolSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingSchool
        ? `${API_BASE_URL}/schools/${editingSchool._id}`
        : `${API_BASE_URL}/schools`;
      const method = editingSchool ? "PUT" : "POST";

      const res = await authFetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(schoolForm)
      });
      if (res.ok) {
        setIsSchoolModalOpen(false);
        fetchSchools();
        fetchCountriesAndPrograms();
      } else {
        const json = await res.json().catch(() => null);
        alert(json?.message || "Có lỗi xảy ra khi lưu thông tin trường.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSchoolDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Bạn có chắc muốn xóa trường này khỏi hệ thống?")) return;
    try {
      const res = await authFetch(`${API_BASE_URL}/schools/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });
      if (res.ok) {
        fetchSchools();
      } else {
        alert("Không thể xóa trường học này.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ──── SOURCES MANAGEMENT FUNCTIONS ────────────────────────────────────────
  const fetchSources = async () => {
    setSourcesLoading(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/schools/sources`, { headers: getAuthHeaders() });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        setSources(json.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSourcesLoading(false);
    }
  };

  const handleOpenSourcesModal = () => {
    setIsSourcesModalOpen(true);
    fetchSources();
  };

  const handleAddSource = async (e) => {
    e.preventDefault();
    try {
      const res = await authFetch(`${API_BASE_URL}/schools/sources`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(newSource)
      });
      if (res.ok) {
        setNewSource({ name: "", country: "", program: "", spreadsheetId: "", gid: "" });
        fetchSources();
      } else {
        const json = await res.json().catch(() => null);
        alert(json?.message || "Không thể tạo nguồn đồng bộ.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSource = async (id) => {
    if (!window.confirm("Xóa nguồn đồng bộ này sẽ xóa tất cả trường học đã được kéo từ Sheet này về. Bạn chắc chắn muốn tiếp tục?")) return;
    try {
      const res = await authFetch(`${API_BASE_URL}/schools/sources/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });
      if (res.ok) {
        fetchSources();
        fetchSchools();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSyncSource = async (id) => {
    setSyncingId(id);
    try {
      const res = await authFetch(`${API_BASE_URL}/schools/sources/${id}/sync`, {
        method: "POST",
        headers: getAuthHeaders()
      });
      const json = await res.json().catch(() => null);
      alert(json?.message || "Đồng bộ hoàn thành.");
      fetchSources();
      fetchSchools();
      fetchCountriesAndPrograms();
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối khi đồng bộ.");
    } finally {
      setSyncingId(null);
    }
  };

  return (
    <div className="container-fluid pt-3 pb-4" style={{ maxWidth: "1600px" }}>
      {/* Page Header */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4">
        <div>
          <h4 className="fw-bold text-body-emphasis mb-1">Tra cứu Trường Du học</h4>
          <p className="text-body-secondary small mb-0">Tra cứu nhanh thông tin tuyển sinh, học phí, học bổng được đồng bộ từ Google Sheets và lưu trữ hệ thống</p>
        </div>

        <div className="d-flex flex-wrap gap-2">
          {isAdmin && (
            <>
              <button className="btn btn-sm btn-primary d-inline-flex align-items-center shadow-sm" type="button" onClick={() => openSchoolModal()}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="me-1"><path d="M12 5v14M5 12h14" /></svg>
                Thêm trường
              </button>
              <button className="btn btn-sm btn-outline-primary d-inline-flex align-items-center" type="button" onClick={handleOpenSourcesModal}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="me-1"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /></svg>
                Quản lý Google Sheets nguồn
              </button>
            </>
          )}
          <button className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center" type="button" onClick={() => fetchSchools()} disabled={loading}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="me-1"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" /></svg>
            Làm mới
          </button>
          <button className="btn btn-sm btn-success d-inline-flex align-items-center" type="button" onClick={handleExportCsv} disabled={loading || filteredRecords.length === 0}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="me-1"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
            Tải file Excel (CSV)
          </button>
        </div>
      </div>

      {/* Country and Program Tab Pickers */}
      <div className="row g-3 mb-4">
        {/* Country Selector */}
        <div className="col-12 col-sm-4 col-md-3">
          <label className="form-label fw-bold small text-secondary">Chọn Quốc gia</label>
          <select className="form-select border-1" value={activeCountry} onChange={handleCountryChange}>
            <option value="all">Tất cả quốc gia</option>
            {countries.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Program Selection Bar */}
        <div className="col-12 col-sm-8 col-md-9 d-flex align-items-end">
          <div className="d-flex flex-wrap gap-2 bg-body-secondary p-1 rounded-3 w-100" style={{ border: "1px solid var(--bs-border-color-translucent)" }}>
            <button
              type="button"
              className={`btn btn-sm px-3 py-1.5 border-0 rounded-2 font-semibold transition-all ${activeProgram === "all" ? "bg-body text-primary shadow-sm fw-bold" : "text-secondary hover:text-body bg-transparent"}`}
              onClick={() => handleProgramChange("all")}
            >
              Tất cả chương trình
            </button>
            {programs.map(p => (
              <button
                key={p}
                type="button"
                className={`btn btn-sm px-3 py-1.5 border-0 rounded-2 font-semibold transition-all ${activeProgram === p ? "bg-body text-primary shadow-sm fw-bold" : "text-secondary hover:text-body bg-transparent"}`}
                onClick={() => handleProgramChange(p)}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <section className="card border-0 mb-4 shadow-sm" style={{ borderRadius: "8px" }}>
        <div className="card-body p-3">
          <div className="row g-2">
            <div className="col-12 col-md-6 col-lg-6">
              <div className="position-relative">
                <input
                  type="text"
                  placeholder="Tìm kiếm nhanh tên trường, chuyên ngành, khu vực..."
                  className="form-control bg-body border-1 ps-4"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchSchools()}
                />
                <button className="btn btn-sm btn-primary position-absolute end-0 top-50 translate-middle-y me-1" type="button" onClick={() => fetchSchools()}>Tìm</button>
                <span className="position-absolute start-0 top-50 translate-middle-y ms-2 text-body-secondary">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                </span>
              </div>
            </div>

            <div className="col-6 col-md-3 col-lg-3">
              <select className="form-select bg-body border-1" value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)}>
                <option value="all">Tất cả Khu vực</option>
                {regionOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>

            <div className="col-6 col-md-3 col-lg-3">
              <select className="form-select bg-body border-1" value={systemFilter} onChange={(e) => setSystemFilter(e.target.value)}>
                <option value="all">Tất cả Hệ tuyển sinh</option>
                {systemOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Spreadsheet Grid */}
      <section className="card border-0 shadow-sm" style={{ borderRadius: "8px" }}>
        <div className="card-header bg-transparent border-bottom py-3 px-3 d-flex justify-content-between align-items-center">
          <h6 className="fw-bold text-body-emphasis mb-0">Bảng dữ liệu trường học ({activeCountry !== "all" ? activeCountry : "Tất cả các nước"})</h6>
          <span className="badge bg-primary-subtle text-primary px-2 py-1">
            Hiển thị {filteredRecords.length} / {records.length} trường
          </span>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive" style={{ maxHeight: "650px", overflowY: "auto" }}>
            <table className="table table-bordered table-hover align-middle mb-0" style={{ fontSize: "13px" }}>
              <thead className="table-light sticky-top" style={{ zIndex: 10 }}>
                <tr>
                  {headers.filter(h => h !== "_id").map(h => (
                    <th key={h} className="text-body-secondary fw-semibold py-3 text-nowrap px-3">{h}</th>
                  ))}
                  <th className="text-body-secondary fw-semibold py-3 text-center text-nowrap px-3" style={{ width: "110px" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={headers.length + 1} className="text-center py-5">
                      <div className="spinner-border spinner-border-sm text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
                      <span className="ms-2">Đang tải danh sách trường du học...</span>
                    </td>
                  </tr>
                ) : error ? (
                  <tr><td colSpan={headers.length + 1} className="text-center py-4 text-danger">{error}</td></tr>
                ) : filteredRecords.length === 0 ? (
                  <tr><td colSpan={headers.length + 1} className="text-center py-5 text-body-secondary">Không tìm thấy trường nào phù hợp.</td></tr>
                ) : (
                  filteredRecords.map((row, rowIdx) => (
                    <tr key={row._id || rowIdx} style={{ cursor: "pointer" }} onClick={() => handleOpenDetailModal(row)}>
                      {headers.filter(h => h !== "_id").map(h => {
                        const val = row[h] || "";
                        const isLink = String(val).startsWith("http");
                        const isImage = isLink && (
                          h.toLowerCase().includes("ảnh") || h.toLowerCase().includes("image") || /\.(jpg|jpeg|png|webp|gif|svg)/i.test(val.split("?")[0])
                        );
                        return (
                          <td key={h} className="px-3 py-2 text-truncate" style={{ maxWidth: "220px" }} title={val}>
                            {isLink ? (
                              <a href={val} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="fw-semibold">
                                {isImage ? "Xem ảnh " : `Mở ${h.trim()}`}
                              </a>
                            ) : (
                              highlightText(val, searchTerm)
                            )}
                          </td>
                        );
                      })}
                      <td className="text-center px-2 py-1" onClick={e => e.stopPropagation()}>
                        <div className="d-flex justify-content-center gap-1">
                          <button className="btn btn-sm btn-outline-primary p-1" type="button" title="Xem chi tiết" onClick={() => handleOpenDetailModal(row)}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                          </button>
                          {isAdmin && (
                            <>
                              <button className="btn btn-sm btn-outline-warning p-1" type="button" title="Sửa" onClick={() => openSchoolModal(row)}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z" /></svg>
                              </button>
                              <button className="btn btn-sm btn-outline-danger p-1" type="button" title="Xóa" onClick={(e) => handleSchoolDelete(row._id, e)}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" /></svg>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* School Detail Modal Dialog */}
      {selectedSchool && (
        <div className="fixed inset-0 z-[1050] flex items-center justify-center bg-black/50 p-3 backdrop-blur-[2px]">
          <div className="flex w-full max-w-[700px] flex-col overflow-hidden rounded-xl bg-[var(--bs-body-bg)] shadow-xl border border-slate-200" style={{ maxHeight: "calc(100vh - 24px)" }}>
            <div className="d-flex flex-shrink-0 justify-content-between align-items-center border-bottom p-4">
              <h5 className="m-0 fw-bold text-body-emphasis d-flex align-items-center gap-2">
                <span>{selectedSchool["Tên trường"] || "Chi tiết trường học"}</span>
                {(selectedSchool["Khu vực"] || selectedSchool["Khu vực "]) && (
                  <span className="badge bg-primary-subtle text-primary border" style={{ fontSize: "11px" }}>
                    {selectedSchool["Khu vực"] || selectedSchool["Khu vực "]}
                  </span>
                )}
              </h5>
              <button className="btn btn-sm btn-light border" type="button" onClick={() => setSelectedSchool(null)}>Đóng</button>
            </div>

            <div className="px-4 pt-2 border-bottom bg-light-subtle">
              <ul className="nav nav-tabs border-0 flex-nowrap overflow-x-auto text-nowrap" style={{ gap: "4px" }}>
                {[
                  { id: "overview", label: "Tổng quan & Địa chỉ" },
                  { id: "requirements", label: "Yêu cầu & Hạn nộp" },
                  { id: "tuition", label: "Học phí & KTX" },
                  { id: "scholarship", label: "Học bổng" }
                ].map(tab => (
                  <li className="nav-item" key={tab.id}>
                    <button
                      className={`nav-link border-0 px-3 py-2.5 font-semibold text-sm transition-all ${activeTab === tab.id ? "active text-indigo-600 fw-bold border-bottom border-3 border-indigo-600" : "text-secondary border-bottom border-3 border-transparent"}`}
                      style={{ borderRadius: "8px 8px 0 0", background: "transparent" }}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                    >
                      {tab.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 overflow-y-auto min-h-0 flex-1">
              <div className="row g-3">
                {(() => {
                  const displayHeaders = headers.filter(h => h !== "_id");
                  const tabHeaders = displayHeaders.filter(h => getTabForHeader(h) === activeTab && selectedSchool[h]);
                  if (tabHeaders.length === 0) {
                    return <div className="col-12 text-center py-5 text-body-secondary">Không có dữ liệu cho mục này.</div>;
                  }

                  return tabHeaders.map(h => {
                    const value = selectedSchool[h] || "";
                    const isLink = String(value).startsWith("http");
                    const isImage = isLink && (
                      h.toLowerCase().includes("ảnh") || h.toLowerCase().includes("image") || /\.(jpg|jpeg|png|webp|gif|svg)/i.test(value.split("?")[0])
                    );

                    const isLargeField = ["Địa chỉ", "Điều kiện tuyển sinh", "Học bổng", "Chuyên ngành", "Học phí học tiếng (1+4) TWD", "Học phí chuyên ngành (TWD)", "Ký túc xá (đài tệ)"].includes(h) || h.trim() === "File ảnh thông báo" || isImage;

                    return (
                      <div className={isLargeField ? "col-12" : "col-6"} key={h}>
                        <span className="text-body-secondary small d-block fw-semibold mb-1">{h}</span>
                        <div className="bg-body-secondary/30 rounded p-2.5 border border-light">
                          {isImage ? (
                            <div className="text-center bg-white rounded p-3 border my-1 shadow-sm">
                              <img src={value} alt={h} className="img-fluid rounded border" style={{ maxHeight: "300px", objectFit: "contain" }} />
                              <div className="d-flex justify-content-center gap-2 mt-2">
                                <a href={value} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-primary">Mở ảnh gốc</a>
                              </div>
                            </div>
                          ) : isLink ? (
                            <a href={value} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-primary">Mở {h.trim()}</a>
                          ) : (
                            <span className="text-body-emphasis text-break" style={{ whiteSpace: "pre-wrap", fontSize: "13px" }}>{highlightText(value, searchTerm)}</span>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
            <div className="d-flex flex-shrink-0 justify-content-end gap-2 border-top p-4">
              <button type="button" className="btn btn-primary" onClick={() => setSelectedSchool(null)}>Hoàn tất</button>
            </div>
          </div>
        </div>
      )}

      {/* CRUD School Modal */}
      {isSchoolModalOpen && (
        <div className="fixed inset-0 z-[1060] flex items-center justify-center bg-black/50 p-3 backdrop-blur-[2px]">
          <form className="flex w-full max-w-[800px] flex-col overflow-hidden rounded-xl bg-[var(--bs-body-bg)] shadow-xl border border-slate-200" style={{ maxHeight: "calc(100vh - 24px)" }} onSubmit={handleSchoolSubmit}>
            <div className="d-flex flex-shrink-0 justify-content-between align-items-center border-bottom p-4">
              <h5 className="m-0 fw-bold">{editingSchool ? "Chỉnh sửa thông tin trường" : "Thêm trường du học mới"}</h5>
              <button className="btn-close" type="button" onClick={() => setIsSchoolModalOpen(false)}></button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold">Tên trường *</label>
                <input type="text" className="form-control" required value={schoolForm.name} onChange={e => setSchoolForm({...schoolForm, name: e.target.value})} />
              </div>
              <div className="col-6 col-md-3">
                <label className="form-label fw-semibold">Quốc gia *</label>
                <input type="text" className="form-control" required placeholder="Ví dụ: Đài Loan, Đức" value={schoolForm.country} onChange={e => setSchoolForm({...schoolForm, country: e.target.value})} />
              </div>
              <div className="col-6 col-md-3">
                <label className="form-label fw-semibold">Chương trình *</label>
                <input type="text" className="form-control" required placeholder="Ví dụ: Đại học, THPT" value={schoolForm.program} onChange={e => setSchoolForm({...schoolForm, program: e.target.value})} />
              </div>
              <div className="col-6 col-md-4">
                <label className="form-label fw-semibold">Khu vực</label>
                <input type="text" className="form-control" value={schoolForm.region} onChange={e => setSchoolForm({...schoolForm, region: e.target.value})} />
              </div>
              <div className="col-6 col-md-4">
                <label className="form-label fw-semibold">Hệ tuyển sinh</label>
                <input type="text" className="form-control" value={schoolForm.admissionSystem} onChange={e => setSchoolForm({...schoolForm, admissionSystem: e.target.value})} />
              </div>
              <div className="col-6 col-md-4">
                <label className="form-label fw-semibold">Thứ tự hiển thị (STT)</label>
                <input type="number" className="form-control" value={schoolForm.stt} onChange={e => setSchoolForm({...schoolForm, stt: parseInt(e.target.value) || 0})} />
              </div>
              <div className="col-12">
                <label className="form-label fw-semibold">Địa chỉ</label>
                <input type="text" className="form-control" value={schoolForm.address} onChange={e => setSchoolForm({...schoolForm, address: e.target.value})} />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold">Chuyên ngành</label>
                <textarea className="form-control" rows="2" value={schoolForm.majors} onChange={e => setSchoolForm({...schoolForm, majors: e.target.value})}></textarea>
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold">Điều kiện tuyển sinh</label>
                <textarea className="form-control" rows="2" value={schoolForm.requirements} onChange={e => setSchoolForm({...schoolForm, requirements: e.target.value})}></textarea>
              </div>
              <div className="col-6">
                <label className="form-label fw-semibold">Hạn báo danh</label>
                <input type="text" className="form-control" value={schoolForm.deadlineRegister} onChange={e => setSchoolForm({...schoolForm, deadlineRegister: e.target.value})} />
              </div>
              <div className="col-6">
                <label className="form-label fw-semibold">Hạn nộp hồ sơ</label>
                <input type="text" className="form-control" value={schoolForm.deadlineDocument} onChange={e => setSchoolForm({...schoolForm, deadlineDocument: e.target.value})} />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold">Học phí học tiếng</label>
                <input type="text" className="form-control" value={schoolForm.tuitionLanguage} onChange={e => setSchoolForm({...schoolForm, tuitionLanguage: e.target.value})} />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold">Học phí chuyên ngành</label>
                <input type="text" className="form-control" value={schoolForm.tuitionMajor} onChange={e => setSchoolForm({...schoolForm, tuitionMajor: e.target.value})} />
              </div>
              <div className="col-6">
                <label className="form-label fw-semibold">Ký túc xá</label>
                <input type="text" className="form-control" value={schoolForm.dormitory} onChange={e => setSchoolForm({...schoolForm, dormitory: e.target.value})} />
              </div>
              <div className="col-6">
                <label className="form-label fw-semibold">Học bổng</label>
                <input type="text" className="form-control" value={schoolForm.scholarship} onChange={e => setSchoolForm({...schoolForm, scholarship: e.target.value})} />
              </div>
              <div className="col-12">
                <label className="form-label fw-semibold">Website trường</label>
                <input type="url" className="form-control font-mono" value={schoolForm.website} onChange={e => setSchoolForm({...schoolForm, website: e.target.value})} />
              </div>
              <div className="col-12">
                <label className="form-label fw-semibold">Link ảnh thông báo</label>
                <input type="url" className="form-control font-mono" value={schoolForm.imageUrl} onChange={e => setSchoolForm({...schoolForm, imageUrl: e.target.value})} />
              </div>
            </div>

            <div className="d-flex flex-shrink-0 justify-content-end gap-2 border-top p-4">
              <button type="button" className="btn btn-outline-secondary" onClick={() => setIsSchoolModalOpen(false)}>Hủy</button>
              <button type="submit" className="btn btn-primary">Lưu lại</button>
            </div>
          </form>
        </div>
      )}

      {/* Sources Management Modal */}
      {isSourcesModalOpen && (
        <div className="fixed inset-0 z-[1060] flex items-center justify-center bg-black/50 p-3 backdrop-blur-[2px]">
          <div className="flex w-full max-w-[900px] flex-col overflow-hidden rounded-xl bg-[var(--bs-body-bg)] shadow-xl border border-slate-200" style={{ maxHeight: "calc(100vh - 24px)" }}>
            <div className="d-flex flex-shrink-0 justify-content-between align-items-center border-bottom p-4">
              <h5 className="m-0 fw-bold">Quản lý các nguồn Google Sheets tuyển sinh</h5>
              <button className="btn-close" type="button" onClick={() => setIsSourcesModalOpen(false)}></button>
            </div>

            <div className="p-4 overflow-y-auto flex-1">
              {/* Form to Add New Source */}
              <form onSubmit={handleAddSource} className="row g-2 mb-4 p-3 bg-body-secondary/30 border rounded-3">
                <h6 className="fw-bold mb-2">Thêm Sheet liên kết mới</h6>
                <div className="col-6 col-md-3">
                  <input type="text" className="form-control form-control-sm" required placeholder="Tên nguồn (vd: Đức - THPT)" value={newSource.name} onChange={e => setNewSource({...newSource, name: e.target.value})} />
                </div>
                <div className="col-6 col-md-2">
                  <input type="text" className="form-control form-control-sm" required placeholder="Quốc gia" value={newSource.country} onChange={e => setNewSource({...newSource, country: e.target.value})} />
                </div>
                <div className="col-6 col-md-2">
                  <input type="text" className="form-control form-control-sm" required placeholder="Chương trình" value={newSource.program} onChange={e => setNewSource({...newSource, program: e.target.value})} />
                </div>
                <div className="col-6 col-md-3">
                  <input type="text" className="form-control form-control-sm" required placeholder="Google Sheet ID" value={newSource.spreadsheetId} onChange={e => setNewSource({...newSource, spreadsheetId: e.target.value})} />
                </div>
                <div className="col-6 col-md-1">
                  <input type="text" className="form-control form-control-sm" required placeholder="GID Tab" value={newSource.gid} onChange={e => setNewSource({...newSource, gid: e.target.value})} />
                </div>
                <div className="col-6 col-md-1">
                  <button className="btn btn-sm btn-primary w-100" type="submit">Thêm</button>
                </div>
              </form>

              {/* Sources List */}
              <h6 className="fw-bold mb-2">Danh sách nguồn đang liên kết</h6>
              <div className="table-responsive">
                <table className="table table-bordered table-striped align-middle table-sm" style={{ fontSize: "12px" }}>
                  <thead className="table-light">
                    <tr>
                      <th>Tên phân loại</th>
                      <th>Nước</th>
                      <th>Chương trình</th>
                      <th>Sheet ID</th>
                      <th>GID Tab</th>
                      <th>Trạng thái</th>
                      <th className="text-center" style={{ width: "160px" }}>Đồng bộ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sourcesLoading ? (
                      <tr><td colSpan="7" className="text-center py-3">Đang tải...</td></tr>
                    ) : sources.length === 0 ? (
                      <tr><td colSpan="7" className="text-center py-3">Chưa cấu hình nguồn nào.</td></tr>
                    ) : (
                      sources.map((s) => (
                        <tr key={s._id}>
                          <td className="fw-bold">{s.name}</td>
                          <td>{s.country}</td>
                          <td>{s.program}</td>
                          <td className="text-truncate font-mono" style={{ maxWidth: "120px" }} title={s.spreadsheetId}>{s.spreadsheetId}</td>
                          <td>{s.gid}</td>
                          <td>
                            {s.lastSyncedAt ? (
                              <span className="text-muted block" style={{ fontSize: "10px" }}>Đã đồng bộ {s.lastSyncCount} trường lúc {new Date(s.lastSyncedAt).toLocaleString("vi-VN")}</span>
                            ) : (
                              <span className="badge bg-warning">Chưa đồng bộ</span>
                            )}
                          </td>
                          <td className="text-center">
                            <div className="d-flex justify-content-center gap-1">
                              <button
                                className="btn btn-xs btn-success d-inline-flex align-items-center py-1 px-2"
                                type="button"
                                disabled={syncingId !== null}
                                onClick={() => handleSyncSource(s._id)}
                              >
                                {syncingId === s._id ? "Đang đồng bộ..." : "Đồng bộ"}
                              </button>
                              <button className="btn btn-xs btn-danger" type="button" onClick={() => handleDeleteSource(s._id)}>Xóa</button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="d-flex flex-shrink-0 justify-content-end gap-2 border-top p-4">
              <button type="button" className="btn btn-outline-secondary" onClick={() => setIsSourcesModalOpen(false)}>Hoàn tất</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
