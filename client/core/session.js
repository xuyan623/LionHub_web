import { API_KEY_STORAGE_KEY, SESSION_KEY } from "./state.js";

export function loadSession() {
  return localStorage.getItem(SESSION_KEY);
}

export function loadApiKey() {
  return sessionStorage.getItem(API_KEY_STORAGE_KEY)
    || localStorage.getItem(API_KEY_STORAGE_KEY)
    || "";
}

export function saveSession(currentUserId, options = {}) {
  const { rememberMe = Boolean(currentUserId), apiKey } = options;

  if (currentUserId && rememberMe) {
    localStorage.setItem(SESSION_KEY, currentUserId);
  } else {
    localStorage.removeItem(SESSION_KEY);
  }

  if (!currentUserId) {
    clearApiKey();
    return;
  }

  if (apiKey !== undefined) {
    storeApiKey(apiKey, rememberMe);
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  clearApiKey();
}

export function clearApiKey() {
  sessionStorage.removeItem(API_KEY_STORAGE_KEY);
  localStorage.removeItem(API_KEY_STORAGE_KEY);
}

export function storeApiKey(apiKey, rememberMe = false) {
  clearApiKey();
  if (!apiKey) {
    return;
  }
  if (rememberMe) {
    localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
    return;
  }
  sessionStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
}
