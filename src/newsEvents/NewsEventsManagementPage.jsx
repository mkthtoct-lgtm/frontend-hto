import { useCallback, useEffect, useMemo, useState } from "react";
import { TailwindDropdown } from "../components/ui/TailwindDropdown";
import {
  articlePayloadFromForm,
  canManageNewsEvents,
  createNewsPost,
  DEFAULT_NEWS_IMAGE,
  deleteNewsPost,
  fetchNewsPosts,
  updateNewsPost,
} from "./newsEventsApi";

const emptyForm = {
  title: "",
  type: "news",
  category: "",
  date: new Date().toISOString().slice(0, 10),
  location: "",
  status: "Đã đăng",
  summary: "",
  content: "",
  image: DEFAULT_NEWS_IMAGE,
  author: "",
  featured: false,
};

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "-";
  return date.toLocaleDateString("vi-VN");
};

const formFromArticle = (article) => ({
  title: article.title || "",
  type: article.type || "news",
  category: article.category || "",
  date: article.date || new Date().toISOString().slice(0, 10),
  location: article.location || "",
  status: article.status || "Đã đăng",
  summary: article.summary || "",
  content: article.content || "",
  image: article.image || DEFAULT_NEWS_IMAGE,
  author: article.author || "HT Ocean Group",
  featured: Boolean(article.featured),
});

