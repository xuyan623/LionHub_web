import {
  API_KEY_STORAGE_KEY,
  DATABASE_API_URL,
  MAX_UPLOAD_COUNT,
  SESSION_KEY,
  UPLOAD_MAX_SIZE_BYTES
} from "./chunk-5IOWRUG7.js";

// client/core/error-handler.js
var USER_MESSAGES = {
  network: "\u65E0\u6CD5\u8FDE\u63A5\u6218\u961F\u5171\u4EAB\u670D\u52A1\uFF0C\u8BF7\u786E\u8BA4\u5F53\u524D\u8BBF\u95EE\u5730\u5740\u53EF\u7528\u540E\u91CD\u8BD5\u3002",
  unauthorized: "\u672A\u6388\u6743\uFF0C\u8BF7\u91CD\u65B0\u767B\u5F55\u3002",
  conflict: "\u6570\u636E\u5DF2\u88AB\u5176\u4ED6\u8BBE\u5907\u66F4\u65B0\uFF0C\u8BF7\u5237\u65B0\u9875\u9762\u540E\u91CD\u8BD5\u3002",
  server: "\u670D\u52A1\u5668\u5904\u7406\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\u3002",
  unknown: "\u64CD\u4F5C\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5\u3002"
};
var AppError = class extends Error {
  constructor(type, original, userMessage) {
    super(userMessage || original?.message || USER_MESSAGES.unknown);
    this.type = type;
    this.original = original;
    this.status = original?.status || 0;
    this.isAppError = true;
  }
};

// client/core/session.js
function loadSession() {
  return localStorage.getItem(SESSION_KEY);
}
function loadApiKey() {
  return sessionStorage.getItem(API_KEY_STORAGE_KEY) || localStorage.getItem(API_KEY_STORAGE_KEY) || "";
}
function saveSession(currentUserId, options = {}) {
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
  if (apiKey !== void 0) {
    storeApiKey(apiKey, rememberMe);
  }
}
function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  clearApiKey();
}
function clearApiKey() {
  sessionStorage.removeItem(API_KEY_STORAGE_KEY);
  localStorage.removeItem(API_KEY_STORAGE_KEY);
}
function storeApiKey(apiKey, rememberMe = false) {
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

// client/core/http.js
async function requestJson(url, options = {}) {
  const headers = { ...options.headers || {} };
  const method = (options.method || "GET").toUpperCase();
  if (!headers["X-API-Key"]) {
    const apiKey = loadApiKey();
    if (apiKey) {
      headers["X-API-Key"] = apiKey;
    }
  }
  let response;
  try {
    response = await fetch(url, {
      cache: "no-store",
      ...options,
      headers
    });
  } catch (error) {
    throw new AppError("network", error, "\u65E0\u6CD5\u8FDE\u63A5\u6218\u961F\u5171\u4EAB\u670D\u52A1\uFF0C\u8BF7\u786E\u8BA4\u5F53\u524D\u8BBF\u95EE\u5730\u5740\u53EF\u7528\u540E\u91CD\u8BD5\u3002");
  }
  const rawText = await response.text();
  let payload = null;
  if (rawText) {
    try {
      payload = JSON.parse(rawText);
    } catch {
      payload = null;
    }
  }
  if (!response.ok) {
    const detail = payload?.detail || payload?.message || `\u8BF7\u6C42\u5931\u8D25\uFF08${response.status}\uFF09`;
    const requestError = new Error(detail);
    requestError.status = response.status;
    requestError.payload = payload;
    throw requestError;
  }
  return payload;
}
async function fetchDatabaseSnapshot() {
  return requestJson(DATABASE_API_URL, {
    method: "GET",
    cache: "no-store"
  });
}
async function writeDatabaseSnapshot(database, version) {
  return requestJson(DATABASE_API_URL, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      database,
      version
    })
  });
}
async function fetchUploadList() {
  const response = await requestJson("/api/uploads");
  return response?.files || [];
}

// client/core/upload.js
function getSelectedUploadFiles(values) {
  return values.filter((value) => value instanceof File && value.size > 0);
}
async function uploadLocalAttachments(taskId, files, source = "submission") {
  const oversize = files.filter((file) => file.size > UPLOAD_MAX_SIZE_BYTES);
  if (oversize.length) {
    const names = oversize.map((file) => file.name).join("\u3001");
    throw new Error(`\u9644\u4EF6 ${names} \u8D85\u8FC7\u5355\u6587\u4EF6 5MB \u9650\u5236\uFF0C\u8BF7\u538B\u7F29\u540E\u91CD\u65B0\u4E0A\u4F20\u3002`);
  }
  if (files.length > MAX_UPLOAD_COUNT) {
    throw new Error(`\u5355\u6B21\u9644\u4EF6\u63D0\u4EA4\u6700\u591A ${MAX_UPLOAD_COUNT} \u4E2A\u6587\u4EF6\uFF0C\u5F53\u524D\u9009\u62E9\u4E86 ${files.length} \u4E2A\u3002`);
  }
  const formData = new FormData();
  formData.append("taskId", taskId);
  formData.append("source", source);
  for (const file of files) {
    formData.append("files", file);
  }
  const payload = await requestJson("/api/uploads", {
    method: "POST",
    body: formData
  });
  const attachments = payload?.attachments || [];
  const { getCurrentMember } = await import("./query-JOQHC7FI.js");
  const member = getCurrentMember();
  if (member) {
    for (const attachment of attachments) {
      attachment.uploadedBy = member.id;
      attachment.uploadedByName = member.name;
    }
  }
  return attachments;
}
function getLocalAttachmentPaths(attachments) {
  return attachments.filter((attachment) => attachment?.storage === "local" && attachment?.storagePath).map((attachment) => attachment.storagePath);
}
async function deleteLocalAttachments(attachments) {
  const paths = getLocalAttachmentPaths(attachments);
  if (!paths.length) {
    return;
  }
  try {
    await requestJson("/api/uploads/delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ paths })
    });
  } catch (error) {
    console.error("Failed to delete local attachments:", error);
  }
}

export {
  loadSession,
  loadApiKey,
  saveSession,
  clearSession,
  clearApiKey,
  storeApiKey,
  requestJson,
  fetchDatabaseSnapshot,
  writeDatabaseSnapshot,
  fetchUploadList,
  getSelectedUploadFiles,
  uploadLocalAttachments,
  getLocalAttachmentPaths,
  deleteLocalAttachments
};
