import { renderApp } from "./services.js";

const routeLoaders = {
  dashboard: () => import("../render/routes/dashboard.js"),
  market: () => loadExplicitRouteEntry("market"),
  myTasks: () => import("../render/routes/my-tasks.js"),
  taskManagement: () => import("../render/routes/task-management.js"),
  members: () => import("../render/routes/members.js"),
  projects: () => import("../render/routes/projects.js"),
  rankings: () => import("../render/routes/rankings.js"),
  reviews: () => import("../render/routes/reviews.js"),
  profile: () => import("../render/routes/profile.js"),
  settings: () => import("../render/routes/settings.js"),
};

const modalGroupLoaders = {
  approval: () => import("../render/modal-groups/approval.js"),
  member: () => import("../render/modal-groups/member.js"),
  settings: () => import("../render/modal-groups/settings.js"),
  task: () => import("../render/modal-groups/task.js"),
};

const modalGroupsByType = {
  "approval-action": "approval",
  "approval-reject": "approval",
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
  "task-owner-reassign": "task",
};

let workspaceRuntimeModule = null;
let workspaceRuntimePromise = null;
let workspacePrefetchScheduled = false;
let buildManifestPromise = null;

const routeModules = new Map();
const routePromises = new Map();
const modalGroupModules = new Map();
const modalGroupPromises = new Map();

function hasCallableExport(module) {
  if (!module) {
    return false;
  }
  if (typeof module.render === "function") {
    return true;
  }
  if (typeof module.default === "function") {
    return true;
  }
  if (module.default && typeof module.default.render === "function") {
    return true;
  }
  return Object.values(module).some((value) => typeof value === "function");
}

async function getBuildManifest() {
  if (!buildManifestPromise) {
    buildManifestPromise = fetch("/manifest.json", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Unable to load build manifest: ${response.status}`);
        }
        return response.json();
      })
      .catch((error) => {
        buildManifestPromise = null;
        throw error;
      });
  }
  return buildManifestPromise;
}

function appendRetryToken(url, retryIndex) {
  if (retryIndex <= 0) {
    return url;
  }
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}retry=${Date.now()}-${retryIndex}`;
}

async function importRouteEntryModule(routeEntryUrl, routeId) {
  let lastError = null;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const importUrl = appendRetryToken(routeEntryUrl, attempt);
    try {
      const module = await import(importUrl);
      if (!hasCallableExport(module)) {
        throw new Error(`Route chunk "${routeId}" loaded without callable exports.`);
      }
      return module;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error(`Route chunk "${routeId}" failed to load.`);
}

async function loadExplicitRouteEntry(routeId) {
  const manifest = await getBuildManifest();
  const routeEntryUrl = manifest?.routes?.[routeId];
  if (!routeEntryUrl) {
    throw new Error(`Route manifest entry missing for "${routeId}".`);
  }
  return importRouteEntryModule(routeEntryUrl, routeId);
}

export function getLoadedWorkspaceRuntime() {
  return workspaceRuntimeModule;
}

export function loadWorkspaceRuntime() {
  if (workspaceRuntimeModule) {
    return Promise.resolve(workspaceRuntimeModule);
  }
  if (workspaceRuntimePromise) {
    return workspaceRuntimePromise;
  }
  workspaceRuntimePromise = import("../render/workspace-runtime.js")
    .then((module) => {
      workspaceRuntimeModule = module;
      renderApp();
      return module;
    })
    .catch((error) => {
      workspaceRuntimePromise = null;
      throw error;
    });
  return workspaceRuntimePromise;
}

export function getLoadedRouteChunk(routeId) {
  return routeModules.get(routeId) || null;
}

export function loadRouteChunk(routeId, options = {}) {
  const normalizedRoute = routeLoaders[routeId] ? routeId : "dashboard";
  if (routeModules.has(normalizedRoute)) {
    return Promise.resolve(routeModules.get(normalizedRoute));
  }
  if (routePromises.has(normalizedRoute)) {
    return routePromises.get(normalizedRoute);
  }
  const promise = routeLoaders[normalizedRoute]()
    .then((module) => {
      if (!hasCallableExport(module)) {
        throw new Error(`Route chunk "${normalizedRoute}" loaded without callable exports.`);
      }
      routeModules.set(normalizedRoute, module);
      if (options.render !== false) {
        renderApp();
      }
      return module;
    })
    .catch((error) => {
      routeModules.delete(normalizedRoute);
      throw error;
    })
    .finally(() => {
      routePromises.delete(normalizedRoute);
    });
  routePromises.set(normalizedRoute, promise);
  return promise;
}

function getModalGroup(modalType) {
  return modalGroupsByType[modalType] || "task";
}

export function getLoadedModalChunk(modalType) {
  const groupName = getModalGroup(modalType);
  return modalGroupModules.get(groupName) || null;
}

export function loadModalChunk(modalType, options = {}) {
  const groupName = getModalGroup(modalType);
  if (modalGroupModules.has(groupName)) {
    return Promise.resolve(modalGroupModules.get(groupName));
  }
  if (modalGroupPromises.has(groupName)) {
    return modalGroupPromises.get(groupName);
  }
  const promise = modalGroupLoaders[groupName]()
    .then((module) => {
      if (!hasCallableExport(module)) {
        throw new Error(`Modal chunk "${groupName}" loaded without callable exports.`);
      }
      modalGroupModules.set(groupName, module);
      if (options.render !== false) {
        renderApp();
      }
      return module;
    })
    .catch((error) => {
      modalGroupModules.delete(groupName);
      throw error;
    })
    .finally(() => {
      modalGroupPromises.delete(groupName);
    });
  modalGroupPromises.set(groupName, promise);
  return promise;
}

function runWhenBrowserIsIdle(callback) {
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(callback, { timeout: 1200 });
    return;
  }
  window.setTimeout(callback, 320);
}

export function scheduleWorkspacePrefetch() {
  if (workspacePrefetchScheduled) {
    return;
  }
  workspacePrefetchScheduled = true;

  runWhenBrowserIsIdle(() => {
    const preferredRoutes = ["market", "myTasks", "members", "rankings"];
    const preferredModals = ["member-detail", "task-detail", "approval-action"];

    preferredRoutes.forEach((routeId) => {
      void loadRouteChunk(routeId, { render: false }).catch(() => {});
    });
    preferredModals.forEach((modalType) => {
      void loadModalChunk(modalType, { render: false }).catch(() => {});
    });
  });
}
