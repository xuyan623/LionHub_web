import { DATABASE_API_URL } from "./state.js";
import { AppError } from "./error-handler.js";
import { loadApiKey } from "./session.js";

export async function requestJson(url, options = {}) {
  const headers = { ...(options.headers || {}) };
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
      headers,
    });
  } catch (error) {
    throw new AppError("network", error, "无法连接本地共享服务，请确认电脑上的服务已启动且当前网穿地址可访问。");
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
    const detail = payload?.detail || payload?.message || `请求失败（${response.status}）`;
    const requestError = new Error(detail);
    requestError.status = response.status;
    requestError.payload = payload;
    throw requestError;
  }

  return payload;
}

export async function fetchDatabaseSnapshot() {
  return requestJson(DATABASE_API_URL, {
    method: "GET",
    cache: "no-store",
  });
}

export async function writeDatabaseSnapshot(database, version) {
  return requestJson(DATABASE_API_URL, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      database,
      version,
    }),
  });
}

export async function fetchUploadList() {
  const response = await requestJson("/api/uploads");
  return response?.files || [];
}
