import {
  formatDateTime,
  getPendingApprovalCount
} from "./chunk-VDXRB7D4.js";
import "./chunk-FUTIGIGI.js";
import "./chunk-GTV4JDSP.js";
import {
  getLoadedModalChunk,
  getLoadedRouteChunk,
  loadModalChunk,
  loadRouteChunk,
  saveSession
} from "./chunk-PYCLTF52.js";
import {
  getNotificationsForCurrentUser,
  getUnreadNotificationCount
} from "./chunk-UOGRBFTX.js";
import {
  getSearchPlaceholder
} from "./chunk-4ZHULIGH.js";
import {
  canCreateTask,
  getCurrentMember,
  getCurrentUser,
  getInitials,
  getMemberById,
  getVisibleRoutes
} from "./chunk-RFGSPZ7J.js";
import {
  escapeAttribute,
  escapeHtml
} from "./chunk-UQLSNBUY.js";
import "./chunk-G7BQR5R5.js";
import "./chunk-AFQ47FFH.js";
import {
  appRoot,
  dictionaries,
  state
} from "./chunk-NDL62ULM.js";

// client/render/workspace-runtime.js
var notificationCache = { items: [], version: -1 };
function renderWorkspaceRoot(root = appRoot) {
  try {
    const user = getCurrentUser();
    if (!user) {
      state.currentUserId = null;
      saveSession(state.currentUserId);
      root.innerHTML = "";
      return;
    }
    root.innerHTML = renderWorkspace();
  } catch (error) {
    root.innerHTML = `
      <div style="padding:40px;color:#ff6666">
        <h2>\u5DE5\u4F5C\u53F0\u6E32\u67D3\u9519\u8BEF</h2>
        <pre style="white-space:pre-wrap">${escapeHtml(error.stack || error.message || String(error))}</pre>
      </div>
    `;
    console.error("workspace render error:", error);
  }
}
function renderWorkspace() {
  const member = getCurrentMember();
  const navItems = getVisibleRoutes();
  const pendingCount = getPendingApprovalCount();
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
          ${navItems.map((route) => {
    const suffix = route.id === "reviews" && pendingCount > 0 ? `<small>${pendingCount}</small>` : "";
    return `<button type="button" class="nav-item ${state.route === route.id ? "is-active" : ""}" data-action="navigate" data-route="${route.id}"><span>${route.label}</span>${suffix}</button>`;
  }).join("")}
        </div>
        <div class="sidebar-footer">
          <strong>${escapeHtml(member.name)}</strong>
          <span>${escapeHtml(dictionaries.identities[member.identity])} \xB7 ${escapeHtml(dictionaries.roles[member.role])}</span>
          <span class="helper-text">${escapeHtml(member.departments.join(" / "))}</span>
          <div class="button-row">
            <button class="button-secondary" type="button" data-action="navigate" data-route="profile">\u4E2A\u4EBA\u4E2D\u5FC3</button>
            <button class="button-ghost" type="button" data-action="logout">\u9000\u51FA</button>
          </div>
        </div>
      </aside>
      <div class="flash-toast ${state.flash ? "is-visible" : ""}" style="display:${state.flash ? "" : "none"}"><span class="flash-text">${escapeHtml(state.flash)}</span><button class="flash-close" type="button" data-action="dismiss-flash">\xD7</button></div>
      ${state.formLoading || state.loadingRoute ? `<div class="form-loading-bar"></div>` : ""}
      <main class="main-area">
        <div class="topbar">
          <div class="search-shell">
            <button class="button-ghost mobile-toggle" type="button" data-action="toggle-nav">\u83DC\u5355</button>
            <input type="text" placeholder="${escapeAttribute(getSearchPlaceholder())}" value="${escapeAttribute(state.globalSearch)}" data-global-search>
          </div>
          <div class="topbar-actions">
            <span class="topbar-chip">\u5F85\u5BA1\u6838 ${pendingCount}</span>
            <div class="notif-bell" style="position:relative">
              <button class="button-ghost" type="button" data-action="toggle-notif-panel" style="position:relative;padding:8px 12px;font-size:1.2rem">${renderNotifIcon()}</button>
              ${state.notifPanelOpen ? renderNotifPanel() : ""}
            </div>
            ${canCreateTask() ? '<button class="button-primary" type="button" data-action="open-create-task">\u65B0\u5EFA\u4EFB\u52A1</button>' : ""}
            <div class="profile-pill">
              <div class="avatar">${escapeHtml(getInitials(member.name))}</div>
              <div><strong>${escapeHtml(member.name)}</strong><div class="helper-text">${escapeHtml(dictionaries.roles[member.role])}</div></div>
            </div>
          </div>
        </div>
        <div class="page-content">${renderCurrentPage()}</div>
      </main>
      <div class="backdrop ${state.mobileNavOpen || state.modal ? "is-open" : ""}" data-action="close-overlay"></div>
      ${state.modal ? renderModal() : ""}
    </div>
  `;
}
function renderCurrentPage() {
  const routeId = state.route;
  const routeModule = getLoadedRouteChunk(routeId);
  if (!routeModule) {
    void loadRouteChunk(routeId);
    return renderPageLoadingState(routeId);
  }
  const renderRoute = resolveRouteRenderer(routeId, routeModule);
  if (!renderRoute) {
    console.error("Route chunk has no callable renderer:", routeId, routeModule);
    void loadRouteChunk(routeId);
    return renderPageLoadingState(routeId);
  }
  return renderRoute();
}
function renderPageLoadingState(routeId) {
  const currentRoute = getVisibleRoutes().find((route) => route.id === routeId);
  const label = currentRoute?.label || "\u5F53\u524D\u9875\u9762";
  return `
    <section>
      <div class="page-header">
        <div><h2>${escapeHtml(label)}</h2><p>\u9875\u9762\u4EE3\u7801\u5DF2\u4ECE\u9996\u5305\u4E2D\u62C6\u51FA\uFF0C\u5F53\u524D\u6B63\u5728\u6309\u9700\u52A0\u8F7D\u3002</p></div>
      </div>
      <section class="panel">
        <div class="empty-state">\u6B63\u5728\u52A0\u8F7D ${escapeHtml(label)} \u6A21\u5757\u2026</div>
      </section>
    </section>
  `;
}
function renderModal() {
  const modalType = state.modal?.type;
  if (!modalType) {
    return "";
  }
  const modalModule = getLoadedModalChunk(modalType);
  if (!modalModule) {
    void loadModalChunk(modalType);
    return `
      <div class="modal">
        <div class="modal-card glass-card">
          <div class="section-header">
            <div><h3>\u6B63\u5728\u52A0\u8F7D\u64CD\u4F5C\u9762\u677F</h3><p>\u5F53\u524D\u5F39\u7A97\u4EE3\u7801\u5DF2\u6539\u4E3A\u6309\u9700\u52A0\u8F7D\uFF0C\u8BF7\u7A0D\u5019\u3002</p></div>
            <button class="button-ghost" type="button" data-action="close-overlay">\u5173\u95ED</button>
          </div>
          <div class="empty-state">\u6B63\u5728\u52A0\u8F7D\u5F39\u7A97\u5185\u5BB9\u2026</div>
        </div>
      </div>
    `;
  }
  return modalModule.render(modalType);
}
function renderNotifIcon() {
  const unread = getUnreadNotificationCount();
  return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--text-soft);vertical-align:middle"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>${unread ? `<span style="position:absolute;top:-2px;right:-4px;min-width:16px;height:16px;border-radius:8px;background:var(--text-soft);color:#111;font-size:0.65rem;font-weight:700;display:inline-flex;align-items:center;justify-content:center;padding:0 4px">${unread > 99 ? "99+" : unread}</span>` : ""}`;
}
function computeNotifications() {
  if (!state.database) {
    return [];
  }
  if (state.databaseVersion === notificationCache.version) {
    return notificationCache.items;
  }
  notificationCache.items = getNotificationsForCurrentUser();
  notificationCache.version = state.databaseVersion;
  return notificationCache.items;
}
function renderNotifPanel() {
  const items = computeNotifications();
  const unreadCount = items.filter((item) => !item.read).length;
  return `
    <div class="notif-panel" style="position:absolute;top:100%;right:0;width:320px;max-width:calc(100vw - 48px);max-height:400px;overflow-y:auto;z-index:30;margin-top:4px;border-radius:16px;border:1px solid var(--line);background:rgba(20,20,22,0.98);backdrop-filter:blur(16px);box-shadow:0 16px 48px rgba(0,0,0,0.5);padding:12px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid var(--line)">
        <strong style="font-size:0.95rem">\u6211\u7684\u901A\u77E5${unreadCount ? ` (${unreadCount})` : ""}</strong>
        <button class="button-ghost" type="button" data-action="toggle-notif-panel" style="padding:4px 8px;font-size:0.8rem">\u5173\u95ED</button>
      </div>
      ${items.length ? items.map((item) => `
        <div style="padding:8px 6px;border-bottom:1px solid rgba(255,255,255,0.06);font-size:0.85rem;color:var(--text-soft);${item.read ? "opacity:0.5" : ""}">
          <div>${escapeHtml(item.text)}</div>
          <div style="font-size:0.75rem;color:var(--text-faint);margin-top:4px">${formatDateTime(item.createdAt)}</div>
        </div>
      `).join("") : '<div style="padding:20px;text-align:center;color:var(--text-faint);font-size:0.85rem">\u6682\u65E0\u8FD17\u5929\u901A\u77E5</div>'}
    </div>
  `;
}
function resolveRouteRenderer(routeId, routeModule) {
  if (!routeModule) {
    return null;
  }
  if (typeof routeModule.render === "function") {
    return routeModule.render;
  }
  if (typeof routeModule.default === "function") {
    return routeModule.default;
  }
  if (routeModule.default && typeof routeModule.default.render === "function") {
    return routeModule.default.render;
  }
  const exportName = routeRenderExportMap[routeId] || routeRenderExportMap.dashboard;
  if (typeof routeModule[exportName] === "function") {
    return routeModule[exportName];
  }
  const firstFunction = Object.values(routeModule).find((value) => typeof value === "function");
  return typeof firstFunction === "function" ? firstFunction : null;
}
var routeRenderExportMap = {
  dashboard: "renderDashboardPage",
  market: "renderMarketPage",
  myTasks: "renderMyTasksPage",
  taskManagement: "renderTaskManagementPage",
  members: "renderMembersPage",
  projects: "renderProjectsPage",
  rankings: "renderRankingsPage",
  reviews: "renderReviewsPage",
  profile: "renderProfilePage",
  settings: "renderSettingsPage"
};
export {
  getMemberById,
  renderNotifIcon,
  renderNotifPanel,
  renderWorkspaceRoot
};
