const AUTH_USER_STORAGE_KEY = "auth_user";
const CURRENT_PAGE_STORAGE_KEY = "current_page";
const AUTH_EXPIRED_EVENT = "auth:expired";

let isExpiringSession = false;

export const getAuthHeaders = () => {
  const token = window.localStorage.getItem("token");

  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const clearStoredSession = () => {
  window.localStorage.removeItem("token");
  window.localStorage.removeItem("refresh_token");
  window.localStorage.removeItem(AUTH_USER_STORAGE_KEY);
  window.localStorage.removeItem(CURRENT_PAGE_STORAGE_KEY);
  document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
};

export const expireStoredSession = () => {
  if (isExpiringSession) {
    return;
  }

  isExpiringSession = true;
  clearStoredSession();
  window.history.replaceState({}, "", "/");
  window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));

  window.setTimeout(() => {
    isExpiringSession = false;
  }, 0);
};

export const authFetch = async (input, init) => {
  const response = await fetch(input, init);

  if (response.status === 401) {
    expireStoredSession();
  }

  return response;
};

export const AUTH_EVENTS = {
  expired: AUTH_EXPIRED_EVENT,
};
