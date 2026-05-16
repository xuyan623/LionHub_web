import {
  escapeAttribute,
  escapeHtml
} from "./chunk-UQLSNBUY.js";
import {
  fetchDatabaseSnapshot,
  requestJson,
  writeDatabaseSnapshot
} from "./chunk-AFQ47FFH.js";
import {
  LEGACY_STORAGE_KEY,
  SESSION_KEY,
  SHARED_SYNC_INTERVAL_MS,
  appRoot,
  dictionaries,
  options,
  routes,
  setSharedSyncTimer,
  state
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
  dashboard: () => import("./dashboard-L7CRPYTN.js"),
  market: () => import("./market-FTHJMYCD.js"),
  myTasks: () => import("./my-tasks-75UXC42U.js"),
  taskManagement: () => import("./task-management-RZRT2JVY.js"),
  members: () => import("./members-4R7JSK4U.js"),
  projects: () => import("./projects-FJ4MCTVI.js"),
  rankings: () => import("./rankings-BCV5BYSG.js"),
  reviews: () => import("./reviews-RO4YXSGV.js"),
  profile: () => import("./profile-A5YMOEJD.js"),
  settings: () => import("./settings-DFDW4FGV.js")
};
var modalGroupLoaders = {
  approval: () => import("./approval-2FOMDN5P.js"),
  member: () => import("./member-2MHCRKJQ.js"),
  settings: () => import("./settings-CKWXKBRF.js"),
  task: () => import("./task-VSFJGNKA.js")
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
  workspaceRuntimePromise = import("./workspace-runtime-BV62I4P5.js").then((module) => {
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
    if (!hasCallableExport(module)) {
      throw new Error(`Route chunk "${normalizedRoute}" loaded without callable exports.`);
    }
    routeModules.set(normalizedRoute, module);
    renderApp();
    return module;
  }).catch((error) => {
    routeModules.delete(normalizedRoute);
    throw error;
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
    if (!hasCallableExport(module)) {
      throw new Error(`Modal chunk "${groupName}" loaded without callable exports.`);
    }
    modalGroupModules.set(groupName, module);
    renderApp();
    return module;
  }).catch((error) => {
    modalGroupModules.delete(groupName);
    throw error;
  }).finally(() => {
    modalGroupPromises.delete(groupName);
  });
  modalGroupPromises.set(groupName, promise);
  return promise;
}

