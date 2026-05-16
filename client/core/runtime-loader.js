import { renderApp } from "./services.js";
import { renderMarketPage } from "../render/pages.js";

const routeLoaders = {
  dashboard: () => import("../render/routes/dashboard.js"),
  market: () => Promise.resolve({ render: renderMarketPage }),
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

export function loadRouteChunk(routeId) {
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
      renderApp();
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

export function loadModalChunk(modalType) {
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
      renderApp();
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
