// client/core/drafts.js
var DRAFT_PREFIX = "lion-hub-draft-v1";
function getDraftKey(modalType, entityId = "") {
  return `${DRAFT_PREFIX}:${modalType}:${entityId || "new"}`;
}
function saveDraft(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), data }));
  } catch {
  }
}
function loadDraft(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.data || null;
  } catch {
    return null;
  }
}
function clearDraft(key) {
  try {
    localStorage.removeItem(key);
  } catch {
  }
}
function serializeFormDraft(form) {
  const data = {};
  const formData = new FormData(form);
  for (const [name, value] of formData.entries()) {
    if (value instanceof File) continue;
    const field = form.elements.namedItem(name);
    if (field && field.type === "password") continue;
    if (field && field.type === "file") continue;
    if (Array.isArray(data[name])) {
      data[name].push(String(value));
    } else if (data[name] !== void 0) {
      data[name] = [data[name], String(value)];
    } else {
      data[name] = String(value);
    }
  }
  return data;
}

export {
  getDraftKey,
  saveDraft,
  loadDraft,
  clearDraft,
  serializeFormDraft
};
