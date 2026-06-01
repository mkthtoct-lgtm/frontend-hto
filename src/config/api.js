const normalizeBaseUrl = (value) => value.replace(/\/+$/, "");

export const API_BASE_URL = normalizeBaseUrl(
  import.meta.env.VITE_API_BASE_URL || "https://api.hto.edu.vn/api/v1",
);
