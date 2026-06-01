import { useCallback, useEffect, useMemo, useState } from "react";
import "./AIPendingQuestionsPage.css";

const API_BASE_URL = "http://localhost:3000/api/v1";
const USE_MOCK_WHEN_API_FAIL = true;

const MOCK_PENDING_QUESTIONS = [
  {
    id: "aiq-001",
    question: "Khách hàng chưa có bằng B1 thì có thể nộp hồ sơ du học nghề Đức trước không?",
    askedBy: "Nguyễn Minh Anh",
    askedByEmail: "minhanh@example.com",
    topic: "Du học Đức",
    source: "Chatbot website",
    status: "pending",
    priority: "high",
    createdAt: "2026-05-24T09:30:00",
    suggestedDocuments: [
      { id: "doc-002", title: "Checklist hồ sơ visa du học" },
      { id: "doc-007", title: "Tài liệu đào tạo tư vấn viên mới" }
    ]
  },
  {
    id: "aiq-002",
    question: "Nếu khách hàng muốn đổi ngành sau khi đã nhận tư vấn thì quy trình CRM xử lý thế nào?",
    askedBy: "Trần Quốc Huy",
    askedByEmail: "huy.tran@example.com",
    topic: "CRM",
    source: "AI nội bộ",
    status: "pending",
    priority: "medium",
    createdAt: "2026-05-23T15:12:00",
    suggestedDocuments: [
      { id: "doc-003", title: "SOP xử lý lead từ website" }
    ]
  },
  {
    id: "aiq-003",
    question: "Tài liệu nào quy định quyền tạo mới tài khoản nhân sự?",
    askedBy: "Lê Thanh",
    askedByEmail: "lethanh@example.com",
    topic: "Phân quyền",
    source: "AI nội bộ",
    status: "reviewing",
    priority: "low",
    createdAt: "2026-05-22T11:05:00",
    suggestedDocuments: [
      { id: "doc-004", title: "Chính sách phân quyền tài khoản nội bộ" }
    ]
  },
  {
    id: "aiq-004",
    question: "Khách hàng hỏi chi phí định cư theo diện đầu tư thì nên dùng bảng giá nào?",
    askedBy: "Phạm Quỳnh",
    askedByEmail: "quynh.pham@example.com",
    topic: "Định cư",
    source: "Chatbot website",
    status: "pending",
    priority: "high",
    createdAt: "2026-05-21T10:42:00",
    suggestedDocuments: [
      { id: "doc-006", title: "Bảng giá dịch vụ tham khảo" },
      { id: "doc-009", title: "FAQ chương trình định cư" }
    ]
  }
];

const STATUS_META = {
  pending: { label: "Chờ xử lý", className: "ai-pending-status-pending" },
  reviewing: { label: "Đang xem", className: "ai-pending-status-reviewing" },
  answered: { label: "Đã phản hồi", className: "ai-pending-status-answered" }
};

const PRIORITY_META = {
  high: { label: "Cao", className: "ai-priority-high" },
  medium: { label: "Trung bình", className: "ai-priority-medium" },
  low: { label: "Thấp", className: "ai-priority-low" }
};

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

const canAccessPendingPage = (currentUser) => {
  const roleName = normalizeRole(currentUser?.role?.name || currentUser?.roleName || currentUser?.role);
  return ["admin", "bangiamdoc", "truongbophan", "hethong"].includes(roleName);
};

const getSafeId = (item) => String(item?._id || item?.id || item?.questionId || "");

const formatDateTime = (dateValue) => {
  if (!dateValue) return "—";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" });
};