export const NewsEventsManagementPage = ({ currentUser }) => {
  const canManage = canManageNewsEvents(currentUser);
  const [articles, setArticles] = useState([]);
  const [typeFilter, setTypeFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [editingArticle, setEditingArticle] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const loadArticles = useCallback(async () => {
    setLoading(true);
    setApiError("");

    try {
      setArticles(await fetchNewsPosts());
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Không thể tải danh sách tin tức sự kiện.");
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadArticles);
  }, [loadArticles]);

  const filteredArticles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return articles
      .filter((article) => typeFilter === "all" || article.type === typeFilter)
      .filter((article) => {
        if (!normalizedQuery) return true;

        return [article.title, article.category, article.status, article.author, article.department]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [articles, query, typeFilter]);

  const openCreateModal = () => {
    setEditingArticle(null);
    setForm(emptyForm);
  };

  const openEditModal = (article) => {
    setEditingArticle(article);
    setForm(formFromArticle(article));
  };

  const closeModal = () => {
    setEditingArticle(null);
    setForm(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setActionLoading(true);
    setApiError("");

    try {
      const payload = articlePayloadFromForm(form);
      const savedArticle = editingArticle
        ? await updateNewsPost(editingArticle.id, payload)
        : await createNewsPost(payload);

      setArticles((currentArticles) => {
        const nextArticles = editingArticle
          ? currentArticles.map((article) => article.id === editingArticle.id ? savedArticle : article)
          : [savedArticle, ...currentArticles];

        return savedArticle.featured
          ? nextArticles.map((article) => ({ ...article, featured: article.id === savedArticle.id }))
          : nextArticles;
      });
      closeModal();
      loadArticles();
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Không thể lưu tin tức sự kiện.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (articleId) => {
    if (!window.confirm("Bạn có chắc muốn xóa tin tức sự kiện này?")) return;

    setActionLoading(true);
    setApiError("");

    try {
      await deleteNewsPost(articleId);
      setArticles((currentArticles) => currentArticles.filter((article) => article.id !== articleId));
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Không thể xóa tin tức sự kiện.");
    } finally {
      setActionLoading(false);
    }
  };

  if (!canManage) {
    return (
      <div className="container-fluid pt-3 pb-1" style={{ maxWidth: "1600px" }}>
        <section className="card border-0" style={{ borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div className="card-body p-4 text-center">
            <h5 className="fw-bold text-body-emphasis mb-2">Không có quyền quản lý tin tức sự kiện</h5>
            <p className="text-body-secondary mb-0">Trang này dành cho Admin, Ban giám đốc và Trưởng bộ phận.</p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="container-fluid pt-3 pb-1" style={{ maxWidth: "1600px" }}>
      <section className="card border-0 mb-3" style={{ borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <div className="card-body p-3">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
            <div>
              <div className="text-primary fw-bold text-uppercase" style={{ fontSize: "12px", letterSpacing: "0.08em" }}>News Control</div>
              <h3 className="fw-bold text-body-emphasis mb-1">Quản lý Tin tức & Sự kiện</h3>
              <div className="text-body-secondary" style={{ fontSize: "13px" }}>Kiểm soát bài đăng từ Admin, Ban giám đốc và Trưởng bộ phận.</div>
            </div>
            <button className="btn btn-sm btn-primary text-nowrap" type="button" onClick={openCreateModal}>
              Thêm mới
            </button>
          </div>

          <div className="d-flex flex-wrap align-items-center gap-2 border-top pt-3">
            <input
              className="form-control form-control-sm"
              placeholder="Tìm theo tiêu đề, danh mục, người đăng..."
              style={{ width: "280px" }}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            {[
              { id: "all", label: "Tất cả" },
              { id: "news", label: "Tin tức" },
              { id: "event", label: "Sự kiện" },
            ].map((item) => (
              <button className={`btn btn-sm ${typeFilter === item.id ? "btn-primary" : "btn-outline-primary"}`} key={item.id} type="button" onClick={() => setTypeFilter(item.id)}>
                {item.label}
              </button>
            ))}
            <span className="badge bg-body-secondary text-body align-self-center ms-auto">{filteredArticles.length} bài viết</span>
          </div>

          {(loading || apiError) && (
            <div className={`alert ${apiError ? "alert-warning" : "alert-info"} py-2 px-3 mt-3 mb-0`} style={{ fontSize: "13px" }}>
              {apiError || "Đang tải danh sách từ API..."}
            </div>
          )}
        </div>
      </section>

      <section className="card border-0" style={{ borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead>
              <tr>
                <th className="ps-3">Bài viết</th>
                <th>Loại</th>
                <th>Trạng thái</th>
                <th>Ngày</th>
                <th>Người/đơn vị đăng</th>
                <th className="text-end pe-3">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredArticles.length > 0 ? (
                filteredArticles.map((article) => (
                  <tr key={article.id}>
                    <td className="ps-3" style={{ minWidth: "320px" }}>
                      <div className="d-flex align-items-center gap-3">
                        <img src={article.image || DEFAULT_NEWS_IMAGE} alt={article.title} className="rounded bg-body-tertiary" style={{ width: "72px", height: "48px", objectFit: "cover" }} />
                        <div style={{ minWidth: 0 }}>
                          <div className="fw-semibold text-body-emphasis text-truncate">{article.title || "Chưa có tiêu đề"}</div>
                          <div className="text-body-secondary text-truncate" style={{ fontSize: "12px" }}>{article.category}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="badge bg-primary-subtle text-primary">{article.type === "event" ? "Sự kiện" : "Tin tức"}</span></td>
                    <td>
                      <span className="badge bg-success-subtle text-success">{article.status}</span>
                      {article.featured && <span className="badge bg-warning text-dark ms-2">Nổi bật</span>}
                    </td>
                    <td className="text-body-secondary" style={{ fontSize: "13px" }}>{formatDate(article.date)}</td>
                    <td className="text-body-secondary" style={{ fontSize: "13px" }}>
                      <div>{article.createdBy || article.author}</div>
                      {article.department && <div style={{ fontSize: "12px" }}>{article.department}</div>}
                    </td>
                    <td className="text-end pe-3">
                      <div className="d-inline-flex gap-2">
                        <button className="btn btn-sm btn-outline-primary" type="button" disabled={actionLoading} onClick={() => openEditModal(article)}>Sửa</button>
                        <button className="btn btn-sm btn-outline-danger" type="button" disabled={actionLoading} onClick={() => handleDelete(article.id)}>Xóa</button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="text-center text-body-secondary py-5" colSpan="6">Không có tin tức hoặc sự kiện phù hợp.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {form && (
        <NewsEventModal
          editingArticle={editingArticle}
          form={form}
          isSaving={actionLoading}
          onCancel={closeModal}
          onChange={setForm}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
};

function NewsEventModal({ editingArticle, form, isSaving = false, onCancel, onChange, onSubmit }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1050, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.52)", padding: "12px", backdropFilter: "blur(2px)" }}>
      <div style={{ width: "100%", maxWidth: "780px", maxHeight: "calc(100vh - 24px)", overflow: "hidden", borderRadius: "12px", backgroundColor: "var(--bs-body-bg)", boxShadow: "0 16px 48px rgba(0,0,0,0.22)" }}>
        <div className="d-flex align-items-center justify-content-between border-bottom p-4">
          <h5 className="fw-bold text-body-emphasis mb-0">{editingArticle ? "Sửa tin tức sự kiện" : "Thêm tin tức sự kiện"}</h5>
          <button className="btn btn-sm btn-light border" type="button" disabled={isSaving} onClick={onCancel}>Đóng</button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="p-4 overflow-y-auto" style={{ maxHeight: "calc(100vh - 180px)" }}>
            <div className="row g-3">
              <Field label="Tiêu đề" wide>
                <input className="form-control" value={form.title} onChange={(event) => onChange({ ...form, title: event.target.value })} required />
              </Field>
              <Field label="Loại">
                <TailwindDropdown onChange={(value) => onChange({ ...form, type: value })} options={[{ label: "Tin tức", value: "news" }, { label: "Sự kiện", value: "event" }]} placeholder="Chọn loại" value={form.type} />
              </Field>
              <Field label="Danh mục">
                <input className="form-control" value={form.category} onChange={(event) => onChange({ ...form, category: event.target.value })} required />
              </Field>
              <Field label="Ngày">
                <input className="form-control" type="date" value={form.date} onChange={(event) => onChange({ ...form, date: event.target.value })} required />
              </Field>
              <Field label="Trạng thái">
                <input className="form-control" value={form.status} onChange={(event) => onChange({ ...form, status: event.target.value })} required />
              </Field>
              <Field label="Địa điểm">
                <input className="form-control" value={form.location} onChange={(event) => onChange({ ...form, location: event.target.value })} required />
              </Field>
              <Field label="Tác giả/đơn vị">
                <input className="form-control" value={form.author} onChange={(event) => onChange({ ...form, author: event.target.value })} required />
              </Field>
              <Field label="Ảnh đại diện" wide>
                <input className="form-control" value={form.image} onChange={(event) => onChange({ ...form, image: event.target.value })} required />
              </Field>
              <Field label="Tóm tắt" wide>
                <textarea className="form-control" rows="3" value={form.summary} onChange={(event) => onChange({ ...form, summary: event.target.value })} required />
              </Field>
              <Field label="Nội dung" wide>
                <textarea className="form-control" rows="5" value={form.content} onChange={(event) => onChange({ ...form, content: event.target.value })} required />
              </Field>
              <div className="col-12">
                <label className="form-check">
                  <input className="form-check-input" type="checkbox" checked={form.featured} onChange={(event) => onChange({ ...form, featured: event.target.checked })} />
                  <span className="form-check-label fw-semibold">Đặt làm tin nổi bật</span>
                </label>
              </div>
            </div>
          </div>
          <div className="d-flex justify-content-end gap-2 border-top p-4">
            <button className="btn btn-light border" type="button" disabled={isSaving} onClick={onCancel}>Hủy</button>
            <button className="btn btn-primary" type="submit" disabled={isSaving}>{isSaving ? "Đang lưu..." : "Lưu"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ children, label, wide = false }) {
  return (
    <div className={wide ? "col-12" : "col-12 col-md-6"}>
      <label className="form-label fw-semibold">{label}</label>
      {children}
    </div>
  );
}
