import {
  API_KEY_STORAGE_KEY,
  DATABASE_API_URL
} from "./chunk-NDL62ULM.js";

// client/core/error-handler.js
var USER_MESSAGES = {
  network: "\u65E0\u6CD5\u8FDE\u63A5\u672C\u5730\u5171\u4EAB\u670D\u52A1\uFF0C\u8BF7\u786E\u8BA4\u7535\u8111\u4E0A\u7684\u670D\u52A1\u5DF2\u542F\u52A8\u3002",
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

// client/core/http.js
function _getApiKey() {
  return sessionStorage.getItem(API_KEY_STORAGE_KEY) || "";
}
async function requestJson(url, options = {}) {
  const headers = { ...options.headers || {} };
  const method = (options.method || "GET").toUpperCase();
  if (!headers["X-API-Key"]) {
    const apiKey = _getApiKey();
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
    throw new AppError("network", error, "\u65E0\u6CD5\u8FDE\u63A5\u672C\u5730\u5171\u4EAB\u670D\u52A1\uFF0C\u8BF7\u786E\u8BA4\u7535\u8111\u4E0A\u7684\u670D\u52A1\u5DF2\u542F\u52A8\u4E14\u5F53\u524D\u7F51\u7A7F\u5730\u5740\u53EF\u8BBF\u95EE\u3002");
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

export {
  requestJson,
  fetchDatabaseSnapshot,
  writeDatabaseSnapshot,
  fetchUploadList
};
