import { useMemo, useState } from "react";
import { GUIDE_CATEGORIES } from "./guideContent";

// Icon đơn giản dùng chung cho các category (không cần thư viện icon ngoài)
const CategoryIcon = ({ path, className = "" }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {path}
  </svg>
);

const CATEGORY_ICON_PATHS = {
  "bat-dau": <><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" /></>,
  "san-pham-dich-vu": <><path d="M20 7 12 3 4 7l8 4 8-4Z" /><path d="M4 7v10l8 4" /><path d="M20 7v10l-8 4" /><path d="M12 11v10" /></>,
  "nghiep-vu": <><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></>,
  "ho-tro-khach-hang": <><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></>,
  "tin-tuc-media": <><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></>,
  "ai-noi-bo": <><rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /><path d="M12 7v4M8 16h.01M16 16h.01" /></>,
  "khao-sat": <><path d="M9 11l3 3L22 4" /><path d="M12 2a10 10 0 1 0 9.54 7" /></>,
  "quan-tri-he-thong": <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></>,
};

// Chuẩn hoá chuỗi tiếng Việt để tìm kiếm không phân biệt dấu (vd "hoa hong" vẫn khớp "hoa hồng")
const normalize = (str = "") =>
  str
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase();

// Đánh dấu (highlight) từ khoá tìm kiếm khớp trong văn bản hiển thị
const HighlightMatch = ({ text, query }) => {
  if (!query || !query.trim()) return <>{text}</>;
  const normText = normalize(text);
  const normQuery = normalize(query.trim());
  const idx = normText.indexOf(normQuery);
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="px-0 bg-warning-subtle text-warning-emphasis rounded-1">{text.slice(idx, idx + normQuery.length)}</mark>
      {text.slice(idx + normQuery.length)}
    </>
  );
};

/**
 * Trang "Khu vực lưu trữ tài liệu hướng dẫn" - cẩm nang sử dụng Portal HTO.
 * Đóng vai trò trung tâm lưu trữ toàn bộ hướng dẫn sử dụng từng phân hệ,
 * bổ sung cho hệ thống tour pop-up (driver.js) vốn chỉ hiện 1 lần khi vào
 * trang lần đầu - ở đây nhân viên/CTV có thể tra cứu lại BẤT CỨ LÚC NÀO.
 *
 * @param {Object} props
 * @param {(page: string) => void} props.onNavigate - điều hướng sang trang khác
 * @param {(tourKey: string) => void} props.onReplayTour - phát lại tour pop-up của 1 trang (bất kể đã xem hay chưa)
 */
