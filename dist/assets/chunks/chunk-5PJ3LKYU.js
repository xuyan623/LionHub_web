import {
  SESSION_KEY
} from "./chunk-NDL62ULM.js";

// client/core/services.js
var _pushFlash = () => {
};
var _renderApp = () => {
};
function pushFlash(message, tone = "info") {
  _pushFlash(message, tone);
}
function renderApp() {
  _renderApp();
}
function setServices(services) {
  if (services.pushFlash) _pushFlash = services.pushFlash;
  if (services.renderApp) _renderApp = services.renderApp;
}

// client/core/session.js
function loadSession() {
  return localStorage.getItem(SESSION_KEY);
}
function saveSession(currentUserId) {
  if (currentUserId) {
    localStorage.setItem(SESSION_KEY, currentUserId);
    return;
  }
  localStorage.removeItem(SESSION_KEY);
}
function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

// client/core/runtime-loader.js
var routeLoaders = {
  dashboard: () => import("./dashboard-O2S5N7GE.js"),
  market: () => import("./market-VVMFWIKC.js"),
  myTasks: () => import("./my-tasks-FPLEITYT.js"),
  taskManagement: () => import("./task-management-6O6ZTLRA.js"),
  members: () => import("./members-MZJR26KV.js"),
  projects: () => import("./projects-D3I7NPBT.js"),
  rankings: () => import("./rankings-CBIZ3BWH.js"),
  reviews: () => import("./reviews-52XKOJPO.js"),
  profile: () => import("./profile-SNTRXBH6.js"),
  settings: () => import("./settings-KWLVZI4R.js")
};
var modalGroupLoaders = {
  approval: () => import("./approval-47BZ4KUF.js"),
  member: () => import("./member-OZGZJEQX.js"),
  settings: () => import("./settings-I2RW4NFC.js"),
  task: () => import("./task-JSVKYKXE.js")
};
var modalGroupsByType = {
  "approval-action": "approval",
  "password-change": "approval",
  "promotion-detail": "approval",
  "registration-edit": "approval",
  "registration-review": "approval",
  "role-change-request": "approval",
  "promotion-request": "approval",
  "sensitive-action": "approval",
  "file-manager": "settings",
  "member-detail": "member",
  "member-form": "member",
  "profile-content": "member",
  "retire-form": "member",
  "progress-note-form": "task",
  "share-task": "task",
  "task-attachment-form": "task",
  "task-completion": "task",
  "task-detail": "task",
  "task-form": "task",
  "task-owner-reassign": "task"
};
var workspaceRuntimeModule = null;
var workspaceRuntimePromise = null;
var routeModules = /* @__PURE__ */ new Map();
var routePromises = /* @__PURE__ */ new Map();
var modalGroupModules = /* @__PURE__ */ new Map();
var modalGroupPromises = /* @__PURE__ */ new Map();
function getLoadedWorkspaceRuntime() {
  return workspaceRuntimeModule;
}
function loadWorkspaceRuntime() {
  if (workspaceRuntimeModule) {
    return Promise.resolve(workspaceRuntimeModule);
  }
  if (workspaceRuntimePromise) {
    return workspaceRuntimePromise;
  }
  workspaceRuntimePromise = import("./workspace-runtime-47Y7SN7R.js").then((module) => {
    workspaceRuntimeModule = module;
    renderApp();
    return module;
  }).catch((error) => {
    workspaceRuntimePromise = null;
    throw error;
  });
  return workspaceRuntimePromise;
}
function getLoadedRouteChunk(routeId) {
  return routeModules.get(routeId) || null;
}
function loadRouteChunk(routeId) {
  const normalizedRoute = routeLoaders[routeId] ? routeId : "dashboard";
  if (routeModules.has(normalizedRoute)) {
    return Promise.resolve(routeModules.get(normalizedRoute));
  }
  if (routePromises.has(normalizedRoute)) {
    return routePromises.get(normalizedRoute);
  }
  const promise = routeLoaders[normalizedRoute]().then((module) => {
    routeModules.set(normalizedRoute, module);
    renderApp();
    return module;
  }).finally(() => {
    routePromises.delete(normalizedRoute);
  });
  routePromises.set(normalizedRoute, promise);
  return promise;
}
function getModalGroup(modalType) {
  return modalGroupsByType[modalType] || "task";
}
function getLoadedModalChunk(modalType) {
  const groupName = getModalGroup(modalType);
  return modalGroupModules.get(groupName) || null;
}
function loadModalChunk(modalType) {
  const groupName = getModalGroup(modalType);
  if (modalGroupModules.has(groupName)) {
    return Promise.resolve(modalGroupModules.get(groupName));
  }
  if (modalGroupPromises.has(groupName)) {
    return modalGroupPromises.get(groupName);
  }
  const promise = modalGroupLoaders[groupName]().then((module) => {
    modalGroupModules.set(groupName, module);
    renderApp();
    return module;
  }).finally(() => {
    modalGroupPromises.delete(groupName);
  });
  modalGroupPromises.set(groupName, promise);
  return promise;
}

export {
  pushFlash,
  renderApp,
  setServices,
  loadSession,
  saveSession,
  clearSession,
  getLoadedWorkspaceRuntime,
  loadWorkspaceRuntime,
  getLoadedRouteChunk,
  loadRouteChunk,
  getLoadedModalChunk,
  loadModalChunk
};
