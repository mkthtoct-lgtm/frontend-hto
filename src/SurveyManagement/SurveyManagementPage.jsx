import { useState, useEffect } from "react";
import { authFetch, getAuthHeaders } from "../auth/session";
import { API_BASE_URL } from "../config/api";

export const SurveyManagementPage = ({ currentUser }) => {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSurvey, setEditingSurvey] = useState(null);

  // Form States
  const [formTitle, setFormTitle] = useState("");
  const [formKind, setFormKind] = useState("internal");
  const [formBaseUrl, setFormBaseUrl] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formQuestions, setFormQuestions] = useState([]);
  const [formWebhookUrl, setFormWebhookUrl] = useState("");
  const [formStatus, setFormStatus] = useState("active");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Responses panel
  const [showResponses, setShowResponses] = useState(false);
  const [responses, setResponses] = useState([]);
  const [responsesLoading, setResponsesLoading] = useState(false);
  const [selectedSurveyForResponses, setSelectedSurveyForResponses] = useState(null);

  // Load surveys from API
  const fetchSurveys = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/surveys`, {
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        setSurveys(json.data || []);
      }
    } catch (err) {
      console.error("Lỗi tải danh sách khảo sát:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSurveys(); }, []);

  // Open Modal for Add/Edit
  const openModal = (survey = null) => {
    if (survey) {
      setEditingSurvey(survey);
      setFormTitle(survey.title);
      setFormKind(survey.kind || (survey.questions?.length ? "internal" : "external"));
      setFormBaseUrl(survey.baseUrl);
      setFormDescription(survey.description || "");
      setFormQuestions(survey.questions || []);
      setFormWebhookUrl(survey.googleSheetWebhookUrl || "");
      setFormStatus(survey.status);
    } else {
      setEditingSurvey(null);
      setFormTitle("");
      setFormKind("internal");
      setFormBaseUrl("");
      setFormDescription("");
      setFormQuestions([]);
      setFormWebhookUrl("");
      setFormStatus("active");
    }
    setError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSurvey(null);
    setFormTitle("");
    setFormKind("internal");
    setFormBaseUrl("");
    setFormDescription("");
    setFormQuestions([]);
    setFormWebhookUrl("");
    setError("");
  };

  // Handle Submit Form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const trimmedTitle = formTitle.trim();
    const trimmedBaseUrl = formBaseUrl.trim();

    if (!trimmedTitle) { setError("Vui lòng nhập tên khảo sát."); return; }
    if (formKind === "external" && (!trimmedBaseUrl || !/^https?:\/\//i.test(trimmedBaseUrl))) { setError("Vui lòng nhập link khảo sát bên ngoài hợp lệ."); return; }
    setSaving(true);
    try {
      const payload = {
        title: trimmedTitle,
        kind: formKind,
        baseUrl: trimmedBaseUrl,
        description: formDescription.trim(),
        questions: formQuestions.map((question) => ({ ...question, options: question.options.filter(Boolean) })),
        googleSheetWebhookUrl: formWebhookUrl.trim(),
        status: formStatus,
      };

      const url = editingSurvey
        ? `${API_BASE_URL}/surveys/${editingSurvey._id}`
        : `${API_BASE_URL}/surveys`;
      const method = editingSurvey ? "PUT" : "POST";

      const res = await authFetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError(json?.message || "Lỗi khi lưu khảo sát.");
        return;
      }
      if (!editingSurvey && formKind === "internal" && json?.data?._id) {
        await authFetch(`${API_BASE_URL}/surveys/${json.data._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          body: JSON.stringify({ baseUrl: `${window.location.origin}/survey/${json.data._id}` }),
        });
      }
      closeModal();
      fetchSurveys();
    } catch (err) {
      setError("Lỗi kết nối máy chủ.");
    } finally {
      setSaving(false);
    }
  };

  const addQuestion = () => setFormQuestions((items) => [...items, { label: "", type: "text", required: false, options: [] }]);
  const updateQuestion = (index, patch) => setFormQuestions((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  const removeQuestion = (index) => setFormQuestions((items) => items.filter((_, itemIndex) => itemIndex !== index));

  // Toggle Status
  const handleToggleStatus = async (survey) => {
    try {
      await authFetch(`${API_BASE_URL}/surveys/${survey._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ status: survey.status === "active" ? "inactive" : "active" }),
      });
      fetchSurveys();
    } catch (err) {
      console.error("Lỗi chuyển trạng thái:", err);
    }
  };

  // Delete
  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa form khảo sát này không?")) return;
    try {
      await authFetch(`${API_BASE_URL}/surveys/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      });
      fetchSurveys();
    } catch (err) {
      console.error("Lỗi xóa:", err);
    }
  };

  const copyToClipboard = async (value) => {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      const copied = document.execCommand("copy");
      document.body.removeChild(textarea);
      return copied;
    }
  };

  // Copy Link
  const handleCopyPreviewLink = async (baseUrl) => {
    const cleanUrl = baseUrl.replace(/\/$/, "");
    const separator = cleanUrl.includes("?") ? "&" : "?";
    const previewUrl = `${cleanUrl}${separator}ctv=MA_PREVIEW`;
    const copied = await copyToClipboard(previewUrl);
    alert(copied ? "Đã sao chép link preview mẫu." : "Không thể tự động sao chép. Hãy bôi đen link và nhấn Ctrl+C.");
  };

  // View responses
  const handleViewResponses = async (survey) => {
    setSelectedSurveyForResponses(survey);
    setShowResponses(true);
    setResponsesLoading(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/surveys/responses?surveyId=${survey._id}&limit=50`, {
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        setResponses(json.data?.responses || []);
      }
    } catch (err) {
      console.error("Lỗi tải phản hồi:", err);
    } finally {
      setResponsesLoading(false);
    }
  };

  // Filter and search
  const filteredSurveys = surveys.filter((s) => {
    const matchesSearch =
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.baseUrl.toLowerCase().includes(searchQuery.toLowerCase());
    if (statusFilter === "all") return matchesSearch;
    return matchesSearch && s.status === statusFilter;
  });

  return (
    <div className="survey-management-page mx-auto w-full max-w-[1280px] bg-[#f8fbff] px-3 py-4 text-slate-900 app-dark:bg-[#151515] app-dark:text-slate-100 sm:px-4">
      {/* HEADER SECTION */}
      <section className="mb-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-[0_10px_28px_rgba(30,64,175,0.06)] app-dark:border-slate-700 app-dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="m-0 text-xl font-black text-slate-950 app-dark:text-slate-50">
            Quản lý Form Khảo sát
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Quản lý các đường dẫn khảo sát Zalo Mini App để phân phối mã QR và link giới thiệu cho Cộng tác viên. Dữ liệu phản hồi tự động đồng bộ lên Google Sheet.
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-indigo-100 hover:bg-indigo-750 app-dark:bg-sky-500 app-dark:shadow-none"
          type="button"
          onClick={() => openModal()}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Thêm khảo sát
        </button>
      </section>

      {/* SEARCH AND FILTER BAR */}
      <section className="mb-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm app-dark:border-slate-700 app-dark:bg-slate-900">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Tìm kiếm theo tiêu đề hoặc đường dẫn..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-150 app-dark:border-slate-700 app-dark:bg-slate-950"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="absolute left-3 top-2.5 text-slate-400">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.637 10.637z" />
              </svg>
            </span>
          </div>
          <div className="w-full sm:w-[180px]">
            <select
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-indigo-500 app-dark:border-slate-700 app-dark:bg-slate-950"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Tạm ngưng</option>
            </select>
          </div>
        </div>
      </section>

      {/* TABLE LIST SECTION */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_10px_28px_rgba(30,64,175,0.06)] app-dark:border-slate-700 app-dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-xs font-black uppercase text-slate-500 app-dark:bg-slate-950">
              <tr>
                <th className="px-4 py-3">Tên Khảo sát</th>
                <th className="px-4 py-3">Link Gốc</th>
                <th className="px-4 py-3">Webhook GG Sheet</th>
                <th className="px-4 py-3 text-center">Trạng Thái</th>
                <th className="px-4 py-3">Ngày tạo</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 app-dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan="6" className="px-4 py-8 text-center text-slate-400">Đang tải...</td></tr>
              ) : filteredSurveys.length > 0 ? (
                filteredSurveys.map((survey) => (
                  <tr key={survey._id} className="hover:bg-slate-50/50 app-dark:hover:bg-slate-950/20">
                    <td className="px-4 py-3 font-semibold text-slate-900 app-dark:text-slate-50">
                      {survey.title}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      <div className="flex items-center gap-2">
                        <input
                          className="min-w-[220px] max-w-[360px] flex-1 rounded-md border border-slate-200 bg-white px-2 py-1 font-mono text-xs text-slate-600 outline-none focus:border-indigo-400 app-dark:border-slate-700 app-dark:bg-slate-950 app-dark:text-slate-300"
                          value={survey.baseUrl}
                          readOnly
                          title="Bấm vào ô để chọn toàn bộ link"
                          onFocus={(event) => event.currentTarget.select()}
                          onClick={(event) => event.currentTarget.select()}
                        />
                        <button type="button" className="text-indigo-600 hover:text-indigo-800" onClick={() => handleCopyPreviewLink(survey.baseUrl)} title="Copy Link CTV Preview mẫu">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {survey.googleSheetWebhookUrl ? (
                        <span className="inline-flex items-center gap-1 text-green-600 font-semibold">
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                          Đã cấu hình
                        </span>
                      ) : (
                        <span className="text-slate-300">Chưa cấu hình</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${survey.status === "active" ? "bg-green-500" : "bg-slate-200 app-dark:bg-slate-700"}`}
                          onClick={() => handleToggleStatus(survey)}
                        >
                          <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${survey.status === "active" ? "translate-x-5" : "translate-x-0"}`} />
                        </button>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-black uppercase ${survey.status === "active" ? "bg-green-100 text-green-800 app-dark:bg-green-950/30 app-dark:text-green-400" : "bg-slate-100 text-slate-800 app-dark:bg-slate-850 app-dark:text-slate-400"}`}>
                          {survey.status === "active" ? "Bật" : "Tắt"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {new Date(survey.createdAt).toLocaleDateString("vi-VN", { year: "numeric", month: "2-digit", day: "2-digit" })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="rounded-lg border border-emerald-200 bg-emerald-50 p-1.5 text-emerald-600 hover:bg-emerald-100 app-dark:border-emerald-900/30 app-dark:bg-emerald-950/20 app-dark:text-emerald-400" type="button" onClick={() => handleViewResponses(survey)} title="Xem phản hồi">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" /></svg>
                        </button>
                        <button className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50 app-dark:border-slate-750 app-dark:bg-slate-950 app-dark:text-slate-400" type="button" onClick={() => openModal(survey)} title="Chỉnh sửa">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>
                        </button>
                        <button className="rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-rose-600 hover:bg-rose-100 app-dark:border-rose-900/30 app-dark:bg-rose-950/20 app-dark:text-rose-400" type="button" onClick={() => handleDelete(survey._id)} title="Xóa">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="6" className="px-4 py-8 text-center text-slate-400">Không tìm thấy form khảo sát nào phù hợp.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* FORM DIALOG MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[1080] grid place-items-center bg-slate-900/50 p-4 backdrop-blur-xs" role="dialog" aria-modal="true">
          <form className="max-h-[92vh] w-full max-w-[720px] overflow-y-auto rounded-2xl bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.28)] app-dark:bg-slate-900 border border-slate-200 app-dark:border-slate-800" onSubmit={handleSubmit}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">{editingSurvey ? "Chỉnh sửa" : "Tạo mới"}</span>
                <h2 className="m-0 text-lg font-black text-slate-950 app-dark:text-slate-50">{editingSurvey ? "Thông tin khảo sát" : "Form khảo sát mới"}</h2>
              </div>
              <button type="button" className="grid h-8 w-8 place-items-center rounded-full border-0 bg-slate-100 text-lg leading-none text-slate-800 hover:bg-slate-200 app-dark:bg-slate-800 app-dark:text-slate-200" onClick={closeModal}>×</button>
            </div>

            {error && <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">{error}</div>}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1 app-dark:bg-slate-800">
                <button type="button" onClick={() => setFormKind("internal")} className={`rounded-lg px-3 py-2 text-xs font-bold ${formKind === "internal" ? "bg-white text-indigo-700 shadow app-dark:bg-slate-950" : "text-slate-500"}`}>Form nội bộ HTO</button>
                <button type="button" onClick={() => setFormKind("external")} className={`rounded-lg px-3 py-2 text-xs font-bold ${formKind === "external" ? "bg-white text-indigo-700 shadow app-dark:bg-slate-950" : "text-slate-500"}`}>Link Google Form / bên ngoài</button>
              </div>
              <label className="block text-xs font-extrabold text-slate-700 app-dark:text-slate-300">
                Tên chương trình khảo sát
                <input type="text" placeholder="Ví dụ: Khảo sát Du học nghề Đức khóa 10" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-150 app-dark:border-slate-700 app-dark:bg-slate-950" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} required />
              </label>

              <label className="block text-xs font-extrabold text-slate-700 app-dark:text-slate-300">Mô tả khảo sát
                <textarea rows="2" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-normal outline-none focus:border-indigo-500 app-dark:border-slate-700 app-dark:bg-slate-950" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} />
              </label>

              {formKind === "external" && <label className="block text-xs font-extrabold text-slate-700 app-dark:text-slate-300">Link khảo sát bên ngoài
                <input type="url" required placeholder="https://docs.google.com/forms/... hoặc link khảo sát khác" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-mono outline-none focus:border-indigo-500 app-dark:border-slate-700 app-dark:bg-slate-950" value={formBaseUrl} onChange={(e) => setFormBaseUrl(e.target.value)} />
              </label>}

              {formKind === "internal" && <div className="rounded-xl border border-slate-200 p-3 app-dark:border-slate-700">
                <div className="mb-3 flex items-center justify-between"><span className="text-xs font-extrabold">Các câu hỏi</span><button type="button" onClick={addQuestion} className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">+ Thêm câu hỏi</button></div>
                <div className="space-y-3">
                  {formQuestions.map((question, index) => <div key={question._id || index} className="rounded-lg bg-slate-50 p-3 app-dark:bg-slate-950">
                    <div className="grid gap-2 sm:grid-cols-[1fr_140px_auto]">
                      <input required placeholder="Nội dung câu hỏi" className="rounded-lg border px-2.5 py-2 text-sm" value={question.label} onChange={(e) => updateQuestion(index, { label: e.target.value })} />
                      <select className="rounded-lg border px-2 py-2 text-sm" value={question.type} onChange={(e) => updateQuestion(index, { type: e.target.value })}><option value="text">Trả lời ngắn</option><option value="textarea">Trả lời dài</option><option value="select">Danh sách chọn</option></select>
                      <button type="button" onClick={() => removeQuestion(index)} className="rounded-lg px-2 text-sm font-bold text-rose-600">Xóa</button>
                    </div>
                    {(question.type === "select" || question.type === "radio") && <input placeholder="Các lựa chọn, cách nhau bằng dấu phẩy" className="mt-2 w-full rounded-lg border px-2.5 py-2 text-sm" value={(question.options || []).join(", ")} onChange={(e) => updateQuestion(index, { options: e.target.value.split(",").map((item) => item.trim()) })} />}
                    <label className="mt-2 inline-flex items-center gap-2 text-xs font-semibold"><input type="checkbox" checked={question.required} onChange={(e) => updateQuestion(index, { required: e.target.checked })} /> Bắt buộc trả lời</label>
                  </div>)}
                  {formQuestions.length === 0 && <p className="py-3 text-center text-xs text-slate-400">Chưa có câu hỏi tùy chỉnh.</p>}
                </div>
              </div>}

              <label className="block text-xs font-extrabold text-slate-700 app-dark:text-slate-300">
                Link Webhook Google Sheet (Apps Script URL)
                <input type="url" placeholder="https://script.google.com/macros/s/.../exec" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-mono outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-150 app-dark:border-slate-700 app-dark:bg-slate-950" value={formWebhookUrl} onChange={(e) => setFormWebhookUrl(e.target.value)} />
                <span className="mt-1 block text-[10px] text-slate-400">Khi có phản hồi khảo sát, dữ liệu sẽ tự động ghi vào Google Sheet qua URL này.</span>
              </label>

              <div className="block text-xs font-extrabold text-slate-700 app-dark:text-slate-300">
                Trạng thái
                <div className="mt-2 flex gap-4">
                  <label className="inline-flex items-center gap-2 font-medium cursor-pointer text-sm">
                    <input type="radio" name="status" value="active" checked={formStatus === "active"} onChange={() => setFormStatus("active")} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500" />
                    Hoạt động
                  </label>
                  <label className="inline-flex items-center gap-2 font-medium cursor-pointer text-sm">
                    <input type="radio" name="status" value="inactive" checked={formStatus === "inactive"} onChange={() => setFormStatus("inactive")} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500" />
                    Tạm dừng
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2.5">
              <button type="button" className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 app-dark:border-slate-700 app-dark:bg-slate-800 app-dark:text-slate-200" onClick={closeModal}>Hủy</button>
              <button type="submit" disabled={saving} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-100 hover:bg-indigo-750 app-dark:bg-sky-500 app-dark:shadow-none disabled:opacity-50">
                {saving ? "Đang lưu..." : editingSurvey ? "Lưu thay đổi" : "Tạo khảo sát"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* RESPONSES MODAL */}
      {showResponses && selectedSurveyForResponses && (
        <div className="fixed inset-0 z-[1080] grid place-items-center bg-slate-900/50 p-4 backdrop-blur-xs" role="dialog" aria-modal="true">
          <div className="w-full max-w-[800px] rounded-2xl bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.28)] app-dark:bg-slate-900 border border-slate-200 app-dark:border-slate-800 max-h-[80vh] flex flex-col">
            <div className="mb-4 flex items-center justify-between flex-shrink-0">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Phản hồi khảo sát</span>
                <h2 className="m-0 text-lg font-black text-slate-950 app-dark:text-slate-50">{selectedSurveyForResponses.title}</h2>
              </div>
              <button type="button" className="grid h-8 w-8 place-items-center rounded-full border-0 bg-slate-100 text-lg leading-none text-slate-800 hover:bg-slate-200" onClick={() => setShowResponses(false)}>×</button>
            </div>
            <div className="overflow-auto flex-1">
              {responsesLoading ? (
                <p className="text-center text-slate-400 py-8">Đang tải phản hồi...</p>
              ) : responses.length === 0 ? (
                <p className="text-center text-slate-400 py-8">Chưa có phản hồi nào.</p>
              ) : (
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-black uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Họ tên</th>
                      <th className="px-3 py-2">SĐT</th>
                      <th className="px-3 py-2">Email</th>
                      <th className="px-3 py-2">Mã CTV</th>
                      <th className="px-3 py-2">GG Sheet</th>
                      <th className="px-3 py-2">Thời gian</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {responses.map((r) => (
                      <tr key={r._id}>
                        <td className="px-3 py-2 font-semibold">{r.customerName}</td>
                        <td className="px-3 py-2">{r.phone}</td>
                        <td className="px-3 py-2">{r.email || "—"}</td>
                        <td className="px-3 py-2">{r.ctvCode || "—"}</td>
                        <td className="px-3 py-2">{r.sheetSynced ? <span className="text-green-600 font-bold">✓</span> : <span className="text-slate-300">✗</span>}</td>
                        <td className="px-3 py-2 text-xs text-slate-500">{new Date(r.submittedAt).toLocaleString("vi-VN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