export function UserGuidePage({ onNavigate, onReplayTour }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState(GUIDE_CATEGORIES[0]?.id || null);
  const [activeArticleId, setActiveArticleId] = useState(null);

  const normalizedSearch = normalize(searchTerm.trim());

  // Kết quả tìm kiếm xuyên suốt mọi category (chỉ áp dụng khi có từ khoá)
  const searchResults = useMemo(() => {
    if (!normalizedSearch) return [];
    const results = [];
    GUIDE_CATEGORIES.forEach((cat) => {
      cat.articles.forEach((article) => {
        const haystack = normalize(
          [article.title, article.summary, article.audience, ...(article.steps || []), ...(article.tips || [])].join(" ")
        );
        if (haystack.includes(normalizedSearch)) {
          results.push({ ...article, categoryId: cat.id, categoryLabel: cat.label });
        }
      });
    });
    return results;
  }, [normalizedSearch]);

  const activeCategory = GUIDE_CATEGORIES.find((c) => c.id === activeCategoryId) || GUIDE_CATEGORIES[0];
  const activeArticle = activeCategory?.articles.find((a) => a.id === activeArticleId) || null;

  const isSearching = normalizedSearch.length > 0;

  const handleSelectArticle = (categoryId, articleId) => {
    setActiveCategoryId(categoryId);
    setActiveArticleId(articleId);
    setSearchTerm("");
  };

  const handleReplay = (article) => {
    if (!article?.related) return;
    onReplayTour?.(article.related);
  };

  return (
    <div className="p-0 pt-2" style={{ maxWidth: "1400px" }} id="user-guide-page-root">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h4 className="fw-bold text-body-emphasis mb-1 d-flex align-items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            Hướng dẫn sử dụng Portal
          </h4>
          <p className="text-body-secondary mb-0" style={{ fontSize: "13.5px", maxWidth: "640px" }}>
            Cẩm nang chi tiết từng mục cho nhân viên nội bộ và Cộng tác viên - tra cứu lại bất cứ lúc nào, không chỉ giới hạn ở lần xem đầu tiên.
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2.5 py-2">
            {GUIDE_CATEGORIES.reduce((sum, c) => sum + c.articles.length, 0)} bài hướng dẫn
          </span>
        </div>
      </div>

      {/* Search bar */}
      <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: "12px" }} id="guide-search-card">
        <div className="card-body p-3">
          <div className="input-group">
            <span className="input-group-text bg-body border-end-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
            </span>
            <input
              type="text"
              className="form-control border-start-0"
              placeholder='Tìm nhanh hướng dẫn, vd: "hoa hồng", "API key", "gửi lead"...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button type="button" className="btn btn-outline-secondary" onClick={() => setSearchTerm("")}>
                Xóa
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="row g-3">
        {/* Sidebar danh mục */}
        <div className="col-12 col-lg-3">
          <div className="card border-0 shadow-sm" style={{ borderRadius: "12px", position: "sticky", top: "16px" }} id="guide-category-nav">
            <div className="list-group list-group-flush rounded-3 overflow-hidden">
              {GUIDE_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className={`list-group-item list-group-item-action d-flex align-items-center gap-2 py-2.5 px-3 border-0 ${
                    !isSearching && activeCategoryId === cat.id ? "bg-primary-subtle text-primary fw-bold" : "text-body-secondary"
                  }`}
                  style={{ fontSize: "13.5px" }}
                  onClick={() => {
                    setActiveCategoryId(cat.id);
                    setActiveArticleId(null);
                    setSearchTerm("");
                  }}
                >
                  <CategoryIcon path={CATEGORY_ICON_PATHS[cat.id]} className="flex-shrink-0" />
                  <span className="flex-grow-1 text-start">{cat.label}</span>
                  <span className="badge bg-body-tertiary text-body-secondary border" style={{ fontSize: "10.5px" }}>
                    {cat.articles.length}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Nội dung chính */}
        <div className="col-12 col-lg-9">
          {isSearching ? (
            /* ===== Kết quả tìm kiếm ===== */
            <div className="card border-0 shadow-sm" style={{ borderRadius: "12px" }}>
              <div className="card-header bg-transparent border-bottom py-3 px-4">
                <h6 className="fw-bold text-body-emphasis mb-0">
                  Kết quả tìm kiếm cho "{searchTerm}" ({searchResults.length})
                </h6>
              </div>
              <div className="card-body p-0">
                {searchResults.length === 0 ? (
                  <div className="text-center py-5 text-body-secondary">
                    Không tìm thấy bài hướng dẫn phù hợp. Hãy thử từ khóa khác hoặc duyệt theo danh mục bên trái.
                  </div>
                ) : (
                  <div className="list-group list-group-flush">
                    {searchResults.map((article) => (
                      <button
                        key={`${article.categoryId}-${article.id}`}
                        type="button"
                        className="list-group-item list-group-item-action p-3 border-0 border-bottom text-start"
                        onClick={() => handleSelectArticle(article.categoryId, article.id)}
                      >
                        <div className="d-flex justify-content-between align-items-start gap-2">
                          <div>
                            <div className="fw-bold text-body-emphasis mb-1" style={{ fontSize: "14px" }}>
                              <HighlightMatch text={article.title} query={searchTerm} />
                            </div>
                            <div className="text-body-secondary" style={{ fontSize: "12.5px" }}>
                              <HighlightMatch text={article.summary} query={searchTerm} />
                            </div>
                          </div>
                          <span className="badge bg-body-tertiary text-body-secondary border text-nowrap" style={{ fontSize: "10.5px" }}>
                            {article.categoryLabel}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : activeArticle ? (
            /* ===== Chi tiết 1 bài hướng dẫn ===== */
            <div className="card border-0 shadow-sm" style={{ borderRadius: "12px" }} id="guide-article-detail">
              <div className="card-header bg-transparent border-bottom py-3 px-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-link text-decoration-none p-0 text-body-secondary d-inline-flex align-items-center gap-1"
                  onClick={() => setActiveArticleId(null)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6" /></svg>
                  Quay lại danh sách {activeCategory.label}
                </button>
                {activeArticle.related && (
                  <button
                    type="button"
                    className="btn btn-sm btn-primary d-inline-flex align-items-center gap-1.5 fw-semibold"
                    onClick={() => handleReplay(activeArticle)}
                    title="Mở trang tương ứng và phát lại tour hướng dẫn pop-up trực tiếp trên giao diện"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" /></svg>
                    Xem hướng dẫn trực tiếp trên trang
                  </button>
                )}
              </div>

              <div className="card-body p-4">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <span className="badge bg-secondary-subtle text-body-secondary border" style={{ fontSize: "11px" }}>
                    Đối tượng: {activeArticle.audience}
                  </span>
                </div>
                <h5 className="fw-bold text-body-emphasis mb-2">{activeArticle.title}</h5>
                <p className="text-body-secondary mb-4" style={{ fontSize: "14px" }}>{activeArticle.summary}</p>

                <h6 className="fw-bold text-body-emphasis mb-3 d-flex align-items-center gap-2">
                  <span className="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary text-white flex-shrink-0" style={{ width: "22px", height: "22px", fontSize: "12px" }}>
                    ✓
                  </span>
                  Các bước thực hiện
                </h6>
                <ol className="d-grid gap-2.5 mb-4" style={{ paddingLeft: "1.5rem" }}>
                  {activeArticle.steps.map((step, idx) => (
                    <li key={idx} className="text-body" style={{ fontSize: "13.5px", lineHeight: 1.7 }}>
                      {step}
                    </li>
                  ))}
                </ol>

                {activeArticle.tips && activeArticle.tips.length > 0 && (
                  <div className="alert alert-warning border-0 mb-0" style={{ backgroundColor: "rgba(255, 193, 7, 0.08)" }}>
                    <h6 className="fw-bold mb-2 d-flex align-items-center gap-2" style={{ fontSize: "13px" }}>
                      💡 Mẹo & Lưu ý
                    </h6>
                    <ul className="mb-0 d-grid gap-1.5" style={{ fontSize: "13px", paddingLeft: "1.1rem" }}>
                      {activeArticle.tips.map((tip, idx) => (
                        <li key={idx}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ===== Danh sách bài viết trong category đang chọn ===== */
            <div className="card border-0 shadow-sm" style={{ borderRadius: "12px" }}>
              <div className="card-header bg-transparent border-bottom py-3 px-4">
                <h6 className="fw-bold text-body-emphasis mb-1">{activeCategory?.label}</h6>
                <span className="text-body-secondary" style={{ fontSize: "12.5px" }}>{activeCategory?.description}</span>
              </div>
              <div className="card-body p-0">
                <div className="list-group list-group-flush">
                  {activeCategory?.articles.map((article) => (
                    <button
                      key={article.id}
                      type="button"
                      className="list-group-item list-group-item-action p-3 border-0 border-bottom text-start d-flex justify-content-between align-items-center gap-3"
                      onClick={() => handleSelectArticle(activeCategory.id, article.id)}
                    >
                      <div>
                        <div className="fw-bold text-body-emphasis mb-1" style={{ fontSize: "14px" }}>{article.title}</div>
                        <div className="text-body-secondary" style={{ fontSize: "12.5px" }}>{article.summary}</div>
                        <span className="badge bg-secondary-subtle text-body-secondary border mt-2" style={{ fontSize: "10.5px" }}>
                          {article.audience}
                        </span>
                      </div>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-body-secondary flex-shrink-0"><path d="m9 18 6-6-6-6" /></svg>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserGuidePage;
