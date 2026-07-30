import { useCallback, useEffect, useMemo, useState } from "react";
import { TailwindDropdown } from "../components/ui/TailwindDropdown";
import "./AIHistoryPage.css";

import { API_BASE_URL } from "../config/api";
const USE_MOCK_WHEN_API_FAIL = true;
const PAGE_SIZE = 8;

const MOCK_HISTORY = [
  {
    id: "aih-001",
    question: "Cần chuẩn bị giấy tờ gì cho hồ sơ visa du học Đức?",
    answerStatus: "answered",
    userName: "Nguyễn Minh Anh",
    userEmail: "minhanh@example.com",
    topic: "Visa",
    source: "Chatbot website",
    confidence: 87,
    usedSources: ["Checklist hồ sơ visa du học", "FAQ chương trình du học"],
    createdAt: "2026-05-24T08:20:00"
  },
  {
    id: "aih-002",
    question: "Quy trình tạo tài khoản nhân sự mới gồm những bước nào?",
    answerStatus: "answered",
    userName: "Lê Thanh",
    userEmail: "lethanh@example.com",
    topic: "Nhân sự",
    source: "AI nội bộ",
    confidence: 91,
    usedSources: ["SOP tạo và xác thực tài khoản nhân sự"],
    createdAt: "2026-05-24T09:05:00"
  },
  {
    id: "aih-003",
    question: "Lead từ Facebook nên gán cho bộ phận nào?",
    answerStatus: "answered",
    userName: "Trần Quốc Huy",
    userEmail: "huy.tran@example.com",
    topic: "CRM",
    source: "AI nội bộ",
    confidence: 78,
    usedSources: ["SOP xử lý lead từ website"],
    createdAt: "2026-05-23T16:12:00"
  },
  {
    id: "aih-004",
    question: "Khách hàng chưa có B1 có thể nộp hồ sơ trước không?",
    answerStatus: "pending",
    userName: "Phạm Quỳnh",
    userEmail: "quynh.pham@example.com",
    topic: "Du học Đức",
    source: "Chatbot website",
    confidence: 42,
    usedSources: [],
    createdAt: "2026-05-23T10:44:00"
  },
  {
    id: "aih-005",
    question: "Tài liệu nào quy định quyền khóa tài khoản?",
    answerStatus: "answered",
    userName: "Admin",
    userEmail: "admin@hto.vn",
    topic: "Phân quyền",
    source: "AI nội bộ",
    confidence: 94,
    usedSources: ["Chính sách phân quyền tài khoản nội bộ"],
    createdAt: "2026-05-22T14:10:00"
  },
  {
    id: "aih-006",
    question: "Có template email follow-up khách hàng sau tư vấn không?",
    answerStatus: "answered",
    userName: "Hoàng Nam",
    userEmail: "nam.hoang@example.com",
    topic: "Marketing",
    source: "AI nội bộ",
    confidence: 83,
    usedSources: ["Mẫu email chăm sóc khách hàng sau tư vấn"],
    createdAt: "2026-05-22T09:35:00"
  },
  {
    id: "aih-007",
    question: "Chi phí định cư diện đầu tư hiện đang lấy từ bảng nào?",
    answerStatus: "pending",
    userName: "Nguyễn Lan",
    userEmail: "lan.nguyen@example.com",
    topic: "Định cư",
    source: "Chatbot website",
    confidence: 39,
    usedSources: [],
    createdAt: "2026-05-21T17:40:00"
  },
  {
    id: "aih-008",
    question: "SOP quản lý phòng ban có quy định ẩn phòng ban không?",
    answerStatus: "answered",
    userName: "Trần Mai",
    userEmail: "mai.tran@example.com",
    topic: "Phòng ban",
    source: "AI nội bộ",
    confidence: 88,
    usedSources: ["SOP quản lý phòng ban"],
    createdAt: "2026-05-21T08:18:00"
  },
  {
    id: "aih-009",
    question: "Tài liệu đào tạo tư vấn viên mới nằm ở nhóm nào?",
    answerStatus: "answered",
    userName: "Nguyễn Minh Anh",
    userEmail: "minhanh@example.com",
    topic: "Đào tạo",
    source: "AI nội bộ",
    confidence: 81,
    usedSources: ["Tài liệu đào tạo tư vấn viên mới"],
    createdAt: "2026-05-20T11:22:00"
  }
];

const normalizeArrayResponse = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const normalizeRole = (roleValue) => {
  return String(roleValue || "")
    .trim()
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
};

const canAccessHistoryPage = (currentUser) => {
  const roleName = normalizeRole(currentUser?.role?.name || currentUser?.roleName || currentUser?.role);
  return ["admin", "bangiamdoc", "hethong"].includes(roleName);
};

const formatDateTime = (dateValue) => {
  if (!dateValue) return "—";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" });
};

