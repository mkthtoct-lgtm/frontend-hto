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
  const latestArticles = filteredArticles.slice(0, 4);
  const popularArticles = articles.slice(0, 5);
  const eventArticles = articles.filter((article) => article.type === "event").slice(0, 4);

  const openArticleDetail = (articleId) => {
    setSelectedId(articleId);
    setViewMode("detail");
  };

  return (
    <div className="container-fluid p-0 bg-body text-body" style={{ maxWidth: "1600px" }}>
      <section className="position-relative overflow-hidden mb-4 border-bottom" style={{ minHeight: "320px", background: "linear-gradient(110deg, var(--bs-body-bg) 0%, var(--bs-tertiary-bg) 52%, var(--bs-body-bg) 100%)" }}>
        <div className="position-absolute top-0 end-0 h-100 d-none d-lg-block" style={{ width: "48%", opacity: 0.9 }}>
          <img src="/assets/images/properties/listing/pic1.jpg" alt="" className="h-100 w-100" style={{ objectFit: "cover", clipPath: "ellipse(70% 72% at 74% 44%)" }} />
          <div className="position-absolute top-0 start-0 w-100 h-100" style={{ background: "linear-gradient(90deg, var(--bs-body-bg), color-mix(in srgb, var(--bs-body-bg) 22%, transparent))" }} />
        </div>
        <div className="position-absolute rounded-circle d-none d-md-block" style={{ width: "170px", height: "170px", right: "34%", top: "28px", background: "color-mix(in srgb, var(--bs-primary) 10%, transparent)" }} />
        <div className="position-absolute rounded-circle d-none d-md-block" style={{ width: "86px", height: "86px", right: "43%", top: "150px", background: "color-mix(in srgb, var(--bs-info) 10%, transparent)" }} />

        <div className="px-3 px-xl-4 py-4 py-xl-5 position-relative" style={{ maxWidth: "720px", zIndex: 1 }}>
          <div className="text-primary fw-bold mb-2" style={{ fontSize: "13px" }}>HTO Newsroom</div>
          <h1 className="fw-bold text-body-emphasis mb-3" style={{ fontSize: "clamp(34px, 5vw, 58px)", lineHeight: 1.05, letterSpacing: 0 }}>Tin tức & Sự kiện</h1>
          <p className="text-body-secondary mb-4" style={{ maxWidth: "420px", fontSize: "15px", lineHeight: 1.7 }}>
            Dòng tin mới nhất về du học, visa, đào tạo và hoạt động của HT Ocean Group.
          </p>

          <div className="d-flex flex-column flex-sm-row gap-2 align-items-sm-center">
            <div className="position-relative" style={{ width: "min(100%, 360px)" }}>
              <span className="position-absolute top-50 translate-middle-y text-body-secondary" style={{ left: "15px" }}><SearchIcon /></span>
              <input
                id="news-search-input"
                className="form-control border shadow-sm bg-body text-body"
                placeholder="Tìm kiếm tin tức..."
                style={{ height: "52px", borderRadius: "10px", paddingLeft: "42px" }}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <div id="news-type-filter-group" className="d-flex flex-wrap gap-2">
              {[
                { id: "all", label: "Tất cả" },
                { id: "news", label: "Tin tức" },
                { id: "event", label: "Sự kiện" },
              ].map((item) => (
                <button className={`btn btn-sm ${activeType === item.id ? "btn-primary" : "btn-outline-secondary"}`} key={item.id} type="button" onClick={() => setActiveType(item.id)}>
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {(loading || apiError) && (
            <div className={`alert ${apiError ? "alert-warning" : "alert-info"} py-2 px-3 mt-3 mb-0`} style={{ maxWidth: "520px", fontSize: "13px" }}>
              {apiError || "Đang tải tin tức sự kiện từ API..."}
            </div>
          )}
        </div>
      </section>

      {viewMode === "list" && (
        <div className="row mb-4 gx-3 gx-xl-4 align-items-start px-3 px-xl-4">
          <div className="col-12 col-xl-8 mb-3 mb-xl-0">
            <div id="news-articles-list" className="d-flex flex-column gap-3">
              {filteredArticles.length > 0 ? (
                filteredArticles.map((article) => (
                  <ArticleCard
                    article={article}
                    key={article.id}
                    onOpen={() => openArticleDetail(article.id)}
                  />
                ))
              ) : (
                <section className="card border text-center text-body-secondary py-5 bg-body" style={{ borderRadius: "14px", boxShadow: "0 10px 28px color-mix(in srgb, var(--bs-body-color) 8%, transparent)" }}>
                  Không tìm thấy tin tức hoặc sự kiện phù hợp.
                </section>
              )}
            </div>
          </div>

          <div id="news-sidebar" className="col-12 col-xl-4">
            <NewsSidebar
              events={eventArticles}
              latestArticles={latestArticles}
              popularArticles={popularArticles}
              onOpen={openArticleDetail}
            />
          </div>
        </div>
      )}

      {viewMode === "detail" && selectedArticle && (
        <div className="px-3 px-xl-4 pb-4">
          <div className="d-flex flex-wrap align-items-center gap-2 text-body-secondary mb-3" style={{ fontSize: "12px" }}>
            <button className="border-0 bg-transparent p-0 text-body-secondary" type="button" onClick={() => setViewMode("list")}>Trang chủ</button>
            <span>›</span>
            <button className="border-0 bg-transparent p-0 text-body-secondary" type="button" onClick={() => setViewMode("list")}>Tin tức & Sự kiện</button>
            <span>›</span>
            <span className="text-body-emphasis text-truncate" style={{ maxWidth: "360px" }}>{selectedArticle.title}</span>
          </div>

          <div className="row gx-3 gx-xl-4 align-items-start">
            <div className="col-12 col-xl-8 mb-3 mb-xl-0">
              <article className="bg-body">
                <section className="card border bg-body overflow-hidden mb-4" style={{ borderRadius: "16px", boxShadow: "0 14px 34px color-mix(in srgb, var(--bs-body-color) 9%, transparent)" }}>
                  <div className="position-relative">
                    <img src={getArticleImage(selectedArticle)} alt={selectedArticle.title} className="w-100 bg-body-tertiary" style={{ height: "clamp(280px, 40vw, 420px)", objectFit: "cover" }} onError={handleImageFallback} />
                    <div className="position-absolute top-0 start-0 m-3 d-flex flex-wrap gap-2">
                      <span className="badge bg-body text-primary border shadow-sm px-3 py-2">{selectedArticle.type === "event" ? "Sự kiện" : "Tin tức"}</span>
                      <span className="badge bg-body text-primary border shadow-sm px-3 py-2">{selectedArticle.category}</span>
                    </div>
                    <div className="position-absolute top-0 end-0 m-3">
                      <span className="badge bg-success shadow-sm px-3 py-2">{selectedArticle.status}</span>
                    </div>
                  </div>

                  <div className="card-body p-3 p-md-4 p-xl-5">
                    <h2 className="fw-bold text-body-emphasis mb-3" style={{ fontSize: "clamp(26px, 4vw, 42px)", lineHeight: 1.16 }}>{selectedArticle.title}</h2>

                    <div className="d-flex flex-wrap gap-4 text-body-secondary mb-4" style={{ fontSize: "13px" }}>
                      <span className="d-inline-flex align-items-center gap-2"><CalendarMiniIcon />{formatDate(selectedArticle.date)}</span>
                      <span className="d-inline-flex align-items-center gap-2"><PinMiniIcon />{selectedArticle.location}</span>
                      <span className="d-inline-flex align-items-center gap-2"><UserMiniIcon />{selectedArticle.author}</span>
                    </div>

                    <div className="d-flex gap-3 align-items-center rounded border px-3 px-md-4 py-3 mb-4" style={{ background: "var(--bs-tertiary-bg)", boxShadow: "0 10px 24px color-mix(in srgb, var(--bs-primary) 10%, transparent)" }}>
                      <span className="d-inline-flex align-items-center justify-content-center rounded-circle flex-shrink-0 text-primary bg-primary-subtle" style={{ width: "58px", height: "58px" }}>
                        <ClipboardCheckIcon />
                      </span>
                      <p className="fw-semibold text-body-secondary mb-0" style={{ fontSize: "15px", lineHeight: 1.7 }}>{selectedArticle.summary}</p>
                    </div>

                    <p className="text-body-secondary mb-4" style={{ fontSize: "15px", lineHeight: 1.85 }}>{selectedArticle.content}</p>

                    <section className="mb-4">
                      <h6 className="fw-bold text-body-emphasis mb-3">Nội dung chương trình</h6>
                      <div className="row g-3">
                        <ProgramFeatureCard icon={<EditNoteIcon />} title="Kiểm tra năng lực" description="tiếng Đức đầu vào" />
                        <ProgramFeatureCard icon={<ChatBubbleIcon />} title="Trao đổi 1:1" description="với giáo viên chuyên môn" />
                        <ProgramFeatureCard icon={<BookOpenIcon />} title="Tư vấn lộ trình học" description="phù hợp mục tiêu hồ sơ" />
                        <ProgramFeatureCard icon={<TargetIcon />} title="Định hướng thời gian" description="và kế hoạch nộp hồ sơ" />
                      </div>
                    </section>

                    <section className="rounded border overflow-hidden mb-4" style={{ background: "linear-gradient(135deg, color-mix(in srgb, var(--bs-primary) 8%, var(--bs-body-bg)), var(--bs-body-bg))" }}>
                      <div className="row g-0 align-items-stretch">
                        <div className="col-12 col-lg-8">
                          <div className="p-3 p-md-4">
                            <h6 className="fw-bold text-body-emphasis mb-3">Thông tin {selectedArticle.type === "event" ? "sự kiện" : "bài viết"}</h6>
                            <div className="d-grid gap-3">
                              <DetailInfoRow icon={<CalendarMiniIcon />} label="Thời gian" value={formatDate(selectedArticle.date)} />
                              <DetailInfoRow icon={<PinMiniIcon />} label="Địa điểm" value={selectedArticle.location} />
                              <DetailInfoRow icon={<UserMiniIcon />} label="Đơn vị tổ chức" value={selectedArticle.author} />
                              <DetailInfoRow icon={<UsersMiniIcon />} label="Đối tượng tham gia" value={selectedArticle.category} />
                              <DetailInfoRow icon={<ClipboardCheckIcon />} label="Đăng ký tham gia" value={selectedArticle.status} />
                            </div>
                          </div>
                        </div>
                        <div className="col-12 col-lg-4 d-flex align-items-center justify-content-center p-4">
                          <img src={getArticleImage(selectedArticle)} alt="" className="rounded-circle border border-4 shadow-sm" style={{ width: "190px", height: "190px", objectFit: "cover", borderColor: "var(--bs-body-bg)" }} onError={handleImageFallback} />
                        </div>
                      </div>
                    </section>

                    <section className="rounded border bg-body p-3 p-md-4 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
                      <div>
                        <h6 className="fw-bold text-body-emphasis mb-1">Sẵn sàng đánh giá năng lực và nhận lộ trình phù hợp với mục tiêu của bạn?</h6>
                        <div className="text-body-secondary" style={{ fontSize: "13px" }}>Đăng ký ngay để giữ suất và được tư vấn chi tiết.</div>
                      </div>
                      <button className="btn btn-primary d-inline-flex align-items-center gap-2 px-4" type="button">
                        Đăng ký tham gia
                        <ArrowRightIcon />
                      </button>
                    </section>
                  </div>
                </section>
              </article>
            </div>

            <div className="col-12 col-xl-4">
              <NewsSidebar
                events={eventArticles}
                latestArticles={latestArticles.filter((article) => article.id !== selectedArticle.id)}
                popularArticles={popularArticles.filter((article) => article.id !== selectedArticle.id)}
                onOpen={openArticleDetail}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

function NewsSidebar({ events, latestArticles, onOpen, popularArticles }) {
  return (
    <div className="d-flex flex-column gap-3">
      <section className="card border bg-body" style={{ borderRadius: "14px", boxShadow: "0 10px 28px color-mix(in srgb, var(--bs-body-color) 7%, transparent)" }}>
        <div className="card-header bg-transparent border-0 p-3 pb-0">
          <h6 className="fw-bold text-body-emphasis mb-1" style={{ fontSize: "18px" }}>Mới nhất</h6>
          <div className="text-body-secondary" style={{ fontSize: "12px" }}>Cập nhật theo thời gian đăng</div>
        </div>
        <div className="card-body p-3 d-flex flex-column gap-3">
          {latestArticles.map((article) => (
            <button className="d-flex gap-3 border-0 bg-transparent p-0 text-start" key={article.id} type="button" onClick={() => onOpen(article.id)}>
              <img src={getArticleImage(article)} alt={article.title} className="rounded bg-body-tertiary flex-shrink-0" style={{ width: "86px", height: "64px", objectFit: "cover" }} onError={handleImageFallback} />
              <span style={{ minWidth: 0 }}>
                <span className={`badge ${article.type === "event" ? "bg-primary-subtle text-primary" : "bg-success-subtle text-success"} mb-1`} style={{ fontSize: "10px" }}>{article.status || (article.type === "event" ? "Sự kiện" : "Tin tức")}</span>
                <span className="fw-bold text-body-emphasis d-block" style={{ fontSize: "13px", lineHeight: 1.35 }}>{article.title}</span>
                <span className="text-body-secondary" style={{ fontSize: "11px" }}>{formatDate(article.date)} · {article.category}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="card border bg-body" style={{ borderRadius: "14px", boxShadow: "0 10px 28px color-mix(in srgb, var(--bs-body-color) 7%, transparent)" }}>
        <div className="card-header bg-transparent border-0 p-3 pb-0 d-flex align-items-center gap-2">
          <span className="text-warning"><FireIcon /></span>
          <h6 className="fw-bold text-body-emphasis mb-0" style={{ fontSize: "18px" }}>Đọc nhiều</h6>
        </div>
        <div className="card-body p-3 d-flex flex-column gap-3">
          {popularArticles.slice(0, 3).map((article, index) => (
            <button className="d-flex gap-3 border-0 bg-transparent p-0 text-start align-items-center" key={article.id} type="button" onClick={() => onOpen(article.id)}>
              <span className={`fw-bold rounded text-center flex-shrink-0 ${index === 0 ? "bg-primary-subtle text-primary" : index === 1 ? "bg-info-subtle text-info" : "bg-warning-subtle text-warning"}`} style={{ fontSize: "18px", width: "36px", lineHeight: "36px" }}>{index + 1}</span>
              <img src={getArticleImage(article)} alt={article.title} className="rounded bg-body-tertiary flex-shrink-0" style={{ width: "58px", height: "48px", objectFit: "cover" }} onError={handleImageFallback} />
              <span style={{ minWidth: 0 }}>
                <span className="fw-bold text-body-emphasis d-block" style={{ fontSize: "13px", lineHeight: 1.35 }}>{article.title}</span>
                <span className="text-body-secondary" style={{ fontSize: "11px" }}>{formatDate(article.date)} · {article.category}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="card border bg-body" style={{ borderRadius: "14px", boxShadow: "0 10px 28px color-mix(in srgb, var(--bs-body-color) 7%, transparent)" }}>
        <div className="card-header bg-transparent border-0 p-3 pb-0 d-flex align-items-center gap-2">
          <span className="text-primary"><CalendarMiniIcon /></span>
          <h6 className="fw-bold text-body-emphasis mb-0" style={{ fontSize: "18px" }}>Lịch sự kiện</h6>
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
    <article className="card border overflow-hidden bg-body" style={{ borderRadius: "14px", boxShadow: "0 12px 32px color-mix(in srgb, var(--bs-body-color) 8%, transparent)" }}>
      <button className="border-0 bg-transparent p-0 text-start w-100" type="button" onClick={onOpen}>
        <div className="position-relative">
          <img src={getArticleImage(article)} alt={article.title} className="w-100 bg-body-tertiary" style={{ height: "280px", objectFit: "cover" }} onError={handleImageFallback} />
          <div className="position-absolute top-0 start-0 m-3 d-flex gap-2">
            <span className="badge bg-primary">{article.type === "event" ? "Sự kiện" : "Tin tức"}</span>
            <span className="badge bg-body text-primary border">{article.category}</span>
            {article.featured && <span className="badge bg-warning text-dark">Nổi bật</span>}
          </div>
        </div>
      </button>
      <div className="card-body p-3 p-xl-4 d-flex flex-column">
        <button className="border-0 bg-transparent p-0 text-start" type="button" onClick={onOpen}>
          <h5 className="fw-bold text-body-emphasis mb-2" style={{ fontSize: "22px", lineHeight: 1.25 }}>{article.title}</h5>
        </button>
        <p className="text-body-secondary mb-4 flex-grow-1" style={{ fontSize: "14px", lineHeight: 1.65 }}>{article.summary}</p>
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div className="d-flex flex-wrap gap-3 text-body-secondary" style={{ fontSize: "12px" }}>
            <span className="d-inline-flex align-items-center gap-1"><CalendarMiniIcon />{formatDate(article.date)}</span>
            <span className="d-inline-flex align-items-center gap-1"><PinMiniIcon />{article.location}</span>
            <span className="d-inline-flex align-items-center gap-1"><UserMiniIcon />{article.author}</span>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-primary border-0 rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: "44px", height: "44px", background: "color-mix(in srgb, var(--bs-primary) 10%, transparent)" }} type="button" onClick={onOpen} aria-label="Xem chi tiết">
              <ArrowRightIcon />
            </button>
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

function ProgramFeatureCard({ description, icon, title }) {
  return (
    <div className="col-6 col-lg-3">
      <div className="h-100 text-center">
        <div className="d-inline-flex align-items-center justify-content-center rounded border bg-body text-primary mb-2" style={{ width: "58px", height: "58px", boxShadow: "0 8px 20px color-mix(in srgb, var(--bs-primary) 12%, transparent)" }}>
          {icon}
        </div>
        <div className="fw-bold text-body-emphasis mb-1" style={{ fontSize: "12px", lineHeight: 1.35 }}>{title}</div>
        <div className="text-body-secondary mx-auto" style={{ maxWidth: "150px", fontSize: "11px", lineHeight: 1.45 }}>{description}</div>
      </div>
    </div>
  );
}

function DetailInfoRow({ icon, label, value }) {
  return (
    <div className="row g-2 align-items-start">
      <div className="col-5 col-md-4 d-flex align-items-center gap-2 text-body-secondary" style={{ fontSize: "12px" }}>
        <span className="text-primary">{icon}</span>
        <span>{label}</span>
      </div>
      <div className="col-7 col-md-8 fw-medium text-body-secondary" style={{ fontSize: "13px", lineHeight: 1.5 }}>
        {value || "-"}
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <path d="m21 21-4.3-4.3"></path>
    </svg>
  );
}

function CalendarMiniIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"></rect>
      <path d="M16 2v4"></path>
      <path d="M8 2v4"></path>
      <path d="M3 10h18"></path>
    </svg>
  );
}

function PinMiniIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"></path>
      <circle cx="12" cy="10" r="3"></circle>
    </svg>
  );
}

function UserMiniIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21a8 8 0 0 0-16 0"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  );
}

function UsersMiniIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14"></path>
      <path d="m12 5 7 7-7 7"></path>
    </svg>
  );
}

function FireIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A3.5 3.5 0 0 0 12 18a3.5 3.5 0 0 0 3.5-3.5c0-1.4-.8-2.4-1.8-3.5-.8-.9-1.7-1.8-1.7-3.5-2.3 1.5-4 3.9-4 7Z"></path>
      <path d="M12 22a8 8 0 0 0 8-8c0-3.6-2.2-6.4-5.3-9.1-.7 2.2-2 3.3-3.4 4.5C9.8 10.7 8 12.2 8 15"></path>
    </svg>
  );
}

function ClipboardCheckIcon() {
  return (
    <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="2" width="8" height="4" rx="1"></rect>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
      <path d="m9 14 2 2 4-5"></path>
    </svg>
  );
}

function EditNoteIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9"></path>
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
    </svg>
  );
}

function ChatBubbleIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z"></path>
      <path d="M8 10h.01"></path>
      <path d="M12 10h.01"></path>
      <path d="M16 10h.01"></path>
    </svg>
  );
}

function BookOpenIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 7v14"></path>
      <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3Z"></path>
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <circle cx="12" cy="12" r="6"></circle>
      <circle cx="12" cy="12" r="2"></circle>
    </svg>
  );
}