// client/render/core.js
function dismissFlashDom() {
  state.flash = "";
  const element = document.querySelector(".flash-toast");
  if (element) {
    element.classList.remove("is-visible");
    element.style.display = "none";
  }
  state.flashTimer = null;
}
function pushFlashImpl(message, tone = "info") {
  if (state.flashTimer !== null) {
    clearTimeout(state.flashTimer);
  }
  state.flash = message;
  state.flashTone = tone;
  let element = document.querySelector(".flash-toast");
  if (!element) {
    renderAppImpl();
    element = document.querySelector(".flash-toast");
  }
  if (element) {
    element.style.display = "";
    element.className = `flash-toast flash-${tone} is-visible`;
    const textElement = element.querySelector(".flash-text");
    if (textElement) {
      textElement.textContent = message;
    }
  }
  state.flashTimer = setTimeout(() => dismissFlashDom(), 5e3);
}
function renderApp2() {
  renderAppImpl();
}
function renderAppImpl() {
  try {
    if (state.initError) {
      appRoot.innerHTML = renderInitializationErrorShell();
      return;
    }
    if (!state.currentUserId) {
      appRoot.innerHTML = renderAuthShell();
      return;
    }
    if (!state.databaseReady) {
      void loadWorkspaceRuntime();
      void loadRouteChunk(state.route);
      appRoot.innerHTML = renderWorkspaceLoadingShell();
      return;
    }
    const user = getCurrentUserRecord();
    if (!user) {
      state.currentUserId = null;
      saveSession(state.currentUserId);
      appRoot.innerHTML = renderAuthShell();
      return;
    }
    if (user.status !== "active") {
      appRoot.innerHTML = renderWaitingShell(user);
      return;
    }
    const runtime = getLoadedWorkspaceRuntime();
    if (!runtime) {
      void loadWorkspaceRuntime();
      void loadRouteChunk(state.route);
      appRoot.innerHTML = renderWorkspaceLoadingShell(getMemberRecord(user.memberId));
      return;
    }
    runtime.renderWorkspaceRoot(appRoot);
  } catch (error) {
    appRoot.innerHTML = `
      <div style="padding:40px;color:#ff6666">
        <h2>\u6E32\u67D3\u9519\u8BEF</h2>
        <pre style="white-space:pre-wrap">${escapeHtml(error.stack || error.message || String(error))}</pre>
      </div>
    `;
    console.error("renderApp error:", error);
  }
}
function getCurrentUserRecord() {
  return state.database?.users.find((user) => user.id === state.currentUserId) || null;
}
function getMemberRecord(memberId) {
  return state.database?.members.find((member) => member.id === memberId) || null;
}
function renderInitializationErrorShell() {
  const secureContextTip = window.isSecureContext ? "\u5F53\u524D\u5DF2\u662F\u5B89\u5168\u4E0A\u4E0B\u6587\uFF0C\u542F\u52A8\u5931\u8D25\u66F4\u53EF\u80FD\u6765\u81EA\u6D4F\u89C8\u5668\u7F13\u5B58\u6216\u672C\u5730\u6570\u636E\u5F02\u5E38\u3002" : "\u5F53\u524D\u7F51\u5740\u4E0D\u662F\u5B89\u5168\u4E0A\u4E0B\u6587\u3002\u90E8\u5206\u79FB\u52A8\u7AEF\u6D4F\u89C8\u5668\u5728\u666E\u901A HTTP \u7F51\u7A7F\u5730\u5740\u4E0B\u4F1A\u9650\u5236 Web Crypto\uFF0C\u5EFA\u8BAE\u4F18\u5148\u6539\u7528 HTTPS \u7F51\u7A7F\u5730\u5740\u3002";
  return `
    <div class="auth-layout">
      <section class="auth-panel">
        <div class="auth-card glass-card">
          <div class="boot-mark">Lion Hub</div>
          <h1>\u5E94\u7528\u542F\u52A8\u5931\u8D25</h1>
          <p>\u521D\u59CB\u5316\u6210\u5458\u3001\u4EFB\u52A1\u4E0E\u767B\u5F55\u6570\u636E\u65F6\u53D1\u751F\u9519\u8BEF\uFF0C\u9875\u9762\u5DF2\u505C\u6B62\u5728\u5B89\u5168\u9519\u8BEF\u6001\u3002</p>
          <div class="panel">
            <div class="definition-list">
              <div class="definition-row"><span>\u9519\u8BEF\u4FE1\u606F</span><strong>${escapeHtml(state.initError)}</strong></div>
              <div class="definition-row"><span>\u5F53\u524D\u73AF\u5883</span><strong>${window.isSecureContext ? "\u5B89\u5168\u4E0A\u4E0B\u6587" : "\u975E\u5B89\u5168\u4E0A\u4E0B\u6587"}</strong></div>
            </div>
          </div>
          <div class="feedback error">${escapeHtml(secureContextTip)}</div>
        </div>
      </section>
      <aside class="auth-aside">
        <div class="hero-panel glass-card">
          <div class="brand-badge">Startup Diagnostics</div>
          <h2>\u5982\u679C\u4F60\u662F\u901A\u8FC7\u7F51\u7A7F\u5730\u5740\u5728\u624B\u673A\u4E0A\u6253\u5F00\uFF0C\u8FD9\u91CC\u6700\u5E38\u89C1\u7684\u95EE\u9898\u662F\u4F7F\u7528\u4E86 HTTP \u800C\u4E0D\u662F HTTPS\u3002</h2>
          <p>\u82E5\u4ECD\u5931\u8D25\uFF0C\u8BF7\u5F3A\u5236\u5237\u65B0\u9875\u9762\uFF0C\u6216\u6E05\u6389\u6D4F\u89C8\u5668\u7AD9\u70B9\u7F13\u5B58\u540E\u91CD\u8BD5\u3002</p>
        </div>
      </aside>
    </div>
  `;
}
function renderAuthShell() {
  const hydrationMessage = state.databaseHydrating ? "\u6B63\u5728\u8FDE\u63A5\u5171\u4EAB\u670D\u52A1\u3002\u63D0\u4EA4\u6CE8\u518C\u6216\u767B\u5F55\u540E\u4F1A\u7EE7\u7EED\u540C\u6B65\u6240\u9700\u6570\u636E\u3002" : "\u9996\u5C4F\u4E0D\u4F1A\u81EA\u52A8\u62C9\u53D6\u5168\u91CF\u5171\u4EAB\u6570\u636E\uFF0C\u53EA\u6709\u767B\u5F55\u6210\u529F\u6216\u63D0\u4EA4\u6CE8\u518C\u65F6\u624D\u4F1A\u540C\u6B65\u3002";
  return `
    <div class="auth-layout">
      <section class="auth-panel">
        <div class="auth-card glass-card">
          <div class="auth-meta">
            <span>RoboMaster \u5185\u90E8\u534F\u4F5C\u5E73\u53F0</span>
            <span>Team Workspace</span>
          </div>
          <div class="boot-mark">Lion Hub</div>
          <h1>${state.authMode === "login" ? "\u8FDB\u5165\u6218\u961F\u534F\u4F5C\u4E2D\u67A2" : "\u63D0\u4EA4\u6CE8\u518C\u8FDB\u5165\u5BA1\u6838\u6D41"}</h1>
          <p>${state.authMode === "login" ? "\u652F\u6301\u90AE\u7BB1 + \u5BC6\u7801\u767B\u5F55\u3002\u5F85\u5BA1\u6838\u8D26\u53F7\u767B\u5F55\u540E\u4F1A\u8FDB\u5165\u5BA1\u6838\u4E2D\u9875\u9762\u3002" : "\u6CE8\u518C\u540E\u81EA\u52A8\u8FDB\u5165\u5F85\u5BA1\u6838\u72B6\u6001\uFF0C\u7531\u7BA1\u7406\u5458\u5206\u914D\u8EAB\u4EFD\u3001\u90E8\u95E8\u4E0E\u7CFB\u7EDF\u6743\u9650\u3002"}</p>
          ${state.authMode === "login" ? renderLoginForm() : renderRegisterForm()}
          <div class="helper-text" style="margin-top:12px">${escapeHtml(hydrationMessage)}</div>
          <div class="feedback ${state.authFeedback ? "error" : ""}">${escapeHtml(state.authFeedback || "")}</div>
        </div>
      </section>
      <aside class="auth-aside">
        <div class="hero-panel glass-card">
          <div class="brand-badge">Lion Hub Workspace</div>
          <h2>\u4EFB\u52A1\u534F\u4F5C\u3001\u5BA1\u6838\u6D41\u8F6C\u3001\u79EF\u5206\u8BB0\u5F55\u548C\u5175\u79CD\u8FDB\u5EA6\u7EDF\u4E00\u5728\u4E00\u4E2A\u5DE5\u4F5C\u53F0\u91CC\u5B8C\u6210\u3002</h2>
          <p>\u8FD9\u91CC\u7528\u4E8E\u6218\u961F\u65E5\u5E38\u534F\u4F5C\u4E0E\u4EFB\u52A1\u63A8\u8FDB\u3002\u961F\u5458\u53EF\u4EE5\u67E5\u770B\u516C\u5F00\u4EFB\u52A1\u3001\u53C2\u4E0E\u6267\u884C\u3001\u63D0\u4EA4\u6210\u679C\u3001\u8DDF\u8FDB\u5BA1\u6838\uFF0C\u4E5F\u53EF\u4EE5\u5728\u4E2A\u4EBA\u4E2D\u5FC3\u7EF4\u62A4\u81EA\u5DF1\u7684\u4E2A\u6027\u5185\u5BB9\u3001\u4EFB\u52A1\u8BB0\u5F55\u548C\u6210\u957F\u8F68\u8FF9\u3002</p>
          <div class="hero-grid">
            <div class="hero-block"><h3>\u516C\u5F00\u4EFB\u52A1\u5E02\u573A</h3><p>\u652F\u6301\u6309\u4EFB\u52A1\u7C7B\u578B\u3001\u90E8\u95E8\u3001\u65B9\u5411\u548C\u5175\u79CD\u7B5B\u9009\uFF0C\u5FEB\u901F\u627E\u5230\u9002\u5408\u81EA\u5DF1\u7684\u4EFB\u52A1\u5E76\u67E5\u770B\u8BE6\u60C5\u3002</p></div>
            <div class="hero-block"><h3>\u5B8C\u6574\u534F\u4F5C\u94FE\u8DEF</h3><p>\u4ECE\u9886\u53D6\u4EFB\u52A1\u3001\u66F4\u65B0\u8FDB\u5EA6\u3001\u4E0A\u4F20\u9644\u4EF6\u5230\u63D0\u4EA4\u5BA1\u6838\uFF0C\u6240\u6709\u5173\u952E\u52A8\u4F5C\u90FD\u4F1A\u5728\u7AD9\u5185\u7559\u75D5\u3002</p></div>
            <div class="hero-block"><h3>\u5BA1\u6838\u4E0E\u79EF\u5206</h3><p>\u9AD8\u96BE\u4EFB\u52A1\u5BA1\u6279\u3001\u5B8C\u6210\u5BA1\u6838\u3001\u70B9\u6570\u7ED3\u7B97\u548C\u8865\u507F\u8BB0\u5F55\u4F1A\u7EDF\u4E00\u5F52\u6863\uFF0C\u65B9\u4FBF\u540E\u7EED\u590D\u76D8\u548C\u7EDF\u8BA1\u3002</p></div>
            <div class="hero-block"><h3>\u4E2A\u4EBA\u6210\u957F\u89C6\u56FE</h3><p>\u6BCF\u4F4D\u6210\u5458\u90FD\u53EF\u4EE5\u5728\u4E2A\u4EBA\u4E2D\u5FC3\u67E5\u770B\u4E2A\u6027\u5185\u5BB9\u3001\u53C2\u4E0E\u8BB0\u5F55\u3001\u79EF\u5206\u6784\u6210\u548C\u6700\u8FD1\u5B8C\u6210\u7684\u4EFB\u52A1\u5FEB\u7167\u3002</p></div>
          </div>
        </div>
      </aside>
    </div>
  `;
}
function renderLoginForm() {
  return `
    <form class="auth-form" data-form="login">
      <label class="field-group"><span class="field-label">\u90AE\u7BB1</span><input class="field-input" type="email" name="email" placeholder="name@example.com" required></label>
      <label class="field-group"><span class="field-label">\u5BC6\u7801</span><input class="field-input" type="password" name="password" placeholder="\u8BF7\u8F93\u5165\u5BC6\u7801" required></label>
      <label class="field-group" style="flex-direction:row;align-items:center;gap:8px"><input type="checkbox" name="rememberMe" checked ${state.rememberMe ? "checked" : ""} style="width:18px;height:18px;accent-color:white"> <span class="helper-text">\u8BB0\u4F4F\u767B\u5F55\u72B6\u6001</span></label>
      <div class="button-row"><button class="button-primary" type="submit" ${state.formLoading === "login" ? "disabled" : ""}>\u767B\u5F55</button><button class="button-ghost" type="button" data-action="switch-auth" data-mode="register">\u6CE8\u518C\u65B0\u8D26\u53F7</button></div>
    </form>
  `;
}
function renderRegisterForm() {
  return `
    <form class="auth-form" data-form="register">
      <div class="field-grid">
        <label class="field-group"><span class="field-label">\u7528\u6237\u540D</span><input class="field-input" type="text" name="username" placeholder="\u7528\u4E8E\u7CFB\u7EDF\u5C55\u793A" required></label>
        <label class="field-group"><span class="field-label">\u59D3\u540D</span><input class="field-input" type="text" name="name" placeholder="\u771F\u5B9E\u59D3\u540D\u6216\u6218\u961F\u5185\u59D3\u540D" required></label>
      </div>
      <div class="field-grid">
        <label class="field-group"><span class="field-label">\u90AE\u7BB1</span><input class="field-input" type="email" name="email" placeholder="\u7528\u4E8E\u767B\u5F55" required></label>
        <label class="field-group"><span class="field-label">\u624B\u673A\u53F7</span><input class="field-input" type="tel" name="phone" placeholder="\u7528\u4E8E\u8054\u7CFB" required></label>
      </div>
      <label class="field-group"><span class="field-label">\u5BC6\u7801</span><input class="field-input" type="password" name="password" placeholder="\u8BBE\u7F6E\u767B\u5F55\u5BC6\u7801" required></label>
      <label class="field-group"><span class="field-label">\u786E\u8BA4\u5BC6\u7801</span><input class="field-input" type="password" name="confirmPassword" placeholder="\u518D\u6B21\u8F93\u5165\u5BC6\u7801" required></label>
      <div class="field-grid">
        <label class="field-group"><span class="field-label">\u610F\u5411\u7EC4\u522B</span><select class="field-select" name="department" required>${renderSelectOptions(options.departments)}</select></label>
        <label class="field-group"><span class="field-label">\u6280\u80FD\u6807\u7B7E</span><input class="field-input" type="text" name="skills" placeholder="\u7528\u9017\u53F7\u5206\u9694\uFF0C\u4F8B\u5982 C, ROS, OpenCV"></label>
      </div>
      <label class="field-group"><span class="field-label">\u4E2A\u4EBA\u7B80\u4ECB</span><textarea class="field-textarea" name="bio" placeholder="\u7B80\u5355\u4ECB\u7ECD\u64C5\u957F\u65B9\u5411\u3001\u53C2\u4E0E\u7ECF\u5386\u6216\u5E0C\u671B\u627F\u62C5\u7684\u5DE5\u4F5C"></textarea></label>
      <div class="button-row"><button class="button-primary" type="submit" ${state.formLoading === "register" ? "disabled" : ""}>\u63D0\u4EA4\u6CE8\u518C</button><button class="button-ghost" type="button" data-action="switch-auth" data-mode="login">\u8FD4\u56DE\u767B\u5F55</button></div>
    </form>
  `;
}
function renderWaitingShell(user) {
  const member = getMemberRecord(user.memberId);
  const isRejected = user.status === "rejected";
  const isDisabled = user.status === "disabled";
  return `
    <div class="auth-layout">
      <section class="auth-panel">
        <div class="auth-card glass-card">
          <div class="boot-mark">${isDisabled ? "Account Disabled" : isRejected ? "Review Result" : "Pending Review"}</div>
          <h1>${isDisabled ? "\u8D26\u53F7\u5DF2\u505C\u7528" : isRejected ? "\u5BA1\u6838\u672A\u901A\u8FC7" : "\u8D26\u53F7\u5BA1\u6838\u4E2D"}</h1>
          <p>${isDisabled ? "\u5F53\u524D\u8D26\u53F7\u5DF2\u88AB\u7BA1\u7406\u5458\u505C\u7528\uFF0C\u6682\u65F6\u4E0D\u80FD\u8FDB\u5165\u5DE5\u4F5C\u53F0\u3002\u5982\u9700\u6062\u590D\uFF0C\u8BF7\u8054\u7CFB\u7BA1\u7406\u5458\u5904\u7406\u3002" : isRejected ? "\u5F53\u524D\u8D26\u53F7\u5C1A\u672A\u8FDB\u5165\u6B63\u5F0F\u7CFB\u7EDF\uFF0C\u8BF7\u8054\u7CFB\u7BA1\u7406\u5458\u4FEE\u6B63\u8D44\u6599\u540E\u91CD\u65B0\u63D0\u4EA4\u3002" : "\u7BA1\u7406\u5458\u4F1A\u5728\u5BA1\u6838\u4E2D\u5FC3\u5206\u914D\u6210\u5458\u8EAB\u4EFD\u3001\u90E8\u95E8\u3001\u5175\u79CD\u4E0E\u7CFB\u7EDF\u6743\u9650\uFF0C\u5BA1\u6838\u901A\u8FC7\u540E\u5373\u53EF\u8FDB\u5165\u5B8C\u6574\u5DE5\u4F5C\u53F0\u3002"}</p>
          <div class="panel">
            <div class="definition-list">
              <div class="definition-row"><span>\u7533\u8BF7\u4EBA</span><strong>${escapeHtml(member?.name || user.username)}</strong></div>
              <div class="definition-row"><span>\u90AE\u7BB1</span><strong>${escapeHtml(user.email)}</strong></div>
              <div class="definition-row"><span>\u610F\u5411\u7EC4\u522B</span><strong>${escapeHtml((member?.departments || []).join(" / ") || "\u672A\u586B\u5199")}</strong></div>
            </div>
          </div>
          <div class="button-row">
            ${!isDisabled ? '<button class="button-primary" type="button" data-action="open-registration-edit">\u4FEE\u6539\u4FE1\u606F</button>' : ""}
            ${!isDisabled ? '<button class="button-danger" type="button" data-action="cancel-registration">\u53D6\u6D88\u6CE8\u518C</button>' : ""}
            <button class="button-secondary" type="button" data-action="logout">\u9000\u51FA\u8D26\u53F7</button>
          </div>
        </div>
      </section>
      <aside class="auth-aside">
        <div class="hero-panel glass-card">
          <div class="brand-badge">Approval Pipeline</div>
          <h2>\u6CE8\u518C\u7533\u8BF7\u4F1A\u76F4\u63A5\u8FDB\u5165\u5BA1\u6838\u4E2D\u5FC3\u3002</h2>
          <p>\u7BA1\u7406\u5458\u53EF\u5728\u5BA1\u6838\u4E2D\u5FC3\u67E5\u770B\u6CE8\u518C\u7533\u8BF7\uFF0C\u5E76\u4E3A\u4F60\u8BBE\u7F6E\u6210\u5458\u8EAB\u4EFD\u3001\u6743\u9650\u89D2\u8272\u3001\u6240\u5C5E\u90E8\u95E8\u3001\u65B9\u5411\u4E0E\u5175\u79CD\u6807\u7B7E\u3002</p>
        </div>
      </aside>
    </div>
  `;
}
function renderWorkspaceLoadingShell(member = null) {
  const currentRoute = routes.find((route) => route.id === state.route);
  const routeLabel = currentRoute ? currentRoute.label : "\u5F53\u524D\u9875\u9762";
  const routeButtons = routes.map((route) => `<button type="button" class="nav-item ${route.id === state.route ? "is-active" : ""}" data-action="navigate" data-route="${route.id}"><span>${route.label}</span></button>`).join("");
  return `
    <div class="workspace">
      <aside class="sidebar ${state.mobileNavOpen ? "is-open" : ""}">
        <div class="brand">
          <div class="brand-badge">Lion Hub</div>
          <h1>\u9192\u72EE\u6218\u961F\u534F\u4F5C\u4E2D\u67A2</h1>
          <p>\u6210\u5458\u3001\u4EFB\u52A1\u3001\u5BA1\u6838\u3001\u79EF\u5206\u4E0E\u5175\u79CD\u8FDB\u5EA6\u7684\u4E00\u4F53\u5316\u5DE5\u4F5C\u53F0\u3002</p>
        </div>
        <div class="nav-group">
          <div class="nav-label">Workspace</div>
          ${routeButtons}
        </div>
        <div class="sidebar-footer">
          <strong>${escapeHtml(member?.name || "\u6B63\u5728\u6062\u590D\u4F1A\u8BDD")}</strong>
          <span>${escapeHtml(member ? `${dictionaries.identities[member.identity]} \xB7 ${dictionaries.roles[member.role]}` : "\u540C\u6B65\u6210\u5458\u8D44\u6599\u4E2D")}</span>
          <span class="helper-text">${escapeHtml(member?.departments?.join(" / ") || "\u9996\u6B21\u8FDB\u5165\u4F1A\u5148\u52A0\u8F7D\u5DE5\u4F5C\u53F0\u6570\u636E")}</span>
          <div class="button-row">
            <button class="button-secondary" type="button" data-action="navigate" data-route="profile">\u4E2A\u4EBA\u4E2D\u5FC3</button>
            <button class="button-ghost" type="button" data-action="logout">\u9000\u51FA</button>
          </div>
        </div>
      </aside>
      <main class="main-area">
        <div class="topbar">
          <div class="search-shell">
            <button class="button-ghost mobile-toggle" type="button" data-action="toggle-nav">\u83DC\u5355</button>
            <input type="text" placeholder="\u6B63\u5728\u88C5\u8F7D\u5DE5\u4F5C\u53F0\u6570\u636E\u2026" value="" disabled>
          </div>
          <div class="topbar-actions">
            <span class="topbar-chip">\u540C\u6B65\u4E2D</span>
          </div>
        </div>
        <div class="page-content">
          <section>
            <div class="page-header">
              <div><h2>${escapeHtml(routeLabel)}</h2><p>\u6B63\u5728\u540C\u6B65\u9996\u5C4F\u6570\u636E\u4E0E\u9875\u9762\u8D44\u6E90\uFF0C\u5DE5\u4F5C\u53F0\u58F3\u5C42\u5DF2\u5148\u663E\u793A\u3002</p></div>
            </div>
            <section class="panel">
              <div class="empty-state">\u6B63\u5728\u52A0\u8F7D\u5F53\u524D\u9875\u9762\u5185\u5BB9\u2026</div>
            </section>
          </section>
        </div>
      </main>
      <div class="backdrop ${state.mobileNavOpen ? "is-open" : ""}" data-action="close-overlay"></div>
    </div>
  `;
}
function renderSelectOptions(values, selectedValue = "", labels = null) {
  return values.map((value) => {
    const selected = value === selectedValue ? "selected" : "";
    const label = labels ? labels[value] : value;
    return `<option value="${escapeAttribute(value)}" ${selected}>${escapeHtml(label)}</option>`;
  }).join("");
}
setServices({ pushFlash: pushFlashImpl, renderApp: renderAppImpl });

