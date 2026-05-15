/**
 * Centralized error handling utilities.
 * Provides consistent error wrapping, user-facing messages, and logging.
 */

const USER_MESSAGES = {
  network: "无法连接本地共享服务，请确认电脑上的服务已启动。",
  unauthorized: "未授权，请重新登录。",
  conflict: "数据已被其他设备更新，请刷新页面后重试。",
  server: "服务器处理失败，请稍后重试。",
  unknown: "操作失败，请重试。",
};

export class AppError extends Error {
  constructor(type, original, userMessage) {
    super(userMessage || original?.message || USER_MESSAGES.unknown);
    this.type = type;
    this.original = original;
    this.status = original?.status || 0;
    this.isAppError = true;
  }
}

export function normalizeError(error) {
  if (error?.isAppError) return error;
  if (error instanceof TypeError && error.message?.includes("fetch")) {
    return new AppError("network", error, USER_MESSAGES.network);
  }
  if (error?.status === 401) {
    return new AppError("unauthorized", error, USER_MESSAGES.unauthorized);
  }
  if (error?.status === 409) {
    return new AppError("conflict", error, USER_MESSAGES.conflict);
  }
  if (error?.status >= 500) {
    return new AppError("server", error, USER_MESSAGES.server);
  }
  return new AppError("unknown", error, error?.message || USER_MESSAGES.unknown);
}

export function getUserMessage(error) {
  return normalizeError(error).message;
}

export async function withErrorHandler(asyncFn, options = {}) {
  const { onError, fallback = null, rethrow = false } = options;
  try {
    return await asyncFn();
  } catch (error) {
    const appError = normalizeError(error);
    console.error(`[${appError.type}]`, appError.original || appError);
    if (onError) onError(appError);
    if (rethrow) throw appError;
    return fallback;
  }
}
