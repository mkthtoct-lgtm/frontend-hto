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
  const [activeProgram, setActiveProgram] = useState("1174598013");
  const [programs, setPrograms] = useState([
    { id: "1174598013", name: "ĐẠI HỌC" },
    { id: "687334184", name: "THPT " }
  ]);

  // Fetch dynamic sheet tabs from backend
  const fetchTabs = async () => {
    try {
      const response = await authFetch(`${API_BASE_URL}/schools/tabs`, {
        headers: getAuthHeaders(),
      });
      const json = await response.json().catch(() => null);
      if (response.ok && json?.success && Array.isArray(json.data)) {
        setPrograms(json.data);
        // If the current activeProgram is not in the loaded list, select the first one
        const hasActive = json.data.some(p => p.id === activeProgram);
        if (!hasActive && json.data.length > 0) {
          setActiveProgram(json.data[0].id);
          fetchSchools(json.data[0].id);
        }
      }
    } catch (err) {
      console.error("Lỗi khi tải danh sách tab:", err);
    }
  };

  // Fetch schools from backend
  const fetchSchools = async (programId = activeProgram) => {
    setLoading(true);
    setError("");
    try {
      const response = await authFetch(`${API_BASE_URL}/schools?program=${programId}`, {
        headers: getAuthHeaders(),
      });
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
    fetchTabs();
    fetchSchools(activeProgram);
  }, []);

  const handleProgramChange = (programId) => {
    setActiveProgram(programId);
    setRegionFilter("all");
    setSystemFilter("all");
    setSearchTerm("");
    fetchSchools(programId);
  };

  // Dynamically extract unique regions (Khu vực) and systems (Hệ tuyển sinh) for dropdown options
  const regionOptions = useMemo(() => {
    const set = new Set();
    records.forEach(r => {
      const region = r["Khu vực"] || r["Khu vực "] || "";
      if (region && region.trim()) set.add(region.trim());
    });
    return Array.from(set).sort();
  }, [records]);

  const systemOptions = useMemo(() => {
    const set = new Set();
    records.forEach(r => {
      const system = r["Hệ tuyển sinh"] || r["Hệ tuyển sinh "] || "";
      if (system && system.trim()) set.add(system.trim());
    });
    return Array.from(set).sort();
  }, [records]);

  // Map header dynamically to its corresponding tab (whitespace-agnostic)
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

      // 3. Search Filter
      if (searchTerm) {
        const cleanSearch = searchTerm.toLowerCase().trim();
        return Object.values(r).some(val =>
          String(val).toLowerCase().includes(cleanSearch)
        );
      }

      return true;
    });
  }, [records, regionFilter, systemFilter, searchTerm]);

  // Export current filtered list to CSV (Excel compatible with BOM for Vietnamese accents)
  const handleExportCsv = () => {
    if (filteredRecords.length === 0 || headers.length === 0) return;

    const csvContent = "\uFEFF" + [
      headers.join(","),
      ...filteredRecords.map(row =>
        headers.map(h => {
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

  const handleOpenDetailModal = (row) => {
    setSelectedSchool(row);
    setActiveTab("overview");
  };

  return (
    <div className="container-fluid pt-3 pb-4" style={{ maxWidth: "1600px" }}>
      {/* Page Header */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4">
        <div>
          <h4 className="fw-bold text-body-emphasis mb-1">Tra cứu Trường Du học</h4>
          <p className="text-body-secondary small mb-0">Tra cứu nhanh thông tin tuyển sinh, học phí, học bổng từ Google Sheet</p>
        </div>

        <div className="d-flex flex-wrap gap-2">
          <button
            className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center"
            type="button"
            onClick={() => fetchSchools(activeProgram)}
            disabled={loading}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="me-1">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
            Làm mới dữ liệu
          </button>
          <button
            className="btn btn-sm btn-success d-inline-flex align-items-center"
            type="button"
            onClick={handleExportCsv}
            disabled={loading || filteredRecords.length === 0}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="me-1">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            Tải file Excel (CSV)
          </button>
          <a
            href="https://docs.google.com/spreadsheets/d/1iq_3AFmBgqGXiB3jVZWvcU_hATXeNwIe17TAT7-f7a8/edit?gid=1174598013#gid=1174598013"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-sm btn-outline-primary d-inline-flex align-items-center"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="me-1">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
            </svg>
            Mở GG Sheet gốc
          </a>
        </div>
      </div>

      {/* Program Tab Switcher */}
      <div className="mb-4">
        <div className="d-flex flex-wrap gap-2 bg-body-secondary p-1.5 rounded-3 d-inline-flex" style={{ border: "1px solid var(--bs-border-color-translucent)" }}>
          {programs.map(prog => (
            <button
              key={prog.id}
              type="button"
              className={`btn btn-sm px-3 py-1.5 border-0 rounded-2 font-semibold transition-all d-flex align-items-center gap-1.5 ${activeProgram === prog.id
                  ? "bg-body text-primary shadow-sm fw-bold"
                  : "text-secondary hover:text-body bg-transparent"
                }`}
              onClick={() => handleProgramChange(prog.id)}
            >
              <span>{prog.id === "1174598013" ? "" : prog.id === "687334184" ? "" : ""}</span>
              <span>{prog.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <section className="card border-0 mb-4" style={{ borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <div className="card-body p-3">
          <div className="row g-2">
            {/* Search Input */}
            <div className="col-12 col-md-6 col-lg-7">
              <div className="position-relative">
                <input
                  type="text"
                  placeholder="Tìm kiếm nhanh tên trường, chuyên ngành, điều kiện tuyển sinh..."
                  className="form-control bg-body border-1 ps-4"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <span className="position-absolute start-0 top-50 translate-middle-y ms-2 text-body-secondary">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </span>
              </div>
            </div>

            {/* Region Filter */}
            <div className="col-6 col-md-3 col-lg-2">
              <select
                className="form-select bg-body border-1"
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
              >
                <option value="all">Tất cả Khu vực</option>
                {regionOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {/* System Filter */}
            <div className="col-6 col-md-3 col-lg-3">
              <select
                className="form-select bg-body border-1"
                value={systemFilter}
                onChange={(e) => setSystemFilter(e.target.value)}
              >
                <option value="all">Tất cả Hệ tuyển sinh</option>
                {systemOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Spreadsheet grid */}
      <section className="card border-0" style={{ borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <div className="card-header bg-transparent border-bottom py-3 px-3 d-flex justify-content-between align-items-center">
          <h6 className="fw-bold text-body-emphasis mb-0">Bảng dữ liệu trường học</h6>
          <span className="badge bg-primary-subtle text-primary px-2 py-1">
            Hiển thị {filteredRecords.length} / {records.length} trường
          </span>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive" style={{ maxHeight: "650px", overflowY: "auto" }}>
            <table className="table table-bordered table-hover align-middle mb-0" style={{ fontSize: "13px" }}>
              <thead className="table-light sticky-top" style={{ zIndex: 10 }}>
                <tr>
                  {headers.map(h => (
                    <th key={h} className="text-body-secondary fw-semibold py-3 text-nowrap px-3">
                      {h}
                    </th>
                  ))}
                  <th className="text-body-secondary fw-semibold py-3 text-center text-nowrap px-3" style={{ width: "90px" }}>
                    Chi tiết
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={headers.length + 1} className="text-center py-5">
                      <div className="spinner-border spinner-border-sm text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <span className="ms-2">Đang tải danh sách trường du học...</span>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={headers.length + 1} className="text-center py-4 text-danger">
                      {error}
                    </td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={headers.length + 1} className="text-center py-5 text-body-secondary">
                      Không tìm thấy trường nào phù hợp với bộ lọc tìm kiếm.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((row, rowIdx) => (
                    <tr
                      key={rowIdx}
                      style={{ cursor: "pointer" }}
                      onClick={() => handleOpenDetailModal(row)}
                    >
                      {headers.map(h => {
                        const val = row[h] || "";
                        // If it's a URL/Link, render it in a clean format
                        const isLink = String(val).startsWith("http");
                        const isImage = isLink && (
                          h.toLowerCase().includes("ảnh") ||
                          h.toLowerCase().includes("image") ||
                          /\.(jpg|jpeg|png|webp|gif|svg)/i.test(val.split("?")[0])
                        );
                        return (
                          <td
                            key={h}
                            className="px-3 py-2 text-truncate"
                            style={{ maxWidth: "250px" }}
                            title={val}
                          >
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
                      <td className="text-center px-2 py-1">
                        <button
                          className="btn btn-sm btn-outline-primary d-inline-flex align-items-center justify-content-center"
                          style={{ width: "32px", height: "32px", padding: 0 }}
                          type="button"
                          title="Xem chi tiết"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetailModal(row);
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                        </button>
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
          <div
            className="flex w-full max-w-[700px] flex-col overflow-hidden rounded-xl bg-[var(--bs-body-bg)] shadow-xl border border-slate-200"
            style={{ maxHeight: "calc(100vh - 24px)" }}
          >
            {/* Modal Header */}
            <div className="d-flex flex-shrink-0 justify-content-between align-items-center border-bottom p-4">
              <h5 className="m-0 fw-bold text-body-emphasis d-flex align-items-center gap-2">
                <span>{selectedSchool["Tên trường"] || "Chi tiết trường học"}</span>
                {(selectedSchool["Khu vực"] || selectedSchool["Khu vực "]) && (
                  <span className="badge bg-primary-subtle text-primary border" style={{ fontSize: "11px" }}>
                    {selectedSchool["Khu vực"] || selectedSchool["Khu vực "]}
                  </span>
                )}
              </h5>
              <button
                className="btn btn-sm btn-light border"
                type="button"
                onClick={() => setSelectedSchool(null)}
              >
                Đóng
              </button>
            </div>

            {/* Tabs Selector */}
            <div className="px-4 pt-2 border-bottom bg-light-subtle">
              <ul className="nav nav-tabs border-0 flex-nowrap overflow-x-auto text-nowrap" style={{ gap: "4px" }}>
                {[
                  { id: "overview", label: "Tổng quan & Địa chỉ", icon: "" },
                  { id: "requirements", label: "Yêu cầu & Hạn nộp", icon: "" },
                  { id: "tuition", label: "Học phí & KTX", icon: "" },
                  { id: "scholarship", label: "Học bổng", icon: "" }
                ].map(tab => (
                  <li className="nav-item" key={tab.id}>
                    <button
                      className={`nav-link border-0 px-3 py-2.5 font-semibold text-sm d-flex align-items-center gap-1.5 transition-all ${activeTab === tab.id
                          ? "active text-indigo-600 fw-bold border-bottom border-3 border-indigo-600"
                          : "text-secondary border-bottom border-3 border-transparent"
                        }`}
                      style={{ borderRadius: "8px 8px 0 0", background: "transparent" }}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                    >
                      <span>{tab.icon}</span>
                      <span>{tab.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto min-h-0 flex-1">
              <div className="row g-3">
                {(() => {
                  const tabHeaders = headers.filter(h => getTabForHeader(h) === activeTab && selectedSchool[h]);
                  if (tabHeaders.length === 0) {
                    return (
                      <div className="col-12 text-center py-5 text-body-secondary">
                        <span className="fs-5 d-block mb-2"></span>
                        Không có dữ liệu cho mục này.
                      </div>
                    );
                  }

                  return tabHeaders.map(h => {
                    const value = selectedSchool[h] || "";
                    const isLink = String(value).startsWith("http");
                    const isImage = isLink && (
                      h.toLowerCase().includes("ảnh") ||
                      h.toLowerCase().includes("image") ||
                      /\.(jpg|jpeg|png|webp|gif|svg)/i.test(value.split("?")[0])
                    );

                    // Format fields display width based on content size
                    const isLargeField = ["Địa chỉ", "Điều kiện tuyển sinh", "Học bổng", "Chuyên ngành", " Học phí học tiếng (1+4) TWD ", " Học phí chuyên ngành (TWD) ", " Ký túc xá (đài tệ)"].includes(h) || h.trim() === "File ảnh thông báo" || isImage;

                    return (
                      <div className={isLargeField ? "col-12" : "col-6"} key={h}>
                        <span className="text-body-secondary small d-block fw-semibold mb-1">{h}</span>
                        <div className="bg-body-secondary/30 rounded p-2.5 border border-light">
                          {isImage ? (
                            <div className="text-center bg-white rounded p-3 border my-1 shadow-sm">
                              <div className="d-inline-block overflow-hidden rounded border bg-light mb-2" style={{ maxWidth: "100%", maxHeight: "320px" }}>
                                <img
                                  src={value}
                                  alt={h}
                                  className="img-fluid"
                                  style={{ maxHeight: "300px", objectFit: "contain", verticalAlign: "middle" }}
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                  }}
                                />
                              </div>
                              <div className="d-flex justify-content-center gap-2">
                                <a
                                  href={value}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-sm btn-primary d-inline-flex align-items-center"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="me-1.5">
                                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                                  </svg>
                                  Mở ảnh gốc trong tab mới
                                </a>
                              </div>
                              <small className="text-body-secondary d-block mt-2" style={{ fontSize: "11px", lineHeight: "1.4" }}>
                                <strong>Kích thước ảnh khuyên dùng:</strong> Kích thước tỷ lệ 16:9 (như 800x450px hoặc 1200x675px) hoặc 4:3 (như 1024x768px). Dung lượng ảnh nên dưới 2MB để đảm bảo người xem tải nhanh nhất.
                              </small>
                            </div>
                          ) : isLink ? (
                            <a
                              href={value}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-sm btn-primary d-inline-flex align-items-center"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="me-1.5">
                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                              </svg>
                              Mở {h.trim()}
                            </a>
                          ) : (
                            <span className="text-body-emphasis text-break" style={{ whiteSpace: "pre-wrap", fontSize: "13px" }}>
                              {highlightText(value, searchTerm)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="d-flex flex-shrink-0 justify-content-end gap-2 border-top p-4">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setSelectedSchool(null)}
              >
                Hoàn tất
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