// client/core/modal.js
function pushModal(nextModal) {
  if (state.modal) {
    state.modalStack.push(state.modal);
  }
  state.modal = nextModal;
  renderApp2();
}
function replaceModal(nextModal) {
  state.modal = nextModal;
  renderApp2();
}
function popModal() {
  if (state.modalStack.length > 0) {
    state.modal = state.modalStack.pop();
  } else {
    state.modal = null;
  }
  window.scrollTo(0, state.modalScrollY || 0);
  renderApp2();
}
function clearModalStack() {
  state.modalStack = [];
  state.modal = null;
  renderApp2();
}
function isModalOpen() {
  return Boolean(state.modal);
}

// client/core/router.js
var _initialized = false;
function initRouter() {
  if (_initialized) return;
  _initialized = true;
  window.addEventListener("popstate", (event) => {
    if (isModalOpen()) {
      popModal();
      const currentRoute = state.route;
      history.pushState({ route: currentRoute, modal: false }, "", `#${currentRoute}`);
      renderApp2();
      return;
    }
    const route = _readHashRoute();
    if (route && route !== state.route) {
      _applyRoute(route, { pushState: false });
    }
  });
}
function navigateTo(routeId, options2 = {}) {
  const { clearModals = true, pushState = true } = options2;
  if (clearModals) {
    clearModalStack();
  }
  _applyRoute(routeId, { pushState });
}
function _readHashRoute() {
  const hash = window.location.hash.replace("#", "").trim();
  return routes.some((route) => route.id === hash) ? hash : "";
}
function _applyRoute(routeId, { pushState = true } = {}) {
  state.route = routeId;
  state.mobileNavOpen = false;
  state.loadingRoute = true;
  if (pushState && window.location.hash !== `#${routeId}`) {
    history.pushState({ route: routeId, modal: false }, "", `#${routeId}`);
  }
  renderApp2();
  requestAnimationFrame(() => {
    state.loadingRoute = false;
  });
}

