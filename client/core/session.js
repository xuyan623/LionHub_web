import { SESSION_KEY } from "./state.js";

export function loadSession() {
  return localStorage.getItem(SESSION_KEY);
}

export function saveSession(currentUserId) {
  if (currentUserId) {
    localStorage.setItem(SESSION_KEY, currentUserId);
    return;
  }
  localStorage.removeItem(SESSION_KEY);
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}