export const AIPendingQuestionsPage = ({ currentUser }) => {
  const [questions, setQuestions] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [answerText, setAnswerText] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [apiMode, setApiMode] = useState("mock");
  const [message, setMessage] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [topicFilter, setTopicFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const canAccess = canAccessPendingPage(currentUser);

  const fetchPendingQuestions = useCallback(async () => {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/ai/questions/pending`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });

      if (!response.ok) {
        throw new Error("API câu hỏi pending chưa sẵn sàng hoặc tài khoản hiện tại chưa có quyền truy cập.");
      }

      const payload = await response.json();
      const data = normalizeArrayResponse(payload);

      setQuestions(data);
      setSelectedId((currentId) => currentId || getSafeId(data[0]));
      setApiMode("real");
    } catch (err) {
      if (USE_MOCK_WHEN_API_FAIL) {
        setQuestions(MOCK_PENDING_QUESTIONS);
        setSelectedId((currentId) => currentId || MOCK_PENDING_QUESTIONS[0]?.id || "");
        setApiMode("mock");
      } else {
        setMessage(err.message || "Không thể tải câu hỏi pending.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canAccess) {
      fetchPendingQuestions();
    }
  }, [fetchPendingQuestions, canAccess]);

  const topics = useMemo(() => Array.from(new Set(questions.map((item) => item.topic).filter(Boolean))), [questions]);
  const sources = useMemo(() => Array.from(new Set(questions.map((item) => item.source).filter(Boolean))), [questions]);

  const filteredQuestions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return questions.filter((item) => {
      const matchSearch =
        !term ||
        String(item.question || "").toLowerCase().includes(term) ||
        String(item.askedBy || "").toLowerCase().includes(term) ||
        String(item.askedByEmail || "").toLowerCase().includes(term);

      return (
        matchSearch &&
        (topicFilter === "all" || item.topic === topicFilter) &&
        (sourceFilter === "all" || item.source === sourceFilter) &&
        (statusFilter === "all" || item.status === statusFilter)
      );
    });
  }, [questions, searchTerm, topicFilter, sourceFilter, statusFilter]);

  const selectedQuestion = useMemo(() => {
    return questions.find((item) => getSafeId(item) === selectedId) || filteredQuestions[0] || questions[0] || null;
  }, [questions, selectedId, filteredQuestions]);

  useEffect(() => {
    setAnswerText("");
    setInternalNote("");
  }, [selectedId]);

  const stats = useMemo(() => {
    return {
      total: questions.length,
      pending: questions.filter((item) => item.status === "pending").length,
      reviewing: questions.filter((item) => item.status === "reviewing").length,
      high: questions.filter((item) => item.priority === "high").length
    };
  }, [questions]);

  const handleResolveQuestion = async () => {
    if (!selectedQuestion || !answerText.trim()) {
      setMessage("Vui lòng nhập phản hồi trước khi hoàn tất câu hỏi.");
      return;
    }

    setSaving(true);
    setMessage("");

    const questionId = getSafeId(selectedQuestion);

    const payload = {
      answer: answerText.trim(),
      internalNote: internalNote.trim(),
      status: "answered",
      resolvedAt: new Date().toISOString(),
      linkedDocumentIds: (selectedQuestion.suggestedDocuments || []).map((doc) => doc.id)
    };

    try {
      if (apiMode === "mock") {
        await new Promise((resolve) => setTimeout(resolve, 450));

        setQuestions((current) =>
          current.map((item) => (getSafeId(item) === questionId ? { ...item, ...payload } : item))
        );

        setMessage("Đã mô phỏng phản hồi câu hỏi pending thành công.");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/ai/questions/${questionId}/resolve`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Không thể gửi phản hồi câu hỏi pending.");
      }

      const savedPayload = await response.json();
      const savedQuestion = savedPayload?.data || savedPayload;

      setQuestions((current) => current.map((item) => (getSafeId(item) === questionId ? savedQuestion : item)));
      setMessage("Đã phản hồi câu hỏi pending thành công.");
    } catch (err) {
      setMessage(err.message || "Xử lý câu hỏi thất bại.");
    } finally {
      setSaving(false);
    }
  };

  const handleMarkReviewing = () => {
    if (!selectedQuestion) return;

    const questionId = getSafeId(selectedQuestion);

    setQuestions((current) =>
      current.map((item) => (getSafeId(item) === questionId ? { ...item, status: "reviewing" } : item))
    );
  };

  if (!canAccess) {
    return (
      <div className="ai-pending-page container-fluid pt-5 pb-4" style={{ maxWidth: "1180px" }}>
        <div className="ai-pending-denied">
          <h4 className="fw-bold text-danger">Từ chối quyền truy cập</h4>
          <p className="text-body-secondary mb-0">
            Chỉ Admin, Ban giám đốc, Trưởng bộ phận hoặc Hệ thống được xử lý câu hỏi AI pending.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-pending-page container-fluid pt-3 pb-4" style={{ maxWidth: "1600px" }}>
      <div className="ai-pending-hero mb-4">
        <div>
          <span className="ai-pending-eyebrow">AI pending questions</span>
          <h4 className="fw-bold text-body-emphasis mb-1">Xử lý câu hỏi AI chưa trả lời</h4>
          <p className="text-body-secondary mb-0">
            Trưởng bộ phận xem câu hỏi AI chưa đủ dữ liệu, phản hồi thủ công hoặc bổ sung tài liệu liên quan để cải thiện nguồn tri thức.
          </p>
        </div>

        <div className="d-flex flex-wrap gap-2 justify-content-end align-items-center">
          <span className={`ai-pending-api-badge ${apiMode === "real" ? "real" : "mock"}`}>
            {apiMode === "real" ? "Đang dùng API thật" : "Đang dùng dữ liệu giả"}
          </span>

          <button className="btn btn-outline-primary btn-sm" onClick={fetchPendingQuestions} disabled={loading}>
            Đồng bộ lại
          </button>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-6 col-xl-3"><div className="ai-pending-stat-card"><span>Tổng câu hỏi</span><strong>{stats.total}</strong></div></div>
        <div className="col-6 col-xl-3"><div className="ai-pending-stat-card danger"><span>Chờ xử lý</span><strong>{stats.pending}</strong></div></div>
        <div className="col-6 col-xl-3"><div className="ai-pending-stat-card warning"><span>Đang xem</span><strong>{stats.reviewing}</strong></div></div>
        <div className="col-6 col-xl-3"><div className="ai-pending-stat-card high"><span>Ưu tiên cao</span><strong>{stats.high}</strong></div></div>
      </div>

      {message && <div className="alert alert-info py-2">{message}</div>}

      <div className="ai-pending-filter-bar mb-4">
        <div className="ai-pending-search-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input className="form-control form-control-sm bg-body" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Tìm theo câu hỏi, người hỏi hoặc email..." />
        </div>

        <select className="form-select form-select-sm bg-body ai-pending-filter-select" value={topicFilter} onChange={(event) => setTopicFilter(event.target.value)}>
          <option value="all">Tất cả chủ đề</option>
          {topics.map((topic) => <option key={topic} value={topic}>{topic}</option>)}
        </select>

        <select className="form-select form-select-sm bg-body ai-pending-filter-select" value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}>
          <option value="all">Tất cả source</option>
          {sources.map((source) => <option key={source} value={source}>{source}</option>)}
        </select>

        <select className="form-select form-select-sm bg-body ai-pending-filter-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="all">Tất cả trạng thái</option>
          <option value="pending">Chờ xử lý</option>
          <option value="reviewing">Đang xem</option>
          <option value="answered">Đã phản hồi</option>
        </select>
      </div>

      <div className="row g-3 align-items-start">
        <div className="col-12 col-xl-5">
          <div className="ai-pending-list-panel">
            <div className="ai-pending-panel-header">
              <h6 className="fw-bold mb-0">Danh sách câu hỏi pending</h6>
              <span className="text-body-secondary small">{filteredQuestions.length} kết quả phù hợp</span>
            </div>

            <div className="ai-pending-list-scroll">
              {loading ? (
                <div className="text-center py-5"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div></div>
              ) : filteredQuestions.length === 0 ? (
                <div className="text-center py-5 text-body-secondary">Không có câu hỏi pending phù hợp.</div>
              ) : (
                filteredQuestions.map((item) => {
                  const itemId = getSafeId(item);
                  const statusMeta = STATUS_META[item.status] || STATUS_META.pending;
                  const priorityMeta = PRIORITY_META[item.priority] || PRIORITY_META.low;

                  return (
                    <button key={itemId} type="button" className={`ai-pending-list-item ${selectedQuestion && getSafeId(selectedQuestion) === itemId ? "active" : ""}`} onClick={() => setSelectedId(itemId)}>
                      <div className="d-flex justify-content-between gap-3 align-items-start">
                        <span className={`ai-pending-status-pill ${statusMeta.className}`}>{statusMeta.label}</span>
                        <span className={`ai-priority-pill ${priorityMeta.className}`}>{priorityMeta.label}</span>
                      </div>

                      <div className="ai-pending-question-text">{item.question}</div>

                      <div className="ai-pending-meta">
                        <span>{item.topic}</span>
                        <span>{item.source}</span>
                        <span>{formatDateTime(item.createdAt)}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-7">
          <div className="ai-pending-detail-panel">
            {selectedQuestion ? (
              <>
                <div className="d-flex justify-content-between gap-3 align-items-start mb-3">
                  <div>
                    <span className="ai-pending-eyebrow">Chi tiết câu hỏi</span>
                    <h5 className="fw-bold text-body-emphasis mb-2">{selectedQuestion.question}</h5>
                    <p className="text-body-secondary mb-0">Người hỏi: {selectedQuestion.askedBy} · {selectedQuestion.askedByEmail}</p>
                  </div>

                  <span className={`ai-pending-status-pill ${STATUS_META[selectedQuestion.status]?.className || "ai-pending-status-pending"}`}>
                    {STATUS_META[selectedQuestion.status]?.label || "Chờ xử lý"}
                  </span>
                </div>

                <div className="ai-pending-meta-grid mb-4">
                  <div><span>Chủ đề</span><strong>{selectedQuestion.topic}</strong></div>
                  <div><span>Source</span><strong>{selectedQuestion.source}</strong></div>
                  <div><span>Thời gian hỏi</span><strong>{formatDateTime(selectedQuestion.createdAt)}</strong></div>
                  <div><span>Độ ưu tiên</span><strong>{PRIORITY_META[selectedQuestion.priority]?.label || "—"}</strong></div>
                </div>

                <div className="mb-4">
                  <div className="ai-pending-section-title">Tài liệu gợi ý</div>
                  <div className="ai-suggested-doc-list">
                    {(selectedQuestion.suggestedDocuments || []).map((doc) => (
                      <div key={doc.id} className="ai-suggested-doc-item">
                        <span>{doc.id}</span>
                        <strong>{doc.title}</strong>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold">Phản hồi cho câu hỏi</label>
                  <textarea className="form-control" rows="5" value={answerText} onChange={(event) => setAnswerText(event.target.value)} placeholder="Nhập câu trả lời chuẩn để AI có thể dùng lại sau này..."></textarea>
                </div>

                <div className="mb-4">
                  <label className="form-label fw-bold">Ghi chú nội bộ / tài liệu cần bổ sung</label>
                  <textarea className="form-control" rows="3" value={internalNote} onChange={(event) => setInternalNote(event.target.value)} placeholder="Ví dụ: cần bổ sung SOP mới về điều kiện hồ sơ B1..."></textarea>
                </div>

                <div className="d-flex flex-wrap gap-2 justify-content-end">
                  <button className="btn btn-outline-primary" onClick={handleMarkReviewing} disabled={selectedQuestion.status === "answered"}>
                    Đánh dấu đang xem
                  </button>

                  <button className="btn btn-primary" onClick={handleResolveQuestion} disabled={saving || selectedQuestion.status === "answered"}>
                    {saving ? "Đang gửi..." : "Gửi phản hồi"}
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-5 text-body-secondary">Chọn một câu hỏi để xử lý.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
