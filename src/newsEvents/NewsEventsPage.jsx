import { useCallback, useEffect, useMemo, useState } from "react";
import { DEFAULT_NEWS_IMAGE, fetchNewsPosts } from "./newsEventsApi";

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "-";
  return date.toLocaleDateString("vi-VN");
};

const getArticleImage = (article) => article?.image || DEFAULT_NEWS_IMAGE;

const handleImageFallback = (event) => {
  if (event.currentTarget.src.endsWith(DEFAULT_NEWS_IMAGE)) return;
  event.currentTarget.src = DEFAULT_NEWS_IMAGE;
};

export const NewsEventsPage = () => {
  const [articles, setArticles] = useState([]);
  const [activeType, setActiveType] = useState("all");
  const [selectedId, setSelectedId] = useState(null);
  const [viewMode, setViewMode] = useState("list");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  const loadArticles = useCallback(async () => {
    setLoading(true);
    setApiError("");

    try {
      setArticles(await fetchNewsPosts());
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Không thể tải tin tức sự kiện.");
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
      .filter((article) => activeType === "all" || article.type === activeType)
      .filter((article) => {
        if (!normalizedQuery) return true;

        return [article.title, article.category, article.summary, article.location]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [activeType, articles, query]);
  const selectedArticle =
    articles.find((article) => article.id === selectedId) || filteredArticles[0] || articles[0];
  const featuredArticle = articles.find((article) => article.featured) || articles[0];
  const secondaryArticles = filteredArticles.filter((article) => article.id !== featuredArticle?.id).slice(0, 2);
  const latestArticles = filteredArticles.filter((article) => article.id !== featuredArticle?.id);
  const popularArticles = articles.slice(0, 5);
  const eventArticles = articles.filter((article) => article.type === "event").slice(0, 4);

  const openArticleDetail = (articleId) => {
    setSelectedId(articleId);
    setViewMode("detail");
  };

  return (
    <div className="container-fluid pt-3 pb-1" style={{ maxWidth: "1600px" }}>
      <section className="card border-0 mb-3" style={{ borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <div className="card-body p-3">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
            <div>
              <div className="text-primary fw-bold text-uppercase" style={{ fontSize: "12px", letterSpacing: "0.08em" }}>HTO Newsroom</div>
              <h3 className="fw-bold text-body-emphasis mb-1">Tin tức & Sự kiện</h3>
              <div className="text-body-secondary" style={{ fontSize: "13px" }}>Dòng tin mới nhất về du học, visa, đào tạo và hoạt động của HT Ocean Group.</div>
            </div>
            <div className="d-flex flex-wrap align-items-center gap-2">
              <input
                className="form-control form-control-sm"
                placeholder="Tìm kiếm tin tức..."
                style={{ width: "220px" }}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
          </div>
          <div className="d-flex flex-wrap gap-2 border-top pt-3">
            {[
              { id: "all", label: "Tất cả" },
              { id: "news", label: "Tin tức" },
              { id: "event", label: "Sự kiện" },
            ].map((item) => (
              <button className={`btn btn-sm ${activeType === item.id ? "btn-primary" : "btn-outline-primary"}`} key={item.id} type="button" onClick={() => setActiveType(item.id)}>
                {item.label}
              </button>
            ))}
            <span className="badge bg-body-secondary text-body align-self-center ms-auto">{filteredArticles.length} bài viết</span>
          </div>
          {(loading || apiError) && (
            <div className={`alert ${apiError ? "alert-warning" : "alert-info"} py-2 px-3 mt-3 mb-0`} style={{ fontSize: "13px" }}>
              {apiError || "Đang tải tin tức sự kiện từ API..."}
            </div>
          )}
        </div>
      </section>

      {viewMode === "list" && (
        <>
          <div className="row mb-3 gx-2 gx-xl-3 align-items-stretch">
            <div className="col-12 col-xl-7 mb-3 mb-xl-0">
              <LeadStory article={featuredArticle} onOpen={() => featuredArticle && openArticleDetail(featuredArticle.id)} />
            </div>
            <div className="col-12 col-xl-5">
              <div className="row h-100 gx-2 gx-xl-3">
                {secondaryArticles.map((article) => (
                  <div className="col-12 mb-3" key={article.id}>
                    <SideStory article={article} onOpen={() => openArticleDetail(article.id)} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="row mb-3 gx-2 gx-xl-3 align-items-start">
            <div className="col-12 col-xl-8 mb-3 mb-xl-0">
              <section className="card border-0" style={{ borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                <div className="card-header bg-transparent border-0 p-3 pb-0 d-flex align-items-center justify-content-between">
                  <h5 className="fw-bold text-body-emphasis mb-0">Mới nhất</h5>
                  <span className="text-body-secondary" style={{ fontSize: "12px" }}>Cập nhật theo thời gian đăng</span>
                </div>
                <div className="card-body p-3">
                  {latestArticles.length > 0 ? (
                    <div className="row g-3">
                      {latestArticles.map((article) => (
                        <div className="col-12 col-md-6" key={article.id}>
                          <ArticleCard
                            article={article}
                            onOpen={() => openArticleDetail(article.id)}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-body-secondary py-5">Không tìm thấy tin tức hoặc sự kiện phù hợp.</div>
                  )}
                </div>
              </section>
            </div>

            <div className="col-12 col-xl-4">
              <NewsSidebar
                events={eventArticles}
                popularArticles={popularArticles}
                onOpen={openArticleDetail}
              />
            </div>
          </div>
        </>
      )}

      {viewMode === "detail" && selectedArticle && (
        <div className="row mb-3 gx-2 gx-xl-3 align-items-stretch">
          <div className="col-12 col-xl-8 mb-3 mb-xl-0">
            <article className="card border-0 h-100 overflow-hidden" style={{ borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <img src={getArticleImage(selectedArticle)} alt={selectedArticle.title} className="w-100 bg-body-tertiary" style={{ height: "320px", objectFit: "cover" }} onError={handleImageFallback} />
              <div className="card-body p-3 p-xl-4">
                <button className="btn btn-sm btn-outline-secondary mb-3" type="button" onClick={() => setViewMode("list")}>
                  Quay lại chuyên trang
                </button>
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                  <div className="d-flex flex-wrap gap-2">
                    <span className="badge bg-primary">{selectedArticle.type === "event" ? "Sự kiện" : "Tin tức"}</span>
                    <span className="badge bg-body-secondary text-body">{selectedArticle.category}</span>
                    <span className="badge bg-success-subtle text-success">{selectedArticle.status}</span>
                  </div>
                </div>
                <h2 className="fw-bold text-body-emphasis mb-2">{selectedArticle.title}</h2>
                <div className="d-flex flex-wrap gap-3 text-body-secondary mb-3" style={{ fontSize: "12px" }}>
                  <span>{formatDate(selectedArticle.date)}</span>
                  <span>{selectedArticle.location}</span>
                  <span>{selectedArticle.author}</span>
                </div>
                <p className="fw-semibold text-body-emphasis" style={{ fontSize: "16px", lineHeight: 1.6 }}>{selectedArticle.summary}</p>
                <p className="text-body-secondary mb-0" style={{ fontSize: "15px", lineHeight: 1.75 }}>{selectedArticle.content}</p>
              </div>
            </article>
          </div>

          <div className="col-12 col-xl-4">
            <NewsSidebar
              events={eventArticles}
              popularArticles={popularArticles.filter((article) => article.id !== selectedArticle.id)}
              onOpen={openArticleDetail}
            />
          </div>
        </div>
      )}

    </div>
  );
};

function LeadStory({ article, onOpen }) {
  if (!article) return null;

  return (
    <article className="card border-0 h-100 overflow-hidden" style={{ borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", minHeight: "430px" }}>
      <button className="position-relative border-0 bg-transparent p-0 text-start h-100" type="button" onClick={onOpen}>
        <img src={getArticleImage(article)} alt={article.title} className="w-100 h-100" style={{ objectFit: "cover", minHeight: "430px" }} onError={handleImageFallback} />
        <div className="position-absolute top-0 start-0 w-100 h-100" style={{ background: "linear-gradient(180deg, rgba(3,7,18,0.05), rgba(3,7,18,0.82))" }} />
        <div className="position-absolute bottom-0 start-0 p-3 p-xl-4 text-white">
          <div className="d-flex flex-wrap gap-2 mb-3">
            <span className="badge bg-primary">{article.type === "event" ? "Sự kiện" : "Tin tức"}</span>
            <span className="badge bg-light text-primary">{article.category}</span>
          </div>
          <h2 className="fw-bold mb-2" style={{ lineHeight: 1.15 }}>{article.title}</h2>
          <p className="mb-3" style={{ fontSize: "14px", lineHeight: 1.5, maxWidth: "760px" }}>{article.summary}</p>
          <div className="d-flex flex-wrap gap-3" style={{ fontSize: "12px" }}>
            <span>{formatDate(article.date)}</span>
            <span>{article.location}</span>
            <span>{article.author}</span>
          </div>
        </div>
      </button>
    </article>
  );
}

function SideStory({ article, onOpen }) {
  return (
    <article className="card border-0 overflow-hidden h-100" style={{ borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
      <button className="row g-0 border-0 bg-transparent text-start h-100" type="button" onClick={onOpen}>
        <div className="col-5">
          <img src={getArticleImage(article)} alt={article.title} className="w-100 h-100" style={{ minHeight: "200px", objectFit: "cover" }} onError={handleImageFallback} />
        </div>
        <div className="col-7">
          <div className="p-3 h-100 d-flex flex-column">
            <div className="d-flex flex-wrap gap-2 mb-2">
              <span className="badge bg-body-secondary text-body">{article.type === "event" ? "Sự kiện" : "Tin tức"}</span>
              <span className="badge bg-primary-subtle text-primary">{article.category}</span>
            </div>
            <h6 className="fw-bold text-body-emphasis mb-2" style={{ fontSize: "15px", lineHeight: 1.35 }}>{article.title}</h6>
            <p className="text-body-secondary mb-3 flex-grow-1" style={{ fontSize: "12px", lineHeight: 1.45 }}>{article.summary}</p>
            <span className="text-body-secondary" style={{ fontSize: "11px" }}>{formatDate(article.date)} · {article.author}</span>
          </div>
        </div>
      </button>
    </article>
  );
}

function NewsSidebar({ events, onOpen, popularArticles }) {
  return (
    <div className="d-flex flex-column gap-3">
      <section className="card border-0" style={{ borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <div className="card-header bg-transparent border-0 p-3 pb-0">
          <h6 className="fw-bold text-body-emphasis mb-0" style={{ fontSize: "14px" }}>Đọc nhiều</h6>
        </div>
        <div className="card-body p-3 d-flex flex-column gap-3">
          {popularArticles.map((article, index) => (
            <button className="d-flex gap-3 border-0 bg-transparent p-0 text-start" key={article.id} type="button" onClick={() => onOpen(article.id)}>
              <span className="fw-bold text-primary flex-shrink-0" style={{ fontSize: "22px", width: "28px" }}>{index + 1}</span>
              <span>
                <span className="fw-semibold text-body-emphasis d-block" style={{ fontSize: "13px", lineHeight: 1.35 }}>{article.title}</span>
                <span className="text-body-secondary" style={{ fontSize: "11px" }}>{formatDate(article.date)} · {article.category}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="card border-0" style={{ borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <div className="card-header bg-transparent border-0 p-3 pb-0">
          <h6 className="fw-bold text-body-emphasis mb-0" style={{ fontSize: "14px" }}>Lịch sự kiện</h6>
        </div>
        <div className="card-body p-3 d-flex flex-column gap-2">
          {events.map((event, index) => (
            <TimelineItem event={event} isLast={index === events.length - 1} key={event.id} />
          ))}
        </div>
      </section>
    </div>
  );
}

function ArticleCard({ article, onOpen }) {
  return (
    <article className="card border-0 h-100 overflow-hidden" style={{ borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
      <button className="border-0 bg-transparent p-0 text-start" type="button" onClick={onOpen}>
        <div className="position-relative">
          <img src={getArticleImage(article)} alt={article.title} className="w-100 bg-body-tertiary" style={{ height: "180px", objectFit: "cover" }} onError={handleImageFallback} />
          <div className="position-absolute top-0 start-0 m-2 d-flex gap-2">
            <span className="badge bg-primary">{article.type === "event" ? "Sự kiện" : "Tin tức"}</span>
            {article.featured && <span className="badge bg-warning text-dark">Nổi bật</span>}
          </div>
        </div>
      </button>
      <div className="card-body p-3 d-flex flex-column">
        <div className="d-flex flex-wrap gap-2 mb-2">
          <span className="badge bg-body-secondary text-body">{article.category}</span>
          <span className="badge bg-success-subtle text-success">{article.status}</span>
        </div>
        <button className="border-0 bg-transparent p-0 text-start" type="button" onClick={onOpen}>
          <h6 className="fw-bold text-body-emphasis mb-2" style={{ fontSize: "15px", lineHeight: 1.35 }}>{article.title}</h6>
        </button>
        <p className="text-body-secondary mb-3 flex-grow-1" style={{ fontSize: "13px", lineHeight: 1.45 }}>{article.summary}</p>
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 border-top pt-3">
          <div className="text-body-secondary" style={{ fontSize: "12px" }}>
            {formatDate(article.date)} · {article.location}
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-sm btn-primary" type="button" onClick={onOpen}>Chi tiết</button>
          </div>
        </div>
      </div>
    </article>
  );
}

function TimelineItem({ event, isLast }) {
  return (
    <div className="d-flex gap-3 position-relative">
      {!isLast && <div className="position-absolute" style={{ left: "34px", top: "48px", bottom: "-10px", width: "2px", backgroundColor: "var(--bs-border-color)" }} />}
      <div className="rounded bg-primary text-white text-center flex-shrink-0 position-relative" style={{ width: "68px", padding: "7px 4px", zIndex: 1 }}>
        <div className="fw-bold" style={{ fontSize: "12px" }}>{formatDate(event.date).slice(0, 5)}</div>
        <div style={{ fontSize: "10px", opacity: 0.88 }}>{event.status}</div>
      </div>
      <div className="rounded border bg-body-tertiary p-2 flex-grow-1" style={{ minWidth: 0 }}>
        <div className="fw-bold text-body-emphasis" style={{ fontSize: "13px", lineHeight: 1.3 }}>{event.title}</div>
        <div className="text-body-secondary mt-1" style={{ fontSize: "12px" }}>{event.location}</div>
      </div>
    </div>
  );
}
