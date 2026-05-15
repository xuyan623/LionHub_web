const DRAFT_PREFIX = "lion-hub-draft-v1";

export function getDraftKey(modalType, entityId = "") {
  return `${DRAFT_PREFIX}:${modalType}:${entityId || "new"}`;
}

export function saveDraft(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), data }));
  } catch {
    // Ignore quota errors
  }
}

export function loadDraft(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.data || null;
  } catch {
    return null;
  }
}

export function clearDraft(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore
  }
}

export function clearAllDrafts() {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith(DRAFT_PREFIX)) {
        localStorage.removeItem(key);
      }
    }
  } catch {
    // Ignore
  }
}

/**
 * Extract serializable draft data from a form element.
 * Skips password fields and file inputs.
 */
export function serializeFormDraft(form) {
  const data = {};
  const formData = new FormData(form);
  for (const [name, value] of formData.entries()) {
    if (value instanceof File) continue;
    const field = form.elements.namedItem(name);
    if (field && field.type === "password") continue;
    if (field && field.type === "file") continue;
    if (Array.isArray(data[name])) {
      data[name].push(String(value));
    } else if (data[name] !== undefined) {
      data[name] = [data[name], String(value)];
    } else {
      data[name] = String(value);
    }
  }
  return data;
}