// client/core/database.js
var hydrationPromise = null;
var sharedSyncTimer = null;
function initialize() {
  state.currentUserId = loadSession();
  state.route = _readHashRoute2() || "dashboard";
  state.initError = "";
  state.databaseReady = false;
  state.databaseHydrating = false;
  clearLegacyLocalDatabase();
  initRouter();
  if (state.currentUserId) {
    void hydrateDatabase();
  }
}
function ensureDatabaseReady() {
  return hydrateDatabase();
}
function ensureSharedDataSync() {
  if (state.currentUserId) {
    startSharedDataSync();
  }
}
async function hydrateDatabase() {
  if (state.databaseReady) {
    return state.database;
  }
  if (hydrationPromise) {
    return hydrationPromise;
  }
  state.databaseHydrating = true;
  hydrationPromise = loadDatabase().then(async (database) => {
    state.database = database;
    state.databaseReady = true;
    state.databaseHydrating = false;
    state.initError = "";
    await runPostHydrationTasks();
    ensureSharedDataSync();
    renderApp();
    return database;
  }).catch((error) => {
    console.error("Failed to hydrate application database:", error);
    state.databaseReady = false;
    state.databaseHydrating = false;
    state.initError = formatInitializationError(error);
    renderApp();
    throw error;
  }).finally(() => {
    hydrationPromise = null;
  });
  renderApp();
  return hydrationPromise;
}
async function runPostHydrationTasks() {
  if (!state.currentUserId) {
    return;
  }
  const [{ cleanupOrphanedNotifications }, { ensureVisibleRoute }] = await Promise.all([
    import("./notifications-6JRS6HE2.js"),
    import("./permissions-IJH7XE2W.js")
  ]);
  cleanupOrphanedNotifications();
  ensureVisibleRoute();
}
function formatInitializationError(error) {
  return error instanceof Error ? error.message : String(error);
}
async function loadDatabase() {
  const snapshot = await fetchDatabaseSnapshot();
  if (snapshot.database) {
    state.databaseVersion = Number(snapshot.version || 0);
    normalizeDatabaseRoles(snapshot.database);
    migrateProgressNodes(snapshot.database);
    return snapshot.database;
  }
  throw new Error("\u670D\u52A1\u5668\u672A\u8FD4\u56DE\u521D\u59CB\u5316\u6570\u636E\uFF0C\u8BF7\u68C0\u67E5\u672C\u5730\u670D\u52A1\u662F\u5426\u5DF2\u5B8C\u6210\u7AD9\u70B9\u521D\u59CB\u5316\u3002");
}
function normalizeDatabaseRoles(database) {
  if (!database || !Array.isArray(database.members)) {
    return;
  }
  for (const member of database.members) {
    const expectedRole = dictionaries.identityRoleMap[member.identity] || member.role;
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
    const progressComments = task.comments.filter((comment) => comment.title === "\u8FDB\u5EA6\u66F4\u65B0");
    for (const comment of progressComments) {
      const existing = task.progressNodes.some((node) => node.id === comment.id);
      if (!existing) {
        task.progressNodes.push({
          id: comment.id,
          taskId: task.id,
          percent: task.progressPercent || 0,
          note: comment.content || "",
          attachments: [],
          createdAt: comment.createdAt,
          authorId: comment.authorId
        });
      }
    }
  }
}
async function saveDatabase(database = state.database) {
  try {
    const savedSnapshot = await writeDatabaseSnapshot(database, state.databaseVersion);
    if (!savedSnapshot) {
      throw new Error("\u670D\u52A1\u5668\u8FD4\u56DE\u6570\u636E\u4E3A\u7A7A\uFF0C\u8BF7\u5237\u65B0\u9875\u9762\u540E\u91CD\u8BD5\u3002");
    }
    state.databaseVersion = savedSnapshot.version;
    return true;
  } catch (error) {
    await recoverFromPersistenceFailure(error);
    return false;
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
    normalizeDatabaseRoles(state.database);
    migrateProgressNodes(state.database);
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
  sharedSyncTimer = timer;
  setSharedSyncTimer(timer);
}
async function refreshDatabaseQuietly() {
  if (!state.currentUserId || !state.databaseReady || !state.database || state.initError || shouldPauseSharedSync()) {
    return;
  }
  try {
    const diffResult = await requestJson(`/api/database/diff?from_version=${state.databaseVersion}`);
    const serverVersion = Number(diffResult.version || 0);
    if (!serverVersion || serverVersion <= state.databaseVersion) {
      return;
    }
    if (diffResult.database) {
      state.database = diffResult.database;
      normalizeDatabaseRoles(state.database);
      migrateProgressNodes(state.database);
    } else if (diffResult.diff) {
      applyDiff(state.database, diffResult.diff);
    }
    state.databaseVersion = serverVersion;
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
    for (const id of changes.removed || []) {
      const index = list.findIndex((item) => item.id === id);
      if (index !== -1) {
        list.splice(index, 1);
      }
    }
    for (const item of changes.updated || []) {
      const existing = list.find((current) => current.id === item.id);
      if (existing) {
        Object.assign(existing, item);
      }
    }
    for (const item of changes.added || []) {
      if (!list.some((current) => current.id === item.id)) {
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
  return state.modal?.type === "task-form" || state.modal?.type === "task-detail" || state.modal?.type === "member-form" || state.modal?.type === "profile-content" || state.modal?.type === "registration-edit" || state.modal?.type === "sensitive-action" || state.modal?.type === "task-owner-reassign" || state.modal?.type === "registration-review" || state.modal?.type === "task-completion" || state.modal?.type === "progress-note-form" || state.modal?.type === "task-attachment-form";
}
async function recoverFromPersistenceFailure(error) {
  console.error("Failed to persist shared database:", error);
  const synchronized = await synchronizeDatabaseFromServer();
  if (error.status === 409) {
    pushFlash(
      synchronized ? "\u5171\u4EAB\u6570\u636E\u5DF2\u88AB\u5176\u4ED6\u8BBE\u5907\u66F4\u65B0\uFF0C\u5F53\u524D\u9875\u9762\u5DF2\u81EA\u52A8\u540C\u6B65\uFF0C\u8BF7\u91CD\u65B0\u6267\u884C\u521A\u624D\u64CD\u4F5C\u3002" : "\u5171\u4EAB\u6570\u636E\u5DF2\u88AB\u5176\u4ED6\u8BBE\u5907\u66F4\u65B0\uFF0C\u8BF7\u5237\u65B0\u9875\u9762\u540E\u91CD\u8BD5\u3002",
      "info"
    );
    return;
  }
  const message = error instanceof Error && error.message ? error.message : "\u672A\u77E5\u9519\u8BEF";
  pushFlash(
    synchronized ? `\u4FDD\u5B58\u5931\u8D25\uFF0C\u5DF2\u6062\u590D\u5230\u7535\u8111\u4E0A\u7684\u6700\u65B0\u6570\u636E\uFF1A${message}` : `\u4FDD\u5B58\u5931\u8D25\uFF1A${message}`,
    "info"
  );
}
function _readHashRoute2() {
  const hash = window.location.hash.replace("#", "").trim();
  const validRoutes = ["dashboard", "market", "myTasks", "taskManagement", "members", "projects", "rankings", "reviews", "profile", "settings"];
  return validRoutes.includes(hash) ? hash : "";
}

export {
  pushFlash,
  renderApp,
  saveSession,
  clearSession,
  pushModal,
  replaceModal,
  popModal,
  clearModalStack,
  navigateTo,
  initialize,
  ensureDatabaseReady,
  ensureSharedDataSync,
  saveDatabase,
  refreshDatabaseQuietly,
  getLoadedRouteChunk,
  loadRouteChunk,
  getLoadedModalChunk,
  loadModalChunk,
  renderApp2
};
