import { authFetch, getAuthHeaders } from "../auth/session";
import { API_BASE_URL } from "../config/api";

export const ADMIN_ROLE_ID = "69fc5af582ef85451120772a";
export const DIRECTOR_ROLE_ID = "69fc5af582ef85451120772b";
export const DEPARTMENT_HEAD_ROLE_ID = "69fc5af582ef85451120772c";
export const DEFAULT_NEWS_IMAGE = "/assets/images/banner-second.jpg";

const ROLE_ID_MAP = {
  [ADMIN_ROLE_ID]: "admin",
  [DIRECTOR_ROLE_ID]: "bangiamdoc",
  [DEPARTMENT_HEAD_ROLE_ID]: "truongbophan",
  "69fc5af582ef85451120772d": "nhansu",
  "69fc5af582ef85451120772e": "daily",
  "69fc5af682ef85451120772f": "user",
  "69fc5af782ef854511207730": "congtacvien",
};

export const normalizeRoleKey = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

export const canManageNewsEvents = (user) => {
  const roleKey = normalizeRoleKey(user?.role?.name || user?.roleName || user?.role || ROLE_ID_MAP[user?.roleId]);

  return (
    roleKey === "admin" ||
    roleKey === "bangiamdoc" ||
    roleKey === "truongbophan" ||
    user?.roleId === ADMIN_ROLE_ID ||
    user?.roleId === DIRECTOR_ROLE_ID ||
    user?.roleId === DEPARTMENT_HEAD_ROLE_ID
  );
};

export const normalizeImagePath = (image) => {
  const value = String(image || "").trim();

  if (!value) return DEFAULT_NEWS_IMAGE;
  if (value.startsWith("./assets/")) return value.replace("./assets/", "/assets/");
  return value;
};

const getApiErrorMessage = (payload, fallback) =>
  payload?.message || payload?.error || payload?.errors?.[0]?.message || fallback;

export const normalizeApiData = (payload) =>
  payload?.data?.items || payload?.data?.docs || payload?.data?.results || payload?.data || payload;

const normalizeArticlesPayload = (payload) => {
  const data = normalizeApiData(payload);

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.docs)) return data.docs;
  if (Array.isArray(data?.results)) return data.results;

  return [];
};

const getDateValue = (article) =>
  article?.date || article?.publishedAt || article?.eventDate || article?.createdAt || new Date().toISOString();

export const normalizeArticleFromApi = (article) => ({
  id: article?.id || article?._id || `news-event-${Date.now()}`,
  title: article?.title || article?.name || "",
  type: article?.type || article?.postType || (article?.isEvent ? "event" : "news"),
  category: article?.category?.name || article?.categoryName || article?.category || "Tin tức",
  date: String(getDateValue(article)).slice(0, 10),
  location: article?.location || article?.venue || "HT Ocean Group",
  status: article?.status || (article?.isPublished === false ? "Bản nháp" : "Đã đăng"),
  summary: article?.summary || article?.description || article?.excerpt || "",
  content: article?.content || article?.body || article?.detail || article?.summary || "",
  image: normalizeImagePath(article?.image || article?.thumbnail || article?.coverImage || article?.imageUrl),
  author: article?.author?.name || article?.authorName || article?.author || "HT Ocean Group",
  department: article?.department?.name || article?.departmentName || article?.createdBy?.department?.name || "",
  createdBy: article?.createdBy?.name || article?.createdByName || article?.author?.name || article?.authorName || "",
  createdAt: article?.createdAt || "",
  updatedAt: article?.updatedAt || "",
  featured: Boolean(article?.featured || article?.isFeatured),
});

export const articlePayloadFromForm = (form) => ({
  title: form.title.trim(),
  type: form.type,
  category: form.category.trim(),
  date: form.date,
  location: form.location.trim(),
  status: form.status.trim(),
  summary: form.summary.trim(),
  content: form.content.trim(),
  image: normalizeImagePath(form.image),
  author: form.author.trim(),
  featured: Boolean(form.featured),
});

async function newsEventsRequest(path = "", options = {}) {
  const response = await authFetch(`${API_BASE_URL}/news-posts${path}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...options.headers,
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(getApiErrorMessage(payload, "Không thể xử lý dữ liệu tin tức sự kiện."));
  }

  return payload;
}

export const fetchNewsPosts = async () =>
  normalizeArticlesPayload(await newsEventsRequest()).map(normalizeArticleFromApi).filter((article) => article.id);

export const createNewsPost = async (payload) =>
  normalizeArticleFromApi(normalizeApiData(await newsEventsRequest("", { method: "POST", body: payload })));

export const updateNewsPost = async (id, payload) =>
  normalizeArticleFromApi(normalizeApiData(await newsEventsRequest(`/${id}`, { method: "PATCH", body: payload })));

export const deleteNewsPost = async (id) => await newsEventsRequest(`/${id}`, { method: "DELETE" });
