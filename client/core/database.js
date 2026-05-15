import { state, LEGACY_STORAGE_KEY, SESSION_KEY, SHARED_SYNC_INTERVAL_MS, setSharedSyncTimer } from "./state.js";
import { requestJson, fetchDatabaseSnapshot, writeDatabaseSnapshot } from "./http.js";
import { getRoleForIdentity, ensureVisibleRoute } from "../domain/permissions.js";
import { cleanupOrphanedNotifications } from "../domain/notifications.js";
import { initRouter, navigateTo } from "./router.js";

let sharedSyncTimer = null;

export async function initialize() {
  try {
    state.database = await loadDatabase();
    cleanupOrphanedNotifications();
    state.currentUserId = loadSession();
    state.route = _readHashRoute() || "dashboard";
    state.initError = "";
    ensureVisibleRoute();
    initRouter();
    startSharedDataSync();
  } catch (error) {
    console.error("Failed to initialize application:", error);
    state.initError = formatInitializationError(error);
  }
}

function formatInitializationError(error) {
  return error instanceof Error ? error.message : String(error);
}

export async function loadDatabase() {
  clearLegacyLocalDatabase();
  const snapshot = await fetchDatabaseSnapshot();
  if (snapshot.database) {
    state.databaseVersion = Number(snapshot.version || 0);
    normalizeDatabaseRoles(snapshot.database);
    migrateProgressNodes(snapshot.database);
    return snapshot.database;
  }
  throw new Error("服务器未返回初始化数据，请检查本地服务是否已完成站点初始化。");
}

function normalizeDatabaseRoles(database) {
  if (!database || !Array.isArray(database.members)) {
    return;
  }
  for (const member of database.members) {
    const expectedRole = getRoleForIdentity(member.identity);
    if (member.role !== expectedRole) {
      member.role = expectedRole;
    }
  }
}

function migrateProgressNodes(database) {
  if (!database || !Array.isArray(database.tasks)) return;
  for (const task of database.tasks) {
    if (!Array.isArray(task.progressNodes)) {
      task.progressNodes = [];
    }
    if (!Array.isArray(task.comments)) continue;
    const progressComments = task.comments.filter((c) => c.title === "进度更新");
    for (const comment of progressComments) {
      const existing = task.progressNodes.some((n) => n.id === comment.id);
      if (!existing) {
        task.progressNodes.push({
          id: comment.id,
          taskId: task.id,
          percent: task.progressPercent || 0,
          note: comment.content || "",
          attachments: [],
          createdAt: comment.createdAt,
          authorId: comment.authorId,
        });
      }
    }
  }
}

export async function saveDatabase(database = state.database) {
  try {
    const savedSnapshot = await writeDatabaseSnapshot(database, state.databaseVersion);
    if (!savedSnapshot) {
      throw new Error("服务器返回数据为空，请刷新页面后重试。");
    }
    state.databaseVersion = savedSnapshot.version;
    return true;
  } catch (error) {
    await recoverFromPersistenceFailure(error);
    return false;
  }
}

function loadSession() {
  return localStorage.getItem(SESSION_KEY);
}

export function saveSession() {
  if (state.currentUserId) {
    localStorage.setItem(SESSION_KEY, state.currentUserId);
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}

function clearLegacyLocalDatabase() {
  localStorage.removeItem(LEGACY_STORAGE_KEY);
}

async function synchronizeDatabaseFromServer() {
  try {
    const snapshot = await fetchDatabaseSnapshot();
    if (!snapshot.database) {
      return false;
    }
    state.database = snapshot.database;
    state.databaseVersion = Number(snapshot.version || 0);
    return true;
  } catch (error) {
    console.error("Failed to synchronize database:", error);
    return false;
  }
}

function startSharedDataSync() {
  if (sharedSyncTimer !== null) {
    return;
  }
  const timer = window.setInterval(() => {
    void refreshDatabaseQuietly();
  }, SHARED_SYNC_INTERVAL_MS);
  setSharedSyncTimer(timer);
}

export async function refreshDatabaseQuietly() {
  if (!state.database || state.initError || shouldPauseSharedSync()) {
    return;
  }
  try {
    const diffResult = await requestJson(`/api/database/diff?from_version=${state.databaseVersion}`);
    const serverVersion = Number(diffResult.version || 0);
    if (!serverVersion || serverVersion <= state.databaseVersion) {
      return;
    }
    if (diffResult.database) {
      // Server returned full snapshot (diff unavailable or gap too large)
      state.database = diffResult.database;
    } else if (diffResult.diff) {
      applyDiff(state.database, diffResult.diff);
    }
    state.databaseVersion = serverVersion;
    const { renderApp } = await import("../render/core.js");
    renderApp();
  } catch (error) {
    console.error("Shared sync skipped:", error);
  }
}

function applyDiff(database, diff) {
  const collectionKeys = ["users", "members", "tasks", "taskParticipants", "approvals", "pointTransactions", "notifications", "robotProjects"];
  for (const key of collectionKeys) {
    const changes = diff[key];
    if (!changes) continue;
    const list = database[key];
    if (!Array.isArray(list)) continue;
    // Remove
    for (const id of changes.removed || []) {
      const idx = list.findIndex((item) => item.id === id);
      if (idx !== -1) list.splice(idx, 1);
    }
    // Update
    for (const item of changes.updated || []) {
      const existing = list.find((i) => i.id === item.id);
      if (existing) Object.assign(existing, item);
    }
    // Add
    for (const item of changes.added || []) {
      if (!list.some((i) => i.id === item.id)) {
        list.unshift(item);
      }
    }
  }
  if (diff.settings) {
    database.settings = diff.settings;
  }
}

function shouldPauseSharedSync() {
  if (document.hidden) {
    return true;
  }
  const activeElement = document.activeElement;
  if (activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement || activeElement instanceof HTMLSelectElement) {
    return true;
  }
  return state.modal?.type === "task-form"
    || state.modal?.type === "task-detail"
    || state.modal?.type === "member-form"
    || state.modal?.type === "profile-content"
    || state.modal?.type === "registration-edit"
    || state.modal?.type === "sensitive-action"
    || state.modal?.type === "task-owner-reassign"
    || state.modal?.type === "registration-review"
    || state.modal?.type === "task-completion"
    || state.modal?.type === "progress-note-form"
    || state.modal?.type === "task-attachment-form";
}

async function recoverFromPersistenceFailure(error) {
  console.error("Failed to persist shared database:", error);
  const synchronized = await synchronizeDatabaseFromServer();
  const { pushFlash } = await import("../render/core.js");
  if (error.status === 409) {
    pushFlash(
      synchronized
        ? "共享数据已被其他设备更新，当前页面已自动同步，请重新执行刚才操作。"
        : "共享数据已被其他设备更新，请刷新页面后重试。",
      "info"
    );
    return;
  }
  const message = error instanceof Error && error.message ? error.message : "未知错误";
  pushFlash(
    synchronized
      ? `保存失败，已恢复到电脑上的最新数据：${message}`
      : `保存失败：${message}`,
    "info"
  );
}

function _readHashRoute() {
  const hash = window.location.hash.replace("#", "").trim();
  const validRoutes = ["dashboard", "market", "myTasks", "taskManagement", "members", "projects", "rankings", "reviews", "profile", "settings"];
  return validRoutes.includes(hash) ? hash : "";
}

export { navigateTo };