export const AIHistoryPage = ({ currentUser }) => {
  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiMode, setApiMode] = useState("mock");
  const [message, setMessage] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [userFilter, setUserFilter] = useState("all");
  const [topicFilter, setTopicFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPageIndex, setCurrentPageIndex] = useState(1);

  const canAccess = canAccessHistoryPage(currentUser);

  const fetchAIHistory = useCallback(async () => {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/ai/history`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });

      if (!response.ok) {
        throw new Error("API lịch sử AI chưa sẵn sàng hoặc tài khoản hiện tại chưa có quyền truy cập.");
      }

      const payload = await response.json();
      setHistoryItems(normalizeArrayResponse(payload));
      setApiMode("real");
    } catch (err) {
      if (USE_MOCK_WHEN_API_FAIL) {
        setHistoryItems(MOCK_HISTORY);
        setApiMode("mock");
      } else {
        setMessage(err.message || "Không thể tải lịch sử AI.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canAccess) {
      fetchAIHistory();
    }
  }, [fetchAIHistory, canAccess]);

  useEffect(() => {
    setCurrentPageIndex(1);
  }, [searchTerm, userFilter, topicFilter, sourceFilter, statusFilter, dateFrom, dateTo]);

  const users = useMemo(() => Array.from(new Set(historyItems.map((item) => item.userName).filter(Boolean))), [historyItems]);
  const topics = useMemo(() => Array.from(new Set(historyItems.map((item) => item.topic).filter(Boolean))), [historyItems]);
  const sources = useMemo(() => Array.from(new Set(historyItems.map((item) => item.source).filter(Boolean))), [historyItems]);

  const filteredHistory = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return historyItems.filter((item) => {
      const createdAt = new Date(item.createdAt);
      const fromDate = dateFrom ? new Date(dateFrom) : null;
      const toDate = dateTo ? new Date(`${dateTo}T23:59:59`) : null;

      const matchSearch =
        !term ||
        String(item.question || "").toLowerCase().includes(term) ||
        String(item.userEmail || "").toLowerCase().includes(term) ||
        (item.usedSources || []).some((source) => String(source).toLowerCase().includes(term));

      return (
        matchSearch &&
        (userFilter === "all" || item.userName === userFilter) &&
        (topicFilter === "all" || item.topic === topicFilter) &&
        (sourceFilter === "all" || item.source === sourceFilter) &&
        (statusFilter === "all" || item.answerStatus === statusFilter) &&
        (!fromDate || createdAt >= fromDate) &&
        (!toDate || createdAt <= toDate)
      );
    });
  }, [historyItems, searchTerm, userFilter, topicFilter, sourceFilter, statusFilter, dateFrom, dateTo]);

  const stats = useMemo(() => {
    const total = filteredHistory.length;
    const answered = filteredHistory.filter((item) => item.answerStatus === "answered").length;
    const pending = filteredHistory.filter((item) => item.answerStatus === "pending").length;
    const avgConfidence =
      total === 0
        ? 0
        : Math.round(filteredHistory.reduce((sum, item) => sum + Number(item.confidence || 0), 0) / total);

    return { total, answered, pending, avgConfidence };
  }, [filteredHistory]);

  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / PAGE_SIZE));

  const paginatedHistory = useMemo(() => {
    const startIndex = (currentPageIndex - 1) * PAGE_SIZE;
    return filteredHistory.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredHistory, currentPageIndex]);

  const resetFilters = () => {
    setSearchTerm("");
    setUserFilter("all");
    setTopicFilter("all");
    setSourceFilter("all");
    setStatusFilter("all");
    setDateFrom("");
    setDateTo("");
  };

  if (!canAccess) {
    return (
      <div className="ai-history-page container-fluid pt-5 pb-4" style={{ maxWidth: "1180px" }}>
        <div className="ai-history-denied">
          <h4 className="fw-bold text-danger">Từ chối quyền truy cập</h4>
          <p className="text-body-secondary mb-0">Chỉ Admin, Ban giám đốc hoặc Hệ thống được xem thống kê lịch sử AI.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-history-page container-fluid pt-3 pb-4" style={{ maxWidth: "1600px" }}>
      <div className="ai-history-hero mb-4">
        <div>
          <span className="ai-history-eyebrow">AI analytics history</span>
          <h4 className="fw-bold text-body-emphasis mb-1">Thống kê & lịch sử AI</h4>
          <p className="text-body-secondary mb-0">
            Ban giám đốc theo dõi lịch sử câu hỏi AI theo user, thời gian, chủ đề, nguồn dữ liệu và trạng thái trả lời.
          </p>
        </div>

        <div className="d-flex flex-wrap gap-2 justify-content-end align-items-center">
          <span className={`ai-history-api-badge ${apiMode === "real" ? "real" : "mock"}`}>
            {apiMode === "real" ? "Đang dùng API thật" : "Đang dùng dữ liệu giả"}
          </span>

          <button className="btn btn-outline-primary btn-sm" onClick={fetchAIHistory} disabled={loading}>
            Đồng bộ lại
          </button>
        </div>
      </div>

      {message && <div className="alert alert-info py-2">{message}</div>}

      <div className="row g-3 mb-4">
        <div className="col-6 col-xl-3"><div className="ai-history-stat-card"><span>Tổng câu hỏi</span><strong>{stats.total}</strong></div></div>
        <div className="col-6 col-xl-3"><div className="ai-history-stat-card success"><span>Đã trả lời</span><strong>{stats.answered}</strong></div></div>
        <div className="col-6 col-xl-3"><div className="ai-history-stat-card danger"><span>Pending</span><strong>{stats.pending}</strong></div></div>
        <div className="col-6 col-xl-3"><div className="ai-history-stat-card info"><span>Độ tin cậy TB</span><strong>{stats.avgConfidence}%</strong></div></div>
      </div>

      <div className="ai-history-filter-panel mb-4">
        <div className="ai-history-search-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input className="form-control form-control-sm bg-body" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Tìm theo câu hỏi, email user hoặc tài liệu nguồn..." />
        </div>

        <div className="ai-history-filter-select"><TailwindDropdown onChange={setUserFilter} options={[{ label: "Tất cả user", value: "all" }, ...users.map((userName) => ({ label: userName, value: userName }))]} placeholder="Tất cả user" value={userFilter} /></div>
        <div className="ai-history-filter-select"><TailwindDropdown onChange={setTopicFilter} options={[{ label: "Tất cả chủ đề", value: "all" }, ...topics.map((topic) => ({ label: topic, value: topic }))]} placeholder="Tất cả chủ đề" value={topicFilter} /></div>
        <div className="ai-history-filter-select"><TailwindDropdown onChange={setSourceFilter} options={[{ label: "Tất cả source", value: "all" }, ...sources.map((source) => ({ label: source, value: source }))]} placeholder="Tất cả source" value={sourceFilter} /></div>
        <div className="ai-history-filter-select"><TailwindDropdown onChange={setStatusFilter} options={[{ label: "Tất cả trạng thái", value: "all" }, { label: "Đã trả lời", value: "answered" }, { label: "Pending", value: "pending" }]} placeholder="Tất cả trạng thái" value={statusFilter} /></div>

        <input type="date" className="form-control form-control-sm bg-body ai-history-date-input" value={dateFrom} max={dateTo || undefined} onChange={(event) => setDateFrom(event.target.value)} title="Từ ngày" />
        <input type="date" className="form-control form-control-sm bg-body ai-history-date-input" value={dateTo} min={dateFrom || undefined} onChange={(event) => setDateTo(event.target.value)} title="Đến ngày" />

        <button className="btn btn-outline-secondary btn-sm ai-history-reset-btn" onClick={resetFilters}>Xóa lọc</button>
      </div>

      <div className="ai-history-table-card">
        <div className="table-responsive">
          <table className="table ai-history-table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th style={{ width: "30%" }}>Câu hỏi</th>
                <th style={{ width: "16%" }}>User</th>
                <th style={{ width: "12%" }}>Chủ đề</th>
                <th style={{ width: "12%" }}>Source</th>
                <th style={{ width: "12%" }}>Trạng thái</th>
                <th style={{ width: "10%" }}>Tin cậy</th>
                <th style={{ width: "8%" }}>Thời gian</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-5"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div></td>
                </tr>
              ) : paginatedHistory.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-5 text-body-secondary">Không có lịch sử AI phù hợp.</td></tr>
              ) : (
                paginatedHistory.map((item) => (
                  <tr key={item.id || item._id}>
                    <td>
                      <div className="fw-bold text-body-emphasis ai-history-question">{item.question}</div>
                      <div className="text-body-secondary small">Nguồn dùng: {(item.usedSources || []).length > 0 ? item.usedSources.join(", ") : "Không có"}</div>
                    </td>

                    <td>
                      <div className="fw-semibold">{item.userName}</div>
                      <div className="text-body-secondary small">{item.userEmail}</div>
                    </td>

                    <td>{item.topic}</td>
                    <td>{item.source}</td>

                    <td>
                      <span className={`ai-history-status-pill ${item.answerStatus === "answered" ? "answered" : "pending"}`}>
                        {item.answerStatus === "answered" ? "Đã trả lời" : "Pending"}
                      </span>
                    </td>

                    <td>
                      <div className="ai-confidence">
                        <strong>{item.confidence || 0}%</strong>
                        <div className="progress"><div className="progress-bar" style={{ width: `${item.confidence || 0}%` }}></div></div>
                      </div>
                    </td>

                    <td><span className="small text-body-secondary">{formatDateTime(item.createdAt)}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="ai-history-pagination-bar">
          <span className="text-body-secondary small">Trang {currentPageIndex}/{totalPages}</span>

          <div className="d-flex gap-2">
            <button className="btn btn-outline-secondary btn-sm" disabled={currentPageIndex <= 1} onClick={() => setCurrentPageIndex((page) => Math.max(1, page - 1))}>Trước</button>
            <button className="btn btn-outline-secondary btn-sm" disabled={currentPageIndex >= totalPages} onClick={() => setCurrentPageIndex((page) => Math.min(totalPages, page + 1))}>Sau</button>
          </div>
        </div>
      </div>
    </div>
  );
};
